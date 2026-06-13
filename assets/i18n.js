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
      "footer.terms": "Terms & Conditions", "footer.privacy": "Privacy Policy"
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
      "footer.terms": "Termeni și condiții", "footer.privacy": "Politica de confidențialitate"
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
      "footer.terms": "Términos y condiciones", "footer.privacy": "Política de privacidad"
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
      "footer.terms": "Allgemeine Geschäftsbedingungen", "footer.privacy": "Datenschutzerklärung"
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
      "footer.terms": "Conditions générales", "footer.privacy": "Politique de confidentialité"
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
      "footer.terms": "利用規約", "footer.privacy": "プライバシーポリシー"
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
      "footer.terms": "条款和条件", "footer.privacy": "隐私政策"
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
      "footer.terms": "नियम और शर्तें", "footer.privacy": "गोपनीयता नीति"
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
