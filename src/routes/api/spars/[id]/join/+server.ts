import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { spar, sparParticipant } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';

// POST /api/spars/[id]/join — Join a spar
export const POST: RequestHandler = async ({ params, locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json().catch(() => ({}));
	const role = body.role === 'judge' ? 'judge' : 'debater';

	// Check spar exists
	const sparData = await db.select().from(spar).where(eq(spar.id, params.id)).limit(1);

	if (sparData.length === 0) {
		return json({ error: 'Spar not found' }, { status: 404 });
	}

	const theSpar = sparData[0];

	if (theSpar.status === 'full' || theSpar.status === 'completed' || theSpar.status === 'cancelled') {
		return json({ error: 'This spar is no longer accepting participants' }, { status: 400 });
	}

	// Prevent host from joining their own spar
	if (theSpar.hostId === locals.user.id) {
		return json({ error: 'You are the host of this spar' }, { status: 400 });
	}

	// Check if already joined
	const existing = await db
		.select()
		.from(sparParticipant)
		.where(and(eq(sparParticipant.sparId, params.id), eq(sparParticipant.userId, locals.user.id)))
		.limit(1);

	if (existing.length > 0) {
		return json({ error: 'Already joined this spar' }, { status: 400 });
	}

	// Check capacity
	const [{ count }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(sparParticipant)
		.where(eq(sparParticipant.sparId, params.id));

	if (Number(count) >= theSpar.maxParticipants) {
		// Update status to full
		await db.update(spar).set({ status: 'full' }).where(eq(spar.id, params.id));
		return json({ error: 'Spar is full' }, { status: 400 });
	}

	// Join
	await db.insert(sparParticipant).values({
		sparId: params.id,
		userId: locals.user.id,
		role,
		status: 'pending'
	});

	// Update status if now full
	if (Number(count) + 1 >= theSpar.maxParticipants) {
		await db.update(spar).set({ status: 'full' }).where(eq(spar.id, params.id));
	} else if (Number(count) + 1 > 1) {
		await db.update(spar).set({ status: 'filling' }).where(eq(spar.id, params.id));
	}

	return json({ success: true });
};
