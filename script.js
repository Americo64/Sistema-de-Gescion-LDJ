document.addEventListener('DOMContentLoaded', () => {

    // --- NAVEGACIÓN PRINCIPAL ---
    const navStockDesktop = document.getElementById('nav-stock-desktop');
    const navGuiaDesktop = document.getElementById('nav-guia-desktop');
    const navStockMobile = document.getElementById('nav-stock-mobile');
    const navGuiaMobile = document.getElementById('nav-guia-mobile');
    const stockModule = document.getElementById('stock-module');
    const guiaModule = document.getElementById('guia-module');
    let guiaAppLoaded = false;

    function activateStockView() {
        stockModule.classList.remove('hidden');
        guiaModule.classList.add('hidden');
        navStockDesktop.classList.add('active');
        navGuiaDesktop.classList.remove('active');
        navStockMobile.classList.add('active');
        navGuiaMobile.classList.remove('active');
    }

    function activateGuiaView() {
        stockModule.classList.add('hidden');
        guiaModule.classList.remove('hidden');
        navStockDesktop.classList.remove('active');
        navGuiaDesktop.classList.add('active');
        navStockMobile.classList.remove('active');
        navGuiaMobile.classList.add('active');
        if (!guiaAppLoaded) {
            loadGuiaApp();
            guiaAppLoaded = true;
        }
    }

    navStockDesktop.addEventListener('click', activateStockView);
    navGuiaDesktop.addEventListener('click', activateGuiaView);
    navStockMobile.addEventListener('click', activateStockView);
    navGuiaMobile.addEventListener('click', activateGuiaView);

    loadStockApp();

    // --- LÓGICA DEL MÓDULO DE CONTROL DE STOCK ---
    function loadStockApp() {
        const ubicacionInput = document.getElementById('ubicacion');
        const ingresoInput = document.getElementById('ingreso');
        const enviadoInput = document.getElementById('enviado');
        const agregarBtn = document.getElementById('agregar-btn');
        const tablaCuerpo = document.getElementById('tabla-cuerpo');
        const totalIngresoTd = document.getElementById('total-ingreso');
        const totalEnviadoTd = document.getElementById('total-enviado');
        const totalFinalTd = document.getElementById('total-final');
        const reporteContainer = document.getElementById('reporte-individual-container');
        const reporteTexto = document.getElementById('reporte-texto');
        const cerrarReporteBtn = document.getElementById('cerrar-reporte-btn');
        const gerenciaReportBtn = document.getElementById('gerencia-report-btn');
        const whatsappShareBtn = document.getElementById('whatsapp-share-btn');
        let sucursales = [];

        function getFormattedDateTime() {
            const now = new Date();
            const optionsDate = { day: '2-digit', month: '2-digit', year: 'numeric' };
            const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: true };
            const fecha = now.toLocaleDateString('es-PE', optionsDate);
            const hora = now.toLocaleTimeString('es-PE', optionsTime);
            return { fecha, hora };
        }

        function renderizarTabla() {
            tablaCuerpo.innerHTML = '';
            let totalIngreso = 0, totalEnviado = 0, totalFinal = 0;
            sucursales.forEach((sucursal, index) => {
                const fila = document.createElement('tr');
                const final = sucursal.ingreso - sucursal.enviado;
                fila.innerHTML = `
                    <td data-label="Sucursal" class="card-header"><span class="sucursal-nombre">${sucursal.nombre}</span><span class="sucursal-final">Final: ${final}</span></td>
                    <td data-label="Ingreso" class="card-detail">${sucursal.ingreso}</td>
                    <td data-label="Enviado" class="card-detail">${sucursal.enviado}</td>
                    <td data-label="Acciones" class="card-detail"><button class="action-btn report-btn" data-index="${index}">Reporte</button><button class="action-btn delete-btn" data-index="${index}">Eliminar</button></td>`;
                tablaCuerpo.appendChild(fila);
                totalIngreso += sucursal.ingreso;
                totalEnviado += sucursal.enviado;
                totalFinal += final;
            });
            totalIngresoTd.textContent = totalIngreso;
            totalEnviadoTd.textContent = totalEnviado;
            totalFinalTd.textContent = totalFinal;
        }

        function mostrarReporte(textoFormateado) {
            reporteTexto.textContent = textoFormateado;
            const whatsappText = encodeURIComponent(textoFormateado);
            const whatsappUrl = `https://api.whatsapp.com/send?text=${whatsappText}`;
            whatsappShareBtn.href = whatsappUrl;
            reporteContainer.style.display = 'block';
        }

        function mostrarReporteIndividual(index) {
            const sucursal = sucursales[index];
            const final = sucursal.ingreso - sucursal.enviado;
            const { fecha, hora } = getFormattedDateTime();
            const texto = `---------------------------------\n*STOCK DE POLLO ${sucursal.nombre.toUpperCase()}*\n---------------------------------\n*Fecha:* ${fecha}\n*Hora:* ${hora}\n- *Ingreso Inicial....:* ${sucursal.ingreso} unidades\n- *Unidades Enviadas...:* ${sucursal.enviado} unidades\n---------------------------------\n- *STOCK ALMACÉN........:* ${final} unidades\n\n`.trim();
            mostrarReporte(texto);
        }

        function mostrarReporteGerencia() {
            if (sucursales.length === 0) { alert('No hay datos para generar un reporte.'); return; }
            const { fecha, hora } = getFormattedDateTime();
            let detalleSucursales = '';
            let totalIngreso = 0, totalEnviado = 0, totalFinal = 0;
            sucursales.forEach(sucursal => {
                const final = sucursal.ingreso - sucursal.enviado;
                detalleSucursales += `\n  - *${sucursal.nombre}:*\n    Ingreso: ${sucursal.ingreso}, Enviado: ${sucursal.enviado}, Final: ${final}`;
                totalIngreso += sucursal.ingreso;
                totalEnviado += sucursal.enviado;
                totalFinal += final;
            });
            const texto = `=================================\n*STOCK DE POLLO - ALMACÉN*\n=================================\n*Fecha:* ${fecha}\n*Hora:* ${hora}\n\nResumen consolidado de stock del día:\n*Detalle por Sucursal:*\n${detalleSucursales.trim()}\n\n---------------------------------\n*TOTALES:*\n- *Ingresos Totales...:* ${totalIngreso}\n- *Envíos Totales.....:* ${totalEnviado}\n---------------------------------\n- *STOCK FINAL ALMACÉN..:* ${totalFinal}\n=================================`.trim();
            mostrarReporte(texto);
        }

        function agregarSucursal() {
            const nombre = ubicacionInput.value;
            const ingreso = parseInt(ingresoInput.value);
            const enviado = parseInt(enviadoInput.value);
            if (nombre === '' || isNaN(ingreso) || isNaN(enviado)) { alert('Por favor, completa todos los campos con valores válidos.'); return; }
            sucursales.push({ nombre, ingreso, enviado });
            renderizarTabla();
            ubicacionInput.value = '';
            ingresoInput.value = '';
            enviadoInput.value = '';
            ubicacionInput.focus();
        }

        function manejarClicsTabla(event) {
            const target = event.target;
            if (target.classList.contains('action-btn')) {
                const index = parseInt(target.dataset.index);
                if (target.classList.contains('report-btn')) mostrarReporteIndividual(index);
                if (target.classList.contains('delete-btn')) {
                    sucursales.splice(index, 1);
                    renderizarTabla();
                    reporteContainer.style.display = 'none';
                }
                return;
            }
            const cardHeader = target.closest('.card-header');
            if (cardHeader) cardHeader.parentElement.classList.toggle('expanded');
        }

        agregarBtn.addEventListener('click', agregarSucursal);
        tablaCuerpo.addEventListener('click', manejarClicsTabla);
        cerrarReporteBtn.addEventListener('click', () => { reporteContainer.style.display = 'none'; });
        gerenciaReportBtn.addEventListener('click', mostrarReporteGerencia);
    }

    // --- LÓGICA DEL MÓDULO DE GUÍA DE REMISIÓN ---
    function loadGuiaApp() {
        const mockEmpresas = [
            { id: 'emp1', ruc: '20609607395', razonSocial: 'IJG Inversiones Janampa Guevara S.A.C.', direccion: 'Av. Victor Malasquez Mza. B2 Lote. 09 A.H. Huertos De Manchay', distrito: 'Pachacamac' },
            { id: 'emp2', ruc: '20609518562', razonSocial: 'ICM Inversiones Cortez Maldonado S.A.C.', direccion: 'Ch. Pachac. Iv Et. Parc. 3a Manzana Z1 Lote 25', distrito: 'Pachacamac' },
            { id: 'emp3', ruc: '20546449573', razonSocial: 'Lo De Juan Chicken Grill S.R.L', direccion: 'Av. Victor Malasquez Mza. B2 Lote. 09 A.H. Huertos De Manchay', distrito: 'Pachacamac' },
            { id: 'emp4', ruc: '20610392017', razonSocial: 'Tucfer S.A.C.', direccion: 'Grupo Residencial 27a Mza. I Lote. 21 sec. 3', distrito: 'Villa El Salvador' },
            { id: 'emp5', ruc: '20608779532', razonSocial: 'Alero Inversiones S.A.C.', direccion: 'Av. Talara Con Los Alamos Mza. A Lote. 13 Sec. 3 - Grupo 24', distrito: 'Villa El Salvador' },
        ];
        const mockProductos = [
            { id: 'prod1', category: 'VERDURAS', descripcion: 'LECHUGA AMERICANA', unidad: 'DOC', itemsPerUnit: 12.0 }, { id: 'prod2', category: 'VERDURAS', descripcion: 'LECHUGA CRESPA', unidad: 'DOC', itemsPerUnit: 12.0 }, { id: 'prod3', category: 'VERDURAS', descripcion: 'LIMON', unidad: 'KG', itemsPerUnit: 1.0 }, { id: 'prod4', category: 'VERDURAS', descripcion: 'MANZANA', unidad: 'KG', itemsPerUnit: 1.0 }, { id: 'prod5', category: 'VERDURAS', descripcion: 'PALTA', unidad: 'KG', itemsPerUnit: 1.0 }, { id: 'prod6', category: 'VERDURAS', descripcion: 'PAPA BLANCA', unidad: 'KG', itemsPerUnit: 1.0 }, { id: 'prod7', category: 'VERDURAS', descripcion: 'PECANA', unidad: 'KG', itemsPerUnit: 1.0 }, { id: 'prod8', category: 'VERDURAS', descripcion: 'PEPINO', unidad: 'DOC', itemsPerUnit: 12 }, { id: 'prod9', category: 'VERDURAS', descripcion: 'PIMIENTO', unidad: 'KG', itemsPerUnit: 1.0 }, { id: 'prod10', category: 'VERDURAS', descripcion: 'PIÑA', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod11', category: 'VERDURAS', descripcion: 'ROMERO', unidad: 'ATADO', itemsPerUnit: 1.0 }, { id: 'prod12', category: 'VERDURAS', descripcion: 'TOMATE', unidad: 'KG', itemsPerUnit: 1.0 }, { id: 'prod13', category: 'VERDURAS', descripcion: 'VAINITA', unidad: 'KG', itemsPerUnit: 1.0 }, { id: 'prod14', category: 'VERDURAS', descripcion: 'ZANAHORIA', unidad: 'KG', itemsPerUnit: 1.0 }, { id: 'prod15', category: 'VERDURAS', descripcion: 'AJO', unidad: 'KG', itemsPerUnit: 1.0 }, { id: 'prod16', category: 'VERDURAS', descripcion: 'BETERRAGA', unidad: 'KG', itemsPerUnit: 1.0 }, { id: 'prod17', category: 'VERDURAS', descripcion: 'CEBOLLA BLANCA', unidad: 'KG', itemsPerUnit: 1.0 }, { id: 'prod18', category: 'VERDURAS', descripcion: 'CHAMPIGÑON', unidad: 'BANDEJA', itemsPerUnit: 1.0 }, { id: 'prod19', category: 'VERDURAS', descripcion: 'CHOCLO', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod20', category: 'VERDURAS', descripcion: 'ESPINACAS', unidad: 'ATADO', itemsPerUnit: 1.0 }, { id: 'prod21', category: 'VERDURAS', descripcion: 'HUEVO DE CODORNIZ', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod22', category: 'VERDURAS', descripcion: 'CEBOLLA CHINA', unidad: 'ATADO', itemsPerUnit: 1.0 }, { id: 'prod23', category: 'VERDURAS', descripcion: 'CEBOLLA CHINA PROCESADA', unidad: 'PQT', itemsPerUnit: 1.0 }, { id: 'prod24', category: 'VERDURAS', descripcion: 'NARANJA', unidad: 'KG', itemsPerUnit: 1.0 }, { id: 'prod25', category: 'VERDURAS', descripcion: 'BRÓCOLI', unidad: 'KG', itemsPerUnit: 1.0 },
            { id: 'prod26', category: 'ABARROTES', descripcion: 'ACEITE MONTESOL X 18 Lt.', unidad: 'LATA', itemsPerUnit: 1.0 }, { id: 'prod27', category: 'ABARROTES', descripcion: 'ACEITE DE OLIVA', unidad: 'BOT', itemsPerUnit: 1.0 }, { id: 'prod28', category: 'ABARROTES', descripcion: 'ANÍS', unidad: 'CAJA', itemsPerUnit: 1.0 }, { id: 'prod29', category: 'ABARROTES', descripcion: 'ARROZ', unidad: 'KG', itemsPerUnit: 1.0 }, { id: 'prod30', category: 'ABARROTES', descripcion: 'AZÚCAR SACHET', unidad: 'KG', itemsPerUnit: 1.0 }, { id: 'prod31', category: 'ABARROTES', descripcion: 'AZÚCAR BLANCA', unidad: 'KG', itemsPerUnit: 1.0 }, { id: 'prod32', category: 'ABARROTES', descripcion: 'AZÚCAR RUBIA', unidad: 'KG', itemsPerUnit: 1.0 }, { id: 'prod33', category: 'ABARROTES', descripcion: 'CAFÉ GRANEL', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod34', category: 'ABARROTES', descripcion: 'GUANTES DE CUERO', unidad: 'PAR', itemsPerUnit: 2.0 }, { id: 'prod35', category: 'ABARROTES', descripcion: 'KETCHUP GRANEL', unidad: 'KG', itemsPerUnit: 1.0 }, { id: 'prod36', category: 'ABARROTES', descripcion: 'KETCHUP SACHET', unidad: 'CAJA', itemsPerUnit: 1.0 }, { id: 'prod37', category: 'ABARROTES', descripcion: 'LECHE EVAPORADA', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod38', category: 'ABARROTES', descripcion: 'MANZANILLA', unidad: 'CAJA', itemsPerUnit: 1.0 }, { id: 'prod39', category: 'ABARROTES', descripcion: 'MOSTAZA GRANEL', unidad: 'KG', itemsPerUnit: 1.0 }, { id: 'prod40', category: 'ABARROTES', descripcion: 'MOSTAZA SACHET', unidad: 'CAJA', itemsPerUnit: 1.0 }, { id: 'prod41', category: 'ABARROTES', descripcion: 'PIÑA EN CONSERVA', unidad: 'LATA', itemsPerUnit: 1.0 }, { id: 'prod42', category: 'ABARROTES', descripcion: 'SAL', unidad: 'KG', itemsPerUnit: 1.0 }, { id: 'prod43', category: 'ABARROTES', descripcion: 'SALSA BBQ', unidad: 'BOT', itemsPerUnit: 1.0 }, { id: 'prod44', category: 'ABARROTES', descripcion: 'TÉ', unidad: 'CAJA', itemsPerUnit: 1.0 }, { id: 'prod45', category: 'ABARROTES', descripcion: 'PIMIENTA NEGRA', unidad: 'FRASCO', itemsPerUnit: 1.0 }, { id: 'prod46', category: 'ABARROTES', descripcion: 'SERVILLETAS', unidad: 'PQT', itemsPerUnit: 1.0 }, { id: 'prod47', category: 'ABARROTES', descripcion: 'SODA CAUSTICA ESCAMAS', unidad: 'KG', itemsPerUnit: 1.0 }, { id: 'prod48', category: 'ABARROTES', descripcion: 'SORBETE ESPECIAL PLANCHA', unidad: 'PQT', itemsPerUnit: 1.0 }, { id: 'prod49', category: 'ABARROTES', descripcion: 'PAPEL MANTECA', unidad: 'PQT', itemsPerUnit: 1.0 }, { id: 'prod50', category: 'ABARROTES', descripcion: 'LIGAS DE POLLO', unidad: 'PQT', itemsPerUnit: 1.0 }, { id: 'prod51', category: 'ABARROTES', descripcion: 'LIGAS', unidad: 'CAJA', itemsPerUnit: 1.0 }, { id: 'prod52', category: 'ABARROTES', descripcion: 'HUEVO', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod53', category: 'ABARROTES', descripcion: 'ACEITE DE AJONJOLI', unidad: 'BOT', itemsPerUnit: 1.0 },
            { id: 'prod54', category: 'CARNES', descripcion: 'FILETE DE PECHUGA x 30', unidad: 'UND', itemsPerUnit: 30 }, { id: 'prod55', category: 'CARNES', descripcion: 'MOLLEJA DE POLLO x 25', unidad: 'PORC', itemsPerUnit: 25 }, { id: 'prod56', category: 'CARNES', descripcion: 'LOMO X 200 GR x 20', unidad: 'UND', itemsPerUnit: 20 }, { id: 'prod57', category: 'CARNES', descripcion: 'CHULETA x 20', unidad: 'UND', itemsPerUnit: 20 }, { id: 'prod58', category: 'CARNES', descripcion: 'RACHI x 20', unidad: 'PORC', itemsPerUnit: 20 }, { id: 'prod59', category: 'CARNES', descripcion: 'ANTICUCHO x 40', unidad: 'PAL', itemsPerUnit: 40 }, { id: 'prod60', category: 'CARNES', descripcion: 'BIFE x 20', unidad: 'UND', itemsPerUnit: 20 }, { id: 'prod61', category: 'CARNES', descripcion: 'CHURRASCO x 15', unidad: 'UND', itemsPerUnit: 15 }, { id: 'prod62', category: 'CARNES', descripcion: 'CHORIZO x 60', unidad: 'UND', itemsPerUnit: 60 }, { id: 'prod63', category: 'CARNES', descripcion: 'COSTILLA x 15', unidad: 'UND', itemsPerUnit: 15 }, { id: 'prod64', category: 'CARNES', descripcion: 'MORCILLA', unidad: 'UND', itemsPerUnit: 12 },
            { id: 'prod67', category: 'BEBIDAS', descripcion: 'GASEOSA INCA KOLA DE 1.5 LITRO', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod68', category: 'BEBIDAS', descripcion: 'GASEOSA INCA KOLA DE 1 LITRO', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod69', category: 'BEBIDAS', descripcion: 'GASEOSA INCA KOLA DE 1/2 LITRO', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod70', category: 'BEBIDAS', descripcion: 'GASEOSA COCA COLA DE 1.5 LITRO', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod71', category: 'BEBIDAS', descripcion: 'GASEOSA COCA COLA DE 1 LITRO', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod72', category: 'BEBIDAS', descripcion: 'GASEOSA COCA COLA DE 1/2 LITRO', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod73', category: 'BEBIDAS', descripcion: 'CERVEZA PILSEN', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod74', category: 'BEBIDAS', descripcion: 'CERVEZA CUSQUEÑA NEGRA', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod75', category: 'BEBIDAS', descripcion: 'CERVEZA CUSQUEÑA DORADA', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod76', category: 'BEBIDAS', descripcion: 'CERVEZA CUSQUEÑA TRIGO', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod77', category: 'BEBIDAS', descripcion: 'AGUA MINERAL 3 LITROS', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod78', category: 'BEBIDAS', descripcion: 'AGUA SAN LUIS CON GAS 600 ML', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod79', category: 'BEBIDAS', descripcion: 'AGUA SAN LUIS SIN GAS 600 ML', unidad: 'UND', itemsPerUnit: 1.0 },
            { id: 'prod80', category: 'LICORES', descripcion: 'ALGARROBINA', unidad: 'BOT', itemsPerUnit: 1.0 }, { id: 'prod81', category: 'LICORES', descripcion: 'AMARGO DE ANGOSTURA', unidad: 'BOT', itemsPerUnit: 1.0 }, { id: 'prod82', category: 'LICORES', descripcion: 'CREMA DE COCO', unidad: 'BOT', itemsPerUnit: 1.0 }, { id: 'prod83', category: 'LICORES', descripcion: 'CREMA DE MENTA', unidad: 'BOT', itemsPerUnit: 1.0 }, { id: 'prod84', category: 'LICORES', descripcion: 'EVERVESS', unidad: 'BOT', itemsPerUnit: 1.0 }, { id: 'prod85', category: 'LICORES', descripcion: 'JARABE DE GOMA', unidad: 'BOT', itemsPerUnit: 1.0 }, { id: 'prod86', category: 'LICORES', descripcion: 'JARABE DE GRANADINA', unidad: 'BOT', itemsPerUnit: 1.0 }, { id: 'prod87', category: 'LICORES', descripcion: 'JUGO DE PIÑA', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod88', category: 'LICORES', descripcion: 'JUGO DE NARANJA', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod89', category: 'LICORES', descripcion: 'LICOR DE CACAO', unidad: 'BOT', itemsPerUnit: 1.0 }, { id: 'prod90', category: 'LICORES', descripcion: 'MARRASQUINO', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod91', category: 'LICORES', descripcion: 'PISCO', unidad: 'BOT', itemsPerUnit: 1.0 }, { id: 'prod92', category: 'LICORES', descripcion: 'RON BLANCO', unidad: 'BOT', itemsPerUnit: 1.0 }, { id: 'prod93', category: 'LICORES', descripcion: 'RON RUBIO', unidad: 'BOT', itemsPerUnit: 1.0 }, { id: 'prod94', category: 'LICORES', descripcion: 'VINO BORGOÑA', unidad: 'BOT', itemsPerUnit: 1.0 }, { id: 'prod95', category: 'LICORES', descripcion: 'VINO MAGDALENA', unidad: 'BOT', itemsPerUnit: 1.0 }, { id: 'prod96', category: 'LICORES', descripcion: 'VINO PEDRAS NEGRAS', unidad: 'BOT', itemsPerUnit: 1.0 }, { id: 'prod97', category: 'LICORES', descripcion: 'VINO ROSÉ', unidad: 'BOT', itemsPerUnit: 1.0 }, { id: 'prod98', category: 'LICORES', descripcion: 'VINO INTIKALPA', unidad: 'BOT', itemsPerUnit: 1.0 }, { id: 'prod99', category: 'LICORES', descripcion: 'VINO BLANCO (gato negro)', unidad: 'UND', itemsPerUnit: 1.0 },
            { id: 'prod100', category: 'CREMAS', descripcion: 'CREMA MAYONESA', unidad: 'BOL', itemsPerUnit: 1.0 }, { id: 'prod101', category: 'CREMAS', descripcion: 'CREMA AJÍ', unidad: 'BOL', itemsPerUnit: 1.0 }, { id: 'prod102', category: 'CREMAS', descripcion: 'CREMA VINAGRETA', unidad: 'BOL', itemsPerUnit: 1.0 }, { id: 'prod103', category: 'CREMAS', descripcion: 'CHIMICHURRI', unidad: 'BOL', itemsPerUnit: 1.0 }, { id: 'prod104', category: 'CREMAS', descripcion: 'ACEVICHADO', unidad: 'BOL', itemsPerUnit: 1.0 }, { id: 'prod105', category: 'CREMAS', descripcion: 'BBQ ROCOTO', unidad: 'BOL', itemsPerUnit: 1.0 }, { id: 'prod106', category: 'CREMAS', descripcion: 'BBQ AJI LIMO', unidad: 'BOL', itemsPerUnit: 1.0 }, { id: 'prod107', category: 'CREMAS', descripcion: 'BBQ LJD', unidad: 'BOL', itemsPerUnit: 1.0 }, { id: 'prod108', category: 'CREMAS', descripcion: 'CHIMICHURRI x 2', unidad: 'KG', itemsPerUnit: 1.0 }, { id: 'prod109', category: 'CREMAS', descripcion: 'SALSA ANTICUCHERA X 1', unidad: 'KG', itemsPerUnit: 1.0 }, { id: 'prod110', category: 'CREMAS', descripcion: 'SAL PREPARADA X 2', unidad: 'KG', itemsPerUnit: 1.0 }, { id: 'prod111', category: 'CREMAS', descripcion: 'ADEREZO PARRILLA 1', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod112', category: 'CREMAS', descripcion: 'SALSA DE OREGANO X 250', unidad: 'GR', itemsPerUnit: 1.0 }, { id: 'prod113', category: 'CREMAS', descripcion: 'AHUMADO PARA CHAUFA', unidad: 'KG', itemsPerUnit: 1.0 }, { id: 'prod114', category: 'CREMAS', descripcion: 'TEQUEÑOS', unidad: 'PORC', itemsPerUnit: 1.0 }, { id: 'prod115', category: 'CREMAS', descripcion: 'ARROZ CHAUFA', unidad: 'PQT', itemsPerUnit: 1.0 }, { id: 'prod116', category: 'CREMAS', descripcion: 'ALITAS', unidad: 'PORC', itemsPerUnit: 1.0 },
            { id: 'prod117', category: 'LIMPIEZA', descripcion: 'DETERGENTE', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod118', category: 'LIMPIEZA', descripcion: 'ESCOBA DE MADERA', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod119', category: 'LIMPIEZA', descripcion: 'ESCOBA DE PARRILLA', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod120', category: 'LIMPIEZA', descripcion: 'ESCOBA DE PLÁSTICO', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod121', category: 'LIMPIEZA', descripcion: 'ESPONJA DUO', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod122', category: 'LIMPIEZA', descripcion: 'ESPONJA MÁQUINA', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod123', category: 'LIMPIEZA', descripcion: 'ESPONJA VERDE', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod124', category: 'LIMPIEZA', descripcion: 'JALADOR', unidad: 'GL', itemsPerUnit: 1.0 }, { id: 'prod125', category: 'LIMPIEZA', descripcion: 'LIMPIAVIDRIOS', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod126', category: 'LIMPIEZA', descripcion: 'MATAMOSCAS', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod127', category: 'LIMPIEZA', descripcion: 'RECOGEDOR', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod128', category: 'LIMPIEZA', descripcion: 'SECADORES', unidad: 'PQT', itemsPerUnit: 1.0 }, { id: 'prod129', category: 'LIMPIEZA', descripcion: 'TOALLA DE MANO', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod130', category: 'LIMPIEZA', descripcion: 'TRAPEADOR', unidad: 'CAJA', itemsPerUnit: 1.0 },
            { id: 'prod131', category: 'DESCARTABLE', descripcion: 'ENVASE AJICEROS X 2400 UNID', unidad: 'CAJA', itemsPerUnit: 1.0 }, { id: 'prod132', category: 'DESCARTABLE', descripcion: 'TAPA AJICEROS X 2400 UNID', unidad: 'PQT', itemsPerUnit: 1.0 }, { id: 'prod133', category: 'DESCARTABLE', descripcion: 'PALITOS DE BROCHETAS', unidad: 'PQT', itemsPerUnit: 1.0 }, { id: 'prod134', category: 'DESCARTABLE', descripcion: 'BOLSAS 12X16', unidad: 'PQT', itemsPerUnit: 1.0 }, { id: 'prod135', category: 'DESCARTABLE', descripcion: 'BOLSAS 16X19', unidad: 'PQT', itemsPerUnit: 1.0 }, { id: 'prod136', category: 'DESCARTABLE', descripcion: 'BOLSAS 19X20', unidad: 'PQT', itemsPerUnit: 1.0 }, { id: 'prod137', category: 'DESCARTABLE', descripcion: 'BOLSAS 20X30', unidad: 'PQT', itemsPerUnit: 1.0 }, { id: 'prod138', category: 'DESCARTABLE', descripcion: 'BOLSAS 220 LT', unidad: 'PQT', itemsPerUnit: 1.0 }, { id: 'prod139', category: 'DESCARTABLE', descripcion: 'BOLSAS 8X12', unidad: 'PQT', itemsPerUnit: 1.0 }, { id: 'prod140', category: 'DESCARTABLE', descripcion: 'BOLSAS 50 LT', unidad: 'PQT', itemsPerUnit: 1.0 }, { id: 'prod141', category: 'DESCARTABLE', descripcion: 'TAPER ENSALADA DE POLLO', unidad: 'PQT', itemsPerUnit: 1.0 }, { id: 'prod142', category: 'DESCARTABLE', descripcion: 'TAPER ENSALADA DE MEDIO', unidad: 'PQT', itemsPerUnit: 1.0 }, { id: 'prod143', category: 'DESCARTABLE', descripcion: 'CUCHARITAS', unidad: 'CAJA', itemsPerUnit: 1.0 }, { id: 'prod144', category: 'DESCARTABLE', descripcion: 'GORROS DESCARTABLES', unidad: 'CAJA', itemsPerUnit: 1.0 }, { id: 'prod145', category: 'DESCARTABLE', descripcion: 'GUANTES QUIRURGICOS', unidad: 'CAJA', itemsPerUnit: 1.0 }, { id: 'prod146', category: 'DESCARTABLE', descripcion: 'LIGAS DE DESPACHO', unidad: 'CAJA', itemsPerUnit: 1.0 }, { id: 'prod147', category: 'DESCARTABLE', descripcion: 'MONDADIENTES', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod148', category: 'DESCARTABLE', descripcion: 'REMOVEDORES', unidad: 'PQT', itemsPerUnit: 1.0 }, { id: 'prod149', category: 'DESCARTABLE', descripcion: 'SERVILLETAS DOBLADAS', unidad: 'PQT', itemsPerUnit: 1.0 }, { id: 'prod150', category: 'DESCARTABLE', descripcion: 'SORBETES X 50 BLANCOS', unidad: 'PQT', itemsPerUnit: 1.0 }, { id: 'prod151', category: 'DESCARTABLE', descripcion: 'SORBETES NEGROS', unidad: 'PQT', itemsPerUnit: 1.0 }, { id: 'prod152', category: 'DESCARTABLE', descripcion: 'VASOS DESCARTABLES', unidad: 'PQT', itemsPerUnit: 1.0 }, { id: 'prod153', category: 'DESCARTABLE', descripcion: 'TENEDORES DESCARTABLES', unidad: 'PQT', itemsPerUnit: 1.0 }, { id: 'prod154', category: 'DESCARTABLE', descripcion: 'PLATOS DESCARTABLES GRANDES', unidad: 'PQT', itemsPerUnit: 1.0 }, { id: 'prod155', category: 'DESCARTABLE', descripcion: 'PLATOS DESCARTABLES CHICOS', unidad: 'PQT', itemsPerUnit: 1.0 }, { id: 'prod156', category: 'DESCARTABLE', descripcion: 'TAPER 500 ML', unidad: 'PQT', itemsPerUnit: 1.0 }, { id: 'prod157', category: 'DESCARTABLE', descripcion: 'POLIGRASA', unidad: 'PQT', itemsPerUnit: 1.0 }, { id: 'prod158', category: 'DESCARTABLE', descripcion: 'ENVASE POLLERO', unidad: 'PQT', itemsPerUnit: 1.0 }, { id: 'prod159', category: 'DESCARTABLE', descripcion: 'CUCHILLO DESCARTABLE', unidad: 'UND', itemsPerUnit: 1.0 },
            { id: 'prod160', category: 'POSTRE', descripcion: 'TRES LECHES', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod161', category: 'POSTRE', descripcion: 'MOUSE DE CHOCOLATE', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod162', category: 'POSTRE', descripcion: 'DERRUMBADO DE LÚCUMA', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod163', category: 'POSTRE', descripcion: 'DERRUMBADO DE FRUTOS ROJOS', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod164', category: 'POSTRE', descripcion: 'CREMA VOLTEADA', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod165', category: 'POSTRE', descripcion: 'TORTA DE CHOCOLATE', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod166', category: 'POSTRE', descripcion: 'POSTRES CUMPLEAÑOS', unidad: 'UND', itemsPerUnit: 1.0 },
            { id: 'prod167', category: 'BEBIDAS NATURALES', descripcion: 'CHICHA MORADA', unidad: 'BAL', itemsPerUnit: 1.0 }, { id: 'prod168', category: 'BEBIDAS NATURALES', descripcion: 'MARACUYÁ', unidad: 'BOL', itemsPerUnit: 1.0 }, { id: 'prod169', category: 'BEBIDAS NATURALES', descripcion: 'DESHIDRATADO DE LIMON', unidad: 'BOL', itemsPerUnit: 1.0 }, { id: 'prod170', category: 'BEBIDAS NATURALES', descripcion: 'DESHIDRATADO DE NARANJA', unidad: 'BOL', itemsPerUnit: 1.0 }, { id: 'prod171', category: 'BEBIDAS NATURALES', descripcion: 'DESHIDRATADO DE PIÑA', unidad: 'BOL', itemsPerUnit: 1.0 }, { id: 'prod172', category: 'BEBIDAS NATURALES', descripcion: 'ARANDANO CONGELADO', unidad: 'BOL', itemsPerUnit: 1.0 }, { id: 'prod173', category: 'BEBIDAS NATURALES', descripcion: 'PIÑA CONGELADA', unidad: 'BOL', itemsPerUnit: 1.0 }, { id: 'prod174', category: 'BEBIDAS NATURALES', descripcion: 'FRESA CONGELADA', unidad: 'BOL', itemsPerUnit: 1.0 },
            { id: 'prod175', category: 'HORNO', descripcion: 'POLLO A LA BRASA', unidad: 'UND', itemsPerUnit: 1.0 }, { id: 'prod176', category: 'HORNO', descripcion: 'PAPA PROCESADA', unidad: 'KG', itemsPerUnit: 1.0 }, { id: 'prod177', category: 'HORNO', descripcion: 'CARBÓN', unidad: 'KG', itemsPerUnit: 1.0 }, { id: 'prod178', category: 'HORNO', descripcion: 'LEÑA', unidad: 'KG', itemsPerUnit: 1.0 }, { id: 'prod179', category: 'HORNO', descripcion: 'LIGAS DE POLLO X 1000', unidad: 'BOL', itemsPerUnit: 1000 },
        ];
        
        const getUniqueAddresses = () => {
            const uniqueAddresses = {};
            let addressIdCounter = 1;
            mockEmpresas.forEach(emp => {
                const key = `${emp.direccion}-${emp.distrito}`;
                if (!uniqueAddresses[key]) {
                    uniqueAddresses[key] = { id: `dir${addressIdCounter++}`, direccionCompleta: emp.direccion, distrito: emp.distrito, provincia: emp.provincia, departamento: emp.departamento };
                }
            });
            return Object.values(uniqueAddresses);
        };
        const mockDirecciones = getUniqueAddresses();

        const formatDate = (dateString) => {
            if (!dateString) return '';
            const localDate = new Date(dateString.replace(/-/g, '/'));
            return localDate.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
        };

        const populateSelect = (selectId, data, valueKey, displayKeys) => {
            const select = document.getElementById(selectId);
            if (!select) return;
            select.innerHTML = '<option value="">Seleccione una opción</option>';
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item[valueKey];
                option.textContent = Array.isArray(displayKeys) ? 
                    (selectId.includes('remitente') || selectId.includes('destinatario') ? `${item.razonSocial} (RUC: ${item.ruc})` : `${item.direccionCompleta}, ${item.distrito}`) :
                    item[displayKeys];
                select.appendChild(option);
            });
        };

        const renderProductAccordion = () => {
            const container = document.getElementById('productosContainer');
            if (!container) return;
            container.innerHTML = '';
            const productsByCategory = mockProductos.reduce((acc, product) => {
                (acc[product.category] = acc[product.category] || []).push(product);
                return acc;
            }, {});
            for (const category in productsByCategory) {
                const categoryDiv = document.createElement('div');
                categoryDiv.innerHTML = `<div class="category-header"><span>${category}</span><span class="icon">+</span></div><div class="product-list"><div class="product-table-header"><div>Producto</div><div>Unidad</div><div>Cantidad</div></div></div>`;
                const productListDiv = categoryDiv.querySelector('.product-list');
                productsByCategory[category].forEach(prod => {
                    const productRow = document.createElement('div');
                    productRow.className = 'product-row';
                    productRow.innerHTML = `<div>${prod.descripcion}</div><div>${prod.unidad}</div><div><input type="number" data-product-id="${prod.id}" min="0" value="0" class="product-quantity"></div>`;
                    productListDiv.appendChild(productRow);
                });
                container.appendChild(categoryDiv);
            }
        };
        
        const addManualProductRow = (isFirst = false) => {
            const container = document.getElementById('manual-rows-container');
            if (!container) return;
            const row = document.createElement('div');
            row.className = 'manual-product-row';
            row.innerHTML = `<input type="text" placeholder="Descripción del producto" class="manual-descripcion"><input type="text" placeholder="Unidad" class="manual-unidad"><input type="number" placeholder="Cantidad" min="0" class="manual-cantidad"><button type="button" class="remove-manual-row-btn" ${isFirst ? 'style="display:none;"' : ''}>-</button>`;
            container.appendChild(row);
        };

        const renderManualProductSection = () => {
            const container = document.getElementById('otrosContainer');
            if (!container) return;
            container.innerHTML = `<div class="category-header"><span>OTROS</span></div><div class="product-list expanded"><div id="manual-rows-container"></div><button type="button" id="add-manual-product-btn">Añadir Producto</button></div>`;
            addManualProductRow(true);
        };
        
        document.getElementById('productosContainer')?.addEventListener('click', (e) => {
            const header = e.target.closest('.category-header');
            if (header) { header.classList.toggle('expanded'); header.nextElementSibling.classList.toggle('expanded'); }
        });

        document.getElementById('otrosContainer')?.addEventListener('click', (e) => {
            if (e.target.id === 'add-manual-product-btn') addManualProductRow();
            if (e.target.classList.contains('remove-manual-row-btn')) e.target.closest('.manual-product-row').remove();
        });
        
        document.getElementById('remitente')?.addEventListener('change', (e) => {
            const company = mockEmpresas.find(emp => emp.id === e.target.value);
            if (company) { const address = mockDirecciones.find(dir => dir.direccionCompleta === company.direccion && dir.distrito === company.distrito); if (address) document.getElementById('direccionPartida').value = address.id; }
        });

        document.getElementById('destinatario')?.addEventListener('change', (e) => {
            const company = mockEmpresas.find(emp => emp.id === e.target.value);
            if (company) { const address = mockDirecciones.find(dir => dir.direccionCompleta === company.direccion && dir.distrito === company.distrito); if (address) document.getElementById('direccionLlegada').value = address.id; }
        });
        
        document.getElementById('guideForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            let productsWithDetails = [];
            document.querySelectorAll('#guia-module .product-quantity').forEach(input => {
                const cantidad = parseInt(input.value, 10);
                if (cantidad > 0) {
                    const productDetail = mockProductos.find(p => p.id === input.dataset.productId);
                    if (productDetail) productsWithDetails.push({ nro: productsWithDetails.length + 1, cantidad, unidad: productDetail.unidad, descripcion: productDetail.descripcion, totalUnidadesIndividuales: cantidad * (productDetail.itemsPerUnit || 1) });
                }
            });
            document.querySelectorAll('#guia-module .manual-product-row').forEach(row => {
                const descripcion = row.querySelector('.manual-descripcion').value.trim();
                const unidad = row.querySelector('.manual-unidad').value.trim();
                const cantidad = parseInt(row.querySelector('.manual-cantidad').value, 10);
                if (descripcion && unidad && cantidad > 0) productsWithDetails.push({ nro: productsWithDetails.length + 1, cantidad, unidad, descripcion, totalUnidadesIndividuales: cantidad });
            });
            if (productsWithDetails.length === 0) { alert('Debe ingresar una cantidad para al menos un producto.'); return; }
            
            const guiaData = {
                remitente: mockEmpresas.find(emp => emp.id === document.getElementById('remitente').value),
                destinatario: mockEmpresas.find(emp => emp.id === document.getElementById('destinatario').value),
                direccionPartida: mockDirecciones.find(dir => dir.id === document.getElementById('direccionPartida').value),
                direccionLlegada: mockDirecciones.find(dir => dir.id === document.getElementById('direccionLlegada').value),
                fechaEmision: document.getElementById('fechaEmision').value,
                fechaTraslado: document.getElementById('fechaTraslado').value,
                motivoTraslado: document.getElementById('motivoTraslado').value,
                modalidadTraslado: document.querySelector('#guia-module input[name="modalidadTraslado"]:checked').value,
                placaVehiculo: document.getElementById('placaVehiculo').value,
                nombreConductor: document.getElementById('nombreConductor').value,
                dniConductor: document.getElementById('dniConductor').value,
                licenciaConducir: document.getElementById('licenciaConducir').value,
                productos: productsWithDetails,
                numeroGuia: `GR-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
            };

            const isVenta = guiaData.motivoTraslado === 'Venta' ? 'X' : '&nbsp;';
            const isTraslado = guiaData.motivoTraslado === 'Traslado' ? 'X' : '&nbsp;';
            const isOtros = guiaData.motivoTraslado === 'Otros' ? 'X' : '&nbsp;';

            const productsHtml = guiaData.productos.map(p => `<tr>
                <td style="padding: 3px 6px; font-size: 0.75rem; border: 1px solid #e2e8f0; text-align: center;">${p.nro}</td>
                <td style="padding: 3px 6px; font-size: 0.75rem; border: 1px solid #e2e8f0; text-align: center;">${p.cantidad}</td>
                <td style="padding: 3px 6px; font-size: 0.75rem; border: 1px solid #e2e8f0; text-align: center;">${p.totalUnidadesIndividuales}</td>
                <td style="padding: 3px 6px; font-size: 0.75rem; border: 1px solid #e2e8f0; text-align: center;">${p.unidad}</td>
                <td style="padding: 3px 6px; font-size: 0.75rem; border: 1px solid #e2e8f0; text-align: left;">${p.descripcion}</td>
            </tr>`).join('');

            document.getElementById('guia-content-preview').innerHTML = `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <header style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <h2 style="font-size: 1.1rem; margin: 0; font-weight: bold;">${guiaData.remitente.razonSocial}</h2>
                            <p style="font-size: 0.8rem; margin: 2px 0;">RUC: ${guiaData.remitente.ruc}</p>
                            <p style="font-size: 0.8rem; margin: 2px 0;">${guiaData.remitente.direccion}</p>
                        </div>
                        <div style="border: 2px solid #000; padding: 5px; text-align: center; min-width: 180px;">
                            <p style="font-size: 1.2rem; margin: 5px 0; font-weight: bold;">GUÍA DE REMISIÓN</p>
                            <p style="font-size: 1rem; margin: 0; color: red; font-weight: bold;">${guiaData.numeroGuia}</p>
                        </div>
                    </header>
                    <section style="margin-top: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 0.8rem;">
                        <div><strong>Punto de Partida:</strong><br>${guiaData.direccionPartida.direccionCompleta}, ${guiaData.direccionPartida.distrito}</div>
                        <div><strong>Punto de Llegada:</strong><br>${guiaData.direccionLlegada.direccionCompleta}, ${guiaData.direccionLlegada.distrito}</div>
                    </section>
                    <section style="margin-top: 10px; font-size: 0.8rem;">
                        <div><strong>Fecha de Emisión:</strong> ${formatDate(guiaData.fechaEmision)} &nbsp;&nbsp;&nbsp; <strong>Fecha de Inicio de Traslado:</strong> ${formatDate(guiaData.fechaTraslado)}</div>
                    </section>
                     <section style="margin-top: 10px; font-size: 0.8rem;">
                        <div><strong>Destinatario:</strong> ${guiaData.destinatario.razonSocial}</div>
                        <div><strong>RUC Destinatario:</strong> ${guiaData.destinatario.ruc}</div>
                    </section>
                    <section style="margin-top: 10px; font-size: 0.8rem;">
                        <strong>Motivo de Traslado:</strong> &nbsp; [${isVenta}] Venta &nbsp; [${isTraslado}] Traslado &nbsp; [${isOtros}] Otros
                    </section>
                    <section style="margin-top: 15px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead><tr style="font-size: 0.8rem; background-color: #f2f2f2; text-align: center;">
                                <th style="border: 1px solid #ccc; padding: 4px;">Nro.</th><th style="border: 1px solid #ccc; padding: 4px;">Cantidad</th><th style="border: 1px solid #ccc; padding: 4px;">Total Unid.</th><th style="border: 1px solid #ccc; padding: 4px;">Unidad</th><th style="border: 1px solid #ccc; padding: 4px; text-align: left;">Descripción</th>
                            </tr></thead>
                            <tbody>${productsHtml}</tbody>
                        </table>
                    </section>
                    <footer style="margin-top: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.8rem; padding-top: 10px; border-top: 1px solid #ccc;">
                        <div>
                            <p><strong>Modalidad:</strong> ${guiaData.modalidadTraslado}</p>
                            <p><strong>Vehículo:</strong> ${guiaData.placaVehiculo}</p>
                            <p><strong>Conductor:</strong> ${guiaData.nombreConductor}</p>
                            <p><strong>DNI:</strong> ${guiaData.dniConductor}</p>
                            <p><strong>Licencia:</strong> ${guiaData.licenciaConducir}</p>
                        </div>
                        <div style="align-self: end; text-align: center;">
                            <p style="margin-top: 40px;">_________________________</p>
                            <p><strong>Recibí Conforme</strong><br>Nombre y DNI</p>
                        </div>
                    </footer>
                </div>`;
            document.getElementById('guiaModal').classList.remove('hidden');
        });

        const clearForm = () => {
            const guideForm = document.getElementById('guideForm');
            if (guideForm) guideForm.reset();
            
            document.querySelectorAll('#guia-module .product-quantity').forEach(input => { input.value = 0; });
            
            const manualRows = document.getElementById('manual-rows-container');
            if(manualRows) {
                manualRows.innerHTML = '';
                addManualProductRow(true);
            }
        };
        document.getElementById('clearFormBtn')?.addEventListener('click', clearForm);
        document.getElementById('closeModalBtn')?.addEventListener('click', () => document.getElementById('guiaModal').classList.add('hidden'));
        document.getElementById('closeModalBtnBottom')?.addEventListener('click', () => document.getElementById('guiaModal').classList.add('hidden'));

        document.getElementById('printGuideBtn')?.addEventListener('click', () => {
            const guideContentForPrint = document.getElementById('guia-content-preview').innerHTML;
            const printWindow = window.open('', '_blank');
            const now = new Date();
            const printDateTime = now.toLocaleDateString('es-PE', {day: '2-digit', month: '2-digit', year: 'numeric'}) + ', ' + now.toLocaleTimeString('es-PE', {hour: '2-digit', minute:'2-digit', hour12: true});
            
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Imprimir Guía de Remisión</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; font-size: 10px; }
                            .print-top-bar { display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: #555; margin-bottom: 20px; }
                            .print-content { border: 1px solid #eee; padding: 15px; }
                            @media print {
                                @page { size: A4; margin: 1cm; }
                                body { -webkit-print-color-adjust: exact; }
                                .print-top-bar { display: none; }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="print-top-bar">
                            <span>${printDateTime}</span>
                            <span>Imprimir Guía de Remisión</span>
                        </div>
                        <div class="print-content">${guideContentForPrint}</div>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => { printWindow.print(); }, 500);
        });
        
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('fechaEmision').value = today;
        document.getElementById('fechaTraslado').value = today;
        populateSelect('remitente', mockEmpresas, 'id', ['razonSocial', 'ruc']);
        populateSelect('destinatario', mockEmpresas, 'id', ['razonSocial', 'ruc']);
        populateSelect('direccionPartida', mockDirecciones, 'id', ['direccionCompleta', 'distrito']);
        populateSelect('direccionLlegada', mockDirecciones, 'id', ['direccionCompleta', 'distrito']);
        renderProductAccordion();
        renderManualProductSection();
    }
});
