import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

const baseClass = 'w-full bg-surface-2 border border-border rounded-md px-[14px] py-[10px] text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none transition-colors duration-150';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`${baseClass} h-10 ${error ? 'border-error-text' : ''} ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className = '', ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`${baseClass} min-h-[120px] resize-y ${error ? 'border-error-text' : ''} ${className}`}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';
