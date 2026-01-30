import * as argon2 from 'argon2'

export class PasswordUtil {
	private static readonly ARGON2_OPTIONS: argon2.Options = {
		type: argon2.argon2id,
		memoryCost: 65536,
		timeCost: 3,
		parallelism: 4,
	}

	static async hash(password: string): Promise<string> {
		return argon2.hash(password, this.ARGON2_OPTIONS)
	}

	static async verify(hash: string, password: string): Promise<boolean> {
		try {
			return await argon2.verify(hash, password)
		} catch {
			return false
		}
	}

	static needsRehash(hash: string): boolean {
		return argon2.needsRehash(hash, this.ARGON2_OPTIONS)
	}
}
