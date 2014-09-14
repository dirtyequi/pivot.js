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

/**
 * @function install_filter_handlers 
 * @description (Re)install filter settings handlers after they have been (re)drawn
 * @fires PivotController#update
 */
PivotController.prototype.install_filter_handlers = function() {
    var that = this;

    // remove all possible handlers
    $(this.options.elements.filter_list).find('select.filter').each(function() { $(this).unbind(); });
    $(this.options.elements.filter_list).find('input[type=text].filter').each(function() { $(this).unbind(); });
    $(this.options.elements.filter_list).find('.remove-filter-field').each(function() { $(this).unbind(); });

    // install handler for filter list (select)
    $(this.options.elements.filter_list).find('select.filter').each(function() {
        $(this).on('change', function(event) {
            var restrictions = that.get_filter_restrictions();
            that.pivot.filters().set(restrictions);
            that.$elem.trigger('update');
        });
    });
 
    // install handler for filter list (input)
    $(this.options.elements.filter_list).find('input[type=text].filter').each(function() {
        $(this).on('keyup', function(event) {
            var filterInput = this,
                eventValue  = $(filterInput).val();

            setTimeout(function() {
                if ($(filterInput).val() === eventValue) {
                    var restrictions = that.get_filter_restrictions();
                    that.pivot.filters().set(restrictions);
                    that.$elem.trigger('update');
                }
            }, 500);
        });
    });

    // install handler for removing a filter
    $(this.options.elements.filter_list).find('.remove-filter-field').each(function() {
        var filter = $(this);
        $(this).bind('click', function() {
            filter.closest('form').remove();

            var restrictions = that.get_filter_restrictions();
            that.pivot.filters().set(restrictions);
            that.$elem.trigger('update');
        });
    });

}
PivotController.prototype.register_plugins = function() {
    var that    = this,
        dfd     = new $.Deferred();

    $.each(this.options.plugins, function(i, plugin) {
        that.register_plugin(plugin);
    });

    dfd.resolve();
    return dfd.promise();
}

PivotController.prototype.register_plugin = function(plugin) {
    var dfd = new $.Deferred();

    if (typeof plugin !== 'object')         plugin = {};
    if (typeof plugin.id === undefined)     dfd.reject({message: 'Plugin id must be given to get bound to a DOM element'});
    if (!$(plugin.id).length)               dfd.reject({message: 'DOM element id '+plugin.id+' does not exist'});
    if (typeof plugin.name === undefined)   dfd.reject({message: 'No plugin name given'});

    this.plugins[plugin.name] = {
        id:         plugin.id,
        options:    plugin.options,
    };

    dfd.resolve();
    return dfd.promise();
}

PivotController.prototype.run_plugins = function() {
    var that    = this;

    $.each(Object.keys(this.plugins), function(i, name) {
        that.run_plugin(name);
    });
}

PivotController.prototype.run_plugin = function(name) {
    var plugin = this.plugins[name];
    $(plugin.id)[name]($.extend(true, plugin.options, { pivot: this.pivot }));
}

PivotController.prototype.update_plugins = function() {
    var that    = this;

    $.each(Object.keys(this.plugins), function(i, name) {
        that.update_plugin(name);
    });
}

PivotController.prototype.update_plugin = function(name) {
    var plugin = this.plugins[name];
    $(plugin.id).trigger('update');
}
/**
 * @function get_checked_fields
 * @description Returns all field names of check-able DOM elements
 * @param {string} type - The class name part of the DOM element
 * @returns {Array} fields - Array of field names
 */
PivotController.prototype.get_checked_fields = function(type) {
    var fields = [];
    this.$elem.find('.'+type+':checked').each(function(index) {
        fields.push($(this).attr('data-field'));
    });
    return fields;
}

/**
 * @function get_filter_restrictions
 * @description Returns an object with all filter restrictions
 * @returns {Object} restrictions - Object with filter restrictions
 */
PivotController.prototype.get_filter_restrictions = function() {
    var that            = this,
        restrictions    = {};

    $(this.options.elements.filter_list).find('.filter').each(function(index) {
        var field = that.pivot.fields().get($(this).attr('data-field'));

        if ($(this).val() !== null && $(this).val()[0] !== ''){
            if (field.filterType === 'regexp') {
                restrictions[$(this).attr('data-field')] = new RegExp($(this).val(),'i');
            } else {
                restrictions[$(this).attr('data-field')] = $(this).val();
            }
        }
    });

    return restrictions;
}
PivotController.prototype.build_filter_list = function() {
    var that = this;
    var filter_id = uuid.v1();

    var select = useTemplate($(this.templates.build_filter_list).html(), [ {
        id: filter_id,
    } ] );  

    $.each(this.pivot.fields().filterable(), function(index, field) {
        var opt = $('<option/>').html(field.name);
        select.append(opt);
    });

    $(this.options.elements.filter_list).empty().append(select);

    // apply pre-defined filters (from init)
    $.each(this.pivot.filters().all(), function(fieldName, restriction) {
        that.build_filter_field(fieldName, restriction);
    });

}

PivotController.prototype.build_regexp_filter_field = function(field, selectedValue) {
    if (selectedValue === undefined) selectedValue = "";
    return $('<input/>').attr('type', 'text').addr('data-field', field.name).addClass('filter form-control').val(selectedValue);
}

PivotController.prototype.build_select_filter_field = function(field, selectedValue) {

    var select_filter_field = useTemplate($(this.templates.build_select_filter_field).html(), [ {
        field:          field.name,
        multiselect:    (field.filterType === 'multiselect') ? 'multiple' : '',
    } ] );

    var orderedValues = [];
    for (value in field.values) {
        orderedValues.push(value);
    }
    orderedValues = orderedValues.sort();

    $.each(orderedValues, function(index, value) {
        var option = $('<option/>').attr('value', value).html(field.values[value].displayValue);
        if (value == selectedValue) {
            option.attr('selected', 'selected');
        }
        select_filter_field.append(option);
    });

    return select_filter_field;
}

PivotController.prototype.build_filter_field = function(fieldName, selectedValue) {
    if (fieldName === '') return;
    var snip,
        remove_filter,
        that    = this,
        field   = this.pivot.fields().get(fieldName);

    if (field.filterType === 'regexp')
        snip = this.build_regexp_filter_field(field, selectedValue);
    else
        snip = this.build_select_filter_field(field, selectedValue);

    var filter_field = useTemplate($(this.templates.build_filter_field).html(), [ {
        label:  field.name,
        filter: snip.outerHTML(),
    } ] );

    $(this.options.elements.filter_list).append(filter_field);

    this.install_filter_handlers();
}

PivotController.prototype.build_toggle_fields = function(ul, fields, class_name) {
    var that = this;
    $(ul).empty();

    $.each(fields, function(index, field){
        var toggle_fields = useTemplate($(that.templates.build_toggle_fields).html(), [ {
            label:      field.name,
            class_name: class_name,
        } ] );
        $(ul).append(toggle_fields);
    });

    var displayFields;
    if (class_name === 'row-labelable')
        displayFields = this.pivot.pivotDisplayRowLabels().get();
    else if (class_name === 'column-labelable')
        displayFields = this.pivot.pivotDisplayColumnLabels().get();
    else if (class_name === 'summary') 
        displayFields = this.pivot.pivotDisplaySummaries().get();
    else 
        throw 'Unsupported class '+class_name;

    for (var fieldName in displayFields) {
        var elem = $(ul + ' input[data-field="' + fieldName +'"]');
        elem.prop("checked", true);
        this.order_checked(ul, elem);
    };

    // order listener
    $(ul + ' input').on("click", function(){
        if (this.checked) {
            that.order_checked(ul, this);
        } else {
            var field = $(this).parent().detach()[0];
            $(ul).append( field );
        }
    });
}

PivotController.prototype.order_checked = function(parent, elem) {
    var last_checked = $(parent + ' input:checked');    // last changed field (lcf)
    var field        = $(elem).parent().detach()[0];    // pluck item from div
    var children     = $(parent).children();

    //subtract 1 because clicked field is already checked
    // insert plucked item into elem at index
    if ((last_checked.length-1) === 0)
         $(parent).prepend( field );
    else if (children.length < last_checked.length)
        $(parent).append( field );
    else
        $(children[last_checked.length-1]).before( field );
}

PivotController.prototype.build_report_fields = function(elem, reports) {
    var that    = this;
    $(elem).empty();

    $.each(reports, function(i, obj) {
        var report_field = useTemplate($('#canned_report').html(), [ {
            id:     obj.id,
            label:  obj.label,
            icon:       (typeof obj.config.columnLabels === 'undefined' || obj.config.columnLabels.length == 0)
                ? 'fa-square-o'
                : 'fa-ban text-danger',
        } ] );
        $(elem).append(report_field);

        var clickable = report_field.find(that.options.elements.report_field_clickable);

        report_field.find(that.options.elements.report_field_clickable).bind('click', function() {
            that.pivot.filters().set(               obj.config.filters      || {} );
            that.pivot.setRowLabelDisplayFields(    obj.config.rowLabels    || [] );
            that.pivot.setColumnLabelDisplayFields( obj.config.columnLabels || [] );
            that.pivot.setSummaryDisplayFields(     obj.config.summaries    || [] );

            that.$elem.trigger('update');
        });
    });
}

PivotController.prototype.update_filter_details = function() {
    var snip = '';
    var filters = '';

    $(this.options.elements.pivot_filter_details).empty();

    $.each(this.pivot.filters().all(), function(k,v) {
        filters += '<br/><em>' + k + '</em>' + " <i class='fa fa-angle-double-right'></i> " + v;
    });
    if (filters.length == 0) {
        filters = '<em>keine</em>';
    }

    snip += '<b>Aktive Filter:</b> '    + filters + "<br/>"
    $(this.options.elements.pivot_filter_details).html(snip);
}
