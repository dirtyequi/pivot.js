pivot_table.prototype.update_results = function() {
    this.$elem.trigger('process');

    if (typeof this.options.before_process == "function") {
        $.proxy(this.options.before_process, this)();
    };

    var results = this.pivot.results().all(),
        config  = this.pivot.config(),
        columns = this.pivot.results().columns(),
        snip    = '',
        fieldName;

    var result_table = this.$elem, //$('#results'),
        result_rows;
    result_table.empty();

    snip += '<table id="'+this.options.elements.pivot_table+'" class="table table-striped table-condensed"><thead>';

    // build columnLabel header row
    if (config.columnLabels.length > 0 && config.summaries.length > 1) {
        var summarySnip = '', summaryRow = '';
        $.each(config.summaries, function(index, fieldName){
            summarySnip += '<th>' + fieldName + '</th>';
        });

        snip += '<tr>'
        $.each(columns, function(index, column){
            switch (column.type){
                case 'row':
                    snip += '<th rowspan="2">'+ column.fieldName + '</th>';
                    break;
                case 'column':
                    snip += '<th colspan="' + column.width + '">' + column.fieldName + '</th>';
                    summaryRow += summarySnip;
                    break;
            }
        });
        snip += '</tr><tr>' + summaryRow + '</tr>';
    } else {
        snip += '<tr>'
        $.each(columns, function(index, column){
            if (column.type !== 'column' || config.summaries.length <= 1) {
                snip += '<th>' + column.fieldName + '</th>';
            } else {
                $.each(config.summaries, function(index, fieldName){
                    snip += '<th>' + fieldName + '</th>';
                });
            }
        });
        snip += '</tr>'
    }
   
    snip += '</thead></tr><tbody id="'+this.options.elements.pivot_table_body+'"></tbody></table>';
    result_table.append(snip);

    result_rows = result_table.find('tbody');

    $.each(results,function(index, row){
        snip = '<tr>';
        $.each(columns, function(index, column){
            if (column.type !== 'column') {
                snip += '<td>' + row[column.fieldName] + '</td>';
            } else {
                $.each(config.summaries, function(index, fieldName){
                    if (row[column.fieldName] !== undefined)
                        snip += '<td>' + row[column.fieldName][fieldName] + '</td>';
                    else
                        snip += '<td>&nbsp;</td>';
                });
            }
        });
        snip += '</tr>';

        result_rows.append(snip);
    });

    if (typeof this.options.after_process == "function") {
        $.proxy(this.options.after_process, this)();
    };

    this.$elem.trigger('ready');
}

