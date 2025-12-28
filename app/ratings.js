async function loadRatings() {
  try {
    const res = await fetch('/data/ratings.json', { cache: 'no-store' });
    if (!res.ok) return;
    const d = await res.json();

    const fide = (d && d.fide && d.fide.standard != null) ? d.fide.standard : null;
    const cfc  = (d && d.cfc  && d.cfc.regular  != null) ? d.cfc.regular  : null;
    const fqe  = (d && d.fqe  && d.fqe.lente    != null) ? d.fqe.lente    : null;

    const elFide = document.getElementById('rating-fide');
    const elCfc  = document.getElementById('rating-cfc');
    const elFqe  = document.getElementById('rating-fqe');

    if (elFide && fide !== null) elFide.textContent = fide;
    if (elCfc  && cfc  !== null) elCfc.textContent  = cfc;
    if (elFqe  && fqe  !== null) elFqe.textContent  = fqe;
  } catch (e) {
    // leave current numbers as-is
  }
}
document.addEventListener('DOMContentLoaded', loadRatings);
