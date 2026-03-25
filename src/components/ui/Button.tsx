import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-gradient-to-r from-indigo-500 to-purple-500',
    'text-white font-medium',
    'shadow-lg shadow-indigo-500/20',
    'hover:shadow-indigo-500/40',
    'border border-indigo-400/20',
  ].join(' '),
  secondary: [
    'bg-[var(--bg-card)] backdrop-blur-xl',
    'text-[var(--text-primary)]',
    'border border-[var(--border-subtle)]',
    'hover:bg-[var(--bg-card-hover)]',
    'hover:border-[var(--border-active)]',
  ].join(' '),
  ghost: [
    'bg-transparent',
    'text-[var(--text-secondary)]',
    'hover:text-[var(--text-primary)]',
    'hover:bg-white/5',
    'border border-transparent',
  ].join(' '),
  danger: [
    'bg-red-500/10',
    'text-red-400',
    'border border-red-500/20',
    'hover:bg-red-500/20',
    'hover:border-red-500/40',
  ].join(' '),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2.5',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}) => {
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={clsx(
        'inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </motion.button>
  );
};
