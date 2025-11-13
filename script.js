document.addEventListener('DOMContentLoaded', () => {
    // === DOM Elements ===
    const radioButtons = document.querySelectorAll('input[name="metode_bayar"]');
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

        // Update DOM
        totalBelanjaSpan.textContent = formatRupiah(subtotal);
        ongkirSpan.textContent = formatRupiah(ongkosKirim);
        grandTotalSpan.textContent = formatRupiah(grandTotal);
        
        // Aktifkan/nonaktifkan tombol checkout
        const isKeranjangEmpty = keranjang.length === 0;
        checkoutButton.disabled = isKeranjangEmpty;
        peringatanKeranjang.style.display = isKeranjangEmpty ? 'block' : 'none';
        
        return { subtotal, grandTotal, ongkosKirim, biayaTambahan };
    };

    const updateGrandTotal = () => {
          hitungTotal();
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
    
    // Menangani klik tombol "Hapus" pada keranjang (Delegasi Event)
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

    // Tampilkan detail saat radio button pembayaran dipilih
    radioButtons.forEach(radio => {
        radio.addEventListener('change', (event) => {
            hideAllDetails();
            const value = event.target.value;
            const detailElement = document.querySelector(`.${value}-detail`);
            if (detailElement) {
                detailElement.style.display = 'block';
            }
            updateGrandTotal();
        });
    });

    // === Form Submission (Pengiriman WhatsApp) ===
    pembayaranForm.addEventListener('submit', (event) => {
        event.preventDefault();
        
        if (keranjang.length === 0) {
            alert("
