


let getRaw = function(rawFile) {
	return new Promise(function(resolve, reject) {
		let reader = new FileReader();
		reader.onload = function(){
			resolve(JSON.parse(reader.result));
	    };
	    reader.readAsText(rawFile);
	});
};

let getMovie = function(movieFile) {
	return new Promise(function(resolve, reject) {
		let reader = new FileReader();
		reader.onload = function() {
			let arrayBuffer = reader.result,
				data = new Uint8Array(arrayBuffer);
			resolve({name: movieFile.name, data: data});
		}
		reader.readAsArrayBuffer(movieFile);
	})
}


let runFfmpeg = function(rawFile, movieFile) {
	let rawPromise = getRaw(rawFile),
		moviePromise = getMovie(movieFile);

	return Promise.all([rawPromise, moviePromise]).then(values => {
		let raw = values[0],
			movie = values[1],
			rawSounds = parseRawFile(raw),
			sounds = createFfmpegObject(rawSounds),
			audioArgument = createFfmpegAudioArgument(sounds),
			inputs = createFfmpegInputArgument(sounds, movie),
			outputName = movie.name.replace('.webm', '_sound.webm'),
			arguments = combineFfmpegArgument(inputs, audioArgument, sounds.numSounds, outputName, movie),
			files = createFileArray(sounds, movie);

		let RamToUse = MaxRam || 1024;

		let result = ffmpeg_run({files: files, arguments: arguments, TOTAL_MEMORY: RamToUse*1024*1024}),
			resultFile = new File([result[0].data], result[0].name, {type: "video/webm"});
		console.log(resultFile);
		saveAs(resultFile, outputName);
	});
}
