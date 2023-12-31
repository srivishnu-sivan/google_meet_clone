//! from now on things are gonna get real shit, and it's gonna FUCK me like HELL

// this is where we go part -2
const AppProcess = (function () {
  let peers_connection_ids = [];
  let peers_connection = [];
  let remote_vid_stream = [];
  let remote_aud_stream = [];
  let serverProcess = "";
  let local_div;
  let audio;
  let isAudioMute = true;
  // ? rtp_aud_senders holds information rtp audio senders
  let rtp_aud_senders = [];
  // ? rtp_vid_senders holds information rtp video senders
  let rtp_vid_senders = [];
  //? video_state variable is used to know what kind of video is displayed on the screen caz, 1). It will be from your camera, 2). It will be from screen-sharing
  let video_states = {
    None: 0,
    Camera: 1,
    ScreenShare: 2,
  };

  let video_st = video_states.None;
  let videoCamTrack;
  async function _init(SDP_function, my_connid) {
    serverProcess = SDP_function;
    my_connection_id = my_connid;
    // ! eventProcess() is to handle events i.e audio and video (enable and disable audio and video track)
    eventProcess();
    //  ! to load video
    local_div = document.getElementById("localVideoPlayer");
  }

  function eventProcess() {
    //? audio
    $("#micMuteUnmute").on("click", async function(){
      if (!audio) {
        await loadAudio();
      }
      if (!audio) {
        alert("Audio permission is not granted");
        return;
      }
      if (isAudioMute) {
        audio.enable = true;
        $(this).html("<span class='material-icons' style='width:100%'>mic</span>");
        //? to update audio in our track
        updateMediaSenders(audio, rtp_aud_senders);
      } else {
        audio.enable = false;
        $(this).html("<span class='material-icons' style='width:100%'>mic_off</span>");
        // ? to remove audio from track
        removeMediaSenders(rtp_aud_senders);
      }
      // toggle mic to mute and unmute
      isAudioMute = !isAudioMute; 
    });

    // ? video
    $("#videoCamOnOff").on("click", async function () {
      if (video_st === video_states.Camera) {
        console.log("inside if")
        await videoProcess(video_states.None);
      } else {
        await videoProcess(video_states.Camera);
      }
    });

    // ? screen share
    $("#ScreenShareOnOff").on("click", async function () {
      if (video_st === video_states.ScreenShare) {
        await videoProcess(video_states.None);
      } else {
        await videoProcess(video_states.ScreenShare);
      }
    });
  }

  async function loadAudio() {
  try {
   let astream =  await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true,
   })
    audio = astream.getAudioTracks()[0]
   audio.enabled = false


  } catch (error) {
    console.log(error);
  }
}

  async function updateMediaSenders(track,rtp_senders) {
    for (let con_id in peers_connection_ids) {
      if (connection_status(peers_connection[con_id])) {
        if (rtp_senders[con_id] && rtp_senders[con_id].track) {
          rtp_senders[con_id].replaceTrack(track)
        } else {
          rtp_senders[con_id] = peers_connection[con_id].addTrack(track)
        }
      }
    }
  }
  async function connection_status(connection) {
    if (connection && (connection.connectionState === "new" || connection.connectionState === "connecting" || connection.connectionState === "connected")) {
      return true
    } else {
      return false
    }
    
  }

  function removeMediaSenders(rtp_senders) {
    for (let con_id in peers_connection_ids) {
      if (rtp_senders[con_id] && connection_status(peers_connection[con_id])) {
        peers_connection[con_id].removeTrack(rtp_senders[con_id])
        rtp_senders[con_id] = null
      }
    }
  }



  function removeVideoStream(rtp_vid_senders) {
    if (videoCamTrack) {
      videoCamTrack.stop();
      videoCamTrack = null;
      local_div.srcObject = null
      removeMediaSenders(rtp_vid_senders)
      
    }
  }

  async function videoProcess(newVideoState) {
    console.log("newVideoState====>", newVideoState);
    if (newVideoState === video_states.None) {
      $("#videoCamOnOff").html(
        '<span class="material-icons" style="width:100%">videocam_off</span>'
      );
      video_st = newVideoState;
      // ? to remove video stream
      removeVideoStream(rtp_vid_senders)
      return

    }
    if (newVideoState === video_states.Camera) {
      $("#videoCamOnOff").html(
        '<span class="material-icons" style="width:100%">videocam_on</span>'
      );
    }
    try {
      let vstream = null;
      if (newVideoState === video_states.Camera) {
        vstream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 1920,
            height: 1080,
          },
          audio: false,
        });
      } else if (newVideoState === video_states.ScreenShare) {
        vstream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: 1920,
            height: 1080,
          },
          audio: false,
        });
      }

      if (vstream && vstream.getVideoTracks().length > 0) {
        videoCamTrack = vstream.getVideoTracks()[0];
        //if videocam track is true, then check any data(video) is available
        if (videoCamTrack) {
          local_div.srcObject = new MediaStream([videoCamTrack]);
          updateMediaSenders(videoCamTrack, rtp_vid_senders);
        }
      }
    } catch (error) {
      console.log(error);
      return;
    }
    video_st = newVideoState;
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

  async function setConnection(connid) {
    let connection = new RTCPeerConnection(iceConfiguration);
    // other user to connect
    connection.onnegotiationneeded = async function (event) {
      await setOffer(connid);
    };
    // after sending the offer,send icecandidate
    connection.onicecandidate = function (event) {
      if (event.candidate) {
        serverProcess(
          JSON.stringify({ icecandidate: event.candidate }),
          connid
        );
      }
    };
    // working with track
    // !The track event is sent to the ontrack event handler on RTCPeerConnections after a new track has been added to an RTCRtpReceiver which is part of the connection.By the time this event is delivered, the new track has been fully added to the peer connection

    connection.ontrack = function (event) {
      // this is to check video track of remote
      if (!remote_vid_stream[connid]) {
        remote_vid_stream[connid] = new MediaStream();
      }
      // this is to check audio track of remote
      if (!remote_aud_stream[connid]) {
        remote_aud_stream[connid] = new MediaStream();
      }

      // video
      if (event.track.kind === "video") {
        remote_vid_stream[connid].getVideoTracks().forEach(t => {
          remote_vid_stream[connid].removeTrack(t);
        });

        remote_vid_stream[connid].addTrack(event.track);

        let remoteVideoPlayer = document.getElementById(`v_${connid}`);
        remoteVideoPlayer.srcObject = null;
        remoteVideoPlayer.srcObject = remote_vid_stream[connid];
        remoteVideoPlayer.load();
      }
      // audio
      else if (event.track.kind === "audio") {
        remote_aud_stream[connid].getAudioTracks().forEach(t => {
          remote_aud_stream[connid].removeTrack(t);
        });

        remote_aud_stream[connid].addTrack(event.track);

        let remoteAudioPlayer = document.getElementById(`a_${connid}`);
        remoteAudioPlayer.srcObject = null;
        remoteAudioPlayer.srcObject = remote_aud_stream[connid];
        remoteAudioPlayer.load();
      }
    };

    peers_connection_ids[connid] = connid;
    peers_connection[connid] = connection;

    //? =============== this code block is used to show other user our video=========
    if (
      video_st === video_states.Camera ||
      video_st === video_states.ScreenShare
    ) {
      if (videoCamTrack) {
        
        updateMediaSenders(videoCamTrack, rtp_vid_senders);
      }
    }
      //? ===============================================
    return connection;
  }

  async function setOffer(connid) {
    //  inorder to work in setOffer function we need peerConnections and peerConection_id, so inorder to get peerConection_id and peerConections array from setConnection()

    let connection = peers_connection[connid];
    // the below connection is RTCPeerConnection()
    let offer = await connection.createOffer();
    //  to know what is // ! "setLocalDescription":  https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/setLocalDescription
    await connection.setLocalDescription(offer);
    serverProcess(
      JSON.stringify({
        offer: connection.localDescription,
      }),
      connid
    );
  }

  async function SDProcedd(message, from_connid) {
    message = JSON.parse(message);
    if (message.answer) {
      // by passing message.answer to RTCSessionDescription() to set answer as remote description for sender
      await peers_connection[from_connid].setRemoteDescription(
        new RTCSessionDescription(message.answer)
      );
    } else if (message.offer) {
      if (!peers_connection[from_connid]) {
        // "!peers_connection[from_connid]" this means from_connid is not found in peers_connection,then add from_connid to peers_connection by using setConnection()
        await setConnection(from_connid);
      }

      // to set remote description for us
      await peers_connection[from_connid].setRemoteDescription(
        new RTCSessionDescription(message.offer)
      );
      // * if from_connid is present in peers_connection then create Answer for the offer by using createAnswer()
      // ? To know how createAnswer() works, refer , https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createAnswer
      let answer = await peers_connection[from_connid].createAnswer();
      // answer is localDescription of remote user
      await peers_connection[from_connid].setLocalDescription(answer);
      // the below code is to send response(answer) to the same user(remote) who offered us
      serverProcess(
        JSON.stringify({
          answer: answer,
        }),
        from_connid
      );
    } else if (message.icecandidate) {
      // ? exchanging iceCandidate will happen for multiple times until both sides get stable, then brower will establish the connection
      if (!peers_connection[from_connid]) {
        await setConnection(from_connid);
      }
      try {
        await peers_connection[from_connid].addIceCandidate(
          message.icecandidate
        );
      } catch (error) {
        console.log(error);
      }
    }
  }

  return {
    setNewConnection: async function (connid) {
      await setConnection(connid);
    },
    init: async function (SDP_function, my_connid) {
      await _init(SDP_function, my_connid);
    },
    propcessClient: async function (data, from_connid) {
      await SDProcedd(data, from_connid);
    },
  };
})()





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
      // to make video to display,by making css property from display:none to dispaly:block using .show()
      $("#meetingContainer").show()
      // to display username
      $("#me h2").text(user_id + "(Me)")
      // to display remote users name
      document.title = user_id;


    }

    // core of this function is to signal the server when both user_id and meeting_id have value
    function event_process_for_signaling_server() {
      socket = io.connect()
      // ! SDP_function declaration and it's uses, this function is used to send icecandidate, offer our local description to other user using server.js
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
      
      // from server.js -2 //! this is to inform about other users to me
      socket.on("inform_me_about_other_user", other_users => {
        if (other_users) {
          other_users.map((ele, index) => {
            console.log(ele);
            addUser(other_users[index], other_users[index].connectionId);
            // ? this function is used to webRTC to build connection other users to send video and audio data
            AppProcess.setNewConnection(other_users[index].connectionId);
          })
        }
          

        
        
      });
      

      socket.on("SDPProcess", async function (data) {
        await AppProcess.propcessClient(data.message, data.from_connid);
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





// ! technical term

// SDP (Session Description Protocol) is the standard describing a peer-to-peer connection. SDP contains the codec, source address, and timing information of audio and video.


