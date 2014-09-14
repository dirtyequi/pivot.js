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
