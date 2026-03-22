import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { spar, sparParticipant, user, userProfile } from '$lib/server/db/schema';
import { desc, eq, ne, and, or, ilike, sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, url }) => {
	const userId = locals.user?.id;

	const q = url.searchParams.get('q') || '';
	const formatFilter = url.searchParams.get('format');
	const levelFilter = url.searchParams.get('level');

	// Build discover conditions
	const conditions = [ne(spar.status, 'completed'), ne(spar.status, 'cancelled')];
	if (q) {
		conditions.push(
			or(
				ilike(spar.title, `%${q}%`),
				ilike(spar.description, `%${q}%`)
			)!
		);
	}
	if (formatFilter) conditions.push(eq(spar.format, formatFilter));
	if (levelFilter) conditions.push(eq(spar.level, levelFilter));

	// Discover: all non-completed, non-cancelled spars matching filters
	const discoverSparsQuery = await db
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
			participantCount: sql<number>`(SELECT COUNT(*) FROM spar_participant WHERE spar_participant.spar_id = ${spar.id} AND spar_participant.status != 'rejected')`.as(
				'participant_count'
			)
		})
		.from(spar)
		.where(and(...conditions))
		.orderBy(desc(spar.createdAt));

	// Enrich with host names
	const discoverWithHosts = await Promise.all(
		discoverSparsQuery.map(async (s) => {
			const [host] = await db
				.select({ name: user.name })
				.from(user)
				.where(eq(user.id, s.hostId))
				.limit(1);
			return { ...s, hostName: host?.name || 'Unknown' };
		})
	);

	// My spars: where the current user is a participant and not completed
	let mySpars: typeof discoverWithHosts = [];
	let historyItems: typeof discoverWithHosts = [];

	if (userId) {
		const participations = await db
			.select({ sparId: sparParticipant.sparId, role: sparParticipant.role })
			.from(sparParticipant)
			.where(eq(sparParticipant.userId, userId));

		const userSparIds = participations.map((p) => p.sparId);
		const roleMap = new Map(participations.map((p) => [p.sparId, p.role]));

		if (userSparIds.length > 0) {
			const allUserSpars = await db
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
					participantCount: sql<number>`(SELECT COUNT(*) FROM spar_participant WHERE spar_participant.spar_id = ${spar.id} AND spar_participant.status != 'rejected')`.as(
						'participant_count'
					)
				})
				.from(spar)
				.where(
					sql`${spar.id} IN (${sql.join(
						userSparIds.map((id) => sql`${id}`),
						sql`, `
					)})`
				)
				.orderBy(desc(spar.scheduledAt));

			const enriched = await Promise.all(
				allUserSpars.map(async (s) => {
					const [host] = await db
						.select({ name: user.name })
						.from(user)
						.where(eq(user.id, s.hostId))
						.limit(1);
					return { ...s, hostName: host?.name || 'Unknown', role: roleMap.get(s.id) || 'participant' };
				})
			);

			mySpars = enriched.filter((s) => s.status !== 'completed');
			historyItems = enriched.filter((s) => s.status === 'completed');
		}
	}

	// Fetch Users for discovering debaters
	const discoverUsersQuery = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			bio: userProfile.bio,
			experienceLevel: userProfile.experienceLevel,
			preferredFormats: userProfile.preferredFormats,
			interests: userProfile.interests,
			honors: userProfile.honors
		})
		.from(user)
		.leftJoin(userProfile, eq(user.id, userProfile.userId));

	let discoverUsers = discoverUsersQuery;

	// Apply user filters (client-side matching in server load for simplicty given no heavy db search setup)
	if (q) {
		const qt = q.toLowerCase();
		discoverUsers = discoverUsers.filter(
			(u) =>
				u.name.toLowerCase().includes(qt) ||
				(u.bio && u.bio.toLowerCase().includes(qt)) ||
				(u.honors && (u.honors as any[]).some((h) => h?.title?.toLowerCase().includes(qt)))
		);
	}
	if (levelFilter) {
		discoverUsers = discoverUsers.filter((u) => u.experienceLevel === levelFilter);
	}
	if (formatFilter) {
		discoverUsers = discoverUsers.filter((u) => u.preferredFormats?.includes(formatFilter));
	}

	return {
		discoverSpars: discoverWithHosts,
		mySpars,
		historyItems,
		discoverUsers
	};
};
