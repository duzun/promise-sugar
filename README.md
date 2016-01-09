## Promise syncatctic sugar 
### no need to write ".then" in your promise chains

## What it does?

It alow you to convert this 

```js
Promise.resolve(10)
.then(function(n){ return n / 2 })
.then(function(n){ return n * 3 })
.then(console.log.bind(console)) // -> 15
```

into this

```js
sweeten(10)
(function(n){ return n / 2 })
(function(n){ return n * 3 })
(console.log.bind(console)) // -> 15
```

That's it!


You can play with it on [jsFiddle](https://jsfiddle.net/duzun/e5k8gppL/13/)

