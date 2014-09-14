function PivotChartSingleSeries(y_axes, pivot, name, options) {
    
    this.y_axes         = y_axes; 
    this.pivot          = pivot;
    this.name           = name;

    this.y_axis         = this.y_axes.register(this.name);

    this.options        = new PivotChartSeriesConfig(
        {}, 
        this.getSeriesConfigFromPivotfield(),
        { yAxis: this.y_axis.index }
    );  

    this.data           = []; 

    
    return this;
}   

PivotChartSingleSeries.prototype.getSeriesConfigFromPivotfield = function() {
    var that = this;
    var config = {}; 

    $.each(this.pivot.config(true).fields, function(i, field) {
        if (    field.name == that.y_axis.axis_object.getName(true) &&
                typeof field.highcharts === 'object' && 
                typeof field.highcharts.series === 'object'
        ) {
            config = field.highcharts.series;
            return false;
        }   
    });

    if (Object.keys(config) == 0) {
        $.each(this.pivot.config(true).fields, function(i, field) {
            if (    field.name == that.name &&
                    typeof field.highcharts === 'object' &&
                    typeof field.highcharts.series === 'object'
            ) {
                config = field.highcharts.series;
                return false;
            }
        });
    }

    return config;
}

PivotChartSingleSeries.prototype.add = function(data) {
    this.data.push(data);
}     

PivotChartSingleSeries.prototype.getAxisName = function() {
    return this.name.replace(/\(.+\)?.*/, '');
}

PivotChartSingleSeries.prototype.getConfig = function() {
    return this.options;
}
