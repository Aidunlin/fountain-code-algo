import { LTDecoder, LTEncoder } from "./index.ts";

function testOnce() {
  const sourceMessage = "Team Mean Machine";
  const blockSize = 4;

  const encoder = new LTEncoder(sourceMessage, blockSize);
  const decoder = new LTDecoder();

  let done = false;

  decoder.ondecode = (message) => {
    done = true;

    console.group("Test once:");

    console.log("Source:");
    console.log(sourceMessage);
    console.table(encoder.blocks);
    console.log();

    console.log("Encoded:");
    console.table(decoder.encoded, ["data", "ids"]);
    console.log();

    console.log("Decoded:");
    console.log(message);
    console.table(decoder.decoded);

    console.groupEnd();
  };

  while (!done) {
    const newBlock = encoder.encode();
    decoder.addEncodedBlock(newBlock);
  }
}

function testAverage(tests: number) {
  const sourceMessage = "Team Mean Machine";
  const blockSize = 4;

  const encoder = new LTEncoder(sourceMessage, blockSize);

  let totalEncodedBlocks = 0;
  let maxEncodedBlocks = 0;
  let maxCombinedBlocks = 1;

  for (let i = 0; i < tests; i++) {
    const decoder = new LTDecoder();

    let done = false;

    decoder.ondecode = () => {
      done = true;
    };

    while (!done) {
      const newBlock = encoder.encode();
      decoder.addEncodedBlock(newBlock);
      maxCombinedBlocks = Math.max(newBlock.ids.length, maxCombinedBlocks);
    }

    totalEncodedBlocks += decoder.encoded.length;
    maxEncodedBlocks = Math.max(decoder.encoded.length, maxEncodedBlocks);
  }

  console.group("Tests:", tests);
  console.log("Average blocks encoded:", totalEncodedBlocks / tests);
  console.log("Max blocks encoded:", maxEncodedBlocks);
  console.log("Max combined blocks:", maxCombinedBlocks);
  console.groupEnd();
}

console.clear();
testOnce();
console.log();
testAverage(1_000);
