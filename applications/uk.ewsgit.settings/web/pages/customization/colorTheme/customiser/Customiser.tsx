import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import CHECK_ICON from "@material-symbols/svg-700/outlined/check.svg";
import DELETE_ICON from "@material-symbols/svg-700/outlined/delete.svg";
import SAVE_ICON from "@material-symbols/svg-700/outlined/save.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import { useColorMode } from "@onlineworkspace/workspace-web/src/lib/colorMode.ts";
import { useNavigate } from "@solidjs/router";
import { type Component, createMemo, createResource, createSignal, For, Show } from "solid-js";
import trpc from "../../../../lib/trpc.ts";
import ThemeMock from "../components/ThemeMock/ThemeMock.tsx";
import { adviseContrast, contrastRatio, formatRgb, hexToRgb, parseRgb, rgbToHex } from "../contrast.ts";
import { argbFromHex, type Scheme, schemeFromArgb } from "../lib.ts";
import styles from "./Customiser.module.scss";

type Mode = "lightMode" | "darkMode";

const ROLE_GROUPS: { title: string; roles: string[] }[] = [
  { title: "Primary", roles: ["primary", "on-primary", "primary-container", "on-primary-container", "inverse-primary"] },
  { title: "Secondary", roles: ["secondary", "on-secondary", "secondary-container", "on-secondary-container"] },
  { title: "Tertiary", roles: ["tertiary", "on-tertiary", "tertiary-container", "on-tertiary-container"] },
  { title: "Error", roles: ["error", "on-error", "error-container", "on-error-container"] },
  {
    title: "Surfaces",
    roles: ["background", "on-background", "surface", "on-surface", "surface-variant", "on-surface-variant", "surface-container-lowest", "surface-container-low", "surface-container", "surface-container-high", "surface-container-highest"],
  },
  { title: "Outline & inverse", roles: ["outline", "outline-variant", "inverse-surface", "inverse-on-surface", "shadow", "scrim"] },
];

const roleLabel = (role: string) => role.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

const Customiser: Component = () => {
  const navigate = useNavigate();
  const { isLight: systemIsLight } = useColorMode();
  const [mode, setMode] = createSignal<Mode>(systemIsLight() ? "lightMode" : "darkMode");
  const [scheme, setScheme] = createSignal<Scheme | undefined>(undefined);
  const [name, setName] = createSignal("");
  const [lastEdited, setLastEdited] = createSignal<string | undefined>(undefined);
  const [status, setStatus] = createSignal<string | undefined>(undefined);
  const [saved, { refetch: refetchSaved }] = createResource(() => trpc.customization.colorTheme.listSaved.query());

  // start from the theme that is currently applied; fall back to the baseline Material scheme when none is set
  createResource(async () => {
    const current = (await trpc.customization.colorTheme.getCurrent.query()) as Scheme | null;
    setScheme(current?.darkMode && current?.lightMode ? current : schemeFromArgb(argbFromHex("#6750a4")));
    setName(current ? "My theme" : "My default copy");
  });

  const colors = createMemo(() => scheme()?.[mode()] ?? {});
  const advice = createMemo(() => adviseContrast(colors(), lastEdited()));

  const setRole = (role: string, rgb: string, remember = true) => {
    setScheme((s) => (s ? { ...s, [mode()]: { ...s[mode()], [role]: rgb } } : s));
    if (remember) setLastEdited(role);
  };

  const ratioFor = (role: string) => {
    const pair = advice().failing.find((f) => f.pair.fg === role || f.pair.bg === role);
    return pair;
  };

  async function save(apply: boolean) {
    const s = scheme();
    if (!s || !name().trim()) return;
    setStatus("Saving…");
    await trpc.customization.colorTheme.saveTheme.mutate({ name: name().trim(), scheme: s });
    if (apply) {
      await trpc.customization.colorTheme.setColorTheme.mutate(s);
      window.location.reload();
      return;
    }
    setStatus(`Saved “${name().trim()}”`);
    refetchSaved();
  }

  return (
    <>
      <UKTopAppBar
        type={"small"}
        headline={"Customise Color Theme"}
        leadingButton={{
          accessibleLabel: "Back",
          icon: CHEVRON_LEFT_ICON,
          onClick() {
            navigate("/app/uk.ewsgit.settings/customization/color-theme");
          },
        }}
      />
      <Show when={scheme()} fallback={<div class={styles.page}>Loading…</div>}>
        <div class={styles.page}>
          <section class={styles.header}>
            <ThemeMock class={styles.mock} colors={colors()} />
            <div class={styles.headerInfo}>
              <label class={styles.field}>
                <UKText role="label" size="m">
                  Theme name
                </UKText>
                <input class={styles.textInput} value={name()} maxLength={40} onInput={(e) => setName(e.currentTarget.value)} />
              </label>
              <div class={styles.modeRow}>
                <UKButton color={mode() === "lightMode" ? "filled" : "tonal"} onClick={() => void setMode("lightMode")}>
                  Light
                </UKButton>
                <UKButton color={mode() === "darkMode" ? "filled" : "tonal"} onClick={() => void setMode("darkMode")}>
                  Dark
                </UKButton>
              </div>
              <div class={styles.modeRow}>
                <UKButton color="tonal" leadingIcon={SAVE_ICON} disabled={!name().trim()} onClick={() => save(false)}>
                  Save copy
                </UKButton>
                <UKButton color="filled" leadingIcon={CHECK_ICON} disabled={!name().trim()} onClick={() => save(true)}>
                  Save &amp; apply
                </UKButton>
              </div>
              <Show when={status()}>
                <UKText role="body" size="s" class={styles.muted}>
                  {status()}
                </UKText>
              </Show>
            </div>
          </section>

          <section class={styles.advisor} data-ok={advice().failing.length === 0}>
            <UKText role="title" size="m">
              Contrast advisor
            </UKText>
            <Show
              when={advice().failing.length > 0}
              fallback={
                <UKText role="body" size="m" class={styles.muted}>
                  All {mode() === "lightMode" ? "light" : "dark"} mode color pairs have readable contrast.
                </UKText>
              }
            >
              <UKText role="body" size="m" class={styles.muted}>
                {advice().failing.length} pair{advice().failing.length === 1 ? "" : "s"} below the recommended contrast. Nothing changes unless you accept a suggestion.
              </UKText>
              <For each={advice().suggestions}>
                {(s) => (
                  <div class={styles.suggestion}>
                    <div class={styles.suggestionText}>
                      <UKText role="label" size="l">
                        {s.pair.label} — {s.ratio.toFixed(1)}:1 (needs {s.pair.min}:1)
                      </UKText>
                      <UKText role="body" size="s" class={styles.muted}>
                        Change “{roleLabel(s.role)}” from {rgbToHex(s.from)} to {rgbToHex(s.to)} for {s.newRatio.toFixed(1)}:1
                      </UKText>
                    </div>
                    <span class={styles.swatchPair}>
                      <span style={{ background: rgbToHex(s.from) }} />
                      <span style={{ background: rgbToHex(s.to) }} />
                    </span>
                    <UKButton size="s" color="tonal" onClick={() => setRole(s.role, formatRgb(s.to), false)}>
                      Apply
                    </UKButton>
                  </div>
                )}
              </For>
              <Show when={advice().suggestions.length > 1}>
                <UKButton
                  color="filled"
                  onClick={() => {
                    // apply sequentially: later suggestions were computed against the same starting colors, so only take one per role
                    const seen = new Set<string>();
                    for (const s of advice().suggestions) {
                      if (seen.has(s.role)) continue;
                      seen.add(s.role);
                      setRole(s.role, formatRgb(s.to), false);
                    }
                  }}
                >
                  Apply all suggestions
                </UKButton>
              </Show>
            </Show>
          </section>

          <For each={ROLE_GROUPS}>
            {(group) => (
              <section class={styles.group}>
                <UKText role="title" size="m">
                  {group.title}
                </UKText>
                <div class={styles.roles}>
                  <For each={group.roles.filter((r) => colors()[r] !== undefined)}>
                    {(role) => {
                      const rgb = () => parseRgb(colors()[role]);
                      const issue = () => ratioFor(role);
                      return (
                        <label class={styles.role} data-warn={issue() !== undefined}>
                          <input type="color" class={styles.picker} value={rgbToHex(rgb())} onInput={(e) => setRole(role, formatRgb(hexToRgb(e.currentTarget.value)))} />
                          <span class={styles.roleText}>
                            <UKText role="label" size="l">
                              {roleLabel(role)}
                            </UKText>
                            <UKText role="body" size="s" class={styles.muted}>
                              {rgbToHex(rgb())}
                              <Show when={issue()}>
                                {" · "}
                                {(() => {
                                  const i = issue()!;
                                  const other = i.pair.fg === role ? i.pair.bg : i.pair.fg;
                                  return `${contrastRatio(rgb(), parseRgb(colors()[other])).toFixed(1)}:1 vs ${roleLabel(other).toLowerCase()}`;
                                })()}
                              </Show>
                            </UKText>
                          </span>
                        </label>
                      );
                    }}
                  </For>
                </div>
              </section>
            )}
          </For>

          <Show when={(saved() ?? []).length > 0}>
            <section class={styles.group}>
              <UKText role="title" size="m">
                Saved themes
              </UKText>
              <For each={saved()}>
                {(entry) => (
                  <div class={styles.savedRow}>
                    <UKText role="label" size="l">
                      {entry.name}
                    </UKText>
                    <span class={styles.grow} />
                    <UKButton
                      size="s"
                      color="tonal"
                      onClick={() => {
                        setScheme(entry.scheme as Scheme);
                        setName(`${entry.name} copy`);
                        setLastEdited(undefined);
                      }}
                    >
                      Edit a copy
                    </UKButton>
                    <UKButton
                      size="s"
                      color="standard"
                      leadingIcon={DELETE_ICON}
                      onClick={async () => {
                        await trpc.customization.colorTheme.deleteSaved.mutate({ id: entry.id });
                        refetchSaved();
                      }}
                    >
                      Delete
                    </UKButton>
                  </div>
                )}
              </For>
            </section>
          </Show>
        </div>
      </Show>
    </>
  );
};

export default Customiser;
