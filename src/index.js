import PipelineClass from "../src/Pipeline"
import {createElement} from "./DomCollection";


function Pipeline() {
    return new PipelineClass(...arguments);
}

function element(tagName, tagAttrs) {
    return createElement(tagName, tagAttrs);
}

export {Pipeline, element}; 