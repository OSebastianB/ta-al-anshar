/* Modul 3 — Analisis dan Peringatan Dini */
(function () {
  var D;

  function ui() {
    return window.UI;
  }

  function chips(list) {
    if (!list || !list.length) return '<span class="pill pill-muted">Tidak ditandai</span>';
    return list
      .map(function (a) {
        var kind = a.kode === "hadir" || a.kode === "turun" ? "warning" : a.kode === "nilai" ? "danger" : "info";
        return ui().pill(kind, a.teks);
      })
      .join(" ");
  }

  function pilih(id) {
    D.siswaDipilih = id;
  }

  function perhatianScoped() {
    if (ui().getSiswaPerhatianScoped) return ui().getSiswaPerhatianScoped();
    return D.siswaPerhatian;
  }

  function siswaScoped() {
    return D.siswa.filter(function (s) {
      return ui().inScopeSiswa ? ui().inScopeSiswa(s) : true;
    });
  }

  function siswaAktif() {
    var s = D.siswa.filter(function (x) {
      return x.id === D.siswaDipilih;
    })[0];
    if (s && ui().inScopeSiswa && !ui().inScopeSiswa(s)) s = null;
    return s || perhatianScoped()[0] || siswaScoped()[0] || D.siswa[0];
  }

  function renderDashboard() {
    var rows = perhatianScoped();
    var trenMenurun = rows.filter(function (s) {
      return s.perubahan < 0;
    }).length;
    var hadirRendah = rows.filter(function (s) {
      return s.persenHadir < D.ambang.hadir;
    }).length;
    var tugasKurang = rows.filter(function (s) {
      return s.tugasBelum >= D.ambang.tugas;
    }).length;
    var items = [
      ["Perlu ditinjau guru", rows.length, "bi-person-exclamation", "navy", "satu atau lebih kriteria"],
      ["Tren nilai menurun", trenMenurun, "bi-graph-down-arrow", "amber", "turun mencapai ambang"],
      ["Kehadiran rendah", hadirRendah, "bi-person-x", "rose", "di bawah ambang kehadiran"],
      ["Tugas belum lengkap", tugasKurang, "bi-journal-x", "blue", "mencapai ambang tugas"],
    ];
    document.getElementById("analisisDashKpi").innerHTML = items
      .map(function (it) {
        return (
          '<div class="kpi-card"><div class="kpi-icon ' + it[3] + '"><i class="bi ' + it[2] +
          '"></i></div><div><div class="kpi-label">' + it[0] + '</div><div class="kpi-value">' + it[1] +
          '</div><div class="kpi-hint">' + it[4] + "</div></div></div>"
        );
      })
      .join("");
    document.getElementById("analisisDashBody").innerHTML = rows.length
      ? rows
          .map(function (s) {
            return (
              "<tr><td class=\"name-cell\">" + s.namaPendek + "</td><td>" + s.kelas + "</td><td>" + s.rataRata +
              "</td><td>" + String(s.persenHadir).replace(".", ",") + "%</td><td>" + s.tugasBelum +
              "</td><td>" + chips(s.alasanList) +
              "</td><td><button class=\"btn btn-sm btn-outline-secondary\" type=\"button\" data-aksi=\"detail-siswa\" data-id=\"" +
              s.id + "\">Lihat Detail</button></td></tr>"
            );
          })
          .join("")
      : ui().emptyRow(7, "Tidak ada siswa yang perlu ditinjau pada cakupan role ini.");
  }

  function renderPerkembangan() {
    var kelas = document.getElementById("perkKelas").value || "V-A";
    var mapel = document.getElementById("perkMapel").value || "Matematika";
    if (ui().getPeran && ui().getPeran() === "guru" && ui().scopeGuru) {
      kelas = ui().scopeGuru.waliKelas;
      mapel = ui().scopeGuru.mapel;
      document.getElementById("perkKelas").value = kelas;
      document.getElementById("perkMapel").value = mapel;
    }
    var periode = document.getElementById("perkPeriode").value;
    D.ui.kelasPerk = kelas;
    D.ui.mapelPerk = mapel;
    var pool = D.siswa.filter(function (s) { return s.kelas === kelas; });
    var flagged = pool.filter(function (s) { return s.alasanList.length; });
    var list = (flagged.length ? flagged : pool).slice(0, 4);
    var note = document.getElementById("perkNote");
    if (periode) {
      note.hidden = false;
      note.textContent = "Data tren belum memadai untuk satu periode saja. Pilih seluruh periode agar perkembangan Juli–Oktober terlihat.";
    } else if (list[0] && list[0].nilaiMapel[mapel].historis.length >= 2) {
      note.hidden = false;
      note.textContent = flagged.length
        ? "Grafik menampilkan siswa di " + kelas + " yang perlu ditinjau, untuk " + mapel + "."
        : "Tidak ada siswa yang ditandai di kelas ini. Grafik menampilkan sebagian siswa sebagai gambaran.";
    } else {
      note.hidden = false;
      note.textContent = "Data belum memadai.";
    }
    document.getElementById("perkBody").innerHTML = pool
      .map(function (s) {
        var n = s.nilaiMapel[mapel];
        var sekarang = periode ? n.historis[D.periode.indexOf(periode)] : n.akhir;
        var lalu = n.historis[2];
        return (
          "<tr><td class=\"name-cell\">" + s.nama + "</td><td>" + (periode ? lalu : n.historis[2]) +
          "</td><td>" + sekarang + "</td><td>" + ui().trenHtml(periode ? "Stabil" : n.tren) + "</td></tr>"
        );
      })
      .join("");
    if (document.getElementById("page-perkembangan").classList.contains("active")) {
      AppCharts.renderForPage("perkembangan", D);
    }
  }

  function renderPeringatan() {
    D.terapkanAmbang({
      nilai: document.getElementById("ambangNilai").value,
      turun: document.getElementById("ambangTurun").value,
      hadir: document.getElementById("ambangHadir").value,
      tugas: document.getElementById("ambangTugas").value,
    });
    var rows = perhatianScoped();
    document.getElementById("peringatanCount").textContent =
      rows.length + " siswa perlu ditinjau guru pada ambang saat ini" +
      (ui().getPeran && ui().getPeran() === "guru" ? " (cakupan kelas wali)." : ".");
    document.getElementById("peringatanBody").innerHTML = rows.length
      ? rows
          .map(function (s) {
            return (
              "<tr><td class=\"name-cell\">" + s.nama + "</td><td>" + s.kelas + "</td><td>" + s.rataRata +
              "</td><td>" + String(s.persenHadir).replace(".", ",") + "%</td><td>" + s.tugasBelum +
              "</td><td class=\"alasan-cell\">" + chips(s.alasanList) + "</td><td>" + s.tindakLanjut +
              "</td><td><button class=\"btn btn-sm btn-outline-secondary\" type=\"button\" data-aksi=\"detail-siswa\" data-id=\"" +
              s.id + "\">Lihat Detail</button></td></tr>"
            );
          })
          .join("")
      : ui().emptyRow(8, "Tidak ada siswa yang memenuhi ambang ini pada cakupan role.");
    if (document.getElementById("page-analisis-dashboard").classList.contains("active")) renderDashboard();
  }

  function renderDetail() {
    var s = siswaAktif();
    D.siswaDipilih = s.id;
    document.getElementById("detailPilih").value = s.id;
    document.getElementById("detailNama").textContent = s.nama;
    document.getElementById("detailMeta").textContent = "NIS " + s.nis + " · Kelas " + s.kelas;
    document.getElementById("detailNilaiBody").innerHTML = D.mapel
      .map(function (m) {
        var n = s.nilaiMapel[m];
        return "<tr><td>" + m + "</td><td>" + n.tugas + "</td><td>" + n.kuis + "</td><td>" + n.ujian + "</td><td class=\"name-cell\">" + n.akhir + "</td><td>" + ui().trenHtml(n.tren) + "</td></tr>";
      })
      .join("");
    var rec = D.kehadiran.filter(function (k) { return k.nis === s.nis; });
    var c = { Hadir: 0, Terlambat: 0, Izin: 0, Sakit: 0, Alpa: 0 };
    rec.forEach(function (k) { c[k.status] += 1; });
    document.getElementById("detailHadirRingkas").textContent =
      "Hadir " + c.Hadir + " · Terlambat " + c.Terlambat + " · Izin " + c.Izin + " · Sakit " + c.Sakit + " · Alpa " + c.Alpa +
      " · Kehadiran " + String(s.persenHadir).replace(".", ",") + "%";
    var tugas = D.pengumpulan.filter(function (p) { return p.nis === s.nis; });
    document.getElementById("detailTugasBody").innerHTML = tugas
      .map(function (p) {
        return "<tr><td>" + p.tugas + "</td><td>" + p.jenis + "</td><td>" + p.tanggal + "</td><td>" + ui().statusKumpulPill(p.status) + "</td><td>" + (p.nilai === null ? "—" : p.nilai) + "</td></tr>";
      })
      .join("");
    var alasan = document.getElementById("detailAlasan");
    if (s.alasanList.length) {
      alasan.innerHTML = "<p class=\"panel-sub\">Perlu ditinjau guru</p>" + chips(s.alasanList) + "<p class=\"panel-sub\" style=\"margin-top:8px\">" + s.tindakLanjut + "</p>";
    } else {
      alasan.innerHTML = "<p class=\"panel-sub\">Siswa ini tidak memenuhi ambang peringatan dini saat ini.</p>";
    }
    document.getElementById("detailCatatan").value = s.catatanGuru || "";
    if (document.getElementById("page-detail-siswa").classList.contains("active")) {
      AppCharts.renderForPage("detail-siswa", D);
    }
  }

  function refreshScope() {
    if (!D) return;
    var list = siswaScoped();
    var pilihEl = document.getElementById("detailPilih");
    if (pilihEl) {
      pilihEl.innerHTML = list
        .map(function (s) {
          return '<option value="' + s.id + '">' + s.nama + " · " + s.kelas + "</option>";
        })
        .join("");
      if (!list.some(function (s) { return s.id === D.siswaDipilih; })) {
        D.siswaDipilih = (list[0] || D.siswa[0]).id;
      }
      pilihEl.value = D.siswaDipilih;
    }
  }

  function init() {
    D = window.APP_DATA;
    D.ui = D.ui || {};
    D.siswaDipilih = (D.siswaPerhatian[0] || D.siswa[0]).id;
    ui().fillSelect(document.getElementById("perkKelas"), D.kelas, "Pilih kelas");
    document.getElementById("perkKelas").value = "V-A";
    ui().fillSelect(document.getElementById("perkMapel"), D.mapel, "Pilih mapel");
    document.getElementById("perkMapel").value = "Matematika";
    ui().fillSelect(document.getElementById("perkPeriode"), D.periode, "Seluruh periode");
    refreshScope();
    ["ambangNilai", "ambangTurun", "ambangHadir", "ambangTugas"].forEach(function (id) {
      document.getElementById(id).addEventListener("input", renderPeringatan);
    });
    ["perkKelas", "perkMapel", "perkPeriode"].forEach(function (id) {
      document.getElementById(id).addEventListener("change", renderPerkembangan);
    });
    document.getElementById("detailPilih").addEventListener("change", function () {
      pilihId(document.getElementById("detailPilih").value);
    });
    document.getElementById("btnKembaliDetail").addEventListener("click", function () {
      window.UI.showPage("peringatan");
    });
    document.getElementById("formCatatan").addEventListener("submit", function (e) {
      e.preventDefault();
      if (ui().boleh && !ui().boleh("simpan-catatan")) {
        ui().showToast("Mode Demo: menambah catatan tidak tersedia untuk role ini.");
        return;
      }
      siswaAktif().catatanGuru = document.getElementById("detailCatatan").value;
      ui().showToast("Simulasi: catatan guru tidak disimpan permanen.");
    });
    document.body.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-aksi='detail-siswa']");
      if (!btn) return;
      var target = D.siswa.filter(function (s) {
        return String(s.id) === String(btn.dataset.id);
      })[0];
      if (target && ui().inScopeSiswa && !ui().inScopeSiswa(target)) {
        ui().showToast("Mode Demo: detail siswa di luar cakupan role tidak tersedia.");
        return;
      }
      pilih(btn.dataset.id);
      window.UI.showPage("detail-siswa");
    });
    renderPeringatan();
    onShow((location.hash || "#dashboard").slice(1));
  }

  function pilihId(id) {
    pilih(id);
    renderDetail();
  }

  function onShow(page) {
    if (!D) return;
    refreshScope();
    if (page === "analisis-dashboard") renderDashboard();
    if (page === "perkembangan") renderPerkembangan();
    if (page === "peringatan") renderPeringatan();
    if (page === "detail-siswa") renderDetail();
  }

  document.addEventListener("DOMContentLoaded", init);
  window.Modul3 = { onShow: onShow, pilih: pilih, refreshScope: refreshScope };
})();
