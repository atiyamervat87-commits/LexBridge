


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



function initChatSystem() {
    const sendBtn = document.getElementById('roomSendBtn') || document.querySelector('.room-send');
    const inputField = document.getElementById('roomInput') || document.querySelector('.room-input');
    const commentsContainer = document.getElementById('roomComments') || document.querySelector('.room-comments');

    if (sendBtn && inputField) {
        // إزالة أيlisteners قديمة لتجنب التكرار
        const newSendBtn = sendBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);

        newSendBtn.addEventListener('click', () => {
            const text = inputField.value.trim();
            if (text) {
                if (commentsContainer) {
                    const msgDiv = document.createElement('div');
                    msgDiv.className = 'chat-message';
                    msgDiv.innerHTML = `<span class="author">أنت:</span> <span class="text">${text}</span>`;
                    commentsContainer.appendChild(msgDiv);
                    commentsContainer.scrollTop = commentsContainer.scrollHeight;
                }
                // إرسال عبر Socket.IO لو متاح
                if (typeof socket !== 'undefined' && socket) {
                    socket.emit('chat-message', { message: text });
                }
                inputField.value = '';
            }
        });
    }
}
// تشغيل النظام عند فتح الغرفة
document.addEventListener('DOMContentLoaded', initChatSystem);



window.addEventListener('DOMContentLoaded', () => {
    // إزالة نصوص الـ CSS المتناثرة إن وجدت
    document.querySelectorAll('*').forEach(el => {
        if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
            let txt = el.childNodes[0].nodeValue.trim();
            if (txt.includes('l-gradient') || (txt.includes('rgb(') && txt.includes('circle'))) {
                el.style.display = 'none';
                el.remove();
            }
        }
    });

    // البحث عن زر بدء البث وتفعيل البث الآمن
    const allBtns = document.querySelectorAll('button');
    allBtns.forEach(btn => {
        if (btn.textContent.includes('بدء البث') && !btn.dataset.safeBound) {
            btn.dataset.safeBound = 'true';
            
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                
                // الكاميرا والميكروفون معطّلان في LexBridge.
                // لا يتم طلب أي صلاحيات للأجهزة.

                // تفعيل حالة البث فوراً بغض النظر عن أذونات الجهاز
                newBtn.textContent = '⏹️ إيقاف البث';
                newBtn.style.backgroundColor = '#e74c3c';
                newBtn.style.color = '#fff';
                
                const statusEl = document.querySelector('.room-status, div:has-text("في انتظار")');
                if(statusEl) statusEl.textContent = '🔴 البث مباشر الآن';

                // رسالة نجاح في الشاشة والدردشة
                const comments = document.getElementById('roomComments') || document.querySelector('.room-comments');
                if (comments) {
                    const msg = document.createElement('div');
                    msg.style.cssText = 'color: #2ecc71; font-weight: bold; margin: 5px 0; background: rgba(46,204,113,0.1); padding: 5px; border-radius: 5px;';
                    msg.innerHTML = 'النظام: 🔴 بدأ البث المباشر بنجاح وتفعيل غرفة المضيف!';
                    comments.appendChild(msg);
                    comments.scrollTop = comments.scrollHeight;
                }
                
                if (typeof socket !== 'undefined' && socket) {
                    socket.emit('start-broadcast');
                }
            });
        }
    });
});



window.addEventListener('DOMContentLoaded', () => {
    // البحث عن أي عنصر مكتوب عليه "بث مباشر" أو أيقونة الكاميرا/البث في القوائم
    document.querySelectorAll('a, button, div, span').forEach(el => {
        if (el.textContent.includes('بث مباشر') || el.textContent.includes('📹')) {
            // تجنب تكرار إضافة الحدث
            if (!el.dataset.navBound) {
                el.dataset.navBound = 'true';
                el.style.cursor = 'pointer';
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log("Broadcast nav clicked!");
                    
                    // محاولة إظهار قسم البث أو التوجيه لصفحة البث إن وجد
                    const broadcastSection = document.querySelector('.broadcast-section, #broadcast-view, .room-container') || document.querySelector('div:has-text("في انتظار")');
                    if (broadcastSection) {
                        broadcastSection.style.display = 'block';
                        broadcastSection.scrollIntoView({ behavior: 'smooth' });
                    } else {
                        // لو لم يوجد قسم مباشر، نقوم بفتح الغرفة الأولى افتراضياً لتجربة البث
                        alert("الانتقال إلى لوحة البث المباشر وغرفة التحكم للمضيف!");
                    }
                });
            }
        }
    });
});



window.addEventListener('DOMContentLoaded', () => {
    // 1. تنظيف أي نصوص CSS ظاهرة بالخطأ
    document.querySelectorAll('*').forEach(el => {
        if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
            let txt = el.childNodes[0].nodeValue.trim();
            if (txt.includes('l-gradient') || (txt.includes('rgb(') && txt.includes('circle'))) {
                el.style.display = 'none';
                el.remove();
            }
        }
    });

    // 2. إصلاح استجابة زر "البث المباشر" وأزرار التنقل لمنع الوميض البصري
    document.querySelectorAll('a, button, div, span').forEach(el => {
        let text = el.textContent.trim();
        if (text === 'بث مباشر' || text.includes('📹 بث مباشر')) {
            el.style.cursor = 'pointer';
            el.onclick = (e) => {
                e.preventDefault();
                // إظهار قسم البث بسلاسة
                const roomView = document.querySelector('.room-container, #roomView, .room-box') || document.querySelector('div:has-text("في انتظار")');
                if (roomView) {
                    roomView.style.display = 'block';
                    roomView.scrollIntoView({ behavior: 'smooth' });
                } else {
                    alert('أهلاً بك في منصة البث المباشر - الغرفة جاهزة للاستخدام!');
                }
            };
        }
    });

    // 3. تفعيل أزرار التفاعل داخل الغرفة (إعجاب، هدية، مشاركة، وبدء البث)
    document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.includes('بدء البث') && !btn.dataset.proBound) {
            btn.dataset.proBound = 'true';
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                newBtn.textContent = '⏹️ إيقاف البث';
                newBtn.style.background = 'linear-gradient(135deg, #ff416c, #ff4b2b)';
                newBtn.style.color = '#fff';
                
                const comments = document.getElementById('roomComments') || document.querySelector('.room-comments');
                if (comments) {
                    const msg = document.createElement('div');
                    msg.style.cssText = 'color: #2ecc71; font-weight: bold; margin: 8px 0; background: rgba(46,204,113,0.12); padding: 8px 12px; border-radius: 8px; border-right: 4px solid #2ecc71;';
                    msg.innerHTML = '⚡ النظام الاحترافي: 🔴 بدأ البث المباشر بنجاح وتفعيل غرفة المضيف!';
                    comments.appendChild(msg);
                    comments.scrollTop = comments.scrollHeight;
                }
            });
        }
    });
});



function openMalikAdvisor(){
  const m=document.getElementById("malikAdvisorModal");
  if(m) m.style.display="flex";
}

function closeMalikAdvisor(){
  const m=document.getElementById("malikAdvisorModal");
  if(m) m.style.display="none";
}

async function openMalikChat(){
  closeMalikAdvisor();

  try {
    const res = await fetch("/api/malik/health", {
      method: "GET",
      cache: "no-store"
    });

    if (!res.ok) throw new Error("MALIK_SERVER_UNAVAILABLE");

    const data = await res.json();

    if (data && data.success) {
      window.location.href = "/malik-chat.html";
      return;
    }

    throw new Error("MALIK_SERVER_UNAVAILABLE");

  } catch (error) {
    alert("⚖️ مستشار مالك غير متاح حالياً. تأكد من تشغيل مستودع مالك داخل المنصة.");
  }
}

document.addEventListener("click",function(e){
  const m=document.getElementById("malikAdvisorModal");
  if(e.target===m) closeMalikAdvisor();
});




(function(){

    const spirit = document.getElementById("lexSpirit");
    const title = document.getElementById("lexSpiritTitle");
    const text = document.getElementById("lexSpiritText");

    let spiritTimer = null;

    window.lexSpirit = function(message, heading){

        if(!spirit || !text) return;

        if(heading)
            title.textContent = heading;

        text.textContent = message;

        spirit.style.display = "block";

        clearTimeout(spiritTimer);

        spiritTimer = setTimeout(function(){
            spirit.style.display = "none";
        }, 6500);
    };

    document.addEventListener("DOMContentLoaded", function(){

        setTimeout(function(){

            window.lexSpirit(
                "أهلاً بك في الهلباوي LexBridge. اختر ما تريد، وأنا سأرشدك للخطوة المناسبة.",
                "⚡ روح LexBridge"
            );

        }, 900);

    });

    window.addEventListener("beforeunload", function(){

        try{
            sessionStorage.setItem(
                "lexbridge_last_visit",
                Date.now().toString()
            );
        }catch(e){}

    });

})();





(function(){

    function safeSpirit(msg, title){
        if(typeof window.lexSpirit === "function"){
            window.lexSpirit(msg, title);
        }
    }

    document.addEventListener("click", function(e){

        const id = e.target && e.target.id;

        if(id === "startBroadcastBtn"){
            safeSpirit(
                "ابدأ عندما تكون جاهزًا. سأساعدك في التأكد من الصوت والصورة واتصال الغرفة.",
                "🔴 تجهيز البث"
            );
        }

        if(id === "stopBroadcastBtn"){
            safeSpirit(
                "تم إيقاف البث. يمكنك العودة للغرفة أو الانتقال إلى خدمة أخرى.",
                "⛔ انتهى البث"
            );
        }

        if(id === "cameraBtn"){
            safeSpirit(
                "الكاميرا تحت سيطرتك. يمكنك تشغيلها أو إيقافها في أي وقت أثناء البث.",
                "📷 الكاميرا"
            );
        }

        if(id === "micBtn"){
            safeSpirit(
                "الميكروفون تحت سيطرتك. يمكنك الكتم أو إعادة الصوت في أي وقت.",
                "🎙️ الميكروفون"
            );
        }

        if(id === "likeBtn"){
            safeSpirit(
                "إعجابك وصل للمضيف ❤️",
                "❤️ تفاعل"
            );
        }

        if(id === "giftBtn"){
            safeSpirit(
                "اختر الهدية التي تريد إرسالها.",
                "🎁 هدية"
            );
        }

        if(id === "shareBtn"){
            safeSpirit(
                "يمكنك مشاركة الغرفة مع من تريد.",
                "↗️ مشاركة"
            );
        }

        if(id === "malikAdvisorBtn"){
            safeSpirit(
                "مالك موجود لمساعدتك عندما تحتاج إلى إرشاد.",
                "⚖️ المستشار مالك"
            );
        }

    });

})();




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
       CAMERA / MICROPHONE — DISABLED
       LexBridge broadcast does not request device media.
    ===================================================== */

    const cameraButton = $("cameraBtn");
    const micButton = $("micBtn");

    if(cameraButton){
        cameraButton.style.display = "none";
    }

    if(micButton){
        micButton.style.display = "none";
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
            alert("بدء البث متاح للمضيف فقط.");
            return;
        }

        if(!lexRoom){
            alert("ادخل غرفة أولاً.");
            return;
        }

        try{

            if(
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ){
                alert("الجهاز أو المتصفح لا يدعم الكاميرا والميكروفون.");
                return;
            }

            lexLocalStream =
                await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });

            const video = $("localVideo");

            if(video){
                video.srcObject = lexLocalStream;
                video.style.display = "block";

                try{
                    await video.play();
                }catch(error){
                    console.warn("LOCAL_VIDEO_PLAY", error);
                }
            }

            lexBroadcasting = true;

            if(
                typeof window.socket !== "undefined" &&
                window.socket &&
                window.socket.connected
            ){
                window.socket.emit("start-broadcast");
            }

            if($("roomEmpty"))
                $("roomEmpty").style.display = "none";

            updateHostButtons();

            addComment(
                "النظام",
                "⚡ بدأ البث المباشر بالصوت والصورة"
            );

        }catch(error){

            console.error("START_BROADCAST_ERROR", error);

            alert(
                "تعذر تشغيل الكاميرا أو الميكروفون. تأكد من منح صلاحية الوصول للجهاز."
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



/* =========================================================
   LEX LIVE — PLATFORM NAVIGATION BRIDGE
   الجزء الرابع
========================================================= */

(function(){

    "use strict";

    const $ = id => document.getElementById(id);

    let lexSelectedRoom = "";
    let lexSelectedAvatar = "🎙️";


    /* =====================================================
       USER NAME
    ===================================================== */

    function getLexUser(){

        return String(
            window.user ||
            window.currentUser ||
            window.lexUser ||
            $("loginName")?.value ||
            "زائر"
        ).trim() || "زائر";

    }


    /* =====================================================
       ROOM ENTRY MODAL
    ===================================================== */

    window.lexChooseRoom = function(room, avatar){

        lexSelectedRoom =
            String(room || "الغرفة المباشرة");

        lexSelectedAvatar =
            avatar || "🎙️";

        const old =
            document.getElementById(
                "lexEntryModal"
            );

        if(old)
            old.remove();


        const modal =
            document.createElement("div");

        modal.id =
            "lexEntryModal";

        modal.style.cssText = `
            position:fixed;
            inset:0;
            z-index:100000;
            display:grid;
            place-items:center;
            padding:20px;
            background:rgba(0,0,0,.78);
            backdrop-filter:blur(12px);
        `;


        modal.innerHTML = `

            <div style="
                width:min(390px,100%);
                background:#15151c;
                border:1px solid rgba(255,255,255,.1);
                border-radius:26px;
                padding:24px;
                box-shadow:0 25px 80px #000;
                text-align:center;
            ">

                <div style="
                    width:76px;
                    height:76px;
                    margin:0 auto 14px;
                    border-radius:24px;
                    background:#24242d;
                    display:grid;
                    place-items:center;
                    font-size:36px;
                ">
                    ${lexSelectedAvatar}
                </div>

                <h2 style="
                    margin:0 0 7px;
                    font-size:21px;
                ">
                    ${escapeHTML(lexSelectedRoom)}
                </h2>

                <p style="
                    margin:0 0 20px;
                    color:#9999a5;
                    font-size:12px;
                ">
                    اختر طريقة الدخول إلى الغرفة
                </p>


                <button
                    id="lexHostEntry"
                    type="button"
                    style="
                        width:100%;
                        padding:14px;
                        border:0;
                        border-radius:16px;
                        background:#ff2456;
                        color:#fff;
                        font-weight:900;
                        font-size:13px;
                    "
                >
                    👑 دخول كمضيف
                </button>


                <button
                    id="lexViewerEntry"
                    type="button"
                    style="
                        width:100%;
                        padding:14px;
                        margin-top:10px;
                        border:1px solid #34343e;
                        border-radius:16px;
                        background:#202027;
                        color:#fff;
                        font-weight:800;
                        font-size:13px;
                    "
                >
                    👥 دخول كمشاهد
                </button>


                <button
                    id="lexCancelEntry"
                    type="button"
                    style="
                        width:100%;
                        padding:12px;
                        margin-top:10px;
                        border:0;
                        background:transparent;
                        color:#92929d;
                        font-size:12px;
                    "
                >
                    إلغاء
                </button>

            </div>
        `;


        document.body.appendChild(modal);


        $("lexHostEntry").onclick =
            function(){

                enterLexRoom("host");

            };


        $("lexViewerEntry").onclick =
            function(){

                enterLexRoom("viewer");

            };


        $("lexCancelEntry").onclick =
            function(){

                modal.remove();

            };

    };


    /* =====================================================
       ENTER ROOM
    ===================================================== */

    function enterLexRoom(role){

        const modal =
            $("lexEntryModal");

        if(modal)
            modal.remove();


        const name =
            getLexUser();


        window.user =
            name;

        window.currentUser =
            name;

        window.lexUser =
            name;

        window.currentRole =
            role;


        if(
            typeof window.lexOpenRoom ===
            "function"
        ){

            window.lexOpenRoom(
                lexSelectedRoom,
                lexSelectedAvatar,
                role
            );

        }else{

            console.error(
                "LEX_OPEN_ROOM_NOT_FOUND"
            );

            alert(
                "تعذر فتح غرفة البث."
            );

        }

    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHTML(value){

        return String(value || "")
            .replace(/&/g,"&amp;")
            .replace(/</g,"&lt;")
            .replace(/>/g,"&gt;")
            .replace(/"/g,"&quot;")
            .replace(/'/g,"&#039;");

    }


    /* =====================================================
       CONNECT EXISTING ROOM CARDS
    ===================================================== */

    function connectRoomCards() {
    const cards = document.querySelectorAll('.live-card, .room');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const roomTitleElement = card.querySelector('.description, .card-info .description');
            const coverElement = card.querySelector('.cover');
            const roomName = roomTitleElement ? roomTitleElement.innerText.trim() : 'غرفة بث مباشر';
            let avatarUrl = 'default-avatar.png';
            if (coverElement) {
                const bgImage = window.getComputedStyle(coverElement).backgroundImage;
                if (bgImage && bgImage !== 'none') {
                    avatarUrl = bgImage.slice(5, -2).replace(/['\""]/g, '');
                }
            }
            if (typeof window.lexChooseRoom === 'function') {
                window.lexChooseRoom(roomName, avatarUrl);
            }
        });
    });
}


    /* =====================================================
       LOGIN BRIDGE
    ===================================================== */

    const loginButton =
        $("loginBtn");


    if(loginButton){

        loginButton.addEventListener(
            "click",
            function(){

                const input =
                    $("loginName");


                if(!input)
                    return;


                const name =
                    input.value.trim();


                if(!name)
                    return;


                window.user =
                    name;

                window.currentUser =
                    name;

                window.lexUser =
                    name;


                if($("accountUser"))
                    $("accountUser").textContent =
                        name;

            }
        );

    }


    /* =====================================================
       UPDATE ACCOUNT
    ===================================================== */

    function updateAccount(){

        const name =
            getLexUser();


        if($("accountUser"))
            $("accountUser").textContent =
                name;


        if($("accountRoom")){

            const room =
                window.currentRoom ||
                window.lexSelectedRoom ||
                "";

            $("accountRoom").textContent =
                room || "لا توجد غرفة";

        }

    }


    /* =====================================================
       OBSERVE NAVIGATION
    ===================================================== */

    document
        .querySelectorAll(".nav")
        .forEach(function(button){

            button.addEventListener(
                "click",
                function(){

                    setTimeout(
                        updateAccount,
                        50
                    );

                }
            );

        });


    /* =====================================================
       PERIODIC ROOM CARD SYNC
    ===================================================== */

    function syncLexInterface(){

        connectRoomCards();

        updateAccount();

    }


    if(
        document.readyState ===
        "loading"
    ){

        document.addEventListener(
            "DOMContentLoaded",
            syncLexInterface
        );

    }else{

        syncLexInterface();

    }


    setTimeout(
        syncLexInterface,
        300
    );


    setTimeout(
        syncLexInterface,
        1000
    );


    setTimeout(
        syncLexInterface,
        2000
    );


    /* =====================================================
       SOCKET CONNECTION STATUS
    ===================================================== */

    function updateLexConnection(){

        const connected =
            typeof window.socket !==
            "undefined" &&
            window.socket &&
            window.socket.connected;


        const text =
            connected
                ? "🟢 متصل"
                : "🔴 غير متصل";


        if($("connectionText"))
            $("connectionText").textContent =
                text;


        if($("accountConnection"))
            $("accountConnection").textContent =
                connected
                    ? "🟢 متصل بالخادم"
                    : "🔴 غير متصل بالخادم";

    }


    setInterval(
        updateLexConnection,
        1000
    );


    /* =====================================================
       SAFE GLOBAL OPEN
    ===================================================== */

    window.openRoom =
        function(room, avatar){

            window.lexChooseRoom(
                room,
                avatar
            );

        };


    /* =====================================================
       SAFE GLOBAL CLOSE
    ===================================================== */

    window.closeRoom =
        function(){

            if(
                typeof window.lexCloseRoom ===
                "function"
            ){

                window.lexCloseRoom();

            }

        };


})();



/* =========================================================
   LEX LIVE — VISUAL UI ENHANCEMENT
   الجزء السادس
   واجهة موبايل مستوحاة من تطبيقات البث الحي
========================================================= */

(function(){

    "use strict";

    const style = document.createElement("style");

    style.id = "lex-live-visual-enhancement";

    style.textContent = `

    /* =====================================================
       GLOBAL
    ===================================================== */

    html, body{
        background:
            radial-gradient(
                circle at 50% -10%,
                #252530 0,
                #0a0a0f 42%,
                #050507 100%
            ) !important;
    }

    body{
        font-family:
            Arial,
            "Noto Sans Arabic",
            sans-serif !important;
    }


    /* =====================================================
       APP HEADER
    ===================================================== */

    .header{
        background:
            rgba(7,7,11,.88) !important;

        border-bottom:
            1px solid rgba(255,255,255,.07) !important;

        backdrop-filter:
            blur(22px) !important;

        padding:
            12px 15px !important;
    }


    .brand-mark{
        width:44px !important;
        height:44px !important;

        border-radius:
            15px !important;

        background:
            linear-gradient(
                145deg,
                #ff315e,
                #d9003e
            ) !important;

        box-shadow:
            0 8px 25px
            rgba(255,30,80,.28);
    }


    .brand-title{
        font-size:16px !important;
        letter-spacing:.2px;
    }


    .brand-sub{
        color:#777783 !important;
    }


    .connection{
        padding:
            7px 10px;

        border-radius:
            12px;

        background:
            rgba(255,255,255,.045);

        border:
            1px solid
            rgba(255,255,255,.06);
    }


    /* =====================================================
       MAIN
    ===================================================== */

    .main{
        padding:
            14px 13px 105px !important;
    }


    /* =====================================================
       HERO
    ===================================================== */

    .hero{
        position:relative;

        overflow:hidden;

        min-height:
            180px;

        display:flex;

        flex-direction:
            column;

        justify-content:
            flex-end;

        padding:
            22px 20px !important;

        border-radius:
            26px !important;

        margin-bottom:
            20px !important;

        background:
            linear-gradient(
                145deg,
                #272733,
                #121219 70%
            ) !important;

        border:
            1px solid
            rgba(255,255,255,.07);

        box-shadow:
            0 20px 55px
            rgba(0,0,0,.35);
    }


    .hero:before{
        content:"";

        position:absolute;

        width:180px;
        height:180px;

        top:-90px;
        left:-45px;

        border-radius:50%;

        background:
            rgba(255,28,82,.13);

        filter:
            blur(10px);
    }


    .hero h1,
    .hero p{
        position:relative;
        z-index:2;
    }


    .hero h1{
        font-size:
            25px !important;

        font-weight:
            900 !important;

        margin-bottom:
            7px !important;
    }


    .hero p{
        color:
            #a4a4b0 !important;

        font-size:
            13px;

        max-width:
            330px;
    }


    /* =====================================================
       SECTION HEADER
    ===================================================== */

    .section-title{
        margin:
            18px 3px 12px !important;
    }


    .section-title h2{
        font-size:
            18px !important;

        font-weight:
            900;
    }


    .section-title span{
        color:
            #73737e !important;
    }


    /* =====================================================
       ROOM CARDS
    ===================================================== */

    .rooms{
        gap:
            12px !important;
    }


    .room{
        position:relative;

        overflow:hidden;

        padding:
            15px !important;

        border-radius:
            22px !important;

        background:
            linear-gradient(
                145deg,
                #18181f,
                #111116
            ) !important;

        border:
            1px solid
            rgba(255,255,255,.065) !important;

        box-shadow:
            0 12px 35px
            rgba(0,0,0,.20);

        transition:
            transform .15s ease,
            border-color .15s ease;
    }


    .room:active{
        transform:
            scale(.975) !important;

        border-color:
            rgba(255,35,85,.35) !important;
    }


    .room:after{
        content:"";

        position:absolute;

        top:0;
        right:0;

        width:85px;
        height:85px;

        border-radius:
            0 0 0 100%;

        background:
            rgba(255,30,80,.035);

        pointer-events:
            none;
    }


    .room-top{
        position:relative;
        z-index:2;
    }


    /* =====================================================
       AVATAR
    ===================================================== */

    .avatar{
        width:
            58px !important;

        height:
            58px !important;

        border-radius:
            19px !important;

        background:
            linear-gradient(
                145deg,
                #30303a,
                #202028
            ) !important;

        border:
            2px solid
            rgba(255,255,255,.07);

        box-shadow:
            0 8px 22px
            rgba(0,0,0,.3);

        font-size:
            28px !important;
    }


    /* =====================================================
       LIVE BADGE
    ===================================================== */

    .live{
        padding:
            6px 9px;

        border-radius:
            10px;

        background:
            rgba(255,25,75,.10);

        color:
            #ff5277 !important;

        border:
            1px solid
            rgba(255,40,90,.14);
    }


    .room h2{
        font-size:
            17px !important;

        font-weight:
            900 !important;

        margin:
            13px 0 5px !important;
    }


    .room p{
        color:
            #858590 !important;
    }


    /* =====================================================
       PROFILE
    ===================================================== */

    .profile{
        padding:
            18px !important;

        border-radius:
            23px !important;

        background:
            linear-gradient(
                145deg,
                #1b1b23,
                #121218
            ) !important;

        border:
            1px solid
            rgba(255,255,255,.07) !important;
    }


    .profile-avatar{
        width:
            62px !important;

        height:
            62px !important;

        border-radius:
            20px !important;

        background:
            #24242d !important;
    }


    /* =====================================================
       STATUS CARDS
    ===================================================== */

    .status{
        gap:
            10px !important;
    }


    .status-card{
        border-radius:
            19px !important;

        background:
            #15151c !important;

        border:
            1px solid
            rgba(255,255,255,.06) !important;

        padding:
            16px !important;
    }


    .status-card small{
        color:
            #72727d !important;
    }


    /* =====================================================
       BOTTOM NAV
    ===================================================== */

    .bottom{
        padding:
            7px 7px
            calc(7px + env(safe-area-inset-bottom))
            !important;

        background:
            rgba(9,9,13,.92) !important;

        border-top:
            1px solid
            rgba(255,255,255,.07) !important;

        backdrop-filter:
            blur(25px) !important;
    }


    .bottom-inner{
        max-width:
            520px !important;
    }


    .nav{
        color:
            #666671 !important;

        border-radius:
            14px;

        padding:
            7px 3px !important;

        transition:
            .15s ease;
    }


    .nav span{
        font-size:
            20px !important;
    }


    .nav.active{
        color:
            #fff !important;

        background:
            rgba(255,255,255,.055);
    }


    /* =====================================================
       ROOM SHELL
    ===================================================== */

    .room-shell{
        width:
            100%;

        min-height:
            calc(100vh - 20px);

        padding:
            12px;

        background:
            #08080d;

        border-radius:
            24px;

        border:
            1px solid
            rgba(255,255,255,.06);
    }


    .room-header{
        display:flex;

        align-items:center;

        justify-content:
            space-between;

        gap:10px;

        padding:
            8px 2px 14px;
    }


    .room-title-wrap h2{
        margin:
            0 !important;

        font-size:
            19px;

        font-weight:
            900;
    }


    .room-title-wrap p{
        margin:
            4px 0 0;

        color:
            #777782;

        font-size:
            11px;
    }


    /* =====================================================
       MEDIA STAGE
    ===================================================== */

    .media-stage{
        position:relative;

        overflow:hidden;

        min-height:
            280px;

        border-radius:
            22px;

        background:
            radial-gradient(
                circle at 50% 20%,
                #292932,
                #09090d 70%
            );

        border:
            1px solid
            rgba(255,255,255,.07);

        box-shadow:
            0 20px 55px
            rgba(0,0,0,.35);
    }


    #localVideo,
    #remoteVideos video{
        width:
            100% !important;

        height:
            auto;

        min-height:
            280px;

        max-height:
            65vh;

        object-fit:
            cover;

        background:
            #000;

        border-radius:
            22px;
    }


    #remoteVideos{
        width:
            100%;
    }


    .media-empty{
        position:absolute;

        inset:0;

        display:flex;

        align-items:center;

        justify-content:center;

        text-align:center;

        z-index:1;

        padding:30px;
    }


    .media-empty strong{
        display:block;

        font-size:
            20px;

        margin-bottom:
            8px;
    }


    .media-empty span{
        display:block;

        color:
            #777782;

        font-size:
            12px;
    }


    /* =====================================================
       MEDIA CONTROLS
    ===================================================== */

    .media-controls{
        display:grid;

        grid-template-columns:
            1fr 1fr;

        gap:
            9px;

        margin-top:
            10px;
    }


    .media-controls button{
        width:
            100% !important;

        border-radius:
            15px !important;

        padding:
            13px 8px !important;

        font-size:
            12px;
    }


    /* =====================================================
       CHAT
    ===================================================== */

    .chat-area{
        margin-top:
            14px;

        padding:
            14px;

        border-radius:
            21px;

        background:
            #111117;

        border:
            1px solid
            rgba(255,255,255,.06);
    }


    .chat-area > p{
        color:
            #9999a5;

        font-size:
            12px;

        font-weight:
            800;
    }


    #log{
        max-height:
            230px;

        overflow-y:
            auto;

        padding:
            2px;
    }


    .chat-compose{
        display:grid;

        grid-template-columns:
            1fr auto;

        gap:
            7px;

        margin-top:
            10px;
    }


    .chat-compose .input{
        margin:
            0 !important;
    }


    .chat-compose .primary{
        width:
            auto !important;

        padding:
            12px 16px;
    }


    /* =====================================================
       BUTTONS
    ===================================================== */

    .primary{
        background:
            linear-gradient(
                135deg,
                #ff315e,
                #e60042
            ) !important;

        box-shadow:
            0 8px 22px
            rgba(255,30,80,.18);

        border-radius:
            15px !important;
    }


    .secondary{
        background:
            #1b1b23 !important;

        border:
            1px solid
            rgba(255,255,255,.08) !important;

        border-radius:
            15px !important;
    }


    .input{
        background:
            #0c0c11 !important;

        border:
            1px solid
            rgba(255,255,255,.08) !important;

        border-radius:
            15px !important;
    }


    /* =====================================================
       DISCOVER / EMPTY
    ===================================================== */

    .empty{
        padding:
            55px 20px !important;

        border-radius:
            23px !important;

        background:
            #15151c !important;

        border:
            1px solid
            rgba(255,255,255,.06) !important;
    }


    /* =====================================================
       SMALL SCREENS
    ===================================================== */

    @media(max-width:380px){

        .main{
            padding-left:
                9px !important;

            padding-right:
                9px !important;
        }

        .hero{
            min-height:
                165px;
        }

        .media-controls{
            grid-template-columns:
                1fr;
        }

    }


    /* =====================================================
       SAFE AREA
    ===================================================== */

    @supports(padding:max(0px)){

        .header{
            padding-top:
                max(
                    12px,
                    env(safe-area-inset-top)
                ) !important;
        }

    }

    `;


    document.head.appendChild(style);


    /* =====================================================
       ROOM BACK BUTTON
    ===================================================== */

    const oldClose =
        window.closeRoom;


    window.closeRoom =
        function(){

            if(
                typeof oldClose ===
                "function"
            ){

                try{
                    oldClose();
                }catch(error){
                    console.warn(
                        "LEX_CLOSE_ROOM:",
                        error
                    );
                }

            }


            const chat =
                document.getElementById(
                    "chat"
                );


            if(chat){

                chat.style.display =
                    "none";

            }

        };


})();
