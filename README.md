# rxjs-webpack-test

## To repro

1. `npm install`
2. `npm test`

## Expected Output

```
[~/dev/github/satyend/rxjs-webpack-test] (master) $ npm test

> rxjs-webpack-test@1.0.0 test /Users/satyend/dev/github/satyend/rxjs-webpack-test
> webpack --verbose --display-modules index.js webpack.js && node webpack.js

Hash: 0bfeff5b5e4249a80ebc
Version: webpack 1.10.5
Time: 245ms
     Asset    Size  Chunks             Chunk Names
webpack.js  246 kB       0  [emitted]  main
   [0] ./index.js 227 bytes {0} [built]
   [1] ./~/rx/dist/rx.js 202 kB {0} [built]
       cjs require rx/dist/rx [0] ./index.js 1:9-30
       amd require ./rx [4] ./~/rx/dist/rx.aggregates.js 25:8-27:10
   [2] (webpack)/buildin/module.js 251 bytes {0} [built]
       cjs require module [1] ./~/rx/dist/rx.js 1:0-101
       cjs require module [4] ./~/rx/dist/rx.aggregates.js 1:0-101
   [3] (webpack)/~/node-libs-browser/~/process/browser.js 2.02 kB {0} [built]
       cjs require process [1] ./~/rx/dist/rx.js 1:0-146
   [4] ./~/rx/dist/rx.aggregates.js 33.7 kB {0} [built]
       cjs require rx/dist/rx.aggregates [0] ./index.js 2:0-32
       
onNext: 10
```

## Actual Output

```
~/dev/github/satyend/rxjs-webpack-test] (master) $ npm test

> rxjs-webpack-test@1.0.0 test /Users/satyend/dev/github/satyend/rxjs-webpack-test
> webpack --verbose --display-modules index.js webpack.js && node webpack.js

Hash: acb33b71aa9947f971e6
Version: webpack 1.10.5
Time: 471ms
     Asset    Size  Chunks             Chunk Names
webpack.js  654 kB       0  [emitted]  main
   [0] ./index.js 227 bytes {0} [built]
   [1] ./~/rx/dist/rx.js 202 kB {0} [built]
       cjs require rx/dist/rx [0] ./index.js 1:9-30
   [2] (webpack)/buildin/module.js 251 bytes {0} [built]
       cjs require module [1] ./~/rx/dist/rx.js 1:0-101
       cjs require module [4] ./~/rx/dist/rx.aggregates.js 1:0-101
       cjs require module [5] ./~/rx/dist/rx.all.js 1:0-101
[core]
   [3] (webpack)/~/node-libs-browser/~/process/browser.js 2.02 kB {0} [built]
       cjs require process [1] ./~/rx/dist/rx.js 1:0-146
       cjs require process [5] ./~/rx/dist/rx.all.js 1:0-146
   [4] ./~/rx/dist/rx.aggregates.js 33.8 kB {0} [built]
       cjs require rx/dist/rx.aggregates [0] ./index.js 2:0-32
   [5] ./~/rx/dist/rx.all.js 397 kB {0} [built]
       amd require rx [4] ./~/rx/dist/rx.aggregates.js 25:8-27:10
/Users/satyend/dev/github/satyend/rxjs-webpack-test/webpack.js:52
	source.reduce(function(acc, x) {
	       ^
TypeError: undefined is not a function
    at Object.objectTypes.boolean (/Users/satyend/dev/github/satyend/rxjs-webpack-test/webpack.js:52:9)
    at __webpack_require__ (/Users/satyend/dev/github/satyend/rxjs-webpack-test/webpack.js:20:30)
    at /Users/satyend/dev/github/satyend/rxjs-webpack-test/webpack.js:40:18
    at Object.<anonymous> (/Users/satyend/dev/github/satyend/rxjs-webpack-test/webpack.js:43:10)
    at Module._compile (module.js:460:26)
    at Object.Module._extensions..js (module.js:478:10)
    at Module.load (module.js:355:32)
    at Function.Module._load (module.js:310:12)
    at Function.Module.runMain (module.js:501:10)
    at startup (node.js:129:16)
```

## What is happening

rx.aggregates.js (and the other 'incremental' modules, which are designed to augment rx core) has a UMD header, which has an AMD block as the first check:

```
    if (typeof define === 'function' && define.amd) {
        define(['rx'], function (Rx, exports) {
            return factory(root, exports, Rx);
        });
    } else if (typeof module === 'object' && module && module.exports === freeExports) {
        module.exports = factory(root, module.exports, require('./rx'));
    } else {
        root.Rx = factory(root, {}, root.Rx);
    }
```

* Webpack picks up the `define(['rx'] ...)` in the AMD section, looks at RxJS's package.json and ends up pulling in `rx/dist/rx.all.js`, instead of `rx/dist/rx.js` as the 'rx' module, based on the `jam` and `browser` entries in package.json.
* The app is requiring and using the `rx/dist/rx` module
* So webpack ends up including both `rx/dist/rx` for the app, and `rx/dist/rx.all` for `rx/dist/rx.aggregates` and `rx/dist/rx.aggreages` ends up augmenting `rx/dist/rx.all` instead of `rx/dist/rx`

Changing the AMD line in rx.aggregate's header to:

```
define(['./rx'], function (Rx, exports) {
```

Fixes the issue, so, that it pulls in `rx/dist/rx` instead of being routed to package.json to pick up `rx/dist/rx.all`. Not sure if this is the right fix for AMD in general. It seems like the intention is for rx.aggregates et al. to pick up `rx/dist/rx` and not `rx/dist/rx.all`

This is how I generated the "Expected Output". Note that it doesn't have rx.all included at all, whereas the "Actual Ouput" does, and fails to find `.reduce`

