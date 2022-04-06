<script>
	import { onMount } from "svelte";
	import Canvas from "./components/Canvas.svelte";
	import Main from "./components/Main.svelte";
	import { cash, prestige } from "./stores.js";

	let intro1, intro2, intro3, to_dad, main;
	let gaming = false;

	$: {
		if (gaming && timeout != null) {
			window.clearTimeout(timeout);
		}
	}

	const cinemachine = [];
	cinemachine.push([ ()=> intro1.style.opacity = 1, 500 ]);
	cinemachine.push([ ()=> intro1.style.opacity = 0, 2000 ]);
	cinemachine.push([ ()=> intro2.style.opacity = 1, 1000 ]);
	cinemachine.push([ ()=> intro2.style.opacity = 0, 3000 ]);
	cinemachine.push([ ()=> intro3.style.opacity = 1, 1000 ]);
	cinemachine.push([ ()=>{ intro3.style.opacity = 0; to_dad.style.opacity = 0; }, 3000 ]);
	cinemachine.push([ ()=> gaming = true, 3000 ]);

	let timeout = null;
	const run_cine = (i)=>{
		if (i >= cinemachine.length) return;
		timeout = setTimeout(()=> (cinemachine[i][0](), run_cine(i+1)), cinemachine[i][1]);
	}

	onMount(()=>{
		window.onresize();
		if ($cash > 0 || $prestige.times > 0) {
			gaming = true;
			return;
		}
		console.log("Running intro!");
		intro3.style.transitionDuration = "3s";
		run_cine(0);
	});
	window.onresize = ()=>{
		let scale = 1;
		const w = document.body.clientWidth;
		const h = document.body.clientHeight;
		if (w*0.6 >= h) scale = h/600;
		else scale = w/1000;
		
		main.style.transform = `translate(-50%, -50%) scale(${scale-0.02}, ${scale-0.02})`;
	}

</script>

<main bind:this={main} on:click={()=> gaming=true}>
	{#if gaming}
		<Main/>
		<Canvas/>
	{:else}
		<h1 class="intro-txt" bind:this={intro1}>Jacoby Y presents</h1>
		<h1 class="intro-txt" bind:this={intro2}>The sequel nobody asked for</h1>
		<h1 class="intro-txt" bind:this={intro3}>Idle Orbs 2</h1>
		<h3 id="to-dad" bind:this={to_dad}>(This game is dedicated to you, Dad)</h3>
	{/if}
</main>

<style>
	main {
		border: 1px dashed white;
		width: 1000px;
		height: 600px;
		position: absolute;
		left: 50%;
		top: 50%;
		overflow: hidden;
		/* background-color: #444; */
	}

	.intro-txt {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		color: white;
		opacity: 0;
		transition-duration: 1s;
		font-size: 3rem;
		width: max-content;
		/* transition-timing-function: linear; */
	}
	#to-dad {
		position: absolute;
		left: 0;
		bottom: 0;
		color: #aaa;
		padding: 0.7rem 0.5rem;
		font-weight: normal;
		transition-duration: 3s;
	}
</style>