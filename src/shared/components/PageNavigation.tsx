import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface PageNavigationItem {
  label: string;
  to?: string;
}

interface PageNavigationProps {
  items: PageNavigationItem[];
  backTo?: string;
  backLabel?: string;
}

const PageNavigation = ({ items, backTo, backLabel = "Quay lại" }: PageNavigationProps) => {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      {backTo ? (
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition-colors hover:border-primary/40 hover:bg-primary/10"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>{backLabel}</span>
        </Link>
      ) : (
        <div />
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <div key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 ? <ChevronRight className="h-3.5 w-3.5 text-white/30" /> : null}
              {item.to && !isLast ? (
                <Link to={item.to} className="transition-colors hover:text-white">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-white" : ""}>{item.label}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PageNavigation;
