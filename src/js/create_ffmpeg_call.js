


//////////////////////////////////
////// FILE LIST FUNCTIONS ///////
//////////////////////////////////

/*
	creates array of files to be used in call to ffmpeg
	eventObject: 	ffmpeg sound event object from createFfmpegObject()
	movieObject: 	movie object from ?, leave out if no movie
	returns: 		array of file objects like this:
					{
						name: file name (string)
						data: data (Uint8Array)
					}
*/
let createFileArray = function(eventObject, movieObject) {
	let files = [],
		file;
	eventObject.sounds.forEach(sound => {
		file = Object.assign({}, soundObjectLookup[sound.name]);
		files.push({name: file.file, data: file.data});
	});
	if(movieObject) files.push(movieObject);
	return files;
}




/////////////////////////////////
////// ARGUMENT FUNCTIONS ///////
/////////////////////////////////

/*
	creates the full ffmpeg argument array
	inputs: 		array of input strings from createFfmpegInputArgument()
	audioArgument: 	audio portion of the argument from createFfmpegAudioArgument()
	numSounds: 		total number of audio sound files used
	filename: 		output filename for the final product
	movieObject: 	movie object from ?
	returns: 		array, argument array for the call to ffmpeg_run
*/
let combineFfmpegArgument = function(inputs, audioArgument, numSounds, filename, movieObject) {
	let args = [];
	args = args.concat(inputs);
	args.push("-filter_complex", audioArgument);
	if(movieObject) args.push("-map", numSounds+":v", "-vcodec", "copy");
	args.push("-map", "[out]:a", "-ac", "2", "-strict", "-2", filename);
	return args;
}



/*
	takes a ffmpeg sound event object from createFfmpegObject() and a movie object from ?
	and creates the inputs section of the ffmpeg arguments array
	eventObject: 	ffmpeg sound event object
	movieObject: 	movie object
	returns: 		array of strings representing the first, input section of ffmpeg arguments
*/
let createFfmpegInputArgument = function(eventObject, movieObject) {
	let args = ["-y"];
	eventObject.sounds.forEach(sound => {
		args.push("-i", sound.file);
	});
	if(movieObject) args.push("-i", movieObject.name);
	return args;
}


/*
	takes a ffmpeg sound event object from createFfmpegObject() and creates the audio section of 
	an ffmpeg argument
	eventObject: 	ffmpeg sound event object
	returns: 		argument array of strings 
*/
let createFfmpegAudioArgument = function(eventObject) {
	let argument = "",
		outputs = "",
		eventN = 0;
	for(let i = 0; i < eventObject.events.length; i++) {
		eventObject.events[i].forEach(e => {
			argument += "[" + i + "]adelay=" + e.time + "|" + e.time + ",volume=" + e.volume + "[a" + eventN + "];";
			outputs += "[a" + eventN + "]";
			eventN++;
		});
	}
	argument += outputs + "amix=" + eventObject.numEvents + "[out]";
	return argument;
}



/*
	takes array of sound event objects from parseRawFile() and creates new object
	that can more easily be used to create ffmpeg call
	events: 	array of sound event objects
	returns: 	object like the following:
		{
			sounds: 	array of objects, containing objects like { 
																	name: 	string name of sound, 
																	file: 	string name of audio file? 
																	data: 	Uint8Array of sound's data
																  }
			events: 	array of arrays of objects, containing objects like {
																	time: 		milliseconds to delay sound
																	volume: 	actual volume to play sound at
																  }
			numEvents: 	total number of events
			numSounds: 	total number of unique sound files used
		}
*/
let createFfmpegObject = function(events) {
	let output = {},
		sounds = [],
		soundEvents = [],
		numEvents = 0;
	if(events.length === 0) return output;

	events.forEach(event => {
		let soundIndex = getSoundIndex(event.sound, sounds);
		if(soundIndex < 0) {
			soundIndex = sounds.length;
			sounds[soundIndex] = Object.assign({}, soundObjectLookup[event.sound]);
			soundEvents[soundIndex] = [];
		}
		ffmpegEvent = createFfmpegEvent(event);
		soundEvents[soundIndex].push(ffmpegEvent);
		numEvents++;
	});
	return {
		sounds: sounds,
		events: soundEvents,
		numEvents: numEvents,
		numSounds: sounds.length
	}
}


//////////////////////////////
////// HELPER FUNCTIONS //////
//////////////////////////////

/*
	finds index of a sound in the "sounds" array used in createFfmpegArray()
	sound: 		string name of sound
	sounds: 	sounds array of objects
	returns: 	integer index of sound in sounds array, or -1 if sound is not found
*/
let getSoundIndex = function(sound, sounds) {
	let index = -1;
	for(let i = 0; i < sounds.length; i++) {
		if(sounds[i].name === sound) return i;
	}
	return index;
}


/*
	takes a sound event from parseRawFile() output and creates an ffmpeg sound event like this:
		{
			time: 		milliseconds to delay the sound
			volume: 	volume to play sound at (factors distance into calculation if appropriate)
		}
	event: 		individual event object from parseRawFile()
	returns: 	an ffmpeg sound event
*/
let createFfmpegEvent = function(event) {
	if(event.scale) event.volume = scaleVolume(event.volume, event.distance);
	return {
		time: event.time,
		volume: event.volume
	}
}


/*
	scales volume based on distance from source
	volume: 	baseline volume, float between 0 and 1
	distance: 	distance in pixels from the source of the sound
	returns: 	new volume, float between 0 and 1
*/
let scaleVolume = function(volume, distance) {
	let maxDistance = 280,
		scaleFactor = 1;
	if(distance <= 0) return volume;
	if(distance > maxDistance) return 0;
	scaleFactor = 1 - (distance/maxDistance);
	return volume * scaleFactor;
}


///////////////////
////// DATA ///////
///////////////////

/*
	TODO:
	Lookup object for sound objects (placeholder. need to write function to dynamically populate this)
*/
let soundObjectLookup = {
		alert:					{ name: "alert", 			file: "alert.mp3",			data: 	new Uint8Array() },
		burst:					{ name: "burst", 			file: "burst.mp3", 			data: 	new Uint8Array() },
		cheering:				{ name: "cheering", 		file: "cheering.mp3", 		data: 	new Uint8Array() },
		click:					{ name: "click", 			file: "click.mp3", 			data: 	new Uint8Array() },
		countdown:				{ name: "countdown", 		file: "countdown.mp3", 		data: 	new Uint8Array() },
		degreeup:				{ name: "degreeup", 		file: "degreeup.mp3", 		data: 	new Uint8Array() },
		drop:					{ name: "drop", 			file: "drop.mp3", 			data: 	new Uint8Array() },
		explosion:				{ name: "explosion", 		file: "explosion.mp3", 		data: 	new Uint8Array() },
		friendlyalert:			{ name: "friendlyalert", 	file: "friendlyalert.mp3", 	data: 	new Uint8Array() },
		friendlydrop:			{ name: "friendlydrop", 	file: "friendlydrop.mp3", 	data: 	new Uint8Array() },
		pop:					{ name: "pop", 				file: "pop.mp3", 			data: 	new Uint8Array() },
		powerup:				{ name: "powerup", 			file: "powerup.mp3", 		data: 	new Uint8Array() },
		sigh:					{ name: "sigh", 			file: "sigh.mp3", 			data: 	new Uint8Array() },
		teleport:				{ name: "teleport", 		file: "teleport.mp3", 		data: 	new Uint8Array() }
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
		oReq.open("GET", "/sounds/" + sound.file);
		oReq.responseType = "arraybuffer";
		oReq.send();
	}
	sound = soundObjectLookup[keys[i]];
	oReq.open("GET", "/sounds/" + sound.file);
	oReq.responseType = "arraybuffer";
	oReq.send();
}

getSoundFileContents(soundObjectLookup);


