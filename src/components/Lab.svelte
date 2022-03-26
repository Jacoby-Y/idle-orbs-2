<script>
	import { sci } from "../functions.js";
	import { 
		canvas_toggled, fighting, mana, cash, fight_cost, total_monster_killed as tmk,
		basic_orb, light_orb, homing_orb, trades, prestige, rarities, unlocked_fighting, got_mana, next_tower_lvl, shifting
	} from "../stores.js";
	import Artifacts from "./Artifacts.svelte";

	$: if (!$unlocked_fighting && $prestige.times >= 5) $unlocked_fighting = true;
	$: if (!$got_mana && $mana > 0) $got_mana = true;
	$: {
		const L = $next_tower_lvl-1;
		const t = Math.floor(L / 5);
		if (t < 20) {
			rarities.update( v => (
				v.c = 100 - t*5,
				v.u = t*4,
				v.r = t, v
			));
		} else if (t < 40) {
			rarities.update( v => (
				v.c = 0,
				v.u = 95 - (t-20)*5,
				v.r = 5 + (t-20)*4,
				v.l = (t-20), v
			));
		} else if (t < 120) {
			rarities.update( v => (
				v.c = 0,
				v.u = 0,
				v.r = 80 - (t-40),
				v.l = 20 + (t-40), v
			));
		} else {
			rarities.update( v => (
				v.c = 0,
				v.u = 0,
				v.r = 0,
				v.l = 100, v
			));
		}
	}

	//#region | Fight Button
	/** @type {HTMLElement} */
	let fight_btn;
	let hover_fight = false;
	$: $fight_cost = 1e3 * (1 + 1.2 * ($next_tower_lvl-1));
	$: if ($fighting && fight_btn != undefined) fight_btn.disabled = true;
	$: if (!$fighting && fight_btn != undefined) fight_btn.disabled = false;
	
	$: { if (fight_btn != undefined){
		fight_btn.onclick = ()=> {
			if ($cash < $fight_cost || $fighting) return;
			$cash -= $fight_cost;
			$canvas_toggled = true;
			$fighting = true;
		}
		fight_btn.onmouseenter = ()=> hover_fight = true;
		fight_btn.onmouseleave = ()=> hover_fight = false;
	}}
	//#endregion
	//#region | Buy Orbs
	// Math.ceil(Math.floor(#*1.2)/1.2)

	let total_orbs = 0;
	$: total_orbs = $basic_orb.amount + $light_orb.amount + $homing_orb.amount;

	//#region | Basic Orb
	const buy_basic = ()=>{
		if ($cash < $basic_orb.cost) return;
		$cash -= $basic_orb.cost;
		basic_orb.update( v => (v.cost = Math.floor(v.cost*1.1), v.amount++, v) );
		if ($shifting) buy_basic();
	};
	const sell_basic = ()=>{
		if (total_orbs <= 1) return;
		$cash += Math.floor($basic_orb.cost/2);
		basic_orb.update( v => (v.cost = Math.ceil(v.cost/1.2), v.amount--, v) );
	}
	//#endregion
	//#region | Light Orb
	const buy_light = ()=>{
		if ($mana < $light_orb.cost) return;
		$mana -= $light_orb.cost;
		light_orb.update( v => (v.cost += 1, v.amount++, v) );
		if ($shifting) buy_light();
	};
	const sell_light = ()=>{
		if (total_orbs <= 1) return;
		$mana += Math.floor($light_orb.cost/2.2);
		light_orb.update( v => (v.cost -= 1, v.amount--, v) );
	}
	//#endregion
	//#region | Homing Orb
	const buy_homing = ()=>{
		if ($mana < $homing_orb.cost) return;
		$mana -= $homing_orb.cost;
		homing_orb.update( v => (v.cost += 5, v.amount++, v) );
		if ($shifting) buy_homing();
	};
	const sell_homing = ()=>{
		if (total_orbs <= 1) return;
		$mana += Math.floor($homing_orb.cost/2.2);
		homing_orb.update( v => (v.cost -= 5, v.amount--, v) );
	}
	//#endregion
	//#endregion
</script>

<main>
	<h3 id="mana">Mana <span style="font-weight: normal;">(₪)</span>: {$mana}</h3>
	<div id="hold-btn">
		{#if $unlocked_fighting}
			<button bind:this={fight_btn} id="fight-btn">
				Monster Tower Lvl {$next_tower_lvl} | <b>${sci($fight_cost)}</b>
				<h3 id="rarities">
					{#if $rarities.c > 0}<span style="color: #ddd;">Common: {$rarities.c}%</span>{/if} 
					{#if $rarities.c > 0 && $rarities.u > 0} | {/if}
					{#if $rarities.u > 0}<span style="color: #B8E986;">Uncommon: {$rarities.u}%</span>{/if}
					{#if $rarities.r > 0}<span style="color: #48BAFF;">Rare: {$rarities.r}%</span>{/if}
					{#if $rarities.c > 0 || $rarities.u > 0} <br> {/if}
					{#if $rarities.r > 0 && $rarities.l > 0} | {/if}
					{#if $rarities.l > 0}<span style="color: #F8E71C;">Legendary: {$rarities.l}%</span>{/if}
				</h3> 
			</button>
		{:else}
			<!-- <img id="img" src="./assets/locked.svg" alt="Padlock"> -->
			<h3 id="info">Unlock After {5-$prestige.times} Prestiges</h3>
		{/if}
	</div>
	<div id="orb-row">
		<button class="trade-btn" id="basic-btn">Basic
			<p class="stat">Dmg/Value: {$basic_orb.value}</p>
			<div class="orb-info">
				<button class="buy-sell" on:click={buy_basic}>Buy ${sci($basic_orb.cost)}</button>
				<button class="buy-sell" on:click={sell_basic}>Sell</button>
			</div>
		</button>
		{#if $got_mana}
		<button class="trade-btn" id="light-btn">Light
			<p class="stat">Dmg/Value: {$light_orb.value}</p>
			<div class="orb-info">
				<button class="buy-sell" on:click={buy_light}>Buy {sci($light_orb.cost)}₪</button>
				<button class="buy-sell" on:click={sell_light}>Sell</button>
			</div>
		</button>
		<button class="trade-btn" id="homing-btn">Homing
			<p class="stat">Dmg/Value: {$homing_orb.value}</p>
			<div class="orb-info">
				<button class="buy-sell" on:click={buy_homing}>Buy {sci($homing_orb.cost)}₪</button>
				<button class="buy-sell" on:click={sell_homing}>Sell</button>
			</div>
		</button>
		{:else}
		<button disabled>?</button>
		<button disabled>?</button>
		{/if}
		<button disabled>?</button>
		<button disabled on:click={()=> $next_tower_lvl += 10}>?</button>
	</div>
	<h3 id="orb-stats">
		<span style="color: #ccc;">Basic Orbs: {$basic_orb.amount}</span><br>
		{#if $got_mana}
			<span style="color: #00cccc;">Light Orbs: {$light_orb.amount}</span><br>
			<span style="color: #cccc00;">Homing Orbs: {$homing_orb.amount}</span>
			{/if}
	</h3>

	<Artifacts />
</main>

<style>
	/* #f97171 */
	main {
		position: relative;
		background-color: #3c3c3c;
		display: grid;
		grid-template-rows: max-content 30% repeat(2, max-content);
		padding: 1rem;
	}
	#img {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 5rem;
		height: 5rem;
		border: 1px solid white;
	}
	#info {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		color: white;
		width: max-content;
		background-color: #343434;
		padding: 2.75rem 8rem;
	}

	#mana {
		color: white;
	}
	#hold-btn {
		position: relative;
		display: grid;
		justify-items: center;
		align-items: center;
	}
	#rarities {
		position: absolute;
		left: 50%;
		top: 100%;
		padding: 0.5rem 0.7rem;
		transform: translate(-50%, 0);
		color: white;
		font-weight: normal;
		width: max-content;
		pointer-events: none;
		display: none;
	}
	#fight-btn:hover #rarities {
		display: block;
	}
	#fight-btn {
		position: relative;
	}
	button {
		background-color: #686f79;
		border: none;
		color: white;
		padding: 0.5rem 0.7rem;
		margin: 0;
	}

	#orb-stats {
		position: absolute;
		bottom: 0;
		left: 0;
		padding: 0.5rem 0.7rem;
		font-weight: normal;
	}

	.trade-btn { position: relative; }
	.trade-btn:hover .orb-info {
		position: absolute;
		left: 50%;
		top: 99%;
		display: grid;
		grid-template-columns: 1fr;
		padding: 0.5rem;
		gap: 0.5rem;
		width: 100%;
		transform: translate(-50%, 0);
		width: max-content;
	}
	.trade-btn:hover {
		opacity: 1;
	}
	.trade-btn:hover .stat {
		display: block;
		position: absolute;
		left: 50%;
		bottom: 100%;
		transform: translate(-50%, 0);
		padding: 0.5rem 0.7rem;
		font-size: 0.8rem;
		width: max-content;
	}
	.trade-btn .orb-info {
		display: none;
	}
	.trade-btn .stat {
		display: none;
	}
	#orb-row {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0.5rem;
	}
	.buy-sell {
		background-color: #686f79;
	}

	#light-btn {
		background-color: #1c6f77;
	}
	#homing-btn {
		background-color: #71771c;
	}
	button:disabled {
		background-color: #52575f;
		pointer-events: none;
	}
</style>