function PivotChartSeriesConfig() {
    this.options     = this.defaults();

    for (var i = 0; i < arguments.length; i++) {
        this.options = $.extend(true, this.options, arguments[i]);
    }   

    return this;
}

PivotChartSeriesConfig.prototype.defaults = function() {
    return {
        type:   'spline',
    };  
}

PivotChartSeriesConfig.prototype.get = function() {
    return this.options;
}
