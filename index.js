window.onload = function () {
    const version = "v2.0.0";

    checkForUpdates = async () => {
        const url = 'https://api.github.com/repos/IPdotSetAF/NeoMatrix/tags';
        const tags = await fetch(url).then(_ => _.json());
        if (tags[0]['name'] > version)
            Log("New release available: " + tags[0]['name']);
    }

    var options = {
        ui_rain_matrixSpeed: 24,
        fpsInterval: calculateFpsInterval(24),
        ui_rain_trailLength: 0.86,
        trailLength: calculateTrailLength(0.86),
        ui_characters_charset: "4",
        ui_characters_customCharset: "0123456789ABCDEF",
        ui_font_font: "2",
        ui_font_customFont: "monospace",
        ui_font_fontSize: 15,
        ui_other_codesCommaSeparated: "THE MATRIX",
        codes: makeCodes("THE MATRIX"),
        ui_color_colorMode: "2",
        ui_color_matrixColor: [0, 255, 0],
        matrixColor: rgbToHue([0, 255, 0]),
        ui_color_colorAnimationSpeed: 0.5,
        colorAnimationSpeed: calculateColorAnimationSpeed(0.5),
        ui_color_highlightFirstCharacter: true
    }

    if (window.wallpaperRegisterAudioListener)
        window.wallpaperRegisterAudioListener((audioArray) => {
            return frequencyArray = audioArray;
        });
    else
        drawGui();

    function drawGui() {
        gui = new dat.GUI({ autoPlace: false })
        gui.width = 400;

        const rainFolder = gui.addFolder('Rain');
        rainFolder.add(options, 'ui_rain_matrixSpeed').min(1).max(60).step(1).name('Matrix Speed').onChange(() => {
            options.fpsInterval = calculateFpsInterval(options.ui_rain_matrixSpeed);
        });
        rainFolder.add(options, 'ui_rain_trailLength').min(0).max(1).step(0.01).name('Trail Length').onChange(() => {
            options.trailLength = calculateTrailLength(options.ui_rain_trailLength);
            updateMask();
        });

        const colorFolder = gui.addFolder("Color");
        colorFolder.add(options, 'ui_color_colorMode', { "Single": "0", "RGB Cycle": "1", "Vertical Rainbow": "2", "Horizontal Rainbow": "3" }).name('Color Mode');
        colorFolder.addColor(options, 'ui_color_matrixColor').name('Matrix Color').onChange(() => {
            options.matrixColor = rgbToHue(options.ui_color_matrixColor);
        });
        colorFolder.add(options, 'ui_color_colorAnimationSpeed').min(-1).max(1).step(0.01).name('Color Animation Speed').onChange(() => {
            options.colorAnimationSpeed = calculateColorAnimationSpeed(options.ui_color_colorAnimationSpeed);
        });
        colorFolder.add(options, 'ui_color_highlightFirstCharacter').name('Highlight First Character');

        const characterFolder = gui.addFolder("Characters");
        characterFolder.add(options, 'ui_characters_charset', { "Custom": "0", "English Lttrs": "1", "Lttrs+Nums": "2", "Lttrs+Nums+Chars": "3", "Original Matrix": "4", "Binary": "5", "Hex": "6", "Morse Code": "7" }).name('Char set').onChange(updateCharSet);
        characterFolder.add(options, 'ui_characters_customCharset').name('Custom Char Set').onChange(updateCharSet);

        const fontFolder = gui.addFolder("Font");
        fontFolder.add(options, 'ui_font_fontSize').min(5).max(30).step(1).name('Font Size').onChange(updateFont);
        fontFolder.add(options, 'ui_font_font', { "MonoSpace": "0", "Consolas": "1", "Courier Bold": "2", "Custom": "3" }).name('Font').onChange(updateFont);
        fontFolder.add(options, 'ui_font_customFont').name('Custom Font').onChange(updateFont);

        gui.addFolder("Audio (not available in web version)");

        const otherFolder = gui.addFolder("Other");
        otherFolder.add(options, 'ui_other_codesCommaSeparated').name('Codes (Comma separated)').onChange(() => {
            options.codes = makeCodes(options.ui_other_codesCommaSeparated);
            fallAnimation();
        });

        customContainer = document.getElementById('gui');
        customContainer.appendChild(gui.domElement);
    }

    window.wallpaperPropertyListener = {
        applyUserProperties: function (properties) {
            if (properties.matrixspeed)
                options.fpsInterval = calculateFpsInterval(properties.matrixspeed.value);
            if (properties.traillength) {
                options.trailLength = calculateTrailLength(properties.traillength.value);
                updateMask();
            }

            if (properties.colormode)
                options.ui_color_colorMode = properties.colormode.value;
            if (properties.matrixcolor)
                options.matrixColor = rgbToHue(properties.matrixcolor.value.split(' '))
            if (properties.coloranimationspeed)
                options.colorAnimationSpeed = calculateColorAnimationSpeed(properties.coloranimationspeed.value);
            if (properties.highlightfirstcharacter)
                options.ui_color_highlightFirstCharacter = properties.highlightfirstcharacter.value;

            if (properties.charset)
                options.ui_characters_charset = properties.charset.value;
            if (properties.customcharset)
                options.ui_characters_customCharset = properties.customcharset.value;
            if (properties.charset || properties.customcharset)
                updateCharSet();

            if (properties.font)
                options.ui_font_font = properties.font.value;
            if (properties.customfont)
                options.ui_font_customFont = properties.customfont.value;
            if (properties.fontsize)
                options.ui_font_fontSize = properties.fontsize.value;
            if (properties.font || properties.customfontname || properties.fontsize)
                updateFont();

            if (properties.audioresponsive)
                isAudioResponsive = properties.audioresponsive.value;
            if (properties.audiosensetivity)
                AudioMultiplier = properties.audiosensetivity.value;
            if (properties.silenceanimation)
                hasSilenceAnimation = properties.silenceanimation.value;
            if (properties.silencetimeoutseconds)
                SilenceTimeoutSeconds = properties.silencetimeoutseconds.value;

            if (properties.codescommaseparated) {
                options.codes = makeCodes(properties.codescommaseparated.value);
                fallAnimation();
            }
        }
    };

    window.addEventListener('resize', function () {
        updateCanvasSize();
        updateMask();
        updateFont();
        updateGrid();
        fallAnimation();
    }, false);

    var debug = document.getElementById("debug"), logs = [];
    var startTime, now, then, elapsed, letters, columns, rows, drops, drop_chars;
    var isAudioResponsive = false, hasSilenceAnimation = true, AudioTimeout = false, SilenceTimeoutSeconds = 15, LastSoundTime = new Date(), isSilent = false, frequencyArray, frequencyArrayLength = 128, AudioMultiplier = 50, column_frequency;
    var column_hue, row_hue;
    var font_fraction;
    var maskDom = document.getElementById("mask");
    var mask = maskDom.getContext("2d");
    var c = document.getElementById("neomatrix");
    var ctx = c.getContext("2d");

    updateCanvasSize();
    updateMask();
    updateCharSet();
    updateFont();
    startAnimating();

    function updateCanvasSize() {
        c.height = window.innerHeight;
        c.width = window.innerWidth;
        maskDom.height = window.innerHeight;
        maskDom.width = window.innerWidth;
    }

    function updateMask() {
        mask.clearRect(0, 0, c.width, c.height);
        mask.fillStyle = "rgba(0, 0, 0, " + options.trailLength + ")";
        mask.fillRect(0, 0, c.width, c.height);
    }

    function drawMask() {
        ctx.drawImage(maskDom, 0, 0);
    }

    function updateCharSet() {
        switch (options.ui_characters_charset) {
            case "0": {
                letters = options.ui_characters_customCharset;
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
        switch (options.ui_font_font) {
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
                font_name = options.ui_font_customFont;
                break;
            }
        }

        ctx.font = options.ui_font_fontSize + "px " + font_name;
        font_fraction = options.ui_font_fontSize / 4;

        updateGrid();
        fallAnimation();
    }

    function updateGrid() {
        columns = c.width / options.ui_font_fontSize;
        rows = c.height / options.ui_font_fontSize;
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

    function startAnimating() {
        checkForUpdates();
        then = Date.now();
        startTime = then;
        loop();
    }

    function loop() {
        window.requestAnimationFrame(loop);
        now = Date.now();
        elapsed = now - then;
        if (elapsed > options.fpsInterval) {
            then = now - (elapsed % options.fpsInterval);
            drawMatrix();
        }
    }

    function drawMatrix() {
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

            if (options.ui_color_highlightFirstCharacter) {
                ctx.fillStyle = "#000";
                ctx.fillRect(i * options.ui_font_fontSize, ((drops[i][0] - 2) * options.ui_font_fontSize) + font_fraction, options.ui_font_fontSize, options.ui_font_fontSize);

                var tmp = drops[i][0] - 1;
                ctx.fillStyle = calculateColor(i, tmp, drop_chars[i][1]);
                ctx.fillText(drop_chars[i][0], i * options.ui_font_fontSize, tmp * options.ui_font_fontSize);

                ctx.fillStyle = "#FFF";
            }
            else
                ctx.fillStyle = calculateColor(i, drops[i][0], lightness);

            drop_chars[i] = [character, lightness];
            ctx.fillText(character, i * options.ui_font_fontSize, drops[i][0] * options.ui_font_fontSize);

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

    function calculateCharacter(dropItem) {

        if (Math.random() > 0.995 && dropItem[1] == 0) {
            dropItem[1] = Math.floor(Math.random() * options.codes.length) + 1;
            dropItem[2] = dropItem[0];
        }

        if (dropItem[1] != 0) {
            var codeCharIndex = dropItem[0] - dropItem[2];
            if (codeCharIndex < options.codes[dropItem[1] - 1].length)
                return options.codes[dropItem[1] - 1][codeCharIndex];
            dropItem[1] = 0;
            dropItem[2] = 0;
        }

        return letters[Math.floor(Math.random() * letters.length)];
    }

    function calculateColor(i, j, lightness) {
        var hue, offset = Math.floor(options.colorAnimationSpeed * then);

        switch (options.ui_color_colorMode) {
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
                hue = options.matrixColor;
                break;
            }
        }

        return "hsl(" + hue + ", 100%, " + lightness + "%)";;
    }

    function calculateFpsInterval(fps) {
        return 1000 / fps;
    }

    function calculateTrailLength(value) {
        return map(value, 0.0, 1.0, 0.35, 0.02);
    }

    function calculateColorAnimationSpeed(value) {
        return map(value, -1, 1, 0.05, -0.05);
    }

    function makeCodes(codesText){
        var codes = codesText.split(",")
        codes.push("IP.AF");
        return codes;
    }

    function Log(text) {
        if (logs.length > 0)
            if (logs[logs.length - 1] == text)
                return;
        debug.classList.remove("hide");
        logs.push(text);
        if (logs.length > 10)
            logs.splice(0, 1);
        var tmp = "";
        logs.forEach(l => { tmp += l + "\n" });
        debug.innerText = tmp;
        debug.classList.add("hide");
    }

    function rgbToHue(color) {
        let tmp = color.map(function (c) {
            return Math.ceil(c * 255)
        });
        return rgbToHsl(...tmp)[0] * 360;
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
};

