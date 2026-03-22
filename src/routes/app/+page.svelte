<script lang="ts">
	import {
		Compass,
		Swords,
		Plus,
		Filter,
		Users,
		Clock,
		Trophy,
		Zap,
		ChevronRight,
		Bot,
		Globe,
		BarChart3,
		Star,
		TrendingUp,
		ArrowRight
	} from 'lucide-svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import CreateSparDialog from '$lib/components/CreateSparDialog.svelte';
	import SparDetailDialog from '$lib/components/SparDetailDialog.svelte';
	import UserProfileDialog from '$lib/components/UserProfileDialog.svelte';

	let { data } = $props();

	let activeTab = $state<'discover' | 'my-spars' | 'history' | 'users'>('discover');
	let createDialogOpen = $state(false);
	let detailDialogOpen = $state(false);
	let filterOpen = $state(false);
	let selectedSparId = $state('');
	
	let userDialogOpen = $state(false);
	let selectedUserId = $state('');

	function applyFilter(key: string, value: string) {
		const url = new URL(window.location.href);
		if (value) {
			url.searchParams.set(key, value);
		} else {
			url.searchParams.delete(key);
		}
		filterOpen = false;
		goto(url.toString(), { keepFocus: true, noScroll: true });
	}

	function openSparDetail(id: string) {
		selectedSparId = id;
		detailDialogOpen = true;
	}

	function openUser(id: string) {
		selectedUserId = id;
		userDialogOpen = true;
	}

	function formatDate(dateStr: string | Date) {
		return new Date(dateStr).toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
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

<div class="mx-auto max-w-7xl space-y-6">
	<!-- Welcome + Stats Bar -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="font-display text-2xl font-bold text-surface-50">Dashboard</h1>
			<p class="text-sm text-surface-400">Find and join debates or start your own</p>
		</div>
		<div class="flex gap-3">
			<div class="flex items-center gap-2 rounded-xl border border-surface-800 bg-surface-900 px-4 py-2">
				<Trophy size={16} class="text-accent-400" />
				<span class="text-sm font-medium text-surface-200">{data.mySpars?.length || 0} Spars</span>
			</div>
			<div class="flex items-center gap-2 rounded-xl border border-surface-800 bg-surface-900 px-4 py-2">
				<TrendingUp size={16} class="text-success" />
				<span class="text-sm font-medium text-surface-200">{data.historyItems?.length || 0} Completed</span>
			</div>
		</div>
	</div>

	<!-- Quick Actions Strip -->
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
		<button
			onclick={() => (createDialogOpen = true)}
			class="group flex items-center gap-4 rounded-2xl border border-primary-600/20 bg-gradient-to-r from-primary-600/10 to-primary-500/5 p-4 text-left transition hover:border-primary-500/30 hover:shadow-lg hover:shadow-primary-600/5"
		>
			<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600/20 text-primary-400 transition group-hover:bg-primary-600/30">
				<Plus size={20} />
			</div>
			<div>
				<p class="font-semibold text-surface-100">Create a Spar</p>
				<p class="text-xs text-surface-500">Host your own debate</p>
			</div>
			<ChevronRight size={16} class="ml-auto text-surface-600 transition group-hover:text-primary-400" />
		</button>

		<a
			href="/app/ai-sessions"
			class="group flex items-center gap-4 rounded-2xl border border-accent-400/20 bg-gradient-to-r from-accent-400/10 to-accent-500/5 p-4 transition hover:border-accent-400/30 hover:shadow-lg hover:shadow-accent-400/5"
		>
			<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-400/20 text-accent-400 transition group-hover:bg-accent-400/30">
				<Bot size={20} />
			</div>
			<div>
				<p class="font-semibold text-surface-100">AI Practice</p>
				<p class="text-xs text-surface-500">Train with AI opponents</p>
			</div>
			<ChevronRight size={16} class="ml-auto text-surface-600 transition group-hover:text-accent-400" />
		</a>

		<a
			href="/app/calendar"
			class="group flex items-center gap-4 rounded-2xl border border-surface-700 bg-surface-900 p-4 transition hover:border-surface-600 hover:shadow-lg"
		>
			<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-700 text-surface-300 transition group-hover:bg-surface-600">
				<Globe size={20} />
			</div>
			<div>
				<p class="font-semibold text-surface-100">Browse Calendar</p>
				<p class="text-xs text-surface-500">View all scheduled spars</p>
			</div>
			<ChevronRight size={16} class="ml-auto text-surface-600 transition group-hover:text-surface-300" />
		</a>
	</div>

	<!-- Tabs -->
	<div class="flex items-center gap-1 rounded-xl border border-surface-800 bg-surface-900 p-1">
		<button
			onclick={() => (activeTab = 'discover')}
			class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition
			{activeTab === 'discover' ? 'bg-primary-600/15 text-primary-400' : 'text-surface-400 hover:text-surface-200'}"
		>
			<Compass size={16} />
			<span>Discover</span>
		</button>
		<button
			onclick={() => (activeTab = 'my-spars')}
			class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition
			{activeTab === 'my-spars' ? 'bg-primary-600/15 text-primary-400' : 'text-surface-400 hover:text-surface-200'}"
		>
			<Swords size={16} />
			<span>My Spars</span>
			{#if data.mySpars?.length}
				<span class="rounded-full bg-primary-600/20 px-1.5 text-xs font-bold text-primary-400">{data.mySpars.length}</span>
			{/if}
		</button>
		<button
			onclick={() => (activeTab = 'history')}
			class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition
			{activeTab === 'history' ? 'bg-primary-600/15 text-primary-400' : 'text-surface-400 hover:text-surface-200'}"
		>
			<BarChart3 size={16} />
			<span>History</span>
		</button>
		<button
			onclick={() => (activeTab = 'users')}
			class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition
			{activeTab === 'users' ? 'bg-primary-600/15 text-primary-400' : 'text-surface-400 hover:text-surface-200'}"
		>
			<Users size={16} />
			<span>Debaters</span>
		</button>

		<!-- Filter button -->
		<div class="relative ml-auto">
			<button 
				onclick={() => filterOpen = !filterOpen}
				class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition {filterOpen || page.url.searchParams.has('format') || page.url.searchParams.has('level') ? 'bg-surface-800 text-surface-200' : 'text-surface-400 hover:bg-surface-800 hover:text-surface-200'}">
				<Filter size={16} />
				<span>Filters</span>
				{#if page.url.searchParams.has('format') || page.url.searchParams.has('level')}
					<span class="h-2 w-2 rounded-full bg-primary-500"></span>
				{/if}
			</button>

			{#if filterOpen}
				<div class="absolute right-0 top-full mt-2 w-64 z-50 rounded-xl border border-surface-700 bg-surface-800 p-4 shadow-xl">
					<h4 class="mb-3 text-sm font-semibold text-surface-100">Filter By Format</h4>
					<div class="mb-4 flex flex-wrap gap-2">
						<button onclick={() => applyFilter('format', '')} class="rounded border px-2 py-1 text-xs {(!page.url.searchParams.has('format')) ? 'border-primary-500 bg-primary-600/20 text-primary-400' : 'border-surface-600 text-surface-400'}">All</button>
						<button onclick={() => applyFilter('format', 'Oxford')} class="rounded border px-2 py-1 text-xs {(page.url.searchParams.get('format') === 'Oxford') ? 'border-primary-500 bg-primary-600/20 text-primary-400' : 'border-surface-600 text-surface-400'}">Oxford</button>
						<button onclick={() => applyFilter('format', 'Lincoln-Douglas')} class="rounded border px-2 py-1 text-xs {(page.url.searchParams.get('format') === 'Lincoln-Douglas') ? 'border-primary-500 bg-primary-600/20 text-primary-400' : 'border-surface-600 text-surface-400'}">L-D</button>
						<button onclick={() => applyFilter('format', 'Parliamentary')} class="rounded border px-2 py-1 text-xs {(page.url.searchParams.get('format') === 'Parliamentary') ? 'border-primary-500 bg-primary-600/20 text-primary-400' : 'border-surface-600 text-surface-400'}">Parliamentary</button>
					</div>

					<h4 class="mb-3 text-sm font-semibold text-surface-100">Filter By Level</h4>
					<div class="flex flex-wrap gap-2 mb-2">
						<button onclick={() => applyFilter('level', '')} class="rounded border px-2 py-1 text-xs {(!page.url.searchParams.has('level')) ? 'border-primary-500 bg-primary-600/20 text-primary-400' : 'border-surface-600 text-surface-400'}">All</button>
						<button onclick={() => applyFilter('level', 'Beginner')} class="rounded border px-2 py-1 text-xs {(page.url.searchParams.get('level') === 'Beginner') ? 'border-primary-500 bg-primary-600/20 text-primary-400' : 'border-surface-600 text-surface-400'}">Beginner</button>
						<button onclick={() => applyFilter('level', 'Intermediate')} class="rounded border px-2 py-1 text-xs {(page.url.searchParams.get('level') === 'Intermediate') ? 'border-primary-500 bg-primary-600/20 text-primary-400' : 'border-surface-600 text-surface-400'}">Intermediate</button>
						<button onclick={() => applyFilter('level', 'Advanced')} class="rounded border px-2 py-1 text-xs {(page.url.searchParams.get('level') === 'Advanced') ? 'border-primary-500 bg-primary-600/20 text-primary-400' : 'border-surface-600 text-surface-400'}">Advanced</button>
						<button onclick={() => applyFilter('level', 'Expert')} class="rounded border px-2 py-1 text-xs {(page.url.searchParams.get('level') === 'Expert') ? 'border-primary-500 bg-primary-600/20 text-primary-400' : 'border-surface-600 text-surface-400'}">Expert</button>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Content based on active tab -->
	{#if activeTab === 'discover'}
		<!-- My Upcoming Spars strip -->
		{#if data.mySpars && data.mySpars.filter(s => s.status !== 'completed').length > 0}
			<div class="rounded-2xl border border-primary-600/20 bg-primary-600/5 p-4">
				<div class="mb-3 flex items-center gap-2">
					<Swords size={16} class="text-primary-400" />
					<h2 class="text-sm font-semibold text-primary-300">My Upcoming Spars</h2>
					<span class="ml-auto text-xs text-surface-500">{data.mySpars.filter(s => s.status !== 'completed').length} active</span>
				</div>
				<div class="flex gap-3 overflow-x-auto pb-1">
					{#each data.mySpars.filter(s => s.status !== 'completed').slice(0, 5) as s}
						<button
							onclick={() => openSparDetail(s.id)}
							class="group flex shrink-0 flex-col gap-1.5 rounded-xl border border-surface-700 bg-surface-900 p-3 text-left transition hover:border-primary-500/40 hover:bg-surface-800"
							style="min-width: 200px; max-width: 220px;"
						>
							<div class="flex items-center gap-2">
								<span class="rounded-full px-2 py-0.5 text-[10px] font-semibold {getLevelColor(s.level)}">{s.level}</span>
								<span class="ml-auto rounded-full bg-surface-800 px-2 py-0.5 text-[10px] font-medium text-surface-400">{s.format}</span>
							</div>
							<p class="line-clamp-1 text-sm font-semibold text-surface-100 group-hover:text-primary-300">{s.title}</p>
							<div class="flex items-center gap-1.5 text-xs text-surface-500">
								<Clock size={11} />
								<span class="line-clamp-1">{formatDate(s.scheduledAt)}</span>
							</div>
							{#if 'role' in s}
								<span class="self-start rounded-full bg-primary-600/20 px-2 py-0.5 text-[10px] font-medium capitalize text-primary-400">{s.role}</span>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Discover Grid -->
		{#if data.discoverSpars.length === 0}
			<div class="flex flex-col items-center py-16 text-center">
				<Compass size={48} class="mb-4 text-surface-700" />
				<h3 class="font-display text-lg font-semibold text-surface-400">No spars yet</h3>
				<p class="mt-1 text-sm text-surface-500">Be the first! Create a spar to get started</p>
				<button
					onclick={() => (createDialogOpen = true)}
					class="mt-4 flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-500"
				>
					<Plus size={16} />
					<span>Create a Spar</span>
				</button>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each data.discoverSpars as s}
					<button
						onclick={() => openSparDetail(s.id)}
						class="group rounded-2xl border border-surface-800 bg-surface-900 p-5 text-left transition hover:border-surface-700 hover:shadow-lg"
					>
						<!-- Tags -->
						<div class="mb-3 flex flex-wrap gap-2">
							{#each s.tags as tag}
								<span class="rounded-full bg-surface-800 px-2.5 py-0.5 text-[11px] font-medium text-surface-400">{tag}</span>
							{/each}
							<span class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold {getLevelColor(s.level)}">{s.level}</span>
						</div>

						<!-- Title -->
						<h3 class="mb-2 line-clamp-2 font-display text-lg font-semibold text-surface-100 transition group-hover:text-primary-400">
							{s.title}
						</h3>

						<!-- Meta -->
						<div class="mb-4 space-y-1.5 text-xs text-surface-500">
							<div class="flex items-center gap-2">
								<Users size={13} />
								<span>{s.participantCount}/{s.maxParticipants} participants</span>
								<span class="ml-auto rounded-full bg-surface-800 px-2 py-0.5 text-[10px] font-medium text-surface-400">{s.format}</span>
							</div>
							<div class="flex items-center gap-2">
								<Clock size={13} />
								<span>{formatDate(s.scheduledAt)}</span>
							</div>
							<div class="flex items-center gap-2">
								<Star size={13} />
								<span>Hosted by {s.hostName}</span>
							</div>
						</div>

						<!-- Capacity bar -->
						<div class="mb-4">
							<div class="h-1 w-full overflow-hidden rounded-full bg-surface-800">
								<div
									class="h-full rounded-full bg-primary-500 transition-all"
									style="width: {(Number(s.participantCount) / s.maxParticipants) * 100}%"
								></div>
							</div>
						</div>

						<!-- View details indicator -->
						<div class="flex w-full items-center justify-center gap-2 rounded-xl border border-primary-600/30 bg-primary-600/10 py-2.5 text-sm font-semibold text-primary-400 transition group-hover:bg-primary-600 group-hover:text-white">
							<Zap size={15} />
							<span>View Details</span>
						</div>
					</button>
				{/each}
			</div>
		{/if}
	{:else if activeTab === 'my-spars'}
		<!-- My Spars List -->
		<div class="space-y-3">
			{#each data.mySpars as s}
				<button
					onclick={() => openSparDetail(s.id)}
					class="flex w-full items-center gap-4 rounded-2xl border border-surface-800 bg-surface-900 p-5 text-left transition hover:border-surface-700"
				>
					<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl {s.status === 'ready' ? 'bg-success/10 text-success' : 'bg-primary-600/10 text-primary-400'}">
						<Swords size={22} />
					</div>
					<div class="min-w-0 flex-1">
						<h3 class="truncate font-display text-base font-semibold text-surface-100">{s.title}</h3>
						<div class="mt-1 flex items-center gap-3 text-xs text-surface-500">
							<span class="rounded-full bg-surface-800 px-2 py-0.5">{s.format}</span>
							<span class="flex items-center gap-1">
								<Clock size={11} />
								{formatDate(s.scheduledAt)}
							</span>
						</div>
					</div>
					<div class="flex items-center gap-3">
						<span class="rounded-full px-3 py-1 text-xs font-semibold capitalize {s.status === 'filling' ? 'bg-info/10 text-info' : 'bg-success/10 text-success'}">
							{s.status}
						</span>
						<ArrowRight size={18} class="text-surface-400" />
					</div>
				</button>
			{/each}

			{#if data.mySpars.length === 0}
				<div class="flex flex-col items-center py-16 text-center">
					<Swords size={48} class="mb-4 text-surface-700" />
					<h3 class="font-display text-lg font-semibold text-surface-400">No active spars</h3>
					<p class="mt-1 text-sm text-surface-500">Create or join a debate to get started</p>
				</div>
			{/if}
		</div>
	{:else if activeTab === 'history'}
		<!-- History -->
		<div class="space-y-3">
			{#each data.historyItems as item}
				<button
					onclick={() => openSparDetail(item.id)}
					class="flex w-full items-center gap-4 rounded-2xl border border-surface-800 bg-surface-900 p-5 text-left transition hover:border-surface-700"
				>
					<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-700/50 text-surface-400">
						<Trophy size={22} />
					</div>
					<div class="min-w-0 flex-1">
						<h3 class="truncate font-display text-base font-semibold text-surface-100">{item.title}</h3>
						<div class="mt-1 flex items-center gap-3 text-xs text-surface-500">
							<span class="rounded-full bg-surface-800 px-2 py-0.5">{item.format}</span>
							<span>{formatDate(item.scheduledAt)}</span>
						</div>
					</div>
					<span class="rounded-full bg-surface-700 px-3 py-1 text-xs font-semibold text-surface-400">Completed</span>
				</button>
			{/each}

			{#if data.historyItems.length === 0}
				<div class="flex flex-col items-center py-16 text-center">
					<BarChart3 size={48} class="mb-4 text-surface-700" />
					<h3 class="font-display text-lg font-semibold text-surface-400">No history yet</h3>
					<p class="mt-1 text-sm text-surface-500">Completed spars will appear here</p>
				</div>
			{/if}
		</div>
	{:else}
		<!-- Users Grid -->
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each data.discoverUsers as u}
				<button onclick={() => openUser(u.id)} class="w-full text-left rounded-2xl border border-surface-800 bg-surface-900 p-5 transition hover:border-surface-700 hover:shadow-lg">
					<div class="flex items-center gap-3 mb-4">
						<div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-lg font-bold text-white shrink-0">
							{u.name?.charAt(0)?.toUpperCase()}
						</div>
						<div class="min-w-0 flex-1">
							<h3 class="truncate font-display text-base font-bold text-surface-100">{u.name}</h3>
							<p class="truncate text-xs text-surface-500">{u.email}</p>
						</div>
						<div class="rounded-full bg-surface-800 p-2 text-surface-400 transition hover:bg-surface-700 hover:text-surface-200 ml-auto shrink-0">
							<ArrowRight size={16} />
						</div>
					</div>
					{#if u.bio}
						<p class="mb-4 text-sm text-surface-400 line-clamp-2">{u.bio}</p>
					{/if}
					<div class="mb-4 flex flex-wrap gap-2 text-[11px] font-medium">
						{#if u.experienceLevel}
							<span class="rounded-full px-2.5 py-0.5 {getLevelColor(u.experienceLevel)}">{u.experienceLevel}</span>
						{/if}
						{#each u.preferredFormats || [] as fmt}
							<span class="rounded-full bg-surface-800 text-surface-400 px-2.5 py-0.5">{fmt}</span>
						{/each}
					</div>
					{#if u.honors && u.honors.length > 0}
						<div class="space-y-1">
							<div class="text-xs font-semibold text-surface-300 flex items-center gap-1"><Trophy size={11}/> Honors:</div>
							<div class="flex flex-wrap gap-1">
								{#each u.honors.slice(0, 3) as honor}
									<span class="rounded bg-accent-400/10 text-accent-400 px-1.5 py-0.5 text-[10px] whitespace-nowrap">{honor}</span>
								{/each}
								{#if u.honors.length > 3}
									<span class="text-xs text-surface-500">+{u.honors.length - 3}</span>
								{/if}
							</div>
						</div>
					{/if}
				</button>
			{/each}
			
			{#if data.discoverUsers.length === 0}
				<div class="col-span-full flex flex-col items-center py-16 text-center">
					<Users size={48} class="mb-4 text-surface-700" />
					<h3 class="font-display text-lg font-semibold text-surface-400">No debaters found</h3>
					<p class="mt-1 text-sm text-surface-500">Try adjusting your search or filters</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<CreateSparDialog bind:open={createDialogOpen} onCreated={() => { window.location.reload(); }} />
<SparDetailDialog bind:open={detailDialogOpen} sparId={selectedSparId} currentUserId={data.user?.id} onJoined={() => { window.location.reload(); }} />
<UserProfileDialog bind:open={userDialogOpen} userId={selectedUserId} />
