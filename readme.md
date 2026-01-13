# CreditsMarkdown

Affiche les crédits (Markdown) multilingues avec détection auto (DKTools).

/!\ Nécessite la librairie `MarkdownLib.js` (https://github.com/deogracia/rpgmaker-markdownlib) dans `js/libs/`.


Ce plugin cherche la valeur de la locale dans cet ordre de priorité pour la langue :
 1. La locale de DKTools (si le plugin est installé).
 2. La variable 'language' du ConfigManager (si vous l'avez définie).
 3. Le paramètre 'Default Language' de ce plugin.

**Warning** : Code

* créé initialment par Gemini;
* code n'est testé qu'avec RPG Maker MV;

## Usage

 1. DOSSIER DATA :
 Créez vos fichiers de crédits dans le dossier `/data/credits/` de votre projet :
 - credits_fr.md (pour le français)
 - credits_en.md (pour l'anglais)
 - credits_es.md (pour l'espagnol)
 -  etc.
 
 2. IMAGE :
 Placez une image de fond dans `img/pictures/`, par défaut `credits_bg.png` y sera cherché.
 
 3. DEFINIR LA LANGUE (SANS PLUGIN EXTERNE) :
 Pour changer la langue, faites une commande de script dans un événement :
 `$gameSystem.language = 'fr';`
 ou
 `$gameSystem.language = 'en';`
 
 Si cette variable n'est pas définie, le jeu utilisera la langue de l'ordinateur du joueur.