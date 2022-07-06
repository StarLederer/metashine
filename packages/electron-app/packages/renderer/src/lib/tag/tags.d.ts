/// <reference path='@metashine/native-addon' />

declare interface Window {
  tags: {
    updateFrame(update: ID3Tag): void;
  };
}
