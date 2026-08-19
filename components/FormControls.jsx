"use client";

export function FormControl({ label, hint, error, children, className = "" }) {
  return (
    <div className={`form-group ${className}`}>
      {label && <label className="form-label">{label}</label>}
      {children}
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
