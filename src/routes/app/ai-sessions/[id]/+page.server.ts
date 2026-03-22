import { db } from '$lib/server/db';
import { aiSession, aiMessage } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { redirect, error, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) redirect(302, '/login');

	const session = await db.query.aiSession.findFirst({
		where: eq(aiSession.id, params.id)
	});

	if (!session) error(404, 'Session not found');
	if (session.userId !== locals.user.id) error(403, 'Forbidden');

	const messages = await db.query.aiMessage.findMany({
		where: eq(aiMessage.sessionId, session.id),
		orderBy: [asc(aiMessage.createdAt)]
	});

	return {
		session,
		messages
	};
};

export const actions: Actions = {
	delete: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const sessionId = formData.get('id') as string;

		if (!sessionId) return fail(400, { error: 'Missing session ID' });

		await db.delete(aiSession).where(eq(aiSession.id, sessionId));

		throw redirect(303, '/app/ai-sessions');
	},
	updateTopic: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const sessionId = formData.get('id') as string;
		const topic = formData.get('topic') as string;

		if (!sessionId || !topic) return fail(400, { error: 'Missing session ID or topic' });

		await db.update(aiSession)
			.set({ topic })
			.where(eq(aiSession.id, sessionId));

		return { success: true };
	}
};
