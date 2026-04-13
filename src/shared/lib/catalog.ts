export const CATALOG_DEFAULT_LIMIT = 24;
export const CATALOG_DEFAULT_SORT_FIELD = "modified.time";
export const CATALOG_DEFAULT_SORT_TYPE = "desc";
export const CATALOG_LATEST_SOURCE = "latest";
export const CATALOG_LATEST_VERSION = "v3";
export const CATALOG_FILTER_MIN_YEAR = 2010;

export const CATALOG_TYPES = [
  "phim-bo",
  "phim-le",
  "tv-shows",
  "hoat-hinh",
] as const;

export type CatalogType = (typeof CATALOG_TYPES)[number];

export interface FilterOption {
  value: string;
  label: string;
}

export interface TaxonomyItem {
  name: string;
  slug: string;
}

export const catalogTypeLabels: Record<CatalogType, string> = {
  "phim-bo": "Phim bộ",
  "phim-le": "Phim lẻ",
  "tv-shows": "TV Shows",
  "hoat-hinh": "Hoạt Hình",
};

export const sortFieldOptions: FilterOption[] = [
  { value: "modified.time", label: "Mới cập nhật" },
  { value: "_id", label: "Thời gian đăng" },
  { value: "year", label: "Năm sản xuất" },
];

export const sortLanguageOptions: FilterOption[] = [
  { value: "", label: "Tất cả" },
  { value: "vietsub", label: "Phụ đề" },
  { value: "thuyet-minh", label: "Thuyết minh" },
  { value: "long-tieng", label: "Lồng tiếng" },
];

const preferredCountryOrder = [
  "viet-nam",
  "trung-quoc",
  "thai-lan",
  "hong-kong",
  "phap",
  "duc",
  "ha-lan",
  "mexico",
  "thuy-dien",
  "philippines",
  "dan-mach",
  "thuy-si",
  "ukraina",
  "han-quoc",
  "au-my",
  "an-do",
  "canada",
  "tay-ban-nha",
  "indonesia",
  "ba-lan",
  "malaysia",
  "bo-dao-nha",
  "uae",
  "chau-phi",
  "a-rap-xe-ut",
  "nhat-ban",
  "dai-loan",
  "anh",
  "quoc-gia-khac",
  "tho-nhi-ky",
  "nga",
  "uc",
  "brazil",
  "y",
  "na-uy",
  "nam-phi",
] as const;

const preferredCategoryOrder = [
  "hanh-dong",
  "mien-tay",
  "tre-em",
  "lich-su",
  "co-trang",
  "chien-tranh",
  "vien-tuong",
  "kinh-di",
  "tai-lieu",
  "bi-an",
  "phim-18",
  "tinh-cam",
  "tam-ly",
  "the-thao",
  "phieu-luu",
  "am-nhac",
  "gia-dinh",
  "hoc-duong",
  "hai-huoc",
  "hinh-su",
  "vo-thuat",
  "khoa-hoc",
  "than-thoai",
  "chinh-kich",
  "kinh-dien",
] as const;

export const isCatalogType = (value: string | null | undefined): value is CatalogType =>
  Boolean(value && (CATALOG_TYPES as readonly string[]).includes(value));

export const normalizeCatalogType = (
  value: string | null | undefined,
): CatalogType | "" => (isCatalogType(value) ? value : "");

export const normalizeCatalogTypes = (
  values: Array<string | null | undefined>,
): CatalogType[] =>
  Array.from(
    new Set(
      values.flatMap((value) => {
        const normalized = normalizeCatalogType(value);
        return normalized ? [normalized] : [];
      }),
    ),
  );

export const getCatalogYearValues = () => {
  const currentYear = new Date().getFullYear();
  return Array.from(
    { length: currentYear - CATALOG_FILTER_MIN_YEAR + 1 },
    (_, index) => String(currentYear - index),
  );
};

export const getCatalogYearOptions = (): FilterOption[] => [
  { value: "", label: "Tất cả" },
  ...getCatalogYearValues().map((year) => ({
    value: year,
    label: year,
  })),
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const unwrapTaxonomyPayload = (payload: unknown): unknown[] => {
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

export const normalizeTaxonomyItems = (payload: unknown): TaxonomyItem[] =>
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

export const sortTaxonomyItems = (
  items: TaxonomyItem[],
  kind: "category" | "country",
) => {
  const preferredOrder =
    kind === "country" ? preferredCountryOrder : preferredCategoryOrder;
  const preferredMap = new Map(
    preferredOrder.map((slug, index) => [slug, index]),
  );

  return [...items].sort((left, right) => {
    const leftIndex = preferredMap.get(left.slug);
    const rightIndex = preferredMap.get(right.slug);

    if (leftIndex !== undefined || rightIndex !== undefined) {
      if (leftIndex === undefined) return 1;
      if (rightIndex === undefined) return -1;
      if (leftIndex !== rightIndex) return leftIndex - rightIndex;
    }

    return left.name.localeCompare(right.name, "vi");
  });
};

export const buildCatalogParams = (
  overrides: Record<
    string,
    string | number | Array<string | number> | null | undefined
  > = {},
  options?: { includeDefaults?: boolean },
) => {
  const params = new URLSearchParams();
  const includeDefaults = options?.includeDefaults ?? true;

  if (includeDefaults) {
    params.set("page", "1");
    params.set("limit", String(CATALOG_DEFAULT_LIMIT));
    params.set("sort_field", CATALOG_DEFAULT_SORT_FIELD);
    params.set("sort_type", CATALOG_DEFAULT_SORT_TYPE);
  }

  Object.entries(overrides).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      params.delete(key);
      value
        .map((item) => `${item}`.trim())
        .filter(Boolean)
        .forEach((item) => params.append(key, item));
      return;
    }

    if (value === null || value === undefined || `${value}`.trim() === "") {
      params.delete(key);
      return;
    }
    params.set(key, String(value));
  });

  return params;
};

export const buildCatalogHref = (
  overrides: Record<
    string,
    string | number | Array<string | number> | null | undefined
  > = {},
  options?: { includeDefaults?: boolean },
) => {
  const params = buildCatalogParams(overrides, options);
  const query = params.toString();
  return query ? `/catalog?${query}` : "/catalog";
};
