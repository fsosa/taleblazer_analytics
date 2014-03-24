var initDatePicker = function() {
	// DatePicker docs at http://eonasdan.github.io/bootstrap-datetimepicker/
	var startPicker = $('#startPicker');
	var endPicker = $('#endPicker');

	// Set the default date range: from the beginning of the week to the end of the current day
	var default_start_date = moment().startOf('week');
	var default_end_date = moment().endOf('day');

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

		if (isNaN(start_time) || isNaN(end_time)) {
			return;
		}

		var req = { start_time: start_time, end_time: end_time };

		if (start_time <= end_time) {
			$.ajax(window.location.pathname, {
				data: req,
				type: 'GET', 
				contentType: 'application/json'
			}).done(function(stats) {
				updateDateRangeHeader(start_time, end_time);
				updateStats(stats.data);
			})
		}
	})
};

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

$(document).ready(function() {
	initDatePicker();
});