import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { notification } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

// PUT /api/notifications/[id] — Mark a notification as read
export const PUT: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	await db
		.update(notification)
		.set({ read: true })
		.where(and(eq(notification.id, params.id), eq(notification.userId, locals.user.id)));

	return json({ success: true });
};
