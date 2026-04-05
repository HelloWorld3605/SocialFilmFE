import { Skeleton } from "@/shared/components/ui/skeleton";

const MovieCardSkeleton = () => (
  <div className="flex min-w-[160px] flex-col gap-3 sm:min-w-[200px]">
    <Skeleton className="aspect-[2/3] rounded-lg" />
    <div className="space-y-3 px-1">
      <div className="space-y-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3.5 w-1/2" />
      </div>
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  </div>
);

export default MovieCardSkeleton;
