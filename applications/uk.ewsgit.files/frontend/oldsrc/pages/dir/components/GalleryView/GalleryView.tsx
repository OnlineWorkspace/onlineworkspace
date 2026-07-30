import {
  type Component,
  createSignal,
  For,
  onCleanup,
  onMount,
  useContext,
} from "solid-js";
import styles from "./GalleryView.module.scss";
import UKButtonGroup from "@ewsgit/uikit-solid/src/components/buttonGroup/UKButtonGroup.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import CHEVRON_FORWARD_ICON from "@material-symbols/svg-700/outlined/chevron_forward.svg";
import EXPAND_CONTENT_ICON from "@material-symbols/svg-700/outlined/expand_content.svg";
import COLLAPSE_CONTENT_ICON from "@material-symbols/svg-700/outlined/collapse_content.svg";
import CHEVRON_BACKWARD_ICON from "@material-symbols/svg-700/outlined/chevron_backward.svg";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { ViewContext } from "../../viewContext.ts";
import { AppContext } from "../../../../appContext.ts";
import path from "path-browserify";

const GalleryView: Component = () => {
  const [targetPosition, setTargetPosition] = createSignal(0);
  const [renderedPosition, setRenderedPosition] = createSignal(0);
  const [expanded, setExpanded] = createSignal(false);
  const appContext = useContext(AppContext);
  const viewContext = useContext(ViewContext);

  let containerRef: HTMLDivElement;
  let isDragging = false;
  let startX = 0;
  let startPos = 0;
  let animationFrameId: number;

  const next = () => setTargetPosition((p) => Math.round(p + 1));
  const prev = () => setTargetPosition((p) => Math.round(p - 1));

  const handleCardClick = (idx: number, e: MouseEvent) => {
    //@ts-ignore
    if (e.target.closest("button")) return;
    const curTarget = targetPosition();
    const count = appContext!.viewState[viewContext!.viewId].viewItems.length;
    const currentWrapped = ((curTarget % count) + count) % count;

    let diff = idx - currentWrapped;
    diff = ((diff + count / 2) % count + count) % count - count / 2;
    setTargetPosition(curTarget + diff);
  };

  const handlePointerDown = (e: PointerEvent) => {
    //@ts-ignore
    if (e.target.closest("button")) return;
    isDragging = true;
    startX = e.clientX;
    startPos = targetPosition();
    containerRef!.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const deltaX = startX - e.clientX;
    setTargetPosition(startPos + deltaX * 0.006);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    isDragging = false;
    setTargetPosition((p) => Math.round(p));
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      next();
    } else if (e.deltaY < 0) {
      prev();
    }
  };

  onMount(() => {
    const updateLoop = () => {
      const target = targetPosition();
      const current = renderedPosition();
      const nextPos = current + (target - current) * 0.10;
      setRenderedPosition(nextPos);
      animationFrameId = requestAnimationFrame(updateLoop);
    };
    animationFrameId = requestAnimationFrame(updateLoop);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") prev();
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") next();
    };

    window.addEventListener("keydown", handleKeyDown);
    containerRef!.addEventListener("wheel", handleWheel, { passive: false });

    onCleanup(() => {
      cancelAnimationFrame(animationFrameId as number);
      window.removeEventListener("keydown", handleKeyDown);
    });
  });

  const getBoxStyles = (index: number) => {
    const count = appContext!.viewState[viewContext!.viewId].viewItems.length;
    const currentPos = renderedPosition();
    const diff = index - currentPos;

    const wrappedDiff = ((diff + count / 2) % count + count) % count -
      count / 2;
    const absDiff = Math.abs(wrappedDiff);

    const xOffset = wrappedDiff * 75;
    const rotateY = Math.max(-50, Math.min(50, -wrappedDiff * 35));
    const zTranslate = wrappedDiff === 0
      ? 100
      : Math.max(0, 100 - absDiff * 60);

    const scale = wrappedDiff === 0
      ? 1.0
      : Math.max(0.4, 1.0 - absDiff * 0.25);
    const opacity = Math.max(0, 1 - absDiff * 0.35);
    const zIndex = Math.round((count - absDiff) * 10);

    return {
      transform:
        `translate3d(-50%, -50%, ${zTranslate}px) translateX(${xOffset}%) rotateY(${rotateY}deg) scale(${scale})`,
      "z-index": zIndex,
      opacity: opacity,
    };
  };

  return (
    <div class={styles.view}>
      <div
        ref={containerRef!}
        class={styles.boxes}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <For each={appContext?.viewState[viewContext!.viewId].viewItems}>
          {(cover, index) => {
            return (
              <>
              {/** biome-ignore lint/a11y/noStaticElementInteractions: yeah */}
              {/** biome-ignore lint/a11y/useKeyWithClickEvents: yeah */}
              <div
                class={styles.box}
                style={{
                  ...getBoxStyles(index()),
                  "--src": `url(${cover.thumbnail})`,
                }}
                onClick={(e) => handleCardClick(index(), e)}
              >
                <UKText size="m" role="label" class={styles.label}>
                  {path.basename(cover.path)}
                </UKText>
                <img
                  src={cover.thumbnail}
                  alt={""}
                  draggable="false"
                />
              </div>
              </>
            );
          }}
        </For>
      </div>
      <UKButtonGroup size="l" class={styles.controls} connected>
        <UKIconButton
          size={"l"}
          width="wide"
          icon={CHEVRON_BACKWARD_ICON}
          alt="Back"
          onClick={prev}
          color="tonal"
        />
        <UKIconButton
          size={"l"}
          width="default"
          icon={!expanded() ? EXPAND_CONTENT_ICON : COLLAPSE_CONTENT_ICON}
          alt={!expanded() ? "Expand" : "Collapse"}
          onClick={() => {setExpanded(exp => !exp)}}
        />
        <UKIconButton
          size={"l"}
          width="wide"
          icon={CHEVRON_FORWARD_ICON}
          alt="Forward"
          onClick={next}
          color="tonal"
        />
      </UKButtonGroup>
    </div>
  );
};

export default GalleryView;
