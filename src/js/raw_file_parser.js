/*
	define a function that takes replay JSON data as input and returns array of audio event objects as output
	audio event objects look like this:
	{ 
	  event:  	eventName (string, must match one of the predefined event names),
	  volume: 	volume level (float from 0 to 1),
	  onset:  	onset (float, number of milliseconds since beginning of replay)
	}
*/
let parseRawFile = function(replay) {
	console.log('parsing');
	let soundEvents = [];
	replay.clockMS = convertClock(replay.clock);
	soundEvents = soundEvents.concat(getBombEvents(replay));
	soundEvents = soundEvents.concat(getBoostEvents(replay));
	soundEvents = soundEvents.concat(getButtonEvents(replay));
	soundEvents = soundEvents.concat(getCapEvents(replay));
	soundEvents = soundEvents.concat(getCountdownEvents(replay));
	soundEvents = soundEvents.concat(getEndCelebrationEvents(replay));
	soundEvents = soundEvents.concat(getFlagEvents(replay));
	soundEvents = soundEvents.concat(getPopEvents(replay));
	soundEvents = soundEvents.concat(getPortalEvents(replay));
	soundEvents = soundEvents.concat(getPowerupEvents(replay));
	soundEvents = soundEvents.concat(getStartCheerEvents(replay));
	return soundEvents;
}




////////////////////////////////
/////// EVENT EXTRACTORS ///////
////////////////////////////////


///// FLAG FUNCTIONS

/*
	goes through single player object and returns flag state changes (not filtering out caps at this point)
	player: 	player object from replay object
	playerId: 	string, like "player1"
	returns: 	array of objects, each object is like this:
		{
			team: 	number (1 or 2)
			id: 	id of player who grabbed or dropped
			event: 	string ("grab" or "drop")
			frame: 	integer (frame index the state change occured)
		}  
*/
let getFlagEventsPlayer = function(player, playerId) {
	let events = [],
		flag,
		flagArray = player.flag;
	for(let i = 1; i < flagArray.length; i++) {
		flag = flagArray[i];
		if(flag !== null && flagArray[i-1] === null) {
			events.push({
				team: player.team[i],
				id: playerId,
				event: "grab",
				frame: i
			});
		} else if(flag === null && flagArray[i-1] !== null) {
			events.push({
				team : player.team[i],
				id: playerId,
				event: "drop",
				frame: i
			});
		}
	}
	return events;
}

/*
	iterates over all players and calls getFlagEventsPlayer, then combines their results
	replay: 	replay object
	returns: 	array of flag event objects (described in getFlagEventsPlayer description)
*/
let getFlagEventsRaw = function(replay) {
	let events = [],
		players = getPlayers(replay);
	players.forEach(player => events = events.concat(getFlagEventsPlayer(replay[player], player)));
	return events;
}

/*
	For all flag events from getFlagEventsRaw, determine if event is actually a grab/drop
	Then use audioEventLookup to create actual sound events
	replay: 	replay object
	returns: 	array of sound events 
*/
let getFlagEvents = function(replay) {
	let events = getFlagEventsRaw(replay),
		soundEvents = [],
		me = getMe(replay),
		myTeam = replay[me].team;
	events.forEach(event => {
		let soundEventName,
			soundEvent = {};
		if(event.event === "grab") {
			soundEventName = event.team === myTeam[event.frame] ? "friendlyalert" : "alert";
		} else if(replay[event.id].dead[event.frame]) {
			soundEventName = event.team === myTeam[event.frame] ? "friendlydrop" : "drop";
		}
		if(soundEventName) {
			soundEvent = Object.assign({}, audioEventLookup[soundEventName]);
			soundEvent.time = replay.clockMS[event.frame];
			soundEvents.push(soundEvent);
		}
	});
	return soundEvents;
}


///// BOOST FUNCTIONS


/*
	get all boost events, remove events due to viewport, create sound events
	replay: 	replay object
	returns: 	array of sound objects
*/
let getBoostEvents = function(replay) {
	let events = getBoostEventsRaw(replay),
		soundEvents = [],
		me = getMe(replay);
	events.forEach(event => {
		let soundEventName,
			soundEvent = {};
		soundEventName = "burst";
		soundEvent = Object.assign({}, audioEventLookup[soundEventName]);
		soundEvent.time = replay.clockMS[event.frame];
		soundEvents.push(soundEvent);
	})
	return soundEvents;
}


/*
	finds raw boost events for all boost tiles.
	replay: 	replay object
	returns: 	array of raw boost events (described in getBoostEventsTile description)
*/
let getBoostEventsRaw = function(replay) {
	let events = [],
		tiles = getDynamicTiles(replay, [5, 14, 15]);
	tiles.forEach(tile => events = events.concat(getBoostEventsTile(tile, replay)));
	return events;
}


/*
	finds raw boost events for a given tile only if "you" were the closest ball to the 
	boost on the previous frame. 
	tile: 		tile object
	replay: 	replay object
	returns: 	array of raw boost event objects, which each look like this:
		{
			x: x, (in tiles)
			y: y, (in tiles)
			frame: frame index
		}
*/
let getBoostEventsTile = function(tile, replay) {
	let events = [],
		event = {},
		closestBall,
		tileMatches,
		previousDistance;
	for(let i = 1; i < tile.value.length; i++) {
		if(typeof(tile.value[i]) === "string" && typeof(tile.value[i-1]) !== "string") {
			closestBall = findClosestBall(replay, tile.x, tile.y, i-1);
			tileMatches = tile.value[i] < 14 || 
						  (tile.value[i] >= 14 && tile.value[i] < 15 && closestBall.team[i] === 1) ||
						  closestBall.team[i] === 2;
			//previousDistance = getDistance(closestBall.x[i-1], closestBall.y[i-1], tile.x*40, tile.y*40);
			//if(closestBall.me === "me" && tileMatches && previousDistance >= (19+16)) {
			if(closestBall.me === "me" && tileMatches) {
				event = {
							x: tile.x,
							y: tile.y,
							frame: i
						};
				events.push(event);
			}
		}
	}
	return events;
}



///// CHEERING / SIGH / COUNTDOWN FUNCTIONS

/*
	returns sound event object for starting cheer if applicable
	replay: 	replay object
	returns: 	array of sound event objects
*/
let getStartCheerEvents = function(replay) {
	let startFrame = getFrame(replay.gameEndsAt[0], replay.clock),
		soundEvents = [];
	if(startFrame > 0) {
		let soundEvent = Object.assign({}, audioEventLookup["cheer"]);
		soundEvent.time = replay.clockMS[startFrame];
		soundEvents.push(soundEvent);
	}
	return soundEvents;
}


/*
	returns sound event object for ending "celebration" (cheering or sigh) if applicable
	replay: 	replay object
	returns: 	array of sound event objects
*/
let getEndCelebrationEvents = function(replay) {
	if(!replay.gameEndsAt[1]) return [];
	let endTime = new Date(replay.gameEndsAt[1].startTime).getTime() + replay.gameEndsAt[1].time,
		endFrame = getFrame(endTime, replay.clock),
		soundEvents = [];
	if(endFrame > 0) {
		let score = [],
			team = replay[getMe(replay)].team[endFrame],
			otherTeam = team === 1 ? 2 : 1,
			soundEventName,
			soundEvent;
		score[1] = replay.score[endFrame].r;
		score[2] = replay.score[endFrame].b;
		soundEventName = score[team] > score[otherTeam] ? "cheer" : "sigh";
		soundEvent = Object.assign({}, audioEventLookup[soundEventName]);
		soundEvent.time = replay.clockMS[endFrame];
		soundEvents.push(soundEvent);
	}
	return soundEvents;
}


/*
	gets cap sound events
	replay: 	replay object
	returns: 	array of sound event objects
*/
let getCapEvents = function(replay) {
	let score = replay.score,
		soundEvents = [],
		me = replay[getMe(replay)],
		soundEvent,
		soundEventName;
	for(let i = 1; i < score.length; i++) {
		soundEventName = undefined;
		if(score[i].r > score[i-1].r) {
			soundEventName = me.team[i] === 1 ? "cheer" : "sigh";
		} else if(score[i].b > score[i-1].b) {
			soundEventName = me.team[i] === 2 ? "cheer" : "sigh";
		}
		if(soundEventName) {
			soundEvent = Object.assign({}, audioEventLookup[soundEventName]);
			soundEvent.time = replay.clockMS[i];
			soundEvents.push(soundEvent);
		}
	}
	return soundEvents;
}


/*
	get countdown sound events
	replay: 	replay object
	returns: 	array of sound event objects
*/
let getCountdownEvents = function(replay) {
	let soundEvents = [];
	replay.gameEndsAt.forEach(x => {
		let time = x.time ? new Date(x.startTime).getTime() + x.time - 3000 : x - 3000,
			frame = getFrame(time, replay.clock);
		if(frame > 0) {
			let soundEvent = Object.assign({}, audioEventLookup["countdown"]);
			soundEvent.time = replay.clockMS[frame];
			soundEvents.push(soundEvent);
		}
	});
	return soundEvents;
}



///// BOMB FUNCTIONS

/*
	get bomb/rolling bomb/portal explosion sound events
	replay: 	replay object
	returns: 	array of sound event objects
*/
let getBombEvents = function(replay) {
	let soundEvents = [];
	replay.bombs.forEach(bomb => {
		let frame = getFrame(bomb.time, replay.clock),
			soundEventName,
			soundEvent,
			me = replay[getMe(replay)],
			distance = getDistance(me.x[frame], me.y[frame], bomb.x, bomb.y),
			maxDistance;
		switch(bomb.type) {
			case 1: 					// rb
				maxDistance = 5 * 40;
				break;
			case 2: 					// bomb
				maxDistance = 7 * 40;
				break;
			case 3: 					// portal
				maxDistance = 4 * 40;
				break;
			default:
				throw('Unknown bomb event!');
				break;
		}
		if(frame > 0 && distance <= maxDistance) {
			soundEventName = "dynamite";
			soundEvent = Object.assign({}, audioEventLookup[soundEventName]);
			soundEvent.time = replay.clockMS[frame];
			soundEvent.distance = distance;

			soundEvents.push(soundEvent);
		}
	});
	return soundEvents;
}




///// POP FUNCTIONS

/*
	For all pop events from getPopEventsRaw, determine if event should be pop or popOther
	Then use audioEventLookup to create actual sound events
	replay: 	replay object
	returns: 	array of sound events 
*/
let getPopEvents = function(replay) {
	let events = getPopEventsRaw(replay),
		soundEvents = [],
		me = replay[getMe(replay)];
	events.forEach(event => {
		let soundEventName,
			soundEvent = {},
			distance = getDistance(me.x[event.frame], me.y[event.frame], event.x, event.y),
			kill =  distance < 50 && 
					event.team !== me.team[event.frame] && 
					(replay[event.id].flag[event.frame-1] !== null || me.tagpro[event.frame]);
		if(event.me || kill) {
			soundEventName = "pop";
			soundEvent = Object.assign({}, audioEventLookup[soundEventName]);
			soundEvent.time = replay.clockMS[event.frame];
			soundEvents.push(soundEvent);
		}
	});
	return soundEvents;
}


/*
	goes through single player object and returns death state changes
	player: 	player object from replay object
	playerId: 	string, like "player1"
	returns: 	array of objects, each object is like this:
		{
			team: 	number (1 or 2)
			id: 	id of player who grabbed or dropped
			me: 	boolean, whether or not the player who popped is "me"
			x, y: 	pixel coordinates of death
			frame: 	integer (frame index the state change occured)
		}  
*/
let getPopEventsPlayer = function(player, playerId) {
	let events = [],
		deadArray = player.dead;
	for(let i = 1; i < deadArray.length; i++) {
		if(deadArray[i] && !deadArray[i-1]) {
			events.push({
				team: player.team[i],
				id: playerId,
				me: player.me === "me",
				x: player.x[i],
				y: player.y[i],
				frame: i
			});
		}
	}
	return events;
}

/*
	iterates over all players and calls getPopEventsPlayer, then combines their results
	replay: 	replay object
	returns: 	array of pop event objects (described in getPopEventsPlayer description)
*/
let getPopEventsRaw = function(replay) {
	let events = [],
		players = getPlayers(replay);
	players.forEach(player => events = events.concat(getPopEventsPlayer(replay[player], player)));
	return events;
}




///// PORTAL FUNCTIONS


/*
	get all portal events, remove events due to viewport, create sound events
	replay: 	replay object
	returns: 	array of sound objects
*/
let getPortalEvents = function(replay) {
	let events = getPortalEventsRaw(replay),
		soundEvents = [],
		me = replay[getMe(replay)];
	events.forEach(event => {
		let soundEventName,
			soundEvent = {},
			distance;
		if(event.p.me === "me") {
			soundEventName = "portal";
			soundEvent = Object.assign({}, audioEventLookup[soundEventName]);
			soundEvent.time = replay.clockMS[event.frame];
			soundEvents.push(soundEvent);
		}
	});
	return soundEvents;
}


/*
	finds raw portal events for all portal tiles.
	replay: 	replay object
	returns: 	array of raw portal events (described in getPortalEventsTile description)
*/
let getPortalEventsRaw = function(replay) {
	let events = [],
		tiles = getDynamicTiles(replay, [13]);
	tiles.forEach(tile => events = events.concat(getPortalEventsTile(tile, replay)));
	return events;
}


/*
	finds raw portal events for a given tile.
	tile: 		tile object
	replay: 	replay object
	returns: 	array of raw portal event objects, which each look like this:
		{
			x: x, (in tiles)
			y: y, (in tiles)
			p: closest player object (from findClosestBall)
			frame: frame index
		}
*/
let getPortalEventsTile = function(tile, replay) {
	let events = [],
		event = {};
	for(let i = 1; i < tile.value.length; i++) {
		if(typeof(tile.value[i]) === "string" && typeof(tile.value[i-1]) !== "string") {
			event = {
						x: tile.x,
						y: tile.y,
						p: findClosestBall(replay, tile.x, tile.y, i-1),
						frame: i
					};
			events.push(event);
		}
	}
	return events;
}




///// POWERUP FUNCTIONS

/*
	For all powerup events from getPowerupEventsRaw, determine if event should be powerup or powerupOther
	Then use audioEventLookup to create actual sound events
	replay: 	replay object
	returns: 	array of sound events 
*/
let getPowerupEvents = function(replay) {
	let events = getPowerupEventsRaw(replay),
		soundEvents = [],
		me = replay[getMe(replay)];
	events.forEach(event => {
		if(event.frame === 0) return; 
		let soundEventName,
			soundEvent = {},
			distance = 			getDistance(me.x[event.frame], me.y[event.frame], event.x*40, event.y*40),
			previousDistance =  getDistance(me.x[event.frame - 1], me.y[event.frame - 1], event.x*40, event.y*40),
			isInPowerup = distance <= (19 + 15),
			wasInPowerup = distance > (19 + 10); // add some leeway for inaccuracy in TPR's ball locations
		if(isInPowerup && !wasInPowerup){
			soundEventName = "powerup";
			soundEvent = Object.assign({}, audioEventLookup[soundEventName]);
			soundEvent.time = replay.clockMS[event.frame];
			soundEvents.push(soundEvent);
		}
	});
	return soundEvents;
}


/*
	finds raw powerup events for a given tile. this will include "boundary" events caused by tiles coming into viewport
	in a different state than was last seen. those will need to be removed.
	tile: 		tile object
	replay: 	replay object
	returns: 	array of raw portal event objects, which each look like this:
		{
			x: x, (in tiles)
			y: y, (in tiles)
			frame: frame index
		}
*/
let getPowerupEventsTile = function(tile, replay) {
	let events = [],
		event = {};
	for(let i = 1; i < tile.value.length; i++) {
		if(tile.value[i] === 6 && tile.value[i-1] > 6) {
			event = {
						x: tile.x,
						y: tile.y,
						frame: i
					};
			events.push(event);
		}
	}
	return events;
}


/*
	finds raw powerup events for all powerup tiles.
	replay: 	replay object
	returns: 	array of raw powerup events (described in getPowerupEventsTile description)
*/
let getPowerupEventsRaw = function(replay) {
	let events = [],
		tiles = getDynamicTiles(replay, [6]);
	tiles.forEach(tile => events = events.concat(getPowerupEventsTile(tile, replay)));
	return events;
}



///// BUTTON FUNCTIONS

/*
	For all button events from getButtonEventsRaw, determine which "switch" event
	Then use audioEventLookup to create actual sound events
	replay: 	replay object
	returns: 	array of sound events 
*/
let getButtonEvents = function(replay) {
	let events = getButtonEventsRaw(replay),
		soundEvents = [];
	events.forEach(event => {
		let soundEventName,
			soundEvent = {};
		soundEventName = "switch" + event.type;
		soundEvent = Object.assign({}, audioEventLookup[soundEventName]);
		soundEvent.time = replay.clockMS[event.frame];
		soundEvents.push(soundEvent);
	});
	return soundEvents;
}


/*
	finds raw button events for a given tile. this will include offscreen events, those will need to be removed.
	tile: 		tile object
	replay: 	replay object
	returns: 	array of raw button event objects, which each look like this:
		{
			x: x, (in tiles)
			y: y, (in tiles)
			type: string ("On" or "Off")
			frame: frame index
		}
*/
let getButtonEventsTile = function(tile, replay) {
	let events = [],
		event,
		me = replay[getMe(replay)],
		type,
		current,
		previous = isBallOnButton(me.x[0], me.y[0], tile.x*40, tile.y*40);
	for(let i = 1; i < replay.clock.length; i++) {
		current = isBallOnButton(me.x[i], me.y[i], tile.x*40, tile.y*40);
		if(current === previous) continue;
		type = current ? "On" : "Off";
		events.push({
			x: tile.x,
			y: tile.y,
			type: type,
			frame: i
		});
		previous = current;
	};
	return events;
}


/*
	finds raw button events for all button tiles.
	replay: 	replay object
	returns: 	array of raw button events (described in getButtonEventsTile description)
*/
let getButtonEventsRaw = function(replay) {
	let events = [],
		tiles = getMapCoords(replay, 8);
	tiles.forEach(tile => events = events.concat(getButtonEventsTile(tile, replay)));
	return events;
}




///////////////////////////////
////// HELPER FUNCTIONS ///////
///////////////////////////////

/* 
	Convert single date string to milliseconds
	datestring: single date string
	offset: 	gets subtracted from milliseconds
	returns: 	integer epoch milliseconds
*/
let convertDate = function(datestring, offset=0) {
	return new Date(datestring).getTime() - offset;
}


/*
	converts raw file's clock to milliseconds
	clock: 		replay file's clock array
	returns: 	an array of milliseconds, with first value always equaling zero
*/
let convertClock = function(clock) {
	let first = convertDate(clock[0]);
	return clock.map(datestring => convertDate(datestring, first));
}


/*
	finds the ball closest to a given location at a given frame
	replay: 	replay object
	x: 			x TILE coordinate
	y: 			y TILE coordinate
	frame: 		integer frame index
	returns: 	player object for closest ball
*/
let findClosestBall = function(replay, x, y, frame) {
	let players = getPlayers(replay),
		minDist = Infinity,
		dist,
		closestPlayer,
		p;
	players.forEach(player => {
		p = replay[player];
		dist = getDistance(p.x[frame], p.y[frame], x*40, y*40);
		if(dist < minDist) {
			closestPlayer = p;
			minDist = dist;
		}
	});
	return closestPlayer;
}


/*
	gets distance between two points
	x1, y1, x2, y2: 	pixel coordinates for the two points
	returns: 			Euclidean distance in pixels
*/
let getDistance = function(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}


/*
	extracts floor (dynamic) tile objects given the tile code
	replay: 	replay object
	codes: 		array of integers, tile codes to find
	returns: 	array of tile objects
*/
let getDynamicTiles = function(replay, codes) {
	let tiles = [];
	codes.forEach(code => {
		tiles = tiles.concat(replay.floorTiles.filter(tile => tile.value[0] >= code && tile.value[0] < (code + 1)));
	})
	return tiles;
}


/*
	gets frame index for closest frame after a given timestamp
	timestamp: 	date string
	clock: 		replay's clock array
	returns: 	an index integer, returns -1 if timestamp is either before first frame or after last frame.
*/
let getFrame = function(timestamp, clock) {
	let time = new Date(timestamp);
	if(time < new Date(clock[0])) return -1;
	for(let i = 1; i < clock.length; i++) {
		if(time < new Date(clock[i])) return i;
	}
	return -1;
}


/* 
	get object key for "me" player
	replay: 	replay object
	returns: 	string representing key of "me" player
*/
let getMe = function(replay) {
	let me;
	getPlayers(replay).forEach(player => { 
		if(replay[player].me === "me") me = player
	});
	return(me);
}


/*
	returns player id strings in replay object
	replay: 	replay object
	returns: 	array of player id strings
*/
let getPlayers = function(replay) {
	return Object.keys(replay).filter(key => key.match("^player"));
}


/*
	returns array of objects representing locations of 
	requested tile type from replay.map object, like this:
		{
			x: x (in tiles)
			y: y (in tiles)
		}
	replay: 	replay object
	tile: 		integer tile value
	returns: 	array of tile coordinate objects
*/
let getMapCoords = function(replay, tile) {
	let tiles = [];
	for(let x = 0; x < replay.map.length; x++) {
		for(let y = 0; y < replay.map[0].length; y++) {
			if(replay.map[x][y] === tile) tiles.push({x:x, y:y});
		}
	}
	return tiles;
}


/*
	determines if a ball is touching a button
	x, y, buttonx, buttony: 	pixel coordinates of ball and button, respectively
	returns: 					boolean, whether or not the ball is touching the button
*/
let isBallOnButton = function(x, y, buttonx, buttony) {
	let distance = getDistance(x, y, buttonx, buttony);
	return distance < 19 + 8; // radius of ball plus radius of button
}


/*
	Determines if a coordinate is within view or not at a given frame
	It is very conservative, using these parameters: 
		vertical threshold of 400 pixels / 10 tiles
		horizontal threshold of 680 pixels / 17 tiles
	me: 		player object representing "me"
	x, y: 		pixel coordinates
	frame: 		frame index
	returns: 	boolean
*/
let inViewport = function(me, x, y, frame) {
	let xthresh = 600,
		ythresh = 380;
	return Math.abs(me.x[frame] - x) < xthresh && Math.abs(me.y[frame] - y) < ythresh;
}


///////////////////
////// DATA ///////
///////////////////

/*
	Lookup object for audio event types
	This can probably be done away with now that things were simplified so much. 
*/
	let audioEventLookup = {
		alert:					{ sound: "alert", 			volume: 0.25,	scale: false },
		burst:					{ sound: "burst", 			volume: 1, 		scale: false },
		cheer:					{ sound: "cheering", 		volume: 1, 		scale: false },
		countdown:				{ sound: "countdown", 		volume: 1, 		scale: false },
		degreeup:				{ sound: "degreeup", 		volume: 1, 		scale: false },
		drop:					{ sound: "drop", 			volume: 1, 		scale: false },
		dynamite:				{ sound: "explosion", 		volume: 1, 		scale: true  },
		friendlyalert:			{ sound: "friendlyalert", 	volume: 0.5, 	scale: false },
		friendlydrop:			{ sound: "friendlydrop", 	volume: 1, 		scale: false },
		pop:					{ sound: "pop", 			volume: 1, 		scale: false },
		portal:					{ sound: "teleport", 		volume: 1, 		scale: false },
		powerup:				{ sound: "powerup", 		volume: 1, 		scale: false },
		sigh:					{ sound: "sigh", 			volume: 0.75, 	scale: false },
		switchOff:				{ sound: "click", 			volume: 0.2, 	scale: false },
		switchOn:				{ sound: "click", 			volume: 0.5, 	scale: false },
	};



