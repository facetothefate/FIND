import {DomCollection} from "./DomCollection";
import createImmu from "./ImmuTypes";

class PipelineInterface {
    outter() {}
    append() {}
    prepend() {}
}

class Pipeline extends PipelineInterface {
    constructor(renderAssignment) {
        super();
        this.collection = new DomCollection();
        this.initCollection = this.collection;
        this.renderAssignment = renderAssignment;
        this.data = null;
    }

    /* Pipline interfaces */
    outter(tagName, tagAttrs, ns) {
        this.collection = this.collection.outter(tagName, tagAttrs, ns);
        return this;
    }

    append(tagName, tagAttrs) {
        this.collection.append(tagName, tagAttrs);
        return this;
    }

    prepend(tagName, tagAttrs) {
        this.collection.prepend(tagName, tagAttrs);
        return this;
    }
    /* End of Pipline interfaces */

    /* Data binding */
    bind(data) {
        this.data = data;
        if (!this.content) {  
            this.content = createImmu(data, this.renderAssignment);
            this.initCollection.addSubCollection(this.content.collection);
            this.content.initRender();
        } else {
            this.content.set(data);
        }
        return this;
    }

    /*Dom tree inject */
    inject(rootDom) {
        if (!this.data) {
            throw Error("Cannot inject pipeline without binding any data");
        }
        let renderedCollection = null;
        if (this.collection.first) {
            // we have at least one outter element for this pipline
            renderedCollection = this.collection;
            this.collection.staticDomNodes.forEach((element)=>{
                rootDom.append(element.dom);
            });
        } else {
            // we don't have any outter element
            // the real rendered collection is the init collection's first children
            renderedCollection = this.initCollection.children[0];
            let now = renderedCollection.first;
            do {
                rootDom.append(now);
                now = now.nextSibling;
            }
            while(now && now !== renderedCollection.last);
        }

        renderedCollection.parentTag = rootDom;
        return this;
    }

    model() {
        return this.content.model();
    }
}

/*
 * Class Pipeline private function
 */
function addMethod(method, args) {
    this.actions.push({
        method:method,
        args:args
    });
} 
/*
 *  Class PipelineFactory
 */

class PipelineFactory {
    constructor(renderAssignment) {
        this.renderAssignment = renderAssignment;
        this.actions = [];
        Object.getOwnPropertyNames(PipelineInterface.prototype).forEach((key)=>{
            if (key !== "constructor") {
                this[key] = function() {
                    addMethod.bind(this)(key,arguments);
                    return this;
                }
            }
        });
    }

    create() {
        const p = new Pipeline(this.renderAssignment);
        this.actions.forEach((element)=>{
            p[element.method](...element.args);
        });
        return p;
    }
}

export {Pipeline, PipelineFactory};