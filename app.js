(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const form = $('analyzeForm');
  if (!form) return;

  const input = $('urlInput');
  const strategy = $('strategy');
  const submit = $('submitBtn');
  const loading = $('loading');
  const results = $('results');
  const error = $('errorMsg');
  const endpoint = window.FASTSEO_API_ENDPOINT || '/api/pagespeed';
  let activeRequest = null;

  const showError = message => {
    error.textContent = message;
    error.classList.remove('hidden');
  };
  const clearError = () => {
    error.textContent = '';
    error.classList.add('hidden');
  };
  const scoreClass = score => score == null ? 'unknown' : score >= 90 ? 'green' : score >= 50 ? 'orange' : 'red';
  const scoreText = score => score == null ? '—' : Math.round(score);
  const category = (result, name) => {
    const score = result?.categories?.[name]?.score;
    return score == null ? null : score * 100;
  };
  const auditValue = (result, key) => {
    const audit = result?.audits?.[key];
    if (!audit) return null;
    if (audit.displayValue != null) return audit.displayValue;
    if (audit.numericValue != null) return audit.numericValue;
    return audit.score == null ? null : audit.score * 100;
  };
  const formatValue = value => {
    if (value == null || value === '') return '—';
    return typeof value === 'number' ? (Number.isInteger(value) ? String(value) : value.toFixed(2)) : String(value);
  };

  function metricFragment(items) {
    const fragment = document.createDocumentFragment();
    for (const [label, value] of items) {
      const row = document.createElement('div');
      row.className = 'metric';
      row.innerHTML = `<span></span><b></b>`;
      row.firstChild.textContent = label;
      row.lastChild.textContent = formatValue(value);
      fragment.appendChild(row);
    }
    return fragment;
  }

  function renderResults(data, url, device) {
    const result = data?.lighthouseResult || data?.result || data;
    if (!result?.categories) throw new Error('لم تصل بيانات Lighthouse صالحة من خدمة التحليل.');

    $('resultUrl').textContent = url;
    $('resultDevice').textContent = device === 'desktop' ? '🖥️ حاسوب' : '📱 هاتف محمول';

    const scores = $('scores');
    const scoreFragment = document.createDocumentFragment();
    for (const [label, value] of [
      ['الأداء', category(result, 'performance')],
      ['SEO', category(result, 'seo')],
      ['إمكانية الوصول', category(result, 'accessibility')],
      ['أفضل الممارسات', category(result, 'best-practices')]
    ]) {
      const card = document.createElement('div');
      card.className = 'score-card';
      card.innerHTML = `<div class="score ${scoreClass(value)}"></div><div class="score-label"></div>`;
      card.firstChild.textContent = scoreText(value);
      card.lastChild.textContent = label;
      scoreFragment.appendChild(card);
    }
    scores.replaceChildren(scoreFragment);

    $('perf').replaceChildren(metricFragment([
      ['FCP', auditValue(result, 'first-contentful-paint')],
      ['LCP', auditValue(result, 'largest-contentful-paint')],
      ['TBT', auditValue(result, 'total-blocking-time')],
      ['CLS', auditValue(result, 'cumulative-layout-shift')],
      ['Speed Index', auditValue(result, 'speed-index')]
    ]));
    $('seo').replaceChildren(metricFragment([
      ['العنوان والوصف', auditValue(result, 'meta-description')],
      ['قابلية الفهرسة', auditValue(result, 'is-crawlable')],
      ['Canonical', auditValue(result, 'canonical')],
      ['نصوص الروابط', auditValue(result, 'link-text')]
    ]));
    $('a11y').replaceChildren(metricFragment([
      ['النص البديل للصور', auditValue(result, 'image-alt')],
      ['لغة المستند', auditValue(result, 'html-has-lang')],
      ['ARIA', auditValue(result, 'aria-allowed-attr')],
      ['تباين الألوان', auditValue(result, 'color-contrast')]
    ]));
    $('bp').replaceChildren(metricFragment([
      ['HTTPS', auditValue(result, 'is-on-https')],
      ['Doctype', auditValue(result, 'doctype')],
      ['أبعاد الصور', auditValue(result, 'image-size-responsive')],
      ['أخطاء وحدة التحكم', auditValue(result, 'errors-in-console')]
    ]));

    results.classList.add('show');
    requestAnimationFrame(() => results.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    clearError();

    let url;
    try {
      url = new URL(input.value.trim());
      if (!/^https?:$/.test(url.protocol)) throw new Error();
    } catch {
      showError('يرجى إدخال رابط صحيح يبدأ بـ https:// أو http://');
      return;
    }

    activeRequest?.abort();
    activeRequest = new AbortController();
    submit.disabled = true;
    loading.classList.add('show');
    results.classList.remove('show');

    const params = new URLSearchParams({ url: url.href, strategy: strategy.value });
    const timeout = setTimeout(() => activeRequest.abort(), 45000);

    try {
      const response = await fetch(`${endpoint}?${params}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: activeRequest.signal
      });
      let data = null;
      try { data = await response.json(); } catch {}
      if (!response.ok) throw new Error(data?.error || 'تعذر تنفيذ التحليل حالياً.');
      renderResults(data, url.href, strategy.value);
    } catch (err) {
      if (err?.name === 'AbortError') {
        showError('استغرق التحليل وقتاً أطول من المتوقع. تحقق من الرابط وحاول مرة أخرى.');
      } else {
        showError(err?.message || 'حدث خطأ أثناء تحليل الموقع. حاول مرة أخرى.');
      }
    } finally {
      clearTimeout(timeout);
      activeRequest = null;
      submit.disabled = false;
      loading.classList.remove('show');
    }
  });

  const themeBtn = $('themeBtn');
  const langBtn = $('langBtn');
  if (themeBtn) {
    const savedTheme = localStorage.getItem('fastseo-theme');
    if (savedTheme === 'dark' || (!savedTheme && matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.body.classList.add('dark');
    }
    const updateTheme = () => { themeBtn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙'; };
    updateTheme();
    themeBtn.addEventListener('click', () => {
      const dark = document.body.classList.toggle('dark');
      localStorage.setItem('fastseo-theme', dark ? 'dark' : 'light');
      updateTheme();
    }, { passive: true });
  }

  if (langBtn) {
    langBtn.addEventListener('click', () => {
      const arabic = document.documentElement.lang === 'ar';
      document.documentElement.lang = arabic ? 'en' : 'ar';
      document.documentElement.dir = arabic ? 'ltr' : 'rtl';
      $('heroTitle').textContent = arabic ? 'Professional Website Performance Analysis' : 'فحص وتحليل أداء موقعك باحترافية';
      $('heroDesc').textContent = arabic ? 'Get a clear report for performance, SEO, accessibility and best practices using Google Lighthouse.' : 'احصل على تقرير شامل حول سرعة موقعك وSEO وإمكانية الوصول باستخدام Google Lighthouse.';
      langBtn.textContent = arabic ? 'AR' : 'EN';
    }, { passive: true });
  }
})();
