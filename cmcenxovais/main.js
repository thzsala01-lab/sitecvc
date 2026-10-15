const menuToggle = document.querySelector('[data-menu-toggle]');
const menu = document.querySelector('[data-menu]');
const header = document.querySelector('[data-header]');
const form = document.querySelector('[data-contact-form]');
const feedback = document.querySelector('[data-form-feedback]');
const heroVideo = document.querySelector('.hero__video');
const accountLink = document.querySelector('.header-login');

const playHeroVideo = () => {
  if (!heroVideo) return;
  heroVideo.muted = true;
  heroVideo.play().catch(() => {
    // O atributo autoplay permanece como fallback caso o navegador bloqueie o primeiro pedido.
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', playHeroVideo, { once: true });
} else {
  playHeroVideo();
}

const setMenuState = (open) => {
  if (!menuToggle || !menu) return;
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.querySelector('.sr-only').textContent = open ? 'Fechar menu' : 'Abrir menu';
  menu.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
};

menuToggle?.addEventListener('click', () => {
  setMenuState(menuToggle.getAttribute('aria-expanded') !== 'true');
});

document.querySelectorAll('[data-menu] a').forEach((link) => {
  link.addEventListener('click', () => setMenuState(false));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenuState(false);
});

const handleHeader = () => {
  header?.classList.toggle('is-scrolled', window.scrollY > 25);
};

handleHeader();
window.addEventListener('scroll', handleHeader, { passive: true });

fetch('/api/auth/session', { credentials: 'include' })
  .then((response) => response.ok ? response.json() : null)
  .then((session) => {
    if (!session?.user || !accountLink) return;
    const isAdmin = session.user.role === 'admin';
    accountLink.textContent = isAdmin ? 'Dashboard' : 'Minha conta';
    accountLink.href = isAdmin ? '/admin' : '/login';
  })
  .catch(() => {});

const phoneInput = document.querySelector('#phone');
phoneInput?.addEventListener('input', (event) => {
  const digits = event.target.value.replace(/\D/g, '').slice(0, 11);
  const areaCode = digits.slice(0, 2);
  const localNumber = digits.slice(2);
  let formatted = digits;
  if (digits.length > 2) formatted = `(${areaCode}) ${localNumber}`;
  if (digits.length > 6 && digits.length <= 10) formatted = `(${areaCode}) ${localNumber.slice(0, 4)}-${localNumber.slice(4)}`;
  if (digits.length > 10) formatted = `(${areaCode}) ${localNumber.slice(0, 5)}-${localNumber.slice(5)}`;
  event.target.value = formatted;
});

const rules = {
  name: (value) => value.trim().length >= 3 ? '' : 'Informe seu nome completo.',
  phone: (value) => value.replace(/\D/g, '').length >= 10 ? '' : 'Informe um WhatsApp válido.',
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Informe um e-mail válido.',
  interest: (value) => value ? '' : 'Selecione o seu interesse.',
  message: (value) => value.trim().length >= 10 ? '' : 'Conte um pouco mais para podermos ajudar.',
  consent: (_, field) => field.checked ? '' : 'É necessário concordar com o contato para continuar.'
};

const clearFieldError = (field) => {
  field.removeAttribute('aria-invalid');
  const error = form?.querySelector(`[data-error-for="${field.name}"]`);
  if (error) error.textContent = '';
};

const setFieldError = (field, message) => {
  const error = form?.querySelector(`[data-error-for="${field.name}"]`);
  field.setAttribute('aria-invalid', 'true');
  if (error) error.textContent = message;
};

Object.keys(rules).forEach((name) => {
  const field = form?.elements.namedItem(name);
  field?.addEventListener('input', () => clearFieldError(field));
  field?.addEventListener('change', () => clearFieldError(field));
});

const showFeedback = (message, type = 'default') => {
  if (!feedback) return;
  feedback.className = `form-feedback is-visible${type === 'error' ? ' form-feedback--error' : ''}`;
  feedback.textContent = message;
  feedback.focus();
};

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  feedback?.classList.remove('is-visible', 'form-feedback--error');
  feedback && (feedback.textContent = '');

  if (form.elements.website.value.trim()) return;

  let firstInvalid = null;
  Object.entries(rules).forEach(([name, rule]) => {
    const field = form.elements.namedItem(name);
    const message = rule(field.value, field);
    if (message) {
      setFieldError(field, message);
      if (!firstInvalid) firstInvalid = field;
    } else {
      clearFieldError(field);
    }
  });

  if (firstInvalid) {
    firstInvalid.focus();
    showFeedback('Revise os campos destacados para concluir o cadastro.', 'error');
    return;
  }

  const submitButton = form.querySelector('[type="submit"]');
  const originalLabel = submitButton?.innerHTML;
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando cadastro…';
  }

  const data = new FormData(form);
  const payload = Object.fromEntries(data.entries());
  payload.consent = form.elements.consent.checked;

  try {
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = response.status === 204 ? { ok: true } : await response.json();
    if (!response.ok) throw new Error(result.error || 'Não foi possível registrar seus dados.');

    form.reset();
    showFeedback('Cadastro recebido! Nossa equipe retornará pelo WhatsApp ou e-mail informado.');
  } catch (error) {
    showFeedback(error.message || 'Não foi possível concluir o cadastro. Tente novamente.', 'error');
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = originalLabel;
    }
  }
});

document.querySelectorAll('[data-interest]').forEach((link) => {
  link.addEventListener('click', () => {
    const select = document.querySelector('#interest');
    if (select) select.value = link.dataset.interest;
  });
});

const revealItems = document.querySelectorAll('[data-reveal]');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

document.querySelector('[data-year]').textContent = new Date().getFullYear();
