import { promises as fs, existsSync as fsExistsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import type { Instance } from "../index.ts";
import System from "../system.ts";
import { Authenticator } from "./authentication/authenticator.ts";

const DISALLOWED_USERNAMES: string[] = [
  "me", // in use for api calls relating to the current user
];

// WARNING!: do not call new WorkspacesUser() it is only to be created by the UsersSubsystem
export class WorkspacesUser {
  userId: number;
  private instance: Instance;

  constructor(instance: Instance, userId: number) {
    this.instance = instance;
    this.userId = userId;
  }

  getPath(): string {
    return path.join(this.instance.sys.filesystem.FS_ROOT, `users/${this.userId}`);
  }

  /**
   Sets the user's username to username
   @return `false` - failed to change the username
   @return `true` - successfully changed the username
   */
  async setUsername(username: string): Promise<boolean> {
    const db = this.instance.sys.database.postgres();

    try {
      if (
        (
          await db`SELECT username
                    FROM public.users
                    WHERE username = ${username}`
        ).count !== 0
      )
        return false;

      await db`UPDATE public.users
               SET username = ${username}
               WHERE id = ${this.userId}`;
      return true;
    } catch (_) {
      this.instance.sys.users.log.error(`Failed to set username for ${this.userId}`);
      return false;
    }
  }

  /**
   Get the user's username
   @return `string` - the user's username
    This cannot be undefined as a user must ALWAYS have a username
   */
  async getUsername(): Promise<string> {
    const db = this.instance.sys.database.postgres();

    return (
      await db`SELECT username
                     FROM public.users
                     WHERE id = ${this.userId}`
    )[0]!.username;
  }

  /**
   Sets the user's display name
   @return `false` - failed to change the display name
   @return `true` - successfully changed the display name
   */
  async setDisplayName(displayName: string): Promise<boolean> {
    const db = this.instance.sys.database.postgres();

    try {
      await db`UPDATE public.users
               SET display_name = ${displayName}
               WHERE id = ${this.userId}`;

      this.instance.log.system.info(`Set display name to '${displayName}' for ${this.userId}`);

      return true;
    } catch (_) {
      this.instance.sys.users.log.error(`Failed to set display name for ${this.userId}`);
      return false;
    }
  }

  /**
   Get the user's display name, falling back to their username
   */
  async getDisplayName(): Promise<string> {
    const db = this.instance.sys.database.postgres();

    const row = (
      await db`SELECT display_name, username
               FROM public.users
               WHERE id = ${this.userId}`
    )?.[0];

    return row?.display_name || row?.username || "Unknown";
  }

  /**
   Sets the user's quota to the provided quota in bits
   @returns `false` - failed to set the quota
   @returns `true` - successfully set the quota
   */
  async setQuota(quota: number): Promise<boolean> {
    const db = this.instance.sys.database.postgres();

    try {
      await db`UPDATE public.users
               SET storage_quota = ${quota}
               WHERE id = ${this.userId}`;
      return true;
    } catch (_) {
      this.instance.sys.users.log.error(`Failed to set storage quota for ${this.userId}`);
      return false;
    }
  }

  /**
   Get the user's quota in bits
   @returns `number` - the users quota
   @returns `undefined` - could not get the user's quota
   */
  async getQuota(): Promise<number | undefined> {
    const db = this.instance.sys.database.postgres();

    return (
      (
        await db`SELECT storage_quota
                     FROM public.users
                     WHERE id = ${this.userId}`
      )?.[0]?.storage_quota || undefined
    );
  }

  /**
   Sets the user's bio to bio
   @returns `false` - failed to change the bio
   @returns `true` - successfully changed the bio
   */
  async setBio(bio: string): Promise<boolean> {
    const db = this.instance.sys.database.postgres();

    try {
      await db`UPDATE public.users
               SET bio = ${bio}
               WHERE id = ${this.userId}`;
      return true;
    } catch (_) {
      this.instance.sys.users.log.error(`Failed to set bio for ${this.userId}`);
      return false;
    }
  }

  /**
   Get the user's bio
   @returns `string` - the users bio
   @returns `undefined` - could not get the user's bio
   */
  async getBio(): Promise<string | undefined> {
    const db = this.instance.sys.database.postgres();

    return (
      (
        await db`SELECT bio
                     FROM public.users
                     WHERE id = ${this.userId}`
      )?.[0]?.bio || undefined
    );
  }

  /**
   Sets the user's email, which is unverified unless `verified` is set
   @returns `false` - failed to change the email
   @returns `true` - successfully changed the email
   */
  async setEmail(email: string, verified = false): Promise<boolean> {
    const db = this.instance.sys.database.postgres();
    try {
      await db`UPDATE public.users
               SET email = ${email}, is_email_verified = ${verified}
               WHERE id = ${this.userId}`;
      return true;
    } catch (_) {
      this.instance.sys.users.log.error(`Failed to set email for ${this.userId}`);
      return false;
    }
  }

  /**
   Removes the user's email and its verification
   */
  async removeEmail(): Promise<boolean> {
    const db = this.instance.sys.database.postgres();
    try {
      await db`UPDATE public.users
               SET email = NULL, is_email_verified = FALSE
               WHERE id = ${this.userId}`;
      return true;
    } catch (_) {
      this.instance.sys.users.log.error(`Failed to remove email for ${this.userId}`);
      return false;
    }
  }

  /**
   Has the user proven they own their email
   */
  async isEmailVerified(): Promise<boolean> {
    const db = this.instance.sys.database.postgres();

    return !!(
      await db`SELECT is_email_verified
               FROM public.users
               WHERE id = ${this.userId}`
    )?.[0]?.is_email_verified;
  }

  /**
   Get the user's email
   @returns `string` - the users email
   @returns `undefined` - could not get the user's email
   */
  async getEmail(): Promise<string | undefined> {
    const db = this.instance.sys.database.postgres();

    return (
      (
        await db`SELECT email
                     FROM public.users
                     WHERE id = ${this.userId}`
      )?.[0]?.email || undefined
    );
  }

  /**
   Sets the user's gender to gender
   @returns `false` - failed to change the gender
   @returns `true` - successfully changed the gender
   */
  async setGender(gender: "female" | "male" | "other"): Promise<boolean> {
    const db = this.instance.sys.database.postgres();

    try {
      await db`UPDATE public.users
               SET gender = ${gender}
               WHERE id = ${this.userId}`;
      return true;
    } catch (_) {
      this.instance.sys.users.log.error(`Failed to set gender for ${this.userId}`);
      return false;
    }
  }

  /**
   Get the user's gender
   @returns `"female" | "male" | "other"` - the users gender
   @returns `undefined` - could not get the user's gender
   */
  async getGender(): Promise<string | undefined> {
    const db = this.instance.sys.database.postgres();

    return (
      (
        await db`SELECT gender
                     FROM public.users
                     WHERE id = ${this.userId}`
      )?.[0]?.gender || undefined
    );
  }

  /**
   Sets the user's pronouns, e.g. "they/them"
   @returns `false` - failed to change the pronouns
   @returns `true` - successfully changed the pronouns
   */
  async setPronouns(pronouns: string): Promise<boolean> {
    const db = this.instance.sys.database.postgres();

    try {
      await db`UPDATE public.users
               SET pronouns = ${pronouns}
               WHERE id = ${this.userId}`;

      return true;
    } catch (_) {
      this.instance.sys.users.log.error(`Failed to set pronouns for ${this.userId}`);
      return false;
    }
  }

  /**
   Get the user's pronouns
   @returns `string` - the user's pronouns, empty if they haven't set any
   */
  async getPronouns(): Promise<string> {
    const db = this.instance.sys.database.postgres();

    return (
      (
        await db`SELECT pronouns
                 FROM public.users
                 WHERE id = ${this.userId}`
      )?.[0]?.pronouns || ""
    );
  }

  /**
   Join a specified group for the user.
   @returns `true` - if successfully joined the group
   @returns `false` - if already a member or an error occurred.
   */
  async joinGroup(groupId: string): Promise<boolean> {
    const db = this.instance.sys.database.postgres();

    try {
      const existingGroups = await this.getGroups();

      if (existingGroups.includes(groupId)) {
        return false;
      }

      await db`
        UPDATE public.users
        SET groups = array_append(groups, ${groupId})
        WHERE id = ${this.userId}
      `;

      return true;
    } catch (error) {
      this.instance.sys.users.log.error("Error joining group:", error);
      return false;
    }
  }

  /**
   Leave a specified group for the user.
   @returns `true` - if successfully left the group
   @returns `false` - if not a member or an error occurred.
   */
  async leaveGroup(groupId: string): Promise<boolean> {
    const db = this.instance.sys.database.postgres();

    try {
      const existingGroups = await this.getGroups();

      if (!existingGroups.includes(groupId)) {
        return false;
      }

      await db`
        UPDATE public.users
        SET groups = array_remove(groups, ${groupId})
        WHERE id = ${this.userId}
      `;

      return true;
    } catch (error) {
      this.instance.sys.users.log.error("Error leaving group:", error);
      return false;
    }
  }

  /**
   Returns an array of groups the user belongs to.
   @returns `string[]` - An array of group IDs the user is a member of, or an empty array if none.
   */
  async getGroups(): Promise<string[]> {
    const db = this.instance.sys.database.postgres();

    return (
      (
        await db`SELECT groups
                     FROM public.users
                     WHERE id = ${this.userId}`
      )?.[0].groups || []
    );
  }

  /**
   Get if the user is an administrator
   @returns `boolean` - if the user an administrator
   */
  async isAdministrator(): Promise<boolean> {
    const db = this.instance.sys.database.postgres();

    return (
      (
        await db`SELECT is_administrator
                     FROM public.users
                     WHERE id = ${this.userId}`
      )?.[0]?.is_administrator || false
    );
  }

  /**
   Sets if user is an administrator
   @returns `false` - failed to change the administrator status
   @returns `true` - successfully changed the administrator status
   */
  async setIsAdministrator(administrator: boolean): Promise<boolean> {
    const db = this.instance.sys.database.postgres();

    try {
      await db`UPDATE public.users
               SET is_administrator = ${administrator}
               WHERE id = ${this.userId}`;
      return true;
    } catch (_) {
      this.instance.sys.users.log.error(`Failed to set is_administrator for ${this.userId}`);
      return false;
    }
  }

  /**
   Gets a user's password note
   @returns `string` - the user's password note
   @returns `undefined` - the user has no password note set
   */
  async getPasswordNote(): Promise<string | undefined> {
    const db = this.instance.sys.database.postgres();

    return (
      (
        await db`SELECT password_note
                     FROM public.users
                     WHERE id = ${this.userId}`
      )?.[0]?.password_note || undefined
    );
  }

  /**
   sets the user's original quality avatar to avatarFile
   @returns `true` - copied the avatarFile successfully
   @returns `false` - failed to copy the avatarFile
   */
  async setAvatar(avatarFile: string): Promise<boolean> {
    try {
      await fs.cp(avatarFile, path.join(this.getPath(), "assets/avatar/avatar.webp"));
      return true;
    } catch (_) {
      this.instance.sys.users.log.error(`Failed to set avatar for ${this.userId} to ${avatarFile}`);
      return false;
    }
  }

  /**
   generates the required avatar sizes from the user's avatarFile, if override is not set to true, only missing avatar sizes will be generated
   @returns `true` - generated required avatar files successfully
   @returns `false` - failed to generate all required avatar files
   */
  async generateAvatars(override?: boolean): Promise<boolean> {
    const AVATAR_SIZES: { width: number; height: number; name: string }[] = [
      {
        width: 16,
        height: 16,
        name: "xs",
      },
      {
        width: 32,
        height: 32,
        name: "s",
      },
      {
        width: 64,
        height: 64,
        name: "m",
      },
      {
        width: 128,
        height: 128,
        name: "l",
      },
      {
        width: 256,
        height: 256,
        name: "xl",
      },
      {
        width: 512,
        height: 512,
        name: "2xl",
      },
    ];

    try {
      for (const size of AVATAR_SIZES) {
        if (override || !fsExistsSync(path.join(this.getPath(), `assets/avatar/${size.name}.webp`))) {
          this.instance.sys.users.log.info(`Generating avatar for user '${this.userId}' @ ${size.name}`);
          await sharp(path.join(this.getPath(), "assets/avatar/avatar.webp"))
            .resize(size.width, size.height)
            .toFile(path.join(this.getPath(), `assets/avatar/${size.name}.webp`));
          this.instance.sys.users.log.success(`Generated avatar for user '${this.userId}' @ ${size.name}`);
        }
      }
    } catch (_) {
      this.instance.sys.users.log.error("Failed to generate avatar sizes");
    }

    return true;
  }

  /**
   Check that all required directories and assets are valid for this user.
   If they are missing or invalid, directories will be created and assets will be generated / copied
   @returns `true` - if successful
   */
  async verify(): Promise<boolean> {
    const username = await this.getUsername();
    const USER_DIRECTORIES = [
      "/",
      "/fs",
      "/fs/Desktop",
      "/fs/Downloads",
      "/fs/Documents",
      "/fs/Photos",
      "/fs/Music",
      "/fs/Videos",
      "/assets",
      "/assets/avatar",
      "/assets/wallpapers",
      "/assets/wallpapers/resized",
      "/mounts",
      "/recycle_bin",
      "/system",
      "/system/logs",
      "/system/temp",
    ];

    for (const dir of USER_DIRECTORIES) {
      await this.instance.sys.filesystem.createDirectoryIfNotExists(path.join(this.instance.sys.filesystem.FS_ROOT, `users/${this.userId}`, dir));
    }

    if (!fsExistsSync(path.join(this.getPath(), "assets/avatar/avatar.webp"))) {
      await this.setAvatar(path.join(this.instance.sys.filesystem.SRC_ROOT, "assets/placeholder/avatar.png"));
    }

    await this.generateAvatars();

    if (!(await this.instance.sys.authorization.hasPassword(this.userId))) {
      this.instance.sys.users.log.warning(`user (${this.userId})${username} has no password set! Without a password, this account cannot be accessed.`);
    }

    this.instance.sys.users.log.success(`Verified user (${this.userId}) ${this.instance.sys.users.log.emphasis(`${username}`)}`);

    return true;
  }

  /**
   Deletes a user from the filesystem and all database entries
   */
  async delete() {
    await fs.rm(path.join(this.instance.sys.filesystem.FS_ROOT, `users/${this.userId}`), {
      recursive: true,
      force: true,
    });

    const db = this.instance.sys.database.postgres();

    await db`DELETE
             FROM public.users
             WHERE id = ${this.userId};`;
    await db`DELETE
             FROM public.sessions
             WHERE user_id = ${this.userId};`;

    return true;
  }
}

export default class UsersSystem extends System {
  constructor(instance: Instance) {
    super("users", instance);
  }

  override async startup(): Promise<boolean> {
    await super.startup();

    const db = this.instance.sys.database.postgres();

    /**
     init the user's database

     id - permanent unique user id number (number)
     username - the user's changeable username (string)
     display_name - the user's chosen display name (string)
     pronouns - the user's chosen pronouns, only used when their gender is "other" (string)
     gender - the user's chosen gender ("female" | "male" | "other")
     bio - the user's chosen bio (string)
     storage_quota - the user's storage quota in MB (number)
     email - the user's chosen contact email (string)
     is_administrator - is the user an administrator (boolean)
     is_email_verified - is the user's chosen contact email verified to be theirs (boolean)
     socials - the user's chosen social media links in the format '[name]:-:[url]' as such, the string ':-:' must not be in either [name] or [url] (string[])
     hashed_password - the user's password after it has been hashed by bun (string)
     two_factor_secret - the user's secret string used to verify 2fa opt codes (string)
     settings - a settings object
     groups - a list of the group ids which this user is a member of
     color_scheme - the user's color scheme
     */
    await db`CREATE TABLE IF NOT EXISTS users
             (
               id                   SERIAL PRIMARY KEY,
               username             TEXT,
               display_name         TEXT,
               gender               TEXT   DEFAULT 'other',
               pronouns             TEXT   DEFAULT '',
               bio                  TEXT,
               storage_quota        BIGINT DEFAULT 8589934592,
               email                TEXT,
               is_administrator     BOOL   DEFAULT FALSE,
               is_email_verified    BOOL   DEFAULT FALSE,
               socials              TEXT[] DEFAULT '{}',
               hashed_password      TEXT,
               password_note        TEXT,
               two_factor_secret    TEXT,
               session_requirements INT,
               settings             JSONB  DEFAULT '{}'::JSONB,
               groups               TEXT[],
               color_scheme         JSONB
             )`;

    // migrate the legacy forename/surname columns into display_name
    await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT`;
    await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS pronouns TEXT DEFAULT ''`;
    const legacyColumns = await db`SELECT column_name
                                   FROM information_schema.columns
                                   WHERE table_schema = 'public'
                                     AND table_name = 'users'
                                     AND column_name IN ('forename', 'surname')`;
    if (legacyColumns.some((c) => c.column_name === "forename")) {
      await db`UPDATE users
               SET display_name = TRIM(CONCAT(forename, ' ', COALESCE(surname, '')))
               WHERE display_name IS NULL`;
    }
    await db`ALTER TABLE users DROP COLUMN IF EXISTS forename`;
    await db`ALTER TABLE users DROP COLUMN IF EXISTS surname`;

    if ((await this.getAdministrators()).length === 0) {
      this.log.warning("No administrator account exists, creating default administrator account with username 'admin' and password 'password'");

      const administratorUserId = await this.createUser("admin");

      // if the account is newly-created
      if (administratorUserId !== undefined) {
        const adminUser = await this.getUserById(administratorUserId);

        if (!adminUser) {
          this.log.error("Admin user didn't exist and couldn't be created!");
        } else {
          await adminUser.setDisplayName("Admin Istrator");
          await adminUser.setIsAdministrator(true);

          const defaultPassword = "password";

          await this.instance.sys.authorization.setPassword(adminUser.userId, defaultPassword);
          this.log.info(`The default admin user has a password of '${defaultPassword}'`);
        }
      }
    }

    const users = await this.getAllUsers();

    for (const user of users) {
      await user.verify();
    }

    return true;
  }

  /**
   Create a new Workspaces User
   @returns number - the userId of the created user
   @returns undefined - the user already exists
   */
  async createUser(username: string, password?: string): Promise<number | undefined> {
    if (username in DISALLOWED_USERNAMES) {
      this.log.warning(`Failed to create user ${username} as it is a disallowed username`);

      return undefined;
    }

    const db = this.instance.sys.database.postgres();

    if (
      (
        await db`SELECT username
                  FROM public.users
                  WHERE username = ${username}`
      ).count !== 0
    ) {
      this.log.warning(`Failed to create user ${username} as they already exist`);
      return undefined;
    }

    const user = {
      username,
      display_name: username,
    };

    const id = (await db`INSERT INTO public.users ${db(user)} RETURNING id`)?.[0]?.id;

    const ubi = await this.getUserById(id);

    if (!ubi) {
      this.log.error("Failed during the user creation process.");
      return undefined;
    }

    if (password) {
      await this.instance.sys.authentication.setSessionRequirementsForUser(id, [Authenticator.Password]);
      await this.instance.sys.authentication.authenticators[Authenticator.Password].setPassword(id, password);
    }

    await ubi.setAvatar(path.join(this.instance.sys.filesystem.SRC_ROOT, "assets/placeholder/avatar.png"));

    await ubi.verify();

    return id;
  }

  /**
   Does a user with the userId exist
   @returns true - they exist
   @returns false - they do not exist
   */
  async doesUserExist(userId: number): Promise<boolean> {
    const db = this.instance.sys.database.postgres();

    return (
      (
        await db`SELECT username
                     FROM public.users
                     WHERE id = ${userId}`
      ).count === 1
    );
  }

  /**
   Gets an array of all users registered on this instance
   @returns `WorkspacesUser[]` - an array of all users
   */
  async getAdministrators(): Promise<WorkspacesUser[]> {
    const users = await this.getAllUsers();
    const administratorFlags = await Promise.all(users.map((u) => u.isAdministrator()));

    return users.filter((_, i) => administratorFlags[i]);
  }

  async getAllUsers(): Promise<WorkspacesUser[]> {
    const db = this.instance.sys.database.postgres();

    try {
      // @ts-ignore this is valid
      return (
        await db`SELECT id
                       FROM public.users`
      ).map((u: { id: number }) => new WorkspacesUser(this.instance, u.id));
    } catch (err) {
      this.log.error("Failed to getAllUsers()", err);

      return [];
    }
  }

  /**
   Gets a user by their userId
   @returns `WorkspacesUser` - the user
   @returns `undefined` - no such user exists
   */
  async getUserById(userId: number): Promise<WorkspacesUser | undefined> {
    if ((await this.doesUserExist(userId)) === undefined) return undefined;

    return new WorkspacesUser(this.instance, userId);
  }

  /**
   Gets a user by their username
   @returns `WorkspacesUser` - the user
   @returns `undefined` - no such user exists
   */
  async getUserByUsername(username: string): Promise<WorkspacesUser | undefined> {
    const db = this.instance.sys.database.postgres();

    const userId = (
      await db`SELECT id
                             FROM public.users
                             WHERE username = ${username}`
    )?.[0]?.id;

    if (!userId) return undefined;

    return new WorkspacesUser(this.instance, userId);
  }
}
