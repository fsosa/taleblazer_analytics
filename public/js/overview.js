var CATEGORIZATION_TYPE = {
	DEFAULT: 'default',
	GAME_VERSION: 'game_version',
	ROLE: 'role',
	SCENARIO: 'scenario'
};

var initDatePicker = function() {
	// DatePicker docs at http://eonasdan.github.io/bootstrap-datetimepicker/
	var startPicker = $('#startPicker');
	var endPicker = $('#endPicker');

	// Set the default date range: from the beginning of the week to the end of the current day
	// var default_start_date = moment().startOf('week');
	var default_start_date = moment('Mar 01 2014'); // TESTING !!!!
	var default_end_date = moment().endOf('day');
	var default_categorize_by = $('#categorizer').val();


	// TODO: PROBS MOVE THIS SOMEWHERE ELSE
	// Make the initial AJAX request for the page data
	var page = window.location.pathname.split('/')[1];
	if (page != 'download-data') {
		getOverviewStats(default_start_date, default_end_date, default_categorize_by);
	}

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
		// For each time, make sure that we get the full range (i.e. from the beginning of the starting day to the end of the end day)
		// as this is more in line with what the user expects the filter to do.
		// The DateTimePicker can easily be configured to support time selection as well, in case that feature needs to be implemented in the future.
		var start_time = startPicker.data('DateTimePicker').getDate().startOf('day');
		var end_time = endPicker.data('DateTimePicker').getDate().endOf('day');
		var categorize_by = $('#categorizer').val();

		getOverviewStats(start_time, end_time, categorize_by);
	});
};

// !!!! MAKE NON-PAGE SPECIFIC !!!!
// I.E THIS HAPPENS WHEN YOU CLICK THE FILTER BUTTON
/**
 * Gets stats for the overview page
 * @param  {Moment} start_time [Moment date representing start time]
 * @param  {Moment} end_time   [Moment date representing end time]
 */
var getOverviewStats = function(start_time, end_time, categorize_by) {
	if (start_time == null || end_time == null || start_time > end_time) {
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
		updateDataTable(response.data, categorize_by); // for games played page
	});
};

// !!!!! OVERVIEW SPECIFIC !!!!!!
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
	if (data.results == null) {
		return;
	}

	var dataTable = $('#dataTable');

	$('#datatable-heading').text('Statistics (by ' + getColumnTitleForCategory(categorize_by) + ')');


	// DataTables v1.10 does not support dynamic column addition and removal so in order to refresh it, we destroy the table.
	if ($.fn.DataTable.fnIsDataTable(dataTable)) {
		dataTable.dataTable().fnDestroy();
	}

	if (data.results.length == 0) {
		// If the dataTable hasn't been created yet (e.g. first page load), this creates it (w/ custom empty table message) and clears it (b/c there's no data to display)
		dataTable.dataTable({
			oLanguage: {
				sEmptyTable: 'No matching results'
			}
		}).fnClearTable();
		return;
	}

	// On table destruction, the existing data gets shifted into the DOM so we have to call .empty() on the datatable DOM element to clear it out completely
	// In general, clear it out completely because DataTable will completely recreate the table DOM for us.
	dataTable.empty();

	// How to use JSON objects as datatable entries instead of arrays
	// http://stackoverflow.com/questions/14160483/sending-json-objects-in-datatables-aadata-instead-of-arrays

	// !!!! PROBABLY GAMES PLAYED SPECIFIC; THIS WILL BE WEIRD WITH AGENT BUMPS
	// Here, we take the first result and simply take its keys as the column titles of the datatable
	var first_result = data.results[0];

	var columnDefs = _.map(Object.keys(first_result), function(key, i) {
		var page = window.location.pathname.split('/')[1];

		switch (page) {
			case 'games-played':
				return getColumnDefGamesPlayed(key, categorize_by);
				break;
			case 'gameplay-duration':
				return getColumnDefGameplayDuration(key, categorize_by, i);
				break;
			case 'agent-bumps':
				return getColumnDefAgentBump(key, categorize_by, i);
				break;
			case 'custom-events':
				return getColumnDefCustomEvents(key, categorize_by, i);
				break;
		}
	});

	dataTable.dataTable({
		bDestroy: true,
		bDeferRender: true,
		aoColumnDefs: columnDefs,
		aaData: data.results
	});
};

var getColumnDefCustomEvents = function(key, categorization_type, i) {
	var columnDef = {
		mData: key
	};

	var startOfAgentColIndex;
	// Only here until we get version names in
	if (categorization_type == CATEGORIZATION_TYPE.DEFAULT) {
		startOfDataColIndex = 1;
	} else {
		startOfDataColIndex = 2;
	}

	var sortedDefault = categorization_type == CATEGORIZATION_TYPE.DEFAULT;

	// The starting offset determines what index the custom event data start at
	// i.e. if sorted by default, we use the 'default' key as the first column and there is no entityName so 'value' is the first data column
	var startingOffset = sortedDefault ? 0 : 1;

	switch (key) {
		case categorization_type:
			var suffix = sortedDefault ? '' : ' ID';
			columnDef.sTitle = getColumnTitleForCategory(categorization_type) + suffix;
			columnDef.aTargets = [0]; // first column
			break;
		case 'entityName':
			columnDef.sTitle = getColumnTitleForCategory(categorization_type) + ' name';
			columnDef.aTargets = [startOfDataColIndex - 1];
			break;
		case 'value':
			columnDef.sTitle = 'Value';
			columnDef.aTargets = [startOfDataColIndex];
			break;
		case 'unique':
			columnDef.sTitle = 'Unique Events';
			columnDef.aTargets = [startOfDataColIndex + startingOffset];
			break;
		case 'total':
			columnDef.sTitle = 'Total Events';
			columnDef.aTargets = [startOfDataColIndex + startingOffset + 1];
			break;

	}

	return columnDef;
};


var getColumnDefAgentBump = function(key, categorization_type, i) {
	var columnDef = {
		mData: key
	};

	var startOfAgentColIndex;
	// Only here until we get version names in
	if (categorization_type == CATEGORIZATION_TYPE.DEFAULT) {
		startOfAgentColIndex = 1;
	} else {
		startOfAgentColIndex = 2;
	}

	var sortedDefault = categorization_type == CATEGORIZATION_TYPE.DEFAULT;
	// When sorted by default (agent), the 'default' key provides the agent_id so there is no 'agent_id' key in the results
	// This starting offset determines what index the agent_name and other columns belong in, based on that information
	// i.e. if sorted by default, we use the 'default' key as the first column so 'agent_name' is the first column of agent data (placed at startOfAgentColIndex)
	var startingOffset = sortedDefault ? 0 : 1;

	switch (key) {
		case categorization_type:
			columnDef.sTitle = getColumnTitleForCategory(categorization_type) + ' ID';
			columnDef.aTargets = [0]; // first column
			break;
		case 'entityName':
			columnDef.sTitle = getColumnTitleForCategory(categorization_type) + ' name';
			columnDef.aTargets = [startOfAgentColIndex - 1];
			break;
		case 'agent_id':
			columnDef.sTitle = 'Agent ID';
			columnDef.aTargets = [startOfAgentColIndex];
			break;
		case 'agent_name':
			columnDef.sTitle = 'Agent name';
			columnDef.aTargets = [startOfAgentColIndex + startingOffset];
			break;
		case 'unique':
			columnDef.sTitle = 'Unique bumps';
			columnDef.aTargets = [startOfAgentColIndex + startingOffset + 1];
			break;
		case 'total':
			columnDef.sTitle = 'Total bumps';
			columnDef.aTargets = [startOfAgentColIndex + startingOffset + 2];
			break;

	}

	return columnDef;
};

var getColumnDefGameplayDuration = function(key, categorization_type, i) {
	var columnDef = {
		mData: key
	};
	var entityIndex = null;

	if (categorization_type == CATEGORIZATION_TYPE.DEFAULT) {
		entityIndex = 1;
	} else {
		entityIndex = 2;

	}

	switch (key) {
		case categorization_type:
			var suffix = (categorization_type == CATEGORIZATION_TYPE.DEFAULT) ? '' : ' ID';
			columnDef.sTitle = getColumnTitleForCategory(categorization_type) + suffix;
			columnDef.aTargets = [0]; // first column
			break;
		case 'entityName':
			columnDef.sTitle = getColumnTitleForCategory(categorization_type) + ' name';
			columnDef.aTargets = [entityIndex - 1];
			break;
		default:
			columnDef.sTitle = key + ' min';
			columnDef.aTargets = [entityIndex + i];
			break;
	}


	return columnDef;
};

// !!! DEFINITELY PAGE SPECIFIC FOR GAMES PLAYED !!!!
// look at the fields returned by the API and map them to specific columns
var getColumnDefGamesPlayed = function(key, categorization_type) {
	var columnDef = {
		mData: key
	};
	var entityIndex = null;

	if (categorization_type == CATEGORIZATION_TYPE.DEFAULT) {
		entityIndex = 1;
	} else {
		entityIndex = 2;

	}

	switch (key) {
		case categorization_type:
			var suffix = (categorization_type == CATEGORIZATION_TYPE.DEFAULT) ? '' : ' ID';
			columnDef.sTitle = getColumnTitleForCategory(categorization_type) + suffix;
			columnDef.aTargets = [0]; // The first element
			break;
		case 'initiated':
			columnDef.sTitle = 'Games Initiated (Not Completed)';
			columnDef.aTargets = [entityIndex + 1];
			break;
		case 'completed':
			columnDef.sTitle = 'Games Completed';
			columnDef.aTargets = [entityIndex + 2];
			break;
		case 'total':
			columnDef.sTitle = 'Total Games Played';
			columnDef.aTargets = [entityIndex];
			break;
		case 'entityName':
			columnDef.sTitle = getColumnTitleForCategory(categorization_type) + ' name';
			columnDef.aTargets = [entityIndex - 1];
		default:
			break;
	}

	return columnDef;
};

// !!! DEFINITELY GAMES PLAYED SPECIFIC
var getColumnTitleForCategory = function(categorization_type) {
	switch (categorization_type) {
		case CATEGORIZATION_TYPE.DEFAULT:
			var page = window.location.pathname.split('/')[1];

			if (page == 'agent-bumps') {
				return 'Agent';
			} else {
				return 'Date';
			}

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

};

var humanize = function(text) {
	return text.replace(/_/g, ' ')
		.replace(/(\w+)/g, function(match) {
			return match.charAt(0).toUpperCase() + match.slice(1);
		});
};

window.downloadFile = function(sUrl) {

	//iOS devices do not support downloading. We have to inform user about this.
	if (/(iP)/g.test(navigator.userAgent)) {
		alert('Your device does not support files downloading. Please try again in desktop browser.');
		return false;
	}

	//If in Chrome or Safari - download via virtual link click
	if (window.downloadFile.isChrome || window.downloadFile.isSafari) {
		//Creating new link node.
		var link = document.createElement('a');
		link.href = sUrl;

		if (link.download !== undefined) {
			//Set HTML5 download attribute. This will prevent file from opening if supported.
			var fileName = sUrl.substring(sUrl.lastIndexOf('/') + 1, sUrl.length);
			link.download = fileName;
		}

		//Dispatching click event.
		if (document.createEvent) {
			var e = document.createEvent('MouseEvents');
			e.initEvent('click', true, true);
			link.dispatchEvent(e);
			return true;
		}
	}

	// Force file download (whether supported by server).
	sUrl += '?download';

	window.open(sUrl, '_self');
	return true;
}

window.downloadFile.isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
window.downloadFile.isSafari = navigator.userAgent.toLowerCase().indexOf('safari') > -1;

/**
 * Let's GO!
 */
$(document).ready(function() {
	initDatePicker();

	$("#side-menu li a").each(function(i, el) {
		var href = $(el).attr('href');
		if (href == window.location.pathname) {
			$(el).addClass("active-menu");
		}
	});

	$("#downloadButton").click(function(e) {
		var startPicker = $("#startPicker");
		var endPicker = $("#endPicker");
		var start_time = startPicker.data('DateTimePicker').getDate();
		var end_time = endPicker.data('DateTimePicker').getDate();

		var validDates = start_time.isValid() && end_time.isValid();

		if (validDates) {
			start_time = start_time.startOf('day').valueOf(); // the unix offset (ms) of the start of the chosen day
			end_time = end_time.endOf('day').valueOf(); // the unix offset (ms) of the end of the chosen day
			var url = window.location + '?start_time=' + start_time + '&end_time=' + end_time + '&download=true';
			window.downloadFile(url);
		} else {
			// TODO: Flash an error message or something
		}


	});

	$(".filter-btn").each(function(i, el) {
		$(el).on("click", function() {
			var val = $(this).attr('data-value');
			var startPicker = $('#startPicker').data("DateTimePicker");
			var endPicker = $('#endPicker').data("DateTimePicker");

			var start_date = null;
			var end_date = null;

			switch (val) {
				case '0':
					start_date = moment().startOf('day');
					end_date = moment().endOf('day');
					break;
				case '1':
					start_date = moment().subtract('days', 7).startOf('day');
					end_date = moment().endOf('day');
					break;
				case '2':
					start_date = moment().subtract('days', 30).startOf('day');
					end_date = moment().endOf('day');
					break;
				case '3':
					start_date = moment().subtract('days', 90).startOf('day');
					end_date = moment().endOf('day');
					break;
			}

			startPicker.setDate(start_date);
			endPicker.setDate(end_date);
		})
	});

});