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
        </div>
      </div>
    </header>
  );
}
