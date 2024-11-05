export type EncodedBlock = {
  data: Uint8Array;
  ids: number[];
  totalSources: number;
};

/**
 * Runs bitwise xor on each corresponding value in the two provided arrays,
 * updating the first array in-place.
 */
export function xor(inplace: Uint8Array, other: Uint8Array) {
  const minLength = Math.min(inplace.length, other.length);
  for (let i = 0; i < minLength; i++) {
    inplace[i] ^= other[i];
  }
}
