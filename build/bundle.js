
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    //#region | Setup

    // const w = (k, v)=>{
    // 	// console.log(`key: ${k}, get_or: ${get_or(k, v)}`);
    // 	to_store[k] = get_or(k, v);
    // 	return writable(to_store[k]);
    // };
    const w = writable;
    //#endregion

    //#region | Timer
    const timer = writable(0);
    let ticks = 0; timer.subscribe( v => ticks = v );
    setInterval(() => {
    	if (ticks < 29) timer.update( v => v+1 );
    	else timer.set(0);
    }, 1000/30);
    //#endregion
    //#region | Cash
    let deci = 0;
    const cash = w(0);
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
    //#region | Bounce and Collector
    const bounce_size = w(75);
    const bounce_area_cost = w(500);
    const collector_pos = w(250);
    //#endregion
    //#region | Orbs
    const basic_orb = w({
    	amount: 1,
    	cost: 50,
    	value: 1
    });
    const light_orb = w({
    	amount: 0,
    	cost: 1,
    	value: 1
    });
    const homing_orb = w({
    	amount: 0,
    	cost: 5,
    	value: 0.5,
    });
    //#endregion
    //#region | Shop Upgrades
    // export const more_orbs_cost = w(50);
    const auto_bounce = w({
    	cost: 350,
    	unlocked: false,
    	on: true,
    });
    const bounce_power = w({
    	cost: 250,
    	value: 30,
    });
    const starting_cash = w({
    	cost: 25,
    	amount: 0,
    });
    //#endregion
    //#region | Prestige
    const prestige = w({
    	cost: 1e4,
    	times: 0,
    });
    //#endregion

    const orb_bonus = writable(1);

    // export const unlocked_lab = w(true); //-! DEBUG
    const unlocked_fighting = w(false);
    const got_mana = w(false);
    const next_tower_lvl = w(1);

    const canvas_toggled = w(true); 
    const fighting = w(false);
    const total_monster_killed = w(0);

    const mana = w(0);
    const fight_cost = w(1e3);

    const trades = w({
    	to_light: 1,
    	to_homing: 3,
    });

    const rarities = w({
    	c: 100,
    	u: 0,
    	r: 0,
    	l: 0
    });


    const shifting = w(false);

    // const callable = ()=>{

    // }

    const manager = {
    	groups: [],
    	update(draw=true) {
    		for (let i = this.groups.length-1; i >= 0; i--) {
    			if (this.groups[i].update(draw)) this.groups.splice(i, 1);
    		}
    	}
    };
    /** @param {CanvasRenderingContext2D} ctx */
    const small_explosion = (ctx, pos=[0,0])=>{
    	const obj = {
    		parts: [],
    		ticks: 30,
    		update(draw) {
    			for (let i = 0; i < this.parts.length; i++) {
    				const p = this.parts[i];
    				if (p.ticks <= 0) continue;
    				if (draw) {
    					ctx.fillStyle = "#ff440055";
    					ctx.fillRect(p.x-3, p.y-3, 6, 6);
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
    const big_explosion = (ctx, pos=[0,0])=>{
    	const obj = {
    		parts: [],
    		ticks: 90,
    		update(draw) {
    			for (let i = 0; i < this.parts.length; i++) {
    				const p = this.parts[i];
    				if (p.ticks <= 0) continue;
    				if (draw) {
    					ctx.fillStyle = "#ff440055";
    					ctx.fillRect(p.x-3, p.y-3, 15, 15);
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

    /** @param {Number} num */
    const exp = (pow=1)=> (10 ** pow);
    const round = (num, pow=1)=> Math.round(num * exp(pow))/exp(pow);
    const toExp = (num, place)=>{
      let pow = Math.floor(Math.log10(num));
    	place = 10**place;
      return (Math.floor(num/(10**pow)*place)/place + `e${pow}`);
    };
    const sci = (num, place=1)=> num >= 1000 ? toExp(num, place).replace("+", "") : round(num);

    /* src/components/Canvas.svelte generated by Svelte v3.46.4 */

    const { console: console_1 } = globals;
    const file$5 = "src/components/Canvas.svelte";

    // (557:1) {#if $auto_bounce.unlocked}
    function create_if_block_1$1(ctx) {
    	let h3;
    	let t0;
    	let t1_value = (/*$auto_bounce*/ ctx[3].on ? "off" : "on") + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = text("Press \"Tab\" to turn ");
    			t1 = text(t1_value);
    			t2 = text(" auto bounce");
    			attr_dev(h3, "id", "toggle-bounce");
    			set_style(h3, "bottom", /*$bounce_size*/ ctx[7] + "px");
    			attr_dev(h3, "class", "svelte-1e089hx");
    			add_location(h3, file$5, 557, 2, 16207);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t0);
    			append_dev(h3, t1);
    			append_dev(h3, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$auto_bounce*/ 8 && t1_value !== (t1_value = (/*$auto_bounce*/ ctx[3].on ? "off" : "on") + "")) set_data_dev(t1, t1_value);

    			if (dirty[0] & /*$bounce_size*/ 128) {
    				set_style(h3, "bottom", /*$bounce_size*/ ctx[7] + "px");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(557:1) {#if $auto_bounce.unlocked}",
    		ctx
    	});

    	return block;
    }

    // (560:1) {#if $fighting}
    function create_if_block$1(ctx) {
    	let button;
    	let t1;
    	let div;
    	let h30;
    	let t2;
    	let t3;
    	let t4;
    	let h31;
    	let t5_value = /*monster_manager*/ ctx[5].name + "";
    	let t5;
    	let t6;
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Quit";
    			t1 = space();
    			div = element("div");
    			h30 = element("h3");
    			t2 = text("Monster Tower: Level ");
    			t3 = text(/*$next_tower_lvl*/ ctx[6]);
    			t4 = space();
    			h31 = element("h3");
    			t5 = text(t5_value);
    			t6 = space();
    			img = element("img");
    			attr_dev(button, "id", "quit");
    			attr_dev(button, "class", "svelte-1e089hx");
    			add_location(button, file$5, 560, 2, 16362);
    			attr_dev(h30, "id", "lvl");
    			attr_dev(h30, "class", "svelte-1e089hx");
    			add_location(h30, file$5, 568, 3, 16669);
    			attr_dev(h31, "id", "name");
    			attr_dev(h31, "class", "svelte-1e089hx");
    			add_location(h31, file$5, 569, 3, 16729);
    			if (!src_url_equal(img.src, img_src_value = /*monster_manager*/ ctx[5].src)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "monster Icon");
    			set_style(img, "width", (/*monster_manager*/ ctx[5].pt2.y - /*monster_manager*/ ctx[5].pt1.y) / 2 + "px");
    			set_style(img, "height", (/*monster_manager*/ ctx[5].pt2.y - /*monster_manager*/ ctx[5].pt1.y) / 2 + "px");
    			attr_dev(img, "class", "svelte-1e089hx");
    			add_location(img, file$5, 570, 3, 16774);
    			attr_dev(div, "id", "monster-info");
    			set_style(div, "left", /*monster_manager*/ ctx[5].pt1.x + "px");
    			set_style(div, "top", /*monster_manager*/ ctx[5].pt1.y + "px");
    			set_style(div, "width", /*monster_manager*/ ctx[5].pt2.x - /*monster_manager*/ ctx[5].pt1.x + "px");
    			set_style(div, "height", /*monster_manager*/ ctx[5].pt2.y - /*monster_manager*/ ctx[5].pt1.y + "px");
    			attr_dev(div, "class", "svelte-1e089hx");
    			add_location(div, file$5, 561, 2, 16431);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, h30);
    			append_dev(h30, t2);
    			append_dev(h30, t3);
    			append_dev(div, t4);
    			append_dev(div, h31);
    			append_dev(h31, t5);
    			append_dev(div, t6);
    			append_dev(div, img);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[13], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$next_tower_lvl*/ 64) set_data_dev(t3, /*$next_tower_lvl*/ ctx[6]);
    			if (dirty[0] & /*monster_manager*/ 32 && t5_value !== (t5_value = /*monster_manager*/ ctx[5].name + "")) set_data_dev(t5, t5_value);

    			if (dirty[0] & /*monster_manager*/ 32 && !src_url_equal(img.src, img_src_value = /*monster_manager*/ ctx[5].src)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty[0] & /*monster_manager*/ 32) {
    				set_style(img, "width", (/*monster_manager*/ ctx[5].pt2.y - /*monster_manager*/ ctx[5].pt1.y) / 2 + "px");
    			}

    			if (dirty[0] & /*monster_manager*/ 32) {
    				set_style(img, "height", (/*monster_manager*/ ctx[5].pt2.y - /*monster_manager*/ ctx[5].pt1.y) / 2 + "px");
    			}

    			if (dirty[0] & /*monster_manager*/ 32) {
    				set_style(div, "left", /*monster_manager*/ ctx[5].pt1.x + "px");
    			}

    			if (dirty[0] & /*monster_manager*/ 32) {
    				set_style(div, "top", /*monster_manager*/ ctx[5].pt1.y + "px");
    			}

    			if (dirty[0] & /*monster_manager*/ 32) {
    				set_style(div, "width", /*monster_manager*/ ctx[5].pt2.x - /*monster_manager*/ ctx[5].pt1.x + "px");
    			}

    			if (dirty[0] & /*monster_manager*/ 32) {
    				set_style(div, "height", /*monster_manager*/ ctx[5].pt2.y - /*monster_manager*/ ctx[5].pt1.y + "px");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(560:1) {#if $fighting}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let main_1;
    	let canvas_1;
    	let t0;
    	let h30;
    	let t1;
    	let t2_value = sci(/*$cash*/ ctx[8]) + "";
    	let t2;
    	let t3;
    	let h31;
    	let t4;
    	let t5;
    	let t6;
    	let if_block0 = /*$auto_bounce*/ ctx[3].unlocked && create_if_block_1$1(ctx);
    	let if_block1 = /*$fighting*/ ctx[2] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			main_1 = element("main");
    			canvas_1 = element("canvas");
    			t0 = space();
    			h30 = element("h3");
    			t1 = text("Cash: ");
    			t2 = text(t2_value);
    			t3 = space();
    			h31 = element("h3");
    			t4 = text("Press \"Esc\" to toggle shop");
    			t5 = space();
    			if (if_block0) if_block0.c();
    			t6 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(canvas_1, "class", "svelte-1e089hx");
    			add_location(canvas_1, file$5, 553, 1, 16013);
    			attr_dev(h30, "id", "cash");
    			attr_dev(h30, "class", "svelte-1e089hx");
    			add_location(h30, file$5, 554, 1, 16051);
    			attr_dev(h31, "id", "toggle-txt");
    			set_style(h31, "bottom", /*$bounce_size*/ ctx[7] + "px");
    			attr_dev(h31, "class", "svelte-1e089hx");
    			add_location(h31, file$5, 555, 1, 16090);
    			set_style(main_1, "opacity", /*$toggled*/ ctx[4] ? "1" : "0");
    			set_style(main_1, "pointer-events", /*$toggled*/ ctx[4] ? "all" : "none");
    			attr_dev(main_1, "class", "svelte-1e089hx");
    			add_location(main_1, file$5, 552, 0, 15902);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main_1, anchor);
    			append_dev(main_1, canvas_1);
    			/*canvas_1_binding*/ ctx[12](canvas_1);
    			append_dev(main_1, t0);
    			append_dev(main_1, h30);
    			append_dev(h30, t1);
    			append_dev(h30, t2);
    			append_dev(main_1, t3);
    			append_dev(main_1, h31);
    			append_dev(h31, t4);
    			append_dev(main_1, t5);
    			if (if_block0) if_block0.m(main_1, null);
    			append_dev(main_1, t6);
    			if (if_block1) if_block1.m(main_1, null);
    			/*main_1_binding*/ ctx[14](main_1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$cash*/ 256 && t2_value !== (t2_value = sci(/*$cash*/ ctx[8]) + "")) set_data_dev(t2, t2_value);

    			if (dirty[0] & /*$bounce_size*/ 128) {
    				set_style(h31, "bottom", /*$bounce_size*/ ctx[7] + "px");
    			}

    			if (/*$auto_bounce*/ ctx[3].unlocked) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					if_block0.m(main_1, t6);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*$fighting*/ ctx[2]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					if_block1.m(main_1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty[0] & /*$toggled*/ 16) {
    				set_style(main_1, "opacity", /*$toggled*/ ctx[4] ? "1" : "0");
    			}

    			if (dirty[0] & /*$toggled*/ 16) {
    				set_style(main_1, "pointer-events", /*$toggled*/ ctx[4] ? "all" : "none");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main_1);
    			/*canvas_1_binding*/ ctx[12](null);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			/*main_1_binding*/ ctx[14](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $fighting;
    	let $next_tower_lvl;
    	let $mana;
    	let $rarities;
    	let $auto_bounce;
    	let $bounce_size;
    	let $toggled;
    	let $shifting;
    	let $cash;
    	let $bounce_power;
    	let $homing_orb;
    	let $light_orb;
    	let $basic_orb;
    	let $collector_pos;
    	let $timer;
    	validate_store(fighting, 'fighting');
    	component_subscribe($$self, fighting, $$value => $$invalidate(2, $fighting = $$value));
    	validate_store(next_tower_lvl, 'next_tower_lvl');
    	component_subscribe($$self, next_tower_lvl, $$value => $$invalidate(6, $next_tower_lvl = $$value));
    	validate_store(mana, 'mana');
    	component_subscribe($$self, mana, $$value => $$invalidate(23, $mana = $$value));
    	validate_store(rarities, 'rarities');
    	component_subscribe($$self, rarities, $$value => $$invalidate(24, $rarities = $$value));
    	validate_store(auto_bounce, 'auto_bounce');
    	component_subscribe($$self, auto_bounce, $$value => $$invalidate(3, $auto_bounce = $$value));
    	validate_store(bounce_size, 'bounce_size');
    	component_subscribe($$self, bounce_size, $$value => $$invalidate(7, $bounce_size = $$value));
    	validate_store(canvas_toggled, 'toggled');
    	component_subscribe($$self, canvas_toggled, $$value => $$invalidate(4, $toggled = $$value));
    	validate_store(shifting, 'shifting');
    	component_subscribe($$self, shifting, $$value => $$invalidate(25, $shifting = $$value));
    	validate_store(cash, 'cash');
    	component_subscribe($$self, cash, $$value => $$invalidate(8, $cash = $$value));
    	validate_store(bounce_power, 'bounce_power');
    	component_subscribe($$self, bounce_power, $$value => $$invalidate(26, $bounce_power = $$value));
    	validate_store(homing_orb, 'homing_orb');
    	component_subscribe($$self, homing_orb, $$value => $$invalidate(9, $homing_orb = $$value));
    	validate_store(light_orb, 'light_orb');
    	component_subscribe($$self, light_orb, $$value => $$invalidate(10, $light_orb = $$value));
    	validate_store(basic_orb, 'basic_orb');
    	component_subscribe($$self, basic_orb, $$value => $$invalidate(11, $basic_orb = $$value));
    	validate_store(collector_pos, 'collector_pos');
    	component_subscribe($$self, collector_pos, $$value => $$invalidate(27, $collector_pos = $$value));
    	validate_store(timer, 'timer');
    	component_subscribe($$self, timer, $$value => $$invalidate(28, $timer = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Canvas', slots, []);

    	const set_orbs = () => {
    		orbs.free_all();

    		for (let i = 0; i < $basic_orb.amount; i++) {
    			orbs.new(Math.round(Math.random() * 1000), 580, 0, 0, "basic");
    		}

    		for (let i = 0; i < $light_orb.amount; i++) {
    			orbs.new(Math.round(Math.random() * 1000), 580, 0, 0, "light");
    		}

    		for (let i = 0; i < $homing_orb.amount; i++) {
    			orbs.new(Math.round(Math.random() * 1000), 580, 0, 0, "homing");
    		}

    		return;
    	};

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
    	const distance = (pos1, pos2) => {
    		let y = pos2.y - pos1.y;
    		let x = pos2.x - pos1.x;
    		return Math.sqrt(x * x + y * y);
    	};

    	const rand_width = () => {
    		return Math.round(Math.random() * 1000);
    	};

    	const rand_height = () => {
    		return Math.round(Math.random() * 600);
    	};

    	const rand_pos = () => {
    		return {
    			x: Math.round(Math.random() * 1000),
    			y: Math.round(Math.random() * 1000)
    		};
    	};

    	const F_acos = x => {
    		return (-0.698 * x * x - 0.872) * x + 1.570;
    	};

    	const F_atan2 = (y, x) => {
    		let z = y / x;
    		let neg = 1;
    		if (z < 0) z *= -1;
    		neg = -1;
    		if (z > 1) return 1.571 - F_atan2(1, z);
    		return neg * (z * (0.785 - (z - 1) * (0.244 + 0.067 * z))); // 14: 0.244 | 3.83: 0.067
    	};

    	const orbs = {
    		list: [],
    		homing: [],
    		col(orb, xy, mult) {
    			xy = xy == 0 ? "vx" : "vy";
    			orb[xy] = Math.abs(orb[xy]) * mult;
    		},
    		draw(orb) {
    			const type = orb.type;
    			if (type == "basic") ctx.fillStyle = "#ffffff99"; else if (type == "light") ctx.fillStyle = "#33ffffaa"; else if (type == "homing") return;
    			ctx.fillRect(orb.x, orb.y, 20, 20);
    		},
    		draw_homing() {
    			ctx.fillStyle = "#ffff33aa";

    			if (this.homing.length > 201) {
    				const range = this.homing.length;
    				const points = 201;
    				const gap = range / points;
    				let total = 0;

    				for (let i = 0; i < points; i++) {
    					const orb = this.homing[Math.floor(gap * i)];
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

    			if (orb.y + 20 >= canvas.height) {
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

    			if (orb.y + 20 >= canvas.height) {
    				this.col(orb, 1, -1);
    				if (Math.abs(orb.vy) >= 15) orb.vy *= 0.98; else orb.vy *= 0.85;
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
    				const push_to = (pos1, pos2, mult) => {
    					const ang = Math.atan2(pos1.y - 10 - pos2.y, pos1.x - 10 - pos2.x);
    					orb.vx += Math.cos(ang) * mult;
    					orb.vy += Math.sin(ang) * mult;
    				};

    				let count = this.homing.length;
    				let index = orb.index;
    				const to_pos = { x: undefined, y: undefined };

    				if (index % 2 == 0) {
    					(to_pos.x = Math.cos(6.242 / count * index + 6.282 * ($timer / 29)) * 100 + mouse.x - 10, to_pos.y = Math.cos(6.242 / count * index + 6.282 * ($timer / 29)) * 100 + mouse.y - 10);
    				} else {
    					(to_pos.x = Math.cos((6.282 / count * index + 6.282 * ($timer / 29)) % 6.282) * 50 + mouse.x, to_pos.y = Math.sin((6.282 / count * index + 6.282 * ($timer / 29)) % 6.282) * 50 + mouse.y);
    				}

    				const dist_to = distance(orb, to_pos);
    				push_to(to_pos, orb, dist_to < 200 ? 1.2 : 2);
    			}

    			if (orb.y + 20 >= canvas.height) {
    				this.col(orb, 1, -1);
    				orb.y = canvas.height - 20;
    			}
    		},
    		collide_monster(orb) {
    			// c1 = 400, 200 / c2 = 600, 300
    			const pt1 = monster_manager.pt1;

    			const pt2 = monster_manager.pt2;

    			if (orb.y >= pt1.y - 20 && orb.y <= pt2.y) {
    				// console.log("in horz area");
    				if (orb.lx + 20 < pt1.x && orb.x + 20 >= pt1.x) {
    					orb.vx = Math.abs(orb.vx) * -1;
    					orb.x = pt1.x - 20;
    					return true;
    				} else if (orb.lx > pt2.x && orb.x <= pt2.x) {
    					orb.vx = Math.abs(orb.vx);
    					orb.x = pt2.x;
    					return true;
    				}
    			}

    			if (orb.x >= pt1.x - 20 && orb.x <= pt2.x) {
    				// console.log("in vert area");
    				if (orb.ly + 20 < pt1.y && orb.y + 20 >= pt1.y) {
    					orb.vy = Math.abs(orb.vy) * -1;
    					orb.y = pt1.y - 20;
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

    			if (orb.x + 20 >= canvas.width) {
    				this.col(orb, 0, -1);
    				orb.x = canvas.width - 20;
    			} else if (orb.x <= 0) {
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
    					monster_manager.hit(1);
    				}
    			}

    			if (orb.y < $collector_pos && orb.ly > $collector_pos) this.collect(orb); else if (orb.y > $collector_pos && orb.ly < $collector_pos) this.collect(orb);
    		},
    		collect(orb) {
    			if ($fighting) return; // ctx.fillStyle = "lime";
    			// ctx.fillRect(orb.x+5, orb.y+5, 10, 10);

    			if (orb.type == "basic") set_store_value(cash, $cash += $basic_orb.value, $cash); else if (orb.type == "light") set_store_value(cash, $cash += $light_orb.value, $cash); else if (orb.type == "homing") set_store_value(cash, $cash += $homing_orb.value, $cash);
    		}, // ctx.fillStyle = "lime";
    		update() {
    			const full = this.list.concat(this.homing);

    			for (let i = 0; i < full.length; i++) {
    				const orb = full[i];
    				this.draw(orb);
    				this.physics(orb);
    			}

    			this.draw_homing();
    		},
    		new(x, y, vx, vy, type) {
    			if (type == "homing") {
    				this.homing.push({
    					x,
    					y,
    					vx,
    					vy,
    					type,
    					grounded: false,
    					lx: x,
    					ly: y,
    					index: this.homing.length
    				});
    			} else {
    				this.list.push({
    					x,
    					y,
    					vx,
    					vy,
    					type,
    					grounded: false,
    					lx: x,
    					ly: y
    				});
    			}
    		},
    		bounce(pos) {
    			for (let i = 0; i < this.list.length; i++) {
    				const orb = this.list[i];
    				if (orb.y < 600 - $bounce_size - 21) continue;
    				if (pos != null) orb.vx += (pos[0] - orb.x) / 100;
    				orb.vy -= $bounce_power.value + (Math.random() * 6 - 3);
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
    	const main_loop = v => {
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

    		ctx.fillRect(0, 600 - $bounce_size, 1000, 600 - $bounce_size);
    		draw_auto_bounce_bar();

    		// Collector Line
    		if (!$fighting) {
    			ctx.strokeStyle = "lime";
    			ctx.beginPath();
    			ctx.moveTo(0, 250);
    			ctx.lineTo(1000, 250);
    			ctx.stroke();
    		} else {
    			monster_manager.draw();
    		}

    		manager.update();
    		orbs.update();
    	};

    	onMount(() => {
    		ctx = canvas.getContext("2d");
    		$$invalidate(1, canvas.width = 1000, canvas);
    		$$invalidate(1, canvas.height = 600, canvas);
    		w = canvas.width;
    		h = canvas.height;
    		set_orbs();
    		timer.subscribe(main_loop);
    		timer.subscribe(auto_bounce_loop);
    	}); // key_up({ key: "Escape" });

    	//#endregion
    	//#region | Events
    	const mouse = { x: 0, y: 0, hovering: false };

    	/** @param {MouseEvent} e*/
    	const mouse_move = e => {
    		[mouse.x, mouse.y] = [e.layerX, e.layerY];
    	};

    	const mouse_enter = () => mouse.hovering = true;
    	const mouse_leave = () => mouse.hovering = false;

    	const mouse_down = e => {
    		// orbs.new([10, 10], [10, Math.random()*15]);
    		const [x, y] = [e.layerX, e.layerY];

    		orbs.bounce([x, y]);
    		small_explosion(ctx, [x, y]);
    	};

    	const key_up = e => {
    		const k = e.key;

    		if (k == " ") pause = !pause; else if (k == "s") step = !step; else if (k == "Tab" && $auto_bounce.unlocked) auto_bounce.update(v => (v.on = !v.on, v)); else if (k == "Escape") set_store_value(canvas_toggled, $toggled = !$toggled, $toggled); else if (k == "o") console.log(orbs); else if (k == "d") console.log(orbs.draw_homing()); else if (k == "l") console.log(orbs.list.length + orbs.homing.length); else if (k == "a") console.log(monster_manager); else if (k == "c") set_store_value(cash, $cash += 10000, $cash); else if (k == "b") orbs.bounce(); else if (k == "M") console.log(mouse); else if (k == "m") set_store_value(mana, $mana += 100, $mana); else if (k == "r") set_orbs(); else if (k == "1") basic_orb.update(v => (v.amount++, v)); else if (k == "2") light_orb.update(v => (v.amount++, v)); else if (k == "3") homing_orb.update(v => (v.amount++, v)); else if (k == "!") basic_orb.update(v => (v.amount > 0 ? v.amount-- : 0, v)); else if (k == "@") light_orb.update(v => (v.amount > 0 ? v.amount-- : 0, v)); else if (k == "#") homing_orb.update(v => (v.amount > 0 ? v.amount-- : 0, v)); else if (k == "0") homing_orb.update(v => (v.amount += 10000, v)); else if (k == "Shift") set_store_value(shifting, $shifting = false, $shifting); else if (k == "h") monster_manager.hit(1e10); // Broken right now
    		// orbs.new(rand_width(), 580, 					 0, 0, "basic");
    		// orbs.new(rand_width(), rand_height(), 0, 0, "light");
    		// orbs.new(rand_width(), rand_height(), 0, 0, "homing");
    		//Array.from(Array(25000)).forEach(()=> orbs.new(rand_width(), rand_height(), 0, 0, "homing"));
    	};

    	const key_down = e => {
    		const k = e.key;
    		if (k == "Shift") set_store_value(shifting, $shifting = true, $shifting);
    	};

    	//#endregion
    	//#region | Visibility
    	let visible = true;

    	//#endregion
    	//#region | Auto Bounce
    	const draw_auto_bounce_bar = () => {
    		ctx.fillStyle = "#33ffcc11";
    		ctx.fillRect(0, 600 - $bounce_size * auto_bounce_perc, 1000, 600 - $bounce_size * auto_bounce_perc);
    	};

    	let auto_bounce_perc = 0;

    	const auto_bounce_loop = v => {
    		if (!$auto_bounce.unlocked || !$auto_bounce.on) return;
    		auto_bounce_perc = Math.ceil(v / 29 * 100) / 100;
    		if (v == 29) orbs.bounce(null);
    	};

    	//#endregion
    	//#region | Monsters
    	const rand_in_list = list => list[Math.floor(Math.random() * list.length)];

    	const monsters = {
    		// hp: 100, worth: 1
    		common: [
    			// white
    			"Zombie",
    			"Sea Monster"
    		],
    		// hp: 250, worth: 3
    		uncommon: [
    			// light green
    			"Stone Golem",
    			"Young Wyvern"
    		],
    		// hp: 500, worth: 10
    		rare: [
    			// aqua
    			"Young Dragon",
    			"Crystal Golem"
    		],
    		// hp: 1000, worth: 25
    		legendary: [
    			// gold
    			"Elder Dragon",
    			"Block Head"
    		]
    	};

    	const spawn_monster = () => {
    		// Chances for common, uncommon, rare, legendary
    		// 70, 20, 8, 2
    		const c = $rarities.c;

    		const u = $rarities.c + $rarities.u;
    		const r = $rarities.c + $rarities.u + $rarities.r;
    		const rand = Math.round(Math.random() * 100);

    		if (rand <= c) {
    			// Common
    			const name = rand_in_list(monsters.common);

    			// console.log(`Spawning a ${name}`);
    			$$invalidate(5, monster_manager.max_hp = 100 * (1 + 0.2 * ($next_tower_lvl - 1)), monster_manager);

    			$$invalidate(5, monster_manager.hp = monster_manager.max_hp, monster_manager);
    			$$invalidate(5, monster_manager.name = name, monster_manager);
    			$$invalidate(5, monster_manager.src = `./assets/${name.toLowerCase().replaceAll(" ", "_")}.svg`, monster_manager);
    			$$invalidate(5, monster_manager.worth = 1, monster_manager);
    		} else if (rand <= u) {
    			// Uncommon
    			const name = rand_in_list(monsters.uncommon);

    			// console.log(`Spawning a ${name}`);
    			$$invalidate(5, monster_manager.max_hp = 250 * (1 + 0.2 * ($next_tower_lvl - 1)), monster_manager);

    			$$invalidate(5, monster_manager.hp = monster_manager.max_hp, monster_manager);
    			$$invalidate(5, monster_manager.name = name, monster_manager);
    			$$invalidate(5, monster_manager.src = `./assets/${name.toLowerCase().replaceAll(" ", "_")}.svg`, monster_manager);
    			$$invalidate(5, monster_manager.worth = 3, monster_manager);
    		} else if (rand <= r) {
    			// Rare
    			const name = rand_in_list(monsters.rare);

    			// console.log(`Spawning a ${name}`);
    			$$invalidate(5, monster_manager.max_hp = 500 * (1 + 0.2 * ($next_tower_lvl - 1)), monster_manager);

    			$$invalidate(5, monster_manager.hp = monster_manager.max_hp, monster_manager);
    			$$invalidate(5, monster_manager.name = name, monster_manager);
    			$$invalidate(5, monster_manager.src = `./assets/${name.toLowerCase().replaceAll(" ", "_")}.svg`, monster_manager);
    			$$invalidate(5, monster_manager.worth = 10, monster_manager);
    		} else {
    			// Legendary
    			const name = rand_in_list(monsters.legendary);

    			// console.log(`Spawning a ${name}`);
    			$$invalidate(5, monster_manager.max_hp = 1000 * (1 + 0.2 * ($next_tower_lvl - 1)), monster_manager);

    			$$invalidate(5, monster_manager.hp = monster_manager.max_hp, monster_manager);
    			$$invalidate(5, monster_manager.name = name, monster_manager);
    			$$invalidate(5, monster_manager.src = `./assets/${name.toLowerCase().replaceAll(" ", "_")}.svg`, monster_manager);
    			$$invalidate(5, monster_manager.worth = 25, monster_manager);
    		}

    		$$invalidate(5, monster_manager);
    	};

    	let monster_manager = {
    		hp: 100,
    		max_hp: 300,
    		pt1: { x: 300, y: 100 },
    		pt2: { x: 700, y: 300 },
    		name: "Stone monster",
    		src: "./assets/robo_arm.svg",
    		tick: 0,
    		total_ticks: 600,
    		worth: 1,
    		kill_index: 0,
    		draw() {
    			// Base Background
    			ctx.fillStyle = "#444";

    			ctx.fillRect(this.pt1.x + 2, this.pt1.y + 2, this.pt2.x - this.pt1.x - 4, this.pt2.y - this.pt1.y - 4);

    			// Health bar background
    			ctx.fillStyle = "#333";

    			ctx.fillRect(this.pt1.x + 10, this.pt2.y - 30, this.pt2.x - this.pt1.x - 20, 20);

    			// Health bar fill color
    			ctx.fillStyle = "#33aa33";

    			ctx.fillRect(this.pt1.x + 10, this.pt2.y - 30, (this.pt2.x - this.pt1.x - 20) * (this.hp / this.max_hp), 20);

    			// Kill Index bar
    			ctx.fillStyle = "#ffffff66";

    			ctx.fillRect(this.pt1.x + 1, this.pt1.y + 1, (this.pt2.x - this.pt1.x) * ((this.kill_index + 1) / 10) - 2, 5);

    			// Timer bar
    			ctx.fillStyle = "#00ffff66";

    			ctx.fillRect(this.pt1.x + 1, this.pt1.y + 6, (this.pt2.x - this.pt1.x) * (this.tick / this.total_ticks) - 2, 5);

    			// Border
    			ctx.strokeStyle = "red";

    			ctx.strokeRect(this.pt1.x, this.pt1.y, this.pt2.x - this.pt1.x, this.pt2.y - this.pt1.y);
    			if (this.tick > this.total_ticks) (this.tick = 0, set_store_value(fighting, $fighting = false, $fighting));
    			this.tick++;
    		},
    		hit(dmg) {
    			this.hp -= dmg;

    			if (this.hp <= 0) {
    				this.tick = 0;

    				// console.log("Mana increasing by: " + this.worth);
    				set_store_value(mana, $mana += Math.round(this.worth * (1 + 0.1 * ($next_tower_lvl - 1))), $mana);

    				spawn_monster();
    				this.kill_index++;

    				if (this.kill_index >= 10) {
    					set_store_value(fighting, $fighting = false, $fighting);
    					set_store_value(next_tower_lvl, $next_tower_lvl++, $next_tower_lvl);
    					this.kill_index = 0;

    					big_explosion(ctx, [
    						this.pt1.x + (this.pt2.x - this.pt1.x) / 2,
    						this.pt1.y + (this.pt2.y - this.pt1.y) / 2
    					]);
    				}
    			}
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Canvas> was created with unknown prop '${key}'`);
    	});

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvas = $$value;
    			$$invalidate(1, canvas);
    		});
    	}

    	const click_handler = () => set_store_value(fighting, $fighting = false, $fighting);

    	function main_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			main = $$value;
    			($$invalidate(0, main), $$invalidate(4, $toggled));
    		});
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		timer,
    		cash,
    		mana,
    		bounce_size,
    		collector_pos,
    		auto_bounce,
    		orb_bonus,
    		basic_orb,
    		light_orb,
    		homing_orb,
    		toggled: canvas_toggled,
    		fighting,
    		shifting,
    		rarities,
    		next_tower_lvl,
    		bounce_power,
    		manager,
    		small_explosion,
    		big_explosion,
    		sci,
    		set_orbs,
    		main,
    		canvas,
    		ctx,
    		pause,
    		step,
    		w,
    		h,
    		distance,
    		rand_width,
    		rand_height,
    		rand_pos,
    		F_acos,
    		F_atan2,
    		orbs,
    		main_loop,
    		mouse,
    		mouse_move,
    		mouse_enter,
    		mouse_leave,
    		mouse_down,
    		key_up,
    		key_down,
    		visible,
    		draw_auto_bounce_bar,
    		auto_bounce_perc,
    		auto_bounce_loop,
    		rand_in_list,
    		monsters,
    		spawn_monster,
    		monster_manager,
    		$fighting,
    		$next_tower_lvl,
    		$mana,
    		$rarities,
    		$auto_bounce,
    		$bounce_size,
    		$toggled,
    		$shifting,
    		$cash,
    		$bounce_power,
    		$homing_orb,
    		$light_orb,
    		$basic_orb,
    		$collector_pos,
    		$timer
    	});

    	$$self.$inject_state = $$props => {
    		if ('main' in $$props) $$invalidate(0, main = $$props.main);
    		if ('canvas' in $$props) $$invalidate(1, canvas = $$props.canvas);
    		if ('ctx' in $$props) ctx = $$props.ctx;
    		if ('pause' in $$props) pause = $$props.pause;
    		if ('step' in $$props) step = $$props.step;
    		if ('w' in $$props) w = $$props.w;
    		if ('h' in $$props) h = $$props.h;
    		if ('visible' in $$props) visible = $$props.visible;
    		if ('auto_bounce_perc' in $$props) auto_bounce_perc = $$props.auto_bounce_perc;
    		if ('monster_manager' in $$props) $$invalidate(5, monster_manager = $$props.monster_manager);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*$basic_orb, $light_orb, $homing_orb*/ 3584) {
    			{
    				set_orbs();
    			}
    		}

    		if ($$self.$$.dirty[0] & /*canvas*/ 2) {
    			{
    				if (canvas != undefined) {
    					$$invalidate(1, canvas.onmousedown = mouse_down, canvas);
    					$$invalidate(1, canvas.onmousemove = mouse_move, canvas);
    					$$invalidate(1, canvas.onmouseenter = mouse_enter, canvas);
    					$$invalidate(1, canvas.onmouseleave = mouse_leave, canvas);
    					document.body.onkeyup = key_up;
    					document.body.onkeydown = key_down;
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*main, $toggled*/ 17) {
    			{
    				if (main != undefined) {
    					$$invalidate(0, main.ontransitionend = () => visible = $toggled, main);
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*$auto_bounce*/ 8) {
    			if (!$auto_bounce.unlocked || !$auto_bounce.on) auto_bounce_perc = 0;
    		}

    		if ($$self.$$.dirty[0] & /*$fighting*/ 4) {
    			{
    				if ($fighting) spawn_monster();
    			}
    		}
    	};

    	return [
    		main,
    		canvas,
    		$fighting,
    		$auto_bounce,
    		$toggled,
    		monster_manager,
    		$next_tower_lvl,
    		$bounce_size,
    		$cash,
    		$homing_orb,
    		$light_orb,
    		$basic_orb,
    		canvas_1_binding,
    		click_handler,
    		main_1_binding
    	];
    }

    class Canvas extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Canvas",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/components/Shop.svelte generated by Svelte v3.46.4 */
    const file$4 = "src/components/Shop.svelte";

    function create_fragment$4(ctx) {
    	let main;
    	let h30;
    	let t0;
    	let t1_value = sci(/*$cash*/ ctx[4]) + "";
    	let t1;
    	let t2;
    	let hr;
    	let t3;
    	let button0;
    	let t4;
    	let b0;
    	let t5;
    	let t6_value = sci(/*$bounce_power*/ ctx[7].cost) + "";
    	let t6;
    	let t7;
    	let button1;
    	let t8;
    	let b1;

    	let t9_value = (/*$auto_bounce*/ ctx[6].unlocked
    	? "Unlocked!"
    	: `$${sci(/*$auto_bounce*/ ctx[6].cost)}`) + "";

    	let t9;
    	let t10;
    	let button2;
    	let t11;
    	let b2;
    	let t12;
    	let t13_value = sci(/*$bounce_area_cost*/ ctx[5]) + "";
    	let t13;
    	let t14;
    	let button3;
    	let t15;
    	let t16_value = sci(/*$starting_cash*/ ctx[3].amount) + "";
    	let t16;
    	let t17;
    	let b3;
    	let t18;
    	let t19_value = sci(/*$starting_cash*/ ctx[3].cost) + "";
    	let t19;
    	let t20;
    	let div;
    	let t21;
    	let h31;
    	let t22;
    	let t23_value = sci(/*$prestige*/ ctx[1].times * 50) + "";
    	let t23;
    	let t24;
    	let t25_value = (/*prest_hover*/ ctx[2] ? "(+50%)" : "") + "";
    	let t25;
    	let t26;
    	let button4;
    	let t27;
    	let b4;
    	let t28;
    	let t29_value = sci(/*$prestige*/ ctx[1].cost) + "";
    	let t29;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h30 = element("h3");
    			t0 = text("Cash: ");
    			t1 = text(t1_value);
    			t2 = space();
    			hr = element("hr");
    			t3 = space();
    			button0 = element("button");
    			t4 = text("Increase Bounce Power ");
    			b0 = element("b");
    			t5 = text("$");
    			t6 = text(t6_value);
    			t7 = space();
    			button1 = element("button");
    			t8 = text("Unlock Auto Bounce ");
    			b1 = element("b");
    			t9 = text(t9_value);
    			t10 = space();
    			button2 = element("button");
    			t11 = text("Increase Bounce Area ");
    			b2 = element("b");
    			t12 = text("$");
    			t13 = text(t13_value);
    			t14 = space();
    			button3 = element("button");
    			t15 = text("Starting Cash +1 ($");
    			t16 = text(t16_value);
    			t17 = text(") ");
    			b3 = element("b");
    			t18 = text("$");
    			t19 = text(t19_value);
    			t20 = space();
    			div = element("div");
    			t21 = space();
    			h31 = element("h3");
    			t22 = text("Orb Value Bonus: +");
    			t23 = text(t23_value);
    			t24 = text("% ");
    			t25 = text(t25_value);
    			t26 = space();
    			button4 = element("button");
    			t27 = text("Prestige ");
    			b4 = element("b");
    			t28 = text("$");
    			t29 = text(t29_value);
    			attr_dev(h30, "id", "cash");
    			attr_dev(h30, "class", "svelte-108bvau");
    			add_location(h30, file$4, 80, 1, 2420);
    			attr_dev(hr, "id", "top-hr");
    			attr_dev(hr, "class", "svelte-108bvau");
    			add_location(hr, file$4, 81, 1, 2459);
    			attr_dev(b0, "class", "svelte-108bvau");
    			add_location(b0, file$4, 83, 59, 2630);
    			attr_dev(button0, "class", "svelte-108bvau");
    			add_location(button0, file$4, 83, 1, 2572);
    			attr_dev(b1, "class", "svelte-108bvau");
    			add_location(b1, file$4, 84, 55, 2728);
    			attr_dev(button1, "class", "svelte-108bvau");
    			add_location(button1, file$4, 84, 1, 2674);
    			attr_dev(b2, "class", "svelte-108bvau");
    			add_location(b2, file$4, 85, 62, 2875);
    			attr_dev(button2, "class", "svelte-108bvau");
    			add_location(button2, file$4, 85, 1, 2814);
    			attr_dev(b3, "class", "svelte-108bvau");
    			add_location(b3, file$4, 86, 87, 3004);
    			attr_dev(button3, "class", "svelte-108bvau");
    			add_location(button3, file$4, 86, 1, 2918);
    			add_location(div, file$4, 87, 1, 3049);
    			attr_dev(h31, "id", "orb-info");
    			attr_dev(h31, "class", "svelte-108bvau");
    			add_location(h31, file$4, 88, 1, 3062);
    			attr_dev(b4, "class", "svelte-108bvau");
    			add_location(b4, file$4, 89, 63, 3223);
    			attr_dev(button4, "class", "svelte-108bvau");
    			add_location(button4, file$4, 89, 1, 3161);
    			attr_dev(main, "id", "main-shop");
    			attr_dev(main, "class", "svelte-108bvau");
    			add_location(main, file$4, 79, 0, 2397);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h30);
    			append_dev(h30, t0);
    			append_dev(h30, t1);
    			append_dev(main, t2);
    			append_dev(main, hr);
    			append_dev(main, t3);
    			append_dev(main, button0);
    			append_dev(button0, t4);
    			append_dev(button0, b0);
    			append_dev(b0, t5);
    			append_dev(b0, t6);
    			append_dev(main, t7);
    			append_dev(main, button1);
    			append_dev(button1, t8);
    			append_dev(button1, b1);
    			append_dev(b1, t9);
    			append_dev(main, t10);
    			append_dev(main, button2);
    			append_dev(button2, t11);
    			append_dev(button2, b2);
    			append_dev(b2, t12);
    			append_dev(b2, t13);
    			append_dev(main, t14);
    			append_dev(main, button3);
    			append_dev(button3, t15);
    			append_dev(button3, t16);
    			append_dev(button3, t17);
    			append_dev(button3, b3);
    			append_dev(b3, t18);
    			append_dev(b3, t19);
    			append_dev(main, t20);
    			append_dev(main, div);
    			append_dev(main, t21);
    			append_dev(main, h31);
    			append_dev(h31, t22);
    			append_dev(h31, t23);
    			append_dev(h31, t24);
    			append_dev(h31, t25);
    			append_dev(main, t26);
    			append_dev(main, button4);
    			append_dev(button4, t27);
    			append_dev(button4, b4);
    			append_dev(b4, t28);
    			append_dev(b4, t29);
    			/*button4_binding*/ ctx[14](button4);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*buy_bounce_power*/ ctx[8], false, false, false),
    					listen_dev(button1, "click", /*buy_auto_bounce*/ ctx[9], false, false, false),
    					listen_dev(button2, "click", /*increase_bounce_area*/ ctx[10], false, false, false),
    					listen_dev(button3, "click", /*buy_starting_cash*/ ctx[12], false, false, false),
    					listen_dev(button4, "click", /*do_prestige*/ ctx[11], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$cash*/ 16 && t1_value !== (t1_value = sci(/*$cash*/ ctx[4]) + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*$bounce_power*/ 128 && t6_value !== (t6_value = sci(/*$bounce_power*/ ctx[7].cost) + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*$auto_bounce*/ 64 && t9_value !== (t9_value = (/*$auto_bounce*/ ctx[6].unlocked
    			? "Unlocked!"
    			: `$${sci(/*$auto_bounce*/ ctx[6].cost)}`) + "")) set_data_dev(t9, t9_value);

    			if (dirty & /*$bounce_area_cost*/ 32 && t13_value !== (t13_value = sci(/*$bounce_area_cost*/ ctx[5]) + "")) set_data_dev(t13, t13_value);
    			if (dirty & /*$starting_cash*/ 8 && t16_value !== (t16_value = sci(/*$starting_cash*/ ctx[3].amount) + "")) set_data_dev(t16, t16_value);
    			if (dirty & /*$starting_cash*/ 8 && t19_value !== (t19_value = sci(/*$starting_cash*/ ctx[3].cost) + "")) set_data_dev(t19, t19_value);
    			if (dirty & /*$prestige*/ 2 && t23_value !== (t23_value = sci(/*$prestige*/ ctx[1].times * 50) + "")) set_data_dev(t23, t23_value);
    			if (dirty & /*prest_hover*/ 4 && t25_value !== (t25_value = (/*prest_hover*/ ctx[2] ? "(+50%)" : "") + "")) set_data_dev(t25, t25_value);
    			if (dirty & /*$prestige*/ 2 && t29_value !== (t29_value = sci(/*$prestige*/ ctx[1].cost) + "")) set_data_dev(t29, t29_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			/*button4_binding*/ ctx[14](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $shifting;
    	let $starting_cash;
    	let $cash;
    	let $bounce_area_cost;
    	let $bounce_size;
    	let $prestige;
    	let $orb_bonus;
    	let $auto_bounce;
    	let $bounce_power;
    	validate_store(shifting, 'shifting');
    	component_subscribe($$self, shifting, $$value => $$invalidate(15, $shifting = $$value));
    	validate_store(starting_cash, 'starting_cash');
    	component_subscribe($$self, starting_cash, $$value => $$invalidate(3, $starting_cash = $$value));
    	validate_store(cash, 'cash');
    	component_subscribe($$self, cash, $$value => $$invalidate(4, $cash = $$value));
    	validate_store(bounce_area_cost, 'bounce_area_cost');
    	component_subscribe($$self, bounce_area_cost, $$value => $$invalidate(5, $bounce_area_cost = $$value));
    	validate_store(bounce_size, 'bounce_size');
    	component_subscribe($$self, bounce_size, $$value => $$invalidate(16, $bounce_size = $$value));
    	validate_store(prestige, 'prestige');
    	component_subscribe($$self, prestige, $$value => $$invalidate(1, $prestige = $$value));
    	validate_store(orb_bonus, 'orb_bonus');
    	component_subscribe($$self, orb_bonus, $$value => $$invalidate(13, $orb_bonus = $$value));
    	validate_store(auto_bounce, 'auto_bounce');
    	component_subscribe($$self, auto_bounce, $$value => $$invalidate(6, $auto_bounce = $$value));
    	validate_store(bounce_power, 'bounce_power');
    	component_subscribe($$self, bounce_power, $$value => $$invalidate(7, $bounce_power = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Shop', slots, []);

    	const buy_bounce_power = () => {
    		if ($cash < $bounce_power.cost) return;
    		set_store_value(cash, $cash -= $bounce_power.cost, $cash);
    		bounce_power.update(v => (v.cost = Math.floor(v.cost * 1.5), v.value += 2.5, v));
    		if ($shifting) buy_bounce_power();
    	};

    	//#endregion
    	//#region | Auto Bounce
    	const buy_auto_bounce = () => {
    		if ($cash < $auto_bounce.cost || $auto_bounce.unlocked) return;
    		set_store_value(cash, $cash -= $auto_bounce.cost, $cash);
    		auto_bounce.update(v => (v.unlocked = true, v));
    	};

    	//#endregion
    	//#region | Bounce Area
    	const increase_bounce_area = () => {
    		if ($cash < $bounce_area_cost) return;
    		set_store_value(cash, $cash -= $bounce_area_cost, $cash);
    		set_store_value(bounce_area_cost, $bounce_area_cost *= 2, $bounce_area_cost);
    		set_store_value(bounce_size, $bounce_size += 25, $bounce_size);
    		if ($shifting) increase_bounce_area();
    	};

    	//#endregion
    	//#region | Prestige
    	/** @type {HTMLElement} */
    	let prest_btn;

    	let prest_hover = false;

    	const do_prestige = (bypass = false) => {
    		if ($cash < $prestige.cost && bypass !== true) return;
    		set_store_value(cash, $cash = $starting_cash.amount, $cash);
    		basic_orb.update(v => (v.amount = 1, v.cost = 50, v));

    		// light_orb.update( v => (v.amount = 0, v.cost = 1, v));
    		// homing_orb.update( v => (v.amount = 0, v.cost = 5, v));
    		set_store_value(bounce_size, $bounce_size = 75, $bounce_size);

    		set_store_value(bounce_area_cost, $bounce_area_cost = 500, $bounce_area_cost);
    		auto_bounce.update(v => (v.unlocked = false, v));
    		bounce_power.update(v => (v.cost = 250, v.value = 30, v));
    		prestige.update(v => (v.times++, v.cost = Math.round(v.cost * 1.25), v));
    	};

    	//#endregion
    	//#region | Post-Prestige Cash
    	const buy_starting_cash = () => {
    		if ($cash < $starting_cash.cost) return;
    		set_store_value(cash, $cash -= $starting_cash.cost, $cash);
    		starting_cash.update(v => (v.amount++, v));
    		if ($shifting) buy_starting_cash();
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Shop> was created with unknown prop '${key}'`);
    	});

    	function button4_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			prest_btn = $$value;
    			$$invalidate(0, prest_btn);
    		});
    	}

    	$$self.$capture_state = () => ({
    		cash,
    		shifting,
    		auto_bounce,
    		bounce_size,
    		bounce_area_cost,
    		orb_bonus,
    		basic_orb,
    		light_orb,
    		homing_orb,
    		prestige,
    		timer,
    		bounce_power,
    		starting_cash,
    		sci,
    		buy_bounce_power,
    		buy_auto_bounce,
    		increase_bounce_area,
    		prest_btn,
    		prest_hover,
    		do_prestige,
    		buy_starting_cash,
    		$shifting,
    		$starting_cash,
    		$cash,
    		$bounce_area_cost,
    		$bounce_size,
    		$prestige,
    		$orb_bonus,
    		$auto_bounce,
    		$bounce_power
    	});

    	$$self.$inject_state = $$props => {
    		if ('prest_btn' in $$props) $$invalidate(0, prest_btn = $$props.prest_btn);
    		if ('prest_hover' in $$props) $$invalidate(2, prest_hover = $$props.prest_hover);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*prest_btn*/ 1) {
    			{
    				// Prestige Button
    				if (prest_btn != undefined) {
    					$$invalidate(0, prest_btn.onmouseenter = () => $$invalidate(2, prest_hover = true), prest_btn);
    					$$invalidate(0, prest_btn.onmouseleave = () => $$invalidate(2, prest_hover = false), prest_btn);
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*$orb_bonus, $prestige*/ 8194) {
    			{
    				basic_orb.update(v => (v.value = 1 + 0.5 * $prestige.times, v));
    				light_orb.update(v => (v.value = 1 + 0.5 * $prestige.times, v));
    				homing_orb.update(v => (v.value = 0.5 + 0.5 * $prestige.times, v));
    			}
    		}
    	};

    	return [
    		prest_btn,
    		$prestige,
    		prest_hover,
    		$starting_cash,
    		$cash,
    		$bounce_area_cost,
    		$auto_bounce,
    		$bounce_power,
    		buy_bounce_power,
    		buy_auto_bounce,
    		increase_bounce_area,
    		do_prestige,
    		buy_starting_cash,
    		$orb_bonus,
    		button4_binding
    	];
    }

    class Shop extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Shop",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/Artifacts.svelte generated by Svelte v3.46.4 */

    const file$3 = "src/components/Artifacts.svelte";

    function create_fragment$3(ctx) {
    	let main;
    	let h3;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h3 = element("h3");
    			h3.textContent = "Artifacts Coming Soon!";
    			attr_dev(h3, "class", "svelte-1duvk0l");
    			add_location(h3, file$3, 5, 1, 29);
    			attr_dev(main, "class", "svelte-1duvk0l");
    			add_location(main, file$3, 4, 0, 21);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Artifacts', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Artifacts> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Artifacts extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Artifacts",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/Lab.svelte generated by Svelte v3.46.4 */
    const file$2 = "src/components/Lab.svelte";

    // (127:2) {:else}
    function create_else_block_1(ctx) {
    	let h3;
    	let t0;
    	let t1_value = 5 - /*$prestige*/ ctx[9].times + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = text("Unlock After ");
    			t1 = text(t1_value);
    			t2 = text(" Prestiges");
    			attr_dev(h3, "id", "info");
    			attr_dev(h3, "class", "svelte-xm6pjh");
    			add_location(h3, file$2, 128, 3, 3906);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t0);
    			append_dev(h3, t1);
    			append_dev(h3, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$prestige*/ 512 && t1_value !== (t1_value = 5 - /*$prestige*/ ctx[9].times + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(127:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (114:2) {#if $unlocked_fighting}
    function create_if_block_2(ctx) {
    	let button;
    	let t0;
    	let t1;
    	let t2;
    	let b;
    	let t3;
    	let t4_value = sci(/*$fight_cost*/ ctx[5]) + "";
    	let t4;
    	let t5;
    	let h3;
    	let t6;
    	let t7;
    	let t8;
    	let t9;
    	let t10;
    	let t11;
    	let if_block0 = /*$rarities*/ ctx[10].c > 0 && create_if_block_9(ctx);
    	let if_block1 = /*$rarities*/ ctx[10].c > 0 && /*$rarities*/ ctx[10].u > 0 && create_if_block_8(ctx);
    	let if_block2 = /*$rarities*/ ctx[10].u > 0 && create_if_block_7(ctx);
    	let if_block3 = /*$rarities*/ ctx[10].r > 0 && create_if_block_6(ctx);
    	let if_block4 = (/*$rarities*/ ctx[10].c > 0 || /*$rarities*/ ctx[10].u > 0) && create_if_block_5(ctx);
    	let if_block5 = /*$rarities*/ ctx[10].r > 0 && /*$rarities*/ ctx[10].l > 0 && create_if_block_4(ctx);
    	let if_block6 = /*$rarities*/ ctx[10].l > 0 && create_if_block_3(ctx);

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text("Monster Tower Lvl ");
    			t1 = text(/*$next_tower_lvl*/ ctx[6]);
    			t2 = text(" | ");
    			b = element("b");
    			t3 = text("$");
    			t4 = text(t4_value);
    			t5 = space();
    			h3 = element("h3");
    			if (if_block0) if_block0.c();
    			t6 = space();
    			if (if_block1) if_block1.c();
    			t7 = space();
    			if (if_block2) if_block2.c();
    			t8 = space();
    			if (if_block3) if_block3.c();
    			t9 = space();
    			if (if_block4) if_block4.c();
    			t10 = space();
    			if (if_block5) if_block5.c();
    			t11 = space();
    			if (if_block6) if_block6.c();
    			add_location(b, file$2, 115, 42, 3222);
    			attr_dev(h3, "id", "rarities");
    			attr_dev(h3, "class", "svelte-xm6pjh");
    			add_location(h3, file$2, 116, 4, 3253);
    			attr_dev(button, "id", "fight-btn");
    			attr_dev(button, "class", "svelte-xm6pjh");
    			add_location(button, file$2, 114, 3, 3134);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);
    			append_dev(button, t2);
    			append_dev(button, b);
    			append_dev(b, t3);
    			append_dev(b, t4);
    			append_dev(button, t5);
    			append_dev(button, h3);
    			if (if_block0) if_block0.m(h3, null);
    			append_dev(h3, t6);
    			if (if_block1) if_block1.m(h3, null);
    			append_dev(h3, t7);
    			if (if_block2) if_block2.m(h3, null);
    			append_dev(h3, t8);
    			if (if_block3) if_block3.m(h3, null);
    			append_dev(h3, t9);
    			if (if_block4) if_block4.m(h3, null);
    			append_dev(h3, t10);
    			if (if_block5) if_block5.m(h3, null);
    			append_dev(h3, t11);
    			if (if_block6) if_block6.m(h3, null);
    			/*button_binding*/ ctx[19](button);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$next_tower_lvl*/ 64) set_data_dev(t1, /*$next_tower_lvl*/ ctx[6]);
    			if (dirty & /*$fight_cost*/ 32 && t4_value !== (t4_value = sci(/*$fight_cost*/ ctx[5]) + "")) set_data_dev(t4, t4_value);

    			if (/*$rarities*/ ctx[10].c > 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_9(ctx);
    					if_block0.c();
    					if_block0.m(h3, t6);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*$rarities*/ ctx[10].c > 0 && /*$rarities*/ ctx[10].u > 0) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_8(ctx);
    					if_block1.c();
    					if_block1.m(h3, t7);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*$rarities*/ ctx[10].u > 0) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_7(ctx);
    					if_block2.c();
    					if_block2.m(h3, t8);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*$rarities*/ ctx[10].r > 0) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block_6(ctx);
    					if_block3.c();
    					if_block3.m(h3, t9);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (/*$rarities*/ ctx[10].c > 0 || /*$rarities*/ ctx[10].u > 0) {
    				if (if_block4) ; else {
    					if_block4 = create_if_block_5(ctx);
    					if_block4.c();
    					if_block4.m(h3, t10);
    				}
    			} else if (if_block4) {
    				if_block4.d(1);
    				if_block4 = null;
    			}

    			if (/*$rarities*/ ctx[10].r > 0 && /*$rarities*/ ctx[10].l > 0) {
    				if (if_block5) ; else {
    					if_block5 = create_if_block_4(ctx);
    					if_block5.c();
    					if_block5.m(h3, t11);
    				}
    			} else if (if_block5) {
    				if_block5.d(1);
    				if_block5 = null;
    			}

    			if (/*$rarities*/ ctx[10].l > 0) {
    				if (if_block6) {
    					if_block6.p(ctx, dirty);
    				} else {
    					if_block6 = create_if_block_3(ctx);
    					if_block6.c();
    					if_block6.m(h3, null);
    				}
    			} else if (if_block6) {
    				if_block6.d(1);
    				if_block6 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();
    			if (if_block5) if_block5.d();
    			if (if_block6) if_block6.d();
    			/*button_binding*/ ctx[19](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(114:2) {#if $unlocked_fighting}",
    		ctx
    	});

    	return block;
    }

    // (118:5) {#if $rarities.c > 0}
    function create_if_block_9(ctx) {
    	let span;
    	let t0;
    	let t1_value = /*$rarities*/ ctx[10].c + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("Common: ");
    			t1 = text(t1_value);
    			t2 = text("%");
    			set_style(span, "color", "#ddd");
    			add_location(span, file$2, 117, 26, 3298);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$rarities*/ 1024 && t1_value !== (t1_value = /*$rarities*/ ctx[10].c + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(118:5) {#if $rarities.c > 0}",
    		ctx
    	});

    	return block;
    }

    // (119:5) {#if $rarities.c > 0 && $rarities.u > 0}
    function create_if_block_8(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("|");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(119:5) {#if $rarities.c > 0 && $rarities.u > 0}",
    		ctx
    	});

    	return block;
    }

    // (120:5) {#if $rarities.u > 0}
    function create_if_block_7(ctx) {
    	let span;
    	let t0;
    	let t1_value = /*$rarities*/ ctx[10].u + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("Uncommon: ");
    			t1 = text(t1_value);
    			t2 = text("%");
    			set_style(span, "color", "#B8E986");
    			add_location(span, file$2, 119, 26, 3441);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$rarities*/ 1024 && t1_value !== (t1_value = /*$rarities*/ ctx[10].u + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(120:5) {#if $rarities.u > 0}",
    		ctx
    	});

    	return block;
    }

    // (121:5) {#if $rarities.r > 0}
    function create_if_block_6(ctx) {
    	let span;
    	let t0;
    	let t1_value = /*$rarities*/ ctx[10].r + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("Rare: ");
    			t1 = text(t1_value);
    			t2 = text("%");
    			set_style(span, "color", "#48BAFF");
    			add_location(span, file$2, 120, 26, 3534);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$rarities*/ 1024 && t1_value !== (t1_value = /*$rarities*/ ctx[10].r + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(121:5) {#if $rarities.r > 0}",
    		ctx
    	});

    	return block;
    }

    // (122:5) {#if $rarities.c > 0 || $rarities.u > 0}
    function create_if_block_5(ctx) {
    	let br;

    	const block = {
    		c: function create() {
    			br = element("br");
    			add_location(br, file$2, 121, 46, 3643);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, br, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(122:5) {#if $rarities.c > 0 || $rarities.u > 0}",
    		ctx
    	});

    	return block;
    }

    // (123:5) {#if $rarities.r > 0 && $rarities.l > 0}
    function create_if_block_4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("|");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(123:5) {#if $rarities.r > 0 && $rarities.l > 0}",
    		ctx
    	});

    	return block;
    }

    // (124:5) {#if $rarities.l > 0}
    function create_if_block_3(ctx) {
    	let span;
    	let t0;
    	let t1_value = /*$rarities*/ ctx[10].l + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("Legendary: ");
    			t1 = text(t1_value);
    			t2 = text("%");
    			set_style(span, "color", "#F8E71C");
    			add_location(span, file$2, 123, 26, 3734);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$rarities*/ 1024 && t1_value !== (t1_value = /*$rarities*/ ctx[10].l + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(124:5) {#if $rarities.l > 0}",
    		ctx
    	});

    	return block;
    }

    // (155:2) {:else}
    function create_else_block(ctx) {
    	let button0;
    	let t1;
    	let button1;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "?";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "?";
    			button0.disabled = true;
    			attr_dev(button0, "class", "svelte-xm6pjh");
    			add_location(button0, file$2, 155, 2, 4946);
    			button1.disabled = true;
    			attr_dev(button1, "class", "svelte-xm6pjh");
    			add_location(button1, file$2, 156, 2, 4976);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(155:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (140:2) {#if $got_mana}
    function create_if_block_1(ctx) {
    	let button2;
    	let t0;
    	let p0;
    	let t1;
    	let t2_value = /*$light_orb*/ ctx[3].value + "";
    	let t2;
    	let t3;
    	let div0;
    	let button0;
    	let t4;
    	let t5_value = sci(/*$light_orb*/ ctx[3].cost) + "";
    	let t5;
    	let t6;
    	let t7;
    	let button1;
    	let t9;
    	let button5;
    	let t10;
    	let p1;
    	let t11;
    	let t12_value = /*$homing_orb*/ ctx[1].value + "";
    	let t12;
    	let t13;
    	let div1;
    	let button3;
    	let t14;
    	let t15_value = sci(/*$homing_orb*/ ctx[1].cost) + "";
    	let t15;
    	let t16;
    	let t17;
    	let button4;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button2 = element("button");
    			t0 = text("Light\n\t\t\t");
    			p0 = element("p");
    			t1 = text("Dmg/Value: ");
    			t2 = text(t2_value);
    			t3 = space();
    			div0 = element("div");
    			button0 = element("button");
    			t4 = text("Buy ");
    			t5 = text(t5_value);
    			t6 = text("₪");
    			t7 = space();
    			button1 = element("button");
    			button1.textContent = "Sell";
    			t9 = space();
    			button5 = element("button");
    			t10 = text("Homing\n\t\t\t");
    			p1 = element("p");
    			t11 = text("Dmg/Value: ");
    			t12 = text(t12_value);
    			t13 = space();
    			div1 = element("div");
    			button3 = element("button");
    			t14 = text("Buy ");
    			t15 = text(t15_value);
    			t16 = text("₪");
    			t17 = space();
    			button4 = element("button");
    			button4.textContent = "Sell";
    			attr_dev(p0, "class", "stat svelte-xm6pjh");
    			add_location(p0, file$2, 141, 3, 4376);
    			attr_dev(button0, "class", "buy-sell svelte-xm6pjh");
    			add_location(button0, file$2, 143, 4, 4456);
    			attr_dev(button1, "class", "buy-sell svelte-xm6pjh");
    			add_location(button1, file$2, 144, 4, 4543);
    			attr_dev(div0, "class", "orb-info svelte-xm6pjh");
    			add_location(div0, file$2, 142, 3, 4429);
    			attr_dev(button2, "class", "trade-btn svelte-xm6pjh");
    			attr_dev(button2, "id", "light-btn");
    			add_location(button2, file$2, 140, 2, 4326);
    			attr_dev(p1, "class", "stat svelte-xm6pjh");
    			add_location(p1, file$2, 148, 3, 4680);
    			attr_dev(button3, "class", "buy-sell svelte-xm6pjh");
    			add_location(button3, file$2, 150, 4, 4761);
    			attr_dev(button4, "class", "buy-sell svelte-xm6pjh");
    			add_location(button4, file$2, 151, 4, 4850);
    			attr_dev(div1, "class", "orb-info svelte-xm6pjh");
    			add_location(div1, file$2, 149, 3, 4734);
    			attr_dev(button5, "class", "trade-btn svelte-xm6pjh");
    			attr_dev(button5, "id", "homing-btn");
    			add_location(button5, file$2, 147, 2, 4628);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button2, anchor);
    			append_dev(button2, t0);
    			append_dev(button2, p0);
    			append_dev(p0, t1);
    			append_dev(p0, t2);
    			append_dev(button2, t3);
    			append_dev(button2, div0);
    			append_dev(div0, button0);
    			append_dev(button0, t4);
    			append_dev(button0, t5);
    			append_dev(button0, t6);
    			append_dev(div0, t7);
    			append_dev(div0, button1);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, button5, anchor);
    			append_dev(button5, t10);
    			append_dev(button5, p1);
    			append_dev(p1, t11);
    			append_dev(p1, t12);
    			append_dev(button5, t13);
    			append_dev(button5, div1);
    			append_dev(div1, button3);
    			append_dev(button3, t14);
    			append_dev(button3, t15);
    			append_dev(button3, t16);
    			append_dev(div1, t17);
    			append_dev(div1, button4);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*buy_light*/ ctx[13], false, false, false),
    					listen_dev(button1, "click", /*sell_light*/ ctx[14], false, false, false),
    					listen_dev(button3, "click", /*buy_homing*/ ctx[15], false, false, false),
    					listen_dev(button4, "click", /*sell_homing*/ ctx[16], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$light_orb*/ 8 && t2_value !== (t2_value = /*$light_orb*/ ctx[3].value + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*$light_orb*/ 8 && t5_value !== (t5_value = sci(/*$light_orb*/ ctx[3].cost) + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*$homing_orb*/ 2 && t12_value !== (t12_value = /*$homing_orb*/ ctx[1].value + "")) set_data_dev(t12, t12_value);
    			if (dirty & /*$homing_orb*/ 2 && t15_value !== (t15_value = sci(/*$homing_orb*/ ctx[1].cost) + "")) set_data_dev(t15, t15_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button2);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(button5);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(140:2) {#if $got_mana}",
    		ctx
    	});

    	return block;
    }

    // (164:2) {#if $got_mana}
    function create_if_block(ctx) {
    	let span0;
    	let t0;
    	let t1_value = /*$light_orb*/ ctx[3].amount + "";
    	let t1;
    	let br;
    	let t2;
    	let span1;
    	let t3;
    	let t4_value = /*$homing_orb*/ ctx[1].amount + "";
    	let t4;

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			t0 = text("Light Orbs: ");
    			t1 = text(t1_value);
    			br = element("br");
    			t2 = space();
    			span1 = element("span");
    			t3 = text("Homing Orbs: ");
    			t4 = text(t4_value);
    			set_style(span0, "color", "#00cccc");
    			add_location(span0, file$2, 164, 3, 5232);
    			add_location(br, file$2, 164, 71, 5300);
    			set_style(span1, "color", "#cccc00");
    			add_location(span1, file$2, 165, 3, 5308);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			append_dev(span0, t0);
    			append_dev(span0, t1);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, span1, anchor);
    			append_dev(span1, t3);
    			append_dev(span1, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$light_orb*/ 8 && t1_value !== (t1_value = /*$light_orb*/ ctx[3].amount + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*$homing_orb*/ 2 && t4_value !== (t4_value = /*$homing_orb*/ ctx[1].amount + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(span1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(164:2) {#if $got_mana}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let main;
    	let h30;
    	let t0;
    	let span0;
    	let t2;
    	let t3;
    	let t4;
    	let div0;
    	let t5;
    	let div2;
    	let button2;
    	let t6;
    	let p;
    	let t7;
    	let t8_value = /*$basic_orb*/ ctx[4].value + "";
    	let t8;
    	let t9;
    	let div1;
    	let button0;
    	let t10;
    	let t11_value = sci(/*$basic_orb*/ ctx[4].cost) + "";
    	let t11;
    	let t12;
    	let button1;
    	let t14;
    	let t15;
    	let button3;
    	let t17;
    	let button4;
    	let t19;
    	let h31;
    	let span1;
    	let t20;
    	let t21_value = /*$basic_orb*/ ctx[4].amount + "";
    	let t21;
    	let br;
    	let t22;
    	let t23;
    	let artifacts;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*$unlocked_fighting*/ ctx[8]) return create_if_block_2;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*$got_mana*/ ctx[7]) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);
    	let if_block2 = /*$got_mana*/ ctx[7] && create_if_block(ctx);
    	artifacts = new Artifacts({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			h30 = element("h3");
    			t0 = text("Mana ");
    			span0 = element("span");
    			span0.textContent = "(₪)";
    			t2 = text(": ");
    			t3 = text(/*$mana*/ ctx[2]);
    			t4 = space();
    			div0 = element("div");
    			if_block0.c();
    			t5 = space();
    			div2 = element("div");
    			button2 = element("button");
    			t6 = text("Basic\n\t\t\t");
    			p = element("p");
    			t7 = text("Dmg/Value: ");
    			t8 = text(t8_value);
    			t9 = space();
    			div1 = element("div");
    			button0 = element("button");
    			t10 = text("Buy $");
    			t11 = text(t11_value);
    			t12 = space();
    			button1 = element("button");
    			button1.textContent = "Sell";
    			t14 = space();
    			if_block1.c();
    			t15 = space();
    			button3 = element("button");
    			button3.textContent = "?";
    			t17 = space();
    			button4 = element("button");
    			button4.textContent = "?";
    			t19 = space();
    			h31 = element("h3");
    			span1 = element("span");
    			t20 = text("Basic Orbs: ");
    			t21 = text(t21_value);
    			br = element("br");
    			t22 = space();
    			if (if_block2) if_block2.c();
    			t23 = space();
    			create_component(artifacts.$$.fragment);
    			set_style(span0, "font-weight", "normal");
    			add_location(span0, file$2, 111, 20, 3023);
    			attr_dev(h30, "id", "mana");
    			attr_dev(h30, "class", "svelte-xm6pjh");
    			add_location(h30, file$2, 111, 1, 3004);
    			attr_dev(div0, "id", "hold-btn");
    			attr_dev(div0, "class", "svelte-xm6pjh");
    			add_location(div0, file$2, 112, 1, 3084);
    			attr_dev(p, "class", "stat svelte-xm6pjh");
    			add_location(p, file$2, 133, 3, 4056);
    			attr_dev(button0, "class", "buy-sell svelte-xm6pjh");
    			add_location(button0, file$2, 135, 4, 4136);
    			attr_dev(button1, "class", "buy-sell svelte-xm6pjh");
    			add_location(button1, file$2, 136, 4, 4223);
    			attr_dev(div1, "class", "orb-info svelte-xm6pjh");
    			add_location(div1, file$2, 134, 3, 4109);
    			attr_dev(button2, "class", "trade-btn svelte-xm6pjh");
    			attr_dev(button2, "id", "basic-btn");
    			add_location(button2, file$2, 132, 2, 4006);
    			button3.disabled = true;
    			attr_dev(button3, "class", "svelte-xm6pjh");
    			add_location(button3, file$2, 158, 2, 5014);
    			button4.disabled = true;
    			attr_dev(button4, "class", "svelte-xm6pjh");
    			add_location(button4, file$2, 159, 2, 5044);
    			attr_dev(div2, "id", "orb-row");
    			attr_dev(div2, "class", "svelte-xm6pjh");
    			add_location(div2, file$2, 131, 1, 3985);
    			set_style(span1, "color", "#ccc");
    			add_location(span1, file$2, 162, 2, 5141);
    			add_location(br, file$2, 162, 67, 5206);
    			attr_dev(h31, "id", "orb-stats");
    			attr_dev(h31, "class", "svelte-xm6pjh");
    			add_location(h31, file$2, 161, 1, 5119);
    			attr_dev(main, "class", "svelte-xm6pjh");
    			add_location(main, file$2, 110, 0, 2996);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h30);
    			append_dev(h30, t0);
    			append_dev(h30, span0);
    			append_dev(h30, t2);
    			append_dev(h30, t3);
    			append_dev(main, t4);
    			append_dev(main, div0);
    			if_block0.m(div0, null);
    			append_dev(main, t5);
    			append_dev(main, div2);
    			append_dev(div2, button2);
    			append_dev(button2, t6);
    			append_dev(button2, p);
    			append_dev(p, t7);
    			append_dev(p, t8);
    			append_dev(button2, t9);
    			append_dev(button2, div1);
    			append_dev(div1, button0);
    			append_dev(button0, t10);
    			append_dev(button0, t11);
    			append_dev(div1, t12);
    			append_dev(div1, button1);
    			append_dev(div2, t14);
    			if_block1.m(div2, null);
    			append_dev(div2, t15);
    			append_dev(div2, button3);
    			append_dev(div2, t17);
    			append_dev(div2, button4);
    			append_dev(main, t19);
    			append_dev(main, h31);
    			append_dev(h31, span1);
    			append_dev(span1, t20);
    			append_dev(span1, t21);
    			append_dev(h31, br);
    			append_dev(h31, t22);
    			if (if_block2) if_block2.m(h31, null);
    			append_dev(main, t23);
    			mount_component(artifacts, main, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*buy_basic*/ ctx[11], false, false, false),
    					listen_dev(button1, "click", /*sell_basic*/ ctx[12], false, false, false),
    					listen_dev(button4, "click", /*click_handler*/ ctx[20], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*$mana*/ 4) set_data_dev(t3, /*$mana*/ ctx[2]);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			}

    			if ((!current || dirty & /*$basic_orb*/ 16) && t8_value !== (t8_value = /*$basic_orb*/ ctx[4].value + "")) set_data_dev(t8, t8_value);
    			if ((!current || dirty & /*$basic_orb*/ 16) && t11_value !== (t11_value = sci(/*$basic_orb*/ ctx[4].cost) + "")) set_data_dev(t11, t11_value);

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div2, t15);
    				}
    			}

    			if ((!current || dirty & /*$basic_orb*/ 16) && t21_value !== (t21_value = /*$basic_orb*/ ctx[4].amount + "")) set_data_dev(t21, t21_value);

    			if (/*$got_mana*/ ctx[7]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block(ctx);
    					if_block2.c();
    					if_block2.m(h31, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(artifacts.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(artifacts.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_block0.d();
    			if_block1.d();
    			if (if_block2) if_block2.d();
    			destroy_component(artifacts);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $homing_orb;
    	let $mana;
    	let $shifting;
    	let $light_orb;
    	let $basic_orb;
    	let $cash;
    	let $fighting;
    	let $canvas_toggled;
    	let $fight_cost;
    	let $next_tower_lvl;
    	let $got_mana;
    	let $unlocked_fighting;
    	let $prestige;
    	let $rarities;
    	validate_store(homing_orb, 'homing_orb');
    	component_subscribe($$self, homing_orb, $$value => $$invalidate(1, $homing_orb = $$value));
    	validate_store(mana, 'mana');
    	component_subscribe($$self, mana, $$value => $$invalidate(2, $mana = $$value));
    	validate_store(shifting, 'shifting');
    	component_subscribe($$self, shifting, $$value => $$invalidate(23, $shifting = $$value));
    	validate_store(light_orb, 'light_orb');
    	component_subscribe($$self, light_orb, $$value => $$invalidate(3, $light_orb = $$value));
    	validate_store(basic_orb, 'basic_orb');
    	component_subscribe($$self, basic_orb, $$value => $$invalidate(4, $basic_orb = $$value));
    	validate_store(cash, 'cash');
    	component_subscribe($$self, cash, $$value => $$invalidate(17, $cash = $$value));
    	validate_store(fighting, 'fighting');
    	component_subscribe($$self, fighting, $$value => $$invalidate(18, $fighting = $$value));
    	validate_store(canvas_toggled, 'canvas_toggled');
    	component_subscribe($$self, canvas_toggled, $$value => $$invalidate(24, $canvas_toggled = $$value));
    	validate_store(fight_cost, 'fight_cost');
    	component_subscribe($$self, fight_cost, $$value => $$invalidate(5, $fight_cost = $$value));
    	validate_store(next_tower_lvl, 'next_tower_lvl');
    	component_subscribe($$self, next_tower_lvl, $$value => $$invalidate(6, $next_tower_lvl = $$value));
    	validate_store(got_mana, 'got_mana');
    	component_subscribe($$self, got_mana, $$value => $$invalidate(7, $got_mana = $$value));
    	validate_store(unlocked_fighting, 'unlocked_fighting');
    	component_subscribe($$self, unlocked_fighting, $$value => $$invalidate(8, $unlocked_fighting = $$value));
    	validate_store(prestige, 'prestige');
    	component_subscribe($$self, prestige, $$value => $$invalidate(9, $prestige = $$value));
    	validate_store(rarities, 'rarities');
    	component_subscribe($$self, rarities, $$value => $$invalidate(10, $rarities = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Lab', slots, []);
    	let fight_btn;
    	let hover_fight = false;

    	//#endregion
    	//#region | Buy Orbs
    	// Math.ceil(Math.floor(#*1.2)/1.2)
    	let total_orbs = 0;

    	//#region | Basic Orb
    	const buy_basic = () => {
    		if ($cash < $basic_orb.cost) return;
    		set_store_value(cash, $cash -= $basic_orb.cost, $cash);
    		basic_orb.update(v => (v.cost = Math.floor(v.cost * 1.1), v.amount++, v));
    		if ($shifting) buy_basic();
    	};

    	const sell_basic = () => {
    		if (total_orbs <= 1) return;
    		set_store_value(cash, $cash += Math.floor($basic_orb.cost / 2), $cash);
    		basic_orb.update(v => (v.cost = Math.ceil(v.cost / 1.2), v.amount--, v));
    	};

    	//#endregion
    	//#region | Light Orb
    	const buy_light = () => {
    		if ($mana < $light_orb.cost) return;
    		set_store_value(mana, $mana -= $light_orb.cost, $mana);
    		light_orb.update(v => (v.cost += 1, v.amount++, v));
    		if ($shifting) buy_light();
    	};

    	const sell_light = () => {
    		if (total_orbs <= 1) return;
    		set_store_value(mana, $mana += Math.floor($light_orb.cost / 2.2), $mana);
    		light_orb.update(v => (v.cost -= 1, v.amount--, v));
    	};

    	//#endregion
    	//#region | Homing Orb
    	const buy_homing = () => {
    		if ($mana < $homing_orb.cost) return;
    		set_store_value(mana, $mana -= $homing_orb.cost, $mana);
    		homing_orb.update(v => (v.cost += 5, v.amount++, v));
    		if ($shifting) buy_homing();
    	};

    	const sell_homing = () => {
    		if (total_orbs <= 1) return;
    		set_store_value(mana, $mana += Math.floor($homing_orb.cost / 2.2), $mana);
    		homing_orb.update(v => (v.cost -= 5, v.amount--, v));
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Lab> was created with unknown prop '${key}'`);
    	});

    	function button_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			fight_btn = $$value;
    			(((($$invalidate(0, fight_btn), $$invalidate(17, $cash)), $$invalidate(5, $fight_cost)), $$invalidate(18, $fighting)), $$invalidate(6, $next_tower_lvl));
    		});
    	}

    	const click_handler = () => set_store_value(next_tower_lvl, $next_tower_lvl += 10, $next_tower_lvl);

    	$$self.$capture_state = () => ({
    		sci,
    		canvas_toggled,
    		fighting,
    		mana,
    		cash,
    		fight_cost,
    		tmk: total_monster_killed,
    		basic_orb,
    		light_orb,
    		homing_orb,
    		trades,
    		prestige,
    		rarities,
    		unlocked_fighting,
    		got_mana,
    		next_tower_lvl,
    		shifting,
    		Artifacts,
    		fight_btn,
    		hover_fight,
    		total_orbs,
    		buy_basic,
    		sell_basic,
    		buy_light,
    		sell_light,
    		buy_homing,
    		sell_homing,
    		$homing_orb,
    		$mana,
    		$shifting,
    		$light_orb,
    		$basic_orb,
    		$cash,
    		$fighting,
    		$canvas_toggled,
    		$fight_cost,
    		$next_tower_lvl,
    		$got_mana,
    		$unlocked_fighting,
    		$prestige,
    		$rarities
    	});

    	$$self.$inject_state = $$props => {
    		if ('fight_btn' in $$props) $$invalidate(0, fight_btn = $$props.fight_btn);
    		if ('hover_fight' in $$props) hover_fight = $$props.hover_fight;
    		if ('total_orbs' in $$props) total_orbs = $$props.total_orbs;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$unlocked_fighting, $prestige*/ 768) {
    			if (!$unlocked_fighting && $prestige.times >= 5) set_store_value(unlocked_fighting, $unlocked_fighting = true, $unlocked_fighting);
    		}

    		if ($$self.$$.dirty & /*$got_mana, $mana*/ 132) {
    			if (!$got_mana && $mana > 0) set_store_value(got_mana, $got_mana = true, $got_mana);
    		}

    		if ($$self.$$.dirty & /*$next_tower_lvl*/ 64) {
    			{
    				const L = $next_tower_lvl - 1;
    				const t = Math.floor(L / 5);

    				if (t < 20) {
    					rarities.update(v => (v.c = 100 - t * 5, v.u = t * 4, v.r = t, v));
    				} else if (t < 40) {
    					rarities.update(v => (v.c = 0, v.u = 95 - (t - 20) * 5, v.r = 5 + (t - 20) * 4, v.l = t - 20, v));
    				} else if (t < 120) {
    					rarities.update(v => (v.c = 0, v.u = 0, v.r = 80 - (t - 40), v.l = 20 + (t - 40), v));
    				} else {
    					rarities.update(v => (v.c = 0, v.u = 0, v.r = 0, v.l = 100, v));
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*$next_tower_lvl*/ 64) {
    			set_store_value(fight_cost, $fight_cost = 1e3 * (1 + 1.2 * ($next_tower_lvl - 1)), $fight_cost);
    		}

    		if ($$self.$$.dirty & /*fight_btn, $cash, $fight_cost, $fighting*/ 393249) {
    			{
    				if (fight_btn != undefined) {
    					$$invalidate(
    						0,
    						fight_btn.onclick = () => {
    							if ($cash < $fight_cost || $fighting) return;
    							set_store_value(cash, $cash -= $fight_cost, $cash);
    							set_store_value(canvas_toggled, $canvas_toggled = true, $canvas_toggled);
    							set_store_value(fighting, $fighting = true, $fighting);
    						},
    						fight_btn
    					);

    					$$invalidate(0, fight_btn.onmouseenter = () => hover_fight = true, fight_btn);
    					$$invalidate(0, fight_btn.onmouseleave = () => hover_fight = false, fight_btn);
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*$fighting, fight_btn*/ 262145) {
    			if ($fighting && fight_btn != undefined) $$invalidate(0, fight_btn.disabled = true, fight_btn);
    		}

    		if ($$self.$$.dirty & /*$fighting, fight_btn*/ 262145) {
    			if (!$fighting && fight_btn != undefined) $$invalidate(0, fight_btn.disabled = false, fight_btn);
    		}

    		if ($$self.$$.dirty & /*$basic_orb, $light_orb, $homing_orb*/ 26) {
    			total_orbs = $basic_orb.amount + $light_orb.amount + $homing_orb.amount;
    		}
    	};

    	return [
    		fight_btn,
    		$homing_orb,
    		$mana,
    		$light_orb,
    		$basic_orb,
    		$fight_cost,
    		$next_tower_lvl,
    		$got_mana,
    		$unlocked_fighting,
    		$prestige,
    		$rarities,
    		buy_basic,
    		sell_basic,
    		buy_light,
    		sell_light,
    		buy_homing,
    		sell_homing,
    		$cash,
    		$fighting,
    		button_binding,
    		click_handler
    	];
    }

    class Lab extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Lab",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/Main.svelte generated by Svelte v3.46.4 */
    const file$1 = "src/components/Main.svelte";

    function create_fragment$1(ctx) {
    	let main;
    	let shop;
    	let t0;
    	let lab;
    	let t1;
    	let img;
    	let img_src_value;
    	let current;
    	shop = new Shop({ $$inline: true });
    	lab = new Lab({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(shop.$$.fragment);
    			t0 = space();
    			create_component(lab.$$.fragment);
    			t1 = space();
    			img = element("img");
    			attr_dev(img, "id", "settings");
    			if (!src_url_equal(img.src, img_src_value = "./assets/settings.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Settings");
    			attr_dev(img, "class", "svelte-1skdxqn");
    			add_location(img, file$1, 8, 1, 113);
    			attr_dev(main, "class", "svelte-1skdxqn");
    			add_location(main, file$1, 5, 0, 88);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(shop, main, null);
    			append_dev(main, t0);
    			mount_component(lab, main, null);
    			append_dev(main, t1);
    			append_dev(main, img);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shop.$$.fragment, local);
    			transition_in(lab.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shop.$$.fragment, local);
    			transition_out(lab.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(shop);
    			destroy_component(lab);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Main', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Main> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Shop, Lab });
    	return [];
    }

    class Main extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Main",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.46.4 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main1;
    	let main0;
    	let t;
    	let canvas;
    	let current;
    	main0 = new Main({ $$inline: true });
    	canvas = new Canvas({ $$inline: true });

    	const block = {
    		c: function create() {
    			main1 = element("main");
    			create_component(main0.$$.fragment);
    			t = space();
    			create_component(canvas.$$.fragment);
    			attr_dev(main1, "class", "svelte-yl16dy");
    			add_location(main1, file, 10, 0, 322);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main1, anchor);
    			mount_component(main0, main1, null);
    			append_dev(main1, t);
    			mount_component(canvas, main1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(main0.$$.fragment, local);
    			transition_in(canvas.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(main0.$$.fragment, local);
    			transition_out(canvas.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main1);
    			destroy_component(main0);
    			destroy_component(canvas);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $prestige;
    	let $orb_bonus;
    	validate_store(prestige, 'prestige');
    	component_subscribe($$self, prestige, $$value => $$invalidate(0, $prestige = $$value));
    	validate_store(orb_bonus, 'orb_bonus');
    	component_subscribe($$self, orb_bonus, $$value => $$invalidate(1, $orb_bonus = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Canvas,
    		Main,
    		timer,
    		cash,
    		bounce_size,
    		bounce_area_cost,
    		collector_pos,
    		auto_bounce,
    		prestige,
    		orb_bonus,
    		$prestige,
    		$orb_bonus
    	});

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$prestige*/ 1) {
    			set_store_value(orb_bonus, $orb_bonus = 1 + $prestige.times * 0.5, $orb_bonus);
    		}
    	};

    	return [$prestige];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: { }
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
