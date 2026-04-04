import { useQuery } from "@tanstack/react-query";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, Heart, LogOut, Menu, Search, User, X } from "lucide-react";
import { useAuth } from "@/shared/auth/AuthContext";
import { api } from "@/shared/lib/api";

const leadingNavItems = [
  { label: "Phim bộ", href: "/catalog?type=phim-bo", type: "phim-bo" },
  { label: "Phim lẻ", href: "/catalog?type=phim-le", type: "phim-le" },
] as const;

const trailingNavItems = [
  { label: "Hoạt hình", href: "/catalog?type=hoat-hinh", type: "hoat-hinh" },
  { label: "Chương trình TV", href: "/catalog?type=tv-shows", type: "tv-shows" },
] as const;

type TaxonomyMenuKey = "category" | "country";

interface TaxonomyItem {
  name: string;
  slug: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const unwrapTaxonomyPayload = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return [];
  }

  const candidates = [payload.items, payload.data, payload.results];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
    if (isRecord(candidate)) {
      const nested = unwrapTaxonomyPayload(candidate);
      if (nested.length) {
        return nested;
      }
    }
  }

  return [];
};

const normalizeTaxonomyItems = (payload: unknown): TaxonomyItem[] =>
  unwrapTaxonomyPayload(payload).flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }

    const name = typeof entry.name === "string" ? entry.name.trim() : "";
    const slug = typeof entry.slug === "string" ? entry.slug.trim() : "";

    if (!name || !slug) {
      return [];
    }

    return [{ name, slug }];
  });

interface HeaderProps {
  overlay?: boolean;
}

export function Header({ overlay = false }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [taxonomyMenuOpen, setTaxonomyMenuOpen] = useState<TaxonomyMenuKey | null>(null);
  const [mobileTaxonomyOpen, setMobileTaxonomyOpen] = useState<TaxonomyMenuKey | null>(null);
  const { user, isAuthenticated, logout } = useAuth();
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const taxonomyMenuRef = useRef<HTMLDivElement | null>(null);
  const currentType = searchParams.get("type") || "phim-bo";
  const currentKeyword = searchParams.get("keyword") || "";
  const currentCategory = searchParams.get("category") || "";
  const currentCountry = searchParams.get("country") || "";
  const isCatalogPage = location.pathname === "/catalog";
  const categoriesQuery = useQuery({
    queryKey: ["header", "categories"],
    queryFn: () => api.categories(),
    select: (data) => normalizeTaxonomyItems(data as unknown),
    staleTime: 1000 * 60 * 60 * 6,
  });
  const countriesQuery = useQuery({
    queryKey: ["header", "countries"],
    queryFn: () => api.countries(),
    select: (data) => normalizeTaxonomyItems(data as unknown),
    staleTime: 1000 * 60 * 60 * 6,
  });

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
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setUserMenuOpen(false);
    setTaxonomyMenuOpen(null);
    setMobileTaxonomyOpen(null);
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = new URLSearchParams();
    next.set("keyword", keyword.trim());
    next.set("type", "phim-bo");
    navigate(`/catalog?${next.toString()}`);
    setMobileOpen(false);
  };

  const isBrowseLinkActive = (type: string) =>
    isCatalogPage &&
    !currentKeyword &&
    !currentCategory &&
    !currentCountry &&
    currentType === type;

  const navLinkClass = (active: boolean) =>
    `inline-flex items-center gap-1 text-sm font-medium transition-colors ${
      active ? "text-white" : "text-muted-foreground hover:text-white"
    }`;

  const renderTaxonomyLinks = (
    items: TaxonomyItem[],
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
          key === "category" ? "max-h-80 grid-cols-2" : "max-h-72 grid-cols-1"
        }`}
      >
        {items.map((item) => (
          <Link
            key={item.slug}
            to={`/catalog?type=phim-bo&${key}=${encodeURIComponent(item.slug)}`}
            onClick={onNavigate}
            className="rounded-xl px-3 py-2 text-sm text-white/90 transition-colors hover:bg-white/10 hover:text-white"
          >
            {item.name}
          </Link>
        ))}
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
      <div className="layout-padding flex h-20 w-full items-center gap-4">
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
          {leadingNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={navLinkClass(isBrowseLinkActive(item.type))}
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
                    renderTaxonomyLinks(categoriesQuery.data ?? [], "category", () =>
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
                    renderTaxonomyLinks(countriesQuery.data ?? [], "country", () =>
                      setTaxonomyMenuOpen(null),
                    )
                  )}
                </div>
              ) : null}
            </div>
          </div>
          {trailingNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={navLinkClass(isBrowseLinkActive(item.type))}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden min-w-0 flex-1 justify-end lg:flex">
          <form
            onSubmit={handleSearch}
            className="flex w-full max-w-sm items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 xl:max-w-md"
          >
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm kiếm phim, diễn viên, từ khóa..."
              className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-muted-foreground"
            />
          </form>
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
                  <div className="absolute right-0 top-full z-30 mt-3 w-48 rounded-2xl border border-white/10 bg-black/90 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl">
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white transition-colors hover:bg-white/10"
                    >
                      <User className="h-4 w-4 shrink-0" />
                      <span>Hồ sơ</span>
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
          <form
            onSubmit={handleSearch}
            className="mb-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
          >
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-muted-foreground"
            />
          </form>
          <div className="flex flex-col gap-3">
            {leadingNavItems.map((item) => (
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
                    renderTaxonomyLinks(categoriesQuery.data ?? [], "category", () =>
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
                    renderTaxonomyLinks(countriesQuery.data ?? [], "country", () =>
                      setMobileOpen(false),
                    )
                  )}
                </div>
              ) : null}
            </div>
            {trailingNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl bg-white/5 px-4 py-3 text-sm text-white"
              >
                {item.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
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
