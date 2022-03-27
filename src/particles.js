export const manager = {
	groups: [],
	mode: 0, 
	update(mode, draw=true) {
		if (this.mode != mode) this.mode = mode;
		for (let i = this.groups.length-1; i >= 0; i--) {
			if (this.groups[i].update(draw)) this.groups.splice(i, 1);
		}
	}
};
/** @param {CanvasRenderingContext2D} ctx */
export const small_explosion = (ctx, pos=[0,0])=>{
	if (manager.groups.length >= 10) return;
	const obj = {
		parts: [],
		ticks: 30,
		update(draw) {
			for (let i = 0; i < this.parts.length; i++) {
				const p = this.parts[i];
				if (p.ticks <= 0) continue;
				if (draw) {
					ctx.fillStyle = "#ff440055";
					if (manager.mode == 0) {
						ctx.fillRect(p.x-3, p.y-3, 6, 6);
					} else if (manager.mode == 1) {
						ctx.beginPath(); ctx.arc(p.x+1.5, p.y+1.5, 3, 0, 2 * Math.PI); ctx.fill(); 
					} else if (manager.mode == 2) {
						ctx.fillRect(p.x-1, p.y-1, 2, 2);
					} else if (manager.mode == 3) {
						ctx.fillRect(Math.floor(p.x/6)*6, Math.floor(p.y/6)*6, 6, 6);
					}
					p.x += p.vx; p.vx *= 0.95;
					p.y += p.vy; p.vy *= 0.95;
				}
				p.ticks--;
			}
			this.ticks--;
			return (this.ticks <= 0);
		}
	};
	for (let i = 0; i < 30; i++) {
		const ang = Math.random() * 6.282;
		const speed = Math.random()*3+1;
		obj.parts.push({
			ticks: 30-Math.round(Math.random()*5+1),
			x: pos[0],
			y: pos[1],
			vx: Math.cos(ang)*speed,
			vy: Math.sin(ang)*speed
		});
	}
	manager.groups.push(obj);
};
export const big_explosion = (ctx, pos=[0,0])=>{
	if (manager.groups.length >= 10) return;
	const obj = {
		parts: [],
		ticks: 90,
		update(draw) {
			for (let i = 0; i < this.parts.length; i++) {
				const p = this.parts[i];
				if (p.ticks <= 0) continue;
				if (draw) {
					ctx.fillStyle = "#ff440055";
					if (manager.mode == 0) {
						ctx.fillRect(p.x-3, p.y-3, 15, 15);
					} else if (manager.mode == 1) {
						ctx.beginPath(); ctx.arc(p.x+1.5, p.y+1.5, 3, 0, 2 * Math.PI); ctx.fill(); 
					} else if (manager.mode == 2) {
						ctx.fillRect(p.x-1, p.y-1, 2, 2);
					} else if (manager.mode == 3) {
						ctx.fillRect(Math.floor(p.x/15)*15, Math.floor(p.y/15)*15, 15, 15);
					}
					p.x += p.vx; p.vx *= 0.95;
					p.y += p.vy; p.vy *= 0.95;
				}
				p.ticks--;
			}
			this.ticks--;
			return (this.ticks <= 0);
		}
	};
	for (let i = 0; i < 120; i++) {
		const ang = Math.random() * 6.282;
		const speed = Math.random()*12+2;
		obj.parts.push({
			ticks: obj.ticks-Math.round(Math.random()*20),
			x: pos[0],
			y: pos[1],
			vx: Math.cos(ang)*speed,
			vy: Math.sin(ang)*speed
		});
	}
	manager.groups.push(obj);
};