/**
 *  Promise syntactic sugar - no need to write ".then"
 *
 *  @license MIT
 *  @version 2.2.0
 *  @git https://github.com/duzun/promise-sugar
 *  @umd AMD, Browser, CommonJs
 *  @author Dumitru Uzun (DUzun.Me)
 */

/*globals globalThis, window, global, self */

const VERSION = '2.2.0';

// -------------------------------------------------------------
let nativePromise = typeof Promise != 'undefined' ? Promise : (typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {}).Promise;
// -------------------------------------------------------------
var isArray = Array.isArray || function isArray(val) {
    return val instanceof Array;
};
// -------------------------------------------------------------

export default function sweeten(p) {
    // new Promise(p) - [[Construct]]
    if ( this instanceof sweeten ) {
        return sweeten(new nativePromise(p));
    }

    // Make sure p is a thenable
    if ( !isThenable(p) ) {
        p = nativePromise.resolve(p);
    }

    then.then = then;

    let PromisePrototype = nativePromise.prototype;

    // then.__proto__ = PromisePrototype; // not sure this is a good idea

    // an alternative to setting then.__proto__:
    then.constructor = nativePromise;

    // Promise/A+
    then.catch   = _catch  ;

    // Q
    then.finally = _finally;

    // Goodies
    then.timeout = _timeout;

    if ( 'progress' in PromisePrototype ) {
        then.progress = PromisePrototype.progress;
    }

    return then;

    function then(onResolve, onReject, onNotify) {
        if ( isThenable(onResolve) ) {
            arguments[0] =
            onResolve = _constant(onResolve);
        }
        if ( isThenable(onReject) ) {
            arguments[1] =
            onReject = _constant(onReject);
        }
        return sweeten(p.then.apply(p, arguments));
    }
}

// -------------------------------------------------------------
function _catch(onReject) {
    return this.then(undefined, onReject);
}

// -------------------------------------------------------------
function _finally(callback) {
    return this.then(
        (value) => resolver().then(() => value),
        (reason) => resolver().then(() => { throw reason; })
    );
    function resolver() {
        return sweeten.resolve(callback());
    }
}
// -------------------------------------------------------------
/**
 * Timeout a promise
 *
 * @param  int expires how long to wait for `promise` in ms
 * @param  bool throws If true, throw on timeout
 * @return Promise resolves before `expires` or rejects with timeout error
 */
function _timeout(expires, throws=true) {
    const promise = this;
    let waiter = nWait(expires);
    const { stop } = waiter;
    if ( throws ) {
        waiter = waiter.then(() => {
            const error = new Error('Promise Timeout');
            error.promise = promise;
            throw error;
        });
    }
    promise.then(() => stop().catch(_constant)); // no need to keep the waiter promise
    return sweeten.race([promise, waiter]);
}

// -------------------------------------------------------------
function _defer() {
    var result = {};
    result.promise = new nativePromise((resolve, reject, notify) => {
        result.resolve = resolve;
        result.reject  = reject;

        // Q
        if ( notify ) {
            result.notify = notify;
        }
    });
    return result;
}
// -------------------------------------------------------------
// Some more sugar:
sweeten.resolve = function resolve(val) { return sweeten(nativePromise.resolve(val)); };
sweeten.reject  = function  reject(val) { return sweeten(nativePromise.reject(val)); };
sweeten.race    = function    race(val) { return sweeten(nativePromise.race(val)); };
sweeten.all     = function     all(val) { return sweeten(nativePromise.all(val)); };

sweeten.any     = function     any(val) {
    const prom = nativePromise.any ? nativePromise.any(val) : new nativePromise((resolve, reject) => {
        let errors = [];
        let count = 0;
        function onReject(error) {
            errors.push(error);
            if(!--count) reject(errors);
        }
        if(!isArray(val)) val = Array.from(val);
        val.forEach((p) => {
            ++count;
            if(!isThenable(p)) p = nativePromise.resolve(p);
            p.then(resolve, onReject);
        });
        // for(let p of val) {
        //     ++count;
        //     if(!isThenable(p)) p = nativePromise.resolve(p);
        //     p.then(resolve, onReject);
        // }
    });
    return sweeten(prom);
};

sweeten.allValues = function allValues(val) {
    if ( isArray(val) ) return sweeten.all(val);

    const keys = Object.keys(val);
    const len  = keys.length;
    const values = new Array(len);
    let isIndexed = val.length === len;
    for ( var i=0, k; i<len; i++) {
        k = keys[i];
        if ( k != i ) isIndexed = false;
        values[i] = val[k];
    }
    let prom = sweeten.all(values);
    if ( !isIndexed ) {
        prom = prom(function (values) {
            let ret = {};
            for ( var i=0; i<len; i++) {
                ret[keys[i]] = values[i];
            }
            return ret;
        });
    }
    return prom;
};

sweeten.when    = sweeten;
sweeten.defer   = function defer() {
    const defer = nativePromise.defer || _defer;
    const deferred = defer.call(nativePromise);
    deferred.promise = sweeten(deferred.promise);
    return deferred;
};

sweeten.wait = wait;
sweeten.isThenable = isThenable;

/**
 * Make an ordinary function sweet for promises.
 *
 * @param  {Function} fn A function that returns any value or Promise
 * @param  {Any} ctx Context of fn (this)
 *
 * @return {Function} equivalent of fn that always returns a sweeten Promise
 */
sweeten.fn = function fn(fn, ctx) {
    return arguments.length > 1
        ? function () {
            return sweeten.all(arguments)((a) => fn.apply(ctx, a));
        }
        : function () {
            var ctx = this;
            return sweeten.all(arguments)((a) => fn.apply(ctx, a));
        }
    ;
};

// -------------------------------------------------------------
/// Use a custom Promise implementation
function usePromise(PromiseConstructor) {
    nativePromise = PromiseConstructor;
}

// -------------------------------------------------------------
sweeten.usePromise = usePromise;
sweeten.VERSION    = VERSION;

// -------------------------------------------------------------
// Helpers:
// -------------------------------------------------------------

function nWait(timeout) {
    var stop;
    const waiter = new nativePromise((resolve, reject) => {
        let id = setTimeout(resolve, timeout);
        stop = (execute) => {
            if(id) {
                clearTimeout(id);
                execute ? resolve(id) : reject(id);
                id = undefined;
            }
            return waiter;
        }
    });
    waiter.stop = stop;
    return waiter;
}

function wait(timeout) {
    let waiter = nWait(timeout);
    const { stop } = waiter;
    waiter = sweeten(waiter);
    waiter.stop = stop;
    return waiter;
}

function isThenable(p) {
    return p && typeof p.then === 'function';
}

function _constant(val) {
    return () => val;
}
