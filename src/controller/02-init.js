/**
 * @function initialize
 * @description Install the 'update' handler on the referring DOM element
 * @description Also installs handlers when pivot settings (filters, fields, reports) have been changed
 * @description Updates filter details
 * @event PivotController#update
 */
PivotController.prototype.initialize = function() {
    var that    = this,
        dfd     = new $.Deferred();

    // bind update event to on.update function
    this.$elem.bind('update', function() {
        that.update_filter_details();

        if (typeof that.options.on_update === 'function') {
            $.proxy(that.options.on_update, that)(); 
        }
    });

    // bind build action to select element when it's value changes
    $(this.options.elements.filter_list).find('select:first').change(function(){
        that.build_filter_field($(this).val());
    });

    // install handlers for toggle fields
    $(this.options.elements.row_label_fields).find('.row-labelable').on('change', function(event) {
        var fields = that.get_checked_fields('row-labelable');
        that.pivot.display()['rowLabels']().set(fields);
        that.$elem.trigger('update');
    });

    $(this.options.elements.column_label_fields).find('.column-labelable').on('change', function(event) {
        var fields = that.get_checked_fields('column-labelable');
        that.pivot.display()['columnLabels']().set(fields);
        that.$elem.trigger('update');
    });

    $(this.options.elements.summary_fields).find('.summary').on('change', function(event) {
        var fields = that.get_checked_fields('summary');
        that.pivot.display().summaries().set(fields);
        that.$elem.trigger('update');
    });

    dfd.resolve();
    return dfd.promise();
}

/**
 * @function build_controllers 
 * @description Builds DOM elements for pivot settings
 */
PivotController.prototype.build_controllers = function() {
    var dfd = new $.Deferred();

    if (this.options.build_filter_list)         this.build_filter_list();

    if (this.options.build_row_label_fields)    this.build_toggle_fields(
            this.options.elements.row_label_fields,
            this.pivot.fields().rowLabelable(),
            'row-labelable'
        );
    
    if (this.options.build_column_label_fields) this.build_toggle_fields(
            this.options.elements.column_label_fields,
            this.pivot.fields().columnLabelable(),
            'column-labelable'
        );

    if (this.options.build_summary_fields)      this.build_toggle_fields(
            this.options.elements.summary_fields,
            this.pivot.fields().summarizable(),
            'summary'
        );

    if (this.options.build_report_list)         this.build_report_fields(
            this.options.elements.pivot_reports_list,
            this.options.reports
        );

    dfd.resolve();
    return dfd.promise();
}

