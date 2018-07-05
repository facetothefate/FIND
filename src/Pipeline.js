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
        if (this.initCollection === this.collection) {
            throw Error("pipline should at least have one 'outter' element");
        }
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
        rootDom.append(this.collection.first);
        return this;
    }

    model() {
        return this.content.model();
    }
}

export default Pipeline;