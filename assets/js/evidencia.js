/*
 * Evidencia: observación y fotos para los presupuestos (MaxiTaller y Suscars).
 *
 * - Observación: se imprime en la franja libre sobre el pie, en la última
 *   página de plantilla (hasta 5 líneas).
 * - Fotos: se agregan como páginas extra al final del PDF, 4 por página
 *   (2 x 2), con encabezado (logo, título «EVIDENCIA» y folio/patente), con las mismas reglas que el CheckList-Movil: máximo 16 fotos,
 *   compresión a 1200 px / JPEG 80 %, y cada foto se puede girar o eliminar.
 *
 * Requiere pdf-lib (PDFLib) cargado antes de generar el PDF.
 */
const Evidencia = (function () {
    const MAX_FOTOS = 16;
    const MAX_LADO = 1200;
    const CALIDAD = 0.8;
    const MAX_CARACTERES_OBS = 700;

    let fotos = []; // { src: dataURL JPEG, rotation: 0 | 90 | 180 | 270 }

    // ---------------------------------------------------------------
    // Formulario: selección y vista previa de fotos
    // ---------------------------------------------------------------
    function init() {
        const camara = document.getElementById('photoCaptureInput');
        const galeria = document.getElementById('photoGalleryInput');
        if (camara) camara.addEventListener('change', alSeleccionar);
        if (galeria) galeria.addEventListener('change', alSeleccionar);

        const obs = document.getElementById('observaciones');
        const contador = document.getElementById('obsContador');
        if (obs && contador) {
            const actualizar = () => { contador.textContent = obs.value.length + '/' + MAX_CARACTERES_OBS; };
            obs.addEventListener('input', actualizar);
            actualizar();
        }
    }

    async function alSeleccionar(e) {
        const archivos = Array.from(e.target.files);
        e.target.value = ''; // permite elegir la misma foto otra vez

        for (const archivo of archivos) {
            if (fotos.length >= MAX_FOTOS) {
                alert('Máximo ' + MAX_FOTOS + ' fotos permitidas');
                break;
            }
            try {
                const src = await procesarFoto(archivo);
                fotos.push({ src, rotation: 0 });
            } catch (err) {
                console.error('Error procesando foto:', err);
                alert('Error al procesar la foto. Intente nuevamente.');
            }
        }
        dibujarVista();
    }

    // Lee la foto, la reduce (máx. 1200 px) y la guarda como JPEG.
    // Al redibujarla en un canvas el navegador aplica la orientación EXIF.
    function procesarFoto(archivo) {
        return new Promise((resolve, reject) => {
            const lector = new FileReader();
            lector.onerror = () => reject(new Error('Error leyendo archivo'));
            lector.onload = (ev) => {
                const img = new Image();
                img.onerror = () => reject(new Error('Error cargando imagen'));
                img.onload = () => {
                    let ancho = img.width;
                    let alto = img.height;
                    if (ancho > MAX_LADO || alto > MAX_LADO) {
                        if (ancho > alto) {
                            alto = Math.round((alto * MAX_LADO) / ancho);
                            ancho = MAX_LADO;
                        } else {
                            ancho = Math.round((ancho * MAX_LADO) / alto);
                            alto = MAX_LADO;
                        }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = ancho;
                    canvas.height = alto;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#fff'; // evita fondo negro en PNG con transparencia
                    ctx.fillRect(0, 0, ancho, alto);
                    ctx.drawImage(img, 0, 0, ancho, alto);
                    resolve(canvas.toDataURL('image/jpeg', CALIDAD));
                };
                img.src = ev.target.result;
            };
            lector.readAsDataURL(archivo);
        });
    }

    function dibujarVista() {
        const contenedor = document.getElementById('photoPreview');
        if (!contenedor) return;
        contenedor.innerHTML = '';

        fotos.forEach((foto, i) => {
            const col = document.createElement('div');
            col.className = 'col-6 col-md-3 mb-3';

            const tarjeta = document.createElement('div');
            tarjeta.className = 'card';

            const caja = document.createElement('div');
            caja.style.cssText = 'height:150px;overflow:hidden;display:flex;align-items:center;justify-content:center;';
            const img = document.createElement('img');
            img.src = foto.src;
            img.alt = 'Foto ' + (i + 1);
            img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;transform:rotate(' + foto.rotation + 'deg);';
            caja.appendChild(img);

            const botones = document.createElement('div');
            botones.className = 'card-body p-2 text-center';

            const girar = document.createElement('button');
            girar.type = 'button';
            girar.className = 'btn btn-sm btn-secondary me-1';
            girar.textContent = 'Girar';
            girar.addEventListener('click', () => {
                foto.rotation = (foto.rotation + 90) % 360;
                dibujarVista();
            });

            const eliminar = document.createElement('button');
            eliminar.type = 'button';
            eliminar.className = 'btn btn-sm btn-danger';
            eliminar.textContent = 'Eliminar';
            eliminar.addEventListener('click', () => {
                fotos.splice(i, 1);
                dibujarVista();
            });

            botones.appendChild(girar);
            botones.appendChild(eliminar);
            tarjeta.appendChild(caja);
            tarjeta.appendChild(botones);
            col.appendChild(tarjeta);
            contenedor.appendChild(col);
        });
    }

    // ---------------------------------------------------------------
    // PDF: texto seguro
    // ---------------------------------------------------------------
    // La fuente estándar del PDF no soporta todos los caracteres (por ejemplo
    // emojis del teclado del celular) y pdf-lib lanza error al dibujarlos.
    // Se omiten los caracteres que la fuente no puede codificar.
    function limpiarTexto(font, texto) {
        let salida = '';
        for (const ch of String(texto || '')) {
            if (ch === '\n') { salida += ch; continue; }
            if (ch === '\r') continue;
            if (ch === '\t') { salida += ' '; continue; }
            try {
                font.encodeText(ch);
                salida += ch;
            } catch (e) {
                // carácter no soportado: se omite
            }
        }
        return salida;
    }

    // Parte el texto en líneas que caben en anchoMax (respeta saltos de línea).
    function envolverTexto(font, texto, tamano, anchoMax) {
        const lineas = [];
        texto.split('\n').forEach((parrafo) => {
            const palabras = parrafo.split(/\s+/).filter(Boolean);
            if (!palabras.length) { lineas.push(''); return; }

            let actual = '';
            for (let palabra of palabras) {
                // palabra más ancha que la línea: se corta por caracteres
                while (font.widthOfTextAtSize(palabra, tamano) > anchoMax) {
                    let n = palabra.length;
                    while (n > 1 && font.widthOfTextAtSize(palabra.slice(0, n), tamano) > anchoMax) n--;
                    if (actual) { lineas.push(actual); actual = ''; }
                    lineas.push(palabra.slice(0, n));
                    palabra = palabra.slice(n);
                }
                if (!palabra) continue;

                const prueba = actual ? actual + ' ' + palabra : palabra;
                if (font.widthOfTextAtSize(prueba, tamano) <= anchoMax) {
                    actual = prueba;
                } else {
                    lineas.push(actual);
                    actual = palabra;
                }
            }
            if (actual) lineas.push(actual);
        });
        return lineas;
    }

    // ---------------------------------------------------------------
    // PDF: observación (franja libre entre "Condiciones" y el pie)
    // ---------------------------------------------------------------
    // La franja libre mide 69 pt de alto (de y = 76 a y = 144) y va de x = 36 a x = 556.
    // Si el texto no cabe en 5 líneas a 8 pt, se reduce a 7 pt y se usan 6 líneas.
    // Con 700 caracteres cabe incluso escrito todo en mayúsculas.
    const NIVELES_OBS = [
        { tamano: 8, interlineado: 9, lineas: 5 },
        { tamano: 7, interlineado: 8, lineas: 6 }
    ];

    function dibujarObservacion(page, font, fontBold, color, texto) {
        const limpio = limpiarTexto(font, texto).trim();
        if (!limpio) return;

        const X = 36;
        const ANCHO = 520;

        // Primer nivel en que el texto cabe; si ninguno alcanza, se usa el último y se corta con "..."
        let nivel = NIVELES_OBS[NIVELES_OBS.length - 1];
        let lineas = null;
        for (const candidato of NIVELES_OBS) {
            const prueba = envolverTexto(font, limpio, candidato.tamano, ANCHO);
            if (prueba.length <= candidato.lineas) { nivel = candidato; lineas = prueba; break; }
        }
        if (!lineas) {
            lineas = envolverTexto(font, limpio, nivel.tamano, ANCHO).slice(0, nivel.lineas);
            let ultima = lineas[nivel.lineas - 1];
            while (ultima.length && font.widthOfTextAtSize(ultima + '...', nivel.tamano) > ANCHO) {
                ultima = ultima.slice(0, -1);
            }
            lineas[nivel.lineas - 1] = ultima + '...';
        }

        page.drawText('Observación', { x: X, y: 133.5, size: 8, font: fontBold, color });
        lineas.forEach((linea, i) => {
            page.drawText(linea, { x: X, y: 122 - i * nivel.interlineado, size: nivel.tamano, font, color });
        });
    }

    // ---------------------------------------------------------------
    // PDF: fotos (páginas extra al final, 4 por página)
    // ---------------------------------------------------------------
    function dataUrlABytes(dataUrl) {
        const binario = atob(dataUrl.split(',')[1]);
        const bytes = new Uint8Array(binario.length);
        for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
        return bytes;
    }

    function cargarImagen(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Error cargando imagen'));
            img.src = src;
        });
    }

    // Devuelve los bytes JPEG de la foto, ya girada si el usuario la giró.
    async function bytesJpeg(foto) {
        if (!foto.rotation) return dataUrlABytes(foto.src);

        const img = await cargarImagen(foto.src);
        const gira90 = foto.rotation % 180 !== 0;
        const canvas = document.createElement('canvas');
        canvas.width = gira90 ? img.height : img.width;
        canvas.height = gira90 ? img.width : img.height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((foto.rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        return dataUrlABytes(canvas.toDataURL('image/jpeg', 0.85));
    }

    // Carga el logo desde la URL indicada y lo incrusta una sola vez en el PDF.
    // Si no se puede cargar, devuelve null y las fotos se agregan sin logo.
    async function cargarLogo(pdfDoc, url) {
        if (!url) return null;
        try {
            const resp = await fetch(url);
            if (resp.ok === false) return null;
            const bytes = new Uint8Array(await resp.arrayBuffer());
            const esPng = bytes[0] === 0x89 && bytes[1] === 0x50;
            return esPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
        } catch (e) {
            console.warn('Logo no disponible para las páginas de fotos:', e);
            return null;
        }
    }

    // datos: { folio, patente, logoUrl, logoPos } para el encabezado de cada página de fotos.
    // logoPos { x, y, ancho, alto } es el tamaño y la posición del logo en la plantilla,
    // para que las páginas de fotos lo muestren igual que la primera página.
    // lista: solo para pruebas; por defecto usa las fotos cargadas en el formulario.
    async function agregarFotos(pdfDoc, font, fontBold, color, datos, lista) {
        const grupo = lista || fotos;
        if (!grupo.length) return;

        const PAG_W = 612, PAG_H = 792;
        const MARGEN = 36, ESPACIO = 20;
        const COL_W = 260, CAJA_H = 313, TOPE = 708;
        const LOGO_ALTO = 40;

        const info = datos || {};
        const logo = await cargarLogo(pdfDoc, info.logoUrl);
        const referencia = limpiarTexto(
            font,
            [info.folio ? 'Folio N° ' + info.folio : '', info.patente ? 'Patente ' + info.patente : ''].filter(Boolean).join('     |     ')
        );

        for (let i = 0; i < grupo.length; i += 4) {
            const pagina = pdfDoc.addPage([PAG_W, PAG_H]);

            // Encabezado: logo a la izquierda; título y referencia a la derecha
            if (logo) {
                const pos = info.logoPos || { x: MARGEN, y: 732, ancho: logo.width * (LOGO_ALTO / logo.height), alto: LOGO_ALTO };
                pagina.drawImage(logo, { x: pos.x, y: pos.y, width: pos.ancho, height: pos.alto });
            }
            const titulo = 'EVIDENCIA';
            const anchoTitulo = fontBold.widthOfTextAtSize(titulo, 12);
            pagina.drawText(titulo, { x: PAG_W - MARGEN - anchoTitulo, y: 752, size: 12, font: fontBold, color });
            if (referencia) {
                const ancho = fontBold.widthOfTextAtSize(referencia, 9);
                pagina.drawText(referencia, { x: PAG_W - MARGEN - ancho, y: 737, size: 9, font: fontBold, color });
            }
            pagina.drawLine({
                start: { x: MARGEN, y: 718 }, end: { x: PAG_W - MARGEN, y: 718 },
                thickness: 0.8, color: PDFLib.rgb(0.75, 0.75, 0.75)
            });

            const lote = grupo.slice(i, i + 4);
            for (let k = 0; k < lote.length; k++) {
                const col = k % 2;
                const fila = Math.floor(k / 2);
                const x = MARGEN + col * (COL_W + ESPACIO);
                const yBase = TOPE - fila * (CAJA_H + ESPACIO) - CAJA_H;

                pagina.drawRectangle({
                    x, y: yBase, width: COL_W, height: CAJA_H,
                    borderColor: PDFLib.rgb(0.8, 0.8, 0.8), borderWidth: 0.5
                });

                const imagen = await pdfDoc.embedJpg(await bytesJpeg(lote[k]));
                const escala = Math.min(COL_W / imagen.width, CAJA_H / imagen.height);
                const w = imagen.width * escala;
                const h = imagen.height * escala;
                pagina.drawImage(imagen, {
                    x: x + (COL_W - w) / 2,
                    y: yBase + (CAJA_H - h) / 2,
                    width: w,
                    height: h
                });
            }
        }
    }

    return {
        init,
        dibujarObservacion,
        agregarFotos,
        MAX_FOTOS,
        MAX_CARACTERES_OBS
    };
})();

if (typeof module !== 'undefined') module.exports = Evidencia;
