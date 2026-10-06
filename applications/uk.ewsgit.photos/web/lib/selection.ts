import { createSignal } from "solid-js";

/** The photos the user has picked on a page. Picking anything switches the page into selection mode. */
export function createSelection() {
  const [selected, setSelected] = createSignal<ReadonlySet<number>>(new Set<number>());

  return {
    selected,
    active: () => selected().size > 0,
    count: () => selected().size,
    has: (id: number) => selected().has(id),
    ids: () => [...selected()],
    toggle(id: number) {
      setSelected((current) => {
        const next = new Set<number>(current);
        if (!next.delete(id)) next.add(id);
        return next;
      });
    },
    set(ids: number[]) {
      setSelected(new Set<number>(ids));
    },
    clear() {
      setSelected(new Set<number>());
    },
  };
}

export type Selection = ReturnType<typeof createSelection>;
