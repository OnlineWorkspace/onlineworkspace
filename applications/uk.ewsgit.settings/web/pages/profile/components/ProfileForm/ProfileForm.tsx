import FEMALE_ICON from "@material-symbols/svg-700/outlined/female.svg";
import MALE_ICON from "@material-symbols/svg-700/outlined/male.svg";
import TRANSGENDER_ICON from "@material-symbols/svg-700/outlined/transgender.svg";
import UKButton, { AffirmativeButtonState } from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import { type Component, createEffect, createSignal, For, type ParentProps, Show } from "solid-js";
import trpc from "../../../../lib/trpc";
import styles from "./ProfileForm.module.scss";

const GENDERS = [
  { id: "female", icon: FEMALE_ICON, label: "Female" },
  { id: "male", icon: MALE_ICON, label: "Male" },
  { id: "other", icon: TRANSGENDER_ICON, label: "Other" },
];

type Values = { displayName: string; username: string; gender: string; pronouns: string; bio: string };

const PRONOUN_OPTIONS = [
  { id: "he/him", parts: ["he", "him"] },
  { id: "she/her", parts: ["she", "her"] },
  { id: "they/them", parts: ["they", "them"] },
  { id: "it/its", parts: ["it", "its"] },
  { id: "any", parts: ["any"] },
];

const Group: Component<ParentProps<{ title: string; description: string }>> = (props) => (
  <UKCard class={styles.group}>
    <div class={styles.groupHeader}>
      <UKText role="title" size="m" emphasized align="start" class={styles.groupTitle}>
        {props.title}
      </UKText>
      <UKText role="body" size="s" align="start" class={styles.groupDescription}>
        {props.description}
      </UKText>
    </div>
    {props.children}
  </UKCard>
);

/** every editable field of the profile, saved together from one bar that only shows when something changed */
const ProfileForm: Component<{ initial: Values; onSaved(values: Values): void; onChange?(values: Values): void }> = (props) => {
  const [saved, setSaved] = createSignal<Values>(props.initial);
  const [values, setValues] = createSignal<Values>(props.initial);
  const [error, setError] = createSignal<string>();

  createEffect(() => props.onChange?.(values()));

  const set = <K extends keyof Values>(key: K) => (value: Values[K]) => setValues((v) => ({ ...v, [key]: value }));
  // pronouns are stored as a comma separated list, as more than one set can apply
  const selectedPronouns = () => values().pronouns.split(",").map((p) => p.trim()).filter(Boolean);
  const hasPronoun = (id: string) => selectedPronouns().includes(id);
  const togglePronoun = (id: string) =>
    set("pronouns")(
      (hasPronoun(id) ? selectedPronouns().filter((p) => p !== id) : [...selectedPronouns(), id])
        .sort((a, b) => PRONOUN_OPTIONS.findIndex((o) => o.id === a) - PRONOUN_OPTIONS.findIndex((o) => o.id === b))
        .join(", "),
    );
  const dirty = () => (Object.keys(values()) as (keyof Values)[]).some((key) => values()[key] !== saved()[key]);

  return (
    <div class={styles.form}>
      <Group title="Basic info" description="How you appear to other people on this workspace.">
        <div class={styles.row}>
          <UKTextField label="Display name" color="outlined" value={values().displayName} onValueChange={set("displayName")} />
          <UKTextField label="Username" color="outlined" value={values().username} onValueChange={set("username")} />
        </div>
      </Group>
      <Group title="Bio" description="Tell people a bit about yourself.">
        <UKTextField as="textarea" label="Bio" color="outlined" value={values().bio} onValueChange={set("bio")} />
      </Group>
      <Group title="Gender" description="Choose how you identify.">
        <div class={styles.genders} role="radiogroup" aria-label="Gender">
          <For each={GENDERS}>
            {(gender) => (
              <button
                type="button"
                role="radio"
                aria-checked={values().gender === gender.id}
                class={styles.gender}
                data-selected={values().gender === gender.id}
                onClick={() => set("gender")(gender.id)}
              >
                <UKIcon>{gender.icon}</UKIcon>
                <UKText role="label" size="l">
                  {gender.label}
                </UKText>
              </button>
            )}
          </For>
        </div>
        <Show when={values().gender === "other"}>
          <div class={styles.pronouns} role="group" aria-label="Pronouns">
            <For each={PRONOUN_OPTIONS}>
              {(option) => (
                <button type="button" class={styles.pronoun} aria-pressed={hasPronoun(option.id)} data-selected={hasPronoun(option.id)} onClick={() => togglePronoun(option.id)}>
                  <For each={option.parts}>
                    {(part) => (
                      <UKText role="label" size="l" class={styles.pronounPart}>
                        {part}
                      </UKText>
                    )}
                  </For>
                </button>
              )}
            </For>
          </div>
        </Show>
      </Group>
      <Show when={dirty() || error()}>
        <div class={styles.saveBar}>
          <UKText role="body" size="m" class={`${styles.message} ${error() ? styles.error : ""}`} align="start">
            {error() ?? "You have unsaved changes"}
          </UKText>
          <UKButton
            color="standard"
            onClick={() => {
              setValues(saved());
              setError(undefined);
            }}
          >
            Discard
          </UKButton>
          <UKButton
            affirmative
            onClick={async () => {
              setError(undefined);

              const next = { ...values(), displayName: values().displayName.trim() || "Untitled User", username: values().username.trim().toLowerCase(), pronouns: values().gender === "other" ? values().pronouns.trim() : "" };

              // only what changed is sent, and each field is saved on its own so one failing doesn't hide the others
              const previous = saved();
              const saves: { key: keyof Values; save: () => Promise<unknown> }[] = [
                { key: "displayName", save: () => trpc.profile.setName.mutate(next.displayName) },
                { key: "username", save: () => trpc.profile.setUsername.mutate(next.username) },
                { key: "gender", save: () => trpc.profile.setGender.mutate(next.gender || "other") },
                { key: "pronouns", save: () => trpc.profile.setPronouns.mutate(next.pronouns) },
                { key: "bio", save: () => trpc.profile.setBio.mutate(next.bio) },
              ];
              const changed = saves.filter(({ key }) => next[key] !== previous[key]);
              const results = await Promise.allSettled(changed.map(({ save }) => save()));

              const persisted = { ...previous };
              const failures: string[] = [];

              results.forEach((result, index) => {
                const key = changed[index].key;

                if (result.status === "fulfilled") {
                  (persisted as Record<string, string>)[key] = next[key];
                } else {
                  failures.push(`${key}: ${result.reason instanceof Error ? result.reason.message : "failed"}`);
                }
              });

              setSaved(persisted);
              setValues(next);
              props.onSaved(persisted);

              if (failures.length) {
                setError(`Couldn't save: ${failures.join("; ")}`);

                return { state: AffirmativeButtonState.Error };
              }

              return { state: AffirmativeButtonState.Success };
            }}
          >
            Save
          </UKButton>
        </div>
      </Show>
    </div>
  );
};

export type { Values as ProfileValues };
export default ProfileForm;
