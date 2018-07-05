import { DomCollection } from "./DomCollection";
import {Shapes, getShape} from "./Shapes";


// Factory method
function createImmu(value, render, domCollection) {
    let vshape = getShape(value);
    let rshape = getShape(render);
    switch (vshape) {
        case Shapes.ARRAY:
            return new ArrayImmutabel(value, render, domCollection);
        case Shapes.COMPLEX:
            // if user gives out a speific key, then we create as a complex
            // if user wish to use the whole object as a single value we create as a simple
            // which makes the following can happen:
            // <div> data.body </div>
            if (rshape === Shapes.ARRAY) {
                return new ComplexImmutabel(value, render, domCollection);
            } else if (rshape === Shapes.FUNCTION) {
                return new SimpleImmutabel(value, render, domCollection);
            }
        default:
            return new SimpleImmutabel(value, render, domCollection);
    }
}

class ImmutabelInterface {
    constructor(collection) {
        this.collection = new DomCollection();
        if (collection) {
            collection.addSubCollection(this.collection);
        }
    }
    get() {
        throw Error("Not done");
    }

    set(data) {
        throw Error("Not done");
    }

    delete() {
        throw Error("Not done");
    }

    isDelete() {
        throw Error("Not done");
    }

    getVersion() {
        throw Error("Not done");
    }
    // return rendered results
    // this ether return a DomCollection
    getRendered() {
        return this.collection;
    }
}

class SimpleImmutabel extends ImmutabelInterface{
    constructor(data, render, collection) {
        super(collection);
        if (getShape(render) !== Shapes.FUNCTION) {
            throw Error(`Cannot bind ${JSON.stringify(data)} to a complex renderset`);
        }

        this.currentData = data;
        this.deleteVerison = null;
        this.version = 0;
        this.render = render;
        this.elem = null;
        this.doRender();
    }
    get() {
        if (this.version === this.deleteVerison) {
            return undefined;
        }
        return this.currentData;
    }

    set(data) {
        if (this.currentData === data) {
            return;
        }
        this.currentData = data;
        this.doRender();
        this.version += 1;
    }

    delete() {
        this.version += 1;
        this.deleteVerison = this.version;
        this.collection.remove(this.elem);
    }

    isDelete() {
        return this.version === this.deleteVerison;
    }

    getVersion() {
        return this.version;
    }


    bind(render) {
        this.render = render;
        this.doRender();
    }

    doRender() {
        let elem = this.render(this.get(), this.elem);
        if (!this.elem) {
            this.collection.add(this.elem);
            return;
        }
        if (elem !== this.elem) {
            this.collection.replace(this.elem);
        }
        this.elem = elem;
    }
} 


class ArrayImmutabel extends ImmutabelInterface {
    constructor(data, renders, collection) {
        super(collection);
        if (getShape(data) !== Shapes.ARRAY) {
            throw Error(`${JSON.stringify(data)} is not an array data`);
        }

        if (getShape(renders) !== Shapes.ARRAY) {
            throw Error(`renders should follow the following format: [ 
                    [<number>/"*", <renderSet>]
                ]`);
        }
        this.content = [];
        this.currentVersion = [];
        this.keptVer = 0;
        this.version = 0;
        this.data = data;
        this.renders = new Map(renders);
        this.settedRenders = {};
        // the renders format should like this:
        // [ 
        //    [<number>/"*", <renderSet>]
        // ]
        // * will be a wildcard, matches all other index
        // <number> will match speicifc index
        this.renders.forEach(
            (renderSet, key) => {
                if (key === "*") {
                    for(let i = 0; i < data.length; i+=1) {
                        if (false === i in this.settedRenders) {
                            this.content[i] = createImmu(data[i], renderSet, this.collection);
                            this.currentVersion[i] = 0;
                        }
                    }
                } else if (Number.isInteger(key)) {
                    this.content[key] = createImmu(data[key], renderSet, this.collection);
                    this.currentVersion[i] = 0;
                    this.settedRenders[key] = true;
                }
                // another keys we ignore to save memory
            }
        );

        this.arrayFunc = {
            fill:(value, s, e) => {
                let start = s ? s : 0;
                let end = e ? e : this.content.length;
                let changed = false;

                for (let i = start; i <= end && i < this.content.length; i+=1) {
                    if (this.content[i]) {
                        this.content[i].set(value);
                        if (this.content[i].getVersion() !== this.currentVersion[i]) {
                            changed = true;
                            this.currentVersion[i] = this.content.getVersion();
                        }
                    }
                }
                if (changed) {
                    this.version += 1;
                }
            },
            push:() => {
                for (let i = 0; i < arguments.length; i+=1) {
                    let render = this.renders.get(i);
                    if (!render) {
                        render = this.renders.get("*");
                    }
                    if (render) {
                        this.content.push(createImmu(arguments[i], this.renders.get(i), this.collection));
                        this.currentVersion.push(0);
                    }
                }
                if (arguments.length) {
                    this.version += 1;
                }
            },
            pop:() => {
                this.currentVersion.pop();
                const res = this.content.pop();
                this.version += 1;
                const ret = res.get();
                res.delete();
                return ret;
            },
            sort:() => {
                throw Error("Please sort the data before bind to the Pipline!");
            },
            reverse: () => {
                throw Error("Please Reverse the data before bind to the Pipline!");
            },
            shift:() => {
                const res = this.content.shift();
                this.currentVersion.shift();
                // pos changed, need to rebind all the render again
                this.content.forEach((elem, index)=>{
                    let render = this.renders.get(index);
                    if (!render) {
                        render = this.renders.get("*");
                    }
                    if (render) {
                        elem.bind(render);
                    }
                });
                const ret =  res.get();
                res.delete();
                return ret;
            },
            unshift:() => {
                // not support for now, need insert sub collection at the very beginning
                /*
                let i = 0;
                for (i = 0; i < arguments.length; i+=1) {
                    let render = this.renders.get(i);
                    if (!render) {
                        render = this.renders.get("*");
                    }
                    if (render) {
                        this.content.unshift(createImmu(arguments[i], this.renders.get(i), this.collection));
                        this.currentVersion.unshift(0);
                    }
                }
                for ( ;i < this.content.length; i+= 1) {
                    let render = this.renders.get(index);
                    if (!render) {
                        render = this.renders.get("*");
                    }
                    if (render) {
                        this.content[i].bind(render);
                    }
                }
                if (arguments.length) {
                    this.version += 1;
                }*/
            },
            splice:() => {
                // not support for now, need remove a sub collection from current collection
                /*
                let start = arguments[0];
                let changed = false;
                this.content.splice(...arguments);
                this.currentVersion.splice(...arguments);

                for (let i = start; i < start + (arguments.length - 2); i += 1) {
                    let render = this.renders.get(i);
                    if (!render) {
                        render = this.renders.get("*");
                    }
                    if (render) {
                        this.content[i] = createImmu(this.content[i], render);
                        this.currentVersion[i] = 0;
                        changed = true;
                    } else {
                        this.content[i] =  undefined;
                    }
                }

                if (changed) {
                    this.version += 1;
                }*/
            },
        }
    }

    createProxy(data) {
        return new Proxy(data, {
            get: (target, key) => {
                if (Number.isInteger(key)) {
                    // access array element
                    if (this.content[key]) {
                        return this.content[key].get();
                    }
                } else if (key === "length") {
                    // access the length
                    return this.content.length;
                } else if (key in this.arrayFunc){
                    // access the array function
                    return this.arrayFunc[key];
                } else {
                    // other props we don't care
                    return target[key];
                }
            },

            set: (target, key, value) => {
                if (key < this.content.length && this.content[key]) {
                    this.content[key].set(value);
                    if (this.currentVersion[key] !== this.content[key].getVersion()) {
                        this.version += 1;
                    }
                } else {
                    let render = this.renders.get(key);
                    if (!render) {
                        render = this.renders.get("*");
                    }
                    if (render) {
                        this.content[key] = createImmu(value, render);
                        this.currentVersion[key] = 0;
                        cthis.version += 1;
                        if (this.collection) {
                            this.collection.add(this.content[key].getRendered());
                        }
                    }
                }
                               
            },
        });
    }

    lazyValue() {
        if (this.version !== this.keptVer) {
            this.data = [];
            this.content.forEach((elem, index)=>{
                this.data[index] = elem.get();
            });
        }
    }

    get() {
        this.lazyValue();
        return this.data;
    }


    set(data) {
        // don't allow declare a type first then change to another
        if (getShape(data) !== Shapes.ARRAY) {
            throw Error(`${JSON.stringify(data)} is not an array data`);
        }
        if (data.length !== this.content.length){
            // length changed, will need to sync the length first
            for (let i = this.content.length; i < data.length; i+=1) {
                this.arrayFunc.push(data[i]);
            }

            for(let i = this.data.length; i < this.content.length; i+=1) {
                this.arrayFunc.pop();
            }
        }
        this.content.forEach((elem, index)=>{
            if (elem) {
                elem.set(data[index]);
            }
        });
    }

    model() {
        return this.dataModel;
    }
}

class ComplexImmutabel extends ImmutabelInterface {

    /*
     * Renders an array:
     *  [[key, renderfunc], [key, renderfuc]]
     *  or it can be even nested
     *  [[key, [subkey, renderfunc]]]
     */
    constructor(data, renders, collection) {
        super(collection);
        if (getShape(data) !== Shapes.COMPLEX) {
            throw Error(`${JSON.stringify(data)} is not a complex data`);
        }

        this.data = data;
        this.content = new Map();
        this.version = 0;
        this.keptVer = 0;
        this.renders = new Map(renders);
        this.currentVersion = new Map();
        this.collection = new DomCollection();
        this.renders.forEach(
            (renderSet, key) => {
                if (false === key in data) {
                    return;
                }
                this.content.set(key, createImmu(data[key], renderSet, this.collection));
                this.currentVersion.set(key, 0);
                let renderRes = this.content.get(key).getRendered();
                if (renderRes) {
                    this.collection.add(renderRes);
                }
            }
        );
        this.dataModel = this.createProxy(data);
    }

    createProxy(data) {
        return new Proxy(data, {
            get: (target, key) => {
                // we don't care this prop
                if (!this.renders.has(key)) {
                    return target[key];
                }
                return this.content.get(key).get();
            },
            set: (target, key, value) => {
                if (!this.renders.has(key)) {
                    // we don't care this prop
                    target[key] = value;
                    return;
                }
                if (this.content.has(key)) {
                    this.content.get(key).set(value);
                    if (this.currentVersion.get(key) !== this.content.get(key).getVersion()) {
                        this.currentVersion.set(key, this.content.get(key).getVersion());
                        this.version += 1;
                    }
                    return;
                }
                // this is a new key
                this.content.set(key, createImmu(value, this.renders[key], this.collection));
                this.currentVersion.set(key, this.content.get(key).getVersion());
                this.version += 1;
                
            },
            deleteProperty : (target, key) => {
                if (this.content.has(key)) {
                    this.content.get(key).delete();
                    this.currentVersion.delete(key);
                    this.version += 1;
                    return;
                } else {
                    throw new Error(`Cannot delete non existing key:${key}`);
                }
            }
        });
    }

    lazyValue() {
        if (this.version !== this.keptVer) {
            this.data = {};
            this.keptVer = this.version;
            this.currentVersion.forEach(
                (v, key) => {
                    this.data[key] = this.content.get(key).get();
                }
            );
        }
    }

    get() {
        this.lazyValue();
        return this.data;
    }

    set(data) {
        // don't allow declare a type first then change to another
        if (getShape(data) !== Shapes.COMPLEX) {
            throw Error(`${JSON.stringify(data)} is not a complex data`);
        }

        let changed = false;
        this.renders.forEach(
            (v, key) => {
                if (!key in data) {
                    this.content.get(key).delete();
                    this.currentVersion.delete(key);
                    changed = true;
                }
            }
        );
        
        this.renders.forEach(
            (v,key) => {
                if (false === key in data) {
                    return;
                }
                if (this.content.has(key)) {
                    this.content.get(key).set(data[key]);
                    const ver = this.content.get(key).getVersion();
                    if (ver !== this.currentVersion.get(key)) {
                        this.currentVersion.set(key, ver);
                        changed = true;
                    }
                } else {
                    this.content.set(key, createImmu(data[key], this.renders[key], this.collection));
                    this.currentVersion.set(key, 0);
                }
            }
        );

        if (changed) {
            this.version += 1;
        }

        this.dataModel = this.createProxy(data);
    }

    getVersion() {
        return this.version;
    }

    bind(renders) {
        this.renders = renders;
        this.renders.forEach(
            (v,key) => {
                this.content.get(key).bind(v);
            }
        );
    }

    model() {
        return this.dataModel;
    }
}


export default createImmu;