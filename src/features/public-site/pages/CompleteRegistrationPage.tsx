import { FormEvent, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/shared/auth/AuthContext";
import PageNavigation from "@/shared/components/PageNavigation";

const CompleteRegistrationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { completeRegistration, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const email = useMemo(() => searchParams.get("email"), [searchParams]);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!token) {
    return (
      <div className="layout-padding mx-auto max-w-3xl py-12">
        <PageNavigation
          backTo="/auth?mode=register"
          backLabel="Đăng ký"
          items={[
            { label: "Trang chủ", to: "/" },
            { label: "Đăng ký", to: "/auth?mode=register" },
            { label: "Hoàn tất đăng ký" },
          ]}
        />

        <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 text-white">
          <h1 className="text-3xl font-black">Thiếu token xác thực</h1>
          <p className="mt-4 text-muted-foreground">
            Hãy mở lại liên kết trong email hoặc yêu cầu gửi lại từ trang đăng ký.
          </p>
          <Link
            to="/auth?mode=register"
            className="mt-6 inline-flex rounded-2xl bg-primary px-5 py-3 font-semibold text-white"
          >
            Quay lại đăng ký
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await completeRegistration({
        verificationToken: token,
        fullName: String(formData.get("fullName") || ""),
        password,
      });
      navigate("/");
    } catch (completeError) {
      setError((completeError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-shell layout-padding flex min-h-[calc(100vh-160px)] items-center py-12">
      <div className="w-full">
        <PageNavigation
          backTo="/auth?mode=register"
          backLabel="Đăng ký"
          items={[
            { label: "Trang chủ", to: "/" },
            { label: "Đăng ký", to: "/auth?mode=register" },
            { label: "Hoàn tất đăng ký" },
          ]}
        />

        <div className="grid w-full gap-8 rounded-[36px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-primary">Đăng ký</p>
            <h1 className="text-4xl font-black text-white">Hoàn tất đăng ký tài khoản SocialFilm.</h1>
            <p className="text-muted-foreground">
              {email ? `Email đang xác thực: ${email}. ` : ""}
              Thiết lập tên hiển thị và mật khẩu để kích hoạt tài khoản.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 rounded-[28px] bg-black/30 p-6">
            <input
              name="fullName"
              placeholder="Họ và tên"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-muted-foreground"
              required
            />
            <input
              name="password"
              type="password"
              placeholder="Mật khẩu"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-muted-foreground"
              required
            />
            <input
              name="confirmPassword"
              type="password"
              placeholder="Nhập lại mật khẩu"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-muted-foreground"
              required
            />
            <p className="text-sm text-muted-foreground">
              Mật khẩu phải có ít nhất 6 ký tự, gồm chữ hoa, chữ thường và số.
            </p>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-primary px-5 py-3 font-semibold text-white"
            >
              {loading ? "Đang hoàn tất..." : "Hoàn tất đăng ký"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteRegistrationPage;
