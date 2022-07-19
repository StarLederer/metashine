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
    ID3Text
  ];

  export type ExtendedTextCarrier = [
    "extended text",
    string,
    ID3ExtendedText
  ];

  export type LinkCarrier = [
    "link",
    string,
    ID3Link
  ];

  export type ExtendedLinkCarrier = [
    "extended link",
    string,
    ID3ExtendedLink
  ];

  export type LyricsCarrier = [
    "lyrics",
    string,
    ID3Lyrics
  ];

  export type CommentCarrier = [
    "comment",
    string,
    ID3Comment
  ];

  export type PictureCarrier = [
    "picture",
    string,
    ID3Picture
  ];

  export type EncapsulatedObjectCarrier = [
    "encapsulated object",
    string,
    ID3EncapsulatedObject
  ];

  export type UnknownCarrier = [
    "unknown",
    string,
    ArrayBuffer
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
   * These types are used to tell the native addon to remove tags
   */

  export type IDRemover = [
    "remove",
    string
  ];

  export type PictureRemover = [
    "remove picture",
    string,
    number,
  ];

  export type FrameRemover = IDRemover | PictureRemover;

  export type FrameModifier = FrameCarrier | FrameRemover;

  export type TagModifier = FrameModifier[];

  /**
   * Functions
   */

  export function loadTag(path: string): TagCarrier;
  export function writeTag(path: string, update: TagModifier): void;
}
