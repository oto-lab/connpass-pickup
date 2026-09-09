/**
 * connpass が公開している .ics ファイルから最低限必要な項目だけを読み取る、
 * 自前実装の最小限 ics パーサ(外部の ical ライブラリには依存しない)。
 */
export interface IcsEvent {
  summary?: string;
  description?: string;
  location?: string;
  url?: string;
  startedAt?: Date;
  endedAt?: Date;
}

// RFC5545の折り返し(line folding)を戻す: 行頭が空白/タブの行は前の行の続き
function unfoldLines(ics: string): string[] {
  const rawLines = ics.split(/\r\n|\n|\r/);
  const lines: string[] = [];
  for (const line of rawLines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }
  return lines;
}

// バックスラッシュエスケープ(\, \; \\ \n)を元に戻す
function unescapeIcsText(value: string): string {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

// "20260425T003000Z" のような UTC 日時文字列を Date に変換する
function parseIcsDateTime(value: string): Date | undefined {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  if (!match) return undefined;

  const [, year, month, day, hour, minute, second] = match;
  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    )
  );
}

/**
 * .ics ファイルの内容から最初の VEVENT を読み取る。
 */
export function parseIcsEvent(ics: string): IcsEvent {
  const lines = unfoldLines(ics);
  const event: IcsEvent = {};

  for (const line of lines) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;

    // "DTSTART;TZID=..." のようなパラメータ部分を除いたプロパティ名を取る
    const rawKey = line.slice(0, separatorIndex);
    const key = rawKey.split(";")[0].toUpperCase();
    const rawValue = line.slice(separatorIndex + 1);

    switch (key) {
      case "SUMMARY":
        event.summary = unescapeIcsText(rawValue);
        break;
      case "DESCRIPTION":
        event.description = unescapeIcsText(rawValue);
        break;
      case "LOCATION":
        event.location = unescapeIcsText(rawValue);
        break;
      case "URL":
        event.url = unescapeIcsText(rawValue);
        break;
      case "DTSTART":
        event.startedAt = parseIcsDateTime(rawValue);
        break;
      case "DTEND":
        event.endedAt = parseIcsDateTime(rawValue);
        break;
    }
  }

  return event;
}
