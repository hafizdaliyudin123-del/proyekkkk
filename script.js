/* Ganti atau tambahkan bagian berikut di script.js (di dalam DOMContentLoaded closure)
   - pastikan fungsi downloadReceipt & renderReceipt tetap ada (tidak dihapus)
   - ini menambahkan event listener langsung ke tombol agar klik selalu bereaksi
*/

document.addEventListener('DOMContentLoaded', () => {
  // ... (bagian kode Anda sebelumnya tetap utuh)

  // --- Pastikan fungsi downloadReceipt dan renderReceipt ada ---
  // (jika sudah ada di file, biarkan, jangan duplikasi)
  // function renderReceipt(receipt) { ... }
  // function downloadReceipt() { ... }

  // Pasang listener langsung pada tombol (lebih andal daripada delegasi global)
  const setupReceiptButtons = () => {
    const downloadBtn = document.getElementById('download-receipt');
    const closeBtn = document.getElementById('close-receipt');
    const overlay = document.getElementById('receipt-overlay');

    if (downloadBtn) {
      // hapus listener lama jika ada (prevent double-binding)
      downloadBtn.replaceWith(downloadBtn.cloneNode(true));
      const newDownload = document.getElementById('download-receipt');
      newDownload.addEventListener('click', (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
        // call existing downloadReceipt (defined below or earlier)
        try {
          downloadReceipt();
        } catch (err) {
          console.error('downloadReceipt error:', err);
          alert('Gagal membuka struk untuk dicetak. Cek popup blocker.');
        }
      });
    }

    if (closeBtn) {
      closeBtn.replaceWith(closeBtn.cloneNode(true));
      const newClose = document.getElementById('close-receipt');
      newClose.addEventListener('click', (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
        overlay?.classList.add('hidden');
        overlay?.setAttribute('aria-hidden', 'true');
      });
    }
  };

  // Panggil setup saat halaman siap dan setiap kali renderReceipt dipanggil
  setupReceiptButtons();

  // Modifikasi renderReceipt (atau wrap) supaya setelah menampilkan overlay,
  // tombol di-setup ulang (untuk memastikan event listener terbaru terpasang).
  const originalRender = window.renderReceipt || null;
  if (originalRender) {
    window.renderReceipt = function(receipt) {
      try {
        originalRender(receipt);
      } catch (e) {
        console.warn('originalRender failed', e);
      }
      // setup tombol setelah overlay ditampilkan
      setupReceiptButtons();
    };
  } else {
    // jika renderReceipt dideklarasikan dalam scope, alternatif: re-define small wrapper
    // (Tidak mengganti jika renderReceipt adalah fungsi lokal - lalu setupReceiptButtons
    // sudah terpanggil di bagian yang membuat overlay)
  }

  // Also ensure overlay itself doesn't block pointer-events (CSS handles pointer-events:auto)
  // and stopPropagation on overlay clicks to avoid accidental fall-through.
  document.getElementById('receipt-overlay')?.addEventListener('click', (ev) => {
    // Klik di area overlay (di luar card) bisa menutup overlay
    const card = document.querySelector('.receipt-card');
    if (card && !card.contains(ev.target)) {
      ev.stopPropagation();
      ev.preventDefault();
      document.getElementById('receipt-overlay')?.classList.add('hidden');
      document.getElementById('receipt-overlay')?.setAttribute('aria-hidden','true');
    }
  });

  // Jika Anda menggunakan delegated click handler sebelumnya, biarkan tetap sebagai fallback.
  // Pastikan setupReceiptButtons dipanggil juga ketika overlay dibuat.
});
