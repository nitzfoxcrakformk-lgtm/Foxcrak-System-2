/* Liga 1 Perú APS: simulador independiente de temporada, standings, palmarés y tops.
   Todos los marcadores y jugadores son ficticios; no utiliza apuestas ni modifica R/. / D//. */
(function () {
  'use strict';
  const STORAGE_KEY = 'foxcrakPeruLiga1SeasonV2';
  const LEGACY_STORAGE_KEY = 'foxcrakPeruLiga1SeasonV1';
  const PHASES = ['Apertura', 'Clausura'];
  const MAX_MATCH_LOG = 4000;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').replace(/[^a-z0-9]+/g, ' ').trim();
  const number = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
  const fmt = v => new Intl.NumberFormat('es-PE').format(number(v));
  const notify = msg => window.FoxcrakApp?.notify?.(msg) || console.info('[FOXCRAK LIGA 1]', msg);
  const flagPeru = '🇵🇪';
  const fakeFirstNames = ['Alex','Bruno','Damián','Elías','Fabio','Gael','Iván','Julián','Leo','Mateo','Nicolás','Óscar','Piero','Renzo','Thiago','Valentín'];
  const fakeLastNames = ['Rojas','Vega','Salas','Paredes','Mendoza','Campos','Navarro','Reyes','Cruz','Flores','Vargas','Castro','Silva','Torres','Medina','Luna'];
  const ratingOverrides = {
    'regatas du fornika': 92,
    'universitario de deportes': 84,
    'alianza lima': 83,
    'sporting cristal': 82,
    'fbc melgar': 79,
    'cienciano': 77,
    'cusco fc': 76,
    'deportivo garcilaso': 73,
    'sport huancayo': 73,
    'adt': 72,
    'los chankas': 72,
    'alianza atletico': 71,
    'atletico grau': 71,
    'sport boys': 70,
    'utc': 70,
    'fc cajamarca': 69,
    'comerciantes unidos': 68,
    'juan pablo ii college': 67,
    'deportivo moquegua': 67
  };
  function hashString(text) { let h = 2166136261; for (const ch of String(text)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function seeded(seed) { let a = (hashString(seed) || 123456789) >>> 0; return () => { a = (Math.imul(1664525, a) + 1013904223) >>> 0; return a / 4294967296; }; }
  function currentDateKey() {
    const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Lima', year:'numeric', month:'2-digit', day:'2-digit'}).formatToParts(new Date());
    const get = t => parts.find(p => p.type === t)?.value || '2026';
    return `${get('year')}-${get('month')}-${get('day')}`;
  }
  function dateKeyOffset(base, days) { const d = new Date(`${base}T12:00:00-05:00`); d.setUTCDate(d.getUTCDate() + days); const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d); const g=t=>parts.find(p=>p.type===t)?.value||'2000'; return `${g('year')}-${g('month')}-${g('day')}`; }
  function teamPool() {
    const root = window.FOXCRAK_CLUB_DIRECTORY || {countries:[]};
    const country = (root.countries || []).find(c => c.code === 'PE');
    const names = country?.clubs || ['ADT','Alianza Atlético','Alianza Lima','Atlético Grau','Cienciano','Comerciantes Unidos','Cusco FC','Deportivo Garcilaso','Deportivo Moquegua','FC Cajamarca','FBC Melgar','Juan Pablo II College','Los Chankas','Sport Boys','Sport Huancayo','Sporting Cristal','Universitario de Deportes','UTC'];
    const snapshot = window.FOXCRAK_SIMULATOR?.getSnapshot?.() || {};
    const custom = (snapshot.customTeams || []).filter(t => t.code === 'PE');
    const rows = [];
    for (const name of names) rows.push({name, id:`PE:${norm(name).replace(/\s+/g,'-')}`, country:'Perú', code:'PE', flag:flagPeru, league:'Liga 1 Perú', logoUrl:'', custom:false});
    for (const team of custom) {
      const n = norm(team.name);
      const existing = rows.find(t => norm(t.name) === n);
      if (existing) { existing.id = team.id || existing.id; existing.custom = true; existing.logoUrl = team.logoUrl || ''; }
      else rows.push({id:team.id || `PE:${n.replace(/\s+/g,'-')}`,name:team.name,country:'Perú',code:'PE',flag:flagPeru,league:'Liga 1 Perú',logoUrl:team.logoUrl||'',custom:true});
    }
    if (!rows.some(t => norm(t.name) === 'regatas du fornika')) rows.push({id:'CUSTOM:PE:REGATAS-DU-FORNIKA',name:'Regatas Dū Fórnika',country:'Perú',code:'PE',flag:flagPeru,league:'Liga 1 Perú',logoUrl:'',custom:true});
    const seen = new Set();
    return rows.filter(t => {const k=norm(t.name);if(seen.has(k))return false;seen.add(k);return true;}).map(t => {
      const key = norm(t.name);
      const override = number(snapshot.powerOverrides?.[t.id], NaN);
      const rating = Number.isFinite(override) && !Object.hasOwn(ratingOverrides,key) ? Math.max(45,Math.min(99,Math.round(override))) : (ratingOverrides[key] ?? Math.max(61,Math.min(80,69+(hashString(t.name)%13)-6)));
      return {...t, power:rating, flag:flagPeru};
    }).sort((a,b) => {
      if (norm(a.name)==='regatas du fornika') return 1;
      if (norm(b.name)==='regatas du fornika') return -1;
      return a.name.localeCompare(b.name,'es');
    });
  }
  function roundRobin(teams) {
    const ring = teams.slice();
    if (ring.length % 2) ring.push(null);
    const size = ring.length, count = size - 1, pairCount = size / 2, rounds = [];
    for (let r = 0; r < count; r++) {
      const games = [];
      for (let i = 0; i < pairCount; i++) {
        let home = ring[i], away = ring[size - 1 - i];
        if (!home || !away) continue;
        if ((r + i) % 2 === 1) [home,away] = [away,home];
        games.push({home,away});
      }
      rounds.push(games);
      const last = ring.pop(); ring.splice(1,0,last);
    }
    const secondLeg = rounds.map(games => games.map(g => ({home:g.away,away:g.home})));
    return [...rounds,...secondLeg];
  }
  function generatePhaseFixtures(teams, seasonId, phase, phaseOffsetDays, startDate) {
    const allRounds = roundRobin(teams);
    // Apertura is the first leg; Clausura is the same all-vs-all with venues reversed.
    const half = allRounds.length / 2;
    const rounds = phase === 'Clausura' ? allRounds.slice(half) : allRounds.slice(0, half);
    const fixtures = [];
    rounds.forEach((games, idx) => {
      const date = dateKeyOffset(startDate, phaseOffsetDays + idx);
      games.forEach((g, matchIndex) => {
        const kickoff = Date.parse(`${date}T19:00:00-05:00`) + matchIndex * 15 * 60 * 1000;
        fixtures.push({
          id:`${seasonId}-${phase.toUpperCase()}-R${String(idx+1).padStart(2,'0')}-M${String(matchIndex+1).padStart(2,'0')}`,
          seasonId, phase, round:idx+1, matchIndex:matchIndex+1, leg:phase==='Apertura'?'IDA':'VUELTA',
          date, kickoff, homeId:g.home.id, homeName:g.home.name, homeCode:'PE', homeCountry:'Perú', homeFlag:flagPeru, homePower:g.home.power,
          awayId:g.away.id, awayName:g.away.name, awayCode:'PE', awayCountry:'Perú', awayFlag:flagPeru, awayPower:g.away.power,
          status:'scheduled', homeGoals:null, awayGoals:null, events:[], stats:null, tags:[]
        });
      });
    });
    return {roundCount:rounds.length,fixtures};
  }
  function makeSeason(seasonNo, teams) {
    const id = `PERU-L1-${String(seasonNo).padStart(3,'0')}`;
    const startDate = currentDateKey();
    const ap = generatePhaseFixtures(teams,id,'Apertura',0,startDate);
    const cl = generatePhaseFixtures(teams,id,'Clausura',ap.roundCount+2,startDate);
    return {
      id, seasonNo, label:`TEMPORADA APS ${String(seasonNo).padStart(2,'0')}`, startDate,
      phase:'Apertura', roundIndex:0, roundCount:ap.roundCount, teams:teams.map(t=>({...t})),
      fixtures:[...ap.fixtures,...cl.fixtures], finalFixture:null, phaseChampions:{Apertura:null,Clausura:null},
      status:'active', champion:null, runnerUp:null, completedAt:'', archived:false
    };
  }
  function emptyState(seasonNo=1) { const teams=teamPool(); return {version:2,nextSeasonNo:seasonNo+1,currentSeason:makeSeason(seasonNo,teams),matchHistory:[],clubAllTime:{},scorerAllTime:{},seasonHistory:[],titleHistory:[],settings:{activeTab:'simulator',standingsScope:'Apertura',historyPhase:'ALL',historySearch:''}}; }
  function loadState() {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      let fromLegacy = false;
      if (!raw) { raw = localStorage.getItem(LEGACY_STORAGE_KEY); fromLegacy = Boolean(raw); }
      const s = JSON.parse(raw || 'null');
      if (!s || !s.currentSeason || !Array.isArray(s.currentSeason.teams) || !Array.isArray(s.currentSeason.fixtures)) return emptyState();
      // Migra el nombre antiguo del campo si una build previa lo guardó con esa clave.
      const history = Array.isArray(s.matchHistory) ? s.matchHistory : (Array.isArray(s.historyMatches) ? s.historyMatches : []);
      const expectedRounds = teamPool().length % 2 ? teamPool().length : teamPool().length - 1;
      const needsFixtureMigration = fromLegacy || s.version !== 2 || number(s.currentSeason.roundCount) !== expectedRounds;
      if (needsFixtureMigration) {
        // Se conserva el historial y los palmarés; el formato antiguo se cierra con una nueva temporada y IDs nuevos.
        const archivedSeasonNos = (Array.isArray(s.seasonHistory) ? s.seasonHistory : []).map(x => number(x.seasonNo));
        const newNo = Math.max(number(s.nextSeasonNo, 1), number(s.currentSeason.seasonNo, 0) + 1, ...archivedSeasonNos.map(n => n + 1));
        const migrated = emptyState(newNo);
        migrated.matchHistory = history.slice(-MAX_MATCH_LOG);
        migrated.clubAllTime = s.clubAllTime && typeof s.clubAllTime === 'object' ? s.clubAllTime : {};
        migrated.scorerAllTime = s.scorerAllTime && typeof s.scorerAllTime === 'object' ? s.scorerAllTime : {};
        migrated.seasonHistory = Array.isArray(s.seasonHistory) ? s.seasonHistory : [];
        migrated.titleHistory = Array.isArray(s.titleHistory) ? s.titleHistory : [];
        migrated.settings = {...migrated.settings, ...(s.settings||{}), activeTab:'simulator'};
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated)); } catch {}
        return migrated;
      }
      s.version = 2;
      s.matchHistory = history.slice(-MAX_MATCH_LOG);
      delete s.historyMatches;
      s.nextSeasonNo = number(s.nextSeasonNo, number(s.currentSeason.seasonNo, 1) + 1);
      s.clubAllTime = s.clubAllTime && typeof s.clubAllTime === 'object' ? s.clubAllTime : {};
      s.scorerAllTime = s.scorerAllTime && typeof s.scorerAllTime === 'object' ? s.scorerAllTime : {};
      s.seasonHistory = Array.isArray(s.seasonHistory) ? s.seasonHistory : [];
      s.titleHistory = Array.isArray(s.titleHistory) ? s.titleHistory : [];
      s.settings = {...{activeTab:'simulator',standingsScope:'Apertura',historyPhase:'ALL',historySearch:''}, ...(s.settings||{})};
      return s;
    } catch { return emptyState(); }
  }
  let state = loadState();
  let autoTimer = null;
  let lastToast = '';
  function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e) { console.warn('No se pudo guardar la Liga 1 APS.',e); notify('No hay espacio disponible para guardar el progreso de Liga 1 en este navegador.'); } }
  function randomGoalCount(rng, power, home) {
    const lambda = Math.max(0.35, Math.min(2.5, 1.0 + (power-70)*0.027 + (home?0.18:0)));
    const probabilities = []; let term = Math.exp(-lambda), sum = term; probabilities.push(term);
    for (let k=1;k<=5;k++) { term *= lambda/k; probabilities.push(term); sum += term; }
    let r = rng()*sum, acc = 0;
    for (let k=0;k<probabilities.length;k++) { acc += probabilities[k]; if (r <= acc) return k; }
    return 5;
  }
  function randomMinute(rng) { return rng() < .5 ? 1 + Math.floor(rng()*30) : 41 + Math.floor(rng()*30); }
  function syntheticScorer(team, rng) {
    const shirtOptions = [7,9,10,11,17,19,20,23];
    const shirt = shirtOptions[Math.floor(rng()*shirtOptions.length)];
    const first = fakeFirstNames[Math.floor(rng()*fakeFirstNames.length)];
    const last = fakeLastNames[Math.floor(rng()*fakeLastNames.length)];
    return {id:`${team.id}:APS-${shirt}:${first}-${last}`, name:`${first} ${last}`, shirt, teamId:team.id, teamName:team.name};
  }
  function simulateFixture(f, season) {
    if (f.status === 'final') return f;
    const rng = seeded(`${season.id}|${f.id}|${f.homePower}|${f.awayPower}`);
    const home = season.teams.find(t=>t.id===f.homeId) || {id:f.homeId,name:f.homeName,power:f.homePower};
    const away = season.teams.find(t=>t.id===f.awayId) || {id:f.awayId,name:f.awayName,power:f.awayPower};
    let gh = randomGoalCount(rng,number(f.homePower,70),true), ga = randomGoalCount(rng,number(f.awayPower,70),false);
    const events = [];
    function pushGoals(count, side, team) {
      for (let i=0;i<count;i++) {
        const scorer = syntheticScorer(team,rng);
        events.push({id:`${f.id}:G:${side}:${i+1}`,type:'goal',minute:randomMinute(rng),side,teamId:team.id,teamName:team.name,scorerId:scorer.id,scorerName:scorer.name,shirt:scorer.shirt,valid:true});
      }
    }
    pushGoals(gh,'home',home); pushGoals(ga,'away',away);
    // Penal simulada ocasional: si se convierte, genera también un gol; si no, queda en eventos.
    if (rng() < .09) {
      const side = rng()<.5?'home':'away', team = side==='home'?home:away, minute = randomMinute(rng);
      events.push({id:`${f.id}:PENAL`,type:'penalty-awarded',minute,side,teamId:team.id,teamName:team.name,valid:true});
      if (rng() < .74) {
        const scorer=syntheticScorer(team,rng);
        events.push({id:`${f.id}:PENAL-GOL`,type:'goal',minute:Math.min(70,minute+1),side,teamId:team.id,teamName:team.name,scorerId:scorer.id,scorerName:scorer.name,shirt:scorer.shirt,source:'penal',valid:true});
      } else events.push({id:`${f.id}:PENAL-ERRADO`,type:'penalty-missed',minute:Math.min(70,minute+1),side,teamId:team.id,teamName:team.name,valid:true});
    }
    // Tarjetas y VAR ficticios; un gol revisado tiene 25% de ser anulado si llega a revisión.
    const yellowCount = 2 + Math.floor(rng()*4);
    for (let i=0;i<yellowCount;i++) {
      const side=rng()<.5?'home':'away',team=side==='home'?home:away;
      const card={id:`${f.id}:Y:${i+1}`,type:'yellow',minute:randomMinute(rng),side,teamId:team.id,teamName:team.name,valid:true};
      if(rng()<.08){card.varReviewed=true;card.varOutcome=rng()<.18?'upgrade-red':'validated';}
      events.push(card);
    }
    if(rng()<.105){const side=rng()<.5?'home':'away',team=side==='home'?home:away;const card={id:`${f.id}:R:1`,type:'red',minute:randomMinute(rng),side,teamId:team.id,teamName:team.name,valid:true};if(rng()<.14){card.varReviewed=true;card.varOutcome=rng()<.22?'downgrade-yellow':'validated';}events.push(card);}
    for (const goal of events.filter(e=>e.type==='goal'&&e.valid)) {
      if (rng()<.22) {goal.varReviewed=true;goal.varOutcome=rng()<.25?'invalidated':'validated';if(goal.varOutcome==='invalidated')goal.valid=false;}
    }
    events.sort((a,b)=>a.minute-b.minute || (a.type==='var-review'?-1:0));
    const effectiveGoals=events.filter(e=>e.type==='goal'&&e.valid);
    gh=effectiveGoals.filter(e=>e.side==='home').length;ga=effectiveGoals.filter(e=>e.side==='away').length;
    const possessionHome=43+Math.floor(rng()*18), homeShots= Math.max(gh+1,4+Math.floor(rng()*13)), awayShots=Math.max(ga+1,4+Math.floor(rng()*13));
    const homeOnTarget=Math.min(homeShots,gh+Math.floor(rng()*Math.max(1,homeShots-gh+1))), awayOnTarget=Math.min(awayShots,ga+Math.floor(rng()*Math.max(1,awayShots-ga+1)));
    const stats={possessionHome,possessionAway:100-possessionHome,shotsHome:homeShots,shotsAway:awayShots,onTargetHome:homeOnTarget,onTargetAway:awayOnTarget,cornersHome:Math.floor(rng()*9),cornersAway:Math.floor(rng()*9),foulsHome:7+Math.floor(rng()*13),foulsAway:7+Math.floor(rng()*13),yellow:events.filter(e=>e.type==='yellow'&&e.varOutcome!=='upgrade-red').length,red:events.filter(e=>e.type==='red'&&e.varOutcome!=='downgrade-yellow').length,penalties:events.filter(e=>e.type==='penalty-awarded').length};
    const diff=Math.abs(gh-ga), validGoalMinutes=effectiveGoals.map(e=>e.minute), lastGoal=Math.max(0,...validGoalMinutes); const tags=[];
    if(diff>=3)tags.push('GOLEADA');if(diff===0)tags.push('EMPATE');if(lastGoal>=66)tags.push('GOL AGÓNICO');if(stats.red)tags.push('PARTIDO CON EXPULSIÓN');if(stats.penalties)tags.push('PARTIDO CON PENAL');if(effectiveGoals.some(e=>e.varReviewed))tags.push('REVISIÓN VAR');
    Object.assign(f,{status:'final',homeGoals:gh,awayGoals:ga,events,stats,tags,playedAt:new Date().toISOString(),resultLabel:`${gh} - ${ga}`});
    return f;
  }
  function effectiveCards(events) { return (events||[]).filter(e=>e.type==='yellow'||e.type==='red').map(e=>e.varOutcome==='upgrade-red'?{...e,type:'red'}:e.varOutcome==='downgrade-yellow'?{...e,type:'yellow'}:e); }
  function tableFromFixtures(teams, fixtures) {
    const table = new Map(teams.map(t=>[t.id,{teamId:t.id,name:t.name,country:'Perú',code:'PE',flag:flagPeru,power:t.power,played:0,w:0,d:0,l:0,gf:0,ga:0,pts:0,cleanSheets:0,streak:''}]));
    for (const f of fixtures||[]) {
      if(f.status!=='final')continue;const h=table.get(f.homeId),a=table.get(f.awayId);if(!h||!a)continue;
      const hg=number(f.homeGoals),ag=number(f.awayGoals);h.played++;a.played++;h.gf+=hg;h.ga+=ag;a.gf+=ag;a.ga+=hg;if(ag===0)h.cleanSheets++;if(hg===0)a.cleanSheets++;
      if(hg>ag){h.w++;h.pts+=3;a.l++;}else if(hg<ag){a.w++;a.pts+=3;h.l++;}else{h.d++;a.d++;h.pts++;a.pts++;}
    }
    return [...table.values()].map(t=>({...t,gd:t.gf-t.ga})).sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf||b.w-a.w||b.power-a.power||a.name.localeCompare(b.name,'es'));
  }
  function currentPhaseFixtures(season) { if(!season)return[];if(season.phase==='Final')return season.finalFixture?[season.finalFixture]:[];return season.fixtures.filter(f=>f.phase===season.phase&&f.round===season.roundIndex+1); }
  function phaseFixtures(season,phase) { return season.fixtures.filter(f=>f.phase===phase); }
  function roundLabel(phase,round,total) { return `${phase==='Final'?'FINAL DE TEMPORADA':`TORNEO ${phase.toUpperCase()} · FECHA ${round}/${total}`}`; }
  function compactRecord(f,season) {
    const cards=effectiveCards(f.events);
    return {id:f.id,seasonId:season.id,seasonNo:season.seasonNo,phase:f.phase,round:f.round||1,leg:f.leg||'',date:f.date,kickoff:f.kickoff,homeId:f.homeId,homeName:f.homeName,homeCode:'PE',homeFlag:flagPeru,awayId:f.awayId,awayName:f.awayName,awayCode:'PE',awayFlag:flagPeru,homeGoals:f.homeGoals,awayGoals:f.awayGoals,stats:f.stats,tags:f.tags||[],events:(f.events||[]).map(e=>({minute:e.minute,type:e.type,side:e.side,teamName:e.teamName,scorerName:e.scorerName||'',shirt:e.shirt||0,source:e.source||'',valid:e.valid!==false,varReviewed:!!e.varReviewed,varOutcome:e.varOutcome||''})),playedAt:f.playedAt||new Date().toISOString()};
  }
  function ensureAllTimeRow(team) {
    if(!state.clubAllTime[team.id])state.clubAllTime[team.id]={teamId:team.id,name:team.name,country:'Perú',code:'PE',flag:flagPeru,played:0,w:0,d:0,l:0,gf:0,ga:0,pts:0,titles:0,aperturas:0,clausuras:0,finals:0};
    return state.clubAllTime[team.id];
  }
  function recordMatch(f,season) {
    if(state.matchHistory.some(m=>m.id===f.id))return;
    const record=compactRecord(f,season);state.matchHistory.push(record);if(state.matchHistory.length>MAX_MATCH_LOG)state.matchHistory=state.matchHistory.slice(-MAX_MATCH_LOG);
    const h=ensureAllTimeRow(season.teams.find(t=>t.id===f.homeId)||{id:f.homeId,name:f.homeName}),a=ensureAllTimeRow(season.teams.find(t=>t.id===f.awayId)||{id:f.awayId,name:f.awayName});
    const hg=number(f.homeGoals),ag=number(f.awayGoals);h.played++;a.played++;h.gf+=hg;h.ga+=ag;a.gf+=ag;a.ga+=hg;
    if(hg>ag){h.w++;h.pts+=3;a.l++;}else if(hg<ag){a.w++;a.pts+=3;h.l++;}else{h.d++;a.d++;h.pts++;a.pts++;}
    for(const e of f.events||[]){if(e.type!=='goal'||e.valid===false)continue;const playerId=e.scorerId||`${e.teamId}|${e.scorerName}`;if(!state.scorerAllTime[playerId])state.scorerAllTime[playerId]={id:playerId,name:e.scorerName||'Goleador APS',shirt:e.shirt||0,teamId:e.teamId,teamName:e.teamName,goals:0};state.scorerAllTime[playerId].goals++;}
  }
  function championMeta(row,phase,season) { return row?{teamId:row.teamId,name:row.name,flag:flagPeru,phase,seasonId:season.id,seasonNo:season.seasonNo,date:currentDateKey()}:null; }
  function addPhaseTitle(meta) {
    if(!meta)return;const id=`${meta.seasonId}:${meta.phase}:${meta.teamId}`;if(state.titleHistory.some(t=>t.id===id))return;
    state.titleHistory.push({id,...meta});
    const row=ensureAllTimeRow({id:meta.teamId,name:meta.name});if(meta.phase==='Apertura')row.aperturas++;else if(meta.phase==='Clausura')row.clausuras++;
  }
  function createFinalFixture(season, appChamp, clausChamp) {
    const a=season.teams.find(t=>t.id===appChamp.teamId),c=season.teams.find(t=>t.id===clausChamp.teamId);if(!a||!c)return null;
    const home=(season.seasonNo%2===0)?c:a,away=home.id===a.id?c:a;
    return {id:`${season.id}-FINAL`,seasonId:season.id,phase:'Final',round:1,matchIndex:1,leg:'FINAL',date:dateKeyOffset(currentDateKey(),0),kickoff:Date.now(),homeId:home.id,homeName:home.name,homeCode:'PE',homeCountry:'Perú',homeFlag:flagPeru,homePower:home.power,awayId:away.id,awayName:away.name,awayCode:'PE',awayCountry:'Perú',awayFlag:flagPeru,awayPower:away.power,status:'scheduled',homeGoals:null,awayGoals:null,events:[],stats:null,tags:[]};
  }
  function finishSeason(season, champion, runnerUp, reason='final') {
    if(season.archived)return;
    season.status='completed';season.champion=champion?{teamId:champion.teamId,name:champion.name,flag:flagPeru}:null;season.runnerUp=runnerUp?{teamId:runnerUp.teamId,name:runnerUp.name,flag:flagPeru}:null;season.completedAt=new Date().toISOString();season.completedReason=reason;season.archived=true;
    if(champion){
      const id=`${season.id}:CHAMPION`;
      if(!state.titleHistory.some(t=>t.id===id))state.titleHistory.push({id,teamId:champion.teamId,name:champion.name,flag:flagPeru,phase:'Campeón de temporada',seasonId:season.id,seasonNo:season.seasonNo,date:currentDateKey()});
      const winnerRow=ensureAllTimeRow({id:champion.teamId,name:champion.name});winnerRow.titles++;if(reason==='final')winnerRow.finals++;
    }
    if(runnerUp && reason==='final'){
      const id=`${season.id}:RUNNER_UP`;
      if(!state.titleHistory.some(t=>t.id===id))state.titleHistory.push({id,teamId:runnerUp.teamId,name:runnerUp.name,flag:flagPeru,phase:'Subcampeón de temporada',seasonId:season.id,seasonNo:season.seasonNo,date:currentDateKey()});
      ensureAllTimeRow({id:runnerUp.teamId,name:runnerUp.name}).finals++;
    }
    for(const r of state.matchHistory.filter(m=>m.seasonId===season.id)){r.seasonChampion=champion?.name||'';}
    state.seasonHistory.push({id:season.id,seasonNo:season.seasonNo,seasonLabel:season.label,completedAt:season.completedAt,aperturaChampion:season.phaseChampions.Apertura?.name||'',clausuraChampion:season.phaseChampions.Clausura?.name||'',champion:champion?.name||'',runnerUp:runnerUp?.name||'',matches:state.matchHistory.filter(m=>m.seasonId===season.id).length,goals:state.matchHistory.filter(m=>m.seasonId===season.id).reduce((n,m)=>n+number(m.homeGoals)+number(m.awayGoals),0),reason});
    if(state.seasonHistory.length>100)state.seasonHistory=state.seasonHistory.slice(-100);
    save();
  }
  function closePhaseIfReady(season,phase) {
    const fixtures=phaseFixtures(season,phase);if(!fixtures.length||fixtures.some(f=>f.status!=='final'))return false;
    const table=tableFromFixtures(season.teams,fixtures);const champion=table[0];const meta=championMeta(champion,phase,season);season.phaseChampions[phase]=meta;addPhaseTitle(meta);
    if(phase==='Apertura') {season.phase='Clausura';season.roundIndex=0;notify(`Apertura finalizado. Campeón de fase: ${champion?.name||'—'}. Comienza el Clausura.`);}
    else {
      const app=season.phaseChampions.Apertura,claus=season.phaseChampions.Clausura;
      if(app&&claus&&app.teamId===claus.teamId){finishSeason(season,champion,table[1]||null,'doblete');notify(`${champion.name} gana Apertura y Clausura y se corona campeón de temporada.`);}
      else {season.phase='Final';season.roundIndex=0;season.finalFixture=createFinalFixture(season,app,claus);notify('Clausura finalizado. Los campeones de Apertura y Clausura disputarán la final.');}
    }
    return true;
  }
  function simulateNextRoundInternal(silent=false) {
    const season=state.currentSeason;if(!season||season.status==='completed')return false;
    if(season.phase==='Final') {
      if(!season.finalFixture)return false;
      simulateFixture(season.finalFixture,season);recordMatch(season.finalFixture,season);
      const f=season.finalFixture,home=season.teams.find(t=>t.id===f.homeId),away=season.teams.find(t=>t.id===f.awayId);
      let champion=f.homeGoals>f.awayGoals?home:f.awayGoals>f.homeGoals?away:(home.power>=away.power?home:away);
      let runner=champion.id===home.id?away:home;
      finishSeason(season,{teamId:champion.id,name:champion.name}, {teamId:runner.id,name:runner.name},'final');
      if(!silent)notify(`Campeón de Liga 1 Perú APS: ${champion.name}. La temporada quedó registrada.`);
      return true;
    }
    const phase=season.phase,round=season.roundIndex+1;
    const games=season.fixtures.filter(f=>f.phase===phase&&f.round===round&&f.status!=='final');
    if(!games.length){
      // Si una versión anterior guardó el índice justo al final de fase, resuelve la transición sin repetir partidos.
      if(closePhaseIfReady(season,phase))return true;
      return false;
    }
    games.forEach(f=>{simulateFixture(f,season);recordMatch(f,season);});
    season.roundIndex=round;
    if(round>=season.roundCount)closePhaseIfReady(season,phase);
    save();
    if(!silent)notify(`${phase} · Fecha ${round} simulada: ${games.length} partidos registrados.`);
    return true;
  }
  function simulateNextRound() {
    if(state.currentSeason.status==='completed'){notify('La temporada acabó. Pulsa NUEVA TEMPORADA para iniciar otra.');return;}
    const ok=simulateNextRoundInternal(false);if(!ok)notify('No hay una fecha pendiente para simular.');save();render();
  }
  function simulateFullSeason() {
    const season=state.currentSeason;if(!season||season.status==='completed'){notify('Esta temporada ya finalizó. Inicia una nueva para continuar.');return;}
    if(!window.confirm('Se simularán todas las fechas pendientes de Apertura y Clausura, y la final si corresponde. Los marcadores son ficticios. ¿Continuar?'))return;
    let guard=100,iterations=0;
    while(state.currentSeason.status!=='completed'&&guard-->0){if(!simulateNextRoundInternal(true))break;iterations++;}
    save();render();notify(`Simulación completa: ${iterations} fechas procesadas. Campeón: ${state.currentSeason.champion?.name||'por definir'}.`);
  }
  function startNewSeason() {
    if(state.currentSeason.status!=='completed'){notify('Termina la temporada actual antes de crear otra.');return;}
    const next=number(state.nextSeasonNo, state.currentSeason.seasonNo+1);state.currentSeason=makeSeason(next,teamPool());state.nextSeasonNo=next+1;state.settings.activeTab='simulator';if(autoTimer){clearInterval(autoTimer);autoTimer=null;}save();render();notify(`Nueva temporada de Liga 1 Perú APS: edición ${String(next).padStart(2,'0')}.`);
  }
  function allCurrentAndArchiveMatches() { return state.matchHistory.slice().sort((a,b)=>String(b.playedAt).localeCompare(String(a.playedAt))||String(b.id).localeCompare(String(a.id))); }
  function getScopeFixtures(scope) {
    const season=state.currentSeason;if(!season)return[];
    if(scope==='General')return season.fixtures.filter(f=>f.status==='final'&&f.phase!=='Final');
    return season.fixtures.filter(f=>f.status==='final'&&f.phase===scope);
  }
  function tableRowsForScope(scope) {
    if(scope==='Histórico') {
      const rows=Object.values(state.clubAllTime).map(t=>({...t,gd:t.gf-t.ga}));
      for(const team of state.currentSeason.teams)if(!rows.some(r=>r.teamId===team.id))rows.push({teamId:team.id,name:team.name,country:'Perú',code:'PE',flag:flagPeru,played:0,w:0,d:0,l:0,gf:0,ga:0,pts:0,gd:0,titles:0,aperturas:0,clausuras:0,finals:0});
      return rows.sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf||a.name.localeCompare(b.name,'es'));
    }
    return tableFromFixtures(state.currentSeason.teams,getScopeFixtures(scope));
  }
  function logo(team) {
    const api=window.FOXCRAK_SIMULATOR;
    if(api?.teamBadge)return api.teamBadge({...team,country:'Perú',code:'PE',flag:flagPeru,league:'Liga 1 Perú'},'peru-team-crest');
    const initials=team.name.split(/\s+/).filter(Boolean).map(x=>x[0]).join('').slice(0,3).toUpperCase();
    return `<span class="peru-team-crest"><span class="peru-crest-fallback">${esc(initials)}</span></span>`;
  }
  function fixtureCard(f) {
    const done=f.status==='final'; const current=state.currentSeason.phase===f.phase&&state.currentSeason.roundIndex===f.round;
    const score=done?`${f.homeGoals} : ${f.awayGoals}`:'— : —';
    const stateLabel=done?'FINALIZADO':(current?'PENDIENTE DE SIMULAR':'PROGRAMADO');
    const scorers=(f.events||[]).filter(e=>e.type==='goal'&&e.valid!==false).map(e=>`${e.minute}′ ${e.scorerName}`).slice(0,5).join(' · ');
    const tags=(f.tags||[]).map(t=>`<span class="peru-match-tag">${esc(t)}</span>`).join('');
    return `<article class="peru-fixture-card ${done?'is-final':''} ${f.phase==='Final'?'is-final-stage':''}" data-peru-fixture="${esc(f.id)}"><div class="peru-fixture-head"><span>${flagPeru} LIGA 1 PERÚ · ${esc(f.phase.toUpperCase())}</span><b class="peru-fixture-status ${done?'final':''}">${stateLabel}</b></div><div class="peru-fixture-sides"><div class="peru-fixture-team home">${logo({id:f.homeId,name:f.homeName,code:'PE',flag:flagPeru})}<strong>${esc(f.homeName.toLocaleUpperCase('es'))}</strong><small>NIVEL ${number(f.homePower)}</small></div><div class="peru-fixture-score"><strong>${score}</strong><small>${done?'RESULTADO FINAL':`FECHA ${f.round} · ${f.leg||'PARTIDO'}`}</small></div><div class="peru-fixture-team away">${logo({id:f.awayId,name:f.awayName,code:'PE',flag:flagPeru})}<strong>${esc(f.awayName.toLocaleUpperCase('es'))}</strong><small>NIVEL ${number(f.awayPower)}</small></div></div><div class="peru-fixture-foot"><span>${esc(f.date||'Fecha por definir')} · ${esc(f.phase)} · J${f.round}</span><button type="button" class="peru-match-detail-btn" data-peru-fixture-details="${esc(f.id)}">${done?'VER ESTADÍSTICAS':'FICHA DE PARTIDO'} ↗</button></div>${tags?`<div class="peru-fixture-tags">${tags}</div>`:''}${done&&scorers?`<div class="peru-fixture-scorers">⚽ ${esc(scorers)}${(f.events||[]).filter(e=>e.type==='goal'&&e.valid!==false).length>5?' · …':''}</div>`:''}<div class="peru-fixture-detail" data-peru-detail="${esc(f.id)}" hidden>${done?renderFixtureDetail(f):'<p>El marcador y las estadísticas se generarán al simular esta fecha.</p>'}</div></article>`;
  }
  function renderFixtureDetail(f) {
    const s=f.stats||{};const events=(f.events||[]).slice().sort((a,b)=>a.minute-b.minute);
    return `<div class="peru-detail-stats"><span>POSESIÓN <b>${number(s.possessionHome)}% - ${number(s.possessionAway)}%</b></span><span>REMATES <b>${number(s.shotsHome)} - ${number(s.shotsAway)}</b></span><span>A PUERTA <b>${number(s.onTargetHome)} - ${number(s.onTargetAway)}</b></span><span>CÓRNERS <b>${number(s.cornersHome)} - ${number(s.cornersAway)}</b></span><span>AMARILLAS <b>${number(s.yellow)}</b></span><span>ROJAS <b>${number(s.red)}</b></span><span>PENALES <b>${number(s.penalties)}</b></span></div><ul class="peru-event-timeline">${events.map(e=>`<li class="event-${esc(e.type)}"><b>${number(e.minute)}′</b><span>${esc(e.type==='goal'?(e.valid===false?'GOL ANULADO POR VAR':`GOOOL · ${e.scorerName}`):e.type==='yellow'?'TARJETA AMARILLA':e.type==='red'?'TARJETA ROJA':e.type==='penalty-awarded'?'PENAL':'PENAL ERRADO')}${e.varReviewed?` · VAR ${esc(e.varOutcome||'REVISIÓN')}`:''}</span><small>${esc(e.teamName||'—')}</small></li>`).join('')}</ul>`;
  }
  function renderSummary() {
    const s=state.currentSeason;const teams=s.teams.length;const played=s.fixtures.filter(f=>f.status==='final').length;const upcoming=s.fixtures.length-played;
    const matchesTotal=s.fixtures.length+(s.finalFixture?1:0);
    const stage=s.phase==='Final'?'GRAN FINAL':`TORNEO ${s.phase.toUpperCase()}`;
    const phasePlayed=s.phase==='Final'?(s.finalFixture?.status==='final'?1:0):s.fixtures.filter(f=>f.phase===s.phase&&f.status==='final').length;
    const phaseFixturesN=s.phase==='Final'?1:phaseFixtures(s,s.phase).length;
    const phaseRoundsN=Math.ceil(phaseFixturesN/Math.max(1,Math.floor(teams/2)));
    $('#peruSeasonSummary').innerHTML=`<article><small>CLUBES</small><strong>${teams}</strong><span>Participantes de Liga 1 APS</span></article><article><small>PARTIDOS REGISTRADOS</small><strong>${fmt(state.matchHistory.length)}</strong><span>Historial acumulado</span></article><article><small>TEMPORADA</small><strong>${esc(s.label)}</strong><span>${esc(s.status==='completed'?'FINALIZADA':'EN CURSO')}</span></article><article><small>PARTIDOS POR JUGAR</small><strong>${fmt(upcoming)}</strong><span>En Apertura, Clausura y final</span></article>`;
    $('#peruPhaseTitle').textContent=s.phase==='Final'?'GRAN FINAL':`TORNEO ${s.phase.toUpperCase()}`;
    $('#peruPhaseDescription').textContent=s.phase==='Final'?'Los campeones de Apertura y Clausura deciden el título de temporada.':`Todos contra todos · ida y vuelta · ${s.teams.length} clubes.`;
    $('#peruRoundBadge').textContent=s.status==='completed'?'TEMPORADA FINALIZADA':s.phase==='Final'?(s.finalFixture?.status==='final'?'FINALIZADO':'FINAL POR JUGAR'):`FECHA ${s.roundIndex+1} / ${s.roundCount}`;
    $('#peruCurrentRoundTitle').textContent=s.phase==='Final'?'Gran final de temporada':`${s.phase} · Fecha ${s.roundIndex+1}`;
    $('#peruCurrentRoundSubtitle').textContent=s.phase==='Final'?'Partido entre los ganadores de Apertura y Clausura.':`${s.phase} · ${s.roundIndex+1} de ${s.roundCount} fechas · ida y vuelta`;
    $('#peruCurrentRoundCount').textContent=`${currentPhaseFixtures(s).length} PARTIDOS`;
    $('#peruRecentRoundLabel').textContent=state.matchHistory.length?`${Math.min(9,state.matchHistory.length)} resultados recientes`:'Sin partidos finalizados';
    $('#peruSimulationNote').textContent=s.status==='completed'?`Campeón: ${s.champion?.name||'—'}. Puedes revisar tablas, tops e historial o crear una nueva temporada.`:`Se jugarán ${Math.floor(s.teams.length/2)} partidos por fecha; cada club se enfrenta a todos los demás una vez de local y una de visitante. Resultados ficticios.`;
    $('#peruSimulateRound').disabled=s.status==='completed';$('#peruSimulateRound').textContent=s.phase==='Final'?'SIMULAR GRAN FINAL ↗':'SIMULAR SIGUIENTE FECHA ↗';$('#peruSimulateFull').disabled=s.status==='completed';$('#peruNewSeason').hidden=s.status!=='completed';
    if(s.status==='completed')$('#peruSimulateRound').disabled=true;
  }
  function renderMatches() {
    const s=state.currentSeason;const fixtures=currentPhaseFixtures(s);const holder=$('#peruCurrentRoundMatches');
    if(holder) holder.innerHTML=fixtures.length?fixtures.map(fixtureCard).join(''):`<div class="peru-empty-state">No hay partidos para esta fecha. Comprueba el estado de la temporada.</div>`;
    const recent = state.matchHistory.slice().reverse().slice(0,9);const list=$('#peruRecentMatches');
    if(list)list.innerHTML=recent.length?recent.map(m=>`<article class="peru-recent-row"><span class="peru-recent-date">${esc(m.date)}<small>${esc(m.phase)} · J${m.round}</small></span><span class="peru-recent-teams"><strong>${esc(m.homeName)}</strong><small>vs</small><strong>${esc(m.awayName)}</strong></span><b class="peru-recent-score">${m.homeGoals} - ${m.awayGoals}</b><button type="button" class="peru-recent-details" data-history-detail="${esc(m.id)}">DATOS ↗</button></article>`).join(''):`<div class="peru-empty-state">Al simular la primera fecha, los resultados aparecerán aquí automáticamente.</div>`;
    window.FOXCRAK_SIMULATOR?.hydrateLogos?.(holder);
  }
  function renderStandings() {
    const scope=$('#peruStandingsScope')?.value||state.settings.standingsScope||'Apertura';state.settings.standingsScope=scope;
    const rows=tableRowsForScope(scope);const body=$('#peruStandingsBody');if(!body)return;
    body.innerHTML=rows.map((r,i)=>`<tr class="${i===0&&r.played?'peru-table-leader':''}"><td>${String(i+1).padStart(2,'0')}</td><td><span class="peru-table-club">${logo({id:r.teamId,name:r.name,code:'PE',flag:flagPeru})}<strong>${esc(r.name.toLocaleUpperCase('es'))}</strong></span></td><td>${r.played}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf}</td><td>${r.ga}</td><td>${r.gd??r.gf-r.ga}</td><td><b>${r.pts}</b></td></tr>`).join('');
    const championNode=$('#peruPhaseChampions');if(championNode){const a=state.currentSeason.phaseChampions.Apertura,c=state.currentSeason.phaseChampions.Clausura,ch=state.currentSeason.champion;championNode.innerHTML=`<article><small>CAMPEÓN APERTURA</small><strong>${esc(a?.name||'Por definir')}</strong></article><article><small>CAMPEÓN CLAUSURA</small><strong>${esc(c?.name||'Por definir')}</strong></article><article><small>CAMPEÓN TEMPORADA</small><strong>${esc(ch?.name||'Por definir')}</strong></article>`;}
    window.FOXCRAK_SIMULATOR?.hydrateLogos?.(body);
  }
  function renderHistory() {
    const body=$('#peruHistoryBody');if(!body)return;const term=norm($('#peruHistorySearch')?.value||state.settings.historySearch||'');const phase=$('#peruHistoryPhase')?.value||state.settings.historyPhase||'ALL';
    let rows=allCurrentAndArchiveMatches();if(phase!=='ALL')rows=rows.filter(m=>m.phase===phase);if(term)rows=rows.filter(m=>norm(`${m.homeName} ${m.awayName} ${m.phase} ${m.date} ${m.seasonNo}`).includes(term));
    $('#peruHistoryCount').textContent=`${rows.length} RESULTADOS`;
    body.innerHTML=rows.slice(0,250).map(m=>`<tr><td>${esc(m.date||'—')}</td><td>${esc(m.phase)} · J${m.round} <small>S${String(m.seasonNo).padStart(2,'0')}</small></td><td>${esc(m.homeName)}</td><td><strong class="peru-history-score">${m.homeGoals} - ${m.awayGoals}</strong></td><td>${esc(m.awayName)}</td><td><button type="button" class="peru-history-view" data-history-detail="${esc(m.id)}">VER EVENTOS ↗</button></td></tr>`).join('')||`<tr><td colspan="6">Todavía no hay partidos registrados.</td></tr>`;
    if(rows.length>250)body.insertAdjacentHTML('beforeend',`<tr><td colspan="6">Se muestran los 250 más recientes de ${rows.length}; los registros estadísticos acumulados no se eliminan.</td></tr>`);
  }
  function currentSeasonFinishedFixtures() {
    const s = state.currentSeason;
    if (!s) return [];
    const matches = s.fixtures.filter(f => f.status === 'final');
    if (s.finalFixture?.status === 'final') matches.push(s.finalFixture);
    return matches;
  }
  function renderStats() {
    const s=state.currentSeason;const matches=currentSeasonFinishedFixtures();const goals=matches.reduce((n,f)=>n+number(f.homeGoals)+number(f.awayGoals),0);const yellows=matches.reduce((n,f)=>n+number(f.stats?.yellow),0);const reds=matches.reduce((n,f)=>n+number(f.stats?.red),0);const pens=matches.reduce((n,f)=>n+number(f.stats?.penalties),0);const draws=matches.filter(f=>f.homeGoals===f.awayGoals).length;const avg=matches.length?(goals/matches.length).toFixed(2):'0,00';
    $('#peruStatsGrid').innerHTML=[['PARTIDOS JUGADOS',matches.length],['GOLES ANOTADOS',goals],['PROMEDIO DE GOL',String(avg).replace('.',',')],['EMPATES',draws],['TARJETAS AMARILLAS',yellows],['TARJETAS ROJAS',reds],['PENALES SEÑALADOS',pens],['CLUBES',s.teams.length]].map(([label,value])=>`<article><small>${label}</small><strong>${esc(value)}</strong></article>`).join('');
    const goleada=matches.slice().sort((a,b)=>Math.abs(b.homeGoals-b.awayGoals)-Math.abs(a.homeGoals-a.awayGoals))[0];const high=matches.slice().sort((a,b)=>(b.homeGoals+b.awayGoals)-(a.homeGoals+a.awayGoals))[0];const late=matches.filter(f=>(f.events||[]).some(e=>e.type==='goal'&&e.valid!==false&&e.minute>=66)).sort((a,b)=>Math.max(...(b.events||[]).filter(e=>e.type==='goal'&&e.valid!==false).map(e=>e.minute),0)-Math.max(...(a.events||[]).filter(e=>e.type==='goal'&&e.valid!==false).map(e=>e.minute),0))[0];const panel=$('#peruRecordsGrid');if(panel)panel.innerHTML=`<article><span>🏆</span><small>GOLEADA DE LA TEMPORADA</small><strong>${goleada?`${esc(goleada.homeName)} ${goleada.homeGoals} - ${goleada.awayGoals} ${esc(goleada.awayName)}`:'Por definir'}</strong></article><article><span>⚽</span><small>PARTIDO CON MÁS GOLES</small><strong>${high?`${esc(high.homeName)} ${high.homeGoals} - ${high.awayGoals} ${esc(high.awayName)}`:'Por definir'}</strong></article><article><span>⏱</span><small>GOL AGÓNICO</small><strong>${late?`${esc(late.homeName)} vs ${esc(late.awayName)} · ${Math.max(...late.events.filter(e=>e.type==='goal'&&e.valid!==false).map(e=>e.minute))}′`:'Aún no registrado'}</strong></article>`;
  }
  function renderTops() {
    const s=state.currentSeason;const scope=$('#peruTopsScope')?.value||'season';const finished=currentSeasonFinishedFixtures();let scorers=[];let clubRows=[];
    if(scope==='history') {
      scorers=Object.values(state.scorerAllTime||{}).map(p=>({...p})).sort((a,b)=>b.goals-a.goals||a.name.localeCompare(b.name,'es')).slice(0,12);
      const historic=new Map(Object.values(state.clubAllTime||{}).map(t=>[t.teamId,{...t,gd:number(t.gf)-number(t.ga)}]));
      for(const team of s.teams)if(!historic.has(team.id))historic.set(team.id,{teamId:team.id,name:team.name,played:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,pts:0});
      clubRows=[...historic.values()].sort((a,b)=>number(b.gf)-number(a.gf)||number(b.gd)-number(a.gd)||number(b.w)-number(a.w)||a.name.localeCompare(b.name,'es')).slice(0,12);
    } else {
      const scores={};
      for(const f of finished)for(const e of f.events||[]){if(e.type!=='goal'||e.valid===false)continue;const id=e.scorerId||`${e.teamId}|${e.scorerName}`;if(!scores[id])scores[id]={id,name:e.scorerName||'Goleador APS',shirt:e.shirt||0,teamName:e.teamName||'',teamId:e.teamId,goals:0};scores[id].goals++;}
      scorers=Object.values(scores).sort((a,b)=>b.goals-a.goals||a.name.localeCompare(b.name,'es')).slice(0,12);
      clubRows=tableFromFixtures(s.teams,finished).sort((a,b)=>b.gf-a.gf||b.gd-a.gd||b.w-a.w).slice(0,12);
    }
    $('#peruScorerTops').innerHTML=scorers.length?scorers.map((p,i)=>`<article class="peru-top-row"><b>${String(i+1).padStart(2,'0')}</b><span class="peru-top-shirt">${p.shirt||'⚽'}</span><div><strong>${esc(p.name)}</strong><small>${esc(p.teamName||'Club registrado')} · JUGADOR FICTICIO</small></div><strong class="peru-top-value">${p.goals}</strong></article>`).join(''):`<div class="peru-empty-state">Los goleadores aparecerán al simular partidos.</div>`;
    $('#peruClubTops').innerHTML=clubRows.length?clubRows.map((t,i)=>`<article class="peru-top-row"><b>${String(i+1).padStart(2,'0')}</b>${logo({id:t.teamId,name:t.name,code:'PE',flag:flagPeru})}<div><strong>${esc(t.name)}</strong><small>${number(t.played)} PJ · ${number(t.gd)>=0?'+':''}${number(t.gd)} DG</small></div><strong class="peru-top-value">${number(t.gf)}</strong></article>`).join(''):`<div class="peru-empty-state">Los clubes destacados aparecerán al finalizar encuentros.</div>`;
    window.FOXCRAK_SIMULATOR?.hydrateLogos?.($('#peruClubTops'));
  }
  function renderPalmares() {
    const counts=new Map();for(const t of state.titleHistory){const id=t.teamId;if(!counts.has(id))counts.set(id,{teamId:id,name:t.name,aperturas:0,clausuras:0,titles:0,finals:0});const r=counts.get(id);if(t.phase==='Apertura')r.aperturas++;else if(t.phase==='Clausura')r.clausuras++;else if(t.phase==='Campeón de temporada'){r.titles++;r.finals++;}else if(t.phase==='Subcampeón de temporada'){r.finals++;}}
    for(const t of state.currentSeason.teams)if(!counts.has(t.id))counts.set(t.id,{teamId:t.id,name:t.name,aperturas:0,clausuras:0,titles:0,finals:0});
    const rows=[...counts.values()].sort((a,b)=>b.titles-a.titles||(b.aperturas+b.clausuras)-(a.aperturas+a.clausuras)||a.name.localeCompare(b.name,'es'));
    $('#peruPalmaresBody').innerHTML=rows.map((r,i)=>`<tr><td>${String(i+1).padStart(2,'0')}</td><td><span class="peru-table-club">${logo({id:r.teamId,name:r.name,code:'PE',flag:flagPeru})}<strong>${esc(r.name)}</strong></span></td><td>${r.aperturas}</td><td>${r.clausuras}</td><td><strong>${r.titles}</strong></td><td>${r.finals}</td></tr>`).join('');
    const history=$('#peruChampionHistory');history.innerHTML=state.seasonHistory.slice().reverse().slice(0,20).map(h=>`<article><span>🏆</span><div><small>${esc(h.seasonLabel)} · ${esc(h.completedAt.slice(0,10))}</small><strong>${esc(h.champion||'—')}</strong><p>Apertura: ${esc(h.aperturaChampion||'—')} · Clausura: ${esc(h.clausuraChampion||'—')}</p></div></article>`).join('')||'<div class="peru-empty-state">El historial de campeones aparecerá aquí cuando termine una temporada completa.</div>';
    window.FOXCRAK_SIMULATOR?.hydrateLogos?.($('#peruPalmaresBody'));
  }
  function render() {
    if (!$('#peruLeagueScreen')) return;
    renderSummary();renderMatches();renderStandings();renderHistory();renderStats();renderTops();renderPalmares();
    const current=state.settings.activeTab||'simulator';setTab(current,false);
    window.FOXCRAK_SIMULATOR?.hydrateLogos?.($('#peruLeagueScreen'));
  }
  function setTab(tab,store=true) {
    const allowed=['simulator','standings','history','stats','tops','palmares'];if(!allowed.includes(tab))tab='simulator';
    state.settings.activeTab=tab;
    $$('[data-peru-tab]').forEach(b=>{const active=b.dataset.peruTab===tab;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    $$('[data-peru-panel]').forEach(p=>{p.hidden=p.dataset.peruPanel!==tab;});
    if(store)save();
  }
  function showCompetitionScreen(screen) {
    const landing=$('#compLanding'),picker=$('#compNationalPicker'),peru=$('#peruLeagueScreen');
    if(landing)landing.hidden=screen!=='home';if(picker)picker.hidden=screen!=='national';if(peru)peru.hidden=screen!=='peru';
    if(screen==='peru')render();
  }
  function countryTiles() {
    const node=$('#compCountryGrid');if(!node)return;const countries=window.FOXCRAK_CLUB_DIRECTORY?.countries||[];
    node.innerHTML=countries.map(c=>`<button type="button" class="competition-country-card is-locked" data-coming-soon="${esc((c.code==='PE'?'LIGA 1 PERÚ · PAUSA TEMPORAL':c.name.toUpperCase()+' · LIGAS NACIONALES')+' · V1.1')}" aria-disabled="true"><span class="competition-country-flag">${esc(c.flag||'⚽')}</span><span class="section-index">EN PREPARACIÓN</span><strong>${esc(c.name.toUpperCase())}</strong><small>${esc(c.code==='PE'?'La Liga 1 está temporalmente fuera de Competiciones.':(c.league||'Liga nacional'))}</small><b>BLOQUEADO · V1.1</b></button>`).join('');
  }
  function toastDetail(matchId) {
    const current = state.currentSeason.fixtures.find(f=>f.id===matchId) || state.currentSeason.finalFixture;
    const old = state.matchHistory.find(f=>f.id===matchId);const f=current&&current.id===matchId?current:old;if(!f)return;
    const timeline=(f.events||[]).map(e=>`${e.minute}′ ${e.type==='goal'?(e.valid===false?'GOL ANULADO VAR':`GOL ${e.scorerName||''}`):e.type==='yellow'?'AMARILLA':e.type==='red'?'ROJA':e.type==='penalty-awarded'?'PENAL':'PENAL ERRADO'} · ${e.teamName||''}`).join('\n');
    const stats=f.stats||{};
    const msg=`${f.homeName} ${f.homeGoals} - ${f.awayGoals} ${f.awayName}\n${f.phase} · FECHA ${f.round}\n\nPosesión ${number(stats.possessionHome)}%-${number(stats.possessionAway)}%\nRemates ${number(stats.shotsHome)}-${number(stats.shotsAway)} · A puerta ${number(stats.onTargetHome)}-${number(stats.onTargetAway)}\nCórners ${number(stats.cornersHome)}-${number(stats.cornersAway)} · Amarillas ${number(stats.yellow)} · Rojas ${number(stats.red)}\n\n${timeline||'Sin eventos'}\n\nMARCADORES FICTICIOS DE LA LIGA 1 APS`;
    const dialog = $('#peruMatchDetailsDialog');
    if(dialog){const target=$('#peruMatchDetailsText');if(target)target.textContent=msg;if(!dialog.open)dialog.showModal();}else notify(`${f.homeName} ${f.homeGoals} - ${f.awayGoals} ${f.awayName}`);
  }
  function wire() {
    countryTiles();
    document.addEventListener('click',e=>{
      const compAction=e.target.closest('[data-comp-action]');if(compAction){const action=compAction.dataset.compAction;if(action==='open-national'){showCompetitionScreen('national');countryTiles();}else if(action==='open-peru'){notify('Liga 1 Perú está temporalmente fuera del apartado Competiciones.');showCompetitionScreen('home');}else if(action==='back-home')showCompetitionScreen('home');else if(action==='back-national')showCompetitionScreen('national');return;}
      const tab=e.target.closest('[data-peru-tab]');if(tab){setTab(tab.dataset.peruTab);return;}
      const matchBtn=e.target.closest('[data-peru-fixture-details],[data-history-detail]');if(matchBtn){toastDetail(matchBtn.dataset.peruFixtureDetails||matchBtn.dataset.historyDetail);return;}
      const detail=e.target.closest('[data-peru-fixture]');if(detail&&e.target===detail){const id=detail.dataset.peruFixture;const toggle=$(`[data-peru-detail="${CSS.escape(id)}"]`);if(toggle)toggle.hidden=!toggle.hidden;return;}
      if(e.target.closest('[data-close-peru-detail]'))$('#peruMatchDetailsDialog')?.close();
    });
    $('#peruSimulateRound')?.addEventListener('click',simulateNextRound);
    $('#peruSimulateFull')?.addEventListener('click',simulateFullSeason);
    $('#peruNewSeason')?.addEventListener('click',startNewSeason);
    $('#peruStandingsScope')?.addEventListener('change',()=>{state.settings.standingsScope=$('#peruStandingsScope').value;save();renderStandings();});
    $('#peruTopsScope')?.addEventListener('change',renderTops);
    $('#peruHistorySearch')?.addEventListener('input',e=>{state.settings.historySearch=e.target.value;save();renderHistory();});
    $('#peruHistoryPhase')?.addEventListener('change',e=>{state.settings.historyPhase=e.target.value;save();renderHistory();});
    $('#peruSpeedSelect')?.addEventListener('change',()=>{if(autoTimer){clearInterval(autoTimer);autoTimer=null;$('#peruAutoAdvance').textContent='AUTO: DESACTIVADO';}});
    $('#peruAutoAdvance')?.addEventListener('click',()=>{
      if(autoTimer){clearInterval(autoTimer);autoTimer=null;$('#peruAutoAdvance').textContent='AUTO: DESACTIVADO';$('#peruAutoAdvance').classList.remove('is-active');save();return;}
      if(state.currentSeason.status==='completed'){notify('La temporada ha finalizado. Pulsa NUEVA TEMPORADA para continuar.');return;}
      const interval=number($('#peruSpeedSelect')?.value,0);if(!interval){notify('Selecciona una velocidad automática primero.');return;}
      autoTimer=setInterval(()=>{if(state.currentSeason.status==='completed'){clearInterval(autoTimer);autoTimer=null;$('#peruAutoAdvance').textContent='AUTO: DESACTIVADO';$('#peruAutoAdvance').classList.remove('is-active');return;}simulateNextRoundInternal(true);save();render();},interval);
      $('#peruAutoAdvance').textContent='AUTO: ACTIVADO ■';$('#peruAutoAdvance').classList.add('is-active');save();
    });
    $('#peruMatchDetailsDialog')?.addEventListener('click',e=>{if(e.target===$('#peruMatchDetailsDialog')||e.target.closest('[data-close-peru-detail]'))$('#peruMatchDetailsDialog').close();});
  }
  // Resume el panel activo al abrir Competiciones. La primera visita conserva el selector principal.
  wire();render();
  window.FOXCRAK_PERU_LEAGUE={render,simulateNextRound,simulateFullSeason,getState:()=>JSON.parse(JSON.stringify(state)),newSeason:startNewSeason};
  setInterval(()=>{if(!$('#view-competitions')?.classList.contains('active-view'))return;renderSummary();},1000);
})();
