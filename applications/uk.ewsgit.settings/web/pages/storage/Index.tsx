import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import CONTENT_COPY_ICON from "@material-symbols/svg-700/outlined/content_copy.svg";
import AUTO_DELETE_ICON from "@material-symbols/svg-700/outlined/auto_delete.svg";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import { useNavigate } from "@solidjs/router";
import { type Component, createResource, type ParentProps } from "solid-js";
import baseSettingsPageStyles from "../../BaseSettingsPage.module.scss";
import trpc from "../../lib/trpc.js";
import CleanupCard from "./components/CleanupCard/CleanupCard";
import UsageGraph from "./components/UsageGraph/UsageGraph";
import styles from "./Index.module.scss";

const Section: Component<ParentProps<{ title: string }>> = (props) => (
  <section class={styles.section}>
    <UKText role="title" size="m" emphasized align="start" class={styles.sectionHeading}>
      {props.title}
    </UKText>
    {props.children}
  </section>
);

const StoragePage: Component = () => {
  const navigate = useNavigate();
  const [duplicateFiles] = createResource(() => trpc.storage.getDuplicateFiles.query(), { initialValue: [] });
  const [temporaryFiles] = createResource(() => trpc.storage.getTemporaryFiles.query(), { initialValue: [] });

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
      <div class={baseSettingsPageStyles.baseSettingsPageContent}>
        <div class={styles.page}>
          <Section title="Usage">
            <UsageGraph />
          </Section>
          <Section title="Cleanup">
            <CleanupCard
              title="Duplicate files"
              icon={CONTENT_COPY_ICON}
              emptyMessage="No duplicate files to delete"
              items={duplicateFiles().map((file) => ({ label: file.name, detail: file.path }))}
            />
            <CleanupCard
              title="Temporary files"
              icon={AUTO_DELETE_ICON}
              emptyMessage="No temporary files to delete"
              items={temporaryFiles().map((file) => ({ label: file.name, detail: file.path }))}
            />
          </Section>
        </div>
      </div>
    </>
  );
};

export default StoragePage;
