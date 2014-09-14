pivot_table.prototype.initialize = function() {
    var that = this;

    // bind update triggers
    $(this.$elem).bind('update', function() {
        that.update_results();
    });
}

