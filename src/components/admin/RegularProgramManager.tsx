import { FormEvent, useState } from "react";
import { FiEdit } from "react-icons/fi";
import { deleteRegularProgram, saveRegularProgram } from "../../services/programs";
import type { ProgramInput, RegularProgram, Weekday } from "../../types";
import { getWeekdayLabel } from "../../utils/date";
import { AdminConfirmModal } from "./AdminConfirmModal";
import { AdminEditModal } from "./AdminEditModal";

const emptyRegularProgram: ProgramInput = {
  weekday: 1,
  start_time: "",
  end_time: "",
  station_name: "",
  program_name: "",
  is_active: true,
};

const toWeekday = (value: string): Weekday => {
  const weekday = Number(value);
  if (weekday === 0 || weekday === 1 || weekday === 2 || weekday === 3 || weekday === 4 || weekday === 5 || weekday === 6) {
    return weekday;
  }
  return 1;
};

const requireText = (value: string): string => value.trim();

type RegularProgramManagerProps = {
  items: RegularProgram[];
  onChanged: () => void;
  onNotify: (message: string) => void;
};

export function RegularProgramManager({ items, onChanged, onNotify }: RegularProgramManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProgramInput>(emptyRegularProgram);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const editingItem = editingId ? items.find((item) => item.id === editingId) : undefined;
  const hasChanges =
    !editingId ||
    !editingItem ||
    form.weekday !== editingItem.weekday ||
    requireText(form.start_time) !== editingItem.start_time ||
    requireText(form.end_time) !== editingItem.end_time ||
    requireText(form.station_name) !== editingItem.station_name ||
    requireText(form.program_name) !== editingItem.program_name ||
    form.is_active !== editingItem.is_active;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const payload: ProgramInput = {
      ...form,
      start_time: requireText(form.start_time),
      end_time: requireText(form.end_time),
      station_name: requireText(form.station_name),
      program_name: requireText(form.program_name),
    };

    if (!payload.start_time || !payload.end_time || !payload.station_name || !payload.program_name) {
      setError("未入力の項目があります。");
      return;
    }

    try {
      const isEditing = editingId !== null;
      await saveRegularProgram(payload, editingId ?? undefined);
      onNotify(isEditing ? "レギュラー番組を更新しました" : "レギュラー番組を追加しました");
    } catch {
      setError("保存に失敗しました。");
      return;
    }

    setEditingId(null);
    setForm(emptyRegularProgram);
    setIsModalOpen(false);
    onChanged();
  };

  const edit = (item: RegularProgram) => {
    setEditingId(item.id);
    setForm({
      weekday: item.weekday,
      start_time: item.start_time,
      end_time: item.end_time,
      station_name: item.station_name,
      program_name: item.program_name,
      is_active: item.is_active,
    });
    setError("");
    setIsModalOpen(true);
  };

  const create = () => {
    setEditingId(null);
    setForm(emptyRegularProgram);
    setError("");
    setIsModalOpen(true);
  };

  const remove = async (id: string) => {
    try {
      await deleteRegularProgram(id);
      onNotify("レギュラー番組を削除しました");
    } catch {
      setError("削除に失敗しました。");
      return;
    }

    setEditingId(null);
    setForm(emptyRegularProgram);
    setIsConfirmModalOpen(false);
    setIsModalOpen(false);
    onChanged();
  };

  return (
    <div className="manager">
      <div className="manager-heading">
        <h3>レギュラー番組</h3>
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
                <th>曜日</th>
                <th>時間</th>
                <th>局</th>
                <th>番組名</th>
                <th>状態</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className={!item.is_active ? "muted-row" : undefined}>
                  <td className="sticky-action-column">
                    <button type="button" className="icon-button" aria-label={`${item.program_name}を編集`} onClick={() => edit(item)}>
                      <FiEdit aria-hidden="true" />
                    </button>
                  </td>
                  <td>{getWeekdayLabel(item.weekday)}</td>
                  <td>
                    {item.start_time}〜{item.end_time}
                  </td>
                  <td>{item.station_name}</td>
                  <td>{item.program_name}</td>
                  <td>{item.is_active ? "有効" : "無効"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {isModalOpen && (
        <AdminEditModal title={editingId ? "レギュラー番組を編集" : "レギュラー番組を追加"} onClose={() => setIsModalOpen(false)}>
          <form className="admin-modal-form" onSubmit={(event) => void submit(event)}>
            <label>
              曜日
              <select value={form.weekday} onChange={(event) => setForm({ ...form, weekday: toWeekday(event.target.value) })}>
                {[0, 1, 2, 3, 4, 5, 6].map((weekday) => (
                  <option key={weekday} value={weekday}>
                    {getWeekdayLabel(weekday as Weekday)}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-row">
              <label>
                開始
                <input value={form.start_time} onChange={(event) => setForm({ ...form, start_time: event.target.value })} placeholder="26:20" />
              </label>
              <label>
                終了
                <input value={form.end_time} onChange={(event) => setForm({ ...form, end_time: event.target.value })} placeholder="26:45" />
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
            <label className="checkbox-label">
              <input
                checked={form.is_active}
                onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
                type="checkbox"
              />
              有効
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
          title="レギュラー番組を削除"
          message="このレギュラー番組を削除します。元に戻せません。"
          confirmLabel="削除する"
          onConfirm={() => void remove(editingId)}
          onClose={() => setIsConfirmModalOpen(false)}
        />
      )}
    </div>
  );
}
