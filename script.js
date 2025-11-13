document.addEventListener('DOMContentLoaded', () => {
    // === DOM Elements ===
    const radioButtonsBayar = document.querySelectorAll('input[name="metode_bayar"]');
    const detailContainers = document.querySelectorAll('.detail-bayar');
    const tambahKeranjangButtons = document.querySelectorAll('.tambah-keranjang');
    const daftarKeranjang = document.getElementById('daftar-keranjang');
    const totalBelanjaSpan = document.getElementById('total-belanja');
    const packagingCostSpan = document.getElementById('packaging-cost');
    const ongkirSpan = document.getElementById('ongkir');
    const grandTotalSpan = document.getElementById('grand-total');
    const pembayaranForm = document.getElementById('pembayaran-form');
    const checkoutButton = document.getElementById('checkout-button');
    const peringatanKeranjang = document.getElementById('peringatan-keranjang');
    
    // Nomor WhatsApp tujuan (ubah sesuai kebutuhan)
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
        detailContainers.forEach(detail => detail.classList.remove('visible'));
        document.querySelectorAll('.pack-detail').forEach(pd => pd.classList.remove('visible'));
    };

    // Ambil packaging terpilih beserta label & harga
    const getSelectedPackaging = () => {
        const sel = document.querySelector('input[name="packaging"]:checked');
        if (!sel) return { label: null, price: 0, value: null };
        const label = sel.dataset.label?.trim() || (sel.id ? document.querySelector(`label[for="${sel.id}"]`)?.textContent?.trim() : sel.value);
        const price = parseInt(sel.dataset.price, 10) || 0;
        return { label: label || sel.value, price, value: sel.value };
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

        // biaya packaging
        const packaging = getSelectedPackaging();
        const biayaPackaging = packaging.price || 0;

        let grandTotal = subtotal + ongkosKirim + biayaTambahan + biayaPackaging;

        // Update DOM (jaga-jaga elemen mungkin null)
        if (totalBelanjaSpan) totalBelanjaSpan.textContent = formatRupiah(subtotal);
        if (packagingCostSpan) packagingCostSpan.textContent = formatRupiah(biayaPackaging);
        if (ongkirSpan) ongkirSpan.textContent = formatRupiah(ongkosKirim);
        if (grandTotalSpan) grandTotalSpan.textContent = formatRupiah(grandTotal);
        
        // Aktifkan/nonaktifkan tombol checkout
        const isKeranjangEmpty = keranjang.length === 0;
        if (checkoutButton) checkoutButton.disabled = isKeranjangEmpty;
        if (peringatanKeranjang) peringatanKeranjang.style.display = isKeranjangEmpty ? 'block' : 'none';
        
        return { subtotal, grandTotal, ongkosKirim, biayaTambahan, biayaPackaging };
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
                    <span> ${formatRupiah(item.harga * item.qty)} 
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
    
    // Menangani klik tombol "Tambah ke Keranjang"
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
                detailElement.classList.add('visible');
            }
            hitungTotal(); // update biaya COD/Ongkir
        });
    });

    // Listener untuk packaging (agar tampilan & total terupdate saat user pilih kemasan)
    const packagingInputs = document.querySelectorAll('input[name="packaging"]');
    packagingInputs.forEach(inp => {
        inp.addEventListener('change', (e) => {
            // tampilkan pack detail jika ada next div
            document.querySelectorAll('.pack-detail').forEach(pd => pd.classList.remove('visible'));
            const next = inp.nextElementSibling;
            if (next && next.classList.contains('pack-detail')) {
                next.classList.add('visible');
            }
            hitungTotal();
        });
        // jika sudah checked saat load, trigger event untuk menampilkan detail
        if (inp.checked) {
            const next = inp.nextElementSibling;
            if (next && next.classList.contains('pack-detail')) next.classList.add('visible');
        }
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
                pembayaranForm.reportValidity();
                return; 
            }

            // 1. Ambil data form dan total
            const formData = new FormData(pembayaranForm);
            const data = Object.fromEntries(formData.entries());
            const { grandTotal, subtotal, ongkosKirim, biayaTambahan, biayaPackaging } = hitungTotal();
            
            // Ambil label pembayaran
            const metodeInput = document.querySelector(`input[name="metode_bayar"][value="${data.metode_bayar}"]`);
            let metodeBayarLabel = data.metode_bayar ? data.metode_bayar.toUpperCase() : 'Tidak dipilih';
            if (metodeInput) {
                metodeBayarLabel = metodeInput.dataset.label?.trim() || (metodeInput.id ? document.querySelector(`label[for="${metodeInput.id}"]`)?.textContent?.trim() : metodeBayarLabel);
            }

            // Ambil packaging terpilih dan labelnya
            const selectedPackagingInput = document.querySelector('input[name="packaging"]:checked');
            let kemasanLabel = 'Tidak dipilih';
            if (selectedPackagingInput) {
                kemasanLabel = selectedPackagingInput.dataset.label?.trim() 
                                || (selectedPackagingInput.id ? document.querySelector(`label[for="${selectedPackagingInput.id}"]`)?.textContent?.trim() : null) 
                                || selectedPackagingInput.value;
            }

            // 2. Buat Teks Pesan
            let pesan = `Halo *Toko Buah Segar* 🛒, saya mau pesan:%0A%0A`; // gunakan %0A agar encodeURIComponent konsisten
                            
            pesan += `*--- INFO PENGIRIMAN ---*%0A`;
            pesan += `*Nama:* ${data.nama}%0A`;
            pesan += `*Telepon:* ${data.telepon}%0A`;
            pesan += `*Alamat:* ${data.alamat}%0A%0A`;
            
            pesan += `*--- DETAIL PESANAN ---*%0A`;
            keranjang.forEach((item, index) => {
                pesan += `${index + 1}. ${item.nama} (x${item.qty}) - ${formatRupiah(item.harga * item.qty)}%0A`;
            });
            
            pesan += `%0A*--- OPSI PENGIRIMAN ---*%0A`;
            pesan += `Kemasan: ${kemasanLabel}%0A`;
            pesan += `Metode Bayar: ${metodeBayarLabel}%0A%0A`;
            
            pesan += `*--- RINCIAN BIAYA ---*%0A`;
            pesan += `Subtotal: ${formatRupiah(subtotal)}%0A`;
            if (biayaPackaging > 0) pesan += `Biaya Kemasan: ${formatRupiah(biayaPackaging)}%0A`;
            pesan += `Ongkir: ${formatRupiah(ongkosKirim)}%0A`;
            if (biayaTambahan > 0) {
                pesan += `Biaya Tambahan (COD): ${formatRupiah(biayaTambahan)}%0A`;
            }
            pesan += `*Total Bayar: ${formatRupiah(grandTotal)}*%0A%0A`;
            
            pesan += `Mohon konfirmasi pesanan ini. Terima kasih! 🙏`;

            // 3. Format URL WhatsApp
            const encodedPesan = encodeURIComponent(decodeURIComponent(pesan));
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
                document.querySelector('input[name="packaging"][value="Standard"]')?.checked && document.querySelector('input[name="packaging"][value="Standard"]')?.dispatchEvent(new Event('change'));
            }, 100); 
        });
    }

    // === Inisialisasi Saat Halaman Dimuat ===
    hideAllDetails();
    renderKeranjang(); 
});
