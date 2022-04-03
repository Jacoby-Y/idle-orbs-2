
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
    function to_number(value) {
        return value === '' ? null : +value;
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
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
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
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
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
    const floor_round = (num, place)=>{
      const pow = (Math.pow(10, place));
      return Math.floor(num * pow) / pow;
    };
    const num_shorts = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'O', 'N', 'D', 'UD', 'DD', 'TD', 'QuD', 'QiD', 'SxD', 'SpD', 'OD', 'ND', 'V', 'UV', 'DV', 'TV', 'QaV', 'QiV', 'SxV', 'SpV', 'OV', 'NV', 'T', 'UT', 'DT', 'TT', 'QaT', 'QiT', 'SxT', 'SpT', 'OT', 'NT'];
    const fnum = (num, round_to=1, i=0, past_thresh=false)=>{
        const div = num / 1000;
        const thresh = (i >= num_shorts.length);
        if (div < 1 || thresh) { 
          if (thresh) return (floor_round(num, round_to) + num_shorts[num_shorts.length-1]);
          else return (i == 0) ? (floor_round(num, round_to)) : (floor_round(num, round_to) + num_shorts[i]);
        }
        return fnum(div, round_to, i+1, thresh);
    };
    // console.log(add_comp(50, 6, 10));

    let run_n_save = null;
    const run_n = (func=()=>{}, n)=>{
      if (run_n_save == func) return;
      run_n_save = func;
      for (let i = 0; i < n; i++) func();
      run_n_save = null;
    };

    const spend_cash_add = (cash, cost, incr)=>{
      let i = 0;
      if (incr == 0) {
        i = Math.floor(cash/cost);
        cash -= i*cost;
      } else {
        for ([]; cost <= cash; (cost += incr, i++)) {
          cash -= cost;
        }
      }
      return {
        cash,
        cost,
        i,
      }
    };
    const spend_cash_mult = (cash, cost, incr)=>{
      let i = 0;
      if (incr == 0) {
        i = Math.floor(cash/cost);
        cash -= i*cost;
      } else {
        for ([]; cash > cost; (cost *= incr, i++)) {
          cash -= cost;
          console.log(cash);
        }
      }
      return {
        cash,
        cost,
        i,
      }
    };

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

    let w_index = 0;
    const w = (v)=>{
    	let k = `_${w_index}`;
    	default_vals[k] = (typeof v == "object" ? {...v} : v);
    	// store_keys.push(k);
    	writables[k] = writable(get_or(k, v));
    	w_index++;
    	return writables[k];
    };
    // const w = writable;

    // const store_keys = [];
    const writables = {};
    const default_vals = {};
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
    //#region | Shop
    const collector_pos = writable(250);
    const bounce = w({
    	power: 30,
    	power_cost: 250,
    	size: 75,
    	size_cost: 500,
    	auto_cost: 350,
    	auto_unlocked: false,
    	auto_on: true,
    });
    const starting_cash = w({
    	cost: 25,
    	amount: 0,
    });
    // export const orb_double = w({
    // 	cost: 50,
    // 	value: 0,
    // });
    const orb_mult = w(0);
    const orb_mult_cost = 5;
    //#endregion
    //#region | Orbs
    const basic_orb = w({
    	amount: 1,
    	cost: 50,
    	value: 1
    });
    const light_orb = w({
    	amount: 0,
    	cost: 100,
    	value: 1
    });
    const homing_orb = w({
    	amount: 0,
    	cost: 7,
    	value: 4,
    });
    const spore_orb = w({
    	amount: 0,
    	cost: 10,
    	value: 6,
    	sub_value: 0.5,
    });
    //#endregion
    //#region | Prestige
    const prestige = w({
    	cost: 1e5,
    	times: 0,
    });
    //#endregion
    //#region | Fighting
    const next_tower_lvl = w(1);
    const fight_cost = w(1e3);
    const unlocked_fighting = writable(false);
    const fighting = writable(false);
    const afford_fight = writable(()=> false );
    const auto_fight = writable(false);
    const rarities = writable({
    	c: 100, u: 0, r: 0, l: 0
    });
    //#endregion
    //#region | Mana
    const got_mana = w(false);
    const mana = w(0);
    //#endregion

    const canvas_toggled = writable(true);
    // export const shifting = writable(false);
    // export const ctrling = writable(false);
    /** Buy... 0: 1 | 1: 10 | 2: 100 | 3: Max */
    const buy_amount = writable(0);

    const render_mode = w(1);
    const max_render = w(100);
    const render_mod = w(1);

    const new_game_plus = w(false);

    const on_mobile = writable((/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)));

    const get_orb_bonus = ()=>{
    	const pt = get_store_value(prestige).times;
    	const mult = get_store_value(orb_mult);
    	const prest = (((pt-1)/2*pt)* 0.5) + (pt > 0 ? 0.5 : 0);
    	return 1 + prest + (mult/100)
    };


    const clear_storage = ()=>{
    	window.onbeforeunload = null;
    	localStorage.clear();
    	location.reload();
    };
    window.clear_storage = clear_storage;

    const set_to_default = ()=>{
    	// load_data(`0Zb9q.Z8"cZ:mtlbdZ80ZnmudpZ8{"cZnmudpabmqrZ81}"cZqgxdZ8(}cZqgxdabmqrZ8}""cZ9trmabmqrZ8{}"cZ9trmatljmbid_Z8,9jqdcZ9trmamlZ8rptd2cZqr9prglfab9q.Z80ZbmqrZ81}cZ9kmtlrZ8"2cZmp:aktjrZ8"cZ:9qgbamp:Z80Z9kmtlrZ8'cZbmqrZ8}"cZy9jtdZ8'2cZjgf.ramp:Z80Z9kmtlrZ8"cZbmqrZ8'""cZy9jtdZ8'2cZ.mkglfamp:Z80Z9kmtlrZ8"cZbmqrZ8(cZy9jtdZ832cZqnmpdamp:Z80Z9kmtlrZ8"cZbmqrZ8'"cZy9jtdZ85cZqt:ay9jtdZ8"e}2cZnpdqrgfdZ80ZbmqrZ8'"""""cZrgkdqZ8"2cZldvrarmudpajyjZ8'cZ,gf.rabmqrZ8'"""cZfmrak9l9Z8,9jqdcZk9l9Z8"cZpdl_dpakm_dZ8'cZk9vapdl_dpZ8'""cZpdl_dpakm_Z8'cZtljm9_argkdZ8'537)}7"))2`);
    	for (const k in default_vals) {
    		if (!Object.hasOwnProperty.call(default_vals, k)) continue;
    		const v = default_vals[k];
    		writables[k].set(v);
    	}
    };
    const set_new_game_plus = ()=>{
    	set_to_default();
    	new_game_plus.set(true);
    	fighting.set(false);
    };

    //#region | Offline
    const unload_time = w(Math.floor(Date.now()/1000));
    const load_time = writable(Math.floor(Date.now()/1000));
    const offline_time = writable(get_store_value(load_time) - get_store_value(unload_time));
    //#endregion
    //#region | Saving/Loading Data
    const chars = ` "'0_1{23}45(67)89:abcd,ef.ghijklmnopqrstyuvwxyzACBDEFGHIJKLMNOPQRSTYUVWXYZ`;
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
    		// get(reset_orbs)();
    	} catch (err) {
    		console.error(`Couldn't Load Data!\n${err}`);
    	}
    };

    const get_store_obj = ()=>{
    	let store_obj = {};
    	for (let i = 0; i < w_index; i++) {
    		store_obj[`_${i}`] = get_store_value(writables[`_${i}`]);
    	}
    	// store_keys.forEach((k)=> store_obj[k] = get(writables[k]) );
    	return store_obj;
    };
    console.log(get_store_obj());
    const store_to_local = ()=>{
    	unload_time.set(Math.floor(Date.now()/1000));
    	localStorage.IdleOrbs2 = JSON.stringify(get_store_obj());
    };

    window.onbeforeunload = store_to_local;
    //#endregion

    /* src/components/Canvas.svelte generated by Svelte v3.46.4 */

    const { console: console_1$1 } = globals;

    const file$6 = "src/components/Canvas.svelte";

    // (1161:2) {#if debug}
    function create_if_block_3$1(ctx) {
    	let t0;
    	let t1_value = fnum(/*cps*/ ctx[8]) + "";
    	let t1;
    	let t2;
    	let br0;
    	let t3;
    	let t4_value = fnum(/*calc_cps*/ ctx[2]) + "";
    	let t4;
    	let t5;
    	let br1;
    	let t6;
    	let t7;
    	let t8;
    	let t9;
    	let br2;
    	let t10;
    	let t11_value = fnum(/*total_orbs*/ ctx[12]) + "";
    	let t11;
    	let t12;
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
    			t8 = text(" | Min: ");
    			t9 = text(/*min_fps*/ ctx[10]);
    			br2 = element("br");
    			t10 = text(" \n\t\t\tTotal Orbs: ");
    			t11 = text(t11_value);
    			t12 = space();
    			br3 = element("br");
    			add_location(br0, file$6, 1161, 22, 34048);
    			add_location(br1, file$6, 1162, 32, 34086);
    			add_location(br2, file$6, 1163, 30, 34122);
    			add_location(br3, file$6, 1164, 34, 34162);
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
    			insert_dev(target, t9, anchor);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, br3, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*cps*/ 256 && t1_value !== (t1_value = fnum(/*cps*/ ctx[8]) + "")) set_data_dev(t1, t1_value);
    			if (dirty[0] & /*calc_cps*/ 4 && t4_value !== (t4_value = fnum(/*calc_cps*/ ctx[2]) + "")) set_data_dev(t4, t4_value);
    			if (dirty[0] & /*fps*/ 512) set_data_dev(t7, /*fps*/ ctx[9]);
    			if (dirty[0] & /*min_fps*/ 1024) set_data_dev(t9, /*min_fps*/ ctx[10]);
    			if (dirty[0] & /*total_orbs*/ 4096 && t11_value !== (t11_value = fnum(/*total_orbs*/ ctx[12]) + "")) set_data_dev(t11, t11_value);
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
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(br3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(1161:2) {#if debug}",
    		ctx
    	});

    	return block;
    }

    // (1168:1) {#if $bounce.auto_unlocked}
    function create_if_block_2$1(ctx) {
    	let h3;
    	let t0_value = (/*$on_mobile*/ ctx[17] ? "Tap" : "Press \"Tab\"") + "";
    	let t0;
    	let t1;
    	let t2_value = (/*$bounce*/ ctx[3].auto_on ? "off" : "on") + "";
    	let t2;
    	let t3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = text(" to turn ");
    			t2 = text(t2_value);
    			t3 = text(" auto bounce");
    			attr_dev(h3, "id", "toggle-bounce");
    			set_style(h3, "bottom", /*$bounce*/ ctx[3].size + "px");
    			attr_dev(h3, "class", "svelte-1415m0o");
    			toggle_class(h3, "no-click", !/*$toggled*/ ctx[5]);
    			add_location(h3, file$6, 1168, 2, 34397);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t0);
    			append_dev(h3, t1);
    			append_dev(h3, t2);
    			append_dev(h3, t3);

    			if (!mounted) {
    				dispose = listen_dev(h3, "click", /*click_handler_1*/ ctx[28], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$on_mobile*/ 131072 && t0_value !== (t0_value = (/*$on_mobile*/ ctx[17] ? "Tap" : "Press \"Tab\"") + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*$bounce*/ 8 && t2_value !== (t2_value = (/*$bounce*/ ctx[3].auto_on ? "off" : "on") + "")) set_data_dev(t2, t2_value);

    			if (dirty[0] & /*$bounce*/ 8) {
    				set_style(h3, "bottom", /*$bounce*/ ctx[3].size + "px");
    			}

    			if (dirty[0] & /*$toggled*/ 32) {
    				toggle_class(h3, "no-click", !/*$toggled*/ ctx[5]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(1168:1) {#if $bounce.auto_unlocked}",
    		ctx
    	});

    	return block;
    }

    // (1171:1) {#if $fighting}
    function create_if_block_1$2(ctx) {
    	let button;
    	let t1;
    	let div;
    	let h30;
    	let t2;
    	let t3;
    	let t4;
    	let h31;
    	let t5_value = /*monster_manager*/ ctx[11].name + "";
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
    			t3 = text(/*$next_tower_lvl*/ ctx[16]);
    			t4 = space();
    			h31 = element("h3");
    			t5 = text(t5_value);
    			t6 = space();
    			img = element("img");
    			attr_dev(button, "id", "quit");
    			attr_dev(button, "class", "svelte-1415m0o");
    			add_location(button, file$6, 1171, 2, 34672);
    			attr_dev(h30, "id", "lvl");
    			attr_dev(h30, "class", "svelte-1415m0o");
    			add_location(h30, file$6, 1179, 3, 35002);
    			attr_dev(h31, "id", "name");
    			attr_dev(h31, "class", "svelte-1415m0o");
    			add_location(h31, file$6, 1180, 3, 35062);
    			if (!src_url_equal(img.src, img_src_value = /*monster_manager*/ ctx[11].src)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "monster Icon");
    			set_style(img, "width", (/*monster_manager*/ ctx[11].pt2.y - /*monster_manager*/ ctx[11].pt1.y) / 2 + "px");
    			set_style(img, "height", (/*monster_manager*/ ctx[11].pt2.y - /*monster_manager*/ ctx[11].pt1.y) / 2 + "px");
    			attr_dev(img, "class", "svelte-1415m0o");
    			add_location(img, file$6, 1181, 3, 35107);
    			attr_dev(div, "id", "monster-info");
    			set_style(div, "left", /*monster_manager*/ ctx[11].pt1.x + "px");
    			set_style(div, "top", /*monster_manager*/ ctx[11].pt1.y + "px");
    			set_style(div, "width", /*monster_manager*/ ctx[11].pt2.x - /*monster_manager*/ ctx[11].pt1.x + "px");
    			set_style(div, "height", /*monster_manager*/ ctx[11].pt2.y - /*monster_manager*/ ctx[11].pt1.y + "px");
    			attr_dev(div, "class", "svelte-1415m0o");
    			add_location(div, file$6, 1172, 2, 34764);
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
    				dispose = listen_dev(button, "click", /*click_handler_2*/ ctx[29], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$next_tower_lvl*/ 65536) set_data_dev(t3, /*$next_tower_lvl*/ ctx[16]);
    			if (dirty[0] & /*monster_manager*/ 2048 && t5_value !== (t5_value = /*monster_manager*/ ctx[11].name + "")) set_data_dev(t5, t5_value);

    			if (dirty[0] & /*monster_manager*/ 2048 && !src_url_equal(img.src, img_src_value = /*monster_manager*/ ctx[11].src)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty[0] & /*monster_manager*/ 2048) {
    				set_style(img, "width", (/*monster_manager*/ ctx[11].pt2.y - /*monster_manager*/ ctx[11].pt1.y) / 2 + "px");
    			}

    			if (dirty[0] & /*monster_manager*/ 2048) {
    				set_style(img, "height", (/*monster_manager*/ ctx[11].pt2.y - /*monster_manager*/ ctx[11].pt1.y) / 2 + "px");
    			}

    			if (dirty[0] & /*monster_manager*/ 2048) {
    				set_style(div, "left", /*monster_manager*/ ctx[11].pt1.x + "px");
    			}

    			if (dirty[0] & /*monster_manager*/ 2048) {
    				set_style(div, "top", /*monster_manager*/ ctx[11].pt1.y + "px");
    			}

    			if (dirty[0] & /*monster_manager*/ 2048) {
    				set_style(div, "width", /*monster_manager*/ ctx[11].pt2.x - /*monster_manager*/ ctx[11].pt1.x + "px");
    			}

    			if (dirty[0] & /*monster_manager*/ 2048) {
    				set_style(div, "height", /*monster_manager*/ ctx[11].pt2.y - /*monster_manager*/ ctx[11].pt1.y + "px");
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
    		source: "(1171:1) {#if $fighting}",
    		ctx
    	});

    	return block;
    }

    // (1185:1) {#if show_earnings}
    function create_if_block$3(ctx) {
    	let div;
    	let h3;
    	let t0;
    	let t1_value = fnum(/*offline_gain*/ ctx[6]) + "";
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
    			attr_dev(h3, "class", "svelte-1415m0o");
    			add_location(h3, file$6, 1186, 3, 35389);
    			attr_dev(div, "id", "offline");
    			attr_dev(div, "class", "svelte-1415m0o");
    			add_location(div, file$6, 1185, 2, 35328);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(h3, t0);
    			append_dev(h3, t1);
    			append_dev(h3, t2);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler_3*/ ctx[30], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*offline_gain*/ 64 && t1_value !== (t1_value = fnum(/*offline_gain*/ ctx[6]) + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(1185:1) {#if show_earnings}",
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
    	let t2_value = fnum(/*$cash*/ ctx[14]) + "";
    	let t2;
    	let t3;
    	let br;
    	let t4;
    	let h30_style_value;
    	let t5;
    	let h31;
    	let t6_value = (/*$on_mobile*/ ctx[17] ? "Tap" : "Press \"Esc\"") + "";
    	let t6;
    	let t7;
    	let t8;
    	let t9;
    	let t10;
    	let mounted;
    	let dispose;
    	let if_block0 = /*debug*/ ctx[13] && create_if_block_3$1(ctx);
    	let if_block1 = /*$bounce*/ ctx[3].auto_unlocked && create_if_block_2$1(ctx);
    	let if_block2 = /*$fighting*/ ctx[4] && create_if_block_1$2(ctx);
    	let if_block3 = /*show_earnings*/ ctx[7] && create_if_block$3(ctx);

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
    			t6 = text(t6_value);
    			t7 = text(" to toggle shop");
    			t8 = space();
    			if (if_block1) if_block1.c();
    			t9 = space();
    			if (if_block2) if_block2.c();
    			t10 = space();
    			if (if_block3) if_block3.c();
    			attr_dev(canvas_1, "class", "svelte-1415m0o");
    			add_location(canvas_1, file$6, 1156, 1, 33874);
    			add_location(br, file$6, 1159, 22, 34005);
    			attr_dev(h30, "id", "cash");
    			attr_dev(h30, "style", h30_style_value = /*debug*/ ctx[13] ? "background-color: #000000bb;" : "");
    			attr_dev(h30, "class", "svelte-1415m0o");
    			add_location(h30, file$6, 1158, 1, 33914);
    			attr_dev(h31, "id", "toggle-txt");
    			set_style(h31, "bottom", /*$bounce*/ ctx[3].size + "px");
    			attr_dev(h31, "class", "svelte-1415m0o");
    			toggle_class(h31, "no-click", !/*$toggled*/ ctx[5]);
    			add_location(h31, file$6, 1166, 1, 34183);
    			set_style(main_1, "opacity", /*$toggled*/ ctx[5] ? "1" : "0");
    			set_style(main_1, "pointer-events", /*$toggled*/ ctx[5] ? "all" : "none");
    			attr_dev(main_1, "class", "svelte-1415m0o");
    			add_location(main_1, file$6, 1155, 0, 33763);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main_1, anchor);
    			append_dev(main_1, canvas_1);
    			/*canvas_1_binding*/ ctx[26](canvas_1);
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
    			append_dev(h31, t7);
    			append_dev(main_1, t8);
    			if (if_block1) if_block1.m(main_1, null);
    			append_dev(main_1, t9);
    			if (if_block2) if_block2.m(main_1, null);
    			append_dev(main_1, t10);
    			if (if_block3) if_block3.m(main_1, null);
    			/*main_1_binding*/ ctx[31](main_1);

    			if (!mounted) {
    				dispose = listen_dev(h31, "click", /*click_handler*/ ctx[27], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$cash*/ 16384 && t2_value !== (t2_value = fnum(/*$cash*/ ctx[14]) + "")) set_data_dev(t2, t2_value);

    			if (/*debug*/ ctx[13]) {
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

    			if (dirty[0] & /*debug*/ 8192 && h30_style_value !== (h30_style_value = /*debug*/ ctx[13] ? "background-color: #000000bb;" : "")) {
    				attr_dev(h30, "style", h30_style_value);
    			}

    			if (dirty[0] & /*$on_mobile*/ 131072 && t6_value !== (t6_value = (/*$on_mobile*/ ctx[17] ? "Tap" : "Press \"Esc\"") + "")) set_data_dev(t6, t6_value);

    			if (dirty[0] & /*$bounce*/ 8) {
    				set_style(h31, "bottom", /*$bounce*/ ctx[3].size + "px");
    			}

    			if (dirty[0] & /*$toggled*/ 32) {
    				toggle_class(h31, "no-click", !/*$toggled*/ ctx[5]);
    			}

    			if (/*$bounce*/ ctx[3].auto_unlocked) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2$1(ctx);
    					if_block1.c();
    					if_block1.m(main_1, t9);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*$fighting*/ ctx[4]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_1$2(ctx);
    					if_block2.c();
    					if_block2.m(main_1, t10);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*show_earnings*/ ctx[7]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block$3(ctx);
    					if_block3.c();
    					if_block3.m(main_1, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (dirty[0] & /*$toggled*/ 32) {
    				set_style(main_1, "opacity", /*$toggled*/ ctx[5] ? "1" : "0");
    			}

    			if (dirty[0] & /*$toggled*/ 32) {
    				set_style(main_1, "pointer-events", /*$toggled*/ ctx[5] ? "all" : "none");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main_1);
    			/*canvas_1_binding*/ ctx[26](null);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			/*main_1_binding*/ ctx[31](null);
    			mounted = false;
    			dispose();
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
    	let $bounce;
    	let $spore_orb;
    	let $homing_orb;
    	let $light_orb;
    	let $basic_orb;
    	let $fighting;
    	let $fight_cost;
    	let $cash;
    	let $auto_fight;
    	let $afford_fight;
    	let $next_tower_lvl;
    	let $mana;
    	let $rarities;
    	let $new_game_plus;
    	let $toggled;
    	let $buy_amount;
    	let $render_mode;
    	let $render_mod;
    	let $offline_time;
    	let $collector_pos;
    	let $timer;
    	let $max_render;
    	let $orb_mult;
    	let $prestige;
    	let $on_mobile;
    	validate_store(bounce, 'bounce');
    	component_subscribe($$self, bounce, $$value => $$invalidate(3, $bounce = $$value));
    	validate_store(spore_orb, 'spore_orb');
    	component_subscribe($$self, spore_orb, $$value => $$invalidate(20, $spore_orb = $$value));
    	validate_store(homing_orb, 'homing_orb');
    	component_subscribe($$self, homing_orb, $$value => $$invalidate(21, $homing_orb = $$value));
    	validate_store(light_orb, 'light_orb');
    	component_subscribe($$self, light_orb, $$value => $$invalidate(22, $light_orb = $$value));
    	validate_store(basic_orb, 'basic_orb');
    	component_subscribe($$self, basic_orb, $$value => $$invalidate(23, $basic_orb = $$value));
    	validate_store(fighting, 'fighting');
    	component_subscribe($$self, fighting, $$value => $$invalidate(4, $fighting = $$value));
    	validate_store(fight_cost, 'fight_cost');
    	component_subscribe($$self, fight_cost, $$value => $$invalidate(53, $fight_cost = $$value));
    	validate_store(cash, 'cash');
    	component_subscribe($$self, cash, $$value => $$invalidate(14, $cash = $$value));
    	validate_store(auto_fight, 'auto_fight');
    	component_subscribe($$self, auto_fight, $$value => $$invalidate(15, $auto_fight = $$value));
    	validate_store(afford_fight, 'afford_fight');
    	component_subscribe($$self, afford_fight, $$value => $$invalidate(54, $afford_fight = $$value));
    	validate_store(next_tower_lvl, 'next_tower_lvl');
    	component_subscribe($$self, next_tower_lvl, $$value => $$invalidate(16, $next_tower_lvl = $$value));
    	validate_store(mana, 'mana');
    	component_subscribe($$self, mana, $$value => $$invalidate(55, $mana = $$value));
    	validate_store(rarities, 'rarities');
    	component_subscribe($$self, rarities, $$value => $$invalidate(56, $rarities = $$value));
    	validate_store(new_game_plus, 'new_game_plus');
    	component_subscribe($$self, new_game_plus, $$value => $$invalidate(57, $new_game_plus = $$value));
    	validate_store(canvas_toggled, 'toggled');
    	component_subscribe($$self, canvas_toggled, $$value => $$invalidate(5, $toggled = $$value));
    	validate_store(buy_amount, 'buy_amount');
    	component_subscribe($$self, buy_amount, $$value => $$invalidate(58, $buy_amount = $$value));
    	validate_store(render_mode, 'render_mode');
    	component_subscribe($$self, render_mode, $$value => $$invalidate(59, $render_mode = $$value));
    	validate_store(render_mod, 'render_mod');
    	component_subscribe($$self, render_mod, $$value => $$invalidate(60, $render_mod = $$value));
    	validate_store(offline_time, 'offline_time');
    	component_subscribe($$self, offline_time, $$value => $$invalidate(61, $offline_time = $$value));
    	validate_store(collector_pos, 'collector_pos');
    	component_subscribe($$self, collector_pos, $$value => $$invalidate(62, $collector_pos = $$value));
    	validate_store(timer, 'timer');
    	component_subscribe($$self, timer, $$value => $$invalidate(63, $timer = $$value));
    	validate_store(max_render, 'max_render');
    	component_subscribe($$self, max_render, $$value => $$invalidate(64, $max_render = $$value));
    	validate_store(orb_mult, 'orb_mult');
    	component_subscribe($$self, orb_mult, $$value => $$invalidate(24, $orb_mult = $$value));
    	validate_store(prestige, 'prestige');
    	component_subscribe($$self, prestige, $$value => $$invalidate(25, $prestige = $$value));
    	validate_store(on_mobile, 'on_mobile');
    	component_subscribe($$self, on_mobile, $$value => $$invalidate(17, $on_mobile = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Canvas', slots, []);

    	const reset_orbs = () => {
    		orbs.free_all();

    		for (let i = 0; i < $basic_orb.amount; i++) {
    			if (i >= $max_render) {
    				$$invalidate(18, orbs.over.basic = $basic_orb.amount - $max_render, orbs);
    				break;
    			}

    			orbs.new.basic(Math.round(Math.random() * 1000), 580, 0, 0);
    		}

    		for (let i = 0; i < $light_orb.amount; i++) {
    			if (i >= $max_render) {
    				$$invalidate(18, orbs.over.light = $light_orb.amount - $max_render, orbs);
    				break;
    			}

    			orbs.new.light(Math.round(Math.random() * 1000), 580, 0, 0);
    		}

    		for (let i = 0; i < $homing_orb.amount; i++) {
    			if (i >= $max_render) {
    				$$invalidate(18, orbs.over.homing = $homing_orb.amount - $max_render, orbs);
    				break;
    			}

    			orbs.new.homing(Math.round(Math.random() * 1000), 580, 0, 0);
    		}

    		for (let i = 0; i < $spore_orb.amount; i++) {
    			if (i >= $max_render) {
    				$$invalidate(18, orbs.over.spore = $spore_orb.amount - $max_render, orbs);
    				break;
    			}

    			orbs.new.spore(Math.round(Math.random() * 1000), 580, 0, 0);
    		}
    	};

    	/** Sets orbs value based on prestige times and the orb multiplier */
    	const set_orb_values = () => {
    		basic_orb.update(v => (v.value = 1 * get_orb_bonus() / ($new_game_plus ? 2 : 1), v));
    		light_orb.update(v => (v.value = 1 * get_orb_bonus() / ($new_game_plus ? 2 : 1), v));
    		homing_orb.update(v => (v.value = 4 * get_orb_bonus() / ($new_game_plus ? 2 : 1), v));
    		spore_orb.update(v => (v.value = 6 * get_orb_bonus() / ($new_game_plus ? 2 : 1), v.sub_value = 0.5 * get_orb_bonus() / ($new_game_plus ? 2 : 1), v));
    	};

    	//#endregion
    	//#region | Canvas
    	/** <main> holding all html of the game (not shop) */
    	let main;

    	/** @type {HTMLCanvasElement}*/
    	let canvas;

    	/** @type {CanvasRenderingContext2D}*/
    	let ctx;

    	/** Causes main_loop to not run if true */
    	let pause = false;

    	/** If paused is true: then it runs main_loop once and goes back to being paused */
    	let step = false;

    	/** Width and height of canvas */
    	let w, h;

    	//#endregion
    	//#region | Orbs
    	//#region | Functions for Orbs
    	/** Gets distance between two objects with an x and y number property */
    	const distance = (pos1, pos2) => {
    		let y = pos2.y - pos1.y;
    		let x = pos2.x - pos1.x;
    		return Math.sqrt(x * x + y * y);
    	};

    	//#endregion
    	/** holds all info on updating, drawing, and collecting orbs */
    	const orbs = (() => {
    		const basic = { l: [], max: 100, over: 0 };
    		const light = { l: [], max: 100, over: 0 };
    		const homing = { l: [], max: 100, over: 0 };
    		const spore = { l: [], max: 100, over: 0 };
    		const sub_spore = { l: [], max: 100, over: 0, life_span: 100 };
    		const shadow = { l: [], max: 100, over: 0, life_span: 100 };
    		let cash_hold = 0;
    		let coll_num = 0;

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
    			update(draw = true) {
    				if (basic.max != $max_render) {
    					basic.max = $max_render;
    					light.max = $max_render;
    					homing.max = $max_render;
    					spore.max = $max_render;
    					sub_spore.max = $max_render;
    					shadow.max = $max_render;
    					reset_orbs();
    					return;
    				}

    				const all = [].concat(basic.l).concat(light.l).concat(homing.l).concat(spore.l).concat(sub_spore.l).concat(shadow.l); //...

    				for (let i = 0; i < basic.l.length; i++) {
    					const orb = basic.l[i];
    					ctx.fillStyle = "#e3ffcfdd";

    					if (draw) {
    						// console.log("rendering orb!");
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
    					}

    					orb.vx *= 0.98;
    					orb.vy *= 0.98;

    					if (!$fighting) {
    						if (orb.ly <= $collector_pos && orb.y > $collector_pos || orb.ly >= $collector_pos && orb.y < $collector_pos) {
    							cash_hold += this.value.basic; //$basic_orb.value + (($basic_orb.value * basic.over)/basic.l.length);
    							coll_num++;
    						}
    					} else {
    						const hit = collide_monster(orb);
    						if (hit) monster_manager.hit(this.value.basic);
    					}
    				}

    				for (let i = 0; i < light.l.length; i++) {
    					const orb = light.l[i];
    					ctx.fillStyle = "#aae8e088";

    					if (draw) {
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
    					}

    					orb.vx *= 0.99;
    					orb.vy *= 0.99;

    					if (!$fighting) {
    						if (orb.ly <= $collector_pos && orb.y > $collector_pos || orb.ly >= $collector_pos && orb.y < $collector_pos) {
    							cash_hold += this.value.light; //$light_orb.value + (($light_orb.value * light.over)/light.l.length);
    							coll_num++;
    						}
    					} else {
    						const hit = collide_monster(orb);
    						if (hit) monster_manager.hit(this.value.light);
    					}
    				}

    				for (let i = 0; i < homing.l.length; i++) {
    					const orb = homing.l[i];

    					if (draw) {
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
    							cash_hold += this.value.homing;
    							coll_num++;
    						}
    					} else {
    						const hit = collide_monster(orb);
    						if (hit) monster_manager.hit(this.value.homing);
    					}
    				}

    				for (let i = 0; i < spore.l.length; i++) {
    					const orb = spore.l[i];
    					ctx.fillStyle = "#dfac33dd";

    					if (draw) {
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
    					}

    					orb.vx *= 0.98;
    					orb.vy *= 0.98;

    					if (!$fighting) {
    						if (orb.ly <= $collector_pos && orb.y > $collector_pos || orb.ly >= $collector_pos && orb.y < $collector_pos) {
    							cash_hold += this.value.spore; //$spore_orb.value + (($spore_orb.value * spore.over)/spore.l.length);
    							coll_num++;
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

    					if (draw) {
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
    					}

    					orb.vx *= 0.98;
    					orb.vy *= 0.98;

    					if (!$fighting) {
    						if (orb.ly <= $collector_pos && orb.y > $collector_pos || orb.ly >= $collector_pos && orb.y < $collector_pos) {
    							cash_hold += this.value.sub_spore; //$spore_orb.sub_value + (($spore_orb.sub_value * sub_spore.over)/sub_spore.l.length);
    							coll_num++;
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

    					if (draw) {
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
    					}

    					// orb.vx *= 0.99;
    					// orb.vy *= 0.99;
    					orb.vy--;

    					if (!$fighting) {
    						if (orb.ly <= $collector_pos && orb.y > $collector_pos || orb.ly >= $collector_pos && orb.y < $collector_pos) {
    							cash_hold += total_value / 2; //($basic_orb.value*10) + ((($basic_orb.value*10) * basic.over)/basic.l.length);
    							coll_num++;
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

    						if (collided && is_spore && (Math.abs(orb.vx) > 1 || orb.vy > 5 || Math.abs(orb.vy) > 15)) this.new.sub_spore(orb.x, orb.y, orb.vx * 2, orb.vy * 2);
    					} else continue;
    				}

    				if (cash_hold >= 1) {
    					set_store_value(cash, $cash += Math.floor(cash_hold), $cash);
    					cash_hold -= Math.floor(cash_hold);
    				}
    			},
    			bounce(pos) {
    				if (pause) return;

    				for (let i = 0; i < basic.l.length; i++) {
    					const orb = basic.l[i];
    					if (orb.y < 600 - $bounce.size - 30) continue;
    					orb.vx += Math.random() - 0.5;
    					orb.vy -= $bounce.power + Math.random() * -5;
    					if (pos != null) orb.vx += (pos.x - 10 - orb.x) / 100 * (Math.random() * 0.5 + 0.5);
    					orb.grounded = false;
    				}

    				for (let i = 0; i < light.l.length; i++) {
    					const orb = light.l[i];
    					if (orb.y < 600 - $bounce.size - 30) continue;
    					orb.vx += Math.random() - 0.5;
    					if (orb.vy > 0) orb.vy = -1 * ($bounce.power - Math.random() * -5); else orb.vy -= $bounce.power + Math.random() * -5;
    					if (pos != null) orb.vx += (pos.x - 10 - orb.x) / 100 * (Math.random() * 0.5 + 0.5);
    					orb.grounded = false;
    				}

    				for (let i = 0; i < spore.l.length; i++) {
    					const orb = spore.l[i];
    					if (orb.y < 600 - $bounce.size - 30) continue;
    					orb.vx += Math.random() - 0.5;
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
    			over: {
    				set basic(x) {
    					basic.over = x;
    				},
    				set light(x) {
    					light.over = x;
    				},
    				set homing(x) {
    					homing.over = x;
    				},
    				set spore(x) {
    					spore.over = x;
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
    			},
    			get coll_num() {
    				return coll_num;
    			},
    			set coll_num(x) {
    				coll_num = x;
    			}
    		};
    	})();

    	//#endregion
    	//#region | Cash/Sec
    	let calc_cps = 0;

    	let offline_get = false;
    	let offline_gain = 0;
    	let show_earnings = true;

    	const check_cps = () => {
    		// console.log(`Check cps! offline: ${calc_cps*$offline_time}`);
    		$$invalidate(19, offline_get = true);

    		$$invalidate(6, offline_gain = calc_cps * $offline_time);
    		set_store_value(cash, $cash += offline_gain, $cash);
    	};

    	let total_value = 0;
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
    	let fps_list = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    	let min_fps = 1000;
    	let fps_index = 0;
    	let render_tick = 1;

    	const main_loop = v => {
    		if (pause && !step) return;
    		if (step) step = false;
    		before_frame = Date.now();

    		// if (render_tick >= $render_mod)
    		if (!$toggled || render_tick < $render_mod) {
    			if ($toggled) render_tick++;
    			orbs.update(false);
    			manager.update(0, false);
    			auto_bounce_loop(v);
    			return;
    		}

    		if (render_tick >= $render_mod) render_tick = 1;

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
    		const frame_time = Math.round(1000 / (after_frame - before_frame));
    		fps_list[fps_index] = frame_time;
    		$$invalidate(10, min_fps = Math.min(min_fps, frame_time));
    		if (fps_index >= fps_list.length - 1) fps_index = 0; else fps_index++;
    		$$invalidate(9, fps = Math.min(1000, Math.round(fps_list.reduce((p, c) => p + c) / fps_list.length)));
    	}; // console.log(fps);

    	onMount(() => {
    		ctx = canvas.getContext("2d");
    		$$invalidate(1, canvas.width = 1000, canvas);
    		$$invalidate(1, canvas.height = 600, canvas);
    		w = canvas.width;
    		h = canvas.height;
    		reset_orbs();
    		timer.subscribe(main_loop);
    	}); // key_up({ key: "Escape" });

    	//#endregion
    	//#region | Events
    	//#region | Mouse
    	const mouse = { x: 0, y: 0, hovering: false };

    	/** @param {MouseEvent} e*/
    	const mouse_move = e => {
    		const [x, y] = e.offsetX == 0
    		? [e.layerX, e.layerY]
    		: [e.offsetX, e.offsetY];

    		[mouse.x, mouse.y] = [x, y];
    	};

    	const mouse_enter = () => mouse.hovering = true;
    	const mouse_leave = () => mouse.hovering = false;
    	let last_click = Date.now();

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
    		if (Date.now() - last_click < 200) return;
    		orbs.bounce({ x, y });
    		small_explosion(ctx, [x, y]);
    		last_click = Date.now();
    	};

    	//#endregion
    	//#region | Keys
    	let last_buy_amount = $buy_amount;

    	const key_up = e => {
    		const k = e.key;
    		if (k == "d") $$invalidate(13, debug = !debug); else if (k == "Escape") set_store_value(canvas_toggled, $toggled = !$toggled, $toggled); else if (k == "Tab" && $bounce.auto_unlocked) bounce.update(v => (v.auto_on = !v.auto_on, v)); else if (k == "o") console.log(orbs.basic); else if (k == "r") reset_orbs(); else if (k == "Shift") set_store_value(buy_amount, $buy_amount = last_buy_amount, $buy_amount); // ($bounce.auto_on = !$bounce.auto_on, $bounce = $bounce);

    		// else if (k == "Shift") $shifting = false;
    		// else if (k == "Control") $ctrling = false;
    		if (!debug) return;

    		if (k == "s") step = !step; else if (k == " ") pause = !pause; else // else if (k == "l") console.log(orbs.list.length + orbs.homing.length);
    		if (k == "a") console.log(monster_manager); else // else if (k == "c") $cash += 10000;
    		if (k == "b") orbs.bounce(null); else if (k == "M") set_store_value(mana, $mana += 1e20, $mana); else if (k == "m") set_store_value(mana, $mana += 100, $mana); else if (k == "1") basic_orb.update(v => (v.amount++, v)); else if (k == "2") light_orb.update(v => (v.amount++, v)); else if (k == "3") homing_orb.update(v => (v.amount++, v)); else if (k == "4") spore_orb.update(v => (v.amount++, v)); else if (k == "!") basic_orb.update(v => (v.amount > 0 ? v.amount-- : 0, v)); else if (k == "@") light_orb.update(v => (v.amount > 0 ? v.amount-- : 0, v)); else if (k == "#") homing_orb.update(v => (v.amount > 0 ? v.amount-- : 0, v)); else if (k == "$") spore_orb.update(v => (v.amount > 0 ? v.amount-- : 0, v)); else if (k == "0") homing_orb.update(v => (v.amount += 200, v)); else if (k == ")") homing_orb.update(v => (v.amount += 20000000, v)); else if (k == "h") monster_manager.hit(1e10); else if (k == "R") set_to_default(); else if (k == "f") $$invalidate(10, min_fps = 1000); else // else if (k == "f") (console.log("Collecting orbs..."), collect_freq());
    		if (k == "S") {
    			basic_orb.update(v => (v.amount += 200, v));
    			light_orb.update(v => (v.amount += 200, v));
    			homing_orb.update(v => (v.amount += 200, v));
    			spore_orb.update(v => (v.amount += 200, v));
    		}
    	};

    	const key_down = e => {
    		const k = e.key;

    		// if (k == "Shift") $shifting = true;
    		// else if (k == "Control") $ctrling = true;
    		if (k == "Shift") (last_buy_amount = $buy_amount, set_store_value(buy_amount, $buy_amount = 3, $buy_amount));

    		if (!debug) return;
    		if (k == "c") set_store_value(cash, $cash += 1e5, $cash); else if (k == "C") set_store_value(cash, $cash += 1e12, $cash);
    	};

    	//#endregion
    	//#region | Blur/Focus
    	let blur_time = Date.now();

    	let blur_cash = $cash;

    	window.onblur = () => {
    		// $shifting = $ctrling = false; 
    		blur_time = Date.now();

    		blur_cash = $cash;
    	};

    	window.onfocus = () => {
    		if ($fighting) return;
    		const inactive_time = Math.round((Date.now() - blur_time) / 1000);
    		const inactive_cash = $cash - blur_cash;
    		const calc_inactive = inactive_time * calc_cps;

    		// console.log(`Cash: ${$cash}\nInactive cash: ${inactive_cash}\ncalc_cash: ${inactive_time*calc_cps}`);
    		if (inactive_cash >= calc_inactive) return;

    		if (inactive_cash * 1.2 > calc_inactive) return;
    		set_store_value(cash, $cash += calc_inactive, $cash);
    	};

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
    		common: [
    			// white
    			"Zombie",
    			"Boar",
    			"Sea Monster",
    			"Young Sea Monster"
    		],
    		uncommon: [
    			// light green
    			"Stone Golem",
    			"Young Wyvern",
    			"Possessed Sword"
    		],
    		rare: [
    			// aqua
    			"Young Dragon",
    			"Crystal Golem",
    			"J Walker"
    		],
    		legendary: [
    			// gold
    			"Elder Dragon",
    			"Block Head",
    			"Seagull"
    		],
    		boss: ["Viking Boss", "Lich Boss", "Big Boss", "Baby Boss"]
    	};

    	const monsters_plus = {
    		common: [
    			// white
    			"Angler",
    			"Fire Wisp"
    		],
    		uncommon: [
    			// light green
    			"Bugger",
    			"Arsonist"
    		],
    		rare: [
    			// aqua
    			"Brain Suckler",
    			"Squatch"
    		],
    		legendary: [
    			// gold
    			"Gold Axolotl",
    			"Typhoid Rat"
    		],
    		boss: ["Chad Viking", "Axolotl Boss"]
    	};

    	const get_rand_monster = rarity => {
    		if ($new_game_plus) {
    			return rand_in_list(monsters[rarity].concat(monsters_plus[rarity]));
    		} else {
    			return rand_in_list(monsters[rarity]);
    		}
    	};

    	const spawn_monster = () => {
    		// Chances for common, uncommon, rare, legendary
    		// 70, 20, 8, 2
    		const c = $rarities.c;

    		const u = $rarities.c + $rarities.u;
    		const r = $rarities.c + $rarities.u + $rarities.r;

    		const set_monster = (name, hp, worth) => {
    			$$invalidate(11, monster_manager.max_hp = hp * (1 + 0.5 * ($next_tower_lvl - 1)), monster_manager);
    			$$invalidate(11, monster_manager.hp = monster_manager.max_hp, monster_manager);
    			$$invalidate(11, monster_manager.name = name, monster_manager);
    			$$invalidate(11, monster_manager.src = `./assets/${name.toLowerCase().replaceAll(" ", "_")}.svg`, monster_manager);
    			$$invalidate(11, monster_manager.worth = worth, monster_manager);
    		};

    		const rand = Math.round(Math.random() * 100);

    		if (rand <= c) {
    			// Common
    			const name = get_rand_monster("common");

    			set_monster(name, 1500, 1);
    		} else if (rand <= u) {
    			// Uncommon
    			const name = get_rand_monster("uncommon");

    			set_monster(name, 4000, 3);
    		} else if (rand <= r) {
    			// Rare
    			const name = get_rand_monster("rare");

    			set_monster(name, 15000, 10);
    		} else {
    			// Legendary
    			const name = get_rand_monster("legendary");

    			set_monster(name, 40000, 25);
    		}

    		$$invalidate(11, monster_manager);
    	};

    	const spawn_boss = () => {
    		const set_monster = name => {
    			$$invalidate(11, monster_manager.max_hp = Math.round(Math.max(15000, monster_manager.total_health)), monster_manager);
    			$$invalidate(11, monster_manager.hp = monster_manager.max_hp, monster_manager);
    			$$invalidate(11, monster_manager.name = name, monster_manager);
    			$$invalidate(11, monster_manager.src = `./assets/${name.toLowerCase().replaceAll(" ", "_")}.svg`, monster_manager);
    			$$invalidate(11, monster_manager.worth = 50, monster_manager);
    		};

    		set_monster(get_rand_monster("boss"));
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
    		total_health: 0,
    		is_boss: false,
    		draw() {
    			// Base Background
    			ctx.fillStyle = "#444";

    			ctx.fillRect(this.pt1.x + 1, this.pt1.y + 1, this.pt2.x - this.pt1.x - 2, this.pt2.y - this.pt1.y - 2);

    			// Health bar background
    			ctx.fillStyle = "#333";

    			ctx.fillRect(this.pt1.x + 10, this.pt2.y - 30, this.pt2.x - this.pt1.x - 20, 20);

    			// Health bar fill
    			ctx.fillStyle = "#33aa33";

    			ctx.fillRect(this.pt1.x + 10, this.pt2.y - 30, (this.pt2.x - this.pt1.x - 20) * (Math.max(0, this.hp) / this.max_hp), 20);

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

    				if ($next_tower_lvl % 5 == 0 && $next_tower_lvl > 0) {
    					this.total_health += this.max_hp;
    				} // console.log([this.max_hp, this.total_health]);
    				set_store_value(mana, $mana += Math.round(this.worth * (1 + 0.05 * $next_tower_lvl)), $mana);
    				this.kill_index++;

    				if (this.kill_index >= 10) {
    					// console.log(($next_tower_lvl) % 5, ($next_tower_lvl) > 0, this.is_boss == false);
    					if ($next_tower_lvl % 5 == 0 && $next_tower_lvl > 0 && this.is_boss == false) {
    						this.kill_index--;
    						this.is_boss = true;
    						spawn_boss();
    						return;
    					}

    					this.is_boss = false;
    					this.total_health = 0;
    					set_store_value(next_tower_lvl, $next_tower_lvl++, $next_tower_lvl);
    					this.kill_index = 0;

    					big_explosion(ctx, [
    						this.pt1.x + (this.pt2.x - this.pt1.x) / 2,
    						this.pt1.y + (this.pt2.y - this.pt1.y) / 2
    					]);

    					if (!$auto_fight) {
    						set_store_value(fighting, $fighting = false, $fighting);
    					} else {
    						const afford = $afford_fight();
    						set_store_value(fighting, $fighting = afford, $fighting);
    						set_store_value(auto_fight, $auto_fight = afford, $auto_fight);
    						if (afford) set_store_value(cash, $cash -= $fight_cost, $cash);
    					}
    				} else {
    					spawn_monster();
    				}
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
    				// console.log("spawn!");
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
    	let coll_total = 0;
    	let numbers = [];

    	const collect_freq = () => {
    		$$invalidate(18, orbs.coll_num = 0, orbs);

    		setTimeout(
    			() => {
    				// console.log(`Collected ${orbs.coll_num} Orbs in 10 seconds`);
    				numbers.push(orbs.coll_num);

    				coll_total++;

    				if (coll_total < 10) collect_freq(); else {
    					console.log(`Power: ${$bounce.power}, Times: ${numbers.join(", ")} | ${Math.round(numbers.reduce((p, c) => p + c) / numbers.length)}`);
    					numbers = [];
    					coll_total = 0;
    					set_store_value(bounce, $bounce.power += 2.5, $bounce);
    					collect_freq();
    				}
    			},
    			10000
    		);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Canvas> was created with unknown prop '${key}'`);
    	});

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvas = $$value;
    			$$invalidate(1, canvas);
    		});
    	}

    	const click_handler = () => void set_store_value(canvas_toggled, $toggled = !$toggled, $toggled);
    	const click_handler_1 = () => void bounce.update(v => (v.auto_on = !v.auto_on, v));
    	const click_handler_2 = () => (set_store_value(fighting, $fighting = false, $fighting), set_store_value(auto_fight, $auto_fight = false, $auto_fight));
    	const click_handler_3 = () => $$invalidate(7, show_earnings = false);

    	function main_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			main = $$value;
    			($$invalidate(0, main), $$invalidate(5, $toggled));
    		});
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		particle_manager: manager,
    		small_explosion,
    		big_explosion,
    		fnum,
    		timer,
    		cash,
    		mana,
    		new_game_plus,
    		buy_amount,
    		prestige,
    		clear_storage,
    		toggled: canvas_toggled,
    		on_mobile,
    		set_to_default,
    		basic_orb,
    		light_orb,
    		homing_orb,
    		spore_orb,
    		orb_mult,
    		collector_pos,
    		bounce,
    		get_orb_bonus,
    		fighting,
    		rarities,
    		auto_fight,
    		afford_fight,
    		fight_cost,
    		next_tower_lvl,
    		offline_time,
    		max_render,
    		render_mode,
    		render_mod,
    		reset_orbs,
    		set_orb_values,
    		main,
    		canvas,
    		ctx,
    		pause,
    		step,
    		background_color,
    		w,
    		h,
    		distance,
    		orbs,
    		calc_cps,
    		offline_get,
    		offline_gain,
    		show_earnings,
    		check_cps,
    		total_value,
    		cps,
    		last_cash,
    		fps,
    		before_frame,
    		after_frame,
    		fps_list,
    		min_fps,
    		fps_index,
    		render_tick,
    		main_loop,
    		mouse,
    		mouse_move,
    		mouse_enter,
    		mouse_leave,
    		last_click,
    		mouse_down,
    		last_buy_amount,
    		key_up,
    		key_down,
    		blur_time,
    		blur_cash,
    		visible,
    		draw_auto_bounce_bar,
    		auto_bounce_perc,
    		auto_bounce_loop,
    		rand_in_list,
    		monsters,
    		monsters_plus,
    		get_rand_monster,
    		spawn_monster,
    		spawn_boss,
    		monster_manager,
    		event_manager,
    		total_orbs,
    		debug,
    		coll_total,
    		numbers,
    		collect_freq,
    		$bounce,
    		$spore_orb,
    		$homing_orb,
    		$light_orb,
    		$basic_orb,
    		$fighting,
    		$fight_cost,
    		$cash,
    		$auto_fight,
    		$afford_fight,
    		$next_tower_lvl,
    		$mana,
    		$rarities,
    		$new_game_plus,
    		$toggled,
    		$buy_amount,
    		$render_mode,
    		$render_mod,
    		$offline_time,
    		$collector_pos,
    		$timer,
    		$max_render,
    		$orb_mult,
    		$prestige,
    		$on_mobile
    	});

    	$$self.$inject_state = $$props => {
    		if ('main' in $$props) $$invalidate(0, main = $$props.main);
    		if ('canvas' in $$props) $$invalidate(1, canvas = $$props.canvas);
    		if ('ctx' in $$props) ctx = $$props.ctx;
    		if ('pause' in $$props) pause = $$props.pause;
    		if ('step' in $$props) step = $$props.step;
    		if ('w' in $$props) w = $$props.w;
    		if ('h' in $$props) h = $$props.h;
    		if ('calc_cps' in $$props) $$invalidate(2, calc_cps = $$props.calc_cps);
    		if ('offline_get' in $$props) $$invalidate(19, offline_get = $$props.offline_get);
    		if ('offline_gain' in $$props) $$invalidate(6, offline_gain = $$props.offline_gain);
    		if ('show_earnings' in $$props) $$invalidate(7, show_earnings = $$props.show_earnings);
    		if ('total_value' in $$props) total_value = $$props.total_value;
    		if ('cps' in $$props) $$invalidate(8, cps = $$props.cps);
    		if ('last_cash' in $$props) last_cash = $$props.last_cash;
    		if ('fps' in $$props) $$invalidate(9, fps = $$props.fps);
    		if ('before_frame' in $$props) before_frame = $$props.before_frame;
    		if ('after_frame' in $$props) after_frame = $$props.after_frame;
    		if ('fps_list' in $$props) fps_list = $$props.fps_list;
    		if ('min_fps' in $$props) $$invalidate(10, min_fps = $$props.min_fps);
    		if ('fps_index' in $$props) fps_index = $$props.fps_index;
    		if ('render_tick' in $$props) render_tick = $$props.render_tick;
    		if ('last_click' in $$props) last_click = $$props.last_click;
    		if ('last_buy_amount' in $$props) last_buy_amount = $$props.last_buy_amount;
    		if ('blur_time' in $$props) blur_time = $$props.blur_time;
    		if ('blur_cash' in $$props) blur_cash = $$props.blur_cash;
    		if ('visible' in $$props) visible = $$props.visible;
    		if ('auto_bounce_perc' in $$props) auto_bounce_perc = $$props.auto_bounce_perc;
    		if ('monster_manager' in $$props) $$invalidate(11, monster_manager = $$props.monster_manager);
    		if ('total_orbs' in $$props) $$invalidate(12, total_orbs = $$props.total_orbs);
    		if ('debug' in $$props) $$invalidate(13, debug = $$props.debug);
    		if ('coll_total' in $$props) coll_total = $$props.coll_total;
    		if ('numbers' in $$props) numbers = $$props.numbers;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*$basic_orb, $light_orb, $homing_orb, $spore_orb, $prestige, $orb_mult*/ 66060288) {
    			{
    				reset_orbs();
    				set_orb_values();
    			}
    		}

    		if ($$self.$$.dirty[0] & /*orbs, $basic_orb, $light_orb, $spore_orb, $bounce, $homing_orb, calc_cps, offline_get*/ 16515084) {
    			{
    				// $basic_orb; $light_orb; $spore_orb; $homing_orb;
    				$$invalidate(2, calc_cps = (orbs.total.basic * $basic_orb.value + orbs.total.light * $light_orb.value + orbs.total.spore * $spore_orb.value + orbs.total.sub_spore * $spore_orb.sub_value) * (0.552 + 0.0505 * (($bounce.power - 30) / 2.5)) * ($bounce.auto_unlocked ? 1 : 0) + orbs.total.homing * $homing_orb.value * 2);

    				$$invalidate(2, calc_cps = Math.round(calc_cps));

    				//
    				if (!offline_get) check_cps();
    			}
    		}

    		if ($$self.$$.dirty[0] & /*orbs, $basic_orb, $light_orb, $spore_orb, $homing_orb*/ 15990784) {
    			{
    				total_value = orbs.total.basic * $basic_orb.value + orbs.total.light * $light_orb.value + orbs.total.spore * $spore_orb.value + orbs.total.sub_spore * $spore_orb.sub_value + orbs.total.homing * $homing_orb.value;
    			}
    		}

    		if ($$self.$$.dirty[0] & /*canvas*/ 2) {
    			//#endregion
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

    		if ($$self.$$.dirty[0] & /*main, $toggled*/ 33) {
    			{
    				if (main != undefined) {
    					$$invalidate(0, main.ontransitionend = () => visible = $toggled, main);
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*$bounce*/ 8) {
    			if (!$bounce.auto_unlocked || !$bounce.auto_on) auto_bounce_perc = 0;
    		}

    		if ($$self.$$.dirty[0] & /*$fighting*/ 16) {
    			if ($fighting) {
    				spawn_monster();
    				reset_orbs();
    			}
    		}

    		if ($$self.$$.dirty[0] & /*$basic_orb, $light_orb, $homing_orb, $spore_orb*/ 15728640) {
    			{
    				$$invalidate(12, total_orbs = $basic_orb.amount + $light_orb.amount + $homing_orb.amount + $spore_orb.amount);
    			}
    		}
    	};

    	return [
    		main,
    		canvas,
    		calc_cps,
    		$bounce,
    		$fighting,
    		$toggled,
    		offline_gain,
    		show_earnings,
    		cps,
    		fps,
    		min_fps,
    		monster_manager,
    		total_orbs,
    		debug,
    		$cash,
    		$auto_fight,
    		$next_tower_lvl,
    		$on_mobile,
    		orbs,
    		offline_get,
    		$spore_orb,
    		$homing_orb,
    		$light_orb,
    		$basic_orb,
    		$orb_mult,
    		$prestige,
    		canvas_1_binding,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
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

    // (119:118) {:else}
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
    		source: "(119:118) {:else}",
    		ctx
    	});

    	return block;
    }

    // (119:66) {#if $bounce.size < 275}
    function create_if_block_1$1(ctx) {
    	let t0;
    	let t1_value = fnum(/*$bounce*/ ctx[6].size_cost) + "";
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
    			if (dirty & /*$bounce*/ 64 && t1_value !== (t1_value = fnum(/*$bounce*/ ctx[6].size_cost) + "")) set_data_dev(t1, t1_value);
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
    		source: "(119:66) {#if $bounce.size < 275}",
    		ctx
    	});

    	return block;
    }

    // (123:1) {:else}
    function create_else_block$2(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			add_location(div, file$5, 122, 9, 4503);
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
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(123:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (122:1) {#if $got_mana}
    function create_if_block$2(ctx) {
    	let button;
    	let t0;
    	let b;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text("Increase Orb Value +1% ");
    			b = element("b");
    			b.textContent = "5₪";
    			attr_dev(b, "class", "svelte-ma6d6q");
    			add_location(b, file$5, 121, 74, 4475);
    			attr_dev(button, "class", "svelte-ma6d6q");
    			add_location(button, file$5, 121, 17, 4418);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, b);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_orb_mult*/ ctx[15], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(122:1) {#if $got_mana}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let main;
    	let h30;
    	let t0;
    	let t1_value = fnum(/*$cash*/ ctx[5]) + "";
    	let t1;
    	let t2;
    	let h31;
    	let t3;

    	let t4_value = (/*$buy_amount*/ ctx[3] < 3
    	? 1 * 10 ** /*$buy_amount*/ ctx[3]
    	: "Max") + "";

    	let t4;
    	let t5;
    	let hr;
    	let t6;
    	let button0;
    	let t7;
    	let b0;
    	let t8;
    	let t9_value = fnum(/*$bounce*/ ctx[6].power_cost) + "";
    	let t9;
    	let t10;
    	let button1;
    	let t11;
    	let b1;

    	let t12_value = (/*$bounce*/ ctx[6].auto_unlocked
    	? "Unlocked!"
    	: `$${fnum(/*$bounce*/ ctx[6].auto_cost)}`) + "";

    	let t12;
    	let t13;
    	let button2;
    	let t14;
    	let b2;
    	let t15;
    	let button3;
    	let t16;
    	let t17_value = fnum(/*$starting_cash*/ ctx[4].amount) + "";
    	let t17;
    	let t18;
    	let b3;
    	let t19;
    	let t20_value = fnum(/*$starting_cash*/ ctx[4].cost) + "";
    	let t20;
    	let t21;
    	let t22;
    	let div;
    	let button4;
    	let t24;
    	let h32;
    	let t25;
    	let t26_value = (/*$prestige*/ ctx[7], /*$orb_mult*/ ctx[2], fnum(get_orb_bonus() * 100 - 100)) + "";
    	let t26;
    	let t27;
    	let t28_value = (/*prest_hover*/ ctx[1] ? "(Increases per prestige)" : "") + "";
    	let t28;
    	let t29;
    	let button5;
    	let t30;
    	let b4;
    	let t31;
    	let t32_value = fnum(/*$prestige*/ ctx[7].cost) + "";
    	let t32;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*$bounce*/ ctx[6].size < 275) return create_if_block_1$1;
    		return create_else_block_1$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*$got_mana*/ ctx[8]) return create_if_block$2;
    		return create_else_block$2;
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
    			t3 = text("Buy ");
    			t4 = text(t4_value);
    			t5 = space();
    			hr = element("hr");
    			t6 = space();
    			button0 = element("button");
    			t7 = text("Increase Bounce Power ");
    			b0 = element("b");
    			t8 = text("$");
    			t9 = text(t9_value);
    			t10 = space();
    			button1 = element("button");
    			t11 = text("Unlock Auto Bounce ");
    			b1 = element("b");
    			t12 = text(t12_value);
    			t13 = space();
    			button2 = element("button");
    			t14 = text("Increase Bounce Area ");
    			b2 = element("b");
    			if_block0.c();
    			t15 = space();
    			button3 = element("button");
    			t16 = text("Starting Cash +1 ($");
    			t17 = text(t17_value);
    			t18 = text(") ");
    			b3 = element("b");
    			t19 = text("$");
    			t20 = text(t20_value);
    			t21 = space();
    			if_block1.c();
    			t22 = space();
    			div = element("div");
    			button4 = element("button");
    			button4.textContent = "Back to game";
    			t24 = space();
    			h32 = element("h3");
    			t25 = text("Orb Value Bonus: +");
    			t26 = text(t26_value);
    			t27 = text("% ");
    			t28 = text(t28_value);
    			t29 = space();
    			button5 = element("button");
    			t30 = text("Prestige ");
    			b4 = element("b");
    			t31 = text("$");
    			t32 = text(t32_value);
    			attr_dev(h30, "id", "cash");
    			attr_dev(h30, "class", "svelte-ma6d6q");
    			add_location(h30, file$5, 113, 1, 3559);
    			attr_dev(h31, "id", "max-buy-hint");
    			attr_dev(h31, "class", "svelte-ma6d6q");
    			add_location(h31, file$5, 114, 1, 3599);
    			attr_dev(hr, "id", "top-hr");
    			attr_dev(hr, "class", "svelte-ma6d6q");
    			add_location(hr, file$5, 115, 1, 3733);
    			attr_dev(b0, "class", "svelte-ma6d6q");
    			add_location(b0, file$5, 116, 59, 3809);
    			attr_dev(button0, "class", "svelte-ma6d6q");
    			add_location(button0, file$5, 116, 1, 3751);
    			attr_dev(b1, "class", "svelte-ma6d6q");
    			add_location(b1, file$5, 117, 55, 3908);
    			attr_dev(button1, "class", "svelte-ma6d6q");
    			add_location(button1, file$5, 117, 1, 3854);
    			attr_dev(b2, "class", "svelte-ma6d6q");
    			add_location(b2, file$5, 118, 62, 4056);
    			attr_dev(button2, "class", "svelte-ma6d6q");
    			add_location(button2, file$5, 118, 1, 3995);
    			attr_dev(b3, "class", "svelte-ma6d6q");
    			add_location(b3, file$5, 119, 88, 4233);
    			attr_dev(button3, "class", "svelte-ma6d6q");
    			add_location(button3, file$5, 119, 1, 4146);
    			attr_dev(button4, "id", "back-to-game");
    			attr_dev(button4, "class", "svelte-ma6d6q");
    			add_location(button4, file$5, 124, 2, 4558);
    			set_style(div, "position", "relative");
    			add_location(div, file$5, 123, 1, 4522);
    			attr_dev(h32, "id", "orb-info");
    			attr_dev(h32, "class", "svelte-ma6d6q");
    			add_location(h32, file$5, 126, 1, 4660);
    			attr_dev(b4, "class", "svelte-ma6d6q");
    			add_location(b4, file$5, 127, 63, 4869);
    			attr_dev(button5, "class", "svelte-ma6d6q");
    			add_location(button5, file$5, 127, 1, 4807);
    			attr_dev(main, "id", "main-shop");
    			attr_dev(main, "class", "svelte-ma6d6q");
    			add_location(main, file$5, 112, 0, 3536);
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
    			append_dev(h31, t3);
    			append_dev(h31, t4);
    			append_dev(main, t5);
    			append_dev(main, hr);
    			append_dev(main, t6);
    			append_dev(main, button0);
    			append_dev(button0, t7);
    			append_dev(button0, b0);
    			append_dev(b0, t8);
    			append_dev(b0, t9);
    			append_dev(main, t10);
    			append_dev(main, button1);
    			append_dev(button1, t11);
    			append_dev(button1, b1);
    			append_dev(b1, t12);
    			append_dev(main, t13);
    			append_dev(main, button2);
    			append_dev(button2, t14);
    			append_dev(button2, b2);
    			if_block0.m(b2, null);
    			append_dev(main, t15);
    			append_dev(main, button3);
    			append_dev(button3, t16);
    			append_dev(button3, t17);
    			append_dev(button3, t18);
    			append_dev(button3, b3);
    			append_dev(b3, t19);
    			append_dev(b3, t20);
    			append_dev(main, t21);
    			if_block1.m(main, null);
    			append_dev(main, t22);
    			append_dev(main, div);
    			append_dev(div, button4);
    			append_dev(main, t24);
    			append_dev(main, h32);
    			append_dev(h32, t25);
    			append_dev(h32, t26);
    			append_dev(h32, t27);
    			append_dev(h32, t28);
    			append_dev(main, t29);
    			append_dev(main, button5);
    			append_dev(button5, t30);
    			append_dev(button5, b4);
    			append_dev(b4, t31);
    			append_dev(b4, t32);
    			/*button5_binding*/ ctx[18](button5);

    			if (!mounted) {
    				dispose = [
    					listen_dev(h31, "click", /*click_handler*/ ctx[16], false, false, false),
    					listen_dev(button0, "click", /*buy_bounce_power*/ ctx[10], false, false, false),
    					listen_dev(button1, "click", /*buy_auto_bounce*/ ctx[11], false, false, false),
    					listen_dev(button2, "click", /*increase_bounce_area*/ ctx[12], false, false, false),
    					listen_dev(button3, "click", /*buy_starting_cash*/ ctx[14], false, false, false),
    					listen_dev(button4, "click", /*click_handler_1*/ ctx[17], false, false, false),
    					listen_dev(button5, "click", /*do_prestige*/ ctx[13], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$cash*/ 32 && t1_value !== (t1_value = fnum(/*$cash*/ ctx[5]) + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*$buy_amount*/ 8 && t4_value !== (t4_value = (/*$buy_amount*/ ctx[3] < 3
    			? 1 * 10 ** /*$buy_amount*/ ctx[3]
    			: "Max") + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*$bounce*/ 64 && t9_value !== (t9_value = fnum(/*$bounce*/ ctx[6].power_cost) + "")) set_data_dev(t9, t9_value);

    			if (dirty & /*$bounce*/ 64 && t12_value !== (t12_value = (/*$bounce*/ ctx[6].auto_unlocked
    			? "Unlocked!"
    			: `$${fnum(/*$bounce*/ ctx[6].auto_cost)}`) + "")) set_data_dev(t12, t12_value);

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

    			if (dirty & /*$starting_cash*/ 16 && t17_value !== (t17_value = fnum(/*$starting_cash*/ ctx[4].amount) + "")) set_data_dev(t17, t17_value);
    			if (dirty & /*$starting_cash*/ 16 && t20_value !== (t20_value = fnum(/*$starting_cash*/ ctx[4].cost) + "")) set_data_dev(t20, t20_value);

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(main, t22);
    				}
    			}

    			if (dirty & /*$prestige, $orb_mult*/ 132 && t26_value !== (t26_value = (/*$prestige*/ ctx[7], /*$orb_mult*/ ctx[2], fnum(get_orb_bonus() * 100 - 100)) + "")) set_data_dev(t26, t26_value);
    			if (dirty & /*prest_hover*/ 2 && t28_value !== (t28_value = (/*prest_hover*/ ctx[1] ? "(Increases per prestige)" : "") + "")) set_data_dev(t28, t28_value);
    			if (dirty & /*$prestige*/ 128 && t32_value !== (t32_value = fnum(/*$prestige*/ ctx[7].cost) + "")) set_data_dev(t32, t32_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_block0.d();
    			if_block1.d();
    			/*button5_binding*/ ctx[18](null);
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
    	let $orb_mult;
    	let $mana;
    	let $buy_amount;
    	let $starting_cash;
    	let $cash;
    	let $bounce;
    	let $spore_orb;
    	let $homing_orb;
    	let $prestige;
    	let $got_mana;
    	let $canvas_toggled;
    	validate_store(orb_mult, 'orb_mult');
    	component_subscribe($$self, orb_mult, $$value => $$invalidate(2, $orb_mult = $$value));
    	validate_store(mana, 'mana');
    	component_subscribe($$self, mana, $$value => $$invalidate(19, $mana = $$value));
    	validate_store(buy_amount, 'buy_amount');
    	component_subscribe($$self, buy_amount, $$value => $$invalidate(3, $buy_amount = $$value));
    	validate_store(starting_cash, 'starting_cash');
    	component_subscribe($$self, starting_cash, $$value => $$invalidate(4, $starting_cash = $$value));
    	validate_store(cash, 'cash');
    	component_subscribe($$self, cash, $$value => $$invalidate(5, $cash = $$value));
    	validate_store(bounce, 'bounce');
    	component_subscribe($$self, bounce, $$value => $$invalidate(6, $bounce = $$value));
    	validate_store(spore_orb, 'spore_orb');
    	component_subscribe($$self, spore_orb, $$value => $$invalidate(20, $spore_orb = $$value));
    	validate_store(homing_orb, 'homing_orb');
    	component_subscribe($$self, homing_orb, $$value => $$invalidate(21, $homing_orb = $$value));
    	validate_store(prestige, 'prestige');
    	component_subscribe($$self, prestige, $$value => $$invalidate(7, $prestige = $$value));
    	validate_store(got_mana, 'got_mana');
    	component_subscribe($$self, got_mana, $$value => $$invalidate(8, $got_mana = $$value));
    	validate_store(canvas_toggled, 'canvas_toggled');
    	component_subscribe($$self, canvas_toggled, $$value => $$invalidate(9, $canvas_toggled = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Shop', slots, []);

    	const buy_bounce_power = () => {
    		if ($cash < $bounce.power_cost) return;
    		set_store_value(cash, $cash -= $bounce.power_cost, $cash);
    		set_store_value(bounce, $bounce.power += 2.5, $bounce);
    		set_store_value(bounce, $bounce.power_cost = Math.floor($bounce.power_cost * 1.5), $bounce);
    		if ($buy_amount == 3) buy_bounce_power(); else if ($buy_amount == 1) run_n(buy_bounce_power, 9); else if ($buy_amount == 2) run_n(buy_bounce_power, 99);
    		bounce.set($bounce);
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
    		if ($buy_amount == 3) increase_bounce_area();
    		if ($buy_amount == 1) run_n(increase_bounce_area, 9);
    		bounce.set($bounce);
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
    		light_orb.update(v => (v.amount = 0, v.cost = 100, v));
    		set_store_value(mana, $mana += $homing_orb.amount + $spore_orb.amount, $mana);
    		homing_orb.update(v => (v.amount = 0, v));
    		spore_orb.update(v => (v.amount = 0, v));

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

    		prestige.update(v => (v.times++, v.cost += 25000 * v.times, v));
    	};

    	//#endregion
    	//#region | Starting Cash
    	const buy_starting_cash = () => {
    		if ($cash < $starting_cash.cost) return;

    		if ($buy_amount == 3) {
    			const total = Math.floor($cash / $starting_cash.cost);
    			set_store_value(cash, $cash -= $starting_cash.cost * total, $cash);
    			starting_cash.update(v => (v.amount += total, v));
    		} else if ($buy_amount == 1) {
    			if ($cash < $starting_cash.cost * 10) return;
    			set_store_value(cash, $cash -= $starting_cash.cost * 10, $cash);
    			starting_cash.update(v => (v.amount += 10, v));
    		} else if ($buy_amount == 2) {
    			if ($cash < $starting_cash.cost * 100) return;
    			set_store_value(cash, $cash -= $starting_cash.cost * 100, $cash);
    			starting_cash.update(v => (v.amount += 100, v));
    		} else {
    			set_store_value(cash, $cash -= $starting_cash.cost, $cash);
    			starting_cash.update(v => (v.amount++, v));
    		}
    	};

    	//#endregion
    	//#region | Orb Value Mult
    	const click_orb_mult = () => {
    		if ($mana < orb_mult_cost) return;

    		if ($buy_amount == 3) {
    			const total = Math.floor($mana / orb_mult_cost);
    			set_store_value(orb_mult, $orb_mult += total, $orb_mult);
    			set_store_value(mana, $mana -= orb_mult_cost * total, $mana);
    		} else if ($buy_amount == 1) {
    			if ($mana < 10 * orb_mult_cost) return;
    			set_store_value(orb_mult, $orb_mult += 10, $orb_mult);
    			set_store_value(mana, $mana -= 10 * orb_mult_cost, $mana);
    		} else if ($buy_amount == 2) {
    			if ($mana < 100 * orb_mult_cost) return;
    			set_store_value(mana, $mana -= 100 * orb_mult_cost, $mana);
    			set_store_value(orb_mult, $orb_mult += 100, $orb_mult);
    		} else {
    			set_store_value(mana, $mana -= orb_mult_cost, $mana);
    			set_store_value(orb_mult, $orb_mult++, $orb_mult);
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Shop> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => void set_store_value(buy_amount, $buy_amount = ($buy_amount + 1) % 4, $buy_amount);
    	const click_handler_1 = () => void set_store_value(canvas_toggled, $canvas_toggled = true, $canvas_toggled);

    	function button5_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			prest_btn = $$value;
    			$$invalidate(0, prest_btn);
    		});
    	}

    	$$self.$capture_state = () => ({
    		cash,
    		mana,
    		buy_amount,
    		basic_orb,
    		light_orb,
    		homing_orb,
    		spore_orb,
    		prestige,
    		starting_cash,
    		bounce,
    		got_mana,
    		orb_mult,
    		orb_mult_cost,
    		get_orb_bonus,
    		canvas_toggled,
    		fnum,
    		run_n,
    		spend_cash_mult,
    		buy_bounce_power,
    		buy_auto_bounce,
    		increase_bounce_area,
    		prest_btn,
    		prest_hover,
    		do_prestige,
    		buy_starting_cash,
    		click_orb_mult,
    		$orb_mult,
    		$mana,
    		$buy_amount,
    		$starting_cash,
    		$cash,
    		$bounce,
    		$spore_orb,
    		$homing_orb,
    		$prestige,
    		$got_mana,
    		$canvas_toggled
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
    		$orb_mult,
    		$buy_amount,
    		$starting_cash,
    		$cash,
    		$bounce,
    		$prestige,
    		$got_mana,
    		$canvas_toggled,
    		buy_bounce_power,
    		buy_auto_bounce,
    		increase_bounce_area,
    		do_prestige,
    		buy_starting_cash,
    		click_orb_mult,
    		click_handler,
    		click_handler_1,
    		button5_binding
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
    			h3.textContent = "Unlock Artifacts in \"New Game+\"";
    			attr_dev(h3, "class", "svelte-1ze30k");
    			add_location(h3, file$4, 5, 1, 29);
    			attr_dev(main, "class", "svelte-1ze30k");
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

    // (178:2) {:else}
    function create_else_block_3(ctx) {
    	let h3;
    	let t0;
    	let t1_value = 3 - /*$prestige*/ ctx[10].times + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = text("Unlock After ");
    			t1 = text(t1_value);
    			t2 = text(" Prestiges");
    			attr_dev(h3, "id", "info");
    			attr_dev(h3, "class", "svelte-spajw8");
    			add_location(h3, file$3, 179, 3, 5757);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t0);
    			append_dev(h3, t1);
    			append_dev(h3, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$prestige*/ 1024 && t1_value !== (t1_value = 3 - /*$prestige*/ ctx[10].times + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_3.name,
    		type: "else",
    		source: "(178:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (162:2) {#if $unlocked_fighting}
    function create_if_block_5(ctx) {
    	let t0;
    	let button0;
    	let t1;
    	let button0_style_value;
    	let t2;
    	let button1;
    	let t3;
    	let t4;
    	let t5;
    	let b;
    	let t6;
    	let t7_value = fnum(/*$fight_cost*/ ctx[13]) + "";
    	let t7;
    	let t8;
    	let h3;
    	let t9;
    	let t10;
    	let t11;
    	let t12;
    	let t13;
    	let t14;
    	let t15;
    	let mounted;
    	let dispose;
    	let if_block0 = /*$rarities*/ ctx[14].l >= 100 && create_if_block_14(ctx);
    	let if_block1 = /*$rarities*/ ctx[14].c > 0 && create_if_block_13(ctx);
    	let if_block2 = /*$rarities*/ ctx[14].c > 0 && /*$rarities*/ ctx[14].u > 0 && create_if_block_12(ctx);
    	let if_block3 = /*$rarities*/ ctx[14].u > 0 && create_if_block_11(ctx);
    	let if_block4 = /*$rarities*/ ctx[14].u > 0 && /*$rarities*/ ctx[14].r > 0 && create_if_block_10(ctx);
    	let if_block5 = /*$rarities*/ ctx[14].r > 0 && create_if_block_9(ctx);
    	let if_block6 = (/*$rarities*/ ctx[14].c > 0 || /*$rarities*/ ctx[14].u > 0) && create_if_block_8(ctx);
    	let if_block7 = /*$rarities*/ ctx[14].u <= 0 && /*$rarities*/ ctx[14].r > 0 && /*$rarities*/ ctx[14].l > 0 && create_if_block_7(ctx);
    	let if_block8 = /*$rarities*/ ctx[14].l > 0 && create_if_block_6(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			button0 = element("button");
    			t1 = text("Auto Fight?");
    			t2 = space();
    			button1 = element("button");
    			t3 = text("Monster Tower Lvl ");
    			t4 = text(/*$next_tower_lvl*/ ctx[6]);
    			t5 = text(" | ");
    			b = element("b");
    			t6 = text("$");
    			t7 = text(t7_value);
    			t8 = space();
    			h3 = element("h3");
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
    			t14 = space();
    			if (if_block7) if_block7.c();
    			t15 = space();
    			if (if_block8) if_block8.c();
    			attr_dev(button0, "id", "auto-fight");
    			attr_dev(button0, "style", button0_style_value = /*$auto_fight*/ ctx[7] ? "border-color: lime;" : "");
    			attr_dev(button0, "class", "svelte-spajw8");
    			add_location(button0, file$3, 163, 3, 4711);
    			add_location(b, file$3, 165, 42, 4998);
    			attr_dev(h3, "id", "rarities");
    			attr_dev(h3, "class", "svelte-spajw8");
    			add_location(h3, file$3, 166, 4, 5030);
    			attr_dev(button1, "id", "fight-btn");
    			attr_dev(button1, "class", "svelte-spajw8");
    			toggle_class(button1, "disabled", /*$fighting*/ ctx[12]);
    			add_location(button1, file$3, 164, 3, 4853);
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, button0, anchor);
    			append_dev(button0, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, button1, anchor);
    			append_dev(button1, t3);
    			append_dev(button1, t4);
    			append_dev(button1, t5);
    			append_dev(button1, b);
    			append_dev(b, t6);
    			append_dev(b, t7);
    			append_dev(button1, t8);
    			append_dev(button1, h3);
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
    			append_dev(h3, t14);
    			if (if_block7) if_block7.m(h3, null);
    			append_dev(h3, t15);
    			if (if_block8) if_block8.m(h3, null);
    			/*button1_binding*/ ctx[28](button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[26], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[27], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*$rarities*/ ctx[14].l >= 100) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_14(ctx);
    					if_block0.c();
    					if_block0.m(t0.parentNode, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty[0] & /*$auto_fight*/ 128 && button0_style_value !== (button0_style_value = /*$auto_fight*/ ctx[7] ? "border-color: lime;" : "")) {
    				attr_dev(button0, "style", button0_style_value);
    			}

    			if (dirty[0] & /*$next_tower_lvl*/ 64) set_data_dev(t4, /*$next_tower_lvl*/ ctx[6]);
    			if (dirty[0] & /*$fight_cost*/ 8192 && t7_value !== (t7_value = fnum(/*$fight_cost*/ ctx[13]) + "")) set_data_dev(t7, t7_value);

    			if (/*$rarities*/ ctx[14].c > 0) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_13(ctx);
    					if_block1.c();
    					if_block1.m(h3, t9);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*$rarities*/ ctx[14].c > 0 && /*$rarities*/ ctx[14].u > 0) {
    				if (if_block2) ; else {
    					if_block2 = create_if_block_12(ctx);
    					if_block2.c();
    					if_block2.m(h3, t10);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*$rarities*/ ctx[14].u > 0) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block_11(ctx);
    					if_block3.c();
    					if_block3.m(h3, t11);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (/*$rarities*/ ctx[14].u > 0 && /*$rarities*/ ctx[14].r > 0) {
    				if (if_block4) ; else {
    					if_block4 = create_if_block_10(ctx);
    					if_block4.c();
    					if_block4.m(h3, t12);
    				}
    			} else if (if_block4) {
    				if_block4.d(1);
    				if_block4 = null;
    			}

    			if (/*$rarities*/ ctx[14].r > 0) {
    				if (if_block5) {
    					if_block5.p(ctx, dirty);
    				} else {
    					if_block5 = create_if_block_9(ctx);
    					if_block5.c();
    					if_block5.m(h3, t13);
    				}
    			} else if (if_block5) {
    				if_block5.d(1);
    				if_block5 = null;
    			}

    			if (/*$rarities*/ ctx[14].c > 0 || /*$rarities*/ ctx[14].u > 0) {
    				if (if_block6) ; else {
    					if_block6 = create_if_block_8(ctx);
    					if_block6.c();
    					if_block6.m(h3, t14);
    				}
    			} else if (if_block6) {
    				if_block6.d(1);
    				if_block6 = null;
    			}

    			if (/*$rarities*/ ctx[14].u <= 0 && /*$rarities*/ ctx[14].r > 0 && /*$rarities*/ ctx[14].l > 0) {
    				if (if_block7) ; else {
    					if_block7 = create_if_block_7(ctx);
    					if_block7.c();
    					if_block7.m(h3, t15);
    				}
    			} else if (if_block7) {
    				if_block7.d(1);
    				if_block7 = null;
    			}

    			if (/*$rarities*/ ctx[14].l > 0) {
    				if (if_block8) {
    					if_block8.p(ctx, dirty);
    				} else {
    					if_block8 = create_if_block_6(ctx);
    					if_block8.c();
    					if_block8.m(h3, null);
    				}
    			} else if (if_block8) {
    				if_block8.d(1);
    				if_block8 = null;
    			}

    			if (dirty[0] & /*$fighting*/ 4096) {
    				toggle_class(button1, "disabled", /*$fighting*/ ctx[12]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(button1);
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();
    			if (if_block5) if_block5.d();
    			if (if_block6) if_block6.d();
    			if (if_block7) if_block7.d();
    			if (if_block8) if_block8.d();
    			/*button1_binding*/ ctx[28](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(162:2) {#if $unlocked_fighting}",
    		ctx
    	});

    	return block;
    }

    // (163:3) {#if $rarities.l >= 100}
    function create_if_block_14(ctx) {
    	let h3;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Check settings...";
    			attr_dev(h3, "id", "secret-hint");
    			attr_dev(h3, "class", "svelte-spajw8");
    			add_location(h3, file$3, 162, 28, 4658);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_14.name,
    		type: "if",
    		source: "(163:3) {#if $rarities.l >= 100}",
    		ctx
    	});

    	return block;
    }

    // (168:5) {#if $rarities.c > 0}
    function create_if_block_13(ctx) {
    	let span;
    	let t0;
    	let t1_value = /*$rarities*/ ctx[14].c + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("Common: ");
    			t1 = text(t1_value);
    			t2 = text("%");
    			set_style(span, "color", "#ddd");
    			add_location(span, file$3, 167, 26, 5075);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$rarities*/ 16384 && t1_value !== (t1_value = /*$rarities*/ ctx[14].c + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_13.name,
    		type: "if",
    		source: "(168:5) {#if $rarities.c > 0}",
    		ctx
    	});

    	return block;
    }

    // (169:5) {#if $rarities.c > 0 && $rarities.u > 0}
    function create_if_block_12(ctx) {
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
    		id: create_if_block_12.name,
    		type: "if",
    		source: "(169:5) {#if $rarities.c > 0 && $rarities.u > 0}",
    		ctx
    	});

    	return block;
    }

    // (170:5) {#if $rarities.u > 0}
    function create_if_block_11(ctx) {
    	let span;
    	let t0;
    	let t1_value = /*$rarities*/ ctx[14].u + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("Uncommon: ");
    			t1 = text(t1_value);
    			t2 = text("%");
    			set_style(span, "color", "#B8E986");
    			add_location(span, file$3, 169, 26, 5218);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$rarities*/ 16384 && t1_value !== (t1_value = /*$rarities*/ ctx[14].u + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_11.name,
    		type: "if",
    		source: "(170:5) {#if $rarities.u > 0}",
    		ctx
    	});

    	return block;
    }

    // (171:5) {#if $rarities.u > 0 && $rarities.r > 0}
    function create_if_block_10(ctx) {
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
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(171:5) {#if $rarities.u > 0 && $rarities.r > 0}",
    		ctx
    	});

    	return block;
    }

    // (172:5) {#if $rarities.r > 0}
    function create_if_block_9(ctx) {
    	let span;
    	let t0;
    	let t1_value = /*$rarities*/ ctx[14].r + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("Rare: ");
    			t1 = text(t1_value);
    			t2 = text("%");
    			set_style(span, "color", "#48BAFF");
    			add_location(span, file$3, 171, 26, 5365);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$rarities*/ 16384 && t1_value !== (t1_value = /*$rarities*/ ctx[14].r + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(172:5) {#if $rarities.r > 0}",
    		ctx
    	});

    	return block;
    }

    // (173:5) {#if $rarities.c > 0 || $rarities.u > 0}
    function create_if_block_8(ctx) {
    	let br;

    	const block = {
    		c: function create() {
    			br = element("br");
    			add_location(br, file$3, 172, 46, 5474);
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
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(173:5) {#if $rarities.c > 0 || $rarities.u > 0}",
    		ctx
    	});

    	return block;
    }

    // (174:5) {#if $rarities.u <= 0 && $rarities.r > 0 && $rarities.l > 0}
    function create_if_block_7(ctx) {
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
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(174:5) {#if $rarities.u <= 0 && $rarities.r > 0 && $rarities.l > 0}",
    		ctx
    	});

    	return block;
    }

    // (175:5) {#if $rarities.l > 0}
    function create_if_block_6(ctx) {
    	let span;
    	let t0;
    	let t1_value = /*$rarities*/ ctx[14].l + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("Legendary: ");
    			t1 = text(t1_value);
    			t2 = text("%");
    			set_style(span, "color", "#F8E71C");
    			add_location(span, file$3, 174, 26, 5585);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$rarities*/ 16384 && t1_value !== (t1_value = /*$rarities*/ ctx[14].l + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(175:5) {#if $rarities.l > 0}",
    		ctx
    	});

    	return block;
    }

    // (199:2) {:else}
    function create_else_block_2(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "?";
    			button.disabled = true;
    			attr_dev(button, "class", "svelte-spajw8");
    			add_location(button, file$3, 198, 10, 6504);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(199:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (191:2) {#if $prestige.times >= 1}
    function create_if_block_4(ctx) {
    	let button2;
    	let t0;
    	let p;
    	let t1;
    	let t2_value = fnum(/*$light_orb*/ ctx[4].value) + "";
    	let t2;
    	let t3;
    	let div;
    	let button0;
    	let t4;
    	let t5_value = fnum(/*$light_orb*/ ctx[4].cost) + "";
    	let t5;
    	let t6;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button2 = element("button");
    			t0 = text("Light\n\t\t\t");
    			p = element("p");
    			t1 = text("Value: ");
    			t2 = text(t2_value);
    			t3 = space();
    			div = element("div");
    			button0 = element("button");
    			t4 = text("Buy $");
    			t5 = text(t5_value);
    			t6 = space();
    			button1 = element("button");
    			button1.textContent = "Sell";
    			attr_dev(p, "class", "stat svelte-spajw8");
    			add_location(p, file$3, 192, 3, 6241);
    			attr_dev(button0, "class", "buy-sell svelte-spajw8");
    			add_location(button0, file$3, 194, 4, 6323);
    			attr_dev(button1, "class", "buy-sell svelte-spajw8");
    			add_location(button1, file$3, 195, 4, 6411);
    			attr_dev(div, "class", "orb-info svelte-spajw8");
    			add_location(div, file$3, 193, 3, 6296);
    			attr_dev(button2, "class", "trade-btn svelte-spajw8");
    			attr_dev(button2, "id", "light-btn");
    			add_location(button2, file$3, 191, 2, 6191);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button2, anchor);
    			append_dev(button2, t0);
    			append_dev(button2, p);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(button2, t3);
    			append_dev(button2, div);
    			append_dev(div, button0);
    			append_dev(button0, t4);
    			append_dev(button0, t5);
    			append_dev(div, t6);
    			append_dev(div, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*buy_light*/ ctx[19], false, false, false),
    					listen_dev(button1, "click", /*sell_light*/ ctx[20], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$light_orb*/ 16 && t2_value !== (t2_value = fnum(/*$light_orb*/ ctx[4].value) + "")) set_data_dev(t2, t2_value);
    			if (dirty[0] & /*$light_orb*/ 16 && t5_value !== (t5_value = fnum(/*$light_orb*/ ctx[4].cost) + "")) set_data_dev(t5, t5_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(191:2) {#if $prestige.times >= 1}",
    		ctx
    	});

    	return block;
    }

    // (215:2) {:else}
    function create_else_block_1(ctx) {
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
    			attr_dev(button0, "class", "svelte-spajw8");
    			add_location(button0, file$3, 215, 2, 7184);
    			button1.disabled = true;
    			attr_dev(button1, "class", "svelte-spajw8");
    			add_location(button1, file$3, 216, 2, 7214);
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
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(215:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (200:2) {#if $got_mana}
    function create_if_block_3(ctx) {
    	let button2;
    	let t0;
    	let p0;
    	let t1;
    	let t2_value = fnum(/*$homing_orb*/ ctx[3].value) + "";
    	let t2;
    	let t3;
    	let div0;
    	let button0;
    	let t4;
    	let t5_value = fnum(/*$homing_orb*/ ctx[3].cost) + "";
    	let t5;
    	let t6;
    	let t7;
    	let button1;
    	let t9;
    	let button5;
    	let t10;
    	let p1;
    	let t11;
    	let t12_value = fnum(/*$spore_orb*/ ctx[1].value) + "";
    	let t12;
    	let t13;
    	let div1;
    	let button3;
    	let t14;
    	let t15_value = fnum(/*$spore_orb*/ ctx[1].cost) + "";
    	let t15;
    	let t16;
    	let t17;
    	let button4;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button2 = element("button");
    			t0 = text("Homing\n\t\t\t");
    			p0 = element("p");
    			t1 = text("Value: ");
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
    			t10 = text("Spore\n\t\t\t");
    			p1 = element("p");
    			t11 = text("Value: ");
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
    			attr_dev(p0, "class", "stat svelte-spajw8");
    			add_location(p0, file$3, 201, 3, 6610);
    			attr_dev(button0, "class", "buy-sell svelte-spajw8");
    			add_location(button0, file$3, 203, 4, 6693);
    			attr_dev(button1, "class", "buy-sell svelte-spajw8");
    			add_location(button1, file$3, 204, 4, 6783);
    			attr_dev(div0, "class", "orb-info svelte-spajw8");
    			add_location(div0, file$3, 202, 3, 6666);
    			attr_dev(button2, "class", "trade-btn svelte-spajw8");
    			attr_dev(button2, "id", "homing-btn");
    			add_location(button2, file$3, 200, 2, 6558);
    			attr_dev(p1, "class", "stat svelte-spajw8");
    			add_location(p1, file$3, 208, 3, 6919);
    			attr_dev(button3, "class", "buy-sell svelte-spajw8");
    			add_location(button3, file$3, 210, 4, 7001);
    			attr_dev(button4, "class", "buy-sell svelte-spajw8");
    			add_location(button4, file$3, 211, 4, 7089);
    			attr_dev(div1, "class", "orb-info svelte-spajw8");
    			add_location(div1, file$3, 209, 3, 6974);
    			attr_dev(button5, "class", "trade-btn svelte-spajw8");
    			attr_dev(button5, "id", "spore-btn");
    			add_location(button5, file$3, 207, 2, 6869);
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
    					listen_dev(button0, "click", /*buy_homing*/ ctx[21], false, false, false),
    					listen_dev(button1, "click", /*sell_homing*/ ctx[22], false, false, false),
    					listen_dev(button3, "click", /*buy_spore*/ ctx[23], false, false, false),
    					listen_dev(button4, "click", /*sell_spore*/ ctx[24], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$homing_orb*/ 8 && t2_value !== (t2_value = fnum(/*$homing_orb*/ ctx[3].value) + "")) set_data_dev(t2, t2_value);
    			if (dirty[0] & /*$homing_orb*/ 8 && t5_value !== (t5_value = fnum(/*$homing_orb*/ ctx[3].cost) + "")) set_data_dev(t5, t5_value);
    			if (dirty[0] & /*$spore_orb*/ 2 && t12_value !== (t12_value = fnum(/*$spore_orb*/ ctx[1].value) + "")) set_data_dev(t12, t12_value);
    			if (dirty[0] & /*$spore_orb*/ 2 && t15_value !== (t15_value = fnum(/*$spore_orb*/ ctx[1].cost) + "")) set_data_dev(t15, t15_value);
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
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(200:2) {#if $got_mana}",
    		ctx
    	});

    	return block;
    }

    // (221:2) {:else}
    function create_else_block$1(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "?";
    			button.disabled = true;
    			attr_dev(button, "class", "svelte-spajw8");
    			add_location(button, file$3, 220, 10, 7304);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(221:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (219:2) {#if $new_game_plus}
    function create_if_block_2(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "?";
    			attr_dev(button, "class", "svelte-spajw8");
    			add_location(button, file$3, 219, 2, 7275);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(219:2) {#if $new_game_plus}",
    		ctx
    	});

    	return block;
    }

    // (230:2) {#if $prestige.times >= 1}
    function create_if_block_1(ctx) {
    	let span;
    	let t0;
    	let t1_value = fnum(/*$light_orb*/ ctx[4].amount) + "";
    	let t1;
    	let br;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("Light Orbs: ");
    			t1 = text(t1_value);
    			br = element("br");
    			set_style(span, "color", "#00cccc");
    			add_location(span, file$3, 230, 3, 8083);
    			add_location(br, file$3, 230, 77, 8157);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			insert_dev(target, br, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$light_orb*/ 16 && t1_value !== (t1_value = fnum(/*$light_orb*/ ctx[4].amount) + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(230:2) {#if $prestige.times >= 1}",
    		ctx
    	});

    	return block;
    }

    // (233:2) {#if $got_mana}
    function create_if_block$1(ctx) {
    	let span0;
    	let t0;
    	let t1_value = fnum(/*$homing_orb*/ ctx[3].amount) + "";
    	let t1;
    	let br;
    	let t2;
    	let span1;
    	let t3;
    	let t4_value = fnum(/*$spore_orb*/ ctx[1].amount) + "";
    	let t4;

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			t0 = text("Homing Orbs: ");
    			t1 = text(t1_value);
    			br = element("br");
    			t2 = space();
    			span1 = element("span");
    			t3 = text("Spore Orbs: ");
    			t4 = text(t4_value);
    			set_style(span0, "color", "#cccc00");
    			add_location(span0, file$3, 233, 3, 8191);
    			add_location(br, file$3, 233, 79, 8267);
    			set_style(span1, "color", "#ffaa00");
    			add_location(span1, file$3, 234, 3, 8275);
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
    			if (dirty[0] & /*$homing_orb*/ 8 && t1_value !== (t1_value = fnum(/*$homing_orb*/ ctx[3].amount) + "")) set_data_dev(t1, t1_value);
    			if (dirty[0] & /*$spore_orb*/ 2 && t4_value !== (t4_value = fnum(/*$spore_orb*/ ctx[1].amount) + "")) set_data_dev(t4, t4_value);
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
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(233:2) {#if $got_mana}",
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
    	let t3_value = fnum(/*$mana*/ ctx[2]) + "";
    	let t3;
    	let t4;
    	let div0;
    	let t5;
    	let div2;
    	let button2;
    	let t6;
    	let p;
    	let t7;
    	let t8_value = fnum(/*$basic_orb*/ ctx[5].value) + "";
    	let t8;
    	let t9;
    	let div1;
    	let button0;
    	let t10;
    	let t11_value = fnum(/*$basic_orb*/ ctx[5].cost) + "";
    	let t11;
    	let t12;
    	let button1;
    	let t14;
    	let t15;
    	let t16;
    	let t17;
    	let h31;
    	let t18;
    	let br0;
    	let t19;
    	let em;
    	let t21;
    	let t22;
    	let h32;
    	let t23;
    	let br1;
    	let t24;
    	let t25;
    	let h33;
    	let t26;
    	let br2;
    	let t27;
    	let t28;
    	let h34;
    	let t30;
    	let h35;
    	let t31;
    	let br3;
    	let t32;
    	let t33;
    	let h36;
    	let span1;
    	let t34;
    	let t35_value = fnum(/*$basic_orb*/ ctx[5].amount) + "";
    	let t35;
    	let br4;
    	let t36;
    	let t37;
    	let t38;
    	let artifacts;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*$unlocked_fighting*/ ctx[9]) return create_if_block_5;
    		return create_else_block_3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*$prestige*/ ctx[10].times >= 1) return create_if_block_4;
    		return create_else_block_2;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	function select_block_type_2(ctx, dirty) {
    		if (/*$got_mana*/ ctx[8]) return create_if_block_3;
    		return create_else_block_1;
    	}

    	let current_block_type_2 = select_block_type_2(ctx);
    	let if_block2 = current_block_type_2(ctx);

    	function select_block_type_3(ctx, dirty) {
    		if (/*$new_game_plus*/ ctx[15]) return create_if_block_2;
    		return create_else_block$1;
    	}

    	let current_block_type_3 = select_block_type_3(ctx);
    	let if_block3 = current_block_type_3(ctx);
    	let if_block4 = /*$prestige*/ ctx[10].times >= 1 && create_if_block_1(ctx);
    	let if_block5 = /*$got_mana*/ ctx[8] && create_if_block$1(ctx);
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
    			t7 = text("Value: ");
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
    			if_block2.c();
    			t16 = space();
    			if_block3.c();
    			t17 = space();
    			h31 = element("h3");
    			t18 = text("Normal gravity, drag, value, etc.");
    			br0 = element("br");
    			t19 = text("Just... ");
    			em = element("em");
    			em.textContent = "Average";
    			t21 = text(".");
    			t22 = space();
    			h32 = element("h3");
    			t23 = text("Low gravity and drag, but normal value.");
    			br1 = element("br");
    			t24 = text("Like an aerodynamic ping pong ball!");
    			t25 = space();
    			h33 = element("h3");
    			t26 = text("Lower value, but orbits around the mouse.");
    			br2 = element("br");
    			t27 = text("Buy a bunch and watch the satisfaction!");
    			t28 = space();
    			h34 = element("h3");
    			h34.textContent = "Normal gravity, drag, and value. Spawns smaller, lower value, orbs that despawn after a few seconds.";
    			t30 = space();
    			h35 = element("h3");
    			t31 = text("Use your orbs in The Monster Tower to get Mana.");
    			br3 = element("br");
    			t32 = text("An orb's damage is equal to its cash value.");
    			t33 = space();
    			h36 = element("h3");
    			span1 = element("span");
    			t34 = text("Basic Orbs: ");
    			t35 = text(t35_value);
    			br4 = element("br");
    			t36 = space();
    			if (if_block4) if_block4.c();
    			t37 = space();
    			if (if_block5) if_block5.c();
    			t38 = space();
    			create_component(artifacts.$$.fragment);
    			set_style(span0, "font-weight", "normal");
    			add_location(span0, file$3, 159, 20, 4516);
    			attr_dev(h30, "id", "mana");
    			attr_dev(h30, "class", "svelte-spajw8");
    			add_location(h30, file$3, 159, 1, 4497);
    			attr_dev(div0, "id", "hold-btn");
    			attr_dev(div0, "class", "svelte-spajw8");
    			add_location(div0, file$3, 160, 1, 4583);
    			attr_dev(p, "class", "stat svelte-spajw8");
    			add_location(p, file$3, 184, 3, 5907);
    			attr_dev(button0, "class", "buy-sell svelte-spajw8");
    			add_location(button0, file$3, 186, 4, 5989);
    			attr_dev(button1, "class", "buy-sell svelte-spajw8");
    			add_location(button1, file$3, 187, 4, 6077);
    			attr_dev(div1, "class", "orb-info svelte-spajw8");
    			add_location(div1, file$3, 185, 3, 5962);
    			attr_dev(button2, "class", "trade-btn svelte-spajw8");
    			attr_dev(button2, "id", "basic-btn");
    			add_location(button2, file$3, 183, 2, 5857);
    			add_location(br0, file$3, 221, 55, 7393);
    			add_location(em, file$3, 221, 67, 7405);
    			attr_dev(h31, "id", "basic-info");
    			attr_dev(h31, "class", "svelte-spajw8");
    			add_location(h31, file$3, 221, 2, 7340);
    			add_location(br1, file$3, 222, 61, 7489);
    			attr_dev(h32, "id", "light-info");
    			attr_dev(h32, "class", "svelte-spajw8");
    			add_location(h32, file$3, 222, 2, 7430);
    			add_location(br2, file$3, 223, 64, 7598);
    			attr_dev(h33, "id", "homing-info");
    			attr_dev(h33, "class", "svelte-spajw8");
    			add_location(h33, file$3, 223, 2, 7536);
    			attr_dev(h34, "id", "spore-info");
    			attr_dev(h34, "class", "svelte-spajw8");
    			add_location(h34, file$3, 224, 2, 7649);
    			add_location(br3, file$3, 225, 116, 7891);
    			attr_dev(h35, "id", "fight-info");
    			set_style(h35, "display", /*hover_fight*/ ctx[11] ? "block" : "");
    			attr_dev(h35, "class", "svelte-spajw8");
    			add_location(h35, file$3, 225, 2, 7777);
    			attr_dev(div2, "id", "orb-row");
    			attr_dev(div2, "class", "svelte-spajw8");
    			add_location(div2, file$3, 182, 1, 5836);
    			set_style(span1, "color", "#ccc");
    			add_location(span1, file$3, 228, 2, 7975);
    			add_location(br4, file$3, 228, 73, 8046);
    			attr_dev(h36, "id", "orb-stats");
    			attr_dev(h36, "class", "svelte-spajw8");
    			add_location(h36, file$3, 227, 1, 7953);
    			attr_dev(main, "class", "svelte-spajw8");
    			add_location(main, file$3, 158, 0, 4489);
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
    			if_block2.m(div2, null);
    			append_dev(div2, t16);
    			if_block3.m(div2, null);
    			append_dev(div2, t17);
    			append_dev(div2, h31);
    			append_dev(h31, t18);
    			append_dev(h31, br0);
    			append_dev(h31, t19);
    			append_dev(h31, em);
    			append_dev(h31, t21);
    			append_dev(div2, t22);
    			append_dev(div2, h32);
    			append_dev(h32, t23);
    			append_dev(h32, br1);
    			append_dev(h32, t24);
    			append_dev(div2, t25);
    			append_dev(div2, h33);
    			append_dev(h33, t26);
    			append_dev(h33, br2);
    			append_dev(h33, t27);
    			append_dev(div2, t28);
    			append_dev(div2, h34);
    			append_dev(div2, t30);
    			append_dev(div2, h35);
    			append_dev(h35, t31);
    			append_dev(h35, br3);
    			append_dev(h35, t32);
    			append_dev(main, t33);
    			append_dev(main, h36);
    			append_dev(h36, span1);
    			append_dev(span1, t34);
    			append_dev(span1, t35);
    			append_dev(h36, br4);
    			append_dev(h36, t36);
    			if (if_block4) if_block4.m(h36, null);
    			append_dev(h36, t37);
    			if (if_block5) if_block5.m(h36, null);
    			append_dev(main, t38);
    			mount_component(artifacts, main, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*buy_basic*/ ctx[17], false, false, false),
    					listen_dev(button1, "click", /*sell_basic*/ ctx[18], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty[0] & /*$mana*/ 4) && t3_value !== (t3_value = fnum(/*$mana*/ ctx[2]) + "")) set_data_dev(t3, t3_value);

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

    			if ((!current || dirty[0] & /*$basic_orb*/ 32) && t8_value !== (t8_value = fnum(/*$basic_orb*/ ctx[5].value) + "")) set_data_dev(t8, t8_value);
    			if ((!current || dirty[0] & /*$basic_orb*/ 32) && t11_value !== (t11_value = fnum(/*$basic_orb*/ ctx[5].cost) + "")) set_data_dev(t11, t11_value);

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

    			if (current_block_type_2 === (current_block_type_2 = select_block_type_2(ctx)) && if_block2) {
    				if_block2.p(ctx, dirty);
    			} else {
    				if_block2.d(1);
    				if_block2 = current_block_type_2(ctx);

    				if (if_block2) {
    					if_block2.c();
    					if_block2.m(div2, t16);
    				}
    			}

    			if (current_block_type_3 !== (current_block_type_3 = select_block_type_3(ctx))) {
    				if_block3.d(1);
    				if_block3 = current_block_type_3(ctx);

    				if (if_block3) {
    					if_block3.c();
    					if_block3.m(div2, t17);
    				}
    			}

    			if (!current || dirty[0] & /*hover_fight*/ 2048) {
    				set_style(h35, "display", /*hover_fight*/ ctx[11] ? "block" : "");
    			}

    			if ((!current || dirty[0] & /*$basic_orb*/ 32) && t35_value !== (t35_value = fnum(/*$basic_orb*/ ctx[5].amount) + "")) set_data_dev(t35, t35_value);

    			if (/*$prestige*/ ctx[10].times >= 1) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);
    				} else {
    					if_block4 = create_if_block_1(ctx);
    					if_block4.c();
    					if_block4.m(h36, t37);
    				}
    			} else if (if_block4) {
    				if_block4.d(1);
    				if_block4 = null;
    			}

    			if (/*$got_mana*/ ctx[8]) {
    				if (if_block5) {
    					if_block5.p(ctx, dirty);
    				} else {
    					if_block5 = create_if_block$1(ctx);
    					if_block5.c();
    					if_block5.m(h36, null);
    				}
    			} else if (if_block5) {
    				if_block5.d(1);
    				if_block5 = null;
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
    			if_block2.d();
    			if_block3.d();
    			if (if_block4) if_block4.d();
    			if (if_block5) if_block5.d();
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
    	let $buy_amount;
    	let $homing_orb;
    	let $light_orb;
    	let $cash;
    	let $basic_orb;
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
    	let $new_game_plus;
    	validate_store(spore_orb, 'spore_orb');
    	component_subscribe($$self, spore_orb, $$value => $$invalidate(1, $spore_orb = $$value));
    	validate_store(mana, 'mana');
    	component_subscribe($$self, mana, $$value => $$invalidate(2, $mana = $$value));
    	validate_store(buy_amount, 'buy_amount');
    	component_subscribe($$self, buy_amount, $$value => $$invalidate(30, $buy_amount = $$value));
    	validate_store(homing_orb, 'homing_orb');
    	component_subscribe($$self, homing_orb, $$value => $$invalidate(3, $homing_orb = $$value));
    	validate_store(light_orb, 'light_orb');
    	component_subscribe($$self, light_orb, $$value => $$invalidate(4, $light_orb = $$value));
    	validate_store(cash, 'cash');
    	component_subscribe($$self, cash, $$value => $$invalidate(31, $cash = $$value));
    	validate_store(basic_orb, 'basic_orb');
    	component_subscribe($$self, basic_orb, $$value => $$invalidate(5, $basic_orb = $$value));
    	validate_store(canvas_toggled, 'canvas_toggled');
    	component_subscribe($$self, canvas_toggled, $$value => $$invalidate(32, $canvas_toggled = $$value));
    	validate_store(fighting, 'fighting');
    	component_subscribe($$self, fighting, $$value => $$invalidate(12, $fighting = $$value));
    	validate_store(fight_cost, 'fight_cost');
    	component_subscribe($$self, fight_cost, $$value => $$invalidate(13, $fight_cost = $$value));
    	validate_store(next_tower_lvl, 'next_tower_lvl');
    	component_subscribe($$self, next_tower_lvl, $$value => $$invalidate(6, $next_tower_lvl = $$value));
    	validate_store(afford_fight, 'afford_fight');
    	component_subscribe($$self, afford_fight, $$value => $$invalidate(25, $afford_fight = $$value));
    	validate_store(auto_fight, 'auto_fight');
    	component_subscribe($$self, auto_fight, $$value => $$invalidate(7, $auto_fight = $$value));
    	validate_store(got_mana, 'got_mana');
    	component_subscribe($$self, got_mana, $$value => $$invalidate(8, $got_mana = $$value));
    	validate_store(unlocked_fighting, 'unlocked_fighting');
    	component_subscribe($$self, unlocked_fighting, $$value => $$invalidate(9, $unlocked_fighting = $$value));
    	validate_store(prestige, 'prestige');
    	component_subscribe($$self, prestige, $$value => $$invalidate(10, $prestige = $$value));
    	validate_store(rarities, 'rarities');
    	component_subscribe($$self, rarities, $$value => $$invalidate(14, $rarities = $$value));
    	validate_store(new_game_plus, 'new_game_plus');
    	component_subscribe($$self, new_game_plus, $$value => $$invalidate(15, $new_game_plus = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Lab', slots, []);
    	let hover_fight = false;
    	let fight_btn = null;
    	set_store_value(afford_fight, $afford_fight = () => $cash >= $fight_cost, $afford_fight);

    	const click_fight = () => {
    		if ($cash < $fight_cost) return;
    		set_store_value(cash, $cash -= $fight_cost, $cash);
    		set_store_value(fighting, $fighting = true, $fighting);
    		set_store_value(canvas_toggled, $canvas_toggled = true, $canvas_toggled);
    	};

    	//#endregion
    	//#region | Total Orbs
    	let total_orbs = 0;

    	//#endregion
    	//#region | Basic Orb
    	const buy_basic = () => {
    		if ($cash < $basic_orb.cost) return;
    		set_store_value(cash, $cash -= $basic_orb.cost, $cash);
    		basic_orb.update(v => (v.cost += 10, v.amount++, v));

    		// basic_orb.update( v => (v.cost = Math.floor(v.cost*1.1), v.amount++, v) );
    		if ($buy_amount == 3) {
    			const res = spend_cash_add($cash, $basic_orb.cost, 10);
    			set_store_value(cash, $cash = res.cash, $cash);
    			basic_orb.update(v => (v.cost = res.cost, v.amount += res.i, v));
    		} else if ($buy_amount == 1) run_n(buy_basic, 9); else if ($buy_amount == 2) run_n(buy_basic, 99);
    	};

    	const sell_basic = () => {
    		if (total_orbs <= 1) return;
    		basic_orb.update(v => (v.cost -= 10, v.amount--, v));
    		set_store_value(cash, $cash += Math.floor($basic_orb.cost / 2), $cash);
    	}; // basic_orb.update( v => (v.cost = Math.ceil(v.cost/1.2), v.amount--, v) );

    	//#endregion
    	//#region | Light Orb
    	const buy_light = () => {
    		if ($cash < $light_orb.cost) return;
    		set_store_value(cash, $cash -= $light_orb.cost, $cash);
    		light_orb.update(v => (v.cost += 15, v.amount++, v));

    		if ($buy_amount == 3) {
    			const res = spend_cash_add($cash, $light_orb.cost, 15);
    			set_store_value(cash, $cash = res.cash, $cash);
    			light_orb.update(v => (v.cost = res.cost, v.amount += res.i, v));
    		} else if ($buy_amount == 1) run_n(buy_light, 9); else if ($buy_amount == 2) run_n(buy_light, 99);
    	};

    	const sell_light = () => {
    		if (total_orbs <= 1) return;
    		set_store_value(cash, $cash += Math.floor($light_orb.cost / 2.2), $cash);
    		light_orb.update(v => (v.cost -= 15, v.amount--, v));
    	};

    	//#endregion
    	//#region | Homing Orb
    	const buy_homing = () => {
    		if ($mana < $homing_orb.cost) return;
    		set_store_value(mana, $mana -= $homing_orb.cost, $mana);
    		homing_orb.update(v => (v.amount++, v));

    		if ($buy_amount == 3) {
    			const res = spend_cash_add($mana, $homing_orb.cost, 0);
    			set_store_value(mana, $mana = res.cash, $mana);
    			homing_orb.update(v => (v.amount += res.i, v));
    		} else if ($buy_amount == 1) run_n(buy_homing, 9); else if ($buy_amount == 2) run_n(buy_homing, 99);
    	};

    	const sell_homing = () => {
    		if (total_orbs <= 1) return;
    		set_store_value(mana, $mana += Math.floor($homing_orb.cost / 2.2), $mana);
    		homing_orb.update(v => (v.amount--, v));
    	};

    	//#endregion
    	//#region | Spore Orb
    	const buy_spore = () => {
    		if ($mana < $spore_orb.cost) return;
    		set_store_value(mana, $mana -= $spore_orb.cost, $mana);
    		spore_orb.update(v => (v.amount++, v));

    		if ($buy_amount == 3) {
    			const res = spend_cash_add($mana, $spore_orb.cost, 0);
    			set_store_value(mana, $mana = res.cash, $mana);
    			spore_orb.update(v => (v.amount += res.i, v));
    		} else if ($buy_amount == 1) run_n(buy_spore, 9); else if ($buy_amount == 2) run_n(buy_spore, 99);
    	};

    	const sell_spore = () => {
    		if (total_orbs <= 1) return;
    		set_store_value(mana, $mana += Math.floor($spore_orb.cost / 2.2), $mana);
    		spore_orb.update(v => (v.amount--, v));
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Lab> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => set_store_value(auto_fight, $auto_fight = !$auto_fight, $auto_fight);
    	const click_handler_1 = () => click_fight();

    	function button1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			fight_btn = $$value;
    			$$invalidate(0, fight_btn);
    		});
    	}

    	$$self.$capture_state = () => ({
    		fnum,
    		run_n,
    		spend_cash_add,
    		canvas_toggled,
    		fighting,
    		mana,
    		cash,
    		fight_cost,
    		auto_fight,
    		afford_fight,
    		new_game_plus,
    		basic_orb,
    		light_orb,
    		homing_orb,
    		spore_orb,
    		prestige,
    		rarities,
    		unlocked_fighting,
    		got_mana,
    		next_tower_lvl,
    		buy_amount,
    		Artifacts,
    		hover_fight,
    		fight_btn,
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
    		$buy_amount,
    		$homing_orb,
    		$light_orb,
    		$cash,
    		$basic_orb,
    		$canvas_toggled,
    		$fighting,
    		$fight_cost,
    		$next_tower_lvl,
    		$afford_fight,
    		$auto_fight,
    		$got_mana,
    		$unlocked_fighting,
    		$prestige,
    		$rarities,
    		$new_game_plus
    	});

    	$$self.$inject_state = $$props => {
    		if ('hover_fight' in $$props) $$invalidate(11, hover_fight = $$props.hover_fight);
    		if ('fight_btn' in $$props) $$invalidate(0, fight_btn = $$props.fight_btn);
    		if ('total_orbs' in $$props) total_orbs = $$props.total_orbs;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*fight_btn*/ 1) {
    			{
    				if (fight_btn != null) {
    					$$invalidate(
    						0,
    						fight_btn.onmouseenter = () => {
    							$$invalidate(11, hover_fight = true);
    						},
    						fight_btn
    					);

    					$$invalidate(
    						0,
    						fight_btn.onmouseleave = () => {
    							$$invalidate(11, hover_fight = false);
    						},
    						fight_btn
    					);
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*$unlocked_fighting, $prestige*/ 1536) {
    			if (!$unlocked_fighting && $prestige.times >= 3) set_store_value(unlocked_fighting, $unlocked_fighting = true, $unlocked_fighting);
    		}

    		if ($$self.$$.dirty[0] & /*$got_mana, $mana*/ 260) {
    			if (!$got_mana && $mana > 0) set_store_value(got_mana, $got_mana = true, $got_mana);
    		}

    		if ($$self.$$.dirty[0] & /*$next_tower_lvl*/ 64) {
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

    		if ($$self.$$.dirty[0] & /*$auto_fight, $afford_fight*/ 33554560) {
    			{
    				if ($auto_fight) {
    					if ($afford_fight()) {
    						set_store_value(auto_fight, $auto_fight = true, $auto_fight);
    						click_fight();
    					} else set_store_value(auto_fight, $auto_fight = false, $auto_fight);
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*$next_tower_lvl*/ 64) {
    			//#endregion
    			//#region | Fight Button
    			set_store_value(fight_cost, $fight_cost = 1e3 * (1 + 1.2 * ($next_tower_lvl - 1)), $fight_cost);
    		}

    		if ($$self.$$.dirty[0] & /*$basic_orb, $light_orb, $homing_orb, $spore_orb*/ 58) {
    			total_orbs = $basic_orb.amount + $light_orb.amount + $homing_orb.amount + $spore_orb.amount;
    		}
    	};

    	return [
    		fight_btn,
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
    		hover_fight,
    		$fighting,
    		$fight_cost,
    		$rarities,
    		$new_game_plus,
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
    		button1_binding
    	];
    }

    class Lab extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {}, null, [-1, -1]);

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
    	let h30;
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
    	let hr0;
    	let t12;
    	let div3;
    	let h31;
    	let t13;
    	let t14;
    	let t15;
    	let div2;
    	let button5;
    	let t17;
    	let input0;
    	let t18;
    	let p0;
    	let t20;
    	let hr1;
    	let t21;
    	let div4;
    	let h32;
    	let t22;

    	let t23_value = (/*$render_mod*/ ctx[8] == 1
    	? "tick"
    	: `${/*$render_mod*/ ctx[8]} ticks`) + "";

    	let t23;
    	let t24;
    	let input1;
    	let t25;
    	let hr2;
    	let t26;
    	let div5;
    	let button6;
    	let t28;
    	let input2;
    	let t29;
    	let button7;
    	let t31;
    	let input3;
    	let t32;
    	let div6;
    	let button8;
    	let t34;
    	let button9;
    	let t36;
    	let button10;
    	let t37;
    	let button10_disabled_value;
    	let t38;
    	let div8;
    	let h33;
    	let t39;
    	let br0;
    	let t40;
    	let t41;
    	let hr3;
    	let t42;
    	let p1;
    	let t43;
    	let em;
    	let t45;
    	let br1;
    	let br2;
    	let t46;
    	let br3;
    	let br4;
    	let t47;
    	let b;
    	let t49;
    	let div7;
    	let button11;
    	let t51;
    	let button12;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div1 = element("div");
    			h30 = element("h3");
    			h30.textContent = "Rendering Mode";
    			t1 = space();
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "Circles";
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "Squares";
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
    			hr0 = element("hr");
    			t12 = space();
    			div3 = element("div");
    			h31 = element("h3");
    			t13 = text("Max Rendered Orbs: ");
    			t14 = text(/*render_amount*/ ctx[4]);
    			t15 = space();
    			div2 = element("div");
    			button5 = element("button");
    			button5.textContent = "Set";
    			t17 = space();
    			input0 = element("input");
    			t18 = space();
    			p0 = element("p");
    			p0.textContent = "Default: 100. Save data before changing to a really high number! (Could crash game)";
    			t20 = space();
    			hr1 = element("hr");
    			t21 = space();
    			div4 = element("div");
    			h32 = element("h3");
    			t22 = text("Render once every ");
    			t23 = text(t23_value);
    			t24 = space();
    			input1 = element("input");
    			t25 = space();
    			hr2 = element("hr");
    			t26 = space();
    			div5 = element("div");
    			button6 = element("button");
    			button6.textContent = "Get Data";
    			t28 = space();
    			input2 = element("input");
    			t29 = space();
    			button7 = element("button");
    			button7.textContent = "Load Data";
    			t31 = space();
    			input3 = element("input");
    			t32 = space();
    			div6 = element("div");
    			button8 = element("button");
    			button8.textContent = "Save Locally";
    			t34 = space();
    			button9 = element("button");
    			button9.textContent = "Clear Game Data";
    			t36 = space();
    			button10 = element("button");
    			t37 = text("*Secret*");
    			t38 = space();
    			div8 = element("div");
    			h33 = element("h3");
    			t39 = text("You've gotten pretty far...");
    			br0 = element("br");
    			t40 = text("How about starting over?");
    			t41 = space();
    			hr3 = element("hr");
    			t42 = space();
    			p1 = element("p");
    			t43 = text("In this fresh start, called \"New Game+\", \n\t\t\tyou will unlock the elusive ");
    			em = element("em");
    			em.textContent = "5th Orb";
    			t45 = text(", \n\t\t\tartifacts, more events (like those shadow orbs), and more monsters.\n\t\t\t");
    			br1 = element("br");
    			br2 = element("br");
    			t46 = text("\"That's cool and all, but what's the catch?\" I here you say. \n\t\t\tWell, the game is twice as hard.");
    			br3 = element("br");
    			br4 = element("br");
    			t47 = space();
    			b = element("b");
    			b.textContent = "So, what'll it be?";
    			t49 = space();
    			div7 = element("div");
    			button11 = element("button");
    			button11.textContent = "Yeah, I guess";
    			t51 = space();
    			button12 = element("button");
    			button12.textContent = "Hm... nah";
    			attr_dev(h30, "class", "sect-title svelte-1f79egq");
    			set_style(h30, "padding-top", ".3rem");
    			set_style(h30, "padding-bottom", ".7rem");
    			add_location(h30, file$2, 18, 2, 504);
    			attr_dev(button0, "class", "svelte-1f79egq");
    			toggle_class(button0, "selected", /*$render_mode*/ ctx[6] == 1);
    			add_location(button0, file$2, 20, 3, 631);
    			attr_dev(button1, "class", "svelte-1f79egq");
    			toggle_class(button1, "selected", /*$render_mode*/ ctx[6] == 0);
    			add_location(button1, file$2, 21, 3, 727);
    			attr_dev(button2, "class", "svelte-1f79egq");
    			toggle_class(button2, "selected", /*$render_mode*/ ctx[6] == 2);
    			add_location(button2, file$2, 22, 3, 823);
    			attr_dev(button3, "class", "svelte-1f79egq");
    			toggle_class(button3, "selected", /*$render_mode*/ ctx[6] == 3);
    			add_location(button3, file$2, 23, 3, 916);
    			attr_dev(button4, "class", "svelte-1f79egq");
    			toggle_class(button4, "selected", /*$render_mode*/ ctx[6] == 4);
    			add_location(button4, file$2, 24, 3, 1014);
    			attr_dev(div0, "class", "rendering-row svelte-1f79egq");
    			add_location(div0, file$2, 19, 2, 600);
    			attr_dev(div1, "class", "sect svelte-1f79egq");
    			add_location(div1, file$2, 17, 1, 483);
    			attr_dev(hr0, "class", "svelte-1f79egq");
    			add_location(hr0, file$2, 27, 1, 1122);
    			attr_dev(h31, "class", "sect-title svelte-1f79egq");
    			add_location(h31, file$2, 29, 2, 1168);
    			attr_dev(button5, "class", "svelte-1f79egq");
    			add_location(button5, file$2, 31, 3, 1242);
    			attr_dev(input0, "type", "range");
    			attr_dev(input0, "step", "10");
    			attr_dev(input0, "min", "10");
    			attr_dev(input0, "max", "1000");
    			attr_dev(input0, "id", "render");
    			add_location(input0, file$2, 31, 68, 1307);
    			attr_dev(div2, "class", "svelte-1f79egq");
    			add_location(div2, file$2, 30, 2, 1233);
    			attr_dev(p0, "class", "svelte-1f79egq");
    			add_location(p0, file$2, 33, 2, 1408);
    			attr_dev(div3, "class", "sect svelte-1f79egq");
    			attr_dev(div3, "id", "render-amount");
    			add_location(div3, file$2, 28, 1, 1128);
    			attr_dev(hr1, "class", "svelte-1f79egq");
    			add_location(hr1, file$2, 35, 1, 1508);
    			attr_dev(h32, "class", "sect-title svelte-1f79egq");
    			add_location(h32, file$2, 37, 2, 1551);
    			attr_dev(input1, "type", "range");
    			attr_dev(input1, "step", "1");
    			attr_dev(input1, "min", "1");
    			attr_dev(input1, "max", "30");
    			attr_dev(input1, "id", "render");
    			add_location(input1, file$2, 38, 2, 1652);
    			attr_dev(div4, "class", "sect svelte-1f79egq");
    			attr_dev(div4, "id", "render-mod");
    			add_location(div4, file$2, 36, 1, 1514);
    			attr_dev(hr2, "class", "svelte-1f79egq");
    			add_location(hr2, file$2, 40, 1, 1745);
    			attr_dev(button6, "class", "svelte-1f79egq");
    			add_location(button6, file$2, 42, 2, 1782);
    			attr_dev(input2, "placeholder", "Your data will automatically be copied");
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "name", "get");
    			attr_dev(input2, "id", "get");
    			add_location(input2, file$2, 42, 49, 1829);
    			attr_dev(button7, "class", "svelte-1f79egq");
    			add_location(button7, file$2, 43, 2, 1950);
    			attr_dev(input3, "placeholder", "Paste your data here");
    			attr_dev(input3, "type", "text");
    			attr_dev(input3, "name", "load");
    			attr_dev(input3, "id", "load");
    			add_location(input3, file$2, 43, 94, 2042);
    			attr_dev(div5, "class", "sect svelte-1f79egq");
    			attr_dev(div5, "id", "data");
    			add_location(div5, file$2, 41, 1, 1751);
    			attr_dev(button8, "class", "svelte-1f79egq");
    			add_location(button8, file$2, 46, 2, 2190);
    			attr_dev(button9, "class", "svelte-1f79egq");
    			add_location(button9, file$2, 47, 2, 2249);
    			button10.disabled = button10_disabled_value = /*$rarities*/ ctx[9].l < 100;
    			attr_dev(button10, "class", "svelte-1f79egq");
    			add_location(button10, file$2, 48, 2, 2310);
    			attr_dev(div6, "class", "sect svelte-1f79egq");
    			attr_dev(div6, "id", "btn-trio");
    			add_location(div6, file$2, 45, 1, 2155);
    			add_location(br0, file$2, 52, 33, 2498);
    			attr_dev(h33, "class", "svelte-1f79egq");
    			add_location(h33, file$2, 52, 2, 2467);
    			attr_dev(hr3, "class", "svelte-1f79egq");
    			add_location(hr3, file$2, 53, 2, 2534);
    			add_location(em, file$2, 56, 31, 2621);
    			add_location(br1, file$2, 58, 3, 2714);
    			add_location(br2, file$2, 58, 7, 2718);
    			add_location(br3, file$2, 59, 35, 2819);
    			add_location(br4, file$2, 59, 39, 2823);
    			add_location(b, file$2, 60, 3, 2831);
    			attr_dev(p1, "class", "svelte-1f79egq");
    			add_location(p1, file$2, 54, 2, 2541);
    			attr_dev(button11, "class", "svelte-1f79egq");
    			add_location(button11, file$2, 63, 3, 2875);
    			attr_dev(button12, "class", "svelte-1f79egq");
    			add_location(button12, file$2, 64, 3, 2970);
    			attr_dev(div7, "class", "svelte-1f79egq");
    			add_location(div7, file$2, 62, 2, 2866);
    			attr_dev(div8, "id", "secret");
    			attr_dev(div8, "class", "svelte-1f79egq");
    			toggle_class(div8, "show-secret", /*show_secret*/ ctx[5]);
    			add_location(div8, file$2, 51, 1, 2415);
    			attr_dev(main, "id", "settings");
    			attr_dev(main, "class", "svelte-1f79egq");
    			toggle_class(main, "open", /*open*/ ctx[1]);
    			add_location(main, file$2, 16, 0, 429);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div1);
    			append_dev(div1, h30);
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
    			append_dev(main, hr0);
    			append_dev(main, t12);
    			append_dev(main, div3);
    			append_dev(div3, h31);
    			append_dev(h31, t13);
    			append_dev(h31, t14);
    			append_dev(div3, t15);
    			append_dev(div3, div2);
    			append_dev(div2, button5);
    			append_dev(div2, t17);
    			append_dev(div2, input0);
    			set_input_value(input0, /*render_amount*/ ctx[4]);
    			append_dev(div3, t18);
    			append_dev(div3, p0);
    			append_dev(main, t20);
    			append_dev(main, hr1);
    			append_dev(main, t21);
    			append_dev(main, div4);
    			append_dev(div4, h32);
    			append_dev(h32, t22);
    			append_dev(h32, t23);
    			append_dev(div4, t24);
    			append_dev(div4, input1);
    			set_input_value(input1, /*$render_mod*/ ctx[8]);
    			append_dev(main, t25);
    			append_dev(main, hr2);
    			append_dev(main, t26);
    			append_dev(main, div5);
    			append_dev(div5, button6);
    			append_dev(div5, t28);
    			append_dev(div5, input2);
    			set_input_value(input2, /*get_data_str*/ ctx[2]);
    			append_dev(div5, t29);
    			append_dev(div5, button7);
    			append_dev(div5, t31);
    			append_dev(div5, input3);
    			set_input_value(input3, /*load_data_str*/ ctx[3]);
    			append_dev(main, t32);
    			append_dev(main, div6);
    			append_dev(div6, button8);
    			append_dev(div6, t34);
    			append_dev(div6, button9);
    			append_dev(div6, t36);
    			append_dev(div6, button10);
    			append_dev(button10, t37);
    			append_dev(main, t38);
    			append_dev(main, div8);
    			append_dev(div8, h33);
    			append_dev(h33, t39);
    			append_dev(h33, br0);
    			append_dev(h33, t40);
    			append_dev(div8, t41);
    			append_dev(div8, hr3);
    			append_dev(div8, t42);
    			append_dev(div8, p1);
    			append_dev(p1, t43);
    			append_dev(p1, em);
    			append_dev(p1, t45);
    			append_dev(p1, br1);
    			append_dev(p1, br2);
    			append_dev(p1, t46);
    			append_dev(p1, br3);
    			append_dev(p1, br4);
    			append_dev(p1, t47);
    			append_dev(p1, b);
    			append_dev(div8, t49);
    			append_dev(div8, div7);
    			append_dev(div7, button11);
    			append_dev(div7, t51);
    			append_dev(div7, button12);
    			/*main_binding*/ ctx[25](main);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[11], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[12], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[13], false, false, false),
    					listen_dev(button3, "click", /*click_handler_3*/ ctx[14], false, false, false),
    					listen_dev(button4, "click", /*click_handler_4*/ ctx[15], false, false, false),
    					listen_dev(button5, "click", /*click_handler_5*/ ctx[16], false, false, false),
    					listen_dev(input0, "change", /*input0_change_input_handler*/ ctx[17]),
    					listen_dev(input0, "input", /*input0_change_input_handler*/ ctx[17]),
    					listen_dev(input1, "change", /*input1_change_input_handler*/ ctx[18]),
    					listen_dev(input1, "input", /*input1_change_input_handler*/ ctx[18]),
    					listen_dev(button6, "click", /*copy_data*/ ctx[10], false, false, false),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[19]),
    					listen_dev(button7, "click", /*click_handler_6*/ ctx[20], false, false, false),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[21]),
    					listen_dev(button8, "click", store_to_local, false, false, false),
    					listen_dev(button9, "click", clear_storage, false, false, false),
    					listen_dev(button10, "click", /*click_handler_7*/ ctx[22], false, false, false),
    					listen_dev(button11, "click", /*click_handler_8*/ ctx[23], false, false, false),
    					listen_dev(button12, "click", /*click_handler_9*/ ctx[24], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$render_mode*/ 64) {
    				toggle_class(button0, "selected", /*$render_mode*/ ctx[6] == 1);
    			}

    			if (dirty & /*$render_mode*/ 64) {
    				toggle_class(button1, "selected", /*$render_mode*/ ctx[6] == 0);
    			}

    			if (dirty & /*$render_mode*/ 64) {
    				toggle_class(button2, "selected", /*$render_mode*/ ctx[6] == 2);
    			}

    			if (dirty & /*$render_mode*/ 64) {
    				toggle_class(button3, "selected", /*$render_mode*/ ctx[6] == 3);
    			}

    			if (dirty & /*$render_mode*/ 64) {
    				toggle_class(button4, "selected", /*$render_mode*/ ctx[6] == 4);
    			}

    			if (dirty & /*render_amount*/ 16) set_data_dev(t14, /*render_amount*/ ctx[4]);

    			if (dirty & /*render_amount*/ 16) {
    				set_input_value(input0, /*render_amount*/ ctx[4]);
    			}

    			if (dirty & /*$render_mod*/ 256 && t23_value !== (t23_value = (/*$render_mod*/ ctx[8] == 1
    			? "tick"
    			: `${/*$render_mod*/ ctx[8]} ticks`) + "")) set_data_dev(t23, t23_value);

    			if (dirty & /*$render_mod*/ 256) {
    				set_input_value(input1, /*$render_mod*/ ctx[8]);
    			}

    			if (dirty & /*get_data_str*/ 4 && input2.value !== /*get_data_str*/ ctx[2]) {
    				set_input_value(input2, /*get_data_str*/ ctx[2]);
    			}

    			if (dirty & /*load_data_str*/ 8 && input3.value !== /*load_data_str*/ ctx[3]) {
    				set_input_value(input3, /*load_data_str*/ ctx[3]);
    			}

    			if (dirty & /*$rarities*/ 512 && button10_disabled_value !== (button10_disabled_value = /*$rarities*/ ctx[9].l < 100)) {
    				prop_dev(button10, "disabled", button10_disabled_value);
    			}

    			if (dirty & /*show_secret*/ 32) {
    				toggle_class(div8, "show-secret", /*show_secret*/ ctx[5]);
    			}

    			if (dirty & /*open*/ 2) {
    				toggle_class(main, "open", /*open*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			/*main_binding*/ ctx[25](null);
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
    	let $max_render;
    	let $render_mod;
    	let $rarities;
    	validate_store(render_mode, 'render_mode');
    	component_subscribe($$self, render_mode, $$value => $$invalidate(6, $render_mode = $$value));
    	validate_store(max_render, 'max_render');
    	component_subscribe($$self, max_render, $$value => $$invalidate(7, $max_render = $$value));
    	validate_store(render_mod, 'render_mod');
    	component_subscribe($$self, render_mod, $$value => $$invalidate(8, $render_mod = $$value));
    	validate_store(rarities, 'rarities');
    	component_subscribe($$self, rarities, $$value => $$invalidate(9, $rarities = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Settings', slots, []);
    	let { open } = $$props;
    	let { settings = undefined } = $$props;
    	let get_data_str = "";
    	let load_data_str = "";
    	let render_amount = 100;
    	let show_secret = false;

    	const copy_data = () => {
    		$$invalidate(2, get_data_str = get_data());
    		navigator.clipboard.writeText(get_data_str);
    	};

    	const writable_props = ['open', 'settings'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Settings> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => set_store_value(render_mode, $render_mode = 1, $render_mode);
    	const click_handler_1 = () => set_store_value(render_mode, $render_mode = 0, $render_mode);
    	const click_handler_2 = () => set_store_value(render_mode, $render_mode = 2, $render_mode);
    	const click_handler_3 = () => set_store_value(render_mode, $render_mode = 3, $render_mode);
    	const click_handler_4 = () => set_store_value(render_mode, $render_mode = 4, $render_mode);
    	const click_handler_5 = () => set_store_value(max_render, $max_render = render_amount, $max_render);

    	function input0_change_input_handler() {
    		render_amount = to_number(this.value);
    		$$invalidate(4, render_amount);
    	}

    	function input1_change_input_handler() {
    		$render_mod = to_number(this.value);
    		render_mod.set($render_mod);
    	}

    	function input2_input_handler() {
    		get_data_str = this.value;
    		$$invalidate(2, get_data_str);
    	}

    	const click_handler_6 = () => void (load_data(load_data_str), $$invalidate(3, load_data_str = ""));

    	function input3_input_handler() {
    		load_data_str = this.value;
    		$$invalidate(3, load_data_str);
    	}

    	const click_handler_7 = () => void $$invalidate(5, show_secret = true);
    	const click_handler_8 = () => void ($$invalidate(5, show_secret = false), set_new_game_plus());
    	const click_handler_9 = () => void $$invalidate(5, show_secret = false);

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
    		max_render,
    		render_mod,
    		clear_storage,
    		store_to_local,
    		rarities,
    		set_new_game_plus,
    		open,
    		settings,
    		get_data_str,
    		load_data_str,
    		render_amount,
    		show_secret,
    		copy_data,
    		$render_mode,
    		$max_render,
    		$render_mod,
    		$rarities
    	});

    	$$self.$inject_state = $$props => {
    		if ('open' in $$props) $$invalidate(1, open = $$props.open);
    		if ('settings' in $$props) $$invalidate(0, settings = $$props.settings);
    		if ('get_data_str' in $$props) $$invalidate(2, get_data_str = $$props.get_data_str);
    		if ('load_data_str' in $$props) $$invalidate(3, load_data_str = $$props.load_data_str);
    		if ('render_amount' in $$props) $$invalidate(4, render_amount = $$props.render_amount);
    		if ('show_secret' in $$props) $$invalidate(5, show_secret = $$props.show_secret);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		settings,
    		open,
    		get_data_str,
    		load_data_str,
    		render_amount,
    		show_secret,
    		$render_mode,
    		$max_render,
    		$render_mod,
    		$rarities,
    		copy_data,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		input0_change_input_handler,
    		input1_change_input_handler,
    		input2_input_handler,
    		click_handler_6,
    		input3_input_handler,
    		click_handler_7,
    		click_handler_8,
    		click_handler_9,
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
    			attr_dev(img, "draggable", "false");
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

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    // (57:1) {:else}
    function create_else_block(ctx) {
    	let h10;
    	let t1;
    	let h11;
    	let t3;
    	let h12;

    	const block = {
    		c: function create() {
    			h10 = element("h1");
    			h10.textContent = "Jacoby Y presents";
    			t1 = space();
    			h11 = element("h1");
    			h11.textContent = "The sequel nobody asked for";
    			t3 = space();
    			h12 = element("h1");
    			h12.textContent = "Idle Orbs 2";
    			attr_dev(h10, "class", "intro-txt svelte-ade6d3");
    			add_location(h10, file, 57, 2, 1522);
    			attr_dev(h11, "class", "intro-txt svelte-ade6d3");
    			add_location(h11, file, 58, 2, 1588);
    			attr_dev(h12, "class", "intro-txt svelte-ade6d3");
    			add_location(h12, file, 59, 2, 1664);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h10, anchor);
    			/*h10_binding*/ ctx[6](h10);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h11, anchor);
    			/*h11_binding*/ ctx[7](h11);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, h12, anchor);
    			/*h12_binding*/ ctx[8](h12);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h10);
    			/*h10_binding*/ ctx[6](null);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h11);
    			/*h11_binding*/ ctx[7](null);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(h12);
    			/*h12_binding*/ ctx[8](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(57:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (54:1) {#if gaming}
    function create_if_block(ctx) {
    	let main_1;
    	let t;
    	let canvas;
    	let current;
    	main_1 = new Main({ $$inline: true });
    	canvas = new Canvas({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(main_1.$$.fragment);
    			t = space();
    			create_component(canvas.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(main_1, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(canvas, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(main_1.$$.fragment, local);
    			transition_in(canvas.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(main_1.$$.fragment, local);
    			transition_out(canvas.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(main_1, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(canvas, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(54:1) {#if gaming}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main_1;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*gaming*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			main_1 = element("main");
    			if_block.c();
    			attr_dev(main_1, "class", "svelte-ade6d3");
    			add_location(main_1, file, 52, 0, 1423);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main_1, anchor);
    			if_blocks[current_block_type_index].m(main_1, null);
    			/*main_1_binding*/ ctx[9](main_1);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(main_1, "click", /*click_handler*/ ctx[10], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(main_1, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main_1);
    			if_blocks[current_block_type_index].d();
    			/*main_1_binding*/ ctx[9](null);
    			mounted = false;
    			dispose();
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
    	let $cash;
    	validate_store(prestige, 'prestige');
    	component_subscribe($$self, prestige, $$value => $$invalidate(11, $prestige = $$value));
    	validate_store(cash, 'cash');
    	component_subscribe($$self, cash, $$value => $$invalidate(12, $cash = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let intro1, intro2, intro3, main;
    	let gaming = false;
    	const cinemachine = [];
    	cinemachine.push([() => $$invalidate(1, intro1.style.opacity = 1, intro1), 500]);
    	cinemachine.push([() => $$invalidate(1, intro1.style.opacity = 0, intro1), 2000]);
    	cinemachine.push([() => $$invalidate(2, intro2.style.opacity = 1, intro2), 1000]);
    	cinemachine.push([() => $$invalidate(2, intro2.style.opacity = 0, intro2), 3000]);
    	cinemachine.push([() => $$invalidate(3, intro3.style.opacity = 1, intro3), 1000]);
    	cinemachine.push([() => $$invalidate(3, intro3.style.opacity = 0, intro3), 3000]);
    	cinemachine.push([() => $$invalidate(0, gaming = true), 3000]);
    	let timeout = null;

    	const run_cine = i => {
    		if (i >= cinemachine.length) return;
    		$$invalidate(5, timeout = setTimeout(() => (cinemachine[i][0](), run_cine(i + 1)), cinemachine[i][1]));
    	};

    	onMount(() => {
    		window.onresize();

    		if ($cash > 0 || $prestige.times > 0) {
    			$$invalidate(0, gaming = true);
    			return;
    		}

    		console.log("Running intro!");
    		$$invalidate(3, intro3.style.transitionDuration = "3s", intro3);
    		run_cine(0);
    	});

    	window.onresize = () => {
    		let scale = 1;
    		const w = document.body.clientWidth;
    		const h = document.body.clientHeight;
    		if (w * 0.6 >= h) scale = h / 600; else scale = w / 1000;
    		$$invalidate(4, main.style.transform = `translate(-50%, -50%) scale(${scale - 0.02}, ${scale - 0.02})`, main);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function h10_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			intro1 = $$value;
    			$$invalidate(1, intro1);
    		});
    	}

    	function h11_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			intro2 = $$value;
    			$$invalidate(2, intro2);
    		});
    	}

    	function h12_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			intro3 = $$value;
    			$$invalidate(3, intro3);
    		});
    	}

    	function main_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			main = $$value;
    			$$invalidate(4, main);
    		});
    	}

    	const click_handler = () => $$invalidate(0, gaming = true);

    	$$self.$capture_state = () => ({
    		onMount,
    		Canvas,
    		Main,
    		cash,
    		prestige,
    		intro1,
    		intro2,
    		intro3,
    		main,
    		gaming,
    		cinemachine,
    		timeout,
    		run_cine,
    		$prestige,
    		$cash
    	});

    	$$self.$inject_state = $$props => {
    		if ('intro1' in $$props) $$invalidate(1, intro1 = $$props.intro1);
    		if ('intro2' in $$props) $$invalidate(2, intro2 = $$props.intro2);
    		if ('intro3' in $$props) $$invalidate(3, intro3 = $$props.intro3);
    		if ('main' in $$props) $$invalidate(4, main = $$props.main);
    		if ('gaming' in $$props) $$invalidate(0, gaming = $$props.gaming);
    		if ('timeout' in $$props) $$invalidate(5, timeout = $$props.timeout);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*gaming, timeout*/ 33) {
    			{
    				if (gaming && timeout != null) {
    					window.clearTimeout(timeout);
    				}
    			}
    		}
    	};

    	return [
    		gaming,
    		intro1,
    		intro2,
    		intro3,
    		main,
    		timeout,
    		h10_binding,
    		h11_binding,
    		h12_binding,
    		main_1_binding,
    		click_handler
    	];
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
