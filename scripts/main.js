document.documentElement.classList.add("js");
// ---- Image settings ---------------------------------------------------
// Photos live in the /images folder. Each product lists the file names (without
// the ending) to look for. The page tries .jpg, .jpeg, .png, .webp in order and
// falls back to images/placeholder.svg if nothing is found.
const IMAGE_DIR = "images/";
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const PLACEHOLDER = IMAGE_DIR + "placeholder.svg";

const products = [
  { id: "tswana-chicken", name: "Tswana chicken", category: "meat", type: "Chicken", price: 150, unit: "each", status: "Farm-raised", images: ["tswana-chicken", "tswana"] },
  { id: "broiler", name: "Broiler chicken", category: "meat", type: "Chicken", price: 150, unit: "each", status: "Farm-raised", images: ["broiler"] },
  { id: "goat", name: "Goat", category: "meat", type: "Small stock", price: 1500, unit: "each", status: "Ask us first", images: ["goats", "goat"] },
  { id: "sheep", name: "Sheep", category: "meat", type: "Small stock", price: 1500, unit: "each", status: "Ask us first", images: ["sheep"] },
  { id: "cattle", name: "Cattle", category: "meat", type: "Livestock", price: null, unit: "per head", status: "Ask us first", images: ["cattte", "cattle"] },
  { id: "lettuce", name: "Lettuce", category: "vegetables", type: "Vegetables", price: 10, unit: "per head", status: "Fresh pick", images: ["lettuce"] },
  { id: "cabbage", name: "Cabbage", category: "vegetables", type: "Vegetables", price: 15, unit: "per head", status: "Fresh pick", images: ["cabbage"] },
  { id: "rape", name: "Rape", category: "vegetables", type: "Vegetables", price: 10, unit: "per bunch", status: "Fresh pick", images: ["rape"] },
  { id: "green-pepper", name: "Green pepper", category: "vegetables", type: "Vegetables", price: 250, unit: "per crate", status: "Fresh pick", images: ["green-pepper"] },
  { id: "onions", name: "Onions", category: "vegetables", type: "Vegetables", price: 250, unit: "per crate", status: "Seasonal", images: ["onions", "onion"] },
  { id: "potatoes", name: "Potatoes", category: "vegetables", type: "Vegetables", price: null, unit: "per bag", status: "Ask us first", images: ["potatoes"] },
  { id: "beetroot", name: "Beetroot", category: "vegetables", type: "Vegetables", price: 250, unit: "per crate", status: "Fresh pick", images: ["beetroot"] },
  { id: "tomatoes", name: "Tomatoes", category: "vegetables", type: "Vegetables", price: 300, unit: "per crate", status: "Fresh pick", images: ["tomatoes"] },
  { id: "watermelon", name: "Watermelon", category: "vegetables", type: "Vegetables", price: 80, unit: "each", status: "Seasonal", images: ["water-melon", "watermelon"] },
  { id: "makomane", name: "Makomane", category: "vegetables", type: "Vegetables", price: 10, unit: "each", status: "Fresh pick", images: ["makgomane", "makomane"] },
  { id: "maize", name: "Maize cob", category: "vegetables", type: "Crops", price: 10, unit: "each", status: "Seasonal", images: ["maize-cob", "maize"] },
  { id: "chillies", name: "Chillies", category: "vegetables", type: "Vegetables", price: 40, unit: "per kg", status: "Fresh pick", images: ["chillies"] },
];

const basket = new Map();
const resolvedImages = new Map(); // product id -> image path that worked
const grid = document.querySelector("#product-grid");
const summaryList = document.querySelector("#summary-list");
const summaryEmpty = document.querySelector("#summary-empty");
const summaryTotal = document.querySelector("#summary-total");
const itemCount = document.querySelector("#item-count");
const submitButton = document.querySelector("#submit-order");
const feedback = document.querySelector("#form-feedback");
const productById = new Map(products.map((product) => [product.id, product]));
const formatPrice = (amount) => new Intl.NumberFormat("en-BW", { style: "currency", currency: "BWP", minimumFractionDigits: 2 }).format(amount).replace("BWP", "P");
const iconArrow = '<span aria-hidden="true">↗</span>';
const activeFilter = () => document.querySelector(".filter-chip.is-active")?.dataset.filter || "all";

const imageCandidates = (product) => product.images.flatMap((base) => IMAGE_EXTENSIONS.map((ext) => `${IMAGE_DIR}${base}.${ext}`));

// Try the next file name when an image is missing; settle on the placeholder at the end.
document.addEventListener("error", (event) => {
  const img = event.target;
  if (!(img instanceof HTMLImageElement) || !img.dataset.candidates) return;
  const list = img.dataset.candidates.split("|");
  const next = Number(img.dataset.try || 0) + 1;
  if (next < list.length) {
    img.dataset.try = next;
    img.src = list[next];
  } else {
    img.dataset.candidates = "";
    img.classList.add("is-placeholder");
    resolvedImages.set(img.dataset.id, PLACEHOLDER);
    img.src = PLACEHOLDER;
  }
}, true);
document.addEventListener("load", (event) => {
  const img = event.target;
  if (!(img instanceof HTMLImageElement) || !img.dataset.candidates) return;
  const list = img.dataset.candidates.split("|");
  resolvedImages.set(img.dataset.id, list[Number(img.dataset.try || 0)]);
}, true);

function productImage(product) {
  const known = resolvedImages.get(product.id);
  if (known) return `<img class="product-photo${known === PLACEHOLDER ? " is-placeholder" : ""}" src="${known}" alt="${product.name}" loading="lazy">`;
  const list = imageCandidates(product);
  return `<img class="product-photo" src="${list[0]}" alt="${product.name}" loading="lazy" data-id="${product.id}" data-try="0" data-candidates="${list.join("|")}">`;
}

function renderProducts(filter = "all") {
  const visibleProducts = products.filter((product) => filter === "all" || product.category === filter);
  grid.innerHTML = visibleProducts.map((product, index) => {
    const quantity = basket.get(product.id) || 0;
    const priceLabel = product.price === null ? "Ask for price" : `${formatPrice(product.price)} <small>${product.unit}</small>`;
    return `<article class="product-card tone-${product.category}" style="--card-delay:${index * 35}ms">
      <div class="product-visual">
        ${productImage(product)}
        <span class="product-status">${product.status}</span>
        <span class="visual-caption">${product.category === "meat" ? "RAISED ON THE FARM" : "IN SEASON"}</span>
      </div>
      <div class="product-info">
        <div class="product-type">${product.type}</div>
        <h3>${product.name}</h3>
        <div class="product-price">${priceLabel}</div>
        <div class="product-controls">
          <div class="stepper" aria-label="Quantity for ${product.name}">
            <button type="button" class="qty-button" data-action="decrease" data-id="${product.id}" aria-label="Remove one ${product.name}" ${quantity === 0 ? "disabled" : ""}>−</button>
            <output class="qty-value" aria-live="polite" aria-label="${quantity} ${product.unit}">${quantity}</output>
            <button type="button" class="qty-button" data-action="increase" data-id="${product.id}" aria-label="Add one ${product.name}">+</button>
          </div>
          <button class="add-button" type="button" data-action="add" data-id="${product.id}" aria-label="Add ${product.name} to order">${quantity ? "Added" : "Add"} ${iconArrow}</button>
        </div>
      </div>
    </article>`;
  }).join("");
}

function setQuantity(id, amount) {
  const next = Math.max(0, (basket.get(id) || 0) + amount);
  if (next === 0) basket.delete(id);
  else basket.set(id, next);
  renderProducts(activeFilter());
  renderSummary();
  feedback.textContent = "";
}

function renderSummary() {
  const chosen = [...basket.entries()].map(([id, quantity]) => ({ product: productById.get(id), quantity }));
  const count = chosen.reduce((sum, row) => sum + row.quantity, 0);
  const knownTotal = chosen.reduce((sum, row) => sum + (row.product.price || 0) * row.quantity, 0);
  const hasUnpriced = chosen.some((row) => row.product.price === null);
  const countText = `${count} ${count === 1 ? "item" : "items"}`;
  itemCount.textContent = countText;
  document.querySelector("#mobile-count").textContent = countText;
  document.querySelector("#mobile-total").textContent = `${formatPrice(knownTotal)} estimated`;
  summaryTotal.textContent = hasUnpriced ? `${formatPrice(knownTotal)}+` : formatPrice(knownTotal);
  summaryEmpty.hidden = chosen.length > 0;
  submitButton.disabled = chosen.length === 0;
  summaryList.innerHTML = chosen.map(({ product, quantity }) => `<div class="summary-row">
    <span class="summary-product"><b>${product.name}</b><small>${product.price === null ? "Price to confirm" : `${formatPrice(product.price)} · ${product.unit}`}</small></span>
    <span class="summary-quantity">${quantity} ×</span>
    <strong>${product.price === null ? "—" : formatPrice(product.price * quantity)}</strong>
    <button type="button" class="remove-item" data-action="remove" data-id="${product.id}" aria-label="Remove ${product.name} from order">×</button>
  </div>`).join("");
}

document.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]");
  if (action) {
    const { id } = action.dataset;
    if (action.dataset.action === "increase" || action.dataset.action === "add") setQuantity(id, 1);
    if (action.dataset.action === "decrease") setQuantity(id, -1);
    if (action.dataset.action === "remove") {
      basket.delete(id);
      renderProducts(activeFilter());
      renderSummary();
      feedback.textContent = "";
    }
  }
  const filter = event.target.closest(".filter-chip");
  if (filter) {
    document.querySelectorAll(".filter-chip").forEach((chip) => {
      const active = chip === filter;
      chip.classList.toggle("is-active", active);
      chip.setAttribute("aria-pressed", String(active));
    });
    renderProducts(filter.dataset.filter);
  }
});

document.querySelector("#order-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const chosen = [...basket.entries()].map(([id, quantity]) => ({ product: productById.get(id), quantity }));
  if (!chosen.length) {
    feedback.textContent = "Choose something from the farm stand before continuing.";
    return;
  }
  const name = form.elements.name.value.trim();
  const location = form.elements.location.value.trim();
  const note = form.elements.note.value.trim();
  const total = chosen.reduce((sum, row) => sum + (row.product.price || 0) * row.quantity, 0);
  const hasUnpriced = chosen.some((row) => row.product.price === null);
  const lines = [
    "Dumelang, Milex Farm! I’d like to place an order:",
    "",
    ...chosen.map(({ product, quantity }) => `• ${product.name} — ${quantity} ${product.unit}${product.price === null ? " (please confirm price)" : ` — ${formatPrice(product.price * quantity)}`}`),
    "",
    `Estimated subtotal: ${formatPrice(total)}${hasUnpriced ? " + items to price" : ""}`,
    `Name: ${name}`,
    `Delivery / collection location: ${location}`,
    ...(note ? [`Note: ${note}`] : []),
    "",
    "Please confirm availability, final total and delivery or collection details. Thank you!",
  ];
  // To send straight to the farm's number, use: https://wa.me/26773139502?text=...
  const shareUrl = `https://wa.me/26773139502?text=${encodeURIComponent(lines.join("\n"))}`;
  window.open(shareUrl, "_blank", "noopener,noreferrer");
  feedback.textContent = "Your order message is ready in WhatsApp. Review it there and press send.";
});

const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector("#primary-nav");
menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
  nav.classList.toggle("is-open", !isOpen);
});
nav.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    nav.classList.remove("is-open");
  }
});

document.querySelector("#current-year").textContent = new Date().getFullYear();
renderProducts();
renderSummary();


// ---- Motion: hero parallax, floating motes, scroll reveal ---------------
(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hero = document.querySelector(".hero");
  const media = document.querySelector(".hero-media");
  const motes = document.querySelector("#hero-motes");

  if (!reduced && hero && media) {
    // the photo drifts slower than the page as you scroll
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, hero.offsetHeight);
        media.style.transform = `translate3d(0, ${y * 0.28}px, 0)`;
        ticking = false;
      });
    }, { passive: true });
  }

  if (!reduced && motes) {
    const count = window.innerWidth < 700 ? 9 : 18;
    for (let i = 0; i < count; i++) {
      const mote = document.createElement("span");
      mote.className = "mote";
      mote.style.setProperty("--x", `${Math.random() * 100}%`);
      mote.style.setProperty("--s", `${3 + Math.random() * 6}px`);
      mote.style.setProperty("--d", `${9 + Math.random() * 10}s`);
      mote.style.setProperty("--delay", `${-Math.random() * 16}s`);
      mote.style.setProperty("--drift", `${-40 + Math.random() * 120}px`);
      motes.append(mote);
    }
  }

  const targets = [
    ".intro .section-kicker", ".intro h2", ".intro-copy", ".farm-facts > div",
    ".about-photo", ".about-copy",
    ".catalog-heading", ".catalog-tabs", ".catalog-footnote",
    ".order-intro", ".order-card",
    ".services-heading", ".service-card",
    ".how-layout > div:first-child", ".steps-list li",
    ".contact-inner",
  ];
  const items = [...document.querySelectorAll(targets.join(","))];
  items.forEach((node) => {
    node.classList.add("reveal");
    const siblings = [...node.parentElement.children].filter((c) => c.classList.contains("reveal") || items.includes(c));
    node.style.setProperty("--reveal-delay", `${Math.max(0, siblings.indexOf(node)) * 110}ms`);
  });

  if (reduced || !("IntersectionObserver" in window)) {
    items.forEach((node) => node.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  items.forEach((node) => observer.observe(node));
})();
