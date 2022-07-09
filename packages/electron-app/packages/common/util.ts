import { ID3Tag } from '@metashine/native-addon';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
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

function findFrameIndexes(tag: ID3Tag, frameID: string): number[] {
  const indexes: number[] = [];
  tag.forEach((frame, i) => {
    if (frame[0] === frameID) indexes.push(i);
  });
  return indexes;
}

export { arrayBufferToBase64, stringToHashCode, findFrameIndexes };
