import { shuffle as ransuShuffle } from "ransu";

/**
 * 配列をシャッフルする。引数の配列は書き換えず、シャッフル後の新しい配列を返す(Fisher-Yates、`ransu` 実装)。
 */
export function shuffle<T>(items: readonly T[]): T[] {
  return ransuShuffle(items);
}
