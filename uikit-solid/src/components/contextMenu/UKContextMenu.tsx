import { Ref } from "@solid-primitives/refs";
import { type Component, createEffect, createSignal, type ParentProps } from "solid-js";
import type UKMenu from "../menu/UKMenu.tsx";

const UKContextMenu: Component<
  ParentProps<{
    menu: typeof UKMenu;
  }>
> = (props) => {
  const [ref, setRef] = createSignal<Element | undefined>();
  const [showMenu, setShowMenu] = createSignal<{ x: number; y: number } | false>(false);

  createEffect(() => {
    const element = ref();

    if (!element) return;

    element.addEventListener("contextmenu", (e) => {
      e.preventDefault();

      if (e.target === element)
        setShowMenu({
          x: (e as unknown as MouseEvent).clientX,
          y: (e as unknown as MouseEvent).clientY,
        });
    });
  });

  return (
    <>
      <Ref ref={setRef}>{props.children || <div>no menu children provided?</div>}</Ref>
      {showMenu() && props.menu}
    </>
  );
};

export default UKContextMenu;
