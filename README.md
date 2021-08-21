## Promise syntactic sugar [![Build Status](https://travis-ci.com/duzun/promise-sugar.svg?branch=master)](https://travis-ci.com/duzun/promise-sugar)

No need to write `.then` in your promise chains.
The promise is the `.then` function itself!

## What it does

1 ) It allows you to convert this

```js
Promise.resolve(10)
.then((n) => n / 2)
.then((n) => n * 3)
.then(log) // -> 15
.catch(logError)
```

into this

```js
sweeten(10)
((n) => n / 2)
((n) => n * 3)
(log, logError) // -> 15
(null, logError) // .catch
```

2 ) and this

```js
// Given two existing promises A and B
A
.then(() => B) // wait for A and B and return B's value
.then(log) // -> B's value
```

into this

```js
A(B)
(log) // -> B's value
```

where

```js
const log      = console.log.bind(console);
const logError = console.error.bind(console);
```

That's almost it! For [**More sugar**](#more-sugar) see below.

**Promise-sugar** tries to preserve all other behaviors of the `Promise` library used.

There is another library that implements a similar paradigm - [thunks](https://github.com/thunks/thunks).

**Thunks** is different from **Promise-sugar** and more complex (a thunk is not a promise and it has no `.catch()` method).

You can play with it on [jsBin](https://jsbin.com/punaxa/edit?js,console,output)

## Install

- Copy `promise-sugar.js` to your project or install it using [npm](https://www.npmjs.com/package/promise-sugar):

```sh
npm install promise-sugar --save
```

- Import `promise-sugar.js` into your app using `import` (ESM), `require` (AMD or CommonJs) or as a [script tag](https://unpkg.com/promise-sugar).

```js
import sweeten from 'promise-sugar';
```

```js
const sweeten = require('promise-sugar');
```

```html
<script src="https://unpkg.com/promise-sugar"></script>
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
    .finally(callback) // not a Promise/A+ method
    .timeout(1000)     // reject in 1 sec, not a Promise/A+ method
```

If `Promise.prototype.progress` is defined, **Promise-sugar** will preserve it.

Here are some helper methods of **Promise-sugar**:

```js
sweeten.when(value_or_thenable); // creates a sweeten promise
let deferred = sweeten.defer();  // creates a deferred with a sweeten .promise

sweeten.allValues(obj);          // Similar to Promise.all(list), but accepts an object with thenable values

if(sweeten.isThenable(any)) any.then(doStuff);

let waiter = sweeten.wait(123);  // setTimeout()
waiter.then(doStuffLater);
waiter.stop();                   // don't doStuffLater() (like clearTimeout())


function sum(a,b) { return a + b; }
let ssum = sweeten.fn(sum); // sweeten version of sum()
ssum(2, Promise.resolve(3))(log); // -> 5


// Promise/A+ sweet equivalents
sweeten.resolve(val)
sweeten.reject(val)
sweeten.race(list)
sweeten.all(list)
sweeten.any(list)
sweeten.allSettled(list)

```

## Examples

Sweeten promises are just promises and functions (`then`s) at the same time:

```js
let result = sweeten(fetch('/my/api'))
             ((res) => res.json())
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
let myStuff = new sweeten(function (resolve, rejext){
    setTimeout(resolve, 100, Math.random());
});

myStuff((myNumber) => {/*...*/}, (error) => {/*...*/});
```
