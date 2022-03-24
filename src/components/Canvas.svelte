<script>
	import { onMount } from "svelte";
	import { 
		timer, cash, bounce_size, collector_pos, auto_bounce, orb_bonus,
		basic_orb, light_orb, homing_orb,
	} from "../stores.js";
	import { manager, small_explosion } from "../particles.js";
	import { sci } from "../functions.js";

	const set_orbs = ()=>{
		orbs.free_all();
		for (let i = 0; i < $basic_orb.amount; i++) {
			orbs.new(Math.round(Math.random()*1000), 580, 0, 0, "basic");
		}
		return;
		for (let i = 0; i < $light_orb.amount; i++) {
			orbs.new(Math.round(Math.random()*1000), 580, 0, 0, "light");
		}
		for (let i = 0; i < $homing_orb.amount; i++) {
			orbs.new(Math.round(Math.random()*1000), 580, 0, 0, "homing");
		}
	};

	$: {
		$basic_orb;
		set_orbs();
	}
	
	//#region | Canvas
	let main;
	/** @type {HTMLCanvasElement} */
	let canvas;
	/** @type {CanvasRenderingContext2D} */
	let ctx;
	let pause = false;

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
		// pos: [],
		// vect: [],
		// grounded: [],
		col(orb, xy, mult) { 
			xy = xy == 0 ? "vx" : "vy";
			orb[xy] = Math.abs(orb[xy]) * mult; 
		},
		draw(i) {
			const orb = this.list[i];
			const type = orb.type;
			if (type == "basic") ctx.fillStyle = "#ffffff99";
			else if (type == "light") ctx.fillStyle = "#33ffffaa";
			else if (type == "homing") ctx.fillStyle = "#ff3333aa";
			ctx.fillRect(orb.x, orb.y, 20, 20);
		},
		basic_physics(orb) {
			orb.vy += 1;
			orb.vx *= 0.99;
			orb.vy *= 0.99;

			if (orb.x+20 >= canvas.width) {
				this.col(orb, 0, -1);
				orb.x = canvas.width - 20;
			}
			else if (orb.x <= 0) {
				this.col(orb, 0, 1);
				orb.x = 0;
			}
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
			else if (orb.y <= 0) {
				this.col(orb, 1, 1); 
				orb.y = 0;
			}
		},
		light_physics(orb) {
			orb.vy += 0.8;
			orb.vx *= 0.99;
			orb.vy *= 0.99;

			if (orb.x+20 >= canvas.width) {
				this.col(orb, 0, -1);
				orb.x = canvas.width - 20;
			}
			else if (orb.x <= 0) {
				this.col(orb, 0, 1);
				orb.x = 0;
			}
			if (orb.y+20 >= canvas.height) {
				this.col(orb, 1, -1);
				orb.vy *= 0.85;
				if (Math.abs(orb.vy) <= 7) orb.vy *= 0.5;
				if (Math.abs(orb.vy) < 1) (orb.vy = 0, orb.vx = 0, orb.grounded = true);
				// console.log(orb.vy);
				orb.y = canvas.height - 20;
			}
			else if (orb.y <= 0) {
				this.col(orb, 1, 1); 
				orb.y = 0;
			}
		},
		homing_physics(orb) {
			orb.x += orb.vx;
			orb.y += orb.vy;

			orb.vx *= 0.9;
			orb.vy *= 0.9;

			// const ang = Math.atan2((mouse.y-10)-orb.y, (mouse.x-10)-orb.x);
			// orb.vx += Math.cos(ang);
			// orb.vy += Math.sin(ang);

			const push_to = (pos1, pos2, mult)=>{
				const ang = Math.atan2((pos1.y-10)-pos2.y, (pos1.x-10)-pos2.x);
				orb.vx += Math.cos(ang) * mult;
				orb.vy += Math.sin(ang) * mult;
			};

			// const mouse_dist = distance(mouse, orb);
			// // console.log(mouse_dist);
			// if (mouse_dist > 50) push_to(mouse, orb, 1);

			let count = 0;
			let index = -1;
			for (let i = 0; i < this.list.length; i++) {
				const orb2 = this.list[i];
				if (orb2.type != "homing") continue;
				if (orb2 == orb && index == -1) {
					index = count;
				}
				count++;
			};
			// console.log(count);

			const to_pos = {
				x: Math.cos((6.242)/count * index /2 + (6.161*($timer/29)))*50 + mouse.x, //+((6.242)/count*$timer)
				y: Math.sin((6.242)/count * index /2 + (6.161*($timer/29)))*50 + mouse.y  //+((6.242)/count*$timer)
			};

			// if (distance(orb, to_pos) < 7) (orb.x = to_pos.x, orb.y = to_pos.y);\
			const dist_to = distance(orb, to_pos);
			push_to(to_pos, orb, 0.5+(dist_to/600)+index/10);


			// for (let i = 0; i < this.list.length; i++) {
			// 	const orb2 = this.list[i];
			// 	if (orb == orb2) continue;
			// 	// const dist = distance(orb, orb2);
			// 	// if (dist < 50) push_to(orb2, orb, 5);
			// }

			if (orb.x+20 >= canvas.width) {
				this.col(orb, 0, -1);
				orb.x = canvas.width - 20;
			}
			else if (orb.x <= 0) {
				this.col(orb, 0, 1);
				orb.x = 0;
			}
			if (orb.y+20 >= canvas.height) {
				this.col(orb, 1, -1);
				orb.y = canvas.height - 20;
			}
			else if (orb.y <= 0) {
				this.col(orb, 1, 1); 
				orb.y = 0;
			}
		},
		physics(i) {
			// const pos = this.list[i];
			// const vect = this.vect[i];
			const orb = this.list[i];
			
			if (orb.grounded) return;

			orb.x += orb.vx;
			orb.y += orb.vy;

			if (orb.y < $collector_pos && orb.y + orb.vy > $collector_pos) this.collect(i);
			else if (orb.y > $collector_pos && orb.y + orb.vy < $collector_pos) this.collect(i);

			if (orb.type == "basic") this.basic_physics(orb);
			if (orb.type == "light") this.light_physics(orb);
			if (orb.type == "homing") this.homing_physics(orb);
		},
		collect(i) {
			$cash += $orb_bonus;
		},
		update() {
			for (let i = 0; i < this.list.length; i++) {
				this.draw(i);
				this.physics(i);
			}
		},
		new(x,y, vx, vy, type) {
			// this.pos.push([x, y]);
			// this.vect.push([vx, vy]);
			// this.grounded.push(false);
			// console.log(`New: ${JSON.stringify({x, y, vx, vy, type})}`);
			if (type == "light") light_orb.update( v => (v.amount++, v) );
			if (type == "homing") homing_orb.update( v => (v.amount++, v) );
			this.list.push({
				x,y, vx,vy, type,
				grounded: false,
			});
			// console.log(this.list.reverse()[0]);
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
			// this.pos = [];
			// this.vect = [];
			// this.grounded = [];
			this.list = [];
		}
	};
	//#endregion
	//#region | onMount
	const main_loop = (v)=>{
		if (pause) return;
		if (!visible && !toggled) {
			orbs.update();
			manager.update(false);
			return;
		}

		ctx.fillStyle = "#333636";
		ctx.fillRect(0, 0, w, h);
		
		ctx.fillStyle = "#33ffcc33";
		ctx.fillRect(0, 600-$bounce_size, 1000, 600-$bounce_size);
		draw_auto_bounce_bar();

		ctx.strokeStyle = "lime";
		ctx.beginPath();
		ctx.moveTo(0, 250);
		ctx.lineTo(1000, 250);
		ctx.stroke();

		// ctx.fillStyle = "lime";
		// ctx.fillRect(mouse.x, mouse.y, 5, 5);

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
	let toggled = true;
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
		else if (k == "o") console.log(orbs);
		else if (k == "Escape") toggled = !toggled;
		else if (k == "c") $cash += 1000;
		else if (k == "b") $bounce_size += 10;
		else if (k == "B") $bounce_size -= 10;
		else if (k == "r") set_orbs(); // Broken right now
		else if (k == "1") orbs.new(rand_width(), 580, 					 0, 0, "basic");
		else if (k == "2") orbs.new(rand_width(), rand_height(), 0, 0, "light");
		else if (k == "3") orbs.new(rand_width(), rand_height(), 0, 0, "homing");
	};
	
	$: { if (canvas != undefined) {
		canvas.onmousedown = mouse_down;
		canvas.onmousemove = mouse_move;
		canvas.onmouseenter = mouse_enter;
		canvas.onmouseleave = mouse_leave;
		document.body.onkeyup = key_up;
	}};
	//#endregion
	//#region | Visibility
	let visible = true;
	$: {
		if (main != undefined) {
			main.ontransitionend = ()=> visible = toggled;
		}
	}
	//#endregion
	//#region | Auto Bounce
	const draw_auto_bounce_bar = ()=>{
		ctx.fillStyle = "#33ffcc11";
		ctx.fillRect(0, 600-($bounce_size*(auto_bounce_perc)), 1000, 600-($bounce_size*(auto_bounce_perc)));
	}
	let auto_bounce_perc = 0;
	$: if (!$auto_bounce.unlocked) auto_bounce_perc = 0;
	const auto_bounce_loop = (v)=>{
		if (!$auto_bounce.unlocked) return;
		auto_bounce_perc = Math.ceil(v/29*100)/100;

		if (v == 29) orbs.bounce(null);
	}
	//#endregion
</script>

<main bind:this={main} style="opacity: {toggled ? "1" : "0"}; pointer-events: {toggled ? "all" : "none"};">
	<canvas bind:this={canvas}></canvas>
	<h3 id="cash">Cash: {sci($cash)}</h3>
	<h3 id="toggle-txt" style="bottom: {$bounce_size}px;">Press "Esc" to toggle</h3>
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
	#toggle-txt {
		position: absolute;
		left: 0;
		bottom: 100px;
		padding: 0.5rem 0.6rem;
		color: #999;
	}
	h3 {
		pointer-events: none;
	}
</style>