let csrfToken = '';
const feedback = document.querySelector('[data-admin-feedback]');
const table = document.querySelector('[data-leads-table]');
const approvalsTable = document.querySelector('[data-approvals-table]');

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));

function showError(message) {
  feedback.textContent = message;
  feedback.classList.add('is-visible');
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function loadDashboard() {
  feedback.classList.remove('is-visible');
  const sessionResponse = await fetch('/api/auth/session', { credentials: 'include' });
  const session = await sessionResponse.json();
  csrfToken = session.csrfToken || '';
  if (!session.user || session.user.role !== 'admin') {
    window.location.assign('/login?next=/admin');
    return;
  }
  document.querySelector('[data-admin-name]').textContent = session.user.name || session.user.email;

  const response = await fetch('/api/admin/overview', { credentials: 'include' });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) window.location.assign('/login?next=/admin');
    throw new Error('Não foi possível carregar os dados do painel.');
  }
  const data = await response.json();
  Object.entries(data.summary).forEach(([key, value]) => {
    const element = document.querySelector(`[data-metric="${key}"]`);
    if (element) element.textContent = Number(value || 0).toLocaleString('pt-BR');
  });

  if (!data.leads.length) {
    table.innerHTML = '<tr><td colspan="4">Ainda não há leads cadastrados.</td></tr>';
  } else {
    table.innerHTML = data.leads.map((lead) => `
    <tr>
      <td>${escapeHtml(lead.name)}<a href="mailto:${encodeURIComponent(lead.email)}">${escapeHtml(lead.email)}</a><a href="https://wa.me/55${escapeHtml(String(lead.phone).replace(/\D/g, ''))}" target="_blank" rel="noreferrer">${escapeHtml(lead.phone)}</a></td>
      <td>${escapeHtml(lead.interest)}<br /><small>${escapeHtml(lead.status)}</small></td>
      <td>${escapeHtml([lead.city, lead.state].filter(Boolean).join(' / ') || 'Não informado')}</td>
      <td>${formatDate(lead.created_at)}</td>
    </tr>
    `).join('');
  }

  if (!data.pendingUsers?.length) {
    approvalsTable.innerHTML = '<tr><td colspan="4">Não há cadastros aguardando análise.</td></tr>';
  } else {
    approvalsTable.innerHTML = data.pendingUsers.map((user) => `
      <tr>
        <td>${escapeHtml(user.name)}<a href="mailto:${encodeURIComponent(user.email)}">${escapeHtml(user.email)}</a>${user.phone ? `<a href="https://wa.me/55${escapeHtml(String(user.phone).replace(/\D/g, ''))}" target="_blank" rel="noreferrer">${escapeHtml(user.phone)}</a>` : ''}</td>
        <td>${escapeHtml(user.document_number)}</td>
        <td>${formatDate(user.created_at)}</td>
        <td><div class="admin-review-actions"><button type="button" data-review-id="${Number(user.id)}" data-review-status="approved">Aprovar</button><button type="button" data-review-id="${Number(user.id)}" data-review-status="rejected">Recusar</button></div></td>
      </tr>
    `).join('');
  }
}

document.querySelector('[data-refresh]')?.addEventListener('click', () => {
  loadDashboard().catch((error) => showError(error.message));
});

document.querySelector('[data-logout]')?.addEventListener('click', async () => {
  try {
    if (!csrfToken) await loadDashboard();
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include', headers: { 'x-csrf-token': csrfToken } });
  } finally {
    window.location.assign('/');
  }
});

approvalsTable?.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-review-id]');
  if (!button) return;
  const reviewStatus = button.dataset.reviewStatus;
  const userId = button.dataset.reviewId;
  button.disabled = true;
  try {
    const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/review`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json', 'x-csrf-token': csrfToken },
      body: JSON.stringify({ reviewStatus }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Não foi possível concluir a análise.');
    feedback.textContent = result.message;
    feedback.classList.add('is-visible');
    await loadDashboard();
  } catch (error) {
    showError(error.message);
    button.disabled = false;
  }
});

loadDashboard().catch((error) => showError(error.message));
