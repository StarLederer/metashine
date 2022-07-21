import { TagCarrier } from 'native-addon';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const arr = new Uint8Array(buffer);
  return window.btoa(
    arr.reduce((data, byte) => data + String.fromCharCode(byte), ''),
  );
}

function stringToHashCode(s: string): number {
  let hash = 0;
  let i;
  let chr;
  if (s.length === 0) return hash;
  for (i = 0; i < s.length; i++) {
    chr = s.charCodeAt(i);
    // eslint-disable-next-line no-bitwise
    hash = (hash << 5) - hash + chr;
    // eslint-disable-next-line no-bitwise
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

function findFrameIndexes(tag: TagCarrier, frameID: string): number[] {
  const indexes: number[] = [];
  tag.forEach((frame, i) => {
    if (frame[1] === frameID) indexes.push(i);
  });
  return indexes;
}

export { arrayBufferToBase64, stringToHashCode, findFrameIndexes };
