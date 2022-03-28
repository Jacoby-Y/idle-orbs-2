
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
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
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
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
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
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
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

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
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
    const timer = writable(0);
    let ticks = 0; timer.subscribe( v => ticks = v );
    setInterval(() => {
    	if (ticks < 29) timer.update( v => v+1 );
    	else timer.set(0);
    }, 1000/30);
    //#endregion
    //#region | Cash
    let deci = 0;
    const cash = w("cash", 0);
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
    const collector_pos = writable(250);
    const bounce = w("bounce", {
    	power: 30,
    	power_cost: 250,
    	size: 75,
    	size_cost: 500,
    	auto_cost: 350,
    	auto_unlocked: false,
    	auto_on: true,
    });
    const starting_cash = w("starting_cash", {
    	cost: 25,
    	amount: 0,
    });
    const orb_double = w("orb_double", {
    	cost: 50,
    	value: 0,
    });
    //#endregion
    //#region | Orbs
    const basic_orb = w("basic_orb", { //-! DEBUG
    	amount: 1,
    	cost: 50,
    	value: 1
    });
    const light_orb = w("light_orb", {
    	amount: 0,
    	cost: 1,
    	value: 1
    });
    const homing_orb = w("homing_orb", {
    	amount: 0,
    	cost: 3,
    	value: 0.5,
    });
    const spore_orb = w("spore_orb", {
    	amount: 0,
    	cost: 3,
    	value: 1,
    	sub_value: 0.2,
    });
    //#endregion
    //#region | Prestige
    const prestige = w("prestige", {
    	cost: 1e4,
    	times: 0,
    });
    //#endregion
    //#region | Fighting
    const next_tower_lvl = w("next_tower_lvl", 1);
    const fight_cost = w("fight_cost", 1e3);
    const unlocked_fighting = writable(false);
    const fighting = writable(false);
    const afford_fight = writable(()=> false );
    const auto_fight = writable(false);
    const rarities = writable({
    	c: 100, u: 0, r: 0, l: 0
    });
    //#endregion
    //#region | Mana
    const got_mana = w("got_mana", false);
    const mana = w("mana", 0);
    //#endregion

    const canvas_toggled = writable(true);
    const shifting = writable(false);

    const render_mode = w("render_mode", 0);

    const clear_storage = ()=>{
    	window.onbeforeunload = null;
    	localStorage.clear();
    	location.reload();
    };

    const chars = ` "'01{23}45(67)89:ab_cd,ef.ghijklmnopqrstyuvwxyzACBDEFGHIJKLMNOPQRSTYUVWXYZ`;

    const get_data = ()=>{
    	const str = JSON.stringify(get_store_obj()).split("");
    	let build = "";
    	for (let i = 0; i < str.length; i++) {
    		const ch = str[i];
    		if (!chars.includes(ch)) { 
    			console.error(`Character list doesn't have: "${ch}"`);
    			return "Error";
    		}
    		const index = chars.indexOf(ch);
    		build += chars.at(index-2);
    	}
    	return build;
    };
    const load_data = (load)=>{
    	const str = load.split("");
    	let build = "";
    	for (let i = 0; i < str.length; i++) {
    		const ch = str[i];
    		const index = chars.indexOf(ch);
    		build += chars.at((index+2)%chars.length);
    	}
    	try {
    		const built = JSON.parse(build);
    		for (const k in built) {
    			if (Object.hasOwnProperty.call(built, k)) {
    				const v = built[k];
    				writables[k].set(v);
    			}
    		}
    	} catch (err) {
    		console.error(`Couldn't Load Data!\n${err}`);
    	}
    };

    const unload_time = w("unload_time", Math.floor(Date.now()/1000));
    const load_time = writable(Math.floor(Date.now()/1000));
    const offline_time = writable(get_store_value(load_time) - get_store_value(unload_time));

    const get_store_obj = ()=>{
    	let store_obj = {};
    	store_keys.forEach((k)=> store_obj[k] = get_store_value(writables[k]) );
    	return store_obj;
    };

    window.onbeforeunload = ()=>{
    	unload_time.set(Math.floor(Date.now()/1000));
    	localStorage.IdleOrbs2 = JSON.stringify(get_store_obj());
    };

    const manager = {
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
    const small_explosion = (ctx, pos=[0,0])=>{
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
    const big_explosion = (ctx, pos=[0,0])=>{
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
    						ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, 2 * Math.PI); ctx.fill(); 
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

    /** @param {Number} num */
    const exp = (pow=1)=> (10 ** pow);
    const round = (num, pow=1)=> Math.round(num * exp(pow))/exp(pow);
    const toExp = (num, place)=>{
      let pow = Math.floor(Math.log10(num));
    	place = 10**place;
      return (Math.floor(num/(10**pow)*place)/place + `e${pow}`);
    };
    const sci = (num, place=1)=> num >= 1000 ? toExp(num, place).replace("+", "") : round(num);
    const floor_round = (num, place)=>{
      const pow = (Math.pow(10, place));
      return Math.floor(num * pow) / pow;
    };
    const num_shorts = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'O', 'N', 'D', 'UD', 'DD', 'TD', 'QuD', 'QiD', 'SxD', 'SpD', 'OD', 'ND', 'V', 'UV', 'DV', 'TV', 'QaV', 'QiV', 'SxV', 'SpV', 'OV', 'NV', 'T', 'UT', 'DT', 'TT', 'QaT', 'QiT', 'SxT', 'SpT', 'OT', 'NT'];
    const format_num = (num, round_to=1, i=0, past_thresh=false)=>{
        const div = num / 1000;
        const thresh = (i >= num_shorts.length);
        if (div < 1 || thresh) { 
          if (thresh) return (floor_round(num, round_to) + num_shorts[num_shorts.length-1]);
          else return (i == 0) ? (floor_round(num, round_to)) : (floor_round(num, round_to) + num_shorts[i]);
        }
        return format_num(div, round_to, i+1, thresh);
    };

    /* src/components/Canvas.svelte generated by Svelte v3.46.4 */

    const { console: console_1 } = globals;
    const file$6 = "src/components/Canvas.svelte";

    // (983:2) {#if debug}
    function create_if_block_3$1(ctx) {
    	let t0;
    	let t1_value = format_num(/*cps*/ ctx[8]) + "";
    	let t1;
    	let t2;
    	let br0;
    	let t3;
    	let t4_value = format_num(/*calc_cps*/ ctx[5]) + "";
    	let t4;
    	let t5;
    	let br1;
    	let t6;
    	let t7;
    	let t8;
    	let br2;
    	let t9;
    	let t10_value = format_num(/*total_orbs*/ ctx[11]) + "";
    	let t10;
    	let t11;
    	let br3;

    	const block = {
    		c: function create() {
    			t0 = text("$/sec: ");
    			t1 = text(t1_value);
    			t2 = space();
    			br0 = element("br");
    			t3 = text(" \n\t\t\tCalc $/sec: ");
    			t4 = text(t4_value);
    			t5 = space();
    			br1 = element("br");
    			t6 = text(" \n\t\t\tFPS: ");
    			t7 = text(/*fps*/ ctx[9]);
    			t8 = space();
    			br2 = element("br");
    			t9 = text(" \n\t\t\tTotal Orbs: ");
    			t10 = text(t10_value);
    			t11 = space();
    			br3 = element("br");
    			add_location(br0, file$6, 983, 28, 29650);
    			add_location(br1, file$6, 984, 38, 29694);
    			add_location(br2, file$6, 985, 14, 29714);
    			add_location(br3, file$6, 986, 40, 29760);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, br3, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*cps*/ 256 && t1_value !== (t1_value = format_num(/*cps*/ ctx[8]) + "")) set_data_dev(t1, t1_value);
    			if (dirty[0] & /*calc_cps*/ 32 && t4_value !== (t4_value = format_num(/*calc_cps*/ ctx[5]) + "")) set_data_dev(t4, t4_value);
    			if (dirty[0] & /*fps*/ 512) set_data_dev(t7, /*fps*/ ctx[9]);
    			if (dirty[0] & /*total_orbs*/ 2048 && t10_value !== (t10_value = format_num(/*total_orbs*/ ctx[11]) + "")) set_data_dev(t10, t10_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(br3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(983:2) {#if debug}",
    		ctx
    	});

    	return block;
    }

    // (990:1) {#if $bounce.auto_unlocked}
    function create_if_block_2$1(ctx) {
    	let h3;
    	let t0;
    	let t1_value = (/*$bounce*/ ctx[3].auto_on ? "off" : "on") + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = text("Press \"Tab\" to turn ");
    			t1 = text(t1_value);
    			t2 = text(" auto bounce");
    			attr_dev(h3, "id", "toggle-bounce");
    			set_style(h3, "bottom", /*$bounce*/ ctx[3].size + "px");
    			attr_dev(h3, "class", "svelte-1u01kmx");
    			add_location(h3, file$6, 990, 2, 29898);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t0);
    			append_dev(h3, t1);
    			append_dev(h3, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$bounce*/ 8 && t1_value !== (t1_value = (/*$bounce*/ ctx[3].auto_on ? "off" : "on") + "")) set_data_dev(t1, t1_value);

    			if (dirty[0] & /*$bounce*/ 8) {
    				set_style(h3, "bottom", /*$bounce*/ ctx[3].size + "px");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(990:1) {#if $bounce.auto_unlocked}",
    		ctx
    	});

    	return block;
    }

    // (993:1) {#if $fighting}
    function create_if_block_1$2(ctx) {
    	let button;
    	let t1;
    	let div;
    	let h30;
    	let t2;
    	let t3;
    	let t4;
    	let h31;
    	let t5_value = /*monster_manager*/ ctx[10].name + "";
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
    			t3 = text(/*$next_tower_lvl*/ ctx[14]);
    			t4 = space();
    			h31 = element("h3");
    			t5 = text(t5_value);
    			t6 = space();
    			img = element("img");
    			attr_dev(button, "id", "quit");
    			attr_dev(button, "class", "svelte-1u01kmx");
    			add_location(button, file$6, 993, 2, 30053);
    			attr_dev(h30, "id", "lvl");
    			attr_dev(h30, "class", "svelte-1u01kmx");
    			add_location(h30, file$6, 1001, 3, 30383);
    			attr_dev(h31, "id", "name");
    			attr_dev(h31, "class", "svelte-1u01kmx");
    			add_location(h31, file$6, 1002, 3, 30443);
    			if (!src_url_equal(img.src, img_src_value = /*monster_manager*/ ctx[10].src)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "monster Icon");
    			set_style(img, "width", (/*monster_manager*/ ctx[10].pt2.y - /*monster_manager*/ ctx[10].pt1.y) / 2 + "px");
    			set_style(img, "height", (/*monster_manager*/ ctx[10].pt2.y - /*monster_manager*/ ctx[10].pt1.y) / 2 + "px");
    			attr_dev(img, "class", "svelte-1u01kmx");
    			add_location(img, file$6, 1003, 3, 30488);
    			attr_dev(div, "id", "monster-info");
    			set_style(div, "left", /*monster_manager*/ ctx[10].pt1.x + "px");
    			set_style(div, "top", /*monster_manager*/ ctx[10].pt1.y + "px");
    			set_style(div, "width", /*monster_manager*/ ctx[10].pt2.x - /*monster_manager*/ ctx[10].pt1.x + "px");
    			set_style(div, "height", /*monster_manager*/ ctx[10].pt2.y - /*monster_manager*/ ctx[10].pt1.y + "px");
    			attr_dev(div, "class", "svelte-1u01kmx");
    			add_location(div, file$6, 994, 2, 30145);
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
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[23], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$next_tower_lvl*/ 16384) set_data_dev(t3, /*$next_tower_lvl*/ ctx[14]);
    			if (dirty[0] & /*monster_manager*/ 1024 && t5_value !== (t5_value = /*monster_manager*/ ctx[10].name + "")) set_data_dev(t5, t5_value);

    			if (dirty[0] & /*monster_manager*/ 1024 && !src_url_equal(img.src, img_src_value = /*monster_manager*/ ctx[10].src)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty[0] & /*monster_manager*/ 1024) {
    				set_style(img, "width", (/*monster_manager*/ ctx[10].pt2.y - /*monster_manager*/ ctx[10].pt1.y) / 2 + "px");
    			}

    			if (dirty[0] & /*monster_manager*/ 1024) {
    				set_style(img, "height", (/*monster_manager*/ ctx[10].pt2.y - /*monster_manager*/ ctx[10].pt1.y) / 2 + "px");
    			}

    			if (dirty[0] & /*monster_manager*/ 1024) {
    				set_style(div, "left", /*monster_manager*/ ctx[10].pt1.x + "px");
    			}

    			if (dirty[0] & /*monster_manager*/ 1024) {
    				set_style(div, "top", /*monster_manager*/ ctx[10].pt1.y + "px");
    			}

    			if (dirty[0] & /*monster_manager*/ 1024) {
    				set_style(div, "width", /*monster_manager*/ ctx[10].pt2.x - /*monster_manager*/ ctx[10].pt1.x + "px");
    			}

    			if (dirty[0] & /*monster_manager*/ 1024) {
    				set_style(div, "height", /*monster_manager*/ ctx[10].pt2.y - /*monster_manager*/ ctx[10].pt1.y + "px");
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
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(993:1) {#if $fighting}",
    		ctx
    	});

    	return block;
    }

    // (1007:1) {#if show_earnings}
    function create_if_block$2(ctx) {
    	let div;
    	let h3;
    	let t0;
    	let t1_value = format_num(/*offline_gain*/ ctx[6]) + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			t0 = text("You got $");
    			t1 = text(t1_value);
    			t2 = text(" while offline");
    			attr_dev(h3, "class", "svelte-1u01kmx");
    			add_location(h3, file$6, 1008, 3, 30770);
    			attr_dev(div, "id", "offline");
    			attr_dev(div, "class", "svelte-1u01kmx");
    			add_location(div, file$6, 1007, 2, 30709);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(h3, t0);
    			append_dev(h3, t1);
    			append_dev(h3, t2);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler_1*/ ctx[24], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*offline_gain*/ 64 && t1_value !== (t1_value = format_num(/*offline_gain*/ ctx[6]) + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(1007:1) {#if show_earnings}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let main_1;
    	let canvas_1;
    	let t0;
    	let h30;
    	let t1;
    	let t2_value = sci(/*$cash*/ ctx[15]) + "";
    	let t2;
    	let t3;
    	let br;
    	let t4;
    	let h30_style_value;
    	let t5;
    	let h31;
    	let t6;
    	let t7;
    	let t8;
    	let t9;
    	let if_block0 = /*debug*/ ctx[12] && create_if_block_3$1(ctx);
    	let if_block1 = /*$bounce*/ ctx[3].auto_unlocked && create_if_block_2$1(ctx);
    	let if_block2 = /*$fighting*/ ctx[2] && create_if_block_1$2(ctx);
    	let if_block3 = /*show_earnings*/ ctx[7] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			main_1 = element("main");
    			canvas_1 = element("canvas");
    			t0 = space();
    			h30 = element("h3");
    			t1 = text("Cash: ");
    			t2 = text(t2_value);
    			t3 = space();
    			br = element("br");
    			t4 = space();
    			if (if_block0) if_block0.c();
    			t5 = space();
    			h31 = element("h3");
    			t6 = text("Press \"Esc\" to toggle shop");
    			t7 = space();
    			if (if_block1) if_block1.c();
    			t8 = space();
    			if (if_block2) if_block2.c();
    			t9 = space();
    			if (if_block3) if_block3.c();
    			attr_dev(canvas_1, "class", "svelte-1u01kmx");
    			add_location(canvas_1, file$6, 978, 1, 29471);
    			add_location(br, file$6, 981, 21, 29601);
    			attr_dev(h30, "id", "cash");
    			attr_dev(h30, "style", h30_style_value = /*debug*/ ctx[12] ? "background-color: #000000bb;" : "");
    			attr_dev(h30, "class", "svelte-1u01kmx");
    			add_location(h30, file$6, 980, 1, 29511);
    			attr_dev(h31, "id", "toggle-txt");
    			set_style(h31, "bottom", /*$bounce*/ ctx[3].size + "px");
    			attr_dev(h31, "class", "svelte-1u01kmx");
    			add_location(h31, file$6, 988, 1, 29781);
    			set_style(main_1, "opacity", /*$toggled*/ ctx[4] ? "1" : "0");
    			set_style(main_1, "pointer-events", /*$toggled*/ ctx[4] ? "all" : "none");
    			attr_dev(main_1, "class", "svelte-1u01kmx");
    			add_location(main_1, file$6, 977, 0, 29360);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main_1, anchor);
    			append_dev(main_1, canvas_1);
    			/*canvas_1_binding*/ ctx[22](canvas_1);
    			append_dev(main_1, t0);
    			append_dev(main_1, h30);
    			append_dev(h30, t1);
    			append_dev(h30, t2);
    			append_dev(h30, t3);
    			append_dev(h30, br);
    			append_dev(h30, t4);
    			if (if_block0) if_block0.m(h30, null);
    			append_dev(main_1, t5);
    			append_dev(main_1, h31);
    			append_dev(h31, t6);
    			append_dev(main_1, t7);
    			if (if_block1) if_block1.m(main_1, null);
    			append_dev(main_1, t8);
    			if (if_block2) if_block2.m(main_1, null);
    			append_dev(main_1, t9);
    			if (if_block3) if_block3.m(main_1, null);
    			/*main_1_binding*/ ctx[25](main_1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$cash*/ 32768 && t2_value !== (t2_value = sci(/*$cash*/ ctx[15]) + "")) set_data_dev(t2, t2_value);

    			if (/*debug*/ ctx[12]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3$1(ctx);
    					if_block0.c();
    					if_block0.m(h30, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty[0] & /*debug*/ 4096 && h30_style_value !== (h30_style_value = /*debug*/ ctx[12] ? "background-color: #000000bb;" : "")) {
    				attr_dev(h30, "style", h30_style_value);
    			}

    			if (dirty[0] & /*$bounce*/ 8) {
    				set_style(h31, "bottom", /*$bounce*/ ctx[3].size + "px");
    			}

    			if (/*$bounce*/ ctx[3].auto_unlocked) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2$1(ctx);
    					if_block1.c();
    					if_block1.m(main_1, t8);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*$fighting*/ ctx[2]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_1$2(ctx);
    					if_block2.c();
    					if_block2.m(main_1, t9);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*show_earnings*/ ctx[7]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block$2(ctx);
    					if_block3.c();
    					if_block3.m(main_1, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
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
    			/*canvas_1_binding*/ ctx[22](null);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			/*main_1_binding*/ ctx[25](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const background_color = "#3c5b5f";

    function instance$6($$self, $$props, $$invalidate) {
    	let $spore_orb;
    	let $homing_orb;
    	let $light_orb;
    	let $basic_orb;
    	let $fighting;
    	let $auto_fight;
    	let $afford_fight;
    	let $next_tower_lvl;
    	let $mana;
    	let $rarities;
    	let $bounce;
    	let $toggled;
    	let $shifting;
    	let $cash;
    	let $render_mode;
    	let $offline_time;
    	let $collector_pos;
    	let $timer;
    	let $prestige;
    	let $orb_double;
    	validate_store(spore_orb, 'spore_orb');
    	component_subscribe($$self, spore_orb, $$value => $$invalidate(16, $spore_orb = $$value));
    	validate_store(homing_orb, 'homing_orb');
    	component_subscribe($$self, homing_orb, $$value => $$invalidate(17, $homing_orb = $$value));
    	validate_store(light_orb, 'light_orb');
    	component_subscribe($$self, light_orb, $$value => $$invalidate(18, $light_orb = $$value));
    	validate_store(basic_orb, 'basic_orb');
    	component_subscribe($$self, basic_orb, $$value => $$invalidate(19, $basic_orb = $$value));
    	validate_store(fighting, 'fighting');
    	component_subscribe($$self, fighting, $$value => $$invalidate(2, $fighting = $$value));
    	validate_store(auto_fight, 'auto_fight');
    	component_subscribe($$self, auto_fight, $$value => $$invalidate(13, $auto_fight = $$value));
    	validate_store(afford_fight, 'afford_fight');
    	component_subscribe($$self, afford_fight, $$value => $$invalidate(41, $afford_fight = $$value));
    	validate_store(next_tower_lvl, 'next_tower_lvl');
    	component_subscribe($$self, next_tower_lvl, $$value => $$invalidate(14, $next_tower_lvl = $$value));
    	validate_store(mana, 'mana');
    	component_subscribe($$self, mana, $$value => $$invalidate(42, $mana = $$value));
    	validate_store(rarities, 'rarities');
    	component_subscribe($$self, rarities, $$value => $$invalidate(43, $rarities = $$value));
    	validate_store(bounce, 'bounce');
    	component_subscribe($$self, bounce, $$value => $$invalidate(3, $bounce = $$value));
    	validate_store(canvas_toggled, 'toggled');
    	component_subscribe($$self, canvas_toggled, $$value => $$invalidate(4, $toggled = $$value));
    	validate_store(shifting, 'shifting');
    	component_subscribe($$self, shifting, $$value => $$invalidate(44, $shifting = $$value));
    	validate_store(cash, 'cash');
    	component_subscribe($$self, cash, $$value => $$invalidate(15, $cash = $$value));
    	validate_store(render_mode, 'render_mode');
    	component_subscribe($$self, render_mode, $$value => $$invalidate(45, $render_mode = $$value));
    	validate_store(offline_time, 'offline_time');
    	component_subscribe($$self, offline_time, $$value => $$invalidate(46, $offline_time = $$value));
    	validate_store(collector_pos, 'collector_pos');
    	component_subscribe($$self, collector_pos, $$value => $$invalidate(47, $collector_pos = $$value));
    	validate_store(timer, 'timer');
    	component_subscribe($$self, timer, $$value => $$invalidate(48, $timer = $$value));
    	validate_store(prestige, 'prestige');
    	component_subscribe($$self, prestige, $$value => $$invalidate(20, $prestige = $$value));
    	validate_store(orb_double, 'orb_double');
    	component_subscribe($$self, orb_double, $$value => $$invalidate(21, $orb_double = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Canvas', slots, []);

    	const set_orbs = () => {
    		orbs.free_all();

    		for (let i = 0; i < $basic_orb.amount; i++) {
    			orbs.new.basic(Math.round(Math.random() * 1000), 580, 0, 0);
    		}

    		for (let i = 0; i < $light_orb.amount; i++) {
    			orbs.new.light(Math.round(Math.random() * 1000), 580, 0, 0);
    		}

    		for (let i = 0; i < $homing_orb.amount; i++) {
    			orbs.new.homing(Math.round(Math.random() * 1000), 580, 0, 0);
    		}

    		for (let i = 0; i < $spore_orb.amount; i++) {
    			orbs.new.spore(Math.round(Math.random() * 1000), 580, 0, 0);
    		}

    		basic_orb.set($basic_orb);
    	};

    	//#endregion
    	//#region | Canvas
    	let main;

    	/** @type {HTMLCanvasElement} */
    	let canvas;

    	/** @type {CanvasRenderingContext2D} */
    	let ctx;

    	let pause = false;
    	let step = false;

    	// $: console.log(`Fighting: ${$fighting} | Pause: ${pause}`);
    	let w, h;

    	//#endregion
    	//#region | Orbs
    	//#region | Functions for Orbs
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

    	//#endregion
    	const orbs = (() => {
    		const basic = { l: [], max: 100, over: 0 };
    		const light = { l: [], max: 100, over: 0 };
    		const homing = { l: [], max: 100, over: 0 };
    		const spore = { l: [], max: 100, over: 0 };
    		const sub_spore = { l: [], max: 100, over: 0, life_span: 100 };
    		const shadow = { l: [], max: 100, over: 0, life_span: 100 };
    		let cash_hold = 0;

    		const push_to = (orb, pos1, pos2, mult) => {
    			const ang = Math.atan2(pos1.y - 10 - pos2.y, pos1.x - 10 - pos2.x);
    			orb.vx += Math.cos(ang) * mult;
    			orb.vy += Math.sin(ang) * mult;
    		};

    		const collide_monster = orb => {
    			// c1 = 400, 200 / c2 = 600, 300
    			const pt1 = monster_manager.pt1;

    			const pt2 = monster_manager.pt2;

    			if (orb.y >= pt1.y - 20 && orb.y <= pt2.y) {
    				// console.log("in horz area");
    				if (orb.lx + 20 < pt1.x && orb.x + 20 >= pt1.x) {
    					orb.vx = Math.abs(orb.vx) * -1;
    					orb.x = pt1.x - 21;
    					return true;
    				} else if (orb.lx > pt2.x && orb.x <= pt2.x) {
    					orb.vx = Math.abs(orb.vx);
    					orb.x = pt2.x + 1;
    					return true;
    				}
    			}

    			if (orb.x >= pt1.x - 20 && orb.x <= pt2.x) {
    				// console.log("in vert area");
    				if (orb.ly + 20 < pt1.y && orb.y + 20 >= pt1.y) {
    					orb.vy = Math.abs(orb.vy) * -1;
    					orb.y = pt1.y - 21;
    					if (Math.abs(orb.vx) < 0.1) orb.vx = 1;
    					orb.vx *= 1.5;
    					return true;
    				} else if (orb.ly > pt2.y && orb.y <= pt2.y) {
    					orb.vy = Math.abs(orb.vy);
    					orb.y = pt2.y + 1;
    					return true;
    				}
    			}

    			return false;
    		};

    		return {
    			new: {
    				basic(x, y, vx, vy) {
    					if (basic.l.length >= basic.max) {
    						basic.over++;
    						return;
    					} else basic.over = 0;

    					basic.l.push({
    						x,
    						y,
    						vx,
    						vy,
    						lx: x,
    						ly: y,
    						grounded: false
    					});
    				},
    				light(x, y, vx, vy) {
    					if (light.l.length >= light.max) {
    						light.over++;
    						return;
    					} else light.over = 0;

    					light.l.push({
    						x,
    						y,
    						vx,
    						vy,
    						lx: x,
    						ly: y,
    						grounded: false
    					});
    				},
    				homing(x, y, vx, vy) {
    					if (homing.l.length >= homing.max) {
    						homing.over++;
    						return;
    					} else homing.over = 0;

    					homing.l.push({
    						x,
    						y,
    						vx,
    						vy,
    						lx: x,
    						ly: y,
    						grounded: false,
    						index: homing.l.length
    					});
    				},
    				spore(x, y, vx, vy) {
    					if (spore.l.length >= spore.max) {
    						spore.over++;
    						return;
    					} else spore.over = 0;

    					spore.l.push({
    						x,
    						y,
    						vx,
    						vy,
    						lx: x,
    						ly: y,
    						grounded: false
    					});
    				},
    				sub_spore(x, y, vx, vy) {
    					if (sub_spore.l.length >= sub_spore.max) {
    						sub_spore.over++;
    						return;
    					} else sub_spore.over = 0;

    					sub_spore.l.push({
    						x,
    						y,
    						vx,
    						vy,
    						lx: x,
    						ly: y,
    						ticks: sub_spore.life_span + Math.floor(Math.random() * 10)
    					});
    				},
    				shadow(x, y, vx, vy) {
    					if (shadow.l.length >= shadow.max) {
    						shadow.over++;
    						return;
    					} else shadow.over = 0;

    					shadow.l.push({
    						x,
    						y,
    						vx,
    						vy,
    						lx: x,
    						ly: y,
    						ticks: shadow.life_span + Math.floor(Math.random() * 10)
    					});
    				}
    			},
    			free_all() {
    				basic.l = [];
    				basic.over = 0;
    				light.l = [];
    				light.over = 0;
    				homing.l = [];
    				homing.over = 0;
    				spore.l = [];
    				spore.over = 0;
    				sub_spore.l = [];
    				sub_spore.over = 0;
    				shadow.l = [];
    				shadow.over = 0;
    			},
    			update() {
    				const all = [].concat(basic.l).concat(light.l).concat(homing.l).concat(spore.l).concat(sub_spore.l).concat(shadow.l); //...

    				for (let i = 0; i < basic.l.length; i++) {
    					const orb = basic.l[i];
    					ctx.fillStyle = "#e3ffcfdd";

    					switch ($render_mode) {
    						case 0:
    							ctx.fillRect(orb.x, orb.y, 20, 20);
    							break;
    						case 1:
    							ctx.beginPath();
    							ctx.arc(orb.x + 10, orb.y + 10, 10, 0, 2 * Math.PI);
    							ctx.fill();
    							break;
    						case 2:
    							ctx.fillRect(orb.x + 9, orb.y + 9, 2, 2);
    							break;
    						case 3:
    							let [x, y] = [Math.floor(orb.x / 20) * 20, Math.floor(orb.y / 20) * 20];
    							ctx.fillRect(x, y, 20, 20);
    							break;
    					}

    					orb.vx *= 0.98;
    					orb.vy *= 0.98;

    					if (!$fighting) {
    						if (orb.ly <= $collector_pos && orb.y > $collector_pos || orb.ly >= $collector_pos && orb.y < $collector_pos) {
    							cash_hold += this.value.basic; //$basic_orb.value + (($basic_orb.value * basic.over)/basic.l.length);
    						}
    					} else {
    						const hit = collide_monster(orb);
    						if (hit) monster_manager.hit(this.value.basic);
    					}
    				}

    				for (let i = 0; i < light.l.length; i++) {
    					const orb = light.l[i];
    					ctx.fillStyle = "#aae8e088";

    					switch ($render_mode) {
    						case 0:
    							ctx.fillRect(orb.x, orb.y, 20, 20);
    							ctx.fillRect(orb.x + 2, orb.y + 2, 16, 16);
    							ctx.fillRect(orb.x + 4, orb.y + 4, 12, 12);
    							ctx.fillRect(orb.x + 6, orb.y + 6, 8, 8);
    							break;
    						case 1:
    							ctx.beginPath();
    							ctx.arc(orb.x + 10, orb.y + 10, 10, 0, 2 * Math.PI);
    							ctx.fill();
    							ctx.beginPath();
    							ctx.arc(orb.x + 10, orb.y + 10, 8, 0, 2 * Math.PI);
    							ctx.fill();
    							ctx.beginPath();
    							ctx.arc(orb.x + 10, orb.y + 10, 6, 0, 2 * Math.PI);
    							ctx.fill();
    							ctx.beginPath();
    							ctx.arc(orb.x + 10, orb.y + 10, 4, 0, 2 * Math.PI);
    							ctx.fill();
    							break;
    						case 2:
    							ctx.fillRect(orb.x + 9, orb.y + 9, 2, 2);
    							break;
    						case 3:
    							let [x, y] = [Math.floor(orb.x / 20) * 20, Math.floor(orb.y / 20) * 20];
    							ctx.fillRect(x, y, 20, 20);
    							ctx.fillRect(x + 2, y + 2, 16, 16);
    							break;
    					}

    					orb.vx *= 0.99;
    					orb.vy *= 0.99;

    					if (!$fighting) {
    						if (orb.ly <= $collector_pos && orb.y > $collector_pos || orb.ly >= $collector_pos && orb.y < $collector_pos) {
    							cash_hold += this.value.light; //$light_orb.value + (($light_orb.value * light.over)/light.l.length);
    						}
    					} else {
    						const hit = collide_monster(orb);
    						if (hit) monster_manager.hit(this.value.light);
    					}
    				}

    				for (let i = 0; i < homing.l.length; i++) {
    					const orb = homing.l[i];

    					switch ($render_mode) {
    						case 0:
    							ctx.strokeStyle = "#c7fda533";
    							ctx.strokeRect(orb.x, orb.y, 20, 20);
    							ctx.fillStyle = "#73bd4599";
    							ctx.fillRect(orb.x + 7.5, orb.y + 5, 5, 10);
    							ctx.fillRect(orb.x + 5, orb.y + 7.5, 10, 5);
    							break;
    						case 1:
    							ctx.strokeStyle = "#c7fda533";
    							ctx.beginPath();
    							ctx.arc(orb.x + 10, orb.y + 10, 10, 0, 2 * Math.PI);
    							ctx.stroke();
    							ctx.fillStyle = "#73bd4599";
    							ctx.beginPath();
    							ctx.arc(orb.x + 10, orb.y + 10, 5, 0, 2 * Math.PI);
    							ctx.fill();
    							break;
    						case 2:
    							ctx.strokeStyle = "#c7fda533";
    							ctx.strokeRect(orb.x + 9, orb.y + 9, 2, 2);
    							break;
    						case 3:
    							let [x, y] = [Math.floor(orb.x / 20) * 20, Math.floor(orb.y / 20) * 20];
    							ctx.strokeStyle = "#c7fda533";
    							ctx.strokeRect(x, y, 20, 20);
    							ctx.fillStyle = "#73bd4599";
    							ctx.fillRect(x + 7.5, y + 5, 5, 10);
    							ctx.fillRect(x + 5, y + 7.5, 10, 5);
    							break;
    					}

    					orb.vx *= 0.9;
    					orb.vy *= 0.9;

    					if (mouse.hovering) {
    						const to_pos = { x: undefined, y: undefined };

    						if (orb.index % 2 == 0) {
    							(to_pos.x = Math.cos(6.242 / homing.l.length * orb.index + 6.282 * ($timer / 29)) * 100 + mouse.x, to_pos.y = Math.cos(6.242 / homing.l.length * orb.index + 6.282 * ($timer / 29)) * 100 + mouse.y);
    						} else {
    							(to_pos.x = Math.cos((6.282 / homing.l.length * orb.index + 6.282 * ($timer / 29)) % 6.282) * 50 + mouse.x, to_pos.y = Math.sin((6.282 / homing.l.length * orb.index + 6.282 * ($timer / 29)) % 6.282) * 50 + mouse.y);
    						}

    						push_to(orb, to_pos, orb, distance(orb, to_pos) < 200 ? 1.2 : 2);
    					}

    					if (!$fighting) {
    						if (orb.ly <= $collector_pos && orb.y > $collector_pos || orb.ly >= $collector_pos && orb.y < $collector_pos) {
    							cash_hold += this.value.homing; //$homing_orb.value + (($homing_orb.value * homing.over)/homing.l.length);
    						}
    					} else {
    						const hit = collide_monster(orb);
    						if (hit) monster_manager.hit(this.value.homing);
    					}
    				}

    				for (let i = 0; i < spore.l.length; i++) {
    					const orb = spore.l[i];
    					ctx.fillStyle = "#dfac33dd";

    					switch ($render_mode) {
    						case 0:
    							ctx.fillRect(orb.x + 2, orb.y, 20 - 4, 20);
    							ctx.fillRect(orb.x, orb.y + 2, 20, 20 - 4);
    							break;
    						case 1:
    							ctx.beginPath();
    							ctx.arc(orb.x + 10, orb.y + 10, 10, 0, 2 * Math.PI);
    							ctx.fill();
    							ctx.fillStyle = "#dfac33";
    							ctx.beginPath();
    							ctx.arc(orb.x + 10, orb.y + 10, 5, 0, 2 * Math.PI);
    							ctx.fill();
    							break;
    						case 2:
    							ctx.fillRect(orb.x + 9, orb.y + 9, 2, 2);
    							break;
    						case 3:
    							let [x, y] = [Math.floor(orb.x / 20) * 20, Math.floor(orb.y / 20) * 20];
    							ctx.fillRect(x, y, 20, 20);
    							ctx.fillRect(x + 2, y + 2, 16, 16);
    							break;
    					}

    					orb.vx *= 0.98;
    					orb.vy *= 0.98;

    					if (!$fighting) {
    						if (orb.ly <= $collector_pos && orb.y > $collector_pos || orb.ly >= $collector_pos && orb.y < $collector_pos) {
    							cash_hold += this.value.spore; //$spore_orb.value + (($spore_orb.value * spore.over)/spore.l.length);
    						}
    					} else {
    						const hit = collide_monster(orb);
    						if (hit) monster_manager.hit(this.value.spore);
    					}
    				}

    				for (let i = 0; i < sub_spore.l.length; i++) {
    					const orb = sub_spore.l[i];
    					if (orb == undefined) continue;
    					ctx.fillStyle = "#dfac33dd";

    					switch ($render_mode) {
    						case 0:
    							ctx.fillRect(orb.x, orb.y, 10, 10);
    							break;
    						case 1:
    							ctx.beginPath();
    							ctx.arc(orb.x + 5, orb.y + 5, 5, 0, 2 * Math.PI);
    							ctx.fill();
    							break;
    						case 2:
    							ctx.fillRect(orb.x + 4, orb.y + 4, 2, 2);
    							break;
    						case 3:
    							let [x, y] = [Math.floor(orb.x / 20) * 20, Math.floor(orb.y / 20) * 20];
    							ctx.fillRect(x + 5, y + 5, 10, 10);
    							break;
    					}

    					orb.vx *= 0.98;
    					orb.vy *= 0.98;

    					if (!$fighting) {
    						if (orb.ly <= $collector_pos && orb.y > $collector_pos || orb.ly >= $collector_pos && orb.y < $collector_pos) {
    							cash_hold += this.value.sub_spore; //$spore_orb.sub_value + (($spore_orb.sub_value * sub_spore.over)/sub_spore.l.length);
    						}
    					} else {
    						const hit = collide_monster(orb);
    						if (hit) monster_manager.hit(this.value.sub_spore);
    					}

    					orb.ticks--;

    					if (orb.ticks <= 0) {
    						sub_spore.l.splice(i, 1);
    						i--;
    					}
    				}

    				for (let i = 0; i < shadow.l.length; i++) {
    					const orb = shadow.l[i];
    					if (orb == undefined) continue;
    					ctx.fillStyle = "#00004455";

    					switch ($render_mode) {
    						case 0:
    							ctx.fillRect(orb.x, orb.y, 20, 20);
    							break;
    						case 1:
    							ctx.beginPath();
    							ctx.arc(orb.x + 10, orb.y + 10, 10, 0, 2 * Math.PI);
    							ctx.fill();
    							break;
    						case 2:
    							ctx.fillRect(orb.x + 9, orb.y + 9, 2, 2);
    							break;
    						case 3:
    							let [x, y] = [Math.floor(orb.x / 20) * 20, Math.floor(orb.y / 20) * 20];
    							ctx.fillRect(x, y, 20, 20);
    							break;
    					}

    					// orb.vx *= 0.99;
    					// orb.vy *= 0.99;
    					orb.vy--;

    					if (!$fighting) {
    						if (orb.ly <= $collector_pos && orb.y > $collector_pos || orb.ly >= $collector_pos && orb.y < $collector_pos) {
    							cash_hold += this.value.basic * 1; //($basic_orb.value*10) + ((($basic_orb.value*10) * basic.over)/basic.l.length);
    						}
    					}

    					orb.ticks--;

    					if (orb.ticks <= 0) {
    						shadow.l.splice(i, 1);
    						i--;
    					}
    				}

    				for (let i = 0; i < all.length; i++) {
    					const orb = all[i];
    					const is_homing = homing.l.includes(orb);
    					const is_spore = spore.l.includes(orb);
    					const is_sub_spore = sub_spore.l.includes(orb);
    					orb.lx = orb.x;
    					orb.ly = orb.y;
    					orb.x += orb.vx * 1.5;
    					orb.y += orb.vy * 1.5;

    					if (!orb.grounded || is_homing) {
    						if (!is_homing) orb.vy++;
    						const offset = is_sub_spore ? 10 : 20;
    						let collided = false;

    						if (orb.x < 0) {
    							collided = true;
    							orb.vx = Math.abs(orb.vx);
    							orb.x = 0;
    						} else if (orb.x > canvas.width - offset) {
    							collided = true;
    							orb.vx = Math.abs(orb.vx) * -1;
    							orb.x = canvas.width - offset;
    						}

    						if (orb.y < 0) {
    							collided = true;
    							orb.vy = Math.abs(orb.vy);
    							orb.y = 0;
    						} else if (orb.y > canvas.height - offset) {
    							collided = true;
    							orb.vy = Math.abs(orb.vy) * -1;
    							orb.y = canvas.height - offset;

    							if (!is_homing) {
    								orb.vy *= 0.75;
    								if (Math.abs(orb.vy) < 10) orb.vy++;

    								if (Math.abs(orb.vy) < 2) {
    									orb.vy = 0;
    									orb.vx = 0;
    									orb.y = canvas.height - offset;
    									orb.grounded = true;
    								}
    							}
    						}

    						if (collided && is_spore && (Math.abs(orb.vx) > 10 || Math.abs(orb.vy) > 10)) this.new.sub_spore(orb.x, orb.y, orb.vx * 2, orb.vy * 2);
    					} else continue;
    				}

    				if (cash_hold > 1) {
    					set_store_value(cash, $cash += Math.floor(cash_hold), $cash);
    					cash_hold -= Math.floor(cash_hold);
    				}
    			},
    			bounce(pos) {
    				if (pause) return;

    				for (let i = 0; i < basic.l.length; i++) {
    					const orb = basic.l[i];
    					if (orb.y < 600 - $bounce.size - 30) continue;
    					orb.vy -= $bounce.power + Math.random() * -5;
    					if (pos != null) orb.vx += (pos.x - 10 - orb.x) / 100 * (Math.random() * 0.5 + 0.5);
    					orb.grounded = false;
    				}

    				for (let i = 0; i < light.l.length; i++) {
    					const orb = light.l[i];
    					if (orb.y < 600 - $bounce.size - 30) continue;
    					if (orb.vy > 0) orb.vy = -1 * ($bounce.power - Math.random() * -5); else orb.vy -= $bounce.power + Math.random() * -5;
    					if (pos != null) orb.vx += (pos.x - 10 - orb.x) / 100 * (Math.random() * 0.5 + 0.5);
    					orb.grounded = false;
    				}

    				for (let i = 0; i < spore.l.length; i++) {
    					const orb = spore.l[i];
    					if (orb.y < 600 - $bounce.size - 30) continue;
    					orb.vy -= $bounce.power + Math.random() * -5;
    					if (pos != null) orb.vx += (pos.x - 10 - orb.x) / 100 * (Math.random() * 0.5 + 0.5);
    					orb.grounded = false;
    				}
    			},
    			get basic() {
    				return basic;
    			},
    			get light() {
    				return light;
    			},
    			get homing() {
    				return homing;
    			},
    			get spore() {
    				return spore;
    			},
    			get sub_spore() {
    				return sub_spore;
    			},
    			total: {
    				get basic() {
    					return basic.l.length + basic.over;
    				},
    				get light() {
    					return light.l.length + light.over;
    				},
    				get homing() {
    					return homing.l.length + homing.over;
    				},
    				get spore() {
    					return spore.l.length + spore.over;
    				},
    				get sub_spore() {
    					return sub_spore.l.length + sub_spore.over;
    				}
    			},
    			value: {
    				get basic() {
    					return $basic_orb.value + $basic_orb.value * basic.over / basic.l.length;
    				},
    				get light() {
    					return $light_orb.value + $light_orb.value * light.over / light.l.length;
    				},
    				get homing() {
    					return $homing_orb.value + $homing_orb.value * homing.over / homing.l.length;
    				},
    				get spore() {
    					return $spore_orb.value + $spore_orb.value * spore.over / spore.l.length;
    				},
    				get sub_spore() {
    					return $spore_orb.sub_value + $spore_orb.sub_value * spore.over / spore.l.length;
    				}
    			}
    		};
    	})();

    	//#endregion
    	//#region | Cash/Sec
    	let calc_cps = 0;

    	let first_cps_set = false;
    	let offline_get = false;
    	let offline_gain = 0;
    	let show_earnings = true;

    	const check_cps = () => {
    		if (offline_get) return;

    		if (!offline_get && first_cps_set) {
    			offline_get = true;
    			$$invalidate(6, offline_gain = calc_cps * $offline_time);
    			set_store_value(cash, $cash += offline_gain, $cash);
    		}

    		if (!first_cps_set) first_cps_set = true;
    	};

    	let cps = 0;
    	let last_cash = $cash;

    	timer.subscribe(v => {
    		if (v != 0 || pause) return;
    		$$invalidate(8, cps = $cash - last_cash);
    		last_cash = $cash;
    	});

    	//#endregion
    	//#region | onMount
    	let fps = 0;

    	let before_frame = Date.now();
    	let after_frame = Date.now();
    	let fps_list = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    	let fps_index = 0;

    	const main_loop = v => {
    		if (pause && !step) return;
    		if (step) step = false;
    		before_frame = Date.now();

    		if (!visible && !$toggled) {
    			orbs.update();
    			manager.update(false);
    			auto_bounce_loop(v);
    			return;
    		}

    		// Background
    		ctx.fillStyle = background_color;

    		ctx.fillRect(0, 0, w, h);

    		// Bounce Area
    		ctx.fillStyle = "#33ffcc33";

    		ctx.fillRect(0, 600 - $bounce.size, 1000, 600 - $bounce.size);
    		draw_auto_bounce_bar();
    		auto_bounce_loop(v);

    		// Collector Line
    		if (!$fighting) {
    			ctx.strokeStyle = "lime";
    			ctx.beginPath();
    			ctx.moveTo(0, 250);
    			ctx.lineTo(1000, 250);
    			ctx.stroke();
    		}

    		manager.update($render_mode);
    		orbs.update();
    		event_manager.update(v);
    		if ($fighting) monster_manager.draw();
    		after_frame = Date.now();
    		fps_list[fps_index] = Math.round(1000 / (after_frame - before_frame));
    		if (fps_index >= fps_list.length - 1) fps_index = 0; else fps_index++;
    		$$invalidate(9, fps = Math.min(1000, Math.round(fps_list.reduce((p, c) => p + c) / fps_list.length)));
    	};

    	onMount(() => {
    		ctx = canvas.getContext("2d");
    		$$invalidate(1, canvas.width = 1000, canvas);
    		$$invalidate(1, canvas.height = 600, canvas);
    		w = canvas.width;
    		h = canvas.height;
    		set_orbs();
    		timer.subscribe(main_loop);
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
    		if (show_earnings) {
    			$$invalidate(7, show_earnings = false);
    			return;
    		}

    		const [x, y] = e.offsetX == 0
    		? [e.layerX, e.layerY]
    		: [e.offsetX, e.offsetY];

    		if (event_manager.click({ x, y })) return;
    		orbs.bounce({ x, y });
    		small_explosion(ctx, [x, y]);
    	};

    	const key_up = e => {
    		const k = e.key;
    		if (k == "d") $$invalidate(12, debug = !debug); else if (k == "Escape") set_store_value(canvas_toggled, $toggled = !$toggled, $toggled); else if (k == "Tab" && $bounce.auto_unlocked) (set_store_value(bounce, $bounce.auto_on = !$bounce.auto_on, $bounce), bounce.set($bounce)); else if (k == "o") console.log(orbs); else if (k == "r") set_orbs();
    		if (!debug) return;

    		if (k == "s") step = !step; else if (k == " ") pause = !pause; else // else if (k == "l") console.log(orbs.list.length + orbs.homing.length);
    		if (k == "a") console.log(monster_manager); else if (k == "c") set_store_value(cash, $cash += 10000, $cash); else if (k == "b") orbs.bounce(null); else if (k == "M") console.log(mouse); else if (k == "m") set_store_value(mana, $mana += 100, $mana); else if (k == "1") basic_orb.update(v => (v.amount++, v)); else if (k == "2") light_orb.update(v => (v.amount++, v)); else if (k == "3") homing_orb.update(v => (v.amount++, v)); else if (k == "4") spore_orb.update(v => (v.amount++, v)); else if (k == "!") basic_orb.update(v => (v.amount > 0 ? v.amount-- : 0, v)); else if (k == "@") light_orb.update(v => (v.amount > 0 ? v.amount-- : 0, v)); else if (k == "#") homing_orb.update(v => (v.amount > 0 ? v.amount-- : 0, v)); else if (k == "$") spore_orb.update(v => (v.amount > 0 ? v.amount-- : 0, v)); else if (k == "0") homing_orb.update(v => (v.amount += 200, v)); else if (k == ")") homing_orb.update(v => (v.amount += 20000000, v)); else if (k == "Shift") set_store_value(shifting, $shifting = false, $shifting); else if (k == "h") monster_manager.hit(1e10); else if (k == "R") clear_storage(); else if (k == "S") {
    			basic_orb.update(v => (v.amount += 200, v));
    			light_orb.update(v => (v.amount += 200, v));
    			homing_orb.update(v => (v.amount += 200, v));
    			spore_orb.update(v => (v.amount += 200, v));
    		}
    	};

    	const key_down = e => {
    		const k = e.key;
    		if (k == "Shift") set_store_value(shifting, $shifting = true, $shifting);
    		if (!debug) return;
    		if (k == "c") set_store_value(cash, $cash += 1e5, $cash);
    	};

    	window.onblur = () => set_store_value(shifting, $shifting = false, $shifting);

    	//#endregion
    	//#region | Visibility
    	let visible = true;

    	//#endregion
    	//#region | Auto Bounce
    	const draw_auto_bounce_bar = () => {
    		ctx.fillStyle = "#33ffcc11";
    		ctx.fillRect(0, 600 - $bounce.size * auto_bounce_perc, 1000, 600 - $bounce.size * auto_bounce_perc);
    	};

    	let auto_bounce_perc = 0;

    	const auto_bounce_loop = v => {
    		if (!$bounce.auto_unlocked || !$bounce.auto_on) return;
    		auto_bounce_perc = Math.ceil(v / 29 * 100) / 100;
    		if (v == 29) orbs.bounce(null);
    	};

    	//#endregion
    	//#region | Monster
    	const rand_in_list = list => list[Math.floor(Math.random() * list.length)];

    	const monsters = {
    		// hp: 100, worth: 1
    		common: [
    			// white
    			"Zombie",
    			"Boar",
    			"Sea Monster",
    			"Young Sea Monster"
    		],
    		// hp: 250, worth: 3
    		uncommon: [
    			// light green
    			"Stone Golem",
    			"Young Wyvern",
    			"Possessed Sword"
    		],
    		// hp: 500, worth: 10
    		rare: [
    			// aqua
    			"Young Dragon",
    			"Crystal Golem",
    			"J Walker"
    		],
    		// hp: 1000, worth: 25
    		legendary: [
    			// gold
    			"Elder Dragon",
    			"Block Head",
    			"Seagull"
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
    			$$invalidate(10, monster_manager.max_hp = 100 * (1 + 0.2 * ($next_tower_lvl - 1)), monster_manager);

    			$$invalidate(10, monster_manager.hp = monster_manager.max_hp, monster_manager);
    			$$invalidate(10, monster_manager.name = name, monster_manager);
    			$$invalidate(10, monster_manager.src = `./assets/${name.toLowerCase().replaceAll(" ", "_")}.svg`, monster_manager);
    			$$invalidate(10, monster_manager.worth = 1, monster_manager);
    		} else if (rand <= u) {
    			// Uncommon
    			const name = rand_in_list(monsters.uncommon);

    			// console.log(`Spawning a ${name}`);
    			$$invalidate(10, monster_manager.max_hp = 250 * (1 + 0.2 * ($next_tower_lvl - 1)), monster_manager);

    			$$invalidate(10, monster_manager.hp = monster_manager.max_hp, monster_manager);
    			$$invalidate(10, monster_manager.name = name, monster_manager);
    			$$invalidate(10, monster_manager.src = `./assets/${name.toLowerCase().replaceAll(" ", "_")}.svg`, monster_manager);
    			$$invalidate(10, monster_manager.worth = 3, monster_manager);
    		} else if (rand <= r) {
    			// Rare
    			const name = rand_in_list(monsters.rare);

    			// console.log(`Spawning a ${name}`);
    			$$invalidate(10, monster_manager.max_hp = 500 * (1 + 0.2 * ($next_tower_lvl - 1)), monster_manager);

    			$$invalidate(10, monster_manager.hp = monster_manager.max_hp, monster_manager);
    			$$invalidate(10, monster_manager.name = name, monster_manager);
    			$$invalidate(10, monster_manager.src = `./assets/${name.toLowerCase().replaceAll(" ", "_")}.svg`, monster_manager);
    			$$invalidate(10, monster_manager.worth = 10, monster_manager);
    		} else {
    			// Legendary
    			const name = rand_in_list(monsters.legendary);

    			// console.log(`Spawning a ${name}`);
    			$$invalidate(10, monster_manager.max_hp = 1000 * (1 + 0.2 * ($next_tower_lvl - 1)), monster_manager);

    			$$invalidate(10, monster_manager.hp = monster_manager.max_hp, monster_manager);
    			$$invalidate(10, monster_manager.name = name, monster_manager);
    			$$invalidate(10, monster_manager.src = `./assets/${name.toLowerCase().replaceAll(" ", "_")}.svg`, monster_manager);
    			$$invalidate(10, monster_manager.worth = 25, monster_manager);
    		}

    		$$invalidate(10, monster_manager);
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

    			ctx.fillRect(this.pt1.x + 1, this.pt1.y + 1, this.pt2.x - this.pt1.x - 2, this.pt2.y - this.pt1.y - 2);

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
    			if (this.tick > this.total_ticks) (this.tick = 0, set_store_value(fighting, $fighting = false, $fighting), set_store_value(auto_fight, $auto_fight = false, $auto_fight));
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
    					set_store_value(next_tower_lvl, $next_tower_lvl++, $next_tower_lvl);
    					this.kill_index = 0;

    					big_explosion(ctx, [
    						this.pt1.x + (this.pt2.x - this.pt1.x) / 2,
    						this.pt1.y + (this.pt2.y - this.pt1.y) / 2
    					]);

    					// console.log(`1: Fighting: ${$fighting}, Auto: ${$auto_fight}`);
    					if (!$auto_fight) {
    						// console.log("not auto");
    						set_store_value(fighting, $fighting = false, $fighting);
    					} else {
    						const afford = $afford_fight();
    						set_store_value(fighting, $fighting = afford, $fighting);
    						set_store_value(auto_fight, $auto_fight = afford, $auto_fight);
    					} // console.log(`Can Afford: ${afford}`);
    				} // console.log(`2: Fighting: ${$fighting}, Auto: ${$auto_fight}`);
    				// console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    			}
    		}
    	};

    	//#endregion
    	//#region | Game Events
    	const event_manager = {
    		pos: { x: 0, y: 0 },
    		on: false,
    		next_ticks: 1800 + Math.floor(Math.random() * 1800),
    		click(pos) {
    			if ($fighting || !this.on) return false;

    			if (distance(pos, this.pos) < 25) {
    				this.on = false;
    				this.next_ticks = 1800 + Math.floor(Math.random() * 1800);

    				for (let i = 0; i < 50; i++) {
    					const ang = 3.141 / 5 * (i / 50) + 3.141 / 5 * 2;
    					orbs.new.shadow(pos.x, pos.y, Math.cos(ang) * 20 + Math.random() * 5, Math.sin(ang) * 20 + Math.random() * 5);
    				}

    				return true;
    			}

    			return false;
    		},
    		update(v) {
    			if ($fighting) return;

    			if (this.on) {
    				ctx.fillStyle = "#000044aa";
    				ctx.beginPath();
    				ctx.arc(this.pos.x, this.pos.y, 25, 0, 2 * Math.PI);
    				ctx.fill();
    				ctx.strokeStyle = "#ffffffaa";
    				ctx.beginPath();
    				ctx.arc(this.pos.x, this.pos.y, 25 * (v / 29), 0, 2 * Math.PI);
    				ctx.stroke();
    				ctx.beginPath();
    				ctx.arc(this.pos.x, this.pos.y, 25, 0, 2 * Math.PI);
    				ctx.stroke();
    				return;
    			}

    			this.next_ticks--;

    			if (this.next_ticks <= 0) {
    				console.log("spawn!");
    				this.pos.x = Math.round(Math.random() * (1000 - 60)) + 30;
    				this.pos.y = Math.round(Math.random() * 100) + 30;
    				this.on = true;
    				this.next_ticks = 60;
    			}
    		}
    	};

    	//#endregion
    	//#region | Debug mode
    	let total_orbs = 0;

    	let debug = false;
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

    	const click_handler = () => (set_store_value(fighting, $fighting = false, $fighting), set_store_value(auto_fight, $auto_fight = false, $auto_fight));
    	const click_handler_1 = () => $$invalidate(7, show_earnings = false);

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
    		collector_pos,
    		bounce,
    		render_mode,
    		basic_orb,
    		light_orb,
    		homing_orb,
    		auto_fight,
    		afford_fight,
    		orb_double,
    		toggled: canvas_toggled,
    		fighting,
    		shifting,
    		rarities,
    		next_tower_lvl,
    		prestige,
    		spore_orb,
    		clear_storage,
    		offline_time,
    		manager,
    		small_explosion,
    		big_explosion,
    		sci,
    		format_num,
    		set_orbs,
    		main,
    		canvas,
    		ctx,
    		pause,
    		step,
    		background_color,
    		w,
    		h,
    		distance,
    		rand_width,
    		rand_height,
    		rand_pos,
    		F_acos,
    		F_atan2,
    		orbs,
    		calc_cps,
    		first_cps_set,
    		offline_get,
    		offline_gain,
    		show_earnings,
    		check_cps,
    		cps,
    		last_cash,
    		fps,
    		before_frame,
    		after_frame,
    		fps_list,
    		fps_index,
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
    		event_manager,
    		total_orbs,
    		debug,
    		$spore_orb,
    		$homing_orb,
    		$light_orb,
    		$basic_orb,
    		$fighting,
    		$auto_fight,
    		$afford_fight,
    		$next_tower_lvl,
    		$mana,
    		$rarities,
    		$bounce,
    		$toggled,
    		$shifting,
    		$cash,
    		$render_mode,
    		$offline_time,
    		$collector_pos,
    		$timer,
    		$prestige,
    		$orb_double
    	});

    	$$self.$inject_state = $$props => {
    		if ('main' in $$props) $$invalidate(0, main = $$props.main);
    		if ('canvas' in $$props) $$invalidate(1, canvas = $$props.canvas);
    		if ('ctx' in $$props) ctx = $$props.ctx;
    		if ('pause' in $$props) pause = $$props.pause;
    		if ('step' in $$props) step = $$props.step;
    		if ('w' in $$props) w = $$props.w;
    		if ('h' in $$props) h = $$props.h;
    		if ('calc_cps' in $$props) $$invalidate(5, calc_cps = $$props.calc_cps);
    		if ('first_cps_set' in $$props) first_cps_set = $$props.first_cps_set;
    		if ('offline_get' in $$props) offline_get = $$props.offline_get;
    		if ('offline_gain' in $$props) $$invalidate(6, offline_gain = $$props.offline_gain);
    		if ('show_earnings' in $$props) $$invalidate(7, show_earnings = $$props.show_earnings);
    		if ('cps' in $$props) $$invalidate(8, cps = $$props.cps);
    		if ('last_cash' in $$props) last_cash = $$props.last_cash;
    		if ('fps' in $$props) $$invalidate(9, fps = $$props.fps);
    		if ('before_frame' in $$props) before_frame = $$props.before_frame;
    		if ('after_frame' in $$props) after_frame = $$props.after_frame;
    		if ('fps_list' in $$props) fps_list = $$props.fps_list;
    		if ('fps_index' in $$props) fps_index = $$props.fps_index;
    		if ('visible' in $$props) visible = $$props.visible;
    		if ('auto_bounce_perc' in $$props) auto_bounce_perc = $$props.auto_bounce_perc;
    		if ('monster_manager' in $$props) $$invalidate(10, monster_manager = $$props.monster_manager);
    		if ('total_orbs' in $$props) $$invalidate(11, total_orbs = $$props.total_orbs);
    		if ('debug' in $$props) $$invalidate(12, debug = $$props.debug);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*$basic_orb, $light_orb, $homing_orb, $spore_orb*/ 983040) {
    			{
    				set_orbs();
    			}
    		}

    		if ($$self.$$.dirty[0] & /*$orb_double, $prestige*/ 3145728) {
    			{
    				basic_orb.update(v => (v.value = 1 * 2 ** $orb_double.value + 0.5 * $prestige.times, v));
    				light_orb.update(v => (v.value = 1 * 2 ** $orb_double.value + 0.5 * $prestige.times, v));
    				homing_orb.update(v => (v.value = 0.5 * 2 ** $orb_double.value + 0.5 * $prestige.times, v));
    				spore_orb.update(v => (v.value = 1 * 2 ** $orb_double.value + 1 * $prestige.times, v.sub_value = 0.2 * 2 ** $orb_double.value + 0.2 * $prestige.times, v));
    			}
    		}

    		if ($$self.$$.dirty[0] & /*$prestige*/ 1048576) {
    			{
    				$prestige.times;
    				orbs.free_all();
    			}
    		}

    		if ($$self.$$.dirty[0] & /*$basic_orb, $light_orb, $spore_orb, $bounce, $homing_orb*/ 983048) {
    			{
    				// $basic_orb; $light_orb; $spore_orb; $homing_orb;
    				$$invalidate(5, calc_cps = (orbs.total.basic * $basic_orb.value + orbs.total.light * $light_orb.value + orbs.total.spore * $spore_orb.value + orbs.total.sub_spore * $spore_orb.sub_value) * ($bounce.auto_unlocked ? 1 : 0) * (1 + ($bounce.power - 30) / 2.5 * 0.025) + orbs.total.homing * $homing_orb.value * 2);

    				//
    				check_cps();
    			}
    		}

    		if ($$self.$$.dirty[0] & /*canvas*/ 2) {
    			// $: if ($toggled && canvas != undefined) canvas.onmousedown({ layerX: 0, layerY: 0 });
    			{
    				if (canvas != undefined) {
    					$$invalidate(1, canvas.onmousedown = mouse_down, canvas);
    					$$invalidate(1, canvas.onmousemove = mouse_move, canvas);
    					$$invalidate(1, canvas.onmouseenter = mouse_enter, canvas);
    					$$invalidate(1, canvas.onmouseleave = mouse_leave, canvas);
    					document.body.onkeyup = key_up;
    					document.body.onkeydown = key_down;
    				} // window.addEventListener("keyup", key_up, false);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*main, $toggled*/ 17) {
    			{
    				if (main != undefined) {
    					$$invalidate(0, main.ontransitionend = () => visible = $toggled, main);
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*$bounce*/ 8) {
    			if (!$bounce.auto_unlocked || !$bounce.auto_on) auto_bounce_perc = 0;
    		}

    		if ($$self.$$.dirty[0] & /*$fighting*/ 4) {
    			if ($fighting) {
    				spawn_monster();
    				set_orbs();
    			}
    		}

    		if ($$self.$$.dirty[0] & /*$basic_orb, $light_orb, $homing_orb, $spore_orb*/ 983040) {
    			{
    				$$invalidate(11, total_orbs = $basic_orb.amount + $light_orb.amount + $homing_orb.amount + $spore_orb.amount);
    			}
    		}
    	};

    	return [
    		main,
    		canvas,
    		$fighting,
    		$bounce,
    		$toggled,
    		calc_cps,
    		offline_gain,
    		show_earnings,
    		cps,
    		fps,
    		monster_manager,
    		total_orbs,
    		debug,
    		$auto_fight,
    		$next_tower_lvl,
    		$cash,
    		$spore_orb,
    		$homing_orb,
    		$light_orb,
    		$basic_orb,
    		$prestige,
    		$orb_double,
    		canvas_1_binding,
    		click_handler,
    		click_handler_1,
    		main_1_binding
    	];
    }

    class Canvas extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {}, null, [-1, -1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Canvas",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/components/Shop.svelte generated by Svelte v3.46.4 */
    const file$5 = "src/components/Shop.svelte";

    // (97:117) {:else}
    function create_else_block_1$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Max!");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(97:117) {:else}",
    		ctx
    	});

    	return block;
    }

    // (97:66) {#if $bounce.size < 275}
    function create_if_block_1$1(ctx) {
    	let t0;
    	let t1_value = sci(/*$bounce*/ ctx[5].size_cost) + "";
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text("$");
    			t1 = text(t1_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$bounce*/ 32 && t1_value !== (t1_value = sci(/*$bounce*/ ctx[5].size_cost) + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(97:66) {#if $bounce.size < 275}",
    		ctx
    	});

    	return block;
    }

    // (100:1) {:else}
    function create_else_block$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			add_location(div, file$5, 99, 9, 3483);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(100:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (99:1) {#if $got_mana}
    function create_if_block$1(ctx) {
    	let button;
    	let t0;
    	let b;
    	let t1_value = sci(/*$orb_double*/ ctx[2].cost) + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text("Double All Orb Values ");
    			b = element("b");
    			t1 = text(t1_value);
    			t2 = text("₪");
    			attr_dev(b, "class", "svelte-1ynkdsp");
    			add_location(b, file$5, 98, 72, 3433);
    			attr_dev(button, "class", "svelte-1ynkdsp");
    			add_location(button, file$5, 98, 17, 3378);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, b);
    			append_dev(b, t1);
    			append_dev(b, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*double_values*/ ctx[13], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$orb_double*/ 4 && t1_value !== (t1_value = sci(/*$orb_double*/ ctx[2].cost) + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(99:1) {#if $got_mana}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let main;
    	let h30;
    	let t0;
    	let t1_value = sci(/*$cash*/ ctx[4]) + "";
    	let t1;
    	let t2;
    	let h31;
    	let t4;
    	let hr;
    	let t5;
    	let button0;
    	let t6;
    	let b0;
    	let t7;
    	let t8_value = sci(/*$bounce*/ ctx[5].power_cost) + "";
    	let t8;
    	let t9;
    	let button1;
    	let t10;
    	let b1;

    	let t11_value = (/*$bounce*/ ctx[5].auto_unlocked
    	? "Unlocked!"
    	: `$${sci(/*$bounce*/ ctx[5].auto_cost)}`) + "";

    	let t11;
    	let t12;
    	let button2;
    	let t13;
    	let b2;
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
    	let t21;
    	let div;
    	let t22;
    	let h32;
    	let t23;
    	let t24_value = sci(/*$prestige*/ ctx[6].times * 50) + "";
    	let t24;
    	let t25;
    	let t26_value = (/*prest_hover*/ ctx[1] ? "(+50%)" : "") + "";
    	let t26;
    	let t27;
    	let button4;
    	let t28;
    	let b4;
    	let t29;
    	let t30_value = sci(/*$prestige*/ ctx[6].cost) + "";
    	let t30;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*$bounce*/ ctx[5].size < 275) return create_if_block_1$1;
    		return create_else_block_1$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*$got_mana*/ ctx[7]) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h30 = element("h3");
    			t0 = text("Cash: ");
    			t1 = text(t1_value);
    			t2 = space();
    			h31 = element("h3");
    			h31.textContent = "Shift + Click to buy max";
    			t4 = space();
    			hr = element("hr");
    			t5 = space();
    			button0 = element("button");
    			t6 = text("Increase Bounce Power ");
    			b0 = element("b");
    			t7 = text("$");
    			t8 = text(t8_value);
    			t9 = space();
    			button1 = element("button");
    			t10 = text("Unlock Auto Bounce ");
    			b1 = element("b");
    			t11 = text(t11_value);
    			t12 = space();
    			button2 = element("button");
    			t13 = text("Increase Bounce Area ");
    			b2 = element("b");
    			if_block0.c();
    			t14 = space();
    			button3 = element("button");
    			t15 = text("Starting Cash +1 ($");
    			t16 = text(t16_value);
    			t17 = text(") ");
    			b3 = element("b");
    			t18 = text("$");
    			t19 = text(t19_value);
    			t20 = space();
    			if_block1.c();
    			t21 = space();
    			div = element("div");
    			t22 = space();
    			h32 = element("h3");
    			t23 = text("Orb Value Bonus: +");
    			t24 = text(t24_value);
    			t25 = text("% ");
    			t26 = text(t26_value);
    			t27 = space();
    			button4 = element("button");
    			t28 = text("Prestige ");
    			b4 = element("b");
    			t29 = text("$");
    			t30 = text(t30_value);
    			attr_dev(h30, "id", "cash");
    			attr_dev(h30, "class", "svelte-1ynkdsp");
    			add_location(h30, file$5, 90, 1, 2634);
    			attr_dev(h31, "id", "max-buy-hint");
    			attr_dev(h31, "class", "svelte-1ynkdsp");
    			add_location(h31, file$5, 91, 1, 2673);
    			attr_dev(hr, "id", "top-hr");
    			attr_dev(hr, "class", "svelte-1ynkdsp");
    			add_location(hr, file$5, 92, 1, 2726);
    			attr_dev(b0, "class", "svelte-1ynkdsp");
    			add_location(b0, file$5, 94, 59, 2897);
    			attr_dev(button0, "class", "svelte-1ynkdsp");
    			add_location(button0, file$5, 94, 1, 2839);
    			attr_dev(b1, "class", "svelte-1ynkdsp");
    			add_location(b1, file$5, 95, 55, 2995);
    			attr_dev(button1, "class", "svelte-1ynkdsp");
    			add_location(button1, file$5, 95, 1, 2941);
    			attr_dev(b2, "class", "svelte-1ynkdsp");
    			add_location(b2, file$5, 96, 62, 3142);
    			attr_dev(button2, "class", "svelte-1ynkdsp");
    			add_location(button2, file$5, 96, 1, 3081);
    			attr_dev(b3, "class", "svelte-1ynkdsp");
    			add_location(b3, file$5, 97, 87, 3317);
    			attr_dev(button3, "class", "svelte-1ynkdsp");
    			add_location(button3, file$5, 97, 1, 3231);
    			add_location(div, file$5, 100, 1, 3502);
    			attr_dev(h32, "id", "orb-info");
    			attr_dev(h32, "class", "svelte-1ynkdsp");
    			add_location(h32, file$5, 101, 1, 3515);
    			attr_dev(b4, "class", "svelte-1ynkdsp");
    			add_location(b4, file$5, 102, 63, 3676);
    			attr_dev(button4, "class", "svelte-1ynkdsp");
    			add_location(button4, file$5, 102, 1, 3614);
    			attr_dev(main, "id", "main-shop");
    			attr_dev(main, "class", "svelte-1ynkdsp");
    			add_location(main, file$5, 89, 0, 2611);
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
    			append_dev(main, h31);
    			append_dev(main, t4);
    			append_dev(main, hr);
    			append_dev(main, t5);
    			append_dev(main, button0);
    			append_dev(button0, t6);
    			append_dev(button0, b0);
    			append_dev(b0, t7);
    			append_dev(b0, t8);
    			append_dev(main, t9);
    			append_dev(main, button1);
    			append_dev(button1, t10);
    			append_dev(button1, b1);
    			append_dev(b1, t11);
    			append_dev(main, t12);
    			append_dev(main, button2);
    			append_dev(button2, t13);
    			append_dev(button2, b2);
    			if_block0.m(b2, null);
    			append_dev(main, t14);
    			append_dev(main, button3);
    			append_dev(button3, t15);
    			append_dev(button3, t16);
    			append_dev(button3, t17);
    			append_dev(button3, b3);
    			append_dev(b3, t18);
    			append_dev(b3, t19);
    			append_dev(main, t20);
    			if_block1.m(main, null);
    			append_dev(main, t21);
    			append_dev(main, div);
    			append_dev(main, t22);
    			append_dev(main, h32);
    			append_dev(h32, t23);
    			append_dev(h32, t24);
    			append_dev(h32, t25);
    			append_dev(h32, t26);
    			append_dev(main, t27);
    			append_dev(main, button4);
    			append_dev(button4, t28);
    			append_dev(button4, b4);
    			append_dev(b4, t29);
    			append_dev(b4, t30);
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
    			if (dirty & /*$bounce*/ 32 && t8_value !== (t8_value = sci(/*$bounce*/ ctx[5].power_cost) + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*$bounce*/ 32 && t11_value !== (t11_value = (/*$bounce*/ ctx[5].auto_unlocked
    			? "Unlocked!"
    			: `$${sci(/*$bounce*/ ctx[5].auto_cost)}`) + "")) set_data_dev(t11, t11_value);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(b2, null);
    				}
    			}

    			if (dirty & /*$starting_cash*/ 8 && t16_value !== (t16_value = sci(/*$starting_cash*/ ctx[3].amount) + "")) set_data_dev(t16, t16_value);
    			if (dirty & /*$starting_cash*/ 8 && t19_value !== (t19_value = sci(/*$starting_cash*/ ctx[3].cost) + "")) set_data_dev(t19, t19_value);

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(main, t21);
    				}
    			}

    			if (dirty & /*$prestige*/ 64 && t24_value !== (t24_value = sci(/*$prestige*/ ctx[6].times * 50) + "")) set_data_dev(t24, t24_value);
    			if (dirty & /*prest_hover*/ 2 && t26_value !== (t26_value = (/*prest_hover*/ ctx[1] ? "(+50%)" : "") + "")) set_data_dev(t26, t26_value);
    			if (dirty & /*$prestige*/ 64 && t30_value !== (t30_value = sci(/*$prestige*/ ctx[6].cost) + "")) set_data_dev(t30, t30_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_block0.d();
    			if_block1.d();
    			/*button4_binding*/ ctx[14](null);
    			mounted = false;
    			run_all(dispose);
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
    	let $shifting;
    	let $orb_double;
    	let $mana;
    	let $starting_cash;
    	let $cash;
    	let $bounce;
    	let $prestige;
    	let $got_mana;
    	validate_store(shifting, 'shifting');
    	component_subscribe($$self, shifting, $$value => $$invalidate(15, $shifting = $$value));
    	validate_store(orb_double, 'orb_double');
    	component_subscribe($$self, orb_double, $$value => $$invalidate(2, $orb_double = $$value));
    	validate_store(mana, 'mana');
    	component_subscribe($$self, mana, $$value => $$invalidate(16, $mana = $$value));
    	validate_store(starting_cash, 'starting_cash');
    	component_subscribe($$self, starting_cash, $$value => $$invalidate(3, $starting_cash = $$value));
    	validate_store(cash, 'cash');
    	component_subscribe($$self, cash, $$value => $$invalidate(4, $cash = $$value));
    	validate_store(bounce, 'bounce');
    	component_subscribe($$self, bounce, $$value => $$invalidate(5, $bounce = $$value));
    	validate_store(prestige, 'prestige');
    	component_subscribe($$self, prestige, $$value => $$invalidate(6, $prestige = $$value));
    	validate_store(got_mana, 'got_mana');
    	component_subscribe($$self, got_mana, $$value => $$invalidate(7, $got_mana = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Shop', slots, []);

    	const buy_bounce_power = () => {
    		if ($cash < $bounce.power_cost) return;
    		set_store_value(cash, $cash -= $bounce.power_cost, $cash);
    		set_store_value(bounce, $bounce.power += 2.5, $bounce);
    		set_store_value(bounce, $bounce.power_cost = Math.floor($bounce.power_cost * 1.5), $bounce);
    		bounce.set($bounce);
    		if ($shifting) buy_bounce_power();
    	};

    	//#endregion
    	//#region | Auto Bounce
    	const buy_auto_bounce = () => {
    		if ($cash < $bounce.auto_cost || $bounce.auto_unlocked) return;
    		set_store_value(cash, $cash -= $bounce.auto_cost, $cash);
    		set_store_value(bounce, $bounce.auto_unlocked = true, $bounce);
    		bounce.set($bounce);
    	};

    	//#endregion
    	//#region | Bounce Area
    	const increase_bounce_area = () => {
    		if ($cash < $bounce.size_cost || $bounce.size >= 275) return;
    		set_store_value(cash, $cash -= $bounce.size_cost, $cash);
    		set_store_value(bounce, $bounce.size_cost *= 2, $bounce);
    		set_store_value(bounce, $bounce.size += 25, $bounce);
    		bounce.set($bounce);
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
    		light_orb.update(v => (v.amount = 0, v.cost = 1, v));
    		homing_orb.update(v => (v.amount = 0, v.cost = 3, v));
    		spore_orb.update(v => (v.amount = 0, v.cost = 3, v));

    		set_store_value(
    			bounce,
    			$bounce = {
    				power: 30,
    				power_cost: 250,
    				size: 75,
    				size_cost: 500,
    				auto_cost: 350,
    				auto_unlocked: false,
    				auto_on: true
    			},
    			$bounce
    		);

    		prestige.update(v => (v.times++, v.cost = Math.round(v.cost * 1.25), v));
    	};

    	//#endregion
    	//#region | Post-Prestige Cash
    	const buy_starting_cash = () => {
    		if ($cash < $starting_cash.cost) return;

    		if ($shifting) {
    			const total = Math.floor($cash / $starting_cash.cost);
    			set_store_value(cash, $cash -= $starting_cash.cost * total, $cash);
    			starting_cash.update(v => (v.amount += total, v));
    		} else {
    			set_store_value(cash, $cash -= $starting_cash.cost, $cash);
    			starting_cash.update(v => (v.amount++, v));
    		}
    	};

    	//#endregion
    	//#region | Orb Doubler
    	const double_values = () => {
    		if ($mana < $orb_double.cost) return;
    		set_store_value(mana, $mana -= $orb_double.cost, $mana);
    		set_store_value(orb_double, $orb_double.cost *= 3, $orb_double);
    		set_store_value(orb_double, $orb_double.value++, $orb_double);
    		orb_double.set($orb_double);
    		if ($shifting) double_values();
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
    		mana,
    		shifting,
    		basic_orb,
    		light_orb,
    		homing_orb,
    		spore_orb,
    		prestige,
    		starting_cash,
    		bounce,
    		got_mana,
    		orb_double,
    		sci,
    		buy_bounce_power,
    		buy_auto_bounce,
    		increase_bounce_area,
    		prest_btn,
    		prest_hover,
    		do_prestige,
    		buy_starting_cash,
    		double_values,
    		$shifting,
    		$orb_double,
    		$mana,
    		$starting_cash,
    		$cash,
    		$bounce,
    		$prestige,
    		$got_mana
    	});

    	$$self.$inject_state = $$props => {
    		if ('prest_btn' in $$props) $$invalidate(0, prest_btn = $$props.prest_btn);
    		if ('prest_hover' in $$props) $$invalidate(1, prest_hover = $$props.prest_hover);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*prest_btn*/ 1) {
    			{
    				// Prestige Button
    				if (prest_btn != undefined) {
    					$$invalidate(0, prest_btn.onmouseenter = () => $$invalidate(1, prest_hover = true), prest_btn);
    					$$invalidate(0, prest_btn.onmouseleave = () => $$invalidate(1, prest_hover = false), prest_btn);
    				}
    			}
    		}
    	};

    	return [
    		prest_btn,
    		prest_hover,
    		$orb_double,
    		$starting_cash,
    		$cash,
    		$bounce,
    		$prestige,
    		$got_mana,
    		buy_bounce_power,
    		buy_auto_bounce,
    		increase_bounce_area,
    		do_prestige,
    		buy_starting_cash,
    		double_values,
    		button4_binding
    	];
    }

    class Shop extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Shop",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/components/Artifacts.svelte generated by Svelte v3.46.4 */

    const file$4 = "src/components/Artifacts.svelte";

    function create_fragment$4(ctx) {
    	let main;
    	let h3;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h3 = element("h3");
    			h3.textContent = "Artifacts Coming Soon!";
    			attr_dev(h3, "class", "svelte-1duvk0l");
    			add_location(h3, file$4, 5, 1, 29);
    			attr_dev(main, "class", "svelte-1duvk0l");
    			add_location(main, file$4, 4, 0, 21);
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
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
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Artifacts",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/Lab.svelte generated by Svelte v3.46.4 */
    const file$3 = "src/components/Lab.svelte";

    // (143:2) {:else}
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
    			attr_dev(h3, "class", "svelte-1ga2rze");
    			add_location(h3, file$3, 144, 3, 4367);
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
    		source: "(143:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (129:2) {#if $unlocked_fighting}
    function create_if_block_2(ctx) {
    	let button0;
    	let t0;
    	let button0_style_value;
    	let t1;
    	let button1;
    	let t2;
    	let t3;
    	let t4;
    	let b;
    	let t5;
    	let t6_value = sci(/*$fight_cost*/ ctx[11]) + "";
    	let t6;
    	let t7;
    	let h3;
    	let t8;
    	let t9;
    	let t10;
    	let t11;
    	let t12;
    	let t13;
    	let mounted;
    	let dispose;
    	let if_block0 = /*$rarities*/ ctx[12].c > 0 && create_if_block_9(ctx);
    	let if_block1 = /*$rarities*/ ctx[12].c > 0 && /*$rarities*/ ctx[12].u > 0 && create_if_block_8(ctx);
    	let if_block2 = /*$rarities*/ ctx[12].u > 0 && create_if_block_7(ctx);
    	let if_block3 = /*$rarities*/ ctx[12].r > 0 && create_if_block_6(ctx);
    	let if_block4 = (/*$rarities*/ ctx[12].c > 0 || /*$rarities*/ ctx[12].u > 0) && create_if_block_5(ctx);
    	let if_block5 = /*$rarities*/ ctx[12].r > 0 && /*$rarities*/ ctx[12].l > 0 && create_if_block_4(ctx);
    	let if_block6 = /*$rarities*/ ctx[12].l > 0 && create_if_block_3(ctx);

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			t0 = text("Auto Fight?");
    			t1 = space();
    			button1 = element("button");
    			t2 = text("Monster Tower Lvl ");
    			t3 = text(/*$next_tower_lvl*/ ctx[5]);
    			t4 = text(" | ");
    			b = element("b");
    			t5 = text("$");
    			t6 = text(t6_value);
    			t7 = space();
    			h3 = element("h3");
    			if (if_block0) if_block0.c();
    			t8 = space();
    			if (if_block1) if_block1.c();
    			t9 = space();
    			if (if_block2) if_block2.c();
    			t10 = space();
    			if (if_block3) if_block3.c();
    			t11 = space();
    			if (if_block4) if_block4.c();
    			t12 = space();
    			if (if_block5) if_block5.c();
    			t13 = space();
    			if (if_block6) if_block6.c();
    			attr_dev(button0, "id", "auto-fight");
    			attr_dev(button0, "style", button0_style_value = /*$auto_fight*/ ctx[6] ? "border-color: lime;" : "");
    			attr_dev(button0, "class", "svelte-1ga2rze");
    			add_location(button0, file$3, 129, 3, 3418);
    			add_location(b, file$3, 131, 42, 3683);
    			attr_dev(h3, "id", "rarities");
    			attr_dev(h3, "class", "svelte-1ga2rze");
    			add_location(h3, file$3, 132, 4, 3714);
    			attr_dev(button1, "id", "fight-btn");
    			attr_dev(button1, "class", "svelte-1ga2rze");
    			toggle_class(button1, "disabled", /*$fighting*/ ctx[10]);
    			add_location(button1, file$3, 130, 3, 3560);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			append_dev(button0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);
    			append_dev(button1, t2);
    			append_dev(button1, t3);
    			append_dev(button1, t4);
    			append_dev(button1, b);
    			append_dev(b, t5);
    			append_dev(b, t6);
    			append_dev(button1, t7);
    			append_dev(button1, h3);
    			if (if_block0) if_block0.m(h3, null);
    			append_dev(h3, t8);
    			if (if_block1) if_block1.m(h3, null);
    			append_dev(h3, t9);
    			if (if_block2) if_block2.m(h3, null);
    			append_dev(h3, t10);
    			if (if_block3) if_block3.m(h3, null);
    			append_dev(h3, t11);
    			if (if_block4) if_block4.m(h3, null);
    			append_dev(h3, t12);
    			if (if_block5) if_block5.m(h3, null);
    			append_dev(h3, t13);
    			if (if_block6) if_block6.m(h3, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[23], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[24], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$auto_fight*/ 64 && button0_style_value !== (button0_style_value = /*$auto_fight*/ ctx[6] ? "border-color: lime;" : "")) {
    				attr_dev(button0, "style", button0_style_value);
    			}

    			if (dirty & /*$next_tower_lvl*/ 32) set_data_dev(t3, /*$next_tower_lvl*/ ctx[5]);
    			if (dirty & /*$fight_cost*/ 2048 && t6_value !== (t6_value = sci(/*$fight_cost*/ ctx[11]) + "")) set_data_dev(t6, t6_value);

    			if (/*$rarities*/ ctx[12].c > 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_9(ctx);
    					if_block0.c();
    					if_block0.m(h3, t8);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*$rarities*/ ctx[12].c > 0 && /*$rarities*/ ctx[12].u > 0) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_8(ctx);
    					if_block1.c();
    					if_block1.m(h3, t9);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*$rarities*/ ctx[12].u > 0) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_7(ctx);
    					if_block2.c();
    					if_block2.m(h3, t10);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*$rarities*/ ctx[12].r > 0) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block_6(ctx);
    					if_block3.c();
    					if_block3.m(h3, t11);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (/*$rarities*/ ctx[12].c > 0 || /*$rarities*/ ctx[12].u > 0) {
    				if (if_block4) ; else {
    					if_block4 = create_if_block_5(ctx);
    					if_block4.c();
    					if_block4.m(h3, t12);
    				}
    			} else if (if_block4) {
    				if_block4.d(1);
    				if_block4 = null;
    			}

    			if (/*$rarities*/ ctx[12].r > 0 && /*$rarities*/ ctx[12].l > 0) {
    				if (if_block5) ; else {
    					if_block5 = create_if_block_4(ctx);
    					if_block5.c();
    					if_block5.m(h3, t13);
    				}
    			} else if (if_block5) {
    				if_block5.d(1);
    				if_block5 = null;
    			}

    			if (/*$rarities*/ ctx[12].l > 0) {
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

    			if (dirty & /*$fighting*/ 1024) {
    				toggle_class(button1, "disabled", /*$fighting*/ ctx[10]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();
    			if (if_block5) if_block5.d();
    			if (if_block6) if_block6.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(129:2) {#if $unlocked_fighting}",
    		ctx
    	});

    	return block;
    }

    // (134:5) {#if $rarities.c > 0}
    function create_if_block_9(ctx) {
    	let span;
    	let t0;
    	let t1_value = /*$rarities*/ ctx[12].c + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("Common: ");
    			t1 = text(t1_value);
    			t2 = text("%");
    			set_style(span, "color", "#ddd");
    			add_location(span, file$3, 133, 26, 3759);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$rarities*/ 4096 && t1_value !== (t1_value = /*$rarities*/ ctx[12].c + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(134:5) {#if $rarities.c > 0}",
    		ctx
    	});

    	return block;
    }

    // (135:5) {#if $rarities.c > 0 && $rarities.u > 0}
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
    		source: "(135:5) {#if $rarities.c > 0 && $rarities.u > 0}",
    		ctx
    	});

    	return block;
    }

    // (136:5) {#if $rarities.u > 0}
    function create_if_block_7(ctx) {
    	let span;
    	let t0;
    	let t1_value = /*$rarities*/ ctx[12].u + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("Uncommon: ");
    			t1 = text(t1_value);
    			t2 = text("%");
    			set_style(span, "color", "#B8E986");
    			add_location(span, file$3, 135, 26, 3902);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$rarities*/ 4096 && t1_value !== (t1_value = /*$rarities*/ ctx[12].u + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(136:5) {#if $rarities.u > 0}",
    		ctx
    	});

    	return block;
    }

    // (137:5) {#if $rarities.r > 0}
    function create_if_block_6(ctx) {
    	let span;
    	let t0;
    	let t1_value = /*$rarities*/ ctx[12].r + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("Rare: ");
    			t1 = text(t1_value);
    			t2 = text("%");
    			set_style(span, "color", "#48BAFF");
    			add_location(span, file$3, 136, 26, 3995);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$rarities*/ 4096 && t1_value !== (t1_value = /*$rarities*/ ctx[12].r + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(137:5) {#if $rarities.r > 0}",
    		ctx
    	});

    	return block;
    }

    // (138:5) {#if $rarities.c > 0 || $rarities.u > 0}
    function create_if_block_5(ctx) {
    	let br;

    	const block = {
    		c: function create() {
    			br = element("br");
    			add_location(br, file$3, 137, 46, 4104);
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
    		source: "(138:5) {#if $rarities.c > 0 || $rarities.u > 0}",
    		ctx
    	});

    	return block;
    }

    // (139:5) {#if $rarities.r > 0 && $rarities.l > 0}
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
    		source: "(139:5) {#if $rarities.r > 0 && $rarities.l > 0}",
    		ctx
    	});

    	return block;
    }

    // (140:5) {#if $rarities.l > 0}
    function create_if_block_3(ctx) {
    	let span;
    	let t0;
    	let t1_value = /*$rarities*/ ctx[12].l + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("Legendary: ");
    			t1 = text(t1_value);
    			t2 = text("%");
    			set_style(span, "color", "#F8E71C");
    			add_location(span, file$3, 139, 26, 4195);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$rarities*/ 4096 && t1_value !== (t1_value = /*$rarities*/ ctx[12].l + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(140:5) {#if $rarities.l > 0}",
    		ctx
    	});

    	return block;
    }

    // (178:2) {:else}
    function create_else_block(ctx) {
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let button2;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "?";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "?";
    			t3 = space();
    			button2 = element("button");
    			button2.textContent = "?";
    			button0.disabled = true;
    			attr_dev(button0, "class", "svelte-1ga2rze");
    			add_location(button0, file$3, 178, 2, 5709);
    			button1.disabled = true;
    			attr_dev(button1, "class", "svelte-1ga2rze");
    			add_location(button1, file$3, 179, 2, 5739);
    			button2.disabled = true;
    			attr_dev(button2, "class", "svelte-1ga2rze");
    			add_location(button2, file$3, 180, 2, 5769);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, button2, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(button2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(178:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (156:2) {#if $got_mana}
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
    	let t12_value = /*$homing_orb*/ ctx[2].value + "";
    	let t12;
    	let t13;
    	let div1;
    	let button3;
    	let t14;
    	let t15_value = sci(/*$homing_orb*/ ctx[2].cost) + "";
    	let t15;
    	let t16;
    	let t17;
    	let button4;
    	let t19;
    	let button8;
    	let t20;
    	let p2;
    	let t21;
    	let t22_value = /*$spore_orb*/ ctx[0].value + "";
    	let t22;
    	let t23;
    	let div2;
    	let button6;
    	let t24;
    	let t25_value = sci(/*$spore_orb*/ ctx[0].cost) + "";
    	let t25;
    	let t26;
    	let t27;
    	let button7;
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
    			t19 = space();
    			button8 = element("button");
    			t20 = text("Spore\n\t\t\t");
    			p2 = element("p");
    			t21 = text("Dmg/Value: ");
    			t22 = text(t22_value);
    			t23 = space();
    			div2 = element("div");
    			button6 = element("button");
    			t24 = text("Buy ");
    			t25 = text(t25_value);
    			t26 = text("₪");
    			t27 = space();
    			button7 = element("button");
    			button7.textContent = "Sell";
    			attr_dev(p0, "class", "stat svelte-1ga2rze");
    			add_location(p0, file$3, 157, 3, 4837);
    			attr_dev(button0, "class", "buy-sell svelte-1ga2rze");
    			add_location(button0, file$3, 159, 4, 4917);
    			attr_dev(button1, "class", "buy-sell svelte-1ga2rze");
    			add_location(button1, file$3, 160, 4, 5004);
    			attr_dev(div0, "class", "orb-info svelte-1ga2rze");
    			add_location(div0, file$3, 158, 3, 4890);
    			attr_dev(button2, "class", "trade-btn svelte-1ga2rze");
    			attr_dev(button2, "id", "light-btn");
    			add_location(button2, file$3, 156, 2, 4787);
    			attr_dev(p1, "class", "stat svelte-1ga2rze");
    			add_location(p1, file$3, 164, 3, 5141);
    			attr_dev(button3, "class", "buy-sell svelte-1ga2rze");
    			add_location(button3, file$3, 166, 4, 5222);
    			attr_dev(button4, "class", "buy-sell svelte-1ga2rze");
    			add_location(button4, file$3, 167, 4, 5311);
    			attr_dev(div1, "class", "orb-info svelte-1ga2rze");
    			add_location(div1, file$3, 165, 3, 5195);
    			attr_dev(button5, "class", "trade-btn svelte-1ga2rze");
    			attr_dev(button5, "id", "homing-btn");
    			add_location(button5, file$3, 163, 2, 5089);
    			attr_dev(p2, "class", "stat svelte-1ga2rze");
    			add_location(p2, file$3, 171, 3, 5447);
    			attr_dev(button6, "class", "buy-sell svelte-1ga2rze");
    			add_location(button6, file$3, 173, 4, 5527);
    			attr_dev(button7, "class", "buy-sell svelte-1ga2rze");
    			add_location(button7, file$3, 174, 4, 5614);
    			attr_dev(div2, "class", "orb-info svelte-1ga2rze");
    			add_location(div2, file$3, 172, 3, 5500);
    			attr_dev(button8, "class", "trade-btn svelte-1ga2rze");
    			attr_dev(button8, "id", "spore-btn");
    			add_location(button8, file$3, 170, 2, 5397);
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
    			insert_dev(target, t19, anchor);
    			insert_dev(target, button8, anchor);
    			append_dev(button8, t20);
    			append_dev(button8, p2);
    			append_dev(p2, t21);
    			append_dev(p2, t22);
    			append_dev(button8, t23);
    			append_dev(button8, div2);
    			append_dev(div2, button6);
    			append_dev(button6, t24);
    			append_dev(button6, t25);
    			append_dev(button6, t26);
    			append_dev(div2, t27);
    			append_dev(div2, button7);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*buy_light*/ ctx[16], false, false, false),
    					listen_dev(button1, "click", /*sell_light*/ ctx[17], false, false, false),
    					listen_dev(button3, "click", /*buy_homing*/ ctx[18], false, false, false),
    					listen_dev(button4, "click", /*sell_homing*/ ctx[19], false, false, false),
    					listen_dev(button6, "click", /*buy_spore*/ ctx[20], false, false, false),
    					listen_dev(button7, "click", /*sell_spore*/ ctx[21], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$light_orb*/ 8 && t2_value !== (t2_value = /*$light_orb*/ ctx[3].value + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*$light_orb*/ 8 && t5_value !== (t5_value = sci(/*$light_orb*/ ctx[3].cost) + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*$homing_orb*/ 4 && t12_value !== (t12_value = /*$homing_orb*/ ctx[2].value + "")) set_data_dev(t12, t12_value);
    			if (dirty & /*$homing_orb*/ 4 && t15_value !== (t15_value = sci(/*$homing_orb*/ ctx[2].cost) + "")) set_data_dev(t15, t15_value);
    			if (dirty & /*$spore_orb*/ 1 && t22_value !== (t22_value = /*$spore_orb*/ ctx[0].value + "")) set_data_dev(t22, t22_value);
    			if (dirty & /*$spore_orb*/ 1 && t25_value !== (t25_value = sci(/*$spore_orb*/ ctx[0].cost) + "")) set_data_dev(t25, t25_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button2);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(button5);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(button8);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(156:2) {#if $got_mana}",
    		ctx
    	});

    	return block;
    }

    // (187:2) {#if $got_mana}
    function create_if_block(ctx) {
    	let span0;
    	let t0;
    	let t1_value = /*$light_orb*/ ctx[3].amount + "";
    	let t1;
    	let br0;
    	let t2;
    	let span1;
    	let t3;
    	let t4_value = /*$homing_orb*/ ctx[2].amount + "";
    	let t4;
    	let br1;
    	let t5;
    	let span2;
    	let t6;
    	let t7_value = /*$spore_orb*/ ctx[0].amount + "";
    	let t7;

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			t0 = text("Light Orbs: ");
    			t1 = text(t1_value);
    			br0 = element("br");
    			t2 = space();
    			span1 = element("span");
    			t3 = text("Homing Orbs: ");
    			t4 = text(t4_value);
    			br1 = element("br");
    			t5 = space();
    			span2 = element("span");
    			t6 = text("Spore Orbs: ");
    			t7 = text(t7_value);
    			set_style(span0, "color", "#00cccc");
    			add_location(span0, file$3, 187, 3, 5995);
    			add_location(br0, file$3, 187, 71, 6063);
    			set_style(span1, "color", "#cccc00");
    			add_location(span1, file$3, 188, 3, 6071);
    			add_location(br1, file$3, 188, 73, 6141);
    			set_style(span2, "color", "#ffaa00");
    			add_location(span2, file$3, 189, 3, 6149);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			append_dev(span0, t0);
    			append_dev(span0, t1);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, span1, anchor);
    			append_dev(span1, t3);
    			append_dev(span1, t4);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, span2, anchor);
    			append_dev(span2, t6);
    			append_dev(span2, t7);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$light_orb*/ 8 && t1_value !== (t1_value = /*$light_orb*/ ctx[3].amount + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*$homing_orb*/ 4 && t4_value !== (t4_value = /*$homing_orb*/ ctx[2].amount + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*$spore_orb*/ 1 && t7_value !== (t7_value = /*$spore_orb*/ ctx[0].amount + "")) set_data_dev(t7, t7_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(span1);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(span2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(187:2) {#if $got_mana}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let main;
    	let h30;
    	let t0;
    	let span0;
    	let t2;
    	let t3_value = sci(/*$mana*/ ctx[1]) + "";
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
    	let h31;
    	let span1;
    	let t18;
    	let t19_value = /*$basic_orb*/ ctx[4].amount + "";
    	let t19;
    	let br;
    	let t20;
    	let t21;
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
    			t3 = text(t3_value);
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
    			h31 = element("h3");
    			span1 = element("span");
    			t18 = text("Basic Orbs: ");
    			t19 = text(t19_value);
    			br = element("br");
    			t20 = space();
    			if (if_block2) if_block2.c();
    			t21 = space();
    			create_component(artifacts.$$.fragment);
    			set_style(span0, "font-weight", "normal");
    			add_location(span0, file$3, 126, 20, 3302);
    			attr_dev(h30, "id", "mana");
    			attr_dev(h30, "class", "svelte-1ga2rze");
    			add_location(h30, file$3, 126, 1, 3283);
    			attr_dev(div0, "id", "hold-btn");
    			attr_dev(div0, "class", "svelte-1ga2rze");
    			add_location(div0, file$3, 127, 1, 3368);
    			attr_dev(p, "class", "stat svelte-1ga2rze");
    			add_location(p, file$3, 149, 3, 4517);
    			attr_dev(button0, "class", "buy-sell svelte-1ga2rze");
    			add_location(button0, file$3, 151, 4, 4597);
    			attr_dev(button1, "class", "buy-sell svelte-1ga2rze");
    			add_location(button1, file$3, 152, 4, 4684);
    			attr_dev(div1, "class", "orb-info svelte-1ga2rze");
    			add_location(div1, file$3, 150, 3, 4570);
    			attr_dev(button2, "class", "trade-btn svelte-1ga2rze");
    			attr_dev(button2, "id", "basic-btn");
    			add_location(button2, file$3, 148, 2, 4467);
    			button3.disabled = true;
    			attr_dev(button3, "class", "svelte-1ga2rze");
    			add_location(button3, file$3, 182, 2, 5807);
    			attr_dev(div2, "id", "orb-row");
    			attr_dev(div2, "class", "svelte-1ga2rze");
    			add_location(div2, file$3, 147, 1, 4446);
    			set_style(span1, "color", "#ccc");
    			add_location(span1, file$3, 185, 2, 5904);
    			add_location(br, file$3, 185, 67, 5969);
    			attr_dev(h31, "id", "orb-stats");
    			attr_dev(h31, "class", "svelte-1ga2rze");
    			add_location(h31, file$3, 184, 1, 5882);
    			attr_dev(main, "class", "svelte-1ga2rze");
    			add_location(main, file$3, 125, 0, 3275);
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
    			append_dev(main, t17);
    			append_dev(main, h31);
    			append_dev(h31, span1);
    			append_dev(span1, t18);
    			append_dev(span1, t19);
    			append_dev(h31, br);
    			append_dev(h31, t20);
    			if (if_block2) if_block2.m(h31, null);
    			append_dev(main, t21);
    			mount_component(artifacts, main, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*buy_basic*/ ctx[14], false, false, false),
    					listen_dev(button1, "click", /*sell_basic*/ ctx[15], false, false, false),
    					listen_dev(button3, "click", /*click_handler_2*/ ctx[25], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*$mana*/ 2) && t3_value !== (t3_value = sci(/*$mana*/ ctx[1]) + "")) set_data_dev(t3, t3_value);

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

    			if ((!current || dirty & /*$basic_orb*/ 16) && t19_value !== (t19_value = /*$basic_orb*/ ctx[4].amount + "")) set_data_dev(t19, t19_value);

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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $spore_orb;
    	let $mana;
    	let $shifting;
    	let $homing_orb;
    	let $light_orb;
    	let $basic_orb;
    	let $cash;
    	let $canvas_toggled;
    	let $fighting;
    	let $fight_cost;
    	let $next_tower_lvl;
    	let $afford_fight;
    	let $auto_fight;
    	let $got_mana;
    	let $unlocked_fighting;
    	let $prestige;
    	let $rarities;
    	validate_store(spore_orb, 'spore_orb');
    	component_subscribe($$self, spore_orb, $$value => $$invalidate(0, $spore_orb = $$value));
    	validate_store(mana, 'mana');
    	component_subscribe($$self, mana, $$value => $$invalidate(1, $mana = $$value));
    	validate_store(shifting, 'shifting');
    	component_subscribe($$self, shifting, $$value => $$invalidate(27, $shifting = $$value));
    	validate_store(homing_orb, 'homing_orb');
    	component_subscribe($$self, homing_orb, $$value => $$invalidate(2, $homing_orb = $$value));
    	validate_store(light_orb, 'light_orb');
    	component_subscribe($$self, light_orb, $$value => $$invalidate(3, $light_orb = $$value));
    	validate_store(basic_orb, 'basic_orb');
    	component_subscribe($$self, basic_orb, $$value => $$invalidate(4, $basic_orb = $$value));
    	validate_store(cash, 'cash');
    	component_subscribe($$self, cash, $$value => $$invalidate(28, $cash = $$value));
    	validate_store(canvas_toggled, 'canvas_toggled');
    	component_subscribe($$self, canvas_toggled, $$value => $$invalidate(29, $canvas_toggled = $$value));
    	validate_store(fighting, 'fighting');
    	component_subscribe($$self, fighting, $$value => $$invalidate(10, $fighting = $$value));
    	validate_store(fight_cost, 'fight_cost');
    	component_subscribe($$self, fight_cost, $$value => $$invalidate(11, $fight_cost = $$value));
    	validate_store(next_tower_lvl, 'next_tower_lvl');
    	component_subscribe($$self, next_tower_lvl, $$value => $$invalidate(5, $next_tower_lvl = $$value));
    	validate_store(afford_fight, 'afford_fight');
    	component_subscribe($$self, afford_fight, $$value => $$invalidate(22, $afford_fight = $$value));
    	validate_store(auto_fight, 'auto_fight');
    	component_subscribe($$self, auto_fight, $$value => $$invalidate(6, $auto_fight = $$value));
    	validate_store(got_mana, 'got_mana');
    	component_subscribe($$self, got_mana, $$value => $$invalidate(7, $got_mana = $$value));
    	validate_store(unlocked_fighting, 'unlocked_fighting');
    	component_subscribe($$self, unlocked_fighting, $$value => $$invalidate(8, $unlocked_fighting = $$value));
    	validate_store(prestige, 'prestige');
    	component_subscribe($$self, prestige, $$value => $$invalidate(9, $prestige = $$value));
    	validate_store(rarities, 'rarities');
    	component_subscribe($$self, rarities, $$value => $$invalidate(12, $rarities = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Lab', slots, []);
    	set_store_value(afford_fight, $afford_fight = () => $cash >= $fight_cost, $afford_fight);

    	const click_fight = () => {
    		if ($cash < $fight_cost || $fighting) return;
    		set_store_value(cash, $cash -= $fight_cost, $cash);
    		set_store_value(fighting, $fighting = true, $fighting);
    		set_store_value(canvas_toggled, $canvas_toggled = true, $canvas_toggled);
    	};

    	//#endregion
    	let total_orbs = 0;

    	//#region | Basic Orb
    	const buy_basic = () => {
    		if ($cash < $basic_orb.cost) return;
    		set_store_value(cash, $cash -= $basic_orb.cost, $cash);
    		basic_orb.update(v => (v.cost += 10, v.amount++, v));

    		// basic_orb.update( v => (v.cost = Math.floor(v.cost*1.1), v.amount++, v) );
    		if ($shifting) buy_basic();
    	};

    	const sell_basic = () => {
    		if (total_orbs <= 1) return;
    		basic_orb.update(v => (v.cost -= 10, v.amount--, v));
    		set_store_value(cash, $cash += Math.floor($basic_orb.cost / 2), $cash);
    	}; // basic_orb.update( v => (v.cost = Math.ceil(v.cost/1.2), v.amount--, v) );

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
    		homing_orb.update(v => (v.cost += 2, v.amount++, v));
    		if ($shifting) buy_homing();
    	};

    	const sell_homing = () => {
    		if (total_orbs <= 1) return;
    		set_store_value(mana, $mana += Math.floor($homing_orb.cost / 2.2), $mana);
    		homing_orb.update(v => (v.cost -= 2, v.amount--, v));
    	};

    	//#endregion
    	//#region | Spore Orb
    	const buy_spore = () => {
    		if ($mana < $spore_orb.cost) return;
    		set_store_value(mana, $mana -= $spore_orb.cost, $mana);
    		spore_orb.update(v => (v.cost += 2, v.amount++, v));
    		if ($shifting) buy_spore();
    	};

    	const sell_spore = () => {
    		if (total_orbs <= 1) return;
    		set_store_value(mana, $mana += Math.floor($spore_orb.cost / 2.2), $mana);
    		spore_orb.update(v => (v.cost -= 2, v.amount--, v));
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Lab> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => set_store_value(auto_fight, $auto_fight = !$auto_fight, $auto_fight);
    	const click_handler_1 = () => click_fight();
    	const click_handler_2 = () => set_store_value(next_tower_lvl, $next_tower_lvl += 10, $next_tower_lvl);

    	$$self.$capture_state = () => ({
    		sci,
    		canvas_toggled,
    		fighting,
    		mana,
    		cash,
    		fight_cost,
    		auto_fight,
    		afford_fight,
    		basic_orb,
    		light_orb,
    		homing_orb,
    		spore_orb,
    		prestige,
    		rarities,
    		unlocked_fighting,
    		got_mana,
    		next_tower_lvl,
    		shifting,
    		Artifacts,
    		click_fight,
    		total_orbs,
    		buy_basic,
    		sell_basic,
    		buy_light,
    		sell_light,
    		buy_homing,
    		sell_homing,
    		buy_spore,
    		sell_spore,
    		$spore_orb,
    		$mana,
    		$shifting,
    		$homing_orb,
    		$light_orb,
    		$basic_orb,
    		$cash,
    		$canvas_toggled,
    		$fighting,
    		$fight_cost,
    		$next_tower_lvl,
    		$afford_fight,
    		$auto_fight,
    		$got_mana,
    		$unlocked_fighting,
    		$prestige,
    		$rarities
    	});

    	$$self.$inject_state = $$props => {
    		if ('total_orbs' in $$props) total_orbs = $$props.total_orbs;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$unlocked_fighting, $prestige*/ 768) {
    			if (!$unlocked_fighting && $prestige.times >= 5) set_store_value(unlocked_fighting, $unlocked_fighting = true, $unlocked_fighting);
    		}

    		if ($$self.$$.dirty & /*$got_mana, $mana*/ 130) {
    			if (!$got_mana && $mana > 0) set_store_value(got_mana, $got_mana = true, $got_mana);
    		}

    		if ($$self.$$.dirty & /*$next_tower_lvl*/ 32) {
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

    		if ($$self.$$.dirty & /*$auto_fight, $afford_fight*/ 4194368) {
    			{
    				if ($auto_fight) {
    					if ($afford_fight()) {
    						set_store_value(auto_fight, $auto_fight = true, $auto_fight);
    						click_fight();
    					} else set_store_value(auto_fight, $auto_fight = false, $auto_fight);
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*$next_tower_lvl*/ 32) {
    			//#region | Fight Button
    			set_store_value(fight_cost, $fight_cost = 1e3 * (1 + 1.2 * ($next_tower_lvl - 1)), $fight_cost);
    		}

    		if ($$self.$$.dirty & /*$basic_orb, $light_orb, $homing_orb, $spore_orb*/ 29) {
    			total_orbs = $basic_orb.amount + $light_orb.amount + $homing_orb.amount + $spore_orb.amount;
    		}
    	};

    	return [
    		$spore_orb,
    		$mana,
    		$homing_orb,
    		$light_orb,
    		$basic_orb,
    		$next_tower_lvl,
    		$auto_fight,
    		$got_mana,
    		$unlocked_fighting,
    		$prestige,
    		$fighting,
    		$fight_cost,
    		$rarities,
    		click_fight,
    		buy_basic,
    		sell_basic,
    		buy_light,
    		sell_light,
    		buy_homing,
    		sell_homing,
    		buy_spore,
    		sell_spore,
    		$afford_fight,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class Lab extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Lab",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/Settings.svelte generated by Svelte v3.46.4 */
    const file$2 = "src/components/Settings.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let div1;
    	let h3;
    	let t1;
    	let div0;
    	let button0;
    	let t3;
    	let button1;
    	let t5;
    	let button2;
    	let t7;
    	let button3;
    	let t9;
    	let button4;
    	let t11;
    	let hr;
    	let t12;
    	let div2;
    	let button5;
    	let t14;
    	let input0;
    	let t15;
    	let button6;
    	let t17;
    	let input1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div1 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Rendering Mode";
    			t1 = space();
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "Squares";
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "Circles";
    			t5 = space();
    			button2 = element("button");
    			button2.textContent = "Sand";
    			t7 = space();
    			button3 = element("button");
    			button3.textContent = "Pixelated";
    			t9 = space();
    			button4 = element("button");
    			button4.textContent = "None";
    			t11 = space();
    			hr = element("hr");
    			t12 = space();
    			div2 = element("div");
    			button5 = element("button");
    			button5.textContent = "Get Data";
    			t14 = space();
    			input0 = element("input");
    			t15 = space();
    			button6 = element("button");
    			button6.textContent = "Load Data";
    			t17 = space();
    			input1 = element("input");
    			attr_dev(h3, "class", "sect-title svelte-o8mkpq");
    			add_location(h3, file$2, 12, 2, 253);
    			attr_dev(button0, "class", "svelte-o8mkpq");
    			toggle_class(button0, "selected", /*$render_mode*/ ctx[4] == 0);
    			add_location(button0, file$2, 14, 3, 329);
    			attr_dev(button1, "class", "svelte-o8mkpq");
    			toggle_class(button1, "selected", /*$render_mode*/ ctx[4] == 1);
    			add_location(button1, file$2, 15, 3, 425);
    			attr_dev(button2, "class", "svelte-o8mkpq");
    			toggle_class(button2, "selected", /*$render_mode*/ ctx[4] == 2);
    			add_location(button2, file$2, 16, 3, 521);
    			attr_dev(button3, "class", "svelte-o8mkpq");
    			toggle_class(button3, "selected", /*$render_mode*/ ctx[4] == 3);
    			add_location(button3, file$2, 17, 3, 614);
    			attr_dev(button4, "class", "svelte-o8mkpq");
    			toggle_class(button4, "selected", /*$render_mode*/ ctx[4] == 4);
    			add_location(button4, file$2, 18, 3, 712);
    			attr_dev(div0, "class", "rendering-row svelte-o8mkpq");
    			add_location(div0, file$2, 13, 2, 298);
    			attr_dev(div1, "class", "sect");
    			add_location(div1, file$2, 11, 1, 232);
    			attr_dev(hr, "class", "svelte-o8mkpq");
    			add_location(hr, file$2, 21, 1, 820);
    			attr_dev(button5, "class", "svelte-o8mkpq");
    			add_location(button5, file$2, 23, 2, 857);
    			attr_dev(input0, "placeholder", "Your data will appear here");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "name", "get");
    			attr_dev(input0, "id", "get");
    			add_location(input0, file$2, 23, 70, 925);
    			attr_dev(button6, "class", "svelte-o8mkpq");
    			add_location(button6, file$2, 24, 2, 1034);
    			attr_dev(input1, "placeholder", "Paste your data here");
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "name", "load");
    			attr_dev(input1, "id", "load");
    			add_location(input1, file$2, 24, 70, 1102);
    			attr_dev(div2, "class", "sect svelte-o8mkpq");
    			attr_dev(div2, "id", "data");
    			add_location(div2, file$2, 22, 1, 826);
    			attr_dev(main, "id", "settings");
    			attr_dev(main, "class", "svelte-o8mkpq");
    			toggle_class(main, "open", /*open*/ ctx[1]);
    			add_location(main, file$2, 10, 0, 178);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div1);
    			append_dev(div1, h3);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t3);
    			append_dev(div0, button1);
    			append_dev(div0, t5);
    			append_dev(div0, button2);
    			append_dev(div0, t7);
    			append_dev(div0, button3);
    			append_dev(div0, t9);
    			append_dev(div0, button4);
    			append_dev(main, t11);
    			append_dev(main, hr);
    			append_dev(main, t12);
    			append_dev(main, div2);
    			append_dev(div2, button5);
    			append_dev(div2, t14);
    			append_dev(div2, input0);
    			set_input_value(input0, /*get_data_str*/ ctx[2]);
    			append_dev(div2, t15);
    			append_dev(div2, button6);
    			append_dev(div2, t17);
    			append_dev(div2, input1);
    			set_input_value(input1, /*load_data_str*/ ctx[3]);
    			/*main_binding*/ ctx[14](main);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[5], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[6], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[7], false, false, false),
    					listen_dev(button3, "click", /*click_handler_3*/ ctx[8], false, false, false),
    					listen_dev(button4, "click", /*click_handler_4*/ ctx[9], false, false, false),
    					listen_dev(button5, "click", /*click_handler_5*/ ctx[10], false, false, false),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[11]),
    					listen_dev(button6, "click", /*click_handler_6*/ ctx[12], false, false, false),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[13])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$render_mode*/ 16) {
    				toggle_class(button0, "selected", /*$render_mode*/ ctx[4] == 0);
    			}

    			if (dirty & /*$render_mode*/ 16) {
    				toggle_class(button1, "selected", /*$render_mode*/ ctx[4] == 1);
    			}

    			if (dirty & /*$render_mode*/ 16) {
    				toggle_class(button2, "selected", /*$render_mode*/ ctx[4] == 2);
    			}

    			if (dirty & /*$render_mode*/ 16) {
    				toggle_class(button3, "selected", /*$render_mode*/ ctx[4] == 3);
    			}

    			if (dirty & /*$render_mode*/ 16) {
    				toggle_class(button4, "selected", /*$render_mode*/ ctx[4] == 4);
    			}

    			if (dirty & /*get_data_str*/ 4 && input0.value !== /*get_data_str*/ ctx[2]) {
    				set_input_value(input0, /*get_data_str*/ ctx[2]);
    			}

    			if (dirty & /*load_data_str*/ 8 && input1.value !== /*load_data_str*/ ctx[3]) {
    				set_input_value(input1, /*load_data_str*/ ctx[3]);
    			}

    			if (dirty & /*open*/ 2) {
    				toggle_class(main, "open", /*open*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			/*main_binding*/ ctx[14](null);
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
    	let $render_mode;
    	validate_store(render_mode, 'render_mode');
    	component_subscribe($$self, render_mode, $$value => $$invalidate(4, $render_mode = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Settings', slots, []);
    	let { open } = $$props;
    	let { settings } = $$props;
    	let get_data_str = "";
    	let load_data_str = "";
    	const writable_props = ['open', 'settings'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Settings> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => set_store_value(render_mode, $render_mode = 0, $render_mode);
    	const click_handler_1 = () => set_store_value(render_mode, $render_mode = 1, $render_mode);
    	const click_handler_2 = () => set_store_value(render_mode, $render_mode = 2, $render_mode);
    	const click_handler_3 = () => set_store_value(render_mode, $render_mode = 3, $render_mode);
    	const click_handler_4 = () => set_store_value(render_mode, $render_mode = 4, $render_mode);
    	const click_handler_5 = () => $$invalidate(2, get_data_str = get_data());

    	function input0_input_handler() {
    		get_data_str = this.value;
    		$$invalidate(2, get_data_str);
    	}

    	const click_handler_6 = () => load_data(load_data_str);

    	function input1_input_handler() {
    		load_data_str = this.value;
    		$$invalidate(3, load_data_str);
    	}

    	function main_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			settings = $$value;
    			$$invalidate(0, settings);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('open' in $$props) $$invalidate(1, open = $$props.open);
    		if ('settings' in $$props) $$invalidate(0, settings = $$props.settings);
    	};

    	$$self.$capture_state = () => ({
    		render_mode,
    		get_data,
    		load_data,
    		open,
    		settings,
    		get_data_str,
    		load_data_str,
    		$render_mode
    	});

    	$$self.$inject_state = $$props => {
    		if ('open' in $$props) $$invalidate(1, open = $$props.open);
    		if ('settings' in $$props) $$invalidate(0, settings = $$props.settings);
    		if ('get_data_str' in $$props) $$invalidate(2, get_data_str = $$props.get_data_str);
    		if ('load_data_str' in $$props) $$invalidate(3, load_data_str = $$props.load_data_str);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		settings,
    		open,
    		get_data_str,
    		load_data_str,
    		$render_mode,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		input0_input_handler,
    		click_handler_6,
    		input1_input_handler,
    		main_binding
    	];
    }

    class Settings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { open: 1, settings: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Settings",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*open*/ ctx[1] === undefined && !('open' in props)) {
    			console.warn("<Settings> was created without expected prop 'open'");
    		}

    		if (/*settings*/ ctx[0] === undefined && !('settings' in props)) {
    			console.warn("<Settings> was created without expected prop 'settings'");
    		}
    	}

    	get open() {
    		throw new Error("<Settings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set open(value) {
    		throw new Error("<Settings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get settings() {
    		throw new Error("<Settings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set settings(value) {
    		throw new Error("<Settings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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
    	let t2;
    	let settings_1;
    	let updating_settings;
    	let updating_open;
    	let current;
    	let mounted;
    	let dispose;
    	shop = new Shop({ $$inline: true });
    	lab = new Lab({ $$inline: true });

    	function settings_1_settings_binding(value) {
    		/*settings_1_settings_binding*/ ctx[4](value);
    	}

    	function settings_1_open_binding(value) {
    		/*settings_1_open_binding*/ ctx[5](value);
    	}

    	let settings_1_props = {};

    	if (/*settings*/ ctx[1] !== void 0) {
    		settings_1_props.settings = /*settings*/ ctx[1];
    	}

    	if (/*settings_open*/ ctx[0] !== void 0) {
    		settings_1_props.open = /*settings_open*/ ctx[0];
    	}

    	settings_1 = new Settings({ props: settings_1_props, $$inline: true });
    	binding_callbacks.push(() => bind(settings_1, 'settings', settings_1_settings_binding));
    	binding_callbacks.push(() => bind(settings_1, 'open', settings_1_open_binding));

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(shop.$$.fragment);
    			t0 = space();
    			create_component(lab.$$.fragment);
    			t1 = space();
    			img = element("img");
    			t2 = space();
    			create_component(settings_1.$$.fragment);
    			attr_dev(img, "id", "settings");
    			if (!src_url_equal(img.src, img_src_value = "./assets/settings.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Settings");
    			attr_dev(img, "class", "svelte-1skdxqn");
    			add_location(img, file$1, 24, 1, 517);
    			attr_dev(main, "class", "svelte-1skdxqn");
    			add_location(main, file$1, 21, 0, 475);
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
    			append_dev(main, t2);
    			mount_component(settings_1, main, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(img, "click", /*toggled_settings*/ ctx[3], false, false, false),
    					listen_dev(main, "click", /*click*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const settings_1_changes = {};

    			if (!updating_settings && dirty & /*settings*/ 2) {
    				updating_settings = true;
    				settings_1_changes.settings = /*settings*/ ctx[1];
    				add_flush_callback(() => updating_settings = false);
    			}

    			if (!updating_open && dirty & /*settings_open*/ 1) {
    				updating_open = true;
    				settings_1_changes.open = /*settings_open*/ ctx[0];
    				add_flush_callback(() => updating_open = false);
    			}

    			settings_1.$set(settings_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shop.$$.fragment, local);
    			transition_in(lab.$$.fragment, local);
    			transition_in(settings_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shop.$$.fragment, local);
    			transition_out(lab.$$.fragment, local);
    			transition_out(settings_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(shop);
    			destroy_component(lab);
    			destroy_component(settings_1);
    			mounted = false;
    			run_all(dispose);
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
    	let settings_open = false;

    	/** @type {HTMLElement} */
    	let settings;

    	const click = e => {
    		/** @type {HTMLElement} */
    		const t = e.target;

    		if (!settings.contains(t)) $$invalidate(0, settings_open = false);
    		callback();

    		callback = () => {
    			
    		};
    	};

    	let callback = () => {
    		
    	};

    	const toggled_settings = () => {
    		callback = () => $$invalidate(0, settings_open = !settings_open);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Main> was created with unknown prop '${key}'`);
    	});

    	function settings_1_settings_binding(value) {
    		settings = value;
    		$$invalidate(1, settings);
    	}

    	function settings_1_open_binding(value) {
    		settings_open = value;
    		$$invalidate(0, settings_open);
    	}

    	$$self.$capture_state = () => ({
    		Shop,
    		Lab,
    		Settings,
    		settings_open,
    		settings,
    		click,
    		callback,
    		toggled_settings
    	});

    	$$self.$inject_state = $$props => {
    		if ('settings_open' in $$props) $$invalidate(0, settings_open = $$props.settings_open);
    		if ('settings' in $$props) $$invalidate(1, settings = $$props.settings);
    		if ('callback' in $$props) callback = $$props.callback;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		settings_open,
    		settings,
    		click,
    		toggled_settings,
    		settings_1_settings_binding,
    		settings_1_open_binding
    	];
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
    			attr_dev(main1, "class", "svelte-ggvzx0");
    			add_location(main1, file, 7, 0, 153);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Canvas, Main });
    	return [];
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