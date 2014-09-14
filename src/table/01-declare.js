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

