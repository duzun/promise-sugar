const esm = require('esm')(module);
const { expect } = require('chai');
const { default: sweeten } = esm('../promise-sugar');

function noop() { }

/*globals describe, it, beforeEach, afterEach*/
describe('sweeten(promise)', () => {
    let value = 'ok';
    let error = new Error('uups');
    let promise = Promise.resolve(value);
    let rejected = Promise.reject(error);
    let sweet = sweeten(promise);
    let sweetRejection = sweeten(rejected);

    rejected.catch(noop); // suppress UnhandledPromiseRejectionWarning

    it('should return a chainable function == sweeten promise', () => {
        return sweet((val) => val + 'x')((val) => 'y' + val)((val) => {
            expect(val).to.equal(`y${value}x`);
        });
    });

    it('should have .then() method', () => {
        return sweet.then(
            (val) => {
                expect(val).to.equal(value);
            }
        )
            (
                () => sweetRejection.then(
                    undefined,
                    (err) => {
                        expect(err).to.equal(error);
                    }
                )
            );
    });

    it('should have .catch() method', () => {
        return sweetRejection.catch((err) => {
            expect(err).to.equal(error);
        });
    });

    it('should have .finally() method', () => {
        return sweet.finally(() => {
            expect(true).to.be.true;
        });
    });

    it('should have .timeout(expires, throws=true) method', () => {
        return sweeten.wait(4)(promise)
            .timeout(16)((val) => {
                expect(val).to.equal(value);
            })
            (() => {
                let prom = sweeten.wait(16)(promise);
                return prom.timeout(4)(() => {
                    expect(true).to.be.false; // never gets here
                }, (err) => {
                    expect(err.promise).to.equal(prom);
                });
            })
            (() => {
                let prom = sweeten.wait(16)(promise);
                return prom.timeout(4, false)((val) => {
                    expect(val).to.equal(undefined);  // timeout - no promise value!
                }, () => {
                    expect(true).to.be.false; // never gets here
                });
            })
            (() => {
                // While here, let's make sure the second argument of wait is passed as resolved value
                let prom = sweeten.wait(1, 1234);
                return prom((val) => {
                    expect(val).to.equal(1234);  // timeout - no promise value!
                }, () => {
                    expect(true).to.be.false; // never gets here
                });
            })
            ;
    });
});

describe('sweeten(value)', () => {
    isSweetenPromise(sweeten('ok'), 'ok');
});

describe('sweeten.resolve(value)', () => {
    isSweetenPromise(sweeten.resolve('ok'), 'ok');
});

describe('sweeten.reject(value)', () => {
    const error = new Error('uuuups!');
    const rejected = sweeten.reject(error);

    rejected.catch(noop); // suppress UnhandledPromiseRejectionWarning

    isSweetenPromise(rejected, undefined, error);
});

describe('sweeten.any(array)', () => {
    // We want to test the polyfilled version of any
    let _any;
    beforeEach(() => {
        _any = Promise.any;
        delete Promise.any;
    });

    afterEach(() => {
        Promise.any = _any;
    });

    it('should resolve with the first promise/value', () => {
        let prom1 = Promise.resolve(1);
        let prom2 = sweeten(2);
        let prom3 = sweeten.reject('error');
        let prom4 = sweeten.wait(31)(() => { throw 'error4'; });
        let prom5 = sweeten.wait(48)(() => 5);

        // suppress UnhandledPromiseRejectionWarning
        prom3.catch(noop);
        prom4.catch(noop);

        return sweeten.all([
            sweeten.any([prom1, prom2, prom3, prom4, prom5])
                ((val) => {
                    expect(val).to.equal(1);
                })
            ,
            sweeten.any([prom1, 'x', prom2, prom3, prom4, prom5])
                ((val) => {
                    expect(val).to.equal(1);
                })
            ,
            sweeten.any(['x', prom1, prom2, prom3, prom4, prom5])
                ((val) => {
                    expect(val).to.equal('x');
                })
            ,
            sweeten.any([prom3, prom5, prom2, prom1, prom4])
                ((val) => {
                    expect(val).to.equal(2);
                })
            ,
            // all rejected + value
            sweeten.any([prom3, prom4, 'x'])
                ((val) => {
                    expect(val).to.equal('x');
                }, (err) => {
                    expect(!err).to.be.false;
                })
        ]);
    });

    it('should reject when all promises reject', () => {
        let prom3 = sweeten.reject('error');
        let prom4 = sweeten.wait(31)(() => { throw 'error4'; });

        // suppress UnhandledPromiseRejectionWarning
        prom3.catch(noop);
        prom4.catch(noop);

        return sweeten.all([
            sweeten.any([prom3, prom4])
                (() => {
                    expect(true).to.be.false; // never resolves
                }, (err) => {
                    expect(!err).to.be.false;
                    expect(err.errors.join(',')).to.equal(['error', 'error4'].join(','));
                })
        ]);
    });
});

describe('sweeten.allSettled(array)', () => {
    let prom1 = Promise.resolve(1);
    let prom2 = sweeten(2);
    let prom3 = sweeten.reject('error');
    let prom4 = sweeten.wait(31)(() => { throw 'error4'; });
    let prom5 = sweeten.wait(48)(() => 5);

    // suppress UnhandledPromiseRejectionWarning
    prom3.catch(noop);
    prom4.catch(noop);

    // We want to test the polyfilled version of any
    let _allSettled;
    beforeEach(() => {
        _allSettled = Promise.allSettled;
        delete Promise.allSettled;
    });

    afterEach(() => {
        Promise.allSettled = _allSettled;
    });

    it('should resolve when all promises fulfilled or rejected', () => {
        function cmpSettled(val, expected) {
            expect(val.length).to.equal(expected.length);

            expected.forEach((e, i) => {
                expect(val[i].status).to.equal(e.status);

                if (e.status == 'fulfilled') {
                    expect(val[i].value).to.equal(e.value);
                }
                else {
                    expect(val[i].reason).to.equal(e.reason);
                }
            });
        }

        return sweeten.all([
            // mixed
            sweeten.allSettled([prom1, prom2, 'x', prom3, prom4, prom5])
                ((val) => {
                    cmpSettled(val, [
                        { status: 'fulfilled', value: 1 },
                        { status: 'fulfilled', value: 2 },
                        { status: 'fulfilled', value: 'x' },
                        { status: 'rejected', reason: 'error' },
                        { status: 'rejected', reason: 'error4' },
                        { status: 'fulfilled', value: 5 },
                    ]);
                })
            ,

            // all rejected + value
            sweeten.allSettled([prom3, prom4, 'x'])
                ((val) => {
                    cmpSettled(val, [
                        { status: 'rejected', reason: 'error' },
                        { status: 'rejected', reason: 'error4' },
                        { status: 'fulfilled', value: 'x' },
                    ]);
                })
            ,

            // all rejected
            sweeten.allSettled([prom3, prom4])
                ((val) => {
                    cmpSettled(val, [
                        { status: 'rejected', reason: 'error' },
                        { status: 'rejected', reason: 'error4' },
                    ]);
                })
            ,

            // values
            sweeten.allSettled([1, 2, 'x', '4'])
                ((val) => {
                    cmpSettled(val, [
                        { status: 'fulfilled', value: 1 },
                        { status: 'fulfilled', value: 2 },
                        { status: 'fulfilled', value: 'x' },
                        { status: 'fulfilled', value: '4' },
                    ]);
                })
        ]);
    });

});

describe('sweeten.defer()', () => {
    it('should create a deferred object with sweeten .promise', () => {
        let deferred = sweeten.defer();
        isSweetenPromise(deferred.promise);

        setTimeout(() => {
            deferred.resolve('ok.deferred');
        }, 4);

        return deferred.promise((val) => {
            expect(val).to.equal('ok.deferred');
        });
    });
});

function isSweetenPromise(sweetPromise, value, error) {
    it('should return a sweeten promise', () => {
        expect(typeof sweetPromise.then).to.equal('function');
        expect(typeof sweetPromise.catch).to.equal('function');
        expect(typeof sweetPromise.finally).to.equal('function');
        expect(typeof sweetPromise.timeout).to.equal('function');

        return sweetPromise((val) => val)
            ((val) => {
                expect(val).to.equal(value);
            }, (err) => {
                expect(err).to.equal(error);
            });
    });
}
