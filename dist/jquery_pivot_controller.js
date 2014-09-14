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
