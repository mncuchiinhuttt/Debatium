<script lang="ts">
	import { X, Users, Clock, Star, Zap, MapPin, User, Trash2, CheckCircle2, XCircle, ChevronDown, MessageSquare, Gavel, Plus } from 'lucide-svelte';
	import { Select } from 'bits-ui';

	type SparDetail = {
		id: string;
		title: string;
		description: string;
		format: string;
		level: string;
		maxParticipants: number;
		scheduledAt: string;
		status: string;
		tags: string[];
		hostId: string;
		host: { id: string; name: string; image: string | null } | null;
		participants: Array<{
			id: string;
			role: string;
			status: string;
			userId: string;
			userName: string;
			userImage: string | null;
		}>;
		participantCount: number;
	};

	let {
		open = $bindable(false),
		sparId = '',
		currentUserId = '',
		onJoined
	}: { open: boolean; sparId: string; currentUserId?: string; onJoined?: () => void } = $props();

	let sparData = $state<SparDetail | null>(null);
	let loading = $state(false);
	let joining = $state(false);
	let deleting = $state(false);
	let confirmDelete = $state(false);
	let actionUserId = $state('');
	let joinError = $state('');
	let joinRole = $state('debater');

	// Invitation state
	let inviteSearchQuery = $state('');
	let inviteSearchResults = $state<any[]>([]);
	let isSearchingUsers = $state(false);
	let selectedUserToInvite = $state<any | null>(null);
	let inviteRole = $state('debater');
	let inviting = $state(false);
	let inviteError = $state('');
	let inviteSuccess = $state(false);
	let searchTimeout: ReturnType<typeof setTimeout>;

	// Computed states
	let isHost = $derived(currentUserId && sparData?.hostId === currentUserId);
	let currentUserParticipant = $derived(sparData?.participants?.find(p => p.userId === currentUserId));
	let approvedParticipants = $derived(sparData?.participants?.filter(p => p.status === 'approved' && p.userId !== sparData?.hostId) || []);
	let pendingParticipants = $derived(sparData?.participants?.filter(p => p.status === 'pending' && p.userId !== sparData?.hostId) || []);
	let invitedParticipants = $derived(sparData?.participants?.filter(p => p.status === 'invited' && p.userId !== sparData?.hostId) || []);

	$effect(() => {
		if (open && sparId) {
			loadSpar();
			// Reset invitation state when opening or switching spars
			inviteSearchQuery = '';
			inviteSearchResults = [];
			selectedUserToInvite = null;
			inviteError = '';
			inviteSuccess = false;
		}
	});

	async function loadSpar() {
		loading = true;
		const res = await fetch(`/api/spars/${sparId}`);
		if (res.ok) {
			sparData = await res.json();
		}
		loading = false;
	}

	async function handleJoin() {
		if (!sparId) return;
		joining = true;
		joinError = '';

		const res = await fetch(`/api/spars/${sparId}/join`, { 
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ role: joinRole })
		});

		if (!res.ok) {
			const data = await res.json();
			joinError = data.error || 'Failed to request join';
			joining = false;
			return;
		}

		joining = false;
		onJoined?.();
		await loadSpar();
	}

	async function handleDelete() {
		if (!sparId) return;
		deleting = true;
		
		const res = await fetch(`/api/spars/${sparId}`, { method: 'DELETE' });
		if (res.ok) {
			close();
			onJoined?.();
		}
		deleting = false;
		confirmDelete = false;
	}

	async function handleManageParticipant(userId: string, actionStatus: 'approved' | 'rejected') {
		if (!sparId) return;
		actionUserId = userId;
		
		const res = await fetch(`/api/spars/${sparId}/participants/${userId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: actionStatus })
		});

		actionUserId = '';
		if (res.ok) {
			await loadSpar();
		}
	}

	async function searchUsers(query: string) {
		if (query.length < 2) {
			inviteSearchResults = [];
			return;
		}
		isSearchingUsers = true;
		try {
			const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
			if (res.ok) {
				const data = await res.json();
				// Only keep users who aren't already participants
				const existingUserIds = new Set(sparData?.participants?.map(p => p.userId) || []);
				if (sparData?.hostId) existingUserIds.add(sparData.hostId);
				inviteSearchResults = (data.users || []).filter((u: any) => !existingUserIds.has(u.id));
			}
		} catch (err) {
			console.error(err);
		} finally {
			isSearchingUsers = false;
		}
	}

	async function handleInvite() {
		if (!sparId || !selectedUserToInvite) return;
		inviting = true;
		inviteError = '';
		inviteSuccess = false;

		const res = await fetch(`/api/spars/${sparId}/invite`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ 
				targetUserId: selectedUserToInvite.id, 
				role: inviteRole 
			})
		});

		if (res.ok) {
			inviteSuccess = true;
			inviteSearchQuery = '';
			selectedUserToInvite = null;
			inviteSearchResults = [];
			await loadSpar();
			setTimeout(() => { inviteSuccess = false; }, 3000);
		} else {
			const data = await res.json();
			inviteError = data.error || 'Failed to send invitation';
		}
		inviting = false;
	}

	function handleInviteSearch(e: Event) {
		const target = e.target as HTMLInputElement;
		inviteSearchQuery = target.value;
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => searchUsers(inviteSearchQuery), 300);
	}

	function close() {
		open = false;
		sparData = null;
		joinError = '';
		confirmDelete = false;
		// Reset invitation state
		inviteSearchQuery = '';
		inviteSearchResults = [];
		selectedUserToInvite = null;
		inviteError = '';
		inviteSuccess = false;
	}

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getLevelColor(level: string) {
		switch (level) {
			case 'Beginner':
				return 'text-success bg-success/10';
			case 'Intermediate':
				return 'text-info bg-info/10';
			case 'Advanced':
				return 'text-accent-400 bg-accent-400/10';
			default:
				return 'text-surface-400 bg-surface-700';
		}
	}
</script>

{#if open}
	<div class="dialog-overlay" role="dialog" aria-modal="true">
		<button class="absolute inset-0" onclick={close} aria-label="Close"></button>
		<div class="dialog-content p-6">
			{#if loading}
				<div class="flex items-center justify-center py-16">
					<div class="h-8 w-8 animate-spin rounded-full border-2 border-primary-500/30 border-t-primary-500"></div>
				</div>
			{:else if sparData}
				<!-- Header -->
				<div class="mb-5 flex items-start justify-between gap-4">
					<div class="flex-1">
						<div class="mb-2 flex flex-wrap gap-2">
							{#each sparData.tags as tag}
								<span class="rounded-full bg-surface-800 px-2.5 py-0.5 text-[11px] font-medium text-surface-400">{tag}</span>
							{/each}
							<span class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold {getLevelColor(sparData.level)}">{sparData.level}</span>
						</div>
						<h2 class="font-display text-xl font-bold text-surface-50">{sparData.title}</h2>
					</div>
					<div class="flex items-center gap-1">
						{#if isHost}
							<button
								onclick={() => (confirmDelete = !confirmDelete)}
								class="rounded-lg p-1.5 transition hover:bg-danger/10 {confirmDelete ? 'bg-danger/10 text-danger' : 'text-danger/70 hover:text-danger'}"
								title="Delete Spar"
							>
								<Trash2 size={18} />
							</button>
						{/if}
						<button
							onclick={close}
							class="rounded-lg p-1.5 text-surface-400 transition hover:bg-surface-800 hover:text-surface-200"
						>
							<X size={18} />
						</button>
					</div>
				</div>

				<!-- Description -->
				{#if sparData.description}
					<p class="mb-5 text-sm leading-relaxed text-surface-300">{sparData.description}</p>
				{/if}

				<!-- Info grid -->
				<div class="mb-5 grid grid-cols-2 gap-3">
					<div class="rounded-xl border border-surface-700 bg-surface-800/50 p-3">
						<div class="mb-1 flex items-center gap-1.5 text-xs text-surface-500">
							<MapPin size={12} />
							<span>Format</span>
						</div>
						<p class="text-sm font-semibold text-surface-100">{sparData.format}</p>
					</div>
					<div class="rounded-xl border border-surface-700 bg-surface-800/50 p-3">
						<div class="mb-1 flex items-center gap-1.5 text-xs text-surface-500">
							<Users size={12} />
							<span>Capacity</span>
						</div>
						<p class="text-sm font-semibold text-surface-100">{sparData.participantCount} / {sparData.maxParticipants}</p>
					</div>
					<div class="rounded-xl border border-surface-700 bg-surface-800/50 p-3">
						<div class="mb-1 flex items-center gap-1.5 text-xs text-surface-500">
							<Clock size={12} />
							<span>Scheduled</span>
						</div>
						<p class="text-sm font-semibold text-surface-100">{formatDate(sparData.scheduledAt)}</p>
					</div>
					<div class="rounded-xl border border-surface-700 bg-surface-800/50 p-3">
						<div class="mb-1 flex items-center gap-1.5 text-xs text-surface-500">
							<Star size={12} />
							<span>Status</span>
						</div>
						<p class="text-sm font-semibold capitalize text-surface-100">{sparData.status}</p>
					</div>
				</div>

				<!-- Host -->
				{#if sparData.host}
					<div class="mb-4">
						<p class="mb-2 text-xs font-medium text-surface-500">Host</p>
						<div class="flex items-center gap-2">
							<div class="flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
								{sparData.host.name?.charAt(0)?.toUpperCase() || '?'}
							</div>
							<span class="text-sm font-medium text-surface-200">{sparData.host.name}</span>
						</div>
					</div>
				{/if}

				<!-- Participants (Host + Approved) -->
				<div class="mb-5">
					<p class="mb-2 text-xs font-medium text-surface-500">Participants ({approvedParticipants.length + 1}/{sparData.maxParticipants})</p>
					<div class="space-y-2">
						<!-- Host row -->
						{#if sparData.host}
							<div class="flex items-center gap-2 rounded-lg border border-primary-600/20 bg-primary-600/5 px-3 py-2">
								<div class="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
									{sparData.host.name?.charAt(0)?.toUpperCase() || '?'}
								</div>
								<span class="flex-1 text-sm font-medium text-surface-200">{sparData.host.name}</span>
								{#if sparData.host.id === currentUserId}
									<span class="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success flex items-center gap-1">
										<CheckCircle2 size={10} /> You
									</span>
								{/if}
								<span class="rounded-full bg-primary-600/20 px-2 py-0.5 text-[10px] font-semibold text-primary-400">Host</span>
							</div>
						{/if}
						<!-- Approved participants -->
						{#each approvedParticipants as p}
							<div class="flex items-center gap-2 rounded-lg bg-surface-800/30 px-3 py-2">
								<div class="flex h-6 w-6 items-center justify-center rounded-full bg-surface-700 text-[10px] font-bold text-surface-300">
									{p.userName?.charAt(0)?.toUpperCase() || '?'}
								</div>
								<span class="flex-1 text-sm text-surface-200">{p.userName}</span>
								{#if p.userId === currentUserId}
									<span class="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success flex items-center gap-1">
										<CheckCircle2 size={10} /> You
									</span>
								{/if}
								<span class="rounded-full bg-surface-700 px-2 py-0.5 text-[10px] font-medium capitalize text-surface-400">{p.role}</span>
							</div>
						{/each}
						{#if approvedParticipants.length === 0 && !sparData.host}
							<p class="text-sm text-surface-500 italic">No participants yet</p>
						{/if}
					</div>
				</div>

				<!-- Invite Section (Host Only) -->
				{#if isHost && sparData.status !== 'completed' && sparData.status !== 'cancelled' && approvedParticipants.length + 1 < sparData.maxParticipants}
					<div class="mb-5 rounded-xl border border-dashed border-surface-700 p-4">
						<h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">Invite Debaters</h3>
						
						{#if inviteSuccess}
							<div class="mb-3 rounded-lg bg-success/10 px-3 py-2 text-xs font-medium text-success flex items-center gap-2">
								<CheckCircle2 size={14} /> Invitation sent successfully!
							</div>
						{/if}

						{#if inviteError}
							<div class="mb-3 rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
								{inviteError}
							</div>
						{/if}

						<div class="space-y-3">
							<!-- User Selection -->
							<div class="relative">
								<div class="relative">
									<User size={14} class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
									<input
										type="text"
										placeholder="Search by name or honors..."
										value={inviteSearchQuery}
										oninput={handleInviteSearch}
										class="w-full rounded-lg border border-surface-700 bg-surface-900 py-2 pl-9 pr-3 text-sm text-surface-100 placeholder-surface-500 outline-none focus:border-primary-500"
									/>
									{#if isSearchingUsers}
										<div class="absolute right-3 top-1/2 -translate-y-1/2">
											<div class="h-3 w-3 animate-spin rounded-full border border-primary-500/30 border-t-primary-500"></div>
										</div>
									{/if}
								</div>

								{#if inviteSearchResults.length > 0 && !selectedUserToInvite}
									<div class="absolute left-0 top-full z-[60] mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-surface-700 bg-surface-800 p-1 shadow-xl">
										{#each inviteSearchResults as u}
											<button 
												onclick={() => { selectedUserToInvite = u; inviteSearchQuery = u.name; }}
												class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-surface-700 transition"
											>
												<div class="flex h-6 w-6 items-center justify-center rounded-full bg-accent-400/20 text-[10px] font-bold text-accent-400">
													{u.name?.charAt(0)?.toUpperCase()}
												</div>
												<div class="min-w-0 flex-1">
													<p class="truncate text-xs font-medium text-surface-100">{u.name}</p>
													{#if u.experienceLevel}
														<p class="text-[10px] text-surface-500">{u.experienceLevel}</p>
													{/if}
												</div>
											</button>
										{/each}
									</div>
								{/if}
							</div>

							{#if selectedUserToInvite}
								<div class="flex items-center gap-3">
									<div class="flex-1">
										<Select.Root type="single" bind:value={inviteRole}>
											<Select.Trigger class="flex h-9 w-full items-center justify-between rounded-lg border border-surface-700 bg-surface-900 px-3 py-2 text-xs font-medium text-surface-200 outline-none transition focus:border-primary-500">
												<div class="flex items-center gap-2">
													{#if inviteRole === 'debater'}
														<MessageSquare size={12} class="text-primary-400" />
													{:else}
														<Gavel size={12} class="text-accent-400" />
													{/if}
													<span class="capitalize">{inviteRole}</span>
												</div>
												<ChevronDown size={12} class="text-surface-400" />
											</Select.Trigger>
											<Select.Content class="z-[60] w-[--bits-select-anchor-width] rounded-lg border border-surface-700 bg-surface-800 p-1 shadow-lg outline-none">
												<Select.Item value="debater" class="relative flex w-full cursor-pointer select-none items-center gap-2 rounded px-2 py-1.5 text-xs text-surface-200 outline-none hover:bg-surface-700">
													<MessageSquare size={12} class="text-primary-400" /> Debater
												</Select.Item>
												<Select.Item value="judge" class="relative flex w-full cursor-pointer select-none items-center gap-2 rounded px-2 py-1.5 text-xs text-surface-200 outline-none hover:bg-surface-700">
													<Gavel size={12} class="text-accent-400" /> Judge
												</Select.Item>
											</Select.Content>
										</Select.Root>
									</div>
									<button
										onclick={handleInvite}
										disabled={inviting}
										class="flex h-9 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-500 disabled:opacity-60"
									>
										{#if inviting}
											<div class="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white"></div>
										{:else}
											<Plus size={14} />
											<span>Invite</span>
										{/if}
									</button>
									<button 
										onclick={() => { selectedUserToInvite = null; inviteSearchQuery = ''; }}
										class="rounded-lg p-2 text-surface-500 hover:text-surface-300 hover:bg-surface-800 transition"
									>
										<X size={14} />
									</button>
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Invited Participants -->
				{#if invitedParticipants.length > 0}
					<div class="mb-5">
						<p class="mb-2 text-xs font-medium text-accent-400">Invited ({invitedParticipants.length})</p>
						<div class="space-y-2">
							{#each invitedParticipants as p}
								<div class="flex items-center gap-2 rounded-lg border border-accent-400/10 bg-accent-400/5 px-3 py-2">
									<div class="flex h-6 w-6 items-center justify-center rounded-full bg-accent-400/20 text-[10px] font-bold text-accent-400">
										{p.userName?.charAt(0)?.toUpperCase() || '?'}
									</div>
									<div class="flex-1 min-w-0">
										<span class="block truncate text-sm font-medium text-surface-200">{p.userName}</span>
										<span class="block text-[10px] text-surface-400 italic">Invitation pending as <span class="capitalize text-accent-400">{p.role}</span></span>
									</div>
									{#if isHost}
										<button onclick={() => handleManageParticipant(p.userId, 'rejected')} class="p-1.5 text-surface-500 hover:text-danger hover:bg-danger/10 rounded-lg transition" title="Cancel Invitation">
											<X size={14} />
										</button>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Pending Requests (Only visible to host or if you are pending) -->
				{#if (isHost || currentUserParticipant?.status === 'pending') && pendingParticipants.length > 0}
					<div class="mb-5">
						<div class="mb-2 flex items-center justify-between">
							<p class="text-xs font-medium text-warning">Pending Approval ({pendingParticipants.length})</p>
						</div>
						<div class="space-y-2">
							{#each pendingParticipants as p}
								<div class="flex items-center gap-2 rounded-lg border border-warning/10 bg-warning/5 px-3 py-2">
									<div class="flex h-6 w-6 items-center justify-center rounded-full bg-warning/20 text-[10px] font-bold text-warning-400">
										{p.userName?.charAt(0)?.toUpperCase() || '?'}
									</div>
									<div class="flex-1 min-w-0">
										<span class="block truncate text-sm font-medium text-surface-200">{p.userName}</span>
										<span class="block text-[10px] text-surface-400">Requesting as <span class="capitalize text-warning-400">{p.role}</span></span>
									</div>
									
									{#if isHost}
										<div class="flex items-center gap-1.5 ml-2">
											{#if actionUserId === p.userId}
												<div class="h-4 w-4 animate-spin rounded-full border-2 border-surface-500/30 border-t-surface-500"></div>
											{:else}
												<button onclick={() => handleManageParticipant(p.userId, 'approved')} class="rounded-lg bg-success/20 p-1.5 text-success transition hover:bg-success hover:text-white" title="Approve">
													<CheckCircle2 size={14} />
												</button>
												<button onclick={() => handleManageParticipant(p.userId, 'rejected')} class="rounded-lg bg-danger/20 p-1.5 text-danger transition hover:bg-danger hover:text-white" title="Deny">
													<XCircle size={14} />
												</button>
											{/if}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Delete Confirmation Banner -->
				{#if confirmDelete}
					<div class="mb-4 rounded-xl border border-danger/30 bg-danger/10 p-4">
						<p class="mb-1 text-sm font-semibold text-danger">Delete this spar?</p>
						<p class="mb-3 text-xs text-surface-400">This action cannot be undone. All join requests will be removed.</p>
						<div class="flex gap-2">
							<button
								onclick={handleDelete}
								disabled={deleting}
								class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
							>
								{#if deleting}
									<div class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
									<span>Deleting…</span>
								{:else}
									<Trash2 size={14} />
									<span>Delete Spar</span>
								{/if}
							</button>
							<button
								onclick={() => (confirmDelete = false)}
								disabled={deleting}
								class="rounded-lg border border-surface-600 px-4 py-2 text-sm font-medium text-surface-300 transition hover:bg-surface-700 disabled:opacity-60"
							>
								Cancel
							</button>
						</div>
					</div>
				{/if}

				<!-- Join Error -->
				{#if joinError}
					<div class="mb-3 rounded-xl border border-danger/20 bg-danger/10 px-4 py-2 text-sm text-danger">
						{joinError}
					</div>
				{/if}

				<!-- Call to Action Footer -->
				{#if isHost}
					<div class="rounded-xl bg-surface-800 py-3 text-center text-sm font-medium text-surface-500">
						You are the host of this spar
					</div>
				{:else if currentUserParticipant}
					{#if currentUserParticipant.status === 'pending'}
						<div class="flex items-center justify-center gap-2 rounded-xl border border-warning/20 bg-warning/10 py-3 text-sm font-medium text-warning">
							<Clock size={16} />
							<span>Your request to join as a {currentUserParticipant.role} is pending approval.</span>
						</div>
					{:else if currentUserParticipant.status === 'approved'}
						<div class="flex items-center justify-center gap-2 rounded-xl bg-success/10 py-3 text-sm font-medium text-success">
							<CheckCircle2 size={16} />
							<span>You are participating in this spar!</span>
						</div>
					{:else}
						<div class="rounded-xl border border-danger/20 bg-danger/10 py-3 text-center text-sm font-medium text-danger">
							Your request to join was denied.
						</div>
					{/if}
				{:else if sparData.status !== 'full' && sparData.status !== 'completed' && sparData.status !== 'cancelled'}
					<div class="flex flex-col gap-3 sm:flex-row">
						<div class="w-full sm:w-40">
							<Select.Root type="single" bind:value={joinRole}>
								<Select.Trigger class="flex h-[46px] w-full items-center justify-between rounded-xl border border-surface-700 bg-surface-800/50 px-3 py-3 text-sm font-medium text-surface-200 outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20">
									<div class="flex items-center gap-2">
										{#if joinRole === 'debater'}
											<MessageSquare size={14} class="text-primary-400" />
										{:else}
											<Gavel size={14} class="text-accent-400" />
										{/if}
										<span class="capitalize">{joinRole}</span>
									</div>
									<ChevronDown size={14} class="text-surface-400" />
								</Select.Trigger>
								<Select.Content class="z-50 w-[--bits-select-anchor-width] rounded-xl border border-surface-700 bg-surface-800 p-1 shadow-lg shadow-black/20 outline-none">
									<Select.Item value="debater" class="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-200 outline-none transition hover:bg-surface-700 hover:text-surface-50 data-highlighted:bg-surface-700 data-highlighted:text-surface-50">
										<MessageSquare size={14} class="text-primary-400 opacity-80" />
										Debater
									</Select.Item>
									<Select.Item value="judge" class="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-200 outline-none transition hover:bg-surface-700 hover:text-surface-50 data-highlighted:bg-surface-700 data-highlighted:text-surface-50">
										<Gavel size={14} class="text-accent-400 opacity-80" />
										Judge
									</Select.Item>
								</Select.Content>
							</Select.Root>
						</div>

						<button
							onclick={handleJoin}
							disabled={joining}
							class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 font-semibold text-white transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{#if joining}
								<div class="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
							{:else}
								<Zap size={16} />
								<span>Request to Join</span>
							{/if}
						</button>
					</div>
				{:else}
					<div class="rounded-xl bg-surface-800 py-3 text-center text-sm font-medium text-surface-500">
						This spar is {sparData.status}
					</div>
				{/if}
			{/if}
		</div>
	</div>
{/if}
