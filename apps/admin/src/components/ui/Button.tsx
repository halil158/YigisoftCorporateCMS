import { ButtonHTMLAttributes, ReactNode, ElementType } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
  as?: ElementType
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: `
    bg-primary-600 hover:bg-primary-700 text-white
    dark:bg-accent-dark dark:hover:bg-accent-dark-hover
    focus:ring-primary-500 dark:focus:ring-accent-soft
  `,
  secondary: `
    bg-gray-200 hover:bg-gray-300 text-gray-800
    dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-gray-200
    focus:ring-gray-400 dark:focus:ring-slate-500
  `,
  danger: `
    bg-red-600 hover:bg-red-700 text-white
    focus:ring-red-500
  `,
  success: `
    bg-emerald-600 hover:bg-emerald-700 text-white
    focus:ring-emerald-500
  `,
  ghost: `
    bg-transparent hover:bg-gray-100 text-gray-700
    dark:hover:bg-slate-700 dark:text-gray-300
    focus:ring-gray-400 dark:focus:ring-slate-500
  `,
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  as: Component = 'button',
  ...props
}: ButtonProps) {
  return (
    <Component
      className={`
        inline-flex items-center justify-center rounded-lg font-medium
        transition-colors duration-150
        focus:outline-none focus:ring-2 focus:ring-offset-2
        dark:focus:ring-offset-slate-900
        ${Component === 'button' ? 'disabled:opacity-50 disabled:cursor-not-allowed' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `.trim()}
      disabled={Component === 'button' ? disabled : undefined}
      {...props}
    >
      {children}
    </Component>
  )
}
