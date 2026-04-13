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

export interface AdminDashboardStats {
  totalUsers: number;
  totalAdmins: number;
  verifiedUsers: number;
  newUsersLast7Days: number;
  activeUsersLast7Days: number;
  pendingRegistrations: number;
  totalWatchHistoryEntries: number;
  watchHistoryLast7Days: number;
  totalWishlistItems: number;
  wishlistItemsLast7Days: number;
  totalUploads: number;
  uploadsLast30Days: number;
}

export interface AdminUserSummary {
  id: number;
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  bio?: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  watchHistoryCount: number;
  wishlistCount: number;
}

export interface AdminMovieMetric {
  movieSlug: string;
  movieName: string;
  thumbUrl?: string | null;
  total: number;
}

export interface AdminActivityItem {
  type: "WATCH" | "WISHLIST" | string;
  userId: number;
  userName: string;
  userEmail: string;
  movieSlug: string;
  movieName: string;
  detail: string;
  occurredAt: string;
}

export interface AdminPendingRegistration {
  id: number;
  email: string;
  createdAt: string;
  expiresAt: string;
  expired: boolean;
}

export interface AdminRecentWatchItem {
  id: number;
  movieSlug: string;
  movieName: string;
  originName?: string | null;
  thumbUrl?: string | null;
  lastEpisodeName?: string | null;
  lastPositionSeconds?: number | null;
  durationSeconds?: number | null;
  updatedAt: string;
}

export interface AdminRecentWishlistItem {
  id: number;
  movieSlug: string;
  movieName: string;
  originName?: string | null;
  thumbUrl?: string | null;
  createdAt: string;
}

export interface AdminOverviewResponse {
  stats: AdminDashboardStats;
  latestUsers: AdminUserSummary[];
  recentActivity: AdminActivityItem[];
  topWatchedMovies: AdminMovieMetric[];
  topWishlistedMovies: AdminMovieMetric[];
  pendingRegistrations: AdminPendingRegistration[];
}

export interface AdminPendingRegistrationsResponse {
  page: number;
  size: number;
  totalPages: number;
  totalItems: number;
  items: AdminPendingRegistration[];
}

export interface AdminUsersResponse {
  page: number;
  size: number;
  totalPages: number;
  totalItems: number;
  items: AdminUserSummary[];
}

export interface AdminUserDetailResponse {
  user: AdminUserSummary;
  recentWatchHistory: AdminRecentWatchItem[];
  recentWishlist: AdminRecentWishlistItem[];
}

export interface AdminUpdateUserRequest {
  fullName: string;
  role: "USER" | "ADMIN";
  emailVerified: boolean;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface AdminActionResponse {
  message: string;
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
