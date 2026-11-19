// Leonida Legend — GTA 6 trophy guide & tracker.
// Plain classic script, no libraries: loads app/data/trophies.json, renders the
// checklist, the detail panel, the roadmap and the missables page, and keeps
// progress in localStorage with export / import. Nothing leaves the browser.

(function () {
  'use strict';

  var STORE_KEY = 'leonida-legend-v1';
  var DATA_URL = 'data/trophies.json';

  var KIND_LABELS = {
    platinum: 'Platinum path',
    story: 'Story',
    side: 'Side strand',
    collectible: 'Collectible',
    activity: 'Activity',
    crime: 'Crime',
    exploration: 'Exploration'
  };

  var STAGES = [
    { n: 1, title: 'Play the story — Chapters 1–4 and the finale', hours: '60–80 hours',
      blurb: 'Just enjoy the campaign. The 12 story trophies (chapter and mission trophies) pop as you play, including the gold for the final mission. Do Lucia\u2019s Chapter 1 balcony meditation before the chapter ends — it is the only thing in the game that can be missed.',
      ids: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] },
    { n: 2, title: 'Side strands — the people of Leonida', hours: '15–25 hours',
      blurb: 'Finish the mission strands for Andy, Kenton, Billy, Randy and Tyrone, hunt the unique animal for Bret, and complete 8 stranger strands in total for the silver. All of it can be done after the story.',
      ids: [22, 23, 24, 25, 26, 27, 29] },
    { n: 3, title: 'Explore and collect', hours: '30–50 hours',
      blurb: 'Reveal all 52 areas of Leonida, meditate at all 18 spots (with both characters where you can), scan 100 WAiNK locations, discover 100 vehicles, and finish 3 card sets — or 15, if you are going for 100%.',
      ids: [28, 30, 31, 35, 42, 44, 50] },
    { n: 4, title: 'Activities and skill', hours: '40–60 hours',
      blurb: 'The long grind: 250 stunts, gold in all 42 shooting range challenges, 20 different race wins, a drone race win at all 14 locations, a fishing win over Cal, an arcade game, a bowling game, 50 challenges, and max Strength for both characters.',
      ids: [15, 16, 17, 18, 19, 20, 21, 32, 46, 47] },
    { n: 5, title: 'Crime, cash and cleanup', hours: '20–40 hours',
      blurb: 'Robberies with your partner, 5 bank vaults, an armored truck, a jewelry store, one illegal operation per gang, and the money trophies: $250,000 laundered, $100,000 spent, 8 garages bought, 10 vehicles registered. Most of it builds up while you do everything else.',
      ids: [33, 34, 36, 37, 38, 39, 40, 41, 43, 45, 48, 49, 51, 52, 53, 54, 55] },
    { n: 6, title: 'The platinum', hours: 'The last stretch',
      blurb: 'Reach 100% completion for the gold, then the platinum pops with the last trophy you earn. Check the 100% checklist in-game (Touch Pad, then Progress, then 100% Completion) for whatever is still open.',
      ids: [14, 1] }
  ];

  // ---------- state ----------
  var trophies = [];
  var byId = {};
  var earned = {};   // id -> true
  var counts = {};   // id -> number
  var spoiler = false;
  var selectedId = null;
  var view = 'checklist';

  function loadStore() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (data.earned) data.earned.forEach(function (id) { earned[id] = true; });
      if (data.counts) counts = data.counts;
      if (typeof data.spoiler === 'boolean') spoiler = data.spoiler;
    } catch (e) { /* a corrupt store starts empty */ }
  }

  function saveStore() {
    var data = {
      app: 'leonida-legend',
      version: 1,
      earned: Object.keys(earned).map(Number),
      counts: counts,
      spoiler: spoiler
    };
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) { /* storage full or blocked */ }
  }

  // ---------- helpers ----------
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }
  function gradeClass(grade) { return 'grade-' + grade; }
  function formatCount(n) { return n >= 1000 ? n.toLocaleString('en-US') : String(n); }
  function isSpoilerHidden(t) { return spoiler && t.kind === 'story' && !earned[t.id]; }
  function earnedCount() { return Object.keys(earned).length; }

  // ---------- filtering ----------
  function currentFilter() {
    return {
      q: ($('searchInput').value || '').trim().toLowerCase(),
      kind: $('kindFilter').value,
      grade: $('gradeFilter').value,
      status: $('statusFilter').value
    };
  }

  function trophyMatches(t, f) {
    if (f.kind === 'missable') { if (!t.missable) return false; }
    else if (f.kind !== 'all' && t.kind !== f.kind) return false;
    if (f.grade !== 'all' && t.grade !== f.grade) return false;
    if (f.status === 'earned' && !earned[t.id]) return false;
    if (f.status === 'todo' && earned[t.id]) return false;
    if (f.q) {
      var hay = (t.name + ' ' + t.description + ' ' + t.guide + ' ' + t.kind + ' ' + (KIND_LABELS[t.kind] || '')).toLowerCase();
      if (hay.indexOf(f.q) === -1) return false;
    }
    return true;
  }

  function filteredTrophies() {
    var f = currentFilter();
    return trophies.filter(function (t) { return trophyMatches(t, f); });
  }

  // ---------- progress header ----------
  function renderProgress() {
    var total = trophies.length;
    var done = earnedCount();
    var pct = total ? Math.round((done / total) * 100) : 0;
    $('earnedCount').textContent = done;
    $('earnedPct').textContent = pct + '%';
    $('remainingCount').textContent = (total - done) + ' to go';
    $('progressFill').style.width = pct + '%';
    $('progressBarWrap').setAttribute('aria-valuenow', String(done));
    var grades = { platinum: [0, 1], gold: [0, 2], silver: [0, 6], bronze: [0, 46] };
    trophies.forEach(function (t) {
      if (earned[t.id]) grades[t.grade][0] += 1;
    });
    $('gradeLine').textContent = 'Platinum ' + grades.platinum[0] + '/1 \u00b7 Gold ' + grades.gold[0] + '/2 \u00b7 Silver ' + grades.silver[0] + '/6 \u00b7 Bronze ' + grades.bronze[0] + '/46';
  }

  // ---------- checklist ----------
  function renderList() {
    var list = $('trophyList');
    var shown = filteredTrophies();
    list.replaceChildren();
    $('listMeta').textContent = shown.length === trophies.length
      ? 'Showing all ' + trophies.length + ' trophies.'
      : 'Showing ' + shown.length + ' of ' + trophies.length + ' trophies.';
    shown.forEach(function (t) {
      var li = el('li', 'trophy-row' + (earned[t.id] ? ' earned' : '') + (selectedId === t.id ? ' selected' : ''));
      li.setAttribute('data-id', t.id);

      var box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = !!earned[t.id];
      box.setAttribute('aria-label', 'Earned: ' + t.name);
      box.addEventListener('click', function (ev) { ev.stopPropagation(); });
      box.addEventListener('change', function () { setEarned(t.id, box.checked); });
      li.appendChild(box);

      var mid = el('div', 'trophy-main');
      if (isSpoilerHidden(t)) {
        mid.appendChild(el('div', 'trophy-name spoiler-mask', 'Hidden story trophy — earn it to reveal'));
        mid.appendChild(el('div', 'trophy-desc spoiler-mask', 'Name and description hidden by the spoiler setting.'));
      } else {
        mid.appendChild(el('div', 'trophy-name', t.name));
        mid.appendChild(el('div', 'trophy-desc', t.description));
      }
      var tags = el('div', 'trophy-tags');
      tags.appendChild(el('span', 'tag', KIND_LABELS[t.kind] || t.kind));
      if (t.hidden) tags.appendChild(el('span', 'tag hidden-tag', 'Hidden'));
      if (t.missable) tags.appendChild(el('span', 'tag missable', 'Possibly missable'));
      if (t.count) {
        var have = counts[t.id] || 0;
        tags.appendChild(el('span', 'tag count', formatCount(have) + ' / ' + formatCount(t.count)));
      }
      mid.appendChild(tags);
      li.appendChild(mid);

      var side = el('div', 'trophy-side');
      side.appendChild(el('span', 'grade-badge ' + gradeClass(t.grade), t.grade));
      li.appendChild(side);

      li.addEventListener('click', function () { selectTrophy(t.id); });
      list.appendChild(li);
    });
    if (!shown.length) {
      var empty = el('li', 'trophy-row', 'No trophies match these filters.');
      empty.style.cursor = 'default';
      list.appendChild(empty);
    }
  }

  // ---------- detail panel ----------
  function renderDetail() {
    var t = byId[selectedId];
    var empty = $('detailEmpty');
    var card = $('detailCard');
    if (!t) { empty.classList.remove('hidden'); card.classList.add('hidden'); return; }
    empty.classList.add('hidden');
    card.classList.remove('hidden');

    var gradeBadge = $('detailGrade');
    gradeBadge.textContent = t.grade;
    gradeBadge.className = 'grade-badge ' + gradeClass(t.grade);
    $('detailKind').textContent = KIND_LABELS[t.kind] || t.kind;
    $('detailStage').textContent = 'Stage ' + t.stage + ' of the roadmap';
    $('detailName').textContent = isSpoilerHidden(t) ? 'Hidden story trophy' : t.name;
    $('detailDesc').textContent = isSpoilerHidden(t)
      ? 'Its name and description are hidden until you earn it (spoiler setting is on).'
      : t.description;
    $('detailHiddenNote').classList.toggle('hidden', !t.hidden);
    $('detailMissable').classList.toggle('hidden', !t.missable);

    var counter = $('detailCounter');
    if (t.count) {
      counter.classList.remove('hidden');
      $('countValue').textContent = formatCount(counts[t.id] || 0);
      $('countTarget').textContent = formatCount(t.count);
    } else {
      counter.classList.add('hidden');
    }

    $('detailGuide').textContent = isSpoilerHidden(t)
      ? 'The guide is hidden with the trophy. Earn it in the game, tick the box, and the guide appears here.'
      : t.guide;

    var sources = $('detailSources');
    sources.replaceChildren();
    (t.sources || []).forEach(function (s) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = s.url;
      a.textContent = s.name;
      a.target = '_blank';
      a.rel = 'noopener';
      li.appendChild(a);
      sources.appendChild(li);
    });

    var earnedBox = $('detailEarned');
    earnedBox.checked = !!earned[t.id];
  }

  function selectTrophy(id) {
    selectedId = id;
    renderList();
    renderDetail();
    if (view !== 'checklist') showView('checklist');
  }

  function stepTrophy(dir) {
    var shown = filteredTrophies();
    if (!shown.length) return;
    var idx = shown.findIndex(function (t) { return t.id === selectedId; });
    var next = idx === -1 ? 0 : (idx + dir + shown.length) % shown.length;
    selectTrophy(shown[next].id);
  }

  // ---------- earning & counting ----------
  function setEarned(id, on) {
    if (on) earned[id] = true; else delete earned[id];
    saveStore();
    renderProgress();
    renderList();
    renderDetail();
    renderRoadmap();
  }

  function setCount(id, value) {
    var t = byId[id];
    if (!t || !t.count) return;
    value = Math.max(0, Math.min(t.count, value));
    counts[id] = value;
    if (value >= t.count) earned[id] = true;
    if (value < t.count && earned[id] && counts[id] !== undefined) {
      /* keep the tick if the player earned it some other way; only the counter moves */
    }
    saveStore();
    renderProgress();
    renderList();
    renderDetail();
    renderRoadmap();
  }

  // ---------- roadmap ----------
  function renderRoadmap() {
    var wrap = $('roadmapStages');
    wrap.replaceChildren();
    STAGES.forEach(function (stage) {
      var li = el('li', 'roadmap-stage');
      var done = stage.ids.filter(function (id) { return earned[id]; }).length;
      var h = el('h3');
      var num = el('span', 'stage-num', 'Stage ' + stage.n);
      h.appendChild(num);
      h.appendChild(document.createTextNode(stage.title + '  '));
      var hours = el('span', 'stage-progress', done + '/' + stage.ids.length + ' earned \u00b7 ' + stage.hours);
      h.appendChild(hours);
      li.appendChild(h);
      li.appendChild(el('p', null, stage.blurb));
      var chips = el('div', 'stage-trophies');
      stage.ids.forEach(function (id) {
        var t = byId[id];
        if (!t) return;
        var chip = el('button', 'stage-chip' + (earned[id] ? ' done' : ''), '');
        chip.type = 'button';
        var g = el('span', 'chip-grade', t.grade === 'platinum' ? '\u25c6 ' : t.grade === 'gold' ? '\u25c6 ' : t.grade === 'silver' ? '\u25c6 ' : '\u25cf ');
        chip.appendChild(g);
        chip.appendChild(document.createTextNode(isSpoilerHidden(t) ? 'Hidden story trophy' : t.name));
        if (t.missable) chip.appendChild(document.createTextNode(' \u26a0'));
        chip.addEventListener('click', function () { selectTrophy(id); });
        chips.appendChild(chip);
      });
      li.appendChild(chips);
      wrap.appendChild(li);
    });
  }

  // ---------- missables ----------
  function renderMissables() {
    var wrap = $('missableList');
    wrap.replaceChildren();
    var list = trophies.filter(function (t) { return t.missable; });
    $('missableBadge').textContent = list.length;
    list.forEach(function (t) {
      var card = el('article', 'missable-card');
      card.appendChild(el('h3', null, (earned[t.id] ? '\u2713 ' : '\u26a0 ') + t.name + ' — ' + t.description));
      card.appendChild(el('p', null, t.guide));
      var src = el('p', 'save-advice-sources', 'Sources: ');
      (t.sources || []).forEach(function (s, i) {
        if (i) src.appendChild(document.createTextNode(' \u00b7 '));
        var a = document.createElement('a');
        a.href = s.url;
        a.textContent = s.name;
        a.target = '_blank';
        a.rel = 'noopener';
        src.appendChild(a);
      });
      card.appendChild(src);
      var go = el('button', 'btn btn-small', 'Open in the checklist');
      go.type = 'button';
      go.addEventListener('click', function () { selectTrophy(t.id); });
      card.appendChild(go);
      wrap.appendChild(card);
    });
    if (!list.length) wrap.appendChild(el('p', null, 'No missable trophies are flagged.'));
  }

  // ---------- views ----------
  var VIEW_IDS = { checklist: 'viewChecklist', roadmap: 'viewRoadmap', missable: 'viewMissable', about: 'viewAbout' };

  function showView(name) {
    view = VIEW_IDS[name] ? name : 'checklist';
    Object.keys(VIEW_IDS).forEach(function (key) {
      $(VIEW_IDS[key]).classList.toggle('hidden', key !== view);
      var tab = document.querySelector('.tab[data-view="' + key + '"]');
      if (tab) tab.classList.toggle('active', key === view);
    });
    if (view === 'roadmap') renderRoadmap();
    if (view === 'missable') renderMissables();
    if (location.hash !== '#' + view && view !== 'checklist') {
      try { history.replaceState(null, '', '#' + view); } catch (e) { /* ignore */ }
    }
  }

  // ---------- export / import / reset ----------
  function exportProgress() {
    var data = {
      app: 'leonida-legend',
      version: 1,
      exportedAt: new Date().toISOString(),
      earned: Object.keys(earned).map(Number),
      earnedNames: Object.keys(earned).map(function (id) { return byId[id] ? byId[id].name : id; }),
      counts: counts,
      spoiler: spoiler
    };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'leonida-legend-progress.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(String(reader.result));
        var ids = [];
        if (Array.isArray(data)) ids = data;
        else if (Array.isArray(data.earned)) ids = data.earned;
        var next = {};
        ids.forEach(function (entry) {
          if (typeof entry === 'number' && byId[entry]) next[entry] = true;
          else if (typeof entry === 'string') {
            var found = trophies.find(function (t) { return t.name === entry; });
            if (found) next[found.id] = true;
          }
        });
        earned = next;
        if (data && data.counts && typeof data.counts === 'object') {
          counts = {};
          Object.keys(data.counts).forEach(function (key) {
            var t = byId[key];
            if (t && t.count) counts[key] = Math.max(0, Math.min(t.count, Number(data.counts[key]) || 0));
          });
        }
        if (data && typeof data.spoiler === 'boolean') {
          spoiler = data.spoiler;
          $('spoilerToggle').checked = spoiler;
        }
        saveStore();
        renderAll();
      } catch (e) {
        window.alert('That file is not a Leonida Legend progress file.');
      }
    };
    reader.readAsText(file);
  }

  function resetProgress() {
    if (!window.confirm('Reset all progress? Your earned trophies and counters will be cleared in this browser.')) return;
    earned = {};
    counts = {};
    saveStore();
    renderAll();
  }

  // ---------- demo seed (for screenshots only) ----------
  function applyDemoSeed() {
    var params = new URLSearchParams(location.search);
    if (params.get('demo') === '1') {
      var seedEarned = [2, 3, 4, 5, 8, 9, 15, 16, 20, 21, 35, 44, 46];
      seedEarned.forEach(function (id) { earned[id] = true; });
      counts = { 15: 87, 28: 6, 30: 1, 31: 42, 35: 61, 42: 31 };
      saveStore();
      selectedId = 28;
    }
    // Deep links used by the screenshots (and by anyone sharing a view):
    // ?spoiler=1 hides story trophies; ?kind=story&grade=bronze&status=todo
    // pre-set the filters.
    if (params.get('spoiler') === '1') { spoiler = true; saveStore(); }
    if (params.get('spoiler') === '0') { spoiler = false; saveStore(); }
    ['kind', 'grade', 'status'].forEach(function (key) {
      var value = params.get(key);
      var select = $(key + 'Filter');
      if (value && select && select.querySelector('option[value="' + value + '"]')) {
        select.value = value;
      }
    });
  }

  // ---------- render all ----------
  function renderAll() {
    renderProgress();
    renderList();
    renderDetail();
    renderRoadmap();
    renderMissables();
  }

  // ---------- boot ----------
  function boot() {
    loadStore();
    fetch(DATA_URL).then(function (res) {
      if (!res.ok) throw new Error('trophies.json did not load');
      return res.json();
    }).then(function (doc) {
      trophies = doc.trophies || doc;
      trophies.forEach(function (t) { byId[t.id] = t; });
      applyDemoSeed();

      $('spoilerToggle').checked = spoiler;
      $('spoilerToggle').addEventListener('change', function () {
        spoiler = this.checked;
        saveStore();
        renderList();
        renderDetail();
        renderRoadmap();
      });
      $('searchInput').addEventListener('input', renderList);
      $('kindFilter').addEventListener('change', renderList);
      $('gradeFilter').addEventListener('change', renderList);
      $('statusFilter').addEventListener('change', renderList);
      $('exportBtn').addEventListener('click', exportProgress);
      $('importBtn').addEventListener('click', function () { $('importFile').click(); });
      $('importFile').addEventListener('change', function () {
        if (this.files[0]) importProgress(this.files[0]);
        this.value = '';
      });
      $('resetBtn').addEventListener('click', resetProgress);
      $('detailEarned').addEventListener('change', function () {
        if (selectedId) setEarned(selectedId, this.checked);
      });
      $('countMinus').addEventListener('click', function () {
        if (selectedId) setCount(selectedId, (counts[selectedId] || 0) - 1);
      });
      $('countPlus').addEventListener('click', function () {
        if (selectedId) setCount(selectedId, (counts[selectedId] || 0) + 1);
      });
      $('prevTrophy').addEventListener('click', function () { stepTrophy(-1); });
      $('nextTrophy').addEventListener('click', function () { stepTrophy(1); });
      document.querySelectorAll('.tab').forEach(function (tab) {
        tab.addEventListener('click', function () { showView(tab.getAttribute('data-view')); });
      });

      var hash = (location.hash || '').replace('#', '');
      if (hash === 'roadmap' || hash === 'missable' || hash === 'about') showView(hash);
      else if (hash.indexOf('trophy-') === 0) {
        var id = Number(hash.slice(7));
        if (byId[id]) selectedId = id;
      }
      if (selectedId && !byId[selectedId]) selectedId = null;

      renderAll();
      window.leonidaReady = true;
    }).catch(function (err) {
      $('trophyList').replaceChildren();
      var li = el('li', 'trophy-row', 'Could not load the trophy data (data/trophies.json). ' + err.message);
      li.style.cursor = 'default';
      $('trophyList').appendChild(li);
    });
  }

  // Test hook: read-only snapshot of the tracker's state.
  window.leonidaStats = function () {
    return {
      total: trophies.length,
      earned: earnedCount(),
      selected: selectedId,
      view: view,
      spoiler: spoiler,
      visible: filteredTrophies().length
    };
  };

  boot();
})();
