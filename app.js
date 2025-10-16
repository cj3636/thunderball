/* Thunderball Promo App */
(function() {
  const DEFAULT_SPECIAL_NUMBERS = [1,25,50,75,100];
  const STORAGE_KEY = 'thunderballStateV1';
  const DEFAULT_CSV_PATH = 'Thunderball.csv';
  const BOARD_SIZE = 10; // 10x10

  /** State shape
   * {
   *  day: number,
   *  specialIncrement: number,
   *  prizes: [{number, basePrize, isSpecial, isClaimed, claimDay|null}],
   *  lastUpdated: timestamp
   * }
   */
  let state = null;

  // Elements
  const boardEl = document.getElementById('bingoBoard');
  const dayIndicatorEl = document.getElementById('dayIndicator');
  const inputDay = document.getElementById('inputDay');
  const inputIncrement = document.getElementById('inputIncrement');
  const claimedGridEl = document.getElementById('claimedGrid');
  const panelEl = document.getElementById('managementPanel');
  const btnAdvanceDay = document.getElementById('btnAdvanceDay');
  const btnResetDay = document.getElementById('btnResetDay');
  const btnToggleSidebar = document.getElementById('btnToggleHeader');
  const btnToggleTheme = document.getElementById('btnToggleTheme');
  const btnDownloadState = document.getElementById('btnDownloadState');
  const btnRestoreDefault = document.getElementById('btnRestoreDefault');
  const btnClearStorage = document.getElementById('btnClearStorage');
  const fileUpload = document.getElementById('fileUpload');
  const statsContainer = document.getElementById('statsContainer');
  // Sidebar ticker elements
  const leftTickerTrack = document.getElementById('leftTickerTrack');
  const rightTickerTrack = document.getElementById('rightTickerTrack');
  const thunderStrikeEl = document.getElementById('thunderStrike');
  const strikeValueEl = document.getElementById('strikeValue');
  let lastClaimedPrize = null; // store last claimed prize object for optional trigger

  function log(...args){ console.log('[Thunderball]', ...args); }

  function defaultPrizeObject(number, basePrize){
    const cleanValue = parseCurrency(basePrize);
    const isSpecial = DEFAULT_SPECIAL_NUMBERS.includes(number);
    return { number, basePrize: cleanValue, isSpecial, isClaimed: false, claimDay: null };
  }

  function parseCurrency(value){
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const num = parseFloat(String(value).replace(/[^0-9.\-]/g,''));
    return isNaN(num) ? 0 : num;
  }

  function loadState(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed.prizes || !Array.isArray(parsed.prizes)) return null;
      return parsed;
    } catch(e){
      console.warn('Failed to load state', e);
      return null;
    }
  }

  function saveState(){
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({...state, lastUpdated: Date.now()}));
    } catch(e){ console.warn('Failed to save state', e); }
  }

  function fetchDefaultCSV(){
    return fetch(DEFAULT_CSV_PATH).then(r => r.text());
  }

  function detectCSVFormat(text){
    // Basic: expect either rows with prize values in some visual layout; fallback assume simple number,value lines
    // We'll parse by splitting lines, scanning for numbers 1-100.
    const lines = text.split(/\r?\n/).filter(l=>l.trim().length);
    const map = new Map();
    for(const line of lines){
      // try patterns: "1,$50" or "1 - $50" or "$50" if lines are ordered
      const parts = line.split(/,|;|\t|\|/).map(p=>p.trim());
      if (parts.length >= 2 && /^\d{1,3}$/.test(parts[0])){
        const num = parseInt(parts[0],10);
        if (num>=1 && num<=100){
          map.set(num, parseCurrency(parts[1]));
          continue;
        }
      }
      // fallback search for number and currency in line
      const numMatch = line.match(/\b(\d{1,3})\b/);
      const valMatch = line.match(/\$?\s*([0-9]+(?:\.[0-9]{1,2})?)/);
      if (numMatch){
        const num = parseInt(numMatch[1],10);
        if (num>=1 && num<=100 && valMatch){
          map.set(num, parseCurrency(valMatch[1]));
        }
      }
    }
    // Fill missing with 0
    const result = [];
    for(let i=1;i<=100;i++){
      result.push(defaultPrizeObject(i, map.has(i)? map.get(i):0));
    }
    return result;
  }

  function computeDisplayPrize(prize){
    if (!prize.isSpecial) return prize.basePrize;
    // Accrue only while unclaimed.
    const daysActive = prize.isClaimed && prize.claimDay != null ? (prize.claimDay - 1) : (state.day - 1); // day1 = 0 add
    return prize.basePrize + (state.specialIncrement * daysActive);
  }

  function valueTier(value, isSpecial){
    if (isSpecial) return null; // specials visually distinct already
    if (value < 25) return 'value-tier-1';
    if (value < 30) return 'value-tier-2';
    if (value < 40) return 'value-tier-3';
    if (value < 60) return 'value-tier-4';
    if (value < 100) return 'value-tier-5';
    if (value < 150) return 'value-tier-6';
    if (value < 250) return 'value-tier-7';
    return 'value-tier-8';
  }

  function formatCurrency(num){
    return '$' + num.toLocaleString(undefined,{minimumFractionDigits:0, maximumFractionDigits:0});
  }

  function buildBoard(){
    boardEl.innerHTML = '';
    state.prizes.sort((a,b)=>a.number-b.number);
    for(const prize of state.prizes){
      const cell = document.createElement('div');
      const value = computeDisplayPrize(prize);
      const tier = valueTier(value, prize.isSpecial);
      cell.className = 'cell' + (prize.isSpecial? ' special':'') + (prize.isClaimed? ' claimed':'') + (tier? ' '+tier:'');
      cell.dataset.number = prize.number;
      const prizeDiv = document.createElement('div');
      prizeDiv.className = 'prize';
      prizeDiv.textContent = formatCurrency(computeDisplayPrize(prize));
      const numDiv = document.createElement('div');
      numDiv.className = 'number';
      numDiv.textContent = '#' + prize.number;
      const overlay = document.createElement('div');
      overlay.className = 'claim-overlay';
  // Removed inline '✕' to avoid small extra X; visual cross drawn via CSS pseudo-elements
  overlay.textContent = '';

      cell.appendChild(prizeDiv); cell.appendChild(numDiv); cell.appendChild(overlay);

      cell.addEventListener('click', ()=>{
        toggleClaim(prize.number);
      });

      boardEl.appendChild(cell);
    }
  }

  function updateBoardValues(){
    document.querySelectorAll('.cell').forEach(cell=>{
      const num = parseInt(cell.dataset.number,10);
      const prize = state.prizes.find(p=>p.number===num);
      const prizeDiv = cell.querySelector('.prize');
      prizeDiv.textContent = formatCurrency(computeDisplayPrize(prize));
      cell.classList.toggle('claimed', !!prize.isClaimed);
      // Remove old tier classes
      cell.className = cell.className.split(' ').filter(c=>!c.startsWith('value-tier-')).join(' ');
      const tier = valueTier(computeDisplayPrize(prize), prize.isSpecial);
      if (tier) cell.classList.add(tier);
    });
  }

  function toggleClaim(number){
    const prize = state.prizes.find(p=>p.number===number);
    if (!prize) return;
    const wasClaimed = prize.isClaimed;
    prize.isClaimed = !prize.isClaimed;
    prize.claimDay = prize.isClaimed ? state.day : null;
    saveState();
    updateBoardValues();
    updateClaimedGridCheckbox(number, prize.isClaimed);
    updateStats();
    refreshTickerDays();
    // Trigger thunder strike only when transitioning to claimed (not when unclaiming)
    if (!wasClaimed && prize.isClaimed){
      lastClaimedPrize = prize;
      playThunderStrike(prize);
    }
  }

  function buildClaimedGrid(){
    claimedGridEl.innerHTML = '';
    for(let i=1;i<=100;i++){
      const label = document.createElement('label');
      label.title = 'Prize #' + i;
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = String(i);
      input.checked = !!state.prizes.find(p=>p.number===i).isClaimed;
      const span = document.createElement('span');
      span.textContent = i;
      label.appendChild(input); label.appendChild(span);
      if (input.checked) label.classList.add('checked');
      input.addEventListener('change', ()=>{
        toggleClaim(i);
      });
      claimedGridEl.appendChild(label);
    }
  }

  function updateClaimedGridCheckbox(number, isChecked){
    const labels = claimedGridEl.querySelectorAll('label');
    labels.forEach(l=>{
      const input = l.querySelector('input');
      if (parseInt(input.value,10)===number){
        input.checked = isChecked; l.classList.toggle('checked', isChecked);
      }
    });
  }

  function updateDay(newDay){
    state.day = Math.max(1, parseInt(newDay,10)||1);
    inputDay.value = state.day;
    dayIndicatorEl.textContent = 'Day ' + state.day;
    saveState();
    updateBoardValues();
    updateStats();
    refreshTickerDays();
  }

  function updateIncrement(val){
    state.specialIncrement = Math.max(0, parseInt(val,10)||0);
    inputIncrement.value = state.specialIncrement;
    saveState();
    updateBoardValues();
    updateStats();
    refreshTickerDays();
  }

  function updateStats(){
    const claimed = state.prizes.filter(p=>p.isClaimed).length;
    const total = state.prizes.length;
    const remaining = total - claimed;
    const specialRemaining = state.prizes.filter(p=>p.isSpecial && !p.isClaimed).length;
    const specialValues = state.prizes.filter(p=>p.isSpecial && !p.isClaimed).map(p=>computeDisplayPrize(p));
    const potentialJackpot = specialValues.reduce((a,b)=>a+b,0);
    const unclaimedRegularValue = state.prizes.filter(p=>!p.isSpecial && !p.isClaimed).reduce((sum,p)=>sum + computeDisplayPrize(p),0);
    const totalUnclaimedValue = state.prizes.filter(p=>!p.isClaimed).reduce((sum,p)=>sum + computeDisplayPrize(p),0);
    const totalClaimedValue = state.prizes.filter(p=>p.isClaimed).reduce((sum,p)=>sum + computeDisplayPrize(p),0);
    statsContainer.innerHTML = `
      <div><strong>Claimed:</strong> ${claimed}/${total}</div>
      <div><strong>Remaining:</strong> ${remaining}</div>
      <div><strong>Special Remaining:</strong> ${specialRemaining}</div>
      <div><strong>Unclaimed Special Value Total:</strong> ${formatCurrency(potentialJackpot)}</div>
      <div><strong>Unclaimed Regular Value:</strong> ${formatCurrency(unclaimedRegularValue)}</div>
      <div><strong>Total Unclaimed:</strong> ${formatCurrency(totalUnclaimedValue)}</div>
      <div><strong>Total Claimed:</strong> ${formatCurrency(totalClaimedValue)}</div>
    `;
  }

  function downloadStateCSV(){
    const header = 'Number,Prize,isSpecial,isClaimed\n';
    const rows = state.prizes.map(p=>[
      p.number,
      computeDisplayPrize(p),
      p.isSpecial?1:0,
      p.isClaimed?1:0
    ].join(','));
    const csv = header + rows.join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `thunderball_state_day${state.day}.csv`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
  }

  function handleUpload(file){
    const reader = new FileReader();
    reader.onload = e => {
      const text = String(e.target.result);
      const newPrizes = detectCSVFormat(text);
      state.prizes = newPrizes;
      saveState();
      buildBoard();
      buildClaimedGrid();
      updateStats();
    };
    reader.readAsText(file);
  }

  function restoreDefault(){
    fetchDefaultCSV().then(text=>{
      const newPrizes = detectCSVFormat(text);
      state.prizes = newPrizes;
      state.day = 1;
      inputDay.value = 1;
      saveState();
      buildBoard(); buildClaimedGrid(); updateStats();
    }).catch(err=>alert('Failed to load default CSV: '+err));
  }

  function clearStorage(){
    if (!confirm('Clear local storage and reset?')) return;
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }

  function toggleSidebar(){ // repurposed: toggle sidebars
    document.body.classList.toggle('hide-sidebars');
    saveState();
  }

  function toggleTheme(){
    document.body.classList.toggle('light-theme');
    localStorage.setItem('thunderballTheme', document.body.classList.contains('light-theme')? 'light':'dark');
  }

  function loadTheme(){
    const t = localStorage.getItem('thunderballTheme');
    if (t === 'light') document.body.classList.add('light-theme');
  }

  function togglePanel(){
    const hidden = panelEl.classList.toggle('hidden');
    panelEl.setAttribute('aria-hidden', hidden?'true':'false');
  }

  function attachEvents(){
    inputDay.addEventListener('change', ()=>updateDay(inputDay.value));
    inputIncrement.addEventListener('change', ()=>updateIncrement(inputIncrement.value));
    btnAdvanceDay.addEventListener('click', ()=>updateDay(state.day + 1));
    btnResetDay.addEventListener('click', ()=>updateDay(1));
    btnToggleSidebar.addEventListener('click', toggleSidebar);
    btnToggleTheme.addEventListener('click', toggleTheme);
    btnDownloadState.addEventListener('click', downloadStateCSV);
    btnRestoreDefault.addEventListener('click', restoreDefault);
    btnClearStorage.addEventListener('click', clearStorage);
    fileUpload.addEventListener('change', e=>{
      if (e.target.files && e.target.files[0]) handleUpload(e.target.files[0]);
    });

    document.addEventListener('keydown', e=>{
      if (e.key === '`') { togglePanel(); }
      if (e.key === 'h'){ toggleSidebar(); }
      if (e.key === 't'){ // optional manual trigger using last claimed
        if (lastClaimedPrize){ playThunderStrike(lastClaimedPrize); }
      }
    });
  }

  function ensureStateDefaults(){
    if (!state) state = {};
    if (typeof state.day !== 'number') state.day = 1;
    if (typeof state.specialIncrement !== 'number') state.specialIncrement = 25;
    if (!Array.isArray(state.prizes)) state.prizes = [];
  }

  function init(){
    state = loadState();
    if (state){
      ensureStateDefaults();
      inputDay.value = state.day;
      inputIncrement.value = state.specialIncrement;
      dayIndicatorEl.textContent = 'Day ' + state.day;
      buildBoard();
      buildClaimedGrid();
      updateStats();
    } else {
      // Load CSV then init
      fetchDefaultCSV().then(text=>{
        const prizes = detectCSVFormat(text);
        state = { day:1, specialIncrement:25, prizes, lastUpdated: Date.now() };
        saveState();
        inputDay.value = 1; inputIncrement.value = 25; dayIndicatorEl.textContent = 'Day 1';
        buildBoard(); buildClaimedGrid(); updateStats();
      }).catch(err=>{
        alert('Failed to load default CSV file. Please upload manually. '+err);
        state = { day:1, specialIncrement:25, prizes: Array.from({length:100}, (_,i)=>defaultPrizeObject(i+1,0)) };
        buildBoard(); buildClaimedGrid(); updateStats();
      });
    }
    buildTickers();
  }

  function buildTickers(){
    if (!leftTickerTrack || !rightTickerTrack) return;
    leftTickerTrack.innerHTML = '';
    rightTickerTrack.innerHTML = '';
    const itemsNeeded = 6; // Enough to scroll smoothly with larger items
    for(let i=0;i<itemsNeeded;i++){
      leftTickerTrack.appendChild(createTickerItem());
      rightTickerTrack.appendChild(createTickerItem());
    }
    // Duplicate content for seamless loop (scrolling -50%)
    for(let i=0;i<itemsNeeded;i++){
      leftTickerTrack.appendChild(createTickerItem());
      rightTickerTrack.appendChild(createTickerItem());
    }
  }

  function createTickerItem(){
    const wrap = document.createElement('div');
    wrap.className = 'ticker-item';
    const logo = document.createElement('div');
    logo.className = 'logo-img';
    logo.style.backgroundImage = "url('https://lirp.cdn-website.com/77390e66/dms3rep/multi/opt/Max+Casino+logo-100w.png')";
    const title = document.createElement('div');
    title.className = 'title-text';
    title.textContent = 'THUNDERBALL';
    const day = document.createElement('div');
    day.className = 'day-text';
    day.textContent = 'Day ' + (state? state.day: 1);
    wrap.appendChild(logo); wrap.appendChild(title); wrap.appendChild(day);
    return wrap;
  }

  // Update day text inside tickers on day changes
  function refreshTickerDays(){
    document.querySelectorAll('.ticker-item .day-text').forEach(el=>{
      el.textContent = 'Day ' + state.day;
    });
  }

  // Thunder strike animation logic
  function playThunderStrike(prize){
    if (!thunderStrikeEl) return;
    // If already active, reset
    thunderStrikeEl.classList.remove('active');
    void thunderStrikeEl.offsetWidth; // force reflow to restart animation
    strikeValueEl.textContent = formatCurrency(computeDisplayPrize(prize));
    thunderStrikeEl.setAttribute('aria-hidden','false');
    thunderStrikeEl.classList.add('active');
    // Auto hide after animation duration
    setTimeout(()=>{
      thunderStrikeEl.classList.remove('active');
      thunderStrikeEl.setAttribute('aria-hidden','true');
    }, 1900);
  }

  loadTheme();
  attachEvents();
  init();
})();
