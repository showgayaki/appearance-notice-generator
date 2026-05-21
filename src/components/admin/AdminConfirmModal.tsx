type AdminConfirmModalProps = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
};

export function AdminConfirmModal({ title, message, confirmLabel, onConfirm, onClose }: AdminConfirmModalProps) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="login-modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="admin-confirm-modal-title" onClick={(event) => event.stopPropagation()}>
        <div className="section-heading">
          <h2 id="admin-confirm-modal-title">{title}</h2>
          <button type="button" className="plain-button" onClick={onClose}>
            閉じる
          </button>
        </div>
        <p className="confirm-message">{message}</p>
        <div className="button-row confirm-actions">
          <button type="button" onClick={onClose}>
            キャンセル
          </button>
          <button type="button" className="danger-button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
