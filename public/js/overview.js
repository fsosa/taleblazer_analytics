var initDatePicker = function() {
	// DatePicker docs at http://eonasdan.github.io/bootstrap-datetimepicker/
	var startPicker = $('#startPicker');
	var endPicker = $('#endPicker');

	// Set the default date range: from the beginning of the week to the end of the current day
	var default_start_date = moment().startOf('week');
	var default_end_date = moment().endOf('day');

	// Get the first overview stats
	getOverviewStats(default_start_date.toDate(), default_end_date.toDate());

	// Set the human-readable range in the header
	updateDateRangeHeader(default_start_date, default_end_date);

	// Initialize components
	startPicker.datetimepicker({
		pickTime: false, 
		defaultDate: default_start_date
	});
	endPicker.datetimepicker({
		pickTime: false, 
		defaultDate: default_end_date
	});

	// Once the first date is picked, limit the next date to dates after that
	startPicker.on('dp.change', function(data) {
		endPicker.data('DateTimePicker').setMinDate(data.date);
	});

	$('#dateFilter').click(function() {
		// DatePicker uses Moment dates (see momentjs.com); Use toDate() to get the underlying js Date object)
		var start_time = startPicker.data('DateTimePicker').getDate().toDate();
		var end_time = endPicker.data('DateTimePicker').getDate().toDate();
		var categorize_by = $("#categorizer").val();

		getOverviewStats(start_time, end_time, categorize_by);
	})
};

/**
 * Gets stats for the overview page
 * @param  {Date} start_time [must be a Javascript Date object]
 * @param  {Date} end_time   [must be a Javascript Date object]
 */
var getOverviewStats = function(start_time, end_time, categorize_by) {
	if (isNaN(start_time) || isNaN(end_time)) {
		return;
	}

	var req = { start_time: start_time, end_time: end_time, categorize_by: categorize_by };

	if (start_time <= end_time) {
		$.ajax(window.location.pathname, {
			data: req,
			type: 'GET', 
			contentType: 'application/json'
		}).done(function(results) {
			updateDateRangeHeader(start_time, end_time);
			updateStats(results.data); // for overview (stats)

			// NOTE: WE REALLY NEED TO SEPARATE THIS STUFF OUT!
			updateDataTable(results.data);
		})
	}
}

var getRequestParams = function() {
	var start_time = startPicker.data('DateTimePicker').getDate().toDate();
	var end_time = endPicker.data('DateTimePicker').getDate().toDate();
	var categorize_by = $("#categorizer").val();

	return { start_time: start_time, end_time: end_time, categorize_by: categorize_by };
}

var updateStats = function(stats) {
	var stat_ids = ['sessions_initiated', 'sessions_completed', 'avg_completion_time', 'download_count'];
	for(i = 0 ; i < stat_ids.length; i++) {
		var text = stats[stat_ids[i]];
		if (stat_ids[i] == 'avg_completion_time') {
			text = text + ' min';
		}
		$('#' + stat_ids[i]).text(text);
	}
};

var updateDateRangeHeader = function(start_time, end_time) {
	// Convert to Moment dates
	start_time = moment(start_time);
	end_time = moment(end_time);

	var dateFormat = "ddd, MMMM D, YYYY";
	var date_range_text = start_time.format(dateFormat) + ' - ' + end_time.format(dateFormat);
	$('#date-range-header').text(date_range_text);
};

var updateDataTable = function(data) {
	// http://stackoverflow.com/questions/14160483/sending-json-objects-in-datatables-aadata-instead-of-arrays
	// http://www.datatables.net/forums/discussion/5287/destroy-and-recreate-troubles/p1
	// basically we're fully defining the table so the data that gets shifted into the DOM after destroy needs to be cleared out completely
	// that's why we call .empty() on the datatable DOM element
	var dataTable = $('#dataTable')
	if (data.results.length == 0) {
		dataTable.dataTable().fnClearTable();
		return;
	}

	

	if ($.fn.DataTable.fnIsDataTable(dataTable)) {
		// we have to do this bc the ajax call might return more columns and DataTables currently doesn't support dynamic column addition/removal
		dataTable.dataTable().fnDestroy();
		dataTable.empty();
	}

	var first_result = data.results[0];

	var columns = _.map(Object.keys(first_result), function(key, i) {
		return { mData: key, sTitle: key, aTargets: [i] }
	});

	console.log(data);
	console.log(columns);

	dataTable.dataTable({
		bDestroy: true, 
		bDeferRender: true, 
		aoColumnDefs: columns, 
		aaData: data.results
	});
	console.log("created new table");
}

$(document).ready(function() {
	initDatePicker();
});