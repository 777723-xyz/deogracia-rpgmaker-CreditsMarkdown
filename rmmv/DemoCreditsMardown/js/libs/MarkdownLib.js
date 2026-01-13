/**
 * @file MarkdownLib.js
 * @description Convert Mardown to RPG Maker MV text codes and
 *
 * <script type="text/javascript" src="js/libs/MarkdownLib.js"></script>
 *
 * has to be added in the index.html file body tag, just before rpgcore.js
 * @author Gemini / DeoGracia
 * @version 1.1.0
 * @date 2026-01-12
 * @initialrelease 2026-01-08
 *
 * Changelog
 * - 2026-01-12 1.1.0
 *   Use color instead of height for H1 and H2
 * - 2026-01-08 1.0.0
 *   Initial commit
 */
(function() {
    'use strict';

    class MarkdownLib {
        // --- API Publique ---
        
        static process(text, maxWidth = null) {
            if (!text) return "";
            if (!maxWidth) maxWidth = Graphics.boxWidth - 56; 

            const converted = this._convertCodes(text);
            return this._applyWordWrap(converted, maxWidth);
        }

        // --- Méthodes Internes ---

        static _convertCodes(text) {
            //text = text.replace(/^#\s+(.*)$/gm, '\\{ \\{ $1 \\} \\}');    // H1
            text = text.replace(/^#\s+(.*)$/gm, '\\C[10] $1 \\C[0]');    // H1
            text = text.replace(/^##\s+(.*)$/gm, '\\C[9] $1 \\C[0]');          // H2
            text = text.replace(/\*\*(.*?)\*\*/g, '\\C[14] $1 \\C[0]');  // Gras
            text = text.replace(/(\*|_)(.*?)\1/g, '\\C[3] $2 \\C[0]');   // Italique
            text = text.replace(/^[\-\*]\s+(.*)$/gm, '  • $1');        // Liste
            text = text.replace(/^---$/gm, '------------------------'); // HR
			console.log(text);
            return text;
        }

        static _applyWordWrap(text, maxWidth) {
            const paragraphs = text.split('\n');
            let wrappedLines = [];
            
            const bitmap = new Bitmap(1, 1);
            bitmap.fontFace = $gameSystem.mainFontFace ? $gameSystem.mainFontFace() : 'GameFont';
            bitmap.fontSize = 28; 

            for (let paragraph of paragraphs) {
                if (paragraph.trim() === "") {
                    wrappedLines.push(""); 
                    continue;
                }
                let words = paragraph.split(' ');
                let currentLine = words[0];

                for (let i = 1; i < words.length; i++) {
                    let word = words[i];
                    let testLine = currentLine + " " + word;
                    
                    if (this._measureTextWidth(bitmap, testLine) < maxWidth) {
                        currentLine = testLine;
                    } else {
                        wrappedLines.push(currentLine);
                        currentLine = word;
                    }
                }
                wrappedLines.push(currentLine);
            }
            return wrappedLines.join('\n');
        }

        static _measureTextWidth(bitmap, text) {
            const cleanText = text.replace(/\\(C\[\d+\]|I|B|\{|\}|\||\.|\||\$|\.|>|<|!|\^|\\)/gi, '');
            return bitmap.measureTextWidth(cleanText);
        }
    }

    // Exposition globale
    window.MarkdownLib = MarkdownLib;

})();