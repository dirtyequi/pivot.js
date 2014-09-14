function PivotChartYAxisConfig() {
    this.options     = this.defaults();


    for (var i = 0; i < arguments.length; i++) {
        this.options = $.extend(true, this.options, arguments[i]);
    }   

    return this;
}

PivotChartYAxisConfig.prototype.defaults = function() {
    return {
        title:  {
            text:   'Unnamed y-Axis',
        },
    };
}

PivotChartYAxisConfig.prototype.get = function() {
    return this.options;
}
