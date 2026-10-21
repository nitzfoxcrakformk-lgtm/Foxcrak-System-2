(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const fmt = value => new Intl.NumberFormat('es-PE').format(Number(value) || 0);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const nowString = () => new Date().toLocaleString('es-PE', {dateStyle:'short', timeStyle:'short'});
  const LATAM_TERMS = ['argentina','brazil','brasil','peru','perú','chile','colombia','ecuador','uruguay','paraguay','bolivia','venezuela','guyana','suriname','surinam','sudamérica','sudamerica','south america','libertadores','sudamericana','liga 1','liga futve','ligapro','primera división argentina','primera division argentina','división profesional','division profesional','brasileirão','brasileirao','categoría primera a','categoria primera a'];
  const COUNTRIES = [
    {name:'Argentina',key:'Argentina',short:'AR',icon:'🇦🇷',term:['argentina']},
    {name:'Bolivia',key:'Bolivia',short:'BO',icon:'🇧🇴',term:['bolivia']},
    {name:'Brasil',key:'Brazil',short:'BR',icon:'🇧🇷',term:['brazil','brasil']},
    {name:'Chile',key:'Chile',short:'CL',icon:'🇨🇱',term:['chile']},
    {name:'Colombia',key:'Colombia',short:'CO',icon:'🇨🇴',term:['colombia']},
    {name:'Ecuador',key:'Ecuador',short:'EC',icon:'🇪🇨',term:['ecuador']},
    {name:'Paraguay',key:'Paraguay',short:'PY',icon:'🇵🇾',term:['paraguay']},
    {name:'Perú',key:'Peru',short:'PE',icon:'🇵🇪',term:['peru','perú']},
    {name:'Uruguay',key:'Uruguay',short:'UY',icon:'🇺🇾',term:['uruguay']},
    {name:'Venezuela',key:'Venezuela',short:'VE',icon:'🇻🇪',term:['venezuela']},
    {name:'Guyana',key:'Guyana',short:'GY',icon:'🇬🇾',term:['guyana']},
    {name:'Surinam',key:'Suriname',short:'SR',icon:'🇸🇷',term:['suriname','surinam']}
  ];
  // No se cargan clubes ficticios: los encuentros aparecen solo desde la fuente deportiva conectada.
  const SAMPLE_MATCHES = [];
  const COMPETITIONS = [
    {name:'Liga Profesional de Fútbol',scope:'ARGENTINA',country:'Argentina',code:'AR',flag:'🇦🇷',aliases:['liga profesional','primera división argentina','primera division argentina','liga profesional de futbol'],description:'Primera división del fútbol argentino.',source:'https://www.lpf.org.ar/',type:'league'},
    {name:'División Profesional',scope:'BOLIVIA',country:'Bolivia',code:'BO',flag:'🇧🇴',aliases:['división profesional','division profesional','liga boliviana','primera división','primera division'],description:'Primera categoría nacional de Bolivia.',source:'https://www.fbf.com.bo/',type:'league'},
    {name:'Campeonato Brasileiro Série A',scope:'BRASIL',country:'Brazil',code:'BR',flag:'🇧🇷',aliases:['brasileirão série a','brasileirao serie a','campeonato brasileiro','série a','serie a'],description:'Primera división nacional de Brasil.',source:'https://www.cbf.com.br/futebol-brasileiro/times/campeonato-brasileiro/serie-a/2026',type:'league'},
    {name:'Primera División de Chile',scope:'CHILE',country:'Chile',code:'CL',flag:'🇨🇱',aliases:['primera división de chile','primera division chile','liga de primera','primera división','primera division','chilean primera'],description:'Máxima categoría del fútbol chileno.',source:'https://www.anfp.cl/division-categoria/clubes-primera-division/',type:'league'},
    {name:'Categoría Primera A',scope:'COLOMBIA',country:'Colombia',code:'CO',flag:'🇨🇴',aliases:['categoría primera a','categoria primera a','liga betplay','primera a colombia','primera división','primera division'],description:'Primera categoría profesional colombiana.',source:'https://dimayor.com.co/liga-betplay-dimayor/',type:'league'},
    {name:'LigaPro Serie A',scope:'ECUADOR',country:'Ecuador',code:'EC',flag:'🇪🇨',aliases:['ligapro serie a','liga pro serie a','serie a ecuador'],description:'Primera división ecuatoriana.',source:'https://ligapro.ec/equipos/',type:'league'},
    {name:'Primera División Paraguaya',scope:'PARAGUAY',country:'Paraguay',code:'PY',flag:'🇵🇾',aliases:['primera división paraguaya','primera division paraguaya','división de honor','division de honor','primera división','primera division'],description:'Primera división nacional de Paraguay.',source:'https://www.apf.org.py/',type:'league'},
    {name:'Liga 1',scope:'PERÚ',country:'Peru',code:'PE',flag:'🇵🇪',aliases:['liga 1','liga 1 peru','primera división peruana','primera division peruana'],description:'Máxima categoría del fútbol peruano.',source:'https://fpf.org.pe/',type:'league'},
    {name:'Primera División de Uruguay',scope:'URUGUAY',country:'Uruguay',code:'UY',flag:'🇺🇾',aliases:['primera división de uruguay','primera division uruguay','primera division uruguaya','primera división','primera division'],description:'Primera categoría nacional uruguaya.',source:'https://www.auf.org.uy/',type:'league'},
    {name:'Liga FUTVE',scope:'VENEZUELA',country:'Venezuela',code:'VE',flag:'🇻🇪',aliases:['liga futve','primera división venezolana','primera division venezolana'],description:'Primera división del fútbol venezolano.',source:'https://www.ligafutve.org/',type:'league'},
    {name:'GFF Elite League',scope:'GUYANA',country:'Guyana',code:'GY',flag:'🇬🇾',aliases:['gff elite league','guyana football'],description:'Primera categoría nacional de Guyana. Su sistema continental pertenece a Concacaf.',source:'https://www.guyanafootball.org/',type:'league'},
    {name:'Suriname Major League',scope:'SURINAM',country:'Suriname',code:'SR',flag:'🇸🇷',aliases:['suriname major league','surinam major league','sml'],description:'Máxima categoría nacional de Surinam. Su sistema continental pertenece a Concacaf.',source:'https://sml.sr/',type:'league'},
    {name:'CONMEBOL Libertadores',scope:'SUDAMÉRICA',code:'LIB',flag:'🏆',aliases:['libertadores','copa libertadores','conmebol libertadores'],description:'Torneo continental de clubes de Sudamérica.',source:'https://gol.conmebol.com/libertadores/es/teams',type:'continental'},
    {name:'CONMEBOL Sudamericana',scope:'SUDAMÉRICA',code:'SUD',flag:'🏆',aliases:['sudamericana','copa sudamericana','conmebol sudamericana'],description:'Competición continental de clubes sudamericanos.',source:'https://gol.conmebol.com/sudamericana/es/teams',type:'continental'}
  ];
  const DEFAULT_STATE = {username:'NitzFoxcrak',bio:'Siguiendo el fútbol sudamericano.',rupras:1000,doblones:0,activity:0,xp:0,lastDaily:'',transactions:[],visited:[],predictions:[],view:'inicio',appearance:{preset:'burgundy',accent:'#c33e67',highlight:'#f078a0',background:'#120209',panel:'#1b0610',buttonStyle:'neon',showSquares:true,showCoins:true,reduceMotion:false}};
  const LEGACY_STATE_KEY = 'foxcrakApsState';
  const ACCOUNTS_KEY = 'foxcrakApsLocalAccountsV1';
  const REMEMBERED_PROFILE_KEY = 'foxcrakApsRememberedProfile';
  let activeAccount = null;
  let authMode = 'login';
  let state = loadState();
  try {
    const balanceMigration='foxcrakRupras1000MigrationV1';
    if(localStorage.getItem(balanceMigration)!=='done' && (!state.username || state.username==='NitzFoxcrak')){
      state.rupras=1000;
      localStorage.setItem(LEGACY_STATE_KEY,JSON.stringify(state));
      localStorage.setItem(balanceMigration,'done');
    }
  } catch {}
  // Do not populate current matches from old static snapshots: show only feed-confirmed events.
  let matches = [];
  let clubDirectoryPage = 1;
  const CLUB_DIRECTORY_PAGE_SIZE = 24;
  const CLUB_LOGO_CACHE_PREFIX = 'foxcrakClubLogoSourceV2:';
  const PALADAR_BASE = 'https://paladarnegro.net/escudoteca/';
  const PALADAR_DIRS = {AR:['argentina/primeradivision/png'],BO:['bolivia/primeradivision/png'],BR:['brasil/seriea/png'],CL:['chile/primeradivision/png'],CO:['colombia/primeraa/png'],EC:['ecuador/seriea/png'],PY:['paraguay/copadeprimera/png'],PE:['peru/liga1/png'],UY:['uruguay/primeradivision/png'],VE:['venezuela/primeradivision/png']};
  const PALADAR_PATHS = {AR:'argentina',BO:'bolivia',BR:'brasil',CL:'chile',CO:'colombia',EC:'ecuador',PY:'paraguay',PE:'peru',UY:'uruguay',VE:'venezuela'};
  const PALADAR_ALIASES = {
    'AR|River Plate':['river','riverplate'],'AR|Boca Juniors':['boca','bocajuniors'],'AR|Argentinos Juniors':['argentinos','argentinosjrs'],'AR|Atlético Tucumán':['atltucuman','atleticotucuman'],'AR|Estudiantes de La Plata':['estudianteslp','estudiantesdelaplata'],'AR|Gimnasia y Esgrima La Plata':['gimnasia','gimnasialp'],'AR|Newell’s Old Boys':['newells','newellsoldboys'],'AR|San Lorenzo':['sanlorenzo'],'AR|Vélez Sarsfield':['velez','velezsarsfield'],'AR|Defensa y Justicia':['defensayjusticia'],'AR|Rosario Central':['rosariocentral'],'AR|Talleres de Córdoba':['talleres','talleresdecordoba'],
    'BO|Bolívar':['bolivar'],'BO|The Strongest':['thestrongest'],'BO|Always Ready':['alwaysready'],'BO|Oriente Petrolero':['orientepetrolero'],'BO|Nacional Potosí':['nacionalpotosi'],
    'BR|Atlético Mineiro':['atlmineiro','atleticomineiro'],'BR|Athletico Paranaense':['athleticopr','athleticoparanaense'],'BR|Red Bull Bragantino':['bragantino','redbullbragantino'],'BR|São Paulo':['saopaulo'],'BR|Grêmio':['gremio'],'BR|Internacional':['internacional'],'BR|Flamengo':['flamengo'],'BR|Palmeiras':['palmeiras'],'BR|Corinthians':['corinthians'],'BR|Vasco da Gama':['vasco'],
    'CL|Audax Italiano':['audax'],'CL|Colo-Colo':['colocolo'],'CL|Universidad de Chile':['udechile','universidaddechile'],'CL|Universidad Católica':['ucatolica','universidadcatolica'],'CL|O’Higgins':['ohiggins'],'CL|Unión La Calera':['unionlacalera'],
    'CO|Águilas Doradas':['aguilas_doradas','aguilasdoradas'],'CO|América de Cali':['americadecali','america'],'CO|Atlético Nacional':['atleticonacional'],'CO|Independiente Santa Fe':['santafe','independientesantafe'],'CO|Independiente Medellín':['independientemedellin','medellin'],'CO|Junior':['junior'],'CO|Deportivo Cali':['deportivocali'],
    'EC|LDU Quito':['ldu','lduquito'],'EC|Independiente del Valle':['independientedelvalle','idv'],'EC|Barcelona Sporting Club':['barcelona','barcelonasc'],'EC|Delfín':['delfin'],'EC|Técnico Universitario':['tecnicouniversitario'],
    'PY|Club Olimpia':['olimpia'],'PY|Cerro Porteño':['cerro','cerroporteno'],'PY|Club Libertad':['libertad'],'PY|Club Guaraní':['guarani'],'PY|Sportivo 2 de Mayo':['2demayo'],
    'PE|ADT':['adt'],'PE|Alianza Atlético':['alianza_atletico'],'PE|Alianza Lima':['alianzalima'],'PE|Atlético Grau':['atleticograu'],'PE|Los Chankas':['loschankas'],'PE|Sporting Cristal':['sportingcristal'],'PE|Universitario de Deportes':['universitario'],'PE|FBC Melgar':['melgar'],'PE|Cienciano':['cienciano'],'PE|Sport Boys':['sportboys'],'PE|Sport Huancayo':['sporthuancayo'],'PE|Deportivo Garcilaso':['deportivogarcilaso'],
    'UY|Albion':['albion'],'UY|Peñarol':['penarol'],'UY|Nacional':['nacional'],'UY|Defensor Sporting':['defensor'],'UY|Liverpool FC':['liverpool'],'UY|Montevideo City Torque':['torque'],
    'VE|Academia Puerto Cabello':['academia','academiapuertocabello'],'VE|Deportivo Táchira':['tachira','deportivotachira'],'VE|Caracas FC':['caracas'],'VE|Carabobo FC':['carabobo'],'VE|Portuguesa FC':['portuguesa']
  };
  function paladarCountryPage(code){return PALADAR_PATHS[code]?`${PALADAR_BASE}${PALADAR_PATHS[code]}/index.php`:PALADAR_BASE;}
  function paladarLogoCandidates(name, code){
    const dirs=PALADAR_DIRS[code]||[]; if(!dirs.length)return [];
    const key=`${code}|${name}`; const base=normalizeClubSearch(name);
    const withoutPrefix=base.replace(/^(club|atletico|deportivo|sportivo|sporting|universidad|independiente|real|asociacion|municipal|sociedad|union|fc|sc|ac)/,'');
    const alias=PALADAR_ALIASES[key]||[];
    const slugs=[...new Set([...alias,base,base.replace(/fc$|sc$|ac$/,''),withoutPrefix,withoutPrefix+'fc'])].filter(x=>x&&x.length>1);
    const urls=[];
    // La Escudoteca publica archivos PNG en /png/ y versiones JPG en /img/.
    for(const dir of dirs) for(const slug of slugs.slice(0,5)) urls.push(`${PALADAR_BASE}${dir}/${slug}.png`);
    for(const dir of dirs) for(const slug of slugs.slice(0,2)) urls.push(`${PALADAR_BASE}${dir.replace(/\/png$/, '/img')}/${slug}.jpg`);
    return [...new Set(urls)].slice(0,8);
  }
  function countryCodeFromHint(hint){const s=String(hint||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');const c=COUNTRIES.find(x=>x.term.some(t=>s.includes(t))||x.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')===s);return c?.short||'';}
  let competitionFilter = null;
  let realData = false;
  const ESPN_SCOREBOARD_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard';
  const AUTO_REFRESH_MS = 5 * 60 * 1000;
  const SCHEDULE_REFRESH_MS = 30 * 60 * 1000;
  let feedByDate = new Map();
  let lastFeedSuccessAt = 0;
  let nextFeedRefreshAt = Date.now() + AUTO_REFRESH_MS;
  let lastScheduleRefreshAt = 0;
  let lastScheduleDate = '';
  let feedRefreshBusy = false;
  let feedFailureCount = 0;
  let latestFeedLabel = 'ESPERANDO DATOS';
  let liveStatus = 'today';
  let countryKey = 'LATAM';
  let calendarMode = 'today';
  let searchText = '';
  let toastTimer = null;
  const VIEW_TITLES = {inicio:'CENTRO',live:'PARTIDOS Y RESULTADOS',calendar:'CALENDARIO',competitions:'COMPETICIONES',clubdirectory:'CLUBES SUDAMERICANOS',ranking:'TOPS Y RANKINGS',stats:'ESTADÍSTICAS',wallet:'RUPRAS Y DOBLONES',rewards:'LOGROS',profile:'MI PERFIL',latam:'FÚTBOL LATAM',settings:'CONFIGURACIÓN',community:'COMUNIDAD',info:'INFORMACIÓN'};
  const ONLINE_COMMUNITY_CONFIG_KEY = 'foxcrakApsOnlineCommunityConfigV2';
  const GLOBAL_SESSION_KEY = 'foxcrakApsGlobalSessionV1';
  const ONLINE_DIRECTORY_CALLBACK = 'FoxcrakAPSDirectoryCallback';
  let onlineCommunityProfiles = [];
  let onlineDirectoryState = 'not-configured';
  let onlineDirectoryUpdatedAt = '';
  let onlineDirectoryRequestTimer = null;
  let onlineDirectoryScript = null;
  let globalSession = null;
  let globalAuthFrameReady = false;
  let pendingGlobalFrameMessage = null;
  let globalProgressSyncTimer = null;
  let globalHeartbeatTimer = null;

  function readOnlineCommunityConfig(){
    const defaults = window.FOXCRAK_COMMUNITY_CONFIG && typeof window.FOXCRAK_COMMUNITY_CONFIG === 'object' ? window.FOXCRAK_COMMUNITY_CONFIG : {};
    try {
      const value = JSON.parse(localStorage.getItem(ONLINE_COMMUNITY_CONFIG_KEY) || '{}');
      return { endpointUrl: (typeof value.endpointUrl === 'string' && value.endpointUrl.trim()) ? value.endpointUrl.trim() : (typeof defaults.endpointUrl === 'string' ? defaults.endpointUrl.trim() : '') };
    } catch { return { endpointUrl: typeof defaults.endpointUrl === 'string' ? defaults.endpointUrl.trim() : '' }; }
  }
  function isAppsScriptEndpoint(value){
    try { const u = new URL(value); return u.protocol === 'https:' && u.hostname === 'script.google.com' && /^\/macros\/s\/[^/]+\/exec\/?$/.test(u.pathname); } catch { return false; }
  }
  function globalAuthURL(endpoint){
    try { const u=new URL(endpoint);u.search='?mode=auth&v=2';u.hash='';return u.toString(); } catch { return ''; }
  }
  function updateOnlineCommunityUI(){
    const cfg=readOnlineCommunityConfig();
    const endpointInput=$('#communityEndpointInput');
    if(endpointInput) endpointInput.value=cfg.endpointUrl;
    const badge=$('#onlineConfigBadge');
    if(badge){badge.textContent=isAppsScriptEndpoint(cfg.endpointUrl)?'ENDPOINT CONFIGURADO':'SIN CONFIGURAR';badge.classList.toggle('connected',isAppsScriptEndpoint(cfg.endpointUrl));}
    const ready=isAppsScriptEndpoint(cfg.endpointUrl);
    const note=$('#globalAuthFrameNote');
    if(note) note.textContent=ready?'Servicio configurado. Usa REGÍSTRATE o INICIAR SESIÓN dentro del panel.':'Publica la aplicación web de Apps Script y pega su URL /exec en Ajustes.';
    const join=$('#communityJoinLink');
    if(join){join.disabled=!ready;join.classList.toggle('is-disabled',!ready);join.title=ready?'Abrir registro global':'Configura primero el endpoint de Apps Script';}
    if(!ready && onlineDirectoryState==='not-configured') setOnlineCommunityMessages('Configura el endpoint de Apps Script en Ajustes para activar registro y ranking global.','muted');
  }
  function configureGlobalAuthFrame(force=false){
    const cfg=readOnlineCommunityConfig();const frame=$('#globalAuthFrame');
    if(!frame)return;
    const url=isAppsScriptEndpoint(cfg.endpointUrl)?globalAuthURL(cfg.endpointUrl):'';
    if(!url){frame.removeAttribute('src');globalAuthFrameReady=false;pendingGlobalFrameMessage=null;return;}
    if(force || frame.dataset.configuredUrl!==url){
      globalAuthFrameReady=false;frame.dataset.configuredUrl=url;frame.src=url;
    }
  }
  function initializeOnlineCommunity(){
    updateOnlineCommunityUI();configureGlobalAuthFrame();
    const cfg=readOnlineCommunityConfig();
    if(cfg.endpointUrl && isAppsScriptEndpoint(cfg.endpointUrl)) loadOnlineCommunityDirectory(true);
    else renderOnlineRanking();
  }
  function setOnlineCommunityMessages(message,kind='muted'){
    ['onlineCommunityConfigMessage','communityDirectoryStatus'].forEach(id=>{const el=$('#'+id);if(el){el.textContent=message;el.dataset.kind=kind;}});
  }
  function sendGlobalFrameMessage(message){
    const frame=$('#globalAuthFrame');
    if(!frame || !frame.contentWindow){pendingGlobalFrameMessage=message;return false;}
    if(!globalAuthFrameReady){pendingGlobalFrameMessage=message;return false;}
    try{frame.contentWindow.postMessage(message,'*');return true;}catch{pendingGlobalFrameMessage=message;return false;}
  }
  function flushGlobalFrameMessage(){
    if(!globalAuthFrameReady)return;
    if(pendingGlobalFrameMessage){const msg=pendingGlobalFrameMessage;pendingGlobalFrameMessage=null;sendGlobalFrameMessage(msg);}
    else {const saved=getStoredGlobalSession();if(saved && saved.token && !globalSession){sendGlobalFrameMessage({type:'FOXCRAK_VALIDATE_SESSION',token:saved.token});}}
  }
  function getStoredGlobalSession(){
    try{return JSON.parse(sessionStorage.getItem(GLOBAL_SESSION_KEY)||localStorage.getItem(GLOBAL_SESSION_KEY)||'null');}catch{return null;}
  }
  function persistGlobalSession(token,profile,remember){
    const value=JSON.stringify({token,profile,remember:!!remember});
    try{
      if(remember){localStorage.setItem(GLOBAL_SESSION_KEY,value);sessionStorage.removeItem(GLOBAL_SESSION_KEY);}
      else{sessionStorage.setItem(GLOBAL_SESSION_KEY,value);localStorage.removeItem(GLOBAL_SESSION_KEY);}
    }catch{try{sessionStorage.setItem(GLOBAL_SESSION_KEY,value);}catch{}}
  }
  function clearStoredGlobalSession(){try{sessionStorage.removeItem(GLOBAL_SESSION_KEY);localStorage.removeItem(GLOBAL_SESSION_KEY);}catch{}}
  function progressPayload(){return {xp:Math.max(0,Math.floor(Number(state.xp)||0)),activity:Math.max(0,Math.floor(Number(state.activity)||0))};}
  function queueGlobalProgressSync(){
    if(!activeAccount?.online || !globalSession?.token)return;
    if(globalProgressSyncTimer)clearTimeout(globalProgressSyncTimer);
    globalProgressSyncTimer=setTimeout(()=>{
      globalProgressSyncTimer=null;
      sendGlobalFrameMessage({type:'FOXCRAK_SAVE_PROGRESS',token:globalSession.token,progress:progressPayload()});
    },700);
  }
  function setupGlobalHeartbeat(){
    if(globalHeartbeatTimer)clearInterval(globalHeartbeatTimer);
    globalHeartbeatTimer=setInterval(()=>{
      if(activeAccount?.online&&globalSession?.token)sendGlobalFrameMessage({type:'FOXCRAK_HEARTBEAT',token:globalSession.token});
    },60000);
  }
  function activateOnlineAccount(profile,token,remember=false){
    if(!profile || !profile.userId || !profile.nickname || !token){notify('La respuesta de cuenta global está incompleta.');return;}
    globalSession={token,profile};persistGlobalSession(token,profile,remember);
    const account={id:String(profile.userId),username:String(profile.nickname),usernameKey:normalizeUsername(profile.nickname),createdAt:profile.registeredAt||new Date().toISOString(),status:String(profile.status||'Activo').toLowerCase()==='suspendido'?'suspended':'active',online:true,serie:String(profile.serie||'')};
    activeAccount=account;
    const local=loadProfileState(account,false);
    state=mergeState({...local,username:account.username,xp:Math.max(0,Number(profile.xp)||0),activity:Math.max(0,Number(profile.activity)||0)},account.username);
    sessionStorage.setItem('foxcrakApsSession',account.id);
    $('#authGate').hidden=true;$('#appShell').hidden=false;
    applyAppearance();renderAll();$('#profileBio').value=state.bio||'';
    if(state.view&&$('#view-'+state.view))setView(state.view,false);
    $('#activeLoginName').textContent=`${account.username} · ${account.serie}`;$('#localAccountUser').textContent=`${account.username} · ${account.serie}`;
    queueGlobalProgressSync();setupGlobalHeartbeat();loadOnlineCommunityDirectory(true);
    notify(`Sesión global iniciada: ${account.username} (${account.serie}).`);
  }
  function handleGlobalAuthMessages(event){
    const frame=$('#globalAuthFrame');if(!frame||event.source!==frame.contentWindow)return;
    const host=(()=>{try{return new URL(event.origin).hostname;}catch{return '';}})();
    if(!(host==='script.google.com'||host.endsWith('.googleusercontent.com')))return;
    const data=event.data||{};if(!data||typeof data.type!=='string')return;
    if(data.type==='FOXCRAK_AUTH_READY'){
      globalAuthFrameReady=true;flushGlobalFrameMessage();
    }else if(data.type==='FOXCRAK_AUTH_SUCCESS'){
      globalAuthFrameReady=true;
      if(!data.profile||!data.token){notify('No se recibió el perfil o token global.');return;}
      activateOnlineAccount(data.profile,data.token,!!data.remember);
    }else if(data.type==='FOXCRAK_SESSION_RESULT'){
      if(data.result&&data.result.ok&&data.result.profile){
        const saved=getStoredGlobalSession();activateOnlineAccount(data.result.profile,data.token||(saved&&saved.token),!!(saved&&saved.remember));
      }else{
        clearStoredGlobalSession();globalSession=null;
        showAuthGate(data.result&&data.result.error?data.result.error:'Tu sesión global caducó. Inicia sesión nuevamente.');
        setAuthMode('online');
      }
    }else if(data.type==='FOXCRAK_PROGRESS_RESULT'){
      if(data.result&&data.result.ok){onlineDirectoryState='connected';}
      else if(data.result&&data.result.error){notify('No se pudo sincronizar el progreso: '+data.result.error);}
    }else if(data.type==='FOXCRAK_LOGOUT_RESULT'){
      // El mensaje de resultado solo confirma la revocación; la interfaz ya volvió al acceso.
    }else if(data.type==='FOXCRAK_AUTH_CANCEL'){
      if(activeAccount){$('#authGate').hidden=true;$('#appShell').hidden=false;}else{setAuthMode('login');}
    }
  }
  window.addEventListener('message',handleGlobalAuthMessages);
  function onlineStatusInfo(status){
    const value = String(status || 'Activo').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    if (value.includes('suspend') || value.includes('bloque')) return {text:'SUSPENDIDO', cls:'suspended', rank:2};
    if (value.includes('revision') || value.includes('pendient')) return {text:'EN REVISIÓN', cls:'pending', rank:1};
    if (value.includes('privad')) return {text:'PRIVADO', cls:'private', rank:3};
    if (value.includes('desconect')) return {text:'DESCONECTADO', cls:'inactive', rank:1};
    return {text:'ACTIVO', cls:'active', rank:0};
  }
  function renderOnlineRanking(){
    const tbodies = $$('.online-ranking-table-body');
    if (!tbodies.length) return;
    const cfg = readOnlineCommunityConfig();
    const profiles = [...onlineCommunityProfiles].sort((a,b)=>{
      const sa=onlineStatusInfo(a.status), sb=onlineStatusInfo(b.status);
      return sa.rank-sb.rank || b.xp-a.xp || a.nickname.localeCompare(b.nickname,'es');
    });
    const badgeText=onlineDirectoryState==='connected'?'DIRECTORIO ONLINE':onlineDirectoryState==='loading'?'CARGANDO…':onlineDirectoryState==='error'?'ERROR DE CONEXIÓN':cfg.endpointUrl?'PENDIENTE DE PRUEBA':'SIN CONFIGURAR';
    $$('.online-rank-badge').forEach(badge=>{badge.textContent=badgeText;badge.classList.toggle('connected',onlineDirectoryState==='connected');});
    const countText=`${profiles.length} ${profiles.length===1?'perfil público':'perfiles públicos'}`;
    $$('.online-rank-count').forEach(count=>count.textContent=countText);
    const updatedText=onlineDirectoryUpdatedAt?`Actualizado ${onlineDirectoryUpdatedAt}`:'Sin actualización';
    $$('.online-rank-updated').forEach(updated=>updated.textContent=updatedText);
    if (!profiles.length) {
      let message='Configura el endpoint global de Apps Script en Ajustes para cargar el directorio online.';
      if(onlineDirectoryState==='loading') message='Consultando el directorio público…';
      else if(onlineDirectoryState==='connected') message='No hay miembros registrados todavía. Crea una cuenta global; el formulario explica qué datos del perfil aparecen en la comunidad.';
      else if(onlineDirectoryState==='error') message='No se pudo leer el directorio. Revisa el endpoint y la publicación de Apps Script.';
      const markup=`<tr><td colspan="7">${esc(message)}</td></tr>`;
      tbodies.forEach(tbody=>tbody.innerHTML=markup);
      return;
    }
    const markup=profiles.map((p,index)=>{
      const status=onlineStatusInfo(p.status);
      return `<tr><td>${String(index+1).padStart(2,'0')}</td><td><span class="online-series">${esc(p.serie || '—')}</span></td><td><span class="table-team">${esc(p.nickname)}</span></td><td>${esc(p.club || '—')}</td><td>${fmt(p.xp)} XP</td><td>NIVEL ${String(p.level).padStart(2,'0')}</td><td><span class="online-status status-${status.cls}">${status.text}</span></td></tr>`;
    }).join('');
    tbodies.forEach(tbody=>tbody.innerHTML=markup);
  }
  function loadOnlineCommunityDirectory(quiet=false){
    const cfg=readOnlineCommunityConfig();
    if(!cfg.endpointUrl || !isAppsScriptEndpoint(cfg.endpointUrl)){
      onlineDirectoryState='not-configured';
      renderOnlineRanking();
      if(!quiet) setOnlineCommunityMessages('Pega una URL de despliegue válida de Google Apps Script que termine en /exec.', 'error');
      return;
    }
    if(onlineDirectoryScript){onlineDirectoryScript.remove();onlineDirectoryScript=null;}
    if(onlineDirectoryRequestTimer){clearTimeout(onlineDirectoryRequestTimer);onlineDirectoryRequestTimer=null;}
    onlineDirectoryState='loading';
    setOnlineCommunityMessages('Conectando con el directorio público…','muted');
    renderOnlineRanking();
    let settled=false;
    const finish=()=>{settled=true;if(onlineDirectoryRequestTimer){clearTimeout(onlineDirectoryRequestTimer);onlineDirectoryRequestTimer=null;}if(onlineDirectoryScript){onlineDirectoryScript.remove();onlineDirectoryScript=null;}try{delete window[ONLINE_DIRECTORY_CALLBACK];}catch{window[ONLINE_DIRECTORY_CALLBACK]=undefined;}};
    window[ONLINE_DIRECTORY_CALLBACK]=(payload)=>{
      if(settled)return;
      finish();
      if(!payload || payload.ok!==true || !Array.isArray(payload.profiles)){
        onlineDirectoryState='error';
        setOnlineCommunityMessages('La respuesta del endpoint no tiene el formato esperado.','error');
        renderOnlineRanking();
        return;
      }
      onlineCommunityProfiles=payload.profiles.filter(p=>p && String(p.nickname||'').trim()).map(p=>({
        serie:String(p.serie||'').slice(0,32), nickname:String(p.nickname||'').trim().slice(0,48), club:String(p.club||'').trim().slice(0,80),
        xp:Math.max(0,Number.parseInt(p.xp,10)||0), level:Math.max(1,Number.parseInt(p.level,10)||1),
        status:String(p.status||'Activo').slice(0,30), registeredAt:String(p.registeredAt||'').slice(0,40)
      }));
      onlineDirectoryState='connected';
      onlineDirectoryUpdatedAt=new Date().toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'});
      setOnlineCommunityMessages(`Directorio cargado: ${onlineCommunityProfiles.length} perfiles públicos. Los datos provienen de la base global.`, 'success');
      renderOnlineRanking();
      if(!quiet) notify(`Directorio online actualizado: ${onlineCommunityProfiles.length} perfiles.`);
    };
    onlineDirectoryScript=document.createElement('script');
    onlineDirectoryScript.async=true;
    onlineDirectoryScript.onerror=()=>{if(settled)return;finish();onlineDirectoryState='error';setOnlineCommunityMessages('No se pudo leer Apps Script. Comprueba que esté desplegado como aplicación web y accesible para lectores públicos.','error');renderOnlineRanking();if(!quiet)notify('No se pudo actualizar el directorio online.');};
    try{
      const url=new URL(cfg.endpointUrl);url.searchParams.set('callback',ONLINE_DIRECTORY_CALLBACK);url.searchParams.set('_',String(Date.now()));
      onlineDirectoryScript.src=url.toString();
      document.head.appendChild(onlineDirectoryScript);
      onlineDirectoryRequestTimer=setTimeout(()=>{if(settled)return;finish();onlineDirectoryState='error';setOnlineCommunityMessages('Tiempo de espera agotado. Comprueba el endpoint y vuelve a intentar.','error');renderOnlineRanking();},15000);
    }catch{
      finish();onlineDirectoryState='error';setOnlineCommunityMessages('La URL del endpoint no es válida.','error');renderOnlineRanking();
    }
  }
  function saveOnlineCommunitySettings(event){
    event.preventDefault();
    const endpointUrl=$('#communityEndpointInput').value.trim();
    if(endpointUrl && !isAppsScriptEndpoint(endpointUrl)){setOnlineCommunityMessages('La URL debe ser de Apps Script y terminar en /exec.','error');return;}
    const cfg={endpointUrl};
    try{localStorage.setItem(ONLINE_COMMUNITY_CONFIG_KEY,JSON.stringify(cfg));}
    catch{setOnlineCommunityMessages('No se pudo guardar la configuración local. Revisa el almacenamiento del navegador.','error');return;}
    onlineDirectoryState='not-configured';onlineCommunityProfiles=[];
    updateOnlineCommunityUI();configureGlobalAuthFrame(true);
    if(endpointUrl){loadOnlineCommunityDirectory(false);setOnlineCommunityMessages('Endpoint guardado. Si acabas de desplegar el script, prueba la conexión.','muted');}
    else{renderOnlineRanking();setOnlineCommunityMessages('Configuración guardada sin endpoint. El acceso global queda desactivado.','muted');}
    notify('Configuración de cuenta global guardada en este navegador.');
  }
  function openGlobalAuth(mode='register'){
    const cfg=readOnlineCommunityConfig();
    if(!isAppsScriptEndpoint(cfg.endpointUrl)){notify('Primero configura la URL /exec de Apps Script en Ajustes.');setView('settings');return;}
    configureGlobalAuthFrame();
    if(activeAccount)saveState();
    $('#authGate').hidden=false;$('#appShell').hidden=true;setAuthMode('online');
    // The embedded auth page defaults to registration; its own tabs let the user log in.
    const frame=$('#globalAuthFrame');
    const frameMessage={type:'FOXCRAK_SET_AUTH_MODE',mode:mode};
    if(frame && globalAuthFrameReady){try{frame.contentWindow.postMessage(frameMessage,'*');}catch{pendingGlobalFrameMessage=frameMessage;}}
    else pendingGlobalFrameMessage=frameMessage;
  }
  function toggleCommunityForm(){openGlobalAuth('register');}


  function mergeState(saved, username='Perfil APS') {
    const data = saved && typeof saved === 'object' ? saved : {};
    return {...DEFAULT_STATE,...data,username:data.username||username,appearance:{...DEFAULT_STATE.appearance,...(data.appearance||{})},transactions:Array.isArray(data.transactions)?data.transactions:[],visited:Array.isArray(data.visited)?data.visited:[],predictions:Array.isArray(data.predictions)?data.predictions:[]};
  }
  function loadState(){try{return mergeState(JSON.parse(localStorage.getItem(LEGACY_STATE_KEY)||'{}'));}catch{return mergeState({},DEFAULT_STATE.username);}}
  function loadProfileState(account, migrateLegacy=false){
    try {
      const saved=localStorage.getItem(profileStorageKey(account.id));
      if(saved){
        const profile=mergeState(JSON.parse(saved),account.username);
        // One-time correction requested for the default Owner profile; afterwards the balance is preserved normally.
        const migrationKey=`foxcrakRupras1000ProfileMigration:${account.id}`;
        if(account.username==='NitzFoxcrak'&&localStorage.getItem(migrationKey)!=='done'){
          profile.rupras=1000;
          localStorage.setItem(profileStorageKey(account.id),JSON.stringify(profile));
          localStorage.setItem(migrationKey,'done');
        }
        return profile;
      }
    } catch {}
    if(migrateLegacy){
      try {
        const legacy=localStorage.getItem(LEGACY_STATE_KEY);
        if(legacy && localStorage.getItem('foxcrakApsLegacyMigratedV1')!=='1'){
          const migrated=mergeState(JSON.parse(legacy),account.username);
          migrated.username=account.username;
          localStorage.setItem(profileStorageKey(account.id),JSON.stringify(migrated));
          localStorage.setItem('foxcrakApsLegacyMigratedV1','1');
          return migrated;
        }
      } catch {}
    }
    return mergeState({},account.username);
  }
  function profileStorageKey(accountId){return `foxcrakApsProfile:${accountId}`;}
  function saveState(){
    try {
      if(activeAccount) localStorage.setItem(profileStorageKey(activeAccount.id),JSON.stringify(state));
      else localStorage.setItem(LEGACY_STATE_KEY,JSON.stringify(state));
    } catch { notify('No se pudo guardar: el navegador puede tener el almacenamiento lleno o bloqueado.'); }
    if(activeAccount?.online) queueGlobalProgressSync();
  }
  function listAccounts(){try{const list=JSON.parse(localStorage.getItem(ACCOUNTS_KEY)||'[]');return Array.isArray(list)?list.filter(a=>a&&a.id&&a.username&&a.usernameKey&&a.salt&&a.passwordHash).map(a=>({...a,status:a.status==='suspended'?'suspended':'active'})):[];}catch{return [];}}
  function storeAccounts(accounts){localStorage.setItem(ACCOUNTS_KEY,JSON.stringify(accounts));}
  function normalizeUsername(name){return String(name||'').trim().normalize('NFKC').toLocaleLowerCase('es');}
  function validateUsername(name){return /^[\p{L}\p{N}][\p{L}\p{N}._ -]{2,23}$/u.test(String(name||'').trim());}
  function toBase64(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s);}
  function fromBase64(value){return Uint8Array.from(atob(value),c=>c.charCodeAt(0));}
  async function derivePasswordHash(password,salt){
    if(!window.crypto||!window.crypto.subtle) throw new Error('Este navegador no ofrece el cifrado necesario. Abre el proyecto en un navegador actualizado mediante localhost o HTTPS.');
    const material=await window.crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
    const bits=await window.crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:180000,hash:'SHA-256'},material,256);
    return toBase64(new Uint8Array(bits));
  }
  function bytesEqual(a,b){if(a.length!==b.length)return false;let v=0;for(let i=0;i<a.length;i++)v|=a[i]^b[i];return v===0;}
  function setAuthMessage(message,kind='muted'){const el=$('#authMessage');el.textContent=message;el.dataset.kind=kind;}
  function setAuthMode(mode){
    authMode=mode==='register'?'register':mode==='online'?'online':'login';
    const online=authMode==='online', registering=authMode==='register';
    $('#authModeLogin').classList.toggle('active',authMode==='login');$('#authModeRegister').classList.toggle('active',registering);$('#authModeOnline').classList.toggle('active',online);
    $('#authModeLogin').setAttribute('aria-pressed',String(authMode==='login'));$('#authModeRegister').setAttribute('aria-pressed',String(registering));$('#authModeOnline').setAttribute('aria-pressed',String(online));
    $('#localAuthForm').hidden=online;$('#authLocalNote').hidden=online;$('#globalAuthWrap').hidden=!online;
    if(online){
      $('#authGateTitle').innerHTML='CUENTA GLOBAL<br><span>Tu progreso en todos tus dispositivos.</span>';
      $('.auth-intro').textContent='Regístrate o inicia sesión con nickname y contraseña en el servicio global de FOXCRAK.';
      $('#globalAuthFrameNote').textContent=isAppsScriptEndpoint(readOnlineCommunityConfig().endpointUrl)?'El registro está alojado en Apps Script; la hoja guarda solo una verificación derivada de la contraseña.':'Configura la URL /exec en Ajustes. Mientras tanto, el acceso global no está disponible.';
      configureGlobalAuthFrame();
    }else{
      $('#authConfirmWrap').hidden=!registering;$('#authConfirmPassword').required=registering;$('#authPassword').autocomplete=registering?'new-password':'current-password';
      $('#authSubmitBtn').innerHTML=registering?'REGISTRAR PERFIL LOCAL <span>↗</span>':'ENTRAR AL SISTEMA <span>↗</span>';
      $('#authGateTitle').innerHTML=registering?'REGÍSTRATE<br><span>Tu perfil, tu progreso.</span>':'BIENVENIDO/A<br><span>Continúa tu progreso.</span>';
      $('.auth-intro').textContent=registering?'Elige un nickname y una contraseña para crear un perfil solo en este dispositivo.':'Entra con el perfil guardado en este navegador.';
      setAuthMessage(registering?'El perfil local no aparece en el ranking global.':'Los perfiles locales se guardan solo en este dispositivo.','muted');
    }
  }
  function showAuthGate(message=''){
    $('#appShell').hidden=true;$('#authGate').hidden=false;
    const accounts=listAccounts(),cfg=readOnlineCommunityConfig();
    setAuthMode(isAppsScriptEndpoint(cfg.endpointUrl)?'online':accounts.length?'login':'register');
    if(message){if(authMode==='online')$('#globalAuthFrameNote').textContent=message;else setAuthMessage(message,'muted');}
    $('#authUsername').value='';$('#authPassword').value='';$('#authConfirmPassword').value='';$('#rememberProfile').checked=false;
    if(authMode!=='online')$('#authUsername').focus({preventScroll:true});
  }
  function activateAccount(account,remember=false,migrateLegacy=false){
    if(account?.status==='suspended'){showAuthGate(`El perfil «${account.username}» está suspendido en este dispositivo.`);return false;}
    activeAccount=account;state=loadProfileState(account,migrateLegacy);state.username=state.username||account.username;
    if(account.username==='NitzFoxcrak'){
      try{const migrationKey=`foxcrakRupras1000ProfileMigration:${account.id}`;if(localStorage.getItem(migrationKey)!=='done'){state.rupras=1000;localStorage.setItem(migrationKey,'done');}}catch{}
    }
    sessionStorage.setItem('foxcrakApsSession',account.id);
    if(remember)localStorage.setItem(REMEMBERED_PROFILE_KEY,account.id);else localStorage.removeItem(REMEMBERED_PROFILE_KEY);
    $('#authGate').hidden=true;$('#appShell').hidden=false;
    applyAppearance();renderAll();$('#profileBio').value=state.bio||'';
    if(state.view&&$('#view-'+state.view))setView(state.view,false);
    saveState();
    switchDemoSilent();
    $('#activeLoginName').textContent=account.username;$('#localAccountUser').textContent=account.username;return true;
  }
  async function handleLocalAuth(event){
    event.preventDefault();const mode=authMode;const username=$('#authUsername').value.trim(),password=$('#authPassword').value;
    if(!validateUsername(username)){setAuthMessage('Usa entre 3 y 24 caracteres: letras, números, espacios, punto, guion o guion bajo.','error');return;}
    if(password.length<8){setAuthMessage('La contraseña debe tener al menos 8 caracteres.','error');return;}
    const accounts=listAccounts(),usernameKey=normalizeUsername(username);
    $('#authSubmitBtn').disabled=true;$('#authModeLogin').disabled=true;$('#authModeRegister').disabled=true;$('#authSubmitBtn').setAttribute('aria-busy','true');$('#authSubmitBtn').textContent='PROCESANDO…';
    try{
      if(mode==='register'){
        if(password!==$('#authConfirmPassword').value){setAuthMessage('Las contraseñas no coinciden.','error');return;}
        if(accounts.some(a=>a.usernameKey===usernameKey)){setAuthMessage('Ya existe un perfil con ese nombre en este dispositivo.','error');return;}
        const saltBytes=new Uint8Array(16);window.crypto.getRandomValues(saltBytes);const salt=toBase64(saltBytes);const passwordHash=await derivePasswordHash(password,saltBytes);
        const id=(window.crypto.randomUUID?window.crypto.randomUUID():`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);
        const account={id,username,usernameKey,salt,passwordHash,createdAt:new Date().toISOString(),status:'active'};
        accounts.push(account);storeAccounts(accounts);
        let migrateLegacy=false;try{const legacyState=JSON.parse(localStorage.getItem(LEGACY_STATE_KEY)||'null');const legacyName=String(legacyState?.username||DEFAULT_STATE.username);migrateLegacy=accounts.length===1&&!!legacyState&&normalizeUsername(legacyName)===usernameKey;}catch{migrateLegacy=false;}
        activateAccount(account,$('#rememberProfile').checked,migrateLegacy);
        setAuthMessage('Perfil creado. Tus datos quedarán guardados en este navegador.','success');notify(`Perfil local «${username}» creado.`);
      }else{
        const account=accounts.find(a=>a.usernameKey===usernameKey);
        if(!account){setAuthMessage('No se encontró ese perfil en este dispositivo. Revisa el nombre o crea uno nuevo.','error');return;}
        let matches=false;try{const actual=await derivePasswordHash(password,fromBase64(account.salt));matches=bytesEqual(fromBase64(actual),fromBase64(account.passwordHash));}catch(err){throw err;}
        if(!matches){setAuthMessage('La contraseña no es correcta.','error');return;}
        if(account.status==='suspended'){setAuthMessage('Este perfil está SUSPENDIDO en este dispositivo y no puede iniciar sesión.','error');return;}
        activateAccount(account,$('#rememberProfile').checked,false);notify(`Bienvenido/a, ${account.username}.`);
      }
    }catch(err){setAuthMessage(err?.message||'No se pudo crear o abrir el perfil.','error');}
    finally{$('#authSubmitBtn').removeAttribute('aria-busy');$('#authSubmitBtn').disabled=false;$('#authModeLogin').disabled=false;$('#authModeRegister').disabled=false;$('#authSubmitBtn').innerHTML=authMode==='register'?'CREAR PERFIL LOCAL <span>↗</span>':'ENTRAR AL SISTEMA <span>↗</span>';}
  }
  function logoutLocal(){
    const name=activeAccount?.username||'';
    if(activeAccount?.online&&globalSession?.token){sendGlobalFrameMessage({type:'FOXCRAK_LOGOUT',token:globalSession.token,progress:progressPayload()});}
    else if(activeAccount)saveState();
    activeAccount=null;globalSession=null;sessionStorage.removeItem('foxcrakApsSession');clearStoredGlobalSession();localStorage.removeItem(REMEMBERED_PROFILE_KEY);
    if(globalHeartbeatTimer){clearInterval(globalHeartbeatTimer);globalHeartbeatTimer=null;}
    showAuthGate(name?`Sesión cerrada para «${name}». El progreso global ya estaba guardado.`:'Elige un perfil local o inicia sesión global.');
  }
  function restoreAccountSession(){
    const stored=getStoredGlobalSession();
    if(stored&&stored.token){
      globalSession=stored;$('#authGate').hidden=false;$('#appShell').hidden=true;setAuthMode('online');
      pendingGlobalFrameMessage={type:'FOXCRAK_VALIDATE_SESSION',token:stored.token};flushGlobalFrameMessage();
      return;
    }
    const accounts=listAccounts();const rememberedId=localStorage.getItem(REMEMBERED_PROFILE_KEY);const remembered=rememberedId?accounts.find(a=>a.id===rememberedId):null;
    if(remembered&&remembered.status!=='suspended'){activateAccount(remembered,true,false);return;}
    if(remembered&&remembered.status==='suspended')localStorage.removeItem(REMEMBERED_PROFILE_KEY);
    showAuthGate(remembered&&remembered.status==='suspended'?'El perfil guardado está suspendido. Inicia con otro perfil o revisa el estado local.':accounts.length?'Inicia sesión o crea un perfil local en este dispositivo.':'Configura la cuenta global o crea un perfil local para comenzar.');
  }
  function notify(message){const toast=$('#toast');toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2900);}
  function createAmbient(){const parent=$('#ambient');parent.innerHTML='';for(let i=0;i<38;i++){const el=document.createElement('span');el.className='ambient-square';el.style.setProperty('--x',`${Math.random()*100}%`);el.style.setProperty('--size',`${7+Math.random()*24}px`);el.style.setProperty('--dur',`${11+Math.random()*20}s`);el.style.setProperty('--delay',`${-Math.random()*27}s`);el.style.setProperty('--rot',`${Math.floor(Math.random()*120)}deg`);el.style.setProperty('--drift',`${Math.floor(Math.random()*100-50)}px`);parent.appendChild(el);}for(let i=0;i<10;i++){const el=document.createElement('span');el.className='ambient-coin';el.textContent=i%2?'D//':'R/.';el.style.setProperty('--x',`${Math.random()*100}%`);el.style.setProperty('--dur',`${15+Math.random()*20}s`);el.style.setProperty('--delay',`${-Math.random()*30}s`);el.style.setProperty('--drift',`${Math.floor(Math.random()*120-60)}px`);parent.appendChild(el);}}
  const THEME_PRESETS={
    burgundy:{accent:'#c33e67',highlight:'#f078a0',background:'#120209',panel:'#1b0610'},
    cyan:{accent:'#118fa3',highlight:'#68e0ef',background:'#061116',panel:'#0d2027'},
    emerald:{accent:'#16856b',highlight:'#61e0ad',background:'#06120f',panel:'#0d211b'},
    violet:{accent:'#7546d8',highlight:'#ba9aff',background:'#0e0819',panel:'#1a112b'},
    amber:{accent:'#a86c17',highlight:'#f4c66b',background:'#151006',panel:'#251b0a'}
  };
  function applyAppearance(syncControls=true){
    const a={...DEFAULT_STATE.appearance,...(state.appearance||{})};
    const root=document.documentElement;
    root.style.setProperty('--red',a.accent);root.style.setProperty('--pink',a.highlight);
    root.style.setProperty('--bg',a.background);root.style.setProperty('--panel',a.panel);
    root.style.setProperty('--panel-2',`color-mix(in srgb, ${a.panel} 82%, ${a.background})`);
    root.style.setProperty('--border',`color-mix(in srgb, ${a.accent} 35%, ${a.background})`);
    root.style.setProperty('--border-bright',a.accent);
    document.body.dataset.buttonStyle=a.buttonStyle||'neon';
    document.body.dataset.theme=a.preset||'custom';
    if(syncControls){
      [['accentColor',a.accent],['highlightColor',a.highlight],['backgroundColor',a.background],['panelColor',a.panel]].forEach(([id,value])=>{const el=$('#'+id);if(el)el.value=value;});
      const style=$('#buttonStyle');if(style)style.value=a.buttonStyle||'neon';
      const squares=$('#toggleSquares');if(squares)squares.checked=a.showSquares!==false;
      const coins=$('#toggleCoins');if(coins)coins.checked=a.showCoins!==false;
      const motion=$('#reduceMotion');if(motion)motion.checked=!!a.reduceMotion;
      $$('.theme-preset').forEach(btn=>btn.classList.toggle('active',btn.dataset.preset===a.preset));
    }
    $$('.ambient-square').forEach(el=>el.style.display=a.showSquares===false?'none':'');
    $$('.ambient-coin').forEach(el=>el.style.display=a.showCoins===false?'none':'');
    document.body.classList.toggle('reduce-motion',!!a.reduceMotion);
  }
  function updateAppearance(patch, message='Apariencia guardada en este navegador.'){
    state.appearance={...DEFAULT_STATE.appearance,...state.appearance,...patch};
    if(patch.accent||patch.highlight||patch.background||patch.panel)state.appearance.preset='custom';
    applyAppearance();saveState();const msg=$('#themeMessage');if(msg)msg.textContent=message;
  }
  function choosePreset(name){const preset=THEME_PRESETS[name];if(!preset)return;state.appearance={...state.appearance,...preset,preset:name};applyAppearance();saveState();const msg=$('#themeMessage');if(msg)msg.textContent=`Paleta «${name==='burgundy'?'Granate APS':name==='cyan'?'Neón ártico':name==='emerald'?'Esmeralda':name==='violet'?'Violeta':'Ámbar'}» aplicada y guardada.`;notify('Paleta visual actualizada.');}
  function setView(name, recordVisit=true){if(!$('#view-'+name))name='inicio';if(name==='ranking'||name==='community')loadOnlineCommunityDirectory(true);$$('.page-view').forEach(v=>v.classList.toggle('active-view',v.id==='view-'+name));$$('.nav-item[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));$('#crumbTitle').textContent=VIEW_TITLES[name]||'CENTRO';state.view=name;if(recordVisit){if(!state.visited.includes(name))state.visited.push(name);state.activity++;state.xp+=2;saveState();}$('#sidebar').classList.remove('open');renderAll();window.scrollTo({top:0,behavior:document.body.classList.contains('reduce-motion')?'auto':'smooth'});}
  function safePhotoData(value){const s=typeof value==='string'?value:'';return s.length<260000&&/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s)?s:'';}
  function avatarMarkup(photo, initials, extraClass='rank-mini-avatar'){const data=safePhotoData(photo);return `<span class="${extraClass}${data?' has-photo':''}">${data?`<img src="${esc(data)}" alt="Foto de perfil" loading="lazy">`:esc(initials||'FC')}</span>`;}
  function paintAvatar(el,photo,initials){if(!el)return;const data=safePhotoData(photo);el.innerHTML=data?`<img src="${esc(data)}" alt="Foto de perfil">`:esc(initials||'FC');el.classList.toggle('has-photo',!!data);}
  function updateStateUI(){const rupras=fmt(state.rupras),doblones=fmt(state.doblones),initials=(state.username||'NF').trim().split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();$('#headerRupras').textContent=rupras;$('#headerDoblones').textContent=doblones;$('#homeRupras').innerHTML=`<i>R/.</i> ${rupras}`;$('#homeDoblones').innerHTML=`<i>D//</i> ${doblones}`;$('#walletRupras').textContent=rupras;$('#walletDoblones').textContent=doblones;$('#statsRupras').textContent=`R/. ${rupras}`;$('#statsDoblones').textContent=`D// ${doblones}`;$('#profileRupras').textContent=`R/. ${rupras}`;$('#profileDoblones').textContent=`D// ${doblones}`;$('#homeLevel').innerHTML=`${String(level()).padStart(2,'0')} <i>NV</i>`;$('#rewardLevel').textContent=String(level()).padStart(2,'0');$('#profileLevel').textContent=`NIVEL ${String(level()).padStart(2,'0')} · ${levelName()}`;$('#sideName').textContent=state.username;$('#profileDisplayName').textContent=state.username;paintAvatar($('#sideAvatar'),state.profilePhoto,initials);paintAvatar($('#profileAvatar'),state.profilePhoto,initials);$('#profileBio').value=state.bio||'';$('#usernameInput').value=state.username||'';$('#usernameInput').disabled=!!activeAccount?.online;if(activeAccount){$('#activeLoginName').textContent=activeAccount.username+(activeAccount.serie?' · '+activeAccount.serie:'');$('#localAccountUser').textContent=activeAccount.username+(activeAccount.serie?' · '+activeAccount.serie:'');$('#accountSyncFact').textContent=activeAccount.online?'Cuenta global: XP y nivel sincronizados':'Solo se guarda en este navegador';$('#accountPasswordFact').textContent=activeAccount.online?'Verificación derivada en la hoja privada':'Verificación derivada localmente';}$('#statsActivity').textContent=state.activity;$('#statsMatches').textContent=matches.length;$('#homeRankList').innerHTML=rankings().slice(0,5).map(p=>rankLine(p)).join('');}
  function level(){return Math.max(1,Math.floor(state.xp/100)+1)}function levelName(){return level()<3?'NOVATO APS':level()<6?'EXPLORADOR APS':'VETERANO APS'}
  function stateForAccount(account){if(activeAccount&&activeAccount.id===account.id)return mergeState(state,account.username);try{return mergeState(JSON.parse(localStorage.getItem(profileStorageKey(account.id))||'{}'),account.username);}catch{return mergeState({},account.username);}}
  function profileStatus(account){if(account.status==='suspended')return 'suspended';return activeAccount&&activeAccount.id===account.id?'active':'inactive';}
  function profileStatusLabel(status){return status==='suspended'?'SUSPENDIDO':status==='active'?'ACTIVO':'DESCONECTADO';}
  function rankings(){const accounts=listAccounts();if(activeAccount?.online&&!accounts.some(a=>a.id===activeAccount.id))accounts.push(activeAccount);const players=accounts.map(account=>{const data=stateForAccount(account);const rp=Math.max(0,Number(data.rupras)||0),db=Math.max(0,Number(data.doblones)||0),xp=Math.max(0,Number(data.xp)||0);const profileLevel=Math.max(1,Math.floor(xp/100)+1);const status=profileStatus(account);return {id:account.id,name:account.username,rp,db,activity:xp,activityCount:Math.max(0,Number(data.activity)||0),level:profileLevel,photo:safePhotoData(data.profilePhoto),initials:account.username.trim().split(/\s+/).map(t=>t[0]).join('').slice(0,2).toUpperCase(),user:!!activeAccount&&activeAccount.id===account.id,online:!!account.online,status,createdAt:account.createdAt||'',points:status==='suspended'?0:Math.round(xp+db*2+rp/100)};});players.sort((a,b)=>(a.status==='suspended')-(b.status==='suspended')||b.points-a.points||a.name.localeCompare(b.name,'es'));return players.map((p,i)=>({...p,position:i+1}));}
  function statusBadge(status){return `<span class="profile-status status-${status}"><i></i>${profileStatusLabel(status)}</span>`;}
  function rankLine(p){return `<div class="rank-line"><span class="rank-number">${String(p.position).padStart(2,'0')}</span>${avatarMarkup(p.photo,p.initials)}<div class="rank-user"><strong>${esc(p.name)}${p.user?' · TÚ':''}</strong><small>${fmt(p.activity)} XP · ${profileStatusLabel(p.status)}</small></div><span class="rank-points">${fmt(p.points)} PT</span></div>`;}
  function statusText(m){if(m.status==='live')return m.minute?`EN VIVO · ${m.minute}`:'EN VIVO';if(m.status==='final')return 'FINAL';if(m.status==='reported')return 'NO VERIFICADO';if(m.status==='review')return 'CONSULTAR';return m.minute||formatKickoff(m.date)||'PROGRAMADO';}
  function peruDateKey(value){const d=new Date(value||Date.now());if(Number.isNaN(d.getTime()))return '';const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);const part=type=>parts.find(p=>p.type===type)?.value||'';return `${part('year')}-${part('month')}-${part('day')}`;}
  function shiftDateKey(key,days){const d=new Date(`${key}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
  function formatKickoff(value){const d=new Date(value||0);return Number.isNaN(d.getTime())?'':d.toLocaleTimeString('es-PE',{timeZone:'America/Lima',hour:'2-digit',minute:'2-digit',hour12:false});}
  function formatPeruDateTime(value){const d=new Date(value||0);return Number.isNaN(d.getTime())?'—':d.toLocaleString('es-PE',{timeZone:'America/Lima',dateStyle:'short',timeStyle:'short'});}
  function compactDateKey(key){return String(key||'').replace(/-/g,'');}
  function knownSouthAmericanClubSet(){const countries=window.FOXCRAK_CLUB_DIRECTORY?.countries||[];return new Set(countries.flatMap(c=>(c.clubs||[]).map(name=>normalizeClubSearch(name))));}
  function espnCountryMeta(event){
    const comp=event.competitions?.[0]||{};const countryRaw=String(comp.venue?.address?.country||event.venue?.address?.country||'').toLowerCase();const alt=String(event.altGameNote||'').toLowerCase();const season=String(event.season?.slug||'').toLowerCase();
    const words=[['argentina','Argentina','🇦🇷'],['bolivia','Bolivia','🇧🇴'],['brazil','Brazil','🇧🇷'],['brasil','Brazil','🇧🇷'],['chile','Chile','🇨🇱'],['colombia','Colombia','🇨🇴'],['ecuador','Ecuador','🇪🇨'],['paraguay','Paraguay','🇵🇾'],['peru','Peru','🇵🇪'],['uruguay','Uruguay','🇺🇾'],['venezuela','Venezuela','🇻🇪'],['guyana','Guyana','🇬🇾'],['suriname','Suriname','🇸🇷'],['surinam','Suriname','🇸🇷']];
    for(const [word,country,flag] of words){if(countryRaw.includes(word)||alt.includes(word)||season.includes(word))return {country,countryName:country==='Brazil'?'Brasil':country==='Peru'?'Perú':country,countryFlag:flag};}
    if(/libertadores|sudamericana|conmebol|recopa/.test(`${alt} ${season}`))return {country:'South America',countryName:'Sudamérica',countryFlag:'🏆'};
    return null;
  }
  function isLikelySouthAmericanEvent(event,home,away,meta){
    if(meta)return true;const known=knownSouthAmericanClubSet();
    const knownName=name=>{const n=normalizeClubSearch(name);if(!n)return false;if(known.has(n))return true;return [...known].some(k=>k.length>=9&&(n.startsWith(k)||k.startsWith(n)));};
    if(knownName(home?.team?.displayName||home?.team?.name||'')||knownName(away?.team?.displayName||away?.team?.name||''))return true;
    return /libertadores|sudamericana|conmebol|peru liga 1|argentine lpf|brazilian serie a|liga betplay|ligapro|liga futve/.test(`${event.altGameNote||''} ${event.name||''} ${event.season?.slug||''}`.toLowerCase());
  }
  function mapEspnEvent(event,dateKey){
    const comp=event.competitions?.[0]||{};const competitors=comp.competitors||[];const home=competitors.find(c=>c.homeAway==='home');const away=competitors.find(c=>c.homeAway==='away');if(!home||!away)return null;
    const meta=espnCountryMeta(event);if(!isLikelySouthAmericanEvent(event,home,away,meta))return null;
    const so=comp.status||event.status||{};const st=so.type||{};const s=String(st.state||'').toLowerCase();const status=s==='in'?'live':s==='post'||st.completed?'final':'upcoming';
    const number=entry=>entry?.score===undefined||entry?.score===null||entry.score===''?null:(Number.isFinite(Number(entry.score))?Number(entry.score):null);
    const league=String(event.altGameNote||event.season?.name||event.season?.slug||'Fútbol sudamericano').replace(/\s+/g,' ').trim();
    const hs=Array.isArray(home.statistics)?home.statistics:[];const as=Array.isArray(away.statistics)?away.statistics:[];const hm=new Map(hs.map(x=>[x.name||x.abbreviation,x]));const statistics=as.map(x=>{const k=x.name||x.abbreviation;return {type_name:x.name||x.abbreviation||'Estadística',value:`${hm.get(k)?.displayValue??'—'} · ${x.displayValue??'—'}`};}).slice(0,8);
    const details=Array.isArray(comp.details)?comp.details:[];const teamIds=new Map(competitors.map(c=>[String(c.team?.id||c.id),c.team?.displayName||c.team?.name||'']));
    const events=details.map(x=>({minute:x.clock?.displayValue||'',type_name:x.type?.text||x.type?.name||'Evento',player_name:(x.athletesInvolved||[]).map(v=>v.displayName||v.fullName).filter(Boolean).join(', '),result:teamIds.get(String(x.team?.id))||''}));
    const link=event.links?.find(x=>(x.rel||[]).includes('summary'))?.href||`https://www.espn.com/soccer/match/_/gameId/${encodeURIComponent(event.id)}`;
    return {id:`espn-${event.id}`,espnId:String(event.id),home:home.team?.displayName||home.team?.name||'Local',away:away.team?.displayName||away.team?.name||'Visitante',homeShort:home.team?.abbreviation||'',awayShort:away.team?.abbreviation||'',homeLogo:home.team?.logo||'',awayLogo:away.team?.logo||'',homeId:home.team?.id||home.id,awayId:away.team?.id||away.id,date:event.date||comp.date||`${dateKey}T12:00:00Z`,venue:comp.venue?.fullName||event.venue?.displayName||event.venue?.fullName||'',status,hs:number(home),as:number(away),minute:status==='live'?(so.displayClock||st.detail||'EN JUEGO'):'',league,country:meta?.country||'South America',countryName:meta?.countryName||'Sudamérica',countryFlag:meta?.countryFlag||'🏆',region:'Sudamérica',round:event.week?.text||comp.group?.name||event.season?.slug||'',sourceUrl:link,sourceLabel:'ESPN scoreboard público',resultNote:'Datos consultados automáticamente desde un marcador público de ESPN. Cobertura variable; comprueba la ficha si detectas una discrepancia.',statistics,events,referees:[],lineups:[],leagueLogo:'',liveSource:'ESPN'};
  }
  function fixtureIdentity(match){const names=[normalizeClubSearch(match.home),normalizeClubSearch(match.away)].sort();return `${peruDateKey(match.date)}|${names.join('|')}`;}
  function mergeSportMatches(){
    // Only show events fetched from the live public feed. Old hard-coded fixtures
    // are intentionally excluded so stale scores or schedules are never presented as current.
    const api=[...feedByDate.values()].flat().filter(Boolean);const unique=new Map();
    for(const item of api){const key=fixtureIdentity(item);const current=unique.get(key);if(!current||(current.liveSource!=='ESPN'&&item.liveSource==='ESPN'))unique.set(key,item);}
    matches=[...unique.values()].sort((a,b)=>new Date(a.date)-new Date(b.date));
  }
  async function fetchEspnDay(dateKey){
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),9000);
    try{const url=`${ESPN_SCOREBOARD_BASE}?dates=${compactDateKey(dateKey)}`;const response=await fetch(url,{method:'GET',mode:'cors',cache:'no-store',signal:controller.signal,headers:{'Accept':'application/json'}});if(!response.ok)throw new Error(`HTTP ${response.status}`);const payload=await response.json();if(!payload||!Array.isArray(payload.events))throw new Error('Formato deportivo no reconocido');return {dateKey,matches:payload.events.map(ev=>mapEspnEvent(ev,dateKey)).filter(Boolean)};}finally{clearTimeout(timeout);}
  }
  function setRefreshVisuals(){
    const seconds=Math.max(0,Math.ceil((nextFeedRefreshAt-Date.now())/1000));const clock=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
    ['refreshCountdown','liveRefreshCountdown'].forEach(id=>{const el=$('#'+id);if(el)el.textContent=clock;});
    const updated=lastFeedSuccessAt?new Date(lastFeedSuccessAt).toLocaleTimeString('es-PE',{timeZone:'America/Lima',hour:'2-digit',minute:'2-digit',hour12:false}):'AÚN NO';
    const upd=$('#lastUpdatedText');if(upd)upd.textContent=lastFeedSuccessAt?`ACTUALIZADO ${updated}`:'Consultando marcador público…';const settingUpdated=$('#settingsFeedUpdated');if(settingUpdated)settingUpdated.textContent=updated;
    const label=lastFeedSuccessAt?(feedFailureCount?'FEED PARCIAL':'FEED PÚBLICO ACTUALIZADO'):(feedFailureCount?'SIN DATOS CONFIRMADOS':'CONSULTANDO MARCADORES');const stateEl=$('#liveFeedState');if(stateEl)stateEl.textContent=label;const settingsState=$('#settingsFeedState');if(settingsState)settingsState.textContent=lastFeedSuccessAt?(feedFailureCount?'PARCIAL':'CONECTADO'):(feedFailureCount?'SIN RESPUESTA':'CONSULTANDO…');
    const led=$('#liveFeedLed');if(led)led.classList.toggle('is-on',!!lastFeedSuccessAt&&!feedFailureCount);const title=$('#dataStatus');if(title)title.textContent=lastFeedSuccessAt?'MARCADORES ACTUALIZADOS':(feedFailureCount?'SIN DATOS CONFIRMADOS':'CARGANDO MARCADORES');const text=$('#dataStatusText');if(text)text.textContent=lastFeedSuccessAt?'Feed público · cobertura según liga':(feedFailureCount?'Feed público sin respuesta; no se muestran marcadores inventados':'Consultando marcador público cada 5 min');const statusLed=$('#statusLed');if(statusLed)statusLed.classList.toggle('connected',!!lastFeedSuccessAt&&!feedFailureCount);
  }
  async function refreshSportsData({force=false,quiet=true}={}){
    if(feedRefreshBusy)return;feedRefreshBusy=true;nextFeedRefreshAt=Date.now()+AUTO_REFRESH_MS;const today=peruDateKey(new Date());const scheduleDue=force||!lastScheduleRefreshAt||Date.now()-lastScheduleRefreshAt>=SCHEDULE_REFRESH_MS||lastScheduleDate!==today;const days=scheduleDue?Array.from({length:8},(_,i)=>shiftDateKey(today,i)):[today];
    const results=await Promise.allSettled(days.map(fetchEspnDay));let successes=0,failures=0;
    for(const result of results){if(result.status==='fulfilled'){successes++;feedByDate.set(result.value.dateKey,result.value.matches);}else failures++;}
    if(scheduleDue&&successes){lastScheduleRefreshAt=Date.now();lastScheduleDate=today;}
    if(successes){lastFeedSuccessAt=Date.now();feedFailureCount=failures;latestFeedLabel='ESPN · '+new Date(lastFeedSuccessAt).toLocaleTimeString('es-PE',{timeZone:'America/Lima',hour:'2-digit',minute:'2-digit',hour12:false});mergeSportMatches();realData=true;renderMatches();renderCalendar();renderCompetitions();const note=$('#liveProviderNote');if(note)note.textContent=`Datos públicos consultados ${latestFeedLabel}. Se actualizan cada 5 minutos; cobertura variable por liga. Los partidos sin respuesta conservan la etiqueta de referencia.`;if(!quiet)notify('Marcadores actualizados.');}
    else{feedFailureCount++;if(!quiet)notify('El marcador público no respondió. Se conserva el último calendario disponible.');}
    feedRefreshBusy=false;nextFeedRefreshAt=Date.now()+AUTO_REFRESH_MS;setRefreshVisuals();
  }
  function startSportsAutoRefresh(){setRefreshVisuals();refreshSportsData({force:true,quiet:true});setInterval(()=>{setRefreshVisuals();if(Date.now()>=nextFeedRefreshAt)refreshSportsData({quiet:true});},1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastFeedSuccessAt>AUTO_REFRESH_MS)refreshSportsData({quiet:true});});}

  function matchesFiltered(status=liveStatus,country=countryKey){
    const q=searchText.trim().toLowerCase();
    const now=new Date();
    return matches.filter(m=>{
      const date=new Date(m.date||0);
      const sameDay=!!peruDateKey(m.date)&&peruDateKey(m.date)===peruDateKey(now);
      const future=date.getTime()>=now.getTime();
      const okStatus=status==='all'||(status==='live'&&m.status==='live')||(status==='upcoming'&&future&&m.status==='upcoming')||(status==='today'&&sameDay);
      const okCountry=country==='LATAM'?isLatam(m):m.country===country;
      const text=`${m.home} ${m.away} ${m.league} ${m.countryName}`.toLowerCase();
      const okSearch=!q||text.includes(q);
      let okCompetition=true;
      if(competitionFilter){
        const comp=COMPETITIONS.find(c=>c.name===competitionFilter);
        if(comp){const league=String(m.league||'').toLowerCase();okCompetition=comp.type==='league'?(m.country===comp.country&&comp.aliases.some(alias=>league.includes(alias.toLowerCase()))):(comp.aliases.some(alias=>league.includes(alias.toLowerCase()))||comp.aliases.some(alias=>String(m.round||'').toLowerCase().includes(alias.toLowerCase())));}
      }
      return okStatus&&okCountry&&okSearch&&okCompetition;
    });
  }
  function isLatam(m){
    const text=`${m.countryName||''} ${m.league||''} ${m.region||''}`.toLowerCase();
    return COUNTRIES.some(c=>c.term.some(term=>text.includes(term))) || /libertadores|sudamericana|south america|sudamérica|sudamerica/.test(text);
  }
  function safeImageURL(value){try{if(!value)return '';const u=new URL(String(value),window.location.href);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}}
  function teamVisual(name,short,logo,countryHint=''){const url=safeImageURL(logo);const initialsText=esc(short||initials(name));const code=countryCodeFromHint(countryHint);const paladar=paladarLogoCandidates(name,code);return `<span class="team-badge"><span class="team-initials">${initialsText}</span>${url?`<img class="team-logo" loading="lazy" referrerpolicy="no-referrer" src="${esc(url)}" alt="Escudo de ${esc(name)}">`:`<img class="team-logo team-logo-query" data-logo-query="${esc(name)}" data-country-code="${esc(code)}" data-paladar-urls="${esc(JSON.stringify(paladar))}" loading="eager" referrerpolicy="no-referrer" alt="Escudo de ${esc(name)}" hidden>`}</span>`;}
  function matchCard(m){
    const live=m.status==='live';const score=m.status==='upcoming'?(formatKickoff(m.date)||'—:—'):(m.hs==null||m.as==null?'— : —':`${m.hs} : ${m.as}`);const caption=m.status==='upcoming'?'HORA PERÚ':live?'ENCUENTRO EN CURSO':m.status==='reported'?'REFERENCIA':'RESULTADO';const flag=m.countryFlag||'⚽';const pick=(state.predictions||[]).find(p=>p.matchId===String(m.id));const pickLabel=pick?`PRONÓSTICO: ${pick.outcome==='home'?m.home:pick.outcome==='away'?m.away:'EMPATE'}`:'';
    return `<article class="match-card clean-match-card ${live?'match-is-live':''}"><div class="match-card-head"><span class="match-competition-label"><span class="league-mark">${esc(flag)}</span><span>${esc(m.league||'Competición')}</span></span><span class="match-status ${live?'live':m.status==='final'?'final':m.status==='reported'?'reported':''}">${esc(statusText(m))}</span></div><div class="match-teams"><div class="match-team">${teamVisual(m.home,m.homeShort,m.homeLogo,m.countryName||m.country||m.league)}<strong>${esc(m.home)}</strong></div><div class="match-score">${esc(score)}<small>${caption}</small></div><div class="match-team">${teamVisual(m.away,m.awayShort,m.awayLogo,m.countryName||m.country||m.league)}<strong>${esc(m.away)}</strong></div></div><div class="clean-match-footer"><span>${esc(m.countryName||'Sudamérica')} · ${esc(m.round||formatPeruDateTime(m.date))}${pick?`<small>${esc(pickLabel)}</small>`:''}</span><button type="button" class="match-open-button" data-match-info="${esc(m.id)}">VER PARTIDO <b>↗</b></button></div></article>`;
  }
  function initials(name){return String(name||'FC').split(/\s+/).filter(Boolean).map(s=>s[0]).join('').slice(0,3).toUpperCase();}
  function safeText(value,fallback='No disponible'){return value===null||value===undefined||value===''?fallback:esc(value);}
  function playerLabel(entry){return entry.player?.display_name||entry.player?.name||entry.player_name||entry.name||entry.display_name||'Jugador';}
  function roleLabel(entry){return entry.position?.name||entry.position_name||entry.type?.name||entry.role||'Posición no indicada';}
  function openMatchDetails(m){
    const live=m.status==='live';const homeTeam=`<div class="detail-team">${teamVisual(m.home,m.homeShort,m.homeLogo,m.countryName||m.country||m.league)}<strong>${esc(m.home)}</strong><small>LOCAL</small></div>`;const awayTeam=`<div class="detail-team">${teamVisual(m.away,m.awayShort,m.awayLogo,m.countryName||m.country||m.league)}<strong>${esc(m.away)}</strong><small>VISITANTE</small></div>`;const score=m.status==='upcoming'?'— : —':(m.hs==null||m.as==null?'— : —':`${m.hs} : ${m.as}`);
    const saved=(state.predictions||[]).find(p=>p.matchId===String(m.id));const canPredict=m.status==='upcoming'&&new Date(m.date).getTime()>Date.now();const predictionLabel=saved?(saved.outcome==='home'?m.home:saved.outcome==='away'?m.away:'Empate'):'';
    const predictionHtml=`<section class="prediction-panel"><div class="prediction-heading"><div><span class="section-index">PRONÓSTICO PERSONAL</span><h3>¿Cómo terminará?</h3></div>${saved?'<span class="prediction-saved-tag">GUARDADO</span>':''}</div>${canPredict?`<p>Elige un resultado para tu perfil. No arriesga R/. ni D// y no usa cuotas.</p><div class="prediction-choice-grid"><button type="button" class="prediction-choice ${saved?.outcome==='home'?'selected':''}" data-pick-outcome="home" data-pick-match="${esc(m.id)}"><strong>1</strong><span>GANA ${esc(m.home).toUpperCase()}</span></button><button type="button" class="prediction-choice ${saved?.outcome==='draw'?'selected':''}" data-pick-outcome="draw" data-pick-match="${esc(m.id)}"><strong>X</strong><span>EMPATE</span></button><button type="button" class="prediction-choice ${saved?.outcome==='away'?'selected':''}" data-pick-outcome="away" data-pick-match="${esc(m.id)}"><strong>2</strong><span>GANA ${esc(m.away).toUpperCase()}</span></button></div><small class="prediction-footnote">Sin apuestas, cuotas ni cambios de saldo.</small>`:saved?`<p>Tu elección guardada: <strong>${esc(predictionLabel)}</strong>. El encuentro ya no acepta nuevos pronósticos.</p>`:`<p>Los pronósticos se guardan antes del inicio. Este partido ya empezó o terminó.</p>`}</section>`;
    const stats=Array.isArray(m.statistics)?m.statistics:[];const statsHtml=stats.length?`<div class="fixture-stats-list">${stats.slice(0,8).map(stat=>`<div><span>${safeText(stat.type_name||stat.name,'Estadística')}</span><b>${safeText(stat.value,'—')}</b></div>`).join('')}</div>`:'<p class="detail-empty">Las estadísticas avanzadas no llegaron en esta actualización.</p>';
    const events=Array.isArray(m.events)?m.events:[];const eventsHtml=events.length?`<div class="match-event-list">${events.slice(0,8).map(ev=>`<div class="match-event-row"><b>${safeText(ev.minute,'—')}</b><span><strong>${safeText(ev.type_name||ev.type,'Evento')}</strong><small>${safeText(ev.player_name,'')} ${ev.result?`· ${esc(ev.result)}`:''}</small></span></div>`).join('')}</div>`:'<p class="detail-empty">No hay eventos detallados para este partido.</p>';
    $('#matchDetailsContent').innerHTML=`<div class="detail-match-title"><div><span class="section-index">${esc(m.countryName||'SUDAMÉRICA')} · ${esc(m.league||'Fútbol')}</span><h2 id="matchDialogTitle">${esc(m.home)} <span>vs</span> ${esc(m.away)}</h2><p>${esc(m.round||formatPeruDateTime(m.date))}</p></div><span class="match-status ${live?'live':m.status==='final'?'final':''}">${esc(statusText(m))}</span></div><div class="detail-scoreboard">${homeTeam}<div class="detail-score">${esc(score)}<small>${m.status==='upcoming'?'HORA DE INICIO':live?'EN VIVO':'RESULTADO'}</small></div>${awayTeam}</div><div class="detail-meta-row"><span>Estadio: <b>${safeText(m.venue,'No informado')}</b></span><span>Datos: <b>${m.liveSource?'ESPN público':'Referencia guardada'}</b></span></div>${predictionHtml}<div class="match-detail-columns compact-detail-columns"><section class="detail-section"><div class="detail-section-heading"><h3>Eventos</h3></div>${eventsHtml}</section><section class="detail-section"><div class="detail-section-heading"><h3>Estadísticas</h3></div>${statsHtml}</section></div><p class="detail-data-note">${m.resultNote?esc(m.resultNote):'La cobertura depende de la disponibilidad del feed público.'} ${m.sourceUrl?`<a href="${esc(safeImageURL(m.sourceUrl))}" target="_blank" rel="noopener noreferrer">Ver ficha deportiva ↗</a>`:''}</p>`;
    const dialog=$('#matchDialog');if(dialog?.showModal){if(!dialog.open)dialog.showModal();}else dialog?.setAttribute('open','');
  }
  function renderMatches(){
    const results=matchesFiltered();
    $('#liveMatchGrid').innerHTML=results.length?results.map(matchCard).join(''):`<div class="empty-state clean-empty-state"><strong>${liveStatus==='live'?'No hay partidos en vivo en el feed':'No hay partidos para este filtro'}</strong><p>La página volverá a consultar los marcadores automáticamente. La cobertura puede variar por competición.</p><button type="button" class="secondary-square" id="emptyRefreshBtn">ACTUALIZAR AHORA ↻</button></div>`;
    hydrateMatchLogos($('#liveMatchGrid'));
    const home=matches.filter(m=>isLatam(m)&&(['reported','live','upcoming','review'].includes(m.status))).sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(0,4);
    $('#homeLiveList').innerHTML=home.length?home.map(m=>`<div class="compact-match"><div><span class="teams-name">${esc(m.home)} · ${esc(m.away)}</span><small>${esc(m.countryName||'Sudamérica')} · ${esc(m.league||'Competición')}</small></div><div class="score-block">${m.status==='upcoming'?formatKickoff(m.date):(m.hs==null||m.as==null?'— : —':`${m.hs} : ${m.as}`)}<small>${esc(statusText(m))}</small></div></div>`).join(''):`<div class="empty-state"><strong>Sin partidos disponibles</strong><p>El feed completará la agenda cuando responda.</p></div>`;
    $('#liveNavCount').textContent=matches.filter(m=>m.status==='live'&&isLatam(m)).length;$('#statsMatches').textContent=matches.length;
    if(!lastFeedSuccessAt&&$('#liveProviderNote'))$('#liveProviderNote').textContent=feedFailureCount?'No hay partidos confirmados en este momento. La fuente pública no respondió o no tiene cobertura para esta liga.':'Consultando el marcador público; los resultados solo aparecerán si la fuente responde con datos verificables.';
    setRefreshVisuals();
  }
  function renderCalendar(){
    const now=new Date();
    const todayKey=peruDateKey(now),weekEndKey=shiftDateKey(todayKey,7),nextEndKey=shiftDateKey(todayKey,14);
    const filtered=matches.filter(m=>{
      if(!isLatam(m))return false;
      const key=peruDateKey(m.date);if(!key)return false;
      if(calendarMode==='all')return true;
      if(calendarMode==='today')return key===todayKey;
      if(calendarMode==='nextweek')return key>=weekEndKey&&key<nextEndKey;
      return key>=todayKey&&key<weekEndKey;
    });
    const source='https://liga1.pe/fixture-y-resultados-del-clausura-liga1-te-apuesto-2026/';
    $('#calendarTable').innerHTML=filtered.length?filtered.map(m=>`<tr><td>${formatPeruDateTime(m.date)}</td><td>${esc(m.league||'Competición')}</td><td><span class="table-team">${esc(m.home)} vs ${esc(m.away)}</span></td><td><span class="tag-mini ${m.status==='live'?'live':m.status==='reported'?'reported':''}">${esc(statusText(m))}${m.status==='upcoming'?` · ${formatKickoff(m.date)} H` : ''}</span></td><td><a class="source-link" href="${esc(safeImageURL(m.sourceUrl||source))}" target="_blank" rel="noopener noreferrer">VER FUENTE ↗</a></td></tr>`).join(''):`<tr><td colspan="5">No hay partidos en este periodo dentro del calendario cargado. Consulta la fuente oficial para la programación más reciente.</td></tr>`;
    $('#todayLabel').textContent=now.toLocaleDateString('es-PE',{timeZone:'America/Lima',weekday:'short',day:'2-digit',month:'short',year:'numeric'}).toUpperCase();
  }
  function renderCompetitions(){
    const competitionGrid=$('#competitionGrid'); if(!competitionGrid)return;
    competitionGrid.innerHTML=COMPETITIONS.map((c,i)=>{
      const aliases=c.aliases.map(x=>x.toLowerCase());
      const linked=matches.find(m=>aliases.some(alias=>String(m.league||'').toLowerCase().includes(alias))&&m.leagueLogo);
      const emblem=linked?`<img src="${esc(safeImageURL(linked.leagueLogo))}" alt="Emblema de ${esc(c.name)}" loading="lazy" referrerpolicy="no-referrer">`:`<span>${c.flag}</span>`;
      return `<article class="competition-card competition-${c.type}"><div class="competition-card-top"><span class="competition-emblem">${emblem}</span><span class="comp-code">${esc(c.scope)} / ${esc(c.code)}</span></div><h3>${esc(c.name)}</h3><p>${esc(c.description)}</p><div class="comp-stats"><span>${c.type==='continental'?'TORNEO CONTINENTAL':'LIGA NACIONAL'}</span><a class="comp-open button-link" href="${esc(c.source||'#')}" target="_blank" rel="noopener noreferrer">VER FUENTE OFICIAL ↗</a></div></article>`;
    }).join('');
  }
  function renderRanking(){const players=rankings();$('#rankingTable').innerHTML=players.length?players.map(p=>`<tr class="rank-row-${p.status}"><td>${String(p.position).padStart(2,'0')}</td><td><div class="ranking-table-user">${avatarMarkup(p.photo,p.initials)}<span><span class="table-team">${esc(p.name)}${p.user?' · TÚ':''}</span><small class="ranking-subline">${esc(p.id.slice(0,8).toUpperCase())}</small></span></div></td><td>R/. ${fmt(p.rp)}</td><td>D// ${fmt(p.db)}</td><td>${fmt(p.activity)} XP</td><td>NIVEL ${String(p.level).padStart(2,'0')}</td><td>${statusBadge(p.status)}</td></tr>`).join(''):`<tr><td colspan="7">Aún no hay perfiles locales registrados.</td></tr>`;const podium=players.filter(p=>p.status!=='suspended').slice(0,3);$('#podiumGrid').innerHTML=podium.length?podium.map((p,i)=>`<article class="podium-card ${i===0?'first':''}"><span class="podium-medal">${i===0?'♛':i===1?'②':'③'}</span>${avatarMarkup(p.photo,p.initials,'podium-avatar')}<h3>${esc(p.name)}</h3><p>PUESTO ${String(p.position).padStart(2,'0')} · ${profileStatusLabel(p.status)}</p><strong>${fmt(p.points)} PT</strong></article>`).join(''):`<div class="empty-state"><strong>Sin perfiles activos para el podio</strong><p>Revisa los perfiles suspendidos o crea uno nuevo.</p></div>`;}
  function renderTransactions(){const tx=[...state.transactions].reverse();const html=tx.length?tx.map(t=>`<tr><td>${esc(t.date)}</td><td>${esc(t.label)}</td><td>${(t.rp||0)>=0?'+R/. ':'−R/. '}${fmt(Math.abs(t.rp||0))}</td><td>${(t.db||0)>=0?'+D// ':'−D// '}${fmt(Math.abs(t.db||0))}</td></tr>`).join(''):`<tr><td colspan="4">No hay movimientos registrados. Registra una actividad diaria para probar el historial.</td></tr>`;$('#transactionTable').innerHTML=html;$('#walletTransactions').innerHTML=html;const chart=$('#activityChart');const last=tx.slice(0,8).reverse();chart.innerHTML=last.length?last.map((t,i)=>`<div class="chart-bar" style="height:${Math.max(8,Math.min(100,18+Math.abs(t.rp||0)/3))}%"><span>${i+1}</span></div>`).join(''):`<div class="empty-state" style="width:100%;padding:15px">Aún no hay movimientos para graficar.</div>`;}
  function renderRewards(){const progress=state.xp%100;$('#rewardProgressText').textContent=`${progress} / 100 puntos para el siguiente nivel`;$('#levelProgress').style.width=`${progress}%`;const acts=[{title:'Primer acceso',desc:'Visita el menú principal del sistema.',goal:1,xp:15,done:state.visited.includes('inicio'),icon:'⌂'},{title:'Explorador de torneos',desc:'Abre la sección de competiciones.',goal:1,xp:20,done:state.visited.includes('competitions'),icon:'♜'},{title:'Analista APS',desc:'Consulta la sección de estadísticas.',goal:1,xp:20,done:state.visited.includes('stats'),icon:'▥'},{title:'Conoce LATAM',desc:'Visita el centro de fútbol latinoamericano.',goal:1,xp:20,done:state.visited.includes('latam'),icon:'◎'},{title:'Cuenta personalizada',desc:'Guarda un nombre de perfil propio.',goal:1,xp:25,done:state.activity>0&&state.username!=='NitzFoxcrak',icon:'◉'},{title:'Racha de actividad',desc:'Registra una actividad diaria.',goal:1,xp:15,done:!!state.lastDaily,icon:'✦'}];$('#achievementGrid').innerHTML=acts.map(a=>`<article class="achievement ${a.done?'unlocked':''}"><span>${a.icon}</span><h3>${esc(a.title)}</h3><p>${esc(a.desc)}</p><small>${a.done?'✓ COMPLETADO':`RECOMPENSA: +${a.xp} XP`}</small></article>`).join('');}
  function renderCountryTiles(){$('#countryGrid').innerHTML=COUNTRIES.map(c=>`<button class="country-tile" data-country="${c.key}"><span class="country-flag">${c.icon}</span><span><strong>${esc(c.name)}</strong><small>Ver partidos disponibles ↗</small></span></button>`).join('');}
  function renderCommunity(){const players=rankings();$('#communityGrid').innerHTML=players.length?players.map(p=>`<article class="community-card community-${p.status}">${avatarMarkup(p.photo,p.initials)}<div class="community-user"><strong>${esc(p.name)}${p.user?' · TÚ':''}</strong>${statusBadge(p.status)}<small>Nivel ${String(p.level).padStart(2,'0')} · ${fmt(p.points)} puntos · ${esc(p.id.slice(0,8).toUpperCase())}</small></div>${p.online?'':`<button type="button" class="account-status-toggle ${p.status==='suspended'?'secondary-square':'danger-square'}" data-account-status-toggle="${esc(p.id)}">${p.status==='suspended'?'REACTIVAR':'SUSPENDER'}</button>`}</article>`).join(''):`<div class="empty-state"><strong>No hay perfiles locales</strong><p>Crea un perfil para que aparezca aquí.</p></div>`;}
  function initialsForClub(name){return String(name||'FC').split(/\s+/).filter(Boolean).slice(0,3).map(word=>word[0]).join('').slice(0,3).toUpperCase();}
  function normalizeClubSearch(value){return String(value||'').toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');}
  function renderClubDirectory(){
    const catalog=window.FOXCRAK_CLUB_DIRECTORY;
    const allCountries=catalog?.countries||[];
    const allClubs=allCountries.flatMap(country=>country.clubs.map(name=>({kind:'club',name,country:country.name,code:country.code,flag:country.flag,league:country.league,source:country.source,association:country.association,season:catalog.season||'2026'})));
    const q=String($('#clubDirectorySearch')?.value||'').trim().toLocaleLowerCase('es');
    const queryNorm=normalizeClubSearch(q);
    const countryFilter=$('#clubDirectoryCountry')?.value||'ALL';
    const kind=$('#clubDirectoryCompetition')?.value||'NATIONAL';
    const countriesSelect=$('#clubDirectoryCountry');
    if(countriesSelect&&countriesSelect.options.length===1){allCountries.forEach(c=>{const opt=document.createElement('option');opt.value=c.code;opt.textContent=`${c.flag} ${c.name.toUpperCase()}`;countriesSelect.appendChild(opt);});}
    const countEl=$('#clubDirectoryCount');if(countEl)countEl.textContent=String(allClubs.length);
    const grid=$('#clubDirectoryGrid');if(!grid)return;
    const allComps=(catalog?.competitions||[]).map((comp,i)=>({...comp,kind:'competition',code:`CONMEBOL-${i+1}`,season:catalog.season||'2026'}));
    let items=[];
    if(kind==='CONTINENTAL'){
      items=allComps.filter(comp=>!q||normalizeClubSearch(comp.name).includes(queryNorm)||normalizeClubSearch('sudamerica conmebol copa continental').includes(queryNorm));
    }else{
      const filtered=allClubs.filter(club=>{
        const countryOk=countryFilter==='ALL'||club.code===countryFilter;
        const haystack=`${club.name} ${club.country} ${club.league}`.toLocaleLowerCase('es');
        return countryOk&&(!q||haystack.includes(q)||normalizeClubSearch(haystack).includes(queryNorm));
      }).sort((a,b)=>a.country.localeCompare(b.country,'es')||a.name.localeCompare(b.name,'es'));
      items=filtered;
      if(kind==='ALL'&&countryFilter==='ALL') items=items.concat(allComps.filter(comp=>!q||normalizeClubSearch(comp.name).includes(queryNorm)));
    }
    const totalPages=Math.max(1,Math.ceil(items.length/CLUB_DIRECTORY_PAGE_SIZE));
    clubDirectoryPage=Math.min(Math.max(1,clubDirectoryPage),totalPages);
    const visible=items.slice((clubDirectoryPage-1)*CLUB_DIRECTORY_PAGE_SIZE,clubDirectoryPage*CLUB_DIRECTORY_PAGE_SIZE);
    grid.innerHTML=visible.map(item=>item.kind==='competition'?clubCompetitionCardHtml(item):clubCardHtml(item)).join('');
    if(!visible.length)grid.innerHTML='<div class="empty-state"><strong>No se encontraron resultados</strong><p>Prueba otro nombre o cambia el filtro de país o competición.</p></div>';
    const resultLabel=$('#clubDirectoryResultsLabel');if(resultLabel)resultLabel.textContent=`${items.length} RESULTADOS · ${kind==='CONTINENTAL'?'COMPETICIONES':'CATÁLOGO'}`;
    const pageInfo=$('#clubDirectoryPageInfo');if(pageInfo)pageInfo.textContent=`PÁGINA ${clubDirectoryPage} / ${totalPages}`;
    const prev=$('#clubDirectoryPrev'),next=$('#clubDirectoryNext');if(prev)prev.disabled=clubDirectoryPage<=1;if(next)next.disabled=clubDirectoryPage>=totalPages;
    if($('#view-clubdirectory')?.classList.contains('active-view')) hydrateClubLogos(grid);
    const sources=$('#clubOfficialSources');
    if(sources&&!sources.dataset.loaded){sources.innerHTML=allCountries.map(c=>`<a href="${esc(c.association||c.source)}" target="_blank" rel="noopener noreferrer"><b>${c.flag} ${esc(c.name)}</b><small>${esc(c.league)} · ASOCIACIÓN / FUENTE</small><span>↗</span></a>`).join('')+`<a href="https://gol.conmebol.com/libertadores/es/teams" target="_blank" rel="noopener noreferrer"><b>🏆 CONMEBOL Libertadores</b><small>LISTA DE EQUIPOS Y ESCUDOS</small><span>↗</span></a><a href="https://gol.conmebol.com/sudamericana/es/teams" target="_blank" rel="noopener noreferrer"><b>🏆 CONMEBOL Sudamericana</b><small>LISTA DE EQUIPOS Y ESCUDOS</small><span>↗</span></a>`;sources.dataset.loaded='true';}
  }
  function clubCompetitionCardHtml(comp){
    return `<article class="club-card continental-club-card"><div class="club-card-top"><span class="club-crest club-crest-continental">${esc(comp.flag||'🏆')}</span><span class="club-card-code">CONMEBOL · ${esc(comp.code)}</span></div><h3>${esc(comp.name)}</h3><p>Competición internacional de clubes de Sudamérica. Abre la página oficial para consultar participantes, escudos, calendario, tabla y resultados publicados.</p><div class="club-card-meta"><span>TORNEO CONTINENTAL</span><span>TEMPORADA ${esc(comp.season||'2026')}</span></div><a class="club-source-link" href="${esc(comp.source)}" target="_blank" rel="noopener noreferrer">VER EQUIPOS Y DATOS OFICIALES ↗</a></article>`;
  }
  function clubCardHtml(club){
    const initials=initialsForClub(club.name);
    const officialSource=club.association||club.source;
    const leagueSource=club.source||officialSource;
    const wikiQuery=String(club.name||'').replace(/\s+/g,' ').trim();
    const paladarUrls=paladarLogoCandidates(club.name,club.code);
    const paladarPage=paladarCountryPage(club.code);
    return `<article class="club-card" data-club-card="${esc(club.name)}"><div class="club-card-top"><span class="club-logo-frame"><span class="club-crest club-crest-fallback" aria-label="Iniciales de ${esc(club.name)}">${esc(initials)}</span><img class="club-real-logo" data-logo-query="${esc(wikiQuery)}" data-country-code="${esc(club.code)}" data-paladar-urls="${esc(JSON.stringify(paladarUrls))}" alt="Escudo de ${esc(club.name)}" loading="eager" decoding="async" referrerpolicy="no-referrer" hidden></span><span class="club-card-code">${esc(club.flag)} ${esc(club.code)} · ${esc(club.season)}</span></div><h3>${esc(club.name)}</h3><p class="club-card-country">${esc(club.country)}</p><div class="club-card-meta"><span>${esc(club.league)}</span><span>PRIMERA DIVISIÓN</span></div><div class="club-card-links"><a class="club-source-link" href="${esc(paladarPage)}" target="_blank" rel="noopener noreferrer">ESCUDO ↗</a><a class="club-source-link club-source-secondary" href="${esc(leagueSource)}" target="_blank" rel="noopener noreferrer">LIGA / FUENTE OFICIAL ↗</a></div></article>`;
  }
  const clubLogoLookupInFlight=new Map();
  async function resolveClubLogo(name){
    const cacheKey=CLUB_LOGO_CACHE_PREFIX+normalizeClubSearch(name);
    try{const cached=JSON.parse(localStorage.getItem(cacheKey)||'null');if(cached&&Date.now()-cached.savedAt<1000*60*60*24*60)return cached.url||'';}catch{}
    if(clubLogoLookupInFlight.has(name))return clubLogoLookupInFlight.get(name);
    const task=(async()=>{
      try{
        const norm=normalizeClubSearch(name);
        let candidates=[];
        for(const language of ['es','en']){
          const searchUrl='https://www.wikidata.org/w/api.php?'+new URLSearchParams({action:'wbsearchentities',search:name,language,uselang:language,format:'json',origin:'*',limit:'8'}).toString();
          const searchResponse=await fetch(searchUrl,{headers:{Accept:'application/json'}});
          if(!searchResponse.ok)continue;
          const searchData=await searchResponse.json();
          candidates=(searchData.search||[]).filter(item=>normalizeClubSearch(item.label)===norm||normalizeClubSearch(item.match?.text||'')===norm);
          if(candidates.length)break;
        }
        let logoUrl='';
        for(const candidate of candidates.slice(0,4)){
          if(!/^Q\d+$/.test(candidate.id||''))continue;
          const description=String(candidate.description||'').toLowerCase();
          if(description&&!/football|soccer|fútbol|futebol|sport club|sports club|football club|soccer club|club de fútbol|club de futebol|association football/.test(description))continue;
          const detailUrl='https://www.wikidata.org/w/api.php?'+new URLSearchParams({action:'wbgetentities',ids:candidate.id,props:'claims',format:'json',origin:'*'}).toString();
          const detailResponse=await fetch(detailUrl,{headers:{Accept:'application/json'}});if(!detailResponse.ok)continue;
          const detail=await detailResponse.json();
          const filename=detail.entities?.[candidate.id]?.claims?.P154?.[0]?.mainsnak?.datavalue?.value;
          if(filename&&typeof filename==='string'){
            logoUrl='https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(filename)+'?width=100';
            break;
          }
        }
        try{localStorage.setItem(cacheKey,JSON.stringify({url:logoUrl,savedAt:Date.now()}));}catch{}
        return logoUrl;
      }catch{return '';}
    })();
    clubLogoLookupInFlight.set(name,task);const result=await task;clubLogoLookupInFlight.delete(name);return result;
  }
  function saveClubLogoCache(name,url){try{localStorage.setItem(CLUB_LOGO_CACHE_PREFIX+normalizeClubSearch(name),JSON.stringify({url,savedAt:Date.now()}));}catch{}}
  function setLoadedClubImage(img){img.hidden=false;img.closest('.club-logo-frame')?.classList.add('has-real-logo');const fallback=img.previousElementSibling;if(fallback)fallback.hidden=true;}
  function setFailedClubImage(img){img.hidden=true;img.closest('.club-logo-frame')?.classList.remove('has-real-logo');const fallback=img.previousElementSibling;if(fallback)fallback.hidden=false;}
  function loadImageUrl(img,url){return new Promise(resolve=>{let done=false;const finish=ok=>{if(done)return;done=true;img.onload=null;img.onerror=null;if(ok)setLoadedClubImage(img);resolve(ok);};img.onload=()=>finish(true);img.onerror=()=>finish(false);img.src=url;});}
  async function resolveBestClubLogo(img){
    const name=img.dataset.logoQuery||'';let direct=[];try{direct=JSON.parse(img.dataset.paladarUrls||'[]')}catch{}
    for(const url of direct){if(!img.isConnected)return '';if(await loadImageUrl(img,url)){saveClubLogoCache(name,url);return url;}}
    const logo=await resolveClubLogo(name);if(!logo||!img.isConnected)return '';
    if(await loadImageUrl(img,logo))return logo;return '';
  }
  async function hydrateClubLogos(grid){
    if(!grid||!window.fetch)return;
    const images=[...grid.querySelectorAll('img.club-real-logo[data-logo-query]')];let cursor=0;
    const worker=async()=>{while(cursor<images.length){const img=images[cursor++];if(!img.isConnected||img.dataset.logoTried==='true')continue;img.dataset.logoTried='true';try{const found=await resolveBestClubLogo(img);if(!found&&img.isConnected)setFailedClubImage(img);}catch{if(img.isConnected)setFailedClubImage(img);}}};
    await Promise.all(Array.from({length:Math.min(4,images.length)},worker));
  }
  async function hydrateMatchLogos(grid){
    if(!grid||!window.fetch)return;
    const images=[...grid.querySelectorAll('img.team-logo-query[data-logo-query]')];let cursor=0;
    const worker=async()=>{while(cursor<images.length){const img=images[cursor++];if(!img.isConnected||img.dataset.logoTried==='true')continue;img.dataset.logoTried='true';try{const found=await resolveBestClubLogo(img);if(!found&&img.isConnected){img.hidden=true;const fallback=img.previousElementSibling;if(fallback)fallback.hidden=false;}}catch{img.hidden=true;const fallback=img.previousElementSibling;if(fallback)fallback.hidden=false;}}};
    await Promise.all(Array.from({length:Math.min(4,images.length)},worker));
  }
  function renderAll(){updateStateUI();renderMatches();renderCalendar();renderCompetitions();renderClubDirectory();renderRanking();renderOnlineRanking();renderTransactions();renderRewards();renderCountryTiles();renderCommunity();}
  function rewardDaily(){const today=new Date().toISOString().slice(0,10);if(state.lastDaily===today){notify('La actividad diaria ya fue registrada hoy.');return;}state.lastDaily=today;state.activity++;state.xp+=15;state.rupras+=100;state.doblones+=1;state.transactions.push({date:nowString(),label:'Actividad diaria completada',rp:100,db:1});saveState();renderAll();notify('¡Actividad registrada! +R/. 100, +D// 1 y +15 XP.');}

  function exportCSV(){const lines=[['Fecha','Actividad','R/.','D//'],...state.transactions.map(t=>[t.date,t.label,t.rp,t.db])];const csv=lines.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='foxcrak-actividad.csv';a.click();URL.revokeObjectURL(a.href);notify('Historial exportado a CSV.');}

  document.addEventListener('click',event=>{const accountStatusBtn=event.target.closest('[data-account-status-toggle]');if(accountStatusBtn){const accountId=accountStatusBtn.dataset.accountStatusToggle;const all=listAccounts();const target=all.find(a=>a.id===accountId);if(!target)return;const suspend=target.status!=='suspended';if(suspend&&!confirm(`¿Suspender el perfil local «${target.username}»? No podrá iniciar sesión en este navegador.`))return;const next=all.map(a=>a.id===accountId?{...a,status:suspend?'suspended':'active'}:a);storeAccounts(next);if(suspend&&activeAccount?.id===accountId){saveState();activeAccount=null;sessionStorage.removeItem('foxcrakApsSession');localStorage.removeItem(REMEMBERED_PROFILE_KEY);showAuthGate(`El perfil «${target.username}» está suspendido en este dispositivo.`);notify('Perfil suspendido localmente.');}else{renderAll();notify(suspend?`Perfil «${target.username}» suspendido en este dispositivo.`:`Perfil «${target.username}» reactivado.`);}return;}const comingSoonBtn=event.target.closest('[data-coming-soon]');if(comingSoonBtn){event.preventDefault();notify(`${comingSoonBtn.dataset.comingSoon} · BLOQUEADO: VERSIÓN 1.1.`);return;}const viewBtn=event.target.closest('[data-view]');if(viewBtn){event.preventDefault();setView(viewBtn.dataset.view);return;}const statusBtn=event.target.closest('[data-status]');if(statusBtn){liveStatus=statusBtn.dataset.status;$$('#statusFilters .filter-chip').forEach(b=>b.classList.toggle('active',b===statusBtn));renderMatches();return;}const calBtn=event.target.closest('[data-cal]');if(calBtn){calendarMode=calBtn.dataset.cal;$$('.calendar-toolbar .filter-chip').forEach(b=>b.classList.toggle('active',b===calBtn));renderCalendar();return;}const countryBtn=event.target.closest('[data-country]');if(countryBtn){const picked=countryBtn.dataset.country;const meta=COUNTRIES.find(c=>c.key===picked);const short=meta?.short||'AR';const select=$('#clubDirectoryCountry');if(select)select.value=short;const typeSelect=$('#clubDirectoryCompetition');if(typeSelect)typeSelect.value='NATIONAL';const search=$('#clubDirectorySearch');if(search)search.value='';clubDirectoryPage=1;setView('clubdirectory');return;}const retry=event.target.closest('#emptyRefreshBtn');if(retry){refreshSportsData({force:true,quiet:false});return;}const pick=event.target.closest('[data-pick-outcome]');if(pick){const matchId=String(pick.dataset.pickMatch||'');const match=matches.find(x=>String(x.id)===matchId);if(!match||match.status!=='upcoming'||new Date(match.date).getTime()<=Date.now()){notify('Solo puedes guardar un pronóstico antes del inicio.');return;}const outcome=pick.dataset.pickOutcome;if(!['home','draw','away'].includes(outcome))return;const prev=Array.isArray(state.predictions)?state.predictions:[];state.predictions=[...prev.filter(p=>String(p.matchId)!==matchId),{matchId,outcome,home:match.home,away:match.away,league:match.league,date:match.date,savedAt:new Date().toISOString()}];saveState();openMatchDetails(match);notify('Pronóstico guardado. Tu saldo no cambia.');return;}const detail=event.target.closest('[data-match-info]');if(detail){const m=matches.find(x=>String(x.id)===String(detail.dataset.matchInfo));if(m)openMatchDetails(m);return;}});
  $('#authModeLogin').addEventListener('click',()=>setAuthMode('login'));
  $('#authModeRegister').addEventListener('click',()=>setAuthMode('register'));
  $('#authModeOnline').addEventListener('click',()=>setAuthMode('online'));
  $('#globalAuthBack').addEventListener('click',()=>{if(activeAccount){$('#authGate').hidden=true;$('#appShell').hidden=false;}else{setAuthMode('login');}});
  $('#localAuthForm').addEventListener('submit',handleLocalAuth);
  $('#logoutBtn').addEventListener('click',logoutLocal);
  $('#logoutBtnSettings').addEventListener('click',logoutLocal);
  $('#mobileMenu').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
  $('#closeMatchDialog').addEventListener('click',()=>$('#matchDialog').close());
  $('#matchDialog').addEventListener('click',event=>{if(event.target===$('#matchDialog'))$('#matchDialog').close();});
  document.addEventListener('error',event=>{if(event.target instanceof HTMLImageElement&&event.target.classList.contains('team-logo'))event.target.hidden=true;},true);
  $('#searchInput').addEventListener('input',e=>{searchText=e.target.value.toLowerCase();competitionFilter=null;renderMatches();renderCalendar();});
  $('#countryFilter').addEventListener('change',e=>{countryKey=e.target.value;competitionFilter=null;renderMatches();});
  $('#refreshBtn').addEventListener('click',()=>{setView('live');refreshSportsData({force:true,quiet:false});});
  if($('#refreshNowBtn'))$('#refreshNowBtn').addEventListener('click',()=>refreshSportsData({force:true,quiet:false}));
  if($('#settingsRefreshNowBtn'))$('#settingsRefreshNowBtn').addEventListener('click',()=>{setView('live');refreshSportsData({force:true,quiet:false});});
  $('#dailyTaskBtn').addEventListener('click',rewardDaily);$('#dailyTaskRewardBtn').addEventListener('click',rewardDaily);$('#exportActivity').addEventListener('click',exportCSV);
  async function makeAvatarData(file){
    if(!file||!/^image\/(png|jpeg|webp|gif)$/.test(file.type))throw new Error('Elige una imagen PNG, JPG, WebP o GIF.');
    if(file.size>5*1024*1024)throw new Error('La imagen debe pesar menos de 5 MB.');
    const source=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||''));reader.onerror=()=>reject(new Error('No se pudo leer la imagen.'));reader.readAsDataURL(file);});
    const image=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('La imagen no se pudo abrir.'));im.src=source;});
    const side=Math.min(image.naturalWidth,image.naturalHeight);if(!side)throw new Error('La imagen está vacía.');
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('No se pudo procesar la imagen.');
    ctx.drawImage(image,(image.naturalWidth-side)/2,(image.naturalHeight-side)/2,side,side,0,0,256,256);
    const data=canvas.toDataURL('image/jpeg',0.82);if(data.length>250000)throw new Error('La foto procesada es demasiado grande. Elige otra imagen.');return data;
  }
  if($('#profilePhotoInput'))$('#profilePhotoInput').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;const status=$('#profilePhotoStatus');status.textContent='Procesando imagen…';try{state.profilePhoto=await makeAvatarData(file);saveState();renderAll();status.textContent='Foto guardada en este perfil local y visible en el ranking de este dispositivo.';notify('Foto de perfil actualizada.');}catch(err){status.textContent=err.message||'No se pudo guardar la foto.';notify(status.textContent);}finally{e.target.value='';}});
  if($('#removeProfilePhoto'))$('#removeProfilePhoto').addEventListener('click',()=>{state.profilePhoto='';saveState();renderAll();$('#profilePhotoStatus').textContent='Foto eliminada; se mostrarán tus iniciales.';notify('Foto de perfil eliminada.');});
  $('#profileForm').addEventListener('submit',e=>{e.preventDefault();const name=$('#usernameInput').value.trim();if(activeAccount?.online&&name!==activeAccount.username){$('#usernameInput').value=activeAccount.username;notify('El nickname de una cuenta global está vinculado a su serie y no se cambia desde este formulario.');return;}if(!activeAccount?.online){if(!validateUsername(name)){notify('El nickname debe tener entre 3 y 24 caracteres.');return;}const key=normalizeUsername(name);const accounts=listAccounts();if(accounts.some(a=>a.id!==activeAccount?.id&&a.usernameKey===key)){notify('Ese nickname ya está registrado en este dispositivo.');return;}if(activeAccount){const updated=accounts.map(a=>a.id===activeAccount.id?{...a,username:name,usernameKey:key}:a);storeAccounts(updated);activeAccount=updated.find(a=>a.id===activeAccount.id)||activeAccount;}state.username=name;}state.bio=$('#profileBio').value.trim();state.activity++;state.xp+=10;saveState();renderAll();$('#profileSaved').textContent=activeAccount?.online?'Descripción guardada. XP sincronizado con la cuenta global.':'Nickname y perfil guardados en este dispositivo.';notify('Perfil actualizado. +10 XP de actividad.');});
  $('#onlineCommunityConfigForm').addEventListener('submit',saveOnlineCommunitySettings);
  $('#onlineCommunityTestBtn').addEventListener('click',()=>loadOnlineCommunityDirectory(false));
  $('#onlineRankRefresh').addEventListener('click',()=>loadOnlineCommunityDirectory(false));
  $('#communityRefreshDirectory').addEventListener('click',()=>loadOnlineCommunityDirectory(false));
  $('#communityJoinLink').addEventListener('click',()=>openGlobalAuth('register'));
  $('#openGlobalAuthSettings').addEventListener('click',()=>openGlobalAuth('register'));
  $('#communityRefreshDirectoryInline').addEventListener('click',()=>loadOnlineCommunityDirectory(false));
  $('#globalAuthFrame').addEventListener('load',()=>{if(!isAppsScriptEndpoint(readOnlineCommunityConfig().endpointUrl)){globalAuthFrameReady=false;return;}globalAuthFrameReady=true;flushGlobalFrameMessage();});
  if($('#clubDirectorySearch'))$('#clubDirectorySearch').addEventListener('input',()=>{clubDirectoryPage=1;renderClubDirectory();});if($('#clubDirectoryCountry'))$('#clubDirectoryCountry').addEventListener('change',()=>{clubDirectoryPage=1;renderClubDirectory();});if($('#clubDirectoryCompetition'))$('#clubDirectoryCompetition').addEventListener('change',()=>{clubDirectoryPage=1;renderClubDirectory();});if($('#clubDirectoryPrev'))$('#clubDirectoryPrev').addEventListener('click',()=>{clubDirectoryPage=Math.max(1,clubDirectoryPage-1);renderClubDirectory();});if($('#clubDirectoryNext'))$('#clubDirectoryNext').addEventListener('click',()=>{clubDirectoryPage++;renderClubDirectory();});
  $('#toggleSquares').addEventListener('change',e=>updateAppearance({showSquares:e.target.checked},'Preferencia de cuadrados guardada en este perfil.'));$('#toggleCoins').addEventListener('change',e=>updateAppearance({showCoins:e.target.checked},'Preferencia de monedas guardada en este perfil.'));$('#reduceMotion').addEventListener('change',e=>updateAppearance({reduceMotion:e.target.checked},'Preferencia de movimiento guardada en este perfil.'));
  $$('.theme-preset').forEach(btn=>btn.addEventListener('click',()=>choosePreset(btn.dataset.preset)));
  [['accentColor','accent'],['highlightColor','highlight'],['backgroundColor','background'],['panelColor','panel']].forEach(([id,key])=>$('#'+id).addEventListener('input',e=>updateAppearance({[key]:e.target.value},'Color actualizado. Los cambios se guardan automáticamente.')));
  $('#buttonStyle').addEventListener('change',e=>updateAppearance({buttonStyle:e.target.value},'Estilo de botones actualizado.'));
  $('#resetThemeBtn').addEventListener('click',()=>choosePreset('burgundy'));
  $('#resetProfileBtn').addEventListener('click',()=>{if(!confirm('¿Restablecer el perfil y el historial local? Esta acción no se puede deshacer.'))return;state=mergeState({...DEFAULT_STATE,username:activeAccount?.username||DEFAULT_STATE.username,appearance:{...DEFAULT_STATE.appearance},transactions:[],visited:[],view:'inicio'},activeAccount?.username||'Perfil APS');applyAppearance();saveState();renderAll();setView('inicio',false);notify('Progreso y apariencia de este perfil restablecidos.');});
  function fadeBootScreen(){const boot=$('#appBootScreen');if(!boot||boot.classList.contains('fade-out'))return;boot.classList.add('fade-out');setTimeout(()=>boot.remove(),650);}
  function init(){createAmbient();applyAppearance();initializeOnlineCommunity();restoreAccountSession();startSportsAutoRefresh();setTimeout(fadeBootScreen,1350);}
  function switchDemoSilent(){mergeSportMatches();realData=!!lastFeedSuccessAt;renderAll();}
  window.FoxcrakApp={getState(){return JSON.parse(JSON.stringify(state));},getActiveProfile(){return activeAccount?{username:activeAccount.username,id:activeAccount.id}:null;},addXP(amount=10,reason='Actividad APS'){const n=Math.max(0,Math.floor(Number(amount)||0));if(!n)return;state.xp=Math.max(0,Number(state.xp)||0)+n;state.activity=Math.max(0,Number(state.activity)||0)+1;state.transactions.push({date:nowString(),label:String(reason||'Actividad APS'),rp:0,db:0});saveState();renderAll();notify(`+${n} XP APS`);},refreshOnlineDirectory(){loadOnlineCommunityDirectory(false);},notify(message){notify(message);}};
  init();
})();
