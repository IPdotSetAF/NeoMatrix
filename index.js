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
            if (properties.customfont)
                custom_font = properties.customfont.value;
            if (properties.fontsize)
                font_size = properties.fontsize.value;
            if (properties.font || properties.customfontname || properties.fontsize)
                updateFont();

            if (properties.traillength)
                trail_length = map(properties.traillength.value, 0.0, 1.0, 0.35, 0.02);

            if (properties.matrixspeed)
                fpsInterval = 1000 / properties.matrixspeed.value;

            if (properties.codescommaseparated) {
                codes = properties.codescommaseparated.value.split(",");
                codes.forEach(element => {
                    element = element.trim();
                });
            }

            if (properties.colormode)
                color_mode = properties.colormode.value;
            if (properties.matrixcolor)
                color = properties.matrixcolor.value.split(' ').map(function (c) {
                    return Math.ceil(c * 255)
                });
            if (properties.coloranimationspeed)
                color_animation_speed = properties.coloranimationspeed.value;

            startAnimating();
        }
    };

    var fpsInterval, startTime, now, then, elapsed, letters, columns, drops, trail_length = 0.05, codes;
    var color = "0,255,0", color_mode = "0", color_animation_speed = 0.5;
    var char_set = "4", custom_char_set;
    var font_size, font = "2", custom_font;
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
                font_name = "courier-bold";
                break;
            }
            case "3": {
                font_name = custom_font;
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

        for (var i = 0; i < drops.length; i++) {
            var charcter = letters[Math.floor(Math.random() * letters.length)];
            ctx.fillStyle = "rgb( " + calculateColor(i, drops[i]) + " )";
            ctx.fillText(charcter, i * font_size, drops[i] * font_size);
            if (drops[i] * font_size > c.height && Math.random() > 0.975)
                drops[i] = 0;

            drops[i]++;
        }
    }

    function calculateColor(i, j){
        var currentColor = color;

        switch(color_mode){
            case "1":{
                break;
            }
            case "2":{
                break;
            }
        }
          
        return currentColor;
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

