import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { userProfile } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) return { profile: null };

	const profiles = await db
		.select()
		.from(userProfile)
		.where(eq(userProfile.userId, locals.user.id))
		.limit(1);

	return {
		profile: profiles[0] || null
	};
};
