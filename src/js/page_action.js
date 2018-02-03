

let allFiles = {};
let unmatchedFiles = {raw: [], ren: []};
let MaxRam;


$('#file-upload').on("change", getFileList);
$('#upload-button').click(() => $('#file-upload').click());
$('#ram-chooser').spinner();
chrome.storage.local.get('MaxRam', res => {
	MaxRam = res.MaxRam;
	if(!MaxRam) {
		MaxRam = 1024;
		chrome.storage.local.set({MaxRam: MaxRam});
	}
	$('#ram-chooser').spinner("value", MaxRam);
});
$('#options-dialog').dialog({
	autoOpen: false,
	dialogClass: "no-close",
	modal: true,
	buttons: [
		{
			text: "Save",
			click: function() {
				MaxRam = $('#ram-chooser').spinner("value");
				chrome.storage.local.set({MaxRam: MaxRam}, () => { console.log("Set maximum ram to " + MaxRam)});
				$( this ).dialog( "close" );
			}
		},
		{
			text: "Close",
			click: function() {
				$( this ).dialog( "close" );
			}
	    }
  	]
})
$('#options-button').click(() => $('#options-dialog').dialog('open'));
makeDraggable();