import Pipeline from "./Pipeline"
import {createSVGElement} from "./DomCollection";

// factory functions
function axisLeft (){
    return new Axis("left");
}

function axisRight (){
    return new Axis("right");
}

function axisTop (){
    return new Axis("top");
}

function axisBottom (){
    return new Axis("bottom");
}


class Axis {
    constructor(direction) {
        this.ticks = 5;
        this.style = {
            "axis-line" : {
                "fill" : "#000",
                "stroke-width" : 1;
            },
            "axis-lable" : {
                "style" : {
                    fontSize: "0.75rem", 
                    fontWeight: 400, 
                    fontFamily: 'Roboto, Helvetica, Arial, sans-serif', 
                    lineHeight: "1.46429em", 
                    color: "rgba(0, 0, 0, 0.87)"
                }
            }
        };
        this.lableFormatter = (data) => data;
        this.pipline = new Pipeline([
            ["*", (data, element)=>{
                if (!element) {
                    let lable = createSVGElement("text", {
                        text : this.lableFormatter(data.lable), 
                        class : "axis-label"
                    });
                    let line = createSVGElement("line", this.style["axis-line"]);
                    let g = createSVGElement("g");
                    const length = Math.abs(data.end - data.start);
                    if(direction === "left" || direction === "right"){
                        g.attr("transform",`translate(0,${data.end})`);
                        lable.attr("x",0)
                            .attr("y", length/2);
                        line.attr("y1",0)
                            .attr("y2",length)
                            .attr("x1",0)
                            .attr("x2",0);
                    } else if (direction === "top" || direction === "bottom") {
                        g.attr("transform",`translate(${data.end},0)`);
                        lable.attr("y",0)
                            .attr("x", length/2);
                        line.attr("y1",0)
                            .attr("y2",0)
                            .attr("x1",0)
                            .attr("x2",length);
                    }
                    g.append(line);
                    g.append(lable);
                    return g;
                }
            }]]).outter("g",{},"svg");
    }
    ticks(ticksNumber) {
        this.ticks = ticksNumber;
    }
    lableFormatter(callback) {
        this.lableFormatter = callback;
    }
    get(interpolate) {
        const ask = [];
        const data = [];
        const inc = (interpolate.getMax() - interpolate.getMin()) / this.ticks;
        for (let i = 0; i < this.ticks; i+=1) {
            ask.push(interpolate.getMin() + inc*i);
        }
        const pos = interpolate.get(ask);
        for (let i = 0; i < this.ticks-1; i+=1) {
            data.push({
                lable: ask[i],
                start: pos[i],
                end: pos[i + 1]
            });
        }
        return this.pipline.bind(data);
    }
}

export {axisLeft, axisRight, axisTop, axisBottom}