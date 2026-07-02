import { ChangeEvent, useEffect, useRef, useState } from "react";

const INVALID_GB_DATE_TIME_VALUE = "__INVALID_GB_DATE_TIME__";
const GB_DATE_TIME_HELP = "Use dd/mm/yyyy, HH:mm.";

type GbDateTimeInputProps = {
  id: string;
  name?: string;
  className?: string;
  value: string;
  onValueChange: (value: string) => void;
  required?: boolean;
  ariaRequired?: boolean;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function isInvalidSentinel(value: string) {
  return value === INVALID_GB_DATE_TIME_VALUE;
}

function formatLocalValueForDisplay(value: string) {
  if (!value || isInvalidSentinel(value)) return "";

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return value;

  const [, year, month, day, hour, minute] = match;
  return `${day}/${month}/${year}, ${hour}:${minute}`;
}

function parseGbDisplayValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s*,?\s+(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const [, dayRaw, monthRaw, yearRaw, hourRaw, minuteRaw] = match;
  const day = Number(dayRaw);
  const month = Number(monthRaw);
  const year = Number(yearRaw);
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) {
    return null;
  }

  return `${year}-${pad2(month)}-${pad2(day)}T${pad2(hour)}:${pad2(minute)}`;
}

export default function GbDateTimeInput({
  id,
  name,
  className,
  value,
  onValueChange,
  required,
  ariaRequired,
  ariaInvalid,
  ariaDescribedBy,
}: GbDateTimeInputProps) {
  const [draft, setDraft] = useState(() => formatLocalValueForDisplay(value));
  const [focused, setFocused] = useState(false);
  const [parseError, setParseError] = useState(false);
  const nativePickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!focused && !isInvalidSentinel(value)) {
      setDraft(formatLocalValueForDisplay(value));
      setParseError(false);
    }
    if (!value) {
      setDraft("");
      setParseError(false);
    }
  }, [focused, value]);

  function handleFocus() {
    setFocused(true);
  }

  function handleBlur() {
    setFocused(false);
    const parsed = parseGbDisplayValue(draft);
    if (parsed === null) {
      setParseError(!!draft.trim());
      onValueChange(INVALID_GB_DATE_TIME_VALUE);
      return;
    }

    setParseError(false);
    onValueChange(parsed);
    setDraft(formatLocalValueForDisplay(parsed));
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    setDraft(next);

    const parsed = parseGbDisplayValue(next);
    if (parsed === null) {
      setParseError(!!next.trim());
      onValueChange(INVALID_GB_DATE_TIME_VALUE);
      return;
    }

    setParseError(false);
    onValueChange(parsed);
  }

  function handleNativePickerChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    setParseError(false);
    setDraft(formatLocalValueForDisplay(next));
    onValueChange(next);
  }

  function handleOpenNativePicker() {
    const picker = nativePickerRef.current;
    if (!picker) return;

    if (typeof picker.showPicker === "function") {
      picker.showPicker();
      return;
    }

    picker.click();
  }

  const describedBy = [ariaDescribedBy, parseError ? `${id}-gb-format-help` : undefined].filter(Boolean).join(" ") || undefined;
  const nativePickerValue = value && !isInvalidSentinel(value) ? value : "";

  return (
    <>
      <div className="flex items-stretch gap-1">
        <input
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="dd/mm/yyyy, HH:mm"
          className={`${className || ""} min-w-0 flex-1`}
          value={draft}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          required={required}
          aria-required={ariaRequired}
          aria-invalid={ariaInvalid || parseError}
          aria-describedby={describedBy}
        />
        <button
          type="button"
          className="rounded border px-2 text-sm leading-none hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          aria-label={`Open calendar picker for ${name || id}`}
          title="Open calendar picker"
          onClick={handleOpenNativePicker}
        >
          📅
        </button>
        <input
          ref={nativePickerRef}
          type="datetime-local"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          value={nativePickerValue}
          onChange={handleNativePickerChange}
        />
      </div>
      {parseError && (
        <p id={`${id}-gb-format-help`} className="mt-1 text-xs text-red-700" role="alert">
          {GB_DATE_TIME_HELP}
        </p>
      )}
    </>
  );
}
