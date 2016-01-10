## Promise syntactic sugar

No need to write `.then` in your promise chains.
The promise is the `.then` function itself!

## What it does?

It allows you to convert this

```js
Promise.resolve(10)
.then(function(n){
    return n / 2
})
.then(function(n){
    return n * 3
})
.then(console.log.bind(console)) // -> 15
.catch(console.error.bind(console))
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
(console.log.bind(console), console.error.bind(console)) // -> 15
(null, console.error.bind(console)) // .catch
```

That's it!


You can play with it on [jsFiddle](https://jsfiddle.net/duzun/e5k8gppL/13/)


## Install

- Copy `promise-sugar.js` to your project or install it using npm:

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


## Examples

Sweeten promises are just promises and functions (`then`s) at the same time:

```js
var result = sweeten(fetch('/my/api'))
             (function(res) { return res.json(); })
;

// Now you have a simple function that contains your result
result(console.log.bind(console));

// and it is still a promise!
result.catch(console.error.bind(console));

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
