const express = require("express")
const path = require("path");
const { Socket } = require("socket.io");

const app = express()
const port  = 3000
const server = app.listen(port, function () {
  console.log(`fuck you @ port ${port}`);
});

const io = require("socket.io")(server, {
    allowEI03 :true
});


// ? this is to points our root folder
app.use(express.static(path.join(__dirname, "")))


io.on("connection", (socket) => {
    //in every connection of socket.io it gernerates unique socket id 
    console.log(`socket id is ${socket.id}`);
})



