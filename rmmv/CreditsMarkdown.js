/*:
 * @plugindesc v1.1.0 [MV] Affiche les crédits (Markdown) multilingues avec défilement, image de fond et menu titre.
 * @author Gemini / DeoGracia
 *
 * @param --- Fichiers ---
 *
 * @param Default Language
 * @desc Code langue par défaut si la traduction manque (ex: en, fr).
 * @default en
 *
 * @param Background Image
 * @desc Nom de l'image dans img/pictures/ (sans l'extension).
 * @default credits_bg
 *
 * @param --- Menu Titre ---
 *
 * @param Add To Title
 * @desc Ajouter l'option Crédits au menu titre ? (true / false)
 * @type boolean
 * @default true
 *
 * @param Title Command Name
 * @desc Nom affiché dans le menu titre.
 * @default Crédits
 *
 * @param --- Animation ---
 *
 * @param Scroll Speed
 * @desc Vitesse de défilement.
 * @default 1
 *
 * @param BGM Name
 * @desc Nom du fichier BGM à jouer (dans audio/bgm/). Laissez vide pour aucun son.
 * @default 
 *
 * @param BGM Volume
 * @desc Volume de la musique (0 à 100).
 * @default 90
 *
 * @param BGM Pitch
 * @desc Pitch de la musique (50 à 150).
 * @default 100
 *
 * @help
 * ============================================================================
 * HISTORIQUE DES VERSIONS / CHANGELOG
 * ============================================================================
 * 2026-01-07 v1.1.0 :
 *   - Ajout de la selection du BGM
 * 2026-01-07 v1.0.0 :
 *   - Création initiale du plugin
 * ============================================================================
 *
 * ============================================================================
 * INSTRUCTIONS
 * ============================================================================
 * 1. DOSSIER DATA :
 * Créez vos fichiers de crédits dans le dossier /data/credits/ de votre projet :
 * - credits_fr.md (pour le français)
 * - credits_en.md (pour l'anglais)
 * - credits_es.md (pour l'espagnol)
 * etc.
 *
 * 2. IMAGE :
 * Placez une image de fond dans 'img/pictures/credits_bg.png'.
 *
 * 3. DEFINIR LA LANGUE (SANS PLUGIN EXTERNE) :
 * Pour changer la langue, faites une commande de script dans un événement :
 * $gameSystem.language = 'fr';
 * ou
 * $gameSystem.language = 'en';
 *
 * Si cette variable n'est pas définie, le jeu utilisera la langue
 * de l'ordinateur du joueur.
 *
 * ============================================================================
 */

(function() {
    const parameters = PluginManager.parameters('CreditsMarkdown');
    const defaultLang = String(parameters['Default Language'] || 'en');
    const bgImageName = String(parameters['Background Image'] || 'credits_bg');
    const scrollSpeed = Number(parameters['Scroll Speed'] || 1);
    const addToTitle = String(parameters['Add To Title']) === 'true';
	const bgmName = String(parameters['BGM Name'] || '');
    const bgmVolume = Number(parameters['BGM Volume'] || 90);
    const bgmPitch = Number(parameters['BGM Pitch'] || 100);
    const titleCommandName = String(parameters['Title Command Name'] || 'Crédits');

    // --- INTEGRATION AU MENU TITRE ---
    if (addToTitle) {
        const _Window_TitleCommand_makeCommandList = Window_TitleCommand.prototype.makeCommandList;
        Window_TitleCommand.prototype.makeCommandList = function() {
            _Window_TitleCommand_makeCommandList.call(this);
            this.addCommand(titleCommandName, 'credits');
        };

        const _Scene_Title_createCommandWindow = Scene_Title.prototype.createCommandWindow;
        Scene_Title.prototype.createCommandWindow = function() {
            _Scene_Title_createCommandWindow.call(this);
            this._commandWindow.setHandler('credits', this.commandCredits.bind(this));
        };

        Scene_Title.prototype.commandCredits = function() {
            this._commandWindow.close();
            SceneManager.push(Scene_Credits);
        };
    }

    // --- CLASSE SCENE_CREDITS ---
    function Scene_Credits() {
        this.initialize.apply(this, arguments);
    }

    Scene_Credits.prototype = Object.create(Scene_Base.prototype);
    Scene_Credits.prototype.constructor = Scene_Credits;

    Scene_Credits.prototype.initialize = function() {
        Scene_Base.prototype.initialize.call(this);
        this._textLoaded = false;
    };

	Scene_Credits.prototype.create = function() {
        Scene_Base.prototype.create.call(this);
        this.createBackground();
        this.createScrollContainer();
        this.loadMarkdown();
        this.playCreditsBgm(); // Appel de la nouvelle fonction
    };

    Scene_Credits.prototype.playCreditsBgm = function() {
        if (bgmName && bgmName.trim() !== "") {
            const bgm = {
                name: bgmName,
                volume: bgmVolume,
                pitch: bgmPitch,
                pan: 0
            };
            AudioManager.playBgm(bgm);
        } else {
            // Si aucun nom n'est renseigné, on peut choisir de couper la musique actuelle
            AudioManager.stopBgm();
        }
    };

    Scene_Credits.prototype.createBackground = function() {
        this._backSprite = new Sprite();
        this._backSprite.bitmap = ImageManager.loadPicture(bgImageName);
        this.addChild(this._backSprite);
    };

    Scene_Credits.prototype.createScrollContainer = function() {
        this._scrollSprite = new Sprite();
        this._scrollSprite.y = Graphics.boxHeight; 
        this.addChild(this._scrollSprite);
    };

    // --- CŒUR DE LA LOGIQUE MULTILINGUE ---
    Scene_Credits.prototype.loadMarkdown = function() {
        // 1. Détection de la langue cible
        // On cherche d'abord la variable définie par le dev ($gameSystem.language)
        // Sinon on prend la langue du navigateur/système
        let targetLang = "";

        if (window.$gameSystem && $gameSystem.language) {
            targetLang = $gameSystem.language;
        } else {
            targetLang = navigator.language || defaultLang;
        }

        // On nettoie le code (ex: "fr-FR" devient "fr")
        targetLang = targetLang.substring(0, 2).toLowerCase();

        // 2. Tentative de chargement du fichier spécifique
        const url = 'data/credits/credits_' + targetLang + '.md';
        this.tryLoadFile(url, true);
    };

    Scene_Credits.prototype.tryLoadFile = function(url, isFirstTry) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.overrideMimeType('text/plain');
        
        xhr.onload = () => {
            if (xhr.status < 400) {
                // Succès !
                this.parseAndDraw(xhr.responseText);
            } else {
                // Fichier non trouvé (404)
                if (isFirstTry) {
                    console.warn("Fichier " + url + " introuvable. Chargement du défaut.");
                    this.loadDefaultFile();
                } else {
                    this.onLoadError();
                }
            }
        };
        
        xhr.onerror = () => {
            if (isFirstTry) this.loadDefaultFile();
            else this.onLoadError();
        };
        
        xhr.send();
    };

    Scene_Credits.prototype.loadDefaultFile = function() {
        // On tente de charger la langue par défaut définie dans les paramètres du plugin
        const url = 'data/credits/credits_' + defaultLang + '.md';
        this.tryLoadFile(url, false);
    };

    Scene_Credits.prototype.onLoadError = function() {
        console.error("Aucun fichier de crédits trouvé (ni langue, ni défaut).");
        SceneManager.pop();
    };
    // --------------------------------------

    Scene_Credits.prototype.parseAndDraw = function(text) {
        const lines = text.split('\n');
        const lineHeight = 40;
        const bitmapHeight = (lines.length * lineHeight) + Graphics.boxHeight;
        this._scrollSprite.bitmap = new Bitmap(Graphics.boxWidth, bitmapHeight);
        
        lines.forEach((line, i) => {
            let cleanLine = line.trim();
            if (cleanLine === "") return;

            if (cleanLine.startsWith('# ')) {
                this._scrollSprite.bitmap.textColor = '#ffff00'; 
                this._scrollSprite.bitmap.fontSize = 38;
                cleanLine = cleanLine.replace('# ', '');
            } else if (cleanLine.startsWith('## ')) {
                this._scrollSprite.bitmap.textColor = '#80ffff';
                this._scrollSprite.bitmap.fontSize = 32;
                cleanLine = cleanLine.replace('## ', '');
            } else {
                this._scrollSprite.bitmap.textColor = '#ffffff';
                this._scrollSprite.bitmap.fontSize = 28;
                cleanLine = cleanLine.replace(/\*\*/g, "");
            }
            
            this._scrollSprite.bitmap.drawText(cleanLine, 0, i * lineHeight, Graphics.boxWidth, lineHeight, 'center');
        });

        this._textLoaded = true;
    };

    Scene_Credits.prototype.update = function() {
        Scene_Base.prototype.update.call(this);
        if (this._textLoaded) {
            this._scrollSprite.y -= scrollSpeed;
            
            // Calcul plus permissif : on s'arrête quand le BAS du bitmap 
            // passe au-dessus du HAUT de l'écran.
            if (this._scrollSprite.y < -this._scrollSprite.bitmap.height) {
                this.terminateScene();
            }

            // Sortie manuelle
            if (Input.isTriggered('cancel') || TouchInput.isCancelled()) {
                this.terminateScene();
            }
        }
    };

    // Nouvelle fonction pour assurer une sortie propre
    Scene_Credits.prototype.terminateScene = function() {
// On fait un fondu de la musique pour une transition propre
        AudioManager.fadeOutBgm(1);		
        SoundManager.playCancel(); // Petit feedback sonore
		console.log("Fin du défilement détectée, retour à la scène précédente.");
        SceneManager.pop();
    };

    window.Scene_Credits = Scene_Credits;
})();