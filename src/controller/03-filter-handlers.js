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
