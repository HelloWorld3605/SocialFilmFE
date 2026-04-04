import { useQuery } from "@tanstack/react-query";
import { Clock3, Play, Sparkles } from "lucide-react";
import { Navigate, Link } from "react-router-dom";
import MovieCard from "@/shared/components/CardFilm/MovieCard";
import { useAuth } from "@/shared/auth/AuthContext";
import { api } from "@/shared/lib/api";
import { buildWatchUrl } from "@/shared/lib/watch";
import PageNavigation from "@/shared/components/PageNavigation";

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

const WishlistPage = () => {
  const { token, isAuthenticated, isReady } = useAuth();

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
        <p className="text-sm uppercase tracking-[0.3em] text-primary">Thư viện</p>
        <h1 className="mt-2 text-3xl font-black text-white">Danh sách xem sau</h1>
      </div>

      <section className="space-y-5">
        <h2 className="text-xl font-bold text-white">Đã lưu để xem sau</h2>
        {wishlistQuery.isLoading ? (
          <p className="text-muted-foreground">Đang tải danh sách đã lưu...</p>
        ) : null}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {wishlistQuery.data?.map((item) => (
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
      </section>

      <section className="space-y-5 rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Tiếp tục xem
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Lịch sử xem gần đây</h2>
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
            <p className="text-lg font-semibold text-white">Chưa có lịch sử xem</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Khi bạn mở phim và xem trên trình phát, lịch sử sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {historyQuery.data?.map((item) => (
            <article
              key={item.id}
              className="group overflow-hidden rounded-[28px] border border-white/10 bg-black/25 transition-all duration-300 hover:border-primary/35 hover:bg-black/35"
            >
              <div className="flex min-h-[220px]">
                <Link
                  to={`/movie/${item.movieSlug}`}
                  className="relative w-[132px] flex-none overflow-hidden bg-black/40"
                >
                  {item.posterUrl || item.thumbUrl ? (
                    <img
                      src={item.posterUrl || item.thumbUrl || ""}
                      alt={item.movieName}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-white/5 text-xs uppercase tracking-[0.24em] text-white/40">
                      Chưa có ảnh
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col justify-between p-5">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-white/70">
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
                      <Link to={`/movie/${item.movieSlug}`} className="block">
                        <h3 className="line-clamp-2 text-lg font-bold text-white transition-colors group-hover:text-primary">
                          {item.movieName}
                        </h3>
                      </Link>
                      {item.originName ? (
                        <p className="mt-1 line-clamp-1 text-sm text-white/45">
                          {item.originName}
                        </p>
                      ) : null}
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                      <p className="text-sm font-semibold text-white">
                        {item.lastEpisodeName || "Đã mở chi tiết phim"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatWatchProgress(item.lastPositionSeconds)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span>{formatHistoryTime(item.updatedAt)}</span>
                    </div>

                    <Link
                      to={buildWatchUrl(item.movieSlug)}
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      Xem tiếp
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default WishlistPage;
