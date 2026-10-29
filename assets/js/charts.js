(function (global) {
  const instances = {};
  const COLORS = {
    navy: "#0F2A4A",
    accent: "#2563EB",
    soft: "#DBEAFE",
    teal: "#0D9488",
    amber: "#D97706",
    red: "#DC2626",
    muted: "#64748B",
    grid: "#E5E9F0",
  };

  function baseOptions() {
    Chart.defaults.font.family = "Inter, system-ui, sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = COLORS.muted;
    Chart.defaults.plugins.legend.labels.boxWidth = 12;
    Chart.defaults.plugins.legend.labels.boxHeight = 12;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.pointStyle = "circle";
    Chart.defaults.plugins.tooltip.backgroundColor = COLORS.navy;
    Chart.defaults.plugins.tooltip.titleColor = "#fff";
    Chart.defaults.plugins.tooltip.bodyColor = "#fff";
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.displayColors = true;
  }

  const centerTextPlugin = {
    id: "centerText",
    afterDraw: function (chart, _args, opts) {
      if (!opts || !opts.text) return;
      const { ctx, chartArea } = chart;
      if (!chartArea) return;
      const x = (chartArea.left + chartArea.right) / 2;
      const y = (chartArea.top + chartArea.bottom) / 2;
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = COLORS.navy;
      ctx.font = "700 22px Inter, sans-serif";
      ctx.fillText(opts.text, x, y - 8);
      ctx.fillStyle = COLORS.muted;
      ctx.font = "500 11px Inter, sans-serif";
      ctx.fillText(opts.subtext || "", x, y + 12);
      ctx.restore();
    },
  };

  function destroyAll() {
    Object.keys(instances).forEach(function (key) {
      if (instances[key]) {
        instances[key].destroy();
        delete instances[key];
      }
    });
  }

  function make(id, config) {
    const el = document.getElementById(id);
    if (!el) return null;
    if (instances[id]) {
      instances[id].destroy();
    }
    if (config.type === "doughnut") {
      config.plugins = (config.plugins || []).concat(centerTextPlugin);
    }
    instances[id] = new Chart(el, config);
    return instances[id];
  }

  function lineScales() {
    return {
      x: {
        grid: { display: false },
        ticks: { color: COLORS.muted },
        border: { color: COLORS.grid },
      },
      y: {
        min: 60,
        max: 100,
        ticks: { stepSize: 10, color: COLORS.muted },
        grid: { color: COLORS.grid },
        border: { display: false },
      },
    };
  }

  function nilaiLabel(n) {
    return Number(n).toLocaleString("id-ID", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  }

  function createDashboardCharts(data) {
    const tren = data.trenNilai;
    const palette = [COLORS.accent, COLORS.teal, COLORS.amber];

    make("chartTrenNilai", {
      type: "line",
      data: {
        labels: tren.labels,
        datasets: tren.series.map(function (s, i) {
          return {
            label: s.label,
            data: s.data,
            borderColor: palette[i],
            backgroundColor: palette[i],
            borderWidth: 2.5,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 5,
            pointBackgroundColor: "#fff",
            pointBorderWidth: 2,
            fill: false,
          };
        }),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        layout: { padding: { top: 4, right: 8, left: 0, bottom: 0 } },
        plugins: {
          legend: { position: "bottom", labels: { padding: 12 } },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return " " + ctx.dataset.label + ": " + nilaiLabel(ctx.parsed.y);
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: COLORS.muted },
            border: { color: COLORS.grid },
            title: {
              display: true,
              text: "Bulan",
              color: COLORS.muted,
              font: { size: 11, weight: "500" },
              padding: { top: 4 },
            },
          },
          y: {
            min: 76,
            max: 86,
            ticks: { stepSize: 2, color: COLORS.muted },
            grid: { color: COLORS.grid },
            border: { display: false },
            title: {
              display: true,
              text: "Nilai",
              color: COLORS.muted,
              font: { size: 11, weight: "500" },
            },
          },
        },
      },
    });

    const pg = data.pengumpulanRingkas;
    const bagian = [
      { nama: "Terkumpul", jumlah: pg.terkumpul, warna: COLORS.teal },
      { nama: "Terlambat", jumlah: pg.terlambat, warna: COLORS.amber },
      { nama: "Belum dikumpulkan", jumlah: pg.belum, warna: COLORS.red },
    ];
    make("chartDonutPengumpulan", {
      type: "doughnut",
      data: {
        labels: bagian.map(function (b) {
          const persen = Math.round((b.jumlah / pg.total) * 100);
          return b.nama + " " + persen + "%";
        }),
        datasets: [
          {
            data: bagian.map(function (b) {
              return b.jumlah;
            }),
            backgroundColor: bagian.map(function (b) {
              return b.warna;
            }),
            borderWidth: 0,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "66%",
        plugins: {
          legend: {
            position: "bottom",
            labels: { padding: 10 },
          },
          centerText: {
            text: String(pg.total),
            subtext: "pengumpulan",
          },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                const val = ctx.parsed;
                const pct = Math.round((val / pg.total) * 100);
                return " " + val + " pengumpulan (" + pct + "%)";
              },
            },
          },
        },
      },
    });
  }

  function createRekapCharts(data) {
    const items = data.rataMapel;
    make("chartBarMapel", {
      type: "bar",
      data: {
        labels: items.map(function (i) {
          return i.mapel;
        }),
        datasets: [
          {
            label: "Rata-rata nilai",
            data: items.map(function (i) {
              return i.nilai;
            }),
            backgroundColor: COLORS.accent,
            borderRadius: 6,
            barThickness: 28,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return " Rata-rata: " + ctx.parsed.y;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: COLORS.muted },
            border: { color: COLORS.grid },
          },
          y: {
            min: 0,
            max: 100,
            ticks: { stepSize: 20, color: COLORS.muted },
            grid: { color: COLORS.grid },
            border: { display: false },
          },
        },
      },
    });
  }

  function createAnalisisCharts(data) {
    const siswa = data.siswaPerhatian;
    const palette = [COLORS.accent, COLORS.amber, COLORS.teal];

    make("chartTrenSiswa", {
      type: "line",
      data: {
        labels: data.trenNilai.labels,
        datasets: siswa.map(function (s, i) {
          return {
            label: s.namaPendek,
            data: s.tren,
            borderColor: palette[i],
            backgroundColor: palette[i],
            borderWidth: 2.5,
            tension: 0.35,
            pointRadius: 4,
            pointHoverRadius: 5,
            pointBackgroundColor: "#fff",
            pointBorderWidth: 2,
          };
        }),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { position: "bottom", labels: { padding: 16 } },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return " " + ctx.dataset.label + ": " + ctx.parsed.y;
              },
            },
          },
        },
        scales: lineScales(),
      },
    });

    make("chartBandingMapel", {
      type: "bar",
      data: {
        labels: data.rataMapel.map(function (i) {
          return i.mapel;
        }),
        datasets: [
          {
            label: "Rata-rata sekolah",
            data: data.rataMapel.map(function (i) {
              return i.nilai;
            }),
            backgroundColor: COLORS.accent,
            borderRadius: 6,
            barThickness: 22,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return " Rata-rata: " + ctx.parsed.x;
              },
            },
          },
        },
        scales: {
          x: {
            min: 0,
            max: 100,
            ticks: { stepSize: 20, color: COLORS.muted },
            grid: { color: COLORS.grid },
            border: { display: false },
          },
          y: {
            grid: { display: false },
            ticks: { color: COLORS.navy },
            border: { display: false },
          },
        },
      },
    });
  }

  function renderForPage(page, data) {
    destroyAll();
    if (page === "dashboard") createDashboardCharts(data);
    if (page === "rekap") createRekapCharts(data);
    if (page === "analisis") createAnalisisCharts(data);
  }

  global.AppCharts = {
    initDefaults: baseOptions,
    renderForPage: renderForPage,
    destroyAll: destroyAll,
  };
})(window);
