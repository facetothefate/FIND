import {DomCollection} from "./DomCollection";
import createInmmu from "./ImmuTypes";

class Pipeline {
    constructor(renderAssignment, order) {
        this.collection = new DomCollection();
        this.initCollection = this.collection;
        this.renderAssignment = renderAssignment;
        this.order = order;
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
    
    bind(data) {
        // data will then be proxied
        this.data = data;
        this.content = createInmmu(data, this.renderAssignment);
        this.initCollection.add(this.content.getRendered(this.order));
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