// ==========================================================================
// Krishananta Wijaya - Motion AI & Interactive Script
// ==========================================================================

// 1. Rotating Focus Words in Hero
const rotatingWords = [
  'Safety Leadership',
  'Risk Intelligence',
  'HSE Management',
  'Data-Driven Safety',
  'AI & Digital Innovation'
];
const rotatingWord = document.querySelector('#rotating-word');
let wordIndex = 0;

if (rotatingWord) {
  rotatingWord.style.transition = 'opacity .35s ease, transform .35s cubic-bezier(0.16, 1, 0.3, 1)';
  let rotationVisible = true;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Pause when the hero scrolls off-screen
  new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      rotationVisible = entry.isIntersecting;
    });
  }, { threshold: 0 }).observe(rotatingWord);

  // Pause when the tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) rotationVisible = true;
  });

  setInterval(() => {
    if (rotationVisible && !document.hidden && !reducedMotion.matches) {
      rotatingWord.style.opacity = '0';
      rotatingWord.style.transform = 'translateY(6px)';
      setTimeout(() => {
        if (!rotationVisible || document.hidden) return;
        wordIndex = (wordIndex + 1) % rotatingWords.length;
        rotatingWord.textContent = rotatingWords[wordIndex];
        rotatingWord.style.opacity = '1';
        rotatingWord.style.transform = 'translateY(0)';
      }, 350);
    }
  }, 3000);
}

// 2. Mobile Navigation Menu Toggle
const mobileToggle = document.querySelector('#mobile-toggle');
const siteNav = document.querySelector('#site-nav');

if (mobileToggle && siteNav) {
  mobileToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('open');
    mobileToggle.classList.toggle('active', isOpen);
    mobileToggle.setAttribute('aria-expanded', String(isOpen));
  });

  const closeMobileNav = () => {
    siteNav.classList.remove('open');
    mobileToggle.classList.remove('active');
    mobileToggle.setAttribute('aria-expanded', 'false');
  };

  // Close menu when clicking nav links
  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMobileNav);
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!siteNav.contains(e.target) && !mobileToggle.contains(e.target) && siteNav.classList.contains('open')) {
      closeMobileNav();
    }
  });
}

// 3. Scroll Reveal Observer
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => {
  revealObserver.observe(element);
});

// 3b. Certification category filtering
const certificationFilters = document.querySelectorAll('[data-cert-filter]');
const certificationCards = document.querySelectorAll('[data-cert-category]');

certificationFilters.forEach((filterButton) => {
  filterButton.addEventListener('click', () => {
    const selectedCategory = filterButton.dataset.certFilter;

    certificationFilters.forEach((button) => {
      const isActive = button === filterButton;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', String(isActive));
    });

    certificationCards.forEach((card) => {
      const shouldShow = selectedCategory === 'all' || card.dataset.certCategory === selectedCategory;
      card.classList.toggle('is-hidden', !shouldShow);
      if (shouldShow) {
        card.classList.remove('visible');
        requestAnimationFrame(() => card.classList.add('visible'));
      }
    });
  });
});

// 4. Animated Stats Counter (Triggered when achievement box is visible)
const statObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.querySelectorAll('[data-target]').forEach((counter) => {
      const target = Number(counter.dataset.target);
      if (!Number.isFinite(target)) return; // Skip malformed/missing data-target
      const duration = 1400;
      const start = performance.now();
      // Prefer the first text node; fall back to the element itself
      const labelNode = counter.firstChild && counter.firstChild.nodeType === 3
        ? counter.firstChild
        : null;

      const update = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // Cubic ease out
        if (labelNode) {
          labelNode.textContent = Math.round(target * eased);
        } else if (counter.firstChild) {
          counter.firstChild.textContent = Math.round(target * eased);
        }
        if (progress < 1) {
          requestAnimationFrame(update);
        }
      };
      requestAnimationFrame(update);
    });
    statObserver.unobserve(entry.target);
  });
}, { threshold: 0.25 });

const achievementSection = document.querySelector('.achievements');
if (achievementSection) {
  statObserver.observe(achievementSection);
}

// 5. Scroll Progress Bar & Active Section Highlight
const sections = document.querySelectorAll('main > section[id]');
const navLinks = document.querySelectorAll('.nav a');
const progressBar = document.querySelector('.progress-bar');

let scrollTicking = false;
let currentId = '';

const updateScrollState = () => {
  scrollTicking = false;

  // Progress bar
  if (progressBar) {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable > 0) {
      progressBar.style.width = `${(window.scrollY / scrollable) * 100}%`;
    }
  }

  // Active navigation link tracking
  let nextId = '';
  sections.forEach((section) => {
    const top = section.offsetTop - 120;
    const height = section.offsetHeight;
    if (window.scrollY >= top && window.scrollY < top + height) {
      nextId = section.getAttribute('id');
    }
  });

  if (nextId !== currentId) {
    currentId = nextId;
    navLinks.forEach((link) => {
      link.classList.remove('active');
      if (currentId && link.getAttribute('href') === `#${currentId}`) {
        link.classList.add('active');
      }
    });
  }
};

window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    scrollTicking = true;
    requestAnimationFrame(updateScrollState);
  }
}, { passive: true });

// 6. Interactive Contact Form Handling
const form = document.querySelector('.contact-form');
if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const note = form.querySelector('.form-note');
    if (!note) {
      form.reset();
      return;
    }

    if (!form.checkValidity()) {
      note.textContent = '⚠ Mohon lengkapi semua kolom yang wajib diisi dengan benar.';
      note.style.opacity = '1';
      form.reportValidity();
      return;
    }

    note.textContent = '✓ Terima kasih! Pesan Anda telah terkirim dan akan segera dihubungi.';
    note.style.opacity = '1';
    form.reset();

    // Fade the success message out after a few seconds
    clearTimeout(note._fadeTimer);
    note._fadeTimer = setTimeout(() => {
      note.style.opacity = '0';
    }, 5000);
  });
}

