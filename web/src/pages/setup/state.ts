import trpc from "../../lib/trpc";

export type SetupDefaults = Awaited<ReturnType<typeof trpc.setup.defaults.query>>;

export interface SetupState {
  identity: {
    displayName: string;
    tagline: string;
    metaDescription: string;
    showLoginBackground: boolean;
    showLoginBanner: boolean;
  };
  address: { hostname: string; secure: boolean };
  mailServer: { enabled: boolean; host: string; port: number; secure: boolean; auth: { user: string; pass: string } };
  access: {
    allowSignups: boolean;
    displayProfilesAtLogon: boolean;
    requireEmail: boolean;
    requireTwoFactor: boolean;
    passwordMinimumLength: number;
    passwordContains: { minimumUppercase: number; minimumLowercase: number; minimumNumbers: number; minimumSymbols: number };
  };
  administrator: { username: string; displayName: string; email: string; password: string; confirmPassword: string };
  newUsers: { quotaSize: number; homeDirectories: string[]; displayNameFormat: string };
  applications: { enabled: string[]; quickShortcuts: string[] };
  termsOfUse: string;
}

/** the keys of the state which have a "Recommended" choice that can be restored */
export type ResettableStep = Exclude<keyof SetupState, "administrator">;

export const GIGABYTE = 1024 * 1024 * 1024;

export const initialState = (defaults: SetupDefaults): SetupState => ({
  identity: {
    displayName: defaults.identity.displayName,
    tagline: defaults.identity.tagline,
    metaDescription: defaults.identity.metaDescription,
    showLoginBackground: defaults.identity.showLoginBackground,
    showLoginBanner: defaults.identity.showLoginBanner,
  },
  // the instance is most likely being reached at the address it will be used at
  address: { hostname: window.location.hostname, secure: window.location.protocol === "https:" },
  mailServer: { enabled: false, host: "", port: defaults.mailServer.port, secure: defaults.mailServer.secure, auth: { user: "", pass: "" } },
  access: {
    allowSignups: defaults.access.allowSignups,
    displayProfilesAtLogon: defaults.access.displayProfilesAtLogon,
    requireEmail: defaults.access.requireEmail,
    requireTwoFactor: defaults.access.requireTwoFactor,
    passwordMinimumLength: defaults.access.passwordMinimumLength,
    passwordContains: {
      minimumUppercase: defaults.access.passwordContains.minimumUppercase,
      minimumLowercase: defaults.access.passwordContains.minimumLowercase,
      minimumNumbers: defaults.access.passwordContains.minimumNumbers,
      minimumSymbols: defaults.access.passwordContains.minimumSymbols,
    },
  },
  administrator: { username: defaults.administrator.username, displayName: defaults.administrator.displayName, email: "", password: "", confirmPassword: "" },
  newUsers: {
    quotaSize: defaults.newUsers.quotaSize,
    homeDirectories: [...defaults.newUsers.homeDirectories],
    displayNameFormat: defaults.newUsers.displayNameFormat,
  },
  applications: { enabled: defaults.applications.installed.map((a) => a.id), quickShortcuts: [...defaults.applications.quickShortcuts] },
  termsOfUse: defaults.termsOfUse,
});

/** the problems with a password against the password policy, empty when it is acceptable */
export const passwordIssues = (password: string, access: SetupState["access"]): string[] => {
  const count = (re: RegExp) => password.match(re)?.length ?? 0;
  const issues: string[] = [];

  if (password.length < access.passwordMinimumLength) issues.push(`At least ${access.passwordMinimumLength} characters`);
  if (count(/[a-z]/g) < access.passwordContains.minimumLowercase) issues.push(`At least ${access.passwordContains.minimumLowercase} lowercase letter`);
  if (count(/[A-Z]/g) < access.passwordContains.minimumUppercase) issues.push(`At least ${access.passwordContains.minimumUppercase} uppercase letter`);
  if (count(/[0-9]/g) < access.passwordContains.minimumNumbers) issues.push(`At least ${access.passwordContains.minimumNumbers} number`);
  if (count(/[^a-zA-Z0-9]/g) < access.passwordContains.minimumSymbols) issues.push(`At least ${access.passwordContains.minimumSymbols} special character`);

  return issues;
};

export const formatBytes = (bytes: number) => (bytes % GIGABYTE === 0 ? `${bytes / GIGABYTE} GB` : `${Math.round((bytes / GIGABYTE) * 100) / 100} GB`);
