function pivot(options) {
    // private properties

    // fields configuration object
    this._fields                = {};

    // filters object
    this._filters               = {};

    // raw input data
    this._rawData               = [];

    // processed data
    this._data                  = [];

    // 
    this._dataFilters           = {};

    // fields to display
    this._displayFields         = {
        rowLabels:                  {},
        columnLabels:               {},
        summaries:                  {},
    };

    // result data
    this._results               = undefined;
    this._resultsColumns        = undefined;

    // pivot utility functions
    this._utils                 = new PivotUtils();
    this._summarize_functions   = new PivotSummaries();
    
    // options
    this.options                = $.extend(true, {}, options);

    return this;
}
