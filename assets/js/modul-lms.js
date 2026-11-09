/* Modul LMS — materi, kuis, progress, pengumuman, kalender */
(function () {
  var D;
  var STORE = "ta_lms_state_v1";
  var quizTimer = null;
  var quizState = null;
  var calMonth = new Date(2026, 9, 1); /* Okt 2026 */

  function ui() {
    return window.UI;
  }

  function peran() {
    return ui().getPeran ? ui().getPeran() : "guru";
  }

  function siswaDemo() {
    return D.peranContoh.siswa;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORE);
      if (!raw) return;
      var st = JSON.parse(raw);
      if (st.materi) D.lms.materi = st.materi;
      if (st.kuis) D.lms.kuis = st.kuis;
      if (st.upayaKuis) D.lms.upayaKuis = st.upayaKuis;
      if (st.pengumuman) D.lms.pengumuman = st.pengumuman;
      if (D.lms.refreshProgress) D.lms.refreshProgress();
    } catch (e) {}
  }

  function saveState() {
    try {
      localStorage.setItem(
        STORE,
        JSON.stringify({
          materi: D.lms.materi,
          kuis: D.lms.kuis,
          upayaKuis: D.lms.upayaKuis,
          pengumuman: D.lms.pengumuman,
        })
      );
    } catch (e) {}
  }

  function bolehKelola() {
    return peran() === "guru" || peran() === "admin";
  }

  function isSiswa() {
    return peran() === "siswa";
  }

  function scopeKelas() {
    if (peran() === "siswa") return siswaDemo().kelas;
    if (peran() === "guru") return null;
    return null;
  }

  function tipeIcon(tipe) {
    if (tipe === "PDF") return "bi-file-earmark-pdf";
    if (tipe === "PPT") return "bi-file-earmark-slides";
    if (tipe === "Video") return "bi-camera-video";
    return "bi-file-earmark-text";
  }

  function statusPill(status) {
    if (status === "Published" || status === "Aktif" || status === "Selesai") return ui().pill("success", status);
    if (status === "Draft" || status === "Dijadwalkan") return ui().pill("muted", status);
    return ui().pill("info", status);
  }

  function kategoriPill(k) {
    if (k === "Ujian") return ui().pill("danger", k);
    if (k === "Tugas" || k === "Deadline") return ui().pill("warning", k);
    if (k === "Materi" || k === "Pembelajaran") return ui().pill("info", k);
    return ui().pill("muted", k);
  }

  /* ——— Dashboard LMS ——— */
  function renderDashboard() {
    var box = document.getElementById("lmsDashKpi");
    var info = document.getElementById("lmsDashInfo");
    var list = document.getElementById("lmsDashList");
    if (!box) return;

    var materiPub = D.lms.materi.filter(function (m) {
      return m.status === "Published";
    }).length;
    var kuisAktif = D.lms.kuis.filter(function (k) {
      return k.status === "Aktif";
    }).length;
    var peng = D.lms.pengumuman.length;

    if (isSiswa()) {
      var s = siswaDemo();
      var prog = D.lms.progressSiswa.filter(function (p) {
        return p.nis === s.nis;
      })[0];
      document.getElementById("lmsDashTitle").textContent = "Dashboard Pembelajaran";
      document.getElementById("lmsDashSub").textContent =
        "Halo, " + s.nama + " · kelas " + s.kelas + ". Akses materi, kuis, dan pantau progres belajar.";
      box.innerHTML = kpi([
        ["Materi tersedia", materiPub, "bi-journal-richtext", "teal", "kelas " + s.kelas],
        ["Kuis/ujian aktif", kuisAktif, "bi-ui-checks-grid", "amber", "siap dikerjakan"],
        ["Progres materi", (prog ? prog.persenMateri : 0) + "%", "bi-bar-chart", "navy", (prog ? prog.materiSelesai : 0) + "/" + (prog ? prog.totalMateri : 0)],
        ["Tugas belum", prog ? prog.tugasBelum : 0, "bi-journal-x", "rose", "perlu dikerjakan"],
      ]);
      if (info) {
        info.innerHTML =
          "<p class=\"panel-sub\">Pengumuman terbaru dan aktivitas kelas " + esc(s.kelas) + ".</p>";
      }
      var pengSiswa = D.lms.pengumuman.filter(function (p) {
        return p.kelas === s.kelas || p.kelas === "Semua";
      }).slice(0, 5);
      var headS = document.getElementById("lmsDashListHead");
      if (headS) headS.innerHTML = "<tr><th>Pengumuman</th><th>Kategori</th><th>Tanggal</th></tr>";
      list.innerHTML = pengSiswa
        .map(function (p) {
          return (
            "<tr><td class=\"name-cell\">" +
            esc(p.judul) +
            "</td><td>" +
            kategoriPill(p.kategori) +
            "</td><td>" +
            esc(p.tanggalLabel) +
            "</td></tr>"
          );
        })
        .join("");
    } else if (peran() === "kepsek") {
      document.getElementById("lmsDashTitle").textContent = "Monitoring LMS";
      document.getElementById("lmsDashSub").textContent =
        "Pantau aktivitas pembelajaran digital sekolah secara keseluruhan.";
      var rata =
        D.lms.progressSiswa.reduce(function (a, p) {
          return a + p.persenMateri;
        }, 0) / (D.lms.progressSiswa.length || 1);
      box.innerHTML = kpi([
        ["Materi published", materiPub, "bi-journal-richtext", "teal", "seluruh kelas"],
        ["Kuis aktif", kuisAktif, "bi-ui-checks-grid", "amber", "berlangsung"],
        ["Rata progres", Math.round(rata) + "%", "bi-graph-up", "navy", "penyelesaian materi"],
        ["Pengumuman", peng, "bi-megaphone", "blue", "kelas & umum"],
      ]);
      list.innerHTML = D.lms.progressSiswa
        .slice(0, 8)
        .map(function (p) {
          return (
            "<tr><td class=\"name-cell\">" +
            esc(p.nama) +
            "</td><td>" +
            esc(p.kelas) +
            "</td><td>" +
            p.persenMateri +
            "%</td><td>" +
            p.tugasSelesai +
            "/" +
            (p.tugasSelesai + p.tugasBelum) +
            "</td></tr>"
          );
        })
        .join("");
      var head = document.getElementById("lmsDashListHead");
      if (head) head.innerHTML = "<tr><th>Siswa</th><th>Kelas</th><th>Progres</th><th>Tugas</th></tr>";
    } else {
      document.getElementById("lmsDashTitle").textContent = "Dashboard LMS";
      document.getElementById("lmsDashSub").textContent =
        peran() === "guru"
          ? "Kelola materi, kuis, dan pengumuman untuk kelas yang Anda ampu."
          : "Ringkasan konfigurasi dan aktivitas Learning Management System.";
      box.innerHTML = kpi([
        ["Total materi", D.lms.materi.length, "bi-journal-richtext", "teal", materiPub + " published"],
        ["Kuis & ujian", D.lms.kuis.length, "bi-ui-checks-grid", "amber", kuisAktif + " aktif"],
        ["Upaya siswa", D.lms.upayaKuis.length, "bi-people", "navy", "pengerjaan tersimpan"],
        ["Pengumuman", peng, "bi-megaphone", "blue", "semua kelas"],
      ]);
      list.innerHTML = D.lms.materi
        .slice(0, 6)
        .map(function (m) {
          return (
            "<tr><td class=\"name-cell\">" +
            esc(m.judul) +
            "</td><td>" +
            esc(m.kelas) +
            "</td><td>" +
            esc(m.tipe) +
            "</td><td>" +
            statusPill(m.status) +
            "</td></tr>"
          );
        })
        .join("");
      var head2 = document.getElementById("lmsDashListHead");
      if (head2) head2.innerHTML = "<tr><th>Materi</th><th>Kelas</th><th>Tipe</th><th>Status</th></tr>";
    }
  }

  function kpi(items) {
    return items
      .map(function (it) {
        return (
          '<div class="kpi-card"><div class="kpi-icon ' +
          it[3] +
          '"><i class="bi ' +
          it[2] +
          '"></i></div><div><div class="kpi-label">' +
          it[0] +
          '</div><div class="kpi-value">' +
          it[1] +
          '</div><div class="kpi-hint">' +
          it[4] +
          "</div></div></div>"
        );
      })
      .join("");
  }

  /* ——— Materi ——— */
  function filteredMateri() {
    var kelas = (document.getElementById("lmsMateriKelas") || {}).value || "";
    var mapel = (document.getElementById("lmsMateriMapel") || {}).value || "";
    var tipe = (document.getElementById("lmsMateriTipe") || {}).value || "";
    var q = ((document.getElementById("lmsMateriCari") || {}).value || "").trim().toLowerCase();
    if (isSiswa()) kelas = siswaDemo().kelas;

    return D.lms.materi.filter(function (m) {
      if (isSiswa() && m.status !== "Published") return false;
      if (peran() === "guru" && m.guru !== D.peranContoh.guru.nama && m.mapel !== D.peranContoh.guru.mapel) {
        /* guru lihat mapel yang diampu + miliknya */
        if (m.mapel !== D.peranContoh.guru.mapel) return false;
      }
      if (kelas && m.kelas !== kelas) return false;
      if (mapel && m.mapel !== mapel) return false;
      if (tipe && m.tipe !== tipe) return false;
      if (q && m.judul.toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  }

  function renderMateri() {
    var rows = filteredMateri();
    var body = document.getElementById("lmsMateriBody");
    if (!body) return;
    var kelola = bolehKelola();
    body.innerHTML = rows.length
      ? rows
          .map(function (m) {
            var aksi = isSiswa()
              ? '<button class="btn btn-sm btn-primary" type="button" data-lms-buka-materi="' +
                esc(m.id) +
                '">Buka</button>'
              : kelola
                ? '<button class="btn btn-sm btn-outline-secondary" type="button" data-lms-buka-materi="' +
                  esc(m.id) +
                  '">Detail</button> <button class="btn btn-sm btn-outline-secondary" type="button" data-lms-toggle-materi="' +
                  esc(m.id) +
                  '">' +
                  (m.status === "Published" ? "Unpublish" : "Publish") +
                  "</button>"
                : '<button class="btn btn-sm btn-outline-secondary" type="button" data-lms-buka-materi="' +
                  esc(m.id) +
                  '">Detail</button>';
            return (
              "<tr><td><div class=\"slot-mapel\"><i class=\"bi " +
              tipeIcon(m.tipe) +
              "\"></i> " +
              esc(m.judul) +
              '</div><div class="slot-meta">' +
              esc(m.file) +
              " · " +
              esc(m.ukuran) +
              "</div></td><td>" +
              esc(m.mapel) +
              "</td><td>" +
              esc(m.kelas) +
              "</td><td>" +
              esc(m.tipe) +
              "</td><td>" +
              statusPill(m.status) +
              "</td><td>" +
              esc(m.tanggalLabel) +
              "</td><td>" +
              aksi +
              "</td></tr>"
            );
          })
          .join("")
      : ui().emptyRow(7, "Tidak ada materi pada filter ini.");
    var foot = document.getElementById("lmsMateriFoot");
    if (foot) foot.textContent = rows.length + " materi ditampilkan.";
    var btnUp = document.getElementById("btnLmsUploadMateri");
    if (btnUp) btnUp.hidden = !kelola;
  }

  function bukaMateri(id) {
    var m = D.lms.materi.filter(function (x) {
      return x.id === id;
    })[0];
    if (!m) return;
    if (isSiswa()) {
      var nis = siswaDemo().nis;
      m.views = m.views || [];
      if (m.views.indexOf(nis) < 0) {
        m.views.push(nis);
        if (D.lms.refreshProgress) D.lms.refreshProgress();
        saveState();
      }
    }
    document.getElementById("lmsMateriDetailBody").innerHTML = [
      ["Judul", m.judul],
      ["Mapel / Kelas", m.mapel + " · " + m.kelas],
      ["Tipe berkas", m.tipe + " · " + m.file + " (" + m.ukuran + ")"],
      ["Status", m.status],
      ["Publikasi", m.tanggalLabel],
      ["Guru", m.guru],
      ["Deskripsi", m.deskripsi],
      ["Dilihat oleh", (m.views || []).length + " siswa"],
    ]
      .map(function (p) {
        return '<div class="detail-item"><div class="di-l">' + esc(p[0]) + '</div><div class="di-v">' + esc(p[1]) + "</div></div>";
      })
      .join("");
    bootstrap.Modal.getOrCreateInstance(document.getElementById("modalLmsMateriDetail")).show();
    if (isSiswa()) ui().showToast("Materi ditandai sebagai dibaca. Progres diperbarui.");
  }

  /* ——— Kuis ——— */
  function filteredKuis() {
    var kelas = (document.getElementById("lmsKuisKelas") || {}).value || "";
    var jenis = (document.getElementById("lmsKuisJenis") || {}).value || "";
    if (isSiswa()) kelas = siswaDemo().kelas;
    return D.lms.kuis.filter(function (k) {
      if (peran() === "guru" && k.mapel !== D.peranContoh.guru.mapel && k.guru !== D.peranContoh.guru.nama) {
        if (k.mapel !== D.peranContoh.guru.mapel) return false;
      }
      if (kelas && k.kelas !== kelas) return false;
      if (jenis && k.jenis !== jenis) return false;
      return true;
    });
  }

  function renderKuis() {
    var rows = filteredKuis();
    var body = document.getElementById("lmsKuisBody");
    if (!body) return;
    body.innerHTML = rows.length
      ? rows
          .map(function (k) {
            var upaya = null;
            if (isSiswa()) {
              upaya = D.lms.upayaKuis.filter(function (u) {
                return u.kuisId === k.id && u.nis === siswaDemo().nis;
              })[0];
            }
            var aksi = "";
            if (isSiswa()) {
              if (upaya) {
                aksi =
                  '<span class="pill pill-success">Nilai PG: ' +
                  (upaya.nilaiPg != null ? upaya.nilaiPg : "—") +
                  "</span>";
              } else if (k.status === "Aktif") {
                aksi =
                  '<button class="btn btn-sm btn-primary" type="button" data-lms-mulai-kuis="' +
                  esc(k.id) +
                  '">Kerjakan</button>';
              } else {
                aksi = ui().pill("muted", "Ditutup");
              }
            } else {
              aksi =
                '<button class="btn btn-sm btn-outline-secondary" type="button" data-lms-hasil-kuis="' +
                esc(k.id) +
                '">Hasil</button>';
            }
            return (
              "<tr><td class=\"name-cell\">" +
              esc(k.judul) +
              "</td><td>" +
              esc(k.mapel) +
              "</td><td>" +
              esc(k.kelas) +
              "</td><td>" +
              esc(k.jenis) +
              "</td><td>" +
              k.durasiMenit +
              " mnt</td><td>" +
              esc(k.batasWaktu) +
              "</td><td>" +
              statusPill(k.status) +
              "</td><td>" +
              aksi +
              "</td></tr>"
            );
          })
          .join("")
      : ui().emptyRow(8);
    var btn = document.getElementById("btnLmsBuatKuis");
    if (btn) btn.hidden = !bolehKelola() || peran() === "admin";
    if (peran() === "guru" && btn) btn.hidden = false;
  }

  function mulaiKuis(id) {
    if (!isSiswa()) return;
    var k = D.lms.kuis.filter(function (x) {
      return x.id === id;
    })[0];
    if (!k || k.status !== "Aktif") return;
    var exist = D.lms.upayaKuis.filter(function (u) {
      return u.kuisId === id && u.nis === siswaDemo().nis;
    })[0];
    if (exist) {
      ui().showToast("Anda sudah mengerjakan kuis ini.");
      return;
    }
    quizState = {
      kuisId: id,
      answers: {},
      sisaDetik: k.durasiMenit * 60,
      started: Date.now(),
    };
    ui().showPage("lms-kerjakan");
  }

  function renderKerjakan() {
    var wrap = document.getElementById("lmsKerjakanWrap");
    if (!wrap) return;
    if (!isSiswa() || !quizState) {
      wrap.innerHTML =
        '<div class="panel"><div class="panel-body"><p class="empty-hint">Tidak ada sesi pengerjaan. Buka menu Kuis &amp; Ujian lalu pilih <strong>Kerjakan</strong>.</p></div></div>';
      return;
    }
    var k = D.lms.kuis.filter(function (x) {
      return x.id === quizState.kuisId;
    })[0];
    if (!k) return;

    var soalHtml = k.soal
      .map(function (s, idx) {
        if (s.tipe === "pg") {
          return (
            '<div class="lms-soal panel" style="margin-bottom:12px"><div class="panel-body"><div class="kpi-label">Soal ' +
            (idx + 1) +
            " · Pilihan ganda</div><p class=\"name-cell\" style=\"margin:8px 0 12px\">" +
            esc(s.teks) +
            "</p>" +
            s.opsi
              .map(function (o, oi) {
                var checked = quizState.answers[s.id] === oi ? " checked" : "";
                return (
                  '<label class="lms-opsi"><input type="radio" name="' +
                  esc(s.id) +
                  '" value="' +
                  oi +
                  '"' +
                  checked +
                  " /> " +
                  esc(o) +
                  "</label>"
                );
              })
              .join("") +
            "</div></div>"
          );
        }
        return (
          '<div class="lms-soal panel" style="margin-bottom:12px"><div class="panel-body"><div class="kpi-label">Soal ' +
          (idx + 1) +
          ' · Esai</div><p class="name-cell" style="margin:8px 0 12px">' +
          esc(s.teks) +
          '</p><textarea class="form-control" rows="3" data-esai="' +
          esc(s.id) +
          '" placeholder="Tulis jawaban…">' +
          esc(quizState.answers[s.id] || "") +
          "</textarea><p class=\"slot-meta\" style=\"margin-top:6px\">Esai dinilai manual oleh guru (simulasi).</p></div></div>"
        );
      })
      .join("");

    wrap.innerHTML =
      '<div class="page-header"><div><h1>' +
      esc(k.judul) +
      "</h1><p>" +
      esc(k.mapel) +
      " · " +
      esc(k.kelas) +
      " · " +
      k.soal.length +
      ' soal</p></div><div class="lms-timer" id="lmsTimer">—</div></div>' +
      soalHtml +
      '<div style="display:flex;gap:8px;margin-top:8px"><button class="btn btn-primary" type="button" id="btnLmsKumpulKuis">Kumpulkan jawaban</button><button class="btn btn-outline-secondary" type="button" id="btnLmsBatalKuis">Batal</button></div>';

    updateTimerLabel();
    if (quizTimer) clearInterval(quizTimer);
    quizTimer = setInterval(function () {
      if (!quizState) return;
      quizState.sisaDetik -= 1;
      updateTimerLabel();
      if (quizState.sisaDetik <= 0) {
        clearInterval(quizTimer);
        quizTimer = null;
        kumpulkanKuis(true);
      }
    }, 1000);

    document.getElementById("btnLmsKumpulKuis").addEventListener("click", function () {
      kumpulkanKuis(false);
    });
    document.getElementById("btnLmsBatalKuis").addEventListener("click", function () {
      if (!confirm("Batalkan pengerjaan? Jawaban tidak disimpan.")) return;
      stopQuiz();
      ui().showPage("lms-kuis");
    });
    wrap.querySelectorAll('input[type="radio"]').forEach(function (inp) {
      inp.addEventListener("change", function () {
        quizState.answers[inp.name] = Number(inp.value);
      });
    });
    wrap.querySelectorAll("[data-esai]").forEach(function (ta) {
      ta.addEventListener("input", function () {
        quizState.answers[ta.getAttribute("data-esai")] = ta.value;
      });
    });
  }

  function updateTimerLabel() {
    var el = document.getElementById("lmsTimer");
    if (!el || !quizState) return;
    var s = Math.max(0, quizState.sisaDetik);
    var m = Math.floor(s / 60);
    var d = s % 60;
    el.textContent = (m < 10 ? "0" : "") + m + ":" + (d < 10 ? "0" : "") + d;
    el.classList.toggle("lms-timer-warn", s <= 60);
  }

  function stopQuiz() {
    if (quizTimer) clearInterval(quizTimer);
    quizTimer = null;
    quizState = null;
  }

  function kumpulkanKuis(otomatis) {
    if (!quizState) return;
    var k = D.lms.kuis.filter(function (x) {
      return x.id === quizState.kuisId;
    })[0];
    if (!k) return;
    var pg = k.soal.filter(function (s) {
      return s.tipe === "pg";
    });
    var benar = 0;
    pg.forEach(function (s) {
      if (quizState.answers[s.id] === s.kunci) benar += 1;
    });
    var nilaiPg = pg.length ? Math.round((benar / pg.length) * 100) : null;
    var s = siswaDemo();
    D.lms.upayaKuis.push({
      id: "uk-" + Date.now(),
      kuisId: k.id,
      nis: s.nis,
      nama: s.nama,
      kelas: s.kelas,
      nilaiPg: nilaiPg,
      nilaiEsai: null,
      nilaiAkhir: nilaiPg,
      status: "Selesai",
      dikerjakanPada: "2026-10-29 " + new Date().toTimeString().slice(0, 5),
      jawaban: Object.assign({}, quizState.answers),
    });
    if (D.lms.refreshProgress) D.lms.refreshProgress();
    saveState();
    stopQuiz();
    ui().showToast(
      (otomatis ? "Waktu habis. " : "") +
        "Kuis dikumpulkan. Penilaian otomatis PG: " +
        (nilaiPg != null ? nilaiPg : "—") +
        ". Esai menunggu guru."
    );
    ui().showPage("lms-kuis");
  }

  function showHasilKuis(id) {
    var rows = D.lms.upayaKuis.filter(function (u) {
      return u.kuisId === id;
    });
    var k = D.lms.kuis.filter(function (x) {
      return x.id === id;
    })[0];
    document.getElementById("lmsHasilKuisTitle").textContent = k ? k.judul : "Hasil kuis";
    document.getElementById("lmsHasilKuisBody").innerHTML = rows.length
      ? rows
          .map(function (u) {
            return (
              "<tr><td>" +
              esc(u.nama) +
              "</td><td>" +
              esc(u.nis) +
              "</td><td>" +
              (u.nilaiPg != null ? u.nilaiPg : "—") +
              "</td><td>" +
              (u.nilaiEsai != null ? u.nilaiEsai : "Belum") +
              "</td><td>" +
              (u.nilaiAkhir != null ? u.nilaiAkhir : "—") +
              "</td><td>" +
              esc(u.dikerjakanPada) +
              "</td></tr>"
            );
          })
          .join("")
      : ui().emptyRow(6, "Belum ada siswa yang mengerjakan.");
    bootstrap.Modal.getOrCreateInstance(document.getElementById("modalLmsHasilKuis")).show();
  }

  /* ——— Progress ——— */
  function renderProgress() {
    var list = D.lms.progressSiswa;
    if (isSiswa()) {
      list = list.filter(function (p) {
        return p.nis === siswaDemo().nis;
      });
    } else if (peran() === "guru") {
      list = list.filter(function (p) {
        return p.kelas === D.peranContoh.guru.waliKelas || p.kelas === "V-A";
      });
    }
    var kelasF = (document.getElementById("lmsProgressKelas") || {}).value || "";
    if (kelasF) list = list.filter(function (p) {
      return p.kelas === kelasF;
    });

    var kpiBox = document.getElementById("lmsProgressKpi");
    if (kpiBox && list[0]) {
      var p0 = list[0];
      if (isSiswa() || list.length === 1) {
        kpiBox.innerHTML = kpi([
          ["Progres materi", p0.persenMateri + "%", "bi-journal-check", "teal", p0.materiSelesai + "/" + p0.totalMateri],
          ["Tugas selesai", p0.tugasSelesai, "bi-check2-circle", "navy", "dikumpulkan"],
          ["Tugas belum", p0.tugasBelum, "bi-journal-x", "amber", "outstanding"],
          ["Riwayat kuis", p0.riwayatKuis.length, "bi-ui-checks", "blue", "percobaan"],
        ]);
      } else {
        var avg = Math.round(
          list.reduce(function (a, x) {
            return a + x.persenMateri;
          }, 0) / list.length
        );
        kpiBox.innerHTML = kpi([
          ["Siswa dipantau", list.length, "bi-people", "navy", "filter aktif"],
          ["Rata progres", avg + "%", "bi-bar-chart", "teal", "materi"],
          ["Total tugas belum", list.reduce(function (a, x) {
            return a + x.tugasBelum;
          }, 0), "bi-journal-x", "amber", "semua siswa"],
          ["Upaya kuis", D.lms.upayaKuis.length, "bi-ui-checks", "blue", "sekolah"],
        ]);
      }
    }

    var body = document.getElementById("lmsProgressBody");
    if (body) {
      body.innerHTML = list
        .map(function (p) {
          return (
            "<tr><td class=\"name-cell\">" +
            esc(p.nama) +
            "</td><td>" +
            esc(p.kelas) +
            "</td><td><div class=\"lms-progress-bar\"><span style=\"width:" +
            p.persenMateri +
            '%"></span></div> ' +
            p.persenMateri +
            "%</td><td>" +
            p.tugasSelesai +
            "</td><td>" +
            p.tugasBelum +
            "</td><td>" +
            (p.riwayatKuis.length
              ? p.riwayatKuis
                  .map(function (r) {
                    return esc(r.judul) + " (" + r.nilai + ")";
                  })
                  .join(", ")
              : "—") +
            "</td></tr>"
          );
        })
        .join("");
    }

    if (window.AppCharts && AppCharts.renderLmsProgress) {
      AppCharts.renderLmsProgress("chartLmsProgress", list[0] || null, D);
    }
  }

  /* ——— Pengumuman ——— */
  function renderPengumuman() {
    var kelas = (document.getElementById("lmsPengKelas") || {}).value || "";
    var kat = (document.getElementById("lmsPengKategori") || {}).value || "";
    if (isSiswa()) kelas = siswaDemo().kelas;
    var rows = D.lms.pengumuman.filter(function (p) {
      if (isSiswa()) return p.kelas === kelas || p.kelas === "Semua";
      if (kelas && p.kelas !== kelas && !(kelas === "Semua" && p.kelas === "Semua")) {
        if (p.kelas !== kelas) return false;
      }
      if (kat && p.kategori !== kat) return false;
      return true;
    });
    var body = document.getElementById("lmsPengBody");
    if (!body) return;
    body.innerHTML = rows
      .map(function (p) {
        return (
          '<div class="lms-announce panel"><div class="panel-body"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><div><div class="name-cell">' +
          esc(p.judul) +
          '</div><div class="slot-meta">' +
          esc(p.penulis) +
          " · " +
          esc(p.kelas) +
          " · " +
          esc(p.tanggalLabel) +
          "</div></div>" +
          kategoriPill(p.kategori) +
          '</div><p style="margin:10px 0 0;color:var(--text)">' +
          esc(p.isi) +
          "</p></div></div>"
        );
      })
      .join("") || '<p class="empty-hint">Belum ada pengumuman.</p>';
    var btn = document.getElementById("btnLmsBuatPeng");
    if (btn) btn.hidden = !(peran() === "guru" || peran() === "kepsek" || peran() === "admin");
  }

  /* ——— Kalender ——— */
  function renderKalender() {
    var title = document.getElementById("lmsCalTitle");
    var grid = document.getElementById("lmsCalGrid");
    var list = document.getElementById("lmsCalList");
    if (!grid) return;
    var y = calMonth.getFullYear();
    var m = calMonth.getMonth();
    var bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    if (title) title.textContent = bulan[m] + " " + y;

    var first = new Date(y, m, 1);
    var startDay = (first.getDay() + 6) % 7; /* Senin=0 */
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var events = D.lms.kalender.filter(function (e) {
      if (isSiswa() && e.kelas !== siswaDemo().kelas && e.kelas !== "Semua") return false;
      return e.tanggal.slice(0, 7) === y + "-" + String(m + 1).padStart(2, "0");
    });

    var html = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]
      .map(function (d) {
        return '<div class="lms-cal-dow">' + d + "</div>";
      })
      .join("");
    for (var i = 0; i < startDay; i++) html += '<div class="lms-cal-cell muted"></div>';
    for (var d = 1; d <= daysInMonth; d++) {
      var iso = y + "-" + String(m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
      var dayEv = events.filter(function (e) {
        return e.tanggal === iso;
      });
      var today = iso === D.hariIni ? " today" : "";
      html +=
        '<div class="lms-cal-cell' +
        today +
        '"><div class="lms-cal-num">' +
        d +
        "</div>" +
        dayEv
          .slice(0, 2)
          .map(function (e) {
            return '<div class="lms-cal-ev ' + esc(e.jenis.toLowerCase()) + '" title="' + esc(e.judul) + '">' + esc(e.jenis) + "</div>";
          })
          .join("") +
        (dayEv.length > 2 ? '<div class="slot-meta">+' + (dayEv.length - 2) + "</div>" : "") +
        "</div>";
    }
    grid.innerHTML = html;

    if (list) {
      var all = D.lms.kalender.filter(function (e) {
        if (isSiswa()) return e.kelas === siswaDemo().kelas;
        return true;
      });
      list.innerHTML = all
        .slice()
        .sort(function (a, b) {
          return a.tanggal < b.tanggal ? -1 : 1;
        })
        .map(function (e) {
          return (
            "<tr><td>" +
            esc(e.tanggal) +
            '</td><td class="name-cell">' +
            esc(e.judul) +
            "</td><td>" +
            kategoriPill(e.jenis) +
            "</td><td>" +
            esc(e.kelas) +
            "</td><td>" +
            esc(e.mapel) +
            "</td></tr>"
          );
        })
        .join("");
    }
  }

  /* ——— Laporan kepsek ——— */
  function renderLaporan() {
    var box = document.getElementById("lmsLaporanKpi");
    if (!box) return;
    var avg = Math.round(
      D.lms.progressSiswa.reduce(function (a, p) {
        return a + p.persenMateri;
      }, 0) / (D.lms.progressSiswa.length || 1)
    );
    box.innerHTML = kpi([
      ["Kelas aktif LMS", 3, "bi-building", "navy", "V-A, IV-B, VI-A"],
      ["Materi published", D.lms.materi.filter(function (m) {
        return m.status === "Published";
      }).length, "bi-journal-richtext", "teal", "konten digital"],
      ["Rata penyelesaian", avg + "%", "bi-graph-up-arrow", "amber", "materi siswa"],
      ["Kuis dikumpulkan", D.lms.upayaKuis.length, "bi-ui-checks-grid", "blue", "upaya"],
    ]);
    document.getElementById("lmsLaporanBody").innerHTML = D.lms.progressSiswa
      .map(function (p) {
        var status = p.persenMateri >= 70 ? ui().pill("success", "Baik") : p.persenMateri >= 40 ? ui().pill("warning", "Perlu dampingan") : ui().pill("danger", "Rendah");
        return (
          "<tr><td>" +
          esc(p.nama) +
          "</td><td>" +
          esc(p.kelas) +
          "</td><td>" +
          p.persenMateri +
          "%</td><td>" +
          p.tugasBelum +
          "</td><td>" +
          p.riwayatKuis.length +
          "</td><td>" +
          status +
          "</td></tr>"
        );
      })
      .join("");
  }

  function fillFilters() {
    ["lmsMateriKelas", "lmsKuisKelas", "lmsProgressKelas", "lmsPengKelas"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      ui().fillSelect(el, D.kelas, "Semua kelas");
      if (isSiswa()) {
        el.value = siswaDemo().kelas;
        el.disabled = true;
      } else {
        el.disabled = false;
      }
    });
    var mapelEl = document.getElementById("lmsMateriMapel");
    if (mapelEl) ui().fillSelect(mapelEl, D.mapel.concat(["IPS"]), "Semua mapel");
  }

  function applyRoleUi() {
    document.querySelectorAll("[data-izin-lms]").forEach(function (el) {
      var key = el.getAttribute("data-izin-lms");
      var ok = ui().boleh ? ui().boleh(key) : false;
      el.hidden = !ok;
      if (el.tagName === "BUTTON") el.disabled = !ok;
    });
  }

  function renderAll(page) {
    if (!D || !D.lms) return;
    fillFilters();
    applyRoleUi();
    if (!page || page === "lms-dashboard") renderDashboard();
    if (!page || page === "lms-materi") renderMateri();
    if (!page || page === "lms-kuis") renderKuis();
    if (!page || page === "lms-kerjakan") renderKerjakan();
    if (!page || page === "lms-progress") renderProgress();
    if (!page || page === "lms-pengumuman") renderPengumuman();
    if (!page || page === "lms-kalender") renderKalender();
    if (!page || page === "lms-laporan") renderLaporan();
  }

  function wire() {
    ["lmsMateriKelas", "lmsMateriMapel", "lmsMateriTipe", "lmsMateriCari"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("change", renderMateri);
      el.addEventListener("input", renderMateri);
    });
    ["lmsKuisKelas", "lmsKuisJenis"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener("change", renderKuis);
    });
    var pk = document.getElementById("lmsProgressKelas");
    if (pk) pk.addEventListener("change", renderProgress);
    ["lmsPengKelas", "lmsPengKategori"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener("change", renderPengumuman);
    });

    var prev = document.getElementById("lmsCalPrev");
    var next = document.getElementById("lmsCalNext");
    if (prev)
      prev.addEventListener("click", function () {
        calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1);
        renderKalender();
      });
    if (next)
      next.addEventListener("click", function () {
        calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1);
        renderKalender();
      });

    document.getElementById("formLmsMateri").addEventListener("submit", function (e) {
      e.preventDefault();
      if (!bolehKelola()) return;
      var judul = document.getElementById("lmJudul").value.trim();
      var file = document.getElementById("lmFile").files[0];
      var tipe = document.getElementById("lmTipe").value;
      if (!judul) return;
      var name = file ? file.name : "materi-baru." + (tipe === "PDF" ? "pdf" : tipe === "PPT" ? "pptx" : tipe === "Video" ? "mp4" : "docx");
      D.lms.materi.unshift({
        id: "m-" + Date.now(),
        judul: judul,
        mapel: document.getElementById("lmMapel").value,
        kelas: document.getElementById("lmKelas").value,
        tipe: tipe,
        file: name,
        ukuran: file ? Math.max(1, Math.round(file.size / 1024)) + " KB" : "—",
        status: document.getElementById("lmStatus").value,
        tanggal: D.hariIni,
        tanggalLabel: D.hariIniLabel,
        guru: D.peranContoh.guru.nama,
        deskripsi: document.getElementById("lmDeskripsi").value.trim() || "Materi unggahan simulasi.",
        views: [],
      });
      if (D.lms.refreshProgress) D.lms.refreshProgress();
      saveState();
      bootstrap.Modal.getInstance(document.getElementById("modalLmsMateri")).hide();
      e.target.reset();
      renderMateri();
      ui().showToast("Materi ditambahkan (simulasi upload — berkas tidak dikirim ke server).");
    });

    document.getElementById("formLmsKuis").addEventListener("submit", function (e) {
      e.preventDefault();
      if (peran() !== "guru" && peran() !== "admin") return;
      var judul = document.getElementById("lkJudul").value.trim();
      if (!judul) return;
      var pgTeks = document.getElementById("lkPgTeks").value.trim();
      var esaiTeks = document.getElementById("lkEsaiTeks").value.trim();
      var opsi = [
        document.getElementById("lkOpsi0").value.trim(),
        document.getElementById("lkOpsi1").value.trim(),
        document.getElementById("lkOpsi2").value.trim(),
        document.getElementById("lkOpsi3").value.trim(),
      ];
      var kunci = Number(document.getElementById("lkKunci").value) || 0;
      var soal = [];
      if (pgTeks) {
        soal.push({ id: "ns-pg", tipe: "pg", teks: pgTeks, opsi: opsi, kunci: kunci });
      }
      if (esaiTeks) {
        soal.push({ id: "ns-esai", tipe: "esai", teks: esaiTeks, kunci: null });
      }
      if (!soal.length) {
        ui().showToast("Isi minimal satu soal PG atau esai.");
        return;
      }
      D.lms.kuis.unshift({
        id: "k-" + Date.now(),
        judul: judul,
        mapel: document.getElementById("lkMapel").value,
        kelas: document.getElementById("lkKelas").value,
        jenis: document.getElementById("lkJenis").value,
        durasiMenit: Number(document.getElementById("lkDurasi").value) || 20,
        batasWaktu: document.getElementById("lkBatas").value || "2026-11-15 16:00",
        status: "Aktif",
        guru: D.peranContoh.guru.nama,
        soal: soal,
      });
      saveState();
      bootstrap.Modal.getInstance(document.getElementById("modalLmsKuis")).hide();
      e.target.reset();
      renderKuis();
      ui().showToast("Kuis/ujian dibuat dan siap dikerjakan siswa.");
    });

    document.getElementById("formLmsPeng").addEventListener("submit", function (e) {
      e.preventDefault();
      var judul = document.getElementById("lpJudul").value.trim();
      if (!judul) return;
      var penulis =
        peran() === "kepsek"
          ? D.peranContoh.kepsek.nama
          : peran() === "admin"
            ? D.peranContoh.admin.nama
            : D.peranContoh.guru.nama;
      D.lms.pengumuman.unshift({
        id: "p-" + Date.now(),
        judul: judul,
        isi: document.getElementById("lpIsi").value.trim() || "—",
        kelas: document.getElementById("lpKelas").value,
        kategori: document.getElementById("lpKategori").value,
        tanggal: D.hariIni,
        tanggalLabel: D.hariIniLabel,
        penulis: penulis,
      });
      saveState();
      bootstrap.Modal.getInstance(document.getElementById("modalLmsPeng")).hide();
      e.target.reset();
      renderPengumuman();
      ui().showToast("Pengumuman dipublikasikan ke kelas terkait.");
    });

    document.body.addEventListener("click", function (e) {
      var b = e.target.closest("[data-lms-buka-materi]");
      if (b) bukaMateri(b.getAttribute("data-lms-buka-materi"));
      var t = e.target.closest("[data-lms-toggle-materi]");
      if (t && bolehKelola()) {
        var m = D.lms.materi.filter(function (x) {
          return x.id === t.getAttribute("data-lms-toggle-materi");
        })[0];
        if (m) {
          m.status = m.status === "Published" ? "Draft" : "Published";
          if (D.lms.refreshProgress) D.lms.refreshProgress();
          saveState();
          renderMateri();
          ui().showToast("Status materi: " + m.status);
        }
      }
      var mk = e.target.closest("[data-lms-mulai-kuis]");
      if (mk) mulaiKuis(mk.getAttribute("data-lms-mulai-kuis"));
      var hk = e.target.closest("[data-lms-hasil-kuis]");
      if (hk) showHasilKuis(hk.getAttribute("data-lms-hasil-kuis"));
    });
  }

  function initModalsSelects() {
    ["lmKelas", "lkKelas", "lpKelas"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var extra = id === "lpKelas" ? '<option value="Semua">Semua kelas</option>' : "";
      el.innerHTML =
        extra +
        D.kelas
          .map(function (k) {
            return '<option value="' + k + '">' + k + "</option>";
          })
          .join("");
    });
    ["lmMapel", "lkMapel"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.innerHTML = D.mapel
        .map(function (m) {
          return '<option value="' + m + '">' + m + "</option>";
        })
        .join("");
      if (peran() === "guru") el.value = D.peranContoh.guru.mapel;
    });
  }

  function init() {
    D = window.APP_DATA;
    if (!D || !D.lms) return;
    loadState();
    initModalsSelects();
    wire();
  }

  function onShow(page) {
    if (!D || !D.lms) return;
    if (String(page).indexOf("lms") !== 0) return;
    initModalsSelects();
    renderAll(page);
  }

  function onRoleChange() {
    if (!D || !D.lms) return;
    stopQuiz();
    fillFilters();
    applyRoleUi();
  }

  document.addEventListener("DOMContentLoaded", init);
  window.ModulLms = { onShow: onShow, onRoleChange: onRoleChange, render: renderAll };
})();
