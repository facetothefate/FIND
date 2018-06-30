import DomCollection from "./DomCollection";
import createInmmu from "./ImmuTypes";

class Pipeline {
    constructor(renderAssignment, order) {
        this.collection = new DomCollection();
        this.rootCollection = this.collection;
        this.renderAssignment = renderAssignment;
        this.order = order;
        this.data = null;
    }

    outter(tagName, tagAttrs) {
        this.rootCollection = this.rootCollection.outter(tagName, tagAttrs);
        return this;
    }

    append(tagName, tagAttrs) {
        this.rootCollection.append(tagName, tagAttrs);
        return this;
    }

    bind(data) {
        // data will then be proxied
        this.data = data;
        this.content = createInmmu(data, this.renderAssignment);
        this.collection.add(this.content.getRendered(this.order));
        return this;
    }

    inject(rootDom) {
        rootDom.append(this.rootCollection.domNodes[0]);
        return this;
    }

    model() {
        return this.content.model();
    }
}

export default Pipeline;