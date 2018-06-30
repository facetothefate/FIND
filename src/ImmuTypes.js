
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
    constructor(data, renders) {
        super();
        if (getShape(data) !== Shapes.COMPLEX) {
            throw Error(`${JSON.stringify(data)} is not a complex data`);
        }

        this.content = {};
        this.history = [];
        this.deleteHistory = [];
        this.version = 0;
        this.renders = renders;

        let initVersion = {};
        Object.keys(data).forEach(
            (key) => {
                this.content[key] = createInmmu(data[key], this.renders[key]);
                initVersion[key] = 0;   
            }
        );
        this.history.push(initVersion);
        this.deleteHistory.push(false);
        this.dataModel = this.createProxy(data);
    }

    createProxy(data) {
        return new Proxy(data, {
            get: (target, key) => this.content[key].get(),
            set: (target, key, value) => {
                let currentVersion = this.history[this.version];
                if (key in this.content) {
                    this.content[key].set(value);
                    let keyVer = this.content[key].getVersion();
                    if (currentVersion[key] !== keyVer) {
                        // this is could be a new version, or we get back to a history
                        for (let i = 0; i < this.history.length; i += 1) {
                            if (this.history[i][key] === keyVer) {
                                this.version = i;
                                return;
                            }
                        }

                        // this is a new version
                        this.history.push({});
                        let verSet = this.history[this.history.length - 1];
                        Object.assign(verSet, currentVersion);
                        verSet[key] = keyVer;
                        this.version = this.history.length - 1;
                    }
                    return;
                }
                // this is a new key
                this.content[key] = createInmmu(value, this.renders[key]);
                this.history.push({});
                let verSet = this.history[this.history.length - 1];
                Object.assign(verSet, currentVersion);
                verSet[key] = keyVer;
                this.version = this.history.length - 1;

            },
            deleteProperty : (target, key) => {
                if (key in this.content) {
                    this.content[key].delete();
                    let keyVer = this.content[key].getVersion();
                    if (currentVersion[key] !== keyVer) {
                        // this is could be a new version, or we get back to a history
                        for (let i = 0; i < this.history.length; i += 1) {
                            if (this.history[i][key] === keyVer) {
                                this.version = i;
                                return;
                            }
                        }

                        // this is a new version
                        this.history.push({});
                        let verSet = this.history[this.history.length - 1];
                        Object.assign(verSet, currentVersion);
                        verSet[key] = keyVer;
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
        Object.keys(this.history[this.version]).forEach(
            (key) => {
                if (!this.content[key].isDelete()) {
                    res[key] = this.content[key].get();
                }
            }
        );
        return res;
    }

    set(data) {
        let verSet = {};
        Object.keys(this.history[this.version]).forEach(
            (key) => {
                if (!key in data) {
                    this.content[key].delete();
                    verSet[key] = this.content[key].getVersion();
                }
            }
        );
        this.createProxy(data);
        Object.keys(data).forEach((key) => {
            this.content[key].set(data[key]);
            verSet[key] = this.content[key].getVersion();
        });

        let currentVersion = this.history[this.version];
        if (currentVersion.keys().length === verSet.keys().length) {
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

    getRendered(order) {
        let res = [];
        let currentVersion = this.history[this.version];
        if (order) {
            order.forEach((key)=>{
                let shape = getShape(key);
                if (shape === Shapes.SIMPLE && key in currentVersion) {
                    res.push(this.content[key].getRendered());
                } else if (shape === Shapes.COMPLEX && key.key in currentVersion) {
                    res.join(this.content[key].getRendered(key.order));
                }
            });
        } else {
            currentVersion.forEach((key)=>{
                if (key in currentVersion) {
                    res.push(this.content[key].getRendered());
                }
            });
        }
        return res;
    }

    model() {
        return this.dataModel;
    }
}


export default createInmmu;