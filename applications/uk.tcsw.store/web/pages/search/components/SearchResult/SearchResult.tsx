import UKCard from "@tcsw/uikit-solid/src/components/card/UKCard.jsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import { createResource, type Component } from "solid-js";
import styles from "./SearchResult.module.scss";
import { useNavigate } from "@solidjs/router";
import trpc from "../../../../lib/trpc";

const SearchResult: Component<{ applicationId: string; repository: string }> = (props) => {
    const [result] = createResource(() =>
        trpc.search.getResult.query({ applicationId: props.applicationId, repository: props.repository }),
    );
    const navigate = useNavigate();

    return (
        <UKCard
            onClick={() => {
                navigate(`/app/uk.tcsw.store/app/${props.repository}/${props.applicationId}`);
            }}
            color={"filled"}
            class={styles.root}
        >
            <img
                class={styles.headerImage}
                draggable={false}
                src={result()?.bannerImage || "/assets/generic_background.png"}
            />
            <UKText class={styles.title} role={"title"} size={"l"}>
                {result()?.displayName}
            </UKText>
            <div class={styles.footer}>
                <UKText role={"label"} size={"m"}>
                    {result()?.authors.join(" & ")}
                </UKText>
                {/*{result()?.downloadCount && (
                    <>
                        <UKIcon class={styles.footerIcon}>download</UKIcon>
                        <UKText role={"label"} size={"m"}>
                            {result()?.downloadCount}
                        </UKText>
                    </>
                )}*/}
            </div>
        </UKCard>
    );
};

export default SearchResult;
