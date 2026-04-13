import { useQuery } from "@tanstack/react-query";
import { RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import MovieCard from "@/shared/components/CardFilm/MovieCard";
import MovieCardSkeleton from "@/shared/components/CardFilm/MovieCardSkeleton";
import PageNavigation from "@/shared/components/PageNavigation";
import PaginationControls from "@/shared/components/PaginationControls";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { api } from "@/shared/lib/api";
import {
  buildCatalogParams,
  CATALOG_DEFAULT_LIMIT,
  CATALOG_DEFAULT_SORT_FIELD,
  CATALOG_DEFAULT_SORT_TYPE,
  CATALOG_LATEST_SOURCE,
  CATALOG_LATEST_VERSION,
  CATALOG_TYPES,
  catalogTypeLabels,
  getCatalogYearOptions,
  normalizeCatalogTypes,
  normalizeTaxonomyItems,
  sortFieldOptions,
  sortLanguageOptions,
  sortTaxonomyItems,
  type CatalogType,
  type FilterOption,
} from "@/shared/lib/catalog";

interface FilterChoiceGroupProps {
  title: string;
  name: string;
  selectedValues: string[];
  options: FilterOption[];
  inputType: "checkbox" | "radio";
  selectionMode?: "single" | "multiple";
  onChange: (values: string[]) => void;
  disabled?: boolean;
  hint?: string | null;
}

const FilterChoiceGroup = ({
  title,
  name,
  selectedValues,
  options,
  inputType,
  selectionMode = "single",
  onChange,
  disabled = false,
  hint,
}: FilterChoiceGroupProps) => (
  <div>
    <div className="mb-2 font-bold text-white">{title}</div>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const checked =
          option.value === ""
            ? selectedValues.length === 0
            : selectedValues.includes(option.value);

        return (
          <label
            key={`${name}-${option.value || "all"}`}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors ${
              checked
                ? "border-primary/70 bg-primary/20 text-white"
                : "border-white/10 bg-black/20 text-white/85 hover:border-white/20 hover:bg-black/30"
            } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <input
              type={inputType}
              name={name}
              checked={checked}
              disabled={disabled}
              onChange={() => {
                if (option.value === "") {
                  onChange([]);
                  return;
                }

                if (selectionMode === "multiple") {
                  onChange(
                    checked
                      ? selectedValues.filter((value) => value !== option.value)
                      : [...selectedValues, option.value],
                  );
                  return;
                }

                onChange(
                  inputType === "checkbox" && checked ? [] : [option.value],
                );
              }}
              className="sr-only"
            />
            <span>{option.label}</span>
          </label>
        );
      })}
    </div>
    {hint ? <p className="mt-2 text-xs text-amber-300/90">{hint}</p> : null}
  </div>
);

const CatalogGridSkeleton = () => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
    {Array.from({ length: 24 }).map((_, index) => (
      <MovieCardSkeleton key={`catalog-skeleton-${index}`} />
    ))}
  </div>
);

const CatalogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const source =
    searchParams.get("source") === CATALOG_LATEST_SOURCE
      ? CATALOG_LATEST_SOURCE
      : "";
  const version = searchParams.get("version") || CATALOG_LATEST_VERSION;
  const selectedTypes = normalizeCatalogTypes(searchParams.getAll("type"));
  const primaryType: CatalogType | null =
    selectedTypes.length === 1 ? selectedTypes[0] : null;
  const keyword = searchParams.get("keyword") || "";
  const category = searchParams.get("category") || "";
  const country = searchParams.get("country") || "";
  const year = searchParams.get("year") || "";
  const sortField =
    searchParams.get("sort_field") || CATALOG_DEFAULT_SORT_FIELD;
  const sortType = searchParams.get("sort_type") || CATALOG_DEFAULT_SORT_TYPE;
  const sortLang = searchParams.get("sort_lang") || "";
  const page = Number(searchParams.get("page") || "1");

  const [draftTypes, setDraftTypes] = useState<CatalogType[]>(selectedTypes);
  const [draftCategory, setDraftCategory] = useState(category);
  const [draftCountry, setDraftCountry] = useState(country);
  const [draftYear, setDraftYear] = useState(year);
  const [draftSortField, setDraftSortField] = useState(sortField);
  const [draftSortLang, setDraftSortLang] = useState(sortLang);
  const [mobileFiltersExpanded, setMobileFiltersExpanded] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: ["catalog", "categories"],
    queryFn: () => api.categories(),
    select: (data) => sortTaxonomyItems(normalizeTaxonomyItems(data), "category"),
    staleTime: 1000 * 60 * 60 * 6,
  });

  const countriesQuery = useQuery({
    queryKey: ["catalog", "countries"],
    queryFn: () => api.countries(),
    select: (data) => sortTaxonomyItems(normalizeTaxonomyItems(data), "country"),
    staleTime: 1000 * 60 * 60 * 6,
  });

  useEffect(() => {
    setDraftTypes(selectedTypes);
    setDraftCategory(category);
    setDraftCountry(country);
    setDraftYear(year);
    setDraftSortField(sortField);
    setDraftSortLang(sortLang);
  }, [category, country, selectedTypes, sortField, sortLang, year]);

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

  const querySignature = searchParams.toString();

  const listQuery = useQuery({
    queryKey: [
      "catalog",
      source,
      version,
      selectedTypes.join(","),
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
      const params = new URLSearchParams(querySignature);
      if (!params.get("page")) params.set("page", "1");
      if (!params.get("limit")) {
        params.set("limit", String(CATALOG_DEFAULT_LIMIT));
      }
      if (!params.get("sort_field")) {
        params.set("sort_field", CATALOG_DEFAULT_SORT_FIELD);
      }
      if (!params.get("sort_type")) {
        params.set("sort_type", CATALOG_DEFAULT_SORT_TYPE);
      }

      if (keyword) {
        params.delete("type");
        params.delete("source");
        params.delete("version");
        return api.search(params);
      }

      if (source === CATALOG_LATEST_SOURCE) {
        return api.latest(page, version);
      }

      return api.listAll(params);
    },
    placeholderData: (previousData) => previousData,
  });

  const typeOptions = useMemo<FilterOption[]>(
    () => [
      { value: "", label: "Tất cả" },
      ...CATALOG_TYPES.map((item) => ({
        value: item,
        label: catalogTypeLabels[item],
      })),
    ],
    [],
  );

  const yearOptions = useMemo(() => getCatalogYearOptions(), []);

  const categoryOptions = useMemo<FilterOption[]>(
    () => [
      { value: "", label: "Tất cả" },
      ...(categoriesQuery.data ?? []).map((item) => ({
        value: item.slug,
        label: item.name,
      })),
    ],
    [categoriesQuery.data],
  );

  const countryOptions = useMemo<FilterOption[]>(
    () => [
      { value: "", label: "Tất cả" },
      ...(countriesQuery.data ?? []).map((item) => ({
        value: item.slug,
        label: item.name,
      })),
    ],
    [countriesQuery.data],
  );

  const categoryLabel = useMemo(
    () =>
      categoriesQuery.data?.find((item) => item.slug === category)?.name ?? null,
    [categoriesQuery.data, category],
  );

  const countryLabel = useMemo(
    () =>
      countriesQuery.data?.find((item) => item.slug === country)?.name ?? null,
    [countriesQuery.data, country],
  );

  const title = useMemo(() => {
    if (keyword) {
      return `Kết quả cho "${keyword}"`;
    }
    if (source === CATALOG_LATEST_SOURCE) {
      return "Chiếu Rạp";
    }
    if (primaryType) {
      return catalogTypeLabels[primaryType];
    }
    return "Duyệt tìm phim";
  }, [keyword, primaryType, source]);

  const subtitle = useMemo(() => {
    if (keyword) {
      return "Tìm trong toàn kho phim và tiếp tục thu gọn bằng quốc gia, thể loại, năm hoặc phiên bản.";
    }
    if (source === CATALOG_LATEST_SOURCE) {
      return "Nguồn Chiếu Rạp đang dùng feed phim mới cập nhật v3. Chọn bộ lọc và bấm áp dụng để chuyển sang chế độ duyệt toàn kho.";
    }
    if (primaryType) {
      return `Khám phá ${catalogTypeLabels[primaryType].toLowerCase()} với bộ lọc động theo quốc gia, thể loại, năm sản xuất và phiên bản.`;
    }
    if (selectedTypes.length > 1) {
      return `Duyệt gộp ${selectedTypes
        .map((item) => catalogTypeLabels[item].toLowerCase())
        .join(", ")} trong cùng một danh mục thông minh.`;
    }
    return "Duyệt toàn bộ kho phim bằng bộ lọc nhanh theo quốc gia, loại phim, thể loại, phiên bản và năm sản xuất.";
  }, [keyword, primaryType, selectedTypes, source]);

  const activeFilterLabels = useMemo(
    () =>
      [
        source === CATALOG_LATEST_SOURCE ? "Nguồn: Chiếu Rạp" : null,
        selectedTypes.length
          ? `Loại phim: ${selectedTypes
              .map((item) => catalogTypeLabels[item])
              .join(", ")}`
          : null,
        categoryLabel ? `Thể loại: ${categoryLabel}` : null,
        countryLabel ? `Quốc gia: ${countryLabel}` : null,
        year ? `Năm: ${year}` : null,
        sortLang
          ? `Phiên bản: ${
              sortLanguageOptions.find((item) => item.value === sortLang)?.label ??
              sortLang
            }`
          : null,
        sortField !== CATALOG_DEFAULT_SORT_FIELD
          ? `Sắp xếp: ${
              sortFieldOptions.find((item) => item.value === sortField)?.label ??
              sortField
            }`
          : null,
      ].filter((item): item is string => Boolean(item)),
    [categoryLabel, countryLabel, selectedTypes, sortField, sortLang, source, year],
  );

  const activeFilterCount = activeFilterLabels.length + (keyword ? 1 : 0);
  const typeFilterDisabled = Boolean(keyword);
  const typeFilterHint = keyword
    ? "Từ khóa đang bật nên nhóm Loại phim tạm tắt để tránh lệch kết quả từ API tìm kiếm."
    : null;

  const updateParams = (nextParams: URLSearchParams) => {
    setSearchParams(nextParams);
    setMobileFiltersExpanded(false);
  };

  const handleApplyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextTypes = keyword ? [] : draftTypes;
    const hasBrowseSelections = Boolean(
      nextTypes.length ||
        draftCategory ||
        draftCountry ||
        draftYear ||
        draftSortLang ||
        draftSortField !== CATALOG_DEFAULT_SORT_FIELD,
    );

    const preserveLatestMode =
      source === CATALOG_LATEST_SOURCE && !keyword && !hasBrowseSelections;

    const nextParams = buildCatalogParams({
      keyword: keyword || null,
      type: nextTypes.length ? nextTypes : null,
      category: draftCategory || null,
      country: draftCountry || null,
      year: draftYear || null,
      sort_field: draftSortField,
      sort_type: CATALOG_DEFAULT_SORT_TYPE,
      sort_lang: draftSortLang || null,
      source: preserveLatestMode ? CATALOG_LATEST_SOURCE : null,
      version: preserveLatestMode ? version : null,
    });

    updateParams(nextParams);
  };

  const resetFilters = () => {
    if (source === CATALOG_LATEST_SOURCE) {
      updateParams(
        buildCatalogParams({
          source: CATALOG_LATEST_SOURCE,
          version,
        }),
      );
      return;
    }

    if (primaryType) {
      updateParams(
        buildCatalogParams({
          type: primaryType,
        }),
      );
      return;
    }

    updateParams(buildCatalogParams());
  };

  const rawPagination = (listQuery.data?.raw as any)?.data?.params?.pagination;
  const displayCurrentPage = Number(
    rawPagination?.currentPage ?? listQuery.data?.page ?? page ?? 1,
  );
  const displayTotalItems = Number(
    rawPagination?.totalItems ?? listQuery.data?.totalItems ?? 0,
  );
  const displayTotalPages = Math.max(
    Number(rawPagination?.totalPages ?? listQuery.data?.totalPages ?? 1),
    1,
  );
  const listItems = listQuery.data?.items ?? [];
  const isInitialListLoading = listQuery.isLoading && listItems.length === 0;
  const isRefreshingList = listQuery.isFetching && !isInitialListLoading;

  const filterPanel = (
    <div
      id="filter-panel"
      className="w-full rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,25,0.96),rgba(10,10,14,0.96))] p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
    >
      <form onSubmit={handleApplyFilters} className="space-y-5" id="filterForm">
        {keyword ? (
          <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-white/90">
            Đang lọc trong kết quả tìm kiếm cho{" "}
            <span className="font-semibold text-white">"{keyword}"</span>.
          </div>
        ) : null}

        {source === CATALOG_LATEST_SOURCE ? (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            Chế độ <span className="font-semibold">Chiếu Rạp</span> đang dùng
            nguồn phim mới cập nhật. Chọn bộ lọc và bấm áp dụng để chuyển sang
            duyệt toàn kho.
          </div>
        ) : null}

        <FilterChoiceGroup
          title="Quốc gia:"
          name="country[]"
          selectedValues={draftCountry ? [draftCountry] : []}
          options={countryOptions}
          inputType="checkbox"
          onChange={(values) => setDraftCountry(values[0] ?? "")}
        />

        <FilterChoiceGroup
          title="Loại phim:"
          name="type[]"
          selectedValues={draftTypes}
          options={typeOptions}
          inputType="checkbox"
          selectionMode="multiple"
          onChange={(values) => setDraftTypes(normalizeCatalogTypes(values))}
          disabled={typeFilterDisabled}
          hint={typeFilterHint}
        />

        <FilterChoiceGroup
          title="Thể loại:"
          name="category[]"
          selectedValues={draftCategory ? [draftCategory] : []}
          options={categoryOptions}
          inputType="checkbox"
          onChange={(values) => setDraftCategory(values[0] ?? "")}
        />

        <FilterChoiceGroup
          title="Phiên bản:"
          name="sort_lang[]"
          selectedValues={draftSortLang ? [draftSortLang] : []}
          options={sortLanguageOptions}
          inputType="checkbox"
          onChange={(values) => setDraftSortLang(values[0] ?? "")}
        />

        <FilterChoiceGroup
          title="Năm sản xuất:"
          name="year[]"
          selectedValues={draftYear ? [draftYear] : []}
          options={yearOptions}
          inputType="checkbox"
          onChange={(values) => setDraftYear(values[0] ?? "")}
        />

        <FilterChoiceGroup
          title="Sắp xếp:"
          name="sort_field"
          selectedValues={[draftSortField]}
          options={sortFieldOptions}
          inputType="radio"
          onChange={(values) => setDraftSortField(values[0] ?? CATALOG_DEFAULT_SORT_FIELD)}
        />

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Lọc kết quả
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-primary/35 hover:bg-primary/10"
          >
            <RotateCcw className="h-4 w-4" />
            Đặt lại
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="content-shell layout-padding py-10">
      <PageNavigation
        backTo="/"
        backLabel="Trang chủ"
        items={[
          { label: "Trang chủ", to: "/" },
          { label: keyword ? "Kết quả tìm kiếm" : title },
        ]}
      />

      <div className="sticky top-16 z-30 mb-8 overflow-visible rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.12),_transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] backdrop-blur-xl md:relative md:top-auto">
        <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Danh mục phim
            </div>
            <h1 className="mt-3 text-3xl font-black text-white">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
              {subtitle}
            </p>
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
                : `Duyệt tìm${activeFilterCount ? ` (${activeFilterCount})` : ""}`}
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
          </div>
        </div>

        <div className="hidden px-6 py-6 md:block">{filterPanel}</div>
      </div>

      {activeFilterCount ? (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {keyword ? (
            <button
              type="button"
              onClick={() =>
                updateParams(
                  buildCatalogParams({
                    source: source || null,
                    version: source ? version : null,
                    type: type || null,
                    category: category || null,
                    country: country || null,
                    year: year || null,
                    sort_field: sortField,
                    sort_type: sortType,
                    sort_lang: sortLang || null,
                  }),
                )
              }
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:border-primary/35 hover:bg-primary/15"
            >
              <span className="truncate max-w-[16rem]">Từ khóa: {keyword}</span>
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {activeFilterLabels.map((label) => (
            <span
              key={label}
              className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
            >
              {label}
            </span>
          ))}
        </div>
      ) : null}

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
                  Duyệt tìm
                </p>
                <h2 className="mt-1 text-lg font-bold text-white">
                  Tinh chỉnh danh mục
                </h2>
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
              {filterPanel}
            </div>
          </div>
        </div>
      ) : null}

      {listQuery.error ? (
        <p className="text-red-400">
          {(listQuery.error as Error).message ||
            "Không thể tải danh mục phim."}
        </p>
      ) : null}

      {listQuery.data && displayTotalPages > 1 ? (
        <PaginationControls
          className="mb-6"
          currentPage={displayCurrentPage}
          totalPages={displayTotalPages}
          onPageChange={(nextPage) =>
            updateParams(
              buildCatalogParams({
                keyword: keyword || null,
                source: source || null,
                version: source ? version : null,
                type: type || null,
                category: category || null,
                country: country || null,
                year: year || null,
                sort_field: sortField,
                sort_type: sortType,
                sort_lang: sortLang || null,
                page: nextPage,
              }),
            )
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
          <h2 className="mt-5 text-2xl font-black text-white">
            Không có phim phù hợp
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Thử bỏ bớt bộ lọc, chuyển sang duyệt toàn kho hoặc mở feed Chiếu Rạp
            để tiếp tục khám phá phim mới.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => updateParams(buildCatalogParams())}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Duyệt toàn kho
            </button>
            <button
              type="button"
              onClick={() =>
                updateParams(
                  buildCatalogParams({
                    source: CATALOG_LATEST_SOURCE,
                    version: CATALOG_LATEST_VERSION,
                  }),
                )
              }
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-primary/40 hover:bg-primary/10"
            >
              Mở Chiếu Rạp
            </button>
            <button
              type="button"
              onClick={() =>
                updateParams(
                  buildCatalogParams({
                    type: "phim-bo",
                  }),
                )
              }
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-primary/40 hover:bg-primary/10"
            >
              Về Phim bộ
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
            updateParams(
              buildCatalogParams({
                keyword: keyword || null,
                source: source || null,
                version: source ? version : null,
                type: type || null,
                category: category || null,
                country: country || null,
                year: year || null,
                sort_field: sortField,
                sort_type: sortType,
                sort_lang: sortLang || null,
                page: nextPage,
              }),
            )
          }
        />
      ) : null}
    </div>
  );
};

export default CatalogPage;
