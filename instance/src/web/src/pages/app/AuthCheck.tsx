import UKButton from "@onlineworkspace/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@onlineworkspace/uikit-solid/src/components/card/UKCard.tsx";
import { DividerDirection } from "@onlineworkspace/uikit-solid/src/components/divider/lib/direction.ts";
import UKDivider from "@onlineworkspace/uikit-solid/src/components/divider/UKDivider.tsx";
import UKIndeterminateSpinner from "@onlineworkspace/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.tsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.tsx";
import { useNavigate } from "@solidjs/router";
import { type Component, createResource, type ParentProps } from "solid-js";
import trpc from "../../lib/trpc.ts";
import styles from "./AuthCheck.module.scss";

const AuthCheck: Component<ParentProps> = (props) => {
  const navigate = useNavigate();
  const [checkResult] = createResource(() => trpc.authorization.isAuthenticated.query());

  return (
    <>
      {checkResult() === undefined ? (
        <UKIndeterminateSpinner class={styles.spinner} />
      ) : !checkResult()?.authenticated ? (
        <UKCard color={"filled"} class={styles.root}>
          <UKText role={"title"} size={"l"} emphasized={true}>
            Unauthorized
          </UKText>
          <UKDivider direction={DividerDirection.horizontal} />
          <UKText role={"body"} size={"l"}>
            Please login before trying to access this page.
          </UKText>
          <UKButton
            class={styles.button}
            onClick={() => {
              navigate(`/?redirect=${window.location.pathname}`);
            }}
          >
            Login
          </UKButton>
        </UKCard>
      ) : (
        props.children
      )}
    </>
  );
};

export default AuthCheck;
