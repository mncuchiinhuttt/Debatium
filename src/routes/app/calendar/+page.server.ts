import { db } from '$lib/server/db';
import { spar, sparParticipant } from '$lib/server/db/schema';
import { desc, eq, or, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user?.id;

	if (!userId) {
		return { spars: [] };
	}

	// Get spar IDs the user is participating in (not as host)
	const participations = await db
		.select({ sparId: sparParticipant.sparId })
		.from(sparParticipant)
		.where(eq(sparParticipant.userId, userId));

	const participationIds = participations.map((p) => p.sparId);

	// Fetch spars where user is host OR participant
	let spars;
	if (participationIds.length > 0) {
		spars = await db.query.spar.findMany({
			where: sql`${spar.hostId} = ${userId} OR ${spar.id} IN (${sql.join(
				participationIds.map((id) => sql`${id}`),
				sql`, `
			)})`,
			orderBy: [desc(spar.scheduledAt)]
		});
	} else {
		spars = await db.query.spar.findMany({
			where: eq(spar.hostId, userId),
			orderBy: [desc(spar.scheduledAt)]
		});
	}

	return { spars };
};

