/* =============================================================
   LUMINA — Script
   Theme · Navbar · Lightbox · Toast · Form · Reveal
   ============================================================= */
(function () {
  'use strict';

  /* ============================================================
     1) THEME TOGGLE
     ============================================================ */
  const root = document.documentElement;
  const themeBtn = document.getElementById('themeToggle');

  try {
    const savedTheme = window.localStorage.getItem('lumina-theme');
    const preferredTheme = savedTheme === 'light' || savedTheme === 'dark'
      ? savedTheme
      : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    root.setAttribute('data-theme', preferredTheme);
  } catch (e) {}

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem('lumina-theme', theme); } catch (e) {}
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      const current = root.getAttribute('data-theme') || 'light';
      const next = current === 'light' ? 'dark' : 'light';
      setTheme(next);
      showToast('info',
        next === 'dark' ? 'تم تاریک فعال شد' : 'تم روشن فعال شد',
        '',
        2000
      );
    });
  }

  /* ============================================================
     2) HEADER SCROLL & TO TOP
     ============================================================ */
  const header = document.getElementById('siteHeader');
  const toTop = document.getElementById('toTop');
  let ticking = false;

  function onScroll() {
    const y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('scrolled', y > 10);
    if (toTop) toTop.classList.toggle('show', y > 400);
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ============================================================
     3) ACTIVE NAV LINK (Scroll Spy)
     ============================================================ */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-list .nav-link[href^="#"]');

  if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(function (link) {
            link.classList.toggle('active', link.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ============================================================
     4) MEGA MENU
     ============================================================ */
  const megaItem = document.querySelector('.has-mega');
  const megaToggle = document.getElementById('megaToggle');
  const megaMenu = document.getElementById('megaMenu');
  let megaCloseTimer;
  let megaPinned = false;

  function setMegaOpen(open, pinned) {
    if (!megaItem || !megaToggle) return;
    window.clearTimeout(megaCloseTimer);
    if (typeof pinned === 'boolean') megaPinned = pinned;
    megaItem.classList.toggle('is-open', open);
    megaToggle.setAttribute('aria-expanded', String(open));
  }

  function scheduleMegaClose() {
    window.clearTimeout(megaCloseTimer);
    if (!megaPinned) {
      megaCloseTimer = window.setTimeout(function () {
        setMegaOpen(false, false);
      }, 520);
    }
  }

  if (megaItem && megaToggle && megaMenu) {
    megaToggle.addEventListener('click', function () {
      if (megaItem.classList.contains('is-open') && megaPinned) setMegaOpen(false, false);
      else setMegaOpen(true, true);
    });
    megaItem.addEventListener('mouseenter', function () {
      if (!megaPinned) setMegaOpen(true, false);
    });
    megaItem.addEventListener('mouseleave', scheduleMegaClose);
    megaItem.addEventListener('focusin', function (event) {
      if (event.target !== megaToggle) setMegaOpen(true, megaPinned);
    });
    megaItem.addEventListener('focusout', function () {
      window.setTimeout(function () {
        if (!megaItem.contains(document.activeElement)) scheduleMegaClose();
      }, 0);
    });
    megaMenu.addEventListener('mouseenter', function () { window.clearTimeout(megaCloseTimer); });
    megaMenu.addEventListener('click', function (event) {
      if (event.target.closest('a')) setMegaOpen(false, false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && megaItem.classList.contains('is-open')) {
        setMegaOpen(false, false);
        megaToggle.focus();
      }
    });
  }

  /* ============================================================
     5) HERO SLIDER
     ============================================================ */
  (function initHeroSlider() {
    const slider = document.getElementById('heroSlider');
    if (!slider) return;
    const slides = Array.from(slider.querySelectorAll('.hero-slide'));
    const dots = Array.from(slider.querySelectorAll('[data-slide-to]'));
    const previous = slider.querySelector('[data-slide-prev]');
    const next = slider.querySelector('[data-slide-next]');
    const toggle = slider.querySelector('[data-slide-toggle]');
    if (slides.length < 2 || !previous || !next || !toggle) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let activeIndex = 0;
    let timer;
    let pointerStart = null;
    let pausedByHover = false;
    let pausedByFocus = false;
    let pausedManually = reduceMotion;

    function showSlide(index) {
      activeIndex = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        const active = slideIndex === activeIndex;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
      });
      dots.forEach(function (dot, dotIndex) {
        const active = dotIndex === activeIndex;
        dot.classList.toggle('is-active', active);
        if (active) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
    }

    function updateToggle() {
      toggle.setAttribute('aria-pressed', String(pausedManually));
      toggle.setAttribute('aria-label', pausedManually ? 'ادامه پخش خودکار' : 'توقف پخش خودکار');
      toggle.innerHTML = '<i class="bi ' + (pausedManually ? 'bi-play-fill' : 'bi-pause-fill') + '"></i>';
    }

    function startTimer() {
      window.clearInterval(timer);
      if (!pausedManually && !pausedByHover && !pausedByFocus) {
        timer = window.setInterval(function () { showSlide(activeIndex + 1); }, 5000);
      }
    }

    previous.addEventListener('click', function () { showSlide(activeIndex - 1); });
    next.addEventListener('click', function () { showSlide(activeIndex + 1); });
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        showSlide(Number(dot.getAttribute('data-slide-to')));
      });
    });
    toggle.addEventListener('click', function () {
      pausedManually = !pausedManually;
      updateToggle();
      startTimer();
    });
    slider.addEventListener('mouseenter', function () { pausedByHover = true; startTimer(); });
    slider.addEventListener('mouseleave', function () { pausedByHover = false; startTimer(); });
    slider.addEventListener('focusin', function () { pausedByFocus = true; startTimer(); });
    slider.addEventListener('focusout', function (event) {
      if (!slider.contains(event.relatedTarget)) { pausedByFocus = false; startTimer(); }
    });
    const track = slider.querySelector('.hero-slides');
    track.addEventListener('pointerdown', function (event) { pointerStart = event.clientX; });
    track.addEventListener('pointerup', function (event) {
      if (pointerStart === null) return;
      const distance = event.clientX - pointerStart;
      pointerStart = null;
      if (Math.abs(distance) > 55) showSlide(activeIndex + (distance > 0 ? -1 : 1));
    });
    track.addEventListener('pointercancel', function () { pointerStart = null; });
    updateToggle();
    startTimer();
  })();

  /* ============================================================
     6) REVEAL ON SCROLL
     ============================================================ */
  const revealElements = document.querySelectorAll('.reveal');
  if (revealElements.length && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealElements.forEach(function (element) { revealObserver.observe(element); });
  } else {
    revealElements.forEach(function (element) { element.classList.add('in'); });
  }

  /* ============================================================
     7) STATS COUNTER
     ============================================================ */
  const counters = document.querySelectorAll('.stat strong[data-count]');
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  function formatPersianNumber(value) {
    return String(value).replace(/\d/g, function (digit) { return persianDigits[Number(digit)]; });
  }
  function animateCounter(element) {
    const target = Number.parseInt(element.getAttribute('data-count'), 10) || 0;
    const suffix = element.getAttribute('data-suffix') || '';
    const duration = 1600;
    const startedAt = performance.now();
    function frame(now) {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      element.textContent = formatPersianNumber(value.toLocaleString('en-US').replace(/,/g, '،')) + suffix;
      if (progress < 1) window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }
  if (counters.length && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (counter) { counterObserver.observe(counter); });
  } else {
    counters.forEach(animateCounter);
  }

  /* ============================================================
     8) TOAST SYSTEM
     ============================================================ */
  const toastStack = document.getElementById('toastStack');
  const toastIcons = { success: 'bi-check-lg', error: 'bi-x-lg', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-lg' };
  function showToast(type, title, message, duration) {
    if (!toastStack) return;
    const lifetime = duration || 4000;
    const toast = document.createElement('div');
    toast.className = 'toast-item toast-' + type;
    toast.style.setProperty('--d', lifetime + 'ms');
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    const iconElement = document.createElement('i');
    iconElement.className = 'bi ' + (toastIcons[type] || toastIcons.info);
    icon.appendChild(iconElement);
    const body = document.createElement('div');
    body.className = 'toast-body';
    const titleElement = document.createElement('p');
    titleElement.className = 'toast-title';
    titleElement.textContent = title || '';
    const messageElement = document.createElement('p');
    messageElement.className = 'toast-msg';
    messageElement.textContent = message || '';
    body.appendChild(titleElement);
    body.appendChild(messageElement);
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'toast-close';
    closeButton.setAttribute('aria-label', 'بستن');
    closeButton.innerHTML = '<i class="bi bi-x-lg"></i>';
    const progress = document.createElement('span');
    progress.className = 'toast-progress';
    toast.appendChild(icon);
    toast.appendChild(body);
    toast.appendChild(closeButton);
    toast.appendChild(progress);
    toastStack.appendChild(toast);

    let remaining = lifetime;
    let startedAt = Date.now();
    let paused = false;
    let timer = window.setTimeout(remove, remaining);
    function remove() {
      window.clearTimeout(timer);
      toast.classList.add('removing');
      toast.addEventListener('animationend', function () { toast.remove(); }, { once: true });
      window.setTimeout(function () { toast.remove(); }, 400);
    }
    closeButton.addEventListener('click', remove);
    toast.addEventListener('mouseenter', function () {
      if (paused) return;
      paused = true;
      window.clearTimeout(timer);
      remaining -= Date.now() - startedAt;
      progress.style.animationPlayState = 'paused';
    });
    toast.addEventListener('mouseleave', function () {
      if (!paused) return;
      paused = false;
      startedAt = Date.now();
      progress.style.animationPlayState = 'running';
      timer = window.setTimeout(remove, Math.max(remaining, 1000));
    });
  }
  window.luminaToast = showToast;

  /* ============================================================
    10) LIGHTBOX (IMAGES & VIDEOS)
     ============================================================ */
  (function initLightbox() {
    const lb = document.getElementById('lightbox');
    const lbContent = document.getElementById('lbContent');
    const lbClose = document.getElementById('lbClose');
    const lbPrev = document.getElementById('lbPrev');
    const lbNext = document.getElementById('lbNext');
    if (!lb || !lbContent) return;

    // جمع‌آوری همه آیتم‌های قابل باز شدن
    const items = Array.from(document.querySelectorAll('[data-lightbox-type]'));
    let currentIndex = 0;
    let isOpen = false;

    function openLightbox(index) {
      currentIndex = index;
      const el = items[currentIndex];
      if (!el) return;

      const type = el.getAttribute('data-lightbox-type');
      const src  = el.getAttribute('data-lightbox-src');
      const alt  = el.querySelector('img') ? el.querySelector('img').alt : '';

      lbContent.innerHTML = '';

      if (type === 'video') {
        // پشتیبانی از یوتیوب، آپارات یا فایل ویدیویی
        if (src.indexOf('youtube') !== -1 || src.indexOf('aparat') !== -1) {
          const iframe = document.createElement('iframe');
          iframe.src = src;
          iframe.setAttribute('allow', 'autoplay; encrypted-media; fullscreen');
          iframe.setAttribute('allowfullscreen', 'true');
          iframe.setAttribute('title', alt || 'ویدیو پروژه');
          lbContent.appendChild(iframe);
        } else {
          const video = document.createElement('video');
          video.src = src;
          video.controls = true;
          video.autoplay = true;
          video.playsInline = true;
          lbContent.appendChild(video);
        }
        lb.classList.add('is-video');
      } else {
        const img = document.createElement('img');
        img.src = src;
        img.alt = alt;
        img.loading = 'eager';
        img.decoding = 'async';
        lbContent.appendChild(img);
        lb.classList.remove('is-video');
      }

      lb.classList.add('show');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      isOpen = true;
    }

    function closeLightbox() {
      lb.classList.remove('show');
      lb.classList.remove('is-video');
      lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      setTimeout(function () { lbContent.innerHTML = ''; }, 250);
      isOpen = false;
    }

    function nextItem() {
      if (currentIndex < items.length - 1) {
        openLightbox(currentIndex + 1);
      } else {
        openLightbox(0);
      }
    }

    function prevItem() {
      if (currentIndex > 0) {
        openLightbox(currentIndex - 1);
      } else {
        openLightbox(items.length - 1);
      }
    }

    // ثبت رویداد کلیک روی همه آیتم‌ها
    items.forEach(function (el, idx) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        openLightbox(idx);
      });
    });

    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lbPrev) lbPrev.addEventListener('click', prevItem);
    if (lbNext) lbNext.addEventListener('click', nextItem);

    // کلیک روی پس‌زمینه
    lb.addEventListener('click', function (e) {
      if (e.target === lb) closeLightbox();
    });

    // کیبورد
    document.addEventListener('keydown', function (e) {
      if (!isOpen) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') nextItem();
      else if (e.key === 'ArrowRight') prevItem();
    });

    // سوایپ موبایل
    let touchStartX = 0;
    lb.addEventListener('touchstart', function (e) {
      if (e.touches.length === 1) touchStartX = e.touches[0].clientX;
    }, { passive: true });

    lb.addEventListener('touchend', function (e) {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) < 50) return;
      if (dx > 0) prevItem();
      else nextItem();
    }, { passive: true });
  })();

  /* ============================================================
    11) CONSULT FORM VALIDATION
     ============================================================ */
  (function initConsultForm() {
    const form = document.getElementById('consultForm');
    if (!form) return;

    const fields = {
      name:    { el: document.getElementById('c-name'),    group: form.querySelector('[data-field="name"]') },
      phone:   { el: document.getElementById('c-phone'),   group: form.querySelector('[data-field="phone"]') },
      email:   { el: document.getElementById('c-email'),   group: form.querySelector('[data-field="email"]') },
      service: { el: document.getElementById('c-service'), group: form.querySelector('[data-field="service"]') },
      budget:  { el: document.getElementById('c-budget'),  group: form.querySelector('[data-field="budget"]') },
      city:    { el: document.getElementById('c-city'),    group: form.querySelector('[data-field="city"]') },
      desc:    { el: document.getElementById('c-desc'),    group: form.querySelector('[data-field="desc"]') },
      agree:   { el: document.getElementById('c-agree'),   group: form.querySelector('[data-field="agree"]') }
    };

    const agreeError = form.querySelector('.f-error-block');
    const submitBtn = document.getElementById('consultSubmit');
    const counter = document.getElementById('cCounter');

    function toEn(str) {
      return String(str).replace(/[۰-۹]/g, function (d) {
        return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d);
      });
    }
    function toFa(str) {
      return String(str).replace(/\d/g, function (d) {
        return '۰۱۲۳۴۵۶۷۸۹'[+d];
      });
    }

    const rules = {
      name: function (v) {
        v = v.trim();
        if (!v) return 'نام و نام خانوادگی را وارد کن.';
        if (v.length < 3) return 'نام باید حداقل ۳ کاراکتر باشد.';
        return '';
      },
      phone: function (v) {
        v = toEn(v).replace(/[\s-]/g, '');
        if (!v) return 'شماره تماس را وارد کن.';
        if (!/^09\d{9}$/.test(v)) return 'شماره باید ۱۱ رقم و با ۰۹ شروع شود.';
        return '';
      },
      email: function (v) {
        v = v.trim();
        if (!v) return '';
        if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(v)) return 'ایمیل معتبر نیست.';
        return '';
      },
      service: function (v) {
        if (!v) return 'نوع خدمات را انتخاب کن.';
        return '';
      },
      budget: function () { return ''; },
      city: function () { return ''; },
      desc: function (v) {
        v = v.trim();
        if (!v) return 'توضیحات پروژه را وارد کن.';
        if (v.length < 10) return 'توضیحات باید حداقل ۱۰ کاراکتر باشد.';
        return '';
      }
    };

    function validateField(key) {
      const f = fields[key];
      if (!f || !f.el) return true;
      const errEl = f.group ? f.group.querySelector('.f-error') : null;
      const msg = rules[key] ? rules[key](f.el.value) : '';

      if (msg) {
        if (f.group) f.group.classList.add('error');
        if (errEl) errEl.textContent = msg;
        return false;
      }
      if (f.group) f.group.classList.remove('error');
      if (errEl) errEl.textContent = '';
      return true;
    }

    function validateAgree() {
      const ok = fields.agree.el.checked;
      if (agreeError) {
        agreeError.textContent = ok ? '' : 'برای ادامه باید قوانین را بپذیری.';
        agreeError.style.opacity = ok ? '0' : '1';
      }
      return ok;
    }

    // Event Listeners
    Object.keys(fields).forEach(function (key) {
      const f = fields[key];
      if (!f || !f.el || key === 'agree') return;

      f.el.addEventListener('input', function () {
        if (f.group && f.group.classList.contains('error')) validateField(key);

        if (key === 'phone') {
          const raw = toEn(f.el.value).replace(/[^\d]/g, '').slice(0, 11);
          if (f.el.value !== raw) f.el.value = raw;
        }

        if (key === 'desc' && counter) {
          counter.textContent = toFa(f.el.value.length) + ' / ۶۰۰';
        }
      });

      f.el.addEventListener('blur', function () {
        if (f.el.value.trim()) validateField(key);
      });

      f.el.addEventListener('change', function () {
        if (key === 'service' || key === 'budget') validateField(key);
      });
    });

    if (fields.agree.el) {
      fields.agree.el.addEventListener('change', validateAgree);
    }

    // Submit
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      let ok = true;
      ['name', 'phone', 'email', 'service', 'budget', 'city', 'desc'].forEach(function (k) {
        if (!validateField(k)) ok = false;
      });
      if (!validateAgree()) ok = false;

      if (!ok) {
        showToast('error', 'خطا در ارسال', 'لطفاً خطاهای مشخص‌شده را برطرف کن.', 4500);
        const firstErr = form.querySelector('.field.error input, .field.error select, .field.error textarea');
        if (firstErr) {
          firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(function () { firstErr.focus(); }, 300);
        }
        return;
      }

      submitBtn.classList.add('loading');
      submitBtn.disabled = true;

      // شبیه‌سازی ارسال
      setTimeout(function () {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        showToast('success', 'درخواستت ثبت شد 🎉', 'کارشناس ما تا ۲۴ ساعت آینده باهات تماس می‌گیره.', 5000);
        form.reset();
        Object.keys(fields).forEach(function (k) {
          if (fields[k].group) fields[k].group.classList.remove('error');
        });
        if (counter) counter.textContent = '۰ / ۶۰۰';
        if (agreeError) agreeError.style.opacity = '0';
      }, 1400);
    });
  })();

  /* ============================================================
     CONTACT REQUEST FORM
     ============================================================ */
  (function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const fieldKeys = ['name', 'phone', 'email', 'service', 'city', 'message'];
    const fields = {};
    fieldKeys.forEach(function (key) {
      fields[key] = {
        el: form.elements[key],
        group: form.querySelector('[data-contact-field="' + key + '"]')
      };
    });
    const consent = form.elements.consent;
    const consentGroup = form.querySelector('[data-contact-field="consent"]');
    const counter = document.getElementById('contactMessageCounter');
    const status = document.getElementById('contactFormStatus');

    function toEnglishDigits(value) {
      return String(value).replace(/[۰-۹٠-٩]/g, function (digit) {
        const persianIndex = '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit);
        return String(persianIndex < 0 ? '٠١٢٣٤٥٦٧٨٩'.indexOf(digit) : persianIndex);
      });
    }

    function toPersianDigits(value) {
      return String(value).replace(/\d/g, function (digit) {
        return '۰۱۲۳۴۵۶۷۸۹'[Number(digit)];
      });
    }

    function normalizePhone(value) {
      let digits = toEnglishDigits(value).replace(/\D/g, '');
      if (digits.indexOf('0098') === 0) digits = digits.slice(2);
      if (digits.indexOf('98') === 0 && digits.length === 12) digits = '0' + digits.slice(2);
      if (digits.length === 10 && digits.charAt(0) === '9') digits = '0' + digits;
      return digits;
    }

    function getError(key) {
      const value = fields[key].el.value.trim();
      if (key === 'name' && value.length < 3) return 'نام و نام خانوادگی را کامل وارد کنید.';
      if (key === 'phone' && !/^09\d{9}$/.test(normalizePhone(value))) return 'شماره را به‌شکل ۰۹۱۲۳۴۵۶۷۸۹ یا ‎+۹۸۹۱۲۳۴۵۶۷۸۹ وارد کنید.';
      if (key === 'email' && value && !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(value)) return 'ایمیل واردشده معتبر نیست.';
      if (key === 'service' && !fields[key].el.value) return 'موضوع درخواست را انتخاب کنید.';
      if (key === 'message' && value.length < 10) return 'شرح درخواست باید دست‌کم ۱۰ نویسه باشد.';
      return '';
    }

    function setFieldError(key, message) {
      const field = fields[key];
      const error = field.group.querySelector('.f-error');
      const invalid = Boolean(message);
      field.group.classList.toggle('error', invalid);
      field.el.setAttribute('aria-invalid', String(invalid));
      error.textContent = message;
      return !invalid;
    }

    function validateField(key) {
      return setFieldError(key, getError(key));
    }

    function validateConsent() {
      const invalid = !consent.checked;
      consentGroup.classList.toggle('error', invalid);
      consent.setAttribute('aria-invalid', String(invalid));
      consentGroup.querySelector('.f-error').textContent = invalid ? 'برای پیگیری درخواست، رضایت تماس را تأیید کنید.' : '';
      return !invalid;
    }

    fieldKeys.forEach(function (key) {
      const field = fields[key].el;
      const eventName = field.tagName === 'SELECT' ? 'change' : 'input';
      field.addEventListener(eventName, function () {
        if (status) status.textContent = '';
        if (fields[key].group.classList.contains('error')) validateField(key);
        if (key === 'message' && counter) counter.textContent = toPersianDigits(field.value.length) + ' / ۱۰۰۰';
      });
      field.addEventListener('blur', function () {
        if (field.value.trim()) validateField(key);
      });
    });

    consent.addEventListener('change', function () {
      if (status) status.textContent = '';
      validateConsent();
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      let valid = true;
      fieldKeys.forEach(function (key) {
        if (!validateField(key)) valid = false;
      });
      if (!validateConsent()) valid = false;

      if (!valid) {
        if (status) status.textContent = 'لطفاً خطاهای مشخص‌شده را برطرف کنید.';
        showToast('error', 'فرم کامل نیست', 'فیلدهای مشخص‌شده را بررسی کنید.', 4000);
        const firstInvalid = form.querySelector('[aria-invalid="true"]');
        if (firstInvalid) {
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstInvalid.focus();
        }
        return;
      }

      const selectedService = fields.service.el.options[fields.service.el.selectedIndex].text;
      const message = [
        'نام: ' + fields.name.el.value.trim(),
        'تلفن: ' + normalizePhone(fields.phone.el.value),
        'ایمیل: ' + fields.email.el.value.trim(),
        'موضوع: ' + selectedService,
        'شهر: ' + fields.city.el.value.trim(),
        '',
        'شرح درخواست:',
        fields.message.el.value.trim()
      ].join('\n');
      const subject = 'درخواست تماس از وب‌سایت لومینا - ' + selectedService;
      const mailto = 'mailto:info@lumina.ir?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(message);

      if (status) status.textContent = 'برنامه‌ی ایمیل باز می‌شود؛ ارسال نهایی را در آن تأیید کنید.';
      showToast('info', 'ایمیل آماده‌ی ارسال است', 'برای ارسال نهایی، آن را در برنامه‌ی ایمیل تأیید کنید.', 5000);
      window.location.href = mailto;
    });
  })();

  /* ============================================================
     ARTICLE LISTING & STATIC DETAIL SELECTION
     ============================================================ */
  (function initArticleListing() {
    const grid = document.getElementById('articleGrid');
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll('.article-listing-card[data-article-category]'));
    const filters = Array.from(document.querySelectorAll('[data-article-filter]'));
    const previous = document.querySelector('[data-article-page-prev]');
    const next = document.querySelector('[data-article-page-next]');
    const pageStatus = document.querySelector('[data-article-page-status]');
    const countStatus = document.querySelector('[data-article-count]');
    const pageSize = Math.max(1, Number.parseInt(grid.getAttribute('data-page-size'), 10) || cards.length || 1);
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    let activeCategory = 'all';
    let currentPage = 1;

    function toPersianDigits(value) {
      return String(value).replace(/\d/g, function (digit) { return persianDigits[Number(digit)]; });
    }

    function render() {
      const matchingCards = cards.filter(function (card) {
        return activeCategory === 'all' || card.getAttribute('data-article-category') === activeCategory;
      });
      const pageCount = Math.max(1, Math.ceil(matchingCards.length / pageSize));
      currentPage = Math.min(currentPage, pageCount);
      const visibleStart = (currentPage - 1) * pageSize;
      const visibleCards = matchingCards.slice(visibleStart, visibleStart + pageSize);
      const visibleSet = new Set(visibleCards);

      cards.forEach(function (card) { card.hidden = !visibleSet.has(card); });
      filters.forEach(function (filter) {
        const selected = filter.getAttribute('data-article-filter') === activeCategory;
        filter.classList.toggle('is-active', selected);
        filter.setAttribute('aria-pressed', String(selected));
      });
      if (pageStatus) pageStatus.textContent = toPersianDigits(currentPage) + ' / ' + toPersianDigits(pageCount);
      if (countStatus) countStatus.textContent = toPersianDigits(matchingCards.length) + ' مقاله';
      if (previous) previous.disabled = currentPage <= 1;
      if (next) next.disabled = currentPage >= pageCount;
    }

    filters.forEach(function (filter) {
      filter.addEventListener('click', function () {
        activeCategory = filter.getAttribute('data-article-filter');
        currentPage = 1;
        render();
      });
    });
    if (previous) previous.addEventListener('click', function () { currentPage -= 1; render(); });
    if (next) next.addEventListener('click', function () { currentPage += 1; render(); });
    render();
  })();

  (function initStaticArticleDetail() {
    const page = document.querySelector('[data-article-detail-page]');
    if (!page) return;
    const entries = Array.from(page.querySelectorAll('[data-article-entry]'));
    if (!entries.length) return;

    function selectEntry() {
      const requestedId = decodeURIComponent(window.location.hash.slice(1));
      const selected = entries.find(function (entry) { return entry.id === requestedId; }) || entries[0];
      entries.forEach(function (entry) { entry.hidden = entry !== selected; });
    }

    window.addEventListener('hashchange', selectEntry);
    selectEntry();
  })();

  /* ============================================================
    9) NEWSLETTER FORM
     ============================================================ */
  (function initNewsletter() {
    const form = document.getElementById('newsletterForm');
    if (!form) return;
    const input = form.querySelector('input[type="email"]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const v = (input.value || '').trim();

      if (!v || !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(v)) {
        showToast('error', 'ایمیل معتبر نیست', 'یه ایمیل درست وارد کن.', 3500);
        input.focus();
        return;
      }

      const btn = form.querySelector('button');
      const original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="btn-spinner" style="display:inline-block"></span>';

      setTimeout(function () {
        btn.disabled = false;
        btn.innerHTML = original;
        showToast('success', 'عضویت انجام شد 🎉', 'از این به بعد تخفیف‌ها رو اول از همه می‌بینی.', 4000);
        form.reset();
      }, 1200);
    });
  })();

  /* ============================================================
    13) SMOOTH SCROLL FOR ANCHOR LINKS
     ============================================================ */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      const href = a.getAttribute('href');
      if (href === '#' || href.length < 2) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const headerH = header ? header.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.pageYOffset - headerH - 10;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

  /* ============================================================
    14) MOBILE DRAWER — Close on link click
     ============================================================ */
  const mobileServicesToggle = document.getElementById('mobileServicesToggle');
  const mobileServicesMenu = document.getElementById('mobileServicesMenu');

  if (mobileServicesToggle && mobileServicesMenu) {
    mobileServicesToggle.addEventListener('click', function () {
      const isOpen = mobileServicesToggle.getAttribute('aria-expanded') === 'true';
      mobileServicesToggle.setAttribute('aria-expanded', String(!isOpen));
      mobileServicesToggle.setAttribute('aria-label', isOpen ? 'نمایش دسته‌بندی خدمات' : 'بستن دسته‌بندی خدمات');
      mobileServicesMenu.hidden = isOpen;
    });
  }

  document.querySelectorAll('.mobile-list a').forEach(function (a) {
    a.addEventListener('click', function () {
      const oc = bootstrap.Offcanvas.getInstance(document.getElementById('mobileNav'));
      if (oc) oc.hide();
    });
  });

  /* ============================================================
    15) CLOSE MEGA/DROPDOWN ON CLICK OUTSIDE
     ============================================================ */
  document.addEventListener('click', function (e) {
    const drop = document.querySelector('.has-drop');
    if (megaItem && !megaItem.contains(e.target)) {
      setMegaOpen(false, false);
    }
    if (drop && !drop.contains(e.target)) {
      drop.querySelector('.nav-link')?.blur();
    }
  });

})();
/* ============ ANIMATED CUSTOM CURSOR ============ */
(function initAnimatedCursor() {
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!finePointer.matches || reduceMotion.matches) return;

  const cursor = document.createElement('div');
  cursor.className = 'custom-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = '<span class="custom-cursor__ring"></span><span class="custom-cursor__dot"></span>';
  document.body.appendChild(cursor);
  document.documentElement.classList.add('custom-cursor-enabled');

  let targetX = -100;
  let targetY = -100;
  let ringX = targetX;
  let ringY = targetY;
  let frame = 0;

  function animate() {
    ringX += (targetX - ringX) * .2;
    ringY += (targetY - ringY) * .2;
    cursor.style.transform = 'translate3d(' + ringX + 'px,' + ringY + 'px,0)';
    if (Math.abs(targetX - ringX) > .1 || Math.abs(targetY - ringY) > .1) {
      frame = window.requestAnimationFrame(animate);
    } else {
      frame = 0;
    }
  }

  document.addEventListener('pointermove', function (event) {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    targetX = event.clientX;
    targetY = event.clientY;
    cursor.classList.add('is-visible');
    if (!frame) frame = window.requestAnimationFrame(animate);

    const target = event.target instanceof Element ? event.target : null;
    cursor.classList.toggle('is-interactive', !!(target && target.closest('a[href], button:not(:disabled), [role="button"], input[type="submit"]:not(:disabled), input[type="checkbox"], input[type="radio"], select:not(:disabled), summary, .project-media, .g-item, .f-check')));
    cursor.classList.toggle('is-text', !!(target && target.closest('input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]')));
  }, { passive: true });

  document.addEventListener('pointerdown', function () { cursor.classList.add('is-pressed'); });
  window.addEventListener('pointerup', function () { cursor.classList.remove('is-pressed'); });
  document.addEventListener('pointerleave', function () { cursor.classList.remove('is-visible'); });
  document.addEventListener('pointerenter', function () { cursor.classList.add('is-visible'); });
})();

/* ============ SIGNUP FORM INTERACTIONS ============ */
(function initRegisterForm() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  const name = form.elements.name;
  const email = form.elements.email;
  const phone = form.elements.phone;
  const password = form.elements.password;
  const confirmation = form.elements['password-confirm'];
  const terms = form.elements.terms;
  const status = document.getElementById('registerStatus');
  const fields = [name, email, phone, password, confirmation, terms];

  function fieldGroup(input) {
    return input.closest('.field');
  }

  function setError(input, message) {
    const group = fieldGroup(input);
    let error = group.querySelector('.signup-field-error');
    if (message && !error) {
      error = document.createElement('span');
      error.className = 'signup-field-error';
      error.setAttribute('role', 'alert');
      group.appendChild(error);
    }
    group.classList.toggle('error', Boolean(message));
    input.setAttribute('aria-invalid', String(Boolean(message)));
    if (error) {
      error.textContent = message;
      error.hidden = !message;
    }
    return !message;
  }

  function normalizePhone(value) {
    let digits = String(value).replace(/[۰-۹٠-٩]/g, function (digit) {
      const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
      const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
      const index = persianDigits.indexOf(digit);
      return String(index < 0 ? arabicDigits.indexOf(digit) : index);
    }).replace(/\D/g, '');
    if (digits.indexOf('0098') === 0) digits = digits.slice(4);
    else if (digits.indexOf('98') === 0 && digits.length === 12) digits = digits.slice(2);
    if (digits.length === 10 && digits.charAt(0) === '9') digits = '0' + digits;
    return digits;
  }

  function validate(input) {
    const value = input.type === 'checkbox' ? '' : input.value.trim();
    let message = '';

    if (input === name && value.length < 3) message = 'نام و نام خانوادگی را کامل وارد کنید.';
    if (input === email) {
      if (!value) message = 'ایمیل را وارد کنید.';
      else if (!input.validity.valid || !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(value)) message = 'یک ایمیل معتبر وارد کنید.';
    }
    if (input === phone && value) {
      if (!/^09\d{9}$/.test(normalizePhone(value))) message = 'شماره موبایل را به شکل ۰۹۱۲۱۲۳۴۵۶۷ وارد کنید.';
    }
    if (input === password) {
      if (!value) message = 'رمز عبور را وارد کنید.';
      else if (value.length < 8) message = 'رمز عبور باید دست‌کم ۸ نویسه باشد.';
    }
    if (input === confirmation) {
      if (!value) message = 'تکرار رمز عبور را وارد کنید.';
      else if (value !== password.value) message = 'تکرار رمز عبور با رمز اصلی یکسان نیست.';
    }
    if (input === terms && !terms.checked) message = 'برای ادامه، شرایط استفاده و حریم خصوصی را بپذیرید.';

    return setError(input, message);
  }

  function validateAll() {
    let valid = true;
    fields.forEach(function (input) {
      if (!validate(input)) valid = false;
    });
    return valid;
  }

  fields.forEach(function (input) {
    const eventName = input.type === 'checkbox' ? 'change' : 'input';
    input.addEventListener(eventName, function () {
      if (fieldGroup(input).classList.contains('error')) validate(input);
      if (input === password && confirmation.value) validate(confirmation);
      status.classList.remove('is-visible');
    });
    input.addEventListener('blur', function () {
      if (input.value || input.type === 'checkbox' || fieldGroup(input).classList.contains('error')) validate(input);
    });
  });

  form.querySelectorAll('[data-password-target]').forEach(function (button) {
    button.addEventListener('click', function () {
      const input = document.getElementById(button.getAttribute('data-password-target'));
      const visible = input.type === 'password';
      input.type = visible ? 'text' : 'password';
      button.setAttribute('aria-label', visible ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور');
      button.innerHTML = '<i class="bi ' + (visible ? 'bi-eye-slash' : 'bi-eye') + '" aria-hidden="true"></i>';
    });
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!validateAll()) {
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) {
        firstInvalid.focus({ preventScroll: true });
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (window.luminaToast) window.luminaToast('error', 'فرم کامل نیست', 'موارد مشخص‌شده را اصلاح کنید و دوباره تلاش کنید.', 4500);
      return;
    }

    status.textContent = 'اطلاعات فرم معتبر است؛ برای ایجاد حساب، سرویس ثبت‌نام باید به سایت متصل شود.';
    status.classList.add('is-visible');
    if (window.luminaToast) window.luminaToast('info', 'اطلاعات تأیید شد', 'فرم آماده است، اما ایجاد حساب به سرویس ثبت‌نام نیاز دارد.', 5000);
  });
})();
/* Expand nested mega-menu categories by pointer click or keyboard. */
(function initMegaSubmenus() {
  document.querySelectorAll('.mega-nested-toggle').forEach(function (button) {
    const submenu = document.getElementById(button.getAttribute('aria-controls'));
    if (!submenu) return;

    button.addEventListener('click', function () {
      const open = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!open));
      submenu.hidden = open;
    });

    button.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
        button.setAttribute('aria-expanded', 'false');
        submenu.hidden = true;
        button.focus();
      }
    });
  });
})();

/* Accessible project navigation for desktop and mobile. */
(function initProjectNavigation() {
  const root = document.querySelector('.has-drop');
  const rootToggle = root && root.querySelector(':scope > .nav-link');
  let closeTimer = 0;

  function setRootOpen(open) {
    if (!root || !rootToggle) return;
    root.classList.toggle('is-open', open);
    rootToggle.setAttribute('aria-expanded', String(open));
    if (!open) {
      root.querySelectorAll('.drop-submenu-toggle').forEach(function (button) {
        button.setAttribute('aria-expanded', 'false');
        const menu = document.getElementById(button.getAttribute('aria-controls'));
        if (menu) menu.hidden = true;
      });
    }
  }

  if (root && rootToggle) {
    rootToggle.addEventListener('click', function () {
      window.clearTimeout(closeTimer);
      setRootOpen(!root.classList.contains('is-open'));
    });
    root.addEventListener('mouseenter', function () {
      window.clearTimeout(closeTimer);
      rootToggle.setAttribute('aria-expanded', 'true');
    });
    root.addEventListener('mouseleave', function () {
      if (root.classList.contains('is-open')) return;
      closeTimer = window.setTimeout(function () { rootToggle.setAttribute('aria-expanded', 'false'); }, 420);
    });
    document.addEventListener('click', function (event) {
      if (!root.contains(event.target)) setRootOpen(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && root.classList.contains('is-open')) {
        setRootOpen(false);
        rootToggle.focus();
      }
    });
  }

  document.querySelectorAll('.drop-nested-item').forEach(function (item) {
    const button = item.querySelector('.drop-submenu-toggle');
    const menu = button && document.getElementById(button.getAttribute('aria-controls'));
    if (!button || !menu) return;
    let itemTimer = 0;
    function setOpen(open) {
      window.clearTimeout(itemTimer);
      button.setAttribute('aria-expanded', String(open));
      menu.hidden = !open;
    }
    item.addEventListener('mouseenter', function () { setOpen(true); });
    item.addEventListener('mouseleave', function () {
      itemTimer = window.setTimeout(function () {
        if (!item.matches(':hover') && !item.contains(document.activeElement)) setOpen(false);
      }, 220);
    });
    item.addEventListener('focusin', function () { setOpen(true); });
    item.addEventListener('focusout', function () {
      window.setTimeout(function () { if (!item.contains(document.activeElement)) setOpen(false); }, 0);
    });
    button.addEventListener('click', function () { setOpen(true); });
    button.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        button.focus();
      }
    });
  });

  const mobileToggle = document.getElementById('mobileProjectsToggle');
  const mobileMenu = document.getElementById('mobileProjectsMenu');
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', function () {
      const open = mobileToggle.getAttribute('aria-expanded') === 'true';
      mobileToggle.setAttribute('aria-expanded', String(!open));
      mobileToggle.setAttribute('aria-label', open ? 'نمایش دسته‌بندی پروژه‌ها' : 'بستن دسته‌بندی پروژه‌ها');
      mobileMenu.hidden = open;
    });
  }
})();

(function initProjectCategoryLinks() {
  const grid = document.getElementById('projectGrid');
  if (!grid) return;
  const cards = Array.from(grid.querySelectorAll('[data-project-category]'));
  const buttons = Array.from(document.querySelectorAll('[data-project-filter]'));
  const count = document.getElementById('projectResultCount');
  const allowed = ['all', 'event', 'retail', 'exhibition', 'conference', 'corporate'];
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';

  function apply(category, updateUrl) {
    const selected = allowed.indexOf(category) >= 0 ? category : 'all';
    let visible = 0;
    cards.forEach(function (card) {
      const show = selected === 'all' || card.getAttribute('data-project-category') === selected;
      card.hidden = !show;
      if (show) visible += 1;
    });
    buttons.forEach(function (button) {
      const active = button.getAttribute('data-project-filter') === selected;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (count) count.textContent = String(visible).replace(/\d/g, function (digit) { return persianDigits[Number(digit)]; }) + ' پروژه';
    if (updateUrl) {
      const url = new URL(window.location.href);
      if (selected === 'all') url.searchParams.delete('category');
      else url.searchParams.set('category', selected);
      window.history.replaceState({}, '', url);
    }
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () { apply(button.getAttribute('data-project-filter'), true); });
  });
  apply(new URLSearchParams(window.location.search).get('category') || 'all', false);
})();
