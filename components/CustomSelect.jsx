"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

function normalize(options) {
  return (options || []).map((o) =>
    o && typeof o === "object"
      ? { value: o.value, label: o.label != null ? o.label : String(o.value), disabled: !!o.disabled }
      : { value: o, label: String(o), disabled: false }
  );
}

function Chevron() {
  return (
    <svg className="custom-select-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function Check() {
  return (
    <svg className="custom-select-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select",
  disabled = false,
  className = "sheet-input",
  style,
  triggerStyle,
  ariaLabel,
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [coords, setCoords] = useState(null);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const items = normalize(options);
  const selectedIndex = items.findIndex((i) => i.value === value);
  const selected = selectedIndex >= 0 ? items[selectedIndex] : null;
  const firstEnabled = items.findIndex((i) => !i.disabled);
  const isPlaceholder = value === "" || value == null;

  function place() {
    const btn = buttonRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const below = window.innerHeight - r.bottom;
    const above = r.top;
    const est = Math.min(listRef.current?.offsetHeight || items.length * 44 + 12, 264);
    const up = below < est + 8 && above > below;
    setCoords({
      left: Math.max(8, Math.min(r.left, window.innerWidth - r.width - 8)),
      width: r.width,
      top: up ? undefined : r.bottom + 6,
      bottom: up ? window.innerHeight - r.top + 6 : undefined,
      maxHeight: Math.max(120, up ? above - 16 : below - 16),
    });
  }

  useEffect(() => {
    if (!open) return;
    place();
    const onPointer = (e) => {
      if (rootRef.current?.contains(e.target)) return;
      if (listRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onScroll = () => place();
    document.addEventListener("pointerdown", onPointer, true);
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function openList() {
    if (disabled) return;
    setActive(selectedIndex >= 0 ? selectedIndex : firstEnabled);
    setOpen(true);
  }

  function move(dir) {
    let next = active;
    for (let i = 0; i < items.length; i++) {
      next = (next + dir + items.length) % items.length;
      if (!items[next].disabled) break;
    }
    setActive(next);
  }

  function commit(item) {
    if (!item || item.disabled) return;
    onChange?.(item.value);
    setOpen(false);
  }

  function onKeyDown(e) {
    if (disabled) return;
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
    else if (e.key === "Tab") { setOpen(false); }
    else if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); commit(items[active]); }
  }

  return (
    <div ref={rootRef} className="custom-select" style={style} onKeyDown={onKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        className={className}
        style={triggerStyle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openList())}
      >
        <span className={`custom-select-value${isPlaceholder ? " is-placeholder" : ""}`}>
          {selected ? selected.label : placeholder}
        </span>
        <Chevron />
      </button>
      {open && coords && typeof document !== "undefined" && createPortal(
        <ul
          ref={listRef}
          className="custom-select-list"
          role="listbox"
          style={{ position: "fixed", top: coords.top, bottom: coords.bottom, left: coords.left, right: "auto", width: coords.width, maxHeight: coords.maxHeight }}
        >
          {items.map((item, i) => (
            <li
              key={`${item.value}-${i}`}
              role="option"
              aria-selected={item.value === value}
              aria-disabled={item.disabled || undefined}
              className={`custom-select-option${i === active ? " is-active" : ""}${item.value === value ? " is-selected" : ""}`}
              onPointerEnter={() => !item.disabled && setActive(i)}
              onClick={() => commit(item)}
            >
              <span className="custom-select-option-label">{item.label}</span>
              {item.value === value && <Check />}
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  );
}
