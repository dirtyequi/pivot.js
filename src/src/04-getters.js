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


