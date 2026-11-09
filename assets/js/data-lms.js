/* Dummy data LMS — SD Islam Al-Anshar (frontend mockup) */
(function () {
  var D = window.APP_DATA;
  if (!D) return;

  D.peranContoh.siswa = {
    inisial: "AF",
    nama: "Ahmad Fauzan",
    peran: "Siswa",
    nis: "2024510001",
    kelas: "V-A",
  };
  D.peranContoh.kepsek = {
    inisial: "KS",
    nama: "Pak Hidayat Rahman",
    peran: "Kepala Sekolah",
  };

  var materi = [
    {
      id: "m1",
      judul: "Pecahan Senilai — Modul PDF",
      mapel: "Matematika",
      kelas: "V-A",
      tipe: "PDF",
      file: "pecahan-senilai.pdf",
      ukuran: "1,2 MB",
      status: "Published",
      tanggal: "2026-10-20",
      tanggalLabel: "20 Okt 2026",
      guru: "Bu Ratna Sari",
      deskripsi: "Penjelasan pecahan senilai dengan contoh soal latihan.",
      views: ["2024510001", "2024510024", "2024510011"],
    },
    {
      id: "m2",
      judul: "Video: Menyederhanakan Pecahan",
      mapel: "Matematika",
      kelas: "V-A",
      tipe: "Video",
      file: "menyederhanakan-pecahan.mp4",
      ukuran: "48 MB",
      status: "Published",
      tanggal: "2026-10-22",
      tanggalLabel: "22 Okt 2026",
      guru: "Bu Ratna Sari",
      deskripsi: "Video pembelajaran 12 menit + ringkasan di akhir.",
      views: ["2024510001", "2024510024"],
    },
    {
      id: "m3",
      judul: "Slide IPA: Organ Pernapasan",
      mapel: "IPA",
      kelas: "V-A",
      tipe: "PPT",
      file: "organ-pernapasan.pptx",
      ukuran: "3,4 MB",
      status: "Published",
      tanggal: "2026-10-18",
      tanggalLabel: "18 Okt 2026",
      guru: "Pak Hendra Wijaya",
      deskripsi: "Presentasi organ pernapasan manusia.",
      views: ["2024510001"],
    },
    {
      id: "m4",
      judul: "Teks Narasi — Bahan Bacaan",
      mapel: "Bahasa Indonesia",
      kelas: "IV-B",
      tipe: "Dokumen",
      file: "teks-narasi.docx",
      ukuran: "420 KB",
      status: "Published",
      tanggal: "2026-10-15",
      tanggalLabel: "15 Okt 2026",
      guru: "Bu Lestari Aminah",
      deskripsi: "Contoh teks narasi untuk latihan menulis.",
      views: [],
    },
    {
      id: "m5",
      judul: "Latihan Soal Pecahan (Draft)",
      mapel: "Matematika",
      kelas: "V-A",
      tipe: "PDF",
      file: "latihan-pecahan-draft.pdf",
      ukuran: "800 KB",
      status: "Draft",
      tanggal: "2026-10-28",
      tanggalLabel: "28 Okt 2026",
      guru: "Bu Ratna Sari",
      deskripsi: "Belum dipublikasikan ke siswa.",
      views: [],
    },
    {
      id: "m6",
      judul: "PAI: Rukun Islam",
      mapel: "Pendidikan Agama Islam",
      kelas: "V-A",
      tipe: "PDF",
      file: "rukun-islam.pdf",
      ukuran: "950 KB",
      status: "Published",
      tanggal: "2026-10-10",
      tanggalLabel: "10 Okt 2026",
      guru: "Pak Yusuf Hakim",
      deskripsi: "Materi ringkas lima rukun Islam.",
      views: ["2024510001", "2024510024", "2024510011", "2024510030"],
    },
    {
      id: "m7",
      judul: "Video: Fotosintesis",
      mapel: "IPA",
      kelas: "VI-A",
      tipe: "Video",
      file: "fotosintesis.mp4",
      ukuran: "62 MB",
      status: "Published",
      tanggal: "2026-10-25",
      tanggalLabel: "25 Okt 2026",
      guru: "Pak Hendra Wijaya",
      deskripsi: "Animasi proses fotosintesis.",
      views: [],
    },
  ];

  var kuis = [
    {
      id: "k1",
      judul: "Kuis Pecahan Senilai",
      mapel: "Matematika",
      kelas: "V-A",
      jenis: "Kuis",
      durasiMenit: 20,
      batasWaktu: "2026-11-05 16:00",
      status: "Aktif",
      guru: "Bu Ratna Sari",
      soal: [
        {
          id: "k1s1",
          tipe: "pg",
          teks: "Manakah pecahan yang senilai dengan 1/2?",
          opsi: ["2/4", "2/3", "3/5", "1/3"],
          kunci: 0,
        },
        {
          id: "k1s2",
          tipe: "pg",
          teks: "Hasil penyederhanaan 4/8 adalah…",
          opsi: ["1/4", "1/2", "2/8", "4/2"],
          kunci: 1,
        },
        {
          id: "k1s3",
          tipe: "pg",
          teks: "Pecahan 3/6 senilai dengan…",
          opsi: ["1/3", "2/3", "1/2", "3/2"],
          kunci: 2,
        },
        {
          id: "k1s4",
          tipe: "esai",
          teks: "Jelaskan singkat arti pecahan senilai dengan contoh.",
          kunci: null,
        },
      ],
    },
    {
      id: "k2",
      judul: "Ujian IPA Bab Organ Pernapasan",
      mapel: "IPA",
      kelas: "V-A",
      jenis: "Ujian",
      durasiMenit: 40,
      batasWaktu: "2026-11-08 12:00",
      status: "Aktif",
      guru: "Pak Hendra Wijaya",
      soal: [
        {
          id: "k2s1",
          tipe: "pg",
          teks: "Organ utama pernapasan manusia adalah…",
          opsi: ["Jantung", "Paru-paru", "Hati", "Ginjal"],
          kunci: 1,
        },
        {
          id: "k2s2",
          tipe: "pg",
          teks: "Proses masuknya udara ke paru disebut…",
          opsi: ["Ekspirasi", "Inspirasi", "Difusi", "Osmosis"],
          kunci: 1,
        },
        {
          id: "k2s3",
          tipe: "esai",
          teks: "Sebutkan dua cara menjaga kesehatan organ pernapasan.",
          kunci: null,
        },
      ],
    },
    {
      id: "k3",
      judul: "Kuis Rukun Islam",
      mapel: "Pendidikan Agama Islam",
      kelas: "V-A",
      jenis: "Kuis",
      durasiMenit: 15,
      batasWaktu: "2026-10-30 15:00",
      status: "Selesai",
      guru: "Pak Yusuf Hakim",
      soal: [
        {
          id: "k3s1",
          tipe: "pg",
          teks: "Rukun Islam yang pertama adalah…",
          opsi: ["Salat", "Syahadat", "Zakat", "Puasa"],
          kunci: 1,
        },
        {
          id: "k3s2",
          tipe: "pg",
          teks: "Jumlah rukun Islam adalah…",
          opsi: ["3", "4", "5", "6"],
          kunci: 2,
        },
      ],
    },
  ];

  var upayaKuis = [
    {
      id: "uk1",
      kuisId: "k3",
      nis: "2024510001",
      nama: "Ahmad Fauzan",
      kelas: "V-A",
      nilaiPg: 100,
      nilaiEsai: null,
      nilaiAkhir: 100,
      status: "Selesai",
      dikerjakanPada: "2026-10-29 10:20",
      jawaban: { k3s1: 1, k3s2: 2 },
    },
    {
      id: "uk2",
      kuisId: "k3",
      nis: "2024510024",
      nama: "Aisyah Rahma",
      kelas: "V-A",
      nilaiPg: 50,
      nilaiEsai: null,
      nilaiAkhir: 50,
      status: "Selesai",
      dikerjakanPada: "2026-10-29 11:05",
      jawaban: { k3s1: 0, k3s2: 2 },
    },
  ];

  var pengumuman = [
    {
      id: "p1",
      judul: "Pengumpulan tugas pecahan diperpanjang",
      isi: "Batas pengumpulan latihan pecahan dipindah ke Jumat, 31 Oktober 2026 pukul 15.00.",
      kelas: "V-A",
      kategori: "Tugas",
      tanggal: "2026-10-28",
      tanggalLabel: "28 Okt 2026",
      penulis: "Bu Ratna Sari",
    },
    {
      id: "p2",
      judul: "Ujian IPA minggu depan",
      isi: "Ujian bab organ pernapasan dilaksanakan secara online melalui LMS. Siapkan perangkat dan koneksi stabil.",
      kelas: "V-A",
      kategori: "Ujian",
      tanggal: "2026-10-27",
      tanggalLabel: "27 Okt 2026",
      penulis: "Pak Hendra Wijaya",
    },
    {
      id: "p3",
      judul: "Materi video baru tersedia",
      isi: "Video Menyederhanakan Pecahan sudah dipublikasikan di menu Materi Pembelajaran.",
      kelas: "V-A",
      kategori: "Materi",
      tanggal: "2026-10-22",
      tanggalLabel: "22 Okt 2026",
      penulis: "Bu Ratna Sari",
    },
    {
      id: "p4",
      judul: "Info kelas IV-B: latihan menulis",
      isi: "Bahan bacaan teks narasi sudah diunggah. Kerjakan latihan di buku tulis.",
      kelas: "IV-B",
      kategori: "Umum",
      tanggal: "2026-10-16",
      tanggalLabel: "16 Okt 2026",
      penulis: "Bu Lestari Aminah",
    },
    {
      id: "p5",
      judul: "Rapat koordinasi wali kelas",
      isi: "Kepala sekolah mengundang wali kelas untuk monitoring progres LMS semester ini.",
      kelas: "Semua",
      kategori: "Umum",
      tanggal: "2026-10-26",
      tanggalLabel: "26 Okt 2026",
      penulis: "Pak Hidayat Rahman",
    },
  ];

  var kalender = [
    { id: "c1", tanggal: "2026-10-29", judul: "Kuis Rukun Islam", jenis: "Ujian", kelas: "V-A", mapel: "PAI" },
    { id: "c2", tanggal: "2026-10-31", judul: "Deadline latihan pecahan", jenis: "Deadline", kelas: "V-A", mapel: "Matematika" },
    { id: "c3", tanggal: "2026-11-02", judul: "Pembelajaran Matematika — Pecahan", jenis: "Pembelajaran", kelas: "V-A", mapel: "Matematika" },
    { id: "c4", tanggal: "2026-11-05", judul: "Batas akhir Kuis Pecahan", jenis: "Deadline", kelas: "V-A", mapel: "Matematika" },
    { id: "c5", tanggal: "2026-11-08", judul: "Ujian IPA Organ Pernapasan", jenis: "Ujian", kelas: "V-A", mapel: "IPA" },
    { id: "c6", tanggal: "2026-11-03", judul: "Pembelajaran IPA", jenis: "Pembelajaran", kelas: "V-A", mapel: "IPA" },
    { id: "c7", tanggal: "2026-11-04", judul: "Deadline teks narasi", jenis: "Deadline", kelas: "IV-B", mapel: "B. Indonesia" },
    { id: "c8", tanggal: "2026-11-10", judul: "UTS Matematika", jenis: "Ujian", kelas: "VI-A", mapel: "Matematika" },
    { id: "c9", tanggal: "2026-11-01", judul: "Pembelajaran PAI", jenis: "Pembelajaran", kelas: "V-A", mapel: "PAI" },
  ];

  /* Progress materi per siswa (published materi di kelasnya) */
  function hitungProgress(nis, kelas) {
    var published = materi.filter(function (m) {
      return m.kelas === kelas && m.status === "Published";
    });
    var dilihat = published.filter(function (m) {
      return (m.views || []).indexOf(nis) >= 0;
    }).length;
    var total = published.length || 1;
    return {
      totalMateri: published.length,
      materiSelesai: dilihat,
      persenMateri: Math.round((dilihat / total) * 100),
    };
  }

  var progressSiswa = D.siswa
    .filter(function (s) {
      return s.kelas === "V-A" || s.kelas === "IV-B" || s.kelas === "VI-A";
    })
    .map(function (s) {
      var p = hitungProgress(s.nis, s.kelas);
      var tugasKelas = D.tugas.filter(function (t) {
        return t.kelas === s.kelas && t.status !== "Dijadwalkan";
      });
      var kumpul = D.pengumpulan.filter(function (x) {
        return x.nis === s.nis;
      });
      var sudah = kumpul.filter(function (x) {
        return x.status === "Sudah Dikumpulkan" || x.status === "Terlambat";
      }).length;
      var belum = Math.max(tugasKelas.length - sudah, 0);
      var nilaiKuis = upayaKuis
        .filter(function (u) {
          return u.nis === s.nis;
        })
        .map(function (u) {
          var k = kuis.filter(function (x) {
            return x.id === u.kuisId;
          })[0];
          return {
            kuisId: u.kuisId,
            judul: k ? k.judul : u.kuisId,
            jenis: k ? k.jenis : "Kuis",
            nilai: u.nilaiAkhir,
            tanggal: u.dikerjakanPada,
          };
        });
      return {
        nis: s.nis,
        nama: s.nama,
        kelas: s.kelas,
        persenMateri: p.persenMateri,
        materiSelesai: p.materiSelesai,
        totalMateri: p.totalMateri,
        tugasSelesai: sudah,
        tugasBelum: belum,
        riwayatKuis: nilaiKuis,
        trenBulanan: s.bulanan || [70, 72, 74, 75],
      };
    });

  D.lms = {
    materi: materi,
    kuis: kuis,
    upayaKuis: upayaKuis,
    pengumuman: pengumuman,
    kalender: kalender,
    progressSiswa: progressSiswa,
    refreshProgress: function () {
      D.lms.progressSiswa = D.siswa
        .filter(function (s) {
          return ["V-A", "IV-B", "VI-A"].indexOf(s.kelas) >= 0;
        })
        .map(function (s) {
          var old = progressSiswa.filter(function (p) {
            return p.nis === s.nis;
          })[0];
          var p = hitungProgress(s.nis, s.kelas);
          var tugasKelas = D.tugas.filter(function (t) {
            return t.kelas === s.kelas && t.status !== "Dijadwalkan";
          });
          var kumpul = D.pengumpulan.filter(function (x) {
            return x.nis === s.nis;
          });
          var sudah = kumpul.filter(function (x) {
            return x.status === "Sudah Dikumpulkan" || x.status === "Terlambat";
          }).length;
          var nilaiKuis = D.lms.upayaKuis
            .filter(function (u) {
              return u.nis === s.nis;
            })
            .map(function (u) {
              var k = D.lms.kuis.filter(function (x) {
                return x.id === u.kuisId;
              })[0];
              return {
                kuisId: u.kuisId,
                judul: k ? k.judul : u.kuisId,
                jenis: k ? k.jenis : "Kuis",
                nilai: u.nilaiAkhir,
                tanggal: u.dikerjakanPada,
              };
            });
          return {
            nis: s.nis,
            nama: s.nama,
            kelas: s.kelas,
            persenMateri: p.persenMateri,
            materiSelesai: p.materiSelesai,
            totalMateri: p.totalMateri,
            tugasSelesai: sudah,
            tugasBelum: Math.max(tugasKelas.length - sudah, 0),
            riwayatKuis: nilaiKuis,
            trenBulanan: (old && old.trenBulanan) || s.bulanan || [70, 72, 74, 75],
          };
        });
    },
  };
})();
