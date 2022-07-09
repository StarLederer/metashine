declare module "@metashine/native-addon" {
  type APICFrame =     {
    MIMEType: string,
    pictureType: number,
    description: string,
    data: ArrayBuffer;
  }

  type ID3Text = [
    string,
    string
  ];

  type ID3APIC = [
    'APIC',
    APICFrame
  ];

  type ID3Frame = ID3Text | ID3APIC;

  type ID3Tag = ID3Frame[];

  function loadTag(path: string): ID3Tag;
  function updateTag(path: string, update: ID3Tag): void;
  export { loadTag, updateTag, ID3Frame, APICFrame, ID3Tag, ID3Text, ID3APIC };
}
