import * as mm from 'music-metadata';
import SupportedFormat from './SupportedFormats';

interface ISuppotedFile {
  name: string;
  path: string;
  location: string;
  format: SupportedFormat;
  meta: mm.IAudioMetadata | null;
}

export default ISuppotedFile;
