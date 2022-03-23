
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
    const orb_count = w(1);

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
    const file$2 = "src/components/Canvas.svelte";

    function create_fragment$2(ctx) {
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
    			attr_dev(canvas_1, "class", "svelte-1om0tpl");
    			add_location(canvas_1, file$2, 201, 1, 4832);
    			attr_dev(h30, "id", "cash");
    			attr_dev(h30, "class", "svelte-1om0tpl");
    			add_location(h30, file$2, 202, 1, 4870);
    			attr_dev(h31, "id", "toggle-txt");
    			set_style(h31, "bottom", /*$bounce_size*/ ctx[3] + "px");
    			attr_dev(h31, "class", "svelte-1om0tpl");
    			add_location(h31, file$2, 203, 1, 4909);
    			set_style(main_1, "opacity", /*toggled*/ ctx[2] ? "1" : "0");
    			set_style(main_1, "pointer-events", /*toggled*/ ctx[2] ? "all" : "none");
    			attr_dev(main_1, "class", "svelte-1om0tpl");
    			add_location(main_1, file$2, 200, 0, 4723);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main_1, anchor);
    			append_dev(main_1, canvas_1);
    			/*canvas_1_binding*/ ctx[6](canvas_1);
    			append_dev(main_1, t0);
    			append_dev(main_1, h30);
    			append_dev(h30, t1);
    			append_dev(h30, t2);
    			append_dev(main_1, t3);
    			append_dev(main_1, h31);
    			append_dev(h31, t4);
    			/*main_1_binding*/ ctx[7](main_1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$cash*/ 16 && t2_value !== (t2_value = sci(/*$cash*/ ctx[4]) + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*$bounce_size*/ 8) {
    				set_style(h31, "bottom", /*$bounce_size*/ ctx[3] + "px");
    			}

    			if (dirty & /*toggled*/ 4) {
    				set_style(main_1, "opacity", /*toggled*/ ctx[2] ? "1" : "0");
    			}

    			if (dirty & /*toggled*/ 4) {
    				set_style(main_1, "pointer-events", /*toggled*/ ctx[2] ? "all" : "none");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main_1);
    			/*canvas_1_binding*/ ctx[6](null);
    			/*main_1_binding*/ ctx[7](null);
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
    	let $auto_bounce;
    	let $bounce_size;
    	let $cash;
    	let $orb_bonus;
    	let $collector_pos;
    	let $orb_count;
    	validate_store(auto_bounce, 'auto_bounce');
    	component_subscribe($$self, auto_bounce, $$value => $$invalidate(5, $auto_bounce = $$value));
    	validate_store(bounce_size, 'bounce_size');
    	component_subscribe($$self, bounce_size, $$value => $$invalidate(3, $bounce_size = $$value));
    	validate_store(cash, 'cash');
    	component_subscribe($$self, cash, $$value => $$invalidate(4, $cash = $$value));
    	validate_store(orb_bonus, 'orb_bonus');
    	component_subscribe($$self, orb_bonus, $$value => $$invalidate(14, $orb_bonus = $$value));
    	validate_store(collector_pos, 'collector_pos');
    	component_subscribe($$self, collector_pos, $$value => $$invalidate(15, $collector_pos = $$value));
    	validate_store(orb_count, 'orb_count');
    	component_subscribe($$self, orb_count, $$value => $$invalidate(16, $orb_count = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Canvas', slots, []);

    	const set_orbs = () => {
    		console.log(`Orb count: ${$orb_count}`);
    		orbs.free_all();

    		for (let i = 0; i < $orb_count; i++) {
    			orbs.new([1000 / $orb_count * i + 1000 / $orb_count / 2, 580], [0, 0]);
    		}
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
    	const orbs = {
    		pos: [],
    		vect: [],
    		grounded: [],
    		col(i, xy, mult) {
    			this.vect[i][xy] = Math.abs(this.vect[i][xy]) * mult;
    		},
    		draw(i) {
    			ctx.fillStyle = "aqua";
    			ctx.fillRect(this.pos[i][0], this.pos[i][1], 20, 20);
    		},
    		physics(i) {
    			if (this.grounded[i]) return;
    			const pos = this.pos[i];
    			const vect = this.vect[i];
    			pos[0] += vect[0];
    			pos[1] += vect[1];
    			vect[1] += 1;
    			vect[0] *= 0.99;
    			vect[1] *= 0.99;
    			if (pos[1] < $collector_pos && pos[1] + vect[1] > $collector_pos) this.collect(i); else if (pos[1] > $collector_pos && pos[1] + vect[1] < $collector_pos) this.collect(i);

    			if (pos[0] + 20 >= canvas.width) {
    				this.col(i, 0, -1);
    				pos[0] = canvas.width - 20;
    			} else if (pos[0] <= 0) {
    				this.col(i, 0, 1);
    				pos[0] = 0;
    			}

    			if (pos[1] + 20 >= canvas.height) {
    				this.col(i, 1, -1);
    				vect[1] *= 0.85;
    				if (Math.abs(vect[1]) < 10) vect[1] *= 0.85;
    				if (Math.abs(vect[1]) < 6) vect[1] *= 0.85;
    				if (Math.abs(vect[1]) < 3) (vect[0] = 0, vect[1] = 0, this.grounded[i] = true);

    				// console.log(vect[1]);
    				pos[1] = canvas.height - 20;
    			} else if (pos[1] <= 0) {
    				this.col(i, 1, 1);
    				pos[1] = 0;
    			}
    		},
    		collect(i) {
    			set_store_value(cash, $cash += $orb_bonus, $cash);
    		},
    		update() {
    			for (let i = 0; i < this.pos.length; i++) {
    				this.draw(i);
    				this.physics(i);
    			}
    		},
    		new([x, y], [vx, vy]) {
    			this.pos.push([x, y]);
    			this.vect.push([vx, vy]);
    			this.grounded.push(false);
    		},
    		bounce(pos) {
    			for (let i = 0; i < this.pos.length; i++) {
    				if (this.pos[i][1] < 600 - $bounce_size) continue;
    				if (pos != null) this.vect[i][0] += (pos[0] - this.pos[i][0]) / 100;
    				this.vect[i][1] -= 30 - Math.random() * 3;
    				this.grounded[i] = false;
    			}
    		},
    		free(i) {
    			this.pos.splice(i, 1);
    			this.vect.splice(i, 1);
    			this.grounded.splice(i, 1);
    		},
    		free_all() {
    			this.pos = [];
    			this.vect = [];
    			this.grounded = [];
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
    		orb_count.subscribe(set_orbs);
    		timer.subscribe(main_loop);
    		timer.subscribe(auto_bounce_loop);
    		key_up({ key: "Escape" });
    	});

    	//#endregion
    	//#region | Events
    	let toggled = true;

    	/** @param {MouseEvent} e*/
    	const mouse_down = e => {
    		// orbs.new([10, 10], [10, Math.random()*15]);
    		const [x, y] = [e.layerX, e.layerY];

    		orbs.bounce([x, y]);
    		small_explosion(ctx, [x, y]);
    	};

    	const key_up = e => {
    		const k = e.key;
    		if (k == " ") pause = !pause; else if (k == "o") console.log(orbs); else if (k == "Escape") $$invalidate(2, toggled = !toggled); else if (k == "c") set_store_value(cash, $cash += 1000, $cash); else if (k == "d") set_store_value(cash, $cash += 0.3, $cash); else if (k == "b") set_store_value(bounce_size, $bounce_size += 10, $bounce_size); else if (k == "r") orb_count.set(Math.ceil(Math.random() * 10));
    	}; // console.log(e);

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
    		orb_count,
    		auto_bounce,
    		orb_bonus,
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
    		orbs,
    		main_loop,
    		toggled,
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
    		$orb_count
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
    		if ($$self.$$.dirty & /*canvas*/ 2) {
    			{
    				if (canvas != undefined) {
    					$$invalidate(1, canvas.onmousedown = mouse_down, canvas);
    					document.body.onkeyup = key_up;
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*main, toggled*/ 5) {
    			{
    				if (main != undefined) {
    					$$invalidate(0, main.ontransitionend = () => visible = toggled, main);
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*$auto_bounce*/ 32) {
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
    		canvas_1_binding,
    		main_1_binding
    	];
    }

    class Canvas extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Canvas",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/Shop.svelte generated by Svelte v3.46.4 */
    const file$1 = "src/components/Shop.svelte";

    function create_fragment$1(ctx) {
    	let main;
    	let div1;
    	let h30;
    	let t0;
    	let t1_value = sci(/*$cash*/ ctx[3]) + "";
    	let t1;
    	let t2;
    	let hr;
    	let t3;
    	let button0;
    	let t4;
    	let b0;
    	let t5;
    	let t6_value = sci(/*$more_orbs_cost*/ ctx[6]) + "";
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
    	let t13_value = sci(/*$bounce_area_cost*/ ctx[5]) + "";
    	let t13;
    	let t14;
    	let div0;
    	let t15;
    	let h31;
    	let t16;
    	let t17_value = sci(/*$prestige*/ ctx[4].times * 50) + "";
    	let t17;
    	let t18;
    	let t19_value = (/*prest_hover*/ ctx[1] ? "(+50%)" : "") + "";
    	let t19;
    	let t20;
    	let button3;
    	let t21;
    	let b3;
    	let t22;
    	let t23_value = sci(/*$prestige*/ ctx[4].cost) + "";
    	let t23;
    	let t24;
    	let div2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div1 = element("div");
    			h30 = element("h3");
    			t0 = text("Cash: ");
    			t1 = text(t1_value);
    			t2 = space();
    			hr = element("hr");
    			t3 = space();
    			button0 = element("button");
    			t4 = text("More Orbs ");
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
    			div0 = element("div");
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
    			t24 = space();
    			div2 = element("div");
    			attr_dev(h30, "id", "cash");
    			attr_dev(h30, "class", "svelte-1gqyrzs");
    			add_location(h30, file$1, 57, 2, 1430);
    			attr_dev(hr, "id", "top-hr");
    			attr_dev(hr, "class", "svelte-1gqyrzs");
    			add_location(hr, file$1, 58, 2, 1470);
    			attr_dev(b0, "class", "svelte-1gqyrzs");
    			add_location(b0, file$1, 59, 45, 1532);
    			attr_dev(button0, "class", "svelte-1gqyrzs");
    			add_location(button0, file$1, 59, 2, 1489);
    			attr_dev(b1, "class", "svelte-1gqyrzs");
    			add_location(b1, file$1, 60, 56, 1628);
    			attr_dev(button1, "class", "svelte-1gqyrzs");
    			add_location(button1, file$1, 60, 2, 1574);
    			attr_dev(b2, "class", "svelte-1gqyrzs");
    			add_location(b2, file$1, 61, 63, 1776);
    			attr_dev(button2, "class", "svelte-1gqyrzs");
    			add_location(button2, file$1, 61, 2, 1715);
    			add_location(div0, file$1, 62, 2, 1820);
    			attr_dev(h31, "id", "orb-info");
    			attr_dev(h31, "class", "svelte-1gqyrzs");
    			add_location(h31, file$1, 63, 2, 1834);
    			attr_dev(b3, "class", "svelte-1gqyrzs");
    			add_location(b3, file$1, 64, 64, 1999);
    			attr_dev(button3, "class", "svelte-1gqyrzs");
    			add_location(button3, file$1, 64, 2, 1937);
    			attr_dev(div1, "id", "main-shop");
    			attr_dev(div1, "class", "svelte-1gqyrzs");
    			add_location(div1, file$1, 56, 1, 1407);
    			add_location(div2, file$1, 66, 1, 2047);
    			attr_dev(main, "class", "svelte-1gqyrzs");
    			add_location(main, file$1, 55, 0, 1399);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div1);
    			append_dev(div1, h30);
    			append_dev(h30, t0);
    			append_dev(h30, t1);
    			append_dev(div1, t2);
    			append_dev(div1, hr);
    			append_dev(div1, t3);
    			append_dev(div1, button0);
    			append_dev(button0, t4);
    			append_dev(button0, b0);
    			append_dev(b0, t5);
    			append_dev(b0, t6);
    			append_dev(div1, t7);
    			append_dev(div1, button1);
    			append_dev(button1, t8);
    			append_dev(button1, b1);
    			append_dev(b1, t9);
    			append_dev(div1, t10);
    			append_dev(div1, button2);
    			append_dev(button2, t11);
    			append_dev(button2, b2);
    			append_dev(b2, t12);
    			append_dev(b2, t13);
    			append_dev(div1, t14);
    			append_dev(div1, div0);
    			append_dev(div1, t15);
    			append_dev(div1, h31);
    			append_dev(h31, t16);
    			append_dev(h31, t17);
    			append_dev(h31, t18);
    			append_dev(h31, t19);
    			append_dev(div1, t20);
    			append_dev(div1, button3);
    			append_dev(button3, t21);
    			append_dev(button3, b3);
    			append_dev(b3, t22);
    			append_dev(b3, t23);
    			/*button3_binding*/ ctx[11](button3);
    			append_dev(main, t24);
    			append_dev(main, div2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*buy_more_orbs*/ ctx[7], false, false, false),
    					listen_dev(button1, "click", /*buy_auto_bounce*/ ctx[8], false, false, false),
    					listen_dev(button2, "click", /*increase_bounce_area*/ ctx[9], false, false, false),
    					listen_dev(button3, "click", /*do_prestige*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$cash*/ 8 && t1_value !== (t1_value = sci(/*$cash*/ ctx[3]) + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*$more_orbs_cost*/ 64 && t6_value !== (t6_value = sci(/*$more_orbs_cost*/ ctx[6]) + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*$auto_bounce*/ 4 && t9_value !== (t9_value = (/*$auto_bounce*/ ctx[2].unlocked
    			? "Unlocked!"
    			: `$${sci(/*$auto_bounce*/ ctx[2].cost)}`) + "")) set_data_dev(t9, t9_value);

    			if (dirty & /*$bounce_area_cost*/ 32 && t13_value !== (t13_value = sci(/*$bounce_area_cost*/ ctx[5]) + "")) set_data_dev(t13, t13_value);
    			if (dirty & /*$prestige*/ 16 && t17_value !== (t17_value = sci(/*$prestige*/ ctx[4].times * 50) + "")) set_data_dev(t17, t17_value);
    			if (dirty & /*prest_hover*/ 2 && t19_value !== (t19_value = (/*prest_hover*/ ctx[1] ? "(+50%)" : "") + "")) set_data_dev(t19, t19_value);
    			if (dirty & /*$prestige*/ 16 && t23_value !== (t23_value = sci(/*$prestige*/ ctx[4].cost) + "")) set_data_dev(t23, t23_value);
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
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $auto_bounce;
    	let $orb_count;
    	let $cash;
    	let $prestige;
    	let $bounce_size;
    	let $bounce_area_cost;
    	let $more_orbs_cost;
    	validate_store(auto_bounce, 'auto_bounce');
    	component_subscribe($$self, auto_bounce, $$value => $$invalidate(2, $auto_bounce = $$value));
    	validate_store(orb_count, 'orb_count');
    	component_subscribe($$self, orb_count, $$value => $$invalidate(12, $orb_count = $$value));
    	validate_store(cash, 'cash');
    	component_subscribe($$self, cash, $$value => $$invalidate(3, $cash = $$value));
    	validate_store(prestige, 'prestige');
    	component_subscribe($$self, prestige, $$value => $$invalidate(4, $prestige = $$value));
    	validate_store(bounce_size, 'bounce_size');
    	component_subscribe($$self, bounce_size, $$value => $$invalidate(13, $bounce_size = $$value));
    	validate_store(bounce_area_cost, 'bounce_area_cost');
    	component_subscribe($$self, bounce_area_cost, $$value => $$invalidate(5, $bounce_area_cost = $$value));
    	validate_store(more_orbs_cost, 'more_orbs_cost');
    	component_subscribe($$self, more_orbs_cost, $$value => $$invalidate(6, $more_orbs_cost = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Shop', slots, []);

    	const buy_more_orbs = () => {
    		if ($cash < $more_orbs_cost) return;
    		set_store_value(cash, $cash -= $more_orbs_cost, $cash);
    		set_store_value(more_orbs_cost, $more_orbs_cost = Math.round($more_orbs_cost * 1.5), $more_orbs_cost);
    		set_store_value(orb_count, $orb_count++, $orb_count);
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
    		set_store_value(orb_count, $orb_count = 1, $orb_count);
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
    		orb_count,
    		bounce_size,
    		bounce_area_cost,
    		orb_bonus,
    		prestige,
    		timer,
    		sci,
    		buy_more_orbs,
    		buy_auto_bounce,
    		increase_bounce_area,
    		prest_btn,
    		prest_hover,
    		do_prestige,
    		$auto_bounce,
    		$orb_count,
    		$cash,
    		$prestige,
    		$bounce_size,
    		$bounce_area_cost,
    		$more_orbs_cost
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
    		$cash,
    		$prestige,
    		$bounce_area_cost,
    		$more_orbs_cost,
    		buy_more_orbs,
    		buy_auto_bounce,
    		increase_bounce_area,
    		do_prestige,
    		button3_binding
    	];
    }

    class Shop extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Shop",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.46.4 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let shop;
    	let t;
    	let canvas;
    	let current;
    	shop = new Shop({ $$inline: true });
    	canvas = new Canvas({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(shop.$$.fragment);
    			t = space();
    			create_component(canvas.$$.fragment);
    			attr_dev(main, "class", "svelte-yl16dy");
    			add_location(main, file, 10, 0, 349);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(shop, main, null);
    			append_dev(main, t);
    			mount_component(canvas, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shop.$$.fragment, local);
    			transition_in(canvas.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shop.$$.fragment, local);
    			transition_out(canvas.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(shop);
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
    		Shop,
    		timer,
    		cash,
    		bounce_size,
    		bounce_area_cost,
    		collector_pos,
    		orb_count,
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
