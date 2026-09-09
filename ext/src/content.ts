import browser from "webextension-polyfill";
import { scrapeParticipants } from "./scrape.js";
import { shuffle } from "./shuffle.js";
import { buildResultHtml } from "./render-result.js";

const TOGGLE_ID = "connpass-pickup-toggle";
const PANEL_ID = "connpass-pickup-panel";

function createToggleButton(): HTMLButtonElement {
  const button = document.createElement("button");
  button.id = TOGGLE_ID;
  button.type = "button";
  button.textContent = "順番決め";
  return button;
}

function createPanel(participants: Record<string, string[]>): HTMLDivElement {
  const panel = document.createElement("div");
  panel.id = PANEL_ID;

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
  const eventId = extractEventIdFromLocation();

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

function extractEventIdFromLocation(): string {
  const match = location.pathname.match(/\/event\/(\d+)\//);
  return match ? match[1] : "";
}

function main(): void {
  const participants = scrapeParticipants(document);
  if (Object.keys(participants).length === 0) return;

  const panel = createPanel(participants);
  panel.hidden = true;

  const toggle = createToggleButton();
  toggle.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
  });

  document.body.append(toggle, panel);
}

main();
