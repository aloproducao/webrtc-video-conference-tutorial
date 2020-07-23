// getting dom elements
const divSelectRoom = document.getElementById("selectRoom");
const divConsultingRoom = document.getElementById("consultingRoom");
const inputName = document.getElementById("name");
const inputRoomNumber = document.getElementById("roomNumber");
const btnJoinBroadcaster = document.getElementById("joinBroadcaster");
const btnJoinViewer = document.getElementById("joinViewer");
const videoElement = document.querySelector("video");
const broadcasterName = document.getElementById("broadcasterName");
const viewers = document.getElementById("viewers");

// variables
let user;
let rtcPeerConnections = {};

// constants
const iceServers = {
  iceServers: [
    { urls: "stun:stun.navve.tv:5349" },
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun.ekiga.net" },
    { urls: "stun:stun.fwdnet.net" },
    { urls: "stun:stun.ideasip.com" },
    { urls: "stun:stun.iptel.org" },
    { urls: "stun:stun.rixtelecom.se" },
    { urls: "stun:stun.schlund.de" },
    { urls: "stun:stun.softjoys.com" },
    { urls: "stun:stun.iptel.org" },
    { urls: "stun:stun.voipbuster.com" },
    { urls: "stun:stun.voipstunt.com" },
    { urls: "stun:stun.voxgratia.org" },
    { urls: "iphone-stun.strato-iphone.de:3478" },
    { urls: "stun.1-voip.com:3478" },
    { urls: "stun.12connect.com:3478" },
    { urls: "stun.12voip.com:3478" },
    { urls: "stun.1531.ru:3478" },
    { urls: "stun.1und1.de:3478" },
    { urls: "stun.speedy.com.ar:3478" },
    { urls: "stun.3wayint.com:3478" },
    { urls: "stun.voipzoom.com:3478" },
    { urls: "stun.voipxs.nl:3478" },
    { urls: "stun.thinkrosystem.com:3478" },
    { urls: "stun.azurecoast.com:3478" },
    { urls: "stun.b2b2c.ca:3478" },
    { urls: "stun.babelforce.com:3478" },
    { urls: "stun.baltmannsweiler.de:3478" },
    { urls: "stun.bandyer.com:3478" },
    { urls: "stun.cnj.gov.br:3478" },
    { urls: "stun.cnj.jus.br:3478" },
    { urls: "stun.coffee-sen.com:3478" },
    { urls: "stun.cibercloud.com.br:3478" },
    { urls: "stun.mda.gov.br:3478" },
    { urls: "stun.megakosmos.com.br:3478" },
    { urls: "stun.planetarium.com.br:3478" },
    { urls: "stun.webmatrix.com.br:3478" },
    { urls: "stun.yollacalls.com:3478" },
    { urls: "stun.surrealnetworks.com:3478" },
    { urls: "stun.soho66.co.uk:3478" },
    { urls: "stun.freecall.com:3478" },
    { urls: "stun.godatenow.com:3478" },
    { urls: "stun.bultest.org:3478" },
    { urls: "stun.infra.net:3478:3478" },
    { urls: "stun.irishvoip.com:3478" },
    { urls: "stun.ixc.ua:3478" },
    { urls: "stun.liveo.fr:3478" },
    { urls: "stun.mixvoip.com:3478" },
    { urls: "stun.naturfakta.com:3478" },
    { urls: "stun.officinabit.com:3478" },
    { urls: "stun.openvoip.it:3478" },
    { urls: "stun.palava.tv:3478" },
    { urls: "stun.openjobs.hu:3478" },
    { urls: "stun.penserpouragir.org:3478" },
  ]
  
};
  ],
};
 const streamConstraints = { audio: true, video: {width:1280, height:720 },  };

// Let's do this 💪
var socket = io();

btnJoinBroadcaster.onclick = function () {
  if (inputRoomNumber.value === "" || inputName.value === "") {
    alert("Please type a room number and a name");
  } else {
    user = {
      room: inputRoomNumber.value,
      name: inputName.value,
    };

    divSelectRoom.style = "display: none;";
    divConsultingRoom.style = "display: block;";
    broadcasterName.innerText = user.name + " Esta transmitindo...";

    navigator.mediaDevices
      .getUserMedia(streamConstraints)
      .then(function (stream) {
        videoElement.srcObject = stream;
        socket.emit("register as broadcaster", user.room);
      })
      .catch(function (err) {
        console.log("Erro ao acessar a camera", err);
      });
  }
};

btnJoinViewer.onclick = function () {
  if (inputRoomNumber.value === "" || inputName.value === "") {
    alert("Digite um número do canal e um nome");
  } else {
    user = {
      room: inputRoomNumber.value,
      name: inputName.value,
    };

    divSelectRoom.style = "display: none;";
    divConsultingRoom.style = "display: block;";

    socket.emit("register as viewer", user);
  }
};

// message handlers
socket.on("new viewer", function (viewer) {
  rtcPeerConnections[viewer.id] = new RTCPeerConnection(iceServers);

  const stream = videoElement.srcObject;
  stream
    .getTracks()
    .forEach((track) => rtcPeerConnections[viewer.id].addTrack(track, stream));

  rtcPeerConnections[viewer.id].onicecandidate = (event) => {
    if (event.candidate) {
      console.log("sending ice candidate");
      socket.emit("candidate", viewer.id, {
        type: "candidate",
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate,
      });
    }
  };

  rtcPeerConnections[viewer.id]
    .createOffer()
    .then((sessionDescription) => {
      rtcPeerConnections[viewer.id].setLocalDescription(sessionDescription);
      socket.emit("offer", viewer.id, {
        type: "offer",
        sdp: sessionDescription,
        broadcaster: user,
      });
    })
    .catch((error) => {
      console.log(error);
    });

  let li = document.createElement("li");
  li.innerText = viewer.name + " has joined";
  viewers.appendChild(li);
});

socket.on("candidate", function (id, event) {
  var candidate = new RTCIceCandidate({
    sdpMLineIndex: event.label,
    candidate: event.candidate,
  });
  rtcPeerConnections[id].addIceCandidate(candidate);
});

socket.on("offer", function (broadcaster, sdp) {
  broadcasterName.innerText = broadcaster.name + "is broadcasting...";

  rtcPeerConnections[broadcaster.id] = new RTCPeerConnection(iceServers);

  rtcPeerConnections[broadcaster.id].setRemoteDescription(sdp);

  rtcPeerConnections[broadcaster.id]
    .createAnswer()
    .then((sessionDescription) => {
      rtcPeerConnections[broadcaster.id].setLocalDescription(
        sessionDescription
      );
      socket.emit("answer", {
        type: "answer",
        sdp: sessionDescription,
        room: user.room,
      });
    });

  rtcPeerConnections[broadcaster.id].ontrack = (event) => {
    videoElement.srcObject = event.streams[0];
  };

  rtcPeerConnections[broadcaster.id].onicecandidate = (event) => {
    if (event.candidate) {
      console.log("sending ice candidate");
      socket.emit("candidate", broadcaster.id, {
        type: "candidate",
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate,
      });
    }
  };
});

socket.on("answer", function (viewerId, event) {
  rtcPeerConnections[viewerId].setRemoteDescription(
    new RTCSessionDescription(event)
  );
});
