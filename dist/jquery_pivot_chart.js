;(function($, window, document, undefined) { "use: strict";

    function Plugin(option, args) {
        return this.each(function() {
            var $this   = $(this);
            var data    = $this.data('pivot.chart');
            var options = typeof option == 'object' && option;

            if (option == 'destroy')            { $this.unbind().removeData(); return; }
            if (!data)                          $this.data('pivot.chart', (data = new PivotChart(this, options)));
            if (typeof option == 'string')      $.proxy(data[option], data, args)();
        })
    }

    var old = $.fn.PivotChart;

    $.fn.PivotChart             = Plugin;
    $.fn.PivotChart.Constructor = PivotChart;

    $.fn.PivotChart.noConflict  = function() {
        $.fn.PivotChart = old;
        return this;
    }

})(jQuery, window, document);
