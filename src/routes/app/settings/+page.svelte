<script lang="ts">
	import { toggleMode, mode } from 'mode-watcher';
	import { Sun, Moon, Monitor, Bell, Shield, User, Mail } from 'lucide-svelte';

	let { data } = $props();
</script>

<div class="mx-auto max-w-3xl space-y-8">
	<div>
		<h1 class="font-display text-2xl font-bold text-surface-50">Settings</h1>
		<p class="text-sm text-surface-400">Manage your preferences and account settings</p>
	</div>

	<!-- Appearance -->
	<section class="rounded-2xl border border-surface-800 bg-surface-900 p-6">
		<h2 class="mb-1 font-display text-lg font-semibold text-surface-100">Appearance</h2>
		<p class="mb-4 text-sm text-surface-500">Customize the look and feel of Debatium</p>

		<div class="flex gap-3">
			<button
				onclick={() => {
					if (mode.current !== 'light') toggleMode();
				}}
				class="flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-4 transition
				{mode.current === 'light' ? 'border-primary-500 bg-primary-600/10' : 'border-surface-700 bg-surface-800 hover:border-surface-600'}"
			>
				<div class="flex h-10 w-10 items-center justify-center rounded-full {mode.current === 'light' ? 'bg-primary-600/20 text-primary-400' : 'bg-surface-700 text-surface-400'}">
					<Sun size={20} />
				</div>
				<span class="text-sm font-medium {mode.current === 'light' ? 'text-primary-400' : 'text-surface-400'}">Light</span>
			</button>
			<button
				onclick={() => {
					if (mode.current !== 'dark') toggleMode();
				}}
				class="flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-4 transition
				{mode.current === 'dark' ? 'border-primary-500 bg-primary-600/10' : 'border-surface-700 bg-surface-800 hover:border-surface-600'}"
			>
				<div class="flex h-10 w-10 items-center justify-center rounded-full {mode.current === 'dark' ? 'bg-primary-600/20 text-primary-400' : 'bg-surface-700 text-surface-400'}">
					<Moon size={20} />
				</div>
				<span class="text-sm font-medium {mode.current === 'dark' ? 'text-primary-400' : 'text-surface-400'}">Dark</span>
			</button>
		</div>
	</section>

	<!-- Account info -->
	<section class="rounded-2xl border border-surface-800 bg-surface-900 p-6">
		<h2 class="mb-1 font-display text-lg font-semibold text-surface-100">Account</h2>
		<p class="mb-4 text-sm text-surface-500">Your account information</p>

		<div class="space-y-3">
			<div class="flex items-center gap-3 rounded-xl bg-surface-800/50 px-4 py-3">
				<User size={16} class="text-surface-500" />
				<div>
					<p class="text-xs text-surface-500">Name</p>
					<p class="text-sm font-medium text-surface-200">{data.user.name}</p>
				</div>
			</div>
			<div class="flex items-center gap-3 rounded-xl bg-surface-800/50 px-4 py-3">
				<Mail size={16} class="text-surface-500" />
				<div>
					<p class="text-xs text-surface-500">Email</p>
					<p class="text-sm font-medium text-surface-200">{data.user.email}</p>
				</div>
			</div>
			<div class="flex items-center gap-3 rounded-xl bg-surface-800/50 px-4 py-3">
				<Shield size={16} class="text-surface-500" />
				<div>
					<p class="text-xs text-surface-500">Plan</p>
					<div class="flex items-center gap-2">
						<span class="rounded-full bg-accent-400/10 px-2 py-0.5 text-xs font-medium text-accent-400">FREE</span>
						<span class="text-sm text-surface-400">All features included</span>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Notifications (placeholder) -->
	<section class="rounded-2xl border border-surface-800 bg-surface-900 p-6">
		<h2 class="mb-1 font-display text-lg font-semibold text-surface-100">Notifications</h2>
		<p class="mb-4 text-sm text-surface-500">Configure how you receive notifications</p>

		<div class="space-y-4">
			<label class="flex cursor-pointer items-center justify-between">
				<div class="flex items-center gap-3">
					<Bell size={16} class="text-surface-500" />
					<div>
						<p class="text-sm font-medium text-surface-200">Spar reminders</p>
						<p class="text-xs text-surface-500">Get notified before your scheduled spars</p>
					</div>
				</div>
				<div class="relative">
					<input type="checkbox" checked class="peer sr-only" />
					<div class="h-6 w-11 rounded-full bg-surface-700 transition peer-checked:bg-primary-600"></div>
					<div class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5"></div>
				</div>
			</label>
			<label class="flex cursor-pointer items-center justify-between">
				<div class="flex items-center gap-3">
					<Bell size={16} class="text-surface-500" />
					<div>
						<p class="text-sm font-medium text-surface-200">New spar invites</p>
						<p class="text-xs text-surface-500">Get notified when someone invites you</p>
					</div>
				</div>
				<div class="relative">
					<input type="checkbox" checked class="peer sr-only" />
					<div class="h-6 w-11 rounded-full bg-surface-700 transition peer-checked:bg-primary-600"></div>
					<div class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5"></div>
				</div>
			</label>
		</div>
	</section>
</div>
