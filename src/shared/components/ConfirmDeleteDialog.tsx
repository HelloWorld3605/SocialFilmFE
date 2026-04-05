import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  rememberChoice: boolean;
  onRememberChoiceChange: (checked: boolean) => void;
  onConfirm: () => void;
  isPending?: boolean;
}

const ConfirmDeleteDialog = ({
  open,
  onOpenChange,
  title,
  description,
  rememberChoice,
  onRememberChoiceChange,
  onConfirm,
  isPending = false,
}: ConfirmDeleteDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <Checkbox
            id="remember-delete-choice"
            checked={rememberChoice}
            onCheckedChange={(checked) =>
              onRememberChoiceChange(Boolean(checked))
            }
          />
          <Label
            htmlFor="remember-delete-choice"
            className="text-sm text-white/90"
          >
            Nhớ lựa chọn của tôi
          </Label>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Hủy</AlertDialogCancel>
          <AlertDialogAction disabled={isPending} onClick={onConfirm}>
            Đồng ý
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDeleteDialog;
