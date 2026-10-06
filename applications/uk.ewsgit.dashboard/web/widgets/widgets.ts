import ACCOUNT_CIRCLE_ICON from "@material-symbols/svg-700/outlined/account_circle.svg";
import NOTIFICATIONS_ICON from "@material-symbols/svg-700/outlined/notifications.svg";
import PARTLY_CLOUDY_DAY_ICON from "@material-symbols/svg-700/outlined/partly_cloudy_day.svg";
import PERSON_ICON from "@material-symbols/svg-700/outlined/person.svg";
import { lazy } from "solid-js";

const Widgets = {
  "user.profile": lazy(() => import("./user/profile/Widget")),
  "user.avatar": lazy(() => import("./user/avatar/Widget")),
  notifications: lazy(() => import("./notifications/Widget")),
  weather: lazy(() => import("./weather/Widget")),
};

export type WidgetType = keyof typeof Widgets;

/** a widget's size in dashboard grid cells */
export interface WidgetSize {
  cols: number;
  rows: number;
}

export interface WidgetInfo {
  label: string;
  description: string;
  icon: string;
  /** the sizes the widget supports, smallest first */
  sizes: WidgetSize[];
  /** the size a newly-added widget starts at, the first of `sizes` if not set */
  defaultSize?: WidgetSize;
  /** the options the user can change in the editor, shown in a dialog */
  settings?: WidgetSettingField[];
}

export type WidgetSettings = Record<string, string>;

export interface WidgetSettingField {
  key: string;
  label: string;
  description?: string;
  placeholder?: string;
  /** a widget with a required setting that is empty opens its settings as soon as it is added */
  required?: boolean;
}

/** what every widget is given */
export interface WidgetProps {
  size: WidgetSize;
  settings: WidgetSettings;
}

export const WidgetInfos: Record<WidgetType, WidgetInfo> = {
  "user.profile": { label: "Profile", description: "Your name and username", icon: PERSON_ICON, sizes: [{ cols: 1, rows: 1 }] },
  "user.avatar": {
    label: "Avatar",
    description: "Your avatar",
    icon: ACCOUNT_CIRCLE_ICON,
    sizes: [
      { cols: 1, rows: 1 },
      { cols: 1, rows: 2 },
    ],
    defaultSize: { cols: 1, rows: 2 },
  },
  notifications: { label: "Notifications", description: "Your recent notifications", icon: NOTIFICATIONS_ICON, sizes: [{ cols: 1, rows: 3 }] },
  weather: {
    label: "Weather",
    description: "The forecast for your location",
    icon: PARTLY_CLOUDY_DAY_ICON,
    sizes: [{ cols: 1, rows: 2 }],
    settings: [
      {
        key: "location",
        label: "Location",
        description: "The town or city to show the forecast for.",
        placeholder: "e.g. London",
        required: true,
      },
    ],
  },
};

export const defaultWidgetSize = (type: string): WidgetSize => WidgetInfos[type as WidgetType]?.defaultSize ?? WidgetInfos[type as WidgetType]?.sizes[0] ?? { cols: 1, rows: 1 };

export const sizeLabel = (size: WidgetSize) => `${size.cols}×${size.rows}`;

const sameSize = (a: WidgetSize, b: WidgetSize) => a.cols === b.cols && a.rows === b.rows;

export const missingRequiredSetting = (type: string, settings: WidgetSettings) =>
  WidgetInfos[type as WidgetType]?.settings?.some((field) => field.required && !settings[field.key]?.trim()) ?? false;

/**
 * Dashboard widgets are stored as a list of strings: `type` for a widget at its default size, or `type@COLSxROWS` for any other size.
 * Settings follow a `#` as URL-encoded JSON, e.g. `weather#%7B%22location%22%3A%22London%22%7D`.
 * Sizes a widget doesn't support fall back to its default.
 */
export function parseWidgetEntry(entry: string): { type: string; size: WidgetSize; settings: WidgetSettings } {
  const [head = entry, rawSettings] = splitOnce(entry, "#");
  const [type = head, rawSize] = head.split("@");
  const match = rawSize?.match(/^(\d+)x(\d+)$/);
  const requested = match ? { cols: Number(match[1]), rows: Number(match[2]) } : undefined;
  const supported = WidgetInfos[type as WidgetType]?.sizes.find((s) => requested && sameSize(s, requested));

  return { type, size: supported ?? defaultWidgetSize(type), settings: parseSettings(rawSettings) };
}

export function serialiseWidgetEntry(type: string, size: WidgetSize, settings: WidgetSettings = {}): string {
  const base = sameSize(size, defaultWidgetSize(type)) ? type : `${type}@${size.cols}x${size.rows}`;
  const used = Object.fromEntries(Object.entries(settings).filter(([, value]) => value !== ""));

  return Object.keys(used).length === 0 ? base : `${base}#${encodeURIComponent(JSON.stringify(used))}`;
}

function splitOnce(value: string, separator: string): [string, string | undefined] {
  const index = value.indexOf(separator);

  return index === -1 ? [value, undefined] : [value.slice(0, index), value.slice(index + 1)];
}

function parseSettings(raw: string | undefined): WidgetSettings {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(decodeURIComponent(raw));

    if (typeof parsed !== "object" || parsed === null) return {};

    return Object.fromEntries(Object.entries(parsed).filter(([, value]) => typeof value === "string")) as WidgetSettings;
  } catch {
    return {};
  }
}

export default Widgets;
