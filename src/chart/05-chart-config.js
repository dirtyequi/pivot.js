function PivotChartConfig() {
    this.options    = this.defaults();

    for (var i = 0; i < arguments.length; i++) {
        this.options = $.extend(true, this.options, arguments[i]);  // true for deep-copy
    }   

    return this;
}

PivotChartConfig.prototype.defaults = function() {
    return {
        chart:  {
            zoomType:           [ 'x', 'xy', ],
            resetZoomButton:    { 
                position: {
                    align:  'left',
                    y:      '0px',
                    x:      '0px',
                },
            },
        },
        title:  {
            text:               'Unnamed Chart',
        },
        credits: {
            enabled:            false,
        },
        xAxis: {
            type:               'datetime',
        },
        plotOptions:            {},
        yAxis:                  [],
        series:                 [],
    };
}

PivotChartConfig.prototype.get = function() {
    return this.options;
}
