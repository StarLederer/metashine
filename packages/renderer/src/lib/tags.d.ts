declare interface Window {
  tags: {
    updateTrackTitle(value: string): void;
    updateTrackArtist(value: string): void;
    updateTrackNumber(value: string): void;
    updateAlbumTitle(value: string): void;
    updateAlbumArtist(value: string): void;
    updateYear(value: string): void;
    updateAlbumArt(buffer: ArrayBuffer, name: string): void;
  };
}
