import {DomCollection} from "./DomCollection";
import createImmu from "./ImmuTypes";

class Pipeline {
    constructor(renderAssignment) {
        this.collection = new DomCollection();
        this.initCollection = this.collection;
        this.renderAssignment = renderAssignment;
        this.data = null;
    }

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

    join(pipeline) {
        pipeline.collection.add(this.collection.domNodes);
        return this;
    }
    
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

    inject(rootDom) {
        if (!this.data) {
            throw Error("Cannot inject pipeline without binding any data");
        }
        if (this.collection.first) {
            // we have at least one outter element for this pipline
            rootDom.append(this.collection.first);
        } else {
            // we don't have any outter element
            // the real rendered collection is the init collection's first children
            const renderedCollection = this.initCollection.children[0];
            let now = renderedCollection.first;
            while(now !== renderedCollection.last) {
                rootDom.append(now);
                now = now.nextSibling;
            }
            renderedCollection.parentTag = rootDom;
        }
        return this;
    }

    model() {
        return this.content.model();
    }
}

export default Pipeline;