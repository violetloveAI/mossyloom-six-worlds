(() => {
  'use strict';
  const products = window.MOSSY_PRODUCTS || [];
  const byId = new Map(products.map(p => [p.id, p]));
  const key = 'mossyloom-six-worlds-saved-v1';
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = name => `<svg class="ml-icon" viewBox="0 0 24 24" aria-hidden="true">${name === 'heart' ? '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>' : '<path d="m6 6 12 12M18 6 6 18"/>'}</svg>`;
  let saved;
  try { const data = JSON.parse(localStorage.getItem(key) || '[]'); saved = new Set(Array.isArray(data) ? data.filter(id => byId.has(id)) : []); } catch { saved = new Set(); }
  let currentProduct = null;
  let toastTimer;
  const toast = document.createElement('div'); toast.className = 'ml-toast'; toast.setAttribute('role','status'); toast.setAttribute('aria-live','polite'); document.body.append(toast);
  function announce(message) { toast.textContent = message; toast.dataset.show = 'true'; clearTimeout(toastTimer); toastTimer = setTimeout(() => delete toast.dataset.show, 2300); }
  function card(p) {
    return `<article class="product-card"><button class="product-image" data-product="${p.id}" aria-label="View ${esc(p.name)}"><img src="${p.image}" alt="${esc(p.name)}" loading="lazy" width="600" height="750"></button><button class="product-save" data-save="${p.id}" aria-pressed="${saved.has(p.id)}" aria-label="${saved.has(p.id) ? 'Unsave' : 'Save'} ${esc(p.name)}">${icon('heart')}</button><div class="product-meta"><button class="product-name" data-product="${p.id}">${esc(p.name)}</button><span class="product-price">$${p.price}</span></div><p class="product-category">${esc(p.category)}</p></article>`;
  }
  const grids = [...document.querySelectorAll('[data-product-grid]')];
  function renderGrid(grid, category = 'all') {
    const ids = grid.dataset.productGrid.split(',').map(s => s.trim());
    const base = ids.includes('all') ? products : ids.map(id => byId.get(id)).filter(Boolean);
    const source = category === 'all' ? base : products.filter(p => p.category === category);
    const limit = Number(grid.dataset.limit) || source.length;
    grid.innerHTML = source.slice(0,limit).map(card).join('') || '<p class="ml-empty">No pieces in this edit yet.</p>';
  }
  grids.forEach(g => renderGrid(g));
  function createDialog(id, title) {
    const d = document.createElement('dialog'); d.id = id; d.className = 'ml-dialog'; d.setAttribute('aria-labelledby',`${id}-title`);
    d.innerHTML = `<div class="ml-dialog-bar"><h2 id="${id}-title">${title}</h2><button class="ml-dialog-close" data-close-modal aria-label="Close">${icon('close')}</button></div><div class="ml-dialog-content"></div>`;
    d.addEventListener('click', e => { if (e.target === d) { const r=d.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) d.close(); } });
    document.body.append(d); return d;
  }
  const productDialog = createDialog('ml-product-dialog','A closer look');
  const searchDialog = createDialog('ml-search-dialog','Find your next favourite');
  const savedDialog = createDialog('ml-saved-dialog','Your saved pieces');
  function openDialog(d) { [productDialog,searchDialog,savedDialog].forEach(other => {if(other.open) other.close();}); d.showModal(); }
  function showProduct(id) {
    const p = byId.get(id); if(!p) return;
    currentProduct = id;
    productDialog.querySelector('.ml-dialog-content').innerHTML = `<div class="ml-product-detail"><div><img class="ml-detail-main" src="${p.image}" alt="${esc(p.name)}"><div class="ml-detail-thumbs">${p.images.map((im,i)=>`<button data-gallery="${i}" aria-label="View product photograph ${i+1}" aria-pressed="${i===0}"><img src="${im}" alt="${esc(p.name)}, photograph ${i+1}"></button>`).join('')}</div></div><div class="ml-detail-copy"><span class="ml-detail-category">${esc(p.category)} / Mossyloom</span><h3>${esc(p.name)}</h3><div class="ml-detail-price">$${p.price} <small>USD</small></div><p>${esc(p.description)}</p><button class="ml-save-main" data-save="${p.id}" aria-pressed="${saved.has(p.id)}">${saved.has(p.id) ? 'Saved to your favourites' : 'Save this piece'} ${icon('heart')}</button><p class="ml-demo-note">Design preview · Initial prices shown. Product photographs are references; final colours and availability are to be confirmed. No orders are placed here.</p></div></div>`;
    openDialog(productDialog);
  }
  function renderSaved() { savedDialog.querySelector('.ml-dialog-content').innerHTML=`<div class="ml-saved-results">${saved.size ? [...saved].map(id=>card(byId.get(id))).join('') : '<p class="ml-empty">A little space for your favourites.<br>Tap a heart to save a piece.</p>'}</div>`; }
  function updateSavedButtons() {
    document.querySelectorAll('[data-save]').forEach(b => { const on=saved.has(b.dataset.save); b.setAttribute('aria-pressed',on); const p=byId.get(b.dataset.save); if(b.classList.contains('ml-save-main')) b.innerHTML=`${on?'Saved to your favourites':'Save this piece'} ${icon('heart')}`; else if(p) b.setAttribute('aria-label',`${on?'Unsave':'Save'} ${p.name}`); });
    document.querySelectorAll('[data-saved-count]').forEach(b=>b.textContent=saved.size);
  }
  function toggleSaved(id) { if(!byId.has(id)) return; const was=saved.has(id); was?saved.delete(id):saved.add(id); try {localStorage.setItem(key,JSON.stringify([...saved]));}catch{} updateSavedButtons(); if(savedDialog.open)renderSaved(); announce(was?'Removed from your saved pieces':'Saved for a little later'); }
  function showSearch() {
    searchDialog.querySelector('.ml-dialog-content').innerHTML='<div class="ml-search-form"><label for="ml-search-input">Search scarves, hats, gloves or colours</label><input id="ml-search-input" type="search" placeholder="Try blue, scarf or beanie…" autocomplete="off"></div><div class="ml-result-count" aria-live="polite"></div><div class="ml-search-results"></div>';
    const input=searchDialog.querySelector('input');
    function results(){const q=input.value.trim().toLowerCase(); const list=products.filter(p=>[p.name,p.nameZh,p.category,...p.colors].join(' ').toLowerCase().includes(q)); searchDialog.querySelector('.ml-result-count').textContent=`${list.length} pieces`; searchDialog.querySelector('.ml-search-results').innerHTML=list.map(card).join('') || '<p class="ml-empty">No pieces found. Try another colour or category.</p>';}
    input.addEventListener('input',results);results();openDialog(searchDialog);input.focus();
  }
  function applyFilter(category,targetId) {
    const targets=targetId?[document.getElementById(targetId)].filter(Boolean):grids;
    targets.forEach(g=>renderGrid(g,category));
    document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.filter===category));
    document.querySelectorAll('[data-active-category]').forEach(el=>el.textContent=category==='all'?'All pieces':category);
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('button,a');if(!b)return;
    if(b.tagName==='A' && b.closest('#mobile-nav')){b.closest('#mobile-nav').hidden=true;document.querySelector('[data-menu-toggle]')?.setAttribute('aria-expanded','false');}
    if(b.hasAttribute('data-product'))showProduct(b.dataset.product);
    else if(b.hasAttribute('data-save'))toggleSaved(b.dataset.save);
    else if(b.hasAttribute('data-search'))showSearch();
    else if(b.hasAttribute('data-saved')){renderSaved();openDialog(savedDialog);}
    else if(b.hasAttribute('data-close-modal'))b.closest('dialog')?.close();
    else if(b.hasAttribute('data-gallery')){const p=byId.get(currentProduct);if(!p)return;const i=Number(b.dataset.gallery);productDialog.querySelector('.ml-detail-main').src=p.images[i];productDialog.querySelectorAll('[data-gallery]').forEach(el=>el.setAttribute('aria-pressed',el===b));}
    else if(b.hasAttribute('data-filter'))applyFilter(b.dataset.filter,b.dataset.filterId);
    else if(b.hasAttribute('data-collection')){applyFilter(b.dataset.collection); const nav=document.getElementById('mobile-nav');if(nav)nav.hidden=true;document.querySelector('[data-menu-toggle]')?.setAttribute('aria-expanded','false');}
    else if(b.hasAttribute('data-menu-toggle')){const nav=document.getElementById(b.getAttribute('aria-controls')||'mobile-nav');if(nav){nav.hidden=!nav.hidden;b.setAttribute('aria-expanded',!nav.hidden);}}
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){const active=document.querySelector('.ml-dialog[open]');if(active){e.preventDefault();active.close();}const nav=document.getElementById('mobile-nav');if(nav)nav.hidden=true;document.querySelector('[data-menu-toggle]')?.setAttribute('aria-expanded','false');const links=document.getElementById('ml-concept-links');if(links)links.hidden=true;document.querySelector('.ml-switcher-toggle')?.setAttribute('aria-expanded','false');}},true);
  const concept=document.body.dataset.concept;
  const names={a:'城市漫游插画',b:'明亮都市大片',c:'色彩配饰商店',d:'女孩的穿搭手帐',e:'针织奇想世界',f:'周末公寓衣橱'};
  if(concept){const sw=document.createElement('aside');sw.className='ml-switcher';sw.setAttribute('aria-label','Demo navigation');sw.innerHTML=`<button class="ml-switcher-toggle" aria-expanded="false" aria-controls="ml-concept-links"><strong>${concept.toUpperCase()}</strong><span>切换方案</span><span aria-hidden="true">⌃</span></button><nav id="ml-concept-links" class="ml-switcher-panel" hidden><a href="../">← 六版总览</a>${Object.entries(names).map(([id,name])=>`<a href="../${id}/" ${id===concept?'aria-current="page"':''}><b>${id.toUpperCase()}</b>${name}</a>`).join('')}</nav>`;document.body.append(sw);const toggle=sw.querySelector('button');toggle.addEventListener('click',()=>{const p=sw.querySelector('nav');p.hidden=!p.hidden;toggle.setAttribute('aria-expanded',!p.hidden);});document.addEventListener('click',e=>{if(!sw.contains(e.target)){sw.querySelector('nav').hidden=true;toggle.setAttribute('aria-expanded','false');}});}
  updateSavedButtons();
})();
