/*
  BollyHits Radio Network station configuration.
  The four BollyHits now-playing API endpoints were supplied by the site owner.
  DesiZone stream URLs are based on the public station links on desizoneradio.com.
  If a stream URL changes, edit the relevant `stream` value below.
*/
window.RADIO_STATIONS = [
  {id:"bollyhits-radio", name:"BollyHits Radio", group:"bollyhits", tag:"The main station", short:"BH", logoClass:"", description:"The latest Bollywood favourites and non-stop Hindi hits.", api:"https://az13.yesstreaming.net/api/nowplaying/163", stream:"https://az13.yesstreaming.net:8450/bollyhitsradio128kbps", accent:"pink"},
  {id:"bollyhits-gold", name:"BollyHits GOLD", group:"bollyhits", tag:"Golden classics", short:"GOLD", logoClass:"gold", description:"Golden melodies, evergreen voices and timeless romance.", api:"https://radio.bollyhitsradio.com/api/nowplaying/1", stream:"https://radio.bollyhitsradio.com/listen/bollyhits_gold/radio.mp3", accent:"gold"},
  {id:"bollyhits-joy", name:"BollyHits JOY", group:"bollyhits", tag:"Feel-good hits", short:"JOY", logoClass:"joy", description:"Joyful hits and feel-good Bollywood favourites.", api:"https://radio.bollyhitsradio.com/api/nowplaying/4", stream:"https://radio.bollyhitsradio.com/listen/bollyhits_joy/radio.mp3", accent:"pink"},
  {id:"bollyhits-nadeem-shravan", name:"BollyHits Nadeem-Shravan", group:"bollyhits", tag:"90s romance", short:"N·S", logoClass:"nadeem", description:"Melodic classics from the legendary Nadeem–Shravan era.", api:"https://radio.bollyhitsradio.com/api/nowplaying/2", stream:"https://radio.bollyhitsradio.com/listen/bollyhits_-_nadeem_shravan_melodies/radio.mp3", accent:"orange"},
  {id:"desizone-radio", name:"DesiZone Radio", group:"desizone", tag:"Today's desi hits", short:"DZ", logoClass:"dz", description:"New Bollywood, Hindi, Punjabi and Urdu hits.", stream:"https://cast2.asurahosting.com/proxy/desizone/radio1", page:"https://www.desizoneradio.com/", accent:"teal"},
  {id:"desi-hits-2000s", name:"Desi Hits 2000s", group:"desizone", tag:"2000s throwbacks", short:"00s", logoClass:"hits2k", description:"Relive the chart-topping sounds and memories of the 2000s.", stream:"https://stream.desizoneradio.com/relay2", page:"https://www.desizoneradio.com/2000s", accent:"blue"},
  {id:"nostalgic-bollywood-90s", name:"Nostalgic Bollywood 90s", group:"desizone", tag:"90s nostalgia", short:"90s", logoClass:"nineties", description:"The golden decade of Bollywood melodies and unforgettable voices.", stream:"https://stream.desizoneradio.com/relay3", page:"https://www.desizoneradio.com/90s", accent:"purple"}
];
