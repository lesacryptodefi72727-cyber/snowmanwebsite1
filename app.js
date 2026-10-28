/* ============================================================
   HELIX PEPTIDES — app.js  (ES module)
   Catalog + cart + researcher gate + checkout.

   DATA SOURCE
   -----------
   Products, the payment account, and orders live in Firebase
   Firestore and are managed from the Telegram admin bot.
   • If Firebase is NOT configured below, the site runs on the
     built-in demo catalog so it still works out of the box.
   • Once you paste your Firebase web config, the site reads
     products + payment info live and writes each checkout as
     an order the bot can see and mark.

   Firebase web config is NOT secret — it is safe in client
   code. Security is enforced by Firestore rules (see
   firestore.rules). To rebrand: change BRAND below.
   ============================================================ */

/* ---- 1) PASTE YOUR FIREBASE WEB CONFIG HERE ---------------
   Firebase console → Project settings → Your apps → Web app.
   Leave the placeholders to keep running on the demo catalog. */
const firebaseConfig = {
  apiKey:            "PASTE_API_KEY",
  authDomain:        "PASTE_PROJECT.firebaseapp.com",
  projectId:         "PASTE_PROJECT_ID",
  storageBucket:     "PASTE_PROJECT.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId:             "PASTE_APP_ID",
};

const BRAND = "Helix Peptides";
const FREE_SHIP_OVER = 200;
const FB_VERSION = "10.12.2";

/* ---- Built-in demo catalog (fallback when not configured) -- */
const DEFAULT_PRODUCTS = [
  { id:"bpc157",  name:"BPC-157 10mg",     cat:"peptides", price:69.99, coa:true,  hue:195 },
  { id:"tb500",   name:"TB-500 5mg",       cat:"peptides", price:59.99, coa:false, hue:205 },
  { id:"ghkcu",   name:"GHK-Cu 50mg",      cat:"peptides", price:49.99, coa:true,  hue:170 },
  { id:"motsc",   name:"MOTS-C 10mg",      cat:"peptides", price:55.99, coa:true,  hue:188 },
  { id:"sema",    name:"Semaglutide 10mg", cat:"peptides", price:64.99, coa:true,  hue:210 },
  { id:"tirz",    name:"Tirzepatide 10mg", cat:"peptides", price:89.99, coa:true,  hue:218 },
  { id:"glp3rt",  name:"GLP3-RT 10mg",     cat:"peptides", price:99.99, coa:true,  hue:225 },
  { id:"selank",  name:"Selank 10mg",      cat:"peptides", price:44.99, coa:true,  hue:160 },
  { id:"semax",   name:"Semax 10mg",       cat:"peptides", price:46.99, coa:true,  hue:150 },
  { id:"nad",     name:"NAD+ 500mg",       cat:"peptides", price:84.99, coa:true,  hue:260 },
  { id:"tesa",    name:"Tesamorelin 10mg", cat:"peptides", price:74.99, coa:true,  hue:200 },
  { id:"kiss",    name:"Kisspeptin-10 10mg",cat:"peptides",price:52.99, coa:true,  hue:300 },
  { id:"ss31",    name:"SS-31 10mg",       cat:"peptides", price:69.99, coa:false, hue:280 },
  { id:"ipa",     name:"Ipamorelin 5mg",   cat:"peptides", price:39.99, coa:true,  hue:185 },
  { id:"cjc",     name:"CJC-1295 5mg",     cat:"peptides", price:54.99, coa:true,  hue:230 },
  { id:"epi",     name:"Epithalon 10mg",   cat:"peptides", price:47.99, coa:true,  hue:245 },
  { id:"wolverine",name:"Wolverine 20mg (BPC + TB500)", cat:"blends", price:149.99, coa:false, hue:198 },
  { id:"glow",    name:"GLOW 70mg Blend",  cat:"blends",   price:129.99, coa:true,  hue:165 },
  { id:"klow",    name:"KLOW 80mg Blend",  cat:"blends",   price:139.99, coa:true,  hue:175 },
  { id:"bac30",   name:"Bacteriostatic Water 30ml", cat:"bac", price:14.99, coa:null, hue:200 },
  { id:"bac10x3", name:"Bacteriostatic Water 10ml (3-pack)", cat:"bac", price:24.99, coa:null, hue:200 },
];
const DEFAULT_PAYMENT = {
  title: "Payment",
  instructions: "After you place your order, the store owner will contact you with payment details for your order reference."
};

/* ---- State ------------------------------------------------ */
let PRODUCTS = DEFAULT_PRODUCTS.slice();
let PAYMENT  = null;
let USING_FIRESTORE = false;
let fb = null; // { db, addDoc, collection, serverTimestamp }

const CAT_LABEL = { peptides:"Peptides", blends:"Blends", bac:"BAC Water" };
const money = n => "$" + (Number(n)||0).toFixed(2);
const byId  = id => PRODUCTS.find(p => p.id === id);
const esc   = s => String(s==null?"":s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hueFor = s => { let h=0; for(const ch of String(s)) h=(h*31+ch.charCodeAt(0))%360; return h; };
const configured = () => firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("PASTE");

/* ---- Firestore: load products + payment ------------------- */
async function initStore(){
  if(!configured()){
    console.info("[Helix] Firebase not configured — using demo catalog. Paste your config in app.js.");
    return;
  }
  try{
    const { initializeApp } = await import(`https://www.gstatic.com/firebasejs/${FB_VERSION}/firebase-app.js`);
    const fs = await import(`https://www.gstatic.com/firebasejs/${FB_VERSION}/firebase-firestore.js`);
    const app = initializeApp(firebaseConfig);
    const db  = fs.getFirestore(app);
    fb = { db, addDoc: fs.addDoc, collection: fs.collection, serverTimestamp: fs.serverTimestamp };

    // products
    const snap = await fs.getDocs(fs.collection(db, "products"));
    const items = [];
    snap.forEach(d => {
      const v = d.data() || {};
      if(v.active === false) return;
      items.push({
        id: d.id,
        name: v.name || "Unnamed",
        price: Number(v.price) || 0,
        cat: ["peptides","blends","bac"].includes(v.cat) ? v.cat : "peptides",
        coa: v.coa === true ? true : v.coa === false ? false : null,
        image: v.image || null,
        hue: Number.isFinite(v.hue) ? v.hue : hueFor(v.name || d.id),
        created: v.createdAt && v.createdAt.seconds ? v.createdAt.seconds : 0,
      });
    });
    items.sort((a,b) => b.created - a.created);
    PRODUCTS = items;
    USING_FIRESTORE = true;

    // payment settings
    try{
      const pay = await fs.getDoc(fs.doc(db, "settings", "payment"));
      if(pay.exists()) PAYMENT = pay.data();
    }catch(e){ console.warn("[Helix] payment settings read failed", e); }

    // re-render with live data
    renderCatalog();
    paintCounts();
  }catch(err){
    console.warn("[Helix] Firebase load failed — using demo catalog.", err);
  }
}

/* ---- Vial illustration (fallback when no photo) ----------- */
function vialSVG(hue, bac=false){
  const top=`hsl(${hue} 90% 72%)`, bot=`hsl(${hue} 85% 52%)`, op=bac?0.35:0.85;
  return `<svg viewBox="0 0 120 220" class="card__vial" aria-hidden="true">
    <rect x="40" y="6" width="40" height="14" rx="3" fill="#9fb4cf"/>
    <rect x="45" y="17" width="30" height="8" rx="2" fill="#6d84a3"/>
    <path d="M36 30h48v152a20 20 0 0 1-20 20H56a20 20 0 0 1-20-20V30Z" fill="rgba(13,32,51,.6)" stroke="#2a4a6b" stroke-width="2"/>
    <path d="M40 108h40v74a16 16 0 0 1-16 16H56a16 16 0 0 1-16-16V108Z" fill="url(#g${hue})" opacity="${op}"/>
    <rect x="46" y="44" width="28" height="46" rx="5" fill="#fff" opacity="0.06"/>
    <defs><linearGradient id="g${hue}" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bot}"/>
    </linearGradient></defs></svg>`;
}

/* ---- Render catalog --------------------------------------- */
const grid = document.getElementById("product-grid");
function renderCatalog(){
  if(USING_FIRESTORE && PRODUCTS.length === 0){
    grid.innerHTML = `<div class="grid-empty"><p>No products yet.</p><p class="small">Add your first product from the Telegram admin bot.</p></div>`;
    return;
  }
  grid.innerHTML = PRODUCTS.map(p => {
    const badge = p.coa === true ? `<span class="card__badge">COA</span>`
      : p.coa === false ? `<span class="card__badge pending">COA PENDING</span>` : ``;
    const meta = p.coa === true ? "Third-party tested · COA"
      : p.coa === false ? "COA pending publication" : "Research reconstitution solvent";
    const coaBtn = p.coa === true ? `<button class="card__coa" data-coa="${esc(p.id)}" title="Download COA">COA ↓</button>` : ``;
    const media = p.image
      ? `<img class="card__img" src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.remove()">`
      : vialSVG(p.hue, p.cat === "bac");
    return `<article class="card" data-cat="${esc(p.cat)}">
      <div class="card__media">${badge}${media}</div>
      <div class="card__body">
        <span class="card__cat">${esc(CAT_LABEL[p.cat] || p.cat)}</span>
        <h3 class="card__name">${esc(p.name)}</h3>
        <span class="card__meta">${meta}</span>
        <span class="card__price">${money(p.price)}</span>
        <div class="card__actions">
          <button class="btn btn--primary btn--sm card__add" data-add="${esc(p.id)}">Add to cart</button>
          ${coaBtn}
        </div>
      </div>
    </article>`;
  }).join("");
  // keep current filter applied
  const active = document.querySelector(".filter.is-active");
  if(active) applyFilter(active.dataset.filter);
}

function paintCounts(){
  ["peptides","blends","bac"].forEach(c=>{
    const n = PRODUCTS.filter(p=>p.cat===c).length;
    document.querySelectorAll(`[data-count="${c}"]`).forEach(el=>el.textContent=n);
  });
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  set("stat-total", PRODUCTS.length);
  set("stat-coa", PRODUCTS.filter(p=>p.coa===true).length);
  set("stat-verified", PRODUCTS.filter(p=>p.coa!==null).length);
}

/* ---- Filters ---------------------------------------------- */
function initFilters(){
  const filters = document.getElementById("filters");
  filters.addEventListener("click", e=>{
    const btn=e.target.closest(".filter"); if(!btn) return;
    filters.querySelectorAll(".filter").forEach(f=>f.classList.remove("is-active"));
    btn.classList.add("is-active"); applyFilter(btn.dataset.filter);
  });
  document.querySelectorAll(".cat").forEach(cat=>{
    cat.addEventListener("click", ()=>{
      const c=cat.dataset.cat, fbtn=filters.querySelector(`[data-filter="${c}"]`);
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
function loadCart(){ try{ return JSON.parse(localStorage.getItem(CART_KEY))||{}; }catch(e){ return {}; } }
function saveCart(){ try{ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }catch(e){} }

function addToCart(id){ cart[id]=(cart[id]||0)+1; saveCart(); renderCart(); const p=byId(id); toast(`Added ${p?p.name:"item"} to cart`); }
function setQty(id,q){ if(q<=0) delete cart[id]; else cart[id]=q; saveCart(); renderCart(); }
function cartCount(){ return Object.values(cart).reduce((a,b)=>a+b,0); }
function cartSubtotal(){ return Object.entries(cart).reduce((s,[id,q])=>{ const p=byId(id); return s+(p?p.price*q:0); },0); }
function cartLines(){ return Object.entries(cart).map(([id,q])=>({p:byId(id),q})).filter(x=>x.p); }

function renderCart(){
  const count=cartCount();
  const badge=document.getElementById("cart-count");
  badge.textContent=count; badge.hidden=count===0;
  document.getElementById("drawer-count").textContent=count;
  const body=document.getElementById("drawer-body"), foot=document.getElementById("drawer-foot");
  const entries=cartLines();
  if(!entries.length){
    body.innerHTML=`<div class="drawer__empty">
      <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.2 12.3a1.6 1.6 0 0 0 1.6 1.3h8.5a1.6 1.6 0 0 0 1.6-1.3L21.5 7H6.2"/></svg>
      <p>Your cart is empty.</p><p class="small">Add research compounds to get started.</p></div>`;
    foot.style.display="none"; return;
  }
  foot.style.display="block";
  body.innerHTML=entries.map(({p,q})=>`<div class="line">
    <div class="line__media">${p.image?`<img class="card__img" src="${esc(p.image)}" alt="" onerror="this.remove()">`:vialSVG(p.hue,p.cat==="bac")}</div>
    <div class="line__info">
      <div class="line__name">${esc(p.name)}</div>
      <div class="line__price">${money(p.price)} each</div>
      <div class="line__ctl">
        <div class="qty"><button data-dec="${esc(p.id)}" aria-label="Decrease">−</button><span>${q}</span><button data-inc="${esc(p.id)}" aria-label="Increase">+</button></div>
        <button class="line__rm" data-rm="${esc(p.id)}">Remove</button>
      </div>
    </div></div>`).join("");
  document.getElementById("cart-subtotal").textContent=money(cartSubtotal());
}

/* ---- Drawer ----------------------------------------------- */
const drawer=document.getElementById("drawer"), overlay=document.getElementById("drawer-overlay");
function openDrawer(){ drawer.classList.add("open"); drawer.setAttribute("aria-hidden","false"); overlay.hidden=false; document.body.classList.add("drawer-open"); }
function closeDrawer(){ drawer.classList.remove("open"); drawer.setAttribute("aria-hidden","true"); overlay.hidden=true; document.body.classList.remove("drawer-open"); }

/* ---- Checkout --------------------------------------------- */
const coModal=document.getElementById("checkout-modal");
function openCheckout(){
  if(!cartLines().length) return;
  closeDrawer();
  document.getElementById("checkout-step-form").hidden=false;
  document.getElementById("checkout-step-done").hidden=true;
  renderCheckoutSummary();
  coModal.hidden=false; document.body.classList.add("drawer-open");
}
function closeCheckout(){ coModal.hidden=true; document.body.classList.remove("drawer-open"); }
function renderCheckoutSummary(){
  const rows=cartLines().map(({p,q})=>`<div class="checkout-summary__row"><span>${q} × ${esc(p.name)}</span><span>${money(p.price*q)}</span></div>`).join("");
  const sub=cartSubtotal();
  const ship=sub>=FREE_SHIP_OVER?"FREE":"Calculated after order";
  document.getElementById("checkout-summary").innerHTML=
    rows+
    `<div class="checkout-summary__row"><span>Shipping</span><span>${ship}</span></div>`+
    `<div class="checkout-summary__total"><span>Total</span><span>${money(sub)}</span></div>`;
}
function orderRef(){ return "HX-"+Math.random().toString(36).slice(2,6).toUpperCase()+Date.now().toString(36).slice(-2).toUpperCase(); }

async function placeOrder(){
  const name=document.getElementById("co-name").value.trim();
  const contact=document.getElementById("co-contact").value.trim();
  const note=document.getElementById("co-note").value.trim();
  if(!name){ toast("Please enter your name"); return; }
  if(!contact){ toast("Add an email or Telegram handle so we can reach you"); return; }

  const btn=document.getElementById("place-order-btn");
  btn.disabled=true; btn.textContent="Placing…";

  const ref=orderRef();
  const lines=cartLines().map(({p,q})=>({ id:p.id, name:p.name, price:p.price, qty:q }));
  const order={ ref, items:lines, subtotal:Number(cartSubtotal().toFixed(2)), customer:{name,contact,note}, status:"pending" };

  try{
    if(USING_FIRESTORE && fb){
      await fb.addDoc(fb.collection(fb.db,"orders"), { ...order, createdAt: fb.serverTimestamp() });
    }
  }catch(err){
    console.warn("[Helix] order save failed", err);
    toast("Could not reach the store — try again");
    btn.disabled=false; btn.textContent="Place order"; return;
  }

  // success
  const pay = PAYMENT || DEFAULT_PAYMENT;
  document.getElementById("order-ref").textContent=ref;
  document.getElementById("pay-instructions").textContent=
    (pay.title?pay.title+"\n":"") + (pay.instructions||DEFAULT_PAYMENT.instructions);
  document.getElementById("done-contact").textContent=`We'll reach you at ${contact}.`;
  document.getElementById("checkout-step-form").hidden=true;
  document.getElementById("checkout-step-done").hidden=false;
  cart={}; saveCart(); renderCart();
  btn.disabled=false; btn.textContent="Place order";
}

/* ---- Researcher gate -------------------------------------- */
const GATE_KEY="helix_verified_v1";
function initGate(){
  const gate=document.getElementById("gate");
  let v=false; try{ v=localStorage.getItem(GATE_KEY)==="1"; }catch(e){}
  if(v) return;
  gate.hidden=false; document.body.classList.add("gate-open");
  const age=document.getElementById("gate-age"), res=document.getElementById("gate-research"), enter=document.getElementById("gate-enter");
  const check=()=>{ enter.disabled=!(age.checked&&res.checked); };
  age.addEventListener("change",check); res.addEventListener("change",check);
  enter.addEventListener("click",()=>{ try{localStorage.setItem(GATE_KEY,"1");}catch(e){} gate.hidden=true; document.body.classList.remove("gate-open"); });
}

/* ---- Toast ------------------------------------------------ */
let toastTimer;
function toast(msg){
  const t=document.getElementById("toast");
  t.innerHTML=`<span class="tick">✓</span> ${esc(msg)}`;
  t.classList.add("show"); clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.classList.remove("show"),2400);
}

/* ---- Mobile nav ------------------------------------------- */
function initNav(){
  const toggle=document.getElementById("nav-toggle"), nav=document.getElementById("nav");
  let backdrop;
  const close=()=>{ nav.classList.remove("open"); toggle.setAttribute("aria-expanded","false"); if(backdrop){backdrop.remove();backdrop=null;} };
  toggle.addEventListener("click",()=>{
    const open=nav.classList.toggle("open"); toggle.setAttribute("aria-expanded",open);
    if(open){ backdrop=document.createElement("div"); backdrop.className="nav-backdrop"; backdrop.addEventListener("click",close); document.body.appendChild(backdrop); } else close();
  });
  nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",close));
}

/* ---- Global listeners ------------------------------------- */
document.addEventListener("click", e=>{
  const add=e.target.closest("[data-add]"); if(add){ addToCart(add.dataset.add); return; }
  const inc=e.target.closest("[data-inc]"); if(inc){ setQty(inc.dataset.inc,(cart[inc.dataset.inc]||0)+1); return; }
  const dec=e.target.closest("[data-dec]"); if(dec){ setQty(dec.dataset.dec,(cart[dec.dataset.dec]||0)-1); return; }
  const rm=e.target.closest("[data-rm]"); if(rm){ setQty(rm.dataset.rm,0); return; }
  const coa=e.target.closest("[data-coa]"); if(coa){ const p=byId(coa.dataset.coa); toast(`COA for ${p?p.name:"product"} — connect your COA library`); return; }
  if(e.target.closest("[data-close-checkout]")){ closeCheckout(); return; }
});

document.getElementById("cart-open").addEventListener("click", openDrawer);
document.getElementById("cart-close").addEventListener("click", closeDrawer);
overlay.addEventListener("click", closeDrawer);
document.getElementById("checkout-btn").addEventListener("click", openCheckout);
document.getElementById("place-order-btn").addEventListener("click", placeOrder);
document.addEventListener("keydown", e=>{ if(e.key==="Escape"){ closeDrawer(); closeCheckout(); } });

document.getElementById("news-form").addEventListener("submit", e=>{
  e.preventDefault();
  const email=document.getElementById("news-email");
  if(!email.value||!email.value.includes("@")){ toast("Enter a valid email"); return; }
  email.value=""; toast("Subscribed — welcome to the lab list");
});

const header=document.getElementById("header");
addEventListener("scroll",()=>{ header.classList.toggle("scrolled", scrollY>20); }, {passive:true});
document.getElementById("year").textContent=new Date().getFullYear();

/* ---- Init ------------------------------------------------- */
renderCatalog();
paintCounts();
initFilters();
initNav();
renderCart();
initGate();
initStore();   // async: swaps in live Firestore data when configured
