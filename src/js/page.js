



let f = document.getElementById("file"),
	m = document.getElementById("movie"),
	b = document.getElementById("button"),
	raw,
	movie;

let getFile = function(e) {
	let input = e.target;
	console.log(input.files[0].name);
	let reader = new FileReader();
	reader.onload = function(){
		raw = JSON.parse(reader.result);
    };
    reader.readAsText(input.files[0]);
};

let getMovie = function(e) {
	let input = e.target;
	console.log(input.files[0].name);
	let reader = new FileReader();
	reader.onload = function() {
		let arrayBuffer = reader.result,
			data = new Uint8Array(arrayBuffer);
		movie = {name: input.files[0].name, data: data};
	}
	reader.readAsArrayBuffer(input.files[0]);
}



/*
	get file contents for sound files
	soundObjectLookup: 	soundObjectLookup object
	returns: nothing, it updates contents of the input object
*/
let getSoundFileContents = function(soundObjectLookup) {
	let sound,
		oReq,
		i = 0,
		keys = Object.keys(soundObjectLookup);
	oReq = new XMLHttpRequest();
	oReq.onload = function(e) {
		soundObjectLookup[keys[i]].data = new Uint8Array(oReq.response);
		i++;
		if(i >= keys.length) return;
		sound = soundObjectLookup[keys[i]];
		oReq.open("GET", "./sounds/" + sound.file);
		oReq.responseType = "arraybuffer";
		oReq.send();
	}
	sound = soundObjectLookup[keys[i]];
	oReq.open("GET", "./sounds/" + sound.file);
	oReq.responseType = "arraybuffer";
	oReq.send();
}

getSoundFileContents(soundObjectLookup);


let doIt = function(raw, movie) {
	let rawSounds = parseRawFile(raw),
		sounds = createFfmpegObject(rawSounds),
		audioArgument = createFfmpegAudioArgument(sounds),
		inputs = createFfmpegInputArgument(sounds, movie),
		arguments = combineFfmpegArgument(inputs, audioArgument, sounds.numSounds, "out.webm", movie),
		files = createFileArray(sounds, movie);

	console.log(raw);
	console.log(movie);
	console.log(rawSounds);
	console.log(sounds);
	console.log(arguments);
	console.log(files);
	let result = ffmpeg_run({files: files, arguments: arguments, TOTAL_MEMORY: 1024*1024*1024});
	console.log(result);
	window.result = result;
	let blob = new Blob([result[0].data], {type: "video/webm"});
	let bloburl = URL.createObjectURL(blob);
	let link = document.createElement("a"); 
	link.href = bloburl;
	link.download = result[0].name;
	link.click();
}


