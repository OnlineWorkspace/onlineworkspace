import { useNavigate } from "@solidjs/router";
import UKCard from "@tcsw/uikit-solid/src/components/card/UKCard.jsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import { type Component, createResource } from "solid-js";
import trpc from "../../../../lib/trpc";
import styles from "./SearchResult.module.scss";
import UKIcon from "@tcsw/uikit-solid/src/components/icon/UKIcon.jsx";

const SearchResult: Component<{ applicationId: string; repository: string }> = (props) => {
  const [result] = createResource(() => trpc.search.getResult.query({ applicationId: props.applicationId, repository: props.repository }));
  const navigate = useNavigate();

  return (
    <UKCard
      onClick={() => {
        navigate(`/app/uk.tcsw.store/app/${props.repository}/${props.applicationId}?origin=${window.location.pathname}`);
      }}
      color={"filled"}
      class={styles.root}
    >
      <img alt="" class={styles.headerImage} draggable={false} src={result()?.bannerImage || "/assets/placeholder/placeholder_image.svg"} />
      <div class={styles.middleSegment}>
        <div class={styles.iconContainer}>
          {result()?.icon.type === "icon" ? (
            <UKIcon class={styles.icon}>{result()?.icon.value || "/assets/tricolor/tricolor.svg"}</UKIcon>
          ) : (
            <img alt="" class={styles.icon} draggable={false} src={result()?.icon.value || "/assets/tricolor/tricolor.svg"} />
          )}
        </div>
        <UKText class={styles.title} role={"title"} size={"l"}>
          {result()?.displayName}
        </UKText>
        {result()?.isInstalled ? (
          <UKText class={styles.installedIndicator} role={"label"} size={"m"}>
            (Installed)
          </UKText>
        ) : null}
      </div>
      <div class={styles.footer}>
        <UKText role={"body"} size={"s"}>
          {result()?.description}
        </UKText>
        <UKText class={styles.authors} role={"label"} align="start" size={"m"}>
          Developer:{" "}
          {result()
            ?.authors.map((a) => a.name)
            .join(" & ")}
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
