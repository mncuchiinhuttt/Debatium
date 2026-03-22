import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user, userProfile } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const userId = params.id;
	if (!userId) {
		return json({ error: 'User ID is required' }, { status: 400 });
	}

	const userData = await db.select().from(user).where(eq(user.id, userId)).limit(1);

	if (userData.length === 0) {
		return json({ error: 'User not found' }, { status: 404 });
	}

	const profileData = await db.select().from(userProfile).where(eq(userProfile.userId, userId)).limit(1);

	return json({
		...userData[0],
		profile: profileData[0] || null
	});
};
