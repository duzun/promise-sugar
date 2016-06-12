/**
 *  Promise syncatctic sugar - no need to write ".then"
 *
 *  @license MIT
 *  @version 1.4.2
 *  @git https://github.com/duzun/promise-sugar
 *  @umd AMD, Browser, CommonJs
 *  @author DUzun.Me
 */

/*global Promise */
;(function (name, global) {
    "use strict";
    var undefined //jshint ignore:line
    ,   UNDEFINED = undefined + ''
    ,   VERSION = '1.4.2'
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
        var isArray = Array.isArray || function isArray(val) {
            return val instanceof Array;
        };
        // -------------------------------------------------------------

        function sweeten(p) {
            // new Promise(p) - [[Construct]]
            if ( this instanceof sweeten ) {
                return sweeten(new Promise(p));
            }

            // Make sure p is a thenable
            if ( !_isThenable(p) ) {
                p = Promise.resolve(p);
            }

            then.then = then;

            var PromisePrototype = Promise.prototype;

            // then.__proto__ = PromisePrototype; // not sure this is a good idea

            // an alternative to setting then.__proto__:
            then.constructor = Promise;

            // Promise/A+
            then.catch   = _catch  ;

            // Q
            then.finally = _finally;

            if ( 'progress' in PromisePrototype ) {
                then.progress = PromisePrototype.progress;
            }

            return then;

            function then(onResolve, onReject, onNotify) {
                if ( _isThenable(onResolve) ) {
                    onResolve = _constant(onResolve);
                }
                if ( _isThenable(onReject) ) {
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
        sweeten.resolve = function resolve(val) { return sweeten(Promise.resolve(val)); };
        sweeten.reject  = function  reject(val) { return sweeten(Promise.reject(val)); };
        sweeten.race    = function    race(val) { return sweeten(Promise.race(val)); };
        sweeten.all     = function     all(val) { return sweeten(Promise.all(val)); };

        sweeten.allValues = function allValues(val) {
            if ( isArray(val) ) return sweeten.all(val);

            var keys = Object.keys(val);
            var len  = keys.length;
            var values = new Array(len);
            var isIndexed = val.length === len;
            for ( var i=0, k; i<len; i++) {
                k = keys[i];
                if ( k != i ) isIndexed = false;
                values[i] = val[k];
            }
            var prom = sweeten.all(values);
            if ( !isIndexed ) {
                prom = prom(function (values) {
                    var ret = {};
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
            var defer = Promise.defer || _defer;
            var defered = defer.call(Promise);
            defered.promise = sweeten(defered.promise);
            return defered;
        };

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
                    return sweeten.all(arguments)(function (a) { return fn.apply(ctx, a); });
                }
                : function () {
                    var ctx = this;
                    return sweeten.all(arguments)(function (a) { return fn.apply(ctx, a); });
                }
            ;
        };

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

        // -------------------------------------------------------------
        // Helpers:
        // -------------------------------------------------------------
        function _isThenable(p) {
            return p && p.then && typeof p.then === 'function';
        }

        function _constant(val) {
            return function(){ return val; };
        }

    });
}
('sweeten', typeof global == 'undefined' ? this : global));
