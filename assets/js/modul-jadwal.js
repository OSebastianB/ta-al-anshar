/* Modul Penjadwalan Pembelajaran Otomatis (CSP) — UI + persistensi */
(function () {
  var D;
  var STORE_CFG = "ta_penjadwalan_config";
  var STORE_JADWAL = "ta_jadwal_csp";
  var tabAktif = "hasil";
  var modalEdit;
  var modalMapel;
  var modalGuruAvail;
  var editTargetId = null;
  var seedJadwal = null;

  function ui() {
    return window.UI;
  }

  function peran() {
    return ui().getPeran ? ui().getPeran() : "guru";
  }

  function isAdmin() {
    return peran() === "admin";
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function cfg() {
    return D.penjadwalan;
  }

  function teachingSlots() {
    return (cfg().waktu.slots || []).filter(function (s) {
      return s.jenis === "pelajaran";
    });
  }

  function syncJamSlot() {
    D.jamSlot = teachingSlots().map(function (s) {
      return [s.mulai, s.selesai];
    });
    D.hariKerja = (cfg().waktu.hari || []).slice();
  }

  function loadPersisted() {
    try {
      var rawCfg = localStorage.getItem(STORE_CFG);
      if (rawCfg) {
        var parsed = JSON.parse(rawCfg);
        if (parsed && parsed.mapel && parsed.guru && parsed.waktu && parsed.alokasi) {
          D.penjadwalan = parsed;
        }
      }
      var rawJ = localStorage.getItem(STORE_JADWAL);
      if (rawJ) {
        var pj = JSON.parse(rawJ);
        if (pj && Array.isArray(pj.jadwal)) {
          D.jadwal = pj.jadwal;
          D.penjadwalan.meta = D.penjadwalan.meta || {};
          D.penjadwalan.meta.status = pj.status || "Berhasil Digenerate";
          D.penjadwalan.meta.lastResult = pj.lastResult || null;
        }
      }
    } catch (e) {
      /* abaikan corrupt storage */
    }
    syncJamSlot();
  }

  function saveConfig() {
    try {
      localStorage.setItem(STORE_CFG, JSON.stringify(cfg()));
    } catch (e) {}
  }

  function saveJadwalState() {
    try {
      localStorage.setItem(
        STORE_JADWAL,
        JSON.stringify({
          jadwal: D.jadwal,
          status: (cfg().meta && cfg().meta.status) || "Belum Dibuat",
          lastResult: (cfg().meta && cfg().meta.lastResult) || null,
        })
      );
    } catch (e) {}
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function rebuildAlokasiFromMapel() {
    var out = [];
    (cfg().kelas || []).forEach(function (kelas) {
      (cfg().mapel || []).forEach(function (m) {
        var g = (cfg().guru || []).filter(function (x) {
          return x.mapel.indexOf(m.nama) >= 0 && x.kelas.indexOf(kelas) >= 0;
        })[0];
        if (!g) return;
        out.push({
          id: "alok-" + kelas + "-" + m.kode,
          kelas: kelas,
          mapel: m.nama,
          kode: m.kode,
          jamPerMinggu: Number(m.jamPerMinggu) || 0,
          guruId: g.id,
          guru: g.nama,
        });
      });
    });
    cfg().alokasi = out;
  }

  function totalSesiNeed() {
    return (cfg().alokasi || []).reduce(function (a, x) {
      return a + (Number(x.jamPerMinggu) || 0);
    }, 0);
  }

  function renderRingkasan() {
    var terisi = (D.jadwal || []).length;

    document.getElementById("jadwalKpi").innerHTML = [
      ["Total kelas", (cfg().kelas || []).length, "bi-building", "navy", "penjadwalan"],
      ["Total guru", (cfg().guru || []).length, "bi-person-workspace", "blue", "pengampu"],
      ["Mata pelajaran", (cfg().mapel || []).length, "bi-journal-bookmark", "teal", "kurikulum"],
      ["Slot terisi", terisi, "bi-calendar2-check", "amber", "dari " + totalSesiNeed() + " kebutuhan"],
    ]
      .map(function (it) {
        var val =
          typeof it[1] === "string" && it[1].indexOf("pill") >= 0
            ? '<div class="kpi-value" style="font-size:14px;margin-top:4px">' + it[1] + "</div>"
            : '<div class="kpi-value">' + it[1] + "</div>";
        return (
          '<div class="kpi-card"><div class="kpi-icon ' +
          it[3] +
          '"><i class="bi ' +
          it[2] +
          '"></i></div><div><div class="kpi-label">' +
          it[0] +
          "</div>" +
          val +
          '<div class="kpi-hint">' +
          it[4] +
          "</div></div></div>"
        );
      })
      .join("");

    var sub = document.getElementById("jadwalPageSub");
    if (sub) {
      sub.textContent = isAdmin()
        ? "Pengelolaan dan penyusunan jadwal pembelajaran secara otomatis (CSP + Backtracking)."
        : "Jadwal mengajar Anda. Generate dan konfigurasi hanya tersedia untuk Admin Sekolah.";
    }
  }

  function applyRoleUi() {
    document.querySelectorAll("[data-izin-jadwal]").forEach(function (el) {
      var key = el.getAttribute("data-izin-jadwal");
      var ok = ui().boleh ? ui().boleh(key) : isAdmin();
      el.hidden = !ok;
      el.classList.toggle("izin-disabled", !ok);
      if (el.tagName === "BUTTON" || el.tagName === "INPUT" || el.tagName === "SELECT") {
        el.disabled = !ok;
      }
    });
    var aturTab = document.getElementById("jadwalTabAtur");
    var validTab = document.getElementById("jadwalTabValidasi");
    if (aturTab) aturTab.hidden = !isAdmin();
    if (validTab) validTab.hidden = !isAdmin();
    if (!isAdmin() && (tabAktif === "atur" || tabAktif === "validasi")) {
      switchTab("hasil");
    }
  }

  function switchTab(name) {
    tabAktif = name;
    document.querySelectorAll("#page-jadwal .seg-btn").forEach(function (b) {
      b.classList.toggle("active", b.dataset.tab === name);
    });
    ["hasil", "atur", "validasi"].forEach(function (t) {
      var el = document.getElementById("jadwal-panel-" + t);
      if (el) el.hidden = t !== name;
    });
  }

  function fillFilters() {
    var kelasEl = document.getElementById("jadwalKelas");
    var hariEl = document.getElementById("jadwalHari");
    var guruEl = document.getElementById("jadwalFilterGuru");
    var mapelEl = document.getElementById("jadwalFilterMapel");
    var viewEl = document.getElementById("jadwalViewMode");

    var kelasOpts = (cfg().kelas || []).slice();
    var prevKelas = kelasEl.value;
    var prevHari = hariEl.value;
    var prevGuru = guruEl ? guruEl.value : "";
    var prevMapel = mapelEl ? mapelEl.value : "";
    var prevView = viewEl ? viewEl.value : "kelas";

    kelasEl.innerHTML = kelasOpts
      .map(function (k) {
        return '<option value="' + esc(k) + '">' + esc(k) + "</option>";
      })
      .join("");
    if (kelasOpts.indexOf(prevKelas) >= 0) kelasEl.value = prevKelas;
    else kelasEl.value = kelasOpts[0] || "";

    ui().fillSelect(hariEl, cfg().waktu.hari || [], "Semua hari");
    if (prevHari) hariEl.value = prevHari;

    var guruNames = (cfg().guru || []).map(function (g) {
      return g.nama;
    });
    if (guruEl) {
      ui().fillSelect(guruEl, guruNames, "Semua guru");
      if (prevGuru) guruEl.value = prevGuru;
    }
    var mapelNames = (cfg().mapel || []).map(function (m) {
      return m.nama;
    });
    if (mapelEl) {
      ui().fillSelect(mapelEl, mapelNames, "Semua mapel");
      if (prevMapel) mapelEl.value = prevMapel;
    }
    if (viewEl) viewEl.value = prevView || "kelas";

    if (peran() === "guru") {
      var namaGuru = D.peranContoh.guru.nama;
      if (viewEl) viewEl.value = "guru";
      if (guruEl) {
        guruEl.value = namaGuru;
        guruEl.disabled = true;
      }
      kelasEl.disabled = false;
    } else {
      if (guruEl) guruEl.disabled = false;
    }
  }

  function filteredJadwal() {
    var view = (document.getElementById("jadwalViewMode") || {}).value || "kelas";
    var kelas = document.getElementById("jadwalKelas").value;
    var hari = document.getElementById("jadwalHari").value;
    var guru = (document.getElementById("jadwalFilterGuru") || {}).value || "";
    var mapel = (document.getElementById("jadwalFilterMapel") || {}).value || "";

    if (peran() === "guru") {
      guru = D.peranContoh.guru.nama;
      view = "guru";
    }

    return {
      view: view,
      list: (D.jadwal || []).filter(function (j) {
        if (hari && j.hari !== hari) return false;
        if (mapel && j.mapel !== mapel) return false;
        if (view === "guru") {
          if (guru && j.guru !== guru) return false;
        } else {
          if (kelas && j.kelas !== kelas) return false;
          if (guru && j.guru !== guru) return false;
        }
        return true;
      }),
      focusKelas: kelas,
      focusGuru: guru || (peran() === "guru" ? D.peranContoh.guru.nama : ""),
    };
  }

  function cellHtml(slot, admin) {
    if (!slot) return '<td class="slot-kosong">—</td>';
    var extra =
      admin
        ? ' <button class="btn btn-sm btn-outline-secondary jadwal-edit-btn" type="button" data-edit-jadwal="' +
          esc(slot.id) +
          '" title="Edit">Edit</button>'
        : "";
    if (slot._view === "guru") {
      return (
        "<td><div class=\"slot-mapel\">" +
        esc(slot.mapel) +
        '</div><div class="slot-meta">' +
        esc(slot.kelas) +
        " · " +
        esc(slot.ruang || "") +
        "</div>" +
        extra +
        "</td>"
      );
    }
    return (
      "<td><div class=\"slot-mapel\">" +
      esc(slot.mapel) +
      '</div><div class="slot-meta">' +
      esc(slot.guru) +
      " · " +
      esc(slot.ruang || "") +
      "</div>" +
      extra +
      "</td>"
    );
  }

  function renderHasilTabel() {
    var f = filteredJadwal();
    var hariList = document.getElementById("jadwalHari").value
      ? [document.getElementById("jadwalHari").value]
      : (cfg().waktu.hari || []).slice();
    var slots = teachingSlots();
    var admin = isAdmin();
    var head =
      "<tr><th>Waktu</th>" +
      hariList
        .map(function (h) {
          return "<th>" + esc(h) + "</th>";
        })
        .join("") +
      "</tr>";
    document.getElementById("jadwalHead").innerHTML = head;

    var body = slots
      .map(function (slot) {
        var row = "<tr><td class=\"name-cell\">" + esc(slot.mulai) + "–" + esc(slot.selesai) + "</td>";
        hariList.forEach(function (h) {
          var found = null;
          if (f.view === "guru") {
            found = f.list.filter(function (j) {
              return j.hari === h && j.mulai === slot.mulai && (!f.focusGuru || j.guru === f.focusGuru);
            })[0];
            if (found) found = Object.assign({}, found, { _view: "guru" });
          } else {
            found = f.list.filter(function (j) {
              return j.hari === h && j.mulai === slot.mulai && j.kelas === f.focusKelas;
            })[0];
          }
          row += cellHtml(found, admin);
        });
        return row + "</tr>";
      })
      .join("");

    document.getElementById("jadwalBody").innerHTML =
      body ||
      '<tr><td class="table-empty" colspan="' +
        (hariList.length + 1) +
        '">Belum ada jadwal. Admin dapat menekan Generate Jadwal Otomatis.</td></tr>';

    var foot = document.getElementById("jadwalHasilFoot");
    if (foot) {
      foot.textContent =
        f.view === "guru"
          ? "Tampilan jadwal guru" + (f.focusGuru ? ": " + f.focusGuru : "") + " · " + f.list.length + " sesi."
          : "Tampilan kelas " + f.focusKelas + " · filter menampilkan " + f.list.length + " sesi terkait.";
    }
  }

  function renderMapelTable() {
    var body = document.getElementById("jadwalMapelBody");
    if (!body) return;
    body.innerHTML = (cfg().mapel || [])
      .map(function (m) {
        var gurus = (cfg().guru || [])
          .filter(function (g) {
            return g.mapel.indexOf(m.nama) >= 0;
          })
          .map(function (g) {
            return g.nama;
          });
        var kelas = {};
        (cfg().alokasi || []).forEach(function (a) {
          if (a.mapel === m.nama) kelas[a.kelas] = true;
        });
        return (
          "<tr><td class=\"name-cell\">" +
          esc(m.nama) +
          "</td><td>" +
          esc(m.kode) +
          "</td><td>" +
          m.jamPerMinggu +
          "</td><td>" +
          esc(gurus.join(", ") || "—") +
          "</td><td>" +
          esc(Object.keys(kelas).join(", ") || "—") +
          '</td><td><button class="btn btn-sm btn-outline-secondary" type="button" data-edit-mapel="' +
          esc(m.kode) +
          '" data-izin-jadwal="atur-penjadwalan">Edit</button> <button class="btn btn-sm btn-outline-secondary" type="button" data-hapus-mapel="' +
          esc(m.kode) +
          '" data-izin-jadwal="atur-penjadwalan">Hapus</button></td></tr>'
        );
      })
      .join("");
  }

  function renderGuruTable() {
    var body = document.getElementById("jadwalGuruBody");
    if (!body) return;
    body.innerHTML = (cfg().guru || [])
      .map(function (g) {
        var hariAktif = (cfg().waktu.hari || []).filter(function (h) {
          return (g.ketersediaan[h] || []).length;
        }).length;
        return (
          "<tr><td class=\"name-cell\">" +
          esc(g.nama) +
          "</td><td>" +
          esc((g.mapel || []).join(", ")) +
          "</td><td>" +
          esc((g.kelas || []).join(", ")) +
          "</td><td>" +
          hariAktif +
          " hari aktif</td><td>" +
          g.maxJamPerHari +
          ' jam</td><td><button class="btn btn-sm btn-outline-secondary" type="button" data-atur-avail="' +
          esc(g.id) +
          '" data-izin-jadwal="atur-penjadwalan">Atur ketersediaan</button></td></tr>'
        );
      })
      .join("");
  }

  function renderWaktuTable() {
    var body = document.getElementById("jadwalWaktuBody");
    if (!body) return;
    body.innerHTML = (cfg().waktu.slots || [])
      .map(function (s) {
        return (
          "<tr><td>" +
          esc(s.label || "Slot " + s.id) +
          "</td><td>" +
          esc(s.mulai) +
          "</td><td>" +
          esc(s.selesai) +
          "</td><td>" +
          (s.jenis === "istirahat"
            ? ui().pill("warning", "Istirahat")
            : ui().pill("success", "Pelajaran")) +
          "</td></tr>"
        );
      })
      .join("");
    var info = document.getElementById("jadwalWaktuInfo");
    if (info) {
      info.textContent =
        (cfg().waktu.hari || []).join(", ") +
        " · durasi slot " +
        (cfg().waktu.durasiMenit || 40) +
        " menit · jam istirahat tidak masuk domain CSP.";
    }
  }

  function renderAlokasiTable() {
    var body = document.getElementById("jadwalAlokasiBody");
    if (!body) return;
    body.innerHTML = (cfg().alokasi || [])
      .map(function (a) {
        return (
          "<tr><td>" +
          esc(a.kelas) +
          '</td><td class="name-cell">' +
          esc(a.mapel) +
          "</td><td>" +
          esc(a.kode) +
          "</td><td>" +
          esc(a.guru) +
          '</td><td><input class="form-control form-control-sm alokasi-jam" style="max-width:88px" type="number" min="0" max="10" value="' +
          a.jamPerMinggu +
          '" data-alokasi-id="' +
          esc(a.id) +
          '" data-izin-jadwal="atur-penjadwalan" /></td></tr>'
        );
      })
      .join("");
  }

  function renderValidasi() {
    var box = document.getElementById("jadwalValidasiBox");
    if (!box) return;
    var res = cfg().meta && cfg().meta.lastResult;
    if (!res) {
      box.innerHTML =
        '<div class="empty-hint">Belum ada hasil generate. Jalankan <strong>Generate Jadwal Otomatis</strong> untuk melihat statistik CSP.</div>';
      return;
    }
    var cs = res.constraintStatus || {};
    var reasons = (res.reasons || res.issues || []).slice(0, 6);
    box.innerHTML =
      '<div class="kpi-grid kpi-grid-5" style="margin-bottom:16px">' +
      [
        ["Status proses", res.status === "Berhasil" ? ui().pill("success", "Berhasil") : ui().pill("danger", "Gagal")],
        ["Kebutuhan sesi", res.totalNeed],
        ["Berhasil dijadwalkan", res.scheduled],
        ["Konflik / pelanggaran", res.conflicts],
        ["Percobaan penempatan", res.attempts],
      ]
        .map(function (it) {
          return (
            '<div class="kpi-card"><div><div class="kpi-label">' +
            it[0] +
            '</div><div class="kpi-value" style="font-size:18px">' +
            it[1] +
            "</div></div></div>"
          );
        })
        .join("") +
      "</div>" +
      '<div class="summary-list" style="margin-bottom:12px">' +
      [
        ["Backtracking (langkah)", res.backtracks],
        ["Waktu proses", res.elapsedMs + " ms"],
        ["Status guru", cs.guru || "—"],
        ["Status kelas", cs.kelas || "—"],
        ["Status ketersediaan", cs.ketersediaan || "—"],
        ["Status alokasi jam", cs.alokasi || "—"],
      ]
        .map(function (p) {
          return (
            '<div class="summary-item"><div class="si-l">' +
            p[0] +
            '</div><div class="si-v" style="font-size:15px">' +
            p[1] +
            "</div></div>"
          );
        })
        .join("") +
      "</div>" +
      (reasons.length
        ? '<div class="form-error" style="display:block">' +
          reasons
            .map(function (r) {
              return "• " + esc(r);
            })
            .join("<br/>") +
          "</div>"
        : '<p class="panel-sub">Semua hard constraints terpenuhi. Jadwal siap digunakan.</p>');
  }

  function renderAll() {
    syncJamSlot();
    renderRingkasan();
    fillFilters();
    renderHasilTabel();
    renderMapelTable();
    renderGuruTable();
    renderWaktuTable();
    renderAlokasiTable();
    renderValidasi();
    applyRoleUi();
  }

  function setLoading(on) {
    var el = document.getElementById("jadwalLoading");
    if (el) el.hidden = !on;
    var btn = document.getElementById("btnGenerateJadwal");
    if (btn) btn.disabled = on || !isAdmin();
  }

  function runGenerate() {
    if (!isAdmin()) {
      ui().showToast("Mode Demo: Generate Jadwal hanya untuk Admin Sekolah.");
      return;
    }
    setLoading(true);
    switchTab("hasil");
    setTimeout(function () {
      var result = window.CspScheduler.generateSchedule(clone(cfg()));
      cfg().meta = cfg().meta || {};
      cfg().meta.lastResult = result.stats;
      if (result.success) {
        D.jadwal = result.schedule;
        cfg().meta.status = "Berhasil Digenerate";
        saveConfig();
        saveJadwalState();
        renderAll();
        switchTab("validasi");
        ui().showToast(
          "Jadwal berhasil digenerate: " +
            result.stats.scheduled +
            " sesi dalam " +
            result.stats.elapsedMs +
            " ms."
        );
      } else {
        cfg().meta.status = "Gagal — solusi tidak ditemukan";
        saveConfig();
        saveJadwalState();
        renderAll();
        switchTab("validasi");
        ui().showToast("Solusi tidak ditemukan. Lihat laporan validasi untuk alasan kegagalan.");
      }
      setLoading(false);
    }, 80);
  }

  function resetJadwal() {
    if (!isAdmin()) {
      ui().showToast("Mode Demo: Reset Jadwal hanya untuk Admin Sekolah.");
      return;
    }
    if (!confirm("Reset jadwal hasil generate? Konfigurasi penjadwalan tetap disimpan.")) return;
    D.jadwal = [];
    cfg().meta.status = "Belum Dibuat";
    cfg().meta.lastResult = null;
    saveJadwalState();
    saveConfig();
    renderAll();
    ui().showToast("Jadwal dikosongkan. Silakan generate ulang.");
  }

  function exportCsv() {
    if (!isAdmin() && peran() !== "guru") return;
    var rows = [["Hari", "Mulai", "Selesai", "Kelas", "Mata Pelajaran", "Guru", "Ruang"]];
    var list = (D.jadwal || []).slice().sort(function (a, b) {
      var ha = (cfg().waktu.hari || []).indexOf(a.hari);
      var hb = (cfg().waktu.hari || []).indexOf(b.hari);
      if (ha !== hb) return ha - hb;
      if (a.mulai !== b.mulai) return a.mulai < b.mulai ? -1 : 1;
      return a.kelas < b.kelas ? -1 : 1;
    });
    if (peran() === "guru") {
      list = list.filter(function (j) {
        return j.guru === D.peranContoh.guru.nama;
      });
    }
    list.forEach(function (j) {
      rows.push([j.hari, j.mulai, j.selesai, j.kelas, j.mapel, j.guru, j.ruang || ""]);
    });
    var csv = rows
      .map(function (r) {
        return r
          .map(function (c) {
            return '"' + String(c).replace(/"/g, '""') + '"';
          })
          .join(",");
      })
      .join("\n");
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "jadwal-al-anshar.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    ui().showToast("CSV jadwal diunduh (" + list.length + " baris).");
  }

  function cetakJadwal() {
    document.body.classList.add("print-jadwal");
    window.print();
    setTimeout(function () {
      document.body.classList.remove("print-jadwal");
    }, 300);
  }

  function openEdit(id) {
    if (!isAdmin()) return;
    var item = (D.jadwal || []).filter(function (j) {
      return j.id === id;
    })[0];
    if (!item) return;
    editTargetId = id;
    document.getElementById("feKelas").innerHTML = (cfg().kelas || [])
      .map(function (k) {
        return '<option value="' + esc(k) + '">' + esc(k) + "</option>";
      })
      .join("");
    document.getElementById("feHari").innerHTML = (cfg().waktu.hari || [])
      .map(function (h) {
        return '<option value="' + esc(h) + '">' + esc(h) + "</option>";
      })
      .join("");
    document.getElementById("feSlot").innerHTML = teachingSlots()
      .map(function (s) {
        return (
          '<option value="' +
          s.id +
          '" data-mulai="' +
          esc(s.mulai) +
          '" data-selesai="' +
          esc(s.selesai) +
          '">' +
          esc(s.label) +
          " (" +
          esc(s.mulai) +
          "–" +
          esc(s.selesai) +
          ")</option>"
        );
      })
      .join("");
    document.getElementById("feMapel").innerHTML = (cfg().mapel || [])
      .map(function (m) {
        return '<option value="' + esc(m.nama) + '">' + esc(m.nama) + "</option>";
      })
      .join("");
    document.getElementById("feKelas").value = item.kelas;
    document.getElementById("feHari").value = item.hari;
    document.getElementById("feMapel").value = item.mapel;
    var slot = teachingSlots().filter(function (s) {
      return s.mulai === item.mulai;
    })[0];
    if (slot) document.getElementById("feSlot").value = String(slot.id);
    document.getElementById("feGuru").value = item.guru;
    document.getElementById("feRuang").value = item.ruang || "R. " + item.kelas;
    document.getElementById("jadwalEditError").hidden = true;
    modalEdit.show();
  }

  function saveEdit(e) {
    e.preventDefault();
    if (!isAdmin()) return;
    var item = (D.jadwal || []).filter(function (j) {
      return j.id === editTargetId;
    })[0];
    if (!item) return;
    var slotSel = document.getElementById("feSlot");
    var opt = slotSel.options[slotSel.selectedIndex];
    var mapel = document.getElementById("feMapel").value;
    var guruNama = document.getElementById("feGuru").value.trim();
    var guruObj = (cfg().guru || []).filter(function (g) {
      return g.nama === guruNama || (g.mapel.indexOf(mapel) >= 0 && g.kelas.indexOf(document.getElementById("feKelas").value) >= 0);
    })[0];
    var draft = {
      id: item.id,
      varId: item.varId,
      kelas: document.getElementById("feKelas").value,
      hari: document.getElementById("feHari").value,
      slotId: Number(slotSel.value),
      mulai: opt.getAttribute("data-mulai"),
      selesai: opt.getAttribute("data-selesai"),
      mapel: mapel,
      kode: item.kode || "",
      guru: guruNama,
      guruId: guruObj ? guruObj.id : item.guruId,
      ruang: document.getElementById("feRuang").value.trim() || "R. " + document.getElementById("feKelas").value,
      sumber: "manual",
    };
    var validation = window.CspScheduler.validateManualChange(D.jadwal, draft, cfg());
    var err = document.getElementById("jadwalEditError");
    if (!validation.valid) {
      err.hidden = false;
      err.textContent = validation.issues[0] || "Perubahan menimbulkan konflik constraint.";
      return;
    }
    Object.keys(draft).forEach(function (k) {
      item[k] = draft[k];
    });
    saveJadwalState();
    modalEdit.hide();
    renderAll();
    ui().showToast("Perubahan jadwal disimpan setelah lolos validasi konflik.");
  }

  function openMapelEditor(kode) {
    var m = (cfg().mapel || []).filter(function (x) {
      return x.kode === kode;
    })[0];
    document.getElementById("fmKode").value = m ? m.kode : "";
    document.getElementById("fmKode").readOnly = !!m;
    document.getElementById("fmNama").value = m ? m.nama : "";
    document.getElementById("fmJam").value = m ? m.jamPerMinggu : 2;
    document.getElementById("jadwalMapelError").hidden = true;
    document.getElementById("modalMapelTitle").textContent = m ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran";
    modalMapel.show();
  }

  function saveMapel(e) {
    e.preventDefault();
    if (!isAdmin()) return;
    var kode = document.getElementById("fmKode").value.trim().toUpperCase();
    var nama = document.getElementById("fmNama").value.trim();
    var jam = Number(document.getElementById("fmJam").value) || 0;
    var err = document.getElementById("jadwalMapelError");
    if (!kode || !nama || jam < 0) {
      err.hidden = false;
      err.textContent = "Lengkapi kode, nama, dan jam per minggu.";
      return;
    }
    var existing = (cfg().mapel || []).filter(function (m) {
      return m.kode === kode;
    })[0];
    if (existing) {
      existing.nama = nama;
      existing.jamPerMinggu = jam;
    } else {
      cfg().mapel.push({ kode: kode, nama: nama, jamPerMinggu: jam });
    }
    rebuildAlokasiFromMapel();
    saveConfig();
    modalMapel.hide();
    renderAll();
    ui().showToast("Data mata pelajaran diperbarui. Generate ulang untuk menerapkan ke jadwal.");
  }

  function openAvail(gid) {
    var g = (cfg().guru || []).filter(function (x) {
      return x.id === gid;
    })[0];
    if (!g) return;
    document.getElementById("availGuruId").value = g.id;
    document.getElementById("availGuruNama").textContent = g.nama;
    document.getElementById("availMaxJam").value = g.maxJamPerHari;
    var wrap = document.getElementById("availGrid");
    var slots = teachingSlots();
    wrap.innerHTML = (cfg().waktu.hari || [])
      .map(function (h) {
        var checks = slots
          .map(function (s) {
            var on = (g.ketersediaan[h] || []).indexOf(s.id) >= 0;
            return (
              '<label class="avail-chip"><input type="checkbox" data-hari="' +
              esc(h) +
              '" data-slot="' +
              s.id +
              '"' +
              (on ? " checked" : "") +
              " /> " +
              esc(s.label) +
              "</label>"
            );
          })
          .join("");
        return '<div class="avail-day"><div class="avail-day-title">' + esc(h) + "</div><div class=\"avail-chips\">" + checks + "</div></div>";
      })
      .join("");
    modalGuruAvail.show();
  }

  function saveAvail(e) {
    e.preventDefault();
    if (!isAdmin()) return;
    var gid = document.getElementById("availGuruId").value;
    var g = (cfg().guru || []).filter(function (x) {
      return x.id === gid;
    })[0];
    if (!g) return;
    g.maxJamPerHari = Number(document.getElementById("availMaxJam").value) || 1;
    var next = {};
    (cfg().waktu.hari || []).forEach(function (h) {
      next[h] = [];
    });
    document.querySelectorAll("#availGrid input[type=checkbox]").forEach(function (cb) {
      if (!cb.checked) return;
      next[cb.getAttribute("data-hari")].push(Number(cb.getAttribute("data-slot")));
    });
    g.ketersediaan = next;
    saveConfig();
    modalGuruAvail.hide();
    renderAll();
    ui().showToast("Ketersediaan guru disimpan.");
  }

  function wireEvents() {
    document.getElementById("btnGenerateJadwal").addEventListener("click", runGenerate);
    document.getElementById("btnResetJadwal").addEventListener("click", resetJadwal);
    document.getElementById("btnAturPenjadwalan").addEventListener("click", function () {
      if (!isAdmin()) return;
      switchTab("atur");
    });
    document.getElementById("btnExportJadwal").addEventListener("click", exportCsv);
    document.getElementById("btnCetakJadwal").addEventListener("click", cetakJadwal);

    document.querySelectorAll("#page-jadwal .seg-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.hidden) return;
        switchTab(btn.dataset.tab);
      });
    });

    ["jadwalKelas", "jadwalHari", "jadwalFilterGuru", "jadwalFilterMapel", "jadwalViewMode"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("change", renderHasilTabel);
    });

    document.getElementById("formEditJadwal").addEventListener("submit", saveEdit);
    document.getElementById("formMapelJadwal").addEventListener("submit", saveMapel);
    document.getElementById("formAvailGuru").addEventListener("submit", saveAvail);

    document.getElementById("btnTambahMapel").addEventListener("click", function () {
      openMapelEditor(null);
    });

    document.getElementById("btnSimpanAlokasi").addEventListener("click", function () {
      if (!isAdmin()) return;
      document.querySelectorAll(".alokasi-jam").forEach(function (inp) {
        var id = inp.getAttribute("data-alokasi-id");
        var a = (cfg().alokasi || []).filter(function (x) {
          return x.id === id;
        })[0];
        if (a) a.jamPerMinggu = Number(inp.value) || 0;
        var m = (cfg().mapel || []).filter(function (x) {
          return x.nama === (a && a.mapel);
        })[0];
        /* jam mapel global mengikuti modal edit mapel; alokasi per kelas independen */
      });
      /* sinkronkan jamPerMinggu mapel dari rata-rata / mode pertama kelas — biarkan alokasi per-kelas */
      saveConfig();
      renderAll();
      ui().showToast("Alokasi jam disimpan. Generate ulang untuk menyusun jadwal baru.");
    });

    document.getElementById("feMapel").addEventListener("change", function () {
      var mapel = document.getElementById("feMapel").value;
      var kelas = document.getElementById("feKelas").value;
      var g = (cfg().guru || []).filter(function (x) {
        return x.mapel.indexOf(mapel) >= 0 && x.kelas.indexOf(kelas) >= 0;
      })[0];
      if (g) document.getElementById("feGuru").value = g.nama;
    });

    document.body.addEventListener("click", function (e) {
      var editBtn = e.target.closest("[data-edit-jadwal]");
      if (editBtn) openEdit(editBtn.getAttribute("data-edit-jadwal"));
      var em = e.target.closest("[data-edit-mapel]");
      if (em) openMapelEditor(em.getAttribute("data-edit-mapel"));
      var hm = e.target.closest("[data-hapus-mapel]");
      if (hm && isAdmin()) {
        var kode = hm.getAttribute("data-hapus-mapel");
        if (!confirm("Hapus mata pelajaran " + kode + "?")) return;
        cfg().mapel = (cfg().mapel || []).filter(function (m) {
          return m.kode !== kode;
        });
        rebuildAlokasiFromMapel();
        saveConfig();
        renderAll();
      }
      var av = e.target.closest("[data-atur-avail]");
      if (av) openAvail(av.getAttribute("data-atur-avail"));
    });
  }

  function init() {
    D = window.APP_DATA;
    if (!D.penjadwalan) return;
    seedJadwal = clone(D.jadwal);
    loadPersisted();
    /* Jika belum pernah generate CSP, tetap tampilkan data contoh awal */
    if (!localStorage.getItem(STORE_JADWAL) && (!cfg().meta || cfg().meta.status === "Belum Dibuat")) {
      cfg().meta = cfg().meta || {};
      cfg().meta.status = "Belum Dibuat";
    }
    modalEdit = new bootstrap.Modal(document.getElementById("modalEditJadwal"));
    modalMapel = new bootstrap.Modal(document.getElementById("modalMapelJadwal"));
    modalGuruAvail = new bootstrap.Modal(document.getElementById("modalAvailGuru"));
    wireEvents();
    renderAll();
  }

  function onShow(page) {
    if (page !== "jadwal" || !D) return;
    renderAll();
  }

  function onRoleChange() {
    if (!D) return;
    applyRoleUi();
    fillFilters();
    renderHasilTabel();
    renderRingkasan();
  }

  document.addEventListener("DOMContentLoaded", init);
  window.ModulJadwal = { onShow: onShow, onRoleChange: onRoleChange, render: renderAll };
})();
