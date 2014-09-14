function PivotUtils() {
    return this;
}

PivotUtils.prototype.pad = function(sideToPad, input, width, padString) {
    if (padString === undefined) padString = " ";

    input     = input.toString();
    padString = padString.toString();

    while (input.length < width) {
        if (sideToPad === "left")
            input = padString + input;
        else
            input = input + padString;
    }
    return input;
}

PivotUtils.prototype.padLeft = function(input, width, padString) {
    return this.pad('left', input, width, padString);
}

PivotUtils.prototype.padRight = function(input, width, padString) {
    return this.pad('right', input, width, padString);
}

PivotUtils.prototype.formatDate = function(value) {
    return value.getUTCFullYear() + '-' + this.padLeft((value.getUTCMonth() + 1), 2, "0") + '-' + this.padLeft(value.getUTCDate(), 2, '0');
}

PivotUtils.prototype.formatTime = function(value) {
    return this.formatDate(value) + ' ' + this.padLeft(value.getUTCHours(), 2,'0') + ':' + this.padLeft(value.getUTCMinutes(),2,'0');
}

PivotUtils.prototype.isArray = function(arg) {
    if (!Array.isArray)
        return this.objectType(arg) == 'array';
    else
        return Array.isArray(arg);
}

PivotUtils.prototype.isRegexp = function(arg) {
    return (this.objectType(arg) == 'regexp');
}

PivotUtils.prototype.shallowClone = function(input) {
    var output = {};
    for (var key in input) {
        if (input.hasOwnProperty(key))
            output[key] = input[key];
    }
    return output;
}

PivotUtils.prototype.objectKeys = function(object) {
    if (Object.keys) return Object.keys(object);

    var output = [];
    for (key in object){
        output.push(key);
    }
    return output;
}

PivotUtils.prototype.objectType = function(obj) {
    return ({}).toString.call(obj).match(/\s([a-z|A-Z]+)/)[1].toLowerCase();
}

PivotUtils.prototype.sortNumerically = function(array) {
    return array.sort(function(a,b) { return a - b; });
}
