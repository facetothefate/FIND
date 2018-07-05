const Shapes = Object.freeze({
    ARRAY : Symbol('array'),
    COMPLEX : Symbol('complex'),
    SIMPLE : Symbol('simple'),
    FUNCTION : Symbol('function')
}); 

function getShape(data) {
    if (Array.isArray(data)) {
        return Shapes.ARRAY;
    } else if (Object.prototype.toString.call(data) === '[object Object]') {
        return Shapes.COMPLEX;
    }  else if (Object.prototype.toString.call(data) === '[object Function]') {
        return Shapes.FUNCTION;
    }
    return Shapes.SIMPLE;
}

export {Shapes, getShape}