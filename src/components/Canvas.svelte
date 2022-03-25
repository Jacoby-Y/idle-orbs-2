<script>
	import { onMount } from "svelte";
	import { 
		timer, cash, bounce_size, collector_pos, auto_bounce, orb_bonus,
		basic_orb, light_orb, homing_orb,
		canvas_toggled as toggled, fighting, mana, total_monster_killed as tmk, shifting
	} from "../stores.js";
	import { manager, small_explosion } from "../particles.js";
	import { sci } from "../functions.js";

	const set_orbs = ()=>{
		orbs.free_all();
		for (let i = 0; i < $basic_orb.amount; i++) {
			orbs.new(Math.round(Math.random()*1000), 580, 0, 0, "basic");
		}
		for (let i = 0; i < $light_orb.amount; i++) {
			orbs.new(Math.round(Math.random()*1000), 580, 0, 0, "light");
		}
		for (let i = 0; i < $homing_orb.amount; i++) {
			orbs.new(Math.round(Math.random()*1000), 580, 0, 0, "homing");
		}
		return;
	};

	$: {
		$basic_orb;
		$light_orb;
		$homing_orb;
		set_orbs();
	}
	
	//#region | Canvas
	let main;
	/** @type {HTMLCanvasElement} */
	let canvas;
	/** @type {CanvasRenderingContext2D} */
	let ctx;
	let pause = false;
	let step = false;

	let w, h; 
	//#endregion
	//#region | Orbs
	const distance = (pos1, pos2)=>{
		let y = pos2.y - pos1.y;
    let x = pos2.x - pos1.x;
    
    return Math.sqrt(x * x + y * y);
	}
	const rand_width = ()=>{
		return Math.round(Math.random()*1000);
	}
	const rand_height = ()=>{
		return Math.round(Math.random()*600);
	}
	const rand_pos = ()=>{
		return { 
			x: Math.round(Math.random()*1000),
			y: Math.round(Math.random()*1000),
		}
	}
	const orbs = {
		list: [],
		homing: [],
		// pos: [],
		// vect: [],
		// grounded: [],
		col(orb, xy, mult) { 
			xy = xy == 0 ? "vx" : "vy";
			orb[xy] = Math.abs(orb[xy]) * mult; 
		},
		draw(orb) {
			const type = orb.type;
			if (type == "basic") ctx.fillStyle = "#ffffff99";
			else if (type == "light") ctx.fillStyle = "#33ffffaa";
			else if (type == "homing") return;
			ctx.fillRect(orb.x, orb.y, 20, 20);
		},
		draw_homing() {
			ctx.fillStyle = "#ffff33aa";
			if (this.homing.length > 201) {
				const range = this.homing.length;
				const points = 201;
				const gap = range/points;
				let total = 0;
				for (let i = 0; i < points; i++) {
					const orb = this.homing[Math.floor(gap*i)];
					if (orb == undefined) continue;
					ctx.fillRect(orb.x, orb.y, 20, 20);
					total++;
				}
				return total;
			} else {
				for (let i = 0; i < this.homing.length; i++) {
					const orb = this.homing[i];
					ctx.fillRect(orb.x, orb.y, 20, 20);
				}
			}
			return this.homing.length;
		},
		basic_physics(orb) {
			orb.vy += 1;
			orb.vx *= 0.99;
			orb.vy *= 0.99;

			if (orb.y+20 >= canvas.height) {
				this.col(orb, 1, -1);
				orb.vy *= 0.85;
				// if (Math.abs(orb.vy) < 10) orb.vy *= 0.85;
				// if (Math.abs(orb.vy) < 6) orb.vy *= 0.85;
				// if (Math.abs(orb.vy) < 3) (orb.vx = 0, orb.vy = 0, orb.grounded = true);
				if (Math.abs(orb.vy) <= 10) orb.vy *= 0.5;
				if (Math.abs(orb.vy) <= 3) orb.vy = 0;
				if (Math.abs(orb.vy) <= 0.5) orb.vx *= 0.9;
				if (Math.abs(orb.vy) == 0 && Math.abs(orb.vx) < 1) (orb.vy = 0, orb.vx = 0, orb.grounded = true);
				// console.log(orb.vy);
				orb.y = canvas.height - 20;
			}
		},
		light_physics(orb) {
			orb.vy += 0.8;
			orb.vx *= 0.99;
			orb.vy *= 0.99;

			if (orb.y+20 >= canvas.height) {
				this.col(orb, 1, -1);
				if (Math.abs(orb.vy) >= 15) orb.vy *= 0.98;
				else orb.vy *= 0.85;
				if (Math.abs(orb.vy) < 15) (orb.vy *= 0.7, orb.vx *= 0.7);
				if (Math.abs(orb.vy) < 5) (orb.vy *= 0.7, orb.vx *= 0.7);
				if (Math.abs(orb.vy) < 1) (orb.vy = 0, orb.vx = 0, orb.grounded = true);
				// console.log(orb.vy);
				orb.y = canvas.height - 20;
			}
		},
		homing_physics(orb) {
			orb.x += orb.vx;
			orb.y += orb.vy;

			orb.vx *= 0.9;
			orb.vy *= 0.9;

			if (mouse.hovering) {
				const push_to = (pos1, pos2, mult)=>{
					const ang = Math.atan2((pos1.y-10)-pos2.y, (pos1.x-10)-pos2.x);
					orb.vx += Math.cos(ang) * mult;
					orb.vy += Math.sin(ang) * mult;
				};

				let count = this.homing.length;
				let index = orb.index;

				const to_pos = { x: undefined, y: undefined };
				if (index % 2 == 0) {
					to_pos.x = Math.cos((6.242)/count * index + (6.282*($timer/29)))*100 + mouse.x-10, 
					to_pos.y = Math.cos((6.242)/count * index + (6.282*($timer/29)))*100 + mouse.y-10  
				} else {
					to_pos.x = Math.cos((6.282/count * index + (6.282*($timer/29)))%6.282)*50 + mouse.x, 
					to_pos.y = Math.sin((6.282/count * index + (6.282*($timer/29)))%6.282)*50 + mouse.y  
				}

				const dist_to = distance(orb, to_pos);
				const mult = 1.2;
				push_to(to_pos, orb, dist_to < 200 ? 1.2 : 2);
				}
			if (orb.y+20 >= canvas.height) {
				this.col(orb, 1, -1);
				orb.y = canvas.height - 20;
				}
		},
		collide_monster(orb) {
			// c1 = 400, 200 / c2 = 600, 300
			const pt1 = monster.pt1;
			const pt2 = monster.pt2;
			if (orb.y >= pt1.y-20 && orb.y <= pt2.y) {
				// console.log("in horz area");
				if (orb.lx+20 < pt1.x && orb.x+20 >= pt1.x) {
					orb.vx = Math.abs(orb.vx) * -1;
					orb.x = pt1.x-20;
					return true;
				} else if (orb.lx > pt2.x && orb.x <= pt2.x) {
					orb.vx = Math.abs(orb.vx);
					orb.x = pt2.x;
					return true;
				}
			}
			if (orb.x >= pt1.x-20 && orb.x <= pt2.x) {
				// console.log("in vert area");
				if (orb.ly+20 < pt1.y && orb.y+20 >= pt1.y) {
					orb.vy = Math.abs(orb.vy) * -1;
					orb.y = pt1.y-20;
					if (Math.abs(orb.vx) < 0.1) orb.vx = 1;
					orb.vx *= 1.5;
					return true;
				} else if (orb.ly > pt2.y && orb.y <= pt2.y) {
					orb.vy = Math.abs(orb.vy);
					orb.y = pt2.y;
					return true;
				}
			}
			return false;
		},
		physics(orb) {
			if (orb.grounded) return;

			orb.lx = orb.x;
			orb.ly = orb.y;

			orb.x += orb.vx;
			orb.y += orb.vy;
			
			if (orb.type == "basic") this.basic_physics(orb);
			if (orb.type == "light") this.light_physics(orb);
			if (orb.type == "homing") this.homing_physics(orb);

			if (orb.x+20 >= canvas.width) {
				this.col(orb, 0, -1);
				orb.x = canvas.width - 20;
			}
			else if (orb.x <= 0) {
				this.col(orb, 0, 1);
				orb.x = 0;
			}
			if (orb.y <= 0) {
				this.col(orb, 1, 1); 
				orb.y = 0;
			}

			if ($fighting) { 
				const hit = this.collide_monster(orb);
				if (hit) {
					monster.hit(1);
				}
			}

			if (orb.y < $collector_pos && orb.ly > $collector_pos) this.collect(orb);
			else if (orb.y > $collector_pos && orb.ly < $collector_pos) this.collect(orb); 
		},
		collect(orb) {
			if ($fighting) return;
			if (orb.type == "basic") $cash += $basic_orb.value;
			else if (orb.type == "light") $cash += $light_orb.value;
			else if (orb.type == "homing") $cash += $homing_orb.value;
			// ctx.fillStyle = "lime";
			// ctx.fillRect(orb.x+5, orb.y+5, 10, 10);
		},
		update() {
			const full = this.list.concat(this.homing);
			for (let i = 0; i < full.length; i++) {
				const orb = full[i];
				this.draw(orb);
				this.physics(orb);
			}
			this.draw_homing();
		},
		new(x,y, vx, vy, type) {
			if (type == "homing") {
				this.homing.push({
					x,y, vx,vy, type,
					grounded: false,
					lx: x, ly: y,
					index: this.homing.length,
				});
			} else {
				this.list.push({
					x,y, vx,vy, type,
					grounded: false,
					lx: x, ly: y,
				});
			}
		},
		bounce(pos) {
			// for (let i = 0; i < this.pos.length; i++) {
			// 	if (this.pos[i][1] < 600-$bounce_size-21) continue;
			// 	if (pos != null) this.vect[i][0] += (pos[0] - this.pos[i][0])/100;
			// 	this.vect[i][1] -= 30 - Math.random()*3;
			// 	this.grounded[i] = false;
			// }
			for (let i = 0; i < this.list.length; i++) {
				const orb = this.list[i];
				if (orb.y < 600-$bounce_size-21) continue;
				if (pos != null) orb.vx += (pos[0] - orb.x)/100;
				orb.vy -= 30 - Math.random()*3;
				orb.grounded = false;
			}
		},
		free(i) {
			// this.pos.splice(i, 1);
			// this.vect.splice(i, 1);
			// this.grounded.splice(i, 1);
			this.list.splice(i, 1);
		},
		free_all() {
			this.list = [];
			this.homing = [];
		}
	};
	//#endregion
	//#region | onMount
	const main_loop = (v)=>{
		if (pause && !step) return;
		if (step) step = false;
		
		if (!visible && !$toggled) {
			orbs.update();
			manager.update(false);
			return;
		}

		// Background
		ctx.fillStyle = "#333636";
		ctx.fillRect(0, 0, w, h);
		
		// Bounce Area
		ctx.fillStyle = "#33ffcc33";
		ctx.fillRect(0, 600-$bounce_size, 1000, 600-$bounce_size);
		draw_auto_bounce_bar();

		// Collector Line
		if (!$fighting) {
			ctx.strokeStyle = "lime";
			ctx.beginPath();
			ctx.moveTo(0, 250);
			ctx.lineTo(1000, 250);
			ctx.stroke();
		} else {
			monster.draw();
		}

		manager.update();

		orbs.update();
	};
	onMount(()=>{
		ctx = canvas.getContext("2d");
		
		canvas.width = 1000;
		canvas.height = 600;
		w = canvas.width;
		h = canvas.height;

		set_orbs();
		timer.subscribe(main_loop);
		timer.subscribe(auto_bounce_loop);

		// key_up({ key: "Escape" });
	});
	//#endregion
	//#region | Events
	const mouse = {
		x: 0, y: 0,
		hovering: false,
	}
	/** @param {MouseEvent} e*/
	const mouse_move = (e)=>{
		[ mouse.x, mouse.y ] = [ e.layerX, e.layerY ];
	};
	const mouse_enter = ()=> mouse.hovering = true;
	const mouse_leave = ()=> mouse.hovering = false;
	const mouse_down = (e)=>{
		// orbs.new([10, 10], [10, Math.random()*15]);
		const [x, y] = [e.layerX, e.layerY];
		orbs.bounce([x, y]);
		small_explosion(ctx, [x, y]);
	}
	const key_up = (e)=>{
		const k = e.key;
		if      (k == " ") pause = !pause;
		else if (k == "s") step = !step;
		else if (k == "Tab" && $auto_bounce.unlocked) auto_bounce.update( v => (v.on = !v.on, v));
		else if (k == "Escape") $toggled = !$toggled;
		else if (k == "o") console.log(orbs);
		else if (k == "d") console.log(orbs.draw_homing());
		else if (k == "l") console.log(orbs.list.length + orbs.homing.length);
		else if (k == "a") console.log(monster);
		else if (k == "c") $cash += 10000;
		else if (k == "b") $bounce_size += 10;
		else if (k == "B") $bounce_size -= 10;
		else if (k == "m") console.log(mouse);
		else if (k == "r") set_orbs(); // Broken right now
		else if (k == "1") basic_orb.update( v => (v.amount++, v));  // orbs.new(rand_width(), 580, 					 0, 0, "basic");
		else if (k == "2") light_orb.update( v => (v.amount++, v));  // orbs.new(rand_width(), rand_height(), 0, 0, "light");
		else if (k == "3") homing_orb.update( v => (v.amount++, v)); // orbs.new(rand_width(), rand_height(), 0, 0, "homing");
		else if (k == "!") basic_orb.update( v => (v.amount > 0 ? v.amount-- : 0, v)); 
		else if (k == "@") light_orb.update( v => (v.amount > 0 ? v.amount-- : 0, v)); 
		else if (k == "#") homing_orb.update( v => (v.amount > 0 ? v.amount-- : 0, v));
		else if (k == "0") homing_orb.update( v => (v.amount += 10000, v)); //Array.from(Array(25000)).forEach(()=> orbs.new(rand_width(), rand_height(), 0, 0, "homing"));
		else if (k == "Shift") $shifting = false;
	};
	const key_down = (e)=>{
		const k = e.key;
		if (k == "Shift") $shifting = true;
	};
	
	$: { if (canvas != undefined) {
		canvas.onmousedown = mouse_down;
		canvas.onmousemove = mouse_move;
		canvas.onmouseenter = mouse_enter;
		canvas.onmouseleave = mouse_leave;
		document.body.onkeyup = key_up;
		document.body.onkeydown = key_down;
	}};
	//#endregion
	//#region | Visibility
	let visible = true;
	$: {
		if (main != undefined) {
			main.ontransitionend = ()=> visible = $toggled;
		}
	}
	//#endregion
	//#region | Auto Bounce
	const draw_auto_bounce_bar = ()=>{
		ctx.fillStyle = "#33ffcc11";
		ctx.fillRect(0, 600-($bounce_size*(auto_bounce_perc)), 1000, 600-($bounce_size*(auto_bounce_perc)));
	}
	let auto_bounce_perc = 0;
	$: if (!$auto_bounce.unlocked || !$auto_bounce.on) auto_bounce_perc = 0;
	const auto_bounce_loop = (v)=>{
		if (!$auto_bounce.unlocked || !$auto_bounce.on) return;
		auto_bounce_perc = Math.ceil(v/29*100)/100;

		if (v == 29) orbs.bounce(null);
	}
	//#endregion
	//#region | Monsters
	const rand_in_list = (list)=> list[Math.floor(Math.random()*list.length)];
	const monsters = {
		// hp: 100, worth: 1
		common: [ // white
			"Zombie",
			"Sea Monster",
		],
		// hp: 250, worth: 3
		uncommon: [ // light green
			"Stone Golem",
			"Young Wyvern",
		],
		// hp: 500, worth: 10
		rare: [ // aqua
			"Young Dragon",
			"Crystal Golem",
		],
		// hp: 1000, worth: 25
		legendary: [ // gold
			"Elder Dragon",
			"Block Head",
		]
	}
	const spawn_monster = ()=>{
		// Chances for common, uncommon, rare, legendary
		// 70, 20, 8, 2
		const rand = Math.random();
		if (rand <= 0.7) { 
			// Common
			const name = rand_in_list(monsters.common);
			// console.log(`Spawning a ${name}`);
			monster.max_hp = 100*(1 + 0.2*$tmk);
			monster.hp = monster.max_hp;
			monster.name = name;
			monster.src = `./assets/${name.toLowerCase().replaceAll(" ", "_")}.svg`;
			monster.worth = 1;
		} else if (rand <= 0.9) {
			// Uncommon
			const name = rand_in_list(monsters.uncommon);
			// console.log(`Spawning a ${name}`);
			monster.max_hp = 250*(1 + 0.2*$tmk);
			monster.hp = monster.max_hp;
			monster.name = name;
			monster.src = `./assets/${name.toLowerCase().replaceAll(" ", "_")}.svg`;
			monster.worth = 3;
		} else if (rand <= 0.98) {
			// Rare
			const name = rand_in_list(monsters.rare);
			// console.log(`Spawning a ${name}`);
			monster.max_hp = 500*(1 + 0.2*$tmk);
			monster.hp = monster.max_hp;
			monster.name = name;
			monster.src = `./assets/${name.toLowerCase().replaceAll(" ", "_")}.svg`;
			monster.worth = 10;
		} else {
			// Legendary
			const name = rand_in_list(monsters.legendary);
			// console.log(`Spawning a ${name}`);
			monster.max_hp = 1000*(1 + 0.2*$tmk);
			monster.hp = monster.max_hp;
			monster.name = name;
			monster.src = `./assets/${name.toLowerCase().replaceAll(" ", "_")}.svg`;
			monster.worth = 25;
		}
		monster = monster;
	}
	let monster = {
		hp: 100,
		max_hp: 300,
		pt1: { x: 300, y: 100 },
		pt2: { x: 700, y: 300 },
		name: "Stone monster",
		src: "./assets/robo_arm.svg",
		tick: 0,
		total_ticks: 600,
		worth: 1,
		draw() {
			ctx.fillStyle = "red";
			ctx.fillRect(this.pt1.x, this.pt1.y, this.pt2.x-this.pt1.x, this.pt2.y-this.pt1.y);
			ctx.fillStyle = "#444";
			ctx.fillRect(this.pt1.x+2, this.pt1.y+2, this.pt2.x-this.pt1.x-4, this.pt2.y-this.pt1.y-4);

			ctx.fillStyle = "#333";
			ctx.fillRect(this.pt1.x+10, this.pt2.y-30, this.pt2.x-this.pt1.x-20, 20);
			ctx.fillStyle = "#33aa33";
			ctx.fillRect(this.pt1.x+10, this.pt2.y-30, (this.pt2.x-this.pt1.x-20)*(this.hp/this.max_hp), 20);

			ctx.fillStyle = "#00ffff66";
			ctx.fillRect(this.pt1.x+1, this.pt1.y+1, (this.pt2.x-this.pt1.x)*(this.tick/this.total_ticks)-2, 5);

			if (this.tick > this.total_ticks) (this.tick = 0, $fighting = false);
			this.tick++;
		},
		hit(dmg) {
			this.hp -= dmg;
			if (this.hp <= 0) {
				this.tick = 0;
				// console.log("Mana increasing by: " + this.worth);
				$mana += this.worth;
				$tmk++;
				spawn_monster();
			}
		}
	}
	$: { if ($fighting) spawn_monster() }
	//#endregion
</script>

<main bind:this={main} style="opacity: {$toggled ? "1" : "0"}; pointer-events: {$toggled ? "all" : "none"};">
	<canvas bind:this={canvas}></canvas>
	<h3 id="cash">Cash: {sci($cash)}</h3>
	<h3 id="toggle-txt" style="bottom: {$bounce_size}px;">Press "Esc" to toggle shop</h3>
	{#if $auto_bounce.unlocked}
		<h3 id="toggle-bounce" style="bottom: {$bounce_size}px;">Press "Tab" to turn {$auto_bounce.on ? "off" : "on"} auto bounce</h3>
		{/if}
	{#if $fighting} 
		<button id="quit" on:click={()=> $fighting = false}>Quit</button> 
		<div 
			id="monster-info" 
			style="
				left: {monster.pt1.x}px;
				top: {monster.pt1.y}px;
				width: {monster.pt2.x-monster.pt1.x}px;
				height: {monster.pt2.y-monster.pt1.y}px;"
		>
			<h3>{monster.name}</h3>
			<img src="{monster.src}" alt="monster Icon" style="width: {(monster.pt2.y-monster.pt1.y)/2}px; height: {(monster.pt2.y-monster.pt1.y)/2}px;">
		</div>
		{/if}
</main>

<style>
	main {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 100%;
		height: 100%;
		transition-duration: 0.3s;
	}
	canvas {
		/* border: 1px solid red; */
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}
	#cash {
		position: absolute;
		left: 0; top: 0;
		padding: 1rem;
		color: #1dddc3;
	}
	#toggle-txt, #toggle-bounce {
		position: absolute;
		bottom: 100px;
		padding: 0.5rem 0.6rem;
		color: #999;
		font-weight: normal;
	}
	#toggle-txt {
		left: 0;
	}
	#toggle-bounce {
		right: 0;
	}
	h3 {
		pointer-events: none;
	}
	#quit {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background-color: #999;
		border: none;
		padding: 0.5rem 0.7rem;
	}
	#monster-info {
		position: absolute;
		pointer-events: none;
		/* background-color: #00ffff33; */
	}
	#monster-info img {
		position: absolute;
		left: 50%;
		top: 55%;
		transform: translate(-50%, -50%);
	}
	#monster-info h3 {
		position: absolute;
		left: 50%;
		top: 0;
		padding: 1rem 0.7rem;
		transform: translate(-50%, 0);
		font-size: 1.5rem;
		color: white;
	}
</style>