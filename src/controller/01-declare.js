/**
 * PivotController
 * @class
 * @desciption Creates a new PivotController object
 * @param {string} elem - The DOM element id of the referring element
 * @param {Object} options - The configuration object
 * @borrows Pivot as this.pivot
 * @returns {Object} PivotController
 * @fires PivotController#init
 * @fires PivotController#update
 * @fires PivotController#ready
 */
function PivotController(elem, options) {

    this.elem           = elem;
    this.$elem          = $(elem);

    // the Pivot object
    this.pivot          = options.pivot;
    delete options.pivot;

    this.options        = $.extend(true, {}, this.defaults(), options);

    // assign templates for less clerical work ^^
    this.templates      = this.options.templates;
    delete options.templates;

    // assign plugins
    this.plugins        = {};

    // trigger init event
    this.$elem.trigger('init');

    var that            = this;
    $.when(
        this.register_plugins(),
        this.build_controllers(),
        this.initialize()
    ).done(function() {
        delete that.options.plugins;
        that.$elem.trigger('update');
    });
    
    if (this.options.autorun) this.run_plugins();

    this.$elem.trigger('ready');
    return this;
}

/**
 * @function defaults
 * @description Returns an object with the default configuration for this object
 * @returns {Object}
 */
PivotController.prototype.defaults = function() {
    return {
        // whether to autorun plugins (or not)
        autorun:                            true,

        // whether to create DOM elements for these controllers (or not)
        build_filter_list:                  true,
        build_row_label_fields:             true,
        build_column_label_fields:          true,
        build_summary_fields:               true,
        build_report_list:                  true, 

        // predefined reports
        reports:                            [], // none predefined

        // predefined plugins
        plugins:                            [], // none predefined

        // DOM elements
        elements: {
            // element where the filters reside
            filter_list:                            '#pivot-filter-list-'+          uuid.v4(),
            row_label_fields:                       '#pivot-row-label-fields'+      uuid.v4(),
            column_label_fields:                    '#pivot-column-label-fields-'+  uuid.v4(),
            summary_fields:                         '#pivot-summary-fields-'+       uuid.v4(),

            // report list container
            pivot_reports_list:                     '#pivot-reports-'+              uuid.v4(),
            // clickable report element
            // triggers the pivot's object process() method and redraws table with the report's configuration
            report_field_clickable:                 'a',

            // pivot filter details element
            pivot_filter_details:                   '#pivot-filter-details-'+       uuid.v4(),
        },

        // templates
        templates: {
            build_select_filter_field:              '#build-select-filter-field',
            build_filter_field:                     '#build-filter-field',
            build_filter_list:                      '#build-filter-list',
            build_toggle_fields:                    '#build-toggle-fields',
        },

        // event handler functions
        on_update: function() {
            this.update_plugins();
        },
    };
}

