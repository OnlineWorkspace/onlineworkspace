export enum Authenticator {
  Email = 1 << 0,
  Passkey = 1 << 1,
  Password = 1 << 2,
  TOTP = 1 << 3,
}
