import { FormEvent, useState } from "react";
import { Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/shared/lib/api";
import PageNavigation from "@/shared/components/PageNavigation";

const GMAIL_INBOX_URL = "https://mail.google.com/mail/u/0/#inbox";

const ForgotPasswordPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [requestedEmail, setRequestedEmail] = useState<string | null>(null);
  const [debugResetUrl, setDebugResetUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canOpenGmail = requestedEmail?.trim().toLowerCase().endsWith("@gmail.com") ?? false;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();

    setError(null);
    setSuccessMessage(null);
    setDebugResetUrl(null);
    setLoading(true);

    try {
      const response = await api.forgotPassword({ email });
      setRequestedEmail(email);
      setSuccessMessage(response.message);
      setDebugResetUrl(response.debugVerificationUrl ?? null);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
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
            { label: "Quên mật khẩu" },
          ]}
        />

        <div className="mx-auto max-w-3xl rounded-[28px] border border-white/10 bg-black/30 p-6 backdrop-blur-xl lg:p-8">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-primary/80">Khôi phục tài khoản</p>
            <h1 className="text-3xl font-black text-white">Quên mật khẩu?</h1>
            <p className="text-sm leading-6 text-white/60">
              Nhập email đã đăng ký. Hệ thống sẽ gửi cho bạn một liên kết đặt lại mật khẩu.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">Email đăng ký</label>
              <div className="flex items-center gap-3 rounded-[2px] border border-white/10 bg-white/[0.04] px-4 py-3">
                <Mail className="h-4 w-4 text-white/45" />
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full bg-transparent text-white outline-none placeholder:text-white/32"
                  required
                />
              </div>
            </div>

            {successMessage ? (
              <div className="rounded-[2px] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                <p>{successMessage}</p>
                {requestedEmail ? (
                  <p className="mt-2">
                    Hãy kiểm tra hộp thư của <span className="font-semibold">{requestedEmail}</span>.
                  </p>
                ) : null}
                {canOpenGmail ? (
                  <a
                    href={GMAIL_INBOX_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 rounded-[2px] border border-emerald-400/30 bg-emerald-500/15 px-4 py-2 font-semibold text-white transition hover:border-emerald-300/60 hover:bg-emerald-500/20"
                  >
                    <Mail className="h-4 w-4" />
                    Mở Gmail
                  </a>
                ) : null}
                {debugResetUrl ? (
                  <p className="mt-3">
                    <Link
                      to={debugResetUrl.replace(window.location.origin, "")}
                      className="font-semibold text-white underline"
                    >
                      Mở liên kết đặt lại mật khẩu nội bộ
                    </Link>
                  </p>
                ) : null}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-[2px] border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[2px] bg-primary px-5 py-3.5 font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Đang gửi liên kết..." : "Gửi liên kết đặt lại mật khẩu"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
