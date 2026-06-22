(function () {
  "use strict";

  /* ===== Header scroll state ===== */
  var header = document.getElementById("header");
  function onScroll() {
    if (window.scrollY > 20) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ===== Mobile nav ===== */
  var burger = document.getElementById("burger");
  var mobileNav = document.getElementById("mobileNav");
  function closeMobileNav() {
    burger.classList.remove("is-open");
    mobileNav.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
  }
  burger.addEventListener("click", function () {
    var open = burger.classList.toggle("is-open");
    mobileNav.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
  });
  mobileNav.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeMobileNav);
  });

  /* ===== Scroll reveal ===== */
  var reveals = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry, i) {
          if (entry.isIntersecting) {
            var el = entry.target;
            // small stagger for grouped elements
            setTimeout(function () {
              el.classList.add("is-visible");
            }, (i % 4) * 80);
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach(function (el) {
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ===== Animated counters ===== */
  var counters = document.querySelectorAll("[data-count]");
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var duration = 1400;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var countObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) {
      countObserver.observe(el);
    });
  } else {
    counters.forEach(function (el) {
      el.textContent = el.getAttribute("data-count");
    });
  }

  /* ===== Projects carousel ===== */
  var track = document.getElementById("carouselTrack");
  var prevBtn = document.getElementById("prevBtn");
  var nextBtn = document.getElementById("nextBtn");
  var dotsWrap = document.getElementById("carouselDots");
  var slides = track ? Array.prototype.slice.call(track.children) : [];
  var index = 0;
  var autoTimer = null;

  function slidesPerView() {
    if (window.innerWidth <= 600) return 1;
    if (window.innerWidth <= 980) return 2;
    return 3;
  }

  function maxIndex() {
    return Math.max(0, slides.length - slidesPerView());
  }

  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = "";
    var count = maxIndex() + 1;
    for (var i = 0; i < count; i++) {
      var dot = document.createElement("button");
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", "Перейти к проекту " + (i + 1));
      (function (i) {
        dot.addEventListener("click", function () {
          goTo(i);
        });
      })(i);
      dotsWrap.appendChild(dot);
    }
  }

  function update() {
    if (!slides.length) return;
    var slide = slides[0];
    var style = window.getComputedStyle(track);
    var gap = parseFloat(style.columnGap || style.gap || "24") || 24;
    var step = slide.getBoundingClientRect().width + gap;
    track.style.transform = "translateX(" + -(step * index) + "px)";
    if (dotsWrap) {
      Array.prototype.forEach.call(dotsWrap.children, function (d, i) {
        d.classList.toggle("is-active", i === index);
      });
    }
  }

  function goTo(i) {
    index = Math.max(0, Math.min(i, maxIndex()));
    update();
  }
  function next() {
    index = index >= maxIndex() ? 0 : index + 1;
    update();
  }
  function prev() {
    index = index <= 0 ? maxIndex() : index - 1;
    update();
  }

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(next, 5000);
  }
  function stopAuto() {
    if (autoTimer) clearInterval(autoTimer);
  }

  if (track && slides.length) {
    nextBtn.addEventListener("click", function () {
      next();
      startAuto();
    });
    prevBtn.addEventListener("click", function () {
      prev();
      startAuto();
    });

    var carouselEl = track.parentElement;
    carouselEl.addEventListener("mouseenter", stopAuto);
    carouselEl.addEventListener("mouseleave", startAuto);

    // touch swipe
    var startX = 0;
    carouselEl.addEventListener(
      "touchstart",
      function (e) {
        startX = e.touches[0].clientX;
        stopAuto();
      },
      { passive: true }
    );
    carouselEl.addEventListener(
      "touchend",
      function (e) {
        var diff = e.changedTouches[0].clientX - startX;
        if (Math.abs(diff) > 50) {
          if (diff < 0) next();
          else prev();
        }
        startAuto();
      },
      { passive: true }
    );

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        buildDots();
        goTo(index);
      }, 150);
    });

    buildDots();
    update();
    startAuto();
  }

  /* ===== Contact modal ===== */
  var modal = document.getElementById("modal");
  var form = document.getElementById("contactForm");
  var formWrap = document.getElementById("modalForm");
  var successWrap = document.getElementById("modalSuccess");
  var successName = document.getElementById("successName");
  var lastFocused = null;

  function openModal() {
    lastFocused = document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    formWrap.hidden = false;
    successWrap.hidden = true;
    var firstInput = document.getElementById("name");
    if (firstInput) setTimeout(function () { firstInput.focus(); }, 60);
  }
  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (form) form.reset();
    clearErrors();
    if (lastFocused) lastFocused.focus();
  }

  document.querySelectorAll("[data-open-modal]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      closeMobileNav();
      openModal();
    });
  });
  document.querySelectorAll("[data-close-modal]").forEach(function (btn) {
    btn.addEventListener("click", closeModal);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  /* ===== Validation + submit ===== */
  function setError(field, message) {
    var input = document.getElementById(field);
    var errorEl = document.querySelector('[data-error-for="' + field + '"]');
    if (errorEl) errorEl.textContent = message || "";
    if (input) input.classList.toggle("is-invalid", !!message);
  }
  function clearErrors() {
    setError("name", "");
    setError("phone", "");
  }

  function validate() {
    var ok = true;
    var name = document.getElementById("name").value.trim();
    var phone = document.getElementById("phone").value.trim();

    if (name.length < 2) {
      setError("name", "Пожалуйста, укажите имя");
      ok = false;
    } else {
      setError("name", "");
    }

    var digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setError("phone", "Введите корректный номер телефона");
      ok = false;
    } else {
      setError("phone", "");
    }
    return ok;
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) return;
      var name = document.getElementById("name").value.trim();
      successName.textContent = name;
      formWrap.hidden = true;
      successWrap.hidden = false;
    });

    // light phone mask
    var phoneInput = document.getElementById("phone");
    phoneInput.addEventListener("input", function () {
      var d = phoneInput.value.replace(/\D/g, "");
      if (d.startsWith("8")) d = "7" + d.slice(1);
      if (!d.startsWith("7")) d = "7" + d;
      d = d.slice(0, 11);
      var out = "+7";
      if (d.length > 1) out += " (" + d.slice(1, 4);
      if (d.length >= 4) out += ") " + d.slice(4, 7);
      if (d.length >= 7) out += "-" + d.slice(7, 9);
      if (d.length >= 9) out += "-" + d.slice(9, 11);
      phoneInput.value = out;
    });
  }
})();
