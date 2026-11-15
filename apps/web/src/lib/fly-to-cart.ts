/**
 * "Add to cart" animation (TZ §7.5): a small product thumbnail flies along an
 * arc from the button to the header cart icon. Uses the Web Animations API on
 * a single temporary element, so it costs nothing when idle; skipped for
 * prefers-reduced-motion or when the cart icon is not on screen.
 */
export function flyToCart(from: Element, imageUrl?: string | null) {
  if (
    typeof window === 'undefined' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
    return;
  const target = document.querySelector('[data-cart-target]');
  if (!target) return;

  const start = from.getBoundingClientRect();
  const end = target.getBoundingClientRect();
  if (end.width === 0 || end.bottom < 0) return;

  const size = 44;
  const x0 = start.left + start.width / 2 - size / 2;
  const y0 = start.top + start.height / 2 - size / 2;
  const dx = end.left + end.width / 2 - size / 2 - x0;
  const dy = end.top + end.height / 2 - size / 2 - y0;

  const dot = document.createElement('div');
  dot.setAttribute('aria-hidden', 'true');
  Object.assign(dot.style, {
    position: 'fixed',
    left: `${x0}px`,
    top: `${y0}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '9999px',
    border: '3px solid #FFFDF7',
    boxShadow: '0 10px 24px -8px rgba(53, 91, 62, 0.55)',
    background: imageUrl ? `#F4E9B9 center/cover url("${encodeURI(imageUrl)}")` : '#355B3E',
    zIndex: '70',
    pointerEvents: 'none',
  });
  document.body.appendChild(dot);

  const lift = Math.min(-80, dy * 0.5 - 80);
  const animation = dot.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${lift}px) scale(0.85)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.3)`, opacity: 0.4 },
    ],
    { duration: 750, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
  );
  const cleanup = () => dot.remove();
  animation.onfinish = cleanup;
  animation.oncancel = cleanup;
}
