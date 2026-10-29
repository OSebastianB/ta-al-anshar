/* Data mentah + agregat terhitung. Satu sumber untuk Modul 1, 2, dan 3. */
(function () {
  var HARI_INI = "2026-10-29";
  var PERIODE = ["Juli", "Agustus", "September", "Oktober"];
  var KELAS = ["IV-A", "IV-B", "V-A", "V-B", "VI-A"];
  var MAPEL = ["Matematika", "Bahasa Indonesia", "IPA", "Pendidikan Agama Islam", "PPKn"];
  var MAPEL_GRAFIK = ["Matematika", "Bahasa Indonesia", "IPA"];
  var OFFSET = { Matematika: -1, "Bahasa Indonesia": 1, IPA: 0, "Pendidikan Agama Islam": 0, PPKn: 0 };
  var GURU = {
    Matematika: "Bu Ratna Sari",
    "Bahasa Indonesia": "Bu Lestari Aminah",
    IPA: "Pak Hendra Wijaya",
    "Pendidikan Agama Islam": "Pak Yusuf Hakim",
    PPKn: "Bu Dewi Kartika",
  };
  var JAM = [
    ["07.00", "07.40"],
    ["07.40", "08.20"],
    ["08.35", "09.15"],
    ["09.15", "09.55"],
  ];
  var HARI_NAMA = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  var BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

  var ROSTER = {
    "IV-A": [
      ["Siti Aulia", "2024410006"],
      ["Bima Sakti", "2024410018"],
      ["Gita Nirmala", "2024410007"],
      ["Bayu Pratama", "2024410004"],
      ["Daffa Ramadhan", "2024410002"],
      ["Intan Permata", "2024410003"],
      ["Yoga Saputra", "2024410005"],
      ["Kirana Melati", "2024410009"],
      ["Fajar Nugroho", "2024410010"],
      ["Maya Anggraini", "2024410011"],
    ],
    "IV-B": [
      ["Nadia Putri", "2024420008"],
      ["Eka Putri", "2024420012"],
      ["Laila Zahra", "2024420019"],
      ["Farhan Aziz", "2024420004"],
      ["Putri Anindya", "2024420001"],
      ["Raka Firmansyah", "2024420002"],
      ["Salma Nur", "2024420003"],
      ["Tegar Mahendra", "2024420005"],
      ["Ulfa Karima", "2024420006"],
      ["Vino Aditya", "2024420007"],
    ],
    "V-A": [
      ["Ahmad Fauzan", "2024510001"],
      ["Aisyah Rahma", "2024510024"],
      ["Dimas Pratama", "2024510011"],
      ["Andika Putra", "2024510030"],
      ["Bagus Setiawan", "2024510002"],
      ["Chika Amelia", "2024510003"],
      ["Danu Saputra", "2024510004"],
      ["Elisa Putri", "2024510005"],
      ["Fikri Rahman", "2024510006"],
      ["Gina Maharani", "2024510007"],
    ],
    "V-B": [
      ["Rizky Maulana", "2024520015"],
      ["Citra Lestari", "2024520003"],
      ["Hana Safira", "2024520009"],
      ["Ilham Prasetyo", "2024520001"],
      ["Jihan Aulia", "2024520002"],
      ["Kevin Ardi", "2024520004"],
      ["Laras Wulandari", "2024520005"],
      ["Marco Saputra", "2024520006"],
      ["Nisa Kamila", "2024520007"],
      ["Omar Fadhil", "2024520008"],
    ],
    "VI-A": [
      ["Salsa Melati", "2024610002"],
      ["Arka Wijaya", "2024610004"],
      ["Bella Safitri", "2024610001"],
      ["Cahya Ramadan", "2024610003"],
      ["Dewi Lestari", "2024610005"],
      ["Elang Pradipta", "2024610006"],
      ["Fitri Handayani", "2024610007"],
      ["Galang Tirta", "2024610008"],
      ["Hesti Amalia", "2024610009"],
      ["Irfan Maulana", "2024610010"],
    ],
  };

  /* Pola bulanan keseluruhan: [Jul, Agu, Sep, Okt]. Lainnya dihitung naik pelan. */
  var POLA = {
    "2024510001": [74, 75, 76, 68],
    "2024420008": [71, 70, 68, 64],
    "2024520015": [80, 82, 83, 72],
    "2024610002": [81, 82, 82, 83],
    "2024410004": [79, 80, 80, 81],
    "2024510024": [86, 88, 89, 90],
  };

  var BELUM = {
    "2024420008": ["t2", "t9", "t13"],
    "2024510001": ["t5"],
    "2024410004": ["t4", "t10", "t16"],
  };

  var TERLAMBAT = {
    "2024510011": ["t5"],
    "2024410018": ["t4"],
    "2024420019": ["t2"],
  };

  var TUGAS = [
    ["t1", "Kuis Pecahan", "Matematika", "V-A", "2026-10-30", "Pilihan Ganda", "Aktif", 15, "Kuis objektif 20 soal tentang pecahan."],
    ["t2", "Latihan Teks Narasi", "Bahasa Indonesia", "IV-B", "2026-10-31", "Tugas Fisik", "Aktif", 20, "Menulis teks narasi, dikumpulkan di kelas."],
    ["t3", "Evaluasi IPA", "IPA", "V-B", "2026-10-25", "Pilihan Ganda", "Selesai", 25, "Evaluasi bab rangkaian listrik."],
    ["t4", "Operasi Hitung Campuran", "Matematika", "IV-A", "2026-10-28", "Pilihan Ganda", "Aktif", 15, "Latihan 15 soal operasi hitung."],
    ["t5", "Laporan Pengamatan Tumbuhan", "IPA", "V-A", "2026-10-29", "Tugas Fisik", "Aktif", 20, "Laporan pengamatan tumbuhan di sekolah."],
    ["t6", "Membaca Intensif", "Bahasa Indonesia", "V-B", "2026-10-27", "Esai", "Aktif", 15, "Pertanyaan esai berdasarkan teks bacaan."],
    ["t7", "UTS Matematika", "Matematika", "VI-A", "2026-10-20", "Pilihan Ganda", "Selesai", 30, "Ujian tengah semester Matematika."],
    ["t8", "Praktik Wudhu", "Pendidikan Agama Islam", "IV-A", "2026-11-01", "Tugas Fisik", "Dijadwalkan", 15, "Praktik dinilai langsung oleh guru."],
    ["t9", "Kuis Tata Surya", "IPA", "IV-B", "2026-10-26", "Pilihan Ganda", "Aktif", 15, "Kuis 20 soal anggota tata surya."],
    ["t10", "Menulis Pantun", "Bahasa Indonesia", "IV-A", "2026-10-30", "Esai", "Aktif", 10, "Menulis 4 bait pantun tema sekolah."],
    ["t11", "Latihan Pecahan Senilai", "Matematika", "V-B", "2026-11-02", "Pilihan Ganda", "Dijadwalkan", 10, "Latihan lanjutan pecahan senilai."],
    ["t12", "Ujian IPA Bab 2", "IPA", "V-A", "2026-10-18", "Pilihan Ganda", "Selesai", 25, "Ujian bab 2 IPA kelas V."],
    ["t13", "Latihan Menulis Deskripsi", "Bahasa Indonesia", "IV-B", "2026-10-22", "Esai", "Aktif", 15, "Paragraf deskripsi benda di kelas."],
    ["t14", "Kuis Bilangan", "Matematika", "IV-B", "2026-10-15", "Pilihan Ganda", "Selesai", 15, "Kuis bilangan bulat dan pecahan."],
    ["t15", "Ringkasan Bacaan", "Bahasa Indonesia", "VI-A", "2026-10-24", "Esai", "Aktif", 15, "Ringkasan bacaan 1 halaman."],
    ["t16", "Ringkasan Percobaan IPA", "IPA", "IV-A", "2026-10-21", "Tugas Fisik", "Aktif", 15, "Catatan percobaan sederhana."],
  ];

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function isoLabel(iso) {
    var p = iso.split("-");
    return Number(p[2]) + " " + BULAN[Number(p[1]) - 1] + " " + p[0];
  }

  function addDays(iso, n) {
    var d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() + n);
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function hariDari(iso) {
    return HARI_NAMA[new Date(iso + "T00:00:00").getDay()];
  }

  function schoolDays(from, to) {
    var out = [];
    var d = new Date(from + "T00:00:00");
    var end = new Date(to + "T00:00:00");
    while (d <= end) {
      var wd = d.getDay();
      if (wd !== 0 && wd !== 6) out.push(d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()));
      d.setDate(d.getDate() + 1);
    }
    return out;
  }

  function clamp(n) {
    return Math.max(50, Math.min(100, Math.round(n)));
  }

  function round1(n) {
    return Math.round(n * 10) / 10;
  }

  function rata(arr) {
    if (!arr.length) return 0;
    var s = 0;
    arr.forEach(function (n) {
      s += n;
    });
    return round1(s / arr.length);
  }

  function trenLabel(delta) {
    if (delta >= 2) return "Meningkat";
    if (delta <= -2) return "Menurun";
    return "Stabil";
  }

  function pendek(nama) {
    var p = nama.split(" ");
    return p[0] + " " + p[1].charAt(0) + ".";
  }

  var hariSekolah = schoolDays("2026-10-01", HARI_INI);
  var absenNadia = {};
  var absenSalsa = {};
  [0, 3, 7, 11, 15, 19].forEach(function (i) {
    if (hariSekolah[i]) absenNadia[hariSekolah[i]] = "Alpa";
  });
  [2, 5, 9, 12, 16, 20].forEach(function (i) {
    if (hariSekolah[i]) absenSalsa[hariSekolah[i]] = "Alpa";
  });

  var siswa = [];
  var idx = 0;
  KELAS.forEach(function (kelas) {
    ROSTER[kelas].forEach(function (pair) {
      var nama = pair[0];
      var nis = pair[1];
      var bulanan = POLA[nis] || [78 + (idx % 8), 79 + (idx % 8), 80 + (idx % 8), 81 + (idx % 8)];
      var akhir = bulanan[3];
      var sebelumnya = bulanan[2];
      var nilaiMapel = {};
      MAPEL.forEach(function (mapel) {
        var off = OFFSET[mapel];
        var hist = bulanan.map(function (v) {
          return clamp(v + off);
        });
        var a = hist[3];
        nilaiMapel[mapel] = {
          tugas: clamp(a + 1),
          kuis: clamp(a - 1),
          ujian: a,
          akhir: a,
          historis: hist,
          tren: trenLabel(hist[3] - hist[2]),
        };
      });
      siswa.push({
        id: "s" + nis,
        nama: nama,
        namaPendek: pendek(nama),
        nis: nis,
        kelas: kelas,
        bulanan: bulanan,
        tugas: clamp(akhir + 1),
        kuis: clamp(akhir - 1),
        ujian: akhir,
        akhir: akhir,
        rataRata: akhir,
        nilaiSebelumnya: sebelumnya,
        perubahan: akhir - sebelumnya,
        tren: trenLabel(akhir - sebelumnya),
        nilaiMapel: nilaiMapel,
        catatanGuru: "",
      });
      idx += 1;
    });
  });

  function byNis(nis) {
    return siswa.filter(function (s) {
      return s.nis === nis;
    })[0];
  }

  var tugas = TUGAS.map(function (t) {
    return {
      id: t[0],
      judul: t[1],
      mapel: t[2],
      kelas: t[3],
      iso: t[4],
      tenggat: isoLabel(t[4]),
      jenis: t[5],
      status: t[6],
      bobot: t[7],
      skorMaks: 100,
      deskripsi: t[8],
    };
  });

  var pengumpulan = [];
  tugas.forEach(function (t) {
    if (t.status === "Dijadwalkan") return;
    siswa
      .filter(function (s) {
        return s.kelas === t.kelas;
      })
      .forEach(function (s) {
        var belum = (BELUM[s.nis] || []).indexOf(t.id) >= 0;
        var telat = !belum && (TERLAMBAT[s.nis] || []).indexOf(t.id) >= 0;
        var status = belum ? "Belum Dikumpulkan" : telat ? "Terlambat" : "Sudah Dikumpulkan";
        var dinilai = !belum && !telat && t.status === "Selesai";
        var komponen = s.nilaiMapel[t.mapel] || s;
        pengumpulan.push({
          id: "p-" + t.id + "-" + s.nis,
          nama: s.nama,
          nis: s.nis,
          kelas: s.kelas,
          mapel: t.mapel,
          tugas: t.judul,
          tugasId: t.id,
          tanggal: belum ? "—" : telat ? isoLabel(addDays(t.iso, 1)) + ", 07.20" : isoLabel(addDays(t.iso, -1)) + ", 10.05",
          status: status,
          penilaian: dinilai ? "Sudah Dinilai" : "Belum Dinilai",
          jenis: t.jenis === "Tugas Fisik" ? "Fisik di kelas" : "Digital",
          nilai: dinilai ? komponen.kuis : null,
          siswaId: s.id,
        });
      });
  });

  siswa.forEach(function (s) {
    s.tugasBelum = pengumpulan.filter(function (p) {
      return p.nis === s.nis && p.status === "Belum Dikumpulkan";
    }).length;
  });

  var kehadiran = [];
  siswa.forEach(function (s) {
    hariSekolah.forEach(function (iso) {
      var status = "Hadir";
      if (s.nis === "2024420008" && absenNadia[iso]) status = absenNadia[iso];
      else if (s.nis === "2024610002" && absenSalsa[iso]) status = absenSalsa[iso];
      else if (s.nis !== "2024420008" && s.nis !== "2024610002") {
        var slot = hariSekolah.indexOf(iso);
        if (slot === 4) status = "Izin";
        else if (slot === 9 && s.nis.slice(-1) === "3") status = "Sakit";
        else if (slot === 14 && s.nis.slice(-1) === "6") status = "Terlambat";
      }
      if (s.nis === "2024420008" && !absenNadia[iso] && iso === HARI_INI) status = "Terlambat";
      if (s.nis === "2024510001" && iso === HARI_INI) status = "Terlambat";
      var ket =
        status === "Hadir"
          ? "—"
          : status === "Terlambat"
            ? "Tiba setelah bel masuk"
            : status === "Izin"
              ? "Keperluan keluarga"
              : status === "Sakit"
                ? "Demam"
                : "Tanpa keterangan";
      var waktu = status === "Hadir" ? "06.50" : status === "Terlambat" ? "07.18" : "—";
      kehadiran.push({
        id: "h-" + s.nis + "-" + iso,
        siswaId: s.id,
        nama: s.nama,
        nis: s.nis,
        kelas: s.kelas,
        tanggal: iso,
        tanggalLabel: isoLabel(iso),
        waktu: waktu,
        status: status,
        keterangan: ket,
      });
    });
  });

  siswa.forEach(function (s) {
    var rec = kehadiran.filter(function (k) {
      return k.nis === s.nis;
    });
    var hadir = rec.filter(function (k) {
      return k.status === "Hadir" || k.status === "Terlambat";
    }).length;
    s.jumlahHadir = hadir;
    s.jumlahCatatan = rec.length;
    s.persenHadir = rec.length ? round1((hadir / rec.length) * 100) : 0;
  });

  var ambang = { nilai: 70, turun: 10, hadir: 80, tugas: 3 };

  function alasanSiswa(s, a) {
    var list = [];
    if (s.rataRata < a.nilai) list.push({ kode: "nilai", teks: "Rata-rata nilai di bawah " + a.nilai });
    if (s.nilaiSebelumnya - s.rataRata >= a.turun) {
      list.push({
        kode: "turun",
        teks: "Nilai turun " + (s.nilaiSebelumnya - s.rataRata) + " poin dari periode sebelumnya",
      });
    }
    if (s.persenHadir < a.hadir) list.push({ kode: "hadir", teks: "Kehadiran di bawah " + a.hadir + "%" });
    if (s.tugasBelum >= a.tugas) list.push({ kode: "tugas", teks: s.tugasBelum + " tugas belum dikumpulkan" });
    return list;
  }

  function rekomendasi(list) {
    var map = {
      nilai: "Tinjau perkembangan belajar",
      turun: "Evaluasi bersama wali kelas",
      hadir: "Periksa rekap kehadiran",
      tugas: "Periksa pengumpulan tugas",
    };
    if (!list.length) return "Tidak perlu tindak lanjut khusus";
    return list
      .map(function (x) {
        return map[x.kode];
      })
      .join(" · ");
  }

  function terapkanAmbang(a) {
    ambang.nilai = Number(a.nilai);
    ambang.turun = Number(a.turun);
    ambang.hadir = Number(a.hadir);
    ambang.tugas = Number(a.tugas);
    siswa.forEach(function (s) {
      s.alasanList = alasanSiswa(s, ambang);
      s.indikator = s.alasanList.length
        ? s.alasanList
            .map(function (x) {
              return x.teks;
            })
            .join("; ")
        : "";
      s.tindakLanjut = s.alasanList.length ? rekomendasi(s.alasanList) : "—";
      s.rekomendasi = s.alasanList.length ? "Perlu ditinjau guru — " + s.tindakLanjut : "Tidak masuk daftar tinjauan";
      s.alasan = s.indikator;
      s.trenBulanan = s.bulanan.slice();
    });
    var perhatian = siswa.filter(function (s) {
      return s.alasanList.length;
    });
    data.siswaPerhatian = perhatian;
    data.kpiAnalisis = {
      perluDitinjau: perhatian.length,
      trenMenurun: siswa.filter(function (s) {
        return s.perubahan <= -ambang.turun;
      }).length,
      hadirRendah: siswa.filter(function (s) {
        return s.persenHadir < ambang.hadir;
      }).length,
      tugasKurang: siswa.filter(function (s) {
        return s.tugasBelum >= ambang.tugas;
      }).length,
    };
  }

  var jadwal = [];
  var hariKerja = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
  KELAS.forEach(function (kelas, ci) {
    hariKerja.forEach(function (hari, di) {
      JAM.forEach(function (jam, si) {
        var mapel = MAPEL[(ci + di + si) % MAPEL.length];
        jadwal.push({
          id: "j-" + kelas + "-" + hari + "-" + si,
          kelas: kelas,
          hari: hari,
          mulai: jam[0],
          selesai: jam[1],
          mapel: mapel,
          guru: GURU[mapel],
          ruang: "R. " + kelas,
        });
      });
    });
  });

  var pg = {
    total: pengumpulan.length,
    terkumpul: pengumpulan.filter(function (p) {
      return p.status === "Sudah Dikumpulkan";
    }).length,
    terlambat: pengumpulan.filter(function (p) {
      return p.status === "Terlambat";
    }).length,
    belum: pengumpulan.filter(function (p) {
      return p.status === "Belum Dikumpulkan";
    }).length,
  };
  pg.persenTerkumpul = Math.round((pg.terkumpul / pg.total) * 100);
  pg.persenTerlambat = Math.round((pg.terlambat / pg.total) * 100);
  pg.persenBelum = Math.round((pg.belum / pg.total) * 100);

  var trenSeries = MAPEL_GRAFIK.map(function (mapel) {
    return {
      label: mapel === "Bahasa Indonesia" ? "B. Indonesia" : mapel,
      data: PERIODE.map(function (_, mi) {
        return rata(
          siswa.map(function (s) {
            return s.nilaiMapel[mapel].historis[mi];
          })
        );
      }),
    };
  });

  var rataMapel = ["Matematika", "Bahasa Indonesia", "IPA", "Pendidikan Agama Islam"].map(function (mapel) {
    return {
      mapel: mapel === "Bahasa Indonesia" ? "B. Indonesia" : mapel === "Pendidikan Agama Islam" ? "PAI" : mapel,
      nilai: rata(
        siswa.map(function (s) {
          return s.nilaiMapel[mapel].akhir;
        })
      ),
    };
  });

  var akhirSemua = siswa.map(function (s) {
    return s.akhir;
  });

  var pegawai = [
    ["pg1", "Bu Ratna Sari", "19840312001", "Guru"],
    ["pg2", "Bu Lestari Aminah", "19860715002", "Guru"],
    ["pg3", "Pak Hendra Wijaya", "19821108003", "Guru"],
    ["pg4", "Pak Yusuf Hakim", "19790522004", "Guru"],
    ["pg5", "Bu Dewi Kartika", "19910217005", "Guru"],
    ["pg6", "Pak Budi Santoso", "19880830006", "Tata Usaha"],
    ["pg7", "Bu Nina Marlina", "19930411007", "Perpustakaan"],
    ["pg8", "Pak Agus Wirawan", "19851205008", "Keamanan"],
  ].map(function (p) {
    return { id: p[0], nama: p[1], nip: p[2], unit: p[3] };
  });

  var kehadiranPegawai = [];
  pegawai.forEach(function (p, pi) {
    hariSekolah.forEach(function (iso, hi) {
      var status = "Hadir";
      if (p.id === "pg8" && (hi % 7 === 0 || iso === HARI_INI)) status = "Terlambat";
      if (p.id === "pg6" && iso === HARI_INI) status = "Izin";
      if (p.id === "pg7" && hi === 10) status = "Sakit";
      var ket = status === "Hadir" ? "—" : status === "Terlambat" ? "Tiba setelah jam masuk" : status === "Izin" ? "Keperluan keluarga" : "Sakit";
      kehadiranPegawai.push({
        id: "hp-" + p.id + "-" + iso,
        pegawaiId: p.id,
        nama: p.nama,
        nip: p.nip,
        unit: p.unit,
        tanggal: iso,
        tanggalLabel: isoLabel(iso),
        waktu: status === "Hadir" ? "06.40" : status === "Terlambat" ? "07.10" : "—",
        status: status,
        keterangan: ket,
      });
    });
  });

  var data = {
    sekolah: {
      namaPendek: "AL-ANSHAR",
      namaSistem: "Sistem Terintegrasi",
      namaLengkap: "SD Islam Al-Anshar",
      kota: "Kota Bekasi",
    },
    pengguna: { inisial: "GA", nama: "Guru Akademik", peran: "Guru" },
    peranContoh: {
      admin: { inisial: "AD", nama: "Admin Sekolah", peran: "Admin Sekolah" },
      guru: {
        inisial: "RS",
        nama: "Bu Ratna Sari",
        peran: "Guru / Wali Kelas",
        mapel: "Matematika",
        waliKelas: "V-A",
      },
      orangtua: {
        inisial: "SR",
        nama: "Siti Rahmawati",
        peran: "Orang Tua",
      },
    },
    hariIni: HARI_INI,
    hariIniLabel: isoLabel(HARI_INI),
    hariIniNama: hariDari(HARI_INI),
    periode: PERIODE,
    kelas: KELAS,
    mapel: MAPEL,
    guruMap: GURU,
    hariKerja: hariKerja,
    jamSlot: JAM,
    semester: ["Ganjil 2026/2027", "Genap 2025/2026"],
    ambang: ambang,
    siswa: siswa,
    tugas: tugas,
    pengumpulan: pengumpulan,
    kehadiran: kehadiran,
    pegawai: pegawai,
    kehadiranPegawai: kehadiranPegawai,
    orangTua: {
      nama: "Siti Rahmawati",
      hubungan: "Ibu",
      anakNis: ["2024510001"],
    },
    jadwal: jadwal,
    kpi: {
      siswaAktif: siswa.length,
      tugasAktif: tugas.filter(function (t) {
        return t.status === "Aktif";
      }).length,
      belumDinilai: pengumpulan.filter(function (p) {
        return p.status !== "Belum Dikumpulkan" && p.penilaian === "Belum Dinilai";
      }).length,
      rataRataNilai: rata(akhirSemua),
    },
    pengumpulanRingkas: pg,
    trenNilai: { labels: PERIODE, series: trenSeries },
    rataMapel: rataMapel,
    ringkasanKelas: {
      rataRata: rata(akhirSemua),
      tertinggi: Math.max.apply(null, akhirSemua),
      terendah: Math.min.apply(null, akhirSemua),
      jumlahSiswa: siswa.length,
    },
    aturanAnalisis: [
      { no: 1, teks: "Rata-rata nilai di bawah ambang" },
      { no: 2, teks: "Penurunan nilai dari periode sebelumnya" },
      { no: 3, teks: "Kehadiran di bawah ambang" },
      { no: 4, teks: "Tugas belum dikumpulkan mencapai ambang" },
    ],
    kuisOtomatis: tugas
      .filter(function (t) {
        return t.jenis === "Pilihan Ganda" && t.status !== "Dijadwalkan";
      })
      .map(function (t) {
        return {
          id: t.id,
          nama: t.judul,
          mapel: t.mapel,
          kelas: t.kelas,
          jumlahSoal: t.id === "t4" ? 15 : t.id === "t7" ? 30 : 20,
          jumlahSiswa: siswa.filter(function (s) {
            return s.kelas === t.kelas;
          }).length,
          status: t.status === "Selesai" ? "Selesai dinilai" : "Menunggu",
        };
      }),
    contohHasilOtomatis: {
      siswa: "Aisyah Rahma",
      kuis: "Kuis Pecahan",
      kelas: "V-A",
      totalSoal: 20,
      benar: 16,
      salah: 4,
      skor: 80,
      skorMaks: 100,
      soal: [
        { no: 1, teks: "Hasil dari 1/2 + 1/4 adalah …", jawaban: "3/4", kunci: "3/4", benar: true },
        { no: 2, teks: "Hasil dari 3/5 − 1/5 adalah …", jawaban: "1/5", kunci: "2/5", benar: false },
        { no: 3, teks: "Hasil dari 2/3 × 3/4 adalah …", jawaban: "1/2", kunci: "1/2", benar: true },
        { no: 4, teks: "Hasil dari 4/5 : 2/5 adalah …", jawaban: "2", kunci: "2", benar: true },
      ],
    },
    isoLabel: isoLabel,
    byNis: byNis,
    terapkanAmbang: terapkanAmbang,
  };

  data.penilaianManual = pengumpulan
    .filter(function (p) {
      var t = tugas.filter(function (x) {
        return x.id === p.tugasId;
      })[0];
      return t && t.jenis !== "Pilihan Ganda" && p.status !== "Belum Dikumpulkan";
    })
    .map(function (p) {
      return {
        id: "m-" + p.id,
        nama: p.nama,
        kelas: p.kelas,
        tugas: p.tugas,
        skorMaks: 100,
        nilai: p.nilai,
        catatan: p.nilai === null ? "" : "Umpan balik contoh untuk demonstrasi.",
        nis: p.nis,
      };
    });

  data.rekapNilai = siswa.map(function (s) {
    return {
      nama: s.nama,
      kelas: s.kelas,
      tugas: s.tugas,
      kuis: s.kuis,
      ujian: s.ujian,
      akhir: s.akhir,
      tren: s.tren,
      mapel: "",
      nis: s.nis,
    };
  });

  terapkanAmbang(ambang);

  data.notifikasi = [
    {
      id: "n1",
      ikon: "bi-clipboard-check",
      judul: data.kpi.belumDinilai + " pengumpulan menunggu penilaian",
      waktu: "Hari ini, 08.15",
      tipe: "info",
    },
    {
      id: "n2",
      ikon: "bi-exclamation-circle",
      judul: "Nadia Putri belum mengumpulkan " + byNis("2024420008").tugasBelum + " tugas",
      waktu: "Kemarin, 16.40",
      tipe: "warning",
    },
    {
      id: "n3",
      ikon: "bi-calendar-event",
      judul: "Tenggat Kuis Pecahan: 30 Oktober 2026",
      waktu: "Besok",
      tipe: "info",
    },
  ];

  window.APP_DATA = data;
})();
