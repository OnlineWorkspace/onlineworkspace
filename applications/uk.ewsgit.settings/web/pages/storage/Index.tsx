import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import UKStackLabel from "@ewsgit/uikit-solid/src/components/stack/UKStackLabel.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import {useNavigate} from "@solidjs/router";
import {type Component, createResource} from "solid-js";
import DuplicateFiles from "./components/DuplicateFiles/DuplicateFiles";
import TemporaryFiles from "./components/TemporaryFiles/TemporaryFiles";
import UsageGraph from "./components/UsageGraph/UsageGraph";
import styles from "./Index.module.scss";
import trpc from "../../lib/trpc.js";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.js";

const StoragePage: Component = () => {
  const navigate = useNavigate();
  const [duplicateFiles] = createResource(() => trpc.storage.getDuplicateFiles.query(), {initialValue: []});
  const [temporaryFiles] = createResource(() => trpc.storage.getTemporaryFiles.query(), {initialValue: []});

  return (
    <>
      <UKTopAppBar
        type="small"
        headline={"Storage"}
        leadingButton={{
          icon: CHEVRON_LEFT_ICON,
          onClick() {
            navigate("/app/uk.ewsgit.settings");
          },
          accessibleLabel: "Go back",
        }}
      />
      <div class={styles.page}>
        <UsageGraph/>
        <UKText role={"title"} size={"l"} align={"start"} class={styles.header}>Cleanup Tasks</UKText>
        {
          (duplicateFiles()?.length > 0) ? <>
            <UKStackLabel>Duplicate Files</UKStackLabel>
            <DuplicateFiles/>
          </> : <>
            <UKText role={"title"} size={"m"} align={"start"} class={styles.header}>{"->"} No Duplicate Files to delete</UKText>
          </>
        }
        {
          (temporaryFiles()?.length > 0) ? <>
            <UKStackLabel>Temporary Files</UKStackLabel>
            <TemporaryFiles/>
          </> : <>
            <UKText role={"title"} size={"m"} align={"start"} class={styles.header}>{"->"} No Temporary Files to delete</UKText>
          </>
        }
      </div>
    </>
  );
};

export default StoragePage;
