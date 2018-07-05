import {polynomial, linear, step} from "everpolate/everpolate";

class Interpolate {
    constructor(method) {
        this.scopes = null;
        this.values = null;
        this.method = method;
    }
    scope(scopeArray) {
        this.scopes = scopeArray;
        return this;
    }

    value(valuesArray) {
        this.values = valuesArray;
        return this;
    }

    getMax() {
        return this.scopes[this.scopes.length - 1];
    }

    getMin() {
        return this.scopes[0];
    }

    get(scopeValues) {
        return this.method(scopeValues, this.scopes, this.values);
    }
}

class StepInterpolate extends Interpolate{
    constructor() {
        super(step);
    }
}

class LinearInterpolate extends Interpolate{
    constructor() {
        super(linear);
    }
}

class PolynomialInterpolate extends Interpolate{
    constructor() {
        super(polynomial);
    }
}

export {StepInterpolate, LinearInterpolate, PolynomialInterpolate}