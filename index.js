window.onload = function () {
    window.wallpaperPropertyListener = {
        applyUserProperties: function (properties) {
            if (properties.charset) {
                char_set = properties.charset.value;
                updateCharSet();
            }
            if (properties.fontsize) {
                font_size = properties.fontsize.value;
                updateFontSize();
            }
            if (properties.matrixspeed)
                fpsInterval = 1000 / properties.matrixspeed.value;

            startAnimating();
        }
    };

    var fps, fpsInterval, startTime, now, then, elapsed, font_size, char_set, letters, columns, drops;
    var c = document.getElementById("neomatrix");
    var ctx = c.getContext("2d");

    c.height = window.innerHeight;
    c.width = window.innerWidth;

    updateCharSet();
    updateFontSize();

    function updateCharSet() {
        if (char_set == 0)
            letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        else if (char_set == 1)
            letters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        else if (char_set == 2)
            letters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ()._,-=+*/\\:;\'\"";
        else if (char_set == 3)
            letters = "1234567890アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン日ZTHEMATRIX:・.\"=*+-<>¦｜_╌";
        else if (char_set == 4)
            letters = "01";
        letters = letters.split("");
    }

    function updateFontSize() {
        ctx.font = font_size + "px monospace";

        columns = c.width / font_size;
        drops = [];
        for (var x = 0; x < columns; x++)
            drops[x] = 1;
    }

    function drawmatrix() {
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.fillStyle = "#0F0";

        for (var i = 0; i < drops.length; i++) {
            var text = letters[Math.floor(Math.random() * letters.length)];
            ctx.fillText(text, i * font_size, drops[i] * font_size);
            if (drops[i] * font_size > c.height && Math.random() > 0.975)
                drops[i] = 0;

            drops[i]++;
        }
    }

    window.addEventListener('resize', function () {
        c.height = window.innerHeight;
        c.width = window.innerWidth;
        columns = c.width / font_size;
        drops = [];
        for (var x = 0; x < columns; x++)
            drops[x] = 1;
    }, false);

    function loop() {
        window.requestAnimationFrame(loop);
        now = Date.now();
        elapsed = now - then;
        if (elapsed > fpsInterval) {
            then = now - (elapsed % fpsInterval);
            drawmatrix();
        }

    }

    function startAnimating() {
        then = Date.now();
        startTime = then;
        loop();
    }
};

