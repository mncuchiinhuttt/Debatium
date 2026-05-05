import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: 'postgresql',
	dbCredentials: { url: process.env.DATABASE_URL },
	tablesFilter: [
		'user',
		'session',
		'account',
		'verification',
		'spar',
		'spar_participant',
		'user_profile',
		'notification',
		'ai_session',
		'ai_message'
	],
	verbose: true,
	strict: true
});
