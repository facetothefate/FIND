function createElement (tagName, tagAttrs) {
    let tag = document.createElement(tagName);
    Object.keys(tagAttrs).forEach(
        (key) =>{
            if (key === "text") {
                tag.innerText = tagAttrs[key];
            }
            tag.setAttribute(key, tagAttrs[key]);
        }
    );
    return tag;
}

class DomCollection {
    constructor(doms) {
        this.parent = null;
        this.parentTag = null;
        this.children = [];
        this.domNodes = [];
        if (doms) {
            this.domNodes = doms;
        }
    }

    outter(tagName, tagAttrs) {
        if (this.parentTag) {
            // remove from the old parent, add to the new one.
        }
        let tag = createElement(tagName, tagAttrs);
        // add current as children
        this.domNodes.forEach((dom) => {
            tag.append(dom);
        });
        this.parent = new DomCollection([tag]);
        this.parentTag = tag;
        this.parent.children.push(this);
        return this.parent;
    }

    append(tagName, tagAttrs) {
        let tag = createElement(tagName, tagAttrs);
        this.add([tag]);
        return this;
    }

    prepend(tagName, tagAttrs) {
        let tag = createElement(tagName, tagAttrs);
        this.offer([tag]);
        return this;
    }

    add(nodes) {
        nodes.forEach((node)=>{
            this.domNodes.push(node);
            if (this.parentTag) {
                this.parentTag.append(node);
            }
        });
        return this;
    }

    offer(nodes) {
        nodes.forEach((node)=>{
            this.domNodes.unshift(node);
            if (this.parentTag) {
                this.parentTag.prepend(node);
            }
        });
        return this;
    }
}

export {createElement, DomCollection};