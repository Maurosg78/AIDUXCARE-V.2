import { useMemo } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

export interface SaveNoteCPOGateProps {
  canSave: boolean;
  isBusy?: boolean;
  reasonBlocked?: string;
  onRequestSave: (event?: ReactMouseEvent<HTMLButtonElement>) => void;
}

export default function SaveNoteCPOGate({
  canSave,
  isBusy = false,
  reasonBlocked,
  onRequestSave,
}: SaveNoteCPOGateProps) {
  const disabled = useMemo<boolean>(() => isBusy || !canSave, [isBusy, canSave]);

  const title = useMemo<string>(() => {
    if (isBusy) return "Saving…";
    if (!canSave && reasonBlocked) return reasonBlocked;
    if (!canSave) return "Action not allowed";
    return "Save";
  }, [canSave, isBusy, reasonBlocked]);

  const handleClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    onRequestSave(e);
  };

  return (
    <button
      type="button"
      aria-disabled={disabled}
      disabled={disabled}
      onClick={handleClick}
    >
      {title}
    </button>
  );
}
