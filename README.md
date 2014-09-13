# Welcome to Pivot.js

This is a fork of [rwjblue's pivot.js](http://rwjblue.github.com/pivot.js/) which was originally designed to have one pivot and DataTables object instance at a time.
Since there had been some requests by others to make this multi-instanceable, I did a complete rewrite of pivot.js and jquery_pivot.js.

For some generic information about the basic functionality of pivot.js please visit [this page](http://rwjblue.github.com/pivot.js/).

This library consists of multiple files and functionalites:

* `pivot.js` - The (mostly) original pivot object from `rwjblue`
* `pivot_table.js` - This is the original jquery_pivot.js but with less functionality and in another context.
  It now only supports creating the DataTable and binds several jQuery events.
  Also this is now better known as a plugin.
* `jquery_pivot_table.js` - The jQuery multi-instance plugin for `pivot_table.js`
* `pivot_chart.js` - Another plugin that uses HighCharts to visualize the pivot data
* `jquery_pivot_chart.js` - The jQuery multi-instance plugin for `pivot_chart.js`
* `pivot_controller.js` - 

Some more functionality:

 * All DOM elements are configurable via a basic templating system.
   This means to you that you have __full control__ over the generated HTML code.
 * All predefined templates are bootstrap3-ready. Yay! ^^
 * jQuery events for __ultimate control__ over what happens at which time.

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
 [
   {  name: 'header-name', type: 'string', optional_attributes: 'optional field' },
   {  name: 'header-name', type: 'string', optional_attributes: 'optional field' }
 ]

```
(<small>See more about fields in Section below</small>)

* `filters` (default is empty) - which should contain any filters you would like to restrict your data to.  A filter is defined as an object like so:

```javascript
{ zip_code: '34471' }

```

Those are the options that you should consider.
There are other options that are well covered in the (documentation)[http://dirtyequi.github.com/pivot.js/docs/index.html#!/api/Pivot].

A valid pivot could then be set up from like so.

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

# Wiki

* [Filters](https://github.com/rwjblue/pivot.js/wiki/Filters)
* [Labels](https://github.com/rwjblue/pivot.js/wiki/Labels)
* [Summaries](https://github.com/rwjblue/pivot.js/wiki/Summaries)
* [Integrating with jQuery](https://github.com/rwjblue/pivot.js/wiki/Integrating-with-jQuery)
* [jQuery Supporting Cast](https://github.com/rwjblue/pivot.js/wiki/jQuery_pivot-Supporting-Cast)
* [Integrating with DataTables](https://github.com/rwjblue/pivot.js/wiki/Integrating-with-Datatables)  (__Highly Recommend__)
* [Contribute](https://github.com/rwjblue/pivot.js/wiki/Contributing)
* [DOCS](http://rwjblue.github.com/pivot.js/docs/index.html#!/api/Pivot)

# Articles

* [Introducing Pivot.js](http://jonathan-jackson.net/2012/04/10/introducing-pivotjs) - Jonathan Jackson

# Authors

The original Pivot.js is the work of Robert Jackson and Jonathan Jackson.
Other files contributed to this repository are the work of Tristan Cebulla.

## License

This software is licensed under a modified BSD license.

See LICENSE for more details.