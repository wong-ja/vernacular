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
  primary: 'bg-accent text-white hover:bg-accent-hover disabled:bg-surface-3 disabled:text-text-tertiary',
  secondary: 'bg-transparent border border-border text-text-primary hover:bg-surface-2',
  ghost: 'bg-transparent text-text-secondary hover:text-text-primary',
  destructive: 'bg-error text-white hover:brightness-110',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-[14px] py-[8px] text-sm',
  md: 'px-5 py-[10px] text-md',
  lg: 'px-6 py-3 text-lg',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, disabled, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`rounded-md font-medium transition-colors duration-150 disabled:cursor-not-allowed cursor-pointer ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
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
