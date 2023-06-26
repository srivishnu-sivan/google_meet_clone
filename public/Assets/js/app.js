//! from now on things are gonna get real shit, and it's gonna FUCK me like HELL

// this is where we go part -2
const AppProcess = (function () {
  // iceConfiguration provides users system details like IP address,network etc
  let iceConfiguration = {
    iceServers: [
      {
        urls: "stun:stun.1.google.com:19302",
      },
      {
        urls: "stun:stun1.google.com:19302",
      },
    ],
  };

  function setConnection(connid) {
    let connection = new RTCPeerConnection(iceConfiguration);
  }

  return {
    setNewConnection: async function (connid) {
      await setConnection(connid);
    },
  };
})





// * this is where we start part-1
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
        // ?this is to connect and emit signal(data) to server from client
        socket.on("connect", () => {
            if (socket.connected) {
                if (user_id !== "" && meeting_id !== "") {
                    socket.emit("userconnect", {
                        displayName: user_id,
                        meetingid : meeting_id
                    })
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

