function createElement (tagName, tagAttrs) {
    let tag = new DomNode(tagName, tagAttrs);
    return tag;
}

class DomNode {
    constructor(tagName, tagAttrs) {
        this.dom = document.createElement(tagName);
        Object.keys(tagAttrs).forEach(
            (key) =>{
                if (key === "text") {
                    this.dom.innerText = tagAttrs[key];
                }
                this.dom.setAttribute(key, tagAttrs[key]);
            }
        );
    }

    attr(key, value) {
        this.dom.setAttribute(key, value);
        return this;
    }

    on (event, callback) {
        this.dom[`on${event}`] = callback;
        return this;
    }

    text(value) {
        this.dom.innerText = value;
        return this;
    }

    html(value) {
        this.dom.innerHtml = value;
        return this;
    }

    append (child) {
        this.dom.append(child.dom);
    }

    prepend (child) {
        this.dom.prepend(child.dom);
    }
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