function PivotChart(elem, options) {

    this.elem                   = elem;
    this.$elem                  = $(elem);

    if (options.pivot == undefined && typeof options.pivot !== 'object') {
        throw 'options.pivot must contain a pivot object';
    }
    this.pivot                  = options.pivot;
    delete options.pivot;

    this.y_axes                 = new PivotChartYAxes(this.pivot);

    this.series                 = undefined;

    this.chart                  = undefined;

    this.options                = $.extend(true, {}, this.defaults(), options);

    this.$elem.trigger('init');
    this.initialize();
    this.$elem.trigger('update');

    return this;
}

PivotChart.prototype.defaults = function() {
    return {
        // functions for event handlers
        on_init:                undefined,
        before_process:         undefined,
        on_process:             undefined,
        after_process:          undefined,
        on_ready:               undefined,

        // default chart configuration
        chart: {},
    };
}

PivotChart.prototype.initialize = function() {
    var that    = this,
        dfd     = new $.Deferred();

    this.$elem.bind('update', function() {
        that.draw();
    });

    dfd.resolve();
    return dfd.promise();
}

PivotChart.prototype.generateSeriesData = function(date, object) {
    var that = this;

    var appendix_names  = [];
    var data            = {};

    // make deep copy of object
    object = $.extend(true, {}, object);

    // create string names as appendixes
    $.each(Object.keys(object), function(i, key) {

        // convert percentage values back to float
        var pattern = /(\d+(?:.\d+))?(?:\s*)?\%/;
        if (pattern.test(object[key])) {
            object[key] = parseFloat(object[key].toString().replace('%', ''));
            
        }

        // create string types as appendixes
        if (typeof object[key] !== 'string') return;
        appendix_names.push(object[key]);
    });

    // create number type series
    $.each(Object.keys(object), function(i, key) {
        if (typeof object[key] !== 'number') return;
        var sn = (appendix_names.length == 0) ? key : key+' ('+appendix_names.join(' ')+')';
        data[sn] = [date, object[key]];
    });

    return data;
}

PivotChart.prototype.draw = function() {
    var that            = this;

    this.y_axes.reset();
    this.series         = new PivotChartSeries(this.pivot, this.y_axes);

    this.$elem.empty();

    this.$elem.trigger('process');

    // process all pivot results
    $.each(this.pivot.results().all(), function(pri, object) {

        var obj = $.extend({},object);

        // sample row data for accessing the appropriate report_date
        var row_data = obj.rows[0];

        // delete unused data
        if (obj.rows !== undefined) 
            delete obj.rows;

        delete obj.Datum;

        // create series data
        var _series = that.generateSeriesData(
            sd.mapRowDate(configurator.get_resolution(), row_data.report_date).chart,
            obj
        );

        // create series objects and fill with their data
        $.each(_series, function(name, data) {
            if (!that.series.exists(name))  that.series.add(name);
            that.series.data(name, data); 
        });
    });


    // check if we can trigger the chart draw process, based on columnLabels in pivot.config()
    if (typeof this.pivot.config().columnLabels !== 'undefined' && this.pivot.config().columnLabels.length > 0) {
        this.$elem.trigger('fail', {
            message:        'Chart cannot be drawn',
            description:    'Your Pivottable contains at least one group field (columnLabel). Please remove that and re-add it as a data field (rowLabel)',
        });
        return;
    }

    // define y Axises
    var yAxis           = [];
    $.each(this.y_axes.get(), function(index, axis) {
        yAxis.push(axis.get());
    });

    // defined series
    var series_data     = [];
    $.each(this.series.get(), function(i, object) {

        var sc  = object.options.options;
        sc.name = object.name;

        if (typeof sc.displayFunction === 'function') {
            sc.data = [];


            $.each(object.data, function(i, obj) {
                sc.data.push( [ obj[0], sc.displayFunction(obj[1]) ] );
            });
        } else {
            sc.data = object.data;
        }

        // sort data
        sc.data.sort(function(a,b) {
            if ( (a[0] >    b[0] && a[1] >  b[1]) ) return 1;
            if ( (a[0] ==   b[0] && a[1] == b[1]) ) return 0;
            if ( (a[0] <    b[0] && a[1] <  b[1]) ) return -1;
        });

        series_data.push(sc);
    });

    this.options.chart = new PivotChartConfig($.extend(true, {},
        {
            chart:  {
                renderTo:       this.$elem[0],
            },
            yAxis:  yAxis,
            series: series_data,
        }, 
        this.options.chart
    )).get();

    this.chart = new Highcharts.Chart(this.options.chart);

    this.$elem.trigger('ready');
}
function PivotChartYAxes(pivot_config) {

    this.pivot_config   = pivot_config;
    this.axes           = [];
}

PivotChartYAxes.prototype.register = function(name, config) {
    var axis = new PivotChartYAxis(name, config, this.pivot_config);

    if (!this.exists(axis.getName()) && !this.exists(axis.getName(true))) {
        this.axes.push(axis);
        axis.setIndex(this.axes.length);
    }

    return this.get(axis.getName(true));
}       
        
PivotChartYAxes.prototype.reset = function() {
    this.axes = [];
}

PivotChartYAxes.prototype.exists = function(axis) {
    return (typeof this.get(axis) !== 'undefined');
}
    
PivotChartYAxes.prototype.get = function(axis) {
    var r;

    if (typeof axis === 'undefined')
        return this.axes;

    // get by index
    if (typeof axis === 'number')
        return {
            index:  axis,
            axis:   this.axes[axis].get(),
        };

    // get by (short) name
    $.each(this.axes, function(index, axis_object) {
        if (axis_object.getName() == axis || axis_object.getName(true) == axis) {
            r = {
                index:          index,
                axis:           axis_object.get(), 
                axis_object:    axis_object,
            };
            return false;
        }
    });
    return r;
}
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
