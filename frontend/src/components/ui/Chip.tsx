/** Pastille cliquable (budget, filtres, moments). Variante `dark` = sélection en charbon (desktop D1). */
interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  variant?: 'piment' | 'dark';
  size?: 'md' | 'sm';
}

export function Chip({ active = false, variant = 'piment', size = 'md', className = '', children, ...rest }: Props) {
  const on = variant === 'dark' ? 'bg-charbon text-white border-charbon' : 'bg-piment text-white border-piment';
  const off = 'bg-surface text-charbon border-bordure-douce hover:border-ardoise';
  const h = size === 'sm' ? 'min-h-[38px] text-[13px]' : 'min-h-[40px] text-sm';
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 font-semibold transition-colors ${h} ${active ? on : off} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
