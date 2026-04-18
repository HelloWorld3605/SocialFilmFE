import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "@/shared/lib/api";
import PageNavigation from "@/shared/components/PageNavigation";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validating, setValidating] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const validate = async () => {
      if (!token) {
        setError("Không tìm thấy token đặt lại mật khẩu.");
        setValidating(false);
        return;
      }

      try {
        const response = await api.validatePasswordResetToken(token);
        if (!isMounted) {
          return;
        }
        setEmail(response.email);
      } catch (validationError) {
        if (isMounted) {
          setError((validationError as Error).message);
        }
      } finally {
        if (isMounted) {
          setValidating(false);
        }
      }
    };

    validate();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setError("Không tìm thấy token đặt lại mật khẩu.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await api.resetPassword({
        resetToken: token,
        password,
      });
      setSuccessMessage(response.message);
      window.setTimeout(() => navigate("/auth?mode=login", { replace: true }), 1500);
    } catch (resetError) {
      setError((resetError as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="content-shell layout-padding flex min-h-[calc(100vh-160px)] items-center py-12">
      <div className="w-full">
        <PageNavigation
          backTo="/auth?mode=login"
          backLabel="Đăng nhập"
          items={[
            { label: "Trang chủ", to: "/" },
            { label: "Đăng nhập", to: "/auth?mode=login" },
            { label: "Đặt lại mật khẩu" },
          ]}
        />

        <div className="mx-auto max-w-3xl rounded-[28px] border border-white/10 bg-black/30 p-6 backdrop-blur-xl lg:p-8">
          {validating ? (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.28em] text-primary/80">Xác thực</p>
              <h1 className="text-3xl font-black text-white">Đang kiểm tra liên kết đặt lại mật khẩu...</h1>
              <p className="text-sm leading-6 text-white/60">
                Hệ thống đang xác thực token trước khi cho phép bạn đặt mật khẩu mới.
              </p>
            </div>
          ) : error && !successMessage ? (
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.28em] text-red-400">Đặt lại mật khẩu</p>
              <h1 className="text-3xl font-black text-white">Liên kết không hợp lệ</h1>
              <p className="text-sm leading-6 text-white/60">{error}</p>
              <Link
                to="/forgot-password"
                className="inline-flex rounded-[2px] bg-primary px-5 py-3 font-semibold text-white"
              >
                Yêu cầu liên kết mới
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.28em] text-primary/80">Đặt lại mật khẩu</p>
                <h1 className="text-3xl font-black text-white">Tạo mật khẩu mới</h1>
                <p className="text-sm leading-6 text-white/60">
                  {email ? `Tài khoản cần đặt lại mật khẩu: ${email}. ` : ""}
                  Nhập mật khẩu mới để tiếp tục đăng nhập vào SocialFilm.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <input
                  name="password"
                  type="password"
                  placeholder="Mật khẩu mới"
                  className="w-full rounded-[2px] border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-white/32"
                  required
                />
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full rounded-[2px] border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-white/32"
                  required
                />
                <p className="text-sm text-white/60">
                  Mật khẩu phải có ít nhất 6 ký tự, gồm chữ hoa, chữ thường và số.
                </p>

                {successMessage ? (
                  <div className="rounded-[2px] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                    {successMessage}
                  </div>
                ) : null}

                {error ? (
                  <div className="rounded-[2px] border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting || Boolean(successMessage)}
                  className="w-full rounded-[2px] bg-primary px-5 py-3.5 font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? "Đang cập nhật mật khẩu..." : "Lưu mật khẩu mới"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
