import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
} from "react";
import Hls from "hls.js";
import * as SliderPrimitive from "@radix-ui/react-slider";
import {
  Check,
  Maximize,
  Minimize,
  Pause,
  Play,
  PlayCircle,
  RotateCcw,
  RotateCw,
  Settings2,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/lib/api";
import { useAuth } from "@/shared/auth/AuthContext";
import { buildWatchUrl } from "@/shared/lib/watch";
import type { EpisodeServer, WatchHistoryItem } from "@/shared/types/api";
import PageNavigation from "@/shared/components/PageNavigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { cn } from "@/shared/utils/utils";

const parseIndex = (value: string | null) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
};

const getEpisodeLabel = (
  episodeName: string | undefined,
  episodeIndex: number,
) => episodeName || `Tập ${episodeIndex + 1}`;

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
    for (
      let episodeIndex = 0;
      episodeIndex < serverEpisodes.length;
      episodeIndex += 1
    ) {
      if (
        getEpisodeLabel(serverEpisodes[episodeIndex]?.name, episodeIndex) ===
        target
      ) {
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

const PLAYBACK_SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2];

type SaveHistoryReason =
  | "EMBED_OPEN"
  | "PERIODIC"
  | "PAUSE"
  | "ENDED"
  | "BACKGROUND"
  | "EXIT";

const formatPlayerTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
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

const getHistoryUpdatedAtValue = (item: WatchHistoryItem) => {
  const timestamp = Date.parse(item.updatedAt);
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const upsertHistoryCacheItem = (
  current: WatchHistoryItem[] | undefined,
  nextItem: WatchHistoryItem,
) => {
  const nextEpisodeName = nextItem.lastEpisodeName ?? null;
  return [nextItem, ...(current ?? [])]
    .filter(
      (item, index, items) =>
        items.findIndex(
          (candidate) =>
            candidate.id === item.id ||
            (candidate.movieSlug === item.movieSlug &&
              (candidate.lastEpisodeName ?? null) ===
                (item.lastEpisodeName ?? null)),
        ) === index,
    )
    .sort((left, right) => {
      const updatedAtDiff =
        getHistoryUpdatedAtValue(right) - getHistoryUpdatedAtValue(left);
      if (updatedAtDiff !== 0) {
        return updatedAtDiff;
      }

      return right.id - left.id;
    });
};

interface PlayerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
}

const PlayerButton = forwardRef<HTMLButtonElement, PlayerButtonProps>(
  ({ children, className, title, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      title={title}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white transition-colors hover:border-red-400/60 hover:bg-white/14",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);

PlayerButton.displayName = "PlayerButton";

interface PlayerSliderProps {
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  max?: number;
  onInteractionEnd?: () => void;
  onInteractionStart?: () => void;
  onValueChange: (value: number) => void;
  onValueCommit?: (value: number) => void;
  step?: number;
  thumbClassName?: string;
  trackClassName?: string;
  value: number;
}

const PlayerSlider = ({
  ariaLabel,
  className,
  disabled,
  max = 100,
  onInteractionEnd,
  onInteractionStart,
  onValueChange,
  onValueCommit,
  step = 1,
  thumbClassName,
  trackClassName,
  value,
}: PlayerSliderProps) => (
  <SliderPrimitive.Root
    aria-label={ariaLabel}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className,
    )}
    disabled={disabled}
    max={max}
    step={step}
    value={[value]}
    onPointerCancelCapture={onInteractionEnd}
    onPointerDownCapture={onInteractionStart}
    onPointerUpCapture={onInteractionEnd}
    onValueChange={(next) => onValueChange(next[0] ?? 0)}
    onValueCommit={(next) => onValueCommit?.(next[0] ?? 0)}
  >
    <SliderPrimitive.Track
      className={cn(
        "relative h-1.5 w-full grow overflow-hidden rounded-full bg-white/20",
        trackClassName,
      )}
    >
      <SliderPrimitive.Range className="absolute h-full rounded-full bg-red-500" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className={cn(
        "block h-3.5 w-3.5 rounded-full border-2 border-white bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.2)] transition-[width,height,transform,box-shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70 disabled:pointer-events-none disabled:opacity-50",
        thumbClassName,
      )}
    />
  </SliderPrimitive.Root>
);

const WatchPage = () => {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const preferredQualityRef = useRef(-1);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isWatchPageMountedRef = useRef(true);
  const resumeKeyRef = useRef<string | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsHideTimeoutRef = useRef<number | null>(null);
  const persistProgressRef = useRef<
    | ((reason?: SaveHistoryReason, options?: { keepalive?: boolean }) => void)
    | null
  >(null);
  const lastVolumeRef = useRef(1);
  const isProgressScrubbingRef = useRef(false);
  const progressWasPlayingRef = useRef(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProgressScrubbing, setIsProgressScrubbing] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [qualityOptions, setQualityOptions] = useState<
    Array<{ label: string; value: number }>
  >([]);
  const [selectedQuality, setSelectedQuality] = useState(-1);
  const [areControlsVisible, setAreControlsVisible] = useState(true);
  const [isPointerOverPlayer, setIsPointerOverPlayer] = useState(false);
  const [isInteractingWithControls, setIsInteractingWithControls] =
    useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const movieQuery = useQuery({
    queryKey: ["movie", slug],
    queryFn: () => api.movie(slug),
    enabled: Boolean(slug),
  });

  const historyQuery = useQuery({
    queryKey: ["history", token],
    queryFn: () => api.history(token as string),
    enabled: Boolean(token),
    refetchOnWindowFocus: false,
  });

  const movie = movieQuery.data?.movie;
  const rawMovie = movieQuery.data?.raw?.movie as
    | Record<string, unknown>
    | undefined;
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
    const firstServerIndex = episodes.findIndex(
      (server) => (server.server_data?.length ?? 0) > 0,
    );
    if (firstServerIndex === -1) {
      return null;
    }

    const resumedSelection =
      !hasExplicitServer && !hasExplicitEpisode
        ? findEpisodeSelectionByName(
            episodes,
            latestMovieHistoryEntry?.lastEpisodeName,
          )
        : null;

    const preferredServerIndex =
      resumedSelection?.serverIndex ??
      (episodes[selectedServerIndex]?.server_data?.length
        ? selectedServerIndex
        : firstServerIndex);
    const server = episodes[preferredServerIndex];
    const serverEpisodes = server.server_data ?? [];
    const preferredEpisodeIndex =
      resumedSelection?.episodeIndex ?? selectedEpisodeIndex;
    const safeEpisodeIndex =
      serverEpisodes[preferredEpisodeIndex] !== undefined
        ? preferredEpisodeIndex
        : 0;
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
        ? getEpisodeLabel(
            activeSelection.episode.name,
            activeSelection.episodeIndex,
          )
        : null,
    [activeSelection],
  );
  const prefersInternalPlayer = Boolean(activeSelection?.episode?.link_m3u8);

  useEffect(
    () => () => {
      isWatchPageMountedRef.current = false;
    },
    [],
  );

  const clearControlsHideTimer = () => {
    if (controlsHideTimeoutRef.current !== null) {
      window.clearTimeout(controlsHideTimeoutRef.current);
      controlsHideTimeoutRef.current = null;
    }
  };

  const startControlsHideTimer = () => {
    clearControlsHideTimer();

    if (!prefersInternalPlayer || isSettingsOpen || isInteractingWithControls) {
      return;
    }

    controlsHideTimeoutRef.current = window.setTimeout(() => {
      setAreControlsVisible(false);
    }, 4000);
  };

  const beginControlsInteraction = () => {
    if (!prefersInternalPlayer) {
      return;
    }

    clearControlsHideTimer();
    setAreControlsVisible(true);
    setIsInteractingWithControls(true);
  };

  const endControlsInteraction = () => {
    setIsInteractingWithControls(false);

    if (!prefersInternalPlayer) {
      return;
    }

    const isHoveringPlayer = playerRef.current?.matches(":hover") ?? false;
    if (!isFullscreen && !isSettingsOpen && !isHoveringPlayer) {
      clearControlsHideTimer();
      setAreControlsVisible(false);
      return;
    }

    setAreControlsVisible(true);
  };

  const beginProgressScrub = () => {
    beginControlsInteraction();

    const video = videoRef.current;
    isProgressScrubbingRef.current = true;
    setIsProgressScrubbing(true);
    progressWasPlayingRef.current = Boolean(
      video && !video.paused && !video.ended,
    );

    if (video && !video.paused && !video.ended) {
      video.pause();
    }
  };

  const finishProgressScrub = () => {
    if (!isProgressScrubbingRef.current) {
      endControlsInteraction();
      return;
    }

    const video = videoRef.current;
    const shouldResumePlayback = progressWasPlayingRef.current;

    isProgressScrubbingRef.current = false;
    progressWasPlayingRef.current = false;
    setIsProgressScrubbing(false);
    endControlsInteraction();

    if (shouldResumePlayback && video?.paused) {
      void video.play().catch(() => {});
    }
  };

  const activeHistoryEntry = useMemo(() => {
    if (!movieHistoryEntries.length) {
      return null;
    }

    if (historyIdParam) {
      return (
        movieHistoryEntries.find((item) => item.id === historyIdParam) ?? null
      );
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

    if (
      currentServer === normalizedServer &&
      currentEpisode === normalizedEpisode
    ) {
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

    if (
      activeSelection.episode.link_m3u8 ||
      !activeSelection.episode.link_embed
    ) {
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
      lastEpisodeName: getEpisodeLabel(
        activeSelection.episode.name,
        activeSelection.episodeIndex,
      ),
      lastPositionSeconds:
        activeHistoryEntry?.lastEpisodeName ===
        getEpisodeLabel(
          activeSelection.episode.name,
          activeSelection.episodeIndex,
        )
          ? (activeHistoryEntry.lastPositionSeconds ?? 0)
          : 0,
      lastServerIndex: activeSelection.serverIndex,
      lastEpisodeIndex: activeSelection.episodeIndex,
      durationSeconds: activeHistoryEntry?.durationSeconds ?? null,
      saveReason: "EMBED_OPEN",
    });
  }, [activeHistoryEntry, activeSelection, movie, token]);

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setIsProgressScrubbing(false);
    setSelectedQuality(preferredQualityRef.current);
    setQualityOptions([]);
    setAreControlsVisible(true);
    setIsInteractingWithControls(false);
    setIsPointerOverPlayer(false);
    setIsSettingsOpen(false);
    isProgressScrubbingRef.current = false;
    progressWasPlayingRef.current = false;
  }, [activeSelection?.episodeIndex, activeSelection?.serverIndex, slug]);

  useEffect(() => {
    const video = videoRef.current;
    const currentEpisode = activeSelection?.episode;

    setPlaybackError(null);

    if (!video || !currentEpisode?.link_m3u8) {
      return;
    }

    let hls: Hls | null = null;
    let lastSavedPosition = -1;

    const syncDuration = () => {
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
    };

    const syncVolumeState = () => {
      setVolume(video.volume);
      setIsMuted(video.muted || video.volume === 0);

      if (video.volume > 0) {
        lastVolumeRef.current = video.volume;
      }
    };

    const attemptAutoplay = () => {
      void video.play().catch(() => {});
    };

    const persistProgress = (
      reason: SaveHistoryReason = "PERIODIC",
      options?: { keepalive?: boolean },
    ) => {
      if (!token || !movie || !activeSelection) {
        return;
      }

      const position = Math.max(0, Math.floor(video.currentTime || 0));
      if (position === lastSavedPosition) {
        return;
      }

      lastSavedPosition = position;

      const payload = {
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
          : (activeHistoryEntry?.durationSeconds ?? null),
        saveReason: reason,
      } as const;

      void api
        .saveHistory(token, payload, options)
        .then((savedHistoryItem) => {
          if (!isWatchPageMountedRef.current) {
            queryClient.setQueryData<WatchHistoryItem[]>(
              ["history", token],
              (current) => upsertHistoryCacheItem(current, savedHistoryItem),
            );
          }
        })
        .catch(() => {
          if (!isWatchPageMountedRef.current) {
            void queryClient.invalidateQueries({
              queryKey: ["history", token],
            });
          }
        });
    };

    persistProgressRef.current = persistProgress;

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
      syncDuration();
      setCurrentTime(video.currentTime || 0);
      attemptAutoplay();
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime || 0);
      syncDuration();

      const position = Math.floor(video.currentTime || 0);
      if (position >= 5 && position - lastSavedPosition >= 5) {
        persistProgress("PERIODIC");
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
      persistProgress("PAUSE");
    };

    const handleEnded = () => {
      setIsPlaying(false);
      persistProgress("ENDED");
    };

    const handleDurationChange = () => {
      syncDuration();
    };

    const handleVolumeUpdate = () => {
      syncVolumeState();
    };

    const handleRateChange = () => {
      setPlaybackRate(video.playbackRate);
    };

    const handleBeforeUnload = () => {
      persistProgress("EXIT", { keepalive: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        persistProgress("BACKGROUND", { keepalive: true });
      }
    };

    video.autoplay = true;
    video.playsInline = true;
    video.volume = volume;
    video.muted = isMuted;
    video.playbackRate = playbackRate;

    syncVolumeState();
    setPlaybackRate(video.playbackRate);

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("volumechange", handleVolumeUpdate);
    video.addEventListener("ratechange", handleRateChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (Hls.isSupported()) {
      hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(currentEpisode.link_m3u8);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const nextQualityOptions = hls.levels.map((level, index) => ({
          value: index,
          label: level.height
            ? `${level.height}p`
            : `${Math.round(level.bitrate / 1000)} kbps`,
        }));

        const uniqueQualityOptions = nextQualityOptions.filter(
          (option, index, array) =>
            array.findIndex((item) => item.label === option.label) === index,
        );
        const persistedQuality = preferredQualityRef.current;
        const canRestoreQuality =
          persistedQuality >= 0 &&
          uniqueQualityOptions.some(
            (option) => option.value === persistedQuality,
          );

        setQualityOptions(uniqueQualityOptions);
        setSelectedQuality(canRestoreQuality ? persistedQuality : -1);

        if (canRestoreQuality) {
          hls.currentLevel = persistedQuality;
          hls.nextLevel = persistedQuality;
        } else {
          hls.currentLevel = -1;
          hls.nextLevel = -1;
        }

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
      persistProgressRef.current = null;
      persistProgress("EXIT", { keepalive: true });
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("volumechange", handleVolumeUpdate);
      video.removeEventListener("ratechange", handleRateChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (hls) {
        hls.destroy();
      }
      hlsRef.current = null;
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [
    activeHistoryEntry,
    activeSelection,
    currentEpisodeLabel,
    movie,
    slug,
    token,
  ]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === playerRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    return () => {
      clearControlsHideTimer();
    };
  }, []);

  useEffect(() => {
    if (
      !prefersInternalPlayer ||
      !areControlsVisible ||
      isSettingsOpen ||
      isInteractingWithControls
    ) {
      clearControlsHideTimer();
      return;
    }

    startControlsHideTimer();

    return () => {
      clearControlsHideTimer();
    };
  }, [
    areControlsVisible,
    isInteractingWithControls,
    isSettingsOpen,
    prefersInternalPlayer,
  ]);

  useEffect(() => {
    if (!isInteractingWithControls) {
      return;
    }

    const handlePointerRelease = () => {
      if (isProgressScrubbingRef.current) {
        finishProgressScrub();
        return;
      }

      endControlsInteraction();
    };

    window.addEventListener("pointerup", handlePointerRelease);
    window.addEventListener("pointercancel", handlePointerRelease);

    return () => {
      window.removeEventListener("pointerup", handlePointerRelease);
      window.removeEventListener("pointercancel", handlePointerRelease);
    };
  }, [endControlsInteraction, finishProgressScrub, isInteractingWithControls]);

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
  const description =
    stripHtml(rawMovie?.content) ||
    "Nội dung phim đang được cập nhật từ nguồn dữ liệu.";
  const countries = movie.countries?.join(", ") || "Đang cập nhật";
  const categories = movie.categories ?? [];
  const progressValue = duration > 0 ? Math.min(currentTime, duration) : 0;
  const showProgressTooltip = isProgressScrubbing && duration > 0;
  const progressTooltipLeft =
    duration > 0
      ? Math.min(Math.max((progressValue / duration) * 100, 6), 94)
      : 0;
  const VolumeIcon =
    isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const showPlayerChrome =
    !prefersInternalPlayer || areControlsVisible || isProgressScrubbing;

  const revealControls = () => {
    if (!prefersInternalPlayer) {
      return;
    }

    setAreControlsVisible(true);
    startControlsHideTimer();
  };

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    revealControls();

    if (video.paused || video.ended) {
      void video.play().catch(() => {});
      return;
    }

    video.pause();
  };

  const seekTo = (nextTime: number) => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const maxDuration = Number.isFinite(video.duration)
      ? video.duration
      : duration;
    const safeTime = Math.min(Math.max(nextTime, 0), maxDuration || 0);
    video.currentTime = safeTime;
    setCurrentTime(safeTime);
  };

  const seekBy = (seconds: number) => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    seekTo((video.currentTime || 0) + seconds);
    persistProgressRef.current?.("PERIODIC");
  };

  const handleProgressChange = (targetTime: number) => {
    if (!duration) {
      return;
    }

    seekTo(targetTime);
  };

  const handleProgressCommit = (targetTime: number) => {
    if (!duration) {
      return;
    }

    seekTo(targetTime);
    persistProgressRef.current?.("PERIODIC");
  };

  const handleVolumeChange = (value: number) => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const nextVolume = Math.min(Math.max(value / 100, 0), 1);
    video.volume = nextVolume;
    video.muted = nextVolume === 0;
    setVolume(nextVolume);
    setIsMuted(nextVolume === 0);

    if (nextVolume > 0) {
      lastVolumeRef.current = nextVolume;
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (video.muted || video.volume === 0) {
      const restoredVolume = lastVolumeRef.current || 1;
      video.muted = false;
      video.volume = restoredVolume;
      setVolume(restoredVolume);
      setIsMuted(false);
      return;
    }

    lastVolumeRef.current = video.volume || lastVolumeRef.current;
    video.muted = true;
    setIsMuted(true);
  };

  const changePlaybackRate = (nextRate: number) => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = nextRate;
    }

    setPlaybackRate(nextRate);
  };

  const changeQuality = (nextQuality: number) => {
    const hls = hlsRef.current;
    preferredQualityRef.current = nextQuality;
    setSelectedQuality(nextQuality);

    if (!hls) {
      return;
    }

    if (nextQuality < 0) {
      hls.currentLevel = -1;
      hls.nextLevel = -1;
      return;
    }

    hls.currentLevel = nextQuality;
    hls.nextLevel = nextQuality;
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await playerRef.current?.requestFullscreen();
        return;
      }

      await document.exitFullscreen();
    } catch {}
  };

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
            {episode.name || `Tập ${episodeIndex + 1}`} •{" "}
            {server.server_name || "Nguồn phát"}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-white/10 bg-black/40 shadow-2xl">
        <div
          ref={playerRef}
          className={cn(
            "relative h-[clamp(190px,36svh,250px)] w-full bg-black sm:aspect-video sm:h-auto",
            prefersInternalPlayer && !showPlayerChrome ? "cursor-none" : "",
          )}
          onMouseEnter={() => {
            setIsPointerOverPlayer(true);
            revealControls();
          }}
          onMouseMove={() => {
            if (!isPointerOverPlayer) {
              setIsPointerOverPlayer(true);
            }
            revealControls();
          }}
          onMouseLeave={() => {
            setIsPointerOverPlayer(false);
            if (isSettingsOpen || isInteractingWithControls) {
              return;
            }

            if (!isFullscreen) {
              clearControlsHideTimer();
              setAreControlsVisible(false);
              return;
            }

            startControlsHideTimer();
          }}
          onTouchStart={revealControls}
        >
          {prefersInternalPlayer ? (
            <>
              <div className="absolute inset-0 overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  preload="auto"
                  className={cn(
                    "h-full w-full cursor-pointer bg-black object-cover transition-[filter] duration-200 ease-out motion-reduce:transition-none",
                    isProgressScrubbing
                      ? "brightness-[0.72] saturate-75"
                      : "brightness-100",
                  )}
                  onClick={togglePlayback}
                />

                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.24)_0%,rgba(0,0,0,0.02)_30%,rgba(0,0,0,0.18)_58%,rgba(0,0,0,0.82)_100%)]" />
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity duration-200 ease-out motion-reduce:transition-none",
                    isProgressScrubbing ? "opacity-100" : "opacity-0",
                  )}
                />
              </div>

              <div
                className={cn(
                  "pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3 transition-all duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform] sm:p-5",
                  showPlayerChrome
                    ? "translate-y-0 opacity-100"
                    : "-translate-y-3 opacity-0",
                )}
              >
                <div className="rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-xl">
                  {episode.name || `Tập ${episodeIndex + 1}`}
                </div>
              </div>

              <div
                className={cn(
                  "absolute inset-x-0 bottom-0 z-20 px-2 pb-2 pt-0 transition-all duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform] sm:px-4 sm:pb-3",
                  showPlayerChrome
                    ? "translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-4 opacity-0",
                )}
              >
                <div className="relative px-1 sm:px-0">
                  {showProgressTooltip ? (
                    <div
                      className="pointer-events-none absolute -top-10 z-10 -translate-x-1/2 rounded-full border border-white/10 bg-black/80 px-3 py-1 text-xs font-semibold text-white shadow-lg backdrop-blur-xl"
                      style={{ left: `${progressTooltipLeft}%` }}
                    >
                      {formatPlayerTime(progressValue)}
                    </div>
                  ) : null}
                  <PlayerSlider
                    ariaLabel="Tiến trình phát phim"
                    className="group/progress-slider mb-3"
                    disabled={!duration}
                    max={duration || 0}
                    onInteractionEnd={finishProgressScrub}
                    onInteractionStart={beginProgressScrub}
                    onValueCommit={handleProgressCommit}
                    step={0.01}
                    thumbClassName="group-hover/progress-slider:h-[1.125rem] group-hover/progress-slider:w-[1.125rem]"
                    trackClassName="transition-[height] duration-200 ease-out group-hover/progress-slider:h-2"
                    value={progressValue}
                    onValueChange={handleProgressChange}
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <PlayerButton
                        onClick={() => seekBy(-10)}
                        title="Lùi 10 giây"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </PlayerButton>
                      <PlayerButton
                        className="h-10 w-10 bg-red-600 text-white hover:bg-red-500"
                        onClick={togglePlayback}
                        title={isPlaying ? "Tạm dừng" : "Phát"}
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4 fill-current" />
                        ) : (
                          <Play className="ml-0.5 h-4 w-4 fill-current" />
                        )}
                      </PlayerButton>
                      <PlayerButton
                        onClick={() => seekBy(10)}
                        title="Tua tới 10 giây"
                      >
                        <RotateCw className="h-4 w-4" />
                      </PlayerButton>

                      <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/6 px-2.5 py-1.5 sm:flex">
                        <button
                          type="button"
                          onClick={toggleMute}
                          title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          <VolumeIcon className="h-4 w-4" />
                        </button>
                        <PlayerSlider
                          ariaLabel="Âm lượng"
                          className="w-24"
                          onInteractionEnd={endControlsInteraction}
                          onInteractionStart={beginControlsInteraction}
                          trackClassName="h-1.5 bg-white/15"
                          thumbClassName="h-3 w-3"
                          value={isMuted ? 0 : volume * 100}
                          onValueChange={handleVolumeChange}
                        />
                      </div>
                    </div>

                    <div className="order-3 w-full text-center text-xs font-medium text-white/75 sm:order-2 sm:w-auto sm:text-sm">
                      {formatPlayerTime(currentTime)} /{" "}
                      {formatPlayerTime(duration)}
                    </div>

                    <div className="order-2 flex items-center gap-2 sm:order-3">
                      <button
                        type="button"
                        onClick={toggleMute}
                        title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white transition-colors hover:border-red-400/60 hover:bg-white/14 sm:hidden"
                      >
                        <VolumeIcon className="h-4 w-4" />
                      </button>

                      <DropdownMenu
                        modal={false}
                        onOpenChange={(open) => {
                          setIsSettingsOpen(open);
                          if (open) {
                            beginControlsInteraction();
                            setAreControlsVisible(true);
                            clearControlsHideTimer();
                            return;
                          }

                          endControlsInteraction();
                        }}
                      >
                        <DropdownMenuTrigger asChild>
                          <PlayerButton title="Cài đặt trình phát">
                            <Settings2 className="h-4 w-4" />
                          </PlayerButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          onCloseAutoFocus={(event) => event.preventDefault()}
                          align="end"
                          className="w-60 rounded-2xl border border-white/10 bg-black/95 p-2 text-white shadow-2xl backdrop-blur-2xl"
                        >
                          <DropdownMenuLabel className="text-white/60">
                            Tốc độ phát
                          </DropdownMenuLabel>
                          {PLAYBACK_SPEED_OPTIONS.map((rate) => (
                            <DropdownMenuItem
                              key={rate}
                              onSelect={() => changePlaybackRate(rate)}
                              className="rounded-xl px-3 py-2 text-white focus:bg-white/10 focus:text-white"
                            >
                              <span>
                                {rate === 1 ? "Bình thường" : `${rate}x`}
                              </span>
                              {playbackRate === rate ? (
                                <Check className="ml-auto h-4 w-4 text-red-400" />
                              ) : null}
                            </DropdownMenuItem>
                          ))}

                          {qualityOptions.length ? (
                            <>
                              <DropdownMenuSeparator className="bg-white/10" />
                              <DropdownMenuLabel className="text-white/60">
                                Chất lượng
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onSelect={() => changeQuality(-1)}
                                className="rounded-xl px-3 py-2 text-white focus:bg-white/10 focus:text-white"
                              >
                                <span>Tự động</span>
                                {selectedQuality === -1 ? (
                                  <Check className="ml-auto h-4 w-4 text-red-400" />
                                ) : null}
                              </DropdownMenuItem>
                              {qualityOptions.map((option) => (
                                <DropdownMenuItem
                                  key={option.value}
                                  onSelect={() => changeQuality(option.value)}
                                  className="rounded-xl px-3 py-2 text-white focus:bg-white/10 focus:text-white"
                                >
                                  <span>{option.label}</span>
                                  {selectedQuality === option.value ? (
                                    <Check className="ml-auto h-4 w-4 text-red-400" />
                                  ) : null}
                                </DropdownMenuItem>
                              ))}
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <PlayerButton
                        onClick={toggleFullscreen}
                        title={
                          isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"
                        }
                      >
                        {isFullscreen ? (
                          <Minimize className="h-4 w-4" />
                        ) : (
                          <Maximize className="h-4 w-4" />
                        )}
                      </PlayerButton>
                    </div>
                  </div>
                </div>
              </div>
            </>
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
          Nguồn phát này dùng trình phát nhúng bên ngoài nên website chỉ lưu
          được tập đang xem, không lưu chính xác số giây phát.
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
        <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-primary">
            Nội dung phim
          </p>
          <h2 className="mt-3 text-2xl font-black text-white">
            {movie.originName || movie.name}
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            {description}
          </p>
        </section>

        <aside className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-primary">
            Thông tin nhanh
          </p>
          <div className="mt-5 space-y-4 text-sm">
            <div className="flex items-start justify-between gap-4">
              <span className="text-muted-foreground">Năm phát hành</span>
              <span className="text-right text-white">
                {movie.year || "Đang cập nhật"}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="text-muted-foreground">Ngôn ngữ</span>
              <span className="text-right text-white">
                {movie.lang || "Vietsub"}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="text-muted-foreground">Chất lượng</span>
              <span className="text-right text-white">
                {movie.quality || "HD"}
              </span>
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
                onClick={() =>
                  navigate(buildWatchUrl(movie.slug, serverIndex, index))
                }
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
