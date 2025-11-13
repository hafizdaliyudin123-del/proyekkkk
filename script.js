document.addEventListener('DOMContentLoaded', () => {
    // === DOM Elements ===
    const radioButtonsBayar = document.querySelectorAll('input[name="metode_bayar"]');
    const detailContainers = document.querySelectorAll('.detail-bayar');
    const tambahKeranjangButtons = document.querySelectorAll('.tambah-keranjang');
    const daftarKeranjang = document.getElementById('daftar-keranjang');
    const totalBelanjaSpan = document.getElementById('total-belanja');
    const ongkirSpan = document.getElementById('ongkir');
    const grandTotalSpan = document.getElementById('grand-total');
    const pembayaranForm = document.getElementById('pembayaran-form');
    const checkoutButton = document.getElementById('checkout-button');
    const peringatanKeranjang = document.getElementById('peringatan-keranjang');
    
    // Nomor WhatsApp tujuan
    const WHATSAPP_NUMBER = '6285692128064'; 
    
    // === State Keranjang & Konstanta ===
    let keranjang = [];
    const ONGKIR_STANDAR = 10000;
    const BIAYA_COD = 5000;

    // === Fungsi Utilitas ===
    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    };

    const hideAllDetails = () => {
        detailContainers.forEach(detail => detail.style.display = 'none');
    };

    // === Fungsi Perhitungan & Update DOM ===
    const hitungTotal = () => {
        let subtotal = keranjang.reduce((sum, item) => sum + (item.harga * item.qty), 0);
        let ongkosKirim = ONGKIR_STANDAR;
        let metodeBayarTerpilih = document.querySelector('input[name="metode_bayar"]:checked')?.value;
        let biayaTambahan = 0;

        if (metodeBayarTerpilih === 'cod') {
            biayaTambahan = BIAYA_COD;
        }

        let grandTotal = subtotal + ongkosKirim + biayaTambahan;

        // Update DOM (jaga-jaga elemen mungkin null)
        if (totalBelanjaSpan) totalBelanjaSpan.textContent = formatRupiah(subtotal);
        if (ongkirSpan) ongkirSpan.textContent = formatRupiah(ongkosKirim);
        if (grandTotalSpan) grandTotalSpan.textContent = formatRupiah(grandTotal);
        
        // Aktifkan/nonaktifkan tombol checkout
        const isKeranjangEmpty = keranjang.length === 0;
        if (checkoutButton) checkoutButton.disabled = isKeranjangEmpty;
        if (peringatanKeranjang) peringatanKeranjang.style.display = isKeranjangEmpty ? 'block' : 'none';
        
        return { subtotal, grandTotal, ongkosKirim, biayaTambahan };
    };

    // Merender ulang daftar keranjang
    const renderKeranjang = () => {
        if (!daftarKeranjang) return;
        daftarKeranjang.innerHTML = '';

        if (keranjang.length === 0) {
            const li = document.createElement('li');
            li.textContent = "Keranjang Anda kosong.";
            daftarKeranjang.appendChild(li);
        } else {
            keranjang.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${item.nama} (x${item.qty})</span>
                    <span>${formatRupiah(item.harga * item.qty)} 
                        <button class="remove-item" data-id="${item.id}">Hapus 1</button>
                        <button class="remove-item-all" data-id="${item.id}">Hapus Semua</button>
                    </span>
                `;
                daftarKeranjang.appendChild(li);
            });
        }
        
        // Panggil hitungTotal setelah render keranjang selesai
        hitungTotal();
    };

    // === Event Handlers (Logika Keranjang) ===
    tambahKeranjangButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const el = event.currentTarget;
            const id = el.dataset.id;
            const nama = el.dataset.nama;
            const harga = parseInt(el.dataset.harga, 10) || 0;

            const existingItem = keranjang.find(item => item.id === id);

            if (existingItem) {
                existingItem.qty += 1;
            } else {
                keranjang.push({ id, nama, harga, qty: 1 });
            }

            renderKeranjang();
        });
    });
    
    // Menangani klik tombol "Hapus" pada keranjang
    if (daftarKeranjang) {
        daftarKeranjang.addEventListener('click', (event) => {
            const target = event.target;
            
            if (target.classList.contains('remove-item')) {
                const id = target.dataset.id;
                const itemIndex = keranjang.findIndex(item => item.id === id);

                if (itemIndex > -1) {
                    keranjang[itemIndex].qty -= 1;
                    if (keranjang[itemIndex].qty <= 0) {
                        keranjang.splice(itemIndex, 1);
                    }
                    renderKeranjang();
                }
            }
            
            if (target.classList.contains('remove-item-all')) {
                const id = target.dataset.id;
                const itemIndex = keranjang.findIndex(item => item.id === id);

                if (itemIndex > -1) {
                    keranjang.splice(itemIndex, 1);
                    renderKeranjang();
                }
            }
        });
    }

    // Menampilkan detail saat radio button pembayaran dipilih (juga memanggil hitungTotal)
    radioButtonsBayar.forEach(radio => {
        radio.addEventListener('change', (event) => {
            hideAllDetails();
            const value = event.target.value;
            const detailElement = document.querySelector(`.${value}-detail`);
            if (detailElement) {
                detailElement.style.display = 'block';
            }
            hitungTotal(); // Panggil hitungTotal untuk update biaya COD/Ongkir
        });
    });

    // Jika ada opsi packaging di DOM, berikan listener supaya bisa menampilkan preview / langsung dipakai
    const packagingInputs = document.querySelectorAll('input[name="packaging"]');
    packagingInputs.forEach(inp => {
        inp.addEventListener('change', () => {
            // Jika ingin menampilkan pilihan packaging di UI, letakkan elemen dengan id "pilihan-kemasan"
            const display = document.getElementById('pilihan-kemasan');
            if (display) {
                const label = inp.dataset.label || (inp.id ? document.querySelector(`label[for="${inp.id}"]`)?.textContent : inp.nextElementSibling?.textContent) || inp.value;
                display.textContent = label?.trim() || inp.value;
            }
        });
    });


    // === Form Submission (Pengiriman WhatsApp) ===
    if (pembayaranForm) {
        pembayaranForm.addEventListener('submit', (event) => {
            event.preventDefault();
            
            if (keranjang.length === 0) {
                alert("Keranjang belanja masih kosong!");
                return;
            }
            
            // Pastikan validasi HTML terpenuhi
            if (!pembayaranForm.checkValidity()) {
                // Jika ingin tunjukkan pesan validasi HTML
                pembayaranForm.reportValidity();
                return; 
            }

            // 1. Ambil data form dan total
            const formData = new FormData(pembayaranForm);
            const data = Object.fromEntries(formData.entries());
            const { grandTotal, subtotal, ongkosKirim, biayaTambahan } = hitungTotal();
            
            // Ambil label pembayaran
            const metodeBayarLabelElement = document.querySelector(`input[name="metode_bayar"][value="${data.metode_bayar}"]`) 
                ? (document.querySelector(`input[name="metode_bayar"][value="${data.metode_bayar}"]`).dataset.label 
                    || (document.querySelector(`input[name="metode_bayar"][value="${data.metode_bayar}"]`).id 
                        ? document.querySelector(`label[for="${document.querySelector('input[name="metode_bayar"][value="${data.metode_bayar}"]').id}"]`)?.textContent 
                        : null))
                : null;
            const metodeBayarLabel = metodeBayarLabelElement ? metodeBayarLabelElement.trim() : (data.metode_bayar ? data.metode_bayar.toUpperCase() : 'Tidak dipilih');
            
            // --- FIX BAGIAN PACKAGING ---
            // Ambil input packaging yang terpilih (paling andal)
            const selectedPackagingInput = document.querySelector('input[name="packaging"]:checked') 
                || (data.packaging ? document.querySelector(`input[name="packaging"][value="${data.packaging}"]`) : null);
            let kemasanLabel = 'Tidak dipilih';
            if (selectedPackagingInput) {
                kemasanLabel = (selectedPackagingInput.dataset.label && selectedPackagingInput.dataset.label.trim()) ||
                               (selectedPackagingInput.id && document.querySelector(`label[for="${selectedPackagingInput.id}"]`)?.textContent?.trim()) ||
                               (selectedPackagingInput.nextElementSibling && selectedPackagingInput.nextElementSibling.tagName === 'LABEL' && selectedPackagingInput.nextElementSibling.textContent.trim()) ||
                               (selectedPackagingInput.value) ||
                               kemasanLabel;
            }

            // 2. Buat Teks Pesan
            let pesan = `Halo *Toko Buah Segar* 🛒, saya mau pesan:\n\n`;
            
            pesan += `*--- INFO PENGIRIMAN ---*\n`;
            pesan += `*Nama:* ${data.nama}\n`;
            pesan += `*Telepon:* ${data.telepon}\n`;
            pesan += `*Alamat:* ${data.alamat}\n\n`;
            
            pesan += `*--- DETAIL PESANAN ---*\n`;
            keranjang.forEach((item, index) => {
                pesan += `${index + 1}. ${item.nama} (x${item.qty}) - ${formatRupiah(item.harga * item.qty)}\n`;
            });
            
            pesan += `\n*--- OPSI PENGIRIMAN ---*\n`;
            pesan += `Kemasan: ${kemasanLabel}\n`; // Pilihan Kemasan dikirim
            pesan += `Metode Bayar: ${metodeBayarLabel}\n\n`;
            
            pesan += `*--- RINCIAN BIAYA ---*\n`;
            pesan += `Subtotal: ${formatRupiah(subtotal)}\n`;
            pesan += `Ongkir: ${formatRupiah(ongkosKirim)}\n`;
            if (biayaTambahan > 0) {
                pesan += `Biaya Tambahan (COD): ${formatRupiah(biayaTambahan)}\n`;
            }
            pesan += `*Total Bayar: ${formatRupiah(grandTotal)}*\n\n`;
            
            pesan += `Mohon konfirmasi pesanan ini. Terima kasih! 🙏`;

            // 3. Format URL WhatsApp
            const encodedPesan = encodeURIComponent(pesan);
            const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedPesan}`;

            // 4. Redirect ke WhatsApp
            window.open(whatsappURL, '_blank');
            
            // Reset form dan keranjang setelah redirect
            setTimeout(() => {
                alert("Pemesanan berhasil! Anda akan diarahkan ke WhatsApp untuk konfirmasi dan pembayaran. Tekan kirim di WhatsApp.");
                
                keranjang = [];
                renderKeranjang();
                pembayaranForm.reset();
                hideAllDetails();
            }, 100); 
        });
    }

    // === Inisialisasi Saat Halaman Dimuat ===
    hideAllDetails();
    renderKeranjang(); 
});
