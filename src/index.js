import PiplineClass from "../src/Pipline"

function Pipline() {
    return new PiplineClass(...arguments);
}

export {Pipline};