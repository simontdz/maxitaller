// === Detectar si es mobile ===
function isMobile() {
    return window.innerWidth <= 768;
}

// === Agregar fila ===
function agregarFila() {
    if (isMobile()) {
        agregarFilaMobile();
    } else {
        agregarFilaDesktop();
    }
}

function agregarFilaDesktop() {
    const tbody = document.getElementById('items-body-desktop');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" list="list-categorias" placeholder="Categoría"></td>
        <td><input type="text" list="list-subcategorias" placeholder="Subcategoría"></td>
        <td><input type="text" placeholder="Descripción"></td>
        <td><input type="number" min="0" step="0.1" class="text-end" oninput="calcularTotales()"></td>
        <td><input type="number" min="0" class="text-end" oninput="calcularTotales()"></td>
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
        <button class="btn btn-sm btn-outline-danger btn-remove no-print" onclick="this.closest('.item-card').remove();calcularTotales()">×</button>
        <div class="row-fields">
            <input type="text" list="list-categorias" placeholder="Categoría">
            <input type="text" list="list-subcategorias" placeholder="Subcategoría">
        </div>
        <div class="row-full">
            <input type="text" placeholder="Descripción del ítem">
        </div>
        <div class="row-fields" style="margin-top:6px;">
            <input type="number" min="0" step="0.1" placeholder="Cant." oninput="calcularTotales()">
            <input type="number" min="0" placeholder="$ Unitario" oninput="calcularTotales()">
        </div>
        <div class="item-total total-celda">$0</div>
    `;
    container.appendChild(card);
}

// === Calcular totales ===
function calcularTotales() {
    let subtotal = 0;

    // Desktop rows
    document.querySelectorAll('#items-body-desktop tr').forEach(tr => {
        const nums = tr.querySelectorAll('input[type="number"]');
        const cant = parseFloat(nums[0]?.value) || 0;
        const unit = parseFloat(nums[1]?.value) || 0;
        const t = cant * unit;
        tr.querySelector('.total-celda').textContent = formatCLP(t);
        subtotal += t;
    });

    // Mobile cards
    document.querySelectorAll('#items-body-mobile .item-card').forEach(card => {
        const nums = card.querySelectorAll('input[type="number"]');
        const cant = parseFloat(nums[0]?.value) || 0;
        const unit = parseFloat(nums[1]?.value) || 0;
        const t = cant * unit;
        card.querySelector('.total-celda').textContent = formatCLP(t);
        subtotal += t;
    });

    const iva = Math.round(subtotal * 0.19);
    const total = subtotal + iva;
    document.getElementById('subtotal').textContent = formatCLP(subtotal);
    document.getElementById('neto').textContent = formatCLP(subtotal);
    document.getElementById('iva').textContent = formatCLP(iva);
    document.getElementById('total').textContent = formatCLP(total);
}

function formatCLP(n) {
    return '$' + Math.round(n).toLocaleString('es-CL');
}

// === Obtener items desde cualquier vista ===
function getItems() {
    const items = [];

    document.querySelectorAll('#items-body-desktop tr').forEach(tr => {
        const texts = tr.querySelectorAll('input[type="text"]');
        const nums = tr.querySelectorAll('input[type="number"]');
        items.push({
            cat: texts[0]?.value || '',
            sub: texts[1]?.value || '',
            desc: texts[2]?.value || '',
            cant: parseFloat(nums[0]?.value) || 0,
            unit: parseFloat(nums[1]?.value) || 0
        });
    });

    document.querySelectorAll('#items-body-mobile .item-card').forEach(card => {
        const texts = card.querySelectorAll('input[type="text"]');
        const nums = card.querySelectorAll('input[type="number"]');
        items.push({
            cat: texts[0]?.value || '',
            sub: texts[1]?.value || '',
            desc: texts[2]?.value || '',
            cant: parseFloat(nums[0]?.value) || 0,
            unit: parseFloat(nums[1]?.value) || 0
        });
    });

    return items.filter(i => i.desc || i.cant || i.unit);
}

// === Generación de PDF ===
function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'letter');
    const w = doc.internal.pageSize.getWidth();
    let y = 12;

    // Logo
    try { doc.addImage(document.getElementById('logo-img'), 'JPEG', 10, 8, 40, 21); } catch(e) {}

    // Header
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('MAXI TALLER', 130, y);
    y += 5;
    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    doc.text('TALLER MECÁNICO, COMPRA VENTA DE', 130, y); y += 3;
    doc.text('REPUESTOS DE VEHÍCULO Y ACCESORIOS', 130, y); y += 4;
    doc.text('77.273.194-9', 130, y); y += 3;
    doc.text('10 NORTE #1696 TALCA', 130, y); y += 3;
    doc.text('Email: MAXITALLERSPA@GMAIL.COM', 130, y); y += 3;
    doc.text('Teléfono: +56961632668', 130, y);
    y = 38;

    // Folio
    const folio = document.getElementById('folio').value;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`PRESUPUESTO FOLIO N° ${folio}`, w / 2, y, { align: 'center' });
    y += 8;

    // Datos vehículo/cliente
    doc.setFontSize(8);
    const leftCol = 15;
    const midCol = w / 2 + 5;
    const rowH = 7;
    const campos = [
        ['Nro. de Ppto.', folio, 'Patente/Código', document.getElementById('patente').value],
        ['Marca', document.getElementById('marca').value, 'Nombre Cliente', document.getElementById('nombreCliente').value],
        ['Modelo', document.getElementById('modelo').value, 'Rut', document.getElementById('rutCliente').value],
        ['Kilometraje / Horas', document.getElementById('kilometraje').value, 'Teléfono', document.getElementById('telefono').value],
        ['VIN', document.getElementById('vin').value, 'Año', document.getElementById('anio').value]
    ];

    campos.forEach(row => {
        doc.rect(leftCol, y - 4.5, (w / 2) - 10, rowH);
        doc.setFont(undefined, 'bold');
        doc.text(row[0], leftCol + 2, y);
        doc.setFont(undefined, 'normal');
        doc.text(row[1] || '', leftCol + 38, y);
        doc.rect(midCol, y - 4.5, (w / 2) - 10, rowH);
        doc.setFont(undefined, 'bold');
        doc.text(row[2], midCol + 2, y);
        doc.setFont(undefined, 'normal');
        doc.text(row[3] || '', midCol + 35, y);
        y += rowH;
    });
    y += 5;

    // Título tabla
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('INFORMACIÓN DE PRESUPUESTO', leftCol, y);
    y += 5;

    // Header tabla
    const colX = [15, 48, 80, 135, 155, 178];
    const colW = [33, 32, 55, 20, 23, 23];
    const headers = ['Categoría', 'Subcategoría', 'Item', 'Cantidad', '$ Unit.', '$ Total'];
    doc.setFillColor(52, 58, 64);
    doc.rect(15, y - 4, w - 30, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    headers.forEach((h, i) => doc.text(h, colX[i] + 1, y));
    doc.setTextColor(0, 0, 0);
    y += 4;

    // Filas
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7.5);
    const items = getItems();
    items.forEach(item => {
        if (y > 245) { doc.addPage(); y = 15; }
        colW.forEach((cw, i) => doc.rect(colX[i], y - 3.5, cw, 5));
        doc.text(item.cat, colX[0] + 1, y);
        doc.text(item.sub, colX[1] + 1, y);
        doc.text(item.desc.substring(0, 35), colX[2] + 1, y);
        doc.text(item.cant ? item.cant.toString() : '', colX[3] + 1, y);
        doc.text(item.unit ? formatCLP(item.unit) : '', colX[4] + 1, y);
        doc.text(formatCLP(item.cant * item.unit), colX[5] + 1, y);
        y += 5;
    });

    // Totales
    y += 5;
    doc.setFontSize(9);
    const subtotal = document.getElementById('subtotal').textContent;
    const neto = document.getElementById('neto').textContent;
    const iva = document.getElementById('iva').textContent;
    const total = document.getElementById('total').textContent;

    doc.setFont(undefined, 'bold');
    doc.text('Subtotal', 145, y); doc.text(subtotal, 180, y); y += 5;
    doc.text('Valor Neto', 145, y); doc.text(neto, 180, y); y += 5;
    doc.text('IVA', 145, y); doc.text(iva, 180, y); y += 5;
    doc.text('Total', 145, y); doc.text(total, 180, y);

    const fecha = new Date().toLocaleString('es-CL', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7);
    doc.text(fecha, 120, y);
    y += 10;

    // Condiciones
    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.text('CONDICIONES', leftCol, y); y += 4;
    doc.setFont(undefined, 'normal');
    const cond = [
        '1. Los presupuestos se realizan de buena fe, muchas veces al desarmar se observan nuevas fallas a reparar.',
        '2. El auto no se entrega sin previo pago de todos los trabajos autorizados.',
        '3. No se aceptan cheques.',
        '4. El lavado de cortesía aplica únicamente para servicios de mantención.'
    ];
    cond.forEach(c => { doc.text(c, leftCol, y, { maxWidth: w - 30 }); y += 4; });

    // Recepcionó
    y += 3;
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('Recepcionó', leftCol, y);
    doc.text('Contacto', 80, y);
    doc.text('Email', 140, y);
    y += 4;
    doc.setFont(undefined, 'normal');
    doc.text(document.getElementById('recepciono').value || '', leftCol, y);
    doc.text('+56961632668', 80, y);
    doc.text('MAXITALLERSPA@GMAIL.COM', 140, y);

    window.open(doc.output('bloburl'), '_blank');
}

// Iniciar con filas
window.addEventListener('DOMContentLoaded', () => {
    for (let i = 0; i < 3; i++) agregarFila();
});
