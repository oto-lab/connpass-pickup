import browser from "webextension-polyfill";
import { shuffle } from "./shuffle.js";
import { buildResultHtml } from "./render-result.js";
import type { Participants } from "./scrape.js";
import type { ScrapeRequestMessage, ScrapeResponseMessage } from "./content.js";

const rootElement = document.getElementById("connpass-pickup-root");
if (!rootElement) throw new Error("popup root element not found");
const root: HTMLElement = rootElement;

function renderMessage(text: string): void {
  root.innerHTML = "";
  const message = document.createElement("p");
  message.className = "connpass-pickup-message";
  message.textContent = text;
  root.append(message);
}

function createPanel(
  eventId: string,
  participants: Participants
): HTMLDivElement {
  const panel = document.createElement("div");

  const title = document.createElement("h2");
  title.textContent = "connpass pickup";
  panel.append(title);

  const roleCheckboxes: HTMLInputElement[] = [];

  for (const role of Object.keys(participants)) {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = role;
    label.append(
      checkbox,
      document.createTextNode(` ${role} (${participants[role].length}人)`)
    );
    panel.append(label);
    roleCheckboxes.push(checkbox);
  }

  const dedupeLabel = document.createElement("label");
  const dedupeCheckbox = document.createElement("input");
  dedupeCheckbox.type = "checkbox";
  dedupeCheckbox.checked = true;
  dedupeLabel.append(
    dedupeCheckbox,
    document.createTextNode(" 重複を削除する")
  );
  panel.append(dedupeLabel);

  const additionalInput = document.createElement("input");
  additionalInput.type = "text";
  additionalInput.placeholder = "追加参加者をカンマ区切りで入力";
  panel.append(additionalInput);

  const shuffleButton = document.createElement("button");
  shuffleButton.type = "button";
  shuffleButton.textContent = "シャッフル";
  panel.append(shuffleButton);

  const resultList = document.createElement("ol");
  panel.append(resultList);

  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.textContent = "コピー";
  copyButton.hidden = true;
  panel.append(copyButton);

  const downloadButton = document.createElement("button");
  downloadButton.type = "button";
  downloadButton.textContent = "HTMLでダウンロード";
  downloadButton.hidden = true;
  panel.append(downloadButton);

  let currentMembers: string[] = [];

  shuffleButton.addEventListener("click", () => {
    const selectedRoles = roleCheckboxes
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value);

    let members: string[] = [];
    if (dedupeCheckbox.checked) {
      const memberSet = new Set<string>();
      for (const role of selectedRoles) {
        for (const member of participants[role] ?? []) memberSet.add(member);
      }
      members = [...memberSet];
    } else {
      for (const role of selectedRoles) {
        members.push(...(participants[role] ?? []));
      }
    }

    const additional = additionalInput.value
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name);
    members.push(...additional);

    currentMembers = shuffle(members);

    resultList.innerHTML = "";
    for (const member of currentMembers) {
      const li = document.createElement("li");
      li.textContent = member;
      resultList.append(li);
    }

    const hasResult = currentMembers.length > 0;
    copyButton.hidden = !hasResult;
    downloadButton.hidden = !hasResult;
  });

  copyButton.addEventListener("click", async () => {
    const text = currentMembers
      .map((member, index) => `${index + 1}. ${member}`)
      .join("\n");
    await navigator.clipboard.writeText(text);
  });

  downloadButton.addEventListener("click", () => {
    const html = buildResultHtml(eventId, currentMembers);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${eventId}_${Date.now()}.html`;
    anchor.click();
    URL.revokeObjectURL(url);
  });

  const footer = document.createElement("div");
  footer.className = "connpass-pickup-footer";
  footer.textContent = `connpass pickup v${browser.runtime.getManifest().version}`;
  panel.append(footer);

  return panel;
}

async function main(): Promise<void> {
  renderMessage("読み込み中...");

  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    renderMessage("対象のタブが見つかりませんでした。");
    return;
  }

  let response: ScrapeResponseMessage;
  try {
    const request: ScrapeRequestMessage = { type: "connpass-pickup/scrape" };
    response = (await browser.tabs.sendMessage(
      tab.id,
      request
    )) as ScrapeResponseMessage;
  } catch {
    renderMessage(
      "connpassの参加者一覧ページ(https://connpass.com/event/[id]/participation/)を開いた状態でクリックしてください。"
    );
    return;
  }

  if (Object.keys(response.participants).length === 0) {
    renderMessage("参加者が見つかりませんでした。");
    return;
  }

  root.innerHTML = "";
  root.append(createPanel(response.eventId, response.participants));
}

main();
