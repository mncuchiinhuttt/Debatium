import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { spar, sparParticipant, notification, user } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

// POST /api/spars/[id]/invite — Invite a user to a spar
export const POST: RequestHandler = async ({ params, locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = params;
	const body = await request.json().catch(() => ({}));
	const { targetUserId, role } = body;

	if (!targetUserId || !role) {
		return json({ error: 'Target user and role are required' }, { status: 400 });
	}

	// Verify current user is the host
	const targetSpar = await db.query.spar.findFirst({
		where: eq(spar.id, id)
	});

	if (!targetSpar) {
		return json({ error: 'Spar not found' }, { status: 404 });
	}

	if (targetSpar.hostId !== locals.user.id) {
		return json({ error: 'Only the host can invite users' }, { status: 403 });
	}

	// Check if already a participant
	const existing = await db.query.sparParticipant.findFirst({
		where: and(eq(sparParticipant.sparId, id), eq(sparParticipant.userId, targetUserId))
	});

	if (existing) {
		if (existing.status === 'rejected') {
			// Allow re-inviting. Update existing record.
			await db.update(sparParticipant)
				.set({ status: 'invited', role })
				.where(eq(sparParticipant.id, existing.id));
		} else {
			return json({ error: 'User is already a participant or invited' }, { status: 400 });
		}
	} else {
		// Create invitation participant record
		await db.insert(sparParticipant).values({
			sparId: id,
			userId: targetUserId,
			role,
			status: 'invited'
		});
	}

	// Send notification
	await db.insert(notification).values({
		userId: targetUserId,
		type: 'spar_invitation',
		title: 'New Invitation!',
		message: `${locals.user.name} has invited you to join the spar "${targetSpar.title}" as a ${role}.`,
		link: `/app`, // Dashboard
		metadata: { 
			sparId: id, 
			role, 
			inviterId: locals.user.id,
			inviterName: locals.user.name
		}
	});

	return json({ success: true });
};
