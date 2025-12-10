// planner/plannerView.js
import { state } from "../state.js";
import { getPensumById, normalizePensum } from "./planner.js";
import { runPlanner } from "../algorithm/plannerCore.js";
import { render } from "../utils.js"; // Asumiendo que `render` es una utilidad de DOM

// =================================================================
// UTILIDADES PARA ELECTIVAS Y RENDERING
// =================================================================

// 1. Obtiene todas las electivas del pensum activo
function getAllElectives() {
    const p = getPensumById(state.currentPensum);
    if (!p) return [];
    return normalizePensum(p).electivas;
}

// 2. Renderiza una lista de electivas como checkboxes (sin cambios)
function renderElectiveChecklist(idPrefix, label, electives) {
    // Genera la lista inicial de checkboxes
    const checklistItems = electives.map(e => `
        <li class="list-group-item p-1 elective-item" data-code="${e.codigo}" data-name="${e.nombre.toLowerCase()}">
            <div class="form-check">
                <input class="form-check-input elective-checkbox" type="checkbox" value="${e.codigo}" id="${idPrefix}-${e.codigo}">
                <label class="form-check-label" for="${idPrefix}-${e.codigo}">
                    ${e.codigo} — ${e.nombre} (${e.creditos} Crs)
                </label>
            </div>
        </li>
    `).join('');

    return `
        <div class="col-md-6">
            <label for="${idPrefix}Search" class="form-label">${label}</label>
            
            <div class="input-group mb-2">
                <input type="text" class="form-control elective-search" id="${idPrefix}Search" data-checklist-id="${idPrefix}Checklist" placeholder="Buscar por código/nombre">
            </div>

            <ul class="list-group elective-checklist" id="${idPrefix}Checklist" style="max-height: 250px; overflow-y: auto; border: 1px solid #dee2e6;">
                ${checklistItems}
            </ul>
        </div>
    `;
}

// 3. Filtra la lista de electivas al escribir en el campo de búsqueda (sin cambios)
function filterElectiveChecklist(e) {
    const input = e.target;
    const searchText = input.value.toLowerCase();
    const checklistId = input.dataset.checklistId;
    const checklist = document.getElementById(checklistId);

    if (!checklist) return;

    const items = checklist.querySelectorAll('.elective-item');
    items.forEach(item => {
        const code = item.dataset.code.toLowerCase();
        const name = item.dataset.name;

        if (code.includes(searchText) || name.includes(searchText)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

// 4. Renderiza la lista de Materias Obligatorias con búsqueda y por ciclo (NUEVO)
function renderMateriasChecklist(materiasPorCiclo) {
    let html = `
        <div class="d-flex justify-content-between align-items-center">
            <h4>Materias aprobadas (Obligatorias)</h4>
            <div>
                <button id="selectAll" class="btn btn-sm btn-outline-warning me-2">Seleccionar todo</button>
                <button id="unselectAll" class="btn btn-sm btn-outline-secondary">Deseleccionar</button>
            </div>
        </div>

        <div class="input-group my-3">
            <input type="text" class="form-control" id="materiasObligatoriasSearch" placeholder="Buscar materia por código o nombre...">
        </div>
        
        <div id="materiasObligatoriasContainer" style="max-height: 400px; overflow-y: auto;">
    `;

    for (const ciclo in materiasPorCiclo) {
        html += `
            <div class="card mb-3 obligatorio-cycle-card" data-cycle="${ciclo}">
                <div class="card-header bg-light d-flex justify-content-between align-items-center p-2">
                    <h6 class="m-0">Ciclo #${ciclo}</h6>
                    <div class="form-check form-switch m-0">
                        <input class="form-check-input select-cycle-toggle" type="checkbox" id="toggle-ciclo-${ciclo}" data-cycle="${ciclo}">
                        <label class="form-check-label small" for="toggle-ciclo-${ciclo}">
                            Todo
                        </label>
                    </div>
                </div>
                <ul class="list-group list-group-flush cycle-${ciclo}-checkboxes">
                    ${materiasPorCiclo[ciclo].map(m => `
                        <li class="list-group-item p-1 obligatorio-item" 
                            data-code="${m.codigo.toLowerCase()}" 
                            data-name="${m.nombre.toLowerCase()}" 
                            data-cycle="${ciclo}">
                            <div class="form-check">
                                <input class="form-check-input plannerAprobada cycle-checkbox-${ciclo}" 
                                        type="checkbox" value="${m.codigo}" id="check-${m.codigo}"
                                        data-master-toggle="toggle-ciclo-${ciclo}"> 
                                <label class="form-check-label" for="check-${m.codigo}">
                                    ${m.codigo} — ${m.nombre}
                                </label>
                            </div>
                        </li>
                    `).join("")}
                </ul>
            </div>
        `;
    }

    html += `</div>`;
    return html;
}

// 5. Filtra la lista de Materias Obligatorias al escribir
function filterMateriasObligatorias(e) {
    const searchText = e.target.value.toLowerCase();
    const container = document.getElementById('materiasObligatoriasContainer');
    if (!container) return;

    // Ocultar/mostrar ítems individuales
    const items = container.querySelectorAll('.obligatorio-item');
    items.forEach(item => {
        const code = item.dataset.code;
        const name = item.dataset.name;

        if (code.includes(searchText) || name.includes(searchText)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });

    // Ocultar/mostrar los contenedores de ciclo si todas sus materias están ocultas
    const cycleCards = container.querySelectorAll('.obligatorio-cycle-card');
    cycleCards.forEach(card => {
        const visibleItems = card.querySelectorAll('.obligatorio-item:not([style*="display: none"])');
        if (visibleItems.length === 0) {
            card.style.display = 'none';
        } else {
            card.style.display = '';
        }
    });
}


// 6. Actualiza el contador de créditos de electivas y aplica las reglas de filtrado/deshabilitación (sin cambios)
function refreshElectivesCreditCounter() {
    const allElectives = getAllElectives();

    const approvedContainer = document.getElementById('electivasAprobadasChecklist');
    const planContainer = document.getElementById('electivasPlanChecklist');

    if (!approvedContainer || !planContainer) return;

    // 1. Obtener electivas seleccionadas a partir de checkboxes
    const approvedCodes = Array.from(approvedContainer.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
    const planCheckboxes = planContainer.querySelectorAll('input[type="checkbox"]');

    // Obtener los códigos del plan (solo los que están chequeados Y no deshabilitados)
    const planCodes = Array.from(planCheckboxes)
        .filter(cb => cb.checked && !cb.disabled)
        .map(cb => cb.value);

    // 2. Calcular créditos totales
    const totalCodes = [...new Set([...approvedCodes, ...planCodes])];

    let totalCredits = 0;
    for (const code of totalCodes) {
        const electiva = allElectives.find(e => e.codigo === code);
        if (electiva) {
            totalCredits += electiva.creditos || 0;
        }
    }

    document.getElementById('electivaCreditsCounter').textContent = totalCredits;

    // 3. Regla: Deshabilitar en 'Electivas a Incluir' si está en 'Electivas Aprobadas'
    planCheckboxes.forEach(cb => {
        const isApproved = approvedCodes.includes(cb.value);

        if (isApproved) {
            cb.disabled = true;
            cb.checked = false;
        } else {
            cb.disabled = false;
        }
    });
}


// =================================================================
// VISTA PRINCIPAL (Sin cambios)
// =================================================================

export function plannerView() {

    if (state.pensums.length === 0)
        return `<div class="alert alert-warning">Primero debe crear o importar un pensum.</div>`;

    const opts = state.pensums
        .map(p => `<option value="${p.id}">${p.nombre}</option>`)
        .join("");

    return `
        <h2>Planificador</h2>

        <div class="accordion" id="accordionPlanner">

            <div class="accordion-item">
                <h2 class="accordion-header">
                    <button class="accordion-button bg-success text-white" type="button" data-bs-toggle="collapse" 
                        data-bs-target="#collapsePlanner" aria-expanded="true">
                        Configuración del plan
                    </button>
                </h2>

                <div id="collapsePlanner" class="accordion-collapse collapse show">
                    <div class="accordion-body">

                        <div class="mb-3">
                            <label class="form-label">Seleccionar pensum</label>
                            <select id="plannerPensum" class="form-select">
                                <option disabled selected>-- Seleccionar --</option>
                                ${opts}
                            </select>
                        </div>

                        <div id="plannerStep2"></div>

                    </div>
                </div>
            </div>

        </div>

        <div id="plannerResult"></div>
    `;
}


// =================================================================
// EVENTO principal: seleccionar pensum (MODIFICADO)
// =================================================================
document.addEventListener("change", e => {
    if (e.target.id !== "plannerPensum") return;

    const id = e.target.value;
    const p = getPensumById(id);
    state.currentPensum = id;

    // Obtener materias obligatorias y electivas
    const { materias, electivas: allElectives } = normalizePensum(p);

    // Materias obligatorias/normales
    const materiasOrdenadas = materias
        .sort((a, b) => a.cuatrimestre - b.cuatrimestre);

    // Agrupar por ciclo
    const materiasPorCiclo = {};
    materiasOrdenadas.forEach(m => {
        const c = m.cuatrimestre;
        if (!materiasPorCiclo[c]) materiasPorCiclo[c] = [];
        materiasPorCiclo[c].push(m);
    });

    // GENERAR HTML para Electivas
    const htmlElectivas = `
        <div class="card mb-4 bg-light">
            <div class="card-header">
                <h5 class="mb-0">Gestión de Electivas</h5>
            </div>
            <div class="card-body">
                <div class="row g-3">
                    ${renderElectiveChecklist("electivasAprobadas", "Electivas Aprobadas", allElectives)}
                    ${renderElectiveChecklist("electivasPlan", "Electivas a Incluir en el Plan", allElectives)}
                </div>

                <div class="mt-3 alert alert-info py-2">
                    Total de Créditos de Electivas Aprobadas/Plan: <strong><span id="electivaCreditsCounter">0</span></strong>
                </div>
            </div>
        </div>
    `;

    // GENERAR HTML para Materias Aprobadas Obligatorias (USANDO NUEVO RENDER)
    const htmlMaterias = renderMateriasChecklist(materiasPorCiclo);

    document.getElementById("plannerStep2").innerHTML = `
        <hr>
        <h4>Restricciones</h4>
        <div class="row g-3 mb-3">
            <div class="col-7 col-md-6">
                <label class="form-label">Máx. materias que quieres tomar por ciclo</label>
                <input id="plannerMaxMats" type="number" min="1" value="4" class="form-control">
            </div>

            <div class="col-5 col-md-4">
                <label class="form-label">Máx. créditos por ciclo</label>
                <input id="plannerMaxCreds" type="number" min="1" value="25" class="form-control">
            </div>
        </div>

        <hr>
        <h4>Información académica</h4>
        <div class="row g-3 mb-3">
            <div class="col-6 col-md-3">
                <label class="form-label">Último ciclo cursado</label>
                <select id="lastCiclo" class="form-select">
                    <option value="1">1 (Enero–Abril)</option>
                    <option value="2">2 (Mayo–Agosto)</option>
                    <option value="3">3 (Septiembre–Diciembre)</option>
                </select>
            </div>
            <div class="col-6 col-md-3">
                <label class="form-label">Año</label>
                <input id="lastYear" type="number" class="form-control" value="${new Date().getFullYear()}" min="2000" max="2100">
            </div>
        </div>

        <hr>
        ${htmlElectivas}
        <hr>
        ${htmlMaterias}
        <hr>
        <button id="plannerRun" class="btn btn-warning btn-lg">
            Generar Plan
        </button>
    `;

    // Configurar listeners para la nueva estructura de Electivas
    const approvedContainer = document.getElementById('electivasAprobadasChecklist');
    const planContainer = document.getElementById('electivasPlanChecklist');
    const checkboxListener = () => refreshElectivesCreditCounter();

    if (approvedContainer) approvedContainer.addEventListener('change', checkboxListener);
    if (planContainer) planContainer.addEventListener('change', checkboxListener);

    document.getElementById('electivasAprobadasSearch')?.addEventListener('keyup', filterElectiveChecklist);
    document.getElementById('electivasPlanSearch')?.addEventListener('keyup', filterElectiveChecklist);

    // NUEVO: Listener para la búsqueda de materias obligatorias
    document.getElementById('materiasObligatoriasSearch')?.addEventListener('keyup', filterMateriasObligatorias);

    refreshElectivesCreditCounter();
});


// SELECT ALL / UNSELECT ALL (MODIFICADO para usar el nuevo selector)
document.addEventListener("click", e => {
    if (e.target.id === "selectAll") {
        document.querySelectorAll("#materiasObligatoriasContainer .plannerAprobada").forEach(cb => cb.checked = true);
        document.querySelectorAll("#materiasObligatoriasContainer .select-cycle-toggle").forEach(cb => cb.checked = true);
    }
    if (e.target.id === "unselectAll") {
        document.querySelectorAll("#materiasObligatoriasContainer .plannerAprobada").forEach(cb => cb.checked = false);
        document.querySelectorAll("#materiasObligatoriasContainer .select-cycle-toggle").forEach(cb => cb.checked = false);
    }
});

// Sincronizar checkboxes de ciclo (MODIFICADO para el nuevo HTML)
document.addEventListener("change", e => {
    // 1. Manejar el cambio del switch maestro (Seleccionar Todo por ciclo)
    if (e.target.classList.contains("select-cycle-toggle")) {
        const isChecked = e.target.checked;
        const ciclo = e.target.dataset.cycle;

        // Seleccionar todos los checkboxes de materias APROBADAS dentro de ese ciclo
        const checkboxes = document.querySelectorAll(`.cycle-checkbox-${ciclo}`);

        checkboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
    }

    // 2. Manejar el cambio de un checkbox de materia individual
    if (e.target.classList.contains("plannerAprobada") && e.target.dataset.masterToggle) {
        const masterToggleId = e.target.dataset.masterToggle;
        const masterToggle = document.getElementById(masterToggleId);

        if (!masterToggle) return;

        const ciclo = masterToggle.dataset.cycle;
        const checkboxes = document.querySelectorAll(`.cycle-checkbox-${ciclo}`);

        // Verificar si todos los checkboxes individuales están marcados
        const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);

        // Sincronizar el estado del maestro
        masterToggle.checked = allChecked;
    }
});

// =================================================================
// Ejecutar el planificador (Sin cambios)
// =================================================================
document.addEventListener("click", e => {
    if (e.target.id !== "plannerRun") return;

    const id = state.currentPensum;
    const p = getPensumById(id);

    // 1. Obtener todas las materias base (obligatorias y electivas por separado)
    const { materias: mandatoryMaterias, electivas: allElectives } = normalizePensum(p);

    // 2. Obtener materias APROBADAS (obligatorias)
    // El selector ahora es más específico para la nueva estructura
    const aprobadasBase = [...document.querySelectorAll("#materiasObligatoriasContainer .plannerAprobada:checked")]
        .map(c => c.value);

    // Obtener electivas APROBADAS (de los checkboxes)
    const approvedElectiveCodes = Array.from(document.getElementById("electivasAprobadasChecklist")?.querySelectorAll('input[type="checkbox"]:checked') || []).map(cb => cb.value);

    // La lista final de aprobadas
    const aprobadasFinal = [...aprobadasBase, ...approvedElectiveCodes];

    // 3. Obtener electivas a incluir en el plan y MODIFICAR su tipo a "normal"
    const planElectiveCheckboxes = document.getElementById("electivasPlanChecklist")?.querySelectorAll('input[type="checkbox"]:checked:not([disabled])') || [];
    const planElectiveCodes = Array.from(planElectiveCheckboxes).map(cb => cb.value);

    const planElectivesModified = allElectives
        .filter(e => planElectiveCodes.includes(e.codigo))
        .map(e => ({
            ...e,
            tipo: "normal",
            cuatrimestre: 999
        }));

    // 4. Fusionar materias obligatorias/normales con las electivas modificadas
    const materiasFinal = [...mandatoryMaterias, ...planElectivesModified];

    // 5. Ejecutar el planner
    const maxM = Number(document.getElementById("plannerMaxMats").value);
    const maxC = Number(document.getElementById("plannerMaxCreds").value);

    const plan = runPlanner(
        materiasFinal,
        aprobadasFinal,
        maxM,
        maxC
    );

    document.getElementById("collapsePlanner").classList.remove("show");

    document.getElementById("plannerResult").innerHTML =
        renderPlannerOutput(plan, materiasFinal);
});

// CALCULAR CICLO REAL (Sin cambios)
function calcularCicloReal(inicioIdx, lastCiclo, lastYear) {

    let ciclo = lastCiclo;
    let year = lastYear;

    for (let i = 0; i <= inicioIdx; i++) {
        ciclo++;
        if (ciclo > 3) {
            ciclo = 1;
            year++;
        }
    }

    return { ciclo, year };
}


// RENDER DEL RESULTADO (Sin cambios)
function renderPlannerOutput(plan, materiasDB) {
    if (!plan || plan.length === 0)
        return `<div class="alert alert-danger mt-3">No se pudo generar un plan.</div>`;

    const getMateria = code => materiasDB.find(m => m.codigo === code);
    const lastCiclo = Number(document.getElementById("lastCiclo").value);
    const lastYear = Number(document.getElementById("lastYear").value);

    let html = `
        <hr>
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h3>Plan Generado</h3>
            <button id="plannerPDF" class="btn btn-outline-danger">
                Descargar PDF
            </button>
        </div>
        <div id="plannerPlanContainer">
    `;

    plan.forEach((ciclo, idx) => {
        const real = calcularCicloReal(idx, lastCiclo, lastYear);

        html += `
        <div class="card mb-4 shadow">
            <div class="card-header bg-success text-white">
                <strong>Ciclo #${idx + 1} (${String(real.ciclo).padStart(2, "0")}-${real.year})</strong>
            </div>
            <ul class="list-group list-group-flush">
                ${ciclo.map(code => {
            const m = getMateria(code);
            if (!m) return '';

            const prereq = (Array.isArray(m.prerequisitos) && m.prerequisitos.length > 0) ? m.prerequisitos.join(", ") : "Ninguno";
            const coreq = (Array.isArray(m.corequisitos) && m.corequisitos.length > 0) ? m.corequisitos.join(", ") : "Ninguno";

            let reglas = "—";
            if (m.reglas && typeof m.reglas === "object" && m.reglas.requires_all_until !== undefined) {
                reglas = `Haber aprobado todas las materias hasta el ciclo #${m.reglas.requires_all_until}`;
            }

            let tipoEtiqueta = "";
            if (m.cuatrimestre === 999 && m.tipo === "normal") {
                tipoEtiqueta = `<span class="badge bg-info text-dark ms-2">Electiva Planificada</span>`;
            }


            return `
                <li class="list-group-item">
                    <strong>${m.codigo} — ${m.nombre}</strong> ${tipoEtiqueta}<br>
                    <small class="text-muted">
                        Créditos: <strong>${m.creditos}</strong><br>
                        Pre-Req.: <strong>${prereq}</strong>, Co-Req.: <strong>${coreq}</strong><br>
                        ${reglas == "—" ? "" : `Regla: <strong>${reglas}</strong>`}
                    </small>
                </li>
            `;
        }).join("")}
            </ul>
        </div>`;
    });

    html += `</div>`;
    return html;
}

// EXPORTAR A PDF (Sin cambios)
document.addEventListener("click", async e => {
    if (e.target.id !== "plannerPDF") return;

    const container = document.getElementById("plannerPlanContainer");
    if (!container) return alert("No hay plan para exportar.");

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - 2 * margin;

    let cursorY = margin;

    const cards = container.querySelectorAll(".card");

    for (const card of cards) {
        const canvas = await html2canvas(card, { scale: 1.5, useCORS: true });
        const imgData = canvas.toDataURL("image/jpeg", 0.8);
        const imgHeight = (canvas.height * contentWidth) / canvas.width;

        if (cursorY + imgHeight > pageHeight - margin) {
            pdf.addPage();
            cursorY = margin;
        }

        pdf.addImage(imgData, "JPEG", margin, cursorY, contentWidth, imgHeight);
        cursorY += imgHeight + 5;
    }

    pdf.save("plan.pdf");
});