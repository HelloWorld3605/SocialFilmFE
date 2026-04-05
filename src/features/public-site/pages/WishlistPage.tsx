import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookmarkPlus,
  Clock3,
  MoreVertical,
  Share2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import MovieCard from "@/shared/components/CardFilm/MovieCard";
import ConfirmDeleteDialog from "@/shared/components/ConfirmDeleteDialog";
import { useAuth } from "@/shared/auth/AuthContext";
import { api } from "@/shared/lib/api";
import {
  getSkipHistoryDeleteConfirm,
  setSkipHistoryDeleteConfirm,
} from "@/shared/lib/deleteConfirmPreference";
import { buildWatchUrl } from "@/shared/lib/watch";
import PageNavigation from "@/shared/components/PageNavigation";
import PaginationControls from "@/shared/components/PaginationControls";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { toast } from "@/shared/components/ui/sonner";
import type { WatchHistoryItem } from "@/shared/types/api";

const formatHistoryTime = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const formatWatchProgress = (seconds?: number | null) => {
  if (!seconds || seconds <= 0) {
    return "Chưa có tiến độ lưu";
  }

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `Đã xem ${hours}:${String(minutes).padStart(2, "0")}:${String(remainSeconds).padStart(2, "0")}`;
  }

  return `Đã xem ${minutes}:${String(remainSeconds).padStart(2, "0")}`;
};

const formatDuration = (seconds?: number | null) => {
  if (!seconds || seconds <= 0) {
    return null;
  }

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainSeconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainSeconds).padStart(2, "0")}`;
};

const resolveProgressPercent = (
  position?: number | null,
  duration?: number | null,
) => {
  if (!position || position <= 0) {
    return 0;
  }

  if (duration && duration > 0) {
    return Math.min((position / duration) * 100, 100);
  }

  return Math.min((position / 2400) * 100, 100);
};

const WISHLIST_PAGE_SIZE = 18;
const HISTORY_PAGE_SIZE = 8;

const WishlistPage = () => {
  const { token, isAuthenticated, isReady } = useAuth();
  const queryClient = useQueryClient();
  const [wishlistPage, setWishlistPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [pendingDeleteItem, setPendingDeleteItem] =
    useState<WatchHistoryItem | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rememberChoice, setRememberChoice] = useState(false);
  const [skipDeleteConfirm, setSkipDeleteConfirm] = useState(() =>
    getSkipHistoryDeleteConfirm(),
  );

  const wishlistQuery = useQuery({
    queryKey: ["wishlist", token],
    queryFn: () => api.wishlist(token as string),
    enabled: Boolean(token),
  });

  const historyQuery = useQuery({
    queryKey: ["history", token],
    queryFn: () => api.history(token as string),
    enabled: Boolean(token),
  });

  const wishlistTotalPages = Math.max(
    1,
    Math.ceil((wishlistQuery.data?.length ?? 0) / WISHLIST_PAGE_SIZE),
  );
  const historyTotalPages = Math.max(
    1,
    Math.ceil((historyQuery.data?.length ?? 0) / HISTORY_PAGE_SIZE),
  );

  useEffect(() => {
    setWishlistPage((current) => Math.min(current, wishlistTotalPages));
  }, [wishlistTotalPages]);

  useEffect(() => {
    setHistoryPage((current) => Math.min(current, historyTotalPages));
  }, [historyTotalPages]);

  const pagedWishlistItems = useMemo(() => {
    const start = (wishlistPage - 1) * WISHLIST_PAGE_SIZE;
    return (wishlistQuery.data ?? []).slice(start, start + WISHLIST_PAGE_SIZE);
  }, [wishlistPage, wishlistQuery.data]);

  const pagedHistoryItems = useMemo(() => {
    const start = (historyPage - 1) * HISTORY_PAGE_SIZE;
    return (historyQuery.data ?? []).slice(start, start + HISTORY_PAGE_SIZE);
  }, [historyPage, historyQuery.data]);

  const saveToWishlistMutation = useMutation({
    mutationFn: async (item: WatchHistoryItem) => {
      if (!token) {
        throw new Error("Bạn cần đăng nhập để lưu phim.");
      }

      const alreadySaved = Boolean(
        wishlistQuery.data?.some(
          (wishlistItem) => wishlistItem.movieSlug === item.movieSlug,
        ),
      );

      if (alreadySaved) {
        return { status: "exists" as const, item };
      }

      await api.addWishlist(token, {
        movieSlug: item.movieSlug,
        movieName: item.movieName,
        originName: item.originName,
        posterUrl: item.posterUrl,
        thumbUrl: item.thumbUrl,
        quality: item.quality,
        lang: item.lang,
        year: item.year,
      });

      return { status: "saved" as const, item };
    },
    onSuccess: ({ status, item }) => {
      if (status === "saved" && token) {
        queryClient.invalidateQueries({ queryKey: ["wishlist", token] });
        queryClient.invalidateQueries({ queryKey: ["wishlist-state"] });
        toast.success(`Đã lưu "${item.movieName}" vào danh sách xem sau.`);
        return;
      }

      toast.info(`"${item.movieName}" đã có trong danh sách xem sau.`);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể lưu phim vào danh sách.",
      );
    },
  });

  const removeHistoryMutation = useMutation({
    mutationFn: async (item: WatchHistoryItem) => {
      if (!token) {
        throw new Error("Bạn cần đăng nhập để quản lý lịch sử xem.");
      }

      await api.removeHistory(token, item.id);
      return item;
    },
    onSuccess: (item) => {
      if (token) {
        queryClient.invalidateQueries({ queryKey: ["history", token] });
      }
      toast.success(`Đã xóa "${item.movieName}" khỏi lịch sử xem.`);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể xóa mục lịch sử xem.",
      );
    },
  });

  const handleRemoveHistoryRequest = (item: WatchHistoryItem) => {
    if (skipDeleteConfirm) {
      removeHistoryMutation.mutate(item);
      return;
    }

    setRememberChoice(false);
    setPendingDeleteItem(item);
    setConfirmOpen(true);
  };

  const handleConfirmRemoveHistory = () => {
    if (!pendingDeleteItem) {
      return;
    }

    if (rememberChoice) {
      setSkipHistoryDeleteConfirm(true);
      setSkipDeleteConfirm(true);
    }

    removeHistoryMutation.mutate(pendingDeleteItem);
    setConfirmOpen(false);
    setPendingDeleteItem(null);
  };

  const handleShare = async (item: WatchHistoryItem) => {
    const shareUrl = new URL(
      `/movie/${item.movieSlug}`,
      window.location.origin,
    ).toString();
    const shareData = {
      title: item.movieName,
      text: item.originName
        ? `${item.movieName} (${item.originName})`
        : item.movieName,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Đã sao chép liên kết phim.");
        return;
      }

      window.open(shareUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      toast.error("Không thể chia sẻ phim lúc này.");
    }
  };

  if (!isReady) {
    return (
      <div className="content-shell layout-padding py-10 text-muted-foreground">
        Đang khôi phục phiên đăng nhập...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="content-shell layout-padding space-y-10 py-10">
      <PageNavigation
        backTo="/"
        backLabel="Trang chủ"
        items={[
          { label: "Trang chủ", to: "/" },
          { label: "Thư viện", to: "/wishlist" },
          { label: "Danh sách xem sau" },
        ]}
      />

      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-primary">
          Thư viện
        </p>
        <h1 className="mt-2 text-3xl font-black text-white">
          Danh sách xem sau
        </h1>
      </div>

      <section className="space-y-5">
        <h2 className="text-xl font-bold text-white">Đã lưu để xem sau</h2>
        {wishlistQuery.isLoading ? (
          <p className="text-muted-foreground">Đang tải danh sách đã lưu...</p>
        ) : null}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {pagedWishlistItems.map((item) => (
            <MovieCard
              key={item.movieSlug}
              movie={{
                slug: item.movieSlug,
                name: item.movieName,
                originName: item.originName,
                posterUrl: item.posterUrl,
                thumbUrl: item.thumbUrl,
                quality: item.quality,
                lang: item.lang,
                year: item.year ? Number(item.year) : null,
              }}
            />
          ))}
        </div>
        {wishlistQuery.data?.length ? (
          <PaginationControls
            currentPage={wishlistPage}
            totalPages={wishlistTotalPages}
            onPageChange={setWishlistPage}
          />
        ) : null}
      </section>

      <section className="space-y-5 rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Tiếp tục xem
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">
                Lịch sử xem gần đây
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Quay lại đúng bộ phim và tập bạn vừa dừng.
              </p>
            </div>
          </div>
          <div className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-white/80">
            {historyQuery.data?.length ?? 0} mục
          </div>
        </div>

        {historyQuery.isLoading ? (
          <p className="text-muted-foreground">Đang tải lịch sử xem...</p>
        ) : null}

        {!historyQuery.isLoading && !historyQuery.data?.length ? (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-black/20 px-6 py-10 text-center">
            <p className="text-lg font-semibold text-white">
              Chưa có lịch sử xem
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Khi bạn mở phim và xem trên trình phát, lịch sử sẽ xuất hiện tại
              đây.
            </p>
          </div>
        ) : null}

        <div className="space-y-4">
          {pagedHistoryItems.map((item) => (
            <div
              key={item.id}
              className="group relative block overflow-hidden rounded-[28px] border border-white/10 bg-black/25 transition-all duration-300 hover:border-primary/35 hover:bg-black/35"
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Mở tùy chọn cho ${item.movieName}`}
                    className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white/75 backdrop-blur transition-colors hover:border-primary/40 hover:text-white"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuItem
                    onSelect={() => saveToWishlistMutation.mutate(item)}
                    disabled={
                      saveToWishlistMutation.isPending ||
                      removeHistoryMutation.isPending
                    }
                  >
                    <BookmarkPlus className="mr-2 h-4 w-4" />
                    Lưu vào danh sách
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      void handleShare(item);
                    }}
                    disabled={
                      saveToWishlistMutation.isPending ||
                      removeHistoryMutation.isPending
                    }
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Chia sẻ
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => handleRemoveHistoryRequest(item)}
                    disabled={
                      saveToWishlistMutation.isPending ||
                      removeHistoryMutation.isPending
                    }
                    className="text-red-400 focus:text-red-300"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Xóa khỏi danh sách đã xem
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link
                to={buildWatchUrl(
                  item.movieSlug,
                  item.lastServerIndex ?? undefined,
                  item.lastEpisodeIndex ?? undefined,
                  item.id,
                )}
                className="block"
              >
                <div className="flex min-h-[168px] flex-col md:min-h-[152px] md:flex-row">
                  <div className="relative h-[180px] w-full flex-none overflow-hidden bg-black/40 md:h-auto md:w-[270px]">
                    {item.thumbUrl || item.posterUrl ? (
                      <img
                        src={item.thumbUrl || item.posterUrl || ""}
                        alt={item.movieName}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-white/5 text-xs uppercase tracking-[0.24em] text-white/40">
                        Chưa có ảnh
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-between p-5 md:pr-20">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2 pr-12 text-[11px] font-medium text-white/70 md:pr-0">
                        {item.lang ? (
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 uppercase tracking-[0.2em]">
                            {item.lang}
                          </span>
                        ) : null}
                        {item.year ? (
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                            {item.year}
                          </span>
                        ) : null}
                      </div>

                      <div>
                        <h3 className="line-clamp-2 pr-10 text-lg font-bold text-white transition-colors group-hover:text-primary md:pr-0">
                          {item.movieName}
                        </h3>
                        {item.originName ? (
                          <p className="mt-1 line-clamp-1 text-sm text-white/45">
                            {item.originName}
                          </p>
                        ) : null}
                      </div>

                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-white">
                            {item.lastEpisodeName || "Đã mở chi tiết phim"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatWatchProgress(item.lastPositionSeconds)}
                            {formatDuration(item.durationSeconds)
                              ? ` / ${formatDuration(item.durationSeconds)}`
                              : ""}
                          </p>
                        </div>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-red-500 transition-[width] duration-300"
                            style={{
                              width: `${resolveProgressPercent(
                                item.lastPositionSeconds,
                                item.durationSeconds,
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-end justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock3 className="h-3.5 w-3.5" />
                        <span>{formatHistoryTime(item.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
        {historyQuery.data?.length ? (
          <PaginationControls
            currentPage={historyPage}
            totalPages={historyTotalPages}
            onPageChange={setHistoryPage}
          />
        ) : null}
      </section>

      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Xác nhận xóa phim khỏi lịch sử"
        description={`Bạn có chắc chắn muốn xóa \"${pendingDeleteItem?.movieName ?? "mục này"}\" khỏi lịch sử xem không?`}
        rememberChoice={rememberChoice}
        onRememberChoiceChange={setRememberChoice}
        onConfirm={handleConfirmRemoveHistory}
        isPending={removeHistoryMutation.isPending}
      />
    </div>
  );
};

export default WishlistPage;
