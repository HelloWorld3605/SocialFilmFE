import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "@/shared/lib/api";
import PageNavigation from "@/shared/components/PageNavigation";

const ValidateRegistrationTokenPage = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const validate = async () => {
      if (!token) {
        setError("Không tìm thấy token xác thực.");
        return;
      }

      try {
        const response = await api.validateRegistrationToken(token);
        if (!isMounted) {
          return;
        }
        navigate(
          `/complete-registration?token=${encodeURIComponent(token)}&email=${encodeURIComponent(response.email)}&verified=true`,
          { replace: true },
        );
      } catch (validationError) {
        if (isMounted) {
          setError((validationError as Error).message);
        }
      }
    };

    validate();
    return () => {
      isMounted = false;
    };
  }, [navigate, token]);

  return (
    <div className="layout-padding mx-auto max-w-3xl py-12">
      <PageNavigation
        backTo="/auth?mode=register"
        backLabel="Đăng ký"
        items={[
          { label: "Trang chủ", to: "/" },
          { label: "Đăng ký", to: "/auth?mode=register" },
          { label: "Xác thực email" },
        ]}
      />

      <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 text-white">
        {!error ? (
          <>
            <p className="text-sm uppercase tracking-[0.3em] text-primary">Xác thực</p>
            <h1 className="mt-2 text-3xl font-black">Đang xác thực email...</h1>
            <p className="mt-4 text-muted-foreground">
              Hệ thống đang kiểm tra token đăng ký và sẽ chuyển bạn sang bước hoàn tất.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm uppercase tracking-[0.3em] text-red-400">Xác thực</p>
            <h1 className="mt-2 text-3xl font-black">Token không hợp lệ</h1>
            <p className="mt-4 text-muted-foreground">{error}</p>
            <Link
              to="/auth?mode=register"
              className="mt-6 inline-flex rounded-2xl bg-primary px-5 py-3 font-semibold text-white"
            >
              Đăng ký lại
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default ValidateRegistrationTokenPage;
