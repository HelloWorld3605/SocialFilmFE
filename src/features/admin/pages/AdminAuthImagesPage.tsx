import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, ImagePlus, Pencil, Trash2, Upload } from "lucide-react";
import { useAuth } from "@/shared/auth/AuthContext";
import { api } from "@/shared/lib/api";
import type { AuthPageImage } from "@/shared/types/api";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  getCropFrameOffsetPercentage,
  getObjectPositionPercentage,
} from "@/features/admin/lib/authImageCrop";
import {
  AUTH_IMAGE_PREVIEW_ASPECT_RATIO,
  AUTH_IMAGE_PREVIEW_HEIGHT,
  AUTH_IMAGE_PREVIEW_WIDTH,
} from "@/shared/lib/authImageLayout";

const panelClass = "rounded-[28px] border border-white/10 bg-black/25 p-5";
const authPreviewFrameClass =
  "relative overflow-hidden rounded-[2px] border border-white/10 bg-[radial-gradient(circle_at_top,#1b2032_0%,#0a1020_42%,#040509_100%)]";
const authPreviewOverlayClass =
  "pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(4,6,12,0.16)_0%,rgba(4,6,12,0.62)_56%,rgba(4,6,12,0.95)_100%)]";
const MAX_DISPLAY_ORDER = 9999;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const formatDateTime = (value?: string | null) => {
  if (!value) return "Không có dữ liệu";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Không có dữ liệu"
    : new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(parsed);
};

const getTrimmedText = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const parseDisplayOrderInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (!/^\d+$/.test(trimmed)) {
    throw new Error(`Thứ tự xuất hiện phải là số nguyên từ 1 đến ${MAX_DISPLAY_ORDER}.`);
  }

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_DISPLAY_ORDER) {
    throw new Error(`Thứ tự xuất hiện phải là số nguyên từ 1 đến ${MAX_DISPLAY_ORDER}.`);
  }

  return parsed;
};

const AuthImagePreview = ({
  imageUrl,
  title,
  description,
  focalPointX,
  focalPointY,
}: {
  imageUrl?: string | null;
  title?: string | null;
  description?: string | null;
  focalPointX?: number | null;
  focalPointY?: number | null;
}) => {
  const trimmedTitle = getTrimmedText(title);
  const trimmedDescription = getTrimmedText(description);

  return (
    <div
      className={authPreviewFrameClass}
      style={{
        aspectRatio: `${AUTH_IMAGE_PREVIEW_WIDTH} / ${AUTH_IMAGE_PREVIEW_HEIGHT}`,
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={trimmedTitle || "Auth image"}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: `${focalPointX ?? 50}% ${focalPointY ?? 50}%` }}
        />
      ) : null}
      <div className={authPreviewOverlayClass} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 space-y-3 p-6">
        {trimmedTitle || trimmedDescription ? (
          <div className="space-y-2">
            {trimmedTitle ? (
              <h3 className="text-2xl font-black tracking-tight text-white">{trimmedTitle}</h3>
            ) : null}
            {trimmedDescription ? (
              <p className="max-w-md text-sm leading-6 text-white/70">{trimmedDescription}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const AuthImageEmptyPreview = () => (
  <div
    className={authPreviewFrameClass}
    style={{
      aspectRatio: `${AUTH_IMAGE_PREVIEW_WIDTH} / ${AUTH_IMAGE_PREVIEW_HEIGHT}`,
    }}
  >
    <div className={authPreviewOverlayClass} />
    <div className="relative flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/[0.04]">
        <ImagePlus className="h-7 w-7 text-white/70" />
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-black tracking-tight text-white">Chưa có ảnh preview</h3>
        <p className="mx-auto max-w-sm text-sm leading-6 text-white/62">
          Tải ảnh lên hoặc dán URL ở phần thêm mới để xem trước đúng khung hiển thị của
          trang đăng nhập và đăng ký.
        </p>
      </div>
    </div>
  </div>
);

const AuthImageCropDialog = ({
  open,
  onOpenChange,
  imageUrl,
  title,
  focalPointX,
  focalPointY,
  onFocalPointChange,
  actionLabel,
  onAction,
  actionDisabled = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl?: string | null;
  title?: string | null;
  focalPointX: number;
  focalPointY: number;
  onFocalPointChange: (nextX: number, nextY: number) => void;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
}) => {
  const cropCanvasRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [naturalImageSize, setNaturalImageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [isDraggingCropFrame, setIsDraggingCropFrame] = useState(false);

  useEffect(() => {
    if (!open) {
      dragStateRef.current = null;
      setIsDraggingCropFrame(false);
      return;
    }

    setNaturalImageSize(null);
  }, [imageUrl, open]);

  const cropFrameSize = useMemo(() => {
    if (!naturalImageSize?.width || !naturalImageSize?.height) return null;

    const imageAspectRatio = naturalImageSize.width / naturalImageSize.height;

    if (imageAspectRatio > AUTH_IMAGE_PREVIEW_ASPECT_RATIO) {
      return {
        width: (AUTH_IMAGE_PREVIEW_ASPECT_RATIO / imageAspectRatio) * 100,
        height: 100,
      };
    }

    if (imageAspectRatio < AUTH_IMAGE_PREVIEW_ASPECT_RATIO) {
      return {
        width: 100,
        height: (imageAspectRatio / AUTH_IMAGE_PREVIEW_ASPECT_RATIO) * 100,
      };
    }

    return { width: 100, height: 100 };
  }, [naturalImageSize]);

  const cropFramePosition = useMemo(() => {
    const width = cropFrameSize?.width ?? 100;
    const height = cropFrameSize?.height ?? 100;

    return {
      left: getCropFrameOffsetPercentage(focalPointX, width),
      top: getCropFrameOffsetPercentage(focalPointY, height),
      width,
      height,
    };
  }, [cropFrameSize, focalPointX, focalPointY]);

  const movementHint = useMemo(() => {
    if (!cropFrameSize) {
      return "Đang tính khung hiển thị theo tỷ lệ ảnh.";
    }

    if (cropFrameSize.width >= 99.9 && cropFrameSize.height >= 99.9) {
      return "Ảnh đã khớp tỷ lệ preview, không cần kéo khung thêm.";
    }

    if (cropFrameSize.width >= 99.9) {
      return "Khung sẽ di chuyển theo chiều dọc vì ảnh cao hơn tỷ lệ preview.";
    }

    if (cropFrameSize.height >= 99.9) {
      return "Khung sẽ di chuyển theo chiều ngang vì ảnh rộng hơn tỷ lệ preview.";
    }

    return "Kéo khung sáng để chọn phần ảnh sẽ xuất hiện trong preview auth.";
  }, [cropFrameSize]);

  const updateFocalPointFromFrame = (clientX: number, clientY: number) => {
    const cropCanvas = cropCanvasRef.current;
    const dragState = dragStateRef.current;

    if (!cropCanvas || !dragState || !cropFrameSize) return;

    const rect = cropCanvas.getBoundingClientRect();
    const frameWidth = (cropFrameSize.width / 100) * rect.width;
    const frameHeight = (cropFrameSize.height / 100) * rect.height;
    const nextLeft = clamp(clientX - rect.left - dragState.offsetX, 0, rect.width - frameWidth);
    const nextTop = clamp(clientY - rect.top - dragState.offsetY, 0, rect.height - frameHeight);
    const nextLeftPercentage = rect.width === 0 ? 0 : (nextLeft / rect.width) * 100;
    const nextTopPercentage = rect.height === 0 ? 0 : (nextTop / rect.height) * 100;
    const nextCenterX = getObjectPositionPercentage(
      nextLeftPercentage,
      cropFrameSize.width,
    );
    const nextCenterY = getObjectPositionPercentage(
      nextTopPercentage,
      cropFrameSize.height,
    );

    onFocalPointChange(Math.round(nextCenterX), Math.round(nextCenterY));
  };

  const handleCropPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!cropFrameSize) return;

    event.preventDefault();

    const frameRect = event.currentTarget.getBoundingClientRect();
    dragStateRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - frameRect.left,
      offsetY: event.clientY - frameRect.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDraggingCropFrame(true);
  };

  const handleCropPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current?.pointerId !== event.pointerId) return;
    updateFocalPointFromFrame(event.clientX, event.clientY);
  };

  const handleCropPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragStateRef.current = null;
    setIsDraggingCropFrame(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl border-white/10 bg-[radial-gradient(circle_at_top_right,_rgba(229,9,20,0.14),_transparent_42%),linear-gradient(180deg,rgba(12,12,16,0.98),rgba(8,8,12,0.98))] p-0 text-white shadow-[0_28px_80px_rgba(0,0,0,0.5)]">
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-white">
              Canh khung hiển thị ảnh auth
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Kéo khung sáng trong popup để chọn vùng sẽ xuất hiện ở nửa trái của trang
              đăng nhập và đăng ký.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-[28px] border border-white/10 bg-black/25 p-4">
              <div className="flex min-h-[360px] items-center justify-center rounded-[24px] border border-white/10 bg-[#05070d] p-4">
                {imageUrl ? (
                  <div
                    ref={cropCanvasRef}
                    className="relative inline-block max-h-[70vh] max-w-full overflow-hidden rounded-[24px]"
                  >
                    <img
                      src={imageUrl}
                      alt={title || "Auth image"}
                      className="block max-h-[70vh] max-w-full rounded-[24px] object-contain"
                      onLoad={(event) =>
                        setNaturalImageSize({
                          width: event.currentTarget.naturalWidth,
                          height: event.currentTarget.naturalHeight,
                        })
                      }
                    />

                    {cropFrameSize ? (
                      <div
                        className={`absolute border-2 border-white/90 bg-transparent shadow-[0_0_0_9999px_rgba(4,6,12,0.62)] touch-none ${
                          isDraggingCropFrame ? "cursor-grabbing" : "cursor-grab"
                        }`}
                        style={{
                          left: `${cropFramePosition.left}%`,
                          top: `${cropFramePosition.top}%`,
                          width: `${cropFramePosition.width}%`,
                          height: `${cropFramePosition.height}%`,
                        }}
                        onPointerDown={handleCropPointerDown}
                        onPointerMove={handleCropPointerMove}
                        onPointerUp={handleCropPointerUp}
                        onPointerCancel={handleCropPointerUp}
                      >
                        <div className="pointer-events-none absolute inset-0 border border-white/20" />
                        <div className="pointer-events-none absolute left-3 top-3 h-5 w-5 border-l-2 border-t-2 border-white" />
                        <div className="pointer-events-none absolute right-3 top-3 h-5 w-5 border-r-2 border-t-2 border-white" />
                        <div className="pointer-events-none absolute bottom-3 left-3 h-5 w-5 border-b-2 border-l-2 border-white" />
                        <div className="pointer-events-none absolute bottom-3 right-3 h-5 w-5 border-b-2 border-r-2 border-white" />
                        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85">
                          Kéo khung
                        </div>
                      </div>
                    ) : (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35 text-sm text-white/65">
                        Đang tải ảnh để dựng khung preview...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-white/55">
                    Chọn ảnh tải lên hoặc nhập URL trước khi canh khung.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 rounded-[28px] border border-white/10 bg-black/25 p-5">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Cách dùng</p>
                <p className="text-sm leading-6 text-white/75">{movementHint}</p>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Vị trí canh ảnh lưu lại</p>
                <div className="mt-3 space-y-2 text-sm text-white/80">
                  <p>Ngang: {focalPointX}%</p>
                  <p>Dọc: {focalPointY}%</p>
                </div>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-white/70">
                Khung popup dùng cùng tỷ lệ với preview auth hiện tại và sẽ cập nhật trực tiếp
                preview ở màn hình admin khi bạn kéo.
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onFocalPointChange(50, 50)}
                  className="bg-white/[0.08] text-white hover:bg-white/[0.14]"
                >
                  Đưa về giữa ảnh
                </Button>
                {actionLabel && onAction ? (
                  <Button type="button" disabled={actionDisabled} onClick={onAction}>
                    {actionLabel}
                  </Button>
                ) : null}
                <Button type="button" onClick={() => onOpenChange(false)}>
                  Xong
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AuthImageCard = ({
  image,
  onEdit,
  onDelete,
  editing,
  deleting,
}: {
  image: AuthPageImage;
  onEdit: (image: AuthPageImage) => void;
  onDelete: (image: AuthPageImage) => void;
  editing: boolean;
  deleting: boolean;
}) => (
  <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04]">
    <div className="aspect-[4/3] bg-black/20">
      <img
        src={image.imageUrl}
        alt={image.title || "Auth image"}
        className="h-full w-full object-cover"
        style={{ objectPosition: `${image.focalPointX}% ${image.focalPointY}%` }}
      />
    </div>
    <div className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          {getTrimmedText(image.title) ? (
            <p className="line-clamp-1 text-sm font-semibold text-white">{getTrimmedText(image.title)}</p>
          ) : null}
          {getTrimmedText(image.description) ? (
            <p className="line-clamp-2 min-h-10 text-xs leading-5 text-white/55">
              {getTrimmedText(image.description)}
            </p>
          ) : null}
          <p className="text-[11px] text-white/40">
            Vị trí ảnh: ngang {image.focalPointX}% • dọc {image.focalPointY}%
          </p>
        </div>
        <div className="shrink-0 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/78">
          #{image.displayOrder}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-white/40">{formatDateTime(image.createdAt)}</p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onEdit(image)}
            className="bg-white/[0.08] text-white hover:bg-white/[0.14]"
          >
            <Pencil className="h-4 w-4" />
            {editing ? "Đang sửa" : "Sửa"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={deleting}
            onClick={() => onDelete(image)}
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "Đang xóa..." : "Xóa"}
          </Button>
        </div>
      </div>
    </div>
  </div>
);

const AdminAuthImagesPage = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [directImageUrl, setDirectImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrderInput, setDisplayOrderInput] = useState("");
  const [focalPointX, setFocalPointX] = useState(50);
  const [focalPointY, setFocalPointY] = useState(50);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [editingImageId, setEditingImageId] = useState<number | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);
  const [editFilePreviewUrl, setEditFilePreviewUrl] = useState<string | null>(null);
  const [editDirectImageUrl, setEditDirectImageUrl] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDisplayOrderInput, setEditDisplayOrderInput] = useState("");
  const [editFocalPointX, setEditFocalPointX] = useState(50);
  const [editFocalPointY, setEditFocalPointY] = useState(50);
  const [isEditCropDialogOpen, setIsEditCropDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const imagesQuery = useQuery({
    queryKey: ["admin-auth-images", token],
    queryFn: () => api.adminAuthPageImages(token as string),
    enabled: Boolean(token),
  });

  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  useEffect(() => {
    return () => {
      if (editFilePreviewUrl) {
        URL.revokeObjectURL(editFilePreviewUrl);
      }
    };
  }, [editFilePreviewUrl]);

  const addPreviewImageUrl = useMemo(() => {
    if (filePreviewUrl) return filePreviewUrl;
    if (directImageUrl.trim()) return directImageUrl.trim();
    return null;
  }, [directImageUrl, filePreviewUrl]);

  const canOpenCropDialog = Boolean(addPreviewImageUrl);

  const currentEditingImage = useMemo(
    () => imagesQuery.data?.items.find((item) => item.id === editingImageId) ?? null,
    [editingImageId, imagesQuery.data?.items],
  );

  const editPreviewImageUrl = useMemo(() => {
    if (editFilePreviewUrl) return editFilePreviewUrl;
    if (editDirectImageUrl.trim()) return editDirectImageUrl.trim();
    return currentEditingImage?.imageUrl ?? null;
  }, [currentEditingImage?.imageUrl, editDirectImageUrl, editFilePreviewUrl]);

  const nextDisplayOrder = useMemo(() => {
    const items = imagesQuery.data?.items ?? [];
    return items.reduce((maxOrder, image) => Math.max(maxOrder, image.displayOrder), 0) + 1;
  }, [imagesQuery.data?.items]);

  const canOpenEditCropDialog = Boolean(isEditDialogOpen && editPreviewImageUrl);

  const revokePreviewUrl = (url?: string | null) => {
    if (url) {
      URL.revokeObjectURL(url);
    }
  };

  const resetDraftForm = () => {
    revokePreviewUrl(filePreviewUrl);

    setSelectedFile(null);
    setFilePreviewUrl(null);
    setDirectImageUrl("");
    setTitle("");
    setDescription("");
    setDisplayOrderInput("");
    setFocalPointX(50);
    setFocalPointY(50);
    setIsCropDialogOpen(false);
  };

  const resetEditDialog = () => {
    revokePreviewUrl(editFilePreviewUrl);
    setEditSelectedFile(null);
    setEditFilePreviewUrl(null);
    setEditDirectImageUrl("");
    setEditTitle("");
    setEditDescription("");
    setEditDisplayOrderInput("");
    setEditFocalPointX(50);
    setEditFocalPointY(50);
    setIsEditCropDialogOpen(false);
    setIsEditDialogOpen(false);
    setEditingImageId(null);
  };

  const resolveImageUrl = async (currentDirectImageUrl: string, currentSelectedFile: File | null) => {
    if (!token) {
      throw new Error("Phiên đăng nhập admin không hợp lệ.");
    }

    let imageUrl = currentDirectImageUrl.trim();

    if (currentSelectedFile) {
      const uploaded = await api.uploadFile(token, currentSelectedFile);
      imageUrl = uploaded.url;
    }

    if (!imageUrl) {
      throw new Error("Chọn ảnh tải lên hoặc nhập URL ảnh trước khi lưu.");
    }

    return imageUrl;
  };

  const buildAuthImagePayload = ({
    imageUrl,
    title,
    description,
    displayOrderInput,
    focalPointX,
    focalPointY,
  }: {
    imageUrl: string;
    title: string;
    description: string;
    displayOrderInput: string;
    focalPointX: number;
    focalPointY: number;
  }) => ({
    imageUrl,
    title: title.trim() || undefined,
    description: description.trim() || undefined,
    displayOrder: parseDisplayOrderInput(displayOrderInput),
    focalPointX,
    focalPointY,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const imageUrl = await resolveImageUrl(directImageUrl, selectedFile);
      return api.createAdminAuthPageImage(
        token as string,
        buildAuthImagePayload({
          imageUrl,
          title,
          description,
          displayOrderInput,
          focalPointX,
          focalPointY,
        }),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-auth-images"] });
      queryClient.invalidateQueries({ queryKey: ["auth-page-images"] });
      resetDraftForm();
      setFeedback({
        type: "success",
        text: "Đã thêm ảnh mới cho trang đăng nhập / đăng ký.",
      });
    },
    onError: (error) =>
      setFeedback({
        type: "error",
        text: (error as Error).message,
      }),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!token || editingImageId == null) {
        throw new Error("Không tìm thấy ảnh cần cập nhật.");
      }

      const imageUrl = await resolveImageUrl(editDirectImageUrl, editSelectedFile);
      return api.updateAdminAuthPageImage(
        token,
        editingImageId,
        buildAuthImagePayload({
          imageUrl,
          title: editTitle,
          description: editDescription,
          displayOrderInput: editDisplayOrderInput,
          focalPointX: editFocalPointX,
          focalPointY: editFocalPointY,
        }),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-auth-images"] });
      queryClient.invalidateQueries({ queryKey: ["auth-page-images"] });
      resetEditDialog();
      setFeedback({
        type: "success",
        text: "Đã cập nhật ảnh auth page.",
      });
    },
    onError: (error) =>
      setFeedback({
        type: "error",
        text: (error as Error).message,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (imageId: number) => api.deleteAdminAuthPageImage(token as string, imageId),
    onSuccess: (data, imageId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-auth-images"] });
      queryClient.invalidateQueries({ queryKey: ["auth-page-images"] });
      if (editingImageId === imageId) {
        resetEditDialog();
      }
      setFeedback({ type: "success", text: data.message });
    },
    onError: (error) =>
      setFeedback({
        type: "error",
        text: (error as Error).message,
      }),
  });

  useEffect(() => {
    if (!canOpenCropDialog) {
      setIsCropDialogOpen(false);
    }
  }, [canOpenCropDialog]);

  useEffect(() => {
    if (!canOpenEditCropDialog) {
      setIsEditCropDialogOpen(false);
    }
  }, [canOpenEditCropDialog]);

  const handleFileChange = (file?: File | null) => {
    revokePreviewUrl(filePreviewUrl);

    if (!file) {
      setSelectedFile(null);
      setFilePreviewUrl(null);
      return;
    }

    setSelectedFile(file);
    setFilePreviewUrl(URL.createObjectURL(file));
    setDirectImageUrl("");
  };

  const handleEditFileChange = (file?: File | null) => {
    revokePreviewUrl(editFilePreviewUrl);

    if (!file) {
      setEditSelectedFile(null);
      setEditFilePreviewUrl(null);
      return;
    }

    setEditSelectedFile(file);
    setEditFilePreviewUrl(URL.createObjectURL(file));
    setEditDirectImageUrl("");
  };

  const handleDelete = (image: AuthPageImage) => {
    const confirmed = window.confirm(
      `Xóa ảnh này khỏi giao diện đăng nhập / đăng ký?\n\n${image.title?.trim() || image.imageUrl}`,
    );
    if (!confirmed) return;
    setFeedback(null);
    deleteMutation.mutate(image.id);
  };

  const handleEdit = (image: AuthPageImage) => {
    revokePreviewUrl(editFilePreviewUrl);

    setEditSelectedFile(null);
    setEditFilePreviewUrl(null);
    setEditDirectImageUrl(image.imageUrl);
    setEditTitle(image.title ?? "");
    setEditDescription(image.description ?? "");
    setEditDisplayOrderInput(String(image.displayOrder));
    setEditFocalPointX(image.focalPointX);
    setEditFocalPointY(image.focalPointY);
    setEditingImageId(image.id);
    setIsEditDialogOpen(true);
    setIsEditCropDialogOpen(false);
    setFeedback(null);
  };

  const handleEditDialogOpenChange = (open: boolean) => {
    if (!open) {
      resetEditDialog();
      return;
    }

    setIsEditDialogOpen(true);
  };

  const isCreating = createMutation.isPending;
  const isUpdating = updateMutation.isPending;

  return (
    <div className="space-y-6">
      <AuthImageCropDialog
        open={isCropDialogOpen}
        onOpenChange={setIsCropDialogOpen}
        imageUrl={addPreviewImageUrl}
        title={title}
        focalPointX={focalPointX}
        focalPointY={focalPointY}
        onFocalPointChange={(nextX, nextY) => {
          setFocalPointX(nextX);
          setFocalPointY(nextY);
        }}
      />

      <AuthImageCropDialog
        open={isEditCropDialogOpen}
        onOpenChange={setIsEditCropDialogOpen}
        imageUrl={editPreviewImageUrl}
        title={editTitle}
        focalPointX={editFocalPointX}
        focalPointY={editFocalPointY}
        onFocalPointChange={(nextX, nextY) => {
          setEditFocalPointX(nextX);
          setEditFocalPointY(nextY);
        }}
        actionLabel={isUpdating ? "Đang cập nhật..." : "Cập nhật"}
        actionDisabled={isUpdating}
        onAction={() => {
          setFeedback(null);
          updateMutation.mutate();
        }}
      />

      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogOpenChange}>
        <DialogContent className="max-w-6xl border-white/10 bg-[radial-gradient(circle_at_top_right,_rgba(229,9,20,0.14),_transparent_42%),linear-gradient(180deg,rgba(12,12,16,0.98),rgba(8,8,12,0.98))] p-0 text-white shadow-[0_28px_80px_rgba(0,0,0,0.5)]">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-white">Sửa ảnh auth</DialogTitle>
              <DialogDescription className="text-white/70">
                Cập nhật ảnh, nội dung hiển thị và vị trí khung preview ngay trong popup này.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)]">
              <div className="space-y-5">
                <div className={panelClass}>
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-white/70">Tải ảnh lên</label>
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[22px] border border-dashed border-white/15 bg-white/[0.03] px-4 py-6 text-sm text-white/70 transition-colors hover:border-primary/40 hover:bg-primary/10">
                      <Upload className="h-4 w-4" />
                      <span>{editSelectedFile ? editSelectedFile.name : "Chọn file ảnh"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => handleEditFileChange(event.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                  <div className="mt-4 space-y-2">
                    <label className="block text-sm font-medium text-white/70">Hoặc dán URL ảnh</label>
                    <Input
                      value={editDirectImageUrl}
                      onChange={(event) => {
                        setEditDirectImageUrl(event.target.value);
                        if (event.target.value.trim() && editFilePreviewUrl) {
                          revokePreviewUrl(editFilePreviewUrl);
                          setEditFilePreviewUrl(null);
                          setEditSelectedFile(null);
                        }
                      }}
                      placeholder="https://..."
                      className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/35"
                    />
                  </div>
                </div>

                <div className={panelClass}>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/70">Tiêu đề ảnh</label>
                      <Input
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                        placeholder="Ví dụ: Top phim đang nóng tuần này"
                        className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/35"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/70">Mô tả ngắn</label>
                      <Textarea
                        value={editDescription}
                        onChange={(event) => setEditDescription(event.target.value)}
                        placeholder="Dòng mô tả sẽ phủ lên ảnh trong khung trái auth page"
                        className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/35"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/70">
                        Thứ tự xuất hiện trong slider
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={MAX_DISPLAY_ORDER}
                        step={1}
                        inputMode="numeric"
                        value={editDisplayOrderInput}
                        onChange={(event) => setEditDisplayOrderInput(event.target.value)}
                        placeholder="Ví dụ: 1"
                        className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/35"
                      />
                      <p className="mt-2 text-xs leading-5 text-white/45">
                        Số nhỏ hơn sẽ xuất hiện trước trong slider auth. Để trống, hệ thống giữ
                        nguyên thứ tự hiện tại của ảnh này.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={resetEditDialog}
                    className="bg-white/[0.08] text-white hover:bg-white/[0.14]"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => {
                      setFeedback(null);
                      updateMutation.mutate();
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    {isUpdating ? "Đang cập nhật..." : "Cập nhật"}
                  </Button>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <p className="mb-3 text-sm font-medium text-white/70">Preview</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (canOpenEditCropDialog) {
                        setIsEditCropDialogOpen(true);
                      }
                    }}
                    disabled={!canOpenEditCropDialog}
                    className="group relative block w-full rounded-[2px] text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 disabled:cursor-not-allowed"
                  >
                    <AuthImagePreview
                      imageUrl={editPreviewImageUrl}
                      title={editTitle}
                      description={editDescription}
                      focalPointX={editFocalPointX}
                      focalPointY={editFocalPointY}
                    />
                    {canOpenEditCropDialog ? (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[2px] bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/35 group-hover:opacity-100">
                        <span className="rounded-full border border-white/20 bg-black/65 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                          Mở popup canh khung
                        </span>
                      </div>
                    ) : null}
                  </button>
                </div>

                {!canOpenEditCropDialog ? (
                  <div className="rounded-[28px] border border-white/10 bg-black/25 p-5 text-sm leading-6 text-white/65">
                    Chọn ảnh tải lên hoặc dán URL trước, sau đó bạn có thể mở popup để canh
                    khung hiển thị.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="rounded-[32px] border-white/10 bg-white/[0.04] text-white">
        <CardHeader>
          <CardTitle className="text-3xl font-black tracking-tight text-white">
            Ảnh cho login / register
          </CardTitle>
          <CardDescription className="text-white/60">
            Quản lý bộ ảnh hiển thị ở nửa bên trái của trang đăng nhập và đăng ký, có preview ngay trong admin.
          </CardDescription>
        </CardHeader>
      </Card>

      {feedback ? (
        <p className={`text-sm ${feedback.type === "error" ? "text-red-300" : "text-emerald-300"}`}>
          {feedback.text}
        </p>
      ) : null}

      <div className="space-y-6">
        <Card className="rounded-[32px] border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-black text-white">
              <ImagePlus className="h-5 w-5 text-primary" />
              Thêm ảnh mới
            </CardTitle>
            <CardDescription className="text-white/55">
              Tải ảnh lên hoặc dán URL, sau đó canh preview ngay trong cùng khung này.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 xl:grid-cols-[minmax(360px,0.98fr)_minmax(320px,0.9fr)]">
            <div className="space-y-5">
              <div className={panelClass}>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-white/70">Tải ảnh lên</label>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[22px] border border-dashed border-white/15 bg-white/[0.03] px-4 py-6 text-sm text-white/70 transition-colors hover:border-primary/40 hover:bg-primary/10">
                    <Upload className="h-4 w-4" />
                    <span>{selectedFile ? selectedFile.name : "Chọn file ảnh"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
                <div className="mt-4 space-y-2">
                  <label className="block text-sm font-medium text-white/70">Hoặc dán URL ảnh</label>
                  <Input
                    value={directImageUrl}
                    onChange={(event) => {
                      setDirectImageUrl(event.target.value);
                      if (event.target.value.trim() && filePreviewUrl) {
                        URL.revokeObjectURL(filePreviewUrl);
                        setFilePreviewUrl(null);
                        setSelectedFile(null);
                      }
                    }}
                    placeholder="https://..."
                    className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/35"
                  />
                </div>
                <p className="mt-4 text-xs leading-5 text-white/45">
                  Sau khi chọn ảnh, nhấn vào preview trong khung này để mở popup và kéo khung
                  hiển thị.
                </p>
              </div>

              <div className={panelClass}>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">Tiêu đề ảnh</label>
                    <Input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Ví dụ: Top phim đang nóng tuần này"
                      className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/35"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">Mô tả ngắn</label>
                    <Textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Dòng mô tả sẽ phủ lên ảnh trong khung trái auth page"
                      className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/35"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      Thứ tự xuất hiện trong slider
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={MAX_DISPLAY_ORDER}
                      step={1}
                      inputMode="numeric"
                      value={displayOrderInput}
                      onChange={(event) => setDisplayOrderInput(event.target.value)}
                      placeholder={String(nextDisplayOrder)}
                      className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/35"
                    />
                    <p className="mt-2 text-xs leading-5 text-white/45">
                      Số nhỏ hơn sẽ xuất hiện trước. Để trống, ảnh mới sẽ tự thêm vào cuối slider
                      hiện tại.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  disabled={isCreating}
                  onClick={() => {
                    setFeedback(null);
                    createMutation.mutate();
                  }}
                >
                  <ImagePlus className="h-4 w-4" />
                  {isCreating ? "Đang lưu..." : "Thêm ảnh vào auth page"}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/72">
                <Eye className="h-4 w-4 text-primary" />
                <span>Preview</span>
              </div>
              {canOpenCropDialog ? (
                <button
                  type="button"
                  onClick={() => setIsCropDialogOpen(true)}
                  className="group relative block w-full rounded-[2px] text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                >
                  <AuthImagePreview
                    imageUrl={addPreviewImageUrl}
                    title={title}
                    description={description}
                    focalPointX={focalPointX}
                    focalPointY={focalPointY}
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[2px] bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/35 group-hover:opacity-100">
                    <span className="rounded-full border border-white/20 bg-black/65 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                      Mở popup canh khung
                    </span>
                  </div>
                </button>
              ) : (
                <AuthImageEmptyPreview />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle className="text-xl font-black text-white">Bộ ảnh hiện tại</CardTitle>
            <CardDescription className="text-white/55">
              Chọn số thứ tự để quyết định ảnh nào xuất hiện trước trong slider của auth page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {imagesQuery.data?.items.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {imagesQuery.data.items.map((image) => (
                  <AuthImageCard
                    key={image.id}
                    image={image}
                    editing={isEditDialogOpen && editingImageId === image.id}
                    deleting={deleteMutation.isPending && deleteMutation.variables === image.id}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <div className={`${panelClass} text-sm text-white/50`}>
                {imagesQuery.isLoading
                  ? "Đang tải danh sách ảnh..."
                  : "Chưa có ảnh nào cho trang đăng nhập / đăng ký."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAuthImagesPage;
