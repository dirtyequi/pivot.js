function PivotChartSeries(pivot, y_axes) {

    this.series         = {}; 
    this.pivot          = pivot;
    this.y_axes         = y_axes;
    return this;
}

PivotChartSeries.prototype.add = function(name, config) {
    return this.series[name] = new PivotChartSingleSeries(this.y_axes, this.pivot, name, config);
}

PivotChartSeries.prototype.remove = function(name) {
    if (this.exists(name))
        delete this.series[name];
}

PivotChartSeries.prototype.data = function(name, data) {
    if (!this.exists(name)) this.add(name, {});
    this.series[name].add(data);
}

PivotChartSeries.prototype.get = function(name) {
    if (typeof name === 'undefined')    return this.series;
    return this.series[name];
}

PivotChartSeries.prototype.exists = function(name) {
    return (typeof this.series[name] !== 'undefined');
}
