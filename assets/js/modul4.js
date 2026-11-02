/* Modul 4 — Informasi Pembayaran (impor Braja, notifikasi, portal ortu) */
(function () {
  var D;
  var fileRows = [];

  function ui() {
    return window.UI;
  }

  function rupiah(n) {
    return "Rp" + Number(n || 0).toLocaleString("id-ID");
  }

  function statusBayarPill(status) {
    if (status === "Lunas" || status === "Terkirim") return ui().pill("success", status);
    if (status === "Belum Lunas" || status === "Menunggu" || status === "Mode Demo") return ui().pill("warning", status);
    if (status === "Perlu Verifikasi" || status === "Gagal") return ui().pill("danger", status);
    return ui().pill("info", status);
  }

  function pembayaranAnak() {
    var nis = ui().anakNisOrangtua ? ui().anakNisOrangtua() : D.orangTua.anakNis;
    return D.pembayaran.filter(function (p) {
      return nis.indexOf(p.nis) >= 0;
    });
  }

  function ringkasStatus() {
    var rows = D.pembayaran;
    return {
      total: rows.length,
      lunas: rows.filter(function (r) {
        return r.status === "Lunas";
      }).length,
      belum: rows.filter(function (r) {
        return r.status === "Belum Lunas";
      }).length,
      verifikasi: rows.filter(function (r) {
        return r.status === "Perlu Verifikasi";
      }).length,
    };
  }

  function tableRows(rows) {
    if (!rows.length) return ui().emptyRow(6, "Tidak ada data yang sesuai.");
    return rows
      .map(function (r) {
        return (
          "<tr>" +
          '<td class="name-cell">' +
          r.nama +
          '<div class="nis">NIS ' +
          r.nis +
          "</div></td>" +
          "<td>" +
          r.kelas +
          "</td>" +
          "<td>" +
          r.jenis +
          "</td>" +
          "<td class=\"name-cell\">" +
          rupiah(r.jumlah) +
          "</td>" +
          "<td>" +
          statusBayarPill(r.status) +
          "</td>" +
          "<td>" +
          r.tanggal +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function renderDashboard() {
    var s = ringkasStatus();
    var max = Math.max(s.total, 1);
    document.getElementById("bayarDashKpi").innerHTML = [
      ["Total data", s.total, "bi-table", "navy", "data simulasi"],
      ["Lunas", s.lunas, "bi-check-circle", "teal", "status terverifikasi"],
      ["Belum lunas", s.belum, "bi-hourglass-split", "amber", "dari data impor"],
      ["Perlu verifikasi", s.verifikasi, "bi-exclamation-diamond", "rose", "tahan sebelum diperbarui"],
    ]
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

    document.getElementById("bayarStatusBars").innerHTML = [
      ["Lunas", s.lunas, ""],
      ["Belum Lunas", s.belum, "light"],
      ["Verifikasi", s.verifikasi, "light"],
    ]
      .map(function (it) {
        var h = Math.max(8, Math.round((it[1] / max) * 150));
        return (
          '<div class="bayar-bar-item"><div class="bayar-bar ' +
          it[2] +
          '" style="height:' +
          h +
          'px"></div><span>' +
          it[0] +
          "</span></div>"
        );
      })
      .join("");

    document.getElementById("bayarDashBody").innerHTML = tableRows(D.pembayaran.slice(0, 6));
    document.getElementById("bayarDashFoot").textContent =
      "Cuplikan " + Math.min(6, D.pembayaran.length) + " dari " + D.pembayaran.length + " data contoh. Bukan data aktual sekolah.";
  }

  function filteredBayar() {
    var q = (document.getElementById("bayarSearch").value || "").trim().toLowerCase();
    var st = document.getElementById("bayarFilterStatus").value;
    return D.pembayaran.filter(function (r) {
      return (
        (!q || r.nama.toLowerCase().indexOf(q) >= 0 || r.nis.indexOf(q) >= 0) &&
        (!st || r.status === st)
      );
    });
  }

  function renderData() {
    var rows = filteredBayar();
    document.getElementById("bayarDataBody").innerHTML = tableRows(rows);
    document.getElementById("bayarDataFoot").textContent =
      "Menampilkan " + rows.length + " dari " + D.pembayaran.length + " catatan. Status hanya dari data impor yang valid.";
  }

  function parseCsv(text) {
    var lines = text.trim().split(/\r?\n/);
    if (!lines.length) throw new Error("Berkas kosong.");
    var delimiter = lines[0].indexOf(";") >= 0 ? ";" : ",";
    var cols = lines[0].split(delimiter).map(function (x) {
      return x.trim().toLowerCase();
    });
    var required = ["nis", "nama", "kelas", "jenis", "jumlah", "status", "tanggal_bayar"];
    if (
      required.some(function (c) {
        return cols.indexOf(c) < 0;
      })
    ) {
      throw new Error("Kolom wajib belum lengkap. Gunakan contoh CSV.");
    }
    return lines
      .slice(1)
      .filter(Boolean)
      .map(function (l) {
        var vals = l.split(delimiter).map(function (x) {
          return x.trim().replace(/^"|"$/g, "");
        });
        function get(c) {
          return vals[cols.indexOf(c)] || "";
        }
        return {
          nis: get("nis"),
          nama: get("nama"),
          kelas: get("kelas"),
          jenis: get("jenis"),
          jumlah: Number(get("jumlah")),
          status: get("status"),
          tanggal: get("tanggal_bayar") || "—",
        };
      });
  }

  function loadCsv(input) {
    var f = input.files && input.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        fileRows = parseCsv(String(reader.result || ""));
        var errors = fileRows.filter(function (x) {
          return (
            !x.nis ||
            !x.nama ||
            !Number.isFinite(x.jumlah) ||
            ["Lunas", "Belum Lunas", "Perlu Verifikasi"].indexOf(x.status) < 0
          );
        });
        document.getElementById("bayarCsvPreview").innerHTML =
          '<div class="bayar-notice" style="margin-bottom:12px">Dibaca: ' +
          fileRows.length +
          " baris. " +
          errors.length +
          " baris perlu diperbaiki.</div>" +
          '<div class="table-wrap"><table class="data-table dense"><thead><tr><th>Nama</th><th>Kelas</th><th>Jenis</th><th>Nominal</th><th>Status</th><th>Tanggal</th></tr></thead><tbody>' +
          tableRows(fileRows.slice(0, 5)) +
          "</tbody></table></div>";
      } catch (e) {
        fileRows = [];
        document.getElementById("bayarCsvPreview").innerHTML =
          '<div class="bayar-notice">' + String(e.message || e) + "</div>";
      }
    };
    reader.readAsText(f);
  }

  function applyCsv() {
    if (!ui().boleh || !ui().boleh("impor-bayar")) {
      ui().showToast("Mode Demo: impor pembayaran hanya untuk admin.");
      return;
    }
    if (!fileRows.length) {
      ui().showToast("Pilih CSV yang valid terlebih dahulu.");
      return;
    }
    var existing = {};
    D.pembayaran.forEach(function (r) {
      existing[r.nis] = true;
    });
    var valid = fileRows.filter(function (x) {
      return (
        existing[x.nis] &&
        x.nama &&
        Number.isFinite(x.jumlah) &&
        x.jumlah >= 0 &&
        ["Lunas", "Belum Lunas", "Perlu Verifikasi"].indexOf(x.status) >= 0
      );
    });
    valid.forEach(function (r) {
      var idx = D.pembayaran.findIndex(function (x) {
        return x.nis === r.nis;
      });
      if (idx >= 0) {
        D.pembayaran[idx] = Object.assign({}, D.pembayaran[idx], {
          nama: r.nama,
          kelas: r.kelas,
          jenis: r.jenis,
          jumlah: r.jumlah,
          status: r.status,
          tanggal: r.tanggal,
        });
      }
    });
    ui().showToast(
      valid.length +
        " baris diperbarui dalam demo. " +
        (fileRows.length - valid.length) +
        " baris tidak cocok atau tidak valid."
    );
    ui().showPage("bayar-data");
  }

  function downloadSample() {
    var content =
      "nis,nama,kelas,jenis,jumlah,status,tanggal_bayar\n" +
      "2024510001,Ahmad Fauzan,V-A,SPP Oktober 2026,350000,Lunas,29 Okt 2026\n" +
      "2024510003,Chika Amelia,V-A,SPP Oktober 2026,350000,Belum Lunas,\n";
    var blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "contoh_impor_braja.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function renderNotifikasi() {
    /* static HTML mostly; keep channel state */
  }

  function simulateNotif() {
    if (!ui().boleh || !ui().boleh("simulasi-notif")) {
      ui().showToast("Mode Demo: simulasi notifikasi hanya untuk admin.");
      return;
    }
    var now = new Date().toLocaleString("id-ID");
    D.pembayaranLog.unshift({
      waktu: now,
      siswa: "Ahmad Fauzan",
      saluran: "In-App",
      status: "Mode Demo",
    });
    var wa = document.getElementById("bayarWaToggle");
    if (wa && wa.checked) {
      D.pembayaranLog.unshift({
        waktu: now,
        siswa: "Ahmad Fauzan",
        saluran: "WhatsApp",
        status: "Mode Demo",
      });
    }
    ui().showToast("Simulasi selesai. Tidak ada WhatsApp yang benar-benar dikirim.");
  }

  function renderRiwayat() {
    document.getElementById("bayarRiwayatBody").innerHTML = D.pembayaranLog.length
      ? D.pembayaranLog.map(function (l) {
          return (
            "<tr><td>" +
            l.waktu +
            "</td><td class=\"name-cell\">" +
            l.siswa +
            "</td><td>" +
            l.saluran +
            "</td><td>" +
            statusBayarPill(l.status) +
            "</td></tr>"
          );
        }).join("")
      : ui().emptyRow(4, "Belum ada log notifikasi.");
  }

  function renderBayarAnak() {
    var rows = pembayaranAnak();
    var r = rows[0];
    var host = document.getElementById("bayarAnakContent");
    if (!r) {
      host.innerHTML = '<div class="bayar-notice">Tidak ada data pembayaran untuk anak tertaut.</div>';
      return;
    }
    host.innerHTML =
      "<div class=\"panel\"><div class=\"panel-body\">" +
      "<h2 class=\"panel-title\" style=\"margin-bottom:4px\">" +
      r.nama +
      " — Kelas " +
      r.kelas +
      "</h2>" +
      '<p class="panel-sub">Data hanya dapat dilihat oleh orang tua yang terhubung dengan siswa.</p>' +
      '<div class="bayar-receipt">' +
      "<div><div class=\"name-cell\">" +
      r.jenis +
      '</div><div class="nis">NIS ' +
      r.nis +
      " · " +
      r.tanggal +
      "</div></div>" +
      '<div class="bayar-receipt-right"><div class="name-cell">' +
      rupiah(r.jumlah) +
      "</div><div style=\"margin-top:8px\">" +
      statusBayarPill(r.status) +
      "</div></div></div>" +
      '<div class="bayar-notice" style="margin-top:16px">Informasi pembayaran berasal dari data yang diimpor petugas sekolah. Pembayaran tidak dapat dilakukan melalui mockup ini.</div>' +
      "</div></div>";
  }

  function renderNotifOrtu() {
    document.getElementById("bayarNotifOrtuList").innerHTML = D.notifOrangtua
      .map(function (n) {
        return (
          '<div class="bayar-noti"><div class="kpi-icon blue"><i class="bi ' +
          n.ikon +
          '"></i></div><div><div class="name-cell">' +
          n.judul +
          '</div><p class="panel-sub" style="margin:6px 0">' +
          n.isi +
          "</p><div class=\"nis\">" +
          n.waktu +
          "</div></div></div>"
        );
      })
      .join("");
  }

  function enrichPortalBayar() {
    var box = document.getElementById("portalBayarRingkas");
    if (!box) return;
    var rows = pembayaranAnak();
    var r = rows[0];
    if (!r) {
      box.innerHTML = '<div class="bayar-notice">Belum ada informasi pembayaran untuk anak tertaut.</div>';
      return;
    }
    box.innerHTML =
      '<div class="bayar-receipt"><div><div class="name-cell">' +
      r.jenis +
      '</div><div class="nis">Terakhir: ' +
      r.tanggal +
      "</div></div>" +
      '<div class="bayar-receipt-right"><div class="name-cell">' +
      rupiah(r.jumlah) +
      "</div><div style=\"margin-top:8px\">" +
      statusBayarPill(r.status) +
      '</div></div></div>' +
      '<div class="actions" style="margin-top:14px"><button class="btn btn-sm btn-primary" type="button" data-buka="bayar-anak">Lihat rincian</button></div>';
  }

  function onShow(page) {
    if (!D) return;
    if (page === "bayar-dashboard") renderDashboard();
    if (page === "bayar-data") renderData();
    if (page === "bayar-riwayat") renderRiwayat();
    if (page === "bayar-anak") renderBayarAnak();
    if (page === "bayar-notif-ortu") renderNotifOrtu();
    if (page === "portal") enrichPortalBayar();
    if (page === "bayar-notifikasi") renderNotifikasi();
  }

  function init() {
    D = window.APP_DATA;
    var search = document.getElementById("bayarSearch");
    var filter = document.getElementById("bayarFilterStatus");
    if (search) {
      search.addEventListener("input", renderData);
      filter.addEventListener("change", renderData);
    }
    var csv = document.getElementById("bayarCsvFile");
    if (csv) csv.addEventListener("change", function () {
      loadCsv(csv);
    });
    var btnSample = document.getElementById("bayarUnduhContoh");
    if (btnSample) btnSample.addEventListener("click", downloadSample);
    var btnApply = document.getElementById("bayarTerapkanCsv");
    if (btnApply) btnApply.addEventListener("click", applyCsv);
    var btnSim = document.getElementById("bayarSimulasiNotif");
    if (btnSim) btnSim.addEventListener("click", simulateNotif);
  }

  document.addEventListener("DOMContentLoaded", init);
  window.Modul4 = {
    onShow: onShow,
    ringkasStatus: ringkasStatus,
    pembayaranAnak: pembayaranAnak,
    rupiah: rupiah,
  };
})();
