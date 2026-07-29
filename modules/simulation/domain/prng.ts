const UINT32_RANGE = 4_294_967_296;

export const SIMULATION_ENGINE_VERSION = 1;

export function createDeterministicRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / UINT32_RANGE;
  };
}

export function mixSeed(...values: readonly number[]): number {
  let mixed = 0x811c9dc5;
  for (const value of values) {
    mixed ^= value >>> 0;
    mixed = Math.imul(mixed, 0x01000193) >>> 0;
  }
  return mixed;
}
