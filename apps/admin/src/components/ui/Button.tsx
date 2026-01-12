import { ButtonHTMLAttributes, ReactNode, ElementType } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success'
type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
  as?: ElementType
}

const variantClasses: Record<ButtonVariant, string> = {
  // Primary: vibrant in light mode, darker muted green in dark mode
  primary: 'bg-primary-600 hover:bg-primary-700 text-white dark:bg-accent-dark dark:hover:bg-accent-dark-hover',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-gray-200',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
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
        ${Component === 'button' ? 'disabled:opacity-50 disabled:cursor-not-allowed' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
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
