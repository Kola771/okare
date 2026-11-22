'use client';

/** Visuels du plat : photos réelles, sinon l'assiette dessinée. Points et compteur (mobile), vignettes (desktop). */
import { useState } from 'react';
import { DishImage } from '@/components/ui/DishImage';

interface Props {
  photos: string[];
  illustrationKey: string | null;
  name: string;
  variant: 'mobile' | 'desktop';
  overlay?: React.ReactNode;
}

export function DishGallery({ photos, illustrationKey, name, variant, overlay }: Props) {
  const images = photos.length ? photos : [null];
  const [index, setIndex] = useState(0);
  const current = images[index];

  if (variant === 'mobile') {
    return (
      <div className="relative h-[300px] shrink-0">
        <DishImage imageUrl={current} illustrationKey={illustrationKey} alt={name} priority />
        {overlay}
        {images.length > 1 && (
          <>
            <div className="absolute inset-x-0 bottom-3.5 flex justify-center gap-1.5">
              {images.map((_, i) => (
                <button key={i} type="button" aria-label={`Photo ${i + 1}`} onClick={() => setIndex(i)}
                  className={`h-[7px] rounded-full ${i === index ? 'w-[18px] bg-white' : 'w-[7px] bg-white/60'}`} />
              ))}
            </div>
            <span className="absolute bottom-3 right-3.5 rounded-full bg-charbon/60 px-2 py-1 text-xs font-semibold text-white">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>
    );
  }
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <div className="relative h-[420px] overflow-hidden rounded-[22px]">
        <DishImage imageUrl={current} illustrationKey={illustrationKey} alt={name} priority />
        {overlay}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2.5">
          {images.map((src, i) => (
            <button key={i} type="button" aria-label={`Photo ${i + 1}`} onClick={() => setIndex(i)}
              className={`block h-16 w-[84px] overflow-hidden rounded-xl ${i === index ? 'border-[3px] border-piment' : 'border border-trait'}`}>
              <DishImage imageUrl={src} illustrationKey={illustrationKey} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
