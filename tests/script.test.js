import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

// Minimal DOM fixture matching the structure script.js expects
const HTML = `
<main>
  <section id="home"></section>
  <section id="about"></section>
  <nav class="nav">
    <a href="#home"></a>
    <a href="#about"></a>
  </nav>
  <button id="mobile-toggle"></button>
  <nav id="site-nav"><a href="#home"></a></nav>
  <div class="progress-bar"></div>
  <span id="rotating-word">Safety Leadership</span>
  <section class="achievements">
    <span data-target="100">0</span>
  </section>
  <form class="contact-form">
    <p class="form-note" style="opacity:0"></p>
  </form>
</main>`;

let observers = [];

beforeEach(() => {
  document.body.innerHTML = HTML;
  observers = [];

  // Stub IntersectionObserver so we can trigger callbacks manually
  class FakeIntersectionObserver {
    constructor(callback) {
      this.callback = callback;
      this.targets = [];
      observers.push(this);
    }
    observe(target) {
      this.targets.push(target);
    }
    unobserve(target) {
      this.targets = this.targets.filter((t) => t !== target);
    }
    disconnect() {
      this.targets = [];
    }
    trigger(entries) {
      this.callback(entries, this);
    }
  }
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  document.body.innerHTML = '';
});

async function loadScript() {
  await import('../script.js');
  await Promise.resolve();
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('stat counter', () => {
  it('eases towards the data-target and validates NaN targets', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    await loadScript();

    const statObserver = observers.find((o) => o.targets.some((t) => t.classList.contains('achievements')));
    expect(statObserver).toBeDefined();

    const counter = document.querySelector('[data-target]');
    const nowSpy = vi.spyOn(performance, 'now').mockReturnValue(0);
    statObserver.trigger([{ isIntersecting: true, target: document.querySelector('.achievements') }]);

    // Invalid target should be ignored (no NaN written)
    counter.dataset.target = 'not-a-number';
    statObserver.trigger([{ isIntersecting: true, target: document.querySelector('.achievements') }]);

    counter.dataset.target = '100';
    statObserver.trigger([{ isIntersecting: true, target: document.querySelector('.achievements') }]);

    // Advance to mid-animation then to completion
    nowSpy.mockReturnValue(700);
    await flush();
    const midValue = Number(counter.firstChild.textContent);
    expect(midValue).toBeGreaterThan(0);
    expect(midValue).toBeLessThanOrEqual(100);

    nowSpy.mockReturnValue(2000);
    await flush();
    expect(Number(counter.firstChild.textContent)).toBe(100);

    vi.useRealTimers();
    nowSpy.mockRestore();
  });
});
describe('active link tracking', () => {
  it('marks the nav link matching the current section and skips redundant writes', async () => {
    await loadScript();

    const sections = document.querySelectorAll('main > section[id]');
    const about = sections[1];
    about.offsetTop = 1000;
    about.offsetHeight = 500;

    Object.defineProperty(window, 'scrollY', { value: 1100, configurable: true, writable: true });
    window.dispatchEvent(new Event('scroll'));
    await new Promise((r) => requestAnimationFrame(() => r()));
    await flush();

    const links = document.querySelectorAll('.nav a');
    expect(links[1].classList.contains('active')).toBe(true);
    expect(links[0].classList.contains('active')).toBe(false);

    // Scroll again within the same section: active state stays, no thrash
    Object.defineProperty(window, 'scrollY', { value: 1200, configurable: true, writable: true });
    window.dispatchEvent(new Event('scroll'));
    await new Promise((r) => requestAnimationFrame(() => r()));

    expect(links[1].classList.contains('active')).toBe(true);
    expect(links[0].classList.contains('active')).toBe(false);
  });
});

describe('form handler', () => {
  it('shows success note, resets form, and fades the note after 5s', async () => {
    vi.useFakeTimers();
    await loadScript();

    const form = document.querySelector('.contact-form');
    const note = form.querySelector('.form-note');
    form.checkValidity = () => true;
    form.reset = vi.fn();

    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(note.textContent).toContain('Terima kasih');
    expect(note.style.opacity).toBe('1');
    expect(form.reset).toHaveBeenCalled();

    vi.advanceTimersByTime(5000);
    expect(note.style.opacity).toBe('0');

    vi.useRealTimers();
  });

  it('shows an error note and does not reset when the form is invalid', async () => {
    await loadScript();

    const form = document.querySelector('.contact-form');
    const note = form.querySelector('.form-note');
    form.checkValidity = () => false;
    form.reset = vi.fn();
    form.reportValidity = vi.fn();

    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(note.textContent).toContain('lengkapi');
    expect(form.reset).not.toHaveBeenCalled();
    expect(form.reportValidity).toHaveBeenCalled();
  });
});
