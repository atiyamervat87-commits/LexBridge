
window.socket = io({
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000
});

window.socket.on("connect", function () {
    console.log("LEX_SOCKET_CONNECTED:", window.socket.id);
});

window.socket.on("connect_error", function (err) {
    console.error("LEX_SOCKET_CONNECT_ERROR:", err);
});

window.socket.on("disconnect", function (reason) {
    console.warn("LEX_SOCKET_DISCONNECTED:", reason);
});
