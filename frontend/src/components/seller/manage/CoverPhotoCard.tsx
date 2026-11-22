'use client';

/**
 * « Photo de l'entrée » d'un point (Informations, côté vendeur et DB3) : ajouter, changer, retirer.
 * Envoyée par le vendeur : relue par l'équipe avant d'être visible ; par l'équipe : publiée tout de suite.
 */
import { addPosPhoto, errorMessage, getPosCover, removePosCover } from '@/lib/api';
import { Card } from '@/components/admin/Card';
import { useApi } from '@/components/admin/useApi';
import { useToast } from '@/components/providers/ToastProvider';
import { PhotoField } from '@/components/ui/PhotoField';

export function CoverPhotoCard({ posId, byTeam = false }: { posId: string; byTeam?: boolean }) {
  const toast = useToast();
  const cover = useApi(() => getPosCover(posId), [posId]);
  const change = async (dataUrl: string | null, name?: string) => {
    try {
      if (dataUrl) {
        const r = await addPosPhoto(posId, 'FACADE', dataUrl, name, byTeam);
        toast(r.review ? 'Photo envoyée : visible après relecture par l’équipe' : 'Photo de l’entrée enregistrée', 'success');
      } else {
        await removePosCover(posId);
        toast('Photo retirée', 'success');
      }
      await cover.reload();
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };
  return (
    <Card title="Photo de l’entrée">
      {cover.loading && !cover.data ? <div className="h-[120px] animate-pulse rounded-xl bg-argile" /> : (
        <PhotoField label="Photo de l’entrée" hint="Le client reconnaît ton point en arrivant. Prends-la depuis la rue, de jour."
          value={cover.data?.src ?? null} pending={cover.data?.pending} onChange={change} />
      )}
    </Card>
  );
}
