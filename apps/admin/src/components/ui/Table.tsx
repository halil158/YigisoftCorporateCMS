import { ReactNode } from 'react'

interface TableProps {
  children: ReactNode
  className?: string
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${className}`}>
        {children}
      </table>
    </div>
  )
}

interface TableHeadProps {
  children: ReactNode
}

export function TableHead({ children }: TableHeadProps) {
  return (
    <thead className="bg-gray-50 dark:bg-slate-700/50">
      {children}
    </thead>
  )
}

interface TableBodyProps {
  children: ReactNode
}

export function TableBody({ children }: TableBodyProps) {
  return <tbody className="divide-y divide-gray-200 dark:divide-slate-700">{children}</tbody>
}

interface TableRowProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function TableRow({ children, className = '', onClick }: TableRowProps) {
  return (
    <tr
      className={`hover:bg-gray-50 dark:hover:bg-slate-700/30 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

interface TableHeaderProps {
  children: ReactNode
  className?: string
}

export function TableHeader({ children, className = '' }: TableHeaderProps) {
  return (
    <th className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  )
}

interface TableCellProps {
  children: ReactNode
  className?: string
}

export function TableCell({ children, className = '' }: TableCellProps) {
  return (
    <td className={`px-4 py-3 text-sm text-gray-700 dark:text-gray-300 ${className}`}>
      {children}
    </td>
  )
}
