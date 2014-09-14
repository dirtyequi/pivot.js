function PivotSummaries() {
    return this;
}

PivotSummaries.prototype.sum = function(rows, field) {
    var runningTotal  = 0,
        i             = -1,
        m             = rows.length;
    while (++i < m) {
        runningTotal += rows[i][field.dataSource];
    };
    return runningTotal;
}

PivotSummaries.prototype.avg = function(rows, field) {
    return this.sum(rows, field)/rows.length;
}

PivotSummaries.prototype.count = function(rows, field) {
    return rows.length;
}


PivotSummaries.prototype.percent = function(rows, field) {
    var baseF = field.summarizable_functions.base;
    var percF = field.summarizable_functions.percent;

    var base = 0; var perc = 0;

    $.each(rows, function(i, row) {
        base = base + baseF(row);
        perc = perc + percF(row);
    });

    return parseFloat( (perc / base * 100).toFixed(2));
}
function PivotUtils() {
    return this;
}

PivotUtils.prototype.pad = function(sideToPad, input, width, padString) {
    if (padString === undefined) padString = " ";

    input     = input.toString();
    padString = padString.toString();

    while (input.length < width) {
        if (sideToPad === "left")
            input = padString + input;
        else
            input = input + padString;
    }
    return input;
}

PivotUtils.prototype.padLeft = function(input, width, padString) {
    return this.pad('left', input, width, padString);
}

PivotUtils.prototype.padRight = function(input, width, padString) {
    return this.pad('right', input, width, padString);
}

PivotUtils.prototype.formatDate = function(value) {
    return value.getUTCFullYear() + '-' + this.padLeft((value.getUTCMonth() + 1), 2, "0") + '-' + this.padLeft(value.getUTCDate(), 2, '0');
}

PivotUtils.prototype.formatTime = function(value) {
    return this.formatDate(value) + ' ' + this.padLeft(value.getUTCHours(), 2,'0') + ':' + this.padLeft(value.getUTCMinutes(),2,'0');
}

PivotUtils.prototype.isArray = function(arg) {
    if (!Array.isArray)
        return this.objectType(arg) == 'array';
    else
        return Array.isArray(arg);
}

PivotUtils.prototype.isRegexp = function(arg) {
    return (this.objectType(arg) == 'regexp');
}

PivotUtils.prototype.shallowClone = function(input) {
    var output = {};
    for (var key in input) {
        if (input.hasOwnProperty(key))
            output[key] = input[key];
    }
    return output;
}

PivotUtils.prototype.objectKeys = function(object) {
    if (Object.keys) return Object.keys(object);

    var output = [];
    for (key in object){
        output.push(key);
    }
    return output;
}

PivotUtils.prototype.objectType = function(obj) {
    return ({}).toString.call(obj).match(/\s([a-z|A-Z]+)/)[1].toLowerCase();
}

PivotUtils.prototype.sortNumerically = function(array) {
    return array.sort(function(a,b) { return a - b; });
}
/**
* @docauthor Jonathan Jackson
* @class Pivot
* # Welcome to Pivot.js
*
* Pivot.js is a simple way for you to get to your data.  It allows for the
* creation of highly customizable unique table views from your browser.
*
* > In data processing, a pivot table is a data summarization tool found in
* > data visualization programs such as spreadsheets or business intelligence
* > software. Among other functions, pivot-table tools can automatically sort,
* > count, total or give the average of the data stored in one table or
* > spreadsheet. It displays the results in a second table (called a "pivot
* > table") showing the summarized data.
*
* In our case, results (or the pivot-table) will be displayed as an HTML table
* pivoting from the input data (CSV or JSON). Without further ado let's get to usage.
*
* View an [example](http://rjackson.github.com/pivot.js/).
*
* #Usage
*
* Step one is to initialize the pivot object.  It expects the following attributes:
*
* - `csv` - which should contain a valid string of comma separated values.  It is
*   __important to note__ that you must include a header row in the CSV for pivot
*   to work properly  (you'll understand why in a minute).
*
* - `json` - which should contain a valid JSON string. At this time this string
*   must be an array of arrays, and not an array of objects (storing the field
*   names with each row consumes significantly more space).
*
* - `fields` - which should be an array of objects.  This is used to instruct
*   pivot on how to interact with the fields you pass in.  It keys off of the
*   header row names.  And is formated like so:
*
*     [ {name: 'header-name', type: 'string', optional_attributes: 'optional field' },
*     {name: 'header-name', type: 'string', optional_attributes: 'optional field' }]
*
*
* - `filters` (default is empty) - which should contain any filters you would like to restrict your data to.  A filter is defined as an object like so:
*
*     {zip_code: '34471'}
*
*
* Those are the options that you should consider.  There are other options that are well covered in the spec
* A valid pivot could then be set up from like so.

*
*     var field_definitions = [{name: 'last_name',   type: 'string',   filterable: true},
*             {name: 'first_name',        type: 'string',   filterable: true},
*             {name: 'zip_code',          type: 'integer',  filterable: true},
*             {name: 'pseudo_zip',        type: 'integer',  filterable: true },
*             {name: 'billed_amount',     type: 'float',    rowLabelable: false,},
*             {name: 'last_billed_date',  type: 'date',     filterable: true}
*
*     // from csv data:
*     var csv_string  =  "last_name,first_name,zip_code,billed_amount,last_billed_date\n" +
*                        "Jackson,Robert,34471,100.00,\"Tue, 24 Jan 2012 00:00:00 +0000\"\n" +
*                        "Jackson,Jonathan,39401,124.63,\"Fri, 17 Feb 2012 00:00:00 +0000\""
*     pivot.init({csv: csv_string, fields: field_definitions});
*
*     // from json data:
*     var json_string = '[["last_name","first_name","zip_code","billed_amount","last_billed_date"],' +
*                         ' ["Jackson", "Robert", 34471, 100.00, "Tue, 24 Jan 2012 00:00:00 +0000"],' +
*                         ' ["Smith", "Jon", 34471, 173.20, "Mon, 13 Feb 2012 00:00:00 +0000"]]'
*
*     pivot.init({json: json_string, fields: field_definitions});
*
*/

function pivot(options) {
    // private properties

    // fields configuration object
    this._fields                = {};

    // filters object
    this._filters               = {};

    // raw input data
    this._rawData               = [];

    // processed data
    this._data                  = [];

    // 
    this._dataFilters           = {};

    // fields to display
    this._displayFields         = {
        rowLabels:                  {},
        columnLabels:               {},
        summaries:                  {},
    };

    // result data
    this._results               = undefined;
    this._resultsColumns        = undefined;

    // pivot utility functions
    this._utils                 = new PivotUtils();
    this._summarize_functions   = new PivotSummaries();
    
    // options
    this.options                = $.extend(true, {}, options);

    return this;
}
pivot.prototype.init = function(options) {
    var that    = this,
        dfd     = new $.Deferred();

    if (options == undefined)
        options = this.options;

    if (options.fields        !== undefined) this.setFields(options.fields);
    if (options.filters       !== undefined) this.setFilters(options.filters);
    if (options.rowLabels     !== undefined) this.setRowLabelDisplayFields(options.rowLabels);
    if (options.columnLabels  !== undefined) this.setColumnLabelDisplayFields(options.columnLabels);
    if (options.summaries     !== undefined) this.setSummaryDisplayFields(options.summaries);

    if (options.url !== undefined) {
        $.when(this.fetch()).then(function(data) {
            $.when(that.process(data)).then(function(result) {
                dfd.resolve(result);
            });
        });
    } else {
        $.when(that.process(options)).then(function(result) {
            dfd.resolve(result);
        });
    }

    return dfd.promise();
}   

pivot.prototype.reset = function(options) {
    this.init($.extend({}, options));
}

pivot.prototype.results = function() {
    return {
        all:        $.proxy(this.getFormattedResults, this),
        columns:    $.proxy(this.getColumnResults, this),
    };
}

pivot.prototype.utils = function() {
    return {
        pad:                this._utils.pad,
        padRight:           this._utils.padRight,
        padLeft:            this._utils.padLeft,
        formatDate:         this._utils.formatDate,
        formatTime:         this._utils.formatTime,
        isArray:            this._utils.isArray,
        isRegExp:           this._utils.isRegExp,
        shallowClone:       this._utils.shallowClone,
        objectKeys:         this._utils.objectKeys,
        objectType:         this._utils.objectType,
        sortNumerically:    this._utils.sortNumerically,
    };
}

pivot.prototype.fields = function(type) {
    var opts = {
        columnLabelable:    $.proxy(this.restrictFields, this, 'columnLabelable'),
        rowLabelable:       $.proxy(this.restrictFields, this, 'rowLabelable'),
        summarizable:       $.proxy(this.restrictFields, this, 'summarizable'),
        filterable:         $.proxy(this.restrictFields, this, 'filterable'),
        pseudo:             $.proxy(this.restrictFields, this, 'pseudo'),
        clone:              $.proxy(this.cloneFields, this),
        add:                $.proxy(this.appendField, this),
        all:                $.proxy(this.getFields, this),
        set:                $.proxy(this.setFields, this),
        get:                $.proxy(this.getField, this),
    };

    if (type !== undefined)
        return opts[type];
    return opts;
}

/**
 * Entry point for several filter methods.
 * See:
 *
 * * getFilters() - returns filters applied to current pivot
 * * setFilters() - sets a series of filters
 * * appendFilter() - adds a filter to current pivot filters
 * * applyFilter() - runs the filters on the values
 *
 * @param {String}
 * @return {function} One of the fucntions defined above.
 */
pivot.prototype.filters = function(type) {
    var opts = {
        all:    $.proxy(this.getFilters, this),
        set:    $.proxy(this.setFilters, this),
        apply:  $.proxy(this.applyFilter, this),
        add:    $.proxy(this.appendFilter, this),
    }

    if (type !== undefined)
        return opts[type];
    return opts;
}

pivot.prototype.display = function() {
    return {
        all:          $.proxy(this.pivotDisplayAll, this),
        rowLabels:    $.proxy(this.pivotDisplayRowLabels, this),
        columnLabels: $.proxy(this.pivotDisplayColumnLabels, this),
        summaries:    $.proxy(this.pivotDisplaySummaries, this),
    };
}

pivot.prototype.config = function(showFields) {
    return {
        fields:         (showFields === undefined) ? $.proxy(this.cloneFields(), this) : this.getFields(),
        filters:        $.proxy(this.getFilters, this),
        rowLabels:      this._utils.objectKeys(this._displayFields.rowLabels),
        columnLabels:   this._utils.objectKeys(this._displayFields.columnLabels),
        summaries:      this._utils.objectKeys(this._displayFields.summaries),
    };
}

pivot.prototype.data = function() {
    var opts = {
        raw:    this._rawData,
        all:    this._data,
    };

    if (type !== undefined)
        return opts[type];
    return opts;
}

/**
 * Returns either list of summaries (labels) or allows you to access the {@link pivot#setSummaryDisplayFields}.
 *
 * Called from pivot like so: pivot.display().summaries().set() or pivot.display().summaries().get
 */
pivot.prototype.pivotDisplaySummaries = function(){
    var that = this;
    return {
        set: $.proxy(this.setSummaryDisplayFields, this),
        get: function() { return that._displayFields.summaries; },
    };
}

pivot.prototype.pivotDisplayAll = function() {
    return this._displayFields;
}

/**
 * Returns either list of rowLabels or allows you to access the {@link pivot#setRowLabelDisplayFields}.
 *
 * Called from pivot like so: pivot.display().rowLabels().set() or pivot.display().rowLabels().get
 */
pivot.prototype.pivotDisplayRowLabels = function() {
    var that = this;
    return {
        set: $.proxy(this.setRowLabelDisplayFields, this),
        get: function() { return that._displayFields.rowLabels; },
    }
}

/**
 * Returns either list of columnLabels or allows you to access the {@link pivot#setColumnLabelDisplayFields}.
 *
 * Called from pivot like so: pivot.display().columnLabels().set() or pivot.display().columnLabels().get
*/
pivot.prototype.pivotDisplayColumnLabels = function() {
    var that = this;
    return {
      set: $.proxy(this.setColumnLabelDisplayFields, this),
      get: function() { return that._displayFields.columnLabels; },
    }
}
pivot.prototype.setFields = function(listing) {
    this._fields = {};
    var i   = -1,
        m   = listing.length;

    while (++i < m) {
        this.appendField(listing[i]);
    }
}

pivot.prototype.setFilters = function(restrictions) {
    if (typeof restrictions === 'undefined') restrictions = {};
    this._filters = restrictions;
    this.resetResults();
    this.castFilterValues();
}

/**
 * Allows setting of row label fields
 * @param listing Should look like ['city','state']
 * @return {undefined}
 */
pivot.prototype.setRowLabelDisplayFields = function(listing) {
    this.setDisplayFields('rowLabels', listing);
}

/**
 * Allows setting of column label fields
 * @param listing - Should look like ['city','state']
 * @return {undefined}
 */
pivot.prototype.setColumnLabelDisplayFields = function(listing) {
    this.setDisplayFields('columnLabels', listing);
}

/**
 * Allows setting of summary label fields
 * @param listing - Should look like ['billed_amount']
 * @return {undefined}
 */
pivot.prototype.setSummaryDisplayFields = function(listing) {
    this.setDisplayFields('summaries', listing);
}

/**
 * This method simply calls appendDisplayField on a collection passing in each to appendDisplayField.  The object should look something like the following
 *    {'rowLabels':['city','state'],'columnLabels':['billed_amount']}
 * @private
 * @return {undefined}
 */
pivot.prototype.setDisplayFields = function(type, listing) {
    this._displayFields[type] = {};
    this.resetResults();

    var i = -1, m = listing.length;
    while (++i < m) {
        this.appendDisplayField(type, listing[i]);
    }
}

pivot.prototype.getColumnResults = function() {
    if (this._results === undefined || this._resultsColumns === undefined)
        this.getFormattedResults();

    return this._resultsColumns;
}

pivot.prototype.getResultArray = function() {
    var output  = [],
        keys    = this._utils.objectKeys(this._results).sort(),
        i       = -1,
        m       = keys.length;

    while (++i < m){
        output.push(this._results[keys[i]])
    }

    return output;
}

pivot.prototype.getSummaryResults = function(result){
    var output = {};
    for (var key in this._displayFields.summaries) {
        if (this._displayFields.summaries.hasOwnProperty(key)) {
            result[key] = this._fields[key].summarizeFunction(result.rows, this._fields[key]);
            result[key] = this._fields[key].displayFunction(result[key], key);
        }
    }

    return result;
}

pivot.prototype.getFields = function() {
    return this._fields;
}

pivot.prototype.getField = function(fieldName) {
    return this._fields[fieldName];
}

pivot.prototype.getFilters = function() {
    return this._filters;
}



pivot.prototype.fetch = function() {
    var that        = this,
        dfd         = new $.Deferred();
        re          = /\.json$/i,
        dataType    = (re.test(this.options.url)) ? 'text/json' : 'text/csv';

    var url = (typeof this.options.url === 'function') ? this.options.url() : this.options.url;

    $.ajax({
        url:        url,
        dataType:   'text',
        accepts:    'text/csv',
        success:    function(data, status){
            if (dataType === 'text/json')
                dfd.resolve({'json': data});
            else
                dfd.resolve({'csv': data});
        },
    });

    return dfd.promise();
}

pivot.prototype.process = function(data) {
    var that    = this,
        dfd     = new $.Deferred();

    if (data.csv !== 'undefined') {
        $.when(this.processCSV(data.csv)).then(function(result) {
            dfd.resolve(result);
        });
    } else if (data.json !== 'undefined') {        
        $.when(this.processJSON(data.json)).then(function(result) {
            dfd.resolve(result);
        });
    } else {
        dfd.reject({message:'Unsupported data type'});
    }

    return dfd.promise();
}

pivot.prototype.processJSON = function(input) {
    var header,
        dfd             = new $.Deferred(),
        pseudoFields    = this.restrictFields('pseudo');

    if (objectType(input) === 'string') input = JSON.parse(input);
    this._rawData     = [];

    var o = {}, j = -1, m = input.length;
    while (++j < m) {
        if (j === 0)
            header = this.processHeaderRow(input[j]);
        else
            this._rawData.push(this.processRow(input[j], header, pseudoFields));
    }
    
    dfd.resolve({message:'json data processed'});
    return dfd.promise(); 
}

// Accepts csv as a string
pivot.prototype.processCSV = function(text) {
    var header,
        that            = this,
        dfd             = new $.Deferred(),
        pseudoFields    = this.restrictFields('pseudo');

    this._rawData = this.processRows(text, function(row, i) {
        if (i === 0)
            header = that.processHeaderRow(row);
        else
            return that.processRow(row, header, pseudoFields);
    });

    dfd.resolve({message:'csv data processed'});
    return dfd.promise(); 
}


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
function pivot_table(elem, options) {

    this.elem           = elem
    this.$elem          = $(elem);

    this.options        = $.extend(true, this.defaults(), options);

    if (this.options.pivot == undefined && typeof this.options.pivot !== 'object') {
        throw 'options.pivot must contain a pivot object';
    }
    this.pivot          = options.pivot;
    delete options.pivot;

    this.$elem.trigger('init');
    this.initialize();
    this.$elem.trigger('update');

    return this;
}

pivot_table.prototype.defaults = function() {
    return {
        // functions for event handlers
        on_init:                undefined,
        before_process:         undefined,
        on_process:             undefined,
        after_process:          undefined,
        on_ready:               undefined,

        // table elements
        elements:               {
            pivot_table:                            '#pivot-table-'+                uuid.v4(),
            pivot_table_body:                       '#pivot-table-body-'+           uuid.v4(),
        },
    };
}

pivot_table.prototype.initialize = function() {
    var that = this;

    // bind update triggers
    $(this.$elem).bind('update', function() {
        that.update_results();
    });
}

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

;(function($, window, document, undefined) { "use: strict";

    function Plugin(option, args) {
        return this.each(function() {
            var $this   = $(this);
            var data    = $this.data('pivot.controller');
            var options = typeof option == 'object' && option;

            if (option == 'destroy')            { $this.unbind().removeData(); return; }
            if (!data)                          $this.data('pivot.controller', (data = new PivotController(this, options)));
            if (typeof option == 'string')      $.proxy(data[option], data, args)();
        })
    }

    var old = $.fn.PivotController;

    $.fn.PivotController                = Plugin;
    $.fn.PivotController.Constructor    = PivotController;

    $.fn.PivotController.noConflict     = function() {
        $.fn.PivotController = old;
        return this;
    }

})(jQuery, window, document);
;(function($, window, document, undefined) { "use: strict";

    function Plugin(option, args) {
        return this.each(function() {
            var $this   = $(this);
            var data    = $this.data('pivot.chart');
            var options = typeof option == 'object' && option;

            if (option == 'destroy')            { $this.unbind().removeData(); return; }
            if (!data)                          $this.data('pivot.chart', (data = new PivotChart(this, options)));
            if (typeof option == 'string')      $.proxy(data[option], data, args)();
        })
    }

    var old = $.fn.PivotChart;

    $.fn.PivotChart             = Plugin;
    $.fn.PivotChart.Constructor = PivotChart;

    $.fn.PivotChart.noConflict  = function() {
        $.fn.PivotChart = old;
        return this;
    }

})(jQuery, window, document);
;(function($, window, document, undefined) { "use: strict";

    function Plugin(option, args) {
        return this.each(function() {
            var $this   = $(this);
            var data    = $this.data('pivot.table');
            var options = typeof option == 'object' && option;

            if (option == 'destroy')            { $this.unbind().removeData(); return; }
            if (!data)                          $this.data('pivot.table', (data = new pivot_table(this, options)));
            if (typeof option == 'string')      $.proxy(data[option], data, args)();
        })
    }

    var old = $.fn.PivotTable;

    $.fn.PivotTable             = Plugin;
    $.fn.PivotTable.Constructor = pivot_table;

    $.fn.PivotTable.noConflict  = function() {
        $.fn.PivotTable = old;
        return this;
    }


})(jQuery, window, document);
