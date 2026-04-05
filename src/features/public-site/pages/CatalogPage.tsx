import { useQuery } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/shared/lib/api";
import MovieCard from "@/shared/components/CardFilm/MovieCard";
import MovieCardSkeleton from "@/shared/components/CardFilm/MovieCardSkeleton";
import PageNavigation from "@/shared/components/PageNavigation";
import PaginationControls from "@/shared/components/PaginationControls";
import { Skeleton } from "@/shared/components/ui/skeleton";

const validTypes = ["phim-bo", "phim-le", "tv-shows", "hoat-hinh"] as const;

const typeLabels: Record<(typeof validTypes)[number], string> = {
  "phim-bo": "Phim bộ",
  "phim-le": "Phim lẻ",
  "tv-shows": "Chương trình TV",
  "hoat-hinh": "Hoạt hình",
};

interface FilterOption {
  value: string;
  label: string;
}

const sortFieldOptions: FilterOption[] = [
  { value: "modified.time", label: "Mới cập nhật" },
  { value: "_id", label: "Mới thêm vào kho" },
  { value: "year", label: "Năm phát hành" },
];

const sortTypeOptions: FilterOption[] = [
  { value: "desc", label: "Giảm dần" },
  { value: "asc", label: "Tăng dần" },
];

const sortLanguageOptions: FilterOption[] = [
  { value: "", label: "Tất cả phiên bản" },
  { value: "vietsub", label: "Vietsub" },
  { value: "thuyet-minh", label: "Thuyết minh" },
  { value: "long-tieng", label: "Lồng tiếng" },
];

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

interface FilterFieldProps {
  label: string;
  hint: string;
  children: ReactNode;
}

const FilterField = ({ label, hint, children }: FilterFieldProps) => (
  <div className="flex flex-col gap-2 rounded-[26px] border border-white/10 bg-black/25 p-4 backdrop-blur-sm transition-colors focus-within:border-primary/40 focus-within:bg-black/35">
    <div className="space-y-1">
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="text-xs leading-5 text-muted-foreground">{hint}</p>
    </div>
    {children}
  </div>
);

interface FilterSelectProps {
  label: string;
  hint: string;
  value: string;
  options: FilterOption[];
  placeholder: string;
  onChange: (value: string) => void;
  statusMessage?: string | null;
}

const FilterSelect = ({
  label,
  hint,
  value,
  options,
  placeholder,
  onChange,
  statusMessage,
}: FilterSelectProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        rootRef.current &&
        event.target instanceof Node &&
        !rootRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption = options.find((option) => option.value === value);

  return (
    <div ref={rootRef} className={open ? "relative z-40" : "relative z-10"}>
      <FilterField label={label} hint={hint}>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
            open
              ? "border-primary/50 bg-black/50 text-white"
              : "border-white/10 bg-black/35 text-white hover:border-white/20 hover:bg-black/45"
          }`}
        >
          <span
            className={selectedOption ? "text-white" : "text-muted-foreground"}
          >
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform ${
              open ? "rotate-180 text-primary" : "text-muted-foreground"
            }`}
          />
        </button>
      </FilterField>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-40 mt-3 overflow-hidden rounded-[26px] border border-white/10 bg-[#0b0b10]/95 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.48)] backdrop-blur-xl">
          {statusMessage ? (
            <p className="px-3 py-3 text-sm leading-6 text-muted-foreground">
              {statusMessage}
            </p>
          ) : options.length ? (
            <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
              {options.map((option) => {
                const active = option.value === value;

                return (
                  <button
                    key={`${label}-${option.value || "all"}`}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm transition-colors ${
                      active
                        ? "bg-primary/15 text-white"
                        : "text-white/88 hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    <span>{option.label}</span>
                    {active ? <Check className="h-4 w-4 text-primary" /> : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="px-3 py-3 text-sm leading-6 text-muted-foreground">
              Không có dữ liệu để hiển thị.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
};

const CatalogGridSkeleton = () => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
    {Array.from({ length: 24 }).map((_, index) => (
      <MovieCardSkeleton key={`catalog-skeleton-${index}`} />
    ))}
  </div>
);

const buildDefaultCatalogParams = (type: string) => {
  const next = new URLSearchParams();
  next.set("type", type);
  next.set("page", "1");
  next.set("limit", "24");
  next.set("sort_field", "modified.time");
  next.set("sort_type", "desc");
  return next;
};

const CatalogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const type = searchParams.get("type") || "phim-bo";
  const keyword = searchParams.get("keyword") || "";
  const category = searchParams.get("category") || "";
  const country = searchParams.get("country") || "";
  const year = searchParams.get("year") || "";
  const sortField = searchParams.get("sort_field") || "modified.time";
  const sortType = searchParams.get("sort_type") || "desc";
  const sortLang = searchParams.get("sort_lang") || "";
  const page = Number(searchParams.get("page") || "1");
  const [keywordDraft, setKeywordDraft] = useState(keyword);
  const [mobileFiltersExpanded, setMobileFiltersExpanded] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: ["catalog", "categories"],
    queryFn: () => api.categories(),
    select: (data) => normalizeTaxonomyItems(data as unknown),
    staleTime: 1000 * 60 * 60 * 6,
  });

  const countriesQuery = useQuery({
    queryKey: ["catalog", "countries"],
    queryFn: () => api.countries(),
    select: (data) => normalizeTaxonomyItems(data as unknown),
    staleTime: 1000 * 60 * 60 * 6,
  });

  useEffect(() => {
    setKeywordDraft(keyword);
  }, [keyword]);

  useEffect(() => {
    if (!mobileFiltersExpanded) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileFiltersExpanded]);

  const listQuery = useQuery({
    queryKey: [
      "catalog",
      type,
      keyword,
      category,
      country,
      year,
      sortField,
      sortType,
      sortLang,
      page,
    ],
    queryFn: () => {
      const params = new URLSearchParams(searchParams);
      if (!params.get("page")) params.set("page", "1");
      if (!params.get("limit")) params.set("limit", "24");
      if (!params.get("sort_field")) params.set("sort_field", "modified.time");
      if (!params.get("sort_type")) params.set("sort_type", "desc");
      if (keyword) {
        return api.search(params);
      }

      return api.list(type, params);
    },
    placeholderData: (previousData) => previousData,
  });

  const title = useMemo(() => {
    if (keyword) {
      return `Kết quả cho "${keyword}"`;
    }
    return `Danh sách ${typeLabels[type as keyof typeof typeLabels] || type}`;
  }, [keyword, type]);

  const categoryLabel = useMemo(
    () =>
      categoriesQuery.data?.find((item) => item.slug === category)?.name ??
      null,
    [categoriesQuery.data, category],
  );

  const countryLabel = useMemo(
    () =>
      countriesQuery.data?.find((item) => item.slug === country)?.name ?? null,
    [countriesQuery.data, country],
  );

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [
      { value: "", label: "Tất cả năm" },
      ...Array.from({ length: currentYear - 1969 }, (_, index) => {
        const yearValue = String(currentYear - index);
        return { value: yearValue, label: yearValue };
      }),
    ];
  }, []);

  const activeFilterLabels = useMemo(
    () =>
      [
        categoryLabel ? `Thể loại: ${categoryLabel}` : null,
        countryLabel ? `Quốc gia: ${countryLabel}` : null,
        year ? `Năm: ${year}` : null,
        sortLang
          ? `Phiên bản: ${
              sortLanguageOptions.find((item) => item.value === sortLang)
                ?.label ?? sortLang
            }`
          : null,
      ].filter((item): item is string => Boolean(item)),
    [categoryLabel, countryLabel, sortLang, year],
  );
  const activeFilterCount = activeFilterLabels.length + (keyword ? 1 : 0);

  const updateParams = (
    updates: Record<string, string>,
    options?: { resetPage?: boolean },
  ) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });

    if (options?.resetPage !== false) {
      next.set("page", "1");
    }

    setSearchParams(next);
    setMobileFiltersExpanded(false);
  };

  const handleKeywordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateParams({ keyword: keywordDraft.trim() });
  };

  const resetFilters = () => {
    setSearchParams(buildDefaultCatalogParams(type));
    setMobileFiltersExpanded(false);
  };

  const rawPagination = (listQuery.data?.raw as any)?.data?.params?.pagination;
  const displayCurrentPage = Number(
    rawPagination?.currentPage ?? listQuery.data?.page ?? page ?? 1,
  );
  const displayTotalItems = Number(
    rawPagination?.totalItems ?? listQuery.data?.totalItems ?? 0,
  );
  const displayTotalPages = Math.max(
    Number(rawPagination?.totalPages ?? 0),
    Number(listQuery.data?.totalPages ?? 0),
    Math.ceil(displayTotalItems / 24),
    1,
  );
  const listItems = listQuery.data?.items ?? [];
  const isInitialListLoading = listQuery.isLoading && listItems.length === 0;
  const isRefreshingList = listQuery.isFetching && !isInitialListLoading;
  const hasActiveFilters = Boolean(keyword || activeFilterLabels.length);
  const filterControls = (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FilterSelect
          label="Loại phim"
          hint="Chọn nhóm nội dung bạn muốn duyệt trong kho phim."
          value={type}
          onChange={(nextValue) => updateParams({ type: nextValue })}
          placeholder="Chọn loại phim"
          options={validTypes.map((item) => ({
            value: item,
            label: typeLabels[item],
          }))}
        />

        <FilterField
          label="Từ khóa tìm kiếm"
          hint="Nhập tên phim, diễn viên hoặc cụm từ gần đúng rồi bấm áp dụng."
        >
          <form onSubmit={handleKeywordSubmit} className="flex gap-2">
            <input
              value={keywordDraft}
              onChange={(event) => setKeywordDraft(event.target.value)}
              placeholder="Ví dụ: One Piece, Thành Long..."
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-primary/40 placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              <Search className="h-4 w-4" />
              Áp dụng
            </button>
          </form>
        </FilterField>

        <FilterSelect
          label="Thể loại"
          hint="Chọn trực tiếp từ danh sách, không cần nhớ hay nhập mã thể loại."
          value={category}
          onChange={(nextValue) => updateParams({ category: nextValue })}
          placeholder="Tất cả thể loại"
          statusMessage={
            categoriesQuery.isLoading
              ? "Đang tải danh sách thể loại..."
              : categoriesQuery.error
                ? "Không tải được danh sách thể loại."
                : null
          }
          options={[
            { value: "", label: "Tất cả thể loại" },
            ...(categoriesQuery.data ?? []).map((item) => ({
              value: item.slug,
              label: item.name,
            })),
          ]}
        />

        <FilterSelect
          label="Quốc gia"
          hint="Lọc theo nơi sản xuất phim, đã có sẵn danh sách chuẩn để chọn."
          value={country}
          onChange={(nextValue) => updateParams({ country: nextValue })}
          placeholder="Tất cả quốc gia"
          statusMessage={
            countriesQuery.isLoading
              ? "Đang tải danh sách quốc gia..."
              : countriesQuery.error
                ? "Không tải được danh sách quốc gia."
                : null
          }
          options={[
            { value: "", label: "Tất cả quốc gia" },
            ...(countriesQuery.data ?? []).map((item) => ({
              value: item.slug,
              label: item.name,
            })),
          ]}
        />

        <FilterSelect
          label="Năm phát hành"
          hint="Chọn năm nếu bạn muốn thu gọn kết quả về một giai đoạn cụ thể."
          value={year}
          onChange={(nextValue) => updateParams({ year: nextValue })}
          placeholder="Tất cả năm"
          options={yearOptions}
        />

        <FilterSelect
          label="Sắp xếp theo"
          hint="Chọn tiêu chí ưu tiên để kết quả hiện ra theo đúng nhu cầu."
          value={sortField}
          onChange={(nextValue) => updateParams({ sort_field: nextValue })}
          placeholder="Chọn tiêu chí sắp xếp"
          options={sortFieldOptions}
        />

        <FilterSelect
          label="Thứ tự hiển thị"
          hint="Đảo chiều danh sách theo tăng dần hoặc giảm dần."
          value={sortType}
          onChange={(nextValue) => updateParams({ sort_type: nextValue })}
          placeholder="Chọn thứ tự hiển thị"
          options={sortTypeOptions}
        />

        <FilterSelect
          label="Phiên bản âm thanh / phụ đề"
          hint="Giữ lại riêng phim Vietsub, Thuyết minh hoặc Lồng tiếng nếu cần."
          value={sortLang}
          onChange={(nextValue) => updateParams({ sort_lang: nextValue })}
          placeholder="Tất cả phiên bản"
          options={sortLanguageOptions}
        />
      </div>

      {hasActiveFilters ? (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {keyword ? (
            <button
              type="button"
              onClick={() => updateParams({ keyword: "" })}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:border-primary/35 hover:bg-primary/15"
            >
              <span className="truncate max-w-[16rem]">Từ khóa: {keyword}</span>
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {categoryLabel ? (
            <button
              type="button"
              onClick={() => updateParams({ category: "" })}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:border-primary/35 hover:bg-primary/15"
            >
              <span>Thể loại: {categoryLabel}</span>
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {countryLabel ? (
            <button
              type="button"
              onClick={() => updateParams({ country: "" })}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:border-primary/35 hover:bg-primary/15"
            >
              <span>Quốc gia: {countryLabel}</span>
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {year ? (
            <button
              type="button"
              onClick={() => updateParams({ year: "" })}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:border-primary/35 hover:bg-primary/15"
            >
              <span>Năm: {year}</span>
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {sortLang ? (
            <button
              type="button"
              onClick={() => updateParams({ sort_lang: "" })}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:border-primary/35 hover:bg-primary/15"
            >
              <span>
                Phiên bản:{" "}
                {sortLanguageOptions.find((item) => item.value === sortLang)?.label ?? sortLang}
              </span>
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );

  return (
    <div className="content-shell layout-padding py-10">
      <PageNavigation
        backTo="/"
        backLabel="Trang chủ"
        items={[{ label: "Trang chủ", to: "/" }, { label: "Danh mục phim" }]}
      />

      <div className="sticky top-16 z-30 mb-8 overflow-visible rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.12),_transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] backdrop-blur-xl md:relative md:top-auto">
        <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Danh mục phim
            </div>
            <h1 className="mt-3 text-3xl font-black text-white">{title}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileFiltersExpanded((current) => !current)}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-colors hover:border-primary/40 hover:bg-primary/10 md:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {mobileFiltersExpanded
                ? "Ẩn bộ lọc"
                : `Bộ lọc${activeFilterCount ? ` (${activeFilterCount})` : ""}`}
            </button>
            <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white">
              {displayTotalItems} phim • {displayTotalPages} trang
            </div>
            {isRefreshingList ? (
              <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                <Skeleton className="h-2.5 w-2.5 rounded-full" />
                Đang cập nhật danh sách...
              </div>
            ) : null}
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-colors hover:border-primary/40 hover:bg-primary/10"
            >
              <RotateCcw className="h-4 w-4" />
              Đặt lại bộ lọc
            </button>
          </div>
        </div>

        <div className="hidden px-6 py-6 md:block">{filterControls}</div>
      </div>

      {mobileFiltersExpanded ? (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm md:hidden">
          <button
            type="button"
            aria-label="Đóng bộ lọc"
            className="absolute inset-0"
            onClick={() => setMobileFiltersExpanded(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[84vh] overflow-hidden rounded-t-[32px] border border-white/10 bg-[#09090d] shadow-[0_-24px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                  Bộ lọc nhanh
                </p>
                <h2 className="mt-1 text-lg font-bold text-white">Tinh chỉnh danh mục</h2>
              </div>
              <button
                type="button"
                onClick={() => setMobileFiltersExpanded(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors hover:border-primary/40 hover:bg-primary/10"
                aria-label="Đóng bộ lọc"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[calc(84vh-86px)] overflow-y-auto px-5 py-5">
              {filterControls}
            </div>
          </div>
        </div>
      ) : null}

      {listQuery.error ? (
        <p className="text-red-400">
          {(listQuery.error as Error).message || "Không thể tải danh mục phim."}
        </p>
      ) : null}
      {listQuery.data && displayTotalPages > 1 ? (
        <PaginationControls
          className="mb-6"
          currentPage={displayCurrentPage}
          totalPages={displayTotalPages}
          onPageChange={(nextPage) =>
            updateParams({ page: String(nextPage) }, { resetPage: false })
          }
        />
      ) : null}
      {isInitialListLoading ? (
        <CatalogGridSkeleton />
      ) : !listItems.length ? (
        <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
            <Search className="h-5 w-5" />
          </div>
          <h2 className="mt-5 text-2xl font-black text-white">Không có phim phù hợp</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Thử bỏ bớt bộ lọc, đổi từ khóa ngắn hơn hoặc quay lại các danh mục duyệt phổ biến
            để tiếp tục khám phá kho phim.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              <RotateCcw className="h-4 w-4" />
              Xóa bộ lọc
            </button>
            <button
              type="button"
              onClick={() => setSearchParams(buildDefaultCatalogParams("phim-bo"))}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-primary/40 hover:bg-primary/10"
            >
              Quay lại phim bộ
            </button>
            <button
              type="button"
              onClick={() => setSearchParams(buildDefaultCatalogParams("phim-le"))}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-primary/40 hover:bg-primary/10"
            >
              Quay lại phim lẻ
            </button>
          </div>
        </div>
      ) : (
        <div className="relative z-0 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {listItems.map((movie) => (
            <MovieCard key={movie.slug} movie={movie} />
          ))}
        </div>
      )}

      {listQuery.data && displayTotalPages > 1 ? (
        <PaginationControls
          className="mt-10"
          currentPage={displayCurrentPage}
          totalPages={displayTotalPages}
          onPageChange={(nextPage) =>
            updateParams({ page: String(nextPage) }, { resetPage: false })
          }
        />
      ) : null}
    </div>
  );
};

export default CatalogPage;
