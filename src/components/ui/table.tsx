import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/cn";

/**
 * Table / TableRow — component set `TableRow` (12:219), 3 states.
 *
 * Spec medida: px 16 · py 12 · border-b 1px border-default
 *   default   bg background-primary
 *   hover     bg background-secondary
 *   selected  bg surface-hover
 *   col 1 Medium text-primary · demais Regular text-secondary
 *
 * `10 — DEV HANDOFF / Responsive Rules`: em tablet, "cards substituem linhas de
 * tabela". O wrapper rola horizontalmente para nunca empurrar o body da página.
 */

export function Table({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"table">) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn("w-full border-collapse text-body", className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHead({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"thead">) {
  return (
    <thead className={cn("text-left", className)} {...props}>
      {children}
    </thead>
  );
}

export function TableHeaderCell({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"th">) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-border-default px-4 py-3",
        "text-body-sm font-semibold text-text-secondary",
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export type TableRowProps = ComponentPropsWithoutRef<"tr"> & {
  selected?: boolean;
  /** Ativa o realce de hover. Use apenas quando a linha for de fato clicável. */
  interactive?: boolean;
};

export function TableRow({
  selected = false,
  interactive = false,
  className,
  children,
  ...props
}: TableRowProps) {
  return (
    <tr
      aria-selected={selected || undefined}
      className={cn(
        "duration-fast border-b border-border-default transition-colors ease-standard",
        selected ? "bg-surface-hover" : "bg-background-primary",
        interactive && !selected && "hover:bg-background-secondary",
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export type TableCellProps = ComponentPropsWithoutRef<"td"> & {
  /** A primeira coluna é Medium/text-primary; as demais Regular/text-secondary. */
  primary?: boolean;
};

export function TableCell({
  primary = false,
  className,
  children,
  ...props
}: TableCellProps) {
  return (
    <td
      className={cn(
        "px-4 py-3",
        primary ? "font-medium text-text-primary" : "text-text-secondary",
        className,
      )}
      {...props}
    >
      {children}
    </td>
  );
}
