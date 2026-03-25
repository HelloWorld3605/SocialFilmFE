import { TrendingUp, Flame, Clock, Star } from "lucide-react";
import { useState } from "react";

const tabs = [
  { label: "Trending", icon: TrendingUp },
  { label: "Popular", icon: Flame },
  { label: "Recently added", icon: Clock },
  { label: "Premium", icon: Star },
];

const CategoryTabs = () => {
  const [active, setActive] = useState(0);

  return (
    <div className="flex items-center justify-center gap-6 md:gap-10 py-6 layout-padding">
      {tabs.map((tab, i) => (
        <button
          key={tab.label}
          onClick={() => setActive(i)}
          className={`flex items-center gap-2 text-sm font-medium transition-colors pb-2 ${
            active === i
              ? "text-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <tab.icon className="w-4 h-4" />
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default CategoryTabs;
