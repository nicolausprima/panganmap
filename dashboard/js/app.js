/**
 * Dashboard Ketahanan Pangan Indonesia (IKP 2018-2026)
 * Storytelling with Data Implementation
 * Visual system: Hallmark, Rim theme. Every colour below is a CSS token from tokens.css.
 */

(function () {
  'use strict';

  let data = null;
  let currentYear = 2026;
  let selectedProvince = null; // null = National
  let selectedClassification = null; // null | 1 | 2 | 3 | 4 | 5
  let activeMetric = 'ikp'; // 'ikp' | 'rentan_pct' | 'kemiskinan'
  let searchQuery = '';
  let sortField = 'ikp';
  let sortAsc = false;
  let currentPage = 1;
  const rowsPerPage = 10;

  // DOM Elements
  const elYearPicker = document.getElementById('yearPicker');
  const elProvSelect = document.getElementById('provSelect');
  const elMetricSelect = document.getElementById('metricSelect');
  const elResetBtn = document.getElementById('resetBtn');
  const elSearchInput = document.getElementById('searchInput');
  const elExportBtns = document.querySelectorAll('[data-export]');
  const elReloadBtn = document.getElementById('reloadBtn');
  const elClearLegendFilterBtn = document.getElementById('clearLegendFilterBtn');

  // KPI elements
  const elKpiMean = document.getElementById('kpiMean');
  const elKpiMeanDelta = document.getElementById('kpiMeanDelta');
  const elKpiMeanBadge = document.getElementById('kpiMeanBadge');
  const elKpiTahanPct = document.getElementById('kpiTahanPct');
  const elKpiTahanCount = document.getElementById('kpiTahanCount');
  const elKpiRentanTotal = document.getElementById('kpiRentanTotal');
  const elKpiRentanLabel = document.getElementById('kpiRentanLabel');
  const elKpiRange = document.getElementById('kpiRange');
  const elKpiRangeDetail = document.getElementById('kpiRangeDetail');
  const elKpiPoverty = document.getElementById('kpiPoverty');
  const elKpiPovertySub = document.getElementById('kpiPovertySub');

  // Map elements
  const elMapSvg = document.getElementById('mapSvg');
  const elMapTooltip = document.getElementById('mapTooltip');
  const elSelectedProvBadge = document.getElementById('selectedProvBadge');
  const elSelectedProvName = document.getElementById('selectedProvName');

  // Chart containers
  const elChartTrend = document.getElementById('chartTrend');
  const elChartRanking = document.getElementById('chartRanking');
  const elChartPillars = document.getElementById('chartPillars');
  const elChartScatter = document.getElementById('chartScatter');

  // Table elements
  const elTableBody = document.getElementById('tableBody');
  const elTableInfo = document.getElementById('tableInfo');
  const elPagination = document.getElementById('pagination');
  const elEmptyState = document.getElementById('emptyState');
  const elResetEmptyBtn = document.getElementById('resetEmptyBtn');

  // Initialize
  async function init() {
    try {
      if (typeof document !== 'undefined') {
        document.documentElement.classList.add('js-ready');
      }
      showLoading(true);
      if (window.DASHBOARD_DATA) {
        data = window.DASHBOARD_DATA;
      } else {
        let res = await fetch('./data/processed/dashboard_data.json').catch(() => null);
        if (!res || !res.ok) {
          res = await fetch('../data/processed/dashboard_data.json').catch(() => null);
        }
        if (!res || !res.ok) throw new Error('Gagal memuat dataset');
        data = await res.json();
      }

      // Parse URL parameters if present
      parseUrlParams();

      setupYearPicker();
      setupProvinceSelect();
      elMetricSelect.value = activeMetric;
      setupEventListeners();
      setupLegendFilter();
      updateLegendUI();

      renderAll();
      watchChartWidths();
      showLoading(false);
    } catch (err) {
      console.error(err);
      showError(err.message);
    }
  }

  function parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('year')) {
      const y = parseInt(params.get('year'), 10);
      if (data.years.includes(y)) currentYear = y;
    }
    if (params.has('prov')) {
      const p = params.get('prov');
      if (data.provinces[p]) selectedProvince = p;
    }
    if (params.has('metric')) {
      const m = params.get('metric');
      if (['ikp', 'rentan_pct', 'kemiskinan'].includes(m)) activeMetric = m;
    }
  }

  function updateUrlParams() {
    const params = new URLSearchParams();
    params.set('year', currentYear);
    if (selectedProvince) params.set('prov', selectedProvince);
    if (activeMetric !== 'ikp') params.set('metric', activeMetric);
    const newUrl = window.location.pathname + '?' + params.toString();
    window.history.replaceState({}, '', newUrl);
  }

  function setupYearPicker() {
    elYearPicker.innerHTML = '';
    data.years.forEach(y => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'year-pill-btn' + (y === currentYear ? ' is-active' : '');
      btn.textContent = y;
      btn.setAttribute('aria-pressed', y === currentYear ? 'true' : 'false');
      btn.addEventListener('click', () => {
        if (currentYear === y) return;
        currentYear = y;
        document.querySelectorAll('.year-pill-btn').forEach(b => {
          b.classList.remove('is-active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');
        updateUrlParams();
        renderAll();
      });
      elYearPicker.appendChild(btn);
    });
  }

  function setupProvinceSelect() {
    elProvSelect.innerHTML = '<option value="">Semua Provinsi (Nasional)</option>';
    const provs = Object.keys(data.provinces).sort();
    provs.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      if (selectedProvince === p) opt.selected = true;
      elProvSelect.appendChild(opt);
    });
  }

  function setupEventListeners() {
    elProvSelect.addEventListener('change', (e) => {
      selectedProvince = e.target.value || null;
      currentPage = 1;
      updateUrlParams();
      renderAll();
    });

    elMetricSelect.addEventListener('change', (e) => {
      activeMetric = e.target.value;
      selectedClassification = null;
      updateLegendUI();
      updateUrlParams();
      renderMap();
      renderTable();
    });

    elResetBtn.addEventListener('click', () => {
      selectedProvince = null;
      selectedClassification = null;
      activeMetric = 'ikp';
      searchQuery = '';
      currentPage = 1;
      elProvSelect.value = '';
      elMetricSelect.value = 'ikp';
      elSearchInput.value = '';
      updateLegendUI();
      updateUrlParams();
      renderAll();
    });

    if (elResetEmptyBtn) {
      elResetEmptyBtn.addEventListener('click', () => {
        searchQuery = '';
        elSearchInput.value = '';
        renderTable();
      });
    }

    elSearchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      currentPage = 1;
      renderTable();
    });

    elExportBtns.forEach(btn => btn.addEventListener('click', exportCsv));
    if (elReloadBtn) {
      elReloadBtn.addEventListener('click', () => window.location.reload());
    }

    // Table sorting headers (mouse and keyboard)
    document.querySelectorAll('.data-table th[data-sort]').forEach(th => {
      th.tabIndex = 0;
      th.setAttribute('aria-sort', 'none');
      const sortBy = () => {
        const field = th.dataset.sort;
        if (sortField === field) {
          sortAsc = !sortAsc;
        } else {
          sortField = field;
          sortAsc = field === 'kab' || field === 'prov';
        }
        currentPage = 1;
        renderTable();
      };
      th.addEventListener('click', sortBy);
      th.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          sortBy();
        }
      });
    });

    // Top bar navigation: smooth scrolling and active tracking
    setupNavigation();
  }

  function setupNavigation() {
    const navLinks = document.querySelectorAll('.topbar-nav .nav-link');
    if (navLinks.length === 0) return;

    const markActive = (activeLink) => {
      navLinks.forEach(l => {
        l.classList.toggle('is-active', l === activeLink);
        if (l === activeLink) l.setAttribute('aria-current', 'location');
        else l.removeAttribute('aria-current');
      });
    };

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          const target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            markActive(link);
            target.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });

    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      const sectionMap = {
        'dashboardTop': document.querySelector('a[href="#dashboardTop"]'),
        'mapSection': document.querySelector('a[href="#mapSection"]'),
        'chartsSection': document.querySelector('a[href="#chartsSection"]'),
        'inferentialSection': document.querySelector('a[href="#inferentialSection"]'),
        'tableSection': document.querySelector('a[href="#tableSection"]')
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const activeLink = sectionMap[entry.target.id];
            if (activeLink) markActive(activeLink);
          }
        });
      }, { rootMargin: '-25% 0px -60% 0px' });

      Object.keys(sectionMap).forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    }
  }

  // =========================================================================
  // Chart sizing: charts are drawn at the width of their container so type
  // stays at its real size, and redrawn when that width changes.
  // =========================================================================
  function chartWidth(el, fallback) {
    const w = el && el.clientWidth ? Math.floor(el.clientWidth) : 0;
    return w >= 240 ? w : fallback;
  }

  function watchChartWidths() {
    if (typeof ResizeObserver === 'undefined') return;
    const targets = [elChartTrend, elChartRanking, elChartPillars, elChartScatter,
      document.getElementById('chartAnovaDisparity'),
      document.getElementById('chartKmeansRadar'),
      document.getElementById('chartRegressionTornado')].filter(Boolean);
    const lastWidth = new Map();
    let timer = null;
    const observer = new ResizeObserver((entries) => {
      let changed = false;
      entries.forEach(entry => {
        const w = Math.round(entry.contentRect.width);
        const prev = lastWidth.get(entry.target);
        if (prev !== undefined && Math.abs(prev - w) >= 8) changed = true;
        lastWidth.set(entry.target, w);
      });
      if (changed) {
        clearTimeout(timer);
        timer = setTimeout(renderCharts, 120);
      }
    });
    targets.forEach(el => observer.observe(el));
  }

  function emptyBlock(message) {
    return `<div class="state-block state-block--chart"><p class="state-desc">${message}</p></div>`;
  }

  function renderAll() {
    renderKpis();
    renderMap();
    renderCharts();
    renderTable();
  }

  // =========================================================================
  // Smooth KPI Number Interpolation (Fluid SaaS transitions)
  // =========================================================================
  const activeNumberAnimations = new WeakMap();
  const raf = typeof window !== 'undefined' && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : (cb) => setTimeout(() => cb(Date.now()), 16);
  const caf = typeof window !== 'undefined' && window.cancelAnimationFrame ? window.cancelAnimationFrame.bind(window) : clearTimeout;
  const nowFn = () => (typeof window !== 'undefined' && window.performance && window.performance.now ? window.performance.now() : Date.now());

  function animateNumber(el, targetVal, decimals = 2, suffix = '', duration = 220) {
    if (!el) return;
    if (typeof targetVal !== 'number' || isNaN(targetVal)) {
      el.textContent = targetVal !== null && targetVal !== undefined ? targetVal : '–';
      return;
    }

    const existing = activeNumberAnimations.get(el);
    if (existing) caf(existing);

    const rawPrev = el.textContent.replace(/[^0-9.-]/g, '');
    let startVal = parseFloat(rawPrev);
    if (isNaN(startVal)) startVal = targetVal;

    if (Math.abs(startVal - targetVal) < 0.001) {
      el.textContent = targetVal.toFixed(decimals) + suffix;
      return;
    }

    const startTime = nowFn();
    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (targetVal - startVal) * ease;
      el.textContent = current.toFixed(decimals) + suffix;

      if (progress < 1) {
        const handle = raf(tick);
        activeNumberAnimations.set(el, handle);
      } else {
        el.textContent = targetVal.toFixed(decimals) + suffix;
        activeNumberAnimations.delete(el);
      }
    }

    const handle = raf(tick);
    activeNumberAnimations.set(el, handle);
  }

  // =========================================================================
  // KPIs Rendering (Storytelling with Data - Simple Text / Stat Tiles)
  // =========================================================================
  function renderKpis() {
    let meanVal = 0, delta = 0, tahanPct = 0, tahanCount = 0, totalCount = 0;
    let rentanTotal = 0, minVal = 0, maxVal = 0, poverty = null;

    if (!selectedProvince) {
      // National
      const nat = data.national[currentYear] || {};
      const natPrev = data.national[currentYear - 1] || null;
      meanVal = nat.mean_ikp || 0;
      delta = natPrev ? (meanVal - natPrev.mean_ikp) : 0;
      tahanPct = nat.tahan_pct || 0;
      tahanCount = nat.tahan_total || 0;
      totalCount = nat.total_kab || 514;
      rentanTotal = nat.rentan_total || 0;
      minVal = nat.min_ikp || 0;
      maxVal = nat.max_ikp || 0;

      // Calculate national average poverty if available (fallback to latest available year if current year not yet published)
      let povYear = currentYear;
      let povArr = Object.values(data.provinces)
        .map(p => p.yearly[povYear]?.kemiskinan_persen)
        .filter(v => v !== null && v !== undefined);
      if (povArr.length === 0 && povYear > 2025) {
        povYear = 2025;
        povArr = Object.values(data.provinces)
          .map(p => p.yearly[povYear]?.kemiskinan_persen)
          .filter(v => v !== null && v !== undefined);
      }
      if (povArr.length > 0) {
        poverty = (povArr.reduce((a, b) => a + b, 0) / povArr.length).toFixed(2);
      }
    } else {
      // Selected Province
      const pData = data.provinces[selectedProvince];
      const yData = pData?.yearly[currentYear] || {};
      const yPrev = pData?.yearly[currentYear - 1] || null;
      meanVal = yData.mean_ikp || 0;
      delta = yPrev ? (meanVal - yPrev.mean_ikp) : 0;
      tahanPct = yData.total_kab > 0 ? (((yData.tahan_count || 0) / yData.total_kab) * 100).toFixed(1) : 0;
      tahanCount = yData.tahan_count || 0;
      totalCount = yData.total_kab || 0;
      rentanTotal = yData.rentan_count || 0;
      minVal = yData.min_ikp || 0;
      maxVal = yData.max_ikp || 0;
      poverty = yData.kemiskinan_persen !== undefined ? yData.kemiskinan_persen : null;
      if (poverty === null && currentYear > 2025) {
        poverty = pData?.yearly[2025]?.kemiskinan_persen || null;
      }
    }

    // Tile 1: Rata-rata IKP
    if (elKpiMean) animateNumber(elKpiMean, meanVal, 2);
    const sign = delta > 0 ? '+' : '';
    if (elKpiMeanDelta) elKpiMeanDelta.textContent = delta !== 0 ? `${sign}${delta.toFixed(2)} vs tahun sebelumnya` : 'Tahun awal panel';

    // Status classification
    let statusClass = 'Tahan';
    if (meanVal < 50) {
      statusClass = 'Sangat Rentan';
    } else if (meanVal < 65) {
      statusClass = 'Rentan';
    } else if (meanVal < 75) {
      statusClass = 'Agak Tahan';
    } else if (meanVal >= 85) {
      statusClass = 'Sangat Tahan';
    }
    if (elKpiMeanBadge) {
      elKpiMeanBadge.textContent = statusClass;
      elKpiMeanBadge.className = 'figure-status';
    }

    // Tile 2: Ketahanan Daerah
    const tahanPctNum = typeof tahanPct === 'number' ? tahanPct : parseFloat(tahanPct) || 0;
    if (elKpiTahanPct) animateNumber(elKpiTahanPct, tahanPctNum, 1, '%');
    if (elKpiTahanCount) elKpiTahanCount.textContent = `${tahanCount} dari ${totalCount} kabupaten/kota`;

    // Tile 3: Daerah Rentan / Prioritas
    if (elKpiRentanTotal) animateNumber(elKpiRentanTotal, rentanTotal, 0);
    if (elKpiRentanLabel) elKpiRentanLabel.textContent = selectedProvince ? `Daerah rentan di ${selectedProvince}` : `Kabupaten/kota rentan nasional (Kelompok 1-3)`;

    // Tile 4: Disparitas
    const rangeVal = maxVal - minVal;
    if (elKpiRange) animateNumber(elKpiRange, rangeVal, 1);
    if (elKpiRangeDetail) elKpiRangeDetail.textContent = `Skor ${minVal.toFixed(1)} sampai ${maxVal.toFixed(1)}`;

    // Tile 5: Kemiskinan
    if (elKpiPoverty) {
      if (poverty !== null && !isNaN(parseFloat(poverty))) {
        animateNumber(elKpiPoverty, parseFloat(poverty), 2, '%');
      } else {
        elKpiPoverty.textContent = '–';
      }
    }
    if (elKpiPovertySub) {
      if (poverty !== null) {
        elKpiPovertySub.textContent = selectedProvince ? `Tingkat kemiskinan ${selectedProvince}` : `Rata-rata kemiskinan provinsi (BPS)`;
      } else {
        elKpiPovertySub.textContent = 'Data belum dirilis untuk tahun ini';
      }
    }

    // Update selected province badge in map header
    if (elSelectedProvBadge && elSelectedProvName) {
      if (selectedProvince) {
        elSelectedProvBadge.style.display = 'inline-flex';
        elSelectedProvName.textContent = selectedProvince;
      } else {
        elSelectedProvBadge.style.display = 'none';
      }
    }
  }

  function getStepForValue(val) {
    if (val === null || val === undefined || isNaN(val)) return 0;
    if (activeMetric === 'ikp') {
      if (val >= 82) return 5;
      if (val >= 75) return 4;
      if (val >= 68) return 3;
      if (val >= 55) return 2;
      return 1;
    } else if (activeMetric === 'rentan_pct') {
      if (val === 0) return 5;
      if (val <= 15) return 4;
      if (val <= 35) return 3;
      if (val <= 60) return 2;
      return 1;
    } else {
      if (val <= 6) return 5;
      if (val <= 10) return 4;
      if (val <= 15) return 3;
      if (val <= 22) return 2;
      return 1;
    }
  }

  // Legend ranges follow the metric the map is showing, so the labels never
  // describe thresholds the map is not using.
  const LEGEND_RANGES = {
    ikp: { 5: '82 ke atas', 4: '75 sampai 81', 3: '68 sampai 74', 2: '55 sampai 67', 1: 'kurang dari 55' },
    rentan_pct: { 5: '0%', 4: '1 sampai 15%', 3: '16 sampai 35%', 2: '36 sampai 60%', 1: 'lebih dari 60%' },
    kemiskinan: { 5: '6% atau kurang', 4: '7 sampai 10%', 3: '11 sampai 15%', 2: '16 sampai 22%', 1: 'lebih dari 22%' }
  };

  // Bapanas groups 1 to 6 folded onto the map's five classes.
  function groupStep(grp) {
    if (grp === 1) return 1;
    if (grp === 2 || grp === 3) return 2;
    if (grp === 4) return 3;
    if (grp === 5) return 4;
    if (grp === 6) return 5;
    return 0;
  }

  function updateSortIndicators() {
    document.querySelectorAll('.data-table th[data-sort]').forEach(th => {
      const isSorted = th.dataset.sort === sortField;
      th.setAttribute('aria-sort', isSorted ? (sortAsc ? 'ascending' : 'descending') : 'none');
    });
  }

  // Step of a table record under the metric the map is showing. Provincial
  // metrics are looked up through the record's province.
  function recordStep(record) {
    if (activeMetric === 'ikp') return getStepForValue(record.ikp);
    const y = data.provinces[record.prov]?.yearly[currentYear];
    if (!y) return 0;
    return getStepForValue(activeMetric === 'rentan_pct' ? y.rentan_pct : y.kemiskinan_persen);
  }

  // =========================================================================
  // Map Rendering (Requirement #1: Interactive Indonesia Choropleth)
  // =========================================================================
  let refocusMapCode = null;

  function renderMap() {
    elMapSvg.innerHTML = '';
    const [vx, vy, vw, vh] = data.viewbox || [0, 0, 960, 420];
    elMapSvg.setAttribute('viewBox', `${vx} ${vy} ${vw} ${vh}`);

    if (selectedProvince) {
      elMapSvg.classList.add('has-selection');
    } else {
      elMapSvg.classList.remove('has-selection');
    }

    if (selectedClassification !== null) {
      elMapSvg.classList.add('has-class-filter');
    } else {
      elMapSvg.classList.remove('has-class-filter');
    }

    // Create container group
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    const stepColors = {
      1: 'var(--color-scale-1)',
      2: 'var(--color-scale-2)',
      3: 'var(--color-scale-3)',
      4: 'var(--color-scale-4)',
      5: 'var(--color-scale-5)'
    };

    function getColor(val) {
      const s = getStepForValue(val);
      return stepColors[s] || 'var(--color-paper-2)';
    }

    Object.entries(data.geo_map).forEach(([geoCode, geoInfo]) => {
      const yData = geoInfo.yearly[currentYear] || {};
      let val = null;
      if (activeMetric === 'ikp') val = yData.mean_ikp;
      else if (activeMetric === 'rentan_pct') val = yData.rentan_pct;
      else if (activeMetric === 'kemiskinan') val = yData.kemiskinan_persen;

      const step = getStepForValue(val);
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', geoInfo.d);
      path.setAttribute('fill', getColor(val));
      path.setAttribute('class', 'map-prov-path');
      path.setAttribute('data-code', geoCode);
      path.setAttribute('data-name', geoInfo.name);
      path.setAttribute('data-step', step);
      path.setAttribute('tabindex', '0');
      path.setAttribute('role', 'button');
      path.setAttribute('aria-label', `${geoInfo.provinces.join(', ')}: ${val !== null && val !== undefined ? val : 'data tidak tersedia'}`);

      // Check if this polygon matches classification filter
      if (selectedClassification !== null && step === selectedClassification) {
        path.classList.add('is-class-match');
      }

      // Check if this polygon contains the selectedProvince
      const isSelected = selectedProvince && geoInfo.provinces.includes(selectedProvince);
      if (isSelected) {
        path.classList.add('is-selected');
      }

      // Hover interaction
      path.addEventListener('mouseenter', (e) => {
        showTooltip(e, geoInfo, val);
      });
      path.addEventListener('mousemove', (e) => {
        positionTooltip(e);
      });
      path.addEventListener('mouseleave', () => {
        hideTooltip();
      });
      path.addEventListener('focus', () => {
        const box = path.getBoundingClientRect();
        showTooltip({ clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 }, geoInfo, val);
      });
      path.addEventListener('blur', hideTooltip);
      path.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          refocusMapCode = geoCode;
          path.dispatchEvent(new MouseEvent('click'));
        }
      });

      // Click to select
      path.addEventListener('click', () => {
        // If polygon has multiple provinces (e.g. Papua split in 2024), pick the first or cycle
        if (geoInfo.provinces.length === 1) {
          const provName = geoInfo.provinces[0];
          selectedProvince = selectedProvince === provName ? null : provName;
        } else {
          // If clicked again, reset; else pick first or match
          if (geoInfo.provinces.includes(selectedProvince)) {
            selectedProvince = null;
          } else {
            selectedProvince = geoInfo.provinces[0];
          }
        }
        elProvSelect.value = selectedProvince || '';
        currentPage = 1;
        updateUrlParams();
        renderAll();
      });

      g.appendChild(path);
    });

    // Paint the selected and filtered provinces last so their outline is not
    // overdrawn by neighbours.
    g.querySelectorAll('.is-class-match').forEach(el => g.appendChild(el));
    const selectedPath = g.querySelector('.is-selected');
    if (selectedPath) g.appendChild(selectedPath);

    elMapSvg.appendChild(g);

    if (refocusMapCode) {
      const again = elMapSvg.querySelector(`[data-code="${refocusMapCode}"]`);
      refocusMapCode = null;
      if (again) again.focus({ preventScroll: true });
    }
  }

  function showTooltip(e, geoInfo, val) {
    const yData = geoInfo.yearly[currentYear] || {};
    const provsList = geoInfo.provinces.join(', ');
    const metricLabel = activeMetric === 'ikp' ? 'Rata-rata IKP' : (activeMetric === 'rentan_pct' ? '% Daerah Rentan' : 'Kemiskinan P0');
    const metricUnit = activeMetric === 'ikp' ? '/ 100' : '%';
    const displayVal = val !== null && val !== undefined ? `${val}${metricUnit}` : 'Data tidak tersedia';

    elMapTooltip.innerHTML = `
      <div class="tooltip-title">${provsList}</div>
      <div class="tooltip-row"><span>${metricLabel}:</span> <strong>${displayVal}</strong></div>
      <div class="tooltip-row"><span>Kab/Kota:</span> <strong>${yData.total_kab || 0} daerah</strong></div>
      <div class="tooltip-row"><span>Daerah Rentan:</span> <strong>${yData.rentan_count || 0} daerah (${yData.rentan_pct || 0}%)</strong></div>
      <div class="tooltip-row"><span>Rentang IKP:</span> <strong>${yData.min_ikp || 0} - ${yData.max_ikp || 0}</strong></div>
    `;
    elMapTooltip.classList.add('is-visible');
    positionTooltip(e);
  }

  function positionTooltip(e) {
    const parent = elMapSvg.parentElement.getBoundingClientRect();
    const x = e.clientX - parent.left + 16;
    const y = e.clientY - parent.top + 16;
    elMapTooltip.style.left = `${Math.min(x, parent.width - 240)}px`;
    elMapTooltip.style.top = `${y}px`;
  }

  function hideTooltip() {
    elMapTooltip.classList.remove('is-visible');
  }

  // =========================================================================
  // Analytical Charts (Requirement #3, adhering strictly to @information)
  // Charts are drawn at the width of their container (1 SVG unit = 1 CSS px),
  // so text keeps its real size. All colour lives in CSS (style.css) or in the
  // tokens named below.
  // =========================================================================
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function svgEl(name, attrs, text) {
    const el = document.createElementNS(SVG_NS, name);
    Object.entries(attrs || {}).forEach(([k, v]) => el.setAttribute(k, v));
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function newChartSvg(width, height, label) {
    return svgEl('svg', {
      viewBox: `0 0 ${width} ${height}`,
      class: 'chart-svg',
      role: 'img',
      'aria-label': label
    });
  }

  function renderCharts() {
    renderChartTrend();
    renderChartRanking();
    renderChartPillars();
    renderChartScatter();
    renderInferentialSection();
  }

  /**
   * Visual 1: Line Chart - Tren Temporal Ketahanan Pangan (2018-2026)
   * Adheres to Storytelling with Data Ch. 2 (Line graph for time series)
   * Ch. 3 (Eliminate clutter, single y-axis, hairline gridlines)
   * Ch. 4 (Direct data point annotation on active year, no cryptic legend)
   */
  function renderChartTrend() {
    elChartTrend.innerHTML = '';
    const width = chartWidth(elChartTrend, 560);
    const height = 260;
    const pad = { top: 28, right: width < 420 ? 56 : 80, bottom: 34, left: 40 };

    const svg = newChartSvg(width, height, 'Grafik garis rata-rata skor IKP tahun 2018 sampai 2026');

    const years = data.years;
    const xStep = (width - pad.left - pad.right) / (years.length - 1);

    // Get trend data (Selected Province or National)
    const activeSeries = [];
    const natSeries = [];
    years.forEach((y) => {
      const natVal = data.national[y]?.mean_ikp || 0;
      natSeries.push({ year: y, val: natVal });

      if (selectedProvince) {
        const pVal = data.provinces[selectedProvince]?.yearly[y]?.mean_ikp;
        activeSeries.push({ year: y, val: pVal !== undefined ? pVal : null });
      } else {
        activeSeries.push({ year: y, val: natVal });
      }
    });

    // Adaptive Y bounds so low-scoring regions (e.g. Papua 31-53) never pierce the bottom axis
    const allVals = [...natSeries, ...activeSeries]
      .map(p => p.val)
      .filter(v => v !== null && v !== undefined && !isNaN(v));
    const minDataVal = allVals.length > 0 ? Math.min(...allVals) : 50;

    let yMin = 50;
    const yMax = 100;
    let gridVals = [50, 65, 80, 100];

    if (minDataVal < 42) {
      yMin = 20;
      gridVals = [20, 40, 60, 80, 100];
    } else if (minDataVal < 52) {
      yMin = 35;
      gridVals = [35, 50, 65, 80, 100];
    }

    const scaleX = (i) => pad.left + i * xStep;
    const scaleY = (v) => height - pad.bottom - ((v - yMin) / (yMax - yMin)) * (height - pad.top - pad.bottom);

    gridVals.forEach(gv => {
      const yPos = scaleY(gv);
      svg.appendChild(svgEl('line', { x1: pad.left, x2: width - pad.right, y1: yPos, y2: yPos, class: 'chart-gridline' }));
      svg.appendChild(svgEl('text', { x: pad.left - 8, y: yPos + 4, 'text-anchor': 'end', class: 'chart-axis-text' }, gv));
    });

    // National benchmark when a province is selected
    if (selectedProvince) {
      const natPathD = natSeries.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)},${scaleY(pt.val)}`).join(' ');
      svg.appendChild(svgEl('path', { d: natPathD, class: 'chart-line-national' }));

      const lastNat = natSeries[natSeries.length - 1];
      svg.appendChild(svgEl('text', {
        x: scaleX(natSeries.length - 1) + 8,
        y: scaleY(lastNat.val) + 4,
        class: 'chart-axis-text'
      }, 'Nasional'));
    }

    // Active line with segmented continuity (no artificial bridges over missing years)
    let activePathD = '';
    let inSeg = false;
    years.forEach((y, i) => {
      const pt = activeSeries[i];
      if (pt && pt.val !== null && !isNaN(pt.val)) {
        activePathD += `${inSeg ? 'L' : 'M'} ${scaleX(i)},${scaleY(pt.val)} `;
        inSeg = true;
      } else {
        inSeg = false;
      }
    });

    if (activePathD.trim()) {
      svg.appendChild(svgEl('path', { d: activePathD.trim(), class: 'chart-line' }));
    }

    // Points and X-axis year labels
    years.forEach((y, i) => {
      const pt = activeSeries[i];
      const xPos = scaleX(i);
      const isCurrent = y === currentYear;

      svg.appendChild(svgEl('text', {
        x: xPos,
        y: height - 10,
        'text-anchor': 'middle',
        class: isCurrent ? 'chart-axis-text is-current' : 'chart-axis-text'
      }, y));

      if (pt && pt.val !== null && !isNaN(pt.val)) {
        const yPos = scaleY(pt.val);
        svg.appendChild(svgEl('circle', {
          cx: xPos,
          cy: yPos,
          r: isCurrent ? 6 : 3,
          class: isCurrent ? 'chart-point is-active' : 'chart-point'
        }));

        // Direct annotation for the current year (Ch. 4)
        if (isCurrent) {
          const labelY = yPos < pad.top + 16 ? yPos + 22 : yPos - 12;
          svg.appendChild(svgEl('text', {
            x: xPos,
            y: labelY,
            'text-anchor': 'middle',
            class: 'chart-bar-val'
          }, pt.val.toFixed(2)));
        }
      }
    });

    elChartTrend.appendChild(svg);
  }

  /**
   * Visual 2: Horizontal Bar Chart - Disparitas Daerah (Top 3 vs Bottom 3)
   * Baseline at zero always, sorted logically. Blue for tahan, amber for rentan.
   */
  function renderChartRanking() {
    elChartRanking.innerHTML = '';
    const width = chartWidth(elChartRanking, 420);
    const pad = { top: 8, right: 52, bottom: 8, left: Math.min(172, Math.round(width * 0.42)) };

    let items = [];
    if (!selectedProvince) {
      // Top 3 & Bottom 3 Provinces nationally
      const nat = data.national[currentYear] || {};
      const top3 = (nat.top5_prov || []).slice(0, 3).map(p => ({ name: p.nama_provinsi, val: p.ikp, isTop: true }));
      const bot3 = (nat.bot5_prov || []).slice(0, 3).map(p => ({ name: p.nama_provinsi, val: p.ikp, isTop: false }));
      items = [...top3, ...bot3];
    } else {
      // Top & Bottom Kab within selected province
      const kabList = data.kabupaten.filter(k => k.prov === selectedProvince && k.tahun === currentYear && k.ikp !== null);
      kabList.sort((a, b) => b.ikp - a.ikp);
      if (kabList.length <= 6) {
        items = kabList.map(k => ({ name: k.kab, val: k.ikp, isTop: k.ikp >= 70 }));
      } else {
        const top3 = kabList.slice(0, 3).map(k => ({ name: k.kab, val: k.ikp, isTop: true }));
        const bot3 = kabList.slice(-3).map(k => ({ name: k.kab, val: k.ikp, isTop: false }));
        items = [...top3, ...bot3];
      }
    }

    if (items.length === 0) {
      elChartRanking.innerHTML = emptyBlock('Data tidak tersedia untuk filter ini');
      return;
    }

    const rowH = 38;
    const barH = 16;
    const height = pad.top + pad.bottom + rowH * items.length;
    const svg = newChartSvg(width, height, 'Diagram batang skor IKP daerah tertinggi dan terendah');
    const scaleW = (width - pad.left - pad.right) / 100;
    const maxChars = Math.max(8, Math.floor((pad.left - 10) / 7.6));

    items.forEach((item, i) => {
      const y = pad.top + i * rowH + (rowH - barH) / 2;
      const barW = Math.max(item.val * scaleW, 2);

      svg.appendChild(svgEl('text', {
        x: pad.left - 10,
        y: y + barH / 2,
        'text-anchor': 'end',
        class: 'chart-bar-label'
      }, item.name.length > maxChars ? item.name.slice(0, maxChars - 1) + '…' : item.name));

      svg.appendChild(svgEl('rect', { x: pad.left, y, width: 100 * scaleW, height: barH, class: 'chart-bar-bg' }));
      svg.appendChild(svgEl('rect', {
        x: pad.left,
        y,
        width: barW,
        height: barH,
        class: `chart-bar-fill ${!item.isTop ? 'chart-bar-fill--rentan' : ''}`
      }));
      svg.appendChild(svgEl('text', {
        x: pad.left + barW + 8,
        y: y + barH / 2,
        class: 'chart-bar-val'
      }, item.val.toFixed(1)));
    });

    elChartRanking.appendChild(svg);
  }

  /**
   * Visual 3: Dekomposisi 3 Pilar Ketahanan Pangan (2024-2026)
   * Ketersediaan, Keterjangkauan, Pemanfaatan
   * Highlights that Ketersediaan is the national bottleneck (~61.1 vs ~84.8)
   */
  function renderChartPillars() {
    elChartPillars.innerHTML = '';
    const width = chartWidth(elChartPillars, 420);

    let pData = null;
    if (selectedProvince) {
      pData = data.provinces[selectedProvince]?.yearly[currentYear];
    } else {
      pData = data.national[currentYear];
    }

    if (!pData || pData.indeks_ketersediaan === null || pData.indeks_ketersediaan === undefined) {
      elChartPillars.innerHTML = emptyBlock('Data 3 pilar (Ketersediaan, Keterjangkauan, Pemanfaatan) tersedia mulai tahun 2024 sampai 2026.');
      return;
    }

    const pillars = [
      { key: 'indeks_keterjangkauan', name: 'Keterjangkauan', val: pData.indeks_keterjangkauan, desc: 'akses fisik dan ekonomi' },
      { key: 'indeks_pemanfaatan', name: 'Pemanfaatan', val: pData.indeks_pemanfaatan, desc: 'gizi, air, sanitasi' },
      { key: 'indeks_ketersediaan', name: 'Ketersediaan', val: pData.indeks_ketersediaan, desc: 'produksi dan cadangan' }
    ];

    // Direct labels sit above each bar, so the plot can use the full width.
    const pad = { top: 6, right: 56, bottom: 6, left: 0 };
    const rowH = 62;
    const barH = 18;
    const height = pad.top + pad.bottom + rowH * pillars.length;
    const svg = newChartSvg(width, height, 'Diagram batang tiga pilar ketahanan pangan');
    const scaleW = (width - pad.left - pad.right) / 100;

    pillars.forEach((p, i) => {
      const top = pad.top + i * rowH;
      const barY = top + 28;
      const barW = Math.max(p.val * scaleW, 2);
      const isBottleneck = p.key === 'indeks_ketersediaan';

      const label = svgEl('text', { x: pad.left, y: top + 16, class: 'chart-bar-label chart-bar-label--strong' });
      label.appendChild(svgEl('tspan', {}, p.name));
      label.appendChild(svgEl('tspan', { dx: 8, class: 'chart-axis-text' }, p.desc));
      svg.appendChild(label);

      svg.appendChild(svgEl('rect', { x: pad.left, y: barY, width: 100 * scaleW, height: barH, class: 'chart-bar-bg' }));
      svg.appendChild(svgEl('rect', {
        x: pad.left,
        y: barY,
        width: barW,
        height: barH,
        class: `chart-bar-fill ${isBottleneck ? 'chart-bar-fill--rentan' : ''}`
      }));

      const val = svgEl('text', { x: pad.left + barW + 8, y: barY + barH / 2, class: 'chart-bar-val' }, p.val.toFixed(1));
      svg.appendChild(val);
      if (isBottleneck) {
        svg.appendChild(svgEl('text', {
          x: pad.left + barW + 8 + 44,
          y: barY + barH / 2,
          class: 'chart-axis-text chart-axis-text--mid'
        }, 'faktor pembatas'));
      }
    });

    elChartPillars.appendChild(svg);
  }

  /**
   * Visual 4: Scatterplot - Korelasi IKP vs Kemiskinan (P0)
   * Shows how regions with high poverty correlate with lower food security.
   * The lower right quadrant (poverty above 15%, IKP below 60) is the
   * double-vulnerability zone.
   */
  function renderChartScatter() {
    elChartScatter.innerHTML = '';
    const width = chartWidth(elChartScatter, 560);
    const height = 300;
    const pad = { top: 26, right: 28, bottom: 46, left: 42 };

    // Collect all provinces data for current year (fallback to 2025 for poverty if current year not yet published)
    const povYear = currentYear > 2025 ? 2025 : currentYear;
    const points = [];
    Object.entries(data.provinces).forEach(([prov, pInfo]) => {
      const yData = pInfo.yearly[currentYear];
      const povVal = pInfo.yearly[povYear]?.kemiskinan_persen;
      if (yData && yData.mean_ikp && povVal !== null && povVal !== undefined) {
        points.push({ prov, ikp: yData.mean_ikp, pov: povVal });
      }
    });

    if (points.length === 0) {
      elChartScatter.innerHTML = emptyBlock('Data kemiskinan tahun ini belum dipublikasikan oleh BPS');
      return;
    }

    const svg = newChartSvg(width, height, 'Diagram pencar tingkat kemiskinan P0 terhadap skor IKP provinsi');

    const xMin = 0, xMax = 35; // Kemiskinan %
    const yMin = 20, yMax = 100; // IKP

    const scaleX = (v) => pad.left + ((v - xMin) / (xMax - xMin)) * (width - pad.left - pad.right);
    const scaleY = (v) => height - pad.bottom - ((v - yMin) / (yMax - yMin)) * (height - pad.top - pad.bottom);

    // Double-vulnerability quadrant
    svg.appendChild(svgEl('rect', {
      x: scaleX(15),
      y: scaleY(60),
      width: scaleX(xMax) - scaleX(15),
      height: scaleY(yMin) - scaleY(60),
      class: 'chart-quadrant'
    }));
    svg.appendChild(svgEl('text', {
      x: scaleX(xMax) - 6,
      y: scaleY(yMin) - 8,
      'text-anchor': 'end',
      class: 'chart-axis-text'
    }, 'Prioritas ganda'));

    [20, 40, 60, 80, 100].forEach(gv => {
      const yPos = scaleY(gv);
      svg.appendChild(svgEl('line', { x1: pad.left, x2: width - pad.right, y1: yPos, y2: yPos, class: 'chart-gridline' }));
      svg.appendChild(svgEl('text', { x: pad.left - 8, y: yPos + 4, 'text-anchor': 'end', class: 'chart-axis-text' }, gv));
    });

    [5, 15, 25, 35].forEach(xv => {
      svg.appendChild(svgEl('text', {
        x: scaleX(xv),
        y: height - pad.bottom + 18,
        'text-anchor': 'middle',
        class: 'chart-axis-text'
      }, `${xv}%`));
    });

    svg.appendChild(svgEl('text', { x: pad.left, y: 12, class: 'chart-axis-text' }, 'Skor IKP'));
    svg.appendChild(svgEl('text', {
      x: pad.left + (width - pad.left - pad.right) / 2,
      y: height - 8,
      'text-anchor': 'middle',
      class: 'chart-axis-text'
    }, 'Tingkat kemiskinan P0 (%)'));

    points.forEach(pt => {
      const isSel = selectedProvince === pt.prov;
      const circle = svgEl('circle', {
        cx: scaleX(pt.pov),
        cy: scaleY(pt.ikp),
        r: isSel ? 7 : 4.5,
        class: `scatter-dot ${pt.ikp < 60 ? 'scatter-dot--rentan' : ''} ${isSel ? 'is-selected' : ''}`,
        tabindex: 0,
        role: 'button',
        'aria-label': `${pt.prov}: IKP ${pt.ikp.toFixed(1)}, kemiskinan ${pt.pov.toFixed(1)}%`
      });

      circle.appendChild(svgEl('title', {}, `${pt.prov}: IKP ${pt.ikp.toFixed(1)}, Kemiskinan ${pt.pov.toFixed(1)}%`));

      const choose = () => {
        selectedProvince = selectedProvince === pt.prov ? null : pt.prov;
        elProvSelect.value = selectedProvince || '';
        currentPage = 1;
        updateUrlParams();
        renderAll();
      };
      circle.addEventListener('click', choose);
      circle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          choose();
        }
      });

      svg.appendChild(circle);

      // Label if selected or extreme
      if (isSel || pt.pov >= 25 || (pt.ikp >= 85 && pt.pov <= 5)) {
        const xDot = scaleX(pt.pov);
        const yDot = scaleY(pt.ikp);
        const isNearRight = xDot > width - pad.right - 110;
        const textX = isNearRight ? xDot - 10 : xDot + 10;

        let yOffset = 4;
        if (pt.prov === 'Papua Pegunungan') yOffset += 7;
        if (pt.prov === 'Papua Tengah') yOffset -= 7;

        svg.appendChild(svgEl('text', {
          x: textX,
          y: yDot + yOffset,
          'text-anchor': isNearRight ? 'end' : 'start',
          class: isSel ? 'chart-axis-text is-current' : 'chart-axis-text'
        }, pt.prov));
      }
    });

    elChartScatter.appendChild(svg);
  }

  // =========================================================================
  // Inferential & Storytelling Models (ANOVA, K-Means, Multiple Regression)
  // =========================================================================
  let selectedPersonaKey = 'Urban Resilient';
  let isSimulatorInitialized = false;

  // Personas read on the same diverging scale as the map: the stronger the
  // persona, the closer to blue; the harder the crisis, the closer to amber.
  const PERSONA_COLOR = {
    'Agrarian Resilient': 'var(--color-scale-5)',
    'Urban Resilient': 'var(--color-scale-4)',
    'Agrarian Paradox': 'var(--color-scale-2)',
    'Chronic Crisis': 'var(--color-scale-1)'
  };

  const PERSONA_INFO = {
    'Urban Resilient': {
      title: 'Urban Resilient (Pusat Konsumsi Modern)',
      desc: 'Keterjangkauan & pemanfaatan gizi tertinggi (82.5 & 78.5), produksi lokal minim, angka kelaparan sangat rendah (8.0%). Dominan kota besar di Jawa & Sumatera.',
      policy: 'Intervensi: Penguatan rantai pasok logistik perkotaan, pemantauan stabilitas harga pangan esensial, dan mitigasi pemborosan makanan (food waste).'
    },
    'Agrarian Resilient': {
      title: 'Agrarian Resilient (Lumbung Pangan Berdaulat)',
      desc: 'Ketersediaan surplus tertinggi (73.4), ketahanan prima (IKP 75.2), kelaparan terendah (7.4%). Mayoritas kabupaten sentra pertanian di Sumatera, Jawa, Kalimantan, Sulawesi.',
      policy: 'Intervensi: Modernisasi teknologi pascapanen, perlindungan lahan pertanian abadi (LP2B), dan perluasan asuransi usaha tani.'
    },
    'Agrarian Paradox': {
      title: 'Agrarian Paradox (Rentan Kesejahteraan)',
      desc: 'Ketersediaan fisik cukup (52.9) tetapi akses daya beli dan sanitasi tertinggal; angka kelaparan mulai waspada (13.1%). Kabupaten transisi di Sumatera, Sulawesi, Bali-Nusra.',
      policy: 'Intervensi: Bantuan pangan bersyarat (PKH), penguatan ekonomi petani gurem untuk daya beli, edukasi gizi balita, dan penyediaan sanitasi air bersih.'
    },
    'Chronic Crisis': {
      title: 'Chronic Crisis (Krisis Multidimensi Akut)',
      desc: 'Defisit ketersediaan kritis (<28), akses ekonomi terisolasi, angka kelaparan melonjak drastis (>33%). 100% berada di Kawasan Timur (30 Papua, 12 Maluku).',
      policy: 'Intervensi: Pembangunan jalur logistik perintis, subsidi ongkos angkut pangan, revitalisasi pangan lokal (sagu/umbi), dan intervensi darurat stunting.'
    }
  };

  function renderInferentialSection() {
    if (!data || !data.analytics) return;
    renderAnovaCard();
    renderKmeansCard();
    renderRegressionCard();
    if (!isSimulatorInitialized) {
      initPolicySimulator();
      isSimulatorInitialized = true;
    }
  }

  // Pilar 1: ANOVA Card
  function renderAnovaCard() {
    const elContainer = document.getElementById('chartAnovaDisparity');
    const elTukeyList = document.getElementById('tukeyList');
    if (!elContainer || !elTukeyList) return;

    elContainer.innerHTML = '';
    elTukeyList.innerHTML = '';

    const width = chartWidth(elContainer, 520);
    const height = 270;
    const pad = { top: 40, right: 44, bottom: 28, left: 92 };

    const svg = newChartSvg(width, height, 'Rata-rata skor IKP tujuh gugus kepulauan, dipisah kabupaten dan kota');

    // Rata-rata IKP 2024 per gugus pulau, dihitung dinamis dari data 514 daerah
    const kabs2024 = data.kabupaten.filter(k => k.tahun === 2024 && k.gugus_pulau);
    const gugusMap = {};
    kabs2024.forEach(k => {
      const g = k.gugus_pulau;
      if (!gugusMap[g]) gugusMap[g] = { name: g, all: [], kab: [], kota: [] };
      if (k.ikp !== null) {
        gugusMap[g].all.push(k.ikp);
        if (k.tipe === 'Kota') gugusMap[g].kota.push(k.ikp);
        else gugusMap[g].kab.push(k.ikp);
      }
    });

    const avg = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
    const gugusData = Object.values(gugusMap).map(g => ({
      name: g.name === 'Bali-Nusa Tenggara' ? 'Bali-Nusra' : g.name,
      mean: Math.round(avg(g.all) * 10) / 10,
      kab: Math.round(avg(g.kab) * 10) / 10,
      kota: Math.round(avg(g.kota) * 10) / 10
    })).sort((a, b) => b.mean - a.mean);

    const nationalMean = Math.round(avg(kabs2024.map(k => k.ikp).filter(v => v !== null)) * 100) / 100;

    const minX = 40;
    const maxX = 85;
    const xScale = (v) => pad.left + ((v - minX) / (maxX - minX)) * (width - pad.left - pad.right);
    const rowH = (height - pad.top - pad.bottom) / gugusData.length;

    // Direct legend, drawn in the plot instead of a separate key
    const legendY = 12;
    svg.appendChild(svgEl('circle', { cx: pad.left + 4, cy: legendY - 4, r: 4, class: 'anova-dot anova-dot--kab' }));
    svg.appendChild(svgEl('text', { x: pad.left + 14, y: legendY, class: 'chart-axis-text' }, 'Kabupaten'));
    svg.appendChild(svgEl('circle', { cx: pad.left + 100, cy: legendY - 4, r: 4, class: 'anova-dot anova-dot--kota' }));
    svg.appendChild(svgEl('text', { x: pad.left + 110, y: legendY, class: 'chart-axis-text' }, 'Kota'));

    [45, 60, 75].forEach(gx => {
      const x = xScale(gx);
      svg.appendChild(svgEl('line', { x1: x, x2: x, y1: pad.top, y2: height - pad.bottom, class: 'chart-gridline' }));
      svg.appendChild(svgEl('text', { x, y: height - pad.bottom + 18, 'text-anchor': 'middle', class: 'chart-axis-text' }, gx));
    });

    // National average line, labelled in place
    const natX = xScale(nationalMean);
    svg.appendChild(svgEl('line', { x1: natX, x2: natX, y1: pad.top - 8, y2: height - pad.bottom, class: 'chart-reference' }));
    svg.appendChild(svgEl('text', {
      x: natX,
      y: pad.top - 14,
      'text-anchor': 'middle',
      class: 'chart-axis-text is-current'
    }, `Rata-rata nasional ${nationalMean}`));

    gugusData.forEach((d, idx) => {
      const y = pad.top + idx * rowH + rowH / 2;
      const barLen = xScale(d.mean) - pad.left;
      const isLow = d.mean < 60;

      svg.appendChild(svgEl('text', {
        x: pad.left - 10,
        y: y + 4,
        'text-anchor': 'end',
        class: isLow ? 'chart-bar-label chart-bar-label--strong' : 'chart-bar-label'
      }, d.name));

      svg.appendChild(svgEl('rect', {
        x: pad.left,
        y: y - 4,
        width: Math.max(0, barLen),
        height: 8,
        class: isLow ? 'anova-bar anova-bar--low' : 'anova-bar'
      }));
      svg.appendChild(svgEl('circle', { cx: xScale(d.kab), cy: y, r: 4.5, class: 'anova-dot anova-dot--kab' }));
      svg.appendChild(svgEl('circle', { cx: xScale(d.kota), cy: y, r: 4.5, class: 'anova-dot anova-dot--kota' }));

      svg.appendChild(svgEl('text', {
        x: Math.max(xScale(d.mean), xScale(d.kota)) + 12,
        y: y + 4,
        class: 'chart-bar-val'
      }, d.mean.toFixed(1)));
    });

    elContainer.appendChild(svg);

    // Statistik dan Tukey HSD dibaca dari anova_results.json (tertanam di dashboard_data.js)
    const anova = data.analytics.anova;
    const gugus = anova.two_way_anova.gugus_pulau;
    const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    setText('anovaFStat', gugus.f_statistic.toFixed(2));
    setText('anovaEtaSq', `${(gugus.partial_eta_sq * 100).toFixed(1)}%`);
    setText('anovaTipeF', `F = ${anova.two_way_anova.tipe_daerah.f_statistic.toFixed(2)}`);

    const fmtP = (p) => (p < 0.0001 ? '< 0.0001' : p.toFixed(4));
    const topTukey = [...anova.tukey_top_disparities]
      .sort((a, b) => a.meandiff - b.meandiff)
      .slice(0, 4)
      .map(t => ({
        pair: `${t.group2} vs ${t.group1}`.replace('Bali-Nusa Tenggara', 'Bali-Nusra'),
        diff: `${t.meandiff.toFixed(2)} poin`,
        p: fmtP(t['p-adj'])
      }));

    topTukey.forEach(item => {
      const li = document.createElement('li');
      li.className = 'tukey-item';
      li.innerHTML = `
        <span>${escapeHtml(item.pair)}</span>
        <span class="tukey-diff num">${item.diff} (${item.p})</span>
      `;
      elTukeyList.appendChild(li);
    });
  }

  // Pilar 2: K-Means Card
  function renderKmeansCard() {
    const elPills = document.getElementById('personaPillsRow');
    const elRadar = document.getElementById('chartKmeansRadar');
    const elDetail = document.getElementById('personaDetailCard');
    if (!elPills || !elRadar || !elDetail) return;

    const personas = data.analytics.kmeans.personas;
    const personaKeys = Object.keys(personas);

    elPills.innerHTML = '';
    personaKeys.forEach(key => {
      const p = personas[key];
      const isActive = key === selectedPersonaKey;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `persona-item ${isActive ? 'is-active' : ''}`;
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      btn.style.setProperty('--persona', PERSONA_COLOR[key] || 'var(--color-scale-3)');
      btn.innerHTML = `
        <span class="persona-swatch" aria-hidden="true"></span>
        <span class="persona-name">${escapeHtml(key)}</span>
        <span class="persona-count num">${p.count}</span>
      `;
      btn.addEventListener('click', () => {
        selectedPersonaKey = key;
        renderKmeansCard();
        const again = document.querySelector('#personaPillsRow .persona-item.is-active');
        if (again) again.focus({ preventScroll: true });
      });
      elPills.appendChild(btn);
    });

    // Radar chart
    elRadar.innerHTML = '';
    const width = chartWidth(elRadar, 520);
    const height = 320;
    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.max(44, Math.min(120, width / 2 - 104));

    const svg = newChartSvg(width, height, 'Diagram radar profil persona wilayah pada empat dimensi');

    const axes = [
      { name: 'Ketersediaan', angle: -Math.PI / 2, getVal: p => p.ketersediaan },
      { name: 'Keterjangkauan', angle: 0, getVal: p => p.keterjangkauan },
      { name: 'Bebas Kelaparan', angle: Math.PI / 2, getVal: p => Math.max(0, 100 - p.pou) },
      { name: 'Pemanfaatan', angle: Math.PI, getVal: p => p.pemanfaatan }
    ];

    // Background rings
    [0.25, 0.5, 0.75, 1.0].forEach(frac => {
      const r = maxR * frac;
      const polyPts = axes.map(a => `${(cx + r * Math.cos(a.angle)).toFixed(1)},${(cy + r * Math.sin(a.angle)).toFixed(1)}`).join(' ');
      svg.appendChild(svgEl('polygon', { points: polyPts, class: 'chart-ring' }));
    });

    // Axis lines and labels
    axes.forEach(a => {
      svg.appendChild(svgEl('line', {
        x1: cx,
        y1: cy,
        x2: cx + maxR * Math.cos(a.angle),
        y2: cy + maxR * Math.sin(a.angle),
        class: 'chart-gridline'
      }));

      const anchor = a.angle === 0 ? 'start' : (a.angle === Math.PI ? 'end' : 'middle');
      svg.appendChild(svgEl('text', {
        x: cx + (maxR + 14) * Math.cos(a.angle),
        y: cy + (maxR + 14) * Math.sin(a.angle) + 4,
        'text-anchor': anchor,
        class: 'chart-axis-text'
      }, a.name));
    });

    // Polygons for all personas (selected on top)
    const sortedKeys = [...personaKeys].sort(k => k === selectedPersonaKey ? 1 : -1);
    sortedKeys.forEach(key => {
      const p = personas[key];
      const isSelected = key === selectedPersonaKey;
      const color = PERSONA_COLOR[key] || 'var(--color-scale-3)';

      const pts = axes.map(a => {
        const r = (a.getVal(p) / 100) * maxR;
        return `${(cx + r * Math.cos(a.angle)).toFixed(1)},${(cy + r * Math.sin(a.angle)).toFixed(1)}`;
      }).join(' ');

      svg.appendChild(svgEl('polygon', {
        points: pts,
        fill: isSelected ? color : 'none',
        'fill-opacity': isSelected ? '0.2' : '0',
        stroke: color,
        'stroke-width': isSelected ? '2' : '1',
        'stroke-opacity': isSelected ? '1' : '0.5'
      }));

      if (isSelected) {
        axes.forEach(a => {
          const r = (a.getVal(p) / 100) * maxR;
          svg.appendChild(svgEl('circle', {
            cx: cx + r * Math.cos(a.angle),
            cy: cy + r * Math.sin(a.angle),
            r: 3.5,
            fill: color
          }));
        });
      }
    });

    elRadar.appendChild(svg);

    // Detail
    const info = PERSONA_INFO[selectedPersonaKey] || {};
    const curP = personas[selectedPersonaKey];
    const policyHtml = escapeHtml(info.policy || '').replace(/^([^:]+:)/, '<strong>$1</strong>');
    elDetail.innerHTML = `
      <div class="persona-detail-head">
        <h4 class="persona-detail-name">${escapeHtml(info.title || selectedPersonaKey)}</h4>
        <span class="persona-detail-count num">${curP.count} daerah (${curP.pct}%)</span>
      </div>
      <p class="persona-detail-desc">${escapeHtml(info.desc || '')}</p>
      <p class="persona-policy">${policyHtml}</p>
    `;
  }

  // Pilar 3: Regression Card
  function renderRegressionCard() {
    const elContainer = document.getElementById('chartRegressionTornado');
    if (!elContainer) return;

    elContainer.innerHTML = '';
    const width = chartWidth(elContainer, 520);
    const height = 150;
    const pad = { top: 12, right: 88, bottom: 12, left: Math.min(176, Math.round(width * 0.42)) };

    const svg = newChartSvg(width, height, 'Diagram batang koefisien regresi tiga tuas kebijakan');

    const reg = data.analytics?.regression;
    const levers = reg?.levers ? [
      { name: '1. Keterjangkauan (Akses)', beta: reg.levers.indeks_keterjangkauan.standardized_beta },
      { name: '2. Ketersediaan (Stok)', beta: reg.levers.indeks_ketersediaan.standardized_beta },
      { name: '3. Pemanfaatan (Gizi)', beta: reg.levers.indeks_pemanfaatan.standardized_beta }
    ] : [
      { name: '1. Keterjangkauan (Akses)', beta: -0.5176 },
      { name: '2. Ketersediaan (Stok)', beta: -0.2288 },
      { name: '3. Pemanfaatan (Gizi)', beta: -0.1460 }
    ];

    const maxAbsBeta = 0.6;
    const rowH = (height - pad.top - pad.bottom) / levers.length;

    levers.forEach((l, idx) => {
      const y = pad.top + idx * rowH + rowH / 2;
      const barLen = (Math.abs(l.beta) / maxAbsBeta) * (width - pad.left - pad.right);

      svg.appendChild(svgEl('text', {
        x: pad.left - 10,
        y: y + 4,
        'text-anchor': 'end',
        class: idx === 0 ? 'chart-bar-label chart-bar-label--strong' : 'chart-bar-label'
      }, l.name));

      svg.appendChild(svgEl('rect', {
        x: pad.left,
        y: y - 7,
        width: Math.max(0, barLen),
        height: 14,
        class: idx === 0 ? 'chart-bar-fill' : 'chart-bar-fill chart-bar-fill--quiet'
      }));

      svg.appendChild(svgEl('text', {
        x: pad.left + barLen + 8,
        y: y + 4,
        class: 'chart-bar-val'
      }, `β = ${l.beta.toFixed(3)}`));
    });

    elContainer.appendChild(svg);
  }

  // Interactive Policy Simulator
  function initPolicySimulator() {
    const sAccess = document.getElementById('simSliderAccess');
    const sAvail = document.getElementById('simSliderAvail');
    const sUtil = document.getElementById('simSliderUtil');
    const vAccess = document.getElementById('simValAccess');
    const vAvail = document.getElementById('simValAvail');
    const vUtil = document.getElementById('simValUtil');
    const elNewPou = document.getElementById('simNewPou');
    const elDeltaPou = document.getElementById('simDeltaPou');
    const btnReset = document.getElementById('resetSimBtn');

    if (!sAccess || !sAvail || !sUtil) return;

    const reg = data.analytics?.regression;
    const bAccess = reg?.levers?.indeks_keterjangkauan?.unstandardized_coef ?? -0.5348;
    const bAvail = reg?.levers?.indeks_ketersediaan?.unstandardized_coef ?? -0.1281;
    const bUtil = reg?.levers?.indeks_pemanfaatan?.unstandardized_coef ?? -0.1012;
    const baseline = reg?.scenarios?.[0]?.['Baseline PoU Nasional (%)'] ?? 11.08;

    function updateSimulation() {
      const dAccess = parseFloat(sAccess.value) || 0;
      const dAvail = parseFloat(sAvail.value) || 0;
      const dUtil = parseFloat(sUtil.value) || 0;

      vAccess.textContent = `+${dAccess} poin`;
      vAvail.textContent = `+${dAvail} poin`;
      vUtil.textContent = `+${dUtil} poin`;

      const deltaPou = (bAccess * dAccess) + (bAvail * dAvail) + (bUtil * dUtil);
      const newPou = Math.max(0, baseline + deltaPou);
      const reductionPct = Math.abs(deltaPou) / baseline * 100;

      elNewPou.textContent = `${newPou.toFixed(2)}%`;
      elDeltaPou.textContent = deltaPou === 0 ? '0.0%' : `-${reductionPct.toFixed(1)}%`;
      elDeltaPou.classList.toggle('is-gain', deltaPou < 0);
    }

    sAccess.addEventListener('input', updateSimulation);
    sAvail.addEventListener('input', updateSimulation);
    sUtil.addEventListener('input', updateSimulation);

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        sAccess.value = 0;
        sAvail.value = 0;
        sUtil.value = 0;
        updateSimulation();
      });
    }

    updateSimulation();
  }

  // =========================================================================
  // Data Explorer Table
  // =========================================================================
  function renderTable() {
    elTableBody.innerHTML = '';

    // Filter records
    let records = data.kabupaten.filter(k => k.tahun === currentYear);
    if (selectedProvince) {
      records = records.filter(k => k.prov === selectedProvince);
    }
    if (selectedClassification !== null) {
      records = records.filter(k => recordStep(k) === selectedClassification);
    }
    if (searchQuery) {
      records = records.filter(k =>
        k.kab.toLowerCase().includes(searchQuery) ||
        k.prov.toLowerCase().includes(searchQuery) ||
        (k.status && k.status.toLowerCase().includes(searchQuery))
      );
    }

    // Sort records
    records.sort((a, b) => {
      let va = a[sortField];
      let vb = b[sortField];
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      if (typeof va === 'string') {
        return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortAsc ? va - vb : vb - va;
    });

    updateSortIndicators();

    const totalRows = records.length;
    if (totalRows === 0) {
      elEmptyState.style.display = 'flex';
      elTableInfo.textContent = '0 data ditemukan';
      elPagination.innerHTML = '';
      return;
    }
    elEmptyState.style.display = 'none';

    // Pagination slice
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    if (currentPage > totalPages) currentPage = totalPages;
    const startIdx = (currentPage - 1) * rowsPerPage;
    const pageRows = records.slice(startIdx, startIdx + rowsPerPage);

    pageRows.forEach((r, idx) => {
      const tr = document.createElement('tr');

      // Status carries the same scale colour the map uses for its IKP class.
      const statusStep = groupStep(r.grp);

      const personaLabel = r.persona
        ? `<span class="persona-tag" style="--persona: ${PERSONA_COLOR[r.persona] || 'var(--color-scale-3)'};"><span class="persona-swatch" aria-hidden="true"></span>${escapeHtml(r.persona)}</span>`
        : '';

      tr.innerHTML = `
        <td class="num">${startIdx + idx + 1}</td>
        <td><strong>${escapeHtml(r.kab)}</strong>${personaLabel}</td>
        <td>${escapeHtml(r.tipe || 'Kabupaten')}</td>
        <td>${escapeHtml(r.prov)}</td>
        <td class="num"><strong>${r.ikp !== null ? r.ikp.toFixed(2) : '–'}</strong></td>
        <td class="num">${r.rank || '–'}</td>
        <td class="num">${r.grp || '–'}</td>
        <td><span class="status-mark status-mark--${statusStep}"><span class="status-swatch" aria-hidden="true"></span>${escapeHtml(r.status || '–')}</span></td>
        <td class="num">${r.avail !== null ? r.avail.toFixed(1) : '–'}</td>
        <td class="num">${r.access !== null ? r.access.toFixed(1) : '–'}</td>
        <td class="num">${r.util !== null ? r.util.toFixed(1) : '–'}</td>
      `;
      elTableBody.appendChild(tr);
    });

    const classLabels = {
      1: 'Sangat rentan',
      2: 'Rentan',
      3: 'Agak tahan',
      4: 'Tahan',
      5: 'Sangat tahan'
    };
    const filterInfo = selectedClassification ? ` (Filter: ${classLabels[selectedClassification]})` : '';
    elTableInfo.textContent = `Menampilkan ${startIdx + 1} sampai ${Math.min(startIdx + rowsPerPage, totalRows)} dari ${totalRows} daerah${filterInfo}`;
    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    elPagination.innerHTML = '';
    if (totalPages <= 1) return;

    function goToPage(targetPage) {
      if (targetPage < 1 || targetPage > totalPages || targetPage === currentPage) return;
      currentPage = targetPage;
      renderTable();
    }

    // Prev Button
    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'btn';
    prevBtn.textContent = 'Sebelumnya';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
      goToPage(currentPage - 1);
    });
    elPagination.appendChild(prevBtn);

    // Current page indicator
    const pageIndicator = document.createElement('span');
    pageIndicator.className = 'pagination-status num';
    pageIndicator.setAttribute('aria-live', 'polite');
    pageIndicator.textContent = `Hal ${currentPage} / ${totalPages}`;
    elPagination.appendChild(pageIndicator);

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'btn';
    nextBtn.textContent = 'Berikutnya';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
      goToPage(currentPage + 1);
    });
    elPagination.appendChild(nextBtn);
  }

  function exportCsv() {
    let records = data.kabupaten.filter(k => k.tahun === currentYear);
    if (selectedProvince) {
      records = records.filter(k => k.prov === selectedProvince);
    }
    if (selectedClassification !== null) {
      records = records.filter(k => recordStep(k) === selectedClassification);
    }
    if (searchQuery) {
      records = records.filter(k =>
        k.kab.toLowerCase().includes(searchQuery) ||
        k.prov.toLowerCase().includes(searchQuery)
      );
    }

    const headers = ['Tahun', 'Provinsi', 'Kabupaten/Kota', 'Tipe', 'Skor IKP', 'Peringkat', 'Kelompok', 'Status Kerentanan', 'Ketersediaan', 'Keterjangkauan', 'Pemanfaatan'];
    const rows = records.map(r => [
      r.tahun,
      `"${r.prov}"`,
      `"${r.kab}"`,
      `"${r.tipe}"`,
      r.ikp,
      r.rank,
      r.grp,
      `"${r.status}"`,
      r.avail,
      r.access,
      r.util
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IKP_Dashboard_${currentYear}_${selectedProvince ? selectedProvince.replace(/\s+/g, '_') : 'Nasional'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // =========================================================================
  // Interactive Legend Classification Filter
  // =========================================================================
  function setupLegendFilter() {
    const stepBtns = document.querySelectorAll('.legend-step');
    stepBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const step = parseInt(btn.dataset.step, 10);
        if (selectedClassification === step) {
          selectedClassification = null;
        } else {
          selectedClassification = step;
        }
        currentPage = 1;
        updateLegendUI();
        renderMap();
        renderTable();
      });
    });

    if (elClearLegendFilterBtn) {
      elClearLegendFilterBtn.addEventListener('click', () => {
        selectedClassification = null;
        currentPage = 1;
        updateLegendUI();
        renderMap();
        renderTable();
      });
    }
  }

  function updateLegendUI() {
    const stepBtns = document.querySelectorAll('.legend-step');
    const ranges = LEGEND_RANGES[activeMetric] || LEGEND_RANGES.ikp;
    stepBtns.forEach(btn => {
      const step = parseInt(btn.dataset.step, 10);
      const rangeEl = btn.querySelector('.legend-range');
      if (rangeEl) rangeEl.textContent = ranges[step];
      const isActive = selectedClassification === step;
      if (isActive) {
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('is-active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });

    if (elClearLegendFilterBtn) {
      elClearLegendFilterBtn.style.display = selectedClassification !== null ? 'inline-flex' : 'none';
    }
  }

  function showLoading(isLoading) {
    const el = document.getElementById('loadingState');
    if (el) el.style.display = isLoading ? 'flex' : 'none';
    const main = document.getElementById('main');
    if (main) main.setAttribute('aria-busy', isLoading ? 'true' : 'false');
  }

  function showError(msg) {
    const el = document.getElementById('errorState');
    if (el) {
      el.style.display = 'flex';
      const msgEl = document.getElementById('errorMessage');
      if (msgEl) msgEl.textContent = msg;
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
