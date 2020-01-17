(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = global || self, global.sweeten = factory());
}(this, (function () { 'use strict';

    /**
     *  Promise syntactic sugar - no need to write ".then"
     *
     *  @license MIT
     *  @version 2.0.2
     *  @git https://github.com/duzun/promise-sugar
     *  @umd AMD, Browser, CommonJs
     *  @author Dumitru Uzun (DUzun.Me)
     */

    /*globals globalThis, window, global, self */
    var VERSION = '2.0.2'; // -------------------------------------------------------------

    var nativePromise = typeof Promise != 'undefined' ? Promise : (typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {}).Promise; // -------------------------------------------------------------

    var isArray = Array.isArray || function isArray(val) {
      return val instanceof Array;
    }; // -------------------------------------------------------------


    function sweeten(p) {
      // new Promise(p) - [[Construct]]
      if (this instanceof sweeten) {
        return sweeten(new nativePromise(p));
      } // Make sure p is a thenable


      if (!isThenable(p)) {
        p = nativePromise.resolve(p);
      }

      then.then = then;
      var PromisePrototype = nativePromise.prototype; // then.__proto__ = PromisePrototype; // not sure this is a good idea
      // an alternative to setting then.__proto__:

      then.constructor = nativePromise; // Promise/A+

      then["catch"] = _catch; // Q

      then["finally"] = _finally;

      if ('progress' in PromisePrototype) {
        then.progress = PromisePrototype.progress;
      }

      return then;

      function then(onResolve, onReject, onNotify) {
        if (isThenable(onResolve)) {
          onResolve = _constant(onResolve);
        }

        if (isThenable(onReject)) {
          onReject = _constant(onReject);
        }

        return sweeten(p.then.apply(p, arguments));
      }
    } // -------------------------------------------------------------

    function _catch(onReject) {
      return this.then(undefined, onReject);
    } // -------------------------------------------------------------


    function _finally(callback) {
      return this.then(function (value) {
        return resolver().then(function () {
          return value;
        });
      }, function (reason) {
        return resolver().then(function () {
          throw reason;
        });
      });

      function resolver() {
        return sweeten.resolve(callback());
      }
    } // -------------------------------------------------------------


    function _defer() {
      var result = {};
      result.promise = new nativePromise(function (resolve, reject, notify) {
        result.resolve = resolve;
        result.reject = reject; // Q

        if (notify) {
          result.notify = notify;
        }
      });
      return result;
    } // -------------------------------------------------------------
    // Some more sugar:


    sweeten.resolve = function resolve(val) {
      return sweeten(nativePromise.resolve(val));
    };

    sweeten.reject = function reject(val) {
      return sweeten(nativePromise.reject(val));
    };

    sweeten.race = function race(val) {
      return sweeten(nativePromise.race(val));
    };

    sweeten.all = function all(val) {
      return sweeten(nativePromise.all(val));
    };

    sweeten.allValues = function allValues(val) {
      if (isArray(val)) return sweeten.all(val);
      var keys = Object.keys(val);
      var len = keys.length;
      var values = new Array(len);
      var isIndexed = val.length === len;

      for (var i = 0, k; i < len; i++) {
        k = keys[i];
        if (k != i) isIndexed = false;
        values[i] = val[k];
      }

      var prom = sweeten.all(values);

      if (!isIndexed) {
        prom = prom(function (values) {
          var ret = {};

          for (var i = 0; i < len; i++) {
            ret[keys[i]] = values[i];
          }

          return ret;
        });
      }

      return prom;
    };

    sweeten.when = sweeten;

    sweeten.defer = function defer() {
      var defer = nativePromise.defer || _defer;
      var deferred = defer.call(nativePromise);
      deferred.promise = sweeten(deferred.promise);
      return deferred;
    };

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
      return arguments.length > 1 ? function () {
        return sweeten.all(arguments)(function (a) {
          return fn.apply(ctx, a);
        });
      } : function () {
        var ctx = this;
        return sweeten.all(arguments)(function (a) {
          return fn.apply(ctx, a);
        });
      };
    }; // -------------------------------------------------------------
    /// Use a custom Promise implementation


    function usePromise(PromiseConstructor) {
      nativePromise = PromiseConstructor;
    } // -------------------------------------------------------------


    sweeten.usePromise = usePromise;
    sweeten.VERSION = VERSION; // -------------------------------------------------------------
    // Helpers:
    // -------------------------------------------------------------

    function isThenable(p) {
      return p && typeof p.then === 'function';
    }

    function _constant(val) {
      return function () {
        return val;
      };
    }

    return sweeten;

})));
//# sourceMappingURL=promise-sugar.js.map
