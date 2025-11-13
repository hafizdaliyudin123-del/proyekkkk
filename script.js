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
    
    // FUNGSI INI DIGUNAKAN UNTUK MENGHITUNG TOTAL DAN MEMPERBARUI TAMPILAN
    const hitungTotal = () => {
        let subtotal = keranjang.reduce((sum, item) => sum + (item.harga * item.qty), 0);
        let ongkosKirim = ONGKIR_STANDAR;
        let metodeBayarTerpilih = document.querySelector('input[name="metode_bayar"]:checked')?.value;
        let biayaTambahan = 0;

        if (metodeBayarTerpilih === 'cod') {
            biayaTambahan = BIAYA_COD;
        }

        let grandTotal = subtotal + ongkosKirim + biayaTambahan;

        // Update DOM
        totalBelanjaSpan.textContent = formatRupiah(subtotal);
        ongkirSpan.textContent = formatRupiah(ongkosKirim);
        grandTotalSpan.textContent = formatRupiah(grandTotal);
        
        // Aktifkan/nonaktifkan tombol checkout
        const isKeranjangEmpty = keranjang.length === 0;
        checkoutButton.disabled = isKeranjangEmpty;
        peringatanKeranjang.style.display = isKeranjangEmpty ? 'block' : 'none';
        
        // Mengembalikan nilai total untuk digunakan saat submit
        return { subtotal, grandTotal, ongkosKirim, biayaTambahan };
    };


    // Merender ulang daftar keranjang
    const renderKeranjang = () => {
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
    
    // Menangani klik tombol "Tambah ke Keranjang"
    tambahKeranjangButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const id = event.target.dataset.id;
            const nama = event.target.dataset.nama;
            const harga = parseInt(event.target.dataset.harga); 

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


    // === Form Submission (Pengiriman WhatsApp) ===
    pembayaranForm.addEventListener('submit', (event) => {
        event.preventDefault();
        
        if (keranjang.length === 0) {
            alert("Keranjang belanja masih kosong!");
            return;
        }
        
        // Pastikan semua field form 'required' terisi (validasi HTML)
        if (!pembayaranForm.checkValidity()) {
            return; 
        }

        // 1. Ambil data form dan total
        const formData = new FormData(pembayaranForm);
        const data = Object.fromEntries(formData.entries());
        const { grandTotal, subtotal, ongkosKirim, biayaTambahan } = hitungTotal();
        
        // Ambil label pembayaran dan kemasan yang dipilih
        const metodeBayarLabelElement = document.querySelector(`input[name="metode_bayar"][value="${data.metode_bayar}"] + label`);
        const metodeBayarLabel = metodeBayarLabelElement ? metodeBayarLabelElement.textContent.trim() : data.metode_bayar.toUpperCase();
        
        // --- FIX BAGIAN PACKAGING ---
        const kemasanLabelElement = document.querySelector(`input[name="packaging"][value="${data.packaging}"] + label`);
        const kemasanLabel = kemasanLabelElement ? kemasanLabelElement.textContent.trim() : data.packaging;

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

    // === Inisialisasi Saat Halaman Dimuat ===
    hideAllDetails();
    renderKeranjang(); 
});
