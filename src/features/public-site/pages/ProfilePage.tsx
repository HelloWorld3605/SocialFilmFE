import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/shared/auth/AuthContext";
import { api } from "@/shared/lib/api";
import PageNavigation from "@/shared/components/PageNavigation";

const ProfilePage = () => {
  const { token, user, isAuthenticated, isReady, refreshMe } = useAuth();
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }
    setFullName(user.fullName);
    setBio(user.bio || "");
    setAvatarUrl(user.avatarUrl || "");
  }, [user]);

  if (!isReady) {
    return (
      <div className="content-shell layout-padding py-10 text-muted-foreground">
        Đang khôi phục phiên đăng nhập...
      </div>
    );
  }

  if (!isAuthenticated || !user || !token) {
    return <Navigate to="/auth" replace />;
  }

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await api.uploadFile(token, file);
      setAvatarUrl(response.url);
      setMessage("Ảnh đại diện đã được tải lên. Nhấn lưu để cập nhật hồ sơ.");
    } catch (uploadError) {
      setError((uploadError as Error).message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await api.updateProfile(token, {
        fullName,
        avatarUrl,
        bio,
      });
      await refreshMe();
      setMessage("Đã cập nhật hồ sơ.");
    } catch (profileError) {
      setError((profileError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="layout-padding mx-auto max-w-4xl py-10">
      <PageNavigation
        backTo="/"
        backLabel="Trang chủ"
        items={[
          { label: "Trang chủ", to: "/" },
          { label: "Hồ sơ người dùng" },
        ]}
      />

      <div className="rounded-[32px] border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-primary">Hồ sơ</p>
        <h1 className="mt-2 text-3xl font-black text-white">Hồ sơ người dùng</h1>
        <div className="mt-6 flex items-center gap-5 rounded-[28px] border border-white/10 bg-black/20 p-5">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white/10">
            {avatarUrl ? (
              <img src={avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl font-black text-white">
                {user.fullName.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Tải ảnh qua Cloudinary giống `social-map`, sau đó lưu hồ sơ để cập nhật.
            </p>
            <label className="inline-flex cursor-pointer rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white">
              {uploading ? "Đang tải lên..." : "Chọn ảnh đại diện"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploading}
              />
            </label>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <input
            name="fullName"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white"
          />
          <textarea
            name="bio"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="Giới thiệu ngắn"
            rows={5}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white"
          />
          <p className="text-sm text-muted-foreground">
            Email đã xác thực: {user.emailVerified ? "Có" : "Chưa"}
          </p>
          {message ? <p className="text-sm text-green-400">{message}</p> : null}
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            disabled={saving || uploading}
            className="rounded-2xl bg-primary px-5 py-3 font-semibold text-white"
          >
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
