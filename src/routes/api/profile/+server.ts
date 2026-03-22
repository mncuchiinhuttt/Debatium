import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { userProfile } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json();
	const { bio, experienceLevel, preferredFormats, interests, honors } = body;

	// Check if profile exists
	const existing = await db
		.select()
		.from(userProfile)
		.where(eq(userProfile.userId, locals.user.id))
		.limit(1);

	if (existing.length > 0) {
		// Update
		await db
			.update(userProfile)
			.set({
				bio: bio || '',
				experienceLevel: experienceLevel || 'Beginner',
				preferredFormats: preferredFormats || [],
				interests: interests || [],
				honors: honors || []
			})
			.where(eq(userProfile.userId, locals.user.id));
	} else {
		// Insert
		await db.insert(userProfile).values({
			userId: locals.user.id,
			bio: bio || '',
			experienceLevel: experienceLevel || 'Beginner',
			preferredFormats: preferredFormats || [],
			interests: interests || [],
			honors: honors || []
		});
	}

	return json({ success: true });
};
