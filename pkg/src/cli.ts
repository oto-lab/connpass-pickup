#!/usr/bin/env node
import { render } from "oh-my-logo";
import { isPackageLatest } from "is-package-latest";
import ansis from "ansis";
import prompts from "prompts";
import { exec } from "node:child_process";
import util from "node:util";

import pkg from "../package.json" with { type: "json" };
import { ConnpassClient, type ConnpassClientOptions } from "./client.js";

function envNumber(name: string): number | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

/**
 * connpassへのアクセス設定を環境変数から読み取り、CLI全体で使い回す {@link ConnpassClient} を組み立てる。
 * `CONNPASS_PICKUP_USER_AGENT` / `CONNPASS_PICKUP_PROXY` / `CONNPASS_PICKUP_RETRY` / `CONNPASS_PICKUP_TIMEOUT` のいずれも未設定なら省略され、各機能の既定動作になる。
 */
function createClientFromEnv(): ConnpassClient {
  const options: ConnpassClientOptions = {
    userAgent: process.env.CONNPASS_PICKUP_USER_AGENT,
    proxy: process.env.CONNPASS_PICKUP_PROXY,
    retry: envNumber("CONNPASS_PICKUP_RETRY"),
    timeout: envNumber("CONNPASS_PICKUP_TIMEOUT"),
  };
  return new ConnpassClient(options);
}

const currentVersion = pkg.version;
const packageName = pkg.name;

async function checkVersion(): Promise<void> {
  try {
    const res = await isPackageLatest(pkg);

    if (!res.isLatest) {
      console.log(
        ansis.yellow(
          `[Notice] 新しいバージョンが利用可能です！: ${ansis.gray(
            currentVersion
          )} --> ${ansis.green(res.latestVersion)}`
        )
      );
      console.log(
        ansis.yellow(
          `更新コマンド: ${ansis.cyan(`npm install -g ${packageName}@latest`)}\n`
        )
      );

      const { shouldUpdate } = await prompts({
        type: "confirm",
        name: "shouldUpdate",
        message: "パッケージを更新しますか？",
        initial: true,
      });

      if (shouldUpdate) {
        console.log(ansis.cyan("\nパッケージを更新しています..."));

        const execPromise = util.promisify(exec);
        const command = `npm install -g ${packageName}@latest`;

        try {
          await execPromise(command);
          console.log(ansis.green("完了しました！"));
          console.log(
            ansis.yellow(
              "再度コマンドを実行して、新しいバージョンをご利用ください"
            )
          );
        } catch (error) {
          console.error(ansis.red("失敗しました"));
          console.error(error);
          console.log(ansis.yellow("以下のコマンドを実行してください:"));
          console.log(ansis.cyan(`npm install -g ${packageName}@latest`));
        }
        process.exit(0);
      }
    }
  } catch (e) {
    console.error("バージョンチェックに失敗しました:", (e as Error).message);
  }
}

async function main(): Promise<void> {
  try {
    console.log(`${packageName}@${currentVersion}\n`);

    const logo = await render("CONNPASS\nPICKUP", {
      palette: "sunset",
      direction: "horizontal",
    });
    console.log(logo, "\n");

    console.log("\n--- 免責事項 ---");
    console.log(
      ansis.yellow("本ツール(以下、ツール)は実験目的で作成・公開されました。")
    );
    console.log(ansis.yellow("ツールの使用を推奨しません。"));
    console.log(
      ansis.yellow(
        "ツールを使用して発生した損害に関しては一切責任を負いません。\n"
      )
    );

    await checkVersion();

    const client = createClientFromEnv();

    let eventId: string;
    const argEventId = process.argv[2];
    if (argEventId) {
      eventId = argEventId;
    } else {
      const { event } = await prompts({
        type: "text",
        name: "event",
        message:
          "connpassのeventURLまたはeventIdを入力してください(eventId: https://connpass.com/event/[id]/ の[id]の部分):",
        validate: (input: string) => (input ? true : "この項目は必須です"),
      });
      if (!event) {
        console.log("\n処理がキャンセルされました");
        return process.exit(1);
      }
      eventId = event;
    }

    const matchEventId = eventId.match(
      /https?:\/\/.*?connpass\.com\/event\/(\d+)/
    );
    eventId = matchEventId ? matchEventId[1] : eventId;
    console.log(`\neventId: ${eventId}`);
    console.log("参加者情報を取得中...");

    const { participants, roles } =
      await client.fetchParticipantsDetailed(eventId);

    console.log("\n--- 取得完了 ---");
    console.log(participants);

    const truncatedRoles = roles.filter((role) => role.truncated);
    if (truncatedRoles.length > 0) {
      console.log(
        ansis.yellow(
          "\n[Notice] ページ数上限に達したため、以下の枠は一部の参加者しか取得できていません(CONNPASS_PICKUP環境変数やfetchParticipantsDetailedのmaxPagesPerRoleで調整できます):"
        )
      );
      for (const role of truncatedRoles) {
        console.log(
          ansis.yellow(
            `  - ${role.role}: ${role.fetchedCount}/${role.totalCount}人`
          )
        );
      }
    }

    const availableRoles = Object.keys(participants);
    if (availableRoles.length === 0) {
      console.log("\n参加者が見つかりませんでした");
      return process.exit(0);
    }

    const answers = await prompts([
      {
        type: "multiselect",
        name: "selectedRoles",
        message: "対象の参加枠を選択してください(スペースで選択、Enterで確定):",
        choices: availableRoles.map((role) => ({ title: role, value: role })),
        min: 1,
      },
      {
        type: "confirm",
        name: "allowDuplicates",
        message: "抽選リストの重複を削除しますか？(同じ人が複数枠にいる場合)",
        initial: true,
      },
      {
        type: "confirm",
        name: "saveHtml",
        message: "結果をHTMLファイルで保存・表示しますか？",
        initial: true,
      },
      {
        type: "text",
        name: "additionalMembers",
        message:
          "追加参加者をカンマ(,)区切りで入力してください(Enterでスキップ):",
      },
    ]);

    if (!answers.selectedRoles || answers.selectedRoles.length === 0) {
      console.log("\n処理がキャンセルされました");
      return process.exit(1);
    }

    let members: string[] = [];
    if (answers.allowDuplicates) {
      const memberSet = new Set<string>();
      for (const role of answers.selectedRoles as string[]) {
        for (const member of participants[role] ?? []) {
          memberSet.add(member);
        }
      }
      members = [...memberSet];
    } else {
      for (const role of answers.selectedRoles as string[]) {
        members.push(...(participants[role] ?? []));
      }
    }

    if (answers.additionalMembers) {
      const additional = (answers.additionalMembers as string)
        .split(",")
        .map((name) => name.trim())
        .filter((name) => name);
      members.push(...additional);
    }

    if (members.length === 0) {
      console.log("\n参加者がいないので処理を終了します");
      return process.exit(0);
    }

    const shuffled = client.shuffle(members);

    console.log("\n--- 順番 ---");
    shuffled.forEach((member, index) => {
      console.log(`${index + 1}. ${member}`);
    });

    if (answers.saveHtml) {
      const markdown = client.buildResultMarkdown(eventId, shuffled);
      const html = await client.renderResultHtml(markdown);
      const filePath = await client.saveResult(eventId, html, "html");
      await client.openResult(filePath);
      console.log(`\nブラウザで結果を表示します: ${filePath}`);
    }
  } catch (e) {
    if ((e as { isTtyError?: boolean }).isTtyError) {
      console.log("\n処理がキャンセルされました");
    } else {
      console.error("\nエラー:", (e as Error).message);
      console.log("処理がキャンセルされました");
    }
    return process.exit(1);
  }

  process.exit(0);
}

main();
