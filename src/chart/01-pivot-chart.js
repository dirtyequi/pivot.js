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
