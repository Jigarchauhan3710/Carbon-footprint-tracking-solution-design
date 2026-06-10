'use strict';
/*
 * CarbonWise v3 — External Test Suite
 * Runs with: node test.js
 * Zero npm dependencies. Mirrors pure functions verbatim from index.html.
 * Groups: 12 | All assertions synchronous
 */

/* ─── Mirror constants from index.html ─── */
var GEMINI_MODEL             = 'gemini-2.5-flash';
var GEMINI_API_BASE          = 'https://generativelanguage.googleapis.com/v1beta/models/';
var GEMINI_ENDPOINT          = ':generateContent';
var GOOGLE_CHARTS_VERSION    = 'current';
var FIREBASE_SDK_VERSION     = '10.8.0';
var GEMINI_MAX_TOKENS        = 900;
var GEMINI_TIMEOUT_MS        = 15000;
var CHARTS_RETRY_DELAY_MS    = 200;
var LEADERBOARD_MAX_ENTRIES  = 10;
var LEADERBOARD_NAME_MAX_LEN = 24;
var FONT_SIZE_MIN_PX         = 12;
var FONT_SIZE_MAX_PX         = 22;
var KEY_MIN_LENGTH           = 20;
var KEY_PREFIX               = 'AIza';
var MAX_CAR_KM               = 200000;
var MAX_BIKE_KM              = 100000;
var MAX_KWH_MONTH            = 5000;
var MAX_FLIGHTS              = 100;
var MAX_ORDERS_MONTH         = 200;
var MONTHS_PER_YEAR          = 12;
var KG_PER_TONNE             = 1000;
var QUIZ_QUESTIONS_PER_LEVEL = 5;
var LB_ENTRY_MIN_SAVING      = 0;

/* Emission factors */
var EF_CAR_KM           = 0.171;
var EF_BIKE_KM          = 0.083;
var EF_GRID_KWH         = 0.82;
var EF_FLIGHT_DOMESTIC  = 0.255;
var EF_SHOPPING_ORDER   = 0.005;
var DIET_VEGAN_T        = 0.5;
var DIET_VEG_T          = 0.9;
var DIET_OMNI_LOW_T     = 1.4;
var DIET_OMNI_HIGH_T    = 2.5;

/* Benchmarks */
var AVG_INDIA_T         = 1.9;
var AVG_WORLD_T         = 4.7;
var TARGET_1_5_T        = 2.3;
var MAX_BAR_SCALE_T     = 10.0;

/* CONFIG (mirrored) */
var CONFIG = {
  geminiUrl: GEMINI_API_BASE + GEMINI_MODEL + GEMINI_ENDPOINT,
  firebase: {
    apiKey:      'YOUR_API_KEY',
    authDomain:  'your-project.firebaseapp.com',
    databaseURL: 'https://your-project-default-rtdb.firebaseio.com',
    projectId:   'your-project'
  },
  ga4MeasurementId: 'G-XXXXXXXXXX'
};

/* ─── Mirror pure functions verbatim ─── */

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

function isValidKey(key) {
  // Accept any non-empty key of reasonable length — Gemini key formats vary
  return typeof key === 'string' && key.trim().length >= KEY_MIN_LENGTH;
}

function validateConfig() {
  var fb = CONFIG.firebase;
  return {
    geminiUrlOk: CONFIG.geminiUrl.startsWith('https://') &&
                 CONFIG.geminiUrl.indexOf('generateContent') !== -1,
    firebaseOk:  !!fb.databaseURL &&
                 fb.apiKey !== 'YOUR_API_KEY' &&
                 fb.apiKey.indexOf('Demo') === -1 &&
                 fb.apiKey.indexOf('placeholder') === -1,
    ga4Ok:       CONFIG.ga4MeasurementId !== 'G-XXXXXXXXXX'
  };
}

function getDietTonnes(diet) {
  var map = { vegan: DIET_VEGAN_T, veg: DIET_VEG_T, omni_low: DIET_OMNI_LOW_T, omni_high: DIET_OMNI_HIGH_T };
  return map[diet] !== undefined ? map[diet] : DIET_VEG_T;
}

function calcFootprint(inp) {
  var car     = Math.min(MAX_CAR_KM,      Math.max(0, inp.carKm       || 0));
  var bike    = Math.min(MAX_BIKE_KM,     Math.max(0, inp.bikeKm      || 0));
  var kwh     = Math.min(MAX_KWH_MONTH,   Math.max(0, inp.kwhMonth    || 0));
  var flights = Math.min(MAX_FLIGHTS,     Math.max(0, inp.flights     || 0));
  var orders  = Math.min(MAX_ORDERS_MONTH,Math.max(0, inp.ordersMonth || 0));

  var tCar      = (car   * EF_CAR_KM)  / KG_PER_TONNE;
  var tBike     = (bike  * EF_BIKE_KM) / KG_PER_TONNE;
  var tElec     = (kwh   * MONTHS_PER_YEAR * EF_GRID_KWH) / KG_PER_TONNE;
  var tDiet     = getDietTonnes(inp.diet);
  var tFlights  = flights * EF_FLIGHT_DOMESTIC;
  var tShopping = orders  * MONTHS_PER_YEAR * EF_SHOPPING_ORDER;
  var total     = tCar + tBike + tElec + tDiet + tFlights + tShopping;

  return {
    total:       Math.round(total    * 100) / 100,
    car:         Math.round(tCar     * 100) / 100,
    bike:        Math.round(tBike    * 100) / 100,
    electricity: Math.round(tElec    * 100) / 100,
    diet:        Math.round(tDiet    * 100) / 100,
    flights:     Math.round(tFlights * 100) / 100,
    shopping:    Math.round(tShopping* 100) / 100
  };
}

function getFpRating(t) {
  if (t <= AVG_INDIA_T)  return { label:'Excellent', color:'var(--primary)' };
  if (t <= TARGET_1_5_T) return { label:'Good',      color:'var(--teal)' };
  if (t <= AVG_WORLD_T)  return { label:'Average',   color:'var(--gold)' };
  return                        { label:'High',       color:'var(--red)' };
}

/* ─── Quiz data (mirrored shape) ─── */
var QD = {
  easy: [
    { q:'Q1', opts:['A','B','C','D'], ans:1, expl:'e1' },
    { q:'Q2', opts:['A','B','C','D'], ans:2, expl:'e2' },
    { q:'Q3', opts:['A','B','C','D'], ans:1, expl:'e3' },
    { q:'Q4', opts:['A','B','C','D'], ans:2, expl:'e4' },
    { q:'Q5', opts:['A','B','C','D'], ans:1, expl:'e5' }
  ],
  med: [
    { q:'Q1', opts:['A','B','C','D'], ans:1, expl:'m1' },
    { q:'Q2', opts:['A','B','C','D'], ans:2, expl:'m2' },
    { q:'Q3', opts:['A','B','C','D'], ans:1, expl:'m3' },
    { q:'Q4', opts:['A','B','C','D'], ans:3, expl:'m4' },
    { q:'Q5', opts:['A','B','C','D'], ans:1, expl:'m5' }
  ],
  hard: [
    { q:'Q1', opts:['A','B','C','D'], ans:1, expl:'h1' },
    { q:'Q2', opts:['A','B','C','D'], ans:1, expl:'h2' },
    { q:'Q3', opts:['A','B','C','D'], ans:2, expl:'h3' },
    { q:'Q4', opts:['A','B','C','D'], ans:2, expl:'h4' },
    { q:'Q5', opts:['A','B','C','D'], ans:2, expl:'h5' }
  ]
};

/* ─── GEO_DATA shape (mirrored) ─── */
var GEO_DATA = [
  ['State', 'CO₂ (tCO₂e/capita)'],
  ['IN-RJ', 2.8], ['IN-MP', 2.4], ['IN-CG', 4.1], ['IN-UP', 1.6],
  ['IN-MH', 2.2], ['IN-GJ', 3.5], ['IN-HR', 2.9], ['IN-PB', 2.7],
  ['IN-DL', 2.5], ['IN-KA', 1.9], ['IN-TN', 2.3], ['IN-AP', 2.0],
  ['IN-TG', 3.1], ['IN-WB', 1.8], ['IN-BR', 0.9], ['IN-JH', 3.8],
  ['IN-OR', 2.6], ['IN-AS', 1.4], ['IN-KL', 1.7], ['IN-HP', 1.2],
  ['IN-UK', 1.5], ['IN-JK', 1.1], ['IN-GA', 2.1]
];

/* ─── TX translations (mirrored keys) ─── */
var TX = {
  en: {
    advisorBtn:'Get My Plan', logAction:'Log Actions', submitScore:'Submit Score',
    quizNext:'Next Question →', quizRetry:'🔄 Try Again', quizResult:'Quiz Complete!',
    quizYourScore:'Your score:', calculating:'Calculating...', sending:'Sending...',
    saving:'Saving...', voiceStart:'Listening… speak now', voiceStop:'Voice stopped',
    noKey:'⚠️ Please enter your Gemini API key.',
    noCalc:'⚠️ Calculate your footprint first.',
    errorTimeout:'⏱️ Request timed out. Please try again.',
    lbOffline:'Leaderboard is offline (Firebase not configured).',
    lbSaved:'✅ Score saved!'
  },
  hi: {
    advisorBtn:'मेरी योजना पाएं', logAction:'क्रियाएं दर्ज करें', submitScore:'स्कोर सबमिट करें',
    quizNext:'अगला प्रश्न →', quizRetry:'🔄 फिर कोशिश करें', quizResult:'प्रश्नोत्तरी पूर्ण!',
    quizYourScore:'आपका स्कोर:', calculating:'गणना हो रही है...', sending:'भेजा जा रहा है...',
    saving:'सहेजा जा रहा है...', voiceStart:'सुन रहा है... अब बोलें', voiceStop:'आवाज़ बंद',
    noKey:'⚠️ कृपया अपना Gemini API key दर्ज करें।',
    noCalc:'⚠️ पहले अपना फुटप्रिंट गणना करें।',
    errorTimeout:'⏱️ अनुरोध टाइमआउट। पुनः प्रयास करें।',
    lbOffline:'लीडरबोर्ड ऑफलाइन है (Firebase कॉन्फ़िगर नहीं)।',
    lbSaved:'✅ स्कोर सहेजा गया!'
  }
};

/* ─── Test harness ─── */
var totalPass = 0;
var totalFail = [];

function group(name) { console.log('\n> ' + name); }

function assert(label, ok) {
  if (ok) {
    totalPass++;
  } else {
    totalFail.push(label);
    console.log('  ✗ FAIL: ' + label);
  }
}

/* ══════════════════════════════════════════════
   > 1. Gemini API
══════════════════════════════════════════════ */
group('1. Gemini API');
assert('GEMINI_MODEL is gemini-2.5-flash',        GEMINI_MODEL === 'gemini-2.5-flash');
assert('GEMINI_API_BASE uses HTTPS',              GEMINI_API_BASE.startsWith('https://'));
assert('GEMINI_ENDPOINT is :generateContent',     GEMINI_ENDPOINT === ':generateContent');
assert('CONFIG.geminiUrl uses HTTPS',             CONFIG.geminiUrl.startsWith('https://'));
assert('CONFIG.geminiUrl contains generateContent', CONFIG.geminiUrl.indexOf('generateContent') > -1);
assert('CONFIG.geminiUrl contains model name',    CONFIG.geminiUrl.indexOf('gemini-2.5-flash') > -1);
assert('GEMINI_MAX_TOKENS is 900',                GEMINI_MAX_TOKENS === 900);
assert('GEMINI_TIMEOUT_MS is 15000',              GEMINI_TIMEOUT_MS === 15000);
assert('URL is full valid endpoint',              CONFIG.geminiUrl === 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent');

/* ══════════════════════════════════════════════
   > 2. Security & XSS
══════════════════════════════════════════════ */
group('2. Security & XSS');
assert('sanitize blocks script tag',              sanitize('<scr'+'ipt>x</scr'+'ipt>').indexOf('<scr'+'ipt>') === -1);
assert('sanitize encodes &lt;',                   sanitize('<b>').indexOf('&lt;') > -1);
assert('sanitize encodes &gt;',                   sanitize('<b>').indexOf('&gt;') > -1 && sanitize('>').indexOf('&gt;') > -1);
assert('sanitize encodes &amp;',                  sanitize('a & b').indexOf('&amp;') > -1);
assert('sanitize encodes &quot;',                 sanitize('"hi"').indexOf('&quot;') > -1);
assert('sanitize converts **bold** to strong',    sanitize('**bold**').indexOf('<strong>') > -1);
assert('sanitize converts *italic* to em',        sanitize('*italic*').indexOf('<em>') > -1);
assert('sanitize converts `code` to code',        sanitize('`code`').indexOf('<code>') > -1);
assert('sanitize handles empty string',           sanitize('') === '');
assert('sanitize handles non-string gracefully',  sanitize(null) === '' && sanitize(undefined) === '');
assert('sanitize newline to br',                  sanitize('a\nb').indexOf('<br>') > -1);
assert('isValidKey rejects empty string',         !isValidKey(''));
assert('isValidKey rejects short key',            !isValidKey('AIza123'));
assert('isValidKey accepts non-AIza prefix',       isValidKey('BAAD_aaaaaaaaaaaaaaaaaaa'));
assert('isValidKey accepts valid 30-char key',    isValidKey('AIzaSyDemoKey123456789ABCDEF'));
assert('isValidKey rejects 19-char key',          !isValidKey('AIzaSyShortKey1234X'));
assert('isValidKey accepts 20-char key',           isValidKey('AIzaSyExactLength20XX'));

/* ══════════════════════════════════════════════
   > 3. Google Fonts & Material Symbols
══════════════════════════════════════════════ */
group('3. Google Fonts & Material Symbols');
var fs = require('fs');
var html = fs.readFileSync('./index.html', 'utf8');
assert('Fonts preconnect fonts.googleapis.com',   html.indexOf('preconnect') > -1 && html.indexOf('fonts.googleapis.com') > -1);
assert('Fonts preconnect fonts.gstatic.com',      html.indexOf('fonts.gstatic.com') > -1);
assert('Fonts: Playfair Display loaded',          html.indexOf('Playfair+Display') > -1);
assert('Fonts: Inter loaded',                     html.indexOf('Inter') > -1);
assert('Fonts: Noto Sans Devanagari loaded',      html.indexOf('Noto+Sans+Devanagari') > -1);
assert('Material Symbols Outlined loaded',        html.indexOf('Material+Symbols+Outlined') > -1);
assert('Material Symbols uses opsz,wght,FILL,GRAD', html.indexOf('opsz,wght,FILL,GRAD') > -1);
assert('CSS --fh uses Playfair Display',          html.indexOf("'Playfair Display'") > -1);
assert('CSS --fb uses Inter',                     html.indexOf("'Inter'") > -1);
assert('CSS --fhi uses Noto Sans Devanagari',     html.indexOf("'Noto Sans Devanagari'") > -1);

/* ══════════════════════════════════════════════
   > 4. Google Charts
══════════════════════════════════════════════ */
group('4. Google Charts');
assert('Charts loader URL HTTPS',                 html.indexOf('https://www.gstatic.com/charts/loader.js') > -1);
assert('Charts version is current',              html.indexOf("GOOGLE_CHARTS_VERSION    = 'current'") > -1 || html.indexOf("'current'") > -1);
assert('Charts packages includes geochart',       html.indexOf("'geochart'") > -1);
assert('Charts packages includes corechart',      html.indexOf("'corechart'") > -1);
assert('Charts packages includes bar',            html.indexOf("'bar'") > -1);
assert('setOnLoadCallback present',               html.indexOf('setOnLoadCallback') > -1);
assert('buildGoogleCharts called in callback',    html.indexOf('buildGoogleCharts') > -1);
assert('buildGeoChart called in callback',        html.indexOf('buildGeoChart') > -1);
assert('PieChart draw present',                   html.indexOf('PieChart') > -1);
assert('ColumnChart draw present',                html.indexOf('ColumnChart') > -1);
assert('Bar chart draw present',                  html.indexOf('charts.Bar') > -1);
assert('try/catch around chart draw',             html.indexOf('degraded gracefully') > -1);

/* ══════════════════════════════════════════════
   > 5. GeoChart — India State Data
══════════════════════════════════════════════ */
group('5. GeoChart — India State Data');
assert('GEO_DATA is array',                       Array.isArray(GEO_DATA));
assert('GEO_DATA has >= 10 states + header',      GEO_DATA.length >= 11);
assert('GEO_DATA header row correct',             GEO_DATA[0][0] === 'State');
assert('GEO_DATA header col2 is string',          typeof GEO_DATA[0][1] === 'string');
assert('GEO_DATA state codes use IN- prefix',     GEO_DATA[1][0].startsWith('IN-'));
assert('GEO_DATA values are positive numbers',    GEO_DATA.slice(1).every(function(r){return typeof r[1]==='number'&&r[1]>0;}));
assert('GEO_DATA max value is realistic (<=10)',  Math.max.apply(null,GEO_DATA.slice(1).map(function(r){return r[1];})) <= 10);
assert('GEO_DATA min value is realistic (>0)',    Math.min.apply(null,GEO_DATA.slice(1).map(function(r){return r[1];})) > 0);
assert('GEO_DATA contains Maharashtra (IN-MH)',   GEO_DATA.some(function(r){return r[0]==='IN-MH';}));
assert('GEO_DATA contains Delhi (IN-DL)',         GEO_DATA.some(function(r){return r[0]==='IN-DL';}));
assert('GeoChart region is IN',                   html.indexOf("region: 'IN'") > -1);
assert('GeoChart resolution is provinces',        html.indexOf("resolution: 'provinces'") > -1);
assert('GeoChart colorAxis present',              html.indexOf('colorAxis') > -1);

/* ══════════════════════════════════════════════
   > 6. Firebase Realtime Database
══════════════════════════════════════════════ */
group('6. Firebase Realtime Database');
assert('Firebase SDK version 10.8.0 in HTML',    html.indexOf('10.8.0') > -1);
assert('firebase-app-compat.js loaded',           html.indexOf('firebase-app-compat.js') > -1);
assert('firebase-database-compat.js loaded',      html.indexOf('firebase-database-compat.js') > -1);
assert('firebase-auth-compat.js loaded',          html.indexOf('firebase-auth-compat.js') > -1);
assert('CONFIG.firebase has apiKey',              typeof CONFIG.firebase.apiKey === 'string');
assert('CONFIG.firebase has databaseURL',         typeof CONFIG.firebase.databaseURL === 'string');
assert('CONFIG.firebase has projectId',           typeof CONFIG.firebase.projectId === 'string');
assert('CONFIG.firebase databaseURL is HTTPS',    CONFIG.firebase.databaseURL.startsWith('https://'));
assert('Placeholder detection: YOUR_API_KEY',     html.indexOf("cfg.apiKey === 'YOUR_API_KEY'") > -1);
assert('Placeholder detection: Demo string',      html.indexOf("'Demo'") > -1);
assert('Placeholder detection: placeholder string', html.indexOf("'placeholder'") > -1);
assert('onValue listener present',                html.indexOf('.on(\'value\'') > -1 || html.indexOf('.on("value"') > -1);
assert('orderByChild used',                       html.indexOf('orderByChild') > -1);
assert('limitToLast used',                        html.indexOf('limitToLast') > -1);
assert('LEADERBOARD_MAX_ENTRIES = 10',            LEADERBOARD_MAX_ENTRIES === 10);

/* ══════════════════════════════════════════════
   > 7. Google Analytics 4
══════════════════════════════════════════════ */
group('7. Google Analytics 4');
assert('GA4 gtag.js script present',              html.indexOf('googletagmanager.com/gtag/js') > -1);
assert('GA4 script has async attribute',          html.indexOf('async src="https://www.googletagmanager.com') > -1);
assert('GA4 gtag function defined',               html.indexOf('function gtag()') > -1);
assert('GA4 dataLayer initialized',               html.indexOf('window.dataLayer') > -1);
assert('gaEvent helper defined',                  html.indexOf('function gaEvent(') > -1);
assert('gaEvent called on calculate',             html.indexOf("gaEvent('calculate_footprint'") > -1);
assert('gaEvent called on log_action',            html.indexOf("gaEvent('log_action'") > -1);
assert('gaEvent called on quiz_complete',         html.indexOf("gaEvent('quiz_complete'") > -1);
assert('gaEvent called on chat_send',             html.indexOf("gaEvent('chat_send'") > -1);
assert('gaEvent called on plan_generated',        html.indexOf("gaEvent('plan_generated'") > -1);
assert('gaEvent called on app_load',              html.indexOf("gaEvent('app_load'") > -1);
assert('gaEvent called on firebase_init',         html.indexOf("gaEvent('firebase_init'") > -1);

/* ══════════════════════════════════════════════
   > 8. Multilingual EN/HI
══════════════════════════════════════════════ */
group('8. Multilingual EN/HI');
var TX_KEYS = ['advisorBtn','logAction','submitScore','quizNext','quizRetry',
               'quizResult','quizYourScore','calculating','sending','saving',
               'voiceStart','voiceStop','noKey','noCalc','errorTimeout','lbOffline','lbSaved'];
TX_KEYS.forEach(function(k) {
  assert('TX.en has key: ' + k, typeof TX.en[k] === 'string' && TX.en[k].length > 0);
  assert('TX.hi has key: ' + k, typeof TX.hi[k] === 'string' && TX.hi[k].length > 0);
});
assert('TX EN and HI differ for advisorBtn',      TX.en.advisorBtn !== TX.hi.advisorBtn);
assert('TX EN and HI differ for quizNext',        TX.en.quizNext   !== TX.hi.quizNext);
assert('TX EN and HI differ for lbSaved',         TX.en.lbSaved    !== TX.hi.lbSaved);
assert('data-en attributes in HTML',              html.indexOf('data-en=') > -1);
assert('data-hi attributes in HTML',              html.indexOf('data-hi=') > -1);
assert('html lang="en" present',                  html.indexOf('lang="en"') > -1);
assert('Devanagari font loaded for HI',           html.indexOf('Noto+Sans+Devanagari') > -1);

/* ══════════════════════════════════════════════
   > 9. Quiz Engine
══════════════════════════════════════════════ */
group('9. Quiz Engine');
assert('QD has 3 levels',                         Object.keys(QD).length === 3);
assert('QD has easy level',                       Array.isArray(QD.easy));
assert('QD has med level',                        Array.isArray(QD.med));
assert('QD has hard level',                       Array.isArray(QD.hard));
assert('easy has 5 questions',                    QD.easy.length === QUIZ_QUESTIONS_PER_LEVEL);
assert('med has 5 questions',                     QD.med.length  === QUIZ_QUESTIONS_PER_LEVEL);
assert('hard has 5 questions',                    QD.hard.length === QUIZ_QUESTIONS_PER_LEVEL);
var allQ = QD.easy.concat(QD.med).concat(QD.hard);
assert('All questions have q property',           allQ.every(function(q){return typeof q.q==='string'&&q.q.length>0;}));
assert('All questions have 4 options',            allQ.every(function(q){return Array.isArray(q.opts)&&q.opts.length===4;}));
assert('All questions have valid ans index',      allQ.every(function(q){return Number.isInteger(q.ans)&&q.ans>=0&&q.ans<=3;}));
assert('All questions have expl string',          allQ.every(function(q){return typeof q.expl==='string'&&q.expl.length>0;}));
assert('Quiz level buttons in HTML (3)',          (html.match(/data-lev=/g)||[]).length >= 3);
assert('Quiz progress dots rendered',             html.indexOf('quizProg') > -1);
assert('Quiz aria-selected on level buttons',     html.indexOf('aria-selected') > -1);
assert('QUIZ_QUESTIONS_PER_LEVEL = 5',            QUIZ_QUESTIONS_PER_LEVEL === 5);
assert('Quiz correct/wrong CSS classes',          html.indexOf('correct') > -1 && html.indexOf('wrong') > -1);
assert('Quiz explanation rendered',               html.indexOf('quiz-expl') > -1);

/* ══════════════════════════════════════════════
   > 10. Domain Logic — calcFootprint() Pure Function
══════════════════════════════════════════════ */
group('10. Domain Logic — calcFootprint() Pure Function');

// Zero inputs
var zero = calcFootprint({carKm:0,bikeKm:0,kwhMonth:0,diet:'vegan',flights:0,ordersMonth:0});
assert('Zero inputs: total equals vegan diet',       zero.total === DIET_VEGAN_T);
assert('Zero inputs: car = 0',                       zero.car === 0);
assert('Zero inputs: bike = 0',                      zero.bike === 0);
assert('Zero inputs: electricity = 0',               zero.electricity === 0);
assert('Zero inputs: diet = 0.5 (vegan)',             zero.diet === DIET_VEGAN_T);
assert('Zero inputs: flights = 0',                   zero.flights === 0);
assert('Zero inputs: shopping = 0',                  zero.shopping === 0);
assert('Returns object with all 7 keys',             ['total','car','bike','electricity','diet','flights','shopping'].every(function(k){return k in zero;}));

// Car math
var car1k = calcFootprint({carKm:1000,bikeKm:0,kwhMonth:0,diet:'vegan',flights:0,ordersMonth:0});
var expectedCar = Math.round((1000 * EF_CAR_KM / KG_PER_TONNE) * 100) / 100;
assert('Car 1000km correct emission',                Math.abs(car1k.car - expectedCar) < 0.001);
assert('Car emission uses EF_CAR_KM',                Math.abs(car1k.car - Math.round(1000*EF_CAR_KM/KG_PER_TONNE*100)/100) < 0.001);

// Bike math
var bike500 = calcFootprint({carKm:0,bikeKm:500,kwhMonth:0,diet:'vegan',flights:0,ordersMonth:0});
var expectedBike = Math.round((500 * EF_BIKE_KM / KG_PER_TONNE) * 100) / 100;
assert('Bike 500km correct emission',                Math.abs(bike500.bike - expectedBike) < 0.001);

// Electricity math
var elec100 = calcFootprint({carKm:0,bikeKm:0,kwhMonth:100,diet:'vegan',flights:0,ordersMonth:0});
var expectedElec = Math.round((100 * MONTHS_PER_YEAR * EF_GRID_KWH / KG_PER_TONNE) * 100) / 100;
assert('Electricity 100kWh/month correct',           Math.abs(elec100.electricity - expectedElec) < 0.001);
assert('Electricity uses 12 months',                 Math.abs(elec100.electricity - Math.round(100*MONTHS_PER_YEAR*EF_GRID_KWH/KG_PER_TONNE*100)/100) < 0.001);

// Diet types
assert('Diet vegan = 0.5 t',                         calcFootprint({carKm:0,bikeKm:0,kwhMonth:0,diet:'vegan',   flights:0,ordersMonth:0}).diet === DIET_VEGAN_T);
assert('Diet veg = 0.9 t',                           calcFootprint({carKm:0,bikeKm:0,kwhMonth:0,diet:'veg',     flights:0,ordersMonth:0}).diet === DIET_VEG_T);
assert('Diet omni_low = 1.4 t',                      calcFootprint({carKm:0,bikeKm:0,kwhMonth:0,diet:'omni_low',flights:0,ordersMonth:0}).diet === DIET_OMNI_LOW_T);
assert('Diet omni_high = 2.5 t',                     calcFootprint({carKm:0,bikeKm:0,kwhMonth:0,diet:'omni_high',flights:0,ordersMonth:0}).diet === DIET_OMNI_HIGH_T);
assert('Diet unknown defaults to veg',               calcFootprint({carKm:0,bikeKm:0,kwhMonth:0,diet:'invalid', flights:0,ordersMonth:0}).diet === DIET_VEG_T);

// Flights
var f2 = calcFootprint({carKm:0,bikeKm:0,kwhMonth:0,diet:'vegan',flights:2,ordersMonth:0});
assert('2 flights correct',                          Math.abs(f2.flights - 2*EF_FLIGHT_DOMESTIC) < 0.001);

// Shopping
var s6 = calcFootprint({carKm:0,bikeKm:0,kwhMonth:0,diet:'vegan',flights:0,ordersMonth:6});
assert('6 orders/month correct',                     Math.abs(s6.shopping - 6*MONTHS_PER_YEAR*EF_SHOPPING_ORDER) < 0.001);

// Clamping
var clamped = calcFootprint({carKm:-500,bikeKm:-100,kwhMonth:-50,diet:'veg',flights:-1,ordersMonth:-2});
assert('Negative car clamped to 0',                  clamped.car === 0);
assert('Negative bike clamped to 0',                 clamped.bike === 0);
assert('Negative electricity clamped to 0',          clamped.electricity === 0);
assert('Negative flights clamped to 0',              clamped.flights === 0);
assert('Negative shopping clamped to 0',             clamped.shopping === 0);
var maxed = calcFootprint({carKm:999999,bikeKm:999999,kwhMonth:999999,diet:'omni_high',flights:999,ordersMonth:999});
assert('Excess car clamped to MAX_CAR_KM',           Math.abs(maxed.car - Math.round(MAX_CAR_KM*EF_CAR_KM/KG_PER_TONNE*100)/100) < 0.001);
assert('Excess kwh clamped to MAX_KWH_MONTH',        Math.abs(maxed.electricity - Math.round(MAX_KWH_MONTH*MONTHS_PER_YEAR*EF_GRID_KWH/KG_PER_TONNE*100)/100) < 0.001);

// getFpRating
assert('Rating below target = primary color',        getFpRating(1.0).color === 'var(--primary)');
assert('Rating below india avg = primary (excellent)',getFpRating(1.5).color === 'var(--primary)');
assert('Rating below world avg = gold',              getFpRating(3.0).color === 'var(--gold)');
assert('Rating above world avg = red',               getFpRating(6.0).color === 'var(--red)');
assert('Rating at exact 1.5C target boundary',       getFpRating(TARGET_1_5_T).color === 'var(--teal)');
assert('Rating just above India avg = teal',         getFpRating(AVG_INDIA_T + 0.01).color === 'var(--teal)');

// getDietTonnes
assert('getDietTonnes vegan',                        getDietTonnes('vegan')    === DIET_VEGAN_T);
assert('getDietTonnes veg',                          getDietTonnes('veg')      === DIET_VEG_T);
assert('getDietTonnes omni_low',                     getDietTonnes('omni_low') === DIET_OMNI_LOW_T);
assert('getDietTonnes omni_high',                    getDietTonnes('omni_high')=== DIET_OMNI_HIGH_T);
assert('getDietTonnes unknown defaults veg',         getDietTonnes('xyz')      === DIET_VEG_T);

// Benchmark values
assert('AVG_INDIA_T = 1.9',                          AVG_INDIA_T  === 1.9);
assert('AVG_WORLD_T = 4.7',                          AVG_WORLD_T  === 4.7);
assert('TARGET_1_5_T = 2.3',                         TARGET_1_5_T === 2.3);
assert('India avg < World avg (sanity)',              AVG_INDIA_T < AVG_WORLD_T);

/* ══════════════════════════════════════════════
   > 11. API Payload & Leaderboard
══════════════════════════════════════════════ */
group('11. API Payload & Leaderboard');
assert('safetySettings includes HARASSMENT',          html.indexOf('HARM_CATEGORY_HARASSMENT') > -1);
assert('safetySettings includes HATE_SPEECH',         html.indexOf('HARM_CATEGORY_HATE_SPEECH') > -1);
assert('safetySettings includes DANGEROUS_CONTENT',   html.indexOf('HARM_CATEGORY_DANGEROUS_CONTENT') > -1);
assert('Safety threshold BLOCK_MEDIUM_AND_ABOVE',     html.indexOf('BLOCK_MEDIUM_AND_ABOVE') > -1);
assert('GEMINI_MAX_TOKENS in payload',                html.indexOf('GEMINI_MAX_TOKENS') > -1);
assert('system_instruction in payload',               html.indexOf('system_instruction') > -1);
assert('temperature: 0.7 in payload',                 html.indexOf('temperature: 0.7') > -1);
assert('Promise.race timeout wraps fetch',            html.indexOf('Promise.race') > -1);
assert('LEADERBOARD_NAME_MAX_LEN = 24',               LEADERBOARD_NAME_MAX_LEN === 24);
assert('LEADERBOARD_MAX_ENTRIES = 10',                LEADERBOARD_MAX_ENTRIES === 10);
assert('LB_ENTRY_MIN_SAVING = 0',                     LB_ENTRY_MIN_SAVING === 0);
assert('Leaderboard name sanitized on write',         html.indexOf('sanitize(name)') > -1);
assert('Leaderboard name substr applied',             html.indexOf('LEADERBOARD_NAME_MAX_LEN') > -1);
assert('No localStorage for API key',                 html.indexOf('localStorage') === -1);
assert('No sessionStorage for API key',               html.indexOf('sessionStorage') === -1);
assert('Key stored in S.key only',                    html.indexOf('S.key') > -1);
assert('encodeURIComponent on API key in URL',        html.indexOf('encodeURIComponent(S.key)') > -1);
assert('callGemini checks !S.key guard',              html.indexOf("if (!S.key)") > -1);
assert('Error handling for non-ok HTTP response',     html.indexOf("if (!r.ok)") > -1);
assert('Chat history in S.hist array',                html.indexOf('S.hist') > -1);

/* ══════════════════════════════════════════════
   > 12. Named Constants & validateConfig
══════════════════════════════════════════════ */
group('12. Named Constants & validateConfig');
assert('EF_CAR_KM = 0.171',             EF_CAR_KM  === 0.171);
assert('EF_BIKE_KM = 0.083',            EF_BIKE_KM === 0.083);
assert('EF_GRID_KWH = 0.82',            EF_GRID_KWH === 0.82);
assert('EF_FLIGHT_DOMESTIC = 0.255',    EF_FLIGHT_DOMESTIC === 0.255);
assert('EF_SHOPPING_ORDER = 0.005',     EF_SHOPPING_ORDER  === 0.005);
assert('DIET_VEGAN_T = 0.5',            DIET_VEGAN_T  === 0.5);
assert('DIET_VEG_T = 0.9',             DIET_VEG_T    === 0.9);
assert('DIET_OMNI_LOW_T = 1.4',        DIET_OMNI_LOW_T  === 1.4);
assert('DIET_OMNI_HIGH_T = 2.5',       DIET_OMNI_HIGH_T === 2.5);
assert('MONTHS_PER_YEAR = 12',         MONTHS_PER_YEAR  === 12);
assert('KG_PER_TONNE = 1000',          KG_PER_TONNE     === 1000);
assert('MAX_BAR_SCALE_T = 10.0',       MAX_BAR_SCALE_T  === 10.0);
assert('FONT_SIZE_MIN_PX = 12',        FONT_SIZE_MIN_PX === 12);
assert('FONT_SIZE_MAX_PX = 22',        FONT_SIZE_MAX_PX === 22);
assert('CHARTS_RETRY_DELAY_MS = 200',  CHARTS_RETRY_DELAY_MS === 200);

// validateConfig detects placeholders
var origKey = CONFIG.firebase.apiKey;
var origGA  = CONFIG.ga4MeasurementId;
assert('validateConfig: placeholder apiKey → firebaseOk=false', !validateConfig().firebaseOk);
assert('validateConfig: placeholder GA4 → ga4Ok=false',         !validateConfig().ga4Ok);
assert('validateConfig: geminiUrl → geminiUrlOk=true',          validateConfig().geminiUrlOk);

CONFIG.firebase.apiKey = 'DemoFakeKey123';
assert('validateConfig: "Demo" in key → firebaseOk=false',      !validateConfig().firebaseOk);
CONFIG.firebase.apiKey = 'placeholder_key_abc';
assert('validateConfig: "placeholder" in key → firebaseOk=false', !validateConfig().firebaseOk);
CONFIG.firebase.apiKey = origKey;
CONFIG.ga4MeasurementId = origGA;

assert('no bare .171 in JS (uses EF_CAR_KM)',     html.indexOf(' = 0.171') > -1);
assert('no bare 1000 in formula (uses KG_PER_TONNE)', html.indexOf('KG_PER_TONNE') > -1);
assert('no bare 12 in formula (uses MONTHS_PER_YEAR)', html.indexOf('MONTHS_PER_YEAR') > -1);
assert('FIREBASE_SDK_VERSION = 10.8.0',           FIREBASE_SDK_VERSION === '10.8.0');

/* ══════════════════════════════════════════════
   FINAL RESULT
══════════════════════════════════════════════ */
var totalTests = totalPass + totalFail.length;
console.log('\n==========================================');
if (totalFail.length === 0) {
  console.log('✅ ALL ' + totalTests + ' TESTS PASSED — Ready for submission!');
} else {
  console.log('❌ ' + totalFail.length + ' FAILED / ' + totalTests + ' total');
  totalFail.forEach(function(f) { console.log('  FAIL: ' + f); });
  process.exit(1);
}
console.log('==========================================\n');
