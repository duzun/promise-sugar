(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = global || self, global.sweeten = factory());
}(this, (function () { 'use strict';

    /**
     *  Promise syntactic sugar - no need to write ".then"
     *
     *  @license MIT
     *  @version 2.2.1
     *  @git https://github.com/duzun/promise-sugar
     *  @umd AMD, Browser, CommonJs
     *  @author Dumitru Uzun (DUzun.Me)
     */

    /*globals globalThis, window, global, self */
    var VERSION = '2.2.1'; // -------------------------------------------------------------

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

      then["finally"] = _finally; // Goodies

      then.timeout = _timeout;

      if ('progress' in PromisePrototype) {
        then.progress = PromisePrototype.progress;
      }

      return then;

      function then(onResolve, onReject, onNotify) {
        if (isThenable(onResolve)) {
          arguments[0] = onResolve = _constant(onResolve);
        }

        if (isThenable(onReject)) {
          arguments[1] = onReject = _constant(onReject);
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

    /**
     * Timeout a promise
     *
     * @param  int expires how long to wait for `promise` in ms
     * @param  bool throws If true, throw on timeout
     * @return Promise resolves before `expires` or rejects with timeout error
     */


    function _timeout(expires) {
      var _throws = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      var promise = this;
      var waiter = nWait(expires);
      var _waiter = waiter,
          stop = _waiter.stop;

      if (_throws) {
        waiter = waiter.then(function () {
          var error = new Error('Promise Timeout');
          error.promise = promise;
          throw error;
        });
      }

      promise.then(function () {
        return stop()["catch"](_constant);
      }); // no need to keep the waiter promise

      return sweeten.race([promise, waiter]);
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

    sweeten.any = function any(val) {
      var prom = nativePromise.any ? nativePromise.any(val) : new nativePromise(function (resolve, reject) {
        var errors = [];
        var count = 0;

        function onReject(error) {
          errors.push(error);

          if (! --count) {
            var _error = new (typeof AggregateError == 'undefined' ? Error : AggregateError)('All promises rejected');

            _error.name = 'AggregateError';
            _error.errors = errors;
            reject(_error);
          }
        }

        if (!isArray(val)) val = Array.from(val);
        val.forEach(function (p) {
          ++count;
          if (!isThenable(p)) p = nativePromise.resolve(p);
          p.then(resolve, onReject);
        }); // for(let p of val) {
        //     ++count;
        //     if(!isThenable(p)) p = nativePromise.resolve(p);
        //     p.then(resolve, onReject);
        // }
      });
      return sweeten(prom);
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

    function nWait(timeout) {
      var stop;
      var waiter = new nativePromise(function (resolve, reject) {
        var id = setTimeout(resolve, timeout);

        stop = function stop(execute) {
          if (id) {
            clearTimeout(id);
            execute ? resolve(id) : reject(id);
            id = undefined;
          }

          return waiter;
        };
      });
      waiter.stop = stop;
      return waiter;
    }

    function wait(timeout) {
      var waiter = nWait(timeout);
      var _waiter2 = waiter,
          stop = _waiter2.stop;
      waiter = sweeten(waiter);
      waiter.stop = stop;
      return waiter;
    }

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
