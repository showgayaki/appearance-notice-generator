import { FormEvent, useState } from "react";
import { FiEdit } from "react-icons/fi";
import { deleteGuestProgram, saveGuestProgram } from "../../services/programs";
import type { GuestProgram, GuestProgramInput } from "../../types";
import { getTodayYmd } from "../../utils/date";
import { AdminConfirmModal } from "./AdminConfirmModal";
import { AdminEditModal } from "./AdminEditModal";

const emptyGuestProgram = (): GuestProgramInput => ({
  program_date: getTodayYmd(),
  start_time: "",
  end_time: "",
  station_name: "",
  program_name: "",
});

const requireText = (value: string): string => value.trim();

type GuestProgramManagerProps = {
  items: GuestProgram[];
  onChanged: () => void;
  onNotify: (message: string) => void;
};

export function GuestProgramManager({ items, onChanged, onNotify }: GuestProgramManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GuestProgramInput>(emptyGuestProgram);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const editingItem = editingId ? items.find((item) => item.id === editingId) : undefined;
  const hasChanges =
    !editingId ||
    !editingItem ||
    form.program_date !== editingItem.program_date ||
    requireText(form.start_time) !== editingItem.start_time ||
    requireText(form.end_time) !== editingItem.end_time ||
    requireText(form.station_name) !== editingItem.station_name ||
    requireText(form.program_name) !== editingItem.program_name;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const payload: GuestProgramInput = {
      program_date: form.program_date,
      start_time: requireText(form.start_time),
      end_time: requireText(form.end_time),
      station_name: requireText(form.station_name),
      program_name: requireText(form.program_name),
    };

    if (!payload.program_date || !payload.start_time || !payload.end_time || !payload.station_name || !payload.program_name) {
      setError("未入力の項目があります。");
      return;
    }

    try {
      const isEditing = editingId !== null;
      await saveGuestProgram(payload, editingId ?? undefined);
      onNotify(isEditing ? "ゲスト出演を更新しました" : "ゲスト出演を追加しました");
    } catch {
      setError("保存に失敗しました。");
      return;
    }

    setEditingId(null);
    setForm(emptyGuestProgram());
    setIsModalOpen(false);
    onChanged();
  };

  const edit = (item: GuestProgram) => {
    setEditingId(item.id);
    setForm({
      program_date: item.program_date,
      start_time: item.start_time,
      end_time: item.end_time,
      station_name: item.station_name,
      program_name: item.program_name,
    });
    setError("");
    setIsModalOpen(true);
  };

  const create = () => {
    setEditingId(null);
    setForm(emptyGuestProgram());
    setError("");
    setIsModalOpen(true);
  };

  const remove = async (id: string) => {
    try {
      await deleteGuestProgram(id);
      onNotify("ゲスト出演を削除しました");
    } catch {
      setError("削除に失敗しました。");
      return;
    }

    setEditingId(null);
    setForm(emptyGuestProgram());
    setIsConfirmModalOpen(false);
    setIsModalOpen(false);
    onChanged();
  };

  return (
    <div className="manager">
      <div className="manager-heading">
        <h3>ゲスト出演</h3>
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
                <th>日付</th>
                <th>時間</th>
                <th>局</th>
                <th>番組名</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="sticky-action-column">
                    <button type="button" className="icon-button" aria-label={`${item.program_name}を編集`} onClick={() => edit(item)}>
                      <FiEdit aria-hidden="true" />
                    </button>
                  </td>
                  <td>{item.program_date}</td>
                  <td>
                    {item.start_time}〜{item.end_time}
                  </td>
                  <td>{item.station_name}</td>
                  <td>{item.program_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {isModalOpen && (
        <AdminEditModal title={editingId ? "ゲスト出演を編集" : "ゲスト出演を追加"} onClose={() => setIsModalOpen(false)}>
          <form className="admin-modal-form" onSubmit={(event) => void submit(event)}>
            <label>
              日付
              <input type="date" value={form.program_date} onChange={(event) => setForm({ ...form, program_date: event.target.value })} />
            </label>
            <div className="form-row">
              <label>
                開始
                <input value={form.start_time} onChange={(event) => setForm({ ...form, start_time: event.target.value })} placeholder="24:45" />
              </label>
              <label>
                終了
                <input value={form.end_time} onChange={(event) => setForm({ ...form, end_time: event.target.value })} placeholder="25:15" />
              </label>
            </div>
            <label>
              局
              <input value={form.station_name} onChange={(event) => setForm({ ...form, station_name: event.target.value })} />
            </label>
            <label>
              番組名
              <input value={form.program_name} onChange={(event) => setForm({ ...form, program_name: event.target.value })} />
            </label>
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
            {error && <p className="error">{error}</p>}
          </form>
        </AdminEditModal>
      )}
      {isConfirmModalOpen && editingId && (
        <AdminConfirmModal
          title="ゲスト出演を削除"
          message="このゲスト出演を削除します。元に戻せません。"
          confirmLabel="削除する"
          onConfirm={() => void remove(editingId)}
          onClose={() => setIsConfirmModalOpen(false)}
        />
      )}
    </div>
  );
}
