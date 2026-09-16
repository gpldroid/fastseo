(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const form = $('analyzeForm'), input = $('urlInput'), strategy = $('strategy'), submit = $('submitBtn');
  const loading = $('loading'), results = $('results'), error = $('errorMsg');
  const endpoint = window.FASTSEO_API_ENDPOINT || '/api/pagespeed';

  function scoreClass(score){ if(score == null) return 'unknown'; if(score >= 90) return 'green'; if(score >= 50) return 'orange'; return 'red'; }
  function scoreText(score){ return score == null ? '—' : Math.round(score); }
  function formatValue(v){
    if(v == null || v === '') return '—';
    if(typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2);
    return String(v);
  }
  function metric(container, label, value){
    const row = document.createElement('div'); row.className='metric';
    const a=document.createElement('span'); a.textContent=label;
    const b=document.createElement('b'); b.textContent=formatValue(value);
    row.append(a,b); container.appendChild(row);
  }
  function showError(message){ error.textContent=message; error.classList.remove('hidden'); }
  function clearError(){ error.textContent=''; error.classList.add('hidden'); }
  function category(result, name){ return result?.categories?.[name]?.score == null ? null : result.categories[name].score * 100; }
  function auditValue(result, key){
    const a=result?.audits?.[key];
    if(!a) return null;
    if(a.displayValue != null) return a.displayValue;
    if(a.numericValue != null) return a.numericValue;
    return a.score == null ? null : a.score * 100;
  }
  function renderScore(container,label,value){
    const card=document.createElement('div'); card.className='score-card';
    const circle=document.createElement('div'); circle.className='score '+scoreClass(value); circle.textContent=scoreText(value);
    const text=document.createElement('div'); text.className='score-label'; text.textContent=label;
    card.append(circle,text); container.appendChild(card);
  }
  function renderResults(data,url,device){
    const lr=data?.lighthouseResult || data?.result || data;
    if(!lr || !lr.categories) throw new Error('لم تصل بيانات Lighthouse صالحة من خدمة التحليل.');
    $('resultUrl').textContent=url;
    $('resultDevice').textContent=device === 'desktop' ? '🖥️ حاسوب' : '📱 هاتف محمول';
    const scores=$('scores'); scores.replaceChildren();
    renderScore(scores,'الأداء',category(lr,'performance'));
    renderScore(scores,'SEO',category(lr,'seo'));
    renderScore(scores,'إمكانية الوصول',category(lr,'accessibility'));
    renderScore(scores,'أفضل الممارسات',category(lr,'best-practices'));
    $('perf').replaceChildren();
    metric($('perf'),'FCP',auditValue(lr,'first-contentful-paint'));
    metric($('perf'),'LCP',auditValue(lr,'largest-contentful-paint'));
    metric($('perf'),'TBT',auditValue(lr,'total-blocking-time'));
    metric($('perf'),'CLS',auditValue(lr,'cumulative-layout-shift'));
    metric($('perf'),'Speed Index',auditValue(lr,'speed-index'));
    $('seo').replaceChildren();
    metric($('seo'),'العنوان والوصف',auditValue(lr,'meta-description'));
    metric($('seo'),'قابلية الفهرسة',auditValue(lr,'is-crawlable'));
    metric($('seo'),'Canonical',auditValue(lr,'canonical'));
    metric($('seo'),'نصوص الروابط',auditValue(lr,'link-text'));
    $('a11y').replaceChildren();
    metric($('a11y'),'النص البديل للصور',auditValue(lr,'image-alt'));
    metric($('a11y'),'لغة المستند',auditValue(lr,'html-has-lang'));
    metric($('a11y'),'ARIA',auditValue(lr,'aria-allowed-attr'));
    metric($('a11y'),'تباين الألوان',auditValue(lr,'color-contrast'));
    $('bp').replaceChildren();
    metric($('bp'),'HTTPS',auditValue(lr,'is-on-https'));
    metric($('bp'),'Doctype',auditValue(lr,'doctype'));
    metric($('bp'),'أبعاد الصور',auditValue(lr,'image-size-responsive'));
    metric($('bp'),'أخطاء وحدة التحكم',auditValue(lr,'errors-in-console'));
    results.classList.add('show');
    results.scrollIntoView({behavior:'smooth',block:'start'});
  }
  form.addEventListener('submit', async e => {
    e.preventDefault(); clearError();
    let url;
    try{ url=new URL(input.value.trim()); if(!/^https?:$/.test(url.protocol)) throw new Error(); }
    catch{ showError('يرجى إدخال رابط صحيح يبدأ بـ https:// أو http://'); return; }
    submit.disabled=true; loading.classList.add('show'); results.classList.remove('show');
    try{
      const u=endpoint + (endpoint.includes('?')?'&':'?') + 'url=' + encodeURIComponent(url.href) + '&strategy=' + encodeURIComponent(strategy.value);
      const response=await fetch(u,{headers:{Accept:'application/json'},cache:'no-store'});
      let data=null; try{data=await response.json();}catch{}
      if(!response.ok) throw new Error(data?.error || 'تعذر تنفيذ التحليل حالياً.');
      renderResults(data,url.href,strategy.value);
    }catch(err){ showError(err?.message || 'حدث خطأ أثناء تحليل الموقع. حاول مرة أخرى.'); }
    finally{submit.disabled=false; loading.classList.remove('show');}
  });

  const themeBtn=$('themeBtn'), langBtn=$('langBtn');
  const savedTheme=localStorage.getItem('fastseo-theme');
  if(savedTheme==='dark' || (!savedTheme && matchMedia('(prefers-color-scheme: dark)').matches)) document.body.classList.add('dark');
  function updateTheme(){ themeBtn.textContent=document.body.classList.contains('dark')?'☀️':'🌙'; }
  updateTheme();
  themeBtn.addEventListener('click',()=>{document.body.classList.toggle('dark');localStorage.setItem('fastseo-theme',document.body.classList.contains('dark')?'dark':'light');updateTheme();});
  langBtn.addEventListener('click',()=>{
    const isArabic=document.documentElement.lang==='ar';
    document.documentElement.lang=isArabic?'en':'ar';
    document.documentElement.dir=isArabic?'ltr':'rtl';
    $('heroTitle').textContent=isArabic?'Professional Website Performance Analysis':'فحص وتحليل أداء موقعك باحترافية';
    $('heroDesc').textContent=isArabic?'Get a clear report for performance, SEO, accessibility and best practices using Google Lighthouse.':'احصل على تقرير شامل حول سرعة موقعك وSEO وإمكانية الوصول باستخدام Google Lighthouse.';
    langBtn.textContent=isArabic?'AR':'EN';
  });
})();