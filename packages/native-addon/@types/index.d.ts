type APICFrame = {
  MIMEType: string,
  pictureType: string,
  description: string,
  data?: ArrayBuffer;
};

type NativeID3v2_4_0Tag = {
  TIT1: string;
  TIT2: string;
  TIT3: string;
  TALB: string;
  TOAL: string;
  TRCK: string;
  TPOS: string;
  TSST: string;
  TSRC: string;

  TPE1: string;
  TPE2: string;
  TPE3: string;
  TPE4: string;
  TOPE: string;
  TEXT: string;
  TOLY: string;
  TCOM: string;
  TMCL: string;
  TIPL: string;
  TENC: string;

  TBPM: string;
  TLEN: string;
  TKEY: string;
  TLAN: string;
  TCON: string;
  TFLT: string;
  TMED: string;
  TMOO: string;

  TCOP: string;
  TPRO: string;
  TPUB: string;
  TOWN: string;
  TRSN: string;
  TRSO: string;

  TOFN: string;
  TDLY: string;
  TDEN: string;
  TDOR: string;
  TDRC: string;
  TDRL: string;
  TDTG: string;
  TSSE: string;
  TSOA: string;
  TSOP: string;
  TSOT: string;

  APIC: APICFrame;
};

type NativeID3v2_3_0Tag = {
  TYER: string
};

declare type ID3Tag = Partial<NativeID3v2_4_0Tag & NativeID3v2_3_0Tag>;

declare module "@metashine/native-addon" {
  function loadTag(path: string): ID3Tag;
  function updateTag(path: string, update: ID3Tag): void;
  export { loadTag, updateTag, ID3Tag, APICFrame };
}
