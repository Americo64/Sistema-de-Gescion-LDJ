document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA DE NAVEGACIÓN PRINCIPAL ---
    const stockAppContainer = document.getElementById('stock-app-container');
    const guiaAppContainer = document.getElementById('guia-app-container');
    const pedidosAppContainer = document.getElementById('pedidos-app-container');
    
    const switchToStockBtn = document.getElementById('switchToStock');
    const switchToGuiaBtn = document.getElementById('switchToGuia');
    const switchToPedidosBtn = document.getElementById('switchToPedidos');

    const views = {
        stock: { container: stockAppContainer, button: switchToStockBtn },
        guia: { container: guiaAppContainer, button: switchToGuiaBtn },
        pedidos: { container: pedidosAppContainer, button: switchToPedidosBtn }
    };

    // Helper para cambiar vista
    function switchView(view) {
        Object.values(views).forEach(v => {
            // Ocultar todos los contenedores y resetear todos los botones
            v.container.classList.add('hidden');
            // CAMBIO: Usar slate-800 para el botón activo.
            v.button.classList.remove('bg-slate-800', 'text-white', 'hover:bg-slate-700');
            v.button.classList.add('text-gray-700', 'hover:bg-gray-200');
        });

        // Mostrar la vista seleccionada y activar su botón correspondiente
        if (views[view]) {
            const activeView = views[view];
            activeView.container.classList.remove('hidden');
            activeView.button.classList.add('bg-slate-800', 'text-white', 'hover:bg-slate-700');
            activeView.button.classList.remove('text-gray-700', 'hover:bg-gray-200');
        }
    }

    switchToStockBtn.addEventListener('click', () => switchView('stock'));
    switchToGuiaBtn.addEventListener('click', () => switchView('guia'));
    switchToPedidosBtn.addEventListener('click', () => switchView('pedidos'));

    // --- SISTEMA DE NOTIFICACIONES GLOBAL (TOAST) ---
    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const icons = {
            success: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>',
            error: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>',
            info: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>'
        };

        const colors = {
            success: 'bg-green-100 text-green-800 border-green-400',
            error: 'bg-red-100 text-red-800 border-red-400',
            info: 'bg-blue-100 text-blue-800 border-blue-400'
        };

        const toast = document.createElement('div');
        toast.className = `flex items-center w-full p-4 mb-4 rounded-lg shadow-lg border-l-4 transition-all duration-300 transform translate-x-full ${colors[type]}`;
        toast.innerHTML = `
            <div class="inline-flex items-center justify-center flex-shrink-0 w-8 h-8">${icons[type]}</div>
            <div class="ml-3 text-sm font-medium">${message}</div>
        `;

        // Función para remover el toast
        const removeToast = () => {
            toast.classList.add('opacity-0', 'translate-y-[-20px]');
            setTimeout(() => toast.remove(), 300);
        };

        toast.addEventListener('click', removeToast);
        container.appendChild(toast);

        // Animación de entrada
        requestAnimationFrame(() => {
            toast.classList.remove('translate-x-full');
        });

        // Auto-cierre
        setTimeout(removeToast, 4000);
    }

    // --- ESTADO GLOBAL DE LA APP ---
    let branchInventories = JSON.parse(localStorage.getItem('pedidosBranchInventories')) || {};


    // --- GESTIÓN GLOBAL DE SUCURSALES (BRANCHES) ---
    let branches = JSON.parse(localStorage.getItem('appBranches')) || ['Villa 1', 'Villa 2', 'Manchay'];

    function saveBranches() {
        localStorage.setItem('appBranches', JSON.stringify(branches));
        populateBranchSelects();
    }

    function populateBranchSelects() {
        const branchSelectors = [
            document.getElementById('ubicacion'),
            document.getElementById('branch-selector')
        ];

        branchSelectors.forEach(select => {
            if (select) {
                const currentValue = select.value;
                select.innerHTML = '';

                if (select.id === 'ubicacion') {
                    const defaultOption = document.createElement('option');
                    defaultOption.value = "";
                    defaultOption.textContent = "Elija una sucursal...";
                    defaultOption.disabled = true;
                    defaultOption.selected = true;
                    select.appendChild(defaultOption);
                }

                branches.forEach(branch => {
                    select.innerHTML += `<option value="${branch}">${branch}</option>`;
                });
                select.value = branches.includes(currentValue) ? currentValue : (branches.length > 0 ? branches[0] : '');
            }
        });
    }

    function createNewInventoryForBranch(branchName, baseProducts) {
        const customProducts = JSON.parse(localStorage.getItem('customProducts')) || [];
        const allProductsForPedidos = [...baseProducts, ...customProducts];
        const newInventory = allProductsForPedidos.map(product => {
            const { min_stocks, ...restOfProduct } = product;
            const min_stock_for_branch = min_stocks[branchName] || 0;
            return { 
                ...restOfProduct, 
                min_stock: min_stock_for_branch, 
                safety_stock: Math.ceil(min_stock_for_branch * 0.25),
                stock_actual: 0 
            };
        });
        newInventory.sort((a, b) => {
            if (a.category < b.category) return -1;
            if (a.category > b.category) return 1;
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;
            return 0;
        });
        return newInventory;
    }

    function initBranchCRUD(baseProducts) {
        const branchModal = document.getElementById('manage-branch-modal');
        const branchModalTitle = document.getElementById('branch-modal-title');
        const branchForm = document.getElementById('manage-branch-form');
        const branchNameInput = document.getElementById('branch-name-input');
        const originalBranchNameInput = document.getElementById('original-branch-name');

        function openBranchModal(branchToEdit = null) {
            branchForm.reset();
            if (branchToEdit) {
                branchModalTitle.innerHTML = '<i class="fa-solid fa-pencil text-yellow-500"></i> Editar Sucursal';
                branchNameInput.value = branchToEdit;
                originalBranchNameInput.value = branchToEdit;
            } else {
                // CAMBIO: Icono sobrio
                branchModalTitle.innerHTML = '<i class="fa-solid fa-plus-circle text-slate-500"></i> Añadir Sucursal';
                originalBranchNameInput.value = '';
            }
            branchModal.classList.remove('hidden');
            branchNameInput.focus();
        }

        function closeBranchModal() { branchModal.classList.add('hidden'); }

        function saveBranch(e) {
            e.preventDefault();
            const newName = branchNameInput.value.trim();
            const originalName = originalBranchNameInput.value;

            if (!newName) { return showToast('El nombre de la sucursal no puede estar vacío.', 'error'); }
            if (branches.some(b => b.toLowerCase() === newName.toLowerCase() && b.toLowerCase() !== originalName.toLowerCase())) {
                return showToast('Ya existe una sucursal con ese nombre.', 'error');
            }

            if (originalName) { // Editando
                const index = branches.indexOf(originalName);
                if (index > -1) {
                    branches[index] = newName;
                    if (branchInventories[originalName]) {
                        branchInventories[newName] = branchInventories[originalName];
                        delete branchInventories[originalName];
                    }
                    showToast('Sucursal actualizada.', 'success');
                }
            } else { // Añadiendo
                branches.push(newName);
                branchInventories[newName] = createNewInventoryForBranch(newName, baseProducts);
                showToast('Sucursal añadida.', 'success');
            }
            saveBranches();
            localStorage.setItem('pedidosBranchInventories', JSON.stringify(branchInventories));
            closeBranchModal();
            // Forzar recarga de la vista de pedidos si está activa
            if (!pedidosAppContainer.classList.contains('hidden')) {
                document.getElementById('branch-selector').dispatchEvent(new Event('change'));
            }
        }

        document.getElementById('add-branch-btn').addEventListener('click', () => openBranchModal());
        document.getElementById('edit-branch-btn').addEventListener('click', () => openBranchModal(document.getElementById('branch-selector').value));
        document.getElementById('add-branch-btn-stock').addEventListener('click', () => openBranchModal());
        document.getElementById('edit-branch-btn-stock').addEventListener('click', () => openBranchModal(document.getElementById('ubicacion').value));
        document.getElementById('close-branch-modal').addEventListener('click', closeBranchModal);
        document.getElementById('cancel-branch-action').addEventListener('click', closeBranchModal);
        branchForm.addEventListener('submit', saveBranch);
    }
    // --- INICIALIZACIÓN DE APLICACIONES ---
    
    /**
     * APP 1: STOCK DE POLLO
     */
    function initStockApp() {
        // --- ELEMENTOS DEL DOM ---
        const elements = {
            ubicacionInput: document.getElementById('ubicacion'),
            saldoAnteriorInput: document.getElementById('saldo-anterior'),
            ingresoInput: document.getElementById('ingreso'),
            enviadoAnteriorInput: document.getElementById('enviado-anterior'),
            enviadoInput: document.getElementById('enviado'),
            agregarBtn: document.getElementById('agregar-btn'),
            tablaCuerpo: document.getElementById('tabla-cuerpo'),
            totalIngresoTd: document.getElementById('total-ingreso'),
            totalEnviadoTd: document.getElementById('total-enviado'),
            totalFinalTd: document.getElementById('total-final'),
            reporteContainer: document.getElementById('reporte-individual-container'),
            reporteTexto: document.getElementById('reporte-texto'),
            cerrarReporteBtn: document.getElementById('cerrar-reporte-btn'),
            gerenciaReportBtn: document.getElementById('gerencia-report-btn'),
            whatsappShareBtn: document.getElementById('whatsapp-share-btn')
        };

        // --- ESTADO DE LA APLICACIÓN ---
        let sucursales = JSON.parse(localStorage.getItem('stockPolloSucursales')) || [];
        const FORM_DRAFT_KEY = 'stockPolloFormDraft';

        // --- FUNCIONES AUXILIARES ---
        function getFormattedDateTime() {
            const now = new Date();
            const fecha = now.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const hora = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true });
            return { fecha, hora };
        }
        
        function saveSucursales() {
            localStorage.setItem('stockPolloSucursales', JSON.stringify(sucursales));
        }

        // --- LÓGICA DE BORRADOR DE FORMULARIO ---
        function saveFormDraft() {
            const draft = {
                ubicacion: elements.ubicacionInput.value,
                saldoAnterior: elements.saldoAnteriorInput.value,
                ingreso: elements.ingresoInput.value,
                enviadoAnterior: elements.enviadoAnteriorInput.value,
                enviado: elements.enviadoInput.value,
            };
            localStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(draft));
        }

        function loadFormDraft() {
            const draft = JSON.parse(localStorage.getItem(FORM_DRAFT_KEY));
            if (draft) {
                elements.ubicacionInput.value = draft.ubicacion || '';
                elements.saldoAnteriorInput.value = draft.saldoAnterior || '';
                elements.ingresoInput.value = draft.ingreso || '';
                elements.enviadoAnteriorInput.value = draft.enviadoAnterior || '';
                elements.enviadoInput.value = draft.enviado || '';
                showToast('Se recuperó un borrador no guardado.', 'info');
            }
        }

        function clearFormDraft() {
            localStorage.removeItem(FORM_DRAFT_KEY);
        }


        // --- LÓGICA DE RENDERIZADO ---
        function renderizarTabla() {
            elements.tablaCuerpo.innerHTML = '';
            let totalStockInicial = 0, totalGlobalEnviado = 0, totalFinalGlobal = 0;

            sucursales.forEach((sucursal, index) => {
                const fila = document.createElement('tr');
                const stockInicial = sucursal.saldoAnterior + sucursal.ingreso;
                const totalEnviado = sucursal.enviadoAnterior + sucursal.enviado;
                const final = stockInicial - totalEnviado;

                fila.className = 'bg-white border-b hover:bg-gray-50';
                fila.innerHTML = `
                    <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">${sucursal.nombre}</td>
                    <td class="px-6 py-4 text-center font-medium">${stockInicial}</td>
                    <td class="px-6 py-4 text-center font-medium">${totalEnviado}</td>
                    <td class="px-6 py-4 text-center">
                        <button class="report-btn text-slate-600 hover:text-slate-800 font-semibold text-xs py-1 px-3 rounded-lg border border-slate-500 hover:bg-slate-50 transition inline-flex items-center gap-1" data-index="${index}"><i class="fa-solid fa-file-lines"></i> Reporte</button>
                        <button class="delete-btn text-red-600 hover:text-red-800 font-semibold text-xs py-1 px-3 rounded-lg border border-red-500 hover:bg-red-50 transition ml-2 inline-flex items-center gap-1" data-index="${index}"><i class="fa-solid fa-trash-can"></i> Eliminar</button>
                    </td>`;
                elements.tablaCuerpo.appendChild(fila);

                totalStockInicial += stockInicial;
                totalGlobalEnviado += totalEnviado;
                totalFinalGlobal += final;
            });

            elements.totalIngresoTd.textContent = totalStockInicial;
            elements.totalEnviadoTd.textContent = totalGlobalEnviado;
            elements.totalFinalTd.textContent = totalFinalGlobal;
        }

        // --- LÓGICA DE REPORTES ---
        function mostrarReporte(textoFormateado) {
            elements.reporteTexto.textContent = textoFormateado;
            elements.whatsappShareBtn.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoFormateado)}`;
            elements.reporteContainer.classList.remove('hidden');
            elements.reporteContainer.classList.add('flex');
        }

        function mostrarReporteIndividual(index) {
            const sucursal = sucursales[index];
            const stockInicial = sucursal.saldoAnterior + sucursal.ingreso;
            const totalEnviado = sucursal.enviadoAnterior + sucursal.enviado;
            const stockFinal = stockInicial - totalEnviado;
            const { fecha, hora } = getFormattedDateTime();
            const texto = `*STOCK DE POLLO ${sucursal.nombre.toUpperCase()}*\n---------------------------------\n*Fecha:* ${fecha}\n*Hora:* ${hora}\n\n  *Saldo Anterior.........:* ${sucursal.saldoAnterior}\n  *(+) Ingreso del Día....:* ${sucursal.ingreso}\n  *Subtotal...............:* ${stockInicial}\n\n  *(-) Enviado Anterior...:* ${sucursal.enviadoAnterior}\n  *(-) Enviado Hoy........:* ${sucursal.enviado}\n  *Total Enviado..........:* ${totalEnviado}\n---------------------------------\n*(=) STOCK ALMACÉN........:* ${stockFinal} unidades`.trim();
            mostrarReporte(texto);
        }

        function mostrarReporteGerencia() {
            if (sucursales.length === 0) return alert('No hay datos para generar un reporte.');
            const { fecha, hora } = getFormattedDateTime();
            let detalleSucursales = '', totalIngresoDia = 0, totalEnviadoDia = 0, totalFinalGeneral = 0;

            sucursales.forEach(sucursal => {
                const stockInicial = sucursal.saldoAnterior + sucursal.ingreso;
                const stockFinal = stockInicial - (sucursal.enviadoAnterior + sucursal.enviado);
                detalleSucursales += `\n  - *${sucursal.nombre}:*\n    Ingreso: ${sucursal.ingreso}, Enviado Hoy: ${sucursal.enviado}, Stock Final: ${stockFinal}`;
                totalIngresoDia += sucursal.ingreso;
                totalEnviadoDia += sucursal.enviado;
                totalFinalGeneral += stockFinal;
            });

            const texto = `*STOCK DE POLLO - ALMACÉN*\n\n*Fecha:* ${fecha}\n*Hora:* ${hora}\n---------------------------------\nResumen consolidado de stock del día:\n*Detalle por Sucursal:*\n${detalleSucursales.trim()}\n\n---------------------------------\n*TOTALES GENERALES:*\n- *Ingresos del Día...:* ${totalIngresoDia}\n- *Enviados del Día....:* ${totalEnviadoDia}\n---------------------------------\n- *STOCK FINAL ALMACÉN..:* ${totalFinalGeneral}\n`.trim();
            mostrarReporte(texto);
        }

        // --- MANEJO DE EVENTOS ---
        function agregarSucursal() {
            const nombre = elements.ubicacionInput.value;
            const saldoAnterior = parseInt(elements.saldoAnteriorInput.value) || 0;
            const ingreso = parseInt(elements.ingresoInput.value) || 0;
            const enviadoAnterior = parseInt(elements.enviadoAnteriorInput.value) || 0;
            const enviado = parseInt(elements.enviadoInput.value) || 0;

            if (nombre === '') return alert('Por favor, selecciona una sucursal.');

            sucursales.push({ nombre, saldoAnterior, ingreso, enviadoAnterior, enviado });
            saveSucursales();
            renderizarTabla();
            clearFormDraft(); // Limpiar el borrador después de agregar

            // Limpiar formulario y enfocar para la siguiente entrada
            elements.ubicacionInput.value = '';
            elements.saldoAnteriorInput.value = '';
            elements.ingresoInput.value = '';
            elements.enviadoAnteriorInput.value = '';
            elements.enviadoInput.value = '';
            elements.ubicacionInput.focus();
        }

        function manejarClicsTabla(event) {
            const reportButton = event.target.closest('.report-btn');
            const deleteButton = event.target.closest('.delete-btn');

            if (reportButton) {
                const index = parseInt(reportButton.dataset.index, 10);
                mostrarReporteIndividual(index);
            } else if (deleteButton) {
                const index = parseInt(deleteButton.dataset.index, 10);
                if (confirm('¿Estás seguro de que deseas eliminar este registro?')) {
                    sucursales.splice(index, 1);
                    saveSucursales();
                    renderizarTabla();
                }
            }
        }

        function deleteBranchFromStock() {
            const branchToDelete = document.getElementById('ubicacion').value;
            if (!branchToDelete) {
                return showToast('Selecciona una sucursal para eliminar.', 'error');
            }
            if (confirm(`¿Estás seguro de que quieres eliminar la sucursal "${branchToDelete}"? Se perderá todo su inventario y registros de stock.`)) {
                branches = branches.filter(b => b !== branchToDelete);
                delete branchInventories[branchToDelete];
                sucursales = sucursales.filter(s => s.nombre !== branchToDelete); // Eliminar de los registros de stock
                saveBranches();
                saveSucursales();
                localStorage.setItem('pedidosBranchInventories', JSON.stringify(branchInventories));
                showToast('Sucursal eliminada.', 'success');
            }
        }
        // --- INICIALIZACIÓN ---
        elements.agregarBtn.addEventListener('click', agregarSucursal);
        elements.tablaCuerpo.addEventListener('click', manejarClicsTabla);

        // Guardar borrador en cada cambio
        const formInputs = [elements.ubicacionInput, elements.saldoAnteriorInput, elements.ingresoInput, elements.enviadoAnteriorInput, elements.enviadoInput];
        formInputs.forEach(input => input.addEventListener('input', saveFormDraft));


        elements.cerrarReporteBtn.addEventListener('click', () => {
            elements.reporteContainer.classList.add('hidden');
            elements.reporteContainer.classList.remove('flex');
        });
        elements.gerenciaReportBtn.addEventListener('click', mostrarReporteGerencia);
        document.getElementById('delete-branch-btn-stock').addEventListener('click', deleteBranchFromStock);

        renderizarTabla(); // Renderizar la tabla con los datos de localStorage al iniciar
        loadFormDraft(); // Cargar el borrador del formulario al iniciar
    }
    
    /**
     * APP 2: GUÍA DE REMISIÓN
     */
    function initGuiaApp(productos) {
        // --- ESTADO Y DATOS DE LA GUÍA ---
        const defaultCompanies = [{ ruc: '20609607395', razonSocial: 'IJG Inversiones Janampa Guevara S.A.C.', direccion: 'Av. Victor Malasquez Mza. B2 Lote. 09 A.H. Huertos De Manchay', distrito: 'Pachacamac', provincia: 'Lima', departamento: 'Lima' },{ ruc: '20609518562', razonSocial: 'ICM Inversiones Cortez Maldonado S.A.C.', direccion: 'Ch. Pachac. Iv Et. Parc. 3a Manzana Z1 Lote 25', distrito: 'Pachacamac', provincia: 'Lima', departamento: 'Lima' },{ ruc: '20546449573', razonSocial: 'Lo De Juan Chicken Grill S.R.L', direccion: 'Av. Victor Malasquez Mza. B2 Lote. 09 A.H. Huertos De Manchay', distrito: 'Pachacamac', provincia: 'Lima', departamento: 'Lima' },{ ruc: '20610392017', razonSocial: 'Tucfer S.A.C.', direccion: 'Grupo Residencial 27a Mza. I Lote. 21 sec. 3', distrito: 'Villa El Salvador', provincia: 'Lima', departamento: 'Lima' },{ ruc: '20608779532', razonSocial: 'Alero Inversiones S.A.C.', direccion: 'Av. Talara Con Los Alamos Mza. A Lote. 13 Sec. 3 - Grupo 24', distrito: 'Villa El Salvador', provincia: 'Lima', departamento: 'Lima' }];
        let companies = JSON.parse(localStorage.getItem('guiaCompanies')) || defaultCompanies;
        const defaultDrivers = [{ name: 'Emerson De la Cruz Cardenas', dni: '75493844', license: 'Q75493844', plate: 'BVD 734' }];
        let drivers = JSON.parse(localStorage.getItem('guiaDrivers')) || defaultDrivers;
        let allGuiaProductos = [];

        // Carga productos base y personalizados del localStorage
        const loadGuiaProducts = () => {
            const customGuiaProducts = JSON.parse(localStorage.getItem('customGuiaProducts')) || [];
            // Combinamos y eliminamos duplicados por descripción (case-insensitive)
            const combined = [...productos, ...customGuiaProducts];
            const uniqueProducts = Array.from(new Map(combined.map(p => [p.descripcion.toLowerCase(), p])).values());
            allGuiaProductos = uniqueProducts.map((p, index) => ({ ...p, id: `prod${index + 1}` }));
        };

        const saveCompanies = () => {
            localStorage.setItem('guiaCompanies', JSON.stringify(companies));
            populateCompanyAndAddressSelects();
        };

        const saveDrivers = () => {
            localStorage.setItem('guiaDrivers', JSON.stringify(drivers));
            populateDriverSelect();
        };

        const getUniqueAddresses = () => { const uniqueAddresses = {}; let addressIdCounter = 1; companies.forEach(emp => { const addressKey = `${emp.direccion}-${emp.distrito}`; if (!uniqueAddresses[addressKey]) { uniqueAddresses[addressKey] = { id: `dir${addressIdCounter++}`, direccionCompleta: emp.direccion, distrito: emp.distrito, provincia: emp.provincia, departamento: emp.departamento }; } }); return Object.values(uniqueAddresses); };

        // --- FUNCIONES AUXILIARES ---
        const formatDate = (dateString) => { if (!dateString) return 'N/A'; const localDate = new Date(dateString.replace(/-/g, '/')); return localDate.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }); };
        
        const populateCompanyAndAddressSelects = () => {
            const remitenteSelect = document.getElementById('remitente');
            const destinatarioSelect = document.getElementById('destinatario');
            const partidaSelect = document.getElementById('direccionPartida');
            const llegadaSelect = document.getElementById('direccionLlegada');

            [remitenteSelect, destinatarioSelect].forEach(select => {
                if (!select) return;
                select.innerHTML = '<option value="">Seleccione una opción</option>';
                companies.forEach(item => {
                    select.innerHTML += `<option value="${item.ruc}">${item.razonSocial} (RUC: ${item.ruc})</option>`;
                });
            });

            const addresses = getUniqueAddresses();
            [partidaSelect, llegadaSelect].forEach(select => {
                if (!select) return;
                select.innerHTML = '<option value="">Seleccione una opción</option>';
                addresses.forEach(item => {
                    select.innerHTML += `<option value="${item.id}">${item.direccionCompleta}, ${item.distrito}</option>`;
                });
            });
        };

        const populateDriverSelect = () => {
            const driverSelect = document.getElementById('driver-selector');
            if (!driverSelect) return;
            driverSelect.innerHTML = '<option value="">Seleccione un conductor</option>';
            drivers.forEach(driver => {
                driverSelect.innerHTML += `<option value="${driver.dni}">${driver.name} - ${driver.plate}</option>`;
            });
            // Auto-seleccionar el primero si solo hay uno
            if (drivers.length === 1) {
                driverSelect.value = drivers[0].dni;
                driverSelect.dispatchEvent(new Event('change'));
            } else {
                document.getElementById('dniConductor').value = '';
                document.getElementById('licenciaConducir').value = '';
                document.getElementById('placaVehiculo').value = '';
            }
        };

        // --- LÓGICA CRUD PARA EMPRESAS ---
        const companyModal = document.getElementById('manage-company-modal');
        const companyModalTitle = document.getElementById('company-modal-title');
        const companyForm = document.getElementById('manage-company-form');

        const openCompanyModal = (rucToEdit = null) => {
            companyForm.reset();
            const rucInput = document.getElementById('company-ruc');
            if (rucToEdit) {
                const company = companies.find(c => c.ruc === rucToEdit);
                if (!company) return showToast('Empresa no encontrada.', 'error');
                companyModalTitle.innerHTML = '<i class="fa-solid fa-pencil text-yellow-500"></i> Editar Razón Social';
                document.getElementById('original-company-ruc').value = company.ruc;
                rucInput.value = company.ruc;
                rucInput.readOnly = true; // RUC no se puede editar
                document.getElementById('company-razon-social').value = company.razonSocial;
                document.getElementById('company-direccion').value = company.direccion;
                document.getElementById('company-distrito').value = company.distrito;
                document.getElementById('company-provincia').value = company.provincia;
                document.getElementById('company-departamento').value = company.departamento;
            } else {
                // CAMBIO: Icono sobrio
                companyModalTitle.innerHTML = '<i class="fa-solid fa-plus-circle text-slate-500"></i> Añadir Razón Social';
                document.getElementById('original-company-ruc').value = '';
                rucInput.readOnly = false;
            }
            companyModal.classList.remove('hidden');
        };

        const closeCompanyModal = () => companyModal.classList.add('hidden');

        const saveCompany = (e) => {
            e.preventDefault();
            const originalRuc = document.getElementById('original-company-ruc').value;
            const isEditing = !!originalRuc;
            const newCompanyData = {
                ruc: document.getElementById('company-ruc').value.trim(),
                razonSocial: document.getElementById('company-razon-social').value.trim(),
                direccion: document.getElementById('company-direccion').value.trim(),
                distrito: document.getElementById('company-distrito').value.trim(),
                provincia: document.getElementById('company-provincia').value.trim(),
                departamento: document.getElementById('company-departamento').value.trim(),
            };

            if (!newCompanyData.ruc || !newCompanyData.razonSocial) return showToast('RUC y Razón Social son obligatorios.', 'error');

            if (isEditing) {
                companies = companies.map(c => c.ruc === originalRuc ? newCompanyData : c);
            } else {
                if (companies.some(c => c.ruc === newCompanyData.ruc)) return showToast('Ya existe una empresa con ese RUC.', 'error');
                companies.push(newCompanyData);
            }
            saveCompanies();
            showToast(isEditing ? 'Empresa actualizada.' : 'Empresa añadida.', 'success');
            closeCompanyModal();
        };

        const deleteCompany = () => {
            const rucToDelete = document.getElementById('remitente').value;
            if (!rucToDelete) return showToast('Seleccione una empresa para eliminar.', 'error');
            if (confirm(`¿Seguro que quieres eliminar la empresa con RUC ${rucToDelete}?`)) {
                companies = companies.filter(c => c.ruc !== rucToDelete);
                saveCompanies();
                showToast('Empresa eliminada.', 'success');
            }
        };

        // --- LÓGICA CRUD PARA CONDUCTORES ---
        const driverModal = document.getElementById('manage-driver-modal');
        const driverModalTitle = document.getElementById('driver-modal-title');
        const driverForm = document.getElementById('manage-driver-form');

        const openDriverModal = (dniToEdit = null) => {
            driverForm.reset();
            const dniInput = document.getElementById('driver-dni');
            if (dniToEdit) {
                const driver = drivers.find(d => d.dni === dniToEdit);
                if (!driver) return showToast('Conductor no encontrado.', 'error');
                driverModalTitle.textContent = 'Editar Conductor';
                document.getElementById('original-driver-dni').value = driver.dni;
                dniInput.value = driver.dni;
                dniInput.readOnly = true; // DNI no se puede editar
                document.getElementById('driver-name').value = driver.name;
                document.getElementById('driver-license').value = driver.license;
                document.getElementById('driver-plate').value = driver.plate;
            } else {
                driverModalTitle.textContent = 'Añadir Conductor';
                document.getElementById('original-driver-dni').value = '';
                dniInput.readOnly = false;
            }
            driverModal.classList.remove('hidden');
        };

        const closeDriverModal = () => driverModal.classList.add('hidden');

        const saveDriver = (e) => {
            e.preventDefault();
            const originalDni = document.getElementById('original-driver-dni').value;
            const isEditing = !!originalDni;
            const newDriverData = {
                name: document.getElementById('driver-name').value.trim(),
                dni: document.getElementById('driver-dni').value.trim(),
                license: document.getElementById('driver-license').value.trim(),
                plate: document.getElementById('driver-plate').value.trim(),
            };
            if (!newDriverData.name || !newDriverData.dni) return showToast('Nombre y DNI son obligatorios.', 'error');
            if (isEditing) {
                drivers = drivers.map(d => d.dni === originalDni ? newDriverData : d);
            } else {
                if (drivers.some(d => d.dni === newDriverData.dni)) return showToast('Ya existe un conductor con ese DNI.', 'error');
                drivers.push(newDriverData);
            }
            saveDrivers();
            showToast(isEditing ? 'Conductor actualizado.' : 'Conductor añadido.', 'success');
            closeDriverModal();
        };

        const deleteDriver = () => {
            const dniToDelete = document.getElementById('driver-selector').value;
            if (!dniToDelete) return showToast('Seleccione un conductor para eliminar.', 'error');
            if (confirm(`¿Seguro que quieres eliminar al conductor con DNI ${dniToDelete}?`)) {
                drivers = drivers.filter(d => d.dni !== dniToDelete);
                saveDrivers();
                showToast('Conductor eliminado.', 'success');
            }
        };
        
        // --- LÓGICA DE GESTIÓN DE PRODUCTOS ---
        const manageModal = document.getElementById('manage-guia-products-modal');
        const listView = document.getElementById('guia-product-list-view');
        const formView = document.getElementById('guia-product-form-view');
        const productForm = document.getElementById('guia-product-form');
        const formTitle = document.getElementById('guia-form-title');
        const productListBody = document.getElementById('guia-products-list');

        // Renderiza la lista de productos en el modal de gestión
        const renderManageList = () => {
            productListBody.innerHTML = '';
            allGuiaProductos.sort((a, b) => a.descripcion.localeCompare(b.descripcion)).forEach(p => {
                const isCustom = !productos.some(base => base.descripcion === p.descripcion);
                const row = document.createElement('tr');
                row.className = 'border-b hover:bg-gray-50';
                row.innerHTML = `
                    <td class="px-4 py-2 font-medium">${p.descripcion}</td>
                    <td class="px-4 py-2">${p.category}</td>
                    <td class="px-4 py-2">${p.unidad}</td>
                    <td class="px-4 py-2">
                        ${isCustom ? `
                        <button class="edit-guia-product-btn text-slate-600 hover:underline text-xs inline-flex items-center gap-1" data-desc="${p.descripcion}"><i class="fa-solid fa-pencil"></i> Editar</button>
                        <button class="delete-guia-product-btn text-red-600 hover:underline text-xs ml-2 inline-flex items-center gap-1" data-desc="${p.descripcion}"><i class="fa-solid fa-trash-can"></i> Eliminar</button>
                        ` : '<span class="text-xs text-gray-400 italic">Producto base</span>'}
                    </td>
                `;
                productListBody.appendChild(row);
            });
        };

        // Guarda los productos personalizados y refresca las vistas
        const saveCustomGuiaProducts = (customProducts) => {
            localStorage.setItem('customGuiaProducts', JSON.stringify(customProducts));
            loadGuiaProducts();
            renderProductAccordion(allGuiaProductos);
            renderManageList();
        };

        // Muestra el formulario para añadir o editar un producto
        const showGuiaProductForm = (productToEdit = null) => {
            productForm.reset();
            if (productToEdit) {
                formTitle.innerHTML = '<i class="fa-solid fa-pencil-alt text-yellow-500"></i> Editar Producto';
                document.getElementById('guia-product-original-desc').value = productToEdit.descripcion;
                document.getElementById('guia-product-desc').value = productToEdit.descripcion;
                document.getElementById('guia-product-cat').value = productToEdit.category;
                document.getElementById('guia-product-unit').value = productToEdit.unidad;
            } else {
                // CAMBIO: Icono sobrio
                formTitle.innerHTML = '<i class="fa-solid fa-plus-circle text-slate-500"></i> Añadir Producto';
                document.getElementById('guia-product-original-desc').value = '';
            }
            listView.classList.add('hidden');
            formView.classList.remove('hidden');
        };

        // Oculta el formulario y muestra la lista
        const hideGuiaProductForm = () => {
            formView.classList.add('hidden');
            listView.classList.remove('hidden');
        };

        // Maneja los clics en la lista de productos (editar/eliminar)
        const handleManageProducts = (e) => {
            const deleteBtn = e.target.closest('.delete-guia-product-btn');
            const editBtn = e.target.closest('.edit-guia-product-btn');
            
            let customProducts = JSON.parse(localStorage.getItem('customGuiaProducts')) || [];

            if (deleteBtn) {
                e.preventDefault();
                const desc = deleteBtn.dataset.desc;
                if (confirm(`¿Seguro que quieres eliminar "${desc}"?`)) {
                    customProducts = customProducts.filter(p => p.descripcion !== desc);
                    saveCustomGuiaProducts(customProducts);
                    showToast('Producto eliminado con éxito.', 'success');
                }
            } else if (editBtn) {
                e.preventDefault();
                const desc = editBtn.dataset.desc;
                const productToEdit = customProducts.find(p => p.descripcion === desc);
                if (productToEdit) {
                    showGuiaProductForm(productToEdit);
                }
            }
        };

        // Guarda el producto desde el formulario
        const saveGuiaProductFromForm = (e) => {
            e.preventDefault();
            const originalDesc = document.getElementById('guia-product-original-desc').value;
            const isEditing = !!originalDesc;
            const newProductData = {
                descripcion: document.getElementById('guia-product-desc').value,
                category: document.getElementById('guia-product-cat').value.toUpperCase(),
                unidad: document.getElementById('guia-product-unit').value.toUpperCase(),
                itemsPerUnit: 1 // Valor por defecto
            };
            let customProducts = JSON.parse(localStorage.getItem('customGuiaProducts')) || [];
            if (isEditing) {
                customProducts = customProducts.map(p => p.descripcion === originalDesc ? newProductData : p);
            } else {
                customProducts.push(newProductData);
            }
            saveCustomGuiaProducts(customProducts);
            showToast(isEditing ? 'Producto actualizado.' : 'Producto añadido.', 'success');
            hideGuiaProductForm();
        };

        // --- RENDERIZADO DE LA APP ---
        const renderProductAccordion = (productsToRender) => { const container = document.getElementById('productosContainer'); container.innerHTML = ''; const productsByCategory = productsToRender.reduce((acc, product) => { const category = product.category || 'Sin Categoría'; if (!acc[category]) acc[category] = []; acc[category].push(product); return acc; }, {}); const categoryOrder = [ 'VERDURAS', 'ABARROTES', 'CARNES', 'BEBIDAS', 'LICORES', 'CREMAS', 'LIMPIEZA', 'DESCARTABLE', 'POSTRE', 'BEBIDAS NATURALES', 'HORNO' ]; const orderedCategories = Object.keys(productsByCategory).sort((a, b) => { const indexA = categoryOrder.indexOf(a); const indexB = categoryOrder.indexOf(b); if (indexA !== -1 && indexB !== -1) { return indexA - indexB; } if (indexA !== -1) return -1; if (indexB !== -1) return 1; return a.localeCompare(b); }); orderedCategories.forEach(category => { const categoryDiv = document.createElement('div'); categoryDiv.innerHTML = ` <div class="category-header"> <span>${category}</span> <span class="icon">+</span> </div> <div class="product-list"> <div class="product-table-header"> <div>Producto</div> <div>Unidad</div> <div>Cantidad</div> </div> </div> `; const productListDiv = categoryDiv.querySelector('.product-list'); let sortedProducts; if (category === 'CARNES') { const customOrder = ['FILETE', 'MOLLEJA', 'LOMO', 'CHULETA', 'RACHI', 'ANTICUCHO', 'BIFE', 'CHURRASCO', 'CHORIZO', 'COSTILLA', 'MORCILLA']; sortedProducts = productsByCategory[category].sort((a, b) => { const descA = a.descripcion.split(' ')[0].toUpperCase(); const descB = b.descripcion.split(' ')[0].toUpperCase(); const indexA = customOrder.indexOf(descA); const indexB = customOrder.indexOf(descB); if (indexA !== -1 && indexB !== -1) return indexA - indexB; if (indexA !== -1) return -1; if (indexB !== -1) return 1; return a.descripcion.localeCompare(b.descripcion); }); } else if (category === 'CREMAS') { const customOrder = ['MAYONESA', 'AJÍ', 'VINAGRETA', 'TEQUEÑOS', 'ALITAS', 'CHAUFA', 'ACEVICHADO', 'BBQ LJD', 'LIMO', 'CHIMICHURRI', 'ANTICUCHERA', 'SAL PARRILLERA', 'ALIÑO DE PARRILLA', 'ORÉGANO']; sortedProducts = productsByCategory[category].sort((a, b) => { const getOrderIndex = (desc) => { const upperDesc = desc.toUpperCase(); for (let i = 0; i < customOrder.length; i++) { if (upperDesc.includes(customOrder[i])) { return i; } } return -1; }; const indexA = getOrderIndex(a.descripcion); const indexB = getOrderIndex(b.descripcion); if (indexA !== -1 && indexB !== -1) return indexA - indexB; if (indexA !== -1) return -1; if (indexB !== -1) return 1; return a.descripcion.localeCompare(b.descripcion); }); } else { sortedProducts = productsByCategory[category].sort((a, b) => a.descripcion.localeCompare(b.descripcion)); } sortedProducts.forEach(prod => { const productRow = document.createElement('div'); productRow.className = 'product-row'; productRow.innerHTML = ` <div title="${prod.descripcion}">${prod.descripcion}</div> <div>${prod.unidad}</div> <div><input type="number" data-product-id="${prod.id}" min="0" step="any" value="0" class="product-quantity"></div> `; productListDiv.appendChild(productRow); }); container.appendChild(categoryDiv); }); };
        const renderManualProductSection = () => { const container = document.getElementById('otrosContainer'); container.innerHTML = ` <div class="category-header"><span><i class="fa-solid fa-pencil-alt mr-2"></i> OTROS (Ingreso Manual)</span></div> <div class="product-list expanded"> <div id="manual-rows-container"></div> <button type="button" id="add-manual-product-btn" class="flex items-center justify-center gap-2"><i class="fa-solid fa-plus"></i> Añadir Fila</button> </div> `; addManualProductRow(true); };
        const addManualProductRow = (isFirst = false) => { const container = document.getElementById('manual-rows-container'); const row = document.createElement('div'); row.className = 'manual-product-row'; row.innerHTML = ` <input type="text" placeholder="Descripción del producto" class="manual-descripcion"> <input type="text" placeholder="Unidad (ej. KG, UND)" class="manual-unidad"> <input type="number" placeholder="Cantidad" min="0" step="any" class="manual-cantidad"> <button type="button" class="remove-manual-row-btn" ${isFirst ? 'style="display:none;"' : ''}>-</button> `; container.appendChild(row); };
        const clearForm = () => { document.getElementById('guideForm').reset(); document.querySelectorAll('.product-quantity').forEach(input => { input.value = 0; }); document.getElementById('manual-rows-container').innerHTML = ''; addManualProductRow(true); document.querySelectorAll('.category-header.expanded').forEach(header => { header.classList.remove('expanded'); header.nextElementSibling.classList.remove('expanded'); }); renderProductAccordion(allGuiaProductos); document.getElementById('guideForm').scrollIntoView({ behavior: 'smooth' }); };
        
        // --- MANEJO DE EVENTOS ---
        document.getElementById('productosContainer').addEventListener('click', (e) => { const header = e.target.closest('.category-header'); if (header) { header.classList.toggle('expanded'); header.nextElementSibling.classList.toggle('expanded'); const icon = header.querySelector('.icon svg'); if (icon) { icon.classList.toggle('rotate-180'); } } });
        document.getElementById('otrosContainer').addEventListener('click', (e) => { if (e.target.id === 'add-manual-product-btn') addManualProductRow(); if (e.target.classList.contains('remove-manual-row-btn')) e.target.closest('.manual-product-row').remove(); });
        document.getElementById('remitente').addEventListener('change', (e) => { const company = companies.find(emp => emp.ruc === e.target.value); if (company) { const addresses = getUniqueAddresses(); const address = addresses.find(dir => dir.direccionCompleta === company.direccion && dir.distrito === company.distrito); if (address) document.getElementById('direccionPartida').value = address.id; } });
        document.getElementById('destinatario').addEventListener('change', (e) => { const company = companies.find(emp => emp.ruc === e.target.value); if (company) { const addresses = getUniqueAddresses(); const address = addresses.find(dir => dir.direccionCompleta === company.direccion && dir.distrito === company.distrito); if (address) document.getElementById('direccionLlegada').value = address.id; } });
        document.getElementById('driver-selector').addEventListener('change', (e) => {
            const selectedDriver = drivers.find(d => d.dni === e.target.value);
            if (selectedDriver) {
                document.getElementById('dniConductor').value = selectedDriver.dni;
                document.getElementById('licenciaConducir').value = selectedDriver.license;
                document.getElementById('placaVehiculo').value = selectedDriver.plate;
            }
        });
        document.getElementById('guideForm').addEventListener('submit', (e) => { e.preventDefault(); let productsWithDetails = []; document.querySelectorAll('.product-quantity').forEach(input => { const cantidad = parseFloat(input.value); if (cantidad > 0) { const productDetail = allGuiaProductos.find(p => p.id === input.dataset.productId); if (productDetail) { productsWithDetails.push({ nro: productsWithDetails.length + 1, cantidad, unidad: productDetail.unidad, descripcion: productDetail.descripcion, totalUnidadesIndividuales: cantidad * (productDetail.itemsPerUnit || 1), }); } } }); document.querySelectorAll('.manual-product-row').forEach(row => { const descripcion = row.querySelector('.manual-descripcion').value.trim(); const unidad = row.querySelector('.manual-unidad').value.trim(); const cantidad = parseFloat(row.querySelector('.manual-cantidad').value); if (descripcion && unidad && cantidad > 0) { productsWithDetails.push({ nro: productsWithDetails.length + 1, cantidad, unidad, descripcion, totalUnidadesIndividuales: cantidad, }); } }); if (productsWithDetails.length === 0) { showToast('Debe ingresar una cantidad para al menos un producto.', 'error'); return; } const addresses = getUniqueAddresses(); const selectedDriver = drivers.find(d => d.dni === document.getElementById('driver-selector').value); const guiaGenerada = { remitente: companies.find(emp => emp.ruc === document.getElementById('remitente').value), destinatario: companies.find(emp => emp.ruc === document.getElementById('destinatario').value), direccionPartida: addresses.find(dir => dir.id === document.getElementById('direccionPartida').value), direccionLlegada: addresses.find(dir => dir.id === document.getElementById('direccionLlegada').value), fechaEmision: document.getElementById('fechaEmision').value, fechaTraslado: document.getElementById('fechaTraslado').value, motivoTraslado: document.getElementById('motivoTraslado').value, modalidadTraslado: document.querySelector('input[name="modalidadTraslado"]:checked').value, placaVehiculo: selectedDriver.plate, nombreConductor: selectedDriver.name, dniConductor: selectedDriver.dni, licenciaConducir: selectedDriver.license, productos: productsWithDetails, numeroGuia: `GR-${Date.now().toString().slice(-6)}`, }; const isVentaChecked = guiaGenerada.motivoTraslado === 'Venta' ? 'X' : ' '; const isTrasladoChecked = guiaGenerada.motivoTraslado === 'Traslado' ? 'X' : ' '; const isOtrosChecked = guiaGenerada.motivoTraslado === 'Otros' ? 'X' : ' '; document.getElementById('guia-content').innerHTML = ` <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.2rem; padding-bottom: 0.2rem; border-bottom: 1px solid #e2e8f0;"> <div style="flex-grow: 1; font-size: 0.8rem;"> <h2 style="font-size: 1rem; font-weight: bold; color: #1f2937; margin-bottom: 0;">${guiaGenerada.remitente.razonSocial}</h2> <p style="color: #4b5563; margin-bottom: 0;">RUC: ${guiaGenerada.remitente.ruc}</p> <p style="color: #4b5563; margin-bottom: 0;">${guiaGenerada.remitente.direccion}</p> </div> <div style="text-align: right; font-size: 0.8rem;"> <p style="font-size: 1.1rem; font-weight: bolder; color: #dc2626; margin-bottom: 0.1rem;">GUIA DE REMISION</p> <p style="font-size: 0.9rem; font-weight: bold; color: #1f2937; margin-bottom: 0.1rem;">Nro. ${guiaGenerada.numeroGuia}</p> <p style="color: #374151; margin-bottom: 0;">Fecha de emisión: ${formatDate(guiaGenerada.fechaEmision)}</p> <p style="color: #374151; margin-bottom: 0;">Fecha de inicio de Traslado: ${formatDate(guiaGenerada.fechaTraslado)}</p> </div> </div> <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.1rem; margin-bottom: 0.2rem; padding-bottom: 0.2rem; border-bottom: 1px solid #e2e8f0; font-size: 0.8rem;"> <div><p style="font-weight: bold;">Punto de Partida:</p><p>${guiaGenerada.direccionPartida.direccionCompleta}</p><p>${guiaGenerada.direccionPartida.distrito}</p></div> <div><p style="font-weight: bold;">Punto de llegada:</p><p>${guiaGenerada.direccionLlegada.direccionCompleta}</p><p>${guiaGenerada.direccionLlegada.distrito}</p></div> </div> <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.1rem; margin-bottom: 0.2rem; padding-bottom: 0.2rem; border-bottom: 1px solid #e2e8f0; font-size: 0.8rem;"> <div><p style="font-weight: bold;">Motivo de Traslado:</p><p>[${isVentaChecked}] Venta &nbsp; [${isTrasladoChecked}] Traslado &nbsp; [${isOtrosChecked}] Otros</p></div> <div><p style="font-weight: bold;">Datos del Destinatario:</p><p>RUC: ${guiaGenerada.destinatario.ruc}</p><p>Razón Social: ${guiaGenerada.destinatario.razonSocial}</p></div> </div> <h3 style="font-size: 0.9rem; font-weight: bold; margin-bottom: 0.2rem;">Detalle de Productos:</h3> <div style="overflow-x: auto; margin-bottom: 0.2rem;"> <table style="width: 100%; border-collapse: collapse;"> <thead><tr style="text-align: left; font-size: 0.65rem; font-weight: bold; text-transform: uppercase; background-color: #f8f8f8;"> <th style="padding: 3px 6px; border: 1px solid #e2e8f0;">Nro.</th><th style="padding: 3px 6px; border: 1px solid #e2e8f0;">Cantidad</th> <th style="padding: 3px 6px; border: 1px solid #e2e8f0;">Unidades</th><th style="padding: 3px 6px; border: 1px solid #e2e8f0;">Medida</th> <th style="padding: 3px 6px; border: 1px solid #e2e8f0;">Descripción</th> </tr></thead> <tbody>${guiaGenerada.productos.map(p => `<tr> <td style="padding: 3px 6px; font-size: 0.75rem; border: 1px solid #e2e8f0;">${p.nro}</td> <td style="padding: 3px 6px; font-size: 0.75rem; border: 1px solid #e2e8f0;">${p.cantidad}</td> <td style="padding: 3px 6px; font-size: 0.75rem; border: 1px solid #e2e8f0;">${p.totalUnidadesIndividuales.toFixed(2)}</td> <td style="padding: 3px 6px; font-size: 0.75rem; border: 1px solid #e2e8f0;">${p.unidad}</td> <td style="padding: 3px 6px; font-size: 0.75rem; border: 1px solid #e2e8f0;">${p.descripcion}</td> </tr>`).join('')}</tbody> </table> </div> <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.1rem; margin-top: 1.5rem; font-size: 0.8rem;"> <div> <p><span style="font-weight: bold;">Modalidad:</span> ${guiaGenerada.modalidadTraslado}</p> <p><span style="font-weight: bold;">Vehículo:</span> Placa: ${guiaGenerada.placaVehiculo}</p> <p><span style="font-weight: bold;">Conductor:</span> ${guiaGenerada.nombreConductor}</p> <p><span style="font-weight: bold;">DNI:</span> ${guiaGenerada.dniConductor}</p> <p><span style="font-weight: bold;">Licencia:</span> ${guiaGenerada.licenciaConducir}</p> </div> <div style="text-align: left; margin-top: 0.5rem;"> <p><span style="font-weight: bold;">Conformidad cliente:</span></p> <p><span style="font-weight: bold;">Nombre:</span> __________________</p> <p><span style="font-weight: bold;">DNI:</span> ______________________</p> </div> </div>`; document.getElementById('guiaModal').classList.remove('hidden'); });
        document.getElementById('closeModalBtn').addEventListener('click', () => document.getElementById('guiaModal').classList.add('hidden'));
        document.getElementById('closeModalBtnBottom').addEventListener('click', () => document.getElementById('guiaModal').classList.add('hidden'));
        document.getElementById('guiaModal').addEventListener('click', (e) => { if (e.target.id === 'guiaModal') e.target.classList.add('hidden'); });
        document.getElementById('printGuideBtn').addEventListener('click', () => { const guideContent = document.getElementById('guia-content').innerHTML; const printWindow = window.open('', '_blank'); printWindow.document.write(`<html><head><title>Imprimir Guía</title><style>body{font-family: 'Inter', sans-serif; margin: 20px;} table{width: 100%; border-collapse: collapse;} th, td{border: 1px solid #ccc; padding: 5px; text-align: left;}</style></head><body>${guideContent}</body></html>`); printWindow.document.close(); printWindow.focus(); printWindow.print(); });
        document.getElementById('clearFormBtn').addEventListener('click', clearForm);
        document.getElementById('manage-guia-products-btn').addEventListener('click', () => { hideGuiaProductForm(); renderManageList(); manageModal.classList.remove('hidden'); });
        document.getElementById('close-manage-guia-products-modal').addEventListener('click', () => manageModal.classList.add('hidden'));
        document.getElementById('show-add-guia-product-form-btn').addEventListener('click', () => showGuiaProductForm());
        document.getElementById('cancel-guia-product-form-btn').addEventListener('click', hideGuiaProductForm);
        productListBody.addEventListener('click', handleManageProducts);
        productForm.addEventListener('submit', saveGuiaProductFromForm);
        // Listeners para CRUD de empresas
        document.getElementById('add-company-btn').addEventListener('click', () => openCompanyModal());
        document.getElementById('edit-company-btn').addEventListener('click', () => openCompanyModal(document.getElementById('remitente').value));
        document.getElementById('delete-company-btn').addEventListener('click', deleteCompany);
        document.getElementById('close-company-modal').addEventListener('click', closeCompanyModal);
        document.getElementById('cancel-company-action').addEventListener('click', closeCompanyModal);
        companyForm.addEventListener('submit', saveCompany);
        // Listeners para CRUD de conductores
        document.getElementById('add-driver-btn').addEventListener('click', () => openDriverModal());
        document.getElementById('edit-driver-btn').addEventListener('click', () => openDriverModal(document.getElementById('driver-selector').value));
        document.getElementById('delete-driver-btn').addEventListener('click', deleteDriver);
        document.getElementById('close-driver-modal').addEventListener('click', closeDriverModal);
        document.getElementById('cancel-driver-action').addEventListener('click', closeDriverModal);
        driverForm.addEventListener('submit', saveDriver);

        // --- INICIALIZACIÓN ---
        const initializeApp = () => { 
            if (localStorage.getItem('guiaCompanies') === null) { localStorage.setItem('guiaCompanies', JSON.stringify(defaultCompanies)); companies = defaultCompanies; } 
            if (localStorage.getItem('guiaDrivers') === null) { localStorage.setItem('guiaDrivers', JSON.stringify(defaultDrivers)); drivers = defaultDrivers; }
            loadGuiaProducts(); const today = new Date().toISOString().split('T')[0]; document.getElementById('fechaEmision').value = today; document.getElementById('fechaTraslado').value = today; populateCompanyAndAddressSelects(); populateDriverSelect(); renderProductAccordion(allGuiaProductos); renderManualProductSection(); 
        };
        initializeApp();
    }

    /**
     * APP 3: PEDIDOS ALMACÉN
     */
    function initPedidosApp(baseProducts) {
        // --- VARIABLES DE ESTADO ---
        let allProductsForPedidos = [];

        // --- ESTADO LOCAL DEL INVENTARIO ---
        let currentBranch = 'Villa 1';
        let currentSearchTerm = '';
        let currentCategoryFilter = '';

        function createNewInventory(branchName) {
            return createNewInventoryForBranch(branchName, baseProducts);
        }

        /**
         * Nueva función para obtener la fecha seleccionada por el usuario.
         */
        function getOrderDate() {
            const dateInput = document.getElementById('order-date-input');
            // Retorna el valor del input, o la fecha de hoy en formato ISO si no existe.
            return dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
        }

        function loadBranchData() { 
            // Asegurarse de que la lista de productos esté cargada
            if (allProductsForPedidos.length === 0) {
                const customProducts = JSON.parse(localStorage.getItem('customProducts')) || [];
                allProductsForPedidos = [...baseProducts, ...customProducts];
            }
            // Asegurarse de que el inventario para la sucursal exista
            if (!branchInventories[currentBranch]) {
                branchInventories[currentBranch] = createNewInventory(currentBranch);
            }
            let currentInventory = branchInventories[currentBranch];
            if (currentInventory) {
                const filteredInventory = currentInventory.filter(product =>
                    product.name.toLowerCase().includes(currentSearchTerm.toLowerCase()) &&
                    (currentCategoryFilter === '' || product.category === currentCategoryFilter)
                );
                renderInventory(filteredInventory);
            } else {
                renderInventory([]);
            }
        }

        function saveInventories() {
            localStorage.setItem('pedidosBranchInventories', JSON.stringify(branchInventories));
        }

        function updateStockViaAPI(productId, newStock) {
            const currentInventory = branchInventories[currentBranch];
            const index = currentInventory.findIndex(p => p.id === productId);

            if (index !== -1) {
                currentInventory[index].stock_actual = newStock;
                currentInventory[index].last_updated = new Date().toISOString();
                saveInventories();
                loadBranchData();
                // No mostramos mensaje en cada cambio para no saturar
            } else {
                showToast('Error: Producto no encontrado.', 'error');
            }
        }

        function renderInventory(data) {
            const inventoryContainer = document.getElementById('inventory-container');
            inventoryContainer.innerHTML = '';
            let currentCategory = '';
            let totalPedido = 0;

            if (data.length === 0) {
                inventoryContainer.innerHTML = `<div class="text-center p-10 italic text-gray-500">No se encontraron productos que coincidan con la búsqueda.</div>`;
                return;
            }

            data.forEach(product => {
                if (product.category !== currentCategory) {
                    currentCategory = product.category;
                    const categoryHeader = document.createElement('div');
                    // CAMBIO: Color del encabezado de categoría a Gris Pizarra Oscuro
                    categoryHeader.innerHTML = `
                        <h3 class="pt-6 pb-2 text-xl font-bold text-slate-700 uppercase">
                            ${currentCategory}
                        </h3>`;
                    inventoryContainer.appendChild(categoryHeader);
                }

                const stock = product.stock_actual || 0;
                const pedido = Math.max(0, product.min_stock - stock);
                totalPedido += pedido;
                const needsOrder = pedido > 0;
        
                const productCard = document.createElement('div');
                productCard.className = `p-3 border rounded-lg grid grid-cols-12 gap-x-2 items-center transition-colors duration-200 ${needsOrder ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'} hover:bg-gray-50`;
        
                productCard.innerHTML = `
                    <div class="col-span-12 sm:col-span-6 truncate">
                        <p class="font-semibold text-gray-800 truncate" title="${product.name}">${product.name}</p>
                        <p class="text-xs text-gray-500">U.Med: ${product.u_med} | Mín: ${product.min_stock}</p>
                    </div>
        
                    <div class="col-span-4 sm:col-span-2 text-center"><p class="text-xs text-gray-500 mb-1">Stock de Seguridad</p><p class="text-base font-bold text-gray-600">${product.safety_stock || 0}</p></div>
                    <div class="col-span-4 sm:col-span-2 text-center"><p class="text-xs text-gray-500 mb-1">Stock Actual</p><input type="number" min="0" id="stock-${product.id}" value="${stock}" data-id="${product.id}" class="stock-input w-full text-center p-1.5 border rounded-md text-base font-semibold focus:ring-slate-500 focus:border-slate-500 transition duration-150" /></div>
                    <div class="col-span-4 sm:col-span-2 text-center"><p class="text-xs text-gray-500 mb-1">Pedido</p><p class="text-xl font-extrabold ${needsOrder ? 'text-orange-500 animate-pulse' : 'text-green-600'}">${pedido}</p></div>
                `;
                inventoryContainer.appendChild(productCard);
            });

            document.getElementById('total-pedido').textContent = totalPedido;
            renderOrderSummary(data);
        }

        function handleStockChange(inputElement) {
            const productId = inputElement.getAttribute('data-id');
            const newStock = parseInt(inputElement.value) || 0;
            if (newStock < 0) {
                inputElement.value = 0; // Corregir el valor en la UI
                showToast('El stock no puede ser negativo.', 'error');
                return;
            }
            updateStockViaAPI(productId, newStock);
        }

        function renderOrderSummary(data) {
            const summaryContainer = document.getElementById('order-summary-content');
            const productsToOrder = data.filter(p => Math.max(0, p.min_stock - (p.stock_actual || 0)) > 0);

            if (productsToOrder.length === 0) {
                summaryContainer.innerHTML = '<p class="text-gray-500 text-center italic">¡Inventario completo! No se requiere pedido.</p>';
                return;
            }

            let summaryHTML = '';
            let currentCategory = '';
            productsToOrder.forEach(p => {
                if (p.category !== currentCategory) {
                    currentCategory = p.category;
                    // CAMBIO: Color del título de categoría a Gris Pizarra Oscuro
                    summaryHTML += `<p class="font-bold text-md mt-4 text-slate-700">${currentCategory}:</p>`;
                }
                const pedido = Math.max(0, p.min_stock - (p.stock_actual || 0));
                summaryHTML += `<p class="text-sm ml-2">${p.name} (${p.u_med}): ${pedido}</p>`;
            });
            summaryContainer.innerHTML = summaryHTML;
        }

        async function copyOrder() {
            const summaryContainer = document.getElementById('order-summary-content');
            if (!summaryContainer) return;
            const summaryText = summaryContainer.innerText;
            if (!summaryText || summaryText.includes('¡Inventario completo!')) {
                showToast('No hay pedido para copiar.', 'error');
                return;
            }
            // MODIFICACIÓN: Usar la fecha seleccionada
            const date = getOrderDate(); 
            const formattedDate = date ? new Date(date).toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES');
            const header = `📋 PEDIDO ${currentBranch.toUpperCase()} - ${formattedDate}\n\n`;
            const fullText = header + summaryText + "\n\n---";
            try {
                await navigator.clipboard.writeText(fullText);
                showToast('¡Pedido copiado al portapapeles!', 'success');
            } catch (err) {
                const textarea = document.createElement('textarea');
                textarea.value = fullText;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                showToast('¡Pedido copiado al portapapeles!', 'success');
            }
        }

        async function generateOrderPDF(categoryFilter = null) {
            const { jsPDF } = window.jspdf;
            const currentInventory = branchInventories[currentBranch];
            let productsToOrder = currentInventory.filter(p => Math.max(0, p.min_stock - (p.stock_actual || 0)) > 0);

            if (categoryFilter) {
                productsToOrder = productsToOrder.filter(p => p.category === categoryFilter);
            }

            if (productsToOrder.length === 0) {
                const message = categoryFilter ? `No hay productos para pedir en la categoría ${categoryFilter}.` : 'No hay pedido para generar un PDF.';
                showToast(message, 'error');
                return;
            }

            const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            // MODIFICACIÓN: Usar la fecha seleccionada
            const date = getOrderDate();
            const today = date ? new Date(date.replace(/-/g, '/')).toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES');
            const title = `PEDIDO ${currentBranch.toUpperCase()}${categoryFilter ? ` - ${categoryFilter}` : ''} - ${today}`;
            const tableHead = [['Producto', 'U.Med', 'Stock', 'Pedido']];
            const pageHeight = doc.internal.pageSize.getHeight();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;

            const drawHeaderAndFooter = () => {
                const pageCount = doc.internal.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                    doc.setPage(i);
                    doc.setFontSize(14); 
                    doc.setTextColor(40);
                    doc.text(title, pageWidth / 2, 12, { align: 'center' }); // Posición Y ajustada a 12
                    doc.setFontSize(10);
                    doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
                }
            };
            
            if (categoryFilter) {
                // Si se filtra por categoría, ordenar todos los productos y mostrarlos en una sola tabla.
                productsToOrder.sort((a, b) => a.name.localeCompare(b.name));
                const body = productsToOrder.map(p => {
                    const stock = p.stock_actual || 0;
                    const pedido = Math.max(0, p.min_stock - (p.stock_actual || 0));
                    return [p.name, p.u_med, stock.toString(), pedido.toString()];
                });

                doc.autoTable({
                    head: tableHead,
                    body: body,
                    startY: 32, // Ajustado a 32 para dejar espacio al título (y=12)
                    margin: { bottom: 20 },
                    // CAMBIO: Color de cabecera de tabla sobrio
                    headStyles: { fillColor: [45, 62, 80], textColor: 255, fontStyle: 'bold' },
                    styles: {
                        fontSize: 11, // Aumentado a 11 para mejor legibilidad
                        cellPadding: 1, 
                        lineColor: 200, 
                        lineWidth: 0.1 
                    },
                    theme: 'grid',
                    columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 20, halign: 'center' }, 2: { cellWidth: 20, halign: 'center' }, 3: { cellWidth: 20, halign: 'center' } }
                });
            } else {
                // Si es el pedido completo, agrupar por categoría y generar cada una en una NUEVA HOJA.
                const productsByCategory = productsToOrder.reduce((acc, product) => {
                    if (!acc[product.category]) acc[product.category] = [];
                    acc[product.category].push(product);
                    return acc;
                }, {});

                let isFirstCategory = true;
                const startYForNewPage = 32; 

                for (const category in productsByCategory) {
                    // Si no es la primera categoría, añade una nueva página
                    if (!isFirstCategory) {
                        doc.addPage();
                    } else {
                        isFirstCategory = false; 
                    }

                    const products = productsByCategory[category];
                    products.sort((a, b) => a.name.localeCompare(b.name));
                    const body = products.map(p => [p.name, p.u_med, (p.stock_actual || 0).toString(), Math.max(0, p.min_stock - (p.stock_actual || 0)).toString()]);

                    // Dibujar el título de la categoría en la posición inicial de la página
                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(60);
                    // Usa el margen de la tabla (32 - 5 = 27)
                    doc.text(category.toUpperCase(), margin, startYForNewPage - 5); 

                    doc.autoTable({
                        head: tableHead, 
                        body: body, 
                        startY: startYForNewPage, // Inicia la tabla en 32
                        margin: { bottom: 20 }, 
                        // CAMBIO: Color de cabecera de tabla sobrio
                        headStyles: { fillColor: [45, 62, 80], textColor: 255, fontStyle: 'bold' }, 
                        styles: {
                            fontSize: 11, // Aumentado a 11 para mejor legibilidad
                            cellPadding: 1, 
                            lineColor: 200, 
                            lineWidth: 0.1 
                        },
                        theme: 'grid', 
                        columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 20, halign: 'center' }, 2: { cellWidth: 20, halign: 'center' }, 3: { cellWidth: 20, halign: 'center' } }
                    });
                }
            }

            drawHeaderAndFooter();
            // MODIFICACIÓN: Usar la fecha seleccionada en el nombre de archivo (reemplazar / por - para evitar errores de ruta)
            const fileName = `Pedido_${currentBranch.replace(' ', '_')}${categoryFilter ? `_${categoryFilter.replace(' ', '_')}` : ''}_${today.replace(/\//g, '-')}.pdf`;
            doc.save(fileName);
            showToast('PDF del pedido generado con éxito.', 'success');
        }

        async function generateOrderJPG(categoryFilter) {
            const { jsPDF } = window.jspdf; // Not used, but good practice to keep if other parts use it.
            const currentInventory = branchInventories[currentBranch];
            let productsToOrder = currentInventory.filter(p => Math.max(0, p.min_stock - (p.stock_actual || 0)) > 0);

            if (categoryFilter) {
                productsToOrder = productsToOrder.filter(p => p.category === categoryFilter);
            }

            if (productsToOrder.length === 0) {
                const message = categoryFilter ? `No hay productos para pedir en la categoría ${categoryFilter}.` : 'No hay pedido para generar un JPG.';
                showToast(message, 'error');
                return;
            }

            // Create a temporary, off-screen element to render the order for the image
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.style.width = '600px'; // A fixed width for consistent output
            tempContainer.style.padding = '20px';
            tempContainer.style.backgroundColor = 'white';
            tempContainer.style.fontFamily = 'Arial, sans-serif';
            
            // MODIFICACIÓN: Usar la fecha seleccionada
            const date = getOrderDate();
            const today = date ? new Date(date.replace(/-/g, '/')).toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES');
            const title = `PEDIDO ${currentBranch.toUpperCase()} - ${categoryFilter} - ${today}`;

            let tableHTML = `<h2 style="font-size: 20px; font-weight: bold; text-align: center; margin-bottom: 15px;">${title}</h2>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <thead style="background-color: #4f46e5; color: white;">
                        <tr>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Producto</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">U.Med</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Stock</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Pedido</th>
                        </tr>
                    </thead>
                    <tbody>`;

            productsToOrder.sort((a, b) => a.name.localeCompare(b.name));
            productsToOrder.forEach(p => {
                const pedido = Math.max(0, p.min_stock - (p.stock_actual || 0));
                const stock = p.stock_actual || 0;
                tableHTML += `<tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${p.name}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${p.u_med}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${stock}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${pedido}</td>
                </tr>`;
            });

            tableHTML += `</tbody></table>`;
            tempContainer.innerHTML = tableHTML;
            document.body.appendChild(tempContainer);

            const canvas = await html2canvas(tempContainer, { scale: 2 }); // Increase scale for better quality
            const imageURL = canvas.toDataURL('image/jpeg', 0.9);
            const link = document.createElement('a');
            
            // MODIFICACIÓN: Usar la fecha seleccionada en el nombre de archivo (reemplazar / por - para evitar errores de ruta)
            const fileName = `Pedido_${currentBranch.replace(' ', '_')}_${categoryFilter.replace(' ', '_')}_${today.replace(/\//g, '-')}.jpg`;
            link.href = imageURL;
            link.download = fileName;
            link.click();

            document.body.removeChild(tempContainer);
            showToast('JPG del pedido generado con éxito.', 'success');
        }

        function checkIsSunday() {
            const today = new Date();
            const dayOfWeek = today.getDay(); 
            const header = document.getElementById('day-header');
            if (dayOfWeek === 0) {
                header.innerHTML = '<span class="text-2xl font-bold text-yellow-300">¡HOY ES DOMINGO! 🚨 DÍA DE PEDIDO 🚨</span>';
            } else {
                header.innerHTML = '<span class="text-lg text-white">Próximo pedido: Domingo.</span>';
            }
        }

        function resetCurrentBranchStock() {
            if (!confirm(`¿Estás seguro de que deseas reiniciar a cero todo el stock de ${currentBranch}? Esta acción no se puede deshacer.`)) return;
            const currentInventory = branchInventories[currentBranch];
            if (currentInventory) {
                currentInventory.forEach(product => product.stock_actual = 0);
                saveInventories();
                loadBranchData();
                showToast(`El stock para ${currentBranch} ha sido reiniciado.`, 'info');
            }
        }

        function handleBranchChange(event) {
            currentSearchTerm = '';
            const searchInput = document.getElementById('search-input');
            if (searchInput) searchInput.value = '';
            currentBranch = event.target.value;
            loadBranchData(); 
            showToast(`Sucursal cambiada a ${currentBranch}.`, 'info');
        }

        function handleSearch(event) {
            currentSearchTerm = event.target.value;
            loadBranchData();
        }

        function handleCategoryFilter(event) {
            currentCategoryFilter = event.target.value;
            loadBranchData();
        }

        // --- LÓGICA PARA AÑADIR NUEVO PRODUCTO ---
        const addProductModal = document.getElementById('add-product-modal');
        const addProductBtn = document.getElementById('add-product-btn');

        function openAddProductModal() {
            addProductForm.reset();
            minStocksContainer.innerHTML = ''; // branches is now a global variable
            branches.forEach(branch => {
                minStocksContainer.innerHTML += `
                    <div>
                        <label for="min-stock-${branch.replace(' ', '-')}" class="block text-xs font-bold text-gray-600 mb-1">${branch}:</label>
                        <input type="number" id="min-stock-${branch.replace(/ /g, '-')}" data-branch="${branch}" class="new-min-stock w-full p-2 border border-gray-300 rounded-lg text-sm" value="0" required>
                    </div>
                `;
            });
            addProductModal.classList.remove('hidden');
        }

        function closeAddProductModal() {
            addProductModal.classList.add('hidden');
        }

        function saveNewProduct(event) {
            event.preventDefault();
            const newProduct = {
                id: `custom-${Date.now()}`,
                name: document.getElementById('new-product-name').value,
                category: document.getElementById('new-product-category').value.toUpperCase(),
                u_med: document.getElementById('new-product-umed').value.toUpperCase(),
                min_stocks: {}
            };

            document.querySelectorAll('.new-min-stock').forEach(input => {
                const branch = input.dataset.branch;
                newProduct.min_stocks[branch] = parseInt(input.value) || 0;
            });

            const customProducts = JSON.parse(localStorage.getItem('customProducts')) || [];
            customProducts.push(newProduct);
            localStorage.setItem('customProducts', JSON.stringify(customProducts));

            // Actualizar inventarios existentes con el nuevo producto
            branches.forEach(branch => {
                branchInventories[branch] = createNewInventory(branch);
            });

            showToast('¡Producto añadido con éxito!', 'success');
            closeAddProductModal();
        }

        function populatePdfDropdown() {
            const pdfOptionsContainer = document.querySelector('#pdf-options .py-1');
            if (!pdfOptionsContainer) return;
            const categories = [...new Set(allProductsForPedidos.map(p => p.category))].sort();
            let optionsHTML = `<a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 pdf-option" data-category="all" role="menuitem"><span class="font-bold">PDF Pedido Completo</span></a><div class="border-t border-gray-200 my-1"></div>`;
            categories.forEach(category => { optionsHTML += `<a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 pdf-option" data-category="${category}" role="menuitem">PDF ${category}</a>`; });
            pdfOptionsContainer.innerHTML = optionsHTML;
        }

        function populateJpgDropdown() {
            const jpgOptionsContainer = document.querySelector('#jpg-options .py-1');
            if (!jpgOptionsContainer) return;
            const customProducts = JSON.parse(localStorage.getItem('customProducts')) || [];
            const categories = [...new Set([...allProductsForPedidos, ...customProducts].map(p => p.category))].filter(c => ['ABARROTES', 'BEBIDAS', 'LIMPIEZA', 'DESCARTABLES', 'LICORES'].includes(c)).sort();
            let optionsHTML = '';
            categories.forEach(category => { optionsHTML += `<a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 jpg-option" data-category="${category}" role="menuitem">JPG ${category}</a>`; });
            jpgOptionsContainer.innerHTML = optionsHTML;
        }

        function populateCategoryFilter() {
            const categoryFilterSelect = document.getElementById('category-filter');
            if (!categoryFilterSelect) return;
            const selectedValue = categoryFilterSelect.value;
            categoryFilterSelect.innerHTML = '<option value="">Todas las categorías</option>';
            const categories = [...new Set(allProductsForPedidos.map(p => p.category))].sort();
            categories.forEach(category => categoryFilterSelect.innerHTML += `<option value="${category}">${category}</option>`);
            // Restaurar la selección si todavía existe en la lista
            if (Array.from(categoryFilterSelect.options).some(opt => opt.value === selectedValue)) {
                categoryFilterSelect.value = selectedValue;
            }
        }

        const initializeApp = () => {
            // Cargar y combinar productos primero
            const customProducts = JSON.parse(localStorage.getItem('customProducts')) || [];
            allProductsForPedidos = [...baseProducts, ...customProducts];
            allProductsForPedidos.sort((a, b) => a.name.localeCompare(b.name));
            
            // Inicializar la fecha al día de hoy
            const today = new Date().toISOString().split('T')[0];
            const dateInput = document.getElementById('order-date-input');
            if (dateInput) {
                dateInput.value = today;
            }

            // Ahora inicializar el resto
            const branchSelector = document.getElementById('branch-selector');
            branches.forEach(branch => {
                // Si el inventario no existe o está vacío, créalo.
                // Esto es importante si se añade una nueva sucursal.
                if (!branchInventories[branch] || branchInventories[branch].length === 0) {
                    branchInventories[branch] = createNewInventory(branch);
                }
            });
            saveInventories(); // Guardar por si se crearon nuevos inventarios

            currentBranch = branchSelector.value;
            populateCategoryFilter();
            populatePdfDropdown();
            populateJpgDropdown();
            loadBranchData(); // ¡Esta es la línea que faltaba!
        };

        // Lógica para el acordeón del resumen de pedido
        const orderSummaryToggle = document.getElementById('order-summary-toggle');
        const orderSummaryContent = document.getElementById('order-summary-content');
        if (orderSummaryToggle && orderSummaryContent) {
            orderSummaryToggle.addEventListener('click', () => orderSummaryContent.classList.toggle('hidden'));
        }

        initializeApp();
        checkIsSunday();
        setInterval(checkIsSunday, 60000);

        document.getElementById('copy-order-btn')?.addEventListener('click', copyOrder);
        document.getElementById('branch-selector')?.addEventListener('change', handleBranchChange);
        document.getElementById('reset-stock-btn')?.addEventListener('click', resetCurrentBranchStock);
        document.getElementById('search-input')?.addEventListener('input', handleSearch);
        document.getElementById('category-filter')?.addEventListener('change', handleCategoryFilter);
        document.getElementById('inventory-container')?.addEventListener('change', (event) => { if (event.target && event.target.classList.contains('stock-input')) handleStockChange(event.target); });

        const closeAddProductModalBtn = document.getElementById('close-add-product-modal');
        const cancelAddProductBtn = document.getElementById('cancel-add-product');
        const addProductForm = document.getElementById('add-product-form');
        const minStocksContainer = document.getElementById('new-product-min-stocks');
        addProductBtn.addEventListener('click', openAddProductModal);
        closeAddProductModalBtn.addEventListener('click', closeAddProductModal);
        cancelAddProductBtn.addEventListener('click', closeAddProductModal);
        addProductForm.addEventListener('submit', saveNewProduct);
        
        const pdfDropdownBtn = document.getElementById('pdf-dropdown-btn');
        const pdfOptions = document.getElementById('pdf-options');
        if (pdfDropdownBtn && pdfOptions) {
            populatePdfDropdown();
            pdfDropdownBtn.addEventListener('click', () => pdfOptions.classList.toggle('hidden'));
            pdfOptions.addEventListener('click', (event) => {
                event.preventDefault();
                const target = event.target.closest('.pdf-option');
                if (target) {
                    const category = target.getAttribute('data-category');
                    generateOrderPDF(category === 'all' ? null : category);
                    pdfOptions.classList.add('hidden');
                }
            });
            document.addEventListener('click', (event) => {
                if (!pdfDropdownBtn.contains(event.target) && !pdfOptions.contains(event.target)) pdfOptions.classList.add('hidden');
            });
        }

        const jpgDropdownBtn = document.getElementById('jpg-dropdown-btn');
        const jpgOptions = document.getElementById('jpg-options');
        if (jpgDropdownBtn && jpgOptions) {
            populateJpgDropdown();
            jpgDropdownBtn.addEventListener('click', () => jpgOptions.classList.toggle('hidden'));
            jpgOptions.addEventListener('click', (event) => {
                event.preventDefault();
                const target = event.target.closest('.jpg-option');
                if (target) {
                    const category = target.getAttribute('data-category');
                    generateOrderJPG(category);
                    jpgOptions.classList.add('hidden');
                }
            });
            document.addEventListener('click', (event) => { if (!jpgDropdownBtn.contains(event.target) && !jpgOptions.contains(event.target)) jpgOptions.classList.add('hidden'); });
        }

        function deleteBranch() {
            const branchToDelete = document.getElementById('branch-selector').value;
            if (!branchToDelete) {
                return showToast('Selecciona una sucursal para eliminar.', 'error');
            }
            if (confirm(`¿Estás seguro de que quieres eliminar la sucursal "${branchToDelete}"? Se perderá todo su inventario.`)) {
                branches = branches.filter(b => b !== branchToDelete);
                delete branchInventories[branchToDelete];
                saveBranches();
                saveInventories();
                showToast('Sucursal eliminada.', 'success');                
                document.getElementById('branch-selector').dispatchEvent(new Event('change'));
            }
        }

        document.getElementById('delete-branch-btn').addEventListener('click', deleteBranch);
    }

    // --- CARGA DE DATOS Y EJECUCIÓN DE APPS ---
    async function main() {
        populateBranchSelects();
        // Las variables `mockProductos` y `baseProducts` ahora están disponibles globalmente
        // gracias a que 'products.js' se carga directamente en el HTML.
        if (typeof mockProductos !== 'undefined' && typeof baseProducts !== 'undefined') {
            // Ejecutar los inicializadores con los datos cargados
            initBranchCRUD(baseProducts);
            initStockApp();
            initGuiaApp(mockProductos);
            initPedidosApp(baseProducts);
        } else {
            console.error("Error: Los datos de productos (products.js) no se cargaron correctamente.");
            // Opcional: Mostrar un mensaje de error al usuario en la interfaz.
            document.body.innerHTML = '<div style="padding: 2rem; text-align: center; font-size: 1.2rem; color: red;">Error crítico: No se pudieron cargar los datos de los productos. Asegúrate de que el archivo `products.js` exista y esté en la misma carpeta.</div>';
        }
    }

    main();
});