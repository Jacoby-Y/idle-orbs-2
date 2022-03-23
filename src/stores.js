//#region | Setup
import { writable } from "svelte/store";

const is_nullish = (val)=> ( val === undefined || val === "undefined" || val === null )
const get_or = (k, v)=> is_nullish(localStorage[k]) ? (localStorage[k] = v, v) : JSON.parse(localStorage[k]);

// const w = (k, v)=>{
// 	// console.log(`key: ${k}, get_or: ${get_or(k, v)}`);
// 	to_store[k] = get_or(k, v);
// 	return writable(to_store[k]);
// };
const w = writable;

const to_store = {};
//#endregion

export const timer = writable(0);
let ticks = 0; timer.subscribe( v => ticks = v );
const timer_loop = setInterval(() => {
	if (ticks < 29) timer.update( v => v+1 );
	else timer.set(0);
}, 1000/30);

let deci = 0;
export const cash = w(0);
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
})

export const bounce_size = w(75);
export const bounce_area_cost = w(500);
export const collector_pos = w(250);
export const orb_count = w(1);

export const more_orbs_cost = w(100);
export const auto_bounce = w({
	cost: 500,
	unlocked: false
});

export const prestige = w({
	cost: 1e4,
	times: 0,
});

export const orb_bonus = writable(1);