/* Pelletbaits Theme JS */

(function () {
  'use strict';

  /* --- Scroll header --- */
  var siteHeader = document.querySelector('.site-header');
  if (siteHeader) {
    window.addEventListener('scroll', function () {
      siteHeader.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  /* --- Mobile nav --- */
  var mobileNav   = document.getElementById('mobile-nav');
  var mobileOpen  = document.getElementById('mobile-nav-open');
  var mobileClose = document.getElementById('mobile-nav-close');

  function openMobileNav() {
    if (!mobileNav) return;
    mobileNav.classList.add('is-open');
    mobileNav.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeMobileNav() {
    if (!mobileNav) return;
    mobileNav.classList.remove('is-open');
    mobileNav.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (mobileOpen)  mobileOpen.addEventListener('click', openMobileNav);
  if (mobileClose) mobileClose.addEventListener('click', closeMobileNav);

  /* --- Cart drawer --- */
  var cartDrawer  = document.getElementById('cart-drawer');
  var cartOverlay = document.getElementById('cart-overlay');
  var cartClose   = document.getElementById('cart-drawer-close');
  var cartItemsEl = document.getElementById('cart-drawer-items');

  var waBtn = document.querySelector('.wa-btn');

  function openCartDrawer() {
    if (!cartDrawer) return;
    cartDrawer.classList.add('open');
    cartDrawer.setAttribute('aria-hidden', 'false');
    if (cartOverlay) cartOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (waBtn) waBtn.style.display = 'none';
    fetchCartItems();
  }
  function closeCartDrawer() {
    if (!cartDrawer) return;
    cartDrawer.classList.remove('open');
    cartDrawer.setAttribute('aria-hidden', 'true');
    if (cartOverlay) cartOverlay.classList.remove('open');
    document.body.style.overflow = '';
    if (waBtn) waBtn.style.display = '';
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-cart-open]')) {
      e.preventDefault();
      openCartDrawer();
    }
  });
  if (cartClose)   cartClose.addEventListener('click', closeCartDrawer);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCartDrawer);

  function fetchCartItems() {
    if (!cartItemsEl) return;
    fetch('/cart.js')
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        updateCartBadges(cart.item_count);
        updateSubtotal(cart.total_price);
        if (cart.item_count === 0) {
          cartItemsEl.innerHTML = '<p class="cart-empty">Je winkelwagen is leeg.</p>';
          return;
        }
        cartItemsEl.innerHTML = cart.items.map(function (item) {
          var price = '&euro;' + (item.final_price / 100).toFixed(2).replace('.', ',');
          return '<div class="cart-item">' +
            '<div class="cart-item-thumb">' + (item.image ? '<img src="' + item.image + '" alt="' + item.title + '">' : '') + '</div>' +
            '<div><p class="cart-item-type">' + (item.product_type || '') + '</p>' +
            '<p class="cart-item-name">' + item.product_title + '</p>' +
            '<p class="cart-item-qty">&times; ' + item.quantity + '</p></div>' +
            '<p class="cart-item-price">' + price + '</p>' +
            '</div>';
        }).join('');
      })
      .catch(function () {});
  }

  function updateCartBadges(count) {
    document.querySelectorAll('.cart-count').forEach(function (el) {
      el.textContent = count;
      el.style.display = count > 0 ? 'inline' : 'none';
    });
  }

  function updateSubtotal(totalPrice) {
    var el = document.getElementById('cart-subtotal-value');
    if (el) el.textContent = '&euro;' + (totalPrice / 100).toFixed(2).replace('.', ',');
  }

  function updateCartCount() {
    fetch('/cart.js')
      .then(function (r) { return r.json(); })
      .then(function (cart) { updateCartBadges(cart.item_count); })
      .catch(function () {});
  }

  /* --- Category interactive list --- */
  function initCategoryList() {
    var catItems = document.querySelectorAll('.cat-item');
    if (!catItems.length) return;
    catItems.forEach(function (item) {
      item.addEventListener('mouseenter', function () {
        catItems.forEach(function (i) { i.classList.remove('active'); });
        item.classList.add('active');
        var id = item.dataset.cat;
        document.querySelectorAll('.cat-image-wrap img').forEach(function (img) {
          img.classList.toggle('active', img.dataset.cat === id);
        });
        var labelEl = document.querySelector('.cat-image-label-name');
        if (labelEl) {
          var nameEl = item.querySelector('.cat-item-name');
          if (nameEl) labelEl.textContent = nameEl.textContent.trim();
        }
      });
    });
  }

  /* --- Variant selector --- */
  function initVariantSelectors() {
    var form = document.querySelector('form[action="/cart/add"]');
    if (!form) return;
    var pills = form.querySelectorAll('.variant-pill');
    var priceEl = document.querySelector('.product-price');
    var productData = window.PELLETBAITS_PRODUCT;

    pills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        var group = pill.dataset.group;
        form.querySelectorAll('.variant-pill[data-group="' + group + '"]').forEach(function (p) {
          p.classList.remove('active');
        });
        pill.classList.add('active');
        if (!productData || !priceEl) return;
        var selectedSize   = form.querySelector('.variant-pill[data-group="size"].active');
        var selectedWeight = form.querySelector('.variant-pill[data-group="weight"].active');
        var sizeVal   = selectedSize   ? selectedSize.dataset.value   : null;
        var weightVal = selectedWeight ? selectedWeight.dataset.value : null;
        var variant = productData.variants.find(function (v) {
          var opts = [v.option1, v.option2, v.option3];
          if (sizeVal   && !opts.includes(sizeVal))   return false;
          if (weightVal && !opts.includes(weightVal)) return false;
          return true;
        });
        if (variant) {
          var input = form.querySelector('input[name="id"]');
          if (input) input.value = variant.id;
          var price = (variant.price / 100).toFixed(2).replace('.', ',');
          priceEl.innerHTML = '&euro;' + price;
          window.history.replaceState({}, '', '?variant=' + variant.id);
        }
      });
    });
  }

  /* --- Quantity control --- */
  function initQtyControls() {
    document.querySelectorAll('.qty-control').forEach(function (ctrl) {
      var input = ctrl.querySelector('.qty-input');
      var minus = ctrl.querySelector('[data-qty="minus"]');
      var plus  = ctrl.querySelector('[data-qty="plus"]');
      if (minus) minus.addEventListener('click', function () {
        var val = parseInt(input.value, 10);
        if (val > 1) input.value = val - 1;
      });
      if (plus) plus.addEventListener('click', function () {
        input.value = parseInt(input.value, 10) + 1;
      });
    });
  }

  /* --- Product tabs --- */
  function initTabs() {
    var tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.dataset.tab;
        tabBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        document.querySelectorAll('.tab-panel').forEach(function (p) {
          p.classList.toggle('active', p.id === target);
        });
      });
    });
  }

  /* --- Filter pills --- */
  function initFilterPills() {
    document.querySelectorAll('.filter-size-pill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        var group = pill.closest('.filter-group');
        group.querySelectorAll('.filter-size-pill').forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');
      });
    });
  }

  /* --- Add to cart (AJAX) --- */
  function initATC() {
    var form = document.querySelector('form[action="/cart/add"]');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('.btn-atc');
      var variantId = form.querySelector('input[name="id"]');
      var qty = form.querySelector('.qty-input');
      if (!variantId || !variantId.value) return;
      btn.textContent = 'Wordt toegevoegd…';
      btn.setAttribute('disabled', 'disabled');
      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: variantId.value, quantity: qty ? parseInt(qty.value, 10) : 1 })
      })
        .then(function (r) { return r.json(); })
        .then(function () {
          btn.textContent = 'Toegevoegd!';
          updateCartCount();
          setTimeout(function () {
            btn.textContent = 'Toevoegen aan winkelwagen';
            btn.removeAttribute('disabled');
          }, 2000);
        })
        .catch(function () {
          btn.textContent = 'Probeer opnieuw';
          btn.removeAttribute('disabled');
        });
    });
  }

  /* --- Escape key --- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeMobileNav(); closeCartDrawer(); }
  });

  /* --- Theme toggle --- */
  function initThemeToggle() {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var html = document.documentElement;
      var isLight = html.getAttribute('data-theme') === 'light';
      html.classList.add('theme-transition');
      setTimeout(function () { html.classList.remove('theme-transition'); }, 320);
      if (isLight) {
        html.removeAttribute('data-theme');
        localStorage.removeItem('pb-theme');
      } else {
        html.setAttribute('data-theme', 'light');
        localStorage.setItem('pb-theme', 'light');
      }
    });
  }

  /* --- Scroll-in animations --- */
  function initAnimations() {
    var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var els = document.querySelectorAll('[data-anim]');

    if (prefersReduced || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('anim-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = el.dataset.animDelay;
        if (delay) el.style.transitionDelay = delay + 'ms';
        el.classList.add('anim-visible');
        observer.unobserve(el);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });

    els.forEach(function (el) { observer.observe(el); });
  }

  /* --- Init --- */
  document.addEventListener('DOMContentLoaded', function () {
    initCategoryList();
    initVariantSelectors();
    initQtyControls();
    initTabs();
    initFilterPills();
    initATC();
    updateCartCount();
    initThemeToggle();
    initAnimations();
  });
})();
