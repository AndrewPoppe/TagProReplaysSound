


/*
	starts the process of adding sound to the replay when the download button is clicked
	returns: nothing
*/
let clickDownload = function() {
	let tr = $(this).closest('tr'),
		renO = $(tr).find('td.ren'),
		rawO = $(tr).find('td.raw'),
		ren = allFiles[renO[0].getAttribute('name')],
		raw = allFiles[rawO[0].getAttribute('name')];
	
	markAsInProgress(this);
	runFfmpeg(raw, ren).then(() => {
		tr.remove();
		checkTables();
	});
}


/*
	takes two unmatched files and add them to the matched files list and table
	recipient: 	dom element that was dropped on
	dropped: 	dom element that was dropped
	returns: 	nothing, adds new element to matchedFiles array
*/
let matchFilesUser = function(recipient, dropped) {
	let newMatch = {},
		ren,
		raw;
	if(recipient.classList.contains('uren')) {
		ren = recipient;
		raw = dropped;
	} else {
		raw = recipient;
		ren = dropped;
	}
	newMatch.ren = {name: ren.getAttribute('name'), data: ren.getAttribute('data')};
	newMatch.raw = {name: raw.getAttribute('name'), data: raw.getAttribute('data')};

	unmatchedFiles.ren.forEach((uren, i) => ren.getAttribute('name') === uren.name && unmatchedFiles.ren.splice(i, 1));
	unmatchedFiles.raw.forEach((uraw, i) => raw.getAttribute('name') === uraw.name && unmatchedFiles.raw.splice(i, 1));

	//matchedFiles.push(newMatch);
	$(recipient).closest('tr').remove();
	$(dropped).closest('tr').remove();

	addMatch(newMatch);
	checkTables();
}


/*
	adds a matched file pair to the matched file table
	newMatch: 	object like this:
		{
			ren: rendered file object
			raw: raw file object
		}
	returns: nothing, adds new table row to matched file table
*/
let addMatch = function(newMatch) {
	let matchedTable = $('#match-table'),
		ren = newMatch.ren,
		raw = newMatch.raw,
		renTd = $(`<td class="ren">${ren.name}</td>`),
		rawTd = $(`<td class="raw">${raw.name}</td>`),
		button = $('<button><span class="ui-icon ui-icon-arrowthickstop-1-s"></span></button>'),
		buttonTd,
		newTr = $('<tr>'),
		result;
	renTd[0].setAttribute('data', ren.data);
	renTd[0].setAttribute('name', ren.name);
	rawTd[0].setAttribute('data', raw.data);
	rawTd[0].setAttribute('name', raw.name);
	button.on('click', clickDownload);
	buttonTd = $('<td>').append(button);
	result = newTr.append(rawTd, renTd, buttonTd);
	matchedTable.append(result);
	$('#matched-container').css('display', 'block');
}


/*
	adds unmatched files to unmatched file table
	unmatchedFiles: 	global object with unmatched file objects
	returns: 			nothing
*/
let addUnmatched = function() {
	let unmatchedTableRaw = $('#unmatched-raw'),
		unmatchedTableRen = $('#unmatched-ren');
	
	unmatchedTableRen.find('.draggable').closest('tr').remove();
	unmatchedFiles.ren.forEach((uren, i)  => {
		let tr = $('<tr>'),
			td = $(`<td class="uren draggable droppable" name=${uren.name}>${uren.name}</td>`),
			result;
		td[0].setAttribute('name', uren.name);
		td[0].setAttribute('index', i);
		unmatchedTableRen.append(tr.append(td));
		$('#unmatched-container').css('display', 'block');
	});
	
	unmatchedTableRaw.find('.draggable').closest('tr').remove();
	unmatchedFiles.raw.forEach((uraw, i)  => {
		let tr = $('<tr>'),
			td = $(`<td class="uraw draggable droppable" name=${uraw.name}>${uraw.name}</td>`),
			result;
		td[0].setAttribute('name', uraw.name);
		td[0].setAttribute('index', i);
		unmatchedTableRaw.append(tr.append(td));
		$('#unmatched-container').css('display', 'block');
	});
}


/*
	handler for file loader 
	e: 			file selection event
	returns: 	nothing
*/
let getFileList = function(e) {
	let files = e.target.files,
		raw, ren, 
		fileList = [];
	if (files.length > 0) {
		for(let f of files) {
			fileList.push(f);
			allFiles[f.name] = f;
		}
		raw = fileList.filter(file => file.name.match(".txt$"));
		ren = fileList.filter(file => file.name.match(".webm$"));
		unmatchedFiles.ren = unmatchedFiles.ren.concat(ren);
		unmatchedFiles.raw = unmatchedFiles.raw.concat(raw);
		matchFiles();
		addUnmatched();
		makeDraggable();
	}
}


/*
	tries to match up ren and raw files in the unmatchedFiles object
		if it finds matches, it removes the files from unmatchedFiles and
		adds them to matchedFiles.
		It adds any new matches to the matched files dom table, and adds
		remaining unmatched files to the unmatched tables
	returns: 			nothing
*/
let matchFiles = function() {
	let rawsToRemove = [],
		rensToRemove = [];
	unmatchedFiles.raw.forEach((uraw, rawi) => {
		let rawName = uraw.name.replace(/DATE.+/, '');
		unmatchedFiles.ren.forEach((uren, reni) => {
			if(uren.name.replace(/\.webm$/, '') === rawName) {
				rawsToRemove.push(rawi);
				rensToRemove.push(reni);
				//matchedFiles.push({ren: uren, raw: uraw});
				addMatch({ren: uren, raw: uraw});
			}
		});
	});
	rawsToRemove.sort((a, b) => {return b > a});
	rensToRemove.sort((a, b) => {return b > a});
	rawsToRemove.forEach(i => unmatchedFiles.raw.splice(i, 1));
	rensToRemove.forEach(i => unmatchedFiles.ren.splice(i, 1));
	checkTables();
}


/*
	Makes all unmatched table rows draggable/droppable
*/
let makeDraggable = function() {
	$('.draggable').draggable({ containment: "#unmatched-div", 
								scroll: false, 
								cursor: "move",
								revert: true
							 });

	$('.uraw.draggable').droppable({
		accept: ".uren.draggable",
		drop: function(event, ui) {
			matchFilesUser(this, ui.draggable[0]);
		}
	});

	$('.uren.draggable').droppable({
		accept: ".uraw.draggable",
		drop: function(event, ui) {
			matchFilesUser(this, ui.draggable[0]);
		}
	});	
}


/*
	replace input with a text element that says "in progress"
*/
let markAsInProgress = function(el) {
	let parent = $(el).parent(),
		prog = $('<span style="color:#339933">In Progress</span>');
	console.log(parent);
	el.remove();
	$(parent).append(prog);
}


/*
	checks file tables and hides them if they're empty
*/
let checkTables = function() {
	if($('#unmatched-raw td.draggable').length === 0 && $('#unmatched-ren td.draggable').length === 0) {
		$('#unmatched-container').css('display', 'none');
	}
	if($('#match-table tr').length === 1) $('#matched-container').css('display', 'none');
}

