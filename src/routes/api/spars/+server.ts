import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { spar, sparParticipant } from '$lib/server/db/schema';
import { desc, eq, sql, and, ne } from 'drizzle-orm';

// GET /api/spars — List spars
export const GET: RequestHandler = async ({ url, locals }) => {
	const status = url.searchParams.get('status');
	const format = url.searchParams.get('format');
	const level = url.searchParams.get('level');
	const tab = url.searchParams.get('tab') || 'discover';
	const userId = locals.user?.id;

	let conditions = [];

	if (tab === 'discover') {
		conditions.push(ne(spar.status, 'completed'));
		conditions.push(ne(spar.status, 'cancelled'));
	} else if (tab === 'my-spars' && userId) {
		// Will filter after query by checking participation
	} else if (tab === 'history' && userId) {
		conditions.push(eq(spar.status, 'completed'));
	}

	if (status) conditions.push(eq(spar.status, status));
	if (format) conditions.push(eq(spar.format, format));
	if (level) conditions.push(eq(spar.level, level));

	const spars = await db
		.select({
			id: spar.id,
			title: spar.title,
			description: spar.description,
			format: spar.format,
			level: spar.level,
			maxParticipants: spar.maxParticipants,
			scheduledAt: spar.scheduledAt,
			status: spar.status,
			tags: spar.tags,
			hostId: spar.hostId,
			createdAt: spar.createdAt,
			participantCount: sql<number>`(SELECT COUNT(*) FROM spar_participant WHERE spar_participant.spar_id = ${spar.id} AND spar_participant.status != 'rejected')`.as(
				'participant_count'
			)
		})
		.from(spar)
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.orderBy(desc(spar.createdAt));

	// For my-spars tab, filter by user participation
	if (tab === 'my-spars' && userId) {
		const userParticipations = await db
			.select({ sparId: sparParticipant.sparId })
			.from(sparParticipant)
			.where(eq(sparParticipant.userId, userId));

		const userSparIds = new Set(userParticipations.map((p) => p.sparId));
		const filtered = spars.filter((s) => userSparIds.has(s.id));
		return json(filtered);
	}

	return json(spars);
};

// POST /api/spars — Create a spar
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json();
	const { title, description, format, level, maxParticipants, scheduledAt, tags } = body;

	if (!title || !scheduledAt) {
		return json({ error: 'Title and scheduled time are required' }, { status: 400 });
	}

	const [newSpar] = await db
		.insert(spar)
		.values({
			title,
			description: description || '',
			format: format || 'Oxford',
			level: level || 'Intermediate',
			maxParticipants: maxParticipants || 6,
			scheduledAt: new Date(scheduledAt),
			tags: tags || [],
			hostId: locals.user.id
		})
		.returning();

	// Auto-add host as participant
	await db.insert(sparParticipant).values({
		sparId: newSpar.id,
		userId: locals.user.id,
		role: 'host',
		status: 'approved'
	});

	return json(newSpar, { status: 201 });
};
