type ID3Frame = import('native-addon').ID3Frame;

declare interface Window {
  tags: {
    updateFrame(update: ID3Frame): void;
  };
}
