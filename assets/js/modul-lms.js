/* Modul LMS — materi, progress, pengumuman, kalender */
(function () {
  var D;
  var STORE = "ta_lms_state_v1";
  var quizTimer = null;
  var calMonth = new Date(2026, 9, 1); /* Okt 2026 */

  function ui() {
    return window.UI;
  }

  function peran() {
    return ui().getPeran ? ui().getPeran() : "guru";
  }

  function siswaDemo() {
    return { inisial: "", nama: "", peran: "", nis: "", kelas: "" };
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
    return false;
  }

  function scopeKelas() {
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
    var materiDraft = D.lms.materi.length - materiPub;
    var kalenderN = D.lms.kalender.length;
    var rataProgres = Math.round(
      D.lms.progressSiswa.reduce(function (a, p) {
        return a + p.persenMateri;
      }, 0) / (D.lms.progressSiswa.length || 1)
    );
    var peng = D.lms.pengumuman.length;

    if (isSiswa()) {
      var s = siswaDemo();
      var prog = D.lms.progressSiswa.filter(function (p) {
        return p.nis === s.nis;
      })[0];
      document.getElementById("lmsDashTitle").textContent = "Dashboard Pembelajaran";
      document.getElementById("lmsDashSub").textContent =
        "Halo, " + s.nama + " · kelas " + s.kelas + ". Akses materi dan pantau progres belajar.";
      box.innerHTML = kpi([
        ["Materi tersedia", materiPub, "bi-journal-richtext", "teal", "kelas " + s.kelas],
        ["Pengumuman", peng, "bi-megaphone", "amber", "kelas & umum"],
        ["Progres materi", (prog ? prog.persenMateri : 0) + "%", "bi-bar-chart", "navy", (prog ? prog.materiSelesai : 0) + "/" + (prog ? prog.totalMateri : 0)],
        ["Agenda kalender", kalenderN, "bi-calendar3", "rose", "kegiatan akademik"],
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
        ["Agenda kalender", kalenderN, "bi-calendar3", "amber", "kegiatan akademik"],
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
            p.materiSelesai +
            "/" +
            p.totalMateri +
            "</td></tr>"
          );
        })
        .join("");
      var head = document.getElementById("lmsDashListHead");
      if (head) head.innerHTML = "<tr><th>Siswa</th><th>Kelas</th><th>Progres</th><th>Materi selesai</th></tr>";
    } else {
      document.getElementById("lmsDashTitle").textContent = "Dashboard LMS";
      document.getElementById("lmsDashSub").textContent =
        peran() === "guru"
          ? "Kelola materi dan pengumuman untuk kelas yang Anda ampu."
          : "Ringkasan konfigurasi dan aktivitas Learning Management System.";
      box.innerHTML = kpi([
        ["Total materi", D.lms.materi.length, "bi-journal-richtext", "teal", materiPub + " published"],
        ["Materi draft", materiDraft, "bi-pencil-square", "amber", "belum dipublikasikan"],
        ["Rata progres", rataProgres + "%", "bi-graph-up", "navy", "penyelesaian materi"],
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
          ["Materi selesai", p0.materiSelesai, "bi-check2-circle", "navy", "dibaca"],
          ["Materi belum", p0.totalMateri - p0.materiSelesai, "bi-journal-x", "amber", "belum dibuka"],
          ["Total materi", p0.totalMateri, "bi-journal-richtext", "blue", "kelas " + p0.kelas],
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
          ["Materi selesai", list.reduce(function (a, x) {
            return a + x.materiSelesai;
          }, 0), "bi-check2-circle", "amber", "semua siswa"],
          ["Pengumuman", D.lms.pengumuman.length, "bi-megaphone", "blue", "kelas & umum"],
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
            p.materiSelesai +
            "/" +
            p.totalMateri +
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
      ["Pengumuman", D.lms.pengumuman.length, "bi-megaphone", "blue", "kelas & umum"],
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
          p.materiSelesai +
          "/" +
          p.totalMateri +
          "</td><td>" +
          status +
          "</td></tr>"
        );
      })
      .join("");
  }

  function fillFilters() {
    ["lmsMateriKelas", "lmsProgressKelas", "lmsPengKelas"].forEach(function (id) {
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
    });
  }

  function initModalsSelects() {
    ["lmKelas", "lpKelas"].forEach(function (id) {
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
    ["lmMapel"].forEach(function (id) {
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
    fillFilters();
    applyRoleUi();
  }

  document.addEventListener("DOMContentLoaded", init);
  window.ModulLms = { onShow: onShow, onRoleChange: onRoleChange, render: renderAll };
})();
