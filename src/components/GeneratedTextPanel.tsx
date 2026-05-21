import { useEffect, useRef } from "react";

type GeneratedTextPanelProps = {
  generatedText: string;
  onGeneratedTextChange: (value: string) => void;
  onNotify: (message: string) => void;
};

export function GeneratedTextPanel({ generatedText, onGeneratedTextChange, onNotify }: GeneratedTextPanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [generatedText]);

  const copyText = async () => {
    await navigator.clipboard.writeText(generatedText);
    onNotify("コピーしました");
  };

  return (
    <section className="text-panel">
      <div className="section-heading">
        <h2>生成テキスト</h2>
        <button type="button" onClick={() => void copyText()} disabled={generatedText.length === 0}>
          コピー
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={generatedText}
        onChange={(event) => onGeneratedTextChange(event.target.value)}
        rows={1}
        aria-label="生成された出演情報テキスト"
      />
    </section>
  );
}
