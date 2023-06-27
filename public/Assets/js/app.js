//! from now on things are gonna get real shit, and it's gonna FUCK me like HELL

// this is where we go part -2
const AppProcess = (function () {
  let peers_connection_ids = []
  let peers_connection = []
let serverProcess = ""
  function _init(SDP_function, my_connid) {
    serverProcess = SDP_function;
    my_connection_id = my_connid
  }



  // iceConfiguration provides users system details like IP address,network etc
  let iceConfiguration = {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
      {
        urls: "stun:stun1.l.google.com:19302",
      },
    ],
  };

  function setConnection(connid) {
    let connection = new RTCPeerConnection(iceConfiguration);
    // other user to connect 
    connection.onnegotiationneeded = async function (event) {
      await setOffer(connid)
    } 
    // after sending the offer,send icecandidate
    connection.onicecandidate = function (event) {
      if (event.candidate) {
        serverProcess(JSON.stringify({icecandidate : event.candidate}),connid)
      }
    }
    // working with track
    // !The track event is sent to the ontrack event handler on RTCPeerConnections after a new track has been added to an RTCRtpReceiver which is part of the connection.By the time this event is delivered, the new track has been fully added to the peer connection

    connection.ontrack = function (event) {
      
    }

    peers_connection_ids[connid] = connid
    peers_connection[connid] = connection
  }

 async function setOffer(connid) {
   //  inorder to work in setOffer function we need peerConnections and peerConection_id, so inorder to get peerConection_id and peerConections array from setConnection()

   let connection = peers_connection[connid];
   // the below connection is RTCPeerConnection()
   let offer = await connection.createOffer();
   //  to know what is // ! "setLocalDescription":  https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/setLocalDescription
   await connection.setLocalDescription(offer);
   serverProcess(JSON.stringify({
     offer: connection.localDescription,
   }),connid)
 }

  return {
    setNewConnection: async function (connid) {
      await setConnection(connid);
    },
    init: async function (SDP_function, my_connid) {
      await _init(SDP_function, my_connid);
    },
  };
})





// * this is where we start part-1
// ? MyApp function is used to communocate with server-side from client-side 
const MyApp = (function(){
    let socket = null;
    let user_id = ""
    let meeting_id = ""
    function init(uid, mid) {
        user_id = uid
        meeting_id = mid
        event_process_for_signaling_server();
    }

    // core of this function is to signal the server when both user_id and meeting_id have value
    function event_process_for_signaling_server() {
      socket = io.connect()
      // ! SDP_function declaration and it's uses, tis function is used to send icecandidate and offer our local description to other user using server.js
      // * By using socket.emit method we can send inforamtion from client to server
      const SDP_function = function (data,to_connid) {
        socket.emit("SDPProcess", {
          message: data,
          to_connid :to_connid
        })
      }

        // ?this is to connect and emit signal(data) to server from client
        socket.on("connect", () => {
          if (socket.connected) {


            // this AppProcess comes after icecandidate and offer is issued
            AppProcess.init(SDP_function, socket.id);
            // until then don't break your head(AppProcess.init(SDP_function, socket.id);)



            if (user_id !== "" && meeting_id !== "") {
              socket.emit("userconnect", {
                displayName: user_id,
                meetingid: meeting_id,
              });
            }
          }
        })

        // from server.js -1,//! this is to inform about my presence in room to other users
        socket.on("inform_others_about_me", data => {
            // to create a new users interface in  web conferencing meeting so that they'll see me and communicate with me
            addUser(data.other_user_id, data.connId)
            
            // ? this function is used to webRTC to build connection other users to send video and audio data
            AppProcess.setNewConnection(data.connId);
        });


        
        
        
    }
    // this function will be excecuted as many time a new user is getting added in room 
    const addUser = (other_user_id,connId) => {
      let newDivId = $("#otherTemplate").clone();
      newDivId = newDivId.attr("id", connId).addClass("other");
      newDivId.find("h2").text(other_user_id);
      // setting id for video tag
      newDivId.find("video").attr("id", `v_${connId}`);
      //? so this how it looks like
      // <video id="v_adiNNCQ18U0nW4-yAAAB" ></video>
      // setting id for audio tag
      newDivId.find("audio").attr("id", `a_${connId}`);
      //? so this how it looks like
        // <audio id=" B" ></audio>
        newDivId.show()
        // this is to add newDivID will be append into divUsers
        $("#divUsers").append(newDivId);

    }

    return {
        // uid is coming from index.html
        _init: function (uid, mid) {
            init(uid,mid)
        }
    }
} )()

