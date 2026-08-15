/* =========================================================
   CLEOMUN Registration — shared logic
   ========================================================= */

/* ---------- Backend config ----------
   Paste your deployed Google Apps Script Web App URL below.
   Until this is set, the site runs in local-only demo mode —
   forms still work, but nothing is saved anywhere. See README.md
   for the two-minute deployment steps. */
const CONFIG = {
  APPS_SCRIPT_URL: "" // e.g. "https://script.google.com/macros/s/AKfycbw0joientnF4UK4u4XTtw8W37SVudB_mPsESnVfYbZsJQSzGcoZnqlg3fX93HWiaBrU/exec"
};

/* ---------- Data: committees ---------- */
const COMMITTEES = [
  {
    code: "UNHRC",
    name: "UN Human Rights Council",
    desc: "Deliberating the protection of human rights amid rising global displacement and conflict.",
    type: "country",
    level: "Intermediate"
  },
  {
    code: "UNSC",
    name: "UN Security Council",
    desc: "The apex crisis body — fast-moving directives on international peace and security.",
    type: "country",
    level: "Advanced"
  },
  {
    code: "UNGA-DISEC",
    name: "UNGA — DISEC",
    desc: "The First Committee — disarmament, global security and emerging weapons technology.",
    type: "country",
    level: "Intermediate"
  },
  {
    code: "AIPPM",
    name: "All India Political Parties Meet",
    desc: "India's domestic political theatre — represent a real party leader, not a country.",
    type: "mp",
    level: "Beginner–Intermediate"
  },
  {
    code: "UNCSW",
    name: "UN Commission on the Status of Women",
    desc: "Advancing gender equity and women's rights through international policy frameworks.",
    type: "country",
    level: "Beginner"
  },
  {
    code: "IPC",
    name: "International Press Corps",
    desc: "Cover the summit for a major outlet, or stand alone as caricaturist — not a delegate seat.",
    type: "role",
    level: "All levels"
  }
];

/* ---------- Data: countries (standard MUN roster) ---------- */
const COUNTRIES = [
"Afghanistan","Albania","Algeria","Argentina","Armenia","Australia","Austria","Azerbaijan",
"Bahamas","Bahrain","Bangladesh","Belarus","Belgium","Bhutan","Bolivia","Bosnia and Herzegovina",
"Brazil","Brunei","Bulgaria","Burkina Faso","Cambodia","Cameroon","Canada","Chad","Chile","China",
"Colombia","Costa Rica","Croatia","Cuba","Cyprus","Czechia","Denmark","Djibouti","Ecuador","Egypt",
"El Salvador","Estonia","Ethiopia","Fiji","Finland","France","Gabon","Georgia","Germany","Ghana",
"Greece","Guatemala","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq",
"Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kuwait","Kyrgyzstan",
"Laos","Latvia","Lebanon","Libya","Lithuania","Luxembourg","Madagascar","Malaysia","Maldives","Mali",
"Malta","Mexico","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia",
"Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia",
"Norway","Oman","Pakistan","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines",
"Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saudi Arabia","Senegal","Serbia","Singapore",
"Slovakia","Slovenia","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan",
"Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Togo","Tunisia","Turkey",
"Turkmenistan","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay",
"Uzbekistan","Vanuatu","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"
];

/* ---------- Data: AIPPM portfolios (national parties only) ---------- */
const AIPPM_MPS = [
"Narendra Modi — BJP","Amit Shah — BJP","Rajnath Singh — BJP","J.P. Nadda — BJP",
"Nirmala Sitharaman — BJP","S. Jaishankar — BJP","Piyush Goyal — BJP","Nitin Gadkari — BJP",
"Yogi Adityanath — BJP","Devendra Fadnavis — BJP","Bhupendra Patel — BJP","Mohan Yadav — BJP",
"Himanta Biswa Sarma — BJP","Nayab Singh Saini — BJP","Pushkar Singh Dhami — BJP","Vishnu Deo Sai — BJP",
"Mohan Charan Majhi — BJP","Smriti Irani — BJP","B.L. Santhosh — BJP","BJYM National President — BJP",
"Mallikarjun Kharge — INC","Rahul Gandhi — INC","Sonia Gandhi — INC","Priyanka Gandhi Vadra — INC",
"K.C. Venugopal — INC","Jairam Ramesh — INC","Ashok Gehlot — INC","Bhupesh Baghel — INC",
"Siddaramaiah — INC","D.K. Shivakumar — INC","Revanth Reddy — INC","Sukhwinder Singh Sukhu — INC",
"Gaurav Gogoi — INC","P. Chidambaram — INC","Shashi Tharoor — INC","Randeep Surjewala — INC",
"Arvind Kejriwal — AAP","Bhagwant Mann — AAP","Atishi — AAP","Saurabh Bharadwaj — AAP",
"Raghav Chadha — AAP","Sanjay Singh — AAP","Gopal Rai — AAP",
"Mayawati — BSP","Akash Anand — BSP","BSP General Secretary, Uttar Pradesh",
"BSP State President, Punjab","BSP State President, Madhya Pradesh",
"M.A. Baby — CPI(M)","Prakash Karat — CPI(M)","Pinarayi Vijayan — CPI(M)","Md. Salim — CPI(M)",
"B.V. Raghavulu — CPI(M)","Brinda Karat — CPI(M)",
"Conrad Sangma — NPP","Prestone Tynsong — NPP","NPP General Secretary, Arunachal Pradesh",
"NPP State President, Nagaland"
];

const IPC_OUTLETS = [
  "The Hindu","The Indian Express","NDTV","The Times of India","Al Jazeera",
  "The New York Times","Xinhua News Agency","BBC","ABC","Euronews"
];
const IPC_ROLES = [
  ...IPC_OUTLETS.map(o => `${o} (Photography)`),
  ...IPC_OUTLETS.map(o => `${o} (Journalism)`),
  "Caricaturist"
];

/* ---------- storage helpers ---------- */
const STORE_KEY = "cleomunRegistration";

function loadData(){
  try{
    return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
  }catch(e){ return {}; }
}
function saveData(patch){
  const data = Object.assign(loadData(), patch);
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
  return data;
}
function clearData(){
  localStorage.removeItem(STORE_KEY);
}

/* ---------- backend: file upload + registration submit ----------
   All calls are no-ops (resolve instantly, nothing sent) when
   CONFIG.APPS_SCRIPT_URL isn't set, so the demo keeps working
   untouched until the backend is deployed. */
const pendingUploads = {};

function fileToBase64(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

async function uploadFileToBackend(file, label){
  if(!CONFIG.APPS_SCRIPT_URL) return { ok:true, url:null, fileId:null };
  const dataBase64 = await fileToBase64(file);
  const res = await fetch(CONFIG.APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // avoids a CORS preflight against Apps Script
    body: JSON.stringify({
      action: 'uploadFile',
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      dataBase64,
      label
    })
  });
  if(!res.ok) throw new Error('Upload failed with status ' + res.status);
  const json = await res.json();
  if(!json.ok) throw new Error(json.error || 'Upload failed');
  return json;
}

async function submitRegistrationToBackend(payload){
  if(!CONFIG.APPS_SCRIPT_URL) return { ok:true, regId:null };
  const res = await fetch(CONFIG.APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(Object.assign({ action: 'submitRegistration' }, payload))
  });
  if(!res.ok) throw new Error('Submit failed with status ' + res.status);
  const json = await res.json();
  if(!json.ok) throw new Error(json.error || 'Submit failed');
  return json;
}

/* Kicks off a background upload the moment a file is chosen, so by the
   time the person hits "Continue" on that same page it's usually already
   done. The page's submit handler awaits waitForUpload(key) before moving on. */
function beginFileUpload(key, file){
  const promise = uploadFileToBackend(file, key)
    .then(res => {
      saveData({ [key + 'Url']: res.url, [key + 'FileId']: res.fileId });
      return true;
    })
    .catch(err => {
      console.error('Upload failed:', err);
      showToast('That file could not be uploaded — check your connection and try re-attaching it.');
      return false;
    });
  pendingUploads[key] = promise;
  return promise;
}

async function waitForUpload(key){
  if(!pendingUploads[key]) return true;
  return pendingUploads[key];
}

/* Assembles the flat payload the backend expects from whatever track
   (individual / group / school) the person registered through. */
function buildRegistrationPayload(data, track){
  return {
    registrationType: track,
    fullName: data.fullName, email: data.email, phone: data.phone,
    classYear: data.classYear, institution: data.institution,
    priorExperience: data.priorExperience, idFileUrl: data.idFileUrl,
    committee1: data.committee1, c1p1: data.c1p1, c1p2: data.c1p2,
    committee2: data.committee2, c2p1: data.c2p1, c2p2: data.c2p2,
    groupName: data.groupName, groupSize: data.groupSize,
    leaderName: data.leaderName, leaderEmail: data.leaderEmail, leaderPhone: data.leaderPhone,
    schoolName: data.schoolName, schoolAddress: data.schoolAddress,
    teacherName: data.teacherName, teacherEmail: data.teacherEmail, teacherPhone: data.teacherPhone,
    rosterFileUrl: data.rosterFileUrl,
    paymentFileUrl: data.paymentFileUrl
  };
}

/* ---------- particles (rising jewelled dust — gold / lapis / violet) ---------- */
const PARTICLE_HUES = ['207,154,76', '154,59,59', '234,195,124'];
function initParticles(){
  const canvas = document.getElementById('particles');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let w,h,particles;

  function resize(){
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  function makeParticles(){
    const count = window.innerWidth < 700 ? 26 : 48;
    particles = Array.from({length:count}, () => ({
      x: Math.random()*w,
      y: Math.random()*h + h*0.2,
      r: Math.random()*1.6 + 0.5,
      speed: Math.random()*0.34 + 0.06,
      drift: (Math.random()-0.5)*0.25,
      opacity: Math.random()*0.5 + 0.15,
      twinkle: Math.random()*Math.PI*2,
      hue: PARTICLE_HUES[Math.floor(Math.random()*PARTICLE_HUES.length)]
    }));
  }
  resize(); makeParticles();
  window.addEventListener('resize', () => { resize(); makeParticles(); });

  function tick(){
    ctx.clearRect(0,0,w,h);
    for(const p of particles){
      p.y -= p.speed;
      p.x += p.drift;
      p.twinkle += 0.02;
      if(p.y < -10){ p.y = h + 10; p.x = Math.random()*w; }
      const flicker = (Math.sin(p.twinkle)+1)/2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(${p.hue},${(p.opacity*flicker).toFixed(3)})`;
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  tick();
}

/* ---------- cursor glow — soft multi-hued light that follows the pointer ---------- */
function initCursorGlow(){
  if(window.matchMedia && window.matchMedia('(max-width: 900px)').matches) return;
  if(!window.matchMedia || !window.matchMedia('(hover: hover)').matches) return;
  let glow = document.getElementById('cursor-glow');
  if(!glow){
    glow = document.createElement('div');
    glow.id = 'cursor-glow';
    document.body.appendChild(glow);
  }
  let tx = window.innerWidth/2, ty = window.innerHeight/2, cx = tx, cy = ty;
  let active = false;
  window.addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY;
    if(!active){ active = true; glow.style.opacity = '1'; }
  });
  window.addEventListener('pointerleave', () => { glow.style.opacity = '0'; });
  function tick(){
    cx += (tx-cx)*0.09;
    cy += (ty-cy)*0.09;
    glow.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`;
    requestAnimationFrame(tick);
  }
  tick();
}

/* ---------- floating colour orbs — ambient drifting light, every page ---------- */
function initFloatingOrbs(){
  if(document.querySelector('.float-orb')) return;
  const isSmall = window.innerWidth < 700;
  const configs = [
    { top:'10%',  left:'6%',  size:220, hue:'207,154,76', dur:16, dx:'26px',  dy:'-34px' },
    { top:'18%',  left:'88%', size:260, hue:'154,59,59',  dur:19, dx:'-30px', dy:'22px'  },
    { top:'70%',  left:'12%', size:200, hue:'207,154,76', dur:14, dx:'20px',  dy:'26px'  },
    { top:'82%',  left:'80%', size:230, hue:'154,59,59',  dur:21, dx:'-24px', dy:'-18px' },
    { top:'45%',  left:'50%', size:180, hue:'234,195,124',dur:17, dx:'18px',  dy:'-20px' }
  ];
  const list = isSmall ? configs.slice(0,3) : configs;
  list.forEach((c, i) => {
    const orb = document.createElement('div');
    orb.className = 'float-orb';
    orb.style.top = c.top;
    orb.style.left = c.left;
    orb.style.width = c.size + 'px';
    orb.style.height = c.size + 'px';
    orb.style.background = `radial-gradient(circle, rgba(${c.hue},0.5) 0%, rgba(${c.hue},0) 72%)`;
    orb.style.setProperty('--dx', c.dx);
    orb.style.setProperty('--dy', c.dy);
    orb.style.animationDuration = c.dur + 's';
    orb.style.animationDelay = (i * -3.2) + 's';
    document.body.appendChild(orb);
  });
}

/* ---------- magnetic pull on primary buttons ---------- */
function initMagneticButtons(){
  const btns = document.querySelectorAll('.btn-primary, .btn-lg');
  btns.forEach(btn => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width/2;
      const y = e.clientY - r.top - r.height/2;
      btn.style.transform = `translate(${x*0.16}px, ${y*0.32}px)`;
    });
    btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
  });
}

/* ---------- page transition (sphinx crossfade) ---------- */
function navigateTo(url){
  const overlay = document.getElementById('transition-overlay');
  const page = document.querySelector('.page');
  if(!overlay){ window.location.href = url; return; }
  page && page.classList.add('page-exit');
  overlay.classList.add('run');
  setTimeout(() => { window.location.href = url; }, 620);
}

/* ---------- toast ---------- */
function showToast(msg){
  const t = document.getElementById('toast');
  if(!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._tm);
  showToast._tm = setTimeout(() => t.classList.remove('show'), 3600);
}

/* ---------- validation helpers ---------- */
function setInvalid(fieldEl, msg){
  fieldEl.classList.add('invalid');
  const err = fieldEl.querySelector('.field-error');
  if(err && msg) err.textContent = msg;
}
function setValid(fieldEl){
  fieldEl.classList.remove('invalid');
}
function isEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function isPhone(v){ return /^[6-9]\d{9}$/.test(v.replace(/\D/g,'').slice(-10)); }

/* =========================================================
   TYPE SELECT — individual / group / school
   ========================================================= */
function initTypePage(){
  const individualBtn = document.getElementById('type-individual');
  if(!individualBtn) return;

  individualBtn.addEventListener('click', () => {
    saveData({ registrationType: 'individual' });
    navigateTo('register.html');
  });
  document.getElementById('type-group').addEventListener('click', () => {
    saveData({ registrationType: 'group' });
    navigateTo('group-details.html');
  });
  document.getElementById('type-school').addEventListener('click', () => {
    saveData({ registrationType: 'school' });
    navigateTo('school-details.html');
  });
}

/* =========================================================
   SCHOOL DELEGATION — step 1: school & teacher details
   ========================================================= */
function initSchoolDetailsPage(){
  const form = document.getElementById('school-details-form');
  if(!form) return;

  const data = loadData();
  ['schoolName','schoolAddress','teacherName','teacherPhone','teacherEmail'].forEach(id => {
    const el = document.getElementById(id);
    if(el && data[id]) el.value = data[id];
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;

    const schoolNameField = document.getElementById('field-schoolName');
    const schoolNameVal = document.getElementById('schoolName').value.trim();
    if(schoolNameVal.length < 2){ setInvalid(schoolNameField, "Please enter your school's name."); ok = false; }
    else setValid(schoolNameField);

    const addrField = document.getElementById('field-schoolAddress');
    const addrVal = document.getElementById('schoolAddress').value.trim();
    if(addrVal.length < 5){ setInvalid(addrField, "Please enter your school's address."); ok = false; }
    else setValid(addrField);

    const teacherNameField = document.getElementById('field-teacherName');
    const teacherNameVal = document.getElementById('teacherName').value.trim();
    if(teacherNameVal.length < 2){ setInvalid(teacherNameField, "Please enter the teacher in-charge's name."); ok = false; }
    else setValid(teacherNameField);

    const teacherPhoneField = document.getElementById('field-teacherPhone');
    const teacherPhoneVal = document.getElementById('teacherPhone').value.trim();
    if(!isPhone(teacherPhoneVal)){ setInvalid(teacherPhoneField, 'Enter a valid 10-digit mobile number.'); ok = false; }
    else setValid(teacherPhoneField);

    const teacherEmailField = document.getElementById('field-teacherEmail');
    const teacherEmailVal = document.getElementById('teacherEmail').value.trim();
    if(!isEmail(teacherEmailVal)){ setInvalid(teacherEmailField, 'Enter a valid email address.'); ok = false; }
    else setValid(teacherEmailField);

    if(!ok){
      showToast('Please fix the highlighted fields before continuing.');
      const firstInvalid = form.querySelector('.invalid');
      if(firstInvalid) firstInvalid.scrollIntoView({behavior:'smooth', block:'center'});
      return;
    }

    saveData({
      registrationType: 'school',
      schoolName: schoolNameVal,
      schoolAddress: addrVal,
      teacherName: teacherNameVal,
      teacherPhone: teacherPhoneVal,
      teacherEmail: teacherEmailVal
    });

    navigateTo('school-roster.html');
  });
}

/* =========================================================
   GROUP DELEGATION — step 1: group & leader details
   ========================================================= */
function initGroupDetailsPage(){
  const form = document.getElementById('group-details-form');
  if(!form) return;

  const data = loadData();
  ['groupName','groupSize','leaderName','leaderPhone','leaderEmail'].forEach(id => {
    const el = document.getElementById(id);
    if(el && data[id]) el.value = data[id];
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;

    const groupNameField = document.getElementById('field-groupName');
    const groupNameVal = document.getElementById('groupName').value.trim();
    if(groupNameVal.length < 2){ setInvalid(groupNameField, 'Please enter a name for your group.'); ok = false; }
    else setValid(groupNameField);

    const groupSizeField = document.getElementById('field-groupSize');
    const groupSizeRaw = document.getElementById('groupSize').value.trim();
    const groupSizeNum = parseInt(groupSizeRaw, 10);
    if(!groupSizeRaw || isNaN(groupSizeNum) || groupSizeNum < 1){ setInvalid(groupSizeField, 'Please enter the number of delegates.'); ok = false; }
    else setValid(groupSizeField);

    const leaderNameField = document.getElementById('field-leaderName');
    const leaderNameVal = document.getElementById('leaderName').value.trim();
    if(leaderNameVal.length < 2){ setInvalid(leaderNameField, "Please enter the group leader's name."); ok = false; }
    else setValid(leaderNameField);

    const leaderPhoneField = document.getElementById('field-leaderPhone');
    const leaderPhoneVal = document.getElementById('leaderPhone').value.trim();
    if(!isPhone(leaderPhoneVal)){ setInvalid(leaderPhoneField, 'Enter a valid 10-digit mobile number.'); ok = false; }
    else setValid(leaderPhoneField);

    const leaderEmailField = document.getElementById('field-leaderEmail');
    const leaderEmailVal = document.getElementById('leaderEmail').value.trim();
    if(!isEmail(leaderEmailVal)){ setInvalid(leaderEmailField, 'Enter a valid email address.'); ok = false; }
    else setValid(leaderEmailField);

    if(!ok){
      showToast('Please fix the highlighted fields before continuing.');
      const firstInvalid = form.querySelector('.invalid');
      if(firstInvalid) firstInvalid.scrollIntoView({behavior:'smooth', block:'center'});
      return;
    }

    saveData({
      registrationType: 'group',
      groupName: groupNameVal,
      groupSize: groupSizeNum,
      leaderName: leaderNameVal,
      leaderPhone: leaderPhoneVal,
      leaderEmail: leaderEmailVal
    });

    navigateTo('group-roster.html');
  });
}

/* =========================================================
   GROUP / SCHOOL — step 2: roster spreadsheet upload
   ========================================================= */
function initRosterPage(){
  const form = document.getElementById('roster-form');
  if(!form) return;
  const track = form.dataset.track; // 'school' | 'group'

  const data = loadData();
  if(data.rosterFileName){
    showFileChip('roster-dropzone', data.rosterFileName);
  }

  setupDropzone('roster-dropzone', 'roster-file', (file) => {
    saveData({ rosterFileName: file.name, rosterFileSize: file.size });
    beginFileUpload('rosterFile', file);
  }, () => saveData({ rosterFileName: null, rosterFileSize: null, rosterFileUrl: null }), 10);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const field = document.getElementById('field-roster');
    const saved = loadData().rosterFileName;
    if(!saved){
      setInvalid(field, `Please upload the ${track === 'school' ? 'student' : 'delegate'} roster spreadsheet.`);
      showToast('Upload the roster spreadsheet to continue.');
      field.scrollIntoView({behavior:'smooth', block:'center'});
      return;
    }
    setValid(field);

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalLabel = submitBtn.innerHTML;
    submitBtn.disabled = true; submitBtn.innerHTML = 'Uploading…';
    const uploadOk = await waitForUpload('rosterFile');
    submitBtn.disabled = false; submitBtn.innerHTML = originalLabel;
    if(!uploadOk){
      setInvalid(field, 'Upload failed — please re-attach the spreadsheet and try again.');
      return;
    }

    navigateTo('payment.html');
  });
}

/* =========================================================
   STEP 1 — Details + ID upload
   ========================================================= */
function initDetailsPage(){
  const form = document.getElementById('details-form');
  if(!form) return;

  // restore
  const data = loadData();
  ['fullName','email','phone','classYear','institution'].forEach(id=>{
    const el = document.getElementById(id);
    if(el && data[id]) el.value = data[id];
  });
  const expInput = document.getElementById('priorExperience');
  if(expInput){
    if(data.priorExperience !== undefined && data.priorExperience !== null && data.priorExperience !== ''){
      expInput.value = data.priorExperience;
    }
    const minusBtn = document.getElementById('exp-minus');
    const plusBtn = document.getElementById('exp-plus');
    const clamp = () => {
      let v = parseInt(expInput.value, 10);
      if(isNaN(v) || v < 0) v = 0;
      expInput.value = v;
      return v;
    };
    minusBtn && minusBtn.addEventListener('click', () => { expInput.value = Math.max(0, clamp() - 1); });
    plusBtn && plusBtn.addEventListener('click', () => { expInput.value = clamp() + 1; });
    expInput.addEventListener('blur', clamp);
    expInput.addEventListener('input', () => {
      if(expInput.value !== '' && parseInt(expInput.value,10) < 0) expInput.value = 0;
    });
  }
  if(data.idFileName){
    showFileChip('id-dropzone', data.idFileName);
  }

  setupDropzone('id-dropzone', 'id-file', (file) => {
    saveData({ idFileName: file.name });
    beginFileUpload('idFile', file);
  }, () => saveData({ idFileName: null, idFileUrl: null }));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let ok = true;

    const nameField = document.getElementById('field-fullName');
    const nameVal = document.getElementById('fullName').value.trim();
    if(nameVal.length < 2){ setInvalid(nameField, 'Please enter your full name.'); ok = false; }
    else setValid(nameField);

    const emailField = document.getElementById('field-email');
    const emailVal = document.getElementById('email').value.trim();
    if(!isEmail(emailVal)){ setInvalid(emailField, 'Enter a valid email address.'); ok = false; }
    else setValid(emailField);

    const phoneField = document.getElementById('field-phone');
    const phoneVal = document.getElementById('phone').value.trim();
    if(!isPhone(phoneVal)){ setInvalid(phoneField, 'Enter a valid 10-digit mobile number.'); ok = false; }
    else setValid(phoneField);

    const classField = document.getElementById('field-classYear');
    const classVal = document.getElementById('classYear').value.trim();
    if(classVal.length < 1){ setInvalid(classField, 'This field is required.'); ok = false; }
    else setValid(classField);

    const instField = document.getElementById('field-institution');
    const instVal = document.getElementById('institution').value.trim();
    if(instVal.length < 2){ setInvalid(instField, 'Please enter your school or college name.'); ok = false; }
    else setValid(instField);

    const expField = document.getElementById('field-priorExperience');
    const expValRaw = document.getElementById('priorExperience').value;
    const expValNum = parseInt(expValRaw, 10);
    if(expValRaw === '' || isNaN(expValNum) || expValNum < 0){
      setInvalid(expField, "Enter the number of conferences you've attended (0 or more).");
      ok = false;
    } else setValid(expField);

    const idField = document.getElementById('field-id');
    const savedIdName = loadData().idFileName;
    if(!savedIdName){ setInvalid(idField, 'Please upload your school/college ID.'); ok = false; }
    else setValid(idField);

    if(!ok){
      showToast('Please fix the highlighted fields before continuing.');
      const firstInvalid = form.querySelector('.invalid');
      if(firstInvalid) firstInvalid.scrollIntoView({behavior:'smooth', block:'center'});
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalLabel = submitBtn.innerHTML;
    submitBtn.disabled = true; submitBtn.innerHTML = 'Uploading…';
    const uploadOk = await waitForUpload('idFile');
    submitBtn.disabled = false; submitBtn.innerHTML = originalLabel;
    if(!uploadOk){
      setInvalid(idField, 'Upload failed — please re-attach your ID and try again.');
      return;
    }

    saveData({
      fullName: nameVal,
      email: emailVal,
      phone: phoneVal,
      classYear: classVal,
      institution: instVal,
      priorExperience: expValNum,
      registrationType: 'individual'
    });

    navigateTo('committee.html');
  });
}

/* =========================================================
   STEP 2 — Committee preference 1 & 2
   ========================================================= */
function initCommitteePage(){
  const grid = document.getElementById('committee-grid');
  if(!grid) return;

  const data = loadData();
  let pref1 = data.committee1 || null;
  let pref2 = data.committee2 || null;

  COMMITTEES.forEach(c => {
    const card = document.createElement('div');
    card.className = 'committee-card';
    card.dataset.code = c.code;
    card.innerHTML = `
      <div class="cc-top">
        <span class="cc-code">${c.code}</span>
        <span class="cc-badge"></span>
      </div>
      <div class="cc-name">${c.name}</div>
      <div class="cc-desc">${c.desc}</div>
      <div class="cc-meta">${c.level} &middot; ${c.type === 'mp' ? 'Party portfolios' : c.type === 'role' ? 'Press roles' : 'Country seats'}</div>
    `;
    card.addEventListener('click', () => {
      if(card.classList.contains('pref1')){
        card.classList.remove('pref1'); pref1 = null;
      } else if(card.classList.contains('pref2')){
        card.classList.remove('pref2'); pref2 = null;
      } else if(!pref1){
        pref1 = c.code; card.classList.add('pref1');
      } else if(!pref2 && pref1 !== c.code){
        pref2 = c.code; card.classList.add('pref2');
      } else if(pref1 === c.code){
        // already handled above
      } else {
        showToast('You can only select two committees. Tap a gold or blue card to change your pick.');
        return;
      }
      render();
    });
    grid.appendChild(card);
  });

  function render(){
    grid.querySelectorAll('.committee-card').forEach(card => {
      const code = card.dataset.code;
      card.classList.toggle('pref1', code === pref1);
      card.classList.toggle('pref2', code === pref2);
      const badge = card.querySelector('.cc-badge');
      badge.textContent = code === pref1 ? '1st Preference' : code === pref2 ? '2nd Preference' : '';
    });
    document.getElementById('summary-pref1').textContent = pref1 ? COMMITTEES.find(c=>c.code===pref1).name : '—';
    document.getElementById('summary-pref2').textContent = pref2 ? COMMITTEES.find(c=>c.code===pref2).name : '—';
    document.getElementById('continue-btn').disabled = !(pref1 && pref2);
  }
  render();

  document.getElementById('committee-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if(!pref1 || !pref2){
      showToast('Please choose both a first and second committee preference.');
      return;
    }
    saveData({ committee1: pref1, committee2: pref2 });
    navigateTo('portfolio.html');
  });
}

/* =========================================================
   STEP 3 — Country / role preference (per committee)
   ========================================================= */
function optionsFor(committeeCode){
  const c = COMMITTEES.find(x => x.code === committeeCode);
  if(!c) return [];
  if(c.type === 'mp') return AIPPM_MPS;
  if(c.type === 'role') return IPC_ROLES;
  return COUNTRIES;
}

function buildSelect(id, list, selected){
  const sel = document.createElement('select');
  sel.id = id;
  sel.innerHTML = `<option value="">Choose…</option>` + list.map(v =>
    `<option value="${v}" ${v === selected ? 'selected' : ''}>${v}</option>`
  ).join('');
  return sel;
}

function initPortfolioPage(){
  const host = document.getElementById('portfolio-host');
  if(!host) return;

  const data = loadData();
  if(!data.committee1 || !data.committee2){
    window.location.href = 'committee.html';
    return;
  }

  const swatch = { 1: 'g', 2: 'l' };
  [1,2].forEach(n => {
    const code = data['committee' + n];
    const committee = COMMITTEES.find(c => c.code === code);
    const list = optionsFor(code);
    const roleLabel = committee.type === 'mp' ? 'MP / Party Portfolio' : committee.type === 'role' ? 'Press Portfolio' : 'Country';

    const block = document.createElement('div');
    block.className = 'portfolio-block';
    block.innerHTML = `
      <div class="portfolio-block-head">
        <span class="swatch dot ${swatch[n]}"></span>
        <h3>${n === 1 ? '1st' : '2nd'} Preference Committee — ${committee.name}</h3>
      </div>
      <div class="field-row">
        <div class="field" id="field-c${n}p1">
          <label>${roleLabel} Preference 1 <span class="req">*</span></label>
          <div class="select-slot" data-slot="c${n}p1"></div>
          <div class="field-error">Please select an option.</div>
        </div>
        <div class="field" id="field-c${n}p2">
          <label>${roleLabel} Preference 2 <span class="req">*</span></label>
          <div class="select-slot" data-slot="c${n}p2"></div>
          <div class="field-error">Choose a different option from Preference 1.</div>
        </div>
      </div>
    `;
    host.appendChild(block);

    const sel1 = buildSelect(`c${n}p1`, list, data[`c${n}p1`]);
    const sel2 = buildSelect(`c${n}p2`, list, data[`c${n}p2`]);
    block.querySelector(`[data-slot="c${n}p1"]`).appendChild(sel1);
    block.querySelector(`[data-slot="c${n}p2"]`).appendChild(sel2);
  });

  document.getElementById('portfolio-form').addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    const values = {};

    [1,2].forEach(n => {
      const f1 = document.getElementById(`field-c${n}p1`);
      const f2 = document.getElementById(`field-c${n}p2`);
      const v1 = document.getElementById(`c${n}p1`).value;
      const v2 = document.getElementById(`c${n}p2`).value;

      if(!v1){ setInvalid(f1); ok = false; } else setValid(f1);

      if(!v2 || v2 === v1){
        setInvalid(f2, v2 === v1 && v2 ? 'Preference 2 must differ from Preference 1.' : 'Please select an option.');
        ok = false;
      } else setValid(f2);

      values[`c${n}p1`] = v1;
      values[`c${n}p2`] = v2;
    });

    if(!ok){
      showToast('Please complete and double-check your preferences.');
      const firstInvalid = document.querySelector('.invalid');
      if(firstInvalid) firstInvalid.scrollIntoView({behavior:'smooth', block:'center'});
      return;
    }

    saveData(values);
    navigateTo('payment.html');
  });
}

/* =========================================================
   STEP 4 — Payment + screenshot upload
   ========================================================= */
function genRegId(){
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for(let i=0;i<5;i++) s += chars[Math.floor(Math.random()*chars.length)];
  return `CLEO-${new Date().getFullYear()}-${s}`;
}

function initPaymentPage(){
  const form = document.getElementById('payment-form');
  if(!form) return;

  const data = loadData();
  const track = data.registrationType || 'individual';

  const rows = document.getElementById('summary-rows');
  const feeLabel = document.getElementById('fee-label');
  const feeAmount = document.getElementById('fee-amount');
  const qrNote = document.getElementById('qr-note');
  const uploadLabelReq = document.getElementById('payment-upload-label').innerHTML.match(/<span.*<\/span>/)[0];
  const backLink = document.getElementById('payment-back');
  const subCopy = document.getElementById('payment-sub');
  const headerStep = document.getElementById('header-step');
  const stepperEl = document.getElementById('payment-stepper');

  function row(k, v){
    const d = document.createElement('div');
    d.className = 'summary-row';
    d.innerHTML = `<span class="k">${k}</span><span class="v">${v || '—'}</span>`;
    rows.appendChild(d);
  }

  if(track === 'individual'){
    if(!data.fullName || !data.committee1){ window.location.href = 'register.html'; return; }
    row('Delegate', data.fullName);
    row('Institution', data.institution);
    row('Email', data.email);
    row('1st Committee', COMMITTEES.find(c=>c.code===data.committee1)?.name);
    row('2nd Committee', COMMITTEES.find(c=>c.code===data.committee2)?.name);
    feeLabel.textContent = 'Delegate Fee';
    feeAmount.textContent = '\u20b92000';
    qrNote.innerHTML = 'Scan with any UPI app to pay &#8377;2000, or use the UPI ID above. Replace this QR with your live payment gateway before launch.';
    document.getElementById('payment-upload-label').innerHTML = `Upload Payment Screenshot ${uploadLabelReq}`;
    backLink.setAttribute('href', 'portfolio.html');
    subCopy.textContent = "Review your registration, complete payment, and upload your confirmation to secure your seat.";
  }
  else if(track === 'group'){
    if(!data.groupName || !data.rosterFileName){ window.location.href = 'group-details.html'; return; }
    row('Group / Institution', data.groupName);
    row('Group Leader', data.leaderName);
    row('Leader Email', data.leaderEmail);
    row('Leader Contact', data.leaderPhone);
    row('Delegates in Group', data.groupSize);
    row('Roster File', data.rosterFileName);
    feeLabel.textContent = 'Total Fee (Collective)';
    feeAmount.textContent = data.groupSize ? `\u20b9${(2000 * Number(data.groupSize)).toLocaleString('en-IN')}` : '\u20b92000 / delegate';
    qrNote.innerHTML = 'Scan with any UPI app to pay the collective fee, or use the UPI ID above. Replace this QR with your live payment gateway before launch.';
    document.getElementById('payment-upload-label').innerHTML = `Upload Collective Payment Screenshot ${uploadLabelReq}`;
    backLink.setAttribute('href', 'group-roster.html');
    subCopy.textContent = "Review the group's registration, complete the collective payment, and upload confirmation to secure every seat.";
  }
  else if(track === 'school'){
    if(!data.schoolName || !data.rosterFileName){ window.location.href = 'school-details.html'; return; }
    row('School', data.schoolName);
    row('Teacher In-Charge', data.teacherName);
    row('Teacher Email', data.teacherEmail);
    row('Teacher Contact', data.teacherPhone);
    row('Roster File', data.rosterFileName);
    feeLabel.textContent = 'Delegate Fee';
    feeAmount.textContent = '\u20b92000 / student';
    qrNote.innerHTML = 'Scan with any UPI app to pay the collective fee, or use the UPI ID above. Replace this QR with your live payment gateway before launch.';
    document.getElementById('payment-upload-label').innerHTML = `Upload Collective Payment Screenshot ${uploadLabelReq}`;
    backLink.setAttribute('href', 'school-roster.html');
    subCopy.textContent = "Review the school's registration, complete the collective payment, and upload confirmation to secure the delegation.";
  }

  if(track !== 'individual'){
    headerStep.innerHTML = 'Step <strong>3</strong> of 3';
    stepperEl.innerHTML = `
      <div class="step is-done"><div class="step-oval">1</div><div class="step-label">${track === 'school' ? 'School Details' : 'Group Details'}</div></div>
      <div class="step is-done"><div class="step-line"></div><div class="step-oval">2</div><div class="step-label">Roster</div></div>
      <div class="step is-active"><div class="step-line"></div><div class="step-oval">3</div><div class="step-label">Payment</div></div>
    `;
  }

  if(data.paymentFileName){
    showFileChip('payment-dropzone', data.paymentFileName);
  }
  setupDropzone('payment-dropzone', 'payment-file', (file) => {
    saveData({ paymentFileName: file.name });
    beginFileUpload('paymentFile', file);
  }, () => saveData({ paymentFileName: null, paymentFileUrl: null }));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const field = document.getElementById('field-payment');
    const saved = loadData().paymentFileName;
    if(!saved){
      setInvalid(field, 'Please upload your payment confirmation screenshot.');
      showToast('Upload a screenshot of your payment to complete registration.');
      field.scrollIntoView({behavior:'smooth', block:'center'});
      return;
    }
    setValid(field);

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalLabel = submitBtn.innerHTML;
    submitBtn.disabled = true; submitBtn.innerHTML = 'Uploading…';

    const uploadOk = await waitForUpload('paymentFile');
    if(!uploadOk){
      submitBtn.disabled = false; submitBtn.innerHTML = originalLabel;
      setInvalid(field, 'Upload failed — please re-attach your screenshot and try again.');
      return;
    }

    submitBtn.innerHTML = 'Submitting…';
    let regId = genRegId(); // used as-is in local demo mode; overwritten by the server's ID once a backend is connected

    if(CONFIG.APPS_SCRIPT_URL){
      try{
        const payload = buildRegistrationPayload(loadData(), track);
        const result = await submitRegistrationToBackend(payload);
        if(result && result.regId) regId = result.regId;
      }catch(err){
        console.error(err);
        submitBtn.disabled = false; submitBtn.innerHTML = originalLabel;
        showToast('Could not submit your registration — check your connection and try again.');
        return;
      }
    }

    saveData({ regId, submittedAt: new Date().toISOString() });

    form.style.display = 'none';
    document.getElementById('payment-summary-panel').style.display = 'none';
    const banner = document.getElementById('reg-id-banner');
    banner.classList.add('show');
    document.getElementById('reg-id-value').textContent = regId;
    const confirmEmail = track === 'school' ? data.teacherEmail : track === 'group' ? data.leaderEmail : data.email;
    document.getElementById('reg-id-email').textContent = confirmEmail;
    burstConfetti();
  });
}

function burstConfetti(){
  const canvas = document.getElementById('particles');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const bits = Array.from({length:110}, () => ({
    x: w/2, y: h*0.35,
    vx: (Math.random()-0.5)*10,
    vy: (Math.random()-1.4)*10,
    r: Math.random()*3+1.5,
    life: 1,
    hue: PARTICLE_HUES[Math.floor(Math.random()*PARTICLE_HUES.length)]
  }));
  function frame(){
    bits.forEach(b => {
      b.x += b.vx; b.y += b.vy; b.vy += 0.18; b.life -= 0.011;
      ctx.beginPath();
      ctx.arc(b.x,b.y,b.r,0,Math.PI*2);
      ctx.fillStyle = `rgba(${b.hue},${Math.max(b.life,0)})`;
      ctx.fill();
    });
    if(bits.some(b => b.life > 0)) requestAnimationFrame(frame);
  }
  frame();
}

/* =========================================================
   File dropzone (shared)
   ========================================================= */
function setupDropzone(zoneId, inputId, onFile, onRemove, maxSizeMB){
  const zone = document.getElementById(zoneId);
  if(!zone) return;
  const input = document.getElementById(inputId);

  ['dragenter','dragover'].forEach(evt => zone.addEventListener(evt, (e) => {
    e.preventDefault(); zone.classList.add('drag');
  }));
  ['dragleave','drop'].forEach(evt => zone.addEventListener(evt, (e) => {
    e.preventDefault(); zone.classList.remove('drag');
  }));
  zone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if(file){ input.files = e.dataTransfer.files; handleFile(file); }
  });
  input.addEventListener('change', () => {
    if(input.files[0]) handleFile(input.files[0]);
  });

  function handleFile(file){
    if(maxSizeMB && file.size > maxSizeMB * 1024 * 1024){
      showToast(`That file is over ${maxSizeMB}MB. Please upload a smaller file.`);
      input.value = '';
      return;
    }
    showFileChip(zoneId, file.name);
    onFile(file);
    const parentField = zone.closest('.field');
    if(parentField) setValid(parentField);
  }

  const removeBtn = zone.querySelector('.dz-remove');
  if(removeBtn){
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation(); e.preventDefault();
      input.value = '';
      zone.querySelector('.dz-file').classList.remove('show');
      onRemove && onRemove();
    });
  }
}
function showFileChip(zoneId, name){
  const zone = document.getElementById(zoneId);
  if(!zone) return;
  const chip = zone.querySelector('.dz-file');
  chip.classList.add('show');
  chip.querySelector('.dz-filename').textContent = name;
}

/* =========================================================
   LANDING PAGE — committee preview, reveal, stats
   ========================================================= */
function initLandingCommittees(){
  const grid = document.getElementById('landing-committee-grid');
  if(!grid) return;
  COMMITTEES.forEach(c => {
    const card = document.createElement('div');
    card.className = 'committee-card';
    card.innerHTML = `
      <div class="cc-top">
        <span class="cc-code">${c.code}</span>
        <span class="preview-tag">${c.type === 'mp' ? 'Party portfolios' : c.type === 'role' ? 'Press roles' : 'Country seats'}</span>
      </div>
      <div class="cc-name">${c.name}</div>
      <div class="cc-desc">${c.desc}</div>
      <div class="cc-meta">${c.level}</div>
    `;
    grid.appendChild(card);
  });
}

function initScrollReveal(){
  const items = document.querySelectorAll('.reveal');
  if(!items.length) return;
  if(!('IntersectionObserver' in window)){
    items.forEach(el => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  items.forEach(el => io.observe(el));
}

function initStatCounters(){
  const nums = document.querySelectorAll('.stat-num[data-count]');
  if(!nums.length) return;
  const animate = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const dur = 900;
    const start = performance.now();
    function tick(now){
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target);
      if(p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  };
  if(!('IntersectionObserver' in window)){
    nums.forEach(el => { el.textContent = el.dataset.count; });
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        animate(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  nums.forEach(el => io.observe(el));
}

/* ---------- init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initCursorGlow();
  initFloatingOrbs();
  initTypePage();
  initDetailsPage();
  initCommitteePage();
  initPortfolioPage();
  initSchoolDetailsPage();
  initGroupDetailsPage();
  initRosterPage();
  initPaymentPage();
  initLandingCommittees();
  initScrollReveal();
  initStatCounters();
  initMagneticButtons();

  document.querySelectorAll('a[data-nav]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(a.getAttribute('href'));
    });
  });
});
