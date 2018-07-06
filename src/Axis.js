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
                stroke : "#000",
                strokeWidth : 1,
            },
            "axis-label" : {
                fontSize: "0.75rem", 
                fontWeight: 400, 
                fontFamily: 'Roboto, Helvetica, Arial, sans-serif', 
                lineHeight: "1.46429em", 
                color: "rgba(0, 0, 0, 0.87)"
            }
        };
        this.labelFormatter = (data) => data;
        this.direction = direction;
        this.pipline = new Pipeline([
            ["*", (data, element)=>{
                if (!element) {
                    let label = createSVGElement("text", {
                        text : this.labelFormatter(data.label), 
                        class : "axis-label"
                    }).style(this.style["axis-label"]);
                    
                    let line = createSVGElement("line").style(this.style["axis-line"]);
                    let g = createSVGElement("g");
                    const length = Math.abs(data.end - data.start);
                    if(direction === "left" || direction === "right"){
                        g.attr("transform",`translate(0,${0-data.end})`);
                        label.attr("x",0)
                            .attr("y", 0-length/2)
                            .attr("transform", `translate(10,0)`);
                        line.attr("y1",0)
                            .attr("y2",0-length)
                            .attr("x1",0)
                            .attr("x2",0);
                        if (direction === "left") {
                            label.attr("text-anchor", "end");
                        } 
                        label.attr("text-anchor", "start");
                    } else if (direction === "top" || direction === "bottom") {
                        g.attr("transform",`translate(${data.end},0)`);
                        label.attr("y",0)
                            .attr("x", 0-length/2);
                        line.attr("y1",0)
                            .attr("y2",0)
                            .attr("x1",0)
                            .attr("x2",0-length);
                    }
                    g.append(line);
                    g.append(label);
                    return g;
                }
            }]]).outter("g",{},"svg");
    }
    ticks(ticksNumber) {
        this.ticks = ticksNumber;
    }
    interval(i) {
        this.interval = i;
    }
    labelFormatter(callback) {
        this.labelFormatter = callback;
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
                label: ask[i],
                start: pos[i],
                end: pos[i + 1]
            });
        }
        if (this.direction === "left" || this.direction === "right") {
            this.pipline.collection.staticDomNodes[0].attr("transform", `translate(0,${pos[pos.length-1]})`);
        }
        return this.pipline.bind(data);
    }
}

export {axisLeft, axisRight, axisTop, axisBottom}