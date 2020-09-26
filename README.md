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
let log      = console.log.bind(console);
let logError = console.error.bind(console);
```

That's basically it!

**Promise-sugar** tries to preserve all other behaviors of the `Promise` library used.

There is another library that implements a similar paradigm - [thunks](https://github.com/thunks/thunks).

**Thunks** is different from **Promise-sugar** an more complex (a thunk is not a promise and it has no `.catch()` method).


You can play with it on [jsBin](https://jsbin.com/punaxa/edit?js,console,output)


## Install

- Copy `promise-sugar.js` to your project or install it using [npm](https://www.npmjs.com/package/promise-sugar):

```sh
npm install promise-sugar --save
```

- Add `promise-sugar.js` to your app using `import` (ESM), `require` (AMD or CommonJs) or as a [script tag](https://unpkg.com/promise-sugar).

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
    .timeout(1000)     // reject in 1 sec, not a Promise/A+ method
    .finally(callback) // not a Promise/A+ method
```

If `Promise.prototype.progress` is defined, **Promise-sugar** will preserve it.

Here are some helper method of **Promise-sugar**:

```js
sweeten.when(value_or_thenable); // creates a sweeten promise
let deffered = sweeten.defer();  // creates a deffered with a sweeten .promise
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

```


## Examples

Sweeten promises are just promises and functions (`then`s) at the same time:

```js
let result = sweeten(fetch('/my/api'))
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
