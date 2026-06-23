import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { useNavigate } from "@solidjs/router";
import { type Component, createResource } from "solid-js";
import trpc from "../../../../lib/trpc";
import styles from "./PromotedApplication.module.scss";

const PromotedApplication: Component<{ repository: string; applicationId: string }> = (props) => {
  const [result] = createResource(() =>
    trpc.homepage.getPromotedApplication.query({
      applicationId: props.applicationId,
      repository: props.repository,
    }),
  );
  const navigate = useNavigate();

  return (
    <UKCard
      color="filled"
      class={styles.root}
      onClick={() => {
        navigate(`/app/uk.ewsgit.store/app/${props.repository}/${props.applicationId}`);
      }}
    >
      <img alt="" src={result()?.bannerImage || "/assets/generic_background.svg"} class={styles.backgroundImage} />
      <div class={styles.footer}>
        <UKText size="l" emphasized role="title">
          {result()?.displayName}
        </UKText>
        <UKText size="s" role="body">
          {(result()?.authors.join(" & ").length || 0) > 64 ? `${result()?.authors.join(" & ").slice(0, 64)} ...` : result()?.authors.join(" & ")}
        </UKText>
      </div>
    </UKCard>
  );
};

export default PromotedApplication;
