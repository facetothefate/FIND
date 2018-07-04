import {DomCollection} from "./DomCollection";
import createInmmu from "./ImmuTypes";

class Pipeline {
    constructor(renderAssignment) {
        this.collection = new DomCollection();
        this.initCollection = this.collection;
        this.renderAssignment = renderAssignment;
        this.data = null;
    }

    outter(tagName, tagAttrs) {
        this.collection = this.collection.outter(tagName, tagAttrs);
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
        if (this.initCollection === this.collection) {
            throw Error("pipline should at least have one 'outter' element");
        }
        this.data = data;
        if (!this.content) {  
            this.content = createInmmu(data, this.renderAssignment);
            this.content.bindCollection(this.initCollection);
        } else {
            this.content.set(data);
        }
        return this;
    }

    inject(rootDom) {
        rootDom.append(this.collection.domNodes[0].dom);
        return this;
    }

    model() {
        return this.content.model();
    }
}

export default Pipeline;