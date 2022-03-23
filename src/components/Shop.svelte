<script>
	// import { timer, cash, bounce_size, collector_pos, orb_count } from "../stores.js";
	import { 
		cash,
		more_orbs_cost, auto_bounce, orb_count, bounce_size, bounce_area_cost, orb_bonus,
		prestige,
		timer,
	} from "../stores.js";
	import { sci } from "../functions.js";

	//#region | More Orbs
	const buy_more_orbs = ()=>{
		if ($cash < $more_orbs_cost) return;
		$cash -= $more_orbs_cost;
		$more_orbs_cost = Math.round($more_orbs_cost * 1.5);
		$orb_count++;
	}
	//#endregion
	//#region | Auto Bounce
	const buy_auto_bounce = ()=>{
		if ($cash < $auto_bounce.cost) return;
		$cash -= $auto_bounce.cost;
		auto_bounce.update( v => (v.unlocked = true, v) );
	};
	//#endregion
	//#region | Bounce Area
	const increase_bounce_area = ()=>{
		if ($cash < $bounce_area_cost) return;
		$cash -= $bounce_area_cost;
		$bounce_area_cost *= 2;
		$bounce_size += 25;
	}
	//#endregion
	//#region | Prestige
	/** @type {HTMLElement} */
	let prest_btn;
	let prest_hover = false;
	$: {
		if (prest_btn != undefined) {
			prest_btn.onmouseenter = ()=> prest_hover = true;
			prest_btn.onmouseleave = ()=> prest_hover = false;
		}
	}
	const do_prestige = (bypass=false)=>{
		if ($cash < $prestige.cost && bypass !== true) return;
		$cash = 0;
		$orb_count = 1;
		$auto_bounce.unlocked = false;

		prestige.update( v => (v.times++, v.cost = Math.round(v.cost * 1.25), v) );
	}
	//#endregion

</script>

<main>
	<div id="main-shop">
		<h3 id="cash">Cash: {sci($cash)}</h3>
		<hr id="top-hr">
		<button on:click={buy_more_orbs}>More Orbs <b>${sci($more_orbs_cost)}</b></button>
		<button on:click={buy_auto_bounce}>Unlock Auto Bounce <b>{$auto_bounce.unlocked ? "Unlocked!" : `$${sci($auto_bounce.cost)}`}</b></button>
		<button on:click={increase_bounce_area}>Increase Bounce Area <b>${sci($bounce_area_cost)}</b></button>
		<div></div>
		<h3 id="orb-info">Orb Prestige Bonus: +{sci($prestige.times*50)}% {prest_hover ? "(+50%)" : ""}</h3>
		<button bind:this={prest_btn} on:click={do_prestige}>Prestige <b>${sci($prestige.cost)}</b></button>
	</div>
	<div></div>
</main>

<style>
	main {
		position: absolute;
		width: 100%;
		height: 100%;
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr;
	}
	button {
		width: 100%;
		text-align: left;
		padding: 0.5rem 0.7rem;
		margin: 0;
	}
	button b {
		float: right;
	}
	#main-shop {
		background: #00443b;
		padding: 1rem;
		display: grid;
		gap: 0.5rem;
		grid-auto-rows: max-content;
		grid-template-rows: repeat(5, max-content) 1fr repeat(2, max-content);
		border-right: 1px solid white;
	}
	#main-shop button {
		background-color: #007a6a;
		border: none;
		color: white;
	}
	#cash {
		padding: 0;
		color: #1dddc3;
	}
	#top-hr {
		border: 1px solid #4d8b4d;
		margin-bottom: 0.15rem;
	}
	#orb-info {
		font-weight: normal;
		color: #1dddc3;
		font-size: 1rem;
	}
</style>