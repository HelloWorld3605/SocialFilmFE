import { FormEvent, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/shared/auth/AuthContext";
import { api } from "@/shared/lib/api";
import PageNavigation from "@/shared/components/PageNavigation";

const getTrimmedText = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const GMAIL_INBOX_URL = "https://mail.google.com/mail/u/0/#inbox";

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get("mode") === "register" ? "register" : "login";
  const { login, startRegistration, isAuthenticated, isReady } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [debugVerificationUrl, setDebugVerificationUrl] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const authImagesQuery = useQuery({
    queryKey: ["auth-page-images"],
    queryFn: () => api.authPageImages(),
    retry: false,
  });

  const authImages = authImagesQuery.data?.items ?? [];

  useEffect(() => {
    setActiveImageIndex(0);
  }, [authImages.length]);

  useEffect(() => {
    if (authImages.length <= 1) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveImageIndex((current) => (current + 1) % authImages.length);
    }, 6000);

    return () => window.clearInterval(intervalId);
  }, [authImages.length]);

  useEffect(() => {
    authImages.forEach((image) => {
      const preloadedImage = new window.Image();
      preloadedImage.src = image.imageUrl;
    });
  }, [authImages]);

  const activeImage =
    authImages.length > 0
      ? authImages[activeImageIndex % authImages.length]
      : null;
  const activeImageTitle = getTrimmedText(activeImage?.title);
  const activeImageDescription = getTrimmedText(activeImage?.description);
  const canOpenGmail =
    registeredEmail?.trim().toLowerCase().endsWith("@gmail.com") ?? false;

  const heroCopy = useMemo(
    () =>
      mode === "register"
        ? {
            eyebrow: "Tạo tài khoản mới",
            title:
              "Theo dõi phim đang hot, lưu wishlist và bắt đầu hồ sơ xem riêng của bạn.",
            description:
              "Chỉ cần nhập email, xác thực liên kết trong thư và hoàn tất hồ sơ để mở trải nghiệm cá nhân hóa trên FilmBE.",
            formTitle: "Bắt đầu đăng ký",
            formDescription:
              "Sau khi xác thực email, bạn sẽ đặt tên hiển thị và mật khẩu ở bước hoàn tất.",
            submitLabel: "Gửi email xác thực",
          }
        : {
            eyebrow: "Quay lại tài khoản",
            title:
              "Đăng nhập để tiếp tục dở dang và giữ toàn bộ lịch sử xem của bạn luôn đồng bộ.",
            description:
              "Tài khoản giúp bạn quay lại đúng phim, đúng tập và đúng nhịp xem trên mọi phiên sử dụng.",
            formTitle: "Đăng nhập",
            formDescription:
              "Dùng email và mật khẩu đã đăng ký để truy cập wishlist, lịch sử xem và hồ sơ cá nhân.",
            submitLabel: "Đăng nhập",
          },
    [mode],
  );

  if (isReady && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const setMode = (nextMode: "login" | "register") => {
    setError(null);
    setSuccessMessage(null);
    setRegisteredEmail(null);
    setDebugVerificationUrl(null);
    setSearchParams({ mode: nextMode });
  };

  const canCycleImages = authImages.length > 1;

  const showPreviousImage = () => {
    if (!canCycleImages) return;
    setActiveImageIndex(
      (current) => (current - 1 + authImages.length) % authImages.length,
    );
  };

  const showNextImage = () => {
    if (!canCycleImages) return;
    setActiveImageIndex((current) => (current + 1) % authImages.length);
  };

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

        <div className="grid w-full gap-8 rounded-[2px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
          <section className="relative min-h-[540px] overflow-hidden rounded-[2px] border border-white/10 bg-[radial-gradient(circle_at_top,#1b2032_0%,#0a1020_42%,#040509_100%)]">
            {activeImage ? (
              <img
                key={`${activeImage.id}-${activeImage.imageUrl}`}
                src={activeImage.imageUrl}
                alt={activeImage.title || "Auth visual"}
                className="absolute inset-0 h-full w-full object-cover"
                style={{
                  objectPosition: `${activeImage.focalPointX}% ${activeImage.focalPointY}%`,
                }}
              />
            ) : null}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,6,12,0.16)_0%,rgba(4,6,12,0.62)_56%,rgba(4,6,12,0.95)_100%)]" />
            {canCycleImages ? (
              <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-10 flex items-center justify-between px-3 sm:px-4">
                <button
                  type="button"
                  onClick={showPreviousImage}
                  className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/32 text-white/82 shadow-[0_12px_30px_rgba(0,0,0,0.3)] backdrop-blur-md transition hover:border-white/28 hover:bg-black/46 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/55"
                  aria-label="Hiển thị ảnh trước"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={showNextImage}
                  className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/32 text-white/82 shadow-[0_12px_30px_rgba(0,0,0,0.3)] backdrop-blur-md transition hover:border-white/28 hover:bg-black/46 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/55"
                  aria-label="Hiển thị ảnh tiếp theo"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : null}
            <div className="relative flex h-full flex-col p-6 lg:p-8">
              <div className="flex justify-end">
                {authImages.length > 0 ? (
                  <div className="rounded-[2px] border border-white/15 bg-black/25 px-3 py-2 text-xs text-white/65">
                    {activeImageIndex + 1}/{authImages.length}
                  </div>
                ) : null}
              </div>

              <div className="mt-auto space-y-4">
                {activeImage ? (
                  activeImageTitle || activeImageDescription ? (
                    <div className="min-h-[92px] space-y-2 pt-6">
                      {activeImageTitle ? (
                        <h1 className="max-w-2xl text-2xl font-black leading-tight text-white lg:text-[2.2rem]">
                          {activeImageTitle}
                        </h1>
                      ) : null}
                      {activeImageDescription ? (
                        <p className="max-w-xl text-[13px] leading-5 text-white/72 lg:text-[14px]">
                          {activeImageDescription}
                        </p>
                      ) : null}
                    </div>
                  ) : null
                ) : (
                  <div className="min-h-[92px] space-y-2 pt-6">
                    <h1 className="max-w-2xl text-2xl font-black leading-tight text-white lg:text-[2.2rem]">
                      {heroCopy.title}
                    </h1>
                    <p className="max-w-xl text-[13px] leading-5 text-white/72 lg:text-[14px]">
                      {heroCopy.description}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {["Wishlist", "Lịch sử xem", "Hồ sơ cá nhân"].map((item) => (
                    <span
                      key={item}
                      className="rounded-[2px] border border-white/12 bg-black/25 px-3 py-2 text-xs uppercase tracking-[0.18em] text-white/72 backdrop-blur-md"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2px] border border-white/10 bg-black/30 p-6 lg:p-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.28em] text-primary/80">
                  Tài khoản SocialFilm
                </p>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white">
                    {heroCopy.formTitle}
                  </h2>
                  <p className="text-sm leading-6 text-white/60">
                    {heroCopy.formDescription}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-[2px] border border-white/10 bg-white/[0.03] p-1">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`rounded-[2px] px-4 py-3 text-sm font-semibold transition-colors ${
                    mode === "login"
                      ? "bg-primary text-white"
                      : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={`rounded-[2px] px-4 py-3 text-sm font-semibold transition-colors ${
                    mode === "register"
                      ? "bg-primary text-white"
                      : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  Đăng ký
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === "register" ? (
                  <div className="rounded-[2px] border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-white/65">
                    Đăng ký theo cơ chế xác thực email. Nhập email, mở liên kết
                    trong thư rồi hoàn tất hồ sơ và mật khẩu.
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/72">
                    Email
                  </label>
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

                {mode === "login" ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/72">
                      Mật khẩu
                    </label>
                    <div className="flex items-center gap-3 rounded-[2px] border border-white/10 bg-white/[0.04] px-4 py-3">
                      <LockKeyhole className="h-4 w-4 text-white/45" />
                      <input
                        name="password"
                        type="password"
                        placeholder="Nhập mật khẩu"
                        className="w-full bg-transparent text-white outline-none placeholder:text-white/32"
                        required
                      />
                    </div>
                    <div className="flex justify-end">
                      <Link
                        to="/forgot-password"
                        className="text-sm font-medium text-primary transition hover:text-primary/80"
                      >
                        Quên mật khẩu?
                      </Link>
                    </div>
                  </div>
                ) : null}

                {successMessage ? (
                  <div className="rounded-[2px] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                    <p>{successMessage}</p>
                    {registeredEmail ? (
                      <p className="mt-2">
                        Hãy kiểm tra hộp thư của{" "}
                        <span className="font-semibold">{registeredEmail}</span>
                        .
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
                    {debugVerificationUrl ? (
                      <p className="mt-3">
                        <Link
                          to={debugVerificationUrl.replace(
                            window.location.origin,
                            "",
                          )}
                          className="font-semibold text-white underline"
                        >
                          Mở liên kết xác thực nội bộ
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
                  className="flex w-full items-center justify-center gap-2 rounded-[2px] bg-primary px-5 py-3.5 font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span>
                    {loading ? "Đang xử lý..." : heroCopy.submitLabel}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
