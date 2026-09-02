"use client";

import { useId } from "react";

export function FormControl({ label, hint, error, children, className = "" }) {
  const id = useId();
  const inputId = `${id}-input`;
  return (
    <div className={`form-group ${className}`}>
      {label && <label className="form-label" htmlFor={inputId}>{label}</label>}
      {typeof children === "object" && children !== null
        ? <div id={inputId}>{children}</div>
        : <div id={inputId}>{children}</div>}
      {hint && !error && <div className="form-hint">{hint}</div>}
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}

export function FormRow({ children, className = "" }) {
  return <div className={`sheet-row ${className}`}>{children}</div>;
}

export function FormSection({ title, children, className = "" }) {
  return (
    <div className={`sheet-section ${className}`}>
      {title && <div className="sheet-label">{title}</div>}
      {children}
    </div>
  );
}
