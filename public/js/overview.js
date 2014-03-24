var initDatePicker = function() {
	// DatePicker docs at http://eonasdan.github.io/bootstrap-datetimepicker/
	var startPicker = $('#startPicker');
	var endPicker = $('#endPicker');

	// Set the default date range: from the beginning of the week to the end of the current day
	var default_start_date = moment().startOf('week');
	var default_end_date = moment().endOf('day');

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

$(document).ready(function() {
	initDatePicker();
});