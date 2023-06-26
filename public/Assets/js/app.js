//! from now on things are gonna get real shit, and it's gonna FUCK me like HELL

const MyApp = (function(){

    function init(uid, mid) {
        event_process_for_signaling_server();
    }

    let socket = null
    function event_process_for_signaling_server() {
        socket = io.connect()
        socket.on("connect", () => {
            alert("socket to connected to client side")
        })
}

    return {
        _init: function (uid, mid) {
            init(uid,mid)
        }
    }
} )()

