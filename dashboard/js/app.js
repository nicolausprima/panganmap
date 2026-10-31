/**
 * Dashboard Ketahanan Pangan Indonesia (IKP 2018-2026)
 * Storytelling with Data Implementation
 * Built with Hallmark Design System (Wayfind theme)
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
  const elExportBtn = document.getElementById('exportBtn');
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
      setupEventListeners();
      setupLegendFilter();

      renderAll();
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

    elExportBtn.addEventListener('click', exportCsv);
    const elSidebarExportBtn = document.getElementById('sidebarExportBtn');
    if (elSidebarExportBtn) {
      elSidebarExportBtn.addEventListener('click', exportCsv);
    }

    // Table sorting headers
    document.querySelectorAll('.data-table th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.dataset.sort;
        if (sortField === field) {
          sortAsc = !sortAsc;
        } else {
          sortField = field;
          sortAsc = field === 'kab' || field === 'prov';
        }
        renderTable();
      });
    });

    // Sidebar navigation smooth scrolling and active tracking
    setupNavigation();
  }

  function setupNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    if (navLinks.length === 0) return;

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          const target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('is-active'));
            link.classList.add('is-active');
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
        'tableSection': document.querySelector('a[href="#tableSection"]')
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const activeLink = sectionMap[entry.target.id];
            if (activeLink) {
              navLinks.forEach(l => l.classList.remove('is-active'));
              activeLink.classList.add('is-active');
            }
          }
        });
      }, { rootMargin: '-20% 0px -60% 0px' });

      Object.keys(sectionMap).forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    }
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

  function animateNumber(el, targetVal, decimals = 2, suffix = '', duration = 350) {
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

    // Trigger visual feedback
    el.classList.remove('val-pulse');
    void el.offsetWidth;
    el.classList.add('val-pulse');

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
      elKpiMeanBadge.className = 'dark-card-pill';
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
    if (elKpiRangeDetail) elKpiRangeDetail.textContent = `Skor ${minVal.toFixed(1)} s/d ${maxVal.toFixed(1)}`;

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

  // =========================================================================
  // Map Rendering (Requirement #1: Interactive Indonesia Choropleth)
  // =========================================================================
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

    elMapSvg.appendChild(g);
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
  // =========================================================================
  function renderCharts() {
    renderChartTrend();
    renderChartRanking();
    renderChartPillars();
    renderChartScatter();
  }

  /**
   * Visual 1: Line Chart - Tren Temporal Ketahanan Pangan (2018-2026)
   * Adheres to Storytelling with Data Ch. 2 (Line graph for time series)
   * Ch. 3 (Eliminate clutter, single y-axis, hairline gridlines)
   * Ch. 4 (Direct data point annotation on active year, no cryptic legend)
   */
  function renderChartTrend() {
    elChartTrend.innerHTML = '';
    const width = 480;
    const height = 220;
    const pad = { top: 28, right: 68, bottom: 36, left: 42 };

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('class', 'chart-svg');

    // Years
    const years = data.years;
    const xStep = (width - pad.left - pad.right) / (years.length - 1);

    // Get trend data (Selected Province or National)
    let activeSeries = [];
    let natSeries = [];
    years.forEach((y, i) => {
      const natVal = data.national[y]?.mean_ikp || 0;
      natSeries.push({ year: y, val: natVal });

      if (selectedProvince) {
        const pVal = data.provinces[selectedProvince]?.yearly[y]?.mean_ikp;
        activeSeries.push({ year: y, val: pVal !== undefined ? pVal : null });
      } else {
        activeSeries.push({ year: y, val: natVal });
      }
    });

    // Determine adaptive Y bounds so low-scoring regions (e.g. Papua 31-53) never pierce the bottom axis
    const allVals = [...natSeries, ...activeSeries]
      .map(p => p.val)
      .filter(v => v !== null && v !== undefined && !isNaN(v));
    const minDataVal = allVals.length > 0 ? Math.min(...allVals) : 50;

    let yMin = 50;
    let yMax = 100;
    let gridVals = [50, 65, 80, 100];

    if (minDataVal < 42) {
      yMin = 20;
      yMax = 100;
      gridVals = [20, 40, 60, 80, 100];
    } else if (minDataVal < 52) {
      yMin = 35;
      yMax = 100;
      gridVals = [35, 50, 65, 80, 100];
    }

    function scaleX(i) { return pad.left + i * xStep; }
    function scaleY(v) { return height - pad.bottom - ((v - yMin) / (yMax - yMin)) * (height - pad.top - pad.bottom); }

    // Gridlines (Hairline 1px)
    gridVals.forEach(gv => {
      const yPos = scaleY(gv);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', pad.left);
      line.setAttribute('x2', width - pad.right);
      line.setAttribute('y1', yPos);
      line.setAttribute('y2', yPos);
      line.setAttribute('class', 'chart-gridline');
      svg.appendChild(line);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', pad.left - 8);
      text.setAttribute('y', yPos + 3);
      text.setAttribute('text-anchor', 'end');
      text.setAttribute('class', 'chart-axis-text');
      text.textContent = gv;
      svg.appendChild(text);
    });

    // If province selected, render National benchmark as dashed muted line
    if (selectedProvince) {
      const natPathD = natSeries.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)},${scaleY(pt.val)}`).join(' ');
      const natPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      natPath.setAttribute('d', natPathD);
      natPath.setAttribute('class', 'chart-line-national');
      svg.appendChild(natPath);

      // Label at end of national line
      const lastNat = natSeries[natSeries.length - 1];
      const lblNat = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      lblNat.setAttribute('x', scaleX(natSeries.length - 1) + 6);
      lblNat.setAttribute('y', scaleY(lastNat.val) + 3);
      lblNat.setAttribute('class', 'chart-axis-text');
      lblNat.setAttribute('font-size', '11px');
      lblNat.textContent = `Nasional`;
      svg.appendChild(lblNat);
    }

    // Active line with segmented continuity (avoids artificial diagonal bridges over missing years)
    let activePathD = '';
    let inSeg = false;
    years.forEach((y, i) => {
      const pt = activeSeries[i];
      if (pt && pt.val !== null && !isNaN(pt.val)) {
        const cmd = inSeg ? 'L' : 'M';
        activePathD += `${cmd} ${scaleX(i)},${scaleY(pt.val)} `;
        inSeg = true;
      } else {
        inSeg = false;
      }
    });

    if (activePathD.trim()) {
      const activePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      activePath.setAttribute('d', activePathD.trim());
      activePath.setAttribute('class', 'chart-line');
      svg.appendChild(activePath);
    }

    // Draw points and X-axis year labels
    years.forEach((y, i) => {
      const pt = activeSeries[i];
      const xPos = scaleX(i);

      // Year text
      const xText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      xText.setAttribute('x', xPos);
      xText.setAttribute('y', height - 12);
      xText.setAttribute('text-anchor', 'middle');
      xText.setAttribute('class', 'chart-axis-text');
      if (y === currentYear) xText.setAttribute('font-weight', '800');
      xText.textContent = y;
      svg.appendChild(xText);

      if (pt && pt.val !== null && !isNaN(pt.val)) {
        const yPos = scaleY(pt.val);
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', xPos);
        circle.setAttribute('cy', yPos);
        circle.setAttribute('r', y === currentYear ? 5.5 : 3.5);
        circle.setAttribute('class', y === currentYear ? 'chart-point is-active' : 'chart-point');
        svg.appendChild(circle);

        // Direct annotation for current year (Ch. 4)
        if (y === currentYear) {
          const valText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          valText.setAttribute('x', xPos);
          const labelY = yPos < pad.top + 16 ? yPos + 18 : yPos - 10;
          valText.setAttribute('y', labelY);
          valText.setAttribute('text-anchor', 'middle');
          valText.setAttribute('class', 'chart-bar-val val-pulse');
          valText.textContent = pt.val.toFixed(2);
          svg.appendChild(valText);
        }
      }
    });

    elChartTrend.appendChild(svg);
  }

  /**
   * Visual 2: Horizontal Bar Chart - Disparitas Daerah (Top 5 vs Bottom 5)
   * Adheres to Storytelling with Data Ch. 2 (Horizontal bar for comparison)
   * Baseline at zero always, sorted logically
   * Color: Cobalt for high/tahan, Amber for low/rentan
   */
  function renderChartRanking() {
    elChartRanking.innerHTML = '';
    const width = 480;
    const height = 240;
    const pad = { top: 12, right: 60, bottom: 16, left: 150 };

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('class', 'chart-svg');

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
      elChartRanking.innerHTML = '<div class="state-empty" style="padding:var(--space-md);"><span class="section-desc">Data tidak tersedia untuk filter ini</span></div>';
      return;
    }

    const rowH = (height - pad.top - pad.bottom) / items.length;
    const barH = Math.min(rowH - 6, 20);
    const maxVal = 100;
    const scaleW = (width - pad.left - pad.right) / maxVal;

    items.forEach((item, i) => {
      const y = pad.top + i * rowH + (rowH - barH) / 2;
      const barW = Math.max(item.val * scaleW, 2);

      // Label (Left)
      const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      lbl.setAttribute('x', pad.left - 8);
      lbl.setAttribute('y', y + barH / 2);
      lbl.setAttribute('text-anchor', 'end');
      lbl.setAttribute('class', 'chart-bar-label');
      // Truncate long names cleanly
      lbl.textContent = item.name.length > 18 ? item.name.slice(0, 17) + '…' : item.name;
      svg.appendChild(lbl);

      // Bar Background
      const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bg.setAttribute('x', pad.left);
      bg.setAttribute('y', y);
      bg.setAttribute('width', 100 * scaleW);
      bg.setAttribute('height', barH);
      bg.setAttribute('class', 'chart-bar-bg');
      svg.appendChild(bg);

      // Bar Fill
      const fill = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      fill.setAttribute('x', pad.left);
      fill.setAttribute('y', y);
      fill.setAttribute('width', barW);
      fill.setAttribute('height', barH);
      fill.setAttribute('class', `chart-bar-fill ${!item.isTop ? 'chart-bar-fill--rentan' : ''}`);
      svg.appendChild(fill);

      // Value text at end of bar
      const val = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      val.setAttribute('x', pad.left + barW + 6);
      val.setAttribute('y', y + barH / 2);
      val.setAttribute('class', 'chart-bar-val');
      val.textContent = item.val.toFixed(1);
      svg.appendChild(val);
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
    const width = 480;
    const height = 220;
    const pad = { top: 22, right: 90, bottom: 24, left: 154 };

    let pData = null;
    if (selectedProvince) {
      pData = data.provinces[selectedProvince]?.yearly[currentYear];
    } else {
      pData = data.national[currentYear];
    }

    if (!pData || pData.indeks_ketersediaan === null || pData.indeks_ketersediaan === undefined) {
      elChartPillars.innerHTML = `
        <div class="state-empty" style="padding:var(--space-md);">
          <span class="section-desc">Data 3 pilar (Ketersediaan, Keterjangkauan, Pemanfaatan) tersedia mulai tahun 2024–2026.</span>
        </div>`;
      return;
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('class', 'chart-svg');

    const pillars = [
      { key: 'indeks_keterjangkauan', name: 'Keterjangkauan', val: pData.indeks_keterjangkauan, desc: 'Akses fisik & ekonomi' },
      { key: 'indeks_pemanfaatan', name: 'Pemanfaatan', val: pData.indeks_pemanfaatan, desc: 'Gizi, air, sanitasi' },
      { key: 'indeks_ketersediaan', name: 'Ketersediaan', val: pData.indeks_ketersediaan, desc: 'Produksi & cadangan' }
    ];

    const rowH = (height - pad.top - pad.bottom) / pillars.length;
    const barH = 24;
    const maxVal = 100;
    const scaleW = (width - pad.left - pad.right) / maxVal;

    pillars.forEach((p, i) => {
      const y = pad.top + i * rowH + (rowH - barH) / 2;
      const barW = Math.max(p.val * scaleW, 2);
      const isBottleneck = p.key === 'indeks_ketersediaan';

      // Label
      const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      lbl.setAttribute('x', pad.left - 10);
      lbl.setAttribute('y', y + barH / 2 - 3);
      lbl.setAttribute('text-anchor', 'end');
      lbl.setAttribute('class', 'chart-bar-label');
      lbl.setAttribute('font-weight', '800');
      lbl.textContent = p.name;
      svg.appendChild(lbl);

      // Sub-label
      const sub = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      sub.setAttribute('x', pad.left - 10);
      sub.setAttribute('y', y + barH / 2 + 10);
      sub.setAttribute('text-anchor', 'end');
      sub.setAttribute('class', 'chart-axis-text');
      sub.textContent = p.desc;
      svg.appendChild(sub);

      // BG
      const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bg.setAttribute('x', pad.left);
      bg.setAttribute('y', y);
      bg.setAttribute('width', 100 * scaleW);
      bg.setAttribute('height', barH);
      bg.setAttribute('class', 'chart-bar-bg');
      svg.appendChild(bg);

      // Fill
      const fill = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      fill.setAttribute('x', pad.left);
      fill.setAttribute('y', y);
      fill.setAttribute('width', barW);
      fill.setAttribute('height', barH);
      fill.setAttribute('class', `chart-bar-fill ${isBottleneck ? 'chart-bar-fill--rentan' : ''}`);
      svg.appendChild(fill);

      // Value
      const val = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      val.setAttribute('x', pad.left + barW + 8);
      val.setAttribute('y', y + barH / 2);
      val.setAttribute('class', 'chart-bar-val');
      val.textContent = isBottleneck ? `${p.val.toFixed(1)} (Bottleneck)` : p.val.toFixed(1);
      svg.appendChild(val);
    });

    elChartPillars.appendChild(svg);
  }

  /**
   * Visual 4: Scatterplot - Korelasi IKP vs Kemiskinan (P0)
   * Adheres to Storytelling with Data Ch. 2 (Scatterplot for correlation)
   * Shows how regions with high poverty correlate with lower food security
   */
  function renderChartScatter() {
    elChartScatter.innerHTML = '';
    const width = 480;
    const height = 224;
    const pad = { top: 24, right: 40, bottom: 44, left: 42 };

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('class', 'chart-svg');

    // Collect all provinces data for current year (fallback to 2025 for poverty if current year not yet published)
    const povYear = currentYear > 2025 ? 2025 : currentYear;
    const points = [];
    Object.entries(data.provinces).forEach(([prov, pInfo]) => {
      const yData = pInfo.yearly[currentYear];
      const povVal = pInfo.yearly[povYear]?.kemiskinan_persen;
      if (yData && yData.mean_ikp && povVal !== null && povVal !== undefined) {
        points.push({
          prov: prov,
          ikp: yData.mean_ikp,
          pov: povVal
        });
      }
    });

    if (points.length === 0) {
      elChartScatter.innerHTML = `
        <div class="state-empty" style="padding:var(--space-md);">
          <span class="section-desc">Data kemiskinan tahun ini belum dipublikasikan oleh BPS</span>
        </div>`;
      return;
    }

    const xMin = 0, xMax = 35; // Kemiskinan %
    const yMin = 20, yMax = 100; // IKP (aligned to 20-100 to prevent bottom clipping)

    function scaleX(v) { return pad.left + ((v - xMin) / (xMax - xMin)) * (width - pad.left - pad.right); }
    function scaleY(v) { return height - pad.bottom - ((v - yMin) / (yMax - yMin)) * (height - pad.top - pad.bottom); }

    // Gridlines
    [20, 40, 60, 80, 100].forEach(gv => {
      const yPos = scaleY(gv);
      const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      l.setAttribute('x1', pad.left);
      l.setAttribute('x2', width - pad.right);
      l.setAttribute('y1', yPos);
      l.setAttribute('y2', yPos);
      l.setAttribute('class', 'chart-gridline');
      svg.appendChild(l);

      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', pad.left - 6);
      t.setAttribute('y', yPos + 3);
      t.setAttribute('text-anchor', 'end');
      t.setAttribute('class', 'chart-axis-text');
      t.textContent = gv;
      svg.appendChild(t);
    });

    // X Axis ticks
    [5, 15, 25, 35].forEach(xv => {
      const xPos = scaleX(xv);
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', xPos);
      t.setAttribute('y', height - pad.bottom + 16);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('class', 'chart-axis-text');
      t.textContent = `${xv}%`;
      svg.appendChild(t);
    });

    // Axis Labels
    const yLbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yLbl.setAttribute('x', pad.left);
    yLbl.setAttribute('y', 14);
    yLbl.setAttribute('class', 'chart-axis-text');
    yLbl.textContent = 'Skor IKP →';
    svg.appendChild(yLbl);

    const xLbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xLbl.setAttribute('x', pad.left + (width - pad.left - pad.right) / 2);
    xLbl.setAttribute('y', height - 6);
    xLbl.setAttribute('text-anchor', 'middle');
    xLbl.setAttribute('class', 'chart-axis-text');
    xLbl.setAttribute('font-weight', '600');
    xLbl.textContent = 'Tingkat Kemiskinan P0 (%) →';
    svg.appendChild(xLbl);

    // Render points
    points.forEach(pt => {
      const isSel = selectedProvince === pt.prov;
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', scaleX(pt.pov));
      circle.setAttribute('cy', scaleY(pt.ikp));
      circle.setAttribute('r', isSel ? 7 : 4);
      circle.setAttribute('fill', pt.ikp < 60 ? 'var(--color-accent-2)' : 'var(--color-accent)');
      circle.setAttribute('stroke', isSel ? 'var(--color-ink)' : 'var(--color-paper-3)');
      circle.setAttribute('stroke-width', isSel ? 2.5 : 1);
      circle.style.cursor = 'pointer';

      // Tooltip title
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${pt.prov}: IKP ${pt.ikp.toFixed(1)}, Kemiskinan ${pt.pov.toFixed(1)}%`;
      circle.appendChild(title);

      circle.addEventListener('click', () => {
        selectedProvince = selectedProvince === pt.prov ? null : pt.prov;
        elProvSelect.value = selectedProvince || '';
        currentPage = 1;
        updateUrlParams();
        renderAll();
      });

      svg.appendChild(circle);

      // Label if selected or extreme
      if (isSel || pt.pov >= 25 || (pt.ikp >= 85 && pt.pov <= 5)) {
        const xDot = scaleX(pt.pov);
        const yDot = scaleY(pt.ikp);
        const isNearRight = xDot > width - pad.right - 90;
        const textX = isNearRight ? xDot - 8 : xDot + 8;
        const anchor = isNearRight ? 'end' : 'start';

        let yOffset = 3;
        if (pt.prov === 'Papua Pegunungan') yOffset += 6;
        if (pt.prov === 'Papua Tengah') yOffset -= 6;

        const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        t.setAttribute('x', textX);
        t.setAttribute('y', yDot + yOffset);
        t.setAttribute('text-anchor', anchor);
        t.setAttribute('class', 'chart-axis-text');
        t.setAttribute('font-weight', isSel ? '800' : '500');
        t.textContent = pt.prov;
        svg.appendChild(t);
      }
    });

    elChartScatter.appendChild(svg);
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
      records = records.filter(k => getStepForValue(k.ikp) === selectedClassification);
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
      tr.style.animationDelay = `${idx * 20}ms`;

      let statusTagClass = 'status-tag-saas--tahan';
      if (r.grp === 1) statusTagClass = 'status-tag-saas--sangat-rentan';
      else if (r.grp === 2 || r.grp === 3) statusTagClass = 'status-tag-saas--rentan';

      tr.innerHTML = `
        <td class="num">${startIdx + idx + 1}</td>
        <td><strong>${escapeHtml(r.kab)}</strong></td>
        <td>${escapeHtml(r.tipe || 'Kabupaten')}</td>
        <td>${escapeHtml(r.prov)}</td>
        <td class="num"><strong>${r.ikp !== null ? r.ikp.toFixed(2) : '–'}</strong></td>
        <td class="num">${r.rank || '–'}</td>
        <td class="num">${r.grp || '–'}</td>
        <td><span class="status-tag-saas ${statusTagClass}">${escapeHtml(r.status || '–')}</span></td>
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
      if (elTableBody) elTableBody.classList.add('table-page-fade');
      setTimeout(() => {
        currentPage = targetPage;
        renderTable();
        if (elTableBody) elTableBody.classList.remove('table-page-fade');
      }, 110);
    }

    // Prev Button
    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'btn-pill';
    prevBtn.textContent = 'Sebelumnya';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
      goToPage(currentPage - 1);
    });
    elPagination.appendChild(prevBtn);

    // Current page indicator
    const pageIndicator = document.createElement('span');
    pageIndicator.className = 'btn-pill';
    pageIndicator.style.cursor = 'default';
    pageIndicator.textContent = `Hal ${currentPage} / ${totalPages}`;
    elPagination.appendChild(pageIndicator);

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'btn-pill';
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
      records = records.filter(k => getStepForValue(k.ikp) === selectedClassification);
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
    const stepBtns = document.querySelectorAll('.legend-step-saas');
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
    const stepBtns = document.querySelectorAll('.legend-step-saas');
    stepBtns.forEach(btn => {
      const step = parseInt(btn.dataset.step, 10);
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
