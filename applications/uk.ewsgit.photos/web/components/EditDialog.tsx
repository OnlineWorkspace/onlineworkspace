import FLIP_ICON from "@material-symbols/svg-700/outlined/flip.svg";
import ROTATE_LEFT_ICON from "@material-symbols/svg-700/outlined/rotate_left.svg";
import ROTATE_RIGHT_ICON from "@material-symbols/svg-700/outlined/rotate_right.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Component, createSignal } from "solid-js";
import { errorMessage, fileUrl } from "../lib/media";
import trpc from "../lib/trpc";
import type { MediaItem } from "../lib/types";
import styles from "./EditDialog.module.scss";

type Quarter = 0 | 1 | 2 | 3;

/** Rotate and mirror a photo. The preview is only a transform, nothing is written until it is saved. */
const EditDialog: Component<{
  item: MediaItem;
  onClose: () => void;
  onSaved: (message: string, saved: MediaItem, mode: "copy" | "replace") => void;
  onError: (message: string) => void;
}> = (props) => {
  const [quarter, setQuarter] = createSignal<Quarter>(0);
  const [flipped, setFlipped] = createSignal(false);
  const [saving, setSaving] = createSignal(false);

  const changed = () => quarter() !== 0 || flipped();

  const rotate = (direction: 1 | -1) => setQuarter((current) => ((current + direction + 4) % 4) as Quarter);

  const save = async (mode: "copy" | "replace") => {
    if (!changed() || saving()) return;

    setSaving(true);

    try {
      const saved = await trpc.media.edit.mutate({ id: props.item.id, rotate: (quarter() * 90) as 0 | 90 | 180 | 270, flip: flipped(), mode });
      props.onSaved(mode === "copy" ? "Saved a copy" : "Saved your changes", saved, mode);
    } catch (error) {
      props.onError(errorMessage(error));
      setSaving(false);
    }
  };

  return (
    <div class={styles.root}>
      <UKText role="title" size="l">
        Edit
      </UKText>

      <div class={styles.stage}>
        <img
          class={styles.image}
          src={fileUrl(props.item.id, props.item.version)}
          alt=""
          draggable={false}
          // the mirror is applied to the rotated image, which is the order the server applies them in
          style={{ transform: `${flipped() ? "scaleX(-1) " : ""}rotate(${quarter() * 90}deg)` }}
        />
      </div>

      <div class={styles.tools}>
        <UKIconButton color="tonal" icon={ROTATE_LEFT_ICON} alt="Rotate left" onClick={() => rotate(-1)} />
        <UKIconButton color="tonal" icon={ROTATE_RIGHT_ICON} alt="Rotate right" onClick={() => rotate(1)} />
        <UKIconButton color="tonal" icon={FLIP_ICON} alt="Flip horizontally" onClick={() => setFlipped((current) => !current)} />
      </div>

      <UKText role="body" size="m" class={styles.hint}>
        “Save” replaces the original file. “Save as copy” keeps the original and adds the edited photo next to it.
      </UKText>

      <div class={styles.buttons}>
        <UKButton color="standard" onClick={props.onClose}>
          Cancel
        </UKButton>
        <UKButton color="tonal" disabled={!changed() || saving()} onClick={() => void save("copy")}>
          Save as copy
        </UKButton>
        <UKButton color="filled" disabled={!changed() || saving()} onClick={() => void save("replace")}>
          Save
        </UKButton>
      </div>
    </div>
  );
};

export default EditDialog;
