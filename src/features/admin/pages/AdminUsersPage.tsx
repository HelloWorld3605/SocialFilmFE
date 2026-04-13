import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Save,
  Search,
} from "lucide-react";
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
import { Switch } from "@/shared/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Textarea } from "@/shared/components/ui/textarea";
import type { AdminUpdateUserRequest } from "@/shared/types/api";

const numberFormatter = new Intl.NumberFormat("vi-VN");

const formatDateTime = (value?: string | null) => {
  if (!value) return "Không có dữ liệu";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Không có dữ liệu"
    : new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(parsed);
};

const parseSelectedUserId = (value: string | null) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const panelClass = "rounded-[28px] border border-white/10 bg-black/25 p-5";

const AdminUsersPage = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(Number(searchParams.get("page") ?? "0") || 0, 0);
  const query = searchParams.get("query") ?? "";
  const roleFilter = searchParams.get("role") ?? "ALL";
  const verifiedFilter = searchParams.get("verified") ?? "all";
  const selectedUserId = parseSelectedUserId(searchParams.get("selected"));
  const [draftQuery, setDraftQuery] = useState(query);
  const [message, setMessage] = useState<string | null>(null);
  const [formState, setFormState] = useState<AdminUpdateUserRequest>({
    fullName: "",
    role: "USER",
    emailVerified: false,
    avatarUrl: "",
    bio: "",
  });

  useEffect(() => {
    setDraftQuery(query);
  }, [query]);

  const usersQueryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("size", "10");
    if (query.trim()) params.set("query", query.trim());
    if (roleFilter !== "ALL") params.set("role", roleFilter);
    if (verifiedFilter === "verified") params.set("verified", "true");
    if (verifiedFilter === "unverified") params.set("verified", "false");
    return params;
  }, [page, query, roleFilter, verifiedFilter]);

  const usersQuery = useQuery({
    queryKey: ["admin-users", token, usersQueryParams.toString()],
    queryFn: () => api.adminUsers(token as string, usersQueryParams),
    enabled: Boolean(token),
  });

  const userDetailQuery = useQuery({
    queryKey: ["admin-user", token, selectedUserId],
    queryFn: () => api.adminUser(token as string, selectedUserId as number),
    enabled: Boolean(token && selectedUserId),
  });

  useEffect(() => {
    if (!usersQuery.data?.items.length) return;
    if (selectedUserId && usersQuery.data.items.some((item) => item.id === selectedUserId)) {
      return;
    }
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("selected", String(usersQuery.data.items[0].id));
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, selectedUserId, setSearchParams, usersQuery.data?.items]);

  useEffect(() => {
    if (!userDetailQuery.data?.user) return;
    setFormState({
      fullName: userDetailQuery.data.user.fullName,
      role: userDetailQuery.data.user.role === "ADMIN" ? "ADMIN" : "USER",
      emailVerified: userDetailQuery.data.user.emailVerified,
      avatarUrl: userDetailQuery.data.user.avatarUrl ?? "",
      bio: userDetailQuery.data.user.bio ?? "",
    });
    setMessage(null);
  }, [userDetailQuery.data?.user]);

  const updateMutation = useMutation({
    mutationFn: (payload: AdminUpdateUserRequest) =>
      api.updateAdminUser(token as string, selectedUserId as number, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(["admin-user", token, selectedUserId], data);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      setMessage("Đã cập nhật người dùng.");
    },
    onError: (error) => setMessage((error as Error).message),
  });

  const applyParams = (updates: Record<string, string | null>, replace = false) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) next.delete(key);
      else next.set(key, value);
    });
    setSearchParams(next, { replace });
  };

  const canGoPrev = page > 0;
  const canGoNext = Boolean(usersQuery.data) && page + 1 < (usersQuery.data?.totalPages ?? 0);

  return (
    <div className="space-y-6">
      <Card className="rounded-[32px] border-white/10 bg-white/[0.04] text-white">
        <CardHeader>
          <CardTitle className="text-3xl font-black tracking-tight text-white">
            Quản lý người dùng
          </CardTitle>
          <CardDescription className="text-white/60">
            Lọc, chọn tài khoản và cập nhật role hoặc trạng thái xác thực từ một màn hình.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              applyParams({ query: draftQuery.trim() || null, page: "0" });
            }}
            className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_180px_180px_auto]"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <Input
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value)}
                placeholder="Tìm theo tên hoặc email"
                className="border-white/10 bg-white/[0.04] pl-10 text-white placeholder:text-white/35"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(event) =>
                applyParams({
                  role: event.target.value === "ALL" ? null : event.target.value,
                  page: "0",
                })
              }
              className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none"
            >
              <option value="ALL" className="bg-slate-950">Tất cả role</option>
              <option value="ADMIN" className="bg-slate-950">ADMIN</option>
              <option value="USER" className="bg-slate-950">USER</option>
            </select>
            <select
              value={verifiedFilter}
              onChange={(event) =>
                applyParams({
                  verified: event.target.value === "all" ? null : event.target.value,
                  page: "0",
                })
              }
              className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none"
            >
              <option value="all" className="bg-slate-950">Mọi trạng thái</option>
              <option value="verified" className="bg-slate-950">Đã xác thực</option>
              <option value="unverified" className="bg-slate-950">Chưa xác thực</option>
            </select>
            <Button type="submit">Áp dụng</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.02fr)_minmax(360px,0.98fr)]">
        <Card className="rounded-[32px] border-white/10 bg-white/[0.04] text-white">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-black text-white">Danh sách tài khoản</CardTitle>
              <CardDescription className="text-white/55">
                {usersQuery.data
                  ? `${numberFormatter.format(usersQuery.data.totalItems)} tài khoản phù hợp`
                  : "Đang tải người dùng..."}
              </CardDescription>
            </div>
            {usersQuery.data ? (
              <Badge variant="outline" className="border-white/10 bg-white/[0.03] text-white/60">
                Trang {usersQuery.data.page + 1}/{Math.max(usersQuery.data.totalPages, 1)}
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/50">Người dùng</TableHead>
                  <TableHead className="text-white/50">Role</TableHead>
                  <TableHead className="text-white/50">Xác thực</TableHead>
                  <TableHead className="text-white/50">Sử dụng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersQuery.data?.items.length ? (
                  usersQuery.data.items.map((user) => (
                    <TableRow
                      key={user.id}
                      className={`cursor-pointer border-white/10 ${
                        selectedUserId === user.id
                          ? "bg-primary/10 hover:bg-primary/10"
                          : "hover:bg-white/[0.04]"
                      }`}
                      onClick={() => applyParams({ selected: String(user.id) }, true)}
                    >
                      <TableCell>
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-sm font-semibold text-white">{user.fullName}</p>
                          <p className="line-clamp-1 text-xs text-white/50">{user.email}</p>
                          <p className="mt-1 text-[11px] text-white/40">{formatDateTime(user.createdAt)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.role === "ADMIN" ? "default" : "outline"}
                          className={user.role === "ADMIN"
                            ? "bg-primary text-white"
                            : "border-white/15 bg-white/[0.03] text-white/70"}
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.emailVerified ? "secondary" : "outline"}
                          className={user.emailVerified
                            ? "bg-emerald-500/15 text-emerald-200"
                            : "border-white/15 bg-white/[0.03] text-white/60"}
                        >
                          {user.emailVerified ? "Đã xác thực" : "Chưa xác thực"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-white/55">
                        <div>{numberFormatter.format(user.watchHistoryCount)} lịch sử</div>
                        <div>{numberFormatter.format(user.wishlistCount)} wishlist</div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="border-white/10">
                    <TableCell colSpan={4} className="py-8 text-center text-sm text-white/50">
                      {usersQuery.isLoading ? "Đang tải..." : "Không có người dùng phù hợp."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <p className="text-xs text-white/45">Chọn một tài khoản để mở panel chi tiết.</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08]"
                  disabled={!canGoPrev}
                  onClick={() => applyParams({ page: String(page - 1) })}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08]"
                  disabled={!canGoNext}
                  onClick={() => applyParams({ page: String(page + 1) })}
                >
                  Sau
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle className="text-xl font-black text-white">Hồ sơ chi tiết</CardTitle>
            <CardDescription className="text-white/55">
              Role, xác thực email, avatar và giới thiệu công khai của người dùng.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {userDetailQuery.data ? (
              <>
                <div className={panelClass}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="line-clamp-1 text-lg font-black text-white">
                          {userDetailQuery.data.user.fullName}
                        </h2>
                        <Badge
                          variant={userDetailQuery.data.user.role === "ADMIN" ? "default" : "outline"}
                          className={userDetailQuery.data.user.role === "ADMIN"
                            ? "bg-primary text-white"
                            : "border-white/15 bg-white/[0.03] text-white/70"}
                        >
                          {userDetailQuery.data.user.role}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-white/55">{userDetailQuery.data.user.email}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/45">
                        <span>{formatDateTime(userDetailQuery.data.user.createdAt)}</span>
                        <span>•</span>
                        <span>{numberFormatter.format(userDetailQuery.data.user.watchHistoryCount)} lịch sử</span>
                        <span>•</span>
                        <span>{numberFormatter.format(userDetailQuery.data.user.wishlistCount)} wishlist</span>
                      </div>
                    </div>
                    {userDetailQuery.data.recentWatchHistory[0]?.movieSlug ? (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08]"
                      >
                        <Link to={`/movie/${userDetailQuery.data.recentWatchHistory[0].movieSlug}`}>
                          <ExternalLink className="h-4 w-4" />
                          Mở phim gần nhất
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </div>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    setMessage(null);
                    updateMutation.mutate(formState);
                  }}
                  className={`${panelClass} space-y-4`}
                >
                  <div className="grid gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/70">Họ tên</label>
                      <Input
                        value={formState.fullName}
                        onChange={(event) => setFormState((current) => ({ ...current, fullName: event.target.value }))}
                        className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/35"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-white/70">Role</label>
                        <select
                          value={formState.role}
                          onChange={(event) =>
                            setFormState((current) => ({
                              ...current,
                              role: event.target.value === "ADMIN" ? "ADMIN" : "USER",
                            }))
                          }
                          className="h-10 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none"
                        >
                          <option value="USER" className="bg-slate-950">USER</option>
                          <option value="ADMIN" className="bg-slate-950">ADMIN</option>
                        </select>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium text-white">Xác thực email</p>
                            <p className="mt-1 text-xs text-white/45">Bật/tắt trạng thái xác thực.</p>
                          </div>
                          <Switch
                            checked={formState.emailVerified}
                            onCheckedChange={(checked) =>
                              setFormState((current) => ({ ...current, emailVerified: checked }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/70">Avatar URL</label>
                      <Input
                        value={formState.avatarUrl ?? ""}
                        onChange={(event) => setFormState((current) => ({ ...current, avatarUrl: event.target.value }))}
                        placeholder="https://..."
                        className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/35"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/70">Giới thiệu</label>
                      <Textarea
                        value={formState.bio ?? ""}
                        onChange={(event) => setFormState((current) => ({ ...current, bio: event.target.value }))}
                        className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/35"
                        placeholder="Mô tả ngắn cho hồ sơ công khai"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    {message ? (
                      <p className={`text-sm ${updateMutation.isError ? "text-red-300" : "text-emerald-300"}`}>
                        {message}
                      </p>
                    ) : <span />}
                    <Button type="submit" disabled={updateMutation.isPending}>
                      <Save className="h-4 w-4" />
                      Lưu thay đổi
                    </Button>
                  </div>
                </form>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className={panelClass}>
                    <p className="text-sm font-semibold text-white">Lịch sử xem gần đây</p>
                    <div className="mt-4 space-y-3">
                      {userDetailQuery.data.recentWatchHistory.length ? (
                        userDetailQuery.data.recentWatchHistory.map((item) => (
                          <Link
                            key={item.id}
                            to={`/movie/${item.movieSlug}`}
                            className="block rounded-[22px] border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-primary/30 hover:bg-primary/10"
                          >
                            <p className="line-clamp-1 text-sm font-semibold text-white">{item.movieName}</p>
                            <p className="mt-1 line-clamp-1 text-xs text-white/50">
                              {item.lastEpisodeName || item.originName || "Đang xem"}
                            </p>
                            <p className="mt-2 text-[11px] text-white/40">{formatDateTime(item.updatedAt)}</p>
                          </Link>
                        ))
                      ) : (
                        <p className="text-sm text-white/45">Chưa có lịch sử xem.</p>
                      )}
                    </div>
                  </div>

                  <div className={panelClass}>
                    <p className="text-sm font-semibold text-white">Wishlist gần đây</p>
                    <div className="mt-4 space-y-3">
                      {userDetailQuery.data.recentWishlist.length ? (
                        userDetailQuery.data.recentWishlist.map((item) => (
                          <Link
                            key={item.id}
                            to={`/movie/${item.movieSlug}`}
                            className="block rounded-[22px] border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-primary/30 hover:bg-primary/10"
                          >
                            <p className="line-clamp-1 text-sm font-semibold text-white">{item.movieName}</p>
                            <p className="mt-1 line-clamp-1 text-xs text-white/50">
                              {item.originName || "Đã thêm vào danh sách xem sau"}
                            </p>
                            <p className="mt-2 text-[11px] text-white/40">{formatDateTime(item.createdAt)}</p>
                          </Link>
                        ))
                      ) : (
                        <p className="text-sm text-white/45">Chưa có wishlist.</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className={`${panelClass} text-sm text-white/50`}>
                {userDetailQuery.isLoading
                  ? "Đang tải chi tiết..."
                  : "Chọn một tài khoản ở bảng bên trái để xem chi tiết."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUsersPage;
