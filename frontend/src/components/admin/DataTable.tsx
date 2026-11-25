'use client';

/** Tableau filtrable du dashboard : en-têtes, lignes, état vide, pagination ; défile horizontalement sur petit écran. */
import { Pager, usePaged } from './Pager';

export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T extends { id: string }>({ columns, rows, empty = 'Aucun élément.', onRow, bare = false, paged = true }: {
  columns: Column<T>[]; rows: T[]; empty?: string; onRow?: (row: T) => void;
  /** Dans une carte (Card flush) : sans cadre. */
  bare?: boolean;
  /** false : la page découpe elle-même la liste (ex. tableau desktop + cartes mobile). */
  paged?: boolean;
}) {
  const { items, pager } = usePaged(rows);
  const shown = paged ? items : rows;
  return (
    <div className={bare ? '' : 'overflow-hidden rounded-2xl border border-trait bg-surface'}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-left text-sm">
          <thead>
            <tr className="bg-surface-inset text-xs text-ardoise">
              {columns.map((c) => <th key={c.key} className={`px-4 py-3 font-semibold ${c.className ?? ''}`}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {shown.length ? shown.map((r) => (
              <tr key={r.id} onClick={onRow ? () => onRow(r) : undefined} className={`border-t border-trait ${onRow ? 'cursor-pointer hover:bg-surface-inset' : ''}`}>
                {columns.map((c) => <td key={c.key} className={`whitespace-nowrap px-4 py-3 align-middle ${c.className ?? ''}`}>{c.render(r)}</td>)}
              </tr>
            )) : (
              <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-ardoise">{empty}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {paged && <Pager {...pager} />}
    </div>
  );
}

/** Pastilles de filtre au-dessus d'un tableau (« Tous (212) », « En attente (6) »…). */
export function FilterChips<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
      {options.map(([k, label]) => (
        <button key={k} type="button" aria-pressed={value === k} onClick={() => onChange(k)}
          className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-bold ${value === k ? 'bg-charbon text-white' : 'border border-trait bg-surface text-charbon'}`}>{label}</button>
      ))}
    </div>
  );
}
