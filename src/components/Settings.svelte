<script>
	import { render_mode, get_data, load_data, max_render } from "../stores.js";
	export let open;
	export let settings;

	let get_data_str = "";
	let load_data_str = "";
	let render_amount = 100;
	// $: console.log(render_amount);
</script>

<main class:open id="settings" bind:this={settings}>
	<div class="sect">
		<h3 class="sect-title">Rendering Mode</h3>
		<div class="rendering-row">
			<button class:selected={$render_mode == 0} on:click={()=> $render_mode = 0}>Squares</button>
			<button class:selected={$render_mode == 1} on:click={()=> $render_mode = 1}>Circles</button>
			<button class:selected={$render_mode == 2} on:click={()=> $render_mode = 2}>Sand</button>
			<button class:selected={$render_mode == 3} on:click={()=> $render_mode = 3}>Pixelated</button>
			<button class:selected={$render_mode == 4} on:click={()=> $render_mode = 4}>None</button>
		</div>
	</div>
	<hr>
	<div class="sect" id="render-amount">
		<h3 class="sect-title">Max Rendered Orbs: {render_amount}</h3>
		<div>
			<button on:click={()=> $max_render = render_amount}>Set</button> <input placeholder="Set max orbs rendered. Default: 200" type="range" step="10" min="0" max="1000" id="render" bind:value={render_amount}>
		</div>
		<p>Default: 100. Save data before changing to a really high number! (Could crash game)</p>
	</div>
	<hr>
	<div class="sect" id="data">
		<button on:click={()=> get_data_str = get_data()}>Get Data</button> <input placeholder="Your data will appear here" type="text" name="get" id="get" bind:value={get_data_str}>
		<button on:click={()=> load_data(load_data_str)}>Load Data</button> <input placeholder="Paste your data here" type="text" name="load" id="load" bind:value={load_data_str}>
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
		grid-template-columns: repeat(5, 1fr);
	}
	.rendering-row button {
		background: #444;
		color: white;
		border: none;
		border-radius: 0;
		margin: 0;
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
</style>