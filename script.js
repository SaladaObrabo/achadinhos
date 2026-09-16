'use strict';

// Contagem demonstrativa, identificada na interface; não vem do WhatsApp.
const COMMUNITY_MEMBERS = 2000;
let displayedMembers = COMMUNITY_MEMBERS;
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotion = motionPreference.matches;
const activeMotions = new Set();
function playMotion(element, frames, options = {}) {
  if (!element || reducedMotion || document.hidden || !element.animate) return null;
  const animation = element.animate(frames, {
    duration: 650, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', ...options
  });
  activeMotions.add(animation);
  animation.finished.then(() => activeMotions.delete(animation), () => activeMotions.delete(animation));
  return animation;
}
motionPreference.addEventListener('change', event => {
  reducedMotion = event.matches;
  if (reducedMotion) {
    activeMotions.forEach(animation => animation.cancel());
    count.textContent = formatCount(displayedMembers);
  }
});
document.addEventListener('visibilitychange', () => {
  document.documentElement.classList.toggle('motion-paused', document.hidden);
  if (document.hidden) activeMotions.forEach(animation => animation.cancel());
});
document.documentElement.classList.toggle('motion-paused', document.hidden);
const count = document.getElementById('member-count');
const formatCount = value => new Intl.NumberFormat('pt-BR').format(value);
count.textContent = formatCount(COMMUNITY_MEMBERS);
function advanceDemoCount() {
  const increment = 1 + Math.floor(Math.random() * 8);
  displayedMembers += increment;
  count.textContent = formatCount(displayedMembers);
  document.getElementById('member-increment').textContent = `+${increment}`;
  playMotion(count, [{ opacity: .5, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 260 });
  playMotion(document.getElementById('member-increment'), [{ opacity: .3, transform: 'scale(.85)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 300 });
}
document.getElementById('year').textContent = new Date().getFullYear();

// Uma apresentação: o produto se acomoda e seu convite aparece em seguida.
// O conteúdo permanece visível sem JavaScript e não há animações em loop.
const showcase = document.querySelector('.hero-showcase');
const heroProduct = document.querySelector('.hero-product');
function introduceShowcase() {
  playMotion(heroProduct, [
    { transform: 'translate(20px, -12px) rotate(-14deg) scale(.95)' },
    { transform: 'translate(0, 0) rotate(-9deg) scale(1)' }
  ], { duration: 780 });
  playMotion(document.querySelector('.floating-label'), [
    { opacity: .25, clipPath: 'inset(0 0 0 85% round 9px)', transform: 'translateX(8px)' },
    { opacity: 1, clipPath: 'inset(0 0 0 0 round 9px)', transform: 'translateX(0)' }
  ], { duration: 480, delay: 230 });
}
function observeShowcase() {
  if (!('IntersectionObserver' in window)) return;
  const entrance = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting) || document.hidden) return;
    entrance.disconnect();
    introduceShowcase();
  }, { threshold: .3 });
  entrance.observe(showcase);
}
if (heroProduct.complete && heroProduct.naturalWidth) observeShowcase();
else heroProduct.addEventListener('load', observeShowcase, { once: true });

// Entradas por conteúdo: texto, lista de produtos, relatos e convite final.
// O estado inicial no CSS é sempre visível, inclusive sem suporte à API.
const motionTargets = new Map();
function registerMotion(selector, type, step = 0) {
  document.querySelectorAll(selector).forEach((element, index) => {
    motionTargets.set(element, { type, delay: Math.min(index * step, 180) });
  });
}
registerMotion('.hero-copy h1', 'headline');
registerMotion('.hero-copy > p, .hero-button, .cta-note', 'copy', 60);
registerMotion('.benefit-band .wrap > span', 'benefit', 50);
registerMotion('.section-heading', 'heading');
registerMotion('.product-card', 'product', 45);
registerMotion('.review-card', 'review', 65);
registerMotion('.final-cta', 'invitation');
registerMotion('.mid-cta', 'invitation');
registerMotion('.footer-top', 'footer');
const motionFrames = {
  headline: [{ opacity: .5, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }],
  copy: [{ opacity: .4 }, { opacity: 1 }],
  benefit: [{ opacity: .5, transform: 'translateX(-8px)' }, { opacity: 1, transform: 'translateX(0)' }],
  heading: [{ opacity: .4, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }],
  product: [{ opacity: .5, transform: 'translateY(16px) scale(.98)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }],
  review: [{ opacity: .5, clipPath: 'inset(0 8% 0 0 round 12px)', transform: 'translateX(12px)' }, { opacity: 1, clipPath: 'inset(0 0 0 0 round 12px)', transform: 'translateX(0)' }],
  invitation: [{ opacity: .6, transform: 'translateY(18px) scale(.98)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }],
  footer: [{ opacity: .4 }, { opacity: 1 }]
};
if ('IntersectionObserver' in window) {
  const pageEntrances = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || document.hidden) return;
      pageEntrances.unobserve(entry.target);
      const { type, delay } = motionTargets.get(entry.target);
      playMotion(entry.target, motionFrames[type], { duration: type === 'headline' ? 700 : 480, delay });
    });
  }, { threshold: .16 });
  motionTargets.forEach((_, element) => pageEntrances.observe(element));
}

// Um acento por controle chama a atenção sem piscar continuamente.
if ('IntersectionObserver' in window) {
  const attention = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || document.hidden) return;
      attention.unobserve(entry.target);
      if (!reducedMotion) entry.target.classList.add('motion-attention');
    });
  }, { threshold: .6 });
  document.querySelectorAll('.button, .hero-showcase, .benefit-band').forEach(element => attention.observe(element));
}

const slider = document.getElementById('review-slider');
// Profundidade vinculada à rolagem; atualiza somente os fundos visíveis.
const ambientLayers = new Set();
let ambientFrame = 0;
function updateAmbientProducts() {
  ambientFrame = 0;
  if (document.hidden || reducedMotion) return;
  ambientLayers.forEach(layer => {
    const rect = layer.getBoundingClientRect();
    const offset = Math.max(-28, Math.min(28, (innerHeight / 2 - rect.top - rect.height / 2) * .055));
    layer.style.setProperty('--ambient-y', `${offset.toFixed(1)}px`);
  });
}
function scheduleAmbientUpdate() {
  if (!ambientFrame && !reducedMotion && !document.hidden && ambientLayers.size) ambientFrame = requestAnimationFrame(updateAmbientProducts);
}
if ('IntersectionObserver' in window) {
  const ambientObserver = new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) {
        ambientLayers.add(target);
        if (!reducedMotion) target.classList.add('ambient-arrived');
      } else ambientLayers.delete(target);
      target.style.animationPlayState = isIntersecting ? 'running' : 'paused';
      target.querySelectorAll('img').forEach(img => { img.style.animationPlayState = isIntersecting ? 'running' : 'paused'; });
    });
    scheduleAmbientUpdate();
  });
  document.querySelectorAll('.ambient-products').forEach(layer => ambientObserver.observe(layer));
  window.addEventListener('scroll', scheduleAmbientUpdate, { passive: true });
  window.addEventListener('resize', scheduleAmbientUpdate);
  document.addEventListener('visibilitychange', scheduleAmbientUpdate);
  motionPreference.addEventListener('change', scheduleAmbientUpdate);
}
const previous = document.getElementById('review-prev');
const next = document.getElementById('review-next');
function updateSliderControls() {
  previous.disabled = slider.scrollLeft <= 2;
  next.disabled = slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 2;
}
function moveSlider(direction) {
  const step = slider.firstElementChild.getBoundingClientRect().width + parseFloat(getComputedStyle(slider).gap);
  slider.scrollBy({ left: direction * step, behavior: reducedMotion ? 'instant' : 'smooth' });
}
previous.addEventListener('click', () => moveSlider(-1));
next.addEventListener('click', () => moveSlider(1));
slider.addEventListener('scroll', updateSliderControls, { passive: true });
window.addEventListener('resize', updateSliderControls);
slider.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    moveSlider(event.key === 'ArrowRight' ? 1 : -1);
  }
});
updateSliderControls();

// Demonstração identificada na interface: estes nomes não representam membros reais.
const demoNames = [
  'Ana', 'Maria', 'Juliana', 'Camila', 'Fernanda',
  'João', 'Pedro', 'Lucas', 'Gabriel', 'Eduardo'
];
const notices = [...demoNames];
for (let index = notices.length - 1; index > 0; index--) {
  const randomIndex = Math.floor(Math.random() * (index + 1));
  [notices[index], notices[randomIndex]] = [notices[randomIndex], notices[index]];
}
const nextNoticeDelay = () => 4000 + Math.floor(Math.random() * 4000);
const notice = document.getElementById('notice');
let noticeIndex = 0;
let noticeTimer;
let closed = false;
let noticeExit = null;
async function hideNotice() {
  if (noticeExit) return noticeExit;
  const animation = playMotion(notice, [
    { opacity: 1, transform: 'translateX(0)' },
    { opacity: 0, transform: 'translateX(-12px)' }
  ], { duration: 160, easing: 'ease-in' });
  noticeExit = (async () => {
    if (animation) await animation.finished.catch(() => {});
    notice.hidden = true;
  })();
  await noticeExit;
  noticeExit = null;
}
function scheduleNoticeExit() {
  noticeTimer = setTimeout(async () => {
    if (notice.matches(':hover') || notice.contains(document.activeElement)) {
      scheduleNoticeExit();
      return;
    }
    await hideNotice();
    if (!closed) noticeTimer = setTimeout(showNotice, nextNoticeDelay());
  }, 5500);
}
function showNotice() {
  if (closed || !notice.hidden || noticeExit) return;
  if (document.hidden) { noticeTimer = setTimeout(showNotice, 1000); return; }
  if (noticeIndex >= notices.length) {
    const lastName = notices[notices.length - 1];
    for (let index = notices.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [notices[index], notices[randomIndex]] = [notices[randomIndex], notices[index]];
    }
    if (notices[0] === lastName) [notices[0], notices[1]] = [notices[1], notices[0]];
    noticeIndex = 0;
  }
  const name = notices[noticeIndex++];
  document.getElementById('notice-title').textContent = name;
  document.getElementById('notice-text').textContent = 'Entrou no grupo agora';
  document.getElementById('notice-avatar').textContent = name.split(' ').map(part => part[0]).join('');
  advanceDemoCount();
  notice.hidden = false;
  scheduleNoticeExit();
}
document.getElementById('notice-close').addEventListener('click', () => {
  closed = true;
  clearTimeout(noticeTimer);
  hideNotice();
});
// Aparece novamente ao recarregar; dispensas antigas não escondem a demonstração.
noticeTimer = setTimeout(showNotice, 2000);

// ================================
// META PIXEL - CLIQUE NO WHATSAPP
// ================================

document.addEventListener("click", function (event) {
    const target = event.target;

    if (!(target instanceof Element)) return;

    const link = target.closest('a[href*="chat.whatsapp.com"]');

    if (!link) return;

    const metaLeadTracked = sessionStorage.getItem("metaLeadTracked");

    if (typeof fbq === "function" && !metaLeadTracked) {

        fbq("track", "Lead", {
            content_name: "Entrada Grupo WhatsApp",
            content_category: "WhatsApp"
        });

        sessionStorage.setItem("metaLeadTracked", "true");

        console.log("Meta Pixel: Lead enviado");
    }
});