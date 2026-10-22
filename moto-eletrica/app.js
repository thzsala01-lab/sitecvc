// Informe somente o número comercial autorizado, com código do país e DDD.
// Exemplo de formato: código do país + DDD + número, apenas dígitos.
const whatsappNumber = '5537988113709';
const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  navigation.classList.toggle('open', open);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Abrir menu');
  navigation.classList.remove('open');
}));
document.querySelector('[data-whatsapp]').addEventListener('click', () => {
  if (!/^\d{10,15}$/.test(whatsappNumber)) {
    document.querySelector('.contact-status').textContent = 'O atendimento pelo WhatsApp estará disponível em breve. Por enquanto, entre em contato pelo Instagram.';
    return;
  }
  const message = 'Olá! Vim pelo site e gostaria de conhecer as motos elétricas disponíveis.';
  window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
});

const photoDialog = document.querySelector('.photo-dialog');
const dialogImage = document.querySelector('.dialog-image');
document.querySelectorAll('[data-photo]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelector('#photo-title').textContent = button.dataset.title;
    dialogImage.src = button.dataset.photo;
    dialogImage.alt = button.querySelector('img').alt;
    photoDialog.showModal();
    document.body.classList.add('dialog-open');
  });
});
document.querySelector('.close-photo').addEventListener('click', () => photoDialog.close());
photoDialog.addEventListener('click', event => {
  if (event.target === photoDialog) {
    const box = photoDialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) photoDialog.close();
  }
});
photoDialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
