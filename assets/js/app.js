(function () {
  const D = window.APP_DATA;
  const PAGES = {
    dashboard: { title: "Dashboard Akademik", crumb: "Akademik / Dashboard" },
    tugas: { title: "Manajemen Tugas", crumb: "Akademik / Manajemen Tugas" },
    pengumpulan: { title: "Pengumpulan Tugas", crumb: "Akademik / Pengumpulan" },
    penilaian: { title: "Penilaian Akademik", crumb: "Akademik / Penilaian" },
    rekap: { title: "Rekap Nilai Akademik", crumb: "Akademik / Rekap Nilai" },
    analisis: { title: "Analisis Performa Akademik", crumb: "Akademik / Analisis" },
  };

  let toastInst;
  let modalTugas;
  let modalKumpul;
  let currentPage = "dashboard";

  function $(id) {
    return document.getElementById(id);
  }

  function fmt(n) {
    return Number(n).toLocaleString("id-ID", {
      minimumFractionDigits: Number.isInteger(n) ? 0 : 1,
      maximumFractionDigits: 1,
    });
  }

  function showToast(message) {
    $("appToastMsg").textContent = message;
    toastInst.show();
  }

  function demoToast() {
    showToast("Mode demonstrasi: aksi ini hanya simulasi.");
  }

  function pill(kind, text) {
    return '<span class="pill pill-' + kind + '">' + text + "</span>";
  }

  function statusTugasPill(status) {
    if (status === "Aktif") return pill("info", "Aktif");
    if (status === "Selesai") return pill("success", "Selesai");
    return pill("muted", "Dijadwalkan");
  }

  function statusKumpulPill(status) {
    if (status === "Sudah Dikumpulkan") return pill("success", "Sudah Dikumpulkan");
    if (status === "Terlambat") return pill("warning", "Terlambat");
    return pill("danger", "Belum Dikumpulkan");
  }

  function statusNilaiPill(status) {
    if (status === "Sudah Dinilai") return pill("success", "Sudah Dinilai");
    return pill("muted", "Belum Dinilai");
  }

  function trenHtml(tren) {
    if (tren === "Meningkat") return '<span class="trend up">Meningkat ↑</span>';
    if (tren === "Menurun") return '<span class="trend down">Menurun ↓</span>';
    return '<span class="trend flat">Stabil →</span>';
  }

  function emptyRow(cols, text) {
    return (
      '<tr><td class="table-empty" colspan="' +
      cols +
      '">' +
      (text || "Tidak ada data yang sesuai filter.") +
      "</td></tr>"
    );
  }

  function fillSelect(el, items, allLabel) {
    const opts = ['<option value="">' + allLabel + "</option>"].concat(
      items.map(function (v) {
        return '<option value="' + v + '">' + v + "</option>";
      })
    );
    el.innerHTML = opts.join("");
  }

  /* ——— Renderers ——— */
  function renderNotif() {
    $("notifList").innerHTML = D.notifikasi
      .map(function (n) {
        return (
          '<div class="notif-item">' +
          '<i class="bi ' +
          n.ikon +
          '"></i>' +
          "<div><div class=\"n-title\">" +
          n.judul +
          '</div><div class="n-time">' +
          n.waktu +
          "</div></div></div>"
        );
      })
      .join("");
  }

  function renderDashboard() {
    const k = D.kpi;
    const items = [
      { label: "Siswa Aktif", value: k.siswaAktif, icon: "bi-people", tone: "navy" },
      { label: "Tugas Aktif", value: k.tugasAktif, icon: "bi-journal-text", tone: "blue" },
      { label: "Belum Dinilai", value: k.belumDinilai, icon: "bi-hourglass-split", tone: "amber" },
      { label: "Rata-rata Nilai", value: fmt(k.rataRataNilai), icon: "bi-bar-chart", tone: "teal" },
    ];
    const hints = [
      "siswa terdaftar",
      "masih berlangsung",
      "menunggu penilaian",
      "seluruh mata pelajaran",
    ];
    $("dashboardKpi").innerHTML = items
      .map(function (it, i) {
        return (
          '<div class="kpi-card"><div class="kpi-icon ' +
          it.tone +
          '"><i class="bi ' +
          it.icon +
          '"></i></div><div><div class="kpi-label">' +
          it.label +
          '</div><div class="kpi-value">' +
          it.value +
          '</div><div class="kpi-hint">' +
          hints[i] +
          "</div></div></div>"
        );
      })
      .join("");

    $("dashboardPerhatianBody").innerHTML = D.siswaPerhatian
      .map(function (s) {
        const arah = s.perubahan < 0 ? "down" : "flat";
        return (
          "<tr>" +
          '<td class="name-cell">' +
          s.namaPendek +
          "</td>" +
          "<td>" +
          s.kelas +
          "</td>" +
          "<td>" +
          s.nilaiSebelumnya +
          "</td>" +
          '<td><span class="name-cell">' +
          s.rataRata +
          '</span> <span class="trend ' +
          arah +
          '">' +
          s.perubahan +
          "</span></td>" +
          "<td>" +
          s.tugasBelum +
          "</td>" +
          "<td>" +
          s.indikator +
          "</td>" +
          "<td>" +
          s.tindakLanjut +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function filteredTugas() {
    const q = $("tugasSearch").value.trim().toLowerCase();
    const kelas = $("tugasFilterKelas").value;
    const mapel = $("tugasFilterMapel").value;
    const status = $("tugasFilterStatus").value;
    return D.tugas.filter(function (t) {
      const matchQ = !q || t.judul.toLowerCase().includes(q) || t.mapel.toLowerCase().includes(q);
      const matchK = !kelas || t.kelas === kelas;
      const matchM = !mapel || t.mapel === mapel;
      const matchS = !status || t.status === status;
      return matchQ && matchK && matchM && matchS;
    });
  }

  function renderTugas() {
    const rows = filteredTugas();
    const body = $("tugasTableBody");
    if (!rows.length) {
      body.innerHTML = emptyRow(7);
    } else {
      body.innerHTML = rows
        .map(function (t) {
          return (
            "<tr>" +
            '<td class="name-cell">' +
            t.judul +
            "</td>" +
            "<td>" +
            t.mapel +
            "</td>" +
            "<td>" +
            t.kelas +
            "</td>" +
            "<td>" +
            t.tenggat +
            "</td>" +
            "<td>" +
            t.jenis +
            "</td>" +
            "<td>" +
            statusTugasPill(t.status) +
            "</td>" +
            '<td><div class="action-group">' +
            '<button class="btn btn-sm btn-outline-secondary" type="button" data-aksi="detail-tugas" data-id="' +
            t.id +
            '">Lihat</button>' +
            '<button class="btn btn-sm btn-outline-secondary js-demo" type="button">Edit</button>' +
            "</div></td>" +
            "</tr>"
          );
        })
        .join("");
    }
    $("tugasTableFoot").textContent =
      "Menampilkan " + rows.length + " dari " + D.tugas.length + " tugas.";
  }

  function renderPengumpulanKpi() {
    const p = D.pengumpulanRingkas;
    const items = [
      { label: "Total Pengumpulan", value: p.total, icon: "bi-collection", tone: "navy" },
      { label: "Sudah Dikumpulkan", value: p.terkumpul, icon: "bi-check-circle", tone: "teal" },
      { label: "Terlambat", value: p.terlambat, icon: "bi-clock-history", tone: "amber" },
      { label: "Belum Dikumpulkan", value: p.belum, icon: "bi-x-circle", tone: "rose" },
    ];
    $("pengumpulanKpi").innerHTML = items
      .map(function (it) {
        return (
          '<div class="kpi-card"><div class="kpi-icon ' +
          it.tone +
          '"><i class="bi ' +
          it.icon +
          '"></i></div><div><div class="kpi-label">' +
          it.label +
          '</div><div class="kpi-value">' +
          it.value +
          "</div></div></div>"
        );
      })
      .join("");
  }

  function filteredKumpul() {
    const kelas = $("kumpulFilterKelas").value;
    const tugas = $("kumpulFilterTugas").value;
    const status = $("kumpulFilterStatus").value;
    return D.pengumpulan.filter(function (r) {
      return (
        (!kelas || r.kelas === kelas) &&
        (!tugas || r.tugas === tugas) &&
        (!status || r.status === status)
      );
    });
  }

  function renderPengumpulan() {
    const rows = filteredKumpul();
    const body = $("kumpulTableBody");
    if (!rows.length) {
      body.innerHTML = emptyRow(9);
    } else {
      body.innerHTML = rows
        .map(function (r) {
          const canAccept = r.status !== "Sudah Dikumpulkan";
          return (
            "<tr data-row=\"" +
            r.id +
            '">' +
            '<td class="name-cell">' +
            r.nama +
            "</td>" +
            '<td class="nis">' +
            r.nis +
            "</td>" +
            "<td>" +
            r.kelas +
            "</td>" +
            "<td>" +
            r.tugas +
            "</td>" +
            "<td>" +
            r.jenis +
            "</td>" +
            "<td>" +
            r.tanggal +
            "</td>" +
            '<td class="js-status">' +
            statusKumpulPill(r.status) +
            "</td>" +
            "<td>" +
            statusNilaiPill(r.penilaian) +
            "</td>" +
            '<td><div class="action-group">' +
            '<button class="btn btn-sm btn-outline-secondary" type="button" data-aksi="detail-kumpul" data-id="' +
            r.id +
            '">Lihat Detail</button>' +
            (canAccept
              ? '<button class="btn btn-sm btn-primary" type="button" data-aksi="terima" data-id="' +
                r.id +
                '">Tandai Diterima</button>'
              : "") +
            "</div></td>" +
            "</tr>"
          );
        })
        .join("");
    }
    $("kumpulTableFoot").textContent =
      "Menampilkan " + rows.length + " dari " + D.pengumpulan.length + " catatan. Ringkasan sekolah: 120 pengumpulan.";
  }

  function renderKuis() {
    $("kuisTableBody").innerHTML = D.kuisOtomatis
      .map(function (k) {
        const st = k.status === "Selesai dinilai" ? pill("success", k.status) : pill("warning", k.status);
        return (
          "<tr>" +
          '<td class="name-cell">' +
          k.nama +
          "</td>" +
          "<td>" +
          k.mapel +
          "</td>" +
          "<td>" +
          k.kelas +
          "</td>" +
          "<td>" +
          k.jumlahSoal +
          "</td>" +
          "<td>" +
          k.jumlahSiswa +
          "</td>" +
          "<td>" +
          st +
          "</td>" +
          '<td><button class="btn btn-sm btn-outline-secondary" type="button" data-aksi="lihat-hasil" data-id="' +
          k.id +
          '">Lihat Hasil</button></td>' +
          "</tr>"
        );
      })
      .join("");
  }

  function renderHasilOtomatis() {
    const h = D.contohHasilOtomatis;
    $("hasilTitle").textContent =
      "Contoh Hasil — " + h.kuis + " · " + h.siswa + " · " + h.kelas;
    $("hasilTotal").textContent = h.totalSoal;
    $("hasilBenar").textContent = h.benar;
    $("hasilSalah").textContent = h.salah;
    $("hasilSkor").textContent = h.skor + "/" + h.skorMaks;
    $("hasilSoal").innerHTML = h.soal
      .map(function (s) {
        return (
          '<div class="q-row">' +
          '<div class="q-no">' +
          s.no +
          "</div>" +
          "<div><div>" +
          s.teks +
          '</div><div class="q-meta">Jawaban: ' +
          s.jawaban +
          " · Kunci: " +
          s.kunci +
          "</div></div>" +
          '<div class="q-flag ' +
          (s.benar ? "ok" : "bad") +
          '"><i class="bi ' +
          (s.benar ? "bi-check-circle-fill" : "bi-x-circle-fill") +
          '"></i></div>' +
          "</div>"
        );
      })
      .join("");
  }

  function renderManual() {
    $("manualTableBody").innerHTML = D.penilaianManual
      .map(function (m) {
        return (
          "<tr>" +
          '<td class="name-cell">' +
          m.nama +
          "</td>" +
          "<td>" +
          m.tugas +
          "</td>" +
          "<td>" +
          m.skorMaks +
          "</td>" +
          "<td>" +
          (m.nilai === null ? pill("muted", "Belum dinilai") : m.nilai) +
          "</td>" +
          "<td>" +
          (m.catatan || "—") +
          "</td>" +
          '<td><button class="btn btn-sm btn-outline-secondary" type="button" data-aksi="isi-nilai" data-id="' +
          m.id +
          '">' +
          (m.nilai === null ? "Input nilai" : "Ubah") +
          "</button></td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function fillManualForm(item) {
    $("manualSiswa").value = item ? item.nama + " (" + item.kelas + ")" : "";
    $("manualTugas").value = item ? item.tugas : "";
    $("manualNilai").value = item && item.nilai !== null ? item.nilai : "";
    $("manualCatatan").value = item ? item.catatan : "";
    $("formManual").dataset.id = item ? item.id : "";
  }

  function filteredRekap() {
    const kelas = $("rekapFilterKelas").value;
    const mapel = $("rekapFilterMapel").value;
    const q = $("rekapSearch").value.trim().toLowerCase();
    return D.rekapNilai.filter(function (r) {
      const matchK = !kelas || r.kelas === kelas;
      const matchM = !mapel || r.mapel === mapel;
      const matchQ = !q || r.nama.toLowerCase().includes(q);
      return matchK && matchM && matchQ;
    });
  }

  function renderRekap() {
    const r = D.ringkasanKelas;
    $("rekapSummary").innerHTML =
      '<div class="summary-item"><div class="si-l">Rata-rata</div><div class="si-v">' +
      fmt(r.rataRata) +
      '</div></div><div class="summary-item"><div class="si-l">Tertinggi</div><div class="si-v">' +
      r.tertinggi +
      '</div></div><div class="summary-item"><div class="si-l">Terendah</div><div class="si-v">' +
      r.terendah +
      '</div></div><div class="summary-item"><div class="si-l">Jumlah siswa</div><div class="si-v">' +
      r.jumlahSiswa +
      "</div></div>";

    const rows = filteredRekap();
    const body = $("rekapTableBody");
    if (!rows.length) {
      body.innerHTML = emptyRow(7);
    } else {
      body.innerHTML = rows
        .map(function (s) {
          return (
            "<tr>" +
            '<td class="name-cell">' +
            s.nama +
            "</td>" +
            "<td>" +
            s.kelas +
            "</td>" +
            "<td>" +
            s.tugas +
            "</td>" +
            "<td>" +
            s.kuis +
            "</td>" +
            "<td>" +
            s.ujian +
            "</td>" +
            '<td class="name-cell">' +
            s.akhir +
            "</td>" +
            "<td>" +
            trenHtml(s.tren) +
            "</td>" +
            "</tr>"
          );
        })
        .join("");
    }
    $("rekapTableFoot").textContent =
      "Menampilkan " + rows.length + " dari " + D.rekapNilai.length + " siswa pada tabel contoh.";
  }

  function renderAnalisis() {
    $("analisisCount").textContent = D.siswaPerhatian.length;
    $("aturanList").innerHTML = D.aturanAnalisis
      .map(function (a) {
        return (
          "<li><span class=\"rule-no\">" +
          a.no +
          "</span><span>" +
          a.teks +
          "</span></li>"
        );
      })
      .join("");

    $("analisisTableBody").innerHTML = D.siswaPerhatian
      .map(function (s) {
        const ubah =
          s.perubahan < 0
            ? '<span class="trend down">' + s.perubahan + " poin</span>"
            : '<span class="trend up">+' + s.perubahan + " poin</span>";
        return (
          "<tr>" +
          '<td class="name-cell">' +
          s.namaPendek +
          "</td>" +
          "<td>" +
          s.kelas +
          "</td>" +
          "<td>" +
          s.rataRata +
          "</td>" +
          "<td>" +
          ubah +
          "</td>" +
          "<td>" +
          s.tugasBelum +
          "</td>" +
          "<td>" +
          s.alasan +
          "</td>" +
          "<td>" +
          s.rekomendasi +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  /* ——— Navigation ——— */
  function showPage(page) {
    if (!PAGES[page]) page = "dashboard";
    currentPage = page;
    document.querySelectorAll(".page").forEach(function (el) {
      el.classList.toggle("active", el.id === "page-" + page);
    });
    document.querySelectorAll(".nav-item").forEach(function (el) {
      el.classList.toggle("active", el.dataset.page === page);
    });
    $("crumbTitle").textContent = PAGES[page].title;
    $("crumbPath").textContent = PAGES[page].crumb;
    if (location.hash.slice(1) !== page) {
      history.replaceState(null, "", "#" + page);
    }
    closeSidebar();
    closeMenus();
    requestAnimationFrame(function () {
      AppCharts.renderForPage(page, D);
    });
  }

  function closeMenus() {
    document.querySelectorAll(".dropdown-menu.show, [data-bs-toggle='dropdown'].show").forEach(function (el) {
      el.classList.remove("show");
    });
    document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach(function (btn) {
      btn.setAttribute("aria-expanded", "false");
      const inst = bootstrap.Dropdown.getInstance(btn);
      if (inst) inst.hide();
    });
  }

  function openSidebar() {
    $("sidebar").classList.add("open");
    $("sidebarOverlay").classList.add("show");
  }

  function closeSidebar() {
    $("sidebar").classList.remove("open");
    $("sidebarOverlay").classList.remove("show");
  }

  function switchTab(name) {
    document.querySelectorAll(".seg-btn").forEach(function (b) {
      b.classList.toggle("active", b.dataset.tab === name);
    });
    $("tab-otomatis").hidden = name !== "otomatis";
    $("tab-manual").hidden = name !== "manual";
  }

  function openDetailTugas(id) {
    const t = D.tugas.find(function (x) {
      return x.id === id;
    });
    if (!t) return;
    $("detailTugasTitle").textContent = t.judul;
    $("detailTugasBody").innerHTML = [
      ["Mata pelajaran", t.mapel],
      ["Kelas", t.kelas],
      ["Tenggat", t.tenggat],
      ["Jenis penilaian", t.jenis],
      ["Status", t.status],
      ["Bobot nilai", t.bobot + "%"],
      ["Skor maksimal", String(t.skorMaks)],
      ["Deskripsi", t.deskripsi],
    ]
      .map(function (p) {
        return (
          '<div class="detail-item"><div class="di-l">' +
          p[0] +
          '</div><div class="di-v">' +
          p[1] +
          "</div></div>"
        );
      })
      .join("");
    modalTugas.show();
  }

  function openDetailKumpul(id) {
    const r = D.pengumpulan.find(function (x) {
      return x.id === id;
    });
    if (!r) return;
    $("detailKumpulBody").innerHTML = [
      ["Nama siswa", r.nama],
      ["NIS", r.nis],
      ["Kelas", r.kelas],
      ["Nama tugas", r.tugas],
      ["Jenis pengumpulan", r.jenis],
      ["Tanggal pengumpulan", r.tanggal],
      ["Status pengumpulan", r.status],
      ["Status penilaian", r.penilaian],
      ["Nilai", r.nilai === null ? "Belum ada" : String(r.nilai)],
    ]
      .map(function (p) {
        return (
          '<div class="detail-item"><div class="di-l">' +
          p[0] +
          '</div><div class="di-v">' +
          p[1] +
          "</div></div>"
        );
      })
      .join("");
    modalKumpul.show();
  }

  function tandaiDiterima(id) {
    const r = D.pengumpulan.find(function (x) {
      return x.id === id;
    });
    if (!r) return;
    r.status = "Sudah Dikumpulkan";
    if (r.tanggal === "—") {
      r.tanggal = "29 Okt 2026, 10.05";
    }
    renderPengumpulan();
    showToast("Mode demonstrasi: aksi ini hanya simulasi.");
  }

  function bindEvents() {
    document.querySelectorAll(".nav-item").forEach(function (btn) {
      btn.addEventListener("click", function () {
        showPage(btn.dataset.page);
      });
    });

    window.addEventListener("hashchange", function () {
      showPage(location.hash.slice(1) || "dashboard");
    });

    $("sidebarToggle").addEventListener("click", function () {
      if ($("sidebar").classList.contains("open")) closeSidebar();
      else openSidebar();
    });
    $("sidebarOverlay").addEventListener("click", closeSidebar);

    ["tugasSearch", "tugasFilterKelas", "tugasFilterMapel", "tugasFilterStatus"].forEach(function (id) {
      $(id).addEventListener("input", renderTugas);
      $(id).addEventListener("change", renderTugas);
    });
    ["kumpulFilterKelas", "kumpulFilterTugas", "kumpulFilterStatus"].forEach(function (id) {
      $(id).addEventListener("change", renderPengumpulan);
    });
    ["rekapFilterKelas", "rekapFilterMapel", "rekapSearch"].forEach(function (id) {
      $(id).addEventListener("input", renderRekap);
      $(id).addEventListener("change", renderRekap);
    });
    $("rekapFilterSemester").addEventListener("change", function () {
      renderRekap();
      showToast("Mode demonstrasi: aksi ini hanya simulasi.");
    });

    document.querySelectorAll(".seg-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        switchTab(btn.dataset.tab);
      });
    });

    document.body.addEventListener("click", function (e) {
      const demo = e.target.closest(".js-demo");
      if (demo) {
        e.preventDefault();
        demoToast();
        return;
      }
      const aksi = e.target.closest("[data-aksi]");
      if (!aksi) return;
      const type = aksi.dataset.aksi;
      const id = aksi.dataset.id;
      if (type === "detail-tugas") openDetailTugas(id);
      if (type === "detail-kumpul") openDetailKumpul(id);
      if (type === "terima") tandaiDiterima(id);
      if (type === "lihat-hasil") {
        renderHasilOtomatis();
        showToast("Menampilkan contoh hasil penilaian otomatis.");
      }
      if (type === "isi-nilai") {
        const item = D.penilaianManual.find(function (x) {
          return x.id === id;
        });
        fillManualForm(item);
        switchTab("manual");
      }
    });

    $("formBuatTugas").addEventListener("submit", function (e) {
      e.preventDefault();
      bootstrap.Modal.getInstance($("modalBuatTugas")).hide();
      $("formBuatTugas").reset();
      showToast("Mode demonstrasi: data tidak disimpan.");
    });

    $("formManual").addEventListener("submit", function (e) {
      e.preventDefault();
      const id = e.currentTarget.dataset.id;
      if (!id) {
        showToast("Pilih siswa dari tabel terlebih dahulu.");
        return;
      }
      const item = D.penilaianManual.find(function (x) {
        return x.id === id;
      });
      const nilai = $("manualNilai").value;
      item.nilai = nilai === "" ? null : Number(nilai);
      item.catatan = $("manualCatatan").value;
      renderManual();
      showToast("Mode demonstrasi: data tidak disimpan.");
    });
  }

  function fillStaticSelects() {
    fillSelect($("tugasFilterKelas"), D.kelas, "Semua kelas");
    fillSelect($("tugasFilterMapel"), D.mapel, "Semua mapel");
    fillSelect($("kumpulFilterKelas"), D.kelas, "Semua kelas");
    const judulTugas = D.tugas.map(function (t) {
      return t.judul;
    });
    fillSelect($("kumpulFilterTugas"), judulTugas, "Semua tugas");
    fillSelect($("rekapFilterSemester"), D.semester, "Semua semester");
    $("rekapFilterSemester").value = D.semester[0];
    fillSelect($("rekapFilterKelas"), D.kelas, "Semua kelas");
    fillSelect($("rekapFilterMapel"), D.mapel, "Semua mapel");
    fillSelect($("ftMapel"), D.mapel, "Pilih mapel");
    fillSelect($("ftKelas"), D.kelas, "Pilih kelas");
    $("ftMapel").value = D.mapel[0];
    $("ftKelas").value = D.kelas[0];
  }

  function init() {
    AppCharts.initDefaults();
    toastInst = new bootstrap.Toast($("appToast"), { delay: 2800 });
    modalTugas = new bootstrap.Modal($("modalDetailTugas"));
    modalKumpul = new bootstrap.Modal($("modalDetailKumpul"));
    fillStaticSelects();
    renderNotif();
    renderDashboard();
    renderTugas();
    renderPengumpulanKpi();
    renderPengumpulan();
    renderKuis();
    renderHasilOtomatis();
    renderManual();
    fillManualForm(D.penilaianManual[0]);
    renderRekap();
    renderAnalisis();
    bindEvents();
    closeMenus();
    const initial = location.hash.slice(1) || "dashboard";
    showPage(initial);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
