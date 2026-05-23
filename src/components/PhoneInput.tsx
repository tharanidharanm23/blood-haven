import { useMemo } from "react";

export function PhoneInput({
  value,
  onChange,
  placeholder = "10-digit number",
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const digits = useMemo(() => {
    if (value.startsWith("+91")) return value.slice(3).replace(/[^\d]/g, "");
    if (value.startsWith("91") && value.length === 12) return value.slice(2).replace(/[^\d]/g, "");
    return value.replace(/[^\d]/g, "");
  }, [value]);

  return (
    <div className="grid grid-cols-[72px_1fr] gap-2">
      <input
        value="+91"
        disabled
        className="hud-input text-center opacity-70"
        aria-label="Country code"
      />
      <input
        value={digits}
        disabled={disabled}
        onChange={(e) => {
          let val = e.target.value.replace(/[^\d]/g, "");
          // If user types 91... and it's longer than 10, they likely typed the prefix.
          if (val.startsWith("91") && val.length > 10) {
            val = val.slice(2);
          }
          const nextDigits = val.slice(0, 10);
          onChange(`+91${nextDigits}`);
        }}
        inputMode="numeric"
        className="hud-input"
        placeholder={placeholder}
        aria-label="Mobile number"
      />
    </div>
  );
}

