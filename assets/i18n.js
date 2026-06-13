/* Crono — tiny i18n engine + string tables (UMD: window.CronoI18n + Node require for tests).
   - No build, no deps, offline-first: all languages ship in this one file and are precached.
   - HTML: elements carry data-i18n="key" (text) and/or data-i18n-attr="attr:key,attr2:key2".
   - JS: CronoI18n.t("key", {n: 3}) — {placeholders} are substituted.
   - Language is saved in crono.lang; default follows navigator.language; English is the fallback.
   - Legal text (Terms/Privacy + consent) stays English by design and is NOT keyed here.
   NOTE: ja/zh/hi (and nuances elsewhere) are first-pass translations — fine for short UI labels,
   but worth a native review. Keep every language's key set identical (a test enforces it). */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;   // Node (tests)
  root.CronoI18n = api;
  if (typeof document !== "undefined") api._initBrowser();                  // browser only
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var LANGS = ["en", "ro", "es", "de", "fr", "ja", "zh", "hi"];
  var NAMES = { en: "English", ro: "Română", es: "Español", de: "Deutsch", fr: "Français", ja: "日本語", zh: "中文", hi: "हिन्दी" };

  var STR = {
    en: {
      "tagline": "Chronometer for small & in-house sport competitions",
      "nav.demo": "Demo", "nav.support": "Support", "nav.coffee": "Buy me a coffee", "lang.label": "Language",
      "start.title": "Start time", "start.setNow": "Set now", "start.sincePrefix": "Start",
      "start.hint": "When the race started — every result is timed from here. Editing it recalculates all times.",
      "start.timeSince": "Time since start",
      "dist.label": "Distance (km)", "dist.placeholder": "optional",
      "dist.hint": "Optional — shows each finisher's pace (min/km).",
      "options.title": "Options", "options.preview": "Participants, export, backup & clear",
      "btn.participants": "Participants", "btn.exportCsv": "Export CSV", "btn.exportPdf": "Export PDF",
      "btn.backup": "Backup", "btn.restore": "Restore", "btn.clear": "Clear results",
      "help.summary": "What do these buttons do?",
      "capture.label": "Runner number — tap Record or press Enter to log the finish",
      "btn.record": "Record", "runner.aria": "Runner number",
      "results.recorded": "recorded", "search.placeholder": "Search number or name…",
      "th.place": "Place", "th.number": "Number", "th.name": "Name", "th.obs": "Obs.", "th.time": "Time",
      "empty.msg": "No results yet. Enter a runner number above and press Record as each finishes.",
      "footer.app": "Crono — runs fully offline in your browser. Data is stored locally on this device.",
      "footer.terms": "Terms & Conditions", "footer.privacy": "Privacy Policy",
      "tab.all": "All", "tab.men": "Men", "tab.women": "Women",
      "empty.noMatch": "No results match your search.", "empty.noneInRanking": "No finishers in this ranking yet.",
      "stats.participants": "{n} participants loaded", "stats.duplicates": "{n} duplicates",
      "toast.recorded": "Recorded #{n}", "btn.undo": "Undo", "toast.removed": "Removed #{n}",
      "toast.badJson": "That file isn't valid JSON.", "toast.badBackup": "That doesn't look like a Crono backup file.",
      "toast.backupDownloaded": "Backup downloaded", "toast.backupRestored": "Backup restored",
      "toast.resultSaved": "Result saved", "toast.resultRemoved": "Result removed",
      "toast.badTime": "Time must be H:MM:SS, MM:SS or with .cc", "toast.badStart": "Enter the start time as HH:MM:SS",
      "toast.importNone": "No valid rows found. Expected: number, name, sex, birth_year",
      "confirm.ok": "Confirm", "confirm.cancel": "Cancel",
      "setStart.title": "Set start to now?", "setStart.msg": "This recalculates the time of all {n} recorded finisher(s).", "setStart.ok": "Set start",
      "clear.title": "Clear all results?", "clear.msg": "All {n} recorded result(s) will be permanently deleted.",
      "restore.title": "Restore backup?", "restore.msg": "This replaces the current start time, {n} result(s) and the participant list with the backup's contents.",
      "removeResult.title": "Remove result", "removeResult.msg": "Remove runner {n} from the results?", "removeResult.ok": "Remove",
      "delPart.title": "Delete participant", "delPart.msg": "Remove participant {n} from the roster?", "delPart.ok": "Delete",
      "part.title": "Participants", "part.search": "Search number or name…", "part.import": "Import CSV", "part.add": "Add",
      "ph.name": "name", "ph.year": "year", "ph.number": "number", "ph.note": "add note…",
      "sound.title": "Beep on record",
      "row.title": "Edit result", "row.bib": "Bib number", "row.time": "Finish time", "row.sex": "Sex", "row.year": "Birth year", "row.note": "Note", "row.delete": "Delete", "row.save": "Save",
      "demo.title": "How to use Crono", "demo.intro": "Set the start and (optional) distance, then type each bib number and hit Record as runners finish. This preview plays by itself:"
    },
    ro: {
      "tagline": "Cronometru pentru competiții sportive mici și interne",
      "nav.demo": "Demo", "nav.support": "Susține", "nav.coffee": "Cumpără-mi o cafea", "lang.label": "Limbă",
      "start.title": "Ora de start", "start.setNow": "Acum", "start.sincePrefix": "Start",
      "start.hint": "Când a început cursa — fiecare rezultat se cronometrează de aici. Modificarea recalculează toți timpii.",
      "start.timeSince": "Timp de la start",
      "dist.label": "Distanță (km)", "dist.placeholder": "opțional",
      "dist.hint": "Opțional — arată ritmul fiecărui sosit (min/km).",
      "options.title": "Opțiuni", "options.preview": "Participanți, export, backup și ștergere",
      "btn.participants": "Participanți", "btn.exportCsv": "Export CSV", "btn.exportPdf": "Export PDF",
      "btn.backup": "Backup", "btn.restore": "Restaurare", "btn.clear": "Șterge rezultatele",
      "help.summary": "Ce fac aceste butoane?",
      "capture.label": "Număr concurent — apasă Înregistrează sau Enter pentru a salva sosirea",
      "btn.record": "Înregistrează", "runner.aria": "Număr concurent",
      "results.recorded": "înregistrate", "search.placeholder": "Caută număr sau nume…",
      "th.place": "Loc", "th.number": "Număr", "th.name": "Nume", "th.obs": "Obs.", "th.time": "Timp",
      "empty.msg": "Niciun rezultat încă. Introdu un număr de concurent mai sus și apasă Înregistrează pe măsură ce sosesc.",
      "footer.app": "Crono — funcționează complet offline în browser. Datele sunt stocate local pe acest dispozitiv.",
      "footer.terms": "Termeni și condiții", "footer.privacy": "Politica de confidențialitate",
      "tab.all": "Toate", "tab.men": "Bărbați", "tab.women": "Femei",
      "empty.noMatch": "Niciun rezultat nu corespunde căutării.", "empty.noneInRanking": "Niciun sosit în acest clasament încă.",
      "stats.participants": "{n} participanți încărcați", "stats.duplicates": "{n} duplicate",
      "toast.recorded": "Înregistrat #{n}", "btn.undo": "Anulează", "toast.removed": "Șters #{n}",
      "toast.badJson": "Fișierul nu este JSON valid.", "toast.badBackup": "Nu pare un fișier de backup Crono.",
      "toast.backupDownloaded": "Backup descărcat", "toast.backupRestored": "Backup restaurat",
      "toast.resultSaved": "Rezultat salvat", "toast.resultRemoved": "Rezultat șters",
      "toast.badTime": "Timpul trebuie H:MM:SS, MM:SS sau cu .cc", "toast.badStart": "Introdu ora de start ca HH:MM:SS",
      "toast.importNone": "Niciun rând valid. Format așteptat: number, name, sex, birth_year",
      "confirm.ok": "Confirmă", "confirm.cancel": "Anulează",
      "setStart.title": "Setezi startul acum?", "setStart.msg": "Asta recalculează timpul tuturor celor {n} sosiți înregistrați.", "setStart.ok": "Setează startul",
      "clear.title": "Ștergi toate rezultatele?", "clear.msg": "Toate cele {n} rezultate înregistrate vor fi șterse definitiv.",
      "restore.title": "Restaurezi backup-ul?", "restore.msg": "Asta înlocuiește ora de start curentă, cele {n} rezultate și lista de participanți cu conținutul backup-ului.",
      "removeResult.title": "Șterge rezultatul", "removeResult.msg": "Scoți concurentul {n} din rezultate?", "removeResult.ok": "Șterge",
      "delPart.title": "Șterge participantul", "delPart.msg": "Scoți participantul {n} din listă?", "delPart.ok": "Șterge",
      "part.title": "Participanți", "part.search": "Caută număr sau nume…", "part.import": "Import CSV", "part.add": "Adaugă",
      "ph.name": "nume", "ph.year": "an", "ph.number": "număr", "ph.note": "adaugă notă…",
      "sound.title": "Bip la înregistrare",
      "row.title": "Editează rezultatul", "row.bib": "Număr concurent", "row.time": "Timp sosire", "row.sex": "Sex", "row.year": "An naștere", "row.note": "Notă", "row.delete": "Șterge", "row.save": "Salvează",
      "demo.title": "Cum se folosește Crono", "demo.intro": "Setează startul și (opțional) distanța, apoi tastează fiecare număr și apasă Înregistrează pe măsură ce sosesc. Această previzualizare rulează singură:"
    },
    es: {
      "tagline": "Cronómetro para competiciones deportivas pequeñas e internas",
      "nav.demo": "Demo", "nav.support": "Apoyar", "nav.coffee": "Invítame un café", "lang.label": "Idioma",
      "start.title": "Hora de inicio", "start.setNow": "Ahora", "start.sincePrefix": "Inicio",
      "start.hint": "Cuando empezó la carrera — cada resultado se cronometra desde aquí. Editarla recalcula todos los tiempos.",
      "start.timeSince": "Tiempo desde el inicio",
      "dist.label": "Distancia (km)", "dist.placeholder": "opcional",
      "dist.hint": "Opcional — muestra el ritmo de cada finalista (min/km).",
      "options.title": "Opciones", "options.preview": "Participantes, exportar, copia y borrar",
      "btn.participants": "Participantes", "btn.exportCsv": "Exportar CSV", "btn.exportPdf": "Exportar PDF",
      "btn.backup": "Copia", "btn.restore": "Restaurar", "btn.clear": "Borrar resultados",
      "help.summary": "¿Qué hacen estos botones?",
      "capture.label": "Número de corredor — toca Registrar o pulsa Enter para guardar la llegada",
      "btn.record": "Registrar", "runner.aria": "Número de corredor",
      "results.recorded": "registrados", "search.placeholder": "Buscar número o nombre…",
      "th.place": "Puesto", "th.number": "Número", "th.name": "Nombre", "th.obs": "Obs.", "th.time": "Tiempo",
      "empty.msg": "Aún no hay resultados. Escribe un número de corredor arriba y pulsa Registrar conforme lleguen.",
      "footer.app": "Crono — funciona totalmente sin conexión en tu navegador. Los datos se guardan localmente en este dispositivo.",
      "footer.terms": "Términos y condiciones", "footer.privacy": "Política de privacidad",
      "tab.all": "Todos", "tab.men": "Hombres", "tab.women": "Mujeres",
      "empty.noMatch": "Ningún resultado coincide con tu búsqueda.", "empty.noneInRanking": "Aún no hay finalistas en esta clasificación.",
      "stats.participants": "{n} participantes cargados", "stats.duplicates": "{n} duplicados",
      "toast.recorded": "Registrado #{n}", "btn.undo": "Deshacer", "toast.removed": "Eliminado #{n}",
      "toast.badJson": "El archivo no es JSON válido.", "toast.badBackup": "No parece un archivo de copia de Crono.",
      "toast.backupDownloaded": "Copia descargada", "toast.backupRestored": "Copia restaurada",
      "toast.resultSaved": "Resultado guardado", "toast.resultRemoved": "Resultado eliminado",
      "toast.badTime": "El tiempo debe ser H:MM:SS, MM:SS o con .cc", "toast.badStart": "Introduce la hora de inicio como HH:MM:SS",
      "toast.importNone": "No se encontraron filas válidas. Formato: number, name, sex, birth_year",
      "confirm.ok": "Confirmar", "confirm.cancel": "Cancelar",
      "setStart.title": "¿Poner el inicio ahora?", "setStart.msg": "Esto recalcula el tiempo de los {n} finalistas registrados.", "setStart.ok": "Fijar inicio",
      "clear.title": "¿Borrar todos los resultados?", "clear.msg": "Los {n} resultados registrados se eliminarán permanentemente.",
      "restore.title": "¿Restaurar copia?", "restore.msg": "Esto reemplaza la hora de inicio actual, los {n} resultados y la lista de participantes con el contenido de la copia.",
      "removeResult.title": "Eliminar resultado", "removeResult.msg": "¿Quitar al corredor {n} de los resultados?", "removeResult.ok": "Eliminar",
      "delPart.title": "Eliminar participante", "delPart.msg": "¿Quitar al participante {n} de la lista?", "delPart.ok": "Eliminar",
      "part.title": "Participantes", "part.search": "Buscar número o nombre…", "part.import": "Importar CSV", "part.add": "Añadir",
      "ph.name": "nombre", "ph.year": "año", "ph.number": "número", "ph.note": "añadir nota…",
      "sound.title": "Pitido al registrar",
      "row.title": "Editar resultado", "row.bib": "Número de dorsal", "row.time": "Hora de llegada", "row.sex": "Sexo", "row.year": "Año de nacimiento", "row.note": "Nota", "row.delete": "Eliminar", "row.save": "Guardar",
      "demo.title": "Cómo usar Crono", "demo.intro": "Configura el inicio y (opcional) la distancia, luego escribe cada dorsal y pulsa Registrar conforme llegan. Esta vista previa se reproduce sola:"
    },
    de: {
      "tagline": "Stoppuhr für kleine und interne Sportwettbewerbe",
      "nav.demo": "Demo", "nav.support": "Unterstützen", "nav.coffee": "Spendier mir einen Kaffee", "lang.label": "Sprache",
      "start.title": "Startzeit", "start.setNow": "Jetzt", "start.sincePrefix": "Start",
      "start.hint": "Wann das Rennen begann — jedes Ergebnis wird von hier gemessen. Eine Änderung berechnet alle Zeiten neu.",
      "start.timeSince": "Zeit seit dem Start",
      "dist.label": "Distanz (km)", "dist.placeholder": "optional",
      "dist.hint": "Optional — zeigt das Tempo jedes Finishers (min/km).",
      "options.title": "Optionen", "options.preview": "Teilnehmer, Export, Backup & Löschen",
      "btn.participants": "Teilnehmer", "btn.exportCsv": "CSV exportieren", "btn.exportPdf": "PDF exportieren",
      "btn.backup": "Backup", "btn.restore": "Wiederherstellen", "btn.clear": "Ergebnisse löschen",
      "help.summary": "Was machen diese Schaltflächen?",
      "capture.label": "Startnummer — tippe auf Erfassen oder drücke Enter, um den Zieleinlauf zu speichern",
      "btn.record": "Erfassen", "runner.aria": "Startnummer",
      "results.recorded": "erfasst", "search.placeholder": "Nummer oder Name suchen…",
      "th.place": "Platz", "th.number": "Nummer", "th.name": "Name", "th.obs": "Anm.", "th.time": "Zeit",
      "empty.msg": "Noch keine Ergebnisse. Gib oben eine Startnummer ein und drücke Erfassen, sobald jemand ins Ziel kommt.",
      "footer.app": "Crono — läuft komplett offline in deinem Browser. Daten werden lokal auf diesem Gerät gespeichert.",
      "footer.terms": "Allgemeine Geschäftsbedingungen", "footer.privacy": "Datenschutzerklärung",
      "tab.all": "Alle", "tab.men": "Männer", "tab.women": "Frauen",
      "empty.noMatch": "Keine Ergebnisse für deine Suche.", "empty.noneInRanking": "Noch keine Finisher in dieser Wertung.",
      "stats.participants": "{n} Teilnehmer geladen", "stats.duplicates": "{n} Duplikate",
      "toast.recorded": "Erfasst #{n}", "btn.undo": "Rückgängig", "toast.removed": "Entfernt #{n}",
      "toast.badJson": "Die Datei ist kein gültiges JSON.", "toast.badBackup": "Das sieht nicht nach einer Crono-Backup-Datei aus.",
      "toast.backupDownloaded": "Backup heruntergeladen", "toast.backupRestored": "Backup wiederhergestellt",
      "toast.resultSaved": "Ergebnis gespeichert", "toast.resultRemoved": "Ergebnis entfernt",
      "toast.badTime": "Zeit muss H:MM:SS, MM:SS oder mit .cc sein", "toast.badStart": "Gib die Startzeit als HH:MM:SS ein",
      "toast.importNone": "Keine gültigen Zeilen gefunden. Format: number, name, sex, birth_year",
      "confirm.ok": "Bestätigen", "confirm.cancel": "Abbrechen",
      "setStart.title": "Start auf jetzt setzen?", "setStart.msg": "Dies berechnet die Zeit aller {n} erfassten Finisher neu.", "setStart.ok": "Start setzen",
      "clear.title": "Alle Ergebnisse löschen?", "clear.msg": "Alle {n} erfassten Ergebnisse werden dauerhaft gelöscht.",
      "restore.title": "Backup wiederherstellen?", "restore.msg": "Dies ersetzt die aktuelle Startzeit, die {n} Ergebnisse und die Teilnehmerliste durch den Inhalt des Backups.",
      "removeResult.title": "Ergebnis entfernen", "removeResult.msg": "Läufer {n} aus den Ergebnissen entfernen?", "removeResult.ok": "Entfernen",
      "delPart.title": "Teilnehmer löschen", "delPart.msg": "Teilnehmer {n} aus der Liste entfernen?", "delPart.ok": "Löschen",
      "part.title": "Teilnehmer", "part.search": "Nummer oder Name suchen…", "part.import": "CSV importieren", "part.add": "Hinzufügen",
      "ph.name": "Name", "ph.year": "Jahr", "ph.number": "Nummer", "ph.note": "Notiz hinzufügen…",
      "sound.title": "Piepton beim Erfassen",
      "row.title": "Ergebnis bearbeiten", "row.bib": "Startnummer", "row.time": "Zielzeit", "row.sex": "Geschlecht", "row.year": "Geburtsjahr", "row.note": "Notiz", "row.delete": "Löschen", "row.save": "Speichern",
      "demo.title": "So funktioniert Crono", "demo.intro": "Lege Start und (optional) Distanz fest, tippe dann jede Startnummer ein und drücke Erfassen, sobald Läufer ankommen. Diese Vorschau läuft von selbst:"
    },
    fr: {
      "tagline": "Chronomètre pour petites compétitions sportives internes",
      "nav.demo": "Démo", "nav.support": "Soutenir", "nav.coffee": "Offre-moi un café", "lang.label": "Langue",
      "start.title": "Heure de départ", "start.setNow": "Maintenant", "start.sincePrefix": "Départ",
      "start.hint": "Quand la course a commencé — chaque résultat est chronométré à partir d'ici. La modifier recalcule tous les temps.",
      "start.timeSince": "Temps depuis le départ",
      "dist.label": "Distance (km)", "dist.placeholder": "facultatif",
      "dist.hint": "Facultatif — affiche l'allure de chaque arrivant (min/km).",
      "options.title": "Options", "options.preview": "Participants, export, sauvegarde et effacement",
      "btn.participants": "Participants", "btn.exportCsv": "Exporter CSV", "btn.exportPdf": "Exporter PDF",
      "btn.backup": "Sauvegarde", "btn.restore": "Restaurer", "btn.clear": "Effacer les résultats",
      "help.summary": "À quoi servent ces boutons ?",
      "capture.label": "Numéro de dossard — appuyez sur Enregistrer ou Entrée pour noter l'arrivée",
      "btn.record": "Enregistrer", "runner.aria": "Numéro de dossard",
      "results.recorded": "enregistrés", "search.placeholder": "Rechercher un numéro ou un nom…",
      "th.place": "Place", "th.number": "Numéro", "th.name": "Nom", "th.obs": "Obs.", "th.time": "Temps",
      "empty.msg": "Aucun résultat pour l'instant. Saisissez un numéro de dossard ci-dessus et appuyez sur Enregistrer à chaque arrivée.",
      "footer.app": "Crono — fonctionne entièrement hors ligne dans votre navigateur. Les données sont stockées localement sur cet appareil.",
      "footer.terms": "Conditions générales", "footer.privacy": "Politique de confidentialité",
      "tab.all": "Tous", "tab.men": "Hommes", "tab.women": "Femmes",
      "empty.noMatch": "Aucun résultat ne correspond à votre recherche.", "empty.noneInRanking": "Aucun arrivant dans ce classement pour l'instant.",
      "stats.participants": "{n} participants chargés", "stats.duplicates": "{n} doublons",
      "toast.recorded": "Enregistré #{n}", "btn.undo": "Annuler", "toast.removed": "Supprimé #{n}",
      "toast.badJson": "Le fichier n'est pas un JSON valide.", "toast.badBackup": "Cela ne ressemble pas à un fichier de sauvegarde Crono.",
      "toast.backupDownloaded": "Sauvegarde téléchargée", "toast.backupRestored": "Sauvegarde restaurée",
      "toast.resultSaved": "Résultat enregistré", "toast.resultRemoved": "Résultat supprimé",
      "toast.badTime": "Le temps doit être H:MM:SS, MM:SS ou avec .cc", "toast.badStart": "Saisissez l'heure de départ au format HH:MM:SS",
      "toast.importNone": "Aucune ligne valide. Format attendu : number, name, sex, birth_year",
      "confirm.ok": "Confirmer", "confirm.cancel": "Annuler",
      "setStart.title": "Définir le départ maintenant ?", "setStart.msg": "Cela recalcule le temps des {n} arrivants enregistrés.", "setStart.ok": "Définir le départ",
      "clear.title": "Effacer tous les résultats ?", "clear.msg": "Les {n} résultats enregistrés seront définitivement supprimés.",
      "restore.title": "Restaurer la sauvegarde ?", "restore.msg": "Cela remplace l'heure de départ actuelle, les {n} résultats et la liste des participants par le contenu de la sauvegarde.",
      "removeResult.title": "Supprimer le résultat", "removeResult.msg": "Retirer le coureur {n} des résultats ?", "removeResult.ok": "Supprimer",
      "delPart.title": "Supprimer le participant", "delPart.msg": "Retirer le participant {n} de la liste ?", "delPart.ok": "Supprimer",
      "part.title": "Participants", "part.search": "Rechercher un numéro ou un nom…", "part.import": "Importer CSV", "part.add": "Ajouter",
      "ph.name": "nom", "ph.year": "année", "ph.number": "numéro", "ph.note": "ajouter une note…",
      "sound.title": "Bip à l'enregistrement",
      "row.title": "Modifier le résultat", "row.bib": "Numéro de dossard", "row.time": "Heure d'arrivée", "row.sex": "Sexe", "row.year": "Année de naissance", "row.note": "Note", "row.delete": "Supprimer", "row.save": "Enregistrer",
      "demo.title": "Comment utiliser Crono", "demo.intro": "Définissez le départ et (facultatif) la distance, puis saisissez chaque dossard et appuyez sur Enregistrer à chaque arrivée. Cet aperçu se joue tout seul :"
    },
    ja: {
      "tagline": "小規模・社内スポーツ大会向けのストップウォッチ",
      "nav.demo": "デモ", "nav.support": "支援する", "nav.coffee": "コーヒーをおごる", "lang.label": "言語",
      "start.title": "スタート時刻", "start.setNow": "現在に設定", "start.sincePrefix": "スタート",
      "start.hint": "レースの開始時刻です。すべての結果はここから計測されます。変更するとすべてのタイムが再計算されます。",
      "start.timeSince": "スタートからの経過時間",
      "dist.label": "距離 (km)", "dist.placeholder": "任意",
      "dist.hint": "任意 — 各完走者のペース（分/km）を表示します。",
      "options.title": "オプション", "options.preview": "参加者・エクスポート・バックアップ・消去",
      "btn.participants": "参加者", "btn.exportCsv": "CSVエクスポート", "btn.exportPdf": "PDFエクスポート",
      "btn.backup": "バックアップ", "btn.restore": "復元", "btn.clear": "結果を消去",
      "help.summary": "これらのボタンの機能は？",
      "capture.label": "ゼッケン番号 — 記録をタップするかEnterでゴールを記録",
      "btn.record": "記録", "runner.aria": "ゼッケン番号",
      "results.recorded": "件記録", "search.placeholder": "番号または名前で検索…",
      "th.place": "順位", "th.number": "番号", "th.name": "名前", "th.obs": "備考", "th.time": "タイム",
      "empty.msg": "まだ結果がありません。上にゼッケン番号を入力し、ゴールするたびに記録を押してください。",
      "footer.app": "Crono — ブラウザで完全にオフラインで動作します。データはこの端末にローカル保存されます。",
      "footer.terms": "利用規約", "footer.privacy": "プライバシーポリシー",
      "tab.all": "すべて", "tab.men": "男子", "tab.women": "女子",
      "empty.noMatch": "検索に一致する結果はありません。", "empty.noneInRanking": "この順位にはまだ完走者がいません。",
      "stats.participants": "{n}名の参加者を読み込みました", "stats.duplicates": "重複{n}件",
      "toast.recorded": "記録 #{n}", "btn.undo": "元に戻す", "toast.removed": "削除 #{n}",
      "toast.badJson": "有効なJSONファイルではありません。", "toast.badBackup": "Cronoのバックアップファイルではないようです。",
      "toast.backupDownloaded": "バックアップをダウンロードしました", "toast.backupRestored": "バックアップを復元しました",
      "toast.resultSaved": "結果を保存しました", "toast.resultRemoved": "結果を削除しました",
      "toast.badTime": "時間は H:MM:SS、MM:SS または .cc 付きで入力してください", "toast.badStart": "スタート時刻を HH:MM:SS で入力してください",
      "toast.importNone": "有効な行が見つかりません。形式: number, name, sex, birth_year",
      "confirm.ok": "確認", "confirm.cancel": "キャンセル",
      "setStart.title": "スタートを現在に設定しますか？", "setStart.msg": "記録済みの完走者{n}名のタイムが再計算されます。", "setStart.ok": "スタートを設定",
      "clear.title": "すべての結果を消去しますか？", "clear.msg": "記録済みの{n}件の結果が完全に削除されます。",
      "restore.title": "バックアップを復元しますか？", "restore.msg": "現在のスタート時刻、{n}件の結果、参加者リストがバックアップの内容に置き換えられます。",
      "removeResult.title": "結果を削除", "removeResult.msg": "ランナー{n}を結果から削除しますか？", "removeResult.ok": "削除",
      "delPart.title": "参加者を削除", "delPart.msg": "参加者{n}をリストから削除しますか？", "delPart.ok": "削除",
      "part.title": "参加者", "part.search": "番号または名前で検索…", "part.import": "CSVインポート", "part.add": "追加",
      "ph.name": "名前", "ph.year": "年", "ph.number": "番号", "ph.note": "メモを追加…",
      "sound.title": "記録時にビープ音",
      "row.title": "結果を編集", "row.bib": "ゼッケン番号", "row.time": "ゴールタイム", "row.sex": "性別", "row.year": "生年", "row.note": "メモ", "row.delete": "削除", "row.save": "保存",
      "demo.title": "Cronoの使い方", "demo.intro": "スタートと（任意で）距離を設定し、ランナーがゴールするたびにゼッケン番号を入力して記録を押します。このプレビューは自動で再生されます："
    },
    zh: {
      "tagline": "适用于小型及内部体育比赛的计时器",
      "nav.demo": "演示", "nav.support": "支持", "nav.coffee": "请我喝杯咖啡", "lang.label": "语言",
      "start.title": "开始时间", "start.setNow": "设为现在", "start.sincePrefix": "开始",
      "start.hint": "比赛开始的时间——所有成绩都从此计时。修改后会重新计算所有时间。",
      "start.timeSince": "自开始以来的时间",
      "dist.label": "距离 (km)", "dist.placeholder": "可选",
      "dist.hint": "可选——显示每位完赛者的配速（分钟/公里）。",
      "options.title": "选项", "options.preview": "参赛者、导出、备份和清除",
      "btn.participants": "参赛者", "btn.exportCsv": "导出 CSV", "btn.exportPdf": "导出 PDF",
      "btn.backup": "备份", "btn.restore": "恢复", "btn.clear": "清除成绩",
      "help.summary": "这些按钮有什么用？",
      "capture.label": "选手号码——点击记录或按回车键记录到达",
      "btn.record": "记录", "runner.aria": "选手号码",
      "results.recorded": "条记录", "search.placeholder": "搜索号码或姓名…",
      "th.place": "名次", "th.number": "号码", "th.name": "姓名", "th.obs": "备注", "th.time": "时间",
      "empty.msg": "暂无成绩。在上方输入选手号码，每位完赛时按记录。",
      "footer.app": "Crono — 在您的浏览器中完全离线运行。数据保存在本设备本地。",
      "footer.terms": "条款和条件", "footer.privacy": "隐私政策",
      "tab.all": "全部", "tab.men": "男子", "tab.women": "女子",
      "empty.noMatch": "没有与搜索匹配的结果。", "empty.noneInRanking": "此排名中暂无完赛者。",
      "stats.participants": "已加载{n}名参赛者", "stats.duplicates": "{n}个重复",
      "toast.recorded": "已记录 #{n}", "btn.undo": "撤销", "toast.removed": "已删除 #{n}",
      "toast.badJson": "该文件不是有效的JSON。", "toast.badBackup": "这看起来不像Crono备份文件。",
      "toast.backupDownloaded": "备份已下载", "toast.backupRestored": "备份已恢复",
      "toast.resultSaved": "结果已保存", "toast.resultRemoved": "结果已删除",
      "toast.badTime": "时间必须为 H:MM:SS、MM:SS 或带 .cc", "toast.badStart": "请以 HH:MM:SS 输入开始时间",
      "toast.importNone": "未找到有效行。格式：number, name, sex, birth_year",
      "confirm.ok": "确认", "confirm.cancel": "取消",
      "setStart.title": "将开始时间设为现在？", "setStart.msg": "这将重新计算全部{n}名已记录完赛者的时间。", "setStart.ok": "设置开始",
      "clear.title": "清除所有成绩？", "clear.msg": "全部{n}条已记录成绩将被永久删除。",
      "restore.title": "恢复备份？", "restore.msg": "这将用备份内容替换当前的开始时间、{n}条成绩和参赛者列表。",
      "removeResult.title": "删除成绩", "removeResult.msg": "将选手{n}从成绩中移除？", "removeResult.ok": "移除",
      "delPart.title": "删除参赛者", "delPart.msg": "将参赛者{n}从名单中移除？", "delPart.ok": "删除",
      "part.title": "参赛者", "part.search": "搜索号码或姓名…", "part.import": "导入CSV", "part.add": "添加",
      "ph.name": "姓名", "ph.year": "年份", "ph.number": "号码", "ph.note": "添加备注…",
      "sound.title": "记录时蜂鸣",
      "row.title": "编辑成绩", "row.bib": "号码布", "row.time": "完赛时间", "row.sex": "性别", "row.year": "出生年份", "row.note": "备注", "row.delete": "删除", "row.save": "保存",
      "demo.title": "如何使用Crono", "demo.intro": "设置开始时间和（可选）距离，然后在每位跑者完赛时输入号码并按记录。此预览会自动播放："
    },
    hi: {
      "tagline": "छोटी और आंतरिक खेल प्रतियोगिताओं के लिए स्टॉपवॉच",
      "nav.demo": "डेमो", "nav.support": "सहयोग करें", "nav.coffee": "मुझे एक कॉफ़ी पिलाएँ", "lang.label": "भाषा",
      "start.title": "प्रारंभ समय", "start.setNow": "अभी सेट करें", "start.sincePrefix": "प्रारंभ",
      "start.hint": "दौड़ कब शुरू हुई — हर परिणाम यहीं से मापा जाता है। इसे बदलने पर सभी समय फिर से गणना होते हैं।",
      "start.timeSince": "प्रारंभ से समय",
      "dist.label": "दूरी (km)", "dist.placeholder": "वैकल्पिक",
      "dist.hint": "वैकल्पिक — हर फिनिशर की गति (मिनट/किमी) दिखाता है।",
      "options.title": "विकल्प", "options.preview": "प्रतिभागी, निर्यात, बैकअप और साफ़ करें",
      "btn.participants": "प्रतिभागी", "btn.exportCsv": "CSV निर्यात", "btn.exportPdf": "PDF निर्यात",
      "btn.backup": "बैकअप", "btn.restore": "पुनर्स्थापित करें", "btn.clear": "परिणाम साफ़ करें",
      "help.summary": "ये बटन क्या करते हैं?",
      "capture.label": "धावक नंबर — फिनिश दर्ज करने के लिए रिकॉर्ड दबाएँ या Enter दबाएँ",
      "btn.record": "रिकॉर्ड", "runner.aria": "धावक नंबर",
      "results.recorded": "दर्ज", "search.placeholder": "नंबर या नाम खोजें…",
      "th.place": "स्थान", "th.number": "नंबर", "th.name": "नाम", "th.obs": "टिप्पणी", "th.time": "समय",
      "empty.msg": "अभी तक कोई परिणाम नहीं। ऊपर धावक नंबर दर्ज करें और हर फिनिश पर रिकॉर्ड दबाएँ।",
      "footer.app": "Crono — आपके ब्राउज़र में पूरी तरह ऑफ़लाइन चलता है। डेटा इसी डिवाइस पर स्थानीय रूप से संग्रहित होता है।",
      "footer.terms": "नियम और शर्तें", "footer.privacy": "गोपनीयता नीति",
      "tab.all": "सभी", "tab.men": "पुरुष", "tab.women": "महिला",
      "empty.noMatch": "आपकी खोज से कोई परिणाम मेल नहीं खाता।", "empty.noneInRanking": "इस रैंकिंग में अभी कोई फिनिशर नहीं है।",
      "stats.participants": "{n} प्रतिभागी लोड हुए", "stats.duplicates": "{n} डुप्लिकेट",
      "toast.recorded": "दर्ज #{n}", "btn.undo": "पूर्ववत करें", "toast.removed": "हटाया #{n}",
      "toast.badJson": "फ़ाइल मान्य JSON नहीं है।", "toast.badBackup": "यह Crono बैकअप फ़ाइल नहीं लगती।",
      "toast.backupDownloaded": "बैकअप डाउनलोड हुआ", "toast.backupRestored": "बैकअप पुनर्स्थापित हुआ",
      "toast.resultSaved": "परिणाम सहेजा गया", "toast.resultRemoved": "परिणाम हटाया गया",
      "toast.badTime": "समय H:MM:SS, MM:SS या .cc के साथ होना चाहिए", "toast.badStart": "प्रारंभ समय HH:MM:SS के रूप में दर्ज करें",
      "toast.importNone": "कोई मान्य पंक्ति नहीं मिली। अपेक्षित: number, name, sex, birth_year",
      "confirm.ok": "पुष्टि करें", "confirm.cancel": "रद्द करें",
      "setStart.title": "प्रारंभ अभी सेट करें?", "setStart.msg": "इससे सभी {n} दर्ज फिनिशर का समय फिर से गणना होगा।", "setStart.ok": "प्रारंभ सेट करें",
      "clear.title": "सभी परिणाम साफ़ करें?", "clear.msg": "सभी {n} दर्ज परिणाम स्थायी रूप से हटा दिए जाएंगे।",
      "restore.title": "बैकअप पुनर्स्थापित करें?", "restore.msg": "इससे वर्तमान प्रारंभ समय, {n} परिणाम और प्रतिभागी सूची बैकअप की सामग्री से बदल जाएगी।",
      "removeResult.title": "परिणाम हटाएं", "removeResult.msg": "धावक {n} को परिणामों से हटाएं?", "removeResult.ok": "हटाएं",
      "delPart.title": "प्रतिभागी हटाएं", "delPart.msg": "प्रतिभागी {n} को सूची से हटाएं?", "delPart.ok": "हटाएं",
      "part.title": "प्रतिभागी", "part.search": "नंबर या नाम खोजें…", "part.import": "CSV आयात", "part.add": "जोड़ें",
      "ph.name": "नाम", "ph.year": "वर्ष", "ph.number": "नंबर", "ph.note": "नोट जोड़ें…",
      "sound.title": "रिकॉर्ड पर बीप",
      "row.title": "परिणाम संपादित करें", "row.bib": "धावक नंबर", "row.time": "फिनिश समय", "row.sex": "लिंग", "row.year": "जन्म वर्ष", "row.note": "नोट", "row.delete": "हटाएं", "row.save": "सहेजें",
      "demo.title": "Crono कैसे उपयोग करें", "demo.intro": "प्रारंभ और (वैकल्पिक) दूरी सेट करें, फिर हर धावक के फिनिश पर उसका नंबर टाइप करें और रिकॉर्ड दबाएं। यह पूर्वावलोकन स्वयं चलता है:"
    }
  };

  var KEY = "crono.lang";
  var current = "en";

  function pick() {
    var saved; try { saved = localStorage.getItem(KEY); } catch (e) {}
    if (saved && STR[saved]) return saved;
    var nav = "";
    try { nav = (navigator.language || "").slice(0, 2).toLowerCase(); } catch (e) {}
    return STR[nav] ? nav : "en";
  }

  function t(key, params) {
    var s = (STR[current] && STR[current][key]) || STR.en[key] || key;
    if (params) s = s.replace(/\{(\w+)\}/g, function (_, k) { return params[k] != null ? params[k] : "{" + k + "}"; });
    return s;
  }

  function applyDom(scope) {
    scope = scope || document;
    var nodes = scope.querySelectorAll("[data-i18n]"), i;
    for (i = 0; i < nodes.length; i++) nodes[i].textContent = t(nodes[i].getAttribute("data-i18n"));
    var attrs = scope.querySelectorAll("[data-i18n-attr]");
    for (i = 0; i < attrs.length; i++) {
      var el = attrs[i], pairs = el.getAttribute("data-i18n-attr").split(",");
      for (var j = 0; j < pairs.length; j++) {
        var bits = pairs[j].split(":");
        if (bits.length === 2) el.setAttribute(bits[0].replace(/\s/g, ""), t(bits[1].replace(/\s/g, "")));
      }
    }
  }

  function fire() {
    try { document.dispatchEvent(new CustomEvent("crono:langchange", { detail: { lang: current } })); }
    catch (e) { var ev = document.createEvent("Event"); ev.initEvent("crono:langchange", true, true); document.dispatchEvent(ev); }
  }

  function setLang(lang, persist) {
    if (!STR[lang]) lang = "en";
    current = lang;
    if (persist !== false) { try { localStorage.setItem(KEY, lang); } catch (e) {} }
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("lang", lang);
    applyDom(document);
    var sels = document.querySelectorAll("[data-lang-select]"), i;
    for (i = 0; i < sels.length; i++) sels[i].value = lang;
    fire();
  }

  function _initBrowser() {
    current = pick();
    function ready() {
      document.documentElement.setAttribute("lang", current);
      var sels = document.querySelectorAll("[data-lang-select]"), i, k;
      for (i = 0; i < sels.length; i++) {
        if (!sels[i].options.length) {
          for (k = 0; k < LANGS.length; k++) {
            var o = document.createElement("option");
            o.value = LANGS[k]; o.textContent = NAMES[LANGS[k]];
            sels[i].appendChild(o);
          }
        }
        sels[i].value = current;
        sels[i].addEventListener("change", function () { setLang(this.value); });
      }
      applyDom(document);
      fire();
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
    else ready();
  }

  return {
    LANGS: LANGS, NAMES: NAMES, STR: STR,
    t: t, setLang: setLang, apply: applyDom,
    lang: function () { return current; },
    _initBrowser: _initBrowser
  };
});
