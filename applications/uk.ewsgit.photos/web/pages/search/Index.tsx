import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { useNavigate } from "@solidjs/router";
import type { Component } from "solid-js";
import styles from "./Index.module.scss";

const SearchPage: Component = () => {
  const navigate = useNavigate();

  return (
    <>
      <section class={styles.content}>
        <div class={styles.category}>
          <UKCard class={styles.previewCollage}>
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop" alt="Person 1" />
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop" alt="Person 2" />
            <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop" alt="Person 3" />
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop" alt="Person 4" />
          </UKCard>
          <UKText role="label" size="m">
            People
          </UKText>
        </div>
        <div class={styles.category}>
          <UKCard class={styles.previewCollage}>
            <img src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=150&h=150&fit=crop" alt="Album 1" />
            <img src="https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=150&h=150&fit=crop" alt="Album 2" />
            <img src="https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=150&h=150&fit=crop" alt="Album 3" />
            <img src="https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=150&h=150&fit=crop" alt="Album 4" />
          </UKCard>
          <UKText role="label" size="m">
            Albums
          </UKText>
        </div>
      </section>
    </>
  );
};

export default SearchPage;
