// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');
if (toggle && links) {
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
}

// Footer year
document.querySelectorAll('[data-year]').forEach(el => {
  el.textContent = new Date().getFullYear();
});

// Contact form — swap for a real endpoint (e.g. Formspree, Netlify Forms) before launch.
const form = document.querySelector('#contact-form');
if (form) {
  form.addEventListener('submit', e => {
    if (form.getAttribute('action')) return; // real endpoint configured: let it submit
    e.preventDefault();
    const status = form.querySelector('.form-status');
    status.textContent = "Thanks! We'll get back to you within one business day.";
    form.reset();
  });
}
