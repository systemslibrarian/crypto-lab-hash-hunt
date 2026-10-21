import { fullHash, hash, truncate } from '../hash/truncate';

export type ToyTag = 'h1' | 'h2';
export type H2Mode = 'iterated' | 'whole';
export type Digest = (encoded: string, bits: number) => number;

const directDigest: Digest = (encoded, bits) => truncate(fullHash(encoded), bits);

function checkBits(bits: number): void {
  if (!Number.isInteger(bits) || bits < 1 || bits > 24) {
    throw new Error('Toy Merkle–Damgård output must use 1–24 bits');
  }
}

export function lengthBlock(blockCount: number): string {
  if (!Number.isInteger(blockCount) || blockCount < 0) {
    throw new Error('Block count must be a non-negative integer');
  }
  return `PB:${blockCount}`;
}

/**
 * The teaching compression function from the extension brief.
 *
 * @noble/hashes owns SHA-256 through fullHash; this module owns the visible
 * Merkle–Damgård iteration and its final length block.
 */
export function toyCompress(
  tag: ToyTag,
  chainingValue: number,
  block: string,
  bits: number,
  digest: Digest = directDigest,
): number {
  checkBits(bits);
  if (!Number.isInteger(chainingValue) || chainingValue < 0 || chainingValue >= 2 ** bits) {
    throw new Error(`Chaining value must fit in ${bits} bits`);
  }
  return digest(`${tag}|${chainingValue}|${block}`, bits);
}

/** Honest length-strengthened MD: every message gets one final PB:blockCount. */
export function toyMd(
  blocks: string[],
  bits: number,
  tag: ToyTag,
  digest: Digest = directDigest,
): number {
  checkBits(bits);
  let chainingValue = 0;
  for (const block of blocks) {
    chainingValue = toyCompress(tag, chainingValue, block, bits, digest);
  }
  return toyCompress(tag, chainingValue, lengthBlock(blocks.length), bits, digest);
}

/** Unambiguous serialization for the non-iterated H2 control. */
export function serializeBlocks(blocks: string[]): string {
  const encoder = new TextEncoder();
  return blocks.map((block) => `${encoder.encode(block).length}:${block}`).join('|');
}

export function h2Hash(
  blocks: string[],
  bits: number,
  mode: H2Mode,
  digest?: Digest,
): number {
  if (mode === 'iterated') return toyMd(blocks, bits, 'h2', digest);
  checkBits(bits);
  const encoded = serializeBlocks(blocks);
  return digest ? digest(encoded, bits) : hash(encoded, bits);
}

