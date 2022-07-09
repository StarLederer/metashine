declare module "@metashine/native-addon" {
  type APICFrame = {
    MIMEType: string;
    pictureType: number;
    description: string;
    data: ArrayBuffer;
  }

  type ID3Text = [
    "text",
    string,
    string
  ];

  type ID3ExtendedText = [
    "extended text",
    string,
    {
      value: string;
      description: string;
    }
  ];

  type ID3Link = [
    "link",
    string,
    string
  ];

  type ID3Comment = [
    "comment",
    string,
    {
      lang: string;
      description: string;
      text: string;
    }
  ];

  type ID3Picture = [
    "picture",
    string,
    APICFrame
  ];

  type IDEncapsulatedObject = [
    "encapsulated object",
    string,
    {
      MIMEType: string;
      filename: string;
      description: string;
      data: ArrayBuffer;
    }
  ];

  type ID3Unknown = [
    "unknown",
    string,
    ArrayBuffer,
  ];

  type ID3Frame = ID3Text | ID3ExtendedText | ID3Link | ID3Comment | ID3Picture | IDEncapsulatedObject | ID3Unknown;

  type ID3Tag = ID3Frame[];

  function loadTag(path: string): ID3Tag;
  function writeTag(path: string, update: ID3Tag): void;
  export {
    loadTag,
    writeTag,

    APICFrame,

    ID3Text,
    ID3ExtendedText,
    ID3Link,
    ID3Comment,
    ID3Picture,
    IDEncapsulatedObject,
    ID3Unknown,
    ID3Frame,
    ID3Tag
  };
}
