import { floydMap } from './floyd';
import { birthday } from '../math/birthday';
import { calibrate, counted, randomHex } from '../hash/truncate';
import {
  h2Hash,
  lengthBlock,
  toyCompress,
  toyMd,
  type Digest,
  type H2Mode,
} from '../md/toyMd';

export const ENUMERATION_CAP = 4096;
export const MAX_FORKS = 16;
const SEARCH_CAP = 2_000_000;
const SEARCH_MS = 15_000;

export interface JouxFork {
  stage: number;
  inputCv: number;
  left: string;
  right: string;
  nextCv: number;
  calls: number;
}

export interface MulticollisionChain {
  bits: number;
  forks: JouxFork[];
  finalCv: number;
  paddingBlock: string;
  h1Digest: number;
  stageCalls: number[];
  paddingCalls: number;
  h1Calls: number;
}

export interface EnumeratedMessage {
  mask: number;
  blocks: string[];
}

export interface Enumeration {
  totalCount: number;
  complete: boolean;
  messages: EnumeratedMessage[];
}

export interface CascadePair {
  a: EnumeratedMessage;
  b: EnumeratedMessage;
  h1: number;
  h2: number;
}

export interface NaiveComparison {
  kind: 'measured' | 'extrapolated';
  expectedEvaluations: number;
  expectedCalls: number;
  measuredEvaluations: number | null;
  measuredCalls: number | null;
  calibratedRate: number;
  extrapolatedSeconds: number;
}

export interface CascadeResult {
  chain: MulticollisionChain;
  mode: H2Mode;
  pair: CascadePair | null;
  candidateCount: number;
  candidateLimit: number;
  predictedProbability: number;
  h2Calls: number;
  totalCalls: number;
  naive: NaiveComparison;
}

type Progress = (value: unknown) => void;

function checkConfig(bits: number, forks: number): void {
  if (!Number.isInteger(bits) || bits < 1 || bits > 24) {
    throw new Error('Choose an output width from 1 through 24 bits');
  }
  if (!Number.isInteger(forks) || forks < 1 || forks > MAX_FORKS) {
    throw new Error(`Choose 1 through ${MAX_FORKS} forks`);
  }
}

function digestFor(meter: ReturnType<typeof counted>, bits: number): Digest {
  return (encoded, requestedBits) => {
    if (requestedBits !== bits) throw new Error('One counter cannot mix output widths');
    return meter.h(encoded);
  };
}

function buildChain(
  bits: number,
  forkCount: number,
  meter: ReturnType<typeof counted>,
  progress: Progress,
): MulticollisionChain {
  checkConfig(bits, forkCount);
  const digest = digestFor(meter, bits);
  const forks: JouxFork[] = [];
  let chainingValue = 0;

  for (let index = 0; index < forkCount; index += 1) {
    const before = meter.count;
    const inputCv = chainingValue;
    const start = `seed:${index + 1}:${randomHex()}`;
    const collision = floydMap(
      (block) => `blk:${toyCompress('h1', inputCv, block, bits, digest)}`,
      start,
      SEARCH_CAP,
    );
    const leftCv = toyCompress('h1', inputCv, collision.left, bits, digest);
    const rightCv = toyCompress('h1', inputCv, collision.right, bits, digest);
    if (collision.left === collision.right || leftCv !== rightCv) {
      throw new Error(`Fork ${index + 1} failed its collision invariant`);
    }
    const nextCv = leftCv;
    forks.push({
      stage: index + 1,
      inputCv,
      left: collision.left,
      right: collision.right,
      nextCv,
      calls: meter.count - before,
    });
    chainingValue = nextCv;
    progress({ phase: 'forks', complete: index + 1, total: forkCount, calls: meter.count, fork: forks.at(-1) });
  }

  const beforePadding = meter.count;
  const paddingBlock = lengthBlock(forkCount);
  const h1Digest = toyCompress('h1', chainingValue, paddingBlock, bits, digest);
  const paddingCalls = meter.count - beforePadding;
  const stageCalls = forks.map((fork) => fork.calls);
  return {
    bits,
    forks,
    finalCv: chainingValue,
    paddingBlock,
    h1Digest,
    stageCalls,
    paddingCalls,
    h1Calls: stageCalls.reduce((sum, calls) => sum + calls, 0) + paddingCalls,
  };
}

export function chainCollisions(
  bits: number,
  forkCount: number,
  progress: Progress = () => {},
): MulticollisionChain {
  const meter = counted(bits, SEARCH_CAP, SEARCH_MS, (calls) =>
    progress({ phase: 'hashing', calls }),
  );
  return buildChain(bits, forkCount, meter, progress);
}

export function blocksForMask(forks: JouxFork[], mask: number): string[] {
  if (!Number.isInteger(mask) || mask < 0 || mask >= 2 ** forks.length) {
    throw new Error('Message mask is outside this fork set');
  }
  return forks.map((fork, index) => ((mask >> index) & 1 ? fork.right : fork.left));
}

function sampleMasks(total: number, cap: number): number[] {
  if (total <= cap) return Array.from({ length: total }, (_, mask) => mask);
  const masks = new Set<number>();
  for (let index = 0; index < cap; index += 1) {
    masks.add(Math.floor((index * (total - 1)) / (cap - 1)));
  }
  return [...masks];
}

export function enumerateMulticollision(
  chain: MulticollisionChain,
  cap = ENUMERATION_CAP,
): Enumeration {
  if (!Number.isInteger(cap) || cap < 2) throw new Error('Enumeration cap must be at least 2');
  const totalCount = 2 ** chain.forks.length;
  const masks = sampleMasks(totalCount, cap);
  return {
    totalCount,
    complete: masks.length === totalCount,
    messages: masks.map((mask) => ({ mask, blocks: blocksForMask(chain.forks, mask) })),
  };
}

function naiveDigest(
  message: string,
  bits: number,
  mode: H2Mode,
  digest: Digest,
): string {
  const blocks = [message];
  return `${toyMd(blocks, bits, 'h1', digest)}:${h2Hash(blocks, bits, mode, digest)}`;
}

function naiveComparison(bits: number, mode: H2Mode): NaiveComparison {
  const calibratedRate = calibrate().rate;
  const expectedEvaluations = Math.sqrt(Math.PI / 2) * 2 ** ((bits + bits) / 2);
  const callsPerEvaluation = mode === 'iterated' ? 4 : 3;
  const expectedCalls = expectedEvaluations * callsPerEvaluation;
  const base = {
    expectedEvaluations,
    expectedCalls,
    calibratedRate,
    extrapolatedSeconds: expectedCalls / calibratedRate,
  };
  if (expectedCalls > SEARCH_CAP) {
    return { kind: 'extrapolated', ...base, measuredEvaluations: null, measuredCalls: null };
  }

  const meter = counted(bits, SEARCH_CAP, SEARCH_MS);
  const digest = digestFor(meter, bits);
  const seen = new Map<string, string>();
  const prefix = randomHex();
  try {
    for (let index = 0; ; index += 1) {
      const message = `naive:${prefix}:${index}`;
      const combined = naiveDigest(message, bits, mode, digest);
      const previous = seen.get(combined);
      if (previous !== undefined && previous !== message) {
        return {
          kind: 'measured',
          ...base,
          measuredEvaluations: index + 1,
          measuredCalls: meter.count,
        };
      }
      seen.set(combined, message);
    }
  } catch (error) {
    if (!String(error).includes('budget')) throw error;
    return { kind: 'extrapolated', ...base, measuredEvaluations: null, measuredCalls: null };
  }
}

export function cascade(
  bits: number,
  forkCount: number,
  mode: H2Mode,
  progress: Progress = () => {},
): CascadeResult {
  checkConfig(bits, forkCount);
  const meter = counted(bits, SEARCH_CAP, SEARCH_MS, (calls) =>
    progress({ phase: 'hashing', calls }),
  );
  const digest = digestFor(meter, bits);
  const chain = buildChain(bits, forkCount, meter, progress);
  const h1Calls = meter.count;
  const candidateLimit = 2 ** forkCount;
  const predictedProbability = birthday(2 ** bits, candidateLimit).exact;
  const seen = new Map<number, number>();
  let pair: CascadePair | null = null;
  let candidateCount = 0;

  for (let mask = 0; mask < candidateLimit; mask += 1) {
    const blocks = blocksForMask(chain.forks, mask);
    const h2 = h2Hash(blocks, bits, mode, digest);
    candidateCount = mask + 1;
    const previous = seen.get(h2);
    if (previous !== undefined) {
      pair = {
        a: { mask: previous, blocks: blocksForMask(chain.forks, previous) },
        b: { mask, blocks },
        h1: chain.h1Digest,
        h2,
      };
      break;
    }
    seen.set(h2, mask);
    if (candidateCount % 256 === 0) {
      progress({ phase: 'h2', complete: candidateCount, total: candidateLimit, calls: meter.count });
    }
  }

  const h2Calls = meter.count - h1Calls;
  const totalCalls = chain.h1Calls + h2Calls;
  if (totalCalls !== meter.count) throw new Error('Compression-call accounting invariant failed');
  return {
    chain,
    mode,
    pair,
    candidateCount,
    candidateLimit,
    predictedProbability,
    h2Calls,
    totalCalls,
    naive: naiveComparison(bits, mode),
  };
}

