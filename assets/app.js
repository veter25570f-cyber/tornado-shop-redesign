/* ============================================================
   TORNADO — концепт главной. Ванильный JS, без зависимостей.
   Меню, палитры, корзина, фильтр каталога, плавные якоря.
   ============================================================ */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  function motion() {
    return reduced.matches ? 'auto' : 'smooth';
  }

  function headerOffset() {
    var head = doc.getElementById('site-header');
    return (head ? head.offsetHeight : 68) + 16;
  }

  /* ---------- 1. Плавные якоря ---------- */
  var anchors = Array.prototype.slice.call(doc.querySelectorAll('a[href^="#"]'));

  function scrollToTarget(target) {
    var top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset();
    try {
      window.scrollTo({ top: top, behavior: motion() });
    } catch (error) {
      window.scrollTo(0, top);
    }
  }

  anchors.forEach(function (link) {
    link.addEventListener('click', function (event) {
      var hash = link.getAttribute('href');
      if (!hash || hash === '#') { return; }
      var target = doc.getElementById(hash.slice(1));
      if (!target) { return; }
      event.preventDefault();
      closeMenu();
      scrollToTarget(target);
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', hash);
      }
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }
      target.focus({ preventScroll: true });
    });
  });

  /* ---------- 2. Мобильное меню ---------- */
  var header = doc.getElementById('site-header');
  var burger = doc.getElementById('burger');

  function closeMenu() {
    if (!header || !header.classList.contains('is-open')) { return; }
    header.classList.remove('is-open');
    doc.body.classList.remove('is-locked');
    if (burger) {
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Открыть меню');
    }
  }

  function toggleMenu() {
    if (!header || !burger) { return; }
    var open = !header.classList.contains('is-open');
    header.classList.toggle('is-open', open);
    doc.body.classList.toggle('is-locked', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  }

  if (burger) { burger.addEventListener('click', toggleMenu); }

  /* ---------- 3. Палитры ---------- */
  var STORE_KEY = 'tornado-style';
  var THEMES = { b: 'Сталь', c: 'Графит', a: 'Тёплый цех' };
  var styleSwitch = doc.getElementById('style-switch');
  var styleToggle = doc.getElementById('style-toggle');
  var stylePanel = doc.getElementById('style-panel');
  var styleName = doc.getElementById('style-name');
  var styleOptions = Array.prototype.slice.call(doc.querySelectorAll('[data-theme-option]'));

  function setPanel(open) {
    if (!styleSwitch || !styleToggle || !stylePanel) { return; }
    styleSwitch.classList.toggle('is-open', open);
    styleToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    stylePanel.hidden = !open;
  }

  function applyTheme(value, persist) {
    if (!Object.prototype.hasOwnProperty.call(THEMES, value)) { value = 'b'; }
    root.setAttribute('data-theme', value);
    if (styleName) { styleName.textContent = THEMES[value]; }
    styleOptions.forEach(function (option) {
      var active = option.getAttribute('data-theme-option') === value;
      option.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    if (persist) {
      try { window.localStorage.setItem(STORE_KEY, value); } catch (error) { /* приватный режим */ }
    }
  }

  var savedTheme = null;
  try { savedTheme = window.localStorage.getItem(STORE_KEY); } catch (error) { savedTheme = null; }
  applyTheme(Object.prototype.hasOwnProperty.call(THEMES, savedTheme || '') ? savedTheme : (root.getAttribute('data-theme') || 'b'), false);

  if (styleToggle) {
    styleToggle.addEventListener('click', function () {
      setPanel(styleToggle.getAttribute('aria-expanded') !== 'true');
    });
  }

  styleOptions.forEach(function (option) {
    option.addEventListener('click', function () {
      applyTheme(option.getAttribute('data-theme-option'), true);
      setPanel(false);
      if (styleToggle) { styleToggle.focus(); }
    });
  });

  doc.addEventListener('click', function (event) {
    if (!styleSwitch || stylePanel.hidden) { return; }
    if (!styleSwitch.contains(event.target)) { setPanel(false); }
  });

  /* ---------- 4. Корзина и тост ---------- */
  var cartCount = doc.getElementById('cart-count');
  var cartButton = doc.getElementById('cart-button');
  var toast = doc.getElementById('toast');
  var toastText = doc.getElementById('toast-text');
  var total = 0;
  var toastTimer = null;

  function showToast(message) {
    if (!toast || !toastText) { return; }
    toastText.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 2600);
  }

  function bumpCounter() {
    if (!cartCount) { return; }
    cartCount.classList.remove('is-bump');
    /* принудительный перезапуск анимации */
    void cartCount.offsetWidth;
    cartCount.classList.add('is-bump');
  }

  function updateCart(next) {
    total = next;
    if (cartCount) { cartCount.textContent = String(total); }
    bumpCounter();
  }

  Array.prototype.slice.call(doc.querySelectorAll('.add-to-cart')).forEach(function (button) {
    button.addEventListener('click', function () {
      updateCart(total + 1);
      showToast('Добавлено в корзину');
    });
  });

  if (cartButton) {
    cartButton.addEventListener('click', function () {
      showToast(total > 0 ? 'В корзине товаров: ' + total : 'Корзина пока пуста');
    });
  }

  /* ---------- 5. Фильтр каталога ---------- */
  var chips = Array.prototype.slice.call(doc.querySelectorAll('.chip[data-cat]'));
  var cards = Array.prototype.slice.call(doc.querySelectorAll('.product[data-cat]'));
  var empty = doc.getElementById('catalog-empty');

  function applyFilter(category) {
    var shown = 0;
    cards.forEach(function (card) {
      var match = category === 'all' || card.getAttribute('data-cat') === category;
      card.hidden = !match;
      if (match) { shown += 1; }
    });
    chips.forEach(function (chip) {
      var active = chip.getAttribute('data-cat') === category;
      chip.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    if (empty) { empty.hidden = shown !== 0; }
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      applyFilter(chip.getAttribute('data-cat'));
    });
  });

  Array.prototype.slice.call(doc.querySelectorAll('[data-reset-filter]')).forEach(function (button) {
    button.addEventListener('click', function () {
      applyFilter('all');
      var firstChip = chips.length ? chips[0] : null;
      if (firstChip) { firstChip.focus(); }
    });
  });

  /* ---------- 6. Тень шапки при скролле ---------- */
  function onScroll() {
    if (!header) { return; }
    header.classList.toggle('is-scrolled', window.pageYOffset > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 7. Клавиатура и ресайз ---------- */
  doc.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') { return; }
    setPanel(false);
    closeMenu();
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 860) { closeMenu(); }
  });
})();
