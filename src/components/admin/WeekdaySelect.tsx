import Select, { type SingleValue, type StylesConfig } from "react-select";
import type { Weekday } from "../../types";
import { getWeekdayLabel } from "../../utils/date";

type WeekdaySelectProps = {
  value: Weekday;
  onChange: (value: Weekday) => void;
};

type WeekdayOption = {
  value: Weekday;
  label: string;
};

const weekdayValues: Weekday[] = [0, 1, 2, 3, 4, 5, 6];
const weekdayOptions = weekdayValues.map((weekday): WeekdayOption => ({ value: weekday, label: getWeekdayLabel(weekday) }));

const selectStyles: StylesConfig<WeekdayOption, false> = {
  menuPortal: (base) => ({
    ...base,
    zIndex: 60,
  }),
};

export function WeekdaySelect({ value, onChange }: WeekdaySelectProps) {
  const selectedValue = weekdayOptions.find((option) => option.value === value) ?? weekdayOptions[1];
  const portalTarget = typeof document === "undefined" ? undefined : document.body;

  const update = (option: SingleValue<WeekdayOption>) => {
    if (!option) {
      return;
    }

    onChange(option.value);
  };

  return (
    <div className="field-label">
      <span>曜日</span>
      <Select<WeekdayOption, false>
        aria-label="曜日"
        blurInputOnSelect
        className="admin-react-select"
        classNamePrefix="admin-react-select"
        isSearchable={false}
        menuPlacement="auto"
        menuPortalTarget={portalTarget}
        menuPosition="fixed"
        noOptionsMessage={() => "候補がありません"}
        onChange={update}
        options={weekdayOptions}
        styles={selectStyles}
        value={selectedValue}
      />
    </div>
  );
}
