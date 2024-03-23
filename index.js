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
                codes.push("IP.AF");
                fallAnimation();
            }

            if (properties.colormode)
                color_mode = properties.colormode.value;
            if (properties.matrixcolor)
                color = properties.matrixcolor.value.split(' ').map(function (c) {
                    return Math.ceil(c * 255)
                });
            if (properties.coloranimationspeed)
                color_animation_speed = map(properties.coloranimationspeed.value, -1, 1, 0.05, -0.05);

            if (properties.highlightfirstcharacter)
                highlight_first_character = properties.highlightfirstcharacter.value;

            startAnimating();
        }
    };

    var fpsInterval, startTime, now, then, elapsed, letters, columns, rows, drops, drop_chars, trail_length = 0.05, highlight_first_character = true;
    var color = "0,255,0", color_mode = "0", color_animation_speed = 0, column_hue, row_hue;
    var char_set = "4", custom_char_set;
    var font_size, font_fraction, font = "2", custom_font;
    var codes;
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
                letters = "1234567890アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン日Z:・.\"=*+-<>¦｜_╌";
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
            case "7": {
                letters = "|.";
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
        font_fraction = font_size / 4;

        updateGrid();
        fallAnimation();
    }

    function map(value, from_a, from_b, to_a, to_b) {
        return (((value - from_a) * (to_b - to_a)) / (from_b - from_a)) + to_a;
    }

    function drawmatrix() {
        ctx.fillStyle = "rgba(0, 0, 0, " + trail_length + ")";
        ctx.fillRect(0, 0, c.width, c.height);

        for (var i = 0; i < drops.length; i++) {
            var character = calculateCharacter(drops[i]);
            var doHighlight = drops[i][1] > 0;

            if (highlight_first_character) {
                ctx.fillStyle = "#000";
                ctx.fillRect(i * font_size, ((drops[i][0] - 2) * font_size) + font_fraction, font_size, font_size);

                var tmp = drops[i][0] - 1;
                ctx.fillStyle = calculateColor(i, tmp, drop_chars[i][1]);
                ctx.fillText(drop_chars[i][0], i * font_size, tmp * font_size);

                ctx.fillStyle = "#FFF";
            }
            else
                ctx.fillStyle = calculateColor(i, drops[i][0], doHighlight);

            drop_chars[i] = [character, doHighlight];
            ctx.fillText(character, i * font_size, drops[i][0] * font_size);

            if (drops[i][0] > rows && Math.random() > 0.975)
                drops[i] = [0, 0, 0];

            drops[i][0]++;
        }
    }

    function calculateCharacter(dropItem) {

        if (Math.random() > 0.995 && dropItem[1] == 0) {
            dropItem[1] = Math.floor(Math.random() * codes.length) + 1;
            dropItem[2] = dropItem[0];
        }

        if (dropItem[1] != 0) {
            var codeCharIndex = dropItem[0] - dropItem[2];
            if (codeCharIndex < codes[dropItem[1] - 1].length)
                return codes[dropItem[1] - 1][codeCharIndex];
            dropItem[1] = 0;
            dropItem[2] = 0;
        }

        return letters[Math.floor(Math.random() * letters.length)];
    }

    function calculateColor(i, j, highLight) {
        if (highLight)
            return "#FFF";

        var hue, offset = Math.floor(color_animation_speed * then);

        switch (color_mode) {
            //RGb cycle
            case "1": {
                hue = offset * row_hue;
                break;
            }
            //Vertical
            case "2": {
                hue = (j + offset) * row_hue;
                break;
            }
            //Horizontal
            case "3": {
                hue = (i + offset) * column_hue;
                break;
            }
            //Static
            default: {
                return "rgb( " + color + " )";
            }
        }

        return "hsl(" + hue + ", 100%, 50%)";;
    }

    window.addEventListener('resize', function () {
        c.height = window.innerHeight;
        c.width = window.innerWidth;

        updateGrid();
        fallAnimation();
    }, false);

    function updateGrid() {
        columns = c.width / font_size;
        rows = c.height / font_size;
        column_hue = Math.floor(360 / columns);
        row_hue = Math.floor(360 / rows);
    }

    function fallAnimation() {
        drops = [];
        drop_chars = [];
        for (var i = 0; i < columns; i++) {
            drops[i] = [1, 0, 0];
            drop_chars[i] = ["", false];
        }
    }

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

