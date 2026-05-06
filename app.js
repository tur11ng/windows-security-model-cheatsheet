// ── Diagram rail resizer (shell element — runs immediately) ─────────────────
(() => {
  const resizer = document.querySelector('.diagram-resizer');
  const storageKey = 'diagramRailWidth';
  const minWidth = 300;
  const maxWidth = 560;

  if (!resizer) return;

  const setWidth = (width) => {
    const numericWidth = Math.min(maxWidth, Math.max(minWidth, Number(width) || minWidth));
    document.documentElement.style.setProperty('--diagram-rail-width', `${numericWidth}px`);
    resizer.setAttribute('aria-valuenow', String(numericWidth));
    resizer.setAttribute('aria-valuemin', String(minWidth));
    resizer.setAttribute('aria-valuemax', String(maxWidth));
    localStorage.setItem(storageKey, String(numericWidth));
  };

  const widthFromPointer = (clientX) => window.innerWidth - clientX - resizer.offsetWidth;

  setWidth(localStorage.getItem(storageKey) || minWidth);

  resizer.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    resizer.setPointerCapture(event.pointerId);
    document.body.classList.add('diagram-resizing');
  });

  resizer.addEventListener('pointermove', (event) => {
    if (!resizer.hasPointerCapture(event.pointerId)) return;
    setWidth(widthFromPointer(event.clientX));
  });

  const stopResize = (event) => {
    if (resizer.hasPointerCapture(event.pointerId)) {
      resizer.releasePointerCapture(event.pointerId);
    }
    document.body.classList.remove('diagram-resizing');
  };

  resizer.addEventListener('pointerup', stopResize);
  resizer.addEventListener('pointercancel', stopResize);

  resizer.addEventListener('keydown', (event) => {
    const currentWidth = Number(resizer.getAttribute('aria-valuenow')) || minWidth;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setWidth(currentWidth + 10);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setWidth(currentWidth - 10);
    }
  });
})();

// ── Tab initializers — called after rail HTML is injected ───────────────────
function initRailTabs() {
  const tabs = Array.from(document.querySelectorAll('[data-rail-tab]'));
  const panels = Array.from(document.querySelectorAll('[data-rail-panel]'));
  const storageKey = 'rightRailTab';

  if (!tabs.length || !panels.length) return;

  const setActiveTab = (name) => {
    const selectedName = panels.some((panel) => panel.dataset.railPanel === name) ? name : 'diagrams';
    tabs.forEach((tab) => {
      const isActive = tab.dataset.railTab === selectedName;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    });
    panels.forEach((panel) => {
      const isActive = panel.dataset.railPanel === selectedName;
      panel.classList.toggle('active', isActive);
      panel.hidden = !isActive;
    });
    localStorage.setItem(storageKey, selectedName);
  };

  setActiveTab(localStorage.getItem(storageKey) || 'diagrams');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => setActiveTab(tab.dataset.railTab));
  });
}

function initExampleTabs() {
  const tabs = Array.from(document.querySelectorAll('[data-example-tab]'));
  const panels = Array.from(document.querySelectorAll('[data-example-panel]'));
  const storageKey = 'rightRailExampleTab';

  if (!tabs.length || !panels.length) return;

  const setActiveTab = (name) => {
    const selectedName = panels.some((panel) => panel.dataset.examplePanel === name) ? name : 'commands';
    tabs.forEach((tab) => {
      const isActive = tab.dataset.exampleTab === selectedName;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    });
    panels.forEach((panel) => {
      const isActive = panel.dataset.examplePanel === selectedName;
      panel.classList.toggle('active', isActive);
      panel.hidden = !isActive;
    });
    localStorage.setItem(storageKey, selectedName);
  };

  setActiveTab(localStorage.getItem(storageKey) || 'commands');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => setActiveTab(tab.dataset.exampleTab));
  });
}

// ── Content loader ──────────────────────────────────────────────────────────
const SECTIONS = [
  'sections/01-architecture.html',
  'sections/02-sids.html',
  'sections/03-tokens.html',
  'sections/04-descriptors.html',
  'sections/04b-access-masks.html',
  'sections/05-access-check.html',
  'sections/06-privileges.html',
  'sections/07-service-accounts.html',
  'sections/08-local-auth.html',
  'sections/09-ntlm.html',
  'sections/10-kerberos.html',
  'sections/11-active-directory.html',
  'sections/12-auditing.html',
  'sections/13-privesc.html',
  'sections/14-vuln-services.html',
  'sections/15-cred-access.html',
  'sections/16-ntlm-attacks.html',
  'sections/17-kerberos-attacks.html',
  'sections/18-ad-abuse.html',
  'sections/19-detection.html',
];

async function loadContent() {
  const sectionsEl = document.getElementById('sections-container');
  const railEl = document.getElementById('rail-container');

  const [sectionHTMLs, railHTML] = await Promise.all([
    Promise.all(SECTIONS.map(url => fetch(url).then(r => r.text()))),
    fetch('rail/rail.html').then(r => r.text()),
  ]);

  sectionsEl.innerHTML = sectionHTMLs.join('\n');
  railEl.innerHTML = railHTML;

  initRailTabs();
  initExampleTabs();
}

loadContent().catch(() => {
  const sectionsEl = document.getElementById('sections-container');
  if (sectionsEl) {
    sectionsEl.innerHTML = `<div style="padding:40px;color:#f16363;font-family:monospace;line-height:2">
      <strong>&#9888; Cannot load sections via file:// protocol.</strong><br>
      Serve this directory over HTTP instead:<br>
      <code style="background:#1a1d28;padding:3px 8px;border-radius:3px">python -m http.server</code>
      &nbsp;&nbsp;or use the <strong>VS Code Live Server</strong> extension.
    </div>`;
  }
});
