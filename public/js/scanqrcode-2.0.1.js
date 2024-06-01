var video = document.createElement("video");
var canvasElement = document.getElementById("canvas");
var canvas = canvasElement.getContext("2d");
var loadingMessage = document.getElementById("loadingMessage");
var outputContainer = document.getElementById("output");
var outputMessage = document.getElementById("outputMessage");
var qrscan_active = false;
var stream = null;

function drawLine(begin, end, color) {
  canvas.beginPath();
  a = (end.y - begin.y) / (end.x - begin.x);
  b = begin.y - a * begin.x;
  lx = end.x - begin.x;
  canvas.moveTo(begin.x, begin.y);
  canvas.lineTo(begin.x + lx / 5, a * (begin.x + lx / 5) + b);
  canvas.lineWidth = 4;
  canvas.strokeStyle = color;
  canvas.stroke();
  canvas.moveTo(end.x, end.y);
  canvas.lineTo(end.x - lx / 5, a * (end.x - lx / 5) + b);
  canvas.lineWidth = 4;
  canvas.strokeStyle = color;
  canvas.stroke();
}
const constraints = (window.constraints = {
  audio: false,
  video: {
    facingMode: "environment",
  },
});

function handleSuccess(stream) {
  video.srcObject = stream;
  video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
  video.play();
  requestAnimationFrame(tick);
}

function handleError(error) {
  if (error.name === "ConstraintNotSatisfiedError") {
    let v = constraints.video;
    errorMsg("La résolution n'est pas supporté par l'appareil.");
  } else if (error.name === "PermissionDeniedError") {
    errorMsg("Les permissions pour utiliser la caméra n'ont pas été données.");
  }
  errorMsg("Erreur getUserMedia : ${error.name}", error);
}

function errorMsg(msg, error) {
  const errorElement = document.querySelector("#errorMsg");
  errorElement.innerHTML += `<p>${msg}</p>`;
  if (typeof error !== "undefined") {
    console.error(error);
  }
}

function scan_toggle(e) {
  if (!qrscan_active) {
    scan_init(e);
  } else {
    scan_stop();
  }
}

async function scan_init(e) {
  qrscan_active = true;
  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    handleSuccess(stream);
  } catch (e) {
    handleError(e);
  }
}

function scan_stop() {
  qrscan_active = false;
  video.pause();
  video.src = "";
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
  canvasElement.style.display = "none";
  outputMessage.style.display = "none";
  outputMessage.innerHTML = "";
}

document
  .getElementById("qrscan_on")
  .addEventListener("click", (e) => scan_toggle(e));

function tick() {
  if (qrscan_active) {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      loadingMessage.hidden = true;
      canvasElement.style.display = "block";
      if (video.videoWidth > video.videoHeight) {
        size = video.videoHeight;
        x0 = (video.videoWidth - video.videoHeight) / 2;
        y0 = 0;
      } else {
        size = video.videoWidth;
        y0 = (video.videoHeight - video.videoWidth) / 2;
        x0 = 0;
      }
      canvas.drawImage(
        video,
        x0,
        y0,
        size,
        size,
        0,
        0,
        canvasElement.width,
        canvasElement.height
      );
      var imageData = canvas.getImageData(
        0,
        0,
        canvasElement.width,
        canvasElement.height
      );
      var code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      if (code) {
        drawLine(
          code.location.topLeftCorner,
          code.location.topRightCorner,
          "#FF3B58"
        );
        drawLine(
          code.location.bottomLeftCorner,
          code.location.bottomRightCorner,
          "#FF3B58"
        );
        drawLine(
          code.location.topLeftCorner,
          code.location.bottomLeftCorner,
          "#FF3B58"
        );
        drawLine(
          code.location.topRightCorner,
          code.location.bottomRightCorner,
          "#FF3B58"
        );
        codeData = code.data;
        if (codeData.indexOf("C2C#") === 0 && codeData.length === 10) {
          code = codeData.substr(4);
          joinscreen(code);
          scan_stop();
        } else {
          outputMessage.style.display = "block";
          outputMessage.innerHTML = `<em>QR-code non valide</em>`;
        }
      } else {
        outputMessage.style.display = "block";
        outputMessage.innerHTML = `<em>QR-code non detecté</em>`;
      }
    }
    requestAnimationFrame(tick);
  }
}
