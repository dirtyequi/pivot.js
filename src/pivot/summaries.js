function PivotSummaries() {
    return this;
}

PivotSummaries.prototype.sum = function(rows, field) {
    var runningTotal  = 0,
        i             = -1,
        m             = rows.length;
    while (++i < m) {
        runningTotal += rows[i][field.dataSource];
    };
    return runningTotal;
}

PivotSummaries.prototype.avg = function(rows, field) {
    return this.sum(rows, field)/rows.length;
}

PivotSummaries.prototype.count = function(rows, field) {
    return rows.length;
}


PivotSummaries.prototype.percent = function(rows, field) {
    var baseF = field.summarizable_functions.base;
    var percF = field.summarizable_functions.percent;

    var base = 0; var perc = 0;

    $.each(rows, function(i, row) {
        base = base + baseF(row);
        perc = perc + percF(row);
    });

    return parseFloat( (perc / base * 100).toFixed(2));
}
