
let f1 = document.getElementById("file1"),
	f2 = document.getElementById("file2"),
	f3 = document.getElementById("file3"),
	m  = document.getElementById("movie"),
	b  = document.getElementById("button"),
	files = [],
	movie;

let getFile = function(e, index) {
	let input = e.target;
	console.log(input.files[0].name);
	let reader = new FileReader();
	reader.onload = function(){
		let arrayBuffer = reader.result,
			data = new Uint8Array(arrayBuffer);
		files[index] = {name: input.files[0].name, data: data};
    };
    reader.readAsArrayBuffer(input.files[0]);
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


let startIt = function(files, movie) {
	// ["-i", "explosion.mp3", "-i", "alert.mp3", "-i", "sigh.mp3", "-filter_complex", "[0]adelay=2000|2000[a1];[1]adelay=4000|4000[a];[2]adelay=6000|6000[b];[a1][a][b]amix=3",  "result2.mp3"]
	
	
	let arguments = ["-y"];
	for(let f of files) {
		arguments.push("-i", f.name);
	}
	arguments.push("-i", movie.name);

	//arguments.push("-map", "3:v", "-vcodec", "copy", "results2.webm");
	arguments.push("-filter_complex", "[0]adelay=2000|2000,volume=0.1[a1];[1]adelay=4000|4000[a];[2]adelay=6000|6000[b];[a1][a][b]amix=3[out]", "-map", "3:v", "-map", "[out]:a", "-vcodec", "copy", "-ac", "2", "-strict", "-2", "result2.webm"); // use "results2.wav" for audio only
																																						// "-map", "[out]:a", "-acodec", "vorbis", "-vcodec", "copy", 
																																						// "-vcodec", "libvpx",
																																						// "acodec", "vorbis"

	files.push(movie);
	console.log(arguments)
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

function base64ToArray(base64) {
    var binary_string =  window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array( len );
    for (var i = 0; i < len; i++)        {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
}