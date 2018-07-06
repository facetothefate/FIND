const Namespaces = {
    "svg" : "http://www.w3.org/2000/svg"
}


function createElement (tagName, tagAttrs) {
    let tag = new DomNode(tagName, tagAttrs);
    return tag;
}

function createSVGElement (tagName, tagAttrs) {
    let tag = new DomNode(tagName, tagAttrs, "svg");
    return tag;
}

function unpackDom (domNode) {
    if (domNode instanceof DomNode) {
        return domNode.dom;
    } else {
        return domNode;
    }
}

function toCssName (key) {
    for(let i = 0; i < key.length; i+=1) {
        if (key[i] === key[i].toUpperCase()) {
            return `${key.substring(0, i)}-${
                toCssName( 
                    key[i].toLowerCase() + key.substring(i + 1, key.length))}`;
        }
    }
    return key;
}

// User interface to handle dom 
class DomNode {
    constructor(tagName, tagAttrs, namespace) {
        if (!namespace) {
            this.dom = document.createElement(tagName);
        } else{
            this.dom = document.createElementNS(Namespaces[namespace],tagName);
        }
        if (tagAttrs) {
            Object.keys(tagAttrs).forEach(
                (key) =>{
                    if (key === "text") {
                        if (this.dom.namespaceURI === Namespaces["svg"]) {
                            this.dom.textContent = tagAttrs[key];
                        } else {
                            this.dom.innerText = tagAttrs[key] + "";
                        }
                    } else if (key === "on"){
                        const eventHandler = tagAttrs[key];
                        Object.keys(eventHandler).forEach((event)=>{
                            this.dom[`on${event}`] = tagAttrs[key][event];
                        });
                    } else if (key === "style") {
                        this.style(tagAttrs[key]);
                    } else {
                        this.dom.setAttribute(key, tagAttrs[key]);
                    }
                }
            );
        }
    }

    attr(key, value) {
        this.dom.setAttribute(key, value);
        return this;
    }

    style (styleObject) {
        let style = 
            Object.keys(styleObject).map((key)=>{
                const item = toCssName(key);
                return `${item}:${styleObject[key]}`;
            });
        this.dom.setAttribute("style", style.join(";"));
        return this;
    }

    on (event, callback) {
        this.dom[`on${event}`] = callback;
        return this;
    }

    text(value) {
        if (this.dom.namespaceURI === Namespaces["svg"]) {
            this.dom.textContent = value;
        } else {
            this.dom.innerText = value;
        }
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

    appendAfter(child, refChild) {
        let refDom = unpackDom(refChild);
        if (refDom.nextSibling) {
            this.dom.insertBefore(child.dom, refDom.nextSibling);
        } else {
            // append after last child, append directly
            this.dom.append(child.dom);
        }
    }

    appendBefore(child, refChild) {
        let refDom = unpackDom(refChild);
        this.dom.insertBefore(child.dom, refDom);
    }
}

class DomCollection {
    constructor(doms) {
        this.parent = null;
        this.parentTag = null;
        this.children = [];
        this.staticDomNodes = [];
        this.last = null;
        this.first = null;
        this.lastCollection = false;
        this.firstCollection = false;
        this.size = 0;

        // the doms should be a slice of a same level children
        if (doms) {
            this.last = unpackDom(doms[doms.length-1]);
            this.first = unpackDom(doms[0]);
            this.staticDomNodes = doms;
        }
    }

    outter(tagName, tagAttrs, ns) {
        if (this.parentTag) {
            // remove from the old parent, add to the new one.
        }
        let tag = new DomNode(tagName, tagAttrs, ns);
        // add static dom nodes as children
        this.staticDomNodes.forEach((dom) => {
            tag.append(dom);
        });
        this.parent = new DomCollection([tag]);
        this.parentTag = tag;
        this.parent.children.push(this);
        return this.parent;
    }

    findRoot() {
        let parentCollection = this.parent;
        if (!parentCollection) {
            return null;
        }
        if (parentCollection.parentTag) {
            return parentCollection;
        } else {
            return parentCollection.findRoot();
        }
    }

    addSubCollection(collection) {
        collection.parent = this;
        collection.first = this.last;
        collection.last = this.last;
        collection.lastCollection = true;
        if (!this.children.length) {
            collection.firstCollection = true;
        }
        else if (this.children.length >= 1) {
            this.children[this.children.length - 1].lastCollection = false;
        }
        this.children.push(collection);
    }

    offerSubCollection(collection) {
        collection.parent = this;
        collection.first = this.first;
        collection.last = this.first;
        collection.lastCollection = true;
        if (!this.children.length) {
            collection.firstCollection = true;
        }
        else if (this.children.length >= 1) {
            this.children[0].firstCollection = false;
        }
        this.children.unshift(collection);
    }

    removeSubCollection(collection) {
        if (collection.parent !== this) {
            return;
        }
        collection.parent = null;
        const pos = this.children.indexOf(collection);
        this.children.splice(pos, 1);
        if (pos === 0) {
            this.updateFirst(this.children[0].first);
        }
        if (pos === this.children.length + 1) {
            this.updateLast(this.children[this.children.length - 1].last);
        }
        
    }

    append(tagName, tagAttrs) {
        let tag = createElement(tagName, tagAttrs);
        this.staticDomNodes.push(tag);
        return this;
    }

    prepend(tagName, tagAttrs) {
        let tag = createElement(tagName, tagAttrs);
        this.staticDomNodes.unshift(tag);
        return this;
    }

    modifyTemplate(method) {
        for (let i = 1; i < arguments.length; i+=1) {
            if (this.parentTag) {
                this.parentTag[method](arguments[i]);
            } else {
                const parentTag = this.findRoot().parentTag;
                if (parentTag) {
                    parentTag[method](arguments[i]);
                }
            }
        }
        return this;
    }

    add () {
        if (!this.first && !this.last) {
            this.modifyTemplate("append", ...arguments);
            this.updateLast(unpackDom(arguments[arguments.length - 1]));
            this.updateFirst(unpackDom(arguments[0]));
        } else {
            this.addAfter(...arguments, this.last);
        }
    };

    offer () { 
        if (!this.first && !this.last) {
            this.modifyTemplate("prepend", ...arguments);
            this.updateLast(unpackDom(arguments[arguments.length - 1]));
            this.updateFirst(unpackDom(arguments[0]));
        } else {
            this.addBefore(...arguments, this.first);
        }

    }

    remove (node) {
        if (this.size === 0) {
            return;
        }
        const nodeDom = unpackDom(node);
        this.size -= 1;
        if (this.first === nodeDom) {
            this.first = this.updateFirst(this.first.nextSibling);
        }
        else if (this.last === nodeDome) {
            this.last = this.updateLast(this.last.previousSibling);
        }
        if (this.parentTag) {
            this.parentTag.remove(node);
        } else {
            const parentTag = this.findRoot().parentTag;
            if (parentTag) {
                parentTag.remove(node);
            }
        }
    }

    addAfter() {
        if (arguments.length < 2) {
            throw Error("addAfter need at least one node and one refnode");
        }
        this.size += 1;
        let refnode =  arguments[arguments.length - 1];
        for (let i = 0; i < arguments.length-1; i+=1) { 
            let node = arguments[i];
            if (this.parentTag) {
                this.parentTag.appendAfter(node, refnode);
            } else {
                const parentTag = this.findRoot().parentTag;
                if (parentTag) {
                    parentTag.appendAfter(node, refnode);
                }
            }
        }
        if (this.last === refnode) {
            this.updateLast(arguments[arguments.length - 2]);
        }
        return this;
    }

    addBefore() {
        if (arguments.length < 2) {
            throw Error("addAfter need at least one node and one refnode");
        }
        this.size += 1;
        let refnode =  arguments[arguments.length - 1];
        for (let i = 0; i < arguments.length-1; i+=1) { 
            let node = arguments[i];
            if (this.parentTag) {
                this.parentTag.appendBefore(node, refnode);
            } else {
                const parentTag = this.findRoot().parentTag;
                if (parentTag) {
                    parentTag.appendBefore(node, refnode);
                }
            }
        }
        if (this.first === refnode) {
            this.updateFirst(arguments[0]);
        }
    }

    replace(node) {
        const refnode = node.dom.nextSibling;
        this.remove(node);
        this.addAfter(node, refnode);
    }

    updateLast(last){
        let parentCollection = this.parent;
        this.last = last;
        if (!parentCollection) {
            return;
        }
        if (parentCollection.lastCollection) {
            parentCollection.updateLast(last);
        }
    }

    updateFirst(first){
        let parentCollection = this.parent;
        this.first = first;
        if (!parentCollection) {
            return;
        }
        if (parentCollection.firstCollection) {
            parentCollection.updateFirst(first);
        }
    }
}

export {createElement, createSVGElement, DomCollection};