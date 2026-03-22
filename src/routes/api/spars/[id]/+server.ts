import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { spar, sparParticipant, user } from '$lib/server/db/schema';
import { eq, and, ne } from 'drizzle-orm';

// GET /api/spars/[id] — Get spar details with participants
export const GET: RequestHandler = async ({ params }) => {
	const sparData = await db.select().from(spar).where(eq(spar.id, params.id)).limit(1);

	if (sparData.length === 0) {
		return json({ error: 'Spar not found' }, { status: 404 });
	}

	const participants = await db
		.select({
			id: sparParticipant.id,
			role: sparParticipant.role,
			status: sparParticipant.status,
			joinedAt: sparParticipant.joinedAt,
			userId: sparParticipant.userId,
			userName: user.name,
			userEmail: user.email,
			userImage: user.image
		})
		.from(sparParticipant)
		.innerJoin(user, eq(sparParticipant.userId, user.id))
		.where(and(eq(sparParticipant.sparId, params.id), ne(sparParticipant.status, 'rejected')));

	// Get host info
	const host = await db
		.select({ id: user.id, name: user.name, image: user.image })
		.from(user)
		.where(eq(user.id, sparData[0].hostId))
		.limit(1);

	return json({
		...sparData[0],
		host: host[0] || null,
		participants,
		participantCount: participants.length
	});
};

// PUT /api/spars/[id] — Edit a spar
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const sparData = await db.select().from(spar).where(eq(spar.id, params.id)).limit(1);
	if (sparData.length === 0) {
		return json({ error: 'Spar not found' }, { status: 404 });
	}
	
	if (sparData[0].hostId !== locals.user.id) {
		return json({ error: 'Only the host can edit the spar' }, { status: 403 });
	}

	const body = await request.json();
	await db.update(spar).set({
		title: body.title !== undefined ? body.title : sparData[0].title,
		description: body.description !== undefined ? body.description : sparData[0].description,
		format: body.format !== undefined ? body.format : sparData[0].format,
		level: body.level !== undefined ? body.level : sparData[0].level,
		maxParticipants: body.maxParticipants !== undefined ? body.maxParticipants : sparData[0].maxParticipants,
		scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : sparData[0].scheduledAt,
		tags: body.tags !== undefined ? body.tags : sparData[0].tags
	}).where(eq(spar.id, params.id));

	return json({ success: true });
};

// DELETE /api/spars/[id] — Delete a spar
export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const sparData = await db.select().from(spar).where(eq(spar.id, params.id)).limit(1);
	if (sparData.length === 0) {
		return json({ error: 'Spar not found' }, { status: 404 });
	}

	if (sparData[0].hostId !== locals.user.id) {
		return json({ error: 'Only the host can delete the spar' }, { status: 403 });
	}

	await db.delete(spar).where(eq(spar.id, params.id));

	return json({ success: true });
};
