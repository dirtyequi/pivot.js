# Welcome to Pivot.js

This is a fork of [rwjblue's pivot.js](http://rwjblue.github.com/pivot.js/) which was originally designed to have one pivot and DataTables object instance at a time.
Since there had been some requests by others to make this multi-instanceable, I did a complete rewrite of pivot.js and jquery_pivot.js.

For some generic information about the basic functionality of pivot.js please visit [this page](http://rwjblue.github.com/pivot.js/).

This library consists of multiple files and functionalites:

* `pivot.js` - The (mostly) original pivot object from `rwjblue`
* `pivot_table.js` - This is the original jquery_pivot.js but with less functionality and in another context.
  It now only supports creating the DataTable and binds several jQuery events.
  Also this is now better known as a plugin.
* `pivot_chart.js` - Another plugin that uses HighCharts to visualize the pivot data.
* `pivot_controller.js` - Contains functionality to display the current pivot settings.
  This was moved out of the original `jquery_pivot.js`.


jQuery-Plugins:

 * `jquery_pivot_table.js` - The jQuery multi-instance plugin for `pivot_table.js`
 * `jquery_pivot_chart.js` - The jQuery multi-instance plugin for `pivot_chart.js`

  
Some more functionality:

 * All DOM elements are configurable via a basic templating system.
   This means to you that you have __full control__ over the generated HTML code.
 * All predefined templates are bootstrap3-ready. Yay! ^^
 * jQuery events for __ultimate control__ over what happens at which time.
 * Extended configuration options - don't mess up with that.

## View an [example](http://dirtyequi.github.com/pivot.js/) or view the [Docs](http://dirtyequi.github.com/pivot.js/docs/index.html#!/api/Pivot) for more information.


#Usage

Step one is to initialize the pivot object.  It expects one of the following attributes:

* `csv` - which should contain a valid string of comma separated values.  It is
  __important to note__ that you must include a header row in the CSV for pivot
  to work properly.
* `json` - which should contain a valid JSON string. At this time this string
  must be an array of arrays, and not an array of objects (storing the field
  names with each row consumes significantly more space).
* `url` - which may contain a string with an URL from where to retrieve your
  data or a function that must return the URL.

```javascript
{
	url: '/demo.csv',
	// or
	url: function() { return '/demo.php?start=2014-08-01&end=2014-08-31'; },
}
```	  

In addition you need to specify your fields which have to be pivoted by pivot.js.
This is done by:

* `fields` - which should be an array of objects.  This is used to instruct
  pivot on how to interact with the fields you pass in.  It keys off of the
  header row names.  And is formated like so:

```javascript
 {
 	fields: [
   		{  name: 'header-name', type: 'string', optional_attributes: 'optional field' },
   		{  name: 'header-name', type: 'string', optional_attributes: 'optional field' }
 	],
}
```
(<small>See more about fields in Section below</small>)

* `filters` (default is empty) - which should contain any filters you would like to restrict your data to.  A filter is defined as an object like so:

```javascript
{
	filters: { zip_code: '34471' },
}
```

Those are the options that you should consider.
There are other options that are well covered in the [documentation](http://dirtyequi.github.com/pivot.js/docs/index.html#!/api/Pivot).

A valid Pivot could then be set up from like so:

```javascript
var field_definitions = [{name: 'last_name',   type: 'string',   filterable: true},
        {name: 'first_name',        type: 'string',   filterable: true},
        {name: 'zip_code',          type: 'integer',  filterable: true},
        {name: 'pseudo_zip',        type: 'integer',  filterable: true },
        {name: 'billed_amount',     type: 'float',    rowLabelable: false},
        {name: 'last_billed_date',  type: 'date',     filterable: true}


// from csv data:
var csv_string  =  "last_name,first_name,zip_code,billed_amount,last_billed_date\n" +
                   "Jackson,Robert,34471,100.00,\"Tue, 24 Jan 2012 00:00:00 +0000\"\n" +
                   "Jackson,Jonathan,39401,124.63,\"Fri, 17 Feb 2012 00:00:00 +0000\""
var p = new Pivot({
	csv: 	csv_string,
	fields:	field_definitions,
});


// from json data:
var json_string = '[["last_name","first_name","zip_code","billed_amount","last_billed_date"],' +
                    ' ["Jackson", "Robert", 34471, 100.00, "Tue, 24 Jan 2012 00:00:00 +0000"],' +
                    ' ["Smith", "Jon", 34471, 173.20, "Mon, 13 Feb 2012 00:00:00 +0000"]]'
var p = new Pivot({
	json: 	json_string,
	fields:	field_definitions,
});
```

__This won't display anything__, it even won't pivot your data. Read the next chapters to
learn how to visualize your data.


# Visualizing with DataTables and Highcharts

In order to visualize your data you need to create jQuery plugin instances of PivotTable and/or PivotChart:

```javascript
// for PivotTable
$('#pivot-table').PivotTable({
	pivot:	p,
});


// for PivotChart
$('#pivot-chart').PivotChart({
	pivot:	p,
});

// of course the corresponding DOM elements like <div id="pivot-chart"></div> have to be present.
```

And that's it. Fore more options see the documentation for [PivotTable]() and [PivotChart]().


# Visualizing with PivotController

You may want to go the easy way by using the PivotController (which is basically a good idea, because
this plugin provides the pivot controls (filters, row-label fields, column-label fields and summary-fields)
, besides it also provides a list of configuration for predefined reports.

The PivotController plugin can handle the PivotTable and PivotChart plugins and fires update-events 
every time your selection has changed.

```javascript
$('#pivot-controller').PivotController({
	pivot:		p,
	pluings:	[
		{
			id: 	'#pivot-chart',
			name:	'PivotChart',
			options:{
			}
		},
		{
			id: 	'#pivot-table',
			name:	'PivotTable',
			options:{
			}
		},		
	],
});
```

Et voila, your pivot controls, pivot table and pivot charts are there. Ready for action. Isn't that cool?

FIXME: autogeneration of elements is still missing. Docs are incomplete.


# Dependencies

 * jQuery (tested with 1.9.1)
 * DataTables (tested with 1.10.2)
 * HighCharts (tested with 4.0.3)
 * node-uuid

This library works best with the mentioned versions of each depending library. You also should 
think about [Bootstrap 3](http://www.getbootstrap.com/).


# Wiki

...still to come...


# Articles

* [Introducing Pivot.js](http://jonathan-jackson.net/2012/04/10/introducing-pivotjs) - Jonathan Jackson


# Authors

The original Pivot.js is the work of Robert Jackson and Jonathan Jackson.
Other files contributed to this repository are the work of Tristan Cebulla.


## License

This software is licensed under a modified BSD license.

See LICENSE for more details.