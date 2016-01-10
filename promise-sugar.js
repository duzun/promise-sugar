/**
 *  Promise syncatctic sugar - no need to write ".then"
 *
 *  @license MIT
 *  @version 1.0.2
 *  @git https://github.com/duzun/promise-sugar
 *  @umd AMD, Browser, CommonJs
 *  @author DUzun.Me
 */

/*global Promise */
;(function (name, global) {
    var undefined
    ,   UNDEFINED = undefined + ''
    ,   VERSION = '1.0.2'
    ;
    (typeof define != 'function' || !define.amd
        ? typeof module != UNDEFINED && module.exports
            ? function (deps, factory) { module.exports = factory(); } // CommonJs
            : function (deps, factory) { global[name] = factory(); } // Browser
        : define // AMD
    )
    /*define*/([], function factory() {
        // -------------------------------------------------------------
        var Promise = global.Promise;
        // -------------------------------------------------------------

        function sweeten(p) {
            // new Promise(p) - [[Construct]]
            if ( typeof p == 'function' ) {
                return sweeten(new Promise(p));
            }

            // Make sure p is a thenable
            if ( !(p && p.then && typeof p.then === 'function') ) {
                p = Promise.resolve(p);
            }

            then.then = then;

            // then.__proto__ = Promise.prototype; // not sure this is a good idea

            // an alternative to setting then.__proto__:
            then.constructor = Promise;
            then.catch = Promise.prototype.catch; // some sugar
            // then.catch = function (reject) { return this.then(undefined, reject); }

            return then;

            function then(onResolve, onReject) {
                return sweeten(p.then(onResolve, onReject));
            }
        }

        // -------------------------------------------------------------
        // Some more sugar:
        sweeten.resolve = function (val) { return sweeten(Promise.resolve(val)); };
        sweeten.reject  = function (val) { return sweeten(Promise.reject(val)); };
        sweeten.all     = function (val) { return sweeten(Promise.all(val)); };
        sweeten.race    = function (val) { return sweeten(Promise.race(val)); };

        // -------------------------------------------------------------
        // Use a custom Promise implementation
        function usePromise(PromiseConstructor) {
            Promise = PromiseConstructor;
        }

        // -------------------------------------------------------------
        sweeten.usePromise = usePromise;
        sweeten.VERSION = VERSION;
        // -------------------------------------------------------------
        return sweeten;
    });
}
('sweeten', typeof global == 'undefined' ? this : global));
