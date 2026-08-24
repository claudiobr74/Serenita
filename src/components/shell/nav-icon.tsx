import {
  BellIcon,
  BookOpenIcon,
  CalendarIcon,
  ChartLineIcon,
  CogIcon,
  CreditCardIcon,
  FileTextIcon,
  HomeIcon,
  type LucideIcon,
  MessageCircleIcon,
  SearchIcon,
  SparklesIcon,
  TriangleAlertIcon,
  UsersIcon,
} from "lucide-react";

/**
 * Os nomes das camadas de ícone no Figma correspondem 1:1 aos nomes do Lucide,
 * então o mapa é direto. Ver docs/FIGMA_AUDIT.md §2.7.
 */
const ICONS = {
  home: HomeIcon,
  calendar: CalendarIcon,
  users: UsersIcon,
  "message-circle": MessageCircleIcon,
  "triangle-alert": TriangleAlertIcon,
  "credit-card": CreditCardIcon,
  "book-open": BookOpenIcon,
  sparkles: SparklesIcon,
  "file-text": FileTextIcon,
  "chart-line": ChartLineIcon,
  cog: CogIcon,
  search: SearchIcon,
  bell: BellIcon,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export function NavIcon({
  name,
  size = 18,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Icon = ICONS[name as IconName];
  if (!Icon) return null;
  return (
    <Icon size={size} strokeWidth={1.75} className={className} aria-hidden />
  );
}
