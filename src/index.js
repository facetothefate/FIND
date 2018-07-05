import PipelineClass from "../src/Pipeline";
import {StepInterpolate, LinearInterpolate, PolynomialInterpolate} from "../src/math";
import {createElement, createSVGElement} from "./DomCollection";
import {axisLeft, axisRight, axisTop, axisBottom} from "./Axis";


function Pipeline() {
    return new PipelineClass(...arguments);
}

function element(tagName, tagAttrs) {
    return createElement(tagName, tagAttrs);
}

function svgElement(tagName, tagAttrs) {
    return createSVGElement(tagName, tagAttrs);
}

function stepInterpolate() {
    return new StepInterpolate();
}

function linearInterpolate() {
    return new LinearInterpolate();
}

function polynomialInterpolate() {
    return new PolynomialInterpolate();
}

const interpolate = {
    step : stepInterpolate,
    linear : linearInterpolate,
    polynomial : polynomialInterpolate
}
const axis = {
    left: axisLeft,
    right: axisRight,
    top: axisTop,
    bottom: axisBottom
}
export {Pipeline, element, svgElement, interpolate, axis}; 