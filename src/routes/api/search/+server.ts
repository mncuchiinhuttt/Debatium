import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { spar, user, userProfile } from '$lib/server/db/schema';
import { ilike, or, eq, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('q');
	if (!query) {
		return json({ spars: [], users: [] });
	}

	const searchPattern = `%${query}%`;

	// Fetch matching spars
	const matchedSpars = await db.query.spar.findMany({
		where: or(
			ilike(spar.title, searchPattern),
			ilike(spar.description, searchPattern)
		),
		limit: 4
	});

	// Fetch matching users
	const matchedUsers = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			image: user.image,
			honors: userProfile.honors
		})
		.from(user)
		.leftJoin(userProfile, eq(user.id, userProfile.userId))
		.where(
			or(
				ilike(user.name, searchPattern),
				ilike(user.email, searchPattern),
				sql`${userProfile.honors}::text ILIKE ${searchPattern}`
			)
		)
		.limit(4);

	return json({ spars: matchedSpars, users: matchedUsers });
};
