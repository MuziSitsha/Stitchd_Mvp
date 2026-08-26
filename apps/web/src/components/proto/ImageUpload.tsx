import { useRef, type ReactNode } from "react";

// A native <input type="file" accept="image/*" capture> is what makes this
// work from a gallery *and* a camera on every device with zero
// platform-specific code — standard browser behaviour, not something that
// needs building per-platform. Wraps its trigger in a <label> pointing at a
// visually-hidden input rather than a button+ref+click() dance, so it works
// even if JS re-renders mid-interaction.
export function ImageUpload({
  onFiles,
  multiple = true,
  accept = "image/*",
  disabled,
  className,
  style,
  children,
}: {
  onFiles: (files: FileList) => void;
  multiple?: boolean;
  accept?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <label className={className} style={{ ...style, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1 }}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        capture="environment"
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {children}
    </label>
  );
}
