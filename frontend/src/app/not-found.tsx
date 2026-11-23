import Link from 'next/link';
import { DishImage } from '@/components/ui/DishImage';
import { Logo } from '@/components/ui/Logo';

export default function NotFound() {
  return (
    <div className="bg-motif flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <Logo size={34} href={null} />

      {/* 404 avec les plats dans les z&eacute;ros */}
      <div className="mt-10 flex items-center gap-2 sm:gap-4">
        <span className="text-[80px] font-extrabold leading-none text-piment sm:text-[120px]">4</span>
        <div className="animate-float h-20 w-20 overflow-hidden rounded-full border-4 border-piment/20 shadow-lg sm:h-28 sm:w-28">
          <DishImage illustrationKey="riz" alt="" />
        </div>
        <span className="text-[80px] font-extrabold leading-none text-piment sm:text-[120px]">4</span>
      </div>

      <div className="mt-8 flex max-w-sm flex-col items-center gap-3 text-center">
        <h1 className="m-0 text-xl font-bold text-charbon sm:text-2xl">Ce plat s&apos;est envol&eacute;&nbsp;!</h1>
        <p className="m-0 text-sm leading-relaxed text-ardoise">
          La page que tu cherches n&apos;existe plus ou a chang&eacute; d&apos;adresse. Mais il y a plein d&apos;autres plats qui t&apos;attendent.
        </p>
        <Link href="/" className="mt-4 flex min-h-11 items-center rounded-btn bg-piment px-6 text-sm font-bold text-white no-underline hover:text-white">
          Voir les plats pr&egrave;s de moi
        </Link>
      </div>

      {/* Petits plats d&eacute;coratifs flottants */}
      <div className="pointer-events-none mt-10 flex items-end gap-5">
        <div className="animate-float-slow h-12 w-12 overflow-hidden rounded-full border-2 border-trait opacity-60 shadow sm:h-14 sm:w-14">
          <DishImage illustrationKey="pate" alt="" />
        </div>
        <div className="animate-float-delayed h-10 w-10 overflow-hidden rounded-full border-2 border-trait opacity-40 shadow sm:h-12 sm:w-12">
          <DishImage illustrationKey="atassi" alt="" />
        </div>
        <div className="animate-float h-9 w-9 overflow-hidden rounded-full border-2 border-trait opacity-30 shadow sm:h-10 sm:w-10">
          <DishImage illustrationKey="aloko" alt="" />
        </div>
      </div>
    </div>
  );
}
