import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, MailCheck, RotateCcw, Search } from "lucide-react";
import { useAuth } from "@/shared/auth/AuthContext";
import { api } from "@/shared/lib/api";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";

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

const AdminPendingRegistrationsPage = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [quickEmail, setQuickEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("size", "12");
    if (query.trim()) {
      params.set("query", query.trim());
    }
    return params;
  }, [page, query]);

  const pendingQuery = useQuery({
    queryKey: ["admin-pending-registrations", token, searchParams.toString()],
    queryFn: () => api.adminPendingRegistrations(token as string, searchParams),
    enabled: Boolean(token),
  });

  const refreshPendingQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-pending-registrations"] });
    queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
  };

  const resetByIdMutation = useMutation({
    mutationFn: (pendingRegistrationId: number) =>
      api.resetPendingRegistration(token as string, pendingRegistrationId),
    onSuccess: (response) => {
      setMessage(response.message);
      refreshPendingQueries();
    },
    onError: (error) => {
      setMessage((error as Error).message);
    },
  });

  const resetByEmailMutation = useMutation({
    mutationFn: (email: string) =>
      api.resetPendingRegistrationByEmail(token as string, email),
    onSuccess: (response) => {
      setMessage(response.message);
      setQuickEmail("");
      refreshPendingQueries();
    },
    onError: (error) => {
      setMessage((error as Error).message);
    },
  });

  const canGoPrev = page > 0;
  const canGoNext =
    Boolean(pendingQuery.data) && page + 1 < (pendingQuery.data?.totalPages ?? 0);

  return (
    <div className="space-y-6">
      <Card className="rounded-[32px] border-white/10 bg-white/[0.04] text-white">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.26em] text-primary">
              <MailCheck className="h-4 w-4" />
              Pending Registrations
            </div>
            <CardTitle className="mt-4 text-3xl font-black tracking-tight text-white">
              Tài khoản đang chờ đăng ký
            </CardTitle>
            <CardDescription className="mt-2 max-w-3xl text-white/60">
              Quản lý các email đã bắt đầu đăng ký nhưng chưa hoàn tất xác thực.
              Admin có thể reset từng bản ghi hoặc reset nhanh theo email để cho
              phép người dùng đăng ký lại ngay.
            </CardDescription>
          </div>
          {pendingQuery.data ? (
            <Badge
              variant="outline"
              className="w-fit border-white/10 bg-white/[0.03] text-white/60"
            >
              {numberFormatter.format(pendingQuery.data.totalItems)} email đang pending
            </Badge>
          ) : null}
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
            <p className="text-sm font-semibold text-white">Reset nhanh theo email</p>
            <p className="mt-1 text-sm text-white/50">
              Dùng khi admin đã biết chính xác email đang mắc ở trạng thái chờ đăng ký.
            </p>

            <form
              className="mt-4 flex flex-col gap-3 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                setMessage(null);
                resetByEmailMutation.mutate(quickEmail.trim());
              }}
            >
              <Input
                type="email"
                value={quickEmail}
                onChange={(event) => setQuickEmail(event.target.value)}
                placeholder="nhap-email@example.com"
                className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/35"
              />
              <Button
                type="submit"
                disabled={!quickEmail.trim() || resetByEmailMutation.isPending}
              >
                <RotateCcw className="h-4 w-4" />
                Reset nhanh
              </Button>
            </form>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
            <p className="text-sm font-semibold text-white">Lọc danh sách pending</p>
            <p className="mt-1 text-sm text-white/50">
              Tìm theo email để xử lý nhanh các yêu cầu đăng ký đang chờ.
            </p>

            <form
              className="mt-4 flex flex-col gap-3 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                setPage(0);
              }}
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tìm theo email đang chờ đăng ký"
                  className="border-white/10 bg-white/[0.04] pl-10 text-white placeholder:text-white/35"
                />
              </div>
              <Button type="submit" variant="outline" className="border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08]">
                Lọc
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {message ? (
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-emerald-300">
          {message}
        </div>
      ) : null}

      <Card className="rounded-[32px] border-white/10 bg-white/[0.04] text-white">
        <CardHeader>
          <CardTitle className="text-xl font-black text-white">
            Danh sách email đang pending
          </CardTitle>
          <CardDescription className="text-white/55">
            Reset từng bản ghi để giải phóng ngay trạng thái chờ đăng ký cho người dùng.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingQuery.isLoading && !pendingQuery.data ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`pending-skeleton-${index}`}
                  className="h-24 animate-pulse rounded-[24px] border border-white/10 bg-black/20"
                />
              ))}
            </div>
          ) : pendingQuery.data?.items.length ? (
            pendingQuery.data.items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-black/25 p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-white">
                      {item.email}
                    </p>
                    <Badge
                      variant={item.expired ? "outline" : "secondary"}
                      className={
                        item.expired
                          ? "border-white/15 bg-white/[0.03] text-white/55"
                          : "bg-amber-500/15 text-amber-200"
                      }
                    >
                      {item.expired ? "Đã hết hạn" : "Còn hiệu lực"}
                    </Badge>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/45">
                    <span>Tạo lúc {formatDateTime(item.createdAt)}</span>
                    <span>•</span>
                    <span>Hết hạn {formatDateTime(item.expiresAt)}</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08]"
                  disabled={
                    resetByIdMutation.isPending &&
                    resetByIdMutation.variables === item.id
                  }
                  onClick={() => {
                    setMessage(null);
                    resetByIdMutation.mutate(item.id);
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset bản ghi này
                </Button>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-white/10 bg-black/25 p-5 text-sm text-white/50">
              Không có email nào đang chờ đăng ký phù hợp với bộ lọc hiện tại.
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-white/45">
              {pendingQuery.data
                ? `Trang ${pendingQuery.data.page + 1}/${Math.max(pendingQuery.data.totalPages, 1)}`
                : "Đang tải dữ liệu pending"}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08]"
                disabled={!canGoPrev}
                onClick={() => setPage((current) => Math.max(current - 1, 0))}
              >
                <ChevronLeft className="h-4 w-4" />
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08]"
                disabled={!canGoNext}
                onClick={() => setPage((current) => current + 1)}
              >
                Sau
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPendingRegistrationsPage;
