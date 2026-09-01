
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

    function connectRoomCards(){

        const cards =
            document.querySelectorAll(
                ".room"
            );


        cards.forEach(function(card){

            if(
                card.dataset.lexConnected ===
                "true"
            )
                return;


            const title =
                card.querySelector("h2");


            const avatar =
                card.querySelector(
                    ".avatar"
                );


            if(!title)
                return;


            const room =
                title.textContent.trim();


            const icon =
                avatar
                    ? avatar.textContent.trim()
                    : "🎙️";


            card.dataset.lexConnected =
                "true";


            card.onclick =
                function(event){

                    event.preventDefault();

                    event.stopPropagation();

                    window.lexChooseRoom(
                        room,
                        icon
                    );

                };

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
