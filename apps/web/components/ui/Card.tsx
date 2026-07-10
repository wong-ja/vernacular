import { HTMLAttributes, forwardRef } from 'react';

type Variant = 'base' | 'elevated' | 'interactive' | 'metric';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

const variantStyles: Record<Variant, string> = {
  base: 'bg-surface-1 border border-border rounded-lg p-6',
  elevated: 'bg-surface-1 border border-border rounded-lg p-6 shadow-sm',
  interactive: 'bg-surface-1 border border-border rounded-lg p-6 cursor-pointer hover:bg-surface-2 hover:border-border hover:-translate-y-px transition-all duration-150',
  metric: 'bg-surface-1 border border-border rounded-lg p-6',
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'base', className = '', children, ...props }, ref) => {
    return (
      <div ref={ref} className={`${variantStyles[variant]} ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
export default Card;
