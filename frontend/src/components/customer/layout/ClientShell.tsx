/**
 * Coquille de l'application client : fond à motifs, en-tête desktop, navigation basse mobile.
 * `bottomNav={false}` pour les pages de détail mobiles (plat, point de vente) qui ont leur propre barre d'action.
 */
import { BottomNav } from './BottomNav';
import { DesktopHeader } from './DesktopHeader';

export function ClientShell({ children, bottomNav = true }: { children: React.ReactNode; bottomNav?: boolean }) {
  return (
    <div className="bg-motif flex min-h-dvh flex-col">
      <DesktopHeader />
      <div className={`flex flex-1 flex-col ${bottomNav ? 'pb-[76px] lg:pb-0' : ''}`}>{children}</div>
      {bottomNav && <BottomNav />}
    </div>
  );
}
