import { EncodedBlock, xor } from "./shared.ts";

export class LTDecoder {
  /** Reference array of encoded blocks received. Unused in the decoding process. */
  readonly encoded: EncodedBlock[];
  /** Contains encoded blocks at various stages of decoding. */
  readonly buffer: EncodedBlock[];
  /**
   * Fully decoded blocks, placed at their original source indexes.
   * If a source block has not been fully decoded yet, the corresponding value is undefined.
   */
  readonly decoded: (Uint8Array | undefined)[];
  /** Run as soon as all blocks have been decoded. */
  ondecode: ((message: string) => void) | undefined;

  constructor() {
    this.encoded = [];
    this.buffer = [];
    this.decoded = [];
    this.ondecode = undefined;
  }

  /**
   * Attempts to decode the message as much as possible using the encoded block.
   * If successful, runs the ondecode callback with the decoded message.
   */
  addEncodedBlock(newBlock: EncodedBlock) {
    if (!newBlock.ids.length) {
      return;
    }

    const redundant = newBlock.ids.every((id) => this.decoded[id]);
    if (redundant) {
      return;
    }

    this.encoded.push(structuredClone(newBlock));

    if (newBlock.ids.length) {
      for (const id of newBlock.ids) {
        const decodedBlock = this.decoded[id];
        if (!decodedBlock) {
          continue;
        }

        xor(newBlock.data, decodedBlock);
      }

      newBlock.ids = newBlock.ids.filter((id) => !this.decoded[id]);
    }

    if (newBlock.ids.length == 1) {
      this.decodeBuffer(newBlock, this.buffer);
    } else {
      this.buffer.push(newBlock);
    }

    const done = newBlock.totalSources == this.decoded.filter((b) => b).length;
    if (done) {
      this.constructMessage();
    }
  }

  /** Recursively decodes the given buffer as much as possible using the newly decoded block. */
  private decodeBuffer(newDecoded: EncodedBlock, buffer: EncodedBlock[]) {
    const decodedId = newDecoded.ids[0];

    if (this.decoded[decodedId]) {
      return;
    }

    this.decoded[decodedId] = newDecoded.data;

    for (let index = 0; index < buffer.length; index++) {
      const block = buffer[index];

      if (block.ids.length == 1 || !block.ids.includes(decodedId)) {
        continue;
      }

      xor(block.data, newDecoded.data);
      block.ids = block.ids.filter((id) => id != decodedId);

      if (block.ids.length == 1) {
        const newBuffer = buffer.filter((block) => block.ids.length > 1);
        this.decodeBuffer(block, newBuffer);
      }
    }
  }

  /** Runs once decoding is complete. */
  private constructMessage() {
    let totalBlockLength = 0;
    for (const block of this.decoded) {
      if (!block) {
        return undefined;
      }

      totalBlockLength += block.length;
    }

    let offset = 0;
    const data = new Uint8Array(totalBlockLength);
    for (const block of this.decoded) {
      if (!block) {
        return undefined;
      }

      data.set(block, offset);
      offset += block.length;
    }

    const decoder = new TextDecoder();
    const message = decoder.decode(data);
    this.ondecode?.(message);
  }
}
