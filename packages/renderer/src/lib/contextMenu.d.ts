declare interface Window {
  contextMenu: {
    open(x: number, y: number, options: unknown);
    close();
  };
}
