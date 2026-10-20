import { useEffect, useRef } from 'react'

/** 예/아니오 확인 모달. 기본 포커스는 안전한 쪽(아니오)에 둔다. */
export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="admin-dialog"
      aria-labelledby="confirmTitle"
      onCancel={(event) => { event.preventDefault(); onCancel() }}
      onClick={(event) => { if (event.target === ref.current) onCancel() }}
    >
      <div className="admin-dialog-box">
        <h3 id="confirmTitle">{title}</h3>
        <p>{message}</p>
        <div className="admin-dialog-actions">
          <button className="admin-btn" type="button" onClick={onCancel}>아니오</button>
          <button className="admin-btn danger" type="button" onClick={onConfirm}>예</button>
        </div>
      </div>
    </dialog>
  )
}
