/* ============================================================
   Bank Sampah Go-Green — store.js
   Lapisan data & helper yang dipakai SEMUA halaman.
   "Database" disimulasikan dengan localStorage (berfungsi penuh
   saat situs dijalankan lewat Live Server / server lokal).
   Diekspos lewat objek global: window.GG
   ============================================================ */
(function () {
  "use strict";

  const KEY = "gogreen_db_v1";

  /* ---------- DATA AWAL (seed) ---------- */
  // harga = harga beli per kg yang dipakai saat transaksi penimbangan.
  // min/max = rentang harga untuk katalog publik.
  const SEED = {
    prices: [
      { kategori: "Kertas", items: [
        { kode: "KRN", nama: "Koran",      min: 1500, max: 4000, harga: 2500 },
        { kode: "HVS", nama: "HVS",        min: 600,  max: 800,  harga: 700  },
        { kode: "SAK", nama: "Sak Semen",  min: 1500, max: 3000, harga: 2000 },
      ]},
      { kategori: "Plastik", items: [
        { kode: "PET", nama: "PET",  min: 750,  max: 3000, harga: 1800 },
        { kode: "HDP", nama: "HDPE", min: 1000, max: 2500, harga: 1700 },
        { kode: "PVC", nama: "PVC",  min: 300,  max: 900,  harga: 600  },
      ]},
      { kategori: "Logam", items: [
        { kode: "ALU", nama: "Alumunium", min: 5000,  max: 8000,  harga: 6500  },
        { kode: "TMB", nama: "Tembaga",   min: 15000, max: 28000, harga: 21000 },
        { kode: "KNG", nama: "Kuningan",  min: 9500,  max: 18000, harga: 13500 },
      ]},
    ],
    // akun nasabah demo
    nasabah: [
      {
        id: "NSB-0001", nama: "Sri Wahyuni", email: "sri@contoh.id",
        alamat: "Cupuwatu II, Purwomartani, Kalasan, Sleman",
        pin: "1234", saldo: 84500,
        riwayat: [
          { t: Date.now() - 86400000 * 9, tipe: "setor", ket: "Setor: Koran 3.0 kg, PET 1.2 kg", jumlah: 9660 },
          { t: Date.now() - 86400000 * 4, tipe: "setor", ket: "Setor: Alumunium 0.8 kg", jumlah: 5200 },
          { t: Date.now() - 86400000 * 1, tipe: "tarik", ket: "Penarikan saldo tunai", jumlah: -50000 },
        ],
      },
    ],
    // akun karyawan demo
    karyawan: [
      { id: "KRY-0001", nama: "Medi Parmasta", pin: "admin", jabatan: "Admin Gudang" },
    ],
    dropoffs: [], // laporan drop-off menunggu verifikasi
  };

  /* ---------- LOAD / SAVE ---------- */
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) { save(SEED); return JSON.parse(JSON.stringify(SEED)); }
      return JSON.parse(raw);
    } catch (e) {
      save(SEED); return JSON.parse(JSON.stringify(SEED));
    }
  }
  function save(db) { localStorage.setItem(KEY, JSON.stringify(db)); }
  function resetDB() { localStorage.removeItem(KEY); localStorage.removeItem("gogreen_session"); }

  /* ---------- HELPER UMUM ---------- */
  function rupiah(n) {
    const v = Math.round(Number(n) || 0);
    return "Rp " + v.toLocaleString("id-ID");
  }
  function tanggal(ts) {
    return new Date(ts).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  }
  function uid(prefix) {
    const db = load();
    const list = prefix === "NSB" ? db.nasabah : db.dropoffs;
    const n = (list.length + 1).toString().padStart(4, "0");
    return prefix + "-" + n;
  }

  /* ---------- SESI / AUTH ---------- */
  function setSession(role, id) {
    localStorage.setItem("gogreen_session", JSON.stringify({ role, id, t: Date.now() }));
  }
  function getSession() {
    try { return JSON.parse(localStorage.getItem("gogreen_session")); }
    catch (e) { return null; }
  }
  function logout() { localStorage.removeItem("gogreen_session"); }

  function login(role, id, pin) {
    const db = load();
    const list = role === "karyawan" ? db.karyawan : db.nasabah;
    const user = list.find(u => u.id.toLowerCase() === String(id).trim().toLowerCase());
    if (!user) return { ok: false, msg: "ID tidak ditemukan. Periksa kembali ID Anda." };
    if (user.pin !== String(pin)) return { ok: false, msg: "PIN salah. Coba lagi." };
    setSession(role, user.id);
    return { ok: true, user };
  }

  // Pastikan halaman terkunci hanya untuk role tertentu; jika tidak, lempar ke login.
  function requireRole(role) {
    const s = getSession();
    if (!s || s.role !== role) { window.location.href = "login.html"; return null; }
    return getUser(role, s.id);
  }
  function getUser(role, id) {
    const db = load();
    const list = role === "karyawan" ? db.karyawan : db.nasabah;
    return list.find(u => u.id === id) || null;
  }

  /* ---------- NASABAH ---------- */
  function addNasabah({ nama, email, alamat, pin }) {
    const db = load();
    const id = uid("NSB");
    const nasabah = { id, nama, email, alamat, pin: pin || "1234", saldo: 0, riwayat: [] };
    db.nasabah.push(nasabah);
    save(db);
    return nasabah;
  }
  function listNasabah() { return load().nasabah; }

  // Catat transaksi setoran -> tambah saldo + riwayat
  function recordSetor(nasabahId, items, sumber) {
    const db = load();
    const n = db.nasabah.find(x => x.id === nasabahId);
    if (!n) return null;
    const total = items.reduce((s, it) => s + it.subtotal, 0);
    const ket = "Setor: " + items.map(it => `${it.nama} ${it.berat} kg`).join(", ")
              + (sumber ? ` (${sumber})` : "");
    n.saldo += total;
    n.riwayat.unshift({ t: Date.now(), tipe: "setor", ket, jumlah: total });
    save(db);
    return { total, saldo: n.saldo };
  }

  /* ---------- DROP-OFF (setor mandiri, perlu verifikasi) ---------- */
  function addDropoff({ nasabahId, nasabahNama, catatan, foto }) {
    const db = load();
    const id = "DRP-" + (db.dropoffs.length + 1).toString().padStart(4, "0");
    const rec = { id, nasabahId, nasabahNama, catatan, foto, status: "menunggu", t: Date.now() };
    db.dropoffs.unshift(rec);
    save(db);
    return rec;
  }
  function listDropoffs(status) {
    const all = load().dropoffs;
    return status ? all.filter(d => d.status === status) : all;
  }
  function verifyDropoff(dropoffId, items) {
    const db = load();
    const d = db.dropoffs.find(x => x.id === dropoffId);
    if (!d) return null;
    d.status = "terverifikasi";
    save(db);
    return recordSetor(d.nasabahId, items, "drop-off");
  }
  function rejectDropoff(dropoffId) {
    const db = load();
    const d = db.dropoffs.find(x => x.id === dropoffId);
    if (d) { d.status = "ditolak"; save(db); }
  }

  /* ---------- HARGA ---------- */
  function getPrices() { return load().prices; }
  function flatPrices() {
    const out = [];
    load().prices.forEach(c => c.items.forEach(it => out.push({ ...it, kategori: c.kategori })));
    return out;
  }
  function findPrice(kode) { return flatPrices().find(p => p.kode === kode); }

  /* ---------- QR CODE (visual deterministik dari token) ----------
     Bukan QR betulan yang bisa discan kamera, tapi pola unik & konsisten
     per-ID yang dipakai untuk alur "scan" antar-halaman. */
  function qrSVG(token, size) {
    size = size || 180;
    const cells = 21;
    // hash sederhana -> deterministik
    let h = 0;
    for (let i = 0; i < token.length; i++) h = (h * 31 + token.charCodeAt(i)) >>> 0;
    function rnd(i) { let x = (h ^ (i * 2654435761)) >>> 0; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 4294967296; }
    const cs = size / cells;
    let rects = "";
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        const finder = (x < 7 && y < 7) || (x >= cells - 7 && y < 7) || (x < 7 && y >= cells - 7);
        let on;
        if (finder) {
          const lx = x < 7 ? x : x - (cells - 7);
          const ly = y < 7 ? y : y - (cells - 7);
          on = (lx === 0 || lx === 6 || ly === 0 || ly === 6 || (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4));
        } else {
          on = rnd(y * cells + x) > 0.5;
        }
        if (on) rects += `<rect x="${(x*cs).toFixed(2)}" y="${(y*cs).toFixed(2)}" width="${cs.toFixed(2)}" height="${cs.toFixed(2)}"/>`;
      }
    }
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" fill="#06240f">${rects}</svg>`;
  }

  /* ---------- TOAST ---------- */
  function toast(msg, kind) {
    let wrap = document.querySelector(".toast-wrap");
    if (!wrap) { wrap = document.createElement("div"); wrap.className = "toast-wrap"; document.body.appendChild(wrap); }
    const t = document.createElement("div");
    t.className = "toast" + (kind === "amber" ? " amber" : "");
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => { t.style.opacity = "0"; t.style.transition = "opacity .3s"; setTimeout(() => t.remove(), 300); }, 3200);
  }

  /* ---------- TOPBAR ---------- */
  // active: nama halaman aktif. mode: 'public' | 'nasabah' | 'karyawan'
  function renderTopbar(active, mode) {
    const s = getSession();
    let links = "";
    if (mode === "nasabah") {
      links = `<a href="nasabah.html" class="${active==='dashboard'?'active':''}">Dashboard</a>
               <a href="katalog-harga.html" class="${active==='katalog'?'active':''}">Katalog Harga</a>
               <span class="who">Nasabah · ${s ? s.id : ''}</span>
               <a href="#" onclick="GG.logout();location.href='login.html';return false;" class="btn btn-ghost btn-sm">Keluar</a>`;
    } else if (mode === "karyawan") {
      links = `<a href="karyawan.html" class="${active==='dashboard'?'active':''}">Penerimaan</a>
               <a href="karyawan.html#verifikasi" class="${active==='verifikasi'?'active':''}">Verifikasi</a>
               <span class="who">Karyawan · ${s ? s.id : ''}</span>
               <a href="#" onclick="GG.logout();location.href='login.html';return false;" class="btn btn-ghost btn-sm">Keluar</a>`;
    } else {
      links = `<a href="index.html" class="${active==='beranda'?'active':''}">Beranda</a>
               <a href="index.html#tentang" class="${active==='tentang'?'active':''}">Tentang</a>
               <a href="index.html#kegiatan" class="${active==='kegiatan'?'active':''}">Kegiatan</a>
               <a href="katalog-harga.html" class="${active==='katalog'?'active':''}">Katalog Harga</a>
               <a href="index.html#lokasi" class="${active==='lokasi'?'active':''}">Lokasi</a>
               <a href="login.html" class="btn btn-ghost btn-sm">Masuk</a>
               <a href="daftar.html" class="btn btn-primary btn-sm">Daftar Nasabah</a>`;
    }
    const html = `
      <div class="topbar">
        <div class="container topbar-inner">
          <a href="index.html" class="brand">
            <span class="mark">♺</span>
            <span><b>Go-Green</b><small>Bank Sampah</small></span>
          </a>
          <button class="menu-toggle" aria-label="Menu" onclick="document.querySelector('.nav').classList.toggle('open')">☰</button>
          <nav class="nav">${links}</nav>
        </div>
      </div>`;
    document.body.insertAdjacentHTML("afterbegin", html);
  }

  /* ---------- FOOTER ---------- */
  function renderFooter() {
    const html = `
      <footer class="site-footer">
        <div class="container foot-grid">
          <div>
            <div class="brand" style="color:#fff;margin-bottom:.8rem">
              <span class="mark">♺</span><span><b style="color:#fff">Go-Green</b><small>Bank Sampah</small></span>
            </div>
            <p style="color:#cfe6d6;max-width:34ch">Mengajak warga memilah dan mengolah sampah secara mandiri agar tidak berakhir di TPST Piyungan.</p>
          </div>
          <div>
            <h4>Tautan</h4>
            <ul>
              <li><a href="index.html">Beranda</a></li>
              <li><a href="katalog-harga.html">Katalog Harga</a></li>
              <li><a href="daftar.html">Daftar Nasabah</a></li>
              <li><a href="login.html">Masuk</a></li>
            </ul>
          </div>
          <div>
            <h4>Kontak</h4>
            <ul>
              <li>Cupuwatu II, Purwomartani</li>
              <li>Kalasan, Sleman, DIY</li>
              <li>+62 813-2996-7052</li>
              <li>Senin–Sabtu, 09.00–19.00</li>
            </ul>
          </div>
        </div>
        <div class="foot-bottom container">© ${new Date().getFullYear()} Bank Sampah Go-Green · Dibuat untuk warga, demi bumi.</div>
      </footer>`;
    document.body.insertAdjacentHTML("beforeend", html);
  }

  /* ---------- CHATBOT (edukasi) ---------- */
  const FAQ = [
    { q: "Apa itu bank sampah?", a: "Bank Sampah Go-Green menerima sampah anorganik (kertas, plastik, logam) yang sudah dipilah. Sampah Anda ditimbang lalu dikonversi menjadi saldo tabungan." },
    { q: "Cara jadi nasabah?", a: "Klik tombol \"Daftar Nasabah\", isi nama, email, dan alamat, lalu tekan Buat Akun. Anda langsung mendapat ID & QR Code untuk menyetor." },
    { q: "Sampah apa yang diterima?", a: "Kertas (koran, HVS, sak semen), plastik (PET, HDPE, PVC), dan logam (alumunium, tembaga, kuningan). Lihat harga lengkap di menu Katalog Harga." },
    { q: "Bagaimana cara menyetor?", a: "Datang ke lokasi, tunjukkan QR Code dari aplikasi ke karyawan untuk ditimbang. Jika karyawan tidak di tempat, gunakan fitur \"Lapor Drop-off\" + unggah foto sampah." },
    { q: "Di mana lokasinya?", a: "Cupuwatu II, Purwomartani, Kalasan, Sleman. Buka Senin–Sabtu pukul 09.00–19.00 WIB." },
  ];
  function renderChatbot() {
    const fab = document.createElement("button");
    fab.className = "fab"; fab.innerHTML = "💬"; fab.setAttribute("aria-label", "Buka bantuan");
    document.body.appendChild(fab);

    let box = null;
    fab.addEventListener("click", () => {
      if (box) { box.remove(); box = null; fab.innerHTML = "💬"; return; }
      fab.innerHTML = "✕";
      box = document.createElement("div");
      box.className = "chat";
      box.innerHTML = `
        <div class="chat-head"><b>Asisten Go-Green</b><div style="font-size:.78rem;opacity:.85">Tanya seputar bank sampah</div></div>
        <div class="chat-body" id="gg-chat-body">
          <div class="bubble bot">Halo! 👋 Ada yang bisa dibantu? Pilih pertanyaan di bawah ini.</div>
        </div>
        <div class="chat-chips" id="gg-chat-chips"></div>`;
      document.body.appendChild(box);
      const chips = box.querySelector("#gg-chat-chips");
      const body = box.querySelector("#gg-chat-body");
      FAQ.forEach(f => {
        const c = document.createElement("button");
        c.className = "chip"; c.textContent = f.q;
        c.onclick = () => {
          body.insertAdjacentHTML("beforeend", `<div class="bubble me">${f.q}</div>`);
          setTimeout(() => {
            body.insertAdjacentHTML("beforeend", `<div class="bubble bot">${f.a}</div>`);
            body.scrollTop = body.scrollHeight;
          }, 350);
          body.scrollTop = body.scrollHeight;
        };
        chips.appendChild(c);
      });
    });
  }

  /* ---------- EKSPOR ---------- */
  window.GG = {
    load, save, resetDB, rupiah, tanggal, uid,
    login, logout, getSession, requireRole, getUser,
    addNasabah, listNasabah, recordSetor,
    addDropoff, listDropoffs, verifyDropoff, rejectDropoff,
    getPrices, flatPrices, findPrice,
    qrSVG, toast, renderTopbar, renderFooter, renderChatbot,
  };
})();
