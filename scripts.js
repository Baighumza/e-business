// js/scripts.js
// Shared functions for all pages: rendering lists, cart logic (localStorage), UI helpers.

const CART_KEY = 'sc_cart_v1';

/* ---------- Cart API (localStorage) ---------- */
function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('cart read error', e);
    return [];
  }
}
function saveCart(items) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    updateCartCount();
  } catch (e) { console.error('cart save error', e); }
}
function addToCart(courseId, qty = 1) {
  const course = COURSES.find(c => c.id === courseId);
  if (!course) return;
  const items = getCart();
  const idx = items.findIndex(i => i.id === courseId);
  if (idx >= 0) {
    items[idx].qty = items[idx].qty + qty;
  } else {
    items.push({ id: course.id, title: course.title, price: course.price, qty: qty });
  }
  saveCart(items);
}
function removeFromCart(courseId) {
  const items = getCart().filter(i => i.id !== courseId);
  saveCart(items);
}
function updateQty(courseId, qty) {
  const items = getCart().map(i => i.id === courseId ? { ...i, qty: qty } : i);
  // remove if qty <= 0
  const filtered = items.filter(i => i.qty > 0);
  saveCart(filtered);
}
function clearCart() {
  saveCart([]);
}

/* ---------- UI helpers ---------- */
function formatCurrency(n) {
  // simple US dollars formatting
  return '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function updateCartCount() {
  const el = document.querySelectorAll('.cart-count');
  const items = getCart();
  const count = items.reduce((s,i) => s + Number(i.qty), 0);
  el.forEach(node => node.textContent = count);
}

/* ---------- Render course lists (for index and courses page) ---------- */
function renderCourseGrid(containerSelector, list) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  container.innerHTML = '';
  list.forEach(course => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div>
        <div class="meta">${course.lessons} lessons</div>
        <div class="card-title">${escapeHTML(course.title)}</div>
        <div class="small">${escapeHTML(course.short)}</div>
      </div>
      <div class="actions">
        <div class="small">${formatCurrency(course.price)}</div>
        <div>
          <a class="text-btn" href="course.html?id=${encodeURIComponent(course.id)}">View</a>
          <button class="btn add-btn" data-id="${course.id}" style="margin-left:8px">Buy</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  // wire buy buttons
  container.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      addToCart(id, 1);
      // visual feedback
      btn.textContent = 'Added ✓';
      setTimeout(() => btn.textContent = 'Buy', 900);
    });
  });
}

/* ---------- Render single course detail ---------- */
function renderCourseDetailFromQuery() {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const course = COURSES.find(c => c.id === id);
  const wrap = document.getElementById('course-detail-wrap');
  if (!wrap) return;
  if (!course) {
    wrap.innerHTML = '<div class="form"><strong>Course not found</strong></div>';
    return;
  }
  wrap.innerHTML = `
    <div>
      <div class="kicker">Course • ${course.lessons} lessons</div>
      <h1 style="margin-top:6px">${escapeHTML(course.title)}</h1>
      <p class="small" style="margin-top:8px">${escapeHTML(course.description)}</p>
      <div style="margin-top:14px">
        <button id="add-to-cart" class="btn">Add to cart — ${formatCurrency(course.price)}</button>
      </div>
    </div>
    <aside class="form">
      <div style="font-weight:700; font-size:1.1rem">${formatCurrency(course.price)}</div>
      <div class="small" style="margin-top:6px">One-time purchase — lifetime access</div>
      <div style="margin-top:10px">
        <button id="buy-now" class="btn" style="width:100%">Buy & go to cart</button>
      </div>
    </aside>
  `;

  document.getElementById('add-to-cart').addEventListener('click', () => {
    addToCart(course.id, 1);
    alert('Added to cart');
  });
  document.getElementById('buy-now').addEventListener('click', () => {
    addToCart(course.id, 1);
    location.href = 'cart.html';
  });
}

/* ---------- Render cart page ---------- */
function renderCartPage() {
  const listWrap = document.getElementById('cart-list');
  const summaryWrap = document.getElementById('cart-summary');
  if (!listWrap) return;
  const items = getCart();
  if (!items.length) {
    listWrap.innerHTML = '<div class="form center"><p>Your cart is empty.</p><p style="margin-top:8px"><a href="courses.html" class="text-btn">Browse courses</a></p></div>';
    if (summaryWrap) summaryWrap.innerHTML = '';
    updateCartCount();
    return;
  }

  listWrap.innerHTML = '';
  items.forEach(it => {
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <div>
        <div style="font-weight:700">${escapeHTML(it.title)}</div>
        <div class="small">Unit: ${formatCurrency(it.price)}</div>
      </div>
      <div style="display:flex;align-items:center;gap:12px">
        <div class="qty-controls">
          <button class="text-btn qty-dec" data-id="${it.id}">−</button>
          <div class="small" style="min-width:28px; text-align:center">${it.qty}</div>
          <button class="text-btn qty-inc" data-id="${it.id}">+</button>
        </div>
        <div style="text-align:right">
          <div style="font-weight:700">${formatCurrency(it.price * it.qty)}</div>
          <div style="margin-top:6px"><button class="remove-btn" data-id="${it.id}">Remove</button></div>
        </div>
      </div>
    `;
    listWrap.appendChild(el);
  });

  // summary
  const total = items.reduce((s,i)=> s + i.price * i.qty, 0);
  if (summaryWrap) {
    summaryWrap.innerHTML = `
      <div class="form">
        <div class="kicker">Order summary</div>
        <div style="display:flex; justify-content:space-between; margin-top:8px">
          <div class="small">Subtotal</div>
          <div style="font-weight:700">${formatCurrency(total)}</div>
        </div>
        <div style="margin-top:12px">
          <button id="proceed-checkout" class="btn" style="width:100%">Proceed to checkout</button>
        </div>
        <div style="margin-top:8px">
          <button id="clear-cart" class="btn secondary" style="width:100%">Clear cart</button>
        </div>
      </div>
    `;
  }

  // hooks
  listWrap.querySelectorAll('.qty-inc').forEach(b => {
    b.addEventListener('click', () => {
      const id = b.getAttribute('data-id');
      const items = getCart();
      const it = items.find(x => x.id === id);
      if (it) { updateQty(id, it.qty + 1); renderCartPage(); }
    });
  });
  listWrap.querySelectorAll('.qty-dec').forEach(b => {
    b.addEventListener('click', () => {
      const id = b.getAttribute('data-id');
      const items = getCart();
      const it = items.find(x => x.id === id);
      if (it) {
        const newQty = it.qty - 1;
        updateQty(id, newQty);
        renderCartPage();
      }
    });
  });
  listWrap.querySelectorAll('.remove-btn').forEach(b => {
    b.addEventListener('click', () => {
      const id = b.getAttribute('data-id');
      if (confirm('Remove this item?')) {
        removeFromCart(id);
        renderCartPage();
      }
    });
  });

  const proceed = document.getElementById('proceed-checkout');
  if (proceed) proceed.addEventListener('click', () => location.href = 'checkout.html');

  const clearBtn = document.getElementById('clear-cart');
  if (clearBtn) clearBtn.addEventListener('click', () => {
    if (confirm('Clear your cart?')) { clearCart(); renderCartPage(); }
  });

  updateCartCount();
}

/* ---------- Render checkout page ---------- */
function renderCheckoutPage() {
  const items = getCart();
  const summaryWrap = document.getElementById('checkout-summary');
  if (!summaryWrap) return;

  if (!items.length) {
    summaryWrap.innerHTML = '<div class="form center">Cart is empty. <p style="margin-top:8px"><a href="courses.html" class="text-btn">Browse courses</a></p></div>';
    return;
  }

  const total = items.reduce((s,i)=> s + i.price * i.qty, 0);
  summaryWrap.innerHTML = `
    <div class="form">
      <div class="kicker">Payment (simulated)</div>
      <div style="display:flex; justify-content:space-between"><div class="small">Items</div><div class="small">${items.length}</div></div>
      <div style="display:flex; justify-content:space-between; margin-top:8px"><div class="small">Total</div><div style="font-weight:700">${formatCurrency(total)}</div></div>
      <div style="margin-top:12px">
        <button id="fake-pay" class="btn" style="width:100%">Simulate payment</button>
      </div>
    </div>
  `;

  document.getElementById('fake-pay').addEventListener('click', () => {
    // basic form fields
    const fullname = document.getElementById('fullname')?.value || '';
    const email = document.getElementById('email')?.value || '';
    if (!fullname || !email) {
      alert('Please enter name and email in the form.');
      return;
    }
    alert(`Thank you ${fullname}! Payment simulated for ${formatCurrency(total)}. You will receive a confirmation email at ${email} (simulated).`);
    clearCart();
    location.href = 'index.html';
  });
}

/* ---------- Render login page (mock) ---------- */
function renderLoginPage() {
  const form = document.getElementById('login-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = form.querySelector('input[name="email"]').value;
    alert(`Mock login successful for ${email}`);
    location.href = 'index.html';
  });
}

/* ---------- Small helpers ---------- */
function escapeHTML(s) {
  if (!s && s !== 0) return '';
  return String(s).replace(/[&<>"']/g, function (m) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
  });
}

/* ---------- Auto init on all pages ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // cart badge
  updateCartCount();

  // attach to page-specific renders by id presence
  if (document.getElementById('home-courses')) {
    // home page: show first 3 as featured
    renderCourseGrid('#home-courses', COURSES.slice(0,3));
    document.getElementById('all-courses-btn')?.addEventListener('click', ()=> location.href = 'courses.html');
  }

  if (document.getElementById('courses-grid')) {
    renderCourseGrid('#courses-grid', COURSES);
  }

  if (document.getElementById('course-detail-wrap')) {
    renderCourseDetailFromQuery();
  }

  if (document.getElementById('cart-list')) {
    renderCartPage();
  }

  if (document.getElementById('checkout-summary')) {
    renderCheckoutPage();
  }

  if (document.getElementById('login-form')) {
    renderLoginPage();
  }
});
