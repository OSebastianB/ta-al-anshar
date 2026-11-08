/* Panel resize — drag pojok kanan bawah pada kartu dashboard */
(function () {
  var STORE_KEY = "ta_panel_sizes_v1";
  var active = null;

  function loadStore() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }

  function saveStore(store) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch (e) {}
  }

  function pageKey() {
    var page = document.querySelector(".page.active");
    return page ? page.id : "page-unknown";
  }

  function panelKey(el, index) {
    return el.getAttribute("data-resize-id") || pageKey() + "::" + index;
  }

  function applySize(el, size) {
    if (!size) return;
    if (size.w) {
      el.style.width = size.w + "px";
      el.style.maxWidth = "100%";
      el.style.flex = "0 0 auto";
    }
    if (size.h) {
      el.style.height = size.h + "px";
      el.style.minHeight = size.h + "px";
    }
  }

  function ensureHandle(el) {
    if (el.querySelector(":scope > .panel-resize-handle")) return;
    el.classList.add("is-resizable");
    var handle = document.createElement("button");
    handle.type = "button";
    handle.className = "panel-resize-handle";
    handle.title = "Seret untuk ubah ukuran";
    handle.setAttribute("aria-label", "Ubah ukuran panel");
    handle.innerHTML = "<span></span>";
    el.appendChild(handle);

    handle.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var rect = el.getBoundingClientRect();
      active = {
        el: el,
        key: el._resizeKey,
        startX: e.clientX,
        startY: e.clientY,
        startW: rect.width,
        startH: rect.height,
      };
      el.classList.add("is-resizing");
      document.body.classList.add("is-panel-resizing");
      handle.setPointerCapture(e.pointerId);
    });
  }

  function onPointerMove(e) {
    if (!active) return;
    var dx = e.clientX - active.startX;
    var dy = e.clientY - active.startY;
    var parent = active.el.parentElement;
    var maxW = parent ? parent.clientWidth : window.innerWidth;
    var nextW = Math.max(220, Math.min(maxW, Math.round(active.startW + dx)));
    var nextH = Math.max(140, Math.round(active.startH + dy));
    active.el.style.width = nextW + "px";
    active.el.style.maxWidth = "100%";
    active.el.style.flex = "0 0 auto";
    active.el.style.height = nextH + "px";
    active.el.style.minHeight = nextH + "px";
    active._w = nextW;
    active._h = nextH;
  }

  function onPointerUp() {
    if (!active) return;
    var store = loadStore();
    store[active.key] = {
      w: active._w || Math.round(active.el.getBoundingClientRect().width),
      h: active._h || Math.round(active.el.getBoundingClientRect().height),
    };
    saveStore(store);
    active.el.classList.remove("is-resizing");
    document.body.classList.remove("is-panel-resizing");
    active = null;
    window.dispatchEvent(new Event("resize"));
  }

  function enhancePage() {
    var page = document.querySelector(".page.active");
    if (!page) return;
    var store = loadStore();
    var nodes = page.querySelectorAll(".panel, .kpi-card");
    nodes.forEach(function (el, index) {
      if (el.closest(".modal")) return;
      var key = panelKey(el, index);
      el._resizeKey = key;
      ensureHandle(el);
      if (store[key]) applySize(el, store[key]);
    });
  }

  function resetPage() {
    var page = document.querySelector(".page.active");
    if (!page) return;
    var store = loadStore();
    var changed = false;
    page.querySelectorAll(".panel, .kpi-card").forEach(function (el, index) {
      var key = panelKey(el, index);
      if (store[key]) {
        delete store[key];
        changed = true;
      }
      el.style.width = "";
      el.style.height = "";
      el.style.minHeight = "";
      el.style.maxWidth = "";
      el.style.flex = "";
    });
    if (changed) saveStore(store);
    window.dispatchEvent(new Event("resize"));
  }

  document.addEventListener("pointermove", onPointerMove);
  document.addEventListener("pointerup", onPointerUp);
  document.addEventListener("pointercancel", onPointerUp);

  window.PanelResize = {
    enhance: enhancePage,
    resetPage: resetPage,
  };
})();
