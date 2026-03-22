<script lang="ts">
	import { ArrowLeft, Send, Sparkles, Volume2, Globe2, Mic, Bot, User, Loader2, MessageSquare, X, Play, Square, MicOff, Trash2 } from 'lucide-svelte';
	import { onMount, untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { generateId } from 'ai';
	import { fade, scale, fly } from 'svelte/transition';

	let { data } = $props();
	let session = $derived(data.session);
	
	// Convert DB messages to local format
	let messages = $state(data.messages.map(m => ({
		id: m.id,
		role: m.role as 'user' | 'assistant' | 'system' | 'data',
		content: m.content
	})));

	let inputContent = $state('');
	let isChatLoading = $state(false);
	let isDeleteModalOpen = $state(false);

	// --- Voice Mode State ---
	let isVoiceModeActive = $state(untrack(() => data.session.mode === 'voice'));
	let mediaRecorder = $state<MediaRecorder | null>(null);
	let audioChunks: Blob[] = [];
	let isRecording = $state(false);
	let isTranscribing = $state(false);
	let isAITalking = $state(false);
	let recordingTime = $state(0);
	let timerInterval: any;

	function formatDate(dateItem: Date | string) {
		return new Date(dateItem).toLocaleDateString('en-US', {
			month: 'short', day: 'numeric', year: 'numeric'
		});
	}

	async function handleSubmit(e?: Event) {
		if (e) e.preventDefault();
		if (!inputContent.trim() || isChatLoading) return;
		
		const msg = inputContent.trim();
		inputContent = ''; // clear immediately
		isChatLoading = true;

		// Add user message to UI immediately
		const userMsg = { id: generateId(), role: 'user' as const, content: msg };
		messages = [...messages, userMsg];

		// Placeholder for AI response
		const assistantMsgId = generateId();
		messages = [...messages, { id: assistantMsgId, role: 'assistant' as const, content: '' }];

		try {
			const res = await fetch('/api/ai/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					sessionId: session.id,
					messages: messages.filter(m => m.id !== assistantMsgId).map(m => ({ role: m.role, content: m.content }))
				})
			});

			if (!res.ok) throw new Error('Failed to fetch chat');
			
			const result = await res.json();
			if (result.text) {
				const msgs = [...messages];
				const lastIdx = msgs.length - 1;
				msgs[lastIdx] = { ...msgs[lastIdx], content: result.text };
				messages = msgs;

				// In voice mode, automatically play TTS
				if (isVoiceModeActive) {
					await playAudio(result.text, assistantMsgId);
				}
			}
		} catch (error) {
			console.error('Failed to append message', error);
			inputContent = msg; 
			messages = messages.filter(m => m.id !== userMsg.id && m.id !== assistantMsgId);
		} finally {
			isChatLoading = false;
		}
	}

	// --- Audio/TTS Logic ---
	let playingMessageId = $state<string | null>(null);
	let audioContext: AudioContext | null = null;
	let currentAudio: HTMLAudioElement | null = null;

	async function playAudio(text: string, messageId: string) {
		if (playingMessageId) {
			stopAudio();
		}
		playingMessageId = messageId;
		isAITalking = true;
		
		try {
			const res = await fetch('/api/ai/tts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text })
			});
			
			if (res.ok) {
				const blob = await res.blob();
				const url = URL.createObjectURL(blob);
				currentAudio = new Audio(url);
				currentAudio.onended = () => {
					playingMessageId = null;
					isAITalking = false;
					URL.revokeObjectURL(url);
				};
				currentAudio.play();
			} else {
				playingMessageId = null;
				isAITalking = false;
			}
		} catch (e) {
			console.error('Audio playback failed', e);
			playingMessageId = null;
			isAITalking = false;
		}
	}

	function stopAudio() {
		if (currentAudio) {
			currentAudio.pause();
			currentAudio = null;
		}
		playingMessageId = null;
		isAITalking = false;
	}

	// --- Voice Mode UI Actions ---
	async function initRecording() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			
			// Detect supported mime type
			const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
				? 'audio/webm' 
				: 'audio/ogg';
				
			mediaRecorder = new MediaRecorder(stream, { mimeType });
			
			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) audioChunks.push(event.data);
			};

			mediaRecorder.onstop = async () => {
				const audioBlob = new Blob(audioChunks, { type: mimeType });
				audioChunks = [];
				await handleTranscription(audioBlob);
			};

			startRecording();
		} catch (err) {
			console.error('Microphone access denied', err);
			alert('Please allow microphone access to use Voice Mode.');
		}
	}

	function startRecording() {
		if (!mediaRecorder) return;
		isRecording = true;
		recordingTime = 0;
		audioChunks = [];
		mediaRecorder.start();
		timerInterval = setInterval(() => {
			recordingTime += 1;
		}, 1000);
	}

	function stopRecording() {
		if (!mediaRecorder || !isRecording) return;
		isRecording = false;
		mediaRecorder.stop();
		clearInterval(timerInterval);
	}

	async function handleTranscription(blob: Blob) {
		isTranscribing = true;
		try {
			const formData = new FormData();
			formData.append('audio', blob, 'recording.wav');
			formData.append('sessionId', session.id);

			const res = await fetch('/api/ai/transcribe', {
				method: 'POST',
				body: formData
			});

			if (!res.ok) throw new Error('Transcription failed');
			const data = await res.json();
			
			if (data.text) {
				inputContent = data.text;
				await handleSubmit();
			}
		} catch (error) {
			console.error('Transcription error:', error);
		} finally {
			isTranscribing = false;
		}
	}

	const strangeTopics = {
		en: [
			"Should tomatoes be promoted from fruits to emotional support vegetables?",
			"Should escalators be allowed to choose their own direction every morning?",
			"Should fish wear glasses to improve underwater reading?",
			"Should people get timeouts for walking too slowly in public?",
			"Is toast just bread taking a victory lap?",
			"Should librarians be in charge of controlling the weather through silence?",
			"Are umbrellas secretly discouraging rain from trying its best?",
			"Should naps be recognized as an official national sport?",
			"Are bees just tiny flying entrepreneurs?",
			"Should shadows be considered a person's darkest accessory?",
			"If clouds had wheels, should they follow traffic laws?",
			"Are pancakes just breakfast frisbees?",
			"Should moonlight count as solar power after dark?",
			"Are shoelaces just tiny negotiators between feet and shoes?",
			"Is chewing gum just a workout for your face?",
			"Should blankets be promoted to emotional support furniture?",
			"Should dragons be hired as aviation consultants?",
			"Are crayons the tastiest-looking art supplies?",
			"Should weekends automatically be three days long?",
			"Are doors just dramatic interruptions in walls?",
			"Should ghosts have to pay rent if they haunt a house full-time?",
			"Should squeaky sneakers be banned from quiet buildings?",
			"Are bananas the most dramatic fruit because they bruise emotionally?",
			"Should birdsong come with subtitles?",
			"Is a refrigerator just a time machine for leftovers?",
			"Is invisible ink more honest because it admits it has nothing to say?",
			"Are eyebrows just punctuation marks for the face?",
			"Should teachers receive homework from students once a month for fairness?",
			"Are potatoes secretly the philosophers of vegetables?",
			"Is a candle just fire in a tiny prison?",
			"Should snowmen be considered seasonal workers?",
			"Is Wi-Fi basically modern oxygen for students?",
			"Is pizza crust just the bread handle of the meal?",
			"Should dolphins be exempt from taxes for being too charismatic?",
			"Are sunglasses just windows for your eyes?",
			"Is soup merely a beverage with ambition?",
			"Should yawning count as emotional plagiarism when someone else starts it?",
			"Are stairs just low-tech mountains?",
			"Should hats be considered portable roofs?",
			"Should ducks be allowed to moderate political debates?",
			"Do cereal boxes overpromise the excitement of breakfast?",
			"Should socks come with GPS trackers by law?",
			"Should Thursday night legally count as the weekend?",
			"Can cake become breakfast if eaten with enough confidence?",
			"Are pencils just wooden idea-launchers?",
			"Should vacuum cleaners be distrusted for being too loud?",
			"Should keyboards have a whisper mode for dramatic typing?",
			"Should tiny crayons be allowed to retire with honors?",
			"Should scarecrows receive awards for outstanding field work?",
			"Should books be allowed to judge people by their covers as revenge?",
			"Is a trampoline just an optimistic floor?",
			"Should vending machines be allowed to reject rude customers?",
			"Are dreams unpaid internships for the imagination?",
			"Should forks be classified as tiny food tridents?",
			"Is sunshine just daylight showing off?",
			"Should school uniforms include capes for morale?",
			"Is a map just a very confident flat lie?",
			"Should snail pace be recognized as an official unit of patience?",
			"Should robots feel insulted when called calculators?",
			"Is bubble wrap a legitimate musical instrument?",
			"Should fruit stickers become collectible currency?",
			"Is a bathtub just a personal indoor pond?",
			"Should pillows be promoted to bedtime consultants?",
			"Is an avocado just butter pretending to be healthy?",
			"Should elevators play dramatic music during awkward silence?",
			"Are fingerprints just nature's autographs?",
			"Should Mondays come with apology coupons?",
			"Are noodles without sauce emotionally incomplete?",
			"Should seagulls need airport clearance near beaches?",
			"Is a beard just a reusable scarf for the face?",
			"Should crayons and markers settle artistic disputes in court?",
			"Is sandwich crust just a security fence for the filling?",
			"Should clouds need building permits before becoming thunderstorms?",
			"Is glitter just arts-and-crafts chaos with confidence?",
			"Should students be graded on hallway walking technique?",
			"Is orange juice just liquid fruit confession?",
			"Should pigeons earn frequent flyer miles?",
			"Is a bench just a chair that learned teamwork?",
			"Should silence count as a conversation with the universe?",
			"Is a backpack just a turtle shell for students?",
			"Should cereal be eaten with chopsticks for discipline?",
			"Are calculators just tiny stress boxes with buttons?",
			"Should paper airplanes require a pilot's license?",
			"Is homework just school haunting your house?",
			"Should chairs have names if people sit in them every day?",
			"Are marshmallows just clouds that believed in themselves?",
			"Should mirrors charge people for repeated use?",
			"Is a hallway just a room that forgot to become a room?",
			"Should cats be hired as professional judges of character?",
			"Is popcorn the loudest possible way to eat corn?",
			"Should the last slice of pizza be protected by international law?",
			"Is a notebook just a parking lot for thoughts?",
			"Should alarm sounds be selected by a democratic vote?",
			"Are flip-flops just portable applause machines?",
			"Should bicycles have turn signals for dramatic effect?",
			"Is boredom just the brain buffering?",
			"Should coffee cups come with emotional warning labels?",
			"Is a spoon simply a tiny shovel for soup?",
			"Should whales be considered the philosophers of the ocean?",
			"Is a hoodie just a socially acceptable blanket?",
			"Should traffic lights be allowed to take personal days?",
			"Are erasers proof that mistakes deserve second chances?"
		],
		vi: [
			"Cà chua có nên được thăng chức từ trái cây thành rau củ hỗ trợ cảm xúc không?",
			"Thang cuốn có nên được tự chọn hướng đi của mình mỗi sáng không?",
			"Cá có nên đeo kính để đọc dưới nước tốt hơn không?",
			"Mọi người có nên bị phạt đứng góc nếu đi quá chậm ở nơi công cộng không?",
			"Bánh mì nướng có phải chỉ là bánh mì đang ăn mừng chiến thắng không?",
			"Thủ thư có nên phụ trách điều khiển thời tiết bằng sự im lặng không?",
			"Ô dù có đang bí mật làm mưa nản lòng không?",
			"Ngủ trưa có nên được công nhận là một môn thể thao quốc gia chính thức không?",
			"Ong có phải chỉ là những doanh nhân tí hon biết bay không?",
			"Cái bóng có nên được xem là phụ kiện u ám nhất của một con người không?",
			"Nếu mây có bánh xe, chúng có nên phải tuân theo luật giao thông không?",
			"Bánh pancake có phải chỉ là đĩa ném của bữa sáng không?",
			"Ánh trăng có nên được tính là năng lượng mặt trời ban đêm không?",
			"Dây giày có phải chỉ là những nhà đàm phán tí hon giữa bàn chân và đôi giày không?",
			"Kẹo cao su có phải chỉ là bài tập gym cho khuôn mặt không?",
			"Chăn có nên được thăng chức thành đồ nội thất hỗ trợ cảm xúc không?",
			"Rồng có nên được thuê làm cố vấn hàng không không?",
			"Bút sáp màu có phải là dụng cụ mỹ thuật trông ngon nhất không?",
			"Cuối tuần có nên mặc định dài ba ngày không?",
			"Cánh cửa có phải chỉ là những sự ngắt quãng đầy kịch tính trên bức tường không?",
			"Ma có nên phải trả tiền thuê nhà nếu ám một căn nhà toàn thời gian không?",
			"Giày thể thao kêu cót két có nên bị cấm vào những nơi cần yên tĩnh không?",
			"Chuối có phải là loại trái cây kịch tính nhất vì quá dễ bầm dập về cảm xúc không?",
			"Tiếng chim hót có nên có phụ đề không?",
			"Tủ lạnh có phải chỉ là cỗ máy thời gian dành cho đồ ăn thừa không?",
			"Mực vô hình có trung thực hơn vì nó thừa nhận mình chẳng có gì để nói không?",
			"Lông mày có phải chỉ là dấu câu của khuôn mặt không?",
			"Học sinh có nên giao bài tập về nhà cho giáo viên mỗi tháng một lần để công bằng không?",
			"Khoai tây có phải là những nhà triết học bí mật của thế giới rau củ không?",
			"Nến có phải chỉ là lửa bị nhốt trong một nhà tù tí hon không?",
			"Người tuyết có nên được xem là lao động thời vụ không?",
			"Wi-Fi có phải về cơ bản là oxy hiện đại của sinh viên không?",
			"Viền bánh pizza có phải chỉ là cái tay cầm bằng bánh mì của bữa ăn không?",
			"Cá heo có nên được miễn thuế vì quá cuốn hút không?",
			"Kính râm có phải chỉ là cửa sổ dành cho đôi mắt không?",
			"Súp có phải chỉ là một loại đồ uống đầy tham vọng không?",
			"Ngáp có nên được tính là đạo nhái cảm xúc khi ai đó ngáp trước không?",
			"Cầu thang có phải chỉ là núi phiên bản công nghệ thấp không?",
			"Mũ có phải nên được xem là mái nhà di động không?",
			"Vịt có nên được phép làm người điều phối các cuộc tranh luận chính trị không?",
			"Hộp ngũ cốc có đang hứa hẹn quá mức về độ thú vị của bữa sáng không?",
			"Tất có nên bắt buộc đi kèm thiết bị định vị GPS không?",
			"Tối thứ Năm có nên được tính hợp pháp là cuối tuần không?",
			"Bánh ngọt có thể trở thành bữa sáng nếu được ăn với đủ tự tin không?",
			"Bút chì có phải chỉ là bệ phóng ý tưởng bằng gỗ không?",
			"Máy hút bụi có đáng bị nghi ngờ vì quá ồn ào không?",
			"Bàn phím có nên có chế độ gõ thì thầm cho những lúc muốn tạo kịch tính không?",
			"Những mẩu bút sáp quá ngắn có nên được cho nghỉ hưu danh dự không?",
			"Bù nhìn có nên nhận giải thưởng vì thành tích xuất sắc ngoài đồng không?",
			"Sách có nên được quyền phán xét con người qua bìa ngoài để trả đũa không?",
			"Bạt nhún có phải chỉ là một cái sàn đầy lạc quan không?",
			"Máy bán hàng tự động có nên được phép từ chối khách hàng bất lịch sự không?",
			"Giấc mơ có phải là kỳ thực tập không lương của trí tưởng tượng không?",
			"Nĩa có nên được phân loại là cây đinh ba tí hon dành cho thức ăn không?",
			"Ánh nắng có phải chỉ là ban ngày đang khoe mẽ không?",
			"Đồng phục học sinh có nên bao gồm áo choàng để tăng sĩ khí không?",
			"Bản đồ có phải chỉ là một lời nói dối rất tự tin trên mặt phẳng không?",
			"Tốc độ ốc sên có nên được công nhận là đơn vị đo độ kiên nhẫn chính thức không?",
			"Robot có nên cảm thấy bị xúc phạm khi bị gọi là máy tính cầm tay không?",
			"Xốp nổ có phải là một nhạc cụ hợp pháp không?",
			"Tem dán trên trái cây có nên trở thành tiền tệ sưu tầm không?",
			"Bồn tắm có phải chỉ là cái ao trong nhà dành riêng cho một người không?",
			"Gối có nên được thăng chức thành cố vấn giờ đi ngủ không?",
			"Bơ có phải chỉ là bơ động vật giả vờ sống lành mạnh không?",
			"Thang máy có nên phát nhạc kịch tính trong những khoảng lặng ngượng ngùng không?",
			"Dấu vân tay có phải chỉ là chữ ký của tự nhiên không?",
			"Thứ Hai có nên đi kèm phiếu xin lỗi không?",
			"Mì không sốt có phải đang dang dở về mặt cảm xúc không?",
			"Mòng biển có nên cần giấy phép điều phối hàng không gần bãi biển không?",
			"Râu có phải chỉ là chiếc khăn quàng tái sử dụng cho khuôn mặt không?",
			"Bút sáp và bút lông có nên giải quyết tranh chấp nghệ thuật trước tòa không?",
			"Viền sandwich có phải chỉ là hàng rào an ninh cho phần nhân không?",
			"Mây có nên cần giấy phép xây dựng trước khi trở thành giông bão không?",
			"Kim tuyến có phải chỉ là hỗn loạn thủ công mỹ nghệ nhưng rất tự tin không?",
			"Học sinh có nên được chấm điểm kỹ thuật đi ngoài hành lang không?",
			"Nước cam có phải chỉ là lời thú tội ở dạng lỏng của trái cây không?",
			"Bồ câu có nên được tích điểm khách hàng bay thường xuyên không?",
			"Ghế băng có phải chỉ là cái ghế đã học được tinh thần đồng đội không?",
			"Sự im lặng có nên được tính là một cuộc trò chuyện với vũ trụ không?",
			"Ba lô có phải chỉ là mai rùa dành cho học sinh không?",
			"Ngũ cốc có nên được ăn bằng đũa để rèn kỷ luật không?",
			"Máy tính cầm tay có phải chỉ là những chiếc hộp stress tí hon đầy nút bấm không?",
			"Máy bay giấy có nên cần bằng lái phi công không?",
			"Bài tập về nhà có phải chỉ là trường học ám chính ngôi nhà của bạn không?",
			"Ghế có nên có tên riêng nếu người ta ngồi lên nó mỗi ngày không?",
			"Kẹo marshmallow có phải chỉ là những đám mây đã tin vào chính mình không?",
			"Gương có nên thu phí những người soi quá nhiều lần không?",
			"Hành lang có phải chỉ là một căn phòng quên mất cách trở thành căn phòng không?",
			"Mèo có nên được tuyển làm chuyên gia phán xét tính cách con người không?",
			"Bắp rang có phải là cách ồn ào nhất để ăn ngô không?",
			"Miếng pizza cuối cùng có nên được bảo vệ bởi luật pháp quốc tế không?",
			"Sổ tay có phải chỉ là bãi đỗ xe dành cho suy nghĩ không?",
			"Âm báo thức có nên được chọn bằng bỏ phiếu dân chủ không?",
			"Dép xỏ ngón có phải chỉ là cỗ máy vỗ tay di động không?",
			"Xe đạp có nên có xi nhan chỉ để tăng độ kịch tính không?",
			"Chán nản có phải chỉ là bộ não đang tải đệm không?",
			"Cốc cà phê có nên đi kèm nhãn cảnh báo cảm xúc không?",
			"Muỗng có phải chỉ là chiếc xẻng tí hon dành cho súp không?",
			"Cá voi có phải là những nhà triết học của đại dương không?",
			"Áo hoodie có phải chỉ là chiếc chăn được xã hội chấp nhận không?",
			"Đèn giao thông có nên được phép xin nghỉ phép cá nhân không?",
			"Cục tẩy có phải là bằng chứng rằng sai lầm xứng đáng có cơ hội thứ hai không?"
		]
	};

	async function deleteSession() {
		isDeleteModalOpen = false;
	}

	function formatTime(seconds: number) {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	let chatContainer: HTMLElement;

	$effect(() => {
		// Auto scroll to bottom when messages update
		if (messages && chatContainer) {
			setTimeout(() => {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}, 100);
		}
	});

	onMount(() => {
		return () => {
			if (timerInterval) clearInterval(timerInterval);
			if (currentAudio) currentAudio.pause();
		};
	});
</script>

<svelte:head>
	<title>Spar against AI | Debatium</title>
</svelte:head>

<div class="flex h-[calc(100vh-80px)] max-h-[calc(100vh-80px)] flex-col bg-surface-950 overflow-hidden relative">
	<!-- Header -->
	<header class="flex items-center justify-between border-b border-surface-800 bg-surface-900/50 px-6 py-4 backdrop-blur-md z-20">
		<div class="flex items-center gap-4">
			<a href="/app/ai-sessions" class="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-800 text-surface-400 transition hover:bg-surface-700 hover:text-surface-100">
				<ArrowLeft size={18} />
			</a>
			<div>
				<h1 class="font-display text-lg font-bold text-surface-50 flex items-center gap-2">
					<Sparkles class="text-primary-500" size={18} />
					AI Debater
				</h1>
				<div class="flex items-center gap-3 text-xs text-surface-400 font-medium mt-0.5">
					<span class="flex items-center gap-1">
						<Globe2 size={12} class="text-primary-400" />
						{session.language === 'en' ? 'English' : 'Vietnamese'}
					</span>
					<button 
						onclick={() => isVoiceModeActive = !isVoiceModeActive}
						class="flex items-center gap-1 hover:text-surface-200 transition"
					>
						{#if isVoiceModeActive}
							<Mic size={12} class="text-accent-400" /> Voice Mode
						{:else}
							<MessageSquare size={12} class="text-accent-400" /> Chat Mode
						{/if}
					</button>
				</div>
			</div>
		</div>
		<div class="flex items-center gap-3">
			<div class="hidden md:flex items-center gap-2 group">
				<div class="max-w-xs lg:max-w-md truncate rounded-full border border-surface-800 bg-surface-900 px-4 py-1.5 text-xs font-medium text-surface-300">
					Topic: <span class="text-surface-100">{session.topic}</span>
				</div>
			</div>
			
			<div class="h-6 w-px bg-surface-800 mx-1"></div>
			
			<button 
				onclick={() => isDeleteModalOpen = true}
				class="p-2 rounded-full hover:bg-red-500/10 text-surface-500 hover:text-red-400 transition"
				title="Delete Session"
			>
				<Trash2 size={18} />
			</button>
		</div>
	</header>

	<!-- Chat Area -->
	<div bind:this={chatContainer} class="flex-1 overflow-y-auto px-4 py-6 sm:px-6 space-y-6 bg-surface-900/10 transition-opacity duration-500 {isVoiceModeActive ? 'opacity-20 pointer-events-none grayscale' : 'opacity-100'}">
		{#if messages.length === 0}
			<div class="flex h-full flex-col items-center justify-center text-center opacity-60">
				<Bot size={48} class="mb-4 text-surface-500" />
				<h2 class="text-lg font-bold text-surface-200">Session Started</h2>
				<p class="max-w-md text-sm text-surface-400">Make your opening statement on the topic: <br><strong class="text-surface-100">"{session.topic}"</strong></p>
			</div>
		{/if}

		{#each messages as message}
			{#if message.role !== 'system'}
				<div class="flex w-full {message.role === 'user' ? 'justify-end' : 'justify-start'}">
					<div class="flex max-w-[85%] sm:max-w-[75%] gap-3 {message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}">
						<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full {message.role === 'user' ? 'bg-primary-600 text-white' : 'bg-surface-800 text-primary-400'}">
							{#if message.role === 'user'}
								<User size={16} />
							{:else}
								<Bot size={16} />
							{/if}
						</div>
						<div class="group relative flex flex-col gap-1 {message.role === 'user' ? 'items-end' : 'items-start'}">
							<div class="rounded-2xl px-5 py-3.5 text-sm leading-relaxed whitespace-pre-wrap {message.role === 'user' ? 'bg-primary-600 text-white rounded-tr-sm' : 'bg-surface-800 text-surface-100 rounded-tl-sm border border-surface-700'}">
								{message.content}
							</div>
							{#if message.role === 'assistant'}
								<button 
									onclick={() => playAudio(message.content, message.id)}
									disabled={playingMessageId === message.id}
									class="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider mt-1 transition {playingMessageId === message.id ? 'text-primary-400' : 'text-surface-500 hover:text-surface-300'} "
								>
									{#if playingMessageId === message.id}
										<Loader2 size={12} class="animate-spin" /> Playing Voice...
									{:else}
										<Volume2 size={12} /> Play Voice
									{/if}
								</button>
							{/if}
						</div>
					</div>
				</div>
			{/if}
		{/each}

		{#if isChatLoading && messages[messages.length - 1]?.role === 'user'}
			<div class="flex w-full justify-start">
				<div class="flex max-w-[75%] gap-3 flex-row">
					<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-800 text-primary-400">
						<Bot size={16} />
					</div>
					<div class="flex items-center justify-center rounded-2xl bg-surface-800 text-surface-400 rounded-tl-sm px-5 py-4 border border-surface-700">
						<div class="flex gap-1">
							<div class="h-2 w-2 animate-bounce rounded-full bg-primary-500/50" style="animation-delay: 0ms"></div>
							<div class="h-2 w-2 animate-bounce rounded-full bg-primary-500/70" style="animation-delay: 150ms"></div>
							<div class="h-2 w-2 animate-bounce rounded-full bg-primary-500" style="animation-delay: 300ms"></div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Voice Mode Overlay -->
	{#if isVoiceModeActive}
		<div 
			transition:fade={{ duration: 300 }}
			class="absolute inset-x-0 bottom-0 top-[73px] z-10 flex flex-col items-center justify-center bg-surface-950/90 backdrop-blur-xl"
		>
			<!-- Bouncing Circle Animation -->
			<div class="relative flex items-center justify-center h-64 w-64 mb-8">
				<!-- Outer rings -->
				<div class="absolute inset-0 rounded-full bg-primary-500/10 animate-ping" style="animation-duration: 3s"></div>
				<div class="absolute inset-4 rounded-full bg-primary-500/20 animate-pulse" style="animation-duration: 2s"></div>
				
				<!-- The actual core circle -->
				<div 
					class="relative h-40 w-40 rounded-full bg-linear-to-br from-primary-400 to-accent-600 shadow-[0_0_50px_rgba(59,130,246,0.3)] transition-all duration-300 flex items-center justify-center overflow-hidden"
					class:scale-110={isAITalking || isRecording}
					class:animate-bounce-slow={isAITalking}
				>
					{#if isTranscribing || isChatLoading}
						<div class="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md">
							<Loader2 size={48} class="text-white animate-spin" />
						</div>
					{/if}

					<!-- Sound visualization simulation -->
					<div class="flex items-end gap-1 h-12">
						{#each Array(5) as _, i}
							<div 
								class="w-1.5 bg-white rounded-full transition-all duration-150"
								style="height: {isAITalking || isRecording ? 20 + Math.random() * 80 : 10}%; animation: wave 1.2s ease-in-out infinite; animation-delay: {i * 0.1}s"
							></div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Status Text -->
			<div class="text-center px-6" in:fly={{ y: 20, delay: 200 }}>
				<div class="text-2xl font-display font-medium text-surface-50 mb-3 tracking-tight">
					{#if isRecording}
						Listening... <span class="text-primary-400 tabular-nums">{formatTime(recordingTime)}</span>
					{:else if isTranscribing || isChatLoading}
						Thinking...
					{:else if isAITalking}
						AI is speaking...
					{:else}
						Ready for debate
					{/if}
				</div>
				<div class="text-surface-400 text-sm max-w-xs mx-auto leading-relaxed">
					{#if !isRecording && !isAITalking && !isTranscribing && !isChatLoading}
						Tap the button below to start your argument.
					{/if}
				</div>
			</div>

			<!-- Interaction Buttons -->
			<div class="mt-auto mb-16 flex items-center gap-8" in:fly={{ y: 20, delay: 400 }}>
				{#if !isRecording && !isAITalking && !isTranscribing && !isChatLoading}
					<button 
						onclick={initRecording}
						class="group relative flex h-20 w-20 items-center justify-center rounded-full bg-primary-600 text-white shadow-xl shadow-primary-900/40 hover:bg-primary-500 transition-all active:scale-95"
					>
						<Mic size={32} class="transition-transform group-hover:scale-110" />
						<span class="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest text-surface-400 whitespace-nowrap">Start Debate</span>
					</button>
				{:else if isRecording}
					<button 
						onclick={stopRecording}
						class="group relative flex h-20 w-20 items-center justify-center rounded-full bg-red-600 text-white shadow-xl shadow-red-900/40 hover:bg-red-500 transition-all active:scale-95"
					>
						<Square size={28} fill="currentColor" />
						<span class="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest text-surface-400 whitespace-nowrap">Stop Talking</span>
					</button>
				{:else if isAITalking}
					<button 
						onclick={stopAudio}
						class="group relative flex h-20 w-20 items-center justify-center rounded-full bg-surface-800 text-surface-200 border border-surface-700 shadow-xl hover:bg-surface-700 transition-all active:scale-95"
					>
						<MicOff size={28} />
						<span class="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest text-surface-400 whitespace-nowrap">End AI Turn</span>
					</button>
				{:else}
					<div class="h-20 w-20 flex items-center justify-center">
						<Loader2 size={40} class="text-primary-500 animate-spin" />
					</div>
				{/if}

				{#if !isRecording && !isTranscribing && !isChatLoading}
					<button 
						onclick={() => isVoiceModeActive = false}
						class="flex h-12 w-12 items-center justify-center rounded-full bg-surface-900 text-surface-400 border border-surface-800 hover:text-surface-100 transition shadow-lg"
						title="Close Voice Mode"
					>
						<X size={20} />
					</button>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Text Input Area -->
	<div class="border-t border-surface-800 bg-surface-900/50 p-4 backdrop-blur-md z-20 transition-transform duration-500 {isVoiceModeActive ? 'translate-y-full px-0' : 'translate-y-0'}">
		<div class="mx-auto max-w-4xl">
			<form onsubmit={handleSubmit} class="relative flex items-end gap-2">
				<textarea
					bind:value={inputContent}
					placeholder="Type your argument..."
					class="max-h-32 min-h-[56px] w-full resize-none rounded-2xl border border-surface-700 bg-surface-800 px-5 py-4 text-sm text-surface-50 placeholder-surface-500 outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
					onkeydown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault();
							if (inputContent.trim() && !isChatLoading) {
								e.currentTarget.form?.requestSubmit();
							}
						}
					}}
				></textarea>
				
				<button 
					type="submit" 
					disabled={!inputContent.trim() || isChatLoading}
					class="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white transition hover:bg-primary-500 disabled:opacity-50 disabled:hover:bg-primary-600"
				>
					<Send size={16} class="ml-0.5" />
				</button>
			</form>
			<div class="mt-2 text-center text-[10px] uppercase tracking-wider text-surface-500 font-semibold">
				Shift + Enter for new line • Valsea AI Engine
			</div>
		</div>
	</div>
</div>

<!-- Custom Delete Modal -->
{#if isDeleteModalOpen}
	<div 
		transition:fade={{ duration: 200 }}
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
	>
		<div 
			transition:scale={{ duration: 200, start: 0.95 }}
			class="w-full max-w-md bg-surface-900 border border-surface-800 rounded-3xl shadow-2xl overflow-hidden"
		>
			<div class="p-8 text-center">
				<div class="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 text-red-500">
					<Trash2 size={32} />
				</div>
				<h3 class="text-xl font-display font-bold text-surface-50 mb-2">Delete AI Session?</h3>
				<p class="text-surface-400 text-sm leading-relaxed">
					This action cannot be undone. All messages and recordings in this session will be permanently deleted.
				</p>
			</div>
			
			<div class="p-4 bg-surface-950/50 border-t border-surface-800 flex gap-3">
				<button 
					onclick={() => isDeleteModalOpen = false}
					class="flex-1 px-6 py-3 rounded-2xl bg-surface-800 text-surface-200 font-semibold hover:bg-surface-700 transition"
				>
					Cancel
				</button>
				<form 
					method="POST" 
					action="?/delete" 
					use:enhance={() => {
						isDeleteModalOpen = false;
						return async ({ update }) => {
							await update();
						};
					}}
					class="flex-1"
				>
					<input type="hidden" name="id" value={session.id} />
					<button 
						type="submit"
						class="w-full px-6 py-3 rounded-2xl bg-red-600 text-white font-semibold hover:bg-red-500 transition shadow-lg shadow-red-900/20"
					>
						Delete
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}

<style>
	:global(.animate-bounce-slow) {
		animation: bounce-slow 2s infinite;
	}

	@keyframes bounce-slow {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-10px); }
	}

	@keyframes wave {
		0%, 100% { height: 20%; }
		50% { height: 80%; }
	}
</style>

