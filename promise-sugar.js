/**
 *  Promise syncatctic sugar - no need to write ".then"
 *
 *  @license MIT
 *  @version 1.0.0
 *  @git https://github.com/duzun/promise-sugar
 *  @umd AMD, Browser, CommonJs
 *  @author DUzun.Me
 */
/*global Promise */
;(function (name, global) {
    var undefined
    ,   UNDEFINED = undefined + NIL
    ,   FUNCTION = 'function'
    ;
    (typeof define != FUNCTION || !define.amd
        ? typeof module != UNDEFINED && module.exports
            ? function (deps, factory) { module.exports = factory(); } // CommonJs
            : function (deps, factory) { global[name] = factory(); } // Browser
        : define // AMD
    )
    /*define*/([], function factory() {
        // -------------------------------------------------------------

        function sweeten(p) {
            // new Promise(p)
            if ( typeof p == FUNCTION ) {
                return sweeten(new Promise(p));
            }

            // Make sure p is a thenable
            if ( !(p && p.then && typeof p.then === FUNCTION) ) {
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

        return sweeten;
    });
}
('sweeten', typeof global == 'undefined' ? this : global));
