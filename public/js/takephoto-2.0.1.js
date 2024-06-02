var widthC = null;
var heightC = null;
var ratioC = null;
var orientationC = null;
var streaming = false;
var videoC = null;
var canvasC = null;
var photoC = null;
var startbutton = null;

function photo_start() {
	videoC = document.getElementById("videoC");
	canvasC = document.getElementById("canvasC");
	photoC = document.getElementById("photoC");
	startbutton = document.getElementById("startbutton");

	if (!widthC || !heightC || !ratioC) {
	photo_get_dimensions();
	}

	video_constraints = {
	video: {
		width: { min: 1024, ideal: 1280, max: 2560 },
		height: { min: 576, ideal: 720, max: 1440 },
		facingMode: { ideal: "environment" },
		aspectRatio: ratioC,
	},
	audio: false,
	};

	navigator.mediaDevices
	.getUserMedia(video_constraints)
	.then(function (stream) {
		videoC.srcObject = stream;
		videoC.play();
	})
	.catch(function (err) {
		console.log("An error occurred: " + err);
	});
}

function photo_reset() {
	photo_stop();
	photo_start();
}

function photo_clear_picture() {
	var context = canvasC.getContext("2d");
	context.fillStyle = "#AAA";
	context.fillRect(0, 0, canvasC.width, canvasC.height);

	var data = canvasC.toDataURL("image/jpeg");
	photoC.setAttribute("src", data);
	photoC.style.display = "none";
}

function photo_hide_camera() {
	photo_stop();
	document.getElementById("camera").style.display = "none";
	document.getElementById("output").style.display = "block";
	document.getElementById("output-options").style.display = "block";
}

function photo_show_camera() {
	document.getElementById("output").style.display = "none";
	document.getElementById("output-options").style.display = "none";
	document.getElementById("camera").style.display = "block";
	photo_start();
}

function photo_take_picture() {
	var context = canvasC.getContext("2d");
	if (widthC && heightC) {
	canvasC.width = widthC;
	canvasC.height = heightC;
	context.drawImage(videoC, 0, 0, widthC, heightC);
	var data = canvasC.toDataURL("image/jpeg");
	photoC.setAttribute("src", data);
	photoC.style.display = "block";
	} else {
	photo_clear_picture();
	}
	exit_fullscreen();
	photo_hide_camera();
}

function photo_stop() {
	stream = document.getElementById("videoC").srcObject;
	if (stream) {
	tracks = videoC.srcObject.getTracks();
	tracks.forEach(function (track) {
		track.stop();
	});
	}
	streaming = false;
}

function photo_get_dimensions() {
	if (screen && screen.orientation) {
	if (screen.orientation.type.indexOf("portrait") === 0) {
		orientationC = "portrait";
		widthC = 720;
		heightC = 1280;
		ratioC = widthC / heightC;
	} else {
		orientationC = "landscape";
		widthC = 1280;
		heightC = 720;
		ratioC = widthC / heightC;
	}
	} else {
	if (window.innerHeight > window.innerWidth) {
		orientationC = "portrait";
		widthC = 720;
		heightC = 1280;
		ratioC = widthC / heightC;
	} else {
		orientationC = "landscape";
		widthC = 1280;
		heightC = 720;
		ratioC = widthC / heightC;
	}
	}
	if (videoC) {
	videoC.setAttribute("width", widthC);
	videoC.setAttribute("height", heightC);
	}
	if (canvasC) {
	canvasC.setAttribute("width", widthC);
	canvasC.setAttribute("height", heightC);
	}
	//document.getElementById("caminfos").innerText = orientationC + " " + "(" + widthC + "x" + heightC + ")";
}

if (screen && screen.orientation) {
	screen.orientation.addEventListener("change", (event) => {
	photo_get_dimensions();
	photo_reset();
	});
} else {
	window.addEventListener("orientationchange", function () {
	photo_get_dimensions();
	photo_reset();
	});
}
