/**
 * シャッフル結果をダウンロード用のHTML文字列に変換する。
 * pkg側と違いmarkdown-itには依存せず、拡張機能単体で完結する簡易テンプレート。
 */
export function buildResultHtml(eventId: string, members: string[]): string {
  const items = members
    .map((member) => `<li>${escapeHtml(member)}</li>`)
    .join("\n");

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <title>connpass pickup result</title>
    <style>
      body { font-family: "Segoe UI", Meiryo, sans-serif; padding: 20px; }
      ol { padding-left: 40px; }
      li { font-size: 1.5rem; }
    </style>
  </head>
  <body>
    <h1>順番</h1>
    <p><a href="https://connpass.com/event/${eventId}" target="_blank">Event URL</a></p>
    <ol>
${items}
    </ol>
  </body>
</html>
`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
