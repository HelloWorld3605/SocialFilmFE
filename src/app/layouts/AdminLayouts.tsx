import React from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  ChartColumnBig,
  Clapperboard,
  LogOut,
  MailCheck,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuth } from "@/shared/auth/AuthContext";
import { Button } from "@/shared/components/ui/button";

const navItems = [
  {
    to: "/admin/overview",
    label: "Tổng quan",
    icon: ChartColumnBig,
    description: "Dashboard và hoạt động gần đây",
  },
  {
    to: "/admin/users",
    label: "Người dùng",
    icon: Users,
    description: "Quản lý role và hồ sơ thành viên",
  },
  {
    to: "/admin/pending-registrations",
    label: "Chờ đăng ký",
    icon: MailCheck,
    description: "Reset nhanh các email đang pending",
  },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(229,9,20,0.14),transparent_22%),linear-gradient(180deg,#09090b_0%,#111827_52%,#050816_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1680px] flex-col lg:flex-row">
        <aside className="border-b border-white/10 bg-black/30 backdrop-blur-2xl lg:flex lg:w-80 lg:flex-col lg:border-b-0 lg:border-r">
          <div className="space-y-4 border-b border-white/10 px-6 py-6">
            <Link to="/admin/overview" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">
                  Admin Panel
                </p>
                <h1 className="text-xl font-black tracking-tight text-white">
                  FilmBE Control
                </h1>
              </div>
            </Link>
            <Button
              asChild
              variant="outline"
              className="w-full justify-start border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08]"
            >
              <Link to="/">
                <Clapperboard className="h-4 w-4" />
                <span>Về trang phim</span>
              </Link>
            </Button>
          </div>

          <div className="flex-1 space-y-8 px-4 py-6">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/45">
                Tài khoản quản trị
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white/10">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-black text-white">
                      {user?.fullName?.slice(0, 1).toUpperCase() ?? "A"}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {user?.fullName}
                  </p>
                  <p className="truncate text-xs text-white/55">{user?.email}</p>
                </div>
              </div>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `group flex items-start gap-3 rounded-[24px] border px-4 py-4 transition-all ${
                        isActive
                          ? "border-primary/40 bg-primary/12 text-white shadow-[0_18px_40px_rgba(229,9,20,0.12)]"
                          : "border-white/10 bg-white/[0.03] text-white/75 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                      }`
                    }
                  >
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-black/25">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="mt-1 text-xs text-white/45">
                        {item.description}
                      </p>
                    </div>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="space-y-3 border-t border-white/10 px-4 py-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-white/75 hover:bg-white/[0.08] hover:text-white"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              <span>Đăng xuất</span>
            </Button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="border-b border-white/10 bg-black/15 px-6 py-5 backdrop-blur-xl md:px-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/80">
                  Hệ quản trị
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                  Vận hành người dùng và dữ liệu hệ thống
                </h2>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/65">
                Chỉ tài khoản có role <span className="font-semibold text-white">ADMIN</span>{" "}
                mới truy cập được khu vực này.
              </div>
            </div>
          </div>

          <div className="px-6 py-6 md:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
