import { useQuery } from "@tanstack/react-query";
import { FormEvent, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, Heart, LogOut, Menu, Search, Settings2, User, X } from "lucide-react";
import { useAuth } from "@/shared/auth/AuthContext";
import { api } from "@/shared/lib/api";
import {
  buildCatalogHref,
  CATALOG_LATEST_SOURCE,
  CATALOG_LATEST_VERSION,
  getCatalogYearValues,
  normalizeCatalogTypes,
  normalizeTaxonomyItems,
  sortTaxonomyItems,
} from "@/shared/lib/catalog";
import type { MovieSummary } from "@/shared/types/api";

const SEARCH_AUTOCOMPLETE_DEBOUNCE = 320;
const RECENT_SEARCHES_STORAGE_KEY = "filmfe.recent-searches.v1";
const MAX_RECENT_SEARCHES = 6;

const primaryNavItems = [
  {
    label: "Duyệt tìm",
    href: buildCatalogHref({}, { includeDefaults: false }),
    mode: "browse" as const,
    value: "",
  },
  {
    label: "Phim bộ",
    href: buildCatalogHref({ type: "phim-bo" }, { includeDefaults: false }),
    mode: "type" as const,
    value: "phim-bo",
  },
  {
    label: "Phim lẻ",
    href: buildCatalogHref({ type: "phim-le" }, { includeDefaults: false }),
    mode: "type" as const,
    value: "phim-le",
  },
  {
    label: "TV Shows",
    href: buildCatalogHref({ type: "tv-shows" }, { includeDefaults: false }),
    mode: "type" as const,
    value: "tv-shows",
  },
  {
    label: "Hoạt Hình",
    href: buildCatalogHref({ type: "hoat-hinh" }, { includeDefaults: false }),
    mode: "type" as const,
    value: "hoat-hinh",
  },
  {
    label: "Chiếu Rạp",
    href: buildCatalogHref(
      { source: CATALOG_LATEST_SOURCE, version: CATALOG_LATEST_VERSION },
      { includeDefaults: false },
    ),
    mode: "source" as const,
    value: CATALOG_LATEST_SOURCE,
  },
] as const;

type TaxonomyMenuKey = "category" | "country" | "year";

interface HeaderMenuLink {
  key: string;
  label: string;
  href: string;
}

interface HeaderProps {
  overlay?: boolean;
}

type SearchMenuEntry =
  | { key: string; kind: "movie"; movie: MovieSummary }
  | { key: string; kind: "recent"; value: string }
  | { key: string; kind: "view-all"; value: string };

const readRecentSearches = () => {
  if (typeof window === "undefined") {
    return [] as string[];
  }

  try {
    const rawValue = window.localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
    if (!rawValue) {
      return [] as string[];
    }

    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      : [];
  } catch {
    return [] as string[];
  }
};

const writeRecentSearches = (keywords: string[]) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(keywords));
  } catch {
  }
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const highlightMatchedText = (value: string, query: string): ReactNode => {
  const normalizedValue = value?.trim() ?? "";
  const normalizedQuery = query.trim();

  if (!normalizedValue || normalizedQuery.length < 2) {
    return normalizedValue || value;
  }

  const matcher = new RegExp(`(${escapeRegExp(normalizedQuery)})`, "ig");
  const parts = normalizedValue.split(matcher).filter(Boolean);

  if (parts.length <= 1) {
    return normalizedValue;
  }

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === normalizedQuery.toLowerCase() ? (
          <span key={`${part}-${index}`} className="text-primary">
            {part}
          </span>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  );
};

export function Header({ overlay = false }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "");
  const [debouncedKeyword, setDebouncedKeyword] = useState(searchParams.get("keyword") ?? "");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [taxonomyMenuOpen, setTaxonomyMenuOpen] = useState<TaxonomyMenuKey | null>(null);
  const [mobileTaxonomyOpen, setMobileTaxonomyOpen] = useState<TaxonomyMenuKey | null>(null);
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => readRecentSearches());
  const [highlightedSearchIndex, setHighlightedSearchIndex] = useState(-1);
  const { user, isAuthenticated, logout } = useAuth();
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const taxonomyMenuRef = useRef<HTMLDivElement | null>(null);
  const desktopSearchRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchRef = useRef<HTMLDivElement | null>(null);
  const currentTypes = normalizeCatalogTypes(searchParams.getAll("type"));
  const currentType = currentTypes.length === 1 ? currentTypes[0] : "";
  const currentSource =
    searchParams.get("source") === CATALOG_LATEST_SOURCE
      ? CATALOG_LATEST_SOURCE
      : "";
  const currentKeyword = searchParams.get("keyword") || "";
  const currentCategory = searchParams.get("category") || "";
  const currentCountry = searchParams.get("country") || "";
  const currentYear = searchParams.get("year") || "";
  const isCatalogPage = location.pathname === "/catalog";
  const trimmedKeyword = keyword.trim();
  const trimmedDebouncedKeyword = debouncedKeyword.trim();
  const closeSearchPanels = () => {
    setDesktopSearchOpen(false);
    setMobileSearchOpen(false);
    setHighlightedSearchIndex(-1);
  };
  const persistRecentSearch = (value: string) => {
    const normalizedKeyword = value.trim();
    if (!normalizedKeyword) {
      return;
    }

    setRecentSearches((current) => {
      const next = [
        normalizedKeyword,
        ...current.filter(
          (item) => item.toLowerCase() !== normalizedKeyword.toLowerCase(),
        ),
      ].slice(0, MAX_RECENT_SEARCHES);
      writeRecentSearches(next);
      return next;
    });
  };
  const clearRecentSearches = () => {
    setRecentSearches([]);
    writeRecentSearches([]);
  };
  const categoriesQuery = useQuery({
    queryKey: ["header", "categories"],
    queryFn: () => api.categories(),
    select: (data) =>
      sortTaxonomyItems(normalizeTaxonomyItems(data as unknown), "category"),
    staleTime: 1000 * 60 * 60 * 6,
  });
  const countriesQuery = useQuery({
    queryKey: ["header", "countries"],
    queryFn: () => api.countries(),
    select: (data) =>
      sortTaxonomyItems(normalizeTaxonomyItems(data as unknown), "country"),
    staleTime: 1000 * 60 * 60 * 6,
  });
  const searchSuggestionsQuery = useQuery({
    queryKey: ["header", "search-suggestions", trimmedDebouncedKeyword],
    queryFn: () => {
      const params = new URLSearchParams({
        keyword: trimmedDebouncedKeyword,
        page: "1",
        limit: "6",
      });
      return api.search(params);
    },
    enabled: trimmedDebouncedKeyword.length >= 2,
    staleTime: 1000 * 60,
  });
  const suggestionItems = searchSuggestionsQuery.data?.items ?? [];
  const searchMenuEntries = useMemo<SearchMenuEntry[]>(() => {
    if (trimmedKeyword.length >= 2) {
      const movieEntries = suggestionItems.map((movie) => ({
        key: `movie-${movie.slug}`,
        kind: "movie" as const,
        movie,
      }));

      return movieEntries.length
        ? [
            ...movieEntries,
            {
              key: `view-all-${trimmedKeyword}`,
              kind: "view-all" as const,
              value: trimmedKeyword,
            },
          ]
        : [];
    }

    return recentSearches.map((value) => ({
      key: `recent-${value}`,
      kind: "recent" as const,
      value,
    }));
  }, [recentSearches, suggestionItems, trimmedKeyword]);

  const categoryMenuItems = useMemo<HeaderMenuLink[]>(
    () =>
      (categoriesQuery.data ?? []).map((item) => ({
        key: item.slug,
        label: item.name,
        href: buildCatalogHref(
          { category: item.slug },
          { includeDefaults: false },
        ),
      })),
    [categoriesQuery.data],
  );

  const countryMenuItems = useMemo<HeaderMenuLink[]>(
    () =>
      (countriesQuery.data ?? []).map((item) => ({
        key: item.slug,
        label: item.name,
        href: buildCatalogHref(
          { country: item.slug },
          { includeDefaults: false },
        ),
      })),
    [countriesQuery.data],
  );

  const yearMenuItems = useMemo<HeaderMenuLink[]>(
    () =>
      getCatalogYearValues().map((year) => ({
        key: year,
        label: year,
        href: buildCatalogHref({ year }, { includeDefaults: false }),
      })),
    [],
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        event.target instanceof Node &&
        !userMenuRef.current.contains(event.target)
      ) {
        setUserMenuOpen(false);
      }
      if (
        taxonomyMenuRef.current &&
        event.target instanceof Node &&
        !taxonomyMenuRef.current.contains(event.target)
      ) {
        setTaxonomyMenuOpen(null);
      }
      if (
        desktopSearchRef.current &&
        event.target instanceof Node &&
        !desktopSearchRef.current.contains(event.target)
      ) {
        setDesktopSearchOpen(false);
      }
      if (
        mobileSearchRef.current &&
        event.target instanceof Node &&
        !mobileSearchRef.current.contains(event.target)
      ) {
        setMobileSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setKeyword(currentKeyword);
    setDebouncedKeyword(currentKeyword);
    setUserMenuOpen(false);
    setTaxonomyMenuOpen(null);
    setMobileTaxonomyOpen(null);
    closeSearchPanels();
    setMobileOpen(false);
  }, [currentKeyword, location.pathname, location.search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, SEARCH_AUTOCOMPLETE_DEBOUNCE);

    return () => {
      window.clearTimeout(timer);
    };
  }, [keyword]);

  useEffect(() => {
    if (!desktopSearchOpen && !mobileSearchOpen) {
      setHighlightedSearchIndex(-1);
      return;
    }

    setHighlightedSearchIndex((current) => {
      if (!searchMenuEntries.length) {
        return -1;
      }

      return Math.min(current, searchMenuEntries.length - 1);
    });
  }, [desktopSearchOpen, mobileSearchOpen, searchMenuEntries.length]);

  const navigateToSearchResults = (nextKeyword: string) => {
    const normalizedKeyword = nextKeyword.trim();
    if (normalizedKeyword) {
      persistRecentSearch(normalizedKeyword);
    }

    navigate(
      buildCatalogHref(
        normalizedKeyword ? { keyword: normalizedKeyword } : {},
        { includeDefaults: false },
      ),
    );
    closeSearchPanels();
    setMobileOpen(false);
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigateToSearchResults(keyword);
  };

  const handleSearchMenuSelection = (entry: SearchMenuEntry) => {
    if (entry.kind === "movie") {
      persistRecentSearch(trimmedKeyword || entry.movie.name);
      navigate(`/movie/${entry.movie.slug}`);
      closeSearchPanels();
      setMobileOpen(false);
      return;
    }

    navigateToSearchResults(entry.value);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      closeSearchPanels();
      return;
    }

    if (!searchMenuEntries.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedSearchIndex((current) =>
        current >= searchMenuEntries.length - 1 ? 0 : current + 1,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedSearchIndex((current) =>
        current <= 0 ? searchMenuEntries.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === "Enter" && highlightedSearchIndex >= 0) {
      event.preventDefault();
      handleSearchMenuSelection(searchMenuEntries[highlightedSearchIndex]);
    }
  };

  const isPrimaryNavActive = (
    mode: (typeof primaryNavItems)[number]["mode"],
    value: string,
  ) => {
    if (!isCatalogPage || currentKeyword) {
      return false;
    }

    if (mode === "browse") {
      return (
        !currentTypes.length &&
        !currentCategory &&
        !currentCountry &&
        !currentYear &&
        currentSource !== CATALOG_LATEST_SOURCE
      );
    }

    if (mode === "source") {
      return currentSource === value;
    }

    return currentType === value;
  };

  const navLinkClass = (active: boolean) =>
    `inline-flex items-center gap-1 text-sm font-medium transition-colors ${
      active ? "text-white" : "text-muted-foreground hover:text-white"
    }`;

  const renderTaxonomyLinks = (
    items: HeaderMenuLink[],
    key: TaxonomyMenuKey,
    onNavigate: () => void,
  ) => {
    if (!items.length) {
      return (
        <p className="px-3 py-2 text-sm text-muted-foreground">
          Không có dữ liệu để hiển thị.
        </p>
      );
    }

    return (
      <div
        className={`grid gap-1 overflow-y-auto pr-1 ${
          key === "category"
            ? "max-h-80 grid-cols-2"
            : key === "year"
              ? "max-h-72 grid-cols-3"
              : "max-h-72 grid-cols-1"
        }`}
      >
        {items.map((item) => (
          <Link
            key={item.key}
            to={item.href}
            onClick={onNavigate}
            className="rounded-xl px-3 py-2 text-sm text-white/90 transition-colors hover:bg-white/10 hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </div>
    );
  };

  const renderSearchSuggestions = (variant: "desktop" | "mobile") => {
    const isOpen = variant === "desktop" ? desktopSearchOpen : mobileSearchOpen;
    if (!isOpen || (!searchMenuEntries.length && trimmedKeyword.length < 2 && !recentSearches.length)) {
      return null;
    }

    return (
      <div className="absolute left-0 right-0 top-full z-40 mt-3 overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(14,14,18,0.98),rgba(9,9,12,0.98))] p-2 shadow-[0_22px_60px_rgba(0,0,0,0.42)]">
        {trimmedKeyword.length >= 2 && searchSuggestionsQuery.isLoading ? (
          <p className="px-3 py-3 text-sm text-muted-foreground">Đang tìm phim phù hợp...</p>
        ) : trimmedKeyword.length >= 2 && searchSuggestionsQuery.error ? (
          <p className="px-3 py-3 text-sm text-red-300">
            Không thể tải gợi ý tìm kiếm.
          </p>
        ) : trimmedKeyword.length < 2 && recentSearches.length ? (
          <>
            <div className="mb-2 flex items-center justify-between px-3 pt-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
                Tìm kiếm gần đây
              </p>
              <button
                type="button"
                onClick={clearRecentSearches}
                className="text-xs font-medium text-white/55 transition-colors hover:text-white"
              >
                Xóa hết
              </button>
            </div>
            <div className="space-y-1">
              {recentSearches.map((value, index) => {
                const isActive = highlightedSearchIndex === index;

                return (
                  <button
                    key={`recent-search-${value}`}
                    type="button"
                    onClick={() => handleSearchMenuSelection({
                      key: `recent-${value}`,
                      kind: "recent",
                      value,
                    })}
                    className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm text-white transition-all duration-200 ${
                      isActive
                        ? "border-white/10 bg-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.22)]"
                        : "border-transparent hover:border-white/10 hover:bg-white/8 hover:shadow-[0_12px_30px_rgba(0,0,0,0.22)]"
                    }`}
                  >
                    <span>{value}</span>
                    <Search className="h-4 w-4 text-white/35" />
                  </button>
                );
              })}
            </div>
          </>
        ) : suggestionItems.length ? (
          <>
            <div className="space-y-1">
              {suggestionItems.map((item, index) => {
                const isActive = highlightedSearchIndex === index;

                return (
                <Link
                  key={item.slug}
                  to={`/movie/${item.slug}`}
                  onClick={() => {
                    handleSearchMenuSelection({
                      key: `movie-${item.slug}`,
                      kind: "movie",
                      movie: item,
                    });
                  }}
                  className={`group flex items-center gap-3 rounded-2xl border px-3 py-3 text-white transition-all duration-200 ${
                    isActive
                      ? "border-white/10 bg-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.22)]"
                      : "border-transparent hover:border-white/10 hover:bg-white/8 hover:shadow-[0_12px_30px_rgba(0,0,0,0.22)]"
                  }`}
                >
                  <div className="h-14 w-10 shrink-0 overflow-hidden rounded-xl bg-white/5">
                    {item.posterUrl || item.thumbUrl ? (
                      <img
                        src={item.posterUrl || item.thumbUrl || ""}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[9px] uppercase tracking-[0.2em] text-white/35">
                        No
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-semibold text-white transition-colors group-hover:text-primary">
                      {highlightMatchedText(item.name, trimmedKeyword)}
                    </p>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground transition-colors group-hover:text-white/75">
                      {highlightMatchedText(
                        item.originName ||
                        item.episodeCurrent ||
                        item.categories?.slice(0, 2).join(" • ") ||
                        "Mở chi tiết phim",
                        trimmedKeyword,
                      )}
                    </p>
                  </div>
                </Link>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => navigateToSearchResults(keyword)}
              className={`mt-2 flex w-full items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold text-white transition-colors ${
                highlightedSearchIndex === suggestionItems.length
                  ? "border-primary/35 bg-primary/10"
                  : "border-white/10 bg-white/5 hover:border-primary/40 hover:bg-primary/10"
              }`}
            >
              Xem tất cả kết quả cho "{trimmedKeyword}"
            </button>
          </>
        ) : (
          <>
            <p className="px-3 py-3 text-sm text-muted-foreground">
              Không tìm thấy phim phù hợp.
            </p>
            <button
              type="button"
              onClick={() => navigateToSearchResults(keyword)}
              className="mt-1 flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-colors hover:border-primary/40 hover:bg-primary/10"
            >
              Xem tất cả kết quả cho "{trimmedKeyword}"
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 w-full transition-[background-color,backdrop-filter] duration-300 ${
        isScrolled
          ? overlay
            ? "bg-black/68 backdrop-blur-xl"
            : "bg-black/78 backdrop-blur-xl"
          : "bg-transparent backdrop-blur-none"
      }`}
    >
      <div className="layout-padding flex h-16 w-full items-center gap-3">
        <Link to="/" className="min-w-0 shrink-0">
          <div className="min-w-0">
            <p
              className="text-2xl font-bold tracking-wider text-primary"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              SocialFilm
            </p>
          </div>
        </Link>

        <nav className="hidden shrink-0 items-center gap-5 xl:flex" ref={taxonomyMenuRef}>
          {primaryNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={navLinkClass(isPrimaryNavActive(item.mode, item.value))}
            >
              {item.label}
            </Link>
          ))}
          <div className="relative">
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setTaxonomyMenuOpen((current) =>
                    current === "category" ? null : "category",
                  )
                }
                className={navLinkClass(
                  taxonomyMenuOpen === "category" || (isCatalogPage && !!currentCategory),
                )}
              >
                <span>Thể loại</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    taxonomyMenuOpen === "category" ? "rotate-180" : ""
                  }`}
                />
              </button>
              {taxonomyMenuOpen === "category" ? (
                <div className="absolute left-0 top-full z-30 w-[23rem] rounded-[26px] border border-white/10 bg-black/90 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
                  {categoriesQuery.isLoading ? (
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                      Đang tải thể loại...
                    </p>
                  ) : categoriesQuery.error ? (
                    <p className="px-3 py-2 text-sm text-red-300">
                      Không tải được danh sách thể loại.
                    </p>
                  ) : (
                    renderTaxonomyLinks(categoryMenuItems, "category", () =>
                      setTaxonomyMenuOpen(null),
                    )
                  )}
                </div>
              ) : null}
            </div>
          </div>
          <div className="relative">
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setTaxonomyMenuOpen((current) =>
                    current === "country" ? null : "country",
                  )
                }
                className={navLinkClass(
                  taxonomyMenuOpen === "country" || (isCatalogPage && !!currentCountry),
                )}
              >
                <span>Quốc gia</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    taxonomyMenuOpen === "country" ? "rotate-180" : ""
                  }`}
                />
              </button>
              {taxonomyMenuOpen === "country" ? (
                <div className="absolute left-0 top-full z-30 w-[18rem] rounded-[26px] border border-white/10 bg-black/90 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
                  {countriesQuery.isLoading ? (
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                      Đang tải quốc gia...
                    </p>
                  ) : countriesQuery.error ? (
                    <p className="px-3 py-2 text-sm text-red-300">
                      Không tải được danh sách quốc gia.
                    </p>
                  ) : (
                    renderTaxonomyLinks(countryMenuItems, "country", () =>
                      setTaxonomyMenuOpen(null),
                    )
                  )}
                </div>
              ) : null}
            </div>
          </div>
          <div className="relative">
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setTaxonomyMenuOpen((current) =>
                    current === "year" ? null : "year",
                  )
                }
                className={navLinkClass(
                  taxonomyMenuOpen === "year" || (isCatalogPage && !!currentYear),
                )}
              >
                <span>Năm</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    taxonomyMenuOpen === "year" ? "rotate-180" : ""
                  }`}
                />
              </button>
              {taxonomyMenuOpen === "year" ? (
                <div className="absolute left-0 top-full z-30 w-[18rem] rounded-[26px] border border-white/10 bg-black/90 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
                  {renderTaxonomyLinks(yearMenuItems, "year", () =>
                    setTaxonomyMenuOpen(null),
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </nav>

        <div className="hidden min-w-0 flex-1 justify-end lg:flex">
          <div ref={desktopSearchRef} className="relative w-full max-w-sm xl:max-w-md">
            <form
              onSubmit={handleSearch}
              className="flex w-full items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2"
            >
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value);
                  setDesktopSearchOpen(true);
                  setHighlightedSearchIndex(-1);
                }}
                onFocus={() => setDesktopSearchOpen(true)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Tìm kiếm phim, diễn viên, từ khóa..."
                className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-muted-foreground"
              />
            </form>
            {renderSearchSuggestions("desktop")}
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          {isAuthenticated ? (
            <>
              <Link
                to="/wishlist"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm text-white transition-colors hover:border-primary/50 hover:bg-primary/10"
              >
                <Heart className="h-4 w-4" />
                <span className="hidden xl:inline">Xem sau</span>
              </Link>
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((current) => !current)}
                  className="inline-flex h-10 max-w-[180px] items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-sm text-white transition-colors hover:bg-white/10 xl:max-w-[220px]"
                  title={user?.fullName}
                >
                  <User className="h-4 w-4 shrink-0" />
                  <span className="truncate">{user?.fullName}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {userMenuOpen ? (
                  <div className="absolute right-0 top-full z-30 mt-3 w-52 rounded-2xl border border-white/10 bg-black/90 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl">
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white transition-colors hover:bg-white/10"
                    >
                      <User className="h-4 w-4 shrink-0" />
                      <span>Hồ sơ</span>
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white transition-colors hover:bg-white/10"
                    >
                      <Settings2 className="h-4 w-4 shrink-0" />
                      <span>Cài đặt</span>
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white transition-colors hover:bg-white/10"
                    >
                      <LogOut className="h-4 w-4 shrink-0" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <Link
              to="/auth"
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Đăng nhập
            </Link>
          )}
        </div>

        <button
          onClick={() => setMobileOpen((current) => !current)}
          className="inline-flex rounded-full border border-white/10 p-2 text-white lg:hidden"
          aria-label="Mở menu điều hướng"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="layout-padding bg-black/90 py-4 lg:hidden">
          <div ref={mobileSearchRef} className="relative mb-4">
            <form
              onSubmit={handleSearch}
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value);
                  setMobileSearchOpen(true);
                  setHighlightedSearchIndex(-1);
                }}
                onFocus={() => setMobileSearchOpen(true)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Tìm kiếm..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-muted-foreground"
              />
            </form>
            {renderSearchSuggestions("mobile")}
          </div>
          <div className="flex flex-col gap-3">
            {primaryNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl bg-white/5 px-4 py-3 text-sm text-white"
              >
                {item.label}
              </Link>
            ))}
            <div className="rounded-2xl bg-white/5">
              <button
                type="button"
                onClick={() =>
                  setMobileTaxonomyOpen((current) =>
                    current === "category" ? null : "category",
                  )
                }
                className="flex w-full items-center justify-between px-4 py-3 text-sm text-white"
              >
                <span>Thể loại</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    mobileTaxonomyOpen === "category" ? "rotate-180" : ""
                  }`}
                />
              </button>
              {mobileTaxonomyOpen === "category" ? (
                <div className="grid max-h-64 gap-2 overflow-y-auto px-3 pb-3 sm:grid-cols-2">
                  {categoriesQuery.isLoading ? (
                    <p className="px-1 py-1 text-sm text-muted-foreground">
                      Đang tải thể loại...
                    </p>
                  ) : categoriesQuery.error ? (
                    <p className="px-1 py-1 text-sm text-red-300">
                      Không tải được danh sách thể loại.
                    </p>
                  ) : (
                    renderTaxonomyLinks(categoryMenuItems, "category", () =>
                      setMobileOpen(false),
                    )
                  )}
                </div>
              ) : null}
            </div>
            <div className="rounded-2xl bg-white/5">
              <button
                type="button"
                onClick={() =>
                  setMobileTaxonomyOpen((current) =>
                    current === "country" ? null : "country",
                  )
                }
                className="flex w-full items-center justify-between px-4 py-3 text-sm text-white"
              >
                <span>Quốc gia</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    mobileTaxonomyOpen === "country" ? "rotate-180" : ""
                  }`}
                />
              </button>
              {mobileTaxonomyOpen === "country" ? (
                <div className="max-h-64 overflow-y-auto px-3 pb-3">
                  {countriesQuery.isLoading ? (
                    <p className="px-1 py-1 text-sm text-muted-foreground">
                      Đang tải quốc gia...
                    </p>
                  ) : countriesQuery.error ? (
                    <p className="px-1 py-1 text-sm text-red-300">
                      Không tải được danh sách quốc gia.
                    </p>
                  ) : (
                    renderTaxonomyLinks(countryMenuItems, "country", () =>
                      setMobileOpen(false),
                    )
                  )}
                </div>
              ) : null}
            </div>
            <div className="rounded-2xl bg-white/5">
              <button
                type="button"
                onClick={() =>
                  setMobileTaxonomyOpen((current) =>
                    current === "year" ? null : "year",
                  )
                }
                className="flex w-full items-center justify-between px-4 py-3 text-sm text-white"
              >
                <span>Năm</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    mobileTaxonomyOpen === "year" ? "rotate-180" : ""
                  }`}
                />
              </button>
              {mobileTaxonomyOpen === "year" ? (
                <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto px-3 pb-3">
                  {renderTaxonomyLinks(yearMenuItems, "year", () =>
                    setMobileOpen(false),
                  )}
                </div>
              ) : null}
            </div>
            {isAuthenticated ? (
              <>
                <Link
                  to="/settings"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl bg-white/5 px-4 py-3 text-sm text-white"
                >
                  Cài đặt
                </Link>
                <Link
                  to="/wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl bg-white/5 px-4 py-3 text-sm text-white"
                >
                  Xem sau
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                  className="rounded-xl border border-white/10 px-4 py-3 text-left text-sm text-white"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
