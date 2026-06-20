// === Manejo de filas ===
function isMobile() { return window.innerWidth <= 768; }

function agregarFila() {
    if (isMobile()) agregarFilaMobile();
    else agregarFilaDesktop();
}

function agregarFilaDesktop() {
    const tbody = document.getElementById('items-body-desktop');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" list="list-categorias" placeholder="Categoría"></td>
        <td><input type="text" list="list-subcategorias" placeholder="Subcategoría"></td>
        <td><input type="text" placeholder="Ítem"></td>
        <td><input type="number" min="1" step="1" value="1" class="text-end" oninput="calcularTotales()"></td>
        <td><input type="text" class="text-end precio-input" oninput="formatPrecio(this);calcularTotales()" placeholder="$0"></td>
        <td class="text-end total-celda">$0</td>
        <td class="text-center no-print"><button class="btn btn-sm btn-outline-danger" onclick="this.closest('tr').remove();calcularTotales()">×</button></td>
    `;
    tbody.appendChild(tr);
}

function agregarFilaMobile() {
    const container = document.getElementById('items-body-mobile');
    const card = document.createElement('div');
    card.className = 'item-card item-card-wrapper';
    card.innerHTML = `
        <button class="btn btn-sm btn-outline-danger btn-remove no-print" onclick="this.closest('.item-card').remove();calcularTotales()">X</button>
        <div class="row-fields">
            <div><label class="item-label">Categoría</label><input type="text" list="list-categorias" placeholder="Categoría"></div>
            <div><label class="item-label">Subcategoría</label><input type="text" list="list-subcategorias" placeholder="Subcategoría"></div>
        </div>
        <div class="row-full"><label class="item-label">Ítem</label><input type="text" placeholder="Ítem"></div>
        <div class="row-fields" style="margin-top:6px;">
            <div><label class="item-label">Cantidad</label><input type="number" min="1" step="1" value="1" oninput="calcularTotales()"></div>
            <div><label class="item-label">Precio Unit.</label><input type="text" class="precio-input" placeholder="$0" oninput="formatPrecio(this);calcularTotales()"></div>
        </div>
        <div class="item-total total-celda"><label class="item-label">Total</label>$0</div>
    `;
    container.appendChild(card);
}

// === Formato de precio en tiempo real ===
function formatPrecio(input) {
    let raw = input.value.replace(/[^0-9]/g, '');
    if (!raw) { input.value = ''; return; }
    input.value = '$' + parseInt(raw).toLocaleString('es-CL');
}

function parsePrecio(val) {
    return parseInt((val || '').replace(/[^0-9]/g, '')) || 0;
}

// === Cálculos ===
function calcularTotales() {
    let subtotal = 0;
    document.querySelectorAll('#items-body-desktop tr').forEach(tr => {
        const cant = parseFloat(tr.querySelector('input[type="number"]')?.value) || 0;
        const unit = parsePrecio(tr.querySelector('.precio-input')?.value);
        const t = cant * unit;
        tr.querySelector('.total-celda').textContent = formatCLP(t);
        subtotal += t;
    });
    document.querySelectorAll('#items-body-mobile .item-card').forEach(card => {
        const cant = parseFloat(card.querySelector('input[type="number"]')?.value) || 0;
        const unit = parsePrecio(card.querySelector('.precio-input')?.value);
        const t = cant * unit;
        card.querySelector('.total-celda').textContent = formatCLP(t);
        subtotal += t;
    });
    const iva = Math.round(subtotal * 0.19);
    document.getElementById('subtotal').textContent = formatCLP(subtotal);
    document.getElementById('neto').textContent = formatCLP(subtotal);
    document.getElementById('iva').textContent = formatCLP(iva);
    document.getElementById('total').textContent = formatCLP(subtotal + iva);
}

function formatCLP(n) { return '$' + Math.round(n).toLocaleString('es-CL'); }

// === Obtener items ===
function getItems() {
    const items = [];
    document.querySelectorAll('#items-body-desktop tr').forEach(tr => {
        const texts = tr.querySelectorAll('input[type="text"]');
        const cant = parseFloat(tr.querySelector('input[type="number"]')?.value) || 0;
        const unit = parsePrecio(tr.querySelector('.precio-input')?.value);
        items.push({ cat: texts[0]?.value||'', sub: texts[1]?.value||'', desc: texts[2]?.value||'', cant, unit });
    });
    document.querySelectorAll('#items-body-mobile .item-card').forEach(card => {
        const texts = card.querySelectorAll('input[type="text"]');
        const cant = parseFloat(card.querySelector('input[type="number"]')?.value) || 0;
        const unit = parsePrecio(card.querySelector('.precio-input')?.value);
        items.push({ cat: texts[0]?.value||'', sub: texts[1]?.value||'', desc: texts[2]?.value||'', cant, unit });
    });
    return items.filter(i => i.cat || i.sub || i.desc || i.unit);
}

// === Generación de PDF sobre plantilla Suscars ===
async function generarPDF() {
    const pdfUrl = '../../archivos/Suscars.pdf';
    const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
    const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
    const page = pdfDoc.getPages()[0];
    const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

    const fontSize = 9;
    const color = PDFLib.rgb(0.25, 0.25, 0.25);

    // Folio
    const folio = document.getElementById('folio').value;
    page.drawText(folio || '', { x: 200, y: 696.892, size: 12, font: fontBold, color });

    // Datos vehiculo/cliente
    const yRows = [674.928, 659.928, 644.928, 629.928, 614.928];
    const leftValues = [
        folio,
        document.getElementById('marca').value,
        document.getElementById('modelo').value,
        document.getElementById('kilometraje').value,
        document.getElementById('vin').value
    ];
    const rightValues = [
        document.getElementById('patente').value,
        document.getElementById('nombreCliente').value,
        document.getElementById('rutCliente').value,
        document.getElementById('telefono').value,
        document.getElementById('anio').value
    ];
    for (let i = 0; i < yRows.length; i++) {
        page.drawText(leftValues[i] || '', { x: 140, y: yRows[i], size: fontSize, font, color });
        page.drawText(rightValues[i] || '', { x: 410, y: yRows[i], size: fontSize, font, color });
    }

    // Titulo de seccion
    const tituloSeccion = document.getElementById('tituloSeccion').value;
    const rowStep = 15;
    if (tituloSeccion) {
        page.drawText(tituloSeccion.toUpperCase(), { x: 56, y: 514.169, size: 9, font: fontBold, color });
    }

    // Items
    const items = getItems();
    const maxItemsPag1 = 11;

    if (items.length <= maxItemsPag1) {
        let itemY = 514.169 - rowStep - 5;
        items.forEach(item => {
            const total = item.cant * item.unit;
            page.drawText(item.cat, { x: 46, y: itemY, size: 8, font, color });
            page.drawText(item.sub, { x: 171, y: itemY, size: 8, font, color });
            page.drawText(item.desc.substring(0, 40), { x: 270, y: itemY, size: 8, font, color });
            page.drawText(item.cant ? item.cant.toString() : '', { x: 415, y: itemY, size: 8, font, color });
            page.drawText(item.unit ? formatCLP(item.unit) : '', { x: 455, y: itemY, size: 8, font, color });
            page.drawText(total ? formatCLP(total) : '', { x: 515, y: itemY, size: 8, font, color });
            itemY -= rowStep;
        });

        page.drawText(document.getElementById('subtotal').textContent, { x: 515, y: 329.169, size: 9, font: fontBold, color });
        page.drawText(document.getElementById('neto').textContent, { x: 515, y: 293.41, size: 9, font: fontBold, color });
        page.drawText(document.getElementById('iva').textContent, { x: 515, y: 278.41, size: 9, font: fontBold, color });
        page.drawText(document.getElementById('total').textContent, { x: 515, y: 256.892, size: 10, font: fontBold, color });

        const now = new Date();
        const fecha = `${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
        page.drawText(fecha, { x: 46, y: 256.892, size: 12, font: fontBold, color });
        page.drawText(document.getElementById('recepciono').value || '', { x: 36, y: 40, size: 9, font, color });
        page.drawText(document.getElementById('contactoRecepcion').value || '', { x: 196, y: 40, size: 9, font, color });
        page.drawText(document.getElementById('emailRecepcion').value || '', { x: 376, y: 40, size: 9, font, color });

    } else {
        // Más de 11 ítems: usar plantilla v2 (sin totales) para pág 1
        // Reemplazar página 1 con la v2
        const v2Bytes = await fetch('../../archivos/Suscars - v2.pdf').then(res => res.arrayBuffer());
        const v2Doc = await PDFLib.PDFDocument.load(v2Bytes);
        const [v2Page] = await pdfDoc.copyPages(v2Doc, [0]);
        pdfDoc.removePage(0);
        pdfDoc.insertPage(0, v2Page);
        const pagina1 = pdfDoc.getPages()[0];

        // Datos vehículo/cliente en pág 1
        pagina1.drawText(folio || '', { x: 200, y: 696.892, size: 12, font: fontBold, color });
        for (let i = 0; i < yRows.length; i++) {
            pagina1.drawText(leftValues[i] || '', { x: 140, y: yRows[i], size: fontSize, font, color });
            pagina1.drawText(rightValues[i] || '', { x: 410, y: yRows[i], size: fontSize, font, color });
        }
        if (tituloSeccion) {
            pagina1.drawText(tituloSeccion.toUpperCase(), { x: 56, y: 514.169, size: 9, font: fontBold, color });
        }

        // Ítems en pág 1
        let itemY = 514.169 - rowStep - 5;
        items.slice(0, maxItemsPag1).forEach(item => {
            const total = item.cant * item.unit;
            pagina1.drawText(item.cat, { x: 46, y: itemY, size: 8, font, color });
            pagina1.drawText(item.sub, { x: 171, y: itemY, size: 8, font, color });
            pagina1.drawText(item.desc.substring(0, 40), { x: 270, y: itemY, size: 8, font, color });
            pagina1.drawText(item.cant ? item.cant.toString() : '', { x: 415, y: itemY, size: 8, font, color });
            pagina1.drawText(item.unit ? formatCLP(item.unit) : '', { x: 455, y: itemY, size: 8, font, color });
            pagina1.drawText(total ? formatCLP(total) : '', { x: 515, y: itemY, size: 8, font, color });
            itemY -= rowStep;
        });

        const now = new Date();
        const fecha = `${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
        pagina1.drawText(fecha, { x: 46, y: 256.892, size: 12, font: fontBold, color });
        pagina1.drawText(document.getElementById('recepciono').value || '', { x: 36, y: 40, size: 9, font, color });
        pagina1.drawText(document.getElementById('contactoRecepcion').value || '', { x: 196, y: 40, size: 9, font, color });
        pagina1.drawText(document.getElementById('emailRecepcion').value || '', { x: 376, y: 40, size: 9, font, color });

        // Página 2: plantilla normal (con totales)
        const [pagina2Template] = await pdfDoc.copyPages(v2Doc, [0]);
        // Usar plantilla original para pág 2 (tiene los totales)
        const origDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
        const [pag2] = await pdfDoc.copyPages(origDoc, [0]);
        pdfDoc.addPage(pag2);
        const page2 = pdfDoc.getPages()[1];

        // Datos vehículo/cliente en pág 2
        page2.drawText(folio || '', { x: 200, y: 696.892, size: 12, font: fontBold, color });
        for (let i = 0; i < yRows.length; i++) {
            page2.drawText(leftValues[i] || '', { x: 140, y: yRows[i], size: fontSize, font, color });
            page2.drawText(rightValues[i] || '', { x: 410, y: yRows[i], size: fontSize, font, color });
        }

        // Ítems restantes en pág 2
        let itemY2 = 514.169 - rowStep - 5;
        items.slice(maxItemsPag1).forEach(item => {
            const total = item.cant * item.unit;
            page2.drawText(item.cat, { x: 46, y: itemY2, size: 8, font, color });
            page2.drawText(item.sub, { x: 171, y: itemY2, size: 8, font, color });
            page2.drawText(item.desc.substring(0, 40), { x: 270, y: itemY2, size: 8, font, color });
            page2.drawText(item.cant ? item.cant.toString() : '', { x: 415, y: itemY2, size: 8, font, color });
            page2.drawText(item.unit ? formatCLP(item.unit) : '', { x: 455, y: itemY2, size: 8, font, color });
            page2.drawText(total ? formatCLP(total) : '', { x: 515, y: itemY2, size: 8, font, color });
            itemY2 -= rowStep;
        });

        // Totales solo en pág 2
        page2.drawText(document.getElementById('subtotal').textContent, { x: 515, y: 329.169, size: 9, font: fontBold, color });
        page2.drawText(document.getElementById('neto').textContent, { x: 515, y: 293.41, size: 9, font: fontBold, color });
        page2.drawText(document.getElementById('iva').textContent, { x: 515, y: 278.41, size: 9, font: fontBold, color });
        page2.drawText(document.getElementById('total').textContent, { x: 515, y: 256.892, size: 10, font: fontBold, color });

        page2.drawText(fecha, { x: 46, y: 256.892, size: 12, font: fontBold, color });
        page2.drawText(document.getElementById('recepciono').value || '', { x: 36, y: 40, size: 9, font, color });
        page2.drawText(document.getElementById('contactoRecepcion').value || '', { x: 196, y: 40, size: 9, font, color });
        page2.drawText(document.getElementById('emailRecepcion').value || '', { x: 376, y: 40, size: 9, font, color });
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    window.open(URL.createObjectURL(blob), '_blank');
}

// Iniciar
window.addEventListener('DOMContentLoaded', () => {});
