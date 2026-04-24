export default function chunkArray<T>(inputArray: T[], multipleOf: number) {
  const output: T[][] = [[]];

  let currentIndex = 0;

  for (let i = 0; i < inputArray.length; i++) {
    if (output[currentIndex].length === multipleOf) {
      currentIndex++;
      output.push([]);
    }

    output[currentIndex].push(inputArray[i]);
  }

  return output;
}
