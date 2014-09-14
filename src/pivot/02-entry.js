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
