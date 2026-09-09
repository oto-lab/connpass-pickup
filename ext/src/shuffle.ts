/**
 * Fisher-Yates で配列をシャッフルする。引数の配列は書き換えず、シャッフル後の新しい配列を返す。pkg 側の同名ロジックとは独立した実装(拡張機能単体で完結させるため)。
 */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
