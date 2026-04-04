import { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import { PlayCircle } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/lib/api";
import { useAuth } from "@/shared/auth/AuthContext";
import { buildWatchUrl } from "@/shared/lib/watch";
import type { EpisodeServer } from "@/shared/types/api";
import PageNavigation from "@/shared/components/PageNavigation";

const parseIndex = (value: string | null) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
};

const getEpisodeLabel = (episodeName: string | undefined, episodeIndex: number) =>
  episodeName || `Tập ${episodeIndex + 1}`;

const findEpisodeSelectionByName = (
  episodes: EpisodeServer[],
  episodeName: string | null | undefined,
) => {
  const target = episodeName?.trim();
  if (!target) {
    return null;
  }

  for (let serverIndex = 0; serverIndex < episodes.length; serverIndex += 1) {
    const serverEpisodes = episodes[serverIndex]?.server_data ?? [];
    for (let episodeIndex = 0; episodeIndex < serverEpisodes.length; episodeIndex += 1) {
      if (getEpisodeLabel(serverEpisodes[episodeIndex]?.name, episodeIndex) === target) {
        return { serverIndex, episodeIndex };
      }
    }
  }

  return null;
};

const stripHtml = (value: unknown) =>
  typeof value === "string" ? value.replace(/<[^>]+>/g, "").trim() : "";

const appendAutoplayParam = (url: string | undefined) => {
  if (!url) {
    return "";
  }

  try {
    const parsed = new URL(url);
    parsed.searchParams.set("autoplay", "1");
    parsed.searchParams.set("autoPlay", "1");
    return parsed.toString();
  } catch {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}autoplay=1&autoPlay=1`;
  }
};

const WatchPage = () => {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const resumeKeyRef = useRef<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const movieQuery = useQuery({
    queryKey: ["movie", slug],
    queryFn: () => api.movie(slug),
    enabled: Boolean(slug),
  });

  const historyQuery = useQuery({
    queryKey: ["history", token],
    queryFn: () => api.history(token as string),
    enabled: Boolean(token),
  });

  const movie = movieQuery.data?.movie;
  const rawMovie = movieQuery.data?.raw?.movie as Record<string, unknown> | undefined;
  const episodes = movieQuery.data?.episodes ?? [];

  const historyIdParam = (() => {
    const parsed = Number(searchParams.get("historyId"));
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  })();
  const selectedServerIndex = parseIndex(searchParams.get("server"));
  const selectedEpisodeIndex = parseIndex(searchParams.get("episode"));
  const hasExplicitServer = searchParams.has("server");
  const hasExplicitEpisode = searchParams.has("episode");
  const movieHistoryEntries = useMemo(
    () => (historyQuery.data ?? []).filter((item) => item.movieSlug === slug),
    [historyQuery.data, slug],
  );
  const latestMovieHistoryEntry = movieHistoryEntries[0] ?? null;

  const activeSelection = useMemo(() => {
    const firstServerIndex = episodes.findIndex((server) => (server.server_data?.length ?? 0) > 0);
    if (firstServerIndex === -1) {
      return null;
    }

    const resumedSelection =
      !hasExplicitServer && !hasExplicitEpisode
        ? findEpisodeSelectionByName(episodes, latestMovieHistoryEntry?.lastEpisodeName)
        : null;

    const preferredServerIndex =
      resumedSelection?.serverIndex ??
      (episodes[selectedServerIndex]?.server_data?.length ? selectedServerIndex : firstServerIndex);
    const server = episodes[preferredServerIndex];
    const serverEpisodes = server.server_data ?? [];
    const preferredEpisodeIndex = resumedSelection?.episodeIndex ?? selectedEpisodeIndex;
    const safeEpisodeIndex =
      serverEpisodes[preferredEpisodeIndex] !== undefined ? preferredEpisodeIndex : 0;
    const episode = serverEpisodes[safeEpisodeIndex];

    if (!episode) {
      return null;
    }

    return {
      server,
      serverEpisodes,
      serverIndex: preferredServerIndex,
      episode,
      episodeIndex: safeEpisodeIndex,
    };
  }, [
    episodes,
    hasExplicitEpisode,
    hasExplicitServer,
    latestMovieHistoryEntry?.lastEpisodeName,
    selectedEpisodeIndex,
    selectedServerIndex,
  ]);

  const currentEpisodeLabel = useMemo(
    () =>
      activeSelection
        ? getEpisodeLabel(activeSelection.episode.name, activeSelection.episodeIndex)
        : null,
    [activeSelection],
  );

  const activeHistoryEntry = useMemo(() => {
    if (!movieHistoryEntries.length) {
      return null;
    }

    if (historyIdParam) {
      return movieHistoryEntries.find((item) => item.id === historyIdParam) ?? null;
    }

    if (hasExplicitServer || hasExplicitEpisode) {
      const byIndices = movieHistoryEntries.find(
        (item) =>
          item.lastServerIndex === selectedServerIndex &&
          item.lastEpisodeIndex === selectedEpisodeIndex,
      );

      if (byIndices) {
        return byIndices;
      }
    }

    if (currentEpisodeLabel) {
      const byName = movieHistoryEntries.find(
        (item) => item.lastEpisodeName === currentEpisodeLabel,
      );

      if (byName) {
        return byName;
      }
    }

    return latestMovieHistoryEntry;
  }, [
    currentEpisodeLabel,
    hasExplicitEpisode,
    hasExplicitServer,
    historyIdParam,
    latestMovieHistoryEntry,
    movieHistoryEntries,
    selectedEpisodeIndex,
    selectedServerIndex,
  ]);

  useEffect(() => {
    if (!activeSelection) {
      return;
    }

    const currentServer = searchParams.get("server");
    const currentEpisode = searchParams.get("episode");
    const normalizedServer = String(activeSelection.serverIndex);
    const normalizedEpisode = String(activeSelection.episodeIndex);

    if (currentServer === normalizedServer && currentEpisode === normalizedEpisode) {
      return;
    }

    const next = new URLSearchParams(searchParams);
    next.set("server", normalizedServer);
    next.set("episode", normalizedEpisode);
    setSearchParams(next, { replace: true });
  }, [activeSelection, searchParams, setSearchParams]);

  useEffect(() => {
    if (!token || !movie || !activeSelection?.episode) {
      return;
    }

    if (activeSelection.episode.link_m3u8 || !activeSelection.episode.link_embed) {
      return;
    }

    void api.saveHistory(token, {
      movieSlug: movie.slug,
      movieName: movie.name,
      originName: movie.originName,
      posterUrl: movie.posterUrl,
      thumbUrl: movie.thumbUrl,
      quality: movie.quality,
      lang: movie.lang,
      year: movie.year ? String(movie.year) : null,
      lastEpisodeName: getEpisodeLabel(activeSelection.episode.name, activeSelection.episodeIndex),
      lastPositionSeconds:
        activeHistoryEntry?.lastEpisodeName ===
        getEpisodeLabel(activeSelection.episode.name, activeSelection.episodeIndex)
          ? activeHistoryEntry.lastPositionSeconds ?? 0
          : 0,
      lastServerIndex: activeSelection.serverIndex,
      lastEpisodeIndex: activeSelection.episodeIndex,
      durationSeconds: activeHistoryEntry?.durationSeconds ?? null,
    });
  }, [activeHistoryEntry, activeSelection, movie, token]);

  useEffect(() => {
    const video = videoRef.current;
    const currentEpisode = activeSelection?.episode;

    setPlaybackError(null);

    if (!video || !currentEpisode?.link_m3u8) {
      return;
    }

    let hls: Hls | null = null;
    let lastSavedPosition = -1;

    const attemptAutoplay = () => {
      void video.play().catch(() => {
      });
    };

    const persistProgress = () => {
      if (!token || !movie || !activeSelection) {
        return;
      }

      const position = Math.max(0, Math.floor(video.currentTime || 0));
      if (position === lastSavedPosition) {
        return;
      }

      lastSavedPosition = position;

      void api.saveHistory(token, {
        movieSlug: movie.slug,
        movieName: movie.name,
        originName: movie.originName,
        posterUrl: movie.posterUrl,
        thumbUrl: movie.thumbUrl,
        quality: movie.quality,
        lang: movie.lang,
        year: movie.year ? String(movie.year) : null,
        lastEpisodeName: currentEpisodeLabel,
        lastPositionSeconds: position,
        lastServerIndex: activeSelection.serverIndex,
        lastEpisodeIndex: activeSelection.episodeIndex,
        durationSeconds: Number.isFinite(video.duration)
          ? Math.floor(video.duration)
          : activeHistoryEntry?.durationSeconds ?? null,
      });
    };

    const restoreProgress = () => {
      if (!currentEpisodeLabel || !activeHistoryEntry?.lastPositionSeconds) {
        resumeKeyRef.current = `${slug}:${activeSelection.serverIndex}:${activeSelection.episodeIndex}`;
        return;
      }

      if (activeHistoryEntry.lastEpisodeName !== currentEpisodeLabel) {
        resumeKeyRef.current = `${slug}:${activeSelection.serverIndex}:${activeSelection.episodeIndex}`;
        return;
      }

      const resumeKey = `${slug}:${activeSelection.serverIndex}:${activeSelection.episodeIndex}`;
      if (resumeKeyRef.current === resumeKey) {
        return;
      }

      const duration = Number.isFinite(video.duration) ? video.duration : null;
      const safePosition =
        duration && activeHistoryEntry.lastPositionSeconds >= duration - 3
          ? Math.max(duration - 8, 0)
          : activeHistoryEntry.lastPositionSeconds;

      video.currentTime = safePosition;
      lastSavedPosition = Math.floor(safePosition);
      resumeKeyRef.current = resumeKey;
    };

    const handleLoadedMetadata = () => {
      restoreProgress();
      attemptAutoplay();
    };

    const handleTimeUpdate = () => {
      const position = Math.floor(video.currentTime || 0);
      if (position >= 5 && position - lastSavedPosition >= 5) {
        persistProgress();
      }
    };

    const handlePause = () => {
      persistProgress();
    };

    const handleBeforeUnload = () => {
      persistProgress();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        persistProgress();
      }
    };

    video.autoplay = true;
    video.playsInline = true;

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("pause", handlePause);
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(currentEpisode.link_m3u8);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        attemptAutoplay();
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setPlaybackError("Không thể phát luồng m3u8 trên trình duyệt này.");
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = currentEpisode.link_m3u8;
      attemptAutoplay();
    } else {
      setPlaybackError("Trình duyệt không hỗ trợ phát luồng m3u8.");
    }

    return () => {
      persistProgress();
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("pause", handlePause);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (hls) {
        hls.destroy();
      }
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
    };
  }, [activeHistoryEntry, activeSelection, currentEpisodeLabel, movie, slug, token]);

  if (movieQuery.isLoading) {
    return (
      <div className="layout-padding flex min-h-[70vh] items-center justify-center text-muted-foreground">
        Đang tải trình phát phim...
      </div>
    );
  }

  if (movieQuery.error || !movie || !activeSelection) {
    return (
      <div className="layout-padding flex min-h-[70vh] items-center justify-center">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-white">Không thể tải trang xem phim.</p>
          <Link
            to={`/movie/${slug}`}
            className="mt-4 inline-flex rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white"
          >
            Quay lại chi tiết phim
          </Link>
        </div>
      </div>
    );
  }

  const { episode, server, serverIndex, episodeIndex } = activeSelection;
  const prefersInternalPlayer = Boolean(episode.link_m3u8);
  const description =
    stripHtml(rawMovie?.content) || "Nội dung phim đang được cập nhật từ nguồn dữ liệu.";
  const countries = movie.countries?.join(", ") || "Đang cập nhật";
  const categories = movie.categories ?? [];

  return (
    <div className="content-shell-wide layout-padding py-8">
      <PageNavigation
        backTo={`/movie/${movie.slug}`}
        backLabel="Chi tiết phim"
        items={[
          { label: "Trang chủ", to: "/" },
          { label: movie.name, to: `/movie/${movie.slug}` },
          { label: episode.name || `Tập ${episodeIndex + 1}` },
        ]}
      />

      <div className="mb-6">
        <div>
          <h1 className="mt-2 text-3xl font-black text-white">{movie.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {episode.name || `Tập ${episodeIndex + 1}`} • {server.server_name || "Nguồn phát"}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-white/10 bg-black/40 shadow-2xl">
        <div className="aspect-video w-full bg-black">
          {prefersInternalPlayer ? (
            <video
              ref={videoRef}
              controls
              playsInline
              autoPlay
              className="h-full w-full bg-black"
            />
          ) : episode.link_embed ? (
            <iframe
              src={appendAutoplayParam(episode.link_embed)}
              title={`${movie.name} - ${episode.name || `Tập ${episodeIndex + 1}`}`}
              className="h-full w-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Không có nguồn phát cho tập này.
            </div>
          )}
        </div>
      </div>

      {playbackError ? (
        <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {playbackError}
        </div>
      ) : null}

      {!prefersInternalPlayer && episode.link_embed ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted-foreground">
          Nguồn phát này dùng trình phát nhúng bên ngoài nên website chỉ lưu được tập đang xem,
          không lưu chính xác số giây phát.
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
        <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-primary">Nội dung phim</p>
          <h2 className="mt-3 text-2xl font-black text-white">
            {movie.originName || movie.name}
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">{description}</p>
        </section>

        <aside className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-primary">Thông tin nhanh</p>
          <div className="mt-5 space-y-4 text-sm">
            <div className="flex items-start justify-between gap-4">
              <span className="text-muted-foreground">Năm phát hành</span>
              <span className="text-right text-white">{movie.year || "Đang cập nhật"}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="text-muted-foreground">Ngôn ngữ</span>
              <span className="text-right text-white">{movie.lang || "Vietsub"}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="text-muted-foreground">Chất lượng</span>
              <span className="text-right text-white">{movie.quality || "HD"}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="text-muted-foreground">Quốc gia</span>
              <span className="text-right text-white">{countries}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="text-muted-foreground">Tình trạng</span>
              <span className="text-right text-white">
                {movie.episodeCurrent || "Đang cập nhật"}
              </span>
            </div>
          </div>

          {categories.length ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {categories.map((category) => (
                <span
                  key={category}
                  className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-medium text-white"
                >
                  {category}
                </span>
              ))}
            </div>
          ) : null}
        </aside>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-bold text-white">Chọn nguồn phát</h2>
          <div className="flex flex-col gap-3">
            {episodes.map((item, index) => (
              <button
                key={`${item.server_name || "server"}-${index}`}
                type="button"
                onClick={() => navigate(buildWatchUrl(movie.slug, index, 0))}
                disabled={!item.server_data?.length}
                className={`rounded-2xl px-4 py-3 text-left text-sm transition-colors ${
                  serverIndex === index
                    ? "bg-primary text-white"
                    : "bg-black/30 text-white hover:bg-white/10"
                } disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {item.server_name || `Nguồn ${index + 1}`}
              </button>
            ))}
          </div>
        </aside>

        <section className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-white">Danh sách tập</h2>
            <span className="text-sm text-muted-foreground">
              {activeSelection.serverEpisodes.length} tập khả dụng
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {activeSelection.serverEpisodes.map((item, index) => (
              <button
                key={`${item.slug || item.name || "episode"}-${index}`}
                type="button"
                onClick={() => navigate(buildWatchUrl(movie.slug, serverIndex, index))}
                className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                  episodeIndex === index
                    ? "border-primary bg-primary/15 text-white"
                    : "border-white/10 bg-black/20 text-muted-foreground hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <PlayCircle className="h-4 w-4 shrink-0" />
                  <span className="line-clamp-1 text-sm font-medium">
                    {item.name || `Tập ${index + 1}`}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default WatchPage;
