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
