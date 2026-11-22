'use client';

/** Publier / modifier un plat — écran 8 (et panneau « Modifier le plat » de VD3). Publié tout de suite. */
import { Camera, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { dishAction, errorMessage, getDishCategories, getMenu, isApiError, saveDish, type MenuDish } from '@/lib/api';
import { btn, PageHead, Panel } from '@/components/admin/AdminParts';
import { useApi } from '@/components/admin/useApi';
import { useToast } from '@/components/providers/ToastProvider';
import { Switch, TextField } from '@/components/ui/Fields';
import { DishImage } from '@/components/ui/DishImage';
import { ErrorState, LoadingList } from '@/components/ui/States';
import { MEAL_MOMENTS, MEAL_MOMENT_LABEL, type MealMoment } from '@/shared/enums';

function Form({ posId, back, dish, categories }: { posId: string; back: string; dish: MenuDish | null; categories: { id: string; name: string; illustrationKey: string | null }[] }) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState(dish?.name ?? '');
  const [price, setPrice] = useState(dish ? String(dish.priceXof) : '');
  const [moment, setMoment] = useState<MealMoment>(dish?.moment ?? 'LUNCH');
  const [categoryId, setCategoryId] = useState(dish?.categoryId ?? '');
  const [description, setDescription] = useState(dish?.description ?? '');
  const [special, setSpecial] = useState(dish?.isSpecial ?? false);
  const [available, setAvailable] = useState(!dish?.isSoldOut);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const key = categories.find((c) => c.id === categoryId)?.illustrationKey ?? dish?.illustrationKey;

  async function save() {
    setBusy(true);
    setErrors({});
    try {
      await saveDish(posId, dish?.id ?? null, { name, priceXof: Number(price.replace(/\s/g, '')), moment, categoryId: categoryId || null,
        description, isSpecial: special, available });
      toast(dish ? 'Plat enregistré' : 'Plat publié', 'success');
      router.push(back);
    } catch (e) {
      if (isApiError(e) && e.details) setErrors(e.details as Record<string, string>);
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHead title={dish ? 'Modifier le plat' : 'Nouveau plat'} sub="Les clients voient le changement tout de suite." />
      <Panel>
        <div className="flex items-center gap-4">
          <span className="block h-24 w-32 overflow-hidden rounded-2xl"><DishImage illustrationKey={key} alt="" /></span>
          <button type="button" className={btn.secondary} onClick={() => toast('L’envoi de photos arrive avec le branchement de l’API.')}>
            <Camera size={16} /> Changer la photo</button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Nom du plat" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} maxLength={60} />
          <TextField label="Prix (FCFA)" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} error={errors.priceXof} />
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-encre">Catégorie
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="min-h-[52px] rounded-[14px] border border-bordure-douce bg-white px-3 text-base font-normal">
              <option value="">Autre</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></label>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-encre">Moment
            <select value={moment} onChange={(e) => setMoment(e.target.value as MealMoment)} className="min-h-[52px] rounded-[14px] border border-bordure-douce bg-white px-3 text-base font-normal">
              {MEAL_MOMENTS.map((m) => <option key={m} value={m}>{MEAL_MOMENT_LABEL[m]}</option>)}
            </select></label>
        </div>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-encre">Description (facultative)
          <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 300))} rows={3}
            className="rounded-[14px] border border-bordure-douce p-3 text-base font-normal" placeholder="Ex. riz blanc, sauce arachide maison, poisson frit" /></label>
        <div className="flex flex-col divide-y divide-trait">
          <label className="flex min-h-12 items-center justify-between gap-3 text-[15px]">Plat du jour<Switch checked={special} onChange={setSpecial} label="Plat du jour" /></label>
          <label className="flex min-h-12 items-center justify-between gap-3 text-[15px]">Disponible maintenant<Switch checked={available} onChange={setAvailable} label="Disponible maintenant" /></label>
        </div>
      </Panel>
      <div className="flex flex-wrap justify-between gap-3">
        {dish ? (
          <button type="button" disabled={busy} className={`${btn.secondary} text-red-700`} onClick={async () => {
            await dishAction(posId, dish.id, 'delete').then(() => { toast('Plat supprimé', 'success'); router.push(back); }).catch((e) => toast(errorMessage(e), 'error'));
          }}><Trash2 size={16} /> Supprimer</button>
        ) : <span />}
        <button type="button" disabled={busy} onClick={save} className={`${btn.primary} min-w-40`}>{busy ? 'Enregistrement…' : dish ? 'Enregistrer' : 'Publier le plat'}</button>
      </div>
    </>
  );
}

export function DishFormScreen({ posId, dishId, back = `/seller/points/${posId}/menu` }: { posId: string; dishId: string | null; back?: string }) {
  const menu = useApi(() => getMenu(posId), [posId]);
  const cats = useApi(getDishCategories, []);
  if (menu.error) return <ErrorState message={menu.error} onRetry={menu.reload} />;
  if (menu.loading || cats.loading) return <LoadingList count={2} className="h-40" />;
  const dish = dishId ? menu.data?.find((d) => d.id === dishId) ?? null : null;
  if (dishId && !dish) return <ErrorState message="Ce plat n’existe plus." />;
  return <Form posId={posId} back={back} dish={dish} categories={cats.data ?? []} />;
}
