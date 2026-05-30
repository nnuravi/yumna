const STAGE_CONFIG = {
  submitted:           { label: 'Submitted',       bg: '#f3f4f6', color: '#6b7280' },
  approved:            { label: 'Approved',         bg: '#ecfdf5', color: '#059669' },
  denied:              { label: 'Denied',           bg: '#fff1f2', color: '#e5484d' },
  stalled:             { label: 'On Hold',          bg: '#fffbeb', color: '#d97706' },
  delivery_confirmed:  { label: 'Delivery Conf.',   bg: '#eff6ff', color: '#3b82f6' },
  disbursed:           { label: 'Disbursed',        bg: '#ecfdf5', color: '#059669' },
  repaid:              { label: 'Repaid ✓',         bg: '#f3f4f6', color: '#374151' },
  overdue:             { label: 'Overdue',          bg: '#fff1f2', color: '#e5484d' },
  due_today:           { label: 'Due Today',        bg: '#fff1f2', color: '#e5484d' },
  due_soon:            { label: 'Due Soon',         bg: '#fffbeb', color: '#d97706' },
  upcoming:            { label: 'Upcoming',         bg: '#f3f4f6', color: '#6b7280' },
  Active:              { label: 'Active',           bg: '#ecfdf5', color: '#059669' },
  Pending:             { label: 'Pending',          bg: '#fffbeb', color: '#d97706' },
  Low:                 { label: 'Low Risk',         bg: '#ecfdf5', color: '#059669' },
  High:                { label: 'High Risk',        bg: '#fff1f2', color: '#e5484d' },
  Medium:              { label: 'Med Risk',         bg: '#fffbeb', color: '#d97706' },
}

export default function Badge({ stage, custom, className = '' }) {
  const cfg = STAGE_CONFIG[stage] || STAGE_CONFIG[custom] || { label: stage || custom, bg: '#f3f4f6', color: '#6b7280' }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${className}`}
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  )
}
