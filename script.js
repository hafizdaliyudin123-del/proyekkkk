/* REPLACE existing downloadReceipt() with the following code block
   and add helper generatePrintableReceiptHTML(receipt) above/near it.
   This uses lastReceipt stored in localStorage (key 'lastReceipt').
*/

function generatePrintableReceiptHTML(receipt) {
    // If tax is desired, set percentage here (0.1 = 10%)
    const taxPercent = 0.10; // change to 0 if you don't want tax line
    const subtotal = Number(receipt.subtotal || 0);
    const ongkir = Number(receipt.ongkosKirim || 0);
    const biayaPackaging = Number(receipt.biayaPackaging || 0);
    const biayaTambahan = Number(receipt.biayaTambahan || 0);
    const tax = Math.round(subtotal * taxPercent);
    const total = subtotal + tax + ongkir + biayaPackaging + biayaTambahan;

    // format date/time similar to sample: Mon 05/04/2018 11:25AM
    const date = new Date(receipt.createdAt || Date.now());
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const dayName = days[date.getDay()];
    const dd = String(date.getDate()).padStart(2,'0');
    const mm = String(date.getMonth()+1).padStart(2,'0');
    const yyyy = date.getFullYear();
    let hh = date.getHours();
    const ampm = hh >= 12 ? 'PM' : 'AM';
    hh = hh % 12; if (hh === 0) hh = 12;
    const min = String(date.getMinutes()).padStart(2,'0');
    const dateStr = `${dayName} ${dd}/${mm}/${yyyy} ${hh}:${min}${ampm}`;

    // Build item rows
    let itemsHtml = '';
    receipt.items.forEach((it, i) => {
        const name = `${i+1}. ${it.nama}`;
        const qty = it.qty ? ` (x${it.qty})` : '';
        const price = new Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR', minimumFractionDigits:0 }).format(it.harga * it.qty);
        itemsHtml += `
          <div class="row">
            <div class="left">${name}${qty}</div>
            <div class="right">${price}</div>
          </div>
        `;
    });

    // Inline CSS mimicking receipt look (serrated edges & simple layout)
    const style = `
      <style>
        /* Reset */
        html,body{margin:0;padding:0}
        body{font-family: 'DejaVu Sans', 'Segoe UI', Arial, sans-serif; background:#ddd; padding:30px;}
        .receipt {
          width:360px;
          margin:0 auto;
          background:#fff;
          color:#111;
          border-radius:4px;
          overflow:hidden;
          box-shadow:0 8px 30px rgba(0,0,0,0.25);
        }
        /* serrated top */
        .receipt:before, .receipt:after {
          content: "";
          display:block;
          height:12px;
          background-image: repeating-linear-gradient(-45deg, #fff 0 6px, #ddd 6px 12px);
        }
        .receipt-inner { padding:18px 20px 22px; }
        .shop { text-align:center; font-weight:900; font-size:18px; letter-spacing:1px; margin-bottom:6px; }
        .date { text-align:center; font-size:12px; color:#666; margin-bottom:12px; }
        .divider { border-top:1px solid rgba(0,0,0,0.08); margin:8px 0; }
        .items { margin:8px 0 12px; }
        .row { display:flex; justify-content:space-between; margin:8px 0; font-size:14px; }
        .left { max-width:230px; color:#333; }
        .right { font-weight:600; color:#111; }
        .summary { margin-top:6px; border-top:1px dashed rgba(0,0,0,0.06); padding-top:10px; }
        .summary .line { display:flex; justify-content:space-between; margin:6px 0; font-size:14px; color:#444; }
        .summary .total { display:flex; justify-content:space-between; margin-top:8px; font-weight:900; font-size:16px; color:#000; }
        .orderid { text-align:center; margin-top:12px; font-size:11px; color:#777; }
        .note { text-align:center; margin-top:8px; font-weight:600; font-size:12px; color:#333; }
        .footer-space { height:12px; background-image: repeating-linear-gradient(45deg, #fff 0 6px, #ddd 6px 12px); }
        /* ensure print fits */
        @media print {
          body{background:#fff;padding:0}
          .receipt{box-shadow:none;margin:0}
          .receipt:before, .receipt:after { background-image: repeating-linear-gradient(-45deg, #fff 0 6px, #fff 6px 12px); }
        }
      </style>
    `;

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Struk Pemesanan - ${receipt.orderId || ''}</title>
          ${style}
        </head>
        <body>
          <div class="receipt" role="document">
            <div class="receipt-inner">
              <div class="shop">${(receipt.shopName || 'SHOPNAME').toUpperCase()}</div>
              <div class="date">${dateStr}</div>
              <div class="divider"></div>
              <div class="items">
                ${itemsHtml}
              </div>
              <div class="divider"></div>
              <div class="summary">
                <div class="line"><span>Subtotal</span><span>${formatRupiah(subtotal)}</span></div>
                <div class="line"><span>Tax (10%)</span><span>${formatRupiah(tax)}</span></div>
                <div class="line"><span>Biaya Kemasan</span><span>${formatRupiah(biayaPackaging)}</span></div>
                <div class="line"><span>Ongkos Kirim</span><span>${formatRupiah(ongkir)}</span></div>
                ${biayaTambahan ? `<div class="line"><span>Biaya Tambahan</span><span>${formatRupiah(biayaTambahan)}</span></div>` : ''}
                <div class="total"><span>TOTAL</span><span>${formatRupiah(total)}</span></div>
              </div>

              <div class="orderid">${receipt.orderId ? `#${receipt.orderId}` : ''}</div>
              <div class="note">Silahkan kembali ke halaman utama untuk melihat atau mengunduh struk nya.</div>
            </div>
            <div class="footer-space" aria-hidden="true"></div>
          </div>
        </body>
      </html>
    `;
    return html;
}

function downloadReceipt() {
    // Try to read lastReceipt from localStorage (set earlier)
    const last = (() => {
        try {
            return JSON.parse(localStorage.getItem('lastReceipt') || 'null');
        } catch(e) { return null; }
    })();

    // If no lastReceipt, try to build from overlay DOM
    let receipt = last;
    if (!receipt) {
        // attempt to read overlay fields as fallback
        const itemsContainer = document.getElementById('receipt-items');
        if (itemsContainer && itemsContainer.children.length) {
            const items = [];
            itemsContainer.querySelectorAll('.receipt-row').forEach((r) => {
                const left = r.querySelector('.r-left')?.textContent || '';
                const matchQty = left.match(/\(x(\d+)\)/);
                const qty = matchQty ? parseInt(matchQty[1],10) : 1;
                // extract name without numbering and qty
                const name = left.replace(/^\d+\.\s*/, '').replace(/\s*\(x\d+\)/, '').trim();
                const priceText = r.querySelector('.r-right')?.textContent || 'Rp 0';
                // remove non-digits
                const numeric = parseInt(priceText.replace(/[^\d]/g,''),10) || 0;
                items.push({ nama: name, harga: Math.round(numeric/qty || 0), qty });
            });
            receipt = {
                shopName: document.querySelector('.receipt-shop')?.textContent || 'SHOPNAME',
                createdAt: new Date().toISOString(),
                items,
                subtotal: (function(){ return items.reduce((s,it)=>s + (it.harga*it.qty),0); })(),
                ongkosKirim: parseInt(document.getElementById('receipt-ongkir')?.textContent.replace(/[^\d]/g,'')||0,10) || 0,
                biayaPackaging: parseInt(document.getElementById('receipt-pack')?.textContent.replace(/[^\d]/g,'')||0,10) || 0,
                biayaTambahan: 0,
                total: parseInt(document.getElementById('receipt-total')?.textContent.replace(/[^\d]/g,'')||0,10) || 0,
                orderId: document.getElementById('receipt-orderid')?.textContent.replace('#','') || `TB-${Date.now().toString().slice(-6)}`
            };
        } else {
            alert('Tidak ada struk tersedia untuk diunduh.');
            return;
        }
    }

    // Build printable HTML
    const printable = generatePrintableReceiptHTML(receipt);
    const win = window.open('', '_blank', 'width=420,height=800');
    if (!win) {
        alert('Popup diblokir. Izinkan popup untuk mencetak/menyimpan struk.');
        return;
    }
    win.document.open();
    win.document.write(printable);
    win.document.close();
    win.focus();
    // small delay to ensure styles loaded
    setTimeout(() => {
        win.print();
        // optionally keep open so user can save; close automatically if desired:
        // win.close();
    }, 600);
}
