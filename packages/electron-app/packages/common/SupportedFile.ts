import * as path from 'path';
import * as mm from 'music-metadata';
import SupportedFormat from './SupportedFormats';
import FileCategory from './FileCategory';

interface ISuppotedFile {
  name: string;
  path: string;
  location: string;
  format: SupportedFormat;
  category: FileCategory;
  meta: mm.IAudioMetadata | null;
}

async function getSupportedFileFomPath(filePath: string): Promise<ISuppotedFile> {
  const supportedFile: ISuppotedFile = {
    name: path.basename(filePath, path.extname(filePath)),
    format: SupportedFormat.Unsupported,
    category: FileCategory.Unsupported,
    location: path.dirname(filePath),
    path: filePath,
    meta: null,
  };

  // Format
  const lowerCaseExtname = path.extname(filePath).toLowerCase();
  if (lowerCaseExtname.endsWith('mp3')) {
    supportedFile.format = SupportedFormat.MP3;
    supportedFile.category = FileCategory.Supported;
  } else if (lowerCaseExtname.endsWith('wav')) {
    supportedFile.format = SupportedFormat.WAV;
    supportedFile.category = FileCategory.Readonly;
  }

  if (supportedFile.format === SupportedFormat.Unsupported) { return supportedFile; }

  // Metadata
  const metadata = await mm.parseFile(filePath);
  supportedFile.meta = metadata;

  return supportedFile;
}

export type { ISuppotedFile };
export { getSupportedFileFomPath };
