/* ===== app.js – Skin Cancer DWM Dashboard =====
   White & Green theme · Web scraping · Training log · Prediction
*/

const LABEL_INFO = {
  MEL: { name:"Melanoma",             color:"#a855f7", desc:"The most dangerous form of skin cancer, developing from pigment-containing cells." },
  BCC: { name:"Basal Cell Carcinoma", color:"#06b6d4", desc:"The most common skin cancer; slow-growing tumour originating in basal cells." },
  SCC: { name:"Squamous Cell Carcinoma", color:"#f97316", desc:"Arises from squamous cells in the outer layers of skin." },
};
const LABEL_COLORS = { MEL:"#a855f7", BCC:"#06b6d4", SCC:"#f97316" };

let RECORDS = [], CONFIG = {};
let galleryFilter = "ALL", tableFilter = "ALL", tableSearch = "", allImgFilter = "ALL";
let dataSource = "loading";

const $ = id => document.getElementById(id);
const tableBody   = $("table-body");
const tableCount  = $("table-count");
const searchInput = $("search-input");
const galleryGrid = $("gallery-grid");
const lightbox    = $("lightbox");
const lbImg       = $("lb-img");
const lbTitle     = $("lb-title");
const lbMeta      = $("lb-meta");
const lbClose     = $("lb-close");
const sourceTag   = $("data-source-tag");

function normalise(r) {
  return {
    id:          r.id,
    label:       r.Label       || r.label       || "",
    localPath:   (r.LocalPath  || r.localPath   || "").replace(/\\/g,"/"),
    sourceURL:   r.SourceURL   || r.sourceURL   || "",
    createdDate: r.CreatedDate || r.createdDate  || "",
  };
}

/* ---------- FETCH DATA ---------- */
async function loadData() {
  showSkeleton();
  try {
    const [recRes, cfgRes] = await Promise.all([fetch("/api/records"), fetch("/api/config")]);
    if (!recRes.ok) throw new Error(`API error ${recRes.status}`);
    const recJson = await recRes.json();
    RECORDS    = (recJson.records || []).map(normalise);
    dataSource = recJson.source || "api";
    if (cfgRes.ok) CONFIG = await cfgRes.json();
    updateSourceTag(dataSource);
  } catch (err) {
    console.error("[DWM]", err.message);
    showError(err.message);
    return;
  }
  renderAll();
}

function updateSourceTag(src) {
  if (!sourceTag) return;
  if (src === "supabase") {
    sourceTag.textContent = "● Live Supabase";
    sourceTag.style.color = "#10b981";
  } else if (src === "mysql") {
    sourceTag.textContent = "● Live MySQL";
    sourceTag.style.color = "#059669";
  } else {
    sourceTag.textContent = "● CSV Offline";
    sourceTag.style.color = "#ea580c";
  }
}

function showSkeleton() {
  tableBody.innerHTML   = `<tr><td colspan="5" class="no-results" style="color:var(--green-600)">⟳ Fetching warehouse data…</td></tr>`;
  galleryGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:60px 0;font-size:.9rem">⟳ Loading images…</div>`;
}

function showError(msg) {
  tableBody.innerHTML   = `<tr><td colspan="5" class="no-results" style="color:#ea580c">⚠ Could not load data: ${msg}</td></tr>`;
  galleryGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#ea580c;padding:60px 0;font-size:.9rem">⚠ Server unreachable. Is server.py running?<br><small style="color:var(--text-muted)">Run: .\\venv\\Scripts\\python.exe server.py</small></div>`;
}

function renderAll() {
  renderStats(); renderCharts(); renderTable(); renderGallery(); renderSourceList();
}

/* ---------- STATS ---------- */
function renderStats() {
  const counts = {};
  RECORDS.forEach(r => { counts[r.label] = (counts[r.label] || 0) + 1; });
  if ($("stat-total")) $("stat-total").textContent = RECORDS.length;
  if ($("stat-mel"))   $("stat-mel").textContent   = counts["MEL"] ?? 0;
  if ($("stat-bcc"))   $("stat-bcc").textContent   = counts["BCC"] ?? 0;
  if ($("stat-scc"))   $("stat-scc").textContent   = counts["SCC"] ?? 0;
  const hosts = new Set(RECORDS.map(r => { try { return new URL(r.sourceURL).hostname; } catch(e){ return "?"; } }));
  if ($("stat-sources")) $("stat-sources").textContent = hosts.size;
  const sz = CONFIG.image_size || [224, 224];
  if ($("stat-resolution")) $("stat-resolution").textContent = sz[0] + "px";
}

/* ---------- SOURCE LIST ---------- */
function renderSourceList() {
  const el = $("source-list");
  if (!el || !CONFIG.tasks) return;
  const byHost = {};
  (CONFIG.tasks || []).forEach(t => {
    try { const h = new URL(t.url).hostname.replace("www.",""); byHost[h] = (byHost[h]||0)+1; } catch(e){}
  });
  el.innerHTML = Object.entries(byHost).map(([h, n]) =>
    `<div class="legend-item"><div class="legend-dot" style="background:var(--green-500)"></div><span class="legend-label">${h}</span><span class="legend-val">${n} task${n>1?"s":""}</span></div>`
  ).join("") || "<span style='color:var(--text-muted)'>No tasks</span>";
}

/* ---------- DONUT ---------- */
function buildDonut(svg, data, size=120, stroke=22) {
  const r = (size-stroke)/2, cx = size/2, cy = size/2, circ = 2*Math.PI*r;
  const total = Math.max(1, data.reduce((s,d)=>s+d.value,0));
  let offset = 0;
  svg.setAttribute("viewBox",`0 0 ${size} ${size}`);
  svg.innerHTML = "";
  const bg = document.createElementNS("http://www.w3.org/2000/svg","circle");
  bg.setAttribute("cx",cx);bg.setAttribute("cy",cy);bg.setAttribute("r",r);
  bg.setAttribute("fill","none");bg.setAttribute("stroke","rgba(16,185,129,0.08)");
  bg.setAttribute("stroke-width",stroke);svg.appendChild(bg);
  data.forEach(d => {
    if (!d.value) return;
    const dash = (d.value/total)*circ, gap = circ-dash;
    const arc = document.createElementNS("http://www.w3.org/2000/svg","circle");
    arc.setAttribute("cx",cx);arc.setAttribute("cy",cy);arc.setAttribute("r",r);
    arc.setAttribute("fill","none");arc.setAttribute("stroke",d.color);
    arc.setAttribute("stroke-width",stroke);
    arc.setAttribute("stroke-dasharray",`${dash} ${gap}`);
    arc.setAttribute("stroke-dashoffset",-offset+circ/4);
    arc.setAttribute("stroke-linecap","round");
    svg.appendChild(arc); offset += dash;
  });
}

/* ---------- CHARTS ---------- */
function renderCharts() {
  const counts = {};
  RECORDS.forEach(r => { counts[r.label] = (counts[r.label]||0)+1; });
  const labels = [...new Set(RECORDS.map(r=>r.label))].sort();
  const donutData = labels.map(l => ({ label:l, value:counts[l]||0, color:LABEL_COLORS[l]||"#10b981" }));
  const svg = $("donut-svg");
  if (svg) buildDonut(svg, donutData);
  const legendEl = $("donut-legend");
  if (legendEl) legendEl.innerHTML = donutData.map(d => `<div class="legend-item"><div class="legend-dot" style="background:${d.color}"></div><span class="legend-label">${LABEL_INFO[d.label]?.name||d.label}</span><span class="legend-val">${d.value}</span></div>`).join("");
  const hostCounts = {};
  RECORDS.forEach(r => { try { const h = new URL(r.sourceURL).hostname.replace("www.",""); hostCounts[h]=(hostCounts[h]||0)+1; } catch(e){} });
  const barColors = ["#10b981","#06b6d4","#a855f7","#f97316","#3b82f6"];
  const total = RECORDS.length || 1;
  const barEl = $("source-bars");
  if (barEl) barEl.innerHTML = Object.entries(hostCounts).map(([h,v],i) => `<div class="source-row"><div class="source-row-top"><span>${h}</span><span>${v} images</span></div><div class="bar-track"><div class="bar-fill" style="width:${(v/total*100).toFixed(1)}%;background:${barColors[i%barColors.length]}"></div></div></div>`).join("");
}

/* ---------- TABLE ---------- */
function renderTable() {
  let data = RECORDS;
  if (tableFilter !== "ALL") data = data.filter(r => r.label === tableFilter);
  if (tableSearch) { const q = tableSearch.toLowerCase(); data = data.filter(r => r.label.toLowerCase().includes(q)||r.localPath.toLowerCase().includes(q)||r.sourceURL.toLowerCase().includes(q)||String(r.id).includes(q)); }
  tableCount.textContent = `${data.length} record${data.length!==1?"s":""}`;
  if (!data.length) { tableBody.innerHTML = `<tr><td colspan="5" class="no-results">No records match your filter.</td></tr>`; return; }
  tableBody.innerHTML = data.map(r => {
    let host = r.sourceURL;
    try { host = new URL(r.sourceURL).hostname.replace("www.","")+" ↗"; } catch(e){}
    const fname = r.localPath.split("/").pop();
    return `<tr><td class="mono">#${String(r.id).padStart(2,"0")}</td><td><span class="chip chip-${r.label}">${r.label}</span></td><td class="mono">${fname}</td><td><a href="${r.sourceURL}" target="_blank" rel="noopener" title="${r.sourceURL}">${host}</a></td><td class="mono">${r.createdDate}</td></tr>`;
  }).join("");
}

/* ---------- GALLERY ---------- */
function renderGallery() {
  let data = RECORDS;
  if (galleryFilter !== "ALL") data = data.filter(r => r.label === galleryFilter);
  if (!data.length) { galleryGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:60px 0">No images for this filter.</div>`; return; }
  galleryGrid.innerHTML = data.map(r => {
    const fname = r.localPath.split("/").pop();
    return `<div class="gallery-card animate-in" tabindex="0" data-id="${r.id}" data-path="${r.localPath}" data-label="${r.label}"><div class="gallery-img-wrap"><img src="${r.localPath}" alt="${r.label} #${r.id}" loading="lazy" onerror="this.closest('.gallery-card').style.display='none';"></div><div class="gallery-card-info"><div class="gallery-card-id">${fname}</div><div class="gallery-card-bottom"><span class="chip chip-${r.label}">${r.label}</span><span style="font-size:.7rem;color:var(--text-muted)">#${r.id}</span></div></div></div>`;
  }).join("");
  galleryGrid.querySelectorAll(".gallery-card").forEach(card => {
    const open = () => openLightbox(card.dataset.id, card.dataset.path, card.dataset.label);
    card.addEventListener("click", open);
    card.addEventListener("keydown", e => { if(e.key==="Enter"||e.key===" ") open(); });
  });
}

/* ---------- LIGHTBOX ---------- */
function openLightbox(id, path, label) {
  lbImg.src = path;
  lbTitle.textContent = `${LABEL_INFO[label]?.name||label} – Image #${id}`;
  lbMeta.textContent  = LABEL_INFO[label]?.desc || "";
  lightbox.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeLightbox() { lightbox.classList.remove("open"); document.body.style.overflow = ""; }
lbClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", e => { if (e.target===lightbox) closeLightbox(); });
document.addEventListener("keydown", e => { if (e.key==="Escape") closeLightbox(); });

/* ---------- FILTERS ---------- */
function initFilters() {
  document.querySelectorAll("[data-gallery-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-gallery-filter]").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active"); galleryFilter = btn.dataset.galleryFilter; renderGallery();
    });
  });
  document.querySelectorAll("[data-table-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-table-filter]").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active"); tableFilter = btn.dataset.tableFilter; renderTable();
    });
  });
  searchInput.addEventListener("input", e => { tableSearch = e.target.value.trim(); renderTable(); });
  document.querySelectorAll("[data-allimg-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-allimg-filter]").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active"); allImgFilter = btn.dataset.allimgFilter; renderAllImages();
    });
  });
}

/* ---------- COPY SQL ---------- */
$("copy-sql-btn").addEventListener("click", () => {
  const sql = $("sql-code").innerText;
  navigator.clipboard.writeText(sql).then(() => {
    const btn = $("copy-sql-btn"); btn.textContent = "Copied!";
    setTimeout(()=>(btn.textContent="Copy"),2000);
  });
});

/* ---------- CSV DOWNLOAD ---------- */
$("btn-download-csv").addEventListener("click", () => {
  const header = "id,SourceURL,Label,LocalPath,CreatedDate\n";
  const rows = RECORDS.map(r=>`${r.id},"${r.sourceURL}",${r.label},${r.localPath},${r.createdDate}`).join("\n");
  const blob = new Blob([header+rows],{type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "SkinWarehouse_Registry.csv"; a.click();
  URL.revokeObjectURL(url);
});

/* ---------- SMOOTH SCROLL ---------- */
document.querySelectorAll("a[href^='#']").forEach(a => {
  a.addEventListener("click", e => {
    e.preventDefault();
    const t = document.querySelector(a.getAttribute("href"));
    if (t) t.scrollIntoView({behavior:"smooth",block:"start"});
  });
});

/* ---------- INTERSECTION OBSERVER ---------- */
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if(e.isIntersecting){e.target.classList.add("animate-in");observer.unobserve(e.target);} });
},{threshold:0.08});
document.querySelectorAll(".stat-card,.pipeline-step,.chart-card").forEach(el=>observer.observe(el));

/* ========== CNN DETECTION ========== */
async function checkModelStatus() {
  const bar = $("model-status-bar"), icon = $("model-status-icon"), text = $("model-status-text");
  try {
    const res = await fetch("/api/model_status"); const data = await res.json();
    if (data.ready) {
      bar.className = "model-status-bar ready"; icon.textContent = "✓";
      text.textContent = `CNN model ready — classes: ${(data.labels||[]).join(", ")}`;
      $("btn-detect").disabled = false;
      if ($("training-model-status")) $("training-model-status").textContent = "✓ Trained & Ready";
      if ($("training-model-classes")) $("training-model-classes").textContent = `Classes: ${(data.labels||[]).join(", ")}`;
    } else {
      bar.className = "model-status-bar notready"; icon.textContent = "✗";
      text.textContent = "Model not trained. Run: .\\venv\\Scripts\\python.exe train_cnn.py";
      if ($("training-model-status")) $("training-model-status").textContent = "✗ Not Trained";
    }
  } catch(e) {
    bar.className = "model-status-bar notready"; icon.textContent = "!";
    text.textContent = "Could not reach server";
    if ($("training-model-status")) $("training-model-status").textContent = "Server unreachable";
  }
}

function initDetection() {
  const zone=$("upload-zone"),fileInput=$("file-input"),previewImg=$("preview-img"),uploadInner=$("upload-inner"),detectBtn=$("btn-detect"),clearBtn=$("btn-clear-detect"),resultArea=$("detect-result-area");
  let selectedFile = null;
  function setPreview(file) { selectedFile=file; previewImg.src=URL.createObjectURL(file); previewImg.style.display="block"; uploadInner.style.display="none"; detectBtn.disabled=false; }
  function clearPreview() { selectedFile=null; previewImg.style.display="none"; uploadInner.style.display="flex"; previewImg.src=""; fileInput.value=""; detectBtn.disabled=true; resultArea.innerHTML=`<div style="text-align:center;padding:40px 0;color:var(--text-muted)"><div style="font-size:2rem">🩺</div><div style="margin-top:8px;font-size:.85rem">Upload an image to begin analysis</div></div>`; }
  zone.addEventListener("click", ()=>fileInput.click());
  zone.addEventListener("keydown", e=>{if(e.key==="Enter"||e.key===" ")fileInput.click();});
  fileInput.addEventListener("change", e=>{if(e.target.files[0])setPreview(e.target.files[0]);});
  zone.addEventListener("dragover", e=>{e.preventDefault();zone.classList.add("drag-over");});
  zone.addEventListener("dragleave", ()=>zone.classList.remove("drag-over"));
  zone.addEventListener("drop", e=>{e.preventDefault();zone.classList.remove("drag-over");const f=e.dataTransfer.files[0];if(f&&f.type.startsWith("image/"))setPreview(f);});
  clearBtn.addEventListener("click", clearPreview);
  detectBtn.addEventListener("click", async()=>{
    if(!selectedFile) return;
    detectBtn.disabled=true; detectBtn.textContent="⟳ Analysing…";
    resultArea.innerHTML=`<div style="text-align:center;padding:40px;color:var(--green-600)">⟳ Running CNN inference…</div>`;
    const form = new FormData(); form.append("image", selectedFile);
    try {
      const res = await fetch("/api/predict",{method:"POST",body:form});
      const data = await res.json();
      if (data.error) { resultArea.innerHTML=`<div style="color:#ea580c;padding:20px;text-align:center">⚠ ${data.error}</div>`; }
      else {
        const col = LABEL_COLORS[data.prediction]||"#10b981";
        const probBars = Object.entries(data.all_probs||{}).map(([lbl,pct])=>{
          const c = LABEL_COLORS[lbl]||"#10b981";
          return `<div class="prob-row"><div class="prob-label" style="color:${c}">${lbl}</div><div class="prob-track"><div class="prob-fill" style="width:${pct}%;background:${c}"></div></div><div class="prob-val">${pct}%</div></div>`;
        }).join("");
        resultArea.innerHTML=`<div class="result-label" style="color:${col}">${data.prediction}</div><div class="result-name">${data.name}</div><div class="result-confidence">Confidence</div><div class="conf-bar-track"><div class="conf-bar-fill" style="width:${data.confidence}%;background:${col}"></div></div><div style="margin-bottom:12px"><div style="font-size:.72rem;color:var(--text-muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:.4px">Probabilities</div>${probBars}</div><div style="display:flex;justify-content:space-between;align-items:center;font-size:.78rem;color:var(--text-muted)"><span>Preprocessed: <strong>${data.preprocessed}</strong></span><span class="risk-badge risk-${data.risk}">Risk: ${data.risk}</span></div>`;
      }
    } catch(e) { resultArea.innerHTML=`<div style="color:#ea580c;padding:20px;text-align:center">⚠ Could not connect to server.</div>`; }
    detectBtn.disabled=false; detectBtn.textContent="🔍 Detect";
  });
}

/* ========== WEB SCRAPER ========== */
function initScraper() {
  const scrapeBtn = $("btn-scrape"), urlInput = $("scrape-url"), labelSel = $("scrape-label");
  const logEl = $("scrape-log"), resultsEl = $("scrape-results"), retrainCb = $("scrape-retrain");

  function log(msg) { logEl.classList.add("visible"); logEl.innerHTML += msg + "\n"; logEl.scrollTop = logEl.scrollHeight; }

  scrapeBtn.addEventListener("click", async () => {
    const url = urlInput.value.trim();
    if (!url) { alert("Please enter a URL to scrape."); return; }
    const label = labelSel.value;
    logEl.innerHTML = ""; resultsEl.innerHTML = ""; logEl.classList.add("visible");
    scrapeBtn.disabled = true; scrapeBtn.textContent = "⟳ Scraping…";
    log(`[▶] Starting scrape: ${url}`);
    log(`[▶] Label: ${label}`);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ url, label, retrain: retrainCb.checked })
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server returned ${res.status}: ${text.slice(0, 100)}`);
      }

      const data = await res.json();
      if (data.debug) { console.log("[Scraper Debug]", data.debug); }

      if (data.error) { log(`[✗] Error: ${data.error}`); }
      else {
        log(`[✓] Scraped ${data.images_found} images from page`);
        log(`[✓] Downloaded & processed ${data.saved} images`);
        if (data.saved > 0 && data.images) {
          data.images.forEach(img => {
            resultsEl.innerHTML += `<div class="scrape-thumb"><img src="${img.path}" alt="${label}" loading="lazy"></div>`;
          });
        }
        if (data.retrained) { log(`[✓] CNN model retrained successfully!`); checkModelStatus(); }
        else if (retrainCb.checked) { log(`[!] Retraining skipped or failed`); }
        log(`[✓] Done. Refreshing dashboard…`);
        await loadData();
      }
    } catch(e) { 
      console.error("[Scraper Error]", e);
      log(`[✗] Scraper failed: ${e.message.includes("Unexpected token") ? "Server returned HTML (likely a timeout or deployment in progress)" : e.message}`); 
      log(`[!] Tip: Wait 1 minute for the build to finish, then try again without 'Retrain CNN' checked.`);
    }
    scrapeBtn.disabled = false; scrapeBtn.textContent = "🔍 Scrape";
  });
}

/* ========== TRAINING LOG ========== */
function initTrainingLog() {
  $("btn-show-training").addEventListener("click", () => {
    $("training-info-panel").style.display = "block";
    $("extraction-log-panel").style.display = "none";
    $("all-images-panel").style.display = "none";
  });
  $("btn-show-extraction").addEventListener("click", async () => {
    $("training-info-panel").style.display = "none";
    $("extraction-log-panel").style.display = "block";
    $("all-images-panel").style.display = "none";
    // Build extraction log from records
    const content = $("extraction-log-content");
    const bySource = {};
    RECORDS.forEach(r => {
      let host = "unknown";
      try { host = new URL(r.sourceURL).hostname.replace("www.",""); } catch(e){}
      if (!bySource[host]) bySource[host] = { MEL:0, BCC:0, SCC:0, total:0, urls:new Set() };
      bySource[host][r.label] = (bySource[host][r.label]||0)+1;
      bySource[host].total++;
      bySource[host].urls.add(r.sourceURL);
    });
    content.innerHTML = Object.entries(bySource).map(([host, info]) => `
      <div style="padding:16px;background:var(--green-50);border-radius:var(--radius-sm);margin-bottom:12px">
        <div style="font-weight:600;margin-bottom:8px;color:var(--green-700)">🌐 ${host}</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:8px">
          <span class="chip chip-MEL">MEL: ${info.MEL||0}</span>
          <span class="chip chip-BCC">BCC: ${info.BCC||0}</span>
          <span class="chip chip-SCC">SCC: ${info.SCC||0}</span>
          <span style="font-size:.78rem;color:var(--text-muted)">Total: ${info.total}</span>
        </div>
        <div style="font-size:.72rem;color:var(--text-muted)">${info.urls.size} unique image URLs</div>
      </div>
    `).join("") || '<div style="color:var(--text-muted);padding:20px;text-align:center">No extraction data available.</div>';
  });
  $("btn-show-all-images").addEventListener("click", () => {
    $("training-info-panel").style.display = "none";
    $("extraction-log-panel").style.display = "none";
    $("all-images-panel").style.display = "block";
    renderAllImages();
  });
}

function renderAllImages() {
  let data = RECORDS;
  if (allImgFilter !== "ALL") data = data.filter(r => r.label === allImgFilter);
  $("all-img-count").textContent = data.length;
  const grid = $("all-images-grid");
  grid.innerHTML = data.map(r => {
    const fname = r.localPath.split("/").pop();
    return `<div class="gallery-card animate-in" tabindex="0" data-id="${r.id}" data-path="${r.localPath}" data-label="${r.label}"><div class="gallery-img-wrap"><img src="${r.localPath}" alt="${r.label} #${r.id}" loading="lazy" onerror="this.closest('.gallery-card').style.display='none';"></div><div class="gallery-card-info"><div class="gallery-card-id">${fname}</div><div class="gallery-card-bottom"><span class="chip chip-${r.label}">${r.label}</span><span style="font-size:.7rem;color:var(--text-muted)">#${r.id}</span></div></div></div>`;
  }).join("");
  grid.querySelectorAll(".gallery-card").forEach(card => {
    card.addEventListener("click", ()=>openLightbox(card.dataset.id,card.dataset.path,card.dataset.label));
  });
}

/* ---------- INIT ---------- */
initFilters();
initDetection();
initScraper();
initTrainingLog();
checkModelStatus();
loadData();
