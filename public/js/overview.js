var initDatePicker = function() {
	var startDatePicker = $('#startDate.input-group.date');
	$('#startDate.input-group.date').datepicker({
		todayBtn: 'linked',
		autoclose: true,
		todayHighlight: true
	});

	var endDatePicker = $('#endDate.input-group.date');
	$('#endDate.input-group.date').datepicker({
		todayBtn: 'linked',
		autoclose: true,
		todayHighlight: true,
	})

	$('#dateFilter').click(function() {
		var start_time = $('#startDate').datepicker('getDate');
		var end_time = endDatePicker.datepicker('getDate');

		if (isNaN(start_time) || isNaN(end_time)) {
			return;
		}

		var req = { start_time: start_time, end_time: end_time };

		if (startDate <= endDate) {
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