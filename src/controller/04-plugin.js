PivotController.prototype.register_plugins = function() {
    var that    = this,
        dfd     = new $.Deferred();

    $.each(this.options.plugins, function(i, plugin) {
        that.register_plugin(plugin);
    });

    dfd.resolve();
    return dfd.promise();
}

PivotController.prototype.register_plugin = function(plugin) {
    var dfd = new $.Deferred();

    if (typeof plugin !== 'object')         plugin = {};
    if (typeof plugin.id === undefined)     dfd.reject({message: 'Plugin id must be given to get bound to a DOM element'});
    if (!$(plugin.id).length)               dfd.reject({message: 'DOM element id '+plugin.id+' does not exist'});
    if (typeof plugin.name === undefined)   dfd.reject({message: 'No plugin name given'});

    this.plugins[plugin.name] = {
        id:         plugin.id,
        options:    plugin.options,
    };

    dfd.resolve();
    return dfd.promise();
}

PivotController.prototype.run_plugins = function() {
    var that    = this;

    $.each(Object.keys(this.plugins), function(i, name) {
        that.run_plugin(name);
    });
}

PivotController.prototype.run_plugin = function(name) {
    var plugin = this.plugins[name];
    $(plugin.id)[name]($.extend(true, plugin.options, { pivot: this.pivot }));
}

PivotController.prototype.update_plugins = function() {
    var that    = this;

    $.each(Object.keys(this.plugins), function(i, name) {
        that.update_plugin(name);
    });
}

PivotController.prototype.update_plugin = function(name) {
    var plugin = this.plugins[name];
    $(plugin.id).trigger('update');
}
