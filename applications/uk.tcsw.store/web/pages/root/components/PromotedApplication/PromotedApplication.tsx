import UKCard from "@tcsw/uikit-solid/src/components/card/UKCard.jsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import { createResource, type Component } from "solid-js";
import styles from "./PromotedApplication.module.scss";
import trpc from "../../../../lib/trpc";
import { useNavigate } from "@solidjs/router";

const PromotedApplication: Component<{ repository: string; applicationId: string }> = (props) => {
    const [result] = createResource(() =>
        trpc.homepage.getPromotedApplication.query({ applicationId: props.applicationId, repository: props.repository }),
    );
    const navigate = useNavigate();

    return (
        <>
            <UKCard
                color="filled"
                class={styles.root}
                onClick={() => {
                    navigate(`/app/uk.tcsw.store/app/${props.repository}/${props.applicationId}`);
                }}
            >
                <img src={result()?.bannerImage || "/assets/tricolor/tricolor.svg"} class={styles.backgroundImage} />
                <div class={styles.footer}>
                    <UKText size="l" emphasized role="title">
                        {result()?.displayName}
                    </UKText>
                    <UKText size="s" role="body">
                        {(result()?.authors.join(" & ").length || 0) > 64
                            ? result()?.authors.join(" & ").slice(0, 64) + " ..."
                            : result()?.authors.join(" & ")}
                    </UKText>
                </div>
            </UKCard>
        </>
    );
};

export default PromotedApplication;
