window.onload = function () {
    const version = "v3.2.0";

    checkForUpdates = async () => {
        const url = 'https://api.github.com/repos/IPdotSetAF/NeoMatrix/tags';
        const tags = await fetch(url).then(_ => _.json());
        if (tags[0]['name'] > version)
            Log("New release available: " + tags[0]['name']);
    }

    readProjectConfig = async () => {
        return await fetch('project.json').then(_ => _.json());
    }

    function optionsToDict(options) {
        return options.reduce((acc, option) => {
            acc[option.label] = option.value;
            return acc;
        }, {});
    }

    var gui;
    var options = {
        ui_rain_matrixSpeed: 24,
        fpsInterval: calculateFpsInterval(24),
        ui_rain_trailLength: 0.86,
        trailLength: calculateTrailLength(0.86),
        ui_characters_charset: "4",
        ui_characters_customCharset: "0123456789ABCDEF",
        ui_font_font: "3",
        ui_font_customFont: "monospace",
        ui_font_size: 15,
        ui_other_codesCommaSeparated: "THE MATRIX",
        codes: makeCodes("THE MATRIX"),
        ui_color_colorMode: "2",
        ui_color_matrixColor: [0, 1, 0],
        matrixColor: rgbToHue([0, 1, 0]),
        ui_color_colorAnimationSpeed: 0.5,
        colorAnimationSpeed: calculateColorAnimationSpeed(0.5),
        ui_color_highlightFirstCharacter: true,
        ui_audio_audioResponsive: false,
        ui_audio_audioSensetivity: 50,
        ui_audio_silenceAnimation: true,
        ui_audio_silenceTimeoutSeconds: 3,
        ui_logo_logo: "0",
        ui_logo_customLogo: "",
        ui_logo_preserveColor: false,
        ui_logo_scale: 1,
        ui_logo_positionX: 0,
        ui_logo_positionY: 0,
        ui_clock_clock: "0",
        ui_clock_24HourFormat: true,
        ui_clock_scale: 1,
        ui_clock_positionX: 0,
        ui_clock_positionY: 0,
        ui_message_message: "0",
        ui_message_text: "THE MATRIX",
        ui_message_scale: 1,
        ui_message_positionX: 0,
        ui_message_positionY: 0,
        Save() {
            window.localStorage.setItem("preset", JSON.stringify(gui.save()));
            Log("Saved preset.");
        },
        Load() {
            let preset = JSON.parse(window.localStorage.getItem("preset"));
            if (preset) {
                gui.load(preset);
                Log("Loaded preset.");
            } else
                Log("No preset found.");
        },
        Reset() {
            gui.reset();
            Log("Settings reset to default.");
        }
    }

    if (window.wallpaperRegisterAudioListener)
        window.wallpaperRegisterAudioListener((audioArray) => {
            return frequencyArray = audioArray;
        });
    else
        drawGui();

    function drawGui() {
        readProjectConfig().then((config) => {
            gui = new lil.GUI({ autoPlace: false, width: 300 });

            const rainFolder = gui.addFolder('Rain');
            rainFolder.add(options, 'ui_rain_matrixSpeed').min(1).max(60).step(1).name('Matrix Speed').onChange(() => {
                options.fpsInterval = calculateFpsInterval(options.ui_rain_matrixSpeed);
            });
            rainFolder.add(options, 'ui_rain_trailLength').min(0).max(1).step(0.01).name('Trail Length').onChange(() => {
                options.trailLength = calculateTrailLength(options.ui_rain_trailLength);
                updateMask();
            });

            const colorFolder = gui.addFolder("Color");
            colorFolder.add(options, 'ui_color_colorMode', optionsToDict(config.general.properties.ui_color_colormode.options)).name('Color Mode');
            colorFolder.addColor(options, 'ui_color_matrixColor').name('Matrix Color').onChange(() => {
                options.matrixColor = rgbToHue(options.ui_color_matrixColor);
            });
            colorFolder.add(options, 'ui_color_colorAnimationSpeed').min(-1).max(1).step(0.01).name('Color Animation Speed').onChange(() => {
                options.colorAnimationSpeed = calculateColorAnimationSpeed(options.ui_color_colorAnimationSpeed);
            });
            colorFolder.add(options, 'ui_color_highlightFirstCharacter').name('Highlight First Character');

            const characterFolder = gui.addFolder("Characters");
            characterFolder.add(options, 'ui_characters_charset', optionsToDict(config.general.properties.ui_characters_charset.options)).name('Char set').onChange(updateCharSet);
            characterFolder.add(options, 'ui_characters_customCharset').name('Custom Char Set').onChange(updateCharSet);

            const fontFolder = gui.addFolder("Font");
            fontFolder.add(options, 'ui_font_size').min(5).max(30).step(1).name('Font Size').onChange(updateFont);
            fontFolder.add(options, 'ui_font_font', optionsToDict(config.general.properties.ui_font_font.options)).name('Font').onChange(updateFont);
            fontFolder.add(options, 'ui_font_customFont').name('Custom Font').onChange(updateFont);

            gui.addFolder("Audio (not available in web version)");

            const logoFolder = gui.addFolder("Logo");
            logoFolder.add(options, "ui_logo_logo", optionsToDict(config.general.properties.ui_logo_logo.options)).name("Logo").onChange(updateLogo);
            logoFolder.add(options, "ui_logo_customLogo").name("Custom Logo URL (SVG)").onChange(updateLogo);
            logoFolder.add(options, "ui_logo_preserveColor").name("Preserve Logo Color").onChange(updateLogo);
            logoFolder.add(options, "ui_logo_scale").min(0).max(10).step(0.1).name("Scale").onChange(updateLogo);
            const logoPositionFolder = logoFolder.addFolder("Position");
            logoPositionFolder.add(options, "ui_logo_positionX").min(-2500).max(2500).step(1).name("X").onChange(updateLogo);
            logoPositionFolder.add(options, "ui_logo_positionY").min(-2500).max(2500).step(1).name("Y").onChange(updateLogo);

            const clockfolder = gui.addFolder("Clock");
            clockfolder.add(options, "ui_clock_clock", optionsToDict(config.general.properties.ui_clock_clock.options)).name("Clock").onChange(updateMask);
            clockfolder.add(options, "ui_clock_24HourFormat").name("24 Hour format").onChange(() => {
                updateTime();
                updateMask();
            });
            clockfolder.add(options, "ui_clock_scale").min(1).max(10).step(1).name("Scale").onChange(updateMask);
            const clockPositionFolder = clockfolder.addFolder("Position");
            clockPositionFolder.add(options, "ui_clock_positionX").min(-100).max(100).step(1).name("X").onChange(updateMask);
            clockPositionFolder.add(options, "ui_clock_positionY").min(-100).max(100).step(1).name("Y").onChange(updateMask);

            const messagefolder = gui.addFolder("Message");
            messagefolder.add(options, "ui_message_message", optionsToDict(config.general.properties.ui_message_message.options)).name("Message").onChange(updateMask);
            messagefolder.add(options, "ui_message_text").name("Message Text").onChange(updateMask);
            messagefolder.add(options, "ui_message_scale").min(1).max(10).step(1).name("Scale").onChange(updateMask);
            const messagePositionFolder = messagefolder.addFolder("Position");
            messagePositionFolder.add(options, "ui_message_positionX").min(-100).max(100).step(1).name("X").onChange(updateMask);
            messagePositionFolder.add(options, "ui_message_positionY").min(-100).max(100).step(1).name("Y").onChange(updateMask);

            const otherFolder = gui.addFolder("Other");
            otherFolder.add(options, 'ui_other_codesCommaSeparated').name('Codes (Comma separated)').onChange(() => {
                options.codes = makeCodes(options.ui_other_codesCommaSeparated);
                fallAnimation();
            });

            gui.add(options, "Save");
            gui.add(options, "Load");
            gui.add(options, "Reset");

            customContainer = document.getElementById('gui');
            customContainer.appendChild(gui.domElement);

            options.Load();
        });
    }

    window.wallpaperPropertyListener = {
        applyUserProperties: function (properties) {
            if (properties.ui_rain_matrixspeed)
                options.fpsInterval = calculateFpsInterval(properties.ui_rain_matrixspeed.value);
            if (properties.ui_rain_traillength) {
                options.trailLength = calculateTrailLength(properties.ui_rain_traillength.value);
                updateMask();
            }

            if (properties.ui_color_colormode)
                options.ui_color_colorMode = properties.ui_color_colormode.value;
            if (properties.ui_color_matrixcolor)
                options.matrixColor = rgbToHue(properties.ui_color_matrixcolor.value.split(' '))
            if (properties.ui_color_coloranimationspeed)
                options.colorAnimationSpeed = calculateColorAnimationSpeed(properties.ui_color_coloranimationspeed.value);
            if (properties.ui_color_highlightfirstcharacter)
                options.ui_color_highlightFirstCharacter = properties.ui_color_highlightfirstcharacter.value;

            if (properties.ui_characters_charset)
                options.ui_characters_charset = properties.ui_characters_charset.value;
            if (properties.ui_characters_customcharset)
                options.ui_characters_customCharset = properties.ui_characters_customcharset.value;
            if (properties.ui_characters_charset || properties.ui_characters_customcharset)
                updateCharSet();

            if (properties.ui_font_font)
                options.ui_font_font = properties.ui_font_font.value;
            if (properties.ui_font_customFont)
                options.ui_font_customFont = properties.ui_font_customFont.value;
            if (properties.ui_font_size)
                options.ui_font_size = properties.ui_font_size.value;
            if (properties.ui_font_font || properties.ui_font_customFont || properties.ui_font_size)
                updateFont();

            if (properties.ui_audio_audioresponsive)
                options.ui_audio_audioResponsive = properties.ui_audio_audioresponsive.value;
            if (properties.ui_audio_audiosensetivity)
                options.ui_audio_audioSensetivity = properties.ui_audio_audiosensetivity.value;
            if (properties.ui_audio_silenceanimation)
                options.ui_audio_silenceAnimation = properties.ui_audio_silenceanimation.value;
            if (properties.ui_audio_silencetimeoutseconds)
                options.ui_audio_silenceTimeoutSeconds = properties.ui_audio_silencetimeoutseconds.value;

            if (properties.ui_logo_logo)
                options.ui_logo_logo = properties.ui_logo_logo.value;
            if (properties.ui_logo_customlogo)
                options.ui_logo_customLogo = properties.ui_logo_customlogo.value;
            if (properties.ui_logo_scale)
                options.ui_logo_scale = properties.ui_logo_scale.value;
            if (properties.ui_logo_positionx)
                options.ui_logo_positionX = properties.ui_logo_positionx.value;
            if (properties.ui_logo_positiony)
                options.ui_logo_positionY = properties.ui_logo_positiony.value;
            if (properties.ui_logo_preservecolor)
                options.ui_logo_preserveColor = properties.ui_logo_preservecolor.value;
            if (properties.ui_logo_logo || properties.ui_logo_customlogo || properties.ui_logo_scale || properties.ui_logo_positionx || properties.ui_logo_positiony || properties.ui_logo_preservecolor)
                updateLogo();

            if (properties.ui_clock_clock)
                options.ui_clock_clock = properties.ui_clock_clock.value;
            if (properties.ui_clock_24hourformat) {
                options.ui_clock_24HourFormat = properties.ui_clock_24hourformat.value;
                updateTime();
            }
            if (properties.ui_clock_scale)
                options.ui_clock_scale = properties.ui_clock_scale.value;
            if (properties.ui_clock_positionx)
                options.ui_clock_positionX = properties.ui_clock_positionx.value;
            if (properties.ui_clock_positiony)
                options.ui_clock_positionY = properties.ui_clock_positiony.value;
            if (properties.ui_clock_clock || properties.ui_clock_24hourformat || properties.ui_clock_scale || properties.ui_clock_positionx || properties.ui_clock_positiony)
                updateMask();

            if (properties.ui_message_message)
                options.ui_message_message = properties.ui_message_message.value;
            if (properties.ui_message_text)
                options.ui_message_text = properties.ui_message_text.value;
            if (properties.ui_message_scale)
                options.ui_message_scale = properties.ui_message_scale.value;
            if (properties.ui_message_positionx)
                options.ui_message_positionX = properties.ui_message_positionx.value;
            if (properties.ui_message_positiony)
                options.ui_message_positionY = properties.ui_message_positiony.value;
            if (properties.ui_message_message || properties.ui_message_text || properties.ui_message_scale || properties.ui_message_positionx || properties.ui_message_positiony)
                updateMask();

            if (properties.ui_other_codescommaseparated) {
                options.codes = makeCodes(properties.ui_other_codescommaseparated.value);
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

    setInterval(() => {
        updateTime();
        if (options.ui_clock_clock != "0")
            updateMask();
    }, 60000);

    var fonts = ["monospace", "consolas", "courier-bold", "neo-matrix"];
    var charsets = [
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ()._,-=+*/\\:;\'\"<>?!@#$%&^[]{}",
        "1234567890アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン日Z:・.\"=*+-<>¦｜_╌",
        "01",
        "0123456789ABCDEF",
        "|."
    ];
    var logo = null, logos = ["ipaf", "kali-1", "kali-2", "ubuntu-1", "ubuntu-2", "windows-11", "windows-10-8", "windows-7", "visual-studio", "vs-code", "unity-1", "unity-2", "unreal", "python", "blazor", "docker", "flutter", "git", "blender", "angular", "c-sharp", "c-plus-plus", "qt"];
    var debug = document.getElementById("debug"), logs = [];
    var hour = "", minute = "";
    var startTime, now, then, elapsed, letters, columns, rows, drops, drop_chars;
    var AudioTimeout = false, LastSoundTime = new Date(), isSilent = false, frequencyArray, frequencyArrayLength = 128, column_frequency;
    var column_hue, row_hue;
    var font_fraction;
    var maskDom = document.getElementById("mask");
    var mask = maskDom.getContext("2d");
    var colorOverlayDom = document.getElementById("color-overlay");
    var colorOverlay = colorOverlayDom.getContext("2d");
    var neoMatrixDom = document.getElementById("neo-matrix");
    var neoMatrix = neoMatrixDom.getContext("2d");

    updateCanvasSize();
    updateCharSet();
    updateTime();
    updateFont();
    startAnimating();

    function updateCanvasSize() {
        neoMatrixDom.height = window.innerHeight;
        neoMatrixDom.width = window.innerWidth;
        maskDom.height = window.innerHeight;
        maskDom.width = window.innerWidth;
        colorOverlayDom.height = window.innerHeight;
        colorOverlayDom.width = window.innerWidth;
    }

    function updateLogo() {
        logo = new Image();
        logo.onload = updateMask;

        switch (options.ui_logo_logo) {
            case "0": {
                logo = null;
                updateMask();
                break;
            }
            case "1": {
                logo.src = options.ui_logo_customLogo;
                break;
            }
            default: {
                logo.src = "images/" + logos[parseInt(options.ui_logo_logo) - 2] + ".svg";
            }
        }
    }

    function updateTime() {
        let today = new Date();
        hour = today.getHours();
        minute = today.getMinutes();

        if (!options.ui_clock_24HourFormat && hour > 12) {
            hour = hour % 12;
            if (hour == 0)
                hour = 12;
        }
        if (hour < 10)
            hour = "0" + hour;
        if (minute < 10)
            minute = "0" + minute;
    }

    function updateMask() {
        mask.globalCompositeOperation = 'source-over';
        mask.clearRect(0, 0, neoMatrixDom.width, neoMatrixDom.height);
        mask.fillStyle = "rgba(0, 0, 0, " + options.trailLength + ")";
        mask.fillRect(0, 0, neoMatrixDom.width, neoMatrixDom.height);

        mask.globalCompositeOperation = 'destination-out';

        if (logo) {
            let logo_width = (neoMatrixDom.height / 2) * (logo.width / logo.height) * options.ui_logo_scale;
            let logo_height = (neoMatrixDom.height / 2) * options.ui_logo_scale;

            mask.drawImage(logo, neoMatrixDom.width / 2 - logo_width / 2 + options.ui_logo_positionX, neoMatrixDom.height / 2 - logo_height / 2 + options.ui_logo_positionY, logo_width, logo_height);

            colorOverlay.clearRect(0, 0, neoMatrixDom.width, neoMatrixDom.height);
            colorOverlay.drawImage(logo, neoMatrixDom.width / 2 - logo_width / 2 + options.ui_logo_positionX, neoMatrixDom.height / 2 - logo_height / 2 + options.ui_logo_positionY, logo_width, logo_height);
        }

        switch (options.ui_clock_clock) {
            case "3": {
                let center = [Math.floor((columns - 17 * options.ui_clock_scale) / 2), Math.floor((rows + 5 * options.ui_clock_scale) / 2)];
                drawTextOnMask(hour + ":" + minute, center[0] + options.ui_clock_positionX, center[1] + options.ui_clock_positionY, options.ui_clock_scale);
                break;
            }
            case "4": {
                let center = [Math.floor((columns - 7 * options.ui_clock_scale) / 2), Math.floor((rows + options.ui_clock_scale) / 2)];
                drawTextOnMask(hour + "\n" + minute, center[0] + options.ui_clock_positionX, center[1] + options.ui_clock_positionY - 1 * options.ui_clock_scale, options.ui_clock_scale);
                break;
            }
        }
    }

    function drawTextOnMask(text, x, y, scale) {
        mask.font = options.ui_font_size * 5 * scale + "px neo-matrix";
        mask.fillStyle = "#FFF";
        lines = text.split("\n");
        for (let i = 0; i < lines.length; i++) {
            mask.fillText(lines[i], options.ui_font_size * x - font_fraction, options.ui_font_size * y + font_fraction + (6 * i * options.ui_font_size * options.ui_clock_scale));
        }
    }

    function drawMask() {
        neoMatrix.globalCompositeOperation = 'source-over';
        neoMatrix.drawImage(maskDom, 0, 0);

        if (logo && options.ui_logo_preserveColor) {
            neoMatrix.globalCompositeOperation = 'source-atop';
            neoMatrix.drawImage(colorOverlayDom, 0, 0);
            neoMatrix.globalCompositeOperation = 'source-over';
        }
    }

    function updateCharSet() {
        if (options.ui_characters_charset == "0")
            letters = options.ui_characters_customCharset;
        else
            letters = charsets[parseInt(options.ui_characters_charset) - 1];

        letters = letters.split("");
    }

    function updateFont() {
        var font_name;

        if (options.ui_font_font == "0")
            font_name = options.ui_font_customFont;
        else
            font_name = fonts[parseInt(options.ui_font_font) - 1];

        neoMatrix.font = options.ui_font_size + "px " + font_name;
        font_fraction = options.ui_font_size / 4;

        updateGrid();
        updateMask();
        fallAnimation();
    }

    function updateGrid() {
        columns = neoMatrixDom.width / options.ui_font_size;
        rows = neoMatrixDom.height / options.ui_font_size;
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

            if (options.ui_audio_audioResponsive) {
                var frequency = Math.floor(i * column_frequency);
                var Volume = frequencyArray[frequency] + frequencyArray[frequency + (frequencyArrayLength / 2)];

                if (Volume > 0.01)
                    isSilent = false;

                if (!AudioTimeout || !options.ui_audio_silenceAnimation) {
                    probability = 1 - clamp(0, 1, (Volume * Volume * Volume * options.ui_audio_audioSensetivity));
                    lightness = Math.floor(clamp(40, 80, Volume * 100 * options.ui_audio_audioSensetivity));
                }
            }

            if (drops[i][1] > 0)
                lightness = 100;

            if (options.ui_color_highlightFirstCharacter) {
                neoMatrix.clearRect(i * options.ui_font_size, ((drops[i][0] - 2) * options.ui_font_size) + font_fraction, options.ui_font_size, options.ui_font_size);

                var tmp = drops[i][0] - 1;
                neoMatrix.fillStyle = calculateColor(i, tmp, drop_chars[i][1]);
                neoMatrix.fillText(drop_chars[i][0], i * options.ui_font_size, tmp * options.ui_font_size);

                neoMatrix.fillStyle = "#FFF";
            }
            else
                neoMatrix.fillStyle = calculateColor(i, drops[i][0], lightness);

            neoMatrix.clearRect(i * options.ui_font_size, ((drops[i][0] - 1) * options.ui_font_size) + font_fraction, options.ui_font_size, options.ui_font_size);
            drop_chars[i] = [character, lightness];
            neoMatrix.fillText(character, i * options.ui_font_size, drops[i][0] * options.ui_font_size);

            if (drops[i][0] > rows && Math.random() > probability)
                drops[i] = [0, 0, 0];

            drops[i][0]++;
        }

        if (options.ui_audio_silenceAnimation) {
            if (!isSilent) {
                AudioTimeout = false;
                LastSoundTime = new Date();
            } else if ((new Date() - LastSoundTime) > options.ui_audio_silenceTimeoutSeconds * 1000) {
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

    function makeCodes(codesText) {
        var codes = codesText.split(",")
        codes.push("IP.AF");
        return codes;
    }

    function Log(text) {
        debug.classList.remove("hide");
        void debug.offsetWidth;
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

