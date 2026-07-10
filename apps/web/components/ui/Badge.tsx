import { HTMLAttributes } from 'react';

type BadgeVariant = 'open-license' | 'nc-license' | 'high-confidence' | 'medium-confidence' | 'low-confidence' | 'language' | 'default';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  'open-license': 'bg-success-bg text-success-text border border-success',
  'nc-license': 'bg-warning-bg text-warning-text border border-warning',
  'high-confidence': 'bg-success-bg text-success-text border border-success',
  'medium-confidence': 'bg-warning-bg text-warning-text border border-warning',
  'low-confidence': 'bg-error-bg text-error-text border border-error',
  language: 'bg-accent-subtle text-info-text border border-accent-subtle',
  default: 'bg-surface-2 text-text-secondary border border-border',
};

export default function Badge({ variant = 'default', className = '', children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
