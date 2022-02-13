import * as https from 'https';

function urlToBuffer(url: string): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    https.get(url, (res) => {
      const data: Uint8Array[] = [];

      res
        .on('data', (chunk: Uint8Array) => {
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

export default urlToBuffer;
