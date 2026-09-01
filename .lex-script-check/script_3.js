
/* =========================================================
   LEX LIVE — ROOM UI CONTROLLER
   الجزء الثالث
========================================================= */

(function(){

    "use strict";

    const $ = id => document.getElementById(id);

    let lexRoom = "";
    let lexAvatar = "🎙️";
    let lexRole = "viewer";
    let lexUser = "زائر";
    let lexLiked = false;
    let lexLikes = 0;
    let lexBroadcasting = false;
    let lexCameraOn = true;
    let lexMicOn = true;
    let lexLocalStream = null;


    /* =====================================================
       OPEN ROOM
    ===================================================== */

    window.lexOpenRoom = function(room, avatar, role){

        lexRoom = String(room || "الغرفة المباشرة");
        lexAvatar = avatar || "🎙️";
        lexRole = role === "host" ? "host" : "viewer";

        const roomElement = $("liveRoom");

        if(!roomElement){
            alert("واجهة الغرفة غير موجودة.");
            return;
        }

        const currentUser =
            window.user ||
            window.currentUser ||
            window.lexUser ||
            "زائر";

        lexUser = String(currentUser);

        roomElement.style.display = "block";

        document.body.style.overflow = "hidden";

        if($("roomAvatar"))
            $("roomAvatar").textContent = lexAvatar;

        if($("roomHostName"))
            $("roomHostName").textContent =
                lexRole === "host"
                    ? lexUser
                    : lexRoom;

        if($("roomEmptyTitle"))
            $("roomEmptyTitle").textContent = lexRoom;

        if($("roomLiveText"))
            $("roomLiveText").textContent =
                lexRole === "host"
                    ? "أنت المضيف"
                    : "مباشر الآن";

        /* إظهار أدوات المضيف فقط */

        if($("hostControls")){

            $("hostControls").style.display =
                lexRole === "host"
                    ? "flex"
                    : "none";

        }

        resetRoomUI();

        /* الانضمام إلى الغرفة الحقيقية */

        if(
            typeof window.socket !== "undefined" &&
            window.socket &&
            window.socket.connected
        ){

            window.socket.emit(
                "join-room",
                {
                    room: lexRoom,
                    user: lexUser,
                    role: lexRole
                }
            );

            if(
                lexRole === "viewer"
            ){

                setTimeout(function(){

                    window.socket.emit(
                        "request-host"
                    );

                },500);

            }

        }

    };


    /* =====================================================
       CLOSE ROOM
    ===================================================== */

    window.lexCloseRoom = function(){

        stopLocalMedia();

        if(
            typeof window.socket !== "undefined" &&
            window.socket &&
            window.socket.connected
        ){

            window.socket.emit(
                "leave-room"
            );

        }

        const roomElement = $("liveRoom");

        if(roomElement)
            roomElement.style.display = "none";

        document.body.style.overflow = "";

        lexRoom = "";

        lexRole = "viewer";

        lexBroadcasting = false;

        resetRoomUI();

    };


    /* =====================================================
       RESET UI
    ===================================================== */

    function resetRoomUI(){

        if($("roomEmpty"))
            $("roomEmpty").style.display = "flex";

        if($("remoteVideos"))
            $("remoteVideos").innerHTML = "";

        if($("roomComments"))
            $("roomComments").innerHTML = "";

        if($("roomViewers"))
            $("roomViewers").textContent = "👁 0";

        if($("roomMessage"))
            $("roomMessage").value = "";

        if($("giftPanel"))
            $("giftPanel").style.display = "none";

        updateHostButtons();

    }


    /* =====================================================
       ROOM CLOSE BUTTON
    ===================================================== */

    const closeButton = $("roomCloseBtn");

    if(closeButton){

        closeButton.addEventListener(
            "click",
            function(){

                window.lexCloseRoom();

            }
        );

    }


    /* =====================================================
       SEND COMMENT
    ===================================================== */

    function sendRoomMessage(){

        const input = $("roomMessage");

        if(!input)
            return;

        const text =
            input.value.trim();

        if(!text)
            return;

        if(
            typeof window.socket !== "undefined" &&
            window.socket &&
            window.socket.connected
        ){

            window.socket.emit(
                "chat",
                text
            );

        }else{

            addComment(
                lexUser,
                text
            );

        }

        input.value = "";

        input.focus();

    }


    const sendButton = $("roomSendBtn");

    if(sendButton){

        sendButton.addEventListener(
            "click",
            sendRoomMessage
        );

    }


    const messageInput = $("roomMessage");

    if(messageInput){

        messageInput.addEventListener(
            "keydown",
            function(event){

                if(event.key === "Enter"){

                    event.preventDefault();

                    sendRoomMessage();

                }

            }
        );

    }


    /* =====================================================
       COMMENTS
    ===================================================== */

    function addComment(user, text){

        const box =
            $("roomComments");

        if(!box)
            return;

        const item =
            document.createElement("div");

        item.className = "comment";

        const strong =
            document.createElement("strong");

        strong.textContent =
            String(user || "زائر") + ":";

        const span =
            document.createElement("span");

        span.textContent =
            String(text || "");

        item.appendChild(strong);

        item.appendChild(span);

        box.appendChild(item);

        while(box.children.length > 12){

            box.removeChild(
                box.firstChild
            );

        }

        setTimeout(
            function(){

                if(item.parentNode)
                    item.parentNode.removeChild(item);

            },
            15000
        );

    }


    /* =====================================================
       LIKE
    ===================================================== */

    const likeButton = $("likeBtn");

    if(likeButton){

        likeButton.addEventListener(
            "click",
            function(){

                lexLiked = !lexLiked;

                if(lexLiked){

                    lexLikes++;

                    createHeart();

                    addComment(
                        lexUser,
                        "❤️ أعجب بالبث"
                    );

                }

            }
        );

    }


    function createHeart(){

        const room =
            $("liveRoom");

        if(!room)
            return;

        const heart =
            document.createElement("div");

        heart.className = "heart";

        heart.textContent = "❤️";

        heart.style.left =
            (20 + Math.random()*60) + "%";

        heart.style.bottom =
            (120 + Math.random()*80) + "px";

        room.appendChild(heart);

        setTimeout(
            function(){

                if(heart.parentNode)
                    heart.parentNode.removeChild(heart);

            },
            1500
        );

    }


    /* =====================================================
       GIFTS
    ===================================================== */

    const giftButton = $("giftBtn");

    if(giftButton){

        giftButton.addEventListener(
            "click",
            function(){

                const panel =
                    $("giftPanel");

                if(!panel)
                    return;

                panel.style.display =
                    panel.style.display === "block"
                        ? "none"
                        : "block";

            }
        );

    }


    document
        .querySelectorAll(".gift-item")
        .forEach(function(button){

            button.addEventListener(
                "click",
                function(){

                    const gift =
                        button.dataset.gift ||
                        "🎁";

                    if(
                        typeof window.socket !== "undefined" &&
                        window.socket &&
                        window.socket.connected
                    ){

                        window.socket.emit(
                            "gift",
                            {
                                gift: gift
                            }
                        );

                    }

                    addComment(
                        lexUser,
                        gift + " أرسل هدية"
                    );

                    if($("giftPanel"))
                        $("giftPanel").style.display =
                            "none";

                }
            );

        });


    /* =====================================================
       SHARE
    ===================================================== */

    const shareButton = $("shareBtn");

    if(shareButton){

        shareButton.addEventListener(
            "click",
            async function(){

                const shareData = {

                    title:
                        "منصة لكس — بث مباشر",

                    text:
                        "انضم إلى " +
                        lexRoom,

                    url:
                        window.location.href

                };

                try{

                    if(
                        navigator.share
                    ){

                        await navigator.share(
                            shareData
                        );

                    }else{

                        await navigator.clipboard.writeText(
                            window.location.href
                        );

                        alert(
                            "تم نسخ رابط المنصة."
                        );

                    }

                }catch(error){

                    console.log(
                        "SHARE_CANCELLED",
                        error
                    );

                }

            }
        );

    }


    /* =====================================================
       CAMERA
    ===================================================== */

    const cameraButton =
        $("cameraBtn");

    if(cameraButton){

        cameraButton.addEventListener(
            "click",
            function(){

                if(!lexLocalStream)
                    return;

                lexCameraOn =
                    !lexCameraOn;

                lexLocalStream
                    .getVideoTracks()
                    .forEach(function(track){

                        track.enabled =
                            lexCameraOn;

                    });

                cameraButton.textContent =
                    lexCameraOn
                        ? "📷 الكاميرا"
                        : "🚫 الكاميرا";

            }
        );

    }


    /* =====================================================
       MICROPHONE
    ===================================================== */

    const micButton =
        $("micBtn");

    if(micButton){

        micButton.addEventListener(
            "click",
            function(){

                if(!lexLocalStream)
                    return;

                lexMicOn =
                    !lexMicOn;

                lexLocalStream
                    .getAudioTracks()
                    .forEach(function(track){

                        track.enabled =
                            lexMicOn;

                    });

                micButton.textContent =
                    lexMicOn
                        ? "🎙️ الميكروفون"
                        : "🔇 الميكروفون";

            }
        );

    }


    /* =====================================================
       START BROADCAST
    ===================================================== */

    const startButton =
        $("startBroadcastBtn");

    if(startButton){

        startButton.addEventListener(
            "click",
            async function(){

                await startBroadcast();

            }
        );

    }


    async function startBroadcast(){

        if(lexRole !== "host"){

            alert(
                "بدء البث متاح للمضيف فقط."
            );

            return;

        }

        if(!lexRoom){

            alert(
                "ادخل غرفة أولاً."
            );

            return;

        }

        try{

            if(
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ){

                alert(
                    "الكاميرا والميكروفون غير مدعومين."
                );

                return;

            }

            lexLocalStream =
                await navigator.mediaDevices.getUserMedia(
                    {
                        video:true,
                        audio:true
                    }
                );

            const video =
                $("localVideo");

            if(video){

                video.srcObject =
                    lexLocalStream;

                video.style.display =
                    "block";

                try{

                    await video.play();

                }catch(error){

                    console.warn(
                        "LOCAL_VIDEO_PLAY",
                        error
                    );

                }

            }

            lexBroadcasting = true;

            if(
                typeof window.socket !== "undefined" &&
                window.socket &&
                window.socket.connected
            ){

                window.socket.emit(
                    "start-broadcast"
                );

            }

            if($("roomEmpty"))
                $("roomEmpty").style.display =
                    "none";

            updateHostButtons();

            addComment(
                "النظام",
                "📹 بدأ المضيف البث المباشر"
            );

        }catch(error){

            console.error(
                "START_BROADCAST_ERROR",
                error
            );

            alert(
                "تعذر تشغيل الكاميرا أو الميكروفون."
            );

        }

    }


    /* =====================================================
       STOP BROADCAST
    ===================================================== */

    const stopButton =
        $("stopBroadcastBtn");

    if(stopButton){

        stopButton.addEventListener(
            "click",
            function(){

                stopBroadcast();

            }
        );

    }


    function stopBroadcast(){

        stopLocalMedia();

        lexBroadcasting = false;

        if(
            typeof window.socket !== "undefined" &&
            window.socket &&
            window.socket.connected
        ){

            window.socket.emit(
                "stop-broadcast"
            );

        }

        updateHostButtons();

        addComment(
            "النظام",
            "⛔ تم إيقاف البث"
        );

    }


    /* =====================================================
       STOP LOCAL MEDIA
    ===================================================== */

    function stopLocalMedia(){

        if(lexLocalStream){

            lexLocalStream
                .getTracks()
                .forEach(function(track){

                    track.stop();

                });

            lexLocalStream = null;

        }

        const video =
            $("localVideo");

        if(video){

            video.srcObject =
                null;

            video.style.display =
                "none";

        }

    }


    /* =====================================================
       HOST BUTTON STATE
    ===================================================== */

    function updateHostButtons(){

        if(
            lexRole !== "host"
        )
            return;

        if($("startBroadcastBtn"))
            $("startBroadcastBtn").style.display =
                lexBroadcasting
                    ? "none"
                    : "block";

        if($("stopBroadcastBtn"))
            $("stopBroadcastBtn").style.display =
                lexBroadcasting
                    ? "block"
                    : "none";

    }


    /* =====================================================
       ROOM STATE FROM SERVER
    ===================================================== */

    function attachSocketEvents(){

        if(
            typeof window.socket === "undefined" ||
            !window.socket
        ){

            return;

        }

        window.socket.on(
            "room-state",
            function(state){

                if(
                    !state ||
                    state.room !== lexRoom
                )
                    return;

                const count =
                    Number(
                        state.viewerCount || 0
                    );

                if($("roomViewers"))
                    $("roomViewers").textContent =
                        "👁 " + count;

                if(
                    $("roomHostName") &&
                    state.host
                ){

                    $("roomHostName").textContent =
                        state.host;

                }

            }
        );


        window.socket.on(
            "broadcast-state",
            function(state){

                if(!state)
                    return;

                if(
                    $("roomHostName") &&
                    state.host
                ){

                    $("roomHostName").textContent =
                        state.host;

                }

                if(state.live){

                    if($("roomEmpty"))
                        $("roomEmpty").style.display =
                            "none";

                    if($("roomLiveText"))
                        $("roomLiveText").textContent =
                            "مباشر الآن";

                }else{

                    if($("roomEmpty"))
                        $("roomEmpty").style.display =
                            "flex";

                    if($("roomLiveText"))
                        $("roomLiveText").textContent =
                            "انتهى البث";

                }

            }
        );


        window.socket.on(
            "chat",
            function(message){

                if(!message)
                    return;

                addComment(
                    message.user ||
                    "زائر",

                    message.text ||
                    ""
                );

            }
        );


        window.socket.on(
            "system",
            function(message){

                if(
                    message &&
                    message.text
                ){

                    addComment(
                        "النظام",
                        message.text
                    );

                }

            }
        );


        window.socket.on(
            "gift",
            function(data){

                if(!data)
                    return;

                addComment(
                    data.user ||
                    "زائر",

                    data.text ||
                    "🎁 أرسل هدية"
                );

            }
        );


        window.socket.on(
            "join-error",
            function(message){

                alert(
                    message ||
                    "تعذر دخول الغرفة."
                );

            }
        );

    }


    /* =====================================================
       INITIALIZE
    ===================================================== */

    if(
        document.readyState === "loading"
    ){

        document.addEventListener(
            "DOMContentLoaded",
            attachSocketEvents
        );

    }else{

        attachSocketEvents();

    }


    /* =====================================================
       COMPATIBILITY
       أسماء عامة للاستخدام مع الواجهة القديمة
    ===================================================== */

    window.openLexRoom =
        window.lexOpenRoom;

    window.closeLexRoom =
        window.lexCloseRoom;

    window.startLexBroadcast =
        startBroadcast;

    window.stopLexBroadcast =
        stopBroadcast;


})();
