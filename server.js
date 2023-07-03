const express = require("express");
const path = require("path");
const { Socket } = require("socket.io");

const app = express();
const port = 3000;
const server = app.listen(port, function () {
  console.log(`fuck you @ port ${port}`);
});

const io = require("socket.io")(server, {
  allowEI03: true,
});

// ? this is to points our root folder
app.use(express.static(path.join(__dirname, "")));
let userConnection = [];

io.on("connection", socket => {
  //in every connection of socket.io it gernerates unique socket id
  console.log(`socket id is ${socket.id}`);
  // ? the first parameter should to same as client side socket.emit
  socket.on("userconnect", data => {
    console.log("userconnect", data.displayName, data.meetingid);
    // ! data.displayName, data.meetingid :  are actually our details

    // ?other_users will hold other user's meeting id
    let other_users = userConnection.filter(p => {
      // ! p.meeting_id : other connection's meeting id
      // ! data.meetingid : our connection's meeting id
      if (p.meeting_id === data.meetingid) return true;
    });
    console.log("other-users", other_users);
    // store all the connection information in a variable which holds both my connection and others connection
    userConnection.push({
      connectionId: socket.id,
      user_id: data.displayName,
      meeting_id: data.meetingid,
    });
    console.log("userConnection-users", userConnection);
    // ! to make other user to know about my presence
    other_users.forEach(v => {
      // ?socket.to : is used to send information to specifc id
      socket.to(v.connectionId).emit("inform_others_about_me", {
        // other_user_id is named because for them(other users), my ID is be shown as other ID
        other_user_id: data.displayName,
        connId: socket.id,
      });
      // go to app.js(client1)
    });

    // ! inform me about other user
    socket.emit("inform_me_about_other_user", other_users);
  });
  socket.on("SDPProcess", data => {
    socket.to(data.to_connid).emit("SDPProcess", {
      message: data.message,
      from_connid: socket.id,
    });
  });
});
