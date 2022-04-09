<script>
	import { render_mode, get_data, load_data, max_render, render_mod, clear_storage, store_to_local, rarities, set_new_game_plus, new_game_plus, next_tower_lvl } from "../stores.js";
	export let open;
	export let settings = undefined;

	let get_data_str = "";
	let load_data_str = "";
	let render_amount = 100;
	let show_secret = false;

	const copy_data = ()=>{
		get_data_str = get_data();
		navigator.clipboard.writeText(get_data_str);
	}

	let ren_row;
	$: { if (ren_row != undefined) {
		/** @type HTMLElement[] */
		const rens = ren_row.children;
		let width = 0;
		for (const ren of rens) {
			width += ren.clientWidth;
		}
		const fill = ren_row.clientWidth-5;
		const padding = (fill-width)/12;
		for (const ren of rens) {
			ren.style.paddingLeft = ren.style.paddingRight = `${Math.round(padding*10)/10}px`;
		}
	}}
</script>

<main class:open id="settings" bind:this={settings}>
	<div class="sect">
		<h3 class="sect-title" style="padding-top: .3rem; padding-bottom: .7rem;">Rendering Mode</h3>
		<div class="rendering-row" bind:this={ren_row}>
			<button class:selected={$render_mode == 1} on:click={()=> $render_mode = 1}>Circles</button>
			<button class:selected={$render_mode == 0} on:click={()=> $render_mode = 0}>Squares</button>
			<button class:selected={$render_mode == 2} on:click={()=> $render_mode = 2}>Sand</button>
			<button class:selected={$render_mode == 3} on:click={()=> $render_mode = 3}>Pixelated</button>
			<button class:selected={$render_mode == 4} on:click={()=> $render_mode = 4}>Wireframe</button>
			<button class:selected={$render_mode == 5} on:click={()=> $render_mode = 5}>None</button>
		</div>
	</div>
	<hr>
	<div class="sect" id="render-amount">
		<h3 class="sect-title">Max Rendered Orbs: {render_amount}</h3>
		<div>
			<button on:click={()=> $max_render = render_amount}>Set</button> <input type="range" step="10" min="10" max="1000" id="render" bind:value={render_amount}>
		</div>
		<p>Default: 100. Save data before changing to a really high number! (Could crash game)</p>
	</div>
	<hr>
	<div class="sect" id="render-mod">
		<h3 class="sect-title">Render once every {$render_mod == 1 ? "tick" : `${$render_mod} ticks`}</h3>
		<input type="range" step="1" min="1" max="30" id="render" bind:value={$render_mod}>
	</div>
	<hr>
	<div class="sect" id="data">
		<button on:click={copy_data}>Get Data</button> <input placeholder="Your data will automatically be copied" type="text" name="get" id="get" bind:value={get_data_str}>
		<button on:click={()=> void(load_data(load_data_str), load_data_str="")}>Load Data</button> <input placeholder="Paste your data here" type="text" name="load" id="load" bind:value={load_data_str}>
	</div>
	<div class="sect" id="btn-trio">
		<button on:click={store_to_local}>Save Locally</button> 
		<button on:click={clear_storage}>Clear Game Data</button> 
		<button disabled={$next_tower_lvl < 1000 || $new_game_plus} on:click={()=> void(show_secret=true)}>
			{#if $new_game_plus} *Unlocked*
			{:else} *Secret* {/if}
		</button> 
	</div>

	<div id="secret" class:show-secret={show_secret}>
		<h3>You've gotten pretty far...<br>How about starting over?</h3>
		<hr>
		<p>
			In this fresh start, called "New Game+", 
			you will unlock the elusive <em>5th Orb</em>, 
			more events (like those shadow orbs), and more monsters.
			<br><br>"That's cool and all, but what's the catch?" I here you say. 
			Well, the game is twice as hard.<br><br>
			<b>So, what'll it be?</b>
		</p>
		<div>
			<button on:click={()=> void(show_secret=false, set_new_game_plus())}>Yeah, I guess</button>
			<button on:click={()=> void(show_secret=false)}>Hm... nah</button>
		</div>
	</div>
</main>

<style>
	main {
		/* display: none; */
		position: absolute;
		left: 50%;
		bottom: 100%;
		transform: translate(-50%, 0);
		width: 50%;
		height: 80%;
		background-color: #656565;
		transition-duration: 0.3s;
		display: grid;
		grid-auto-rows: max-content;
		padding: 1rem;
		gap: 0.5rem;
		border: 1px solid white;
		border-radius: 10px;
		overflow: hidden;
	}
	.open {
		bottom: 50%;
		transform: translate(-50%, 50%);
	}
	hr {
		margin: 0.5rem 0;
		border: 1px solid black;
	}
	/* .sect { } */
	.sect-title {
		padding: 0.5rem 0.7rem;
		text-align: center;
		color: white;
	}

	.rendering-row {
		display: grid;
		grid-template-columns: repeat(6, max-content);
		gap: 1px;
	}
	.rendering-row button, #btn-trio button {
		background: #444;
		color: white;
		border: none;
		border-radius: 0;
		margin: 0;
	}
	.rendering-row button {
		padding: 0.5rem 0px;
	}
	.rendering-row .selected {
		background-color: #555;
		border-bottom: 1px solid white;
	}

	#data {
		display: grid;
		grid-template-columns: max-content 1fr;
		grid-template-rows: max-content max-content;
		gap: 0 0.5rem;
	}
	#data button, #render-amount button {
		background-color: #444;
		color: white;
		border: none;
		padding: 0.5rem 0.7rem;
	}

	#render-amount {
		display: grid;
		/* grid-template-columns: max-content 1fr; */
		grid-template-rows: max-content max-content;
	}
	#render-amount .sect-title {
		padding-top: 0;
		padding-bottom: 0;
	}
	#render-amount div {
		display: grid;
		grid-template-columns: max-content 1fr;
		grid-template-rows: max-content;
		gap: 0 0.5rem;
	}
	#render-amount p {
		color: #bbb;
		text-align: center;
		padding-top: 0.3rem;
	}

	#render-mod {
		display: grid;
		grid-template-rows: max-content max-content;
		grid-template-columns: 1fr;
	}

	#btn-trio {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 0.5rem;
	}
	#btn-trio button:disabled {
		background-color: #333;
		color: #777;
		pointer-events: none;
	}

	#secret {
		position: absolute;
		left: 0;
		top: 0;
		width: calc(100% - 2rem);
		height: calc(100% - 2rem);;
		background-color: #333;
		color: #ddd;
		display: grid;
		align-content: center;
		justify-content: center;
		text-align: center;
		padding: 1rem;
		transition-duration: 0.3s;
		/* color: white; */
	}
	#secret:not(.show-secret) {
		opacity: 0;
		pointer-events: none;
	}
	#secret hr {
		width: 50%;
		margin: 0.5rem auto;
	}
	#secret h3 {
		padding: 0.5rem 0.7rem;
		font-size: 2rem;
	}
	#secret p {
		padding: 0.5rem 0.7rem;
		font-size: 1.1rem;
	}
	#secret div {
		padding: 0.5rem 5rem;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}
	#secret div button {
		padding: 0.5rem 0.7rem;
		background-color: #555;
		color: white;
		border: none;
	}
</style>