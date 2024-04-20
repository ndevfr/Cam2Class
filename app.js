var port = 8080;
var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http, {
	maxHttpBufferSize: 1e8,
	pingTimeout: 60000,
});

var screens = {};
var users = {};
var rooms = {};
var pins = {};

function createRandomPin() {
	const chars = "0123456789";
	let result = "";
	for (let i = 0; i < 6; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

function createRandomId() {
	const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXZ0123456789";
	let result = "";
	for (let i = 0; i < 8; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

var maxtime = 2592000;

app.use(express.static(__dirname + "/public", { maxAge: maxtime }));

app.get("/", function (req, res) {
	res.sendFile(__dirname + "/index.html");
});

io.on("connection", (socket) => {
	socket.emit("initialisation");

	socket.on("register_user", function () {
		users[socket.id] = {
			room: null,
		};
	});

	socket.on("register_user_with_last_screen", (short_id, last_socketId) => {
		users[socket.id] = {
			room: null,
		};

		if (rooms[short_id]) {
			let screen = rooms[short_id]["socketId"];
			if (
				screens[screen]["user"] == null ||
				screens[screen]["user"] == last_socketId
			) {
				users[socket.id]["room"] = short_id;
				screens[screen]["user"] = socket.id;

				io.to(screen).emit("user_connected", socket.id);

				socket.emit("confirm_screen", short_id);
			} else {
				socket.emit("lost_screen", short_id);
			}
		} else {
			socket.emit("lost_screen", short_id);
		}
	});

	socket.on("register_screen", function () {
		let room_id = createRandomId();

		while (rooms[room_id]) {
			room_id = createRandomId();
		}
		
		let code_pin = createRandomPin();
		
		while (pins[code_pin]) {
			code_pin = createRandomPin();
		}

		screens[socket.id] = {
			room: room_id,
			user: null,
		};
		
		pins[code_pin] = {
			room: room_id
		}

		rooms[room_id] = {
			socketId: socket.id,
		};

		socket.emit("new_room_id", room_id, code_pin);
	});

	socket.on("connect_screen", (code_pin) => {
		if(pins[code_pin]){
			let short_id = pins[code_pin]['room'];
			if (rooms[short_id]) {
				let screen = rooms[short_id]["socketId"];
				if (screens[screen]["user"] == null) {
					users[socket.id]["room"] = short_id;
					screens[screen]["user"] = socket.id;
			
					delete pins[code_pin]
					io.to(screen).emit("user_connected", socket.id);
					socket.emit("confirm_screen", short_id);
				} else {
					socket.emit("used_screen", short_id);
				}
			} else {
				socket.emit("bad_screen", short_id);
			}
		}
	});

	socket.on("disconnect_screen", (short_id) => {
		let room_id = users[socket.id]["room"];
		if (room_id !== null) {
			let screen = rooms[room_id]["socketId"];
			screens[screen]["user"] = null;
			io.to(screen).emit("disconnected_user", socket.id);
		}

		users[socket.id]["room"] = null;
	});

	socket.on("confirm_reset_screen", () => {
		let room_id = screens[socket.id]["room"];
		let user = screens[socket.id]["user"];

		if (user !== null) {
			if (users[user]) {
				users[user]["room"] = null;
				io.to(user).emit("lost_screen", room_id);
			}
		}
		
		let code_pin = createRandomPin();
		
		while (pins[code_pin]) {
			code_pin = createRandomPin();
		}
		
		screens[socket.id] = {
			room: room_id,
			user: null,
		};
		
		pins[code_pin] = {
			room: room_id
		}

		socket.emit("new_room_id", room_id, code_pin);
	});

	socket.on("wait_log", function () {
		socket.emit("log", { screens, users });
	});

	socket.on("newshot", (short_id, img_src, img_width, img_height) => {
		if (short_id !== null) {
			if (rooms[short_id]) {
				let screen = rooms[short_id]["socketId"];

				if (screens[screen]) {
					let user = screens[screen]["user"];
					if (user === socket.id) {
						io.to(screen).emit(
							"receive_newshot",
							img_src,
							img_width,
							img_height
						);
					}
				}
			}
		}
	});

	socket.on("quitter", function () {});

	socket.on("disconnect", function () {
		if (screens[socket.id]) {
			let room_id = screens[socket.id]["room"];
			let user = screens[socket.id]["user"];

			if (user !== null) {
				if (users[user]) {
					users[user]["room"] = null;
				}
				io.to(user).emit("lost_screen", room_id);
			}

			delete screens[socket.id];
			delete rooms[room_id];
		} else if (users[socket.id]) {
			let room_id = users[socket.id]["room"];
			if (room_id !== null) {
				if (rooms[room_id]) {
					let screen = rooms[room_id]["socketId"];
					io.to(screen).emit("lost_user", socket.id);
				}
			}

			delete users[socket.id];
		}
	});

	socket.on("wait_log", function () {
		socket.emit("log", { screens, users });
	});
});

http.listen(port);
