
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
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
    function hash(str) {
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
        const name = `__svelte_${hash(rule)}_${uid}`;
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
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
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
            if (this.$$set && !is_empty($$props)) {
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

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
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

    const page = writable('Index');
    const ctrl = writable({});
    const Explain = writable(false);
    const archive = writable({
      unlocked: {
        role: ["marisa", "reimu"]
      },
      record: []
    });
    const data$1 = writable({
      collection: {
        // patchoulis_ribbon: 5,
        // portable_money_box: 21,
        // bronze_mirror: 10,
        // mimosa: 10,
        // compass_cat: 10,
        // bird_wine: 10,
        frozen_frog: 10,
        // fluorescent_zanthoxylum: 20,
        // corvis_feathers: 10,
        // sundial: 10,
        // pickled_radish: 10,
        conch_shell: 5,
        // cursed_wind_chimes: 1,
        false_hammer: 10,
        // shy_rabbit: 10,
        // crown_of_thorns: 10,
        // midnight_cloak: 10,
        ice_scale: 10,
        sakura_tea: 10,
        big_bugle: 10,
        // ghost_lantern: 1,
        vampires_old_tooth: 12,
        // large_roll_of_bandages: 5,
        // burning_seashore_flower: 5,
        // skyrocket: 5,
        // magic_dart: 1,
        // sport_shoes: 1,
        // sticking_plaster: 5,
        // earthy_spider_wine: 5,
        // amulet_of_full_moon: 5,
        seal_needle: 5,
        // trolley: 5,
        // light_bulb: 5,
        // paper_windmill: 5,
        // free_eagle: 5,
        red_and_white_scarf: 1,
        bottle_of_stars: 1,
        // blade_of_yellow_spring: 1,
        // human_soul_lamp: 2,
        // fish_stone: 5,
        // JupiterACL300: 2,
        // terrible_ring: 5,
        shimenawa: 40,
        // flip_flops: 2
      },
      equipment: 'mini_bagua_stove',
      consumable: {
        banana: 3,
        heart_fire_of_grace: 2,
        good_corn: 1
      },
      card: {
        r016: 2,
        reimu: 2
      },
      souvenir: false,
      role: 'reimu',
      sugar: 5,
      consumableLimit: 3,
      chance: {
        name: '轻松',
        type: 'red',
        amount: 1,
      },
      health: 40,
      coin: 6000,
      scene: 'town',
      stage: 1,
      blackList: [],
      statistics: [],
      coin_reward_total: 0
    });
    const setting = writable({
      resource: 'dairi'
    });
    const explore = writable({
      enermy: ["narumi"],
      cursor: [0, 0, 0],
      offsetY: [1,0,0],
      event: [{
        "key": "diaochuang",
        "cache": {
          finish: true
        },
        "id": 0,
        "style": "transform:rotate(6.341882895824243deg)translate(1.3071317727794085px,-4.794430534179739px);",
        "detail": "看起来摇摇晃晃的，想必是非常新奇的体验。",
        "type": "reward"
    },{
      "key": "xijian",
      "cache": {},
      "id": 1,
      "style": "transform:rotate(6.341882895824243deg)translate(1.3071317727794085px,-4.794430534179739px);",
      "detail": "看起来摇摇晃晃的，想必是非常新奇的体验。",
      "type": "reward"
    }],
      eventList: [
        [{
          "key": "diaochuang",
          "cache": {
            finish: true
          },
          "id": 0,
          "style": "transform:rotate(6.341882895824243deg)translate(1.3071317727794085px,-4.794430534179739px);",
          "detail": "看起来摇摇晃晃的，想必是非常新奇的体验。",
          "type": "reward"
      },{
        "key": "xijian",
        "cache": {},
        "id": 1,
        "style": "transform:rotate(6.341882895824243deg)translate(1.3071317727794085px,-4.794430534179739px);",
        "detail": "看起来摇摇晃晃的，想必是非常新奇的体验。",
        "type": "reward"
      }],[],[]
      ],
      eventSummoned: false,
      eventLeft: [],
      target: [true, true, true, true, false, false],
      enermyLimit: 4,
      lv: 40,
      pricelv: 1,
      dragon: 0,
      boss: ["kanako", "medicine", "mokou"]
    });
    const cache = writable({});
    const frameEvent = writable({});
    const Admin = writable({event:{}});

    /* src\page\msg.svelte generated by Svelte v3.59.2 */
    const file$E = "src\\page\\msg.svelte";

    function get_each_context$i(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    // (31:2) {#each msg as m, i (m.key)}
    function create_each_block$i(key_1, ctx) {
    	let div2;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let txt0;
    	let t1_value = (/*m*/ ctx[4].title ? /*m*/ ctx[4].title : "提示") + "";
    	let t1;
    	let t2;
    	let txt1;
    	let t3_value = /*m*/ ctx[4].content + "";
    	let t3;
    	let t4;
    	let div1;
    	let t5;
    	let div2_intro;
    	let div2_outro;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[1](/*i*/ ctx[6], ...args);
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
    			t1 = text(t1_value);
    			t2 = space();
    			txt1 = element("txt");
    			t3 = text(t3_value);
    			t4 = space();
    			div1 = element("div");
    			t5 = space();
    			if (!src_url_equal(img.src, img_src_value = "/logo.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-1pr8won");
    			add_location(img, file$E, 36, 6, 813);
    			attr_dev(txt0, "class", "title svelte-1pr8won");
    			add_location(txt0, file$E, 38, 8, 885);
    			attr_dev(txt1, "class", "content svelte-1pr8won");
    			add_location(txt1, file$E, 39, 8, 946);
    			set_style(div0, "margin-bottom", "4px");
    			add_location(div0, file$E, 37, 6, 844);
    			attr_dev(div1, "class", "tie svelte-1pr8won");
    			add_location(div1, file$E, 41, 6, 1006);
    			attr_dev(div2, "class", "svelte-1pr8won");
    			add_location(div2, file$E, 31, 4, 652);
    			this.first = div2;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, img);
    			append_dev(div2, t0);
    			append_dev(div2, div0);
    			append_dev(div0, txt0);
    			append_dev(txt0, t1);
    			append_dev(div0, t2);
    			append_dev(div0, txt1);
    			append_dev(txt1, t3);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div2, t5);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div2, "click", click_handler, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*msg*/ 1) && t1_value !== (t1_value = (/*m*/ ctx[4].title ? /*m*/ ctx[4].title : "提示") + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*msg*/ 1) && t3_value !== (t3_value = /*m*/ ctx[4].content + "")) set_data_dev(t3, t3_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!current) return;
    				if (div2_outro) div2_outro.end(1);
    				div2_intro = create_in_transition(div2, scale, { duration: 300 });
    				div2_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div2_intro) div2_intro.invalidate();
    			div2_outro = create_out_transition(div2, fade, { duration: 300 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching && div2_outro) div2_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$i.name,
    		type: "each",
    		source: "(31:2) {#each msg as m, i (m.key)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$E(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let each_value = /*msg*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*m*/ ctx[4].key;
    	validate_each_keys(ctx, each_value, get_each_context$i, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$i(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$i(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "msg svelte-1pr8won");
    			add_location(div, file$E, 29, 0, 598);
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
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*msg*/ 1) {
    				each_value = /*msg*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$i, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block$i, null, get_each_context$i);
    				check_outros();
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
    		id: create_fragment$E.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function r$5() {
    	return Math.random();
    }

    function instance$E($$self, $$props, $$invalidate) {
    	let $frameEvent;
    	validate_store(frameEvent, 'frameEvent');
    	component_subscribe($$self, frameEvent, $$value => $$invalidate(2, $frameEvent = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Msg', slots, []);
    	let msg = [];
    	window.msg = Msg;

    	onMount(function () {
    		$frameEvent.add("msg", _ => $$invalidate(0, msg = msg.filter(m => new Date().getTime() - m.time < 3000)), 1);
    	});

    	function Msg(info) {
    		info.time = new Date().getTime();
    		info.key = r$5();
    		msg.push(info);
    		$$invalidate(0, msg = msg.filter(m => info.time - m.time < 3000));
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Msg> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (i, _) => $$invalidate(0, msg = msg.filter((_, index) => i != index));

    	$$self.$capture_state = () => ({
    		beforeUpdate,
    		onMount,
    		fade,
    		scale,
    		frameEvent,
    		msg,
    		Msg,
    		r: r$5,
    		$frameEvent
    	});

    	$$self.$inject_state = $$props => {
    		if ('msg' in $$props) $$invalidate(0, msg = $$props.msg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [msg, click_handler];
    }

    class Msg_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$E, create_fragment$E, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Msg_1",
    			options,
    			id: create_fragment$E.name
    		});
    	}
    }

    var portable_money_box = {
    	name: "便携式赛钱箱",
    	detail: "每持有250硬币，对敌人造成伤害提高5%(每层+5%)。",
    	type: "blue"
    };
    var bronze_mirror = {
    	name: "铜镜",
    	detail: "对敌人造成伤害时，25%概率额外对随机其它敌人造成伤害30%(每层+30%)的间接伤害。无法循环触发。",
    	type: "blue"
    };
    var mimosa = {
    	name: "三片叶子的含羞草",
    	detail: "受到的伤害不会超过最大生命值的70%(每层*95%)。",
    	type: "blue"
    };
    var compass_cat = {
    	name: "罗盘猫",
    	detail: "对速度低于自己的敌人造成伤害+10%(每层+10%)。",
    	type: "blue"
    };
    var bird_wine = {
    	name: "雀酒",
    	detail: "击败敌人时对全体敌人附加燃烧*2(每层+2)。",
    	type: "blue"
    };
    var frozen_frog = {
    	name: "冻青蛙",
    	detail: "战斗开始时速度+0.25(每层+0.25)，回合结束时-0.25，直至该增益为0。",
    	type: "blue"
    };
    var fluorescent_zanthoxylum = {
    	name: "荧光花椒",
    	detail: "暴击率+5%(每层+5%)。",
    	type: "blue"
    };
    var corvis_feathers = {
    	name: "鸦天狗羽毛",
    	detail: "处于两个及以上效果下时，速度+0.1(每层+0.1)。",
    	type: "blue"
    };
    var sundial = {
    	name: "日晷",
    	detail: "间接伤害提高10%(每层+10%)。",
    	type: "blue"
    };
    var pickled_radish = {
    	name: "腌萝卜",
    	detail: "生命值高于90%时符卡对敌人造成的伤害+10%(每层+10%)。",
    	type: "blue"
    };
    var conch_shell = {
    	name: "海螺壳",
    	detail: "每次受到的伤害固定减少1(每层+1)。",
    	type: "blue"
    };
    var cursed_wind_chimes = {
    	name: "被诅咒的风铃",
    	detail: "造成50(每层-1)及以上的最终伤害时，驱散目标的所有正面效果。",
    	type: "blue"
    };
    var false_hammer = {
    	name: "万宝槌（仿制品）",
    	detail: "对杂鱼造成的伤害+10%(每层+10%)。",
    	type: "blue"
    };
    var shy_rabbit = {
    	name: "害羞兔",
    	detail: "每第三张牌造成的伤害+10%(每层+10%)。",
    	type: "blue"
    };
    var crown_of_thorns = {
    	name: "荆棘礼冠",
    	detail: "在敌人的回合，受到伤害的敌人获得易伤*1(每层+1)，持续一回合。",
    	type: "blue"
    };
    var midnight_cloak = {
    	name: "午夜斗篷",
    	detail: "对生命值低于50%的敌人造成的伤害增加10%(每层+10%)。",
    	type: "blue"
    };
    var ice_scale = {
    	name: "冰之鳞",
    	detail: "直接伤害10%(每层+10%)概率附加迟缓*1。",
    	type: "blue"
    };
    var sakura_tea = {
    	name: "樱茶",
    	detail: "受到的治疗效果+10%(每层+10%)。",
    	type: "blue"
    };
    var big_bugle = {
    	name: "大喇叭",
    	detail: "回合结束时对全体目标造成2(每层+2)穿透间接伤害。",
    	type: "blue"
    };
    var carnyx = {
    	name: "助眠的卡尼克斯号",
    	detail: "商店打折95%(每层*95%)。",
    	type: "blue"
    };
    var rune_sword = {
    	name: "符文之刃",
    	detail: "造成的穿透伤害+5%(每层+5%)，受到的穿透伤害-5%(每层-5%)。",
    	type: "blue"
    };
    var ghost_lantern = {
    	name: "鬼行提灯",
    	detail: "回合结束时，每剩余1点灵力，获得临时防御结界*1(每层+1)。",
    	type: "green"
    };
    var vampires_old_tooth = {
    	name: "吸血鬼的旧牙",
    	detail: "伤害命中处于正面效果下的敌人时回复1(每层+1)生命值。",
    	type: "green"
    };
    var large_roll_of_bandages = {
    	name: "一大卷绷带",
    	detail: "受到伤害的下一回合回复5%(每层+5%)当前生命值。",
    	type: "green"
    };
    var burning_seashore_flower = {
    	name: "燃烧的彼岸花",
    	detail: "每损失1%生命值，获得0.2%(每层+0.2%)暴击率和0.01(每层+0.01)速度。",
    	type: "green"
    };
    var skyrocket = {
    	name: "窜天猴",
    	detail: "普通攻击30%概率额外造成50%间接伤害并获得1(每层+1)灵力。",
    	type: "green"
    };
    var magic_dart = {
    	name: "魔力魔力飞镖",
    	detail: "受到伤害时反击，造成伤害20%(每层+20%)的间接伤害。",
    	type: "green"
    };
    var sport_shoes = {
    	name: "竹林棉棉鞋",
    	detail: "受到超过20(每层-1)的伤害时，抽一张牌，获得1额外灵力。",
    	type: "green"
    };
    var sticking_plaster = {
    	name: "冰冰凉凉的创可贴",
    	detail: "过量治疗时，获得20%(每层+20%)过量治疗量的临时防御结界。",
    	type: "green"
    };
    var earthy_spider_wine = {
    	name: "土蜘蛛酒",
    	detail: "普通攻击后符卡造成的伤害提高20%(每层+20%)，回合初清除。",
    	type: "green"
    };
    var amulet_of_full_moon = {
    	name: "圆月护符",
    	detail: "处于两种及以上负面效果下时，受到的伤害*90%(每层*90%)。",
    	type: "green"
    };
    var seal_needle = {
    	name: "封魔针",
    	detail: "累计造成八次伤害后，下次攻击对目标附加流血*1(每层+1)。",
    	type: "green"
    };
    var trolley = {
    	name: "手推车",
    	detail: "击败敌人时获得1(每层+1)额外灵力。",
    	type: "green"
    };
    var dimensional_pocket = {
    	name: "隙间纸袋",
    	detail: "消耗品上限+1(每层+1)。",
    	type: "green?"
    };
    var terrible_ring = {
    	name: "可爱小戒指",
    	detail: "每经过一回合，暴击率+4%(每层+4%)。",
    	type: "green"
    };
    var toolbox = {
    	name: "应急道具箱",
    	detail: "使用主动装备或消耗品时，20%(每层+20%)概率触发一次击败事件。",
    	type: "green"
    };
    var light_bulb = {
    	name: "电灯泡",
    	detail: "灵力低于1(每层+1)时抽一张牌。",
    	type: "green"
    };
    var patchoulis_ribbon = {
    	name: "帕秋莉的缎带",
    	detail: "牌库中灵力消耗最高的一张牌灵力消耗-1(每层-1)。",
    	type: "green"
    };
    var free_eagle = {
    	name: "自由之鹰",
    	detail: "连续暴击时清除自身随机1(每层+1)层负面效果。",
    	type: "green"
    };
    var red_and_white_scarf = {
    	name: "红白围巾",
    	detail: "生命值高于30%(每层*85%)时，受到致命伤会保留1生命值。",
    	type: "red"
    };
    var bottle_of_stars = {
    	name: "装星星的瓶子",
    	detail: "造成40及以上的伤害时附加1(每层+1)颗星星，在下回合爆炸造成最终伤害40%的额外伤害。",
    	type: "red"
    };
    var blade_of_yellow_spring = {
    	name: "黄泉之刃",
    	detail: "回合初获得1(每层+1)张额外普通攻击，回合结束时移除。",
    	type: "red"
    };
    var human_soul_lamp = {
    	name: "人魂灯",
    	detail: "暴击伤害+60%(每层+60%)。",
    	type: "red"
    };
    var paper_windmill = {
    	name: "式神·风力发电机",
    	detail: "自然灵力和额外灵力上限+1(每层+1)，回合初获得1(每层+1)额外灵力。",
    	type: "red"
    };
    var fish_stone = {
    	name: "鱼石",
    	detail: "自身负面效果结算时所取层数减1(每层+1)。",
    	type: "red"
    };
    var JupiterACL300 = {
    	name: "木星ACL300",
    	detail: "所有直接伤害都会爆炸，对目标左右两边第一个对象造成伤害25%(每层+25%)的间接伤害。",
    	type: "red"
    };
    var shimenawa = {
    	name: "注连绳",
    	detail: "抽牌时25%(每层+25%)概率增加1次主动装备可使用次数。",
    	type: "red"
    };
    var flip_flops = {
    	name: "旧都人字拖",
    	detail: "每拥有1额外灵力，速度+0.2(每层+0.2)。",
    	type: "red"
    };
    var ace = {
    	name: "Ace",
    	detail: "概率事件额外判定1(每层+1)次，取更好的一次。",
    	type: "red"
    };
    var collection$2 = {
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
    	false_hammer: false_hammer,
    	shy_rabbit: shy_rabbit,
    	crown_of_thorns: crown_of_thorns,
    	midnight_cloak: midnight_cloak,
    	ice_scale: ice_scale,
    	sakura_tea: sakura_tea,
    	big_bugle: big_bugle,
    	carnyx: carnyx,
    	rune_sword: rune_sword,
    	ghost_lantern: ghost_lantern,
    	vampires_old_tooth: vampires_old_tooth,
    	large_roll_of_bandages: large_roll_of_bandages,
    	burning_seashore_flower: burning_seashore_flower,
    	skyrocket: skyrocket,
    	magic_dart: magic_dart,
    	sport_shoes: sport_shoes,
    	sticking_plaster: sticking_plaster,
    	earthy_spider_wine: earthy_spider_wine,
    	amulet_of_full_moon: amulet_of_full_moon,
    	seal_needle: seal_needle,
    	trolley: trolley,
    	dimensional_pocket: dimensional_pocket,
    	terrible_ring: terrible_ring,
    	toolbox: toolbox,
    	light_bulb: light_bulb,
    	patchoulis_ribbon: patchoulis_ribbon,
    	free_eagle: free_eagle,
    	red_and_white_scarf: red_and_white_scarf,
    	bottle_of_stars: bottle_of_stars,
    	blade_of_yellow_spring: blade_of_yellow_spring,
    	human_soul_lamp: human_soul_lamp,
    	paper_windmill: paper_windmill,
    	fish_stone: fish_stone,
    	JupiterACL300: JupiterACL300,
    	shimenawa: shimenawa,
    	flip_flops: flip_flops,
    	ace: ace
    };

    const equipment$1 = {
      gongonier: {
        name: "血之矢",
        detail: "被动。造成的伤害暴击时，回复伤害20%的生命值。",
        passive: true
      },
      sword_of_feixiang: {
        name: "绯想之剑",
        detail: "被动。对处于负面效果下的敌人造成的伤害+40%。",
        passive: true
      },
      sunshade: {
        name: "阳伞",
        detail: "主动。将30%生命值转化为200%防御结界。",
        handle: (Admin, Target) => {
          let Health = Admin.role.state.of(0).get().Health;
          Admin.role.state.of(0).set("Health", Health * 0.7);
          Admin.role.buff.of(0).add("barrier", Math.ceil(Health * 0.3 * 2));
        }
      },
      mirror_of_pear: {
        name: "净颇梨之镜",
        detail: "被动。普通攻击不消耗灵力。",
        passive: true
      },
      mini_bagua_stove: {
        name: "迷你八卦炉",
        detail: "主动。造成30群体伤害。",
        handle: (Admin, Target) => {
          Admin.enermy.damage.targetAll().source("equipment").by({
            type: "static",
            value: 30
          });
        }
      },
      louguanjian: {
        name: "楼观剑",
        detail: "主动。扣除目标20%当前生命值。",
        aim: true,
        handle: (Admin, Target) => {
          let Health = Admin.enermy.state.of(Target).get().Health;
          Admin.enermy.state.of(Target).set("Health", Health * 0.8);
        }
      },
      hd_camera: {
        name: "高清相机",
        detail: "主动。指定目标一回合受到的伤害均为穿透伤害。",
        aim: true,
        handle: (Admin, Target) => {
          Admin.enermy.buff.of(Target).add("exposure");
        }
      },
      repentance_rod: {
        name: "悔悟之棒",
        detail: "被动。抽空牌库时，获得等于此次抽牌数的额外灵力。",
        passive: true
      },
      circular_fan: {
        name: "团扇",
        detail: "被动。每打出1张符卡获得1张临时普通攻击。",
        passive: true
      },
      devil_tied_scroll: {
        name: "魔人经卷",
        detail: "主动。驱散目标身上的正面效果。",
        aim: true,
        handle: (Admin, Target) => {
          Admin.enermy.buff.of(Target).clearAll(true);
        }
      }
    };

    for (let e in equipment$1) equipment$1[e].type = "gold";

    var nodas_hat = {
    	name: "野田的帽子",
    	detail: "生命值高于50%时受到伤害增加20%，低于50%时则减少30%。"
    };
    var aokis_fish = {
    	name: "苍姬的鱼",
    	detail: "受到伤害时70%概率获得随机负面效果(迟缓、疲倦、易伤、虚弱、恍惚)*1，30%概率阻挡本次伤害。"
    };
    var ahabs_opinion = {
    	name: "亚哈的意见",
    	detail: "生命上限变为70%，战斗开始时回复全部生命值。"
    };
    var mimicry_cat_pendant = {
    	name: "拟态的猫挂件",
    	detail: "打出手牌时，每有1灵力需求，扣除10%当前生命值，不消耗灵力。"
    };
    var wanderlust = {
    	name: "清泧的遨游术",
    	detail: "手牌上限变为4，不受速度影响，每拥有1速度，回合初获得1额外灵力。"
    };
    var cerallins_bottle = {
    	name: "Cerallin的酒",
    	detail: "回合结束时丢弃所有手牌，并获得等量额外灵力。"
    };
    var souvenir$1 = {
    	nodas_hat: nodas_hat,
    	aokis_fish: aokis_fish,
    	ahabs_opinion: ahabs_opinion,
    	mimicry_cat_pendant: mimicry_cat_pendant,
    	wanderlust: wanderlust,
    	cerallins_bottle: cerallins_bottle
    };

    var doubtful_potion = {
    	name: "可疑的药水",
    	detail: "生命值随机变动-50%至50%。",
    	source: "event"
    };
    var heart_fire_of_grace = {
    	name: "恩惠的心之火",
    	detail: "本场战斗中第一次受到致命伤害时，免疫所有伤害，持续一回合。",
    	source: "shop"
    };
    var gift_from_ergen = {
    	name: "厄神的小礼物",
    	detail: "对方全体攻击降低20%，持续三回合。",
    	source: "event"
    };
    var good_corn = {
    	name: "上好的玉米",
    	detail: "驱散自身所有负面效果。",
    	source: "shop"
    };
    var banana = {
    	name: "香蕉",
    	detail: "回复17生命值。",
    	source: "event"
    };
    var consumable$1 = {
    	doubtful_potion: doubtful_potion,
    	heart_fire_of_grace: heart_fire_of_grace,
    	gift_from_ergen: gift_from_ergen,
    	good_corn: good_corn,
    	banana: banana
    };

    var marisa$2 = {
    	name: "雾雨魔理沙",
    	detail: "最华丽的弹幕，需要最朴实无华的启动。",
    	talent: "每回合初获得4额外灵力。\n击败敌人时回复8生命。\n商店打9折。",
    	unlock: "造成一次超过1000的伤害",
    	WIP: {
    		shion: {
    			name: "依神紫苑",
    			detail: "失去的财产，还有运气究竟去了哪里呢。"
    		},
    		aya: {
    			name: "射命丸文",
    			detail: "来吧，我会手下留情的。"
    		}
    	}
    };
    var reimu$2 = {
    	name: "博丽灵梦",
    	detail: "天生灵力，超乎常人的幸运，不过……",
    	talent: "灵力用尽时消耗2生命上限代替1灵力使用。\n清欢: 回合开始时对全体目标造成1(每层+1)穿透伤害。每受到1伤害失去清欢*2。\n概率事件额外判定两次，取更好的那次。",
    	unlock: "回合内所有概率事件判定均为正面"
    };
    var youmu$1 = {
    	name: "魂魄妖梦",
    	detail: "半人半灵的半吊子。但是剑有两把。",
    	talent: "效果-通灵：10%(每层+10%)几率闪避下一次攻击。每回合初清空。\n所有暴击率转化为暴击伤害。\n每消耗一点灵力，获得通灵*1。\n每触发一次闪避减少通灵*3，并反击一次必定暴击的普攻。",
    	unlock: "一场战斗内所有攻击全部暴击"
    };
    var pachi = {
    	name: "帕秋莉",
    	detail: "居住在大图书馆中的魔女，非常擅长魔法。",
    	talent: "类型-精灵魔法：可选择咏唱2/3/4回合，时间越长威力越大。",
    	unlock: "在敌人的回合击败最终boss"
    };
    var alice = {
    	name: "爱丽丝",
    	detail: "魔法森林中的，七色的奴隶主。",
    	talent: "类型-人偶：按刷新顺序阻挡伤害，耐久归零时清除，重复放置刷新耐久和结算顺序。",
    	unlock: "只依靠间接伤害击败一个boss"
    };
    var reisen$1 = {
    	name: "铃仙",
    	detail: "菜，就多练，输不起，就别玩。",
    	detail2: "狂气的月兔！天不怕地不怕，迷途竹林我最大！",
    	talent: "效果-狂气：命中率*95%(每层*95%)。\n效果-虚幻：受到伤害+5%(每层+5%)\n效果-疯狂：受到1(每层+1)穿透间接伤害。\n符卡可以施加狂气和虚幻效果，两种效果会互相抵消并产生相应层数的疯狂效果。\n为敌人施加狂气和虚幻中一种效果时，自身获得另一种效果*1。\n在受狂气影响和受虚幻影响之间切换时，结算疯狂效果。",
    	unlock: "血量100%时被单次伤害击败"
    };
    var kokoro = {
    	name: "秦心",
    	detail: "表情丰富的扑克脸，跳起舞来很可爱。",
    	talent: "面具:佩戴条件;佩戴效果\n面具打出后登记到效果栏，触发任一佩戴条件即可获得持续的触发效果。\n同时只能佩戴一个面具，默认佩戴登记的第一个面具。\n重复打出已登记的面具可叠加佩戴效果的层数，切换面具时清除。",
    	unlock: "在不使用通式的情况下完成一个场景"
    };
    var role = {
    	marisa: marisa$2,
    	reimu: reimu$2,
    	youmu: youmu$1,
    	pachi: pachi,
    	alice: alice,
    	reisen: reisen$1,
    	kokoro: kokoro
    };

    var growth$1 = {
      role: {
        marisa: {
          health: 42,
          attack: 7,
          speed: 2,
          power: 1
        },
        reimu: {
          health: 42,
          attack: 7,
          speed: 2,
          power: 8
        },
        renko: {
          health: 42,
          attack: 7,
          speed: 2,
          power: 6
        },
        youmu: {
          health: 48,
          attack: 8,
          speed: 2,
          power: 8
        },
        pachi: {
          health: 42,
          attack: 7,
          speed: 2,
          power: 7
        },
        alice: {
          health: 54,
          attack: 9,
          speed: 2,
          power: 5
        },
        reisen: {
          health: 48,
          attack: 8,
          speed: 2,
          power: 6
        },
        kokoro: {
          health: 54,
          attack: 9,
          speed: 2,
          power: 8
        }
      },
      enermy: {
        cirno: lv => {
          return enermy$2(lv, 1, 1, 1);
        },
        piece: lv => {
          return enermy$2(lv, 1, 1, 1);
        },
        lilywhite: lv => {
          return enermy$2(lv, 1, 1, 1);
        },
        sunny: lv => {
          return enermy$2(lv, 1, 1, 1);
        },
        lunar: lv => {
          return enermy$2(lv, 1, 1, 1);
        },
        star: lv => {
          return enermy$2(lv, 1, 1, 1);
        },
        eternity: lv => {
          return enermy$2(lv, 1, 1, 1);
        }
      },
      amount: lv => {
        let e = 4.2 - 1 / Math.pow(2, (lv / 32 - 2)),
          p = e - parseInt(e),
          a = Number(Math.random() < p);
        return Math.max(parseInt(e) + a, 1);
      }
    };

    function enermy$2(lv, h, a, s) {
      return {
        health: float$1(e$1(lv) * h),
        attack: float$1(e$1(lv) * a / 8),
        speed: 1 + 0.02 * (lv - 1) * s,
      }
    }

    function e$1(lv) {
      lv = retain(lv * 0.8, 0) + 2;
      return parseInt(Math.pow(Math.E, lv / (Math.log(lv + 1) + Math.sqrt(lv))) + lv + 10);
    }

    function float$1(v) {
      return v * 0.95 + Math.random().toFixed(2) * v * 0.1;
    }

    const marisa$1 = {
      marisa: {
        name: "魔法弹",
        detail: "造成10伤害",
        cost: 1,
        aim: true,
        type: "normal_attack",
        handle: function (Admin, Target) {
          Admin.enermy.damage.target(Target).source("normal_attack").by({
            type: "static",
            value: 10
          });
        }
      },
      m001: {
        name: "开放宇宙",
        detail: "本回合灵力消耗-1\n下回合无法获得灵力",
        cost: 2,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("throttle", 1);
          Admin.cache["open_universe"] = true;
        }
      },
      m002: {
        name: "洒星封印",
        detail: "锁定灵力数值\n持续一回合",
        cost: 3,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("throttle", 99);
          Admin.role.buff.of(0).add("insulation");
        }
      },
      m003: {
        name: "超级英仙座",
        detail: "每使用1张符卡\n下回合伤害+10%\n持续一回合",
        cost: 2,
        handle: function (Admin, Target) {
          Admin.cache["super_perseids"] = 1;
        }
      },
      m004: {
        name: "太阳仪",
        detail: "本回合所有伤害\n转移到下回合初结算\n造成120%间接伤害",
        cost: 2,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("orrerys_sun", 1);
        }
      },
      m005: {
        name: "极限火花",
        detail: "造成36群体伤害\n下回合无法行动",
        cost: 3,
        handle: function (Admin, Target) {
          Admin.enermy.damage.targetAll().source("spellcard").by({
            type: "static",
            value: 36
          });
          Admin.role.buff.of(0).add("hypodynamic", 1);
        }
      },
      m006: {
        name: "究极火花",
        detail: "造成40群体伤害\n每有1灵力伤害+5%\n下回合无法行动",
        cost: 5,
        handle: function (Admin, Target) {
          let n = Admin.role.power.of(0).get();
          Admin.enermy.damage.targetAll().source("spellcard").by({
            type: "static",
            value: 40 * (1 + 0.05 * n)
          });
          Admin.role.buff.of(0).add("hypodynamic", 1);
        }
      },
      m007: {
        name: "卫星幻觉",
        detail: "从牌库中抽2张牌",
        cost: 2,
        handle: function (Admin, Target) {
          Admin.handcard.draw.amount(2).fromAll();
        }
      },
      m008: {
        name: "魔理沙时间",
        detail: "暴击率+30%\n持续一回合",
        cost: 1,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("marisa_time");
        }
      },
      m009: {
        name: "小行星带",
        detail: "造成4*5群体伤害",
        cost: 3,
        handle: function (Admin, Target) {
          Admin.enermy.damage.targetAll().source("spellcard").by({
            type: "static",
            value: 5,
            amount: 4
          });
        }
      },
      m010: {
        name: "大坍缩",
        detail: "将60伤害平摊给所有敌人",
        cost: 3,
        handle: function (Admin, Target) {
          Admin.enermy.damage.average().source("spellcard").by({
            type: "static",
            value: 60
          });
        }
      },
      m011: {
        name: "星尘幻想",
        detail: "对目标和其余敌人分别造成40、8伤害",
        cost: 3,
        aim: true,
        handle: function (Admin, Target) {
          Admin.enermy.damage.target(Target).source("spellcard").by({
            type: "static",
            value: 40
          });
          Admin.enermy.damage.targetAll().except(Target).source("spellcard").by({
            type: "static",
            value: 8
          });
        }
      },
      m012: {
        name: "掠日彗星",
        detail: "造成16伤害\n获得8防御结界",
        cost: 2,
        aim: true,
        handle: function (Admin, Target) {
          Admin.enermy.damage.target(Target).source("spellcard").by({
            type: "static",
            value: 16
          });
          Admin.role.buff.of(0).add("barrier", 8);
        }
      },
      m013: {
        name: "光学迷彩",
        detail: "锁定生命值\n造成的伤害-50%\n持续一回合",
        cost: 3,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("iron_skin", 10);
          Admin.role.buff.of(0).add("weak", 5);
        }
      },
      m014: {
        name: "星光台风",
        detail: "造成27群体穿透伤害\n命中率70%",
        cost: 3,
        handle: function (Admin, Target) {
          Admin.enermy.damage.targetAll().source("spellcard").by({
            type: "static",
            value: 27,
            penetrate: true,
            precision: 0.7
          });
        }
      },
      m015: {
        name: "大十字",
        detail: "接下来三次伤害\n暴击伤害+100%",
        cost: 3,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("grand_cross", 3);
        }
      },
      m016: {
        name: "非定向光线",
        detail: "造成28穿透伤害\n立即击败生命值25%以下的敌人",
        cost: 2,
        aim: true,
        handle: function (Admin, Target) {
          let state = Admin.enermy.state.of(Target).get();
          Admin.enermy.damage.target(Target).source("spellcard").by({
            type: "static",
            value: 28,
            penetrate: true,
            fatal: state.Health / state.health < 0.25
          });
        }
      },
      m017: {
        name: "龙陨石",
        detail: "造成12+20的必定暴击伤害，击败目标获得临时力量*5",
        cost: 3,
        aim: true,
        handle: function (Admin, Target) {
          Admin.enermy.damage.target(Target).source("spellcard").by({
            type: "static",
            value: 12,
            critical: true,
            dragon_meteor: 1
          });
          Admin.enermy.damage.target(Target).source("spellcard").by({
            type: "static",
            value: 20,
            critical: true,
            dragon_meteor: 2
          });
        }
      },
      m018: {
        name: "增幅",
        detail: "获得力量*2",
        cost: 2,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("strength", 1);
        }
      },
      m019: {
        name: "过载",
        detail: "获得临时力量*4",
        cost: 3,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("interim_strength", 3);
        }
      },
      m020: {
        name: "超载",
        detail: "获得临时力量*6",
        cost: 3,
        interim: true,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("interim_strength", 5);
        }
      },
      m021: {
        name: "唯一的北极星",
        detail: "造成36伤害\n若目标生命值100%\n伤害翻倍",
        cost: 3,
        aim: true,
        handle: function (Admin, Target) {
          let state = Admin.enermy.state.of(Target).get();
          Admin.enermy.damage.target(Target).source("spellcard").by({
            type: "static",
            value: state.Health / state.health == 1 ? 72 : 36
          });
        }
      },
      m022: {
        name: "试验用使魔",
        detail: "本回合所有伤害截走25%，在回合末合并结算为群体伤害",
        cost: 2,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("test_slave");
        }
      },
      m023: {
        name: "逃逸速度",
        detail: "每过一回合速度+0.6",
        cost: 2,
        interim: true,
        handle: function (Admin, Target) {
          Admin.cache["escape_velocity"] = true;
        }
      },
      m024: {
        name: "光之冲击",
        detail: "造成24伤害\n目标命中率-50%\n持续一回合",
        cost: 2,
        aim: true,
        handle: function (Admin, Target) {
          Admin.enermy.damage.target(Target).source("spellcard").by({
            type: "static",
            value: 24
          });
          Admin.enermy.buff.of(Target).add("trance", 5);
        }
      },
      m025: {
        name: "超短波",
        detail: "造成16伤害\n第一回合伤害翻倍",
        cost: 0,
        aim: true,
        handle: function (Admin, Target) {
          Admin.enermy.damage.target(Target).source("spellcard").by({
            type: "static",
            value: Admin.role.event.round.count == 1 ? 32 : 16
          });
        }
      },
      m026: {
        name: "脉冲星",
        detail: "复制下一张符卡\n作为一次性牌\n加入手牌",
        cost: 1,
        handle: function (Admin, Target) {
          Admin.cache["pulsar_star"] = 2;
        }
      },
      m027: {
        name: "魔法瓶",
        detail: "附加燃烧*3\n抽一张牌",
        cost: 0,
        interim: true,
        aim: true,
        handle: function (Admin, Target) {
          Admin.enermy.buff.of(Target).add("burning", 3);
          Admin.handcard.draw.amount(1).fromLeft();
        }
      },
      m028: {
        name: "魔鬼火炬",
        detail: "牌库洗入魔法瓶*4",
        cost: 2,
        interim: true,
        handle: function (Admin, Target) {
          for (let _ of Array(4)) Admin.handcard.insert.toLeft("m027");
        }
      },
      m029: {
        name: "流星雨",
        detail: "造成4*3伤害\n抽一张牌",
        cost: 0,
        interim: true,
        aim: true,
        handle: function (Admin, Target) {
          Admin.enermy.damage.target(Target).source("spellcard").by({
            type: "static",
            value: 3,
            amount: 4
          });
          Admin.handcard.draw.amount(1).fromLeft();
        }
      },
      m030: {
        name: "流星共鸣",
        detail: "牌库洗入流星雨*4",
        cost: 2,
        interim: true,
        handle: function (Admin, Target) {
          for (let _ of Array(4)) Admin.handcard.insert.toLeft("m029");
        }
      },
      m031: {
        name: "地球光",
        detail: "造成12穿透伤害\n抽一张牌",
        cost: 0,
        interim: true,
        aim: true,
        handle: function (Admin, Target) {
          Admin.enermy.damage.target(Target).source("spellcard").by({
            type: "static",
            value: 12,
            penetrate: true,
          });
          Admin.handcard.draw.amount(1).fromLeft();
        }
      },
      m032: {
        name: "射向幼月",
        detail: "牌库洗入地球光*4",
        cost: 2,
        interim: true,
        handle: function (Admin, Target) {
          for (let _ of Array(4)) Admin.handcard.insert.toLeft("m031");
        }
      },
      m033: {
        name: "掩星",
        detail: "从已消耗的牌中\n抽一张牌",
        cost: 2,
        handle: function (Admin, Target) {
          Admin.handcard.draw.amount(1).fromExpend();
        }
      },
      m034: {
        name: "毫秒脉冲星",
        detail: "本回合每消耗1张牌\n此牌造成3*2伤害",
        cost: 3,
        aim: true,
        handle: function (Admin, Target) {
          Admin.enermy.damage.target(Target).source("spellcard").by({
            type: "static",
            value: 2,
            amount: 3 * Admin.cache["round_expend_count"]
          });
        }
      },
      m035: {
        name: "奥尔特云",
        detail: "造成等同于本回合造成伤害次数的伤害",
        cost: 4,
        aim: true,
        handle: function (Admin, Target) {
          Admin.enermy.damage.target(Target).source("spellcard").by({
            type: "static",
            value: Admin.cache["round_damage_frequency"]
          });
        }
      },
      m036: {
        name: "银河",
        detail: "本回合造成的伤害+1",
        cost: 1,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("milky_way");
        }
      },
      m037: {
        name: "最终魔法瓶",
        detail: "对全场所有对象\n造成100伤害",
        cost: 0,
        interim: true,
        handle: function (Admin, Target) {
          Admin.enermy.damage.targetAll().source("spellcard").by({
            type: "static",
            value: 100
          });
          Admin.role.damage.target(0).source("spellcard").by({
            type: "static",
            value: 100
          });
        }
      }
    };

    for (let key in marisa$1) {
      marisa$1[key].role = "marisa";
    }

    const reimu$1 = {
      reimu: {
        name: "阴阳印",
        detail: "造成6伤害\n获得清欢*3",
        cost: 1,
        handle: function (Admin, Target) {
          console.log(Target);
          Admin.enermy.damage.target(Target).source("normal_attack").by({
            type: "static",
            value: 6
          });
          Admin.role.buff.of(0).add("pure_happy", 3);
        },
        aim: true
      },
      r001: {
        name: "梦想封印",
        detail: "重复6次对随机目标造成6伤害，未命中时获得清欢*5",
        cost: 3,
        handle: function (Admin, Target) {
          [1, 2, 3, 4, 5, 6].forEach(_ => {
            Admin.enermy.damage.random().source("spellcard").by({
              type: "static",
              value: 6,
              dream_seal: true
            });
          });
        }
      },
      r002: {
        name: "前方安全札",
        detail: "本回合造成伤害时\n回复5生命值\n获得恍惚*2",
        cost: 2,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).set("font_safe", 1);
        }
      },
      // r003: { 搬了这牌是因为，拟态猫挂件把灵力需求转化为百分比扣当前生命值了，这样的话无论受到多少伤害生命值都会无限趋近于0，而永远不会死
      //   name: "梦想天生",
      //   detail: "每受到3伤害\n消耗1灵力阻挡\n持续一回合",
      //   cost: 3,
      //   handle: function (Admin, Target) {
      //     Admin.role.buff.of(0).set("dream_born");
      //   }
      // },
      r004: {
        name: "阴阳玉将",
        detail: "削减所有目标\n20%当前生命值\n命中获得清欢*4",
        cost: 3,
        handle: function (Admin, Target) {
          Admin.enermy.survival().forEach(i => {
            let Health = Admin.enermy.state.of(i).get().Health;
            Admin.enermy.state.of(i).set("Health", Health * 0.8);
            Admin.role.buff.of(0).add("pure_happy", 4);
          });
        }
      },
      r005: {
        name: "二重结界",
        detail: "所有目标受到的伤害\n变为穿透伤害\n持续一回合",
        cost: 2,
        handle: function (Admin, Target) {
          Admin.enermy.buff.addAll("exposure", 1);
        }
      },
      r006: {
        name: "博丽幻影",
        detail: "40%概率闪避伤害\n闪避时获得清欢*4\n持续一回合",
        cost: 2,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("hakurei_phantom");
        }
      },
      r007: {
        name: "阴阳散华",
        detail: "抽两张牌\n获得清欢*8",
        cost: 3,
        handle: function (Admin, Target) {
          Admin.handcard.draw.amount(2).fromLeft();
          Admin.role.buff.of(0).add("pure_happy", 8);
        }
      },
      r008: {
        name: "魔净闪结",
        detail: "回复8生命值\n获得清欢*6\n下张牌造成同样效果",
        cost: 3,
        handle: function (Admin, Target) {
          Admin.role.heal.target(0).by({
            type: "static",
            value: 8
          });
          Admin.role.buff.of(0).add("pure_happy", 6);
          Admin.cache["magic_link"] = true;
        }
      },
      r009: {
        name: "八方鬼缚阵",
        detail: "免疫2次伤害",
        cost: 2,
        interim: true,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("foresee", 2);
        }
      },
      r010: {
        name: "妖怪拘禁符",
        detail: "附加虚弱*4，若目标生命值100%，下次行动变为附加恍惚*3",
        cost: 3,
        handle: function (Admin, Target) {
          Admin.enermy.buff.of(Target).add("weak", 4);
          let state = Admin.enermy.state.of(Target).get();
          if (state.Health == state.health) {
            Admin.enermy.buff.of(Target).add("trance_cage", 1);
          }
        },
        aim: true
      },
      r011: {
        name: "无差别降伏",
        detail: "造成24伤害\n若未暴击\n获得清欢*8",
        cost: 3,
        handle: function (Admin, Target) {
          Admin.enermy.damage.target(Target).source("spellcard").by({
            type: "static",
            value: 24,
            undifferentiated_subduction: true
          });
        },
        aim: true
      },
      r012: {
        name: "妖怪破坏者",
        detail: "造成16伤害\n若未命中\n获得防御结界*12",
        cost: 2,
        handle: function (Admin, Target) {
          Admin.enermy.damage.target(Target).source("spellcard").by({
            type: "static",
            value: 16,
            ghost_breaker: true
          });
        },
        aim: true
      },
      r013: {
        name: "退魔符乱舞",
        detail: "3穿透群伤，消耗清欢*1，打出后回到手牌，消耗清欢+1",
        cost: 1,
        handle: function (Admin, Target) {
          Admin.enermy.damage.targetAll().source("spellcard").by({
            type: "static",
            value: 3,
            penetrate: true
          });
          Admin.handcard.insert.interim(true).toHolds("r013");
          Admin.role.buff.of(0).clear("pure_happy", Admin.cache["pure_happy_cost"]);
          "pure_happy_cost".increaseOf(Admin.cache);
        },
        interim: true
      },
      r014: {
        name: "梦想亚空穴",
        detail: "获得2额外灵力，生命-2，打出后回到手牌，生命消耗+2",
        cost: 0,
        handle: function (Admin, Target) {
          if (!Admin.cache["reimu_health_cost"]) Admin.cache["reimu_health_cost"] = 2;
          let state = Admin.role.state.of(0).get();
          Admin.role.power.of(0).add(3);
          Admin.role.state.of(0).set("Health", state.Health - Admin.cache["reimu_health_cost"]);
          Admin.cache["reimu_health_cost"] += 2;
          Admin.handcard.insert.interim(true).toHolds("r014");
        },
        interim: true
      },
      r015: {
        name: "常置阵",
        detail: "受到伤害为穿透伤害\n受到的伤害-30%\n持续一回合",
        cost: 2,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("exposure", 1);
          Admin.role.buff.of(0).add("iron_skin", 3);
        }
      },
      r016: {
        name: "明珠暗投",
        detail: "下回合初\n获得清欢*12\n抽两张牌",
        cost: 2,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("waiting_pearl");
        }
      },
      r017: {
        name: "阴阳玉乱舞",
        detail: "造成32伤害\n击败目标时抽两张牌",
        cost: 3,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("pure_happy");
        }
      },
      r018: {
        name: "神灵宝珠",
        detail: "生命-9\n抽两张牌",
        cost: 0,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("pure_happy");
        }
      },
      r019: {
        name: "无情驱魔棒",
        detail: "灵力消耗-1\n受到伤害+30%\n持续一回合",
        cost: 0,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("pure_happy");
        }
      },
      r020: {
        name: "信仰之针",
        detail: "造成8伤害\n未命中时抽两张牌",
        cost: 1,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("pure_happy");
        }
      },
      r021: {
        name: "扩散灵符",
        detail: "获得清欢*6\n不在第一回合使用时\n再获得恍惚*3",
        cost: 2,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("pure_happy");
        }
      },
      r022: {
        name: "犯规结界",
        detail: "丢弃全部手牌，获得临时防御结界*16",
        cost: 2,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("pure_happy");
        }
      },
      r023: {
        name: "阴阳飞鸟井",
        detail: "本回合打出符卡时\n40%概率获得2额外灵力",
        cost: 2,
        interim: true,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("pure_happy");
        }
      },
      r024: {
        name: "阴阳宝玉",
        detail: "抽两张符卡\n获得清欢*3\n获得恍惚*3",
        cost: 2,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("pure_happy");
        }
      },
      r025: {
        name: "阴阳鬼神玉",
        detail: "造成等同于自身最大生命值70%的伤害，获得清欢*8",
        cost: 3,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("pure_happy");
        }
      },
      r026: {
        name: "幻想一重",
        detail: "处于清欢效果下时\n清除所有清欢\n生命上限+5",
        cost: 2,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("pure_happy");
        }
      },
      r027: {
        name: "亚空穴",
        detail: "丢弃一张牌\n生命上限+4\n打出后回到牌库",
        cost: 1,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("pure_happy");
        }
      },
      r028: {
        name: "八方龙杀阵",
        detail: "本场战斗\n受到伤害-30%\n速度-0.5",
        cost: 1,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("pure_happy");
        }
      },
      r029: {
        name: "高速祈愿札",
        detail: "回复8生命\n生命上限+12",
        cost: 2,
        interim: true,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("pure_happy");
        }
      },
      r030: {
        name: "大祸津日",
        detail: "造成伤害-100%\n治疗效果+100%\n持续一回合",
        cost: 1,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("pure_happy");
        }
      },
      r031: {
        name: "梦想妙珠连",
        detail: "牌库洗入梦想妙珠*4",
        cost: 3,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("pure_happy");
        }
      },
      r032: {
        name: "梦想妙珠",
        detail: "生命上限+3\n抽一张牌",
        cost: 0,
        interim: true,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("pure_happy");
        }
      },
      r033: {
        name: "扩散结界",
        detail: "清除目标和自身\n所有正面效果\n抽两张牌",
        cost: 3,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("pure_happy");
        }
      },
      r034: {
        name: "幻想之月",
        detail: "处于清欢效果下时\n清除所有清欢\n获得8额外灵力",
        cost: 2,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("pure_happy");
        }
      },
      r035: {
        name: "即妙神域札",
        detail: "清除自身所有效果\n回复10生命",
        cost: 2,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("pure_happy");
        }
      },
      r036: {
        name: "折跃阴阳玉",
        detail: "造成20群体伤害\n命中时回复4生命\n反之生命上限+4",
        cost: 3,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("pure_happy");
        }
      },
      r037: {
        name: "封魔阵",
        detail: "造成16穿透伤害\n附加虚弱*3\n暴击时生命上限+8",
        cost: 3,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("pure_happy");
        }
      }
    };

    for (let key in reimu$1) {
      reimu$1[key].role = "reimu";
    }

    const spellcard$1 = {
      youmu: {
        name: "剑气",
        detail: "造成2*4伤害",
        role: "youmu",
        cost: 1,
        handle: function (Admin, Target) {
          Admin.enermy.damage.target(Target).source("normal_attack").by({
            type: "static",
            value: 4,
            amount: 2
          });
        }
      },
      bright_bitter_wheel: {
        name: "幽明的苦轮",
        detail: "接下来三次攻击\n额外60%间接伤害\n并获得1额外灵力",
        role: "youmu",
        allAim: true,
        cost: 3,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("Bright_Bitter_Wheel", 3);
        }
      },
      six_roots_clean: {
        name: "六根清净斩",
        detail: "下次受到攻击时闪避\n并造成15群体伤害",
        role: "youmu",
        allAim: true,
        cost: 3,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("six_roots_clean", 1);
        }
      },
      centered_flow: {
        name: "圆心流转斩",
        detail: "造成3*4群体伤害\n下次普通攻击伤害提高80%",
        role: "youmu",
        allAim: true,
        cost: 3,
        handle: function (Admin, Target) {
          Admin.enermy.damage.targetAll().source("spellcard").by({
            type: "static",
            value: 4,
            amount: 3
          });
          Admin.role.buff.of(0).add("flow", 1);
        }
      },
      future_never_survive: {
        name: "未来永劫斩",
        detail: "造成28伤害\n接下来三次普攻\n变为4*3",
        role: "youmu",
        cost: 3,
        handle: function (Admin, Target) {
          Admin.enermy.damage.target(Target).source("spellcard").by({
            type: "static",
            value: 28
          });
          Admin.role.buff.of(0).add("yanfan", 3);
        }
      },
      graciousness_maze: {
        name: "迷津慈航斩",
        detail: "普攻消耗灵力+1\n伤害提高200%\n持续一回合",
        role: "youmu",
        allAim: true,
        cost: 3,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).set("meditation_slash", 1);
        }
      },
      pachi: {
        name: "魔力光束",
        detail: "造成7伤害\n必定命中",
        role: "pachi",
        cost: 1
      },
      royal_lare: {
        name: "皇家圣焰",
        detail: "精灵魔法:12/20/30群体伤害\n附加燃烧*1/2/3",
        role: "pachi",
        cost: 3
      },
      philosophers_stone: {
        name: "贤者之石",
        detail: "精灵魔法缩短一回合\n抽取一张符卡",
        role: "pachi",
        cost: 3
      },
      silent_selene: {
        name: "沉静的月神",
        detail: "清除全体敌人正面效果，下一回合无法行动，不受到任何伤害",
        role: "pachi",
        cost: 3
      },
      silver_dragon: {
        name: "银龙",
        detail: "12伤害\n精灵魔法:14/24/34伤害",
        role: "pachi",
        cost: 3
      },
      bury_in_lake: {
        name: "湖葬",
        detail: "每回合造成6间接伤害，回复等量生命，持续3回合",
        role: "pachi",
        cost: 3
      },
      jellyfish_princess: {
        name: "水母公主",
        detail: "每回合回复10%最大生命值并获得1额外灵力，持续3回合",
        role: "pachi",
        cost: 3
      },
      "sylphy_horn": {
        name: "风灵的角笛",
        detail: "精灵魔法:回复12/20/30生命值",
        role: "pachi",
        cost: 3
      },
      "emerald_megalopolis": {
        name: "翡翠巨城",
        detail: "下一回合伤害提高\n20%，每造成一次伤害额外提高20%",
        role: "pachi",
        cost: 3
      },
      "alice": {
        name: "人偶千枪",
        detail: "造成9伤害\n对于负面效果下的目标必定暴击",
        role: "alice",
        cost: 1
      },
      "artful_sacrifice": {
        name: "狡猾的献祭",
        detail: "清除随机人偶\n造成36伤害",
        role: "alice",
        cost: 3
      },
      "return_inanimateness": {
        name: "回归虚无",
        detail: "清除所有人偶\n每清除1人偶\n造成6群体伤害",
        role: "alice",
        cost: 3
      },
      "little_legion": {
        name: "小小军势",
        detail: "人偶造成两倍伤害\n持续一回合",
        role: "alice",
        cost: 3
      },
      "shanghai_doll": {
        name: "上海人偶",
        detail: "人偶:攻击15\n耐久25\n",
        role: "alice",
        cost: 3
      },
      "penglai_doll": {
        name: "蓬莱人偶",
        detail: "人偶:耐久1\n损坏时造成45伤害",
        role: "alice",
        cost: 3
      },
      "kyoto_doll": {
        name: "京都人偶",
        detail: "人偶:攻击4,耐久12\n每回合获得\n2额外灵力",
        role: "alice",
        cost: 3
      },
      "xizang_doll": {
        name: "西藏人偶",
        detail: "人偶:攻击4,耐久36",
        role: "alice",
        cost: 3
      },
      "london_doll": {
        name: "伦敦人偶",
        detail: "人偶:耐久20\n攻击等同于耐久",
        role: "alice",
        cost: 3
      },
      "russia_doll": {
        name: "俄罗斯人偶",
        detail: "人偶:攻击4,耐久12\n造成群体伤害",
        role: "alice",
        cost: 3
      },
      "holland_doll": {
        name: "荷兰人偶",
        detail: "人偶:攻击4,耐久12\n在场时所有攻击\n附加流血*1",
        role: "alice",
        cost: 3
      },
      "orleans_doll": {
        name: "奥尔良人偶",
        detail: "人偶:攻击4,耐久12\n每回合回复7生命值",
        role: "alice",
        cost: 3
      },
      "kokoro": {
        name: "心之舞",
        detail: "造成9伤害\n回复3生命",
        role: "kokoro",
        cost: 1
      },
      "kokoro_roulette": {
        name: "心的轮盘",
        detail: "佩戴随机其它面具",
        role: "kokoro",
        cost: 3
      },
      "masked_heart_dance": {
        name: "假面丧心舞",
        detail: "佩戴所有面具\n灵力消耗+1\n直到下次佩戴面具",
        role: "kokoro",
        cost: 3
      },
      "taboo_wolf_face": {
        name: "忌狼之面",
        detail: "佩戴两次当前佩戴的面具",
        role: "kokoro",
        cost: 3
      },
      "demon_fox_face": {
        name: "妖狐面",
        detail: "面具:额外灵力大于1;灵力消耗-1(+1)",
        role: "kokoro",
        cost: 3
      },
      "big_spider_face": {
        name: "大蜘蛛面",
        detail: "面具:回合内进行超过3次攻击;造成的伤害+30%(+30%)",
        role: "kokoro",
        cost: 3
      },
      "ghost_face": {
        name: "鬼婆面",
        detail: "面具:生命值在40%以下;回复效果+30%(+30%)",
        role: "kokoro",
        cost: 3
      },
      "long_wall_face": {
        name: "长壁面",
        detail: "面具:单次受伤15以上;回复造成伤害30%(+30%)的生命",
        role: "kokoro",
        cost: 3
      },
      "Hot_man_face": {
        name: "火男面",
        detail: "面具:新增正面效果;治疗时造成100%(+100%)额外群伤",
        role: "kokoro",
        cost: 3
      },
      "lion_face": {
        name: "狮子面",
        detail: "面具:手牌数超过5;抽牌数+1(+1)",
        role: "kokoro",
        cost: 3
      },
      "worryingly": {
        name: "杞人忧地",
        detail: "清除随机面具\n造成15群体伤害",
        role: "kokoro",
        cost: 3
      },
      "reisen": {
        name: "Lunatic Gun",
        detail: "造成8伤害\n附加疯狂*4",
        role: "reisen",
        cost: 1
      },
      "lunatic_red_eyes": {
        name: "幻胧月睨",
        detail: "所有疯狂翻倍",
        role: "reisen",
        cost: 3
      },
      "invisible_full_moon": {
        name: "真实之月",
        detail: "造成12穿透伤害\n附加疯狂*16",
        role: "reisen",
        cost: 3
      },
      "visionary_tuning": {
        name: "幻视调律",
        detail: "造成12伤害\n附加虚幻*12",
        role: "reisen",
        cost: 3
      },
      "illusion_seeker": {
        name: "狂视调律",
        detail: "造成12伤害\n附加狂气*12",
        role: "reisen",
        cost: 3
      },
      "mind_stopper": {
        name: "生神停止",
        detail: "回复10生命值\n获得虚幻*2",
        role: "reisen",
        cost: 3
      },
      "rocket_in_mist": {
        name: "胧月花栞",
        detail: "造成8群体伤害\n获得狂气*2",
        role: "reisen",
        cost: 3
      },
      "luna_wave": {
        name: "月面波纹",
        detail: "所有目标一半的狂气或虚幻施加给随机目标",
        role: "reisen",
        cost: 3
      },
      "luna_megalopolis": {
        name: "荣华之梦",
        detail: "清除所有狂气和虚幻\n清除自身疯狂",
        role: "reisen",
        cost: 3
      },
      "infrared_moon": {
        name: "赤月下",
        detail: "造成伤害时\n附加狂气*伤害50%\n持续一回合",
        role: "reisen",
        cost: 3
      },
      "invisible_half_moon": {
        name: "幻之月",
        detail: "造成伤害时\n附加虚幻*伤害50%\n持续一回合",
        role: "reisen",
        cost: 3
      }
    };

    Object.assign(spellcard$1, marisa$1);
    Object.assign(spellcard$1, reimu$1);

    for (let c in spellcard$1) if (spellcard$1[c].type != "normal_attack") spellcard$1[c].type = "spellcard";

    const basecard = {
      a001: {
        name: "森罗万象",
        detail: "抽牌至上限",
        cost: 2,
        interim: true,
        handle: function (Admin, Target) {
          let holdLimit = 4 + Math.round(Admin.role.state.of(0).get().speed);
          let holdLength = Admin.handcard.getHolds().length;
          Admin.handcard.draw.amount(holdLimit - holdLength).fromLeft();
        }
      },
      a002: {
        name: "小憩",
        detail: "回复8%最大生命",
        cost: 1,
        handle: function (Admin, Target) {
          Admin.role.heal.target(0).by({
            type: "static",
            value: Admin.role.state.of(0).get().health * 0.08
          });
        }
      },
      a003: {
        name: "圣骑士",
        detail: "造成10伤害\n获得15%最大生命\n防御结界",
        cost: 2,
        aim: true,
        handle: function (Admin, Target) {
          Admin.enermy.damage.target(Target).source("basecard").by({
            type: "static",
            value: 10
          });
          Admin.role.buff.of(0).add("barrier", Math.ceil(Admin.role.state.of(0).get().health * 0.15));
        }
      },
      a004: {
        name: "灵力冲天炮",
        detail: "消耗全部灵力\n每消耗1灵力\n造成8伤害",
        cost: 1,
        aim: true,
        handle: function (Admin, Target) {
          Admin.enermy.damage.target(Target).source("basecard").by({
            type: "static",
            value: 8,
            amount: Admin.role.power.of(0).get()
          });
          Admin.role.power.of(0).clear();
        }
      },
      a006: {
        name: "虚空",
        detail: "免疫一次伤害\n抽一张牌",
        cost: 1,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("foresee", 1);
          Admin.handcard.draw.amount(1).fromLeft();
        }
      },
      a007: {
        name: "抛硬币",
        detail: "损失10硬币\n概率判定均为正面\n持续一回合",
        cost: 2,
        handle: function (Admin, Target) {
          if (Admin.data.coin >= 10) {
            Admin.data.coin -= 10;
            Admin.role.buff.of(0).add("strong_luck");
          }
          else msg({ content: "硬币不够了" });
        }
      },
      a008: {
        name: "千里炽云",
        detail: "附加燃烧*4\n附加流血*4",
        cost: 2,
        aim: true,
        handle: function (Admin, Target) {
          Admin.enermy.buff.of(Target).add("burning", 4);
          Admin.enermy.buff.of(Target).add("bleed", 4);
        }
      },
      a009: {
        name: "不干净之手",
        detail: "造成9伤害\n获得27硬币",
        cost: 1,
        aim: true,
        handle: function (Admin, Target) {
          Admin.enermy.damage.target(Target).source("basecard").by({
            type: "static",
            value: 9
          });
          Admin.data.coin += 9;
        }
      },
      a017: {
        name: "圣光",
        detail: "回复8生命\n将临时防御结界*16\n给予场上全体目标",
        cost: 2,
        handle: function (Admin, Target) {
          Admin.role.heal.target(0).by({
            type: "static",
            value: 8
          });
          Admin.enermy.buff.addAll("interim_barrier", 16);
          Admin.role.buff.of(0).add("interim_barrier", 16);
        }
      },
      a021: {
        name: "制裁",
        detail: "丢弃一张手牌\n造成10群体伤害",
        cost: 2,
        handle: function (Admin, Target) {
          if (Admin.handcard.getHolds().length > 1) {
            Admin.enermy.damage.targetAll().source("basecard").by({
              type: "static",
              value: 10
            });
            Admin.handcard.abandon.amount(1).fromHolds();
          }
          else msg({ content: "手牌不足" });
        }
      },
      a022: {
        name: "大憩",
        detail: "回复12生命值",
        cost: 2,
        handle: function (Admin, Target) {
          Admin.role.heal.target(0).by({
            type: "static",
            value: 12
          });
        }
      },
      a023: {
        name: "深渊之殇",
        detail: "造成等同于自身当前生命50%的伤害",
        cost: 2,
        aim: true,
        handle: function (Admin, Target) {
          Admin.enermy.damage.target(Target).source("basecard").by({
            type: "static",
            value: Admin.role.state.of(0).get().Health * 0.5
          });
        }
      },
      a024: {
        name: "节奏感",
        detail: "本场战斗中\n每使用一张通式\n回复5生命值",
        cost: 3,
        interim: true,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("rhythm");
        }
      },
      a025: {
        name: "魔豆",
        detail: "每回合回复4生命\n获得2额外灵力\n持续3回合",
        cost: 1,
        interim: true,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("magic_bean", 3);
        }
      },
      a026: {
        name: "以血为刃",
        detail: "造成伤害时\n伤害+8，生命值-4\n持续一回合",
        cost: 2,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("blood_blade", 1);
        }
      },
      a012: {
        name: "傲慢",
        detail: "抽一张随机通式\n获得2额外灵力",
        cost: 0,
        handle: function (Admin, Target) {
          Admin.handcard.insert.toHolds(Object.keys(basecard).rd()[0]);
          Admin.role.power.of(0).add(2);
        }
      },
      a013: {
        name: "强欲",
        detail: "抽两张牌",
        cost: 2,
        handle: function (Admin, Target) {
          Admin.handcard.draw.amount(2).fromLeft();
        }
      },
      a014: {
        name: "暴怒",
        detail: "丢弃一张符卡\n普攻伤害+30%\n持续一回合",
        cost: 2,
        handle: function (Admin, Target) {
          let source = Admin.handcard.getHolds().filter(c => c.type == "spellcard");
          if (source.length > 0) {
            Admin.handcard.abandon.type("spellcard").amount(1).fromHolds();
            Admin.role.buff.of(0).add("wrath");
          }
          else msg({ content: "符卡数量不足" });
        }
      },
      a015: {
        name: "暴食",
        detail: "获得额外灵力至上限\n最高20点",
        cost: 2,
        interim: true,
        handle: function (Admin, Target) {
          Admin.role.power.of(0).add(20);
        }
      },
      a016: {
        name: "色欲",
        detail: "指定目标下次行动为造成15%最大生命值的伤害",
        cost: 2,
        aim: true,
        handle: function (Admin, Target) {
          Admin.enermy.buff.of(Target).add("lust");
        }
      },
      a018: {
        name: "怠惰",
        detail: "造成和上一张打出的牌同样的效果，对自身无效",
        cost: 2,
        handle: function (Admin, Target) {
          let last_card = Admin.cache["last_card"];
          if (last_card) {
            if (last_card in basecard) basecard[last_card].handle(Admin, Admin.cache["last_target"]);
            else spellcard$1[last_card].handle(Admin, Admin.cache["last_target"]);
          }
          else msg({ content: "你还一张牌都没打过" });
        }
      },
      a019: {
        name: "嫉妒",
        detail: "丢弃所有手牌\n抽取等量手牌",
        cost: 2,
        handle: function (Admin, Target) {
          let amount = Admin.handcard.getHolds().length;
          Admin.handcard.abandon.amount(amount - 1).fromHolds();
          Admin.handcard.draw.amount(amount).fromLeft();
        }
      },
      a000: {
        name: "谦逊",
        detail: "通式灵力消耗-1\n持续一回合",
        cost: 1,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).add("humility");
        }
      },
      a005: {
        name: "贞洁",
        detail: "驱散自身随机负面效果\n回复8生命",
        cost: 2,
        handle: function (Admin, Target) {
          let buff = Admin.role.buff.of(0).getAll();
          let target = Object.keys(buff).filter(b => !buff[b].positive).rd()[0];
          Admin.role.buff.of(0).clear(target);
          Admin.role.heal.target(0).by({
            type: "static",
            value: 8
          });
        }
      },
      a010: {
        name: "慷慨",
        detail: "丢弃一张牌\n抽两张牌",
        cost: 0,
        handle: function (Admin, Target) {
          Admin.handcard.abandon.amount(1).fromHolds();
          Admin.handcard.draw.amount(2).fromLeft();
        }
      },
      a011: {
        name: "耐心",
        detail: "每使用一张通式\n符卡伤害+20%\n持续一回合",
        cost: 2,
        handle: function (Admin, Target) {
          Admin.cache["patience"] = true;
        }
      },
      a020: {
        name: "宽容",
        detail: "从弃牌堆中抽两张牌\n获得2额外灵力",
        cost: 3,
        handle: function (Admin, Target) {
          Admin.handcard.draw.amount(2).fromUsed();
          Admin.role.power.of(0).add(2);
        }
      },
      a027: {
        name: "节制",
        detail: "失去所有灵力\n下回合获得双倍\n额外灵力",
        cost: 0,
        interim: true,
        handle: function (Admin, Target) {
          let amount = Admin.role.power.of(0).get();
          Admin.role.power.of(0).clear();
          Admin.role.buff.of(0).add("charging", amount * 2);
        }
      },
      a028: {
        name: "勤奋",
        detail: "手牌灵力消耗+2\n效果翻倍\n持续一回合",
        cost: 1,
        handle: function (Admin, Target) {
          Admin.role.buff.of(0).set("diligence", 1);
        }
      },
      a029: {
        name: "散华之箭",
        detail: "造成10穿透伤害\n目标每有1种负面效果，伤害次数+1",
        cost: 2,
        aim: true,
        handle: function (Admin, Target) {
          let amount = Admin.enermy.buff.of(Target).count(false);
          Admin.enermy.damage.target(Target).source("basecard").by({
            type: "static",
            value: 10,
            penetrate: true,
            amount: 1 + amount
          });
        }
      },
    };

    for (let c in basecard) {
      basecard[c].type = "basecard";
      basecard[c].role = "base";
    }

    /**
     * @param {object} Data 简单来说，玩家面板
     * @param {object} info 独有的环境变量
     * @param {object} role 与角色有关的操作
     * @param {object} enermy 与敌人有关的操作
     */

    var sector = {
      battleOnload: (Admin, info) => {
        /**
         * @todo 整场战斗初始化时
         * @param {number} equipmentLimit 本场战斗中装备的剩余使用次数
         */
        Admin.role.collection.link("philosophers_stone").to(amount => {
          info.equipmentLimit += amount;
        });
        Admin.role.souvenir.link("ahabs_opinion").to(_ => {
          let state = Admin.role.state.of(0).get();
          Admin.role.state.of(0).set("health", state.health * 0.7);
          Admin.role.state.of(0).set("Health", state.health * 0.7);
        });
        // 初始化统计
        Admin.statistics.resetRoundData();
      },
      roleOnload: (Admin, info) => {
        /**
         * @todo 角色信息初始化时，也可以说是战斗开始时，
         * @param {number} exPowerLimit 额外灵力上限，默认等于牌库总牌数
         */
        Admin.role.collection.link("paper_windmill").to(amount => {
          Admin.role.state.of(0).set("power", Admin.role.state.of(0).get().power + amount);
          Admin.role.power.of(0).reset();
          info.exPowerLimit += amount;
        });
        Admin.role.collection.link("seal_needle").to(_ => {
          Admin.role.buff.of(0).set("seal_needle", 8);
        });
        Admin.role.souvenir.link("ahab's_opinion").to(_ => {
          let h = Math.floor(Admin.role.state.of(0).get().health * 0.7);
          Admin.role.state.of(0).set("health", h);
          Admin.role.state.of(0).set("Health", h);
        });
        Admin.role.collection.link("frozen_frog").to(amount => {
          Admin.role.buff.of(0).set("baka", amount);
        });
      },
      enermyOnload: (Admin, info) => {
        /**
         * @todo 敌人信息初始化时，比角色信息初始化要慢一些些
         * @param {Array} enermys 都出场了些什么敌人，是一个key数组
         */
      },
      probability: (Admin, info) => {
        /**
         * @todo 在进行概率判定的时候，默认将true对应好的结果
         * @param {number} probability 初始概率，0~1
         */
        if (Admin.data.role == "reimu") {
          info.probability = 1 - Math.pow(1 - info.probability, 2);
        }
        Admin.role.collection.link("ace").to(amount => {
          info.probability = 1 - Math.pow(1 - info.probability, amount + 1);
        });
        Admin.role.buff.of(0).link("strong_luck").to(_ => {
          info.probability = 1;
        });
      },
      roleStateGet: (Admin, info) => {
        /**
         * @todo 在获取角色面板的时候，和角色属性有关的加成都要走这里，速度加成那些就在这里加好了，加上也不会影响初始值
         * @param {object} state 角色面板的拷贝，包含speed、health、power等
         * @param {target} number 获取的谁的面板
         */
        Admin.role.buff.of(info.target).link("tardy").to(amount => {
          info.state.speed *= Math.pow(0.95, amount);
        });

        Admin.role.collection.link("corvis_feathers").to(amount => {
          if (Object.keys(Admin.role.buff.of(0).getAll()).length >= 2)
            info.state.speed += amount * 0.1;
        });
        Admin.role.collection.link("burning_seashore_flower").to(amount => {
          info.state.speed += amount * 0.01 * Math.floor((1 - info.state.Health / info.state.health) * 100);
        });
        Admin.role.collection.link("flip_flops").to(amount => {
          let exPower = Admin.role.power.of(0).getExPower();
          info.state.speed += amount * 0.2 * exPower;
        });

        Admin.role.buff.of(info.target).link("baka").to(amount => {
          info.state.speed += amount * 0.25;
        });
        Admin.role.buff.of(info.target).link("accelerate").to(amount => {
          info.state.speed += amount * 0.1;
        });
      },
      enermyStateGet: (Admin, info) => {
        /**
         * @todo 在获取敌人面板的时候，和敌人属性有关的加成都要走这里，速度加成那些就在这里加好了，加上也不会影响初始值
         * @param {object} state 角色面板的拷贝，包含speed、health、attack等
         * @param {number} target 获取的谁的面板
         */
        Admin.enermy.buff.of(info.target).link("tardy").to(amount => {
          info.state.speed *= Math.pow(0.95, amount);
        });
        Admin.enermy.buff.of(info.target).link("accelerate").to(amount => {
          info.state.speed += amount * 0.1;
        });
      },
      roleBuffGet: (Admin, info) => {
        /**
         * @todo 获取角色buff的时候，包括link.to和buff.get，在buff触发事件之前
         * @param {number} amount 该buff的层数
         * @param {number} target 谁的buff要结算
         * @param {object} buff 结算什么buff
         */
        Admin.role.collection.link("fish_stone").to(amount => {
          if (!info.buff.positive)
            info.amount -= amount;
        });
      },
      handcardOnload: (Admin, info) => {
        /**
         * @todo 手牌系统初始化时，在战斗中第一次抽牌之前
         * @param {number} limit 默认手牌上限，默认为4
         * @param {object} handcards 自己的牌库
         */
        Admin.role.souvenir.link("wanderlust").to(_ => info.limit = 3);
        Admin.role.collection.link("patchoulis_ribbon").to(amount => {
          let cards = Admin.handcard.getAll();
          let cost = cards.map(card => card.cost);
          let max = Math.max(...cost);
          let results = cards.filter(card => card.cost == max);
          let key = results.rd()[0].key;
          Admin.handcard.setCost.byKey(key, -Math.min(max, amount));
        });
      },
      roleRoundStart: (Admin, info) => {
        /**
         * @todo 角色的回合开始的时候，还没回复自然灵力也还没抽牌
         * @param {bool} powerReset 是否要回复自然灵力
         * @param {number} offset 回复自然灵力时值的偏移，很显然，这个偏移只能为负
         * @param {bool} handcardRefresh 是否要进行回合初的抽牌
         * @param {Array} interimBuff 每回合初要清除的buff，还没清除
         * @param {Array} decreaseBuff 每回合初要递减的buff，还没递减
         */
        let state = Admin.role.state.of(0).get();
        // 优先级高
        Admin.data.role == "marisa" && Admin.role.power.of(0).add(4);
        if (Admin.cache["open_universe"]) {
          Admin.role.buff.of(0).add("insulation");
          delete Admin.cache["open_universe"];
          info.powerReset = false;
        }
        if (Admin.cache["super_perseids"]) {
          Admin.role.buff.of(0).add("strength", Admin.cache["super_perseids"] - 1);
          delete Admin.cache["super_perseids"];
        }
        if (Admin.cache["escape_velocity"]) {
          Admin.role.buff.of(0).add("accelerate", 6);
        }
        delete Admin.cache["patience"];
        // 收藏品部分
        Admin.role.collection.link("terrible_ring").to(amount => {
          Admin.role.buff.of(0).set("slow_power", Admin.role.event.round.count * amount);
        });
        // 下面是buff的部分
        Admin.role.buff.of(0).link("pure_happy").to(amount => {
          Admin.enermy.damage.targetAll().source("spellcard").by({
            type: "static",
            value: amount,
            penetrate: true
          });
        });
        Admin.role.buff.of(0).link("burning").to(amount => {
          Admin.role.state.of(0).set("Health", Admin.role.state.of(0).get().Health * (1 - 0.03 * amount));
        });
        Admin.role.buff.of(0).link("orrerys_sun").to(_ => {
          Admin.role.buff.of(0).clear("orrerys_sun");
          Admin.cache["orrerys_sun"].forEach(unit => {
            unit.damage.value *= 1.2;
            unit.damage.amount = 1;
            Admin.enermy.damage.target(unit.target).source("spellcard").by(unit.damage);
          });
          delete Admin.cache["orrerys_sun"];
        });
        Admin.role.buff.of(0).link("hypodynamic").to(_ => {
          info.powerReset = false;
          Admin.role.power.of(0).clear();
        });
        Admin.role.buff.of(0).link("in_treatment").to(amount => {
          Admin.role.heal.target(0).by({
            type: "static",
            value: Admin.role.state.of(0).get().Health * amount * 0.05
          });
        });
        Admin.role.buff.of(0).link("magic_bean").to(_ => {
          Admin.role.power.of(0).add(2);
          Admin.role.heal.target(0).by({
            type: "static",
            value: 4
          });
        });
        Admin.role.buff.of(0).link("charging").to(amount => {
          Admin.role.power.of(0).add(amount);
        });
        Admin.role.buff.of(0).link("tired").to(amount => {
          info.offset -= amount;
        });
        Admin.role.buff.of(0).link("bleed").to(amount => {
          Admin.role.damage.target(0).by({
            type: "static",
            value: amount,
            final: true
          });
        });
        Admin.role.buff.of(0).link("spirit_poison").to(amount => {
          Admin.role.damage.target(0).by({
            type: "static",
            value: state.Health * 0.05 * amount,
            final: true
          });
          Admin.role.buff.of(0).add("trance", amount);
        });
        Admin.role.buff.of(0).link("waiting_pearl").to(_ => {
          Admin.role.buff.of(0).add("pure_happy", 12);
          Admin.handcard.draw.amount(2).fromLeft();
        });
        Admin.role.event.round.count > 1 && Admin.role.buff.of(0).clear("baka", 1);
        // 纪念品
        Admin.role.souvenir.link("wanderlust").to(_ => {
          let speed = Admin.role.state.of(0).get().speed;
          Admin.role.power.of(0).add(Math.ceil(speed));
        });
        // 统计
        Admin.statistics.saveRoundData();
        Admin.statistics.resetRoundData();
      },
      handcardRefresh: (Admin, info) => {
        /**
         * @todo 回合初刷新手牌时
         * @param {number} holdLimit 经速度比较调整后的手牌上限，最终值
         * @param {Array} handcards 自己的牌库，装的是牌的key
         * @param {Array} hold 显而易见，是当前手牌们
         * @param {Array} ex 额外加入的牌，格式为牌的key
         * @param {number} drawLimit 能抽的上限，其实也就是牌库剩余的牌数
         * @param {number} drawAmount 打算抽多少张
         */
        Admin.role.souvenir.link("wanderlust").to(_ => info.holdLimit = 4);
        Admin.role.equipment.link("repentance_rod").to(_ => {
          if (info.drawAmount >= info.drawLimit)
            Admin.role.power.of(0).add(info.drawAmount);
        });
        Admin.role.collection.link("blade_of_yellow_spring").to(amount => {
          info.drawLimit += amount;
        });
      },
      handcardLeftReset: (Admin, info) => {
        /**
         * @todo 牌堆被抽完的时候，将牌库洗进牌堆，在手牌系统初始化完成后也会发生一次，这次也是在第一次抽牌前
         * @param {object} res 牌库的原生复制，还未打乱顺序
         */
      },
      afterRoleRoundStart: (Admin, info) => {
        /**
         * @todo 角色回合开始时的各种事件全部触发完后，就算手再快也还没打出第一张牌！
         * @param {object} null 暂时还没有环境变量
         */
        Admin.role.collection.link("blade_of_yellow_spring").to(amount => {
          Admin.handcard.insert.interim(true).amount(amount).toHolds(Admin.data.role);
        });
      },
      beforePowerCost: (Admin, info) => {
        /**
         * @todo 打出卡时进行卡消耗的计算，在扣除之前
         * @param {string} card 卡的名字
         * @param {number} cost 卡的消耗，默认是1或3
         */
        Admin.role.buff.of(0).link("throttle").to(amount => {
          info.cost = Math.max(0, info.cost - amount);
        });
        Admin.role.buff.of(0).link("diligence").to(_ => {
          info.cost += 2;
        });
        Admin.role.buff.of(0).link("humility").to(amount => {
          if (info.card.type == "basecard") info.cost -= amount;
        });
        // 为了让这个镜子更强，放最后结算
        Admin.role.equipment.link("mirror_of_pear").to(_ => {
          if (info.card.key == Admin.data.role) info.cost = 0;
        });
        // 这个挂件理所应当是放最最后的，不过还是优先于灵梦的被动
        Admin.role.souvenir.link("mimicry_cat_pendant").to(_ => {
          Admin.cache["mimicry_cat_pendant"] = info.cost;
          info.cost = 0;
        });
        if (Admin.data.role == "reimu") {
          if (Admin.role.power.of(0).get() < info.cost) {
            Admin.cache["reimu_cost"] = info.cost - Admin.role.power.of(0).get();
            info.cost = Admin.role.power.of(0).get();
          }
        }
        if (info.card.key == "r013") {
          if (!Admin.cache["pure_happy_cost"]) Admin.cache["pure_happy_cost"] = 1;
          if (Admin.role.buff.of(0).get("pure_happy") < Admin.cache["pure_happy_cost"]) {
            info.valid = false;
          }
        }
        if (info.card.key == "a021") {
          if (Admin.handcard.getHolds().length <= 1) {
            info.valid = false;
          }
        }
        if (info.card.key == "a014") {
          let source = Admin.handcard.getHolds().filter(c => c.type == "spellcard");
          if (source.length == 0) {
            info.valid = false;
          }
        }
        if (info.card.key == "a010") {
          if (Admin.handcard.getHolds().length <= 1) {
            info.valid = false;
          }
        }
        if (info.card.key == "a018") {
          if (!Admin.cache["last_card"] || Admin.cache["last_card"] == "a018") {
            info.valid = false;
          }
        }
        // 统计
        Admin.cache["round_cost_total"] += info.cost;
      },
      punchCard: (Admin, info) => {
        /**
         * @todo 打出牌时，也是结算灵力之后
         * @param {number} cost 卡的最终消耗
         * @param {number} target 对着哪个目标用的
         * @param {string} type 卡的类型，spellcard、basecard、normal_attack
         * @param {object} card 卡的详情，包含key、role、index、name、detail、cost、interim、aim等
         * @param {bool} valid 这张卡要不要生效
         */
        if (Admin.data.role == "reimu") {
          if (Admin.cache["reimu_cost"]) {
            let state = Admin.role.state.of(0).get();
            Admin.role.state.of(0).set("health", state.health - Admin.cache["reimu_cost"] * 2);
          }
        }
        Admin.role.souvenir.link("mimicry_cat_pendant").to(_ => {
          Admin.role.state.of(0).set("Health", Admin.role.state.of(0).get().Health * (1 - 0.1 * Admin.cache["mimicry_cat_pendant"]));
        });
        if (Admin.data.role == "youmu") {
          Admin.role.buff.of(0).add("telepathism", info.cost);
        }
        Admin.role.collection.link("shy_rabbit").to(amount => {
          if (!Admin.cache["shy_rabbit"]) Admin.cache["shy_rabbit"] = 1;
          else Admin.cache["shy_rabbit"]++;
          if (Admin.cache["shy_rabbit"] == 2) {
            Admin.role.buff.of(0).add("shy_rabbit", amount);
          }
          if (Admin.cache["shy_rabbit"] == 3) {
            Admin.role.buff.of(0).clear("shy_rabbit");
          }
          if (Admin.cache["shy_rabbit"] == 4) {
            Admin.cache["shy_rabbit"] = 1;
          }
        });
        Admin.role.collection.link("seal_needle").to(_ => {
          if (!Admin.role.buff.of(0).get("seal_needle"))
            Admin.battle.effect.targetEnermy(0).by(_ => {
              Admin.role.buff.of(0).set("seal_needle", 8);
            });
        });
        Admin.role.collection.link("light_bulb").to(amount => {
          let power = Admin.role.power.of(0).get();
          if (power < amount && power + info.cost >= amount)
            Admin.handcard.draw.amount(1).fromLeft();
        });
        if (info.type == "spellcard") {
          // 打出了一张符卡
          if (Admin.cache["super_perseids"]) {
            Admin.cache["super_perseids"]++;
          }
          Admin.role.equipment.link("circular_fan").to(_ => {
            Admin.handcard.insert.interim(true).toHolds(Admin.data.role);
          });
        }
        if (info.type == "basecard") {
          // 打出了一张通式
          Admin.role.buff.of(0).link("rhythm").to(amount => {
            Admin.role.heal.target(0).by({
              type: "static",
              value: 5 * amount
            });
          });
          if (Admin.cache["patience"]) {
            Admin.role.buff.of(0).add("focus", 2);
          }
        }
        if (Admin.cache["pulsar_star"]) {
          if (Admin.cache["pulsar_star"] == 2) {
            Admin.cache["pulsar_star"]--;
          }
          else {
            Admin.handcard.insert.interim(true).toHolds(info.card.key);
            delete Admin.cache["pulsar_star"];
          }
        }
        Admin.role.buff.of(0).link("diligence").to(_ => {
          info.card.handle(Admin, info.target);
        });
        if (Admin.cache["magic_link"]) {
          info.valid = false;
          Admin.role.heal.target(0).by({
            type: "static",
            value: 8
          });
          Admin.role.buff.of(0).add("pure_happy", 6);
        }
        // 统计
        Admin.cache["round_punch_count"]++;
        if (info.card.interim) Admin.cache["round_expend_count"]++;
      },
      rolePowerAdd: (Admin, info) => {
        /**
         * @todo 获得额外灵力的时候，发生在实际获得额外灵力之前
         * @param {number} amount 获得额外灵力的数值
         */

        //最后触发
        Admin.role.buff.of(0).link("insulation").to(_ => info.amount = 0);
      },
      enermyDamagedProcess: (Admin, info) => {
        /**
         * @todo 敌人受到伤害的时候，在进行实际扣除和显示之前
         * @param {object} damage 伤害输入，包含type类型value值，可选indirect间接amount值blocked被阻挡miss被闪避
         * @param {number} target 伤害的目标
         * @param {string} source 伤害的来源，spellcard、collection等
         */
        if (!info.damage.final && info.damage.value > 0) {
          //开始烹饪！
          if (info.source) {
            // 有来源的伤害，也就是角色造成的伤害
            Admin.role.buff.of(0).link("orrerys_sun").to(_ => {
              if (!Admin.cache["orrerys_sun"]) Admin.cache["orrerys_sun"] = [];
              if (!info.damage.indirect) {
                info.damage.indirect = true;
                info.damage.orrerys_sun = true;
              }
            });
            Admin.role.buff.of(0).link("milky_way").to(amount => {
              info.damage.value += amount;
            });
            Admin.role.buff.of(0).link("blood_blade").to(_ => {
              info.damage.value += 8;
              Admin.role.damage.target(0).source("basecard").by({
                type: "static",
                value: 4
              });
            });
            // 初始暴击率和暴击伤害
            let criticalChance = 0.05,
              criticalDamage = 0.5;
            // 暴击和暴伤处理部分
            Admin.role.collection.link("fluorescent_zanthoxylum").to(amount => {
              criticalChance += 0.05 * amount;
            });
            Admin.role.collection.link("burning_seashore_flower").to(amount => {
              let state = Admin.role.state.of(0).get();
              criticalChance += amount * 0.002 * Math.floor((1 - state.Health / state.health) * 100);
            });
            Admin.role.collection.link("human_soul_lamp").to(amount => {
              criticalDamage += 0.6 * amount;
            });
            Admin.role.buff.of(0).link("slow_power").to(amount => {
              criticalChance += amount * 0.04;
            });
            Admin.role.buff.of(0).link("marisa_time").to(amount => {
              criticalChance += 0.3;
            });
            Admin.role.buff.of(0).link("grand_cross").to(_ => {
              criticalDamage += 1;
            });
            if (Admin.data.role == "youmu") {
              criticalDamage += criticalChance;
              criticalChance = 0;
            }
            let critical = Admin.probability(criticalChance);
            // 间接伤害不能暴击
            if (info.damage.indirect) critical = false;
            // 判定是否暴击，有两个判定，第一个是自然判定，第二个是强制暴击
            if (critical || info.damage.critical) {
              // 暴击触发的事件
              info.damage.critical = true;
              info.damage.value *= 1 + criticalDamage;
              Admin.role.collection.link("free_eagle").to(amount => {
                if (Admin.cache["free_eagle"]) {
                  Admin.cache["free_eagle"] = false;
                  Admin.role.buff.of(0).clear(false, amount);
                }
                else Admin.cache["free_eagle"] = true;
              });
            }
            else {
              // 显而易见，是不暴击触发的事件
              if (info.damage["undifferentiated_subduction"]) {
                Admin.role.buff.of(0).add("pure_happy", 8);
              }
            }
            // 这里是派生类，如果放在烹饪环节后面就会走两遍烹饪，间接伤害都暴击给你看哦！
            Admin.role.collection.link("bronze_mirror").to(amount => {
              if (!info.damage.bronze_mirror)
                if (Admin.probability(0.25)) {
                  Admin.enermy.damage.except(info.target).random().from(0).source("collection").by({
                    type: "scale",
                    value: 0.3 * amount * info.damage.value,
                    indirect: true,
                    bronze_mirror: true
                  });
                }
            });
            Admin.role.collection.link("ice_scale").to(amount => {
              if (Admin.probability(amount * 0.1))
                Admin.enermy.buff.of(info.target).add("tardy", 1);
            });
            Admin.role.collection.link("skyrocket").to(amount => {
              if (Admin.probability(0.3) && info.source == "normal_attack") {
                Admin.enermy.damage.target(info.target).source("collection").by({
                  type: "static",
                  value: info.damage.value * 0.4,
                  indirect: true
                });
                Admin.role.power.of(0).add(amount);
              }
            });
            Admin.role.collection.link("seal_needle").to(amount => {
              if (!Admin.role.buff.of(0).get("seal_needle")) {
                Admin.enermy.buff.of(info.target).add("bleed", amount);
              }
            });
            Admin.role.collection.link("JupiterACL300").to(amount => {
              if (!info.damage.indirect) {
                let survivor = Admin.enermy.survival(),
                  index_of_origin_in_survivor = survivor.indexOf(info.target),
                  targets_in_survivor = [index_of_origin_in_survivor - 1, index_of_origin_in_survivor + 1];
                if (index_of_origin_in_survivor == survivor.length - 1)
                  targets_in_survivor.pop();
                if (index_of_origin_in_survivor == 0)
                  targets_in_survivor.shift();
                if (targets_in_survivor.length > 0) {
                  let targets = targets_in_survivor.map(index => survivor[index]);
                  Admin.enermy.damage.targetMuti(targets).source("collection").by({
                    type: "static",
                    value: info.damage.value * amount * 0.25,
                    indirect: true
                  });
                }
              }
            });
            Admin.role.buff.of(0).link("test_slave").to(amount => {
              let damage = info.damage.value * 0.25 * amount;
              if (!Admin.cache["test_slave"]) Admin.cache["test_slave"] = [];
              Admin.cache["test_slave"].push(damage);
              info.damage.value -= damage;
            });
            Admin.role.buff.of(0).link("font_safe").to(_ => {
              Admin.role.heal.target(0).by({
                type: "static",
                value: 5
              });
              Admin.role.buff.of(0).add("trance", 2);
            });
            if (Admin.cache["koakuma"]) {
              if (Admin.cache["koakuma"][info.target]) {
                Admin.role.damage.target(0).from(info.target).by({
                  type: "static",
                  value: info.damage.value
                });
              }
            }
            // 然后是道具等的各个烹饪环节，都是独立乘区，排序不分先后
            Admin.role.collection.link("portable_money_box").to(amount => {
              info.damage.value *= (1 + amount * 0.05 * Math.floor(Admin.data.coin / 250));
            });
            Admin.role.collection.link("compass_cat").to(amount => {
              if (Admin.enermy.state.of(info.target).get().speed < Admin.role.state.of(0).get().speed)
                info.damage.value *= 1 + amount * 0.1;
            });
            Admin.role.collection.link("sundial").to(amount => {
              if (info.damage.indirect)
                info.damage.value *= 1 + amount * 0.1;
            });
            Admin.role.collection.link("pickled_radish").to(amount => {
              let state = Admin.role.state.of(0).get();
              if (state.Health / state.health > 0.9)
                info.damage.value *= 1 + amount * 0.1;
            });
            Admin.role.collection.link("false_hammer").to(amount => {
              if (Admin.enermy.info.of(info.target).get().type == "normal")
                info.damage.value *= 1 + amount * 0.1;
            });
            Admin.role.collection.link("shy_rabbit").to(amount => {
              if (Admin.cache["shy_rabbit"] == 3)
                info.damage.value *= 1 + amount * 0.1;
            });
            Admin.role.collection.link("midnight_cloak").to(amount => {
              let state = Admin.enermy.state.of(info.target).get();
              if (state.Health / state.health < 0.5)
                info.damage.value *= 1 + amount * 0.1;
            });
            // buff
            Admin.role.buff.of(0).link("focus").to(amount => {
              if (info.source == "spellcard")
                info.damage.value *= 1 + amount * 0.2;
            });
            Admin.role.buff.of(0).link("weak").to(amount => {
              info.damage.value *= 1 - amount * 0.1;
            });
            Admin.role.buff.of(0).link("strength").to(amount => {
              info.damage.value *= 1 + amount * 0.1;
            });
            Admin.role.buff.of(0).link("interim_strength").to(amount => {
              info.damage.value *= 1 + amount * 0.1;
            });
            Admin.role.buff.of(0).link("wrath").to(amount => {
              if (info.source == "normal_attack") {
                info.damage.value *= 1 + 0.3 * amount;
              }
            });
            // 装备
            Admin.role.equipment.link("sword_of_feixiang").to(_ => {
              let count = Admin.enermy.buff.of(info.target).count(false);
              if (count > 0) info.damage.value *= 1.4;
            });
          }
          // 并非角色触发，而是敌人自带
          Admin.enermy.buff.of(info.target).link("fragile").to(amount => {
            info.damage.value *= 1 + amount * 0.1;
          });
          Admin.enermy.buff.of(info.target).link("exposure").to(_ => {
            info.damage.penetrate = true;
          });
          Admin.enermy.buff.of(info.target).link("iron_skin").to(amount => {
            info.damage.value *= 1 - 0.1 * amount;
          });
          // 可被穿透的减伤
          if (!info.damage.penetrate) {
            // 阻挡伤害
            Admin.enermy.buff.of(info.target).link("natral_protect").to(_ => {
              info.damage.value = 5;
              Admin.role.buff.of(0).add("bleed", 2);
            });
            Admin.enermy.buff.of(info.target).link("interim_barrier").to(amount => {
              if (amount < info.damage.value) {
                info.damage.value -= amount;
                Admin.enermy.buff.of(info.target).clear("interim_barrier");
              }
              else {
                Admin.enermy.buff.of(info.target).clear("interim_barrier", Math.ceil(info.damage.value));
                info.damage.value = 0;
              }
            });
            Admin.enermy.buff.of(info.target).link("barrier").to(amount => {
              if (amount < info.damage.value) {
                info.damage.value -= amount;
                Admin.enermy.buff.of(0).clear("barrier");
              }
              else {
                Admin.enermy.buff.of(0).clear("barrier", Math.ceil(info.damage.value));
                info.damage.value = 0;
              }
            });
            Admin.enermy.buff.of(info.target).link("qianzhidun").to(amount => {
              if (info.damage.value < amount / 2) info.damage.value /= 2;
              if (amount < info.damage.value) {
                info.damage.value -= amount;
                Admin.enermy.buff.of(info.target).clear("qianzhidun");
              }
              else {
                Admin.enermy.buff.of(info.target).clear("qianzhidun", Math.ceil(info.damage.value));
                info.damage.value = 0;
              }
            });
            // 闪避伤害
            Admin.enermy.buff.of(info.target).link("foresee").to(_ => {
              info.damage.miss = true;
            });
          }
          // 阻挡判定
          if (info.damage.value <= 0) info.damage.blocked = true;
          // 烹饪完就是最终伤害了
          info.damage.final = true;
          // 命中率相关
          if (!info.damage.penetrate) {
            if (!info.damage.precision) info.damage.precision = 1;
            Admin.role.buff.of(0).link("trance").to(amount => {
              info.damage.precision *= 1 - 0.1 * amount;
            });
            Admin.enermy.buff.of(info.target).link("cautious").to(amount => {
              info.damage.precision *= 1 - 0.1 * amount;
            });
            if (!Admin.probability(info.damage.precision)) {
              info.damage.miss = true;
              if (info.damage["dream_seal"]) {
                Admin.role.buff.of(0).add("pure_happy", 5);
              }
              if (info.damage["ghost_breaker"]) {
                Admin.role.buff.of(0).add("interim_barrier", 12);
              }
            }
          }
          Admin.role.buff.of(0).link("orrerys_sun").to(amount => {
            if (info.damage.orrerys_sun) {
              for (let _ of Array(amount)) {
                Admin.cache["orrerys_sun"].push(deepCopy(info));
              }
              info.damage.blocked = true;
            }
          });
          // 必定致死伤害
          if (info.damage.fatal) {
            info.damage.value = Admin.enermy.state.of(info.target).get().Health;
            delete info.damage.miss;
            delete info.blocked;
          }
        }
        // 特殊
        if (Admin.cache["narumi"]) {
          // 矢田寺成美的判定必须放这，不然额外伤害是不过前面那一片的判定的。
          if (Admin.cache["narumi"][info.target]) {
            let count = Admin.cache["narumi"][info.target];
            let state = Admin.enermy.state.of(info.target).get();
            if (state.health > state.Health && info.damage.value >= state.Health) {
              Admin.cache["narumi"][info.target]++;
              let health = state.health * (1 - count * 0.2);
              Admin.enermy.state.of(info.target).set("health", health);
              Admin.enermy.state.of(info.target).set("Health", health);
              info.damage.blocked = true;
              Admin.enermy.buff.of(info.target).set("magic_life", count);
            }
          }
        }
        // 敌人确实受到伤害之后
        if (reallyDamaged(info.damage)) {
          if (info.source) {
            // 角色造成伤害
            Admin.role.collection.link("cursed_wind_chimes").to(amount => {
              if (info.damage.value > 50 - amount) {
                Admin.enermy.buff.of(info.target).clearAll();
              }
            });
            Admin.role.equipment.link("gongonier").to(_ => {
              if (info.damage.critical) {
                Admin.role.heal.target(0).from(0).by({
                  type: "static",
                  value: info.damage.value * 0.2
                });
              }        });
            Admin.role.buff.of(0).clear("seal_needle", 1);
            Admin.role.collection.link("vampires_old_tooth").to(amount => {
              if (Admin.enermy.buff.of(info.target).count(true) > 0)
                Admin.role.heal.target(0).by({
                  type: "static",
                  value: amount
                });
            });
            Admin.role.collection.link("earthy_spider_wine").to(amount => {
              if (info.source == "normal_attack")
                Admin.role.buff.of(0).set("focus", amount);
            });
            Admin.role.collection.link("bottle_of_stars").to(amount => {
              if (info.damage.value > 40) {
                Admin.enermy.buff.of(info.target).add("star", amount);
                if (!Admin.cache["bottle_of_stars"]) Admin.cache["bottle_of_stars"] = [];
                for (let i = 0; i < amount; i++)
                  Admin.cache["bottle_of_stars"].push({
                    target: info.target,
                    damage: info.damage.value * 0.4,
                  });
              }
            });
            if (info.damage.dragon_meteor) {
              let state = Admin.enermy.state.of(info.target).get();
              if (info.damage.dragon_meteor == 1) {
                if (state.Health <= info.damage.value) {
                  Admin.cache["dragon_meteor"] = true;
                  Admin.role.buff.of(0).add("interim_strength", 5);
                }
              }
              if (info.damage.dragon_meteor == 2) {
                if (Admin.cache["dragon_meteor"]) {
                  delete Admin.cache["dragon_meteor"];
                } else if (state.Health <= info.damage.value) {
                  Admin.role.buff.of(0).add("interim_strength", 5);
                }
              }
            }
            // 其它
            Admin.enermy.buff.of(info.target).link("poison_body").to(_ => {
              Admin.role.buff.of(0).add("spirit_poison", 1);
            });
            // 统计
            Admin.cache["round_damage_frequency"]++;
            Admin.cache["round_damage_total"] += info.damage.value;
            Admin.cache["round_max_damage"] = Math.max(info.damage.value, Admin.cache["round_max_damage"]);
          }
          Admin.role.collection.link("crown_of_thorns").to(amount => {
            if (Admin.battle.round.get() == false)
              Admin.enermy.buff.of(info.target).add("fragile", amount);
          });
        }
      },
      roleHealProcess: (Admin, info) => {
        /**
         * @todo 角色受到的治疗，不知道要不要区分来源，兴许以后会有将伤害转化为治疗的东西
         * @param {object} heal 治疗，包含type类型value值
         * @param {number} target 谁被治疗
         */
        // 烹饪环节
        Admin.role.collection.link("sakura_tea").to(amount => {
          info.heal.value *= 1 + amount * 0.1;
        });
        Admin.role.collection.link("water_joke").to(_ => {
          let value = info.heal.value;
          Admin.role.damage.target(0).by({
            type: "static",
            value: value
          });
          info.heal.value = 0;
        });
        // 烹饪完后得出最终治疗量
        let state = Admin.role.state.of(0).get();
        //过量治疗量
        let overHeal = info.heal.value + state.Health - state.health;
        Admin.role.collection.link("sticking_plaster").to(amount => {
          if (overHeal > 0) {
            let value = Math.floor(amount * 0.2 * overHeal);
            Admin.role.buff.of(0).add("interim_barrier", value);
          }
        });
      },
      useEquipment: function (Admin, info) {
        /**
         * @todo 使用主动装备时，主动装备是独立的事件，而这边的东西偏向于过程中的变数，所以就单独放equipment.js了
         */
        Admin.role.collection.link("toolbox").to(amount => {
          if (Admin.probability(amount * 0.2))
            this.defeatEnermy(Admin);
        });
      },
      useSouvenir: function (Admin, info) {
        /**
         * @todo 使用消耗品时，消耗品的效果是独立的事件，而这边的东西偏向于过程中的变数，所以就单独放souvenir.js了
         */
        Admin.role.collection.link("toolbox").to(amount => {
          if (Admin.probability(amount * 0.2))
            this.defeatEnermy(Admin);
        });
      },
      drawCard: (Admin, info) => {
        /**
         * @todo 全局的抽牌时触发，包括回合初的自然抽牌和一些牌自带的抽牌，如果是回合初的自然抽牌，请转到handcardRefresh，对了，发生在开始抽牌之前
         * @param {number} holdLimit 手牌上限
         * @param {number} amount 抽牌数
         * @param {number} drawLimit 牌库剩余牌的数量，也就是抽牌上限
         */
        Admin.role.collection.link("shimenawa").to(amount => {
          if (Admin.probability(0.25 * amount))
            Admin.battle.equipment.left.add(1);
        });
        Admin.role.equipment.link("repentance_rod").to(_ => {
          if (info.amount >= info.drawLimit)
            Admin.role.power.of(0).add(info.amount);
        });
      },
      defeatEnermy: (Admin, info) => {
        /**
         * @todo 击败敌人后触发的事件，这个结束后才会看是不是打完了
         * @param {object} damage 伤害输入，包含type类型value值，可选indirect间接amount值blocked被阻挡miss被闪避，是击败敌人的最后一击
         * @param {number} target 伤害的目标，也就是被击败的敌人
         */
        Admin.role.collection.link("bird_wine").to(amount => {
          Admin.enermy.buff.addAll("burning", amount * 2);
        });
        Admin.role.collection.link("trolley").to(amount => {
          Admin.role.power.of(0).add(amount);
        });
      },
      roleRoundEnd: (Admin, info) => {
        /**
         * @todo 角色的回合结束时，目前没什么环境参数
         */
        Admin.role.collection.link("big_bugle").to(amount => {
          Admin.enermy.damage.targetAll().source("collection").by({
            type: "static",
            value: amount * 2,
            penetrate: true,
            indirect: true
          });
        });
        Admin.role.collection.link("ghost_lantern").to(amount => {
          let powerLeft = Admin.role.power.of(0).get();
          if (powerLeft > 0)
            Admin.role.buff.of(0).add("interim_barrier", amount * powerLeft);
        });
        Admin.role.buff.of(0).link("test_slave").to(_ => {
          if (!Admin.cache["test_slave"]) Admin.cache["test_slave"] = [];
          Admin.enermy.damage.targetAll().source("spellcard").by({
            type: "static",
            value: Admin.cache["test_slave"].sum()
          });
          delete Admin.cache["test_slave"];
          Admin.role.buff.of(0).clear("test_slave");
        });
        Admin.role.buff.of(0).link("blue_poison").to(amount => {
          Admin.role.damage.target(0).by({
            type: "static",
            value: amount,
            indirect: true
          });
        });
        Admin.role.souvenir.link("cerallins_bottle").to(_ => {
          let amount = Admin.handcard.getHolds().length;
          Admin.handcard.abandon.amount(amount).fromHolds();
          Admin.role.power.of(0).add(amount);
        });
      },
      enermyRoundStart: (Admin, info) => {
        /**
         * @todo 敌人的回合开始的时候
         * @param {number} target 具体哪个敌人的回合
         * @param {object} interimBuff 每回合初要清除的buff，还没清除
         * @param {object} decreaseBuff 每回合初要递减的buff，还没递减
         */
        let state = Admin.enermy.state.of(info.target).get();

        // 是小恶魔先来的
        if (Admin.cache["koakuma"]) {
          if (Admin.cache["koakuma"][info.target]) {
            Admin.enermy.buff.of(info.target).clear("iron_skin");
          }
        }

        Admin.enermy.buff.of(info.target).link("burning").to(amount => {
          Admin.enermy.damage.target(info.target).by({
            type: "static",
            value: state.health * 0.03 * amount,
            final: true
          });
        });
        Admin.enermy.buff.of(info.target).link("star").to(_ => {
          let stars = Admin.cache["bottle_of_stars"].filter(star => star.target == info.target);
          for (let star of stars) {
            Admin.enermy.damage.target(info.target).source("collection").by({
              type: "static",
              value: star.damage,
              indirect: true,
              final: true
            });
          }
          Admin.enermy.buff.of(info.target).clear("star");
          Admin.cache["bottle_of_stars"] = Admin.cache["bottle_of_stars"].filter(star => star.target != info.target);
        });
        Admin.enermy.buff.of(info.target).link("bleed").to(amount => {
          Admin.enermy.damage.target(info.target).by({
            type: "static",
            value: amount,
            final: true
          });
        });

        Admin.enermy.buff.of(info.target).clear("tardy", 1);
        Admin.enermy.buff.of(info.target).clear("fragile");
      },
      enermyAction: (Admin, info) => {
        /**
         * @todo 敌人将要开始行动的时候
         * @param {number} target 具体哪个敌人要行动
         * @param {object} index 这个行动是否有效，默认为true
         */
        Admin.enermy.buff.of(info.index).link("lust").to(_ => {
          info.valid = false;
          Admin.role.damage.target(0).from(info.index).by({
            type: "static",
            value: Admin.enermy.state.of(info.index).get().health * 0.2
          });
        });
        Admin.enermy.buff.of(info.index).link("trance_cage").to(_ => {
          info.valid = false;
          Admin.role.buff.of(0).add("trance", 3);
        });
      },
      roleDamagedProcess: (Admin, info) => {
        /**
         * @todo 角色受到伤害的时候，在进行实际扣除和显示之前
         * @param {object} damage 伤害输入，包含type类型value值，可选indirect间接amount值blocked被阻挡miss被闪避
         * @param {number} target 伤害的目标
         * @param {string} source 伤害的来源，spellcard、collection等
         * @param {number} from 如果是敌人造成的，是谁造成的
         */
        Admin.role.buff.of(0).link("exposure").to(_ => {
          info.damage.penetrate = true;
        });
        // 含羞草的结算还存疑，想要和其它道具配合又要符合一般结算思路，只能放第一个了
        Admin.role.collection.link("mimosa").to(amount => {
          let limit = Admin.role.state.of(0).get().health * 0.7 * Math.pow(0.95, amount - 1);
          info.damage.value = Math.min(info.damage.value, limit);
        });
        // 百分比减伤(或增伤)
        Admin.role.collection.link("amulet_of_full_moon").to(amount => {
          let count = Admin.role.buff.of(0).count(false);
          if (count >= 2) info.damage.value *= Math.pow(0.9, amount);
        });
        Admin.role.buff.of(0).link("iron_skin").to(amount => {
          info.damage.value *= 1 - 0.1 * amount;
        });
        Admin.role.buff.of(0).link("fragile").to(amount => {
          info.damage.value *= 1 + amount * 0.1;
        });
        Admin.role.souvenir.link("nodas_hat").to(_ => {
          let state = Admin.role.state.of(0).get();
          if (state.Health / state.health > 0.5) {
            info.damage.value *= 1.2;
          }
          if (state.Health / state.health < 0.5) {
            info.damage.value *= 0.7;
          }
        });
        if (typeof info.from == "number") {
          // 伤害来源自敌人
          Admin.enermy.buff.of(info.from).link("strength").to(amount => {
            info.damage.value *= 1 + amount * 0.1;
          });
          Admin.enermy.buff.of(info.from).link("interim_strength").to(amount => {
            info.damage.value *= 1 + amount * 0.1;
          });
        }
        // 固定减伤(或增伤)
        Admin.role.collection.link("conch_shell").to(amount => {
          info.damage.value -= amount;
        });
        if (!info.damage.penetrate) {
          // 阻挡伤害
          Admin.role.buff.of(0).link("interim_barrier").to(amount => {
            if (amount < info.damage.value) {
              info.damage.value -= amount;
              Admin.role.buff.of(0).clear("interim_barrier");
            }
            else {
              Admin.role.buff.of(0).clear("interim_barrier", Math.ceil(info.damage.value));
              info.damage.value = 0;
            }
          });
          Admin.role.buff.of(0).link("barrier").to(amount => {
            if (amount < info.damage.value) {
              info.damage.value -= amount;
              Admin.role.buff.of(0).clear("barrier");
            }
            else {
              Admin.role.buff.of(0).clear("barrier", Math.ceil(info.damage.value));
              info.damage.value = 0;
            }
          });
          Admin.role.souvenir.link("aokis_fish").to(_ => {
            if (Admin.probability(0.3)) {
              info.damage.blocked = true;
            }
            else {
              Admin.role.buff.of(0).add(["tired", "tardy", "fragile", "weak", "trance"].rd()[0]);
            }
          });
          // 闪避伤害
          Admin.role.buff.of(0).link("foresee").to(_ => {
            info.damage.miss = true;
          });
          Admin.role.buff.of(0).link("prophesy").to(_ => {
            info.damage.miss = true;
          });
        }
        if (info.damage.value <= 0) info.damage.blocked = true;
        // 烹饪结束
        info.damage.final = true;
        if (typeof info.from == "number") {
          // 敌人造成伤害
          if (!info.damage.penetrate) {
            // 命中率相关
            let base = 1;
            Admin.role.buff.of(0).link("hakurei_phantom").to(_ => {
              base *= 1 - 0.4;
            });
            Admin.enermy.buff.of(info.from).link("trance").to(amount => {
              base *= 1 - 0.1 * amount;
            });
            if (Admin.probability(1 - base)) {
              info.damage.miss = true;
              Admin.role.buff.of(0).link("hakurei_phantom").to(_ => {
                Admin.role.buff.of(0).add("pure_happy", 4);
              });
            }
          }
        }
        // 受到伤害后触发
        if (reallyDamaged(info.damage)) {
          Admin.role.collection.link("large_roll_of_bandages").to(amount => {
            Admin.role.buff.of(0).add("in_treatment", amount);
          });
          Admin.role.collection.link("sport_shoes").to(amount => {
            if (info.damage.value > (20 - amount)) {
              Admin.handcard.draw.amount(1).fromLeft();
              Admin.role.power.of(0).add(1);
            }
          });
          Admin.role.collection.link("red_and_white_scarf").to(amount => {
            let state = Admin.role.state.of(0).get();
            if (state.Health < info.damage.value)
              if (state.Health / state.health > 0.3 * Math.pow(0.9, amount - 1)) {
                info.damage.blocked = true;
                Admin.role.state.of(0).set("Health", 1);
              }
          });
          if (typeof info.from == "number") {
            // 受到敌人伤害之后
            Admin.role.collection.link("magic_dart").to(amount => {
              Admin.enermy.damage.target(info.from).source("collection").by({
                type: "static",
                value: amount * 0.2 * info.damage.value,
                indirect: true
              });
            });
          }
          Admin.role.buff.of(0).link("pure_happy").to(_ => {
            Admin.role.buff.of(0).clear("pure_happy", retain(info.damage.value - 2, 0));
          });
          // 统计
          Admin.cache["round_max_hurt"] = Math.max(info.damage.value, Admin.cache["round_max_hurt"]);
          Admin.cache["round_hurt_total"] += info.damage.value;
          Admin.cache["round_hurt_frequency"]++;
        }
      }
    };

    function reallyDamaged(damage) {
      return !damage.blocked && !damage.miss && damage.value > 0;
    }

    /* src\addon\card.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1$g } = globals;
    const file$D = "src\\addon\\card.svelte";

    function create_fragment$D(ctx) {
    	let div3;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let icon;
    	let icon_class_value;
    	let t1;
    	let txt0;

    	let t2_value = (/*cover*/ ctx[5]
    	? /*cover*/ ctx[5].name
    	: /*card*/ ctx[15][/*key*/ ctx[1]].name) + "";

    	let t2;
    	let t3;
    	let div0;
    	let txt1;
    	let t4_value = (/*cover*/ ctx[5] ? 0 : /*costFix*/ ctx[13]) + "";
    	let t4;
    	let div0_class_value;
    	let t5;
    	let div2;
    	let txt2;

    	let t6_value = (/*cover*/ ctx[5]
    	? /*cover*/ ctx[5].detail
    	: /*card*/ ctx[15][/*key*/ ctx[1]].detail) + "";

    	let t6;
    	let div3_class_value;
    	let div3_style_value;
    	let div3_intro;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			icon = element("icon");
    			t1 = space();
    			txt0 = element("txt");
    			t2 = text(t2_value);
    			t3 = space();
    			div0 = element("div");
    			txt1 = element("txt");
    			t4 = text(t4_value);
    			t5 = space();
    			div2 = element("div");
    			txt2 = element("txt");
    			t6 = text(t6_value);
    			if (!src_url_equal(img.src, img_src_value = "/img/lotr_hobbit_stamp.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-1qwug6b");
    			add_location(img, file$D, 150, 2, 4897);

    			attr_dev(icon, "class", icon_class_value = "icon-" + (/*cover*/ ctx[5]
    			? 'logo'
    			: /*role*/ ctx[14] == 'base' ? 'base' : /*key*/ ctx[1]) + " svelte-1qwug6b");

    			add_location(icon, file$D, 152, 4, 4968);
    			attr_dev(txt0, "class", "name svelte-1qwug6b");
    			add_location(txt0, file$D, 153, 4, 5049);
    			attr_dev(txt1, "class", "svelte-1qwug6b");
    			add_location(txt1, file$D, 155, 6, 5200);
    			attr_dev(div0, "class", div0_class_value = "cost " + (!/*cover*/ ctx[5] && /*interim*/ ctx[3] && 'interim') + " svelte-1qwug6b");
    			add_location(div0, file$D, 154, 4, 5116);
    			attr_dev(div1, "class", "content svelte-1qwug6b");
    			add_location(div1, file$D, 151, 2, 4941);
    			attr_dev(txt2, "class", "svelte-1qwug6b");
    			add_location(txt2, file$D, 159, 4, 5284);
    			attr_dev(div2, "class", "detail svelte-1qwug6b");
    			add_location(div2, file$D, 158, 2, 5258);
    			attr_dev(div3, "class", div3_class_value = "" + (null_to_empty(`card ${/*cover*/ ctx[5] ? "cover" : /*role*/ ctx[14]} ${/*used*/ ctx[6] && "used"} ${/*ready*/ ctx[10] && "ready"} ${!/*animate*/ ctx[2] && "animateOff"} ${/*drag*/ ctx[11] && "drag"} ${/*abandoned*/ ctx[4] && "abandoned"}`) + " svelte-1qwug6b"));

    			attr_dev(div3, "style", div3_style_value = "transform:" + ('rotate' in /*transform*/ ctx[0]
    			? `rotate(${/*transform*/ ctx[0].rotate}deg)`
    			: ``) + "translate(" + /*transform*/ ctx[0].x + "px, " + /*transform*/ ctx[0].y + "px)" + ('scale' in /*transform*/ ctx[0]
    			? `scale(${/*transform*/ ctx[0].scale})`
    			: ``) + ";transition:" + (/*animate*/ ctx[2] ? /*transition*/ ctx[9] : 'none') + ";" + /*_style*/ ctx[7] + ";");

    			add_location(div3, file$D, 137, 0, 4404);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, img);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			append_dev(div1, icon);
    			append_dev(div1, t1);
    			append_dev(div1, txt0);
    			append_dev(txt0, t2);
    			append_dev(div1, t3);
    			append_dev(div1, div0);
    			append_dev(div0, txt1);
    			append_dev(txt1, t4);
    			/*div0_binding*/ ctx[19](div0);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, txt2);
    			append_dev(txt2, t6);
    			/*div3_binding*/ ctx[20](div3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*cover, role, key*/ 16418 && icon_class_value !== (icon_class_value = "icon-" + (/*cover*/ ctx[5]
    			? 'logo'
    			: /*role*/ ctx[14] == 'base' ? 'base' : /*key*/ ctx[1]) + " svelte-1qwug6b")) {
    				attr_dev(icon, "class", icon_class_value);
    			}

    			if (dirty & /*cover, key*/ 34 && t2_value !== (t2_value = (/*cover*/ ctx[5]
    			? /*cover*/ ctx[5].name
    			: /*card*/ ctx[15][/*key*/ ctx[1]].name) + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*cover, costFix*/ 8224 && t4_value !== (t4_value = (/*cover*/ ctx[5] ? 0 : /*costFix*/ ctx[13]) + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*cover, interim*/ 40 && div0_class_value !== (div0_class_value = "cost " + (!/*cover*/ ctx[5] && /*interim*/ ctx[3] && 'interim') + " svelte-1qwug6b")) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if (dirty & /*cover, key*/ 34 && t6_value !== (t6_value = (/*cover*/ ctx[5]
    			? /*cover*/ ctx[5].detail
    			: /*card*/ ctx[15][/*key*/ ctx[1]].detail) + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*cover, role, used, ready, animate, drag, abandoned*/ 19572 && div3_class_value !== (div3_class_value = "" + (null_to_empty(`card ${/*cover*/ ctx[5] ? "cover" : /*role*/ ctx[14]} ${/*used*/ ctx[6] && "used"} ${/*ready*/ ctx[10] && "ready"} ${!/*animate*/ ctx[2] && "animateOff"} ${/*drag*/ ctx[11] && "drag"} ${/*abandoned*/ ctx[4] && "abandoned"}`) + " svelte-1qwug6b"))) {
    				attr_dev(div3, "class", div3_class_value);
    			}

    			if (dirty & /*transform, animate, transition, _style*/ 645 && div3_style_value !== (div3_style_value = "transform:" + ('rotate' in /*transform*/ ctx[0]
    			? `rotate(${/*transform*/ ctx[0].rotate}deg)`
    			: ``) + "translate(" + /*transform*/ ctx[0].x + "px, " + /*transform*/ ctx[0].y + "px)" + ('scale' in /*transform*/ ctx[0]
    			? `scale(${/*transform*/ ctx[0].scale})`
    			: ``) + ";transition:" + (/*animate*/ ctx[2] ? /*transition*/ ctx[9] : 'none') + ";" + /*_style*/ ctx[7] + ";")) {
    				attr_dev(div3, "style", div3_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (!div3_intro) {
    				add_render_callback(() => {
    					div3_intro = create_in_transition(div3, scale, { duration: 250 });
    					div3_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			/*div0_binding*/ ctx[19](null);
    			/*div3_binding*/ ctx[20](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$D.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$D($$self, $$props, $$invalidate) {
    	let role;
    	let costFix;
    	let $Explain;
    	let $Admin;
    	validate_store(Explain, 'Explain');
    	component_subscribe($$self, Explain, $$value => $$invalidate(21, $Explain = $$value));
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(22, $Admin = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Card', slots, []);
    	let card = Object.assign(deepCopy(spellcard$1), deepCopy(basecard));
    	let { key } = $$props;
    	let { action = _ => null } = $$props;
    	let { select = _ => null } = $$props;
    	let { cost = false } = $$props;
    	let { transform = {} } = $$props;
    	let { animate = true } = $$props;
    	let { interim = card[key].interim } = $$props;
    	let { abandoned = false } = $$props;
    	let { cover = false } = $$props;
    	let used = false;
    	let _style;
    	let element;
    	let transition = "0.3s";
    	let ready = false;
    	let drag = false;
    	let element_cost;

    	onMount(_ => {
    		let enterEvent = _ => {
    			$$invalidate(0, transform.scale = 1.1, transform);

    			let recover = _ => {
    				$$invalidate(0, transform.scale = 1, transform);
    			};

    			$$invalidate(8, element.onmouseleave = recover, element);
    			$$invalidate(8, element.ontouchend = recover, element);
    		};

    		$$invalidate(8, element.onmouseenter = enterEvent, element);

    		let dragEvent = event => {
    			$$invalidate(11, drag = true);
    			select(true);
    			const t = deepCopy(transform);
    			if (!event.x) event.x = event.touches[0].pageX;
    			if (!event.y) event.y = event.touches[0].pageY;
    			const x = event.x;
    			const y = event.y;
    			$$invalidate(0, transform.rotate = 0, transform);
    			$$invalidate(0, transform.y += Math.sin(t.rotate / 180 * Math.PI) * t.x, transform);
    			$$invalidate(0, transform.x -= Math.tan(t.rotate / 180 * Math.PI) * t.y, transform);
    			$$invalidate(0, transform.scale = 1.1, transform);
    			$$invalidate(7, _style = `z-index:100;`);

    			let moveEvent = e => {
    				if (!e.x) e.x = e.touches[0].pageX;
    				if (!e.y) e.y = e.touches[0].pageY;
    				$$invalidate(10, ready = typeof $Admin.enermy.checkForPosition(e) == "number");
    				let offsetX = e.x - x;
    				let offsetY = e.y - y;
    				$$invalidate(9, transition = "transform 0.3s");

    				if ($Admin.battle.round.get()) {
    					if ($Admin.mobile) {
    						$$invalidate(7, _style = `left:${235 + offsetY / $Admin.mobile}px;top:${-offsetX / $Admin.mobile}px;z-index:100;`);
    					} else $$invalidate(7, _style = `left:${235 + offsetX}px;top:${offsetY}px;z-index:100;`);
    				}
    			};

    			$$invalidate(8, element.onmousemove = moveEvent, element);
    			$$invalidate(8, element.ontouchmove = moveEvent, element);

    			const cancel = _ => {
    				$$invalidate(10, ready = false);
    				$$invalidate(11, drag = false);

    				if (element) {
    					$$invalidate(8, element.onmousedown = dragEvent, element);
    					$$invalidate(8, element.onmousemove = null, element);
    					$$invalidate(8, element.onmouseup = null, element);
    					$$invalidate(8, element.onmouseleave = null, element);
    					$$invalidate(8, element.ontouchstart = dragEvent, element);
    					$$invalidate(8, element.ontouchmove = null, element);
    					$$invalidate(8, element.ontouchend = null, element);
    				}

    				select(false);
    				$$invalidate(0, transform = t);
    				$$invalidate(0, transform.scale = 1, transform);
    				$$invalidate(9, transition = "0.3s");
    				$$invalidate(7, _style = `left:235px;top:0px;`);
    			};

    			let leaveEvent = e => {
    				if (!e.x) e.x = e.changedTouches[0].pageX;
    				if (!e.y) e.y = e.changedTouches[0].pageY;
    				let _cost = $Admin.handcard.Cost();

    				if (_cost === false) {
    					cancel();
    					msg({ content: "条件不足" });
    				} else if ($Admin.role.power.of(0).get() >= _cost) {
    					let res = $Admin.enermy.checkForPosition(e);

    					if (typeof res == "number") {
    						$$invalidate(8, element.onmousedown = null, element);
    						$$invalidate(8, element.onmousemove = null, element);
    						$$invalidate(8, element.onmouseleave = null, element);
    						$$invalidate(6, used = true);
    						action(res);

    						setTimeout(
    							_ => {
    								$$invalidate(6, used = false);
    								cancel();
    							},
    							500
    						);
    					} else cancel();
    				} else {
    					cancel();
    					msg({ content: "灵力不足" });
    				}
    			};

    			$$invalidate(8, element.onmouseup = leaveEvent, element);
    			$$invalidate(8, element.ontouchend = leaveEvent, element);
    			$$invalidate(8, element.onmouseleave = cancel, element);
    		};

    		if (Object.keys(transform).length == 0) dragEvent = _ => null;
    		$$invalidate(8, element.onmousedown = dragEvent, element);

    		$$invalidate(
    			8,
    			element.ontouchstart = e => {
    				$$invalidate(0, transform.scale = 1.1, transform);
    				dragEvent(e);
    			},
    			element
    		);
    	});

    	beforeUpdate(_ => {
    		if (used) {
    			$$invalidate(0, transform.scale = 1.1, transform);
    			$$invalidate(10, ready = true);
    		}

    		if (interim && element_cost) {
    			$Explain(element_cost).with({ name: "一次性", detail: "这张牌是消耗品，打出后不会再抽到。" });
    		}
    	});

    	$$self.$$.on_mount.push(function () {
    		if (key === undefined && !('key' in $$props || $$self.$$.bound[$$self.$$.props['key']])) {
    			console.warn("<Card> was created without expected prop 'key'");
    		}
    	});

    	const writable_props = [
    		'key',
    		'action',
    		'select',
    		'cost',
    		'transform',
    		'animate',
    		'interim',
    		'abandoned',
    		'cover'
    	];

    	Object_1$g.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_cost = $$value;
    			$$invalidate(12, element_cost);
    		});
    	}

    	function div3_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element = $$value;
    			$$invalidate(8, element);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('key' in $$props) $$invalidate(1, key = $$props.key);
    		if ('action' in $$props) $$invalidate(16, action = $$props.action);
    		if ('select' in $$props) $$invalidate(17, select = $$props.select);
    		if ('cost' in $$props) $$invalidate(18, cost = $$props.cost);
    		if ('transform' in $$props) $$invalidate(0, transform = $$props.transform);
    		if ('animate' in $$props) $$invalidate(2, animate = $$props.animate);
    		if ('interim' in $$props) $$invalidate(3, interim = $$props.interim);
    		if ('abandoned' in $$props) $$invalidate(4, abandoned = $$props.abandoned);
    		if ('cover' in $$props) $$invalidate(5, cover = $$props.cover);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		beforeUpdate,
    		Admin,
    		Explain,
    		spellcard: spellcard$1,
    		basecard,
    		fade,
    		scale,
    		sector,
    		card,
    		key,
    		action,
    		select,
    		cost,
    		transform,
    		animate,
    		interim,
    		abandoned,
    		cover,
    		used,
    		_style,
    		element,
    		transition,
    		ready,
    		drag,
    		element_cost,
    		costFix,
    		role,
    		$Explain,
    		$Admin
    	});

    	$$self.$inject_state = $$props => {
    		if ('card' in $$props) $$invalidate(15, card = $$props.card);
    		if ('key' in $$props) $$invalidate(1, key = $$props.key);
    		if ('action' in $$props) $$invalidate(16, action = $$props.action);
    		if ('select' in $$props) $$invalidate(17, select = $$props.select);
    		if ('cost' in $$props) $$invalidate(18, cost = $$props.cost);
    		if ('transform' in $$props) $$invalidate(0, transform = $$props.transform);
    		if ('animate' in $$props) $$invalidate(2, animate = $$props.animate);
    		if ('interim' in $$props) $$invalidate(3, interim = $$props.interim);
    		if ('abandoned' in $$props) $$invalidate(4, abandoned = $$props.abandoned);
    		if ('cover' in $$props) $$invalidate(5, cover = $$props.cover);
    		if ('used' in $$props) $$invalidate(6, used = $$props.used);
    		if ('_style' in $$props) $$invalidate(7, _style = $$props._style);
    		if ('element' in $$props) $$invalidate(8, element = $$props.element);
    		if ('transition' in $$props) $$invalidate(9, transition = $$props.transition);
    		if ('ready' in $$props) $$invalidate(10, ready = $$props.ready);
    		if ('drag' in $$props) $$invalidate(11, drag = $$props.drag);
    		if ('element_cost' in $$props) $$invalidate(12, element_cost = $$props.element_cost);
    		if ('costFix' in $$props) $$invalidate(13, costFix = $$props.costFix);
    		if ('role' in $$props) $$invalidate(14, role = $$props.role);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*key*/ 2) {
    			$$invalidate(14, role = Object.keys(spellcard$1).includes(key)
    			? spellcard$1[key].role
    			: "base");
    		}

    		if ($$self.$$.dirty & /*cost, key*/ 262146) {
    			$$invalidate(13, costFix = typeof cost == "number" ? cost : card[key].cost);
    		}
    	};

    	return [
    		transform,
    		key,
    		animate,
    		interim,
    		abandoned,
    		cover,
    		used,
    		_style,
    		element,
    		transition,
    		ready,
    		drag,
    		element_cost,
    		costFix,
    		role,
    		card,
    		action,
    		select,
    		cost,
    		div0_binding,
    		div3_binding
    	];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$D, create_fragment$D, safe_not_equal, {
    			key: 1,
    			action: 16,
    			select: 17,
    			cost: 18,
    			transform: 0,
    			animate: 2,
    			interim: 3,
    			abandoned: 4,
    			cover: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$D.name
    		});
    	}

    	get key() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set key(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get action() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set action(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get select() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set select(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cost() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cost(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get transform() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transform(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get animate() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set animate(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get interim() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set interim(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get abandoned() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set abandoned(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cover() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cover(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var annotation = [
    	{
    		name: "核心机制",
    		detail: "没有任何直接提升面板的手段，生命值且不说，攻击力这样的属性完全见不到是吧，不过消耗品就另当别论了，毕竟是消耗品。\n不过，敌人变强的方式就是单纯的堆面板了，自身的机制不会有啥变化。\n角色要变强只能拿道具，探索出路了，简单粗暴的固定减伤海螺壳，一直堆叠的性价比是越来越低的哦，可想而知敌人的面板是怎样在增长。"
    	},
    	{
    		name: "普攻、符卡和通式",
    		detail: "战斗开始时有好多张的就是普攻，统一灵力消耗是1，伤害是血量的六分之一左右，附带一些特殊效果。\n通式就是卡面千篇一律的那些，并非角色特有，一些在任何场合都能出现，一些只在某个场景出现，一些则只在某些事件中出现。\n其他的就是符卡了。"
    	},
    	{
    		name: "自然灵力和额外灵力",
    		detail: "统称叫灵力，唯一的区别是自然灵力在回合开始时会回复到上限，而额外灵力用掉了就没有了，以及额外灵力是优先消耗的。\n只有在必要的时候才会将“自然灵力”区分出来。"
    	},
    	{
    		name: "装备和纪念品",
    		detail: "装备有主动和被动之分，主动装备一场战斗中默认只能用一次。\n纪念品一定是有一个广义上的正面效果和一个广义上的负面效果，只能在某些事件中获得。\n两者的共同特点是只能携带一个、携带一种，拿了新的就替换旧的。"
    	},
    	{
    		name: "抽牌数和手牌上限",
    		detail: "抽牌数就是每回合开始时从牌库抽的牌数，抽牌数=基础抽牌数+(速度-敌人平均速度)，小数点后面部分就是多抽一张的概率，顺带一提基础抽牌数是2。\n一旦手中牌的数量达到了上限，抽牌就会没有啥反应，手牌上限=抽牌数+速度四舍五入。"
    	},
    	{
    		name: "攻击和造成伤害",
    		detail: "打出卡只能回血肯定就不是攻击了嘛，打出卡引起的一系列输出中包含造成伤害，就叫攻击，但是目标可能有盾什么的，不一定要受到伤害。\n如果一张卡造成了群体伤害，那么“造成伤害”的次数就会多于“攻击”的次数。\n对自己造成伤害也算造成伤害哦。"
    	},
    	{
    		name: "穿透伤害",
    		detail: "伤害的一种类型，跳过防御结界等阻挡伤害的机制直接对目标造成伤害，不受自身命中率和目标闪避率的影响，但受减伤环节影响。"
    	},
    	{
    		name: "直接伤害和间接伤害",
    		detail: "角色造成的伤害由二者构成，主要区别为是否由角色直接造成，间接伤害没法暴击的。\n“造成n伤害”若非特别说明，就是指造成n点直接伤害。\n一般情况下，卡造成的伤害和主动装备造成的伤害都是直接伤害，其它的则是间接伤害。"
    	},
    	{
    		name: "最终伤害和额外伤害",
    		detail: "伤害结算的过程中有诸多的烹饪环节，如日晷、腌萝卜、害羞兔的增伤啊，暴击判定啊，或者对伤害本身没有影响的封魔针充能、挂星星之类的，最后得到的就是最终伤害了。\n额外伤害是间接伤害的一种，但与最终伤害性质相同，都不会再触发任何的烹饪环节，是一个最终值了。"
    	},
    	{
    		name: "角色造成的伤害和敌人受到的伤害",
    		detail: "首先二者肯定是不等同的，例如，各类buff的伤害类型是额外伤害，没法被角色的增伤效果增幅，但是可以被“敌人受到伤害增加”的效果增幅。\n因为这两种增伤效果是不同的，所以在结算伤害时可以乘算。\n笑了，这破游戏里哪个乘区不是独立乘区。"
    	},
    	{
    		name: "受到伤害与生命值削减",
    		detail: "显然，先有受到伤害，再有生命值削减，是一个因果关系，所以诸如“削减敌人20%生命值”是不会触发“造成伤害”或“受到伤害”的效果的。"
    	},
    	{
    		name: "生命值与过量治疗",
    		detail: "最大生命值和当前生命值的变动是分开的，最大生命值-2并不会连带当前生命值一起-2，当前生命值的30%和最大生命值的30%大多数情况下也不是同一个数目。\n当前生命值不可能超过最大生命值，如果发生溢出，溢出部分会被消去，不过并不会形成过量治疗哟，过量治疗起码得是真的治疗吧，有绿色数字冒出来的那种。"
    	},
    	{
    		name: "生命值的变动",
    		detail: "“减少30%生命值”是指将当前生命值扣除最大生命值的30%，“减少30%最大生命值”是真的扣最大生命值，而“减少30%当前生命值”就是基于现有血量扣除了。\n是吧，因为第二第三种表达方式都是其它意思，只能用第一种表达方式了。"
    	},
    	{
    		name: "XXX造成的伤害",
    		detail: "普通攻击要是触发了窜天猴的50%附加伤害，那这伤害算在通式暴怒的效果“普攻造成的伤害+30%”里吗？\n是算的，简单来说，打出一张卡后出现的所有伤害数字都算在这一次攻击里。\n"
    	}
    ];

    /* src\page\menu.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1$f } = globals;
    const file$C = "src\\page\\menu.svelte";

    function get_each_context$h(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[36] = list[i];
    	child_ctx[38] = i;
    	return child_ctx;
    }

    function get_each_context_1$8(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[39] = list[i];
    	child_ctx[40] = list;
    	child_ctx[38] = i;
    	return child_ctx;
    }

    function get_each_context_2$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[39] = list[i];
    	child_ctx[38] = i;
    	return child_ctx;
    }

    function get_each_context_3$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[39] = list[i];
    	child_ctx[42] = list;
    	child_ctx[38] = i;
    	return child_ctx;
    }

    function get_each_context_4$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[43] = list[i];
    	child_ctx[44] = list;
    	child_ctx[38] = i;
    	return child_ctx;
    }

    // (190:0) {#if enable}
    function create_if_block$b(ctx) {
    	let div;
    	let div_class_value;
    	let div_intro;
    	let div_outro;
    	let current;
    	let if_block = /*enable*/ ctx[0] && create_if_block_1$8(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", div_class_value = "body " + (/*enable*/ ctx[0] && 'menu') + " " + /*$data*/ ctx[12].role + " svelte-2yotwx");
    			add_location(div, file$C, 190, 2, 4842);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*enable*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*enable*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1$8(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*enable, $data*/ 4097 && div_class_value !== (div_class_value = "body " + (/*enable*/ ctx[0] && 'menu') + " " + /*$data*/ ctx[12].role + " svelte-2yotwx")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);

    			add_render_callback(() => {
    				if (!current) return;
    				if (div_outro) div_outro.end(1);
    				div_intro = create_in_transition(div, fade, { duration: 250 });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fade, { duration: 250 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$b.name,
    		type: "if",
    		source: "(190:0) {#if enable}",
    		ctx
    	});

    	return block;
    }

    // (196:4) {#if enable}
    function create_if_block_1$8(ctx) {
    	let div1;
    	let div0;
    	let icon0;
    	let t0;
    	let txt0;
    	let t2;
    	let div2;
    	let t4;
    	let div13;
    	let div6;
    	let txt1;
    	let t6;
    	let div3;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t7;
    	let img;
    	let img_src_value;
    	let t8;
    	let div4;
    	let icon1;
    	let t9;
    	let txt2;
    	let t10_value = /*$data*/ ctx[12].coin + "";
    	let t10;
    	let t11;
    	let div5;
    	let t13;
    	let div12;
    	let div10;
    	let div7;
    	let txt3;
    	let t14;
    	let txt3_class_value;
    	let t15;
    	let txt4;
    	let t16;
    	let txt4_class_value;
    	let t17;
    	let txt5;
    	let t18;
    	let txt5_class_value;
    	let t19;
    	let txt6;
    	let t20;
    	let txt6_class_value;
    	let t21;
    	let div8;
    	let t22;
    	let div9;
    	let t23;
    	let t24;
    	let t25;
    	let t26;
    	let t27;
    	let div11;
    	let t28;
    	let div13_intro;
    	let div13_outro;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_4 = /*state*/ ctx[2];
    	validate_each_argument(each_value_4);
    	const get_key = ctx => /*i*/ ctx[38];
    	validate_each_keys(ctx, each_value_4, get_each_context_4$1, get_key);

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		let child_ctx = get_each_context_4$1(ctx, each_value_4, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_4$1(key, child_ctx));
    	}

    	let if_block0 = /*index*/ ctx[1] == "collection" && create_if_block_8(ctx);
    	let if_block1 = /*index*/ ctx[1] == "spellcards" && create_if_block_7$2(ctx);
    	let if_block2 = /*index*/ ctx[1] == "consumable" && create_if_block_5$3(ctx);
    	let if_block3 = /*index*/ ctx[1] == "annotation" && create_if_block_4$4(ctx);
    	let if_block4 = /*$data*/ ctx[12].equipment && create_if_block_3$4(ctx);
    	let if_block5 = /*$data*/ ctx[12].souvenir && create_if_block_2$6(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			icon0 = element("icon");
    			t0 = space();
    			txt0 = element("txt");
    			txt0.textContent = "思与想的境界";
    			t2 = space();
    			div2 = element("div");
    			div2.textContent = "可在任何地方右键打开或关闭角色面板";
    			t4 = space();
    			div13 = element("div");
    			div6 = element("div");
    			txt1 = element("txt");
    			txt1.textContent = "(=￣ ρ￣=) ..zzZZ";
    			t6 = space();
    			div3 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t7 = space();
    			img = element("img");
    			t8 = space();
    			div4 = element("div");
    			icon1 = element("icon");
    			t9 = space();
    			txt2 = element("txt");
    			t10 = text(t10_value);
    			t11 = space();
    			div5 = element("div");
    			div5.textContent = "保存并回到标题界面";
    			t13 = space();
    			div12 = element("div");
    			div10 = element("div");
    			div7 = element("div");
    			txt3 = element("txt");
    			t14 = text("牌库");
    			t15 = space();
    			txt4 = element("txt");
    			t16 = text("收藏品");
    			t17 = space();
    			txt5 = element("txt");
    			t18 = text("消耗品");
    			t19 = space();
    			txt6 = element("txt");
    			t20 = text("碎碎念");
    			t21 = space();
    			div8 = element("div");
    			t22 = space();
    			div9 = element("div");
    			t23 = space();
    			if (if_block0) if_block0.c();
    			t24 = space();
    			if (if_block1) if_block1.c();
    			t25 = space();
    			if (if_block2) if_block2.c();
    			t26 = space();
    			if (if_block3) if_block3.c();
    			t27 = space();
    			div11 = element("div");
    			if (if_block4) if_block4.c();
    			t28 = space();
    			if (if_block5) if_block5.c();
    			attr_dev(icon0, "class", "icon-data svelte-2yotwx");
    			add_location(icon0, file$C, 198, 10, 5063);
    			attr_dev(txt0, "class", "svelte-2yotwx");
    			add_location(txt0, file$C, 199, 10, 5106);
    			attr_dev(div0, "class", "title svelte-2yotwx");
    			add_location(div0, file$C, 197, 8, 5032);
    			attr_dev(div1, "class", "info svelte-2yotwx");
    			attr_dev(div1, "id", "info");
    			add_location(div1, file$C, 196, 6, 4994);
    			attr_dev(div2, "class", "remind svelte-2yotwx");
    			add_location(div2, file$C, 202, 6, 5161);
    			attr_dev(txt1, "class", "svelte-2yotwx");
    			add_location(txt1, file$C, 209, 10, 5364);
    			if (!src_url_equal(img.src, img_src_value = "/img/role/" + /*$setting*/ ctx[13].resource + "/" + /*$data*/ ctx[12].role + ".webp")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-2yotwx");
    			add_location(img, file$C, 226, 12, 6010);
    			attr_dev(div3, "class", "state svelte-2yotwx");
    			add_location(div3, file$C, 210, 10, 5402);
    			attr_dev(icon1, "class", "coin icon-coin svelte-2yotwx");
    			add_location(icon1, file$C, 232, 12, 6247);
    			attr_dev(txt2, "class", "svelte-2yotwx");
    			add_location(txt2, file$C, 233, 12, 6297);
    			attr_dev(div4, "class", "tip svelte-2yotwx");
    			set_style(div4, "--width", "200px");
    			add_location(div4, file$C, 231, 10, 6169);
    			attr_dev(div5, "class", "tip action svelte-2yotwx");
    			set_style(div5, "--width", "250px");
    			add_location(div5, file$C, 235, 10, 6350);
    			attr_dev(div6, "class", "left svelte-2yotwx");
    			add_location(div6, file$C, 208, 8, 5334);
    			attr_dev(txt3, "class", txt3_class_value = "" + (null_to_empty(/*index*/ ctx[1] == "spellcards" && "selected") + " svelte-2yotwx"));
    			add_location(txt3, file$C, 249, 14, 6710);
    			attr_dev(txt4, "class", txt4_class_value = "" + (null_to_empty(/*index*/ ctx[1] == "collection" && "selected") + " svelte-2yotwx"));
    			add_location(txt4, file$C, 253, 14, 6874);
    			attr_dev(txt5, "class", txt5_class_value = "" + (null_to_empty(/*index*/ ctx[1] == "consumable" && "selected") + " svelte-2yotwx"));
    			add_location(txt5, file$C, 257, 14, 7039);
    			attr_dev(txt6, "class", txt6_class_value = "" + (null_to_empty(/*index*/ ctx[1] == "annotation" && "selected") + " svelte-2yotwx"));
    			add_location(txt6, file$C, 261, 14, 7204);
    			attr_dev(div7, "class", "index svelte-2yotwx");
    			add_location(div7, file$C, 248, 12, 6675);
    			attr_dev(div8, "class", "bookmark svelte-2yotwx");
    			add_location(div8, file$C, 266, 12, 7387);
    			attr_dev(div9, "class", "bg svelte-2yotwx");
    			add_location(div9, file$C, 267, 12, 7425);
    			attr_dev(div10, "class", "item svelte-2yotwx");
    			add_location(div10, file$C, 247, 10, 6643);
    			attr_dev(div11, "class", "other svelte-2yotwx");
    			add_location(div11, file$C, 366, 10, 11125);
    			attr_dev(div12, "class", "right svelte-2yotwx");
    			add_location(div12, file$C, 246, 8, 6612);
    			attr_dev(div13, "class", "main svelte-2yotwx");
    			add_location(div13, file$C, 203, 6, 5212);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, icon0);
    			append_dev(div0, t0);
    			append_dev(div0, txt0);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div2, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div13, anchor);
    			append_dev(div13, div6);
    			append_dev(div6, txt1);
    			append_dev(div6, t6);
    			append_dev(div6, div3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div3, null);
    				}
    			}

    			append_dev(div3, t7);
    			append_dev(div3, img);
    			/*img_binding*/ ctx[17](img);
    			append_dev(div6, t8);
    			append_dev(div6, div4);
    			append_dev(div4, icon1);
    			append_dev(div4, t9);
    			append_dev(div4, txt2);
    			append_dev(txt2, t10);
    			/*div4_binding*/ ctx[18](div4);
    			append_dev(div6, t11);
    			append_dev(div6, div5);
    			append_dev(div13, t13);
    			append_dev(div13, div12);
    			append_dev(div12, div10);
    			append_dev(div10, div7);
    			append_dev(div7, txt3);
    			append_dev(txt3, t14);
    			append_dev(div7, t15);
    			append_dev(div7, txt4);
    			append_dev(txt4, t16);
    			append_dev(div7, t17);
    			append_dev(div7, txt5);
    			append_dev(txt5, t18);
    			append_dev(div7, t19);
    			append_dev(div7, txt6);
    			append_dev(txt6, t20);
    			append_dev(div10, t21);
    			append_dev(div10, div8);
    			append_dev(div10, t22);
    			append_dev(div10, div9);
    			append_dev(div10, t23);
    			if (if_block0) if_block0.m(div10, null);
    			append_dev(div10, t24);
    			if (if_block1) if_block1.m(div10, null);
    			append_dev(div10, t25);
    			if (if_block2) if_block2.m(div10, null);
    			append_dev(div10, t26);
    			if (if_block3) if_block3.m(div10, null);
    			append_dev(div12, t27);
    			append_dev(div12, div11);
    			if (if_block4) if_block4.m(div11, null);
    			append_dev(div11, t28);
    			if (if_block5) if_block5.m(div11, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div5, "click", /*click_handler*/ ctx[19], false, false, false, false),
    					listen_dev(txt3, "click", /*click_handler_1*/ ctx[20], false, false, false, false),
    					listen_dev(txt4, "click", /*click_handler_2*/ ctx[21], false, false, false, false),
    					listen_dev(txt5, "click", /*click_handler_3*/ ctx[22], false, false, false, false),
    					listen_dev(txt6, "click", /*click_handler_4*/ ctx[23], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*element_state, state, position*/ 16396) {
    				each_value_4 = /*state*/ ctx[2];
    				validate_each_argument(each_value_4);
    				validate_each_keys(ctx, each_value_4, get_each_context_4$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_4, each_1_lookup, div3, destroy_block, create_each_block_4$1, t7, get_each_context_4$1);
    			}

    			if (!current || dirty[0] & /*$setting, $data*/ 12288 && !src_url_equal(img.src, img_src_value = "/img/role/" + /*$setting*/ ctx[13].resource + "/" + /*$data*/ ctx[12].role + ".webp")) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if ((!current || dirty[0] & /*$data*/ 4096) && t10_value !== (t10_value = /*$data*/ ctx[12].coin + "")) set_data_dev(t10, t10_value);

    			if (!current || dirty[0] & /*index*/ 2 && txt3_class_value !== (txt3_class_value = "" + (null_to_empty(/*index*/ ctx[1] == "spellcards" && "selected") + " svelte-2yotwx"))) {
    				attr_dev(txt3, "class", txt3_class_value);
    			}

    			if (!current || dirty[0] & /*index*/ 2 && txt4_class_value !== (txt4_class_value = "" + (null_to_empty(/*index*/ ctx[1] == "collection" && "selected") + " svelte-2yotwx"))) {
    				attr_dev(txt4, "class", txt4_class_value);
    			}

    			if (!current || dirty[0] & /*index*/ 2 && txt5_class_value !== (txt5_class_value = "" + (null_to_empty(/*index*/ ctx[1] == "consumable" && "selected") + " svelte-2yotwx"))) {
    				attr_dev(txt5, "class", txt5_class_value);
    			}

    			if (!current || dirty[0] & /*index*/ 2 && txt6_class_value !== (txt6_class_value = "" + (null_to_empty(/*index*/ ctx[1] == "annotation" && "selected") + " svelte-2yotwx"))) {
    				attr_dev(txt6, "class", txt6_class_value);
    			}

    			if (/*index*/ ctx[1] == "collection") {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*index*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_8(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div10, t24);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*index*/ ctx[1] == "spellcards") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*index*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_7$2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div10, t25);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*index*/ ctx[1] == "consumable") {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*index*/ 2) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_5$3(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div10, t26);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*index*/ ctx[1] == "annotation") {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty[0] & /*index*/ 2) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_4$4(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(div10, null);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (/*$data*/ ctx[12].equipment) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);
    				} else {
    					if_block4 = create_if_block_3$4(ctx);
    					if_block4.c();
    					if_block4.m(div11, t28);
    				}
    			} else if (if_block4) {
    				if_block4.d(1);
    				if_block4 = null;
    			}

    			if (/*$data*/ ctx[12].souvenir) {
    				if (if_block5) {
    					if_block5.p(ctx, dirty);
    				} else {
    					if_block5 = create_if_block_2$6(ctx);
    					if_block5.c();
    					if_block5.m(div11, null);
    				}
    			} else if (if_block5) {
    				if_block5.d(1);
    				if_block5 = null;
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
    				if (div13_outro) div13_outro.end(1);
    				div13_intro = create_in_transition(div13, scale, { duration: 250 });
    				div13_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			if (div13_intro) div13_intro.invalidate();
    			div13_outro = create_out_transition(div13, scale, { duration: 250 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div13);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			/*img_binding*/ ctx[17](null);
    			/*div4_binding*/ ctx[18](null);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();
    			if (if_block5) if_block5.d();
    			if (detaching && div13_outro) div13_outro.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$8.name,
    		type: "if",
    		source: "(196:4) {#if enable}",
    		ctx
    	});

    	return block;
    }

    // (212:12) {#each state as s, i (i)}
    function create_each_block_4$1(key_1, ctx) {
    	let div;
    	let icon;
    	let icon_class_value;
    	let t0;
    	let txt;
    	let t1_value = /*s*/ ctx[43].data + "";
    	let t1;
    	let i = /*i*/ ctx[38];
    	const assign_div = () => /*div_binding*/ ctx[16](div, i);
    	const unassign_div = () => /*div_binding*/ ctx[16](null, i);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			icon = element("icon");
    			t0 = space();
    			txt = element("txt");
    			t1 = text(t1_value);
    			set_style(icon, "left", 150 + /*position*/ ctx[14][/*i*/ ctx[38]].x * 1.5 - 16 + "px");
    			set_style(icon, "top", 150 + /*position*/ ctx[14][/*i*/ ctx[38]].y * 1.5 - 16 + "px");
    			attr_dev(icon, "class", icon_class_value = "icon-" + /*s*/ ctx[43].type + " svelte-2yotwx");
    			add_location(icon, file$C, 213, 16, 5528);
    			set_style(txt, "left", 150 + /*position*/ ctx[14][/*i*/ ctx[38]].x * 2.3 - 25 + "px");
    			set_style(txt, "top", 150 + /*position*/ ctx[14][/*i*/ ctx[38]].y * 2.3 - 16 + "px");
    			attr_dev(txt, "class", "svelte-2yotwx");
    			add_location(txt, file$C, 219, 16, 5767);
    			attr_dev(div, "class", "svelte-2yotwx");
    			add_location(div, file$C, 212, 14, 5476);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, icon);
    			append_dev(div, t0);
    			append_dev(div, txt);
    			append_dev(txt, t1);
    			assign_div();
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*state*/ 4) {
    				set_style(icon, "left", 150 + /*position*/ ctx[14][/*i*/ ctx[38]].x * 1.5 - 16 + "px");
    			}

    			if (dirty[0] & /*state*/ 4) {
    				set_style(icon, "top", 150 + /*position*/ ctx[14][/*i*/ ctx[38]].y * 1.5 - 16 + "px");
    			}

    			if (dirty[0] & /*state*/ 4 && icon_class_value !== (icon_class_value = "icon-" + /*s*/ ctx[43].type + " svelte-2yotwx")) {
    				attr_dev(icon, "class", icon_class_value);
    			}

    			if (dirty[0] & /*state*/ 4 && t1_value !== (t1_value = /*s*/ ctx[43].data + "")) set_data_dev(t1, t1_value);

    			if (dirty[0] & /*state*/ 4) {
    				set_style(txt, "left", 150 + /*position*/ ctx[14][/*i*/ ctx[38]].x * 2.3 - 25 + "px");
    			}

    			if (dirty[0] & /*state*/ 4) {
    				set_style(txt, "top", 150 + /*position*/ ctx[14][/*i*/ ctx[38]].y * 2.3 - 16 + "px");
    			}

    			if (i !== /*i*/ ctx[38]) {
    				unassign_div();
    				i = /*i*/ ctx[38];
    				assign_div();
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			unassign_div();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4$1.name,
    		type: "each",
    		source: "(212:12) {#each state as s, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (269:12) {#if index == "collection"}
    function create_if_block_8(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let div_intro;
    	let div_outro;
    	let current;
    	let each_value_3 = Object.keys(/*$data*/ ctx[12].collection);
    	validate_each_argument(each_value_3);
    	const get_key = ctx => /*i*/ ctx[38];
    	validate_each_keys(ctx, each_value_3, get_each_context_3$4, get_key);

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		let child_ctx = get_each_context_3$4(ctx, each_value_3, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_3$4(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "collection container svelte-2yotwx");
    			add_location(div, file$C, 269, 14, 7500);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}

    			/*div_binding_2*/ ctx[25](div);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$data, element_collection*/ 4112) {
    				each_value_3 = Object.keys(/*$data*/ ctx[12].collection);
    				validate_each_argument(each_value_3);
    				validate_each_keys(ctx, each_value_3, get_each_context_3$4, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_3, each_1_lookup, div, destroy_block, create_each_block_3$4, null, get_each_context_3$4);
    			}
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

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			/*div_binding_2*/ ctx[25](null);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(269:12) {#if index == \\\"collection\\\"}",
    		ctx
    	});

    	return block;
    }

    // (282:20) {#if Object.values($data.collection)[i] > 1}
    function create_if_block_9(ctx) {
    	let txt;
    	let t_value = Object.values(/*$data*/ ctx[12].collection)[/*i*/ ctx[38]] + "";
    	let t;

    	const block = {
    		c: function create() {
    			txt = element("txt");
    			t = text(t_value);
    			attr_dev(txt, "class", "svelte-2yotwx");
    			add_location(txt, file$C, 282, 22, 8099);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, txt, anchor);
    			append_dev(txt, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$data*/ 4096 && t_value !== (t_value = Object.values(/*$data*/ ctx[12].collection)[/*i*/ ctx[38]] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(txt);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(282:20) {#if Object.values($data.collection)[i] > 1}",
    		ctx
    	});

    	return block;
    }

    // (276:16) {#each Object.keys($data.collection) as c, i (i)}
    function create_each_block_3$4(key_1, ctx) {
    	let div;
    	let icon;
    	let icon_class_value;
    	let t0;
    	let show_if = Object.values(/*$data*/ ctx[12].collection)[/*i*/ ctx[38]] > 1;
    	let t1;
    	let i = /*i*/ ctx[38];
    	let if_block = show_if && create_if_block_9(ctx);
    	const assign_div = () => /*div_binding_1*/ ctx[24](div, i);
    	const unassign_div = () => /*div_binding_1*/ ctx[24](null, i);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			icon = element("icon");
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();
    			attr_dev(icon, "class", icon_class_value = "icon-" + /*c*/ ctx[39] + " svelte-2yotwx");
    			add_location(icon, file$C, 280, 20, 7979);
    			set_style(div, "background-color", "var(--" + collection$2[/*c*/ ctx[39]].type + ")");
    			attr_dev(div, "class", "svelte-2yotwx");
    			add_location(div, file$C, 276, 18, 7803);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, icon);
    			append_dev(div, t0);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t1);
    			assign_div();
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*$data*/ 4096 && icon_class_value !== (icon_class_value = "icon-" + /*c*/ ctx[39] + " svelte-2yotwx")) {
    				attr_dev(icon, "class", icon_class_value);
    			}

    			if (dirty[0] & /*$data*/ 4096) show_if = Object.values(/*$data*/ ctx[12].collection)[/*i*/ ctx[38]] > 1;

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_9(ctx);
    					if_block.c();
    					if_block.m(div, t1);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty[0] & /*$data*/ 4096) {
    				set_style(div, "background-color", "var(--" + collection$2[/*c*/ ctx[39]].type + ")");
    			}

    			if (i !== /*i*/ ctx[38]) {
    				unassign_div();
    				i = /*i*/ ctx[38];
    				assign_div();
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			unassign_div();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3$4.name,
    		type: "each",
    		source: "(276:16) {#each Object.keys($data.collection) as c, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (289:12) {#if index == "spellcards"}
    function create_if_block_7$2(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let div_intro;
    	let div_outro;
    	let current;
    	let each_value_2 = Object.unCount(/*$data*/ ctx[12].card);
    	validate_each_argument(each_value_2);
    	const get_key = ctx => /*i*/ ctx[38];
    	validate_each_keys(ctx, each_value_2, get_each_context_2$5, get_key);

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		let child_ctx = get_each_context_2$5(ctx, each_value_2, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_2$5(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "spellcards container svelte-2yotwx");
    			add_location(div, file$C, 289, 14, 8322);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}

    			/*div_binding_3*/ ctx[26](div);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$data*/ 4096) {
    				each_value_2 = Object.unCount(/*$data*/ ctx[12].card);
    				validate_each_argument(each_value_2);
    				group_outros();
    				validate_each_keys(ctx, each_value_2, get_each_context_2$5, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_2, each_1_lookup, div, outro_and_destroy_block, create_each_block_2$5, null, get_each_context_2$5);
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
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fade, { duration: 200 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			/*div_binding_3*/ ctx[26](null);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7$2.name,
    		type: "if",
    		source: "(289:12) {#if index == \\\"spellcards\\\"}",
    		ctx
    	});

    	return block;
    }

    // (296:16) {#each Object.unCount($data.card) as c, i (i)}
    function create_each_block_2$5(key_1, ctx) {
    	let first;
    	let card;
    	let current;

    	card = new Card({
    			props: { key: /*c*/ ctx[39] },
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(card.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const card_changes = {};
    			if (dirty[0] & /*$data*/ 4096) card_changes.key = /*c*/ ctx[39];
    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$5.name,
    		type: "each",
    		source: "(296:16) {#each Object.unCount($data.card) as c, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (301:12) {#if index == "consumable"}
    function create_if_block_5$3(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let div_intro;
    	let div_outro;
    	let current;
    	let each_value_1 = Object.keys(/*$data*/ ctx[12].consumable);
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*i*/ ctx[38];
    	validate_each_keys(ctx, each_value_1, get_each_context_1$8, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1$8(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1$8(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "collection container svelte-2yotwx");
    			add_location(div, file$C, 301, 14, 8761);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}

    			/*div_binding_5*/ ctx[28](div);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*element_consumable, $data*/ 4128) {
    				each_value_1 = Object.keys(/*$data*/ ctx[12].consumable);
    				validate_each_argument(each_value_1);
    				validate_each_keys(ctx, each_value_1, get_each_context_1$8, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, div, destroy_block, create_each_block_1$8, null, get_each_context_1$8);
    			}
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

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			/*div_binding_5*/ ctx[28](null);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$3.name,
    		type: "if",
    		source: "(301:12) {#if index == \\\"consumable\\\"}",
    		ctx
    	});

    	return block;
    }

    // (311:20) {#if Object.values($data.consumable)[i] > 1}
    function create_if_block_6$3(ctx) {
    	let txt;
    	let t_value = Object.values(/*$data*/ ctx[12].consumable)[/*i*/ ctx[38]] + "";
    	let t;

    	const block = {
    		c: function create() {
    			txt = element("txt");
    			t = text(t_value);
    			attr_dev(txt, "class", "svelte-2yotwx");
    			add_location(txt, file$C, 311, 22, 9245);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, txt, anchor);
    			append_dev(txt, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$data*/ 4096 && t_value !== (t_value = Object.values(/*$data*/ ctx[12].consumable)[/*i*/ ctx[38]] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(txt);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6$3.name,
    		type: "if",
    		source: "(311:20) {#if Object.values($data.consumable)[i] > 1}",
    		ctx
    	});

    	return block;
    }

    // (308:16) {#each Object.keys($data.consumable) as c, i (i)}
    function create_each_block_1$8(key_1, ctx) {
    	let div;
    	let icon;
    	let icon_class_value;
    	let t0;
    	let show_if = Object.values(/*$data*/ ctx[12].consumable)[/*i*/ ctx[38]] > 1;
    	let t1;
    	let i = /*i*/ ctx[38];
    	let if_block = show_if && create_if_block_6$3(ctx);
    	const assign_div = () => /*div_binding_4*/ ctx[27](div, i);
    	const unassign_div = () => /*div_binding_4*/ ctx[27](null, i);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			icon = element("icon");
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();
    			attr_dev(icon, "class", icon_class_value = "icon-" + /*c*/ ctx[39] + " svelte-2yotwx");
    			add_location(icon, file$C, 309, 20, 9125);
    			attr_dev(div, "class", "svelte-2yotwx");
    			add_location(div, file$C, 308, 18, 9064);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, icon);
    			append_dev(div, t0);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t1);
    			assign_div();
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*$data*/ 4096 && icon_class_value !== (icon_class_value = "icon-" + /*c*/ ctx[39] + " svelte-2yotwx")) {
    				attr_dev(icon, "class", icon_class_value);
    			}

    			if (dirty[0] & /*$data*/ 4096) show_if = Object.values(/*$data*/ ctx[12].consumable)[/*i*/ ctx[38]] > 1;

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_6$3(ctx);
    					if_block.c();
    					if_block.m(div, t1);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (i !== /*i*/ ctx[38]) {
    				unassign_div();
    				i = /*i*/ ctx[38];
    				assign_div();
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			unassign_div();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$8.name,
    		type: "each",
    		source: "(308:16) {#each Object.keys($data.consumable) as c, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (318:12) {#if index == "annotation"}
    function create_if_block_4$4(ctx) {
    	let div;
    	let table;
    	let thead;
    	let tr0;
    	let th0;
    	let t1;
    	let th1;
    	let t3;
    	let th2;
    	let t5;
    	let th3;
    	let t7;
    	let th4;
    	let t9;
    	let tbody;
    	let tr1;
    	let td0;
    	let t11;
    	let td1;
    	let t13;
    	let td2;
    	let t15;
    	let td3;
    	let t17;
    	let td4;
    	let t19;
    	let tr2;
    	let td5;
    	let t21;
    	let td6;
    	let t23;
    	let td7;
    	let t25;
    	let td8;
    	let t27;
    	let td9;
    	let t29;
    	let tr3;
    	let td10;
    	let t31;
    	let td11;
    	let t33;
    	let td12;
    	let t35;
    	let td13;
    	let t37;
    	let td14;
    	let t39;
    	let txt;
    	let t40;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let div_intro;
    	let div_outro;
    	let current;
    	let each_value = Object.keys(annotation);
    	validate_each_argument(each_value);
    	const get_key = ctx => /*i*/ ctx[38];
    	validate_each_keys(ctx, each_value, get_each_context$h, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$h(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$h(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "乘算速查";
    			t1 = space();
    			th1 = element("th");
    			th1.textContent = "^5";
    			t3 = space();
    			th2 = element("th");
    			th2.textContent = "^10";
    			t5 = space();
    			th3 = element("th");
    			th3.textContent = "^15";
    			t7 = space();
    			th4 = element("th");
    			th4.textContent = "^20";
    			t9 = space();
    			tbody = element("tbody");
    			tr1 = element("tr");
    			td0 = element("td");
    			td0.textContent = "x95%";
    			t11 = space();
    			td1 = element("td");
    			td1.textContent = "77%";
    			t13 = space();
    			td2 = element("td");
    			td2.textContent = "60%";
    			t15 = space();
    			td3 = element("td");
    			td3.textContent = "46%";
    			t17 = space();
    			td4 = element("td");
    			td4.textContent = "36%";
    			t19 = space();
    			tr2 = element("tr");
    			td5 = element("td");
    			td5.textContent = "x90%";
    			t21 = space();
    			td6 = element("td");
    			td6.textContent = "60%";
    			t23 = space();
    			td7 = element("td");
    			td7.textContent = "35%";
    			t25 = space();
    			td8 = element("td");
    			td8.textContent = "20%";
    			t27 = space();
    			td9 = element("td");
    			td9.textContent = "12%";
    			t29 = space();
    			tr3 = element("tr");
    			td10 = element("td");
    			td10.textContent = "x85%";
    			t31 = space();
    			td11 = element("td");
    			td11.textContent = "44%";
    			t33 = space();
    			td12 = element("td");
    			td12.textContent = "20%";
    			t35 = space();
    			td13 = element("td");
    			td13.textContent = "9%";
    			t37 = space();
    			td14 = element("td");
    			td14.textContent = "4%";
    			t39 = space();
    			txt = element("txt");
    			t40 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(th0, "class", "svelte-2yotwx");
    			add_location(th0, file$C, 327, 22, 9800);
    			attr_dev(th1, "class", "svelte-2yotwx");
    			add_location(th1, file$C, 328, 22, 9837);
    			attr_dev(th2, "class", "svelte-2yotwx");
    			add_location(th2, file$C, 329, 22, 9872);
    			attr_dev(th3, "class", "svelte-2yotwx");
    			add_location(th3, file$C, 330, 22, 9908);
    			attr_dev(th4, "class", "svelte-2yotwx");
    			add_location(th4, file$C, 331, 22, 9944);
    			attr_dev(tr0, "class", "svelte-2yotwx");
    			add_location(tr0, file$C, 326, 20, 9772);
    			attr_dev(thead, "class", "svelte-2yotwx");
    			add_location(thead, file$C, 325, 18, 9743);
    			attr_dev(td0, "class", "svelte-2yotwx");
    			add_location(td0, file$C, 336, 22, 10088);
    			attr_dev(td1, "class", "svelte-2yotwx");
    			add_location(td1, file$C, 337, 22, 10125);
    			attr_dev(td2, "class", "svelte-2yotwx");
    			add_location(td2, file$C, 338, 22, 10161);
    			attr_dev(td3, "class", "svelte-2yotwx");
    			add_location(td3, file$C, 339, 22, 10197);
    			attr_dev(td4, "class", "svelte-2yotwx");
    			add_location(td4, file$C, 340, 22, 10233);
    			attr_dev(tr1, "class", "svelte-2yotwx");
    			add_location(tr1, file$C, 335, 20, 10060);
    			attr_dev(td5, "class", "svelte-2yotwx");
    			add_location(td5, file$C, 343, 22, 10322);
    			attr_dev(td6, "class", "svelte-2yotwx");
    			add_location(td6, file$C, 344, 22, 10359);
    			attr_dev(td7, "class", "svelte-2yotwx");
    			add_location(td7, file$C, 345, 22, 10395);
    			attr_dev(td8, "class", "svelte-2yotwx");
    			add_location(td8, file$C, 346, 22, 10431);
    			attr_dev(td9, "class", "svelte-2yotwx");
    			add_location(td9, file$C, 347, 22, 10467);
    			attr_dev(tr2, "class", "svelte-2yotwx");
    			add_location(tr2, file$C, 342, 20, 10294);
    			attr_dev(td10, "class", "svelte-2yotwx");
    			add_location(td10, file$C, 350, 22, 10556);
    			attr_dev(td11, "class", "svelte-2yotwx");
    			add_location(td11, file$C, 351, 22, 10593);
    			attr_dev(td12, "class", "svelte-2yotwx");
    			add_location(td12, file$C, 352, 22, 10629);
    			attr_dev(td13, "class", "svelte-2yotwx");
    			add_location(td13, file$C, 353, 22, 10665);
    			attr_dev(td14, "class", "svelte-2yotwx");
    			add_location(td14, file$C, 354, 22, 10700);
    			attr_dev(tr3, "class", "svelte-2yotwx");
    			add_location(tr3, file$C, 349, 20, 10528);
    			attr_dev(tbody, "class", "svelte-2yotwx");
    			add_location(tbody, file$C, 334, 18, 10031);
    			attr_dev(table, "class", "table svelte-2yotwx");
    			add_location(table, file$C, 324, 16, 9702);
    			attr_dev(txt, "class", "detail svelte-2yotwx");
    			add_location(txt, file$C, 358, 16, 10810);
    			attr_dev(div, "class", "annotation container svelte-2yotwx");
    			add_location(div, file$C, 318, 14, 9468);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, table);
    			append_dev(table, thead);
    			append_dev(thead, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t1);
    			append_dev(tr0, th1);
    			append_dev(tr0, t3);
    			append_dev(tr0, th2);
    			append_dev(tr0, t5);
    			append_dev(tr0, th3);
    			append_dev(tr0, t7);
    			append_dev(tr0, th4);
    			append_dev(table, t9);
    			append_dev(table, tbody);
    			append_dev(tbody, tr1);
    			append_dev(tr1, td0);
    			append_dev(tr1, t11);
    			append_dev(tr1, td1);
    			append_dev(tr1, t13);
    			append_dev(tr1, td2);
    			append_dev(tr1, t15);
    			append_dev(tr1, td3);
    			append_dev(tr1, t17);
    			append_dev(tr1, td4);
    			append_dev(tbody, t19);
    			append_dev(tbody, tr2);
    			append_dev(tr2, td5);
    			append_dev(tr2, t21);
    			append_dev(tr2, td6);
    			append_dev(tr2, t23);
    			append_dev(tr2, td7);
    			append_dev(tr2, t25);
    			append_dev(tr2, td8);
    			append_dev(tr2, t27);
    			append_dev(tr2, td9);
    			append_dev(tbody, t29);
    			append_dev(tbody, tr3);
    			append_dev(tr3, td10);
    			append_dev(tr3, t31);
    			append_dev(tr3, td11);
    			append_dev(tr3, t33);
    			append_dev(tr3, td12);
    			append_dev(tr3, t35);
    			append_dev(tr3, td13);
    			append_dev(tr3, t37);
    			append_dev(tr3, td14);
    			append_dev(div, t39);
    			append_dev(div, txt);
    			append_dev(div, t40);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}

    			/*div_binding_6*/ ctx[29](div);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*annotation, Object*/ 0) {
    				each_value = Object.keys(annotation);
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$h, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, destroy_block, create_each_block$h, null, get_each_context$h);
    			}
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

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			/*div_binding_6*/ ctx[29](null);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$4.name,
    		type: "if",
    		source: "(318:12) {#if index == \\\"annotation\\\"}",
    		ctx
    	});

    	return block;
    }

    // (360:16) {#each Object.keys(annotation) as a, i (i)}
    function create_each_block$h(key_1, ctx) {
    	let txt0;
    	let t0_value = annotation[/*a*/ ctx[36]].name + "";
    	let t0;
    	let t1;
    	let txt1;
    	let t2_value = annotation[/*a*/ ctx[36]].detail + "";
    	let t2;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			txt0 = element("txt");
    			t0 = text(t0_value);
    			t1 = space();
    			txt1 = element("txt");
    			t2 = text(t2_value);
    			attr_dev(txt0, "class", "name svelte-2yotwx");
    			add_location(txt0, file$C, 360, 18, 10917);
    			attr_dev(txt1, "class", "detail svelte-2yotwx");
    			add_location(txt1, file$C, 361, 18, 10981);
    			this.first = txt0;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, txt0, anchor);
    			append_dev(txt0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, txt1, anchor);
    			append_dev(txt1, t2);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(txt0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(txt1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$h.name,
    		type: "each",
    		source: "(360:16) {#each Object.keys(annotation) as a, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (368:12) {#if $data.equipment}
    function create_if_block_3$4(ctx) {
    	let div;
    	let icon;
    	let icon_class_value;
    	let t0;
    	let txt;

    	const block = {
    		c: function create() {
    			div = element("div");
    			icon = element("icon");
    			t0 = space();
    			txt = element("txt");
    			txt.textContent = "装备";
    			attr_dev(icon, "class", icon_class_value = "icon-" + /*$data*/ ctx[12].equipment + " svelte-2yotwx");
    			add_location(icon, file$C, 369, 16, 11266);
    			attr_dev(txt, "class", "svelte-2yotwx");
    			add_location(txt, file$C, 370, 16, 11328);
    			attr_dev(div, "class", "equipment svelte-2yotwx");
    			add_location(div, file$C, 368, 14, 11195);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, icon);
    			append_dev(div, t0);
    			append_dev(div, txt);
    			/*div_binding_7*/ ctx[30](div);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$data*/ 4096 && icon_class_value !== (icon_class_value = "icon-" + /*$data*/ ctx[12].equipment + " svelte-2yotwx")) {
    				attr_dev(icon, "class", icon_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*div_binding_7*/ ctx[30](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$4.name,
    		type: "if",
    		source: "(368:12) {#if $data.equipment}",
    		ctx
    	});

    	return block;
    }

    // (374:12) {#if $data.souvenir}
    function create_if_block_2$6(ctx) {
    	let div;
    	let icon;
    	let icon_class_value;
    	let t0;
    	let txt;

    	const block = {
    		c: function create() {
    			div = element("div");
    			icon = element("icon");
    			t0 = space();
    			txt = element("txt");
    			txt.textContent = "纪念品";
    			attr_dev(icon, "class", icon_class_value = "icon-" + /*$data*/ ctx[12].souvenir + " svelte-2yotwx");
    			add_location(icon, file$C, 375, 16, 11501);
    			attr_dev(txt, "class", "svelte-2yotwx");
    			add_location(txt, file$C, 376, 16, 11562);
    			attr_dev(div, "class", "souvenir svelte-2yotwx");
    			add_location(div, file$C, 374, 14, 11432);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, icon);
    			append_dev(div, t0);
    			append_dev(div, txt);
    			/*div_binding_8*/ ctx[31](div);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$data*/ 4096 && icon_class_value !== (icon_class_value = "icon-" + /*$data*/ ctx[12].souvenir + " svelte-2yotwx")) {
    				attr_dev(icon, "class", icon_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*div_binding_8*/ ctx[31](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$6.name,
    		type: "if",
    		source: "(374:12) {#if $data.souvenir}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$C(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*enable*/ ctx[0] && create_if_block$b(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*enable*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*enable*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$b(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
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
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$C.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$C($$self, $$props, $$invalidate) {
    	let $page;
    	let $data;
    	let $Explain;
    	let $Admin;
    	let $setting;
    	validate_store(page, 'page');
    	component_subscribe($$self, page, $$value => $$invalidate(11, $page = $$value));
    	validate_store(data$1, 'data');
    	component_subscribe($$self, data$1, $$value => $$invalidate(12, $data = $$value));
    	validate_store(Explain, 'Explain');
    	component_subscribe($$self, Explain, $$value => $$invalidate(32, $Explain = $$value));
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(33, $Admin = $$value));
    	validate_store(setting, 'setting');
    	component_subscribe($$self, setting, $$value => $$invalidate(13, $setting = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Menu', slots, []);
    	const menu = menuHandle;
    	let enable = false;
    	let index = "spellcards";
    	let state;
    	const element_state = [];
    	const element_collection = [];
    	const element_consumable = [];
    	const element_container = {};
    	let element_coin;
    	let element_equipment;
    	let element_souvenir;
    	let element_role;
    	set_store_value(Admin, $Admin.menu = menuHandle, $Admin);

    	beforeUpdate(_ => {
    		if ($data) {
    			element_state.forEach((e, i) => $Explain(e).color(state[i].type == "chance" ? $data.chance.type : "blue").with(state[i]));
    			element_collection.forEach((e, i) => $Explain(e).color(collection$2[Object.keys($data.collection)[i]].type).with(collection$2[Object.keys($data.collection)[i]]));
    			element_consumable.forEach((e, i) => $Explain(e).color(consumable$1[Object.keys($data.consumable)[i]].type).with(consumable$1[Object.keys($data.consumable)[i]]));

    			if (typeof $Explain == "function") {
    				$Explain(element_coin).color("gold").with({ name: "硬币", detail: "对，这是钱。" });

    				$Explain(element_role).with({
    					name: role[$data.role].name,
    					detail: role[$data.role].talent
    				});

    				$Explain(element_equipment).color("gold").with(equipment$1[$data.equipment]);
    				$Explain(element_souvenir).color("purple").with(souvenir$1[$data.souvenir]);
    			}
    		}
    	});

    	afterUpdate(_ => {
    		for (let element in element_container) {
    			if (element_container[element]) $$invalidate(
    				6,
    				element_container[element].ontouchstart = function (event) {
    					let originX = event.touches[0].pageX;
    					let scrollTop = element_container[element].scrollTop;

    					$$invalidate(
    						6,
    						element_container[element].ontouchmove = function (e) {
    							let x = e.touches[0].pageX;
    							$$invalidate(6, element_container[element].scrollTop = scrollTop + x - originX, element_container);
    						},
    						element_container
    					);
    				},
    				element_container
    			);
    		}
    	});

    	const position = [
    		{ x: 50, y: 0 },
    		{ x: 35.4, y: -35.4 },
    		{ x: 0, y: -50 },
    		{ x: -35.4, y: -35.4 },
    		{ x: -50, y: 0 },
    		{ x: -35.4, y: 35.4 },
    		{ x: 0, y: 50 },
    		{ x: 35.4, y: 35.4 }
    	];

    	function stateHandle() {
    		let State = growth$1.role[$data.role];
    		let chance = { blue: "蓝色", green: "绿色", red: "红色" };

    		return [
    			{
    				type: "maxHealth",
    				name: "最大生命值",
    				detail: "显而易见，生命值不会超过这个数。\n只有等级才能让这个数字提升。",
    				data: State.health
    			},
    			{
    				type: "attack",
    				name: "阶层",
    				detail: "打败BOSS进入下一阶层，总共有3个阶层。",
    				data: $data.stage
    			},
    			{
    				type: "speed",
    				name: "速度",
    				detail: "决定了回合中行动的自由度，速度快，能做的事也就会更多。\n抽牌数=基础抽牌数+(速度-敌人平均速度)，小数点后面部分就是多抽一张的概率。\n手牌上限=抽牌数+速度四舍五入。",
    				data: State.speed
    			},
    			{
    				type: "power",
    				name: "灵力",
    				detail: "牌左上角的数字就是其灵力消耗。灵力每回合初都会回复至上限。\n额外灵力：等同于灵力，优先消耗，上限等同于牌库总牌数。",
    				data: State.power
    			},
    			{
    				type: "health",
    				name: "生命值",
    				detail: "必须不让它归零才行。",
    				data: $data.health
    			},
    			{
    				type: "sugar",
    				name: "糖",
    				detail: "面临选择时可用选项的数量。",
    				data: $data.sugar
    			},
    			{
    				type: "left_card",
    				name: "牌库数量",
    				detail: "等级越高越强大。\n只能通过战斗提升等级。",
    				data: Object.values($data.card).sum()
    			},
    			{
    				type: "chance",
    				name: "机会",
    				detail: `剩余${$data.chance.amount}次战败时回到战斗前的机会。机会消耗时，回复生命值并获得一件${chance[$data.chance.type]}收藏品。`,
    				data: $data.chance.amount
    			}
    		];
    	}

    	function menuHandle(e) {
    		e && e.preventDefault();

    		if ($page == "Index") return; else if (["Afflatus", "Foreword", "Archive"].includes($page)) set_store_value(page, $page = "Index", $page); else {
    			$$invalidate(2, state = stateHandle());
    			$$invalidate(0, enable = !enable);
    		}
    	}

    	const writable_props = [];

    	Object_1$f.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Menu> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value, i) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_state[i] = $$value;
    			$$invalidate(3, element_state);
    		});
    	}

    	function img_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_role = $$value;
    			$$invalidate(10, element_role);
    		});
    	}

    	function div4_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_coin = $$value;
    			$$invalidate(7, element_coin);
    		});
    	}

    	const click_handler = _ => {
    		$$invalidate(0, enable = false);
    		set_store_value(page, $page = "Index", $page);
    	};

    	const click_handler_1 = _ => $$invalidate(1, index = "spellcards");
    	const click_handler_2 = _ => $$invalidate(1, index = "collection");
    	const click_handler_3 = _ => $$invalidate(1, index = "consumable");
    	const click_handler_4 = _ => $$invalidate(1, index = "annotation");

    	function div_binding_1($$value, i) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_collection[i] = $$value;
    			$$invalidate(4, element_collection);
    		});
    	}

    	function div_binding_2($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_container.collection = $$value;
    			$$invalidate(6, element_container);
    		});
    	}

    	function div_binding_3($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_container.spellcards = $$value;
    			$$invalidate(6, element_container);
    		});
    	}

    	function div_binding_4($$value, i) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_consumable[i] = $$value;
    			$$invalidate(5, element_consumable);
    		});
    	}

    	function div_binding_5($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_container.consumable = $$value;
    			$$invalidate(6, element_container);
    		});
    	}

    	function div_binding_6($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_container.annotation = $$value;
    			$$invalidate(6, element_container);
    		});
    	}

    	function div_binding_7($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_equipment = $$value;
    			$$invalidate(8, element_equipment);
    		});
    	}

    	function div_binding_8($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_souvenir = $$value;
    			$$invalidate(9, element_souvenir);
    		});
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		beforeUpdate,
    		afterUpdate,
    		fade,
    		scale,
    		data: data$1,
    		page,
    		setting,
    		Explain,
    		Admin,
    		collection: collection$2,
    		equipment: equipment$1,
    		souvenir: souvenir$1,
    		consumable: consumable$1,
    		role,
    		growth: growth$1,
    		Card,
    		annotation,
    		menu,
    		enable,
    		index,
    		state,
    		element_state,
    		element_collection,
    		element_consumable,
    		element_container,
    		element_coin,
    		element_equipment,
    		element_souvenir,
    		element_role,
    		position,
    		stateHandle,
    		menuHandle,
    		$page,
    		$data,
    		$Explain,
    		$Admin,
    		$setting
    	});

    	$$self.$inject_state = $$props => {
    		if ('enable' in $$props) $$invalidate(0, enable = $$props.enable);
    		if ('index' in $$props) $$invalidate(1, index = $$props.index);
    		if ('state' in $$props) $$invalidate(2, state = $$props.state);
    		if ('element_coin' in $$props) $$invalidate(7, element_coin = $$props.element_coin);
    		if ('element_equipment' in $$props) $$invalidate(8, element_equipment = $$props.element_equipment);
    		if ('element_souvenir' in $$props) $$invalidate(9, element_souvenir = $$props.element_souvenir);
    		if ('element_role' in $$props) $$invalidate(10, element_role = $$props.element_role);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		enable,
    		index,
    		state,
    		element_state,
    		element_collection,
    		element_consumable,
    		element_container,
    		element_coin,
    		element_equipment,
    		element_souvenir,
    		element_role,
    		$page,
    		$data,
    		$setting,
    		position,
    		menu,
    		div_binding,
    		img_binding,
    		div4_binding,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		div_binding_1,
    		div_binding_2,
    		div_binding_3,
    		div_binding_4,
    		div_binding_5,
    		div_binding_6,
    		div_binding_7,
    		div_binding_8
    	];
    }

    class Menu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$C, create_fragment$C, safe_not_equal, { menu: 15 }, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Menu",
    			options,
    			id: create_fragment$C.name
    		});
    	}

    	get menu() {
    		return this.$$.ctx[15];
    	}

    	set menu(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\addon\explain.svelte generated by Svelte v3.59.2 */
    const file$B = "src\\addon\\explain.svelte";

    // (86:0) {#if visibility == "show" || $Admin.mobile}
    function create_if_block$a(ctx) {
    	let div;
    	let span;
    	let t0;
    	let t1;
    	let a;
    	let t2;
    	let div_intro;
    	let div_outro;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text(/*title*/ ctx[0]);
    			t1 = space();
    			a = element("a");
    			t2 = text(/*detail*/ ctx[1]);
    			set_style(span, "background-color", "var(--" + /*color*/ ctx[2] + ")");
    			attr_dev(span, "class", "svelte-1srvrkr");
    			add_location(span, file$B, 93, 4, 2526);
    			attr_dev(a, "class", "svelte-1srvrkr");
    			add_location(a, file$B, 94, 4, 2592);
    			attr_dev(div, "class", "explain svelte-1srvrkr");
    			set_style(div, "left", /*x*/ ctx[3] + "px");
    			set_style(div, "top", /*y*/ ctx[4] + "px");
    			set_style(div, "visibility", /*title*/ ctx[0] ? 'visible' : 'hidden');
    			add_location(div, file$B, 86, 2, 2328);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(div, t1);
    			append_dev(div, a);
    			append_dev(a, t2);
    			/*div_binding*/ ctx[8](div);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);

    			if (!current || dirty & /*color*/ 4) {
    				set_style(span, "background-color", "var(--" + /*color*/ ctx[2] + ")");
    			}

    			if (!current || dirty & /*detail*/ 2) set_data_dev(t2, /*detail*/ ctx[1]);

    			if (!current || dirty & /*x*/ 8) {
    				set_style(div, "left", /*x*/ ctx[3] + "px");
    			}

    			if (!current || dirty & /*y*/ 16) {
    				set_style(div, "top", /*y*/ ctx[4] + "px");
    			}

    			if (!current || dirty & /*title*/ 1) {
    				set_style(div, "visibility", /*title*/ ctx[0] ? 'visible' : 'hidden');
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!current) return;
    				if (div_outro) div_outro.end(1);
    				div_intro = create_in_transition(div, fade, { duration: 100 });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fade, { duration: 100 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*div_binding*/ ctx[8](null);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$a.name,
    		type: "if",
    		source: "(86:0) {#if visibility == \\\"show\\\" || $Admin.mobile}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$B(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = (/*visibility*/ ctx[5] == "show" || /*$Admin*/ ctx[7].mobile) && create_if_block$a(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*visibility*/ ctx[5] == "show" || /*$Admin*/ ctx[7].mobile) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*visibility, $Admin*/ 160) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$a(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
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
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$B.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$B($$self, $$props, $$invalidate) {
    	let $Admin;
    	let $Explain;
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(7, $Admin = $$value));
    	validate_store(Explain, 'Explain');
    	component_subscribe($$self, Explain, $$value => $$invalidate(9, $Explain = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Explain', slots, []);
    	let title;
    	let detail;
    	let color;
    	let x;
    	let y;
    	let visibility = "hide";
    	let E;
    	set_store_value(Explain, $Explain = explain, $Explain);

    	const handle = {
    		move: (e, info, c) => {
    			$$invalidate(0, title = info.name);
    			$$invalidate(1, detail = info.detail);
    			$$invalidate(2, color = c);

    			$$invalidate(3, x = document.body.clientWidth - e.x > 240
    			? e.x + 5
    			: e.x - 230);

    			$$invalidate(4, y = e.y - E.offsetHeight - 5);
    		},
    		show: (e, info, c) => {
    			$$invalidate(5, visibility = "show");
    			$$invalidate(0, title = info.name);
    			$$invalidate(1, detail = info.detail);
    			$$invalidate(2, color = c);

    			if ($Admin.mobile) {
    				if (!e.x) e.x = e.touches[0].pageX;
    				if (!e.y) e.y = e.touches[0].pageY;
    				let root = document.getElementById("root");
    				$$invalidate(3, x = (e.y - (document.body.clientHeight / $Admin.mobile - root.clientWidth) / 2) / $Admin.mobile - 20);
    				$$invalidate(4, y = root.clientHeight - e.x / $Admin.mobile - 5);
    				setTimeout(_ => window.ontouchstart = handle.hide);
    			} else {
    				$$invalidate(3, x = document.body.clientWidth - e.x > 240
    				? e.x + 5
    				: e.x - 230);

    				$$invalidate(4, y = e.y - 5);
    			}
    		},
    		hide: _ => {
    			window.ontouchstart = null;
    			$$invalidate(5, visibility = "hide");
    			$$invalidate(0, title = null);
    		}
    	};

    	onMount(function () {
    		if ($Admin.mobile) {
    			$$invalidate(6, E.ontouchstart = handle.hide, E);
    		}
    	});

    	afterUpdate(function () {
    		if (E) {
    			$$invalidate(6, E.onmouseenter = handle.hide, E);
    			if ($Admin.mobile) $$invalidate(4, y -= E.clientHeight);
    		}
    	});

    	function explain(element) {
    		return {
    			color(color) {
    				this.Color = color;
    				return this;
    			},
    			with(info) {
    				let color = this.Color ? this.Color : "blue";
    				this.color = false;

    				if (element && info) {
    					element.ontouchstart = e => handle.show(e, info, color);

    					if (!$Admin.mobile) {
    						element.onmouseenter = e => handle.show(e, info, color);
    						element.onmousemove = e => handle.move(e, info, color);
    						element.onmouseleave = _ => handle.hide();
    					}
    				}
    			}
    		};
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Explain> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			E = $$value;
    			$$invalidate(6, E);
    		});
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		beforeUpdate,
    		afterUpdate,
    		fade,
    		scale,
    		Explain,
    		Admin,
    		title,
    		detail,
    		color,
    		x,
    		y,
    		visibility,
    		E,
    		handle,
    		explain,
    		$Admin,
    		$Explain
    	});

    	$$self.$inject_state = $$props => {
    		if ('title' in $$props) $$invalidate(0, title = $$props.title);
    		if ('detail' in $$props) $$invalidate(1, detail = $$props.detail);
    		if ('color' in $$props) $$invalidate(2, color = $$props.color);
    		if ('x' in $$props) $$invalidate(3, x = $$props.x);
    		if ('y' in $$props) $$invalidate(4, y = $$props.y);
    		if ('visibility' in $$props) $$invalidate(5, visibility = $$props.visibility);
    		if ('E' in $$props) $$invalidate(6, E = $$props.E);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, detail, color, x, y, visibility, E, $Admin, div_binding];
    }

    class Explain_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$B, create_fragment$B, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Explain_1",
    			options,
    			id: create_fragment$B.name
    		});
    	}
    }

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

    /* src\page\index.svelte generated by Svelte v3.59.2 */
    const file$A = "src\\page\\index.svelte";

    function get_each_context$g(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	child_ctx[27] = i;
    	return child_ctx;
    }

    // (63:2) {#if !pressed}
    function create_if_block_3$3(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_4$3, create_else_block_1$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*word*/ ctx[14]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if_block.p(ctx, dirty);
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
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$3.name,
    		type: "if",
    		source: "(63:2) {#if !pressed}",
    		ctx
    	});

    	return block;
    }

    // (75:4) {:else}
    function create_else_block_1$1(ctx) {
    	let txt;
    	let txt_outro;
    	let current;

    	const block = {
    		c: function create() {
    			txt = element("txt");
    			txt.textContent = "Press Any Key";
    			attr_dev(txt, "class", "launch svelte-zu4yik");
    			add_location(txt, file$A, 75, 6, 2456);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, txt, anchor);
    			current = true;
    		},
    		p: noop,
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
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(75:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (64:4) {#if word}
    function create_if_block_4$3(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let div_outro;
    	let current;

    	let each_value = [
    		/*txt1*/ ctx[2],
    		/*txt2*/ ctx[3],
    		/*txt3*/ ctx[4],
    		/*txt4*/ ctx[5],
    		/*txt5*/ ctx[6],
    		/*txt6*/ ctx[7],
    		/*txt7*/ ctx[8],
    		/*txt8*/ ctx[9],
    		/*txt9*/ ctx[10],
    		/*txt0*/ ctx[11]
    	];

    	validate_each_argument(each_value);
    	const get_key = ctx => /*i*/ ctx[27];
    	validate_each_keys(ctx, each_value, get_each_context$g, get_key);

    	for (let i = 0; i < 10; i += 1) {
    		let child_ctx = get_each_context$g(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$g(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < 10; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "words svelte-zu4yik");
    			add_location(div, file$A, 64, 6, 2086);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < 10; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*txt1, txt2, txt3, txt4, txt5, txt6, txt7, txt8, txt9, txt0, r*/ 4092) {
    				each_value = [
    					/*txt1*/ ctx[2],
    					/*txt2*/ ctx[3],
    					/*txt3*/ ctx[4],
    					/*txt4*/ ctx[5],
    					/*txt5*/ ctx[6],
    					/*txt6*/ ctx[7],
    					/*txt7*/ ctx[8],
    					/*txt8*/ ctx[9],
    					/*txt9*/ ctx[10],
    					/*txt0*/ ctx[11]
    				];

    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$g, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, destroy_block, create_each_block$g, null, get_each_context$g);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (div_outro) div_outro.end(1);
    			current = true;
    		},
    		o: function outro(local) {
    			div_outro = create_out_transition(div, fade, { duration: 250 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < 10; i += 1) {
    				each_blocks[i].d();
    			}

    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$3.name,
    		type: "if",
    		source: "(64:4) {#if word}",
    		ctx
    	});

    	return block;
    }

    // (66:8) {#each [txt1, txt2, txt3, txt4, txt5, txt6, txt7, txt8, txt9, txt0] as p, i (i)}
    function create_each_block$g(key_1, ctx) {
    	let txt;
    	let t0_value = /*p*/ ctx[25].word + "";
    	let t0;
    	let t1;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			txt = element("txt");
    			t0 = text(t0_value);
    			t1 = space();
    			set_style(txt, "left", /*p*/ ctx[25].x);
    			set_style(txt, "top", /*p*/ ctx[25].y);
    			set_style(txt, "font-size", 26 - r$4() * 8 + "px");
    			set_style(txt, "animation-delay", /*i*/ ctx[27] * 0.2 + "s");
    			attr_dev(txt, "class", "svelte-zu4yik");
    			add_location(txt, file$A, 66, 10, 2236);
    			this.first = txt;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, txt, anchor);
    			append_dev(txt, t0);
    			append_dev(txt, t1);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*txt1, txt2, txt3, txt4, txt5, txt6, txt7, txt8, txt9, txt0*/ 4092 && t0_value !== (t0_value = /*p*/ ctx[25].word + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*txt1, txt2, txt3, txt4, txt5, txt6, txt7, txt8, txt9, txt0*/ 4092) {
    				set_style(txt, "left", /*p*/ ctx[25].x);
    			}

    			if (dirty & /*txt1, txt2, txt3, txt4, txt5, txt6, txt7, txt8, txt9, txt0*/ 4092) {
    				set_style(txt, "top", /*p*/ ctx[25].y);
    			}

    			if (dirty & /*txt1, txt2, txt3, txt4, txt5, txt6, txt7, txt8, txt9, txt0*/ 4092) {
    				set_style(txt, "animation-delay", /*i*/ ctx[27] * 0.2 + "s");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(txt);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$g.name,
    		type: "each",
    		source: "(66:8) {#each [txt1, txt2, txt3, txt4, txt5, txt6, txt7, txt8, txt9, txt0] as p, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (119:2) {:else}
    function create_else_block$2(ctx) {
    	let txt;

    	const block = {
    		c: function create() {
    			txt = element("txt");
    			txt.textContent = "幻想异闻录";
    			attr_dev(txt, "class", "title svelte-zu4yik");
    			add_location(txt, file$A, 119, 4, 3613);
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
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(119:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (79:2) {#if doodle}
    function create_if_block_2$5(ctx) {
    	let div;
    	let css_doodle;
    	let style;

    	const block = {
    		c: function create() {
    			div = element("div");
    			css_doodle = element("css-doodle");
    			style = element("style");
    			style.textContent = ":doodle {\r\n            @grid: 13 / 100vmax;\r\n            @min-size: 800px;\r\n          }\r\n          :container {\r\n            transform: rotateY(30deg) rotate(10deg) scale(1.5);\r\n          }\r\n          :after {\r\n            content: \"\";\r\n            @size: 61.8%;\r\n            background-size: @rand (5%, 50%) @rand (5%, 50%);\r\n            background-position: center;\r\n          }\r\n          @even {\r\n            background: #df0054;\r\n            :after {\r\n              background-image: linear-gradient(\r\n                0deg,\r\n                #f7f1e7 50%,\r\n                transparent 50%\r\n              );\r\n            }\r\n          }\r\n          @odd {\r\n            background: @pick (#f7f1e7, #10004a);\r\n            :after {\r\n              background-image: linear-gradient(\r\n                90deg,\r\n                #df0054 50%,\r\n                transparent 50%\r\n              );\r\n            }\r\n          }";
    			add_location(style, file$A, 81, 8, 2615);
    			add_location(css_doodle, file$A, 80, 6, 2593);
    			attr_dev(div, "class", "title svelte-zu4yik");
    			add_location(div, file$A, 79, 4, 2566);
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
    		id: create_if_block_2$5.name,
    		type: "if",
    		source: "(79:2) {#if doodle}",
    		ctx
    	});

    	return block;
    }

    // (122:2) {#if pressed}
    function create_if_block$9(ctx) {
    	let div;
    	let show_if = localStorage.getItem("explore") && localStorage.getItem("explore").length > 10;
    	let t0;
    	let txt0_1;
    	let t2;
    	let txt1_1;
    	let t4;
    	let txt2_1;
    	let div_intro;
    	let mounted;
    	let dispose;
    	let if_block = show_if && create_if_block_1$7(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			txt0_1 = element("txt");
    			txt0_1.textContent = "开始";
    			t2 = space();
    			txt1_1 = element("txt");
    			txt1_1.textContent = "灵感";
    			t4 = space();
    			txt2_1 = element("txt");
    			txt2_1.textContent = "记录";
    			attr_dev(txt0_1, "class", "svelte-zu4yik");
    			add_location(txt0_1, file$A, 126, 6, 3907);
    			attr_dev(txt1_1, "class", "svelte-zu4yik");
    			add_location(txt1_1, file$A, 127, 6, 3967);
    			attr_dev(txt2_1, "class", "svelte-zu4yik");
    			add_location(txt2_1, file$A, 128, 6, 4027);
    			attr_dev(div, "class", "menu svelte-zu4yik");
    			add_location(div, file$A, 122, 4, 3675);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, txt0_1);
    			append_dev(div, t2);
    			append_dev(div, txt1_1);
    			append_dev(div, t4);
    			append_dev(div, txt2_1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(txt0_1, "click", /*click_handler_1*/ ctx[16], false, false, false, false),
    					listen_dev(txt1_1, "click", /*click_handler_2*/ ctx[17], false, false, false, false),
    					listen_dev(txt2_1, "click", /*click_handler_3*/ ctx[18], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (show_if) if_block.p(ctx, dirty);
    		},
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
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$9.name,
    		type: "if",
    		source: "(122:2) {#if pressed}",
    		ctx
    	});

    	return block;
    }

    // (124:6) {#if localStorage.getItem("explore") && localStorage.getItem("explore").length > 10}
    function create_if_block_1$7(ctx) {
    	let txt;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			txt = element("txt");
    			txt.textContent = "继续";
    			attr_dev(txt, "class", "svelte-zu4yik");
    			add_location(txt, file$A, 124, 8, 3835);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, txt, anchor);

    			if (!mounted) {
    				dispose = listen_dev(txt, "click", /*click_handler*/ ctx[15], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(txt);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$7.name,
    		type: "if",
    		source: "(124:6) {#if localStorage.getItem(\\\"explore\\\") && localStorage.getItem(\\\"explore\\\").length > 10}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$A(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let t2;
    	let txt0_1;
    	let t4;
    	let txt1_1;
    	let t6;
    	let txt2_1;
    	let t8;
    	let icon;
    	let div_intro;
    	let div_outro;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = !/*pressed*/ ctx[1] && create_if_block_3$3(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*doodle*/ ctx[13]) return create_if_block_2$5;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block1 = current_block_type(ctx);
    	let if_block2 = /*pressed*/ ctx[1] && create_if_block$9(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			t2 = space();
    			txt0_1 = element("txt");
    			txt0_1.textContent = "测试";
    			t4 = space();
    			txt1_1 = element("txt");
    			txt1_1.textContent = "测试";
    			t6 = space();
    			txt2_1 = element("txt");
    			txt2_1.textContent = "测试";
    			t8 = space();
    			icon = element("icon");
    			set_style(txt0_1, "color", "transparent");
    			set_style(txt0_1, "font-family", "remark");
    			set_style(txt0_1, "position", "absolute");
    			add_location(txt0_1, file$A, 133, 2, 4154);
    			set_style(txt1_1, "color", "transparent");
    			set_style(txt1_1, "font-family", "write");
    			set_style(txt1_1, "position", "absolute");
    			add_location(txt1_1, file$A, 135, 2, 4239);
    			set_style(txt2_1, "color", "transparent");
    			set_style(txt2_1, "font-family", "normal");
    			set_style(txt2_1, "position", "absolute");
    			add_location(txt2_1, file$A, 136, 2, 4319);
    			attr_dev(icon, "class", "icon-pull pull svelte-zu4yik");
    			add_location(icon, file$A, 138, 2, 4404);
    			attr_dev(div, "class", "body svelte-zu4yik");
    			add_location(div, file$A, 56, 0, 1915);
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
    			append_dev(div, t2);
    			append_dev(div, txt0_1);
    			append_dev(div, t4);
    			append_dev(div, txt1_1);
    			append_dev(div, t6);
    			append_dev(div, txt2_1);
    			append_dev(div, t8);
    			append_dev(div, icon);
    			/*icon_binding*/ ctx[19](icon);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler_4*/ ctx[20], { once: true }, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*pressed*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*pressed*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_3$3(ctx);
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

    			if (/*pressed*/ ctx[1]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*pressed*/ 2) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block$9(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div, t2);
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
    			/*icon_binding*/ ctx[19](null);
    			if (detaching && div_outro) div_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$A.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function r$4() {
    	return Math.random();
    }

    function instance$A($$self, $$props, $$invalidate) {
    	let $explore;
    	let $data;
    	let $Explain;
    	let $page;
    	validate_store(explore, 'explore');
    	component_subscribe($$self, explore, $$value => $$invalidate(21, $explore = $$value));
    	validate_store(data$1, 'data');
    	component_subscribe($$self, data$1, $$value => $$invalidate(22, $data = $$value));
    	validate_store(Explain, 'Explain');
    	component_subscribe($$self, Explain, $$value => $$invalidate(23, $Explain = $$value));
    	validate_store(page, 'page');
    	component_subscribe($$self, page, $$value => $$invalidate(12, $page = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Page', slots, []);

    	afterUpdate(function () {
    		$Explain && $Explain(element_pull).with({
    			name: "同步最新内容",
    			detail: "这将重新加载静态缓存文件，或许需要一小段时间。"
    		});

    		$$invalidate(0, element_pull.onclick = _ => window.location.replace(window.location.href), element_pull);
    	});

    	let element_pull;
    	let doodle = false;
    	let pressed = false;
    	let word = true;
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
    	setTimeout(_ => setInterval(_ => $$invalidate(2, txt1 = random()), 2000), 200 * 0);
    	setTimeout(_ => setInterval(_ => $$invalidate(3, txt2 = random()), 2000), 200 * 1);
    	setTimeout(_ => setInterval(_ => $$invalidate(4, txt3 = random()), 2000), 200 * 2);
    	setTimeout(_ => setInterval(_ => $$invalidate(5, txt4 = random()), 2000), 200 * 3);
    	setTimeout(_ => setInterval(_ => $$invalidate(6, txt5 = random()), 2000), 200 * 4);
    	setTimeout(_ => setInterval(_ => $$invalidate(7, txt6 = random()), 2000), 200 * 5);
    	setTimeout(_ => setInterval(_ => $$invalidate(8, txt7 = random()), 2000), 200 * 6);
    	setTimeout(_ => setInterval(_ => $$invalidate(9, txt8 = random()), 2000), 200 * 7);
    	setTimeout(_ => setInterval(_ => $$invalidate(10, txt9 = random()), 2000), 200 * 8);
    	setTimeout(_ => setInterval(_ => $$invalidate(11, txt0 = random()), 2000), 200 * 9);

    	function random() {
    		return {
    			x: `${-40 - 160 * r$4()}px`,
    			y: `${80 - 160 * r$4()}px`,
    			word: words[Math.floor(r$4() * words.length)]
    		};
    	}

    	set_store_value(data$1, $data = JSON.parse(localStorage.getItem("data")), $data);
    	set_store_value(explore, $explore = JSON.parse(localStorage.getItem("explore")), $explore);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Page> was created with unknown prop '${key}'`);
    	});

    	const click_handler = _ => set_store_value(page, $page = "Explore", $page);
    	const click_handler_1 = _ => set_store_value(page, $page = "Foreword", $page);
    	const click_handler_2 = _ => set_store_value(page, $page = "Afflatus", $page);
    	const click_handler_3 = _ => set_store_value(page, $page = "Archive", $page);

    	function icon_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_pull = $$value;
    			$$invalidate(0, element_pull);
    		});
    	}

    	const click_handler_4 = _ => $$invalidate(1, pressed = true);

    	$$self.$capture_state = () => ({
    		onMount,
    		afterUpdate,
    		fade,
    		scale,
    		page,
    		ctrl,
    		explore,
    		data: data$1,
    		Explain,
    		words,
    		element_pull,
    		doodle,
    		pressed,
    		word,
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
    		r: r$4,
    		$explore,
    		$data,
    		$Explain,
    		$page
    	});

    	$$self.$inject_state = $$props => {
    		if ('element_pull' in $$props) $$invalidate(0, element_pull = $$props.element_pull);
    		if ('doodle' in $$props) $$invalidate(13, doodle = $$props.doodle);
    		if ('pressed' in $$props) $$invalidate(1, pressed = $$props.pressed);
    		if ('word' in $$props) $$invalidate(14, word = $$props.word);
    		if ('txt1' in $$props) $$invalidate(2, txt1 = $$props.txt1);
    		if ('txt2' in $$props) $$invalidate(3, txt2 = $$props.txt2);
    		if ('txt3' in $$props) $$invalidate(4, txt3 = $$props.txt3);
    		if ('txt4' in $$props) $$invalidate(5, txt4 = $$props.txt4);
    		if ('txt5' in $$props) $$invalidate(6, txt5 = $$props.txt5);
    		if ('txt6' in $$props) $$invalidate(7, txt6 = $$props.txt6);
    		if ('txt7' in $$props) $$invalidate(8, txt7 = $$props.txt7);
    		if ('txt8' in $$props) $$invalidate(9, txt8 = $$props.txt8);
    		if ('txt9' in $$props) $$invalidate(10, txt9 = $$props.txt9);
    		if ('txt0' in $$props) $$invalidate(11, txt0 = $$props.txt0);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		element_pull,
    		pressed,
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
    		$page,
    		doodle,
    		word,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		icon_binding,
    		click_handler_4
    	];
    }

    class Page extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$A, create_fragment$A, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Page",
    			options,
    			id: create_fragment$A.name
    		});
    	}
    }

    const cirno = {
      name: "冰之妖精",
      intro: "冷酷的智者",
      detail: "奇数回合攻击附加[迟缓]，偶数回合攻击附加[疲倦]。",
      type: "normal",
      scene: ["shrine", "town"],
      growth: {
        health: 1,
        attack: 1,
        speed: 1.2
      },
      action: (Admin, index) => {
        Admin.role.damage.target(0).from(index).by({
          type: "scale",
          value: 100,
        });
        if (Admin.role.event.round.count % 2 == 0) Admin.role.buff.of(0).add("tardy", 2);
        else Admin.role.buff.of(0).add("tired", 1);
      }
    };

    const mokou = {
      name: "藤原妹红",
      intro: "不死的火鸟",
      detail: "每回合回复已损失生命的一半并造成等量伤害。",
      type: "boss",
      growth: {
        health: 4,
        attack: 2,
        speed: 1.5
      },
      action: function (Admin, index) {
        let state = Admin.enermy.state.of(index).get();
        let hurt = state.health - state.Health;
        Admin.role.damage.target(0).by({
          type: "static",
          value: hurt / 2
        });
        Admin.enermy.heal.target(index).by({
          type: "static",
          value: hurt / 2
        });
      }
    };

    const piece = {
      name: "地狱的妖精",
      intro: "拥有使人发狂程度的能力",
      detail: "攻击附加[燃烧]，低生命时为全体附加[力量]。",
      type: "normal",
      scene: ["shrine", "town"],
      growth: {
        health: 1,
        attack: 1.2,
        speed: 1
      },
      action: (Admin, index) => {
        Admin.role.damage.target(0).from(index).by({
          type: "scale",
          value: 100,
        });
        let state = Admin.enermy.state.of(index).get();
        if (state.Health / state.health < 0.5) Admin.enermy.buff.addAll("strength", 5);
        Admin.role.buff.of(0).add("burning", 2);
      }
    };

    const lilywhite = {
      name: "报春的妖精",
      intro: "拥有告知春天到来程度的能力",
      detail: "不受任何效果影响，且攻击造成随机伤害。",
      type: "normal",
      scene: ["shrine", "forest"],
      growth: {
        health: 0.8,
        attack: 1.2,
        speed: 1
      },
      action: (Admin, index) => {
        let r = Math.random();
        Admin.role.damage.target(0).from(index).by({
          type: "scale",
          value: 200 - r * 100,
        });
        Admin.enermy.buff.of(index).clearAll();
      }
    };

    const eternity = {
      name: "凤蝶的妖精",
      intro: "拥有播撒鳞粉程度的能力",
      detail: "攻击造成穿透伤害，附加[恍惚]效果",
      type: "normal",
      scene: ["shrine", "forest"],
      growth: {
        health: 1.2,
        attack: 1,
        speed: 1.3
      },
      action: (Admin, index) => {
        Admin.role.damage.target(0).from(index).by({
          type: "scale",
          value: 100,
          penetrate: true
        });
        Admin.role.buff.of(0).add("trance", 2);
      }
    };

    const chen = {
      name: "橙",
      intro: "生活在迷途之家的猫妖",
      detail: "灵活的猫妖，速度大于目标时会先手行动，且造成的伤害为穿透伤害。",
      type: "elite",
      scene: ["shrine", "town"],
      growth: {
        health: 2,
        attack: 2,
        speed: 1.7
      },
      action: (Admin, index) => {
        Admin.role.damage.target(0).from(index).by({
          type: "scale",
          value: 40,
          amount: 4,
          penetrate: true
        });
        Admin.role.buff.of(0).add("bleed", 1);
      },
      onload: (Admin, index) => {
        if (Admin.role.state.of(0).get().speed < Admin.enermy.state.of(index).get().speed)
          Admin.role.damage.target(0).from(index).by({
            type: "scale",
            value: 80,
            penetrate: true
          });
      }
    };

    const daiyousei = {
      name: "大妖精",
      intro: "路过的较强妖精",
      detail: "回合初获得[自然加护]。",
      type: "elite",
      scene: ["shrine", "town"],
      growth: {
        health: 1.5,
        attack: 2,
        speed: 1.3
      },
      onload: (Admin, index) => {
        Admin.enermy.buff.of(index).set("natral_protect", 4);
      }, 
      action: (Admin, index) => {
        Admin.enermy.buff.of(index).set("natral_protect", 4);
        Admin.role.damage.target(0).from(index).by({
          type: "scale",
          value: 80,
        });
      }
    };

    const medicine = {
      name: "梅蒂欣",
      intro: "扔到铃兰田的人偶化作的妖怪",
      detail: "铃兰花毒素的化身。\n生命值低于40%时吸收目标身上一半的[忧郁之毒]，回复等量生命。",
      type: "boss",
      growth: {
        health: 3,
        attack: 2,
        speed: 1.2
      },
      onload: function (Admin, index) {
        Admin.enermy.buff.of(index).set("poison_body", 1);
      },
      action: function (Admin, index) {
        let state = Admin.enermy.state.of(index).get();
        if (state.Health / state.health < 0.4) {
          let amount = Admin.role.buff.of(0).get("blue_poison");
          Admin.enermy.heal.target(index).by({
            type: "static",
            value: retain(amount / 2, 0)
          });
          Admin.role.buff.of(0).clear("blue_poison", retain(amount / 2, 0));
        }
        Admin.role.buff.of(0).add("blue_poison", retain(state.Health * 0.05, 0));
      }
    };

    const kanako = {
      name: "八坂神奈子",
      intro: "守矢神社祭祀的神之一，是蛇神和战神",
      detail: "每回合获得能阻挡伤害的[乾之盾]，奇数回合丢弃目标两张牌，偶数回合进行攻击。",
      type: "boss",
      growth: {
        health: 3.5,
        attack: 2,
        speed: 1
      },
      onload: function (Admin, index) {
        let state = Admin.enermy.state.of(index).get();
        Admin.enermy.buff.of(index).add("qianzhidun", retain(state.health / 9, 0));
      },
      action: function (Admin, index) {
        let state = Admin.enermy.state.of(index).get();
        Admin.enermy.buff.of(index).add("qianzhidun", retain(state.health / 9, 0));
        if (Admin.role.event.round.count % 2 == 0) Admin.role.damage.target(0).from(index).by({
          type: "scale",
          value: 200
        });
        else Admin.handcard.abandon.amount(2).fromHolds();
      }
    };

    const sunny = {
      name: "日光的妖精",
      intro: "具有操纵光的折射程度的能力",
      detail: "攻击造成多段伤害，还会回血。",
      type: "normal",
      scene: ["forest", "town"],
      growth: {
        health: 1.2,
        attack: 1,
        speed: 1
      },
      action: (Admin, index) => {
        Admin.role.damage.target(0).from(index).by({
          type: "scale",
          value: 80,
        });
        Admin.role.damage.target(0).from(index).by({
          type: "scale",
          value: 60,
        });
        Admin.role.damage.target(0).from(index).by({
          type: "scale",
          value: 40,
        });
        Admin.role.damage.target(0).from(index).by({
          type: "scale",
          value: 20,
        });
        let state = Admin.enermy.state.of(index).get();
        Admin.enermy.heal.targetAll().by({
          type: "static",
          value: (state.health - state.Health) / 4
        });
      }
    };

    const lunar = {
      name: "月光的妖精",
      intro: "拥有消除周围声音程度的能力",
      detail: "攻击时丢弃目标一张牌，还会回血。",
      type: "normal",
      scene: ["forest", "town"],
      growth: {
        health: 1,
        attack: 1,
        speed: 1
      },
      action: (Admin, index) => {
        Admin.role.damage.target(0).from(index).by({
          type: "scale",
          value: 150
        });
        Admin.handcard.abandon.amount(1).fromHolds();
        let state = Admin.enermy.state.of(index).get();
        Admin.enermy.heal.targetAll().by({
          type: "static",
          value: (state.health - state.Health) / 4
        });
      }
    };

    const star = {
      name: "星光的妖精",
      intro: "感应到活动事物程度的能力",
      detail: "攻击附加虚弱，为全体附加力量，受攻击时50%概率闪避。",
      type: "normal",
      scene: ["forest", "town"],
      growth: {
        health: 0.8,
        attack: 1,
        speed: 1
      },
      action: (Admin, index) => {
        Admin.role.damage.target(0).from(index).by({
          type: "scale",
          value: 100,
        });
        Admin.role.buff.of(0).add("weak", 2*Admin.role.event.round.count);
        Admin.enermy.buff.addAll("strength", 2);
        Admin.enermy.buff.of(index).set("cautious", 5);
      }
    };

    const rumia = {
      name: "露米娅",
      intro: "拥有操纵黑暗程度的能力",
      detail: "会增加目标的卡牌灵力消耗，将目标所有牌的灵力消耗灵重新分配，并根据目标手牌数进行攻击。",
      type: "elite",
      scene: ["forest", "town"],
      growth: {
        health: 1.5,
        attack: 2,
        speed: 1.5
      },
      onload: (Admin, index) => {
        let cards = Admin.handcard.getAll();
        let currentOffset = Admin.handcard.getCostOffset().index;
        let totalCost = cards.map(c => c.cost).sum();
        totalCost += cards.length;
        let costs = cards.map(_ => 0);
        [...Array(totalCost).keys()].forEach(_ => {
          let target = [...costs.keys()].filter(i => costs[i] < 20);
          costs[target.rd()[0]]++;
        });
        costs.forEach((cost, i) => {
          Admin.handcard.setCost.byIndex(i, cost - cards[i].cost + currentOffset[i]);
        });
      },
      action: (Admin, index) => {
        Admin.role.damage.target(0).from(index).by({
          type: "scale",
          value: 60,
          amount: Admin.handcard.getHolds().length + 1
        });
      }
    };

    const narumi = {
      name: "矢田寺成美",
      intro: "在魔法森林的魔力驱动下得到生命的地藏像",
      detail: "会不断重生，随着被打败次数的增加而增加攻击、减少生命上限，唯有一击将其打败才是真正战胜她。",
      type: "elite",
      scene: ["forest", "town"],
      growth: {
        health: 1.5,
        attack: 2,
        speed: 1.3
      },
      onload: (Admin, index) => {
        if (!Admin.cache["narumi"]) Admin.cache["narumi"] = [];
        Admin.cache["narumi"][index] = 1;
      },
      action: (Admin, index) => {
        let count = Admin.cache["narumi"][index];
        Admin.role.damage.target(0).from(index).by({
          type: "scale",
          value: 50 * count
        });
        count > 1 && Admin.enermy.buff.of(index).set("magic_life", count - 1);
      }
    };

    const nitori = {
      name: "河童",
      intro: "拥有操纵水程度的能力",
      detail: "会妨碍目标的治疗，攻击时回复自身少量生命，第三回合初逃跑。",
      type: "normal",
      scene: ["town"],
      growth: {
        health: 1,
        attack: 1.2,
        speed: 1
      },
      onload: (Admin, index) => {
        Admin.role.buff.of(0).set("water_joke", 2);
      },
      action: (Admin, index) => {
        Admin.role.buff.of(0).set("water_joke", 2);
        Admin.role.damage.target(0).from(index).by({
          type: "scale",
          value: 70,
          amount: 2
        });
        let state = Admin.enermy.state.of(index).get();
        Admin.enermy.heal.target(index).by({
          type: "static",
          value: state.health * 0.1
        });
        if (Admin.role.event.round.count == 3) Admin.battle.runOutAway(index);
      }
    };

    const koakuma = {
      name: "小恶魔",
      intro: "不知为何出现在外界的神秘的恶魔",
      detail: "在自己的回合以外受到的伤害-90%，并造成等量反伤，攻击能力强，第四回合生命值变为1。",
      type: "elite",
      scene: ["town"],
      growth: {
        health: 1.2,
        attack: 2,
        speed: 1.3
      },
      onload: (Admin, index) => {
        Admin.enermy.buff.of(index).set("iron_skin", 9);
        if (!Admin.cache["koakuma"]) Admin.cache["koakuma"] = [];
        Admin.cache["koakuma"][index] = 1;
      }, 
      action: (Admin, index) => {
        Admin.enermy.buff.of(index).add("strength", 2);
        Admin.role.buff.of(0).add("bleed", 4);
        Admin.role.buff.of(0).add("burning", 4);
        Admin.role.damage.target(0).from(index).by({
          type: "scale",
          value: 180,
        });
        if (Admin.role.event.round.count == 3) {
          Admin.enermy.state.of(index).set("Health", 0.1);
        }
        Admin.enermy.buff.of(index).set("iron_skin", 9);
      }
    };

    const enermy$1 = {
      mokou,
      cirno,
      piece,
      lilywhite,
      eternity,
      chen,
      daiyousei,
      medicine,
      kanako,
      sunny,
      lunar,
      star,
      rumia,
      narumi,
      nitori,
      koakuma
    };

    for (let e in enermy$1) {
      const mirror = {
        normal: "blue",
        elite: "green",
        boss: "red",
      };
      enermy$1[e].color = mirror[enermy$1[e].type];
      let g = enermy$1[e].growth;
      enermy$1[e].growth = lv => {
        return growth(lv, g);
      };
      let a = enermy$1[e].action;
      enermy$1[e].action = (Admin, index) => prepare(Admin, index, _ => a(Admin, index));
    }

    function prepare(Admin, index, handle) {
      let info = {
        valid: true,
        index: index,
      };
      sector.enermyAction(Admin, info);
      if (info.valid) handle();
    }

    function growth(lv, scale) {
      return {
        health: float(e(lv) * scale.health),
        attack: float(e(lv) * scale.attack / 8),
        speed: 1 + 0.02 * (lv - 1) * scale.speed,
      }
    }
    function e(lv) {
      return parseInt(Math.pow(Math.E, lv / (Math.log(lv + 1) + Math.sqrt(lv))) + lv + 10);
    }
    function float(v) {
      return v * 0.95 + Math.random().toFixed(2) * v * 0.1;
    }

    var collection$1 = {
      "baka": {
        "name": "冰雪聪明",
        "detail": "速度+0.2(每层+0.2)。",
        "positive": true
      },
      "shy_rabbit": {
        "name": "兔兔探头",
        "detail": "我只是害羞，我可不受。",
        "positive": true
      },
      "slow_power": {
        "name": "渐渐涌上来的POWER",
        "detail": "暴击率+5%(每层+5%)。",
        "positive": true
      },
      "in_treatment": {
        "name": "治疗中",
        "detail": "回合初回复5%(每层+5%)当前生命值。",
        "positive": true,
        "interim": true
      },
      "seal_needle": {
        "name": "封魔针",
        "detail": "造成8(每层-1)次伤害后，攻击对全体敌人附加流血。"
      },
      "cursed_wind": {
        "name": "诅咒之风",
        "detail": "接下来的1(每层+1)次攻击会驱散目标身上所有正面效果。生效时层数-1。",
        "positive": true,
        "expend": true
      },
      "star": {
        "name": "星星",
        "detail": "天上的星星不装在瓶子里可是会爆炸的！",
        "positive": true
      },
    };

    const marisa = {
      "hypodynamic": {
        "name": "乏力",
        "detail": "回合初失去所有灵力。",
        expend: true
      },
      "orrerys_sun": {
        "name": "太阳仪",
        "detail": "直接攻击在次回合造成120%*1(每层+1)间接伤害。生效时层数-1。",
        "positive": true
      },
      "marisa_time": {
        "name": "魔理沙时间",
        "detail": "暴击率+30%。",
        "positive": true,
        "interim": true
      },
      grand_cross: {
        name: "大十字",
        detail: "接下来的1(每层+1)次伤害，暴击伤害+100%。",
        positive: true,
        expend: true
      },
      test_slave: {
        name: "试验用使魔",
        detail: "所有伤害截走25%，在回合末合并结算为群体伤害。",
        positive: true
      },
      milky_way: {
        name: "银河",
        detail: "伤害+1",
        positive: true
      }
    };

    const youmu = {
      "Bright_Bitter_Wheel": {
        "name": "幽明的苦轮",
        "detail": "攻击附带60%间接伤害并回复1点灵力。生效时层数-1。",
        "positive": true,
        "expend": true
      },
      "flow": {
        "name": "流转",
        "detail": "普通攻击伤害提高40%。生效时层数-1。",
        "positive": true,
        "expend": true
      },
      "yanfan": {
        "name": "燕返",
        "detail": "普通攻击替换为「燕返: 对目标造成2*70%攻击力伤害」。生效时层数-1。",
        "positive": true,
        "expend": true
      },
      "meditation_slash": {
        "name": "冥想斩",
        "detail": "普通攻击消耗的灵力+1，伤害提高200%。每回合初清空。",
        "positive": true,
        "interim": true
      },
      "telepathism": {
        "name": "通灵",
        "detail": "10%(每层+10%)几率闪避下一次攻击。每回合初清空。",
        "positive": true,
        "interim": true
      },
      "six_roots_clean": {
        "name": "六根清净斩",
        "detail": "下次受到攻击时闪避，并造成15群体伤害",
        "positive": true,
        "expend": true
      },
    };

    const reisen = {
      illusory: {
        name: "虚幻",
        detail: "命中率*95%(每层*95%)。"
      },
      lunatic: {
        name: "狂气",
        detail: "受到的伤害+5%(每层+5%)。"
      },
      insanity: {
        name: "疯狂",
        detail: "受到1(每层+1)穿透伤害。"
      },
    };

    const reimu = {
      pure_happy: {
        name: "清欢",
        detail: "回合开始时造成1(每层+1)群体穿透伤害。每受到1伤害层数-2。",
        positive: true
      },
      font_safe: {
        name: "前方安全",
        detail: "造成伤害时，回复5生命值，获得恍惚*2。回合初清除。",
        interim: true,
        positive: true
      },
      hakurei_phantom: {
        name: "博丽幻影",
        detail: "40%概率闪避伤害，闪避时获得清欢*4。回合初清除。",
        interim: true,
        positive: true
      },
      trance_cage: {
        name: "妖怪拘禁符",
        detail: "下次行动变为附加恍惚*3。生效时层数-1。",
        expend: true
      },
      waiting_pearl: {
        name: "明珠暗投",
        detail: "回合初获得清欢*12，抽两张牌。生效时层数-1。",
        expend: true,
        positive: true
      }
    };

    const spellcard = {};

    Object.assign(spellcard, marisa);
    Object.assign(spellcard, youmu);
    Object.assign(spellcard, reisen);
    Object.assign(spellcard, reimu);

    const base = {
      rhythm: {
        name: "节奏感",
        detail: "打出通式时回复3(每层+3)生命值。",
        positive: true
      },
      magic_bean: {
        name: "魔豆",
        detail: "回合初获得2额外灵力，持续1(每层+1)回合。",
        positive: true,
        expend: true
      },
      blood_blade: {
        name: "血刃",
        detail: "造成伤害时，伤害+8，生命值-4。回合初移除。",
        interim: true
      },
      wrath: {
        name: "暴怒",
        detail: "普通攻击伤害+30%(每层+30%)。回合初移除。",
        interim: true
      },
      lust: {
        name: "色欲",
        detail: "下次行动变为造成15%最大生命值的伤害。",
        expend: true
      },
      humility: {
        name: "谦逊",
        detail: "通式灵力消耗-1(每层-1)。回合初移除。",
        interim: true,
        positive: true
      },
      diligence: {
        name: "勤奋",
        detail: "手牌灵力消耗+2，效果翻倍。回合初移除。",
        positive: true,
        interim: true
      }
    };

    var enermy = {
      natral_protect: {
        name: "自然加护",
        detail: "受到伤害时将伤害变为5，并对伤害来源附加流血*2。生效时层数-1。回合初移除。",
        interim: true,
        expend: true,
        positive: true
      },
      poison_body: {
        name: "毒气花园",
        detail: "受到伤害时对伤害来源附加神经之毒*1。",
        positive: true
      },
      spirit_poison: {
        name: "神经之毒",
        detail: "回合初受到等同于5%(每层+5%)当前生命值的额外伤害，获得恍惚*1(每层+1)。",
        interim: true
      },
      blue_poison: {
        name: "忧郁之毒",
        detail: "回合结束时受到1(每层+1)间接伤害。"
      },
      qianzhidun: {
        name: "乾之盾",
        detail: "阻挡1(每层+1)点伤害，低于层数一半的伤害减半。生效时层数-1。",
        positive: true
      },
      magic_life: {
        name: "魔法生命",
        detail: "这是你第1(每层+1)次击败矢田寺成美。",
        positive: true
      },
      water_joke: {
        name: "水的花招",
        detail: "受到的治疗转化为对自身造成等量伤害。"
      }
    };

    const buff$1 = {
      "tired": {
        "name": "疲倦",
        "detail": "回合开始时回复灵力减少1(每层+1)。生效时层数-1。",
        "expend": true
      },
      "prophesy": {
        "name": "预言",
        "detail": "闪避接下来的1(每层+1)次攻击。生效时层数-1。每回合初清空。",
        "positive": true,
        "expend": true,
        "interim": true
      },
      "foresee": {
        "name": "预知",
        "detail": "闪避接下来的1(每层+1)次攻击。生效时层数-1。",
        "positive": true,
        "expend": true
      },
      "interim_barrier": {
        "name": "临时防御结界",
        "detail": "阻挡1(每层+1)点伤害。生效时层数-1。每回合初清空。",
        "positive": true,
        "interim": true
      },
      "barrier": {
        "name": "防御结界",
        "detail": "阻挡1(每层+1)点伤害。生效时层数-1。",
        "positive": true
      },
      "burning": {
        "name": "燃烧",
        "detail": "每回合扣除3%(每层+3%)最大生命值。生效时层数-1。",
        "expend": true
      },
      "bleed": {
        "name": "流血",
        "detail": "每回合受到1(每层+1)额外伤害。受治疗时移除。"
      },
      "tardy": {
        "name": "迟缓",
        "detail": "速度*95%(每层*95%)。回合初层数-1。",
        "decrease": true
      },
      "fragile": {
        "name": "易伤",
        "detail": "受到伤害+10%(每层+10%)。",
        "interim": true,
        roundend: true
      },
      "strength": {
        "name": "力量",
        "detail": "造成的伤害+10%(每层+10%)。",
        "positive": true
      },
      "insulation": {
        "name": "绝缘",
        "detail": "无法获得任何灵力。",
        "interim": true,
        roundend: true
      },
      "throttle": {
        "name": "节流",
        "detail": "灵力消耗-1(每层-1)。",
        "positive": true,
        "interim": true
      },
      iron_skin: {
        name: "很安全的空间",
        detail: "受到的伤害-10%(每层-10%)。",
        positive: true,
        interim: true
      },
      weak: {
        name: "虚弱",
        detail: "造成的伤害-10%(每层-10%)。",
        interim: true,
        roundend: true
      },
      interim_strength: {
        name: "临时力量",
        detail: "造成的伤害+10%(每层+10%)。回合初清除。",
        positive: true,
        interim: true
      },
      accelerate: {
        name: "加速",
        detail: "速度+0.1(每层+0.1)。",
        positive: true
      },
      trance: {
        name: "恍惚",
        detail: "命中率-10%(每层-10%)。",
        interim: true,
        roundend: true
      },
      strong_luck: {
        name: "强运",
        detail: "概率判定均为正面。回合初清除。",
        interim: true,
        positive: true
      },
      charging: {
        name: "充能",
        detail: "回合初获得1(每层+1)额外灵力。回合初移除。",
        interim: true,
        positive: true
      },
      focus: {
        name: "专注",
        detail: "符卡造成的伤害+10%(每层+10%)。回合初移除。",
        positive: true,
        interim: true
      },
      exposure: {
        name: "曝光",
        detail: "受到伤害均为穿透伤害，持续1(每层+1)回合。",
        decrease: true,
        // roundend: true
      },
      cautious: {
        name: "谨慎",
        detail: "10%(每层+10%)概率闪避伤害。",
        positive: true
      }
    };

    Object.assign(buff$1, collection$1);
    Object.assign(buff$1, spellcard);
    Object.assign(buff$1, base);
    Object.assign(buff$1, enermy);

    var scene = {
      shrine: {
        name: "博丽神社",
        detail: "明明是驱逐妖怪的巫女居住的神社，却不知为何挤了一屋子妖怪，周遭还有各种妖精出没……"
      },
      forest: {
        name: "魔法森林",
        detail: "幻想乡中湿度最高，很少有人踏足的原始森林，住着好多魔法使。"
      },
      town: {
        name: "人间之里",
        detail: "幻想乡中最多人类居住的地方。因为有许多妖怪也会光临的店，所以会有各种妖怪到访，不过都是些安分的妖怪，这是一个和平的地方。"
      }
    };

    const card = {};
    Object.assign(card, spellcard$1);
    Object.assign(card, basecard);
    const data = {
      collection: collection$2,
      equipment: equipment$1,
      souvenir: souvenir$1,
      spellcard: spellcard$1,
      basecard,
      role,
      consumable: consumable$1,
      card,
      enermy: enermy$1,
      buff: buff$1,
      scene
    };

    for (let s in data.souvenir) data.souvenir[s].type = "purple";

    data.keys = function () {
      const keys = {};
      for (let k in this) {
        keys[k] = Object.keys(this[k]);
      }
      return keys;
    };

    /* src\page\foreword.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1$e } = globals;
    const file$z = "src\\page\\foreword.svelte";

    function get_each_context$f(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	child_ctx[16] = list;
    	child_ctx[17] = i;
    	return child_ctx;
    }

    function get_each_context_1$7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	return child_ctx;
    }

    // (107:10) {#each Object.keys(role) as r}
    function create_each_block_1$7(ctx) {
    	let txt;
    	let t_value = role[/*r*/ ctx[18]].name + "";
    	let t;
    	let br;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[5](/*r*/ ctx[18], ...args);
    	}

    	const block = {
    		c: function create() {
    			txt = element("txt");
    			t = text(t_value);
    			br = element("br");
    			add_location(br, file$z, 112, 31, 3163);
    			attr_dev(txt, "class", "role-selection svelte-1kqf6p7");
    			add_location(txt, file$z, 107, 12, 2922);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, txt, anchor);
    			append_dev(txt, t);
    			append_dev(txt, br);

    			if (!mounted) {
    				dispose = listen_dev(txt, "click", click_handler, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(txt);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$7.name,
    		type: "each",
    		source: "(107:10) {#each Object.keys(role) as r}",
    		ctx
    	});

    	return block;
    }

    // (134:14) {#each Object.keys(difficulty) as d, i (i)}
    function create_each_block$f(key_1, ctx) {
    	let txt;
    	let t0_value = /*difficulty*/ ctx[3][/*d*/ ctx[15]].name + "";
    	let t0;
    	let t1;

    	let t2_value = (/*option*/ ctx[0].difficulty == /*d*/ ctx[15]
    	? "☑"
    	: "☐") + "";

    	let t2;
    	let i = /*i*/ ctx[17];
    	let mounted;
    	let dispose;

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[6](/*d*/ ctx[15], ...args);
    	}

    	const assign_txt = () => /*txt_binding*/ ctx[7](txt, i);
    	const unassign_txt = () => /*txt_binding*/ ctx[7](null, i);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			txt = element("txt");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			add_location(txt, file$z, 134, 16, 3876);
    			this.first = txt;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, txt, anchor);
    			append_dev(txt, t0);
    			append_dev(txt, t1);
    			append_dev(txt, t2);
    			assign_txt();

    			if (!mounted) {
    				dispose = listen_dev(txt, "click", click_handler_1, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*option*/ 1 && t2_value !== (t2_value = (/*option*/ ctx[0].difficulty == /*d*/ ctx[15]
    			? "☑"
    			: "☐") + "")) set_data_dev(t2, t2_value);

    			if (i !== /*i*/ ctx[17]) {
    				unassign_txt();
    				i = /*i*/ ctx[17];
    				assign_txt();
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(txt);
    			unassign_txt();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$f.name,
    		type: "each",
    		source: "(134:14) {#each Object.keys(difficulty) as d, i (i)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$z(ctx) {
    	let div17;
    	let div15;
    	let div1;
    	let div0;
    	let t1;
    	let div14;
    	let div13;
    	let div2;
    	let t2;
    	let br0;
    	let t3;
    	let t4;
    	let br1;
    	let t5;
    	let div3;
    	let img;
    	let img_src_value;
    	let t6;
    	let div5;
    	let br2;
    	let t7_value = role[/*option*/ ctx[0].role].name + "";
    	let t7;
    	let br3;
    	let t8;
    	let br4;
    	let t9;
    	let br5;
    	let br6;
    	let t10;
    	let div4;
    	let t11_value = role[/*option*/ ctx[0].role].detail + "";
    	let t11;
    	let t12;
    	let div6;
    	let t14;
    	let br7;
    	let t15;
    	let div11;
    	let div8;
    	let br8;
    	let txt0;
    	let br9;
    	let t17;
    	let div7;
    	let each_blocks = [];
    	let each1_lookup = new Map();
    	let t18;
    	let div10;
    	let br10;
    	let t19;
    	let div9;
    	let txt1;
    	let t21;
    	let txt2;
    	let t23;
    	let txt3;
    	let t24_value = /*option*/ ctx[0].sugar + "";
    	let t24;
    	let t25;
    	let txt4;
    	let t27;
    	let div12;
    	let t29;
    	let div16;
    	let div17_intro;
    	let div17_outro;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_1 = Object.keys(role);
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$7(get_each_context_1$7(ctx, each_value_1, i));
    	}

    	let each_value = Object.keys(/*difficulty*/ ctx[3]);
    	validate_each_argument(each_value);
    	const get_key = ctx => /*i*/ ctx[17];
    	validate_each_keys(ctx, each_value, get_each_context$f, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$f(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each1_lookup.set(key, each_blocks[i] = create_each_block$f(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div17 = element("div");
    			div15 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "序言\r\n        最近老是做梦，梅莉也是，仔细想想是上次从神社回来开始的，要解释成灵异现象吗？\r\n        不过梦里的那些体验倒也蛮新奇的，被怂恿后就决定写成一本小说了，名字还没想好，以后再决定吧，本着“小说的开端肯定是序言吧！”的想法，这篇序言就开始写了，写写停停，因为没想到事由简单一句话就带过了，后面都不会凑了。\r\n        梅莉陪我商量了很多，人物啊，对话啊，场景啊，她的表达能力可真好，梦里很多东西我都只是有画面而不知道如何描述。哈，这小说都没有主题呢，我的初心应该只是“记录”，不要纠结好了。\r\n        不知不觉写了好多，已经快写完了，在写结局之前我问了一下梅莉最喜欢的情景，以此决定结局走向，她意外地喜欢云之海。\r\n        都要写完了，结果序言也没添几句，后记的性质好像和序言差不多，但是可以尽情剧透。\r\n        先这样吧。";
    			t1 = space();
    			div14 = element("div");
    			div13 = element("div");
    			div2 = element("div");
    			t2 = text("主要人物");
    			br0 = element("br");
    			t3 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t4 = space();
    			br1 = element("br");
    			t5 = space();
    			div3 = element("div");
    			img = element("img");
    			t6 = space();
    			div5 = element("div");
    			br2 = element("br");
    			t7 = text(t7_value);
    			br3 = element("br");
    			t8 = text("\r\n          上手难度：");
    			br4 = element("br");
    			t9 = text("✪✪✪✫✫");
    			br5 = element("br");
    			br6 = element("br");
    			t10 = space();
    			div4 = element("div");
    			t11 = text(t11_value);
    			t12 = space();
    			div6 = element("div");
    			div6.textContent = "+-+-+-+-+ 割线分 +-+-+-+-+";
    			t14 = space();
    			br7 = element("br");
    			t15 = space();
    			div11 = element("div");
    			div8 = element("div");
    			br8 = element("br");
    			txt0 = element("txt");
    			txt0.textContent = "风格";
    			br9 = element("br");
    			t17 = space();
    			div7 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t18 = space();
    			div10 = element("div");
    			br10 = element("br");
    			t19 = space();
    			div9 = element("div");
    			txt1 = element("txt");
    			txt1.textContent = "选项数量： ";
    			t21 = space();
    			txt2 = element("txt");
    			txt2.textContent = "-";
    			t23 = space();
    			txt3 = element("txt");
    			t24 = text(t24_value);
    			t25 = space();
    			txt4 = element("txt");
    			txt4.textContent = "+";
    			t27 = space();
    			div12 = element("div");
    			div12.textContent = "就这样吧！";
    			t29 = space();
    			div16 = element("div");
    			div16.textContent = "右键回到标题界面";
    			attr_dev(div0, "class", "page-inner svelte-1kqf6p7");
    			attr_dev(div0, "contenteditable", "");
    			add_location(div0, file$z, 92, 6, 2293);
    			attr_dev(div1, "class", "left svelte-1kqf6p7");
    			add_location(div1, file$z, 91, 4, 2267);
    			add_location(br0, file$z, 105, 14, 2860);
    			add_location(br1, file$z, 115, 10, 3220);
    			attr_dev(div2, "class", "role");
    			add_location(div2, file$z, 104, 8, 2826);
    			if (!src_url_equal(img.src, img_src_value = "/img/role/dairi/" + /*option*/ ctx[0].role + ".webp")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-1kqf6p7");
    			add_location(img, file$z, 118, 10, 3284);
    			attr_dev(div3, "class", "avatar svelte-1kqf6p7");
    			add_location(div3, file$z, 117, 8, 3252);
    			add_location(br2, file$z, 121, 10, 3394);
    			add_location(br3, file$z, 121, 40, 3424);
    			add_location(br4, file$z, 122, 15, 3447);
    			add_location(br5, file$z, 122, 26, 3458);
    			add_location(br6, file$z, 122, 32, 3464);
    			attr_dev(div4, "class", "role-detail svelte-1kqf6p7");
    			add_location(div4, file$z, 123, 10, 3482);
    			attr_dev(div5, "class", "role-props svelte-1kqf6p7");
    			add_location(div5, file$z, 120, 8, 3358);
    			attr_dev(div6, "class", "divided_line svelte-1kqf6p7");
    			add_location(div6, file$z, 127, 8, 3591);
    			add_location(br7, file$z, 128, 8, 3666);
    			add_location(br8, file$z, 131, 12, 3737);
    			attr_dev(txt0, "class", "svelte-1kqf6p7");
    			add_location(txt0, file$z, 131, 18, 3743);
    			add_location(br9, file$z, 131, 31, 3756);
    			attr_dev(div7, "class", "selection svelte-1kqf6p7");
    			add_location(div7, file$z, 132, 12, 3776);
    			attr_dev(div8, "class", "difficulty svelte-1kqf6p7");
    			add_location(div8, file$z, 130, 10, 3699);
    			add_location(br10, file$z, 145, 12, 4249);
    			add_location(txt1, file$z, 147, 14, 4290);
    			add_location(txt2, file$z, 148, 14, 4328);
    			set_style(txt3, "text-align", "center");
    			set_style(txt3, "width", "40px");
    			add_location(txt3, file$z, 152, 14, 4472);
    			add_location(txt4, file$z, 153, 14, 4551);
    			attr_dev(div9, "class", "svelte-1kqf6p7");
    			add_location(div9, file$z, 146, 12, 4269);
    			attr_dev(div10, "class", "sugar svelte-1kqf6p7");
    			add_location(div10, file$z, 144, 10, 4216);
    			add_location(div11, file$z, 129, 8, 3682);
    			attr_dev(div12, "class", "launch svelte-1kqf6p7");
    			add_location(div12, file$z, 160, 8, 4743);
    			attr_dev(div13, "class", "page-inner svelte-1kqf6p7");
    			add_location(div13, file$z, 103, 6, 2792);
    			attr_dev(div14, "class", "right svelte-1kqf6p7");
    			add_location(div14, file$z, 102, 4, 2765);
    			attr_dev(div15, "class", "notebook svelte-1kqf6p7");
    			add_location(div15, file$z, 90, 2, 2239);
    			attr_dev(div16, "class", "remind svelte-1kqf6p7");
    			add_location(div16, file$z, 164, 2, 4832);
    			attr_dev(div17, "class", "body svelte-1kqf6p7");
    			add_location(div17, file$z, 89, 0, 2160);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div17, anchor);
    			append_dev(div17, div15);
    			append_dev(div15, div1);
    			append_dev(div1, div0);
    			append_dev(div15, t1);
    			append_dev(div15, div14);
    			append_dev(div14, div13);
    			append_dev(div13, div2);
    			append_dev(div2, t2);
    			append_dev(div2, br0);
    			append_dev(div2, t3);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(div2, null);
    				}
    			}

    			append_dev(div2, t4);
    			append_dev(div2, br1);
    			append_dev(div13, t5);
    			append_dev(div13, div3);
    			append_dev(div3, img);
    			append_dev(div13, t6);
    			append_dev(div13, div5);
    			append_dev(div5, br2);
    			append_dev(div5, t7);
    			append_dev(div5, br3);
    			append_dev(div5, t8);
    			append_dev(div5, br4);
    			append_dev(div5, t9);
    			append_dev(div5, br5);
    			append_dev(div5, br6);
    			append_dev(div5, t10);
    			append_dev(div5, div4);
    			append_dev(div4, t11);
    			append_dev(div13, t12);
    			append_dev(div13, div6);
    			append_dev(div13, t14);
    			append_dev(div13, br7);
    			append_dev(div13, t15);
    			append_dev(div13, div11);
    			append_dev(div11, div8);
    			append_dev(div8, br8);
    			append_dev(div8, txt0);
    			append_dev(div8, br9);
    			append_dev(div8, t17);
    			append_dev(div8, div7);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div7, null);
    				}
    			}

    			append_dev(div11, t18);
    			append_dev(div11, div10);
    			append_dev(div10, br10);
    			append_dev(div10, t19);
    			append_dev(div10, div9);
    			append_dev(div9, txt1);
    			append_dev(div9, t21);
    			append_dev(div9, txt2);
    			append_dev(div9, t23);
    			append_dev(div9, txt3);
    			append_dev(txt3, t24);
    			append_dev(div9, t25);
    			append_dev(div9, txt4);
    			append_dev(div13, t27);
    			append_dev(div13, div12);
    			append_dev(div17, t29);
    			append_dev(div17, div16);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(txt2, "click", /*click_handler_2*/ ctx[8], false, false, false, false),
    					listen_dev(txt4, "click", /*click_handler_3*/ ctx[9], false, false, false, false),
    					listen_dev(div12, "click", /*launch*/ ctx[4], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$archive, Object, role, option, window*/ 5) {
    				each_value_1 = Object.keys(role);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$7(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$7(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div2, t4);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (!current || dirty & /*option*/ 1 && !src_url_equal(img.src, img_src_value = "/img/role/dairi/" + /*option*/ ctx[0].role + ".webp")) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if ((!current || dirty & /*option*/ 1) && t7_value !== (t7_value = role[/*option*/ ctx[0].role].name + "")) set_data_dev(t7, t7_value);
    			if ((!current || dirty & /*option*/ 1) && t11_value !== (t11_value = role[/*option*/ ctx[0].role].detail + "")) set_data_dev(t11, t11_value);

    			if (dirty & /*element_difficulty, Object, difficulty, option*/ 11) {
    				each_value = Object.keys(/*difficulty*/ ctx[3]);
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$f, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each1_lookup, div7, destroy_block, create_each_block$f, null, get_each_context$f);
    			}

    			if ((!current || dirty & /*option*/ 1) && t24_value !== (t24_value = /*option*/ ctx[0].sugar + "")) set_data_dev(t24, t24_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!current) return;
    				if (div17_outro) div17_outro.end(1);
    				div17_intro = create_in_transition(div17, fade, { duration: 250 });
    				div17_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div17_intro) div17_intro.invalidate();
    			div17_outro = create_out_transition(div17, fade, { duration: 250 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div17);
    			destroy_each(each_blocks_1, detaching);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (detaching && div17_outro) div17_outro.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$z.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$z($$self, $$props, $$invalidate) {
    	let $Admin;
    	let $page;
    	let $explore;
    	let $data;
    	let $Explain;
    	let $archive;
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(10, $Admin = $$value));
    	validate_store(page, 'page');
    	component_subscribe($$self, page, $$value => $$invalidate(11, $page = $$value));
    	validate_store(explore, 'explore');
    	component_subscribe($$self, explore, $$value => $$invalidate(12, $explore = $$value));
    	validate_store(data$1, 'data');
    	component_subscribe($$self, data$1, $$value => $$invalidate(13, $data = $$value));
    	validate_store(Explain, 'Explain');
    	component_subscribe($$self, Explain, $$value => $$invalidate(14, $Explain = $$value));
    	validate_store(archive, 'archive');
    	component_subscribe($$self, archive, $$value => $$invalidate(2, $archive = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Foreword', slots, []);

    	let option = {
    		role: "marisa",
    		difficulty: "normal",
    		sugar: 3
    	};

    	let difficulty = {
    		easy: {
    			name: "轻松",
    			detail: "有3次战败时回到战斗前的机会。机会消耗时，回复生命值并获得一件普通收藏品。",
    			type: "blue",
    			amount: 3
    		},
    		normal: {
    			name: "平实",
    			detail: "有2次战败时回到战斗前的机会。机会消耗时，回复生命值并获得一件稀有收藏品。",
    			type: "green",
    			amount: 2
    		},
    		hard: {
    			name: "紧张",
    			detail: "有1次战败时回到战斗前的机会。机会消耗时，回复生命值并获得一件传奇收藏品。",
    			type: "red",
    			amount: 1
    		}
    	};

    	const element_difficulty = [];

    	onMount(function () {
    		element_difficulty.forEach((e, i) => {
    			let key = Object.keys(difficulty)[i];
    			$Explain(e).color(difficulty[key].type).with(difficulty[key]);
    		});
    	});

    	function launch() {
    		set_store_value(
    			data$1,
    			$data = {
    				collection: {},
    				equipment: false,
    				consumable: {},
    				card: {},
    				souvenir: false,
    				role: option.role,
    				sugar: option.sugar,
    				consumableLimit: 3,
    				chance: difficulty[option.difficulty],
    				health: 0,
    				coin: 500,
    				scene: "shrine",
    				stage: 1,
    				blackList: [],
    				statistics: [],
    				coin_reward_total: 0
    			},
    			$data
    		);

    		set_store_value(data$1, $data.card[option.role] = 4, $data);
    		data.keys().spellcard.filter(s => data.spellcard[s].role == option.role).rd().splice(0, 3).forEach(s => s.increaseOf($data.card));
    		data.keys().basecard.rd().splice(0, 3).forEach(s => s.increaseOf($data.card));

    		set_store_value(
    			explore,
    			$explore = {
    				enermy: [],
    				eventSummoned: false,
    				enermyLimit: 4,
    				lv: 9,
    				pricelv: 1,
    				boss: ["kanako", "medicine", "mokou"]
    			},
    			$explore
    		);

    		// $explore.boss = data.keys().enermy
    		//   .filter((e) => Data.enermy[e].type == "boss")
    		//   .rd();
    		set_store_value(page, $page = "Explore", $page);

    		$Admin.menu();
    	}

    	const writable_props = [];

    	Object_1$e.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Foreword> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (r, _) => {
    		if ($archive.unlocked.role.includes(r)) $$invalidate(0, option.role = r, option); else window.msg({ content: "该角色尚未解锁" });
    	};

    	const click_handler_1 = (d, _) => $$invalidate(0, option.difficulty = d, option);

    	function txt_binding($$value, i) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_difficulty[i] = $$value;
    			$$invalidate(1, element_difficulty);
    		});
    	}

    	const click_handler_2 = _ => $$invalidate(0, option.sugar = Math.max(option.sugar - 1, 1), option);
    	const click_handler_3 = _ => $$invalidate(0, option.sugar = Math.min(option.sugar + 1, 5), option);

    	$$self.$capture_state = () => ({
    		onMount,
    		beforeUpdate,
    		role,
    		fade,
    		scale,
    		data: data$1,
    		page,
    		explore,
    		archive,
    		Admin,
    		Explain,
    		Data: data,
    		option,
    		difficulty,
    		element_difficulty,
    		launch,
    		$Admin,
    		$page,
    		$explore,
    		$data,
    		$Explain,
    		$archive
    	});

    	$$self.$inject_state = $$props => {
    		if ('option' in $$props) $$invalidate(0, option = $$props.option);
    		if ('difficulty' in $$props) $$invalidate(3, difficulty = $$props.difficulty);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		option,
    		element_difficulty,
    		$archive,
    		difficulty,
    		launch,
    		click_handler,
    		click_handler_1,
    		txt_binding,
    		click_handler_2,
    		click_handler_3
    	];
    }

    class Foreword extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$z, create_fragment$z, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Foreword",
    			options,
    			id: create_fragment$z.name
    		});
    	}
    }

    var bottle = {
    	name: "瓶子",
    	detail: "脚边有一个脏兮兮的瓶子，里面有东西在发光。",
    	type: "selection",
    	scene: [
    		"shrine",
    		"forest"
    	]
    };
    var itemshop = {
    	name: "香霖堂",
    	detail: "奇怪的杂货店，店主看上去很友好。",
    	type: "shop"
    };
    var bookshop = {
    	name: "铃奈庵",
    	detail: "不仅有故事书，还有记录妖术的妖魔书。",
    	type: "shop"
    };
    var canteen = {
    	name: "鲵吞亭",
    	detail: "奇妙的居酒屋，有一位可爱的看板娘。",
    	type: "shop",
    	product: {
    		group: [
    			{
    				forget: 3,
    				"consumable(canteen)": 3
    			}
    		],
    		weight: [
    			1
    		],
    		size: "M"
    	}
    };
    var yakumo = {
    	name: "八云邸",
    	detail: "浓厚的历史气息。却有些人类世界的道具。",
    	type: "selection",
    	dialogue: "yakumo"
    };
    var school = {
    	name: "寺子屋",
    	detail: "人类村落中的一所学校。学习知识的地方。",
    	type: "special"
    };
    var chest = {
    	name: "宝箱",
    	detail: "地上真的会凭空出现宝箱吗？真的可以打开吗？",
    	type: "reward"
    };
    var turntable = {
    	name: "幸运转盘",
    	detail: "看来能获得一些稀奇的东西，反正不是坏事！",
    	type: "game"
    };
    var shrine = {
    	name: "天降御守",
    	detail: "要不打开看一下吧，万一是大吉呢？",
    	type: "rule?"
    };
    var zixuan = {
    	name: "稻荷祠堂",
    	detail: "满是青苔，虽年久失修，看着却让人感到安心。",
    	type: "reward"
    };
    var coin = {
    	name: "硬币",
    	detail: "捡到钱啦！",
    	type: "reward"
    };
    var delete_and_many = {
    	name: "选择",
    	detail: "将一件收藏品从本次游戏中移除，并获得大量另一件收藏品。",
    	type: "selection"
    };
    var dragon = {
    	name: "龙神像",
    	detail: "风雨的祝福。",
    	type: "rule"
    };
    var the_666 = {
    	name: "骰子大师",
    	detail: "投出两个6就有大奖，次数越多奖励越少。",
    	type: "game"
    };
    var p21 = {
    	name: "二十一点",
    	detail: "打牌，赢了就有大奖。",
    	type: "game"
    };
    var donate_blood = {
    	name: "爱心血站",
    	detail: "只要人人都献出一点爱，世界就会变成美好的人间。",
    	type: "selection"
    };
    var dizang = {
    	name: "地藏像",
    	detail: "看起来已经很旧了。",
    	type: "selection?"
    };
    var yuehong = {
    	name: "月虹市场",
    	detail: "位于高空的云层中，是一个用于交易卡牌的集市。",
    	type: "shop?"
    };
    var yequeshitang = {
    	name: "夜雀食堂",
    	detail: "有着红色灯笼的移动货摊。不是烤（鸟）肉店而是烤鳗鱼店。",
    	type: "shop?"
    };
    var copy = {
    	name: "复制",
    	detail: "复制什么都可以哦。",
    	type: "special"
    };
    var change = {
    	name: "转化",
    	detail: "变成什么都别怨我哦。",
    	type: "special"
    };
    var shoucangjia = {
    	name: "收藏家",
    	detail: "只收不换，只买不卖，只一不二。",
    	type: "special"
    };
    var wanted = {
    	name: "悬赏",
    	detail: "收人钱财，替人消灾。",
    	type: "special?"
    };
    var zagu = {
    	name: "杂鱼",
    	detail: "反正是杂鱼，顺手收拾掉吧。",
    	type: "enermy",
    	unbreakable: true
    };
    var elite = {
    	name: "强敌",
    	detail: "比杂鱼要强，要认真应对了。",
    	type: "enermy",
    	unbreakable: true
    };
    var boss = {
    	name: "BOSS",
    	detail: "这种强大的气场，只能用BOSS来形容了。",
    	type: "enermy",
    	unbreakable: true
    };
    var xijian = {
    	name: "隙间",
    	detail: "某个妖怪随意留下的隙间，不知通向何方。",
    	type: "rule",
    	unbreakable: true
    };
    var big_chest = {
    	name: "特大宝箱",
    	detail: "是很大很大很大的宝箱没错，但不知为何有个投币口。",
    	type: "reward"
    };
    var muxiazi = {
    	name: "木匣子",
    	detail: "就当是宝箱好了。",
    	type: "reward"
    };
    var diaochuang = {
    	name: "吊床",
    	detail: "看起来摇摇晃晃的，想必是非常新奇的体验。",
    	type: "reward"
    };
    var laohuji = {
    	name: "老虎机",
    	detail: "真的不来试试看？真的不来试试看？真的不来试试看？",
    	type: "game"
    };
    var yidongba = {
    	name: "移动靶场",
    	detail: "射中啥就是啥，绝不赖皮！",
    	type: "game"
    };
    var event = {
    	bottle: bottle,
    	itemshop: itemshop,
    	bookshop: bookshop,
    	canteen: canteen,
    	yakumo: yakumo,
    	school: school,
    	chest: chest,
    	turntable: turntable,
    	shrine: shrine,
    	zixuan: zixuan,
    	coin: coin,
    	delete_and_many: delete_and_many,
    	dragon: dragon,
    	the_666: the_666,
    	p21: p21,
    	donate_blood: donate_blood,
    	dizang: dizang,
    	yuehong: yuehong,
    	yequeshitang: yequeshitang,
    	copy: copy,
    	change: change,
    	shoucangjia: shoucangjia,
    	wanted: wanted,
    	zagu: zagu,
    	elite: elite,
    	boss: boss,
    	xijian: xijian,
    	big_chest: big_chest,
    	muxiazi: muxiazi,
    	diaochuang: diaochuang,
    	laohuji: laohuji,
    	yidongba: yidongba
    };

    /* src\addon\part\event_bottle.svelte generated by Svelte v3.59.2 */
    const file$y = "src\\addon\\part\\event_bottle.svelte";

    function create_fragment$y(ctx) {
    	let div;
    	let txt0;
    	let t0_value = /*info*/ ctx[0].detail + "";
    	let t0;
    	let t1;
    	let br0;
    	let t2;
    	let br1;
    	let t3;
    	let br2;
    	let t4;
    	let txt1;
    	let t6;
    	let br3;
    	let t7;
    	let br4;
    	let t8;
    	let txt2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			txt0 = element("txt");
    			t0 = text(t0_value);
    			t1 = space();
    			br0 = element("br");
    			t2 = space();
    			br1 = element("br");
    			t3 = space();
    			br2 = element("br");
    			t4 = space();
    			txt1 = element("txt");
    			txt1.textContent = "踢开";
    			t6 = space();
    			br3 = element("br");
    			t7 = space();
    			br4 = element("br");
    			t8 = space();
    			txt2 = element("txt");
    			txt2.textContent = "捡起";
    			attr_dev(txt0, "class", "svelte-n7cuwa");
    			add_location(txt0, file$y, 38, 2, 701);
    			add_location(br0, file$y, 39, 2, 729);
    			add_location(br1, file$y, 40, 2, 739);
    			add_location(br2, file$y, 41, 2, 749);
    			attr_dev(txt1, "class", "selection svelte-n7cuwa");
    			add_location(txt1, file$y, 42, 2, 759);
    			add_location(br3, file$y, 54, 2, 1052);
    			add_location(br4, file$y, 55, 2, 1062);
    			attr_dev(txt2, "class", "selection svelte-n7cuwa");
    			add_location(txt2, file$y, 56, 2, 1072);
    			attr_dev(div, "class", "content svelte-n7cuwa");
    			add_location(div, file$y, 37, 0, 676);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, txt0);
    			append_dev(txt0, t0);
    			append_dev(div, t1);
    			append_dev(div, br0);
    			append_dev(div, t2);
    			append_dev(div, br1);
    			append_dev(div, t3);
    			append_dev(div, br2);
    			append_dev(div, t4);
    			append_dev(div, txt1);
    			append_dev(div, t6);
    			append_dev(div, br3);
    			append_dev(div, t7);
    			append_dev(div, br4);
    			append_dev(div, t8);
    			append_dev(div, txt2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(txt1, "click", /*click_handler*/ ctx[3], false, false, false, false),
    					listen_dev(txt2, "click", /*click_handler_1*/ ctx[4], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*info*/ 1 && t0_value !== (t0_value = /*info*/ ctx[0].detail + "")) set_data_dev(t0, t0_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$y.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$y($$self, $$props, $$invalidate) {
    	let $Admin;
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(1, $Admin = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Event_bottle', slots, []);
    	let { info } = $$props;

    	const selections = [
    		{
    			detail: "踢开",
    			handle: [
    				{
    					content: "瓶子爆炸了，烟雾中出现了许多身影。",
    					return: "summonElite(1)"
    				},
    				{ content: "什么都没有发生", return: "null(null)" }
    			],
    			weight: [1, 1]
    		},
    		{
    			detail: "捡起",
    			handle: [
    				{
    					content: "瓶子吸走了你10生命值，消失了。",
    					return: "health(-10)"
    				},
    				{
    					content: "光芒散去，瓶子里是一件收藏品。",
    					return: "collection(white)"
    				}
    			],
    			weight: [4, 6]
    		}
    	];

    	$$self.$$.on_mount.push(function () {
    		if (info === undefined && !('info' in $$props || $$self.$$.bound[$$self.$$.props['info']])) {
    			console.warn("<Event_bottle> was created without expected prop 'info'");
    		}
    	});

    	const writable_props = ['info'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Event_bottle> was created with unknown prop '${key}'`);
    	});

    	const click_handler = _ => {
    		if (Math.random() < 0.5) {
    			window.msg(selections[0].handle[0]);
    			$Admin.event.summonZagu();
    		} else {
    			window.msg(selections[0].handle[1]);
    		}

    		$Admin.event.finish();
    	};

    	const click_handler_1 = _ => {
    		if (Math.random() < 0.4) {
    			window.msg(selections[1].handle[0]);
    			set_store_value(Admin, $Admin.data.health = Math.max(1, $Admin.data.health - 10), $Admin);
    		} else {
    			window.msg(selections[1].handle[1]);
    			$Admin.event.getCollection("green");
    		}

    		$Admin.event.finish();
    	};

    	$$self.$$set = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	$$self.$capture_state = () => ({ Admin, info, selections, $Admin });

    	$$self.$inject_state = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [info, $Admin, selections, click_handler, click_handler_1];
    }

    class Event_bottle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$y, create_fragment$y, safe_not_equal, { info: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Event_bottle",
    			options,
    			id: create_fragment$y.name
    		});
    	}

    	get info() {
    		throw new Error("<Event_bottle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set info(value) {
    		throw new Error("<Event_bottle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\addon\part\event_itemshop.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1$d } = globals;
    const file$x = "src\\addon\\part\\event_itemshop.svelte";

    function get_each_context$e(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	child_ctx[10] = list;
    	child_ctx[11] = i;
    	return child_ctx;
    }

    // (98:4) {#each product as p, i (i)}
    function create_each_block$e(key_1, ctx) {
    	let div;
    	let icon0;
    	let icon0_class_value;
    	let t0;
    	let txt;
    	let icon1;
    	let t1_value = /*p*/ ctx[9].piece + "";
    	let t1;
    	let t2;
    	let i = /*i*/ ctx[11];
    	const assign_div = () => /*div_binding*/ ctx[3](div, i);
    	const unassign_div = () => /*div_binding*/ ctx[3](null, i);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			icon0 = element("icon");
    			t0 = space();
    			txt = element("txt");
    			icon1 = element("icon");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(icon0, "class", icon0_class_value = "icon-" + /*p*/ ctx[9].key + " svelte-141zm13");
    			add_location(icon0, file$x, 103, 8, 2768);
    			attr_dev(icon1, "class", "icon-coin");
    			add_location(icon1, file$x, 104, 13, 2812);
    			attr_dev(txt, "class", "svelte-141zm13");
    			add_location(txt, file$x, 104, 8, 2807);
    			attr_dev(div, "class", "product svelte-141zm13");
    			set_style(div, "background-color", "var(--" + /*p*/ ctx[9].color + ")");
    			add_location(div, file$x, 98, 6, 2636);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, icon0);
    			append_dev(div, t0);
    			append_dev(div, txt);
    			append_dev(txt, icon1);
    			append_dev(txt, t1);
    			append_dev(div, t2);
    			assign_div();
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*product*/ 2 && icon0_class_value !== (icon0_class_value = "icon-" + /*p*/ ctx[9].key + " svelte-141zm13")) {
    				attr_dev(icon0, "class", icon0_class_value);
    			}

    			if (dirty & /*product*/ 2 && t1_value !== (t1_value = /*p*/ ctx[9].piece + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*product*/ 2) {
    				set_style(div, "background-color", "var(--" + /*p*/ ctx[9].color + ")");
    			}

    			if (i !== /*i*/ ctx[11]) {
    				unassign_div();
    				i = /*i*/ ctx[11];
    				assign_div();
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			unassign_div();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$e.name,
    		type: "each",
    		source: "(98:4) {#each product as p, i (i)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$x(ctx) {
    	let div1;
    	let txt;
    	let t0_value = /*info*/ ctx[0].detail + "";
    	let t0;
    	let t1;
    	let div0;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_value = /*product*/ ctx[1];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*i*/ ctx[11];
    	validate_each_keys(ctx, each_value, get_each_context$e, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$e(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$e(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			txt = element("txt");
    			t0 = text(t0_value);
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(txt, "class", "svelte-141zm13");
    			add_location(txt, file$x, 95, 2, 2545);
    			attr_dev(div0, "class", "products svelte-141zm13");
    			add_location(div0, file$x, 96, 2, 2573);
    			attr_dev(div1, "class", "content svelte-141zm13");
    			add_location(div1, file$x, 94, 0, 2520);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, txt);
    			append_dev(txt, t0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div0, null);
    				}
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*info*/ 1 && t0_value !== (t0_value = /*info*/ ctx[0].detail + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*product, element*/ 6) {
    				each_value = /*product*/ ctx[1];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$e, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div0, destroy_block, create_each_block$e, null, get_each_context$e);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$x.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$x($$self, $$props, $$invalidate) {
    	let $Admin;
    	let $Explain;
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(5, $Admin = $$value));
    	validate_store(Explain, 'Explain');
    	component_subscribe($$self, Explain, $$value => $$invalidate(6, $Explain = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Event_itemshop', slots, []);
    	let { info } = $$props;
    	let product;
    	const element = [];
    	const collection = {};

    	["blue", "green", "red"].map(type => {
    		collection[type] = function () {
    			let key = Object.keys(collection$2).filter(c => collection$2[c].type == type).rd()[0];
    			let piece = { blue: 200, green: 500, red: 1000 };
    			let left = { blue: 4, green: 2, red: 1 };

    			return {
    				key,
    				color: type,
    				piece: piece[type],
    				left: left[type]
    			};
    		};
    	});

    	if (info.cache.product) product = info.cache.product; else info.cache.product = summonProduct();

    	onMount(function () {
    		element.forEach((e, i) => {
    			let info;
    			if (product[i].key in collection$2) info = collection$2[product[i].key]; else info = equipment$1[product[i].key];
    			$Explain(e).color(product[i].color).with(info);
    			e.onclick = _ => purchase(product[i]);
    		});
    	});

    	function summonProduct() {
    		let res = [];
    		let data = { red: 1, green: 2, blue: 3 };

    		for (let type in data) {
    			[...Array(data[type]).keys()].forEach(_ => res.push(collection[type]()));
    		}

    		if (Math.random() > 0.5) {
    			res[0] = {
    				key: Object.keys(equipment$1).rd()[0],
    				color: "gold",
    				piece: 500,
    				left: 1
    			};
    		}

    		$$invalidate(1, product = $Admin.discount(res));
    		return res;
    	}

    	function purchase(p) {
    		if (p.color != "gray") {
    			if ($Admin.data.coin >= p.piece) {
    				$$invalidate(1, product);
    				set_store_value(Admin, $Admin.data.coin -= p.piece, $Admin);
    				p.left--;

    				if (p.color == "gold") {
    					set_store_value(Admin, $Admin.data.equipment = p.key, $Admin);
    					msg({ content: `已购买[${equipment$1[p.key].name}]` });
    				} else {
    					p.key.increaseOf($Admin.data.collection);

    					msg({
    						content: `已购买[${collection$2[p.key].name}]`
    					});
    				}

    				if (p.left < 1) p.color = "gray";
    			} else msg({ content: "硬币不足" });
    		}
    	}

    	$$self.$$.on_mount.push(function () {
    		if (info === undefined && !('info' in $$props || $$self.$$.bound[$$self.$$.props['info']])) {
    			console.warn("<Event_itemshop> was created without expected prop 'info'");
    		}
    	});

    	const writable_props = ['info'];

    	Object_1$d.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Event_itemshop> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value, i) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element[i] = $$value;
    			$$invalidate(2, element);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	$$self.$capture_state = () => ({
    		Admin,
    		Explain,
    		onMount,
    		beforeUpdate,
    		Collection: collection$2,
    		Equipment: equipment$1,
    		Souvenir: souvenir$1,
    		Spellcard: spellcard$1,
    		Consumable: consumable$1,
    		Basecard: basecard,
    		info,
    		product,
    		element,
    		collection,
    		summonProduct,
    		purchase,
    		$Admin,
    		$Explain
    	});

    	$$self.$inject_state = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    		if ('product' in $$props) $$invalidate(1, product = $$props.product);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [info, product, element, div_binding];
    }

    class Event_itemshop extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$x, create_fragment$x, safe_not_equal, { info: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Event_itemshop",
    			options,
    			id: create_fragment$x.name
    		});
    	}

    	get info() {
    		throw new Error("<Event_itemshop>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set info(value) {
    		throw new Error("<Event_itemshop>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\addon\part\event_bookshop.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1$c } = globals;
    const file$w = "src\\addon\\part\\event_bookshop.svelte";

    function get_each_context$d(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[9] = list;
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (59:4) {#each product as p, i (i)}
    function create_each_block$d(key_1, ctx) {
    	let div;
    	let card;
    	let t;
    	let i = /*i*/ ctx[10];
    	let current;

    	card = new Card({
    			props: {
    				key: /*p*/ ctx[8].key,
    				cover: /*p*/ ctx[8].sold && { name: "空", detail: "已售罄" }
    			},
    			$$inline: true
    		});

    	const assign_div = () => /*div_binding*/ ctx[3](div, i);
    	const unassign_div = () => /*div_binding*/ ctx[3](null, i);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			create_component(card.$$.fragment);
    			t = space();
    			attr_dev(div, "class", "product svelte-175k9tw");
    			add_location(div, file$w, 59, 4, 1634);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(card, div, null);
    			append_dev(div, t);
    			assign_div();
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const card_changes = {};
    			if (dirty & /*product*/ 2) card_changes.key = /*p*/ ctx[8].key;
    			if (dirty & /*product*/ 2) card_changes.cover = /*p*/ ctx[8].sold && { name: "空", detail: "已售罄" };
    			card.$set(card_changes);

    			if (i !== /*i*/ ctx[10]) {
    				unassign_div();
    				i = /*i*/ ctx[10];
    				assign_div();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(card);
    			unassign_div();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$d.name,
    		type: "each",
    		source: "(59:4) {#each product as p, i (i)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$w(ctx) {
    	let div1;
    	let txt;
    	let t0_value = /*info*/ ctx[0].detail + "";
    	let t0;
    	let t1;
    	let div0;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let each_value = /*product*/ ctx[1];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*i*/ ctx[10];
    	validate_each_keys(ctx, each_value, get_each_context$d, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$d(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$d(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			txt = element("txt");
    			t0 = text(t0_value);
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(txt, "class", "svelte-175k9tw");
    			add_location(txt, file$w, 56, 2, 1545);
    			attr_dev(div0, "class", "products svelte-175k9tw");
    			add_location(div0, file$w, 57, 2, 1573);
    			attr_dev(div1, "class", "content svelte-175k9tw");
    			add_location(div1, file$w, 55, 0, 1520);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, txt);
    			append_dev(txt, t0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div0, null);
    				}
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*info*/ 1) && t0_value !== (t0_value = /*info*/ ctx[0].detail + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*element, product*/ 6) {
    				each_value = /*product*/ ctx[1];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$d, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div0, outro_and_destroy_block, create_each_block$d, null, get_each_context$d);
    				check_outros();
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
    			if (detaching) detach_dev(div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$w.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$w($$self, $$props, $$invalidate) {
    	let $Admin;
    	let $Explain;
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(4, $Admin = $$value));
    	validate_store(Explain, 'Explain');
    	component_subscribe($$self, Explain, $$value => $$invalidate(5, $Explain = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Event_bookshop', slots, []);
    	let { info } = $$props;
    	let product;
    	const element = [];
    	if (info.cache.product) product = info.cache.product; else info.cache.product = summonProduct();

    	onMount(function () {
    		element.forEach((e, i) => {
    			let info = { name: "价格", detail: product[i].piece };
    			$Explain(e).with(info);
    			e.onclick = _ => purchase(product[i]);
    		});
    	});

    	function summonProduct() {
    		let source = Object.keys(basecard).rd().splice(0, $Admin.data.sugar + 3);

    		let res = source.map(c => {
    			return { key: c, piece: 450, sold: false };
    		});

    		$$invalidate(1, product = $Admin.discount(res));
    		return res;
    	}

    	function purchase(p) {
    		if (!p.sold) {
    			if ($Admin.data.coin >= p.piece) {
    				$$invalidate(1, product);
    				set_store_value(Admin, $Admin.data.coin -= p.piece, $Admin);
    				p.key.increaseOf($Admin.data.card);
    				msg({ content: `已购买[${basecard[p.key].name}]` });
    				p.sold = true;
    			} else msg({ content: "硬币不足" });
    		}
    	}

    	$$self.$$.on_mount.push(function () {
    		if (info === undefined && !('info' in $$props || $$self.$$.bound[$$self.$$.props['info']])) {
    			console.warn("<Event_bookshop> was created without expected prop 'info'");
    		}
    	});

    	const writable_props = ['info'];

    	Object_1$c.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Event_bookshop> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value, i) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element[i] = $$value;
    			$$invalidate(2, element);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	$$self.$capture_state = () => ({
    		Admin,
    		Explain,
    		onMount,
    		beforeUpdate,
    		Collection: collection$2,
    		Equipment: equipment$1,
    		Souvenir: souvenir$1,
    		Spellcard: spellcard$1,
    		Consumable: consumable$1,
    		Basecard: basecard,
    		Card,
    		info,
    		product,
    		element,
    		summonProduct,
    		purchase,
    		$Admin,
    		$Explain
    	});

    	$$self.$inject_state = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    		if ('product' in $$props) $$invalidate(1, product = $$props.product);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [info, product, element, div_binding];
    }

    class Event_bookshop extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$w, create_fragment$w, safe_not_equal, { info: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Event_bookshop",
    			options,
    			id: create_fragment$w.name
    		});
    	}

    	get info() {
    		throw new Error("<Event_bookshop>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set info(value) {
    		throw new Error("<Event_bookshop>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\addon\part\event_yakumo.svelte generated by Svelte v3.59.2 */
    const file$v = "src\\addon\\part\\event_yakumo.svelte";

    function create_fragment$v(ctx) {
    	let div;
    	let txt0;
    	let t0_value = /*info*/ ctx[0].detail + "";
    	let t0;
    	let t1;
    	let br0;
    	let t2;
    	let br1;
    	let t3;
    	let br2;
    	let t4;
    	let txt1;
    	let t6;
    	let br3;
    	let t7;
    	let br4;
    	let t8;
    	let txt2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			txt0 = element("txt");
    			t0 = text(t0_value);
    			t1 = space();
    			br0 = element("br");
    			t2 = space();
    			br1 = element("br");
    			t3 = space();
    			br2 = element("br");
    			t4 = space();
    			txt1 = element("txt");
    			txt1.textContent = "休息一下";
    			t6 = space();
    			br3 = element("br");
    			t7 = space();
    			br4 = element("br");
    			t8 = space();
    			txt2 = element("txt");
    			txt2.textContent = "获得纪念品";
    			attr_dev(txt0, "class", "svelte-1ogutcc");
    			add_location(txt0, file$v, 8, 2, 112);
    			add_location(br0, file$v, 9, 2, 140);
    			add_location(br1, file$v, 10, 2, 150);
    			add_location(br2, file$v, 11, 2, 160);
    			attr_dev(txt1, "class", "selection svelte-1ogutcc");
    			add_location(txt1, file$v, 12, 2, 170);
    			add_location(br3, file$v, 20, 2, 354);
    			add_location(br4, file$v, 21, 2, 364);
    			attr_dev(txt2, "class", "selection svelte-1ogutcc");
    			add_location(txt2, file$v, 22, 2, 374);
    			attr_dev(div, "class", "content svelte-1ogutcc");
    			add_location(div, file$v, 7, 0, 87);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, txt0);
    			append_dev(txt0, t0);
    			append_dev(div, t1);
    			append_dev(div, br0);
    			append_dev(div, t2);
    			append_dev(div, br1);
    			append_dev(div, t3);
    			append_dev(div, br2);
    			append_dev(div, t4);
    			append_dev(div, txt1);
    			append_dev(div, t6);
    			append_dev(div, br3);
    			append_dev(div, t7);
    			append_dev(div, br4);
    			append_dev(div, t8);
    			append_dev(div, txt2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(txt1, "click", /*click_handler*/ ctx[2], false, false, false, false),
    					listen_dev(txt2, "click", /*click_handler_1*/ ctx[3], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*info*/ 1 && t0_value !== (t0_value = /*info*/ ctx[0].detail + "")) set_data_dev(t0, t0_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$v.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$v($$self, $$props, $$invalidate) {
    	let $Admin;
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(1, $Admin = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Event_yakumo', slots, []);
    	let { info } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (info === undefined && !('info' in $$props || $$self.$$.bound[$$self.$$.props['info']])) {
    			console.warn("<Event_yakumo> was created without expected prop 'info'");
    		}
    	});

    	const writable_props = ['info'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Event_yakumo> was created with unknown prop '${key}'`);
    	});

    	const click_handler = _ => {
    		$Admin.event.heal(100, true);
    		$Admin.event.finish();
    		window.msg({ content: "感觉精神饱满" });
    	};

    	const click_handler_1 = _ => {
    		$Admin.event.getSouvenir();
    		$Admin.event.finish();
    	};

    	$$self.$$set = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	$$self.$capture_state = () => ({ Admin, info, $Admin });

    	$$self.$inject_state = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [info, $Admin, click_handler, click_handler_1];
    }

    class Event_yakumo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$v, create_fragment$v, safe_not_equal, { info: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Event_yakumo",
    			options,
    			id: create_fragment$v.name
    		});
    	}

    	get info() {
    		throw new Error("<Event_yakumo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set info(value) {
    		throw new Error("<Event_yakumo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\addon\part\event_canteen.svelte generated by Svelte v3.59.2 */
    const file$u = "src\\addon\\part\\event_canteen.svelte";

    function get_each_context$c(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[9] = list;
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (95:4) {#each product as p, i (i)}
    function create_each_block$c(key_1, ctx) {
    	let div;
    	let icon0;
    	let icon0_class_value;
    	let t0;
    	let txt;
    	let icon1;
    	let t1_value = /*p*/ ctx[8].piece + "";
    	let t1;
    	let t2;
    	let i = /*i*/ ctx[10];
    	const assign_div = () => /*div_binding*/ ctx[3](div, i);
    	const unassign_div = () => /*div_binding*/ ctx[3](null, i);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			icon0 = element("icon");
    			t0 = space();
    			txt = element("txt");
    			icon1 = element("icon");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(icon0, "class", icon0_class_value = "icon-" + /*p*/ ctx[8].key + " svelte-1jdgn6v");
    			add_location(icon0, file$u, 100, 8, 2383);
    			attr_dev(icon1, "class", "icon-coin");
    			add_location(icon1, file$u, 101, 13, 2427);
    			attr_dev(txt, "class", "svelte-1jdgn6v");
    			add_location(txt, file$u, 101, 8, 2422);
    			attr_dev(div, "class", "product svelte-1jdgn6v");
    			set_style(div, "background-color", "var(--" + /*p*/ ctx[8].color + ")");
    			add_location(div, file$u, 95, 6, 2252);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, icon0);
    			append_dev(div, t0);
    			append_dev(div, txt);
    			append_dev(txt, icon1);
    			append_dev(txt, t1);
    			append_dev(div, t2);
    			assign_div();
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*product*/ 2 && icon0_class_value !== (icon0_class_value = "icon-" + /*p*/ ctx[8].key + " svelte-1jdgn6v")) {
    				attr_dev(icon0, "class", icon0_class_value);
    			}

    			if (dirty & /*product*/ 2 && t1_value !== (t1_value = /*p*/ ctx[8].piece + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*product*/ 2) {
    				set_style(div, "background-color", "var(--" + /*p*/ ctx[8].color + ")");
    			}

    			if (i !== /*i*/ ctx[10]) {
    				unassign_div();
    				i = /*i*/ ctx[10];
    				assign_div();
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			unassign_div();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$c.name,
    		type: "each",
    		source: "(95:4) {#each product as p, i (i)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$u(ctx) {
    	let div1;
    	let txt;
    	let t0_value = /*info*/ ctx[0].detail + "";
    	let t0;
    	let t1;
    	let div0;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_value = /*product*/ ctx[1];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*i*/ ctx[10];
    	validate_each_keys(ctx, each_value, get_each_context$c, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$c(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$c(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			txt = element("txt");
    			t0 = text(t0_value);
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(txt, "class", "svelte-1jdgn6v");
    			add_location(txt, file$u, 92, 2, 2161);
    			attr_dev(div0, "class", "products svelte-1jdgn6v");
    			add_location(div0, file$u, 93, 2, 2189);
    			attr_dev(div1, "class", "content svelte-1jdgn6v");
    			add_location(div1, file$u, 91, 0, 2136);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, txt);
    			append_dev(txt, t0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div0, null);
    				}
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*info*/ 1 && t0_value !== (t0_value = /*info*/ ctx[0].detail + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*product, element*/ 6) {
    				each_value = /*product*/ ctx[1];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$c, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div0, destroy_block, create_each_block$c, null, get_each_context$c);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$u.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$u($$self, $$props, $$invalidate) {
    	let $Admin;
    	let $Explain;
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(4, $Admin = $$value));
    	validate_store(Explain, 'Explain');
    	component_subscribe($$self, Explain, $$value => $$invalidate(5, $Explain = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Event_canteen', slots, []);
    	let { info } = $$props;
    	let product;
    	const element = [];

    	if (info.cache.product) product = info.cache.product; else {
    		info.cache.product = summonProduct();
    		product = info.cache.product;
    	}

    	onMount(function () {
    		element.forEach((e, i) => {
    			let info = {
    				forget: { name: "忘却", detail: "忘却指定的一张牌。" },
    				heal: { name: "休憩", detail: "回复10生命值。" }
    			};

    			$Explain(e).color(product[i].color).with(info[product[i].key]);
    			e.onclick = _ => purchase(product[i]);
    		});
    	});

    	function summonProduct() {
    		let res = [
    			{ key: "forget", piece: 0, color: "red" },
    			{ key: "forget", piece: 300, color: "red" },
    			{ key: "forget", piece: 500, color: "red" },
    			{ key: "heal", piece: 150, color: "green" },
    			{ key: "heal", piece: 150, color: "green" },
    			{ key: "heal", piece: 150, color: "green" }
    		];

    		$$invalidate(1, product = $Admin.discount(res));
    		return res;
    	}

    	function purchase(p) {
    		if (p.color != "gray") {
    			if ($Admin.data.coin >= p.piece) {
    				$$invalidate(1, product);
    				set_store_value(Admin, $Admin.data.coin -= p.piece, $Admin);

    				if (p.color == "red") {
    					$Admin.event.forgetCard();
    					msg({ content: `忘却一张牌` });
    				} else {
    					$Admin.event.heal(10);
    					msg({ content: `回复10生命值` });
    				}

    				p.color = "gray";
    			} else msg({ content: "硬币不足" });
    		}
    	}

    	$$self.$$.on_mount.push(function () {
    		if (info === undefined && !('info' in $$props || $$self.$$.bound[$$self.$$.props['info']])) {
    			console.warn("<Event_canteen> was created without expected prop 'info'");
    		}
    	});

    	const writable_props = ['info'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Event_canteen> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value, i) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element[i] = $$value;
    			$$invalidate(2, element);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	$$self.$capture_state = () => ({
    		Admin,
    		Explain,
    		onMount,
    		beforeUpdate,
    		Collection: collection$2,
    		Equipment: equipment$1,
    		Souvenir: souvenir$1,
    		Spellcard: spellcard$1,
    		Consumable: consumable$1,
    		Basecard: basecard,
    		info,
    		product,
    		element,
    		summonProduct,
    		purchase,
    		$Admin,
    		$Explain
    	});

    	$$self.$inject_state = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    		if ('product' in $$props) $$invalidate(1, product = $$props.product);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [info, product, element, div_binding];
    }

    class Event_canteen extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$u, create_fragment$u, safe_not_equal, { info: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Event_canteen",
    			options,
    			id: create_fragment$u.name
    		});
    	}

    	get info() {
    		throw new Error("<Event_canteen>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set info(value) {
    		throw new Error("<Event_canteen>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\addon\part\event_school.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1$b } = globals;
    const file$t = "src\\addon\\part\\event_school.svelte";

    function get_each_context$b(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[9] = list;
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (60:4) {#each product as p, i (i)}
    function create_each_block$b(key_1, ctx) {
    	let div;
    	let card;
    	let t;
    	let i = /*i*/ ctx[10];
    	let current;

    	card = new Card({
    			props: {
    				key: /*p*/ ctx[8].key,
    				cover: /*p*/ ctx[8].sold && { name: "空", detail: "已学习" }
    			},
    			$$inline: true
    		});

    	const assign_div = () => /*div_binding*/ ctx[4](div, i);
    	const unassign_div = () => /*div_binding*/ ctx[4](null, i);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			create_component(card.$$.fragment);
    			t = space();
    			attr_dev(div, "class", "product svelte-cpvc4w");
    			add_location(div, file$t, 60, 6, 1712);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(card, div, null);
    			append_dev(div, t);
    			assign_div();
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const card_changes = {};
    			if (dirty & /*product*/ 2) card_changes.key = /*p*/ ctx[8].key;
    			if (dirty & /*product*/ 2) card_changes.cover = /*p*/ ctx[8].sold && { name: "空", detail: "已学习" };
    			card.$set(card_changes);

    			if (i !== /*i*/ ctx[10]) {
    				unassign_div();
    				i = /*i*/ ctx[10];
    				assign_div();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(card);
    			unassign_div();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$b.name,
    		type: "each",
    		source: "(60:4) {#each product as p, i (i)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$t(ctx) {
    	let div1;
    	let txt0;
    	let t0_value = /*info*/ ctx[0].detail + "";
    	let t0;
    	let t1;
    	let txt1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let div0;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let each_value = /*product*/ ctx[1];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*i*/ ctx[10];
    	validate_each_keys(ctx, each_value, get_each_context$b, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$b(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$b(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			txt0 = element("txt");
    			t0 = text(t0_value);
    			t1 = space();
    			txt1 = element("txt");
    			t2 = text("大概还能学习 ");
    			t3 = text(/*count*/ ctx[2]);
    			t4 = text(" 种符卡。");
    			t5 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(txt0, "class", "svelte-cpvc4w");
    			add_location(txt0, file$t, 56, 2, 1577);
    			attr_dev(txt1, "class", "svelte-cpvc4w");
    			add_location(txt1, file$t, 57, 2, 1605);
    			attr_dev(div0, "class", "products svelte-cpvc4w");
    			add_location(div0, file$t, 58, 2, 1649);
    			attr_dev(div1, "class", "content svelte-cpvc4w");
    			add_location(div1, file$t, 55, 0, 1552);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, txt0);
    			append_dev(txt0, t0);
    			append_dev(div1, t1);
    			append_dev(div1, txt1);
    			append_dev(txt1, t2);
    			append_dev(txt1, t3);
    			append_dev(txt1, t4);
    			append_dev(div1, t5);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div0, null);
    				}
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*info*/ 1) && t0_value !== (t0_value = /*info*/ ctx[0].detail + "")) set_data_dev(t0, t0_value);
    			if (!current || dirty & /*count*/ 4) set_data_dev(t3, /*count*/ ctx[2]);

    			if (dirty & /*element, product*/ 10) {
    				each_value = /*product*/ ctx[1];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$b, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div0, outro_and_destroy_block, create_each_block$b, null, get_each_context$b);
    				check_outros();
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
    			if (detaching) detach_dev(div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$t.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$t($$self, $$props, $$invalidate) {
    	let $Admin;
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(5, $Admin = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Event_school', slots, []);
    	let { info } = $$props;
    	let product;
    	let count = 2;
    	const element = [];
    	if (info.cache.product) product = info.cache.product; else info.cache.product = summonProduct();
    	if (typeof info.cache.count == "number") count = info.cache.count;

    	onMount(function () {
    		element.forEach((e, i) => {
    			e.onclick = _ => purchase(product[i]);
    		});
    	});

    	function summonProduct() {
    		let source = Object.keys(spellcard$1).filter(s => spellcard$1[s].role == $Admin.data.role).rd().splice(0, $Admin.data.sugar + 3);

    		let res = source.map(c => {
    			return { key: c, sold: false };
    		});

    		$$invalidate(1, product = $Admin.discount(res));
    		return res;
    	}

    	function purchase(p) {
    		if (!p.sold) {
    			if (count != 0) {
    				$$invalidate(1, product);
    				p.key.increaseOf($Admin.data.card);
    				msg({ content: `已学习[${spellcard$1[p.key].name}]` });
    				p.sold = true;
    				$$invalidate(2, count--, count);
    				$$invalidate(0, info.cache.count = count, info);
    			} else msg({ content: "时间精力不足！" });
    		}
    	}

    	$$self.$$.on_mount.push(function () {
    		if (info === undefined && !('info' in $$props || $$self.$$.bound[$$self.$$.props['info']])) {
    			console.warn("<Event_school> was created without expected prop 'info'");
    		}
    	});

    	const writable_props = ['info'];

    	Object_1$b.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Event_school> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value, i) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element[i] = $$value;
    			$$invalidate(3, element);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	$$self.$capture_state = () => ({
    		Admin,
    		Explain,
    		onMount,
    		beforeUpdate,
    		Collection: collection$2,
    		Equipment: equipment$1,
    		Souvenir: souvenir$1,
    		Spellcard: spellcard$1,
    		Consumable: consumable$1,
    		Basecard: basecard,
    		Card,
    		info,
    		product,
    		count,
    		element,
    		summonProduct,
    		purchase,
    		$Admin
    	});

    	$$self.$inject_state = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    		if ('product' in $$props) $$invalidate(1, product = $$props.product);
    		if ('count' in $$props) $$invalidate(2, count = $$props.count);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [info, product, count, element, div_binding];
    }

    class Event_school extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$t, create_fragment$t, safe_not_equal, { info: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Event_school",
    			options,
    			id: create_fragment$t.name
    		});
    	}

    	get info() {
    		throw new Error("<Event_school>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set info(value) {
    		throw new Error("<Event_school>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\addon\part\event_chest.svelte generated by Svelte v3.59.2 */
    const file$s = "src\\addon\\part\\event_chest.svelte";

    function create_fragment$s(ctx) {
    	let div;
    	let txt0;
    	let t0_value = /*info*/ ctx[0].detail + "";
    	let t0;
    	let t1;
    	let br0;
    	let t2;
    	let br1;
    	let t3;
    	let br2;
    	let t4;
    	let txt1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			txt0 = element("txt");
    			t0 = text(t0_value);
    			t1 = space();
    			br0 = element("br");
    			t2 = space();
    			br1 = element("br");
    			t3 = space();
    			br2 = element("br");
    			t4 = space();
    			txt1 = element("txt");
    			txt1.textContent = "打开";
    			attr_dev(txt0, "class", "svelte-1ogutcc");
    			add_location(txt0, file$s, 8, 2, 112);
    			add_location(br0, file$s, 9, 2, 140);
    			add_location(br1, file$s, 10, 2, 150);
    			add_location(br2, file$s, 11, 2, 160);
    			attr_dev(txt1, "class", "selection svelte-1ogutcc");
    			add_location(txt1, file$s, 12, 2, 170);
    			attr_dev(div, "class", "content svelte-1ogutcc");
    			add_location(div, file$s, 7, 0, 87);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, txt0);
    			append_dev(txt0, t0);
    			append_dev(div, t1);
    			append_dev(div, br0);
    			append_dev(div, t2);
    			append_dev(div, br1);
    			append_dev(div, t3);
    			append_dev(div, br2);
    			append_dev(div, t4);
    			append_dev(div, txt1);

    			if (!mounted) {
    				dispose = listen_dev(txt1, "click", /*click_handler*/ ctx[2], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*info*/ 1 && t0_value !== (t0_value = /*info*/ ctx[0].detail + "")) set_data_dev(t0, t0_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$s.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$s($$self, $$props, $$invalidate) {
    	let $Admin;
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(1, $Admin = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Event_chest', slots, []);
    	let { info } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (info === undefined && !('info' in $$props || $$self.$$.bound[$$self.$$.props['info']])) {
    			console.warn("<Event_chest> was created without expected prop 'info'");
    		}
    	});

    	const writable_props = ['info'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Event_chest> was created with unknown prop '${key}'`);
    	});

    	const click_handler = _ => {
    		let r = Math.random();
    		$Admin.event.getCollection(r > 0.75 ? "green" : "blue");
    		$Admin.event.finish();
    		window.msg({ content: "获得收藏品" });
    	};

    	$$self.$$set = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	$$self.$capture_state = () => ({ Admin, info, $Admin });

    	$$self.$inject_state = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [info, $Admin, click_handler];
    }

    class Event_chest extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$s, create_fragment$s, safe_not_equal, { info: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Event_chest",
    			options,
    			id: create_fragment$s.name
    		});
    	}

    	get info() {
    		throw new Error("<Event_chest>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set info(value) {
    		throw new Error("<Event_chest>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\addon\part\event_muxiazi.svelte generated by Svelte v3.59.2 */
    const file$r = "src\\addon\\part\\event_muxiazi.svelte";

    function create_fragment$r(ctx) {
    	let div;
    	let txt0;
    	let t0_value = /*info*/ ctx[0].detail + "";
    	let t0;
    	let t1;
    	let br0;
    	let t2;
    	let br1;
    	let t3;
    	let br2;
    	let t4;
    	let txt1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			txt0 = element("txt");
    			t0 = text(t0_value);
    			t1 = space();
    			br0 = element("br");
    			t2 = space();
    			br1 = element("br");
    			t3 = space();
    			br2 = element("br");
    			t4 = space();
    			txt1 = element("txt");
    			txt1.textContent = "打开";
    			attr_dev(txt0, "class", "svelte-1ogutcc");
    			add_location(txt0, file$r, 8, 2, 112);
    			add_location(br0, file$r, 9, 2, 140);
    			add_location(br1, file$r, 10, 2, 150);
    			add_location(br2, file$r, 11, 2, 160);
    			attr_dev(txt1, "class", "selection svelte-1ogutcc");
    			add_location(txt1, file$r, 12, 2, 170);
    			attr_dev(div, "class", "content svelte-1ogutcc");
    			add_location(div, file$r, 7, 0, 87);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, txt0);
    			append_dev(txt0, t0);
    			append_dev(div, t1);
    			append_dev(div, br0);
    			append_dev(div, t2);
    			append_dev(div, br1);
    			append_dev(div, t3);
    			append_dev(div, br2);
    			append_dev(div, t4);
    			append_dev(div, txt1);

    			if (!mounted) {
    				dispose = listen_dev(txt1, "click", /*click_handler*/ ctx[2], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*info*/ 1 && t0_value !== (t0_value = /*info*/ ctx[0].detail + "")) set_data_dev(t0, t0_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$r.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$r($$self, $$props, $$invalidate) {
    	let $Admin;
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(1, $Admin = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Event_muxiazi', slots, []);
    	let { info } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (info === undefined && !('info' in $$props || $$self.$$.bound[$$self.$$.props['info']])) {
    			console.warn("<Event_muxiazi> was created without expected prop 'info'");
    		}
    	});

    	const writable_props = ['info'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Event_muxiazi> was created with unknown prop '${key}'`);
    	});

    	const click_handler = _ => {
    		let r = Math.random();

    		if (r > 0.6) {
    			$Admin.event.getSpellcard();
    			window.msg({ content: "获得符卡" });
    		} else {
    			$Admin.event.getBasecard();
    			window.msg({ content: "获得通式" });
    		}

    		$Admin.event.finish();
    	};

    	$$self.$$set = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	$$self.$capture_state = () => ({ Admin, info, $Admin });

    	$$self.$inject_state = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [info, $Admin, click_handler];
    }

    class Event_muxiazi extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$r, create_fragment$r, safe_not_equal, { info: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Event_muxiazi",
    			options,
    			id: create_fragment$r.name
    		});
    	}

    	get info() {
    		throw new Error("<Event_muxiazi>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set info(value) {
    		throw new Error("<Event_muxiazi>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\addon\part\event_zixuan.svelte generated by Svelte v3.59.2 */
    const file$q = "src\\addon\\part\\event_zixuan.svelte";

    function create_fragment$q(ctx) {
    	let div;
    	let txt0;
    	let t0_value = /*info*/ ctx[0].detail + "";
    	let t0;
    	let t1;
    	let br0;
    	let t2;
    	let br1;
    	let t3;
    	let br2;
    	let t4;
    	let txt1;
    	let t6;
    	let br3;
    	let t7;
    	let br4;
    	let t8;
    	let txt2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			txt0 = element("txt");
    			t0 = text(t0_value);
    			t1 = space();
    			br0 = element("br");
    			t2 = space();
    			br1 = element("br");
    			t3 = space();
    			br2 = element("br");
    			t4 = space();
    			txt1 = element("txt");
    			txt1.textContent = "祈求进取";
    			t6 = space();
    			br3 = element("br");
    			t7 = space();
    			br4 = element("br");
    			t8 = space();
    			txt2 = element("txt");
    			txt2.textContent = "祈求祝福";
    			attr_dev(txt0, "class", "svelte-6iu958");
    			add_location(txt0, file$q, 8, 2, 112);
    			add_location(br0, file$q, 9, 2, 140);
    			add_location(br1, file$q, 10, 2, 150);
    			add_location(br2, file$q, 11, 2, 160);
    			attr_dev(txt1, "class", "selection svelte-6iu958");
    			add_location(txt1, file$q, 12, 2, 170);
    			add_location(br3, file$q, 19, 2, 318);
    			add_location(br4, file$q, 20, 2, 328);
    			attr_dev(txt2, "class", "selection svelte-6iu958");
    			add_location(txt2, file$q, 21, 2, 338);
    			attr_dev(div, "class", "content svelte-6iu958");
    			add_location(div, file$q, 7, 0, 87);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, txt0);
    			append_dev(txt0, t0);
    			append_dev(div, t1);
    			append_dev(div, br0);
    			append_dev(div, t2);
    			append_dev(div, br1);
    			append_dev(div, t3);
    			append_dev(div, br2);
    			append_dev(div, t4);
    			append_dev(div, txt1);
    			append_dev(div, t6);
    			append_dev(div, br3);
    			append_dev(div, t7);
    			append_dev(div, br4);
    			append_dev(div, t8);
    			append_dev(div, txt2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(txt1, "click", /*click_handler*/ ctx[2], false, false, false, false),
    					listen_dev(txt2, "click", /*click_handler_1*/ ctx[3], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*info*/ 1 && t0_value !== (t0_value = /*info*/ ctx[0].detail + "")) set_data_dev(t0, t0_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$q.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$q($$self, $$props, $$invalidate) {
    	let $Admin;
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(1, $Admin = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Event_zixuan', slots, []);
    	let { info } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (info === undefined && !('info' in $$props || $$self.$$.bound[$$self.$$.props['info']])) {
    			console.warn("<Event_zixuan> was created without expected prop 'info'");
    		}
    	});

    	const writable_props = ['info'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Event_zixuan> was created with unknown prop '${key}'`);
    	});

    	const click_handler = _ => {
    		$Admin.event.getSpellcard(true);
    		$Admin.event.finish();
    	};

    	const click_handler_1 = _ => {
    		$Admin.event.getCollection("green", true);
    		$Admin.event.finish();
    	};

    	$$self.$$set = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	$$self.$capture_state = () => ({ Admin, info, $Admin });

    	$$self.$inject_state = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [info, $Admin, click_handler, click_handler_1];
    }

    class Event_zixuan extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$q, create_fragment$q, safe_not_equal, { info: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Event_zixuan",
    			options,
    			id: create_fragment$q.name
    		});
    	}

    	get info() {
    		throw new Error("<Event_zixuan>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set info(value) {
    		throw new Error("<Event_zixuan>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\addon\part\event_coin.svelte generated by Svelte v3.59.2 */
    const file$p = "src\\addon\\part\\event_coin.svelte";

    function create_fragment$p(ctx) {
    	let div;
    	let txt0;
    	let t0_value = /*info*/ ctx[0].detail + "";
    	let t0;
    	let t1;
    	let br0;
    	let t2;
    	let br1;
    	let t3;
    	let br2;
    	let t4;
    	let txt1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			txt0 = element("txt");
    			t0 = text(t0_value);
    			t1 = space();
    			br0 = element("br");
    			t2 = space();
    			br1 = element("br");
    			t3 = space();
    			br2 = element("br");
    			t4 = space();
    			txt1 = element("txt");
    			txt1.textContent = "数一数";
    			attr_dev(txt0, "class", "svelte-1ogutcc");
    			add_location(txt0, file$p, 8, 2, 112);
    			add_location(br0, file$p, 9, 2, 140);
    			add_location(br1, file$p, 10, 2, 150);
    			add_location(br2, file$p, 11, 2, 160);
    			attr_dev(txt1, "class", "selection svelte-1ogutcc");
    			add_location(txt1, file$p, 12, 2, 170);
    			attr_dev(div, "class", "content svelte-1ogutcc");
    			add_location(div, file$p, 7, 0, 87);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, txt0);
    			append_dev(txt0, t0);
    			append_dev(div, t1);
    			append_dev(div, br0);
    			append_dev(div, t2);
    			append_dev(div, br1);
    			append_dev(div, t3);
    			append_dev(div, br2);
    			append_dev(div, t4);
    			append_dev(div, txt1);

    			if (!mounted) {
    				dispose = listen_dev(txt1, "click", /*click_handler*/ ctx[2], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*info*/ 1 && t0_value !== (t0_value = /*info*/ ctx[0].detail + "")) set_data_dev(t0, t0_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$p.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$p($$self, $$props, $$invalidate) {
    	let $Admin;
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(1, $Admin = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Event_coin', slots, []);
    	let { info } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (info === undefined && !('info' in $$props || $$self.$$.bound[$$self.$$.props['info']])) {
    			console.warn("<Event_coin> was created without expected prop 'info'");
    		}
    	});

    	const writable_props = ['info'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Event_coin> was created with unknown prop '${key}'`);
    	});

    	const click_handler = _ => {
    		let r = 120 - Math.random() * 40;
    		$Admin.event.getCoin(window.retain(r, 0));
    		$Admin.event.finish();
    	};

    	$$self.$$set = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	$$self.$capture_state = () => ({ Admin, info, $Admin });

    	$$self.$inject_state = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [info, $Admin, click_handler];
    }

    class Event_coin extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$p, create_fragment$p, safe_not_equal, { info: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Event_coin",
    			options,
    			id: create_fragment$p.name
    		});
    	}

    	get info() {
    		throw new Error("<Event_coin>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set info(value) {
    		throw new Error("<Event_coin>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\addon\part\event_delete_and_many.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1$a } = globals;
    const file$o = "src\\addon\\part\\event_delete_and_many.svelte";

    function get_each_context$a(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[9] = list;
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (63:4) {#each ["blue", "green"] as type, i (i)}
    function create_each_block$a(key_1, ctx) {
    	let div2;
    	let div0;
    	let icon0;
    	let icon0_class_value;
    	let txt0;
    	let t1;
    	let div1;
    	let icon1;
    	let icon1_class_value;
    	let txt1;
    	let t2_value = (/*type*/ ctx[8] == "blue" ? 5 : 3) + "";
    	let t2;
    	let t3;
    	let i = /*i*/ ctx[10];
    	const assign_div2 = () => /*div2_binding*/ ctx[3](div2, i);
    	const unassign_div2 = () => /*div2_binding*/ ctx[3](null, i);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			icon0 = element("icon");
    			txt0 = element("txt");
    			txt0.textContent = "×";
    			t1 = space();
    			div1 = element("div");
    			icon1 = element("icon");
    			txt1 = element("txt");
    			t2 = text(t2_value);
    			t3 = space();
    			attr_dev(icon0, "class", icon0_class_value = "icon-" + /*product*/ ctx[1][/*type*/ ctx[8]][0] + " svelte-1w7kwin");
    			add_location(icon0, file$o, 68, 13, 2337);
    			attr_dev(txt0, "class", "svelte-1w7kwin");
    			add_location(txt0, file$o, 68, 53, 2377);
    			attr_dev(div0, "class", "svelte-1w7kwin");
    			add_location(div0, file$o, 68, 8, 2332);
    			attr_dev(icon1, "class", icon1_class_value = "icon-" + /*product*/ ctx[1][/*type*/ ctx[8]][1] + " svelte-1w7kwin");
    			add_location(icon1, file$o, 70, 10, 2422);
    			attr_dev(txt1, "class", "svelte-1w7kwin");
    			add_location(txt1, file$o, 70, 50, 2462);
    			attr_dev(div1, "class", "svelte-1w7kwin");
    			add_location(div1, file$o, 69, 8, 2405);
    			attr_dev(div2, "class", "product svelte-1w7kwin");

    			set_style(div2, "background-color", "var(--" + (/*info*/ ctx[0].cache.gray[/*i*/ ctx[10]]
    			? 'gray'
    			: /*type*/ ctx[8]) + ")");

    			add_location(div2, file$o, 63, 6, 2173);
    			this.first = div2;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, icon0);
    			append_dev(div0, txt0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, icon1);
    			append_dev(div1, txt1);
    			append_dev(txt1, t2);
    			append_dev(div2, t3);
    			assign_div2();
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*product*/ 2 && icon0_class_value !== (icon0_class_value = "icon-" + /*product*/ ctx[1][/*type*/ ctx[8]][0] + " svelte-1w7kwin")) {
    				attr_dev(icon0, "class", icon0_class_value);
    			}

    			if (dirty & /*product*/ 2 && icon1_class_value !== (icon1_class_value = "icon-" + /*product*/ ctx[1][/*type*/ ctx[8]][1] + " svelte-1w7kwin")) {
    				attr_dev(icon1, "class", icon1_class_value);
    			}

    			if (dirty & /*info*/ 1) {
    				set_style(div2, "background-color", "var(--" + (/*info*/ ctx[0].cache.gray[/*i*/ ctx[10]]
    				? 'gray'
    				: /*type*/ ctx[8]) + ")");
    			}

    			if (i !== /*i*/ ctx[10]) {
    				unassign_div2();
    				i = /*i*/ ctx[10];
    				assign_div2();
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			unassign_div2();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$a.name,
    		type: "each",
    		source: "(63:4) {#each [\\\"blue\\\", \\\"green\\\"] as type, i (i)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$o(ctx) {
    	let div1;
    	let txt;
    	let t0_value = /*info*/ ctx[0].detail + "";
    	let t0;
    	let t1;
    	let div0;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_value = ["blue", "green"];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*i*/ ctx[10];
    	validate_each_keys(ctx, each_value, get_each_context$a, get_key);

    	for (let i = 0; i < 2; i += 1) {
    		let child_ctx = get_each_context$a(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$a(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			txt = element("txt");
    			t0 = text(t0_value);
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < 2; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(txt, "class", "svelte-1w7kwin");
    			add_location(txt, file$o, 60, 2, 2069);
    			attr_dev(div0, "class", "products svelte-1w7kwin");
    			add_location(div0, file$o, 61, 2, 2097);
    			attr_dev(div1, "class", "content svelte-1w7kwin");
    			add_location(div1, file$o, 59, 0, 2044);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, txt);
    			append_dev(txt, t0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < 2; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div0, null);
    				}
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*info*/ 1 && t0_value !== (t0_value = /*info*/ ctx[0].detail + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*info, element, product*/ 7) {
    				each_value = ["blue", "green"];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$a, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div0, destroy_block, create_each_block$a, null, get_each_context$a);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);

    			for (let i = 0; i < 2; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$o.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$o($$self, $$props, $$invalidate) {
    	let $Admin;
    	let $Explain;
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(4, $Admin = $$value));
    	validate_store(Explain, 'Explain');
    	component_subscribe($$self, Explain, $$value => $$invalidate(5, $Explain = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Event_delete_and_many', slots, []);
    	let { info } = $$props;
    	let product;
    	const element = [];
    	if (info.cache.product) product = info.cache.product; else info.cache.product = summonProduct();
    	if (!info.cache.gray) info.cache.gray = [false, false];

    	onMount(function () {
    		element.forEach((e, i) => {
    			let type = ["blue", "green"][i];

    			let info = {
    				name: "接受",
    				detail: `将[${collection$2[product[type][0]].name}]移出游戏，获得[${collection$2[product[type][1]].name}]*${type == "blue" ? 5 : 3}。\n
        [${collection$2[product[type][0]].name}]: ${collection$2[product[type][0]].detail}\n
        [${collection$2[product[type][1]].name}]: ${collection$2[product[type][1]].detail}`
    			};

    			$Explain(e).color(type).with(info);
    			e.onclick = _ => purchase(i);
    		});
    	});

    	function summonProduct() {
    		let res = {};
    		["blue", "green"].forEach(type => res[type] = Object.keys(collection$2).filter(c => collection$2[c].type == type).rd().splice(0, 2));
    		$$invalidate(1, product = res);
    		return res;
    	}

    	function purchase(i) {
    		let type = ["blue", "green"][i];

    		if (!info.cache.gray[i]) {
    			$$invalidate(1, product);
    			let amount = type == "blue" ? 5 : 3;
    			product[type][1].increaseOf($Admin.data.collection);
    			set_store_value(Admin, $Admin.data.collection[product[type][1]] += amount - 1, $Admin);
    			delete $Admin.data.collection[product[type][0]];
    			$Admin.data.blackList.push(product[type][0]);

    			msg({
    				content: `获得[${collection$2[product[type][1]].name}]*${amount}`
    			});

    			$$invalidate(0, info.cache.gray[i] = true, info);
    		}
    	}

    	$$self.$$.on_mount.push(function () {
    		if (info === undefined && !('info' in $$props || $$self.$$.bound[$$self.$$.props['info']])) {
    			console.warn("<Event_delete_and_many> was created without expected prop 'info'");
    		}
    	});

    	const writable_props = ['info'];

    	Object_1$a.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Event_delete_and_many> was created with unknown prop '${key}'`);
    	});

    	function div2_binding($$value, i) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element[i] = $$value;
    			$$invalidate(2, element);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	$$self.$capture_state = () => ({
    		Admin,
    		Explain,
    		onMount,
    		beforeUpdate,
    		Collection: collection$2,
    		Equipment: equipment$1,
    		Souvenir: souvenir$1,
    		Spellcard: spellcard$1,
    		Consumable: consumable$1,
    		Basecard: basecard,
    		info,
    		product,
    		element,
    		summonProduct,
    		purchase,
    		$Admin,
    		$Explain
    	});

    	$$self.$inject_state = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    		if ('product' in $$props) $$invalidate(1, product = $$props.product);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [info, product, element, div2_binding];
    }

    class Event_delete_and_many extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$o, create_fragment$o, safe_not_equal, { info: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Event_delete_and_many",
    			options,
    			id: create_fragment$o.name
    		});
    	}

    	get info() {
    		throw new Error("<Event_delete_and_many>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set info(value) {
    		throw new Error("<Event_delete_and_many>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\addon\part\event_dragon.svelte generated by Svelte v3.59.2 */
    const file$n = "src\\addon\\part\\event_dragon.svelte";

    function create_fragment$n(ctx) {
    	let div;
    	let txt0;
    	let t1;
    	let txt1;
    	let t3;
    	let br0;
    	let t4;
    	let br1;
    	let t5;
    	let br2;
    	let t6;
    	let txt2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			txt0 = element("txt");
    			txt0.textContent = "双倍的精英敌人，双倍的高级奖励。";
    			t1 = space();
    			txt1 = element("txt");
    			txt1.textContent = "双倍的最终BOSS，双倍的最终奖励。";
    			t3 = space();
    			br0 = element("br");
    			t4 = space();
    			br1 = element("br");
    			t5 = space();
    			br2 = element("br");
    			t6 = space();
    			txt2 = element("txt");
    			txt2.textContent = "叉腰大笑";
    			attr_dev(txt0, "class", "svelte-1ogutcc");
    			add_location(txt0, file$n, 8, 2, 128);
    			attr_dev(txt1, "class", "svelte-1ogutcc");
    			add_location(txt1, file$n, 9, 2, 159);
    			add_location(br0, file$n, 10, 2, 192);
    			add_location(br1, file$n, 11, 2, 202);
    			add_location(br2, file$n, 12, 2, 212);
    			attr_dev(txt2, "class", "selection svelte-1ogutcc");
    			add_location(txt2, file$n, 13, 2, 222);
    			attr_dev(div, "class", "content svelte-1ogutcc");
    			add_location(div, file$n, 7, 0, 103);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, txt0);
    			append_dev(div, t1);
    			append_dev(div, txt1);
    			append_dev(div, t3);
    			append_dev(div, br0);
    			append_dev(div, t4);
    			append_dev(div, br1);
    			append_dev(div, t5);
    			append_dev(div, br2);
    			append_dev(div, t6);
    			append_dev(div, txt2);

    			if (!mounted) {
    				dispose = listen_dev(txt2, "click", /*click_handler*/ ctx[3], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$n.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$n($$self, $$props, $$invalidate) {
    	let $explore;
    	let $Admin;
    	validate_store(explore, 'explore');
    	component_subscribe($$self, explore, $$value => $$invalidate(0, $explore = $$value));
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(1, $Admin = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Event_dragon', slots, []);
    	let { info } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (info === undefined && !('info' in $$props || $$self.$$.bound[$$self.$$.props['info']])) {
    			console.warn("<Event_dragon> was created without expected prop 'info'");
    		}
    	});

    	const writable_props = ['info'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Event_dragon> was created with unknown prop '${key}'`);
    	});

    	const click_handler = _ => {
    		set_store_value(explore, $explore.dragon++, $explore);
    		window.msg({ content: "获得了龙神的注视" });
    		$Admin.event.finish();
    	};

    	$$self.$$set = $$props => {
    		if ('info' in $$props) $$invalidate(2, info = $$props.info);
    	};

    	$$self.$capture_state = () => ({ Admin, explore, info, $explore, $Admin });

    	$$self.$inject_state = $$props => {
    		if ('info' in $$props) $$invalidate(2, info = $$props.info);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$explore, $Admin, info, click_handler];
    }

    class Event_dragon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$n, create_fragment$n, safe_not_equal, { info: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Event_dragon",
    			options,
    			id: create_fragment$n.name
    		});
    	}

    	get info() {
    		throw new Error("<Event_dragon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set info(value) {
    		throw new Error("<Event_dragon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\addon\part\event_donate_blood.svelte generated by Svelte v3.59.2 */
    const file$m = "src\\addon\\part\\event_donate_blood.svelte";

    function create_fragment$m(ctx) {
    	let div;
    	let txt0;
    	let t0_value = /*info*/ ctx[0].detail + "";
    	let t0;
    	let t1;
    	let br0;
    	let t2;
    	let br1;
    	let t3;
    	let br2;
    	let t4;
    	let txt1;
    	let t6;
    	let br3;
    	let t7;
    	let br4;
    	let t8;
    	let txt2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			txt0 = element("txt");
    			t0 = text(t0_value);
    			t1 = space();
    			br0 = element("br");
    			t2 = space();
    			br1 = element("br");
    			t3 = space();
    			br2 = element("br");
    			t4 = space();
    			txt1 = element("txt");
    			txt1.textContent = "献血(生命-25%)";
    			t6 = space();
    			br3 = element("br");
    			t7 = space();
    			br4 = element("br");
    			t8 = space();
    			txt2 = element("txt");
    			txt2.textContent = "下次一定";
    			attr_dev(txt0, "class", "svelte-1ogutcc");
    			add_location(txt0, file$m, 7, 2, 110);
    			add_location(br0, file$m, 8, 2, 138);
    			add_location(br1, file$m, 9, 2, 148);
    			add_location(br2, file$m, 10, 2, 158);
    			attr_dev(txt1, "class", "selection svelte-1ogutcc");
    			add_location(txt1, file$m, 11, 2, 168);
    			add_location(br3, file$m, 23, 2, 553);
    			add_location(br4, file$m, 24, 2, 563);
    			attr_dev(txt2, "class", "selection svelte-1ogutcc");
    			add_location(txt2, file$m, 25, 2, 573);
    			attr_dev(div, "class", "content svelte-1ogutcc");
    			add_location(div, file$m, 6, 0, 85);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, txt0);
    			append_dev(txt0, t0);
    			append_dev(div, t1);
    			append_dev(div, br0);
    			append_dev(div, t2);
    			append_dev(div, br1);
    			append_dev(div, t3);
    			append_dev(div, br2);
    			append_dev(div, t4);
    			append_dev(div, txt1);
    			append_dev(div, t6);
    			append_dev(div, br3);
    			append_dev(div, t7);
    			append_dev(div, br4);
    			append_dev(div, t8);
    			append_dev(div, txt2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(txt1, "click", /*click_handler*/ ctx[2], false, false, false, false),
    					listen_dev(txt2, "click", /*click_handler_1*/ ctx[3], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*info*/ 1 && t0_value !== (t0_value = /*info*/ ctx[0].detail + "")) set_data_dev(t0, t0_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$m($$self, $$props, $$invalidate) {
    	let $Admin;
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(1, $Admin = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Event_donate_blood', slots, []);
    	let { info } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (info === undefined && !('info' in $$props || $$self.$$.bound[$$self.$$.props['info']])) {
    			console.warn("<Event_donate_blood> was created without expected prop 'info'");
    		}
    	});

    	const writable_props = ['info'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Event_donate_blood> was created with unknown prop '${key}'`);
    	});

    	const click_handler = _ => {
    		let res = $Admin.event.loseHealth(25, true);

    		if (res) {
    			let r = Math.random();
    			$Admin.event.getCollection(r > 0.75 ? "red" : "green");
    			$Admin.event.finish();
    			window.msg({ content: "感谢您对爱心事业的贡献" });
    		} else window.msg({ content: "亲，攒点血再来献吧！" });
    	};

    	const click_handler_1 = _ => {
    		$Admin.event.finish();
    	};

    	$$self.$$set = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	$$self.$capture_state = () => ({ Admin, info, $Admin });

    	$$self.$inject_state = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [info, $Admin, click_handler, click_handler_1];
    }

    class Event_donate_blood extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$m, create_fragment$m, safe_not_equal, { info: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Event_donate_blood",
    			options,
    			id: create_fragment$m.name
    		});
    	}

    	get info() {
    		throw new Error("<Event_donate_blood>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set info(value) {
    		throw new Error("<Event_donate_blood>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\addon\part\event_copy.svelte generated by Svelte v3.59.2 */
    const file$l = "src\\addon\\part\\event_copy.svelte";

    function create_fragment$l(ctx) {
    	let div;
    	let txt0;
    	let t0_value = /*info*/ ctx[0].detail + "";
    	let t0;
    	let t1;
    	let br0;
    	let t2;
    	let br1;
    	let t3;
    	let br2;
    	let t4;
    	let txt1;
    	let t6;
    	let br3;
    	let t7;
    	let br4;
    	let t8;
    	let txt2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			txt0 = element("txt");
    			t0 = text(t0_value);
    			t1 = space();
    			br0 = element("br");
    			t2 = space();
    			br1 = element("br");
    			t3 = space();
    			br2 = element("br");
    			t4 = space();
    			txt1 = element("txt");
    			txt1.textContent = "复制一张牌";
    			t6 = space();
    			br3 = element("br");
    			t7 = space();
    			br4 = element("br");
    			t8 = space();
    			txt2 = element("txt");
    			txt2.textContent = "复制一个收藏品";
    			attr_dev(txt0, "class", "svelte-1ogutcc");
    			add_location(txt0, file$l, 7, 2, 110);
    			add_location(br0, file$l, 8, 2, 138);
    			add_location(br1, file$l, 9, 2, 148);
    			add_location(br2, file$l, 10, 2, 158);
    			attr_dev(txt1, "class", "selection svelte-1ogutcc");
    			add_location(txt1, file$l, 11, 2, 168);
    			add_location(br3, file$l, 18, 2, 311);
    			add_location(br4, file$l, 19, 2, 321);
    			attr_dev(txt2, "class", "selection svelte-1ogutcc");
    			add_location(txt2, file$l, 20, 2, 331);
    			attr_dev(div, "class", "content svelte-1ogutcc");
    			add_location(div, file$l, 6, 0, 85);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, txt0);
    			append_dev(txt0, t0);
    			append_dev(div, t1);
    			append_dev(div, br0);
    			append_dev(div, t2);
    			append_dev(div, br1);
    			append_dev(div, t3);
    			append_dev(div, br2);
    			append_dev(div, t4);
    			append_dev(div, txt1);
    			append_dev(div, t6);
    			append_dev(div, br3);
    			append_dev(div, t7);
    			append_dev(div, br4);
    			append_dev(div, t8);
    			append_dev(div, txt2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(txt1, "click", /*click_handler*/ ctx[2], false, false, false, false),
    					listen_dev(txt2, "click", /*click_handler_1*/ ctx[3], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*info*/ 1 && t0_value !== (t0_value = /*info*/ ctx[0].detail + "")) set_data_dev(t0, t0_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
    	let $Admin;
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(1, $Admin = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Event_copy', slots, []);
    	let { info } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (info === undefined && !('info' in $$props || $$self.$$.bound[$$self.$$.props['info']])) {
    			console.warn("<Event_copy> was created without expected prop 'info'");
    		}
    	});

    	const writable_props = ['info'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Event_copy> was created with unknown prop '${key}'`);
    	});

    	const click_handler = _ => {
    		$Admin.event.copy("card");
    		$Admin.event.finish();
    	};

    	const click_handler_1 = _ => {
    		$Admin.event.copy("collection");
    		$Admin.event.finish();
    	};

    	$$self.$$set = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	$$self.$capture_state = () => ({ Admin, info, $Admin });

    	$$self.$inject_state = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [info, $Admin, click_handler, click_handler_1];
    }

    class Event_copy extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, { info: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Event_copy",
    			options,
    			id: create_fragment$l.name
    		});
    	}

    	get info() {
    		throw new Error("<Event_copy>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set info(value) {
    		throw new Error("<Event_copy>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\addon\part\event_big_chest.svelte generated by Svelte v3.59.2 */
    const file$k = "src\\addon\\part\\event_big_chest.svelte";

    function create_fragment$k(ctx) {
    	let div;
    	let txt0;
    	let t1;
    	let txt1;
    	let t2;
    	let t3_value = /*info*/ ctx[0].cache.count * 25 + "";
    	let t3;
    	let t4;
    	let br0;
    	let t5;
    	let br1;
    	let t6;
    	let br2;
    	let t7;
    	let txt2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			txt0 = element("txt");
    			txt0.textContent = "一次投币25，25%概率打开宝箱。";
    			t1 = space();
    			txt1 = element("txt");
    			t2 = text("已投");
    			t3 = text(t3_value);
    			t4 = space();
    			br0 = element("br");
    			t5 = space();
    			br1 = element("br");
    			t6 = space();
    			br2 = element("br");
    			t7 = space();
    			txt2 = element("txt");
    			txt2.textContent = "投币";
    			attr_dev(txt0, "class", "svelte-1ogutcc");
    			add_location(txt0, file$k, 10, 2, 199);
    			attr_dev(txt1, "class", "svelte-1ogutcc");
    			add_location(txt1, file$k, 11, 2, 231);
    			add_location(br0, file$k, 12, 2, 271);
    			add_location(br1, file$k, 13, 2, 281);
    			add_location(br2, file$k, 14, 2, 291);
    			attr_dev(txt2, "class", "selection svelte-1ogutcc");
    			add_location(txt2, file$k, 15, 2, 301);
    			attr_dev(div, "class", "content svelte-1ogutcc");
    			add_location(div, file$k, 9, 0, 174);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, txt0);
    			append_dev(div, t1);
    			append_dev(div, txt1);
    			append_dev(txt1, t2);
    			append_dev(txt1, t3);
    			append_dev(div, t4);
    			append_dev(div, br0);
    			append_dev(div, t5);
    			append_dev(div, br1);
    			append_dev(div, t6);
    			append_dev(div, br2);
    			append_dev(div, t7);
    			append_dev(div, txt2);

    			if (!mounted) {
    				dispose = listen_dev(txt2, "click", /*click_handler*/ ctx[2], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*info*/ 1 && t3_value !== (t3_value = /*info*/ ctx[0].cache.count * 25 + "")) set_data_dev(t3, t3_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props, $$invalidate) {
    	let $Admin;
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(1, $Admin = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Event_big_chest', slots, []);
    	let { info } = $$props;
    	if (!info.cache.count) info.cache.count = 0;

    	$$self.$$.on_mount.push(function () {
    		if (info === undefined && !('info' in $$props || $$self.$$.bound[$$self.$$.props['info']])) {
    			console.warn("<Event_big_chest> was created without expected prop 'info'");
    		}
    	});

    	const writable_props = ['info'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Event_big_chest> was created with unknown prop '${key}'`);
    	});

    	const click_handler = _ => {
    		if ($Admin.data.coin >= 25) {
    			$$invalidate(0, info.cache.count++, info);
    			set_store_value(Admin, $Admin.data.coin -= 25, $Admin);
    			let r1 = Math.random();
    			let r2 = Math.random();

    			if (r1 > 0.75) {
    				window.msg({ content: "宝箱打开了" });
    				if (r2 < 0.5) $Admin.event.getEquipment(); else if (r2 < 0.7) $Admin.event.getCollection("green"); else $Admin.event.getCollection("red");
    				$Admin.event.finish();
    			} else window.msg({ content: "没什么动静" });
    		} else {
    			window.msg({ content: "硬币不足！" });
    		}
    	};

    	$$self.$$set = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	$$self.$capture_state = () => ({ data, Admin, info, $Admin });

    	$$self.$inject_state = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [info, $Admin, click_handler];
    }

    class Event_big_chest extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, { info: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Event_big_chest",
    			options,
    			id: create_fragment$k.name
    		});
    	}

    	get info() {
    		throw new Error("<Event_big_chest>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set info(value) {
    		throw new Error("<Event_big_chest>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\addon\part\event_diaochuang.svelte generated by Svelte v3.59.2 */
    const file$j = "src\\addon\\part\\event_diaochuang.svelte";

    function create_fragment$j(ctx) {
    	let div;
    	let txt0;
    	let t0_value = /*info*/ ctx[0].detail + "";
    	let t0;
    	let t1;
    	let br0;
    	let t2;
    	let br1;
    	let t3;
    	let br2;
    	let t4;
    	let txt1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			txt0 = element("txt");
    			t0 = text(t0_value);
    			t1 = space();
    			br0 = element("br");
    			t2 = space();
    			br1 = element("br");
    			t3 = space();
    			br2 = element("br");
    			t4 = space();
    			txt1 = element("txt");
    			txt1.textContent = "躺一下";
    			attr_dev(txt0, "class", "svelte-1ogutcc");
    			add_location(txt0, file$j, 7, 2, 110);
    			add_location(br0, file$j, 8, 2, 138);
    			add_location(br1, file$j, 9, 2, 148);
    			add_location(br2, file$j, 10, 2, 158);
    			attr_dev(txt1, "class", "selection svelte-1ogutcc");
    			add_location(txt1, file$j, 11, 2, 168);
    			attr_dev(div, "class", "content svelte-1ogutcc");
    			add_location(div, file$j, 6, 0, 85);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, txt0);
    			append_dev(txt0, t0);
    			append_dev(div, t1);
    			append_dev(div, br0);
    			append_dev(div, t2);
    			append_dev(div, br1);
    			append_dev(div, t3);
    			append_dev(div, br2);
    			append_dev(div, t4);
    			append_dev(div, txt1);

    			if (!mounted) {
    				dispose = listen_dev(txt1, "click", /*click_handler*/ ctx[2], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*info*/ 1 && t0_value !== (t0_value = /*info*/ ctx[0].detail + "")) set_data_dev(t0, t0_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let $Admin;
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(1, $Admin = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Event_diaochuang', slots, []);
    	let { info } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (info === undefined && !('info' in $$props || $$self.$$.bound[$$self.$$.props['info']])) {
    			console.warn("<Event_diaochuang> was created without expected prop 'info'");
    		}
    	});

    	const writable_props = ['info'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Event_diaochuang> was created with unknown prop '${key}'`);
    	});

    	const click_handler = _ => {
    		let r = Math.random();
    		let heal = window.retain(20 - r * 15, 0);
    		window.msg({ content: `回复${heal}生命值` });
    		$Admin.event.heal(heal);
    		$Admin.event.finish();
    	};

    	$$self.$$set = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	$$self.$capture_state = () => ({ Admin, info, $Admin });

    	$$self.$inject_state = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [info, $Admin, click_handler];
    }

    class Event_diaochuang extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, { info: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Event_diaochuang",
    			options,
    			id: create_fragment$j.name
    		});
    	}

    	get info() {
    		throw new Error("<Event_diaochuang>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set info(value) {
    		throw new Error("<Event_diaochuang>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\addon\part\event_change.svelte generated by Svelte v3.59.2 */
    const file$i = "src\\addon\\part\\event_change.svelte";

    function create_fragment$i(ctx) {
    	let div;
    	let txt0;
    	let t1;
    	let txt1;
    	let t2;
    	let t3_value = /*info*/ ctx[0].cache.count + "";
    	let t3;
    	let t4;
    	let br0;
    	let t5;
    	let br1;
    	let t6;
    	let br2;
    	let t7;
    	let txt2;
    	let t9;
    	let br3;
    	let t10;
    	let br4;
    	let t11;
    	let txt3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			txt0 = element("txt");
    			txt0.textContent = "将一个东西转化成随机的东西，收藏品有可能会品质浮动，最多跨一级。";
    			t1 = space();
    			txt1 = element("txt");
    			t2 = text("剩余次数: ");
    			t3 = text(t3_value);
    			t4 = space();
    			br0 = element("br");
    			t5 = space();
    			br1 = element("br");
    			t6 = space();
    			br2 = element("br");
    			t7 = space();
    			txt2 = element("txt");
    			txt2.textContent = "转化一张卡牌";
    			t9 = space();
    			br3 = element("br");
    			t10 = space();
    			br4 = element("br");
    			t11 = space();
    			txt3 = element("txt");
    			txt3.textContent = "转化一个收藏品";
    			attr_dev(txt0, "class", "svelte-1ogutcc");
    			add_location(txt0, file$i, 9, 2, 160);
    			attr_dev(txt1, "class", "svelte-1ogutcc");
    			add_location(txt1, file$i, 10, 2, 207);
    			add_location(br0, file$i, 11, 2, 251);
    			add_location(br1, file$i, 12, 2, 261);
    			add_location(br2, file$i, 13, 2, 271);
    			attr_dev(txt2, "class", "selection svelte-1ogutcc");
    			add_location(txt2, file$i, 14, 2, 281);
    			add_location(br3, file$i, 24, 2, 536);
    			add_location(br4, file$i, 25, 2, 546);
    			attr_dev(txt3, "class", "selection svelte-1ogutcc");
    			add_location(txt3, file$i, 26, 2, 556);
    			attr_dev(div, "class", "content svelte-1ogutcc");
    			add_location(div, file$i, 8, 0, 135);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, txt0);
    			append_dev(div, t1);
    			append_dev(div, txt1);
    			append_dev(txt1, t2);
    			append_dev(txt1, t3);
    			append_dev(div, t4);
    			append_dev(div, br0);
    			append_dev(div, t5);
    			append_dev(div, br1);
    			append_dev(div, t6);
    			append_dev(div, br2);
    			append_dev(div, t7);
    			append_dev(div, txt2);
    			append_dev(div, t9);
    			append_dev(div, br3);
    			append_dev(div, t10);
    			append_dev(div, br4);
    			append_dev(div, t11);
    			append_dev(div, txt3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(txt2, "click", /*click_handler*/ ctx[2], false, false, false, false),
    					listen_dev(txt3, "click", /*click_handler_1*/ ctx[3], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*info*/ 1 && t3_value !== (t3_value = /*info*/ ctx[0].cache.count + "")) set_data_dev(t3, t3_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let $Admin;
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(1, $Admin = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Event_change', slots, []);
    	let { info } = $$props;
    	if (!info.cache.count) info.cache.count = 3;

    	$$self.$$.on_mount.push(function () {
    		if (info === undefined && !('info' in $$props || $$self.$$.bound[$$self.$$.props['info']])) {
    			console.warn("<Event_change> was created without expected prop 'info'");
    		}
    	});

    	const writable_props = ['info'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Event_change> was created with unknown prop '${key}'`);
    	});

    	const click_handler = _ => {
    		if (info.cache.count > 0) {
    			$Admin.event.change("card");
    			if (info.cache.count == 1) $Admin.event.finish(); else $$invalidate(0, info.cache.count--, info);
    		}
    	};

    	const click_handler_1 = _ => {
    		if (info.cache.count > 0) {
    			$Admin.event.change("collection");
    			if (info.cache.count == 1) $Admin.event.finish(); else $$invalidate(0, info.cache.count--, info);
    		}
    	};

    	$$self.$$set = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	$$self.$capture_state = () => ({ Admin, info, $Admin });

    	$$self.$inject_state = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [info, $Admin, click_handler, click_handler_1];
    }

    class Event_change extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, { info: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Event_change",
    			options,
    			id: create_fragment$i.name
    		});
    	}

    	get info() {
    		throw new Error("<Event_change>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set info(value) {
    		throw new Error("<Event_change>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\addon\part\event_shoucangjia.svelte generated by Svelte v3.59.2 */
    const file$h = "src\\addon\\part\\event_shoucangjia.svelte";

    function create_fragment$h(ctx) {
    	let div;
    	let txt0;
    	let t0_value = /*info*/ ctx[0].detail + "";
    	let t0;
    	let t1;
    	let br0;
    	let t2;
    	let br1;
    	let t3;
    	let br2;
    	let t4;
    	let txt1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			txt0 = element("txt");
    			t0 = text(t0_value);
    			t1 = space();
    			br0 = element("br");
    			t2 = space();
    			br1 = element("br");
    			t3 = space();
    			br2 = element("br");
    			t4 = space();
    			txt1 = element("txt");
    			txt1.textContent = "出售收藏品";
    			attr_dev(txt0, "class", "svelte-1ogutcc");
    			add_location(txt0, file$h, 9, 2, 159);
    			add_location(br0, file$h, 10, 2, 187);
    			add_location(br1, file$h, 11, 2, 197);
    			add_location(br2, file$h, 12, 2, 207);
    			attr_dev(txt1, "class", "selection svelte-1ogutcc");
    			add_location(txt1, file$h, 13, 2, 217);
    			attr_dev(div, "class", "content svelte-1ogutcc");
    			add_location(div, file$h, 8, 0, 134);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, txt0);
    			append_dev(txt0, t0);
    			append_dev(div, t1);
    			append_dev(div, br0);
    			append_dev(div, t2);
    			append_dev(div, br1);
    			append_dev(div, t3);
    			append_dev(div, br2);
    			append_dev(div, t4);
    			append_dev(div, txt1);

    			if (!mounted) {
    				dispose = listen_dev(txt1, "click", /*click_handler*/ ctx[2], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*info*/ 1 && t0_value !== (t0_value = /*info*/ ctx[0].detail + "")) set_data_dev(t0, t0_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let $Admin;
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(1, $Admin = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Event_shoucangjia', slots, []);
    	let { info } = $$props;
    	if (!info.cache.sold) info.cache.sold = [];

    	$$self.$$.on_mount.push(function () {
    		if (info === undefined && !('info' in $$props || $$self.$$.bound[$$self.$$.props['info']])) {
    			console.warn("<Event_shoucangjia> was created without expected prop 'info'");
    		}
    	});

    	const writable_props = ['info'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Event_shoucangjia> was created with unknown prop '${key}'`);
    	});

    	const click_handler = _ => {
    		$Admin.event.sellCollection(info.cache.sold);
    	};

    	$$self.$$set = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	$$self.$capture_state = () => ({ Admin, info, $Admin });

    	$$self.$inject_state = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [info, $Admin, click_handler];
    }

    class Event_shoucangjia extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, { info: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Event_shoucangjia",
    			options,
    			id: create_fragment$h.name
    		});
    	}

    	get info() {
    		throw new Error("<Event_shoucangjia>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set info(value) {
    		throw new Error("<Event_shoucangjia>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\addon\part\event_zagu.svelte generated by Svelte v3.59.2 */
    const file$g = "src\\addon\\part\\event_zagu.svelte";

    function create_fragment$g(ctx) {
    	let div;
    	let txt0;
    	let t0_value = /*info*/ ctx[0].detail + "";
    	let t0;
    	let t1;
    	let br0;
    	let t2;
    	let br1;
    	let t3;
    	let br2;
    	let t4;
    	let txt1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			txt0 = element("txt");
    			t0 = text(t0_value);
    			t1 = space();
    			br0 = element("br");
    			t2 = space();
    			br1 = element("br");
    			t3 = space();
    			br2 = element("br");
    			t4 = space();
    			txt1 = element("txt");
    			txt1.textContent = "遭遇杂鱼";
    			attr_dev(txt0, "class", "svelte-1ogutcc");
    			add_location(txt0, file$g, 8, 2, 112);
    			add_location(br0, file$g, 9, 2, 140);
    			add_location(br1, file$g, 10, 2, 150);
    			add_location(br2, file$g, 11, 2, 160);
    			attr_dev(txt1, "class", "selection svelte-1ogutcc");
    			add_location(txt1, file$g, 12, 2, 170);
    			attr_dev(div, "class", "content svelte-1ogutcc");
    			add_location(div, file$g, 7, 0, 87);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, txt0);
    			append_dev(txt0, t0);
    			append_dev(div, t1);
    			append_dev(div, br0);
    			append_dev(div, t2);
    			append_dev(div, br1);
    			append_dev(div, t3);
    			append_dev(div, br2);
    			append_dev(div, t4);
    			append_dev(div, txt1);

    			if (!mounted) {
    				dispose = listen_dev(txt1, "click", /*click_handler*/ ctx[2], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*info*/ 1 && t0_value !== (t0_value = /*info*/ ctx[0].detail + "")) set_data_dev(t0, t0_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let $Admin;
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(1, $Admin = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Event_zagu', slots, []);
    	let { info } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (info === undefined && !('info' in $$props || $$self.$$.bound[$$self.$$.props['info']])) {
    			console.warn("<Event_zagu> was created without expected prop 'info'");
    		}
    	});

    	const writable_props = ['info'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Event_zagu> was created with unknown prop '${key}'`);
    	});

    	const click_handler = _ => {
    		$Admin.event.summonZagu();
    		$Admin.event.finish();
    	};

    	$$self.$$set = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	$$self.$capture_state = () => ({ Admin, info, $Admin });

    	$$self.$inject_state = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [info, $Admin, click_handler];
    }

    class Event_zagu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, { info: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Event_zagu",
    			options,
    			id: create_fragment$g.name
    		});
    	}

    	get info() {
    		throw new Error("<Event_zagu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set info(value) {
    		throw new Error("<Event_zagu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\addon\part\event_elite.svelte generated by Svelte v3.59.2 */
    const file$f = "src\\addon\\part\\event_elite.svelte";

    function create_fragment$f(ctx) {
    	let div;
    	let txt0;
    	let t0_value = /*info*/ ctx[0].detail + "";
    	let t0;
    	let t1;
    	let br0;
    	let t2;
    	let br1;
    	let t3;
    	let br2;
    	let t4;
    	let txt1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			txt0 = element("txt");
    			t0 = text(t0_value);
    			t1 = space();
    			br0 = element("br");
    			t2 = space();
    			br1 = element("br");
    			t3 = space();
    			br2 = element("br");
    			t4 = space();
    			txt1 = element("txt");
    			txt1.textContent = "遭遇强敌";
    			attr_dev(txt0, "class", "svelte-1ogutcc");
    			add_location(txt0, file$f, 8, 2, 112);
    			add_location(br0, file$f, 9, 2, 140);
    			add_location(br1, file$f, 10, 2, 150);
    			add_location(br2, file$f, 11, 2, 160);
    			attr_dev(txt1, "class", "selection svelte-1ogutcc");
    			add_location(txt1, file$f, 12, 2, 170);
    			attr_dev(div, "class", "content svelte-1ogutcc");
    			add_location(div, file$f, 7, 0, 87);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, txt0);
    			append_dev(txt0, t0);
    			append_dev(div, t1);
    			append_dev(div, br0);
    			append_dev(div, t2);
    			append_dev(div, br1);
    			append_dev(div, t3);
    			append_dev(div, br2);
    			append_dev(div, t4);
    			append_dev(div, txt1);

    			if (!mounted) {
    				dispose = listen_dev(txt1, "click", /*click_handler*/ ctx[2], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*info*/ 1 && t0_value !== (t0_value = /*info*/ ctx[0].detail + "")) set_data_dev(t0, t0_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let $Admin;
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(1, $Admin = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Event_elite', slots, []);
    	let { info } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (info === undefined && !('info' in $$props || $$self.$$.bound[$$self.$$.props['info']])) {
    			console.warn("<Event_elite> was created without expected prop 'info'");
    		}
    	});

    	const writable_props = ['info'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Event_elite> was created with unknown prop '${key}'`);
    	});

    	const click_handler = _ => {
    		$Admin.event.summonElite();
    		$Admin.event.finish();
    	};

    	$$self.$$set = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	$$self.$capture_state = () => ({ Admin, info, $Admin });

    	$$self.$inject_state = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [info, $Admin, click_handler];
    }

    class Event_elite extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, { info: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Event_elite",
    			options,
    			id: create_fragment$f.name
    		});
    	}

    	get info() {
    		throw new Error("<Event_elite>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set info(value) {
    		throw new Error("<Event_elite>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\addon\part\event_boss.svelte generated by Svelte v3.59.2 */
    const file$e = "src\\addon\\part\\event_boss.svelte";

    function create_fragment$e(ctx) {
    	let div;
    	let txt0;
    	let t0_value = /*info*/ ctx[0].detail + "";
    	let t0;
    	let t1;
    	let br0;
    	let t2;
    	let br1;
    	let t3;
    	let br2;
    	let t4;
    	let txt1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			txt0 = element("txt");
    			t0 = text(t0_value);
    			t1 = space();
    			br0 = element("br");
    			t2 = space();
    			br1 = element("br");
    			t3 = space();
    			br2 = element("br");
    			t4 = space();
    			txt1 = element("txt");
    			txt1.textContent = "遭遇BOSS";
    			attr_dev(txt0, "class", "svelte-1ogutcc");
    			add_location(txt0, file$e, 8, 2, 112);
    			add_location(br0, file$e, 9, 2, 140);
    			add_location(br1, file$e, 10, 2, 150);
    			add_location(br2, file$e, 11, 2, 160);
    			attr_dev(txt1, "class", "selection svelte-1ogutcc");
    			add_location(txt1, file$e, 12, 2, 170);
    			attr_dev(div, "class", "content svelte-1ogutcc");
    			add_location(div, file$e, 7, 0, 87);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, txt0);
    			append_dev(txt0, t0);
    			append_dev(div, t1);
    			append_dev(div, br0);
    			append_dev(div, t2);
    			append_dev(div, br1);
    			append_dev(div, t3);
    			append_dev(div, br2);
    			append_dev(div, t4);
    			append_dev(div, txt1);

    			if (!mounted) {
    				dispose = listen_dev(txt1, "click", /*click_handler*/ ctx[2], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*info*/ 1 && t0_value !== (t0_value = /*info*/ ctx[0].detail + "")) set_data_dev(t0, t0_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let $Admin;
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(1, $Admin = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Event_boss', slots, []);
    	let { info } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (info === undefined && !('info' in $$props || $$self.$$.bound[$$self.$$.props['info']])) {
    			console.warn("<Event_boss> was created without expected prop 'info'");
    		}
    	});

    	const writable_props = ['info'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Event_boss> was created with unknown prop '${key}'`);
    	});

    	const click_handler = _ => {
    		$Admin.event.summonBoss();
    		$Admin.event.finish();
    	};

    	$$self.$$set = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	$$self.$capture_state = () => ({ Admin, info, $Admin });

    	$$self.$inject_state = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [info, $Admin, click_handler];
    }

    class Event_boss extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { info: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Event_boss",
    			options,
    			id: create_fragment$e.name
    		});
    	}

    	get info() {
    		throw new Error("<Event_boss>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set info(value) {
    		throw new Error("<Event_boss>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\addon\part\event_xijian.svelte generated by Svelte v3.59.2 */
    const file$d = "src\\addon\\part\\event_xijian.svelte";

    function create_fragment$d(ctx) {
    	let div;
    	let txt0;
    	let t0_value = /*info*/ ctx[0].detail + "";
    	let t0;
    	let t1;
    	let br0;
    	let t2;
    	let br1;
    	let t3;
    	let br2;
    	let t4;
    	let txt1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			txt0 = element("txt");
    			t0 = text(t0_value);
    			t1 = space();
    			br0 = element("br");
    			t2 = space();
    			br1 = element("br");
    			t3 = space();
    			br2 = element("br");
    			t4 = space();
    			txt1 = element("txt");
    			txt1.textContent = "走也";
    			attr_dev(txt0, "class", "svelte-1ogutcc");
    			add_location(txt0, file$d, 7, 2, 110);
    			add_location(br0, file$d, 8, 2, 138);
    			add_location(br1, file$d, 9, 2, 148);
    			add_location(br2, file$d, 10, 2, 158);
    			attr_dev(txt1, "class", "selection svelte-1ogutcc");
    			add_location(txt1, file$d, 11, 2, 168);
    			attr_dev(div, "class", "content svelte-1ogutcc");
    			add_location(div, file$d, 6, 0, 85);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, txt0);
    			append_dev(txt0, t0);
    			append_dev(div, t1);
    			append_dev(div, br0);
    			append_dev(div, t2);
    			append_dev(div, br1);
    			append_dev(div, t3);
    			append_dev(div, br2);
    			append_dev(div, t4);
    			append_dev(div, txt1);

    			if (!mounted) {
    				dispose = listen_dev(txt1, "click", /*click_handler*/ ctx[2], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*info*/ 1 && t0_value !== (t0_value = /*info*/ ctx[0].detail + "")) set_data_dev(t0, t0_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let $Admin;
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(1, $Admin = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Event_xijian', slots, []);
    	let { info } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (info === undefined && !('info' in $$props || $$self.$$.bound[$$self.$$.props['info']])) {
    			console.warn("<Event_xijian> was created without expected prop 'info'");
    		}
    	});

    	const writable_props = ['info'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Event_xijian> was created with unknown prop '${key}'`);
    	});

    	const click_handler = _ => {
    		$Admin.event.nextStage();
    	};

    	$$self.$$set = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	$$self.$capture_state = () => ({ Admin, info, $Admin });

    	$$self.$inject_state = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [info, $Admin, click_handler];
    }

    class Event_xijian extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { info: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Event_xijian",
    			options,
    			id: create_fragment$d.name
    		});
    	}

    	get info() {
    		throw new Error("<Event_xijian>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set info(value) {
    		throw new Error("<Event_xijian>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\addon\part\event_turntable.svelte generated by Svelte v3.59.2 */
    const file$c = "src\\addon\\part\\event_turntable.svelte";

    function get_each_context$9(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[8] = i;
    	return child_ctx;
    }

    // (100:4) {#each rewards as r, i (i)}
    function create_each_block$9(key_1, ctx) {
    	let div;
    	let txt;
    	let t_value = /*r*/ ctx[6].name + "";
    	let t;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			txt = element("txt");
    			t = text(t_value);
    			attr_dev(txt, "style", "left:" + (150 + /*position*/ ctx[2][/*i*/ ctx[8]].x * 2.3 - 25) + "px;top:" + (150 + /*position*/ ctx[2][/*i*/ ctx[8]].y * 2.3 - 16) + "px;" + /*r*/ ctx[6].style);
    			attr_dev(txt, "class", "svelte-10cnpju");
    			add_location(txt, file$c, 101, 8, 2086);
    			attr_dev(div, "class", "reward svelte-10cnpju");
    			add_location(div, file$c, 100, 6, 2056);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, txt);
    			append_dev(txt, t);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$9.name,
    		type: "each",
    		source: "(100:4) {#each rewards as r, i (i)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let div3;
    	let txt0;
    	let t0_value = /*info*/ ctx[0].detail + "";
    	let t0;
    	let t1;
    	let div2;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t2;
    	let div1;
    	let div0;
    	let t3;
    	let txt1;
    	let t4_value = /*info*/ ctx[0].cache.cost + "";
    	let t4;
    	let mounted;
    	let dispose;
    	let each_value = /*rewards*/ ctx[3];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*i*/ ctx[8];
    	validate_each_keys(ctx, each_value, get_each_context$9, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$9(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$9(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			txt0 = element("txt");
    			t0 = text(t0_value);
    			t1 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			div1 = element("div");
    			div0 = element("div");
    			t3 = space();
    			txt1 = element("txt");
    			t4 = text(t4_value);
    			attr_dev(txt0, "class", "svelte-10cnpju");
    			add_location(txt0, file$c, 97, 2, 1964);
    			attr_dev(div0, "class", "cursor svelte-10cnpju");
    			set_style(div0, "transform", "rotate(" + /*rotate*/ ctx[1] + "deg)");
    			add_location(div0, file$c, 109, 6, 2321);
    			attr_dev(txt1, "class", "go svelte-10cnpju");
    			add_location(txt1, file$c, 110, 6, 2393);
    			attr_dev(div1, "class", "btn svelte-10cnpju");
    			add_location(div1, file$c, 108, 4, 2282);
    			attr_dev(div2, "class", "turntable svelte-10cnpju");
    			add_location(div2, file$c, 98, 2, 1992);
    			attr_dev(div3, "class", "content svelte-10cnpju");
    			add_location(div3, file$c, 96, 0, 1939);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, txt0);
    			append_dev(txt0, t0);
    			append_dev(div3, t1);
    			append_dev(div3, div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div2, null);
    				}
    			}

    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div1, t3);
    			append_dev(div1, txt1);
    			append_dev(txt1, t4);

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", /*go*/ ctx[4], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*info*/ 1 && t0_value !== (t0_value = /*info*/ ctx[0].detail + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*position, rewards*/ 12) {
    				each_value = /*rewards*/ ctx[3];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$9, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div2, destroy_block, create_each_block$9, t2, get_each_context$9);
    			}

    			if (dirty & /*rotate*/ 2) {
    				set_style(div0, "transform", "rotate(" + /*rotate*/ ctx[1] + "deg)");
    			}

    			if (dirty & /*info*/ 1 && t4_value !== (t4_value = /*info*/ ctx[0].cache.cost + "")) set_data_dev(t4, t4_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			dispose();
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

    function instance$c($$self, $$props, $$invalidate) {
    	let $Admin;
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(5, $Admin = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Event_turntable', slots, []);
    	let { info } = $$props;
    	if (!info.cache.cost) info.cache.cost = 100;
    	let rotate = 0;

    	const position = [
    		{ x: 50, y: 0 },
    		{ x: 35.4, y: -35.4 },
    		{ x: 0, y: -50 },
    		{ x: -35.4, y: -35.4 },
    		{ x: -50, y: 0 },
    		{ x: -35.4, y: 35.4 },
    		{ x: 0, y: 50 },
    		{ x: 35.4, y: 35.4 }
    	];

    	const rewards = [
    		{
    			name: "谢谢惠顾",
    			handle: _void,
    			style: "width: 120px;"
    		},
    		{
    			name: "谢谢惠顾",
    			handle: _void,
    			style: "transform: rotate(-45deg);width: 120px;"
    		},
    		{
    			name: "蓝色收藏品",
    			handle: _ => $Admin.event.getCollection("blue"),
    			style: "writing-mode: vertical-lr;"
    		},
    		{
    			name: "获得符卡",
    			handle: $Admin.event.getSpellcard,
    			style: "transform: rotate(45deg);width: 120px;"
    		},
    		{
    			name: "获得装备",
    			handle: $Admin.event.getEquipment,
    			style: "width: 120px;"
    		},
    		{
    			name: "蓝色收藏品",
    			handle: _ => $Admin.event.getCollection("blue"),
    			style: "transform: rotate(-45deg);width: 120px;"
    		},
    		{
    			name: "绿色收藏品",
    			handle: _ => $Admin.event.getCollection("green"),
    			style: "writing-mode: vertical-lr;"
    		},
    		{
    			name: "谢谢惠顾",
    			handle: _void,
    			style: "transform: rotate(45deg);width: 120px;"
    		}
    	];

    	function go() {
    		if ($Admin.data.coin >= info.cache.cost) {
    			set_store_value(Admin, $Admin.data.coin -= info.cache.cost, $Admin);
    			$$invalidate(0, info.cache.cost = retain(info.cache.cost * 1.4, 0), info);
    			$$invalidate(1, rotate += 720 + Math.floor(Math.random() * 8) * 45);
    			let index = 7 - (rotate - 180) % 360 / 45;
    			setTimeout(rewards[index].handle, 1600);
    		} else msg({ content: "硬币不足" });
    	}

    	$$self.$$.on_mount.push(function () {
    		if (info === undefined && !('info' in $$props || $$self.$$.bound[$$self.$$.props['info']])) {
    			console.warn("<Event_turntable> was created without expected prop 'info'");
    		}
    	});

    	const writable_props = ['info'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Event_turntable> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	$$self.$capture_state = () => ({
    		Admin,
    		info,
    		rotate,
    		position,
    		rewards,
    		go,
    		$Admin
    	});

    	$$self.$inject_state = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    		if ('rotate' in $$props) $$invalidate(1, rotate = $$props.rotate);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [info, rotate, position, rewards, go];
    }

    class Event_turntable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { info: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Event_turntable",
    			options,
    			id: create_fragment$c.name
    		});
    	}

    	get info() {
    		throw new Error("<Event_turntable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set info(value) {
    		throw new Error("<Event_turntable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const handle$1 = {
      bottle: Event_bottle,
      itemshop: Event_itemshop,
      bookshop: Event_bookshop,
      yakumo: Event_yakumo,
      canteen: Event_canteen,
      school: Event_school,
      chest: Event_chest,
      muxiazi: Event_muxiazi,
      zixuan: Event_zixuan,
      coin: Event_coin,
      delete_and_many: Event_delete_and_many,
      dragon: Event_dragon,
      donate_blood: Event_donate_blood,
      copy: Event_copy,
      big_chest: Event_big_chest,
      diaochuang: Event_diaochuang,
      change: Event_change,
      shoucangjia: Event_shoucangjia,
      zagu: Event_zagu,
      elite: Event_elite,
      boss: Event_boss,
      xijian: Event_xijian,
      turntable: Event_turntable
    };

    /* src\page\explore.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1$9 } = globals;
    const file$b = "src\\page\\explore.svelte";

    function get_each_context$8(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[31] = list[i];
    	child_ctx[32] = list;
    	child_ctx[33] = i;
    	return child_ctx;
    }

    function get_each_context_1$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[31] = list[i];
    	child_ctx[33] = i;
    	return child_ctx;
    }

    function get_each_context_2$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[35] = list[i];
    	child_ctx[33] = i;
    	return child_ctx;
    }

    function get_each_context_3$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[31] = list[i];
    	child_ctx[38] = i;
    	return child_ctx;
    }

    // (377:14) {#if !event[e.key].unbreakable}
    function create_if_block_2$4(ctx) {
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let mounted;
    	let dispose;

    	function click_handler_2(...args) {
    		return /*click_handler_2*/ ctx[14](/*i*/ ctx[33], ...args);
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "x";
    			t1 = space();
    			div1 = element("div");
    			attr_dev(div0, "class", "svelte-b1jre1");
    			add_location(div0, file$b, 378, 18, 11183);
    			attr_dev(div1, "class", "range svelte-b1jre1");
    			add_location(div1, file$b, 379, 18, 11215);
    			attr_dev(div2, "class", "event-close svelte-b1jre1");
    			add_location(div2, file$b, 377, 16, 11138);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", click_handler_2, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$4.name,
    		type: "if",
    		source: "(377:14) {#if !event[e.key].unbreakable}",
    		ctx
    	});

    	return block;
    }

    // (353:8) {#each $explore.eventList[i] as e, ii (ii)}
    function create_each_block_3$3(key_1, ctx) {
    	let div1;
    	let div0;
    	let txt0;
    	let t0_value = /*eventInfo*/ ctx[9](/*e*/ ctx[31].key).name + "";
    	let t0;
    	let t1;
    	let txt1;
    	let t2_value = /*eventInfo*/ ctx[9](/*e*/ ctx[31].key).detail + "";
    	let t2;
    	let t3;
    	let div0_style_value;
    	let div1_class_value;
    	let div1_style_value;
    	let div1_index_value;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[12](/*ii*/ ctx[38], /*i*/ ctx[33], /*e*/ ctx[31], ...args);
    	}

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[13](/*ii*/ ctx[38], /*i*/ ctx[33], /*e*/ ctx[31], ...args);
    	}

    	let if_block = !event[/*e*/ ctx[31].key].unbreakable && create_if_block_2$4(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			txt0 = element("txt");
    			t0 = text(t0_value);
    			t1 = space();
    			txt1 = element("txt");
    			t2 = text(t2_value);
    			t3 = space();
    			if (if_block) if_block.c();
    			attr_dev(txt0, "class", "title svelte-b1jre1");
    			add_location(txt0, file$b, 366, 14, 10694);
    			attr_dev(txt1, "class", "detail svelte-b1jre1");
    			add_location(txt1, file$b, 371, 14, 10890);
    			attr_dev(div0, "class", "event-body svelte-b1jre1");
    			attr_dev(div0, "style", div0_style_value = "--color:var(--" + event[/*e*/ ctx[31].key].type + ");" + /*e*/ ctx[31].style);
    			add_location(div0, file$b, 362, 12, 10557);
    			attr_dev(div1, "class", div1_class_value = "event " + (/*ii*/ ctx[38] == /*$explore*/ ctx[5].cursor[/*i*/ ctx[33]] && 'cursor') + " " + (/*ii*/ ctx[38] + /*$explore*/ ctx[5].offsetY[/*i*/ ctx[33]] > 0 && /*ii*/ ctx[38] + /*$explore*/ ctx[5].offsetY[/*i*/ ctx[33]] < 4 && 'show') + " svelte-b1jre1");
    			attr_dev(div1, "style", div1_style_value = "" + ((/*animate*/ ctx[0] && 'transition: 0.3s') + ";"));
    			attr_dev(div1, "index", div1_index_value = /*ii*/ ctx[38]);
    			add_location(div1, file$b, 353, 10, 10249);
    			this.first = div1;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, txt0);
    			append_dev(txt0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, txt1);
    			append_dev(txt1, t2);
    			append_dev(div0, t3);
    			if (if_block) if_block.m(div0, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(txt0, "click", click_handler, false, false, false, false),
    					listen_dev(txt1, "click", click_handler_1, false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*$explore*/ 32 && t0_value !== (t0_value = /*eventInfo*/ ctx[9](/*e*/ ctx[31].key).name + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*$explore*/ 32 && t2_value !== (t2_value = /*eventInfo*/ ctx[9](/*e*/ ctx[31].key).detail + "")) set_data_dev(t2, t2_value);

    			if (!event[/*e*/ ctx[31].key].unbreakable) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2$4(ctx);
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty[0] & /*$explore*/ 32 && div0_style_value !== (div0_style_value = "--color:var(--" + event[/*e*/ ctx[31].key].type + ");" + /*e*/ ctx[31].style)) {
    				attr_dev(div0, "style", div0_style_value);
    			}

    			if (dirty[0] & /*$explore*/ 32 && div1_class_value !== (div1_class_value = "event " + (/*ii*/ ctx[38] == /*$explore*/ ctx[5].cursor[/*i*/ ctx[33]] && 'cursor') + " " + (/*ii*/ ctx[38] + /*$explore*/ ctx[5].offsetY[/*i*/ ctx[33]] > 0 && /*ii*/ ctx[38] + /*$explore*/ ctx[5].offsetY[/*i*/ ctx[33]] < 4 && 'show') + " svelte-b1jre1")) {
    				attr_dev(div1, "class", div1_class_value);
    			}

    			if (dirty[0] & /*animate*/ 1 && div1_style_value !== (div1_style_value = "" + ((/*animate*/ ctx[0] && 'transition: 0.3s') + ";"))) {
    				attr_dev(div1, "style", div1_style_value);
    			}

    			if (dirty[0] & /*$explore*/ 32 && div1_index_value !== (div1_index_value = /*ii*/ ctx[38])) {
    				attr_dev(div1, "index", div1_index_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3$3.name,
    		type: "each",
    		source: "(353:8) {#each $explore.eventList[i] as e, ii (ii)}",
    		ctx
    	});

    	return block;
    }

    // (347:4) {#each ["l", "m", "r"] as o, i (i)}
    function create_each_block_2$4(key_1, ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t;
    	let div_style_value;
    	let each_value_3 = /*$explore*/ ctx[5].eventList[/*i*/ ctx[33]];
    	validate_each_argument(each_value_3);
    	const get_key = ctx => /*ii*/ ctx[38];
    	validate_each_keys(ctx, each_value_3, get_each_context_3$3, get_key);

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		let child_ctx = get_each_context_3$3(ctx, each_value_3, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_3$3(key, child_ctx));
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(div, "class", "list-" + /*o*/ ctx[35] + " svelte-b1jre1");
    			attr_dev(div, "style", div_style_value = "bottom:" + (/*$explore*/ ctx[5].offsetY[/*i*/ ctx[33]] - 1) * 210 + "px;" + (/*animate*/ ctx[0] && 'transition: 0.4s') + ";");
    			add_location(div, file$b, 347, 6, 10041);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}

    			append_dev(div, t);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*$explore, animate, closeEvent, eventHandle, eventInfo*/ 1697) {
    				each_value_3 = /*$explore*/ ctx[5].eventList[/*i*/ ctx[33]];
    				validate_each_argument(each_value_3);
    				validate_each_keys(ctx, each_value_3, get_each_context_3$3, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_3, each_1_lookup, div, destroy_block, create_each_block_3$3, t, get_each_context_3$3);
    			}

    			if (dirty[0] & /*$explore, animate*/ 33 && div_style_value !== (div_style_value = "bottom:" + (/*$explore*/ ctx[5].offsetY[/*i*/ ctx[33]] - 1) * 210 + "px;" + (/*animate*/ ctx[0] && 'transition: 0.4s') + ";")) {
    				attr_dev(div, "style", div_style_value);
    			}
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
    		id: create_each_block_2$4.name,
    		type: "each",
    		source: "(347:4) {#each [\\\"l\\\", \\\"m\\\", \\\"r\\\"] as o, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (396:8) {#if i < 11}
    function create_if_block_1$6(ctx) {
    	let txt;
    	let t0_value = (/*$explore*/ ctx[5].target[/*i*/ ctx[33]] ? "☑" : "☐") + "";
    	let t0;
    	let t1;
    	let t2_value = /*$explore*/ ctx[5].lv + "";
    	let t2;
    	let t3;
    	let t4_value = enermy$1[/*e*/ ctx[31]].name + "";
    	let t4;
    	let mounted;
    	let dispose;

    	function click_handler_3(...args) {
    		return /*click_handler_3*/ ctx[15](/*i*/ ctx[33], ...args);
    	}

    	const block = {
    		c: function create() {
    			txt = element("txt");
    			t0 = text(t0_value);
    			t1 = text(" lv.");
    			t2 = text(t2_value);
    			t3 = space();
    			t4 = text(t4_value);
    			attr_dev(txt, "class", "enermy svelte-b1jre1");
    			add_location(txt, file$b, 396, 10, 11684);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, txt, anchor);
    			append_dev(txt, t0);
    			append_dev(txt, t1);
    			append_dev(txt, t2);
    			append_dev(txt, t3);
    			append_dev(txt, t4);

    			if (!mounted) {
    				dispose = listen_dev(txt, "click", click_handler_3, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*$explore*/ 32 && t0_value !== (t0_value = (/*$explore*/ ctx[5].target[/*i*/ ctx[33]] ? "☑" : "☐") + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*$explore*/ 32 && t2_value !== (t2_value = /*$explore*/ ctx[5].lv + "")) set_data_dev(t2, t2_value);
    			if (dirty[0] & /*$explore*/ 32 && t4_value !== (t4_value = enermy$1[/*e*/ ctx[31]].name + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(txt);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$6.name,
    		type: "if",
    		source: "(396:8) {#if i < 11}",
    		ctx
    	});

    	return block;
    }

    // (395:6) {#each $explore.enermy as e, i (i)}
    function create_each_block_1$6(key_1, ctx) {
    	let first;
    	let if_block_anchor;
    	let if_block = /*i*/ ctx[33] < 11 && create_if_block_1$6(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*i*/ ctx[33] < 11) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$6(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$6.name,
    		type: "each",
    		source: "(395:6) {#each $explore.enermy as e, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (414:8) {#each Object.keys($explore.enermy.count()).reverse() as e, i (i)}
    function create_each_block$8(key_1, ctx) {
    	let img;
    	let img_src_value;
    	let e = /*e*/ ctx[31];
    	const assign_img = () => /*img_binding_1*/ ctx[17](img, e);
    	const unassign_img = () => /*img_binding_1*/ ctx[17](null, e);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "class", "scene_enermy svelte-b1jre1");
    			if (!src_url_equal(img.src, img_src_value = "/img/enermy/" + data.enermy[/*e*/ ctx[31]].type + "/" + /*e*/ ctx[31] + "/portrait.webp")) attr_dev(img, "src", img_src_value);
    			set_style(img, "top", 240 - 340 * window.r() + "px");
    			add_location(img, file$b, 414, 10, 12264);
    			this.first = img;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    			assign_img();
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*$explore*/ 32 && !src_url_equal(img.src, img_src_value = "/img/enermy/" + data.enermy[/*e*/ ctx[31]].type + "/" + /*e*/ ctx[31] + "/portrait.webp")) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (e !== /*e*/ ctx[31]) {
    				unassign_img();
    				e = /*e*/ ctx[31];
    				assign_img();
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			unassign_img();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$8.name,
    		type: "each",
    		source: "(414:8) {#each Object.keys($explore.enermy.count()).reverse() as e, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (432:4) {#if typeof event_id == "number" && $explore.event[event_id]}
    function create_if_block$8(ctx) {
    	let div;
    	let t0_value = event[/*$explore*/ ctx[5].event[/*event_id*/ ctx[2]].key].name + "";
    	let t0;
    	let t1;
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	var switch_value = handle$1[/*$explore*/ ctx[5].event[/*event_id*/ ctx[2]].key];

    	function switch_props(ctx) {
    		return {
    			props: {
    				info: /*$explore*/ ctx[5].event[/*event_id*/ ctx[2]]
    			},
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = construct_svelte_component_dev(switch_value, switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    			attr_dev(div, "class", "title svelte-b1jre1");
    			add_location(div, file$b, 432, 6, 12846);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			insert_dev(target, t1, anchor);
    			if (switch_instance) mount_component(switch_instance, target, anchor);
    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty[0] & /*$explore, event_id*/ 36) && t0_value !== (t0_value = event[/*$explore*/ ctx[5].event[/*event_id*/ ctx[2]].key].name + "")) set_data_dev(t0, t0_value);
    			const switch_instance_changes = {};
    			if (dirty[0] & /*$explore, event_id*/ 36) switch_instance_changes.info = /*$explore*/ ctx[5].event[/*event_id*/ ctx[2]];

    			if (dirty[0] & /*$explore, event_id*/ 36 && switch_value !== (switch_value = handle$1[/*$explore*/ ctx[5].event[/*event_id*/ ctx[2]].key])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = construct_svelte_component_dev(switch_value, switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
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
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(432:4) {#if typeof event_id == \\\"number\\\" && $explore.event[event_id]}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div10;
    	let div0;
    	let each_blocks_2 = [];
    	let each0_lookup = new Map();
    	let t0;
    	let div6;
    	let div2;
    	let div1;
    	let txt0;
    	let t1;
    	let t2_value = /*$explore*/ ctx[5].enermy.length + "";
    	let t2;
    	let t3;
    	let t4;
    	let txt1;
    	let t6;
    	let each_blocks_1 = [];
    	let each1_lookup = new Map();
    	let t7;
    	let div5;
    	let div3;
    	let t8;
    	let div4;
    	let img;
    	let img_src_value;
    	let t9;
    	let each_blocks = [];
    	let each2_lookup = new Map();
    	let t10;
    	let div7;
    	let t11;
    	let div9;
    	let div8;
    	let t13;
    	let div10_intro;
    	let div10_outro;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_2 = ["l", "m", "r"];
    	validate_each_argument(each_value_2);
    	const get_key = ctx => /*i*/ ctx[33];
    	validate_each_keys(ctx, each_value_2, get_each_context_2$4, get_key);

    	for (let i = 0; i < 3; i += 1) {
    		let child_ctx = get_each_context_2$4(ctx, each_value_2, i);
    		let key = get_key(child_ctx);
    		each0_lookup.set(key, each_blocks_2[i] = create_each_block_2$4(key, child_ctx));
    	}

    	let each_value_1 = /*$explore*/ ctx[5].enermy;
    	validate_each_argument(each_value_1);
    	const get_key_1 = ctx => /*i*/ ctx[33];
    	validate_each_keys(ctx, each_value_1, get_each_context_1$6, get_key_1);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1$6(ctx, each_value_1, i);
    		let key = get_key_1(child_ctx);
    		each1_lookup.set(key, each_blocks_1[i] = create_each_block_1$6(key, child_ctx));
    	}

    	let each_value = Object.keys(/*$explore*/ ctx[5].enermy.count()).reverse();
    	validate_each_argument(each_value);
    	const get_key_2 = ctx => /*i*/ ctx[33];
    	validate_each_keys(ctx, each_value, get_each_context$8, get_key_2);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$8(ctx, each_value, i);
    		let key = get_key_2(child_ctx);
    		each2_lookup.set(key, each_blocks[i] = create_each_block$8(key, child_ctx));
    	}

    	let if_block = typeof /*event_id*/ ctx[2] == "number" && /*$explore*/ ctx[5].event[/*event_id*/ ctx[2]] && create_if_block$8(ctx);

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < 3; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t0 = space();
    			div6 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			txt0 = element("txt");
    			t1 = text("遇敌(");
    			t2 = text(t2_value);
    			t3 = text(")");
    			t4 = space();
    			txt1 = element("txt");
    			txt1.textContent = "开战！";
    			t6 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t7 = space();
    			div5 = element("div");
    			div3 = element("div");
    			t8 = space();
    			div4 = element("div");
    			img = element("img");
    			t9 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t10 = space();
    			div7 = element("div");
    			t11 = space();
    			div9 = element("div");
    			div8 = element("div");
    			div8.textContent = "×";
    			t13 = space();
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "event-list svelte-b1jre1");
    			add_location(div0, file$b, 345, 2, 9968);
    			add_location(txt0, file$b, 391, 8, 11497);
    			attr_dev(txt1, "class", "battle svelte-b1jre1");
    			add_location(txt1, file$b, 392, 8, 11546);
    			attr_dev(div1, "class", "title svelte-b1jre1");
    			add_location(div1, file$b, 390, 6, 11468);
    			attr_dev(div2, "class", "notebook svelte-b1jre1");
    			add_location(div2, file$b, 389, 4, 11438);
    			attr_dev(div3, "class", "speaker svelte-b1jre1");
    			add_location(div3, file$b, 406, 6, 11977);
    			attr_dev(img, "class", "scene_bg svelte-b1jre1");
    			if (!src_url_equal(img.src, img_src_value = "/img/scene/" + /*$Admin*/ ctx[6].data.scene + ".webp")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$b, 408, 8, 12042);
    			attr_dev(div4, "class", "screen svelte-b1jre1");
    			add_location(div4, file$b, 407, 6, 12012);
    			attr_dev(div5, "class", "nexus svelte-b1jre1");
    			add_location(div5, file$b, 405, 4, 11950);
    			attr_dev(div6, "class", "right svelte-b1jre1");
    			add_location(div6, file$b, 388, 2, 11413);
    			attr_dev(div7, "class", "paper_close svelte-b1jre1");
    			set_style(div7, "z-index", typeof /*event_id*/ ctx[2] == 'number' ? 1 : -1);
    			add_location(div7, file$b, 424, 2, 12546);
    			attr_dev(div8, "class", "event_fold svelte-b1jre1");
    			add_location(div8, file$b, 430, 4, 12719);
    			attr_dev(div9, "class", "paper svelte-b1jre1");
    			add_location(div9, file$b, 429, 2, 12676);
    			attr_dev(div10, "class", "body svelte-b1jre1");
    			set_style(div10, "--bg", "url(/img/scene/r" + [...Array(9).keys()].rd()[0] + ".jpg)");
    			add_location(div10, file$b, 339, 0, 9810);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div0);

    			for (let i = 0; i < 3; i += 1) {
    				if (each_blocks_2[i]) {
    					each_blocks_2[i].m(div0, null);
    				}
    			}

    			append_dev(div10, t0);
    			append_dev(div10, div6);
    			append_dev(div6, div2);
    			append_dev(div2, div1);
    			append_dev(div1, txt0);
    			append_dev(txt0, t1);
    			append_dev(txt0, t2);
    			append_dev(txt0, t3);
    			append_dev(div1, t4);
    			append_dev(div1, txt1);
    			append_dev(div2, t6);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(div2, null);
    				}
    			}

    			append_dev(div6, t7);
    			append_dev(div6, div5);
    			append_dev(div5, div3);
    			append_dev(div5, t8);
    			append_dev(div5, div4);
    			append_dev(div4, img);
    			/*img_binding*/ ctx[16](img);
    			append_dev(div4, t9);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div4, null);
    				}
    			}

    			append_dev(div10, t10);
    			append_dev(div10, div7);
    			append_dev(div10, t11);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div9, t13);
    			if (if_block) if_block.m(div9, null);
    			/*div9_binding*/ ctx[18](div9);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(txt1, "click", /*battle*/ ctx[11], false, false, false, false),
    					listen_dev(div7, "click", /*foldEvent*/ ctx[8], false, false, false, false),
    					listen_dev(div8, "click", /*foldEvent*/ ctx[8], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$explore, animate, closeEvent, eventHandle, eventInfo*/ 1697) {
    				each_value_2 = ["l", "m", "r"];
    				validate_each_argument(each_value_2);
    				validate_each_keys(ctx, each_value_2, get_each_context_2$4, get_key);
    				each_blocks_2 = update_keyed_each(each_blocks_2, dirty, get_key, 1, ctx, each_value_2, each0_lookup, div0, destroy_block, create_each_block_2$4, null, get_each_context_2$4);
    			}

    			if ((!current || dirty[0] & /*$explore*/ 32) && t2_value !== (t2_value = /*$explore*/ ctx[5].enermy.length + "")) set_data_dev(t2, t2_value);

    			if (dirty[0] & /*$explore*/ 32) {
    				each_value_1 = /*$explore*/ ctx[5].enermy;
    				validate_each_argument(each_value_1);
    				validate_each_keys(ctx, each_value_1, get_each_context_1$6, get_key_1);
    				each_blocks_1 = update_keyed_each(each_blocks_1, dirty, get_key_1, 1, ctx, each_value_1, each1_lookup, div2, destroy_block, create_each_block_1$6, null, get_each_context_1$6);
    			}

    			if (!current || dirty[0] & /*$Admin*/ 64 && !src_url_equal(img.src, img_src_value = "/img/scene/" + /*$Admin*/ ctx[6].data.scene + ".webp")) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty[0] & /*$explore, element_scene_enermy*/ 48) {
    				each_value = Object.keys(/*$explore*/ ctx[5].enermy.count()).reverse();
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$8, get_key_2);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key_2, 1, ctx, each_value, each2_lookup, div4, destroy_block, create_each_block$8, null, get_each_context$8);
    			}

    			if (!current || dirty[0] & /*event_id*/ 4) {
    				set_style(div7, "z-index", typeof /*event_id*/ ctx[2] == 'number' ? 1 : -1);
    			}

    			if (typeof /*event_id*/ ctx[2] == "number" && /*$explore*/ ctx[5].event[/*event_id*/ ctx[2]]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*event_id, $explore*/ 36) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$8(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div9, null);
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
    				if (div10_outro) div10_outro.end(1);
    				div10_intro = create_in_transition(div10, fade, { duration: 250 });
    				div10_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			if (div10_intro) div10_intro.invalidate();
    			div10_outro = create_out_transition(div10, fade, { duration: 250 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);

    			for (let i = 0; i < 3; i += 1) {
    				each_blocks_2[i].d();
    			}

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].d();
    			}

    			/*img_binding*/ ctx[16](null);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (if_block) if_block.d();
    			/*div9_binding*/ ctx[18](null);
    			if (detaching && div10_outro) div10_outro.end();
    			mounted = false;
    			run_all(dispose);
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

    function random() {
    	const r = Math.random;
    	let rotate = 12 * r() - 6;
    	rotate = (Math.abs(rotate) + 3) * (rotate / Math.abs(rotate));
    	let x = 20 * r() - 10;
    	let y = 20 * r() - 10;
    	return `transform:rotate(${rotate}deg)translate(${x}px,${y}px);`;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let $explore;
    	let $page;
    	let $Admin;
    	let $data;
    	let $Explain;
    	validate_store(explore, 'explore');
    	component_subscribe($$self, explore, $$value => $$invalidate(5, $explore = $$value));
    	validate_store(page, 'page');
    	component_subscribe($$self, page, $$value => $$invalidate(19, $page = $$value));
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(6, $Admin = $$value));
    	validate_store(data$1, 'data');
    	component_subscribe($$self, data$1, $$value => $$invalidate(20, $data = $$value));
    	validate_store(Explain, 'Explain');
    	component_subscribe($$self, Explain, $$value => $$invalidate(21, $Explain = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Explore', slots, []);
    	set_store_value(Admin, $Admin.data = $data, $Admin);
    	if (!$explore.eventSummoned) install();
    	let animate = true;
    	let paper;
    	let event_id;
    	let element_scene;
    	const element_scene_enermy = {};
    	set_store_value(Admin, $Admin.event.summonZagu = summonZagu, $Admin);
    	set_store_value(Admin, $Admin.event.summonElite = summonElite, $Admin);
    	set_store_value(Admin, $Admin.event.summonBoss = summonBoss, $Admin);
    	set_store_value(Admin, $Admin.event.finish = eventFinish, $Admin);
    	set_store_value(Admin, $Admin.event.stageClear = _ => insertEvent("xijian"), $Admin);
    	set_store_value(Admin, $Admin.event.nextStage = nextStage, $Admin);
    	set_store_value(Admin, $Admin.discount = discount, $Admin);

    	onMount(function () {
    		$$invalidate(1, paper.style.top = `${document.body.clientHeight}px`, paper);
    		$$invalidate(1, paper.style.transition = "0.3s", paper);

    		if (!$explore.eventSummoned) {
    			$Admin.event.heal(100, true);
    			set_store_value(explore, $explore.eventSummoned = true, $explore);
    		}
    	});

    	beforeUpdate(function () {
    		if (typeof $Explain == "function") {
    			$Explain(element_scene).with(data.scene[$Admin.data.scene]);

    			for (let e in element_scene_enermy) $Explain(element_scene_enermy[e]).color(data.enermy[e].color).with({
    				name: data.enermy[e].name,
    				detail: data.enermy[e].intro
    			});
    		}
    	});

    	function install() {
    		set_store_value(explore, $explore.enermy = [], $explore);
    		set_store_value(explore, $explore.offsetY = [0, 0, 0], $explore);
    		set_store_value(explore, $explore.cursor = [1, 1, 1], $explore);
    		set_store_value(explore, $explore.dragon = 0, $explore);
    		set_store_value(explore, $explore.target = [...Array(11).keys()].map(_ => false), $explore);

    		set_store_value(
    			explore,
    			$explore.event = summonEvent().map((k, i) => {
    				return {
    					key: k,
    					cache: {},
    					id: i,
    					style: random(),
    					detail: event[k].detail,
    					type: event[k].type
    				};
    			}),
    			$explore
    		);

    		set_store_value(explore, $explore.eventLeft = deepCopy($explore.event), $explore);
    		set_store_value(explore, $explore.eventList = [0, 1, 2].map(_ => $explore.eventLeft.splice(0, 5)), $explore);
    	}

    	function discount(product) {
    		let base = 1;

    		if ("carnyx" in $Admin.data.collection) {
    			let amount = $Admin.data.collection["carnyx"];
    			base *= Math.pow(0.95, amount);
    		}

    		if ($Admin.data.role == "marisa") {
    			base *= 0.9;
    		}

    		product.forEach(p => p.piece = retain(base * p.piece, 0));
    		return product;
    	}

    	function summonEvent() {
    		const eventForm = [
    			{
    				random: {
    					reward: 3,
    					selection: 5,
    					special: 3,
    					shop: 2
    				},
    				static: {
    					zagu: 6,
    					elite: 3,
    					itemshop: 1,
    					school: 1,
    					canteen: 1,
    					chest: 5,
    					muxiazi: 4,
    					bookshop: 1,
    					dragon: 1,
    					zixuan: 1,
    					diaochuang: 1,
    					big_chest: 1,
    					turntable: 1
    				}
    			},
    			{
    				random: {
    					reward: 5,
    					selection: 4,
    					special: 3,
    					shop: 2
    				},
    				static: {
    					zagu: 6,
    					elite: 4,
    					itemshop: 1,
    					school: 1,
    					canteen: 1,
    					chest: 4,
    					muxiazi: 3,
    					bookshop: 1,
    					dragon: 1,
    					zixuan: 1,
    					diaochuang: 1,
    					yakumo: 1,
    					turntable: 1
    				}
    			},
    			{
    				random: {
    					reward: 4,
    					selection: 4,
    					special: 4,
    					shop: 2
    				},
    				static: {
    					zagu: 4,
    					elite: 4,
    					itemshop: 1,
    					school: 1,
    					canteen: 1,
    					chest: 3,
    					muxiazi: 3,
    					bookshop: 1,
    					dragon: 1,
    					zixuan: 1,
    					diaochuang: 1,
    					turntable: 1
    				}
    			}
    		];

    		let res = [];
    		let stage = $Admin.data.stage - 1;

    		let _event = Object.keys(event).map(key => {
    			return { key, type: event[key].type };
    		});

    		for (let type in eventForm[stage].random) {
    			let l = _event.filter(e => e.type == type).rd();
    			l.splice(0, eventForm[stage].random[type]).map(i => res.push(i.key));
    		}

    		for (let key in eventForm[stage].static) {
    			[...Array(eventForm[stage].static[key]).keys()].forEach(_ => res.push(key));
    		}

    		res.rd();
    		res.splice(1, 0, "zixuan");
    		return res;
    	}

    	function eventHandle(id) {
    		if ($explore.event[id].cache.finish) msg({ content: "事件已完成" }); else {
    			if ($Admin.mobile) $$invalidate(1, paper.style.top = `60px`, paper); else $$invalidate(1, paper.style.top = `${document.body.clientHeight - 640}px`, paper);
    			$$invalidate(2, event_id = id);
    		}
    	}

    	function foldEvent() {
    		$$invalidate(1, paper.style.top = `${document.body.clientHeight}px`, paper);
    		$$invalidate(2, event_id = false);
    	}

    	function eventFinish() {
    		set_store_value(explore, $explore.event[event_id].cache.finish = true, $explore);
    		let _index;

    		$explore.eventList.forEach((l, i) => {
    			l.forEach(e => {
    				if (e.id == event_id) _index = i;
    			});
    		});

    		if ($explore.event[event_id] && $explore.event[event_id].type == "enermy") closeEvent(_index);
    		foldEvent();
    	}

    	function eventInfo(key) {
    		let info = deepCopy(event[key]);

    		if (info.type == "selection") {
    			info.name = "未知事件";
    			info.detail = "什么都没有，但又隐隐约约感觉到有什么要发生。";
    		}

    		return info;
    	}

    	function closeEvent(index) {
    		set_store_value(explore, $explore.event[$explore.eventList[index][$explore.cursor[index]].id].closed = true, $explore);
    		let leftEventCount = $explore.event.length - $explore.event.filter(e => e.closed).length;

    		if (leftEventCount == 9 && !$explore.event.map(e => e.key).includes("boss")) {
    			insertEvent("boss");
    		}

    		$explore.enermy.length > 0 && set_store_value(explore, $explore.lv++, $explore);
    		let other = [0, 1, 2].filter(i => i != index);
    		set_store_value(explore, $explore.offsetY[index] -= 1, $explore);

    		other.forEach(i => {
    			if ($explore.eventLeft.length == 0 && $explore.cursor[i] == 1) ; else if ($explore.cursor[i] == 1) set_store_value(explore, $explore.offsetY[i] += 1, $explore);
    		});

    		setTimeout(
    			_ => {
    				$$invalidate(0, animate = false);

    				if ($explore.eventLeft.length > 0) {
    					$explore.eventList[index].push($explore.eventLeft.rd().shift());
    				} else {
    					if ($explore.cursor[other[1]] != 0) {
    						$explore.eventList[index].push($explore.eventList[other[1]].shift());
    						set_store_value(explore, $explore.cursor[other[1]] = 0, $explore);
    						set_store_value(explore, $explore.offsetY[other[1]] += 1, $explore);
    					}

    					if ($explore.cursor[other[0]] != 0) {
    						$explore.eventList[index].push($explore.eventList[other[0]].shift());
    						set_store_value(explore, $explore.cursor[other[0]] = 0, $explore);
    						set_store_value(explore, $explore.offsetY[other[0]] += 1, $explore);
    					}
    				}

    				$explore.eventList[index].splice($explore.cursor[index], 1);
    				explore.set($explore);

    				other.forEach(i => {
    					if ($explore.eventLeft.length > 0) {
    						set_store_value(explore, $explore.eventList[i] = [$explore.eventLeft.rd().shift(), ...$explore.eventList[i]], $explore);
    						set_store_value(explore, $explore.offsetY[i] -= 1, $explore);
    					} else {
    						set_store_value(explore, $explore.cursor[i] = 0, $explore);
    					}
    				});

    				set_store_value(explore, $explore.offsetY[index] += 1, $explore);

    				setTimeout(
    					_ => {
    						$$invalidate(0, animate = true);
    					},
    					100
    				);
    			},
    			400
    		);
    	}

    	function battle() {
    		let amount = $explore.enermy.filter((_, i) => $explore.target[i]).length;

    		if (amount < 1) {
    			msg({ content: "至少选中一个敌人" });
    		} else if (amount > $explore.enermyLimit) {
    			msg({
    				content: `最多只能选中${$explore.enermyLimit}个敌人`
    			});
    		} else {
    			set_store_value(page, $page = "Battle", $page);
    		}
    	}

    	function summonZagu() {
    		let res = [];
    		[...Array(growth$1.amount($explore.lv)).keys()].forEach(_ => res.push(Object.keys(enermy$1).filter(e => enermy$1[e].type == "normal" && enermy$1[e].scene.includes($Admin.data.scene)).rd()[0]));
    		set_store_value(explore, $explore.enermy = [...$explore.enermy, ...res], $explore);
    	}

    	function summonElite() {
    		let res = [];
    		[...Array($explore.dragon + 1).keys()].forEach(_ => res.push(Object.keys(enermy$1).filter(e => enermy$1[e].type == "elite" && enermy$1[e].scene.includes($Admin.data.scene)).rd()[0]));
    		set_store_value(explore, $explore.enermy = [...$explore.enermy, ...res], $explore);
    	}

    	function summonBoss() {
    		let res = [];
    		[...Array($explore.dragon + 1).keys()].forEach(_ => res.push($explore.boss[$data.stage - 1]));
    		set_store_value(explore, $explore.enermy = [...$explore.enermy, ...res], $explore);
    	}

    	function nextStage() {
    		let scene = ["shrine", "forest", "town"];
    		foldEvent();

    		if ($Admin.data.stage < 3) {
    			set_store_value(Admin, $Admin.data.scene = scene[$Admin.data.stage], $Admin);
    			set_store_value(Admin, $Admin.data.stage++, $Admin);
    			install();

    			msg({
    				content: `到达${data.scene[$Admin.data.scene].name}`
    			});
    		} else {
    			set_store_value(page, $page = "Epilog", $page);
    		}
    	}

    	function insertEvent(key) {
    		let gate = {
    			key,
    			cache: {},
    			id: $explore.event.length,
    			style: random(),
    			detail: event[key].detail,
    			type: event[key].type
    		};

    		let max = Math.max(...$explore.eventList.map(l => l.length));
    		let index = $explore.eventList.map((_, i) => i).filter(i => $explore.eventList[i].length == max)[0];
    		$explore.eventList[index].push(gate);
    		$explore.event.push(gate);
    	}

    	const writable_props = [];

    	Object_1$9.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Explore> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (ii, i, e, _) => ii == $explore.cursor[i] && eventHandle(e.id);
    	const click_handler_1 = (ii, i, e, _) => ii == $explore.cursor[i] && eventHandle(e.id);
    	const click_handler_2 = (i, _) => closeEvent(i);
    	const click_handler_3 = (i, _) => set_store_value(explore, $explore.target[i] = !$explore.target[i], $explore);

    	function img_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_scene = $$value;
    			$$invalidate(3, element_scene);
    		});
    	}

    	function img_binding_1($$value, e) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_scene_enermy[e] = $$value;
    			$$invalidate(4, element_scene_enermy);
    		});
    	}

    	function div9_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			paper = $$value;
    			$$invalidate(1, paper);
    		});
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		beforeUpdate,
    		fade,
    		scale,
    		data: data$1,
    		page,
    		explore,
    		Admin,
    		Explain,
    		event,
    		eventContent: handle$1,
    		enermy: enermy$1,
    		growth: growth$1,
    		Data: data,
    		animate,
    		paper,
    		event_id,
    		element_scene,
    		element_scene_enermy,
    		install,
    		discount,
    		summonEvent,
    		random,
    		eventHandle,
    		foldEvent,
    		eventFinish,
    		eventInfo,
    		closeEvent,
    		battle,
    		summonZagu,
    		summonElite,
    		summonBoss,
    		nextStage,
    		insertEvent,
    		$explore,
    		$page,
    		$Admin,
    		$data,
    		$Explain
    	});

    	$$self.$inject_state = $$props => {
    		if ('animate' in $$props) $$invalidate(0, animate = $$props.animate);
    		if ('paper' in $$props) $$invalidate(1, paper = $$props.paper);
    		if ('event_id' in $$props) $$invalidate(2, event_id = $$props.event_id);
    		if ('element_scene' in $$props) $$invalidate(3, element_scene = $$props.element_scene);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		animate,
    		paper,
    		event_id,
    		element_scene,
    		element_scene_enermy,
    		$explore,
    		$Admin,
    		eventHandle,
    		foldEvent,
    		eventInfo,
    		closeEvent,
    		battle,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		img_binding,
    		img_binding_1,
    		div9_binding
    	];
    }

    class Explore extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Explore",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src\page\battleHandcard.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1$8 } = globals;
    const file$a = "src\\page\\battleHandcard.svelte";

    function get_each_context$7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[39] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[39] = list[i];
    	child_ctx[43] = i;
    	return child_ctx;
    }

    // (397:2) {#each hold as ii, i (i)}
    function create_each_block_1$5(key_1, ctx) {
    	let first;
    	let card;
    	let current;

    	function func(...args) {
    		return /*func*/ ctx[16](/*i*/ ctx[43], /*ii*/ ctx[39], ...args);
    	}

    	card = new Card({
    			props: {
    				key: /*handcards*/ ctx[11][/*ii*/ ctx[39]],
    				action: /*dragCancel*/ ctx[12],
    				select: func,
    				cost: /*cost*/ ctx[9][/*ii*/ ctx[39]],
    				transform: /*transformArray*/ ctx[8][/*i*/ ctx[43]],
    				animate: /*animate*/ ctx[4],
    				interim: /*interim*/ ctx[6][/*ii*/ ctx[39]],
    				abandoned: /*abandoned*/ ctx[7][/*ii*/ ctx[39]]
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(card.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const card_changes = {};
    			if (dirty[0] & /*hold*/ 2) card_changes.key = /*handcards*/ ctx[11][/*ii*/ ctx[39]];
    			if (dirty[0] & /*hold*/ 2) card_changes.select = func;
    			if (dirty[0] & /*cost, hold*/ 514) card_changes.cost = /*cost*/ ctx[9][/*ii*/ ctx[39]];
    			if (dirty[0] & /*transformArray, hold*/ 258) card_changes.transform = /*transformArray*/ ctx[8][/*i*/ ctx[43]];
    			if (dirty[0] & /*animate*/ 16) card_changes.animate = /*animate*/ ctx[4];
    			if (dirty[0] & /*interim, hold*/ 66) card_changes.interim = /*interim*/ ctx[6][/*ii*/ ctx[39]];
    			if (dirty[0] & /*abandoned, hold*/ 130) card_changes.abandoned = /*abandoned*/ ctx[7][/*ii*/ ctx[39]];
    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$5.name,
    		type: "each",
    		source: "(397:2) {#each hold as ii, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (424:8) {#if left.length == 0}
    function create_if_block$7(ctx) {
    	let txt;

    	const block = {
    		c: function create() {
    			txt = element("txt");
    			txt.textContent = "空空如也";
    			attr_dev(txt, "class", "svelte-n98s3t");
    			add_location(txt, file$a, 424, 10, 12667);
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
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(424:8) {#if left.length == 0}",
    		ctx
    	});

    	return block;
    }

    // (428:10) {#each left as ii (ii)}
    function create_each_block$7(key_1, ctx) {
    	let first;
    	let card;
    	let current;

    	card = new Card({
    			props: {
    				key: /*handcards*/ ctx[11][/*ii*/ ctx[39]]
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(card.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const card_changes = {};
    			if (dirty[0] & /*left*/ 1) card_changes.key = /*handcards*/ ctx[11][/*ii*/ ctx[39]];
    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$7.name,
    		type: "each",
    		source: "(428:10) {#each left as ii (ii)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div6;
    	let each_blocks_1 = [];
    	let each0_lookup = new Map();
    	let t0;
    	let div0;
    	let t1;
    	let div1;
    	let t2;
    	let div5;
    	let icon;
    	let t3;
    	let txt;
    	let t4_value = /*left*/ ctx[0].length + "";
    	let t4;
    	let t5;
    	let div4;
    	let div3;
    	let t6;
    	let div2;
    	let each_blocks = [];
    	let each1_lookup = new Map();
    	let div5_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*hold*/ ctx[1];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*i*/ ctx[43];
    	validate_each_keys(ctx, each_value_1, get_each_context_1$5, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1$5(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each0_lookup.set(key, each_blocks_1[i] = create_each_block_1$5(key, child_ctx));
    	}

    	let if_block = /*left*/ ctx[0].length == 0 && create_if_block$7(ctx);
    	let each_value = /*left*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key_1 = ctx => /*ii*/ ctx[39];
    	validate_each_keys(ctx, each_value, get_each_context$7, get_key_1);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$7(ctx, each_value, i);
    		let key = get_key_1(child_ctx);
    		each1_lookup.set(key, each_blocks[i] = create_each_block$7(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div6 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t0 = space();
    			div0 = element("div");
    			t1 = space();
    			div1 = element("div");
    			t2 = space();
    			div5 = element("div");
    			icon = element("icon");
    			t3 = space();
    			txt = element("txt");
    			t4 = text(t4_value);
    			t5 = space();
    			div4 = element("div");
    			div3 = element("div");
    			if (if_block) if_block.c();
    			t6 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "barrier svelte-n98s3t");
    			set_style(div0, "display", /*barrier*/ ctx[5] ? 'block' : 'none');
    			add_location(div0, file$a, 408, 2, 12140);
    			attr_dev(div1, "class", "left-card-close svelte-n98s3t");
    			set_style(div1, "display", /*left_card_show*/ ctx[2] ? 'block' : 'none');
    			add_location(div1, file$a, 409, 2, 12216);
    			attr_dev(icon, "class", "icon-left_card svelte-n98s3t");
    			add_location(icon, file$a, 419, 4, 12525);
    			attr_dev(txt, "class", "svelte-n98s3t");
    			add_location(txt, file$a, 420, 4, 12562);
    			attr_dev(div2, "class", "svelte-n98s3t");
    			add_location(div2, file$a, 426, 8, 12707);
    			attr_dev(div3, "class", "list svelte-n98s3t");
    			add_location(div3, file$a, 422, 6, 12605);
    			attr_dev(div4, "class", "svelte-n98s3t");
    			add_location(div4, file$a, 421, 4, 12592);
    			attr_dev(div5, "class", div5_class_value = "left-card " + (/*leftChange*/ ctx[10] && 'animate_leftChange') + " " + (/*left_card_show*/ ctx[2] && 'show') + " svelte-n98s3t");
    			add_location(div5, file$a, 414, 2, 12369);
    			attr_dev(div6, "class", "handcards svelte-n98s3t");
    			add_location(div6, file$a, 395, 0, 11813);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(div6, null);
    				}
    			}

    			append_dev(div6, t0);
    			append_dev(div6, div0);
    			append_dev(div6, t1);
    			append_dev(div6, div1);
    			append_dev(div6, t2);
    			append_dev(div6, div5);
    			append_dev(div5, icon);
    			append_dev(div5, t3);
    			append_dev(div5, txt);
    			append_dev(txt, t4);
    			append_dev(div5, t5);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			if (if_block) if_block.m(div3, null);
    			append_dev(div3, t6);
    			append_dev(div3, div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div2, null);
    				}
    			}

    			/*div2_binding*/ ctx[18](div2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div1, "click", /*click_handler*/ ctx[17], false, false, false, false),
    					listen_dev(div5, "click", /*click_handler_1*/ ctx[19], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*handcards, hold, dragCancel, select, cost, transformArray, animate, interim, abandoned*/ 15314) {
    				each_value_1 = /*hold*/ ctx[1];
    				validate_each_argument(each_value_1);
    				group_outros();
    				validate_each_keys(ctx, each_value_1, get_each_context_1$5, get_key);
    				each_blocks_1 = update_keyed_each(each_blocks_1, dirty, get_key, 1, ctx, each_value_1, each0_lookup, div6, outro_and_destroy_block, create_each_block_1$5, t0, get_each_context_1$5);
    				check_outros();
    			}

    			if (!current || dirty[0] & /*barrier*/ 32) {
    				set_style(div0, "display", /*barrier*/ ctx[5] ? 'block' : 'none');
    			}

    			if (!current || dirty[0] & /*left_card_show*/ 4) {
    				set_style(div1, "display", /*left_card_show*/ ctx[2] ? 'block' : 'none');
    			}

    			if ((!current || dirty[0] & /*left*/ 1) && t4_value !== (t4_value = /*left*/ ctx[0].length + "")) set_data_dev(t4, t4_value);

    			if (/*left*/ ctx[0].length == 0) {
    				if (if_block) ; else {
    					if_block = create_if_block$7(ctx);
    					if_block.c();
    					if_block.m(div3, t6);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty[0] & /*handcards, left*/ 2049) {
    				each_value = /*left*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$7, get_key_1);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key_1, 1, ctx, each_value, each1_lookup, div2, outro_and_destroy_block, create_each_block$7, null, get_each_context$7);
    				check_outros();
    			}

    			if (!current || dirty[0] & /*leftChange, left_card_show*/ 1028 && div5_class_value !== (div5_class_value = "left-card " + (/*leftChange*/ ctx[10] && 'animate_leftChange') + " " + (/*left_card_show*/ ctx[2] && 'show') + " svelte-n98s3t")) {
    				attr_dev(div5, "class", div5_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].d();
    			}

    			if (if_block) if_block.d();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			/*div2_binding*/ ctx[18](null);
    			mounted = false;
    			run_all(dispose);
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
    	let cost;
    	let transformArray;
    	let leftChange;
    	let $Admin;
    	let $data;
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(21, $Admin = $$value));
    	validate_store(data$1, 'data');
    	component_subscribe($$self, data$1, $$value => $$invalidate(22, $data = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('BattleHandcard', slots, []);
    	const Data = deepCopy($data);
    	const handcards = Object.unCount(Data.card);
    	const cards = Object.assign(deepCopy(spellcard$1), deepCopy(basecard));
    	let left = [];
    	let hold = [];
    	let selected;

    	const costOffset = {
    		index: handcards.map(_ => 0),
    		key: {},
    		reset() {
    			this.index = handcards.map(_ => 0);
    			this.key = {};
    		}
    	};

    	let left_card_show = false;
    	let element_container;
    	let animate = true;
    	let barrier = false;
    	let interim = handcards.map(key => cards[key].interim);
    	let abandoned = handcards.map(_ => false);
    	const expend = [];

    	let info_sector = {
    		limit: 4,
    		drawAmount: 2,
    		holdLimit: 4,
    		handcards
    	};

    	let { battle } = $$props;

    	const insertHandle = {
    		amount(amount) {
    			this.Amount = amount;
    			return this;
    		},
    		interim(v) {
    			this.Interim = v;
    			return this;
    		},
    		toAll(key) {
    			let res = [];
    			if (!this.Amount) this.Amount = 1;

    			[...Array(this.Amount).keys()].forEach(_ => {
    				if (this.Interim) interim.push(true); else interim.push(cards[key].interim);
    				handcards.push(key);
    				$$invalidate(15, costOffset.index = [...costOffset.index, 0], costOffset);
    				res.push(handcards.length - 1);
    			});

    			return res;
    		},
    		toHolds(key) {
    			let res = this.toAll(key);

    			setTimeout(
    				_ => {
    					$$invalidate(1, hold = [...hold, ...res]);
    				},
    				600
    			);
    		},
    		toLeft(key) {
    			let res = this.toAll(key);
    			$$invalidate(0, left = [...left, ...res]);
    		}
    	};

    	const drawHandle = {
    		amount(a) {
    			this.Amount = a;
    			return this;
    		},
    		type(t) {
    			this.Type = t;
    			return this;
    		},
    		fromAll() {
    			const range = handcards.map((_, i) => i).filter(i => !expend.includes(i) && !hold.includes(i));
    			if (range.length <= this.Amount) msg({ content: "抽空了" });
    			let holdLimit = 4 + Math.round($Admin.role.state.of(0).get().speed);
    			let info = { holdLimit, amount: this.Amount };
    			sector.drawCard($Admin, info);

    			let holdLength = hold.length,
    				margin = info.holdLimit - holdLength,
    				drawAmount = Math.min(margin, info.amount);

    			setTimeout(
    				_ => {
    					range.rd().splice(0, drawAmount).forEach(i => {
    						$$invalidate(1, hold = [...hold, i]);
    						if (left.includes(i)) $$invalidate(0, left = left.filter(ii => ii != i));
    					});
    				},
    				600
    			);

    			if (drawAmount > margin) msg({ content: "达到手牌上限" });
    		},
    		fromLeft() {
    			Object.keys(cards).filter(c => Object.keys(basecard).includes(c));
    			Object.keys(cards).filter(c => Object.keys(spellcard$1).includes(c));
    			this.handle(left);
    		},
    		fromExpend() {
    			this.handle(expend);
    		},
    		fromUsed() {
    			const range = handcards.map((_, i) => i).filter(i => !expend.includes(i) && !hold.includes(i) && !left.includes(i));
    			this.handle(range);
    		},
    		handle(range) {
    			if (range.length <= this.Amount) msg({ content: "抽空了" });
    			let holdLimit = 4 + Math.round($Admin.role.state.of(0).get().speed);

    			let info = {
    				holdLimit,
    				amount: this.Amount,
    				drawLimit: range.length
    			};

    			sector.drawCard($Admin, info);

    			let holdLength = hold.length,
    				leftLength = range.filter(i => !hold.includes(i)).length,
    				margin = info.holdLimit - holdLength,
    				drawAmount = Math.min(margin, info.amount, leftLength);

    			if (drawAmount > margin) msg({ content: "达到手牌上限" });

    			setTimeout(
    				_ => {
    					$$invalidate(1, hold = [...hold, ...range.rd().splice(0, drawAmount)]);
    					$$invalidate(0, left);
    				},
    				600
    			);
    		}
    	};

    	const abandonHandle = {
    		amount(a) {
    			this.Amount = a;
    			return this;
    		},
    		type(t) {
    			this.Type = t;
    			return this;
    		},
    		fromHolds() {
    			setTimeout(
    				_ => {
    					let source;
    					if (this.Type == "spellcard") source = hold.filter(ii => cards[handcards[ii]].type == "spellcard"); else source = deepCopy(hold);
    					let target = source.rd().splice(0, this.Amount);
    					target.forEach(t => $$invalidate(7, abandoned[t] = true, abandoned));
    					target = target.map(t => hold.indexOf(t));

    					setTimeout(
    						_ => {
    							$$invalidate(8, transformArray = transformArrayRefreshFor(target));

    							setTimeout(
    								_ => {
    									$$invalidate(4, animate = false);
    									$$invalidate(1, hold = hold.filter((_, i) => !target.includes(i)));
    									abandoned.set(false);
    									setTimeout(_ => $$invalidate(4, animate = true), 50);
    								},
    								250
    							);
    						},
    						200
    					);
    				},
    				600
    			);
    		}
    	};

    	const handcard = {
    		refresh,
    		punch,
    		aim: () => {
    			if (handcards[selected]) return "aim" in cards[handcards[selected]];
    		},
    		getHolds: _ => {
    			return hold.map(i => {
    				let key = handcards[i], res = deepCopy(cards[key]);
    				res.cost = cost[i];
    				res.key = key;
    				res.index = i;
    				return res;
    			});
    		},
    		getLefts: _ => {
    			return left.map(i => {
    				let key = handcards[i], res = deepCopy(cards[key]);
    				res.cost = cost[i];
    				res.key = key;
    				res.index = i;
    				return res;
    			});
    		},
    		getUseds: _ => {
    			let all = [...handcards.keys()];
    			all = all.filter(i => !hold.includes(i) || !left.includes(i));
    			return all;
    		},
    		getAll: _ => {
    			return handcards.map((card, i) => {
    				let res = deepCopy(cards[card]);
    				res.cost = cost[i];
    				res.key = card;
    				res.index = i;
    				res.interim = interim[i];
    				return res;
    			});
    		},
    		draw: drawHandle,
    		setCost: {
    			byIndex: (index, value) => {
    				$$invalidate(15, costOffset.index[index] = value, costOffset);
    			},
    			byKey: (key, value) => {
    				$$invalidate(15, costOffset.key[key] = value, costOffset);
    			}
    		},
    		getCostOffset() {
    			return costOffset;
    		},
    		setInterim: {
    			byIndex: (index, value) => {
    				$$invalidate(6, interim[index] = value, interim);
    			},
    			byKey: (key, value) => {
    				handcards.forEach((k, ii) => {
    					if (k == key) $$invalidate(6, interim[ii] = value, interim);
    				});

    				$$invalidate(6, interim);
    			}
    		},
    		insert: insertHandle,
    		abandon: abandonHandle,
    		Cost
    	};

    	set_store_value(Admin, $Admin.handcard = handcard, $Admin);

    	onMount(_ => {
    		setTimeout(_ => {
    			sector.handcardOnload($Admin, info_sector);
    			leftReset();
    		});
    	});

    	afterUpdate(_ => {
    		if (element_container) $$invalidate(
    			3,
    			element_container.ontouchstart = function (event) {
    				let originX = event.touches[0].pageX;
    				let scrollTop = element_container.scrollTop;

    				$$invalidate(
    					3,
    					element_container.ontouchmove = function (e) {
    						let x = e.touches[0].pageX;
    						$$invalidate(3, element_container.scrollTop = scrollTop + x - originX, element_container);
    					},
    					element_container
    				);
    			},
    			element_container
    		);
    	});

    	function leftChangeHandle() {
    		setTimeout(_ => $$invalidate(10, leftChange = false), 800);
    		return true;
    	}

    	function refresh() {
    		// 修改后的机制，用索引代表符卡，避免普攻被吞
    		const info = {
    			holdLimit: 4 + Math.round($Admin.role.state.of(0).get().speed),
    			drawAmount: Math.max(0, 2 + speedHandle()),
    			drawLimit: left.length,
    			ex: [],
    			handcards,
    			hold
    		};

    		if ($Admin.role.event.round.count == 1) {
    			info.drawAmount++;
    		}

    		sector.handcardRefresh($Admin, info);

    		let margin = info.holdLimit - hold.length,
    			drawAmount = Math.min(margin, info.drawAmount, left.length);

    		$$invalidate(1, hold = [...hold, ...left.splice(0, drawAmount), ...info.ex]);
    		leftReset();
    	}

    	function leftReset() {
    		let res = handcards.map((_, i) => i).filter(i => !hold.includes(i) && !expend.includes(i)).rd();
    		let info_sector = { res };
    		sector.handcardLeftReset($Admin, info_sector);
    		$$invalidate(0, left = res);
    		return res;
    	}

    	function punch(target) {
    		let _card = cards[handcards[selected]];
    		_card.key = handcards[selected];
    		_card.index = selected;
    		let type;
    		type = "role" in _card ? "spellcard" : "basecard";
    		if (Data.role == handcards[selected]) type = "normal_attack";

    		const info = {
    			cost: Cost(),
    			type,
    			card: _card,
    			target,
    			valid: true
    		};

    		if (!battle.round.get()) msg({ content: "不在你的回合" }); else if (info.cost === false) msg({ content: "条件不足" }); else if (info.cost > $Admin.role.power.of(0).get()) msg({ content: "灵力不足" }); else {
    			$Admin.role.power.of(0).cost(info.cost);
    			sector.punchCard($Admin, info);
    			let output = cards[handcards[selected]].handle;
    			if (info.valid) output($Admin, target);
    			set_store_value(Admin, $Admin.cache["last_card"] = handcards[selected], $Admin);
    			set_store_value(Admin, $Admin.cache["last_target"] = target, $Admin);
    		}
    	}

    	function Cost() {
    		const info = {
    			card: deepCopy(cards[handcards[selected]]),
    			cost: cost[selected],
    			valid: true
    		};

    		info.card.key = handcards[selected];
    		sector.beforePowerCost($Admin, info);
    		if (!info.valid) return false; else return info.cost;
    	}

    	function speedHandle() {
    		let target = $Admin.enermy.state.getAll().filter(e => e.Health > 0);
    		let adv = target.reduce((a, c) => a + c.speed, 0) / target.length;
    		let value = Math.abs($Admin.role.state.of(0).get().speed - adv);
    		let n = value - parseInt(value);
    		let res = parseInt(value) + Number(r() < n);
    		return $Admin.role.state.of(0).get().speed > adv ? res : -res;
    	}

    	function costOffsetApply() {
    		let info_cards = deepCopy(cards);
    		for (let key in costOffset.key) info_cards[key].cost += costOffset.key[key];
    		let res = handcards.map(c => info_cards[c].cost);
    		costOffset.index.forEach((c, i) => res[i] += c);
    		res = res.map(v => Math.max(0, v));
    		$$invalidate(9, cost = res);
    		return res;
    	}

    	function dragCancel(target) {
    		const s = selected;
    		punch(target);
    		$$invalidate(5, barrier = true);

    		setTimeout(
    			_ => {
    				$$invalidate(4, animate = false);
    				$$invalidate(1, hold = hold.filter(i => i != s));

    				setTimeout(
    					_ => {
    						$$invalidate(4, animate = true);
    						$$invalidate(5, barrier = false);
    						if (interim[s]) expend.push(s);
    					},
    					80
    				);
    			},
    			500
    		);
    	}

    	function transformArrayRefreshFor(index) {
    		index = index ? index : [];
    		let _hold = hold.filter((ii, i) => !index.includes(i));
    		let l = Math.max(_hold.length, 6) - 1;

    		let res = _hold.map((ii, i) => {
    			return {
    				x: (i - (_hold.length - 1) / 2) * 560 / l,
    				y: (Math.sqrt(490000 - Math.pow((i - (_hold.length - 1) / 2) / l * 700, 2)) - 600) / 2.5 - 90,
    				rotate: (i - (_hold.length - 1) / 2) * (15 * 2 / l)
    			};
    		});

    		for (let i of index) if (typeof i == "number") {
    			res.splice(i, 0, transformArray[i]);
    		}

    		return res;
    	}

    	function select(index, ii) {
    		if (typeof index == "number") selected = ii; else selected = null;
    		$$invalidate(8, transformArray = transformArrayRefreshFor([index]));
    	}

    	$$self.$$.on_mount.push(function () {
    		if (battle === undefined && !('battle' in $$props || $$self.$$.bound[$$self.$$.props['battle']])) {
    			console.warn("<BattleHandcard> was created without expected prop 'battle'");
    		}
    	});

    	const writable_props = ['battle'];

    	Object_1$8.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<BattleHandcard> was created with unknown prop '${key}'`);
    	});

    	const func = (i, ii, v) => select(v ? i : null, ii);
    	const click_handler = _ => $$invalidate(2, left_card_show = false);

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_container = $$value;
    			$$invalidate(3, element_container);
    		});
    	}

    	const click_handler_1 = _ => $$invalidate(2, left_card_show = true);

    	$$self.$$set = $$props => {
    		if ('battle' in $$props) $$invalidate(14, battle = $$props.battle);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		afterUpdate,
    		info_spellcard: spellcard$1,
    		info_basecard: basecard,
    		data: data$1,
    		Admin,
    		sector,
    		Card,
    		Data,
    		handcards,
    		cards,
    		left,
    		hold,
    		selected,
    		costOffset,
    		left_card_show,
    		element_container,
    		animate,
    		barrier,
    		interim,
    		abandoned,
    		expend,
    		info_sector,
    		battle,
    		insertHandle,
    		drawHandle,
    		abandonHandle,
    		handcard,
    		leftChangeHandle,
    		refresh,
    		leftReset,
    		punch,
    		Cost,
    		speedHandle,
    		costOffsetApply,
    		dragCancel,
    		transformArrayRefreshFor,
    		select,
    		transformArray,
    		cost,
    		leftChange,
    		$Admin,
    		$data
    	});

    	$$self.$inject_state = $$props => {
    		if ('left' in $$props) $$invalidate(0, left = $$props.left);
    		if ('hold' in $$props) $$invalidate(1, hold = $$props.hold);
    		if ('selected' in $$props) selected = $$props.selected;
    		if ('left_card_show' in $$props) $$invalidate(2, left_card_show = $$props.left_card_show);
    		if ('element_container' in $$props) $$invalidate(3, element_container = $$props.element_container);
    		if ('animate' in $$props) $$invalidate(4, animate = $$props.animate);
    		if ('barrier' in $$props) $$invalidate(5, barrier = $$props.barrier);
    		if ('interim' in $$props) $$invalidate(6, interim = $$props.interim);
    		if ('abandoned' in $$props) $$invalidate(7, abandoned = $$props.abandoned);
    		if ('info_sector' in $$props) info_sector = $$props.info_sector;
    		if ('battle' in $$props) $$invalidate(14, battle = $$props.battle);
    		if ('transformArray' in $$props) $$invalidate(8, transformArray = $$props.transformArray);
    		if ('cost' in $$props) $$invalidate(9, cost = $$props.cost);
    		if ('leftChange' in $$props) $$invalidate(10, leftChange = $$props.leftChange);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*costOffset*/ 32768) {
    			$$invalidate(9, cost = costOffset && costOffsetApply());
    		}

    		if ($$self.$$.dirty[0] & /*hold*/ 2) {
    			$$invalidate(8, transformArray = hold && transformArrayRefreshFor());
    		}

    		if ($$self.$$.dirty[0] & /*left*/ 1) {
    			$$invalidate(10, leftChange = left && leftChangeHandle());
    		}
    	};

    	return [
    		left,
    		hold,
    		left_card_show,
    		element_container,
    		animate,
    		barrier,
    		interim,
    		abandoned,
    		transformArray,
    		cost,
    		leftChange,
    		handcards,
    		dragCancel,
    		select,
    		battle,
    		costOffset,
    		func,
    		click_handler,
    		div2_binding,
    		click_handler_1
    	];
    }

    class BattleHandcard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { battle: 14 }, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BattleHandcard",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get battle() {
    		throw new Error("<BattleHandcard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set battle(value) {
    		throw new Error("<BattleHandcard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\addon\part\marisaAttack.svelte generated by Svelte v3.59.2 */

    const file$9 = "src\\addon\\part\\marisaAttack.svelte";

    function create_fragment$9(ctx) {
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
    			attr_dev(div0, "class", "icon-star svelte-1whc4g4");
    			add_location(div0, file$9, 11, 2, 246);
    			attr_dev(div1, "class", "icon-star svelte-1whc4g4");
    			add_location(div1, file$9, 12, 2, 275);
    			attr_dev(div2, "class", "icon-star svelte-1whc4g4");
    			add_location(div2, file$9, 13, 2, 304);
    			attr_dev(div3, "class", "icon-star svelte-1whc4g4");
    			add_location(div3, file$9, 14, 2, 333);
    			attr_dev(div4, "class", "icon-star svelte-1whc4g4");
    			add_location(div4, file$9, 15, 2, 362);
    			attr_dev(div5, "class", "icon-star svelte-1whc4g4");
    			add_location(div5, file$9, 16, 2, 391);
    			attr_dev(div6, "class", "MarisaAttack svelte-1whc4g4");
    			set_style(div6, "transform", "rotate(" + /*rotate*/ ctx[0] + "deg)");
    			set_style(div6, "left", /*left*/ ctx[1] + "px");
    			set_style(div6, "top", /*top*/ ctx[2] + "px");
    			add_location(div6, file$9, 7, 0, 144);
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
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MarisaAttack",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src\addon\part\youmuAttack.svelte generated by Svelte v3.59.2 */

    const file$8 = "src\\addon\\part\\youmuAttack.svelte";

    function create_fragment$8(ctx) {
    	let div6;
    	let div2;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div5;
    	let div3;
    	let t2;
    	let div4;

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div5 = element("div");
    			div3 = element("div");
    			t2 = space();
    			div4 = element("div");
    			attr_dev(div0, "class", "shadow svelte-bo2yxx");
    			set_style(div0, "--rotate", /*rotate*/ ctx[2][0] + "deg");
    			set_style(div0, "--height", /*height*/ ctx[3][0] + "px");
    			add_location(div0, file$8, 15, 4, 365);
    			attr_dev(div1, "class", "shadow svelte-bo2yxx");
    			set_style(div1, "--rotate", /*rotate*/ ctx[2][1] + "deg");
    			set_style(div1, "--height", /*height*/ ctx[3][1] + "px");
    			add_location(div1, file$8, 19, 4, 467);
    			set_style(div2, "z-index", "0");
    			attr_dev(div2, "class", "svelte-bo2yxx");
    			add_location(div2, file$8, 14, 2, 336);
    			attr_dev(div3, "class", "slash svelte-bo2yxx");
    			set_style(div3, "--rotate", /*rotate*/ ctx[2][0] + "deg");
    			set_style(div3, "--height", /*height*/ ctx[3][0] + "px");
    			add_location(div3, file$8, 25, 4, 606);
    			attr_dev(div4, "class", "slash svelte-bo2yxx");
    			set_style(div4, "--rotate", /*rotate*/ ctx[2][1] + "deg");
    			set_style(div4, "--height", /*height*/ ctx[3][1] + "px");
    			add_location(div4, file$8, 26, 4, 688);
    			set_style(div5, "z-index", "4");
    			attr_dev(div5, "class", "svelte-bo2yxx");
    			add_location(div5, file$8, 24, 2, 577);
    			attr_dev(div6, "class", "YoumuAttack svelte-bo2yxx");
    			set_style(div6, "left", /*left*/ ctx[0] + "px");
    			set_style(div6, "top", /*top*/ ctx[1] + "px");
    			set_style(div6, "transform", "rotate(" + (30 - r$3() * 60) + ")");
    			add_location(div6, file$8, 10, 0, 231);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div2);
    			append_dev(div2, div0);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div6, t1);
    			append_dev(div6, div5);
    			append_dev(div5, div3);
    			append_dev(div5, t2);
    			append_dev(div5, div4);
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function r$3() {
    	return Math.random();
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('YoumuAttack', slots, []);
    	let left = 40 + r$3() * 120;
    	let top = 80 + r$3() * 120;
    	let rotate = [-20 - r$3() * 50, 20 + r$3() * 50];
    	let height = [180 + r$3() * 40, 180 + r$3() * 40];
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<YoumuAttack> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ left, top, rotate, height, r: r$3 });

    	$$self.$inject_state = $$props => {
    		if ('left' in $$props) $$invalidate(0, left = $$props.left);
    		if ('top' in $$props) $$invalidate(1, top = $$props.top);
    		if ('rotate' in $$props) $$invalidate(2, rotate = $$props.rotate);
    		if ('height' in $$props) $$invalidate(3, height = $$props.height);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [left, top, rotate, height];
    }

    class YoumuAttack extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "YoumuAttack",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    const handle = {
      marisa: MarisaAttack,
      youmu: YoumuAttack
    };

    /* src\page\battleEnermy.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1$7 } = globals;
    const file$7 = "src\\page\\battleEnermy.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[40] = list[i];
    	child_ctx[41] = list;
    	child_ctx[42] = i;
    	return child_ctx;
    }

    function get_each_context_1$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[43] = list[i];
    	child_ctx[45] = i;
    	return child_ctx;
    }

    function get_each_context_2$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[46] = list[i];
    	child_ctx[47] = list;
    	child_ctx[45] = i;
    	return child_ctx;
    }

    // (544:14) {#if Object.values(buff[i])[ii] > 1}
    function create_if_block_1$5(ctx) {
    	let txt;
    	let t_value = Object.values(/*buff*/ ctx[3][/*i*/ ctx[42]])[/*ii*/ ctx[45]] + "";
    	let t;

    	const block = {
    		c: function create() {
    			txt = element("txt");
    			t = text(t_value);
    			attr_dev(txt, "class", "svelte-1lblg1l");
    			add_location(txt, file$7, 544, 16, 16617);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, txt, anchor);
    			append_dev(txt, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*buff*/ 8 && t_value !== (t_value = Object.values(/*buff*/ ctx[3][/*i*/ ctx[42]])[/*ii*/ ctx[45]] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(txt);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$5.name,
    		type: "if",
    		source: "(544:14) {#if Object.values(buff[i])[ii] > 1}",
    		ctx
    	});

    	return block;
    }

    // (541:10) {#each Object.keys(buff[i]) as b, ii (ii)}
    function create_each_block_2$3(key_1, ctx) {
    	let div;
    	let icon;
    	let icon_class_value;
    	let t0;
    	let show_if = Object.values(/*buff*/ ctx[3][/*i*/ ctx[42]])[/*ii*/ ctx[45]] > 1;
    	let t1;
    	let i = /*i*/ ctx[42];
    	let ii = /*ii*/ ctx[45];
    	let if_block = show_if && create_if_block_1$5(ctx);
    	const assign_div = () => /*div_binding*/ ctx[16](div, i, ii);
    	const unassign_div = () => /*div_binding*/ ctx[16](null, i, ii);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			icon = element("icon");
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();
    			attr_dev(icon, "class", icon_class_value = "icon-" + /*b*/ ctx[46] + " svelte-1lblg1l");
    			add_location(icon, file$7, 542, 14, 16517);
    			attr_dev(div, "class", "svelte-1lblg1l");
    			add_location(div, file$7, 541, 12, 16464);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, icon);
    			append_dev(div, t0);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t1);
    			assign_div();
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*buff*/ 8 && icon_class_value !== (icon_class_value = "icon-" + /*b*/ ctx[46] + " svelte-1lblg1l")) {
    				attr_dev(icon, "class", icon_class_value);
    			}

    			if (dirty[0] & /*buff*/ 8) show_if = Object.values(/*buff*/ ctx[3][/*i*/ ctx[42]])[/*ii*/ ctx[45]] > 1;

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$5(ctx);
    					if_block.c();
    					if_block.m(div, t1);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (i !== /*i*/ ctx[42] || ii !== /*ii*/ ctx[45]) {
    				unassign_div();
    				i = /*i*/ ctx[42];
    				ii = /*ii*/ ctx[45];
    				assign_div();
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			unassign_div();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$3.name,
    		type: "each",
    		source: "(541:10) {#each Object.keys(buff[i]) as b, ii (ii)}",
    		ctx
    	});

    	return block;
    }

    // (552:6) {#each input[i] as a, ii (ii)}
    function create_each_block_1$4(key_1, ctx) {
    	let a;
    	let t_value = /*a*/ ctx[43].info.value + "";
    	let t;
    	let a_class_value;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "class", a_class_value = "battle-input-" + /*a*/ ctx[43].info.prop + " " + (/*a*/ ctx[43].info.penetrate && 'penetrate') + " " + (/*a*/ ctx[43].info.critical && 'critical') + " svelte-1lblg1l");
    			set_style(a, "left", -25 + r$2() * 150 + "px");
    			set_style(a, "top", 50 + r$2() * 150 + "px");
    			add_location(a, file$7, 552, 8, 16837);
    			this.first = a;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*input*/ 64 && t_value !== (t_value = /*a*/ ctx[43].info.value + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*input*/ 64 && a_class_value !== (a_class_value = "battle-input-" + /*a*/ ctx[43].info.prop + " " + (/*a*/ ctx[43].info.penetrate && 'penetrate') + " " + (/*a*/ ctx[43].info.critical && 'critical') + " svelte-1lblg1l")) {
    				attr_dev(a, "class", a_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$4.name,
    		type: "each",
    		source: "(552:6) {#each input[i] as a, ii (ii)}",
    		ctx
    	});

    	return block;
    }

    // (561:6) {#if onHurt[i]}
    function create_if_block$6(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	var switch_value = handle[/*Data*/ ctx[12].role];

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
    			if (switch_value !== (switch_value = handle[/*Data*/ ctx[12].role])) {
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
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(561:6) {#if onHurt[i]}",
    		ctx
    	});

    	return block;
    }

    // (516:2) {#each enermys as e, i (i)}
    function create_each_block$6(key_1, ctx) {
    	let div5;
    	let div0;
    	let img;
    	let img_src_value;
    	let img_class_value;
    	let i = /*i*/ ctx[42];
    	let t0;
    	let txt;
    	let t1_value = enermy$1[/*e*/ ctx[40]].name + "";
    	let t1;
    	let t2;
    	let div3;
    	let div1;
    	let t3;
    	let div2;
    	let each_blocks_1 = [];
    	let each0_lookup = new Map();
    	let t4;
    	let div4;
    	let t5;
    	let each_blocks = [];
    	let each1_lookup = new Map();
    	let t6;
    	let t7;
    	let div5_class_value;
    	let current;
    	const assign_img = () => /*img_binding*/ ctx[15](img, i);
    	const unassign_img = () => /*img_binding*/ ctx[15](null, i);
    	let each_value_2 = Object.keys(/*buff*/ ctx[3][/*i*/ ctx[42]]);
    	validate_each_argument(each_value_2);
    	const get_key = ctx => /*ii*/ ctx[45];
    	validate_each_keys(ctx, each_value_2, get_each_context_2$3, get_key);

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		let child_ctx = get_each_context_2$3(ctx, each_value_2, i);
    		let key = get_key(child_ctx);
    		each0_lookup.set(key, each_blocks_1[i] = create_each_block_2$3(key, child_ctx));
    	}

    	let each_value_1 = /*input*/ ctx[6][/*i*/ ctx[42]];
    	validate_each_argument(each_value_1);
    	const get_key_1 = ctx => /*ii*/ ctx[45];
    	validate_each_keys(ctx, each_value_1, get_each_context_1$4, get_key_1);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1$4(ctx, each_value_1, i);
    		let key = get_key_1(child_ctx);
    		each1_lookup.set(key, each_blocks[i] = create_each_block_1$4(key, child_ctx));
    	}

    	let if_block = /*onHurt*/ ctx[8][/*i*/ ctx[42]] && create_if_block$6(ctx);

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

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t4 = space();
    			div4 = element("div");
    			t5 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t6 = space();
    			if (if_block) if_block.c();
    			t7 = space();
    			if (!src_url_equal(img.src, img_src_value = `/img/enermy/${enermy$1[/*e*/ ctx[40]].type}/${/*e*/ ctx[40]}/${/*emotion*/ ctx[7][/*i*/ ctx[42]]}.webp`)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", img_class_value = "" + (null_to_empty(`${/*onHurt*/ ctx[8][/*i*/ ctx[42]] && "animate_enermyShake"}`) + " svelte-1lblg1l"));
    			add_location(img, file$7, 523, 8, 15749);
    			attr_dev(txt, "class", "svelte-1lblg1l");
    			add_location(txt, file$7, 528, 8, 15948);
    			attr_dev(div0, "class", "enermy-info svelte-1lblg1l");
    			add_location(div0, file$7, 522, 6, 15714);
    			attr_dev(div1, "class", "enermy-health svelte-1lblg1l");

    			set_style(div1, "visibility", /*health*/ ctx[2][/*i*/ ctx[42]] < /*state*/ ctx[1][/*i*/ ctx[42]].health
    			? 'visible'
    			: 'hidden');

    			set_style(div1, "background-image", `linear-gradient(90deg, white ${/*health*/ ctx[2][/*i*/ ctx[42]] / /*state*/ ctx[1][/*i*/ ctx[42]].health * 100}%, transparent ${/*health*/ ctx[2][/*i*/ ctx[42]] / /*state*/ ctx[1][/*i*/ ctx[42]].health * 100}%)`);
    			add_location(div1, file$7, 531, 8, 16033);
    			attr_dev(div2, "class", "enermy-buff svelte-1lblg1l");
    			add_location(div2, file$7, 539, 8, 16371);
    			attr_dev(div3, "class", "enermy-state svelte-1lblg1l");
    			add_location(div3, file$7, 530, 6, 15997);
    			attr_dev(div4, "class", "enermy-aim icon-aim svelte-1lblg1l");
    			add_location(div4, file$7, 550, 6, 16754);
    			attr_dev(div5, "class", div5_class_value = "" + (null_to_empty(`enermy ${/*aim*/ ctx[5] === /*i*/ ctx[42] && "oneAim"} ${/*health*/ ctx[2][/*i*/ ctx[42]] <= 0 && "animate_enermyOut"} ${/*ordered*/ ctx[0] == /*i*/ ctx[42] && "orderEnermy"}`) + " svelte-1lblg1l"));
    			set_style(div5, "z-index", /*enermys*/ ctx[13].length - /*i*/ ctx[42]);
    			add_location(div5, file$7, 516, 4, 15510);
    			this.first = div5;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div0, img);
    			assign_img();
    			append_dev(div0, t0);
    			append_dev(div0, txt);
    			append_dev(txt, t1);
    			append_dev(div5, t2);
    			append_dev(div5, div3);
    			append_dev(div3, div1);
    			append_dev(div3, t3);
    			append_dev(div3, div2);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(div2, null);
    				}
    			}

    			append_dev(div5, t4);
    			append_dev(div5, div4);
    			append_dev(div5, t5);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div5, null);
    				}
    			}

    			append_dev(div5, t6);
    			if (if_block) if_block.m(div5, null);
    			append_dev(div5, t7);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty[0] & /*emotion*/ 128 && !src_url_equal(img.src, img_src_value = `/img/enermy/${enermy$1[/*e*/ ctx[40]].type}/${/*e*/ ctx[40]}/${/*emotion*/ ctx[7][/*i*/ ctx[42]]}.webp`)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!current || dirty[0] & /*onHurt*/ 256 && img_class_value !== (img_class_value = "" + (null_to_empty(`${/*onHurt*/ ctx[8][/*i*/ ctx[42]] && "animate_enermyShake"}`) + " svelte-1lblg1l"))) {
    				attr_dev(img, "class", img_class_value);
    			}

    			if (i !== /*i*/ ctx[42]) {
    				unassign_img();
    				i = /*i*/ ctx[42];
    				assign_img();
    			}

    			if (!current || dirty[0] & /*health, state*/ 6) {
    				set_style(div1, "visibility", /*health*/ ctx[2][/*i*/ ctx[42]] < /*state*/ ctx[1][/*i*/ ctx[42]].health
    				? 'visible'
    				: 'hidden');
    			}

    			if (!current || dirty[0] & /*health, state*/ 6) {
    				set_style(div1, "background-image", `linear-gradient(90deg, white ${/*health*/ ctx[2][/*i*/ ctx[42]] / /*state*/ ctx[1][/*i*/ ctx[42]].health * 100}%, transparent ${/*health*/ ctx[2][/*i*/ ctx[42]] / /*state*/ ctx[1][/*i*/ ctx[42]].health * 100}%)`);
    			}

    			if (dirty[0] & /*element_buff, enermys, buff*/ 8712) {
    				each_value_2 = Object.keys(/*buff*/ ctx[3][/*i*/ ctx[42]]);
    				validate_each_argument(each_value_2);
    				validate_each_keys(ctx, each_value_2, get_each_context_2$3, get_key);
    				each_blocks_1 = update_keyed_each(each_blocks_1, dirty, get_key, 1, ctx, each_value_2, each0_lookup, div2, destroy_block, create_each_block_2$3, null, get_each_context_2$3);
    			}

    			if (dirty[0] & /*input, enermys*/ 8256) {
    				each_value_1 = /*input*/ ctx[6][/*i*/ ctx[42]];
    				validate_each_argument(each_value_1);
    				validate_each_keys(ctx, each_value_1, get_each_context_1$4, get_key_1);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key_1, 1, ctx, each_value_1, each1_lookup, div5, destroy_block, create_each_block_1$4, t6, get_each_context_1$4);
    			}

    			if (/*onHurt*/ ctx[8][/*i*/ ctx[42]]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*onHurt*/ 256) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$6(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div5, t7);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*aim, health, ordered*/ 37 && div5_class_value !== (div5_class_value = "" + (null_to_empty(`enermy ${/*aim*/ ctx[5] === /*i*/ ctx[42] && "oneAim"} ${/*health*/ ctx[2][/*i*/ ctx[42]] <= 0 && "animate_enermyOut"} ${/*ordered*/ ctx[0] == /*i*/ ctx[42] && "orderEnermy"}`) + " svelte-1lblg1l"))) {
    				attr_dev(div5, "class", div5_class_value);
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
    			if (detaching) detach_dev(div5);
    			unassign_img();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].d();
    			}

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$6.name,
    		type: "each",
    		source: "(516:2) {#each enermys as e, i (i)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let div_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*enermys*/ ctx[13];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*i*/ ctx[42];
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

    			attr_dev(div, "class", div_class_value = "enermys " + (/*aimAll*/ ctx[4] && typeof /*aim*/ ctx[5] == 'number' && 'allAim') + " svelte-1lblg1l");
    			add_location(div, file$7, 510, 0, 15329);
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

    			/*div_binding_1*/ ctx[18](div);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "mouseenter", /*mouseenter_handler*/ ctx[17], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*aim, enermys, health, ordered, Data, onHurt, input, buff, element_buff, state, emotion, element_enermy*/ 14319) {
    				each_value = /*enermys*/ ctx[13];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$6, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block$6, null, get_each_context$6);
    				check_outros();
    			}

    			if (!current || dirty[0] & /*aimAll, aim*/ 48 && div_class_value !== (div_class_value = "enermys " + (/*aimAll*/ ctx[4] && typeof /*aim*/ ctx[5] == 'number' && 'allAim') + " svelte-1lblg1l")) {
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

    			/*div_binding_1*/ ctx[18](null);
    			mounted = false;
    			dispose();
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

    function r$2() {
    	return Math.random();
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $Admin;
    	let $frameEvent;
    	let $Explain;
    	let $data;
    	let $explore;
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(20, $Admin = $$value));
    	validate_store(frameEvent, 'frameEvent');
    	component_subscribe($$self, frameEvent, $$value => $$invalidate(21, $frameEvent = $$value));
    	validate_store(Explain, 'Explain');
    	component_subscribe($$self, Explain, $$value => $$invalidate(22, $Explain = $$value));
    	validate_store(data$1, 'data');
    	component_subscribe($$self, data$1, $$value => $$invalidate(23, $data = $$value));
    	validate_store(explore, 'explore');
    	component_subscribe($$self, explore, $$value => $$invalidate(24, $explore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('BattleEnermy', slots, []);
    	let { battle } = $$props;
    	const Explore = deepCopy($explore);
    	set_store_value(Admin, $Admin.explore = Explore, $Admin);
    	const Data = deepCopy($data);
    	const enermys = Explore.target.map((t, i) => t && Explore.enermy[i]).filter(e => e);
    	let ordered; //敌人回合的时候轮到谁谁就往上移动20px
    	let state = enermys.map(e => enermy$1[e].growth(Explore.lv));
    	let health = state.map(s => s.health);
    	let buff = health.map(_ => new Object());
    	let aimAll = false;
    	let aim = false;
    	let input = enermys.map(_ => new Array());
    	let emotion = enermys.map(_ => "portrait");
    	let onHurt = enermys.map(_ => false);
    	const element_buff = enermys.map(_ => []);
    	const element_enermy = [];
    	let element_enermys;

    	const action = {
    		list: [],
    		handle() {
    			if (this.list.length > 0) {
    				if (this.list[0].time == 1) {
    					if (battle.effect.listLengthOf("enermy") == 0) this.list.shift().handle();
    				} else this.list[0].time--;
    			}
    		}
    	};

    	const inputRender = {
    		add(info, index) {
    			$$invalidate(6, input[index] = [...input[index], { info, time: 50 }], input);
    		},
    		handle() {
    			input.forEach((i, index) => {
    				i.forEach(ii => {
    					if (ii.time > 0) ii.time--;
    				});

    				let count = i.filter(ii => ii.time > 0).length;
    				if (count == 0) enermy.express.outHurt(index);
    			});
    		}
    	};

    	const buffHandle = {
    		of(index) {
    			let This = deepCopy(this);
    			This.Target = index;
    			return This;
    		},
    		get(b) {
    			if (b in buff[this.Target]) return buff[this.Target][b]; else return false;
    		},
    		getAll() {
    			let res = {};

    			for (let b in buff[this.Target]) {
    				res[b] = buff$1[b];
    			}

    			return res;
    		},
    		add(b, n) {
    			battle.effect.targetEnermy(this.Target).by(
    				_ => {
    					n = n ? n : 1;
    					if (b in buff[this.Target]) $$invalidate(3, buff[this.Target][b] += n, buff); else $$invalidate(3, buff[this.Target][b] = n, buff);
    				},
    				10
    			);
    		},
    		addAll(b, n) {
    			battle.effect.targetEnermy(0).by(
    				_ => {
    					n = n ? n : 1;

    					enermy.survival().forEach(e => {
    						if (b in buff[e]) $$invalidate(3, buff[e][b] += n, buff); else $$invalidate(3, buff[e][b] = n, buff);
    					});
    				},
    				10
    			);
    		},
    		set(b, n) {
    			battle.effect.targetEnermy(this.Target).by(
    				_ => {
    					$$invalidate(3, buff[this.Target][b] = n, buff);
    				},
    				10
    			);
    		},
    		clear(b, n) {
    			if (b in buff[this.Target]) {
    				if (n) {
    					battle.effect.targetEnermy(this.Target).by(
    						_ => {
    							if (buff[this.Target][b] != undefined) {
    								$$invalidate(3, buff[this.Target][b] -= n, buff);
    								buff[this.Target][b] <= 0 && delete buff[this.Target][b];
    							}
    						},
    						10
    					);
    				} else battle.effect.targetEnermy(this.Target).by(
    					_ => {
    						delete buff[this.Target][b];
    						$$invalidate(3, buff);
    					},
    					10
    				);
    			} else return false;
    		},
    		clearAll(positive) {
    			battle.effect.targetEnermy(this.Target).by(
    				_ => {
    					if (positive === true) for (let b in buff[this.Target]) buff$1[b].positive && delete buff[this.Target][b]; else if (positive === false) for (let b in buff[this.Target]) !buff$1[b].positive && delete buff[this.Target][b]; else $$invalidate(3, buff[this.Target] = {}, buff);
    					$$invalidate(3, buff);
    				},
    				10
    			);
    		},
    		link(k) {
    			this.Key = k;
    			return this;
    		},
    		to(f) {
    			if (this.Key in buff[this.Target]) {
    				let amount = buff[this.Target][this.Key];

    				// 不知为何底下这两行顺序不能反
    				if (buff$1[this.Key].expend) this.clear(this.Key, 1);

    				f(Math.max(amount, 0));
    			}
    		},
    		count(positive) {
    			let positiveBuffCount = Object.keys(buff[this.Target]).filter(b => buff$1[b].positive).length;
    			if (positive) return positiveBuffCount; else return Object.keys(buff[this.Target]).length - positiveBuffCount;
    		}
    	};

    	const expressHandle = {
    		store: enermys.map(_ => "portrait"),
    		emotionGet(i) {
    			let res = emotion[i] == "hurt" ? this.store[i] : emotion[i];
    			return typeof i == "number" ? res : emotion;
    		},
    		emotionSet(i, type) {
    			if (type != "hurt") this.store[i] = emotion[i];
    			$$invalidate(7, emotion[i] = type, emotion);
    		},
    		outHurt(i) {
    			$$invalidate(7, emotion[i] = this.store[i], emotion);
    			$$invalidate(8, onHurt[i] = false, onHurt);
    		},
    		hurt(i) {
    			$$invalidate(8, onHurt[i] = true, onHurt);
    		}
    	};

    	const damageHandle = {
    		except(index) {
    			let This = deepCopy(this);
    			This.Except = index;
    			return This;
    		},
    		target(index) {
    			let This = deepCopy(this);
    			This.Aim = "one";
    			This.Target = index;
    			return This;
    		},
    		targetMuti(array) {
    			let This = this;
    			This.Aim = "muti";
    			This.Muti = array;
    			return This;
    		},
    		targetAll() {
    			let This = this;
    			This.Aim = "all";
    			return This;
    		},
    		average() {
    			this.Aim = "average";
    			return this;
    		},
    		random() {
    			let This = this;
    			This.Aim = "random";
    			return This;
    		},
    		source(index) {
    			this.Source = index;
    			return this;
    		},
    		from(index) {
    			this.From = index;
    			return this;
    		},
    		by(Damage) {
    			if (Damage.type == "static") ;
    			let e = health.map((_, i) => i).filter(i => health[i] > 0);

    			let aim = {
    				one: [this.Target],
    				all: e.filter(i => i != this.Except),
    				average: e.filter(i => i != this.Except),
    				random: e.filter(i => i != this.Except).rd().splice(0, 1)
    			};

    			const source = this.Source;
    			this.Source = false;
    			let targets = this.Aim == "muti" ? this.Muti : aim[this.Aim];
    			this.Target = false;
    			this.Except = -1;
    			if (!Damage.amount) Damage.amount = 1;

    			battle.effect.targetEnermy(this.Target).by(_ => {
    				for (let i of targets) {
    					const damage = deepCopy(Damage);
    					damage.value /= this.Aim == "average" ? targets.length : 1;
    					const damageArray = [];

    					for (let a = 0; a < damage.amount; a++) {
    						let info_sector = {
    							damage: deepCopy(damage),
    							target: i,
    							source
    						};

    						sector.enermyDamagedProcess($Admin, info_sector);
    						let display;

    						if (info_sector.damage.blocked) display = "已阻挡"; else if (info_sector.damage.miss) display = "Miss"; else {
    							$$invalidate(2, health[i] -= info_sector.damage.value, health);

    							if (health[i] <= 0) {
    								action.list = action.list.filter(a => a.index != i);
    								$Admin.role.event.defeat(i).by(info_sector.damage);
    								if ($Admin.enermy.survival().length == 0) $Admin.battle.winEvent();
    							}

    							display = retain(info_sector.damage.value, 1);
    						}

    						inputRender.add(
    							{
    								value: display,
    								prop: "damage",
    								penetrate: info_sector.damage.penetrate,
    								critical: info_sector.damage.critical
    							},
    							i
    						);

    						damageArray.push(info_sector.damage);
    					}

    					let missDamage = damageArray.filter(damage => damage.miss),
    						blockedDamage = damageArray.filter(damage => damage.blocked);

    					if (missDamage.length == 0) if (enermy.express.emotionGet(i) != "hurt") enermy.express.hurt(i);
    					if (blockedDamage == 0) enermy.express.emotionSet(i, "hurt");
    				}
    			});
    		}
    	};

    	const healHandle = {
    		from(index) {
    			this.From = index;
    			return this;
    		},
    		target(index) {
    			this.Target = index;
    			this.Aim = "one";
    			return this;
    		},
    		targetAll() {
    			let This = this;
    			This.Aim = "all";
    			return This;
    		},
    		by(heal) {
    			if (heal.type == "static") ;
    			let e = health.map((_, i) => i).filter(i => health[i] > 0);

    			let aim = {
    				one: [this.Target],
    				all: e.filter(i => i != this.Except),
    				average: e.filter(i => i != this.Except),
    				random: e.filter(i => i != this.Except).rd().splice(0, 1)
    			};

    			this.Source = false;
    			let targets = this.Aim == "muti" ? this.Muti : aim[this.Aim];
    			this.Target = false;
    			this.Except = -1;
    			if (!heal.amount) heal.amount = 1;

    			battle.effect.targetEnermy(this.Target).by(_ => {
    				for (let i of targets) {
    					if (heal.type == "static") ;
    					$$invalidate(2, health[i] += heal.value, health);
    					let overHeal = health[i] - state.health;

    					if (overHeal > 0) {
    						$$invalidate(2, health[i] = state.health, health);
    					}

    					inputRender.add(
    						{
    							value: retain(heal.value, 1),
    							prop: "heal"
    						},
    						i
    					);

    					return heal.value;
    				}
    			});
    		}
    	};

    	const stateHandle = {
    		of(index) {
    			this.Target = index;
    			return this;
    		},
    		get() {
    			let s = deepCopy(state[this.Target]);
    			s.Health = health[this.Target];
    			let info = { state: s, target: this.Target };
    			sector.enermyStateGet($Admin, info);
    			return s;
    		},
    		getAll() {
    			let s = deepCopy(state);
    			health.forEach((h, i) => s[i].Health = h);
    			return s;
    		},
    		set(n, v) {
    			if (n == "Health") healthSet(v, this.Target); else $$invalidate(1, state[this.Target][n] = v, state);

    			if (health[this.Target] <= 0) {
    				action.list = action.list.filter(a => a.index != this.Target);
    				$Admin.role.event.defeat(this.Target);
    				if ($Admin.enermy.survival().length == 0) $Admin.battle.winEvent();
    			}
    		}
    	};

    	const eventHandle = {
    		round: {
    			of(index) {
    				this.Target = index;
    				return this;
    			},
    			start() {
    				let info = {
    					target: this.Target,
    					interimBuff: Object.keys(buff$1).filter(key => buff$1[key].interim),
    					decreaseBuff: Object.keys(buff$1).filter(key => buff$1[key].decrease)
    				};

    				sector.enermyRoundStart($Admin, info);
    				info.decreaseBuff.forEach(b => enermy.buff.of(this.Target).clear(b, 1));
    				info.interimBuff.forEach(b => enermy.buff.of(this.Target).clear(b));
    			},
    			end() {
    				
    			}
    		}
    	};

    	const infoHandle = {
    		of(index) {
    			this.Target = index;
    			return this;
    		},
    		get() {
    			return enermy$1[enermys[this.Target]];
    		}
    	};

    	const enermy = {
    		action: actionHandle,
    		render: inputRender,
    		state: stateHandle,
    		buff: buffHandle,
    		express: expressHandle,
    		damage: damageHandle,
    		heal: healHandle,
    		event: eventHandle,
    		survival,
    		info: infoHandle,
    		checkForPosition,
    		equipmentAim: roleAction
    	};

    	set_store_value(Admin, $Admin.enermy = enermy, $Admin);

    	onMount(_ => {
    		$frameEvent.add("enermyInput", _ => inputRender.handle(), 1);
    		sector.enermyOnload($Admin, { enermys });

    		setTimeout(
    			_ => {
    				enermys.forEach((e, i) => enermy$1[e].onload && enermy$1[e].onload($Admin, i));
    			},
    			1000
    		);
    	});

    	beforeUpdate(_ => {
    		if ($Admin.handcard && $Admin.battle.equipment) {
    			$$invalidate(4, aimAll = !$Admin.handcard.aim() && !$Admin.battle.equipment.aim());
    		}

    		element_buff.forEach((b, i) => {
    			b.forEach((e, ii) => {
    				let key = Object.keys(buff[i])[ii];
    				key && $Explain(e).color(buff$1[key].positive ? "blue" : "purple").with(buff$1[key]);
    			});
    		});

    		let enermy_info = Explore.enermy.filter((_, i) => Explore.target[i]).map(e => enermy$1[e]);

    		element_enermy.forEach((e, i) => {
    			$Explain(e).color(enermy_info[i].color).with(enermy_info[i]);
    		});
    	});

    	function survival() {
    		return enermys.map((_, i) => i).filter(i => state[i].health < 0 || health[i] > 0);
    	}

    	function actionHandle() {
    		$frameEvent.add("enermyAction", _ => action.handle(), 1);
    		const u = 12.5, enermyInterval = 6, afterSwitch = 4, beforeStart = 6;

    		enermys.forEach((e, i) => {
    			if (health[i] > 0) {
    				action.list.push({
    					handle: _ => {
    						battle.effect.targetEnermy(i).by(_ => {
    							$$invalidate(0, ordered = i);
    							enermy.event.round.of(i).start();
    						});
    					},
    					time: enermyInterval * u,
    					index: i
    				});

    				action.list.push({
    					handle: _ => battle.effect.targetRole(i).by(_ => {
    						enermy$1[e].action($Admin, i);
    					}),
    					time: afterSwitch * u,
    					index: i
    				});
    			}
    		});

    		action.list.push({
    			handle: _ => {
    				battle.effect.targetRole(0).by(_ => {
    					$$invalidate(0, ordered = null);
    					$frameEvent.clear("enermyAction");
    					$Admin.role.event.round.start();
    				});
    			},
    			time: beforeStart * u
    		});
    	}

    	function healthSet(h, i) {
    		$$invalidate(2, health[i] = h > state[i].health ? state[i].health : h, health);
    	}

    	function checkForPosition(p) {
    		let enermyRange = element_enermy.map(e => e.getBoundingClientRect());
    		let enermysRange = element_enermys.getBoundingClientRect();
    		let position = false;
    		let _aimAll = !$Admin.handcard.aim() && !$Admin.battle.equipment.aim();

    		enermyRange.forEach((e, i) => {
    			if (p.x > e.left && p.x < e.right && p.y < e.bottom - 50 && p.y > e.top) position = i;
    		});

    		if (typeof position == "number" && health[position] <= 0) position = false;

    		if (!_aimAll) {
    			$$invalidate(5, aim = position);
    		} else {
    			if (p.x > enermysRange.left && p.x < enermysRange.right && p.y < enermysRange.bottom - 50 && p.y > enermysRange.top) position = survival()[0];
    			$$invalidate(5, aim = position);
    		}

    		return position;
    	}

    	function roleAction() {
    		if (typeof aim == "number") {
    			if (health[aim] > 0) {
    				battle.equipment.target(aim).use();
    				$$invalidate(5, aim = false);
    				return true;
    			} else return false;
    		} else return false;
    	}

    	$$self.$$.on_mount.push(function () {
    		if (battle === undefined && !('battle' in $$props || $$self.$$.bound[$$self.$$.props['battle']])) {
    			console.warn("<BattleEnermy> was created without expected prop 'battle'");
    		}
    	});

    	const writable_props = ['battle'];

    	Object_1$7.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<BattleEnermy> was created with unknown prop '${key}'`);
    	});

    	function img_binding($$value, i) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_enermy[i] = $$value;
    			$$invalidate(10, element_enermy);
    		});
    	}

    	function div_binding($$value, i, ii) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_buff[i][ii] = $$value;
    			$$invalidate(9, element_buff);
    		});
    	}

    	const mouseenter_handler = _ => $$invalidate(5, aim = false);

    	function div_binding_1($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_enermys = $$value;
    			$$invalidate(11, element_enermys);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('battle' in $$props) $$invalidate(14, battle = $$props.battle);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		beforeUpdate,
    		explore,
    		data: data$1,
    		Explain,
    		frameEvent,
    		Admin,
    		Enermy: enermy$1,
    		buffs: buff$1,
    		attackAnimation: handle,
    		sector,
    		battle,
    		Explore,
    		Data,
    		enermys,
    		ordered,
    		state,
    		health,
    		buff,
    		aimAll,
    		aim,
    		input,
    		emotion,
    		onHurt,
    		element_buff,
    		element_enermy,
    		element_enermys,
    		action,
    		inputRender,
    		buffHandle,
    		expressHandle,
    		damageHandle,
    		healHandle,
    		stateHandle,
    		eventHandle,
    		infoHandle,
    		enermy,
    		r: r$2,
    		survival,
    		actionHandle,
    		healthSet,
    		checkForPosition,
    		roleAction,
    		$Admin,
    		$frameEvent,
    		$Explain,
    		$data,
    		$explore
    	});

    	$$self.$inject_state = $$props => {
    		if ('battle' in $$props) $$invalidate(14, battle = $$props.battle);
    		if ('ordered' in $$props) $$invalidate(0, ordered = $$props.ordered);
    		if ('state' in $$props) $$invalidate(1, state = $$props.state);
    		if ('health' in $$props) $$invalidate(2, health = $$props.health);
    		if ('buff' in $$props) $$invalidate(3, buff = $$props.buff);
    		if ('aimAll' in $$props) $$invalidate(4, aimAll = $$props.aimAll);
    		if ('aim' in $$props) $$invalidate(5, aim = $$props.aim);
    		if ('input' in $$props) $$invalidate(6, input = $$props.input);
    		if ('emotion' in $$props) $$invalidate(7, emotion = $$props.emotion);
    		if ('onHurt' in $$props) $$invalidate(8, onHurt = $$props.onHurt);
    		if ('element_enermys' in $$props) $$invalidate(11, element_enermys = $$props.element_enermys);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		ordered,
    		state,
    		health,
    		buff,
    		aimAll,
    		aim,
    		input,
    		emotion,
    		onHurt,
    		element_buff,
    		element_enermy,
    		element_enermys,
    		Data,
    		enermys,
    		battle,
    		img_binding,
    		div_binding,
    		mouseenter_handler,
    		div_binding_1
    	];
    }

    class BattleEnermy extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { battle: 14 }, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BattleEnermy",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get battle() {
    		throw new Error("<BattleEnermy>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set battle(value) {
    		throw new Error("<BattleEnermy>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\page\battleState.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1$6 } = globals;
    const file$6 = "src\\page\\battleState.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[29] = list[i];
    	child_ctx[30] = list;
    	child_ctx[31] = i;
    	return child_ctx;
    }

    function get_each_context_1$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[31] = list[i];
    	return child_ctx;
    }

    function get_each_context_2$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[31] = list[i];
    	return child_ctx;
    }

    function get_each_context_3$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[36] = list[i];
    	child_ctx[31] = i;
    	return child_ctx;
    }

    // (444:2) {#each input[0] as a, i (i)}
    function create_each_block_3$2(key_1, ctx) {
    	let a;
    	let t_value = /*a*/ ctx[36].info.value + "";
    	let t;
    	let a_class_value;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "class", a_class_value = "battle-input-" + /*a*/ ctx[36].info.prop + " " + (/*a*/ ctx[36].info.penetrate && 'penetrate') + " svelte-pm6iuh");
    			set_style(a, "left", 160 + r$1() * 150 + "px");
    			set_style(a, "top", r$1() * 60 + 40 + "px");
    			add_location(a, file$6, 444, 4, 12911);
    			this.first = a;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*input*/ 32 && t_value !== (t_value = /*a*/ ctx[36].info.value + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*input*/ 32 && a_class_value !== (a_class_value = "battle-input-" + /*a*/ ctx[36].info.prop + " " + (/*a*/ ctx[36].info.penetrate && 'penetrate') + " svelte-pm6iuh")) {
    				attr_dev(a, "class", a_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3$2.name,
    		type: "each",
    		source: "(444:2) {#each input[0] as a, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (452:6) {#each [...Array(state[0].power).keys()] as i}
    function create_each_block_2$2(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			set_style(div, "transform", "rotate(" + 180 / /*state*/ ctx[1][0].power * /*i*/ ctx[31] + "deg)");
    			attr_dev(div, "class", "svelte-pm6iuh");
    			add_location(div, file$6, 452, 8, 13198);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*state*/ 2) {
    				set_style(div, "transform", "rotate(" + 180 / /*state*/ ctx[1][0].power * /*i*/ ctx[31] + "deg)");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$2.name,
    		type: "each",
    		source: "(452:6) {#each [...Array(state[0].power).keys()] as i}",
    		ctx
    	});

    	return block;
    }

    // (479:6) {#each [...Array(28).keys()] as i}
    function create_each_block_1$3(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "style", /*i*/ ctx[31] % 4 == 3 && "height:15px");
    			attr_dev(div, "class", "svelte-pm6iuh");
    			add_location(div, file$6, 479, 8, 13956);
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
    		id: create_each_block_1$3.name,
    		type: "each",
    		source: "(479:6) {#each [...Array(28).keys()] as i}",
    		ctx
    	});

    	return block;
    }

    // (487:6) {#if Object.values(buff[0])[i] > 0}
    function create_if_block$5(ctx) {
    	let div;
    	let icon;
    	let icon_class_value;
    	let t0;
    	let show_if = Object.values(/*buff*/ ctx[0][0])[/*i*/ ctx[31]] > 1;
    	let t1;
    	let b = /*b*/ ctx[29];
    	let if_block = show_if && create_if_block_1$4(ctx);
    	const assign_div = () => /*div_binding*/ ctx[11](div, b);
    	const unassign_div = () => /*div_binding*/ ctx[11](null, b);

    	const block = {
    		c: function create() {
    			div = element("div");
    			icon = element("icon");
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();
    			attr_dev(icon, "class", icon_class_value = "icon-" + /*b*/ ctx[29] + " svelte-pm6iuh");
    			add_location(icon, file$6, 488, 10, 14244);
    			attr_dev(div, "class", "svelte-pm6iuh");
    			add_location(div, file$6, 487, 8, 14197);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, icon);
    			append_dev(div, t0);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t1);
    			assign_div();
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*buff*/ 1 && icon_class_value !== (icon_class_value = "icon-" + /*b*/ ctx[29] + " svelte-pm6iuh")) {
    				attr_dev(icon, "class", icon_class_value);
    			}

    			if (dirty[0] & /*buff*/ 1) show_if = Object.values(/*buff*/ ctx[0][0])[/*i*/ ctx[31]] > 1;

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$4(ctx);
    					if_block.c();
    					if_block.m(div, t1);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (b !== /*b*/ ctx[29]) {
    				unassign_div();
    				b = /*b*/ ctx[29];
    				assign_div();
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			unassign_div();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(487:6) {#if Object.values(buff[0])[i] > 0}",
    		ctx
    	});

    	return block;
    }

    // (490:10) {#if Object.values(buff[0])[i] > 1}
    function create_if_block_1$4(ctx) {
    	let txt;
    	let t_value = Object.values(/*buff*/ ctx[0][0])[/*i*/ ctx[31]] + "";
    	let t;

    	const block = {
    		c: function create() {
    			txt = element("txt");
    			t = text(t_value);
    			attr_dev(txt, "class", "svelte-pm6iuh");
    			add_location(txt, file$6, 490, 12, 14335);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, txt, anchor);
    			append_dev(txt, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*buff*/ 1 && t_value !== (t_value = Object.values(/*buff*/ ctx[0][0])[/*i*/ ctx[31]] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(txt);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(490:10) {#if Object.values(buff[0])[i] > 1}",
    		ctx
    	});

    	return block;
    }

    // (486:4) {#each Object.keys(buff[0]) as b, i (i)}
    function create_each_block$5(key_1, ctx) {
    	let first;
    	let show_if = Object.values(/*buff*/ ctx[0][0])[/*i*/ ctx[31]] > 0;
    	let if_block_anchor;
    	let if_block = show_if && create_if_block$5(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*buff*/ 1) show_if = Object.values(/*buff*/ ctx[0][0])[/*i*/ ctx[31]] > 0;

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(486:4) {#each Object.keys(buff[0]) as b, i (i)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div9;
    	let each_blocks_3 = [];
    	let each0_lookup = new Map();
    	let t0;
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t2;
    	let div4;
    	let img;
    	let img_src_value;
    	let t3;
    	let div3;
    	let txt0;
    	let t4_value = /*exPower*/ ctx[4][0] + "";
    	let t4;
    	let t5;
    	let div7;
    	let div5;
    	let txt1;
    	let t6_value = /*health*/ ctx[2][0].toFixed(0) + "";
    	let t6;
    	let t7;
    	let div6;
    	let t8;
    	let txt2;
    	let t9_value = /*state*/ ctx[1][0].health + "";
    	let t9;
    	let t10;
    	let div8;
    	let each_blocks = [];
    	let each3_lookup = new Map();
    	let each_value_3 = /*input*/ ctx[5][0];
    	validate_each_argument(each_value_3);
    	const get_key = ctx => /*i*/ ctx[31];
    	validate_each_keys(ctx, each_value_3, get_each_context_3$2, get_key);

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		let child_ctx = get_each_context_3$2(ctx, each_value_3, i);
    		let key = get_key(child_ctx);
    		each0_lookup.set(key, each_blocks_3[i] = create_each_block_3$2(key, child_ctx));
    	}

    	let each_value_2 = [...Array(/*state*/ ctx[1][0].power).keys()];
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2$2(get_each_context_2$2(ctx, each_value_2, i));
    	}

    	let each_value_1 = [...Array(28).keys()];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$3(get_each_context_1$3(ctx, each_value_1, i));
    	}

    	let each_value = Object.keys(/*buff*/ ctx[0][0]);
    	validate_each_argument(each_value);
    	const get_key_1 = ctx => /*i*/ ctx[31];
    	validate_each_keys(ctx, each_value, get_each_context$5, get_key_1);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$5(ctx, each_value, i);
    		let key = get_key_1(child_ctx);
    		each3_lookup.set(key, each_blocks[i] = create_each_block$5(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div9 = element("div");

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].c();
    			}

    			t0 = space();
    			div2 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t1 = space();
    			div1 = element("div");
    			t2 = space();
    			div4 = element("div");
    			img = element("img");
    			t3 = space();
    			div3 = element("div");
    			txt0 = element("txt");
    			t4 = text(t4_value);
    			t5 = space();
    			div7 = element("div");
    			div5 = element("div");
    			txt1 = element("txt");
    			t6 = text(t6_value);
    			t7 = space();
    			div6 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t8 = space();
    			txt2 = element("txt");
    			t9 = text(t9_value);
    			t10 = space();
    			div8 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "line svelte-pm6iuh");
    			add_location(div0, file$6, 450, 4, 13116);
    			attr_dev(div1, "class", "cursor svelte-pm6iuh");
    			set_style(div1, "transform", "rotate(" + (180 * /*power*/ ctx[3][0] / /*state*/ ctx[1][0].power - 90) + "deg)");
    			add_location(div1, file$6, 455, 4, 13300);
    			attr_dev(div2, "class", "power svelte-pm6iuh");
    			add_location(div2, file$6, 449, 2, 13091);
    			if (!src_url_equal(img.src, img_src_value = "/img/role/dairi/" + /*Data*/ ctx[8].role + ".webp")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-pm6iuh");
    			add_location(img, file$6, 461, 4, 13456);
    			attr_dev(txt0, "class", "svelte-pm6iuh");
    			add_location(txt0, file$6, 467, 6, 13651);
    			attr_dev(div3, "class", "exPower svelte-pm6iuh");
    			set_style(div3, "visibility", /*exPower*/ ctx[4][0] > 0 ? 'visible' : 'hidden');
    			add_location(div3, file$6, 462, 4, 13508);
    			attr_dev(div4, "class", "avatar svelte-pm6iuh");
    			add_location(div4, file$6, 460, 2, 13430);
    			attr_dev(txt1, "class", "svelte-pm6iuh");
    			add_location(txt1, file$6, 475, 6, 13834);
    			attr_dev(div5, "class", "pencil svelte-pm6iuh");
    			set_style(div5, "width", 120 + 150 * /*health*/ ctx[2][0] / /*state*/ ctx[1][0].health + "px");
    			add_location(div5, file$6, 471, 4, 13726);
    			attr_dev(txt2, "class", "svelte-pm6iuh");
    			add_location(txt2, file$6, 481, 6, 14026);
    			attr_dev(div6, "class", "ruler svelte-pm6iuh");
    			add_location(div6, file$6, 477, 4, 13885);
    			attr_dev(div7, "class", "health svelte-pm6iuh");
    			add_location(div7, file$6, 470, 2, 13700);
    			attr_dev(div8, "class", "buff svelte-pm6iuh");
    			add_location(div8, file$6, 484, 2, 14080);
    			attr_dev(div9, "class", "state svelte-pm6iuh");
    			add_location(div9, file$6, 442, 0, 12854);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div9, anchor);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				if (each_blocks_3[i]) {
    					each_blocks_3[i].m(div9, null);
    				}
    			}

    			append_dev(div9, t0);
    			append_dev(div9, div2);
    			append_dev(div2, div0);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				if (each_blocks_2[i]) {
    					each_blocks_2[i].m(div0, null);
    				}
    			}

    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div9, t2);
    			append_dev(div9, div4);
    			append_dev(div4, img);
    			append_dev(div4, t3);
    			append_dev(div4, div3);
    			append_dev(div3, txt0);
    			append_dev(txt0, t4);
    			/*div3_binding*/ ctx[10](div3);
    			append_dev(div9, t5);
    			append_dev(div9, div7);
    			append_dev(div7, div5);
    			append_dev(div5, txt1);
    			append_dev(txt1, t6);
    			append_dev(div7, t7);
    			append_dev(div7, div6);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(div6, null);
    				}
    			}

    			append_dev(div6, t8);
    			append_dev(div6, txt2);
    			append_dev(txt2, t9);
    			append_dev(div9, t10);
    			append_dev(div9, div8);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div8, null);
    				}
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*input*/ 32) {
    				each_value_3 = /*input*/ ctx[5][0];
    				validate_each_argument(each_value_3);
    				validate_each_keys(ctx, each_value_3, get_each_context_3$2, get_key);
    				each_blocks_3 = update_keyed_each(each_blocks_3, dirty, get_key, 1, ctx, each_value_3, each0_lookup, div9, destroy_block, create_each_block_3$2, t0, get_each_context_3$2);
    			}

    			if (dirty[0] & /*state*/ 2) {
    				each_value_2 = [...Array(/*state*/ ctx[1][0].power).keys()];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2$2(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_2$2(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_2.length;
    			}

    			if (dirty[0] & /*power, state*/ 10) {
    				set_style(div1, "transform", "rotate(" + (180 * /*power*/ ctx[3][0] / /*state*/ ctx[1][0].power - 90) + "deg)");
    			}

    			if (dirty[0] & /*exPower*/ 16 && t4_value !== (t4_value = /*exPower*/ ctx[4][0] + "")) set_data_dev(t4, t4_value);

    			if (dirty[0] & /*exPower*/ 16) {
    				set_style(div3, "visibility", /*exPower*/ ctx[4][0] > 0 ? 'visible' : 'hidden');
    			}

    			if (dirty[0] & /*health*/ 4 && t6_value !== (t6_value = /*health*/ ctx[2][0].toFixed(0) + "")) set_data_dev(t6, t6_value);

    			if (dirty[0] & /*health, state*/ 6) {
    				set_style(div5, "width", 120 + 150 * /*health*/ ctx[2][0] / /*state*/ ctx[1][0].health + "px");
    			}

    			if (dirty & /*Array*/ 0) {
    				each_value_1 = [...Array(28).keys()];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$3(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$3(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div6, t8);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty[0] & /*state*/ 2 && t9_value !== (t9_value = /*state*/ ctx[1][0].health + "")) set_data_dev(t9, t9_value);

    			if (dirty[0] & /*element_buff, buff*/ 129) {
    				each_value = Object.keys(/*buff*/ ctx[0][0]);
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$5, get_key_1);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key_1, 1, ctx, each_value, each3_lookup, div8, destroy_block, create_each_block$5, null, get_each_context$5);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div9);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].d();
    			}

    			destroy_each(each_blocks_2, detaching);
    			/*div3_binding*/ ctx[10](null);
    			destroy_each(each_blocks_1, detaching);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
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

    function r$1() {
    	return Math.random();
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $Explain;
    	let $Admin;
    	let $frameEvent;
    	let $data;
    	validate_store(Explain, 'Explain');
    	component_subscribe($$self, Explain, $$value => $$invalidate(12, $Explain = $$value));
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(13, $Admin = $$value));
    	validate_store(frameEvent, 'frameEvent');
    	component_subscribe($$self, frameEvent, $$value => $$invalidate(14, $frameEvent = $$value));
    	validate_store(data$1, 'data');
    	component_subscribe($$self, data$1, $$value => $$invalidate(15, $data = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('BattleState', slots, []);
    	const Data = deepCopy($data);
    	let buff = [{}, {}];
    	let state = [deepCopy(growth$1.role[Data.role]), {}];
    	let health = [Data.health, 50];
    	let power = [state[0].power, 0];
    	let exPower = [0, 0];
    	let input = [[], []];

    	const info_sector = {
    		exPowerLimit: Object.values(Data.card).sum()
    	};

    	let element_exPower;
    	const element_buff = deepCopy(buff$1);

    	const powerHandle = {
    		of(index) {
    			this.Target = index;
    			return this;
    		},
    		cost(cost) {
    			let left = power[this.Target] + exPower[this.Target] - cost;

    			$$invalidate(
    				4,
    				exPower[this.Target] = left <= power[this.Target]
    				? 0
    				: exPower[this.Target] - cost,
    				exPower
    			);

    			if (left <= power[this.Target]) $$invalidate(3, power[this.Target] = left, power);
    			return left;
    		},
    		reset(offset) {
    			if (!offset) offset = 0;
    			$$invalidate(3, power[this.Target] = Math.max(0, state[this.Target].power + offset, power[this.Target]), power);
    		},
    		add(n) {
    			let info = { amount: n };
    			sector.rolePowerAdd($Admin, info);
    			$$invalidate(4, exPower[this.Target] = Math.min(info_sector.exPowerLimit, exPower[this.Target] + info.amount), exPower);
    		},
    		get() {
    			return power[this.Target] + exPower[this.Target];
    		},
    		getExPower() {
    			return exPower[this.Target];
    		},
    		clear() {
    			$$invalidate(3, power[this.Target] = 0, power);
    			$$invalidate(4, exPower[this.Target] = 0, exPower);
    		}
    	};

    	const buffHandle = {
    		of(index) {
    			this.Target = index;
    			return this;
    		},
    		get(b) {
    			if (b in buff[this.Target]) {
    				let amount = buff[this.Target][b];

    				let info = {
    					amount,
    					buff: buff$1[b],
    					target: this.Target
    				};

    				sector.roleBuffGet($Admin, info);
    				return info.amount;
    			} else return false;
    		},
    		getAll() {
    			let res = {};

    			for (let b in buff[this.Target]) {
    				res[b] = buff$1[b];
    			}

    			return res;
    		},
    		set(b, n) {
    			battle.effect.targetRole(this.Target).by(
    				_ => {
    					$$invalidate(0, buff[this.Target][b] = n, buff);
    				},
    				10
    			);
    		},
    		clear(b, n) {
    			if (b in buff[this.Target]) {
    				battle.effect.targetRole(this.Target).by(
    					_ => {
    						if (n && buff[this.Target][b]) {
    							$$invalidate(0, buff[this.Target][b] -= n, buff);
    							buff[this.Target][b] <= 0 && delete buff[this.Target][b];
    						} else delete buff[this.Target][b];

    						$$invalidate(0, buff);
    					},
    					10
    				);
    			} else if (typeof b == "boolean") {
    				for (let i = 0; i < n; i++) {
    					let keys = Object.keys(buff[this.Target]).rd();
    					let positive = keys.filter(b => buff$1[b].positive);
    					let negative = keys.filter(b => !buff$1[b].positive);
    					this.clear(b ? positive[0] : negative[0], 1);
    				}
    			} else return false;

    			$$invalidate(0, buff);
    		},
    		clearAll(positive) {
    			battle.effect.targetRole(this.Target).by(
    				_ => {
    					if (positive === true) for (let b in buff[this.Target]) buff$1[b].positive && delete buff[this.Target][b]; else if (positive === false) for (let b in buff[this.Target]) !buff$1[b].positive && delete buff[this.Target][b]; else $$invalidate(0, buff[this.Target] = {}, buff);
    				},
    				10
    			);
    		},
    		link(k) {
    			this.Key = k;
    			return this;
    		},
    		to(f) {
    			if (this.Key in buff[this.Target]) {
    				let amount = buff[this.Target][this.Key];

    				let info = {
    					amount,
    					buff: buff$1[this.Key],
    					target: this.Target
    				};

    				sector.roleBuffGet($Admin, info);

    				if (buff$1[this.Key].expend) {
    					this.Key.decreaseOf(buff[this.Target]);
    					$$invalidate(0, buff);
    				}

    				info.amount > 0 && f(info.amount);
    			}
    		},
    		add(b, n) {
    			battle.effect.targetRole(this.Target).by(
    				_ => {
    					n = n ? n : 1;
    					if (b in buff[this.Target]) $$invalidate(0, buff[this.Target][b] += n, buff); else $$invalidate(0, buff[this.Target][b] = n, buff);
    				},
    				10,
    				b
    			);
    		},
    		count(positive) {
    			let positiveBuffCount = Object.keys(buff[this.Target]).filter(b => buff$1[b].positive).length;
    			if (positive) return positiveBuffCount; else return Object.keys(buff[this.Target]).length - positiveBuffCount;
    		}
    	};

    	const stateHandle = {
    		of(index) {
    			this.Target = index;
    			return this;
    		},
    		get() {
    			let s = deepCopy(state[this.Target]);
    			s.Health = health[this.Target];
    			let info = { state: s, target: this.Target };
    			sector.roleStateGet($Admin, info);
    			return s;
    		},
    		getAll() {
    			return state;
    		},
    		set(n, v) {
    			if (n == "Health") healthSet(v, this.Target); else $$invalidate(1, state[this.Target][n] = v, state);
    			if (n == "health") healthSet(Math.min(v, health[this.Target]), this.Target);
    			if (health[this.Target] < 0) battle.deadEvent();
    		}
    	};

    	const inputRender = {
    		add(info, index) {
    			$$invalidate(5, input[index] = [...input[index], { info, time: 50 }], input);
    		},
    		handle() {
    			input.forEach((i, index) => {
    				i.forEach(ii => {
    					if (ii.time > 0) ii.time--;
    				});
    			});
    		}
    	};

    	const damageHandle = {
    		except(index) {
    			this.Except = index;
    			return this;
    		},
    		target(index) {
    			this.Aim = "one";
    			this.Target = index;
    			return this;
    		},
    		targetAll() {
    			this.Aim = "all";
    			return this;
    		},
    		average() {
    			this.Aim = "average";
    			return this;
    		},
    		source(index) {
    			this.Source = index;
    			return this;
    		},
    		from(index) {
    			this.From = index;
    			return this;
    		},
    		random() {
    			this.Aim = "random";
    			return this;
    		},
    		by(Damage) {
    			let from = this.From;
    			this.From = false;

    			battle.effect.targetRole(this.Target).by(_ => {
    				if (Damage.type == "static") ;
    				if (Damage.type == "scale") Damage.value *= $Admin.enermy.state.of([from]).get().attack * 0.01;
    				let e = health.map((_, i) => i).filter(i => health[i] > 0);

    				let aim = {
    					one: [this.Target],
    					all: e.filter(i => i != this.Except),
    					average: e.filter(i => i != this.Except),
    					random: e.filter(i => i != this.Except).rd().splice(0, 1)
    				};

    				let targets = aim[this.Aim];
    				this.Except = -1;
    				const source = this.Source;
    				this.Source = false;

    				for (let i of targets) {
    					const damage = deepCopy(Damage);
    					damage.value /= this.Aim == "average" ? targets.length : 1;
    					let info_sector = { damage, target: i, source, from };
    					sector.roleDamagedProcess($Admin, info_sector);
    					if (!damage.amount) damage.amount = 1;

    					for (let a = 0; a < damage.amount; a++) {
    						let display;

    						if (damage.blocked) display = "已阻挡"; else if (damage.miss) display = "Miss"; else {
    							$$invalidate(2, health[i] -= damage.value, health);
    							if (health[i] < 0) battle.deadEvent();
    							display = retain(damage.value, 1);
    						}

    						inputRender.add(
    							{
    								value: display,
    								prop: "damage",
    								penetrate: info_sector.damage.penetrate
    							},
    							i
    						);
    					}
    				}
    			});
    		}
    	};

    	const healHandle = {
    		from(index) {
    			this.From = index;
    			return this;
    		},
    		target(index) {
    			this.Target = index;
    			return this;
    		},
    		by(heal) {
    			if (heal.type == "static") ;
    			let info = { heal, target: this.Target };
    			sector.roleHealProcess($Admin, info);
    			health[this.Target] - state[this.Target].health;
    			healthSet(health[this.Target] + heal.value, this.Target);

    			inputRender.add(
    				{
    					value: retain(heal.value, 1),
    					prop: "heal"
    				},
    				this.Target
    			);

    			return heal.value;
    		}
    	};

    	const collectionHandle = {
    		link(k) {
    			this.Key = k;
    			return this;
    		},
    		to(f) {
    			if (this.Key in Data.collection) f(Data.collection[this.Key]);
    			return this.Key in Data.collection;
    		}
    	};

    	const equipmentHandle = {
    		link(k) {
    			this.Key = k;
    			return this;
    		},
    		to(f) {
    			if (Data.equipment == this.Key) f();
    			return Data.equipment == this.Key;
    		}
    	};

    	const souvenirHandle = {
    		link(k) {
    			this.Key = k;
    			return this;
    		},
    		to(f) {
    			if (Data.souvenir == this.Key) f();
    			return Data.souvenir == this.Key;
    		}
    	};

    	const eventHandle = {
    		handle: {
    			defeat(damage, target) {
    				let info = { target, damage };

    				if ($Admin.enermy.state.getAll().filter(s => s.Health > 0).length > 0) {
    					sector.defeatEnermy($Admin, info);
    					$Admin.battle.winEvent(target);
    				}
    			},
    			failed(damage) {
    				
    			}
    		},
    		defeat(index) {
    			this.Type = "defeat";
    			this.Target = index;
    			return this;
    		},
    		failed() {
    			this.Type = "failed";
    			return this;
    		},
    		by(damage) {
    			this.handle[this.Type](damage, this.Target);
    		},
    		round: {
    			count: 0,
    			start() {
    				battle.effect.targetRole(0).by(_ => {
    					this.count++;

    					let info = {
    						powerReset: true,
    						handcardRefresh: true,
    						interimBuff: Object.keys(buff$1).filter(key => buff$1[key].interim && !buff$1[key].roundend),
    						decreaseBuff: Object.keys(buff$1).filter(key => buff$1[key].decrease && !buff$1[key].roundend),
    						offset: 0
    					};

    					sector.roleRoundStart($Admin, info);
    					info.decreaseBuff.forEach(b => role.buff.of(0).clear(b, 1));
    					info.interimBuff.forEach(b => role.buff.of(0).clear(b));
    					info.powerReset && role.power.of(0).reset(info.offset);
    					info.handcardRefresh && $Admin.handcard.refresh();
    					battle.round.set(true);
    					sector.afterRoleRoundStart($Admin, {});
    				});
    			},
    			end() {
    				let info = {
    					interimBuff: Object.keys(buff$1).filter(key => buff$1[key].interim && buff$1[key].roundend),
    					decreaseBuff: Object.keys(buff$1).filter(key => buff$1[key].decrease && buff$1[key].roundend)
    				};

    				sector.roleRoundEnd($Admin, info);
    				info.decreaseBuff.forEach(b => role.buff.of(0).clear(b, 1));
    				info.interimBuff.forEach(b => role.buff.of(0).clear(b));
    				battle.round.set(false);
    				$Admin.enermy.action();
    			}
    		}
    	};

    	const role = {
    		damage: damageHandle,
    		heal: healHandle,
    		state: stateHandle,
    		buff: buffHandle,
    		power: powerHandle,
    		collection: collectionHandle,
    		equipment: equipmentHandle,
    		souvenir: souvenirHandle,
    		event: eventHandle
    	};

    	set_store_value(Admin, $Admin.role = role, $Admin);
    	let { battle } = $$props;

    	onMount(_ => {
    		$Explain(element_exPower).with({
    			name: "额外灵力",
    			detail: "等同于灵力，优先消耗。\n上限等同于牌库总牌数。"
    		});

    		$frameEvent.add("roleInput", _ => inputRender.handle(), 1);
    		sector.roleOnload($Admin, info_sector);
    	});

    	beforeUpdate(_ => {
    		for (let b in element_buff) {
    			if (element_buff[b].e) $Explain(element_buff[b].e).color(buff$1[b].positive ? "blue" : "purple").with(element_buff[b]);
    		}
    	});

    	function healthSet(h, i) {
    		$$invalidate(2, health[i] = Math.min(h, state[i].health), health);
    	}

    	$$self.$$.on_mount.push(function () {
    		if (battle === undefined && !('battle' in $$props || $$self.$$.bound[$$self.$$.props['battle']])) {
    			console.warn("<BattleState> was created without expected prop 'battle'");
    		}
    	});

    	const writable_props = ['battle'];

    	Object_1$6.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<BattleState> was created with unknown prop '${key}'`);
    	});

    	function div3_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_exPower = $$value;
    			$$invalidate(6, element_exPower);
    		});
    	}

    	function div_binding($$value, b) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_buff[b].e = $$value;
    			$$invalidate(7, element_buff);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('battle' in $$props) $$invalidate(9, battle = $$props.battle);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		beforeUpdate,
    		data: data$1,
    		setting,
    		Explain,
    		Admin,
    		frameEvent,
    		growth: growth$1,
    		buffs: buff$1,
    		sector,
    		Data,
    		buff,
    		state,
    		health,
    		power,
    		exPower,
    		input,
    		info_sector,
    		element_exPower,
    		element_buff,
    		powerHandle,
    		buffHandle,
    		stateHandle,
    		inputRender,
    		damageHandle,
    		healHandle,
    		collectionHandle,
    		equipmentHandle,
    		souvenirHandle,
    		eventHandle,
    		role,
    		battle,
    		r: r$1,
    		healthSet,
    		$Explain,
    		$Admin,
    		$frameEvent,
    		$data
    	});

    	$$self.$inject_state = $$props => {
    		if ('buff' in $$props) $$invalidate(0, buff = $$props.buff);
    		if ('state' in $$props) $$invalidate(1, state = $$props.state);
    		if ('health' in $$props) $$invalidate(2, health = $$props.health);
    		if ('power' in $$props) $$invalidate(3, power = $$props.power);
    		if ('exPower' in $$props) $$invalidate(4, exPower = $$props.exPower);
    		if ('input' in $$props) $$invalidate(5, input = $$props.input);
    		if ('element_exPower' in $$props) $$invalidate(6, element_exPower = $$props.element_exPower);
    		if ('battle' in $$props) $$invalidate(9, battle = $$props.battle);
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
    		element_exPower,
    		element_buff,
    		Data,
    		battle,
    		div3_binding,
    		div_binding
    	];
    }

    class BattleState extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { battle: 9 }, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BattleState",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get battle() {
    		throw new Error("<BattleState>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set battle(value) {
    		throw new Error("<BattleState>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\page\battle.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1$5 } = globals;
    const file$5 = "src\\page\\battle.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[50] = list[i];
    	child_ctx[52] = i;
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[53] = list[i];
    	child_ctx[54] = list;
    	child_ctx[52] = i;
    	return child_ctx;
    }

    // (365:2) {#if "x" in cursor}
    function create_if_block_7$1(ctx) {
    	let div2;
    	let div0;
    	let t;
    	let div1;
    	let div2_outro;
    	let current;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t = space();
    			div1 = element("div");
    			attr_dev(div0, "class", "cursor-body svelte-1udp2xy");
    			add_location(div0, file$5, 372, 6, 11854);
    			attr_dev(div1, "class", "pointer svelte-1udp2xy");
    			add_location(div1, file$5, 373, 6, 11893);
    			attr_dev(div2, "class", "cursor svelte-1udp2xy");
    			set_style(div2, "left", /*cursor*/ ctx[6].x + "px");
    			set_style(div2, "top", /*cursor*/ ctx[6].y + "px");
    			set_style(div2, "transform", "rotate(" + /*cursor*/ ctx[6].r + "deg)");
    			set_style(div2, "height", /*cursor*/ ctx[6].l + "px");
    			set_style(div2, "--color", /*cursor*/ ctx[6].aim ? '#f00' : '#00f');
    			add_location(div2, file$5, 365, 4, 11617);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t);
    			append_dev(div2, div1);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*cursor*/ 64) {
    				set_style(div2, "left", /*cursor*/ ctx[6].x + "px");
    			}

    			if (!current || dirty[0] & /*cursor*/ 64) {
    				set_style(div2, "top", /*cursor*/ ctx[6].y + "px");
    			}

    			if (!current || dirty[0] & /*cursor*/ 64) {
    				set_style(div2, "transform", "rotate(" + /*cursor*/ ctx[6].r + "deg)");
    			}

    			if (!current || dirty[0] & /*cursor*/ 64) {
    				set_style(div2, "height", /*cursor*/ ctx[6].l + "px");
    			}

    			if (!current || dirty[0] & /*cursor*/ 64) {
    				set_style(div2, "--color", /*cursor*/ ctx[6].aim ? '#f00' : '#00f');
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (div2_outro) div2_outro.end(1);
    			current = true;
    		},
    		o: function outro(local) {
    			div2_outro = create_out_transition(div2, scale, { duration: 250 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching && div2_outro) div2_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7$1.name,
    		type: "if",
    		source: "(365:2) {#if \\\"x\\\" in cursor}",
    		ctx
    	});

    	return block;
    }

    // (428:6) {#if showConsumable}
    function create_if_block_5$2(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t0;
    	let txt;
    	let each_value_1 = Object.keys(/*Data*/ ctx[0].consumable);
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*i*/ ctx[52];
    	validate_each_keys(ctx, each_value_1, get_each_context_1$2, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1$2(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1$2(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			txt = element("txt");
    			txt.textContent = "长按使用";
    			attr_dev(div, "class", "consumable-list svelte-1udp2xy");
    			add_location(div, file$5, 428, 8, 13489);
    			attr_dev(txt, "class", "tip svelte-1udp2xy");
    			add_location(txt, file$5, 437, 8, 13829);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}

    			insert_dev(target, t0, anchor);
    			insert_dev(target, txt, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*Data, element_consumable*/ 513) {
    				each_value_1 = Object.keys(/*Data*/ ctx[0].consumable);
    				validate_each_argument(each_value_1);
    				validate_each_keys(ctx, each_value_1, get_each_context_1$2, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, div, destroy_block, create_each_block_1$2, null, get_each_context_1$2);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(txt);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$2.name,
    		type: "if",
    		source: "(428:6) {#if showConsumable}",
    		ctx
    	});

    	return block;
    }

    // (432:14) {#if Data.consumable[c] > 1}
    function create_if_block_6$2(ctx) {
    	let txt;
    	let t_value = /*Data*/ ctx[0].consumable[/*c*/ ctx[53]] + "";
    	let t;

    	const block = {
    		c: function create() {
    			txt = element("txt");
    			t = text(t_value);
    			attr_dev(txt, "class", "svelte-1udp2xy");
    			add_location(txt, file$5, 432, 16, 13711);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, txt, anchor);
    			append_dev(txt, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*Data*/ 1 && t_value !== (t_value = /*Data*/ ctx[0].consumable[/*c*/ ctx[53]] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(txt);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6$2.name,
    		type: "if",
    		source: "(432:14) {#if Data.consumable[c] > 1}",
    		ctx
    	});

    	return block;
    }

    // (430:10) {#each Object.keys(Data.consumable) as c, i (i)}
    function create_each_block_1$2(key_1, ctx) {
    	let icon;
    	let t;
    	let icon_class_value;
    	let i = /*i*/ ctx[52];
    	let if_block = /*Data*/ ctx[0].consumable[/*c*/ ctx[53]] > 1 && create_if_block_6$2(ctx);
    	const assign_icon = () => /*icon_binding*/ ctx[26](icon, i);
    	const unassign_icon = () => /*icon_binding*/ ctx[26](null, i);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			icon = element("icon");
    			if (if_block) if_block.c();
    			t = space();
    			attr_dev(icon, "class", icon_class_value = "icon-" + /*c*/ ctx[53] + " svelte-1udp2xy");
    			add_location(icon, file$5, 430, 12, 13592);
    			this.first = icon;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, icon, anchor);
    			if (if_block) if_block.m(icon, null);
    			append_dev(icon, t);
    			assign_icon();
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*Data*/ ctx[0].consumable[/*c*/ ctx[53]] > 1) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_6$2(ctx);
    					if_block.c();
    					if_block.m(icon, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty[0] & /*Data*/ 1 && icon_class_value !== (icon_class_value = "icon-" + /*c*/ ctx[53] + " svelte-1udp2xy")) {
    				attr_dev(icon, "class", icon_class_value);
    			}

    			if (i !== /*i*/ ctx[52]) {
    				unassign_icon();
    				i = /*i*/ ctx[52];
    				assign_icon();
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(icon);
    			if (if_block) if_block.d();
    			unassign_icon();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(430:10) {#each Object.keys(Data.consumable) as c, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (446:4) {#if result && result != "none"}
    function create_if_block_4$2(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "/img/role/" + /*$setting*/ ctx[16].resource + "/" + /*result*/ ctx[2] + "/" + /*Data*/ ctx[0].role + ".webp")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-1udp2xy");
    			add_location(img, file$5, 446, 6, 14048);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$setting, result, Data*/ 65541 && !src_url_equal(img.src, img_src_value = "/img/role/" + /*$setting*/ ctx[16].resource + "/" + /*result*/ ctx[2] + "/" + /*Data*/ ctx[0].role + ".webp")) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$2.name,
    		type: "if",
    		source: "(446:4) {#if result && result != \\\"none\\\"}",
    		ctx
    	});

    	return block;
    }

    // (450:6) {#if result && result != "none"}
    function create_if_block_3$2(ctx) {
    	let txt;
    	let t_value = (/*result*/ ctx[2] == "win" ? "胜利" : "满身疮痍") + "";
    	let t;

    	const block = {
    		c: function create() {
    			txt = element("txt");
    			t = text(t_value);
    			attr_dev(txt, "class", "title svelte-1udp2xy");
    			add_location(txt, file$5, 450, 8, 14211);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, txt, anchor);
    			append_dev(txt, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*result*/ 4 && t_value !== (t_value = (/*result*/ ctx[2] == "win" ? "胜利" : "满身疮痍") + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(txt);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$2.name,
    		type: "if",
    		source: "(450:6) {#if result && result != \\\"none\\\"}",
    		ctx
    	});

    	return block;
    }

    // (453:6) {#each rewards as r, i (i)}
    function create_each_block$4(key_1, ctx) {
    	let txt;
    	let t0;

    	let t1_value = (/*r*/ ctx[50] == "blue"
    	? "蓝色"
    	: /*r*/ ctx[50] == "green" ? "绿色" : "红色") + "";

    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	function click_handler_3(...args) {
    		return /*click_handler_3*/ ctx[29](/*r*/ ctx[50], /*i*/ ctx[52], ...args);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			txt = element("txt");
    			t0 = text("获得");
    			t1 = text(t1_value);
    			t2 = text("收藏品");
    			attr_dev(txt, "class", "skip svelte-1udp2xy");
    			add_location(txt, file$5, 453, 8, 14327);
    			this.first = txt;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, txt, anchor);
    			append_dev(txt, t0);
    			append_dev(txt, t1);
    			append_dev(txt, t2);

    			if (!mounted) {
    				dispose = listen_dev(txt, "click", click_handler_3, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*rewards*/ 1024 && t1_value !== (t1_value = (/*r*/ ctx[50] == "blue"
    			? "蓝色"
    			: /*r*/ ctx[50] == "green" ? "绿色" : "红色") + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(txt);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(453:6) {#each rewards as r, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (485:6) {:else}
    function create_else_block$1(ctx) {
    	let txt;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			txt = element("txt");
    			txt.textContent = "结算";
    			attr_dev(txt, "class", "skip svelte-1udp2xy");
    			add_location(txt, file$5, 485, 8, 15256);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, txt, anchor);

    			if (!mounted) {
    				dispose = listen_dev(txt, "click", /*click_handler_7*/ ctx[33], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(txt);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(485:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (465:6) {#if $data.chance.amount >= 0}
    function create_if_block$4(ctx) {
    	let t0;
    	let t1;
    	let txt;
    	let mounted;
    	let dispose;
    	let if_block0 = /*equipment_reward*/ ctx[12] && create_if_block_2$3(ctx);
    	let if_block1 = /*coin*/ ctx[11] != 0 && create_if_block_1$3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			txt = element("txt");
    			txt.textContent = "返回";
    			attr_dev(txt, "class", "skip svelte-1udp2xy");
    			add_location(txt, file$5, 483, 8, 15167);
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, txt, anchor);

    			if (!mounted) {
    				dispose = listen_dev(txt, "click", /*click_handler_6*/ ctx[32], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*equipment_reward*/ ctx[12]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2$3(ctx);
    					if_block0.c();
    					if_block0.m(t0.parentNode, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*coin*/ ctx[11] != 0) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1$3(ctx);
    					if_block1.c();
    					if_block1.m(t1.parentNode, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(txt);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(465:6) {#if $data.chance.amount >= 0}",
    		ctx
    	});

    	return block;
    }

    // (466:8) {#if equipment_reward}
    function create_if_block_2$3(ctx) {
    	let txt;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			txt = element("txt");
    			txt.textContent = "获得装备";
    			attr_dev(txt, "class", "skip svelte-1udp2xy");
    			add_location(txt, file$5, 466, 10, 14700);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, txt, anchor);

    			if (!mounted) {
    				dispose = listen_dev(txt, "click", /*click_handler_4*/ ctx[30], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(txt);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$3.name,
    		type: "if",
    		source: "(466:8) {#if equipment_reward}",
    		ctx
    	});

    	return block;
    }

    // (475:8) {#if coin != 0}
    function create_if_block_1$3(ctx) {
    	let txt;
    	let t0;
    	let t1;
    	let icon;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			txt = element("txt");
    			t0 = text("获得");
    			t1 = text(/*coin*/ ctx[11]);
    			icon = element("icon");
    			attr_dev(icon, "class", "icon-coin");
    			add_location(icon, file$5, 480, 23, 15093);
    			attr_dev(txt, "class", "skip svelte-1udp2xy");
    			add_location(txt, file$5, 475, 10, 14938);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, txt, anchor);
    			append_dev(txt, t0);
    			append_dev(txt, t1);
    			append_dev(txt, icon);

    			if (!mounted) {
    				dispose = listen_dev(txt, "click", /*click_handler_5*/ ctx[31], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*coin*/ 2048) set_data_dev(t1, /*coin*/ ctx[11]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(txt);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(475:8) {#if coin != 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div6;
    	let t0;
    	let div3;
    	let enermy_1;
    	let t1;
    	let handcard;
    	let t2;
    	let state;
    	let t3;
    	let div2;
    	let div0;
    	let icon0;
    	let icon0_class_value;
    	let t4;
    	let div1;
    	let icon1;
    	let t5;
    	let txt0;
    	let t6;
    	let br;
    	let t7;
    	let t8;
    	let txt1;
    	let t10;
    	let txt2;
    	let t11_value = /*actionRemark*/ ctx[13][/*remark*/ ctx[3]] + "";
    	let t11;
    	let t12;
    	let div2_class_value;
    	let div3_class_value;
    	let t13;
    	let div5;
    	let t14;
    	let div4;
    	let t15;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t16;
    	let div5_style_value;
    	let div6_class_value;
    	let div6_intro;
    	let div6_outro;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = "x" in /*cursor*/ ctx[6] && create_if_block_7$1(ctx);

    	enermy_1 = new BattleEnermy({
    			props: { battle: /*battle*/ ctx[18] },
    			$$inline: true
    		});

    	handcard = new BattleHandcard({
    			props: { battle: /*battle*/ ctx[18] },
    			$$inline: true
    		});

    	state = new BattleState({
    			props: { battle: /*battle*/ ctx[18] },
    			$$inline: true
    		});

    	let if_block1 = /*showConsumable*/ ctx[8] && create_if_block_5$2(ctx);
    	let if_block2 = /*result*/ ctx[2] && /*result*/ ctx[2] != "none" && create_if_block_4$2(ctx);
    	let if_block3 = /*result*/ ctx[2] && /*result*/ ctx[2] != "none" && create_if_block_3$2(ctx);
    	let each_value = /*rewards*/ ctx[10];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*i*/ ctx[52];
    	validate_each_keys(ctx, each_value, get_each_context$4, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$4(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$4(key, child_ctx));
    	}

    	function select_block_type(ctx, dirty) {
    		if (/*$data*/ ctx[15].chance.amount >= 0) return create_if_block$4;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block4 = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div3 = element("div");
    			create_component(enermy_1.$$.fragment);
    			t1 = space();
    			create_component(handcard.$$.fragment);
    			t2 = space();
    			create_component(state.$$.fragment);
    			t3 = space();
    			div2 = element("div");
    			div0 = element("div");
    			icon0 = element("icon");
    			t4 = space();
    			div1 = element("div");
    			icon1 = element("icon");
    			t5 = space();
    			txt0 = element("txt");
    			t6 = text("结束");
    			br = element("br");
    			t7 = text("回合");
    			t8 = space();
    			txt1 = element("txt");
    			txt1.textContent = "x";
    			t10 = space();
    			txt2 = element("txt");
    			t11 = text(t11_value);
    			t12 = space();
    			if (if_block1) if_block1.c();
    			t13 = space();
    			div5 = element("div");
    			if (if_block2) if_block2.c();
    			t14 = space();
    			div4 = element("div");
    			if (if_block3) if_block3.c();
    			t15 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t16 = space();
    			if_block4.c();

    			attr_dev(icon0, "class", icon0_class_value = "icon-" + (/*Data*/ ctx[0].equipment
    			? /*Data*/ ctx[0].equipment
    			: 'empty') + " svelte-1udp2xy");

    			add_location(icon0, file$5, 402, 8, 12647);
    			attr_dev(div0, "class", "equipment svelte-1udp2xy");
    			add_location(div0, file$5, 398, 6, 12558);
    			attr_dev(icon1, "class", "icon-consumables svelte-1udp2xy");
    			add_location(icon1, file$5, 411, 8, 12943);
    			attr_dev(div1, "class", "consumables svelte-1udp2xy");
    			add_location(div1, file$5, 404, 6, 12739);
    			add_location(br, file$5, 416, 55, 13156);
    			attr_dev(txt0, "class", "roundEnd svelte-1udp2xy");
    			add_location(txt0, file$5, 413, 6, 13003);
    			attr_dev(txt1, "class", "hideconsumable svelte-1udp2xy");
    			add_location(txt1, file$5, 418, 6, 13186);
    			attr_dev(txt2, "class", "remark svelte-1udp2xy");
    			add_location(txt2, file$5, 426, 6, 13403);
    			attr_dev(div2, "class", div2_class_value = "action " + (/*round*/ ctx[1] ? 'in' : 'out') + "Round " + (/*showRemark*/ ctx[7] && 'showRemark') + " " + (/*showConsumable*/ ctx[8] && 'showConsumable') + " svelte-1udp2xy");
    			add_location(div2, file$5, 380, 4, 12056);
    			attr_dev(div3, "class", div3_class_value = "battle " + /*result*/ ctx[2] + " svelte-1udp2xy");
    			add_location(div3, file$5, 376, 2, 11945);
    			set_style(div4, "width", "180px");
    			attr_dev(div4, "class", "svelte-1udp2xy");
    			add_location(div4, file$5, 448, 4, 14134);
    			attr_dev(div5, "class", "barrier body svelte-1udp2xy");
    			attr_dev(div5, "style", div5_style_value = "z-index:" + (/*result*/ ctx[2] ? 6 : -1) + ";" + (/*result*/ ctx[2] && 'visibility:visible'));
    			add_location(div5, file$5, 441, 2, 13895);
    			attr_dev(div6, "class", div6_class_value = "body " + /*result*/ ctx[2] + " svelte-1udp2xy");
    			set_style(div6, "background-image", "url('/img/scene/" + /*Data*/ ctx[0].scene + ".webp')");
    			add_location(div6, file$5, 357, 0, 11406);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			if (if_block0) if_block0.m(div6, null);
    			append_dev(div6, t0);
    			append_dev(div6, div3);
    			mount_component(enermy_1, div3, null);
    			append_dev(div3, t1);
    			mount_component(handcard, div3, null);
    			append_dev(div3, t2);
    			mount_component(state, div3, null);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, icon0);
    			/*div0_binding*/ ctx[19](div0);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, icon1);
    			append_dev(div2, t5);
    			append_dev(div2, txt0);
    			append_dev(txt0, t6);
    			append_dev(txt0, br);
    			append_dev(txt0, t7);
    			append_dev(div2, t8);
    			append_dev(div2, txt1);
    			append_dev(div2, t10);
    			append_dev(div2, txt2);
    			append_dev(txt2, t11);
    			append_dev(div2, t12);
    			if (if_block1) if_block1.m(div2, null);
    			append_dev(div6, t13);
    			append_dev(div6, div5);
    			if (if_block2) if_block2.m(div5, null);
    			append_dev(div5, t14);
    			append_dev(div5, div4);
    			if (if_block3) if_block3.m(div4, null);
    			append_dev(div4, t15);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div4, null);
    				}
    			}

    			append_dev(div4, t16);
    			if_block4.m(div4, null);
    			/*div6_binding*/ ctx[34](div6);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div1, "mouseenter", /*mouseenter_handler*/ ctx[20], false, false, false, false),
    					listen_dev(div1, "click", /*click_handler*/ ctx[21], false, false, false, false),
    					listen_dev(txt0, "click", /*click_handler_1*/ ctx[22], false, false, false, false),
    					listen_dev(txt0, "mouseenter", /*mouseenter_handler_1*/ ctx[23], false, false, false, false),
    					listen_dev(txt1, "mouseenter", /*mouseenter_handler_2*/ ctx[24], false, false, false, false),
    					listen_dev(txt1, "click", /*click_handler_2*/ ctx[25], false, false, false, false),
    					listen_dev(div2, "mouseover", /*mouseover_handler*/ ctx[27], false, false, false, false),
    					listen_dev(div2, "mouseout", /*mouseout_handler*/ ctx[28], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if ("x" in /*cursor*/ ctx[6]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*cursor*/ 64) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_7$1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div6, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*Data*/ 1 && icon0_class_value !== (icon0_class_value = "icon-" + (/*Data*/ ctx[0].equipment
    			? /*Data*/ ctx[0].equipment
    			: 'empty') + " svelte-1udp2xy")) {
    				attr_dev(icon0, "class", icon0_class_value);
    			}

    			if ((!current || dirty[0] & /*actionRemark, remark*/ 8200) && t11_value !== (t11_value = /*actionRemark*/ ctx[13][/*remark*/ ctx[3]] + "")) set_data_dev(t11, t11_value);

    			if (/*showConsumable*/ ctx[8]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_5$2(ctx);
    					if_block1.c();
    					if_block1.m(div2, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (!current || dirty[0] & /*round, showRemark, showConsumable*/ 386 && div2_class_value !== (div2_class_value = "action " + (/*round*/ ctx[1] ? 'in' : 'out') + "Round " + (/*showRemark*/ ctx[7] && 'showRemark') + " " + (/*showConsumable*/ ctx[8] && 'showConsumable') + " svelte-1udp2xy")) {
    				attr_dev(div2, "class", div2_class_value);
    			}

    			if (!current || dirty[0] & /*result*/ 4 && div3_class_value !== (div3_class_value = "battle " + /*result*/ ctx[2] + " svelte-1udp2xy")) {
    				attr_dev(div3, "class", div3_class_value);
    			}

    			if (/*result*/ ctx[2] && /*result*/ ctx[2] != "none") {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_4$2(ctx);
    					if_block2.c();
    					if_block2.m(div5, t14);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*result*/ ctx[2] && /*result*/ ctx[2] != "none") {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block_3$2(ctx);
    					if_block3.c();
    					if_block3.m(div4, t15);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (dirty[0] & /*$Admin, rewards*/ 17408) {
    				each_value = /*rewards*/ ctx[10];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$4, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div4, destroy_block, create_each_block$4, t16, get_each_context$4);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block4) {
    				if_block4.p(ctx, dirty);
    			} else {
    				if_block4.d(1);
    				if_block4 = current_block_type(ctx);

    				if (if_block4) {
    					if_block4.c();
    					if_block4.m(div4, null);
    				}
    			}

    			if (!current || dirty[0] & /*result*/ 4 && div5_style_value !== (div5_style_value = "z-index:" + (/*result*/ ctx[2] ? 6 : -1) + ";" + (/*result*/ ctx[2] && 'visibility:visible'))) {
    				attr_dev(div5, "style", div5_style_value);
    			}

    			if (!current || dirty[0] & /*result*/ 4 && div6_class_value !== (div6_class_value = "body " + /*result*/ ctx[2] + " svelte-1udp2xy")) {
    				attr_dev(div6, "class", div6_class_value);
    			}

    			if (!current || dirty[0] & /*Data*/ 1) {
    				set_style(div6, "background-image", "url('/img/scene/" + /*Data*/ ctx[0].scene + ".webp')");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(enermy_1.$$.fragment, local);
    			transition_in(handcard.$$.fragment, local);
    			transition_in(state.$$.fragment, local);

    			add_render_callback(() => {
    				if (!current) return;
    				if (div6_outro) div6_outro.end(1);
    				div6_intro = create_in_transition(div6, fade, { duration: 250 });
    				div6_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(enermy_1.$$.fragment, local);
    			transition_out(handcard.$$.fragment, local);
    			transition_out(state.$$.fragment, local);
    			if (div6_intro) div6_intro.invalidate();
    			div6_outro = create_out_transition(div6, fade, { duration: 250 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			if (if_block0) if_block0.d();
    			destroy_component(enermy_1);
    			destroy_component(handcard);
    			destroy_component(state);
    			/*div0_binding*/ ctx[19](null);
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if_block4.d();
    			/*div6_binding*/ ctx[34](null);
    			if (detaching && div6_outro) div6_outro.end();
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
    	let $Admin;
    	let $explore;
    	let $data;
    	let $cache;
    	let $Explain;
    	let $frameEvent;
    	let $setting;
    	let $page;
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(14, $Admin = $$value));
    	validate_store(explore, 'explore');
    	component_subscribe($$self, explore, $$value => $$invalidate(37, $explore = $$value));
    	validate_store(data$1, 'data');
    	component_subscribe($$self, data$1, $$value => $$invalidate(15, $data = $$value));
    	validate_store(cache, 'cache');
    	component_subscribe($$self, cache, $$value => $$invalidate(38, $cache = $$value));
    	validate_store(Explain, 'Explain');
    	component_subscribe($$self, Explain, $$value => $$invalidate(39, $Explain = $$value));
    	validate_store(frameEvent, 'frameEvent');
    	component_subscribe($$self, frameEvent, $$value => $$invalidate(40, $frameEvent = $$value));
    	validate_store(setting, 'setting');
    	component_subscribe($$self, setting, $$value => $$invalidate(16, $setting = $$value));
    	validate_store(page, 'page');
    	component_subscribe($$self, page, $$value => $$invalidate(17, $page = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Battle', slots, []);
    	const Data = $data;
    	set_store_value(Admin, $Admin.cache = $cache, $Admin);
    	set_store_value(Admin, $Admin.probability = probabilityHandle, $Admin);
    	let round = true;
    	let result;
    	let equipmentLeft = 1;
    	let remark = "null";
    	let element;
    	let element_equipment;
    	let cursor = {};
    	let showRemark = false;
    	let showConsumable = false;
    	let element_consumable = [];
    	let rewards = [];
    	let coin = 0;
    	let end = false;
    	let equipment_reward = false;
    	set_store_value(Admin, $Admin.data = $data, $Admin);

    	const battleWorker = {
    		task: {
    			role: {
    				list: [],
    				handle: e => e.content($Admin, e.target),
    				state: false
    			},
    			enermy: {
    				list: [],
    				handle: e => e.content($Admin, e.target),
    				state: false
    			}
    		},
    		handle() {
    			for (let type in this.task) {
    				if (this.task[type].list.length > 0) {
    					if (!this.task[type].state) {
    						this.task[type].handle(this.task[type].list.shift());
    						this.task[type].state = true;
    					} else {
    						if (this.task[type].list[0].time == 1) this.task[type].handle(this.task[type].list.shift()); else this.task[type].list[0].time--;
    					}
    				} else this.task[type].state = false;
    			}
    		}
    	};

    	const effectHandle = {
    		targetRole(index) {
    			this.Type = "role";
    			this.Target = index;
    			return this;
    		},
    		targetEnermy(index) {
    			this.Type = "enermy";
    			this.Target = index;
    			return this;
    		},
    		by(e, t) {
    			battleWorker.task[this.Type].list.push({
    				content: e,
    				target: this.Target,
    				time: t ? t : 20
    			});
    		},
    		listLengthOf: type => battleWorker.task[type].list.length
    	};

    	const equipmentHandle = {
    		use() {
    			equipment$1[Data.equipment].handle($Admin, this.Target);
    			equipmentLeft--;
    			sector.useEquipment($Admin);
    			$$invalidate(13, actionRemark.equipment = equipmentHandle.explain(), actionRemark);
    		},
    		left: {
    			get: _ => equipmentLeft,
    			add(v) {
    				equipmentLeft += v;
    			}
    		},
    		explain: _ => {
    			let detail;
    			if (!Data.equipment) detail = "还没有装备。"; else if (equipment$1[Data.equipment].passive) detail = "这是被动装备。"; else detail = `剩余可使用次数：${equipmentLeft}`;
    			return detail;
    		},
    		target(index) {
    			this.Target = index;
    			return this;
    		},
    		aim: _ => {
    			if (Object.keys(cursor).length > 0) return "aim" in equipment$1[$Admin.data.equipment];
    		},
    		aimming() {
    			if (!Data.equipment) msg({ content: "你还没有装备" }); else if (equipmentLeft < 1) msg({ content: "次数用完了" }); else if (!round) ; else if (equipment$1[Data.equipment].passive) msg({ content: "你这是被动装备" }); else if (element.style.cursor == "none") ; else {
    				let from = deepCopy(element_equipment.getBoundingClientRect());
    				from.x = (from.left + from.right) / 2;
    				from.y = (from.top + from.bottom) / 2;
    				$$invalidate(4, element.style.cursor = "none", element);

    				let moveEvent = e => {
    					$$invalidate(7, showRemark = true);
    					$$invalidate(3, remark = "equipment");
    					let res = $Admin.enermy.checkForPosition(e);

    					let mid = {
    						x: (e.x + from.x) / 2,
    						y: (e.y + from.y) / 2
    					};

    					let deg = Math.atan((from.y - e.y) / (from.x - e.x));
    					$$invalidate(6, cursor.r = deg / Math.PI * 180 - 90, cursor);
    					if (e.x > from.x) $$invalidate(6, cursor.r += 180, cursor);
    					$$invalidate(6, cursor.l = Math.sqrt(Math.pow(e.x - from.x, 2) + Math.pow(e.y - from.y, 2)) + 60, cursor);
    					$$invalidate(6, cursor.x = mid.x, cursor);
    					$$invalidate(6, cursor.y = mid.y - cursor.l / 2, cursor);
    					$$invalidate(6, cursor.aim = typeof res == "number", cursor);
    				};

    				$$invalidate(4, element.onmousemove = moveEvent, element);

    				setTimeout(_ => {
    					$$invalidate(
    						4,
    						element.onclick = () => {
    							$Admin.enermy.equipmentAim();
    							$$invalidate(4, element.onmousemove = null, element);
    							$$invalidate(4, element.onclick = null, element);
    							$$invalidate(4, element.style.cursor = "unset", element);
    							$$invalidate(6, cursor = {});
    							$$invalidate(7, showRemark = false);
    							$$invalidate(3, remark = "null");
    						},
    						element
    					);
    				});
    			}
    		}
    	};

    	const actionRemark = {
    		equipment: equipmentHandle.explain(),
    		consumable: "使用携带的消耗品。",
    		roundEnd: "没招了，轮到敌人了。",
    		close: "不看了。",
    		null: ""
    	};

    	const statisticsHandle = {
    		round_items: [
    			"round_punch_count",
    			"round_damage_frequency",
    			"round_expend_count",
    			"round_damage_total",
    			"round_max_damage",
    			"round_max_hurt",
    			"round_hurt_total",
    			"round_hurt_frequency",
    			"round_cost_total"
    		],
    		roundData: [],
    		resetRoundData() {
    			this.round_items.forEach(i => set_store_value(Admin, $Admin.cache[i] = 0, $Admin));
    		},
    		saveRoundData() {
    			let res = {};
    			this.round_items.forEach(i => res[i] = $Admin.cache[i]);
    			this.roundData.push(res);
    		},
    		countTotal() {
    			let res = {};

    			this.round_items.forEach(i => {
    				let key = i.split("_");
    				key[0] = "battle";
    				res[key.join("_")] = this.roundData.map(d => d[i]).sum();
    			});

    			res.battle_max_damage = Math.max(...this.roundData.map(d => d.round_max_damage));
    			res.battle_max_hurt = Math.max(...this.roundData.map(d => d.round_max_hurt));
    			return res;
    		}
    	};

    	const battle = {
    		round: {
    			get() {
    				return round;
    			},
    			set(v) {
    				$$invalidate(1, round = v);
    			}
    		},
    		winEvent,
    		deadEvent,
    		result: _ => result,
    		effect: effectHandle,
    		equipment: equipmentHandle,
    		runOutAway
    	};

    	set_store_value(Admin, $Admin.battle = battle, $Admin);
    	set_store_value(Admin, $Admin.effect = effectHandle, $Admin);
    	set_store_value(Admin, $Admin.statistics = statisticsHandle, $Admin);

    	onMount(_ => {
    		sector.battleOnload($Admin);
    		setTimeout(_ => $Admin.role.event.round.start());
    		$frameEvent.add("battleWorker", _ => battleWorker.handle(), 1);
    		$$invalidate(5, element_equipment.onmouseenter = _ => $$invalidate(3, remark = "equipment"), element_equipment);
    		$$invalidate(5, element_equipment.onclick = battle.equipment.aimming, element_equipment);
    	});

    	beforeUpdate(_ => {
    		$$invalidate(13, actionRemark.equipment = equipmentHandle.explain(), actionRemark);
    		if ($Admin.role) $$invalidate(13, actionRemark.roundEnd = `现在是第${$Admin.role.event.round.count}回合。`, actionRemark);

    		element_consumable.forEach((e, i) => {
    			if (e) $Explain(e).with(consumable$1[Object.keys(Data.consumable)[i]]);
    		});

    		element_consumable.forEach((e, i) => {
    			const key = Object.keys(Data.consumable)[i];

    			if (e) e.onmousedown = _ => {
    				let _class = e.className;
    				e.className = `${e.className} using`;

    				let timer = setTimeout(
    					_ => {
    						msg({ content: `使用了[${consumable$1[key].name}]` });
    						if (Data.consumable[key] == 1) delete Data.consumable[key]; else $$invalidate(0, Data.consumable[key]--, Data);
    						$$invalidate(0, Data);
    						cancel();
    					},
    					1200
    				);

    				let cancel = _ => {
    					clearTimeout(timer);
    					e.className = _class;
    				};

    				e.onmouseup = cancel;
    				e.onmouseout = cancel;
    			};
    		});
    	});

    	function probabilityHandle(r) {
    		let info = { probability: r };
    		sector.probability($Admin, info);
    		let R = Math.random();
    		return R < info.probability;
    	}

    	function runOutAway(who) {
    		if (who === true) {
    			msg({ content: "逃跑成功" });
    		} else {
    			$Admin.enermy.state.of(who).set("health", -1);
    			$Admin.enermy.state.of(who).set("Health", -25565);
    			msg({ content: "有人逃跑了！" });
    		}

    		let outAmount = $Admin.enermy.state.getAll().map(state => state.health).filter(h => h < 0).length;

    		if ($Admin.enermy.survival().length == outAmount || who === true) {
    			end = true;
    			$$invalidate(2, result = "none");
    			set_store_value(data$1, $data.health = Math.ceil($Admin.role.state.get().Health), $data);
    			set_store_value(explore, $explore.lv++, $explore);
    			set_store_value(cache, $cache = {}, $cache);
    			let enermys = $explore.enermy.filter((_, i) => $explore.target[i]);
    			let survival = $Admin.enermy.survival();
    			let out = enermys.map((_, i) => i).filter(i => !survival.includes(i));
    			set_store_value(explore, $explore.enermy = $explore.enermy.filter((_, i) => !out.includes(i)), $explore);
    			$explore.target.set(false);
    			let kills = enermys.filter((_, i) => !survival.includes(i));

    			kills.forEach(e => {
    				$$invalidate(10, rewards = [...rewards, enermy$1[e].color]);
    			});

    			$$invalidate(11, coin = 10 * rewards.length * (4 + rewards.length));
    			statistics({ battle_defeat_total: kills.length });
    		}
    	}

    	function winEvent(index) {
    		if (end) return;

    		if ($Admin.enermy.survival().length == 0) {
    			end = true;
    			set_store_value(data$1, $data.health = Math.ceil($Admin.role.state.get().Health), $data);
    			set_store_value(explore, $explore.lv++, $explore);
    			set_store_value(cache, $cache = {}, $cache);
    			let enermys = $explore.enermy.filter((_, i) => $explore.target[i]);

    			enermys.forEach(e => {
    				$$invalidate(10, rewards = [...rewards, enermy$1[e].color]);
    			});

    			statistics({ battle_defeat_total: enermys.length });
    			$$invalidate(11, coin = 10 * rewards.length * (4 + rewards.length));
    			set_store_value(explore, $explore.enermy = $explore.enermy.filter((_, i) => !$explore.target[i]), $explore);
    			let isFinalBoss = !$explore.enermy.map(e => enermy$1[e].type).includes("boss");

    			if (rewards.includes("red") && isFinalBoss) {
    				$Admin.event.stageClear();
    				if ($Admin.data.stage == 1) $$invalidate(12, equipment_reward = true);
    			}

    			$explore.target.set(false);

    			setTimeout(
    				_ => {
    					$$invalidate(2, result = "win");
    				},
    				1200
    			);
    		}
    	}

    	function deadEvent(k) {
    		if (end) return;
    		end = true;
    		set_store_value(cache, $cache = {}, $cache);
    		$$invalidate(2, result = "dead");
    		set_store_value(data$1, $data.chance.amount--, $data);

    		if ($data.chance.amount >= 0) {
    			$$invalidate(10, rewards = [...rewards, $data.chance.type]);
    			set_store_value(data$1, $data.health = growth$1.role[$data.role].health, $data);
    		}

    		let enermys = $explore.enermy.filter((_, i) => $explore.target[i]);
    		let survival = $Admin.enermy.survival();
    		let out = enermys.map((_, i) => i).filter(i => !survival.includes(i));
    		set_store_value(explore, $explore.enermy = $explore.enermy.filter((_, i) => !out.includes(i)), $explore);
    		let kills = enermys.filter((_, i) => !survival.includes(i));

    		kills.forEach(e => {
    			$$invalidate(10, rewards = [...rewards, enermy$1[e].color]);
    		});

    		statistics({ battle_defeat_total: kills.length });
    		$explore.target.set(false);
    	}

    	function statistics(info) {
    		$Admin.statistics.saveRoundData();
    		const battle_data = $Admin.statistics.countTotal();
    		battle_data["battle_round_total"] = $Admin.role.event.round.count;
    		battle_data["battle_defeat_total"] = info["battle_defeat_total"];
    		$Admin.data.statistics.push(battle_data);
    	}

    	const writable_props = [];

    	Object_1$5.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Battle> was created with unknown prop '${key}'`);
    	});

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_equipment = $$value;
    			$$invalidate(5, element_equipment);
    		});
    	}

    	const mouseenter_handler = _ => $$invalidate(3, remark = "consumable");

    	const click_handler = _ => {
    		if (round) $$invalidate(8, showConsumable = !showConsumable);
    	};

    	const click_handler_1 = _ => round && $Admin.role.event.round.end();
    	const mouseenter_handler_1 = _ => $$invalidate(3, remark = "roundEnd");
    	const mouseenter_handler_2 = _ => $$invalidate(3, remark = "close");

    	const click_handler_2 = _ => {
    		$$invalidate(8, showConsumable = false);
    		$$invalidate(7, showRemark = false);
    	};

    	function icon_binding($$value, i) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_consumable[i] = $$value;
    			$$invalidate(9, element_consumable);
    		});
    	}

    	const mouseover_handler = _ => {
    		$$invalidate(7, showRemark = true);

    		if (showConsumable) {
    			$$invalidate(3, remark = "consumable");
    		} else $$invalidate(3, remark = "null");
    	};

    	const mouseout_handler = _ => {
    		if (showConsumable) {
    			$$invalidate(3, remark = "consumable");
    		} else {
    			$$invalidate(7, showRemark = false);
    			$$invalidate(3, remark = "null");
    		}
    	};

    	const click_handler_3 = (r, i, _) => {
    		$Admin.event.getCollection(r);
    		rewards.splice(i, 1);
    		$$invalidate(10, rewards);
    	};

    	const click_handler_4 = _ => {
    		$Admin.event.getEquipment();
    		$$invalidate(12, equipment_reward = false);
    	};

    	const click_handler_5 = _ => {
    		$Admin.event.getCoin(coin);
    		$$invalidate(11, coin = 0);
    	};

    	const click_handler_6 = _ => set_store_value(page, $page = "Explore", $page);

    	const click_handler_7 = _ => {
    		set_store_value(page, $page = "Epilog", $page);
    	};

    	function div6_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element = $$value;
    			$$invalidate(4, element);
    		});
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		beforeUpdate,
    		fade,
    		scale,
    		data: data$1,
    		cache,
    		setting,
    		page,
    		explore,
    		frameEvent,
    		Admin,
    		Explain,
    		Handcard: BattleHandcard,
    		Enermy: BattleEnermy,
    		State: BattleState,
    		equipment: equipment$1,
    		consumable: consumable$1,
    		growth: growth$1,
    		sector,
    		enermy: enermy$1,
    		Data,
    		round,
    		result,
    		equipmentLeft,
    		remark,
    		element,
    		element_equipment,
    		cursor,
    		showRemark,
    		showConsumable,
    		element_consumable,
    		rewards,
    		coin,
    		end,
    		equipment_reward,
    		battleWorker,
    		effectHandle,
    		equipmentHandle,
    		actionRemark,
    		statisticsHandle,
    		battle,
    		probabilityHandle,
    		runOutAway,
    		winEvent,
    		deadEvent,
    		statistics,
    		$Admin,
    		$explore,
    		$data,
    		$cache,
    		$Explain,
    		$frameEvent,
    		$setting,
    		$page
    	});

    	$$self.$inject_state = $$props => {
    		if ('round' in $$props) $$invalidate(1, round = $$props.round);
    		if ('result' in $$props) $$invalidate(2, result = $$props.result);
    		if ('equipmentLeft' in $$props) equipmentLeft = $$props.equipmentLeft;
    		if ('remark' in $$props) $$invalidate(3, remark = $$props.remark);
    		if ('element' in $$props) $$invalidate(4, element = $$props.element);
    		if ('element_equipment' in $$props) $$invalidate(5, element_equipment = $$props.element_equipment);
    		if ('cursor' in $$props) $$invalidate(6, cursor = $$props.cursor);
    		if ('showRemark' in $$props) $$invalidate(7, showRemark = $$props.showRemark);
    		if ('showConsumable' in $$props) $$invalidate(8, showConsumable = $$props.showConsumable);
    		if ('element_consumable' in $$props) $$invalidate(9, element_consumable = $$props.element_consumable);
    		if ('rewards' in $$props) $$invalidate(10, rewards = $$props.rewards);
    		if ('coin' in $$props) $$invalidate(11, coin = $$props.coin);
    		if ('end' in $$props) end = $$props.end;
    		if ('equipment_reward' in $$props) $$invalidate(12, equipment_reward = $$props.equipment_reward);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		Data,
    		round,
    		result,
    		remark,
    		element,
    		element_equipment,
    		cursor,
    		showRemark,
    		showConsumable,
    		element_consumable,
    		rewards,
    		coin,
    		equipment_reward,
    		actionRemark,
    		$Admin,
    		$data,
    		$setting,
    		$page,
    		battle,
    		div0_binding,
    		mouseenter_handler,
    		click_handler,
    		click_handler_1,
    		mouseenter_handler_1,
    		mouseenter_handler_2,
    		click_handler_2,
    		icon_binding,
    		mouseover_handler,
    		mouseout_handler,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		div6_binding
    	];
    }

    class Battle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Battle",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

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
    	cursed_wind_chimes: "“不是刮着风吗，这风铃怎么不会响。”\n“被诅咒了。或者成精了。”\n“也就是说，要做点驱魔仪式什么的吗？”\n“不，要是哪一天突然跑出来一个付丧神，我就不用自己打扫神社了。”\n“真懒呀。”\n“你家可比我这糟蹋多了。”\n“啰嗦。”",
    	ghost_lantern: "敬请期待",
    	vampires_old_tooth: "前端略尖的牙齿。\n“她小时候换牙换下来的旧牙，我一直收藏着。”\n“能感觉到残存的强大力量，或许能作为大魔法的媒介。”\n“真的？”\n“假的。”",
    	large_roll_of_bandages: "“这、这个尺寸，你究竟是谁？”\n“裹胸用的绷带被某个仙人顺走了啦。”\n“呀，还有这种事。”\n“还有人顺走过扫帚呢。”\n“诶嘿嘿。”",
    	burning_seashore_flower: "“又在这偷懒？”\n“这株彼岸花，由于强大的意念在燃烧着，燃不尽。”\n“要是会引起麻烦就早点退治掉好了。”\n“你不会懂的，正是这份意念传达不出去，才会如此强大。”\n“所以？”\n“请您也不要将我偷懒的事说出去！”",
    	skyrocket: "“在偷拍吗！”\n“啊呀呀，吓我一跳。毕竟巫女难得要出门了嘛，你呢？”\n“我拿到了一个好玩的火箭烟花，来吓一吓她。”\n向着巫女，窜天猴“嗖——”地飞出去。\n飞进了神社的赛钱箱里。",
    	magic_dart: "“这个是未完成品，可以用魔力进行导向的飞镖。”\n“听起来很有意思，便宜卖我呗。”\n“都说了是未完成——小心！”\n“呀，戳我屁股上了。”\n“没受伤吧？”\n“当然没有。”",
    	fox_jade: "敬请期待",
    	cherry: "敬请期待",
    	earthy_spider_wine: "敬请期待",
    	amulet_of_full_moon: "敬请期待",
    	seal_needle: "“真巧啊。”\n“……嗯，很巧呢。”\n“我想委托你给封魔针加些新功能。”\n“然后呢？然后你就要用新的封魔针退治我了吗？”\n“当然不。”\n“真的？”\n“我的赛钱箱被炸了个洞，我先退治完你再去找你。”",
    	crown_of_thorns: "敬请期待",
    	red_and_white_scarf: "敬请期待",
    	bottle_of_stars: "“天上的星星非常亮呢，地上的什么东西，经过了自我燃烧，也可以变成星星的吧。”\n“地上的星星，不装进瓶子里的话迟早会燃尽的。”\n“哈，那不如就放任它去绽放，哪怕只有一瞬间，或许会比天上的星星还亮哦。”",
    	normal_stone: "敬请期待",
    	blade_of_yellow_spring: "敬请期待",
    	blood_book: "敬请期待",
    	human_soul_lamp: "敬请期待",
    	patchoulis_ribbon: "敬请期待",
    	fish_stone: "敬请期待",
    	crypto_cloak: "敬请期待",
    	shy_rabbit: "敬请期待",
    	dimensional_pocket: "敬请期待",
    	terrible_ring: "敬请期待"
    };
    var souvenir = {
    	nodas_hat: "献给挚爱的「你」的「REALLUTION」",
    	aokis_fish: "回首向来萧瑟处，归去，也无风雨也无晴。",
    	ahabs_opinion: "爱丽丝的汗脚不应该甘之如饴吗？",
    	mimicry_cat_pendant: "Great ideals but through selfless struggle and sacrifice to achieve.",
    	wanderlust: "未经他人苦，勿劝他人善？你若经我苦，未必有我善！",
    	cerallins_bottle: "Roses are red. I'm going to bed."
    };
    var equipment = {
    	gongonier: "敬请期待",
    	sword_of_feixiang: "敬请期待",
    	sunshade: "敬请期待",
    	mirror_of_pear: "敬请期待",
    	mini_bagua_stove: "敬请期待",
    	louguanjian: "敬请期待",
    	hd_camera: "敬请期待",
    	repentance_rod: "敬请期待",
    	circular_fan: "敬请期待",
    	devil_tied_scroll: "敬请期待"
    };
    var consumable = {
    	doubtful_potion: "敬请期待",
    	heart_fire_of_grace: "敬请期待",
    	gift_from_ergen: "敬请期待",
    	good_corn: "敬请期待",
    	banana: "敬请期待"
    };
    var buff = {
    };
    var story = {
    	collection: collection,
    	souvenir: souvenir,
    	equipment: equipment,
    	consumable: consumable,
    	buff: buff
    };

    /* src\page\afflatus.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1$4 } = globals;
    const file$4 = "src\\page\\afflatus.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[33] = list[i];
    	child_ctx[35] = i;
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[36] = list[i];
    	child_ctx[35] = i;
    	return child_ctx;
    }

    function get_each_context_2$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[38] = list[i];
    	child_ctx[39] = list;
    	child_ctx[35] = i;
    	return child_ctx;
    }

    function get_each_context_3$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[36] = list[i];
    	child_ctx[40] = list;
    	child_ctx[35] = i;
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[36] = list[i];
    	child_ctx[41] = list;
    	child_ctx[35] = i;
    	return child_ctx;
    }

    function get_each_context_5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[36] = list[i];
    	child_ctx[42] = list;
    	child_ctx[35] = i;
    	return child_ctx;
    }

    function get_each_context_6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[43] = list[i];
    	child_ctx[44] = list;
    	child_ctx[35] = i;
    	return child_ctx;
    }

    // (113:4) {#if index == "collection"}
    function create_if_block_6$1(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let div_intro;
    	let div_outro;
    	let current;
    	let each_value_6 = Object.keys(collection$2);
    	validate_each_argument(each_value_6);
    	const get_key = ctx => /*i*/ ctx[35];
    	validate_each_keys(ctx, each_value_6, get_each_context_6, get_key);

    	for (let i = 0; i < each_value_6.length; i += 1) {
    		let child_ctx = get_each_context_6(ctx, each_value_6, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_6(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "collections container list svelte-1hd5mfv");
    			add_location(div, file$4, 113, 6, 3581);
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
    			if (dirty[0] & /*selected, element_collection*/ 10) {
    				each_value_6 = Object.keys(collection$2);
    				validate_each_argument(each_value_6);
    				validate_each_keys(ctx, each_value_6, get_each_context_6, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_6, each_1_lookup, div, destroy_block, create_each_block_6, null, get_each_context_6);
    			}
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

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6$1.name,
    		type: "if",
    		source: "(113:4) {#if index == \\\"collection\\\"}",
    		ctx
    	});

    	return block;
    }

    // (119:8) {#each Object.keys(collection) as c, i (i)}
    function create_each_block_6(key_1, ctx) {
    	let div;
    	let icon;
    	let t;
    	let div_class_value;
    	let i = /*i*/ ctx[35];
    	let mounted;
    	let dispose;

    	function click_handler_6(...args) {
    		return /*click_handler_6*/ ctx[18](/*c*/ ctx[43], ...args);
    	}

    	const assign_div = () => /*div_binding*/ ctx[19](div, i);
    	const unassign_div = () => /*div_binding*/ ctx[19](null, i);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			icon = element("icon");
    			t = space();
    			attr_dev(icon, "class", "icon-" + /*c*/ ctx[43] + " svelte-1hd5mfv");
    			add_location(icon, file$4, 125, 12, 4018);
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(/*selected*/ ctx[1] == /*c*/ ctx[43] && "selected") + " svelte-1hd5mfv"));
    			set_style(div, "background-color", "var(--" + collection$2[/*c*/ ctx[43]].type + ")");
    			add_location(div, file$4, 119, 10, 3778);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, icon);
    			append_dev(div, t);
    			assign_div();

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler_6, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*selected*/ 2 && div_class_value !== (div_class_value = "" + (null_to_empty(/*selected*/ ctx[1] == /*c*/ ctx[43] && "selected") + " svelte-1hd5mfv"))) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (i !== /*i*/ ctx[35]) {
    				unassign_div();
    				i = /*i*/ ctx[35];
    				assign_div();
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			unassign_div();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_6.name,
    		type: "each",
    		source: "(119:8) {#each Object.keys(collection) as c, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (131:4) {#if index == "souvenir"}
    function create_if_block_5$1(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let div_intro;
    	let div_outro;
    	let current;
    	let each_value_5 = Object.keys(souvenir$1);
    	validate_each_argument(each_value_5);
    	const get_key = ctx => /*i*/ ctx[35];
    	validate_each_keys(ctx, each_value_5, get_each_context_5, get_key);

    	for (let i = 0; i < each_value_5.length; i += 1) {
    		let child_ctx = get_each_context_5(ctx, each_value_5, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_5(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "souvenirs container list svelte-1hd5mfv");
    			add_location(div, file$4, 131, 6, 4147);
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
    			if (dirty[0] & /*selected, element_souvenir*/ 34) {
    				each_value_5 = Object.keys(souvenir$1);
    				validate_each_argument(each_value_5);
    				validate_each_keys(ctx, each_value_5, get_each_context_5, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_5, each_1_lookup, div, destroy_block, create_each_block_5, null, get_each_context_5);
    			}
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

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$1.name,
    		type: "if",
    		source: "(131:4) {#if index == \\\"souvenir\\\"}",
    		ctx
    	});

    	return block;
    }

    // (137:8) {#each Object.keys(souvenir) as s, i (i)}
    function create_each_block_5(key_1, ctx) {
    	let div;
    	let icon;
    	let t;
    	let div_class_value;
    	let i = /*i*/ ctx[35];
    	let mounted;
    	let dispose;

    	function click_handler_7(...args) {
    		return /*click_handler_7*/ ctx[20](/*s*/ ctx[36], ...args);
    	}

    	const assign_div = () => /*div_binding_1*/ ctx[21](div, i);
    	const unassign_div = () => /*div_binding_1*/ ctx[21](null, i);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			icon = element("icon");
    			t = space();
    			attr_dev(icon, "class", "icon-" + /*s*/ ctx[36] + " svelte-1hd5mfv");
    			add_location(icon, file$4, 143, 12, 4564);
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(/*selected*/ ctx[1] == /*s*/ ctx[36] && "selected") + " svelte-1hd5mfv"));
    			set_style(div, "background-color", "var(--purple)");
    			add_location(div, file$4, 137, 10, 4340);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, icon);
    			append_dev(div, t);
    			assign_div();

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler_7, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*selected*/ 2 && div_class_value !== (div_class_value = "" + (null_to_empty(/*selected*/ ctx[1] == /*s*/ ctx[36] && "selected") + " svelte-1hd5mfv"))) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (i !== /*i*/ ctx[35]) {
    				unassign_div();
    				i = /*i*/ ctx[35];
    				assign_div();
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			unassign_div();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_5.name,
    		type: "each",
    		source: "(137:8) {#each Object.keys(souvenir) as s, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (149:4) {#if index == "equipment"}
    function create_if_block_4$1(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let div_intro;
    	let div_outro;
    	let current;
    	let each_value_4 = Object.keys(equipment$1);
    	validate_each_argument(each_value_4);
    	const get_key = ctx => /*i*/ ctx[35];
    	validate_each_keys(ctx, each_value_4, get_each_context_4, get_key);

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		let child_ctx = get_each_context_4(ctx, each_value_4, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_4(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "equipments container list svelte-1hd5mfv");
    			add_location(div, file$4, 149, 6, 4694);
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
    			if (dirty[0] & /*selected, element_equipment*/ 18) {
    				each_value_4 = Object.keys(equipment$1);
    				validate_each_argument(each_value_4);
    				validate_each_keys(ctx, each_value_4, get_each_context_4, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_4, each_1_lookup, div, destroy_block, create_each_block_4, null, get_each_context_4);
    			}
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

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(149:4) {#if index == \\\"equipment\\\"}",
    		ctx
    	});

    	return block;
    }

    // (155:8) {#each Object.keys(equipment) as s, i (i)}
    function create_each_block_4(key_1, ctx) {
    	let div;
    	let icon;
    	let t;
    	let div_class_value;
    	let i = /*i*/ ctx[35];
    	let mounted;
    	let dispose;

    	function click_handler_8(...args) {
    		return /*click_handler_8*/ ctx[22](/*s*/ ctx[36], ...args);
    	}

    	const assign_div = () => /*div_binding_2*/ ctx[23](div, i);
    	const unassign_div = () => /*div_binding_2*/ ctx[23](null, i);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			icon = element("icon");
    			t = space();
    			attr_dev(icon, "class", "icon-" + /*s*/ ctx[36] + " svelte-1hd5mfv");
    			add_location(icon, file$4, 161, 12, 5112);
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(/*selected*/ ctx[1] == /*s*/ ctx[36] && "selected") + " svelte-1hd5mfv"));
    			set_style(div, "background-color", "var(--gold)");
    			add_location(div, file$4, 155, 10, 4889);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, icon);
    			append_dev(div, t);
    			assign_div();

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler_8, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*selected*/ 2 && div_class_value !== (div_class_value = "" + (null_to_empty(/*selected*/ ctx[1] == /*s*/ ctx[36] && "selected") + " svelte-1hd5mfv"))) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (i !== /*i*/ ctx[35]) {
    				unassign_div();
    				i = /*i*/ ctx[35];
    				assign_div();
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			unassign_div();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(155:8) {#each Object.keys(equipment) as s, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (167:4) {#if index == "consumable"}
    function create_if_block_3$1(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let div_intro;
    	let div_outro;
    	let current;
    	let each_value_3 = Object.keys(consumable$1);
    	validate_each_argument(each_value_3);
    	const get_key = ctx => /*i*/ ctx[35];
    	validate_each_keys(ctx, each_value_3, get_each_context_3$1, get_key);

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		let child_ctx = get_each_context_3$1(ctx, each_value_3, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_3$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "consumables container list svelte-1hd5mfv");
    			add_location(div, file$4, 167, 6, 5243);
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
    			if (dirty[0] & /*selected, element_consumable*/ 66) {
    				each_value_3 = Object.keys(consumable$1);
    				validate_each_argument(each_value_3);
    				validate_each_keys(ctx, each_value_3, get_each_context_3$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_3, each_1_lookup, div, destroy_block, create_each_block_3$1, null, get_each_context_3$1);
    			}
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

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(167:4) {#if index == \\\"consumable\\\"}",
    		ctx
    	});

    	return block;
    }

    // (173:8) {#each Object.keys(consumable) as s, i (i)}
    function create_each_block_3$1(key_1, ctx) {
    	let div;
    	let icon;
    	let t;
    	let div_class_value;
    	let i = /*i*/ ctx[35];
    	let mounted;
    	let dispose;

    	function click_handler_9(...args) {
    		return /*click_handler_9*/ ctx[24](/*s*/ ctx[36], ...args);
    	}

    	const assign_div = () => /*div_binding_3*/ ctx[25](div, i);
    	const unassign_div = () => /*div_binding_3*/ ctx[25](null, i);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			icon = element("icon");
    			t = space();
    			attr_dev(icon, "class", "icon-" + /*s*/ ctx[36] + " svelte-1hd5mfv");
    			add_location(icon, file$4, 179, 12, 5664);
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(/*selected*/ ctx[1] == /*s*/ ctx[36] && "selected") + " svelte-1hd5mfv"));
    			set_style(div, "background-color", "var(--blue)");
    			add_location(div, file$4, 173, 10, 5440);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, icon);
    			append_dev(div, t);
    			assign_div();

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler_9, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*selected*/ 2 && div_class_value !== (div_class_value = "" + (null_to_empty(/*selected*/ ctx[1] == /*s*/ ctx[36] && "selected") + " svelte-1hd5mfv"))) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (i !== /*i*/ ctx[35]) {
    				unassign_div();
    				i = /*i*/ ctx[35];
    				assign_div();
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			unassign_div();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3$1.name,
    		type: "each",
    		source: "(173:8) {#each Object.keys(consumable) as s, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (185:4) {#if index == "role"}
    function create_if_block_2$2(ctx) {
    	let div9;
    	let div0;
    	let each_blocks_1 = [];
    	let each0_lookup = new Map();
    	let t0;
    	let div5;
    	let div1;
    	let img;
    	let img_src_value;
    	let t1;
    	let div2;
    	let t2_value = role[/*selected_role*/ ctx[2]].name + "";
    	let t2;
    	let t3;
    	let div3;
    	let txt0;
    	let t4;
    	let t5_value = growth$1.role[/*selected_role*/ ctx[2]].health + "";
    	let t5;
    	let t6;
    	let txt1;
    	let t7;
    	let t8_value = growth$1.role[/*selected_role*/ ctx[2]].power + "";
    	let t8;
    	let t9;
    	let txt2;
    	let t10;
    	let t11_value = growth$1.role[/*selected_role*/ ctx[2]].speed + "";
    	let t11;
    	let t12;
    	let txt3;
    	let t14;
    	let div4;
    	let t15_value = role[/*selected_role*/ ctx[2]].talent + "";
    	let t15;
    	let t16;
    	let div8;
    	let txt4;
    	let t17;
    	let t18_value = Object.keys(spellcard$1).filter(/*func*/ ctx[27]).length + "";
    	let t18;
    	let t19;
    	let t20;
    	let div7;
    	let div6;
    	let each_blocks = [];
    	let each1_lookup = new Map();
    	let div9_intro;
    	let div9_outro;
    	let current;
    	let each_value_2 = Object.keys(role);
    	validate_each_argument(each_value_2);
    	const get_key = ctx => /*i*/ ctx[35];
    	validate_each_keys(ctx, each_value_2, get_each_context_2$1, get_key);

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		let child_ctx = get_each_context_2$1(ctx, each_value_2, i);
    		let key = get_key(child_ctx);
    		each0_lookup.set(key, each_blocks_1[i] = create_each_block_2$1(key, child_ctx));
    	}

    	let each_value_1 = Object.keys(spellcard$1).filter(/*func_1*/ ctx[28]);
    	validate_each_argument(each_value_1);
    	const get_key_1 = ctx => /*i*/ ctx[35];
    	validate_each_keys(ctx, each_value_1, get_each_context_1$1, get_key_1);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1$1(ctx, each_value_1, i);
    		let key = get_key_1(child_ctx);
    		each1_lookup.set(key, each_blocks[i] = create_each_block_1$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div9 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t0 = space();
    			div5 = element("div");
    			div1 = element("div");
    			img = element("img");
    			t1 = space();
    			div2 = element("div");
    			t2 = text(t2_value);
    			t3 = space();
    			div3 = element("div");
    			txt0 = element("txt");
    			t4 = text("生命上限: ");
    			t5 = text(t5_value);
    			t6 = space();
    			txt1 = element("txt");
    			t7 = text("灵力上限: ");
    			t8 = text(t8_value);
    			t9 = space();
    			txt2 = element("txt");
    			t10 = text("基础速度: ");
    			t11 = text(t11_value);
    			t12 = space();
    			txt3 = element("txt");
    			txt3.textContent = "天赋";
    			t14 = space();
    			div4 = element("div");
    			t15 = text(t15_value);
    			t16 = space();
    			div8 = element("div");
    			txt4 = element("txt");
    			t17 = text("符卡 (38/");
    			t18 = text(t18_value);
    			t19 = text(")");
    			t20 = space();
    			div7 = element("div");
    			div6 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "role_list svelte-1hd5mfv");
    			add_location(div0, file$4, 190, 8, 5909);
    			if (!src_url_equal(img.src, img_src_value = "/img/role/dairi/" + /*selected_role*/ ctx[2] + ".webp")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-1hd5mfv");
    			add_location(img, file$4, 201, 12, 6283);
    			attr_dev(div1, "class", "photo svelte-1hd5mfv");
    			add_location(div1, file$4, 200, 10, 6250);
    			attr_dev(div2, "class", "name svelte-1hd5mfv");
    			add_location(div2, file$4, 203, 10, 6363);
    			add_location(txt0, file$4, 205, 12, 6458);
    			add_location(txt1, file$4, 206, 12, 6529);
    			add_location(txt2, file$4, 207, 12, 6599);
    			attr_dev(div3, "class", "state svelte-1hd5mfv");
    			add_location(div3, file$4, 204, 10, 6425);
    			attr_dev(txt3, "class", "title svelte-1hd5mfv");
    			add_location(txt3, file$4, 209, 10, 6685);
    			attr_dev(div4, "class", "talent svelte-1hd5mfv");
    			add_location(div4, file$4, 210, 10, 6724);
    			attr_dev(div5, "class", "left svelte-1hd5mfv");
    			add_location(div5, file$4, 199, 8, 6220);
    			attr_dev(txt4, "class", "title svelte-1hd5mfv");
    			add_location(txt4, file$4, 213, 10, 6835);
    			attr_dev(div6, "class", "svelte-1hd5mfv");
    			add_location(div6, file$4, 219, 12, 7105);
    			attr_dev(div7, "class", "spellcard container svelte-1hd5mfv");
    			add_location(div7, file$4, 218, 10, 7018);
    			attr_dev(div8, "class", "right svelte-1hd5mfv");
    			add_location(div8, file$4, 212, 8, 6804);
    			attr_dev(div9, "class", "role svelte-1hd5mfv");
    			add_location(div9, file$4, 185, 6, 5789);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(div0, null);
    				}
    			}

    			append_dev(div9, t0);
    			append_dev(div9, div5);
    			append_dev(div5, div1);
    			append_dev(div1, img);
    			append_dev(div5, t1);
    			append_dev(div5, div2);
    			append_dev(div2, t2);
    			append_dev(div5, t3);
    			append_dev(div5, div3);
    			append_dev(div3, txt0);
    			append_dev(txt0, t4);
    			append_dev(txt0, t5);
    			append_dev(div3, t6);
    			append_dev(div3, txt1);
    			append_dev(txt1, t7);
    			append_dev(txt1, t8);
    			append_dev(div3, t9);
    			append_dev(div3, txt2);
    			append_dev(txt2, t10);
    			append_dev(txt2, t11);
    			append_dev(div5, t12);
    			append_dev(div5, txt3);
    			append_dev(div5, t14);
    			append_dev(div5, div4);
    			append_dev(div4, t15);
    			append_dev(div9, t16);
    			append_dev(div9, div8);
    			append_dev(div8, txt4);
    			append_dev(txt4, t17);
    			append_dev(txt4, t18);
    			append_dev(txt4, t19);
    			append_dev(div8, t20);
    			append_dev(div8, div7);
    			append_dev(div7, div6);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div6, null);
    				}
    			}

    			/*div7_binding*/ ctx[29](div7);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$archive, element_role*/ 640) {
    				each_value_2 = Object.keys(role);
    				validate_each_argument(each_value_2);
    				validate_each_keys(ctx, each_value_2, get_each_context_2$1, get_key);
    				each_blocks_1 = update_keyed_each(each_blocks_1, dirty, get_key, 1, ctx, each_value_2, each0_lookup, div0, destroy_block, create_each_block_2$1, null, get_each_context_2$1);
    			}

    			if (!current || dirty[0] & /*selected_role*/ 4 && !src_url_equal(img.src, img_src_value = "/img/role/dairi/" + /*selected_role*/ ctx[2] + ".webp")) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if ((!current || dirty[0] & /*selected_role*/ 4) && t2_value !== (t2_value = role[/*selected_role*/ ctx[2]].name + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty[0] & /*selected_role*/ 4) && t5_value !== (t5_value = growth$1.role[/*selected_role*/ ctx[2]].health + "")) set_data_dev(t5, t5_value);
    			if ((!current || dirty[0] & /*selected_role*/ 4) && t8_value !== (t8_value = growth$1.role[/*selected_role*/ ctx[2]].power + "")) set_data_dev(t8, t8_value);
    			if ((!current || dirty[0] & /*selected_role*/ 4) && t11_value !== (t11_value = growth$1.role[/*selected_role*/ ctx[2]].speed + "")) set_data_dev(t11, t11_value);
    			if ((!current || dirty[0] & /*selected_role*/ 4) && t15_value !== (t15_value = role[/*selected_role*/ ctx[2]].talent + "")) set_data_dev(t15, t15_value);
    			if ((!current || dirty[0] & /*selected_role*/ 4) && t18_value !== (t18_value = Object.keys(spellcard$1).filter(/*func*/ ctx[27]).length + "")) set_data_dev(t18, t18_value);

    			if (dirty[0] & /*selected_role*/ 4) {
    				each_value_1 = Object.keys(spellcard$1).filter(/*func_1*/ ctx[28]);
    				validate_each_argument(each_value_1);
    				group_outros();
    				validate_each_keys(ctx, each_value_1, get_each_context_1$1, get_key_1);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key_1, 1, ctx, each_value_1, each1_lookup, div6, outro_and_destroy_block, create_each_block_1$1, null, get_each_context_1$1);
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
    				if (div9_outro) div9_outro.end(1);
    				div9_intro = create_in_transition(div9, fade, { duration: 200 });
    				div9_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			if (div9_intro) div9_intro.invalidate();
    			div9_outro = create_out_transition(div9, fade, { duration: 200 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div9);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].d();
    			}

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			/*div7_binding*/ ctx[29](null);
    			if (detaching && div9_outro) div9_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(185:4) {#if index == \\\"role\\\"}",
    		ctx
    	});

    	return block;
    }

    // (192:10) {#each Object.keys(role) as r, i (i)}
    function create_each_block_2$1(key_1, ctx) {
    	let img;
    	let img_src_value;
    	let img_class_value;
    	let i = /*i*/ ctx[35];
    	const assign_img = () => /*img_binding*/ ctx[26](img, i);
    	const unassign_img = () => /*img_binding*/ ctx[26](null, i);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "/img/role/dairi/" + /*r*/ ctx[38] + ".webp")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", img_class_value = "" + (null_to_empty(!/*$archive*/ ctx[9].unlocked.role.includes(/*r*/ ctx[38]) && "locked") + " svelte-1hd5mfv"));
    			add_location(img, file$4, 192, 12, 5995);
    			this.first = img;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    			assign_img();
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*$archive*/ 512 && img_class_value !== (img_class_value = "" + (null_to_empty(!/*$archive*/ ctx[9].unlocked.role.includes(/*r*/ ctx[38]) && "locked") + " svelte-1hd5mfv"))) {
    				attr_dev(img, "class", img_class_value);
    			}

    			if (i !== /*i*/ ctx[35]) {
    				unassign_img();
    				i = /*i*/ ctx[35];
    				assign_img();
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			unassign_img();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$1.name,
    		type: "each",
    		source: "(192:10) {#each Object.keys(role) as r, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (221:14) {#each Object.keys(spellcard).filter((s) => spellcard[s].role == selected_role) as s, i (i)}
    function create_each_block_1$1(key_1, ctx) {
    	let first;
    	let card;
    	let current;

    	card = new Card({
    			props: { key: /*s*/ ctx[36] },
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(card.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const card_changes = {};
    			if (dirty[0] & /*selected_role*/ 4) card_changes.key = /*s*/ ctx[36];
    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(221:14) {#each Object.keys(spellcard).filter((s) => spellcard[s].role == selected_role) as s, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (229:4) {#if index == "basecard"}
    function create_if_block_1$2(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let each_value = Object.keys(basecard);
    	validate_each_argument(each_value);
    	const get_key = ctx => /*i*/ ctx[35];
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

    			attr_dev(div, "class", "basecard container svelte-1hd5mfv");
    			add_location(div, file$4, 229, 6, 7393);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}

    			/*div_binding_4*/ ctx[30](div);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*Object, basecard*/ 0) {
    				each_value = Object.keys(basecard);
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$3, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block$3, null, get_each_context$3);
    				check_outros();
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

    			/*div_binding_4*/ ctx[30](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(229:4) {#if index == \\\"basecard\\\"}",
    		ctx
    	});

    	return block;
    }

    // (231:8) {#each Object.keys(basecard) as b, i (i)}
    function create_each_block$3(key_1, ctx) {
    	let div;
    	let card;
    	let current;

    	card = new Card({
    			props: { key: /*b*/ ctx[33], action: func_2 },
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			create_component(card.$$.fragment);
    			attr_dev(div, "class", "svelte-1hd5mfv");
    			add_location(div, file$4, 231, 10, 7527);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(card, div, null);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(card);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(231:8) {#each Object.keys(basecard) as b, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (236:4) {#if selected}
    function create_if_block$3(ctx) {
    	let div7;
    	let div0;
    	let t0;
    	let div6;
    	let div1;
    	let span0;
    	let t2;
    	let span1;
    	let t3;
    	let span2;
    	let b0;
    	let t4;
    	let b1;
    	let t5;
    	let b2;
    	let t6;
    	let b3;
    	let t7;
    	let div4;
    	let div3;
    	let div2;
    	let icon;
    	let icon_class_value;
    	let t8;
    	let txt0;
    	let t9_value = /*info*/ ctx[10][/*index*/ ctx[0]][/*selected*/ ctx[1]].name + "";
    	let t9;
    	let t10;
    	let txt1;
    	let t11_value = /*info*/ ctx[10][/*index*/ ctx[0]][/*selected*/ ctx[1]].detail + "";
    	let t11;
    	let t12;
    	let txt2;
    	let t13_value = story[/*index*/ ctx[0]][/*selected*/ ctx[1]] + "";
    	let t13;
    	let t14;
    	let div5;
    	let li0;
    	let a0;
    	let i0;
    	let t16;
    	let li1;
    	let a1;
    	let i1;
    	let t17;
    	let li2;
    	let a2;
    	let i2;
    	let div7_intro;
    	let div7_outro;
    	let current;

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div6 = element("div");
    			div1 = element("div");
    			span0 = element("span");
    			span0.textContent = "11:39";
    			t2 = space();
    			span1 = element("span");
    			t3 = space();
    			span2 = element("span");
    			b0 = element("b");
    			t4 = space();
    			b1 = element("b");
    			t5 = space();
    			b2 = element("b");
    			t6 = space();
    			b3 = element("b");
    			t7 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			icon = element("icon");
    			t8 = space();
    			txt0 = element("txt");
    			t9 = text(t9_value);
    			t10 = space();
    			txt1 = element("txt");
    			t11 = text(t11_value);
    			t12 = space();
    			txt2 = element("txt");
    			t13 = text(t13_value);
    			t14 = space();
    			div5 = element("div");
    			li0 = element("li");
    			a0 = element("a");
    			i0 = element("i");
    			i0.textContent = `${"<"}`;
    			t16 = space();
    			li1 = element("li");
    			a1 = element("a");
    			i1 = element("i");
    			t17 = space();
    			li2 = element("li");
    			a2 = element("a");
    			i2 = element("i");
    			attr_dev(div0, "class", "speaker svelte-1hd5mfv");
    			add_location(div0, file$4, 241, 8, 7768);
    			attr_dev(span0, "class", "svelte-1hd5mfv");
    			add_location(span0, file$4, 244, 12, 7876);
    			attr_dev(span1, "class", "battery svelte-1hd5mfv");
    			add_location(span1, file$4, 245, 12, 7908);
    			attr_dev(b0, "class", "signal1 svelte-1hd5mfv");
    			add_location(b0, file$4, 247, 14, 7985);
    			attr_dev(b1, "class", "signal2 svelte-1hd5mfv");
    			add_location(b1, file$4, 248, 14, 8024);
    			attr_dev(b2, "class", "signal3 svelte-1hd5mfv");
    			add_location(b2, file$4, 249, 14, 8063);
    			attr_dev(b3, "class", "signal4 svelte-1hd5mfv");
    			add_location(b3, file$4, 250, 14, 8102);
    			attr_dev(span2, "class", "gsm svelte-1hd5mfv");
    			add_location(span2, file$4, 246, 12, 7951);
    			attr_dev(div1, "class", "phone-infos svelte-1hd5mfv");
    			add_location(div1, file$4, 243, 10, 7837);
    			attr_dev(icon, "class", icon_class_value = "icon-" + /*selected*/ ctx[1] + " svelte-1hd5mfv");
    			add_location(icon, file$4, 256, 16, 8354);
    			attr_dev(txt0, "class", "name svelte-1hd5mfv");
    			add_location(txt0, file$4, 257, 16, 8409);
    			attr_dev(txt1, "class", "effect svelte-1hd5mfv");
    			add_location(txt1, file$4, 258, 16, 8479);
    			attr_dev(txt2, "class", "story svelte-1hd5mfv");
    			add_location(txt2, file$4, 259, 16, 8553);
    			attr_dev(div2, "class", "detail container svelte-1hd5mfv");
    			add_location(div2, file$4, 255, 14, 8269);
    			attr_dev(div3, "class", "tab phone current svelte-1hd5mfv");
    			add_location(div3, file$4, 254, 12, 8222);
    			attr_dev(div4, "class", "phone-tab-contents svelte-1hd5mfv");
    			add_location(div4, file$4, 253, 10, 8176);
    			attr_dev(i0, "class", "icon back svelte-1hd5mfv");
    			add_location(i0, file$4, 264, 19, 8718);
    			attr_dev(a0, "class", "svelte-1hd5mfv");
    			add_location(a0, file$4, 264, 16, 8715);
    			attr_dev(li0, "class", "svelte-1hd5mfv");
    			add_location(li0, file$4, 264, 12, 8711);
    			attr_dev(i1, "class", "icon home svelte-1hd5mfv");
    			add_location(i1, file$4, 265, 19, 8778);
    			attr_dev(a1, "class", "svelte-1hd5mfv");
    			add_location(a1, file$4, 265, 16, 8775);
    			attr_dev(li1, "class", "svelte-1hd5mfv");
    			add_location(li1, file$4, 265, 12, 8771);
    			attr_dev(i2, "class", "icon windows svelte-1hd5mfv");
    			add_location(i2, file$4, 266, 19, 8833);
    			attr_dev(a2, "class", "svelte-1hd5mfv");
    			add_location(a2, file$4, 266, 16, 8830);
    			attr_dev(li2, "class", "svelte-1hd5mfv");
    			add_location(li2, file$4, 266, 12, 8826);
    			attr_dev(div5, "class", "main-btns svelte-1hd5mfv");
    			add_location(div5, file$4, 263, 10, 8674);
    			attr_dev(div6, "class", "screen svelte-1hd5mfv");
    			add_location(div6, file$4, 242, 8, 7805);
    			attr_dev(div7, "class", "nexus svelte-1hd5mfv");
    			add_location(div7, file$4, 236, 6, 7645);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div0);
    			append_dev(div7, t0);
    			append_dev(div7, div6);
    			append_dev(div6, div1);
    			append_dev(div1, span0);
    			append_dev(div1, t2);
    			append_dev(div1, span1);
    			append_dev(div1, t3);
    			append_dev(div1, span2);
    			append_dev(span2, b0);
    			append_dev(span2, t4);
    			append_dev(span2, b1);
    			append_dev(span2, t5);
    			append_dev(span2, b2);
    			append_dev(span2, t6);
    			append_dev(span2, b3);
    			append_dev(div6, t7);
    			append_dev(div6, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, icon);
    			append_dev(div2, t8);
    			append_dev(div2, txt0);
    			append_dev(txt0, t9);
    			append_dev(div2, t10);
    			append_dev(div2, txt1);
    			append_dev(txt1, t11);
    			append_dev(div2, t12);
    			append_dev(div2, txt2);
    			append_dev(txt2, t13);
    			/*div2_binding*/ ctx[31](div2);
    			append_dev(div6, t14);
    			append_dev(div6, div5);
    			append_dev(div5, li0);
    			append_dev(li0, a0);
    			append_dev(a0, i0);
    			append_dev(div5, t16);
    			append_dev(div5, li1);
    			append_dev(li1, a1);
    			append_dev(a1, i1);
    			append_dev(div5, t17);
    			append_dev(div5, li2);
    			append_dev(li2, a2);
    			append_dev(a2, i2);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*selected*/ 2 && icon_class_value !== (icon_class_value = "icon-" + /*selected*/ ctx[1] + " svelte-1hd5mfv")) {
    				attr_dev(icon, "class", icon_class_value);
    			}

    			if ((!current || dirty[0] & /*index, selected*/ 3) && t9_value !== (t9_value = /*info*/ ctx[10][/*index*/ ctx[0]][/*selected*/ ctx[1]].name + "")) set_data_dev(t9, t9_value);
    			if ((!current || dirty[0] & /*index, selected*/ 3) && t11_value !== (t11_value = /*info*/ ctx[10][/*index*/ ctx[0]][/*selected*/ ctx[1]].detail + "")) set_data_dev(t11, t11_value);
    			if ((!current || dirty[0] & /*index, selected*/ 3) && t13_value !== (t13_value = story[/*index*/ ctx[0]][/*selected*/ ctx[1]] + "")) set_data_dev(t13, t13_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!current) return;
    				if (div7_outro) div7_outro.end(1);
    				div7_intro = create_in_transition(div7, scale, { duration: 200 });
    				div7_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div7_intro) div7_intro.invalidate();
    			div7_outro = create_out_transition(div7, scale, { duration: 200 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			/*div2_binding*/ ctx[31](null);
    			if (detaching && div7_outro) div7_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(236:4) {#if selected}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div3;
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
    	let t6;
    	let txt3_class_value;
    	let t7;
    	let txt4;
    	let t8;
    	let txt4_class_value;
    	let t9;
    	let txt5;
    	let t10;
    	let txt5_class_value;
    	let t11;
    	let div1;
    	let t12;
    	let t13;
    	let t14;
    	let t15;
    	let t16;
    	let t17;
    	let t18;
    	let div2;
    	let div3_intro;
    	let div3_outro;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*index*/ ctx[0] == "collection" && create_if_block_6$1(ctx);
    	let if_block1 = /*index*/ ctx[0] == "souvenir" && create_if_block_5$1(ctx);
    	let if_block2 = /*index*/ ctx[0] == "equipment" && create_if_block_4$1(ctx);
    	let if_block3 = /*index*/ ctx[0] == "consumable" && create_if_block_3$1(ctx);
    	let if_block4 = /*index*/ ctx[0] == "role" && create_if_block_2$2(ctx);
    	let if_block5 = /*index*/ ctx[0] == "basecard" && create_if_block_1$2(ctx);
    	let if_block6 = /*selected*/ ctx[1] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			txt0 = element("txt");
    			t0 = text("角色");
    			t1 = space();
    			txt1 = element("txt");
    			t2 = text("收藏品");
    			t3 = space();
    			txt2 = element("txt");
    			t4 = text("装备");
    			t5 = space();
    			txt3 = element("txt");
    			t6 = text("纪念品");
    			t7 = space();
    			txt4 = element("txt");
    			t8 = text("通式");
    			t9 = space();
    			txt5 = element("txt");
    			t10 = text("消耗品");
    			t11 = space();
    			div1 = element("div");
    			if (if_block0) if_block0.c();
    			t12 = space();
    			if (if_block1) if_block1.c();
    			t13 = space();
    			if (if_block2) if_block2.c();
    			t14 = space();
    			if (if_block3) if_block3.c();
    			t15 = space();
    			if (if_block4) if_block4.c();
    			t16 = space();
    			if (if_block5) if_block5.c();
    			t17 = space();
    			if (if_block6) if_block6.c();
    			t18 = space();
    			div2 = element("div");
    			div2.textContent = "右键回到标题界面";
    			attr_dev(txt0, "class", txt0_class_value = "" + (null_to_empty(/*index*/ ctx[0] == "role" && "selected") + " svelte-1hd5mfv"));
    			add_location(txt0, file$4, 87, 4, 2813);
    			attr_dev(txt1, "class", txt1_class_value = "" + (null_to_empty(/*index*/ ctx[0] == "collection" && "selected") + " svelte-1hd5mfv"));
    			add_location(txt1, file$4, 90, 4, 2916);
    			attr_dev(txt2, "class", txt2_class_value = "" + (null_to_empty(/*index*/ ctx[0] == "equipment" && "selected") + " svelte-1hd5mfv"));
    			add_location(txt2, file$4, 94, 4, 3038);
    			attr_dev(txt3, "class", txt3_class_value = "" + (null_to_empty(/*index*/ ctx[0] == "souvenir" && "selected") + " svelte-1hd5mfv"));
    			add_location(txt3, file$4, 98, 4, 3157);
    			attr_dev(txt4, "class", txt4_class_value = "" + (null_to_empty(/*index*/ ctx[0] == "basecard" && "selected") + " svelte-1hd5mfv"));
    			add_location(txt4, file$4, 102, 4, 3275);
    			attr_dev(txt5, "class", txt5_class_value = "" + (null_to_empty(/*index*/ ctx[0] == "consumable" && "selected") + " svelte-1hd5mfv"));
    			add_location(txt5, file$4, 106, 4, 3392);
    			attr_dev(div0, "class", "index svelte-1hd5mfv");
    			add_location(div0, file$4, 86, 2, 2788);
    			attr_dev(div1, "class", "main svelte-1hd5mfv");
    			add_location(div1, file$4, 111, 2, 3522);
    			attr_dev(div2, "class", "remind svelte-1hd5mfv");
    			add_location(div2, file$4, 272, 2, 8943);
    			attr_dev(div3, "class", "body svelte-1hd5mfv");
    			add_location(div3, file$4, 85, 0, 2709);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
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
    			append_dev(txt3, t6);
    			append_dev(div0, t7);
    			append_dev(div0, txt4);
    			append_dev(txt4, t8);
    			append_dev(div0, t9);
    			append_dev(div0, txt5);
    			append_dev(txt5, t10);
    			append_dev(div3, t11);
    			append_dev(div3, div1);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t12);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div1, t13);
    			if (if_block2) if_block2.m(div1, null);
    			append_dev(div1, t14);
    			if (if_block3) if_block3.m(div1, null);
    			append_dev(div1, t15);
    			if (if_block4) if_block4.m(div1, null);
    			append_dev(div1, t16);
    			if (if_block5) if_block5.m(div1, null);
    			append_dev(div1, t17);
    			if (if_block6) if_block6.m(div1, null);
    			append_dev(div3, t18);
    			append_dev(div3, div2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(txt0, "click", /*click_handler*/ ctx[12], false, false, false, false),
    					listen_dev(txt1, "click", /*click_handler_1*/ ctx[13], false, false, false, false),
    					listen_dev(txt2, "click", /*click_handler_2*/ ctx[14], false, false, false, false),
    					listen_dev(txt3, "click", /*click_handler_3*/ ctx[15], false, false, false, false),
    					listen_dev(txt4, "click", /*click_handler_4*/ ctx[16], false, false, false, false),
    					listen_dev(txt5, "click", /*click_handler_5*/ ctx[17], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*index*/ 1 && txt0_class_value !== (txt0_class_value = "" + (null_to_empty(/*index*/ ctx[0] == "role" && "selected") + " svelte-1hd5mfv"))) {
    				attr_dev(txt0, "class", txt0_class_value);
    			}

    			if (!current || dirty[0] & /*index*/ 1 && txt1_class_value !== (txt1_class_value = "" + (null_to_empty(/*index*/ ctx[0] == "collection" && "selected") + " svelte-1hd5mfv"))) {
    				attr_dev(txt1, "class", txt1_class_value);
    			}

    			if (!current || dirty[0] & /*index*/ 1 && txt2_class_value !== (txt2_class_value = "" + (null_to_empty(/*index*/ ctx[0] == "equipment" && "selected") + " svelte-1hd5mfv"))) {
    				attr_dev(txt2, "class", txt2_class_value);
    			}

    			if (!current || dirty[0] & /*index*/ 1 && txt3_class_value !== (txt3_class_value = "" + (null_to_empty(/*index*/ ctx[0] == "souvenir" && "selected") + " svelte-1hd5mfv"))) {
    				attr_dev(txt3, "class", txt3_class_value);
    			}

    			if (!current || dirty[0] & /*index*/ 1 && txt4_class_value !== (txt4_class_value = "" + (null_to_empty(/*index*/ ctx[0] == "basecard" && "selected") + " svelte-1hd5mfv"))) {
    				attr_dev(txt4, "class", txt4_class_value);
    			}

    			if (!current || dirty[0] & /*index*/ 1 && txt5_class_value !== (txt5_class_value = "" + (null_to_empty(/*index*/ ctx[0] == "consumable" && "selected") + " svelte-1hd5mfv"))) {
    				attr_dev(txt5, "class", txt5_class_value);
    			}

    			if (/*index*/ ctx[0] == "collection") {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*index*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_6$1(ctx);
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

    					if (dirty[0] & /*index*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_5$1(ctx);
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

    					if (dirty[0] & /*index*/ 1) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_4$1(ctx);
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

    			if (/*index*/ ctx[0] == "consumable") {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty[0] & /*index*/ 1) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_3$1(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(div1, t15);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (/*index*/ ctx[0] == "role") {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);

    					if (dirty[0] & /*index*/ 1) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block_2$2(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(div1, t16);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}

    			if (/*index*/ ctx[0] == "basecard") {
    				if (if_block5) {
    					if_block5.p(ctx, dirty);

    					if (dirty[0] & /*index*/ 1) {
    						transition_in(if_block5, 1);
    					}
    				} else {
    					if_block5 = create_if_block_1$2(ctx);
    					if_block5.c();
    					transition_in(if_block5, 1);
    					if_block5.m(div1, t17);
    				}
    			} else if (if_block5) {
    				group_outros();

    				transition_out(if_block5, 1, 1, () => {
    					if_block5 = null;
    				});

    				check_outros();
    			}

    			if (/*selected*/ ctx[1]) {
    				if (if_block6) {
    					if_block6.p(ctx, dirty);

    					if (dirty[0] & /*selected*/ 2) {
    						transition_in(if_block6, 1);
    					}
    				} else {
    					if_block6 = create_if_block$3(ctx);
    					if_block6.c();
    					transition_in(if_block6, 1);
    					if_block6.m(div1, null);
    				}
    			} else if (if_block6) {
    				group_outros();

    				transition_out(if_block6, 1, 1, () => {
    					if_block6 = null;
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
    			transition_in(if_block4);
    			transition_in(if_block5);
    			transition_in(if_block6);

    			add_render_callback(() => {
    				if (!current) return;
    				if (div3_outro) div3_outro.end(1);
    				div3_intro = create_in_transition(div3, fade, { duration: 250 });
    				div3_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			transition_out(if_block5);
    			transition_out(if_block6);
    			if (div3_intro) div3_intro.invalidate();
    			div3_outro = create_out_transition(div3, fade, { duration: 250 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();
    			if (if_block5) if_block5.d();
    			if (if_block6) if_block6.d();
    			if (detaching && div3_outro) div3_outro.end();
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

    const func_2 = _ => null;

    function instance$4($$self, $$props, $$invalidate) {
    	let $archive;
    	let $Explain;
    	validate_store(archive, 'archive');
    	component_subscribe($$self, archive, $$value => $$invalidate(9, $archive = $$value));
    	validate_store(Explain, 'Explain');
    	component_subscribe($$self, Explain, $$value => $$invalidate(32, $Explain = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Afflatus', slots, []);
    	let index = "role";
    	let selected = null;
    	let selected_role = $archive.unlocked.role[0];

    	const info = {
    		buff: buff$1,
    		collection: collection$2,
    		equipment: equipment$1,
    		souvenir: souvenir$1,
    		spellcard: spellcard$1,
    		role,
    		consumable: consumable$1,
    		basecard
    	};

    	const element_collection = [];
    	const element_equipment = [];
    	const element_souvenir = [];
    	const element_consumable = [];
    	const element_role = [];
    	const element_container = {};

    	beforeUpdate(_ => {
    		element_collection.forEach((e, i) => {
    			let key = Object.keys(collection$2)[i];
    			$Explain(e).color(collection$2[key].type).with(collection$2[key]);
    		});

    		element_equipment.forEach((e, i) => {
    			let key = Object.keys(equipment$1)[i];
    			$Explain(e).color("gold").with(equipment$1[key]);
    		});

    		element_souvenir.forEach((e, i) => {
    			let key = Object.keys(souvenir$1)[i];
    			$Explain(e).color("purple").with(souvenir$1[key]);
    		});

    		element_consumable.forEach((e, i) => {
    			let key = Object.keys(buff$1)[i];
    			$Explain(e).with(buff$1[key]);
    		});

    		element_role.forEach((e, i) => {
    			let key = Object.keys(role)[i];
    			let info = deepCopy(role[key]);
    			if (!$archive.unlocked.role.includes(key)) info.detail = `解锁条件：${info.unlock}`;
    			$Explain(e).with(info);

    			if (e) e.onclick = _ => {
    				if ($archive.unlocked.role.includes(key)) $$invalidate(2, selected_role = key);
    			};
    		});
    	});

    	afterUpdate(_ => {
    		for (let element in element_container) {
    			if (element_container[element]) $$invalidate(
    				8,
    				element_container[element].ontouchstart = function (event) {
    					let originX = event.touches[0].pageX;
    					let scrollTop = element_container[element].scrollTop;

    					$$invalidate(
    						8,
    						element_container[element].ontouchmove = function (e) {
    							let x = e.touches[0].pageX;
    							$$invalidate(8, element_container[element].scrollTop = scrollTop + x - originX, element_container);
    						},
    						element_container
    					);
    				},
    				element_container
    			);
    		}
    	});

    	function Index(i) {
    		$$invalidate(1, selected = null);
    		$$invalidate(0, index = i);
    	}

    	const writable_props = [];

    	Object_1$4.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Afflatus> was created with unknown prop '${key}'`);
    	});

    	const click_handler = _ => Index("role");
    	const click_handler_1 = _ => Index("collection");
    	const click_handler_2 = _ => Index("equipment");
    	const click_handler_3 = _ => Index("souvenir");
    	const click_handler_4 = _ => Index("basecard");
    	const click_handler_5 = _ => Index("consumable");
    	const click_handler_6 = (c, _) => $$invalidate(1, selected = c);

    	function div_binding($$value, i) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_collection[i] = $$value;
    			$$invalidate(3, element_collection);
    		});
    	}

    	const click_handler_7 = (s, _) => $$invalidate(1, selected = s);

    	function div_binding_1($$value, i) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_souvenir[i] = $$value;
    			$$invalidate(5, element_souvenir);
    		});
    	}

    	const click_handler_8 = (s, _) => $$invalidate(1, selected = s);

    	function div_binding_2($$value, i) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_equipment[i] = $$value;
    			$$invalidate(4, element_equipment);
    		});
    	}

    	const click_handler_9 = (s, _) => $$invalidate(1, selected = s);

    	function div_binding_3($$value, i) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_consumable[i] = $$value;
    			$$invalidate(6, element_consumable);
    		});
    	}

    	function img_binding($$value, i) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_role[i] = $$value;
    			$$invalidate(7, element_role);
    		});
    	}

    	const func = s => spellcard$1[s].role == selected_role;
    	const func_1 = s => spellcard$1[s].role == selected_role;

    	function div7_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_container.spellcard = $$value;
    			$$invalidate(8, element_container);
    		});
    	}

    	function div_binding_4($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_container.basecard = $$value;
    			$$invalidate(8, element_container);
    		});
    	}

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_container.detail = $$value;
    			$$invalidate(8, element_container);
    		});
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		beforeUpdate,
    		afterUpdate,
    		fade,
    		scale,
    		Explain,
    		archive,
    		buff: buff$1,
    		collection: collection$2,
    		equipment: equipment$1,
    		souvenir: souvenir$1,
    		spellcard: spellcard$1,
    		consumable: consumable$1,
    		basecard,
    		role,
    		story,
    		Card,
    		growth: growth$1,
    		index,
    		selected,
    		selected_role,
    		info,
    		element_collection,
    		element_equipment,
    		element_souvenir,
    		element_consumable,
    		element_role,
    		element_container,
    		Index,
    		$archive,
    		$Explain
    	});

    	$$self.$inject_state = $$props => {
    		if ('index' in $$props) $$invalidate(0, index = $$props.index);
    		if ('selected' in $$props) $$invalidate(1, selected = $$props.selected);
    		if ('selected_role' in $$props) $$invalidate(2, selected_role = $$props.selected_role);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		index,
    		selected,
    		selected_role,
    		element_collection,
    		element_equipment,
    		element_souvenir,
    		element_consumable,
    		element_role,
    		element_container,
    		$archive,
    		info,
    		Index,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		div_binding,
    		click_handler_7,
    		div_binding_1,
    		click_handler_8,
    		div_binding_2,
    		click_handler_9,
    		div_binding_3,
    		img_binding,
    		func,
    		func_1,
    		div7_binding,
    		div_binding_4,
    		div2_binding
    	];
    }

    class Afflatus extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Afflatus",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\page\reward.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1$3 } = globals;
    const file$3 = "src\\page\\reward.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[32] = list[i];
    	child_ctx[33] = list;
    	child_ctx[34] = i;
    	return child_ctx;
    }

    // (244:0) {#if show}
    function create_if_block$2(ctx) {
    	let div4;
    	let div0;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t0;
    	let div3;
    	let div1;
    	let t2;
    	let div2;
    	let div4_intro;
    	let div4_outro;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*source*/ ctx[4];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*i*/ ctx[34];
    	validate_each_keys(ctx, each_value, get_each_context$2, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$2(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$2(key, child_ctx));
    	}

    	function select_block_type_1(ctx, dirty) {
    		if (/*worth*/ ctx[5] > 0) return create_if_block_1$1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			div3 = element("div");
    			div1 = element("div");
    			div1.textContent = "确定";
    			t2 = space();
    			div2 = element("div");
    			if_block.c();
    			attr_dev(div0, "class", "selections container svelte-1f4objy");
    			add_location(div0, file$3, 245, 4, 7337);
    			attr_dev(div1, "class", "btn svelte-1f4objy");
    			add_location(div1, file$3, 270, 6, 8184);
    			attr_dev(div2, "class", "btn svelte-1f4objy");
    			add_location(div2, file$3, 271, 6, 8236);
    			attr_dev(div3, "class", "btns svelte-1f4objy");
    			add_location(div3, file$3, 269, 4, 8158);
    			attr_dev(div4, "class", "body svelte-1f4objy");
    			add_location(div4, file$3, 244, 2, 7256);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div0, null);
    				}
    			}

    			/*div0_binding*/ ctx[12](div0);
    			append_dev(div4, t0);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			if_block.m(div2, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div1, "click", /*confirm*/ ctx[9], false, false, false, false),
    					listen_dev(div2, "click", /*skip*/ ctx[10], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*type, selected, source, element, data, color*/ 219) {
    				each_value = /*source*/ ctx[4];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$2, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div0, outro_and_destroy_block, create_each_block$2, null, get_each_context$2);
    				check_outros();
    			}

    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div2, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			add_render_callback(() => {
    				if (!current) return;
    				if (div4_outro) div4_outro.end(1);
    				div4_intro = create_in_transition(div4, fade, { duration: 250 });
    				div4_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			if (div4_intro) div4_intro.invalidate();
    			div4_outro = create_out_transition(div4, fade, { duration: 250 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			/*div0_binding*/ ctx[12](null);
    			if_block.d();
    			if (detaching && div4_outro) div4_outro.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(244:0) {#if show}",
    		ctx
    	});

    	return block;
    }

    // (264:10) {:else}
    function create_else_block_1(ctx) {
    	let card;
    	let current;

    	card = new Card({
    			props: { key: /*k*/ ctx[32] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const card_changes = {};
    			if (dirty[0] & /*source*/ 16) card_changes.key = /*k*/ ctx[32];
    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(264:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (252:10) {#if type != "spellcard" && type != "basecard" && type != "forget" && type != "card"}
    function create_if_block_2$1(ctx) {
    	let div;
    	let icon;
    	let icon_class_value;
    	let t0;
    	let txt;
    	let t1_value = /*data*/ ctx[6][/*type*/ ctx[0]][/*k*/ ctx[32]].name + "";
    	let t1;
    	let div_intro;
    	let div_outro;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			icon = element("icon");
    			t0 = space();
    			txt = element("txt");
    			t1 = text(t1_value);
    			attr_dev(icon, "class", icon_class_value = "icon-" + /*k*/ ctx[32] + " svelte-1f4objy");
    			add_location(icon, file$3, 260, 14, 7951);
    			attr_dev(txt, "class", "svelte-1f4objy");
    			add_location(txt, file$3, 261, 14, 7992);
    			attr_dev(div, "class", "item svelte-1f4objy");

    			set_style(div, "background-color", "var(--" + (/*type*/ ctx[0] == 'collection'
    			? /*data*/ ctx[6][/*type*/ ctx[0]][/*k*/ ctx[32]].type
    			: /*color*/ ctx[1]) + ")");

    			add_location(div, file$3, 252, 12, 7665);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, icon);
    			append_dev(div, t0);
    			append_dev(div, txt);
    			append_dev(txt, t1);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*source*/ 16 && icon_class_value !== (icon_class_value = "icon-" + /*k*/ ctx[32] + " svelte-1f4objy")) {
    				attr_dev(icon, "class", icon_class_value);
    			}

    			if ((!current || dirty[0] & /*data, type, source*/ 81) && t1_value !== (t1_value = /*data*/ ctx[6][/*type*/ ctx[0]][/*k*/ ctx[32]].name + "")) set_data_dev(t1, t1_value);

    			if (!current || dirty[0] & /*type, data, source, color*/ 83) {
    				set_style(div, "background-color", "var(--" + (/*type*/ ctx[0] == 'collection'
    				? /*data*/ ctx[6][/*type*/ ctx[0]][/*k*/ ctx[32]].type
    				: /*color*/ ctx[1]) + ")");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!current) return;
    				if (div_outro) div_outro.end(1);
    				div_intro = create_in_transition(div, scale, { duration: 250 });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, scale, { duration: 250 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(252:10) {#if type != \\\"spellcard\\\" && type != \\\"basecard\\\" && type != \\\"forget\\\" && type != \\\"card\\\"}",
    		ctx
    	});

    	return block;
    }

    // (247:6) {#each source as k, i (i)}
    function create_each_block$2(key_1, ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let t;
    	let div_class_value;
    	let i = /*i*/ ctx[34];
    	let current;
    	const if_block_creators = [create_if_block_2$1, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*type*/ ctx[0] != "spellcard" && /*type*/ ctx[0] != "basecard" && /*type*/ ctx[0] != "forget" && /*type*/ ctx[0] != "card") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	const assign_div = () => /*div_binding*/ ctx[11](div, i);
    	const unassign_div = () => /*div_binding*/ ctx[11](null, i);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			t = space();
    			attr_dev(div, "class", div_class_value = "box " + /*type*/ ctx[0] + " " + (/*selected*/ ctx[3] == /*i*/ ctx[34] && 'selected') + " svelte-1f4objy");
    			add_location(div, file$3, 247, 8, 7445);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			append_dev(div, t);
    			assign_div();
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
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
    				if_block.m(div, t);
    			}

    			if (!current || dirty[0] & /*type, selected, source*/ 25 && div_class_value !== (div_class_value = "box " + /*type*/ ctx[0] + " " + (/*selected*/ ctx[3] == /*i*/ ctx[34] && 'selected') + " svelte-1f4objy")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (i !== /*i*/ ctx[34]) {
    				unassign_div();
    				i = /*i*/ ctx[34];
    				assign_div();
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
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    			unassign_div();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(247:6) {#each source as k, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (275:8) {:else}
    function create_else_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("跳过");
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
    		id: create_else_block.name,
    		type: "else",
    		source: "(275:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (273:8) {#if worth > 0}
    function create_if_block_1$1(ctx) {
    	let t0;
    	let t1;
    	let icon;

    	const block = {
    		c: function create() {
    			t0 = text("跳过并获得");
    			t1 = text(/*worth*/ ctx[5]);
    			icon = element("icon");
    			attr_dev(icon, "class", "icon-coin svelte-1f4objy");
    			add_location(icon, file$3, 273, 22, 8318);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, icon, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*worth*/ 32) set_data_dev(t1, /*worth*/ ctx[5]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(273:8) {#if worth > 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*show*/ ctx[2] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*show*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*show*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
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
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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
    	let $Admin;
    	let $Explain;
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(15, $Admin = $$value));
    	validate_store(Explain, 'Explain');
    	component_subscribe($$self, Explain, $$value => $$invalidate(16, $Explain = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Reward', slots, []);
    	let type = "collection";
    	let color = "blue";
    	let show = false;
    	let selected;
    	let source = [];
    	let worth = 100;
    	let special;
    	let cache = {};
    	let data$1 = {};
    	const element = [];
    	let element_container;

    	beforeUpdate(function () {
    		element.forEach((e, i) => {
    			if (e && source[i]) {
    				e.onclick = _ => $$invalidate(3, selected = selected == i ? null : i);

    				let _color = type == "collection"
    				? data$1.collection[source[i]].type
    				: color;

    				type != "forget" && $Explain(e).color(_color).with(data$1[type][source[i]]);
    			}
    		});
    	});

    	afterUpdate(_ => {
    		if (element_container) $$invalidate(
    			8,
    			element_container.ontouchstart = function (event) {
    				let originX = event.touches[0].pageX;
    				let scrollTop = element_container.scrollTop;

    				$$invalidate(
    					8,
    					element_container.ontouchmove = function (e) {
    						let x = e.touches[0].pageX;
    						$$invalidate(8, element_container.scrollTop = scrollTop + x - originX, element_container);
    					},
    					element_container
    				);
    			},
    			element_container
    		);
    	});

    	set_store_value(Admin, $Admin.event.getCollection = loadCollection, $Admin);
    	set_store_value(Admin, $Admin.event.getEquipment = loadEquipment, $Admin);
    	set_store_value(Admin, $Admin.event.getSouvenir = loadSouvenir, $Admin);
    	set_store_value(Admin, $Admin.event.getSpellcard = loadSpellcard, $Admin);
    	set_store_value(Admin, $Admin.event.getBasecard = loadBasecard, $Admin);
    	set_store_value(Admin, $Admin.event.heal = heal, $Admin);
    	set_store_value(Admin, $Admin.event.loseHealth = loseHealth, $Admin);
    	set_store_value(Admin, $Admin.event.forgetCard = forgetCard, $Admin);
    	set_store_value(Admin, $Admin.event.copy = copy, $Admin);
    	set_store_value(Admin, $Admin.event.change = change, $Admin);
    	set_store_value(Admin, $Admin.event.sellCollection = sellCollection, $Admin);
    	set_store_value(Admin, $Admin.event.getCoin = getCoin, $Admin);

    	const specialHandle = {
    		change() {
    			let res;
    			source[selected].decreaseOf($Admin.data[type]);
    			if (type == "card") res = data$1.keys().card.filter(c => ["base", $Admin.data.role].includes(data$1.card[c].role)).rd()[0];

    			if (type == "collection") {
    				let _color = data$1.collection[source[selected]].type;
    				let r = Math.random();

    				if (r > 0.7) _color = ({
    					blue: "green",
    					green: Math.random() > 0.5 ? "red" : "blue",
    					red: "green"
    				})[_color];

    				res = data$1.keys().collection.filter(c => data.collection[c].type == _color);
    				res = res.rd()[0];
    			}

    			res.increaseOf($Admin.data[type]);
    			msg({ content: `获得[${data$1[type][res].name}]` });
    		},
    		sellCollection() {
    			source[selected].decreaseOf($Admin.data.collection);
    			let sold = cache.sellCollection;
    			sold.push(source[selected]);
    			let res = ({ blue: 100, green: 300, red: 750 })[data$1.collection[source[selected]].type];
    			$Admin.event.getCoin(res);
    		}
    	};

    	function blackListApply() {
    		let _data = deepCopy(data);

    		for (let i in _data) {
    			for (let k in _data[i]) {
    				if ($Admin.data.blackList.includes(k)) {
    					delete _data[i][k];
    				}
    			}
    		}

    		$$invalidate(6, data$1 = _data);
    	}

    	function getCoin(amount) {
    		set_store_value(Admin, $Admin.data.coin += amount, $Admin);
    		msg({ content: `获得${amount}硬币` });
    		set_store_value(Admin, $Admin.data["coin_reward_total"] += amount, $Admin);
    	}

    	function loadCollection(_color, fromAll) {
    		blackListApply();
    		$$invalidate(0, type = "collection");
    		$$invalidate(4, source = Object.keys(data$1.collection).filter(c => data$1.collection[c].type == _color).rd());
    		if (!fromAll) $$invalidate(4, source = source.splice(0, $Admin.data.sugar));
    		$$invalidate(2, show = true);
    		if (_color == "blue") $$invalidate(5, worth = 100);
    		if (_color == "green") $$invalidate(5, worth = 300);
    		if (_color == "red") $$invalidate(5, worth = 750);
    	}

    	function loadEquipment(fromAll) {
    		blackListApply();
    		$$invalidate(0, type = "equipment");
    		$$invalidate(1, color = "gold");
    		$$invalidate(4, source = Object.keys(data$1.equipment).rd().splice(0, $Admin.data.sugar));
    		$$invalidate(2, show = true);
    		$$invalidate(5, worth = 250);
    	}

    	function loadSouvenir(fromAll) {
    		blackListApply();
    		$$invalidate(0, type = "souvenir");
    		$$invalidate(1, color = "purple");
    		$$invalidate(4, source = Object.keys(data$1.souvenir).rd().splice(0, $Admin.data.sugar));
    		$$invalidate(2, show = true);
    		$$invalidate(5, worth = 200);
    	}

    	function loadSpellcard(fromAll) {
    		blackListApply();
    		$$invalidate(0, type = "spellcard");
    		$$invalidate(4, source = Object.keys(data$1.spellcard).filter(s => data$1.spellcard[s].role == $Admin.data.role).rd().splice(0, fromAll ? 15 : $Admin.data.sugar));
    		$$invalidate(2, show = true);
    		$$invalidate(5, worth = 250);
    	}

    	function loadBasecard(fromAll) {
    		blackListApply();
    		$$invalidate(0, type = "basecard");
    		$$invalidate(4, source = Object.keys(data$1.basecard).rd().splice(0, $Admin.data.sugar));
    		$$invalidate(2, show = true);
    		$$invalidate(5, worth = 200);
    	}

    	function forgetCard(fromAll) {
    		$$invalidate(0, type = "forget");
    		$$invalidate(4, source = Object.unCount($Admin.data.card));
    		$$invalidate(2, show = true);
    		$$invalidate(5, worth = 0);
    	}

    	function heal(value, isPercent) {
    		let health = growth$1.role[$Admin.data.role].health;
    		let Health = $Admin.data.health;
    		let h;

    		if (isPercent) {
    			h = Math.min(health - Health, health * value / 100);
    		} else h = Math.min(health - Health, value);

    		set_store_value(Admin, $Admin.data.health += h, $Admin);
    	}

    	function loseHealth(value, isPercent) {
    		let health = growth$1.role[$Admin.data.role].health;
    		let Health = $Admin.data.health;
    		let lose = value;
    		if (isPercent) lose = health * value / 100;

    		if (lose > Health) {
    			return false;
    		} else {
    			set_store_value(Admin, $Admin.data.health -= lose, $Admin);
    			return true;
    		}
    	}

    	function copy(_type) {
    		blackListApply();
    		$$invalidate(0, type = _type);
    		$$invalidate(4, source = Object.keys($Admin.data[type]));
    		$$invalidate(2, show = true);
    		$$invalidate(5, worth = 100);
    	}

    	function change(_type) {
    		blackListApply();
    		$$invalidate(0, type = _type);
    		special = "change";
    		$$invalidate(4, source = Object.keys($Admin.data[type]));
    		$$invalidate(2, show = true);
    		$$invalidate(5, worth = 20);
    	}

    	function sellCollection(sold) {
    		$$invalidate(0, type = "collection");
    		special = "sellCollection";
    		cache.sellCollection = sold;
    		$$invalidate(4, source = Object.keys($Admin.data.collection).filter(c => !sold.includes(c)));
    		$$invalidate(2, show = true);
    		$$invalidate(5, worth = 0);
    	}

    	function confirm() {
    		let _type = type;

    		if (selected != null) {
    			if (type == "forget") {
    				let _card = {};
    				Object.assign(_card, data$1.spellcard);
    				Object.assign(_card, data$1.basecard);

    				msg({
    					content: `忘却[${_card[source[selected]].name}]`
    				});

    				source[selected].decreaseOf($Admin.data.card);
    			} else if (special) specialHandle[special](); else {
    				msg({
    					content: `获得[${data$1[type][source[selected]].name}]`
    				});

    				if (type != "equipment" && type != "souvenir") {
    					if (type == "spellcard" || type == "basecard") _type = "card";
    					source[selected].increaseOf($Admin.data[_type]);
    				} else set_store_value(Admin, $Admin.data[type] = source[selected], $Admin);
    			}

    			close();
    		} else msg({ content: "请选择一个" });
    	}

    	function skip() {
    		worth != 0 && $Admin.event.getCoin(worth);
    		close();
    	}

    	function close() {
    		$$invalidate(2, show = false);
    		$$invalidate(1, color = null);
    		$$invalidate(3, selected = null);
    		$$invalidate(4, source = []);
    		special = null;
    	}

    	const writable_props = [];

    	Object_1$3.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Reward> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value, i) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element[i] = $$value;
    			$$invalidate(7, element);
    		});
    	}

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_container = $$value;
    			$$invalidate(8, element_container);
    		});
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		beforeUpdate,
    		afterUpdate,
    		fade,
    		scale,
    		Admin,
    		setting,
    		Explain,
    		Data: data,
    		Card,
    		growth: growth$1,
    		type,
    		color,
    		show,
    		selected,
    		source,
    		worth,
    		special,
    		cache,
    		data: data$1,
    		element,
    		element_container,
    		specialHandle,
    		blackListApply,
    		getCoin,
    		loadCollection,
    		loadEquipment,
    		loadSouvenir,
    		loadSpellcard,
    		loadBasecard,
    		forgetCard,
    		heal,
    		loseHealth,
    		copy,
    		change,
    		sellCollection,
    		confirm,
    		skip,
    		close,
    		$Admin,
    		$Explain
    	});

    	$$self.$inject_state = $$props => {
    		if ('type' in $$props) $$invalidate(0, type = $$props.type);
    		if ('color' in $$props) $$invalidate(1, color = $$props.color);
    		if ('show' in $$props) $$invalidate(2, show = $$props.show);
    		if ('selected' in $$props) $$invalidate(3, selected = $$props.selected);
    		if ('source' in $$props) $$invalidate(4, source = $$props.source);
    		if ('worth' in $$props) $$invalidate(5, worth = $$props.worth);
    		if ('special' in $$props) special = $$props.special;
    		if ('cache' in $$props) cache = $$props.cache;
    		if ('data' in $$props) $$invalidate(6, data$1 = $$props.data);
    		if ('element_container' in $$props) $$invalidate(8, element_container = $$props.element_container);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		type,
    		color,
    		show,
    		selected,
    		source,
    		worth,
    		data$1,
    		element,
    		element_container,
    		confirm,
    		skip,
    		div_binding,
    		div0_binding
    	];
    }

    class Reward extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Reward",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\page\epilog.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1$2 } = globals;
    const file$2 = "src\\page\\epilog.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	child_ctx[12] = i;
    	return child_ctx;
    }

    // (106:6) {#each Object.keys(remark) as s, i (i)}
    function create_each_block$1(key_1, ctx) {
    	let div;
    	let txt0;
    	let t0_value = /*remark*/ ctx[3][/*s*/ ctx[10]] + "";
    	let t0;
    	let t1;
    	let txt1;
    	let t2_value = window.retain(/*statistics*/ ctx[2][/*s*/ ctx[10]], 0) + "";
    	let t2;
    	let t3;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			txt0 = element("txt");
    			t0 = text(t0_value);
    			t1 = space();
    			txt1 = element("txt");
    			t2 = text(t2_value);
    			t3 = space();
    			add_location(txt0, file$2, 107, 10, 3087);
    			add_location(txt1, file$2, 108, 10, 3121);
    			attr_dev(div, "class", "svelte-rav0lz");
    			add_location(div, file$2, 106, 8, 3070);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, txt0);
    			append_dev(txt0, t0);
    			append_dev(div, t1);
    			append_dev(div, txt1);
    			append_dev(txt1, t2);
    			append_dev(div, t3);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(106:6) {#each Object.keys(remark) as s, i (i)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div4;
    	let div0;
    	let txt;
    	let t0_value = (/*$Admin*/ ctx[0].data.chance.amount < 0 ? "惨败" : "通关") + "";
    	let t0;
    	let t1;
    	let img;
    	let img_src_value;
    	let t2;
    	let div3;
    	let div1;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t3;
    	let div2;
    	let div4_intro;
    	let div4_outro;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = Object.keys(/*remark*/ ctx[3]);
    	validate_each_argument(each_value);
    	const get_key = ctx => /*i*/ ctx[12];
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			txt = element("txt");
    			t0 = text(t0_value);
    			t1 = space();
    			img = element("img");
    			t2 = space();
    			div3 = element("div");
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			div2 = element("div");
    			div2.textContent = "回到标题界面";
    			attr_dev(txt, "class", "title svelte-rav0lz");
    			add_location(txt, file$2, 96, 4, 2728);

    			if (!src_url_equal(img.src, img_src_value = "/img/role/" + /*$setting*/ ctx[1].resource + "/" + (/*$Admin*/ ctx[0].data.chance.amount < 0
    			? 'dead'
    			: 'win') + "/" + /*$Admin*/ ctx[0].data.role + ".webp")) attr_dev(img, "src", img_src_value);

    			attr_dev(img, "class", "svelte-rav0lz");
    			add_location(img, file$2, 97, 4, 2804);
    			attr_dev(div0, "class", "left svelte-rav0lz");
    			add_location(div0, file$2, 95, 2, 2704);
    			attr_dev(div1, "class", "statistics svelte-rav0lz");
    			add_location(div1, file$2, 104, 4, 2989);
    			attr_dev(div2, "class", "btn svelte-rav0lz");
    			add_location(div2, file$2, 112, 4, 3214);
    			attr_dev(div3, "class", "right svelte-rav0lz");
    			add_location(div3, file$2, 103, 2, 2964);
    			attr_dev(div4, "class", "body epilog svelte-rav0lz");
    			add_location(div4, file$2, 90, 0, 2607);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div0, txt);
    			append_dev(txt, t0);
    			append_dev(div0, t1);
    			append_dev(div0, img);
    			append_dev(div4, t2);
    			append_dev(div4, div3);
    			append_dev(div3, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div1, null);
    				}
    			}

    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div2, "click", /*back*/ ctx[4], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*$Admin*/ 1) && t0_value !== (t0_value = (/*$Admin*/ ctx[0].data.chance.amount < 0 ? "惨败" : "通关") + "")) set_data_dev(t0, t0_value);

    			if (!current || dirty & /*$setting, $Admin*/ 3 && !src_url_equal(img.src, img_src_value = "/img/role/" + /*$setting*/ ctx[1].resource + "/" + (/*$Admin*/ ctx[0].data.chance.amount < 0
    			? 'dead'
    			: 'win') + "/" + /*$Admin*/ ctx[0].data.role + ".webp")) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*window, statistics, Object, remark*/ 12) {
    				each_value = Object.keys(/*remark*/ ctx[3]);
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div1, destroy_block, create_each_block$1, null, get_each_context$1);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!current) return;
    				if (div4_outro) div4_outro.end(1);
    				div4_intro = create_in_transition(div4, fade, { duration: 250 });
    				div4_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div4_intro) div4_intro.invalidate();
    			div4_outro = create_out_transition(div4, fade, { duration: 250 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (detaching && div4_outro) div4_outro.end();
    			mounted = false;
    			dispose();
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

    function getNowDate() {
    	var myDate = new Date();
    	var year = myDate.getFullYear(); //获取当前年
    	var mon = myDate.getMonth() + 1; //获取当前月
    	var date = myDate.getDate(); //获取当前日
    	var hours = myDate.getHours(); //获取当前小时
    	var minutes = myDate.getMinutes(); //获取当前分钟
    	var seconds = myDate.getSeconds(); //获取当前秒
    	var now = year + "-" + mon + "-" + date + " " + hours + ":" + minutes + ":" + seconds;
    	return now;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $archive;
    	let $Admin;
    	let $page;
    	let $explore;
    	let $setting;
    	validate_store(archive, 'archive');
    	component_subscribe($$self, archive, $$value => $$invalidate(5, $archive = $$value));
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(0, $Admin = $$value));
    	validate_store(page, 'page');
    	component_subscribe($$self, page, $$value => $$invalidate(6, $page = $$value));
    	validate_store(explore, 'explore');
    	component_subscribe($$self, explore, $$value => $$invalidate(7, $explore = $$value));
    	validate_store(setting, 'setting');
    	component_subscribe($$self, setting, $$value => $$invalidate(1, $setting = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Epilog', slots, []);
    	const statistics = finalStatistics();

    	const remark = {
    		damage_total: "造成伤害总量",
    		damage_frequency: "造成伤害总次数",
    		max_damage: "造成的最高伤害",
    		hurt_total: "受到伤害总量",
    		hurt_frequency: "受到伤害总次数",
    		max_hurt: "受到的最高伤害",
    		cost_total: "消耗灵力总数",
    		punch_count: "打出手牌总数",
    		battle_count: "战斗总次数",
    		round_total: "回合总数",
    		defeat_total: "击败敌人总数",
    		max_lv: "敌人最高等级",
    		coin_reward_total: "获得硬币总数",
    		collection_reward_total: "获得收藏品总数"
    	};

    	function finalStatistics() {
    		let battle_data = $Admin.data.statistics;
    		if ($Admin.data.chance.amount < 0) battle_data.pop();
    		let res = {};

    		for (let i in battle_data[0]) {
    			let key = i.split("_");
    			key.shift();
    			res[key.join("_")] = battle_data.map(d => d[i]).sum();
    		}

    		res.max_damage = Math.max(...battle_data.map(d => d.battle_max_damage));
    		res.max_hurt = Math.max(...battle_data.map(d => d.battle_max_hurt));
    		res.coin_reward_total = $Admin.data.coin_reward_total;
    		res.battle_count = battle_data.length;
    		res.max_lv = $explore.lv;
    		res.collection_reward_total = Object.unCount($Admin.data.collection).length;
    		record(res);
    		return res;
    	}

    	function back() {
    		set_store_value(explore, $explore = {}, $explore);
    		localStorage.removeItem("explore");
    		set_store_value(page, $page = "Index", $page);
    	}

    	function record(battle_data) {
    		let res = {
    			battle_data,
    			player_data: deepCopy($Admin.data),
    			time: getNowDate(),
    			id: retain(Math.random() * 100000, 0),
    			color: ["red", "green", "blue", "purple", "gold", "orange", "pink"].rd()[0]
    		};

    		res.name = `${$Admin.data.chance.amount < 0 ? "惨败" : "通关"}档案-${res.id}`;
    		$archive.record.push(res);
    		localStorage.setItem("archive", JSON.stringify($archive));
    	}

    	const writable_props = [];

    	Object_1$2.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Epilog> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		beforeUpdate,
    		afterUpdate,
    		fade,
    		scale,
    		Explain,
    		archive,
    		Admin,
    		setting,
    		explore,
    		page,
    		statistics,
    		remark,
    		finalStatistics,
    		back,
    		record,
    		getNowDate,
    		$archive,
    		$Admin,
    		$page,
    		$explore,
    		$setting
    	});

    	return [$Admin, $setting, statistics, remark, back];
    }

    class Epilog extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Epilog",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\page\archive.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1$1 } = globals;
    const file$1 = "src\\page\\archive.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	child_ctx[22] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	child_ctx[24] = list;
    	child_ctx[22] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	child_ctx[22] = i;
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[26] = list[i];
    	child_ctx[22] = i;
    	return child_ctx;
    }

    // (74:4) {#if typeof selected_record == "number"}
    function create_if_block_1(ctx) {
    	let div0;
    	let txt0;
    	let t0_value = /*$archive*/ ctx[5].record[/*selected_record*/ ctx[1]].name + "";
    	let t0;
    	let t1;
    	let span;
    	let t2;
    	let t3_value = /*$archive*/ ctx[5].record[/*selected_record*/ ctx[1]].player_data.sugar + "";
    	let t3;
    	let t4;
    	let div2;
    	let div1;
    	let txt1;
    	let t5;
    	let txt1_class_value;
    	let t6;
    	let txt2;
    	let t7;
    	let txt2_class_value;
    	let t8;
    	let txt3;
    	let t9;
    	let txt3_class_value;
    	let t10;
    	let t11;
    	let t12;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*record_index*/ ctx[2] == "statistics" && create_if_block_7(ctx);
    	let if_block1 = /*record_index*/ ctx[2] == "card" && create_if_block_6(ctx);
    	let if_block2 = /*record_index*/ ctx[2] == "item" && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			txt0 = element("txt");
    			t0 = text(t0_value);
    			t1 = space();
    			span = element("span");
    			t2 = text(" 选项个数: ");
    			t3 = text(t3_value);
    			t4 = space();
    			div2 = element("div");
    			div1 = element("div");
    			txt1 = element("txt");
    			t5 = text("统计");
    			t6 = space();
    			txt2 = element("txt");
    			t7 = text("牌库");
    			t8 = space();
    			txt3 = element("txt");
    			t9 = text("物品");
    			t10 = space();
    			if (if_block0) if_block0.c();
    			t11 = space();
    			if (if_block1) if_block1.c();
    			t12 = space();
    			if (if_block2) if_block2.c();
    			add_location(txt0, file$1, 75, 8, 2351);
    			attr_dev(span, "class", "svelte-15aej55");
    			add_location(span, file$1, 76, 8, 2411);
    			attr_dev(div0, "class", "title svelte-15aej55");
    			add_location(div0, file$1, 74, 6, 2322);
    			attr_dev(txt1, "class", txt1_class_value = "" + (null_to_empty(/*record_index*/ ctx[2] == "statistics" && "selected") + " svelte-15aej55"));
    			add_location(txt1, file$1, 83, 10, 2619);
    			attr_dev(txt2, "class", txt2_class_value = "" + (null_to_empty(/*record_index*/ ctx[2] == "card" && "selected") + " svelte-15aej55"));
    			add_location(txt2, file$1, 87, 10, 2781);
    			attr_dev(txt3, "class", txt3_class_value = "" + (null_to_empty(/*record_index*/ ctx[2] == "item" && "selected") + " svelte-15aej55"));
    			add_location(txt3, file$1, 91, 10, 2931);
    			attr_dev(div1, "class", "record_index svelte-15aej55");
    			add_location(div1, file$1, 82, 8, 2581);
    			attr_dev(div2, "class", "record_body svelte-15aej55");
    			add_location(div2, file$1, 81, 6, 2546);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, txt0);
    			append_dev(txt0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, span);
    			append_dev(span, t2);
    			append_dev(span, t3);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, txt1);
    			append_dev(txt1, t5);
    			append_dev(div1, t6);
    			append_dev(div1, txt2);
    			append_dev(txt2, t7);
    			append_dev(div1, t8);
    			append_dev(div1, txt3);
    			append_dev(txt3, t9);
    			append_dev(div2, t10);
    			if (if_block0) if_block0.m(div2, null);
    			append_dev(div2, t11);
    			if (if_block1) if_block1.m(div2, null);
    			append_dev(div2, t12);
    			if (if_block2) if_block2.m(div2, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(txt1, "click", /*click_handler*/ ctx[10], false, false, false, false),
    					listen_dev(txt2, "click", /*click_handler_1*/ ctx[11], false, false, false, false),
    					listen_dev(txt3, "click", /*click_handler_2*/ ctx[12], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*$archive, selected_record*/ 34) && t0_value !== (t0_value = /*$archive*/ ctx[5].record[/*selected_record*/ ctx[1]].name + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty & /*$archive, selected_record*/ 34) && t3_value !== (t3_value = /*$archive*/ ctx[5].record[/*selected_record*/ ctx[1]].player_data.sugar + "")) set_data_dev(t3, t3_value);

    			if (!current || dirty & /*record_index*/ 4 && txt1_class_value !== (txt1_class_value = "" + (null_to_empty(/*record_index*/ ctx[2] == "statistics" && "selected") + " svelte-15aej55"))) {
    				attr_dev(txt1, "class", txt1_class_value);
    			}

    			if (!current || dirty & /*record_index*/ 4 && txt2_class_value !== (txt2_class_value = "" + (null_to_empty(/*record_index*/ ctx[2] == "card" && "selected") + " svelte-15aej55"))) {
    				attr_dev(txt2, "class", txt2_class_value);
    			}

    			if (!current || dirty & /*record_index*/ 4 && txt3_class_value !== (txt3_class_value = "" + (null_to_empty(/*record_index*/ ctx[2] == "item" && "selected") + " svelte-15aej55"))) {
    				attr_dev(txt3, "class", txt3_class_value);
    			}

    			if (/*record_index*/ ctx[2] == "statistics") {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_7(ctx);
    					if_block0.c();
    					if_block0.m(div2, t11);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*record_index*/ ctx[2] == "card") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*record_index*/ 4) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_6(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div2, t12);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*record_index*/ ctx[2] == "item") {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_2(ctx);
    					if_block2.c();
    					if_block2.m(div2, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div2);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(74:4) {#if typeof selected_record == \\\"number\\\"}",
    		ctx
    	});

    	return block;
    }

    // (97:8) {#if record_index == "statistics"}
    function create_if_block_7(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_value_3 = Object.keys(/*remark*/ ctx[6]);
    	validate_each_argument(each_value_3);
    	const get_key = ctx => /*i*/ ctx[22];
    	validate_each_keys(ctx, each_value_3, get_each_context_3, get_key);

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		let child_ctx = get_each_context_3(ctx, each_value_3, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_3(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "statistics svelte-15aej55");
    			add_location(div, file$1, 97, 10, 3141);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*window, $archive, selected_record, Object, remark*/ 98) {
    				each_value_3 = Object.keys(/*remark*/ ctx[6]);
    				validate_each_argument(each_value_3);
    				validate_each_keys(ctx, each_value_3, get_each_context_3, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_3, each_1_lookup, div, destroy_block, create_each_block_3, null, get_each_context_3);
    			}
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
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(97:8) {#if record_index == \\\"statistics\\\"}",
    		ctx
    	});

    	return block;
    }

    // (99:12) {#each Object.keys(remark) as s, i (i)}
    function create_each_block_3(key_1, ctx) {
    	let div;
    	let txt0;
    	let t0_value = /*remark*/ ctx[6][/*s*/ ctx[26]] + "";
    	let t0;
    	let t1;
    	let txt1;
    	let t2_value = window.retain(/*$archive*/ ctx[5].record[/*selected_record*/ ctx[1]].battle_data[/*s*/ ctx[26]], 0) + "";
    	let t2;
    	let t3;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			txt0 = element("txt");
    			t0 = text(t0_value);
    			t1 = space();
    			txt1 = element("txt");
    			t2 = text(t2_value);
    			t3 = space();
    			add_location(txt0, file$1, 100, 16, 3257);
    			add_location(txt1, file$1, 101, 16, 3297);
    			attr_dev(div, "class", "svelte-15aej55");
    			add_location(div, file$1, 99, 14, 3234);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, txt0);
    			append_dev(txt0, t0);
    			append_dev(div, t1);
    			append_dev(div, txt1);
    			append_dev(txt1, t2);
    			append_dev(div, t3);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*$archive, selected_record*/ 34 && t2_value !== (t2_value = window.retain(/*$archive*/ ctx[5].record[/*selected_record*/ ctx[1]].battle_data[/*s*/ ctx[26]], 0) + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(99:12) {#each Object.keys(remark) as s, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (112:8) {#if record_index == "card"}
    function create_if_block_6(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let each_value_2 = Object.unCount(/*$archive*/ ctx[5].record[/*selected_record*/ ctx[1]].player_data.card);
    	validate_each_argument(each_value_2);
    	const get_key = ctx => /*i*/ ctx[22];
    	validate_each_keys(ctx, each_value_2, get_each_context_2, get_key);

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		let child_ctx = get_each_context_2(ctx, each_value_2, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_2(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "card container svelte-15aej55");
    			add_location(div, file$1, 112, 10, 3603);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}

    			/*div_binding*/ ctx[13](div);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*Object, $archive, selected_record*/ 34) {
    				each_value_2 = Object.unCount(/*$archive*/ ctx[5].record[/*selected_record*/ ctx[1]].player_data.card);
    				validate_each_argument(each_value_2);
    				group_outros();
    				validate_each_keys(ctx, each_value_2, get_each_context_2, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_2, each_1_lookup, div, outro_and_destroy_block, create_each_block_2, null, get_each_context_2);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_2.length; i += 1) {
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

    			/*div_binding*/ ctx[13](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(112:8) {#if record_index == \\\"card\\\"}",
    		ctx
    	});

    	return block;
    }

    // (114:12) {#each Object.unCount($archive.record[selected_record].player_data.card) as c, i (i)}
    function create_each_block_2(key_1, ctx) {
    	let first;
    	let card;
    	let current;

    	card = new Card({
    			props: { key: /*c*/ ctx[23] },
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(card.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const card_changes = {};
    			if (dirty & /*$archive, selected_record*/ 34) card_changes.key = /*c*/ ctx[23];
    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(114:12) {#each Object.unCount($archive.record[selected_record].player_data.card) as c, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (119:8) {#if record_index == "item"}
    function create_if_block_2(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t0;
    	let t1;
    	let each_value_1 = Object.keys(/*$archive*/ ctx[5].record[/*selected_record*/ ctx[1]].player_data.collection);
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*i*/ ctx[22];
    	validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
    	}

    	let if_block0 = /*$archive*/ ctx[5].record[/*selected_record*/ ctx[1]].player_data.equipment && create_if_block_4(ctx);
    	let if_block1 = /*$archive*/ ctx[5].record[/*selected_record*/ ctx[1]].player_data.souvenir && create_if_block_3(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div, "class", "item container svelte-15aej55");
    			add_location(div, file$1, 119, 10, 3901);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}

    			append_dev(div, t0);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t1);
    			if (if_block1) if_block1.m(div, null);
    			/*div_binding_4*/ ctx[17](div);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*item, Object, $archive, selected_record, element_item*/ 170) {
    				each_value_1 = Object.keys(/*$archive*/ ctx[5].record[/*selected_record*/ ctx[1]].player_data.collection);
    				validate_each_argument(each_value_1);
    				validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, div, destroy_block, create_each_block_1, t0, get_each_context_1);
    			}

    			if (/*$archive*/ ctx[5].record[/*selected_record*/ ctx[1]].player_data.equipment) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					if_block0.m(div, t1);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*$archive*/ ctx[5].record[/*selected_record*/ ctx[1]].player_data.souvenir) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_3(ctx);
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			/*div_binding_4*/ ctx[17](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(119:8) {#if record_index == \\\"item\\\"}",
    		ctx
    	});

    	return block;
    }

    // (127:16) {#if $archive.record[selected_record].player_data.collection[c] > 1}
    function create_if_block_5(ctx) {
    	let txt;
    	let t_value = /*$archive*/ ctx[5].record[/*selected_record*/ ctx[1]].player_data.collection[/*c*/ ctx[23]] + "";
    	let t;

    	const block = {
    		c: function create() {
    			txt = element("txt");
    			t = text(t_value);
    			attr_dev(txt, "class", "svelte-15aej55");
    			add_location(txt, file$1, 127, 18, 4366);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, txt, anchor);
    			append_dev(txt, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$archive, selected_record*/ 34 && t_value !== (t_value = /*$archive*/ ctx[5].record[/*selected_record*/ ctx[1]].player_data.collection[/*c*/ ctx[23]] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(txt);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(127:16) {#if $archive.record[selected_record].player_data.collection[c] > 1}",
    		ctx
    	});

    	return block;
    }

    // (121:12) {#each Object.keys($archive.record[selected_record].player_data.collection) as c, i (i)}
    function create_each_block_1(key_1, ctx) {
    	let div;
    	let icon;
    	let icon_class_value;
    	let t;
    	let i = /*i*/ ctx[22];
    	let if_block = /*$archive*/ ctx[5].record[/*selected_record*/ ctx[1]].player_data.collection[/*c*/ ctx[23]] > 1 && create_if_block_5(ctx);
    	const assign_div = () => /*div_binding_1*/ ctx[14](div, i);
    	const unassign_div = () => /*div_binding_1*/ ctx[14](null, i);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			icon = element("icon");
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(icon, "class", icon_class_value = "icon-" + /*c*/ ctx[23] + " svelte-15aej55");
    			add_location(icon, file$1, 125, 16, 4230);
    			set_style(div, "background-color", "var(--" + /*item*/ ctx[7][/*c*/ ctx[23]].type + ")");
    			attr_dev(div, "class", "svelte-15aej55");
    			add_location(div, file$1, 121, 14, 4082);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, icon);
    			append_dev(div, t);
    			if (if_block) if_block.m(div, null);
    			assign_div();
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*$archive, selected_record*/ 34 && icon_class_value !== (icon_class_value = "icon-" + /*c*/ ctx[23] + " svelte-15aej55")) {
    				attr_dev(icon, "class", icon_class_value);
    			}

    			if (/*$archive*/ ctx[5].record[/*selected_record*/ ctx[1]].player_data.collection[/*c*/ ctx[23]] > 1) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_5(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*$archive, selected_record*/ 34) {
    				set_style(div, "background-color", "var(--" + /*item*/ ctx[7][/*c*/ ctx[23]].type + ")");
    			}

    			if (i !== /*i*/ ctx[22]) {
    				unassign_div();
    				i = /*i*/ ctx[22];
    				assign_div();
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			unassign_div();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(121:12) {#each Object.keys($archive.record[selected_record].player_data.collection) as c, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (136:12) {#if $archive.record[selected_record].player_data.equipment}
    function create_if_block_4(ctx) {
    	let div;
    	let icon;
    	let icon_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			icon = element("icon");
    			attr_dev(icon, "class", icon_class_value = "icon-" + /*$archive*/ ctx[5].record[/*selected_record*/ ctx[1]].player_data.equipment + " svelte-15aej55");
    			add_location(icon, file$1, 146, 16, 5075);
    			set_style(div, "background-color", "var(--" + /*item*/ ctx[7][/*$archive*/ ctx[5].record[/*selected_record*/ ctx[1]].player_data.equipment].type + ")");
    			attr_dev(div, "class", "svelte-15aej55");
    			add_location(div, file$1, 136, 14, 4681);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, icon);
    			/*div_binding_2*/ ctx[15](div);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$archive, selected_record*/ 34 && icon_class_value !== (icon_class_value = "icon-" + /*$archive*/ ctx[5].record[/*selected_record*/ ctx[1]].player_data.equipment + " svelte-15aej55")) {
    				attr_dev(icon, "class", icon_class_value);
    			}

    			if (dirty & /*$archive, selected_record*/ 34) {
    				set_style(div, "background-color", "var(--" + /*item*/ ctx[7][/*$archive*/ ctx[5].record[/*selected_record*/ ctx[1]].player_data.equipment].type + ")");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*div_binding_2*/ ctx[15](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(136:12) {#if $archive.record[selected_record].player_data.equipment}",
    		ctx
    	});

    	return block;
    }

    // (153:12) {#if $archive.record[selected_record].player_data.souvenir}
    function create_if_block_3(ctx) {
    	let div;
    	let icon;
    	let icon_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			icon = element("icon");
    			attr_dev(icon, "class", icon_class_value = "icon-" + /*$archive*/ ctx[5].record[/*selected_record*/ ctx[1]].player_data.souvenir + " svelte-15aej55");
    			add_location(icon, file$1, 163, 16, 5744);
    			set_style(div, "background-color", "var(--" + /*item*/ ctx[7][/*$archive*/ ctx[5].record[/*selected_record*/ ctx[1]].player_data.souvenir].type + ")");
    			attr_dev(div, "class", "svelte-15aej55");
    			add_location(div, file$1, 153, 14, 5347);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, icon);
    			/*div_binding_3*/ ctx[16](div);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$archive, selected_record*/ 34 && icon_class_value !== (icon_class_value = "icon-" + /*$archive*/ ctx[5].record[/*selected_record*/ ctx[1]].player_data.souvenir + " svelte-15aej55")) {
    				attr_dev(icon, "class", icon_class_value);
    			}

    			if (dirty & /*$archive, selected_record*/ 34) {
    				set_style(div, "background-color", "var(--" + /*item*/ ctx[7][/*$archive*/ ctx[5].record[/*selected_record*/ ctx[1]].player_data.souvenir].type + ")");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*div_binding_3*/ ctx[16](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(153:12) {#if $archive.record[selected_record].player_data.souvenir}",
    		ctx
    	});

    	return block;
    }

    // (176:4) {#if $archive.record.length == 0}
    function create_if_block$1(ctx) {
    	let txt;

    	const block = {
    		c: function create() {
    			txt = element("txt");
    			txt.textContent = "尚无游玩记录";
    			set_style(txt, "font-size", "30px");
    			set_style(txt, "font-family", "remark");
    			set_style(txt, "color", "#555");
    			add_location(txt, file$1, 176, 6, 6066);
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
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(176:4) {#if $archive.record.length == 0}",
    		ctx
    	});

    	return block;
    }

    // (179:4) {#each window.deepCopy($archive.record).reverse() as record, i (i)}
    function create_each_block(key_1, ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let txt0;
    	let t1_value = /*record*/ ctx[20].name + "";
    	let t1;
    	let t2;
    	let txt1;
    	let t3_value = /*record*/ ctx[20].player_data.chance.name + "";
    	let t3;
    	let t4;
    	let t5_value = /*record*/ ctx[20].time + "";
    	let t5;
    	let t6;
    	let mounted;
    	let dispose;

    	function click_handler_3(...args) {
    		return /*click_handler_3*/ ctx[19](/*i*/ ctx[22], ...args);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			txt0 = element("txt");
    			t1 = text(t1_value);
    			t2 = space();
    			txt1 = element("txt");
    			t3 = text(t3_value);
    			t4 = text(" • ");
    			t5 = text(t5_value);
    			t6 = space();
    			if (!src_url_equal(img.src, img_src_value = "/img/role/dairi/" + /*record*/ ctx[20].player_data.role + ".webp")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-15aej55");
    			add_location(img, file$1, 180, 8, 6290);
    			add_location(txt0, file$1, 182, 10, 6377);
    			attr_dev(txt1, "class", "time svelte-15aej55");
    			add_location(txt1, file$1, 183, 10, 6413);
    			add_location(div0, file$1, 181, 8, 6360);
    			attr_dev(div1, "class", "tip svelte-15aej55");
    			add_location(div1, file$1, 179, 6, 6229);
    			this.first = div1;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, txt0);
    			append_dev(txt0, t1);
    			append_dev(div0, t2);
    			append_dev(div0, txt1);
    			append_dev(txt1, t3);
    			append_dev(txt1, t4);
    			append_dev(txt1, t5);
    			append_dev(div1, t6);

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", click_handler_3, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*$archive*/ 32 && !src_url_equal(img.src, img_src_value = "/img/role/dairi/" + /*record*/ ctx[20].player_data.role + ".webp")) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*$archive*/ 32 && t1_value !== (t1_value = /*record*/ ctx[20].name + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*$archive*/ 32 && t3_value !== (t3_value = /*record*/ ctx[20].player_data.chance.name + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*$archive*/ 32 && t5_value !== (t5_value = /*record*/ ctx[20].time + "")) set_data_dev(t5, t5_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(179:4) {#each window.deepCopy($archive.record).reverse() as record, i (i)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div6;
    	let div0;
    	let t0;
    	let div2;
    	let div1;
    	let t2;
    	let t3;
    	let div3;
    	let t4;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t5;
    	let div4;
    	let t6;
    	let div5;
    	let div6_intro;
    	let div6_outro;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = typeof /*selected_record*/ ctx[1] == "number" && create_if_block_1(ctx);
    	let if_block1 = /*$archive*/ ctx[5].record.length == 0 && create_if_block$1(ctx);
    	let each_value = window.deepCopy(/*$archive*/ ctx[5].record).reverse();
    	validate_each_argument(each_value);
    	const get_key = ctx => /*i*/ ctx[22];
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div2 = element("div");
    			div1 = element("div");
    			div1.textContent = "×";
    			t2 = space();
    			if (if_block0) if_block0.c();
    			t3 = space();
    			div3 = element("div");
    			if (if_block1) if_block1.c();
    			t4 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			div4 = element("div");
    			t6 = space();
    			div5 = element("div");
    			div5.textContent = "右键回到标题界面";
    			attr_dev(div0, "class", "paper_close svelte-15aej55");
    			set_style(div0, "z-index", typeof /*selected_record*/ ctx[1] == 'number' ? 1 : -1);
    			add_location(div0, file$1, 66, 2, 2028);
    			attr_dev(div1, "class", "event_fold svelte-15aej55");
    			add_location(div1, file$1, 72, 4, 2216);
    			attr_dev(div2, "class", "paper svelte-15aej55");
    			add_location(div2, file$1, 71, 2, 2165);
    			attr_dev(div3, "class", "records");
    			add_location(div3, file$1, 174, 2, 5998);
    			attr_dev(div4, "class", "achievements");
    			add_location(div4, file$1, 190, 2, 6568);
    			attr_dev(div5, "class", "remind svelte-15aej55");
    			add_location(div5, file$1, 191, 2, 6604);
    			attr_dev(div6, "class", "body archive svelte-15aej55");
    			add_location(div6, file$1, 61, 0, 1930);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div0);
    			append_dev(div6, t0);
    			append_dev(div6, div2);
    			append_dev(div2, div1);
    			append_dev(div2, t2);
    			if (if_block0) if_block0.m(div2, null);
    			/*div2_binding*/ ctx[18](div2);
    			append_dev(div6, t3);
    			append_dev(div6, div3);
    			if (if_block1) if_block1.m(div3, null);
    			append_dev(div3, t4);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div3, null);
    				}
    			}

    			append_dev(div6, t5);
    			append_dev(div6, div4);
    			append_dev(div6, t6);
    			append_dev(div6, div5);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*foldPaper*/ ctx[8], false, false, false, false),
    					listen_dev(div1, "click", /*foldPaper*/ ctx[8], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*selected_record*/ 2) {
    				set_style(div0, "z-index", typeof /*selected_record*/ ctx[1] == 'number' ? 1 : -1);
    			}

    			if (typeof /*selected_record*/ ctx[1] == "number") {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*selected_record*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div2, null);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*$archive*/ ctx[5].record.length == 0) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					if_block1.m(div3, t4);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*seleteRecord, window, $archive*/ 544) {
    				each_value = window.deepCopy(/*$archive*/ ctx[5].record).reverse();
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div3, destroy_block, create_each_block, null, get_each_context);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);

    			add_render_callback(() => {
    				if (!current) return;
    				if (div6_outro) div6_outro.end(1);
    				div6_intro = create_in_transition(div6, fade, { duration: 250 });
    				div6_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			if (div6_intro) div6_intro.invalidate();
    			div6_outro = create_out_transition(div6, fade, { duration: 250 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			if (if_block0) if_block0.d();
    			/*div2_binding*/ ctx[18](null);
    			if (if_block1) if_block1.d();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (detaching && div6_outro) div6_outro.end();
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
    	let $archive;
    	validate_store(archive, 'archive');
    	component_subscribe($$self, archive, $$value => $$invalidate(5, $archive = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Archive', slots, []);

    	const remark = {
    		damage_total: "造成伤害总量",
    		damage_frequency: "造成伤害总次数",
    		max_damage: "造成的最高伤害",
    		hurt_total: "受到伤害总量",
    		hurt_frequency: "受到伤害总次数",
    		max_hurt: "受到的最高伤害",
    		cost_total: "消耗灵力总数",
    		punch_count: "打出手牌总数",
    		battle_count: "战斗总次数",
    		round_total: "回合总数",
    		defeat_total: "击败敌人总数",
    		max_lv: "敌人最高等级",
    		coin_reward_total: "获得硬币总数",
    		collection_reward_total: "获得收藏品总数"
    	};

    	let element_paper;
    	let selected_record;
    	let record_index = "statistics";
    	const element_item = [];
    	const element_container = {};
    	const item = {};
    	Object.assign(item, data.collection);
    	Object.assign(item, data.equipment);
    	Object.assign(item, data.souvenir);

    	onMount(function () {
    		$$invalidate(0, element_paper.style.top = `${document.body.clientHeight}px`, element_paper);
    		$$invalidate(0, element_paper.style.transition = "0.3s", element_paper);
    	});

    	afterUpdate(_ => {
    		for (let element in element_container) {
    			if (element_container[element]) $$invalidate(
    				4,
    				element_container[element].ontouchstart = function (event) {
    					let originX = event.touches[0].pageX;
    					let scrollTop = element_container[element].scrollTop;

    					$$invalidate(
    						4,
    						element_container[element].ontouchmove = function (e) {
    							let x = e.touches[0].pageX;
    							$$invalidate(4, element_container[element].scrollTop = scrollTop + x - originX, element_container);
    						},
    						element_container
    					);
    				},
    				element_container
    			);
    		}
    	});

    	function foldPaper() {
    		$$invalidate(0, element_paper.style.top = `${document.body.clientHeight}px`, element_paper);
    		$$invalidate(1, selected_record = null);
    	}

    	function seleteRecord(i) {
    		$$invalidate(0, element_paper.style.top = `${document.body.clientHeight - 640}px`, element_paper);
    		$$invalidate(1, selected_record = i);
    	}

    	const writable_props = [];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Archive> was created with unknown prop '${key}'`);
    	});

    	const click_handler = _ => $$invalidate(2, record_index = "statistics");
    	const click_handler_1 = _ => $$invalidate(2, record_index = "card");
    	const click_handler_2 = _ => $$invalidate(2, record_index = "item");

    	function div_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_container.card = $$value;
    			$$invalidate(4, element_container);
    		});
    	}

    	function div_binding_1($$value, i) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_item[i] = $$value;
    			$$invalidate(3, element_item);
    		});
    	}

    	function div_binding_2($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_item[Object.keys($archive.record[selected_record].player_data.collection).length] = $$value;
    			$$invalidate(3, element_item);
    		});
    	}

    	function div_binding_3($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_item[Object.keys($archive.record[selected_record].player_data.collection).length + 1] = $$value;
    			$$invalidate(3, element_item);
    		});
    	}

    	function div_binding_4($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_container.item = $$value;
    			$$invalidate(4, element_container);
    		});
    	}

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_paper = $$value;
    			$$invalidate(0, element_paper);
    		});
    	}

    	const click_handler_3 = (i, _) => seleteRecord(i);

    	$$self.$capture_state = () => ({
    		onMount,
    		beforeUpdate,
    		afterUpdate,
    		fade,
    		scale,
    		Explain,
    		archive,
    		Admin,
    		setting,
    		explore,
    		page,
    		Card,
    		Data: data,
    		remark,
    		element_paper,
    		selected_record,
    		record_index,
    		element_item,
    		element_container,
    		item,
    		foldPaper,
    		seleteRecord,
    		$archive
    	});

    	$$self.$inject_state = $$props => {
    		if ('element_paper' in $$props) $$invalidate(0, element_paper = $$props.element_paper);
    		if ('selected_record' in $$props) $$invalidate(1, selected_record = $$props.selected_record);
    		if ('record_index' in $$props) $$invalidate(2, record_index = $$props.record_index);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		element_paper,
    		selected_record,
    		record_index,
    		element_item,
    		element_container,
    		$archive,
    		remark,
    		item,
    		foldPaper,
    		seleteRecord,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		div_binding,
    		div_binding_1,
    		div_binding_2,
    		div_binding_3,
    		div_binding_4,
    		div2_binding,
    		click_handler_3
    	];
    }

    class Archive extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Archive",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1 } = globals;
    const file = "src\\App.svelte";

    // (261:1) {#if $page != "Index"}
    function create_if_block(ctx) {
    	let icon;

    	const block = {
    		c: function create() {
    			icon = element("icon");
    			attr_dev(icon, "class", "icon-menu menu svelte-te9i3z");
    			add_location(icon, file, 261, 2, 6559);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, icon, anchor);
    			/*icon_binding*/ ctx[5](icon);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(icon);
    			/*icon_binding*/ ctx[5](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(261:1) {#if $page != \\\"Index\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let switch_instance;
    	let t0;
    	let msg;
    	let t1;
    	let menu;
    	let t2;
    	let explain;
    	let t3;
    	let reward;
    	let t4;
    	let current;
    	let mounted;
    	let dispose;
    	var switch_value = /*render*/ ctx[4][/*$page*/ ctx[2]];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    	}

    	msg = new Msg_1({ $$inline: true });
    	menu = new Menu({ $$inline: true });
    	explain = new Explain_1({ $$inline: true });
    	reward = new Reward({ $$inline: true });
    	let if_block = /*$page*/ ctx[2] != "Index" && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			t0 = space();
    			create_component(msg.$$.fragment);
    			t1 = space();
    			create_component(menu.$$.fragment);
    			t2 = space();
    			create_component(explain.$$.fragment);
    			t3 = space();
    			create_component(reward.$$.fragment);
    			t4 = space();
    			if (if_block) if_block.c();
    			attr_dev(div, "id", "root");
    			attr_dev(div, "class", "svelte-te9i3z");
    			add_location(div, file, 254, 0, 6369);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (switch_instance) mount_component(switch_instance, div, null);
    			append_dev(div, t0);
    			mount_component(msg, div, null);
    			append_dev(div, t1);
    			mount_component(menu, div, null);
    			append_dev(div, t2);
    			mount_component(explain, div, null);
    			append_dev(div, t3);
    			mount_component(reward, div, null);
    			append_dev(div, t4);
    			if (if_block) if_block.m(div, null);
    			/*div_binding*/ ctx[6](div);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(
    					div,
    					"contextmenu",
    					function () {
    						if (is_function(/*$Admin*/ ctx[3].menu)) /*$Admin*/ ctx[3].menu.apply(this, arguments);
    					},
    					false,
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*$page*/ 4 && switch_value !== (switch_value = /*render*/ ctx[4][/*$page*/ ctx[2]])) {
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
    					mount_component(switch_instance, div, t0);
    				} else {
    					switch_instance = null;
    				}
    			}

    			if (/*$page*/ ctx[2] != "Index") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			transition_in(msg.$$.fragment, local);
    			transition_in(menu.$$.fragment, local);
    			transition_in(explain.$$.fragment, local);
    			transition_in(reward.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			transition_out(msg.$$.fragment, local);
    			transition_out(menu.$$.fragment, local);
    			transition_out(explain.$$.fragment, local);
    			transition_out(reward.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (switch_instance) destroy_component(switch_instance);
    			destroy_component(msg);
    			destroy_component(menu);
    			destroy_component(explain);
    			destroy_component(reward);
    			if (if_block) if_block.d();
    			/*div_binding*/ ctx[6](null);
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
    	let $explore;
    	let $data;
    	let $page;
    	let $Admin;
    	let $frameEvent;
    	let $archive;
    	validate_store(explore, 'explore');
    	component_subscribe($$self, explore, $$value => $$invalidate(7, $explore = $$value));
    	validate_store(data$1, 'data');
    	component_subscribe($$self, data$1, $$value => $$invalidate(8, $data = $$value));
    	validate_store(page, 'page');
    	component_subscribe($$self, page, $$value => $$invalidate(2, $page = $$value));
    	validate_store(Admin, 'Admin');
    	component_subscribe($$self, Admin, $$value => $$invalidate(3, $Admin = $$value));
    	validate_store(frameEvent, 'frameEvent');
    	component_subscribe($$self, frameEvent, $$value => $$invalidate(9, $frameEvent = $$value));
    	validate_store(archive, 'archive');
    	component_subscribe($$self, archive, $$value => $$invalidate(10, $archive = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	set_store_value(Admin, $Admin.data = $data, $Admin);
    	set_store_value(Admin, $Admin.save = save, $Admin);
    	if (localStorage.getItem("archive") == null) localStorage.setItem("archive", JSON.stringify($archive)); else set_store_value(archive, $archive = JSON.parse(localStorage.getItem("archive")), $archive);

    	const render = {
    		Index: Page,
    		Foreword,
    		Explore,
    		Battle,
    		Afflatus,
    		Reward,
    		Epilog,
    		Archive
    	};

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

    	window.retain = function (value, n) {
    		if (n === "null" || n === "undefined" || n === 0) return parseInt(value);
    		let tran = Math.round(value * Math.pow(10, n)) / Math.pow(10, n);
    		let tranV = tran.toString();
    		let newVal = tranV.indexOf(".");

    		if (newVal < 0) {
    			tranV += ".";
    		}

    		for (let i = tranV.length - tranV.indexOf("."); i <= n; i++) {
    			tranV += "0";
    		}

    		return tranV;
    	};

    	window._void = function () {
    		
    	};

    	String.prototype.getByteLen = function () {
    		let len = 0;

    		for (let i = 0; i < this.length; i++) {
    			this.charCodeAt(i) < 256 ? len += 1 : len += 2;
    		}

    		return len;
    	};

    	String.prototype.increaseOf = function (obj) {
    		if (this in obj) obj[this]++; else obj[this] = 1;
    	};

    	String.prototype.decreaseOf = function (obj) {
    		if (obj[this] == 1) delete obj[this]; else obj[this]--;
    	};

    	Array.prototype.isIncludedBy = function (arr) {
    		return this.filter(i => arr.includes(i)).length == this.length;
    	};

    	Array.prototype.index = function (f) {
    		this.forEach((_, i) => f(i));
    	};

    	Array.prototype.set = function (v) {
    		this.index(i => this[i] = v);
    	};

    	Array.prototype.rd = function () {
    		for (var j, x, i = this.length; i; (j = parseInt(Math.random() * i), x = this[--i], this[i] = this[j], this[j] = x)) ;
    		return this;
    	};

    	Array.prototype.sum = function () {
    		let res = 0;
    		for (let i of this) res += i;
    		return res;
    	};

    	Array.prototype.count = function () {
    		let res = {};
    		for (let i of this) i.increaseOf(res);
    		return res;
    	};

    	Object.unCount = function (obj) {
    		let res = [];
    		Object.keys(obj).forEach(c => [...Array(obj[c]).keys()].forEach(_ => res.push(c)));
    		return res;
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

    	frameEvent.set({
    		list: {},
    		add(k, f, t) {
    			this.list[k] = {
    				handle: f,
    				time: t,
    				left: t,
    				pause: false
    			};
    		},
    		clear(k) {
    			if (k) delete this.list[k]; else this.list = {};
    		},
    		pause(k) {
    			
    		}
    	});

    	setInterval(
    		_ => {
    			let list = $frameEvent.list;

    			for (let e in list) {
    				if (list[e].left == 1) {
    					list[e].left = list[e].time;
    					list[e].handle();
    				} else list[e].left--;
    			}
    		},
    		16
    	);

    	window.onclick = save;
    	let element_menu;
    	let element_root;
    	let sUserAgent = navigator.userAgent;
    	set_store_value(Admin, $Admin.mobile = sUserAgent.indexOf("Android") > -1 || sUserAgent.indexOf("iPhone") > -1 || sUserAgent.indexOf("iPad") > -1 || sUserAgent.indexOf("iPod") > -1 || sUserAgent.indexOf("Symbian") > -1, $Admin);

    	onMount(function () {
    		if ($Admin.mobile) {
    			let percent = document.body.clientWidth / 700;
    			set_store_value(Admin, $Admin.mobile = percent, $Admin);
    			$$invalidate(1, element_root.style.transform = `rotate(90deg)scale(${percent})`, element_root);
    			$$invalidate(1, element_root.style.width = `${document.body.clientHeight / percent}px`, element_root);
    			$$invalidate(1, element_root.style.height = "700px", element_root);
    			$$invalidate(1, element_root.style.overflow = "visible", element_root);

    			$frameEvent.add(
    				"mobile",
    				function () {
    					for (let e of document.getElementsByClassName("body")) {
    						e.style.width = `${document.body.clientHeight / percent}px`;
    					}
    				},
    				5
    			);
    		}
    	});

    	afterUpdate(function () {
    		if (element_menu) {
    			$$invalidate(0, element_menu.onclick = $Admin.menu, element_menu);
    			$$invalidate(0, element_menu.ontouchstart = $Admin.menu, element_menu);
    		}
    	});

    	window.Admin = $Admin;

    	function save() {
    		if ($page != "Index") {
    			localStorage.setItem("data", JSON.stringify($data));
    			localStorage.setItem("explore", JSON.stringify($explore));
    		}
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function icon_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_menu = $$value;
    			$$invalidate(0, element_menu);
    		});
    	}

    	function div_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element_root = $$value;
    			$$invalidate(1, element_root);
    		});
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		afterUpdate,
    		Msg: Msg_1,
    		Menu,
    		Explain: Explain_1,
    		Index: Page,
    		Foreword,
    		Explore,
    		Battle,
    		Afflatus,
    		Reward,
    		Epilog,
    		Archive,
    		page,
    		frameEvent,
    		Admin,
    		data: data$1,
    		explore,
    		archive,
    		render,
    		RAF,
    		element_menu,
    		element_root,
    		sUserAgent,
    		save,
    		$explore,
    		$data,
    		$page,
    		$Admin,
    		$frameEvent,
    		$archive
    	});

    	$$self.$inject_state = $$props => {
    		if ('element_menu' in $$props) $$invalidate(0, element_menu = $$props.element_menu);
    		if ('element_root' in $$props) $$invalidate(1, element_root = $$props.element_root);
    		if ('sUserAgent' in $$props) sUserAgent = $$props.sUserAgent;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [element_menu, element_root, $page, $Admin, render, icon_binding, div_binding];
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
