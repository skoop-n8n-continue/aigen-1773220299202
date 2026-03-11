// ====================================================
// DESIGN DECISION: How many products does this template
// show at once? Set this to match layout design.
// ====================================================
const PRODUCTS_PER_CYCLE = 1; // Show one product at a time for maximum "Hero" impact

let PRODUCTS = [];
let currentBatch = 0;

// Register GSAP plugins
gsap.registerPlugin(SplitText, CustomEase);

// Set Custom Ease for premium motion
CustomEase.create("premiumOut", "M0,0 C0.1,0.9 0.2,1 1,1");
CustomEase.create("premiumIn", "M0,0 C0.8,0 0.9,0.1 1,1");
CustomEase.create("elasticOut", "M0,0 C0,0 0.1,1.1 1,1");

async function loadProducts() {
  try {
    const response = await fetch('./products.json');
    const data = await response.json();
    PRODUCTS = data.products || data || [];
  } catch (error) {
    console.error('Failed to load products.json:', error);
    PRODUCTS = [];
  }

  if (PRODUCTS.length > 0) {
    startCycle();
  } else {
    console.warn("No products found to animate.");
  }
  startBackgroundAnimations();
}

function getBatch(batchIndex) {
  const start = (batchIndex * PRODUCTS_PER_CYCLE) % Math.max(PRODUCTS.length, 1);
  const batch = [];
  for (let i = 0; i < PRODUCTS_PER_CYCLE; i++) {
    if (PRODUCTS.length > 0) {
      batch.push(PRODUCTS[(start + i) % PRODUCTS.length]);
    }
  }
  return batch;
}

function renderBatch(products) {
  const container = document.getElementById('products-container');
  container.innerHTML = '';

  products.forEach((product, index) => {
    const productEl = document.createElement('div');
    productEl.className = 'product';
    productEl.dataset.index = index;

    // Formatting the price and parsing values
    const originalPrice = parseFloat(product.price).toFixed(2);
    const discountedPrice = product.discounted_price ? parseFloat(product.discounted_price).toFixed(2) : (originalPrice - (originalPrice * 0.1)).toFixed(2);

    // Fallback logic for THC if not provided explicitly in lab_thc_value
    const thcValue = product.lab_thc_value || (product.lab_thca_value ? product.lab_thca_value : 20.0);
    const thcUnit = product.lab_thc_unit || '%';
    const thcDisplay = `${thcValue}${thcUnit}`;
    const thcPercent = Math.min((parseFloat(thcValue) / (thcUnit === '%' ? 40 : 100)) * 100, 100);

    productEl.innerHTML = `
      <div class="product-details">
        <div class="brand-name">${product.brand || product.vendor}</div>
        <div class="product-name">${product.name}</div>

        <div class="pricing-block">
          <div class="original-price">
            $<span class="orig-num">${originalPrice}</span>
            <div class="strikethrough"></div>
          </div>
          <div class="discounted-price">
            <span class="currency">$</span><span class="disc-num">${discountedPrice}</span>
          </div>
        </div>

        <div class="thc-stats">
          <div class="thc-label">THC</div>
          <div class="thc-bar-container">
            <div class="thc-bar-fill" data-percent="${thcPercent}"></div>
          </div>
          <div class="thc-value-text">${thcDisplay}</div>
        </div>
      </div>

      <div class="product-visual">
        <div class="glow-ring"></div>
        <div class="product-image-wrapper">
          <img class="product-image" src="${product.image_url}" alt="${product.name}">
        </div>
      </div>
    `;

    container.appendChild(productEl);
  });
}

function animateCycle(batchIndex) {
  const batch = getBatch(batchIndex);
  renderBatch(batch);

  const container = document.querySelector('.product');

  // Elements to animate
  const brandName = container.querySelector('.brand-name');
  const productName = container.querySelector('.product-name');
  const originalPrice = container.querySelector('.original-price');
  const strikethrough = container.querySelector('.strikethrough');
  const discountedPrice = container.querySelector('.disc-num');
  const discountCurrency = container.querySelector('.currency');
  const thcContainer = container.querySelector('.thc-stats');
  const thcBarFill = container.querySelector('.thc-bar-fill');
  const thcPercent = parseFloat(thcBarFill.dataset.percent) || 50;

  const imageWrapper = container.querySelector('.product-image-wrapper');
  const glowRing = container.querySelector('.glow-ring');

  // Prepare text splits
  const splitProductName = new SplitText(productName, { type: "words,chars" });
  const splitBrandName = new SplitText(brandName, { type: "chars" });

  // Initial states
  gsap.set([brandName, productName, originalPrice, discountedPrice, discountCurrency, thcContainer], { opacity: 0 });
  gsap.set(splitProductName.chars, { opacity: 0, y: 50, rotationX: -90 });
  gsap.set(splitBrandName.chars, { opacity: 0, x: -20 });
  gsap.set(imageWrapper, { y: -200, scale: 0.8, opacity: 0, rotationZ: 10 });
  gsap.set(glowRing, { scale: 0, opacity: 0 });
  gsap.set(strikethrough, { width: 0 });
  gsap.set(thcBarFill, { width: '0%' });

  // Main Choreography Timeline
  const tl = gsap.timeline({
    onComplete: () => {
      splitProductName.revert();
      splitBrandName.revert();
      animateCycle(batchIndex + 1);
    }
  });

  // ACT 1: ENTRANCE (0s - 2s)
  tl.addLabel("entrance", 0);

  // Product Drops in
  tl.to(imageWrapper, {
    y: 0,
    scale: 1,
    opacity: 1,
    rotationZ: 0,
    duration: 1.5,
    ease: "elasticOut"
  }, "entrance");

  tl.to(glowRing, {
    scale: 1,
    opacity: 1,
    duration: 1.2,
    ease: "premiumOut"
  }, "entrance+=0.2");

  // Brand Name Reveals
  tl.to(brandName, { opacity: 1, duration: 0.1 }, "entrance+=0.3");
  tl.to(splitBrandName.chars, {
    opacity: 1,
    x: 0,
    duration: 0.6,
    stagger: 0.05,
    ease: "premiumOut"
  }, "entrance+=0.3");

  // Product Name Reveals
  tl.to(productName, { opacity: 1, duration: 0.1 }, "entrance+=0.5");
  tl.to(splitProductName.chars, {
    opacity: 1,
    y: 0,
    rotationX: 0,
    duration: 0.8,
    stagger: 0.02,
    ease: "back.out(1.7)"
  }, "entrance+=0.5");

  // ACT 2: THE PITCH (2s - 7s)
  tl.addLabel("pitch", 2.0);

  // Start subtle hover for product
  gsap.to(imageWrapper, {
    y: -20,
    rotationZ: -2,
    duration: 3,
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut"
  });

  gsap.to(glowRing, {
    scale: 1.05,
    opacity: 0.7,
    duration: 2,
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut"
  });

  // Reveal Original Price
  tl.to(originalPrice, {
    opacity: 1,
    x: 0,
    duration: 0.5,
    ease: "power2.out"
  }, "pitch");

  // Strike through the original price
  tl.to(strikethrough, {
    width: '110%',
    duration: 0.4,
    ease: "power4.inOut"
  }, "pitch+=0.6");

  // Flash in the Discounted Price
  tl.fromTo([discountCurrency, discountedPrice],
    { scale: 2, opacity: 0, color: "#FFFFFF" },
    { scale: 1, opacity: 1, color: "#F5F5F5", duration: 0.8, ease: "elasticOut", stagger: 0.1 }
  , "pitch+=0.8");

  // Reveal THC Stats
  tl.to(thcContainer, {
    opacity: 1,
    y: 0,
    duration: 0.5,
    ease: "power2.out"
  }, "pitch+=1.2");

  // Fill the THC bar
  tl.to(thcBarFill, {
    width: `${thcPercent}%`,
    duration: 1.5,
    ease: "premiumOut"
  }, "pitch+=1.4");

  // Idle time (Hold for reading)
  tl.to({}, { duration: 3.0 }); // 7s total

  // ACT 3: EXIT (7s - 8s)
  tl.addLabel("exit", "+=0");

  tl.to(splitProductName.chars, {
    opacity: 0,
    x: 50,
    duration: 0.4,
    stagger: -0.01, // backward stagger
    ease: "power2.in"
  }, "exit");

  tl.to([brandName, originalPrice, discountedPrice, discountCurrency, thcContainer, strikethrough], {
    opacity: 0,
    x: 50,
    duration: 0.5,
    stagger: 0.05,
    ease: "power2.in"
  }, "exit+=0.2");

  tl.to(imageWrapper, {
    x: -300,
    opacity: 0,
    scale: 0.5,
    rotationZ: -45,
    duration: 0.8,
    ease: "premiumIn"
  }, "exit");

  tl.to(glowRing, {
    scale: 0,
    opacity: 0,
    duration: 0.6,
    ease: "power2.in"
  }, "exit");
}

function startBackgroundAnimations() {
  // Parallax UI Layer Background Elements
  gsap.fromTo('.brand-tagline',
    { opacity: 0, y: -20 },
    { opacity: 0.9, y: 0, duration: 2, ease: "power2.out" }
  );
  gsap.fromTo('.northeast-logo',
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 2, ease: "power2.out", delay: 0.5 }
  );

  // Continuous background smoke drift
  gsap.to('.smoke-1', {
    x: "-10%",
    y: "5%",
    scale: 1.1,
    duration: 20,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut"
  });

  gsap.to('.smoke-2', {
    x: "10%",
    y: "-5%",
    scale: 1.15,
    duration: 25,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut"
  });

  // Foreground embers drift
  gsap.to('.particle-layer', {
    y: "-20%",
    x: "10%",
    duration: 15,
    repeat: -1,
    ease: "none"
  });
}

function startCycle() {
  animateCycle(0);
}

window.addEventListener('DOMContentLoaded', loadProducts);