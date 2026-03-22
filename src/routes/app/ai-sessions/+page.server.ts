import { db } from '$lib/server/db';
import { aiSession } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/login');

	const sessions = await db.query.aiSession.findMany({
		where: eq(aiSession.userId, locals.user.id),
		orderBy: [desc(aiSession.createdAt)]
	});

	return {
		sessions
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const topic = formData.get('topic') as string;
		const language = formData.get('language') as string;
		const mode = formData.get('mode') as string;

		if (!topic || !language || !mode) {
			return fail(400, { error: 'Missing required fields' });
		}

		const [newSession] = await db.insert(aiSession).values({
			userId: locals.user.id,
			topic,
			language,
			mode
		}).returning();

		throw redirect(303, `/app/ai-sessions/${newSession.id}`);
	}
};
