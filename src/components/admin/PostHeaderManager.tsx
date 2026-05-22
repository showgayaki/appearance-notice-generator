import { FormEvent, useState } from "react";
import { FiEdit } from "react-icons/fi";
import { deletePostHeader, savePostHeader } from "../../services/programs";
import type { PostHeader, PostHeaderInput } from "../../types";
import { AdminConfirmModal } from "./AdminConfirmModal";
import { AdminEditModal } from "./AdminEditModal";
import { FieldError } from "./FieldError";

const emptyPostHeader = (): PostHeaderInput => ({
  title: "",
});

const requireText = (value: string): string => value.trim();

type PostHeaderManagerProps = {
  items: PostHeader[];
  onChanged: () => void;
  onNotify: (message: string, kind?: "success" | "error") => void;
};

export function PostHeaderManager({ items, onChanged, onNotify }: PostHeaderManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PostHeaderInput>(emptyPostHeader);
  const [titleError, setTitleError] = useState("");
  const [validationKey, setValidationKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const editingItem = editingId ? items.find((item) => item.id === editingId) : undefined;
  const hasChanges = !editingId || !editingItem || requireText(form.title) !== editingItem.title;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: PostHeaderInput = {
      title: requireText(form.title),
    };

    if (!payload.title) {
      setTitleError("見出しを入力してください。");
      setValidationKey((current) => current + 1);
      return;
    }

    try {
      const isEditing = editingId !== null;
      await savePostHeader(payload, editingId ?? undefined);
      onNotify(isEditing ? "投稿見出しを更新しました" : "投稿見出しを追加しました");
    } catch {
      onNotify("保存に失敗しました", "error");
      return;
    }

    setEditingId(null);
    setForm(emptyPostHeader());
    setIsModalOpen(false);
    onChanged();
  };

  const edit = (item: PostHeader) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
    });
    setTitleError("");
    setValidationKey(0);
    setIsModalOpen(true);
  };

  const create = () => {
    setEditingId(null);
    setForm(emptyPostHeader());
    setTitleError("");
    setValidationKey(0);
    setIsModalOpen(true);
  };

  const remove = async (id: string) => {
    try {
      await deletePostHeader(id);
      onNotify("投稿見出しを削除しました");
    } catch {
      onNotify("削除に失敗しました", "error");
      return;
    }

    setEditingId(null);
    setForm(emptyPostHeader());
    setIsConfirmModalOpen(false);
    setIsModalOpen(false);
    onChanged();
  };

  return (
    <div className="manager">
      <div className="manager-heading">
        <h3>投稿見出し</h3>
        <button type="button" onClick={create}>
          追加
        </button>
      </div>
      {items.length === 0 ? (
        <p className="empty">まだ登録がありません。</p>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="sticky-action-column"></th>
                <th>見出し</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="sticky-action-column">
                    <button type="button" className="icon-button" aria-label={`${item.title}を編集`} onClick={() => edit(item)}>
                      <FiEdit aria-hidden="true" />
                    </button>
                  </td>
                  <td>{item.title}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {isModalOpen && (
        <AdminEditModal title={editingId ? "投稿見出しを編集" : "投稿見出しを追加"} onClose={() => setIsModalOpen(false)}>
          <form className="admin-modal-form" onSubmit={(event) => void submit(event)}>
            <div className="field-label field-with-tooltip">
              <span>見出し</span>
              <input
                aria-label="見出し"
                value={form.title}
                onChange={(event) => {
                  setForm({ ...form, title: event.target.value });
                  setTitleError("");
                }}
              />
              <FieldError message={titleError} visibleKey={validationKey} />
            </div>
            <div className="button-row admin-modal-actions">
              {editingId && (
                <button type="button" className="delete-outline-button" onClick={() => setIsConfirmModalOpen(true)}>
                  削除
                </button>
              )}
              <button type="submit" disabled={editingId !== null && !hasChanges}>
                {editingId ? "更新" : "追加"}
              </button>
            </div>
          </form>
        </AdminEditModal>
      )}
      {isConfirmModalOpen && editingId && (
        <AdminConfirmModal
          title="投稿見出しを削除"
          message="この投稿見出しを削除します。元に戻せません。"
          confirmLabel="削除する"
          onConfirm={() => void remove(editingId)}
          onClose={() => setIsConfirmModalOpen(false)}
        />
      )}
    </div>
  );
}
