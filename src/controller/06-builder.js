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
