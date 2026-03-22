import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { sparParticipant, spar, notification } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id, userId } = params;
	const { status } = await request.json(); // e.g., 'approved' or 'rejected'

	if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
		return json({ error: 'Invalid status' }, { status: 400 });
	}

	// Verify current user is the host
	const targetSpar = await db.query.spar.findFirst({
		where: eq(spar.id, id)
	});

	if (!targetSpar) {
		return json({ error: 'Spar not found' }, { status: 404 });
	}

	if (targetSpar.hostId !== locals.user.id) {
		return json({ error: 'Only the host can manage participants' }, { status: 403 });
	}

	// Update participant status
	await db
		.update(sparParticipant)
		.set({ status })
		.where(and(eq(sparParticipant.sparId, id), eq(sparParticipant.userId, userId)));

	// If approved, send notification
	if (status === 'approved') {
		await db.insert(notification).values({
			userId,
			type: 'spar_accepted',
			title: 'Request Accepted!',
			message: `Your request to join the spar "${targetSpar.title}" has been approved.`,
			link: `/app`, // Dashboard shows their upcoming spars
			metadata: { sparId: id }
		});
	}

	return json({ success: true, status });
};
