"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { PersonRead, PersonSearchResult } from "@/lib/types";

type PersonPickerProps = {
  label: string;
  value: PersonRead | null;
  onChange: (person: PersonRead | null) => void;
  placeholder?: string;
};

/**
 * Search-as-you-type person selector against GET /persons/search?q=.
 * Used by the Verify page (pick Person A / Person B) and the Register page
 * (link a parent / spouse to the new record).
 */
export function PersonPicker({ label, value, onChange, placeholder }: PersonPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PersonRead[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await apiRequest<PersonSearchResult>(
          `/persons/search?q=${encodeURIComponent(query)}`,
        );
        setResults(data.items.slice(0, 8));
      } catch {
        setResults([]);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open]);

  // Close on outside click
  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  if (value) {
    return (
      <div className="field">
        <span>{label}</span>
        <span className="picker-chip">
          {value.full_name}
          <button
            type="button"
            aria-label={`Clear ${label}`}
            onClick={() => onChange(null)}
            style={{ background: "none", border: "none", color: "inherit", display: "flex", padding: 0 }}
          >
            <X size={14} />
          </button>
        </span>
      </div>
    );
  }

  return (
    <div className="picker field" ref={rootRef}>
      <span>{label}</span>
      <input
        value={query}
        placeholder={placeholder ?? "Search by name, email, or phone"}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setOpen(true)}
      />
      {open && results.length > 0 && (
        <div className="picker-results">
          {results.map((person) => (
            <button
              key={person.id}
              type="button"
              onClick={() => {
                onChange(person);
                setQuery("");
                setOpen(false);
              }}
            >
              {person.full_name}
              <small>{person.origin_community ?? person.email ?? person.gender}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
