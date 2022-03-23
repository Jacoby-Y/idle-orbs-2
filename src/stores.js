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

export const cash = w(0);