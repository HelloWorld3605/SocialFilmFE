import { Search, Bell, Home, Download, Monitor, Heart } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-3 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">New</a>
          <span className="text-muted-foreground/30">·</span>
          <a href="#" className="hover:text-foreground transition-colors">Movies</a>
          <span className="text-muted-foreground/30">·</span>
          <a href="#" className="hover:text-foreground transition-colors">Series</a>
          <span className="text-muted-foreground/30">·</span>
          <a href="#" className="hover:text-foreground transition-colors">Cartoons</a>
        </div>
      </div>

      <h1 className="text-xl font-bold tracking-widest text-foreground absolute left-1/2 -translate-x-1/2">
        AGENCY
      </h1>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>
        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors relative">
          <Bell className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
          U
        </div>
      </div>

      {/* Side icons - desktop only */}
      <div className="hidden lg:flex fixed left-4 top-1/2 -translate-y-1/2 flex-col gap-5 z-50">
        {[Home, Download, Monitor, Heart].map((Icon, i) => (
          <button key={i} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Icon className="w-5 h-5" />
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
