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
