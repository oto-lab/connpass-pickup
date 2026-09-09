import { describe, expect, it } from "vitest";
import { shuffle } from "./shuffle.js";

describe("shuffle", () => {
  it("要素数を変えずに同じ要素だけを含む配列を返す", () => {
    const input = ["a", "b", "c", "d", "e"];
    const result = shuffle(input);
    expect(result).toHaveLength(input.length);
    expect([...result].sort()).toEqual([...input].sort());
  });

  it("引数の配列を書き換えない", () => {
    const input = ["a", "b", "c"];
    const copy = [...input];
    shuffle(input);
    expect(input).toEqual(copy);
  });

  it("空配列を渡しても空配列を返す", () => {
    expect(shuffle([])).toEqual([]);
  });
});
