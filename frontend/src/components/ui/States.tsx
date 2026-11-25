/** États communs : chargement (squelettes), vide, erreur, hors connexion. */
import { RefreshCw, WifiOff } from 'lucide-react';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-card bg-argile ${className}`} />;
}

export function LoadingList({ count = 3, className = 'h-28' }: { count?: number; className?: string }) {
  return (
    <div role="status" aria-label="Chargement" className="flex flex-col gap-3.5">
      {Array.from({ length: count }, (_, i) => <Skeleton key={i} className={className} />)}
    </div>
  );
}

interface EmptyProps {
  title: string;
  text?: string;
  action?: React.ReactNode;
  illustration?: string;
}

export function EmptyState({ title, text, action, illustration = '/plats/ferme.svg' }: EmptyProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-trait bg-surface px-5 py-8 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={illustration} alt="" className="h-24 w-32 rounded-2xl object-cover" />
      <div className="text-base font-bold">{title}</div>
      {text && <p className="m-0 max-w-sm text-sm leading-relaxed text-ardoise">{text}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const offline = /connexion/i.test(message);
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-card border border-trait bg-surface px-5 py-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-piment-soft text-piment">
        {offline ? <WifiOff size={22} /> : <RefreshCw size={22} />}
      </span>
      <div className="text-base font-bold">{offline ? 'Tu es hors connexion' : 'Ça n’a pas marché'}</div>
      <p className="m-0 max-w-sm text-sm text-ardoise">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="min-h-11 rounded-btn bg-charbon px-5 text-sm font-bold text-white">
          Réessayer
        </button>
      )}
    </div>
  );
}
