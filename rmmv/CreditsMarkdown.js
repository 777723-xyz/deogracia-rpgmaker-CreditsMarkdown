/*:
 * @plugindesc v1.3.0 [MV] Affiche les crédits (Markdown) multilingues avec détection auto (DKTools).
 * @author Gemini / DeoGracia
 *
 * @param --- Fichiers ---
 *
 * @param Default Language
 * @desc Code langue par défaut si aucune traduction n'est trouvée (ex: en, fr).
 * @default fr
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
 * 2026-01-09 v1.3.0 :
 *   - Ajout de la compatibilité automatique avec DKTools Localization.
 * 2026-01-08 v1.2.0 :
 *   - Ajout de MarkdownLib.js
 *   - réecriture pour utiliser une window au lieu d'un sprite (gère nativement
 *     les codes texte)
 * 2026-01-07 v1.1.0 :
 *   - Ajout de la selection du BGM
 * 2026-01-07 v1.0.0 :
 *   - Création initiale du plugin
 * ============================================================================
 * CREDITS MARKDOWN SCROLL
 * ============================================================================
 * Affiche un texte défilant lu depuis des fichiers Markdown externes.
 * Nécessite la librairie 'MarkdownLib.js' dans js/libs/.
 *
 * Ce plugin cherche la valeur de la locale dans cet ordre de priorité pour la langue :
 * 1. La locale de DKTools (si le plugin est installé).
 * 2. La variable 'language' du ConfigManager (si vous l'avez définie).
 * 3. Le paramètre 'Default Language' de ce plugin.
 *
 * --- Structure des dossiers ---
 * Placez vos fichiers crédits dans : data/credits/
 * Nommez-les par code langue : credits_fr.md, credits_en.md, credits_es.md...
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
 * COMMANDES DE SCRIPT
 * ============================================================================
 * * SceneManager.push(Scene_Credits);
 * ============================================================================
 */

(function() {
    'use strict';

    var parameters = PluginManager.parameters('CreditsMarkdown');
    var defaultLang = parameters['Default Language'] || 'fr';
    var bgImageName = parameters['Background Image'] || '';
    var addToTitle = (parameters['Add To Title'] === 'true');
    var titleCommandName = parameters['Title Command Name'] || 'Crédits';
    var scrollSpeed = Number(parameters['Scroll Speed']) || 1;
    
    // Paramètres Audio
    var bgmName = parameters['BGM Name'] || '';
    var bgmVolume = Number(parameters['BGM Volume']) || 90;
    var bgmPitch = Number(parameters['BGM Pitch']) || 100;

    //-----------------------------------------------------------------------------
    // Modification du Menu Titre
    //-----------------------------------------------------------------------------
    if (addToTitle) {
        var _Window_TitleCommand_makeCommandList = Window_TitleCommand.prototype.makeCommandList;
        Window_TitleCommand.prototype.makeCommandList = function() {
            _Window_TitleCommand_makeCommandList.call(this);
            this.addCommand(titleCommandName, 'credits');
        };

        var _Scene_Title_createCommandWindow = Scene_Title.prototype.createCommandWindow;
        Scene_Title.prototype.createCommandWindow = function() {
            _Scene_Title_createCommandWindow.call(this);
            this._commandWindow.setHandler('credits', this.commandCredits.bind(this));
        };

        Scene_Title.prototype.commandCredits = function() {
            this._commandWindow.close();
            SceneManager.push(Scene_Credits);
        };
    }

    //-----------------------------------------------------------------------------
    // Scene_Credits
    //-----------------------------------------------------------------------------
    function Scene_Credits() {
        this.initialize.apply(this, arguments);
    }

    Scene_Credits.prototype = Object.create(Scene_Base.prototype);
    Scene_Credits.prototype.constructor = Scene_Credits;

    Scene_Credits.prototype.initialize = function() {
        Scene_Base.prototype.initialize.call(this);
        this._textLoaded = false;
        this._scrollWindow = null;
    };

    Scene_Credits.prototype.create = function() {
        Scene_Base.prototype.create.call(this);
        this.createBackground();
        this.createScrollWindow();
        this.loadCreditsText();
        this.playCreditsMusic();
    };

    Scene_Credits.prototype.createBackground = function() {
        this._backSprite = new Sprite();
        if (bgImageName) {
            this._backSprite.bitmap = ImageManager.loadPicture(bgImageName);
        } else {
            // Fond noir par défaut si pas d'image
            this._backSprite.bitmap = new Bitmap(Graphics.boxWidth, Graphics.boxHeight);
            this._backSprite.bitmap.fillAll('black');
        }
        this.addChild(this._backSprite);
    };

    Scene_Credits.prototype.createScrollWindow = function() {
        // On crée une fenêtre standard qui prend tout l'écran
        // 0, 0, Largeur, Hauteur
        this._scrollWindow = new Window_Base(0, 0, Graphics.boxWidth, Graphics.boxHeight);
        
        // On la rend complètement invisible (pas de cadre, pas de fond dégradé)
        this._scrollWindow.opacity = 0;
        
        // On retire le padding standard pour utiliser tout l'espace
        this._scrollWindow.padding = 0;
        this.addChild(this._scrollWindow);
    };

    Scene_Credits.prototype.playCreditsMusic = function() {
        if (bgmName) {
            AudioManager.playBgm({
                name: bgmName,
                volume: bgmVolume,
                pitch: bgmPitch,
                pan: 0
            });
        }
    };

    // --- C'est ici que se trouve la logique de détection ---
    Scene_Credits.prototype.loadCreditsText = function() {
        var fs = require('fs');
        var path = require('path');
        
        // 1. Initialisation de la variable langue
        var currentLang = '';

        // 2. Vérification de DKTools Localization
        // On vérifie d'abord si l'objet DKTools existe pour éviter un crash
        if (typeof DKTools !== 'undefined' && DKTools.Localization) {
            currentLang = DKTools.Localization.locale;
        } 
        
        // 3. Sinon, on vérifie votre ConfigManager personnalisé (si vous l'utilisez)
        if (!currentLang && ConfigManager['language']) {
            currentLang = ConfigManager['language'];
        }

        // 4. Si toujours rien, on utilise la langue par défaut du plugin
        if (!currentLang) {
            currentLang = defaultLang;
        }

        // Nettoyage : On ne garde que les 2 premiers caractères (ex: "fr-FR" -> "fr")
        // .trim() retire les espaces potentiels
        currentLang = String(currentLang).trim().substring(0, 2).toLowerCase();

        // 5. Construction du chemin
        var baseDir = path.dirname(process.mainModule.filename);
        var creditsDir = path.join(baseDir, 'data', 'credits');
        var filePath = path.join(creditsDir, 'credits_' + currentLang + '.md');

        // 6. Sécurité : si le fichier n'existe pas, on tente la langue par défaut
        if (!fs.existsSync(filePath)) {
            // Petite log pour le debug (touche F8)
            console.warn("CreditsMarkdown: Fichier " + currentLang + " introuvable, chargement du défaut.");
            filePath = path.join(creditsDir, 'credits_' + defaultLang + '.md');
        }

        // Lecture et Affichage
        if (fs.existsSync(filePath)) {
            var text = fs.readFileSync(filePath, 'utf8');
            this.parseAndDraw(text);
        } else {
            console.error("CreditsMarkdown: Aucun fichier de crédits trouvé dans " + creditsDir);
            this.parseAndDraw("# ERREUR\nFichier de crédits manquant (vérifiez /data/credits/)."); 
        }
    };

    Scene_Credits.prototype.parseAndDraw = function(text) {
        // Utilisation de MarkdownLib
        if (typeof MarkdownLib === 'undefined') {
            this._scrollWindow.drawTextEx("Erreur : MarkdownLib.js manquant dans js/libs/ !", 0, Graphics.boxHeight);
            return;
        }

        const fullText = MarkdownLib.process(text, Graphics.boxWidth);
        
        // 2. Découpage ligne par ligne
        const lines = fullText.split('\n');
        const lineHeight = 36;
        const totalHeight = (lines.length * lineHeight) + Graphics.boxHeight;
        
        this._scrollWindow.createContents();
        this._scrollWindow.contents = new Bitmap(Graphics.boxWidth, totalHeight);

        // 5. Dessin Ligne par Ligne
        lines.forEach((line, i) => {
            if (!line) return;
            let textWidth = this._scrollWindow.drawTextEx(line, 0, -1000);
            
            // Calcul de la position X pour centrer
            let x = (Graphics.boxWidth - textWidth) / 2;
            
            // Calcul de la position Y
            // On ajoute Graphics.boxHeight pour que la 1ère ligne commence "sous" l'écran
            let y = (i * lineHeight) + Graphics.boxHeight;

            // Vrai dessin
            this._scrollWindow.drawTextEx(line, x, y);
        });

        this._textLoaded = true;
    };

    Scene_Credits.prototype.update = function() {
        Scene_Base.prototype.update.call(this);
        
        if (this._textLoaded) {
            // Défilement via 'origin.y' (comme un ascenseur)
            this._scrollWindow.origin.y += scrollSpeed;
            
            // Condition de fin : 
            // Quand le haut de la fenêtre (origin) a dépassé la hauteur totale du contenu
            if (this._scrollWindow.origin.y >= this._scrollWindow.contents.height) {
                this.terminateScene();
            }

            // Sortie manuelle (Annuler / Toucher)
            if (Input.isTriggered('cancel') || TouchInput.isCancelled()) {
                this.terminateScene();
            }
        }
    };

    Scene_Credits.prototype.terminateScene = function() {
        AudioManager.fadeOutBgm(1);
        SoundManager.playCancel();
        console.log("Fin du défilement crédits.");
        this.popScene(); // Retour à la scène précédente (Titre ou Map)
    };

    // Exposition globale de la classe (optionnel, pour debug)
    window.Scene_Credits = Scene_Credits;

})();