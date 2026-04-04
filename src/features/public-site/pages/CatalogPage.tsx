import { useQuery } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/shared/lib/api";
import MovieCard from "@/shared/components/CardFilm/MovieCard";
import PageNavigation from "@/shared/components/PageNavigation";

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
  <div className="flex flex-col gap-2 rounded-[24px] border border-white/10 bg-black/25 p-4 backdrop-blur-sm transition-colors focus-within:border-primary/40 focus-within:bg-black/35">
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
    <div ref={rootRef} className="relative">
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
          <span className={selectedOption ? "text-white" : "text-muted-foreground"}>
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
        <div className="absolute left-0 right-0 top-full z-30 mt-3 overflow-hidden rounded-[24px] border border-white/10 bg-[#0b0b10]/95 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.48)] backdrop-blur-xl">
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
      searchParams.toString(),
    ],
    queryFn: () => {
      const params = new URLSearchParams(searchParams);
      if (!params.get("page")) params.set("page", "1");
      if (!params.get("limit")) params.set("limit", "24");
      if (!params.get("sort_field")) params.set("sort_field", "modified.time");
      if (!params.get("sort_type")) params.set("sort_type", "desc");
      return keyword ? api.search(params) : api.list(type, params);
    },
  });

  const title = useMemo(() => {
    if (keyword) {
      return `Kết quả cho "${keyword}"`;
    }
    return `Danh sách ${typeLabels[type as keyof typeof typeLabels] || type}`;
  }, [keyword, type]);

  const categoryLabel = useMemo(
    () => categoriesQuery.data?.find((item) => item.slug === category)?.name ?? null,
    [categoriesQuery.data, category],
  );

  const countryLabel = useMemo(
    () => countriesQuery.data?.find((item) => item.slug === country)?.name ?? null,
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
              sortLanguageOptions.find((item) => item.value === sortLang)?.label ?? sortLang
            }`
          : null,
      ].filter((item): item is string => Boolean(item)),
    [categoryLabel, countryLabel, sortLang, year],
  );

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
  };

  const handleKeywordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateParams({ keyword: keywordDraft.trim() });
  };

  const resetFilters = () => {
    const next = new URLSearchParams();
    next.set("type", type);
    next.set("page", "1");
    next.set("limit", "24");
    next.set("sort_field", "modified.time");
    next.set("sort_type", "desc");
    setSearchParams(next);
  };

  const totalPages = listQuery.data?.totalPages ?? 1;

  return (
    <div className="content-shell layout-padding py-10">
      <PageNavigation
        backTo="/"
        backLabel="Trang chủ"
        items={[
          { label: "Trang chủ", to: "/" },
          { label: "Danh mục phim" },
        ]}
      />

      <div className="mb-8 overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.12),_transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]">
        <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Danh mục phim
            </div>
            <h1 className="mt-3 text-3xl font-black text-white">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Chọn sẵn thể loại, quốc gia, năm phát hành và kiểu phụ đề để lọc nhanh.
              Chỉ ô từ khóa mới cần tự nhập.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white">
              {listQuery.data?.totalItems ?? 0} phim
            </div>
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

        <div className="px-6 py-6">
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

            <div className="rounded-[24px] border border-dashed border-white/10 bg-black/15 p-4">
              <p className="text-sm font-semibold text-white">Mẹo lọc nhanh</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Dùng dropdown cho thể loại, quốc gia, năm và phiên bản để tránh nhập sai
                chuẩn slug. Ô tìm kiếm chỉ dành cho từ khóa tự do.
              </p>
            </div>
          </div>

          {activeFilterLabels.length > 0 ? (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {activeFilterLabels.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {listQuery.isLoading ? (
        <p className="text-muted-foreground">Đang tải danh sách phim...</p>
      ) : null}
      {listQuery.error ? (
        <p className="text-red-400">
          {(listQuery.error as Error).message || "Không thể tải danh mục phim."}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        {listQuery.data?.items.map((movie) => (
          <MovieCard key={movie.slug} movie={movie} />
        ))}
      </div>

      {listQuery.data && totalPages > 1 ? (
        <div className="mt-10 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Trang {listQuery.data.page} / {totalPages}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) }, { resetPage: false })}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2.5 text-sm text-white transition-colors hover:border-primary/40 hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Trang trước
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => updateParams({ page: String(page + 1) }, { resetPage: false })}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2.5 text-sm text-white transition-colors hover:border-primary/40 hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Trang sau
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CatalogPage;
