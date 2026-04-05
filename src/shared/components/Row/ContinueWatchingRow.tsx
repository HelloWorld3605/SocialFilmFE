import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Clock3, Play, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/shared/auth/AuthContext";
import ConfirmDeleteDialog from "@/shared/components/ConfirmDeleteDialog";
import { api } from "@/shared/lib/api";
import {
  getSkipHistoryDeleteConfirm,
  setSkipHistoryDeleteConfirm,
} from "@/shared/lib/deleteConfirmPreference";
import { buildWatchUrl } from "@/shared/lib/watch";
import { Skeleton } from "@/shared/components/ui/skeleton";
import type { WatchHistoryItem } from "@/shared/types/api";

interface ContinueWatchingRowProps {
  items: WatchHistoryItem[];
  isLoading?: boolean;
}

const formatHistoryTime = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

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

const ContinueWatchingSkeleton = () => (
  <section className="relative pb-8 pt-10">
    <div className="layout-padding mb-6 space-y-3">
      <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
        Tiếp tục xem
      </div>
      <Skeleton className="h-10 w-72 max-w-full" />
      <Skeleton className="h-4 w-80 max-w-full" />
    </div>
    <div className="layout-padding flex gap-4 overflow-hidden pt-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={`continue-watching-skeleton-${index}`}
          className="h-[278px] w-[300px] shrink-0 rounded-[28px] border border-white/10 bg-white/[0.03] px-4 pb-7 pt-4 md:w-[360px]"
        >
          <div className="flex h-full gap-4">
            <Skeleton className="h-full w-20 shrink-0 rounded-2xl md:w-24" />
            <div className="flex h-full min-w-0 flex-1 flex-col pb-1">
              <Skeleton className="h-4 w-24" />
              <div className="mt-3 space-y-2">
                <Skeleton className="h-6 w-4/5" />
                <Skeleton className="h-6 w-3/5" />
              </div>
              <div className="mt-2 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="mt-auto space-y-3">
                <Skeleton className="h-12 w-full rounded-2xl" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-9 w-24 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

const ContinueWatchingRow = ({
  items,
  isLoading = false,
}: ContinueWatchingRowProps) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const [removingHistoryId, setRemovingHistoryId] = useState<number | null>(
    null,
  );
  const [pendingDeleteItem, setPendingDeleteItem] =
    useState<WatchHistoryItem | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rememberChoice, setRememberChoice] = useState(false);
  const [skipDeleteConfirm, setSkipDeleteConfirm] = useState(() =>
    getSkipHistoryDeleteConfirm(),
  );

  const removeHistoryMutation = useMutation({
    mutationFn: async (historyId: number) => {
      if (!token) {
        throw new Error("Bạn cần đăng nhập để xoá lịch sử xem.");
      }

      setRemovingHistoryId(historyId);
      await api.removeHistory(token, historyId);
      return historyId;
    },
    onSuccess: (historyId) => {
      if (!token) {
        return;
      }

      queryClient.setQueryData<WatchHistoryItem[]>(
        ["history", token],
        (current) => current?.filter((item) => item.id !== historyId) ?? [],
      );
    },
    onSettled: () => {
      setRemovingHistoryId(null);
    },
  });

  const handleDeleteRequest = (item: WatchHistoryItem) => {
    if (skipDeleteConfirm) {
      removeHistoryMutation.mutate(item.id);
      return;
    }

    setRememberChoice(false);
    setPendingDeleteItem(item);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!pendingDeleteItem) {
      return;
    }

    if (rememberChoice) {
      setSkipHistoryDeleteConfirm(true);
      setSkipDeleteConfirm(true);
    }

    removeHistoryMutation.mutate(pendingDeleteItem.id);
    setConfirmOpen(false);
    setPendingDeleteItem(null);
  };

  if (isLoading) {
    return <ContinueWatchingSkeleton />;
  }

  if (!items.length) {
    return null;
  }

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) {
      return;
    }

    scrollRef.current.scrollBy({
      left: direction === "left" ? -420 : 420,
      behavior: "smooth",
    });
  };

  return (
    <section className="relative pb-8 pt-10">
      <div className="layout-padding mb-6 flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            Tiếp tục xem
          </div>
          <div>
            <h2 className="text-2xl font-black text-white sm:text-3xl">
              Quay lại đúng bộ phim bạn đang dở
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Mở lại đúng tập và tiến độ gần nhất từ lịch sử xem của bạn.
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => scroll("left")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors hover:border-primary/40 hover:bg-primary/10"
            aria-label="Cuộn sang trái"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors hover:border-primary/40 hover:bg-primary/10"
            aria-label="Cuộn sang phải"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="layout-padding flex gap-4 overflow-x-auto overflow-y-hidden pb-3 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => {
          const progressPercent = resolveProgressPercent(
            item.lastPositionSeconds,
            item.durationSeconds,
          );
          const durationLabel = formatDuration(item.durationSeconds);
          const posterImage = item.posterUrl || item.thumbUrl || "";

          return (
            <article
              key={item.id}
              className="group relative h-[278px] w-[300px] shrink-0 overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))] px-4 pb-7 pt-4 shadow-[0_18px_55px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_24px_80px_rgba(0,0,0,0.3)] focus-within:-translate-y-1 focus-within:border-primary/35 focus-within:shadow-[0_24px_80px_rgba(0,0,0,0.3)] md:w-[360px]"
            >
              <button
                type="button"
                onClick={() => handleDeleteRequest(item)}
                disabled={!token || removingHistoryId === item.id}
                className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white/75 transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Xóa khỏi lịch sử xem"
                title="Xóa khỏi lịch sử xem"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <Link
                to={buildWatchUrl(
                  item.movieSlug,
                  item.lastServerIndex ?? undefined,
                  item.lastEpisodeIndex ?? undefined,
                  item.id,
                )}
                className="flex h-full gap-4 outline-none"
              >
                <div className="relative h-full w-20 shrink-0 overflow-hidden rounded-[22px] bg-black/30 md:w-24">
                  {posterImage ? (
                    <img
                      src={posterImage}
                      alt={item.movieName}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04] group-focus-within:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-white/5 text-[10px] uppercase tracking-[0.24em] text-white/40">
                      No Image
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                </div>

                <div className="flex h-full min-w-0 flex-1 flex-col pb-1">
                  <div className="flex min-h-8 min-w-0 items-start gap-2 overflow-hidden pt-0.5 text-[11px] font-medium text-white/70">
                    {item.lang ? (
                      <span className="max-w-full truncate rounded-full border border-white/10 bg-black/35 px-2.5 py-1 uppercase tracking-[0.14em]">
                        {item.lang}
                      </span>
                    ) : null}
                    {item.year ? (
                      <span className="shrink-0 rounded-full border border-white/10 bg-black/35 px-2.5 py-1">
                        {item.year}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-3 min-h-[3.25rem] line-clamp-2 text-lg font-bold leading-6 text-white transition-colors group-hover:text-primary group-focus-within:text-primary">
                    {item.movieName}
                  </h3>
                  <p className="mt-1 min-h-[2.25rem] line-clamp-2 text-sm leading-[1.125rem] text-white/55">
                    {item.lastEpisodeName ||
                      "Tiếp tục từ vị trí gần nhất của bạn"}
                  </p>

                  <div className="mt-auto rounded-[22px] border border-primary/10 bg-[linear-gradient(180deg,rgba(229,9,20,0.12),rgba(255,255,255,0.02))] p-3 shadow-inner shadow-black/20">
                    <div className="flex items-center justify-between gap-3 text-xs font-medium text-white/80">
                      <span>
                        {formatDuration(item.lastPositionSeconds) || "0:00"}
                        {durationLabel ? ` / ${durationLabel}` : ""}
                      </span>
                      <span className="rounded-full bg-black/35 px-2 py-1 text-[11px] text-primary">
                        {Math.round(progressPercent)}%
                      </span>
                    </div>
                    <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#ff7b72,#e50914)] shadow-[0_0_18px_rgba(229,9,20,0.55)] transition-[width] duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3.5 flex min-w-0 items-center gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-2 text-xs text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span className="truncate">
                        {formatHistoryTime(item.updatedAt)}
                      </span>
                    </div>

                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/20 bg-primary px-3.5 py-2 text-[11px] font-semibold text-white shadow-[0_10px_24px_rgba(229,9,20,0.22)] transition-colors group-hover:bg-primary/90 group-focus-within:bg-primary/90">
                      <Play className="h-3.5 w-3.5 fill-current" />
                      Xem tiếp
                    </span>
                  </div>
                </div>
              </Link>
            </article>
          );
        })}
      </div>

      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Xác nhận xóa phim khỏi lịch sử"
        description={`Bạn có chắc chắn muốn xóa \"${pendingDeleteItem?.movieName ?? "mục này"}\" khỏi lịch sử xem không?`}
        rememberChoice={rememberChoice}
        onRememberChoiceChange={setRememberChoice}
        onConfirm={handleConfirmDelete}
        isPending={removeHistoryMutation.isPending}
      />
    </section>
  );
};

export default ContinueWatchingRow;
