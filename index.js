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
            logoFolder.add(options, "ui_logo_logo", optionsToDict(config.general.properties.ui_logo_logo.options)).name("Logo").onChange(updateMask);
            logoFolder.add(options, "ui_logo_customLogo").name("Custom Logo URL (SVG)").onChange(updateMask);
            logoFolder.add(options, "ui_logo_preserveColor").name("Preserve Logo Color").onChange(updateMask);
            logoFolder.add(options, "ui_logo_scale").min(0).max(10).step(0.1).name("Scale").onChange(updateMask);
            const logoPositionFolder = logoFolder.addFolder("Position");
            logoPositionFolder.add(options, "ui_logo_positionX").min(-5000).max(5000).step(1).name("X").onChange(updateMask);
            logoPositionFolder.add(options, "ui_logo_positionY").min(-5000).max(5000).step(1).name("Y").onChange(updateMask);

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

    var fonts = ["monospace", "consolas", "courier-bold"];
    var charsets = [
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ()._,-=+*/\\:;\'\"<>?!@#$%&^[]{}",
        "1234567890アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン日Z:・.\"=*+-<>¦｜_╌",
        "01",
        "0123456789ABCDEF",
        "|."
    ];
    var logos = ["ipaf", "kali-1", "kali-2", "ubuntu-1", "ubuntu-2", "windows-11", "windows-10-8", "windows-7", "visual-studio", "vs-code", "unity-1", "unity-2", "unreal", "python", "blazor", "docker", "flutter", "git", "blender", "angular", "c-sharp", "c-plus-plus", "qt"];
    var debug = document.getElementById("debug"), logs = [];
    var startTime, now, then, elapsed, letters, columns, rows, drops, drop_chars;
    var AudioTimeout = false, LastSoundTime = new Date(), isSilent = false, frequencyArray, frequencyArrayLength = 128, column_frequency;
    var column_hue, row_hue;
    var font_fraction;
    var mask1Dom = document.getElementById("m1");
    var mask1 = mask1Dom.getContext("2d");
    var mask2Dom = document.getElementById("m2");
    var mask2 = mask2Dom.getContext("2d");
    var c = document.getElementById("neomatrix");
    var ctx = c.getContext("2d");

    updateCanvasSize();
    updateCharSet();
    updateFont();
    startAnimating();

    function updateCanvasSize() {
        c.height = window.innerHeight;
        c.width = window.innerWidth;
        mask1Dom.height = window.innerHeight;
        mask1Dom.width = window.innerWidth;
        mask2Dom.height = window.innerHeight;
        mask2Dom.width = window.innerWidth;
    }

    function updateMask() {
        let img = new Image();

        img.onload = function () {
            drawBlackMask();

            let img_width = (c.height / 2) * (img.width / img.height) * options.ui_logo_scale;
            let img_height = (c.height / 2) * options.ui_logo_scale;

            mask1.globalCompositeOperation = 'destination-out';
            mask1.drawImage(img, c.width / 2 - img_width / 2 + options.ui_logo_positionX, c.height / 2 - img_height / 2 + options.ui_logo_positionY, img_width, img_height);

            mask2.clearRect(0, 0, c.width, c.height);
            mask2.drawImage(img, c.width / 2 - img_width / 2 + options.ui_logo_positionX, c.height / 2 - img_height / 2 + options.ui_logo_positionY, img_width, img_height);
        };

        switch (options.ui_logo_logo) {
            case "0": {
                drawBlackMask();
                break;
            }
            case "1": {
                img.src = options.ui_logo_customLogo;
                break;
            }
            default: {
                img.src = "images/" + logos[parseInt(options.ui_logo_logo) - 2] + ".svg";
            }
        }
    }

    function drawBlackMask() {
        mask1.globalCompositeOperation = 'source-over';
        mask1.clearRect(0, 0, c.width, c.height);
        mask1.fillStyle = "rgba(0, 0, 0, " + options.trailLength + ")";
        mask1.fillRect(0, 0, c.width, c.height);

        if (true) {
            mask1.globalCompositeOperation = 'destination-out';
            mask1.fillStyle = "#FFF";
            mask1.fillText("Hello this is a Text", options.ui_font_size * 3 - font_fraction, options.ui_font_size * 10 +font_fraction);
            mask1.globalCompositeOperation = 'source-over';
        }
    }

    function drawMask() {
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(mask1Dom, 0, 0);

        if (options.ui_logo_preserveColor) {
            ctx.globalCompositeOperation = 'source-atop';
            ctx.drawImage(mask2Dom, 0, 0);
            ctx.globalCompositeOperation = 'source-over';
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

        ctx.font = options.ui_font_size + "px " + font_name;
        mask1.font = options.ui_font_size * 5 + "px neo-matrix";
        font_fraction = options.ui_font_size / 4;

        updateGrid();
        updateMask();
        fallAnimation();
    }

    function updateGrid() {
        columns = c.width / options.ui_font_size;
        rows = c.height / options.ui_font_size;
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
                ctx.clearRect(i * options.ui_font_size, ((drops[i][0] - 2) * options.ui_font_size) + font_fraction, options.ui_font_size, options.ui_font_size);

                var tmp = drops[i][0] - 1;
                ctx.fillStyle = calculateColor(i, tmp, drop_chars[i][1]);
                ctx.fillText(drop_chars[i][0], i * options.ui_font_size, tmp * options.ui_font_size);

                ctx.fillStyle = "#FFF";
            }
            else
                ctx.fillStyle = calculateColor(i, drops[i][0], lightness);

            ctx.clearRect(i * options.ui_font_size, ((drops[i][0] - 1) * options.ui_font_size) + font_fraction, options.ui_font_size, options.ui_font_size);
            drop_chars[i] = [character, lightness];
            ctx.fillText(character, i * options.ui_font_size, drops[i][0] * options.ui_font_size);

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

