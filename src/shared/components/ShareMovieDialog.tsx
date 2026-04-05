import { useMemo, useState } from "react";
import { Copy, ExternalLink, Link2, Send, Share2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { toast } from "@/shared/components/ui/sonner";

interface ShareMoviePayload {
  name: string;
  originName?: string | null;
  slug?: string;
  shareUrl?: string;
  posterUrl?: string | null;
  thumbUrl?: string | null;
}

interface ShareMovieDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movie: ShareMoviePayload | null;
}

const ShareMovieDialog = ({
  open,
  onOpenChange,
  movie,
}: ShareMovieDialogProps) => {
  const [isCopying, setIsCopying] = useState(false);

  const shareUrl = useMemo(() => {
    if (!movie) {
      return "";
    }

    if (movie.shareUrl) {
      return movie.shareUrl;
    }

    if (!movie.slug || typeof window === "undefined") {
      return "";
    }

    return new URL(`/movie/${movie.slug}`, window.location.origin).toString();
  }, [movie]);

  const previewImage = movie?.thumbUrl || movie?.posterUrl || "";
  const shareText = movie?.originName
    ? `${movie.name} (${movie.originName})`
    : (movie?.name ?? "");
  const encodedShareUrl = encodeURIComponent(shareUrl);
  const encodedShareText = encodeURIComponent(shareText);

  const handleCopy = async () => {
    if (!shareUrl) {
      return;
    }

    try {
      setIsCopying(true);
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Đã sao chép liên kết phim.");
        return;
      }

      window.prompt("Sao chép liên kết này", shareUrl);
    } catch {
      toast.error("Không thể sao chép liên kết.");
    } finally {
      setIsCopying(false);
    }
  };

  const handleNativeShare = async () => {
    if (!movie || !shareUrl || !navigator.share) {
      return;
    }

    try {
      await navigator.share({
        title: movie.name,
        text: shareText,
        url: shareUrl,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      toast.error("Không thể mở chia sẻ hệ thống lúc này.");
    }
  };

  const openShareTarget = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl border-white/10 bg-[radial-gradient(circle_at_top_right,_rgba(229,9,20,0.16),_transparent_45%),linear-gradient(180deg,rgba(12,12,16,0.98),rgba(8,8,12,0.98))] p-0 text-white shadow-[0_28px_80px_rgba(0,0,0,0.5)]">
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-white">
              Chia sẻ phim
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Gửi nhanh phim này tới bạn bè bằng liên kết trực tiếp.
            </DialogDescription>
          </DialogHeader>

          {movie ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-start gap-3">
                <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-white/5">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt={movie.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-[0.2em] text-white/40">
                      No
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-semibold text-white">
                    {movie.name}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs text-white/65">
                    {movie.originName || "Mở để xem chi tiết phim"}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-xs text-white/70">
                <p className="mb-1 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.16em] text-white/50">
                  <Link2 className="h-3.5 w-3.5" /> Liên kết
                </p>
                <p className="line-clamp-2 break-all">
                  {shareUrl || "Không có liên kết để chia sẻ"}
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!shareUrl || isCopying}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition-colors hover:border-primary/40 hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Copy className="h-4 w-4" />
              {isCopying ? "Đang sao chép..." : "Sao chép liên kết"}
            </button>
            <button
              type="button"
              onClick={handleNativeShare}
              disabled={!shareUrl || !navigator.share}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition-colors hover:border-primary/40 hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Share2 className="h-4 w-4" />
              Chia sẻ nhanh
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() =>
                openShareTarget(
                  `https://www.facebook.com/sharer/sharer.php?u=${encodedShareUrl}`,
                )
              }
              disabled={!shareUrl}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:border-blue-400/40 hover:bg-blue-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Facebook
            </button>
            <button
              type="button"
              onClick={() =>
                openShareTarget(
                  `https://t.me/share/url?url=${encodedShareUrl}&text=${encodedShareText}`,
                )
              }
              disabled={!shareUrl}
              className="inline-flex items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:border-sky-400/40 hover:bg-sky-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-3.5 w-3.5" /> Telegram
            </button>
            <button
              type="button"
              onClick={() => openShareTarget(shareUrl)}
              disabled={!shareUrl}
              className="inline-flex items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:border-primary/40 hover:bg-primary/12 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Mở liên kết
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareMovieDialog;
