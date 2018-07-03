
const Shapes = Object.freeze({
    ARRAY : Symbol('array'),
    COMPLEX : Symbol('complex'),
    SIMPLE : Symbol('simple')
}); 

function getShape(data) {
    if (Array.isArray(data)) {
        return Shapes.ARRAY;
    } else if (Object.prototype.toString.call(data) === '[object Object]') {
        return Shapes.COMPLEX;
    } 
    return Shapes.SIMPLE;
}

function createInmmu(value, render, order) {
    let shape = getShape(value);
    switch (shape) {
        case Shapes.ARRAY:
            return new ArrayInmmutabel(value, render);
        case Shapes.COMPLEX:
            return new ComplexInmmutabel(value, render, order);
        default:
            return new SimpleInmmutabel(value, render);
    }
}

class InmmutabelInterface {
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

    getRendered() {
        throw Error("Not done");
    }
}

class SimpleInmmutabel extends InmmutabelInterface{
    constructor(data, render) {
        super();
        if (getShape(data) !== Shapes.SIMPLE) {
            throw Error(`${JSON.stringify(data)} is not a simple data`);
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
        // just record it's been deleted
        if (this.deleteVerison !== null) {
            this.version = this.deleteVerison;
        } else {
            this.deleteVerison = this.history.length - 1;
        }
    }

    isDelete() {
        return this.version === this.deleteVerison;
    }

    getVersion() {
        return this.version;
    }

    getRendered() {
        return this.elem;
    }

    bind(render) {
        this.render = render;
        this.doRender();
    }

    doRender() {
        let elem = this.render(this.get(), this.elem);
        if (!this.elem) {
            this.elem = elem;
            return;
        }
        if (elem !== this.elem) {
            const p = this.elem.parent;
            p.remove(this.elem);
            p.append(elem);
        }
        this.elem = elem;
    }
} 


class ArrayInmmutabel extends InmmutabelInterface {
    constructor(data, renders) {
        super();
        if (getShape(data) !== Shapes.ARRAY) {
            throw Error(`${JSON.stringify(data)} is not an array data`);
        }
        this.content = [];
        this.currentVersion = [];
        this.keptVer = 0;
        this.version = 0;
        this.data = data;
        if (renders) {
            
        }
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
                            this.content[i] = createInmmu(data[i], renderSet);
                            this.currentVersion[i] = 0;
                        }
                    }
                } else if (Number.isInteger(key)) {
                    this.content[key] = createInmmu(data[key], renderSet);
                    this.currentVersion[i] = 0;
                    this.settedRenders[key] = true;
                }

                // another key we ignore
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
                        this.content.push(createInmmu(arguments[i], this.renders.get(i)));
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
                return res.get();
            },
            sort:() => {
                this.content.sort();
                this.currentVersion.sort();
                this.version += 1;
            },
            reverse: () => {
                this.content.reverse();
                this.currentVersion.reverse();
                this.version += 1;
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
                return res.shift();
            },
            unshift:() => {
                let i = 0;
                for (i = 0; i < arguments.length; i+=1) {
                    let render = this.renders.get(i);
                    if (!render) {
                        render = this.renders.get("*");
                    }
                    if (render) {
                        this.content.unshift(createInmmu(arguments[i], this.renders.get(i)));
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
                }
            },
            splice:() => {
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
                        this.content[i] = createInmmu(this.content[i], render);
                        this.currentVersion[i] = 0;
                        changed = true;
                    } else {
                        this.content[i] =  undefined;
                    }
                }

                if (changed) {
                    this.version += 1;
                }
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
                let changed = false;
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
                        this.content[key] = createInmmu(value, render);
                        this.currentVersion[key] = 0;
                        cthis.version += 1;
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

    getRendered() {
        let res = [];
        this.currentVersion.forEach(
            (v, index)=>{
                res.push(this.content[index].getRendered());
            }
        );
        return res;
    }

    model() {
        return this.dataModel;
    }
}

class ComplexInmmutabel extends InmmutabelInterface {

    /*
     * Renders an array:
     *  [[key, renderfunc], [key, renderfuc]]
     *  or it can be even nested
     *  [[key, [subkey, renderfunc]]]
     */
    constructor(data, renders) {
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

        this.renders.forEach(
            (renderSet, key) => {
                if (false === key in data) {
                    return;
                }
                this.content.set(key, createInmmu(data[key], renderSet));
                this.currentVersion.set(key, 0);   
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
                this.content.set(key, createInmmu(value, this.renders[key]));
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
                this.content.get(key).set(data[key]);
                const ver = this.content.get(key).getVersion();
                if (ver !== this.currentVersion.get(key)) {
                    this.currentVersion.set(key, ver);
                    changed = true;
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

    getRendered() {
        let res = [];
        this.currentVersion.forEach(
            (v, key)=>{
                res.push(this.content.get(key).getRendered());
            }
        );
        return res;
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


export default createInmmu;