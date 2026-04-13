import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Bookmark,
  CircleCheckBig,
  Crown,
  HardDriveUpload,
  History,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { useAuth } from "@/shared/auth/AuthContext";
import { api } from "@/shared/lib/api";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

const numberFormatter = new Intl.NumberFormat("vi-VN");

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "Không có dữ liệu";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Không có dữ liệu";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

const AdminDashboardPage = () => {
  const { token } = useAuth();
  const overviewQuery = useQuery({
    queryKey: ["admin-overview", token],
    queryFn: () => api.adminOverview(token as string),
    enabled: Boolean(token),
  });

  const statCards = useMemo(() => {
    if (!overviewQuery.data) {
      return [];
    }

    const stats = overviewQuery.data.stats;
    return [
      {
        label: "Tổng người dùng",
        value: stats.totalUsers,
        meta: `${numberFormatter.format(stats.newUsersLast7Days)} mới trong 7 ngày`,
        icon: Users,
      },
      {
        label: "Admin đang hoạt động",
        value: stats.totalAdmins,
        meta: `${numberFormatter.format(stats.verifiedUsers)} tài khoản đã xác thực`,
        icon: Crown,
      },
      {
        label: "Người dùng xem phim",
        value: stats.activeUsersLast7Days,
        meta: `${numberFormatter.format(stats.watchHistoryLast7Days)} lượt lưu lịch sử trong 7 ngày`,
        icon: Activity,
      },
      {
        label: "Wishlist",
        value: stats.totalWishlistItems,
        meta: `${numberFormatter.format(stats.wishlistItemsLast7Days)} phim mới được lưu trong 7 ngày`,
        icon: Bookmark,
      },
      {
        label: "Lịch sử xem",
        value: stats.totalWatchHistoryEntries,
        meta: "Tổng số mốc xem đã ghi nhận",
        icon: History,
      },
      {
        label: "Tệp tải lên",
        value: stats.totalUploads,
        meta: `${numberFormatter.format(stats.uploadsLast30Days)} file mới trong 30 ngày`,
        icon: HardDriveUpload,
      },
    ];
  }, [overviewQuery.data]);

  if (overviewQuery.isLoading && !overviewQuery.data) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary/80">
            Overview
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
            Dashboard quản trị
          </h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`admin-dashboard-skeleton-${index}`}
              className="h-36 animate-pulse rounded-[28px] border border-white/10 bg-white/[0.04]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (overviewQuery.error || !overviewQuery.data) {
    return (
      <div className="rounded-[28px] border border-red-500/25 bg-red-500/10 p-6 text-red-100">
        {(overviewQuery.error as Error)?.message ||
          "Không thể tải dashboard quản trị."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
        <Card className="rounded-[32px] border-white/10 bg-white/[0.04] text-white shadow-[0_22px_70px_rgba(0,0,0,0.28)]">
          <CardHeader className="pb-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.26em] text-primary">
              <ShieldCheck className="h-4 w-4" />
              Điều hành hệ thống
            </div>
            <CardTitle className="text-3xl font-black tracking-tight text-white">
              Bảng điều khiển admin
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm text-white/65">
              Theo dõi tăng trưởng tài khoản, mức độ sử dụng và các tín hiệu vận
              hành chính của hệ thống phim trong một màn tổng hợp.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {statCards.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-[24px] border border-white/10 bg-black/25 p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge
                      variant="outline"
                      className="border-white/10 bg-white/[0.03] text-white/55"
                    >
                      Live
                    </Badge>
                  </div>
                  <p className="mt-4 text-sm font-medium text-white/60">
                    {item.label}
                  </p>
                  <p className="mt-2 text-3xl font-black text-white">
                    {numberFormatter.format(item.value)}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-white/50">
                    {item.meta}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-white/10 bg-white/[0.04] text-white shadow-[0_22px_70px_rgba(0,0,0,0.28)]">
          <CardHeader>
            <CardTitle className="text-xl font-black text-white">
              Snapshot nhanh
            </CardTitle>
            <CardDescription className="text-white/60">
              Một vài chỉ số vận hành cần nhìn đầu tiên mỗi khi vào panel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
              <div className="flex items-center gap-3">
                <UserPlus className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-white">Tăng trưởng 7 ngày</p>
                  <p className="text-xs text-white/55">
                    Người dùng mới và tài khoản xác thực
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <p className="text-4xl font-black text-white">
                  {numberFormatter.format(overviewQuery.data.stats.newUsersLast7Days)}
                </p>
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">
                  New users
                </p>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-white">Mức độ hoạt động</p>
                  <p className="text-xs text-white/55">
                    Người dùng có phát sinh lịch sử xem trong 7 ngày
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <p className="text-4xl font-black text-white">
                  {numberFormatter.format(overviewQuery.data.stats.activeUsersLast7Days)}
                </p>
                <p className="text-xs uppercase tracking-[0.24em] text-sky-300">
                  Active users
                </p>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
              <div className="flex items-center gap-3">
                <CircleCheckBig className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-white">Tài khoản an toàn</p>
                  <p className="text-xs text-white/55">
                    Số lượng tài khoản đã xác thực email
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <p className="text-4xl font-black text-white">
                  {numberFormatter.format(overviewQuery.data.stats.verifiedUsers)}
                </p>
                <p className="text-xs uppercase tracking-[0.24em] text-amber-300">
                  Verified
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <Card className="rounded-[32px] border-white/10 bg-white/[0.04] text-white">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-black text-white">
                Người dùng mới nhất
              </CardTitle>
              <CardDescription className="mt-2 text-white/55">
                Những tài khoản vừa vào hệ thống, kèm role và mức độ sử dụng ban đầu.
              </CardDescription>
            </div>
            <Link
              to="/admin/users"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/75 transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-white"
            >
              Xem tất cả
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {overviewQuery.data.latestUsers.map((user) => (
              <Link
                key={user.id}
                to={`/admin/users?selected=${user.id}`}
                className="flex items-center gap-4 rounded-[24px] border border-white/10 bg-black/25 px-4 py-4 transition-colors hover:border-primary/30 hover:bg-primary/10"
              >
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white/10">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-base font-black text-white">
                      {user.fullName.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-white">
                      {user.fullName}
                    </p>
                    <Badge
                      variant={user.role === "ADMIN" ? "default" : "outline"}
                      className={
                        user.role === "ADMIN"
                          ? "bg-primary text-white"
                          : "border-white/15 bg-white/[0.03] text-white/65"
                      }
                    >
                      {user.role}
                    </Badge>
                  </div>
                  <p className="truncate text-xs text-white/55">{user.email}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/45">
                    <span>{numberFormatter.format(user.watchHistoryCount)} lịch sử xem</span>
                    <span>•</span>
                    <span>{numberFormatter.format(user.wishlistCount)} wishlist</span>
                    <span>•</span>
                    <span>{formatDateTime(user.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle className="text-xl font-black text-white">
              Hoạt động gần đây
            </CardTitle>
            <CardDescription className="mt-2 text-white/55">
              Các thao tác gần nhất phát sinh từ lịch sử xem và danh sách xem sau.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overviewQuery.data.recentActivity.map((item) => (
              <div
                key={`${item.type}-${item.userId}-${item.movieSlug}-${item.occurredAt}`}
                className="rounded-[24px] border border-white/10 bg-black/25 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <Badge
                    variant={item.type === "WATCH" ? "default" : "secondary"}
                    className={
                      item.type === "WATCH"
                        ? "bg-primary text-white"
                        : "bg-white/10 text-white"
                    }
                  >
                    {item.type === "WATCH" ? "Xem phim" : "Wishlist"}
                  </Badge>
                  <span className="text-xs text-white/45">
                    {formatDateTime(item.occurredAt)}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-white">
                  {item.userName} <span className="font-normal text-white/55">({item.userEmail})</span>
                </p>
                <p className="mt-1 text-sm text-white/65">{item.detail}</p>
                <Link
                  to={`/movie/${item.movieSlug}`}
                  className="mt-3 inline-flex text-xs font-medium text-primary hover:underline"
                >
                  {item.movieName}
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-[32px] border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle className="text-xl font-black text-white">
              Phim được xem nhiều nhất
            </CardTitle>
            <CardDescription className="mt-2 text-white/55">
              Top movie đang tạo ra nhiều dấu vết xem nhất trong hệ thống.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overviewQuery.data.topWatchedMovies.map((movie, index) => (
              <div
                key={`watched-${movie.movieSlug}-${index}`}
                className="flex items-center gap-4 rounded-[24px] border border-white/10 bg-black/25 p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-sm font-black text-primary">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/movie/${movie.movieSlug}`}
                    className="line-clamp-1 text-sm font-semibold text-white hover:text-primary"
                  >
                    {movie.movieName}
                  </Link>
                  <p className="mt-1 text-xs text-white/45">
                    {numberFormatter.format(movie.total)} mốc xem được ghi nhận
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle className="text-xl font-black text-white">
              Phim được lưu nhiều nhất
            </CardTitle>
            <CardDescription className="mt-2 text-white/55">
              Những title được thêm vào wishlist nhiều nhất bởi người dùng.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overviewQuery.data.topWishlistedMovies.map((movie, index) => (
              <div
                key={`wishlisted-${movie.movieSlug}-${index}`}
                className="flex items-center gap-4 rounded-[24px] border border-white/10 bg-black/25 p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-sm font-black text-primary">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/movie/${movie.movieSlug}`}
                    className="line-clamp-1 text-sm font-semibold text-white hover:text-primary"
                  >
                    {movie.movieName}
                  </Link>
                  <p className="mt-1 text-xs text-white/45">
                    {numberFormatter.format(movie.total)} lượt thêm vào xem sau
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default AdminDashboardPage;
