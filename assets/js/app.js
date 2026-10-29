(function () {
  const D = window.APP_DATA;
  const PAGES = {
    dashboard: { title: "Dashboard Akademik", crumb: "Penilaian / Dashboard" },
    tugas: { title: "Manajemen Tugas", crumb: "Penilaian / Manajemen Tugas" },
    pengumpulan: { title: "Pengumpulan Tugas", crumb: "Penilaian / Pengumpulan" },
    penilaian: { title: "Penilaian Akademik", crumb: "Penilaian / Penilaian" },
    rekap: { title: "Rekap Nilai Akademik", crumb: "Penilaian / Rekap Nilai" },
    analisis: { title: "Analisis Performa Akademik", crumb: "Penilaian / Analisis" },
    absensi: { title: "Dashboard Absensi", crumb: "Absensi / Dashboard" },
    kehadiran: { title: "Kehadiran Siswa", crumb: "Absensi / Siswa" },
    pegawai: { title: "Kehadiran Pegawai", crumb: "Absensi / Pegawai" },
    jadwal: { title: "Jadwal Kelas", crumb: "Jadwal / Kelas" },
    "rekap-absensi": { title: "Rekap Absensi", crumb: "Absensi / Rekap" },
    portal: { title: "Kehadiran Anak", crumb: "Orang Tua / Kehadiran Anak" },
    "analisis-dashboard": { title: "Dashboard Analisis", crumb: "Analisis / Dashboard" },
    perkembangan: { title: "Perkembangan Nilai", crumb: "Analisis / Perkembangan" },
    peringatan: { title: "Peringatan Dini", crumb: "Analisis / Peringatan Dini" },
    "detail-siswa": { title: "Detail Siswa", crumb: "Analisis / Detail Siswa" },
    alur: { title: "Alur Integrasi", crumb: "Integrasi / Alur Data" },
  };

  let toastInst;
  let modalTugas;
  let modalKumpul;
  let currentPage = "dashboard";
  let peranAktif = "guru";
  const SCOPE_GURU = D.peranContoh.guru;
  const ROLE = {
    admin: {
      home: "dashboard",
      pages: [
        "dashboard",
        "tugas",
        "pengumpulan",
        "penilaian",
        "rekap",
        "analisis",
        "absensi",
        "kehadiran",
        "pegawai",
        "jadwal",
        "rekap-absensi",
        "analisis-dashboard",
        "perkembangan",
        "peringatan",
        "detail-siswa",
      ],
      izin: {
        "catat-hadir": true,
        "tambah-jadwal": true,
        "buat-tugas": false,
        "edit-tugas": false,
        "terima-kumpul": false,
        "isi-nilai": "koreksi",
        "simpan-nilai": "koreksi",
        "atur-ambang": true,
        "simpan-catatan": true,
        "catat-pegawai": true,
        "unduh-rekap": true,
      },
    },
    guru: {
      home: "dashboard",
      pages: [
        "dashboard",
        "tugas",
        "pengumpulan",
        "penilaian",
        "rekap",
        "analisis",
        "absensi",
        "kehadiran",
        "jadwal",
        "rekap-absensi",
        "analisis-dashboard",
        "perkembangan",
        "peringatan",
        "detail-siswa",
      ],
      izin: {
        "catat-hadir": true,
        "tambah-jadwal": false,
        "buat-tugas": true,
        "edit-tugas": true,
        "terima-kumpul": true,
        "isi-nilai": true,
        "simpan-nilai": true,
        "atur-ambang": false,
        "simpan-catatan": true,
        "catat-pegawai": false,
        "unduh-rekap": true,
      },
    },
    kepsek: {
      home: "dashboard",
      pages: [
        "dashboard",
        "rekap",
        "analisis",
        "absensi",
        "kehadiran",
        "jadwal",
        "rekap-absensi",
        "analisis-dashboard",
        "perkembangan",
        "peringatan",
        "detail-siswa",
      ],
      izin: {
        "catat-hadir": false,
        "tambah-jadwal": false,
        "buat-tugas": false,
        "edit-tugas": false,
        "terima-kumpul": false,
        "isi-nilai": false,
        "simpan-nilai": false,
        "atur-ambang": false,
        "simpan-catatan": false,
        "catat-pegawai": false,
        "unduh-rekap": true,
      },
    },
  };
  const PROFIL_PERAN = D.peranContoh;

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

  function boleh(izin) {
    var v = ROLE[peranAktif] && ROLE[peranAktif].izin[izin];
    return v === true || v === "koreksi";
  }

  function modeIzin(izin) {
    return (ROLE[peranAktif] && ROLE[peranAktif].izin[izin]) || false;
  }

  function persenHadirSekolah() {
    var total = D.kehadiran.length;
    var hadir = D.kehadiran.filter(function (k) {
      return k.status === "Hadir" || k.status === "Terlambat";
    }).length;
    return total ? Math.round((hadir / total) * 1000) / 10 : 0;
  }

  function jadwalHariIniGuru() {
    return D.jadwal.filter(function (j) {
      return j.hari === D.hariIniNama && j.guru === SCOPE_GURU.nama;
    }).length;
  }

  function perhatianUntukPeran() {
    if (peranAktif !== "guru") return D.siswaPerhatian;
    return D.siswaPerhatian.filter(function (s) {
      return s.kelas === SCOPE_GURU.waliKelas;
    });
  }

  function applyIzinUi() {
    document.querySelectorAll("[data-izin]").forEach(function (el) {
      var key = el.dataset.izin;
      var ok = boleh(key);
      el.hidden = !ok;
      el.classList.toggle("izin-disabled", !ok);
      if (el.tagName === "BUTTON" || el.tagName === "INPUT") {
        el.disabled = !ok;
      }
    });
    document.querySelectorAll("[data-izin-field]").forEach(function (el) {
      var ok = modeIzin(el.dataset.izinField) === true;
      el.readOnly = !ok;
      el.disabled = !ok;
    });
    var badge = $("ambangReadonly");
    if (badge) badge.hidden = modeIzin("atur-ambang") === true;
    document.body.dataset.peran = peranAktif;
  }

  function renderDashboard() {
    const k = D.kpi;
    var items;
    var judul = "Dashboard Akademik";
    var sub = "Ringkasan aktivitas dan perkembangan akademik siswa.";
    if (peranAktif === "admin") {
      judul = "Dashboard Sekolah";
      sub = "Ringkasan operasional sekolah untuk admin. Data contoh semester ganjil 2026/2027.";
      items = [
        { label: "Total Siswa", value: k.siswaAktif, icon: "bi-people", tone: "navy", hint: "lima kelas contoh" },
        { label: "Total Guru", value: Object.keys(D.guruMap).length, icon: "bi-person-workspace", tone: "blue", hint: "mapel aktif" },
        { label: "Total Kelas", value: D.kelas.length, icon: "bi-building", tone: "teal", hint: "IV–VI" },
        { label: "Belum Dinilai", value: k.belumDinilai, icon: "bi-hourglass-split", tone: "amber", hint: "menunggu guru" },
      ];
    } else if (peranAktif === "kepsek") {
      judul = "Dashboard Kepala Sekolah";
      sub = "Pemantauan dan pelaporan sekolah. Tanpa aksi mengubah nilai atau absensi individu.";
      items = [
        { label: "Siswa & Guru", value: k.siswaAktif + " / " + Object.keys(D.guruMap).length, icon: "bi-people", tone: "navy", hint: "data contoh" },
        { label: "Kehadiran sekolah", value: String(persenHadirSekolah()).replace(".", ",") + "%", icon: "bi-clipboard-check", tone: "teal", hint: "Oktober 2026" },
        { label: "Rata-rata nilai", value: fmt(k.rataRataNilai), icon: "bi-bar-chart", tone: "blue", hint: "seluruh mapel" },
        { label: "Perlu ditinjau", value: D.siswaPerhatian.length, icon: "bi-exclamation-diamond", tone: "amber", hint: "peringatan dini" },
      ];
    } else {
      judul = "Dashboard Guru / Wali Kelas";
      sub =
        "Cakupan contoh: mapel " +
        SCOPE_GURU.mapel +
        " dan wali kelas " +
        SCOPE_GURU.waliKelas +
        ".";
      var tugasGuru = D.tugas.filter(function (t) {
        return t.mapel === SCOPE_GURU.mapel && t.status === "Aktif";
      }).length;
      var belumGuru = D.pengumpulan.filter(function (p) {
        return p.mapel === SCOPE_GURU.mapel && p.penilaian === "Belum Dinilai" && p.status !== "Belum Dikumpulkan";
      }).length;
      var hadirKelas = D.kehadiran.filter(function (h) {
        return h.tanggal === D.hariIni && h.kelas === SCOPE_GURU.waliKelas && (h.status === "Hadir" || h.status === "Terlambat");
      }).length;
      items = [
        { label: "Jadwal hari ini", value: jadwalHariIniGuru(), icon: "bi-calendar-week", tone: "navy", hint: D.hariIniNama },
        { label: "Tugas aktif", value: tugasGuru, icon: "bi-journal-text", tone: "blue", hint: SCOPE_GURU.mapel },
        { label: "Belum dinilai", value: belumGuru, icon: "bi-hourglass-split", tone: "amber", hint: "mapel saya" },
        { label: "Hadir kelas wali", value: hadirKelas + "/10", icon: "bi-person-check", tone: "teal", hint: SCOPE_GURU.waliKelas },
      ];
    }
    if ($("dashboardJudul")) $("dashboardJudul").textContent = judul;
    if ($("dashboardSub")) $("dashboardSub").textContent = sub;
    $("dashboardKpi").innerHTML = items
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
          '</div><div class="kpi-hint">' +
          it.hint +
          "</div></div></div>"
        );
      })
      .join("");

    var list = perhatianUntukPeran();
    $("dashboardPerhatianBody").innerHTML = list.length
      ? list
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
          .join("")
      : emptyRow(7, "Tidak ada siswa yang perlu ditinjau pada cakupan role ini.");
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
      const matchScope = peranAktif !== "guru" || t.mapel === SCOPE_GURU.mapel;
      return matchQ && matchK && matchM && matchS && matchScope;
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
            (boleh("edit-tugas")
              ? '<button class="btn btn-sm btn-outline-secondary js-demo" type="button" data-izin="edit-tugas">Edit</button>'
              : "") +
            "</div></td>" +
            "</tr>"
          );
        })
        .join("");
    }
    var totalScope =
      peranAktif === "guru" ? D.tugas.filter(function (t) { return t.mapel === SCOPE_GURU.mapel; }).length : D.tugas.length;
    $("tugasTableFoot").textContent = "Menampilkan " + rows.length + " dari " + totalScope + " tugas pada cakupan role.";
    applyIzinUi();
  }

  function renderPengumpulanKpi() {
    var base =
      peranAktif === "guru"
        ? D.pengumpulan.filter(function (r) {
            return r.mapel === SCOPE_GURU.mapel;
          })
        : D.pengumpulan;
    var p = {
      total: base.length,
      terkumpul: base.filter(function (r) {
        return r.status === "Sudah Dikumpulkan";
      }).length,
      terlambat: base.filter(function (r) {
        return r.status === "Terlambat";
      }).length,
      belum: base.filter(function (r) {
        return r.status === "Belum Dikumpulkan";
      }).length,
    };
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
        (!status || r.status === status) &&
        (peranAktif !== "guru" || r.mapel === SCOPE_GURU.mapel)
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
            (canAccept && boleh("terima-kumpul")
              ? '<button class="btn btn-sm btn-primary" type="button" data-aksi="terima" data-id="' +
                r.id +
                '" data-izin="terima-kumpul">Tandai Diterima</button>'
              : "") +
            "</div></td>" +
            "</tr>"
          );
        })
        .join("");
    }
    $("kumpulTableFoot").textContent =
      "Menampilkan " + rows.length + " catatan pada filter dan cakupan role aktif.";
    applyIzinUi();
  }

  function renderKuis() {
    var list = D.kuisOtomatis.filter(function (k) {
      return peranAktif !== "guru" || k.mapel === SCOPE_GURU.mapel;
    });
    $("kuisTableBody").innerHTML = list
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
    var rows = D.penilaianManual.filter(function (m) {
      if (peranAktif !== "guru") return true;
      var t = D.tugas.find(function (x) {
        return x.judul === m.tugas;
      });
      return t && t.mapel === SCOPE_GURU.mapel;
    });
    var mode = modeIzin("isi-nilai");
    $("manualTableBody").innerHTML = rows.length
      ? rows
          .map(function (m) {
            var label =
              mode === "koreksi"
                ? "Ajukan koreksi"
                : mode
                  ? m.nilai === null
                    ? "Input nilai"
                    : "Ubah"
                  : "Hanya baca";
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
              "<td>" +
              (mode
                ? '<button class="btn btn-sm btn-outline-secondary" type="button" data-aksi="isi-nilai" data-id="' +
                  m.id +
                  '">' +
                  label +
                  "</button>"
                : '<span class="badge-readonly">Hanya baca</span>') +
              "</td>" +
              "</tr>"
            );
          })
          .join("")
      : emptyRow(6, "Tidak ada penilaian manual pada cakupan role ini.");
    applyIzinUi();
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
    return D.siswa
      .filter(function (s) {
        return (!kelas || s.kelas === kelas) && (!q || s.nama.toLowerCase().indexOf(q) >= 0);
      })
      .map(function (s) {
        var n = mapel && s.nilaiMapel[mapel] ? s.nilaiMapel[mapel] : s;
        return {
          nama: s.nama,
          kelas: s.kelas,
          tugas: n.tugas,
          kuis: n.kuis,
          ujian: n.ujian,
          akhir: n.akhir,
          tren: n.tren,
        };
      });
  }

  function renderRekap() {
    const rowsAwal = filteredRekap();
    const nilai = rowsAwal.map(function (s) { return s.akhir; });
    const r = nilai.length
      ? {
          rataRata: Math.round((nilai.reduce(function (a, b) { return a + b; }, 0) / nilai.length) * 10) / 10,
          tertinggi: Math.max.apply(null, nilai),
          terendah: Math.min.apply(null, nilai),
          jumlahSiswa: nilai.length,
        }
      : D.ringkasanKelas;
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
  function applyPeran(peran, opts) {
    opts = opts || {};
    if (!ROLE[peran]) peran = "guru";
    peranAktif = peran;
    try {
      localStorage.setItem("ta_demo_peran", peran);
    } catch (e) {}
    var profil = PROFIL_PERAN[peran];
    $("avatarInisial").textContent = profil.inisial;
    $("profilNama").textContent = profil.nama;
    $("profilPeran").textContent = profil.peran;
    document.querySelectorAll(".nav-item").forEach(function (btn) {
      var raw = (btn.dataset.akses || "").trim();
      var allowed = !raw || raw.split(/\s+/).indexOf(peran) >= 0;
      btn.hidden = !allowed || ROLE[peran].pages.indexOf(btn.dataset.page) < 0;
    });
    var catatan = {
      admin: [
        { ikon: "bi-person-badge", judul: "Pak Budi Santoso izin hari ini", waktu: "Hari ini, 06.40" },
        { ikon: "bi-exclamation-diamond", judul: D.siswaPerhatian.length + " siswa perlu ditinjau guru", waktu: "Oktober 2026" },
      ],
      guru: [
        { ikon: "bi-clock", judul: "Ahmad Fauzan terlambat di kelas V-A", waktu: "Hari ini, 07.18" },
        { ikon: "bi-clipboard-check", judul: "Pengumpulan Matematika menunggu penilaian", waktu: "Hari ini, 08.15" },
        { ikon: "bi-person-exclamation", judul: perhatianUntukPeran().length + " siswa kelas wali perlu ditinjau", waktu: "Oktober 2026" },
      ],
      kepsek: [
        { ikon: "bi-bar-chart", judul: "Rata-rata nilai sekolah " + fmt(D.kpi.rataRataNilai), waktu: "Oktober 2026" },
        { ikon: "bi-clipboard-check", judul: "Kehadiran sekolah " + String(persenHadirSekolah()).replace(".", ",") + "%", waktu: "Oktober 2026" },
        { ikon: "bi-exclamation-diamond", judul: D.siswaPerhatian.length + " siswa memenuhi kriteria perhatian", waktu: "Laporan" },
      ],
    };
    $("notifList").innerHTML = (catatan[peran] || [])
      .map(function (n) {
        return '<div class="notif-item"><i class="bi ' + n.ikon + '"></i><div><div class="n-title">' + n.judul + '</div><div class="n-time">' + n.waktu + "</div></div></div>";
      })
      .join("");
    applyIzinUi();
    if (peran === "guru") {
      if ($("tugasFilterMapel")) $("tugasFilterMapel").value = SCOPE_GURU.mapel;
      if ($("rekapFilterMapel")) $("rekapFilterMapel").value = SCOPE_GURU.mapel;
      if ($("rekapFilterKelas")) $("rekapFilterKelas").value = "";
      if ($("hadirKelas")) $("hadirKelas").value = SCOPE_GURU.waliKelas;
      if ($("perkKelas")) $("perkKelas").value = SCOPE_GURU.waliKelas;
      if ($("perkMapel")) $("perkMapel").value = SCOPE_GURU.mapel;
    } else {
      if ($("tugasFilterMapel")) $("tugasFilterMapel").value = "";
      if ($("rekapFilterMapel")) $("rekapFilterMapel").value = "";
      if ($("hadirKelas")) $("hadirKelas").value = "";
    }
    if ($("tugasFilterKelas")) {
      renderDashboard();
      renderTugas();
      renderPengumpulanKpi();
      renderPengumpulan();
      renderKuis();
      renderHasilOtomatis();
      renderManual();
      renderRekap();
      renderAnalisis();
    }
    document.querySelectorAll(".scope-note").forEach(function (n) {
      n.remove();
    });
    var noteHost = document.querySelector("#page-dashboard .page-header div");
    if (noteHost && peran === "guru") {
      var note = document.createElement("p");
      note.className = "scope-note";
      note.textContent =
        "Cakupan demo: Guru Matematika · Wali kelas " +
        SCOPE_GURU.waliKelas +
        ". Menu dan aksi menyesuaikan kewenangan role.";
      noteHost.appendChild(note);
    } else if (noteHost && peran === "kepsek") {
      var note2 = document.createElement("p");
      note2.className = "scope-note";
      note2.textContent = "Akses pemantauan: tombol ubah nilai dan catat absensi disembunyikan pada Mode Demo.";
      noteHost.appendChild(note2);
    } else if (noteHost && peran === "admin") {
      var note3 = document.createElement("p");
      note3.className = "scope-note";
      note3.textContent = "Admin mengelola data dan jadwal. Perubahan nilai memakai alur koreksi yang ditinjau guru mapel.";
      noteHost.appendChild(note3);
    }
    var page = location.hash.slice(1);
    if (!PAGES[page] || ROLE[peran].pages.indexOf(page) < 0) page = ROLE[peran].home;
    showPage(page);
    if (!opts.silent) {
      showToast("Mode Demo: role diganti ke " + profil.peran + ". Ini simulasi akses, bukan login sungguhan.");
    }
  }

  function showPage(page) {
    if (!PAGES[page] || ROLE[peranAktif].pages.indexOf(page) < 0) page = ROLE[peranAktif].home;
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
    if (window.Modul1) Modul1.onShow(page);
    if (window.Modul3) Modul3.onShow(page);
    var sub = document.getElementById("donutSub");
    if (sub && D.pengumpulanRingkas) {
      var pg = D.pengumpulanRingkas;
      sub.textContent =
        pg.total + " pengumpulan pada data contoh: " + pg.terkumpul + " terkumpul, " + pg.terlambat + " terlambat, " + pg.belum + " belum.";
    }
    applyIzinUi();
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
      if (!$(id)) return;
      $(id).addEventListener("input", renderTugas);
      $(id).addEventListener("change", renderTugas);
    });
    ["kumpulFilterKelas", "kumpulFilterTugas", "kumpulFilterStatus"].forEach(function (id) {
      if ($(id)) $(id).addEventListener("change", renderPengumpulan);
    });
    ["rekapFilterKelas", "rekapFilterMapel", "rekapSearch"].forEach(function (id) {
      if (!$(id)) return;
      $(id).addEventListener("input", renderRekap);
      $(id).addEventListener("change", renderRekap);
    });
    if ($("rekapFilterSemester")) {
      $("rekapFilterSemester").addEventListener("change", function () {
        renderRekap();
        showToast("Mode demonstrasi: aksi ini hanya simulasi.");
      });
    }

    document.querySelectorAll(".seg-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        switchTab(btn.dataset.tab);
      });
    });

    document.body.addEventListener("click", function (e) {
      const buka = e.target.closest("[data-buka]");
      if (buka && PAGES[buka.dataset.buka]) {
        showPage(buka.dataset.buka);
        return;
      }
      const ganti = e.target.closest("[data-ganti-peran]");
      if (ganti) {
        applyPeran(ganti.dataset.gantiPeran);
        closeMenus();
        return;
      }
      const demo = e.target.closest(".js-demo");
      if (demo) {
        e.preventDefault();
        demoToast();
        return;
      }
      const blocked = e.target.closest("[data-izin].izin-disabled, [data-izin][disabled]");
      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
        showToast("Mode Demo: aksi ini tidak tersedia untuk role " + $("profilPeran").textContent + ".");
        return;
      }
      const aksi = e.target.closest("[data-aksi]");
      if (!aksi) return;
      const type = aksi.dataset.aksi;
      const id = aksi.dataset.id;
      if (type === "detail-siswa" && window.Modul3) {
        Modul3.pilih(id);
        showPage("detail-siswa");
      }
      if (type === "detail-tugas") openDetailTugas(id);
      if (type === "detail-kumpul") openDetailKumpul(id);
      if (type === "terima") {
        if (!boleh("terima-kumpul")) {
          showToast("Mode Demo: penerimaan pengumpulan hanya untuk guru mapel.");
          return;
        }
        tandaiDiterima(id);
      }
      if (type === "lihat-hasil") {
        renderHasilOtomatis();
        showToast("Menampilkan contoh hasil penilaian otomatis.");
      }
      if (type === "isi-nilai") {
        if (modeIzin("isi-nilai") === "koreksi") {
          showToast("Mode Demo: admin mengajukan koreksi nilai. Perubahan harus ditinjau guru mapel. Data tidak disimpan.");
          return;
        }
        if (!boleh("isi-nilai")) {
          showToast("Mode Demo: mengubah nilai tidak tersedia untuk role ini.");
          return;
        }
        const item = D.penilaianManual.find(function (x) {
          return x.id === id;
        });
        fillManualForm(item);
        switchTab("manual");
      }
    });

    if ($("formBuatTugas")) $("formBuatTugas").addEventListener("submit", function (e) {
      e.preventDefault();
      if (!boleh("buat-tugas")) {
        showToast("Mode Demo: membuat tugas hanya untuk guru mapel.");
        return;
      }
      bootstrap.Modal.getInstance($("modalBuatTugas")).hide();
      $("formBuatTugas").reset();
      showToast("Mode demonstrasi: data tidak disimpan.");
    });

    if ($("formManual")) $("formManual").addEventListener("submit", function (e) {
      e.preventDefault();
      if (modeIzin("simpan-nilai") === "koreksi") {
        showToast("Mode Demo: koreksi nilai admin dicatat untuk ditinjau. Data tidak disimpan permanen.");
        return;
      }
      if (!boleh("simpan-nilai")) {
        showToast("Mode Demo: menyimpan nilai tidak tersedia untuk role ini.");
        return;
      }
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
    if ($("modalDetailTugas")) modalTugas = new bootstrap.Modal($("modalDetailTugas"));
    if ($("modalDetailKumpul")) modalKumpul = new bootstrap.Modal($("modalDetailKumpul"));
    if ($("tugasFilterKelas")) {
      fillStaticSelects();
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
    }
    bindEvents();
    closeMenus();
    var saved = "guru";
    try {
      saved = localStorage.getItem("ta_demo_peran") || "guru";
    } catch (e) {}
    if (!ROLE[saved]) saved = "guru";
    applyPeran(saved, { silent: true });
  }

  window.UI = {
    $: $,
    fmt: fmt,
    showToast: showToast,
    pill: pill,
    emptyRow: emptyRow,
    fillSelect: fillSelect,
    trenHtml: trenHtml,
    statusKumpulPill: statusKumpulPill,
    showPage: showPage,
    applyPeran: applyPeran,
    boleh: boleh,
    modeIzin: modeIzin,
    getPeran: function () {
      return peranAktif;
    },
    scopeGuru: SCOPE_GURU,
  };

  document.addEventListener("DOMContentLoaded", init);
})();
