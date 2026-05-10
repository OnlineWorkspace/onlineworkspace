import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import clsx from "clsx";
import { type Component, createSignal, onCleanup } from "solid-js";
import styles from "./NavigationRailClock.module.scss";

function padWith0(num: number) {
  return num.toString().padStart(2, "0");
}

const NavigationRailClock: Component<{ expanded: boolean }> = (props) => {
  const [currentDate, setCurrentDate] = createSignal(new Date());

  const timer = setInterval(() => setCurrentDate(new Date()), 10_000);
  onCleanup(() => clearInterval(timer));

  /* Add "st/nd/rd/th" suffix to a string */
  function addOrdinalSuffixToDay(day: number) {
    const j = day % 10;
    const k = day % 100;

    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";

    return "th";
  }

  const time = () => `${padWith0(currentDate().getHours())}:${padWith0(currentDate().getMinutes())}`;
  const date = () => {
    const d = currentDate();
    const weekday = d.toLocaleDateString(undefined, { weekday: "long" });
    const day = d.getDate();
    const month = d.toLocaleDateString(undefined, { month: "long" });
    const year = d.getFullYear();
    return `${weekday} ${day}${addOrdinalSuffixToDay(day)} ${month} ${year}`;
  };

  return (
    <div class={styles.root} data-expanded={props.expanded}>
      <UKText size="m" role="title" class={clsx(styles.content, styles.collapsed)}>
        {time()}
      </UKText>
      <UKText size="m" role="title" class={clsx(styles.content, styles.expanded)}>
        {date()}
      </UKText>
    </div>
  );
};

export default NavigationRailClock;
