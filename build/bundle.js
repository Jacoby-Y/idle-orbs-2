
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

    const timer = writable(0);
    let ticks = 0; timer.subscribe( v => ticks = v );
    setInterval(() => {
    	if (ticks < 29) timer.update( v => v+1 );
    	else timer.set(0);
    }, 1000/30);

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

    const bounce_size = w(75);
    const bounce_area_cost = w(500);
    const collector_pos = w(250);
    // export const orb_count = w(1);
    const basic_orb = w({
    	amount: 1,
    	cost: 100,
    });
    const light_orb = w({
    	amount: 0,
    	cost: 100,
    });
    const homing_orb = w({
    	amount: 0,
    	cost: 100,
    });

    const more_orbs_cost = w(100);
    const auto_bounce = w({
    	cost: 500,
    	unlocked: false
    });

    const prestige = w({
    	cost: 1e4,
    	times: 0,
    });

    const orb_bonus = writable(1);

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
    const file$4 = "src/components/Canvas.svelte";

    function create_fragment$4(ctx) {
    	let main_1;
    	let canvas_1;
    	let t0;
    	let h30;
    	let t1;
    	let t2_value = sci(/*$cash*/ ctx[4]) + "";
    	let t2;
    	let t3;
    	let h31;
    	let t4;

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
    			t4 = text("Press \"Esc\" to toggle");
    			attr_dev(canvas_1, "class", "svelte-7mrntw");
    			add_location(canvas_1, file$4, 375, 1, 9795);
    			attr_dev(h30, "id", "cash");
    			attr_dev(h30, "class", "svelte-7mrntw");
    			add_location(h30, file$4, 376, 1, 9833);
    			attr_dev(h31, "id", "toggle-txt");
    			set_style(h31, "bottom", /*$bounce_size*/ ctx[3] + "px");
    			attr_dev(h31, "class", "svelte-7mrntw");
    			add_location(h31, file$4, 377, 1, 9872);
    			set_style(main_1, "opacity", /*toggled*/ ctx[2] ? "1" : "0");
    			set_style(main_1, "pointer-events", /*toggled*/ ctx[2] ? "all" : "none");
    			attr_dev(main_1, "class", "svelte-7mrntw");
    			add_location(main_1, file$4, 374, 0, 9686);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main_1, anchor);
    			append_dev(main_1, canvas_1);
    			/*canvas_1_binding*/ ctx[7](canvas_1);
    			append_dev(main_1, t0);
    			append_dev(main_1, h30);
    			append_dev(h30, t1);
    			append_dev(h30, t2);
    			append_dev(main_1, t3);
    			append_dev(main_1, h31);
    			append_dev(h31, t4);
    			/*main_1_binding*/ ctx[8](main_1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$cash*/ 16 && t2_value !== (t2_value = sci(/*$cash*/ ctx[4]) + "")) set_data_dev(t2, t2_value);

    			if (dirty[0] & /*$bounce_size*/ 8) {
    				set_style(h31, "bottom", /*$bounce_size*/ ctx[3] + "px");
    			}

    			if (dirty[0] & /*toggled*/ 4) {
    				set_style(main_1, "opacity", /*toggled*/ ctx[2] ? "1" : "0");
    			}

    			if (dirty[0] & /*toggled*/ 4) {
    				set_style(main_1, "pointer-events", /*toggled*/ ctx[2] ? "all" : "none");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main_1);
    			/*canvas_1_binding*/ ctx[7](null);
    			/*main_1_binding*/ ctx[8](null);
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
    	let $auto_bounce;
    	let $bounce_size;
    	let $cash;
    	let $orb_bonus;
    	let $collector_pos;
    	let $timer;
    	let $basic_orb;
    	let $homing_orb;
    	let $light_orb;
    	validate_store(auto_bounce, 'auto_bounce');
    	component_subscribe($$self, auto_bounce, $$value => $$invalidate(5, $auto_bounce = $$value));
    	validate_store(bounce_size, 'bounce_size');
    	component_subscribe($$self, bounce_size, $$value => $$invalidate(3, $bounce_size = $$value));
    	validate_store(cash, 'cash');
    	component_subscribe($$self, cash, $$value => $$invalidate(4, $cash = $$value));
    	validate_store(orb_bonus, 'orb_bonus');
    	component_subscribe($$self, orb_bonus, $$value => $$invalidate(16, $orb_bonus = $$value));
    	validate_store(collector_pos, 'collector_pos');
    	component_subscribe($$self, collector_pos, $$value => $$invalidate(17, $collector_pos = $$value));
    	validate_store(timer, 'timer');
    	component_subscribe($$self, timer, $$value => $$invalidate(18, $timer = $$value));
    	validate_store(basic_orb, 'basic_orb');
    	component_subscribe($$self, basic_orb, $$value => $$invalidate(6, $basic_orb = $$value));
    	validate_store(homing_orb, 'homing_orb');
    	component_subscribe($$self, homing_orb, $$value => $$invalidate(19, $homing_orb = $$value));
    	validate_store(light_orb, 'light_orb');
    	component_subscribe($$self, light_orb, $$value => $$invalidate(20, $light_orb = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Canvas', slots, []);

    	const set_orbs = () => {
    		orbs.free_all();

    		for (let i = 0; i < $basic_orb.amount; i++) {
    			orbs.new(Math.round(Math.random() * 1000), 580, 0, 0, "basic");
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
    			if (type == "basic") ctx.fillStyle = "#ffffff99"; else if (type == "light") ctx.fillStyle = "#33ffffaa"; else if (type == "homing") ctx.fillStyle = "#ff3333aa";
    			ctx.fillRect(orb.x, orb.y, 20, 20);
    		},
    		basic_physics(orb) {
    			orb.vy += 1;
    			orb.vx *= 0.99;
    			orb.vy *= 0.99;

    			if (orb.x + 20 >= canvas.width) {
    				this.col(orb, 0, -1);
    				orb.x = canvas.width - 20;
    			} else if (orb.x <= 0) {
    				this.col(orb, 0, 1);
    				orb.x = 0;
    			}

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
    			} else if (orb.y <= 0) {
    				this.col(orb, 1, 1);
    				orb.y = 0;
    			}
    		},
    		light_physics(orb) {
    			orb.vy += 0.8;
    			orb.vx *= 0.99;
    			orb.vy *= 0.99;

    			if (orb.x + 20 >= canvas.width) {
    				this.col(orb, 0, -1);
    				orb.x = canvas.width - 20;
    			} else if (orb.x <= 0) {
    				this.col(orb, 0, 1);
    				orb.x = 0;
    			}

    			if (orb.y + 20 >= canvas.height) {
    				this.col(orb, 1, -1);
    				orb.vy *= 0.85;
    				if (Math.abs(orb.vy) <= 7) orb.vy *= 0.5;
    				if (Math.abs(orb.vy) < 1) (orb.vy = 0, orb.vx = 0, orb.grounded = true);

    				// console.log(orb.vy);
    				orb.y = canvas.height - 20;
    			} else if (orb.y <= 0) {
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
    			const push_to = (pos1, pos2, mult) => {
    				const ang = Math.atan2(pos1.y - 10 - pos2.y, pos1.x - 10 - pos2.x);
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
    			}

    			// console.log(count);
    			const to_pos = {
    				x: Math.cos(6.242 / count * index / 2 + 6.161 * ($timer / 29)) * 50 + mouse.x, //+((6.242)/count*$timer)
    				y: Math.sin(6.242 / count * index / 2 + 6.161 * ($timer / 29)) * 50 + mouse.y, //+((6.242)/count*$timer)
    				
    			};

    			// if (distance(orb, to_pos) < 7) (orb.x = to_pos.x, orb.y = to_pos.y);\
    			const dist_to = distance(orb, to_pos);

    			push_to(to_pos, orb, 0.5 + dist_to / 600 + index / 10);

    			// for (let i = 0; i < this.list.length; i++) {
    			// 	const orb2 = this.list[i];
    			// 	if (orb == orb2) continue;
    			// 	// const dist = distance(orb, orb2);
    			// 	// if (dist < 50) push_to(orb2, orb, 5);
    			// }
    			if (orb.x + 20 >= canvas.width) {
    				this.col(orb, 0, -1);
    				orb.x = canvas.width - 20;
    			} else if (orb.x <= 0) {
    				this.col(orb, 0, 1);
    				orb.x = 0;
    			}

    			if (orb.y + 20 >= canvas.height) {
    				this.col(orb, 1, -1);
    				orb.y = canvas.height - 20;
    			} else if (orb.y <= 0) {
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
    			if (orb.y < $collector_pos && orb.y + orb.vy > $collector_pos) this.collect(i); else if (orb.y > $collector_pos && orb.y + orb.vy < $collector_pos) this.collect(i);
    			if (orb.type == "basic") this.basic_physics(orb);
    			if (orb.type == "light") this.light_physics(orb);
    			if (orb.type == "homing") this.homing_physics(orb);
    		},
    		collect(i) {
    			set_store_value(cash, $cash += $orb_bonus, $cash);
    		},
    		update() {
    			for (let i = 0; i < this.list.length; i++) {
    				this.draw(i);
    				this.physics(i);
    			}
    		},
    		new(x, y, vx, vy, type) {
    			// this.pos.push([x, y]);
    			// this.vect.push([vx, vy]);
    			// this.grounded.push(false);
    			// console.log(`New: ${JSON.stringify({x, y, vx, vy, type})}`);
    			if (type == "light") light_orb.update(v => (v.amount++, v)); // console.log(this.list.reverse()[0]);

    			if (type == "homing") homing_orb.update(v => (v.amount++, v));
    			this.list.push({ x, y, vx, vy, type, grounded: false });
    		}, // console.log(this.list.reverse()[0]);
    		bounce(pos) {
    			// for (let i = 0; i < this.pos.length; i++) {
    			// 	if (this.pos[i][1] < 600-$bounce_size-21) continue;
    			// 	if (pos != null) this.vect[i][0] += (pos[0] - this.pos[i][0])/100;
    			// 	this.vect[i][1] -= 30 - Math.random()*3;
    			// 	this.grounded[i] = false;
    			// }
    			for (let i = 0; i < this.list.length; i++) {
    				const orb = this.list[i];
    				if (orb.y < 600 - $bounce_size - 21) continue;
    				if (pos != null) orb.vx += (pos[0] - orb.x) / 100;
    				orb.vy -= 30 - Math.random() * 3;
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
    	const main_loop = v => {
    		if (pause) return;

    		if (!visible && !toggled) {
    			orbs.update();
    			manager.update(false);
    			return;
    		}

    		ctx.fillStyle = "#333636";
    		ctx.fillRect(0, 0, w, h);
    		ctx.fillStyle = "#33ffcc33";
    		ctx.fillRect(0, 600 - $bounce_size, 1000, 600 - $bounce_size);
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

    	let toggled = true;

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
    		if (k == " ") pause = !pause; else if (k == "o") console.log(orbs); else if (k == "Escape") $$invalidate(2, toggled = !toggled); else if (k == "c") set_store_value(cash, $cash += 1000, $cash); else if (k == "b") set_store_value(bounce_size, $bounce_size += 10, $bounce_size); else if (k == "B") set_store_value(bounce_size, $bounce_size -= 10, $bounce_size); else if (k == "r") set_orbs(); else if (k == "1") orbs.new(rand_width(), 580, 0, 0, "basic"); else if (k == "2") orbs.new(rand_width(), rand_height(), 0, 0, "light"); else if (k == "3") orbs.new(rand_width(), rand_height(), 0, 0, "homing"); // Broken right now
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
    		if (!$auto_bounce.unlocked) return;
    		auto_bounce_perc = Math.ceil(v / 29 * 100) / 100;
    		if (v == 29) orbs.bounce(null);
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

    	function main_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			main = $$value;
    			($$invalidate(0, main), $$invalidate(2, toggled));
    		});
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		timer,
    		cash,
    		bounce_size,
    		collector_pos,
    		auto_bounce,
    		orb_bonus,
    		basic_orb,
    		light_orb,
    		homing_orb,
    		manager,
    		small_explosion,
    		sci,
    		set_orbs,
    		main,
    		canvas,
    		ctx,
    		pause,
    		w,
    		h,
    		distance,
    		rand_width,
    		rand_height,
    		rand_pos,
    		orbs,
    		main_loop,
    		mouse,
    		toggled,
    		mouse_move,
    		mouse_enter,
    		mouse_leave,
    		mouse_down,
    		key_up,
    		visible,
    		draw_auto_bounce_bar,
    		auto_bounce_perc,
    		auto_bounce_loop,
    		$auto_bounce,
    		$bounce_size,
    		$cash,
    		$orb_bonus,
    		$collector_pos,
    		$timer,
    		$basic_orb,
    		$homing_orb,
    		$light_orb
    	});

    	$$self.$inject_state = $$props => {
    		if ('main' in $$props) $$invalidate(0, main = $$props.main);
    		if ('canvas' in $$props) $$invalidate(1, canvas = $$props.canvas);
    		if ('ctx' in $$props) ctx = $$props.ctx;
    		if ('pause' in $$props) pause = $$props.pause;
    		if ('w' in $$props) w = $$props.w;
    		if ('h' in $$props) h = $$props.h;
    		if ('toggled' in $$props) $$invalidate(2, toggled = $$props.toggled);
    		if ('visible' in $$props) visible = $$props.visible;
    		if ('auto_bounce_perc' in $$props) auto_bounce_perc = $$props.auto_bounce_perc;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*$basic_orb*/ 64) {
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
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*main, toggled*/ 5) {
    			{
    				if (main != undefined) {
    					$$invalidate(0, main.ontransitionend = () => visible = toggled, main);
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*$auto_bounce*/ 32) {
    			if (!$auto_bounce.unlocked) auto_bounce_perc = 0;
    		}
    	};

    	return [
    		main,
    		canvas,
    		toggled,
    		$bounce_size,
    		$cash,
    		$auto_bounce,
    		$basic_orb,
    		canvas_1_binding,
    		main_1_binding
    	];
    }

    class Canvas extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Canvas",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/Shop.svelte generated by Svelte v3.46.4 */
    const file$3 = "src/components/Shop.svelte";

    function create_fragment$3(ctx) {
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
    	let t6_value = sci(/*$basic_orb*/ ctx[3].cost) + "";
    	let t6;
    	let t7;
    	let button1;
    	let t8;
    	let b1;

    	let t9_value = (/*$auto_bounce*/ ctx[2].unlocked
    	? "Unlocked!"
    	: `$${sci(/*$auto_bounce*/ ctx[2].cost)}`) + "";

    	let t9;
    	let t10;
    	let button2;
    	let t11;
    	let b2;
    	let t12;
    	let t13_value = sci(/*$bounce_area_cost*/ ctx[6]) + "";
    	let t13;
    	let t14;
    	let div;
    	let t15;
    	let h31;
    	let t16;
    	let t17_value = sci(/*$prestige*/ ctx[5].times * 50) + "";
    	let t17;
    	let t18;
    	let t19_value = (/*prest_hover*/ ctx[1] ? "(+50%)" : "") + "";
    	let t19;
    	let t20;
    	let button3;
    	let t21;
    	let b3;
    	let t22;
    	let t23_value = sci(/*$prestige*/ ctx[5].cost) + "";
    	let t23;
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
    			t4 = text("Buy a Basic Orb ");
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
    			div = element("div");
    			t15 = space();
    			h31 = element("h3");
    			t16 = text("Orb Prestige Bonus: +");
    			t17 = text(t17_value);
    			t18 = text("% ");
    			t19 = text(t19_value);
    			t20 = space();
    			button3 = element("button");
    			t21 = text("Prestige ");
    			b3 = element("b");
    			t22 = text("$");
    			t23 = text(t23_value);
    			attr_dev(h30, "id", "cash");
    			attr_dev(h30, "class", "svelte-t1qr23");
    			add_location(h30, file$3, 57, 1, 1463);
    			attr_dev(hr, "id", "top-hr");
    			attr_dev(hr, "class", "svelte-t1qr23");
    			add_location(hr, file$3, 58, 1, 1502);
    			attr_dev(b0, "class", "svelte-t1qr23");
    			add_location(b0, file$3, 59, 46, 1565);
    			attr_dev(button0, "class", "svelte-t1qr23");
    			add_location(button0, file$3, 59, 1, 1520);
    			attr_dev(b1, "class", "svelte-t1qr23");
    			add_location(b1, file$3, 60, 55, 1660);
    			attr_dev(button1, "class", "svelte-t1qr23");
    			add_location(button1, file$3, 60, 1, 1606);
    			attr_dev(b2, "class", "svelte-t1qr23");
    			add_location(b2, file$3, 61, 62, 1807);
    			attr_dev(button2, "class", "svelte-t1qr23");
    			add_location(button2, file$3, 61, 1, 1746);
    			add_location(div, file$3, 62, 1, 1850);
    			attr_dev(h31, "id", "orb-info");
    			attr_dev(h31, "class", "svelte-t1qr23");
    			add_location(h31, file$3, 63, 1, 1863);
    			attr_dev(b3, "class", "svelte-t1qr23");
    			add_location(b3, file$3, 64, 63, 2027);
    			attr_dev(button3, "class", "svelte-t1qr23");
    			add_location(button3, file$3, 64, 1, 1965);
    			attr_dev(main, "id", "main-shop");
    			attr_dev(main, "class", "svelte-t1qr23");
    			add_location(main, file$3, 56, 0, 1440);
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
    			append_dev(main, div);
    			append_dev(main, t15);
    			append_dev(main, h31);
    			append_dev(h31, t16);
    			append_dev(h31, t17);
    			append_dev(h31, t18);
    			append_dev(h31, t19);
    			append_dev(main, t20);
    			append_dev(main, button3);
    			append_dev(button3, t21);
    			append_dev(button3, b3);
    			append_dev(b3, t22);
    			append_dev(b3, t23);
    			/*button3_binding*/ ctx[11](button3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*buy_basic*/ ctx[7], false, false, false),
    					listen_dev(button1, "click", /*buy_auto_bounce*/ ctx[8], false, false, false),
    					listen_dev(button2, "click", /*increase_bounce_area*/ ctx[9], false, false, false),
    					listen_dev(button3, "click", /*do_prestige*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$cash*/ 16 && t1_value !== (t1_value = sci(/*$cash*/ ctx[4]) + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*$basic_orb*/ 8 && t6_value !== (t6_value = sci(/*$basic_orb*/ ctx[3].cost) + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*$auto_bounce*/ 4 && t9_value !== (t9_value = (/*$auto_bounce*/ ctx[2].unlocked
    			? "Unlocked!"
    			: `$${sci(/*$auto_bounce*/ ctx[2].cost)}`) + "")) set_data_dev(t9, t9_value);

    			if (dirty & /*$bounce_area_cost*/ 64 && t13_value !== (t13_value = sci(/*$bounce_area_cost*/ ctx[6]) + "")) set_data_dev(t13, t13_value);
    			if (dirty & /*$prestige*/ 32 && t17_value !== (t17_value = sci(/*$prestige*/ ctx[5].times * 50) + "")) set_data_dev(t17, t17_value);
    			if (dirty & /*prest_hover*/ 2 && t19_value !== (t19_value = (/*prest_hover*/ ctx[1] ? "(+50%)" : "") + "")) set_data_dev(t19, t19_value);
    			if (dirty & /*$prestige*/ 32 && t23_value !== (t23_value = sci(/*$prestige*/ ctx[5].cost) + "")) set_data_dev(t23, t23_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			/*button3_binding*/ ctx[11](null);
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
    	let $auto_bounce;
    	let $basic_orb;
    	let $cash;
    	let $prestige;
    	let $bounce_size;
    	let $bounce_area_cost;
    	validate_store(auto_bounce, 'auto_bounce');
    	component_subscribe($$self, auto_bounce, $$value => $$invalidate(2, $auto_bounce = $$value));
    	validate_store(basic_orb, 'basic_orb');
    	component_subscribe($$self, basic_orb, $$value => $$invalidate(3, $basic_orb = $$value));
    	validate_store(cash, 'cash');
    	component_subscribe($$self, cash, $$value => $$invalidate(4, $cash = $$value));
    	validate_store(prestige, 'prestige');
    	component_subscribe($$self, prestige, $$value => $$invalidate(5, $prestige = $$value));
    	validate_store(bounce_size, 'bounce_size');
    	component_subscribe($$self, bounce_size, $$value => $$invalidate(12, $bounce_size = $$value));
    	validate_store(bounce_area_cost, 'bounce_area_cost');
    	component_subscribe($$self, bounce_area_cost, $$value => $$invalidate(6, $bounce_area_cost = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Shop', slots, []);

    	const buy_basic = () => {
    		if ($cash < $basic_orb.cost) return;
    		set_store_value(cash, $cash -= $basic_orb.cost, $cash);
    		set_store_value(basic_orb, $basic_orb.cost = Math.round($basic_orb.cost * 1.5), $basic_orb);
    		set_store_value(basic_orb, $basic_orb.amount++, $basic_orb);
    		basic_orb.set($basic_orb);
    	};

    	//#endregion
    	//#region | Auto Bounce
    	const buy_auto_bounce = () => {
    		if ($cash < $auto_bounce.cost) return;
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
    	};

    	//#endregion
    	//#region | Prestige
    	/** @type {HTMLElement} */
    	let prest_btn;

    	let prest_hover = false;

    	const do_prestige = (bypass = false) => {
    		if ($cash < $prestige.cost && bypass !== true) return;
    		set_store_value(cash, $cash = 0, $cash);
    		set_store_value(basic_orb, $basic_orb.amount = 1, $basic_orb);
    		set_store_value(auto_bounce, $auto_bounce.unlocked = false, $auto_bounce);
    		prestige.update(v => (v.times++, v.cost = Math.round(v.cost * 1.25), v));
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Shop> was created with unknown prop '${key}'`);
    	});

    	function button3_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			prest_btn = $$value;
    			$$invalidate(0, prest_btn);
    		});
    	}

    	$$self.$capture_state = () => ({
    		cash,
    		more_orbs_cost,
    		auto_bounce,
    		basic_orb,
    		bounce_size,
    		bounce_area_cost,
    		orb_bonus,
    		prestige,
    		timer,
    		sci,
    		buy_basic,
    		buy_auto_bounce,
    		increase_bounce_area,
    		prest_btn,
    		prest_hover,
    		do_prestige,
    		$auto_bounce,
    		$basic_orb,
    		$cash,
    		$prestige,
    		$bounce_size,
    		$bounce_area_cost
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
    		$auto_bounce,
    		$basic_orb,
    		$cash,
    		$prestige,
    		$bounce_area_cost,
    		buy_basic,
    		buy_auto_bounce,
    		increase_bounce_area,
    		do_prestige,
    		button3_binding
    	];
    }

    class Shop extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Shop",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/Lab.svelte generated by Svelte v3.46.4 */

    const file$2 = "src/components/Lab.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let img;
    	let img_src_value;
    	let t0;
    	let h3;
    	let em;
    	let t2;

    	const block = {
    		c: function create() {
    			main = element("main");
    			img = element("img");
    			t0 = space();
    			h3 = element("h3");
    			em = element("em");
    			em.textContent = "Orb Lab";
    			t2 = text(" Coming Soon!");
    			attr_dev(img, "id", "img");
    			if (!src_url_equal(img.src, img_src_value = "./assets/robo_arm.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Robot Arm");
    			attr_dev(img, "class", "svelte-rc0bfe");
    			add_location(img, file$2, 6, 1, 61);
    			add_location(em, file$2, 8, 15, 206);
    			attr_dev(h3, "id", "info");
    			attr_dev(h3, "class", "svelte-rc0bfe");
    			add_location(h3, file$2, 8, 1, 192);
    			attr_dev(main, "class", "svelte-rc0bfe");
    			add_location(main, file$2, 4, 0, 22);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, img);
    			append_dev(main, t0);
    			append_dev(main, h3);
    			append_dev(h3, em);
    			append_dev(h3, t2);
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
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Lab', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Lab> was created with unknown prop '${key}'`);
    	});

    	return [];
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
    	let t;
    	let lab;
    	let current;
    	shop = new Shop({ $$inline: true });
    	lab = new Lab({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(shop.$$.fragment);
    			t = space();
    			create_component(lab.$$.fragment);
    			attr_dev(main, "class", "svelte-i4yhlq");
    			add_location(main, file$1, 5, 0, 88);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(shop, main, null);
    			append_dev(main, t);
    			mount_component(lab, main, null);
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
    			add_location(main1, file, 10, 0, 338);
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
    		more_orbs_cost,
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
