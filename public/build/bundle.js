
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function is_empty$1(obj) {
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
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
        return style.sheet;
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
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
    function empty() {
        return text('');
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
        if (value == null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash$1(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash$1(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            managed_styles.forEach(info => {
                const { ownerNode } = info.stylesheet;
                // there is no ownerNode if it runs on jsdom.
                if (ownerNode)
                    detach(ownerNode);
            });
            managed_styles.clear();
        });
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
    /**
     * Schedules a callback to run immediately before the component is updated after any state change.
     *
     * The first time the callback runs will be before the initial `onMount`
     *
     * https://svelte.dev/docs#run-time-svelte-beforeupdate
     */
    function beforeUpdate(fn) {
        get_current_component().$$.before_update.push(fn);
    }
    /**
     * Schedules a callback to run immediately after the component has been updated.
     *
     * The first time the callback runs will be after the initial `onMount`
     */
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
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
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
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
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
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
        else if (callback) {
            callback();
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        const options = { direction: 'in' };
        let config = fn(node, params, options);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config(options);
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        const options = { direction: 'out' };
        let config = fn(node, params, options);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config(options);
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        const updates = [];
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                // defer updates until all the DOM shuffling is done
                updates.push(() => block.p(child_ctx, dirty));
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        run_all(updates);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

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
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
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
            flush_render_callbacks($$.after_update);
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
            ctx: [],
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
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty$1($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
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
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
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
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    function construct_svelte_component_dev(component, props) {
        const error_message = 'this={...} of <svelte:component> should specify a Svelte component.';
        try {
            const instance = new component(props);
            if (!instance.$$ || !instance.$set || !instance.$on || !instance.$destroy) {
                throw new Error(error_message);
            }
            return instance;
        }
        catch (err) {
            const { message } = err;
            if (typeof message === 'string' && message.indexOf('is not a constructor') !== -1) {
                throw new Error(error_message);
            }
            else {
                throw err;
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

    /**
     * This is totally rewrite for the old parser module
     * I'll improve and replace them little by little.
     */

    const symbols$1 = [
      ':', ';', ',', '(', ')', '[', ']',
      '{', '}', 'π', '±', '+', '-', '*',
      '/', '%', '"', "'", '`', '@', '=',
      '^',
    ];

    const is$1 = {
      escape: c => c == '\\',
      space:  c => /[\r\n\t\s]/.test(c),
      digit:  c => /^[0-9]$/.test(c),
      sign:   c => /^[+-]$/.test(c),
      dot:    c => c == '.',
      quote:  c => /^["'`]$/.test(c),
      symbol: c => symbols$1.includes(c),
      hexNum: c => /^[0-9a-f]$/i.test(c),
      hex:           (a, b, c) => a == '0' && is$1.letter(b, 'x') && is$1.hexNum(c),
      expWithSign:   (a, b, c) => is$1.letter(a, 'e') && is$1.sign(b) && is$1.digit(c),
      exp:           (a, b) => is$1.letter(a, 'e') && is$1.digit(b),
      dots:          (a, b) => is$1.dot(a) && is$1.dot(b),
      letter:        (a, b) => String(a).toLowerCase() == String(b).toLowerCase(),
      comment:       (a, b) => a == '/' && b == '*',
      inlineComment: (a, b) => a == '/' && b === '/',
      selfClosedTag: (a, b) => a == '/' && b == '>',
      closedTag:     (a, b) => a == '<' && b == '/',
    };

    class Token {
      constructor({ type, value, pos, status }) {
        this.type = type;
        this.value = value;
        this.pos = pos;
        if (status) {
          this.status = status;
        }
      }
      isSymbol(...values) {
        let isSymbol = this.type == 'Symbol';
        if (!values.length) return isSymbol;
        return values.some(c => c === this.value);
      }
      isSpace() {
        return this.type == 'Space';
      }
      isNumber() {
        return this.type == 'Number';
      }
      isWord() {
        return this.type == 'Word';
      }
    }

    function iterator$1(input) {
      let pointer = -1;
      let max = input.length;
      let col = -1, row = 0;
      return {
        curr(n = 0) {
          return input[pointer + n];
        },
        next(n = 1) {
          let next = input[pointer += n];
          if (next === '\n') row++, col = 0;
          else col += n;
          return next;
        },
        end() {
          return pointer >= max;
        },
        get() {
          return {
            prev:  input[pointer - 1],
            curr:  input[pointer + 0],
            next:  input[pointer + 1],
            next2: input[pointer + 2],
            next3: input[pointer + 3],
            pos:   [col, row],
          }
        }
      }
    }

    function skipComments(iter) {
      while (iter.next()) {
        let { curr, prev } = iter.get();
        if (is$1.comment(curr, prev)) break;
      }
    }

    function skipInlineComments(iter) {
      while (iter.next()) {
        if (iter.curr() === '\n') break;
      }
    }

    function ignoreSpacingSymbol(value) {
       return [':', ';', ',', '{', '}', '(', ')', '[', ']'].includes(value);
    }

    function readWord(iter) {
      let temp = '';
      while (!iter.end()) {
        let { curr, next } = iter.get();
        temp += curr;
        let isBreak = is$1.symbol(next) || is$1.space(next) || is$1.digit(next);
        if (temp.length && isBreak) {
          if (!is$1.closedTag(curr, next)) break;
        }
        iter.next();
      }
      return temp.trim();
    }

    function readSpaces(iter) {
      let temp = '';
      while (!iter.end()) {
        let { curr, next } = iter.get();
        temp += curr;
        if (!is$1.space(next)) break;
        iter.next();
      }
      return temp;
    }

    function readNumber(iter) {
      let temp = '';
      let hasDot = false;
      while (!iter.end()) {
        let { curr, next, next2, next3 } = iter.get();
        temp += curr;
        if (hasDot && is$1.dot(next)) break;
        if (is$1.dot(curr)) hasDot = true;
        if (is$1.dots(next, next2)) break;
        if (is$1.expWithSign(next, next2, next3)) {
          temp += iter.next() + iter.next();
        }
        else if (is$1.exp(next, next2)) {
          temp += iter.next();
        }
        else if (!is$1.digit(next) && !is$1.dot(next)) {
          break;
        }
        iter.next();
      }
      return temp;
    }

    function readHexNumber(iter) {
      let temp = '0x';
      iter.next(2);
      while (!iter.end()) {
        let { curr, next } = iter.get();
        temp += curr;
        if (!is$1.hexNum(next)) break;
        iter.next();
      }
      return temp;
    }

    function last$1(array) {
      return array[array.length - 1];
    }

    function scan(source, options = {}) {
      let iter = iterator$1(String(source).trim());
      let tokens = [];
      let quoteStack = [];

      while (iter.next()) {
        let { prev, curr, next, next2, pos } = iter.get();
        if (is$1.comment(curr, next)) {
          skipComments(iter);
        }
        else if (options.ignoreInlineComment && is$1.inlineComment(curr, next)) {
          skipInlineComments(iter);
        }
        else if (is$1.hex(curr, next, next2)) {
          let num = readHexNumber(iter);
          tokens.push(new Token({
            type: 'Number', value: num, pos
          }));
        }
        else if (is$1.digit(curr) || (
            is$1.digit(next) && is$1.dot(curr) && !is$1.dots(prev, curr))) {
          let num = readNumber(iter);
          tokens.push(new Token({
            type: 'Number', value: num, pos
          }));
        }
        else if (is$1.symbol(curr) && !is$1.selfClosedTag(curr, next)) {
          let lastToken = last$1(tokens);
          // negative
          let isNextDigit = is$1.digit(next) || (is$1.dot(next) && is$1.digit(next2));
          if (curr === '-' && isNextDigit && (!lastToken || !lastToken.isNumber())) {
            let num = readNumber(iter);
            tokens.push(new Token({
              type: 'Number', value: num, pos
            }));
            continue;
          }

          let token = {
            type: 'Symbol', value: curr, pos
          };
          // Escaped symbols
          if (quoteStack.length && is$1.escape(lastToken.value)) {
            tokens.pop();
            let word = readWord(iter);
            if (word.length) {
              tokens.push(new Token({
                type: 'Word', value: word, pos
              }));
            }
          }
          else {
            if (is$1.quote(curr)) {
              let lastQuote = last$1(quoteStack);
              if (lastQuote == curr) {
                quoteStack.pop();
                token.status = 'close';
              } else {
                quoteStack.push(curr);
                token.status = 'open';
              }
            }

            tokens.push(new Token(token));
          }
        }
        else if (is$1.space(curr)) {
          let spaces = readSpaces(iter);
          let lastToken = last$1(tokens);
          let { next } = iter.get();
          // Reduce unnecessary spaces
          if (!quoteStack.length && lastToken) {
            let prev = lastToken.value;
            let ignoreLeft = (ignoreSpacingSymbol(prev) && prev !== ')');
            let ignoreRight = (ignoreSpacingSymbol(next) && next !== '(');
            if (ignoreLeft || ignoreRight)  {
              continue;
            } else {
              spaces = options.preserveLineBreak ? curr : ' ';
            }
          }
          if (tokens.length && (next && next.trim())) {
            tokens.push(new Token({
              type: 'Space', value: spaces, pos
            }));
          }
        }
        else {
          let word = readWord(iter);
          if (word.length) {
            tokens.push(new Token({
              type: 'Word', value: word, pos
            }));
          }
        }
      }

      // Remove last space token
      let lastToken = last$1(tokens);
      if (lastToken && lastToken.isSpace()) {
        tokens.length = tokens.length - 1;
      }
      return tokens;
    }

    function parse$9(input) {
      let iter = iterator$1(scan(input));
      return walk$2(iter);
    }

    function walk$2(iter) {
      let rules = [];
      while (iter.next()) {
        let { curr, next } = iter.get();
        if (curr.value === 'var') {
          if (next && next.isSymbol('(')) {
            iter.next();
            let rule = parseVar(iter);
            if (isValid(rule.name)) {
              rules.push(rule);
            }
          }
        } else if (rules.length && !curr.isSymbol(',')) {
          break;
        }
      }
      return rules;
    }

    function parseVar(iter) {
      let ret = {};
      let tokens = [];
      while (iter.next()) {
        let { curr, next } = iter.get();
        if (curr.isSymbol(')', ';') && !ret.name) {
          ret.name = joinTokens$2(tokens);
          break;
        }
        else if (curr.isSymbol(',')) {
          if (ret.name === undefined) {
            ret.name = joinTokens$2(tokens);
            tokens = [];
          }
          if (ret.name) {
            ret.fallback = walk$2(iter);
          }
        } else {
          tokens.push(curr);
        }
      }
      return ret;
    }

    function joinTokens$2(tokens) {
      return tokens.map(n => n.value).join('');
    }

    function isValid(name) {
      if (name === undefined) return false;
      if (name.length <= 2) return false;
      if (name.substr(2).startsWith('-')) return false;
      if (!name.startsWith('--')) return false;
      return true;
    }

    function clamp(num, min, max) {
      num = Number(num) || 0;
      return Math.max(min, Math.min(max, num));
    }

    function maybe(cond, value) {
      if (!cond) return '';
      return (typeof value === 'function') ? value() : value;
    }

    function range(start, stop, step) {
      let count = 0, old = start;
      let initial = n => (n > 0 && n < 1) ? .1 : 1;
      let length = arguments.length;
      if (length == 1) [start, stop] = [initial(start), start];
      if (length < 3) step = initial(start);
      let range = [];
      while ((step >= 0 && start <= stop)
        || (step < 0 && start > stop)) {
        range.push(start);
        start += step;
        if (count++ >= 65535) break;
      }
      if (!range.length) range.push(old);
      return range;
    }

    function add_alias(obj, names) {
      for (let [alias, name] of Object.entries(names)) {
        obj[alias] = obj[name];
      }
      return obj;
    }

    function is_letter(c) {
      return /^[a-zA-Z]$/.test(c);
    }

    function is_nil(s) {
      return s === undefined || s === null;
    }

    function is_invalid_number(v) {
      return is_nil(v) || Number.isNaN(v);
    }

    function is_empty(value) {
      return is_nil(value) || value === '';
    }

    function lazy(fn) {
      let wrap = (upstream) => {
        return (...args) => fn(...[upstream, ...args]);
      };
      wrap.lazy = true;
      return wrap;
    }

    function sequence(count, fn) {
      let [x, y = 1] = String(count).split(/[x-]/);
      let [cx, cy] = [Math.ceil(x), Math.ceil(y)];
      if (is_invalid_number(cx)) cx = 1;
      if (is_invalid_number(cy)) cy = 1;
      x = clamp(cx, 0, 65536);
      y = clamp(cy, 0, 65536);
      let max = x * y;
      let ret = [];
      let index = 1;

      if (/x/.test(count)) {
        for (let i = 1; i <= y; ++i) {
          for (let j = 1; j <= x; ++j) {
            ret.push(fn(index++, j, i, max, x, y, index));
          }
        }
      }

      else if (/-/.test(count)) {
        max = Math.abs(x - y) + 1;
        if (x <= y) {
          for (let i = x; i <= y; ++i) {
            ret.push(fn(i, i, 1, max, max, 1, index++));
          }
        } else {
          for (let i = x; i >= y; --i) {
            ret.push(fn(i, i, 1, max, max, 1, index++));
          }
        }
      }

      else {
        for (let i = 1; i <= x; ++i) {
          ret.push(fn(i, i, 1, x, x, 1, index++));
        }
      }

      return ret;
    }

    function cell_id(x, y, z) {
      return 'c-' + x + '-' + y + '-' + z;
    }

    function get_value(input) {
      let v = input;
      while (v && !is_nil(v.value)) v = v.value;
      return is_nil(v) ? '' : v;
    }

    function normalize_png_name(name) {
      let prefix = is_nil(name)
        ? Date.now()
        : String(name).replace(/\/.png$/g, '');
      return prefix + '.png';
    }

    function cache_image(src, fn, delay = 0) {
      let img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
      img.onload = function() {
        setTimeout(fn, delay);
      };
    }

    function is_safari() {
      return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }

    function un_entity(code) {
      let textarea = document.createElement('textarea');
      textarea.innerHTML = code;
      return textarea.value;
    }

    function entity(code) {
      return code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
    }

    /* cyrb53 */
    function hash(str, seed = 0) {
      let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
      for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
      }
      h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
      h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
      return 4294967296 * (2097151 & h2) + (h1>>>0);
    }

    function make_tag_function(fn) {
      let get_value = v => is_nil(v) ? '' : v;
      return (input, ...vars) => {
        let string = make_array$1(input).reduce((s, c, i) => s + c + get_value(vars[i]), '');
        return fn(string);
      };
    }

    function next_id() {
      let id = 0;
      return (prefix = '') => `${prefix}-${++id}`;
    }

    function lerp(t, a, b) {
      return a + t * (b - a);
    }

    function unique_id(prefix = '') {
      return prefix + Math.random().toString(32).substr(2);
    }

    function make_array$1(arr) {
      if (is_nil(arr)) return [];
      return Array.isArray(arr) ? arr : [arr];
    }

    function parse$8(input, option = {symbol: ',', noSpace: false, verbose: false }) {
      let group = [];
      let tokens = [];
      let parenStack = [];
      let quoteStack = [];
      let lastGroupName = '';

      if (is_empty(input)) {
        return group;
      }

      let iter = iterator$1(scan(input));

      function isSeperator(token) {
        let symbol = option.symbol || [','];
        if (!Array.isArray(symbol)) {
          symbol = [symbol];
        }
        if (option.noSpace) {
          return token.isSymbol(...symbol);
        }
        return token.isSymbol(...symbol) || token.isSpace();
      }

      function addGroup(tokens) {
        let value = joinTokens$1(tokens);
        if (option.verbose) {
          if (lastGroupName.length || value.length) {
            group.push({ group: lastGroupName, value });
          }
        } else {
          group.push(value);
        }
      }

      while (iter.next()) {
        let { prev, curr, next }  = iter.get();
        if (curr.isSymbol('(')) {
          parenStack.push(curr.value);
        }
        if (curr.isSymbol(')')) {
          parenStack.pop();
        }
        if (curr.status === 'open') {
          quoteStack.push(curr.value);
        }
        if (curr.status === 'close') {
          quoteStack.pop();
        }
        let emptyStack = (!parenStack.length && !quoteStack.length);
        if (emptyStack) {
          let isNextSpace = option.noSpace && curr.isSpace() && isSeperator(next);
          let isPrevSpace = option.noSpace && curr.isSpace() && isSeperator(prev);
          if (isNextSpace || isPrevSpace) continue;
        }
        if (emptyStack && isSeperator(curr)) {
          addGroup(tokens);
          lastGroupName = curr.value;
          tokens = [];
        } else {
          tokens.push(curr);
        }
      }

      if (tokens.length) {
        addGroup(tokens);
      }

      return group;
    }

    function joinTokens$1(tokens) {
      return tokens.map(n => n.value).join('');
    }

    function readStatement$1(iter, token) {
      let fragment = [];
      let inlineBlock;
      let stackQuote = [];
      let stackParen = [];
      while (iter.next()) {
        let { curr, next } = iter.get();
        if (curr.isSymbol('(') && !stackQuote.length) {
          stackParen.push(curr);
        } else if (curr.isSymbol(')') && !stackQuote.length) {
          stackParen.pop();
        }
        let isStatementBreak = !stackQuote.length && !stackParen.length && (!next || curr.isSymbol(';') || next.isSymbol('}'));
        if (curr.isSymbol("'", '"')) {
          if (curr.status === 'open') {
            stackQuote.push(curr);
          } else {
            stackQuote.pop();
          }
          if ((next && next.isSymbol('}')) && !stackQuote.length) {
            isStatementBreak = true;
          }
        }
        if (!stackParen.length && !stackQuote.length && curr.isSymbol('{')) {
          let selectors = getSelectors(fragment);
          if (!selectors.length) {
            continue;
          }
          let tokenName = selectors.pop();
          let skip = isSkip(...selectors, tokenName);
          inlineBlock = resolveId(walk$1(iter, splitTimes(tokenName, {
            type: 'block',
            inline: true,
            name: tokenName,
            value: [],
          })), skip);

          while (tokenName = selectors.pop()) {
            inlineBlock = resolveId(splitTimes(tokenName, {
              type: 'block',
              name: tokenName,
              value: [inlineBlock]
            }), skip);
          }
          break;
        }
        fragment.push(curr);
        if (isStatementBreak) {
          break;
        }
      }
      if (fragment.length && !inlineBlock) {
        token._valueTokens = fragment;
        token.value = joinToken$2(fragment);
      } else if (inlineBlock) {
        token.value = inlineBlock;
      }
      if (token.origin) {
        token.origin.value = token.value;
      }
      return token;
    }

    function readStyle(iter) {
      let stack = [];
      let style = [];
      while (iter.next()) {
        let { curr } = iter.get();
        if (curr.isSymbol('{')) {
          stack.push(curr.value);
        } else if (curr.isSymbol('}')) {
          if (stack.length) {
            stack.pop();
          } else {
            break;
          }
        }
        style.push(curr.value);
      }
      return style.join('');
    }

    function walk$1(iter, parentToken) {
      let rules = [];
      let fragment = [];
      let tokenType = parentToken && parentToken.type || '';
      let stack = [];

      while (iter.next()) {
        let { prev, curr, next } = iter.get();
        if (curr.isSymbol('(')) {
          stack.push(curr.value);
        }
        if (curr.isSymbol(')')) {
          stack.pop();
        }
        let isBlockBreak = !next || curr.isSymbol('}');
        if (isBlock(tokenType) && isBlockBreak) {
          if (!next && rules.length && !curr.isSymbol('}')) {
            let last = rules[rules.length - 1].value;
            if (typeof last === 'string') {
              rules[rules.length - 1].value += (';' + curr.value);
            }
          }
          parentToken.value = rules;
          break;
        }
        else if (curr.isSymbol('{')) {
          let selectors = getSelectors(fragment);
          if (!selectors.length) {
            continue;
          }
          if (isSkip(parentToken.name)) {
            selectors = [joinToken$2(fragment)];
          }
          let tokenName = selectors.pop();
          let skip = isSkip(...selectors, parentToken.name, tokenName);

          if (tokenName === 'style') {
            rules.push({
              type: 'block',
              name: tokenName,
              value: readStyle(iter)
            });
          } else {
            let block = resolveId(walk$1(iter, splitTimes(tokenName, {
              type: 'block',
              name: tokenName,
              value: []
            })), skip);

            while (tokenName = selectors.pop()) {
              block = resolveId(splitTimes(tokenName, {
                type: 'block',
                name: tokenName,
                value: [block]
              }), skip);
            }
            rules.push(block);
          }
          fragment = [];
        }
        else if (
          curr.isSymbol(':')
          && !stack.length
          && !isSpecialProperty(prev, next)
          && fragment.length
        ) {
          let props = getGroups(fragment, token => token.isSymbol(','));
          let intial = {
            type: 'statement',
            name: 'unkown',
            value: ''
          };
          if (props.length > 1) {
            intial.origin = {
              name: props
            };
          }
          let statement = readStatement$1(iter, intial);
          let groupdValue = parse$8(statement.value);
          let expand = (props.length > 1 && groupdValue.length === props.length);

          props.forEach((prop, i) => {
            let item = Object.assign({}, statement, { name: prop });
            if (/^\-\-/.test(prop)) {
              item.variable = true;
            }
            if (expand) {
              item.value = groupdValue[i];
            }
            if (/viewBox/i.test(prop)) {
              item.detail = parseViewBox(item.value, item._valueTokens);
            }
            delete item._valueTokens;
            rules.push(item);
          });
          if (isBlock(tokenType)) {
            parentToken.value = rules;
          }
          fragment = [];
        }
        else if (curr.isSymbol(';')) {
          if (rules.length && fragment.length) {
            rules[rules.length - 1].value += (';' + joinToken$2(fragment));
            fragment = [];
          }
        }
        else {
          fragment.push(curr);
        }
      }

      if (rules.length && isBlock(tokenType)) {
        parentToken.value = rules;
      }
      return tokenType ? parentToken : rules;
    }

    function isSpecialProperty(prev, next) {
      const names = [
        'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role',
        'xlink:show',    'xlink:title',   'xlink:type',
        'xml:base',      'xml:lang',      'xml:space',
      ];
      let prevValue = prev && prev.value;
      let nextValue = next && next.value;
      return names.includes(prevValue + ':' + nextValue);
    }

    function joinToken$2(tokens) {
      return tokens
        .filter((token, i) => {
          if (token.isSymbol(';', '}') && i === tokens.length - 1) return false;
          return true;
        })
        .map(n => n.value).join('');
    }

    function resolveId(block, skip) {
      let name = block.name || '';
      let [tokenName, ...ids] = name.split(/#/);
      let id = ids[ids.length - 1];
      if (tokenName && id && !skip) {
        block.name = tokenName;
        block.value.push({
          type: 'statement',
          name: 'id',
          value: id,
        });
      }
      return block;
    }

    function getGroups(tokens, fn) {
      let group = [];
      let temp = [];
      tokens.forEach(token => {
        if (fn(token)) {
          group.push(joinToken$2(temp));
          temp = [];
        } else {
          temp.push(token);
        }
      });
      if (temp.length) {
        group.push(joinToken$2(temp));
      }
      return group;
    }

    function getSelectors(tokens) {
      let result = [];
      let it = iterator$1(tokens);
      let hasSymbol;
      while (it.next()) {
        let { prev, curr, next } = it.get();
        let isTimeSymbol = (
          prev && next &&
          curr.value === 'x' &&
          prev.isNumber()  &&
          next.isNumber()
        );
        if (curr.isWord() && !hasSymbol && !isTimeSymbol) {
          result.push(curr.value.trim());
        } else {
          result[result.length - 1] =
            (result[result.length - 1] + curr.value).trim();
        }
        if (curr.isSymbol()) {
          hasSymbol = true;
        } else if (!curr.isSpace()) {
          hasSymbol = false;
        }
      }
      return result;
    }

    function parseViewBox(value, tokens) {
      const viewBox = { value: [] };
      let temp;
      if (!Array.isArray(tokens)) {
        return viewBox;
      }
      for (let token of tokens) {
        if (token.isSpace() || token.isSymbol(',', ';')) {
          continue;
        }
        if (viewBox.value.length < 4 && token.isNumber()) {
          viewBox.value.push(Number(token.value));
        }
        else if (token.isNumber() && temp) {
          viewBox[temp] = Number(token.value);
          temp = null;
        }
        else if (token.isWord()) {
          temp = token.value;
        }
      }
      return viewBox;
    }

    function splitTimes(name, object) {
      let target = Object.assign({}, object);
      if (/\*\s*[0-9]/.test(name)) {
        let [tokenName, times] = name.split('*');
        if (times) {
          target.times = times.trim();
          target.pureName = tokenName.trim();
        }
      }
      return target;
    }

    function isSkip(...names) {
      return names.some(n => n === 'style');
    }

    function isBlock(type) {
      return type === 'block';
    }

    function skipHeadSVG(block) {
      let headSVG, headVariables = [];
      for (let item of block.value) {
        if (item.name === 'svg') {
          headSVG = item;
        }
        if (item.variable) {
          headVariables.push(item);
        }
      }
      if (headSVG) {
        headSVG.value.push(...headVariables);
        return headSVG;
      }
      return block;
    }

    function parse$7(source, root) {
      let iter = iterator$1(scan(source));
      let tokens = walk$1(iter, root || {
        type: 'block',
        name: 'svg',
        value: []
      });
      return skipHeadSVG(tokens);
    }

    function generate$2(token, last) {
      let result = '';
      if (token.type === 'block') {
        let isInline = Array.isArray(token.value) && token.value[0] && token.value[0].inline;
        if (token.times) {
          result += ('@M' + token.times + '(' + token.pureName + '{');
        } else {
          result += token.name + (isInline ? ' ' : '{');
        }
        if (token.name === 'style') {
          result += token.value;
        }
        else if (Array.isArray(token.value) && token.value.length) {
          let lastGroup = '';
          for (let t of token.value) {
            result += generate$2(t, lastGroup);        if (t.origin) {
              lastGroup = t.origin.name.join(',');
            }
          }
        }
        if (token.times) {
          result += '})';
        } else if (!isInline) {
          result += '}';
        }
      } else if (token.type === 'statement') {
        let skip = (token.origin && last === token.origin.name.join(','));
        let name = token.origin ? token.origin.name.join(',') : token.name;
        let value = token.origin ? token.origin.value : token.value;
        if (!skip) {
          result += (value && value.type)
            ? (name + ':' + generate$2(value))
            : (name + ':' + value + ';');
        }
      }
      return result;
    }

    function generate_svg_extended(token) {
      return generate$2(token).trim();
    }

    function make_array(arr) {
      if (is_nil(arr)) return [];
      return Array.isArray(arr) ? arr : [arr];
    }

    function join(arr, spliter = '\n') {
      return (arr || []).join(spliter);
    }

    function last(arr, n = 1) {
      if (is_nil(arr)) return '';
      return arr[arr.length - n];
    }

    function first(arr) {
      return arr[0];
    }

    function clone(arr) {
      return JSON.parse(JSON.stringify(arr));
    }

    function duplicate(arr) {
      return [].concat(arr, arr);
    }

    function flat_map(arr, fn) {
      if (Array.prototype.flatMap) return arr.flatMap(fn);
      return arr.reduce((acc, x) => acc.concat(fn(x)), []);
    }

    function remove_empty_values(arr) {
      return arr.filter(v => (
        !is_nil(v) && String(v).trim().length
      ));
    }

    // I need to rewrite this


    const Tokens = {
      func(name = '') {
        return {
          type: 'func',
          name,
          arguments: []
        };
      },
      argument() {
        return {
          type: 'argument',
          value: []
        };
      },
      text(value = '') {
        return {
          type: 'text',
          value
        };
      },
      pseudo(selector = '') {
        return {
          type: 'pseudo',
          selector,
          styles: []
        };
      },
      cond(name = '') {
        return {
          type: 'cond',
          name,
          styles: [],
          arguments: []
        };
      },
      rule(property = '') {
        return {
          type: 'rule',
          property,
          value: []
        };
      },
      keyframes(name = '') {
        return {
          type: 'keyframes',
          name,
          steps: []
        }
      },

      step(name = '') {
        return {
          type: 'step',
          name,
          styles: []
        }
      }
    };

    const is = {
      white_space(c) {
        return /[\s\n\t]/.test(c);
      },
      line_break(c) {
        return /\n/.test(c);
      },
      number(n) {
        return !isNaN(n);
      },
      pair(n) {
        return ['"', '(', ')', "'"].includes(n);
      },
      pair_of(c, n) {
        return ({ '"': '"', "'": "'", '(': ')' })[c] == n;
      }
    };

    // This should not be in the parser
    // but I'll leave it here until the rewriting
    const symbols = {
      'π': Math.PI,
      '∏': Math.PI
    };

    function composible(name) {
      return ['@canvas', '@shaders', '@doodle'].includes(name);
    }

    function iterator(input = '') {
      let index = 0, col = 1, line = 1;
      return {
        curr(n = 0) {
          return input[index + n];
        },
        end() {
          return input.length <= index;
        },
        info() {
          return { index, col, line };
        },
        index(n) {
          return (n === undefined ? index : index = n);
        },
        range(start, end) {
          return input.substring(start, end);
        },
        next() {
          let next = input[index++];
          if (next == '\n') line++, col = 0;
          else col++;
          return next;
        }
      };
    }

    function throw_error(msg, { col, line }) {
      console.warn(
        `(at line ${ line }, column ${ col }) ${ msg }`
      );
    }

    function get_text_value(input) {
      if (input.trim().length) {
        return is.number(+input) ? +input : input.trim()
      } else {
        return input;
      }
    }

    function read_until(fn) {
      return function(it, reset) {
        let index = it.index();
        let word = '';
        while (!it.end()) {
          let c = it.next();
          if (fn(c)) break;
          else word += c;
        }
        if (reset) {
          it.index(index);
        }
        return word;
      }
    }

    function read_word(it, reset) {
      let check = c => /[^\w@]/.test(c);
      return read_until(check)(it, reset);
    }

    function read_keyframe_name(it) {
      return read_until(c => /[\s\{]/.test(c))(it);
    }

    function read_line(it, reset) {
      let check = c => is.line_break(c) || c == '{';
      return read_until(check)(it, reset);
    }

    function read_step(it, extra) {
      let c, step = Tokens.step();
      while (!it.end()) {
        if ((c = it.curr()) == '}') break;
        if (is.white_space(c)) {
          it.next();
          continue;
        }
        else if (!step.name.length) {
          step.name = read_selector(it);
        }
        else {
          step.styles.push(read_rule(it, extra));
          if (it.curr() == '}') break;
        }
        it.next();
      }
      return step;
    }

    function read_steps(it, extra) {
      const steps = [];
      let c;
      while (!it.end()) {
        if ((c = it.curr()) == '}') break;
        else if (is.white_space(c)) {
          it.next();
          continue;
        }
        else {
          steps.push(read_step(it, extra));
        }
        it.next();
      }
      return steps;
    }

    function read_keyframes(it, extra) {
      let keyframes = Tokens.keyframes(), c;
      while (!it.end()) {
        if ((c = it.curr()) == '}') break;
        else if (!keyframes.name.length) {
          read_word(it);
          keyframes.name = read_keyframe_name(it);
          if (!keyframes.name.length) {
            throw_error('missing keyframes name', it.info());
            break;
          }
          continue;
        }
        else if (c == '{' || it.curr(-1) == '{') {
          it.next();
          keyframes.steps = read_steps(it, extra);
          break;
        }
        it.next();
      }
      return keyframes;
    }

    function read_comments(it, flag = {}) {
      it.next();
      while (!it.end()) {
        let c = it.curr();
        if (flag.inline) {
          if (c == '\n') break;
        }
        else {
          if ((c = it.curr()) == '*' && it.curr(1) == '/') break;
        }
        it.next();
      }
      if (!flag.inline) {
        it.next(); it.next();
      }
    }

    function skip_tag(it) {
      it.next();
      while(!it.end()) {
        let c = it.curr();
        if (c == '>') break;
        it.next();
      }
    }

    function read_property(it) {
      let prop = '', c;
      while (!it.end()) {
        if ((c = it.curr()) == ':') break;
        else if (!is.white_space(c)) prop += c;
        it.next();
      }
      return prop;
    }

    function read_arguments(it, composition, doodle) {
      let args = [], group = [], stack = [], arg = '', c;
      let raw = '';
      while (!it.end()) {
        c = it.curr();
        let prev = it.curr(-1);
        let next = it.curr(1);
        let start = it.index();
        if ((/[\('"`]/.test(c) && prev !== '\\')) {
          if (stack.length) {
            if ((c !== '(') && last(stack) === '(') {
              stack.pop();
            }
            if (c != '(' && c === last(stack)) {
              stack.pop();
            } else {
              stack.push(c);
            }
          } else {
            stack.push(c);
          }
          arg += c;
        }
        else if ((c == '@' || (prev === '.' && composition)) && !doodle) {
          if (!group.length) {
            arg = arg.trimLeft();
          }
          if (arg.length) {
            group.push(Tokens.text(arg));
            arg = '';
          }
          group.push(read_func(it));
        }
        else if (doodle && /[)]/.test(c) || (!doodle && /[,)]/.test(c))) {
          if (stack.length) {
            if (c == ')' && last(stack) === '(') {
              stack.pop();
            }
            arg += c;
          }
          else {
            if (arg.length) {
              if (!group.length) {
                group.push(Tokens.text(get_text_value(arg)));
              } else if (/\S/.test(arg)) {
                group.push(Tokens.text(arg));
              }
              if (arg.startsWith('±') && !doodle) {
                let raw = arg.substr(1);
                let cloned = clone(group);
                last(cloned).value = '-' + raw;
                args.push(normalize_argument(cloned));
                last(group).value = raw;
              }
            }

            args.push(normalize_argument(group));

            [group, arg] = [[], ''];

            if (c == ')') break;
          }
        }
        else {
          if (symbols[c] && !/[0-9]/.test(it.curr(-1))) {
            c = symbols[c];
          }
          arg += c;
        }
        if (composition && ((next == ')' || next == ';') || !/[0-9a-zA-Z_\-.]/.test(it.curr())) && !stack.length) {
          if (group.length) {
            args.push(normalize_argument(group));
          }
          break;
        }
        else {
          raw += it.range(start, it.index() + 1);
          it.next();
        }
      }
      return [skip_last_empty_args(args), raw];
    }

    function skip_last_empty_args(args) {
      let arg = last(args[0]);
      if (arg && arg.type === 'text' && !String(arg.value).trim().length) {
        args[0] = args[0].slice(0, -1);
      }
      return args;
    }

    function normalize_argument(group) {
      let result = group.map(arg => {
        if (arg.type == 'text' && typeof arg.value == 'string') {
          let value = String(arg.value);
          if (value.includes('`')) {
            arg.value = value = value.replace(/`/g, '"');
          }
          arg.value = value;
        }
        return arg;
      });

      let ft = first(result) || {};
      let ed = last(result) || {};
      if (ft.type == 'text' && ed.type == 'text') {
        let cf = first(ft.value);
        let ce  = last(ed.value);
        if (typeof ft.value == 'string' && typeof ed.value == 'string') {
          if (is.pair_of(cf, ce)) {
            ft.value = ft.value.slice(1);
            ed.value = ed.value.slice(0, ed.value.length - 1);
            result.cluster = true;
          }
        }
      }

      return result;
    }

    function seperate_func_name(name) {
      let fname = '', extra = '';
      if ((/\D$/.test(name) && !/\d+[x-]\d+/.test(name)) || Math[name.substr(1)]) {
        return { fname: name, extra }
      }
      for (let i = name.length - 1; i >= 0; i--) {
        let c = name[i];
        let prev = name[i - 1];
        let next = name[i + 1];
        if (/[\d.]/.test(c) || ((c == 'x' || c == '-') && /\d/.test(prev) && /\d/.test(next))) {
          extra = c + extra;
        } else {
          fname = name.substring(0, i + 1);
          break;
        }
      }
      return { fname, extra };
    }

    function has_times_syntax(token) {
      let str = JSON.stringify(token);
      return str.includes('pureName') && str.includes('times');
    }

    function is_svg(name) {
      return /^@svg$/i.test(name);
    }

    function read_func(it) {
      let func = Tokens.func();
      let name = it.curr(), c;
      let has_argument = false;
      if (name === '@') {
        it.next();
      } else {
        name = '@';
      }
      while (!it.end()) {
        c = it.curr();
        let next = it.curr(1);
        let composition = (c == '.' && (next == '@' || /[a-zA-Z]/.test(next)));
        if (c == '(' || composition) {
          has_argument = true;
          it.next();
          let [args, raw_args] = read_arguments(it, composition, composible(name));
          if (is_svg(name) && /\d\s*{/.test(raw_args)) {
            let parsed_svg = parse$7(raw_args);
            if (has_times_syntax(parsed_svg)) {
              let svg = generate_svg_extended(parsed_svg);
              // compatible with old iterator
              svg += ')';
              let extended = read_arguments(iterator(svg), composition, composible(name));
              args = extended[0];
            }
          }
          func.arguments = args;
          break;
        } else if (/[0-9a-zA-Z_\-.]/.test(c)) {
          name += c;
        }
        if (!has_argument && next !== '(' && !/[0-9a-zA-Z_\-.]/.test(next)) {
          break;
        }
        it.next();
      }
      let { fname, extra } = seperate_func_name(name);
      func.name = fname;

      if (extra.length) {
        func.arguments.unshift([{
          type: 'text',
          value: extra
        }]);
      }

      func.position = it.info().index;
      return func;
    }

    function read_value(it) {
      let text = Tokens.text(), idx = 0, skip = true, c;
      const value = [];
      value[idx] = [];
      let stack = [], quote_stack = [];

      while (!it.end()) {
        c = it.curr();

        if (skip && is.white_space(c)) {
          it.next();
          continue;
        } else {
          skip = false;
        }

        if (c == '\n' && !is.white_space(it.curr(-1))) {
          text.value += ' ';
        }
        else if (c == ',' && !stack.length) {
          if (text.value.length) {
            value[idx].push(text);
            text = Tokens.text();
          }
          value[++idx] = [];
          skip = true;
        }
        else if (/[;}<]/.test(c) && !quote_stack.length) {
          if (text.value.length) {
            value[idx].push(text);
            text = Tokens.text();
          }
          break;
        }
        else if (c == '@' && /\w/.test(it.curr(1))) {
          if (text.value.length) {
            value[idx].push(text);
            text = Tokens.text();
          }
          value[idx].push(read_func(it));
        }
        else if (c === '"' || c === "'") {
          let quote = last(quote_stack);
          if (c === quote) {
            quote_stack.pop();
          } else if (!quote_stack.length) {
            quote_stack.push(c);
          }
          text.value += c;
        }
        else if (!is.white_space(c) || !is.white_space(it.curr(-1))) {
          if (c == '(') stack.push(c);
          if (c == ')') stack.pop();

          if (symbols[c] && !/[0-9]/.test(it.curr(-1))) {
            c = symbols[c];
          }
          text.value += c;
        }
        if (it.curr() === ';' || it.curr() == '}') {
          break;
        }
        it.next();
      }
      if (text.value.length) {
        value[idx].push(text);
      }
      return value;
    }

    function read_selector(it) {
      let selector = '', c;
      while (!it.end()) {
        if ((c = it.curr()) == '{') break;
        else if (!is.white_space(c)) {
          selector += c;
        }
        it.next();
      }
      return selector;
    }

    function read_cond_selector(it) {
      let selector = { name: '', arguments: [] }, c;
      while (!it.end()) {
        if ((c = it.curr()) == '(') {
          it.next();
          selector.arguments = read_arguments(it)[0];
        }
        else if (/[){]/.test(c)) break;
        else if (!is.white_space(c)) selector.name += c;
        it.next();
      }
      return selector;
    }

    function read_pseudo(it, extra) {
      let pseudo = Tokens.pseudo(), c;
      while (!it.end()) {
        c = it.curr();
        if (c == '/' && it.curr(1) == '*') {
          read_comments(it);
        }
        else if (c == '}') {
          break;
        }
        else if (is.white_space(c)) {
          it.next();
          continue;
        }
        else if (!pseudo.selector) {
          pseudo.selector = read_selector(it);
        }
        else {
          let rule = read_rule(it, extra);
          if (rule.property == '@use') {
            pseudo.styles = pseudo.styles.concat(
              rule.value
            );
          } else {
            pseudo.styles.push(rule);
          }
          if (it.curr() == '}') break;
        }
        it.next();
      }
      return pseudo;
    }

    function read_rule(it, extra) {
      let rule = Tokens.rule(), c;
      let start = it.index();
      while (!it.end()) {
        c = it.curr();
        if (c == '/' && it.curr(1) == '*') {
          read_comments(it);
        }
        else if (c == ';') {
          break;
        }
        else if (!rule.property.length) {
          rule.property = read_property(it);
          if (rule.property == '@use') {
            rule.value = read_var(it, extra);
            break;
          }
        }
        else {
          rule.value = read_value(it);
          break;
        }
        it.next();
      }
      let end = it.index();
      rule.raw = () => it.range(start, end).trim();
      return rule;
    }

    function read_cond(it, extra) {
      let cond = Tokens.cond(), c;
      while (!it.end()) {
        c = it.curr();
        if (c == '/' && it.curr(1) == '*') {
          read_comments(it);
        }
        else if (c == '}') {
          break;
        }
        else if (!cond.name.length) {
          Object.assign(cond, read_cond_selector(it));
        }
        else if (c == ':') {
          let pseudo = read_pseudo(it);
          if (pseudo.selector) cond.styles.push(pseudo);
        }
        else if (c == '@' && !read_line(it, true).includes(':')) {
          cond.styles.push(read_cond(it));
        }
        else if (!is.white_space(c)) {
          let rule = read_rule(it, extra);
          if (rule.property) cond.styles.push(rule);
          if (it.curr() == '}') break;
        }
        it.next();
      }
      return cond;
    }

    function read_variable(extra, name) {
      let rule = '';
      if (extra && extra.get_variable) {
        rule = extra.get_variable(name);
      }
      return rule;
    }

    function evaluate_value(values, extra) {
      values.forEach && values.forEach(v => {
        if (v.type == 'text' && v.value) {
          let vars = parse$9(v.value);
          v.value = vars.reduce((ret, p) => {
            let rule = '', other = '', parsed;
            rule = read_variable(extra, p.name);
            if (!rule && p.fallback) {
              p.fallback.every(n => {
                other = read_variable(extra, n.name);
                if (other) {
                  rule = other;
                  return false;
                }
              });
            }
            try {
              parsed = parse$6(rule, extra);
            } catch (e) { }
            if (parsed) {
              ret.push.apply(ret, parsed);
            }
            return ret;
          }, []);
        }
        if (v.type == 'func' && v.arguments) {
          v.arguments.forEach(arg => {
            evaluate_value(arg, extra);
          });
        }
      });
    }

    function read_var(it, extra) {
      it.next();
      let groups = read_value(it) || [];
      return groups.reduce((ret, group) => {
        evaluate_value(group, extra);
        let [token] = group;
        if (token.value && token.value.length) {
          ret.push(...token.value);
        }
        return ret;
      }, []);
    }

    function parse$6(input, extra) {
      const it = iterator(input);
      const Tokens = [];
      while (!it.end()) {
        let c = it.curr();
        if (is.white_space(c)) {
          it.next();
          continue;
        }
        else if (c == '/' && it.curr(1) == '*') {
          read_comments(it);
        }
        else if (c == ':') {
          let pseudo = read_pseudo(it, extra);
          if (pseudo.selector) Tokens.push(pseudo);
        }
        else if (c == '@' && read_word(it, true) === '@keyframes') {
          let keyframes = read_keyframes(it, extra);
          Tokens.push(keyframes);
        }
        else if (c == '@' && !read_line(it, true).includes(':')) {
          let cond = read_cond(it, extra);
          if (cond.name.length) Tokens.push(cond);
        }
        else if (c == '<') {
          skip_tag(it);
        }
        else if (!is.white_space(c)) {
          let rule = read_rule(it, extra);
          if (rule.property) Tokens.push(rule);
        }
        it.next();
      }
      return Tokens;
    }

    function parse_grid(size, GRID = 64) {
      const [min, max, total] = [1, GRID, GRID * GRID];

      let [x, y, z] = (size + '')
        .replace(/\s+/g, '')
        .replace(/[,，xX]+/g, 'x')
        .split('x')
        .map(n => parseInt(n));

      const max_xy = (x == 1 || y == 1) ? total : max;
      const max_z = (x == 1 && y == 1) ? total : min;

      const ret = {
        x: clamp(x || min, 1, max_xy),
        y: clamp(y || x || min, 1, max_xy),
        z: clamp(z || min, 1, max_z)
      };

      return Object.assign({}, ret, {
        count: ret.x * ret.y * ret.z,
        ratio: ret.x / ret.y
      });
    }

    function parse$5(input) {
      let scanOptions = {
        preserveLineBreak: true,
        ignoreInlineComment: true,
      };
      let iter = iterator$1(removeParens(scan(input, scanOptions)));
      let stack = [];
      let tokens = [];
      let identifier;
      let line;
      let result = {
        textures: [],
      };
      while (iter.next()) {
        let { curr, next } = iter.get();
        if (curr.isSymbol('{')) {
          if (!stack.length) {
            let name = joinToken$1(tokens);
            if (isIdentifier(name)) {
              identifier = name;
              tokens = [];
            } else {
              tokens.push(curr);
            }
          } else {
            tokens.push(curr);
          }
          stack.push('{');
        }
        else if (curr.isSymbol('}')) {
          stack.pop();
          if (!stack.length && identifier) {
            let value = joinToken$1(tokens);
            if (identifier && value.length) {
              if (identifier.startsWith('texture')) {
                result.textures.push({
                  name: identifier,
                  value
                });
              } else {
                result[identifier] = value;
              }
              tokens = [];
            }
            identifier = null;
          } else {
            tokens.push(curr);
          }
        }
        else {
          if (!is_empty(line) && line != curr.pos[1]) {
            tokens.push(lineBreak());
            line = null;
          }
          if (curr.isWord() && curr.value.startsWith('#')) {
            tokens.push(lineBreak());
            line = next.pos[1];
          }
          tokens.push(curr);
        }
      }

      if (is_empty(result.fragment)) {
        result.fragment = joinToken$1(tokens);
        result.textures = result.textures || [];
      }
      return result;
    }

    function isIdentifier(name) {
      return /^texture\w*$|^(fragment|vertex)$/.test(name);
    }

    function lineBreak() {
      return new Token({ type: 'LineBreak', value: '\n' });
    }

    function removeParens(tokens) {
      let head = tokens[0];
      let last = tokens[tokens.length - 1];
      while (head && head.isSymbol('(') && last && last.isSymbol(')')) {
        tokens = tokens.slice(1, tokens.length - 1);
        head = tokens[0];
        last = tokens[tokens.length - 1];
      }
      return tokens;
    }

    function joinToken$1(tokens) {
      return removeParens(tokens).map(n => n.value).join('');
    }

    const NS$1 = 'http://www.w3.org/2000/svg';
    const NSXLink$1 = 'http://www.w3.org/1999/xlink';

    function create_svg_url(svg, id) {
      let encoded = encodeURIComponent(svg) + (id ? `#${ id }` : '');
      return `url("data:image/svg+xml;utf8,${ encoded }")`;
    }

    function normalize_svg(input) {
      const xmlns = `xmlns="${ NS$1 }"`;
      const xmlnsXLink = `xmlns:xlink="${ NSXLink$1 }"`;
      if (!input.includes('<svg')) {
        input = `<svg ${ xmlns } ${ xmlnsXLink }>${ input }</svg>`;
      }
      if (!input.includes('xmlns')) {
        input = input.replace(/<svg([\s>])/, `<svg ${ xmlns } ${ xmlnsXLink }$1`);
      }
      return input;
    }

    const NS = 'http://www.w3.org/2000/svg';
    const NSXLink = 'http://www.w3.org/1999/xlink';
    const nextId$1 = next_id();

    class Tag {
      constructor(name, value = '') {
        if (!name) {
          throw new Error("Tag name is required");
        }
        this.name = name;
        this.body = [];
        this.attrs = {};
        if (this.isTextNode()) {
          this.body = value;
        }
      }
      isTextNode() {
        return this.name === 'text-node';
      }
      find(target) {
        let id = target.attrs.id;
        let name = target.name;
        if (Array.isArray(this.body) && id !== undefined) {
          return this.body.find(tag => tag.attrs.id === id && tag.name === name);
        }
      }
      append(tag) {
        if (!this.isTextNode()) {
          this.body.push(tag);
        }
      }
      merge(tag) {
        for (let [name, value] of Object.entries(tag.attrs)) {
          this.attrs[name] = value;
        }
        if (Array.isArray(tag.body)) {
          this.body.push(...tag.body);
        }
      }
      attr(name, value) {
        if (!this.isTextNode()) {
          if (value === undefined) {
            return this.attrs[name];
          }
          return this.attrs[name] = value;
        }
      }
      toString() {
        if (this.isTextNode()) {
          return removeQuotes(this.body);
        }
        let attrs = [''];
        let body = [];
        for (let [name, value] of Object.entries(this.attrs)) {
          value = removeQuotes(value);
          attrs.push(`${name}="${value}"`);
        }
        for (let tag of this.body) {
          body.push(tag.toString());
        }
        return `<${this.name}${attrs.join(' ')}>${body.join('')}</${this.name}>`;
      }
    }

    function composeStyleRule(name, value) {
      return `${name}:${value};`
    }

    function removeQuotes(text) {
      text = String(text);
      let double = text.startsWith('"') && text.endsWith('"');
      let single = text.startsWith("'") && text.endsWith("'");
      if (double || single) {
        return text.substring(1, text.length - 1);
      }
      return text;
    }

    function transformViewBox(token) {
      let viewBox = token.detail.value;
      let p = token.detail.padding || token.detail.expand;
      if (!viewBox.length) {
        return '';
      }
      let [x, y, w, h] = viewBox;
      if (p) {
        [x, y, w, h] = [x-p, x-p, w+p*2, h+p*2];
      }
      return `${x} ${y} ${w} ${h}`;
    }

    function generate$1(token, element, parent, root) {
      let inlineId;
      if (!element) {
        element = new Tag('root');
      }
      if (token.type === 'block') {
        // style tag
        if (token.name === 'style') {
          let el = new Tag('style');
          el.append(token.value);
          element.append(el);
        }
        // normal svg elements
        else {
          let el = new Tag(token.name);
          if (!root) {
            root = el;
            root.attr('xmlns', NS);
          }
          for (let block of token.value) {
            let id = generate$1(block, el, token, root);
            if (id) { inlineId = id; }
          }
          // generate id for inline block if no id is found
          if (token.inline) {
            let found = token.value.find(n => n.type === 'statement' && n.name === 'id');
            if (found) {
              inlineId = found.value;
            } else {
              inlineId = nextId$1(token.name);
              el.attr('id', inlineId);
            }
          }
          let existedTag = root.find(el);
          if (existedTag) {
            existedTag.merge(el);
          } else {
            element.append(el);
          }
        }
      }
      if (token.type === 'statement' && !token.variable) {
        if (token.name === 'content') {
          let text = new Tag('text-node', token.value);
          element.append(text);
        }
        // inline style
        else if (token.name.startsWith('style ')) {
          let name = (token.name.split('style ')[1] || '').trim();
          if (name.length) {
            let style = element.attr('style') || '';
            element.attr('style', style + composeStyleRule(name, token.value));
          }
        }
        else {
          let value = token.value;
          // handle inline block value
          if (value && value.type === 'block') {
            let id = generate$1(token.value, root, token, root);
            value = `url(#${id})`;
            if (token.name === 'xlink:href' || token.name === 'href') {
              value = `#${id}`;
            }
          }
          if (/viewBox/i.test(token.name)) {
            value = transformViewBox(token);
            if (value) {
              element.attr(token.name, value);
            }
          } else {
            element.attr(token.name, value);
          }
          if (token.name.includes('xlink:')) {
            root.attr('xmlns:xlink', NSXLink);
          }
        }
      }
      if (!parent) {
        return root.toString();
      }
      return inlineId;
    }

    function generate_svg(token) {
      return generate$1(token);
    }

    function parse$4(input) {
      let iter = iterator$1(scan(input));
      let ret = {};
      let matched = false;
      while (iter.next()) {
        let { prev, curr, next} = iter.get();
        let isUnit = matched
          && (curr.isWord() || curr.isSymbol())
          && prev && prev.isNumber()
          && !next;
        if (curr.isNumber()) {
          ret.value = Number(curr.value);
          matched = true;
        }
        else if (isUnit) {
          ret.unit = curr.value;
        } else {
          break;
        }
      }
      return ret;
    }

    function by_unit(fn) {
      return (...args) => {
        let units = [], values = [];
        for (let arg of args) {
          let { unit, value } = parse$4(arg);
          if (unit !== undefined) {
            units.push(unit);
          }
          if (value !== undefined) {
            values.push(value);
          }
        }
        let result = fn(...values);
        let unit = units.find(n => n !== undefined);
        if (unit === undefined) {
          return result;
        }
        if (Array.isArray(result)) {
          return result.map(n => n + unit);
        }
        return result + unit;
      }
    }

    function by_charcode(fn) {
      return (...args) => {
        let codes = args.map(n => String(n).charCodeAt(0));
        let result = fn(...codes);
        return Array.isArray(result)
          ? result.map(n => String.fromCharCode(n))
          : String.fromCharCode(result);
      }
    }

    /**
     * Based on the Shunting-yard algorithm.
     */


    const default_context = {
      'π': Math.PI,
      gcd: (a, b) => {
        while (b) [a, b] = [b, a % b];
        return a;
      }
    };

    const operator = {
      '^': 7,
      '*': 6, '/': 6, '÷': 6, '%': 6,
      '&': 5, '|': 5,
      '+': 4, '-': 4,
      '<': 3, '<<': 3,
      '>': 3, '>>': 3,
      '=': 3, '==': 3,
      '≤': 3, '<=': 3,
      '≥': 3, '>=': 3,
      '≠': 3, '!=': 3,
      '∧': 2, '&&': 2,
      '∨': 2, '||': 2,
      '(': 1 , ')': 1,
    };

    function calc(expr, context, repeat = []) {
      let stack = [];
      while (expr.length) {
        let { name, value, type } = expr.shift();
        if (type === 'variable') {
          let result = context[value];
          if (is_invalid_number(result)) {
            result = Math[value];
          }
          if (is_invalid_number(result)) {
            result = expand$1(value, context);
          }
          if (is_invalid_number(result)) {
            if (/^\-\D/.test(value)) {
              result = expand$1('-1' + value.substr(1), context);
            }
          }
          if (result === undefined) {
            result = 0;
          }
          if (typeof result !== 'number') {
            repeat.push(result);
            if (is_cycle(repeat)) {
              result = 0;
              repeat = [];
            } else {
              result = calc(infix_to_postfix(result), context, repeat);
            }
          }
          stack.push(result);
        }
        else if (type === 'function') {
          let negative = false;
          if (/^\-/.test(name)) {
            negative = true;
            name = name.substr(1);
          }
          let output = value.map(v => calc(v, context));
          let fns = name.split('.');
          let fname;
          while (fname = fns.pop()) {
            if (!fname) continue;
            let fn = context[fname] || Math[fname];
            output = (typeof fn === 'function')
              ? (Array.isArray(output) ? fn(...output) : fn(output))
              : 0;
          }
          if (negative) {
            output = -1 * output;
          }
          stack.push(output);
        } else {
          if (/\d+/.test(value)) stack.push(value);
          else {
            let right = stack.pop();
            let left = stack.pop();
            stack.push(compute(
              value, Number(left), Number(right)
            ));
          }
        }
      }
      return Number(stack[0]) || 0;
    }

    function get_tokens$1(input) {
      let expr = String(input);
      let tokens = [], num = '';

      for (let i = 0; i < expr.length; ++i) {
        let c = expr[i];
        if (operator[c]) {
          let last_token = last(tokens);
          if (c == '=' && last_token && /^[!<>=]$/.test(last_token.value)) {
            last_token.value += c;
          }
          else if (/^[|&<>]$/.test(c) && last_token && last_token.value == c) {
            last_token.value += c;
          }
          else if (c == '-' && expr[i - 1] == 'e') {
            num += c;
          }
          else if (!tokens.length && !num.length && /[+-]/.test(c)) {
            num += c;
          } else {
            let { type, value } = last_token || {};
            if (type == 'operator'
                && !num.length
                && /[^()]/.test(c)
                && /[^()]/.test(value)) {
              num += c;
            } else {
              if (num.length) {
                tokens.push({ type: 'number', value: num });
                num = '';
              }
              tokens.push({ type: 'operator', value: c });
            }
          }
        }
        else if (/\S/.test(c)) {
          if (c == ',') {
            tokens.push({ type: 'number', value: num });
            num = '';
            tokens.push({ type: 'comma', value: c });
          } else if (c == '!') {
            tokens.push({ type: 'number', value: num });
            tokens.push({ type: 'operator', value: c });
            num = '';
          } else {
            num += c;
          }
        }
      }

      if (num.length) {
        tokens.push({ type: 'number', value: num });
      }
      return tokens;
    }

    function infix_to_postfix(input) {
      let tokens = get_tokens$1(input);
      const op_stack = [], expr = [];

      for (let i = 0; i < tokens.length; ++i) {
        let { type, value } = tokens[i];
        let next = tokens[i + 1] || {};
        if (type == 'number') {
          if (next.value == '(' && /[^\d.\-]/.test(value)) {
            let func_body = '';
            let stack = [];
            let values = [];

            i += 1;
            while (tokens[i++] !== undefined) {
              let token = tokens[i];
              if (token === undefined) break;
              let c = token.value;
              if (c == ')') {
                if (!stack.length) break;
                stack.pop();
                func_body += c;
              }
              else {
                if (c == '(') stack.push(c);
                if (c == ',' && !stack.length) {
                  let arg = infix_to_postfix(func_body);
                  if (arg.length) values.push(arg);
                  func_body = '';
                } else {
                  func_body += c;
                }
              }
            }

            if (func_body.length) {
              values.push(infix_to_postfix(func_body));
            }

            expr.push({
              type: 'function',
              name: value,
              value: values
            });
          }
          else if (/[^\d.\-]/.test(value)) {
            expr.push({ type: 'variable', value });
          }
          else {
            expr.push({ type: 'number', value });
          }
        }

        else if (type == 'operator') {
          if (value == '(') {
            op_stack.push(value);
          }

          else if (value == ')') {
            while (op_stack.length && last(op_stack) != '(') {
              expr.push({ type: 'operator', value: op_stack.pop() });
            }
            op_stack.pop();
          }

          else {
            while (op_stack.length && operator[last(op_stack)] >= operator[value]) {
              let op = op_stack.pop();
              if (!/[()]/.test(op)) expr.push({ type: 'operator', value: op });
            }
            op_stack.push(value);
          }
        }
      }

      while (op_stack.length) {
        expr.push({ type: 'operator', value: op_stack.pop() });
      }

      return expr;
    }

    function compute(op, a, b) {
      switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '%': return a % b;
        case '|': return a | b;
        case '&': return a & b;
        case '<': return a < b;
        case '>': return a > b;
        case '^': return Math.pow(a, b);
        case '÷': case '/': return a / b;
        case '=': case '==': return a == b;
        case '≤': case '<=': return a <= b;
        case '≥': case '>=': return a >= b;
        case '≠': case '!=': return a != b;
        case '∧': case '&&': return a && b;
        case '∨': case '||': return a || b;
        case '<<': return a << b;
        case '>>': return a >> b;
      }
    }

    function expand$1(value, context) {
      let [_, num, variable] = value.match(/([\d.\-]+)(.*)/) || [];
      let v = context[variable];
      if (v === undefined) {
        return v;
      }
      if (typeof v === 'number') {
        return Number(num) * v;
      } else {
        return num * calc(infix_to_postfix(v), context);
      }
    }

    function is_cycle(array) {
      return (array[0] == array[2] && array[1] == array[3]);
    }

    function calc$1(input, context) {
      const expr = infix_to_postfix(input);
      return calc(expr, Object.assign({}, default_context, context));
    }

    class CacheValue {
      constructor() {
        this.cache = {};
      }
      clear() {
        this.cache = {};
      }
      set(input, value) {
        if (is_nil(input)) {
          return '';
        }
        let key = this.getKey(input);
        return this.cache[key] = value;
      }
      get(input) {
        let key = this.getKey(input);
        return this.cache[key];
      }
      getKey(input) {
        return (typeof input === 'string')
          ? hash(input)
          : hash(JSON.stringify(input));
      }
    }

    var Cache = new CacheValue();

    function memo(prefix, fn) {
      return (...args) => {
        let key = prefix + args.join('-');    return Cache.get(key) || Cache.set(key, fn(...args));
      }
    }

    function Type(type, value) {
      return { type, value };
    }

    function get_tokens(input) {
      let expr = String(input);
      let tokens = [], stack = [];
      if (!expr.startsWith('[') || !expr.endsWith(']')) {
        return tokens;
      }

      for (let i = 1; i < expr.length - 1; ++i) {
        let c = expr[i];
        if (c == '-' && expr[i - 1] == '-') {
          continue;
        }
        if (c == '-') {
          stack.push(c);
          continue;
        }
        if (last(stack) == '-') {
          stack.pop();
          let from = stack.pop();
          tokens.push(from
            ? Type('range', [ from, c ])
            : Type('char', c)
          );
          continue;
        }
        if (stack.length) {
          tokens.push(Type('char', stack.pop()));
        }
        stack.push(c);
      }
      if (stack.length) {
        tokens.push(Type('char', stack.pop()));
      }
      return tokens;
    }

    const build_range = memo('build_range', (input) => {
      let tokens = get_tokens(input);
      return flat_map(tokens, ({ type, value }) => {
        if (type == 'char') return value;
        let [ from, to ] = value;
        let reverse = false;
        if (from > to) {
          [from, to] = [ to, from ];
          reverse = true;
        }
        let result = by_charcode(range)(from, to);
        if (reverse) result.reverse();
        return result;
      });
    });

    function expand(fn) {
      return (...args) => fn(...flat_map(args, n =>
        String(n).startsWith('[') ? build_range(n) : n
      ));
    }

    class Node {
      constructor(data) {
        this.prev = this.next = null;
        this.data = data;
      }
    }

    class Stack {
      constructor(limit = 20) {
        this._limit = limit;
        this._size = 0;
      }
      push(data) {
        if (this._size >= this._limit) {
          this.root = this.root.next;
          this.root.prev = null;
        }
        let node = new Node(data);
        if (!this.root) {
          this.root = this.tail = node;
        } else {
          node.prev = this.tail;
          this.tail.next = node;
          this.tail = node;
        }
        this._size++;
      }
      last(n = 1) {
        let node = this.tail;
        while (--n) {
          if (!node.prev) break;
          node = node.prev;
        }
        return node.data;
      }
    }

    /**
     * Improved noise by Ken Perlin
     * Translated from: https://mrl.nyu.edu/~perlin/noise/
     */


    class Perlin {
      constructor(shuffle) {
        this.p = duplicate(shuffle([
          151,160,137,91,90,15,
          131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
          190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
          88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,
          77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
          102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,
          135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,
          5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
          223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,
          129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,
          251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,
          49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,
          138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
        ]));
      }

      // Convert LO 4 bits of hash code into 12 gradient directions.
      grad(hash, x, y, z) {
        let h = hash & 15,
            u = h < 8 ? x : y,
            v = h < 4 ? y : h == 12 || h == 14 ? x : z;
        return ((h&1) == 0 ? u : -u) + ((h&2) == 0 ? v : -v);
      }

      noise(x, y, z) {
        let { p, grad } = this;
        // Find unit cube that contains point.
        let [X, Y, Z] = [x, y, z].map(n => Math.floor(n) & 255);
        // Find relative x, y, z of point in cube.
        [x, y, z] = [x, y, z].map(n => n - Math.floor(n));
        // Compute fade curves for each of x, y, z.
        let [u, v, w] = [x, y, z].map(n => n * n * n * (n * (n * 6 - 15) + 10));
        // hash coordinates of the 8 cube corners.
        let A = p[X  ]+Y, AA = p[A]+Z, AB = p[A+1]+Z,
            B = p[X+1]+Y, BA = p[B]+Z, BB = p[B+1]+Z;
        // And add blended results from 8 corners of cube.
        return lerp(w, lerp(v, lerp(u, grad(p[AA  ], x  , y  , z   ),
                                       grad(p[BA  ], x-1, y  , z   )),
                               lerp(u, grad(p[AB  ], x  , y-1, z   ),
                                       grad(p[BB  ], x-1, y-1, z   ))),
                       lerp(v, lerp(u, grad(p[AA+1], x  , y  , z-1 ),
                                       grad(p[BA+1], x-1, y  , z-1 )),
                               lerp(u, grad(p[AB+1], x  , y-1, z-1 ),
                                       grad(p[BB+1], x-1, y-1, z-1 ))));
      }
    }

    function get_named_arguments(args, names) {
      let result = {};
      let order = true;
      for (let i = 0; i < args.length; ++i) {
        let arg = args[i];
        let arg_name = names[i];
        if (/=/.test(arg)) {
          let [name, value] = parse$8(arg, { symbol: '=', noSpace: true });
          if (value !== undefined) {
            if (names.includes(name)) {
              result[name] = value;
            }
            // ignore the rest unnamed arguments
            order = false;
          } else {
            result[arg_name] = arg;
          }
        } else if (order) {
          result[arg_name] = arg;
        }
      }
      return result;
    }

    function parse$3(input) {
      let iter = iterator$1(scan(input));
      let commands = {};
      let tokens = [];
      let name;
      let negative = false;
      while (iter.next()) {
        let { prev, curr, next } = iter.get();
        if (curr.isSymbol(':') && !name) {
          name = joinTokens(tokens);
          tokens = [];
        } else if (curr.isSymbol(';') && name) {
          commands[name] = transformNegative(name, joinTokens(tokens), negative);
          tokens = [];
          name = null;
          negative = false;
        } else if (!curr.isSymbol(';')) {
          let prevMinus = prev && prev.isSymbol('-');
          let nextMinus = next && next.isSymbol('-');
          let currMinus = curr.isSymbol('-');
          if (!name && !tokens.length && currMinus && !prevMinus && !nextMinus) {
            if (next && next.isSymbol(':')) {
              tokens.push(curr);
            } else {
              negative = true;
            }
          } else {
            tokens.push(curr);
          }
        }
      }
      if (tokens.length && name) {
        commands[name] = transformNegative(name, joinTokens(tokens), negative);
      }
      return commands;
    }

    function transformNegative(name, value, negative) {
      let excludes = ['fill-rule', 'fill'];
      if (excludes.includes(name)) {
        return value;
      }
      return negative ? `-1 * (${ value })` : value;
    }

    function joinTokens(tokens) {
      return tokens.map(n => n.value).join('');
    }

    const keywords = ['auto', 'reverse'];
    const units = ['deg', 'rad', 'grad', 'turn'];

    function parse$2(input) {
      let iter = iterator$1(scan(input));
      let matched = false;
      let unit = '';
      let ret = {
        direction: '',
        angle: '',
      };
      while (iter.next()) {
        let { prev, curr, next } = iter.get();
        if (curr.isWord() && keywords.includes(curr.value)) {
          ret.direction = curr.value;
          matched = true;
        }
        else if (curr.isNumber()) {
          ret.angle = Number(curr.value);
          matched = true;
        }
        else if (curr.isWord() && prev && prev.isNumber() && units.includes(curr.value)) {
          unit = curr.value;
        }
        else if (curr.isSpace() && ret.direction !== '' && ret.angle !== '') {
          break;
        }
      }
      if (!matched) {
        ret.direction = 'auto';
      }
      return normalizeAngle(ret, unit);
    }

    function normalizeAngle(input, unit) {
      let { angle } = input;
      if (angle === '') {
        angle = 0;
      }
      if (unit === 'rad') {
        angle /= (Math.PI / 180);
      }
      if (unit === 'grad') {
        angle *= .9;
      }
      if (unit === 'turn') {
        angle *= 360;
      }
      return Object.assign({}, input, { angle });
    }

    const { cos, sin, abs, atan2, PI } = Math;

    const _ = make_tag_function(c => {
      return create_shape_points(
        parse$3(c), {min: 3, max: 3600}
      );
    });

    const shapes = {
      circle: () => _`
    split: 180;
    scale: .99
  `,

      triangle: () => _`
    rotate: 30;
    scale: 1.1;
    move: 0 .2
  `,

      pentagon: () => _`
    split: 5;
    rotate: 54
  `,

      hexagon: () => _`
    split: 6;
    rotate: 30;
    scale: .98
  `,

      octagon: () => _`
    split: 8;
    rotat: 22.5;
    scale: .99
  `,

      star: () => _`
    split: 10;
    r: cos(5t);
    rotate: -18;
    scale: .99
  `,

      infinity: () => _`
    split: 180;
    scale: .99;
    x: cos(t)*.99 / (sin(t)^2 + 1);
    y: x * sin(t)
  `,

      heart: () => _`
    split: 180;
    rotate: 180;
    a: cos(t)*13/18 - cos(2t)*5/18;
    b: cos(3t)/18 + cos(4t)/18;
    x: (.75 * sin(t)^3) * 1.2;
    y: (a - b + .2) * -1.1
  `,

      bean: () => _`
    split: 180;
    r: sin(t)^3 + cos(t)^3;
    move: -.35 .35;
  `,

      bicorn: () => _`
    split: 180;
    x: cos(t);
    y: sin(t)^2 / (2 + sin(t)) - .5
  `,

      drop: () => _`
    split: 180;
    rotate: 90;
    scale: .95;
    x: sin(t);
    y: (1 + sin(t)) * cos(t) / 1.6
  `,

      fish: () => _`
    split: 240;
    x: cos(t) - sin(t)^2 / sqrt(2) - .04;
    y: sin(2t)/2
  `,

      whale: () => _`
    split: 240;
    rotate: 180;
    R: 3.4 * (sin(t)^2 - .5) * cos(t);
    x: cos(t) * R + .75;
    y: sin(t) * R * 1.2
  `,

      windmill:  () => _`
    split: 18;
    R: seq(.618, 1, 0);
    T: seq(t-.55, t, t);
    x: R * cos(T);
    y: R * sin(T)
  `,

      vase: () => _`
    split: 240;
    scale: .3;
    x: sin(4t) + sin(t) * 1.4;
    y: cos(t) + cos(t) * 4.8 + .3
  `,

      clover: (k = 3) => {
        k = clamp(k, 3, 5);
        if (k == 4) k = 2;
        return _`
      split: 240;
      r: cos(${k}t);
      scale: .98
    `;
      },

      hypocycloid: (k = 3) => {
        k = clamp(k, 3, 5);
        let scale = [0, 0, 0, .34, .25, .19][k];
        return _`
      split: 240;
      scale: ${scale};
      k: ${k};
      x: (k-1)*cos(t) + cos((k-1)*t);
      y: (k-1)*sin(t) - sin((k-1)*t)
    `;
      },

      bud: (k = 3) => {
        k = clamp(k, 3, 10);
        return _`
      split: 240;
      scale: .8;
      r: 1 + .2 * cos(${k}t)
    `;
      },
    };

    class Point {
      constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.extra = angle;
      }
      valueOf() {
        return this.x + ' ' + this.y;
      }
      toString() {
        return this.valueOf();
      }
    }

    function create_polygon_points(option, fn) {
      if (typeof arguments[0] == 'function') {
        fn = option;
        option = {};
      }

      if (!fn) {
        fn = t => [ cos(t), sin(t) ];
      }

      let split = option.split || 180;
      let turn = option.turn || 1;
      let frame = option.frame;
      let fill = option['fill'] || option['fill-rule'];
      let direction = parse$2(option['direction'] || option['dir'] || '');
      let unit = option.unit;

      let rad = (PI * 2) * turn / split;
      let points = [];
      let first_point, first_point2;

      let factor = (option.scale === undefined) ? 1 : option.scale;
      let add = ([x1, y1, dx = 0, dy = 0]) => {
        if (x1 == 'evenodd' || x1 == 'nonzero') {
          return points.push(new Point(x1, '', ''));
        }
        let [x, y] = scale$1(x1, -y1, factor);
        let [dx1, dy2] = scale$1(dx, -dy, factor);
        let angle = calc_angle(x, y, dx1, dy2, direction);
        if (unit !== undefined && unit !== '%') {
          if (unit !== 'none') {
            x += unit;
            y += unit;
          }
        } else {
          x = (x + 1) * 50 + '%';
          y = (y + 1) * 50 + '%';
        }
        points.push(new Point(x, y, angle));
      };

      if (fill == 'nonzero' || fill == 'evenodd') {
        add([fill, '', '']);
      }

      for (let i = 0; i < split; ++i) {
        let t = rad * i;
        let point = fn(t, i);
        if (!i) first_point = point;
        add(point);
      }

      if (frame !== undefined) {
        add(first_point);
        let w = frame / 100;
        if (turn > 1) w *= 2;
        if (w == 0) w = .002;
        for (let i = 0; i < split; ++i) {
          let t = -rad * i;
          let [x, y, dx = 0, dy = 0] = fn(t, i);
          let theta = atan2(y + dy, x - dx);
          let point = [
            x - w * cos(theta),
            y - w * sin(theta)
          ];
          if (!i) first_point2 = point;
          add(point);
        }
        add(first_point2);
        add(first_point);
      }

      return points;
    }

    function calc_angle(x, y, dx, dy, option) {
      let base = atan2(y + dy, x - dx) * 180 / PI;
      if (option.direction === 'reverse') {
        base -= 180;
      }
      if (!option.direction) {
        base = 90;
      }
      if (option.angle) {
        base += option.angle;
      }
      return base;
    }

    function rotate(x, y, deg) {
      let rad = -PI / 180 * deg;
      return [
        x * cos(rad) - y * sin(rad),
        y * cos(rad) + x * sin(rad)
      ];
    }

    function translate(x, y, offset) {
      let [dx, dy = dx] = parse$8(offset).map(Number);
      return [
        x + (dx || 0),
        y - (dy || 0),
        dx,
        dy
      ];
    }

    function scale$1(x, y, factor) {
      let [fx, fy = fx] = parse$8(factor).map(Number);
      return [
        x * fx,
        y * fy
      ];
    }

    function create_shape_points(props, {min, max}) {
      let split = clamp(parseInt(props.vertices || props.points || props.split) || 0, min, max);
      let px = is_empty(props.x) ? 'cos(t)' : props.x;
      let py = is_empty(props.y) ? 'sin(t)' : props.y;
      let pr = is_empty(props.r) ? ''       : props.r;

      let { unit, value } = parse$4(pr);
      if (unit && !props[unit] && unit !== 't') {
        if (is_empty(props.unit)) {
          props.unit = unit;
        }
        pr = props.r = value;
      }

      if (props.degree) {
        props.rotate = props.degree;
      }

      if (props.origin) {
        props.move = props.origin;
      }

      let option = Object.assign({}, props, { split });

      return create_polygon_points(option, (t, i) => {
        let context = Object.assign({}, props, {
          't': t,
          'θ': t,
          'i': (i + 1),
          seq(...list) {
            if (!list.length) return '';
            return list[i % list.length];
          },
          range(a, b = 0) {
            a = Number(a) || 0;
            b = Number(b) || 0;
            if (a > b) [a, b] = [b, a];
            let step = abs(b - a) / (split - 1);
            return a + step * i;
          }
        });
        let x = calc$1(px, context);
        let y = calc$1(py, context);
        let dx = 0;
        let dy = 0;
        if (pr) {
          let r = calc$1(pr, context);
          if (r == 0) {
            r = .00001;
          }
          x = r * cos(t);
          y = r * sin(t);
        }
        if (props.rotate) {
          [x, y] = rotate(x, y, Number(props.rotate) || 0);
        }
        if (props.move) {
          [x, y, dx, dy] = translate(x, y, props.move);
        }
        return [x, y, dx, dy];
      });
    }

    const commands = 'MmLlHhVvCcSsQqTtAaZz';
    const relatives = 'mlhvcsqtaz';

    function parse$1(input) {
      let iter = iterator$1(scan(input));
      let temp = {};
      let result = {
        commands: [],
        valid: true
      };
      while (iter.next()) {
        let { curr } = iter.get();
        if (curr.isSpace() || curr.isSymbol(',')) {
          continue;
        }
        if (curr.isWord()) {
          if (temp.name) {
            result.commands.push(temp);
            temp = {};
          }
          temp.name = curr.value;
          temp.value = [];
          if (!commands.includes(curr.value)) {
            temp.type = 'unknown';
            result.valid = false;
          } else if (relatives.includes(curr.value)) {
            temp.type = 'relative';
          } else {
            temp.type = 'absolute';
          }
        } else if (temp.value) {
          let value = curr.value;
          if (curr.isNumber()) {
            value = Number(curr.value);
          }
          temp.value.push(value);
        } else if (!temp.name) {
          result.valid = false;
        }
      }
      if (temp.name) {
        result.commands.push(temp);
      }
      return result;
    }

    const uniform_time = {
      'name': 'cssd-uniform-time',
      'animation-name': 'cssd-uniform-time-animation',
      'animation-duration': 31536000000, /* one year in ms */
      'animation-iteration-count': 'infinite',
      'animation-delay': '0s',
      'animation-direction': 'normal',
      'animation-fill-mode': 'none',
      'animation-play-state': 'running',
      'animation-timing-function': 'linear',
    };

    uniform_time['animation'] = `
  ${ uniform_time['animation-duration'] }ms
  ${ uniform_time['animation-timing-function'] }
  ${ uniform_time['animation-delay'] }
  ${ uniform_time['animation-iteration-count'] }
  ${ uniform_time['animation-name'] }
`;

    const uniform_mousex = {
      name: 'cssd-uniform-mousex',
    };

    const uniform_mousey = {
      name: 'cssd-uniform-mousey',
    };

    const uniform_width = {
      name: 'cssd-uniform-width',
    };

    const uniform_height = {
      name: 'cssd-uniform-height',
    };

    var Uniforms = /*#__PURE__*/Object.freeze({
        __proto__: null,
        uniform_height: uniform_height,
        uniform_mousex: uniform_mousex,
        uniform_mousey: uniform_mousey,
        uniform_time: uniform_time,
        uniform_width: uniform_width
    });

    function make_sequence(c) {
      return lazy((_, n, ...actions) => {
        if (!actions || !n) return '';
        let count = get_value(n());
        let evaluated = count;
        if (/\D/.test(count) && !/\d+[x-]\d+/.test(count)) {
          evaluated = calc$1(count);
          if (evaluated === 0) {
            evaluated = count;
          }
        }
        let signature = Math.random();
        return sequence(
          evaluated,
          (...args) => {
            return actions.map(action => {
              return get_value(action(...args, signature))
            }).join(',');
          }
        ).join(c);
      });
    }

    function push_stack(context, name, value) {
      if (!context[name]) context[name] = new Stack();
      context[name].push(value);
      return value;
    }

    function flip_value(num) {
      return -1 * num;
    }

    function map2d(value, min, max, amp = 1) {
      let dimention = 2;
      let v = Math.sqrt(dimention / 4) * amp;
      let [ma, mb] = [-v, v];
      return lerp((value - ma) / (mb - ma), min * amp, max * amp);
    }

    function calc_with(base) {
      return v => {
        if (is_empty(v) || is_empty(base)) {
          return base;
        }
        if (/^[+*-\/%][.\d\s]/.test(v)) {
          let op = v[0];
          let num = Number(v.substr(1).trim()) || 0;
          switch (op) {
            case '+': return base + num;
            case '-': return base - num;
            case '*': return base * num;
            case '/': return base / num;
            case '%': return base % num;
          }
        }
        else if (/[+*-\/%]$/.test(v)) {
          let op = v.substr(-1);
          let num = Number(v.substr(0, v.length - 1).trim()) || 0;
          switch (op) {
            case '+': return num + base;
            case '-': return num - base;
            case '*': return num * base;
            case '/': return num / base;
            case '%': return num % base;
          }
        }
        return base + (Number(v) || 0);
      }
    }

    const Expose = add_alias({

      i({ count }) {
        return calc_with(count);
      },

      y({ y }) {
        return calc_with(y);
      },

      x({ x }) {
        return calc_with(x);
      },

      z({ z }) {
        return calc_with(z);
      },

      I({ grid }) {
        return calc_with(grid.count);
      },

      Y({ grid }) {
        return calc_with(grid.y);
      },

      X({ grid }) {
        return calc_with(grid.x);
      },

      Z({ grid }) {
        return calc_with(grid.z);
      },

      id({ x, y, z }) {
        return _ => cell_id(x, y, z);
      },

      dx({ x, grid }) {
        return n => {
          n = Number(n) || 0;
          return x - .5 - n - grid.x / 2;
        }
      },

      dy({ y, grid }) {
        return n => {
          n = Number(n) || 0;
          return y - .5 - n - grid.y / 2;
        }
      },

      n({ extra }) {
        let lastExtra = last(extra);
        return lastExtra ? calc_with(lastExtra[0]) : '@n';
      },

      nx({ extra }) {
        let lastExtra = last(extra);
        return lastExtra ? calc_with(lastExtra[1]) : '@nx';
      },

      ny({ extra }) {
        let lastExtra = last(extra);
        return lastExtra ? calc_with(lastExtra[2]) : '@ny';
      },

      N({ extra }) {
        let lastExtra = last(extra);
        return lastExtra ? calc_with(lastExtra[3]) : '@N';
      },

      m: make_sequence(','),

      M: make_sequence(' '),

      µ: make_sequence(''),

      p({ context, pick }) {
        return expand((...args) => {
          if (!args.length) {
            args = context.last_pick_args || [];
          }
          let picked = pick(args);
          context.last_pick_args = args;
          return push_stack(context, 'last_pick', picked);
        });
      },

      P({ context, pick, position }) {
        let counter = 'P-counter' + position;
        return expand((...args) => {
          let normal = true;
          if (!args.length) {
            args = context.last_pick_args || [];
            normal = false;
          }
          let stack = context.last_pick;
          let last = stack ? stack.last(1) : '';
          if (normal) {
            if (!context[counter]) {
              context[counter] = {};
            }
            last = context[counter].last_pick;
          }
          if (args.length > 1) {
            let i = args.findIndex(n => n === last);
            if (i !== -1) {
              args.splice(i, 1);
            }
          }
          let picked = pick(args);
          context.last_pick_args = args;
          if (normal) {
            context[counter].last_pick = picked;
          }
          return push_stack(context, 'last_pick', picked);
        });
      },

      pl({ context, extra, position }) {
        let lastExtra = last(extra);
        let sig = lastExtra ? last(lastExtra) : '';
        let counter = 'pl-counter' + position + sig;
        return expand((...args) => {
          if (!context[counter]) context[counter] = 0;
          context[counter] += 1;
          let max = args.length;
          let idx = lastExtra && lastExtra[6];
          if (is_nil(idx)) idx = context[counter];
          let pos = (idx - 1) % max;
          let value = args[pos];
          return push_stack(context, 'last_pick', value);
        });
      },

      pr({ context, extra, position }) {
        let lastExtra = last(extra);
        let sig = lastExtra ? last(lastExtra) : '';
        let counter = 'pr-counter' + position + sig;
        return expand((...args) => {
          if (!context[counter]) context[counter] = 0;
          context[counter] += 1;
          let max = args.length;
          let idx = lastExtra && lastExtra[6];
          if (is_nil(idx)) idx = context[counter];
          let pos = (idx - 1) % max;
          let value = args[max - pos - 1];
          return push_stack(context, 'last_pick', value);
        });
      },

      pd({ context, extra, position, shuffle }) {
        let lastExtra = last(extra);
        let sig = lastExtra ? last(lastExtra) : '';
        let counter = 'pd-counter' + position  + sig;
        let values = 'pd-values' + position + sig;    return expand((...args) => {
          if (!context[counter]) context[counter] = 0;
          context[counter] += 1;
          if (!context[values]) {
            context[values] = shuffle(args || []);
          }
          let max = args.length;
          let idx = lastExtra && lastExtra[6];
          if (is_nil(idx)) idx = context[counter];
          let pos = (idx - 1) % max;
          let value = context[values][pos];
          return push_stack(context, 'last_pick', value);
        });
      },

      lp({ context }) {
        return (n = 1) => {
          let stack = context.last_pick;
          return stack ? stack.last(n) : '';
        };
      },

      r({ context, rand }) {
        return (...args) => {
          let transform = args.every(is_letter)
            ? by_charcode
            : by_unit;
          let value = transform(rand)(...args);
          return push_stack(context, 'last_rand', value);
        };
      },

      rn({ x, y, context, position, grid, extra, shuffle }) {
        let counter = 'noise-2d' + position;
        let [ni, nx, ny, nm, NX, NY] = last(extra) || [];
        let isSeqContext = (ni && nm);
        return (...args) => {
          let {from = 0, to = from, frequency = 1, amplitude = 1} = get_named_arguments(args, [
            'from', 'to', 'frequency', 'amplitude'
          ]);

          if (args.length == 1) {
            [from, to] = [0, from];
          }
          if (!context[counter]) {
            context[counter] = new Perlin(shuffle);
          }
          frequency = clamp(frequency, 0, Infinity);
          amplitude = clamp(amplitude, 0, Infinity);
          let transform = [from, to].every(is_letter) ? by_charcode : by_unit;
          let t = isSeqContext
            ? context[counter].noise((nx - 1)/NX * frequency, (ny - 1)/NY * frequency, 0)
            : context[counter].noise((x - 1)/grid.x * frequency, (y - 1)/grid.y * frequency, 0);
          let fn = transform((from, to) => map2d(t * amplitude, from, to, amplitude));
          let value = fn(from, to);
          return push_stack(context, 'last_rand', value);
        };
      },

      lr({ context }) {
        return (n = 1) => {
          let stack = context.last_rand;
          return stack ? stack.last(n) : '';
        };
      },

      noise({ context, grid, position, shuffle, ...rest }) {
        let vars = {
          i: rest.count, I: grid.count,
          x: rest.x, X: grid.x,
          y: rest.y, Y: grid.y,
          z: rest.z, Z: grid.z,
        };
        return (x, y, z = 0) => {
          let counter = 'raw-noise-2d' + position;
          if (!context[counter]) {
            context[counter] = new Perlin(shuffle);
          }
          return context[counter].noise(
            calc$1(x, vars),
            calc$1(y, vars),
            calc$1(z, vars)
          );
        };
      },

      stripe() {
        return (...input) => {
          let colors = input.map(get_value);
          let max = colors.length;
          let default_count = 0;
          let custom_sizes = [];
          let prev;
          if (!max) {
            return '';
          }
          colors.forEach(step => {
            let [_, size] = parse$8(step);
            if (size !== undefined) custom_sizes.push(size);
            else default_count += 1;
          });
          let default_size = custom_sizes.length
            ? `(100% - ${custom_sizes.join(' - ')}) / ${default_count}`
            : `100% / ${max}`;
          return colors.map((step, i) => {
            if (custom_sizes.length) {
              let [color, size] = parse$8(step);
              let prefix = prev ? (prev + ' + ') : '';
              prev = prefix + (size !== undefined ? size : default_size);
              return `${color} 0 calc(${ prev })`
            }
            return `${step} 0 ${100 / max * (i + 1)}%`
          })
          .join(',');
        }
      },

      calc() {
        return value => calc$1(get_value(value));
      },

      hex() {
        return value => parseInt(get_value(value)).toString(16);
      },

      svg: lazy((_, ...args) => {
        let value = args.map(input => get_value(input())).join(',');
        if (!value.startsWith('<')) {
          let parsed = parse$7(value);
          value = generate_svg(parsed);
        }
        let svg = normalize_svg(value);
        return create_svg_url(svg);
      }),

      Svg: lazy((_, ...args) => {
        let value = args.map(input => get_value(input())).join(',');
        if (!value.startsWith('<')) {
          let parsed = parse$7(value);
          value = generate_svg(parsed);
        }
        return normalize_svg(value);
      }),

      filter: lazy((upstream, ...args) => {
        let values = args.map(input => get_value(input()));
        let value = values.join(',');
        let id = unique_id('filter-');
        // shorthand
        if (values.every(n => /^[\d.]/.test(n) || (/^(\w+)/.test(n) && !/[{}<>]/.test(n)))) {
          let { frequency, scale = 1, octave, seed = upstream.seed, blur, erode, dilate } = get_named_arguments(values, [
            'frequency', 'scale', 'octave', 'seed', 'blur', 'erode', 'dilate'
          ]);
          value = `
        x: -20%;
        y: -20%;
        width: 140%;
        height: 140%;
      `;
          if (!is_nil(dilate)) {
            value += `
          feMorphology {
            operator: dilate;
            radius: ${dilate};
          }
        `;
          }
          if (!is_nil(erode)) {
            value += `
          feMorphology {
            operator: erode;
            radius: ${erode};
          }
        `;
          }
          if (!is_nil(blur)) {
            value += `
          feGaussianBlur {
            stdDeviation: ${blur};
          }
        `;
          }
          if (!is_nil(frequency)) {
            let [bx, by = bx] = parse$8(frequency);
            octave = octave ? `numOctaves: ${octave};` : '';
            value += `
          feTurbulence {
            type: fractalNoise;
            baseFrequency: ${bx} ${by};
            seed: ${seed};
            ${octave}
          }
          feDisplacementMap {
            in: SourceGraphic;
            scale: ${scale};
          }
        `;
          }
        }
        // new svg syntax
        if (!value.startsWith('<')) {
          let parsed = parse$7(value, {
            type: 'block',
            name: 'filter'
          });
          value = generate_svg(parsed);
        }
        let svg = normalize_svg(value).replace(
          /<filter([\s>])/,
          `<filter id="${ id }"$1`
        );
        return create_svg_url(svg, id);
      }),

      'svg-pattern': lazy((_, ...args) => {
        let value = args.map(input => get_value(input())).join(',');
        let parsed = parse$7(`
      viewBox: 0 0 1 1;
      preserveAspectRatio: xMidYMid slice;
      rect {
        width, height: 100%;
        fill: defs pattern { ${ value } }
      }
    `);
        let svg = generate_svg(parsed);
        return create_svg_url(svg);
      }),

      var() {
        return value => `var(${ get_value(value) })`;
      },

      ut() {
        return value => `var(--${ uniform_time.name })`;
      },

      uw() {
        return value => `var(--${ uniform_width.name })`;
      },

      uh() {
        return value => `var(--${ uniform_height.name })`;
      },

      ux() {
        return value => `var(--${ uniform_mousex.name })`;
      },

      uy() {
        return value => `var(--${ uniform_mousey.name })`;
      },

      plot({ count, context, extra, position, grid }) {
        let key = 'offset-points' + position;
        let lastExtra = last(extra);
        return commands => {
          let [idx = count, _, __, max = grid.count] = lastExtra || [];
          if (!context[key]) {
            let config = parse$3(commands);
            delete config['fill'];
            delete config['fill-rule'];
            delete config['frame'];
            config.points = max;
            context[key] = create_shape_points(config, {min: 1, max: 65536});
          }
          return context[key][idx - 1];
        };
      },

      Plot({ count, context, extra, position, grid }) {
        let key = 'Offset-points' + position;
        let lastExtra = last(extra);
        return commands => {
          let [idx = count, _, __, max = grid.count] = lastExtra || [];
          if (!context[key]) {
            let config = parse$3(commands);
            delete config['fill'];
            delete config['fill-rule'];
            delete config['frame'];
            config.points = max;
            config.unit = config.unit || 'none';
            context[key] = create_shape_points(config, {min: 1, max: 65536});
          }
          return context[key][idx - 1];
        };
      },

      shape() {
        return memo('shape-function', (type = '', ...args) => {
          type = String(type).trim();
          let points = [];
          if (type.length) {
            if (typeof shapes[type] === 'function') {
              points = shapes[type](args);
            } else {
              let commands = type;
              let rest = args.join(',');
              if (rest.length) {
                commands = type + ',' + rest;
              }
              let config = parse$3(commands);
              points = create_shape_points(config, {min: 3, max: 3600});
            }
          }
          return `polygon(${points.join(',')})`;
        });
      },

      doodle() {
        return value => value;
      },

      shaders() {
        return value => value;
      },

      canvas() {
        return value => value;
      },

      pattern() {
        return value => value;
      },

      invert() {
        return commands => {
          let parsed = parse$1(commands);
          if (!parsed.valid) return commands;
          return parsed.commands.map(({ name, value }) => {
            switch (name) {
              case 'v': return 'h' + value.join(' ');
              case 'V': return 'H' + value.join(' ');
              case 'h': return 'v' + value.join(' ');
              case 'H': return 'V' + value.join(' ');
              default:  return name + value.join(' ');
            }
          }).join(' ');
        };
      },

      flipH() {
        return commands => {
          let parsed = parse$1(commands);
          if (!parsed.valid) return commands;
          return parsed.commands.map(({ name, value }) => {
            switch (name) {
              case 'h':
              case 'H': return name + value.map(flip_value).join(' ');
              default:  return name + value.join(' ');
            }
          }).join(' ');
        };
      },

      flipV() {
        return commands => {
          let parsed = parse$1(commands);
          if (!parsed.valid) return commands;
          return parsed.commands.map(({ name, value }) => {
            switch (name) {
              case 'v':
              case 'V': return name + value.map(flip_value).join(' ');
              default:  return name + value.join(' ');
            }
          }).join(' ');
        };
      },

      flip(...args) {
        let flipH = Expose.flipH(...args);
        let flipV = Expose.flipV(...args);
        return commands => {
          return flipV(flipH(commands));
        }
      },

      reverse() {
        return (...args) => {
          let commands = args.map(get_value);
          let parsed = parse$1(commands.join(','));
          if (parsed.valid) {
            let result = [];
            for (let i = parsed.commands.length - 1; i >= 0; --i) {
              let { name, value } = parsed.commands[i];
              result.push(name + value.join(' '));
            }
            return result.join(' ');
          }
          return commands.reverse();
        }
      },

      cycle() {
        return (...args) => {
          let list = [];
          let separator;
          if (args.length == 1) {
            separator = ' ';        list = parse$8(args[0], { symbol: separator });
          } else {
            separator = ',';
            list = parse$8(args.map(get_value).join(separator), { symbol: separator});
          }
          let size = list.length - 1;
          let result = [list.join(separator)];
          // Just ignore the performance
          for (let i = 0; i < size; ++i) {
            let item = list.pop();
            list.unshift(item);
            result.push(list.join(separator));
          }
          return result;
        }
      },

      mirror() {
        return (...args) => {
          for (let i = args.length - 1; i >= 0; --i) {
            args.push(args[i]);
          }
          return args;
        }
      },

      Mirror() {
        return (...args) => {
          for (let i = args.length - 2; i >= 0; --i) {
            args.push(args[i]);
          }
          return args;
        }
      },

      unicode() {
        return (...args) => {
          return args.map(code => String.fromCharCode(code));
        }
      },

    }, {

      'index': 'i',
      'col': 'x',
      'row': 'y',
      'depth': 'z',
      'rand': 'r',
      'pick': 'p',
      'pn':   'pl',
      'pnr':  'pr',

      // error prone
      'stripes': 'stripe',
      'strip':   'stripe',
      'patern':  'pattern',
      'flipv': 'flipV',
      'fliph': 'flipH',

      // legacy names, keep them before 1.0
      't': 'ut',
      'svg-filter': 'filter',
      'last-rand': 'lr',
      'last-pick': 'lp',
      'multiple': 'm',
      'multi': 'm',
      'rep': 'µ',
      'repeat': 'µ',
      'ms': 'M',
      's':  'I',
      'size': 'I',
      'sx': 'X',
      'size-x': 'X',
      'size-col': 'X',
      'max-col': 'X',
      'sy': 'Y',
      'size-y': 'Y',
      'size-row': 'Y',
      'max-row': 'Y',
      'sz': 'Z',
      'size-z': 'Z',
      'size-depth': 'Z',
      'pick-by-turn': 'pl',
      'pick-n': 'pl',
      'pick-d': 'pd',
      'offset': 'plot',
      'Offset': 'Plot',
      'point': 'plot',
      'Point': 'Plot',
      'paint': 'canvas',
    });

    const presets = {

     '4a0': [ 1682, 2378 ],
     '2a0': [ 1189, 1682 ],
      a0:   [ 841, 1189 ],
      a1:   [ 594, 841 ],
      a2:   [ 420, 594 ],
      a3:   [ 297, 420 ],
      a4:   [ 210, 297 ],
      a5:   [ 148, 210 ],
      a6:   [ 105, 148 ],
      a7:   [ 74, 105 ],
      a8:   [ 52, 74 ],
      a9:   [ 37, 52 ],
      a10:  [ 26, 37 ],

      b0:  [ 1000, 1414 ],
      b1:  [ 707, 1000 ],
      b2:  [ 500, 707 ],
      b3:  [ 353, 500 ],
      b4:  [ 250, 353 ],
      b5:  [ 176, 250 ],
      b6:  [ 125, 176 ],
      b7:  [ 88, 125 ],
      b8:  [ 62, 88 ],
      b9:  [ 44, 62 ],
      b10: [ 31, 44 ],
      b11: [ 22, 32 ],
      b12: [ 16, 22 ],

      c0:  [ 917, 1297 ],
      c1:  [ 648, 917 ],
      c2:  [ 458, 648 ],
      c3:  [ 324, 458 ],
      c4:  [ 229, 324 ],
      c5:  [ 162, 229 ],
      c6:  [ 114, 162 ],
      c7:  [ 81, 114 ],
      c8:  [ 57, 81 ],
      c9:  [ 40, 57 ],
      c10: [ 28, 40 ],
      c11: [ 22, 32 ],
      c12: [ 16, 22 ],

      d0: [ 764, 1064 ],
      d1: [ 532, 760 ],
      d2: [ 380, 528 ],
      d3: [ 264, 376 ],
      d4: [ 188, 260 ],
      d5: [ 130, 184 ],
      d6: [ 92, 126 ],

      letter:   [ 216, 279 ],
      postcard: [ 100, 148 ],
      poster:   [ 390, 540 ],
    };

    const modes = {
      portrait: 'p',
      pt: 'p',
      p: 'p',

      landscape: 'l',
      ls: 'l',
      l: 'l',
    };

    const unit = 'mm';

    function get_preset(name, mode) {
      name = String(name).toLowerCase();

      // Default to landscape mode
      let [h, w] = presets[name] || [];

      if (modes[mode] == 'p') {
        [w, h] = [h, w];
      }

      return [w, h].map(n => n + unit);
    }

    function is_preset(name) {
      return !!presets[name];
    }

    let all_props = [];

    function get_props(arg) {
      if (!all_props.length) {
        let props = new Set();
        if (typeof document !== 'undefined') {
          for (let n in document.head.style) {
            if (!n.startsWith('-')) {
              props.add(n.replace(/[A-Z]/g, '-$&').toLowerCase());
            }
          }
        }
        if (!props.has('grid-gap')) {
          props.add('grid-gap');
        }
        all_props = Array.from(props);
      }
      return (arg instanceof RegExp)
        ? all_props.filter(n => arg.test(n))
        : all_props;
    }

    function build_mapping(prefix) {
      let reg = new RegExp(`\\-?${ prefix }\\-?`);
      return get_props(reg)
        .map(n => n.replace(reg, ''))
        .reduce((obj, n) => { return obj[n] = n, obj }, {});
    }

    const props_webkit_mapping = build_mapping('webkit');
    const props_moz_mapping = build_mapping('moz');

    function prefixer(prop, rule) {
      if (props_webkit_mapping[prop]) {
        return `-webkit-${ rule } ${ rule }`;
      }
      else if (props_moz_mapping[prop]) {
        return `-moz-${ rule } ${ rule }`;
      }
      return rule;
    }

    const map_left_right = {
      center: '50%',
      left: '0%', right: '100%',
      top: '50%', bottom: '50%'
    };

    const map_top_bottom = {
      center: '50%',
      top: '0%', bottom: '100%',
      left: '50%', right: '50%',
    };

    var Property = add_alias({

      size(value, { is_special_selector, grid }) {
        let [w, h = w, ratio] = parse$8(value);
        if (is_preset(w)) {
          [w, h] = get_preset(w, h);
        }
        let styles = `
      width: ${ w };
      height: ${ h };
    `;
        if (w === 'auto' || h === 'auto') {
          if (ratio) {
            if (/^\(.+\)$/.test(ratio)) {
              ratio = ratio.substring(1, ratio.length - 1);
            } else if (!/^calc/.test(ratio)) {
              ratio = `calc(${ratio})`;
            }
            if (!is_special_selector) {
              styles += `aspect-ratio: ${ ratio };`;
            }
          }
          if (is_special_selector) {
            styles += `aspect-ratio: ${ ratio || grid.ratio };`;
          }
        }
        if (!is_special_selector) {
          styles += `
        --internal-cell-width: ${ w };
        --internal-cell-height: ${ h };
      `;
        }
        return styles;
      },

      place(value, { extra }) {
        let [left, top = '50%'] = parse$8(value);
        left = map_left_right[left] || left;
        top = map_top_bottom[top] || top;
        const cw = 'var(--internal-cell-width, 25%)';
        const ch = 'var(--internal-cell-height, 25%)';
        return `
      position: absolute;
      left: ${ left };
      top: ${ top };
      width: ${ cw };
      height: ${ ch };
      margin-left: calc(${ cw } / -2);
      margin-top: calc(${ ch } / -2);
      grid-area: unset;
      --plot-angle: ${ extra || 0 };
      rotate: ${ extra || 0 }deg;
    `;
      },

      grid(value, options) {
        let result = {
          clip: true,
        };
        if (/no\-*clip/i.test(value)) {
          result.clip = false;
          value = value.replace(/no\-*clip/i, '');
        }
        let groups = parse$8(value, {
          symbol: ['/', '+', '*', '|', '-'],
          noSpace: true,
          verbose: true
        });
        for (let { group, value } of groups) {
          if (group === '+') result.scale = value;
          if (group === '*') result.rotate = value;
          if (group === '/') {
            if (result.size === undefined) result.size = this.size(value, options);
            else result.fill = value;
          }
          if ((group === '|' || group == '-' || group == '') && !result.grid) {
            result.grid = parse_grid(value, options.max_grid);
            if (group === '|') {
              result.flexColumn = true;
            }
            if (group === '-') {
              result.flexRow = true;
            }
          }
        }
        return result;
      },

      gap(value) {
        return value;
      },

      seed(value) {
        return value;
      },

      shape: memo('shape-property', value => {
        let [type, ...args] = parse$8(value);
        if (typeof shapes[type] !== 'function') return '';
        let prop = 'clip-path';
        let points = shapes[type](...args);
        let rules = `${ prop }: polygon(${points.join(',')});`;
        return prefixer(prop, rules) + 'overflow: hidden;';
      }),

      use(rules) {
        if (rules.length > 2) {
          return rules;
        }
      },

      content(value) {
        return value;
      },

    }, {
      // legacy names.
      'place-cell': 'place',
      'offset': 'place',
      'position': 'place',
    });

    const literal = {
      even: n => !(n % 2),
      odd:  n => !!(n % 2),
    };

    /**
     * TODO: optimization
     */
    function nth(input, curr, max) {
      for (let i = 0; i <= max; ++i) {
        if (calc$1(input, { n: i }) == curr) {
          return true;
        }
      }
    }

    var Selector$1 = {

      at({ x, y }) {
        return (x1, y1) => (x == x1 && y == y1);
      },

      nth({ count, grid }) {
        return (...exprs) => exprs.some(expr =>
          literal[expr]
            ? literal[expr](count)
            : nth(expr, count, grid.count)
        );
      },

      row({ y, grid }) {
        return (...exprs) => exprs.some(expr =>
          literal[expr]
            ? literal[expr](y)
            : nth(expr, y, grid.y)
        );
      },

      col({ x, grid }) {
        return (...exprs) => exprs.some(expr =>
          literal[expr]
            ? literal[expr](x)
            : nth(expr, x, grid.x)
        );
      },

      even({ count, grid, x, y }) {
        return arg => literal.odd(x + y);
      },

      odd({ count, grid, x, y}) {
        return arg => literal.even(x + y);
      },

      random({ random, count, x, y, grid }) {
        return (ratio = .5) => {
          if (/\D/.test(ratio)) {
            return random() < calc$1('(' + ratio + ')', {
              x, X: grid.x,
              y, Y: grid.y,
              i: count, I: grid.count,
              random,
            });
          }
          return random() < ratio;
        }
      },

      match({ count, grid, x, y, random }) {
        return expr => {
          return !!calc$1('(' + expr + ')', {
            x, X: grid.x,
            y, Y: grid.y,
            i: count, I: grid.count,
            random,
          });
        }
      },

    };

    /*
    Copyright 2019 David Bau.
    Permission is hereby granted, free of charge, to any person obtaining
    a copy of this software and associated documentation files (the
    "Software"), to deal in the Software without restriction, including
    without limitation the rights to use, copy, modify, merge, publish,
    distribute, sublicense, and/or sell copies of the Software, and to
    permit persons to whom the Software is furnished to do so, subject to
    the following conditions:
    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
    */

    var global$1 = globalThis;
    var math = Math;
    var pool = [];

    //
    // The following constants are related to IEEE 754 limits.
    //

    var width = 256,        // each RC4 output is 0 <= x < 256
        chunks = 6,         // at least six RC4 outputs for each double
        digits = 52,        // there are 52 significant digits in a double
        rngname = 'random', // rngname: name for Math.random and Math.seedrandom
        startdenom = math.pow(width, chunks),
        significance = math.pow(2, digits),
        overflow = significance * 2,
        mask = width - 1,
        nodecrypto;         // node.js crypto module, initialized at the bottom.

    //
    // seedrandom()
    // This is the seedrandom function described above.
    //
    function seedrandom(seed, options, callback) {
      var key = [];
      options = (options == true) ? { entropy: true } : (options || {});

      // Flatten the seed string or build one from local entropy if needed.
      var shortseed = mixkey(flatten(
        options.entropy ? [seed, tostring(pool)] :
        (seed == null) ? autoseed() : seed, 3), key);

      // Use the seed to initialize an ARC4 generator.
      var arc4 = new ARC4(key);

      // This function returns a random double in [0, 1) that contains
      // randomness in every bit of the mantissa of the IEEE 754 value.
      var prng = function() {
        var n = arc4.g(chunks),             // Start with a numerator n < 2 ^ 48
            d = startdenom,                 //   and denominator d = 2 ^ 48.
            x = 0;                          //   and no 'extra last byte'.
        while (n < significance) {          // Fill up all significant digits by
          n = (n + x) * width;              //   shifting numerator and
          d *= width;                       //   denominator and generating a
          x = arc4.g(1);                    //   new least-significant-byte.
        }
        while (n >= overflow) {             // To avoid rounding up, before adding
          n /= 2;                           //   last byte, shift everything
          d /= 2;                           //   right using integer math until
          x >>>= 1;                         //   we have exactly the desired bits.
        }
        return (n + x) / d;                 // Form the number within [0, 1).
      };

      prng.int32 = function() { return arc4.g(4) | 0; };
      prng.quick = function() { return arc4.g(4) / 0x100000000; };
      prng.double = prng;

      // Mix the randomness into accumulated entropy.
      mixkey(tostring(arc4.S), pool);

      // Calling convention: what to return as a function of prng, seed, is_math.
      return (options.pass || callback ||
          function(prng, seed, is_math_call, state) {
            if (state) {
              // Load the arc4 state from the given state if it has an S array.
              if (state.S) { copy(state, arc4); }
              // Only provide the .state method if requested via options.state.
              prng.state = function() { return copy(arc4, {}); };
            }

            // If called as a method of Math (Math.seedrandom()), mutate
            // Math.random because that is how seedrandom.js has worked since v1.0.
            if (is_math_call) { math[rngname] = prng; return seed; }

            // Otherwise, it is a newer calling convention, so return the
            // prng directly.
            else return prng;
          })(
      prng,
      shortseed,
      'global' in options ? options.global : (this == math),
      options.state);
    }

    //
    // ARC4
    //
    // An ARC4 implementation.  The constructor takes a key in the form of
    // an array of at most (width) integers that should be 0 <= x < (width).
    //
    // The g(count) method returns a pseudorandom integer that concatenates
    // the next (count) outputs from ARC4.  Its return value is a number x
    // that is in the range 0 <= x < (width ^ count).
    //
    function ARC4(key) {
      var t, keylen = key.length,
          me = this, i = 0, j = me.i = me.j = 0, s = me.S = [];

      // The empty key [] is treated as [0].
      if (!keylen) { key = [keylen++]; }

      // Set up S using the standard key scheduling algorithm.
      while (i < width) {
        s[i] = i++;
      }
      for (i = 0; i < width; i++) {
        s[i] = s[j = mask & (j + key[i % keylen] + (t = s[i]))];
        s[j] = t;
      }

      // The "g" method returns the next (count) outputs as one number.
      (me.g = function(count) {
        // Using instance members instead of closure state nearly doubles speed.
        var t, r = 0,
            i = me.i, j = me.j, s = me.S;
        while (count--) {
          t = s[i = mask & (i + 1)];
          r = r * width + s[mask & ((s[i] = s[j = mask & (j + t)]) + (s[j] = t))];
        }
        me.i = i; me.j = j;
        return r;
        // For robust unpredictability, the function call below automatically
        // discards an initial batch of values.  This is called RC4-drop[256].
        // See http://google.com/search?q=rsa+fluhrer+response&btnI
      })(width);
    }

    //
    // copy()
    // Copies internal state of ARC4 to or from a plain object.
    //
    function copy(f, t) {
      t.i = f.i;
      t.j = f.j;
      t.S = f.S.slice();
      return t;
    }
    //
    // flatten()
    // Converts an object tree to nested arrays of strings.
    //
    function flatten(obj, depth) {
      var result = [], typ = (typeof obj), prop;
      if (depth && typ == 'object') {
        for (prop in obj) {
          try { result.push(flatten(obj[prop], depth - 1)); } catch (e) {}
        }
      }
      return (result.length ? result : typ == 'string' ? obj : obj + '\0');
    }

    //
    // mixkey()
    // Mixes a string seed into a key that is an array of integers, and
    // returns a shortened string seed that is equivalent to the result key.
    //
    function mixkey(seed, key) {
      var stringseed = seed + '', smear, j = 0;
      while (j < stringseed.length) {
        key[mask & j] =
          mask & ((smear ^= key[mask & j] * 19) + stringseed.charCodeAt(j++));
      }
      return tostring(key);
    }

    //
    // autoseed()
    // Returns an object for autoseeding, using window.crypto and Node crypto
    // module if available.
    //
    function autoseed() {
      try {
        var out;
        if (nodecrypto && (out = nodecrypto.randomBytes)) ; else {
          out = new Uint8Array(width);
          (global$1.crypto || global$1.msCrypto).getRandomValues(out);
        }
        return tostring(out);
      } catch (e) {
        var browser = global$1.navigator,
            plugins = browser && browser.plugins;
        return [+new Date, global$1, plugins, global$1.screen, tostring(pool)];
      }
    }

    //
    // tostring()
    // Converts an array of charcodes to a string
    //
    function tostring(a) {
      return String.fromCharCode.apply(0, a);
    }

    //
    // When seedrandom.js is loaded, we immediately mix a few bits
    // from the built-in RNG into the entropy pool.  Because we do
    // not want to interfere with deterministic PRNG state later,
    // seedrandom will not call math.random on its own again after
    // initialization.
    //
    mixkey(math.random(), pool);

    function is_host_selector(s) {
      return /^\:(host|doodle)/.test(s);
    }

    function is_parent_selector(s) {
      return /^\:(container|parent)/.test(s);
    }

    function is_special_selector(s) {
      return is_host_selector(s) || is_parent_selector(s);
    }

    function is_pseudo_selecotr(s) {
      return /\:before|\:after/.test(s);
    }

    const MathFunc = {};
    for (let name of Object.getOwnPropertyNames(Math)) {
      MathFunc[name] = () => (...args) => {
        if (typeof Math[name] === 'number') {
          return Math[name];
        }
        args = args.map(n => calc$1(get_value(n)));
        return Math[name](...args);
      };
    }

    class Rules {

      constructor(tokens) {
        this.tokens = tokens;
        this.rules = {};
        this.props = {};
        this.keyframes = {};
        this.grid = null;
        this.seed = null;
        this.is_grid_defined = false;
        this.coords = [];
        this.doodles = {};
        this.canvas = {};
        this.pattern = {};
        this.shaders = {};
        this.reset();
        this.custom_properties = {};
        this.uniforms = {};
        this.content = {};
      }

      reset() {
        this.styles = {
          host: '',
          container: '',
          cells: '',
          keyframes: ''
        };
        this.coords = [];
        this.doodles = {};
        this.canvas = {};
        this.pattern = {};
        this.shaders = {};
        this.content = {};
        for (let key in this.rules) {
          if (key.startsWith('#c')) {
            delete this.rules[key];
          }
        }
      }

      add_rule(selector, rule) {
        let rules = this.rules[selector];
        if (!rules) {
          rules = this.rules[selector] = [];
        }
        rules.push.apply(rules, make_array(rule));
      }

      pick_func(name) {
        return Expose[name] || MathFunc[name];
      }

      apply_func(fn, coords, args) {
        let _fn = fn(...make_array(coords));
        let input = [];
        args.forEach(arg => {
          let type = typeof arg.value;
          let is_string_or_number = (type === 'number' || type === 'string');
          if (!arg.cluster && (is_string_or_number)) {
            input.push(...parse$8(arg.value, { noSpace: true }));
          }
          else {
            if (typeof arg === 'function') {
              input.push(arg);
            }
            else if (!is_nil(arg.value)) {
              let value = get_value(arg.value);
              input.push(value);
            }
          }
        });
        input = remove_empty_values(input);
        let result = _fn(...make_array(input));
        return result;
      }

      compose_aname(...args) {
        return args.join('-');
      }

      compose_selector({ x, y, z}, pseudo = '') {
        return `#${ cell_id(x, y, z) }${ pseudo }`;
      }

      is_composable(name) {
        return ['doodle', 'shaders', 'canvas', 'pattern'].includes(name);
      }

      read_var(value, coords) {
        let count = coords.count;
        let group = Object.assign({},
          this.custom_properties['host'],
          this.custom_properties['container'],
          this.custom_properties[count]
        );
        if (group[value] !== undefined) {
          let result = String(group[value]).trim();
          if (result[0] == '(') {
            let last = result[result.length - 1];
            if (last === ')') {
              result = result.substring(1, result.length - 1);
            }
          }
          return result.replace(/;+$/g, '');
        }
        return value;
      }

      compose_argument(argument, coords, extra = [], parent) {
        if (!coords.extra) coords.extra = [];
        coords.extra.push(extra);
        let result = argument.map(arg => {
          if (arg.type === 'text') {
            if (/^\-\-\w/.test(arg.value)) {
              if (parent && parent.name === '@var') {
                return arg.value;
              }
              return this.read_var(arg.value, coords);
            }
            return arg.value;
          }
          else if (arg.type === 'func') {
            let fname = arg.name.substr(1);
            let fn = this.pick_func(fname);
            if (typeof fn === 'function') {
              this.check_uniforms(fname);
              if (this.is_composable(fname)) {
                let value = get_value((arg.arguments[0] || [])[0]);
                if (!is_nil(value)) {
                  switch (fname) {
                    case 'doodle':
                      return this.compose_doodle(this.inject_variables(value, coords.count));
                    case 'shaders':
                      return this.compose_shaders(value, coords);
                    case 'canvas':
                      return this.compose_canvas(value, arg.arguments.slice(1));
                    case 'pattern':
                      return this.compose_pattern(value, coords);
                  }
                }
              }
              coords.position = arg.position;
              let args = arg.arguments.map(n => {
                return fn.lazy
                  ? (...extra) => this.compose_argument(n, coords, extra, arg)
                  : this.compose_argument(n, coords, extra, arg);
              });
              let value = this.apply_func(fn, coords, args);
              return value;
            } else {
              return arg.name;
            }
          }
        });

        coords.extra.pop();

        return {
          cluster: argument.cluster,
          value: (result.length >= 2 ? ({ value: result.join('') }) : result[0])
        }
      }

      compose_doodle(doodle) {
        let id = unique_id('doodle');
        this.doodles[id] = doodle;
        return '${' + id + '}';
      }

      compose_shaders(shader, {x, y, z}) {
        let id = unique_id('shader');
        this.shaders[id] = {
          id: '--' + id,
          shader,
          cell: cell_id(x, y, z)
        };
        return '${' + id + '}';
      }

      compose_pattern(code, {x, y, z}) {
        let id = unique_id('pattern');
        this.pattern[id] = {
          id: '--' + id,
          code,
          cell: cell_id(x, y, z)
        };
        return '${' + id + '}';
      }

      compose_canvas(code, rest = []) {
        let commands = code;
        let result = rest.map(group => get_value(group[0])).join(',');
        if (result.length) {
          commands = code + ',' + result;
        }
        let id = unique_id('canvas');
        this.canvas[id] = { code: commands };
        return '${' + id + '}';
      }

      check_uniforms(name) {
        switch (name) {
          case 'ut': case 't': this.uniforms.time = true; break;
          case 'ux': this.uniforms.mousex = true; break;
          case 'uy': this.uniforms.mousey = true; break;
          case 'uw': this.uniforms.width = true; break;
          case 'uh': this.uniforms.height = true; break;
        }
      }

      inject_variables(value, count) {
        let group = Object.assign({},
          this.custom_properties['host'],
          this.custom_properties['container'],
          this.custom_properties[count]
        );
        let variables = [];
        for (let [name, key] of Object.entries(group)) {
          variables.push(`${name}: ${key};`);
        }
        variables = variables.join('');
        if (variables.length) {
          return `:doodle { ${variables} }` + value;
        }
        return value;
      }

      compose_value(value, coords) {
        if (!Array.isArray(value)) {
          return {
            value: '',
            extra: '',
          }
        }
        let extra = '';
        let output = value.reduce((result, val) => {
          switch (val.type) {
            case 'text': {
              result += val.value;
              break;
            }
            case 'func': {
              let fname = val.name.substr(1);
              let fn = this.pick_func(fname);
              if (typeof fn === 'function') {
                this.check_uniforms(fname);
                if (this.is_composable(fname)) {
                  let value = get_value((val.arguments[0] || [])[0]);
                  if (!is_nil(value)) {
                    switch (fname) {
                      case 'doodle':
                        result += this.compose_doodle(this.inject_variables(value, coords.count)); break;
                      case 'shaders':
                        result += this.compose_shaders(value, coords); break;
                      case 'pattern':
                        result += this.compose_pattern(value, coords); break;
                      case 'canvas':
                        result += this.compose_canvas(value, val.arguments.slice(1)); break;
                    }
                  }
                } else {
                  coords.position = val.position;
                  let args = val.arguments.map(arg => {
                    return fn.lazy
                      ? (...extra) => this.compose_argument(arg, coords, extra, val)
                      : this.compose_argument(arg, coords, [], val);
                  });

                  let output = this.apply_func(fn, coords, args);
                  if (!is_nil(output)) {
                    result += output;
                    if (output.extra) {
                      extra = output.extra;
                    }
                  }
                }
              } else {
                result += val.name;
              }
            }
          }
          return result;
        }, '');

        return {
          value: output,
          extra: extra,
        }
      }

      add_grid_style({ fill, clip, rotate, scale, flexRow, flexColumn }) {
        if (fill) {
          this.add_rule(':host', `background-color: ${fill};`);
        }
        if (!clip) {
          this.add_rule(':host', 'contain: none;');
        }
        if (rotate) {
          this.add_rule(':container', `rotate: ${rotate};`);
        }
        if (scale) {
          this.add_rule(':container', `scale: ${scale};`);
        }
        if (flexRow) {
          this.add_rule(':container', `display: flex`);
          this.add_rule('cell', `flex: 1`);
        }
        if (flexColumn) {
          this.add_rule(':container', `display: flex; flex-direction: column;`);
          this.add_rule('cell', `flex: 1`);
        }
      }

      compose_rule(token, _coords, selector) {
        let coords = Object.assign({}, _coords);
        let prop = token.property;
        let extra;
        if (prop === '@seed') {
          return '';
        }
        let value_group = token.value.reduce((ret, v) => {
          let composed = this.compose_value(v, coords);
          if (composed) {
            if (composed.value) {
              ret.push(composed.value);
            }
            if (composed.extra) {
              extra = composed.extra;
            }
          }
          return ret;
        }, []);

        let value = value_group.join(', ');

        if (/^animation(\-name)?$/.test(prop)) {
          this.props.has_animation = true;

          if (is_host_selector(selector)) {
            let prefix = uniform_time[prop];
            if (prefix && value) {
              value =  prefix + ',' + value;
            }
          }

          if (coords.count > 1) {
            let { count } = coords;
            switch (prop) {
              case 'animation-name': {
                value = value_group
                  .map(n => this.compose_aname(n, count))
                  .join(', ');
                break;
              }
              case 'animation': {
                value = value_group
                  .map(n => {
                    let group = (n || '').split(/\s+/);
                    group[0] = this.compose_aname(group[0], count);
                    return group.join(' ');
                  })
                  .join(', ');
              }
            }
          }
        }

        if (prop === 'content') {
          if (!/["']|^none$|^(var|counter|counters|attr|url)\(/.test(value)) {
            value = `'${ value }'`;
          }
        }

        if (prop === 'transition') {
          this.props.has_transition = true;
        }

        let rule = `${ prop }: ${ value };`;
        rule = prefixer(prop, rule);

        if (prop === 'clip-path') {
          // fix clip bug
          rule += ';overflow: hidden;';
        }

        if (prop === 'width' || prop === 'height') {
          if (!is_special_selector(selector)) {
            rule += `--internal-cell-${ prop }: ${ value };`;
          }
        }

        let is_image = (
          /^(background|background\-image)$/.test(prop) &&
          /\$\{(canvas|shader|pattern)/.test(value)
        );
        if (is_image) {
          rule += 'background-size: 100% 100%;';
        }

        if (/^\-\-/.test(prop)) {
          let key = _coords.count;
          if (is_parent_selector(selector)) {
            key = 'container';
          }
          if (is_host_selector(selector)) {
            key = 'host';
          }
          if (!this.custom_properties[key]) {
            this.custom_properties[key] = {};
          }
          this.custom_properties[key][prop] = value;
        }

        if (/^@/.test(prop) && Property[prop.substr(1)]) {
          let name = prop.substr(1);
          let transformed = Property[name](value, {
            is_special_selector: is_special_selector(selector),
            grid: coords.grid,
            max_grid: coords.max_grid,
            extra
          });
          switch (name) {
            case 'grid': {
              if (is_host_selector(selector)) {
                rule = transformed.size || '';
                this.add_grid_style(transformed);
              } else {
                rule = '';
                if (!this.is_grid_defined) {
                  transformed = Property[name](value, {
                    is_special_selector: true,
                    grid: coords.grid,
                    max_grid: coords.max_grid
                  });
                  this.add_rule(':host', transformed.size || '');
                  this.add_grid_style(transformed);
                }
              }
              this.grid = coords.grid;
              this.is_grid_defined = true;
              break;
            }
            case 'gap': {
              rule = '';
              this.add_rule(':container', `gap: ${transformed};`);
            }
            case 'content': {
              rule = '';
              if (transformed !== undefined && !is_pseudo_selecotr(selector) && !is_parent_selector(selector)) {
                this.content[this.compose_selector(coords)] = transformed;
              }
            }
            case 'seed': {
              rule = '';
              break;
            }
            case 'place-cell':
            case 'place':
            case 'position':
            case 'offset': {
              if (!is_host_selector(selector)) {
                rule = transformed;
              }
              break;
            }
            case 'use': {
              if (token.value.length) {
                this.compose(coords, token.value);
              }
              rule = '';
              break;
            }
            default: {
              rule = transformed;
            }
          }
        }

        return rule;
      }

      get_raw_value(token) {
        let raw = token.raw();
        if (is_nil(raw)){
          raw = '';
        }
        let [_, ...rest] = raw.split(token.property);
        // It's not accurate, will be solved after the rewrite of css parser.
        rest = rest.join(token.property)
          .replace(/^\s*:\s*/, '')
          .replace(/[;}<]$/, '').trim()
          .replace(/[;}<]$/, '');
        return rest;
      }

      pre_compose_rule(token, _coords) {
        let coords = Object.assign({}, _coords);
        let prop = token.property;

        switch (prop) {
          case '@grid': {
            let value_group = token.value.reduce((ret, v) => {
              let composed = this.compose_value(v, coords);
              if (composed && composed.value) ret.push(composed.value);
              return ret;
            }, []);
            let value = value_group.join(', ');
            let name = prop.substr(1);
            let transformed = Property[name](value, {
              max_grid: _coords.max_grid
            });
            this.grid = transformed.grid;
            break;
          }
          case '@use': {
            if (token.value.length) {
              this.pre_compose(coords, token.value);
            }
            break;
          }
        }
      }

      pre_compose(coords, tokens) {
        if (is_nil(this.seed)) {
    (tokens || this.tokens).forEach(token => {
            if (token.type === 'rule' && token.property === '@seed') {
              this.seed = this.get_raw_value(token);
            }
            if (token.type === 'pseudo' && is_host_selector(token.selector)) {
              for (let t of make_array(token.styles)) {
                if (t.type === 'rule' && t.property === '@seed') {
                  this.seed = this.get_raw_value(t);
                }
              }
            }
          });
          if (is_nil(this.seed)) {
            this.seed = coords.seed_value;
          } else {
            coords.update_random(this.seed);
          }
        }
    (tokens || this.tokens).forEach(token => {
          switch (token.type) {
            case 'rule': {
              this.pre_compose_rule(token, coords);
              break;
            }
            case 'pseudo': {
              if (is_host_selector(token.selector)) {
                (token.styles || []).forEach(token => {
                  this.pre_compose_rule(token, coords);
                });
              }
              break;
            }
          }
        });
      }

      compose(coords, tokens, initial) {
        this.coords.push(coords);
        (tokens || this.tokens).forEach((token, i) => {
          if (token.skip) return false;
          if (initial && this.grid) return false;

          switch (token.type) {
            case 'rule': {
              this.add_rule(
                this.compose_selector(coords),
                this.compose_rule(token, coords)
              );
              break;
            }

            case 'pseudo': {
              if (token.selector.startsWith(':doodle')) {
                token.selector = token.selector.replace(/^\:+doodle/, ':host');
              }
              let special = is_special_selector(token.selector);
              if (special) {
                token.skip = true;
              }
              token.selector.split(',').forEach(selector => {
                let pseudo = token.styles.map(s =>
                  this.compose_rule(s, coords, selector)
                );
                let composed = special
                  ? selector
                  : this.compose_selector(coords, selector);
                this.add_rule(composed, pseudo);
              });

              break;
            }

            case 'cond': {
              let fn = Selector$1[token.name.substr(1)];
              if (fn) {
                let args = token.arguments.map(arg => {
                  return this.compose_argument(arg, coords);
                });
                let result = this.apply_func(fn, coords, args);
                if (result) {
                  this.compose(coords, token.styles);
                }
              }
              break;
            }

            case 'keyframes': {
              if (!this.keyframes[token.name]) {
                this.keyframes[token.name] = coords => `
              ${ join(token.steps.map(step => `
                ${ step.name } {
                  ${ join(
                    step.styles.map(s => this.compose_rule(s, coords))
                  )}
                }
              `)) }
            `;
              }
            }
          }
        });
      }

      output() {
        for (let [selector, rule] of Object.entries(this.rules)) {
          if (is_parent_selector(selector)) {
            this.styles.container += `
          .container {
            ${ join(rule) }
          }
        `;
          } else {
            let target = is_host_selector(selector) ? 'host' : 'cells';
            let value = join(rule).trim();
            let name = (target === 'host') ? `${ selector }, .host` : selector;
            this.styles[target] += `${ name } { ${ value  } }`;
          }
        }

        if (this.uniforms.time) {
          this.styles.container += `
        :host, .host {
          animation: ${ uniform_time.animation };
        }
      `;
          this.styles.keyframes += `
       @keyframes ${ uniform_time['animation-name'] } {
         from { --${ uniform_time.name }: 0 }
         to { --${ uniform_time.name }: ${ uniform_time['animation-duration'] / 10 } }
       }
      `;
        }

        this.coords.forEach((coords, i) => {
          for (let [name, keyframe] of Object.entries(this.keyframes)) {
            let aname = this.compose_aname(name, coords.count);
            this.styles.keyframes += `
          ${ maybe(i === 0, `@keyframes ${ name } { ${ keyframe(coords) } }`)}
          @keyframes ${ aname } {
            ${ keyframe(coords) }
          }
        `;
          }
        });

        return {
          props: this.props,
          styles: this.styles,
          grid: this.grid,
          seed: this.seed,
          random: this.random,
          doodles: this.doodles,
          shaders: this.shaders,
          canvas: this.canvas,
          pattern: this.pattern,
          uniforms: this.uniforms,
          content: this.content,
        }
      }

    }

    function generate_css(tokens, grid_size, seed_value, max_grid, seed_random) {
      let rules = new Rules(tokens);
      let random = seed_random || seedrandom(String(seed_value));
      let context = {};

      function update_random(seed) {
        random = seedrandom(String(seed));
      }

      function rand(start = 0, end) {
        if (arguments.length == 1) {
          [start, end] = [0, start];
        }
        return lerp(random(), start, end);
      }

      function pick(...items) {
        let args = items.reduce((acc, n) => acc.concat(n), []);
        return args[~~(random() * args.length)];
      }

      function shuffle(arr) {
        let ret = [...arr];
        let m = arr.length;
        while (m) {
          let i = ~~(random() * m--);
          let t = ret[m];
          ret[m] = ret[i];
          ret[i] = t;
        }
        return ret;
      }

      rules.pre_compose({
        x: 1, y: 1, z: 1, count: 1, context: {},
        grid: { x: 1, y: 1, z: 1, count: 1 },
        random, rand, pick, shuffle,
        max_grid, update_random,
        seed_value,
      });

      let { grid, seed } = rules.output();

      if (grid) {
        grid_size = grid;
      }

      if (seed) {
        seed = String(seed);
        random = seedrandom(seed);
      } else {
        seed = seed_value;
      }

      if (is_nil(seed)) {
        seed = Date.now();
        random = seedrandom(seed);
      }

      seed = String(seed);
      rules.seed = seed;
      rules.random = random;
      rules.reset();

      if (grid_size.z == 1) {
        for (let y = 1, count = 0; y <= grid_size.y; ++y) {
          for (let x = 1; x <= grid_size.x; ++x) {
            rules.compose({
              x, y, z: 1,
              count: ++count, grid: grid_size, context,
              rand, pick, shuffle,
              random, seed,
              max_grid,
            });
          }
        }
      }
      else {
        for (let z = 1, count = 0; z <= grid_size.z; ++z) {
          rules.compose({
            x: 1, y: 1, z,
            count: ++count, grid: grid_size, context,
            rand, pick, shuffle,
            random, seed,
            max_grid,
          });
        }
      }

      return rules.output();
    }

    function create_shader(gl, type, source) {
      let shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    }
    function create_program(gl, vss, fss) {
      let vs = create_shader(gl, gl.VERTEX_SHADER, vss);
      let fs = create_shader(gl, gl.FRAGMENT_SHADER, fss);
      let prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.warn('Link failed: ' + gl.getProgramInfoLog(prog));
        console.warn('vs info-log: ' + gl.getShaderInfoLog(vs));
        console.warn('fs info-log: ' + gl.getShaderInfoLog(fs));
      }
      return prog;
    }

    function add_uniform(fragment, uniform) {
      if (!fragment.includes(uniform)) {
        return uniform + '\n' + fragment;
      }
      return fragment;
    }

    const fragment_head = `#version 300 es
  precision highp float;
  out vec4 FragColor;
`;

    const default_vertex_shader = `#version 300 es
  in vec4 position;
  void main() {
    gl_Position = position;
  }
`;

    // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
    function load_texture(gl, image, i) {
      const texture = gl.createTexture();
      gl.activeTexture(gl['TEXTURE' + i]);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);

      // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }

    function draw_shader(shaders, width, height, seed) {
      let result = Cache.get(shaders);
      if (result) {
        return Promise.resolve(result);
      }
      let canvas = document.createElement('canvas');
      let ratio = window.devicePixelRatio || 1;
      width *= ratio;
      height *= ratio;
      canvas.width = width;
      canvas.height = height;

      let gl = canvas.getContext('webgl2', {preserveDrawingBuffer: true});
      if (!gl) return Promise.resolve('');

      // resolution uniform
      let fragment = add_uniform(shaders.fragment || '', 'uniform vec2 u_resolution;');

      fragment = add_uniform(fragment, 'uniform float u_time;');
      fragment = add_uniform(fragment, 'uniform float u_timeDelta;');
      fragment = add_uniform(fragment, 'uniform int u_frameIndex;');
      fragment = add_uniform(fragment, 'uniform vec2 u_seed;');
      // fragment = add_uniform(fragment, 'uniform vec4 u_mouse;');

      // texture uniform
      shaders.textures.forEach(n => {
        let uniform = `uniform sampler2D ${ n.name };`;
        fragment =  add_uniform(fragment, uniform);
      });

      const isShaderToyFragment = /(^|[^\w\_])void\s+mainImage\(\s*out\s+vec4\s+fragColor,\s*in\s+vec2\s+fragCoord\s*\)/mg.test(fragment);
      
      if(isShaderToyFragment) {
        fragment = `// https://www.shadertoy.com/howto

#define iResolution vec3(u_resolution, 0)
#define iTime u_time
#define iTimeDelta u_timeDelta
#define iFrame u_frameIndex

${shaders.textures.map((n, i) => `#define iChannel${i} ${n.name}`).join('\n')}

${fragment}

void main() {
  mainImage(FragColor, gl_FragCoord.xy);
}`;
      }

      let program = create_program(
        gl,
        shaders.vertex || default_vertex_shader,
        fragment_head + fragment
      );

      // position in vertex shader
      let positionAttributeLocation = gl.getAttribLocation(program, 'position');
      let positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      let vertices = [-1, -1, -1, 1, 1, -1, 1, 1, -1, 1, 1, -1];
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);

      // resolve uniforms
      const uResolutionLoc = gl.getUniformLocation(program, "u_resolution");
      gl.uniform2fv(uResolutionLoc, [width, height]);

      shaders.textures.forEach((n, i) => {
        load_texture(gl, n.value, i);
        gl.uniform1i(gl.getUniformLocation(program, n.name), i);
      });

      // vec2 u_seed, u_seed.x = hash(doodle.seed) / 1e16, u_seed.y = Math.random()
      const uSeed = gl.getUniformLocation(program, "u_seed");
      if(uSeed) {
        gl.uniform2f(uSeed, hash(seed) / 1e16, Math.random());
      }

      // resolve image data in 72dpi :(
      const uTimeLoc = gl.getUniformLocation(program, "u_time");
      const uFrameLoc = gl.getUniformLocation(program, "u_frameIndex");
      const uTimeDelta = gl.getUniformLocation(program, "u_timeDelta");
      if(uTimeLoc || uTimeDelta || uFrameLoc) {
        let frameIndex = 0;
        let currentTime = 0;
        return Promise.resolve(Cache.set(shaders, (t) => {
          gl.clear(gl.COLOR_BUFFER_BIT);
          if(uTimeLoc) gl.uniform1f(uTimeLoc, t / 1000);
          if(uFrameLoc) gl.uniform1i(uFrameLoc, frameIndex++);
          if(uTimeDelta) {
            gl.uniform1f(uTimeDelta, (currentTime - t) / 1000);
            currentTime = t;
          }
          gl.drawArrays(gl.TRIANGLES, 0, 6);
          return canvas.toDataURL();
        }));
      } else {
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        return Promise.resolve(Cache.set(shaders, canvas.toDataURL()));
      }
    }

    function readStatement(iter, token) {
      let fragment = [];
      while (iter.next()) {
        let { curr, next } = iter.get();
        let isStatementBreak = !next || curr.isSymbol(';') || next.isSymbol('}');
        fragment.push(curr);
        if (isStatementBreak) {
          break;
        }
      }
      if (fragment.length) {
        token.value = joinToken(fragment);
      }
      return token;
    }

    function walk(iter, parentToken) {
      let rules = [];
      let fragment = [];
      let tokenType = parentToken && parentToken.type || '';
      let stack = [];

      while (iter.next()) {
        let { prev, curr, next } = iter.get();
        let isBlockBreak = !next || curr.isSymbol('}');
        if (tokenType === 'block' && isBlockBreak) {
          if (!next && rules.length && !curr.isSymbol('}')) {
            rules[rules.length - 1].value += (';' + curr.value);
          }
          parentToken.value = rules;
          break;
        }
        else if (curr.isSymbol('{') && fragment.length && !stack.length) {
          let selectors = parseSelector(fragment);
          if (!selectors.length) {
            continue;
          }
          let block = walk(iter, {
            type: 'block',
            name: 'unkown',
            value: []
          });

          selectors.forEach(selector => {
            let newBlock = Object.assign({}, block, {
              name: selector.name,
              args: selector.args
            });
            rules.push(newBlock);
          });
          fragment = [];
        }
        else if (curr.isSymbol(':') && fragment.length && !stack.length) {
          let prop = joinToken(fragment);
          rules.push(readStatement(iter, {
            type: 'statement',
            name: prop,
            value: ''
          }));
          if (tokenType == 'block') {
            parentToken.value = rules;
          }
          fragment = [];
        }
        else if (curr.isSymbol(';')) {
          if (rules.length && fragment.length) {
            rules[rules.length - 1].value += (';' + joinToken(fragment));
            fragment = [];
          }
        } else {
          if (curr.isSymbol('(')) {
            stack.push(curr);
          }
          if (curr.isSymbol(')')) {
            stack.pop();
          }
          fragment.push(curr);
        }
      }

      if (rules.length && tokenType == 'block') {
        parentToken.value = rules;
      }
      return tokenType ? parentToken : rules;
    }

    function joinToken(tokens) {
      return tokens
        .filter((token, i) => {
          if (token.isSymbol(';') && i === tokens.length - 1) return false;
          return true;
        })
        .map(n => n.value).join('');
    }

    function parseSelector(tokens) {
      let iter = iterator$1(tokens);
      let groups = [];
      let selectorName = '';
      let args = [];
      let fragments = [];
      let stack = [];
      while (iter.next()) {
        let { curr, next } = iter.get();
        if (!selectorName.length && curr.isWord()) {
          selectorName = curr.value;
        }
        else if (curr.isSymbol('(')) {
          if (stack.length) {
            fragments.push(curr.value);
          }
          stack.push(curr);
        }
        else if (curr.isSymbol(')')) {
          stack.pop();
          if (stack.length) {
            fragments.push(curr.value);
          } else if (fragments.length) {
            args.push(fragments.join(''));
            fragments = [];
          }
        }
        else if (curr.isSymbol(',')) {
          if (stack.length) {
            args.push(fragments.join(''));
            fragments = [];
          } else {
            if (fragments.length) {
              args.push(fragments.join(''));
              fragments = [];
            }
            if (selectorName) {
              groups.push({
                name: selectorName,
                args
              });
              selectorName = '';
              args = [];
              fragments = [];
            }
          }
        }
        else {
          fragments.push(curr.value);
        }
      }

      if (selectorName) {
        groups.push({
          name: selectorName,
          args
        });
      }

      return groups.filter((v, i, self) => {
        let idx = self.findIndex(n => {
          return (n.name === v.name && v.args.join('') == n.args.join(''));
        });
        return idx === i;
      });
    }

    function parse(source) {
      let iter = iterator$1(scan(source));
      let tokens = walk(iter);
      return tokens;
    }

    function generate_shader(input, grid) {
      return `
    vec3 mapping(vec2 uv, vec2 grid) {
      vec2 _grid = 1.0/grid;
      float x = ceil(uv.x/_grid.x);
      float y = ceil(grid.y - uv.y/_grid.y);
      float i = x + (y - 1.0) * y;
      return vec3(x, y, i);
    }
    vec4 getColor(float x, float y, float i, float I, float X, float Y, float t) {
      vec4 color = vec4(0, 0, 0, 0);
      ${input}
      return color;
    }
    void main() {
      vec2 uv = gl_FragCoord.xy/u_resolution.xy;
      vec2 grid = vec2(${grid.x}, ${grid.y});
      vec3 p = mapping(uv, grid);
      FragColor = getColor(p.x, p.y, p.z, grid.x * grid.y, grid.x, grid.y, u_time);
    }
  `;
    }

    function generate_statement(token, extra) {
      if (token.name === 'fill') {
        let {r, g, b, a} = extra.get_rgba_color(token.value);
        return {
          type: 'statement',
          value: `\ncolor = vec4(${float$1(r/255)}, ${float$1(g/255)}, ${float$1(b/255)}, ${float$1(a)});\n`,
        }
      }
      if (token.name == 'grid') {
        return {
          type: 'grid',
          value: token.value,
        }
      }
      return {
        type: 'statement',
        value: ''
      }
    }

    function generate_block(token, extra) {
      if (token.name === 'match') {
        let cond = token.args[0];
        let values = [];
        token.value.forEach(t => {
          let statement = generate_statement(t, extra);
          if (statement.type == 'statement') {
            values.push(statement.value);
          }
        });
        return `
      if (${cond}) {
        ${values.join('')}
      }
    `
      }
      return '';
    }

    function float$1(n) {
      return String(n).includes('.') ? n : n + '.0';
    }

    function get_grid(input) {
      let [x, y = x] = String(input + '')
        .replace(/\s+/g, '')
        .replace(/[,，xX]+/g, 'x')
        .split('x')
        .map(n => parseInt(n));
      if (!x || x < 1) x = 1;
      if (!y || y < 1) y = 1;
      return { x, y }
    }

    function draw_pattern(code, extra) {
      let tokens = parse(code);
      let result = [];
      let grid = {x: 1, y: 1 };
      tokens.forEach(token => {
        if (token.type === 'statement') {
          let statement = generate_statement(token, extra);
          if (statement.type == 'statement') {
            result.push(statement.value);
          }
          if (statement.type === 'grid') {
            grid = get_grid(statement.value);
          }
        } else if (token.type === 'block') {
          result.push(generate_block(token, extra));
        }
      });
      return generate_shader(result.join(''), grid);
    }

    const nextId = next_id();

    function draw_canvas(code) {
      let result = Cache.get(code);
      if (result) {
        return Promise.resolve(result);
      }
      let name = nextId('css-doodle-paint');
      let wrapped = generate(name, code);

      let blob = new Blob([wrapped], { type: 'text/javascript' });
      try {
        if (CSS.paintWorklet) {
          CSS.paintWorklet.addModule(URL.createObjectURL(blob));
        }
      } catch(e) {}

      return Promise.resolve(Cache.set(code, `paint(${name})`));
    }

    function generate(name, code) {
      code = un_entity(code);
      // make it so
      if (!code.includes('paint(')) {
        code = `
      paint(ctx, {width, height}, props) {
        ${code}
      }
    `;
      }
      return `
    registerPaint('${name}', class {
      ${ code }
    })
  `;
    }

    function svg_to_png(svg, width, height, scale) {
      return new Promise((resolve, reject) => {
        let source = `data:image/svg+xml;utf8,${ encodeURIComponent(svg) }`;
        function action() {
          let img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = source;

          img.onload = () => {
            let canvas = document.createElement('canvas');
            let ctx = canvas.getContext('2d');

            let dpr = window.devicePixelRatio || 1;
            /* scale with devicePixelRatio only when the scale equals 1 */
            if (scale != 1) {
              dpr = 1;
            }

            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            try {
              canvas.toBlob(blob => {
                resolve({
                  blob,
                  source,
                  url: URL.createObjectURL(blob)
                });
              });
            } catch (e) {
              reject(e);
            }
          };
        }

        if (is_safari()) {
          cache_image(source, action, 200);
        } else {
          action();
        }
      });
    }

    function get_all_variables(element) {
      if (typeof getComputedStyle === 'undefined') {
        return '';
      }
      let ret = {};
      if (element.computedStyleMap) {
        for (let [prop, value] of element.computedStyleMap()) {
          if (prop.startsWith('--')) {
            ret[prop] = value[0][0];
          }
        }
      } else {
        let styles = getComputedStyle(element);
        for (let prop of styles) {
          if (prop.startsWith('--')) {
            ret[prop] = styles.getPropertyValue(prop);
          }
        }
      }
      return inline(ret);
    }

    function get_variable(element, name) {
      if (typeof getComputedStyle === 'undefined') {
        return '';
      }
      return getComputedStyle(element).getPropertyValue(name)
        .trim()
        .replace(/^\(|\)$/g, '');
    }

    function inline(map) {
      let result = [];
      for (let [prop, value] of Object.entries(map)) {
        result.push(prop + ':' + value);
      }
      return result.join(';');
    }

    function transform(color) {
      let [r, g, b, a = 1] = color
        .replace(/rgba?\((.+)\)/, (_, v) => v)
        .split(/,\s*/);
      return {r, g, b, a};
    }

    function get_rgba_color(root, value) {
      let element = root.querySelector('#defs');
      if (!element) {
        return { r: 0, g: 0, b: 0, a: 1 }
      }
      element.style.color = value;
      return transform(getComputedStyle(element).color);
    }

    const STEP60 = 1000 / 60; // 60fps
    const STEP1 = 1000 / 1;   // 1fps

    function createAnimationFrame(fn) {
      let id;
      let time = 0;
      let lastTime = 0;
      let lastStep = 0;
      let paused = false;
      function loop(stamp) {
        if (!time) time = stamp;
        fn(time);
        let step = (stamp - lastTime);
        if (step < STEP60) step = STEP60;
        if (step > STEP1) step = lastStep || STEP1;
        if (lastTime) time += step;
        lastStep = step;
        lastTime = stamp;
        id = requestAnimationFrame(loop);
      }
      id = requestAnimationFrame(loop);
      return {
        resume() {
          if (id && paused) {
            paused = false;
            id = requestAnimationFrame(loop);
          }
        },
        pause() {
          if (id) {
            cancelAnimationFrame(id);
            paused = true;
          }
        },
        cancel() {
          if (id) {
            paused = false;
            cancelAnimationFrame(id);
            id = null;
          }
        },
      }
    }

    if (typeof customElements !== 'undefined') {
      class Doodle extends HTMLElement {
        constructor() {
          super();
          this.doodle = this.attachShadow({ mode: 'open' });
          this.animations = [];
          this.extra = {
            get_variable: name => get_variable(this, name),
            get_rgba_color: value => get_rgba_color(this.shadowRoot, value),
          };
        }

        connectedCallback(again) {
          if (this.innerHTML) {
            this.load(again);
          } else {
            setTimeout(() => this.load(again));
          }
        }

        disconnectedCallback() {
          this.cleanup();
        }

        cleanup() {
          Cache.clear();
          for (let animation of this.animations) {
            animation.cancel();
          }
          this.animations = [];
        }

        update(styles) {
          this.cleanup();
          // Use old rules to update
          if (!styles) {
            styles = un_entity(this.innerHTML);
          }
          if (this.innerHTML !== styles) {
            this.innerHTML = styles;
          }
          if (!this.grid_size) {
            this.grid_size = this.get_grid();
          }

          const { x: gx, y: gy, z: gz } = this.grid_size;
          const use = this.get_use();

          let old_content = '';
          if (this.compiled) {
            old_content = this.compiled.content;
          }

          const compiled = this.generate(parse$6(use + styles, this.extra));

          let grid = compiled.grid || this.get_grid();
          let { x, y, z } = grid;

          let should_rebuild = (
               !this.shadowRoot.innerHTML
            || (gx !== x || gy !== y || gz !== z)
            || (JSON.stringify(old_content) !== JSON.stringify(compiled.content))
          );

          Object.assign(this.grid_size, grid);

          if (should_rebuild) {
            return compiled.grid
              ? this.build_grid(compiled, grid)
              : this.build_grid(this.generate(parse$6(use + styles, this.extra)), grid);
          }

          let replace = this.replace(compiled);
          this.set_content('.style-keyframes', replace(compiled.styles.keyframes));

          if (compiled.props.has_animation) {
            this.set_content('.style-cells', '');
            this.set_content('.style-container', '');
          }

          setTimeout(() => {
            this.set_content('.style-container', replace(
                get_grid_styles(this.grid_size)
              + compiled.styles.host
              + compiled.styles.container
            ));
            this.set_content('.style-cells', replace(compiled.styles.cells));
          });
        }

        get grid() {
          return Object.assign({}, this.grid_size);
        }

        set grid(grid) {
          this.attr('grid', grid);
          this.connectedCallback(true);
        }

        get seed() {
          return this._seed_value;
        }

        set seed(seed) {
          this.attr('seed', seed);
          this.connectedCallback(true);
        }

        get use() {
          return this.attr('use');
        }

        set use(use) {
          this.attr('use', use);
          this.connectedCallback(true);
        }

        get_max_grid() {
          return this.hasAttribute('experimental') ? 256 : 64;
        }

        get_grid() {
          return parse_grid(this.attr('grid'), this.get_max_grid());
        }

        get_use() {
          let use = String(this.attr('use') || '').trim();
          if (/^var\(/.test(use)) {
            use = `@use:${ use };`;
          }
          return use;
        }

        attr(name, value) {
          if (arguments.length === 1) {
            return this.getAttribute(name);
          }
          if (arguments.length === 2) {
            this.setAttribute(name, value);
            return value;
          }
        }

        generate(parsed) {
          let grid = this.get_grid();
          let seed = this.attr('seed') || this.attr('data-seed');
          if (is_nil(seed)) {
            seed = Date.now();
          }
          let compiled = this.compiled = generate_css(
            parsed, grid, seed, this.get_max_grid()
          );
          this._seed_value = compiled.seed;
          this._seed_random = compiled.random;
          return compiled;
        }

        doodle_to_image(code, options, fn) {
          if (typeof options === 'function') {
            fn = options;
            options = null;
          }
          code = ':doodle { width:100%;height:100% }' + code;
          let parsed = parse$6(code, this.extra);
          let _grid = parse_grid('');
          let compiled = generate_css(parsed, _grid, this._seed_value, this.get_max_grid(), this._seed_random);
          let grid = compiled.grid ? compiled.grid : _grid;
          const { keyframes, host, container, cells } = compiled.styles;

          let replace = this.replace(compiled);
          let grid_container = create_grid(grid, compiled.content);

          let size = (options && options.width && options.height)
            ? `width="${ options.width }" height="${ options.height }"`
            : '';

          replace(`
        <svg ${ size } xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <foreignObject width="100%" height="100%">
            <div class="host" xmlns="http://www.w3.org/1999/xhtml">
              <style>
                ${ get_basic_styles() }
                ${ get_grid_styles(grid) }
                ${ host }
                ${ container }
                ${ cells }
                ${ keyframes }
              </style>
              <svg id="defs" xmlns="http://www.w3.org/2000/svg" style="width:0; height:0"></svg>
              ${ grid_container }
            </div>
          </foreignObject>
        </svg>
      `).then(result => {
            let source =`data:image/svg+xml;base64,${ window.btoa(unescape(encodeURIComponent(result))) }`;
            if (is_safari()) {
              cache_image(source);
            }
            fn(source);
          });
        }

        pattern_to_image({ code, cell, id }, fn) {
          let shader = draw_pattern(code, this.extra);
          this.shader_to_image({ shader, cell, id }, fn);
        }

        canvas_to_image({ code }, fn) {
          draw_canvas(code).then(fn);
        }

        pause() {
          this.setAttribute('cssd-paused-animation', true);
          for (let animation of this.animations) {
            animation.pause();
          }
        }

        resume() {
          this.removeAttribute('cssd-paused-animation');
          for (let animation of this.animations) {
            animation.resume();
          }
        }

        shader_to_image({ shader, cell, id }, fn) {
          let parsed = typeof shader === 'string' ?  parse$5(shader) : shader;
          let element = this.doodle.getElementById(cell);
          const seed = this.seed;

          const set_shader_prop = (v) => {
            element.style.setProperty(id, `url(${v})`);
          };

          const tick = (value) => {
            if (typeof value === 'function') {
              let animation = createAnimationFrame(t => {
                set_shader_prop(value(t));
              });
              this.animations.push(animation);
              return '';
            }
            set_shader_prop(value);
          };

          let { width, height } = element && element.getBoundingClientRect() || {
            width: 0, height: 0
          };

          let ratio = window.devicePixelRatio || 1;
          if (!parsed.textures.length || parsed.ticker) {
            draw_shader(parsed, width, height, seed).then(tick).then(fn);
          }
          // Need to bind textures first
          else {
            let transforms = parsed.textures.map(texture => {
              return new Promise(resolve => {
                this.doodle_to_image(texture.value, { width, height }, src => {
                  let img = new Image();
                  img.width = width * ratio;
                  img.height = height * ratio;
                  img.onload = () => resolve({ name: texture.name, value: img });
                  img.src = src;
                });
              });
            });
            Promise.all(transforms).then(textures => {
              parsed.textures = textures;
              draw_shader(parsed, width, height, seed).then(tick).then(fn);
            });
          }
        }

        load(again) {
          this.cleanup();
          let use = this.get_use();
          let parsed = parse$6(use + un_entity(this.innerHTML), this.extra);
          let compiled = this.generate(parsed);

          if (!again) {
            if (this.hasAttribute('click-to-update')) {
              this.addEventListener('click', e => this.update());
            }
          }

          this.grid_size = compiled.grid
            ? compiled.grid
            : this.get_grid();

          this.build_grid(compiled, this.grid_size);
        }

        replace({ doodles, shaders, canvas, pattern }) {
          let doodle_ids = Object.keys(doodles);
          let shader_ids = Object.keys(shaders);
          let canvas_ids = Object.keys(canvas);
          let pattern_ids = Object.keys(pattern);
          let length = doodle_ids.length + canvas_ids.length + shader_ids.length + pattern_ids.length;
          return input => {
            if (!length) {
              return Promise.resolve(input);
            }
            let mappings = [].concat(
              doodle_ids.map(id => {
                if (input.includes(id)) {
                  return new Promise(resolve => {
                    this.doodle_to_image(doodles[id], value => resolve({ id, value }));
                  });
                } else {
                  return Promise.resolve('');
                }
              }),
              shader_ids.map(id => {
                if (input.includes(id)) {
                  return new Promise(resolve => {
                    this.shader_to_image(shaders[id], value => resolve({ id, value }));
                  });
                } else {
                  return Promise.resolve('');
                }
              }),
              canvas_ids.map(id => {
                if (input.includes(id)) {
                  return new Promise(resolve => {
                    this.canvas_to_image(canvas[id], value => resolve({ id, value }));
                  });
                } else {
                  return Promise.resolve('');
                }
              }),
              pattern_ids.map(id => {
                if (input.includes(id)) {
                  return new Promise(resolve => {
                    this.pattern_to_image(pattern[id], value => resolve({ id, value }));
                  });
                } else {
                  return Promise.resolve('');
                }
              }),
            );

            return Promise.all(mappings).then(mapping => {
              for (let {id, value} of mapping) {
                /* default to data-uri for doodle and pattern */
                let target = `url(${value})`;
                /* canvas uses css painting api */
                if (/^canvas/.test(id)) target = value;
                /* shader uses css vars */
                if (/^shader|^pattern/.test(id)) target = `var(--${id})`;
                input = input.replaceAll('${' + id + '}', target);
              }
              return input;
            });
          }
        }

        build_grid(compiled, grid) {
          const { has_transition, has_animation } = compiled.props;
          let has_delay = (has_transition || has_animation);

          const { keyframes, host, container, cells } = compiled.styles;
          let style_container = get_grid_styles(grid) + host + container;
          let style_cells = has_delay ? '' : cells;

          const { uniforms, content } = compiled;

          let replace = this.replace(compiled);

          this.doodle.innerHTML = `
        <style>${ get_basic_styles() }</style>
        <style class="style-keyframes">${ keyframes }</style>
        <style class="style-container">${ style_container }</style>
        <style class="style-cells">${ style_cells }</style>
        <svg id="defs" xmlns="http://www.w3.org/2000/svg" style="width:0;height:0"></svg>
        ${ create_grid(grid, content) }
      `;

          this.set_content('.style-container', replace(style_container));

          if (has_delay) {
            setTimeout(() => {
              this.set_content('.style-cells', replace(cells));
            }, 50);
          } else {
            this.set_content('.style-cells', replace(cells));
          }

          if (uniforms.time) {
            this.register_uniform_time();
          }
          if (uniforms.mousex || uniforms.mousey) {
            this.register_uniform_mouse(uniforms);
          } else {
            this.remove_uniform_mouse();
          }
          if (uniforms.width || uniforms.height) {
            this.register_uniform_resolution(uniforms);
          } else {
            this.remove_uniform_resolution();
          }
        }

        register_uniform_mouse(uniforms) {
          if (!this.uniform_mouse_callback) {
            let { uniform_mousex, uniform_mousey } = Uniforms;
            this.uniform_mouse_callback = e => {
              let data = e.detail || e;
              if (uniforms.mousex) {
                this.style.setProperty('--' + uniform_mousex.name, data.offsetX);
              }
              if (uniforms.mousey) {
                this.style.setProperty('--' + uniform_mousey.name, data.offsetY);
              }
            };
            this.addEventListener('pointermove', this.uniform_mouse_callback);
            let event = new CustomEvent('pointermove', { detail: { offsetX: 0, offsetY: 0}});
            this.dispatchEvent(event);
          }
        }

        remove_uniform_mouse() {
          if (this.uniform_mouse_callback) {
            let { uniform_mousex, uniform_mousey } = Uniforms;
            this.style.removeProperty('--' + uniform_mousex.name);
            this.style.removeProperty('--' + uniform_mousey.name);
            this.removeEventListener('pointermove', this.uniform_mouse_callback);
            this.uniform_mouse_callback = null;
          }
        }

        register_uniform_resolution(uniforms) {
          if (!this.uniform_resolution_observer) {
            let { uniform_width, uniform_height } = Uniforms;
            const setProperty = () => {
              let box = this.getBoundingClientRect();
              if (uniforms.width) {
                this.style.setProperty('--' + uniform_width.name, box.width);
              }
              if (uniforms.height) {
                this.style.setProperty('--' + uniform_height.name, box.height);
              }
            };
            setProperty();
            this.uniform_resolution_observer = new ResizeObserver(entries => {
              for (let entry of entries) {
                let data = entry.contentBoxSize || entry.contentRect;
                if (data) setProperty();
              }
            });
            this.uniform_resolution_observer.observe(this);
          }
        }

        remove_uniform_resolution() {
          if (this.uniform_resolution_observer) {
            let { uniform_width, uniform_height } = Uniforms;
            this.style.removeProperty('--' + uniform_width.name);
            this.style.removeProperty('--' + uniform_height.name);
            this.uniform_resolution_observer.unobserve(this);
            this.uniform_resolution_observer = null;
          }
        }

        register_uniform_time() {
          if (!window.CSS || !window.CSS.registerProperty) {
            return false;
          }
          if (!this.is_uniform_time_registered) {
            let { uniform_time } = Uniforms;
            try {
              CSS.registerProperty({
                name: '--' + uniform_time.name,
                syntax: '<number>',
                initialValue: 0,
                inherits: true
              });
            } catch (e) {}
            this.is_uniform_time_registered = true;
          }
        }

        export({ scale, name, download, detail } = {}) {
          return new Promise((resolve, reject) => {
            let variables = get_all_variables(this);
            let html = this.doodle.innerHTML;

            let { width, height } = this.getBoundingClientRect();
            scale = parseInt(scale) || 1;

            let w = width * scale;
            let h = height * scale;

            let svg = `
          <svg xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            viewBox="0 0 ${ width } ${ height }"
            ${ is_safari() ? '' : `width="${ w }px" height="${ h }px"` }
          >
            <foreignObject width="100%" height="100%">
              <div
                class="host"
                xmlns="http://www.w3.org/1999/xhtml"
                style="width: ${ width }px; height: ${ height }px; "
              >
                <style>.host { ${entity(variables)} }</style>
                ${ html }
              </div>
            </foreignObject>
          </svg>
        `;

            if (download || detail) {
              svg_to_png(svg, w, h, scale)
                .then(({ source, url, blob }) => {
                  resolve({
                    width: w, height: h, svg, blob, source
                  });
                  if (download) {
                    let a = document.createElement('a');
                    a.download = normalize_png_name(name);
                    a.href = url;
                    a.click();
                  }
                })
                .catch(error => {
                  reject(error);
                });
            } else {
              resolve({
                width: w, height: h, svg: svg
              });
            }
          });
        }

        set_content(selector, styles) {
          if (styles instanceof Promise) {
            styles.then(value => {
              this.set_content(selector, value);
            });
          } else {
            const el = this.shadowRoot.querySelector(selector);
            el && (el.styleSheet
              ? (el.styleSheet.cssText = styles )
              : (el.innerHTML = styles));
          }
        }
      }
      if (!customElements.get('css-doodle')) {
        customElements.define('css-doodle', Doodle);
      }
    }

    function get_basic_styles() {
      let { uniform_time } = Uniforms;
      const inherited_grid_props = get_props(/grid/)
        .map(n => `${ n }: inherit;`)
        .join('');
      return `
    *, *::after, *::before {
      box-sizing: border-box;
      animation-play-state: var(--cssd-animation-play-state) !important
    }
    :host, .host {
      display: block;
      visibility: visible;
      width: auto;
      height: auto;
      contain: content;
      --${ uniform_time.name }: 0
    }
    :host([hidden]), .host[hidden] {
      display: none
    }
    .container {
      position: relative;
      width: 100%;
      height: 100%;
      display: grid;
      ${ inherited_grid_props }
    }
    cell {
      position: relative;
      display: grid;
      place-items: center
    }
    svg {
      position: absolute;
      width: 100%;
      height: 100%
    }
    :host([cssd-paused-animation]) {
      --cssd-animation-play-state: paused;
      animation-play-state: paused !important
    }
  `;
    }

    function get_grid_styles(grid_obj) {
      let { x, y } = grid_obj || {};
      return `
    :host, .host {
      grid-template-rows: repeat(${ y }, 1fr);
      grid-template-columns: repeat(${ x }, 1fr);
    }
  `;
    }

    function get_content(input) {
      return is_nil(input) ? '' : input;
    }

    function create_cell(x, y, z, content, child = '') {
      let id = cell_id(x, y, z);
      let head = get_content(content['#' + id]);
      let tail = get_content(child);
      return `<cell id="${id}">${head}${tail}</cell>`;
    }

    function create_grid(grid_obj, content) {
      let { x, y, z } = grid_obj || {};
      let result = '';
      if (z == 1) {
        for (let j = 1; j <= y; ++j) {
          for (let i = 1; i <= x; ++i) {
            result += create_cell(i, j, 1, content);
          }
        }
      }
      else {
        let child = '';
        for (let i = z; i >= 1; i--) {
          let cell = create_cell(1, 1, i, content, child);
          child = cell;
        }
        result = child;
      }
      return `<grid class="container">${result}</grid>`;
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=} start
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
                if (subscribers.size === 0 && stop) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function is_date(obj) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    }

    function get_interpolator(a, b) {
        if (a === b || a !== a)
            return () => a;
        const type = typeof a;
        if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
            throw new Error('Cannot interpolate values of different type');
        }
        if (Array.isArray(a)) {
            const arr = b.map((bi, i) => {
                return get_interpolator(a[i], bi);
            });
            return t => arr.map(fn => fn(t));
        }
        if (type === 'object') {
            if (!a || !b)
                throw new Error('Object cannot be null');
            if (is_date(a) && is_date(b)) {
                a = a.getTime();
                b = b.getTime();
                const delta = b - a;
                return t => new Date(a + t * delta);
            }
            const keys = Object.keys(b);
            const interpolators = {};
            keys.forEach(key => {
                interpolators[key] = get_interpolator(a[key], b[key]);
            });
            return t => {
                const result = {};
                keys.forEach(key => {
                    result[key] = interpolators[key](t);
                });
                return result;
            };
        }
        if (type === 'number') {
            const delta = b - a;
            return t => a + t * delta;
        }
        throw new Error(`Cannot interpolate ${type} values`);
    }
    function tweened(value, defaults = {}) {
        const store = writable(value);
        let task;
        let target_value = value;
        function set(new_value, opts) {
            if (value == null) {
                store.set(value = new_value);
                return Promise.resolve();
            }
            target_value = new_value;
            let previous_task = task;
            let started = false;
            let { delay = 0, duration = 400, easing = identity, interpolate = get_interpolator } = assign(assign({}, defaults), opts);
            if (duration === 0) {
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                store.set(value = target_value);
                return Promise.resolve();
            }
            const start = now() + delay;
            let fn;
            task = loop(now => {
                if (now < start)
                    return true;
                if (!started) {
                    fn = interpolate(value, new_value);
                    if (typeof duration === 'function')
                        duration = duration(value, new_value);
                    started = true;
                }
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                const elapsed = now - start;
                if (elapsed > duration) {
                    store.set(value = new_value);
                    return false;
                }
                // @ts-ignore
                store.set(value = fn(easing(elapsed / duration)));
                return true;
            });
            return task.promise;
        }
        return {
            set,
            update: (fn, opts) => set(fn(target_value, value), opts),
            subscribe: store.subscribe
        };
    }

    const page = writable('afflatus');
    const scene = writable('index');
    const loading = writable(false);
    const ctrl = writable(null);
    const data = writable({
      collections: {
        "vampire's_old_tooth": 10,
        "large_roll_of_bandages": 10,
        "skyrocket": 10,
        "magic_dart": 10,
        "mimosa": 20,
        "conch_shell": 10,
        "cherry": 10,
        "earthy_spider_wine": 10,
        "seal_needle": 10,
        "bird_wine": 10,
        "human_soul_lamp": 10,
        "patchouli's_ribbon": 10,
        "fish_stone": 4,
        "crown_of_thorns": 10,
        "bottle_of_stars": 3,
        "compass_cat": 10,
        "corvis_feathers": 10
      },
      equipment: false,
      consumables: {},
      spellcards: {
        // Stardust_Reverie: 3,
        // Master_Spark: 1,
        // Asteroid_Belt: 4,
        Earth_Light_Ray: 5,
        marisa: 0
      },
      souvenir: false,
      role: 'marisa',
      sugar: 3,
      health: 12,
      coin: 1000,
      scene: "shrine",
      lv: 50
    });
    const setting = writable({
      resource: 'kaoru'
    });
    const explore = writable({
      enermy: ['cirno', 'cirno', 'cirno'],
      event: [],
      target: [true, true, true, true, false, false],
      enermyLimit: 4,
      lv: 80
    });
    const cache$1 = writable({});

    var words = [
    	"啊啊啊我忘记了",
    	"阿吽",
    	"阿卡麟",
    	"阿空",
    	"阿燐",
    	"阿求",
    	"艾丽",
    	"爱丽丝",
    	"爱丽丝的魔法书",
    	"爱丽丝梦游仙境",
    	"爱丽丝威震天",
    	"爱莲",
    	"爱塔妮缇拉尔瓦",
    	"庵我烧了",
    	"奥莲姬",
    	"八百万之神",
    	"八坂神奈子",
    	"八分咲",
    	"八卦炉",
    	"八桥",
    	"八意永琳",
    	"八云蓝",
    	"八云紫",
    	"百鬼夜行",
    	"白鹭风茗",
    	"稗田阿求",
    	"百万鬼夜行",
    	"百药枡",
    	"白玉楼",
    	"半白泽",
    	"坂田合欢乃",
    	"宝宝巴士",
    	"抱头蹲防",
    	"包子仙",
    	"本居小铃",
    	"本子仙",
    	"彼岸",
    	"彼岸归航",
    	"比那名居天子",
    	"弁弁",
    	"博丽",
    	"博丽大结界",
    	"博丽结界",
    	"博丽灵梦",
    	"博丽神社",
    	"博丽神社例大祭",
    	"布都",
    	"布嘟嘟",
    	"不认识的孩子",
    	"不朽的曼珠沙华",
    	"擦弹",
    	"残机",
    	"缠流子",
    	"车车人",
    	"车万",
    	"沉默的兽灵",
    	"成美",
    	"赤蛮奇",
    	"重生",
    	"畜生界",
    	"畜生们的休息",
    	"船幽灵",
    	"船长",
    	"纯狐",
    	"纯妈",
    	"茨歌仙",
    	"茨木华扇",
    	"从地下的归还",
    	"萃梦想",
    	"萃香",
    	"村纱水蜜",
    	"大蛾子",
    	"大根",
    	"大蛤蟆之池",
    	"大酱",
    	"大结界",
    	"大鹫灵",
    	"大狸子",
    	"大妖精",
    	"大玉",
    	"弹幕",
    	"弹幕射击",
    	"弹幕邪天鬼",
    	"弹幕战",
    	"道中",
    	"得点",
    	"地底通路",
    	"敌机",
    	"地灵殿",
    	"地狱鸦",
    	"掉残",
    	"弔姐",
    	"吊瓶妖",
    	"凋叶棕",
    	"丁礼田",
    	"丁礼田舞",
    	"东方",
    	"东方蝉时歌",
    	"东方茨歌仙",
    	"东方萃梦想",
    	"东方大炮弹",
    	"东方大往生",
    	"东方大战争",
    	"东方地灵殿",
    	"东方绯想天",
    	"东方非想天则",
    	"东方封魔录",
    	"东方风神录",
    	"东方绀珠传",
    	"东方刚欲异闻",
    	"东方怪绮谈",
    	"东方鬼形兽",
    	"东方红楼梦",
    	"东方红魔乡",
    	"东方华烂漫",
    	"东方花映冢",
    	"东方幻想乡",
    	"东方辉针城",
    	"东方铃奈庵",
    	"东方灵异传",
    	"东方梦灵梦",
    	"东方梦时空",
    	"东方儚月抄",
    	"东方凭依华",
    	"东方清泉飨",
    	"东方求闻口授",
    	"东方求闻史纪",
    	"东方三月精",
    	"东方神灵庙",
    	"东方深秘录",
    	"东方失去之言",
    	"东方四季呗",
    	"东方天空璋",
    	"东方天上花",
    	"东方童楼遥",
    	"东方外来韦编",
    	"东方文花帖",
    	"东方香霖堂",
    	"东方心绮楼",
    	"东方星莲船",
    	"东方妖妖梦",
    	"东方萤灯筏",
    	"东方樱蝶梦",
    	"东方樱神月",
    	"东方永夜抄",
    	"东方游剧天",
    	"东方智灵奇传",
    	"东方紫香花",
    	"东方醉蝶华",
    	"东风谷早苗",
    	"动物灵",
    	"毒奶",
    	"多多良小伞",
    	"哆来咪",
    	"哆来咪苏伊特",
    	"谔谔",
    	"噩梦日记",
    	"二次创作",
    	"二设",
    	"二婶子",
    	"二岩猯藏",
    	"尔子田",
    	"尔子田里乃",
    	"法界",
    	"反魂蝶",
    	"芳香",
    	"防撞桶",
    	"非符",
    	"非想天",
    	"丰聪耳神子",
    	"风见幽香",
    	"疯帽子茶会",
    	"封魔录",
    	"风神录",
    	"封兽鵺",
    	"风之暗穴",
    	"疯中二婶子",
    	"符卡",
    	"符卡规则",
    	"芙兰",
    	"芙兰朵露",
    	"付丧神",
    	"尬舞姐妹",
    	"感情的摩天楼",
    	"绀珠传",
    	"刚欲同盟",
    	"刚欲异闻",
    	"高丽野阿吽",
    	"格斗",
    	"宫古芳香",
    	"狗椛",
    	"固定弹",
    	"鼓哥",
    	"鼓姐",
    	"古明地觉",
    	"古明地恋",
    	"怪力乱神",
    	"怪绮谈",
    	"广西烧烤摊老板",
    	"广有射怪鸟事",
    	"鬼畜妹",
    	"袿姬",
    	"鬼杰组",
    	"鬼杰组组长",
    	"鬼人正邪",
    	"鬼形兽",
    	"果果",
    	"过膝袜",
    	"航哥",
    	"好吗",
    	"河城荷取",
    	"赫卡",
    	"赫卡姐",
    	"赫卡提亚",
    	"荷取",
    	"核融炉",
    	"河童",
    	"黑谷山女",
    	"黑历史",
    	"红楼",
    	"红美铃",
    	"红萌馆",
    	"红魔馆",
    	"红魔乡",
    	"红银",
    	"红字本",
    	"虎哥",
    	"胡桃",
    	"冴月麟",
    	"椛椛",
    	"花开夜",
    	"华扇",
    	"华扇邸",
    	"花映冢",
    	"坏苹果",
    	"欢姐",
    	"幻梦缘起",
    	"幻视之夜",
    	"幻想万华镜",
    	"幻想夏乡",
    	"幻想乡",
    	"幻想乡空闪姬",
    	"幻想乡空战姬",
    	"幻想乡少女大战",
    	"幻想乡玩家",
    	"幻想跃迁实验室",
    	"幻缘团",
    	"幻月",
    	"幻跃团",
    	"黄昏立绘",
    	"辉夜",
    	"慧音",
    	"辉针城",
    	"辉针城的小人族",
    	"魂魄妖忌",
    	"魂魄妖梦",
    	"火车",
    	"霍青娥",
    	"火焰猫燐",
    	"吉弔",
    	"吉弔八千慧",
    	"姬海棠果",
    	"姬海棠极",
    	"姬海棠羽立",
    	"鸡妹",
    	"寄世界于偶像",
    	"键山雏",
    	"间歇泉",
    	"奖残",
    	"奖分",
    	"姐贵",
    	"结界",
    	"禁忌的魔法",
    	"矜羯罗",
    	"今泉影狼",
    	"今天也是好天气",
    	"今昔幻想乡",
    	"劲牙组",
    	"劲牙组组长",
    	"堇子",
    	"京都幻想剧团",
    	"静叶",
    	"囧仙",
    	"囧仙子",
    	"旧地狱遗址",
    	"旧都",
    	"九十九八桥",
    	"九十九弁弁",
    	"九天瀑布",
    	"菊理",
    	"决死符",
    	"卡娜安娜贝拉尔",
    	"考据党",
    	"可悲的人偶",
    	"克劳恩",
    	"克劳恩皮丝",
    	"堀川雷鼓",
    	"狂气之瞳",
    	"蓝妈",
    	"狼女",
    	"老娘是最强",
    	"乐航",
    	"乐囧",
    	"蕾蒂",
    	"蕾蒂霍瓦特洛克",
    	"蕾拉",
    	"蕾米",
    	"雷咪",
    	"蕾米莉亚",
    	"例大祭",
    	"莉格露",
    	"莉格露奈特巴格",
    	"骊驹早鬼",
    	"莉莉",
    	"莉莉白",
    	"莉莉黑",
    	"莉莉霍瓦特",
    	"莉莉卡",
    	"里乃",
    	"里香",
    	"恋恋",
    	"莲妈",
    	"莲子",
    	"铃二",
    	"铃瑚",
    	"灵力",
    	"灵梦",
    	"铃奈庵",
    	"灵乌路空",
    	"铃仙",
    	"铃仙二号",
    	"灵异传",
    	"灵知的太阳信仰",
    	"留琴",
    	"辘轳首",
    	"露米娅",
    	"露娜",
    	"露娜切露德",
    	"露娜萨",
    	"露易兹",
    	"轮椅战神",
    	"萝卜",
    	"洛天依",
    	"绿头发的爸爸",
    	"绿眼的嫉妒",
    	"玛艾露贝莉赫恩",
    	"玛格特罗依德邸",
    	"麻将山",
    	"玛露奇",
    	"满福神社",
    	"馒馒来",
    	"毛玉",
    	"梅蒂欣梅兰可莉",
    	"美国酱",
    	"妹红",
    	"梅丽",
    	"梅莉",
    	"美铃",
    	"梅露兰",
    	"魅魔",
    	"梦殿大祀庙",
    	"梦时空",
    	"梦想天生",
    	"梦消失",
    	"梦月",
    	"儚月抄",
    	"梦子",
    	"秘封",
    	"蜜蜂",
    	"秘封厨",
    	"秘封噩梦日记",
    	"秘封活动记录",
    	"秘封组",
    	"米国酱",
    	"米国小妖精",
    	"咪咪号",
    	"秘神摩多罗",
    	"米斯蒂娅",
    	"米斯蒂娅萝蕾拉",
    	"迷途之家",
    	"迷途竹林",
    	"面灵气",
    	"绵月丰姬",
    	"绵月依姬",
    	"苗苗",
    	"苗爷",
    	"冥界",
    	"命莲",
    	"命莲寺",
    	"明罗",
    	"摸多了硬起来",
    	"摩多罗",
    	"摩多罗隐岐奈",
    	"魔法森林",
    	"魔法使",
    	"魔理沙",
    	"摩妈",
    	"磨米机",
    	"摩托罗拉",
    	"摩西的奇迹",
    	"娜兹玲",
    	"牛妈",
    	"牛崎润美",
    	"女苑",
    	"帕露西",
    	"帕琪",
    	"帕秋莉",
    	"帕秋莉诺蕾姬",
    	"判定点",
    	"蓬莱人",
    	"蓬莱山辉夜",
    	"凭依华",
    	"琪露诺",
    	"骑士之夜",
    	"琪斯美",
    	"千年幻想乡",
    	"桥姬",
    	"秦河胜",
    	"秦心",
    	"青娥",
    	"清兰",
    	"青蛙子",
    	"秋静叶",
    	"秋穰子",
    	"求闻口授",
    	"求闻史纪",
    	"犬走椛",
    	"穰子",
    	"人间之里",
    	"人形裁判",
    	"人形使",
    	"人鱼",
    	"戎璎花",
    	"入道",
    	"乳町",
    	"若鹭姬",
    	"萨拉",
    	"萨丽艾尔",
    	"三分咲",
    	"三途川",
    	"伞妖",
    	"三月精",
    	"桑尼",
    	"桑尼米尔克",
    	"骚灵",
    	"森近霖之助",
    	"山姥",
    	"山女",
    	"山彦",
    	"上白泽慧音",
    	"烧烤摊老板",
    	"少名针妙丸",
    	"少女幻葬",
    	"少女绮想曲",
    	"射命丸文",
    	"社团",
    	"神话幻想",
    	"神灵",
    	"神灵庙",
    	"神妈",
    	"深秘录",
    	"神奈子",
    	"神绮",
    	"神社闭店之日",
    	"神玉",
    	"神子",
    	"圣白莲",
    	"圣德传说",
    	"圣德太子",
    	"圣德太子的马",
    	"圣德太子的天马",
    	"圣莲船",
    	"生死之境",
    	"世界美咲剧场",
    	"十六夜",
    	"十六夜咲夜",
    	"矢田寺成美",
    	"兽道",
    	"寿命论",
    	"兽娘幻想入",
    	"兽人",
    	"守矢神社",
    	"双七",
    	"水桥帕露西",
    	"水獭灵",
    	"四重存在",
    	"四季",
    	"四季大人",
    	"四季撒吗",
    	"四季撒吗我有罪",
    	"四季映姬",
    	"斯卡雷特",
    	"死灵",
    	"死神",
    	"四十米大刀",
    	"斯塔",
    	"斯塔萨菲娅",
    	"死亡幻想曲",
    	"寺子屋",
    	"苏格拉底",
    	"苏我屠自古",
    	"随机弹",
    	"砕月",
    	"碎月",
    	"太田顺也",
    	"太阳花田",
    	"太子的马",
    	"探女",
    	"探女老仙",
    	"陶瓷的杖刀人",
    	"藤原妹红",
    	"天狗",
    	"天空璋",
    	"天人",
    	"天探女",
    	"天邪鬼",
    	"天子",
    	"条纹过膝袜",
    	"庭渡久侘歌",
    	"同人",
    	"土蜘蛛",
    	"土著信仰",
    	"屠自古",
    	"豚乙女",
    	"外界",
    	"外来人",
    	"外来韦编",
    	"亡灵",
    	"威严满满",
    	"胃炎满满",
    	"文花帖",
    	"文文",
    	"我会自己上厕所",
    	"我做东方鬼畜音",
    	"物部布都",
    	"五分咲",
    	"无何有之乡",
    	"无名之丘",
    	"雾雨",
    	"雾雨魔理沙",
    	"无缘冢",
    	"雾之湖",
    	"稀神探女",
    	"西行寺幽幽子",
    	"吸血鬼",
    	"下压",
    	"仙界",
    	"现界",
    	"仙人",
    	"现世的秘术师",
    	"香霖堂",
    	"乡长",
    	"响子",
    	"消弹",
    	"小町",
    	"小恶魔",
    	"小老帝",
    	"小铃",
    	"小米弹",
    	"小人族",
    	"小伞",
    	"小桶",
    	"小兔姬",
    	"小碗",
    	"小五",
    	"咲夜",
    	"小野冢小町",
    	"泄矢诹访子",
    	"心酱",
    	"心绮楼",
    	"心之所在",
    	"星莲船",
    	"星条旗的小丑",
    	"星熊杯",
    	"星熊勇仪",
    	"幸运与不幸",
    	"星之器",
    	"续关",
    	"玄武之泽",
    	"玄爷",
    	"玄云海",
    	"阎魔",
    	"妖虫",
    	"妖怪狸",
    	"妖怪鼠",
    	"妖怪之山",
    	"妖精",
    	"妖精大战争",
    	"妖梦",
    	"妖兽",
    	"妖兔",
    	"妖妖跋扈",
    	"妖妖梦",
    	"鵺酱",
    	"野狼灵",
    	"野蛮至极",
    	"爷们红",
    	"夜雀",
    	"爷是恋恋",
    	"一般通过",
    	"一般通过山女",
    	"异变",
    	"伊吹萃香",
    	"伊吹瓢",
    	"伊吹西瓜",
    	"一分咲",
    	"衣玖",
    	"依莉斯",
    	"一轮",
    	"一设",
    	"依神女苑",
    	"依神紫苑",
    	"易者",
    	"引弹",
    	"因幡帝",
    	"因幡天为",
    	"隐匿的四季",
    	"隐岐奈",
    	"寅丸星",
    	"阴阳玉",
    	"樱花樱花",
    	"影狼",
    	"永动之龛",
    	"永江衣玖",
    	"永琳",
    	"永夜抄",
    	"勇仪",
    	"永远的春梦",
    	"永远的满月",
    	"永远亭",
    	"幽闭星光",
    	"有顶天",
    	"幽谷响子",
    	"幽幻魔眼",
    	"油库里",
    	"幽灵",
    	"幽冥结界",
    	"幽香",
    	"幽幽子",
    	"御伽之国的鬼岛",
    	"玉米棒子",
    	"欲望加速",
    	"宇佐见堇子",
    	"宇佐见莲子",
    	"原点组",
    	"原始的节拍",
    	"远野幻想物语",
    	"越共",
    	"乐器妖怪",
    	"月人",
    	"月时计",
    	"月兔",
    	"月之都",
    	"云居一轮",
    	"云山",
    	"再思之道",
    	"早鬼",
    	"早苗",
    	"杖刀偶磨弓",
    	"长者",
    	"折返",
    	"这是好的",
    	"真吉八弔",
    	"针妙丸",
    	"正邪",
    	"埴安神袿姬",
    	"智灵奇传",
    	"埴轮兵长",
    	"中弹",
    	"终符",
    	"朱鹭子",
    	"竹取飞翔",
    	"转转",
    	"壮族大妈",
    	"自机",
    	"自机狙",
    	"紫老太",
    	"紫妈",
    	"紫妹",
    	"紫奶奶",
    	"紫婆婆",
    	"紫香花",
    	"紫苑",
    	"诹访湖",
    	"诹访子",
    	"醉蝶华",
    	"佐渡的二岩"
    ];

    /* src\page\loader.svelte generated by Svelte v3.59.2 */
    const file$c = "src\\page\\loader.svelte";

    function get_each_context$7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	child_ctx[17] = i;
    	return child_ctx;
    }

    // (79:4) {#each [txt1, txt2, txt3, txt4, txt5, txt6, txt7, txt8, txt9, txt0] as p, i (i)}
    function create_each_block$7(key_1, ctx) {
    	let txt;
    	let t0_value = /*p*/ ctx[15].word + "";
    	let t0;
    	let t1;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			txt = element("txt");
    			t0 = text(t0_value);
    			t1 = space();
    			set_style(txt, "left", /*p*/ ctx[15].x);
    			set_style(txt, "top", /*p*/ ctx[15].y);
    			set_style(txt, "font-size", 26 - r$5() * 8 + "px");
    			set_style(txt, "animation-delay", /*i*/ ctx[17] * 0.2 + "s");
    			attr_dev(txt, "class", "svelte-dyofzd");
    			add_location(txt, file$c, 79, 6, 2141);
    			this.first = txt;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, txt, anchor);
    			append_dev(txt, t0);
    			append_dev(txt, t1);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*txt1, txt2, txt3, txt4, txt5, txt6, txt7, txt8, txt9, txt0*/ 1023 && t0_value !== (t0_value = /*p*/ ctx[15].word + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*txt1, txt2, txt3, txt4, txt5, txt6, txt7, txt8, txt9, txt0*/ 1023) {
    				set_style(txt, "left", /*p*/ ctx[15].x);
    			}

    			if (dirty & /*txt1, txt2, txt3, txt4, txt5, txt6, txt7, txt8, txt9, txt0*/ 1023) {
    				set_style(txt, "top", /*p*/ ctx[15].y);
    			}

    			if (dirty & /*txt1, txt2, txt3, txt4, txt5, txt6, txt7, txt8, txt9, txt0*/ 1023) {
    				set_style(txt, "animation-delay", /*i*/ ctx[17] * 0.2 + "s");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(txt);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$7.name,
    		type: "each",
    		source: "(79:4) {#each [txt1, txt2, txt3, txt4, txt5, txt6, txt7, txt8, txt9, txt0] as p, i (i)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let div1;
    	let div0;
    	let each_blocks = [];
    	let each_1_lookup = new Map();

    	let each_value = [
    		/*txt1*/ ctx[0],
    		/*txt2*/ ctx[1],
    		/*txt3*/ ctx[2],
    		/*txt4*/ ctx[3],
    		/*txt5*/ ctx[4],
    		/*txt6*/ ctx[5],
    		/*txt7*/ ctx[6],
    		/*txt8*/ ctx[7],
    		/*txt9*/ ctx[8],
    		/*txt0*/ ctx[9]
    	];

    	validate_each_argument(each_value);
    	const get_key = ctx => /*i*/ ctx[17];
    	validate_each_keys(ctx, each_value, get_each_context$7, get_key);

    	for (let i = 0; i < 10; i += 1) {
    		let child_ctx = get_each_context$7(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$7(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < 10; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "words svelte-dyofzd");
    			set_style(div0, "opacity", /*$opacity*/ ctx[11]);
    			add_location(div0, file$c, 77, 2, 2001);
    			attr_dev(div1, "class", "body svelte-dyofzd");
    			set_style(div1, "z-index", /*z*/ ctx[10]);
    			set_style(div1, "opacity", /*$opacity*/ ctx[11]);
    			add_location(div1, file$c, 76, 0, 1940);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			for (let i = 0; i < 10; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div0, null);
    				}
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*txt1, txt2, txt3, txt4, txt5, txt6, txt7, txt8, txt9, txt0, r*/ 1023) {
    				each_value = [
    					/*txt1*/ ctx[0],
    					/*txt2*/ ctx[1],
    					/*txt3*/ ctx[2],
    					/*txt4*/ ctx[3],
    					/*txt5*/ ctx[4],
    					/*txt6*/ ctx[5],
    					/*txt7*/ ctx[6],
    					/*txt8*/ ctx[7],
    					/*txt9*/ ctx[8],
    					/*txt0*/ ctx[9]
    				];

    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$7, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div0, destroy_block, create_each_block$7, null, get_each_context$7);
    			}

    			if (dirty & /*$opacity*/ 2048) {
    				set_style(div0, "opacity", /*$opacity*/ ctx[11]);
    			}

    			if (dirty & /*z*/ 1024) {
    				set_style(div1, "z-index", /*z*/ ctx[10]);
    			}

    			if (dirty & /*$opacity*/ 2048) {
    				set_style(div1, "opacity", /*$opacity*/ ctx[11]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);

    			for (let i = 0; i < 10; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function r$5() {
    	return Math.random();
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let $opacity;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Loader', slots, []);

    	const wwords = [
    		"东方",
    		"幻想",
    		"神社",
    		"巫女",
    		"妖怪",
    		"妖精",
    		"符卡",
    		"结界",
    		"彼岸花",
    		"魔法使",
    		"山麓",
    		"提灯",
    		"八目鳗",
    		"冥界",
    		"隙间",
    		"楼观剑",
    		"八卦炉",
    		"祭典",
    		"雀酒",
    		"月兔",
    		"地灵殿",
    		"向日葵",
    		"枫叶",
    		"兽道"
    	];

    	let txt1 = random();
    	let txt2 = random();
    	let txt3 = random();
    	let txt4 = random();
    	let txt5 = random();
    	let txt6 = random();
    	let txt7 = random();
    	let txt8 = random();
    	let txt9 = random();
    	let txt0 = random();
    	setTimeout(_ => setInterval(_ => $$invalidate(0, txt1 = random()), 2000), 200 * 0);
    	setTimeout(_ => setInterval(_ => $$invalidate(1, txt2 = random()), 2000), 200 * 1);
    	setTimeout(_ => setInterval(_ => $$invalidate(2, txt3 = random()), 2000), 200 * 2);
    	setTimeout(_ => setInterval(_ => $$invalidate(3, txt4 = random()), 2000), 200 * 3);
    	setTimeout(_ => setInterval(_ => $$invalidate(4, txt5 = random()), 2000), 200 * 4);
    	setTimeout(_ => setInterval(_ => $$invalidate(5, txt6 = random()), 2000), 200 * 5);
    	setTimeout(_ => setInterval(_ => $$invalidate(6, txt7 = random()), 2000), 200 * 6);
    	setTimeout(_ => setInterval(_ => $$invalidate(7, txt8 = random()), 2000), 200 * 7);
    	setTimeout(_ => setInterval(_ => $$invalidate(8, txt9 = random()), 2000), 200 * 8);
    	setTimeout(_ => setInterval(_ => $$invalidate(9, txt0 = random()), 2000), 200 * 9);

    	function random() {
    		return {
    			x: `${-40 - 160 * r$5()}px`,
    			y: `${80 - 160 * r$5()}px`,
    			word: words[Math.floor(r$5() * words.length)]
    		};
    	}

    	let z = 0;
    	const opacity = tweened(0, { duration: 250, easing: identity });
    	validate_store(opacity, 'opacity');
    	component_subscribe($$self, opacity, value => $$invalidate(11, $opacity = value));

    	loading.subscribe(i => {
    		setTimeout(_ => $$invalidate(10, z = Number(i) - 1), i ? 0 : 200);
    		opacity.set(Number(i));
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Loader> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		tweened,
    		linear: identity,
    		page,
    		loading,
    		words,
    		wwords,
    		txt1,
    		txt2,
    		txt3,
    		txt4,
    		txt5,
    		txt6,
    		txt7,
    		txt8,
    		txt9,
    		txt0,
    		random,
    		r: r$5,
    		z,
    		opacity,
    		$opacity
    	});

    	$$self.$inject_state = $$props => {
    		if ('txt1' in $$props) $$invalidate(0, txt1 = $$props.txt1);
    		if ('txt2' in $$props) $$invalidate(1, txt2 = $$props.txt2);
    		if ('txt3' in $$props) $$invalidate(2, txt3 = $$props.txt3);
    		if ('txt4' in $$props) $$invalidate(3, txt4 = $$props.txt4);
    		if ('txt5' in $$props) $$invalidate(4, txt5 = $$props.txt5);
    		if ('txt6' in $$props) $$invalidate(5, txt6 = $$props.txt6);
    		if ('txt7' in $$props) $$invalidate(6, txt7 = $$props.txt7);
    		if ('txt8' in $$props) $$invalidate(7, txt8 = $$props.txt8);
    		if ('txt9' in $$props) $$invalidate(8, txt9 = $$props.txt9);
    		if ('txt0' in $$props) $$invalidate(9, txt0 = $$props.txt0);
    		if ('z' in $$props) $$invalidate(10, z = $$props.z);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		txt1,
    		txt2,
    		txt3,
    		txt4,
    		txt5,
    		txt6,
    		txt7,
    		txt8,
    		txt9,
    		txt0,
    		z,
    		$opacity,
    		opacity
    	];
    }

    class Loader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Loader",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function scale(node, { delay = 0, duration = 400, easing = cubicOut, start = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const sd = 1 - start;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `
			transform: ${transform} scale(${1 - (sd * u)});
			opacity: ${target_opacity - (od * u)}
		`
        };
    }

    /* src\page\index.svelte generated by Svelte v3.59.2 */
    const file$b = "src\\page\\index.svelte";

    // (62:2) {#if !pressed}
    function create_if_block_2$3(ctx) {
    	let txt;
    	let txt_outro;
    	let current;

    	const block = {
    		c: function create() {
    			txt = element("txt");
    			txt.textContent = "Press Any Key";
    			attr_dev(txt, "class", "launch svelte-1xrc41q");
    			add_location(txt, file$b, 62, 4, 1405);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, txt, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (txt_outro) txt_outro.end(1);
    			current = true;
    		},
    		o: function outro(local) {
    			txt_outro = create_out_transition(txt, fade, { duration: 250 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(txt);
    			if (detaching && txt_outro) txt_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$3.name,
    		type: "if",
    		source: "(62:2) {#if !pressed}",
    		ctx
    	});

    	return block;
    }

    // (105:2) {:else}
    function create_else_block(ctx) {
    	let txt;

    	const block = {
    		c: function create() {
    			txt = element("txt");
    			txt.textContent = "幻想异闻录";
    			attr_dev(txt, "class", "title svelte-1xrc41q");
    			add_location(txt, file$b, 105, 4, 2551);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, txt, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(txt);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(105:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (65:2) {#if doodle}
    function create_if_block_1$3(ctx) {
    	let div;
    	let css_doodle;
    	let style;

    	const block = {
    		c: function create() {
    			div = element("div");
    			css_doodle = element("css-doodle");
    			style = element("style");
    			style.textContent = ":doodle {\r\n            @grid: 13 / 100vmax;\r\n            @min-size: 800px;\r\n          }\r\n          :container {\r\n            transform: rotateY(30deg) rotate(10deg) scale(1.5);\r\n          }\r\n          :after {\r\n            content: \"\";\r\n            @size: 61.8%;\r\n            background-size: @rand (5%, 50%) @rand (5%, 50%);\r\n            background-position: center;\r\n          }\r\n          @even {\r\n            background: #df0054;\r\n            :after {\r\n              background-image: linear-gradient(\r\n                0deg,\r\n                #f7f1e7 50%,\r\n                transparent 50%\r\n              );\r\n            }\r\n          }\r\n          @odd {\r\n            background: @pick (#f7f1e7, #10004a);\r\n            :after {\r\n              background-image: linear-gradient(\r\n                90deg,\r\n                #df0054 50%,\r\n                transparent 50%\r\n              );\r\n            }\r\n          }";
    			add_location(style, file$b, 67, 8, 1553);
    			add_location(css_doodle, file$b, 66, 6, 1531);
    			attr_dev(div, "class", "title svelte-1xrc41q");
    			add_location(div, file$b, 65, 4, 1504);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, css_doodle);
    			append_dev(css_doodle, style);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(65:2) {#if doodle}",
    		ctx
    	});

    	return block;
    }

    // (108:2) {#if pressed}
    function create_if_block$4(ctx) {
    	let div;
    	let txt0;
    	let t1;
    	let txt1;
    	let t3;
    	let txt2;
    	let t5;
    	let txt3;
    	let div_intro;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			txt0 = element("txt");
    			txt0.textContent = "开始";
    			t1 = space();
    			txt1 = element("txt");
    			txt1.textContent = "灵感";
    			t3 = space();
    			txt2 = element("txt");
    			txt2.textContent = "设定";
    			t5 = space();
    			txt3 = element("txt");
    			txt3.textContent = "离去";
    			attr_dev(txt0, "class", "svelte-1xrc41q");
    			add_location(txt0, file$b, 109, 6, 2679);
    			attr_dev(txt1, "class", "svelte-1xrc41q");
    			add_location(txt1, file$b, 110, 6, 2739);
    			attr_dev(txt2, "class", "svelte-1xrc41q");
    			add_location(txt2, file$b, 111, 6, 2799);
    			attr_dev(txt3, "class", "svelte-1xrc41q");
    			add_location(txt3, file$b, 112, 6, 2820);
    			attr_dev(div, "class", "menu svelte-1xrc41q");
    			add_location(div, file$b, 108, 4, 2613);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, txt0);
    			append_dev(div, t1);
    			append_dev(div, txt1);
    			append_dev(div, t3);
    			append_dev(div, txt2);
    			append_dev(div, t5);
    			append_dev(div, txt3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(txt0, "click", /*click_handler*/ ctx[3], false, false, false, false),
    					listen_dev(txt1, "click", /*click_handler_1*/ ctx[4], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (!div_intro) {
    				add_render_callback(() => {
    					div_intro = create_in_transition(div, fade, { delay: 250, duration: 250 });
    					div_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(108:2) {#if pressed}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let div_intro;
    	let div_outro;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = !/*pressed*/ ctx[0] && create_if_block_2$3(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*doodle*/ ctx[2]) return create_if_block_1$3;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block1 = current_block_type(ctx);
    	let if_block2 = /*pressed*/ ctx[0] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(div, "class", "body svelte-1xrc41q");
    			add_location(div, file$b, 9, 0, 177);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);
    			if_block1.m(div, null);
    			append_dev(div, t1);
    			if (if_block2) if_block2.m(div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler_2*/ ctx[5], { once: true }, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*pressed*/ ctx[0]) {
    				if (if_block0) {
    					if (dirty & /*pressed*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2$3(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*pressed*/ ctx[0]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*pressed*/ 1) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block$4(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block2);

    			add_render_callback(() => {
    				if (!current) return;
    				if (div_outro) div_outro.end(1);
    				div_intro = create_in_transition(div, fade, { duration: 250 });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fade, { duration: 250 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if_block1.d();
    			if (if_block2) if_block2.d();
    			if (detaching && div_outro) div_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let $page;
    	validate_store(page, 'page');
    	component_subscribe($$self, page, $$value => $$invalidate(1, $page = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Page', slots, []);
    	let doodle = false;
    	let pressed = false;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Page> was created with unknown prop '${key}'`);
    	});

    	const click_handler = _ => set_store_value(page, $page = "foreword", $page);
    	const click_handler_1 = _ => set_store_value(page, $page = "afflatus", $page);
    	const click_handler_2 = _ => $$invalidate(0, pressed = true);

    	$$self.$capture_state = () => ({
    		fade,
    		scale,
    		page,
    		loading,
    		ctrl,
    		doodle,
    		pressed,
    		$page
    	});

    	$$self.$inject_state = $$props => {
    		if ('doodle' in $$props) $$invalidate(2, doodle = $$props.doodle);
    		if ('pressed' in $$props) $$invalidate(0, pressed = $$props.pressed);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [pressed, $page, doodle, click_handler, click_handler_1, click_handler_2];
    }

    class Page extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Page",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    var sort$7 = [
    	"s1",
    	"s3",
    	"s5"
    ];
    var s1 = {
    	title: "一块",
    	detail: "只有一个选择才真正有趣啊！",
    	type: "sugar"
    };
    var s3 = {
    	title: "三块",
    	detail: "那就折衷吧...",
    	type: "sugar"
    };
    var s5 = {
    	title: "五块",
    	detail: "我的控制欲还蛮强的。",
    	type: "sugar"
    };
    var sugar = {
    	sort: sort$7,
    	s1: s1,
    	s3: s3,
    	s5: s5
    };

    var sort$6 = [
    	"reimu",
    	"marisa",
    	"shion",
    	"aya",
    	"youmu"
    ];
    var reimu$1 = {
    	title: "博丽灵梦",
    	detail: "超乎常人的幸运，她的直觉几乎一定会命中。",
    	talent: ""
    };
    var marisa$1 = {
    	title: "雾雨魔理沙",
    	detail: "弹幕最重要的是火力！"
    };
    var shion = {
    	title: "依神紫苑",
    	detail: "失去的财产，还有运气究竟去了哪里呢。"
    };
    var aya = {
    	title: "射命丸文",
    	detail: "来吧，我会手下留情的。"
    };
    var youmu$1 = {
    	title: "魂魄妖梦",
    	detail: "半人半灵的半吊子。但是剑有两把。",
    	talent: "所有暴击率转化为暴击伤害。每消耗一点灵力，获得一层通灵(闪避几率+10%)，每触发一次闪避减少三层通灵并对伤害来源发动一次必定暴击的普通攻击，回合初清除通灵。"
    };
    var role$1 = {
    	sort: sort$6,
    	reimu: reimu$1,
    	marisa: marisa$1,
    	shion: shion,
    	aya: aya,
    	youmu: youmu$1
    };

    /* src\addon\selector.svelte generated by Svelte v3.59.2 */
    const file$a = "src\\addon\\selector.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (22:2) {#each selections as value, i (i)}
    function create_each_block$6(key_1, ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let a0;
    	let t1_value = /*info*/ ctx[3][/*type*/ ctx[1]][/*value*/ ctx[8]].title + "";
    	let t1;
    	let t2;
    	let div0;
    	let a1;
    	let t3_value = /*info*/ ctx[3][/*type*/ ctx[1]][/*value*/ ctx[8]].detail + "";
    	let t3;
    	let t4;
    	let div1_class_value;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[6](/*value*/ ctx[8], ...args);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			a0 = element("a");
    			t1 = text(t1_value);
    			t2 = space();
    			div0 = element("div");
    			a1 = element("a");
    			t3 = text(t3_value);
    			t4 = space();
    			if (!src_url_equal(img.src, img_src_value = /*icon*/ ctx[5](/*type*/ ctx[1], /*value*/ ctx[8]))) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-1dkcu88");
    			add_location(img, file$a, 34, 6, 967);
    			attr_dev(a0, "class", "svelte-1dkcu88");
    			add_location(a0, file$a, 35, 6, 1006);
    			attr_dev(a1, "class", "svelte-1dkcu88");
    			add_location(a1, file$a, 37, 8, 1061);
    			attr_dev(div0, "class", "svelte-1dkcu88");
    			add_location(div0, file$a, 36, 6, 1046);
    			attr_dev(div1, "class", div1_class_value = "selection animation_" + (/*selected*/ ctx[0] ? 'close' : 'open') + "Selections" + " svelte-1dkcu88");
    			add_location(div1, file$a, 22, 4, 549);
    			this.first = div1;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, a0);
    			append_dev(a0, t1);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, a1);
    			append_dev(a1, t3);
    			append_dev(div1, t4);

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", click_handler, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*type*/ 2 && !src_url_equal(img.src, img_src_value = /*icon*/ ctx[5](/*type*/ ctx[1], /*value*/ ctx[8]))) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*type*/ 2 && t1_value !== (t1_value = /*info*/ ctx[3][/*type*/ ctx[1]][/*value*/ ctx[8]].title + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*type*/ 2 && t3_value !== (t3_value = /*info*/ ctx[3][/*type*/ ctx[1]][/*value*/ ctx[8]].detail + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*selected*/ 1 && div1_class_value !== (div1_class_value = "selection animation_" + (/*selected*/ ctx[0] ? 'close' : 'open') + "Selections" + " svelte-1dkcu88")) {
    				attr_dev(div1, "class", div1_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$6.name,
    		type: "each",
    		source: "(22:2) {#each selections as value, i (i)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_value = /*selections*/ ctx[4];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*i*/ ctx[10];
    	validate_each_keys(ctx, each_value, get_each_context$6, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$6(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$6(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "selections svelte-1dkcu88");
    			add_location(div, file$a, 20, 0, 481);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*selected, type, Number, selections, $data, info, icon*/ 63) {
    				each_value = /*selections*/ ctx[4];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$6, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, destroy_block, create_each_block$6, null, get_each_context$6);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let $setting;
    	let $data;
    	validate_store(setting, 'setting');
    	component_subscribe($$self, setting, $$value => $$invalidate(7, $setting = $$value));
    	validate_store(data, 'data');
    	component_subscribe($$self, data, $$value => $$invalidate(2, $data = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Selector', slots, []);
    	let { type } = $$props;
    	let { selected } = $$props;
    	const info = { sugar, role: role$1 };
    	let selections = deepCopy(info[type]).sort.rd().slice(0, $data.sugar);

    	const icon = (type, value) => {
    		return ({
    			role: `/img/role/${$setting.resource}/${value}.webp`,
    			sugar: `/svg/sugar.svg`
    		})[type];
    	};

    	$$self.$$.on_mount.push(function () {
    		if (type === undefined && !('type' in $$props || $$self.$$.bound[$$self.$$.props['type']])) {
    			console.warn("<Selector> was created without expected prop 'type'");
    		}

    		if (selected === undefined && !('selected' in $$props || $$self.$$.bound[$$self.$$.props['selected']])) {
    			console.warn("<Selector> was created without expected prop 'selected'");
    		}
    	});

    	const writable_props = ['type', 'selected'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Selector> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (value, _) => {
    		$$invalidate(0, selected = true);
    		let v = type == "sugar" ? Number(value.slice(1)) : value;

    		if (["equipment", "role", "sugar"].includes(type)) set_store_value(data, $data[type] = v, $data); else {
    			if (value in $data[type]) set_store_value(data, $data[type][v]++, $data); else set_store_value(data, $data[type][v] = 1, $data);
    		}
    	};

    	$$self.$$set = $$props => {
    		if ('type' in $$props) $$invalidate(1, type = $$props.type);
    		if ('selected' in $$props) $$invalidate(0, selected = $$props.selected);
    	};

    	$$self.$capture_state = () => ({
    		data,
    		setting,
    		sugar,
    		role: role$1,
    		type,
    		selected,
    		info,
    		selections,
    		icon,
    		$setting,
    		$data
    	});

    	$$self.$inject_state = $$props => {
    		if ('type' in $$props) $$invalidate(1, type = $$props.type);
    		if ('selected' in $$props) $$invalidate(0, selected = $$props.selected);
    		if ('selections' in $$props) $$invalidate(4, selections = $$props.selections);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [selected, type, $data, info, selections, icon, click_handler];
    }

    class Selector extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { type: 1, selected: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Selector",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get type() {
    		throw new Error("<Selector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Selector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<Selector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Selector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var sort$5 = {
    	marisa: [
    		"Stardust_Reverie",
    		"Master_Spark",
    		"Asteroid_Belt",
    		"Orrery's_Sun",
    		"Earth_Light_Ray"
    	],
    	medicine: [
    		"Nerve_Poison",
    		"Melancholy_Poison",
    		"Gassing_Garden",
    		"Poison_Breath",
    		"Into_Delirium"
    	],
    	reimu: [
    		"Dream_Seal",
    		"Demon_Seal_Circle",
    		"Double_Bound",
    		"The_Jade",
    		"Dream_Born"
    	],
    	youmu: [
    		"Bright_Bitter_Wheel",
    		"Six_Roots_Clean",
    		"Centered_Flow",
    		"Future_Never_Survive",
    		"Graciousness_Maze"
    	]
    };
    var marisa = {
    	name: "魔法弹",
    	detail: "对目标造成120%攻击力伤害。",
    	output: {
    		attack: [
    			{
    				type: "scale",
    				value: "120",
    				aim: "one"
    			}
    		]
    	}
    };
    var Stardust_Reverie = {
    	name: "星尘幻想",
    	detail: "对目标造成400%攻击力伤害，对其余敌人造成80%攻击力伤害。",
    	output: {
    		attack: [
    			{
    				type: "scale",
    				value: "400",
    				aim: "one"
    			},
    			{
    				type: "scale",
    				value: "80",
    				aim: "else"
    			}
    		]
    	}
    };
    var Master_Spark = {
    	name: "极限火花",
    	detail: "对每个敌人造成360%攻击力伤害，下回合无法行动。",
    	allAim: true,
    	output: {
    		attack: [
    			{
    				type: "scale",
    				value: "360",
    				aim: "all"
    			}
    		],
    		buff: [
    			{
    				value: "hypodynamic",
    				amount: "1",
    				aim: "self"
    			}
    		]
    	}
    };
    var Asteroid_Belt = {
    	name: "小行星带",
    	detail: "对每个敌人造成4x50%攻击力伤害。",
    	allAim: true,
    	output: {
    		attack: [
    			{
    				type: "scale",
    				value: "50",
    				aim: "all",
    				amount: "4"
    			}
    		]
    	}
    };
    var Earth_Light_Ray = {
    	name: "地球光",
    	detail: "将600%攻击力伤害平摊给所有敌人",
    	allAim: true,
    	output: {
    		attack: [
    			{
    				type: "scale",
    				value: "600",
    				aim: "average"
    			}
    		]
    	}
    };
    var medicine = {
    };
    var Nerve_Poison = {
    	name: "神经之毒",
    	detail: ""
    };
    var Melancholy_Poison = {
    	name: "忧郁之毒",
    	detail: ""
    };
    var Gassing_Garden = {
    	name: "毒气花园",
    	detail: ""
    };
    var Poison_Breath = {
    	name: "猛毒气息",
    	detail: ""
    };
    var Into_Delirium = {
    	name: "进入疯狂",
    	detail: ""
    };
    var reimu = {
    };
    var Dream_Seal = {
    	name: "梦想封印",
    	detail: "分别对随机目标造成8*10%对方当前生命值的伤害。不会暴击。"
    };
    var Demon_Seal_Circle = {
    	name: "封魔阵",
    	detail: "无效化目标下回合的直接攻击。"
    };
    var Double_Bound = {
    	name: "二重结界",
    	detail: "下一回合，受到伤害时会返还同样的伤害。"
    };
    var The_Jade = {
    	name: "阴阳鬼神玉",
    	detail: "对目标造成400%攻击力伤害。"
    };
    var Dream_Born = {
    	name: "梦想天生",
    	detail: "接下来的七次攻击有15%概率使自己免受一次伤害，第七次获得自身当前血量50%的护盾。"
    };
    var youmu = {
    	name: "剑气",
    	detail: "对目标造成2*50%攻击力伤害。",
    	output: {
    		attack: [
    			{
    				type: "scale",
    				value: "50",
    				aim: "one",
    				amount: "2"
    			}
    		]
    	}
    };
    var Bright_Bitter_Wheel$1 = {
    	name: "幽明的苦轮",
    	detail: "半灵将重复你接下来的三次攻击，造成60%间接伤害，每次回复一点灵力。"
    };
    var Six_Roots_Clean = {
    	name: "六根清净斩",
    	detail: "闪避下次受到的攻击并对每个敌人造成180%攻击力伤害。"
    };
    var Centered_Flow = {
    	name: "圆心流转斩",
    	detail: "对每个敌人造成3*40%攻击力伤害，下一次普通攻击造成的伤害提高40%。"
    };
    var Future_Never_Survive = {
    	name: "未来永劫斩",
    	detail: "对目标造成300%攻击力伤害，接下来三次普通攻击变为2*70%。"
    };
    var Graciousness_Maze = {
    	name: "迷津慈航斩",
    	detail: "普通攻击消耗的灵力+1但伤害提高200%，直到下回合初。"
    };
    var spellcard = {
    	sort: sort$5,
    	marisa: marisa,
    	Stardust_Reverie: Stardust_Reverie,
    	Master_Spark: Master_Spark,
    	Asteroid_Belt: Asteroid_Belt,
    	"Orrery's_Sun": {
    	name: "太阳仪",
    	detail: "本回合所有直接攻击转移到下回合造成120%的间接伤害。",
    	allAim: true,
    	output: {
    		buff: [
    			{
    				value: "Orrery's_Sun",
    				amount: "1",
    				aim: "self"
    			}
    		]
    	}
    },
    	Earth_Light_Ray: Earth_Light_Ray,
    	medicine: medicine,
    	Nerve_Poison: Nerve_Poison,
    	Melancholy_Poison: Melancholy_Poison,
    	Gassing_Garden: Gassing_Garden,
    	Poison_Breath: Poison_Breath,
    	Into_Delirium: Into_Delirium,
    	reimu: reimu,
    	Dream_Seal: Dream_Seal,
    	Demon_Seal_Circle: Demon_Seal_Circle,
    	Double_Bound: Double_Bound,
    	The_Jade: The_Jade,
    	Dream_Born: Dream_Born,
    	youmu: youmu,
    	Bright_Bitter_Wheel: Bright_Bitter_Wheel$1,
    	Six_Roots_Clean: Six_Roots_Clean,
    	Centered_Flow: Centered_Flow,
    	Future_Never_Survive: Future_Never_Survive,
    	Graciousness_Maze: Graciousness_Maze
    };

    var sort$4 = {
    	shrine: {
    		normal: [
    			"cirno",
    			"lilywhite"
    		],
    		elite: [
    		],
    		boss: [
    		]
    	},
    	forest: {
    		normal: [
    			"sunny",
    			"lunar",
    			"star",
    			"eternity"
    		]
    	},
    	moon: {
    		normal: [
    			"piece"
    		]
    	}
    };
    var cirno$1 = {
    	name: "冰之妖精",
    	detail: "冷酷的智者",
    	type: "normal"
    };
    var piece = {
    	name: "地狱的妖精",
    	detail: "拥有使人发狂程度的能力",
    	type: "normal"
    };
    var lilywhite = {
    	name: "报春的妖精",
    	detail: "拥有告知春天到来程度的能力",
    	type: "normal"
    };
    var sunny = {
    	name: "日光的妖精",
    	detail: "拥有操纵光的折射程度的能力",
    	type: "normal"
    };
    var lunar = {
    	name: "月光的妖精",
    	detail: "拥有消除声音程度的能力",
    	type: "normal"
    };
    var star$1 = {
    	name: "星光的妖精",
    	detail: "拥有感应到活动事物程度的能力",
    	type: "normal"
    };
    var eternity = {
    	name: "凤蝶的妖精",
    	detail: "拥有播撒鳞粉程度的能力",
    	type: "normal"
    };
    var Enermy = {
    	sort: sort$4,
    	cirno: cirno$1,
    	piece: piece,
    	lilywhite: lilywhite,
    	sunny: sunny,
    	lunar: lunar,
    	star: star$1,
    	eternity: eternity
    };

    var growth = {
      role: {
        marisa: lv => {
          return role(lv, 0.9, 0.9, 1, 5);
        },
        reimu: lv => {
          return role(lv, 1, 1, 1, 6);
        },
        shion: lv => {
          return role(lv, 1.1, 1.1, 1, 5);
        },
        medicine: lv => {
          return role(lv, 0.9, 0.9, 1, 4);
        },
        aya: lv => {
          return role(lv, 1, 1, 1.2, 5);
        },
        renko: lv => {
          return role(lv, 1, 1, 1, 5);
        },
        youmu: lv => {
          return role(lv, 0.8, 1.1, 1.1, 8);
        }
      },
      enermy: {
        cirno: lv => {
          return enermy(lv, 1, 1, 1);
        },
        piece: lv => {
          return enermy(lv, 1, 1, 1);
        },
        lilywhite: lv => {
          return enermy(lv, 1, 1, 1);
        },
        sunny: lv => {
          return enermy(lv, 1, 1, 1);
        },
        lunar: lv => {
          return enermy(lv, 1, 1, 1);
        },
        star: lv => {
          return enermy(lv, 1, 1, 1);
        },
        eternity: lv => {
          return enermy(lv, 1, 1, 1);
        }
      },
      amount: lv => {
        let e = 4.2 - 1 / Math.pow(2, (lv / 32 - 2)),
          p = e - parseInt(e),
          a = Number(Math.random() < p);
        return parseInt(e) + a;
      }
    };

    function role(lv, h, a, s, p) {
      return {
        health: Math.ceil(r$4(lv) * h),
        attack: Math.ceil(r$4(lv) * a / 6),
        speed: 1 + 0.02 * lv * s,
        power: p
      }
    }

    function enermy(lv, h, a, s) {
      return {
        health: float(e(lv) * h),
        attack: float(e(lv) * a / 8),
        speed: 1 + 0.02 * (lv - 1) * s,
      }
    }

    function r$4(lv) {
      return parseInt(Math.pow(Math.E, lv / (Math.E * Math.log(lv + 1) + Math.sqrt(lv) / Math.E)) + lv + 10);
    }

    function e(lv) {
      return parseInt(Math.pow(Math.E, lv / (Math.log(lv + 1) + Math.sqrt(lv))) + lv + 10);
    }

    function float(v) {
      return v * 0.95 + Math.random().toFixed(2) * v * 0.1;
    }

    /* src\page\foreword.svelte generated by Svelte v3.59.2 */
    const file$9 = "src\\page\\foreword.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	child_ctx[16] = i;
    	return child_ctx;
    }

    // (105:4) {#each story.slice(pointer, step) as s, i}
    function create_each_block$5(ctx) {
    	let txt;
    	let t_value = /*s*/ ctx[14].value + "";
    	let t;
    	let txt_class_value;

    	const block = {
    		c: function create() {
    			txt = element("txt");
    			t = text(t_value);
    			attr_dev(txt, "class", txt_class_value = "" + (null_to_empty(/*i*/ ctx[16] + /*pointer*/ ctx[2] == /*step*/ ctx[1] - 1 && "reading") + " svelte-19hh7fi"));
    			set_style(txt, "--length", /*s*/ ctx[14].value.getByteLen() / 2 - 1);
    			set_style(txt, "width", /*s*/ ctx[14].value.getByteLen() - 2 + "ch");

    			set_style(txt, "--time", (/*i*/ ctx[16] + /*pointer*/ ctx[2] == /*step*/ ctx[1] - 1
    			? 0.2 * (/*s*/ ctx[14].value.getByteLen() / 2 - 1)
    			: 0) + "s");

    			add_location(txt, file$9, 105, 6, 2375);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, txt, anchor);
    			append_dev(txt, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*pointer, step*/ 6 && t_value !== (t_value = /*s*/ ctx[14].value + "")) set_data_dev(t, t_value);

    			if (dirty & /*pointer, step*/ 6 && txt_class_value !== (txt_class_value = "" + (null_to_empty(/*i*/ ctx[16] + /*pointer*/ ctx[2] == /*step*/ ctx[1] - 1 && "reading") + " svelte-19hh7fi"))) {
    				attr_dev(txt, "class", txt_class_value);
    			}

    			if (dirty & /*pointer, step*/ 6) {
    				set_style(txt, "--length", /*s*/ ctx[14].value.getByteLen() / 2 - 1);
    			}

    			if (dirty & /*pointer, step*/ 6) {
    				set_style(txt, "width", /*s*/ ctx[14].value.getByteLen() - 2 + "ch");
    			}

    			if (dirty & /*pointer, step*/ 6) {
    				set_style(txt, "--time", (/*i*/ ctx[16] + /*pointer*/ ctx[2] == /*step*/ ctx[1] - 1
    				? 0.2 * (/*s*/ ctx[14].value.getByteLen() / 2 - 1)
    				: 0) + "s");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(txt);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(105:4) {#each story.slice(pointer, step) as s, i}",
    		ctx
    	});

    	return block;
    }

    // (115:2) {#if type}
    function create_if_block$3(ctx) {
    	let selector;
    	let updating_selected;
    	let current;

    	function selector_selected_binding(value) {
    		/*selector_selected_binding*/ ctx[7](value);
    	}

    	let selector_props = { type: /*type*/ ctx[3] };

    	if (/*selected*/ ctx[0] !== void 0) {
    		selector_props.selected = /*selected*/ ctx[0];
    	}

    	selector = new Selector({ props: selector_props, $$inline: true });
    	binding_callbacks.push(() => bind(selector, 'selected', selector_selected_binding));

    	const block = {
    		c: function create() {
    			create_component(selector.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(selector, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const selector_changes = {};
    			if (dirty & /*type*/ 8) selector_changes.type = /*type*/ ctx[3];

    			if (!updating_selected && dirty & /*selected*/ 1) {
    				updating_selected = true;
    				selector_changes.selected = /*selected*/ ctx[0];
    				add_flush_callback(() => updating_selected = false);
    			}

    			selector.$set(selector_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(selector.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(selector.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(selector, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(115:2) {#if type}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div1;
    	let div0;
    	let t;
    	let div1_intro;
    	let div1_outro;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*story*/ ctx[5].slice(/*pointer*/ ctx[2], /*step*/ ctx[1]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	let if_block = /*type*/ ctx[3] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "talk svelte-19hh7fi");
    			add_location(div0, file$9, 103, 2, 2301);
    			attr_dev(div1, "class", "body svelte-19hh7fi");
    			add_location(div1, file$9, 97, 0, 2174);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div0, null);
    				}
    			}

    			append_dev(div1, t);
    			if (if_block) if_block.m(div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", /*click_handler*/ ctx[8], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*pointer, step, story*/ 38) {
    				each_value = /*story*/ ctx[5].slice(/*pointer*/ ctx[2], /*step*/ ctx[1]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*type*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*type*/ 8) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);

    			add_render_callback(() => {
    				if (!current) return;
    				if (div1_outro) div1_outro.end(1);
    				div1_intro = create_in_transition(div1, fade, { duration: 250 });
    				div1_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			if (div1_intro) div1_intro.invalidate();
    			div1_outro = create_out_transition(div1, fade, { duration: 250 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			if (if_block) if_block.d();
    			if (detaching && div1_outro) div1_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let $data;
    	let $page;
    	let $explore;
    	validate_store(data, 'data');
    	component_subscribe($$self, data, $$value => $$invalidate(9, $data = $$value));
    	validate_store(page, 'page');
    	component_subscribe($$self, page, $$value => $$invalidate(10, $page = $$value));
    	validate_store(explore, 'explore');
    	component_subscribe($$self, explore, $$value => $$invalidate(11, $explore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Foreword', slots, []);
    	let selected = false;
    	let step = 0;
    	let pointer = 0;
    	let type = null;
    	let click = true;

    	let story = [
    		{ type: "txt", value: "宇佐见莲子正对着笔记本电脑沉思。" },
    		{
    			type: "txt",
    			value: "“终于要动笔了吗？”梅莉端着咖啡走来。"
    		},
    		{ type: "txt", value: "“是啊。”莲子伸了个懒腰。" },
    		{ type: "txt", value: "“要加多少糖呢？”" },
    		{ type: "selector", value: "sugar" },
    		{
    			type: "txt",
    			value: "“幻想交织在静谧的夜空之下——”莲子写道。"
    		},
    		{ type: "txt", value: "“这句话有什么作用吗？”" },
    		{ type: "txt", value: "“文、文学的事情，你少管！”" },
    		{
    			type: "txt",
    			value: "“少女坐在破旧的神社中。”她接着写，“其名为——”"
    		},
    		{ type: "selector", value: "role" }
    	];

    	function next() {
    		if (story[step].type == "txt") $$invalidate(1, step++, step); else if (selected) {
    			$$invalidate(4, click = false);

    			setTimeout(
    				_ => {
    					if (step == story.length - 1) start(); else {
    						$$invalidate(2, pointer = step + 1);
    						$$invalidate(1, step += 1);
    						$$invalidate(3, type = null);
    						$$invalidate(0, selected = false);
    						$$invalidate(4, click = true);
    						setTimeout(_ => next(), 200);
    					}
    				},
    				1000
    			);
    		} else $$invalidate(3, type = story[step].value);
    	}

    	next();

    	function start() {
    		const add = {
    			enermy: type => $explore.enermy.push(Enermy.sort[$data.scene][type].rd()[0])
    		};

    		add.enermy("normal");
    		let amount = growth.amount($explore.lv);
    		for (let i = 0; i < amount + 10; i++) add.enermy("normal");
    		set_store_value(data, $data.spellcards[$data.role] = 4, $data);
    		spellcardAdd();
    		spellcardAdd();
    		set_store_value(page, $page = "explore", $page);
    	}

    	function spellcardAdd() {
    		let name = deepCopy(spellcard).sort[$data.role].rd()[0];
    		if ($data.spellcards[name]) set_store_value(data, $data.spellcards[name]++, $data); else set_store_value(data, $data.spellcards[name] = 1, $data);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Foreword> was created with unknown prop '${key}'`);
    	});

    	function selector_selected_binding(value) {
    		selected = value;
    		$$invalidate(0, selected);
    	}

    	const click_handler = _ => click && next();

    	$$self.$capture_state = () => ({
    		fade,
    		scale,
    		page,
    		data,
    		explore,
    		Selector,
    		spellcard,
    		enermy: Enermy,
    		growth,
    		selected,
    		step,
    		pointer,
    		type,
    		click,
    		story,
    		next,
    		start,
    		spellcardAdd,
    		$data,
    		$page,
    		$explore
    	});

    	$$self.$inject_state = $$props => {
    		if ('selected' in $$props) $$invalidate(0, selected = $$props.selected);
    		if ('step' in $$props) $$invalidate(1, step = $$props.step);
    		if ('pointer' in $$props) $$invalidate(2, pointer = $$props.pointer);
    		if ('type' in $$props) $$invalidate(3, type = $$props.type);
    		if ('click' in $$props) $$invalidate(4, click = $$props.click);
    		if ('story' in $$props) $$invalidate(5, story = $$props.story);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		selected,
    		step,
    		pointer,
    		type,
    		click,
    		story,
    		next,
    		selector_selected_binding,
    		click_handler
    	];
    }

    class Foreword extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Foreword",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src\page\explore.svelte generated by Svelte v3.59.2 */
    const file$8 = "src\\page\\explore.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[9] = i;
    	return child_ctx;
    }

    // (23:4) {#each Explore.enermy as e, i (i)}
    function create_each_block$4(key_1, ctx) {
    	let div2;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let txt0;
    	let span;
    	let t3_value = Enermy[/*e*/ ctx[7]].name + "";
    	let t3;
    	let t4;
    	let txt1;
    	let t5_value = Enermy[/*e*/ ctx[7]].detail + "";
    	let t5;
    	let t6;
    	let div1;
    	let div2_class_value;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[5](/*i*/ ctx[9], ...args);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div2 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			txt0 = element("txt");
    			span = element("span");
    			span.textContent = `lv.${/*Explore*/ ctx[4].lv}`;
    			t3 = text(t3_value);
    			t4 = space();
    			txt1 = element("txt");
    			t5 = text(t5_value);
    			t6 = space();
    			div1 = element("div");
    			if (!src_url_equal(img.src, img_src_value = `/img/enermy/${Enermy[/*e*/ ctx[7]].type}/${/*e*/ ctx[7]}/icon.png`)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-181igqh");
    			add_location(img, file$8, 27, 8, 820);
    			attr_dev(span, "class", "svelte-181igqh");
    			add_location(span, file$8, 29, 15, 931);
    			attr_dev(txt0, "class", "svelte-181igqh");
    			add_location(txt0, file$8, 29, 10, 926);
    			attr_dev(txt1, "class", "svelte-181igqh");
    			add_location(txt1, file$8, 30, 10, 993);
    			attr_dev(div0, "class", "enermy-info svelte-181igqh");
    			add_location(div0, file$8, 28, 8, 889);
    			attr_dev(div1, "class", "" + (null_to_empty(`enermy-type enermy_${Enermy[/*e*/ ctx[7]].type}`) + " svelte-181igqh"));
    			add_location(div1, file$8, 32, 8, 1048);
    			attr_dev(div2, "class", div2_class_value = "" + (null_to_empty(`enermy ${/*target*/ ctx[0][/*i*/ ctx[9]] && "enermy_selected"}`) + " svelte-181igqh"));
    			add_location(div2, file$8, 23, 6, 685);
    			this.first = div2;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, img);
    			append_dev(div2, t0);
    			append_dev(div2, div0);
    			append_dev(div0, txt0);
    			append_dev(txt0, span);
    			append_dev(txt0, t3);
    			append_dev(div0, t4);
    			append_dev(div0, txt1);
    			append_dev(txt1, t5);
    			append_dev(div2, t6);
    			append_dev(div2, div1);

    			if (!mounted) {
    				dispose = listen_dev(div2, "click", click_handler, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*target*/ 1 && div2_class_value !== (div2_class_value = "" + (null_to_empty(`enermy ${/*target*/ ctx[0][/*i*/ ctx[9]] && "enermy_selected"}`) + " svelte-181igqh"))) {
    				attr_dev(div2, "class", div2_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(23:4) {#each Explore.enermy as e, i (i)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div2;
    	let div0;
    	let txt0;
    	let t1;
    	let div1;
    	let txt1;
    	let t5;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t6;
    	let txt2;
    	let div2_intro;
    	let div2_outro;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*Explore*/ ctx[4].enermy;
    	validate_each_argument(each_value);
    	const get_key = ctx => /*i*/ ctx[9];
    	validate_each_keys(ctx, each_value, get_each_context$4, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$4(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$4(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			txt0 = element("txt");
    			txt0.textContent = "机遇";
    			t1 = space();
    			div1 = element("div");
    			txt1 = element("txt");
    			txt1.textContent = `敌人(${/*amount*/ ctx[3]})`;
    			t5 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t6 = space();
    			txt2 = element("txt");
    			txt2.textContent = "战斗";
    			add_location(txt0, file$8, 18, 4, 538);
    			attr_dev(div0, "class", "explore-events svelte-181igqh");
    			add_location(div0, file$8, 17, 2, 504);
    			attr_dev(txt1, "class", "title svelte-181igqh");
    			add_location(txt1, file$8, 21, 4, 600);
    			attr_dev(txt2, "class", "btn svelte-181igqh");
    			add_location(txt2, file$8, 35, 4, 1135);
    			attr_dev(div1, "class", "explore-enermys svelte-181igqh");
    			add_location(div1, file$8, 20, 2, 565);
    			attr_dev(div2, "class", "body explore svelte-181igqh");
    			set_style(div2, "background-image", "url('/img/scene/shrine.webp')");
    			add_location(div2, file$8, 11, 0, 348);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, txt0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, txt1);
    			append_dev(div1, t5);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div1, null);
    				}
    			}

    			append_dev(div1, t6);
    			append_dev(div1, txt2);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(txt2, "click", /*click_handler_1*/ ctx[6], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*target, Explore, enermy*/ 17) {
    				each_value = /*Explore*/ ctx[4].enermy;
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$4, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div1, destroy_block, create_each_block$4, t6, get_each_context$4);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!current) return;
    				if (div2_outro) div2_outro.end(1);
    				div2_intro = create_in_transition(div2, fade, { duration: 250 });
    				div2_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div2_intro) div2_intro.invalidate();
    			div2_outro = create_out_transition(div2, fade, { duration: 250 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (detaching && div2_outro) div2_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $explore;
    	let $page;
    	validate_store(explore, 'explore');
    	component_subscribe($$self, explore, $$value => $$invalidate(1, $explore = $$value));
    	validate_store(page, 'page');
    	component_subscribe($$self, page, $$value => $$invalidate(2, $page = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Explore', slots, []);
    	let amount = $explore.enermy.length;
    	const Explore = deepCopy($explore);
    	amount > 6 && Explore.enermy.splice(6);
    	let target = Explore.enermy.map(_ => false);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Explore> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (i, _) => $$invalidate(0, target[i] = !target[i], target);

    	const click_handler_1 = _ => {
    		target.reduce((a, c) => a + Number(c), 0) > Explore.enermyLimit
    		? alert("你最多只能选择四个敌人")
    		: set_store_value(page, $page = "battle", $page);

    		set_store_value(explore, $explore.target = target, $explore);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		scale,
    		page,
    		setting,
    		explore,
    		enermy: Enermy,
    		amount,
    		Explore,
    		target,
    		$explore,
    		$page
    	});

    	$$self.$inject_state = $$props => {
    		if ('amount' in $$props) $$invalidate(3, amount = $$props.amount);
    		if ('target' in $$props) $$invalidate(0, target = $$props.target);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [target, $explore, $page, amount, Explore, click_handler, click_handler_1];
    }

    class Explore_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Explore_1",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\page\battleSpellcard.svelte generated by Svelte v3.59.2 */
    const file$7 = "src\\page\\battleSpellcard.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    // (51:2) {#each hold as i (i)}
    function create_each_block$3(key_1, ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let txt0;
    	let t1_value = spellcard[/*spellcards*/ ctx[4][/*i*/ ctx[15]]].name + "";
    	let t1;
    	let t2;
    	let div0;
    	let txt1;
    	let t3_value = spellcard[/*spellcards*/ ctx[4][/*i*/ ctx[15]]].detail + "";
    	let t3;
    	let t4;
    	let div1_class_value;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[8](/*i*/ ctx[15], ...args);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			txt0 = element("txt");
    			t1 = text(t1_value);
    			t2 = space();
    			div0 = element("div");
    			txt1 = element("txt");
    			t3 = text(t3_value);
    			t4 = space();
    			if (!src_url_equal(img.src, img_src_value = `/svg/spellcard/${/*spellcards*/ ctx[4][/*i*/ ctx[15]]}.svg`)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-wwdao0");
    			add_location(img, file$7, 60, 6, 1800);
    			attr_dev(txt0, "class", "svelte-wwdao0");
    			add_location(txt0, file$7, 61, 6, 1859);
    			attr_dev(txt1, "class", "svelte-wwdao0");
    			add_location(txt1, file$7, 63, 8, 1919);
    			attr_dev(div0, "class", "svelte-wwdao0");
    			add_location(div0, file$7, 62, 6, 1904);
    			attr_dev(div1, "class", div1_class_value = "" + (null_to_empty(`spellcard ${/*selected*/ ctx[2] == /*i*/ ctx[15] && !/*useThis*/ ctx[3](/*i*/ ctx[15]) && "selectedSpellcard"} ${/*useThis*/ ctx[3](/*i*/ ctx[15]) && "animate_useSpellcard"}`) + " svelte-wwdao0"));
    			add_location(div1, file$7, 51, 4, 1517);
    			this.first = div1;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, txt0);
    			append_dev(txt0, t1);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, txt1);
    			append_dev(txt1, t3);
    			append_dev(div1, t4);

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", click_handler, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*hold*/ 2 && !src_url_equal(img.src, img_src_value = `/svg/spellcard/${/*spellcards*/ ctx[4][/*i*/ ctx[15]]}.svg`)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*hold*/ 2 && t1_value !== (t1_value = spellcard[/*spellcards*/ ctx[4][/*i*/ ctx[15]]].name + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*hold*/ 2 && t3_value !== (t3_value = spellcard[/*spellcards*/ ctx[4][/*i*/ ctx[15]]].detail + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*selected, hold, useThis*/ 14 && div1_class_value !== (div1_class_value = "" + (null_to_empty(`spellcard ${/*selected*/ ctx[2] == /*i*/ ctx[15] && !/*useThis*/ ctx[3](/*i*/ ctx[15]) && "selectedSpellcard"} ${/*useThis*/ ctx[3](/*i*/ ctx[15]) && "animate_useSpellcard"}`) + " svelte-wwdao0"))) {
    				attr_dev(div1, "class", div1_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(51:2) {#each hold as i (i)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_value = /*hold*/ ctx[1];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*i*/ ctx[15];
    	validate_each_keys(ctx, each_value, get_each_context$3, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$3(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$3(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "spellcards svelte-wwdao0");
    			add_location(div, file$7, 49, 0, 1462);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*selected, hold, useThis, Selected, spellcards, info*/ 31) {
    				each_value = /*hold*/ ctx[1];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$3, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, destroy_block, create_each_block$3, null, get_each_context$3);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const limit = 4;

    function instance$7($$self, $$props, $$invalidate) {
    	let useThis;
    	let $data;
    	validate_store(data, 'data');
    	component_subscribe($$self, data, $$value => $$invalidate(10, $data = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('BattleSpellcard', slots, []);
    	const Data = deepCopy($data);
    	const spellcards = [];
    	for (let s in Data.spellcards) for (let i = 0; i < Data.spellcards[s]; i++) spellcards.push(s);
    	C("blade_of_yellow_spring", amount => [...Array(amount).keys()].forEach(_ => spellcards.push(Data.role)));
    	let left = leftReset();
    	let hold = [];
    	let selected;
    	let useds = [];
    	let { Selected } = $$props;
    	const used = _ => $$invalidate(7, useds = [...useds, selected]);
    	const refresh = add;

    	function add(value) {
    		// 修改后的机制，用索引代表符卡，避免普攻被吞
    		let l = limit + value;

    		let ex = [];

    		C("blade_of_yellow_spring", amount => {
    			ex = spellcards.map((_, i) => i).splice(-amount);
    			hold.splice(-amount);
    		});

    		C("blood_book", amount => l += amount);
    		$$invalidate(1, hold = hold.filter(i => !useds.includes(i)));
    		left = left.filter(i => !hold.includes(i)).rd();
    		$$invalidate(1, hold = [...hold, ...left.splice(0, l - hold.length), ...ex]);
    		left = left.length == 0 ? leftReset() : left;
    		$$invalidate(7, useds = []);
    		$$invalidate(2, selected = null);
    	}

    	function leftReset() {
    		let res = spellcards.map((_, i) => i);
    		C("blade_of_yellow_spring", amount => res.splice(-amount));
    		return res;
    	}

    	function C(n, f) {
    		if (n in Data.collections) f(Data.collections[n]);
    	}

    	$$self.$$.on_mount.push(function () {
    		if (Selected === undefined && !('Selected' in $$props || $$self.$$.bound[$$self.$$.props['Selected']])) {
    			console.warn("<BattleSpellcard> was created without expected prop 'Selected'");
    		}
    	});

    	const writable_props = ['Selected'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<BattleSpellcard> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (i, _) => {
    		$$invalidate(2, selected = selected == i ? null : i);
    		$$invalidate(0, Selected = spellcards[selected]);
    	};

    	$$self.$$set = $$props => {
    		if ('Selected' in $$props) $$invalidate(0, Selected = $$props.Selected);
    	};

    	$$self.$capture_state = () => ({
    		info: spellcard,
    		data,
    		Data,
    		limit,
    		spellcards,
    		left,
    		hold,
    		selected,
    		useds,
    		Selected,
    		used,
    		refresh,
    		add,
    		leftReset,
    		C,
    		useThis,
    		$data
    	});

    	$$self.$inject_state = $$props => {
    		if ('left' in $$props) left = $$props.left;
    		if ('hold' in $$props) $$invalidate(1, hold = $$props.hold);
    		if ('selected' in $$props) $$invalidate(2, selected = $$props.selected);
    		if ('useds' in $$props) $$invalidate(7, useds = $$props.useds);
    		if ('Selected' in $$props) $$invalidate(0, Selected = $$props.Selected);
    		if ('useThis' in $$props) $$invalidate(3, useThis = $$props.useThis);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*useds*/ 128) {
    			$$invalidate(3, useThis = i => useds.includes(i));
    		}
    	};

    	return [
    		Selected,
    		hold,
    		selected,
    		useThis,
    		spellcards,
    		used,
    		refresh,
    		useds,
    		click_handler
    	];
    }

    class BattleSpellcard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { Selected: 0, used: 5, refresh: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BattleSpellcard",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get Selected() {
    		throw new Error("<BattleSpellcard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Selected(value) {
    		throw new Error("<BattleSpellcard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get used() {
    		return this.$$.ctx[5];
    	}

    	set used(value) {
    		throw new Error("<BattleSpellcard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get refresh() {
    		return this.$$.ctx[6];
    	}

    	set refresh(value) {
    		throw new Error("<BattleSpellcard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var hypodynamic = {
    	name: "乏力",
    	detail: "回合开始时不回复灵力。生效时层数-1。",
    	expend: true
    };
    var tired = {
    	name: "疲倦",
    	detail: "回合开始时回复灵力减少1(每层+1)。生效时层数-1。",
    	expend: true
    };
    var imprisoned = {
    	name: "禁锢",
    	detail: "回合内禁止行动。生效时层数-1。",
    	expend: true
    };
    var prophesy = {
    	name: "预言",
    	detail: "闪避接下来的1(每层+1)次攻击。生效时层数-1。每回合初清空。",
    	positive: true,
    	expend: true,
    	interim: true
    };
    var foresee = {
    	name: "预知",
    	detail: "闪避接下来的1(每层+1)次攻击。生效时层数-1。",
    	positive: true,
    	expend: true
    };
    var interim_barrier = {
    	name: "临时防御结界",
    	detail: "阻挡1(每层+1)点伤害。生效时层数-1。每回合初清空。",
    	positive: true,
    	interim: true
    };
    var barrier = {
    	name: "防御结界",
    	detail: "阻挡1(每层+1)点伤害。生效时层数-1。",
    	positive: true
    };
    var Bright_Bitter_Wheel = {
    	name: "幽明的苦轮",
    	detail: "攻击附带60%间接伤害并回复1点灵力",
    	positive: true,
    	interim: true
    };
    var frostbite = {
    	name: "冻伤",
    	detail: ""
    };
    var in_treatment = {
    	name: "治疗中",
    	detail: "回复5%(每层+5%)当前生命值。",
    	positive: true,
    	interim: true
    };
    var burning = {
    	name: "燃烧",
    	detail: "每回合扣除2%(每层+2%)最大生命值。生效时层数-1。",
    	expend: true
    };
    var strength_of_wine = {
    	name: "酒劲",
    	detail: "符卡造成的伤害+10%(每层+10%)。每回合初清空。",
    	interim: true,
    	positive: true
    };
    var seal_needle$1 = {
    	name: "封魔针",
    	detail: "造成8(每层-1)次伤害后，攻击对全体敌人附加流血。"
    };
    var bleed = {
    	name: "流血",
    	detail: "每回合扣除2%(每层+2%)最大生命值。受治疗时移除。"
    };
    var star = {
    	name: "星星",
    	detail: "天上的星星不装在瓶子里可是会爆炸的！",
    	positive: true
    };
    var buffs = {
    	hypodynamic: hypodynamic,
    	"Orrery's_Sun": {
    	name: "太阳仪",
    	detail: "直接攻击在次回合造成120%*1(每层+1)间接伤害。生效时层数-1。",
    	positive: true,
    	expend: true
    },
    	tired: tired,
    	imprisoned: imprisoned,
    	prophesy: prophesy,
    	foresee: foresee,
    	interim_barrier: interim_barrier,
    	barrier: barrier,
    	Bright_Bitter_Wheel: Bright_Bitter_Wheel,
    	frostbite: frostbite,
    	in_treatment: in_treatment,
    	burning: burning,
    	strength_of_wine: strength_of_wine,
    	seal_needle: seal_needle$1,
    	bleed: bleed,
    	star: star
    };

    const model = {
      cirno: {
        stage1: {
          mode: 'random'
        }
      },
      piece: {
        stage1: {
          mode: 'random'
        }
      },
      lilywhite: {
        stage1: {
          mode: 'random'
        }
      },
      sunny: {
        stage1: {
          mode: 'random'
        }
      },
      lunar: {
        stage1: {
          mode: 'random'
        }
      },
      star: {
        stage1: {
          mode: 'random'
        }
      },
      eternity: {
        stage1: {
          mode: 'random',
        }
      }
    };

    function ai(lv, enermy) {
      let stage = Math.floor(lv / 16) + 1;
      model[enermy][stage];
      return enermy == 'cirno' ? ["cirno", "cirno", "cirno"] : ["Surprise_Spring", "Surprise_Spring"]
    }

    var sort$3 = {
    	cirno: [
    		"Perfect_Freeze",
    		"Icicle_Fall",
    		"Diamond_Blizzard",
    		"Minus_K",
    		"Frost_Columns"
    	],
    	lilywhite: [
    		"Surprise_Spring"
    	]
    };
    var cirno = {
    	name: "冷气",
    	detail: "对目标造成100%攻击力伤害。",
    	output: {
    		attack: [
    			{
    				type: "scale",
    				value: "100",
    				aim: "one"
    			}
    		]
    	}
    };
    var Perfect_Freeze = {
    	name: "完美冻结",
    	detail: "50%几率冻结对方一回合，50%几率冻结自己，若自己被冻结，受到的伤害减半。解冻后对目标造成300%攻击力伤害。"
    };
    var Icicle_Fall = {
    	name: "冰瀑",
    	detail: "一回合无法行动，之后对目标造成600%攻击力伤害。"
    };
    var Diamond_Blizzard = {
    	name: "钻石风暴",
    	detail: "对目标造成240%攻击力伤害并施加一层缓慢，对自己造成50%攻击力伤害。"
    };
    var Minus_K = {
    	name: "负K",
    	detail: "接下来一回合，受到伤害会反馈一层冻伤。"
    };
    var Frost_Columns = {
    	name: "冰袭方阵",
    	detail: "对目标造成200%攻击力伤害并施加两层疲倦。"
    };
    var Surprise_Spring = {
    	name: "惊喜之春",
    	detail: "随机对目标造成80%到200%攻击力伤害",
    	output: {
    		attack: [
    			{
    				type: "random",
    				typeofRandom: "scale",
    				max: "80",
    				min: "200",
    				aim: "one"
    			}
    		]
    	}
    };
    var info_enermySpellcard = {
    	sort: sort$3,
    	cirno: cirno,
    	Perfect_Freeze: Perfect_Freeze,
    	Icicle_Fall: Icicle_Fall,
    	Diamond_Blizzard: Diamond_Blizzard,
    	Minus_K: Minus_K,
    	Frost_Columns: Frost_Columns,
    	Surprise_Spring: Surprise_Spring
    };

    const cache = {};
    Object.assign(cache, spellcard);
    Object.assign(cache, info_enermySpellcard);

    const info = {
      spellcard: cache,
      buff: buffs
    };

    var calculate = {
      output: (data, Cache, spellcard) => {
        const cache = {};
        const output = {
          attack: [],
          buff: [],
          heal: []
        };
        if (data.role) data.state = growth.role[data.role](data.lv);
        if ("Orrery's_Sun" in data.buff) cache["Orrery's_Sun"] = [];
        const effect = deepCopy(info.spellcard[spellcard].output);
        if ("buff" in effect) for (let buff of effect.buff) output.buff.push(buff);
        if ("attack" in effect) {
          for (let attack of effect.attack) {
            attack.amount = attack.amount ? attack.amount : 1;
            if ("Orrery's_Sun" in data.buff) cache["Orrery's_Sun"].push(attack);
            else for (let a = 0; a < attack.amount; a++) output.attack.push(deepCopy(attack));
          }
        }

        // 附加区

        if ('collections' in data) {
          C("vampire's_old_tooth", amount => output.attack.length != 0 && output.attack.forEach(_ => output.heal.push({
            type: "value",
            value: 0.5 * amount
          })));
          C('portable_money_box', amount => output.attack.forEach(a => a.value = a.value * (1 + amount * 0.05 * Math.floor(data.coin / 100))));
          C('skyrocket', amount => spellcard == data.role && output.attack.forEach(a => {
            if (r$3() < 0.3) {
              a.value = a.value * 1.5;
              output.buff.push({
                value: 'burning',
                amount: amount,
                aim: 'one'
              });
            }
          }));
          C('pickled_radish', amount => data.health / data.state.health >= 0.95 && spellcard != data.role && output.attack.forEach(a => a.value *= 1 + (amount * 0.1)));
          C('bronze_mirror', amount => output.attack.forEach(a => r$3() < 0.25 && output.attack.push({
            type: a.type,
            value: a.value * 0.3 * amount,
            aim: 'random',
            critical: false
          })));
          C('earthy_spider_wine', amount => {
            if (spellcard == data.role) data.buff['strength_of_wine'] = amount;
          });
          C('amulet_of_full_moon', amount => {
            let i = Object.keys(data.buff).reduce((a, c) => a + (info.buff[c].positive == true ? 0 : 1), 0);
            i > 2 && output.attack.forEach(a => a.value *= 1 + (amount * 0.1));
          });

          B('strength_of_wine', amount => spellcard != data.role && output.attack.forEach(a => a.value *= 1 + (amount * 0.1)));
          B('seal_needle', amount => {
            if (amount <= 1) {
              C('seal_needle', a => output.buff.push({
                value: "bleed",
                amount: a,
                aim: "all"
              }));
              if (amount < 1) data.buff['seal_needle'] += 9;
              else data.buff['seal_needle'] = 9;
            }
          });
        }

        // 附加区

        output.attack.forEach(a => {
          a.from = data.role ? 'role' : 'enermy';
        });
        output.buff.forEach(b => b.amount = Number(b.amount));
        return output;
        function C(n, f) {
          if (n in data.collections) f(data.collections[n]);
        }
        function B(n, f) {
          if (n in data.buff) {
            let a = data.buff[n];
            !info.buff[n].positive && C('fish_stone', amount => a -= amount);
            f(a >= 0 ? a : 0);
            if (info.buff[n].expend) data.buff[n] == 1 ? delete data.buff[n] : data.buff[n]--;
          }
        }
      },
      input: (data, input) => { }
    };

    function r$3() {
      return Math.random();
    }

    /* src\addon\part\marisaAttack.svelte generated by Svelte v3.59.2 */

    const file$6 = "src\\addon\\part\\marisaAttack.svelte";

    function create_fragment$6(ctx) {
    	let div6;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let t2;
    	let div3;
    	let t3;
    	let div4;
    	let t4;
    	let div5;

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			t2 = space();
    			div3 = element("div");
    			t3 = space();
    			div4 = element("div");
    			t4 = space();
    			div5 = element("div");
    			attr_dev(div0, "class", "svelte-3ja3ij");
    			add_location(div0, file$6, 11, 2, 246);
    			attr_dev(div1, "class", "svelte-3ja3ij");
    			add_location(div1, file$6, 12, 2, 257);
    			attr_dev(div2, "class", "svelte-3ja3ij");
    			add_location(div2, file$6, 13, 2, 268);
    			attr_dev(div3, "class", "svelte-3ja3ij");
    			add_location(div3, file$6, 14, 2, 279);
    			attr_dev(div4, "class", "svelte-3ja3ij");
    			add_location(div4, file$6, 15, 2, 290);
    			attr_dev(div5, "class", "svelte-3ja3ij");
    			add_location(div5, file$6, 16, 2, 301);
    			attr_dev(div6, "class", "MarisaAttack svelte-3ja3ij");
    			set_style(div6, "transform", "rotate(" + /*rotate*/ ctx[0] + "deg)");
    			set_style(div6, "left", /*left*/ ctx[1] + "px");
    			set_style(div6, "top", /*top*/ ctx[2] + "px");
    			add_location(div6, file$6, 7, 0, 144);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div0);
    			append_dev(div6, t0);
    			append_dev(div6, div1);
    			append_dev(div6, t1);
    			append_dev(div6, div2);
    			append_dev(div6, t2);
    			append_dev(div6, div3);
    			append_dev(div6, t3);
    			append_dev(div6, div4);
    			append_dev(div6, t4);
    			append_dev(div6, div5);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
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

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('MarisaAttack', slots, []);
    	let rotate = Math.random() * 360;
    	let left = 30 + Math.random() * 150;
    	let top = 50 + Math.random() * 150;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<MarisaAttack> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ rotate, left, top });

    	$$self.$inject_state = $$props => {
    		if ('rotate' in $$props) $$invalidate(0, rotate = $$props.rotate);
    		if ('left' in $$props) $$invalidate(1, left = $$props.left);
    		if ('top' in $$props) $$invalidate(2, top = $$props.top);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [rotate, left, top];
    }

    class MarisaAttack extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MarisaAttack",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    const handle = {
      marisa: MarisaAttack
    };

    /* src\addon\part\explain.svelte generated by Svelte v3.59.2 */

    const file$5 = "src\\addon\\part\\explain.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let span;
    	let t0;
    	let t1;
    	let a;
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text(/*title*/ ctx[0]);
    			t1 = space();
    			a = element("a");
    			t2 = text(/*detail*/ ctx[1]);
    			set_style(span, "background-color", "var(--" + /*color*/ ctx[2] + ")");
    			attr_dev(span, "class", "svelte-36i0c7");
    			add_location(span, file$5, 7, 2, 112);
    			attr_dev(a, "class", "svelte-36i0c7");
    			add_location(a, file$5, 8, 2, 176);
    			attr_dev(div, "class", "explain svelte-36i0c7");
    			add_location(div, file$5, 6, 0, 87);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(div, t1);
    			append_dev(div, a);
    			append_dev(a, t2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);

    			if (dirty & /*color*/ 4) {
    				set_style(span, "background-color", "var(--" + /*color*/ ctx[2] + ")");
    			}

    			if (dirty & /*detail*/ 2) set_data_dev(t2, /*detail*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Explain', slots, []);
    	let { title } = $$props;
    	let { detail } = $$props;
    	let { color } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (title === undefined && !('title' in $$props || $$self.$$.bound[$$self.$$.props['title']])) {
    			console.warn("<Explain> was created without expected prop 'title'");
    		}

    		if (detail === undefined && !('detail' in $$props || $$self.$$.bound[$$self.$$.props['detail']])) {
    			console.warn("<Explain> was created without expected prop 'detail'");
    		}

    		if (color === undefined && !('color' in $$props || $$self.$$.bound[$$self.$$.props['color']])) {
    			console.warn("<Explain> was created without expected prop 'color'");
    		}
    	});

    	const writable_props = ['title', 'detail', 'color'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Explain> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('title' in $$props) $$invalidate(0, title = $$props.title);
    		if ('detail' in $$props) $$invalidate(1, detail = $$props.detail);
    		if ('color' in $$props) $$invalidate(2, color = $$props.color);
    	};

    	$$self.$capture_state = () => ({ title, detail, color });

    	$$self.$inject_state = $$props => {
    		if ('title' in $$props) $$invalidate(0, title = $$props.title);
    		if ('detail' in $$props) $$invalidate(1, detail = $$props.detail);
    		if ('color' in $$props) $$invalidate(2, color = $$props.color);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, detail, color];
    }

    class Explain extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { title: 0, detail: 1, color: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Explain",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get title() {
    		throw new Error("<Explain>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Explain>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get detail() {
    		throw new Error("<Explain>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set detail(value) {
    		throw new Error("<Explain>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Explain>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Explain>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\page\battleEnermy.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1$2 } = globals;
    const file$4 = "src\\page\\battleEnermy.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[24] = list[i];
    	child_ctx[26] = i;
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[27] = list[i];
    	child_ctx[29] = i;
    	return child_ctx;
    }

    function get_each_context_2$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[30] = list[i];
    	child_ctx[29] = i;
    	return child_ctx;
    }

    // (235:14) {#if Object.values(state[i].buff)[ii] > 1}
    function create_if_block_2$2(ctx) {
    	let txt;
    	let t_value = Object.values(/*state*/ ctx[0][/*i*/ ctx[26]].buff)[/*ii*/ ctx[29]] + "";
    	let t;

    	const block = {
    		c: function create() {
    			txt = element("txt");
    			t = text(t_value);
    			attr_dev(txt, "class", "svelte-2vu2l");
    			add_location(txt, file$4, 235, 16, 7358);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, txt, anchor);
    			append_dev(txt, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*state*/ 1 && t_value !== (t_value = Object.values(/*state*/ ctx[0][/*i*/ ctx[26]].buff)[/*ii*/ ctx[29]] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(txt);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(235:14) {#if Object.values(state[i].buff)[ii] > 1}",
    		ctx
    	});

    	return block;
    }

    // (232:10) {#each Object.keys(state[i].buff) as b, ii (ii)}
    function create_each_block_2$2(key_1, ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let t0;
    	let show_if = Object.values(/*state*/ ctx[0][/*i*/ ctx[26]].buff)[/*ii*/ ctx[29]] > 1;
    	let t1;
    	let explain;
    	let t2;
    	let current;
    	let if_block = show_if && create_if_block_2$2(ctx);

    	explain = new Explain({
    			props: {
    				title: buffs[/*b*/ ctx[30]].name,
    				detail: buffs[/*b*/ ctx[30]].detail,
    				color: buffs[/*b*/ ctx[30]].positive ? "blue" : "purple"
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();
    			create_component(explain.$$.fragment);
    			t2 = space();
    			if (!src_url_equal(img.src, img_src_value = "/svg/buff/" + /*b*/ ctx[30] + ".svg")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$4, 233, 14, 7251);
    			attr_dev(div, "class", "svelte-2vu2l");
    			add_location(div, file$4, 232, 12, 7230);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t0);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t1);
    			mount_component(explain, div, null);
    			append_dev(div, t2);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty[0] & /*state*/ 1 && !src_url_equal(img.src, img_src_value = "/svg/buff/" + /*b*/ ctx[30] + ".svg")) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty[0] & /*state*/ 1) show_if = Object.values(/*state*/ ctx[0][/*i*/ ctx[26]].buff)[/*ii*/ ctx[29]] > 1;

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2$2(ctx);
    					if_block.c();
    					if_block.m(div, t1);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			const explain_changes = {};
    			if (dirty[0] & /*state*/ 1) explain_changes.title = buffs[/*b*/ ctx[30]].name;
    			if (dirty[0] & /*state*/ 1) explain_changes.detail = buffs[/*b*/ ctx[30]].detail;
    			if (dirty[0] & /*state*/ 1) explain_changes.color = buffs[/*b*/ ctx[30]].positive ? "blue" : "purple";
    			explain.$set(explain_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(explain.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(explain.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			destroy_component(explain);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$2.name,
    		type: "each",
    		source: "(232:10) {#each Object.keys(state[i].buff) as b, ii (ii)}",
    		ctx
    	});

    	return block;
    }

    // (248:6) {#if input && input[i].attack.length != 0}
    function create_if_block_1$2(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let each_value_1 = /*input*/ ctx[4][/*i*/ ctx[26]].attack;
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*ii*/ ctx[29];
    	validate_each_keys(ctx, each_value_1, get_each_context_1$2, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1$2(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1$2(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(target, anchor);
    				}
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*input, enermys*/ 144) {
    				each_value_1 = /*input*/ ctx[4][/*i*/ ctx[26]].attack;
    				validate_each_argument(each_value_1);
    				validate_each_keys(ctx, each_value_1, get_each_context_1$2, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, each_1_anchor.parentNode, destroy_block, create_each_block_1$2, each_1_anchor, get_each_context_1$2);
    			}
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(248:6) {#if input && input[i].attack.length != 0}",
    		ctx
    	});

    	return block;
    }

    // (249:8) {#each input[i].attack as a, ii (ii)}
    function create_each_block_1$2(key_1, ctx) {
    	let a;
    	let t_value = /*a*/ ctx[27].damage.toFixed(1) + "";
    	let t;
    	let a_class_value;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "class", a_class_value = "battle-input " + (/*a*/ ctx[27].critical && 'critical') + " svelte-2vu2l");
    			set_style(a, "left", 30 + r$2() * 150 + "px");
    			set_style(a, "top", 50 + r$2() * 150 + "px");
    			add_location(a, file$4, 249, 10, 7822);
    			this.first = a;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*input*/ 16 && t_value !== (t_value = /*a*/ ctx[27].damage.toFixed(1) + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*input*/ 16 && a_class_value !== (a_class_value = "battle-input " + (/*a*/ ctx[27].critical && 'critical') + " svelte-2vu2l")) {
    				attr_dev(a, "class", a_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(249:8) {#each input[i].attack as a, ii (ii)}",
    		ctx
    	});

    	return block;
    }

    // (257:6) {#if input && input[i].attack.length != 0}
    function create_if_block$2(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	var switch_value = handle[/*Data*/ ctx[6].role];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) mount_component(switch_instance, target, anchor);
    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (switch_value !== (switch_value = handle[/*Data*/ ctx[6].role])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(257:6) {#if input && input[i].attack.length != 0}",
    		ctx
    	});

    	return block;
    }

    // (199:2) {#each enermys as e, i (i)}
    function create_each_block$2(key_1, ctx) {
    	let div5;
    	let div0;
    	let img;
    	let img_src_value;
    	let img_class_value;
    	let t0;
    	let txt;
    	let t1_value = Enermy[/*e*/ ctx[24]].name + "";
    	let t1;
    	let t2;
    	let div3;
    	let div1;
    	let t3;
    	let div2;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t4;
    	let div4;
    	let t5;
    	let t6;
    	let t7;
    	let div5_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_2 = Object.keys(/*state*/ ctx[0][/*i*/ ctx[26]].buff);
    	validate_each_argument(each_value_2);
    	const get_key = ctx => /*ii*/ ctx[29];
    	validate_each_keys(ctx, each_value_2, get_each_context_2$2, get_key);

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		let child_ctx = get_each_context_2$2(ctx, each_value_2, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_2$2(key, child_ctx));
    	}

    	let if_block0 = /*input*/ ctx[4] && /*input*/ ctx[4][/*i*/ ctx[26]].attack.length != 0 && create_if_block_1$2(ctx);
    	let if_block1 = /*input*/ ctx[4] && /*input*/ ctx[4][/*i*/ ctx[26]].attack.length != 0 && create_if_block$2(ctx);

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[12](/*i*/ ctx[26], ...args);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div5 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			txt = element("txt");
    			t1 = text(t1_value);
    			t2 = space();
    			div3 = element("div");
    			div1 = element("div");
    			t3 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			div4 = element("div");
    			t5 = space();
    			if (if_block0) if_block0.c();
    			t6 = space();
    			if (if_block1) if_block1.c();
    			t7 = space();

    			if (!src_url_equal(img.src, img_src_value = `/img/enermy/${Enermy[/*e*/ ctx[24]].type}/${/*e*/ ctx[24]}/${/*input*/ ctx[4] && /*input*/ ctx[4][/*i*/ ctx[26]].attack.length != 0 || /*state*/ ctx[0][/*i*/ ctx[26]].Health <= 0
			? "hurt"
			: "portrait"}.png`)) attr_dev(img, "src", img_src_value);

    			attr_dev(img, "class", img_class_value = "" + (null_to_empty(`${/*input*/ ctx[4] && /*input*/ ctx[4][/*i*/ ctx[26]].attack.length != 0 && "animate_enermyShake"}`) + " svelte-2vu2l"));
    			add_location(img, file$4, 209, 8, 6345);
    			attr_dev(txt, "class", "svelte-2vu2l");
    			add_location(txt, file$4, 219, 8, 6685);
    			attr_dev(div0, "class", "enermy-info svelte-2vu2l");
    			add_location(div0, file$4, 208, 6, 6310);
    			attr_dev(div1, "class", "enermy-health svelte-2vu2l");

    			set_style(div1, "visibility", /*state*/ ctx[0][/*i*/ ctx[26]].Health / /*state*/ ctx[0][/*i*/ ctx[26]].health != 1
    			? 'visible'
    			: 'hidden');

    			set_style(div1, "background-image", `linear-gradient(90deg, white ${/*state*/ ctx[0][/*i*/ ctx[26]].Health / /*state*/ ctx[0][/*i*/ ctx[26]].health * 100}%, transparent ${/*state*/ ctx[0][/*i*/ ctx[26]].Health / /*state*/ ctx[0][/*i*/ ctx[26]].health * 100}%)`);
    			add_location(div1, file$4, 222, 8, 6770);
    			attr_dev(div2, "class", "enermy-buff svelte-2vu2l");
    			add_location(div2, file$4, 230, 8, 7131);
    			attr_dev(div3, "class", "enermy-state svelte-2vu2l");
    			add_location(div3, file$4, 221, 6, 6734);
    			attr_dev(div4, "class", "enermy-aim svelte-2vu2l");
    			add_location(div4, file$4, 246, 6, 7687);
    			attr_dev(div5, "class", div5_class_value = "" + (null_to_empty(`enermy ${!/*allAim*/ ctx[5] && /*Selected*/ ctx[1] && "oneAim"} ${/*state*/ ctx[0][/*i*/ ctx[26]].Health <= 0 && "animate_enermyOut"} ${/*ordered*/ ctx[2] == /*i*/ ctx[26] && "orderEnermy"}`) + " svelte-2vu2l"));
    			set_style(div5, "z-index", /*enermys*/ ctx[7].length - /*i*/ ctx[26]);
    			add_location(div5, file$4, 199, 4, 5998);
    			this.first = div5;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div0, img);
    			append_dev(div0, t0);
    			append_dev(div0, txt);
    			append_dev(txt, t1);
    			append_dev(div5, t2);
    			append_dev(div5, div3);
    			append_dev(div3, div1);
    			append_dev(div3, t3);
    			append_dev(div3, div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div2, null);
    				}
    			}

    			append_dev(div5, t4);
    			append_dev(div5, div4);
    			append_dev(div5, t5);
    			if (if_block0) if_block0.m(div5, null);
    			append_dev(div5, t6);
    			if (if_block1) if_block1.m(div5, null);
    			append_dev(div5, t7);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div5, "click", click_handler, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty[0] & /*input, state*/ 17 && !src_url_equal(img.src, img_src_value = `/img/enermy/${Enermy[/*e*/ ctx[24]].type}/${/*e*/ ctx[24]}/${/*input*/ ctx[4] && /*input*/ ctx[4][/*i*/ ctx[26]].attack.length != 0 || /*state*/ ctx[0][/*i*/ ctx[26]].Health <= 0
			? "hurt"
			: "portrait"}.png`)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!current || dirty[0] & /*input*/ 16 && img_class_value !== (img_class_value = "" + (null_to_empty(`${/*input*/ ctx[4] && /*input*/ ctx[4][/*i*/ ctx[26]].attack.length != 0 && "animate_enermyShake"}`) + " svelte-2vu2l"))) {
    				attr_dev(img, "class", img_class_value);
    			}

    			if (!current || dirty[0] & /*state*/ 1) {
    				set_style(div1, "visibility", /*state*/ ctx[0][/*i*/ ctx[26]].Health / /*state*/ ctx[0][/*i*/ ctx[26]].health != 1
    				? 'visible'
    				: 'hidden');
    			}

    			if (!current || dirty[0] & /*state*/ 1) {
    				set_style(div1, "background-image", `linear-gradient(90deg, white ${/*state*/ ctx[0][/*i*/ ctx[26]].Health / /*state*/ ctx[0][/*i*/ ctx[26]].health * 100}%, transparent ${/*state*/ ctx[0][/*i*/ ctx[26]].Health / /*state*/ ctx[0][/*i*/ ctx[26]].health * 100}%)`);
    			}

    			if (dirty[0] & /*state, enermys*/ 129) {
    				each_value_2 = Object.keys(/*state*/ ctx[0][/*i*/ ctx[26]].buff);
    				validate_each_argument(each_value_2);
    				group_outros();
    				validate_each_keys(ctx, each_value_2, get_each_context_2$2, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_2, each_1_lookup, div2, outro_and_destroy_block, create_each_block_2$2, null, get_each_context_2$2);
    				check_outros();
    			}

    			if (/*input*/ ctx[4] && /*input*/ ctx[4][/*i*/ ctx[26]].attack.length != 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$2(ctx);
    					if_block0.c();
    					if_block0.m(div5, t6);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*input*/ ctx[4] && /*input*/ ctx[4][/*i*/ ctx[26]].attack.length != 0) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*input*/ 16) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div5, t7);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*allAim, Selected, state, ordered*/ 39 && div5_class_value !== (div5_class_value = "" + (null_to_empty(`enermy ${!/*allAim*/ ctx[5] && /*Selected*/ ctx[1] && "oneAim"} ${/*state*/ ctx[0][/*i*/ ctx[26]].Health <= 0 && "animate_enermyOut"} ${/*ordered*/ ctx[2] == /*i*/ ctx[26] && "orderEnermy"}`) + " svelte-2vu2l"))) {
    				attr_dev(div5, "class", div5_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(199:2) {#each enermys as e, i (i)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let div_class_value;
    	let current;
    	let each_value = /*enermys*/ ctx[7];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*i*/ ctx[26];
    	validate_each_keys(ctx, each_value, get_each_context$2, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$2(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$2(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", div_class_value = "enermys " + (/*allAim*/ ctx[5] && 'allAim') + " svelte-2vu2l");
    			add_location(div, file$4, 197, 0, 5919);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*allAim, Selected, state, enermys, ordered, aimed, Data, input*/ 255) {
    				each_value = /*enermys*/ ctx[7];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$2, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block$2, null, get_each_context$2);
    				check_outros();
    			}

    			if (!current || dirty[0] & /*allAim*/ 32 && div_class_value !== (div_class_value = "enermys " + (/*allAim*/ ctx[5] && 'allAim') + " svelte-2vu2l")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
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

    function r$2() {
    	return Math.random();
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let allAim;
    	let $cache;
    	let $data;
    	let $explore;
    	validate_store(cache$1, 'cache');
    	component_subscribe($$self, cache$1, $$value => $$invalidate(13, $cache = $$value));
    	validate_store(data, 'data');
    	component_subscribe($$self, data, $$value => $$invalidate(14, $data = $$value));
    	validate_store(explore, 'explore');
    	component_subscribe($$self, explore, $$value => $$invalidate(15, $explore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('BattleEnermy', slots, []);
    	let { Selected } = $$props;
    	let { state } = $$props;
    	let { ordered } = $$props;
    	let { aimed } = $$props;
    	let { critical } = $$props;
    	let { killEvent } = $$props;

    	const enermy = {
    		round,
    		output,
    		input: inputHandle,
    		state: _ => state
    	};

    	let { role } = $$props;
    	const Explore = deepCopy($explore);
    	const Data = deepCopy($data);
    	const enermys = Explore.target.map((t, i) => t && Explore.enermy[i]).filter(e => e);

    	state = enermys.map(e => {
    		let s = growth.enermy[e](Explore.lv);
    		s.Health = s.health;
    		s.buff = {};
    		return s;
    	});

    	let input = null;

    	function inputHandle(Input, index) {
    		let res = enermys.map(_ => {
    			return { attack: [], buff: [], heal: [] };
    		});

    		let selfAim = { heal: [], attack: [], buff: [] };
    		let e = [...Array(res.length).keys()];

    		let aim = {
    			one: [index],
    			all: e,
    			else: e.filter(i => i != index),
    			average: e,
    			random: e.filter(i => state[i].Health > 0).rd().splice(0, 1)
    		};

    		let roleState = role.state();

    		for (let attack of Input.attack) {
    			let damage = Number(attack.value);
    			attack.amount = attack.amount ? attack.amount : 1;
    			if (attack.type == "scale") damage *= roleState.attack * 0.01;
    			if (attack.type == "real") ;
    			if (attack.aim == "average") damage /= e.filter(i => state[i].Health > 0).length;
    			let att = deepCopy(attack);
    			att.critical = "critical" in att ? att.critical : critical(att.from);
    			let criticalDamage = 1.5;
    			att.from == "role" && C("human_soul_lamp", amount => criticalDamage += amount * 0.5);
    			att.damage = damage * (att.critical ? criticalDamage : 1);

    			if (attack.aim == "self") selfAim.attack.push(att); else for (let i of aim[attack.aim]) {
    				let Att = deepCopy(att);

    				C("compass_cat", amount => {
    					if (role.state().speed < state[i].speed) Att.damage *= 1 + amount * 0.1;
    				});

    				if (attack.type == "rate") Att.damage *= state[i].health;
    				if (attack.type == "Rate") Att.damage *= state[i].Health;
    				res[i].attack.push(Att);
    			}
    		}

    		for (let heal of Input.heal) selfAim.heal.push(heal);

    		for (let Buff of Input.buff) {
    			if (Buff.aim == "self") selfAim.buff.push({ value: Buff.value, amount: Buff.amount }); else for (let i of aim[Buff.aim]) res[i].buff.push(Buff);
    		}

    		let r = effectHandle(res);
    		for (let i in r) r[i].forEach(u => selfAim[i].push(u));
    		return selfAim;
    	}

    	function effectHandle(Effect) {
    		const res = { attack: [], buff: [], heal: [] };
    		const effect = deepCopy(Effect);

    		effect.forEach((e, i) => {
    			for (let a of e.attack) {
    				if (a.indirect) {
    					a.from == "role" && C("sundial", amount => a.damage *= 1 + amount * 0.1);
    				}

    				if (state[i].Health > 0 && state[i].Health - a.damage <= 0) killEvent(i);

    				if (a.damage > 0 && a.from == "role") {
    					//“造成伤害”事件
    					role.buff("seal_needle");

    					C("bottle_of_stars", amount => {
    						if (a.damage >= role.state().attack * 2) {
    							e.buff.push({ value: "star", amount });
    							if (!$cache["bottle_of_stars"]) set_store_value(cache$1, $cache["bottle_of_stars"] = [], $cache);
    							for (let u = 0; u < amount; u++) $cache["bottle_of_stars"].push({ index: i, damage: a.damage * 0.6 });
    						}
    					});
    				}

    				$$invalidate(0, state[i].Health -= a.damage, state);
    			}

    			for (let h of e.heal) {
    				healthSet(h + state[i].Health);
    				delete state[i].buff["bleed"];
    			}

    			for (let b of e.buff) {
    				$$invalidate(
    					0,
    					state[i].buff[b.value] = state[i].buff[b.value]
    					? state[i].buff[b.value] + b.amount
    					: b.amount,
    					state
    				);
    			}
    		});

    		$$invalidate(4, input = effect);
    		$$invalidate(0, state);
    		setTimeout(_ => $$invalidate(4, input = null), 800);
    		return res;
    	}

    	function output() {
    		const speeds = state.map(i => i.speed), order = [];

    		for (let i = 0; i < speeds.length; i++) {
    			let index = speeds.indexOf(Math.max(...speeds));
    			order.push(index);
    			speeds[index] = 0;
    		}

    		return order.map(i => ai(Explore.lv, enermys[i]).map(n => calculate.output(state[i], c => set_store_value(cache$1, $cache = c, $cache), n)));
    	}

    	function round(roundEvent, index) {
    		roundEvent({
    			health: state[index].Health,
    			state: state[index],
    			buff: state[index].buff,
    			input: i => inputHandle(i, index),
    			power: _ => null,
    			index
    		});

    		$$invalidate(0, state);
    	}

    	function B(i, n, f) {
    		if (n in state[i].buff) {
    			f(state[i].buff[n]);

    			if (buffs[n].expend) state[i].buff[n] == 1
    			? delete state[i].buff[n]
    			: $$invalidate(0, state[i].buff[n]--, state);
    		}
    	}

    	function C(n, f) {
    		if (n in Data.collections) f(Data.collections[n]);
    	}

    	function healthSet(h, i) {
    		health = h > state.health ? state.health : h;
    	}

    	$$self.$$.on_mount.push(function () {
    		if (Selected === undefined && !('Selected' in $$props || $$self.$$.bound[$$self.$$.props['Selected']])) {
    			console.warn("<BattleEnermy> was created without expected prop 'Selected'");
    		}

    		if (state === undefined && !('state' in $$props || $$self.$$.bound[$$self.$$.props['state']])) {
    			console.warn("<BattleEnermy> was created without expected prop 'state'");
    		}

    		if (ordered === undefined && !('ordered' in $$props || $$self.$$.bound[$$self.$$.props['ordered']])) {
    			console.warn("<BattleEnermy> was created without expected prop 'ordered'");
    		}

    		if (aimed === undefined && !('aimed' in $$props || $$self.$$.bound[$$self.$$.props['aimed']])) {
    			console.warn("<BattleEnermy> was created without expected prop 'aimed'");
    		}

    		if (critical === undefined && !('critical' in $$props || $$self.$$.bound[$$self.$$.props['critical']])) {
    			console.warn("<BattleEnermy> was created without expected prop 'critical'");
    		}

    		if (killEvent === undefined && !('killEvent' in $$props || $$self.$$.bound[$$self.$$.props['killEvent']])) {
    			console.warn("<BattleEnermy> was created without expected prop 'killEvent'");
    		}

    		if (role === undefined && !('role' in $$props || $$self.$$.bound[$$self.$$.props['role']])) {
    			console.warn("<BattleEnermy> was created without expected prop 'role'");
    		}
    	});

    	const writable_props = ['Selected', 'state', 'ordered', 'aimed', 'critical', 'killEvent', 'role'];

    	Object_1$2.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<BattleEnermy> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (i, _) => {
    		if (state[i].Health > 0 && Selected) aimed(i);
    	};

    	$$self.$$set = $$props => {
    		if ('Selected' in $$props) $$invalidate(1, Selected = $$props.Selected);
    		if ('state' in $$props) $$invalidate(0, state = $$props.state);
    		if ('ordered' in $$props) $$invalidate(2, ordered = $$props.ordered);
    		if ('aimed' in $$props) $$invalidate(3, aimed = $$props.aimed);
    		if ('critical' in $$props) $$invalidate(8, critical = $$props.critical);
    		if ('killEvent' in $$props) $$invalidate(9, killEvent = $$props.killEvent);
    		if ('role' in $$props) $$invalidate(11, role = $$props.role);
    	};

    	$$self.$capture_state = () => ({
    		explore,
    		data,
    		cache: cache$1,
    		spellcard,
    		Enermy,
    		buffs,
    		growth,
    		ai,
    		calculate,
    		attackAnimation: handle,
    		Explain,
    		Selected,
    		state,
    		ordered,
    		aimed,
    		critical,
    		killEvent,
    		enermy,
    		role,
    		Explore,
    		Data,
    		enermys,
    		input,
    		r: r$2,
    		inputHandle,
    		effectHandle,
    		output,
    		round,
    		B,
    		C,
    		healthSet,
    		allAim,
    		$cache,
    		$data,
    		$explore
    	});

    	$$self.$inject_state = $$props => {
    		if ('Selected' in $$props) $$invalidate(1, Selected = $$props.Selected);
    		if ('state' in $$props) $$invalidate(0, state = $$props.state);
    		if ('ordered' in $$props) $$invalidate(2, ordered = $$props.ordered);
    		if ('aimed' in $$props) $$invalidate(3, aimed = $$props.aimed);
    		if ('critical' in $$props) $$invalidate(8, critical = $$props.critical);
    		if ('killEvent' in $$props) $$invalidate(9, killEvent = $$props.killEvent);
    		if ('role' in $$props) $$invalidate(11, role = $$props.role);
    		if ('input' in $$props) $$invalidate(4, input = $$props.input);
    		if ('allAim' in $$props) $$invalidate(5, allAim = $$props.allAim);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*Selected*/ 2) {
    			$$invalidate(5, allAim = Selected == null
    			? false
    			: "allAim" in spellcard[Selected]);
    		}
    	};

    	return [
    		state,
    		Selected,
    		ordered,
    		aimed,
    		input,
    		allAim,
    		Data,
    		enermys,
    		critical,
    		killEvent,
    		enermy,
    		role,
    		click_handler
    	];
    }

    class BattleEnermy extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$4,
    			create_fragment$4,
    			safe_not_equal,
    			{
    				Selected: 1,
    				state: 0,
    				ordered: 2,
    				aimed: 3,
    				critical: 8,
    				killEvent: 9,
    				enermy: 10,
    				role: 11
    			},
    			null,
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BattleEnermy",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get Selected() {
    		throw new Error("<BattleEnermy>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Selected(value) {
    		throw new Error("<BattleEnermy>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get state() {
    		throw new Error("<BattleEnermy>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set state(value) {
    		throw new Error("<BattleEnermy>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ordered() {
    		throw new Error("<BattleEnermy>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ordered(value) {
    		throw new Error("<BattleEnermy>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get aimed() {
    		throw new Error("<BattleEnermy>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set aimed(value) {
    		throw new Error("<BattleEnermy>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get critical() {
    		throw new Error("<BattleEnermy>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set critical(value) {
    		throw new Error("<BattleEnermy>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get killEvent() {
    		throw new Error("<BattleEnermy>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set killEvent(value) {
    		throw new Error("<BattleEnermy>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get enermy() {
    		return this.$$.ctx[10];
    	}

    	set enermy(value) {
    		throw new Error("<BattleEnermy>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get role() {
    		throw new Error("<BattleEnermy>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set role(value) {
    		throw new Error("<BattleEnermy>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\page\battleState.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1$1 } = globals;
    const file$3 = "src\\page\\battleState.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[24] = list[i];
    	child_ctx[26] = i;
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[27] = list[i];
    	child_ctx[26] = i;
    	return child_ctx;
    }

    function get_each_context_2$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[29] = list[i];
    	child_ctx[26] = i;
    	return child_ctx;
    }

    // (225:8) {#if Object.values(buff)[i] > 1}
    function create_if_block_2$1(ctx) {
    	let txt;
    	let t_value = Object.values(/*buff*/ ctx[0])[/*i*/ ctx[26]] + "";
    	let t;

    	const block = {
    		c: function create() {
    			txt = element("txt");
    			t = text(t_value);
    			attr_dev(txt, "class", "svelte-16s3vpv");
    			add_location(txt, file$3, 225, 10, 6928);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, txt, anchor);
    			append_dev(txt, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*buff*/ 1 && t_value !== (t_value = Object.values(/*buff*/ ctx[0])[/*i*/ ctx[26]] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(txt);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(225:8) {#if Object.values(buff)[i] > 1}",
    		ctx
    	});

    	return block;
    }

    // (222:4) {#each Object.keys(buff) as b, i (i)}
    function create_each_block_2$1(key_1, ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let t0;
    	let show_if = Object.values(/*buff*/ ctx[0])[/*i*/ ctx[26]] > 1;
    	let t1;
    	let explain;
    	let t2;
    	let current;
    	let if_block = show_if && create_if_block_2$1(ctx);

    	explain = new Explain({
    			props: {
    				title: buffs[/*b*/ ctx[29]].name,
    				detail: buffs[/*b*/ ctx[29]].detail,
    				color: buffs[/*b*/ ctx[29]].positive ? "blue" : "purple"
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();
    			create_component(explain.$$.fragment);
    			t2 = space();
    			if (!src_url_equal(img.src, img_src_value = "/svg/buff/" + /*b*/ ctx[29] + ".svg")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$3, 223, 8, 6843);
    			attr_dev(div, "class", "svelte-16s3vpv");
    			add_location(div, file$3, 222, 6, 6828);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t0);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t1);
    			mount_component(explain, div, null);
    			append_dev(div, t2);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty & /*buff*/ 1 && !src_url_equal(img.src, img_src_value = "/svg/buff/" + /*b*/ ctx[29] + ".svg")) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*buff*/ 1) show_if = Object.values(/*buff*/ ctx[0])[/*i*/ ctx[26]] > 1;

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2$1(ctx);
    					if_block.c();
    					if_block.m(div, t1);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			const explain_changes = {};
    			if (dirty & /*buff*/ 1) explain_changes.title = buffs[/*b*/ ctx[29]].name;
    			if (dirty & /*buff*/ 1) explain_changes.detail = buffs[/*b*/ ctx[29]].detail;
    			if (dirty & /*buff*/ 1) explain_changes.color = buffs[/*b*/ ctx[29]].positive ? "blue" : "purple";
    			explain.$set(explain_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(explain.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(explain.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			destroy_component(explain);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$1.name,
    		type: "each",
    		source: "(222:4) {#each Object.keys(buff) as b, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (241:2) {#if input && "attack" in input && input.attack.length != 0}
    function create_if_block_1$1(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let each_value_1 = /*input*/ ctx[5].attack;
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*i*/ ctx[26];
    	validate_each_keys(ctx, each_value_1, get_each_context_1$1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1$1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(target, anchor);
    				}
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*input, r*/ 32) {
    				each_value_1 = /*input*/ ctx[5].attack;
    				validate_each_argument(each_value_1);
    				validate_each_keys(ctx, each_value_1, get_each_context_1$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, each_1_anchor.parentNode, destroy_block, create_each_block_1$1, each_1_anchor, get_each_context_1$1);
    			}
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(241:2) {#if input && \\\"attack\\\" in input && input.attack.length != 0}",
    		ctx
    	});

    	return block;
    }

    // (242:4) {#each input.attack as a, i (i)}
    function create_each_block_1$1(key_1, ctx) {
    	let txt;
    	let t_value = /*a*/ ctx[27].damage.toFixed(1) + "";
    	let t;
    	let txt_class_value;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			txt = element("txt");
    			t = text(t_value);
    			attr_dev(txt, "class", txt_class_value = "battle-input " + (/*a*/ ctx[27].critical && 'critical') + " svelte-16s3vpv");
    			set_style(txt, "left", 90 + r$1() * 150 + "px");
    			set_style(txt, "top", r$1() * 60 - 40 + "px");
    			add_location(txt, file$3, 242, 6, 7511);
    			this.first = txt;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, txt, anchor);
    			append_dev(txt, t);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*input*/ 32 && t_value !== (t_value = /*a*/ ctx[27].damage.toFixed(1) + "")) set_data_dev(t, t_value);

    			if (dirty & /*input*/ 32 && txt_class_value !== (txt_class_value = "battle-input " + (/*a*/ ctx[27].critical && 'critical') + " svelte-16s3vpv")) {
    				attr_dev(txt, "class", txt_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(txt);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(242:4) {#each input.attack as a, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (250:2) {#if input && "heal" in input && input.heal.length != 0}
    function create_if_block$1(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let each_value = /*input*/ ctx[5].heal;
    	validate_each_argument(each_value);
    	const get_key = ctx => /*i*/ ctx[26];
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(target, anchor);
    				}
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*r, input*/ 32) {
    				each_value = /*input*/ ctx[5].heal;
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, destroy_block, create_each_block$1, each_1_anchor, get_each_context$1);
    			}
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(250:2) {#if input && \\\"heal\\\" in input && input.heal.length != 0}",
    		ctx
    	});

    	return block;
    }

    // (251:4) {#each input.heal as h, i (i)}
    function create_each_block$1(key_1, ctx) {
    	let txt;
    	let t_value = /*h*/ ctx[24].toFixed(1) + "";
    	let t;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			txt = element("txt");
    			t = text(t_value);
    			attr_dev(txt, "class", "battle-heal");
    			set_style(txt, "left", 90 + r$1() * 150 + "px");
    			set_style(txt, "top", r$1() * 60 - 40 + "px");
    			add_location(txt, file$3, 251, 6, 7807);
    			this.first = txt;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, txt, anchor);
    			append_dev(txt, t);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*input*/ 32 && t_value !== (t_value = /*h*/ ctx[24].toFixed(1) + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(txt);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(251:4) {#each input.heal as h, i (i)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div7;
    	let div1;
    	let div0;
    	let t0;
    	let img;
    	let img_src_value;
    	let t1;
    	let div2;
    	let txt0;
    	let t2;
    	let t3;
    	let explain;
    	let t4;
    	let div3;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t5;
    	let div5;
    	let txt1;
    	let t6_value = /*health*/ ctx[2].toFixed(0) + "";
    	let t6;
    	let t7;
    	let t8_value = /*state*/ ctx[1].health + "";
    	let t8;
    	let t9;
    	let div4;
    	let t10;
    	let div6;
    	let t12;
    	let t13;
    	let current;

    	explain = new Explain({
    			props: {
    				title: "额外灵力",
    				detail: "等同于灵力，优先消耗。",
    				color: "blue"
    			},
    			$$inline: true
    		});

    	let each_value_2 = Object.keys(/*buff*/ ctx[0]);
    	validate_each_argument(each_value_2);
    	const get_key = ctx => /*i*/ ctx[26];
    	validate_each_keys(ctx, each_value_2, get_each_context_2$1, get_key);

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		let child_ctx = get_each_context_2$1(ctx, each_value_2, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_2$1(key, child_ctx));
    	}

    	let if_block0 = /*input*/ ctx[5] && "attack" in /*input*/ ctx[5] && /*input*/ ctx[5].attack.length != 0 && create_if_block_1$1(ctx);
    	let if_block1 = /*input*/ ctx[5] && "heal" in /*input*/ ctx[5] && /*input*/ ctx[5].heal.length != 0 && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t0 = space();
    			img = element("img");
    			t1 = space();
    			div2 = element("div");
    			txt0 = element("txt");
    			t2 = text(/*exPower*/ ctx[4]);
    			t3 = space();
    			create_component(explain.$$.fragment);
    			t4 = space();
    			div3 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			div5 = element("div");
    			txt1 = element("txt");
    			t6 = text(t6_value);
    			t7 = text(" / ");
    			t8 = text(t8_value);
    			t9 = space();
    			div4 = element("div");
    			t10 = space();
    			div6 = element("div");
    			div6.textContent = `${role$1[/*Data*/ ctx[7].role].title}`;
    			t12 = space();
    			if (if_block0) if_block0.c();
    			t13 = space();
    			if (if_block1) if_block1.c();
    			set_style(div0, "height", (1 - /*power*/ ctx[3] / /*state*/ ctx[1].power) * 100 + "%");
    			attr_dev(div0, "class", "svelte-16s3vpv");
    			add_location(div0, file$3, 213, 4, 6437);
    			if (!src_url_equal(img.src, img_src_value = `/img/role/${/*$setting*/ ctx[6].resource}/${/*Data*/ ctx[7].role}.webp`)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-16s3vpv");
    			add_location(img, file$3, 214, 4, 6500);
    			attr_dev(div1, "class", "power svelte-16s3vpv");
    			add_location(div1, file$3, 212, 2, 6412);
    			attr_dev(txt0, "class", "svelte-16s3vpv");
    			add_location(txt0, file$3, 217, 4, 6661);
    			attr_dev(div2, "class", "exPower svelte-16s3vpv");
    			set_style(div2, "visibility", /*exPower*/ ctx[4] > 0 ? 'visible' : 'hidden');
    			add_location(div2, file$3, 216, 2, 6578);
    			attr_dev(div3, "class", "buff svelte-16s3vpv");
    			add_location(div3, file$3, 220, 2, 6759);
    			attr_dev(txt1, "class", "health-value svelte-16s3vpv");
    			add_location(txt1, file$3, 236, 4, 7201);
    			set_style(div4, "left", /*health*/ ctx[2] / /*state*/ ctx[1].health * 100 - 100 + "%");
    			attr_dev(div4, "class", "svelte-16s3vpv");
    			add_location(div4, file$3, 237, 4, 7275);
    			attr_dev(div5, "class", "health svelte-16s3vpv");
    			add_location(div5, file$3, 235, 2, 7175);
    			attr_dev(div6, "class", "state-role svelte-16s3vpv");
    			add_location(div6, file$3, 239, 2, 7348);
    			attr_dev(div7, "class", "state svelte-16s3vpv");
    			add_location(div7, file$3, 211, 0, 6389);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div1);
    			append_dev(div1, div0);
    			append_dev(div1, t0);
    			append_dev(div1, img);
    			append_dev(div7, t1);
    			append_dev(div7, div2);
    			append_dev(div2, txt0);
    			append_dev(txt0, t2);
    			append_dev(div2, t3);
    			mount_component(explain, div2, null);
    			append_dev(div7, t4);
    			append_dev(div7, div3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div3, null);
    				}
    			}

    			append_dev(div7, t5);
    			append_dev(div7, div5);
    			append_dev(div5, txt1);
    			append_dev(txt1, t6);
    			append_dev(txt1, t7);
    			append_dev(txt1, t8);
    			append_dev(div5, t9);
    			append_dev(div5, div4);
    			append_dev(div7, t10);
    			append_dev(div7, div6);
    			append_dev(div7, t12);
    			if (if_block0) if_block0.m(div7, null);
    			append_dev(div7, t13);
    			if (if_block1) if_block1.m(div7, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*power, state*/ 10) {
    				set_style(div0, "height", (1 - /*power*/ ctx[3] / /*state*/ ctx[1].power) * 100 + "%");
    			}

    			if (!current || dirty & /*$setting*/ 64 && !src_url_equal(img.src, img_src_value = `/img/role/${/*$setting*/ ctx[6].resource}/${/*Data*/ ctx[7].role}.webp`)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!current || dirty & /*exPower*/ 16) set_data_dev(t2, /*exPower*/ ctx[4]);

    			if (!current || dirty & /*exPower*/ 16) {
    				set_style(div2, "visibility", /*exPower*/ ctx[4] > 0 ? 'visible' : 'hidden');
    			}

    			if (dirty & /*buffs, Object, buff*/ 1) {
    				each_value_2 = Object.keys(/*buff*/ ctx[0]);
    				validate_each_argument(each_value_2);
    				group_outros();
    				validate_each_keys(ctx, each_value_2, get_each_context_2$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_2, each_1_lookup, div3, outro_and_destroy_block, create_each_block_2$1, null, get_each_context_2$1);
    				check_outros();
    			}

    			if ((!current || dirty & /*health*/ 4) && t6_value !== (t6_value = /*health*/ ctx[2].toFixed(0) + "")) set_data_dev(t6, t6_value);
    			if ((!current || dirty & /*state*/ 2) && t8_value !== (t8_value = /*state*/ ctx[1].health + "")) set_data_dev(t8, t8_value);

    			if (!current || dirty & /*health, state*/ 6) {
    				set_style(div4, "left", /*health*/ ctx[2] / /*state*/ ctx[1].health * 100 - 100 + "%");
    			}

    			if (/*input*/ ctx[5] && "attack" in /*input*/ ctx[5] && /*input*/ ctx[5].attack.length != 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					if_block0.m(div7, t13);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*input*/ ctx[5] && "heal" in /*input*/ ctx[5] && /*input*/ ctx[5].heal.length != 0) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					if_block1.m(div7, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(explain.$$.fragment, local);

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(explain.$$.fragment, local);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			destroy_component(explain);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
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

    function r$1() {
    	return Math.random();
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $cache;
    	let $data;
    	let $setting;
    	validate_store(cache$1, 'cache');
    	component_subscribe($$self, cache$1, $$value => $$invalidate(13, $cache = $$value));
    	validate_store(data, 'data');
    	component_subscribe($$self, data, $$value => $$invalidate(14, $data = $$value));
    	validate_store(setting, 'setting');
    	component_subscribe($$self, setting, $$value => $$invalidate(6, $setting = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('BattleState', slots, []);
    	const Data = deepCopy($data);
    	let buff = {};
    	let state = growth.role[Data.role](Data.lv);
    	C("patchouli's_ribbon", amount => $$invalidate(1, state.power += amount, state));
    	C("seal_needle", _ => $$invalidate(0, buff["seal_needle"] = 8, buff));
    	let health = state.health;
    	let power = state.power;
    	let exPower = 0;
    	let input;

    	const powerHandle = {
    		cost: cost => {
    			let left = power + exPower - cost;
    			$$invalidate(4, exPower = left <= power ? 0 : exPower - cost);
    			if (left <= power) $$invalidate(3, power = left);
    			return left;
    		},
    		reset: _ => $$invalidate(3, power = state.power),
    		add: n => $$invalidate(4, exPower += n),
    		get: _ => power + exPower
    	};

    	const Power = powerHandle;
    	let { critical } = $$props;

    	const role = {
    		round,
    		input: inputHandle,
    		output,
    		state: _ => {
    			let s = deepCopy(state);
    			s.Health = health;

    			C("corvis_feathers", amount => {
    				if (Object.keys(buff).reduce((a, c) => a + Number(buffs[c].positive == true), 0) >= 2) s.speed += amount * 0.05;
    			});

    			return s;
    		},
    		buff: buffHandle
    	};

    	let { enermy } = $$props;
    	let { killEvent } = $$props;

    	function buffHandle(v) {
    		if (v === true) for (let b in buff) buffs[b].positive && delete buff[b];
    		if (v === false) for (let b in buff) !buffs[b].positive && delete buff[b];
    		if (v == "seal_needle") $$invalidate(0, buff["seal_needle"] -= 1, buff); else return buff[v];
    	}

    	function output(Selected) {
    		const D = deepCopy(Data);
    		D.state = state;
    		D.buff = buff;
    		D.health = health;
    		return calculate.output(D, c => set_store_value(cache$1, $cache = c, $cache), Selected);
    	}

    	function inputHandle(Input, index) {
    		let enermyState = enermy.state()[index];
    		let res = { attack: [], buff: [], heal: [] };
    		let selfAim = { heal: [], attack: [], buff: [] };

    		for (let attack of Input.attack) {
    			let damage = Number(attack.value);
    			attack.amount = attack.amount ? attack.amount : 1;
    			if (attack.type == "scale") damage *= enermyState.attack * 0.01;
    			if (attack.type == "extra") ;
    			if (attack.aim == "average") ;
    			let att = deepCopy(attack);
    			att.critical = "critical" in att ? att.critical : critical(att.from);
    			let criticalDamage = 1.5;
    			att.from == "role" && C("human_soul_lamp", amount => criticalDamage += amount * 0.5);
    			att.damage = damage * (att.critical ? criticalDamage : 1);

    			if (attack.aim == "self") selfAim.attack.push(att); else {
    				if (attack.type == "rate") att.damage *= state.health;
    				if (attack.type == "Rate") att.damage *= health;
    				res.attack.push(att);
    			}
    		}

    		for (let heal of Input.heal) {
    			if (heal.type == "value") res.heal.push(heal.value);
    			if (heal.type == "rate") res.heal.push(heal.value * state.health);
    			if (heal.type == "Rate") res.heal.push(heal.value * health);
    		}

    		for (let Buff of Input.buff) {
    			if (Buff.aim == "self") selfAim.buff.push({ value: Buff.value, amount: Buff.amount }); else res.buff.push(Buff);
    		}

    		let r = effectHandle(res);
    		for (let i in r) r[i].forEach(u => selfAim[i].push(u));
    		return selfAim;
    	}

    	function effectHandle(Effect) {
    		const res = { attack: [], buff: [], heal: [] };
    		let effect = deepCopy(Effect);

    		for (let a of effect.attack) {
    			C("mimosa", amount => {
    				let limit = state.attack * 3 * Math.pow(0.95, amount - 1);
    				if (a.damage > limit) a.damage = limit;
    			});

    			C("conch_shell", amount => a.damage -= amount);
    			if (a.damage < 0) a.damage = 0;

    			B("interim_barrier", amount => {
    				if (amount > a.damage) {
    					$$invalidate(0, buff["interim_barrier"] -= Math.ceil(a.damage), buff);
    					a.damage = 0;
    				} else {
    					a.damage -= amount;
    					delete buff["interim_barrier"];
    				}
    			});

    			C("magic_dart", amount => {
    				if (a.damage > 0) res.attack.push({
    					value: (0.2 + (amount - 1) * 0.1) * a.damage,
    					type: "real",
    					aim: "one",
    					indirect: true,
    					from: "role"
    				});
    			});

    			C("large_roll_of_bandages", amount => {
    				if (a.damage > 0) $$invalidate(0, buff["in_treatment"] = amount, buff);
    			});

    			C("red_and_white_scarf", amount => {
    				if (health / Data.health > 0.3 * Math.pow(0.9, amount - 1) && health - a.damage <= 0) a.damage = health - 1;
    			});

    			$$invalidate(2, health -= a.damage);

    			C("fox_jade", amount => {
    				a.damage / state.health >= 0.4 * Math.pow(0.95, amount - 1) && killEvent();
    			});
    		}

    		for (let h of effect.heal) {
    			healthSet(h + health);

    			h + health > state.health && C("cherry", amount => effect.buff.push({
    				value: "interim_barrier",
    				amount: Math.ceil((h + health - state.health) * 0.2 * amount)
    			}));

    			delete buff["bleed"];
    		}

    		for (let b of effect.buff) {
    			$$invalidate(0, buff[b.value] = buff[b.value] ? buff[b.value] + b.amount : b.amount, buff);
    		}

    		$$invalidate(5, input = effect);
    		setTimeout(_ => $$invalidate(5, input = null), 800);
    		return res;
    	}

    	function healthSet(h) {
    		$$invalidate(2, health = h > state.health ? state.health : h);
    	}

    	function round(roundEvent) {
    		roundEvent({
    			health,
    			state,
    			buff,
    			input: inputHandle,
    			power: _ => powerHandle.reset()
    		});

    		$$invalidate(0, buff);
    	}

    	function B(n, f) {
    		if (n in buff) {
    			let a = buff[n];
    			!buffs[n].positive && C("fish_stone", amount => a -= amount);
    			f(a >= 0 ? a : 0);

    			if (buffs[n].expend) buff[n] == 1
    			? delete buff[n]
    			: $$invalidate(0, buff[n]--, buff);
    		}
    	}

    	function C(n, f) {
    		if (n in Data.collections) f(Data.collections[n]);
    	}

    	$$self.$$.on_mount.push(function () {
    		if (critical === undefined && !('critical' in $$props || $$self.$$.bound[$$self.$$.props['critical']])) {
    			console.warn("<BattleState> was created without expected prop 'critical'");
    		}

    		if (enermy === undefined && !('enermy' in $$props || $$self.$$.bound[$$self.$$.props['enermy']])) {
    			console.warn("<BattleState> was created without expected prop 'enermy'");
    		}

    		if (killEvent === undefined && !('killEvent' in $$props || $$self.$$.bound[$$self.$$.props['killEvent']])) {
    			console.warn("<BattleState> was created without expected prop 'killEvent'");
    		}
    	});

    	const writable_props = ['critical', 'enermy', 'killEvent'];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<BattleState> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('critical' in $$props) $$invalidate(9, critical = $$props.critical);
    		if ('enermy' in $$props) $$invalidate(11, enermy = $$props.enermy);
    		if ('killEvent' in $$props) $$invalidate(12, killEvent = $$props.killEvent);
    	};

    	$$self.$capture_state = () => ({
    		data,
    		cache: cache$1,
    		setting,
    		growth,
    		Role: role$1,
    		buffs,
    		Explain,
    		calculate,
    		Data,
    		buff,
    		state,
    		health,
    		power,
    		exPower,
    		input,
    		powerHandle,
    		Power,
    		critical,
    		role,
    		enermy,
    		killEvent,
    		r: r$1,
    		buffHandle,
    		output,
    		inputHandle,
    		effectHandle,
    		healthSet,
    		round,
    		B,
    		C,
    		$cache,
    		$data,
    		$setting
    	});

    	$$self.$inject_state = $$props => {
    		if ('buff' in $$props) $$invalidate(0, buff = $$props.buff);
    		if ('state' in $$props) $$invalidate(1, state = $$props.state);
    		if ('health' in $$props) $$invalidate(2, health = $$props.health);
    		if ('power' in $$props) $$invalidate(3, power = $$props.power);
    		if ('exPower' in $$props) $$invalidate(4, exPower = $$props.exPower);
    		if ('input' in $$props) $$invalidate(5, input = $$props.input);
    		if ('critical' in $$props) $$invalidate(9, critical = $$props.critical);
    		if ('enermy' in $$props) $$invalidate(11, enermy = $$props.enermy);
    		if ('killEvent' in $$props) $$invalidate(12, killEvent = $$props.killEvent);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		buff,
    		state,
    		health,
    		power,
    		exPower,
    		input,
    		$setting,
    		Data,
    		Power,
    		critical,
    		role,
    		enermy,
    		killEvent
    	];
    }

    class BattleState extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			Power: 8,
    			critical: 9,
    			role: 10,
    			enermy: 11,
    			killEvent: 12
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BattleState",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get Power() {
    		return this.$$.ctx[8];
    	}

    	set Power(value) {
    		throw new Error("<BattleState>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get critical() {
    		throw new Error("<BattleState>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set critical(value) {
    		throw new Error("<BattleState>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get role() {
    		return this.$$.ctx[10];
    	}

    	set role(value) {
    		throw new Error("<BattleState>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get enermy() {
    		throw new Error("<BattleState>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set enermy(value) {
    		throw new Error("<BattleState>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get killEvent() {
    		throw new Error("<BattleState>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set killEvent(value) {
    		throw new Error("<BattleState>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\page\battle.svelte generated by Svelte v3.59.2 */
    const file$2 = "src\\page\\battle.svelte";

    function create_fragment$2(ctx) {
    	let div7;
    	let div6;
    	let enermy_1;
    	let updating_enermy;
    	let t0;
    	let div0;
    	let t1;
    	let spellcard;
    	let updating_used;
    	let updating_Selected;
    	let updating_refresh;
    	let t2;
    	let state;
    	let updating_Power;
    	let updating_role;
    	let t3;
    	let div5;
    	let div1;
    	let img0;
    	let img0_src_value;
    	let t4;
    	let txt0;
    	let t6;
    	let div2;
    	let img1;
    	let img1_src_value;
    	let t7;
    	let txt1;
    	let t9;
    	let div3;
    	let img2;
    	let img2_src_value;
    	let t10;
    	let txt2;
    	let t12;
    	let div4;
    	let txt3;
    	let div4_class_value;
    	let div7_class_value;
    	let div7_intro;
    	let div7_outro;
    	let current;
    	let mounted;
    	let dispose;

    	function enermy_1_enermy_binding(value) {
    		/*enermy_1_enermy_binding*/ ctx[13](value);
    	}

    	let enermy_1_props = {
    		Selected: /*Selected*/ ctx[1],
    		aimed: /*aimed*/ ctx[9],
    		ordered: /*ordered*/ ctx[3],
    		critical: /*critical*/ ctx[12],
    		killEvent: /*killEvent*/ ctx[11],
    		role: /*role*/ ctx[6]
    	};

    	if (/*enermy*/ ctx[7] !== void 0) {
    		enermy_1_props.enermy = /*enermy*/ ctx[7];
    	}

    	enermy_1 = new BattleEnermy({ props: enermy_1_props, $$inline: true });
    	binding_callbacks.push(() => bind(enermy_1, 'enermy', enermy_1_enermy_binding));

    	function spellcard_used_binding(value) {
    		/*spellcard_used_binding*/ ctx[14](value);
    	}

    	function spellcard_Selected_binding(value) {
    		/*spellcard_Selected_binding*/ ctx[15](value);
    	}

    	function spellcard_refresh_binding(value) {
    		/*spellcard_refresh_binding*/ ctx[16](value);
    	}

    	let spellcard_props = {};

    	if (/*used*/ ctx[0] !== void 0) {
    		spellcard_props.used = /*used*/ ctx[0];
    	}

    	if (/*Selected*/ ctx[1] !== void 0) {
    		spellcard_props.Selected = /*Selected*/ ctx[1];
    	}

    	if (/*refresh*/ ctx[2] !== void 0) {
    		spellcard_props.refresh = /*refresh*/ ctx[2];
    	}

    	spellcard = new BattleSpellcard({ props: spellcard_props, $$inline: true });
    	binding_callbacks.push(() => bind(spellcard, 'used', spellcard_used_binding));
    	binding_callbacks.push(() => bind(spellcard, 'Selected', spellcard_Selected_binding));
    	binding_callbacks.push(() => bind(spellcard, 'refresh', spellcard_refresh_binding));

    	function state_Power_binding(value) {
    		/*state_Power_binding*/ ctx[17](value);
    	}

    	function state_role_binding(value) {
    		/*state_role_binding*/ ctx[18](value);
    	}

    	let state_props = {
    		critical: /*critical*/ ctx[12],
    		killEvent: /*killEvent*/ ctx[11],
    		enermy: /*enermy*/ ctx[7]
    	};

    	if (/*Power*/ ctx[5] !== void 0) {
    		state_props.Power = /*Power*/ ctx[5];
    	}

    	if (/*role*/ ctx[6] !== void 0) {
    		state_props.role = /*role*/ ctx[6];
    	}

    	state = new BattleState({ props: state_props, $$inline: true });
    	binding_callbacks.push(() => bind(state, 'Power', state_Power_binding));
    	binding_callbacks.push(() => bind(state, 'role', state_role_binding));

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div6 = element("div");
    			create_component(enermy_1.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			t1 = space();
    			create_component(spellcard.$$.fragment);
    			t2 = space();
    			create_component(state.$$.fragment);
    			t3 = space();
    			div5 = element("div");
    			div1 = element("div");
    			img0 = element("img");
    			t4 = space();
    			txt0 = element("txt");
    			txt0.textContent = "消耗品";
    			t6 = space();
    			div2 = element("div");
    			img1 = element("img");
    			t7 = space();
    			txt1 = element("txt");
    			txt1.textContent = "空";
    			t9 = space();
    			div3 = element("div");
    			img2 = element("img");
    			t10 = space();
    			txt2 = element("txt");
    			txt2.textContent = "回溯";
    			t12 = space();
    			div4 = element("div");
    			txt3 = element("txt");
    			txt3.textContent = "结束回合";
    			attr_dev(div0, "class", "record");
    			add_location(div0, file$2, 242, 4, 6706);
    			if (!src_url_equal(img0.src, img0_src_value = "/svg/consumables.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "class", "svelte-390t0t");
    			add_location(img0, file$2, 247, 8, 6921);
    			attr_dev(txt0, "class", "svelte-390t0t");
    			add_location(txt0, file$2, 248, 8, 6965);
    			attr_dev(div1, "class", "consumables svelte-390t0t");
    			add_location(div1, file$2, 246, 6, 6886);
    			if (!src_url_equal(img1.src, img1_src_value = "/svg/moon.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "class", "svelte-390t0t");
    			add_location(img1, file$2, 251, 8, 7034);
    			attr_dev(txt1, "class", "svelte-390t0t");
    			add_location(txt1, file$2, 252, 8, 7071);
    			attr_dev(div2, "class", "equipment svelte-390t0t");
    			add_location(div2, file$2, 250, 6, 7001);
    			if (!src_url_equal(img2.src, img2_src_value = "/svg/back.svg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "class", "svelte-390t0t");
    			add_location(img2, file$2, 255, 8, 7156);
    			attr_dev(txt2, "class", "svelte-390t0t");
    			add_location(txt2, file$2, 256, 8, 7193);
    			attr_dev(div3, "class", "back svelte-390t0t");
    			add_location(div3, file$2, 254, 6, 7105);
    			attr_dev(txt3, "class", "svelte-390t0t");
    			add_location(txt3, file$2, 262, 8, 7348);
    			attr_dev(div4, "class", div4_class_value = "" + (null_to_empty(`end ${!/*round*/ ctx[4] && "outRound"}`) + " svelte-390t0t"));
    			add_location(div4, file$2, 258, 6, 7228);
    			attr_dev(div5, "class", "action svelte-390t0t");
    			add_location(div5, file$2, 245, 4, 6858);
    			attr_dev(div6, "class", "battle svelte-390t0t");
    			add_location(div6, file$2, 232, 2, 6539);
    			attr_dev(div7, "class", div7_class_value = "body " + /*Data*/ ctx[8].role + " " + /*Selected*/ ctx[1] + " svelte-390t0t");
    			set_style(div7, "background-image", "url('/img/scene/" + /*Data*/ ctx[8].scene + ".webp')");
    			add_location(div7, file$2, 226, 0, 6362);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div6);
    			mount_component(enermy_1, div6, null);
    			append_dev(div6, t0);
    			append_dev(div6, div0);
    			append_dev(div6, t1);
    			mount_component(spellcard, div6, null);
    			append_dev(div6, t2);
    			mount_component(state, div6, null);
    			append_dev(div6, t3);
    			append_dev(div6, div5);
    			append_dev(div5, div1);
    			append_dev(div1, img0);
    			append_dev(div1, t4);
    			append_dev(div1, txt0);
    			append_dev(div5, t6);
    			append_dev(div5, div2);
    			append_dev(div2, img1);
    			append_dev(div2, t7);
    			append_dev(div2, txt1);
    			append_dev(div5, t9);
    			append_dev(div5, div3);
    			append_dev(div3, img2);
    			append_dev(div3, t10);
    			append_dev(div3, txt2);
    			append_dev(div5, t12);
    			append_dev(div5, div4);
    			append_dev(div4, txt3);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div3, "click", click_handler, false, false, false, false),
    					listen_dev(div4, "click", /*click_handler_1*/ ctx[19], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const enermy_1_changes = {};
    			if (dirty & /*Selected*/ 2) enermy_1_changes.Selected = /*Selected*/ ctx[1];
    			if (dirty & /*ordered*/ 8) enermy_1_changes.ordered = /*ordered*/ ctx[3];
    			if (dirty & /*role*/ 64) enermy_1_changes.role = /*role*/ ctx[6];

    			if (!updating_enermy && dirty & /*enermy*/ 128) {
    				updating_enermy = true;
    				enermy_1_changes.enermy = /*enermy*/ ctx[7];
    				add_flush_callback(() => updating_enermy = false);
    			}

    			enermy_1.$set(enermy_1_changes);
    			const spellcard_changes = {};

    			if (!updating_used && dirty & /*used*/ 1) {
    				updating_used = true;
    				spellcard_changes.used = /*used*/ ctx[0];
    				add_flush_callback(() => updating_used = false);
    			}

    			if (!updating_Selected && dirty & /*Selected*/ 2) {
    				updating_Selected = true;
    				spellcard_changes.Selected = /*Selected*/ ctx[1];
    				add_flush_callback(() => updating_Selected = false);
    			}

    			if (!updating_refresh && dirty & /*refresh*/ 4) {
    				updating_refresh = true;
    				spellcard_changes.refresh = /*refresh*/ ctx[2];
    				add_flush_callback(() => updating_refresh = false);
    			}

    			spellcard.$set(spellcard_changes);
    			const state_changes = {};
    			if (dirty & /*enermy*/ 128) state_changes.enermy = /*enermy*/ ctx[7];

    			if (!updating_Power && dirty & /*Power*/ 32) {
    				updating_Power = true;
    				state_changes.Power = /*Power*/ ctx[5];
    				add_flush_callback(() => updating_Power = false);
    			}

    			if (!updating_role && dirty & /*role*/ 64) {
    				updating_role = true;
    				state_changes.role = /*role*/ ctx[6];
    				add_flush_callback(() => updating_role = false);
    			}

    			state.$set(state_changes);

    			if (!current || dirty & /*round*/ 16 && div4_class_value !== (div4_class_value = "" + (null_to_empty(`end ${!/*round*/ ctx[4] && "outRound"}`) + " svelte-390t0t"))) {
    				attr_dev(div4, "class", div4_class_value);
    			}

    			if (!current || dirty & /*Selected*/ 2 && div7_class_value !== (div7_class_value = "body " + /*Data*/ ctx[8].role + " " + /*Selected*/ ctx[1] + " svelte-390t0t")) {
    				attr_dev(div7, "class", div7_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(enermy_1.$$.fragment, local);
    			transition_in(spellcard.$$.fragment, local);
    			transition_in(state.$$.fragment, local);

    			add_render_callback(() => {
    				if (!current) return;
    				if (div7_outro) div7_outro.end(1);
    				div7_intro = create_in_transition(div7, fade, { duration: 250 });
    				div7_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(enermy_1.$$.fragment, local);
    			transition_out(spellcard.$$.fragment, local);
    			transition_out(state.$$.fragment, local);
    			if (div7_intro) div7_intro.invalidate();
    			div7_outro = create_out_transition(div7, fade, { duration: 250 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			destroy_component(enermy_1);
    			destroy_component(spellcard);
    			destroy_component(state);
    			if (detaching && div7_outro) div7_outro.end();
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

    const click_handler = _ => null;

    function instance$2($$self, $$props, $$invalidate) {
    	let $cache;
    	let $data;
    	validate_store(cache$1, 'cache');
    	component_subscribe($$self, cache$1, $$value => $$invalidate(21, $cache = $$value));
    	validate_store(data, 'data');
    	component_subscribe($$self, data, $$value => $$invalidate(22, $data = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Battle', slots, []);
    	const Data = deepCopy($data);
    	const raf = new window.RAF();
    	let used;
    	let Selected;
    	let refresh;
    	let ordered;
    	let round = true;
    	let Power;
    	let role;
    	let enermy;
    	let loaded = false;

    	afterUpdate(_ => {
    		if (!loaded) {
    			refresh(speedHandle());
    			loaded = true;
    		}
    	});

    	function aimed(index) {
    		let cost = Selected == Data.role ? 1 : 3;

    		if (!round) alert("不在你的回合"); else if (cost > Power.get()) alert("灵力不足"); else {
    			used();
    			Power.cost(cost);
    			let RoleInput = enermy.input(role.output(Selected), index);
    			role.input(RoleInput, index);
    			$$invalidate(1, Selected = null);
    		}
    	}

    	function switchRound() {
    		switchEvent();

    		// 续个回合
    		$$invalidate(4, round = false);

    		const unit = 200,
    			afterEnd = 2,
    			beforeStart = 4,
    			enermyInterval = 6,
    			spellcardInterval = 6,
    			afterSwitch = 2,
    			originOutput = enermy.output(),
    			EnermyOutput = deepCopy(originOutput);

    		const process = [{ handle: false, time: afterEnd }];

    		let step = raf.setInterval(
    			_ => {
    				process[0].time -= 1;

    				if (process[0].time == 0) {
    					process[0].handle && process[0].handle();

    					const target = EnermyOutput.filter(e => e),
    						index = EnermyOutput.length - target.length;

    					if (target.length == 0) {
    						raf.clearInterval(step);

    						raf.setTimeout(
    							_ => {
    								$$invalidate(3, ordered = null);
    								$$invalidate(4, round = true);
    							},
    							afterSwitch * unit
    						);

    						raf.setTimeout(
    							_ => {
    								role.round(roundEvent);
    								refresh(speedHandle());
    							},
    							beforeStart * unit
    						);
    					} else if (target[0].length == 0) process.push({
    						handle: _ => EnermyOutput[index] = false,
    						time: enermyInterval
    					}); else {
    						if (target[0].length == originOutput[index].length) raf.setTimeout(
    							_ => {
    								$$invalidate(3, ordered = index);
    								enermy.round(roundEvent, index);
    							},
    							afterSwitch * unit
    						);

    						process.push({
    							handle: _ => {
    								if (enermy.state()[index].Health <= 0) EnermyOutput[index] = false; else {
    									enermy.input(role.input(target[0][0], index), index);
    									target[0].shift();
    								}
    							},
    							time: enermy.state()[index].Health > 0 ? spellcardInterval : 1
    						});
    					}

    					process.shift();
    				}
    			},
    			unit
    		);
    	}

    	function switchEvent() {
    		let input = { buff: [], attack: [], heal: [] };

    		C("ghost_lantern", amount => input.buff.push({
    			value: "interim_barrier",
    			amount: Math.ceil(role.state().health * 0.05 * amount) * Power.get()
    		}));

    		role.input(input);
    	}

    	function roundEvent(Datas) {
    		const input = { heal: [], attack: [], buff: [] };
    		let p = Datas.state.power;
    		let hypodynamic;
    		B(Datas, "in_treatment", amount => input.heal.push({ type: "Rate", value: 0.05 * amount }));

    		B(Datas, "burning", amount => input.attack.push({
    			value: 0.02 * amount,
    			type: "rate",
    			indirect: true,
    			critical: false,
    			aim: "one"
    		}));

    		B(Datas, "bleed", amount => input.attack.push({
    			value: 0.02 * amount,
    			type: "rate",
    			indirect: true,
    			critical: false,
    			aim: "one"
    		}));

    		B(Datas, "hypodynamic", _ => hypodynamic = 1);

    		B(Datas, "star", _ => {
    			let target = $cache["bottle_of_stars"].filter(s => s.index == Datas.index);

    			target.forEach(t => input.attack.push({
    				type: "real",
    				value: t.damage,
    				aim: "one",
    				from: "role",
    				indirect: true,
    				critical: false
    			}));

    			set_store_value(cache$1, $cache["bottle_of_stars"] = $cache["bottle_of_stars"].filter(s => s.index != Datas.index), $cache);
    		});

    		if (input.heal.length > 0 || input.attack.length > 0) Datas.input(input);
    		for (let b in Datas.buff) buffs[b].interim && delete Datas.buff[b];
    		!hypodynamic && Datas.power(p);
    	}

    	function killEvent(index) {
    		const output = { attack: [], heal: [], buff: [] };
    		C("bird_wine", amount => output.buff.push({ value: "burning", amount, aim: "all" }));
    		enermy.input(output);
    		C("crown_of_thorns", amount => Power.add(amount));
    	}

    	function critical(from) {
    		let base = 0.05;

    		if (from == "role") {
    			let state = role.state();
    			C("burning_seashore_flower", amount => base += Math.floor((state.health - state.Health) / state.health * 100) * (0.005 + (amount - 1) * 0.0025));
    			C("fluorescent_zanthoxylum", amount => base += amount * 0.05);
    			if (Data.role == "youmu") base = 0;
    		}

    		return r() < base;
    	}

    	function speedHandle() {
    		let target = enermy.state().filter(e => e.Health > 0);
    		let adv = target.reduce((a, c) => a + c.speed, 0) / target.length;
    		let value = Math.abs(role.state().speed - adv);
    		let n = value - parseInt(value);
    		let res = parseInt(value) + Number(r() < n);
    		return role.state().speed > adv ? res : -res;
    	}

    	function B(b, n, f) {
    		if (n in b.buff) {
    			let a = b.buff[n];
    			b.role && !buffs[n].positive && C("fish_stone", amount => a -= amount);
    			f(a >= 0 ? a : 0);
    			if (buffs[n].expend) b.buff[n] == 1 ? delete b.buff[n] : b.buff[n]--;
    			if (n == "star") delete b.buff[n];
    		}
    	}

    	function C(n, f) {
    		if (n in Data.collections) f(Data.collections[n]);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Battle> was created with unknown prop '${key}'`);
    	});

    	function enermy_1_enermy_binding(value) {
    		enermy = value;
    		$$invalidate(7, enermy);
    	}

    	function spellcard_used_binding(value) {
    		used = value;
    		$$invalidate(0, used);
    	}

    	function spellcard_Selected_binding(value) {
    		Selected = value;
    		$$invalidate(1, Selected);
    	}

    	function spellcard_refresh_binding(value) {
    		refresh = value;
    		$$invalidate(2, refresh);
    	}

    	function state_Power_binding(value) {
    		Power = value;
    		$$invalidate(5, Power);
    	}

    	function state_role_binding(value) {
    		role = value;
    		$$invalidate(6, role);
    	}

    	const click_handler_1 = _ => round && switchRound();

    	$$self.$capture_state = () => ({
    		beforeUpdate,
    		afterUpdate,
    		fade,
    		scale,
    		data,
    		cache: cache$1,
    		Spellcard: BattleSpellcard,
    		Enermy: BattleEnermy,
    		State: BattleState,
    		buffs,
    		Data,
    		raf,
    		used,
    		Selected,
    		refresh,
    		ordered,
    		round,
    		Power,
    		role,
    		enermy,
    		loaded,
    		aimed,
    		switchRound,
    		switchEvent,
    		roundEvent,
    		killEvent,
    		critical,
    		speedHandle,
    		B,
    		C,
    		$cache,
    		$data
    	});

    	$$self.$inject_state = $$props => {
    		if ('used' in $$props) $$invalidate(0, used = $$props.used);
    		if ('Selected' in $$props) $$invalidate(1, Selected = $$props.Selected);
    		if ('refresh' in $$props) $$invalidate(2, refresh = $$props.refresh);
    		if ('ordered' in $$props) $$invalidate(3, ordered = $$props.ordered);
    		if ('round' in $$props) $$invalidate(4, round = $$props.round);
    		if ('Power' in $$props) $$invalidate(5, Power = $$props.Power);
    		if ('role' in $$props) $$invalidate(6, role = $$props.role);
    		if ('enermy' in $$props) $$invalidate(7, enermy = $$props.enermy);
    		if ('loaded' in $$props) loaded = $$props.loaded;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		used,
    		Selected,
    		refresh,
    		ordered,
    		round,
    		Power,
    		role,
    		enermy,
    		Data,
    		aimed,
    		switchRound,
    		killEvent,
    		critical,
    		enermy_1_enermy_binding,
    		spellcard_used_binding,
    		spellcard_Selected_binding,
    		spellcard_refresh_binding,
    		state_Power_binding,
    		state_role_binding,
    		click_handler_1
    	];
    }

    class Battle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Battle",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    var sort$2 = {
    	white: [
    		"bronze_mirror",
    		"sundial",
    		"mimosa",
    		"compass_cat",
    		"bird_wine",
    		"frozen_frog",
    		"fluorescent_zanthoxylum",
    		"corvis_feathers",
    		"portable_money_box",
    		"pickled_radish",
    		"conch_shell",
    		"cursed_wind_chimes"
    	],
    	green: [
    		"vampire's_old_tooth",
    		"large_roll_of_bandages",
    		"burning_seashore_flower",
    		"skyrocket",
    		"magic_dart",
    		"fox_jade",
    		"cherry",
    		"earthy_spider_wine",
    		"amulet_of_full_moon",
    		"seal_needle",
    		"ghost_lantern",
    		"crown_of_thorns"
    	],
    	red: [
    		"red_and_white_scarf",
    		"bottle_of_stars",
    		"philosopher's_stone",
    		"blade_of_yellow_spring",
    		"blood_book",
    		"human_soul_lamp",
    		"patchouli's_ribbon",
    		"fish_stone"
    	]
    };
    var portable_money_box = {
    	name: "便携式赛钱箱",
    	detail: "每持有100硬币，伤害提高5%(每层+5%)。"
    };
    var bronze_mirror = {
    	name: "铜镜",
    	detail: "攻击有25%概率额外对随机其它目标造成20%(每层+20%)伤害。"
    };
    var mimosa = {
    	name: "三片叶子的含羞草",
    	detail: "敌人造成的伤害不会超过自身攻击力的300%(每层*95%)。"
    };
    var compass_cat = {
    	name: "罗盘猫",
    	detail: "对敏捷高于自己的敌人伤害+10%(每层+10%)。"
    };
    var bird_wine = {
    	name: "雀酒",
    	detail: "击败敌人时对全体敌人附加燃烧*1(每层+1)。"
    };
    var frozen_frog = {
    	name: "冻青蛙",
    	detail: "自身所受迟缓效果转移到随机1(每层+1)名敌人身上。"
    };
    var fluorescent_zanthoxylum = {
    	name: "荧光花椒",
    	detail: "暴击率+5%"
    };
    var corvis_feathers = {
    	name: "鸦天狗羽毛",
    	detail: "处于两个及以上正面效果下时，敏捷+0.05(每层+0.05)。"
    };
    var sundial = {
    	name: "日晷",
    	detail: "间接伤害提高10%(每层+10%)。"
    };
    var pickled_radish = {
    	name: "腌萝卜",
    	detail: "生命值高于95%时符卡造成的伤害+10%(每层+10%)。"
    };
    var conch_shell = {
    	name: "海螺壳",
    	detail: "每次受到的伤害固定减少1(每层+1)。"
    };
    var cursed_wind_chimes = {
    	name: "被诅咒的风铃",
    	detail: "造成600%(每层*95%)攻击力及以上的伤害时，使下一次攻击能驱散目标的所有正面效果。"
    };
    var ghost_lantern = {
    	name: "鬼行提灯",
    	detail: "回合结束时，每剩余1点灵力，获得5%(每层+5%)最大生命值的临时防御结界。"
    };
    var large_roll_of_bandages = {
    	name: "一大卷绷带",
    	detail: "受到伤害的下一回合回复5%(每层+5%)当前生命值。"
    };
    var burning_seashore_flower = {
    	name: "燃烧的彼岸花",
    	detail: "每损失1%生命，获得0.5%(每层+0.25%)暴击率。"
    };
    var skyrocket = {
    	name: "窜天猴",
    	detail: "普通攻击30%概率造成1.5倍伤害并附带燃烧*1(每层+1)。"
    };
    var magic_dart = {
    	name: "魔力飞镖",
    	detail: "受到攻击时反击，造成伤害20%(每层+10%)的间接伤害。"
    };
    var fox_jade = {
    	name: "狐玉",
    	detail: "受到超过最大生命值40%(每层*95%)的伤害时触发一次击败效果。"
    };
    var cherry = {
    	name: "石樱",
    	detail: "20%(每层+20%)过量治疗量转化为临时防御结界。"
    };
    var earthy_spider_wine = {
    	name: "土蜘蛛酒",
    	detail: "普通攻击后符卡造成的伤害提高10%(每层+10%)，回合初清除。"
    };
    var amulet_of_full_moon = {
    	name: "圆月护符",
    	detail: "处于三个及以上负面效果下时，攻击造成的伤害增加10%(每层+10%)。"
    };
    var seal_needle = {
    	name: "封魔针",
    	detail: "累计造成八次伤害后，下次攻击对全体敌人附加流血*1(每层+1)。"
    };
    var crown_of_thorns = {
    	name: "荆棘礼冠",
    	detail: "击败敌人时获得1(每层+1)额外灵力。"
    };
    var red_and_white_scarf = {
    	name: "红白围巾",
    	detail: "生命值高于30%(每层*90%)时，受到致命伤会保留1生命值。"
    };
    var bottle_of_stars = {
    	name: "装星星的瓶子",
    	detail: "造成200%攻击力及以上的伤害时附加1(每层+1)颗星星，在下回合爆炸造成60%伤害。"
    };
    var blade_of_yellow_spring = {
    	name: "黄泉之刃",
    	detail: "每回合获得1(每层+1)张额外普通攻击。"
    };
    var blood_book = {
    	name: "鲜血魔导书",
    	detail: "抽卡上限+1(每层+1)。"
    };
    var human_soul_lamp = {
    	name: "人魂灯",
    	detail: "暴击伤害+50%(每层+50%)。"
    };
    var fish_stone = {
    	name: "鱼石",
    	detail: "自身负面效果结算时所取层数减1(每层+1)。"
    };
    var collection$1 = {
    	sort: sort$2,
    	portable_money_box: portable_money_box,
    	bronze_mirror: bronze_mirror,
    	mimosa: mimosa,
    	compass_cat: compass_cat,
    	bird_wine: bird_wine,
    	frozen_frog: frozen_frog,
    	fluorescent_zanthoxylum: fluorescent_zanthoxylum,
    	corvis_feathers: corvis_feathers,
    	sundial: sundial,
    	pickled_radish: pickled_radish,
    	conch_shell: conch_shell,
    	cursed_wind_chimes: cursed_wind_chimes,
    	ghost_lantern: ghost_lantern,
    	"vampire's_old_tooth": {
    	name: "吸血鬼的旧牙",
    	detail: "攻击时回复0.5(每层+0.5)生命值。"
    },
    	large_roll_of_bandages: large_roll_of_bandages,
    	burning_seashore_flower: burning_seashore_flower,
    	skyrocket: skyrocket,
    	magic_dart: magic_dart,
    	fox_jade: fox_jade,
    	cherry: cherry,
    	earthy_spider_wine: earthy_spider_wine,
    	amulet_of_full_moon: amulet_of_full_moon,
    	seal_needle: seal_needle,
    	crown_of_thorns: crown_of_thorns,
    	red_and_white_scarf: red_and_white_scarf,
    	bottle_of_stars: bottle_of_stars,
    	"philosopher's_stone": {
    	name: "贤者之石",
    	detail: "主动装备可使用次数加+1(每层+1)。"
    },
    	blade_of_yellow_spring: blade_of_yellow_spring,
    	blood_book: blood_book,
    	human_soul_lamp: human_soul_lamp,
    	"patchouli's_ribbon": {
    	name: "帕秋莉的缎带",
    	detail: "灵力上限+1(每层+1)。"
    },
    	fish_stone: fish_stone
    };

    var sort$1 = [
    	"gongonier",
    	"sword_of_feixiang",
    	"sunshade",
    	"mirror_of_pear",
    	"mini_bagua_stove",
    	"louguanjian",
    	"hd_camera"
    ];
    var gongonier = {
    	name: "血之矢",
    	detail: "被动。暴击回复伤害20%的生命值。"
    };
    var sword_of_feixiang = {
    	name: "绯想之剑",
    	detail: "被动。对处于负面效果下的敌人造成的伤害+40%。"
    };
    var sunshade = {
    	name: "阳伞",
    	detail: "主动。将30%生命值转化为200%防御结界。"
    };
    var mirror_of_pear = {
    	name: "净颇梨之镜",
    	detail: "被动。普通攻击不消耗灵力。"
    };
    var mini_bagua_stove = {
    	name: "迷你八卦炉",
    	detail: "主动。对全体敌人造成400%攻击力伤害。"
    };
    var louguanjian = {
    	name: "楼观剑",
    	detail: "主动。扣除全体敌人20%当前生命值。"
    };
    var hd_camera = {
    	name: "高清相机",
    	detail: "主动。驱散全体敌人身上的正面效果。"
    };
    var equipment$1 = {
    	sort: sort$1,
    	gongonier: gongonier,
    	sword_of_feixiang: sword_of_feixiang,
    	sunshade: sunshade,
    	mirror_of_pear: mirror_of_pear,
    	mini_bagua_stove: mini_bagua_stove,
    	louguanjian: louguanjian,
    	hd_camera: hd_camera
    };

    var sort = [
    	"noda's_hat",
    	"microlithic_fish",
    	"ahab's_opinion",
    	"mimicry_cat_pendant",
    	"wanderlust"
    ];
    var microlithic_fish = {
    	name: "小石的鱼",
    	detail: "受到伤害时70%概率获得随机负面效果(迟缓，燃烧，流血，疲倦)*1，30%概率阻挡本次伤害。"
    };
    var mimicry_cat_pendant = {
    	name: "拟态的猫挂件",
    	detail: "使用符卡时，每有1灵力需求，扣除10%当前生命值，不消耗灵力。"
    };
    var wanderlust = {
    	name: "清泧的遨游术",
    	detail: "手牌上限变为3，不受敏捷影响，每拥有1敏捷，回合初获得1额外灵力。"
    };
    var souvenir$1 = {
    	sort: sort,
    	"noda's_hat": {
    	name: "野田的帽子",
    	detail: "生命值高于50%时受到伤害增加20%，低于50%时则减少30%。"
    },
    	microlithic_fish: microlithic_fish,
    	"ahab's_opinion": {
    	name: "亚哈的意见",
    	detail: "生命上限变为70%，战斗结束后回复全部生命值。"
    },
    	mimicry_cat_pendant: mimicry_cat_pendant,
    	wanderlust: wanderlust
    };

    var collection = {
    	portable_money_box: "她经常要暴打妖怪，解决异变，人们很尊敬她。\n但那神社在人迹罕至的山里头。\n对了，随身带着赛钱箱不就好了。",
    	bronze_mirror: "“这是我在竹林里捡到的镜子。”\n“应该叫毛玻璃？是半透明的。还很糊。”\n“但如果像这样对它发射一束光线。”\n“光线居然同时发生了穿透和反射！”\n“不过它的折射角度我就没法控制就是了。”",
    	mimosa: "“老师快看呀，这棵含羞草只有三片叶子！”\n“碰一下试试？”\n叶子收拢了，相邻的那两片叶子靠在了一起。\n“那片叶子好孤独……”\n“但它坚持了该做的事。”",
    	compass_cat: "“稀客啊。”\n“你居然还养了猫。”\n“你那不也有两只兔子。”\n“我总是觉得猫的眼睛……很像指南针。”\n“它在竹林里也不会迷路呢。”\n“那就给它起名叫罗盘猫吧。”\n“不要。”",
    	bird_wine: "“我感觉到了，这节竹子里有东西。”\n“雀酒！”\n“也可能是青蛙？”\n“青蛙！”",
    	frozen_frog: "敬请期待",
    	fluorescent_zanthoxylum: "敬请期待",
    	corvis_feathers: "“哇——哇——”\n“这乌鸦好烦。”\n一颗石子丢了过去，但树上只落下一根羽毛。\n“啊呀，乌鸦可是能预言凶兆，带来吉祥的哦。”\n“真不巧，我就是凶兆本人，连我妹妹都奈何不了我。”\n“这样啊，乌鸦的羽毛或许能抵消一些不幸，试试？”\n“嗯。”\n“噢，这根不行，这是我身上的。”",
    	sundial: "“这是，日晷？”\n“在红雾之下的话，要用特别的方法才能知道时间。”\n“也就是说用不上了？说起来我家那片森林也见不到阳光呢。”\n“不行。”\n“那这个我也借走啦。”\n“老鼠。”",
    	pickled_radish: "敬请期待",
    	conch_shell: "“我在藏书的仓库里发现了这个。”\n“是海螺壳呢。”\n“幻想乡有海吗？”\n“月亮上，有的。”\n“我父亲居然上过月球。”\n“但那海里没有生命呢。”\n“难不成......”\n“嗯，是陶瓷的。”\n",
    	cursed_wind_chimes: "敬请期待",
    	ghost_lantern: "敬请期待",
    	"vampire's_old_tooth": "前端略尖的牙齿。\n“她小时候换牙换下来的旧牙，我一直收藏着。”\n“能感觉到残存的强大力量，或许能作为大魔法的媒介。”\n“真的？”\n“假的。”",
    	large_roll_of_bandages: "“这、这个尺寸，你究竟是谁？”\n“裹胸用的绷带被某个仙人顺走了啦。”\n“呀，还有这种事。”\n“还有人顺走过扫帚呢。”\n“诶嘿嘿。”",
    	burning_seashore_flower: "“又在这偷懒？”\n“这株彼岸花，由于强大的意念在燃烧着，燃不尽。”\n“要是会引起麻烦就早点退治掉好了。”\n“你不会懂的，正是这份意念传达不出去，才会如此强大。”\n“所以？”\n“请您也不要将我偷懒的事说出去！”",
    	skyrocket: "“在偷拍吗！”\n“啊呀呀，吓我一跳。毕竟巫女难得要出门了嘛，你呢？”\n“我拿到了一个好玩的火箭烟花，来吓一吓她。”\n向着巫女，窜天猴“嗖——”地飞出去。\n飞进了神社的赛钱箱里。",
    	magic_dart: "“这个是未完成品，可以用魔力进行导向的飞镖。”\n“哇，听起来很有意思，便宜卖我呗。”\n“都说了是未完成——小心！”\n“哇，戳我屁股上了。”\n“没受伤吧？”\n“当然没有。”",
    	fox_jade: "敬请期待",
    	cherry: "敬请期待",
    	earthy_spider_wine: "敬请期待",
    	amulet_of_full_moon: "敬请期待",
    	seal_needle: "敬请期待",
    	crown_of_thorns: "敬请期待",
    	red_and_white_scarf: "敬请期待",
    	bottle_of_stars: "敬请期待",
    	"philosopher's_stone": "敬请期待",
    	blade_of_yellow_spring: "敬请期待",
    	blood_book: "敬请期待",
    	human_soul_lamp: "敬请期待",
    	"patchouli's_ribbon": "敬请期待",
    	fish_stone: "敬请期待"
    };
    var souvenir = {
    	"noda's_hat": "敬请期待",
    	microlithic_fish: "敬请期待",
    	"ahab's_opinion": "敬请期待",
    	mimicry_cat_pendant: "敬请期待",
    	wanderlust: "还不可以认输！\n绝望中，仍存有一线生机！\n\n龙战于野，其血玄黄！\n潜龙勿用，藏锋守拙！"
    };
    var equipment = {
    	gongonier: "敬请期待",
    	sword_of_feixiang: "敬请期待",
    	sunshade: "敬请期待",
    	mirror_of_pear: "敬请期待",
    	mini_bagua_stove: "敬请期待",
    	louguanjian: "敬请期待",
    	hd_camera: "敬请期待"
    };
    var story = {
    	collection: collection,
    	souvenir: souvenir,
    	equipment: equipment
    };

    /* src\page\afflatus.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1 } = globals;
    const file$1 = "src\\page\\afflatus.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	return child_ctx;
    }

    // (45:4) {#if index == "collection"}
    function create_if_block_3(ctx) {
    	let div;
    	let div_intro;
    	let div_outro;
    	let current;
    	let each_value_2 = Object.keys(collection$1.sort);
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "collections svelte-ehbdi1");
    			add_location(div, file$1, 45, 6, 1215);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*collection, Object, selected*/ 2) {
    				each_value_2 = Object.keys(collection$1.sort);
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_2.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			add_render_callback(() => {
    				if (!current) return;
    				if (div_outro) div_outro.end(1);
    				div_intro = create_in_transition(div, fade, { duration: 200 });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fade, { duration: 200 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(45:4) {#if index == \\\"collection\\\"}",
    		ctx
    	});

    	return block;
    }

    // (52:10) {#each collection.sort[s] as c}
    function create_each_block_3(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let t0;
    	let explain;
    	let t1;
    	let div_class_value;
    	let current;
    	let mounted;
    	let dispose;

    	explain = new Explain({
    			props: {
    				title: collection$1[/*c*/ ctx[17]].name,
    				detail: collection$1[/*c*/ ctx[17]].detail,
    				color: /*s*/ ctx[10] == "white" ? "blue" : /*s*/ ctx[10]
    			},
    			$$inline: true
    		});

    	function click_handler_3(...args) {
    		return /*click_handler_3*/ ctx[7](/*c*/ ctx[17], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			create_component(explain.$$.fragment);
    			t1 = space();
    			if (!src_url_equal(img.src, img_src_value = "/svg/collection/" + /*c*/ ctx[17] + ".svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-ehbdi1");
    			add_location(img, file$1, 56, 14, 1574);
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(/*selected*/ ctx[1] == /*c*/ ctx[17] && "selected") + " svelte-ehbdi1"));
    			add_location(div, file$1, 52, 12, 1440);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t0);
    			mount_component(explain, div, null);
    			append_dev(div, t1);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler_3, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty & /*selected*/ 2 && div_class_value !== (div_class_value = "" + (null_to_empty(/*selected*/ ctx[1] == /*c*/ ctx[17] && "selected") + " svelte-ehbdi1"))) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(explain.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(explain.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(explain);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(52:10) {#each collection.sort[s] as c}",
    		ctx
    	});

    	return block;
    }

    // (51:8) {#each Object.keys(collection.sort) as s}
    function create_each_block_2(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_3 = collection$1.sort[/*s*/ ctx[10]];
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(target, anchor);
    				}
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selected, collection, Object*/ 2) {
    				each_value_3 = collection$1.sort[/*s*/ ctx[10]];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_3(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_3.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_3.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(51:8) {#each Object.keys(collection.sort) as s}",
    		ctx
    	});

    	return block;
    }

    // (68:4) {#if index == "souvenir"}
    function create_if_block_2(ctx) {
    	let div;
    	let div_intro;
    	let div_outro;
    	let current;
    	let each_value_1 = souvenir$1.sort;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "souvenirs svelte-ehbdi1");
    			add_location(div, file$1, 68, 6, 1915);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selected, souvenir*/ 2) {
    				each_value_1 = souvenir$1.sort;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			add_render_callback(() => {
    				if (!current) return;
    				if (div_outro) div_outro.end(1);
    				div_intro = create_in_transition(div, fade, { duration: 200 });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fade, { duration: 200 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(68:4) {#if index == \\\"souvenir\\\"}",
    		ctx
    	});

    	return block;
    }

    // (74:8) {#each souvenir.sort as s}
    function create_each_block_1(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let t0;
    	let explain;
    	let t1;
    	let div_class_value;
    	let current;
    	let mounted;
    	let dispose;

    	explain = new Explain({
    			props: {
    				title: souvenir$1[/*s*/ ctx[10]].name,
    				detail: souvenir$1[/*s*/ ctx[10]].detail,
    				color: "purple"
    			},
    			$$inline: true
    		});

    	function click_handler_4(...args) {
    		return /*click_handler_4*/ ctx[8](/*s*/ ctx[10], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			create_component(explain.$$.fragment);
    			t1 = space();
    			if (!src_url_equal(img.src, img_src_value = "/svg/souvenir/" + /*s*/ ctx[10] + ".svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-ehbdi1");
    			add_location(img, file$1, 78, 12, 2204);
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(/*selected*/ ctx[1] == /*s*/ ctx[10] && "selected") + " svelte-ehbdi1"));
    			add_location(div, file$1, 74, 10, 2078);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t0);
    			mount_component(explain, div, null);
    			append_dev(div, t1);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler_4, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty & /*selected*/ 2 && div_class_value !== (div_class_value = "" + (null_to_empty(/*selected*/ ctx[1] == /*s*/ ctx[10] && "selected") + " svelte-ehbdi1"))) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(explain.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(explain.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(explain);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(74:8) {#each souvenir.sort as s}",
    		ctx
    	});

    	return block;
    }

    // (89:4) {#if index == "equipment"}
    function create_if_block_1(ctx) {
    	let div;
    	let div_intro;
    	let div_outro;
    	let current;
    	let each_value = equipment$1.sort;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "equipments svelte-ehbdi1");
    			add_location(div, file$1, 89, 6, 2490);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selected, equipment*/ 2) {
    				each_value = equipment$1.sort;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			add_render_callback(() => {
    				if (!current) return;
    				if (div_outro) div_outro.end(1);
    				div_intro = create_in_transition(div, fade, { duration: 200 });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fade, { duration: 200 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(89:4) {#if index == \\\"equipment\\\"}",
    		ctx
    	});

    	return block;
    }

    // (95:8) {#each equipment.sort as s}
    function create_each_block(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let t0;
    	let explain;
    	let t1;
    	let div_class_value;
    	let current;
    	let mounted;
    	let dispose;

    	explain = new Explain({
    			props: {
    				title: equipment$1[/*s*/ ctx[10]].name,
    				detail: equipment$1[/*s*/ ctx[10]].detail,
    				color: "gold"
    			},
    			$$inline: true
    		});

    	function click_handler_5(...args) {
    		return /*click_handler_5*/ ctx[9](/*s*/ ctx[10], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			create_component(explain.$$.fragment);
    			t1 = space();
    			if (!src_url_equal(img.src, img_src_value = "/svg/equipment/" + /*s*/ ctx[10] + ".svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-ehbdi1");
    			add_location(img, file$1, 99, 12, 2781);
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(/*selected*/ ctx[1] == /*s*/ ctx[10] && "selected") + " svelte-ehbdi1"));
    			add_location(div, file$1, 95, 10, 2655);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t0);
    			mount_component(explain, div, null);
    			append_dev(div, t1);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler_5, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty & /*selected*/ 2 && div_class_value !== (div_class_value = "" + (null_to_empty(/*selected*/ ctx[1] == /*s*/ ctx[10] && "selected") + " svelte-ehbdi1"))) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(explain.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(explain.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(explain);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(95:8) {#each equipment.sort as s}",
    		ctx
    	});

    	return block;
    }

    // (110:4) {#if selected}
    function create_if_block(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let t0;
    	let txt0;
    	let t1_value = /*info*/ ctx[2][/*index*/ ctx[0]][/*selected*/ ctx[1]].name + "";
    	let t1;
    	let t2;
    	let txt1;
    	let t3_value = /*info*/ ctx[2][/*index*/ ctx[0]][/*selected*/ ctx[1]].detail + "";
    	let t3;
    	let t4;
    	let txt2;
    	let t5_value = story[/*index*/ ctx[0]][/*selected*/ ctx[1]] + "";
    	let t5;
    	let div_intro;
    	let div_outro;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			txt0 = element("txt");
    			t1 = text(t1_value);
    			t2 = space();
    			txt1 = element("txt");
    			t3 = text(t3_value);
    			t4 = space();
    			txt2 = element("txt");
    			t5 = text(t5_value);
    			if (!src_url_equal(img.src, img_src_value = "/svg/" + /*index*/ ctx[0] + "/" + /*selected*/ ctx[1] + ".svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-ehbdi1");
    			add_location(img, file$1, 115, 8, 3178);
    			attr_dev(txt0, "class", "name svelte-ehbdi1");
    			add_location(txt0, file$1, 116, 8, 3229);
    			attr_dev(txt1, "class", "effect svelte-ehbdi1");
    			add_location(txt1, file$1, 117, 8, 3291);
    			attr_dev(txt2, "class", "story svelte-ehbdi1");
    			add_location(txt2, file$1, 118, 8, 3357);
    			attr_dev(div, "class", "detail svelte-ehbdi1");
    			add_location(div, file$1, 110, 6, 3056);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t0);
    			append_dev(div, txt0);
    			append_dev(txt0, t1);
    			append_dev(div, t2);
    			append_dev(div, txt1);
    			append_dev(txt1, t3);
    			append_dev(div, t4);
    			append_dev(div, txt2);
    			append_dev(txt2, t5);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*index, selected*/ 3 && !src_url_equal(img.src, img_src_value = "/svg/" + /*index*/ ctx[0] + "/" + /*selected*/ ctx[1] + ".svg")) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if ((!current || dirty & /*index, selected*/ 3) && t1_value !== (t1_value = /*info*/ ctx[2][/*index*/ ctx[0]][/*selected*/ ctx[1]].name + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*index, selected*/ 3) && t3_value !== (t3_value = /*info*/ ctx[2][/*index*/ ctx[0]][/*selected*/ ctx[1]].detail + "")) set_data_dev(t3, t3_value);
    			if ((!current || dirty & /*index, selected*/ 3) && t5_value !== (t5_value = story[/*index*/ ctx[0]][/*selected*/ ctx[1]] + "")) set_data_dev(t5, t5_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!current) return;
    				if (div_outro) div_outro.end(1);
    				div_intro = create_in_transition(div, fade, { duration: 200 });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fade, { duration: 200 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(110:4) {#if selected}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div2;
    	let div0;
    	let txt0;
    	let t0;
    	let txt0_class_value;
    	let t1;
    	let txt1;
    	let t2;
    	let txt1_class_value;
    	let t3;
    	let txt2;
    	let t4;
    	let txt2_class_value;
    	let t5;
    	let txt3;
    	let t7;
    	let txt4;
    	let t9;
    	let txt5;
    	let t11;
    	let div1;
    	let t12;
    	let t13;
    	let t14;
    	let div2_intro;
    	let div2_outro;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*index*/ ctx[0] == "collection" && create_if_block_3(ctx);
    	let if_block1 = /*index*/ ctx[0] == "souvenir" && create_if_block_2(ctx);
    	let if_block2 = /*index*/ ctx[0] == "equipment" && create_if_block_1(ctx);
    	let if_block3 = /*selected*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			txt0 = element("txt");
    			t0 = text("收藏品");
    			t1 = space();
    			txt1 = element("txt");
    			t2 = text("纪念品");
    			t3 = space();
    			txt2 = element("txt");
    			t4 = text("装备");
    			t5 = space();
    			txt3 = element("txt");
    			txt3.textContent = "符卡";
    			t7 = space();
    			txt4 = element("txt");
    			txt4.textContent = "消耗品";
    			t9 = space();
    			txt5 = element("txt");
    			txt5.textContent = "角色";
    			t11 = space();
    			div1 = element("div");
    			if (if_block0) if_block0.c();
    			t12 = space();
    			if (if_block1) if_block1.c();
    			t13 = space();
    			if (if_block2) if_block2.c();
    			t14 = space();
    			if (if_block3) if_block3.c();
    			attr_dev(txt0, "class", txt0_class_value = "" + (null_to_empty(/*index*/ ctx[0] == "collection" && "selected") + " svelte-ehbdi1"));
    			add_location(txt0, file$1, 27, 4, 731);
    			attr_dev(txt1, "class", txt1_class_value = "" + (null_to_empty(/*index*/ ctx[0] == "souvenir" && "selected") + " svelte-ehbdi1"));
    			add_location(txt1, file$1, 31, 4, 853);
    			attr_dev(txt2, "class", txt2_class_value = "" + (null_to_empty(/*index*/ ctx[0] == "equipment" && "selected") + " svelte-ehbdi1"));
    			add_location(txt2, file$1, 35, 4, 971);
    			attr_dev(txt3, "class", "svelte-ehbdi1");
    			add_location(txt3, file$1, 39, 4, 1090);
    			attr_dev(txt4, "class", "svelte-ehbdi1");
    			add_location(txt4, file$1, 40, 4, 1109);
    			attr_dev(txt5, "class", "svelte-ehbdi1");
    			add_location(txt5, file$1, 41, 4, 1129);
    			attr_dev(div0, "class", "index svelte-ehbdi1");
    			add_location(div0, file$1, 26, 2, 706);
    			attr_dev(div1, "class", "main svelte-ehbdi1");
    			add_location(div1, file$1, 43, 2, 1156);
    			attr_dev(div2, "class", "body svelte-ehbdi1");
    			add_location(div2, file$1, 25, 0, 627);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, txt0);
    			append_dev(txt0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, txt1);
    			append_dev(txt1, t2);
    			append_dev(div0, t3);
    			append_dev(div0, txt2);
    			append_dev(txt2, t4);
    			append_dev(div0, t5);
    			append_dev(div0, txt3);
    			append_dev(div0, t7);
    			append_dev(div0, txt4);
    			append_dev(div0, t9);
    			append_dev(div0, txt5);
    			append_dev(div2, t11);
    			append_dev(div2, div1);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t12);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div1, t13);
    			if (if_block2) if_block2.m(div1, null);
    			append_dev(div1, t14);
    			if (if_block3) if_block3.m(div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(txt0, "click", /*click_handler*/ ctx[4], false, false, false, false),
    					listen_dev(txt1, "click", /*click_handler_1*/ ctx[5], false, false, false, false),
    					listen_dev(txt2, "click", /*click_handler_2*/ ctx[6], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*index*/ 1 && txt0_class_value !== (txt0_class_value = "" + (null_to_empty(/*index*/ ctx[0] == "collection" && "selected") + " svelte-ehbdi1"))) {
    				attr_dev(txt0, "class", txt0_class_value);
    			}

    			if (!current || dirty & /*index*/ 1 && txt1_class_value !== (txt1_class_value = "" + (null_to_empty(/*index*/ ctx[0] == "souvenir" && "selected") + " svelte-ehbdi1"))) {
    				attr_dev(txt1, "class", txt1_class_value);
    			}

    			if (!current || dirty & /*index*/ 1 && txt2_class_value !== (txt2_class_value = "" + (null_to_empty(/*index*/ ctx[0] == "equipment" && "selected") + " svelte-ehbdi1"))) {
    				attr_dev(txt2, "class", txt2_class_value);
    			}

    			if (/*index*/ ctx[0] == "collection") {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*index*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div1, t12);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*index*/ ctx[0] == "souvenir") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*index*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div1, t13);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*index*/ ctx[0] == "equipment") {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*index*/ 1) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div1, t14);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*selected*/ ctx[1]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty & /*selected*/ 2) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(div1, null);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);

    			add_render_callback(() => {
    				if (!current) return;
    				if (div2_outro) div2_outro.end(1);
    				div2_intro = create_in_transition(div2, fade, { duration: 250 });
    				div2_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			if (div2_intro) div2_intro.invalidate();
    			div2_outro = create_out_transition(div2, fade, { duration: 250 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (detaching && div2_outro) div2_outro.end();
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
    	validate_slots('Afflatus', slots, []);
    	let index = "collection";
    	let selected = null;

    	const info = {
    		collection: collection$1,
    		equipment: equipment$1,
    		souvenir: souvenir$1,
    		spellcard,
    		role: role$1
    	};

    	function Index(i) {
    		$$invalidate(1, selected = null);
    		$$invalidate(0, index = i);
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Afflatus> was created with unknown prop '${key}'`);
    	});

    	const click_handler = _ => Index("collection");
    	const click_handler_1 = _ => Index("souvenir");
    	const click_handler_2 = _ => Index("equipment");
    	const click_handler_3 = (c, _) => $$invalidate(1, selected = c);
    	const click_handler_4 = (s, _) => $$invalidate(1, selected = s);
    	const click_handler_5 = (s, _) => $$invalidate(1, selected = s);

    	$$self.$capture_state = () => ({
    		fade,
    		scale,
    		collection: collection$1,
    		equipment: equipment$1,
    		souvenir: souvenir$1,
    		spellcard,
    		role: role$1,
    		story,
    		Explain,
    		index,
    		selected,
    		info,
    		Index
    	});

    	$$self.$inject_state = $$props => {
    		if ('index' in $$props) $$invalidate(0, index = $$props.index);
    		if ('selected' in $$props) $$invalidate(1, selected = $$props.selected);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		index,
    		selected,
    		info,
    		Index,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5
    	];
    }

    class Afflatus extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Afflatus",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.59.2 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let div;
    	let switch_instance;
    	let t;
    	let loader;
    	let current;
    	var switch_value = /*render*/ ctx[2][/*$page*/ ctx[1]];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    	}

    	loader = new Loader({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			t = space();
    			create_component(loader.$$.fragment);
    			attr_dev(div, "id", "root");
    			set_style(div, "background-image", "url(/img/scene/" + /*$scene*/ ctx[0] + ".webp)");
    			attr_dev(div, "class", "svelte-155t4ky");
    			add_location(div, file, 121, 0, 2858);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (switch_instance) mount_component(switch_instance, div, null);
    			append_dev(div, t);
    			mount_component(loader, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$page*/ 2 && switch_value !== (switch_value = /*render*/ ctx[2][/*$page*/ ctx[1]])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div, t);
    				} else {
    					switch_instance = null;
    				}
    			}

    			if (!current || dirty & /*$scene*/ 1) {
    				set_style(div, "background-image", "url(/img/scene/" + /*$scene*/ ctx[0] + ".webp)");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			transition_in(loader.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			transition_out(loader.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (switch_instance) destroy_component(switch_instance);
    			destroy_component(loader);
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
    	let $scene;
    	let $page;
    	validate_store(scene, 'scene');
    	component_subscribe($$self, scene, $$value => $$invalidate(0, $scene = $$value));
    	validate_store(page, 'page');
    	component_subscribe($$self, page, $$value => $$invalidate(1, $page = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	const render = {
    		index: Page,
    		foreword: Foreword,
    		explore: Explore_1,
    		battle: Battle,
    		afflatus: Afflatus
    	};

    	// $ctrl = {
    	// 	page: (p) => {
    	// 		$page = "loading";
    	// 		$loading = true;
    	// 		setTimeout((_) => ($page = p), 300);
    	// 	},
    	// };
    	window.deepCopy = obj => {
    		if (Array.isArray(obj)) {
    			let arr = obj;
    			var newArr = [];

    			for (var i = 0; i < arr.length; i++) {
    				if (Array.isArray(arr[i])) {
    					var list = deepCopy(arr[i]);
    					newArr.push(list);
    				} else {
    					newArr.push(arr[i]);
    				}
    			}

    			return newArr;
    		} else {
    			let temp = obj.constructor === Array ? [] : {};

    			for (let val in obj) {
    				temp[val] = typeof obj[val] == "object"
    				? deepCopy(obj[val])
    				: obj[val];
    			}

    			return temp;
    		}
    	};

    	Array.prototype.rd = function () {
    		for (var j, x, i = this.length; i; (j = parseInt(Math.random() * i), x = this[--i], this[i] = this[j], this[j] = x)) ;
    		return this;
    	};

    	String.prototype.getByteLen = function () {
    		let len = 0;

    		for (let i = 0; i < this.length; i++) {
    			this.charCodeAt(i) < 256 ? len += 1 : len += 2;
    		}

    		return len;
    	};

    	window.r = Math.random;

    	class RAF {
    		constructor() {
    			this.init();
    		}

    		init() {
    			this._timerIdMap = { timeout: {}, interval: {} };
    		}

    		run(type = "interval", cb, interval = 16.7) {
    			const now = Date.now;
    			let stime = now();
    			let etime = stime;

    			//创建Symbol类型作为key值，保证返回值的唯一性，用于清除定时器使用
    			const timerSymbol = Symbol();

    			const loop = () => {
    				this.setIdMap(timerSymbol, type, loop);
    				etime = now();

    				if (etime - stime >= interval) {
    					if (type === "interval") {
    						stime = now();
    						etime = stime;
    					}

    					cb();
    					type === "timeout" && this.clearTimeout(timerSymbol);
    				}
    			};

    			this.setIdMap(timerSymbol, type, loop);
    			return timerSymbol; // 返回Symbol保证每次调用setTimeout/setInterval返回值的唯一性
    		}

    		setIdMap(timerSymbol, type, loop) {
    			const id = requestAnimationFrame(loop);
    			this._timerIdMap[type][timerSymbol] = id;
    		}

    		setTimeout(cb, interval) {
    			// 实现setTimeout 功能
    			return this.run("timeout", cb, interval);
    		}

    		clearTimeout(timer) {
    			cancelAnimationFrame(this._timerIdMap.timeout[timer]);
    		}

    		setInterval(cb, interval) {
    			// 实现setInterval功能
    			return this.run("interval", cb, interval);
    		}

    		clearInterval(timer) {
    			cancelAnimationFrame(this._timerIdMap.interval[timer]);
    		}
    	}

    	window.RAF = RAF;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Loader,
    		index: Page,
    		foreword: Foreword,
    		explore: Explore_1,
    		battle: Battle,
    		afflatus: Afflatus,
    		page,
    		scene,
    		ctrl,
    		loading,
    		render,
    		RAF,
    		$scene,
    		$page
    	});

    	return [$scene, $page, render];
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
    	target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
