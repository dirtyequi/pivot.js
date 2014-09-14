
pivot.prototype.fetch = function() {
    var that        = this,
        dfd         = new $.Deferred();
        re          = /\.json$/i,
        dataType    = (re.test(this.options.url)) ? 'text/json' : 'text/csv';

    var url = (typeof this.options.url === 'function') ? this.options.url() : this.options.url;

    $.ajax({
        url:        url,
        dataType:   'text',
        accepts:    'text/csv',
        success:    function(data, status){
            if (dataType === 'text/json')
                dfd.resolve({'json': data});
            else
                dfd.resolve({'csv': data});
        },
    });

    return dfd.promise();
}

pivot.prototype.process = function(data) {
    var that    = this,
        dfd     = new $.Deferred();

    if (data.csv !== 'undefined') {
        $.when(this.processCSV(data.csv)).then(function(result) {
            dfd.resolve(result);
        });
    } else if (data.json !== 'undefined') {        
        $.when(this.processJSON(data.json)).then(function(result) {
            dfd.resolve(result);
        });
    } else {
        dfd.reject({message:'Unsupported data type'});
    }

    return dfd.promise();
}

pivot.prototype.processJSON = function(input) {
    var header,
        dfd             = new $.Deferred(),
        pseudoFields    = this.restrictFields('pseudo');

    if (objectType(input) === 'string') input = JSON.parse(input);
    this._rawData     = [];

    var o = {}, j = -1, m = input.length;
    while (++j < m) {
        if (j === 0)
            header = this.processHeaderRow(input[j]);
        else
            this._rawData.push(this.processRow(input[j], header, pseudoFields));
    }
    
    dfd.resolve({message:'json data processed'});
    return dfd.promise(); 
}

// Accepts csv as a string
pivot.prototype.processCSV = function(text) {
    var header,
        that            = this,
        dfd             = new $.Deferred(),
        pseudoFields    = this.restrictFields('pseudo');

    this._rawData = this.processRows(text, function(row, i) {
        if (i === 0)
            header = that.processHeaderRow(row);
        else
            return that.processRow(row, header, pseudoFields);
    });

    dfd.resolve({message:'csv data processed'});
    return dfd.promise(); 
}


