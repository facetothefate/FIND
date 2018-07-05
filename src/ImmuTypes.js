import { DomCollection } from "./DomCollection";
import {Shapes, getShape} from "./Shapes";


// Factory method
function createImmu(value, render) {
    let vshape = getShape(value);
    let rshape = getShape(render);
    switch (vshape) {
        case Shapes.ARRAY:
            return new ArrayImmutabel(value, render);
        case Shapes.COMPLEX:
            // if user gives out a speific key, then we create as a complex
            // if user wish to use the whole object as a single value we create as a simple
            // which makes the following can happen:
            // <div> data.body </div>
            if (rshape === Shapes.ARRAY) {
                return new ComplexImmutabel(value, render);
            } else if (rshape === Shapes.FUNCTION) {
                return new SimpleImmutabel(value, render);
            }
        default:
            return new SimpleImmutabel(value, render);
    }
}

class ImmutabelInterface {
    constructor() {
        this.collection = new DomCollection();
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

    initRender() {
        throw Error("Not done");
    }
}

class SimpleImmutabel extends ImmutabelInterface{
    constructor(data, render) {
        super();
        if (getShape(render) !== Shapes.FUNCTION) {
            throw Error(`Cannot bind ${JSON.stringify(data)} to a complex renderset`);
        }
        this.currentData = data;
        this.deleteVerison = null;
        this.version = 0;
        this.render = render;
        this.elem = null;
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

    initRender() {
        this.doRender();
    }

    doRender() {
        let elem = this.render(this.get(), this.elem);
        if (!this.elem) {
            this.elem = elem;
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
        super();
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
        this.dataModel = this.createProxy(data);

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
            push:(data) => {
                let render = this.renders.get(this.content.length);
                if (!render) {
                    render = this.renders.get("*");
                }
                if (render) {
                    const newImmu = createImmu(data, render);
                    this.content.push(newImmu);
                    this.currentVersion.push(0);
                    this.collection.addSubCollection(newImmu.collection);
                    newImmu.initRender();
                }
                this.version += 1;
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
            unshift:(data) => {
                let render = this.renders.get(0);
                if (!render) {
                    render = this.renders.get("*");
                }
                if (render) {
                    const newImmu = createImmu(data, render);
                    this.content.unshift(newImmu);
                    this.currentVersion.push(0);
                    this.collection.offerSubCollection(newImmu.collection);
                    newImmu.initRender();
                }
                this.version += 1;
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
                }
            },
            splice:(start, deleteCount, data) => {
                let changed = false;
                for (let i = start; i < start + deleteCount; i+=1) {
                    if (this.content[i]) {
                        this.content[i].delete();
                    }
                }
                this.version += 1;
                this.content.splice(start, deleteCount);
                this.currentVersion.splice(start, deleteCount);

                let render = this.renders.get(i);
                if (!render) {
                    render = this.renders.get("*");
                }
                if (render) {
                    // to-do need subcollection insert to the right pos instead of tail
                    this.content[start + 1] = createImmu(data, render);
                    this.currentVersion[start + 1] = 0;
                    this.collection.addSubCollection(this.content[0].collection);
                    this.content[start + 1].initRender();
                    changed = true;
                } else {
                    this.content[i] =  undefined;
                }
            },
        }
    }

    initRender() {
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
                    for(let i = 0; i < this.data.length; i+=1) {
                        if (false === i in this.settedRenders) {
                            this.content[i] = createImmu(this.data[i], renderSet);
                            this.currentVersion[i] = 0;
                            this.collection.addSubCollection(this.content[i].collection);
                            this.content[i].initRender();
                        }
                    }
                } else if (Number.isInteger(key)) {
                    this.content[key] = createImmu(this.data[key], renderSet);
                    this.currentVersion[i] = 0;
                    this.collection.addSubCollection(this.content[i].collection);
                    this.content[i].initRender();
                    this.settedRenders[key] = true;
                }
                // another keys we ignore to save memory
            }
        );
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
                } else if (key >= this.content.length){
                    let render = this.renders.get(key);
                    if (!render) {
                        render = this.renders.get("*");
                    }
                    if (render) {
                        this.content[key] = createImmu(value, render);
                        this.currentVersion[key] = 0;
                        this.collection.addSubCollection(this.content[key].collection);
                        this.content[key].initRender();
                        this.version += 1;
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

    delete() {
        this.content.forEach((elem)=>{
            elem.delete();
        });
        const parent = this.collection.parent;
        if (parent) {
            parent.removeSubCollection(this.collection);
        }
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
        super();
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
        this.dataModel = this.createProxy(data);
    }

    initRender() {
        this.renders.forEach(
            (renderSet, key) => {
                if (false === key in this.data) {
                    return;
                }
                const newImmu = createImmu(this.data[key], renderSet);
                this.content.set(key, newImmu);
                this.currentVersion.set(key, 0);
                this.collection.addSubCollection(newImmu.collection);
                newImmu.initRender();
            }
        );
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
                const newImmu = createImmu(value, renderSet);
                this.content.set(key, newImmu);
                this.currentVersion.set(key, 0);
                // to-do need to find the right pos to insert the collection
                this.collection.addSubCollection(newImmu.collection);
                newImmu.initRender();
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
                    const newImmu = createImmu(data[key], renderSet);
                    this.content.set(key, newImmu);
                    this.currentVersion.set(key, 0);
                    this.collection.addSubCollection(newImmu.collection);
                    newImmu.initRender();
                }
            }
        );

        if (changed) {
            this.version += 1;
        }

        this.dataModel = this.createProxy(data);
    }

    delete() {
        this.content.forEach((elem)=>{
            elem.delete();
        });
        const parent = this.collection.parent;
        if (parent) {
            parent.removeSubCollection(this.collection);
        }
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