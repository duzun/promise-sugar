/**
 *  Promise syncatctic sugar - no need to write ".then"
 *
 *  @license MIT
 *  @version 1.1.1
 *  @git https://github.com/duzun/promise-sugar
 *  @umd AMD, Browser, CommonJs
 *  @author DUzun.Me
 */

/*global Promise */
;(function (name, global) {
    var undefined
    ,   UNDEFINED = undefined + ''
    ,   VERSION = '1.1.1'
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
            if ( this instanceof sweeten ) {
                return sweeten(new Promise(p));
            }

            // Make sure p is a thenable
            if ( !(p && p.then && typeof p.then === 'function') ) {
                p = Promise.resolve(p);
            }

            then.then = then;

            var PromisePrototype = Promise.prototype;

            // then.__proto__ = PromisePrototype; // not sure this is a good idea

            // an alternative to setting then.__proto__:
            then.constructor = Promise;

            // Promise/A+
            then.catch   = 'catch'   in PromisePrototype ? PromisePrototype.catch   : _catch  ;

            // Q
            then.finally = 'finally' in PromisePrototype ? PromisePrototype.finally : _finally;

            if ( 'progress' in PromisePrototype ) {
                then.progress = PromisePrototype.progress;
            }

            return then;

            function then(onResolve, onReject, onNotify) {
                return sweeten(p.then.apply(p, arguments));
            }
        }

        // -------------------------------------------------------------
        function _catch(reject) {
            return this.then(undefined, reject);
        }

        function _finally(callback) {
            return this.then(
                function(value) {
                    return resolver().then(function() { return value; });
                },
                function(reason) {
                    return resolver().then(function() { throw reason; });
                }
            );
            function resolver() {
                return sweeten.resolve(callback());
            }
        }
        // -------------------------------------------------------------
        function _defer() {
            var result = {};
            result.promise = new Promise(function(resolve, reject, notify) {
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
        sweeten.resolve = function (val) { return sweeten(Promise.resolve(val)); };
        sweeten.reject  = function (val) { return sweeten(Promise.reject(val)); };
        sweeten.all     = function (val) { return sweeten(Promise.all(val)); };
        sweeten.race    = function (val) { return sweeten(Promise.race(val)); };

        sweeten.when    = sweeten;
        sweeten.defer   = Promise.defer || _defer;
        // -------------------------------------------------------------
        // Use a custom Promise implementation
        function usePromise(PromiseConstructor) {
            Promise = PromiseConstructor;
        }

        // -------------------------------------------------------------
        sweeten.usePromise = usePromise;
        sweeten.VERSION    = VERSION;
        // -------------------------------------------------------------
        return sweeten;
    });
}
('sweeten', typeof global == 'undefined' ? this : global));
