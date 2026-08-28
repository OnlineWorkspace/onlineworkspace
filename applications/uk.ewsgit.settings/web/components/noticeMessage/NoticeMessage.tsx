import type {Component} from "solid-js";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.js";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.js";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.js";
import UKButtonGroup from "@ewsgit/uikit-solid/src/components/buttonGroup/UKButtonGroup.js";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.js";
import styles from "./NoticeMessage.module.scss";

const NoticeMessage: Component<{ title: string, body: string, actions: { icon?: string, label: string, cb: () => void }[] }> = (props) => {
  return <>
    <UKCard color="elevated" class={styles.root}>
      <UKText role={"title"} size={"l"}>
        {props.title}
      </UKText>
      <UKText role={"body"} size={"l"}>
        {props.body}
      </UKText>
      <UKButtonGroup align="end" size="s">
        {props.actions.map(action => {
          return <UKButton
            leadingIcon={action.icon}
            onClick={action.cb}
          >
            {action.label}
          </UKButton>
        })}
      </UKButtonGroup>
    </UKCard>
  </>
}

export default NoticeMessage;
