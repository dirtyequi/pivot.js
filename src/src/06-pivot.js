pivot.prototype.displayFieldValue = function(value, fieldName) {
    var field;

    if (this._utils.objectType(fieldName) === 'string')    field = this._fields[fieldName];
    if (field === undefined) field = this.appendField(fieldName);

    switch (field.type){
        case "cents":
            return '$' + (value/100).toFixed(2);
        case "currency":
            return '$' + value.toFixed(2);
        case "date":
            return this._utils.formatDate(new Date(value));
        case "time":
            return this._utils.formatTime(new Date(value));
        default:
            return value;
    }
}

pivot.prototype.populateSummaryColumnsResults = function() {
    for (var key in this._displayFields.summaries) {
        if (this._displayFields.summaries.hasOwnProperty(key))
            this._resultsColumns.push({
                fieldName:  key,
                width:      1,
                type: 'summary',
            })
    }

    return this._resultsColumns;
}

pivot.prototype.getFormattedResults = function() {
    if (this._results !== undefined && this._resultsColumns !== undefined)
        return this.getResultArray();

    this.applyFilter();
    this._results        = {};
    this._resultsColumns = [];

    this.processRowLabelResults();

    if (this._utils.objectKeys(this._displayFields.columnLabels).length > 0) {
        this.processColumnLabelResults();
    } else {
        this.populateSummaryColumnsResults();
        this.processSummaryResults();
    }

    return this.getResultArray();
}

pivot.prototype.processSummaryResults = function() {
    for (var resultKey in this._results) {
        this.getSummaryResults(this._results[resultKey])
    }
    return this._results;
}


pivot.prototype.processRowLabelResults = function() {
    var i       = -1,
        m       = this._data.length,
        keys;

    while (++i < m) {
        var row       = this._data[i],
            resultKey = '';

        for (var key in this._displayFields.rowLabels) {
            if (this._displayFields.rowLabels.hasOwnProperty(key)) {
                if (i === 0) this._resultsColumns.push({
                    fieldName: key,
                    width: 1,
                    type: 'row',
                });

                resultKey += key + ':' + row[key] + '|';
            }
        }
        if (this._results[resultKey] === undefined) {
            this._results[resultKey] = {};

            for (var key in this._displayFields.rowLabels) {
                if (this._displayFields.rowLabels.hasOwnProperty(key)) {
                    this._results[resultKey][key] = this._fields[key].displayFunction(row[key], key);
                }
            }

            this._results[resultKey].rows = [];
        }

        this._results[resultKey].rows.push(row);
    }
}

pivot.prototype.processColumnLabelResults = function() {
    for (var key in this._displayFields.columnLabels) {
        if (this._displayFields.columnLabels.hasOwnProperty(key)) {
            var columnLabelColumns = {};
            for (var resultKey in this._results) {
                var values = this.pluckValues(this._results[resultKey].rows, this._fields[key]);

                for (var value in values){
                    if (columnLabelColumns[value] === undefined)
                        columnLabelColumns[value] = 1;
                    else
                        columnLabelColumns[value] += 1;
    
                    this._results[resultKey][value] = this.getSummaryResults(values[value]);
                }
            }

            this.populateColumnLabelColumnsResults(key, columnLabelColumns);
        }
    }
    return this._results;
}

pivot.prototype.pluckValues = function(rows, field) {
    var i       = -1,
        m       = rows.length,
        output  = {};

    while (++i < m){
        var value = rows[i][field.name];
        if (output[value] === undefined)
            output[value] = { rows: [] };

        output[value].rows.push(rows[i]);
    }
    return output;
}

pivot.prototype.populateColumnLabelColumnsResults = function(key, columnLabels) {
    var keys  = this._utils.objectKeys(columnLabels).sort(this._fields[key].sortFunction),
        i     = -1,
        m     = keys.length,
        w     = this._utils.objectKeys(this._displayFields.summaries).length;

    while (++i < m){
        this._resultsColumns.push({
            fieldName: keys[i],
            width: w,
            type: 'column'
        });
    }
    return this._resultsColumns;
}

pivot.prototype.cloneFields = function() {
    var fieldsOutput = [];
    for (var field in this._fields){
        var newField = {};
        for (var key in this._fields[field]) {
            if (this._fields[field].hasOwnProperty(key) && key !== 'values')
                newField[key] = this._fields[field][key];
        }
        fieldsOutput.push(newField);
    }
    return fieldsOutput;
}

/**
 * Returns list of defined fields filtered by type
 * @param {String} 'columnLabelable', 'rowLabelable', 'summarizable', 'filterable', or 'pseudo'
 */
pivot.prototype.restrictFields = function(type) {
    var retFields = [];

    for (var key in this._fields) {
        if (this._fields.hasOwnProperty(key) && this._fields[key][type] === true) {
            retFields.push(this._fields[key]);
        }
    }
    return retFields;
}

pivot.prototype.matchesFilter = function(filter, value) {
    if (this._utils.isArray(filter)) {
        var i = -1, m = filter.length;
        while (++i < m) {
            if(filter[i] === value) return true;
        }

    } else if (this._utils.isRegexp(filter)) {
        return filter.test(value);
    } else {
        return value === filter;
    }

    return false;
}

pivot.prototype.preserveFilteredData = function(){
    var matches             = 0,
        dataFiltersLength   = this._utils.objectKeys(this._dataFilters).length;

    for (var key in this._dataFilters) {
        if (this._dataFilters.hasOwnProperty(key) && 
            this._dataFilters.hasOwnProperty(key) &&
            this._filters[key] === this._dataFilters[key]
        )
            matches += 1;
    }

    return (dataFiltersLength > 0 && matches >= dataFiltersLength);
}

/**
 * Applies the current pivot's filters to the data returning a list of values
 * Optionally allows you to set filters and apply them.
 * @param {Object} restrictions allows you to pass the filters to apply without using set first.
 */
pivot.prototype.applyFilter = function(restrictions) {
    var dataToFilter    = this._data,
        filteredData    = [];

    if (restrictions !== undefined) this.setFilters(restrictions);

    var preserveFilter = this.preserveFilteredData();

    if (preserveFilter) {
        dataToFilter = this._data;
    } else {
        dataToFilter = this._rawData;
    }

    var dataToFilterLength  = dataToFilter.length,
        filterLength        = this._utils.objectKeys(this._filters).length,
        i                   = -1;

    while (++i < dataToFilterLength) {
        var row     = dataToFilter[i],
            matches = 0;

        for (var key in this._filters) {
            if (this._filters.hasOwnProperty(key) && row.hasOwnProperty(key) && this.matchesFilter(this._filters[key], row[key]))
                matches += 1;
        }

        if (matches === filterLength) {
            filteredData.push(row);
        }
    }

    

    this._data       = filteredData;
    thisdataFilters = this._utils.shallowClone(this._filters);
    this.resetResults();

    return this._data;
}

/**
 * Takes a new restrction (filter) and appends it to current pivot's filters
 * @param {Object} newRestriction should looke like {"last_name":"Jackson"}
 */
pivot.prototype.appendFilter = function(newRestriction) {
    for (var key in newRestriction) {
        if (newRestriction.hasOwnProperty(key))
            this._filters[key] = newRestriction[key];
    }

    this.castFilterValues();
}

pivot.prototype.processHeaderRow = function(row) {
    var output = [];

    var o   = {},
        i   = -1,
        m   = row.length;

    while (++i < m) {
        var field = this._fields[row[i]];
        if (field === undefined) {
            field = this.appendField(row[i]);
        }
        output.push(field);
    }

    return output;
}

pivot.prototype.processRows = function(text, f) {
    var EOL = {},               // sentinel value for end-of-line
        EOF = {},               // sentinel value for end-of-file
        rows = [],              // output rows
        re = /\r\n|[,\r\n]/g,   // field separator regex
        n = 0,                  // the current line number
        t,                      // the current token
        eol;                    // is the current token followed by EOL?

    re.lastIndex = 0;           // work-around bug in FF 3.6

    /** @private Returns the next token. */
    function token() {
        if (re.lastIndex >= text.length) return EOF; // special case: end of file
        if (eol) { eol = false; return EOL; } // special case: end of line

        // special case: quotes
        var j = re.lastIndex;
        if (text.charCodeAt(j) === 34) {
            var i = j;

            while (i++ < text.length) {
                if (text.charCodeAt(i) === 34) {
                    if (text.charCodeAt(i + 1) !== 34) break;
                i++;
                }
            }

            re.lastIndex = i + 2;
            var c = text.charCodeAt(i + 1);
            if (c === 13) {
                eol = true;
                if (text.charCodeAt(i + 2) === 10)
                    re.lastIndex++;
            } else if (c === 10) {
                eol = true;
            }
            return text.substring(j + 1, i).replace(/""/g, "\"");
        }

        // common case
        var m = re.exec(text);
        if (m) {
            eol = m[0].charCodeAt(0) !== 44;
            return text.substring(j, m.index);
        }
        re.lastIndex = text.length;
        return text.substring(j);
    }

    while ((t = token()) !== EOF) {
        var a = [];
        while ((t !== EOL) && (t !== EOF)) {
            a.push(t);
            t = token();
        }
        if (f && !(a = f(a, n++))) continue;
            rows.push(a);
    }

    return rows;
}

pivot.prototype.processRow = function(row, header, pseudoFields) {
    // process actual fields
    var o   = {},
        j   = -1,
        m   = header.length;

    while (++j < m) {
        var value = this.castFieldValue(header[j].name, row[j]);
        o[header[j].name] = value;
        this.addFieldValue(header[j].name, value);
    };

    // process pseudo fields
    j   = -1;
    m   = pseudoFields.length;

    while (++j < m) {
        var field = pseudoFields[j],
            value = this.castFieldValue(field.name, field.pseudoFunction(o, field));

        o[field.name] = value;
        this.addFieldValue(field.name, value);
    };

    return o;
}

pivot.prototype.resetResults = function() {
    this._results        = undefined;
    this._resultsColumns = undefined;
}




 /**
 * This method allows you to append a new label field to the specified type. For example, you could set a new displayRowLabel by sending it as the type and 'city' as the field
 * @param string type - must be either 'rowLabels', 'columnLabels', or 'summaries'
 * @param string field - Specify the label you would like to add.
 * @private
 * @return {undefined}
 */
pivot.prototype.appendDisplayField = function(type, field) {
    if (this._utils.objectType(field) === 'string')
        field = this._fields[field];

    this.resetResults();
    this._displayFields[type][field.name] = field;
}

pivot.prototype.castFilterValues = function(restrictions) {
    if (restrictions === undefined) restrictions = this._filters;

    var field;
    for (field in restrictions){
        if (restrictions.hasOwnProperty(field)) {
            if (this._utils.isRegexp(restrictions[field])) {    // FIXME
                // no need to change
            } else if (this._utils.isArray(restrictions[field])) {  // FIXME
                var i = -1, m = restrictions[field].length;
                while (++i < m) {
                    restrictions[field][i] = this.castFieldValue(field, restrictions[field][i]);
                };
            } else {
                restrictions[field] = this.castFieldValue(field, restrictions[field]);
            }
        }
    }
}

/**
 * Adds value to field based off of the Fields' displayFunction, defaults to count.
 */
pivot.prototype.addFieldValue = function(field, value){
    if (this._fields[field] === undefined || this._fields[field].filterable === false) return;

    if (this._fields[field].values[value] === undefined) {
        this._fields[field].values[value] = {
            count:          1,
            displayValue:   this._fields[field].displayFunction(value, field),
        }
    } else {
        this._fields[field].values[value].count += 1;
    }
}

pivot.prototype.castFieldValue = function(fieldName, value){
    //var field, retValue;
    var field;
    if (this._utils.objectType(fieldName) === 'string') field = this._fields[fieldName];
    if (field === undefined)                            field = this.appendField(fieldName);

    switch (field.type){
        case "integer":
        case "cents":
            if (this._utils.objectType(value) === 'number')
                return value;
            else
                return parseInt(value, 10);
        case "float":
        case "currency":
            if (this._utils.objectType(value) === 'number')
                return value;
            else
                return parseFloat(value, 10);
        case "date":
        case "time":
            switch (this._utils.objectType(value)){
                case 'number':
                case 'date':
                    return value;
                default:
                    if (/^\d+$/.test(value))
                        return parseInt(value);
                    else
                        return Date.parse(value);
            };
        default:
            return value.toString();
    }
}

pivot.prototype.appendField = function(field) {
    // if field is a simple string setup and object with that string as a name

    if (this._utils.objectType(field) === 'string')
        field = {   name: field };

    if (field.type              === undefined) field.type             = 'string';
    if (field.pseudo            === undefined) field.pseudo           = false;
    if (field.rowLabelable      === undefined) field.rowLabelable     = true;
    if (field.columnLabelable   === undefined) field.columnLabelable  = false;
    if (field.filterable        === undefined) field.filterable       = false;
    if (field.dataSource        === undefined) field.dataSource       = field.name;

    if (field.summarizable && (field.rowLabelable || field.columnLabelable || field.filterable)) {
        var summarizable_field            = this._utils.shallowClone(field); 
        summarizable_field.rowLabelable   = false;
        summarizable_field.filterable     = false;
        summarizable_field.dataSource     = field.name;

        if (summarizable_field.summarizable !== true)
            summarizable_field.name = summarizable_field.name + '_' + summarizable_field.summarizable;
        else
            summarizable_field.name = summarizable_field.name + '_count';

        this.appendField(summarizable_field);

        field.summarizable  = false;
        field.summarizeFunction = undefined;

    } else if (field.summarizable) {
        if (field.summarizeFunction === undefined){

            if (typeof this._summarize_functions[field.summarizable] === 'function') {
                field.summarizeFunction = this._summarize_functions[field.summarizable];
                field.summarizable  = true;
            } else {
                console.log('exception: '+field.summarizable+' is not a function');
            }
        }

    } else {
        field.summarizable  = false
    }

    if (field.pseudo && field.pseudoFunction === undefined)
        field.pseudoFunction = function(row){ return '' };

    if (field.displayFunction === undefined)
       field.displayFunction = $.proxy(this.displayFieldValue, this);

    field.values        = {};
    field.displayValues = {};

    field.index         = this._utils.objectKeys(this._fields).length;
    this._fields[field.name]  = field;

    return field;
}
