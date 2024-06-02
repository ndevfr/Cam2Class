var screen_code = "";
var resizing = false;
var link = null;

const divbgconnect = document.getElementById("back-connect-screen");
const divconnect = document.getElementById("connect-screen");
const divdisplay = document.getElementById("display");
const imgElement = document.getElementById("image");
const screencodeElement = document.getElementById("screen_code");
const screenidElement = document.getElementById("screen_id");
const resetLink = document.getElementById("resetlink");
const statusElement = document.getElementById("status");
const qrcodeElement = document.getElementById("qrcode");

function clear_screen(cond) {
	if(!cond){
		cond = confirm("Souhaitez-vous vraiment effacer tous les contenus à l'écran ?");
	}
	if(cond){
		document.getElementById("panes").innerHTML = "";
	}
}

function reset_screen(cond) {
	if(!cond){
		cond = confirm("Souhaitez-vous vraiment réinitialiser l'accès à cet écran ?");
	}
	if(cond){
		screencodeElement.innerText = "######";
		screenidElement.innerText = "######";
		divbgconnect.style.display = "block";
		divconnect.style.display = "inline-block";
		statusElement.innerText = "(non connecté)";
		socket.emit("confirm_reset_screen");
	}
}

function reset_panes() {
	const panes = document.querySelectorAll(".pane");

	let z = 1;

	panes.forEach((pane) => {
	const corner = pane.querySelector(".corner");
	const closeBtn = pane.querySelector(".close");

	pane.style.zIndex = z;
	z = z + 1;

	closeBtn.addEventListener("click", (event) => {
		pane.remove();
	});

	pane.addEventListener("mousedown", (event) => {
		z = z + 1;
		pane.style.zIndex = z;

		let startX = event.pageX;
		let startY = event.pageY;

		isHoverCloseBtn =
		startX >= pane.offsetLeft + closeBtn.offsetLeft &&
		startX <=
			pane.offsetLeft + closeBtn.offsetLeft + closeBtn.offsetWidth &&
		startY >= pane.offsetTop + closeBtn.offsetTop &&
		startY <= pane.offsetTop + closeBtn.offsetTop + closeBtn.offsetHeight;

		if (!isHoverCloseBtn) {
		document.getElementById("panes").appendChild(pane);

		pane.classList.add("is-dragging");

		let l = pane.offsetLeft;
		let t = pane.offsetTop;

		const drag = (event) => {
			if (!resizing) {
			event.preventDefault();

			pane.style.left = l + (event.pageX - startX) + "px";
			pane.style.top = t + (event.pageY - startY) + "px";
			}
		};

		const mouseup = () => {
			pane.classList.remove("is-dragging");

			document.removeEventListener("mousemove", drag);
			document.removeEventListener("mouseup", mouseup);
		};

		document.addEventListener("mousemove", drag);
		document.addEventListener("mouseup", mouseup);
		} else {
		const mouseup = (event) => {
			event.preventDefault();
			isHoverCloseBtn =
			event.pageX >= pane.offsetLeft + closeBtn.offsetLeft &&
			event.pageX <=
				pane.offsetLeft + closeBtn.offsetLeft + closeBtn.offsetWidth &&
			event.pageY >= pane.offsetTop + closeBtn.offsetTop &&
			event.pageY <=
				pane.offsetTop + closeBtn.offsetTop + closeBtn.offsetHeight;
			if (isHoverCloseBtn) {
			document.removeEventListener("mouseup", mouseup);
			pane.remove();
			}
		};
		document.addEventListener("mouseup", mouseup);
		}
	});

	corner.addEventListener("mousedown", (event) => {
		let w = pane.clientWidth;
		let h = pane.clientHeight;
		let img = pane.querySelector("img");
		let ratio = img.naturalWidth / img.naturalHeight;

		let startX = event.pageX;
		let startY = event.pageY;

		resizing = true;

		const drag = (event) => {
		event.preventDefault();
		let newHeight = h + (event.pageY - startY);
		let newWidth = newHeight * ratio;
		if (newHeight >= 60 && newWidth >= 60) {
			pane.style.height = newHeight + "px";
			pane.style.width = newHeight * ratio + "px";
		}
		};

		const mouseup = () => {
		document.removeEventListener("mousemove", drag);
		document.removeEventListener("mouseup", mouseup);
		resizing = false;
		};

		document.addEventListener("mousemove", drag);
		document.addEventListener("mouseup", mouseup);
	});
	});
}

//socket.emit('rejoindre', partie, couleur, prenom);

socket.on("initialisation", function () {
	socket.emit("register_screen");
});

socket.on("new_room_id", function (screen_id, screen_code) {
	screencodeElement.innerText = screen_code;
	screenidElement.innerText = screen_id;
	qrcodeElement.innerHTML = "";
	var qrcode = new QRCode("qrcode", {
	text: "C2C#" + screen_code,
	width: 256,
	height: 256,
	colorDark: "#7c1039",
	colorLight: "#ffffff",
	correctLevel: QRCode.CorrectLevel.M,
	});
});

socket.on("user_connected", function (user_id) {
	divbgconnect.style.display = "none";
	divconnect.style.display = "none";
	statusElement.innerText = "(connecté)";
});

// When server inform user is lost, reset interface
socket.on("lost_user", function (code) {
	//divconnect.style.display = "block";
	//divdisplay.style.display = "none";
	statusElement.innerText = "(connecté - en attente)";
});

// When server inform user choose to disconnected, reset interface
socket.on("disconnected_user", function (code) {
	//divconnect.style.display = "block";
	//divdisplay.style.display = "none";
	statusElement.innerText = "(deconnecté)";
});

socket.on("disconnect_screen", function (screen_id) {
	if (link === screen_id) {
	reset_screen(true);
	}
});

socket.on("receive_newshot", function (img_src, img_width, img_height) {
	const window_width = window.innerWidth - 40;
	const window_height = window.innerHeight - 40;
	const ratio = img_width / img_height;

	if (img_width > window_width) {
	const coeff_x = window_width / img_width;
	img_width = coeff_x * img_width;
	img_height = coeff_x * img_height;
	}

	if (img_height > window_height) {
	const coeff_y = window_height / img_height;
	img_width = coeff_y * img_width;
	img_height = coeff_y * img_height;
	}

	const fragment = document.createDocumentFragment();

	const pane = fragment.appendChild(document.createElement("div"));
	pane.classList.add("pane");
	pane.style.left = "calc(50vw - " + img_width / 2 + "px)";
	pane.style.top = "calc(50vh - " + img_height / 2 + "px)";
	pane.style.width = img_width + "px";
	pane.style.height = img_height + "px";

	const content = pane.appendChild(document.createElement("div"));
	content.classList.add("content");

	const img = content.appendChild(document.createElement("img"));
	img.src = img_src;

	const move = pane.appendChild(document.createElement("div"));
	move.classList.add("move");

	const corner = pane.appendChild(document.createElement("div"));
	corner.classList.add("corner");

	const close = pane.appendChild(document.createElement("div"));
	close.classList.add("close");

	document.getElementById("panes").append(fragment);

	reset_panes();
});