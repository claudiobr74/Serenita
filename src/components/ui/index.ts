/**
 * Barrel do design system.
 *
 * Todo primitivo é derivado do Figma. Os que têm component set em
 * `02 — COMPONENTS` seguem a spec medida; os demais vêm de instâncias
 * desenhadas nas telas de `06 — DESKTOP`, ou de consistência com o sistema
 * quando não há instância — em todos os casos rastreado em
 * docs/DESIGN_DECISIONS.md #6.
 */

export { AlertBanner, type AlertBannerProps } from "./alert-banner";
export { Avatar, type AvatarProps, initialsOf } from "./avatar";
export { Badge, type BadgeProps } from "./badge";
export { Button, type ButtonProps } from "./button";
export { Card, CardBody, type CardProps, CardTitle } from "./card";
export { Checkbox, type CheckboxProps } from "./checkbox";
export { EmptyState, type EmptyStateProps } from "./empty-state";
export { ErrorState, type ErrorStateProps } from "./error-state";
export { IconButton, type IconButtonProps } from "./icon-button";
export { Input, type InputProps } from "./input";
export { Modal, type ModalProps } from "./modal";
export {
  AIProcessing,
  AudioWaveform,
  MonoChip,
  SyncProcessing,
  TranscriptionProcessing,
} from "./processing-state";
export { Select, type SelectOption, type SelectProps } from "./select";
export { Sheet, type SheetProps } from "./sheet";
export {
  Skeleton,
  SkeletonList,
  SkeletonListItem,
  type SkeletonProps,
} from "./skeleton";
export { Switch, type SwitchProps } from "./switch";
export {
  Table,
  TableCell,
  type TableCellProps,
  TableHead,
  TableHeaderCell,
  TableRow,
  type TableRowProps,
} from "./table";
export {
  type TabItem,
  type TabLinkItem,
  TabLinks,
  TabPanel,
  Tabs,
} from "./tabs";
export { Tag, type TagProps } from "./tag";
export { Textarea, type TextareaProps } from "./textarea";
export { Toast, type ToastProps, ToastProvider, useToast } from "./toast";
export { Tooltip, type TooltipProps } from "./tooltip";
