import Select, { type SingleValue, type StylesConfig } from "react-select";
import type { PostHeader } from "../types";

type PostHeaderOption = {
  value: string;
  label: string;
};

type PostHeaderSelectProps = {
  postHeaders: PostHeader[];
  selectedPostHeaderId: string;
  onSelectedPostHeaderIdChange: (value: string) => void;
};

const selectStyles: StylesConfig<PostHeaderOption, false> = {
  menuPortal: (base) => ({
    ...base,
    zIndex: 60,
  }),
};

export function PostHeaderSelect({ postHeaders, selectedPostHeaderId, onSelectedPostHeaderIdChange }: PostHeaderSelectProps) {
  const options: PostHeaderOption[] = [
    ...postHeaders.map((header): PostHeaderOption => ({ value: header.id, label: header.title })),
    { value: "", label: "なし" },
  ];
  const selectedOption = options.find((option) => option.value === selectedPostHeaderId) ?? options[options.length - 1];
  const portalTarget = typeof document === "undefined" ? undefined : document.body;

  const update = (option: SingleValue<PostHeaderOption>) => {
    onSelectedPostHeaderIdChange(option?.value ?? "");
  };

  return (
    <section className="header-select-panel">
      <div className="field-label">
        <span>投稿見出し</span>
        <Select<PostHeaderOption, false>
          aria-label="投稿見出し"
          blurInputOnSelect
          className="post-header-react-select"
          classNamePrefix="post-header-react-select"
          isSearchable={false}
          menuPlacement="auto"
          menuPortalTarget={portalTarget}
          menuPosition="fixed"
          noOptionsMessage={() => "候補がありません"}
          onChange={update}
          options={options}
          styles={selectStyles}
          value={selectedOption}
        />
      </div>
    </section>
  );
}
