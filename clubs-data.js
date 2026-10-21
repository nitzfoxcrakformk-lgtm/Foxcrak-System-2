/* Directorio estático de referencia de clubes sudamericanos, consultado el 16-10-2026.
   No es un feed de partidos en vivo. Verificar participantes/cambios de temporada en los enlaces oficiales. */
(function(){
  const countries = [
    {name:'Argentina', code:'AR', flag:'🇦🇷', league:'Liga Profesional de Fútbol', source:'https://www.lpf.org.ar/notas/primera/2025/12/11/fixtures-de-la-temporada-2026/', association:'https://www.afa.com.ar/', clubs:[
      'Aldosivi','Argentinos Juniors','Atlético Tucumán','Banfield','Barracas Central','Belgrano','Boca Juniors','Central Córdoba','Defensa y Justicia','Deportivo Riestra','Estudiantes de La Plata','Estudiantes de Río Cuarto','Gimnasia y Esgrima La Plata','Gimnasia y Esgrima Mendoza','Huracán','Independiente','Independiente Rivadavia','Instituto','Lanús',"Newell’s Old Boys",'Platense','Racing Club','River Plate','Rosario Central','San Lorenzo','Sarmiento','Talleres de Córdoba','Tigre','Unión de Santa Fe','Vélez Sarsfield'
    ]},
    {name:'Bolivia', code:'BO', flag:'🇧🇴', league:'División Profesional', source:'https://es.wikipedia.org/wiki/Primera_Divisi%C3%B3n_de_Bolivia_2026', association:'https://www.fbf.com.bo/', clubs:[
      'ABB','Always Ready','Aurora','Blooming','Bolívar','Guabirá','Gualberto Villarroel San José','Independiente Petrolero','Nacional Potosí','Oriente Petrolero','Real Potosí','Real Tomayapo','San Antonio Bulo Bulo','The Strongest','Totora Real Oruro','Universitario de Vinto'
    ]},
    {name:'Brasil', code:'BR', flag:'🇧🇷', league:'Campeonato Brasileiro Série A', source:'https://www.cbf.com.br/futebol-brasileiro/times/campeonato-brasileiro/serie-a/2026', association:'https://www.cbf.com.br/', clubs:[
      'Athletico Paranaense','Atlético Mineiro','Bahia','Botafogo','Chapecoense','Corinthians','Coritiba','Cruzeiro','Flamengo','Fluminense','Grêmio','Internacional','Mirassol','Palmeiras','Red Bull Bragantino','Remo','Santos','São Paulo','Vasco da Gama','Vitória'
    ]},
    {name:'Chile', code:'CL', flag:'🇨🇱', league:'Liga de Primera', source:'https://www.anfp.cl/division-categoria/clubes-primera-division/', association:'https://www.anfp.cl/', clubs:[
      'Audax Italiano','Cobresal','Colo-Colo','Coquimbo Unido','Deportes Concepción','Deportes La Serena','Deportes Limache','Everton de Viña del Mar','Huachipato','Ñublense','O’Higgins','Palestino','Universidad Católica','Universidad de Chile','Unión La Calera','Universidad de Concepción'
    ]},
    {name:'Colombia', code:'CO', flag:'🇨🇴', league:'Liga BetPlay DIMAYOR', source:'https://dimayor.com.co/liga-betplay-dimayor/', association:'https://dimayor.com.co/', clubs:[
      'Alianza Valledupar','América de Cali','Atlético Bucaramanga','Atlético Nacional','Boyacá Chicó','Cúcuta Deportivo','Deportes Tolima','Deportivo Cali','Deportivo Pasto','Deportivo Pereira','Fortaleza CEIF','Independiente Medellín','Independiente Santa Fe','Internacional de Bogotá','Jaguares de Córdoba','Junior','Llaneros FC','Millonarios','Once Caldas','Águilas Doradas'
    ]},
    {name:'Ecuador', code:'EC', flag:'🇪🇨', league:'LigaPro Serie A', source:'https://ligapro.ec/equipos/', association:'https://www.fef.ec/', clubs:[
      'Aucas','Barcelona Sporting Club','Delfín','Deportivo Cuenca','Emelec','Guayaquil City','Independiente del Valle','Leones FC','Libertad FC','LDU Quito','Macará','Manta FC','Mushuc Runa','Orense SC','Técnico Universitario','Universidad Católica de Quito'
    ]},
    {name:'Paraguay', code:'PY', flag:'🇵🇾', league:'Copa de Primera · División de Honor', source:'https://www.apf.org.py/noticias/listo-calendario-para-la-temporada-2026', association:'https://www.apf.org.py/', clubs:[
      'Cerro Porteño','Club Guaraní','Club Libertad','Club Nacional','Club Olimpia','Deportivo Recoleta','Rubio Ñu','Sportivo 2 de Mayo','Sportivo Ameliano','Sportivo Luqueño','Sportivo San Lorenzo','Sportivo Trinidense'
    ]},
    {name:'Perú', code:'PE', flag:'🇵🇪', league:'Liga 1', source:'https://es.wikipedia.org/wiki/Primera_Divisi%C3%B3n_del_Per%C3%BA', association:'https://fpf.org.pe/', clubs:[
      'ADT','Alianza Atlético','Alianza Lima','Atlético Grau','Cienciano','Comerciantes Unidos','Cusco FC','Deportivo Garcilaso','Deportivo Moquegua','FC Cajamarca','FBC Melgar','Juan Pablo II College','Los Chankas','Sport Boys','Sport Huancayo','Sporting Cristal','Universitario de Deportes','UTC'
    ]},
    {name:'Uruguay', code:'UY', flag:'🇺🇾', league:'Liga AUF Uruguaya', source:'https://es.wikipedia.org/wiki/Campeonato_Uruguayo_de_Primera_Divisi%C3%B3n_2026', association:'https://www.auf.org.uy/', clubs:[
      'Albion','Boston River','Central Español','Cerro','Cerro Largo','Danubio','Defensor Sporting','Deportivo Maldonado','Juventud de Las Piedras','Liverpool FC','Montevideo City Torque','Montevideo Wanderers','Nacional','Peñarol','Progreso','Racing Club de Montevideo'
    ]},
    {name:'Venezuela', code:'VE', flag:'🇻🇪', league:'Liga FUTVE', source:'https://www.ligafutve.org/', association:'https://www.fvf.com.ve/', clubs:[
      'Academia Puerto Cabello','Anzoátegui FC','Carabobo FC','Caracas FC','Deportivo La Guaira','Deportivo Táchira','Estudiantes de Mérida','Metropolitanos FC','Monagas SC','Portuguesa FC','Rayo Zuliano','Trujillanos FC','Universidad Central de Venezuela','Zamora FC'
    ]},
    {name:'Guyana', code:'GY', flag:'🇬🇾', league:'GFF Elite League', source:'https://www.guyanafootball.org/', association:'https://www.guyanafootball.org/', clubs:[
      'Slingerz FC','Guyana Police Force FC','Guyana Defence Force FC','Western Tigers FC','Santos FC','Monedderlust FC','Ann’s Grove United FC','Den Amstel FC','Fruta Conquerors FC','Camptown FC'
    ]},
    {name:'Surinam', code:'SR', flag:'🇸🇷', league:'Suriname Major League', source:'https://sml.sr/', association:'https://svb.sr/', clubs:[
      'Coronie Boys','Inter Wanica','Inter Moengotapoe','PVV','Robinhood','SV Broki','SV Flora','SV Leo Victor','SV Notch','SV Transvaal','SV Voorwaarts'
    ]}
  ];
  window.FOXCRAK_CLUB_DIRECTORY = {
    updated:'2026-10-16',
    season:'2026',
    countries:countries,
    competitions:[
      {name:'CONMEBOL Libertadores',type:'Continental',source:'https://gol.conmebol.com/libertadores/es/teams',flag:'🏆'},
      {name:'CONMEBOL Sudamericana',type:'Continental',source:'https://gol.conmebol.com/sudamericana/es/teams',flag:'🏆'}
    ],
    note:'Catálogo de referencia estático de los doce países soberanos de Sudamérica. Las diez asociaciones de CONMEBOL disputan Libertadores y Sudamericana; Guyana y Surinam pertenecen a Concacaf. Participantes y formatos cambian por temporada. Google Search no es un feed de marcadores en directo.'
  };
})();
