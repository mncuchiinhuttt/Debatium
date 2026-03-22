import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, boolean, integer, index, jsonb } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

export { user, session, account, verification } from './auth.schema';
export { userRelations, sessionRelations, accountRelations } from './auth.schema';

// ===== Types =====

export type Honor = {
	id: string;
	tournamentName: string;
	year: number;
	scale: string;
	format: string;
	role: 'debater' | 'judge';
	breakingRank?: string;
	achievements?: string;
	judgeType?: string;
	highestRank?: string;
};

// ===== Spar Tables =====

export const spar = pgTable(
	'spar',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		title: text('title').notNull(),
		description: text('description').default(''),
		format: text('format').notNull().default('Oxford'),
		level: text('level').notNull().default('Intermediate'),
		maxParticipants: integer('max_participants').notNull().default(6),
		scheduledAt: timestamp('scheduled_at').notNull(),
		status: text('status').notNull().default('open'),
		tags: text('tags')
			.array()
			.notNull()
			.default([]),
		hostId: text('host_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [index('spar_hostId_idx').on(table.hostId), index('spar_status_idx').on(table.status)]
);

export const sparParticipant = pgTable(
	'spar_participant',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		sparId: text('spar_id')
			.notNull()
			.references(() => spar.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		role: text('role').notNull().default('debater'),
		status: text('status').notNull().default('pending'),
		joinedAt: timestamp('joined_at').defaultNow().notNull()
	},
	(table) => [
		index('sparParticipant_sparId_idx').on(table.sparId),
		index('sparParticipant_userId_idx').on(table.userId)
	]
);

// ===== User Profile =====

export const userProfile = pgTable('user_profile', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id')
		.notNull()
		.unique()
		.references(() => user.id, { onDelete: 'cascade' }),
	bio: text('bio').default(''),
	experienceLevel: text('experience_level').default('Beginner'),
	preferredFormats: text('preferred_formats')
		.array()
		.default([]),
	interests: text('interests')
		.array()
		.default([]),
	honors: jsonb('honors_v2').default([]).$type<Honor[]>(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull()
});

// ===== Notifications =====

export const notification = pgTable(
	'notification',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		type: text('type').notNull(), // 'spar_upcoming', 'spar_invitation', 'spar_accepted'
		title: text('title').notNull(),
		message: text('message').notNull(),
		link: text('link'),
		read: boolean('read').notNull().default(false),
		metadata: jsonb('metadata').$type<{
			sparId?: string;
			role?: string;
			inviterId?: string;
			inviterName?: string;
		}>(),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(table) => [index('notification_userId_idx').on(table.userId), index('notification_read_idx').on(table.read)]
);

// ===== Relations =====

export const sparRelations = relations(spar, ({ one, many }) => ({
	host: one(user, { fields: [spar.hostId], references: [user.id] }),
	participants: many(sparParticipant)
}));

export const sparParticipantRelations = relations(sparParticipant, ({ one }) => ({
	spar: one(spar, { fields: [sparParticipant.sparId], references: [spar.id] }),
	user: one(user, { fields: [sparParticipant.userId], references: [user.id] })
}));

export const userProfileRelations = relations(userProfile, ({ one }) => ({
	user: one(user, { fields: [userProfile.userId], references: [user.id] })
}));

export const notificationRelations = relations(notification, ({ one }) => ({
	user: one(user, { fields: [notification.userId], references: [user.id] })
}));

// ===== AI Sessions =====

export const aiSession = pgTable('ai_session', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	topic: text('topic').notNull(),
	language: text('language').notNull().default('en'), // 'en' or 'vi'
	mode: text('mode').notNull().default('chat'), // 'chat' or 'voice'
	createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => [
	index('aiSession_userId_idx').on(table.userId)
]);

export const aiMessage = pgTable('ai_message', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	sessionId: text('session_id')
		.notNull()
		.references(() => aiSession.id, { onDelete: 'cascade' }),
	role: text('role').notNull(), // 'user', 'assistant', 'system'
	content: text('content').notNull(),
	audioUrl: text('audio_url'), // cache url for TTS if generated
	createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => [
	index('aiMessage_sessionId_idx').on(table.sessionId)
]);

export const aiSessionRelations = relations(aiSession, ({ one, many }) => ({
	user: one(user, { fields: [aiSession.userId], references: [user.id] }),
	messages: many(aiMessage)
}));

export const aiMessageRelations = relations(aiMessage, ({ one }) => ({
	session: one(aiSession, { fields: [aiMessage.sessionId], references: [aiSession.id] })
}));
