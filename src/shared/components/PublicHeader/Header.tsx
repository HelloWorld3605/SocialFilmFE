import { FormEvent, useEffect, useState } from "react";
import {
  SearchIcon,
  CrownIcon,
  BellIcon,
  ClockIcon,
  MaximizeIcon,
  UserIcon,
  ChevronDownIcon,
  HeartIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

interface HeaderProps {
  onSearch?: (keyword: string) => void;
  isSearching?: boolean;
}

export function Header({ onSearch, isSearching = false }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch?.(keyword.trim());
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

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
      className={`fixed top-0 left-0 right-0 h-[60px] z-40 flex items-center px-6 gap-6 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md border-b border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center shrink-0">
        <img
          src="/SOCIAL FILM  LOGO.png"
          alt="Social Film Logo"
          className="h-8 w-auto"
        />
      </div>

      {/* Search */}
      <div className="flex-1 max-w-sm">
        <form
          className="flex items-center h-9 rounded-lg bg-white/10 px-4"
          action="/"
          method="GET"
          id="form-filter"
          autoComplete="off"
          onSubmit={handleSubmit}
        >
          <SearchIcon size={16} />
          <input
            id="main-search"
            className="flex-1 bg-transparent outline-none text-white text-sm font-normal placeholder:text-white/90 placeholder:font-normal ml-2"
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

      {/* Nav */}
      <nav className="hidden xl:flex items-center gap-3 text-xs font-normal text-white/90">
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
      <div className="flex-1 flex items-center justify-end gap-3">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              className="bg-transparent border-none cursor-pointer text-white/60 hover:text-white transition-colors p-1"
              aria-label="Danh sách của tôi"
            >
              <HeartIcon size={18} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Danh sách của tôi</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              className="bg-transparent border-none cursor-pointer text-white/60 hover:text-white transition-colors p-1"
              aria-label="Thông báo"
            >
              <BellIcon size={18} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Thông báo</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              className="bg-transparent border-none cursor-pointer text-white/60 hover:text-white transition-colors p-1"
              aria-label="Lịch sử"
            >
              <ClockIcon size={18} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Lịch sử</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              className="bg-transparent border-none cursor-pointer text-white/60 hover:text-white transition-colors p-1"
              aria-label="Toàn màn hình"
              onClick={toggleFullscreen}
            >
              <MaximizeIcon size={18} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Toàn màn hình</p>
          </TooltipContent>
        </Tooltip>

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
