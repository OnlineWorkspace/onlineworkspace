import { useNavigate } from "@solidjs/router";
import { type Component, Show } from "solid-js";
import backend from "../../../../../../lib/backend";
import styles from "./NavigationRailLogo.module.scss";

/**
 * the instance's square logo; it takes the free space above itself, so it and the applications button below stay at the bottom of the rail.
 * With a link it opens it when clicked: paths inside the workspace are navigated to, anything else opens in a new tab.
 */
const NavigationRailLogo: Component<{ source: string; link?: string | null }> = (props) => {
  const navigate = useNavigate();
  const image = () => <img class={styles.image} alt="" src={backend(props.source)} draggable={false} />;

  return (
    <Show when={props.link} fallback={<div class={styles.root}>{image()}</div>}>
      {(link) => (
        <Show
          when={link().startsWith("/")}
          fallback={
            <a class={styles.root} data-clickable="true" href={link()} target="_blank" rel="noopener noreferrer" aria-label="Open the logo link">
              {image()}
            </a>
          }
        >
          <button type="button" class={styles.root} data-clickable="true" aria-label="Open the logo link" onClick={() => navigate(link())}>
            {image()}
          </button>
        </Show>
      )}
    </Show>
  );
};

export default NavigationRailLogo;
