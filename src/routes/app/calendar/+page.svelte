<script lang="ts">
	import { ChevronLeft, ChevronRight, Swords, Bot, Clock } from 'lucide-svelte';

	let { data } = $props();

	let currentDate = $state(new Date()); // Current real month

	// Map database spars to calendar events
	const events = $derived.by(() => {
		return data.spars.filter(s => s.scheduledAt).map((s) => {
			const dateObj = new Date(s.scheduledAt);
			const yearStr = dateObj.getFullYear();
			const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0');
			const dayStr = String(dateObj.getDate()).padStart(2, '0');

			const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
			const timeStr = dateObj.toLocaleTimeString('en-US', {
				hour: '2-digit',
				minute: '2-digit',
				hour12: false
			});

			return {
				date: dateStr,
				title: s.title,
				type: 'spar', // AI sessions not in DB yet
				time: timeStr
			};
		});
	});

	let selectedDate = $state<string | null>(null);

	const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	const year = $derived(currentDate.getFullYear());
	const month = $derived(currentDate.getMonth());
	const monthName = $derived(
		currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })
	);

	const firstDay = $derived(new Date(year, month, 1).getDay());
	const daysInMonth = $derived(new Date(year, month + 1, 0).getDate());
	const daysInPrevMonth = $derived(new Date(year, month, 0).getDate());

	const calendarDays = $derived.by(() => {
		const days: Array<{ day: number; month: 'prev' | 'current' | 'next'; dateStr: string }> = [];

		// Previous month overflow
		for (let i = firstDay - 1; i >= 0; i--) {
			const d = daysInPrevMonth - i;
			const m = month === 0 ? 11 : month - 1;
			const y = month === 0 ? year - 1 : year;
			days.push({
				day: d,
				month: 'prev',
				dateStr: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
			});
		}

		// Current month
		for (let i = 1; i <= daysInMonth; i++) {
			days.push({
				day: i,
				month: 'current',
				dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
			});
		}

		// Next month overflow
		const remaining = 42 - days.length;
		for (let i = 1; i <= remaining; i++) {
			const m = month === 11 ? 0 : month + 1;
			const y = month === 11 ? year + 1 : year;
			days.push({
				day: i,
				month: 'next',
				dateStr: `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
			});
		}

		return days;
	});

	function getEventsForDate(dateStr: string) {
		return events.filter((e) => e.date === dateStr);
	}

	const selectedEvents = $derived(selectedDate ? getEventsForDate(selectedDate) : []);

	function prevMonth() {
		currentDate = new Date(year, month - 1, 1);
		selectedDate = null;
	}

	function nextMonth() {
		currentDate = new Date(year, month + 1, 1);
		selectedDate = null;
	}

	function isToday(dateStr: string) {
		const today = new Date();
		const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
		return dateStr === todayStr;
	}
</script>

<div class="mx-auto max-w-7xl">
	<div class="mb-6">
		<h1 class="font-display text-2xl font-bold text-surface-50">Calendar</h1>
		<p class="text-sm text-surface-400">View your scheduled debates and AI sessions</p>
	</div>

	<div class="grid grid-cols-1 gap-6 xl:grid-cols-[1fr,340px]">
		<!-- Calendar Grid -->
		<div class="rounded-2xl border border-surface-800 bg-surface-900 p-5">
			<!-- Month navigation -->
			<div class="mb-5 flex items-center justify-between">
				<button
					onclick={prevMonth}
					class="rounded-xl p-2 text-surface-400 transition hover:bg-surface-800 hover:text-surface-200"
				>
					<ChevronLeft size={20} />
				</button>
				<h2 class="font-display text-lg font-semibold text-surface-100">{monthName}</h2>
				<button
					onclick={nextMonth}
					class="rounded-xl p-2 text-surface-400 transition hover:bg-surface-800 hover:text-surface-200"
				>
					<ChevronRight size={20} />
				</button>
			</div>

			<!-- Days of week header -->
			<div class="mb-2 grid grid-cols-7 gap-px">
				{#each daysOfWeek as day}
					<div class="py-2 text-center text-xs font-semibold text-surface-500">{day}</div>
				{/each}
			</div>

			<!-- Calendar grid -->
			<div class="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-surface-800">
				{#each calendarDays as calDay}
					{@const dayEvents = getEventsForDate(calDay.dateStr)}
					<button
						onclick={() => (selectedDate = calDay.dateStr)}
						class="relative flex min-h-[80px] flex-col items-start p-2 text-left transition
						{calDay.month !== 'current' ? 'bg-surface-950 text-surface-600' : 'bg-surface-900 text-surface-300 hover:bg-surface-800'}
						{selectedDate === calDay.dateStr ? 'ring-2 ring-primary-500 ring-inset' : ''}
						{isToday(calDay.dateStr) ? 'bg-primary-600/5' : ''}"
					>
						<span
							class="mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium
							{isToday(calDay.dateStr) ? 'bg-primary-600 text-white' : ''}"
						>
							{calDay.day}
						</span>

						{#if dayEvents.length > 0}
							<div class="flex flex-col gap-0.5 w-full">
								{#each dayEvents.slice(0, 2) as ev}
									<div
										class="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] font-medium
										{ev.type === 'ai' ? 'bg-accent-400/10 text-accent-400' : 'bg-primary-500/10 text-primary-400'}"
									>
										{#if ev.type === 'ai'}
											<Bot size={9} />
										{:else}
											<Swords size={9} />
										{/if}
										<span class="truncate">{ev.title}</span>
									</div>
								{/each}
								{#if dayEvents.length > 2}
									<span class="text-[10px] text-surface-500 px-1">+{dayEvents.length - 2} more</span>
								{/if}
							</div>
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<!-- Selected day sidebar -->
		<div class="rounded-2xl border border-surface-800 bg-surface-900 p-5">
			<h3 class="mb-4 font-display text-base font-semibold text-surface-100">
				{#if selectedDate}
					{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
						weekday: 'long',
						month: 'long',
						day: 'numeric'
					})}
				{:else}
					Select a day
				{/if}
			</h3>

			{#if selectedDate && selectedEvents.length > 0}
				<div class="space-y-3">
					{#each selectedEvents as ev}
						<div class="rounded-xl border border-surface-700 bg-surface-800 p-4 transition hover:border-surface-600">
							<div class="mb-2 flex items-center gap-2">
								{#if ev.type === 'ai'}
									<Bot size={16} class="text-accent-400" />
									<span class="text-[11px] font-medium text-accent-400">AI Session</span>
								{:else}
									<Swords size={16} class="text-primary-400" />
									<span class="text-[11px] font-medium text-primary-400">Spar</span>
								{/if}
							</div>
							<h4 class="font-display text-sm font-semibold text-surface-100">{ev.title}</h4>
							<div class="mt-2 flex items-center gap-1 text-xs text-surface-500">
								<Clock size={12} />
								<span>{ev.time}</span>
							</div>
						</div>
					{/each}
				</div>
			{:else if selectedDate}
				<div class="flex flex-col items-center py-8 text-center">
					<div class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-800 text-surface-600">
						<Swords size={24} />
					</div>
					<p class="text-sm text-surface-500">No events scheduled</p>
					<a
						href="/app/create"
						class="mt-3 text-sm font-medium text-primary-400 transition hover:text-primary-300"
					>
						Create a spar for this day →
					</a>
				</div>
			{:else}
				<div class="flex flex-col items-center py-8 text-center">
					<p class="text-sm text-surface-500">Click on a day to see scheduled events</p>
				</div>
			{/if}

			<!-- Legend -->
			<div class="mt-6 border-t border-surface-800 pt-4">
				<p class="mb-2 text-xs font-medium text-surface-500">Legend</p>
				<div class="space-y-2">
					<div class="flex items-center gap-2 text-xs">
						<div class="h-2.5 w-2.5 rounded-sm bg-primary-500"></div>
						<span class="text-surface-400">Debate Spar</span>
					</div>
					<div class="flex items-center gap-2 text-xs">
						<div class="h-2.5 w-2.5 rounded-sm bg-accent-400"></div>
						<span class="text-surface-400">AI Practice Session</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
