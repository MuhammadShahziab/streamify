import React, { useMemo, useState, useEffect } from "react";

type OTPInputProps = {
  length?: number; // default 4
  value?: string; // controlled value (optional)
  onChange?: (val: string) => void;
  onComplete?: (val: string) => void; // called when all boxes filled
  name?: string; // useful for forms
  disabled?: boolean;
};

const OTPInput: React.FC<OTPInputProps> = ({
  length = 4,
  value,
  onChange,
  onComplete,
  name = "otp",
  disabled,
}) => {
  const [internal, setInternal] = useState<string>("".padEnd(length, " "));
  const vals = (value ?? internal).padEnd(length, " ").slice(0, length);
  const refs = useMemo(
    () => Array.from({ length }, () => React.createRef<HTMLInputElement>()),
    [length]
  );

  // Move focus to the first empty at mount
  useEffect(() => {
    const firstEmpty = vals.indexOf(" ");
    if (firstEmpty >= 0) refs[firstEmpty].current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setValue = (next: string) => {
    const cleaned = next.replace(/\s/g, ""); // remove all whitespace

    if (onChange) onChange(next);
    else setInternal(next);

    if (cleaned.length === length) {
      onComplete?.(cleaned); // call only if all 4 digits are present
    }
  };

  const updateIndex = (idx: number, char: string) => {
    if (!/^\d$/.test(char)) return; // block non-digit
    const arr = vals.split("");
    arr[idx] = char;
    const next = arr.join("");
    setValue(next);
    // focus next
    if (idx < length - 1) refs[idx + 1].current?.focus();
  };

  const clearIndex = (idx: number) => {
    const arr = vals.split("");
    arr[idx] = " ";
    setValue(arr.join(""));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number
  ) => {
    const input = e.target.value.replace(/\s/g, "");
    if (input.length === 0) {
      // user cleared
      clearIndex(idx);
      return;
    }
    if (input.length === 1) {
      updateIndex(idx, input);
      return;
    }
    // If user pasted multiple characters into a single box
    handlePaste(input, idx);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (vals[idx] !== " ") {
        clearIndex(idx);
      } else if (idx > 0) {
        refs[idx - 1].current?.focus();
        // also clear previous if it had a value
        if (vals[idx - 1] !== " ") {
          const arr = vals.split("");
          arr[idx - 1] = " ";
          setValue(arr.join(""));
        }
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      refs[idx - 1].current?.focus();
    } else if (e.key === "ArrowRight" && idx < length - 1) {
      refs[idx + 1].current?.focus();
    }
  };

  const handlePaste = async (
    data: string | ClipboardEvent | string[],
    idx: number
  ) => {
    let paste = "";
    if (typeof data === "string") paste = data;
    else if (Array.isArray(data)) paste = data.join("");
    else {
      // from onPaste event
      const ev = data as unknown as React.ClipboardEvent<HTMLInputElement>;
      paste = ev.clipboardData.getData("text");
      ev.preventDefault();
    }
    paste = paste.replace(/\D/g, "").slice(0, length - idx);
    if (!paste) return;

    const arr = vals.split("");
    for (let i = 0; i < paste.length; i++) {
      arr[idx + i] = paste[i];
    }
    const next = arr.join("");
    setValue(next);
    const nextFocus = Math.min(idx + paste.length, length - 1);
    refs[nextFocus].current?.focus();
  };

  return (
    <div className="flex items-center gap-2">
      {/* Hidden input for forms if needed */}
      <input type="hidden" name={name} value={vals.replace(/\s/g, "")} />
      {Array.from({ length }).map((_, i) => {
        const val = vals[i] === " " ? "" : vals[i];
        return (
          <input
            key={i}
            ref={refs[i]}
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label={`OTP digit ${i + 1}`}
            maxLength={1}
            value={val}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onPaste={(e) => handlePaste(e, i)}
            disabled={disabled}
            className={[
              "input input-bordered w-14 text-center text-xl font-semibold",
              "focus:outline-none focus:input-primary",
              // highlight active box with ring using daisyUI/Tailwind
              "focus:ring-2 focus:ring-primary",
              disabled ? "opacity-60 cursor-not-allowed" : "",
            ].join(" ")}
          />
        );
      })}
    </div>
  );
};

export default OTPInput;
