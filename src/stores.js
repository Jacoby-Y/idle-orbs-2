//#region | Setup
import { get, writable } from "svelte/store";

const is_nullish = (val)=> ( val === undefined || val === "undefined" || val === null );

const loaded = is_nullish(localStorage.IdleOrbs2) ? {} : JSON.parse(localStorage.IdleOrbs2);

const get_or = (k, v)=> is_nullish(loaded[k]) ? v : loaded[k];

const w = (k, v)=>{
	store_keys.push(k);
	writables[k] = writable(get_or(k, v));
	return writables[k];
};
// const w = writable;

const store_keys = [];
const writables = {};
// window.writables = {};
//#endregion

//#region | Timer
export const timer = writable(0);
let ticks = 0; timer.subscribe( v => ticks = v );
const timer_loop = setInterval(() => {
	if (ticks < 29) timer.update( v => v+1 );
	else timer.set(0);
}, 1000/30);
//#endregion
//#region | Cash
let deci = 0;
export const cash = w("cash", 0);
cash.subscribe((v)=>{
	if (Math.floor(v) != v) {
		deci += v - Math.floor(v);
		if (deci >= 1) {
			v += Math.floor(deci);
			deci -= Math.floor(deci);
			cash.set(v);
		} else {
			cash.set(Math.floor(v));
		}
	}
});
//#endregion
//#region | Shop
export const collector_pos = writable(250);
export const bounce = w("bounce", {
	power: 30,
	power_cost: 250,
	size: 75,
	size_cost: 500,
	auto_cost: 350,
	auto_unlocked: false,
	auto_on: true,
});
export const starting_cash = w("starting_cash", {
	cost: 25,
	amount: 0,
});
//#endregion
//#region | Orbs
export const basic_orb = w("basic_orb", { //-! DEBUG
	amount: 1,
	cost: 50,
	value: 1
});
export const light_orb = w("light_orb", {
	amount: 0,
	cost: 1,
	value: 1
});
export const homing_orb = w("homing_orb", {
	amount: 0,
	cost: 3,
	value: 0.5,
});
export const spore_orb = w("spore_orb", {
	amount: 0,
	cost: 3,
	value: 1,
	sub_value: 0.2,
});
//#endregion
//#region | Prestige
export const prestige = w("prestige", {
	cost: 1e4,
	times: 0,
});
//#endregion
//#region | Fighting
export const next_tower_lvl = w("next_tower_lvl", 1);
export const fight_cost = w("fight_cost", 1e3);
export const unlocked_fighting = writable(false);
export const fighting = writable(false);
export const afford_fight = writable(()=> false );
export const auto_fight = writable(false);
export const rarities = writable({
	c: 100, u: 0, r: 0, l: 0
});
//#endregion
//#region | Mana
export const got_mana = w("got_mana", false);
export const mana = w("mana", 0);
//#endregion

export const canvas_toggled = writable(true);
export const shifting = writable(false);

export const clear_storage = ()=>{
	window.onbeforeunload = null;
	localStorage.clear();
	location.reload();
}

window.onbeforeunload = ()=>{
	let store_obj = {};
	store_keys.forEach((k)=> store_obj[k] = get(writables[k]) );
	localStorage.IdleOrbs2 = JSON.stringify(store_obj);
}