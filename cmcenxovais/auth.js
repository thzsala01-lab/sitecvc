const viewByPath = {
  '/login': 'login',
  '/cadastro': 'register',
  '/esqueci-senha': 'forgot',
  '/redefinir-senha': 'reset',
};

const currentView = viewByPath[window.location.pathname] || 'login';
const feedback = document.querySelector('[data-auth-feedback]');
const panels = document.querySelectorAll('[data-auth-form]');
const headingKicker = document.querySelector('[data-heading-kicker]');
const headingTitle = document.querySelector('[data-heading-title]');
const headingCopy = document.querySelector('[data-heading-copy]');
let csrfToken = '';

const contentByView = {
  login: { kicker: 'Acesso CMC', title: 'Que bom ver você <em>por aqui.</em>', copy: 'Entre com seus dados para continuar.' },
  register: { kicker: 'Criar acesso', title: 'Comece uma nova <em>conexão.</em>', copy: 'Informe seus dados, confirme seu e-mail e aguarde a análise da equipe para liberar o catálogo.' },
  forgot: { kicker: 'Recuperar acesso', title: 'Vamos cuidar da sua <em>senha.</em>', copy: 'Escolha se prefere receber um link seguro por e-mail ou falar com nossa equipe.' },
  reset: { kicker: 'Nova senha', title: 'Seu acesso, <em>renovado.</em>', copy: 'Crie uma senha forte para continuar com segurança.' },
};

function showFeedback(message, type = 'success', extraLink = '') {
  if (!feedback) return;
  feedback.className = `auth-feedback is-visible${type === 'error' ? ' is-error' : ''}`;
  feedback.innerHTML = `${message}${extraLink}`;
  feedback.focus();
}

function clearFeedback() {
  feedback?.classList.remove('is-visible', 'is-error');
  if (feedback) feedback.textContent = '';
}

function safeNext() {
  const next = new URLSearchParams(window.location.search).get('next');
  return ['/', '/catalogo', '/admin'].includes(next) ? next : '/';
}

async function getSession() {
  const response = await fetch('/api/auth/session', { credentials: 'include' });
  const data = await response.json();
  csrfToken = data.csrfToken || '';
  return data.user;
}

async function request(path, payload) {
  if (!csrfToken) await getSession();
  const response = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json', 'x-csrf-token': csrfToken },
    body: JSON.stringify(payload),
  });
  const data = response.status === 204 ? { ok: true } : await response.json();
  if (!response.ok) {
    const error = new Error(data.error || 'Não foi possível concluir a solicitação.');
    Object.assign(error, data);
    throw error;
  }
  return data;
}

function setLoading(form, loading) {
  const button = form.querySelector('[type="submit"]');
  if (!button) return () => {};
  const label = button.innerHTML;
  button.disabled = loading;
  if (loading) button.textContent = 'Aguarde…';
  return () => { button.disabled = false; button.innerHTML = label; };
}

function configureView() {
  panels.forEach((panel) => { panel.hidden = panel.dataset.authForm !== currentView; });
  const content = contentByView[currentView];
  if (content) {
    headingKicker.textContent = content.kicker;
    headingTitle.innerHTML = content.title;
    headingCopy.textContent = content.copy;
  }
  const verified = new URLSearchParams(window.location.search).get('verified');
  const review = new URLSearchParams(window.location.search).get('review');
  if (verified === '1') showFeedback('E-mail confirmado. Agora você já pode entrar na sua conta.');
  if (verified === 'invalid') showFeedback('Este link expirou ou já foi utilizado. Solicite um novo cadastro.', 'error');
  if (review === 'pending') showFeedback('Seu cadastro está em análise pela equipe CMC. Assim que for aprovado, o catálogo será liberado para você.');
}

const phoneInput = document.querySelector('#form-register input[name="phone"]');
phoneInput?.addEventListener('input', (event) => {
  const digits = event.target.value.replace(/\D/g, '').slice(0, 11);
  const formatted = digits.length > 10 ? `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}` : digits.length > 6 ? `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}` : digits.length > 2 ? `(${digits.slice(0, 2)}) ${digits.slice(2)}` : digits;
  event.target.value = formatted;
});

document.querySelector('#form-register input[name="documentNumber"]')?.addEventListener('input', (event) => {
  const digits = event.target.value.replace(/\D/g, '').slice(0, 14);
  const formatted = digits.length <= 11
    ? digits.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    : digits.replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  event.target.value = formatted;
});

document.querySelector('#form-login')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearFeedback();
  const form = event.currentTarget;
  const restore = setLoading(form, true);
  try {
    const result = await request('/api/auth/login', {
      email: form.elements.email.value,
      password: form.elements.password.value,
      next: safeNext(),
    });
    window.location.assign(result.redirect || '/');
  } catch (error) {
    const resendLink = error.needsVerification ? ' <button class="auth-inline-button" type="button" data-resend-verification>Reenviar confirmação</button>' : '';
    showFeedback(`${error.message}${resendLink}`, 'error');
  } finally {
    restore();
  }
});

document.querySelector('#form-register')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearFeedback();
  const form = event.currentTarget;
  if (form.elements.password.value !== form.elements.passwordConfirm.value) {
    showFeedback('As duas senhas precisam ser iguais.', 'error');
    form.elements.passwordConfirm.focus();
    return;
  }
  const restore = setLoading(form, true);
  try {
    const result = await request('/api/auth/register', {
      name: form.elements.name.value,
      email: form.elements.email.value,
      phone: form.elements.phone.value,
      documentNumber: form.elements.documentNumber.value,
      password: form.elements.password.value,
      consent: form.elements.consent.checked,
      website: form.elements.website.value,
    });
    form.reset();
    showFeedback(`${result.message} <a href="/login">Ir para o login</a>`);
  } catch (error) {
    showFeedback(error.message, 'error');
  } finally {
    restore();
  }
});

document.querySelector('#form-forgot')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearFeedback();
  const form = event.currentTarget;
  const restore = setLoading(form, true);
  try {
    const result = await request('/api/auth/forgot-password', {
      email: form.elements.email.value,
      channel: form.elements.channel.value,
    });
    const whatsappLink = result.whatsappUrl ? ` <a href="${result.whatsappUrl}" target="_blank" rel="noreferrer">Abrir WhatsApp</a>` : '';
    showFeedback(`${result.message}${whatsappLink}`);
  } catch (error) {
    showFeedback(error.message, 'error');
  } finally {
    restore();
  }
});

document.querySelector('#form-reset')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearFeedback();
  const form = event.currentTarget;
  const token = new URLSearchParams(window.location.search).get('token');
  if (!token) {
    showFeedback('Link de recuperação inválido. Solicite uma nova senha.', 'error');
    return;
  }
  if (form.elements.password.value !== form.elements.passwordConfirm.value) {
    showFeedback('As duas senhas precisam ser iguais.', 'error');
    return;
  }
  const restore = setLoading(form, true);
  try {
    const result = await request('/api/auth/reset-password', { token, password: form.elements.password.value });
    showFeedback(`${result.message} <a href="/login">Fazer login</a>`);
    form.reset();
  } catch (error) {
    showFeedback(error.message, 'error');
  } finally {
    restore();
  }
});

feedback?.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-resend-verification]');
  if (!button) return;
  const email = document.querySelector('#form-login input[name="email"]')?.value;
  if (!email) return showFeedback('Informe seu e-mail no login para reenviar a confirmação.', 'error');
  button.disabled = true;
  try {
    const result = await request('/api/auth/resend-verification', { email });
    showFeedback(result.message);
  } catch (error) {
    showFeedback(error.message, 'error');
  }
});

configureView();
getSession().catch(() => showFeedback('Não foi possível preparar o acesso agora. Atualize a página e tente novamente.', 'error'));
