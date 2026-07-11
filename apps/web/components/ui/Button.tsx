import { ButtonHTMLAttributes, forwardRef } from 'react';
import Spinner from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-accent text-accentOn hover:bg-accent-hover hover:translate-y-[-1px] hover:shadow-sm active:scale-[0.98] active:shadow-none disabled:bg-surface-3 disabled:text-text-tertiary disabled:shadow-none',
  secondary: 'bg-transparent border border-border text-text-primary hover:bg-surface-2 active:bg-surface-3 disabled:opacity-50',
  ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-2 active:bg-surface-3',
  destructive: 'bg-error-bg text-error-text border border-error-border hover:bg-error hover:border-error-text',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-[14px] py-[8px] text-[13px] min-h-[34px]',
  md: 'px-5 py-[10px] text-base min-h-[42px]',
  lg: 'px-7 py-[13px] text-base min-h-[48px]',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, disabled, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`rounded-[10px] font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-150 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Spinner />
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
