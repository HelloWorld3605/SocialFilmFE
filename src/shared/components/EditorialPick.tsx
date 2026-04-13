import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clapperboard, Play, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "@/shared/lib/api";
import { buildWatchUrl } from "@/shared/lib/watch";
import { Skeleton } from "@/shared/components/ui/skeleton";
import type { MovieSummary } from "@/shared/types/api";

interface EditorialPickProps {
  movie?: MovieSummary | null;
}

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const clampText = (value: string, limit = 420) => {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit).replace(/\s+\S*$/, "")}...`;
};

const EditorialPick = ({ movie }: EditorialPickProps) => {
  const navigate = useNavigate();
  const detailQuery = useQuery({
    queryKey: ["editorial-pick", movie?.slug],
    queryFn: () => api.movie(movie!.slug),
    enabled: Boolean(movie?.slug),
    staleTime: 1000 * 60 * 10,
  });

  const resolvedMovie = detailQuery.data?.movie ?? movie ?? null;
  const rawMovie = detailQuery.data?.raw?.movie as Record<string, unknown> | undefined;
  const synopsis = useMemo(() => {
    const rawContent =
      rawMovie && typeof rawMovie.content === "string" ? rawMovie.content : "";
    const cleanContent = stripHtml(rawContent);

    if (cleanContent) {
      return clampText(cleanContent);
    }

    if (resolvedMovie?.originName?.trim()) {
      return resolvedMovie.originName.trim();
    }

    return "Nội dung chi tiết của bộ phim này đang được đồng bộ từ nguồn phát.";
  }, [rawMovie, resolvedMovie]);

  const metadataItems = useMemo(
    () => [
      {
        label: "Thể loại",
        value:
          resolvedMovie?.categories?.slice(0, 3).join(" • ") || "Đang cập nhật",
      },
      {
        label: "Quốc gia",
        value:
          resolvedMovie?.countries?.slice(0, 2).join(" • ") || "Đang cập nhật",
      },
      {
        label: "Phiên bản",
        value:
          [resolvedMovie?.quality, resolvedMovie?.lang]
            .filter(Boolean)
            .join(" • ") || "Đang cập nhật",
      },
      {
        label: "Tình trạng",
        value: resolvedMovie?.episodeCurrent || "Đang cập nhật",
      },
    ],
    [resolvedMovie],
  );

  if (!resolvedMovie) {
    return null;
  }

  const backdropImage = resolvedMovie.thumbUrl || resolvedMovie.posterUrl || "";
  const posterImage = resolvedMovie.posterUrl || resolvedMovie.thumbUrl || "";

  return (
    <section className="layout-margin relative my-10 overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(229,9,20,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.24)] md:p-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            <Clapperboard className="h-3.5 w-3.5" />
            Biên tập chọn
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black leading-tight text-white md:text-4xl">
              {resolvedMovie.name}
            </h2>
            {resolvedMovie.originName ? (
              <p className="text-sm uppercase tracking-[0.22em] text-white/50">
                {resolvedMovie.originName}
              </p>
            ) : null}
          </div>

          {detailQuery.isLoading && !detailQuery.data ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          ) : (
            <p className="max-w-3xl text-sm leading-7 text-white/74 md:text-[15px]">
              {synopsis}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {metadataItems.map((item) => (
              <div
                key={item.label}
                className="rounded-[24px] border border-white/10 bg-black/20 px-4 py-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
                  {item.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-white">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => navigate(buildWatchUrl(resolvedMovie.slug))}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              <Play className="h-4 w-4 fill-current" />
              Xem ngay
            </button>
            <button
              type="button"
              onClick={() => navigate(`/movie/${resolvedMovie.slug}`)}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-primary/35 hover:bg-primary/10"
            >
              <Plus className="h-4 w-4" />
              Chi tiết
            </button>
          </div>
        </div>

        <div className="relative min-h-[360px] overflow-hidden rounded-[30px] border border-white/10 bg-black/40 shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
          {backdropImage ? (
            <img
              src={backdropImage}
              alt={resolvedMovie.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(229,9,20,0.22),transparent_32%),linear-gradient(180deg,#171717,#050505)]" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(229,9,20,0.18),transparent_30%)]" />

          {posterImage ? (
            <div className="absolute right-5 top-5 hidden w-44 overflow-hidden rounded-[24px] border border-white/10 bg-black/40 shadow-2xl lg:block">
              <img
                src={posterImage}
                alt={resolvedMovie.name}
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}

          <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">
            <div className="flex flex-wrap gap-2">
              {resolvedMovie.categories?.slice(0, 4).map((category) => (
                <span
                  key={category}
                  className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs font-medium text-white/85 backdrop-blur-xl"
                >
                  {category}
                </span>
              ))}
            </div>

            <div className="mt-4 max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
                Điểm nhấn
              </p>
              <p className="mt-2 text-sm leading-6 text-white/82">
                {resolvedMovie.year
                  ? `${resolvedMovie.year} • `
                  : ""}
                {resolvedMovie.episodeCurrent || "Đang cập nhật"} •{" "}
                {resolvedMovie.lang || "Vietsub"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditorialPick;
