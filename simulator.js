/* FOXCRAK APS · Simulador ficticio de fútbol. Sin apuestas, cuotas ni riesgo de saldo. */
(function () {
  'use strict';
  const STORE_KEY = 'foxcrakApsSimulationV1';
  const COUNTRY_TZ = {
    AR:'America/Argentina/Buenos_Aires', BO:'America/La_Paz', BR:'America/Sao_Paulo', CL:'America/Santiago',
    CO:'America/Bogota', EC:'America/Guayaquil', PY:'America/Asuncion', PE:'America/Lima', UY:'America/Montevideo',
    VE:'America/Caracas', GY:'America/Guyana', SR:'America/Paramaribo'
  };
  const DEFAULT_TOP = {
    AR:['River Plate','Boca Juniors','Racing Club','Independiente','Estudiantes de La Plata'],
    BO:['Bolívar','The Strongest','Always Ready','Blooming','Oriente Petrolero'],
    BR:['Flamengo','Palmeiras','Corinthians','São Paulo','Fluminense'],
    CL:['Colo-Colo','Universidad de Chile','Universidad Católica','Coquimbo Unido','Palestino'],
    CO:['Atlético Nacional','Millonarios','América de Cali','Junior','Independiente Santa Fe'],
    EC:['LDU Quito','Independiente del Valle','Barcelona Sporting Club','Emelec','Aucas'],
    PY:['Club Olimpia','Cerro Porteño','Club Libertad','Club Guaraní','Club Nacional'],
    PE:['Alianza Lima','Universitario de Deportes','Sporting Cristal','FBC Melgar','Los Chankas'],
    UY:['Peñarol','Nacional','Defensor Sporting','Liverpool FC','Danubio'],
    VE:['Deportivo Táchira','Caracas FC','Carabobo FC','Academia Puerto Cabello','Deportivo La Guaira'],
    GY:['Guyana Defence Force FC','Slingerz FC','Western Tigers FC','Guyana Police Force FC','Santos FC'],
    SR:['Robinhood','SV Transvaal','Inter Moengotapoe','SV Notch','SV Broki']
  };
  const DEFAULT_TOURNAMENTS = [
    {id:'aps-lib',name:'CONMEBOL Libertadores · Simulada',kind:'libertadores',builtIn:true},
    {id:'aps-sud',name:'CONMEBOL Sudamericana · Simulada',kind:'sudamericana',builtIn:true},
    {id:'aps-interliga',name:'Interliga APS',kind:'interliga',builtIn:true}
  ];
  const $ = (selector, root=document) => root.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const norm = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').replace(/[^a-z0-9]+/g,' ').trim();
  const fmt = value => new Intl.NumberFormat('es-PE').format(Number(value)||0);
  const catalog = () => window.FOXCRAK_CLUB_DIRECTORY || {countries:[], competitions:[]};
  const ESCUDOTECA_BASE = 'https://paladarnegro.net/escudoteca/';
  const ESCUDOTECA_SLUGS = {AR:'argentina',BO:'bolivia',BR:'brasil',CL:'chile',CO:'colombia',EC:'ecuador',PY:'paraguay',PE:'peru',UY:'uruguay',VE:'venezuela'};
  const ESCUDOTECA_DIRS = {
    AR:['argentina/primeradivision/png/'], BO:['bolivia/primeradivision/png/'], BR:['brasil/seriea/png/'],
    CL:['chile/primeradivision/png/'], CO:['colombia/primeraa/png/'],
    EC:['ecuador/seriea/png/'], PY:['paraguay/copadeprimera/png/'], PE:['peru/liga1/png/'],
    UY:['uruguay/primeradivision/png/'], VE:['venezuela/primeradivision/png/']
  };
  const ESCUDOTECA_FILE_OVERRIDES = {
    'AR|Aldosivi':'aldosivi','AR|River Plate':'river','AR|Boca Juniors':'boca','AR|Argentinos Juniors':'argentinos','AR|Estudiantes de La Plata':'estudianteslp','AR|San Lorenzo':'sanlorenzo','AR|Vélez Sarsfield':'velez',
    'BO|ABB':'abb','BO|Bolívar':'bolivar','BO|The Strongest':'thestrongest','BR|Atlético Mineiro':'atlmineiro','BR|Athletico Paranaense':'athleticopr','BR|São Paulo':'saopaulo','BR|Grêmio':'gremio',
    'CL|Audax Italiano':'audax','CL|Colo-Colo':'colocolo','CL|Universidad de Chile':'udechile','CL|O’Higgins':'ohiggins',
    'CO|Águilas Doradas':'aguilas_doradas','CO|Atlético Nacional':'atleticonacional','CO|América de Cali':'americadecali','CO|Independiente Santa Fe':'santafe',
    'PE|ADT':'adt','PE|Alianza Atlético':'alianza_atletico','PE|Alianza Lima':'alianzalima','PE|Atlético Grau':'atleticograu','PE|Los Chankas':'loschankas','PE|Sporting Cristal':'sportingcristal','PE|Universitario de Deportes':'universitario','PE|FBC Melgar':'melgar',
    'EC|Aucas':'aucas','EC|LDU Quito':'ldu','EC|Independiente del Valle':'independientedelvalle','PY|Sportivo 2 de Mayo':'2demayo','PY|Club Olimpia':'olimpia','UY|Albion':'albion','UY|Peñarol':'penarol','UY|Nacional':'nacional',
    'VE|Academia Puerto Cabello':'academia','VE|Deportivo Táchira':'tachira','VE|Caracas FC':'caracas'
  };
  function crestSourceByCode(code){ const slug=ESCUDOTECA_SLUGS[code]; return slug ? `${ESCUDOTECA_BASE}${slug}/index.php` : ESCUDOTECA_BASE; }
  function countryFlag(code){ return (catalog().countries||[]).find(c=>c.code===code)?.flag || '⚽'; }
  function countryCrestLink(code){ return crestSourceByCode(code); }
  function crestSlugs(team){
    const override=ESCUDOTECA_FILE_OVERRIDES[`${team.code}|${team.name}`];
    const compact=norm(team.name).replace(/\s+/g,'');
    const underscore=norm(team.name).replace(/\s+/g,'_');
    const base=norm(team.name).replace(/^(club|atletico|deportivo|sportivo|sporting|universidad|independiente|real|asociacion|asociación)\s+/,'').replace(/\s+(fc|sc|ac|club)$/,'');
    const candidates=[override,compact,underscore,norm(team.name).replace(/\s+/g,'-'),base.replace(/\s+/g,''),base.replace(/\s+/g,'_')].filter(Boolean);
    return [...new Set(candidates)];
  }
  function logoCandidates(team){
    const direct=validLogoURL(team.logoUrl||''); if(direct)return [direct];
    const dirs=ESCUDOTECA_DIRS[team.code]||[]; const slugs=crestSlugs(team);
    const out=[];
    // Priorizar PNG, que aparece enlazado en las páginas de la Escudoteca; luego probar JPG de /img/.
    for(const dir of dirs)for(const slug of slugs.slice(0,5))out.push(`${ESCUDOTECA_BASE}${dir}${slug}.png`);
    for(const dir of dirs)for(const slug of slugs.slice(0,2))out.push(`${ESCUDOTECA_BASE}${dir.replace(/\/png\/$/,'img/')}${slug}.jpg`);
    return [...new Set(out)].slice(0,8);
  }
  function localDayKey() {
    const parts = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const get = t => parts.find(p=>p.type===t)?.value || '2000';
    return `${get('year')}-${get('month')}-${get('day')}`;
  }
  function readStore() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      return {
        schemaVersion: Number(saved.schemaVersion)||1, day: saved.day || '', revision: Number(saved.revision)||0, fixtureSessionToken: String(saved.fixtureSessionToken||''), lastActiveAt:Number(saved.lastActiveAt)||0, cycleStartedAt: Number(saved.cycleStartedAt)||0, roundNo: Math.max(0,Number(saved.roundNo)||0), scheduleAnchor:Number(saved.scheduleAnchor)||0, seasonMode:saved.seasonMode==='round'?'round':'full', seasonSpeedMs:[1000,5000,10000].includes(Number(saved.seasonSpeedMs))?Number(saved.seasonSpeedMs):5000, seasonAutoAdvance:!!saved.seasonAutoAdvance, selectedCountryCode:String(saved.selectedCountryCode||''),
        customTeams: Array.isArray(saved.customTeams)?saved.customTeams:[], extraFeatured: Array.isArray(saved.extraFeatured)?saved.extraFeatured:[],
        disabledDefault: Array.isArray(saved.disabledDefault)?saved.disabledDefault:[], powerOverrides: saved.powerOverrides && typeof saved.powerOverrides==='object'?saved.powerOverrides:{},
        tournaments: Array.isArray(saved.tournaments)?saved.tournaments:[], matches: Array.isArray(saved.matches)?saved.matches:[],
        history: Array.isArray(saved.history)?saved.history:[], picks: saved.picks && typeof saved.picks==='object'?saved.picks:{},
        favorites: saved.favorites && typeof saved.favorites==='object'?saved.favorites:{}, viewedMatches: saved.viewedMatches && typeof saved.viewedMatches==='object'?saved.viewedMatches:{},
        profileXP: saved.profileXP && typeof saved.profileXP==='object'?saved.profileXP:{}, ownerGeneratedAt: saved.ownerGeneratedAt || '',
        nationalSeasons: Array.isArray(saved.nationalSeasons)?saved.nationalSeasons:[], nationalTitleHistory: Array.isArray(saved.nationalTitleHistory)?saved.nationalTitleHistory:[],
        internationalSeasons: Array.isArray(saved.internationalSeasons)?saved.internationalSeasons:[], internationalTitleHistory: Array.isArray(saved.internationalTitleHistory)?saved.internationalTitleHistory:[], seasonCycle: Math.max(0,Number(saved.seasonCycle)||0), regatasBaseRound: saved.regatasBaseRound==null?null:(Number.isFinite(Number(saved.regatasBaseRound))?Number(saved.regatasBaseRound):null), intensityLevel: Math.max(1,Math.min(7,Math.round(Number(saved.intensityLevel)||4)))
      };
    } catch { return {schemaVersion:1,day:'',revision:0,fixtureSessionToken:'',lastActiveAt:0,cycleStartedAt:0,roundNo:0,scheduleAnchor:0,seasonMode:'full',seasonSpeedMs:5000,seasonAutoAdvance:false,selectedCountryCode:'',customTeams:[],extraFeatured:[],disabledDefault:[],powerOverrides:{},tournaments:[],matches:[],history:[],picks:{},favorites:{},viewedMatches:{},profileXP:{},ownerGeneratedAt:'',nationalSeasons:[],nationalTitleHistory:[],internationalSeasons:[],internationalTitleHistory:[],seasonCycle:0,regatasBaseRound:null,intensityLevel:4}; }
  }
  let db = readStore();
  // La simulación se pausa mientras la página está cerrada: al volver, desplaza la línea temporal
  // por el tiempo que la web permaneció fuera de servicio y conserva los mismos partidos/IDs.
  const BOOT_TIME = Date.now();
  const hasSavedRound = Array.isArray(db.matches) && db.matches.length === 40 &&
    Number(db.cycleStartedAt) > 0 && Number(db.scheduleAnchor) > 0 &&
    db.matches.every(match => Number(match.simStartedAt) > 0 && Number(match.kickoff) > 0);
  // Compatibilidad con el build anterior, que todavía no guardaba lastActiveAt:
  // en la primera carga conserva los cruces y alinea su reloj una sola vez, en vez de sortearlos otra vez.
  const PAUSED_MS = hasSavedRound
    ? Math.max(0, BOOT_TIME - (Number(db.lastActiveAt) > 0 ? Number(db.lastActiveAt) : Number(db.cycleStartedAt)))
    : 0;
  if (PAUSED_MS > 0) {
    if (Number(db.scheduleAnchor) > 0) db.scheduleAnchor = Number(db.scheduleAnchor) + PAUSED_MS;
    if (Number(db.cycleStartedAt) > 0) db.cycleStartedAt = Number(db.cycleStartedAt) + PAUSED_MS;
    const shiftNestedWallClocks = value => {
      if (!value || typeof value !== 'object') return;
      if (Array.isArray(value)) { value.forEach(shiftNestedWallClocks); return; }
      for (const [key, child] of Object.entries(value)) {
        if ((key === 'createdAtMs' || key === 'setAt') && Number.isFinite(Number(child)) && Number(child) > 0) value[key] = Number(child) + PAUSED_MS;
        else shiftNestedWallClocks(child);
      }
    };
    for (const match of db.matches) {
      if (Number(match.kickoff) > 0) match.kickoff = Number(match.kickoff) + PAUSED_MS;
      if (Number(match.simStartedAt) > 0) match.simStartedAt = Number(match.simStartedAt) + PAUSED_MS;
      if (match.createdAt) {
        const created = Date.parse(match.createdAt);
        if (Number.isFinite(created)) match.createdAt = new Date(created + PAUSED_MS).toISOString();
      }
      shiftNestedWallClocks(match.liveControl);
    }
  }
  let ownerUnlocked = false; // PIN local de demostración; no es seguridad para un sitio público.
  let ownerIntensityScope = 'selected';
  let ownerIntensityDraft = 4;
  let ownerFixtureFilter = 'ALL';
  let ownerFixtureSearch = '';
  function saveStore(){ try { db.schemaVersion=12; db.lastActiveAt=Date.now(); localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch {} }
  // Último guardado al abandonar/cerrar la página para que el reinicio restaure esta misma jornada.
  window.addEventListener('pagehide', saveStore);
  function accountInfo(){
    const fromApp = window.FoxcrakApp?.getActiveProfile?.();
    if(fromApp?.username) return {id:String(fromApp.id||fromApp.username),name:String(fromApp.username)};
    try { const st=JSON.parse(localStorage.getItem('foxcrakApsState')||'{}'); if(st.username) return {id:'legacy:'+st.username,name:String(st.username)}; } catch {}
    return {id:'guest',name:'Invitado'};
  }
  const isOwner = () => ownerUnlocked;
  function allCatalogTeams(){
    const teams = [];
    for(const c of catalog().countries||[]) for(const name of c.clubs||[]) teams.push({
      id:`${c.code}:${norm(name)}`,name,country:c.name,code:c.code,flag:c.flag||'⚽',league:c.league||'Liga nacional',
      timezone:COUNTRY_TZ[c.code]||'America/Lima',source:c.source||c.association||'',crestSource:crestSourceByCode(c.code),logoUrl:'',custom:false
    });
    for(const team of db.customTeams) teams.push({...team,custom:true,timezone:team.timezone||COUNTRY_TZ[team.code]||'America/Lima'});
    return teams;
  }
  function findTeam(country, name){ return allCatalogTeams().find(t=>t.code===country && norm(t.name)===norm(name)); }
  // La jornada sortea desde TODO el catálogo nacional, no solo desde los cinco destacados del panel Owner.
  function simulationTeamsByCountry(){
    const all=allCatalogTeams();
    return (catalog().countries||[]).map(country=>({
      country,
      teams:all.filter(team=>team.code===country.code&&!db.disabledDefault.includes(team.id))
    })).filter(row=>row.teams.length>0);
  }
  function featuredTeamsByCountry(){
    const all = allCatalogTeams(); const allCountries = catalog().countries||[];
    return allCountries.map(country=>{
      const wanted = DEFAULT_TOP[country.code] || (country.clubs||[]).slice(0,5);
      let selected = wanted.map(n=>findTeam(country.code,n)).filter(Boolean);
      if(selected.length<2) selected = all.filter(t=>t.code===country.code && !t.custom).slice(0,5);
      const extras = db.extraFeatured.map(id=>all.find(t=>t.id===id)).filter(t=>t&&t.code===country.code);
      selected = [...selected,...extras].filter((t,i,arr)=>arr.findIndex(x=>x.id===t.id)===i);
      selected = selected.filter(t=>!db.disabledDefault.includes(t.id));
      return {country,teams:selected};
    }).filter(row=>row.teams.length);
  }
  function strength(team){
    const override = Number(db.powerOverrides[team.id]);
    if(Number.isFinite(override)&&override>=1&&override<=100) return Math.round(override);
    const pool = simulationTeamsByCountry().find(r=>r.country.code===team.code)?.teams || [];
    const idx = Math.max(0,pool.findIndex(t=>t.id===team.id));
    const tierPenalty=Math.min(12,Math.floor(idx/5)*1.5);
    return Math.max(48,Math.min(93,78-tierPenalty+((simpleHash(team.name)%13)-6)));
  }
  function simpleHash(s){ let h=2166136261; for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);} return h>>>0; }
  function makeRandom(seed){ let a = (seed>>>0)||123456789; return ()=>{a=(Math.imul(1664525,a)+1013904223)>>>0;return a/4294967296;}; }
  function teamScore(seed, power){
    const r=makeRandom(seed ^ Math.round(power*97));
    const adjusted=(power-65)/110;
    const value=r();
    const thresholds=[0.18,0.48,0.75,0.92,0.985,1];
    let goal=[0,1,2,3,4,5][thresholds.findIndex(t=>value<t)];
    if(r()<Math.max(0,Math.min(.22,adjusted))) goal=Math.min(5,goal+1);
    if(r()<Math.max(0,Math.min(.18,-adjusted))) goal=Math.max(0,goal-1);
    return goal;
  }
  function nextPlayingMinute(minute, steps=1){
    let m=Math.max(1,Math.min(70,Number(minute)||1));
    for(let i=0;i<Math.max(1,steps);i++){
      if(m<30)m+=1;else if(m<41)m=41;else if(m<70)m+=1;
    }
    return m;
  }
  function randomPlayingMinute(r){const raw=1+Math.floor(r()*60);return raw<=30?raw:raw+10;}
  function addVarScenario(target, rng, forced=false){
    const chance=forced?1:(target.type==='goal'?.22:target.type==='yellow'?.12:target.type==='red'?.15:target.type==='penalty-awarded'?.28:0);
    if(rng()>=chance)return [];
    const targetType=target.type;
    let outcome='validated';
    if(targetType==='goal')outcome=rng()<.28?'invalidated':'validated';
    else if(targetType==='yellow')outcome=rng()<.30?'upgrade-red':'validated';
    else if(targetType==='red')outcome=rng()<.22?'downgrade-yellow':'validated';
    else if(targetType==='penalty-awarded')outcome=rng()<.18?'invalidated':'validated';
    target.varReviewAt=nextPlayingMinute(target.minute,1);
    target.varDecisionMinute=nextPlayingMinute(target.minute,2);
    target.varOutcome=outcome;
    target.varReviewChance=chance;
    return [
      {eventId:`${target.eventId}:VAR-REVIEW`,type:'var-review',minute:target.varReviewAt,side:target.side,targetEventId:target.eventId,targetType,outcome,eventLabel:targetType},
      {eventId:`${target.eventId}:VAR-RESULT`,type:'var-result',minute:target.varDecisionMinute,side:target.side,targetEventId:target.eventId,targetType,outcome,eventLabel:targetType}
    ];
  }
  function generatedScoreForMatch(match){
    if(match.manualScore && Number.isInteger(Number(match.manualScore.homeGoals)) && Number.isInteger(Number(match.manualScore.awayGoals)) && match.manualScore.final){
      return {homeGoals:Number(match.manualScore.homeGoals),awayGoals:Number(match.manualScore.awayGoals),events:Array.isArray(match.manualScore.events)?match.manualScore.events:[],manual:true};
    }
    const seed=simpleHash(`${match.id}|${match.home.name}|${match.away.name}|APS`);
    const homePower=strength(match.homeTeam),awayPower=strength(match.awayTeam);
    // El marcador potencial queda fijado por la semilla del partido; la intensidad solo modifica
    // el ritmo de los goles pendientes y la frecuencia de incidencias, nunca el número de goles base.
    const homeGoals=teamScore(seed,homePower+3),awayGoals=teamScore(seed^0x9e3779b9,awayPower);
    const level=intensityLevelFor(match),profile=intensityProfile(level);
    const freezeMinute=Number.isFinite(Number(match.liveControl?.intensityFrozenMinute))?Number(match.liveControl.intensityFrozenMinute):0;
    const goalR=makeRandom(seed^0xa5a5a5a5);
    const incidentR=makeRandom(simpleHash(`${match.id}|INCIDENTS|${level}`));
    const events=[];
    for(let i=0;i<homeGoals;i++){
      const raw=randomPlayingMinute(goalR),shiftRoll=goalR();events.push({eventId:`${match.id}:G-H-${i+1}`,type:'goal',minute:shiftGoalMinute(raw,level,freezeMinute,shiftRoll),side:'home'});
    }
    for(let i=0;i<awayGoals;i++){
      const raw=randomPlayingMinute(goalR),shiftRoll=goalR();events.push({eventId:`${match.id}:G-A-${i+1}`,type:'goal',minute:shiftGoalMinute(raw,level,freezeMinute,shiftRoll),side:'away'});
    }
    const yellowBase=2+Math.floor(incidentR()*4);
    const yellowCount=Math.max(1,Math.min(10,Math.round(yellowBase*profile.yellowMultiplier)));
    for(let i=0;i<yellowCount;i++){
      events.push({eventId:`${match.id}:Y-L${level}-${i+1}`,type:'yellow',minute:randomPlayingMinuteAfter(incidentR,freezeMinute),side:incidentR()<.5?'home':'away'});
    }
    if(incidentR()<profile.redChance){
      events.push({eventId:`${match.id}:R-L${level}-1`,type:'red',minute:randomPlayingMinuteAfter(incidentR,freezeMinute),side:incidentR()<.5?'home':'away'});
    }
    // Penal dinámico: si se convierte, reutiliza un gol base pendiente del mismo lado. Así, variar la
    // intensidad puede cambiar la jugada y el minuto, pero no añade ni quita goles del resultado fijado.
    if(incidentR()<profile.penaltyChance){
      const side=incidentR()<.5?'home':'away';
      const minute=randomPlayingMinuteAfter(incidentR,freezeMinute);
      const penalty={eventId:`${match.id}:P-L${level}-1`,type:'penalty-awarded',minute,side};events.push(penalty);
      const candidate=events.filter(e=>e.type==='goal'&&e.side===side&&Number(e.minute)>Math.max(minute,freezeMinute)&&!e.source).sort((a,b)=>a.minute-b.minute)[0];
      const converted=!!candidate&&incidentR()<profile.penaltyConvert;
      if(converted){candidate.originalMinute=candidate.minute;candidate.minute=randomPlayingMinuteAfter(incidentR,Math.max(minute,freezeMinute));candidate.source='penalty';penalty.linkedGoalId=candidate.eventId;}
      else events.push({eventId:`${match.id}:P-MISS-L${level}-1`,type:'penalty-missed',minute:randomPlayingMinuteAfter(incidentR,minute),side});
      const penaltyVarR=makeRandom(simpleHash(`${penalty.eventId}|VAR`));
      const penaltyVar=addVarScenario(penalty,penaltyVarR);
      if(penaltyVar.length){
        events.push(...penaltyVar);
        if(penalty.varOutcome==='invalidated'&&converted&&candidate){candidate.minute=candidate.originalMinute;candidate.source='';}
      }
    }
    // El VAR de los goles usa una semilla estable independiente de la intensidad para no alterar el resultado.
    for(const event of events.slice()){
      if(event.type==='goal'&&!event.varReviewAt){
        const varR=makeRandom(simpleHash(`${event.eventId}|VAR`));events.push(...addVarScenario(event,varR));
      }else if((event.type==='yellow'||event.type==='red')&&!event.varReviewAt){
        const varR=makeRandom(simpleHash(`${event.eventId}|VAR`));events.push(...addVarScenario(event,varR));
      }
    }
    const order={ 'var-review':-2,'penalty-awarded':-1,goal:0,yellow:1,red:2,'penalty-missed':3,'var-result':4 };
    events.sort((a,b)=>a.minute-b.minute||(order[a.type]??0)-(order[b.type]??0));
    const allGoals=events.filter(e=>e.type==='goal'&&!(e.varOutcome==='invalidated'&&Number(e.varDecisionMinute||71)<=70));
    return {homeGoals:allGoals.filter(e=>e.side==='home').length,awayGoals:allGoals.filter(e=>e.side==='away').length,events};
  }
  function matchTimeline(match){
    const base=generatedScoreForMatch(match);
    const control=match.liveControl||{};
    const overrides=control.eventOverrides||{};
    const baseEvents=(base.events||[]).map(e=>overrides[e.eventId]?({...e,...overrides[e.eventId]}):e);
    const hasFreeze=Number.isFinite(Number(control.intensityFrozenMinute))&&Array.isArray(control.intensityFrozenEvents);
    const freezeMinute=hasFreeze?Number(control.intensityFrozenMinute):0;
    // Cuando Owner cambia la intensidad durante un encuentro, todos los eventos ya ocurridos se congelan;
    // solo cambia la distribución de goles pendientes y la frecuencia de incidencias futuras.
    const remainingEvents=hasFreeze?baseEvents.filter(e=>Number(e.minute)>freezeMinute):baseEvents;
    const frozen=hasFreeze?control.intensityFrozenEvents:[];
    const extras=Array.isArray(control.events)?control.events:[];
    const merged=[...frozen,...remainingEvents,...extras];
    const seen=new Set();
    return merged.filter((e,i)=>{const id=e.eventId||`${e.type}:${e.side}:${e.minute}:${i}`;if(seen.has(id))return false;seen.add(id);return true;}).sort((a,b)=>a.minute-b.minute||String(a.eventId||'').localeCompare(String(b.eventId||'')));
  }
  function eventGoalEffective(event, minute){
    return event.type==='goal'&&!(event.varOutcome==='invalidated'&&Number(event.varDecisionMinute||71)<=Number(minute||0));
  }
  function eventDisplayType(event, minute){
    if(event.type==='goal'&&event.varOutcome==='invalidated'&&Number(event.varDecisionMinute||71)<=minute)return 'goal-cancelled';
    if(event.type==='yellow'&&event.varOutcome==='upgrade-red'&&Number(event.varDecisionMinute||71)<=minute)return 'red';
    if(event.type==='red'&&event.varOutcome==='downgrade-yellow'&&Number(event.varDecisionMinute||71)<=minute)return 'yellow';
    return event.type;
  }
  function scoreAtMinute(match, minute){
    if(match.manualScore?.final)return {homeGoals:Number(match.manualScore.homeGoals)||0,awayGoals:Number(match.manualScore.awayGoals)||0};
    const m=Math.max(0,Math.min(70,Number(minute)||0)),events=matchTimeline(match),control=match.liveControl;
    if(control?.scoreOverride){
      const ov=control.scoreOverride,baseline=new Set(ov.baselineGoalIds||[]);let home=Number(ov.homeGoals)||0,away=Number(ov.awayGoals)||0;
      for(const e of events){
        if(e.type!=='goal')continue;
        const id=String(e.eventId||''),active=eventGoalEffective(e,m);
        if(baseline.has(id)){
          // Si el VAR revoca un gol que estaba incluido en el marcador base, se resta después de la decisión.
          if(!active){if(e.side==='home')home=Math.max(0,home-1);else away=Math.max(0,away-1);}
          continue;
        }
        const futureBase=!e.ownerAdded&&Number(e.minute)>Number(ov.minute);
        const futureOwner=!!e.ownerAdded&&Number(e.createdAtMs||0)>=Number(ov.setAt||0);
        if((futureBase||futureOwner)&&Number(e.minute)<=m&&active){if(e.side==='home')home++;else away++;}
      }
      return {homeGoals:home,awayGoals:away};
    }
    const valid=events.filter(e=>Number(e.minute)<=m&&eventGoalEffective(e,m));
    return {homeGoals:valid.filter(e=>e.side==='home').length,awayGoals:valid.filter(e=>e.side==='away').length};
  }
  function scoreForMatch(match){
    const base=generatedScoreForMatch(match),totals=scoreAtMinute(match,70);
    return {homeGoals:totals.homeGoals,awayGoals:totals.awayGoals,events:matchTimeline(match),manual:!!base.manual};
  }
  const MATCH_DURATION_MS = 70 * 60 * 1000; // 30 min primera parte + 10 descanso + 30 segunda parte.
  const MATCHES_PER_ROUND = 40;
  const INTENSITY_PROFILES = [
    {label:'TRANQUILO', goalShift:5, goalWindow:24, yellowMultiplier:.62, redChance:.045, penaltyChance:.045, penaltyConvert:.52},
    {label:'SUAVE', goalShift:3, goalWindow:32, yellowMultiplier:.78, redChance:.07, penaltyChance:.065, penaltyConvert:.58},
    {label:'CONTROLADO', goalShift:1, goalWindow:42, yellowMultiplier:.90, redChance:.09, penaltyChance:.085, penaltyConvert:.64},
    {label:'EQUILIBRADO', goalShift:0, goalWindow:50, yellowMultiplier:1, redChance:.12, penaltyChance:.11, penaltyConvert:.70},
    {label:'INTENSO', goalShift:-1, goalWindow:61, yellowMultiplier:1.20, redChance:.16, penaltyChance:.145, penaltyConvert:.72},
    {label:'MUY INTENSO', goalShift:-3, goalWindow:73, yellowMultiplier:1.42, redChance:.22, penaltyChance:.195, penaltyConvert:.76},
    {label:'LOCURA', goalShift:-5, goalWindow:84, yellowMultiplier:1.68, redChance:.28, penaltyChance:.25, penaltyConvert:.79}
  ];
  function intensityProfile(level){return INTENSITY_PROFILES[Math.max(0,Math.min(6,Math.round(Number(level)||4)-1))];}
  function intensityLevelFor(match){return Math.max(1,Math.min(7,Math.round(Number(match?.liveControl?.intensityLevel||match?.intensityLevel||db.intensityLevel)||4)));}
  function intensityMatchPanelMarkup(match){
    const level=intensityLevelFor(match),profile=intensityProfile(level),state=statusFor(match),shift=Number(profile.goalShift)||0;
    const shiftText=shift===0?'SIN DESPLAZAMIENTO':`${shift>0?'+':''}${shift} MIN · ${shift>0?'MÁS TARDE':'MÁS TEMPRANO'}`;
    const stateCopy=state.status==='live'?'Cambio en tiempo real: afecta los eventos pendientes desde el minuto actual.':state.status==='final'?'Encuentro finalizado: la intensidad queda como dato histórico.':'Se usará este perfil cuando comience el encuentro.';
    return `<section class="sim-match-intensity-panel" id="simMatchIntensityPanel" data-status="${esc(state.status)}" data-intensity-level="${level}"><div class="sim-match-intensity-head"><span class="sim-intensity-square" data-intensity-level="${level}" aria-hidden="true"></span><div><small>MOTOR DE INTENSIDAD ${state.status==='live'?'· EN DIRECTO':state.status==='final'?'· HISTÓRICO':'· PROGRAMADO'}</small><strong>INTENSIDAD ${level}/7 · ${esc(profile.label)}</strong><p>${esc(stateCopy)}</p></div></div><div class="sim-match-intensity-grid"><div class="sim-match-intensity-stat"><small>PROB. DE AJUSTE DEL MINUTO DE GOL</small><strong>${profile.goalWindow}%</strong><span>Desplazamiento: ${esc(shiftText)}</span></div><div class="sim-match-intensity-stat"><small>FRECUENCIA DE AMARILLAS</small><strong>×${profile.yellowMultiplier.toFixed(2).replace('.',',')}</strong><span>Multiplicador de incidencias</span></div><div class="sim-match-intensity-stat"><small>PROB. DE ROJA DIRECTA</small><strong>${Math.round(profile.redChance*100)}%</strong><span>Por simulación de encuentro</span></div><div class="sim-match-intensity-stat"><small>PROB. DE PENAL</small><strong>${Math.round(profile.penaltyChance*100)}%</strong><span>Antes de conversión o VAR</span></div><div class="sim-match-intensity-stat"><small>CONVERSIÓN DE PENAL</small><strong>${Math.round(profile.penaltyConvert*100)}%</strong><span>Si la jugada genera penal</span></div></div><p class="sim-match-intensity-foot">Las probabilidades futuras se recalculan con el nivel actual. Goles, tarjetas y decisiones que ya ocurrieron se conservan; los porcentajes son del motor de simulación, no estadísticas reales.</p></section>`;
  }
  function clampNumber(value,min,max,fallback=min){const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;}
  const PLAYING_MINUTES = [...Array.from({length:30},(_,i)=>i+1),...Array.from({length:30},(_,i)=>i+41)];
  function randomPlayingMinuteAfter(r,floor=0){const available=PLAYING_MINUTES.filter(m=>m>Number(floor||0));if(!available.length)return 70;return available[Math.min(available.length-1,Math.floor(r()*available.length))];}
  function shiftGoalMinute(rawMinute,level,floor=0,shiftRoll=1){
    const profile=intensityProfile(level);const base=Number(rawMinute)||1;const min=Math.max(0,Number(floor)||0);
    if(base<=min||Number(shiftRoll)>=profile.goalWindow/100)return base;
    const allowed=PLAYING_MINUTES.filter(m=>m>min);if(!allowed.length)return base;
    const target=base+profile.goalShift;
    return allowed.reduce((best,m)=>Math.abs(m-target)<Math.abs(best-target)?m:best,allowed[0]);
  }
  const MIN_FIXTURE_GAP_MS = 5 * 60 * 1000;
  const MAX_FIXTURE_GAP_MS = 20 * 60 * 1000;
  function fixtureOffsets(dayKey, revision, roundNo, count=MATCHES_PER_ROUND){
    // Horarios legibles en franjas de 5 minutos para que el reloj general y los partidos compartan el mismo pulso.
    return Array.from({length:Math.max(0,count)},(_,index)=>index*5*60*1000);
  }
  function roundDurationMs(dayKey, revision, roundNo){
    const offsets=fixtureOffsets(dayKey,revision,roundNo,MATCHES_PER_ROUND);
    return (offsets[offsets.length-1]||0)+MATCH_DURATION_MS;
  }
  function kickoffFor(startAt,index,dayKey,revision,roundNo){
    return Number(startAt)+(fixtureOffsets(dayKey,revision,roundNo,MATCHES_PER_ROUND)[index]||0);
  }
  function fixtureTime(match, tz){
    return new Intl.DateTimeFormat('es-PE',{timeZone:tz||'America/Lima',weekday:'short',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(match.kickoff));
  }
  function timeInPeru(match){ return new Intl.DateTimeFormat('es-PE',{timeZone:'America/Lima',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(match.kickoff)); }
  function countryTournament(team){
    return (catalog().countries||[]).find(c=>c.code===team.code)?.league || team.league || 'Liga APS';
  }
  function tournaments(){ return [...DEFAULT_TOURNAMENTS,...db.tournaments].filter((t,i,a)=>a.findIndex(x=>norm(x.name)===norm(t.name))===i); }
  function competitionMeta(value){
    const text=norm(typeof value==='string'?value:(value?.name||''));
    if(text.includes('libertadores'))return {type:'libertadores',label:'CONMEBOL LIBERTADORES',className:'comp-libertadores'};
    if(text.includes('sudamericana'))return {type:'sudamericana',label:'CONMEBOL SUDAMERICANA',className:'comp-sudamericana'};
    if(text.includes('interliga'))return {type:'interliga',label:'INTERLIGA APS',className:'comp-interliga'};
    return {type:'national',label:typeof value==='string'?value:(value?.name||'Liga nacional'),className:'comp-national'};
  }
  function competitionDisplayLabel(match){
    const type=match?.competitionType||competitionMeta(match?.competition).type;
    const icon=type==='national'?(match?.home?.flag||countryFlag(match?.home?.code)):'🏆';
    const name=match?.competition||'Competición APS';
    // Los encuentros de las ligas nacionales se distinguen claramente como amistosos del simulador.
    return type==='national'?`${icon} ${name} · AMISTOSO`:`${icon} ${name}`;
  }
  function chooseTeam(pool, seed, excludedIds=[]){
    const excluded=excludedIds instanceof Set?excludedIds:new Set(Array.isArray(excludedIds)?excludedIds:[excludedIds]);
    const usable=pool.filter(t=>!excluded.has(t.id));
    if(!usable.length)return null;
    const rng=makeRandom((Number(seed)||1)>>>0);
    // Orden pseudoaleatorio reproducible por jornada: cambia el emparejamiento sin repetirlo en cada redibujo.
    return usable.map(team=>({team,roll:rng()})).sort((a,b)=>a.roll-b.roll)[0]?.team||usable[0];
  }
  const PRIMARY_LEAGUE_CODES = ['AR','BO','BR','CL','CO','EC','PY','PE','UY','VE'];
  function virtualScheduleAnchor(dayKey=localDayKey()){
    const [y,m,d]=String(dayKey).split('-').map(Number);
    // 08:15 hora de Perú (UTC−5). La agenda sigue avanzando cada 70 min desde este reinicio.
    return Date.UTC(y,m-1,d,13,15,0);
  }
  function roundAtTime(anchor, now=Date.now(), dayKey=localDayKey(anchor), revision=0){
    let round=0,cursor=Number(anchor)||virtualScheduleAnchor(dayKey);
    if(Number(now)<cursor)return 0;
    // Cada ciclo espera a que termine el último partido escalonado de la ronda.
    while(round<1000 && Number(now)>=cursor+roundDurationMs(dayKey,revision,round)){
      cursor+=roundDurationMs(dayKey,revision,round);round++;
    }
    return round;
  }
  function scheduledRoundStart(anchor, roundNo, dayKey=localDayKey(anchor), revision=0){
    let cursor=Number(anchor)||virtualScheduleAnchor(dayKey);
    const limit=Math.max(0,Number(roundNo)||0);
    for(let round=0;round<limit;round++)cursor+=roundDurationMs(dayKey,revision,round);
    return cursor;
  }
  function createFixture({dayKey,revision,roundNo,startAt,home,away,competition,competitionType,slot,roundLabel}){
    const id=`APS-${String(dayKey).replaceAll('-','')}-V${revision}-R${String(roundNo+1).padStart(4,'0')}-${competitionType.toUpperCase()}-${String(slot).padStart(2,'0')}`;
    const homeTeam={...home,timezone:home.timezone||COUNTRY_TZ[home.code]||'America/Lima'};
    const awayTeam={...away,timezone:away.timezone||COUNTRY_TZ[away.code]||'America/Lima'};
    const meta=competitionMeta(competitionType==='national'?competition:competitionType);
    return {id,fixtureVersion:15,home:homeTeam,away:awayTeam,homeTeam,awayTeam,homeName:home.name,awayName:away.name,homeCountry:home.country,awayCountry:away.country,homeCode:home.code,awayCode:away.code,homeFlag:home.flag||countryFlag(home.code),awayFlag:away.flag||countryFlag(away.code),homeTimezone:COUNTRY_TZ[home.code]||'America/Lima',kickoff:Number(startAt),simStartedAt:Number(startAt),simDurationMs:MATCH_DURATION_MS,intensityLevel:Math.max(1,Math.min(7,Number(db.intensityLevel)||4)),roundNo,competition,competitionType,competitionClass:meta.className,competitionId:`${competitionType}:${norm(competition)}`,slot,round:roundLabel||`FECHA ${roundNo+1}`,createdAt:new Date(Number(startAt)).toISOString()};
  }
  function deterministicPairing(pool, seed, excludedIds){
    const available=pool.filter(t=>!excludedIds.has(t.id));
    if(available.length<2)return null;
    const rng=makeRandom(seed);const indexed=available.map(t=>({t,k:rng()})).sort((a,b)=>a.k-b.k);return [indexed[0].t,indexed[1].t];
  }
  function generateDailyMatches(dayKey, revision=0, scheduleAnchor=virtualScheduleAnchor(dayKey), roundNo=0){
    const allRows=simulationTeamsByCountry();
    const rowByCode=new Map(allRows.map(r=>[r.country.code,r]));
    const localPlan=[['PE',4],['AR',3],['BR',2],['CO',2],['BO',2],['CL',1],['EC',1],['PY',1],['UY',1],['VE',1],['GY',1],['SR',1]];
    const startAt=scheduledRoundStart(scheduleAnchor,roundNo,dayKey,revision),matches=[],used=new Set();let slot=1;
    const rotationIndex=Math.max(0,Number(roundNo)+Number(revision));
    // Regatas juega una vez y descansa dos rondas; en cada aparición alterna Liga 1 e Interliga.
    const regatasActive=rotationIndex%3===0;
    const regatasPlaysInternational=regatasActive&&(Math.floor(rotationIndex/3)%2===1);
    const regatasPlaysLocal=regatasActive&&!regatasPlaysInternational;
    const regatasResting=!regatasActive;
    const isRegatas=t=>norm(t?.name||'').includes('regatas du fornika');
    const poolByCode=new Map(allRows.map(r=>[r.country.code,r.teams.filter(t=>!db.disabledDefault.includes(t.id)&&(r.country.code!=='PE'||!isRegatas(t)||regatasPlaysLocal))]));
    const localUsed=new Map();
    const teamKey=(code,name)=>`${String(code||'').toUpperCase()}|${norm(name)}`;
    const pairKey=(a,b)=>[teamKey(a.code,a.name),teamKey(b.code,b.name)].sort().join('~');
    // Deduplica el histórico antes de puntuar repeticiones para no penalizar dos veces partidos ya archivados.
    const priorById=new Map();
    for(const r of Array.isArray(db.history)?db.history:[])if(r&&r.home&&r.away)priorById.set(String(r.id||`${r.home}|${r.away}|${r.kickoff}`),r);
    for(const m of Array.isArray(db.matches)?db.matches:[])if(Number(m.roundNo)<Number(roundNo)&&m?.home?.name&&m?.away?.name){const id=String(m.id||`${m.home.name}|${m.away.name}|${m.kickoff}`);if(!priorById.has(id))priorById.set(id,{id,home:m.home.name,away:m.away.name,homeCode:m.home.code,awayCode:m.away.code,kickoff:m.kickoff,competitionType:m.competitionType});}
    const earlierRecords=[...priorById.values()].sort((a,b)=>(Number(b.kickoff)||Date.parse(b.finishedAt)||0)-(Number(a.kickoff)||Date.parse(a.finishedAt)||0));
    const recentRecords=earlierRecords.slice(0,100);
    const appearances=new Map();
    for(const record of recentRecords.slice(0,80)){
      const hk=teamKey(record.homeCode,record.home),ak=teamKey(record.awayCode,record.away);
      appearances.set(hk,(appearances.get(hk)||0)+1);appearances.set(ak,(appearances.get(ak)||0)+1);
    }
    const appearanceCount=team=>appearances.get(teamKey(team.code,team.name))||0;
    const pairRepeatWeight=(a,b)=>{
      const key=pairKey(a,b);let weight=0;
      recentRecords.forEach((record,index)=>{if(pairKey({code:record.homeCode,name:record.home},{code:record.awayCode,name:record.away})===key)weight+=(100-index)/100;});
      return weight;
    };
    const chooseBalancedTeam=(pool,seed,picked=new Set())=>{
      const available=pool.filter(t=>!picked.has(t.id));if(!available.length)return null;
      const rng=makeRandom(seed>>>0);
      return available.map(team=>({team,score:appearanceCount(team)*3+rng()*4})).sort((a,b)=>a.score-b.score)[0]?.team||available[0];
    };
    const chooseOpponent=(pool,home,seed,picked)=>{
      const avail=pool.filter(t=>t.id!==home.id&&!picked.has(t.id));if(!avail.length)return null;
      const rng=makeRandom(seed>>>0);
      const scored=avail.map(away=>({away,repeat:pairRepeatWeight(home,away),load:appearanceCount(away),roll:rng()}))
        .sort((a,b)=>a.repeat-b.repeat||a.load-b.load||a.roll-b.roll);
      return scored[0]?.away||avail[0];
    };
    const makeLocalPair=(code,subIndex,seed)=>{
      let pool=(poolByCode.get(code)||[]).filter(t=>!(code==='PE'&&regatasResting&&norm(t.name).includes('regatas du fornika')));
      if(pool.length<2)return null;
      const picked=localUsed.get(code)||new Set();
      let home=null,away=null;
      const find=(fragment)=>pool.find(t=>norm(t.name).includes(norm(fragment)));
      // Única aparición especial conservada: Regatas rota y, cuando le corresponde jugar en Liga 1, se enfrenta a FC Cajamarca.
      if(code==='PE'&&subIndex===0&&regatasPlaysLocal){
        home=find('regatas du fornika');away=find('fc cajamarca');
        if(home&&away&&(picked.has(home.id)||picked.has(away.id))){home=null;away=null;}
        else if(home&&away&&pairRepeatWeight(home,away)>1.8)away=null;
      }
      if(!home){
        const available=pool.filter(t=>!picked.has(t.id));
        if(available.length<2)return null;
        // Reparte oportunidades según apariciones recientes y deshace preferencias fijas por clásicos.
        home=chooseBalancedTeam(available,seed,picked);
      }
      if(!home||picked.has(home.id))return null;
      if(!away||picked.has(away.id)||away.id===home.id)away=chooseOpponent(pool,home,seed^0x85ebca6b,picked);
      if(!away||picked.has(away.id)||away.id===home.id){
        const alternative=pool.filter(t=>t.id!==home.id&&!picked.has(t.id));
        away=chooseTeam(alternative,seed^0xc2b2ae35,picked);
      }
      if(!home||!away||home.id===away.id||picked.has(home.id)||picked.has(away.id))return null;
      picked.add(home.id);picked.add(away.id);localUsed.set(code,picked);return [home,away];
    };
    // Veinte partidos nacionales por ronda. Perú tiene cuatro; los demás se reparten entre las 11 asociaciones restantes.
    for(const [code,count] of localPlan){
      const row=rowByCode.get(code);if(!row)continue;
      for(let idx=0;idx<count;idx++){
        const seed=simpleHash(`${dayKey}|${revision}|${roundNo}|${code}|LOCAL|${idx}`);
        const pair=makeLocalPair(code,idx,seed);if(!pair)continue;
        const [home,away]=pair;used.add(home.id);used.add(away.id);
        matches.push(createFixture({dayKey,revision,roundNo,startAt,home,away,competition:row.country.league,competitionType:'national',slot:slot++,roundLabel:`FECHA ${roundNo+1} · ${row.country.league}`}));
      }
    }
    const catalogue=allCatalogTeams().filter(t=>!db.disabledDefault.includes(t.id));
    const byName=(code,frag)=>catalogue.find(t=>t.code===code&&norm(t.name).includes(norm(frag)));
    const internationalUsed=new Set();
    const choosePeruCupTeam=(seed)=>{
      const allPeru=(poolByCode.get('PE')||[]).filter(t=>!used.has(t.id)&&!internationalUsed.has(t.id)&&!isRegatas(t));
      return chooseBalancedTeam(allPeru,seed,used);
    };
    const pickInternationalPair=(seed,forcedHome=null,preferCountryDiff=true)=>{
      // Los torneos continentales usan solo dos clubes peruanos por ciclo (uno por copa); Regatas puede representar a Perú en Interliga durante su turno rotativo.
      const allowPeru=!!(forcedHome&&forcedHome.code==='PE');
      const pairPool=catalogue.filter(t=>t.code!=='PE'||(allowPeru&&t.id===forcedHome.id));
      let home=forcedHome&& !used.has(forcedHome.id)&&!internationalUsed.has(forcedHome.id)?forcedHome:null;
      if(!home)home=chooseTeam(pairPool.filter(t=>!used.has(t.id)&&!internationalUsed.has(t.id)),seed,used);
      if(!home)return null;
      let awayPool=pairPool.filter(t=>t.id!==home.id&&!used.has(t.id)&&!internationalUsed.has(t.id));
      if(preferCountryDiff){const cross=awayPool.filter(t=>t.code!==home.code);if(cross.length)awayPool=cross;}
      let away=chooseTeam(awayPool.length?awayPool:pairPool.filter(t=>t.id!==home.id&&!used.has(t.id)&&!internationalUsed.has(t.id)),seed^0x27d4eb2d,used);
      if(!away||home.id===away.id||used.has(away.id)||internationalUsed.has(away.id))return null;
      internationalUsed.add(home.id);internationalUsed.add(away.id);used.add(home.id);used.add(away.id);return [home,away];
    };
    const addInternational=(count,type,name,forcedHomeForFirst=null)=>{
      for(let i=0;i<count;i++){
        let force=i===0?forcedHomeForFirst:null;
        // Dos clubes peruanos distintos llegan a las copas continentales, siempre que no estén jugando ya en la liga local.
        if(type==='libertadores'&&i===0)force=choosePeruCupTeam(simpleHash(`${dayKey}|${revision}|${roundNo}|PERU-LIB`))||force;
        if(type==='sudamericana'&&i===0)force=choosePeruCupTeam(simpleHash(`${dayKey}|${revision}|${roundNo}|PERU-SUD`))||force;
        // Regatas descansa dos rondas completas; en su siguiente aparición alterna a Interliga.
        if(type==='interliga'&&i===0&&regatasPlaysInternational)force=byName('PE','regatas du fornika')||force;
        const pair=pickInternationalPair(simpleHash(`${dayKey}|${revision}|${roundNo}|${type}|${i}`),force,true);
        if(!pair)continue;const [home,away]=pair;
        matches.push(createFixture({dayKey,revision,roundNo,startAt,home,away,competition:name,competitionType:type,slot:slot++,roundLabel:`RONDA ${roundNo+1} · ${name}`}));
      }
    };
    addInternational(8,'libertadores','CONMEBOL Libertadores');
    addInternational(8,'sudamericana','CONMEBOL Sudamericana');
    addInternational(4,'interliga','Interliga APS');
    // En catálogos pequeños, completa hasta 40 sin repetir un club dentro del mismo ciclo.
    while(matches.length<MATCHES_PER_ROUND){
      const type=matches.length%3===0?'libertadores':matches.length%3===1?'sudamericana':'interliga';
      const name=type==='libertadores'?'CONMEBOL Libertadores':type==='sudamericana'?'CONMEBOL Sudamericana':'Interliga APS';
      const pair=pickInternationalPair(simpleHash(`${dayKey}|${revision}|${roundNo}|EXTRA|${matches.length}`),null,true);if(!pair)break;
      matches.push(createFixture({dayKey,revision,roundNo,startAt,home:pair[0],away:pair[1],competition:name,competitionType:type,slot:slot++,roundLabel:`RONDA ${roundNo+1} · ${name}`}));
    }
    // Mezcla competiciones y países para que la cola no sea un bloque de una sola liga.
    const mixedMatches=mixFixtureOrder(matches,simpleHash(`${dayKey}|${revision}|${roundNo}|MIX-APS`));
    // En su turno activo, Regatas aparece en la primera franja; el resto de la cola conserva la mezcla equilibrada.
    const regatasFixtureIndex=mixedMatches.findIndex(m=>isRegatas(m.home)||isRegatas(m.away));
    if(regatasFixtureIndex>0)mixedMatches.unshift(mixedMatches.splice(regatasFixtureIndex,1)[0]);
    const offsets=fixtureOffsets(dayKey,revision,roundNo,mixedMatches.length);
    return mixedMatches.slice(0,MATCHES_PER_ROUND).map((match,index)=>{
      const kickoff=Number(startAt)+(offsets[index]||0);
      return {...match,kickoff,simStartedAt:kickoff,simDurationMs:MATCH_DURATION_MS,scheduleOffsetMinutes:Math.round((offsets[index]||0)/60000),scheduleGapMinutes:index?Math.round(((offsets[index]||0)-(offsets[index-1]||0))/60000):0,createdAt:new Date(kickoff).toISOString()};
    });
  }
  function mixFixtureOrder(fixtures,seed){
    const random=makeRandom(seed>>>0);
    const pending=fixtures.map(match=>({match,shuffle:random()}));
    const mixed=[];
    const initialByType=new Map();
    const usedByType=new Map();
    for(const item of pending){const type=item.match.competitionType||'national';initialByType.set(type,(initialByType.get(type)||0)+1);}
    while(pending.length){
      const last=mixed[mixed.length-1];
      // Mientras haya alternativas, evita que dos tarjetas de la misma competición queden pegadas.
      const differentType=last?pending.filter(item=>(item.match.competitionType||'national')!==last.competitionType):pending;
      const candidates=differentType.length?differentType:pending;
      const recent=mixed.slice(-6);
      const ranked=candidates.map(item=>{
        const match=item.match;
        const type=match.competitionType||'national';
        const sameCompetition=recent.filter(prev=>(prev.competitionType||'national')===type).length;
        const sameHomeCountry=recent.filter(prev=>prev.home.code===match.home.code).length;
        const sameAwayCountry=recent.filter(prev=>prev.away.code===match.away.code).length;
        const sameCountryUsage=recent.filter(prev=>prev.home.code===match.home.code||prev.away.code===match.home.code||prev.home.code===match.away.code||prev.away.code===match.away.code).length;
        // Equilibra las proporciones: no consume todas las copas pequeñas al principio ni deja los nacionales para el final.
        const ratio=(usedByType.get(type)||0)/Math.max(1,initialByType.get(type)||1);
        const immediateCountry=last&&(last.home.code===match.home.code||last.away.code===match.away.code||last.home.code===match.away.code||last.away.code===match.home.code)?1.4:0;
        const score=ratio*100+sameCompetition*1.25+sameHomeCountry*.35+sameAwayCountry*.35+sameCountryUsage*.2+immediateCountry*.35+item.shuffle*.5+random()*.35;
        return {item,score};
      }).sort((a,b)=>a.score-b.score);
      const chosen=ranked[0].item;
      mixed.push(chosen.match);
      pending.splice(pending.indexOf(chosen),1);
      const type=chosen.match.competitionType||'national';usedByType.set(type,(usedByType.get(type)||0)+1);
    }
    return mixed;
  }
  function outcomeFor(score){ return score.homeGoals>score.awayGoals?'home':score.homeGoals<score.awayGoals?'away':'draw'; }
  function statusFor(match, now=Date.now()){
    if(match.manualScore?.final)return {status:'final',phase:'final',minute:70,elapsed:100,manual:true};
    const base=Number(match.simStartedAt)||Number(match.kickoff)||now;
    const duration=Math.max(1000,Number(match.simDurationMs)||MATCH_DURATION_MS);
    const elapsedMs=now-base;
    const elapsed=(elapsedMs/duration)*100;
    if(elapsedMs<0)return {status:'upcoming',phase:'scheduled',minute:0,elapsed};
    const firstHalf=30*60*1000,breakEnd=40*60*1000;
    if(elapsedMs<firstHalf)return {status:'live',phase:'first-half',minute:Math.max(1,Math.min(30,Math.floor(elapsedMs/60000)+1)),elapsed};
    if(elapsedMs<breakEnd)return {status:'live',phase:'halftime',minute:30,elapsed};
    if(elapsedMs<duration)return {status:'live',phase:'second-half',minute:Math.max(41,Math.min(70,41+Math.floor((elapsedMs-breakEnd)/60000))),elapsed};
    return {status:'final',phase:'final',minute:70,elapsed};
  }
  function visibleScore(match, now=Date.now()){
    const st=statusFor(match,now);
    if(st.status==='upcoming')return {home:null,away:null,events:[],state:st};
    const minute=st.status==='final'?70:st.minute;
    const totals=scoreAtMinute(match,minute);
    const events=matchTimeline(match).filter(e=>Number(e.minute)<=minute).map(e=>({...e,displayType:eventDisplayType(e,minute)}));
    return {home:totals.homeGoals,away:totals.awayGoals,events,state:st};
  }
  function archiveMatch(match){
    const score=scoreForMatch(match);
    const timeline=matchTimeline(match).map(e=>({
      eventId:String(e.eventId||''),type:String(eventDisplayType(e,70)||e.type||''),
      minute:Math.max(0,Number(e.minute)||0),side:e.side==='away'?'away':'home',
      varOutcome:e.varOutcome||'',targetType:e.targetType||''
    }));
    const goalEvents=timeline.filter(e=>e.type==='goal');
    const margin=Math.abs(Number(score.homeGoals)-Number(score.awayGoals));
    const highlights=[];
    if(margin>=3)highlights.push('GOLEADA');
    if(goalEvents.some(e=>e.minute>=65))highlights.push('GOL AGÓNICO');
    if(timeline.some(e=>e.type==='red'))highlights.push('TARJETA ROJA');
    if(timeline.some(e=>e.type==='penalty-awarded'))highlights.push('PENAL');
    if(timeline.some(e=>e.type==='var-review'||e.type==='var-result'))highlights.push('VAR');
    if(!highlights.length)highlights.push(margin===0?'EMPATE':'PARTIDO CERRADO');
    const record={
      id:match.id,home:match.home.name,away:match.away.name,
      homeCode:match.home.code,awayCode:match.away.code,
      homeCountry:match.home.country,awayCountry:match.away.country,
      competition:match.competition,competitionType:match.competitionType||competitionMeta(match.competition).type,
      competitionId:match.competitionId||`${competitionMeta(match.competition).type}:${norm(match.competition)}`,
      kickoff:match.kickoff,homeGoals:score.homeGoals,awayGoals:score.awayGoals,
      outcome:outcomeFor(score),finishedAt:new Date(matchFinishAt(match)).toISOString(),
      matchEvents:timeline,highlights
    };
    const index=db.history.findIndex(h=>String(h.id)===String(record.id));
    if(index>=0)db.history[index]={...db.history[index],...record};else db.history.push(record);
    return record;
  }
  function profilePicks(profileId){
    if(!db.picks||typeof db.picks!=='object')db.picks={};
    if(!db.picks[profileId]||typeof db.picks[profileId]!=='object'||Array.isArray(db.picks[profileId]))db.picks[profileId]={};
    return db.picks[profileId];
  }
  function processMatchHistory(){
    for(const match of db.matches){if(statusFor(match).status==='final')archiveMatch(match);}
    const historyById=new Map((db.history||[]).map(h=>[String(h.id),h]));
    for(const [profileId,picks] of Object.entries(db.picks||{})){
      if(!picks||typeof picks!=='object'||Array.isArray(picks))continue;
      for(const [matchId,pick] of Object.entries(picks)){
        if(!pick||pick.resolved||!['home','draw','away'].includes(pick.outcome))continue;
        const match=db.matches.find(m=>String(m.id)===String(matchId));
        const archived=historyById.get(String(matchId));
        let actual='';
        if(match&&statusFor(match).status==='final')actual=outcomeFor(scoreForMatch(match));
        else if(archived)actual=archived.outcome||outcomeFor({homeGoals:archived.homeGoals,awayGoals:archived.awayGoals});
        if(!actual)continue;
        pick.resolved=true;pick.actual=actual;pick.correct=pick.outcome===actual;pick.resolvedAt=new Date().toISOString();
        if(pick.correct){db.profileXP[profileId]=Math.max(0,Number(db.profileXP[profileId])||0)+10;if(profileId===accountInfo().id)window.FoxcrakApp?.addXP?.(10,'Pronóstico APS acertado');}
      }
    }
    db.history=db.history.slice(-1200);
  }
  function scheduleSnapshot(now=Date.now()){
    let anchor=Number(db.scheduleAnchor)||0;
    if(!anchor)anchor=virtualScheduleAnchor(localDayKey());
    const dayKey=db.day||localDayKey(anchor),revision=Number(db.revision)||0;
    const roundNo=roundAtTime(anchor,now,dayKey,revision);
    return {anchor,roundNo,startAt:scheduledRoundStart(anchor,roundNo,dayKey,revision),dayKey};
  }
  function ensureDay(force=false){
    const now=Date.now();const schemaChanged=Number(db.schemaVersion||1)<12;
    if(schemaChanged){
      // Migración no destructiva: actualizar metadatos sin borrar partidos, resultados ni pronósticos guardados.
      db.tournaments=(Array.isArray(db.tournaments)?db.tournaments:[]).map(t=>{
        const key=norm(t.name);
        if(key.includes('libertadores'))return {...t,name:'CONMEBOL Libertadores · Simulada',kind:'libertadores'};
        if(key.includes('sudamericana'))return {...t,name:'CONMEBOL Sudamericana · Simulada',kind:'sudamericana'};
        return t;
      });
      db.schemaVersion=12;
    }
    if(!db.scheduleAnchor){
      // Una instalación sin jornada previa comienza ahora; una con partidos recupera su propia referencia.
      const firstSavedKickoff=Array.isArray(db.matches)&&db.matches.length?Number(db.matches[0].simStartedAt||db.matches[0].kickoff)||0:0;
      db.scheduleAnchor=firstSavedKickoff||((Array.isArray(db.matches)&&db.matches.length)?virtualScheduleAnchor(localDayKey(now)):now);
    }
    let anchor=Number(db.scheduleAnchor),dayKey=db.day||localDayKey(anchor);
    let desiredRound=roundAtTime(anchor,now,dayKey,Number(db.revision)||0);
    if(db.regatasBaseRound==null){db.regatasBaseRound=desiredRound;saveStore();}
    const hasStaleFixtures=Array.isArray(db.matches)&&db.matches.length>0&&db.matches.some(m=>Number(m.fixtureVersion)!==15);
    if(hasStaleFixtures&&db.day===dayKey&&!force){db.revision=Math.max(0,Number(db.revision)||0)+1;}
    const validMatches=Array.isArray(db.matches)&&db.matches.length===MATCHES_PER_ROUND&&db.matches.every(m=>Number(m.fixtureVersion)===15&&Number(m.simDurationMs)===MATCH_DURATION_MS&&Number(m.simStartedAt)===Number(m.kickoff)&&m.competitionType);
    const sameRound=db.day===dayKey&&Number(db.roundNo)===desiredRound&&validMatches;
    if(!force&&sameRound){processMatchHistory();if(schemaChanged||PAUSED_MS>0)saveStore();return;}
    const oldRound=Number.isFinite(Number(db.roundNo))?Number(db.roundNo):-1;
    if(!schemaChanged&&db.day===dayKey&&Array.isArray(db.matches)){
      for(const old of db.matches){if(statusFor(old,now).status==='final')archiveMatch(old);}
    }
    // Solo un comando explícito del panel Owner puede forzar una revisión; cargar o reiniciar la web no lo hace.
    if(force){db.revision=Math.max(0,Number(db.revision)||0)+1;desiredRound=roundAtTime(anchor,now,dayKey,db.revision);}
    // Completa rondas realmente transcurridas durante el funcionamiento normal, sin sortear de nuevo al recargar.
    const firstRound=schemaChanged?desiredRound:((db.day!==dayKey)?0:Math.max(0,oldRound+1));
    if(!force){for(let r=firstRound;r<desiredRound;r++){const past=generateDailyMatches(dayKey,db.revision,anchor,r);for(const match of past)archiveMatch(match);}}
    db.day=dayKey;db.roundNo=desiredRound;db.cycleStartedAt=scheduledRoundStart(anchor,desiredRound,dayKey,db.revision);db.scheduleAnchor=anchor;
    db.matches=generateDailyMatches(dayKey,db.revision,anchor,desiredRound);
    db.schemaVersion=12;processMatchHistory();saveStore();
    nextSimTickAt=Number(db.cycleStartedAt)+roundDurationMs(db.day,db.revision,db.roundNo);
  }
  function advanceRapidRound(){
    // Avanza al siguiente bloque de simulación cuando vence el reloj de esta jornada activa.
    // Si la página estuvo cerrada, su tiempo queda pausado y se retoma el mismo bloque al volver.
    ensureDay(false);
    render();
  }
  function profileStats(){
    const p=accountInfo(); const viewed=Object.keys(db.viewedMatches[p.id]||{}).length;
    const favorites=Array.isArray(db.favorites[p.id])?db.favorites[p.id].length:0;
    return {viewed,favorites,xp:Math.max(0,Number(db.profileXP[p.id])||0)};
  }
  function clubRankingRecords(now=Date.now()){
    // Combina el archivo histórico con los partidos actuales (en juego o finalizados), una sola vez por ID.
    // Los encuentros programados sin marcador todavía no alteran la tabla.
    const records=new Map();
    const asNumber=(...values)=>{
      for(const value of values){if(value===null||value===undefined||value==='')continue;const n=Number(value);if(Number.isFinite(n))return n;}
      return NaN;
    };
    for(const record of Array.isArray(db.history)?db.history:[]){
      if(!record||record.id==null)continue;
      const homeGoals=asNumber(record.homeGoals,record.homeScore,record.score?.home,record.scoreHome);
      const awayGoals=asNumber(record.awayGoals,record.awayScore,record.score?.away,record.scoreAway);
      if(!record.home||!record.away||!Number.isFinite(homeGoals)||!Number.isFinite(awayGoals))continue;
      records.set(String(record.id),{...record,homeGoals,awayGoals,isLive:false,matchEvents:Array.isArray(record.matchEvents)?record.matchEvents:[]});
    }
    for(const match of Array.isArray(db.matches)?db.matches:[]){
      if(!match?.id||!match.home?.name||!match.away?.name||records.has(String(match.id)))continue;
      const status=statusFor(match,now);
      if(status.status==='upcoming')continue;
      const score=status.status==='final'?scoreForMatch(match):visibleScore(match,now);
      const homeGoals=asNumber(status.status==='final'?score.homeGoals:score.home);
      const awayGoals=asNumber(status.status==='final'?score.awayGoals:score.away);
      if(!Number.isFinite(homeGoals)||!Number.isFinite(awayGoals))continue;
      records.set(String(match.id),{
        id:match.id,home:match.home.name,away:match.away.name,
        homeCode:match.home.code,awayCode:match.away.code,
        homeCountry:match.home.country,awayCountry:match.away.country,
        homeGoals,awayGoals,competition:match.competition,
        competitionType:match.competitionType,kickoff:match.kickoff,
        matchEvents:Array.isArray(score.events)?score.events:matchTimeline(match),
        isLive:status.status==='live'
      });
    }
    return [...records.values()];
  }
  function teamStandings(){
    const rows=new Map();
    function get(name,code,country,flag){
      const safeName=String(name||'').trim();if(!safeName)return null;
      const safeCode=String(code||'').toUpperCase();
      const key=`${safeCode}:${norm(safeName)}`;
      if(!rows.has(key))rows.set(key,{name:safeName,code:safeCode,country:country||'Sudamérica',flag:flag||countryFlag(safeCode),played:0,w:0,d:0,l:0,gf:0,ga:0,pts:0,livePlayed:0,homeWins:0,awayWins:0,homeGF:0,awayGF:0,bigWins:0,bestWinMargin:0,highScoring:0,penaltiesFor:0,yellowCards:0,redCards:0,cleanSheets:0,crestSource:countryCrestLink(safeCode)});
      return rows.get(key);
    }
    for(const team of allCatalogTeams())get(team.name,team.code,team.country,team.flag);
    for(const match of clubRankingRecords()){
      const hg=Number(match.homeGoals),ag=Number(match.awayGoals);
      if(!match.home||!match.away||!Number.isFinite(hg)||!Number.isFinite(ag))continue;
      const h=get(match.home,match.homeCode,match.homeCountry,match.homeFlag),a=get(match.away,match.awayCode,match.awayCountry,match.awayFlag);
      if(!h||!a)continue;
      h.played++;a.played++;h.gf+=hg;h.ga+=ag;a.gf+=ag;a.ga+=hg;h.homeGF+=hg;a.awayGF+=ag;
      if(match.isLive){h.livePlayed++;a.livePlayed++;}
      if(ag===0)h.cleanSheets++;if(hg===0)a.cleanSheets++;if(hg+ag>=3){h.highScoring++;a.highScoring++;}
      if(hg>ag){h.w++;h.homeWins++;h.pts+=3;h.bigWins+=(hg-ag)>=3?1:0;h.bestWinMargin=Math.max(h.bestWinMargin,hg-ag);a.l++;}else if(hg<ag){a.w++;a.awayWins++;a.pts+=3;a.bigWins+=(ag-hg)>=3?1:0;a.bestWinMargin=Math.max(a.bestWinMargin,ag-hg);h.l++;}else{h.d++;a.d++;h.pts++;a.pts++;}
      for(const event of Array.isArray(match.matchEvents)?match.matchEvents:[]){
        const kind=norm(event?.type||event?.displayType||'');const side=event?.side==='away'?'away':'home';
        const owner=side==='home'?h:a;
        if(kind.includes('penalty')&&(kind.includes('award')||kind==='penalty'))owner.penaltiesFor++;
        if(kind.includes('yellow'))owner.yellowCards++;
        if(kind.includes('red'))owner.redCards++;
      }
    }
    return [...rows.values()].sort((a,b)=>b.pts-a.pts||((b.gf-b.ga)-(a.gf-a.ga))||b.w-a.w||a.name.localeCompare(b.name,'es'));
  }
  function renderClubRanking(){
    const tbody=$('#clubRankingTableBody');if(!tbody)return;
    const country=$('#clubRankingCountry')?.value||'ALL';
    const metric=$('#clubRankingMetric')?.value||'pts';
    const allRows=teamStandings();
    let rows=allRows.filter(row=>country==='ALL'||row.code===country);
    const tie=(a,b)=>b.pts-a.pts||((b.gf-b.ga)-(a.gf-a.ga))||b.w-a.w||b.gf-a.gf||a.name.localeCompare(b.name,'es');
    const winRate=row=>row.played?row.w/row.played:0;
    const ppm=row=>row.played?row.pts/row.played:0;
    const avgGoals=row=>row.played?row.gf/row.played:0;
    const avgAgainst=row=>row.played?row.ga/row.played:0;
    const cleanRate=row=>row.played?row.cleanSheets/row.played:0;
    const sorters={
      pts:(a,b)=>b.pts-a.pts,
      goals:(a,b)=>b.gf-a.gf,
      goalsAgainst:(a,b)=>a.ga-b.ga,
      wins:(a,b)=>b.w-a.w,
      draws:(a,b)=>b.d-a.d,
      losses:(a,b)=>b.l-a.l,
      gd:(a,b)=>(b.gf-b.ga)-(a.gf-a.ga),
      winrate:(a,b)=>winRate(b)-winRate(a),
      played:(a,b)=>b.played-a.played,
      ppm:(a,b)=>ppm(b)-ppm(a),
      avgGoals:(a,b)=>avgGoals(b)-avgGoals(a),
      avgAgainst:(a,b)=>avgAgainst(a)-avgAgainst(b),
      clean:(a,b)=>b.cleanSheets-a.cleanSheets,
      cleanRate:(a,b)=>cleanRate(b)-cleanRate(a),
      homeWins:(a,b)=>b.homeWins-a.homeWins,
      awayWins:(a,b)=>b.awayWins-a.awayWins,
      homeGoals:(a,b)=>b.homeGF-a.homeGF,
      awayGoals:(a,b)=>b.awayGF-a.awayGF,
      bigWins:(a,b)=>b.bigWins-a.bigWins,
      bigMargin:(a,b)=>b.bestWinMargin-a.bestWinMargin,
      highScoring:(a,b)=>b.highScoring-a.highScoring,
      penalties:(a,b)=>b.penaltiesFor-a.penaltiesFor,
      yellow:(a,b)=>b.yellowCards-a.yellowCards,
      red:(a,b)=>b.redCards-a.redCards
    };
    const metricSorter=sorters[metric]||sorters.pts;
    rows.sort((a,b)=>((a.played>0?0:1)-(b.played>0?0:1))||metricSorter(a,b)||tie(a,b));

    const sourceRecords=clubRankingRecords();
    const records=sourceRecords.filter(record=>country==='ALL'||String(record.homeCode||'').toUpperCase()===country||String(record.awayCode||'').toUpperCase()===country);
    const goals=records.reduce((sum,record)=>sum+(Number(record.homeGoals)||0)+(Number(record.awayGoals)||0),0);
    const clubsEl=$('#clubRankingSummaryClubs');if(clubsEl)clubsEl.textContent=String(rows.length);
    const matchesEl=$('#clubRankingSummaryMatches');if(matchesEl)matchesEl.textContent=String(records.length);
    const matchesNote=$('#clubRankingSummaryMatchesNote');if(matchesNote)matchesNote.textContent=`${records.filter(r=>r.isLive).length} en curso · el resto en historial`;
    const goalsEl=$('#clubRankingSummaryGoals');if(goalsEl)goalsEl.textContent=String(goals);
    const leaderboard=rows.filter(r=>r.played>0).slice().sort(tie);
    const leaderEl=$('#clubRankingSummaryLeader');if(leaderEl)leaderEl.textContent=leaderboard[0]?.name?.toLocaleUpperCase('es')||'SIN RESULTADOS';
    const leaderNote=$('#clubRankingSummaryLeaderNote');if(leaderNote)leaderNote.textContent=leaderboard[0]?`${leaderboard[0].pts} PTS · DG ${leaderboard[0].gf-leaderboard[0].ga>0?'+':''}${leaderboard[0].gf-leaderboard[0].ga}`:'Aparecerá al generarse el primer marcador';
    const count=$('#clubRankingCount');if(count)count.textContent=`${rows.length} CLUBES · ${records.length} PARTIDOS CON DATOS`;
    const metricLabels={pts:'puntos',goals:'goles a favor',goalsAgainst:'menos goles en contra',wins:'victorias',draws:'empates',losses:'derrotas',gd:'diferencia de goles',winrate:'porcentaje de victorias',played:'partidos jugados',ppm:'puntos por partido',avgGoals:'promedio de goles a favor',avgAgainst:'promedio de goles en contra',clean:'vallas invictas',cleanRate:'porcentaje de vallas invictas',homeWins:'victorias como local',awayWins:'victorias como visitante',homeGoals:'goles como local',awayGoals:'goles como visitante',bigWins:'goleadas a favor',bigMargin:'mayor margen de victoria',highScoring:'partidos de 3+ goles',penalties:'penales a favor',yellow:'tarjetas amarillas',red:'tarjetas rojas'};
    const metricValue=row=>({pts:row.pts,goals:row.gf,goalsAgainst:row.ga,wins:row.w,draws:row.d,losses:row.l,gd:row.gf-row.ga,winrate:winRate(row)*100,played:row.played,ppm:ppm(row),avgGoals:avgGoals(row),avgAgainst:avgAgainst(row),clean:row.cleanSheets,cleanRate:cleanRate(row)*100,homeWins:row.homeWins,awayWins:row.awayWins,homeGoals:row.homeGF,awayGoals:row.awayGF,bigWins:row.bigWins,bigMargin:row.bestWinMargin,highScoring:row.highScoring,penalties:row.penaltiesFor,yellow:row.yellowCards,red:row.redCards}[metric]??row.pts);
    const showMetric=row=>['winrate','cleanRate'].includes(metric)?`${Math.round(metricValue(row))}%`:['ppm','avgGoals','avgAgainst'].includes(metric)?metricValue(row).toFixed(2).replace('.',','):String(metricValue(row));
    const subtitle=$('#clubRankingSubtitle');if(subtitle)subtitle.textContent=`Top por ${metricLabels[metric]||'puntos'} · ${records.filter(r=>r.isLive).length} partidos en curso incluidos de forma provisional.`;
    tbody.innerHTML=rows.length?rows.map((team,index)=>{
      const rate=team.played?`${Math.round(team.w/team.played*100)}%`:'—';
      const liveMark=team.livePlayed?`<small class="club-ranking-live-note">${team.livePlayed} EN CURSO</small>`:'';
      return `<tr class="${team.livePlayed?'club-ranking-row-live':''}"><td>${String(index+1).padStart(2,'0')}</td><td class="club-ranking-metric-value"><strong>${esc(showMetric(team))}</strong></td><td class="sim-standings-team"><span class="sim-rank-flag">${esc(team.flag||countryFlag(team.code))}</span><span><strong>${esc(team.name.toLocaleUpperCase('es'))}</strong><small class="sim-table-country">${esc(team.country||'Sudamérica')}</small>${liveMark}</span></td><td>${esc(team.country||'—')}</td><td>${team.played}</td><td>${team.w}</td><td>${team.d}</td><td>${team.l}</td><td>${team.gf}</td><td>${team.ga}</td><td>${team.gf-team.ga>0?'+':''}${team.gf-team.ga}</td><td><strong>${team.pts}</strong></td><td>${rate}</td></tr>`;
    }).join(''):'<tr><td colspan="13" class="ranking-empty-state">No hay clubes en el catálogo disponible. Recarga los datos de clubes e inténtalo de nuevo.</td></tr>';
  }
  function formatHomeTime(match){return fixtureTime(match,match.homeTimezone);}
  function badgeLogo(team,cls='sim-logo'){
    const initials=team.name.split(/\s+/).filter(Boolean).map(s=>s[0]).join('').slice(0,3).toUpperCase();
    const urls=logoCandidates(team);
    const isCustom=!!validLogoURL(team.logoUrl||'');
    return `<span class="${cls}" data-sim-logo-wrap="${esc(team.name)}"><span class="sim-logo-fallback">${esc(initials)}</span><img data-sim-logo="${esc(team.name)}" data-sim-urls="${esc(JSON.stringify(urls))}" data-sim-country="${esc(team.country||'')}" data-sim-club="${esc(team.name)}" alt="Escudo de ${esc(team.name)}" loading="eager" decoding="async" hidden></span>`;
  }
  function crestSourceLabel(team){
    const url=team.crestSource || countryCrestLink(team.code);
    return `<a class="sim-crest-source" href="${esc(url)}" target="_blank" rel="noopener noreferrer" title="Fuente de escudos: Paladar Negro Escudoteca">${esc(team.flag||countryFlag(team.code))} ${esc(team.country)} · ESCUDOS ↗</a>`;
  }
  function matchStatusText(st){if(st.status==='upcoming')return 'PROGRAMADO';if(st.phase==='halftime')return 'DESCANSO · 30′ · 10 MIN';if(st.status==='live')return `${st.phase==='second-half'?'2.º TIEMPO':'1.er TIEMPO'} · ${st.minute}′`;return 'FINAL SIMULADO · 70′';}
  function mmss(ms){const seconds=Math.max(0,Math.floor(Number(ms||0)/1000));return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;}
  function matchFinishAt(match){
    if(match.manualScore?.final){
      const manualAt=Number(match.manualScore.finalAt)||Date.parse(match.manualScore.finalAt||'');
      if(Number.isFinite(manualAt)&&manualAt>0)return manualAt;
    }
    return (Number(match.simStartedAt)||Number(match.kickoff)||Date.now())+(Number(match.simDurationMs)||MATCH_DURATION_MS);
  }
  const FINAL_CARD_GRACE_MS=3*60*1000;
  function shouldShowMatchCard(match,now=Date.now()){
    return statusFor(match,now).status!=='final'||now<matchFinishAt(match)+FINAL_CARD_GRACE_MS;
  }
  let supplementalMatches=new Map();
  function findAnyMatch(id){return db.matches.find(m=>String(m.id)===String(id))||supplementalMatches.get(String(id))||null;}
  function getUpcomingQueue(){
    const anchor=Number(db.scheduleAnchor)||virtualScheduleAnchor(db.day||localDayKey());
    const nextRound=(Number(db.roundNo)||0)+1;
    return generateDailyMatches(db.day||localDayKey(),Number(db.revision)||0,anchor,nextRound).sort((a,b)=>a.kickoff-b.kickoff);
  }
  function matchesForBoard(filter='ALL',now=Date.now(),fillSlots=true,exactCompetition='ALL'){
    const active=db.matches.filter(m=>shouldShowMatchCard(m,now)).sort((a,b)=>a.kickoff-b.kickoff);
    const typeMatches=m=>filter==='ALL'||m.competitionType===filter||(filter==='national'&&m.competitionType==='national')||(m.competition===filter);
    const exactMatches=m=>exactCompetition==='ALL'||m.competition===exactCompetition;
    const matches=active.filter(m=>typeMatches(m)&&exactMatches(m));
    const allQueue=getUpcomingQueue();
    const queue=allQueue.filter(m=>typeMatches(m)&&exactMatches(m));
    supplementalMatches=new Map(allQueue.map(m=>[String(m.id),m]));
    if(!fillSlots)return matches;
    const picked=[...matches];
    if(matches.length<MATCHES_PER_ROUND){
      for(const m of queue){if(picked.length>=MATCHES_PER_ROUND)break;if(!picked.some(x=>x.id===m.id))picked.push(m);}
    }
    return picked.sort((a,b)=>a.kickoff-b.kickoff);
  }
  function matchClockText(match,now=Date.now()){
    const start=Number(match.simStartedAt)||Number(match.kickoff)||now;
    const elapsed=Math.max(0,now-start);
    if(now<start)return `INICIA EN ${countdownText(Math.ceil((start-now)/1000))}`;
    if(match.manualScore?.final||elapsed>=MATCH_DURATION_MS)return 'FINAL SIMULADO · 70:00';
    if(elapsed<30*60*1000)return `1T ${mmss(elapsed)} / 30:00`;
    if(elapsed<40*60*1000)return `DESCANSO ${mmss(elapsed-30*60*1000)} / 10:00`;
    return `2T ${mmss(elapsed-40*60*1000)} / 30:00`;
  }
  function matchRemainingText(match,now=Date.now()){
    const start=Number(match.simStartedAt)||Number(match.kickoff)||now;
    const elapsed=now-start;
    const st=statusFor(match,now);
    if(st.status==='upcoming')return `INICIA EN ${countdownText(Math.ceil(Math.max(0,start-now)/1000))}`;
    if(st.status==='final'){
      const left=Math.max(0,Math.ceil((matchFinishAt(match)+FINAL_CARD_GRACE_MS-now)/1000));
      return left>0?`SE RETIRA ${countdownText(left)}`:'FINALIZADO';
    }
    if(elapsed<30*60*1000)return `1T · ${countdownText(Math.ceil((30*60*1000-elapsed)/1000))}`;
    if(elapsed<40*60*1000)return `PAUSA · ${countdownText(Math.ceil((40*60*1000-elapsed)/1000))}`;
    return `2T · ${countdownText(Math.ceil((MATCH_DURATION_MS-elapsed)/1000))}`;
  }
  function matchCard(match){
    const score=visibleScore(match),account=accountInfo();
    const hs=score.home==null?'—':score.home,as=score.away==null?'—':score.away;
    const followed = new Set(Array.isArray(db.favorites[account.id])?db.favorites[account.id]:[]);
    const fav = followed.has(match.home.id)||followed.has(match.away.id);
    const phaseClass=`phase-${score.state.phase||'scheduled'}`,statusClass=`status-${score.state.status||'upcoming'}`;
    const resultLabel=matchClockText(match);
    const competitionLabel=competitionDisplayLabel(match);
    const intensityLevel=intensityLevelFor(match),intensityName=intensityProfile(intensityLevel).label;
    return `<article class="sim-match-card ${esc(match.competitionClass||competitionMeta(match.competitionType||match.competition).className)} ${phaseClass} ${statusClass}" data-competition-kind="${esc(match.competitionType||competitionMeta(match.competition).type)}" data-sim-card="${esc(match.id)}"><div class="sim-card-top"><span class="sim-league">${esc(competitionLabel)}</span><span class="sim-state ${score.state.status} ${score.state.phase==='halftime'?'halftime':''}">${matchStatusText(score.state)}</span></div><div class="sim-match-middle"><div class="sim-side">${badgeLogo(match.home)}<strong>${esc(match.home.name.toLocaleUpperCase('es'))}</strong><small class="sim-team-country">${esc(match.home.flag||countryFlag(match.home.code))} ${esc(match.home.country)}</small><small>${crestSourceLabel(match.home)}</small></div><div class="sim-result ${phaseClass} ${statusClass}"><strong class="sim-scoreline">${hs} <i>:</i> ${as}</strong><small>${esc(resultLabel)}</small></div><div class="sim-side">${badgeLogo(match.away)}<strong>${esc(match.away.name.toLocaleUpperCase('es'))}</strong><small class="sim-team-country">${esc(match.away.flag||countryFlag(match.away.code))} ${esc(match.away.country)}</small><small>${crestSourceLabel(match.away)}</small></div></div><div class="sim-card-bottom"><span>${fav?'★ SIGUIENDO · ':''}${esc(match.home.country)} · HORA LOCAL <b>${esc(formatHomeTime(match))}</b><small>Perú ${esc(timeInPeru(match))}</small></span><div class="sim-open-actions"><span class="sim-match-countdown" data-match-countdown="${esc(match.id)}">${esc(matchRemainingText(match))}</span><span class="sim-intensity-square" data-intensity-level="${intensityLevel}" aria-hidden="true"></span><button class="sim-open-btn" data-open-sim="${esc(match.id)}">VER PARTIDO <b>↗</b></button></div></div></article>`;
  }

  let lastCompetitionBoardRefreshAt=Date.now();
  let lastCompetitionBoardSignature='';
  let lastScheduleSignature='';
  function competitionFilterMatches(list,filter){
    if(!filter||filter==='ALL')return list;
    if(filter==='national')return list.filter(m=>(m.competitionType||competitionMeta(m.competition).type)==='national');
    return list.filter(m=>(m.competitionType||competitionMeta(m.competition).type)===filter);
  }
  function renderCompetitionLiveBoard(){
    const currentNode=$('#competitionLiveMatches');
    const upcomingNode=$('#competitionUpcomingMatches');
    if(!currentNode&&!upcomingNode)return;
    const filter=$('#competitionLiveFilter')?.value||'ALL';
    const current=matchesForBoard(filter,Date.now(),true).sort((a,b)=>a.kickoff-b.kickoff);
    const upcomingQueue=getUpcomingQueue();
    const nextFiltered=competitionFilterMatches(upcomingQueue,filter);
    const next=nextFiltered.slice(0,16);
    const signature=`${filter}|${current.map(m=>`${m.id}:${m.home.name}:${m.away.name}:${m.kickoff}`).join('|')}|NEXT|${next.map(m=>`${m.id}:${m.home.name}:${m.away.name}:${m.kickoff}`).join('|')}`;
    if(signature!==lastCompetitionBoardSignature){
      lastCompetitionBoardSignature=signature;
      if(currentNode){currentNode.innerHTML=current.length?current.map(matchCard).join(''):'<div class="sim-empty">No hay partidos para esta categoría.</div>';hydrateLogos(currentNode);}
      if(upcomingNode){upcomingNode.innerHTML=next.length?next.map((m,i)=>`<article class="competition-next-match ${esc(m.competitionClass||competitionMeta(m.competitionType).className)}"><span class="competition-next-number">${String(i+1).padStart(2,'0')}</span><span class="competition-next-copy"><small>${esc(competitionDisplayLabel(m))} · ${esc(m.home.country)}</small><strong>${esc(m.home.name)} <i>vs</i> ${esc(m.away.name)}</strong><small>HORA PERÚ ${esc(timeInPeru(m))} · SIGUIENTE CICLO</small></span><b class="competition-next-time">${esc(formatHomeTime(m))}</b></article>`).join(''):'<div class="sim-empty">No hay próximos partidos en esta categoría.</div>';}
    }else if(currentNode){updateVisibleMatchCards(currentNode);}
    const active=current.filter(m=>statusFor(m).status==='live').length;
    const final=current.filter(m=>statusFor(m).status==='final').length;
    const phase=$('#competitionLivePhaseLabel');if(phase)phase.textContent=active?`${active} PARTIDOS EN JUEGO · ${final} FINALIZADOS`:`${final} FINALIZADOS · PRÓXIMA JORNADA PREPARADA`;
    lastCompetitionBoardRefreshAt=Date.now();
    const updated=$('#competitionLiveUpdated');if(updated)updated.textContent=`ACTUALIZADO ${new Intl.DateTimeFormat('es-PE',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date())} · ACTUALIZA EN 00:30`;
  }
  function renderHome(){
    const grid=$('#homeLiveList'); if(!grid)return;
    const now=Date.now(); const upcoming=[...db.matches].sort((a,b)=>Math.abs(a.kickoff-now)-Math.abs(b.kickoff-now)).slice(0,3);
    grid.innerHTML=upcoming.length?upcoming.map(m=>`<button class="sim-home-row" data-open-sim="${esc(m.id)}"><span class="sim-home-time">${esc(formatHomeTime(m))}</span><span>${esc(m.home.name)} <b>vs</b> ${esc(m.away.name)}</span><small>SIMULADO</small></button>`).join(''):'<p class="empty-state">Generando jornada APS…</p>';
  }
  function renderUpcomingRoundPreview(){
    const node=$('#simUpcomingList');if(!node)return;
    const anchor=Number(db.scheduleAnchor)||virtualScheduleAnchor(db.day||localDayKey());
    const nextRound=(Number(db.roundNo)||0)+1;
    const matches=generateDailyMatches(db.day||localDayKey(),Number(db.revision)||0,anchor,nextRound).sort((a,b)=>a.kickoff-b.kickoff);
    const summary=$('#simUpcomingSummary');
    if(summary&&matches.length){
      const left=Math.max(0,Math.ceil((matches[0].kickoff-Date.now())/1000));
      summary.textContent=`${matches.length} PARTIDOS · PRIMER INICIO EN ${countdownText(left)} · nuevos inicios cada 5 minutos.`;
    }
    node.innerHTML=matches.length?matches.map((match,index)=>`<article class="sim-upcoming-row ${esc(match.competitionClass||competitionMeta(match.competitionType||match.competition).className)}"><span class="sim-upcoming-index">${String(index+1).padStart(2,'0')}</span><span class="sim-upcoming-time">${esc(timeInPeru(match))}</span><span class="sim-upcoming-teams"><small>${esc(competitionDisplayLabel(match))} · ${esc(match.home.country)}</small><strong>${esc(match.home.name)} <i>vs</i> ${esc(match.away.name)}</strong></span><span class="sim-upcoming-count">${esc(matchClockText(match))}</span></article>`).join(''):'<div class="sim-empty">La siguiente jornada aparecerá cuando haya clubes disponibles.</div>';
  }
  function competitionTypeFilterValue(value){
    if(!value||value==='ALL')return 'ALL';
    const match=db.matches.find(m=>m.competition===value)||[...supplementalMatches.values()].find(m=>m.competition===value);
    return match?(match.competitionType||competitionMeta(match.competition).type):value;
  }
  function renderSchedule(){
    const grid=$('#simScheduleGrid'); if(!grid)return;
    const filter=$('#simCompetitionFilter')?.value||'ALL';
    const status=$('#simStatusFilter')?.value||'ALL';
    const search=norm($('#simSearch')?.value||'');
    const boardMatches=matchesForBoard(filter==='ALL'?'ALL':competitionTypeFilterValue(filter),Date.now(),status==='ALL'||status==='upcoming',filter);
    const visible=boardMatches.filter(m=>{
      const st=statusFor(m).status; const byStatus=status==='ALL'||status===st;
      const byComp=filter==='ALL'||m.competition===filter;
      const bySearch=!search||norm(`${m.home.name} ${m.away.name} ${m.home.country} ${m.away.country} ${m.competition}`).includes(search);
      return byStatus&&byComp&&bySearch;
    }).sort((a,b)=>a.kickoff-b.kickoff);
    const account=accountInfo();
    const followed=new Set(Array.isArray(db.favorites[account.id])?db.favorites[account.id]:[]);
    const signature=`${filter}|${status}|${search}|${visible.map(m=>`${m.id}:${m.home.name}:${m.away.name}:${m.kickoff}:${m.competition}:${followed.has(m.home.id)||followed.has(m.away.id)}`).join('|')}`;
    if(signature===lastScheduleSignature){updateVisibleMatchCards(grid);return;}
    lastScheduleSignature=signature;
    grid.innerHTML=visible.map(matchCard).join('')||'<div class="sim-empty">No hay encuentros con esos filtros. Prueba otra categoría.</div>';
    hydrateLogos(grid);
  }
  function renderStandings(){
    const tbody=$('#simStandingsBody'); if(!tbody)return;
    const metric=$('#simStandingsMetric')?.value||'pts';
    const all=teamStandings().sort((a,b)=>metric==='goals'?(b.gf-a.gf)||(b.pts-a.pts)||(b.w-a.w):metric==='wins'?(b.w-a.w)||(b.pts-a.pts)||((b.gf-b.ga)-(a.gf-a.ga)):(b.pts-a.pts)||((b.gf-b.ga)-(a.gf-a.ga))||(b.w-a.w)||a.name.localeCompare(b.name,'es'));
    tbody.innerHTML=all.length?all.map((t,i)=>`<tr><td>${String(i+1).padStart(2,'0')}</td><td class="sim-standings-team">${badgeLogo(t,'sim-logo sim-logo-small')}<span><strong>${esc(t.name)}</strong><small class="sim-table-country">${esc(countryFlag(t.code))} ${esc(t.country||'Sudamérica')} · <a href="${esc(countryCrestLink(t.code))}" target="_blank" rel="noopener noreferrer">ESCUDOTECA ↗</a></small></span></td><td>${t.played}</td><td>${t.w}</td><td>${t.d}</td><td>${t.l}</td><td>${t.gf}:${t.ga}</td><td><strong>${t.pts}</strong></td></tr>`).join(''):'<tr><td colspan="8">La tabla histórica se llena al terminar partidos simulados.</td></tr>';
    const stat=profileStats();
    $('#simPersonalStats') && ($('#simPersonalStats').innerHTML=`<div><small>PARTIDOS VISTOS</small><strong>${stat.viewed}</strong></div><div><small>CLUBES SEGUIDOS</small><strong>${stat.favorites}</strong></div><div><small>CLUBES EN CATÁLOGO</small><strong>${allCatalogTeams().length}</strong></div><div><small>TORNEOS APS</small><strong>${tournaments().length}</strong></div>`);
    const xpNode=$('#simPredictionXP'); if(xpNode)xpNode.textContent=fmt(stat.xp);
  }
  let matchRegistryPage = 0;
  const MATCH_REGISTRY_PAGE_SIZE = 20;
  let lastMatchRegistrySignature = '';
  function registryDateTime(value){
    const n=typeof value==='number'?value:Date.parse(value||'');
    if(!Number.isFinite(n))return '—';
    return new Intl.DateTimeFormat('es-PE',{
      timeZone:'America/Lima',day:'2-digit',month:'2-digit',year:'numeric',
      hour:'2-digit',minute:'2-digit',hour12:false
    }).format(new Date(n));
  }
  function registryBadge(record){
    const labels=Array.isArray(record.highlights)?record.highlights:[];
    return labels.slice(0,2).map(label=>`<span class="played-result-tag ${label==='GOLEADA'?'tag-blowout':label==='GOL AGÓNICO'?'tag-late-goal':label==='TARJETA ROJA'?'tag-red-card':'tag-neutral'}">${esc(label)}</span>`).join('');
  }
  function renderMatchRegistry(force=false){
    const tbody=$('#playedMatchTableBody');
    if(!tbody)return;
    const search=norm($('#playedMatchSearch')?.value||'');
    const competition=$('#playedMatchCompetition')?.value||'ALL';
    const byId=new Map();
    for(const record of db.history||[])byId.set(String(record.id),record);
    // Salvaguarda: los partidos finalizados se reflejan aunque el refresco de 30 s no haya llegado todavía.
    for(const match of db.matches||[]){
      if(statusFor(match).status==='final'&&!byId.has(String(match.id))){
        const record=archiveMatch(match);
        byId.set(String(record.id),record);
      }
    }
    const records=[...byId.values()].filter(r=>{
      const type=r.competitionType||competitionMeta(r.competition).type;
      const byCompetition=competition==='ALL'||type===competition;
      const haystack=norm(`${r.home} ${r.away} ${r.competition} ${r.homeCountry} ${r.awayCountry} ${(r.highlights||[]).join(' ')}`);
      return byCompetition&&(!search||haystack.includes(search));
    }).sort((a,b)=>(Date.parse(b.finishedAt||'')||Number(b.kickoff)||0)-(Date.parse(a.finishedAt||'')||Number(a.kickoff)||0));
    const pages=Math.max(1,Math.ceil(records.length/MATCH_REGISTRY_PAGE_SIZE));
    matchRegistryPage=Math.max(0,Math.min(matchRegistryPage,pages-1));
    const signature=JSON.stringify({search,competition,page:matchRegistryPage,records:records.map(r=>[r.id,r.homeGoals,r.awayGoals,r.finishedAt])});
    if(!force&&signature===lastMatchRegistrySignature)return;
    lastMatchRegistrySignature=signature;
    const pageRows=records.slice(matchRegistryPage*MATCH_REGISTRY_PAGE_SIZE,(matchRegistryPage+1)*MATCH_REGISTRY_PAGE_SIZE);
    tbody.innerHTML=pageRows.length?pageRows.map(r=>{
      const hg=Number(r.homeGoals)||0,ag=Number(r.awayGoals)||0;
      const resultClass=Math.abs(hg-ag)>=3?'played-score blowout-score':'played-score';
      const tags=registryBadge(r);
      return `<tr data-played-record="${esc(r.id)}">
        <td><time>${esc(registryDateTime(r.kickoff||r.finishedAt))}</time></td>
        <td><strong>${esc(r.competition||'Simulador APS')}</strong><small class="played-competition-type">${esc(String(r.competitionType||'').toUpperCase())}</small></td>
        <td><strong class="played-club-name">${esc(String(r.home||'').toLocaleUpperCase('es'))}</strong><small>${esc(r.homeCountry||'')}</small></td>
        <td><strong class="${resultClass}">${hg} : ${ag}</strong><div class="played-result-tags">${tags}</div></td>
        <td><strong class="played-club-name">${esc(String(r.away||'').toLocaleUpperCase('es'))}</strong><small>${esc(r.awayCountry||'')}</small></td>
        <td><span class="played-final-status">FINALIZADO</span></td>
      </tr>`;
    }).join(''):'<tr><td colspan="6" class="played-registry-empty">Todavía no hay partidos finalizados que coincidan con estos filtros.</td></tr>';
    const count=$('#playedMatchCount');if(count)count.textContent=`${records.length} PARTIDOS`;
    const summary=$('#playedMatchSummary');if(summary)summary.textContent=records.length?`${records.length} encuentros archivados · Se guardan al finalizar, sin duplicar partidos.`:'El historial se rellenará automáticamente al finalizar los primeros encuentros.';
    const pageLabel=$('#playedMatchPageLabel');if(pageLabel)pageLabel.textContent=`PÁGINA ${matchRegistryPage+1} / ${pages}`;
    const prev=$('#playedMatchPrev');if(prev)prev.disabled=matchRegistryPage<=0;
    const next=$('#playedMatchNext');if(next)next.disabled=matchRegistryPage>=pages-1;
    // Actualiza también los contadores de clubes después de archivar un resultado.
  }
  function syncNewFinalResults(now=Date.now()){
    const known=new Set((db.history||[]).map(r=>String(r.id)));
    const hasNewFinal=(db.matches||[]).some(m=>statusFor(m,now).status==='final'&&!known.has(String(m.id)));
    if(!hasNewFinal)return false;
    processMatchHistory();
    saveStore();
    lastMatchRegistrySignature='';
    renderMatchRegistry(true);
    renderStandings();
    renderCompetitionRankings();
    return true;
  }
  function competitionRankRecords(){
    const map=new Map();
    for(const r of db.history||[])map.set(String(r.id),r);
    for(const m of db.matches||[]){
      if(statusFor(m).status!=='final')continue;
      const sc=scoreForMatch(m);
      map.set(String(m.id),{id:m.id,home:m.home.name,away:m.away.name,homeCode:m.home.code,awayCode:m.away.code,homeCountry:m.home.country,awayCountry:m.away.country,competition:m.competition,competitionType:m.competitionType||competitionMeta(m.competition).type,homeGoals:sc.homeGoals,awayGoals:sc.awayGoals,kickoff:m.kickoff,outcome:outcomeFor(sc)});
    }
    return [...map.values()];
  }
  function selectedCompetitionType(filter){
    if(['libertadores','sudamericana','interliga'].includes(filter))return filter;
    return '';
  }
  function competitionStandings(filter='ALL'){
    const rows=new Map();
    const get=(name,code,country)=>{
      const key=`${code||''}:${norm(name)}`;
      if(!rows.has(key))rows.set(key,{name,code,country,flag:countryFlag(code),played:0,w:0,d:0,l:0,gf:0,ga:0,pts:0});
      return rows.get(key);
    };
    const filtered=(record)=>{
      const type=record.competitionType||competitionMeta(record.competition).type;
      if(filter==='ALL')return true;
      if(['libertadores','sudamericana','interliga'].includes(filter))return type===filter;
      return type==='national'&&String(record.competition)===filter;
    };
    for(const match of db.matches||[]){if(!filtered(match))continue;get(match.home.name,match.home.code,match.home.country);get(match.away.name,match.away.code,match.away.country);}
    const records=competitionRankRecords().filter(filtered);
    for(const match of records){
      const h=get(match.home,match.homeCode,match.homeCountry),a=get(match.away,match.awayCode,match.awayCountry);
      h.played++;a.played++;h.gf+=Number(match.homeGoals)||0;h.ga+=Number(match.awayGoals)||0;a.gf+=Number(match.awayGoals)||0;a.ga+=Number(match.homeGoals)||0;
      if(match.homeGoals>match.awayGoals){h.w++;h.pts+=3;a.l++;}else if(match.homeGoals<match.awayGoals){a.w++;a.pts+=3;h.l++;}else{h.d++;a.d++;h.pts++;a.pts++;}
    }
    return [...rows.values()].sort((a,b)=>b.pts-a.pts||((b.gf-b.ga)-(a.gf-a.ga))||b.gf-a.gf||b.w-a.w||a.name.localeCompare(b.name,'es'));
  }
  function renderCompetitionRankings(){
    const select=$('#simCompetitionRankFilter'),tbody=$('#simCompetitionRankBody'),panel=$('#simCompetitionRankPanel');
    if(!select||!tbody)return;
    const old=select.value;
    const options=[{value:'ALL',label:'TODAS LAS COMPETICIONES'},
      {value:'libertadores',label:'CONMEBOL LIBERTADORES'},
      {value:'sudamericana',label:'CONMEBOL SUDAMERICANA'},
      {value:'interliga',label:'INTERLIGA APS'},
      ...(catalog().countries||[]).filter(c=>PRIMARY_LEAGUE_CODES.includes(c.code)).map(c=>({value:c.league,label:`${c.flag||countryFlag(c.code)} ${c.league}`}))];
    select.innerHTML=options.map(o=>`<option value="${esc(o.value)}">${esc(o.label)}</option>`).join('');
    if(options.some(o=>o.value===old))select.value=old;
    const filter=select.value||'ALL';
    const type=selectedCompetitionType(filter)||(filter==='ALL'?'all':'national');
    if(panel)panel.dataset.competitionType=type;
    const rows=competitionStandings(filter);
    tbody.innerHTML=rows.length?rows.map((t,i)=>`<tr><td>${String(i+1).padStart(2,'0')}</td><td class="sim-standings-team"><span class="sim-rank-flag">${esc(t.flag||countryFlag(t.code))}</span><span><strong>${esc(t.name)}</strong><small class="sim-table-country">${esc(t.country||'Sudamérica')}</small></span></td><td>${t.played}</td><td>${t.w}</td><td>${t.d}</td><td>${t.l}</td><td>${t.gf}:${t.ga}</td><td><strong>${t.pts}</strong></td></tr>`).join(''):'<tr><td colspan="8">Esta competición todavía no tiene partidos finalizados.</td></tr>';
    const title=$('#simCompetitionRankTitle');if(title)title.textContent=filter==='ALL'?'Ranking histórico general':options.find(o=>o.value===filter)?.label||filter;
    const count=$('#simCompetitionRankCount');if(count)count.textContent=`${rows.length} clubes · actualizado al finalizar cada partido`;
  }
  function localDateTimeValue(timestamp){
    const date=new Date(timestamp); if(Number.isNaN(date.getTime()))return '';
    const local=new Date(date.getTime()-date.getTimezoneOffset()*60000);
    return local.toISOString().slice(0,16);
  }
  function populateSelect(select, options, placeholder, preserve=true){
    if(!select)return; const old=preserve?select.value:'';
    select.innerHTML=(placeholder?`<option value="">${esc(placeholder)}</option>`:'')+options.map(o=>`<option value="${esc(o.value)}">${esc(o.label)}</option>`).join('');
    if(old && [...select.options].some(o=>o.value===old))select.value=old;
  }
  function fillOwnerMatchForm(matchId){
    const match=db.matches.find(m=>m.id===matchId)||db.matches[0]; if(!match)return;
    const home=$('#simEditHome'),away=$('#simEditAway'),kickoff=$('#simEditKickoff'),competition=$('#simEditCompetition');
    if(home)home.value=match.home.id; if(away)away.value=match.away.id;
    if(kickoff)kickoff.value=localDateTimeValue(match.kickoff); if(competition)competition.value=match.competition||'';
    const hg=$('#simEditHomeGoals'),ag=$('#simEditAwayGoals'),mf=$('#simEditSetFinal');
    if(hg)hg.value=match.manualScore?String(match.manualScore.homeGoals):''; if(ag)ag.value=match.manualScore?String(match.manualScore.awayGoals):''; if(mf)mf.checked=!!match.manualScore?.final;
  }
  function ownerFixtureType(match){
    const type=String(match?.competitionType||competitionMeta(match?.competition).type||'national').toLowerCase();
    return type==='national'||type.includes('national')?'national':'international';
  }
  function ownerIntensityTargets(scope=ownerIntensityScope){
    const matches=Array.isArray(db.matches)?db.matches:[];
    if(scope==='selected'){
      const id=$('#simOwnerLiveMatch')?.value||'';
      return matches.filter(match=>match.id===id);
    }
    if(scope==='national')return matches.filter(match=>ownerFixtureType(match)==='national');
    if(scope==='international')return matches.filter(match=>ownerFixtureType(match)==='international');
    return matches;
  }
  function scopeBaseLevel(scope=ownerIntensityScope){
    const targets=ownerIntensityTargets(scope).filter(match=>statusFor(match).status!=='final');
    if(!targets.length)return Math.max(1,Math.min(7,Math.round(Number(db.intensityLevel)||4)));
    if(scope==='selected')return intensityLevelFor(targets[0]);
    const levels=targets.map(intensityLevelFor);
    return Math.max(1,Math.min(7,Math.round(levels.reduce((sum,n)=>sum+n,0)/levels.length)));
  }
  function syncIntensitySliderVisual(slider,level){
    if(!slider)return;
    const colors=['#a8b0bc','#66b5c7','#69bb88','#d8b75d','#e58b4c','#e74d62','#a52c46'];
    slider.style.setProperty('--intensity-progress',`${((Math.max(1,Math.min(7,Number(level)||4))-1)/6)*100}%`);
    slider.style.setProperty('--intensity-color',colors[Math.max(0,Math.min(6,Math.round(Number(level)||4)-1))]);
    slider.dataset.level=String(level);
  }
  function renderOwnerIntensity(){
    const slider=$('#simOwnerIntensity');if(!slider)return;
    const level=Math.max(1,Math.min(7,Math.round(Number(ownerIntensityDraft)||scopeBaseLevel(ownerIntensityScope)||4)));
    ownerIntensityDraft=level;slider.value=String(level);syncIntensitySliderVisual(slider,level);
    const profile=intensityProfile(level);
    const output=$('#simOwnerIntensityLevel');if(output)output.textContent=`${level} / 7 · ${profile.label}`;
    const preview=$('#simOwnerIntensityProbabilities');
    if(preview)preview.innerHTML=`<div><small>AJUSTE DE MINUTO DE GOL</small><strong>${profile.goalWindow}%</strong></div><div><small>AMARILLAS</small><strong>×${profile.yellowMultiplier.toFixed(2).replace('.',',')}</strong></div><div><small>ROJA DIRECTA</small><strong>${Math.round(profile.redChance*100)}%</strong></div><div><small>PENAL</small><strong>${Math.round(profile.penaltyChance*100)}%</strong></div>`;
    const targets=ownerIntensityTargets(ownerIntensityScope);
    const active=targets.filter(match=>statusFor(match).status!=='final');
    const selected=targets[0];
    const scopeLabels={selected:'PARTIDO ELEGIDO',all:'TODOS LOS PARTIDOS',national:'PARTIDOS NACIONALES',international:'PARTIDOS INTERNACIONALES'};
    const targetLabel=$('#simOwnerIntensityTargetLabel');
    if(targetLabel){
      let detail='';
      if(ownerIntensityScope==='selected')detail=selected?`${selected.home.name} vs ${selected.away.name}`:'Elige un encuentro en el selector de partidos.';
      else detail=`${active.length} partidos programados o en curso · los finalizados conservan sus eventos`;
      targetLabel.innerHTML=`<span class="owner-target-kicker">ALCANCE ACTUAL</span><strong>${esc(scopeLabels[ownerIntensityScope]||scopeLabels.selected)}</strong><small>${esc(detail)}</small>`;
    }
    document.querySelectorAll('[data-intensity-scope]').forEach(button=>{
      const chosen=button.dataset.intensityScope===ownerIntensityScope;
      button.classList.toggle('is-active',chosen);button.setAttribute('aria-pressed',chosen?'true':'false');
    });
    const note=$('#simOwnerIntensityNote');
    const selectedCurrent=ownerIntensityScope==='selected'?ownerIntensityTargets('selected')[0]:null;
    const selectedFinal=!!selectedCurrent&&statusFor(selectedCurrent).status==='final';
    slider.disabled=selectedFinal;
    if(note)note.textContent=selectedFinal?'Este partido ya finalizó. Puedes consultarlo, pero no se puede modificar su intensidad.':`Mueve el control para aplicar ${profile.label.toLowerCase()} automáticamente. Se conservan los eventos ya ocurridos y cambian las probabilidades futuras.`;
    const appliedStatus=$('#simOwnerIntensityApplied');
    if(appliedStatus&&selectedFinal)appliedStatus.textContent='PARTIDO FINALIZADO · SOLO LECTURA';
    else if(appliedStatus&&appliedStatus.textContent==='PARTIDO FINALIZADO · SOLO LECTURA')appliedStatus.textContent='LISTO PARA APLICAR';
    slider.style.setProperty('--intensity-progress',`${((level-1)/6)*100}%`);
  }
  function applyIntensityToMatch(match,level,now){
    const state=statusFor(match,now);if(state.status==='final')return false;
    if(state.status==='live'){
      const currentMinute=Math.max(0,Math.min(70,Number(state.minute)||0));
      // Guardar los eventos observados con el perfil anterior evita que goles/eventos pasados se muevan.
      const past=matchTimeline(match).filter(event=>Number(event.minute)<=currentMinute).map(event=>({...event}));
      const control=ensureLiveControl(match);
      control.intensityFrozenMinute=currentMinute;
      control.intensityFrozenEvents=past;
      control.intensityLevel=level;
      control.intensityChangedAt=new Date(now).toISOString();
    } else if(match.liveControl&&typeof match.liveControl==='object'){
      match.liveControl.intensityLevel=level;
    }
    match.intensityLevel=level;
    return true;
  }
  function setSimulationIntensity(nextLevel, targetScope=ownerIntensityScope){
    if(!isOwner()){ownerFeedback('Desbloquea el Panel Owner primero.','error');return;}
    const level=Math.max(1,Math.min(7,Math.round(Number(nextLevel)||4))),now=Date.now();
    const allTargets=ownerIntensityTargets(targetScope);
    if(targetScope==='selected'&&!allTargets.length){ownerFeedback('Elige primero un partido en el selector visual.','warning');return;}
    if(targetScope==='selected'&&allTargets[0]&&statusFor(allTargets[0],now).status==='final'){
      ownerFeedback('Este encuentro ya finalizó. Su intensidad y resultado se mantienen como historial.','warning');return;
    }
    const targets=allTargets.filter(match=>statusFor(match,now).status!=='final');
    if(!targets.length){ownerFeedback('No hay partidos programados o en curso en ese alcance.','warning');return;}
    const previous=targets.map(match=>({match,level:intensityLevelFor(match)}));
    if(targetScope==='all')db.intensityLevel=level;
    let applied=0,raised=0,lowered=0;
    for(const item of previous){if(item.level<level)raised++;else if(item.level>level)lowered++;if(applyIntensityToMatch(item.match,level,now))applied++;}
    ownerIntensityDraft=level;
    saveStore();
    const panel=$('#simOwnerPanel');if(panel)panel.dataset.open='true';
    render();
    const profile=intensityProfile(level);
    const scopeLabel=({selected:'partido elegido',all:'todos los partidos activos',national:'partidos nacionales',international:'partidos internacionales'})[targetScope]||'selección';
    const direction=raised>0&&lowered===0?'INTENSIDAD AUMENTADA':lowered>0&&raised===0?'INTENSIDAD REDUCIDA':raised||lowered?'INTENSIDAD ACTUALIZADA':'INTENSIDAD CONFIRMADA';
    const selected=targetScope==='selected'?targets[0]:null;
    const selectedName=selected?` · ${selected.home.name} vs ${selected.away.name}`:'';
    const fullMessage=`${direction}: nivel ${level}/7 · ${profile.label}${selectedName}. Aplicado a ${applied} ${applied===1?'encuentro':'encuentros'} (${scopeLabel}). Ajuste del minuto de gol ${profile.goalWindow}%; amarillas ×${profile.yellowMultiplier.toFixed(2).replace('.',',')}; prob. roja directa ${Math.round(profile.redChance*100)}%; prob. de penal ${Math.round(profile.penaltyChance*100)}%. Los eventos previos se conservan y las probabilidades futuras ya usan este nivel.`;
    ownerFeedback(fullMessage,'success');
    const appliedStatus=$('#simOwnerIntensityApplied');
    if(appliedStatus){appliedStatus.textContent=`${direction} · ${level}/7 · ${new Date().toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})}`;appliedStatus.classList.toggle('is-raised',raised>0&&lowered===0);appliedStatus.classList.toggle('is-lowered',lowered>0&&raised===0);}
    const toast=$('#toast');
    if(toast){toast.textContent=`${direction} · ${profile.label} ${level}/7 · ${applied} ${applied===1?'partido':'partidos'}. Probabilidades futuras actualizadas.`;toast.classList.add('show');window.setTimeout(()=>toast.classList.remove('show'),3800);}
    refreshOpenMatchDialog();
    if($('#simOwnerFixtureDialog')?.open)renderOwnerFixturePicker();
  }
  function renderOwnerFixturePicker(){
    const query=norm(ownerFixtureSearch);
    const selectedId=$('#simOwnerLiveMatch')?.value||'';
    const matches=(db.matches||[]).filter(match=>{
      const type=ownerFixtureType(match);
      if(ownerFixtureFilter==='national'&&type!=='national')return false;
      if(ownerFixtureFilter==='international'&&type!=='international')return false;
      if(!query)return true;
      return norm([match.home.name,match.away.name,match.competition,match.home.country,match.away.country].join(' ')).includes(query);
    });
    const groups={final:[],live:[],upcoming:[]};
    for(const match of matches){const status=statusFor(match).status;groups[status==='final'?'final':status==='live'?'live':'upcoming'].push(match);}
    const total=$('#simOwnerFixtureCount');if(total)total.textContent=`${matches.length} ENCUENTROS · ${groups.final.length} FINALIZADOS · ${groups.live.length} EN JUEGO · ${groups.upcoming.length} A CONTINUACIÓN`;
    for(const [key,selector] of Object.entries({final:'#ownerFixtureFinalCount',live:'#ownerFixtureLiveCount',upcoming:'#ownerFixtureUpcomingCount'})){const el=$(selector);if(el)el.textContent=String(groups[key].length);}
    document.querySelectorAll('[data-owner-fixture-filter]').forEach(button=>{
      const active=button.dataset.ownerFixtureFilter===ownerFixtureFilter;
      button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',active?'true':'false');
    });
    const renderCard=(match,index)=>{
      const state=statusFor(match),score=visibleScore(match),level=intensityLevelFor(match),chosen=match.id===selectedId;
      const scoreText=score.home==null?'— : —':`${score.home} : ${score.away}`;
      const statusText=state.status==='live'?(state.phase==='halftime'?'DESCANSO':`EN JUEGO · ${state.minute}′`):state.status==='final'?'FINALIZADO':'PROGRAMADO';
      const selectedMessage=chosen?'PARTIDO SELECCIONADO':'SELECCIONAR PARTIDO';
      return `<button type="button" class="owner-fixture-card ${chosen?'is-selected':''}" data-owner-select-fixture="${esc(match.id)}" aria-pressed="${chosen?'true':'false'}"><span class="owner-fixture-check" aria-hidden="true">${chosen?'✓':'□'}</span><span class="owner-fixture-top"><small>${String(index+1).padStart(2,'0')} · ${esc(competitionDisplayLabel(match))}</small><span class="owner-fixture-status status-${esc(state.status)}">${esc(statusText)}</span></span><strong class="owner-fixture-teams"><span>${esc(match.home.name)}</span><b>${scoreText}</b><span>${esc(match.away.name)}</span></strong><span class="owner-fixture-bottom"><small>${esc(match.home.flag||countryFlag(match.home.code))} ${esc(match.home.country)} · ${esc(timeInPeru(match))}</small><span class="owner-fixture-intensity"><i class="sim-intensity-square" data-intensity-level="${level}" aria-hidden="true"></i> INTENSIDAD ${level}/7 · ${esc(intensityProfile(level).label)}</span></span><span class="owner-fixture-select-label">${selectedMessage} <b>↗</b></span></button>`;
    };
    for(const [key,selector] of Object.entries({final:'#simOwnerFixtureFinalGrid',live:'#simOwnerFixtureLiveGrid',upcoming:'#simOwnerFixtureUpcomingGrid'})){
      const grid=$(selector);if(!grid)continue;
      grid.innerHTML=groups[key].length?groups[key].map(renderCard).join(''):`<div class="owner-fixture-empty">${key==='final'?'Aún no hay partidos finalizados con este filtro.':key==='live'?'No hay partidos en juego en este momento.':'No hay partidos próximos para esta búsqueda.'}</div>`;
    }
  }
  function renderOwnerPanel(){
    const panel=$('#simOwnerPanel'),btn=$('#simOwnerToggle'); if(!panel||!btn)return;
    const allowed=isOwner(); btn.hidden=false; btn.textContent=allowed?(panel.dataset.open==='true'?'CERRAR PANEL OWNER ×':'PANEL OWNER ⚙'):'PANEL OWNER 🔒';
    panel.hidden=!(allowed&&panel.dataset.open==='true');
    if(!allowed)return;
    const all=allCatalogTeams(); const select=$('#simExistingTeam');
    populateSelect(select,all.filter(t=>!db.extraFeatured.includes(t.id)).map(t=>({value:t.id,label:`${t.country} · ${t.name}`})),'Añadir club existente…');
    const countrySelect=$('#simClubCountry');
    populateSelect(countrySelect,(catalog().countries||[]).map(c=>({value:c.code,label:`${c.flag||'⚽'} ${c.name}`})),null);
    const ownerLiveSelect=$('#simOwnerLiveMatch');
    const oldLiveId=ownerLiveSelect?.value;
    populateSelect(ownerLiveSelect,db.matches.map((m,i)=>{const st=statusFor(m);const state=st.status==='live'?(st.phase==='halftime'?'DESCANSO':`${st.minute}′`):st.status==='final'?'FINAL':'PENDIENTE';return {value:m.id,label:`${String(i+1).padStart(2,'0')} · ${state} · ${m.home.name} vs ${m.away.name}`};}),null);
    if(ownerLiveSelect&&oldLiveId&&db.matches.some(m=>m.id===oldLiveId))ownerLiveSelect.value=oldLiveId;
    if(ownerLiveSelect&&!ownerLiveSelect.value&&db.matches[0])ownerLiveSelect.value=db.matches[0].id;
    refreshOwnerLiveControls();
    if(!document.activeElement?.matches?.('#simOwnerIntensity')){
      const currentMatch=db.matches.find(m=>m.id===ownerLiveSelect?.value);
      if(currentMatch&&ownerIntensityScope==='selected')ownerIntensityDraft=intensityLevelFor(currentMatch);
    }
    renderOwnerIntensity();
    const matchSelect=$('#simEditMatchId');
    const matchValue=matchSelect?.value;
    populateSelect(matchSelect,db.matches.map((m,i)=>({value:m.id,label:`${String(i+1).padStart(2,'0')} · ${fixtureTime(m,'America/Lima')} · ${m.home.name} vs ${m.away.name}`})),null);
    if(matchSelect && db.matches.some(m=>m.id===matchValue))matchSelect.value=matchValue;
    const teamOptions=all.map(t=>({value:t.id,label:`${t.flag||countryFlag(t.code)} ${t.country} · ${t.name}`}));
    const editHome=$('#simEditHome'),editAway=$('#simEditAway'); const oldHome=editHome?.value,oldAway=editAway?.value;
    populateSelect(editHome,teamOptions,null); populateSelect(editAway,teamOptions,null);
    if(editHome&&oldHome&&all.some(t=>t.id===oldHome))editHome.value=oldHome;
    if(editAway&&oldAway&&all.some(t=>t.id===oldAway))editAway.value=oldAway;
    if(matchSelect&&!matchSelect.dataset.hooked){matchSelect.addEventListener('change',()=>fillOwnerMatchForm(matchSelect.value));matchSelect.dataset.hooked='true';}
    if(matchSelect && (!matchSelect.dataset.filled || !db.matches.some(m=>m.id===matchSelect.dataset.lastMatchId))){fillOwnerMatchForm(matchSelect.value);matchSelect.dataset.filled='true';}
    matchSelect && (matchSelect.dataset.lastMatchId=matchSelect.value);
    const current=$('#simOwnerTeamList'); if(current){
      const featured=featuredTeamsByCountry().flatMap(x=>x.teams.map(t=>({...t,countryLabel:x.country.name}))).slice(0,100);
      current.innerHTML=featured.map(t=>`<div class="sim-owner-team"><span>${esc(t.flag||countryFlag(t.code))} ${esc(t.name)} <small>${esc(t.countryLabel)} · NIVEL ${strength(t)}</small></span><label>Fuerza <input type="number" min="1" max="100" value="${strength(t)}" data-team-power="${esc(t.id)}"></label>${t.custom?`<button type="button" data-delete-team="${esc(t.id)}" aria-label="Eliminar ${esc(t.name)}">×</button>`:''}</div>`).join('');
    }
    const compList=$('#simOwnerTournamentList'); if(compList)compList.innerHTML=tournaments().map(t=>`<div class="sim-owner-tournament"><span>${esc(t.name)} <small>${t.builtIn?'BASE SIMULADA':'CREADA POR OWNER'}</small></span>${t.builtIn?'':`<button type="button" data-delete-tournament="${esc(t.id)}">ELIMINAR</button>`}</div>`).join('');
  }
  function ownerEditMatch(form){
    if(!isOwner()){alert('Desbloquea el panel Owner primero.');return;}
    const fd=new FormData(form); const match=db.matches.find(m=>m.id===String(fd.get('matchId')||''));
    const home=allCatalogTeams().find(t=>t.id===String(fd.get('home')||'')); const away=allCatalogTeams().find(t=>t.id===String(fd.get('away')||''));
    const kickoffRaw=String(fd.get('kickoff')||''); const kickoff=new Date(kickoffRaw).getTime(); const competition=String(fd.get('competition')||'').trim();
    if(!match||!home||!away||home.id===away.id||!Number.isFinite(kickoff)||competition.length<2){alert('Revisa el partido, los equipos, la fecha y el torneo.');return;}
    match.home={...home}; match.away={...away}; match.homeTeam=match.home; match.awayTeam=match.away;
    match.homeName=home.name;match.awayName=away.name;match.homeCountry=home.country;match.awayCountry=away.country;match.homeCode=home.code;match.awayCode=away.code;match.homeFlag=home.flag;match.awayFlag=away.flag;match.homeTimezone=home.timezone||COUNTRY_TZ[home.code]||'America/Lima';
    match.kickoff=kickoff; match.simStartedAt=kickoff; match.competition=competition; match.editedAt=new Date().toISOString();
    const forceFinal=!!fd.get('setFinal'),homeGoalsRaw=String(fd.get('homeGoals')??''),awayGoalsRaw=String(fd.get('awayGoals')??'');
    if(forceFinal){
      const hg=Number(homeGoalsRaw),ag=Number(awayGoalsRaw);
      if(homeGoalsRaw===''||awayGoalsRaw===''||!Number.isInteger(hg)||!Number.isInteger(ag)||hg<0||ag<0||hg>30||ag>30){alert('Para fijar resultado final, introduce goles entre 0 y 30 para ambos clubes.');return;}
      const events=matchTimeline(match).map(e=>({...e}));
      match.manualScore={homeGoals:hg,awayGoals:ag,final:true,finalAt:Date.now(),events};
    } else {
      delete match.manualScore;
      if(homeGoalsRaw!==''&&awayGoalsRaw!==''){
        const hg=Number(homeGoalsRaw),ag=Number(awayGoalsRaw);
        if(!Number.isInteger(hg)||!Number.isInteger(ag)||hg<0||ag<0||hg>30||ag>30){alert('El marcador debe estar entre 0 y 30.');return;}
        const st=statusFor(match),minute=st.status==='upcoming'?1:st.minute,visible=visibleScore(match),timeline=matchTimeline(match);
        if(!match.liveControl)match.liveControl={events:[],eventOverrides:{},scoreOverride:null,actionLog:[]};
        match.liveControl.scoreOverride={homeGoals:hg,awayGoals:ag,minute,setAt:Date.now(),baselineGoalIds:timeline.filter(e=>e.type==='goal'&&Number(e.minute)<=minute&&eventGoalEffective(e,minute)).map(e=>String(e.eventId))};
      }
    }
    saveStore(); render(); const panel=$('#simOwnerPanel'); if(panel)panel.dataset.open='true'; fillOwnerMatchForm(match.id);refreshOwnerLiveControls();alert('Partido actualizado. Es una simulación local.');
  }
  // ─────────────────────────────────────────────────────────────────────
  // Temporadas nacionales e internacionales APS. Son resultados inventados
  // para el simulador; la puntuación no afecta a R/. ni D//.
  function limaDateKey(timestamp){
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(timestamp));
    const get=t=>parts.find(p=>p.type===t)?.value||'2000';
    return `${get('year')}-${get('month')}-${get('day')}`;
  }
  function seasonTeamPool(country){
    return allCatalogTeams().filter(t=>t.code===country.code).sort((a,b)=>a.name.localeCompare(b.name,'es'));
  }
  function makeLeagueRounds(teamList){
    const rotation=teamList.slice();
    if(rotation.length<4)return [];
    if(rotation.length%2)rotation.push(null);
    const roundCount=rotation.length-1,perRound=rotation.length/2,rounds=[];
    for(let r=0;r<roundCount;r++){
      const fixtures=[];
      for(let i=0;i<perRound;i++){
        const x=rotation[i],y=rotation[rotation.length-1-i];
        if(!x||!y)continue;
        const flip=((r+i)%2)===1;
        fixtures.push({home:flip?y:x,away:flip?x:y});
      }
      rounds.push(fixtures);
      const last=rotation.pop();rotation.splice(1,0,last);
    }
    return rounds;
  }
  function calculateNationalTable(teamList, fixtures){
    const rows=new Map(teamList.map(t=>[t.id,{teamId:t.id,name:t.name,country:t.country,code:t.code,flag:t.flag||countryFlag(t.code),played:0,w:0,d:0,l:0,gf:0,ga:0,pts:0}]));
    for(const f of fixtures){const h=rows.get(f.homeId),a=rows.get(f.awayId);if(!h||!a)continue;h.played++;a.played++;h.gf+=Number(f.homeGoals)||0;h.ga+=Number(f.awayGoals)||0;a.gf+=Number(f.awayGoals)||0;a.ga+=Number(f.homeGoals)||0;if(f.homeGoals>f.awayGoals){h.w++;h.pts+=3;a.l++;}else if(f.homeGoals<f.awayGoals){a.w++;a.pts+=3;h.l++;}else{h.d++;a.d++;h.pts++;a.pts++;}}
    return [...rows.values()].sort((a,b)=>b.pts-a.pts||((b.gf-b.ga)-(a.gf-a.ga))||b.gf-a.gf||b.w-a.w||a.name.localeCompare(b.name,'es'));
  }
  function simulateNationalSeason(country, cycle, now=Date.now()){
    const teams=seasonTeamPool(country);const rounds=makeLeagueRounds(teams);if(teams.length<4||!rounds.length)return null;
    const seasonId=`NAT-${country.code}-${String(cycle).padStart(3,'0')}`;
    const seasonLabel=`APS ${limaDateKey(now).slice(0,4)} · EDICIÓN ${String(cycle).padStart(2,'0')}`;
    const maxGames=Math.max(...rounds.map(r=>r.length),1);
    // Calendario legible: cada jornada ocupa una fecha distinta, con partidos concentrados en esa jornada.
    const base=now-((rounds.length-1)*24*60*60*1000+(maxGames-1)*15*60*1000+12*60*1000);
    const fixtures=[];
    const powers=new Map(teams.map(t=>[t.id,strength(t)]));
    rounds.forEach((games,roundIndex)=>games.forEach((game,gameIndex)=>{
      const kickoff=base+roundIndex*24*60*60*1000+gameIndex*15*60*1000;
      const id=`${seasonId}-R${String(roundIndex+1).padStart(2,'0')}-M${String(gameIndex+1).padStart(2,'0')}`;
      const seed=simpleHash(`${id}|${game.home.name}|${game.away.name}|APS`);
      const homeGoals=teamScore(seed,(powers.get(game.home.id)||65)+3);
      const awayGoals=teamScore(seed^0x9e3779b9,powers.get(game.away.id)||65);
      const score={homeGoals,awayGoals};
      fixtures.push({id,round:roundIndex+1,kickoff,date:limaDateKey(kickoff),homeId:game.home.id,homeName:game.home.name,homeCode:game.home.code,homeCountry:game.home.country,homeFlag:game.home.flag||countryFlag(game.home.code),awayId:game.away.id,awayName:game.away.name,awayCode:game.away.code,awayCountry:game.away.country,awayFlag:game.away.flag||countryFlag(game.away.code),homeGoals:score.homeGoals,awayGoals:score.awayGoals,competition:country.league});
    }));
    const finalTable=calculateNationalTable(teams,fixtures);
    const champion=finalTable[0];
    return {id:seasonId,countryCode:country.code,countryName:country.name,league:country.league,seasonLabel,cycle,createdAt:new Date(now).toISOString(),teamCount:teams.length,teams:teams.map(t=>({id:t.id,name:t.name,country:t.country,code:t.code,flag:t.flag||countryFlag(t.code),league:t.league||country.league})),roundCount:rounds.length,startDate:fixtures[0]?.date||limaDateKey(now),endDate:fixtures[fixtures.length-1]?.date||limaDateKey(now),fixtures,finalTable,championId:champion?.teamId||'',championName:champion?.name||'',championFlag:champion?.flag||countryFlag(country.code),completed:true};
  }
  function addNationalChampion(season){
    if(!season?.championId)return;
    const id=`${season.id}:CHAMPION`;
    if(db.nationalTitleHistory.some(t=>t.id===id))return;
    db.nationalTitleHistory.push({id,teamId:season.championId,teamName:season.championName,country:season.countryName,code:season.countryCode,flag:season.championFlag,competition:season.league,season:season.seasonLabel,date:season.endDate,kind:'national'});
  }
  function teamFromStanding(row){return allCatalogTeams().find(t=>t.id===row.teamId)||{id:row.teamId,name:row.name,country:row.country,code:row.code,flag:row.flag||countryFlag(row.code),league:'Liga APS',timezone:COUNTRY_TZ[row.code]||'America/Lima'};}
  function makeCupParticipants(seasons,places){
    const tableMap=seasons.map(s=>({season:s,table:s.finalTable||[]}));
    const primary=[],extras=[];
    // Reserva una plaza a cada país antes de completar el cuadro con mejores clasificados.
    for(const entry of tableMap){const row=entry.table[places[0]];if(row)primary.push({...row,qualifyingCountry:entry.season.countryName});}
    for(let p=1;p<places.length;p++)for(const entry of tableMap){const row=entry.table[places[p]];if(row&&!primary.some(x=>x.teamId===row.teamId)&&!extras.some(x=>x.teamId===row.teamId))extras.push({...row,qualifyingCountry:entry.season.countryName});}
    const score=row=>Number(row.pts||0)*5+(Number(row.gf||0)-Number(row.ga||0))*2+Number(row.w||0);
    const selected=[...primary,...extras.sort((a,b)=>score(b)-score(a)||a.name.localeCompare(b.name,'es')).slice(0,Math.max(0,16-primary.length))];
    return selected.sort((a,b)=>score(b)-score(a)||a.name.localeCompare(b.name,'es')).slice(0,16).map(teamFromStanding);
  }
  function simulateInternationalCup(name,kind,participants,cycle,now=Date.now()){
    let bracket=participants.slice(0,16);if(bracket.length<8)return null;
    const fixtures=[];let round=1;
    while(bracket.length>1){
      const winners=[];const phase=bracket.length===16?'OCTAVOS':bracket.length===8?'CUARTOS':bracket.length===4?'SEMIFINAL':'FINAL';
      for(let i=0;i<bracket.length/2;i++){
        let home=bracket[i],away=bracket[bracket.length-1-i];
        if((round+i)%2)[home,away]=[away,home];
        const id=`INT-${cycle}-${kind}-R${round}-M${i+1}`;
        const score=scoreForMatch({id,home,away,homeTeam:home,awayTeam:away});
        let winner=score.homeGoals>score.awayGoals?home:score.homeGoals<score.awayGoals?away:(simpleHash(id+'|PENALES')%2?home:away);
        fixtures.push({id,round,phase,kickoff:now-(bracket.length/2-i)*9*60*1000-round*2*60*60*1000,homeId:home.id,homeName:home.name,homeCode:home.code,homeCountry:home.country,homeFlag:home.flag,awayId:away.id,awayName:away.name,awayCode:away.code,awayCountry:away.country,awayFlag:away.flag,homeGoals:score.homeGoals,awayGoals:score.awayGoals,winnerId:winner.id,winnerName:winner.name,loserId:(winner.id===home.id?away.id:home.id),loserName:(winner.id===home.id?away.name:home.name),competition:name});
        winners.push(winner);
      }
      bracket=winners;round++;
    }
    const champion=bracket[0];const last=fixtures[fixtures.length-1];
    return {id:`INT-${kind}-${cycle}`,name,kind,season:`APS ${limaDateKey(now).slice(0,4)} · EDICIÓN ${String(cycle).padStart(2,'0')}`,cycle,createdAt:new Date(now).toISOString(),participants:participants.map(t=>({id:t.id,name:t.name,country:t.country,code:t.code,flag:t.flag})),fixtures,championId:champion.id,championName:champion.name,championCountry:champion.country,championCode:champion.code,championFlag:champion.flag||countryFlag(champion.code),runnerUpId:fixtures[fixtures.length-1]?.loserId||'',runnerUpName:fixtures[fixtures.length-1]?.loserName||'',completed:true};
  }
  function addInternationalChampion(cup){
    if(!cup?.championId)return;const id=`${cup.id}:CHAMPION`;if(db.internationalTitleHistory.some(t=>t.id===id))return;
    db.internationalTitleHistory.push({id,teamId:cup.championId,teamName:cup.championName,country:cup.championCountry,code:cup.championCode,flag:cup.championFlag,competition:cup.name,season:cup.season,date:limaDateKey(Date.now()),kind:'international'});
  }
  function simulateChampionshipCycle(initial=false){
    const countries=catalog().countries||[];if(!countries.length)return;
    const cycle=Math.max(0,Number(db.seasonCycle)||0)+1;const now=Date.now();const generated=[];
    for(const country of countries){const season=simulateNationalSeason(country,cycle,now);if(season){generated.push(season);addNationalChampion(season);}}
    db.nationalSeasons=[...(db.nationalSeasons||[]),...generated];
    // Conserva tres temporadas navegables por liga; el palmarés histórico mantiene los campeones anteriores.
    for(const country of countries){const seasons=db.nationalSeasons.filter(s=>s.countryCode===country.code).sort((a,b)=>b.cycle-a.cycle);const keep=new Set(seasons.slice(0,3).map(s=>s.id));db.nationalSeasons=db.nationalSeasons.filter(s=>s.countryCode!==country.code||keep.has(s.id));}
    const libParticipants=makeCupParticipants(generated,[0,1]);
    const sudParticipants=makeCupParticipants(generated,[1,2]);
    const cups=[simulateInternationalCup('CONMEBOL Libertadores','libertadores',libParticipants,cycle,now),simulateInternationalCup('CONMEBOL Sudamericana','sudamericana',sudParticipants,cycle,now)].filter(Boolean);
    db.internationalSeasons=[...(db.internationalSeasons||[]),...cups].slice(-24);cups.forEach(addInternationalChampion);
    db.seasonCycle=cycle;db.nationalTitleHistory=(db.nationalTitleHistory||[]).slice(-600);db.internationalTitleHistory=(db.internationalTitleHistory||[]).slice(-400);
    saveStore();return {cycle,leagues:generated.length,cups:cups.length};
  }
  function ensureChampionshipData(){
    if(!Array.isArray(db.nationalSeasons))db.nationalSeasons=[];if(!Array.isArray(db.nationalTitleHistory))db.nationalTitleHistory=[];if(!Array.isArray(db.internationalSeasons))db.internationalSeasons=[];if(!Array.isArray(db.internationalTitleHistory))db.internationalTitleHistory=[];
    const countryCount=(catalog().countries||[]).length;
    const latestCountries=new Set(db.nationalSeasons.map(s=>s.countryCode));
    const latestSeasonByCountry=new Map();
    for(const season of db.nationalSeasons){const old=latestSeasonByCountry.get(season.countryCode);if(!old||Number(season.cycle)>Number(old.cycle))latestSeasonByCountry.set(season.countryCode,season);}
    const needsDateStepMigration=[...latestSeasonByCountry.values()].some(season=>{
      const uniqueDates=new Set((season.fixtures||[]).map(f=>f.date));
      return (season.roundCount||0)>uniqueDates.size;
    });
    if(!Number(db.seasonCycle)||latestCountries.size<countryCount||needsDateStepMigration){simulateChampionshipCycle(true);}
  }
  function clubTitleRanks(entries){
    const map=new Map();for(const t of entries||[]){const key=t.teamId||`${t.code}:${norm(t.teamName)}`;if(!map.has(key))map.set(key,{teamId:key,name:t.teamName,country:t.country,code:t.code,flag:t.flag||countryFlag(t.code),titles:0,lastSeason:t.season||''});const row=map.get(key);row.titles++;row.lastSeason=t.season||row.lastSeason;}
    return [...map.values()].sort((a,b)=>b.titles-a.titles||a.name.localeCompare(b.name,'es')).slice(0,12);
  }
  function renderTitleTable(bodyId,rows,label){
    const body=$('#'+bodyId);if(!body)return;body.innerHTML=rows.length?rows.map((r,i)=>`<tr><td>${String(i+1).padStart(2,'0')}</td><td><span class="title-club-name"><span>${esc(r.flag||countryFlag(r.code))}</span><strong>${esc(r.name)}</strong></span></td><td>${esc(r.country||'—')}</td><td><strong class="title-count">${fmt(r.titles)}</strong></td></tr>`).join(''):`<tr><td colspan="4">Todavía no hay títulos registrados.</td></tr>`;
  }
  function renderLeaguePicker(){
    const grid=$('#leaguePickerGrid');if(!grid)return;
    const countries=catalog().countries||[];const selected=db.selectedCountryCode||$('#leagueSeasonCountry')?.value||'';
    grid.innerHTML=countries.map(c=>`<button type="button" class="league-picker-card ${c.code===selected?'is-selected':''}" data-pick-league="${esc(c.code)}"><span class="league-picker-flag">${esc(c.flag||'⚽')}</span><span class="league-picker-card-copy"><strong>${esc(c.league||'Liga nacional')}</strong><small>${esc(c.name)}</small></span><span class="league-picker-arrow">↗</span></button>`).join('');
  }
  function updateSeasonModeUI(){
    const full=$('#seasonModeFull'),round=$('#seasonModeRound'),advance=$('#advanceLeagueRound'),auto=$('#seasonAutoAdvanceBtn'),speed=$('#seasonSpeedSelect');
    full?.classList.toggle('active',db.seasonMode!=='round');round?.classList.toggle('active',db.seasonMode==='round');
    if(advance)advance.disabled=db.seasonMode!=='round';
    if(speed){speed.value=String(db.seasonSpeedMs||5000);speed.disabled=db.seasonMode!=='round';}
    if(auto){auto.textContent=db.seasonAutoAdvance?'AUTO: ACTIVADO ■':'AUTO: DESACTIVADO';auto.classList.toggle('is-active',!!db.seasonAutoAdvance);}
  }
  function setSeasonMode(mode){
    db.seasonMode=mode==='round'?'round':'full';db.seasonAutoAdvance=false;
    const v=$('#leagueSeasonVersion'),d=$('#leagueRankDate');const season=(db.nationalSeasons||[]).filter(s=>s.countryCode===($('#leagueSeasonCountry')?.value||db.selectedCountryCode)).sort((a,b)=>b.cycle-a.cycle)[0];
    if(v&&season)v.value=season.id;
    if(d&&season){const dates=[...new Set((season.fixtures||[]).map(f=>f.date))].sort();d.value=db.seasonMode==='round'?(dates[0]||season.startDate||''):(season.endDate||dates.at(-1)||'');}
    saveStore();renderChampionshipHub();updateSeasonModeUI();
  }
  function advanceLeagueRound(){
    if(db.seasonMode!=='round'){setSeasonMode('round');return;}
    const code=$('#leagueSeasonCountry')?.value||db.selectedCountryCode;const season=(db.nationalSeasons||[]).filter(s=>s.countryCode===code).sort((a,b)=>b.cycle-a.cycle).find(s=>s.id===$('#leagueSeasonVersion')?.value)|| (db.nationalSeasons||[]).filter(s=>s.countryCode===code).sort((a,b)=>b.cycle-a.cycle)[0];
    const dateInput=$('#leagueRankDate');if(!season||!dateInput)return;
    const dates=[...new Set((season.fixtures||[]).map(f=>f.date))].sort();const current=dateInput.value||dates[0];const next=dates.find(d=>d>current);
    if(!next){db.seasonAutoAdvance=false;saveStore();updateSeasonModeUI();alert('Esta temporada ya llegó a su última fecha. Puedes consultar al campeón o simular una nueva temporada.');return;}
    dateInput.value=next;saveStore();renderChampionshipHub();
  }
  function toggleSeasonAutoAdvance(){
    if(db.seasonMode!=='round')setSeasonMode('round');
    db.seasonAutoAdvance=!db.seasonAutoAdvance;nextSeasonAdvanceAt=Date.now()+Number(db.seasonSpeedMs||5000);saveStore();updateSeasonModeUI();
  }
  function renderChampionshipHub(){
    const countrySelect=$('#leagueSeasonCountry');if(!countrySelect)return;
    const countries=catalog().countries||[];
    if(countrySelect.options.length!==countries.length){const old=countrySelect.value;countrySelect.innerHTML=countries.map(c=>`<option value="${esc(c.code)}">${esc(c.flag||'⚽')} ${esc(c.name)} · ${esc(c.league)}</option>`).join('');if(countries.some(c=>c.code===old))countrySelect.value=old;else if(countries.some(c=>c.code===db.selectedCountryCode))countrySelect.value=db.selectedCountryCode;}
    const code=countrySelect.value||db.selectedCountryCode||countries[0]?.code;db.selectedCountryCode=code;const seasons=db.nationalSeasons.filter(s=>s.countryCode===code).sort((a,b)=>b.cycle-a.cycle);const version=$('#leagueSeasonVersion');if(!seasons.length)return;
    const previousVersion=version.value;version.innerHTML=seasons.map(s=>`<option value="${esc(s.id)}">${esc(s.seasonLabel)}</option>`).join('');if(seasons.some(s=>s.id===previousVersion))version.value=previousVersion;
    const season=seasons.find(s=>s.id===version.value)||seasons[0];version.value=season.id;
    const dateInput=$('#leagueRankDate');const seasonDates=[...new Set((season.fixtures||[]).map(f=>f.date))].sort();if(dateInput&&!dateInput.value)dateInput.value=db.seasonMode==='round'?(seasonDates[0]||season.startDate||limaDateKey(Date.now())):(season.endDate||seasonDates.at(-1)||limaDateKey(Date.now()));const selectedDate=dateInput?.value||(db.seasonMode==='round'?(seasonDates[0]||season.startDate):(season.endDate||seasonDates.at(-1)))||limaDateKey(Date.now());
    const completedFixtures=season.fixtures.filter(f=>f.date<=selectedDate);const seasonTeams=Array.isArray(season.teams)?season.teams.map(t=>({...t,timezone:COUNTRY_TZ[t.code]||'America/Lima'})):seasonTeamPool(countries.find(c=>c.code===season.countryCode)||countries[0]);const table=calculateNationalTable(seasonTeams,completedFixtures);const roundsPlayed=completedFixtures.reduce((max,f)=>Math.max(max,f.round),0);
    const current=selectedDate>=season.endDate;const champRow=season.finalTable?.[0];
    const summary=$('#leagueSeasonSummary');if(summary)summary.innerHTML=`<article><small>LIGA</small><strong>${esc(season.league)}</strong><span>${esc(season.countryName)} ${esc(countryFlag(season.countryCode))}</span></article><article><small>CAMPEÓN ${current?'DE LA FECHA':'DE TEMPORADA'}</small><strong>${current?esc(season.championName):'POR DEFINIR EN ESTA FECHA'}</strong><span>${current?'Título simulado · '+esc(season.seasonLabel):'Consulta una fecha posterior para ver el desenlace'}</span></article><article><small>JORNADAS</small><strong>${roundsPlayed} / ${season.roundCount}</strong><span>${completedFixtures.length} partidos jugados en la fecha seleccionada</span></article><article><small>CLUBES</small><strong>${season.teamCount}</strong><span>Todos los clubes de la liga en el catálogo</span></article>`;
    const tableTitle=$('#nationalTableTitle');if(tableTitle)tableTitle.textContent=`${season.league} · tabla al ${selectedDate}`;const roundLabel=$('#nationalRoundLabel');if(roundLabel)roundLabel.textContent=`JORNADA ${roundsPlayed||0}/${season.roundCount}`;
    const standings=$('#nationalLeagueStandings');if(standings)standings.innerHTML=table.map((r,i)=>`<tr class="${i===0&&current?'season-leader-row':''}"><td>${String(i+1).padStart(2,'0')}</td><td><span class="title-club-name"><span>${esc(r.flag||countryFlag(r.code))}</span><strong>${esc(r.name)}</strong></span></td><td>${r.played}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf}:${r.ga}</td><td><strong>${r.pts}</strong></td></tr>`).join('');
    const list=$('#nationalLeagueMatches');const recent=completedFixtures.slice().sort((a,b)=>b.kickoff-a.kickoff).slice(0,12);if(list)list.innerHTML=recent.length?recent.map(f=>`<article class="national-result-row"><div><small>${esc(f.date)} · J${f.round}</small><strong>${esc(f.homeName)} <span>vs</span> ${esc(f.awayName)}</strong></div><b>${f.homeGoals} : ${f.awayGoals}</b></article>`).join(''):`<div class="season-empty">No hay resultados hasta la fecha seleccionada.</div>`;const fixtureCount=$('#nationalFixtureCount');if(fixtureCount)fixtureCount.textContent=`${completedFixtures.length} PJ`;
    renderTitleTable('nationalTitlesTable',clubTitleRanks(db.nationalTitleHistory),'Ligas');renderTitleTable('internationalTitlesTable',clubTitleRanks(db.internationalTitleHistory),'Copas');
    const history=$('#championHistoryGrid');if(history){const rows=[...(db.nationalTitleHistory||[]).map(t=>({...t,level:'NACIONAL'})),...(db.internationalTitleHistory||[]).map(t=>({...t,level:'INTERNACIONAL'}))].sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.id).localeCompare(String(a.id))).slice(0,18);history.innerHTML=rows.length?rows.map(t=>`<article class="champion-history-item"><span class="champion-history-flag">${esc(t.flag||countryFlag(t.code))}</span><div><small>${esc(t.level)} · ${esc(t.date||'')}</small><strong>${esc(t.competition)}</strong><span>${esc(t.teamName)} <i>·</i> ${esc(t.country||'')}</span><small>${esc(t.season||'')}</small></div><b>♛</b></article>`).join(''):`<p class="season-empty">Los campeones aparecerán aquí después de simular una temporada.</p>`;}
  }
  function simulateNewSeasonCycle(){
    if(!confirm('Simular todas las ligas nacionales y las dos copas APS. Se generarán resultados ficticios y nuevos campeones. ¿Continuar?'))return;
    const result=simulateChampionshipCycle(false);if(!result){alert('No se pudo generar el ciclo: no hay catálogo de clubes cargado.');return;}
    const country=$('#leagueSeasonCountry');if(country)country.value=(catalog().countries||[])[0]?.code||'AR';const version=$('#leagueSeasonVersion');if(version)version.value='';const date=$('#leagueRankDate');if(date)date.value='';render();alert(`Temporada simulada: ${result.leagues} ligas nacionales y ${result.cups} copas. Los campeones se añadieron al palmarés.`);
  }

  function render(){
    lastScheduleSignature='';lastCompetitionBoardSignature='';
    ensureDay();processMatchHistory();saveStore();
    const count=$('#simMatchCount');if(count)count.textContent=String(db.matches.length);
    const poolCount=(catalog().countries||[]).reduce((sum,c)=>sum+(Array.isArray(c.clubs)?c.clubs.length:0),0)+db.customTeams.length;
    const dayBadge=$('#simDayLabel');if(dayBadge)dayBadge.title=`10 ligas nacionales, 3 CONMEBOL Libertadores, 2 CONMEBOL Sudamericana y 1 Interliga APS. Cada ciclo dura 70 minutos.`;
    const competitionTypes=new Set(db.matches.map(m=>m.competitionType));const countryCount=$('#simCountryCount');if(countryCount)countryCount.textContent=String(competitionTypes.size);
    const date=$('#simDayLabel');if(date)date.textContent=`ANCLA 08:15 · CICLO ${db.roundNo+1} · 40 PARTIDOS · 20 LOCALES / 20 INTERNACIONALES · PERÚ: 4 LOCALES`;
    const upcoming=db.matches.filter(m=>statusFor(m).status==='upcoming').length;const live=db.matches.filter(m=>statusFor(m).status==='live').length;const finished=db.matches.length-upcoming-live;
    if($('#simUpcomingCount'))$('#simUpcomingCount').textContent=String(upcoming);if($('#simLiveCount'))$('#simLiveCount').textContent=String(live);if($('#simFinishedCount'))$('#simFinishedCount').textContent=String(finished);
    const account=accountInfo();if($('#simWelcomeName'))$('#simWelcomeName').textContent=account.name;
    const compFilter=$('#simCompetitionFilter');if(compFilter){const old=compFilter.value;const compNames=[...new Set(db.matches.map(m=>m.competition))];const opts=['<option value="ALL">TODAS LAS CATEGORÍAS</option>',...compNames.map(name=>`<option value="${esc(name)}">${esc(name)}</option>`)];compFilter.innerHTML=opts.join('');if([...compFilter.options].some(o=>o.value===old))compFilter.value=old;}
    renderSchedule();renderUpcomingRoundPreview();renderStandings();renderCompetitionRankings();renderClubRanking();renderMatchRegistry(true);renderOwnerPanel();renderHome();renderChampionshipHub();renderLeaguePicker();renderCompetitionLiveBoard();updateSeasonModeUI();
    const status=$('#dataStatus');if(status)status.textContent='MOTOR DE SIMULACIÓN APS';if($('#statsMatches'))$('#statsMatches').textContent=String(db.matches.length);
    const statusText=$('#dataStatusText');if(statusText)statusText.textContent='40 partidos · 20 nacionales + 20 internacionales · 4 cruces locales de Perú · datos cada 30 s';
    const led=$('#statusLed');if(led)led.classList.add('status-led-sim');const clock=$('#refreshCountdown');if(clock)clock.textContent='ACTUALIZA 00:30';
    const liveState=$('#liveFeedState');if(liveState)liveState.textContent='SIMULACIÓN LOCAL';const last=$('#lastUpdatedText');if(last)last.textContent='Resultados calculados en este navegador';const cnt=$('#liveRefreshCountdown');if(cnt)cnt.textContent='70:00';
  }
  function openMatch(id){
    const match=findAnyMatch(id);if(!match)return;
    const profile=accountInfo(); if(profile.id!=='guest'){if(!db.viewedMatches[profile.id])db.viewedMatches[profile.id]={};db.viewedMatches[profile.id][id]=new Date().toISOString();saveStore();}
    const loading=$('#simMatchLoading');if(loading){loading.hidden=false;loading.classList.remove('leaving');}
    setTimeout(()=>{
      if(loading){loading.classList.add('leaving');setTimeout(()=>{loading.hidden=true;loading.classList.remove('leaving');},220);}
      showMatchDialog(match);
    },180);
  }
  function showMatchDialog(match){
    const dialogRef=$('#simMatchDialog');if(dialogRef)dialogRef.dataset.matchId=match.id;
    const score=visibleScore(match),st=score.state,account=accountInfo();
    const resultText=score.home==null?'— : —':`${score.home} : ${score.away}`;
    const followed = new Set(Array.isArray(db.favorites[account.id])?db.favorites[account.id]:[]);
    const events=score.events.length?score.events.map(e=>{const kind=e.displayType||eventDisplayType(e,score.state.minute||70);const label=eventLabel(kind,e);const icon=eventIcon(kind);return `<li class="sim-event-${kind}"><span>${e.minute}′</span><span>${icon} ${e.side==='home'?esc(match.home.name):esc(match.away.name)}</span><small>${esc(label)}</small></li>`;}).join(''):`<li class="sim-no-events">${score.state.status==='upcoming'?'Los eventos aparecerán cuando empiece la simulación.':'El resultado se fijó sin eventos detallados.'}</li>`;
    const myPicks=profilePicks(account.id);const pick=myPicks[match.id];
    const pickStatus=pick?.resolved?(pick.correct?'ACIERTO · +10 XP':'PRONÓSTICO NO ACERTADO'):(pick?'PRONÓSTICO GUARDADO':'');
    const pickPanel=account.id==='guest'?`<section class="sim-free-pick"><h3>PRONÓSTICO APS</h3><p>Entra en tu perfil para guardar tu elección y conseguir XP. No se usan monedas ni cuotas.</p></section>`:`<section class="sim-free-pick"><div class="sim-free-pick-head"><div><span class="sim-tag">PRONÓSTICO GRATUITO</span><h3>¿Quién ganará?</h3></div><span class="sim-pick-result">${esc(pickStatus||' +10 XP SI ACERTAS')}</span></div>${st.status!=='final'&&!pick?.resolved?`<p>Elige 1, X o 2 antes del pitazo final. Solo suma XP; R/. y D// no se modifica.</p><div class="sim-free-pick-grid"><button type="button" data-sim-pick="home" data-pick-match="${esc(match.id)}" class="${pick?.outcome==='home'?'is-selected':''}"><b>1</b><span>${esc(match.home.name)}</span></button><button type="button" data-sim-pick="draw" data-pick-match="${esc(match.id)}" class="${pick?.outcome==='draw'?'is-selected':''}"><b>X</b><span>EMPATE</span></button><button type="button" data-sim-pick="away" data-pick-match="${esc(match.id)}" class="${pick?.outcome==='away'?'is-selected':''}"><b>2</b><span>${esc(match.away.name)}</span></button></div>`:`<p>${pick?`Tu elección: <strong>${esc(pick.outcome==='home'?match.home.name:pick.outcome==='away'?match.away.name:'EMPATE')}</strong>. ${pick.resolved?(pick.correct?'Acertaste y sumaste +10 XP.':'Esta vez no acertaste.'):'El pronóstico ya quedó guardado.'}`:'Los pronósticos se cierran cuando termina el partido.'}</p>`}<small>Solo experiencia de perfil. Sin apuestas, cuotas ni pérdida de saldo.</small></section>`;
    const dialog=$('#simMatchDialog');if(!dialog)return;
    $('#simMatchModalContent').innerHTML=`<div class="sim-modal-heading"><div><span class="sim-tag">${esc(competitionDisplayLabel(match))} · PARTIDO FICTICIO</span><h2 id="simMatchDialogTitle">${esc(match.home.name.toLocaleUpperCase('es'))} <small>VS</small> ${esc(match.away.name.toLocaleUpperCase('es'))}</h2><p>${esc(match.home.country)} · HORA LOCAL ${esc(formatHomeTime(match))} · PERÚ ${esc(timeInPeru(match))}</p></div><button type="button" class="square-control" data-close-sim aria-label="Cerrar">×</button></div><div class="sim-modal-score"><div>${badgeLogo(match.home,'sim-modal-logo')}<strong>${esc(match.home.name.toLocaleUpperCase('es'))}</strong><small>${crestSourceLabel(match.home)}</small><button type="button" class="sim-follow-btn ${followed.has(match.home.id)?'is-following':''}" data-follow-team="${esc(match.home.id)}">${followed.has(match.home.id)?'★ SIGUIENDO':'+ SEGUIR CLUB'}</button></div><strong id="simModalScoreline" class="sim-modal-scoreline phase-${esc(st.phase)} status-${esc(st.status)}">${resultText}<small>${matchStatusText(st)}</small></strong><div>${badgeLogo(match.away,'sim-modal-logo')}<strong>${esc(match.away.name.toLocaleUpperCase('es'))}</strong><small>${crestSourceLabel(match.away)}</small><button type="button" class="sim-follow-btn ${followed.has(match.away.id)?'is-following':''}" data-follow-team="${esc(match.away.id)}">${followed.has(match.away.id)?'★ SIGUIENDO':'+ SEGUIR CLUB'}</button></div></div><div class="sim-detail-mini-stats"><div><small>NIVEL LOCAL</small><b>${strength(match.homeTeam)}/100</b></div><div><small>FORMATO</small><b>30 + 10 + 30 MIN</b></div><div><small>NIVEL VISITANTE</small><b>${strength(match.awayTeam)}/100</b></div></div>${intensityMatchPanelMarkup(match)}${pickPanel}<section class="sim-prediction-box sim-info-box"><div><span class="sim-tag">CENTRO DE INFORMACIÓN</span><h3>Detalles de la simulación</h3><p>Encuentro ficticio. Marcador, horario y eventos pertenecen a la simulación local; no son datos de un partido real.</p></div><div class="sim-detail-links"><a href="${esc(countryCrestLink(match.home.code))}" target="_blank" rel="noopener noreferrer">ESCUDOS ${esc(match.home.country)} ↗</a><a href="${esc(countryCrestLink(match.away.code))}" target="_blank" rel="noopener noreferrer">ESCUDOS ${esc(match.away.country)} ↗</a></div></section><section class="sim-events-box"><h3>Eventos simulados</h3><ul id="simModalEvents">${events}</ul></section>`;
    hydrateLogos($('#simMatchModalContent'));
    if(dialog.showModal&&!dialog.open)dialog.showModal();else dialog.setAttribute('open','');
  }
  function toggleFollowTeam(teamId){
    const team=allCatalogTeams().find(t=>t.id===teamId);if(!team)return;
    const profile=accountInfo();if(profile.id==='guest'){alert('Crea o inicia un perfil para seguir clubes.');return;}
    const list=Array.isArray(db.favorites[profile.id])?db.favorites[profile.id]:[];
    db.favorites[profile.id]=list.includes(teamId)?list.filter(id=>id!==teamId):[...list,teamId];
    saveStore();render();const current=db.matches.find(m=>m.home.id===teamId||m.away.id===teamId);if(current)showMatchDialog(current);
  }
  function saveFreePick(matchId,outcome){
    const profile=accountInfo();if(profile.id==='guest'){alert('Crea o inicia un perfil para guardar un pronóstico y ganar XP.');return;}
    if(!['home','draw','away'].includes(outcome))return;
    const match=findAnyMatch(matchId);if(!match){alert('Partido no disponible.');return;}const pickState=statusFor(match);if(pickState.status==='final'){alert('El partido ya terminó y el pronóstico está cerrado.');return;}
    const picks=profilePicks(profile.id);if(picks[match.id]?.resolved){alert('Este pronóstico ya fue resuelto.');return;}
    picks[match.id]={outcome,savedAt:new Date().toISOString(),resolved:false};saveStore();render();showMatchDialog(match);alert('Pronóstico guardado. +10 XP si aciertas; tu saldo no cambia.');
  }
  function ownerAddCustomTeam(form){
    const fd=new FormData(form),name=String(fd.get('name')||'').trim(),code=String(fd.get('country')||'');
    const sourceCountry=(catalog().countries||[]).find(c=>c.code===code);
    if(name.length<2||!sourceCountry){alert('Introduce un nombre de club y un país válido.');return;}
    if(allCatalogTeams().some(t=>t.code===code&&norm(t.name)===norm(name))){alert('Ese club ya está en el catálogo.');return;}
    const team={id:`CUSTOM:${code}:${simpleHash(name).toString(16)}`,name,country:sourceCountry.name,code,flag:sourceCountry.flag||'⚽',league:String(fd.get('league')||sourceCountry.league),timezone:COUNTRY_TZ[code]||'America/Lima',logoUrl:validLogoURL(String(fd.get('logo')||'')),power:Math.max(1,Math.min(100,Number(fd.get('power'))||65)),source:sourceCountry.source,custom:true};
    db.customTeams.push(team);db.extraFeatured.push(team.id);db.powerOverrides[team.id]=team.power;saveStore();form.reset();$('#simOwnerPanel').dataset.open='true';render();alert(`Club «${name}» añadido a la rotación local de simulación.`);
  }
  function validLogoURL(value){try{const u=new URL(value);return u.protocol==='https:'?u.href:'';}catch{return '';}}
  function ownerAddTournament(form){
    const fd=new FormData(form),name=String(fd.get('name')||'').trim(),kind=String(fd.get('kind')||'continental');
    if(name.length<3){alert('El nombre del torneo debe tener al menos 3 caracteres.');return;}
    if(tournaments().some(t=>norm(t.name)===norm(name))){alert('Ese torneo ya existe.');return;}
    db.tournaments.push({id:`T-${Date.now().toString(36)}-${simpleHash(name).toString(36)}`,name,kind,builtIn:false,createdAt:new Date().toISOString()});saveStore();form.reset();$('#simOwnerPanel').dataset.open='true';render();alert(`Torneo «${name}» creado para el simulador local.`);
  }
  const crestResolveCache = new Map();
  async function wikidataCrest(name,country){
    const cacheKey=`${norm(country)}|${norm(name)}`;
    if(crestResolveCache.has(cacheKey))return crestResolveCache.get(cacheKey);
    const storageKey=`foxCrestURL:${cacheKey}`;
    try { const old=localStorage.getItem(storageKey); if(old==='NONE'){crestResolveCache.set(cacheKey,'');return '';} if(old&&old.startsWith('https://')){crestResolveCache.set(cacheKey,old);return old;} } catch {}
    let resolved='';
    try {
      const q=encodeURIComponent(`${name} ${country} football club`);
      const sr=await fetch(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${q}&language=en&format=json&limit=5&origin=*`,{headers:{Accept:'application/json'}});
      if(!sr.ok)throw new Error('search failed');const sd=await sr.json();
      const entries=(sd.search||[]).filter(e=>{const label=norm(e.label||'');return label.includes(norm(name))||norm(name).includes(label)}).slice(0,3);
      for(const entry of entries){
        const er=await fetch(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(entry.id)}&props=claims&format=json&origin=*`,{headers:{Accept:'application/json'}});
        if(!er.ok)continue;const ed=await er.json();const claims=ed.entities?.[entry.id]?.claims||{};
        const claim=claims.P94?.[0]?.mainsnak?.datavalue?.value||claims.P154?.[0]?.mainsnak?.datavalue?.value;
        if(claim){resolved=`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(claim)}?width=160`;break;}
      }
    } catch {}
    crestResolveCache.set(cacheKey,resolved);
    try{localStorage.setItem(storageKey,resolved||'NONE')}catch{}
    return resolved;
  }
  async function hydrateLogos(root){
    if(!root)return;
    for(const img of root.querySelectorAll('img[data-sim-logo][data-sim-urls]')){
      if(img.dataset.tried)continue; img.dataset.tried='1';
      let urls=[];try{urls=JSON.parse(img.dataset.simUrls||'[]')}catch{}
      const tryNext=()=>{
        if(urls.length){const next=urls.shift();img.dataset.remaining=JSON.stringify(urls);img.src=next;return;}
        fallbackWikidata();
      };
      const fallbackWikidata=async()=>{
        if(img.dataset.wikidataTried)return;img.dataset.wikidataTried='1';
        const resolved=await wikidataCrest(img.dataset.simClub||img.alt.replace(/^Escudo de /,''),img.dataset.simCountry||'');
        if(resolved){img.onload=()=>{img.hidden=false;if(img.previousElementSibling)img.previousElementSibling.hidden=true;};img.onerror=()=>{img.hidden=true;};img.src=resolved;}
      };
      img.onload=()=>{img.hidden=false;if(img.previousElementSibling)img.previousElementSibling.hidden=true;};
      img.onerror=()=>{
        try{urls=JSON.parse(img.dataset.remaining||'[]')}catch{urls=[]}
        if(urls.length)tryNext();else fallbackWikidata();
      };
      if(urls.length)tryNext();
    }
  }
  function regenerate(){if(!isOwner()){alert('Solo el perfil Owner puede generar una jornada manualmente en este dispositivo.');return;}ensureDay(true);processMatchHistory();saveStore();render();}
  function wire(){
    const grid=$('#simScheduleGrid');grid?.addEventListener('click',e=>{const btn=e.target.closest('[data-open-sim]');if(btn)openMatch(btn.dataset.openSim);});
    $('#homeLiveList')?.addEventListener('click',e=>{const btn=e.target.closest('[data-open-sim]');if(btn)openMatch(btn.dataset.openSim);});
    $('#simMatchModalContent')?.addEventListener('click',e=>{const pick=e.target.closest('[data-sim-pick]');if(pick){saveFreePick(pick.dataset.pickMatch,pick.dataset.simPick);return;}const follow=e.target.closest('[data-follow-team]');if(follow){toggleFollowTeam(follow.dataset.followTeam);return;}if(e.target.closest('[data-close-sim]'))$('#simMatchDialog')?.close();});
    $('#simMatchDialog')?.addEventListener('click',e=>{if(e.target===$('#simMatchDialog')||e.target.closest('[data-close-sim]'))$('#simMatchDialog')?.close();});
    $('#simOwnerToggle')?.addEventListener('click',()=>{const panel=$('#simOwnerPanel');if(!isOwner()){const pin=prompt('PIN OWNER (demo local)');if(pin!=='1'){alert('PIN incorrecto.');return;}ownerUnlocked=true;if(panel)panel.dataset.open='true';renderOwnerPanel();return;}if(panel){panel.dataset.open=panel.dataset.open==='true'?'false':'true';renderOwnerPanel();}});
    $('#simOwnerPanel')?.addEventListener('click',e=>{const close=e.target.closest('[data-close-owner]');if(close){const panel=$('#simOwnerPanel');if(panel)panel.dataset.open='false';renderOwnerPanel();return;}const btn=e.target.closest('[data-owner-command]');if(!btn)return;if(!isOwner()){ownerFeedback('Desbloquea el Panel Owner primero.','error');return;}runOwnerCommand(btn.dataset.ownerCommand);});
    $('#simOwnerLiveMatch')?.addEventListener('change',()=>{refreshOwnerLiveControls();if(ownerIntensityScope==='selected'){const match=db.matches.find(m=>m.id===$('#simOwnerLiveMatch')?.value);if(match)ownerIntensityDraft=intensityLevelFor(match);}renderOwnerIntensity();});
    $('#simOwnerIntensity')?.addEventListener('input',e=>{
      ownerIntensityDraft=Math.max(1,Math.min(7,Math.round(Number(e.target.value)||4)));
      syncIntensitySliderVisual(e.target,ownerIntensityDraft);
      const profile=intensityProfile(ownerIntensityDraft),out=$('#simOwnerIntensityLevel');
      if(out)out.textContent=`${ownerIntensityDraft} / 7 · ${profile.label}`;
      const preview=$('#simOwnerIntensityProbabilities');
      if(preview)preview.innerHTML=`<div><small>AJUSTE DE MINUTO DE GOL</small><strong>${profile.goalWindow}%</strong></div><div><small>AMARILLAS</small><strong>×${profile.yellowMultiplier.toFixed(2).replace('.',',')}</strong></div><div><small>ROJA DIRECTA</small><strong>${Math.round(profile.redChance*100)}%</strong></div><div><small>PENAL</small><strong>${Math.round(profile.penaltyChance*100)}%</strong></div>`;
      const applied=$('#simOwnerIntensityApplied');if(applied)applied.textContent='CAMBIO PENDIENTE · SE APLICARÁ AL SOLTAR';
    });
    $('#simOwnerIntensity')?.addEventListener('change',e=>setSimulationIntensity(e.target.value,ownerIntensityScope));
    $('#simOwnerPanel')?.addEventListener('click',e=>{
      const scopeButton=e.target.closest('[data-intensity-scope]');
      if(scopeButton){ownerIntensityScope=scopeButton.dataset.intensityScope||'selected';ownerIntensityDraft=scopeBaseLevel(ownerIntensityScope);renderOwnerIntensity();const status=$('#simOwnerIntensityApplied');if(status){status.textContent='ALCANCE CAMBIADO · AJUSTA EL NIVEL';status.classList.remove('is-raised','is-lowered');}return;}
      if(e.target.closest('[data-open-owner-fixtures]')){renderOwnerFixturePicker();const dlg=$('#simOwnerFixtureDialog');if(dlg&&!dlg.open)dlg.showModal();}
    });
    $('#simOwnerFixtureSearch')?.addEventListener('input',e=>{ownerFixtureSearch=e.target.value||'';renderOwnerFixturePicker();});
    $('#simOwnerFixtureDialog')?.addEventListener('click',e=>{
      const dlg=$('#simOwnerFixtureDialog');
      if(e.target===dlg||e.target.closest('[data-close-owner-fixtures]')){if(dlg?.open)dlg.close();return;}
      const filter=e.target.closest('[data-owner-fixture-filter]');
      if(filter){ownerFixtureFilter=filter.dataset.ownerFixtureFilter||'ALL';renderOwnerFixturePicker();return;}
      const card=e.target.closest('[data-owner-select-fixture]');
      if(card){
        const match=db.matches.find(m=>m.id===card.dataset.ownerSelectFixture);if(!match)return;
        const liveSelect=$('#simOwnerLiveMatch');if(liveSelect)liveSelect.value=match.id;
        const editSelect=$('#simEditMatchId');if(editSelect){editSelect.value=match.id;fillOwnerMatchForm(match.id);}
        ownerIntensityScope='selected';ownerIntensityDraft=intensityLevelFor(match);
        refreshOwnerLiveControls();renderOwnerIntensity();
        if(dlg?.open)dlg.close();
        ownerFeedback(`Partido seleccionado: ${match.home.name} vs ${match.away.name}. La intensidad se aplicará solo a este encuentro mientras el alcance «Partido elegido» esté seleccionado.`,'success');
      }
    });
    $('#simClubForm')?.addEventListener('submit',e=>{e.preventDefault();if(isOwner())ownerAddCustomTeam(e.currentTarget);});
    $('#simTournamentForm')?.addEventListener('submit',e=>{e.preventDefault();if(isOwner())ownerAddTournament(e.currentTarget);});
    $('#simMatchEditForm')?.addEventListener('submit',e=>{e.preventDefault();ownerEditMatch(e.currentTarget);});
    $('#simStandingsMetric')?.addEventListener('change',renderStandings);$('#simCompetitionRankFilter')?.addEventListener('change',renderCompetitionRankings);$('#clubRankingCountry')?.addEventListener('change',renderClubRanking);$('#clubRankingMetric')?.addEventListener('change',renderClubRanking);
    $('#simAddExistingTeam')?.addEventListener('click',()=>{if(!isOwner())return;const id=$('#simExistingTeam')?.value;if(!id)return;const team=allCatalogTeams().find(t=>t.id===id);if(!team)return;if(!db.extraFeatured.includes(id))db.extraFeatured.push(id);db.disabledDefault=db.disabledDefault.filter(x=>x!==id);saveStore();$('#simOwnerPanel').dataset.open='true';$('#simExistingTeam').dataset.ready='';render();});
    $('#simScheduleGrid')?.addEventListener('click',e=>{const club=e.target.closest('[data-open-sim]');if(club)return;});
    $('#competitionLiveMatches')?.addEventListener('click',e=>{const btn=e.target.closest('[data-open-sim]');if(btn)openMatch(btn.dataset.openSim);});
    $('#simOwnerTeamList')?.addEventListener('change',e=>{const inp=e.target.closest('[data-team-power]');if(!inp||!isOwner())return;db.powerOverrides[inp.dataset.teamPower]=Math.max(1,Math.min(100,Number(inp.value)||65));saveStore();});
    $('#simOwnerTeamList')?.addEventListener('click',e=>{const b=e.target.closest('[data-delete-team]');if(!b||!isOwner())return;db.customTeams=db.customTeams.filter(t=>t.id!==b.dataset.deleteTeam);db.extraFeatured=db.extraFeatured.filter(id=>id!==b.dataset.deleteTeam);delete db.powerOverrides[b.dataset.deleteTeam];saveStore();render();});
    $('#simOwnerTournamentList')?.addEventListener('click',e=>{const b=e.target.closest('[data-delete-tournament]');if(!b||!isOwner())return;db.tournaments=db.tournaments.filter(t=>t.id!==b.dataset.deleteTournament);saveStore();render();});
    $('#simCompetitionFilter')?.addEventListener('change',renderSchedule);$('#simStatusFilter')?.addEventListener('change',renderSchedule);$('#simSearch')?.addEventListener('input',renderSchedule);$('#competitionLiveFilter')?.addEventListener('change',renderCompetitionLiveBoard);
    $('#playedMatchSearch')?.addEventListener('input',()=>{matchRegistryPage=0;lastMatchRegistrySignature='';renderMatchRegistry(true);});
    $('#playedMatchCompetition')?.addEventListener('change',()=>{matchRegistryPage=0;lastMatchRegistrySignature='';renderMatchRegistry(true);});
    $('#playedMatchPrev')?.addEventListener('click',()=>{matchRegistryPage=Math.max(0,matchRegistryPage-1);lastMatchRegistrySignature='';renderMatchRegistry(true);});
    $('#playedMatchNext')?.addEventListener('click',()=>{matchRegistryPage++;lastMatchRegistrySignature='';renderMatchRegistry(true);});
    document.addEventListener('click',e=>{if(e.target.closest('[data-view="match-registry"]')){lastMatchRegistrySignature='';setTimeout(()=>renderMatchRegistry(true),0);}});
    $('#simGenerateNext')?.addEventListener('click',regenerate);
    $('#simulateSeasonCycleBtn')?.addEventListener('click',simulateNewSeasonCycle);
    $('#leaguePickerOpen')?.addEventListener('click',()=>{renderLeaguePicker();const dlg=$('#leaguePickerDialog');if(dlg&&!dlg.open)dlg.showModal();});
    $('#leaguePickerDialog')?.addEventListener('click',e=>{if(e.target===$('#leaguePickerDialog')||e.target.closest('[data-close-league-picker]')){$('#leaguePickerDialog').close();return;}const b=e.target.closest('[data-pick-league]');if(!b)return;const code=b.dataset.pickLeague;db.selectedCountryCode=code;const select=$('#leagueSeasonCountry');if(select){select.value=code;select.dispatchEvent(new Event('change',{bubbles:true}));}saveStore();renderLeaguePicker();$('#leaguePickerDialog').close();});
    $('#seasonModeFull')?.addEventListener('click',()=>setSeasonMode('full'));
    $('#seasonModeRound')?.addEventListener('click',()=>setSeasonMode('round'));
    $('#advanceLeagueRound')?.addEventListener('click',advanceLeagueRound);
    $('#seasonAutoAdvanceBtn')?.addEventListener('click',toggleSeasonAutoAdvance);
    $('#seasonSpeedSelect')?.addEventListener('change',e=>{db.seasonSpeedMs=[1000,5000,10000].includes(Number(e.target.value))?Number(e.target.value):5000;nextSeasonAdvanceAt=Date.now()+db.seasonSpeedMs;saveStore();updateSeasonModeUI();});
    $('#leagueSeasonCountry')?.addEventListener('change',()=>{const d=$('#leagueRankDate');if(d)d.value='';const v=$('#leagueSeasonVersion');if(v)v.value='';db.selectedCountryCode=$('#leagueSeasonCountry').value;saveStore();renderChampionshipHub();renderLeaguePicker();});
    $('#leagueSeasonVersion')?.addEventListener('change',()=>{const d=$('#leagueRankDate');if(d)d.value='';renderChampionshipHub();});
    $('#leagueRankDate')?.addEventListener('change',renderChampionshipHub);
    $('#leagueRankLatestBtn')?.addEventListener('click',()=>{const c=$('#leagueSeasonCountry')?.value;const s=db.nationalSeasons.filter(x=>x.countryCode===c).sort((a,b)=>b.cycle-a.cycle)[0];const d=$('#leagueRankDate');if(d&&s)d.value=s.endDate||limaDateKey(Date.now());const v=$('#leagueSeasonVersion');if(v&&s)v.value=s.id;renderChampionshipHub();});
    $('#refreshBtn')?.addEventListener('click',()=>{render();});
  }
  // 40 partidos por ciclo: 20 nacionales y 20 internacionales entre Libertadores, Sudamericana e Interliga.
  let nextSimTickAt=Number(db.cycleStartedAt||Date.now())+roundDurationMs(db.day||localDayKey(),Number(db.revision)||0,Number(db.roundNo)||0);
  let nextSeasonAdvanceAt=Date.now()+Number(db.seasonSpeedMs||5000);
  const DATA_REFRESH_INTERVAL_MS=30000;
  function dataRefreshAnchor(){
    const saved=Number(db.scheduleAnchor)||Number(db.cycleStartedAt)||0;
    if(saved>0)return saved;
    const starts=(db.matches||[]).map(m=>Number(m.simStartedAt)||Number(m.kickoff)||0).filter(n=>n>0);
    return starts.length?Math.min(...starts):Date.now();
  }
  function alignedNextDataRefreshAt(now=Date.now()){
    const anchor=dataRefreshAnchor();
    if(now<anchor)return anchor;
    return anchor+(Math.floor((now-anchor)/DATA_REFRESH_INTERVAL_MS)+1)*DATA_REFRESH_INTERVAL_MS;
  }
  let nextVisualRefreshAt=Date.now()+DATA_REFRESH_INTERVAL_MS;
  let lastVisualRefreshAt=Date.now();
  function syncDataRefreshClock(now=Date.now(),force=false){
    const expected=alignedNextDataRefreshAt(now);
    if(force||!Number.isFinite(nextVisualRefreshAt)||Math.abs(expected-nextVisualRefreshAt)>1200){
      nextVisualRefreshAt=expected;
      if(force)lastVisualRefreshAt=now;
    }
  }
  let lastGoalScanAt=Date.now();
  const notifiedGoalEvents=new Set();
  const goalNotificationQueue=[];
  let goalNotificationBusy=false;
  let eventAudioContext=null;
  let eventAudioUnlocked=false;
  // El navegador exige una acción inicial del usuario antes de reproducir audio.
  document.addEventListener('pointerdown',()=>{
    try{
      const AudioCtx=window.AudioContext||window.webkitAudioContext;
      if(!AudioCtx)return;
      if(!eventAudioContext)eventAudioContext=new AudioCtx();
      // Se marca el audio como desbloqueado durante la misma interacción para que el primer clic también suene.
      eventAudioUnlocked=true;
      const resumed=eventAudioContext.resume();
      if(resumed&&typeof resumed.catch==='function')resumed.catch(()=>{eventAudioUnlocked=false;});
    }catch{eventAudioUnlocked=false;}
  },{once:true,passive:true});
  document.addEventListener('click',e=>{const btn=e.target.closest('button,[role=button]');if(!btn)return;if(eventAudioUnlocked)playMatchEventSound(btn.matches('[data-coming-soon],[aria-disabled="true"]')?'error':'button');},{passive:true});
  function playMatchEventSound(type){
    if(!eventAudioUnlocked||!eventAudioContext)return;
    try{
      const ctx=eventAudioContext,now=ctx.currentTime;
      const variants={
        goal:[[880,1046,1320,1568],[740,988,1245],[659,880,1175,1480],[784,1046,1397],[988,1175,1568]],
        yellow:[[660,520],[740,587],[622,494],[784,622],[698,554]],
        red:[[300,190,130],[260,170,110],[330,220,145],[280,160,95],[350,210,120]],
        var:[[500,620,780],[560,700],[460,580,720],[620,520,660],[540,680,820]],
        penalty:[[520,660,880],[440,554,740],[587,698,880],[494,622,784],[659,784,988]],
        button:[[620],[560,680],[700,820],[520,620],[740]],
        error:[[210,160],[260,180],[190,140],[240,170],[280,190]]
      };
      const bank=variants[type]||variants.button,notes=bank[Math.floor(Math.random()*bank.length)];
      notes.forEach((freq,i)=>{
        const osc=ctx.createOscillator(),gain=ctx.createGain();
        const t=now+i*.105;osc.type=(type==='red'||type==='error')?'sawtooth':(type==='var'?'sine':'triangle');osc.frequency.setValueAtTime(freq,t);
        gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime((type==='button'||type==='error')?.025:(type==='red'?.07:.05),t+.012);gain.gain.exponentialRampToValueAtTime(.0001,t+.105);
        osc.connect(gain);gain.connect(ctx.destination);osc.start(t);osc.stop(t+.12);
      });
    }catch{}
  }
  function eventLabel(kind,event={}){
    if(kind==='goal')return event.source==='penalty'?'GOOOOL · PENAL CONVERTIDO':'GOOOOL';
    if(kind==='goal-cancelled')return 'GOL ANULADO POR VAR';
    if(kind==='yellow')return 'TARJETA AMARILLA';
    if(kind==='red')return 'TARJETA ROJA';
    if(kind==='penalty-awarded')return 'PENAL SEÑALADO';
    if(kind==='penalty-missed')return 'PENAL ERRADO';
    if(kind==='var-review')return 'VAR EN REVISIÓN';
    if(kind==='var-result'){
      if(event.targetType==='goal')return event.outcome==='invalidated'?'VAR: GOL ANULADO':'VAR: GOL VALIDADO';
      if(event.targetType==='yellow')return event.outcome==='upgrade-red'?'VAR: AMARILLA CAMBIADA A ROJA':'VAR: AMARILLA CONFIRMADA';
      if(event.targetType==='red')return event.outcome==='downgrade-yellow'?'VAR: ROJA CAMBIADA A AMARILLA':'VAR: ROJA CONFIRMADA';
      if(event.targetType==='penalty-awarded')return event.outcome==='invalidated'?'VAR: PENAL ANULADO':'VAR: PENAL VALIDADO';
      return 'VAR: DECISIÓN CONFIRMADA';
    }
    return 'EVENTO DEL PARTIDO';
  }
  function eventIcon(kind){return ({goal:'⚽','goal-cancelled':'📺',yellow:'🟨',red:'🟥','penalty-awarded':'⚠️','penalty-missed':'❌','var-review':'📺','var-result':'📺'})[kind]||'•';}
  function ensureLiveControl(match){
    if(!match.liveControl||typeof match.liveControl!=='object')match.liveControl={events:[],eventOverrides:{},scoreOverride:null,actionLog:[]};
    if(!Array.isArray(match.liveControl.events))match.liveControl.events=[];
    if(!match.liveControl.eventOverrides||typeof match.liveControl.eventOverrides!=='object')match.liveControl.eventOverrides={};
    if(!Array.isArray(match.liveControl.actionLog))match.liveControl.actionLog=[];
    return match.liveControl;
  }
  function ownerFeedback(message,kind='info'){
    const box=$('#simOwnerLiveFeedback');if(box){box.textContent=message;box.className=`owner-live-feedback is-${kind}`;}
  }
  function ownerRecord(match,message,kind='info'){
    const control=ensureLiveControl(match);control.actionLog.unshift({at:new Date().toISOString(),message,kind});control.actionLog=control.actionLog.slice(0,10);
    const log=$('#simOwnerLiveLog');if(log)log.innerHTML=control.actionLog.map(item=>`<li class="owner-log-${esc(item.kind)}"><time>${new Date(item.at).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})}</time> ${esc(item.message)}</li>`).join('');
  }
  function ownerMessageForEvent(match,event,now=Date.now()){
    const score=visibleScore(match,now),home=match.home.name.toLocaleUpperCase('es'),away=match.away.name.toLocaleUpperCase('es'),h=score.home??0,a=score.away??0,team=(event.side==='home'?home:away);
    const minute=`${event.minute}′`;
    const type=event.type;
    if(type==='goal')return `GOOOOL DE ${team} | ${home} ${h} - ${a} ${away} | ${minute}`;
    if(type==='yellow')return `TARJETA AMARILLA [${team}] | ${home} ${h} - ${a} ${away} | ${minute}`;
    if(type==='red')return `TARJETA ROJA [${team}] | ${home} ${h} - ${a} ${away} | ${minute}`;
    if(type==='penalty-awarded')return `PENAL PARA ${team} | ${home} ${h} - ${a} ${away} | ${minute}`;
    if(type==='penalty-missed')return `PENAL ERRADO POR ${team} | ${home} ${h} - ${a} ${away} | ${minute}`;
    if(type==='var-review')return `VAR EN REVISIÓN · ${event.targetType==='goal'?'POSIBLE GOL':event.targetType==='penalty-awarded'?'POSIBLE PENAL':'INCIDENCIA DISCIPLINARIA'} | ${team} | ${minute}`;
    if(type==='var-result')return `${eventLabel(type,event)} | ${team} | ${minute}`;
    return `${eventLabel(type,event)} | ${team} | ${minute}`;
  }
  function addTimelineEvent(match,event,{notify=false}={}){
    const control=ensureLiveControl(match);event.ownerAdded=true;event.createdAtMs=Date.now();event.eventId=event.eventId||`${match.id}:OWNER:${event.type}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2,6)}`;
    control.events.push(event);control.events.sort((a,b)=>a.minute-b.minute);
    if(notify){const msg=ownerMessageForEvent(match,event);ownerRecord(match,msg,event.type);notifiedGoalEvents.add(`${match.id}:${event.eventId}`);displayMatchEventNotification(msg,event.type==='yellow'?'yellow':event.type==='red'?'red':event.type.startsWith('var')?'var':event.type.startsWith('penalty')?'penalty':'goal');}
    return event;
  }
  function applyVarToEvent(match,target,{force=false,rng=Math.random}={}){
    const control=ensureLiveControl(match),isExtra=!!target.ownerAdded;
    const decision=addVarScenario(target,rng,force);
    if(!decision.length)return false;
    if(isExtra){const idx=control.events.findIndex(e=>e.eventId===target.eventId);if(idx>=0)control.events[idx]={...control.events[idx],varReviewAt:target.varReviewAt,varDecisionMinute:target.varDecisionMinute,varOutcome:target.varOutcome};}
    else control.eventOverrides[target.eventId]={varReviewAt:target.varReviewAt,varDecisionMinute:target.varDecisionMinute,varOutcome:target.varOutcome,varReviewChance:target.varReviewChance};
    decision.forEach(e=>addTimelineEvent(match,e));
    return true;
  }
  function currentEventMinute(match,now=Date.now()){
    const st=statusFor(match,now);if(st.status==='upcoming'){match.kickoff=now;match.simStartedAt=now;return 1;}return Math.max(1,Math.min(70,st.minute||1));
  }
  function scheduleManualVarOutcome(match,event,forced=false){
    if(event.varReviewAt){ownerFeedback('Esta jugada ya tiene una revisión VAR programada.','warning');return false;}
    const rng=Math.random,ok=applyVarToEvent(match,event,{force:forced,rng});
    if(!ok){ownerFeedback('El VAR no se activó en esta jugada según la probabilidad configurada.','warning');return false;}
    const decision=event.varOutcome;
    ownerRecord(match,`VAR solicitado: ${eventLabel('var-result',{targetType:event.type,outcome:decision})}.`, 'var');
    const label=event.type==='goal'?'gol':event.type==='yellow'?'tarjeta amarilla':event.type==='red'?'tarjeta roja':'penal';
    ownerFeedback(`Revisión VAR programada para ${label}. La decisión se aplicará en el minuto ${event.varDecisionMinute}′.`, 'success');
    return true;
  }
  function runOwnerCommand(command){
    if(!isOwner()){ownerFeedback('Desbloquea el Panel Owner primero.','error');return;}
    const match=findAnyMatch($('#simOwnerLiveMatch')?.value||'');if(!match){ownerFeedback('No hay partido seleccionado.','error');return;}
    if(statusFor(match).status==='final'&&command!=='set-score'){ownerFeedback('El partido ya finalizó. Edita el marcador en el editor general si necesitas corregirlo.','warning');return;}
    const now=Date.now(),minute=currentEventMinute(match,now),control=ensureLiveControl(match),rng=Math.random;
    const before=visibleScore(match,now),homeName=match.home.name.toLocaleUpperCase('es'),awayName=match.away.name.toLocaleUpperCase('es');
    const side=command.endsWith('-away')?'away':'home',team=side==='home'?homeName:awayName;
    if(command==='set-score'){
      const hg=Number($('#simOwnerScoreHome')?.value),ag=Number($('#simOwnerScoreAway')?.value);
      if(!Number.isInteger(hg)||!Number.isInteger(ag)||hg<0||ag<0||hg>30||ag>30){ownerFeedback('Introduce un marcador de 0 a 30 para ambos clubes.','error');return;}
      if(match.manualScore?.final){
        match.manualScore.homeGoals=hg;match.manualScore.awayGoals=ag;match.manualScore.finalAt=now;match.manualScore.events=matchTimeline(match).map(e=>({...e}));
        archiveMatch(match);ownerRecord(match,`Resultado final corregido: ${homeName} ${hg} - ${ag} ${awayName}.`,'score');ownerFeedback('Resultado final corregido y archivado.','success');
      }else{
        const timeline=matchTimeline(match),baselineGoalIds=timeline.filter(e=>e.type==='goal'&&Number(e.minute)<=minute&&eventGoalEffective(e,minute)).map(e=>String(e.eventId));
        control.scoreOverride={homeGoals:hg,awayGoals:ag,minute,setAt:now,baselineGoalIds};
        ownerRecord(match,`Marcador fijado: ${homeName} ${hg} - ${ag} ${awayName}.`,'score');ownerFeedback('Marcador guardado sin finalizar el encuentro.','success');
      }
    }else if(command==='quick-sim'){
      const totals=scoreAtMinute(match,70),events=matchTimeline(match).map(e=>({...e}));
      match.simStartedAt=now-MATCH_DURATION_MS;match.kickoff=match.simStartedAt;
      match.manualScore={homeGoals:totals.homeGoals,awayGoals:totals.awayGoals,final:true,finalAt:now,events};
      archiveMatch(match);ownerRecord(match,`Simulación inmediata: ${homeName} ${totals.homeGoals} - ${totals.awayGoals} ${awayName}.`,'score');ownerFeedback('Encuentro finalizado y archivado.','success');
    }else if(command==='var-review'){
      const available=matchTimeline(match).filter(e=>['goal','yellow','red','penalty-awarded'].includes(e.type)&&Number(e.minute)<=minute&&!e.varReviewAt).sort((a,b)=>b.minute-a.minute);
      if(!available.length){ownerFeedback('No hay una jugada revisable sin VAR previo en este partido.','warning');return;}
      if(!scheduleManualVarOutcome(match,available[0],true))return;
    }else if(command==='goal-home'||command==='goal-away'){
      const event={type:'goal',side,minute,source:'owner',eventId:`${match.id}:OWNER-GOAL:${now}`};
      addTimelineEvent(match,event,{notify:true});
      const reviewRng=Math.random;if(reviewRng()<.22)applyVarToEvent(match,event,{force:true,rng:reviewRng});
      ownerFeedback(`Gol añadido para ${team}. El partido continúa en directo.`, 'success');
    }else if(command==='yellow-home'||command==='yellow-away'||command==='red-home'||command==='red-away'){
      const type=command.startsWith('yellow')?'yellow':'red';const event={type,side,minute,eventId:`${match.id}:OWNER-${type}:${now}`};
      addTimelineEvent(match,event,{notify:true});
      const chance=type==='yellow'?.12:.15;if(rng()<chance)applyVarToEvent(match,event,{force:true,rng});
      ownerFeedback(`${type==='yellow'?'Tarjeta amarilla':'Tarjeta roja'} registrada para ${team}.`, 'success');
    }else if(command==='penalty-home'||command==='penalty-away'){
      const award={type:'penalty-awarded',side,minute,eventId:`${match.id}:OWNER-PENAL:${now}`};addTimelineEvent(match,award,{notify:true});
      const review=rng()<.28;
      let overturned=false,resolutionMinute=nextPlayingMinute(minute,1);
      if(review){
        const fakeRng=()=>.5;
        const invalidated=rng()<.18;award.varReviewAt=nextPlayingMinute(minute,1);award.varDecisionMinute=nextPlayingMinute(minute,2);award.varOutcome=invalidated?'invalidated':'validated';
        addTimelineEvent(match,{eventId:`${award.eventId}:VAR-REVIEW`,type:'var-review',minute:award.varReviewAt,side,targetEventId:award.eventId,targetType:'penalty-awarded',outcome:award.varOutcome});
        addTimelineEvent(match,{eventId:`${award.eventId}:VAR-RESULT`,type:'var-result',minute:award.varDecisionMinute,side,targetEventId:award.eventId,targetType:'penalty-awarded',outcome:award.varOutcome});
        resolutionMinute=nextPlayingMinute(award.varDecisionMinute,1);overturned=invalidated;
      }
      if(!overturned){
        const converted=rng()<.76;
        if(converted){const goal={type:'goal',side,minute:resolutionMinute,source:'penalty',eventId:`${award.eventId}:GOAL`};addTimelineEvent(match,goal);if(rng()<.22)applyVarToEvent(match,goal,{force:true,rng});}
        else addTimelineEvent(match,{type:'penalty-missed',side,minute:resolutionMinute,eventId:`${award.eventId}:MISS`});
      }
      ownerFeedback(overturned?'El VAR anuló el penal; se registrará la decisión en su minuto.':'Penal señalado; el resultado se resolverá en el minuto indicado.', 'success');
    }
    saveStore();render();
    const panel=$('#simOwnerPanel');if(panel)panel.dataset.open='true';renderOwnerPanel();
    if(match.status!=='final')refreshOpenMatchDialog();
    updateVisibleMatchCards($('#simScheduleGrid'),true);updateVisibleMatchCards($('#homeLiveList'),true);updateVisibleMatchCards($('#competitionLiveMatches'),true);
  }
  function refreshOwnerLiveControls(){
    const id=$('#simOwnerLiveMatch')?.value,match=findAnyMatch(id||'');if(!match)return;
    const st=statusFor(match),score=visibleScore(match),status=$('#simOwnerLiveStatus');
    const activeLevel=intensityLevelFor(match),activeProfile=intensityProfile(activeLevel);
    if(status)status.textContent=`${match.home.name.toLocaleUpperCase('es')} ${score.home??'—'} - ${score.away??'—'} ${match.away.name.toLocaleUpperCase('es')} · ${matchStatusText(st)} · ${matchClockText(match)} · INTENSIDAD ${activeLevel}/7 · AJUSTE DE GOL ${activeProfile.goalWindow}% · AMARILLAS ×${activeProfile.yellowMultiplier.toFixed(2).replace('.',',')} · ROJA ${Math.round(activeProfile.redChance*100)}% · PENAL ${Math.round(activeProfile.penaltyChance*100)}%`;
    const h=$('#simOwnerScoreHome'),a=$('#simOwnerScoreAway');if(h&&document.activeElement!==h)h.value=String(score.home??0);if(a&&document.activeElement!==a)a.value=String(score.away??0);
    const log=$('#simOwnerLiveLog'),items=match.liveControl?.actionLog||[];if(log)log.innerHTML=items.length?items.map(item=>`<li class="owner-log-${esc(item.kind)}"><time>${new Date(item.at).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})}</time> ${esc(item.message)}</li>`).join(''):'<li>Los eventos administrados aparecerán aquí.</li>';
  }
  function goalEventAt(match,event){
    const minute=Math.max(1,Math.min(70,Number(event.minute)||1));
    const offset=minute<=30?(minute-1)*60*1000:40*60*1000+(minute-41)*60*1000;
    return (Number(match.simStartedAt)||Number(match.kickoff)||0)+offset;
  }
  function displayMatchEventNotification(message,type='goal'){
    const item={message,type};
    if(goalNotificationBusy){goalNotificationQueue.push(item);return;}
    goalNotificationBusy=true;
    const toast=$('#toast');
    const alertClass=type==='yellow'?'yellow-card-alert':type==='red'?'red-card-alert':type==='var'?'var-alert':type==='penalty'?'penalty-alert':'goal-alert';
    if(toast)toast.classList.remove('goal-alert','yellow-card-alert','red-card-alert','var-alert','penalty-alert');
    playMatchEventSound(type);
    const show=window.FoxcrakApp?.notify;
    if(typeof show==='function')show(message);
    else if(toast){toast.textContent=message;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2900);}
    if(toast)toast.classList.add(alertClass);
    setTimeout(()=>{
      if(toast)toast.classList.remove('goal-alert','yellow-card-alert','red-card-alert','var-alert','penalty-alert');
      goalNotificationBusy=false;const next=goalNotificationQueue.shift();if(next)displayMatchEventNotification(next.message,next.type);
    },type==='goal'?4700:3900);
  }
  function scanSimulatedEvents(now=Date.now()){
    for(const match of db.matches){
      const start=Number(match.simStartedAt)||Number(match.kickoff)||0;
      if(now<start)continue;
      const score=scoreForMatch(match);
      for(let i=0;i<(score.events||[]).length;i++){
        const event=score.events[i],type=event.type||'goal';
        const key=`${match.id}:${event.eventId||`${type}:${event.side}:${event.minute}:${i}`}`;
        const eventAt=goalEventAt(match,event);
        if(notifiedGoalEvents.has(key))continue;
        if(eventAt<=lastGoalScanAt){notifiedGoalEvents.add(key);continue;}
        if(eventAt>lastGoalScanAt&&eventAt<=now){
          notifiedGoalEvents.add(key);
          const st=statusFor(match,now),minute=st.status==='final'?70:st.minute;
          const current=scoreAtMinute(match,minute),home=match.home.name.toLocaleUpperCase('es'),away=match.away.name.toLocaleUpperCase('es');
          const who=(event.side==='home'?home:away);
          const line=`${home} ${current.homeGoals} - ${current.awayGoals} ${away}`;
          let message='',soundType='goal';
          if(type==='goal'){
            const effective=eventDisplayType(event,minute);
            message=effective==='goal-cancelled'?`GOOOL ANULADO POR VAR | ${home} ${current.homeGoals} - ${current.awayGoals} ${away} | ${event.minute}′`:`GOOOOL DE ${who} | ${line} | ${event.minute}′`;
            soundType=effective==='goal-cancelled'?'var':'goal';
          }else if(type==='yellow'){message=`TARJETA AMARILLA [${who}] | ${line} | ${event.minute}′`;soundType='yellow';}
          else if(type==='red'){message=`TARJETA ROJA [${who}] | ${line} | ${event.minute}′`;soundType='red';}
          else if(type==='penalty-awarded'){message=`PENAL PARA ${who} | ${line} | ${event.minute}′`;soundType='penalty';}
          else if(type==='penalty-missed'){message=`PENAL ERRADO POR ${who} | ${line} | ${event.minute}′`;soundType='penalty';}
          else if(type==='var-review'){
            const target=matchTimeline(match).find(e=>e.eventId===event.targetEventId);
            const targetName=event.targetType==='goal'?'GOL':event.targetType==='yellow'?'TARJETA AMARILLA':event.targetType==='red'?'TARJETA ROJA':'PENAL';
            message=`📺 VAR EN REVISIÓN · ${targetName} DE ${who} | ${line} | ${event.minute}′`;soundType='var';
          }else if(type==='var-result'){
            message=`${eventLabel(type,event)} | ${who} | ${line} | ${event.minute}′`;soundType='var';
          }else continue;
          displayMatchEventNotification(message,soundType);
          if(isOwner()&&$('#simOwnerLiveMatch')?.value===match.id)ownerRecord(match,message,type==='var-result'||type==='var-review'?'var':type==='goal'?'goal':type);
          updateVisibleMatchCards($('#simScheduleGrid'),true);
          updateVisibleMatchCards($('#competitionLiveMatches'),true);
          refreshOpenMatchDialog();refreshOwnerLiveControls();
        }
      }
    }
    lastGoalScanAt=now;
  }
  function countdownText(totalSeconds){const seconds=Math.max(0,Math.floor(totalSeconds));const h=Math.floor(seconds/3600),m=Math.floor((seconds%3600)/60),s=seconds%60;return h>0?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}
  function updateVisibleMatchCards(root=$('#simScheduleGrid'),refreshData=true){
    if(!root)return;
    for(const card of root.querySelectorAll('[data-sim-card]')){
      const match=findAnyMatch(card.dataset.simCard);if(!match)continue;
      const status=refreshData?visibleScore(match).state:statusFor(match);
      card.classList.remove('phase-scheduled','phase-first-half','phase-halftime','phase-second-half','phase-final','status-upcoming','status-live','status-final');
      card.classList.add(`phase-${status.phase||'scheduled'}`,`status-${status.status||'upcoming'}`);
      const state=card.querySelector('.sim-state');
      if(state){state.textContent=matchStatusText(status);state.className=`sim-state ${status.status}${status.phase==='halftime'?' halftime':''}`;}
      const result=card.querySelector('.sim-result');if(result){result.classList.remove('phase-scheduled','phase-first-half','phase-halftime','phase-second-half','phase-final','status-upcoming','status-live','status-final');result.classList.add(`phase-${status.phase||'scheduled'}`,`status-${status.status||'upcoming'}`);}
      if(refreshData){
        const score=visibleScore(match);
        const value=card.querySelector('.sim-result strong');if(value){const h=score.home==null?'—':score.home,a=score.away==null?'—':score.away;value.innerHTML=`${h} <i>:</i> ${a}`;}
      }
      const label=card.querySelector('.sim-result small');if(label)label.textContent=matchClockText(match);
      const countdown=card.querySelector('[data-match-countdown]');if(countdown){countdown.textContent=matchRemainingText(match);countdown.classList.toggle('is-halftime',status.phase==='halftime');countdown.classList.toggle('is-final',status.status==='final');countdown.classList.toggle('is-live',status.status==='live');}
    }
  }

  function refreshOpenMatchDialog(){
    const dialog=$('#simMatchDialog');if(!dialog?.open)return;
    const match=findAnyMatch(dialog.dataset.matchId||'');if(!match)return;
    const score=visibleScore(match),line=$('#simModalScoreline');
    if(line){line.className=`sim-modal-scoreline phase-${score.state.phase} status-${score.state.status}`;line.innerHTML=`${score.home==null?'—':score.home} : ${score.away==null?'—':score.away}<small>${matchStatusText(score.state)}</small>`;}
    const events=$('#simModalEvents');if(events){events.innerHTML=score.events.length?score.events.map(e=>{const kind=e.displayType||eventDisplayType(e,score.state.minute||70);const label=eventLabel(kind,e);const icon=eventIcon(kind);return `<li class="sim-event-${kind}"><span>${e.minute}′</span><span>${icon} ${e.side==='home'?esc(match.home.name):esc(match.away.name)}</span><small>${esc(label)}</small></li>`;}).join(''):`<li class="sim-no-events">${score.state.status==='upcoming'?'Los eventos aparecerán cuando empiece la simulación.':'El resultado se fijó sin eventos detallados.'}</li>`;}
    const currentIntensityPanel=$('#simMatchIntensityPanel');if(currentIntensityPanel)currentIntensityPanel.outerHTML=intensityMatchPanelMarkup(match);
    const account=accountInfo(),pick=profilePicks(account.id)[match.id],pickPanel=$('.sim-free-pick', $('#simMatchModalContent'));
    if(pickPanel&&score.state.status==='final'){
      const pickGrid=pickPanel.querySelector('.sim-free-pick-grid');if(pickGrid)pickGrid.remove();
      const note=pickPanel.querySelector('p');
      if(note)note.textContent=pick?(pick.resolved?(pick.correct?'Pronóstico acertado: +10 XP APS.':'Pronóstico no acertado. No se modificó tu saldo.'):'Tu pronóstico quedó registrado.'):'El partido terminó. Ya no se aceptan más pronósticos.';
      const badge=pickPanel.querySelector('.sim-pick-result');if(badge)badge.textContent=pick?.resolved?(pick.correct?'ACIERTO · +10 XP':'NO ACERTADO'):'PARTIDO FINALIZADO';
    }
  }

  function pruneExpiredFinalCards(now=Date.now()){
    let expiredVisible=false;
    for(const selector of ['#simScheduleGrid','#competitionLiveMatches']){
      const root=$(selector);if(!root)continue;
      for(const card of root.querySelectorAll('[data-sim-card]')){
        const match=findAnyMatch(card.dataset.simCard);
        if(match&&statusFor(match,now).status==='final'&&now>=matchFinishAt(match)+FINAL_CARD_GRACE_MS){expiredVisible=true;break;}
      }
      if(expiredVisible)break;
    }
    if(expiredVisible){renderSchedule();renderCompetitionLiveBoard();}
  }
  window.FOXCRAK_SIMULATOR={render,renderHome,regenerate,refresh:()=>{ensureDay();processMatchHistory();saveStore();render();},simulateSeasons:simulateNewSeasonCycle,getSnapshot:()=>JSON.parse(JSON.stringify(db)),getStatus:(id,now=Date.now())=>{const m=db.matches.find(x=>String(x.id)===String(id));return m?statusFor(m,now):null;},getClock:(id,now=Date.now())=>{const m=db.matches.find(x=>String(x.id)===String(id));return m?matchClockText(m,now):'';},teamBadge:(team,cls='peru-team-crest')=>badgeLogo(team,cls),hydrateLogos,advanceLeagueRound,setSeasonMode};
  // Club especial del universo Fórnika: se añade una única vez al catálogo local de Perú.
  (function ensureRegatasDuFornika(){
    const found=allCatalogTeams().find(t=>norm(t.name)==='regatas du forn ika'||norm(t.name)==='regatas du fornika');
    if(found){db.powerOverrides[found.id]=92;const u=allCatalogTeams().find(t=>t.code==='PE'&&norm(t.name)==='universitario de deportes');if(u)db.powerOverrides[u.id]=84;return;}
    const peru=(catalog().countries||[]).find(c=>c.code==='PE');
    if(!peru)return;
    const team={id:'CUSTOM:PE:REGATAS-DU-FORNIKA',name:'Regatas Dū Fórnika',country:peru.name,code:'PE',flag:peru.flag||'🇵🇪',league:'Liga 1 Perú',timezone:COUNTRY_TZ.PE,source:peru.source||'',custom:true,power:92,logoUrl:''};
    db.customTeams.push(team);db.extraFeatured.push(team.id);db.powerOverrides[team.id]=92;const u=allCatalogTeams().find(t=>t.code==='PE'&&norm(t.name)==='universitario de deportes');if(u)db.powerOverrides[u.id]=84;
  })();
  ensureDay();ensureChampionshipData();
  syncDataRefreshClock(Date.now(),true);
  wire();render();
  nextSimTickAt=Number(db.cycleStartedAt||Date.now())+roundDurationMs(db.day||localDayKey(),Number(db.revision)||0,Number(db.roundNo)||0);
  setInterval(()=>{
    const now=Date.now();
    scanSimulatedEvents(now);
    syncNewFinalResults(now);
    pruneExpiredFinalCards(now);
    if(now>=nextSimTickAt){advanceRapidRound();nextSimTickAt=Number(db.cycleStartedAt||now)+roundDurationMs(db.day||localDayKey(),Number(db.revision)||0,Number(db.roundNo)||0);}
    // Los contadores de tarjetas avanzan cada segundo; las tablas y datos completos se refrescan cada 30 s.
    updateVisibleMatchCards($('#simScheduleGrid'),false);
    updateVisibleMatchCards($('#homeLiveList'),false);
    updateVisibleMatchCards($('#competitionLiveMatches'),false);
    const boundaries=[];
    for(const match of db.matches){
      const start=Number(match.simStartedAt)||Number(match.kickoff)||now;
      let at=start,label='INICIO DE PARTIDO';
      if(now<start){at=start;label='INICIO DE PARTIDO';}
      else if(now<start+30*60*1000){at=start+30*60*1000;label='DESCANSO';}
      else if(now<start+40*60*1000){at=start+40*60*1000;label='SEGUNDO TIEMPO';}
      else if(now<start+MATCH_DURATION_MS){at=start+MATCH_DURATION_MS;label='FINAL DE PARTIDO';}
      else continue;
      if(at>now)boundaries.push({at,label});
    }
    boundaries.sort((a,b)=>a.at-b.at);
    const nextBoundary=boundaries[0]||{at:nextSimTickAt,label:'NUEVA JORNADA'};
    const left=Math.max(0,Math.ceil((nextBoundary.at-now)/1000));
    const phaseLabel=$('#simNextPhaseLabel');if(phaseLabel)phaseLabel.textContent=nextBoundary.label;
    const clock=$('#simTickCountdown');if(clock)clock.textContent=countdownText(left);
    const dayLeft=Math.max(0,Math.ceil((nextSimTickAt-now)/1000));
    const liveClock=$('#liveRefreshCountdown');if(liveClock)liveClock.textContent=countdownText(dayLeft);
    const dayClock=$('#simDayCountdown');if(dayClock)dayClock.textContent=countdownText(dayLeft);
    // Mantiene el refresco en los mismos límites de 30 s que los relojes de la jornada.
    // Solo corrige el contador si se detecta una desviación real respecto al ancla común.
    if(now<nextVisualRefreshAt-1200){
      const expected=alignedNextDataRefreshAt(now);
      if(Math.abs(expected-nextVisualRefreshAt)>1200)nextVisualRefreshAt=expected;
    }
    if(now>=nextVisualRefreshAt){
      lastVisualRefreshAt=now;
      nextVisualRefreshAt=alignedNextDataRefreshAt(now);
      processMatchHistory();saveStore();lastMatchRegistrySignature='';renderMatchRegistry(true);renderSchedule();renderCompetitionLiveBoard();renderUpcomingRoundPreview();renderStandings();renderCompetitionRankings();renderClubRanking();renderHome();refreshOpenMatchDialog();if($('#simOwnerFixtureDialog')?.open)renderOwnerFixturePicker();
      const current=$('#competitionLiveMatches');if(current){const active=db.matches.filter(m=>(!$('#competitionLiveFilter')?.value||$('#competitionLiveFilter').value==='ALL'||(m.competitionType||'national')===$('#competitionLiveFilter').value)&&statusFor(m).status==='live').length;const finished=db.matches.filter(m=>(!$('#competitionLiveFilter')?.value||$('#competitionLiveFilter').value==='ALL'||(m.competitionType||'national')===$('#competitionLiveFilter').value)&&statusFor(m).status==='final').length;const phase=$('#competitionLivePhaseLabel');if(phase)phase.textContent=active?`${active} PARTIDOS EN JUEGO · ${finished} FINALIZADOS`:`${finished} FINALIZADOS · PRÓXIMA JORNADA PREPARADA`;}
    }
    const refreshSecondsLeft=Math.max(0,Math.ceil((nextVisualRefreshAt-now)/1000));
    const refreshClock=$('#refreshCountdown');if(refreshClock)refreshClock.textContent=`ACTUALIZA ${countdownText(refreshSecondsLeft)}`;
    const ownerRefreshClock=$('#simDataRefreshCountdown');if(ownerRefreshClock)ownerRefreshClock.textContent=countdownText(refreshSecondsLeft);
    if(isOwner()&&$('#simOwnerPanel')?.dataset.open==='true')refreshOwnerLiveControls();
    const refreshLabel=$('#competitionLiveUpdated');if(refreshLabel){const secLeft=refreshSecondsLeft;refreshLabel.textContent=`ACTUALIZADO ${new Intl.DateTimeFormat('es-PE',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date(lastVisualRefreshAt))} · ACTUALIZA EN ${countdownText(secLeft)}`;}
    if(db.seasonAutoAdvance&&db.seasonMode==='round'&&now>=nextSeasonAdvanceAt){advanceLeagueRound();nextSeasonAdvanceAt=Date.now()+Number(db.seasonSpeedMs||5000);}
  },1000);
})();
