## Promise syntactic sugar

No need to write `.then` in your promise chains.
The promise is the `.then` function itself!

## What it does?

1 ) It allows you to convert this

```js
Promise.resolve(10)
.then(function(n){
    return n / 2
})
.then(function(n){
    return n * 3
})
.then(log) // -> 15
.catch(logError)
```

into this

```js
sweeten(10)
(function(n){
    return n / 2
})
(function(n){
    return n * 3
})
(log, logError) // -> 15
(null, logError) // .catch
```

2 ) and this

```js
// Given two existing promises A and B
A
.then(function () { return B; } ) // wait for A and B and return B's value
.then(log) // -> B's value
```

into this

```js
A(B)
(log) // -> B's value
```

where

```js
var log      = console.log.bind(console);
var logError = console.error.bind(console);
```

That's it!

**Promise-sugar** tries to preserve all other behaviours of the `Promise` library used.


You can play with it on [jsBin](https://jsbin.com/punaxa/edit?js,console,output)


## Install

- Copy `promise-sugar.js` to your project or install it using [npm](https://www.npmjs.com/package/promise-sugar):

```sh
npm install promise-sugar --save
```

- Add `promise-sugar.js` to your app using require (AMD or CommonJs) or as a script tag.
```js
var sweeten = require('promise-sugar');
```

- Make sure there is a `Promise` implementation or get a polyfill like [es6-promise](https://www.npmjs.com/package/es6-promise).

```js
sweeten.usePromise(require('es6-promise').Promise); // polyfill
```


## More sugar

Regardless of the `Promise` implementation used, all sweeten promises have the following methods:

```js
sweeten(promise)
    .catch(onReject)   // Promite/A+
    .finally(callback) // not a Promise/A+
```

If `Promise.prototype.progress` is defined, **Promise-sugar** will preserve it.

Here are some helper method of **Promise-sugar**:

```js
sweeten.when(value_or_thenable); // creates a sweeten promise
var defered = sweeten.defer();   // creates a defered with a sweeten .promise

// Promise/A+ sweet equivalents
sweeten.resolve(val)
sweeten.reject(val)
sweeten.all(list)
sweeten.race(list)

```


## Examples

Sweeten promises are just promises and functions (`then`s) at the same time:

```js
var result = sweeten(fetch('/my/api'))
             (function(res) { return res.json(); })
;

// Now you have a simple function that contains your result
result(log);

// and it is still a promise!
result.catch(logError);

// and can be used as such
Promise.all([result, fetch('my/api/something/else')])
.then(/*...*/);

// or equivalent of the above
sweeten.all([result, fetch('my/api/something/else')])
(/*...*/);
```

Sweeten promise constructor:

```js
var myStuff = new sweeten(function (resolve, rejext){
    setTimeout(resolve, 100, Math.random());
});

myStuff(function(myNumber){/*...*/}, function(error){/*...*/});
```
