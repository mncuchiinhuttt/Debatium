<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { navigating } from '$app/stores';
	import { authClient } from '$lib/auth-client';
	import { toggleMode, mode } from 'mode-watcher';
	import CreateSparDialog from '$lib/components/CreateSparDialog.svelte';
	import SparDetailDialog from '$lib/components/SparDetailDialog.svelte';
	import UserProfileDialog from '$lib/components/UserProfileDialog.svelte';
import {
		Compass,
		CalendarDays,
		Search,
		Bell,
		LogOut,
		Menu,
		X,
		Bot,
		ChevronDown,
		Plus,
		Settings,
		UserCircle,
		Sun,
		Moon,
		Swords,
		CheckCircle2,
		Clock
	} from 'lucide-svelte';

	let { children, data } = $props();

	let sidebarOpen = $state(false);
	let userMenuOpen = $state(false);
	let createDialogOpen = $state(false);
	
	// Notification dropdown state
	let notificationsOpen = $state(false);
	let notifications = $state<any[]>([]);
	let unreadCount = $derived(notifications.filter((n) => !n.read).length);

	async function fetchNotifications() {
		try {
			const res = await fetch('/api/notifications');
			if (res.ok) {
				notifications = await res.json();
			}
		} catch (err) {
			console.error('Failed to fetch notifications:', err);
		}
	}

	async function markAllAsRead() {
		try {
			const res = await fetch('/api/notifications', { method: 'PUT' });
			if (res.ok) {
				notifications = notifications.map((n) => ({ ...n, read: true }));
			}
		} catch (err) {
			console.error(err);
		}
	}

	async function markAsRead(id: string) {
		try {
			const res = await fetch(`/api/notifications/${id}`, { method: 'PUT' });
			if (res.ok) {
				notifications = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
			}
		} catch (err) {
			console.error(err);
		}
	}

	$effect(() => {
		if (data.user) {
			fetchNotifications();
			// Refresh every 2 minutes
			const interval = setInterval(fetchNotifications, 120000);
			return () => clearInterval(interval);
		}
	});

	// Shared dialog state
	let selectedSparId = $state('');
	let sparDialogOpen = $state(false);
	let selectedUserId = $state('');
	let userDialogOpen = $state(false);

	// Search dropdown state
	let searchOpen = $state(false);
	let searchQuery = $state(page.url.searchParams.get('q') || '');
	let isSearching = $state(false);
	let searchResults = $state<{ spars: any[]; users: any[] }>({ spars: [], users: [] });
	let searchTimeout: ReturnType<typeof setTimeout>;

	async function handleSearch(e: Event) {
		const target = e.target as HTMLInputElement;
		searchQuery = target.value;
		
		if (searchQuery.length < 2) {
			searchOpen = false;
			searchResults = { spars: [], users: [] };
			return;
		}

		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(async () => {
			isSearching = true;
			searchOpen = true;
			try {
				const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
				if (res.ok) {
					searchResults = await res.json();
				}
			} catch (err) {
				console.error(err);
			} finally {
				isSearching = false;
			}
		}, 300);
	}
	
	function closeSearch() {
		// Delay close so clicks register on dropdown items
		setTimeout(() => { searchOpen = false; }, 200);
	}

	function openSpar(id: string) {
		selectedSparId = id;
		sparDialogOpen = true;
		searchOpen = false;
	}

	function openUser(id: string) {
		selectedUserId = id;
		userDialogOpen = true;
		searchOpen = false;
	}

	const navItems = [
		{ href: '/app', label: 'Discover', icon: Compass },
		{ href: '/app/calendar', label: 'Calendar', icon: CalendarDays },
		{ href: '/app/ai-sessions', label: 'AI Sessions', icon: Bot },
		{ href: '/app/settings', label: 'Settings', icon: Settings }
	];

	function isActive(href: string) {
		if (href === '/app') return page.url.pathname === '/app';
		return page.url.pathname.startsWith(href);
	}

	async function handleLogout() {
		await authClient.signOut();
		goto('/login');
	}
</script>

<svelte:head>
	<title>App — Debatium</title>
</svelte:head>

<div class="flex h-screen bg-surface-950">
	<!-- Mobile overlay -->
	{#if sidebarOpen}
		<button
			class="fixed inset-0 z-40 bg-black/50 lg:hidden"
			onclick={() => (sidebarOpen = false)}
			aria-label="Close sidebar"
		></button>
	{/if}

	<!-- Sidebar -->
	<aside
		class="fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-surface-800 bg-surface-900 transition-transform duration-300 lg:static lg:translate-x-0
		{sidebarOpen ? 'translate-x-0' : '-translate-x-full'}"
	>
		<!-- Sidebar header -->
		<div class="flex h-16 items-center justify-between border-b border-surface-800 px-5">
			<a href="/app" class="font-display text-xl font-bold">
				<span class="gradient-text">Debatium</span>
			</a>
			<button
				class="text-surface-400 hover:text-surface-200 lg:hidden"
				onclick={() => (sidebarOpen = false)}
			>
				<X size={20} />
			</button>
		</div>

		<!-- Navigation -->
		<nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200
					{isActive(item.href)
						? 'bg-primary-600/15 text-primary-400'
						: 'text-surface-400 hover:bg-surface-800 hover:text-surface-200'}"
					onclick={() => (sidebarOpen = false)}
				>
					<item.icon size={19} />
					<span>{item.label}</span>
				</a>
			{/each}
		</nav>

		<!-- Theme toggle + User footer -->
		<div class="border-t border-surface-800 p-3">

			<div class="relative">
				<button
					onclick={() => (userMenuOpen = !userMenuOpen)}
					class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-surface-800"
				>
					<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
						{data.user?.name?.charAt(0)?.toUpperCase() || '?'}
					</div>
					<div class="min-w-0 flex-1 text-left">
						<p class="truncate text-sm font-bold text-surface-200">{data.user?.name || 'Guest'}</p>
						<p class="truncate text-xs text-surface-500">{data.user?.email || ''}</p>
					</div>
					<ChevronDown size={16} class="shrink-0 text-surface-500" />
				</button>

				{#if userMenuOpen}
					<div class="absolute bottom-full left-0 z-50 mb-2 w-full rounded-xl border border-surface-700 bg-surface-800 py-1 shadow-xl">
						<div class="mx-3 mb-1 flex items-center gap-2 border-b border-surface-700 pb-2 pt-1 text-xs text-surface-500">
							<span class="rounded-full bg-accent-400/10 px-2 py-0.5 font-medium text-accent-400">FREE</span>
							<span>Current plan</span>
						</div>
						<a
							href="/app/profile"
							class="flex w-full items-center gap-2 px-3 py-2 text-sm text-surface-300 transition hover:bg-surface-700"
							onclick={() => (userMenuOpen = false)}
						>
							<UserCircle size={16} />
							<span>Profile</span>
						</a>
						<a
							href="/app/settings"
							class="flex w-full items-center gap-2 px-3 py-2 text-sm text-surface-300 transition hover:bg-surface-700"
							onclick={() => (userMenuOpen = false)}
						>
							<Settings size={16} />
							<span>Settings</span>
						</a>
						<button
							onclick={handleLogout}
							class="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger transition hover:bg-surface-700"
						>
							<LogOut size={16} />
							<span>Sign out</span>
						</button>
					</div>
				{/if}
			</div>
		</div>
	</aside>

	<!-- Main content area -->
	<div class="flex flex-1 flex-col overflow-hidden">
		<!-- Top header bar -->
		<header class="relative z-50 flex h-16 items-center gap-4 border-b border-surface-800 bg-surface-900/50 px-4 backdrop-blur-sm lg:px-6">
			<button
				class="text-surface-400 hover:text-surface-200 lg:hidden"
				onclick={() => (sidebarOpen = true)}
			>
				<Menu size={22} />
			</button>
<!-- Search -->
			<div class="relative flex-1 max-w-2xl">
				<form action="/app" method="GET" class="relative w-full">
					<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
					<input
						type="search"
						name="q"
						value={searchQuery}
						oninput={handleSearch}
						onfocus={() => { if (searchQuery.length >= 2) searchOpen = true; }}
						onblur={closeSearch}
						placeholder="Search spars, users..."
						autocomplete="off"
						class="w-full rounded-xl border border-surface-700 bg-surface-800/50 py-2 pl-9 pr-8 text-sm text-surface-200 placeholder-surface-500 outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20"
					/>
					{#if searchQuery.length > 0}
						<button 
							type="button"
							class="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300"
							onclick={() => { searchQuery = ''; searchOpen = false; searchResults = { spars: [], users: [] }; }}
						>
							<X size={14} />
						</button>
					{/if}
				</form>
				
				<!-- Search Dropdown -->
				{#if searchOpen}
					<div class="absolute top-full mt-2 w-full z-50 rounded-xl border border-surface-700 bg-surface-800 py-2 shadow-xl shadow-black/20">
						{#if isSearching}
							<div class="px-4 py-3 text-sm text-surface-400">Searching...</div>
						{:else if searchResults.spars.length === 0 && searchResults.users.length === 0}
							<div class="px-4 py-3 text-sm text-surface-400">No results found for "{searchQuery}"</div>
						{:else}
							<div class="max-h-80 overflow-y-auto">
								{#if searchResults.spars.length > 0}
									<div class="px-3 pb-1 pt-2 text-xs font-semibold text-surface-500">Spars</div>
									{#each searchResults.spars as spar}
										<button onclick={() => openSpar(spar.id)} class="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-surface-700">
											<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-primary-400">
												<Compass size={14} />
											</div>
											<div class="min-w-0 flex-1">
												<div class="truncate text-sm font-medium text-surface-100">{spar.title}</div>
												<div class="flex items-center gap-2 text-xs text-surface-500">
													<span>{spar.format}</span>
													<span>&bull;</span>
													<span>{spar.level}</span>
												</div>
											</div>
										</button>
									{/each}
								{/if}

								{#if searchResults.users.length > 0}
									<div class="px-3 pb-1 pt-2 text-xs font-semibold text-surface-500 {searchResults.spars.length > 0 ? 'mt-2 border-t border-surface-700' : ''}">Debaters</div>
									{#each searchResults.users as searchUser}
										<button onclick={() => openUser(searchUser.id)} class="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-surface-700">
											<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-400/20 text-accent-400 font-bold text-xs">
												{searchUser.name?.charAt(0)?.toUpperCase()}
											</div>
											<div class="min-w-0 flex-1">
												<div class="truncate text-sm font-medium text-surface-100">{searchUser.name}</div>
												{#if searchUser.honors && searchUser.honors.length > 0}
													<div class="truncate text-xs text-surface-500">{searchUser.honors.join(', ')}</div>
												{:else}
													<div class="truncate text-xs text-surface-500">Debater</div>
												{/if}
											</div>
										</button>
									{/each}
								{/if}
							</div>
							<a href="/app?q={encodeURIComponent(searchQuery)}" class="block border-t border-surface-700 bg-surface-800/50 p-3 text-center text-xs font-medium text-primary-400 hover:text-primary-300">
								View all results
							</a>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Right actions -->
			<div class="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
				<!-- Theme Toggle -->
				<button
					onclick={() => toggleMode()}
					class="rounded-xl p-2 text-surface-400 transition hover:bg-surface-800 hover:text-surface-200"
					aria-label="Toggle theme"
				>
					{#if mode.current === 'dark'}
						<Sun size={19} />
					{:else}
						<Moon size={19} />
					{/if}
				</button>
			
				<div class="relative">
					<button 
						onclick={() => { notificationsOpen = !notificationsOpen; if (notificationsOpen) fetchNotifications(); }}
						class="relative rounded-xl p-2 text-surface-400 transition hover:bg-surface-800 hover:text-surface-200"
					>
						<Bell size={19} />
						{#if unreadCount > 0}
							<span class="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger shadow-[0_0_8px_var(--color-danger)]"></span>
						{/if}
					</button>

					<!-- Notifications Dropdown -->
					{#if notificationsOpen}
						<div class="fixed right-4 top-16 mt-1 w-80 z-[100] rounded-2xl border border-surface-700 bg-surface-800 shadow-2xl shadow-black/60 ring-1 ring-white/10 overflow-hidden sm:absolute sm:right-0 sm:top-full">
							<div class="flex items-center justify-between border-b border-surface-700 bg-surface-900/50 px-4 py-3">
								<h3 class="font-display text-sm font-bold text-surface-100 italic">Notifications</h3>
								{#if unreadCount > 0}
									<button class="text-xs font-semibold text-primary-400 hover:text-link transition" onclick={markAllAsRead}>Mark all read</button>
								{/if}
							</div>
							<div class="max-h-96 overflow-y-auto">
								{#if notifications.length === 0}
									<div class="flex flex-col items-center justify-center py-10 text-center px-4">
										<Bell size={32} class="mb-2 text-surface-700" />
										<p class="text-sm font-medium text-surface-500">No notifications yet</p>
									</div>
								{:else}
									{#each notifications as n}
										<div 
											class="group relative flex gap-3 border-b border-surface-700/50 px-4 py-4 transition hover:bg-surface-700/30 {n.read ? 'opacity-60' : ''}"
										>
											<div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full 
												{n.type === 'spar_accepted' ? 'bg-success/10 text-success' : 
												 n.type === 'spar_invitation' ? 'bg-accent-400/10 text-accent-400' : 
												 'bg-primary-500/10 text-primary-400'}">
												{#if n.type === 'spar_accepted'}
													<CheckCircle2 size={16} />
												{:else if n.type === 'spar_invitation'}
													<Plus size={16} />
												{:else}
													<Clock size={16} />
												{/if}
											</div>
											<div class="min-w-0 flex-1">
												<div class="flex items-start justify-between gap-2">
													<p class="text-xs font-bold text-surface-100">{n.title}</p>
													{#if !n.read}
														<button 
															onclick={() => markAsRead(n.id)}
															class="h-1.5 w-1.5 rounded-full bg-primary-500 mt-1"
															title="Mark as read"
														></button>
													{/if}
												</div>
												<p class="mt-0.5 text-xs leading-relaxed text-surface-300">{n.message}</p>
												<div class="mt-2 flex items-center justify-between">
													<span class="text-[10px] font-medium text-surface-500">{new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
													{#if n.link}
														<button 
															onclick={() => { 
																if (n.metadata?.sparId) openSpar(n.metadata.sparId);
																else goto(n.link);
																markAsRead(n.id);
																notificationsOpen = false;
															}} 
															class="text-[10px] font-bold text-primary-400 hover:text-primary-300 transition uppercase tracking-wider"
														>
															View Details &rarr;
														</button>
													{/if}
												</div>
											</div>
										</div>
									{/each}
								{/if}
							</div>
							<div class="bg-surface-900/50 p-2 text-center border-t border-surface-700">
								<button class="text-[10px] font-bold uppercase tracking-widest text-surface-500 hover:text-surface-300 transition" onclick={() => (notificationsOpen = false)}>Close Panel</button>
							</div>
						</div>
					{/if}
				</div>

				<button
					onclick={() => (createDialogOpen = true)}
					class="hidden items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-500 sm:flex ml-1"
				>
					<Plus size={16} />
					<span>Create Spar</span>
				</button>
			</div>
		</header>

		<!-- Page content -->
		<main class="relative flex-1 overflow-y-auto p-4 lg:p-6">
			{#if $navigating}
				<div class="absolute inset-0 z-10 flex items-center justify-center bg-surface-950/60 backdrop-blur-[2px]">
					<div class="flex flex-col items-center gap-4">
						<div class="flex items-center gap-2">
							<span class="inline-block size-3 animate-bounce rounded-full bg-primary-500 shadow-[0_0_12px_var(--color-primary-500)] [animation-delay:-0.32s]"></span>
							<span class="inline-block size-3 animate-bounce rounded-full bg-primary-400 shadow-[0_0_12px_var(--color-primary-400)] [animation-delay:-0.16s]"></span>
							<span class="inline-block size-3 animate-bounce rounded-full bg-primary-300 shadow-[0_0_12px_var(--color-primary-300)]"></span>
						</div>
						<p class="text-xs font-medium tracking-widest text-surface-400 uppercase">Loading…</p>
					</div>
				</div>
			{/if}
			{@render children()}
		</main>
	</div>
</div>

<CreateSparDialog bind:open={createDialogOpen} onCreated={() => { window.location.reload(); }} />
<SparDetailDialog bind:open={sparDialogOpen} sparId={selectedSparId} currentUserId={data.user.id} />
<UserProfileDialog bind:open={userDialogOpen} userId={selectedUserId} />
