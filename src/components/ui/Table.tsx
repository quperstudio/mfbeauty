import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface TableProps {
  children: ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: ReactNode;
}

interface TableBodyProps {
  children: ReactNode;
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

interface TableHeadProps {
  children: ReactNode;
  className?: string;
}

interface TableCellProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full', className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }: TableHeaderProps) {
  return (
    <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
      {children}
    </thead>
  );
}

export function TableBody({ children }: TableBodyProps) {
  return <tbody className="divide-y divide-gray-200 dark:divide-gray-700">{children}</tbody>;
}

export function TableRow({ children, className, onClick }: TableRowProps) {
  return (
    <tr
      className={cn(
        'transition-colors',
        onClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className }: TableHeadProps) {
  return (
    <th
      className={cn(
        'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
        className
      )}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className }: TableCellProps) {
  return (
    <td className={cn('px-6 py-4 text-sm text-gray-900 dark:text-gray-100', className)}>
      {children}
    </td>
  );
}
