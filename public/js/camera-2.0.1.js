var socket = io.connect();

var screen_code = "";

var fullscreen = false;

var link = null;

socket.on("message", function (message) {
	alert("Le serveur a un message pour vous : " + message);
});

const divconnect = document.getElementById("connect");
const divshot = document.getElementById("shot");
const divgallery = document.getElementById("gallery");
const fileInput = document.getElementById("inputimg");
const imgElement = document.getElementById("image");
const codeInput = document.getElementById("C2C-code");
const statusElement = document.getElementById("status");

divconnect.style.display = "inline-block";
divshot.style.display = "none";
divgallery.style.display = "none";

function debug_hack() {
	if (debug) {
	divconnect.style.display = "none";
	divshot.style.display = "block";
	photo_start();
	}
}

debug_hack();

// When user prompt screen code
function promptcode() {
	let code = prompt("Entrez le code de diffusion :");
	joinscreen(code);
}

// When app receive a code, send it to server
function joinscreen(code) {
	if (code !== "" && code != null) {
	socket.emit("connect_screen", code);
	}
}

function log_screens() {
	socket.emit("wait_log");
}

function save_last_screen(code) {
	localStorage.setItem("C2C_last_screen", code);
	localStorage.setItem("C2C_last_socketId", socket.id);
}

function clear_last_screen() {
	localStorage.removeItem("C2C_last_screen");
	localStorage.removeItem("C2C_last_socketId");
}

function try_reconnect_last_screen() {
	let last_screen = localStorage.getItem("C2C_last_screen");
	let last_socketId = localStorage.getItem("C2C_last_socketId");
	if (last_screen && last_socketId) {
	socket.emit("reconnect_screen", last_screen, last_socketId);
	}
}

function exit_fullscreen() {
	if (fullscreen) {
	fullscreen = false;
	document.exitFullscreen();
	}
}

function toggle_fullscreen() {
	if (!fullscreen) {
	fullscreen = true;
	document.getElementById("camera").requestFullscreen();
	} else {
	fullscreen = false;
	document.exitFullscreen();
	}
}

function download_photo() {
	jpgUrl = document.getElementById("photoC").src;
	var downloadLink = document.createElement("a");
	downloadLink.href = jpgUrl;
	downloadLink.download = "photo.jpg";
	document.body.appendChild(downloadLink);
	downloadLink.click();
	document.body.removeChild(downloadLink);
}

function retake_photo() {
	photo_show_camera();
}

function send_photo() {
	let img = document.getElementById("photoC");
	if (img) {
	socket.emit(
		"newshot",
		screen_code,
		img.src,
		img.naturalWidth,
		img.naturalHeight
	);
	}
	photo_show_camera();
}

fileInput.addEventListener("change", (e) => {
	const file = e.target.files[0];
	const reader = new FileReader();
	reader.onloadend = () => {
	document.getElementById("photoC").src = reader.result;
	photoC.style.display = "block";
	photo_hide_camera();
	//socket.emit('newshot', link, reader.result);
	};
	reader.readAsDataURL(file);
	fileInput.value = null;
});

function reset_interface() {
	photo_show_camera();
	photo_stop();
	scan_stop();
	divconnect.style.display = "inline-block";
	divshot.style.display = "none";
	statusElement.innerHTML = "(non connecté)";
	clear_last_screen();
	socket.emit("disconnect_screen");
}

// When server send initialisation, declare this socket to user
socket.on("initialisation", function () {
	let last_screen = localStorage.getItem("C2C_last_screen");
	let last_socketId = localStorage.getItem("C2C_last_socketId");
	if (last_screen && last_socketId) {
	socket.emit("register_user_with_last_screen", last_screen, last_socketId);
	} else {
	socket.emit("register_user");
	}
});

// When server confirm screen link, hide connect part and show shot part
socket.on("confirm_screen", function (code) {
	divconnect.style.display = "none";
	divshot.style.display = "block";
	statusElement.innerHTML = "(connecté à <strong>" + code + "</strong>)";
	screen_code = code;
	save_last_screen(code);
	photo_start();
});

// When server inform bad screen link, inform user
socket.on("bad_screen", function (code) {
	alert("Désolé, l'écran " + code + " est introuvable.");
	clear_last_screen();
});

// When server inform screen link is already used, inform user
socket.on("used_screen", function (code) {
	alert("Désolé, l'écran " + code + " est déjà connecté à un appareil.");
	clear_last_screen();
});

// When server inform screen link is lost, reset interface
socket.on("lost_screen", function (code) {
	photo_stop();
	scan_stop();
	divconnect.style.display = "inline-block";
	divshot.style.display = "none";
	statusElement.innerHTML = "(non connecté)";
	clear_last_screen();
});