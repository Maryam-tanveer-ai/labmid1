/* EatDesi app.js (kept filename as script.js for simplicity) */

const CART_KEY = "cart";

function safeParse(json, fallback) {
  try {
    return JSON.parse(json) ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizeLegacyItem(item) {
  // Legacy shape: { product, price } or { name, price }
  const name = item?.name ?? item?.product ?? "Item";
  const price = Number(item?.price) || 0;
  const id = item?.id ?? String(name).toLowerCase().replace(/\s+/g, "-");
  const qty = Number(item?.qty) || 1;
  const image =
    item?.image ??
    "images/honey.PNG";
  const category = item?.category ?? "Snacks";
  const desc = item?.desc ?? "Desi flavor, freshly prepared.";

  return { id, name, price, qty, image, category, desc };
}

function getCart() {
  const raw = localStorage.getItem(CART_KEY);
  const arr = safeParse(raw, []);
  return Array.isArray(arr) ? arr.map(normalizeLegacyItem) : [];
}

function setCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateNavCartCount();
}

function getCartCount(cart = getCart()) {
  return cart.reduce((acc, it) => acc + (Number(it.qty) || 0), 0);
}

function updateNavCartCount() {
  const el = document.getElementById("navCartCount");
  if (!el) return;
  el.textContent = String(getCartCount());
}

function money(n) {
  const v = Math.max(0, Number(n) || 0);
  return `Rs. ${v.toFixed(0)}`;
}

function addItemToCart(item, qty = 1) {
  const cart = getCart();
  const normalized = normalizeLegacyItem(item);
  const addQty = Math.max(1, Number(qty) || 1);

  const idx = cart.findIndex((x) => x.id === normalized.id);
  if (idx >= 0) {
    cart[idx].qty = (Number(cart[idx].qty) || 0) + addQty;
  } else {
    cart.push({ ...normalized, qty: addQty });
  }
  setCart(cart);
}

function removeItemFromCart(id) {
  const cart = getCart().filter((x) => x.id !== id);
  setCart(cart);
}

function setItemQty(id, qty) {
  const cart = getCart();
  const idx = cart.findIndex((x) => x.id === id);
  if (idx < 0) return;
  const q = Number(qty) || 0;
  if (q <= 0) {
    cart.splice(idx, 1);
  } else {
    cart[idx].qty = q;
  }
  setCart(cart);
}

function calcTotals(cart = getCart()) {
  const subtotal = cart.reduce((acc, it) => acc + (Number(it.price) || 0) * (Number(it.qty) || 0), 0);
  const delivery = subtotal > 0 ? 99 : 0;
  const service = subtotal > 0 ? Math.round(subtotal * 0.02) : 0;
  const total = subtotal + delivery + service;
  return { subtotal, delivery, service, total };
}

function wireAddToCartButtons() {
  document.addEventListener("click", (e) => {
    const btn = e.target?.closest?.("[data-add-to-cart]");
    if (!btn) return;

    const item = {
      id: btn.getAttribute("data-id"),
      name: btn.getAttribute("data-name"),
      price: btn.getAttribute("data-price"),
      image: btn.getAttribute("data-image"),
      category: btn.getAttribute("data-category"),
      desc: btn.getAttribute("data-desc"),
    };

    const qtySelect = btn
      .closest(".price-row")
      ?.querySelector?.("[data-cart-qty]");
    const qty = Number(qtySelect?.value) || 1;
    addItemToCart(item, qty);

    btn.textContent = "Added";
    setTimeout(() => (btn.textContent = "Add"), 700);
  });
}

function mountProductQtyDropdowns() {
  const buttons = Array.from(document.querySelectorAll("[data-add-to-cart]"));
  buttons.forEach((btn) => {
    const row = btn.closest(".price-row");
    if (!row) return;
    if (row.querySelector("[data-cart-qty]")) return;

    const category = (btn.getAttribute("data-category") || "").toLowerCase();
    const name = (btn.getAttribute("data-name") || "").toLowerCase();
    const isJarProduct =
      category.includes("honey") ||
      category.includes("ghee") ||
      name.includes("honey") ||
      name.includes("ghee");
    const singularUnit = isJarProduct ? "jar" : "pack";
    const pluralUnit = `${singularUnit}s`;

    const qty = document.createElement("select");
    qty.className = "qty-dropdown";
    qty.setAttribute("aria-label", "Select quantity");
    qty.setAttribute("data-cart-qty", "true");
    qty.innerHTML = `
      <option value="1">1 ${singularUnit}</option>
      <option value="2">2 ${pluralUnit}</option>
      <option value="3">3 ${pluralUnit}</option>
      <option value="4">4 ${pluralUnit}</option>
      <option value="5">5 ${pluralUnit}</option>
    `;
    row.insertBefore(qty, btn);
  });
}

function wireRevealAnimations() {
  const els = Array.from(document.querySelectorAll(".reveal"));
  if (els.length === 0) return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const ent of entries) {
        if (ent.isIntersecting) ent.target.classList.add("is-visible");
      }
    },
    { threshold: 0.18 }
  );
  els.forEach((el) => io.observe(el));
}

function mountCartList() {
  const host = document.getElementById("cartItems");
  if (!host) return;

  const totalsEl = document.getElementById("cartTotals");
  const emptyEl = document.getElementById("cartEmpty");

  function render() {
    const cart = getCart();
    host.innerHTML = "";

    if (emptyEl) emptyEl.style.display = cart.length ? "none" : "block";

    for (const it of cart) {
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <div class="cart-thumb"><img alt="${it.name}" src="${it.image}"></div>
        <div class="cart-meta">
          <h4>${it.name}</h4>
          <p>${money(it.price)} • <span class="muted">${it.category}</span></p>
          <div class="spacer-10"></div>
          <div class="qty" aria-label="Quantity controls">
            <button type="button" data-qty-minus="${it.id}" aria-label="Decrease quantity">−</button>
            <span>${it.qty}</span>
            <button type="button" data-qty-plus="${it.id}" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <div style="display:grid; gap:10px; justify-items:end">
          <div style="font-weight:900">${money((Number(it.price)||0) * (Number(it.qty)||0))}</div>
          <button type="button" class="btn btn-danger btn-small" data-remove="${it.id}">Remove</button>
        </div>
      `;
      host.appendChild(row);
    }

    if (totalsEl) {
      const t = calcTotals(cart);
      totalsEl.innerHTML = `
        <div class="totals">
          <div class="line"><span>Subtotal</span><strong>${money(t.subtotal)}</strong></div>
          <div class="line"><span>Delivery</span><strong>${money(t.delivery)}</strong></div>
          <div class="line"><span>Service</span><strong>${money(t.service)}</strong></div>
          <div class="line"><span>Total</span><strong>${money(t.total)}</strong></div>
        </div>
      `;
    }
  }

  document.addEventListener("click", (e) => {
    const rm = e.target?.closest?.("[data-remove]");
    if (rm) {
      removeItemFromCart(rm.getAttribute("data-remove"));
      render();
      return;
    }
    const plus = e.target?.closest?.("[data-qty-plus]");
    if (plus) {
      const id = plus.getAttribute("data-qty-plus");
      const cart = getCart();
      const it = cart.find((x) => x.id === id);
      setItemQty(id, (Number(it?.qty) || 0) + 1);
      render();
      return;
    }
    const minus = e.target?.closest?.("[data-qty-minus]");
    if (minus) {
      const id = minus.getAttribute("data-qty-minus");
      const cart = getCart();
      const it = cart.find((x) => x.id === id);
      setItemQty(id, (Number(it?.qty) || 0) - 1);
      render();
      return;
    }
  });

  render();
}

function wireMenuFilters() {
  const host = document.getElementById("menuGrid");
  if (!host) return;

  const chips = Array.from(document.querySelectorAll("[data-filter]"));
  const cards = Array.from(host.querySelectorAll("[data-category]"));

  function apply(filter) {
    host.classList.add("is-leaving");
    window.setTimeout(() => {
      cards.forEach((c) => {
        const cat = c.getAttribute("data-category") || "";
        const show = filter === "All" || cat === filter;
        c.style.display = show ? "" : "none";
      });
      host.classList.remove("is-leaving");
    }, 170);
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.setAttribute("aria-pressed", "false"));
      chip.setAttribute("aria-pressed", "true");
      apply(chip.getAttribute("data-filter") || "All");
    });
  });

  // default filter
  const active = chips.find((c) => c.getAttribute("aria-pressed") === "true") ?? chips[0];
  if (active) apply(active.getAttribute("data-filter") || "All");
}

function wireCheckoutForm() {
  const form = document.getElementById("checkoutForm");
  if (!form) return;

  const paymentSel = document.getElementById("payment");
  const accountWrap = document.getElementById("paymentAccountWrap");
  const accountInput = document.getElementById("paymentAccount");

  function syncPaymentExtra() {
    if (!paymentSel || !accountWrap || !accountInput) return;
    const method = paymentSel.value;
    const needsAccount = method === "Card" || method === "JazzCash" || method === "EasyPaisa";
    accountWrap.classList.toggle("hidden", !needsAccount);
    accountInput.required = needsAccount;
    if (!needsAccount) accountInput.value = "";
  }

  if (paymentSel) paymentSel.addEventListener("change", syncPaymentExtra);
  syncPaymentExtra();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const cart = getCart();
    if (cart.length === 0) {
      alert("Your cart is empty. Please add items from the menu first.");
      return;
    }
    alert("✅ Your order has been placed! (Demo)");
    setCart([]); // clear cart after confirming
    window.location.href = "index.html";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  updateNavCartCount();
  mountProductQtyDropdowns();
  wireAddToCartButtons();
  wireRevealAnimations();
  wireMenuFilters();
  mountCartList();
  wireCheckoutForm();
});