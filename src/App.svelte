<script>
	import { onMount } from "svelte";
	import Canvas from "./components/Canvas.svelte";
	import Main from "./components/Main.svelte";
	import { cash, prestige } from "./stores.js";
	import {  } from "./functions.js";

	let intro1, intro2, intro3;
	let gaming = false;


	const cinemachine = [];
	cinemachine.push([ ()=> intro1.style.opacity = 1, 500 ]);
	cinemachine.push([ ()=> intro1.style.opacity = 0, 2000 ]);
	cinemachine.push([ ()=> intro2.style.opacity = 1, 1000 ]);
	cinemachine.push([ ()=> intro2.style.opacity = 0, 3000 ]);
	cinemachine.push([ ()=> intro3.style.opacity = 1, 1000 ]);
	cinemachine.push([ ()=> intro3.style.opacity = 0, 3000 ]);
	cinemachine.push([ ()=> gaming = true, 3000 ]);
	const run_cine = (i)=>{
		if (i >= cinemachine.length) return;
		setTimeout(()=> (cinemachine[i][0](), run_cine(i+1)), cinemachine[i][1]);
	}

	onMount(()=>{
		if ($cash > 0 || $prestige.times > 0) {
			gaming = true;
			return;
		}
		console.log("Running intro!");
		intro3.style.transitionDuration = "3s";
		run_cine(0);
	});

</script>

<main>
	{#if gaming}
		<Main/>
		<Canvas/>
	{:else}
		<h1 class="intro-txt" bind:this={intro1}>Jacoby Y presents</h1>
		<h1 class="intro-txt" bind:this={intro2}>The sequel nobody asked for</h1>
		<h1 class="intro-txt" bind:this={intro3}>Idle Orbs 2</h1>
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
		transform: translate(-50%, -50%);
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
</style>