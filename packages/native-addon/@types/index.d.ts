type ID3Frame = [
  string,
  any
];

type APICFrame = [
  'APIC',
  {
    MIMEType: string,
    pictureType: number,
    description: string,
    data?: ArrayBuffer;
  }
];

declare type ID3Tag = ID3Frame[];

declare module "@metashine/native-addon" {
  function loadTag(path: string): ID3Tag;
  function updateTag(path: string, update: ID3Tag): void;
  export { loadTag, updateTag, ID3Frame, APICFrame, ID3Tag };
}
