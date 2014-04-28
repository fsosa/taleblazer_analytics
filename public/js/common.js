var tba = {};

tba.CATEGORIZE_TYPE = {
	DEFAULT: 'default',
	GAME_VERSION: 'game_version',
	ROLE: 'role',
	SCENARIO: 'scenario'
};

tba.PAGE = {
	OVERVIEW: 'overview',
	GAMES_PLAYED: 'games-played',
	GAME_DURATION: 'gameplay-duration',
	AGENT_BUMPS: 'agent-bumps',
	CUSTOM_EVENTS: 'custom-events',
	DOWNLOAD_DATA: 'download-data'
};

/**
 * Initialize the variables for page input elements
 */
tba.initInputVars = function() {
	tba.startPicker = $('#startPicker');
	tba.endPicker = $('#endPicker');
	tba.categorizeSelect = $('#categorizeSelect');
	tba.dataTable = $('#dataTable');
};

tba.initDatePicker = function() {
	// DatePicker docs at http://eonasdan.github.io/bootstrap-datetimepicker/
	// Note: DatePicker uses Moment dates (See: momentjs.com)
	tba.startPicker = $('#startPicker');
	tba.endPicker = $('#endPicker');

	// Set the default date range: from the beginning of the week to the end of the current day
	var default_start_date = moment().startOf('week');
	var default_end_date = moment().endOf('day');
	var default_categorize_by = $('#categorizer').val();

	// Initialize datepickers components
	tba.startPicker.datetimepicker({
		pickTime: false,
		defaultDate: default_start_date
	});
	tba.endPicker.datetimepicker({
		pickTime: false,
		defaultDate: default_end_date
	});

	// Once the start date is picked, limit the end date to only be on or after the start date
	tba.startPicker.on('dp.change', function(data) {
		tba.endPicker.data('DateTimePicker').setMinDate(data.date);
	});
};

/**
 * Initializes the page by making the first data request
 */
tba.initPage = function() {
	tba.updateDateRangeHeader();
	tba.updateSideMenu();

	var start_date = tba.getStartDate();
	var end_date = tba.getEndDate();
	var categorize_by = tba.getCategorizeValue();

	// Make the initial AJAX request for the page data
	var page = tba.getPage();
	if (page != tba.PAGE.DOWNLOAD_DATA) {
		tba.requestPageStats(start_date, end_date, categorize_by);
	}

};

tba.setupHandlers = function() {

	// Requests the page date when the Filter button is clicked
	$('#dateFilter').click(function() {
		// Get the full range of time, from the beginning of the start day to the end of the end day
		var start_time = tba.getStartDate().startOf('day');
		var end_time = tba.getEndDate().endOf('day');
		var categorize_by = tba.getCategorizeValue();

		tba.requestPageStats(start_time, end_time, categorize_by);
	});

	// Downloads the CSV when the download button is clicked, via javascript
	$('#downloadButton').click(function(e) {
		var start_time = tba.getStartDate();
		var end_time = tba.getEndDate();

		var validDates = start_time.isValid() && end_time.isValid();

		if (validDates) {
			start_time = start_time.startOf('day').valueOf(); // the unix offset (ms) of the start of the chosen day
			end_time = end_time.endOf('day').valueOf(); // the unix offset (ms) of the end of the chosen day
			var url = window.location + '?start_time=' + start_time + '&end_time=' + end_time + '&download=true';
			window.downloadFile(url);
		}
	});

	// Set the correct date ranges for the fast filters when clicked
	$('.filter-btn').each(function(i, el) {
		$(el).on('click', function() {
			var val = $(this).attr('data-value');
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
				case '4':
					start_date = global.draft_time_created;
					end_date = moment().endOf('day');
			}

			tba.setStartDate(start_date);
			tba.setEndDate(end_date);
		});
	});


};

/**
 * Gets the appropriate stats for the current page
 * @param  {Moment} start_time [Moment date representing start time]
 * @param  {Moment} end_time   [Moment date representing end time]
 */
tba.requestPageStats = function(start_time, end_time, categorize_by) {
	if (start_time == null || end_time == null || start_time > end_time) {
		return;
	}

	// All API calls take the number of milliseconds from unix epoch for date values
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
		tba.updateStats(response.data);
	});
};

tba.updateStats = function(data) {
	tba.updateDateRangeHeader();
	var page = tba.getPage();

	if (page == tba.PAGE.OVERVIEW) {
		updateOverviewStats(data);
	} else {
		updateDataTable(data, tba.getCategorizeValue());
	}
};

/**
 * Updates the stats boxes on the Overview page
 * @param  {Object} stats [Object with the following keys: 'sessions_initiated', 'sessions_completed', 'avg_completion_time', 'download_count']
 */
var updateOverviewStats = function(stats) {
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
 * Given a start and end time, updates the date range header.
 * If no start or end times are provided, uses the currently selected start and end times.
 * @param  {Moment} start_time [Moment date representing the start time]
 * @param  {Moment} end_time   [Moment date representing the end time]
 */
tba.updateDateRangeHeader = function(start_time, end_time) {
	start_time = start_time || tba.getStartDate();
	end_time = end_time || tba.getEndDate();

	// Date formatting string (See http://momentjs.com/docs/#/displaying/format/)
	var dateFormat = 'ddd, MMMM D, YYYY';

	var date_range_text = start_time.format(dateFormat) + ' - ' + end_time.format(dateFormat);
	$('#date-range-header').text(date_range_text);
};

/**
 * Creates and updates the DataTable (https://datatables.net/) for the given set of analytics data
 * @param  {[type]} data [Object corresponding to the 'data' key of the API response]
 */
var updateDataTable = function(data, categorize_by) {
	if (data.results == null) {
		return;
	}

	var dataTable = tba.dataTable;

	$('#datatable-heading').text('Statistics (by ' + tba.getColumnTitleForCategory(categorize_by) + ')');

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
	// In general, clear it out completely because DataTable will completely recreate the table DOM for us anyway.
	dataTable.empty();

	// Here, we take the first result and simply take its keys as the column titles of the datatable, because all objects share the same set of keys
	var first_result = data.results[0];

	// Using the keys (i.e. columns) of the first result, we build the list of column defs for the data table.
	var columnDefs = _.map(Object.keys(first_result), function(key, i) {
		var page = tba.getPage();

		switch (page) {
			case tba.PAGE.GAMES_PLAYED:
				return tba.getColumnDefGamesPlayed(key, categorize_by);
				break;
			case tba.PAGE.GAME_DURATION:
				return tba.getColumnDefGameplayDuration(key, categorize_by, i);
				break;
			case tba.PAGE.AGENT_BUMPS:
				return tba.getColumnDefAgentBump(key, categorize_by);
				break;
			case tba.PAGE.CUSTOM_EVENTS:
				return tba.getColumnDefCustomEvents(key, categorize_by);
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

/**
 * Returns a column def object for the given JSON key and categorization type for Custom Events data
 * (See https://www.datatables.net/usage/columns)
 *
 *
 * @param  {String} key                 [key in the JSON object corresponding to the data]
 * @param  {String} categorization_type
 *
 * @return {Object} columnDef
 *         {
 *         		mData: // Key into the JSON object where the data for the column lives
 *           	sTitle: // Title for the column in the table
 *           	aTargets: // Array with a single integer element, corresponding to the index of the column in the table
 *         }
 */
tba.getColumnDefCustomEvents = function(key, categorization_type) {
	var columnDef = {
		mData: key
	};

	var sortedDefault = categorization_type == tba.CATEGORIZE_TYPE.DEFAULT;

	// Determines where the actual custom events data columns start
	// If we're sorting by the default (Date), then the data starts right after the Date column. Otherwise, we start after the entityName column
	var startOfDataColIndex = sortedDefault ? 1 : 2;

	switch (key) {
		case categorization_type:
			var suffix = sortedDefault ? '' : ' ID';
			columnDef.sTitle = tba.getColumnTitleForCategory(categorization_type) + suffix;
			columnDef.aTargets = [0]; // first column
			break;
		case 'entityName':
			columnDef.sTitle = tba.getColumnTitleForCategory(categorization_type) + ' name';
			columnDef.aTargets = [startOfDataColIndex - 1];
			break;
		case 'value':
			columnDef.sTitle = 'Value';
			columnDef.aTargets = [startOfDataColIndex];
			break;
		case 'unique':
			columnDef.sTitle = 'Unique Events';
			columnDef.aTargets = [startOfDataColIndex + 1];
			break;
		case 'total':
			columnDef.sTitle = 'Total Events';
			columnDef.aTargets = [startOfDataColIndex + 2];
			break;

	}

	return columnDef;
};

/**
 * Returns a column def object for the given JSON key and categorization type for Agent Bumps data
 * (See https://www.datatables.net/usage/columns)
 *
 *
 * @param  {String} key                 [key in the JSON object corresponding to the data]
 * @param  {String} categorization_type
 *
 * @return {Object} columnDef
 *         {
 *         		mData: // Key into the JSON object where the data for the column lives
 *           	sTitle: // Title for the column in the table
 *           	aTargets: // Array with a single integer element, corresponding to the index of the column in the table
 *         }
 */
tba.getColumnDefAgentBump = function(key, categorization_type) {
	var columnDef = {
		mData: key
	};

	var sortedDefault = categorization_type == tba.CATEGORIZE_TYPE.DEFAULT;

	// Determines where the actual agent bumps data columns start
	// If we're sorting by the default (Agent), then the data starts right after the Agent ID column. Otherwise, we start after the entityName column
	var startOfAgentColIndex = sortedDefault ? 1 : 2;

	// When sorted by default (Agent), the 'default' key provides the agent_id so there is no additional 'agent_id' key in the results
	// This starting offset determines what index the agent_name and other columns belong in, based on that information
	// i.e. if sorted by default, we use the 'default' key as the first column so 'agent_name' is the first column of agent data (placed at startOfAgentColIndex)
	var startingOffset = sortedDefault ? 0 : 1;

	switch (key) {
		case categorization_type:
			columnDef.sTitle = tba.getColumnTitleForCategory(categorization_type) + ' ID';
			columnDef.aTargets = [0]; // first column
			break;
		case 'entityName':
			columnDef.sTitle = tba.getColumnTitleForCategory(categorization_type) + ' name';
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

/**
 * Returns a column def object for the given JSON key and categorization type for Gameplay Duration data
 * (See https://www.datatables.net/usage/columns)
 *
 *
 * @param  {String} key                 [key in the JSON object corresponding to the data]
 * @param  {String} categorization_type
 * @param  {Number} index 				[Index of the key in the loop]
 *
 * @return {Object} columnDef
 *         {
 *         		mData: // Key into the JSON object where the data for the column lives
 *           	sTitle: // Title for the column in the table
 *           	aTargets: // Array with a single integer element, corresponding to the index of the column in the table
 *         }
 */
tba.getColumnDefGameplayDuration = function(key, categorization_type, index) {
	var columnDef = {
		mData: key
	};

	var sortedDefault = categorization_type == tba.CATEGORIZE_TYPE.DEFAULT;
	var startOfDurationColIndex = sortedDefault ? 1 : 2;

	switch (key) {
		case categorization_type:
			var suffix = (categorization_type == tba.CATEGORIZE_TYPE.DEFAULT) ? '' : ' ID';
			columnDef.sTitle = tba.getColumnTitleForCategory(categorization_type) + suffix;
			columnDef.aTargets = [0]; // first column
			break;
		case 'entityName':
			columnDef.sTitle = tba.getColumnTitleForCategory(categorization_type) + ' name';
			columnDef.aTargets = [startOfDurationColIndex - 1];
			break;
		default:
			columnDef.sTitle = key + ' min';
			// The gameplay duration keys are in order, so the index of the parent loop provides the offset from the start of the data,
			columnDef.aTargets = [startOfDurationColIndex + index];
			break;
	}


	return columnDef;
};

/**
 * Returns a column def object for the given JSON key and categorization type for Games Played data
 * (See https://www.datatables.net/usage/columns)
 *
 *
 * @param  {String} key                 [key in the JSON object corresponding to the data]
 * @param  {String} categorization_type
 *
 * @return {Object} columnDef
 *         {
 *         		mData: // Key into the JSON object where the data for the column lives
 *           	sTitle: // Title for the column in the table
 *           	aTargets: // Array with a single integer element, corresponding to the index of the column in the table
 *         }
 */
tba.getColumnDefGamesPlayed = function(key, categorization_type) {
	var columnDef = {
		mData: key
	};

	var sortedDefault = categorization_type == tba.CATEGORIZE_TYPE.DEFAULT;
	var startOfPlayedColIndex = sortedDefault ? 1 : 2;

	switch (key) {
		case categorization_type:
			var suffix = sortedDefault ? '' : ' ID';
			columnDef.sTitle = tba.getColumnTitleForCategory(categorization_type) + suffix;
			columnDef.aTargets = [0]; // The first element
			break;
		case 'entityName':
			columnDef.sTitle = tba.getColumnTitleForCategory(categorization_type) + ' name';
			columnDef.aTargets = [startOfPlayedColIndex - 1];
			break;
		case 'initiated':
			columnDef.sTitle = 'Games Initiated (Not Completed)';
			columnDef.aTargets = [startOfPlayedColIndex + 1];
			break;
		case 'completed':
			columnDef.sTitle = 'Games Completed';
			columnDef.aTargets = [startOfPlayedColIndex + 2];
			break;
		case 'total':
			columnDef.sTitle = 'Total Games Played';
			columnDef.aTargets = [startOfPlayedColIndex];
			break;
	}

	return columnDef;
};

/**
 * Gets the human-readable column title for the table for a given categorization type
 * @param  {String} categorization_type
 *
 * @return {String} column title   			[human-readable column title]
 */
tba.getColumnTitleForCategory = function(categorization_type) {
	switch (categorization_type) {
		case tba.CATEGORIZE_TYPE.DEFAULT:
			var page = tba.getPage();

			if (page == tba.PAGE.AGENT_BUMPS) {
				return 'Agent';
			} else {
				return 'Date';
			}

			break;
		case tba.CATEGORIZE_TYPE.GAME_VERSION:
			return 'Game Version';
			break;
		case tba.CATEGORIZE_TYPE.ROLE:
			return 'Role';
			break;
		case tba.CATEGORIZE_TYPE.SCENARIO:
			return 'Scenario';
			break;
		default:
			return categorization_type;
			break;
	}

};

/**
 * Let's GO!
 */
$(document).ready(function() {
	tba.initInputVars();
	tba.initDatePicker();
	tba.setupHandlers();
	tba.initPage();
});

///////////////////////
// Utility functions //
///////////////////////

/**
 * Gets the identifying part of the URL for the page
 * e.g. /overview/42 gives us 'overview'
 *
 * @return {String}
 */
tba.getPage = function() {
	var page = window.location.pathname.split('/')[1];
	return page;
};

/**
 * Gets the currently chosen start date, as a Moment object
 * @return {Moment} [start date]
 */
tba.getStartDate = function() {
	return tba.startPicker.data('DateTimePicker').getDate();
};

/**
 * Sets the start date for the start picker
 * @param {Moment | Date} start [start date]
 */
tba.setStartDate = function(start_date) {
	tba.startPicker.data('DateTimePicker').setDate(start_date);
};

/**
 * Gets the currently chosen end date, as a Moment object
 * @return {Moment} [end date]
 */
tba.getEndDate = function() {
	return tba.endPicker.data('DateTimePicker').getDate();
};

/**
 * Sets the end date for the end picker
 * @param {Moment | Date} end_date
 */
tba.setEndDate = function(end_date) {
	tba.endPicker.data('DateTimePicker').setDate(end_date);
};

/**
 * Gets the currently chosen categorize option
 * @return {String} [categorize type]
 */
tba.getCategorizeValue = function() {
	return tba.categorizeSelect.val();
};

tba.updateSideMenu = function() {
	// Make the side menu corresponding to the current page active
	$('#side-menu li a').each(function(i, el) {
		var href = $(el).attr('href');
		if (href == window.location.pathname) {
			$(el).addClass('active-menu');
		}
	});
};

/**
 * Download file using Javascript
 * From http://pixelscommander.com/en/javascript/javascript-file-download-ignore-content-type/
 *
 * @param  {[type]} sUrl [description]
 * @return {[type]}      [description]
 */
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
};

window.downloadFile.isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
window.downloadFile.isSafari = navigator.userAgent.toLowerCase().indexOf('safari') > -1;
