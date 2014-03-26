var CATEGORIZATION_TYPE = {
	DEFAULT: 'default', 
	GAME_VERSION: 'game_version', 
	ROLE: 'role', 
	SCENARIO: 'scenario'
}

var initDatePicker = function() {
	// DatePicker docs at http://eonasdan.github.io/bootstrap-datetimepicker/
	var startPicker = $('#startPicker');
	var endPicker = $('#endPicker');

	// Set the default date range: from the beginning of the week to the end of the current day
	var default_start_date = moment().startOf('week');
	var default_end_date = moment().endOf('day');
	var default_categorize_by = $('#categorizer').val();

	// Make the initial AJAX request for the page data
	getOverviewStats(default_start_date, default_end_date, default_categorize_by);

	// Set the human-readable range in the header
	updateDateRangeHeader(default_start_date, default_end_date);

	// Initialize datepickers components
	startPicker.datetimepicker({
		pickTime: false,
		defaultDate: default_start_date
	});
	endPicker.datetimepicker({
		pickTime: false,
		defaultDate: default_end_date
	});

	// Once the start date is picked, limit the end date to be only dates on or after the start date
	startPicker.on('dp.change', function(data) {
		endPicker.data('DateTimePicker').setMinDate(data.date);
	});

	$('#dateFilter').click(function() {
		// Note: DatePicker uses Moment dates (See: momentjs.com)
		var start_time = startPicker.data('DateTimePicker').getDate();
		var end_time = endPicker.data('DateTimePicker').getDate();
		var categorize_by = $('#categorizer').val();

		getOverviewStats(start_time, end_time, categorize_by);
	});
};

/**
 * Gets stats for the overview page
 * @param  {Moment} start_time [Moment date representing start time]
 * @param  {Moment} end_time   [Moment date representing end time]
 */
var getOverviewStats = function(start_time, end_time, categorize_by) {
	if (start_time == null || end_time == null || start_time > end_time ) {
		return;
	}

	// All API calls take a Javascript Date (string representation or number of milliseconds from unix epoch)
	var params = {
		start_time: start_time.valueOf(),
		end_time: end_time.valueOf(),
		categorize_by: categorize_by
	};

	// Cool thing: the data for the current page is always served by an API at the same URI!
	$.ajax(window.location.pathname, {
		data: params,
		type: 'GET',
		contentType: 'application/json'
	}).done(function(response) {
		updateDateRangeHeader(start_time, end_time);
		updateStats(response.data); // for overview (stats)

		// NOTE: WE REALLY NEED TO SEPARATE THIS STUFF OUT!
		updateDataTable(response.data, categorize_by);
	});
};

/**
 * Updates the stats boxes on the Overview page
 * @param  {Object} stats [Object with the following keys: 'sessions_initiated', 'sessions_completed', 'avg_completion_time', 'download_count']
 */
var updateStats = function(stats) {
	var stat_ids = ['sessions_initiated', 'sessions_completed', 'avg_completion_time', 'download_count'];

	for (i = 0; i < stat_ids.length; i++) {
		var text = stats[stat_ids[i]];

		if (stat_ids[i] == 'avg_completion_time') {
			text = text + ' min';
		}

		$('#' + stat_ids[i]).text(text);
	}
};

/**
 * Given a start and end time, updates the date range header
 * @param  {Moment} start_time [Moment date representing the start time]
 * @param  {Moment} end_time   [Moment date representing the end time]
 */
var updateDateRangeHeader = function(start_time, end_time) {
	var dateFormat = 'ddd, MMMM D, YYYY'; // Date formatting string (See http://momentjs.com/docs/#/displaying/format/)

	var date_range_text = start_time.format(dateFormat) + ' - ' + end_time.format(dateFormat);
	$('#date-range-header').text(date_range_text);
};

/**
 * Creates the DataTable (https://datatables.net/) for the given set of analytics data
 * @param  {[type]} data [Object containing results of API call]
 */
var updateDataTable = function(data, categorize_by) {
	var dataTable = $('#dataTable');

	if (data.results.length == 0) {
		dataTable.dataTable().fnClearTable();
		return;
	}

	// DataTables v1.10 does not support dynamic column addition and removal so in order to refresh it, we destroy the table and clear it out completely.
	// On table destruction, the existing data gets shifted into the DOM so we have to call .empty() on the datatable DOM element to clear it out completely
	if ($.fn.DataTable.fnIsDataTable(dataTable)) {
		dataTable.dataTable().fnDestroy();
		dataTable.empty();
	}

	// How to use JSON objects as datatable entries instead of arrays
 	// http://stackoverflow.com/questions/14160483/sending-json-objects-in-datatables-aadata-instead-of-arrays

 	// Here, we take the first result and simply take its keys as the column titles of the datatable
 	var first_result = data.results[0];
	var columnDefs = _.map(Object.keys(first_result), function(key, i) {
		console.log(getColumnDef(key, categorize_by));
		return getColumnDef(key, categorize_by);
	});

	dataTable.dataTable({
		bDestroy: true,
		bDeferRender: true,
		aoColumnDefs: columnDefs,
		aaData: data.results
	});
};

// look at the fields returned by the API and map them to specific columns
var getColumnDef = function(key, categorization_type) {
	var columnDef = { mData: key };
	var entityIndex = null;

	if (categorization_type == CATEGORIZATION_TYPE.DEFAULT || categorization_type == CATEGORIZATION_TYPE.GAME_VERSION) {
		entityIndex = 1;
	} else {
		entityIndex = 2;
		
	}

	switch (key) {
		case categorization_type: 
			columnDef.sTitle = getColumnTitleForCategory(categorization_type);
			columnDef.aTargets = [0]; // The first element
			break;
		case 'initiated': 
			columnDef.sTitle = 'Games Initiated (Not Completed)';
			columnDef.aTargets = [entityIndex];
			break;
		case 'completed':
			columnDef.sTitle = 'Games Completed';
			columnDef.aTargets = [entityIndex + 1];
			break;
		case 'total':
			columnDef.sTitle = 'Total Games Played';
			columnDef.aTargets = [entityIndex + 2];
			break;
		case 'entityName':
			columnDef.sTitle = getColumnTitleForCategory(categorization_type) + ' name';
			columnDef.aTargets = [entityIndex - 1];
		default: 
			break;
	}

	return columnDef;
};

var getColumnTitleForCategory = function(categorization_type) {
	switch (categorization_type) {
		case CATEGORIZATION_TYPE.DEFAULT: 
			return 'Date';
			break;
		case CATEGORIZATION_TYPE.GAME_VERSION: 
			return 'Game Version'; 
			break;
		case CATEGORIZATION_TYPE.ROLE: 
			return 'Role'; 
			break;
		case CATEGORIZATION_TYPE.SCENARIO:
			return 'Scenario';
			break;
		default:
			return categorization_type;
			break;
	}

}

/**
 * Let's GO!
 */
$(document).ready(function() {
	initDatePicker();
});

