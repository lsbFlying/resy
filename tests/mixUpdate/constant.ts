/** Permutation and combination */
export function permute(input: number[]) {
  const permArr: number[][] = [],
    usedChars: number[] = [];
  function permuteHelper(input: number[]) {
    for (let i = 0; i < input.length; i++) {
      const ch = input.splice(i, 1)[0];
      usedChars.push(ch);
      if (input.length === 0) {
        permArr.push(usedChars.slice());
      }
      permuteHelper(input);
      input.splice(i, 0, ch);
      usedChars.pop();
    }
  }
  permuteHelper(input);
  return permArr;
}
export const eventLoop = ["sync", "promise", "setTimeout"];
/**
 * Because direct and setState are a coordinated batch processing mechanism shared internally by Resy,
 * it is necessary to observe both situations where syncUpdate is not included in batch testing
 * and when it is included in batch testing
 */
export const mixMethodsNoSyncUpdate = ["direct", "setState", "setState"];
export const mixMethods = ["direct", "setState", "syncUpdate"];
export const combinations = permute([0, 1, 2]);
