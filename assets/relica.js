/* Relica Theme 2.0 — Main JS (fixed) */
(function () {
  'use strict';

  /* ---- HERO SLIDER ---- */
  const initHero = () => {
    const sliders = document.querySelectorAll('.hero');
    sliders.forEach(hero => {
      const track = hero.querySelector('.hero-slides');
      const slides = hero.querySelectorAll('.hero-slide');
      const nums = hero.querySelectorAll('.hero-num');
      const prevBtn = hero.querySelector('.hero-arr[data-dir="prev"]');
      const nextBtn = hero.querySelector('.hero-arr[data-dir="next"]');
      if (!track || slides.length < 2) return;

      let current = 0;
      let timer;
      // FIX: fall back to reading data-speed from child .hero-slides if .hero has no data-auto-speed
      const autoSpeed = parseInt(hero.dataset.autoSpeed || track.dataset.speed || 5000);

      const go = (idx) => {
        slides[current].classList.remove('active');
        if (nums[current]) nums[current].classList.remove('active');
        current = (idx + slides.length) % slides.length;
        slides[current].classList.add('active');
        if (nums[current]) nums[current].classList.add('active');
        track.style.transform = `translateX(-${current * 100}%)`;
      };

      slides[0].classList.add('active');
      if (nums[0]) nums[0].classList.add('active');

      const startAuto = () => { timer = setInterval(() => go(current + 1), autoSpeed); };
      const stopAuto = () => clearInterval(timer);

      if (prevBtn) prevBtn.addEventListener('click', () => { stopAuto(); go(current - 1); startAuto(); });
      if (nextBtn) nextBtn.addEventListener('click', () => { stopAuto(); go(current + 1); startAuto(); });
      nums.forEach((num, i) => num.addEventListener('click', () => { stopAuto(); go(i); startAuto(); }));
      startAuto();
    });
  };

  /* ---- SERIES TABS ---- */
  const initTabs = () => {
    const tabSets = document.querySelectorAll('.series-tabs');
    tabSets.forEach(tabBar => {
      const tabs = tabBar.querySelectorAll('.series-tab');
      const section = tabBar.closest('.series-section');
      const contents = section ? section.querySelectorAll('.series-content') : [];
      tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          contents.forEach(c => c.classList.remove('active'));
          tab.classList.add('active');
          if (contents[i]) contents[i].classList.add('active');
        });
      });
    });
  };

  /* ---- HELPERS ---- */
  function escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  // FIX: read currency symbol and locale from <html> data attrs injected by theme.liquid
  function formatMoney(cents) {
    const symbol = document.documentElement.dataset.currencySymbol || String.fromCodePoint(0x20B9);
    const locale  = document.documentElement.dataset.currencyLocale  || 'en-IN';
    return symbol + (cents / 100).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /* ---- CART DRAWER ---- */
  const initCartDrawer = () => {
    const drawer = document.getElementById('cart-drawer');
    if (!drawer) return;

    const drawerBody   = drawer.querySelector('.cart-drawer-body');
    const drawerFooter = drawer.querySelector('.cart-drawer-footer');

    const openDrawer = () => {
      refreshDrawer();
      drawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };
    const closeDrawer = () => {
      drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    // FIX: scope to header cart icons only — does NOT catch links inside the drawer
    document.querySelectorAll('header a[href="/cart"], header a[aria-label="Cart"]').forEach(el => {
      el.addEventListener('click', e => { e.preventDefault(); openDrawer(); });
    });

    drawer.querySelector('.cart-drawer-overlay')?.addEventListener('click', closeDrawer);
    drawer.querySelector('.cart-drawer-close')?.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

    // FIX: always fetch fresh cart data before showing drawer
    function refreshDrawer() {
      fetch('/cart.js')
        .then(r => r.json())
        .then(cart => {
          document.querySelectorAll('.cart-count').forEach(el => { el.textContent = cart.item_count; });
          if (!drawerBody) return;

          if (cart.item_count === 0) {
            drawerBody.innerHTML = `
              <div class="cart-drawer-empty">
                <p>Your cart is empty</p>
                <a href="/collections/all" class="btn-primary" style="margin-top:16px;display:inline-block;">Shop Now</a>
              </div>`;
            if (drawerFooter) drawerFooter.style.display = 'none';
          } else {
            drawerBody.innerHTML = cart.items.map(item => `
              <div class="cart-drawer-item">
                ${item.image ? `<img src="${item.image}" alt="${escHtml(item.title)}" class="cart-drawer-img" width="100" height="100">` : ''}
                <div class="cart-drawer-info">
                  <a href="${item.url}" class="cart-drawer-item-title">${escHtml(item.product_title)}</a>
                  ${item.variant_title && item.variant_title !== 'Default Title'
                    ? `<p class="cart-drawer-variant">${escHtml(item.variant_title)}</p>` : ''}
                  <div class="cart-drawer-row">
                    <span class="cart-drawer-price">${formatMoney(item.final_price)}</span>
                    <div class="cart-drawer-qty-ctrl">
                      <button class="cart-drawer-qty-btn" data-key="${item.key}" data-action="decrease" aria-label="Decrease">−</button>
                      <span class="cart-drawer-qty-val">${item.quantity}</span>
                      <button class="cart-drawer-qty-btn" data-key="${item.key}" data-action="increase" aria-label="Increase">+</button>
                    </div>
                    <button class="cart-drawer-remove" data-key="${item.key}" aria-label="Remove ${escHtml(item.title)}">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </div>
              </div>`).join('');

            if (drawerFooter) {
              drawerFooter.style.display = '';
              const subtotalEl = drawerFooter.querySelector('.cart-drawer-subtotal span:last-child');
              if (subtotalEl) subtotalEl.textContent = formatMoney(cart.total_price);
            }

            // Wire qty controls inside freshly rendered drawer
            drawerBody.querySelectorAll('.cart-drawer-qty-btn').forEach(btn => {
              btn.addEventListener('click', async () => {
                const key = btn.dataset.key;
                const qtyEl = btn.parentElement.querySelector('.cart-drawer-qty-val');
                let qty = parseInt(qtyEl.textContent);
                qty = btn.dataset.action === 'increase' ? qty + 1 : Math.max(0, qty - 1);
                await fetch('/cart/change.js', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: key, quantity: qty })
                });
                refreshDrawer();
              });
            });
            drawerBody.querySelectorAll('.cart-drawer-remove').forEach(btn => {
              btn.addEventListener('click', async () => {
                await fetch('/cart/change.js', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: btn.dataset.key, quantity: 0 })
                });
                refreshDrawer();
              });
            });
          }
        })
        .catch(err => console.warn('Relica: cart refresh failed', err));
    }

    // Expose so section-level ATC handlers can open & refresh drawer
    window.relicaOpenDrawer   = openDrawer;
    window.relicaRefreshDrawer = refreshDrawer;
  };

  /* ---- CART PAGE QTY / REMOVE ---- */
  const initCartPage = () => {
    document.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const key = btn.dataset.key;
        const action = btn.dataset.action;
        const qtyEl = btn.parentElement.querySelector('.qty-val');
        let qty = parseInt(qtyEl.textContent);
        qty = action === 'increase' ? qty + 1 : Math.max(0, qty - 1);
        try {
          const res = await fetch('/cart/change.js', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: key, quantity: qty })
          });
          if (res.ok) window.location.reload();
        } catch (e) { console.warn('Cart update failed', e); }
      });
    });

    document.querySelectorAll('.cart-remove').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await fetch('/cart/change.js', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: btn.dataset.key, quantity: 0 })
          });
          window.location.reload();
        } catch (e) { console.warn(e); }
      });
    });
  };

  /* ---- SCROLL ANIMATIONS ---- */
  const initScrollAnim = () => {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const style = document.createElement('style');
    style.textContent = `
      .relic-anim { opacity:0; transform:translateY(24px); transition:opacity .6s ease, transform .6s ease; }
      .relic-anim.visible { opacity:1; transform:translateY(0); }
    `;
    document.head.appendChild(style);

    const targets = document.querySelectorAll(
      '.feature-card, .value-card, .team-card, .product-card, .col-card, .faq-item, .fan-card'
    );
    targets.forEach(el => el.classList.add('relic-anim'));

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    targets.forEach(el => observer.observe(el));
  };

  /* ---- STICKY HEADER SHRINK ---- */
  const initHeaderScroll = () => {
    const header = document.querySelector('header');
    if (!header) return;
    window.addEventListener('scroll', () => {
      header.classList.toggle('header-scrolled', window.scrollY > 60);
    }, { passive: true });
  };

  /* ---- MOBILE NAV ---- */
  const initMobileNav = () => {
    const toggleBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');
    const overlay   = document.getElementById('mobile-nav-overlay');
    if (!toggleBtn || !mobileNav) return;

    const open = () => {
      mobileNav.setAttribute('aria-hidden', 'false');
      mobileNav.classList.add('mobile-nav--open');
      if (overlay) overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      toggleBtn.setAttribute('aria-expanded', 'true');
      toggleBtn.setAttribute('aria-label', 'Close menu');
    };
    const close = () => {
      mobileNav.setAttribute('aria-hidden', 'true');
      mobileNav.classList.remove('mobile-nav--open');
      if (overlay) overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.setAttribute('aria-label', 'Open menu');
    };

    toggleBtn.addEventListener('click', () => {
      mobileNav.classList.contains('mobile-nav--open') ? close() : open();
    });
    if (overlay) overlay.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  };

  /* ---- SEARCH OVERLAY ---- */
  const initSearch = () => {
    const searchLinks = document.querySelectorAll('a[href="/search"], a[aria-label="Search"]');
    if (!searchLinks.length) return;

    const wrapper = document.createElement('div');
    // FIX: only display:none here — JS sets display:'flex' when opening
    wrapper.innerHTML = `
      <div id="search-overlay" style="display:none;position:fixed;inset:0;z-index:999;background:rgba(15,31,51,.97);align-items:center;justify-content:center;flex-direction:column;" aria-hidden="true">
        <button id="search-close" style="position:absolute;top:24px;right:24px;background:none;border:none;color:rgba(255,255,255,.5);cursor:pointer;font-size:24px;" aria-label="Close search">✕</button>
        <form action="/search" style="width:100%;max-width:600px;padding:0 40px;">
          <input name="q" type="search" placeholder="Search products…" autocomplete="off"
            style="width:100%;background:none;border:none;border-bottom:1px solid rgba(255,255,255,.3);color:#fff;font-family:var(--font-display);font-size:clamp(24px,4vw,42px);font-weight:300;padding:12px 0;outline:none;text-align:center;">
        </form>
        <p style="margin-top:24px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.3);">Press Enter to search · Esc to close</p>
      </div>`;
    document.body.appendChild(wrapper);

    const so = document.getElementById('search-overlay');
    const sc = document.getElementById('search-close');
    const si = so ? so.querySelector('input') : null;

    const openSearch  = (e) => { e.preventDefault(); if (!so) return; so.style.display = 'flex'; so.setAttribute('aria-hidden','false'); if (si) setTimeout(() => si.focus(), 100); };
    const closeSearch = ()   => { if (!so) return; so.style.display = 'none'; so.setAttribute('aria-hidden','true'); };

    searchLinks.forEach(el => el.addEventListener('click', openSearch));
    if (sc) sc.addEventListener('click', closeSearch);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSearch(); });
  };

  /* ---- INIT ALL ---- */
  document.addEventListener('DOMContentLoaded', () => {
    initHero();
    initTabs();
    initCartDrawer();
    initCartPage();
    initScrollAnim();
    initHeaderScroll();
    initMobileNav();
    initSearch();
  });
})();
