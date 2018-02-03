

/*
	starts the process of adding sound to the replay when the download button is clicked
	returns: nothing
*/
let clickDownload = function() {
	let tr = $(this).closest('tr'),
		ren = $(tr).find('td.ren'),
		raw = $(tr).find('td.raw');
	console.log([ren, raw]);
}

/*
	takes two unmatched files and add them to the matched files list and table
	recipient: 	dom element that was dropped on
	dropped: 	dom element that was dropped
	returns: 	nothing, adds new element to matchedFiles array
*/
let matchFilesUser = function(recipient, dropped) {
	let newMatch = {};
	if(recipient.classList.contains('uren')) {
		newMatch.ren = {name: recipient.getAttribute('name'), 	data: recipient.getAttribute('data')};
		newMatch.raw = {name: dropped.getAttribute('name'), 	data: dropped.getAttribute('data') 	};
	} else {
		newMatch.ren = {name: dropped.getAttribute('name'), 	data: dropped.getAttribute('data') 	};
		newMatch.raw = {name: recipient.getAttribute('name'), 	data: recipient.getAttribute('data')};
	}
	matchedFiles.push(newMatch);
	$(recipient).closest('tr').remove();
	$(dropped).closest('tr').remove();

	if($('#unmatched-raw tr').length === 1 && $('#unmatched-ren tr').length === 1) {
		$('#unmatched-container').css('display', 'none');
	} 
	addMatch(newMatch);
}

/*
	adds a matched file pair to the matched file table
	newMatch: 	object like this:
		{
			ren: rendered file object: {name: string, data: File object}
			raw: raw file object: {name: string, data: File object}
		}
	returns: nothing, adds new table row to matched file table
*/
let addMatch = function(newMatch) {
	let matchedTable = $('#match-table'),
		ren = newMatch.ren,
		raw = newMatch.raw,
		renTd = $(`<td class="ren">${ren.name}</td>`),
		rawTd = $(`<td class="raw">${raw.name}</td>`),
		button = $('<button>Download</button>'),
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
}


let matchedFiles = [];
let unmatchedFiles = {raw: [], ren: []};


$('#upload-button').click(() => $('#file-upload').click());

$(function() {

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

});


