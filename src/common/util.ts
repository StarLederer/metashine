import https from 'https';

function arrayBufferToBase64(buffer: Buffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function urlToBuffer(url: string) {
  return new Promise<Buffer>((resolve, reject) => {
    https.get(url, function (res) {
      var data: Uint8Array[] = [];

      res
        .on('data', (chunk) => {
          data.push(chunk);
        })
        .on('end', () => {
          // at this point data is an array of Buffers
          // so Buffer.concat() can make us a new Buffer
          // of all of them together
          resolve(Buffer.concat(data));
        })
        .on('error', (e) => {
          reject(e);
        });
    });
  });
}

function stringToHashCode(s: string): number {
  var hash = 0,
    i,
    chr;
  if (s.length === 0) return hash;
  for (i = 0; i < s.length; i++) {
    chr = s.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

export { arrayBufferToBase64, urlToBuffer, stringToHashCode };
