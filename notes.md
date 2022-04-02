ToDo: 
- probably color change for Lab
- Settings style change (looks ugly!!!)
- Boss every 5th? floor

Notes: 
- Different fighting areas for different artifacts?
- Restart with a % of money/mana
- Every 5 levels there's a boss that gives an artifact?
- Total prestige? (New Game+)
- Fighting bug (beat monster, then pause) (honestly, it's a feature)
- Svelte: disabled="{cost > money}"

Events:
- Double Money

New Game+:
- Another orb
- More upgrades
- Artifacts
- More monsters 

Ideas: 
- Achievements
- Magic/Spells

Artifacts: 
- Shadow (Chance to summon a shadow clone of orbs)
- Agile (Orbs lose less velocity from a bad angled bounce)
- Holy Click

Min fps for stress test 1 == 53~67



class Node {
	constructor(obj) {
		manager.entities.push(obj);
	}
}

const manager = {
	tags: { },
	entities: [],
	setup_tag(tag, func) {
		this.tags[tag] = func;
	},
	update() {
		for (let i = 0; i < this.entities.length; i++) {
			const ent = this.entities[i];
			if (ent.tag != undefined) {
				if (typeof this.tags[ent.tag] == "function") this.tags[ent.tag](ent);
			} else if (typeof ent.update == "function") ent.update();
		}
	}
}

manager.setup_tag("orb", (orb)=>{
	console.log(orb);
})

new Node({ tag: "orb", });
new Node({
	update(){
		console.log("I'm chillin");
	}
});

manager.update();