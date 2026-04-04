import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="layout-padding mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-primary">404</p>
      <h1 className="mt-3 text-5xl font-black text-white">Không tìm thấy trang</h1>
      <p className="mt-4 text-muted-foreground">
        Liên kết này không tồn tại hoặc đã bị thay đổi.
      </p>
      <Link
        to="/"
        className="mt-8 rounded-full bg-primary px-6 py-3 font-semibold text-white"
      >
        Về trang chủ
      </Link>
    </div>
  );
};

export default NotFound;
