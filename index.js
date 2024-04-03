window.onload = function () {
    if (window.wallpaperRegisterAudioListener)
        window.wallpaperRegisterAudioListener((audioArray) => {
            return frequencyArray = audioArray;
        });
    else {
        var opt = {
            matrixspeed: 24,
            traillength: 0.86,
            charset: "4",
            customcharset: "0123456789ABCDEF",
            font: "2",
            customfont: "monospace",
            fontsize: 15,
            codescommaseparated: "THE MATRIX",
            colormode: "2",
            matrixcolor: [0, 255, 0],
            coloranimationspeed: 0.5,
            highlightfirstcharacter: true
        }

        gui = new dat.GUI({ autoPlace: false })
        gui.width = 400;
        
        const rainFolder = gui.addFolder('Rain');
        rainFolder.add(opt, 'matrixspeed').min(1).max(60).step(1).name('Matrix Speed').onChange(() => {
            fpsInterval = 1000 / opt.matrixspeed;
        });
        rainFolder.add(opt, 'traillength').min(0).max(1).step(0.01).name('Trail Length').onChange(() => {
            trail_length = map(opt.traillength, 0.0, 1.0, 0.35, 0.02);
            updateMask();
        });

        const colorFolder = gui.addFolder("Color");
        colorFolder.add(opt, 'colormode', { "Single": "0", "RGB Cycle": "1", "Vertical Rainbow": "2", "Horizontal Rainbow": "3" }).name('Color Mode').onChange(() => {
            color_mode = opt.colormode;
        });
        colorFolder.addColor(opt, 'matrixcolor').name('Matrix Color').onChange(() => {
            let tmp = opt.matrixcolor.map(function (c) {
                return Math.ceil(c * 255)
            });
            color = rgbToHsl(...tmp)[0] * 360;
        });
        colorFolder.add(opt, 'coloranimationspeed').min(-1).max(1).step(0.01).name('Color Animation Speed').onChange(() => {
            color_animation_speed = map(opt.coloranimationspeed, -1, 1, 0.05, -0.05);
            Log(color_animation_speed);
        });
        colorFolder.add(opt, 'highlightfirstcharacter').name('Highlight First Character').onChange(() => {
            highlight_first_character = opt.highlightfirstcharacter;
        });

        const characterFolder = gui.addFolder("Characters");
        characterFolder.add(opt, 'charset', { "Custom": "0", "English Lttrs": "1", "Lttrs+Nums": "2", "Lttrs+Nums+Chars": "3", "Original Matrix": "4", "Binary": "5", "Hex": "6", "Morse Code": "7" }).name('Char set').onChange(() => {
            char_set = opt.charset;
            updateCharSet();
        });
        characterFolder.add(opt, 'customcharset').name('Custom Char Set').onChange(() => {
            custom_char_set = opt.customcharset;
            updateCharSet();
        });

        const fontFolder = gui.addFolder("Font");
        fontFolder.add(opt, 'fontsize').min(5).max(30).step(1).name('Font Size').onChange(() => {
            font_size = opt.fontsize;
            updateFont();
        });
        fontFolder.add(opt, 'font', { "MonoSpace": "0", "Consolas": "1", "Courier Bold": "2", "Custom": "3" }).name('Font').onChange(() => {
            font = opt.font;
            updateFont();
        });
        fontFolder.add(opt, 'customfont').name('Custom Font').onChange(() => {
            custom_font = opt.customfont;
            updateFont();
        });

        gui.addFolder("Audio (not available in web version)");

        const otherFolder = gui.addFolder("Other");
        otherFolder.add(opt, 'codescommaseparated').name('Codes (Comma separated)').onChange(() => {
            codes = opt.codescommaseparated.split(",");
            codes.push("IP.AF");
            fallAnimation();
        });

        customContainer = document.getElementById('gui');
        customContainer.appendChild(gui.domElement);
    }

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

            if (properties.traillength) {
                trail_length = map(properties.traillength.value, 0.0, 1.0, 0.35, 0.02);
                updateMask();
            }

            if (properties.matrixspeed)
                fpsInterval = 1000 / properties.matrixspeed.value;

            if (properties.codescommaseparated) {
                codes = properties.codescommaseparated.value.split(",");
                codes.push("IP.AF");
                fallAnimation();
            }

            if (properties.colormode)
                color_mode = properties.colormode.value;
            if (properties.matrixcolor) {
                var tmp = properties.matrixcolor.value.split(' ').map(function (c) {
                    return Math.ceil(c * 255)
                });
                color = rgbToHsl(...tmp)[0] * 360;
            }
            if (properties.coloranimationspeed)
                color_animation_speed = map(properties.coloranimationspeed.value, -1, 1, 0.05, -0.05);

            if (properties.highlightfirstcharacter)
                highlight_first_character = properties.highlightfirstcharacter.value;

            if (properties.audioresponsive)
                isAudioResponsive = properties.audioresponsive.value;
            if (properties.audiosensetivity)
                AudioMultiplier = properties.audiosensetivity.value;
            if (properties.silenceanimation)
                hasSilenceAnimation = properties.silenceanimation.value;
            if (properties.silencetimeoutseconds)
                SilenceTimeoutSeconds = properties.silencetimeoutseconds.value;

            startAnimating();
        }
    };

    window.addEventListener('resize', function () {
        c.height = window.innerHeight;
        c.width = window.innerWidth;
        maskDom.height = window.innerHeight;
        maskDom.width = window.innerWidth;

        updateFont();
        updateMask();
        updateGrid();
        fallAnimation();
    }, false);

    var debug = document.getElementById("debug"), logs = [];
    var fpsInterval = 1000 / 24, startTime, now, then, elapsed, letters, columns, rows, drops, drop_chars, trail_length = 0.05, highlight_first_character = true;
    var isAudioResponsive = false, hasSilenceAnimation = true, AudioTimeout = false, SilenceTimeoutSeconds = 15, LastSoundTime = new Date(), isSilent = false, frequencyArray, frequencyArrayLength = 128, AudioMultiplier = 50, column_frequency;
    var color = 120, color_mode = "2", color_animation_speed = -0.025, column_hue, row_hue;
    var char_set = "4", custom_char_set = "0123456789ABCDEF";
    var font_size = 15, font_fraction, font = "2", custom_font = "monospace";
    var codes = ["IP.AF", "THE MATRIX"];
    var maskDom = document.getElementById("mask");
    var mask = maskDom.getContext("2d");
    var c = document.getElementById("neomatrix");
    var ctx = c.getContext("2d");

    c.height = window.innerHeight;
    c.width = window.innerWidth;
    maskDom.height = window.innerHeight;
    maskDom.width = window.innerWidth;

    updateMask();
    updateCharSet();
    updateFont();
    startAnimating();

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

    function rgbToHsl(r, g, b) {
        r /= 255, g /= 255, b /= 255;

        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;

        if (max == min) {
            h = s = 0; // achromatic
        } else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }

            h /= 6;
        }

        return [h, s, l];
    }

    function map(value, from_a, from_b, to_a, to_b) {
        return (((value - from_a) * (to_b - to_a)) / (from_b - from_a)) + to_a;
    }

    function clamp(min, max, value) {
        if (value < min)
            return min;
        if (value > max)
            return max;
        return value;
    }

    function drawmatrix() {
        drawMask();
        isSilent = true;

        for (var i = 0; i < drops.length; i++) {
            var character = calculateCharacter(drops[i]);
            var probability = 0.975;
            var lightness = 50;

            if (isAudioResponsive) {
                var frequency = Math.floor(i * column_frequency);
                var Volume = frequencyArray[frequency] + frequencyArray[frequency + (frequencyArrayLength / 2)];

                if (Volume > 0.01)
                    isSilent = false;

                if (!AudioTimeout || !hasSilenceAnimation) {
                    probability = 1 - clamp(0, 1, (Volume * Volume * Volume * AudioMultiplier));
                    lightness = Math.floor(clamp(40, 80, Volume * 100 * AudioMultiplier));
                }
            }

            if (drops[i][1] > 0)
                lightness = 100;

            if (highlight_first_character) {
                ctx.fillStyle = "#000";
                ctx.fillRect(i * font_size, ((drops[i][0] - 2) * font_size) + font_fraction, font_size, font_size);

                var tmp = drops[i][0] - 1;
                ctx.fillStyle = calculateColor(i, tmp, drop_chars[i][1]);
                ctx.fillText(drop_chars[i][0], i * font_size, tmp * font_size);

                ctx.fillStyle = "#FFF";
            }
            else
                ctx.fillStyle = calculateColor(i, drops[i][0], lightness);

            drop_chars[i] = [character, lightness];
            ctx.fillText(character, i * font_size, drops[i][0] * font_size);

            if (drops[i][0] > rows && Math.random() > probability)
                drops[i] = [0, 0, 0];

            drops[i][0]++;
        }

        if (hasSilenceAnimation) {
            if (!isSilent) {
                AudioTimeout = false;
                LastSoundTime = new Date();
            } else if ((new Date() - LastSoundTime) > SilenceTimeoutSeconds * 1000) {
                AudioTimeout = true;
            }
        }
    }

    function updateMask() {
        mask.clearRect(0, 0, c.width, c.height);
        mask.fillStyle = "rgba(0, 0, 0, " + trail_length + ")";
        mask.fillRect(0, 0, c.width, c.height);
    }

    function drawMask() {
        ctx.drawImage(maskDom, 0, 0);
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

    function calculateColor(i, j, lightness) {
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
                hue = color;
                break;
            }
        }

        return "hsl(" + hue + ", 100%, " + lightness + "%)";;
    }

    function updateGrid() {
        columns = c.width / font_size;
        rows = c.height / font_size;
        column_hue = Math.floor(360 / columns);
        row_hue = Math.floor(360 / rows);
        column_frequency = frequencyArrayLength / (columns * 2);
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

    function Log(text) {
        logs.push(text);
        if (logs.length > 10)
            logs.splice(0, 1);
        var tmp = "";
        logs.forEach(l => { tmp += l + "\n" });
        debug.innerText = tmp;
    }
};

