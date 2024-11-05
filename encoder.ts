import { EncodedBlock, xor } from "./shared.ts";

export class LTEncoder {
  /** The max size allowed for each block. */
  readonly blockSize: number;
  /** The list of source blocks. */
  readonly blocks: Uint8Array[];

  constructor(message: string, blockSize: number) {
    this.blockSize = blockSize;

    const textEncoder = new TextEncoder();
    const data = textEncoder.encode(message);

    const blocksNeeded = Math.ceil(data.length / this.blockSize);

    const blocks: Uint8Array[] = [];

    for (let i = 0; i < blocksNeeded; i++) {
      const start = i * this.blockSize;
      const end = start + this.blockSize;
      const block = data.subarray(start, end);

      blocks.push(block);
    }

    this.blocks = blocks;
  }

  /** Randomly assembles an encoded block from the source blocks. */
  encode(): EncodedBlock {
    const blocksToEncode = this.getBlocksToEncode();

    const ids: number[] = [];
    const sourceBlocks: Uint8Array[] = [];

    for (let i = 0; i < blocksToEncode; i++) {
      let id = -1;

      do {
        id = Math.floor(Math.random() * this.blocks.length);
      } while (ids.includes(id));

      ids.push(id);
      sourceBlocks.push(this.blocks[id]);
    }

    const data = new Uint8Array(this.blockSize);

    for (const block of sourceBlocks) {
      xor(data, block);
    }

    ids.sort((a, b) => a - b);

    return { data, ids, totalSources: this.blocks.length };
  }

  /** Probability function for determining the number of source blocks to combine into one encoded block. */
  private getBlocksToEncode(): number {
    const random = Math.floor(Math.random() * 100);

    if (random <= 100 / this.blocks.length) {
      return 1;
    }

    let cumulative = 100;
    for (let i = 2; i <= this.blocks.length; i++) {
      cumulative /= i;
      if (random >= cumulative) {
        return i;
      }
    }

    return 1;
  }
}
