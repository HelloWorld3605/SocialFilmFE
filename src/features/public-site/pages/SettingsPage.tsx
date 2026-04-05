import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  History,
  LogOut,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import PageNavigation from "@/shared/components/PageNavigation";
import { useAuth } from "@/shared/auth/AuthContext";
import { getSkipHistoryDeleteConfirm, setSkipHistoryDeleteConfirm } from "@/shared/lib/deleteConfirmPreference";
import { Switch } from "@/shared/components/ui/switch";

const RECENT_SEARCHES_STORAGE_KEY = "filmfe.recent-searches.v1";

const readRecentSearches = () => {
  if (typeof window === "undefined") {
    return [] as string[];
  }

  try {
    const rawValue = window.localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
    if (!rawValue) {
      return [] as string[];
    }

    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      : [];
  } catch {
    return [] as string[];
  }
};

const SettingsPage = () => {
  const { user, isAuthenticated, isReady, logout } = useAuth();
  const [recentSearchCount, setRecentSearchCount] = useState(() => readRecentSearches().length);
  const [recentSearchMessage, setRecentSearchMessage] = useState<string | null>(null);
  const [historyDeleteMessage, setHistoryDeleteMessage] = useState<string | null>(null);
  const [confirmHistoryDelete, setConfirmHistoryDelete] = useState(
    () => !getSkipHistoryDeleteConfirm(),
  );

  const memberSince = useMemo(() => {
    if (!user?.createdAt) {
      return null;
    }

    const parsedDate = new Date(user.createdAt);
    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(parsedDate);
  }, [user?.createdAt]);

  if (!isReady) {
    return (
      <div className="content-shell layout-padding py-10 text-muted-foreground">
        Đang khôi phục phiên đăng nhập...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }

  const handleClearRecentSearches = () => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify([]));
      setRecentSearchCount(0);
      setRecentSearchMessage("Đã xóa lịch sử tìm kiếm gần đây trên trình duyệt này.");
    } catch {
      setRecentSearchMessage("Không thể xóa dữ liệu cục bộ lúc này.");
    }
  };

  const handleConfirmHistoryDeleteChange = (checked: boolean) => {
    setConfirmHistoryDelete(checked);
    setSkipHistoryDeleteConfirm(!checked);
    setHistoryDeleteMessage(
      checked
        ? "Web sẽ hỏi lại trước khi xóa phim khỏi lịch sử xem ở Trang chủ và Xem sau."
        : "Web sẽ bỏ qua hộp xác nhận và xóa ngay ở Trang chủ và Xem sau.",
    );
  };

  return (
    <div className="layout-padding mx-auto max-w-5xl py-10">
      <PageNavigation
        backTo="/"
        backLabel="Trang chủ"
        items={[
          { label: "Trang chủ", to: "/" },
          { label: "Cài đặt" },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            <Settings2 className="h-4 w-4" />
            <span>Setting</span>
          </div>

          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white/10">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-white">
                  {user.fullName.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0 space-y-2">
              <h1 className="text-3xl font-black text-white">Cài đặt tài khoản</h1>
              <p className="text-sm text-white/70">
                Quản lý hồ sơ, dữ liệu cục bộ và các lối tắt quan trọng của tài khoản xem phim.
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-white/65">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  {user.email}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  Vai trò: {user.role}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
              <div className="flex items-center gap-3">
                <UserRound className="h-5 w-5 text-primary" />
                <p className="text-sm font-semibold text-white">Thông tin hồ sơ</p>
              </div>
              <p className="mt-3 text-sm text-white/70">
                {user.bio?.trim() ? user.bio : "Bạn chưa thêm phần giới thiệu cho hồ sơ cá nhân."}
              </p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <p className="text-sm font-semibold text-white">Xác thực email</p>
              </div>
              <p className="mt-3 text-sm text-white/70">
                {user.emailVerified
                  ? "Tài khoản đã xác thực email."
                  : "Tài khoản chưa xác thực email."}
              </p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-black/20 p-5 sm:col-span-2 xl:col-span-1">
              <div className="flex items-center gap-3">
                <Settings2 className="h-5 w-5 text-primary" />
                <p className="text-sm font-semibold text-white">Thành viên từ</p>
              </div>
              <p className="mt-3 text-sm text-white/70">
                {memberSince ? `Từ ngày ${memberSince}` : "Chưa có dữ liệu ngày tạo tài khoản."}
              </p>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-[32px] border border-white/10 bg-white/5 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/55">
              Điều hướng nhanh
            </p>
            <div className="mt-4 space-y-3">
              <Link
                to="/profile"
                className="flex items-center justify-between rounded-[24px] border border-white/10 bg-black/20 px-4 py-4 text-white transition-colors hover:border-primary/35 hover:bg-primary/10"
              >
                <div className="flex items-center gap-3">
                  <UserRound className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-white">Hồ sơ người dùng</p>
                    <p className="text-xs text-white/60">Cập nhật ảnh đại diện và giới thiệu.</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-white/55" />
              </Link>

              <Link
                to="/wishlist"
                className="flex items-center justify-between rounded-[24px] border border-white/10 bg-black/20 px-4 py-4 text-white transition-colors hover:border-primary/35 hover:bg-primary/10"
              >
                <div className="flex items-center gap-3">
                  <Bookmark className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-white">Danh sách xem sau</p>
                    <p className="text-xs text-white/60">Quản lý các phim bạn đã lưu lại.</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-white/55" />
              </Link>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-white/5 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/55">
              Dữ liệu cục bộ
            </p>
            <div className="mt-4 rounded-[24px] border border-white/10 bg-black/20 p-4">
              <div className="flex items-start gap-3">
                <Search className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">Tìm kiếm gần đây</p>
                  <p className="mt-1 text-sm text-white/65">
                    Hiện đang lưu {recentSearchCount} mục tìm kiếm trên trình duyệt này.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearRecentSearches}
                disabled={recentSearchCount === 0}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-primary/35 hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>Xóa tìm kiếm gần đây</span>
              </button>

              {recentSearchMessage ? (
                <p className="mt-3 text-sm text-green-400">{recentSearchMessage}</p>
              ) : null}
            </div>

            <div className="mt-4 rounded-[24px] border border-white/10 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <History className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">Xóa lịch sử xem</p>
                    <p className="mt-1 text-sm text-white/65">
                      Áp dụng cho thao tác xóa phim ở Trang chủ và trang Xem sau.
                    </p>
                  </div>
                </div>

                <Switch
                  checked={confirmHistoryDelete}
                  onCheckedChange={handleConfirmHistoryDeleteChange}
                  aria-label="Hỏi lại trước khi xóa lịch sử xem"
                />
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-sm font-medium text-white">
                  {confirmHistoryDelete
                    ? "Đang bật xác nhận trước khi xóa"
                    : "Đang bỏ qua xác nhận trước khi xóa"}
                </p>
                <p className="mt-1 text-sm text-white/65">
                  {confirmHistoryDelete
                    ? "Bạn sẽ tiếp tục thấy hộp thoại với tùy chọn “Nhớ lựa chọn của tôi”."
                    : "Các thao tác xóa lịch sử xem sẽ thực hiện ngay mà không hỏi lại."}
                </p>
              </div>

              {historyDeleteMessage ? (
                <p className="mt-3 text-sm text-green-400">{historyDeleteMessage}</p>
              ) : null}
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-white/5 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/55">
              Phiên đăng nhập
            </p>
            <p className="mt-3 text-sm text-white/65">
              Đăng xuất khỏi thiết bị hiện tại nếu bạn không muốn tiếp tục giữ phiên đăng nhập.
            </p>
            <button
              type="button"
              onClick={logout}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-primary/35 hover:bg-primary/10"
            >
              <LogOut className="h-4 w-4" />
              <span>Đăng xuất</span>
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
