import { FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/shared/auth/AuthContext";
import PageNavigation from "@/shared/components/PageNavigation";

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get("mode") === "register" ? "register" : "login";
  const { login, startRegistration, isAuthenticated, isReady } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [debugVerificationUrl, setDebugVerificationUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isReady && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    setSuccessMessage(null);
    setDebugVerificationUrl(null);
    setLoading(true);
    try {
      if (mode === "register") {
        const email = String(formData.get("email") || "");
        const response = await startRegistration({ email });
        setRegisteredEmail(email);
        setSuccessMessage(response.message);
        setDebugVerificationUrl(response.debugVerificationUrl ?? null);
      } else {
        await login({
          email: String(formData.get("email") || ""),
          password: String(formData.get("password") || ""),
        });
        navigate("/");
      }
    } catch (authError) {
      setError((authError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-shell layout-padding flex min-h-[calc(100vh-160px)] items-center py-12">
      <div className="w-full">
        <PageNavigation
          backTo="/"
          backLabel="Trang chủ"
          items={[
            { label: "Trang chủ", to: "/" },
            { label: mode === "register" ? "Đăng ký" : "Đăng nhập" },
          ]}
        />

        <div className="grid w-full gap-8 rounded-[36px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-primary">Tài khoản</p>
            <h1 className="text-4xl font-black text-white">
              Đăng nhập để đồng bộ danh sách xem sau, lịch sử xem và hồ sơ cá nhân.
            </h1>
            <p className="text-muted-foreground">
              Tài khoản được lưu trên MySQL và xác thực bằng JWT từ máy chủ Spring Boot.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 rounded-[28px] bg-black/30 p-6">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessMessage(null);
                  setRegisteredEmail(null);
                  setDebugVerificationUrl(null);
                  setSearchParams({ mode: "login" });
                }}
                className={`rounded-full px-4 py-2 text-sm ${
                  mode === "login" ? "bg-primary text-white" : "bg-white/5 text-muted-foreground"
                }`}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessMessage(null);
                  setRegisteredEmail(null);
                  setDebugVerificationUrl(null);
                  setSearchParams({ mode: "register" });
                }}
                className={`rounded-full px-4 py-2 text-sm ${
                  mode === "register"
                    ? "bg-primary text-white"
                    : "bg-white/5 text-muted-foreground"
                }`}
              >
                Đăng ký
              </button>
            </div>

            {mode === "register" ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
                Đăng ký theo cơ chế mã xác thực email: nhập email, mở liên kết trong thư,
                sau đó hoàn tất hồ sơ và mật khẩu.
              </div>
            ) : null}
            <input
              name="email"
              type="email"
              placeholder="Email"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-muted-foreground"
              required
            />
            {mode === "login" ? (
              <input
                name="password"
                type="password"
                placeholder="Mật khẩu"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-muted-foreground"
                required
              />
            ) : null}
            {successMessage ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                <p>{successMessage}</p>
                {registeredEmail ? (
                  <p className="mt-2">
                    Hãy kiểm tra hộp thư của <span className="font-semibold">{registeredEmail}</span>.
                  </p>
                ) : null}
                {debugVerificationUrl ? (
                  <p className="mt-3">
                    <Link
                      to={debugVerificationUrl.replace(window.location.origin, "")}
                      className="font-semibold text-white underline"
                    >
                      Mở liên kết xác thực nội bộ
                    </Link>
                  </p>
                ) : null}
              </div>
            ) : null}
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-primary px-5 py-3 font-semibold text-white"
            >
              {loading
                ? "Đang xử lý..."
                : mode === "register"
                  ? "Gửi email xác thực"
                  : "Đăng nhập"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
