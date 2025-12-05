import { sql } from "bun";
import type { Instance } from "../index.js";
import SubSystem from "../subSystems.js";
import path from "path";
import { promises as fs } from "fs";
import sharp from "sharp";

export interface IUserDatabaseUser {
    id: number;
    username: string;
    forename: string;
    surname: string;
}

// WARNING!: do not call new WorkspacesUser() it is only to be created by the UsersSubsystem
export class WorkspacesUser {
    private instance: Instance;
    userId: number;

    constructor(instance: Instance, userId: number) {
        this.instance = instance;
        this.userId = userId;

        return this;
    }

    getPath(): string {
        return path.join(this.instance.subSystems.filesystem.FS_ROOT, `users/${this.userId}`);
    }

    /**
        Sets the user's username to username
        @return `false` - failed to change the username
        @return `true` - successfully changed the username
    */
    async setUsername(username: string): Promise<boolean> {
        const db = this.instance.subSystems.database.db();

        try {
            if ((await db`SELECT username FROM Users WHERE username = ${username}`).count !== 0) return false;

            await db`UPDATE Users SET username = ${username} WHERE id = ${this.userId}`;
            return true;
        } catch (err) {
            this.instance.subSystems.users.log.error(`Failed to set username for ${this.userId}`);
            return false;
        }
    }

    /**
        Get the user's username
        @return `string` - the users username
        @return `undefined` - could not get the user's username
    */
    async getUsername(): Promise<string | undefined> {
        const db = this.instance.subSystems.database.db();

        return (await db`SELECT username FROM Users WHERE id = ${this.userId}`)?.[0]?.username || undefined;
    }

    /**
        Sets the user's forename to forename
        @return `false` - failed to change the forename
        @return `true` - successfully changed the forename
    */
    async setForename(forename: string): Promise<boolean> {
        const db = this.instance.subSystems.database.db();

        try {
            await db`UPDATE Users SET forename = ${forename} WHERE id = ${this.userId}`;

            return true;
        } catch (err) {
            this.instance.subSystems.users.log.error(`Failed to set forename for ${this.userId}`);
            return false;
        }
    }

    /**
        Get the user's forename
        @return `string` - the users forename
        @return `undefined` - could not get the user's forename
    */
    async getForename(): Promise<string | undefined> {
        const db = this.instance.subSystems.database.db();

        return (await db`SELECT forename FROM Users WHERE id = ${this.userId}`)?.[0]?.forename || undefined;
    }

    /**
        Sets the user's surname to surname
        @return `false` - failed to change the surname
        @return `true` - successfully changed the surname
    */
    async setSurname(surname: string): Promise<boolean> {
        const db = this.instance.subSystems.database.db();

        try {
            await db`UPDATE Users SET surname = ${surname} WHERE id = ${this.userId}`;

            return true;
        } catch (err) {
            this.instance.subSystems.users.log.error(`Failed to set surname for ${this.userId}`);
            return false;
        }
    }

    /**
        Get the user's surname
        @return `string` - the users surname
        @return `undefined` - could not get the user's surname
    */
    async getSurname(): Promise<string | undefined> {
        const db = this.instance.subSystems.database.db();

        return (await db`SELECT surname FROM Users WHERE id = ${this.userId}`)?.[0]?.surname || undefined;
    }

    /**
        Sets the user's forename and surname to the provided forename and surname
        @return `false` - failed to change the surname
        @return `true` - successfully changed the surname
    */
    async setFullName(forename: string, surname: string): Promise<boolean> {
        let forenameRes = await this.setForename(forename);
        let surnameRes = await this.setSurname(surname);

        return forenameRes && surnameRes;
    }

    /**
        Gets the user's forename and surname
    */
    async getFullName(): Promise<{ forename?: string; surname?: string }> {
        let forenameRes = await this.getForename();
        let surnameRes = await this.getSurname();

        return { forename: forenameRes, surname: surnameRes };
    }

    /**
        Sets the user's quota to the provided quota
        @returns `false` - failed to set the quota
        @returns `true` - successfully set the quota
    */
    async setQuota(quota: number): Promise<boolean> {
        const db = this.instance.subSystems.database.db();

        try {
            await db`UPDATE Users SET storage_quota = ${quota} WHERE id = ${this.userId}`;
            return true;
        } catch (err) {
            this.instance.subSystems.users.log.error(`Failed to set storage quota for ${this.userId}`);
            return false;
        }
    }

    /**
        Get the user's quota
        @returns `number` - the users quota
        @returns `undefined` - could not get the user's quota
    */
    async getQuota(): Promise<number | undefined> {
        const db = this.instance.subSystems.database.db();

        return (await db`SELECT storage_quota FROM Users WHERE id = ${this.userId}`)?.[0]?.storage_quota || undefined;
    }

    /**
        Sets the user's bio to bio
        @returns `false` - failed to change the bio
        @returns `true` - successfully changed the bio
    */
    async setBio(bio: string): Promise<boolean> {
        const db = this.instance.subSystems.database.db();

        try {
            await db`UPDATE Users SET bio = ${bio} WHERE id = ${this.userId}`;
            return true;
        } catch (err) {
            this.instance.subSystems.users.log.error(`Failed to set bio for ${this.userId}`);
            return false;
        }
    }

    /**
        Get the user's bio
        @returns `string` - the users bio
        @returns `undefined` - could not get the user's bio
    */
    async getBio(): Promise<string | undefined> {
        const db = this.instance.subSystems.database.db();

        return (await db`SELECT bio FROM Users WHERE id = ${this.userId}`)?.[0]?.bio || undefined;
    }

    /**
        Sets the user's email to email
        @returns `false` - failed to change the email
        @returns `true` - successfully changed the email
    */
    async setEmail(email: string): Promise<boolean> {
        const db = this.instance.subSystems.database.db();
        try {
            await db`UPDATE Users SET email = ${email} WHERE id = ${this.userId}`;
            return true;
        } catch (err) {
            this.instance.subSystems.users.log.error(`Failed to set email for ${this.userId}`);
            return false;
        }
    }

    /**
        Get the user's email
        @returns `string` - the users email
        @returns `undefined` - could not get the user's email
    */
    async getEmail(): Promise<string | undefined> {
        const db = this.instance.subSystems.database.db();

        return (await db`SELECT email FROM Users WHERE id = ${this.userId}`)?.[0]?.email || undefined;
    }

    /**
        Sets the user's gender to gender
        @returns `false` - failed to change the gender
        @returns `true` - successfully changed the gender
    */
    async setGender(gender: "female" | "male" | "other"): Promise<boolean> {
        const db = this.instance.subSystems.database.db();

        try {
            await db`UPDATE Users SET gender = ${gender} WHERE id = ${this.userId}`;
            return true;
        } catch (err) {
            this.instance.subSystems.users.log.error(`Failed to set gender for ${this.userId}`);
            return false;
        }
    }

    /**
        Get the user's gender
        @returns `"female" | "male" | "other"` - the users gender
        @returns `undefined` - could not get the user's gender
    */
    async getGender(): Promise<string | undefined> {
        const db = this.instance.subSystems.database.db();

        return (await db`SELECT gender FROM Users WHERE id = ${this.userId}`)?.[0]?.gender || undefined;
    }

    /**
        Get if the user is an administrator
        @returns `boolean` - is the user an administrator
    */
    async isAdministrator(): Promise<boolean | undefined> {
        const db = this.instance.subSystems.database.db();

        return (await db`SELECT is_administrator FROM Users WHERE id = ${this.userId}`)?.[0]?.is_administrator || false;
    }

    /**
        Sets if user is an administrator
        @returns `false` - failed to change the administrator status
        @returns `true` - successfully changed the administrator status
    */
    async setIsAdministrator(administrator: boolean): Promise<boolean> {
        const db = this.instance.subSystems.database.db();

        try {
            await db`UPDATE Users SET is_administrator = ${administrator} WHERE id = ${this.userId}`;
            return true;
        } catch (err) {
            this.instance.subSystems.users.log.error(`Failed to set is_administrator for ${this.userId}`);
            return false;
        }
    }

    /**
        sets the user's original quality avatar to avatarFile
        @returns `true` - copied the avatarFile successfully
        @returns `false` - failed to copy the avatarFile
    */
    async setAvatar(avatarFile: string): Promise<boolean> {
        try {
            await fs.cp(avatarFile, path.join(this.getPath(), "assets/avatar/avatar.png"));
            return true;
        } catch (err) {
            this.instance.subSystems.users.log.error(`Failed to set avatar for ${this.userId} to ${avatarFile}`);
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
            { width: 16, height: 16, name: "xs" },
            { width: 32, height: 32, name: "s" },
            { width: 64, height: 64, name: "m" },
            { width: 128, height: 128, name: "l" },
            { width: 256, height: 256, name: "xl" },
        ];

        try {
            for (const size of AVATAR_SIZES) {
                if (override || !(await fs.exists(path.join(this.getPath(), `assets/avatar/${size.name}.png`)))) {
                    this.instance.subSystems.users.log.info(`Generating avatar for user '${this.userId}' @ ${size.name}`);
                    await sharp(path.join(this.getPath(), "assets/avatar/avatar.png"))
                        .resize(size.width, size.height)
                        .toFile(path.join(this.getPath(), `assets/avatar/${size.name}.png`));
                    this.instance.subSystems.users.log.success(`Generated avatar for user '${this.userId}' @ ${size.name}`);
                }
            }
        } catch (err) {
            this.instance.subSystems.users.log.error("Failed to generate avatar sizes");
        }

        return true;
    }

    /**
        Check that all required directories and assets are valid for this user.
        If they are missing or invalid, directories will be created and assets will be generated / copied

        @returns `true` - if successful
    */
    async verify(): Promise<boolean> {
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
            "/system",
            "/system/logs",
        ];

        for (const dir of USER_DIRECTORIES) {
            await this.instance.subSystems.filesystem.createDirectoryIfNotExists(
                path.join(this.instance.subSystems.filesystem.FS_ROOT, `users/${this.userId}`, dir),
            );
        }

        if (!(await fs.exists(path.join(this.getPath(), "assets/avatar/avatar.png")))) {
            await this.setAvatar(path.join(this.instance.subSystems.filesystem.SRC_ROOT, "assets/placeholder/avatar.png"));
        }

        await this.generateAvatars();

        this.instance.subSystems.users.log.success(`Verified user (${this.userId})${await this.getUsername()}`);

        return true;
    }

    /**
        Deletes a user from the filesystem and all database entries
     */
    async delete() {
        await fs.rm(path.join(this.instance.subSystems.filesystem.FS_ROOT, `users/${this.userId}`), {
            recursive: true,
            force: true,
        });

        const db = this.instance.subSystems.database.db();

        await db`DELETE FROM Users WHERE id = ${this.userId};`;
        await db`DELETE FROM Sessions WHERE user_id = ${this.userId};`;

        return true;
    }
}

export default class UsersSubsystem extends SubSystem {
    constructor(instance: Instance) {
        super("users", instance);

        return this;
    }

    async startup(): Promise<boolean> {
        await super.startup();

        const db = this.instance.subSystems.database.db();

        /**
            init the users database

            id - permanent unique user id number (number)
            username - the user's changeable username (string)
            forename - the user's chosen forename (string)
            surname - the user's chosen surname (string)
            gender - the user's chosen gender ("female" | "male" | "other")
            bio - the user's chosen bio (string)
            storage_quota - the user's storage quota in MB (number)
            email - the user's chosen contact email (string)
            is_administrator - is the user an administrator (boolean)
            is_email_verified - is the user's chosen contact email verified to be theirs (boolean)
            socials - the user's chosen social media links in the format '[name]:-:[url]' as such, the string ':-:' must not be in either [name] or [url] (string[])
            hashed_password - the user's password after it has been hashed by bun (string)
            two_factor_otp_secret - the user's secret string used to verify 2fa opt codes
            settings - a settings object
        */
        await db`CREATE TABLE IF NOT EXISTS Users (
            id SERIAL PRIMARY KEY,
            username TEXT,
            forename TEXT,
            surname TEXT,
            gender TEXT DEFAULT 'other',
            bio TEXT,
            storage_quota BIGINT,
            email TEXT,
            is_administrator BOOL DEFAULT FALSE,
            is_email_verified BOOL DEFAULT FALSE,
            socials TEXT[] DEFAULT '{}',
            hashed_password TEXT,
            two_factor_otp_secret TEXT,
            settings JSONB DEFAULT '{}'::JSONB
        )`;

        let administratorUserId = await this.createUser("admin");

        // if the account is newly-created
        if (administratorUserId !== undefined) {
            const adminUser = await this.getUserById(administratorUserId);

            if (!adminUser) {
                this.log.error("Admin user didn't exist and couldn't be created!");
            } else {
                await adminUser.setFullName("Admin", "Istrator");
                await adminUser.setIsAdministrator(true);

                const defaultPassword = "password";

                await this.instance.subSystems.authorization.setPassword(adminUser.userId, defaultPassword);
                this.log.info(`The default admin user has a password of '${defaultPassword}'`);
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
    async createUser(username: string): Promise<number | undefined> {
        const db = this.instance.subSystems.database.db();

        if ((await db`SELECT username FROM Users WHERE username = ${username}`).count !== 0) return undefined;

        let user = {
            username,
            forename: "John",
            surname: "Doe",
        };

        let id = (await db`INSERT INTO Users ${sql(user)} RETURNING id`)?.[0]?.id;

        const ubi = await this.getUserById(id);

        if (!ubi) {
            this.log.error("Failed during the user creation process.");
            return undefined;
        }

        await ubi.setAvatar(path.join(this.instance.subSystems.filesystem.SRC_ROOT, "assets/placeholder/avatar.png"));

        await ubi.verify();

        return id;
    }

    /**
        Does a user with the userId exist
        @returns true - they exist
        @returns false - they do not exist
    */
    async doesUserExist(userId: number): Promise<boolean> {
        const db = this.instance.subSystems.database.db();

        if ((await db`SELECT username FROM Users WHERE id = ${userId}`).count === 1) return true;

        return false;
    }

    /**
        Gets an array of all users registered on this instance
        @returns `WorkspacesUser[]` - an array of all users
    */
    async getAllUsers(): Promise<WorkspacesUser[]> {
        const db = this.instance.subSystems.database.db();

        return (await db`SELECT id FROM Users`).map((u: { id: number }) => new WorkspacesUser(this.instance, u.id));
    }

    /**
        Gets a user by their userId
        @returns `WorkspacesUser` - the user
        @returns `undefined` - no such user exists
    */
    async getUserById(userId: number): Promise<WorkspacesUser | undefined> {
        if (this.doesUserExist(userId) === undefined) return undefined;

        return new WorkspacesUser(this.instance, userId);
    }

    /**
        Gets a user by their username
        @returns `WorkspacesUser` - the user
        @returns `undefined` - no such user exists
    */
    async getUserByUsername(username: string): Promise<WorkspacesUser | undefined> {
        const db = this.instance.subSystems.database.db();

        const userId = (await db`SELECT id FROM Users WHERE username = ${username}`)?.[0]?.id;

        if (!(await this.doesUserExist(userId))) return undefined;

        return new WorkspacesUser(this.instance, userId);
    }
}
