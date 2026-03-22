import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { notification, spar, sparParticipant } from '$lib/server/db/schema';
import { eq, desc, and, or, sql } from 'drizzle-orm';

// GET /api/notifications — Fetch recent notifications for the current user
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = locals.user.id;

	// Trigger "upcoming spar" check
	// Find spars starting in the next 30 minutes where user is host or approved participant
	const now = new Date();
	const thirtyMinsLater = new Date(now.getTime() + 30 * 60000);

	const upcomingSpars = await db
		.select({
			id: spar.id,
			title: spar.title,
			scheduledAt: spar.scheduledAt
		})
		.from(spar)
		.leftJoin(sparParticipant, eq(sparParticipant.sparId, spar.id))
		.where(
			and(
				sql`${spar.scheduledAt} > ${now} AND ${spar.scheduledAt} <= ${thirtyMinsLater}`,
				or(
					eq(spar.hostId, userId),
					and(eq(sparParticipant.userId, userId), eq(sparParticipant.status, 'approved'))
				)
			)
		);

	for (const s of upcomingSpars) {
		// Check if notification already exists
		const existing = await db.query.notification.findFirst({
			where: and(
				eq(notification.userId, userId),
				eq(notification.type, 'spar_upcoming'),
				sql`${notification.metadata}->>'sparId' = ${s.id}`
			)
		});

		if (!existing) {
			await db.insert(notification).values({
				userId,
				type: 'spar_upcoming',
				title: 'Spar Starting Soon!',
				message: `The spar "${s.title}" is scheduled to start at ${s.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
				link: `/app`,
				metadata: { sparId: s.id }
			});
		}
	}

	const notifications = await db
		.select()
		.from(notification)
		.where(eq(notification.userId, userId))
		.orderBy(desc(notification.createdAt))
		.limit(20);

	return json(notifications);
};

// PUT /api/notifications — Mark all notifications as read
export const PUT: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	await db
		.update(notification)
		.set({ read: true })
		.where(eq(notification.userId, locals.user.id));

	return json({ success: true });
};
