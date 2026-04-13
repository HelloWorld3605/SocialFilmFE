export interface MovieSummary {
  slug: string;
  name: string;
  originName?: string | null;
  posterUrl?: string | null;
  thumbUrl?: string | null;
  quality?: string | null;
  lang?: string | null;
  episodeCurrent?: string | null;
  year?: number | null;
  type?: string | null;
  categories?: string[];
  countries?: string[];
  tmdbId?: number | null;
  sourceId?: string | null;
  modifiedTime?: string | null;
}

export interface PagedMovieResponse {
  page: number;
  totalPages: number;
  totalItems: number;
  items: MovieSummary[];
  raw: unknown;
}

export interface HomeResponse {
  latest: MovieSummary[];
  series: MovieSummary[];
  single: MovieSummary[];
  animation: MovieSummary[];
  tvShows: MovieSummary[];
}

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  bio?: string | null;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserProfile;
}

export interface MessageResponse {
  message: string;
  debugVerificationUrl?: string | null;
}

export interface RegistrationTokenValidationResponse {
  valid: boolean;
  email: string;
  expiresAt: string;
}

export interface UploadResponse {
  url: string;
}

export interface LibraryMovie {
  id: number;
  movieSlug: string;
  movieName: string;
  originName?: string | null;
  posterUrl?: string | null;
  thumbUrl?: string | null;
  quality?: string | null;
  lang?: string | null;
  year?: string | null;
  savedAt: string;
}

export interface WishlistStateResponse {
  wished: boolean;
  items: LibraryMovie[];
}

export interface WatchHistoryItem {
  id: number;
  movieSlug: string;
  movieName: string;
  originName?: string | null;
  posterUrl?: string | null;
  thumbUrl?: string | null;
  quality?: string | null;
  lang?: string | null;
  year?: string | null;
  lastEpisodeName?: string | null;
  lastPositionSeconds?: number | null;
  lastServerIndex?: number | null;
  lastEpisodeIndex?: number | null;
  durationSeconds?: number | null;
  updatedAt: string;
}

export interface MovieDetailResponse {
  movie: MovieSummary;
  raw: {
    movie?: Record<string, unknown>;
    episodes?: EpisodeServer[];
  };
  episodes: EpisodeServer[];
  metadata: {
    imageProxyBaseUrl?: string;
  };
}

export interface EpisodeServer {
  server_name?: string;
  server_data?: EpisodeItem[];
}

export interface EpisodeItem {
  name?: string;
  slug?: string;
  filename?: string;
  link_embed?: string;
  link_m3u8?: string;
}
