import CLOSE_ICON from "@material-symbols/svg-700/outlined/close.svg";
import UKCard from "@onlineworkspace/uikit-solid/src/components/card/UKCard.jsx";
import UKIconButton from "@onlineworkspace/uikit-solid/src/components/iconButton/UKIconButton.jsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.jsx";
import path from "path-browserify";
import {useContext, type Component} from "solid-js";
import styles from "./PreviewDialog.module.scss";
import {AppContext} from "../../../appContext";

const PreviewDialog: Component<{path: string}> = (props) => {
  const appContext = useContext(AppContext);

  return (
    <>
      <button type="button" class={styles.background} onClick={() => {
        appContext?.setGlobalState("showPreview", undefined)
      }} />
      <UKCard color="outlined" class={styles.component}>
        <div class={styles.header}>
          <UKIconButton
            size="xxs"
            color={"tonal"}
            alt={"Close Preview"}
            onClick={() => {
              appContext?.setGlobalState("showPreview", undefined)
            }}
            icon={CLOSE_ICON}
          />
          <UKText size="m" role="title" emphasized>
            Preview for {path.basename(props.path)}
          </UKText>
        </div>
        <div>
          Preview Content @ "{props.path}"
        </div>
      </UKCard>
    </>
  );
};

export default PreviewDialog;
