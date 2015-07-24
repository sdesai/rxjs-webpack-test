var Rx = require('rx/dist/rx');
require('rx/dist/rx.aggregates');

var source = Rx.Observable.range(0, 5);

source.reduce(function(acc, x) {
    return acc + x;
}, 0).subscribe(function(x) {
    console.log("onNext: " + x);
});