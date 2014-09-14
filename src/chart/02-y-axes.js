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
