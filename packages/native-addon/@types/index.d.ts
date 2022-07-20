declare module "@metashine/native-addon" {
  /**
   * Standard ID3 frame content types
   */

  export type ID3Text = string;

  export type ID3ExtendedText = {
    description: string;
    value: string;
  };

  export type ID3Link = string;

  export type ID3ExtendedLink = {
    description: string;
    link: string;
  };

  export type ID3Lyrics = {
    lang: string;
    description: string;
    text: ArrayBuffer;
  };

  export type ID3Comment = {
    lang: string;
    description: string;
    text: string;
  };

  export type ID3Picture = {
    MIMEType: string;
    pictureType: number;
    description: string;
    data: ArrayBuffer;
  };

  export type ID3EncapsulatedObject = {
    MIMEType: string;
    filename: string;
    description: string;
    data: ArrayBuffer;
  };

  export type ID3Content = ID3Text
    | ID3ExtendedText
    | ID3Link
    | ID3ExtendedLink
    | ID3Lyrics
    | ID3Comment
    | ID3Picture
    | ID3EncapsulatedObject;

  /**
   * Frame carriers
   */
  export type TextCarrier = [
    "text",
    string,
    ID3Text,
    boolean
  ];

  export type ExtendedTextCarrier = [
    "extended text",
    string,
    ID3ExtendedText,
    boolean
  ];

  export type LinkCarrier = [
    "link",
    string,
    ID3Link,
    boolean
  ];

  export type ExtendedLinkCarrier = [
    "extended link",
    string,
    ID3ExtendedLink,
    boolean
  ];

  export type LyricsCarrier = [
    "lyrics",
    string,
    ID3Lyrics,
    boolean
  ];

  export type CommentCarrier = [
    "comment",
    string,
    ID3Comment,
    boolean
  ];

  export type PictureCarrier = [
    "picture",
    string,
    ID3Picture,
    boolean
  ];

  export type EncapsulatedObjectCarrier = [
    "encapsulated object",
    string,
    ID3EncapsulatedObject,
    boolean
  ];

  export type UnknownCarrier = [
    "unknown",
    string,
    ArrayBuffer,
    boolean
  ];

  export type FrameCarrier = TextCarrier
    | ExtendedTextCarrier
    | LinkCarrier
    | ExtendedLinkCarrier
    | LyricsCarrier
    | CommentCarrier
    | PictureCarrier
    | EncapsulatedObjectCarrier
    | UnknownCarrier;

  export type TagCarrier = FrameCarrier[];

  /**
   * Functions
   */

  export function loadTag(path: string): TagCarrier;
  export function updateTag(path: string, update: TagCarrier): TagCarrier;
}
