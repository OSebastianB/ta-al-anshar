/* Modul 1 — Absensi dan Jadwal */
(function () {
  var D;
  var modalCatat;
  var modalJadwal;

  function ui() {
    return window.UI;
  }

  function statusHadir(status) {
    if (status === "Hadir") return ui().pill("success", status);
    if (status === "Terlambat") return ui().pill("warning", status);
    if (status === "Izin") return ui().pill("info", status);
    if (status === "Sakit") return ui().pill("muted", status);
    return ui().pill("danger", status);
  }

  function peran() {
    return ui().getPeran ? ui().getPeran() : "guru";
  }

  function scopeKelasGuru() {
    return ui().scopeGuru ? ui().scopeGuru.waliKelas : "V-A";
  }

  function hariIniRows() {
    return D.kehadiran.filter(function (k) {
      if (k.tanggal !== D.hariIni) return false;
      if (peran() === "guru") return k.kelas === scopeKelasGuru();
      return true;
    });
  }

  function renderDashboard() {
    var rows = hariIniRows();
    var hadir = rows.filter(function (k) { return k.status === "Hadir"; }).length;
    var telat = rows.filter(function (k) { return k.status === "Terlambat"; }).length;
    var absen = rows.length - hadir - telat;
    var siswaHitung = peran() === "guru" ? D.siswa.filter(function (s) { return s.kelas === scopeKelasGuru(); }).length : D.siswa.length;
    var items = [
      [peran() === "kepsek" ? "Siswa terpantau" : "Siswa aktif", siswaHitung, "bi-people", "navy", peran() === "guru" ? "kelas wali " + scopeKelasGuru() : "data contoh"],
      ["Hadir hari ini", hadir, "bi-person-check", "teal", D.hariIniLabel],
      ["Terlambat", telat, "bi-clock", "amber", D.hariIniLabel],
      ["Tidak hadir", absen, "bi-person-x", "rose", "izin, sakit, alpa"],
    ];
    document.getElementById("absensiKpi").innerHTML = items
      .map(function (it) {
        return (
          '<div class="kpi-card"><div class="kpi-icon ' + it[3] + '"><i class="bi ' + it[2] +
          '"></i></div><div><div class="kpi-label">' + it[0] + '</div><div class="kpi-value">' + it[1] +
          '</div><div class="kpi-hint">' + it[4] + "</div></div></div>"
        );
      })
      .join("");

    var kelasList = peran() === "guru" ? [scopeKelasGuru()] : D.kelas;
    var byClass = {};
    kelasList.forEach(function (k) { byClass[k] = { Hadir: 0, Terlambat: 0, lain: 0 }; });
    rows.forEach(function (r) {
      if (!byClass[r.kelas]) byClass[r.kelas] = { Hadir: 0, Terlambat: 0, lain: 0 };
      if (r.status === "Hadir" || r.status === "Terlambat") byClass[r.kelas][r.status] += 1;
      else byClass[r.kelas].lain += 1;
    });
    document.getElementById("absensiKelasBody").innerHTML = kelasList
      .map(function (k) {
        var c = byClass[k];
        return "<tr><td class=\"name-cell\">" + k + "</td><td>" + c.Hadir + "</td><td>" + c.Terlambat + "</td><td>" + c.lain + "</td></tr>";
      })
      .join("");

    var cuplikan = rows.filter(function (r) {
      return peran() === "guru" ? true : r.kelas === "V-A" || r.status !== "Hadir";
    }).slice(0, 8);
    document.getElementById("absensiHariBody").innerHTML = cuplikan
      .map(function (r) {
        return (
          "<tr><td class=\"name-cell\">" + r.nama + "</td><td class=\"nis\">" + r.nis + "</td><td>" + r.kelas +
          "</td><td>" + r.tanggalLabel + "</td><td>" + r.waktu + "</td><td>" + statusHadir(r.status) +
          "</td><td>" + r.keterangan + "</td></tr>"
        );
      })
      .join("");
    document.getElementById("absensiHariFoot").textContent =
      "Cuplikan " + cuplikan.length + " dari " + rows.length + " catatan " + D.hariIniNama + ", " + D.hariIniLabel + ". KPI dihitung dari seluruh data contoh.";
  }

  function filteredHadir() {
    var tgl = document.getElementById("hadirTanggal").value;
    var kelas = document.getElementById("hadirKelas").value;
    var q = document.getElementById("hadirCari").value.trim().toLowerCase();
    return D.kehadiran.filter(function (k) {
      var scopeOk = peran() !== "guru" || k.kelas === scopeKelasGuru();
      return scopeOk && (!tgl || k.tanggal === tgl) && (!kelas || k.kelas === kelas) && (!q || k.nama.toLowerCase().indexOf(q) >= 0);
    });
  }

  function renderKehadiran() {
    var rows = filteredHadir();
    var hadir = rows.filter(function (k) { return k.status === "Hadir" || k.status === "Terlambat"; }).length;
    document.getElementById("hadirRekap").textContent =
      "Pada filter ini: " + hadir + " hadir/terlambat dan " + (rows.length - hadir) + " tidak hadir, dari " + rows.length + " catatan.";
    var tampil = rows.slice(0, 12);
    document.getElementById("hadirBody").innerHTML = tampil.length
      ? tampil
          .map(function (r) {
            return (
              "<tr><td class=\"name-cell\">" + r.nama + "</td><td class=\"nis\">" + r.nis + "</td><td>" + r.kelas +
              "</td><td>" + r.tanggalLabel + "</td><td>" + r.waktu + "</td><td>" + statusHadir(r.status) +
              "</td><td>" + r.keterangan + "</td><td><button class=\"btn btn-sm btn-outline-secondary\" type=\"button\" data-aksi=\"detail-hadir\" data-id=\"" +
              r.id + "\">Detail</button></td></tr>"
            );
          })
          .join("")
      : ui().emptyRow(8);
    document.getElementById("hadirFoot").textContent = "Menampilkan " + tampil.length + " dari " + rows.length + " catatan. Rekap dihitung otomatis dari pencatatan.";
  }

  function menit(t) {
    var p = String(t).split(".");
    return Number(p[0]) * 60 + Number(p[1] || 0);
  }

  function bentrok(item) {
    var a1 = menit(item.mulai);
    var a2 = menit(item.selesai);
    var masalah = [];
    D.jadwal.forEach(function (j) {
      if (j.hari !== item.hari) return;
      if (j.id === item.id) return;
      var b1 = menit(j.mulai);
      var b2 = menit(j.selesai);
      var timpa = a1 < b2 && b1 < a2;
      if (!timpa) return;
      if (j.kelas === item.kelas) masalah.push("Kelas " + j.kelas + " sudah ada " + j.mapel + " (" + j.mulai + "–" + j.selesai + ").");
      if (j.guru === item.guru) masalah.push(j.guru + " sudah mengajar " + j.kelas + " pada " + j.mulai + "–" + j.selesai + ".");
    });
    return masalah;
  }

  function renderJadwal() {
    var kelas = document.getElementById("jadwalKelas").value || "IV-A";
    var hari = document.getElementById("jadwalHari").value;
    var hariList = hari ? [hari] : D.hariKerja;
    var head = "<th>Waktu</th>" + hariList.map(function (h) { return "<th>" + h + "</th>"; }).join("");
    document.getElementById("jadwalHead").innerHTML = "<tr>" + head + "</tr>";
    document.getElementById("jadwalBody").innerHTML = D.jamSlot
      .map(function (jam) {
        var sel = "<tr><td class=\"name-cell\">" + jam[0] + "–" + jam[1] + "</td>";
        hariList.forEach(function (h) {
          var slot = D.jadwal.filter(function (j) {
            return j.kelas === kelas && j.hari === h && j.mulai === jam[0];
          })[0];
          sel += slot
            ? "<td><div class=\"slot-mapel\">" + slot.mapel + "</div><div class=\"slot-meta\">" + slot.guru + " · " + slot.ruang + "</div></td>"
            : "<td class=\"slot-kosong\">—</td>";
        });
        return sel + "</tr>";
      })
      .join("");
  }

  function renderRekapAbsensi() {
    var kelas = document.getElementById("rekapAbsenKelas").value;
    var dari = document.getElementById("rekapAbsenDari").value;
    var sampai = document.getElementById("rekapAbsenSampai").value;
    var rec = D.kehadiran.filter(function (k) {
      return (!kelas || k.kelas === kelas) && (!dari || k.tanggal >= dari) && (!sampai || k.tanggal <= sampai);
    });
    var count = { Hadir: 0, Terlambat: 0, Izin: 0, Sakit: 0, Alpa: 0 };
    rec.forEach(function (k) { count[k.status] += 1; });
    document.getElementById("rekapAbsenKpi").innerHTML = [
      ["Hadir", count.Hadir, "teal"],
      ["Terlambat", count.Terlambat, "amber"],
      ["Izin", count.Izin, "blue"],
      ["Sakit", count.Sakit, "navy"],
      ["Alpa", count.Alpa, "rose"],
    ]
      .map(function (it) {
        return '<div class="kpi-card"><div class="kpi-icon ' + it[2] + '"><i class="bi bi-check2-circle"></i></div><div><div class="kpi-label">' + it[0] + '</div><div class="kpi-value">' + it[1] + "</div></div></div>";
      })
      .join("");

    var daftar = D.siswa.filter(function (s) { return !kelas || s.kelas === kelas; });
    document.getElementById("rekapAbsenBody").innerHTML = daftar
      .map(function (s) {
        var mine = rec.filter(function (k) { return k.nis === s.nis; });
        var c = { Hadir: 0, Terlambat: 0, Izin: 0, Sakit: 0, Alpa: 0 };
        mine.forEach(function (k) { c[k.status] += 1; });
        var hadir = c.Hadir + c.Terlambat;
        var persen = mine.length ? Math.round((hadir / mine.length) * 1000) / 10 : 0;
        return (
          "<tr><td class=\"name-cell\">" + s.nama + "</td><td>" + s.kelas + "</td><td>" + c.Hadir + "</td><td>" + c.Terlambat +
          "</td><td>" + c.Izin + "</td><td>" + c.Sakit + "</td><td>" + c.Alpa + "</td><td>" + String(persen).replace(".", ",") + "%</td></tr>"
        );
      })
      .join("");
    document.getElementById("rekapAbsenFoot").textContent =
      "Dihitung dari " + rec.length + " catatan kehadiran" + (dari || sampai ? " pada rentang tanggal yang dipilih." : " sepanjang Oktober 2026 sampai " + D.hariIniLabel + ".");
  }

  function bukaDetailHadir(id) {
    var r = D.kehadiran.filter(function (k) { return k.id === id; })[0];
    if (!r) return;
    document.getElementById("detailHadirBody").innerHTML = [
      ["Nama", r.nama], ["NIS", r.nis], ["Kelas", r.kelas], ["Tanggal", r.tanggalLabel],
      ["Waktu", r.waktu], ["Status", r.status], ["Keterangan", r.keterangan],
    ]
      .map(function (p) {
        return '<div class="detail-item"><div class="di-l">' + p[0] + '</div><div class="di-v">' + p[1] + "</div></div>";
      })
      .join("");
    modalCatat.show();
  }

  function isiFormSiswa() {
    var kelas = document.getElementById("catatKelas").value;
    var sel = document.getElementById("catatSiswa");
    var list = D.siswa.filter(function (s) { return !kelas || s.kelas === kelas; });
    sel.innerHTML = list
      .map(function (s) { return '<option value="' + s.nis + '">' + s.nama + " · " + s.kelas + "</option>"; })
      .join("");
  }

  function init() {
    D = window.APP_DATA;
    ["hadirKelas", "rekapAbsenKelas"].forEach(function (id) {
      ui().fillSelect(document.getElementById(id), D.kelas, "Semua kelas");
    });
    ["jadwalKelas", "catatKelas", "fjKelas"].forEach(function (id) {
      var el = document.getElementById(id);
      el.innerHTML = D.kelas.map(function (k) {
        return '<option value="' + k + '">' + k + "</option>";
      }).join("");
    });
    document.getElementById("jadwalKelas").value = "IV-A";
    document.getElementById("fjKelas").value = "IV-A";
    document.getElementById("catatKelas").value = "V-A";
    ui().fillSelect(document.getElementById("jadwalHari"), D.hariKerja, "Semua hari");
    ["fjHari", "fjMapel"].forEach(function (id, i) {
      var items = i === 0 ? D.hariKerja : D.mapel;
      document.getElementById(id).innerHTML = items.map(function (v) {
        return '<option value="' + v + '">' + v + "</option>";
      }).join("");
    });
    document.getElementById("fjHari").value = "Senin";
    document.getElementById("fjMapel").value = D.mapel[0];
    document.getElementById("fjGuru").value = D.guruMap[D.mapel[0]];
    var tgl = document.getElementById("hadirTanggal");
    tgl.value = D.hariIni;
    document.getElementById("rekapAbsenDari").value = "2026-10-01";
    document.getElementById("rekapAbsenSampai").value = D.hariIni;
    document.getElementById("pegawaiTanggal").value = D.hariIni;
    var selPeg = document.getElementById("catatPegawaiNama");
    selPeg.innerHTML = D.pegawai.map(function (p) {
      return '<option value="' + p.id + '">' + p.nama + " · " + p.unit + "</option>";
    }).join("");
    isiFormSiswa();
    modalCatat = new bootstrap.Modal(document.getElementById("modalDetailHadir"));
    modalJadwal = new bootstrap.Modal(document.getElementById("modalJadwal"));

    ["hadirTanggal", "hadirKelas", "hadirCari"].forEach(function (id) {
      document.getElementById(id).addEventListener("input", renderKehadiran);
      document.getElementById(id).addEventListener("change", renderKehadiran);
    });
    document.getElementById("jadwalKelas").addEventListener("change", renderJadwal);
    document.getElementById("jadwalHari").addEventListener("change", renderJadwal);
    ["rekapAbsenKelas", "rekapAbsenDari", "rekapAbsenSampai"].forEach(function (id) {
      document.getElementById(id).addEventListener("change", function () {
        renderRekapAbsensi();
        if (window.AppCharts && document.getElementById("page-rekap-absensi").classList.contains("active")) {
          AppCharts.renderForPage("rekap-absensi", D);
        }
      });
    });
    document.getElementById("catatKelas").addEventListener("change", isiFormSiswa);
    document.getElementById("fjMapel").addEventListener("change", function () {
      document.getElementById("fjGuru").value = D.guruMap[document.getElementById("fjMapel").value] || "";
    });
    ["pegawaiTanggal", "pegawaiUnit"].forEach(function (id) {
      document.getElementById(id).addEventListener("change", renderPegawai);
    });
    document.getElementById("formCatatPegawai").addEventListener("submit", function (e) {
      e.preventDefault();
      var id = document.getElementById("catatPegawaiNama").value;
      var status = document.getElementById("catatPegawaiStatus").value;
      var ket = document.getElementById("catatPegawaiKet").value || "Dicatat administrator";
      var rec = D.kehadiranPegawai.filter(function (k) {
        return k.pegawaiId === id && k.tanggal === D.hariIni;
      })[0];
      if (rec) {
        rec.status = status;
        rec.keterangan = ket;
        rec.waktu = status === "Hadir" ? "06.40" : status === "Terlambat" ? "07.10" : "—";
      }
      bootstrap.Modal.getInstance(document.getElementById("modalCatatPegawai")).hide();
      renderPegawai();
      ui().showToast("Simulasi: kehadiran pegawai diperbarui di tampilan ini saja dan tidak disimpan permanen.");
    });
    document.getElementById("btnExportAbsen").addEventListener("click", function () {
      ui().showToast("Mode demonstrasi: laporan tidak diunduh. Data tidak disimpan permanen.");
    });
    document.getElementById("formCatat").addEventListener("submit", function (e) {
      e.preventDefault();
      if (ui().boleh && !ui().boleh("catat-hadir")) {
        ui().showToast("Mode Demo: pencatatan kehadiran tidak tersedia untuk role ini.");
        return;
      }
      var nis = document.getElementById("catatSiswa").value;
      var status = document.getElementById("catatStatus").value;
      var ket = document.getElementById("catatKet").value || "Dicatat guru";
      var rec = D.kehadiran.filter(function (k) { return k.nis === nis && k.tanggal === D.hariIni; })[0];
      if (rec) {
        rec.status = status;
        rec.keterangan = ket;
        rec.waktu = status === "Hadir" ? "07.00" : status === "Terlambat" ? "07.20" : "—";
      }
      bootstrap.Modal.getInstance(document.getElementById("modalCatatHadir")).hide();
      renderDashboard();
      renderKehadiran();
      ui().showToast("Simulasi: kehadiran diperbarui di tampilan ini saja dan tidak disimpan permanen.");
    });
    document.getElementById("formJadwal").addEventListener("submit", function (e) {
      e.preventDefault();
      if (ui().boleh && !ui().boleh("tambah-jadwal")) {
        ui().showToast("Mode Demo: menambah jadwal hanya untuk admin sekolah.");
        return;
      }
      var item = {
        id: "j-baru-" + Date.now(),
        kelas: document.getElementById("fjKelas").value,
        hari: document.getElementById("fjHari").value,
        mulai: document.getElementById("fjMulai").value,
        selesai: document.getElementById("fjSelesai").value,
        mapel: document.getElementById("fjMapel").value,
        guru: document.getElementById("fjGuru").value.trim(),
        ruang: document.getElementById("fjRuang").value.trim() || "R. " + document.getElementById("fjKelas").value,
      };
      var err = document.getElementById("jadwalError");
      if (menit(item.mulai) >= menit(item.selesai)) {
        err.hidden = false;
        err.textContent = "Jam selesai harus lebih akhir daripada jam mulai.";
        return;
      }
      var masalah = bentrok(item);
      if (masalah.length) {
        err.hidden = false;
        err.textContent = "Jadwal bentrok. " + masalah[0];
        return;
      }
      err.hidden = true;
      D.jadwal.push(item);
      modalJadwal.hide();
      renderJadwal();
      ui().showToast("Simulasi: jadwal hanya ditambahkan di sesi ini dan tidak disimpan permanen.");
    });
    document.body.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-aksi='detail-hadir']");
      if (btn) bukaDetailHadir(btn.dataset.id);
    });
    onShow((location.hash || "#dashboard").slice(1));
  }

  function hitungStatus(rows) {
    var st = { Hadir: 0, Terlambat: 0, Izin: 0, Sakit: 0, Alpa: 0 };
    rows.forEach(function (r) {
      if (st[r.status] !== undefined) st[r.status] += 1;
    });
    return st;
  }

  function renderPegawai() {
    var tgl = document.getElementById("pegawaiTanggal").value || D.hariIni;
    var unit = document.getElementById("pegawaiUnit").value;
    var rows = D.kehadiranPegawai.filter(function (k) {
      return k.tanggal === tgl && (!unit || k.unit === unit);
    });
    var st = hitungStatus(rows);
    var tidak = rows.length - st.Hadir - st.Terlambat;
    var items = [
      ["Pegawai", rows.length, "bi-person-badge", "navy", unit || "semua unit"],
      ["Hadir", st.Hadir, "bi-person-check", "teal", tgl],
      ["Terlambat", st.Terlambat, "bi-clock", "amber", tgl],
      ["Tidak hadir", tidak, "bi-person-x", "rose", "izin, sakit, alpa"],
    ];
    document.getElementById("pegawaiKpi").innerHTML = items
      .map(function (it) {
        return (
          '<div class="kpi-card"><div class="kpi-icon ' + it[3] + '"><i class="bi ' + it[2] +
          '"></i></div><div><div class="kpi-label">' + it[0] + '</div><div class="kpi-value">' + it[1] +
          '</div><div class="kpi-hint">' + it[4] + "</div></div></div>"
        );
      })
      .join("");
    document.getElementById("pegawaiBody").innerHTML = rows.length
      ? rows.map(function (k) {
          return "<tr><td>" + k.nama + "</td><td>" + k.nip + "</td><td>" + k.unit + "</td><td>" + k.tanggalLabel +
            "</td><td>" + k.waktu + "</td><td>" + statusHadir(k.status) + "</td><td>" + k.keterangan + "</td></tr>";
        }).join("")
      : ui().emptyRow(7, "Tidak ada catatan pada tanggal ini.");
    document.getElementById("pegawaiFoot").textContent = rows.length + " pegawai";
  }

  function renderPortal() {
    var nis = D.orangTua.anakNis[0];
    var anak = D.siswa.filter(function (s) { return s.nis === nis; })[0];
    var rec = D.kehadiran.filter(function (k) { return k.nis === nis; }).slice().sort(function (a, b) {
      return a.tanggal < b.tanggal ? 1 : -1;
    });
    var st = hitungStatus(rec);
    var hadir = st.Hadir + st.Terlambat;
    var persen = rec.length ? Math.round((hadir / rec.length) * 1000) / 10 : 0;
    var hari = rec.filter(function (k) { return k.tanggal === D.hariIni; })[0];
    document.getElementById("portalSub").textContent =
      D.orangTua.hubungan + " dari " + anak.nama + " · kelas " + anak.kelas + " · NIS " + anak.nis + ". Hanya baca.";
    var items = [
      ["Kehadiran", persen + "%", "bi-percent", "teal", hadir + " dari " + rec.length + " hari"],
      ["Hari ini", hari ? hari.status : "—", "bi-calendar-check", hari && hari.status === "Hadir" ? "teal" : "amber", hari ? hari.waktu : ""],
      ["Terlambat", st.Terlambat, "bi-clock", "amber", "Oktober 2026"],
      ["Alpa", st.Alpa, "bi-person-x", "rose", "tanpa keterangan"],
    ];
    document.getElementById("portalKpi").innerHTML = items
      .map(function (it) {
        return (
          '<div class="kpi-card"><div class="kpi-icon ' + it[3] + '"><i class="bi ' + it[2] +
          '"></i></div><div><div class="kpi-label">' + it[0] + '</div><div class="kpi-value">' + it[1] +
          '</div><div class="kpi-hint">' + it[4] + "</div></div></div>"
        );
      })
      .join("");
    document.getElementById("portalBody").innerHTML = rec.map(function (k) {
      return "<tr><td>" + k.tanggalLabel + "</td><td>" + k.waktu + "</td><td>" + statusHadir(k.status) + "</td><td>" + k.keterangan + "</td></tr>";
    }).join("");
  }

  function onShow(page) {
    if (!D) return;
    if (page === "absensi") renderDashboard();
    if (page === "kehadiran") renderKehadiran();
    if (page === "pegawai") renderPegawai();
    if (page === "jadwal") renderJadwal();
    if (page === "rekap-absensi") renderRekapAbsensi();
    if (page === "portal") renderPortal();
  }

  document.addEventListener("DOMContentLoaded", init);
  window.Modul1 = { onShow: onShow };
})();
