const esm = require('esm')(module);
const { expect } = require('chai');
const { default: sweeten } = esm('../promise-sugar');

function noop() { }

/*globals describe, it*/
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
    let prom1 = Promise.resolve(1);
    let prom2 = sweeten(2);
    let prom3 = sweeten.reject('error');
    let prom4 = sweeten.wait(31)(() => { throw 'error4'; });
    let prom5 = sweeten.wait(32)(() => 5);

    // suppress UnhandledPromiseRejectionWarning
    prom3.catch(noop);
    prom4.catch(noop);

    it('should resolve with the first promise/value', () => {
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
        return sweeten.all([
            sweeten.any([prom3, prom4])
                (() => {
                    expect(true).to.be.false; // never resolves
                }, (err) => {
                    expect(!err).to.be.false;
                })
        ]);
    });
});

describe('sweeten.defer()', () => {
    it('should create a defered object with sweeten .promise', () => {
        let defered = sweeten.defer();
        isSweetenPromise(defered.promise);

        setTimeout(() => {
            defered.resolve('ok.defered');
        }, 4);

        return defered.promise((val) => {
            expect(val).to.equal('ok.defered');
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
