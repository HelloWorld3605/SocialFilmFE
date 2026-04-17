import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
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

interface PresetFilterSelectProps {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
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

        const handleSelect = () => {
          if (disabled) {
            return;
          }

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

          onChange(inputType === "checkbox" && checked ? [] : [option.value]);
        };

        return (
          <button
            type="button"
            key={`${name}-${option.value || "all"}`}
            role={inputType === "radio" ? "radio" : "checkbox"}
            aria-checked={checked}
            disabled={disabled}
            onClick={handleSelect}
            className={`inline-flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2 text-sm transition-colors ${
              checked
                ? "border-primary/70 bg-primary/20 text-white"
                : "border-white/10 bg-black/20 text-white/85 hover:border-white/20 hover:bg-black/30"
            } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
          >
            {inputType === "radio" ? (
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
                  checked
                    ? "border-primary bg-primary/20"
                    : "border-white/30 bg-transparent"
                }`}
                aria-hidden="true"
              >
                <span
                  className={`h-2 w-2 rounded-full transition-opacity ${
                    checked ? "bg-primary opacity-100" : "opacity-0"
                  }`}
                />
              </span>
            ) : (
              <span
                className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                  checked
                    ? "border-primary bg-primary text-white"
                    : "border-white/30 bg-transparent text-transparent"
                }`}
                aria-hidden="true"
              >
                <Check className="h-3 w-3" />
              </span>
            )}
            <span>{option.label}</span>
          </button>
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

const PresetFilterSelect = ({
  label,
  options,
  value,
  onChange,
}: PresetFilterSelectProps) => (
  <label className="block">
    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-white/72">
      {label}
    </span>
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full appearance-none rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-4 pr-11 text-sm font-semibold text-white outline-none transition-colors hover:border-primary/35 hover:bg-primary/10 focus:border-primary/45 focus:bg-primary/10 focus:ring-2 focus:ring-primary/25"
        style={{ colorScheme: "dark" }}
      >
        {options.map((option) => (
          <option
            key={option.value || "all"}
            value={option.value}
            className="bg-[#11131b] text-white"
            style={{ backgroundColor: "#11131b", color: "#ffffff" }}
          >
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/75" />
    </div>
  </label>
);

const normalizeQueryValues = (values: Array<string | null | undefined>) =>
  Array.from(
    new Set(
      values
        .map((value) => value?.trim() ?? "")
        .filter(Boolean),
    ),
  );

const normalizeSingleQueryValue = (
  values: Array<string | null | undefined>,
) => {
  const normalizedValues = normalizeQueryValues(values);
  return normalizedValues.length ? [normalizedValues[0]] : [];
};

const collapseFullSelection = (
  values: Array<string | null | undefined>,
  options: FilterOption[],
) => {
  const normalizedValues = normalizeQueryValues(values);
  const selectableValues = options
    .map((option) => option.value)
    .filter(Boolean);

  if (
    selectableValues.length > 0 &&
    normalizedValues.length === selectableValues.length &&
    selectableValues.every((value) => normalizedValues.includes(value))
  ) {
    return [];
  }

  return normalizedValues;
};

const CATALOG_BROWSE_VIEW_MODE = "browse";

const CatalogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const querySignature = searchParams.toString();
  const parsedSearchParams = useMemo(
    () => new URLSearchParams(querySignature),
    [querySignature],
  );

  const {
    source,
    version,
    selectedTypes,
    primaryType,
    keyword,
    categories,
    countries,
    years,
    sortField,
    sortType,
    sortLangs,
    viewMode,
    page,
  } = useMemo(() => {
    const nextSource =
      parsedSearchParams.get("source") === CATALOG_LATEST_SOURCE
        ? CATALOG_LATEST_SOURCE
        : "";
    const nextVersion =
      parsedSearchParams.get("version") || CATALOG_LATEST_VERSION;
    const nextSelectedTypes = normalizeCatalogTypes(
      parsedSearchParams.getAll("type"),
    );

    return {
      source: nextSource,
      version: nextVersion,
      selectedTypes: nextSelectedTypes,
      primaryType:
        nextSelectedTypes.length === 1 ? nextSelectedTypes[0] : null,
      keyword: parsedSearchParams.get("keyword") || "",
      categories: normalizeQueryValues(parsedSearchParams.getAll("category")),
      countries: normalizeQueryValues(parsedSearchParams.getAll("country")),
      years: normalizeSingleQueryValue(parsedSearchParams.getAll("year")),
      sortField:
        parsedSearchParams.get("sort_field") || CATALOG_DEFAULT_SORT_FIELD,
      sortType:
        parsedSearchParams.get("sort_type") || CATALOG_DEFAULT_SORT_TYPE,
      sortLangs: normalizeQueryValues(parsedSearchParams.getAll("sort_lang")),
      viewMode:
        parsedSearchParams.get("mode") === CATALOG_BROWSE_VIEW_MODE
          ? CATALOG_BROWSE_VIEW_MODE
          : "",
      page: Number(parsedSearchParams.get("page") || "1"),
    };
  }, [parsedSearchParams]);

  const [draftTypes, setDraftTypes] = useState<CatalogType[]>(selectedTypes);
  const [draftCategories, setDraftCategories] = useState<string[]>(categories);
  const [draftCountries, setDraftCountries] = useState<string[]>(countries);
  const [draftYears, setDraftYears] = useState<string[]>(years);
  const [draftSortField, setDraftSortField] = useState(sortField);
  const [draftSortLangs, setDraftSortLangs] = useState<string[]>(sortLangs);
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

  const yearOptions = useMemo(() => getCatalogYearOptions(), []);
  const effectiveYears = useMemo(
    () => normalizeSingleQueryValue(years),
    [years],
  );
  const isBrowseFilterView = viewMode === CATALOG_BROWSE_VIEW_MODE;
  const isTypePresetCatalogView =
    !keyword && !isBrowseFilterView && primaryType !== null;
  const isPresetCatalogView =
    !keyword &&
    (source === CATALOG_LATEST_SOURCE || isTypePresetCatalogView);

  useEffect(() => {
    setDraftTypes(selectedTypes);
    setDraftCategories(categories);
    setDraftCountries(countries);
    setDraftYears(effectiveYears);
    setDraftSortField(sortField);
    setDraftSortLangs(sortLangs);
  }, [categories, countries, effectiveYears, selectedTypes, sortField, sortLangs]);

  useEffect(() => {
    if (!mobileFiltersExpanded || isPresetCatalogView) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isPresetCatalogView, mobileFiltersExpanded]);
  const listQuery = useQuery({
    queryKey: [
      "catalog",
      source,
      version,
      selectedTypes.join(","),
      keyword,
      categories.join(","),
      countries.join(","),
      effectiveYears.join(","),
      sortField,
      sortType,
      sortLangs.join(","),
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
      const normalizedYears = normalizeSingleQueryValue(params.getAll("year"));
      params.delete("year");
      normalizedYears.forEach((yearValue) => params.append("year", yearValue));

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

  const categoryLabels = useMemo(
    () =>
      categories
        .map(
          (selectedCategory) =>
            categoriesQuery.data?.find((item) => item.slug === selectedCategory)?.name ??
            selectedCategory,
        )
        .filter(Boolean),
    [categories, categoriesQuery.data],
  );

  const countryLabels = useMemo(
    () =>
      countries
        .map(
          (selectedCountry) =>
            countriesQuery.data?.find((item) => item.slug === selectedCountry)?.name ??
            selectedCountry,
        )
        .filter(Boolean),
    [countries, countriesQuery.data],
  );
  const yearLabel = effectiveYears[0] ?? null;

  const title = useMemo(() => {
    if (keyword) {
      return `Kết quả cho "${keyword}"`;
    }
    if (source === CATALOG_LATEST_SOURCE) {
      return "Chiếu Rạp";
    }
    if (isTypePresetCatalogView && primaryType) {
      return catalogTypeLabels[primaryType];
    }
    return "Duyệt tìm phim";
  }, [isTypePresetCatalogView, keyword, primaryType, source]);

  const subtitle = useMemo(() => {
    if (keyword) {
      return "Tìm trong toàn kho phim và tiếp tục thu gọn bằng quốc gia, thể loại, năm hoặc phiên bản.";
    }
    if (source === CATALOG_LATEST_SOURCE) {
      return "Nguồn Chiếu Rạp đang dùng feed phim mới cập nhật v3. Chọn bộ lọc và bấm áp dụng để chuyển sang chế độ duyệt toàn kho.";
    }
    if (isTypePresetCatalogView && primaryType) {
      return `Khám phá ${catalogTypeLabels[primaryType].toLowerCase()} với bộ lọc động theo quốc gia, thể loại, năm sản xuất và phiên bản.`;
    }
    if (selectedTypes.length > 1) {
      return `Duyệt gộp ${selectedTypes
        .map((item) => catalogTypeLabels[item].toLowerCase())
        .join(", ")} trong cùng một danh mục thông minh.`;
    }
    return null;
  }, [isTypePresetCatalogView, keyword, primaryType, selectedTypes, source]);

  const activeFilterLabels = useMemo(
    () =>
      [
        source === CATALOG_LATEST_SOURCE ? "Nguồn: Chiếu Rạp" : null,
        selectedTypes.length
          ? `Loại phim: ${selectedTypes
              .map((item) => catalogTypeLabels[item])
              .join(", ")}`
          : null,
        categoryLabels.length
          ? `Thể loại: ${categoryLabels.join(", ")}`
          : null,
        countryLabels.length
          ? `Quốc gia: ${countryLabels.join(", ")}`
          : null,
        yearLabel ? `Năm: ${yearLabel}` : null,
        sortLangs.length
          ? `Phiên bản: ${sortLangs
              .map(
                (sortLang) =>
                  sortLanguageOptions.find((item) => item.value === sortLang)?.label ??
                  sortLang,
              )
              .join(", ")}`
          : null,
        sortField !== CATALOG_DEFAULT_SORT_FIELD
          ? `Sắp xếp: ${
              sortFieldOptions.find((item) => item.value === sortField)?.label ??
              sortField
            }`
          : null,
      ].filter((item): item is string => Boolean(item)),
    [categoryLabels, countryLabels, selectedTypes, sortField, sortLangs, source, yearLabel],
  );

  const activeFilterCount = activeFilterLabels.length + (keyword ? 1 : 0);
  const shouldPersistBrowseViewMode =
    isBrowseFilterView &&
    Boolean(
      selectedTypes.length ||
        categories.length ||
        countries.length ||
        effectiveYears.length ||
        sortLangs.length ||
        sortField !== CATALOG_DEFAULT_SORT_FIELD,
    );
  const draftPresetFilterCount =
    Number(Boolean(draftCategories[0])) +
    Number(Boolean(draftCountries[0])) +
    Number(Boolean(draftYears[0])) +
    Number(Boolean(draftSortLangs[0])) +
    Number(draftSortField !== CATALOG_DEFAULT_SORT_FIELD);
  const typeFilterDisabled = Boolean(keyword);
  const typeFilterHint = keyword
    ? "Từ khóa đang bật nên nhóm Loại phim tạm tắt để tránh lệch kết quả từ API tìm kiếm."
    : null;
  const appliedTypes = selectedTypes.length ? selectedTypes : null;
  const mobileFilterButtonLabel = mobileFiltersExpanded
    ? "Ẩn bộ lọc"
    : `${isPresetCatalogView ? "Lọc phim" : "Duyệt tìm"}${
        activeFilterCount ? ` (${activeFilterCount})` : ""
      }`;
  const mobileFilterEyebrow = isPresetCatalogView ? title : "Duyệt tìm";
  const mobileFilterTitle = isPresetCatalogView
    ? "Lọc phim"
    : "Tinh chỉnh danh mục";

  const updateParams = (nextParams: URLSearchParams) => {
    setSearchParams(nextParams);
    setMobileFiltersExpanded(false);
  };

  const handleApplyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextTypes = keyword ? [] : draftTypes;
    const nextYears = normalizeSingleQueryValue(draftYears);
    const hasBrowseSelections = Boolean(
      nextTypes.length ||
        draftCategories.length ||
        draftCountries.length ||
        nextYears.length ||
        draftSortLangs.length ||
        draftSortField !== CATALOG_DEFAULT_SORT_FIELD,
    );

    const preserveLatestMode =
      source === CATALOG_LATEST_SOURCE && !keyword && !hasBrowseSelections;
    const shouldUseBrowseViewMode =
      !preserveLatestMode &&
      hasBrowseSelections &&
      (source === CATALOG_LATEST_SOURCE || !isTypePresetCatalogView);

    const nextParams = buildCatalogParams({
      keyword: keyword || null,
      type: nextTypes.length ? nextTypes : null,
      category: draftCategories.length ? draftCategories : null,
      country: draftCountries.length ? draftCountries : null,
      year: nextYears.length ? nextYears : null,
      sort_field: draftSortField,
      sort_type: CATALOG_DEFAULT_SORT_TYPE,
      sort_lang: draftSortLangs.length ? draftSortLangs : null,
      source: preserveLatestMode ? CATALOG_LATEST_SOURCE : null,
      version: preserveLatestMode ? version : null,
      mode: shouldUseBrowseViewMode ? CATALOG_BROWSE_VIEW_MODE : null,
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

    if (isTypePresetCatalogView && primaryType) {
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
  const displayCurrentPage = Math.max(page || 1, 1);
  const displayTotalItems = Number(
    rawPagination?.totalItems ?? listQuery.data?.totalItems ?? 0,
  );
  const displayTotalPages = Math.max(
    Number(rawPagination?.totalPages ?? listQuery.data?.totalPages ?? 1),
    1,
  );
  const listItems = listQuery.data?.items ?? [];
  const isInitialListLoading = listQuery.isPending;
  const isTransitioningList = listQuery.isPlaceholderData;
  const shouldShowCatalogSkeleton = isInitialListLoading || isTransitioningList;
  const isRefreshingList = listQuery.isFetching && !shouldShowCatalogSkeleton;

  const filterForm = (
    <form onSubmit={handleApplyFilters} className="space-y-5">
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
        selectedValues={draftCountries}
        options={countryOptions}
        inputType="checkbox"
        selectionMode="multiple"
        onChange={(values) => setDraftCountries(normalizeQueryValues(values))}
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
        selectedValues={draftCategories}
        options={categoryOptions}
        inputType="checkbox"
        selectionMode="multiple"
        onChange={(values) => setDraftCategories(normalizeQueryValues(values))}
      />

      <FilterChoiceGroup
        title="Phiên bản:"
        name="sort_lang[]"
        selectedValues={draftSortLangs}
        options={sortLanguageOptions}
        inputType="checkbox"
        selectionMode="multiple"
        onChange={(values) => setDraftSortLangs(normalizeQueryValues(values))}
      />

      <FilterChoiceGroup
        title="Năm sản xuất:"
        name="year[]"
        selectedValues={draftYears}
        options={yearOptions}
        inputType="radio"
        onChange={(values) => setDraftYears(normalizeSingleQueryValue(values))}
      />

      <FilterChoiceGroup
        title="Sắp xếp:"
        name="sort_field"
        selectedValues={[draftSortField]}
        options={sortFieldOptions}
        inputType="radio"
        onChange={(values) =>
          setDraftSortField(values[0] ?? CATALOG_DEFAULT_SORT_FIELD)
        }
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
  );

  const filterPanel = (
    <div
      id="filter-panel"
      className="w-full rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,25,0.96),rgba(10,10,14,0.96))] p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
    >
      {filterForm}
    </div>
  );

  const presetFilterForm = (
    <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(229,9,20,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_26%),linear-gradient(180deg,rgba(14,14,18,0.98),rgba(6,6,8,1))] shadow-[0_28px_90px_rgba(0,0,0,0.34)]">
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <form onSubmit={handleApplyFilters} className="text-white">
        <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Lọc phim
            </div>
            <p className="mt-3 text-sm leading-6 text-white/78">
              Thu gọn danh sách {title.toLowerCase()} theo thể loại, quốc gia,
              năm sản xuất và phiên bản mà không rời khỏi trang hiện tại.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-end">
            <div className="rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-xs font-medium text-white">
              {draftPresetFilterCount
                ? `${draftPresetFilterCount} bộ lọc đang chọn`
                : "Đang xem toàn bộ"}
            </div>
            <button
              type="button"
              onClick={() => setMobileFiltersExpanded((current) => !current)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white transition-colors hover:border-primary/35 hover:bg-primary/10 lg:hidden"
              aria-expanded={mobileFiltersExpanded}
              aria-controls="preset-filter-content"
            >
              <ChevronDown
                className={`h-5 w-5 transition-transform ${
                  mobileFiltersExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
        </div>

        <div
          id="preset-filter-content"
          className={`px-5 py-5 ${mobileFiltersExpanded ? "block" : "hidden lg:block"}`}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <PresetFilterSelect
              label="Sắp xếp"
              options={sortFieldOptions}
              value={draftSortField}
              onChange={(value) =>
                setDraftSortField(value || CATALOG_DEFAULT_SORT_FIELD)
              }
            />
            <PresetFilterSelect
              label="Phiên bản"
              options={sortLanguageOptions}
              value={draftSortLangs[0] ?? ""}
              onChange={(value) => setDraftSortLangs(value ? [value] : [])}
            />
            <PresetFilterSelect
              label="Thể loại"
              options={categoryOptions}
              value={draftCategories[0] ?? ""}
              onChange={(value) => setDraftCategories(value ? [value] : [])}
            />
            <PresetFilterSelect
              label="Quốc gia"
              options={countryOptions}
              value={draftCountries[0] ?? ""}
              onChange={(value) => setDraftCountries(value ? [value] : [])}
            />
            <PresetFilterSelect
              label="Năm sản xuất"
              options={yearOptions}
              value={draftYears[0] ?? ""}
              onChange={(value) => setDraftYears(value ? [value] : [])}
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
            <p className="text-sm text-white/70">
              Áp dụng bộ lọc ngay trên danh mục này để giữ trải nghiệm duyệt
              phim gọn và liền mạch hơn.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-primary/35 hover:bg-primary/10"
              >
                <RotateCcw className="h-4 w-4" />
                Đặt lại
              </button>
              <button
                type="submit"
                className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(229,9,20,0.28)] transition-transform transition-colors hover:scale-[1.01] hover:bg-primary/90"
              >
                Lọc phim
              </button>
            </div>
          </div>
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

      {isPresetCatalogView ? (
        <div className="mb-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Danh mục phim
              </div>
              <h1 className="mt-3 bg-gradient-to-r from-[#ff5a63] via-[#ff7d85] to-[#ffd2d6] bg-clip-text text-2xl font-semibold uppercase text-transparent">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/76">
                  {subtitle}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white">
                {displayTotalItems} phim • {displayTotalPages} trang
              </div>
              {isRefreshingList ? (
                <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75">
                  <Skeleton className="h-2.5 w-2.5 rounded-full" />
                  Đang cập nhật...
                </div>
              ) : null}
            </div>
          </div>

          {presetFilterForm}
        </div>
      ) : (
        <div className="sticky top-16 z-30 mb-8 overflow-visible rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.12),_transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] backdrop-blur-xl md:relative md:top-auto">
          <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Danh mục phim
              </div>
              <h1 className="mt-3 text-3xl font-black text-white">{title}</h1>
              {subtitle ? (
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
                  {subtitle}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileFiltersExpanded((current) => !current)}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-colors hover:border-primary/40 hover:bg-primary/10 md:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {mobileFilterButtonLabel}
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
      )}

      {!isPresetCatalogView && activeFilterCount ? (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {keyword ? (
            <button
              type="button"
              onClick={() =>
                updateParams(
                  buildCatalogParams({
                    source: source || null,
                    version: source ? version : null,
                    type: appliedTypes,
                    category: categories.length ? categories : null,
                    country: countries.length ? countries : null,
                    year: effectiveYears.length ? effectiveYears : null,
                    sort_field: sortField,
                    sort_type: sortType,
                    sort_lang: sortLangs.length ? sortLangs : null,
                    mode: shouldPersistBrowseViewMode
                      ? CATALOG_BROWSE_VIEW_MODE
                      : null,
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

      {mobileFiltersExpanded && !isPresetCatalogView ? (
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
                  {mobileFilterEyebrow}
                </p>
                <h2 className="mt-1 text-lg font-bold text-white">
                  {mobileFilterTitle}
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
              {filterForm}
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
                type: appliedTypes,
                category: categories.length ? categories : null,
                country: countries.length ? countries : null,
                year: effectiveYears.length ? effectiveYears : null,
                sort_field: sortField,
                sort_type: sortType,
                sort_lang: sortLangs.length ? sortLangs : null,
                mode: shouldPersistBrowseViewMode
                  ? CATALOG_BROWSE_VIEW_MODE
                  : null,
                page: nextPage,
              }),
            )
          }
        />
      ) : null}

      {shouldShowCatalogSkeleton ? (
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
                type: appliedTypes,
                category: categories.length ? categories : null,
                country: countries.length ? countries : null,
                year: effectiveYears.length ? effectiveYears : null,
                sort_field: sortField,
                sort_type: sortType,
                sort_lang: sortLangs.length ? sortLangs : null,
                mode: shouldPersistBrowseViewMode
                  ? CATALOG_BROWSE_VIEW_MODE
                  : null,
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
