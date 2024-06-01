var socket = io.connect();

const home = "https://cam2class.ndev.app/";
const debug = false;

function go_home(cond) {
  if (!cond) {
    cond = confirm("Souhaitez-vous vraiment retourner à l'accueil ?");
  }
  if (cond) {
    window.location.href = home;
  }
}

function log_screens() {
  socket.emit("wait_log");
}

socket.on("message", function (message) {
  alert("Le serveur a un message pour vous : " + message);
});

socket.on("log", function (v) {
  console.log(v);
});
