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

