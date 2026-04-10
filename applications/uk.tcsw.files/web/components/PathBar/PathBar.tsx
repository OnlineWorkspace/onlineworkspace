import ARROW_UPWARD_ICON from "@material-symbols/svg-700/outlined/arrow_upward.svg";
import GRID_VIEW_ICON from "@material-symbols/svg-700/outlined/grid_view.svg";
import { useNavigate, useParams } from "@solidjs/router";
import UKIconButton from "@tcsw/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@tcsw/uikit-solid/src/components/textField/UKTextField.tsx";
import path from "path-browserify";
import { type Component, createSignal, For, useContext } from "solid-js";
import { ViewContext } from "../ViewContainer/ViewContext";
import styles from "./PathBar.module.scss";

const PathBar: Component = () => {
  const viewCtx = useContext(ViewContext);
  const navigate = useNavigate();
  const params = useParams<{ currentPath: string }>();
  const [showTextField, setShowTextField] = createSignal();

  return (
    <div class={styles.root}>
      <UKIconButton
        disabled={params.currentPath === undefined}
        onClick={() => {
          const split = `/${decodeURI(params.currentPath || "")}`.split("/");
          let output = "/";

          for (let i = 0; i < split.length - 1; i++) {
            console.log(split[i]);
            output = path.join(output, split[i]);
          }

          navigate(`/app/uk.tcsw.files/dir${output}`);
        }}
        size={"xs"}
        color={"standard"}
        alt={"go up one directory"}
        icon={ARROW_UPWARD_ICON}
        width="default"
      />
      <UKIconButton
        onClick={() => {
          viewCtx?.setViewType(viewCtx.viewType() === "grid" ? "list" : "grid");
        }}
        size={"xs"}
        color={"standard"}
        alt={"Change view"}
        icon={GRID_VIEW_ICON}
        width="default"
      />
      {showTextField() ? (
        <div class={styles.textField}>
          <UKTextField
            label={"Path"}
            defaultValue={`/${decodeURI(params.currentPath || "")}`}
            onValueChange={(val) => {
              if (val[0] === "/") navigate(`/app/uk.tcsw.files/dir${val}`);
            }}
            onBlur={() => setShowTextField(false)}
            onSubmit={() => setShowTextField(false)}
            color={"outlined"}
          />
        </div>
      ) : (
        <>
          <div class={styles.segmentContainer} onDblClick={() => setShowTextField(true)}>
            <For each={`/${decodeURI(params.currentPath || "")}`.split("/")}>
              {(segment, index) => {
                if (index() === `/${decodeURI(params.currentPath || "")}`.split("/").length - 1 && segment === "") return null;

                return (
                  <>
                    <UKText
                      onClick={(e) => {
                        e.stopPropagation();

                        const split = `/${decodeURI(params.currentPath || "")}`.split("/");
                        let output = "/";

                        for (let i = 0; i < index() + 1; i++) {
                          output = path.join(output, split[i]);
                        }

                        navigate(`/app/uk.tcsw.files/dir${output}`);
                      }}
                      class={styles.segment}
                      role={"label"}
                      size={"l"}
                    >
                      {segment !== "" ? <span>{segment}</span> : null}
                      {index() !== `/${decodeURI(params.currentPath || "")}`.split("/").length - 1 && <span class={styles.slash}>/</span>}
                    </UKText>
                  </>
                );
              }}
            </For>
          </div>
        </>
      )}
    </div>
  );
};

export default PathBar;
