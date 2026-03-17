import { FormEvent, useEffect, useState } from "react";
import {
  SearchIcon,
  CrownIcon,
  BellIcon,
  ClockIcon,
  MaximizeIcon,
  UserIcon,
  ChevronDownIcon,
} from "lucide-react";

interface HeaderProps {
  onSearch?: (keyword: string) => void;
  isSearching?: boolean;
}

export function Header({ onSearch, isSearching = false }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [keyword, setKeyword] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch?.(keyword.trim());
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 h-[60px] pt-3 z-40 flex items-center px-4 pl-[212px] transition-all duration-300 ${
        isScrolled
          ? "bg-[#101010]/95 backdrop-blur-md border-b border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      {/* Spacer for left alignment */}
      <div className="flex-1" />

      {/* Search Bar - centered absolute */}
      <div
        id="search"
        className="absolute left-0 top-1/2 -translate-y-1/2 block h-[44.8px] w-[368px] max-w-[368px] text-[14px] leading-[22.4px] text-[#aaaaaa]"
        style={{
          boxSizing: "border-box",
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
          WebkitTapHighlightColor: "rgba(0, 0, 0, 0)",
        }}
      >
        <form
          className="search-elements flex h-full items-center rounded-lg bg-white/10 px-4 backdrop-blur-sm"
          action="/"
          method="GET"
          id="form-filter"
          autoComplete="off"
          onSubmit={handleSubmit}
        >
          <div
            className="search-icon mr-2.5 flex shrink-0 items-center text-white"
            style={{ marginTop: "-2px" }}
          >
            <SearchIcon size={16} />
          </div>
          <input
            id="main-search"
            className="search-input h-full w-full border-none bg-transparent text-[14px] font-normal leading-[22.4px] text-white outline-none placeholder:font-normal placeholder:text-white"
            placeholder="Tìm kiếm phim, diễn viên"
            autoComplete="off"
            type="text"
            name="s"
            aria-label="Tìm kiếm phim, diễn viên"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            disabled={isSearching}
          />
        </form>
      </div>

      <nav className="absolute left-[392px] top-1/2 hidden -translate-y-1/2 items-center gap-5 text-sm font-normal text-white/90 xl:flex">
        <button
          type="button"
          className="font-normal transition-colors hover:text-white"
        >
          Phim Lẻ
        </button>
        <button
          type="button"
          className="font-normal transition-colors hover:text-white"
        >
          Phim Bộ
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 font-normal transition-colors hover:text-white"
        >
          Thể Loại
          <ChevronDownIcon size={14} />
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 font-normal transition-colors hover:text-white"
        >
          Quốc Gia
          <ChevronDownIcon size={14} />
        </button>
        <button
          type="button"
          className="font-normal transition-colors hover:text-white"
        >
          TV Shows
        </button>
        <button
          type="button"
          className="font-normal transition-colors hover:text-white"
        >
          Phim Chiếu Rạp
        </button>
      </nav>

      {/* Right side actions */}
      <div className="flex-1 flex items-center justify-end gap-3 -translate-y-1.5">
        {/* VIP Button */}
        <button className="flex items-center gap-1 bg-gradient-to-r from-amber-600 to-amber-500 text-white text-xs font-medium px-3 py-1 rounded-full border-none cursor-pointer hover:from-amber-500 hover:to-amber-400 transition-all">
          <CrownIcon size={12} />
          <span>Mua ngay</span>
        </button>

        <button
          className="bg-transparent border-none cursor-pointer text-white/60 hover:text-white transition-colors p-1"
          aria-label="Thông báo"
        >
          <BellIcon size={18} />
        </button>

        <button
          className="bg-transparent border-none cursor-pointer text-white/60 hover:text-white transition-colors p-1"
          aria-label="Lịch sử"
        >
          <ClockIcon size={18} />
        </button>

        <button
          className="bg-transparent border-none cursor-pointer text-white/60 hover:text-white transition-colors p-1"
          aria-label="Toàn màn hình"
        >
          <MaximizeIcon size={18} />
        </button>

        {/* Login with hover popup */}
        <div className="relative group/login">
          <button className="flex items-center gap-1 bg-transparent border border-white/25 text-white/80 text-xs px-3 py-1 rounded-full cursor-pointer hover:border-white/50 hover:text-white transition-all">
            <UserIcon size={14} />
            <span>Đăng nhập</span>
          </button>

          <div className="absolute right-0 top-full pt-3 opacity-0 invisible translate-y-1 pointer-events-none transition-all duration-200 group-hover/login:opacity-100 group-hover/login:visible group-hover/login:translate-y-0 group-hover/login:pointer-events-auto group-focus-within/login:opacity-100 group-focus-within/login:visible group-focus-within/login:translate-y-0 group-focus-within/login:pointer-events-auto">
            <div className="relative w-[460px] max-w-[calc(100vw-240px)] overflow-hidden rounded-[10px] border border-white/10 bg-[#2e313d]/95 shadow-[0_16px_36px_rgba(0,0,0,0.45)] backdrop-blur-md">
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(105deg, rgba(67,71,88,0.95) 0%, rgba(45,49,62,0.96) 58%, rgba(43,46,59,0.9) 100%)",
                }}
              />
              <span className="absolute right-5 top-2 text-[58px] font-black leading-none tracking-tight text-white/[0.04] pointer-events-none">
                VIP
              </span>

              <div className="relative z-10 flex items-center justify-between gap-4 px-3.5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 shrink-0 rounded-full border border-white/40 bg-white/10 text-white/75 flex items-center justify-center">
                      <UserIcon size={22} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-[23px] leading-none font-semibold tracking-tight text-white">
                        Đăng nhập/Đăng ký{" "}
                        <span className="text-white/90">&gt;</span>
                      </h3>
                      <p className="mt-2 text-[10px] leading-none text-white/55 truncate">
                        Đồng bộ lịch sử xem, tận hưởng chất lượng cao
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-[23px] leading-none font-bold tracking-tight text-[#ffba2a]">
                      Mở gói hội viên
                    </p>
                    <p className="mt-1 text-[24px] leading-none tracking-tight text-white">
                      Chỉ từ
                      <span className="mx-1 font-semibold text-[#ff5336]">
                        12
                      </span>
                      nghìn, xem cực đã
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="mt-10 shrink-0 rounded-md bg-[#f3cd7b] px-4 py-2 text-[17px] leading-none font-medium text-[#4f3a11] transition-colors hover:bg-[#f8d894]"
                >
                  Mở ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
