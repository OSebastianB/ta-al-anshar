/**
 * Penjadwalan Pembelajaran Otomatis — CSP + Backtracking
 * -------------------------------------------------------
 * Constraint Satisfaction Problem (CSP):
 *   - Variables  : setiap sesi kebutuhan belajar (kelas–mapel–guru × jam/minggu)
 *   - Domain     : kombinasi (hari, slot pelajaran) yang tersedia bagi guru
 *   - Constraints: hard constraints (bentrok guru/kelas, istirahat, kuota harian, alokasi)
 *
 * Algoritma: Backtracking dengan heuristik MRV (Minimum Remaining Values)
 * agar variabel dengan domain tersisa paling sedikit dipilih lebih dulu.
 */
(function (global) {
  /**
   * Bangun daftar variabel CSP dari alokasi jam pelajaran.
   * Satu alokasi N jam/minggu menghasilkan N variabel sesi.
   */
  function buildSchedulingVariables(config) {
    var vars = [];
    (config.alokasi || []).forEach(function (a) {
      var jam = Number(a.jamPerMinggu) || 0;
      for (var i = 0; i < jam; i++) {
        vars.push({
          id: a.id + "-s" + (i + 1),
          alokasiId: a.id,
          kelas: a.kelas,
          mapel: a.mapel,
          kode: a.kode,
          guruId: a.guruId,
          guru: a.guru,
          sesi: i + 1,
          totalSesi: jam,
        });
      }
    });
    return vars;
  }

  function slotPelajaran(config) {
    return (config.waktu.slots || []).filter(function (s) {
      return s.jenis === "pelajaran";
    });
  }

  function guruById(config, id) {
    return (config.guru || []).filter(function (g) {
      return g.id === id;
    })[0];
  }

  /**
   * Domain awal untuk satu variabel: semua slot pelajaran pada hari kerja
   * yang masuk ketersediaan guru pengampu.
   */
  function getAvailableDomain(variable, config) {
    var guru = guruById(config, variable.guruId);
    var domain = [];
    var slots = slotPelajaran(config);
    (config.waktu.hari || []).forEach(function (hari) {
      var boleh = (guru && guru.ketersediaan && guru.ketersediaan[hari]) || [];
      slots.forEach(function (slot) {
        if (boleh.indexOf(slot.id) < 0) return;
        domain.push({
          hari: hari,
          slotId: slot.id,
          mulai: slot.mulai,
          selesai: slot.selesai,
          label: slot.label || "Slot " + slot.id,
          key: hari + "|" + slot.id,
        });
      });
    });
    return domain;
  }

  function buildDomains(variables, config) {
    var domains = {};
    variables.forEach(function (v) {
      domains[v.id] = getAvailableDomain(v, config);
    });
    return domains;
  }

  /**
   * Soft prefilter: buang nilai domain yang sudah pasti bentrok dengan assignment saat ini.
   * Digunakan sebagai forward checking ringan setelah setiap penempatan.
   */
  function pruneDomain(domain, variable, assignment, config) {
    return domain.filter(function (val) {
      return isValidAssignment(assignment, variable, val, config);
    });
  }

  /**
   * Hard constraints — true jika penempatan valid.
   * 1) Guru tidak mengajar dua kelas di waktu sama
   * 2) Kelas tidak punya dua mapel di waktu sama
   * 3) Slot harus di ketersediaan guru
   * 4) Bukan jam istirahat (domain sudah difilter; dicek ulang)
   * 5) Alokasi dipenuhi di level variabel (setiap sesi satu slot)
   * 6) Jam mengajar guru/hari ≤ maxJamPerHari
   * 7) Data sesi lengkap (kelas, mapel, guru, hari, jam)
   */
  function isValidAssignment(assignment, variable, value, config) {
    if (!variable || !value) return false;
    if (!variable.kelas || !variable.mapel || !variable.guru || !value.hari || !value.mulai) {
      return false;
    }

    var slotMeta = (config.waktu.slots || []).filter(function (s) {
      return s.id === value.slotId;
    })[0];
    if (!slotMeta || slotMeta.jenis === "istirahat") return false;

    var guru = guruById(config, variable.guruId);
    if (!guru) return false;
    var avail = (guru.ketersediaan && guru.ketersediaan[value.hari]) || [];
    if (avail.indexOf(value.slotId) < 0) return false;

    var jamHariGuru = 0;
    var keys = Object.keys(assignment);
    for (var i = 0; i < keys.length; i++) {
      var otherVarId = keys[i];
      var otherVal = assignment[otherVarId];
      if (!otherVal) continue;
      var otherVar = config._varIndex[otherVarId];
      if (!otherVar) continue;

      if (otherVal.key === value.key) {
        if (otherVar.guruId === variable.guruId) return false;
        if (otherVar.kelas === variable.kelas) return false;
      }

      if (otherVar.guruId === variable.guruId && otherVal.hari === value.hari) {
        jamHariGuru += 1;
      }
    }

    if (jamHariGuru + 1 > (guru.maxJamPerHari || 99)) return false;
    return true;
  }

  function selectVariableMRV(unassigned, domains) {
    var best = null;
    var bestSize = Infinity;
    for (var i = 0; i < unassigned.length; i++) {
      var v = unassigned[i];
      var size = (domains[v.id] || []).length;
      if (size < bestSize) {
        bestSize = size;
        best = v;
      }
    }
    return best;
  }

  /**
   * Backtracking rekursif.
   * Mengembalikan true jika seluruh variabel berhasil di-assign.
   */
  function backtrack(assignment, unassigned, domains, config, stats) {
    if (unassigned.length === 0) return true;

    var variable = selectVariableMRV(unassigned, domains);
    if (!variable) return false;

    var domain = (domains[variable.id] || []).slice();
    /* LCV ringan: coba nilai yang paling sedikit memangkas domain lain dulu — di sini urut alami cukup */
    for (var i = 0; i < domain.length; i++) {
      var value = domain[i];
      stats.attempts += 1;

      if (!isValidAssignment(assignment, variable, value, config)) {
        stats.conflicts += 1;
        continue;
      }

      assignment[variable.id] = value;

      var nextUnassigned = unassigned.filter(function (v) {
        return v.id !== variable.id;
      });
      var saved = {};
      var failed = false;

      for (var j = 0; j < nextUnassigned.length; j++) {
        var uv = nextUnassigned[j];
        saved[uv.id] = domains[uv.id];
        var pruned = pruneDomain(domains[uv.id], uv, assignment, config);
        domains[uv.id] = pruned;
        if (pruned.length === 0) {
          failed = true;
          stats.conflicts += 1;
          break;
        }
      }

      if (!failed) {
        stats.backtracks += 1;
        if (backtrack(assignment, nextUnassigned, domains, config, stats)) {
          return true;
        }
      }

      /* Batalkan penempatan (backtrack) */
      delete assignment[variable.id];
      Object.keys(saved).forEach(function (id) {
        domains[id] = saved[id];
      });
    }

    return false;
  }

  function assignmentToSchedule(assignment, variables, config) {
    return variables.map(function (v) {
      var val = assignment[v.id];
      return {
        id: "csp-" + v.id,
        varId: v.id,
        kelas: v.kelas,
        mapel: v.mapel,
        kode: v.kode || "",
        guru: v.guru,
        guruId: v.guruId,
        hari: val.hari,
        slotId: val.slotId,
        mulai: val.mulai,
        selesai: val.selesai,
        ruang: "R. " + v.kelas,
        sumber: "csp",
      };
    });
  }

  /**
   * Validasi akhir seluruh jadwal terhadap hard constraints.
   * Angka konflik dihitung dari pelanggaran aktual, bukan angka statis.
   */
  function validateSchedule(schedule, config) {
    var issues = [];
    var byKeyGuru = {};
    var byKeyKelas = {};
    var byGuruHari = {};
    var byAlokasi = {};

    (schedule || []).forEach(function (s) {
      if (!s.kelas || !s.mapel || !s.guru || !s.hari || !s.mulai) {
        issues.push("Sesi tidak lengkap: " + (s.id || "?"));
      }

      var slotMeta = (config.waktu.slots || []).filter(function (x) {
        return x.id === s.slotId || (x.mulai === s.mulai && x.selesai === s.selesai);
      })[0];
      if (slotMeta && slotMeta.jenis === "istirahat") {
        issues.push("Pembelajaran menempati jam istirahat (" + s.hari + " " + s.mulai + ").");
      }

      var gKey = s.guru + "|" + s.hari + "|" + s.mulai;
      var kKey = s.kelas + "|" + s.hari + "|" + s.mulai;
      if (byKeyGuru[gKey]) {
        issues.push("Bentrok guru: " + s.guru + " pada " + s.hari + " " + s.mulai + ".");
      } else byKeyGuru[gKey] = true;
      if (byKeyKelas[kKey]) {
        issues.push("Bentrok kelas: " + s.kelas + " pada " + s.hari + " " + s.mulai + ".");
      } else byKeyKelas[kKey] = true;

      var gh = s.guruId + "|" + s.hari;
      byGuruHari[gh] = (byGuruHari[gh] || 0) + 1;

      var ak = s.kelas + "|" + s.mapel;
      byAlokasi[ak] = (byAlokasi[ak] || 0) + 1;

      var guru = guruById(config, s.guruId);
      if (guru) {
        var avail = (guru.ketersediaan && guru.ketersediaan[s.hari]) || [];
        var sid = s.slotId;
        if (sid == null && slotMeta) sid = slotMeta.id;
        if (avail.indexOf(sid) < 0) {
          issues.push(s.guru + " tidak tersedia pada " + s.hari + " slot " + sid + ".");
        }
      }
    });

    (config.guru || []).forEach(function (g) {
      (config.waktu.hari || []).forEach(function (h) {
        var n = byGuruHari[g.id + "|" + h] || 0;
        if (n > (g.maxJamPerHari || 99)) {
          issues.push(g.nama + " melebihi maksimal " + g.maxJamPerHari + " jam pada " + h + " (" + n + ").");
        }
      });
    });

    var alokasiOk = true;
    (config.alokasi || []).forEach(function (a) {
      var n = byAlokasi[a.kelas + "|" + a.mapel] || 0;
      if (n !== Number(a.jamPerMinggu)) {
        alokasiOk = false;
        issues.push(
          "Alokasi " + a.mapel + " kelas " + a.kelas + ": perlu " + a.jamPerMinggu + " jam, terisi " + n + "."
        );
      }
    });

    var guruOk = !issues.some(function (x) {
      return /Bentrok guru|tidak tersedia|melebihi maksimal/.test(x);
    });
    var kelasOk = !issues.some(function (x) {
      return /Bentrok kelas/.test(x);
    });
    var availOk = !issues.some(function (x) {
      return /tidak tersedia|istirahat/.test(x);
    });

    return {
      valid: issues.length === 0,
      conflicts: issues.length,
      issues: issues,
      constraintStatus: {
        guru: guruOk ? "Valid" : "Tidak Valid",
        kelas: kelasOk ? "Valid" : "Tidak Valid",
        ketersediaan: availOk ? "Valid" : "Tidak Valid",
        alokasi: alokasiOk ? "Valid" : "Tidak Valid",
      },
    };
  }

  function diagnoseFailure(variables, domains, config) {
    var reasons = [];
    var totalNeed = variables.length;
    var capacity = 0;
    (config.kelas || []).forEach(function () {
      capacity += (config.waktu.hari || []).length * slotPelajaran(config).length;
    });
    if (totalNeed > capacity) {
      reasons.push("Alokasi jam pembelajaran (" + totalNeed + " sesi) melebihi kapasitas slot kelas (" + capacity + ").");
    }

    var empty = variables.filter(function (v) {
      return !(domains[v.id] && domains[v.id].length);
    });
    if (empty.length) {
      reasons.push(
        "Guru memiliki ketersediaan waktu yang terlalu terbatas untuk " +
          empty.length +
          " sesi (contoh: " +
          empty[0].mapel +
          " · " +
          empty[0].kelas +
          " · " +
          empty[0].guru +
          ")."
      );
    }

    var load = {};
    variables.forEach(function (v) {
      load[v.guruId] = (load[v.guruId] || 0) + 1;
    });
    Object.keys(load).forEach(function (gid) {
      var g = guruById(config, gid);
      if (!g) return;
      var maxWeek = (config.waktu.hari || []).length * (g.maxJamPerHari || 0);
      var availCount = 0;
      (config.waktu.hari || []).forEach(function (h) {
        availCount += ((g.ketersediaan && g.ketersediaan[h]) || []).length;
      });
      var cap = Math.min(maxWeek, availCount);
      if (load[gid] > cap) {
        reasons.push(
          "Beban " + g.nama + " (" + load[gid] + " sesi) melebihi kapasitas mingguan (" + cap + ")."
        );
      }
    });

    if (!reasons.length) {
      reasons.push(
        "Terjadi konflik antara kebutuhan kelas dan ketersediaan guru sehingga tidak ditemukan kombinasi yang memenuhi seluruh hard constraints."
      );
    }
    return reasons;
  }

  /**
   * Titik masuk utama: generateSchedule(config) → hasil + statistik proses.
   */
  function generateSchedule(config) {
    var started = typeof performance !== "undefined" ? performance.now() : Date.now();
    var variables = buildSchedulingVariables(config);
    config._varIndex = {};
    variables.forEach(function (v) {
      config._varIndex[v.id] = v;
    });

    var domains = buildDomains(variables, config);
    var stats = {
      attempts: 0,
      conflicts: 0,
      backtracks: 0,
      totalNeed: variables.length,
      scheduled: 0,
    };

    var emptyDomain = variables.some(function (v) {
      return !domains[v.id].length;
    });

    var assignment = {};
    var ok = false;
    if (!emptyDomain && variables.length > 0) {
      ok = backtrack(assignment, variables.slice(), domains, config, stats);
    }

    var elapsed =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - started;

    if (!ok) {
      var failReasons = diagnoseFailure(variables, buildDomains(variables, config), config);
      return {
        success: false,
        schedule: [],
        stats: {
          status: "Gagal",
          totalNeed: stats.totalNeed,
          scheduled: 0,
          conflicts: stats.conflicts,
          attempts: stats.attempts,
          backtracks: stats.backtracks,
          elapsedMs: Math.round(elapsed * 10) / 10,
          constraintStatus: {
            guru: "Tidak Valid",
            kelas: "Tidak Valid",
            ketersediaan: "Tidak Valid",
            alokasi: "Tidak Valid",
          },
          reasons: failReasons,
          issues: failReasons,
        },
      };
    }

    var schedule = assignmentToSchedule(assignment, variables, config);
    var validation = validateSchedule(schedule, config);
    stats.scheduled = schedule.length;

    /* Jangan pernah sukses jika validasi akhir masih menemukan pelanggaran */
    var success = validation.valid && schedule.length === variables.length;

    return {
      success: success,
      schedule: success ? schedule : [],
      stats: {
        status: success ? "Berhasil" : "Gagal",
        totalNeed: stats.totalNeed,
        scheduled: success ? schedule.length : 0,
        conflicts: validation.conflicts,
        attempts: stats.attempts,
        backtracks: stats.backtracks,
        elapsedMs: Math.round(elapsed * 10) / 10,
        constraintStatus: validation.constraintStatus,
        reasons: success ? [] : validation.issues.concat(diagnoseFailure(variables, domains, config)),
        issues: validation.issues,
      },
    };
  }

  /**
   * Validasi perubahan manual satu slot terhadap jadwal yang ada.
   */
  function validateManualChange(schedule, draft, config) {
    var next = (schedule || []).filter(function (s) {
      return s.id !== draft.id;
    }).concat([draft]);
    return validateSchedule(next, config);
  }

  global.CspScheduler = {
    generateSchedule: generateSchedule,
    backtrack: backtrack,
    isValidAssignment: isValidAssignment,
    buildSchedulingVariables: buildSchedulingVariables,
    getAvailableDomain: getAvailableDomain,
    validateSchedule: validateSchedule,
    validateManualChange: validateManualChange,
  };
})(window);
