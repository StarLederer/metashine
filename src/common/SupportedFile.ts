import { SupportedFormat } from './SupportedFormats';
import * as mm from 'music-metadata';

export interface ISuppotedFile {
  name: string;
  path: string;
  location: string;
  format: SupportedFormat;
  meta: mm.IAudioMetadata | null;
}
