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
