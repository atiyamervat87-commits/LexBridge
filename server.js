const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());

/* ===== BASIC SECURITY HEADERS ===== */
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "no-referrer");
    next();
});

app.use(express.static("public"));

const rooms = new Map();

/* ===== PLATFORM HEALTH ===== */
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        platform: "منصة البث",
        status: "running",
        rooms: rooms.size,
        realtime: true,
        socketio: true,
        webrtcSignaling: true,
        dataStore: "in-memory"
    });
});

function getRoom(roomId) {
    if (!rooms.has(roomId)) {
        rooms.set(roomId, {
            id: roomId,
            host: null,
            hostName: null,
            viewers: new Map()
        });
    }

    return rooms.get(roomId);
}

function roomState(room) {
    return {
        room: room.id,
        host: room.hostName,
        viewers: Array.from(room.viewers.values()),
        viewerCount: room.viewers.size,
        online: Boolean(room.host || room.viewers.size)
    };
}

function broadcastRoomState(room) {
    io.to(room.id).emit("room-state", roomState(room));
}

io.on("connection", socket => {

    console.log("SOCKET_CONNECTED:", socket.id);

    socket.on("disconnect", reason => {
        console.log("SOCKET_DISCONNECTED:", socket.id, reason);
    });


    socket.on("join-room", ({ room, user, role }) => {
        console.log("JOIN_ROOM_RECEIVED:", {
            socketId: socket.id,
            room: room,
            user: user,
            role: role
        });

        room = String(room || "").trim();
        user = String(user || "زائر").trim();
        role = role === "host" ? "host" : "viewer";

        if (!room) return;

        const data = getRoom(room);

        if (role === "host") {
            if (data.host && data.host !== socket.id) {
                socket.emit("join-error", "الغرفة لها مضيف بالفعل.");
                return;
            }

            data.host = socket.id;
            data.hostName = user;
            socket.role = "host";
        } else {
            data.viewers.set(socket.id, user);
            socket.role = "viewer";
        }

        socket.room = room;
        socket.user = user;

        socket.join(room);

        io.to(room).emit("system", {
            text: role === "host"
                ? `👑 ${user} بدأ البث`
                : `👋 ${user} دخل الغرفة`
        });

        broadcastRoomState(data);
    });

    // ===== WEBRTC SIGNALING BRIDGE =====

    socket.on("request-host", () => {
        console.log("WEBRTC_REQUEST_HOST:", {
            socketId: socket.id,
            room: socket.room,
            user: socket.user
        });
        if (!socket.room) return;

        const room = rooms.get(socket.room);
        if (!room || !room.host) return;

        console.log("WEBRTC_VIEWER_READY_SERVER:", {
            host: room.host,
            viewerId: socket.id,
            viewerName: socket.user || "مشاهد"
        });

        io.to(room.host).emit("viewer-ready", {
            viewerId: socket.id,
            viewerName: socket.user || "مشاهد"
        });
    });

    socket.on("webrtc-offer", data => {
        console.log("WEBRTC_OFFER_SERVER:", {
            from: socket.id,
            to: data?.to,
            hasOffer: !!data?.offer
        });
        if (!socket.room || !data || !data.to || !data.offer) return;

        io.to(data.to).emit("webrtc-offer", {
            from: socket.id,
            offer: data.offer
        });
    });

    socket.on("webrtc-answer", data => {
        console.log("WEBRTC_ANSWER_SERVER:", {
            from: socket.id,
            to: data?.to,
            hasAnswer: !!data?.answer
        });
        if (!socket.room || !data || !data.to || !data.answer) return;

        io.to(data.to).emit("webrtc-answer", {
            from: socket.id,
            answer: data.answer
        });
    });

    socket.on("webrtc-ice", data => {
        console.log("WEBRTC_ICE_SERVER:", {
            from: socket.id,
            to: data?.to,
            hasCandidate: !!data?.candidate
        });
        if (!socket.room || !data || !data.to || !data.candidate) return;

        io.to(data.to).emit("webrtc-ice", {
            from: socket.id,
            candidate: data.candidate
        });
    });

    // ===== END WEBRTC SIGNALING BRIDGE =====

    // ===== LIVE ACTIONS BRIDGE =====

    socket.on("start-broadcast", () => {
        if (!socket.room || socket.role !== "host") return;

        const room = rooms.get(socket.room);
        if (!room || room.host !== socket.id) return;

        room.live = true;

        io.to(socket.room).emit("broadcast-state", {
            live: true,
            host: room.hostName || socket.user || "المضيف"
        });

        broadcastRoomState(room);
    });

    
        // إعادة إرسال المشاهدين الموجودين بالفعل للمضيف
        const currentRoom = rooms.get(socket.room);
        if (currentRoom && currentRoom.viewers) {
            for (const [viewerId, viewerName] of currentRoom.viewers.entries()) {
                console.log("WEBRTC_VIEWER_READY_ON_BROADCAST:", {
                    host: socket.id,
                    viewerId,
                    viewerName
                });

                io.to(socket.id).emit("viewer-ready", {
                    viewerId,
                    viewerName: viewerName || "مشاهد"
                });
            }
        }

        socket.on("stop-broadcast", () => {
        if (!socket.room || socket.role !== "host") return;

        const room = rooms.get(socket.room);
        if (!room || room.host !== socket.id) return;

        room.live = false;

        io.to(socket.room).emit("broadcast-state", {
            live: false,
            host: room.hostName || socket.user || "المضيف"
        });

        broadcastRoomState(room);
    });

    socket.on("gift", () => {
        if (!socket.room) return;

        io.to(socket.room).emit("gift", {
            user: socket.user || "زائر",
            text: "🎁 أرسل هدية"
        });
    });

    // ===== END LIVE ACTIONS BRIDGE =====

    socket.on("chat", text => {
        if (!socket.room) return;

        const message = String(text || "").trim();
        if (!message) return;

        io.to(socket.room).emit("chat", {
            user: socket.user || "زائر",
            role: socket.role || "viewer",
            text: message,
            time: new Date().toISOString()
        });
    });

    socket.on("leave-room", () => {
        leaveRoom(socket);
    });

    socket.on("disconnect", () => {
        leaveRoom(socket);
    });
});

function leaveRoom(socket) {
    if (!socket.room) return;

    const roomId = socket.room;
    const room = rooms.get(roomId);

    if (!room) return;

    if (socket.role === "host" && room.host === socket.id) {
        room.host = null;
        room.hostName = null;

        io.to(roomId).emit("system", {
            text: `⛔ المضيف ${socket.user || ""} غادر الغرفة`
        });
    }

    room.viewers.delete(socket.id);

    socket.leave(roomId);

    io.to(roomId).emit("system", {
        text: `🚪 ${socket.user || "زائر"} غادر الغرفة`
    });

    if (room.host || room.viewers.size) {
        broadcastRoomState(room);
    } else {
        rooms.delete(roomId);
    }

    socket.room = null;
    socket.role = null;
}


// ===== MALIK CONSULTANT BRIDGE =====
app.post("/api/malik/chat", async (req, res) => {
    try {
        const response = await fetch("http://127.0.0.1:3000/api/consultant/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: req.body?.message || "",
                history: req.body?.history || []
            })
        });

        const text = await response.text();

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            data = { success:false, reply:text };
        }

        res.status(response.status).json(data);
    } catch (error) {
        console.error("Malik bridge error:", error.message);
        res.status(503).json({
            success:false,
            reply:"خدمة المستشار مالك غير متاحة حالياً."
        });
    }
});

// ===== END MALIK CONSULTANT BRIDGE =====

server.listen(5000, () => {
    console.log("🚀 LIVE PLATFORM");
    console.log("✅ Real rooms enabled");
    console.log("👑 Hosts + 👥 Viewers + 🔢 Live counters");
    console.log("🌐 http://127.0.0.1:5000");
});
