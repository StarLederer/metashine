type SeachResultSuggestion = {
  lablel: string;
  buttons?: { label: string; apply: () => void }[];
};

type SearchResult = {
  trackTitle: string;
  trackArtist: string;
  albumArtSrc?: string;
  isOpen: boolean;
  suggestions: SeachResultSuggestion[];
  albumArt: {
    url: string;
    extension: string;
  };
};

export type { SeachResultSuggestion, SearchResult };
