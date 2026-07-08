import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2 } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  loading?: boolean;
  success?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      icon,
      loading,
      success,
      className = '',
      required,
      disabled,
      maxLength,
      value,
      ...props
    },
    ref
  ) => {
    const isError = Boolean(error);
    const charCount = typeof value === 'string' ? value.length : 0;

    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        {/* Label Row */}
        {(label || maxLength) && (
          <div className="flex items-center justify-between">
            {label && (
              <label htmlFor={props.id} className="text-sm font-semibold text-brand-green/90">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            {maxLength && (
              <span className={`text-xs ${charCount > maxLength ? 'text-red-500' : 'text-brand-green/50'}`}>
                {charCount}/{maxLength}
              </span>
            )}
          </div>
        )}

        {/* Input Wrapper */}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 text-brand-green/40 pointer-events-none">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            value={value}
            disabled={disabled || loading}
            required={required}
            maxLength={maxLength}
            className={`
              w-full rounded-2xl border px-4 py-3 text-brand-green transition-all
              placeholder:text-brand-green/30
              focus:outline-none focus:ring-2 focus:ring-brand-green/20
              disabled:opacity-60 disabled:bg-brand-beige/20 disabled:cursor-not-allowed
              ${icon ? 'pl-10' : ''}
              ${loading || success ? 'pr-10' : ''}
              ${
                isError
                  ? 'border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-red-200'
                  : 'border-brand-green/10 bg-white hover:border-brand-green/20 focus:border-brand-green'
              }
            `}
            {...props}
          />

          {/* Right Accessories (Loading / Success) */}
          <div className="absolute right-3 pointer-events-none flex items-center">
            {loading && <Loader2 className="w-5 h-5 text-brand-green/50 animate-spin" />}
            {!loading && success && !isError && <CheckCircle2 className="w-5 h-5 text-green-500" />}
          </div>
        </div>

        {/* Hint & Error Text */}
        <AnimatePresence mode="wait">
          {isError ? (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -5, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -5, height: 0 }}
              className="text-xs font-medium text-red-500 pl-1"
            >
              {error}
            </motion.p>
          ) : hint ? (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-brand-green/50 pl-1"
            >
              {hint}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = 'Input';
