var initDatePicker = function() {
	console.log("init")
	$('#datepicker.input-daterange').datepicker({
		todayBtn: 'linked',
		autoclose: true,
		todayHighlight: true
	});
};

$(document).ready(function() {
	initDatePicker();
});
