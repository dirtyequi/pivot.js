function PivotChartYAxis(name, options, pivot) {
    this.index          = undefined;

    this.pivot          = pivot;

    // first shot to create an initial name
    this.options        = new PivotChartYAxisConfig(
        this.defaults(name),
        options
    ).get();

    // second try
    this.options        = new PivotChartYAxisConfig(
        this.options,    
        this.getYAxisConfigFromPivotField()
    ).get();

    return this;
}

PivotChartYAxis.prototype.getYAxisConfigFromPivotField = function() {
    var that = this;
    var config = {}; 

    $.each(this.pivot.config(true).fields, function(i, field) {
        if (field.name == that.getName(true) && typeof field.highcharts === 'object' && typeof field.highcharts.yAxis === 'object') {
            config = field.highcharts.yAxis;
            return false;
        }   
    });

    return config;
}

PivotChartYAxis.prototype.defaults = function(name) {
    return {
        title: {
            text:   name,
        },
    };
}

PivotChartYAxis.prototype.setIndex = function(index) {
    this.index  = index;
}

PivotChartYAxis.prototype.getIndex = function() {
    return this.index;
}

PivotChartYAxis.prototype.getName = function(short_name) {
    return (typeof short_name === 'boolean' && short_name)
        ? this.getShortName()
        : this.options.title.text;
}

PivotChartYAxis.prototype.getShortName = function() {
    return this.options.title.text.replace(/ \(.+\)?.*/, '');
}

PivotChartYAxis.prototype.get = function() {
    return this.options;
}
