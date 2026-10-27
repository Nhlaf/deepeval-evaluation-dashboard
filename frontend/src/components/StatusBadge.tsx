interface StatusBadgeProps {
  label: string;
  state: "online" | "offline" | "checking" | "unknown";
}

export function StatusBadge({ label, state }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-${state}`} role="status">
      <span className="status-dot" aria-hidden="true" />
      {label}
    </span>
  );
}
