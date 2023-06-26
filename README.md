# google_meet_clone

# to start the server 

# npm start : port 3000

# this is current cnd to connect server and client using socket.io lib
<!-- # <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.7.0/socket.io.js" integrity="sha512-+sXUwEYakGznuXubXLO/7LWSAPcm+U3NxMJaSu3S5OcvruAAAzaC50Uh4TW9KWj0hA6vfPAjB7E1uuIXgn9vmQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  <script> -->


# step-1 
create socket connections in both server.js and app.js(client side)

# step-2
once the socket connection is done, send your(client) data(user id , meeting id) to server

# step-3
<!--step-3.1 -->
In server.js, it checks for connection establishment.After that, it stores all the connections data in a variable.
<!-- step-3.2 -->
create two variable, first is for "other_user" and second, is for "userConnections"
# "other_user" is dependent on "userConnections" - initally "other_user" check for details in  "userConnections",  when you add your details (meetingID and userID) which will be stored in "userConnections" and rest of other user's details (meetingID and userID) is stored in both "other_user","userConnections"


# there is a logic behind storage of user details, "other_user" filters and stores details of users except local user(that particular client user, i.e except current user)

# step-4 : let other bastards know about me 
from server.js, I'm creating a socket.io connection to send my details(user_name, meeting_id) to other user's id and emmitng my details to client(app.js)

# step-5 : get the details which is sent by server.js
-> with the details which you have got from the server.js can be used to create a new interface for new user and add that in userList interface so that other can communicate with them.

-> in the same process we are enabling video and audio tags by adding id attribute, like "v_adiNNCQ18U0nW4-yAAAB" for video tag and "a_adiNNCQ18U0nW4-yAAA" for audio tag

# step-6 : to create webRTC connection
to make that happen create a "RTCPeerConnection" object with stun server iceConfiguration as a parameter and initialize to a variable. note: this variable is gonna have big role in further process

-> iceConfiguration :  is used to get local system's details like IP address, network etc