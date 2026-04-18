import type {
  AuthResponse,
  AdminActionResponse,
  AuthPageImage,
  AuthPageImagesResponse,
  AdminPendingRegistrationsResponse,
  AdminOverviewResponse,
  AdminUpdateUserRequest,
  AdminUserDetailResponse,
  AdminUsersResponse,
  HomeResponse,
  LibraryMovie,
  MessageResponse,
  MovieDetailResponse,
  PasswordResetTokenValidationResponse,
  PagedMovieResponse,
  RegistrationTokenValidationResponse,
  UserProfile,
  WatchHistoryItem,
  WishlistStateResponse,
  UploadResponse,
} from "@/shared/types/api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
  keepalive?: boolean;
  signal?: AbortSignal;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers = new Headers();
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  if (!isFormData) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    keepalive: options.keepalive ?? false,
    signal: options.signal,
    body: !options.body
      ? undefined
      : isFormData
        ? (options.body as FormData)
        : JSON.stringify(options.body),
  });

  if (!response.ok) {
    const fallback = "Đã xảy ra lỗi khi kết nối máy chủ.";
    try {
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        throw new Error(data.message ?? fallback);
      }
      const text = await response.text();
      throw new Error(text || fallback);
    } catch (error) {
      if (error instanceof Error && error.message !== fallback) {
        throw error;
      }
      throw new Error(fallback);
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json() as Promise<T>;
  }
  return response.text() as unknown as Promise<T>;
}

export const api = {
  home: () => request<HomeResponse>("/catalog/home"),
  latest: (
    page = 1,
    version = "v3",
    options: Pick<RequestOptions, "signal"> = {},
  ) =>
    request<PagedMovieResponse>(
      `/catalog/latest?page=${page}&version=${version}`,
      options,
    ),
  listAll: (
    searchParams: URLSearchParams,
    options: Pick<RequestOptions, "signal"> = {},
  ) => request<PagedMovieResponse>(`/catalog/list?${searchParams.toString()}`, options),
  list: (type: string, searchParams: URLSearchParams) =>
    request<PagedMovieResponse>(
      `/catalog/list/${type}?${searchParams.toString()}`,
    ),
  adminOverview: (token: string) =>
    request<AdminOverviewResponse>("/admin/overview", { token }),
  adminPendingRegistrations: (token: string, searchParams: URLSearchParams) =>
    request<AdminPendingRegistrationsResponse>(
      `/admin/pending-registrations?${searchParams.toString()}`,
      { token },
    ),
  adminUsers: (token: string, searchParams: URLSearchParams) =>
    request<AdminUsersResponse>(`/admin/users?${searchParams.toString()}`, {
      token,
    }),
  adminUser: (token: string, userId: number | string) =>
    request<AdminUserDetailResponse>(`/admin/users/${userId}`, { token }),
  resetPendingRegistration: (token: string, pendingRegistrationId: number | string) =>
    request<AdminActionResponse>(
      `/admin/pending-registrations/${pendingRegistrationId}`,
      {
        method: "DELETE",
        token,
      },
    ),
  resetPendingRegistrationByEmail: (token: string, email: string) =>
    request<AdminActionResponse>("/admin/pending-registrations", {
      method: "DELETE",
      body: { email },
      token,
    }),
  updateAdminUser: (
    token: string,
    userId: number | string,
    payload: AdminUpdateUserRequest,
  ) =>
    request<AdminUserDetailResponse>(`/admin/users/${userId}`, {
      method: "PUT",
      body: payload,
      token,
    }),
  deleteAdminUser: (token: string, userId: number | string) =>
    request<AdminActionResponse>(`/admin/users/${userId}`, {
      method: "DELETE",
      token,
    }),
  adminAuthPageImages: (token: string) =>
    request<AuthPageImagesResponse>("/admin/auth-images", { token }),
  createAdminAuthPageImage: (
    token: string,
    payload: {
      imageUrl: string;
      title?: string;
      description?: string;
      focalPointX?: number;
      focalPointY?: number;
    },
  ) =>
    request<AuthPageImage>("/admin/auth-images", {
      method: "POST",
      body: payload,
      token,
    }),
  updateAdminAuthPageImage: (
    token: string,
    imageId: number | string,
    payload: {
      imageUrl: string;
      title?: string;
      description?: string;
      focalPointX?: number;
      focalPointY?: number;
    },
  ) =>
    request<AuthPageImage>(`/admin/auth-images/${imageId}`, {
      method: "PUT",
      body: payload,
      token,
    }),
  deleteAdminAuthPageImage: (token: string, imageId: number | string) =>
    request<AdminActionResponse>(`/admin/auth-images/${imageId}`, {
      method: "DELETE",
      token,
    }),
  search: (
    searchParams: URLSearchParams,
    options: Pick<RequestOptions, "signal"> = {},
  ) => request<PagedMovieResponse>(`/catalog/search?${searchParams.toString()}`, options),
  categories: () => request<any>("/catalog/categories"),
  countries: () => request<any>("/catalog/countries"),
  authPageImages: () => request<AuthPageImagesResponse>("/catalog/auth-images"),
  categoryDetail: (slug: string, searchParams: URLSearchParams) =>
    request<PagedMovieResponse>(
      `/catalog/category/${encodeURIComponent(slug)}?${searchParams.toString()}`,
    ),
  countryDetail: (slug: string, searchParams: URLSearchParams) =>
    request<PagedMovieResponse>(
      `/catalog/country/${encodeURIComponent(slug)}?${searchParams.toString()}`,
    ),
  yearDetail: (year: string | number, searchParams: URLSearchParams) =>
    request<PagedMovieResponse>(
      `/catalog/year/${encodeURIComponent(String(year))}?${searchParams.toString()}`,
    ),
  movie: (slug: string) => request<MovieDetailResponse>(`/movies/${slug}`),
  startRegistration: (payload: { email: string }) =>
    request<MessageResponse>("/auth/start-registration", {
      method: "POST",
      body: payload,
    }),
  validateRegistrationToken: (token: string) =>
    request<RegistrationTokenValidationResponse>(
      `/auth/validate-token/${encodeURIComponent(token)}`,
    ),
  completeRegistration: (payload: {
    verificationToken: string;
    fullName: string;
    password: string;
  }) =>
    request<AuthResponse>("/auth/complete-registration", {
      method: "POST",
      body: payload,
    }),
  forgotPassword: (payload: { email: string }) =>
    request<MessageResponse>("/auth/forgot-password", {
      method: "POST",
      body: payload,
    }),
  validatePasswordResetToken: (token: string) =>
    request<PasswordResetTokenValidationResponse>(
      `/auth/reset-password/validate/${encodeURIComponent(token)}`,
    ),
  resetPassword: (payload: { resetToken: string; password: string }) =>
    request<MessageResponse>("/auth/reset-password", {
      method: "POST",
      body: payload,
    }),
  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: payload }),
  me: (token: string) => request<UserProfile>("/auth/me", { token }),
  updateProfile: (
    token: string,
    payload: { fullName: string; avatarUrl?: string; bio?: string },
  ) =>
    request<UserProfile>("/users/me", { method: "PUT", body: payload, token }),
  uploadFile: (token: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<UploadResponse>("/upload", {
      method: "POST",
      body: formData,
      token,
    });
  },
  wishlist: (
    token: string,
    options: Pick<RequestOptions, "signal"> = {},
  ) => request<LibraryMovie[]>("/wishlist", { token, ...options }),
  wishlistState: (token: string, movieSlug: string) =>
    request<WishlistStateResponse>(
      `/wishlist/state?movieSlug=${encodeURIComponent(movieSlug)}`,
      { token },
    ),
  addWishlist: (
    token: string,
    payload: {
      movieSlug: string;
      movieName: string;
      originName?: string | null;
      posterUrl?: string | null;
      thumbUrl?: string | null;
      quality?: string | null;
      lang?: string | null;
      year?: string | null;
    },
  ) =>
    request<LibraryMovie>("/wishlist", {
      method: "POST",
      body: payload,
      token,
    }),
  removeWishlist: (token: string, movieSlug: string) =>
    request<void>(`/wishlist/${encodeURIComponent(movieSlug)}`, {
      method: "DELETE",
      token,
    }),
  history: (token: string) =>
    request<WatchHistoryItem[]>("/history", { token }),
  saveHistory: (
    token: string,
    payload: {
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
      saveReason?:
        | "EMBED_OPEN"
        | "PERIODIC"
        | "PAUSE"
        | "ENDED"
        | "BACKGROUND"
        | "EXIT";
    },
    options?: { keepalive?: boolean },
  ) =>
    request<WatchHistoryItem>("/history", {
      method: "POST",
      body: payload,
      token,
      keepalive: options?.keepalive,
    }),
  removeHistory: (token: string, historyId: number) =>
    request<void>(`/history/${historyId}`, {
      method: "DELETE",
      token,
    }),
};

export { API_BASE_URL };
