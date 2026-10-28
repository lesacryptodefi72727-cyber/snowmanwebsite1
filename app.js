/* ============================================================
   HELIX PEPTIDES — app.js
   Catalog, cart (localStorage), researcher gate, UI.
   To rebrand: change BRAND + SUPPORT_EMAIL below and the
   product list in PRODUCTS. No build step required.
   ============================================================ */

const BRAND = "Helix Peptides";
const SUPPORT_EMAIL = "support@helixpeptides.co";
const FREE_SHIP_OVER = 200;

/* ---- Catalog ----------------------------------------------
   coa: true = COA published, false = pending publication
   hue: tints the vial illustration (0–360)
------------------------------------------------------------ */
const PRODUCTS = [
  { id:"bpc157",     name:"BPC-157 10mg",        cat:"peptides", price:69.99,  coa:true,  hue:195 },
  { id:"tb500",      name:"TB-500 5mg",          cat:"peptides", price:59.99,  coa:false, hue:205 },
  { id:"ghkcu",      name:"GHK-Cu 50mg",         cat:"peptides", price:49.99,  coa:true,  hue:170 },
  { id:"motsc",      name:"MOTS-C 10mg",         cat:"peptides", price:55.99,  coa:true,  hue:188 },
  { id:"sema",       name:"Semaglutide 10mg",    cat:"peptides", price:64.99,  coa:true,  hue:210 },
  { id:"tirz",       name:"Tirzepatide 10mg",    cat:"peptides", price:89.99,  coa:true,  hue:218 },
  { id:"glp3rt",     name:"GLP3-RT 10mg",        cat:"peptides", price:99.99,  coa:true,  hue:225 },
  { id:"selank",     name:"Selank 10mg",         cat:"peptides", price:44.99,  coa:true,  hue:160 },
  { id:"semax",      name:"Semax 10mg",          cat:"peptides", price:46.99,  coa:true,  hue:150 },
  { id:"nad",        name:"NAD+ 500mg",          cat:"peptides", price:84.99,  coa:true,  hue:260 },
  { id:"tesa",       name:"Tesamorelin 10mg",    cat:"peptides", price:74.99,  coa:true,  hue:200 },
  { id:"kiss",       name:"Kisspeptin-10 10mg",  cat:"peptides", price:52.99,  coa:true,  hue:300 },
  { id:"ss31",       name:"SS-31 10mg",          cat:"peptides", price:69.99,  coa:false, hue:280 },
  { id:"ipa",        name:"Ipamorelin 5mg",      cat:"peptides", price:39.99,  coa:true,  hue:185 },
  { id:"cjc",        name:"CJC-1295 5mg",        cat:"peptides", price:54.99,  coa:true,  hue:230 },
  { id:"epi",        name:"Epithalon 10mg",      cat:"peptides", price:47.99,  coa:true,  hue:245 },
  { id:"wolverine",  name:"Wolverine 20mg (BPC + TB500)", cat:"blends", price:149.99, coa:false, hue:198 },
  { id:"glow",       name:"GLOW 70mg Blend",     cat:"blends",   price:129.99, coa:true,  hue:165 },
  { id:"klow",       name:"KLOW 80mg Blend",     cat:"blends",   price:139.99, coa:true,  hue:175 },
  { id:"bac30",      name:"Bacteriostatic Water 30ml", cat:"bac", price:14.99, coa:null,  hue:200 },
  { id:"bac10x3",    name:"Bacteriostatic Water 10ml (3-pack)", cat:"bac", price:24.99, coa:null, hue:200 },
];

const CAT_LABEL = { peptides:"Peptides", blends:"Blends", bac:"BAC Water" };
const money = n => "$" + n.toFixed(2);
const byId = id => PRODUCTS.find(p => p.id === id);

/* vial SVG tinted per hue */
function vialSVG(hue, bac=false){
  const top = `hsl(${hue} 90% 72%)`, bot = `hsl(${hue} 85% 52%)`;
  const fillOpacity = bac ? 0.35 : 0.85;
  return `<svg viewBox="0 0 120 220" class="card__vial" aria-hidden="true">
    <rect x="40" y="6" width="40" height="14" rx="3" fill="#9fb4cf"/>
    <rect x="45" y="17" width="30" height="8" rx="2" fill="#6d84a3"/>
    <path d="M36 30h48v152a20 20 0 0 1-20 20H56a20 20 0 0 1-20-20V30Z" fill="rgba(13,32,51,.6)" stroke="#2a4a6b" stroke-width="2"/>
    <path d="M40 108h40v74a16 16 0 0 1-16 16H56a16 16 0 0 1-16-16V108Z" fill="url(#g${hue})" opacity="${fillOpacity}"/>
    <rect x="46" y="44" width="28" height="46" rx="5" fill="#fff" opacity="0.06"/>
    <defs><linearGradient id="g${hue}" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bot}"/>
    </linearGradient></defs>
  </svg>`;
}

/* ---- Render catalog --------------------------------------- */
const grid = document.getElementById("product-grid");
function renderCatalog(){
  grid.innerHTML = PRODUCTS.map(p => {
    const badge = p.coa === true
      ? `<span class="card__badge">COA</span>`
      : p.coa === false
        ? `<span class="card__badge pending">COA PENDING</span>`
        : ``;
    const meta = p.coa === true ? "Third-party tested · COA"
      : p.coa === false ? "COA pending publication"
      : "Research reconstitution solvent";
    const coaBtn = p.coa === true
      ? `<button class="card__coa" data-coa="${p.id}" title="Download COA">COA ↓</button>`
      : ``;
    return `<article class="card" data-cat="${p.cat}">
      <div class="card__media">${badge}${vialSVG(p.hue, p.cat==="bac")}</div>
      <div class="card__body">
        <span class="card__cat">${CAT_LABEL[p.cat]}</span>
        <h3 class="card__name">${p.name}</h3>
        <span class="card__meta">${meta}</span>
        <span class="card__price">${money(p.price)}</span>
        <div class="card__actions">
          <button class="btn btn--primary btn--sm card__add" data-add="${p.id}">Add to cart</button>
          ${coaBtn}
        </div>
      </div>
    </article>`;
  }).join("");
}

/* category counts in UI */
function paintCounts(){
  ["peptides","blends","bac"].forEach(c=>{
    const n = PRODUCTS.filter(p=>p.cat===c).length;
    document.querySelectorAll(`[data-count="${c}"]`).forEach(el=>el.textContent=n);
  });
  const total = PRODUCTS.length;
  const coa = PRODUCTS.filter(p=>p.coa===true).length;
  const set = (id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=v; };
  set("stat-total", total);
  set("stat-coa", coa);
  set("stat-verified", PRODUCTS.filter(p=>p.coa!==null).length);
}

/* ---- Filters ---------------------------------------------- */
function initFilters(){
  const filters = document.getElementById("filters");
  filters.addEventListener("click", e=>{
    const btn = e.target.closest(".filter"); if(!btn) return;
    filters.querySelectorAll(".filter").forEach(f=>f.classList.remove("is-active"));
    btn.classList.add("is-active");
    applyFilter(btn.dataset.filter);
  });
  // category cards jump + filter
  document.querySelectorAll(".cat").forEach(cat=>{
    cat.addEventListener("click", ()=>{
      const c = cat.dataset.cat;
      const fbtn = filters.querySelector(`[data-filter="${c}"]`);
      if(fbtn){ filters.querySelectorAll(".filter").forEach(f=>f.classList.remove("is-active")); fbtn.classList.add("is-active"); applyFilter(c); }
    });
  });
}
function applyFilter(f){
  grid.querySelectorAll(".card").forEach(card=>{
    card.classList.toggle("is-hidden", f!=="all" && card.dataset.cat!==f);
  });
}

/* ---- Cart (localStorage) ---------------------------------- */
const CART_KEY = "helix_cart_v1";
let cart = loadCart();
function loadCart(){ try{ return JSON.parse(localStorage.getItem(CART_KEY)) || {}; }catch(e){ return {}; } }
function saveCart(){ try{ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }catch(e){} }

function addToCart(id){
  cart[id] = (cart[id]||0) + 1;
  saveCart(); renderCart();
  toast(`Added ${byId(id).name} to cart`);
}
function setQty(id, q){
  if(q<=0) delete cart[id]; else cart[id]=q;
  saveCart(); renderCart();
}
function cartCount(){ return Object.values(cart).reduce((a,b)=>a+b,0); }
function cartSubtotal(){ return Object.entries(cart).reduce((s,[id,q])=>{ const p=byId(id); return s + (p? p.price*q : 0); },0); }

function renderCart(){
  const count = cartCount();
  const badge = document.getElementById("cart-count");
  badge.textContent = count; badge.hidden = count===0;
  document.getElementById("drawer-count").textContent = count;

  const body = document.getElementById("drawer-body");
  const foot = document.getElementById("drawer-foot");
  const entries = Object.entries(cart).filter(([id])=>byId(id));

  if(!entries.length){
    body.innerHTML = `<div class="drawer__empty">
      <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.2 12.3a1.6 1.6 0 0 0 1.6 1.3h8.5a1.6 1.6 0 0 0 1.6-1.3L21.5 7H6.2"/></svg>
      <p>Your cart is empty.</p><p class="small">Add research compounds to get started.</p></div>`;
    foot.style.display = "none";
    return;
  }
  foot.style.display = "block";
  body.innerHTML = entries.map(([id,q])=>{
    const p = byId(id);
    return `<div class="line">
      <div class="line__media">${vialSVG(p.hue, p.cat==="bac")}</div>
      <div class="line__info">
        <div class="line__name">${p.name}</div>
        <div class="line__price">${money(p.price)} each</div>
        <div class="line__ctl">
          <div class="qty">
            <button data-dec="${id}" aria-label="Decrease">−</button>
            <span>${q}</span>
            <button data-inc="${id}" aria-label="Increase">+</button>
          </div>
          <button class="line__rm" data-rm="${id}">Remove</button>
        </div>
      </div>
    </div>`;
  }).join("");

  const sub = cartSubtotal();
  document.getElementById("cart-subtotal").textContent = money(sub);
}

/* ---- Drawer ----------------------------------------------- */
const drawer = document.getElementById("drawer");
const overlay = document.getElementById("drawer-overlay");
function openDrawer(){ drawer.classList.add("open"); drawer.setAttribute("aria-hidden","false"); overlay.hidden=false; document.body.classList.add("drawer-open"); }
function closeDrawer(){ drawer.classList.remove("open"); drawer.setAttribute("aria-hidden","true"); overlay.hidden=true; document.body.classList.remove("drawer-open"); }

/* ---- Checkout (demo) --------------------------------------
   No backend: builds an order summary + opens a prefilled
   email to the shop. Swap for Stripe/Snipcart — see README.
------------------------------------------------------------ */
function checkout(){
  const entries = Object.entries(cart).filter(([id])=>byId(id));
  if(!entries.length) return;
  const lines = entries.map(([id,q])=>{ const p=byId(id); return `${q} x ${p.name} — ${money(p.price*q)}`; });
  const sub = cartSubtotal();
  const ship = sub >= FREE_SHIP_OVER ? "FREE" : "calculated at checkout";
  const body = `New research order — ${BRAND}%0A%0A${lines.join("%0A")}%0A%0ASubtotal: ${money(sub)}%0AShipping: ${ship}%0A%0A(For laboratory research use only.)`;
  toast("Opening order summary…");
  window.location.href = `mailto:${SUPPORT_EMAIL}?subject=Research%20Order%20-%20${encodeURIComponent(BRAND)}&body=${body}`;
}

/* ---- Researcher gate -------------------------------------- */
const GATE_KEY = "helix_verified_v1";
function initGate(){
  const gate = document.getElementById("gate");
  let verified = false;
  try{ verified = localStorage.getItem(GATE_KEY)==="1"; }catch(e){}
  if(verified) return;
  gate.hidden = false;
  document.body.classList.add("gate-open");
  const age = document.getElementById("gate-age");
  const res = document.getElementById("gate-research");
  const enter = document.getElementById("gate-enter");
  const check = ()=>{ enter.disabled = !(age.checked && res.checked); };
  age.addEventListener("change", check);
  res.addEventListener("change", check);
  enter.addEventListener("click", ()=>{
    try{ localStorage.setItem(GATE_KEY,"1"); }catch(e){}
    gate.hidden = true; document.body.classList.remove("gate-open");
  });
}

/* ---- Toast ------------------------------------------------ */
let toastTimer;
function toast(msg){
  const t = document.getElementById("toast");
  t.innerHTML = `<span class="tick">✓</span> ${msg}`;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove("show"), 2400);
}

/* ---- Mobile nav ------------------------------------------- */
function initNav(){
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("nav");
  let backdrop;
  const close = ()=>{ nav.classList.remove("open"); toggle.setAttribute("aria-expanded","false"); if(backdrop){ backdrop.remove(); backdrop=null; } };
  toggle.addEventListener("click", ()=>{
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
    if(open){ backdrop=document.createElement("div"); backdrop.className="nav-backdrop"; backdrop.addEventListener("click",close); document.body.appendChild(backdrop); }
    else close();
  });
  nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",close));
}

/* ---- Wire everything up ----------------------------------- */
document.addEventListener("click", e=>{
  const add = e.target.closest("[data-add]"); if(add){ addToCart(add.dataset.add); return; }
  const inc = e.target.closest("[data-inc]"); if(inc){ setQty(inc.dataset.inc, (cart[inc.dataset.inc]||0)+1); return; }
  const dec = e.target.closest("[data-dec]"); if(dec){ setQty(dec.dataset.dec, (cart[dec.dataset.dec]||0)-1); return; }
  const rm  = e.target.closest("[data-rm]");  if(rm){ setQty(rm.dataset.rm, 0); return; }
  const coa = e.target.closest("[data-coa]"); if(coa){ toast(`COA for ${byId(coa.dataset.coa).name} — connect your COA library`); return; }
});

document.getElementById("cart-open").addEventListener("click", openDrawer);
document.getElementById("cart-close").addEventListener("click", closeDrawer);
overlay.addEventListener("click", closeDrawer);
document.getElementById("checkout-btn").addEventListener("click", checkout);
document.addEventListener("keydown", e=>{ if(e.key==="Escape") closeDrawer(); });

/* newsletter (demo — wire to Formspree/Netlify, see README) */
document.getElementById("news-form").addEventListener("submit", e=>{
  e.preventDefault();
  const email = document.getElementById("news-email");
  if(!email.value || !email.value.includes("@")){ toast("Enter a valid email"); return; }
  email.value = "";
  toast("Subscribed — welcome to the lab list");
});

/* header shadow on scroll */
const header = document.getElementById("header");
addEventListener("scroll", ()=>{ header.classList.toggle("scrolled", scrollY>20); }, {passive:true});

/* year */
document.getElementById("year").textContent = new Date().getFullYear();

/* init */
renderCatalog();
paintCounts();
initFilters();
initNav();
renderCart();
initGate();
