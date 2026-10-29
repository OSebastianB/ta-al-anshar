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
    var tren =
      global.UI && UI.getTrenNilai ? UI.getTrenNilai() : data.trenNilai;
    const palette = [COLORS.accent, COLORS.teal, COLORS.amber];
    var yMin = 76;
    var yMax = 86;
    if (tren.series && tren.series.length === 1) {
      var flat = tren.series[0].data || [];
      var lo = Math.min.apply(null, flat);
      var hi = Math.max.apply(null, flat);
      yMin = Math.max(60, Math.floor(lo) - 2);
      yMax = Math.min(100, Math.ceil(hi) + 2);
    }

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
            min: yMin,
            max: yMax,
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

    const pg =
      global.UI && UI.getPengumpulanRingkas
        ? UI.getPengumpulanRingkas()
        : data.pengumpulanRingkas;
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

  function createAnalisisCharts(data, canvasId) {
    const siswa =
      global.UI && UI.getSiswaPerhatianScoped
        ? UI.getSiswaPerhatianScoped()
        : data.siswaPerhatian;
    const palette = [COLORS.accent, COLORS.amber, COLORS.teal, "#7C3AED", COLORS.navy, "#DC2626"];

    make(canvasId || "chartTrenSiswa", {
      type: "line",
      data: {
        labels: data.trenNilai.labels,
        datasets: siswa.map(function (s, i) {
          return {
            label: s.namaPendek,
            data: s.bulanan,
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

  function hitungStatus(rows) {
    var out = { Hadir: 0, Terlambat: 0, Izin: 0, Sakit: 0, Alpa: 0 };
    rows.forEach(function (r) {
      out[r.status] = (out[r.status] || 0) + 1;
    });
    return out;
  }

  function createAbsensiCharts(data) {
    var scopeKelas = null;
    if (global.UI && UI.getPeran && UI.getPeran() === "guru" && UI.scopeGuru) {
      scopeKelas = UI.scopeGuru.waliKelas;
    }
    var kelasList = scopeKelas ? [scopeKelas] : data.kelas;
    var minggu = ["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29"];
    var labels = ["Senin", "Selasa", "Rabu", "Kamis"];
    var grup = ["Hadir", "Terlambat", "Tidak hadir"];
    var warna = [COLORS.teal, COLORS.amber, COLORS.red];
    make("chartHadirMinggu", {
      type: "bar",
      data: {
        labels: labels,
        datasets: grup.map(function (g, i) {
          return {
            label: g,
            data: minggu.map(function (iso) {
              return data.kehadiran.filter(function (k) {
                if (k.tanggal !== iso) return false;
                if (scopeKelas && k.kelas !== scopeKelas) return false;
                if (g === "Tidak hadir") return k.status === "Izin" || k.status === "Sakit" || k.status === "Alpa";
                return k.status === g;
              }).length;
            }),
            backgroundColor: warna[i],
            borderRadius: 4,
            barThickness: scopeKelas ? 18 : 14,
          };
        }),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom", labels: { padding: 12 } } },
        scales: {
          x: { grid: { display: false }, ticks: { color: COLORS.muted } },
          y: { beginAtZero: true, suggestedMax: scopeKelas ? 12 : undefined, ticks: { color: COLORS.muted, precision: 0 }, grid: { color: COLORS.grid }, border: { display: false } },
        },
      },
    });

    make("chartHadirKelas", {
      type: "bar",
      data: {
        labels: kelasList,
        datasets: [
          {
            label: "Persen hadir hari ini",
            data: kelasList.map(function (kelas) {
              var rows = data.kehadiran.filter(function (k) {
                return k.tanggal === data.hariIni && k.kelas === kelas;
              });
              var hadir = rows.filter(function (k) {
                return k.status === "Hadir" || k.status === "Terlambat";
              }).length;
              return rows.length ? Math.round((hadir / rows.length) * 1000) / 10 : 0;
            }),
            backgroundColor: COLORS.accent,
            borderRadius: 6,
            barThickness: 22,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: function (ctx) { return " " + ctx.parsed.y + "% hadir"; } } },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: COLORS.muted } },
          y: { min: 0, max: 100, ticks: { color: COLORS.muted }, grid: { color: COLORS.grid }, border: { display: false } },
        },
      },
    });
  }

  function createRekapAbsensiChart(data) {
    var rows =
      global.UI && UI.getKehadiranScoped ? UI.getKehadiranScoped() : data.kehadiran;
    var st = hitungStatus(rows);
    make("chartRekapHadir", {
      type: "bar",
      data: {
        labels: ["Hadir", "Terlambat", "Izin", "Sakit", "Alpa"],
        datasets: [
          {
            label: "Jumlah catatan",
            data: [st.Hadir, st.Terlambat, st.Izin, st.Sakit, st.Alpa],
            backgroundColor: [COLORS.teal, COLORS.amber, COLORS.accent, "#64748B", COLORS.red],
            borderRadius: 6,
            barThickness: 28,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: COLORS.muted } },
          y: { beginAtZero: true, ticks: { color: COLORS.muted, precision: 0 }, grid: { color: COLORS.grid }, border: { display: false } },
        },
      },
    });
  }

  function createAnalisisDashCharts(data) {
    createAnalisisCharts(data, "chartAnalisisTren");
    var list =
      (global.UI && UI.getSiswaPerhatianScoped
        ? UI.getSiswaPerhatianScoped()
        : data.siswaPerhatian
      ).slice(0, 6);
    make("chartAnalisisBanding", {
      type: "bar",
      data: {
        labels: list.map(function (s) { return s.namaPendek; }),
        datasets: [
          { label: "Rata-rata nilai", data: list.map(function (s) { return s.rataRata; }), backgroundColor: COLORS.accent, borderRadius: 4, barThickness: 14 },
          { label: "Persen kehadiran", data: list.map(function (s) { return s.persenHadir; }), backgroundColor: COLORS.teal, borderRadius: 4, barThickness: 14 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { padding: 12 } },
          tooltip: { callbacks: { label: function (ctx) { return " " + ctx.dataset.label + ": " + ctx.parsed.y; } } },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: COLORS.muted } },
          y: { min: 0, max: 100, ticks: { color: COLORS.muted }, grid: { color: COLORS.grid }, border: { display: false } },
        },
      },
    });
  }

  function createPerkembanganChart(data) {
    var ui = data.ui || {};
    var mapel = ui.mapelPerk || "Matematika";
    var kelas = ui.kelasPerk || "V-A";
    if (global.UI && UI.getPeran && UI.getPeran() === "guru" && UI.scopeGuru) {
      mapel = UI.scopeGuru.mapel;
      kelas = UI.scopeGuru.waliKelas;
    }
    var pool = data.siswa.filter(function (s) { return s.kelas === kelas; });
    var flagged = pool.filter(function (s) { return s.alasanList && s.alasanList.length; });
    var list = (flagged.length ? flagged : pool).slice(0, 4);
    var palette = [COLORS.accent, COLORS.teal, COLORS.amber, COLORS.navy];
    var ada = list.length && list[0].nilaiMapel[mapel];
    var mapelList =
      global.UI && UI.getPeran && UI.getPeran() === "guru" && UI.mapelDiampuGuru
        ? UI.mapelDiampuGuru()
        : data.mapel;
    var rataMapel = mapelList.map(function (m) {
      var nilai = pool.map(function (s) { return s.nilaiMapel[m] ? s.nilaiMapel[m].akhir : 0; });
      var sum = nilai.reduce(function (a, b) { return a + b; }, 0);
      return nilai.length ? Math.round((sum / nilai.length) * 10) / 10 : 0;
    });
    make("chartPerkBanding", {
      type: "bar",
      data: {
        labels: mapelList.map(function (m) { return m === "Bahasa Indonesia" ? "B. Indonesia" : m === "Pendidikan Agama Islam" ? "PAI" : m; }),
        datasets: [{ label: "Rata-rata " + kelas, data: rataMapel, backgroundColor: COLORS.teal, borderRadius: 6, barThickness: 18 }],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { min: 0, max: 100, ticks: { color: COLORS.muted }, grid: { color: COLORS.grid }, border: { display: false } },
          y: { grid: { display: false }, ticks: { color: COLORS.navy }, border: { display: false } },
        },
      },
    });
    make("chartPerkembangan", {
      type: "line",
      data: {
        labels: data.periode,
        datasets: ada
          ? list.map(function (s, i) {
              return {
                label: s.namaPendek,
                data: s.nilaiMapel[mapel].historis,
                borderColor: palette[i],
                backgroundColor: palette[i],
                borderWidth: 2.5,
                tension: 0.3,
                pointRadius: 4,
                pointBackgroundColor: "#fff",
                pointBorderWidth: 2,
              };
            })
          : [],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: { legend: { position: "bottom", labels: { padding: 12 } } },
        scales: lineScales(),
      },
    });
  }

  function createDetailCharts(data) {
    var s = data.siswa.filter(function (x) { return x.id === data.siswaDipilih; })[0] || data.siswa[0];
    if (!s) return;
    if (global.UI && UI.getPeran && UI.getPeran() === "guru" && UI.inScopeSiswa && !UI.inScopeSiswa(s)) {
      s = data.siswa.filter(function (x) { return UI.inScopeSiswa(x); })[0] || s;
    }
    var palette = [COLORS.accent, COLORS.teal, COLORS.amber];
    var mapelDetail =
      global.UI && UI.getPeran && UI.getPeran() === "guru"
        ? [UI.scopeGuru.mapel, "Bahasa Indonesia", "IPA"].filter(function (m, i, a) {
            return a.indexOf(m) === i;
          })
        : ["Matematika", "Bahasa Indonesia", "IPA"];
    make("chartDetailNilai", {
      type: "line",
      data: {
        labels: data.periode,
        datasets: mapelDetail.map(function (mapel, i) {
          return {
            label: mapel === "Bahasa Indonesia" ? "B. Indonesia" : mapel,
            data: s.nilaiMapel[mapel].historis,
            borderColor: palette[i],
            backgroundColor: palette[i],
            borderWidth: 2.5,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: "#fff",
            pointBorderWidth: 2,
          };
        }),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: { legend: { position: "bottom", labels: { padding: 12 } } },
        scales: lineScales(),
      },
    });
    var rec = data.kehadiran.filter(function (k) { return k.nis === s.nis; });
    var st = hitungStatus(rec);
    make("chartDetailHadir", {
      type: "doughnut",
      data: {
        labels: ["Hadir", "Terlambat", "Izin", "Sakit", "Alpa"],
        datasets: [{ data: [st.Hadir, st.Terlambat, st.Izin, st.Sakit, st.Alpa], backgroundColor: [COLORS.teal, COLORS.amber, COLORS.accent, "#94A3B8", COLORS.red], borderWidth: 0 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "62%",
        plugins: { legend: { position: "bottom", labels: { padding: 8 } } },
      },
    });
  }

  function createPortalChart(data) {
    var nisList =
      global.UI && UI.anakNisOrangtua ? UI.anakNisOrangtua() : data.orangTua.anakNis;
    var nis = nisList[0];
    var rec = data.kehadiran.filter(function (k) { return nisList.indexOf(k.nis) >= 0; });
    var st = hitungStatus(rec);
    make("chartPortalHadir", {
      type: "doughnut",
      data: {
        labels: ["Hadir", "Terlambat", "Izin", "Sakit", "Alpa"],
        datasets: [{ data: [st.Hadir, st.Terlambat, st.Izin, st.Sakit, st.Alpa], backgroundColor: [COLORS.teal, COLORS.amber, COLORS.accent, "#94A3B8", COLORS.red], borderWidth: 0 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "62%",
        plugins: { legend: { position: "bottom", labels: { padding: 8 } } },
      },
    });
  }

  function renderForPage(page, data) {
    destroyAll();
    var peran = global.UI && UI.getPeran ? UI.getPeran() : null;
    if (page === "dashboard" && peran !== "admin" && peran !== "orangtua") createDashboardCharts(data);
    if (page === "rekap") createRekapCharts(data);
    if (page === "analisis") createAnalisisCharts(data);
    if (page === "absensi") createAbsensiCharts(data);
    if (page === "rekap-absensi") createRekapAbsensiChart(data);
    if (page === "portal") createPortalChart(data);
    if (page === "analisis-dashboard") createAnalisisDashCharts(data);
    if (page === "perkembangan") createPerkembanganChart(data);
    if (page === "detail-siswa") createDetailCharts(data);
  }

  global.AppCharts = {
    initDefaults: baseOptions,
    renderForPage: renderForPage,
    destroyAll: destroyAll,
  };
})(window);
