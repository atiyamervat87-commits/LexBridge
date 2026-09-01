
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
