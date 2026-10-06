import type { SetupState } from "./state";

const TOKEN_KEY = "onlineworkspace.setup.token";
const DRAFT_KEY = "onlineworkspace.setup.draft";

export interface SetupDraft {
  /** the id of the step the user was on, which is the first one they had not completed */
  step: string;
  /** passwords are never kept, only the rest of the state */
  state: Partial<SetupState>;
  customised: Record<string, boolean>;
}

/** the setup token is only kept for the life of the tab, the draft is kept until the setup is complete */
export const savedToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? undefined;
  } catch {
    return undefined;
  }
};

export const saveToken = (token: string) => {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // storage is unavailable, a refresh will start again
  }
};

export const savedDraft = (): SetupDraft | undefined => {
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null") as SetupDraft | null;

    return draft && typeof draft.step === "string" && typeof draft.state === "object" ? draft : undefined;
  } catch {
    return undefined;
  }
};

export const saveDraft = (state: SetupState, step: string, customised: Record<string, boolean>) => {
  const { password: _password, confirmPassword: _confirm, ...administrator } = state.administrator;
  const draft = {
    step,
    customised,
    state: { ...JSON.parse(JSON.stringify(state)), administrator, mailServer: { ...state.mailServer, auth: { ...state.mailServer.auth, pass: "" } } },
  };

  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // storage is unavailable, a refresh will start again
  }
};

export const clearSaved = () => {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // nothing was saved
  }
};

/** the saved values laid over the current ones, so anything the draft does not have keeps its value */
export const mergeDraft = <T>(base: T, draft: unknown): T => {
  if (typeof base !== "object" || base === null || Array.isArray(base) || typeof draft !== "object" || draft === null || Array.isArray(draft)) {
    return typeof draft === typeof base && draft !== undefined ? (draft as T) : base;
  }

  const merged: Record<string, unknown> = { ...base };

  for (const key of Object.keys(base)) merged[key] = mergeDraft((base as Record<string, unknown>)[key], (draft as Record<string, unknown>)[key]);

  return merged as T;
};
