interface ElectronApi {
  versions: Readonly<NodeJS.ProcessVersions>;
  // windowControls: {
  //   minimize(): void;
  //   resize(): void;
  //   close(): void;
  // };
  send(verb: string, ...args): void;
  on(verb: string, listener: (event: unknown, ...args) => void): void;
  clipboard: {
    availableFormats(): string[];
    writeText(text: string): void;
    readImagePNG(): Buffer
  };
}

declare interface Window {
  electron: Readonly<ElectronApi>;
  electronRequire?: NodeRequire;
}
