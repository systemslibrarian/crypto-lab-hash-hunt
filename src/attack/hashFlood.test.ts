import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ATTACKER_KEYS, TABLE_SIZE, compareFlood, countLinearProbes, makeFloodKeys, publicBucket } from './hashFlood';

describe('hash table flooding', () => {
  it('finds distinct attacker keys colliding under the public mapping', () => {
    const { keys, candidates, target } = makeFloodKeys();
    expect(keys).toHaveLength(ATTACKER_KEYS);
    expect(new Set(keys).size).toBe(keys.length);
    expect(candidates).toBeGreaterThan(ATTACKER_KEYS);
    for (const key of keys) expect(publicBucket(key)).toBe(target);
  });

  it('counts actual linear-probing slot visits, including wraparound', () => {
    expect(countLinearProbes(['a', 'b', 'c'], [3, 3, 3], 4).perInsert).toEqual([1, 2, 3]);
    expect(countLinearProbes(['a', 'b', 'c'], [3, 3, 3], 4).total).toBe(6);
    expect(countLinearProbes(['a', 'b', 'c'], [0, 1, 2], 4).total).toBe(3);
    expect(() => countLinearProbes(['a'], [4], 4)).toThrow(RangeError);
  });

  it('uses HMAC with a secret key, checking reported starts against Node independently', async () => {
    const secret = new Uint8Array(32).fill(0x5a);
    const comparison = await compareFlood(secret);
    expect(comparison.unkeyed.total).toBe((ATTACKER_KEYS * (ATTACKER_KEYS + 1)) / 2);
    expect(comparison.unkeyed.maximum).toBe(ATTACKER_KEYS);
    expect(comparison.keyed.total).toBeLessThan(comparison.unkeyed.total);
    expect(comparison.keyedStarts).toHaveLength(ATTACKER_KEYS);
    for (let i = 0; i < comparison.keys.length; i++) {
      const digest = createHmac('sha256', secret).update(comparison.keys[i]).digest();
      expect(comparison.keyedStarts[i]).toBe(digest.readUInt32BE(0) % TABLE_SIZE);
    }
  });
});
