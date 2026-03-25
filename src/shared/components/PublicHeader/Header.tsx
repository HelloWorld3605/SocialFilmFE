import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  SearchIcon,
  CrownIcon,
  BellIcon,
  ClockIcon,
  MaximizeIcon,
  UserIcon,
  ChevronDownIcon,
  HeartIcon,
  Film,
  Search,
  Menu,
  X,
  Bell,
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
  const [keyword, setKeyword] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = ["Phim lẻ", "Phim bộ", "Hoạt hình", "Sắp chiếu", "Shows TV"];

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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-gradient-to-b from-background/95 to-transparent backdrop-blur-sm">
      <div className="w-full layout-padding">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <Film className="h-8 w-8 text-primary" />
              <span
                className="text-3xl font-bold tracking-wider text-primary"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                SocialFilm
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link}
                href="#"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {link}
              </a>
            ))}
          </div>

          {/* Right side Actions */}
          <div className="flex items-center gap-3">
            <AnimatePresence>
              {searchOpen && (
                <motion.form
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 220, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="flex items-center h-9 rounded-md border border-border bg-secondary px-3 overflow-hidden"
                  onSubmit={handleSubmit}
                >
                  <input
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                    placeholder="Tìm kiếm phim..."
                    autoFocus
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    disabled={isSearching}
                  />
                </motion.form>
              )}
            </AnimatePresence>

            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Tìm kiếm"
            >
              <Search className="h-5 w-5" />
            </button>

            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  className="hidden md:block p-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Thông báo"
                >
                  <Bell className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Thông báo</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  className="hidden md:block p-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Lịch sử"
                >
                  <ClockIcon className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Lịch sử</p>
              </TooltipContent>
            </Tooltip>

            {/* Login Button */}
            <div className="hidden md:block relative group/login ml-2">
              <button className="flex items-center gap-1 border border-border bg-secondary/50 text-foreground text-sm font-medium px-4 py-1.5 rounded-full cursor-pointer hover:bg-secondary transition-all">
                <UserIcon size={16} />
                <span>Đăng nhập</span>
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-muted-foreground hover:text-foreground md:hidden"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-background/95 backdrop-blur-md border-b border-border shadow-lg"
          >
            <div className="px-4 py-4 flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link}
                  href="#"
                  className="block text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  {link}
                </a>
              ))}

              <div className="h-px w-full bg-border my-2" />

              <div className="flex gap-4">
                <button className="flex flex-1 items-center justify-center gap-2 border border-border bg-secondary/50 text-foreground text-sm font-medium px-4 py-2 rounded-md hover:bg-secondary transition-all">
                  <UserIcon size={16} />
                  <span>Đăng nhập</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
