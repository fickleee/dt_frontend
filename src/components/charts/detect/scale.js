import * as d3 from 'd3';

export const getXScale = (dMax, dMin, rMax, rMin) => {
    return d3.scaleLinear()
        .domain([dMin, dMax])
        .range([rMin, rMax]);
};

export const getTimeScale = (dMax, dMin, rMax, rMin) => {
    return d3.scaleTime()
        .domain([new Date(dMin), new Date(dMax)])
        .range([rMin, rMax]);
};

export const getYScale = (dMax, dMin, rMax, rMin) => {
    return d3.scaleLinear()
        .domain([dMin, dMax])
        .range([rMin, rMax])
        .nice();
};
