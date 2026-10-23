/** Bounded hash-table flooding experiment; not a collision attack on SHA-256. */
const encoder = new TextEncoder();
export const TABLE_SIZE = 128;
export const ATTACKER_KEYS = 24;

/** Deliberately exposed, unkeyed FNV-1a bucket mapping on UTF-8 bytes. */
export function publicBucket(input: string, size = TABLE_SIZE): number {
  if (!Number.isInteger(size) || size < 2) throw new RangeError('table size must be at least two');
  let hash = 0x811c9dc5;
  for (const byte of encoder.encode(input)) hash = Math.imul(hash ^ byte, 0x01000193) >>> 0;
  return hash % size;
}

/** Find distinct keys with the same public bucket by local candidate search. */
export function makeFloodKeys(count = ATTACKER_KEYS, size = TABLE_SIZE): { keys: string[]; candidates: number; target: number } {
  if (!Number.isInteger(count) || count < 1 || count > size) throw new RangeError('invalid attack size');
  const target = publicBucket('untrusted-record:0', size);
  const keys: string[] = [];
  let candidates = 0;
  for (; candidates < 100_000 && keys.length < count; candidates++) {
    const input = `untrusted-record:${candidates}`;
    if (publicBucket(input, size) === target) keys.push(input);
  }
  if (keys.length !== count) throw new Error('bounded candidate search found too few keys');
  return { keys, candidates, target };
}

export interface ProbeResult {
  readonly total: number;
  readonly maximum: number;
  readonly perInsert: readonly number[];
}

/** Count slot inspections for linear probing, including the empty final slot. */
export function countLinearProbes(keys: readonly string[], starts: readonly number[], size = TABLE_SIZE): ProbeResult {
  if (keys.length !== starts.length || keys.length > size) throw new RangeError('invalid table inputs');
  const slots = new Set<number>();
  const perInsert = keys.map((_, index) => {
    const start = starts[index];
    if (!Number.isInteger(start) || start < 0 || start >= size) throw new RangeError('invalid bucket');
    for (let probes = 1; probes <= size; probes++) {
      const slot = (start + probes - 1) % size;
      if (!slots.has(slot)) {
        slots.add(slot);
        return probes;
      }
    }
    throw new Error('table is full');
  });
  return { total: perInsert.reduce((sum, probes) => sum + probes, 0), maximum: Math.max(...perInsert), perInsert };
}

/** HMAC-SHA-256 is a real keyed comparator, not a claim to implement SipHash. */
export async function keyedBucket(input: string, key: CryptoKey, size = TABLE_SIZE): Promise<number> {
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(input)));
  const prefix = new DataView(mac.buffer, mac.byteOffset, 4).getUint32(0, false);
  return prefix % size;
}

export async function compareFlood(secret: Uint8Array): Promise<{
  readonly keys: readonly string[];
  readonly candidates: number;
  readonly publicStart: number;
  readonly unkeyed: ProbeResult;
  readonly keyed: ProbeResult;
  readonly keyedStarts: readonly number[];
}> {
  if (secret.length !== 32) throw new RangeError('use a 32-byte experiment key');
  const { keys, candidates, target } = makeFloodKeys();
  const key = await crypto.subtle.importKey('raw', secret as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const keyedStarts = await Promise.all(keys.map((input) => keyedBucket(input, key)));
  return {
    keys,
    candidates,
    publicStart: target,
    unkeyed: countLinearProbes(keys, keys.map((input) => publicBucket(input))),
    keyed: countLinearProbes(keys, keyedStarts),
    keyedStarts,
  };
}
