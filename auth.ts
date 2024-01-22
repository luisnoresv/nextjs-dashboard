import type { User } from '@/app/lib/definitions';
import { sql } from '@vercel/postgres';
import bycrypt from 'bcrypt';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { authConfig } from './auth.config';

async function getUser(email: string): Promise<User | undefined> {
	try {
		const user = await sql<User>`SELECT * FROM users WHERE email=${email}`;
		return user.rows[0];
	} catch (error) {
		console.error('Failed to fetch user:', error);
		throw new Error('Failed to fetch a user.');
	}
}

export const { auth, signIn, signOut } = NextAuth({
	...authConfig,
	providers: [
		Credentials({
			async authorize(crendentials) {
				const parsedCredentials = z
					.object({ email: z.string().email(), password: z.string().min(6) })
					.safeParse(crendentials);

				if (parsedCredentials.success) {
					const { email, password } = parsedCredentials.data;
					const user = await getUser(email);
					if (!user) {
						return null;
					}
					const passwordsMatch = await bycrypt.compare(password, user.password);

					if (passwordsMatch) {
						return user;
					}
				}
				console.info('Invalid credentials');
				return null;
			},
		}),
	],
});
