window.onload = function () {
    window.wallpaperPropertyListener = {
        applyUserProperties: function (properties) {
            if (properties.charset)
                char_set = properties.charset.value;
            if (properties.customcharset)
                custom_char_set = properties.customcharset.value;
            if (properties.charset || properties.customcharset)
                updateCharSet();

            if (properties.font)
                font = properties.font.value;
            if (properties.customfontname)
                custom_font_name = properties.customfontname.value;
            if (properties.fontsize)
                font_size = properties.fontsize.value;
            if (properties.font || properties.customfontname || properties.fontsize)
                updateFont();

            if (properties.traillength)
                trail_length = map(properties.traillength.value, 0.0, 1.0, 0.35, 0.02);

            if (properties.matrixspeed)
                fpsInterval = 1000 / properties.matrixspeed.value;

            startAnimating();
        }
    };

    var fpsInterval, startTime, now, then, elapsed, letters, columns, drops, trail_length = 0.05, char_set = "1", custom_char_set, font_size, font = "0", custom_font_name;
    var c = document.getElementById("neomatrix");
    var ctx = c.getContext("2d");

    c.height = window.innerHeight;
    c.width = window.innerWidth;

    updateCharSet();
    updateFont();

    function updateCharSet() {
        switch (char_set) {
            case "0": {
                letters = custom_char_set;
                break;
            }
            case "1": {
                letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                break;
            }
            case "2": {
                letters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                break;
            }
            case "3": {
                letters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ()._,-=+*/\\:;\'\"<>?!@#$%&^[]{}";
                break;
            }
            case "4": {
                letters = "1234567890アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン日ZTHEMATRIX:・.\"=*+-<>¦｜_╌";
                break;
            }
            case "5": {
                letters = "01";
                break;
            }
            case "6": {
                letters = "0123456789ABCDEF";
                break;
            }
        }

        letters = letters.split("");
    }

    function updateFont() {
        var font_name;
        switch (font) {
            case "0": {
                font_name = "monospace";
                break;
            }
            case "1": {
                font_name = "consolas";
                break;
            }
            case "2": {
                font_name = custom_font_name;
                break;
            }
        }

        ctx.font = font_size + "px " + font_name;

        columns = c.width / font_size;
        drops = [];
        for (var x = 0; x < columns; x++)
            drops[x] = 1;
    }

    function map(value, from_a, from_b, to_a, to_b) {
        return (((value - from_a) * (to_b - to_a)) / (from_b - from_a)) + to_a;
    }

    function drawmatrix() {
        ctx.fillStyle = "rgba(0, 0, 0, " + trail_length + ")";
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

