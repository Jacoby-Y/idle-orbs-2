<script>
	// import { timer, cash, bounce_size, collector_pos, orb_count } from "../stores.js";
	import { cash, mana, shifting, basic_orb, light_orb, homing_orb, spore_orb, prestige, starting_cash, bounce, got_mana, orb_double } from "../stores.js";
	import { sci } from "../functions.js";

	//#region | Buy Bounce Power
	const buy_bounce_power = ()=>{
		if ($cash < $bounce.power_cost) return;
		$cash -= $bounce.power_cost;
		$bounce.power += 2.5;
		$bounce.power_cost = Math.floor($bounce.power_cost * 1.5);
		$bounce = $bounce;
		if ($shifting) buy_bounce_power();
	}
	//#endregion
	//#region | Auto Bounce
	const buy_auto_bounce = ()=>{
		if ($cash < $bounce.auto_cost || $bounce.auto_unlocked) return;
		$cash -= $bounce.auto_cost;
		$bounce.auto_unlocked = true;
		$bounce = $bounce;
	};
	//#endregion
	//#region | Bounce Area
	const increase_bounce_area = ()=>{
		if ($cash < $bounce.size_cost || $bounce.size >= 275) return;
		$cash -= $bounce.size_cost;
		$bounce.size_cost *= 2;
		$bounce.size += 25;
		$bounce = $bounce;
		if ($shifting) increase_bounce_area();
	}
	//#endregion
	//#region | Prestige
	/** @type {HTMLElement} */
	let prest_btn;
	let prest_hover = false;
	$: { // Prestige Button
		if (prest_btn != undefined) {
			prest_btn.onmouseenter = ()=> prest_hover = true;
			prest_btn.onmouseleave = ()=> prest_hover = false;
		}
		}
	
	const do_prestige = (bypass=false)=>{
		if ($cash < $prestige.cost && bypass !== true) return;
		$cash = $starting_cash.amount;
		basic_orb.update( v => (v.amount = 1, v.cost = 50, v));
		light_orb.update( v => (v.amount = 0, v.cost = 1, v));
		homing_orb.update( v => (v.amount = 0, v.cost = 3, v));
		spore_orb.update( v => (v.amount = 0, v.cost = 3, v));
		$bounce = {
			power: 30,
			power_cost: 250,
			size: 75,
			size_cost: 500,
			auto_cost: 350,
			auto_unlocked: false,
			auto_on: true,
		};

		prestige.update( v => (v.times++, v.cost = Math.round(v.cost * 1.25), v) );
	}
	//#endregion
	//#region | Post-Prestige Cash
	const buy_starting_cash = ()=>{
		if ($cash < $starting_cash.cost) return;
		if ($shifting) {
			const total = Math.floor($cash/$starting_cash.cost);
			$cash -= $starting_cash.cost*total;
			starting_cash.update( v => (v.amount += total, v));
		} else {
			$cash -= $starting_cash.cost;
			starting_cash.update( v => (v.amount++, v));
		}
	}
	//#endregion
	//#region | Orb Doubler
	const double_values = ()=>{
		if ($mana < $orb_double.cost) return;
		$mana -= $orb_double.cost;
		$orb_double.cost *= 3;
		$orb_double.value++;
		$orb_double = $orb_double;
		if ($shifting) double_values();
	}
	//#endregion
</script>

<main id="main-shop">
	<h3 id="cash">Cash: {sci($cash)}</h3>
	<h3 id="max-buy-hint">Shift + Click to buy max</h3>
	<hr id="top-hr">
	<!-- <button on:click={buy_basic}>Buy a Basic Orb <b>${sci($basic_orb.cost)}</b></button> -->
	<button on:click={buy_bounce_power}>Increase Bounce Power <b>${sci($bounce.power_cost)}</b></button>
	<button on:click={buy_auto_bounce}>Unlock Auto Bounce <b>{$bounce.auto_unlocked ? "Unlocked!" : `$${sci($bounce.auto_cost)}`}</b></button>
	<button on:click={increase_bounce_area}>Increase Bounce Area <b> {#if $bounce.size < 275} ${sci($bounce.size_cost)} {:else} Max! {/if} </b></button>
	<button on:click={buy_starting_cash}>Starting Cash +1 (${sci($starting_cash.amount)}) <b>${sci($starting_cash.cost)}</b></button>
	{#if $got_mana} <button on:click={double_values}>Double All Orb Values <b>{sci($orb_double.cost)}₪</b></button>
	{:else} <div></div> {/if}
	<div></div>
	<h3 id="orb-info">Orb Value Bonus: +{sci($prestige.times*50)}% {prest_hover ? "(+50%)" : ""}</h3>
	<button bind:this={prest_btn} on:click={do_prestige}>Prestige <b>${sci($prestige.cost)}</b></button>
</main>

<style>
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
		position: relative;
		background: #00443b;
		padding: 1rem;
		display: grid;
		gap: 0.5rem;
		grid-auto-rows: max-content;
		grid-template-rows: repeat(7, max-content) 1fr repeat(2, max-content);
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
	#max-buy-hint {
		position: absolute;
		top: 0;
		right: 0;
		color: #888;
		padding: 1rem;
	}
</style>