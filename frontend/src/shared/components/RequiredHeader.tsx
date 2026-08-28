interface RequiredHeaderProps {
  label: string;
}

export function RequiredHeader({ label }: RequiredHeaderProps) {
  return (
    <span className="inline-flex items-center gap-1">
      <span>{label}</span>
      <span aria-hidden="true" className="text-danger-600">*</span>
    </span>
  );
}
