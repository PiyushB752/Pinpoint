"use client";

import type { KeyboardEvent } from "react";

interface QueryInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export default function QueryInput({
  value,
  onChange,
  onSubmit,
}: QueryInputProps) {
  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      onSubmit();
    }
  }

  return (
    <div className="query-box">
      <div className="query-box-main">
        <textarea
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          onKeyDown={handleKeyDown}
          placeholder="Describe the network issue you're investigating..."
          rows={3}
          aria-label="Investigation query"
        />
      </div>

      <div className="query-box-footer">
        <span className="query-hint">
          Press Enter to search · Shift + Enter for a new line
        </span>

        <button
          type="button"
          className="search-button"
          onClick={onSubmit}
          disabled={!value.trim()}
        >
          Search
        </button>
      </div>
    </div>
  );
}