
const Shapes = Object.freeze({
    ARRAY : Symbol('array'),
    COMPLEX : Symbol('complex'),
    SIMPLE : Symbol('simple')
}); 

const MaxHistory = 1000;

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
}

class SimpleInmmutabel extends InmmutabelInterface{
    constructor(data, render) {
        super();
        if (getShape(data) !== Shapes.SIMPLE) {
            throw Error(`${JSON.stringify(data)} is not a simple data`);
        }

        this.history = [data];
        this.deleteVerison = null;
        this.version = 0;
        this.render = render;
        this.elem = this.render(data, undefined);
    }
    get() {
        if (this.version === this.deleteVerison) {
            return undefined;
        }
        return this.history[this.version];
    }

    set(data) {
        this.elem = this.render(data, this.elem);
        for (let i = 0; i < this.history.length; i += 1) {
            if (this.history[i] === data) {
                this.version = index;
                return;
            }
        }
        this.history.push(data);
        this.version = this.history.length - 1;
    }

    delete() {
        if (this.deleteVerison !== null) {
            this.version = this.deleteVerison;
        } else {
            this.history.push(undefined);
            this.deleteVerison = this.history.length - 1;
        }
    }

    isDelete() {
        return this.version === this.deleteVerison;
    }

    getVersion() {
        return this.version;
    }

    setVersion(ver) {
        this.version = ver;
    }

    getRendered() {
        return this.elem;
    }

    bind(render) {
        this.render = render;
    }
} 


class ArrayInmmutabel extends InmmutabelInterface {
    constructor(data, render) {
        super();
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

        this.content = new Map();
        this.history = [];
        this.deleteHistory = [];
        this.version = 0;
        this.renders = new Map(renders);
        let initVersion = new Map();

        this.renders.forEach(
            (renderSet, key) => {
                this.content.set(key, createInmmu(data[key], renderSet));
                initVersion.set(key, 0);   
            }
        );
        this.history.push(initVersion);
        this.deleteHistory.push(false);
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
                let currentVersion = this.history[this.version];
                if (this.content.has(key)) {
                    this.content.get(key).set(value);
                    let keyVer = this.content.get(key).getVersion();
                    if (currentVersion[key] !== keyVer) {
                        // this is could be a new version, or we get back to a history
                        for (let i = 0; i < this.history.length; i += 1) {
                            if (this.history[i].get(key) === keyVer) {
                                this.version = i;
                                return;
                            }
                        }
                        // this is a new version
                        this.history.push(new Map());
                        let verSet = this.history[this.history.length - 1];
                        Object.assign(verSet, currentVersion);
                        verSet.set(key, keyVer);
                        this.version = this.history.length - 1;
                    }
                    return;
                }
                // this is a new key
                this.content.set(key ,createInmmu(value, this.renders[key]));
                this.history.push(new Map());
                let verSet = this.history[this.history.length - 1];
                Object.assign(verSet, currentVersion);
                verSet.set(key, keyVer);
                this.version = this.history.length - 1;
            },
            deleteProperty : (target, key) => {
                if (this.content.has(key)) {
                    this.content.get(key).delete();
                    let keyVer = this.content.get(key).getVersion();
                    if (currentVersion.get(key) !== keyVer) {
                        // this is could be a new version, or we get back to a history
                        for (let i = 0; i < this.history.length; i += 1) {
                            if (this.history[i].get(key) === keyVer) {
                                this.version = i;
                                return;
                            }
                        }

                        // this is a new version
                        this.history.push({});
                        let verSet = this.history[this.history.length - 1];
                        Object.assign(verSet, currentVersion);
                        verSet.set(key, keyVer);
                        this.version = this.history.length - 1;
                    }
                    return;
                } else {
                    throw new Error(`Cannot delete non existing key:${key}`);
                }
            }
        });
    }

    get() {
        let res = {}
        this.history[this.version].forEach(
            (v, key) => {
                if (!this.content.get(key).isDelete()) {
                    res.set(key, this.content.get(key).get());
                }
            }
        );
        return res;
    }

    set(data) {
        let verSet = new Map();
        this.history[this.version].forEach(
            (v, key) => {
                if (!key in data) {
                    this.content.get(key).delete();
                    verSet.set(key, this.content.get(key).getVersion());
                }
            }
        );
        this.createProxy(data);
        this.renders.forEach(
            (v,key) => {
                this.content.get(key).set(data[key]);
                verSet.set(key, this.content.get(key).getVersion());
            }
        );

        let currentVersion = this.history[this.version];
        if (currentVersion.size === verSet.size) {
            for (let i = 0; i < currentVersion.length; i +=1) {
                if (currentVersion[key] !== verSet[key]) {
                    // a new version
                    this.history.push(verSet);
                    this.version = this.history.length-1;
                    break;
                }
            }
        } else {
            this.history.push(verSet);
            this.version = this.history.length-1;
        }
    }

    getVersion() {
        return this.version;
    }

    getRendered() {
        let res = [];
        let currentVersion = this.history[this.version];
        currentVersion.forEach(
            (v, key)=>{
                res.push(this.content.get(key).getRendered());
            }
        );
        return res;
    }

    model() {
        return this.dataModel;
    }
}


export default createInmmu;