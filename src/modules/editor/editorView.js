// editor/editorView.js
import {
  createPensum,
  getPensum,
  renamePensum,
  deletePensum,
  addCycle,
  addMateria,
  deleteMateria,
  deleteCycle,
  exportPensum,
  importPensum,
  editMateriaField,
  addElectiva,
  deleteElectiva,
  editElectivaField,
  // === NUEVOS IMPORTS ===
  ACADEMIC_PERIODS,
  DEFAULT_PERIOD,
  editPensumPeriod
  // ======================
} from "./editor.js";

import { state, saveState } from "../../core/state.js";
import { uid, render } from "../../core/utils.js";

// Variable global (o usa localStorage) para guardar el ID del tab activo
let activeTabId = '#tabResumen'; // Valor por defecto

/* ===========================================
    UTILITY: Re-renderiza la vista actual
    =========================================== */
function reinitializeTabs() {
  // 1. Escuchar el evento de Bootstrap para actualizar el ID activo
  const tabList = document.getElementById('editorTabs');
  if (tabList) {
    tabList.addEventListener('shown.bs.tab', function (e) {
      // Guardar el nuevo tab activo para la próxima recarga
      activeTabId = e.target.getAttribute('data-bs-target');
    });
  }

  // 2. Intentar activar el tab previamente activo
  // Necesitamos un pequeño retraso para asegurar que Bootstrap ha procesado el DOM
  setTimeout(() => {
    const triggerEl = document.querySelector(`[data-bs-target="${activeTabId}"]`);
    if (triggerEl) {
      // Eliminar la clase 'active' de cualquier otro botón de tab
      document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('show', 'active'));

      // Activar el tab guardado
      const tab = new bootstrap.Tab(triggerEl);
      tab.show();
    }
  }, 50); // Pequeño delay de 50ms para asegurar la inicialización de Bootstrap
}


function refreshEditorView() {
  // 1. Genera el nuevo HTML
  const newHtml = editorView();

  // 2. Renderiza el HTML usando tu método de utilidad
  render(newHtml);

  // 3. Restaura el estado de los tabs
  reinitializeTabs();
}

/* ===========================================
    UTILITY: Renderiza y actualiza SOLO un ciclo
    =========================================== */
function refreshCycleCard(cycleId) {
  const p = getPensum();
  const cycle = p.ciclos.find(c => c.id === cycleId);

  if (cycle) {
    // Encontrar el índice para mostrar "Ciclo X"
    const index = p.ciclos.findIndex(c => c.id === cycleId);

    // 1. Generar el nuevo HTML solo para la tarjeta del ciclo
    const newHtml = renderCycleCard(cycle, index);

    // 2. Encontrar el elemento existente en el DOM
    const existingCycleCard = document.querySelector(`[data-cycle="${cycleId}"]`);

    if (existingCycleCard) {
      // 3. Reemplazar el contenido de la tarjeta existente
      // Usamos outerHTML para reemplazar la tarjeta completa.
      existingCycleCard.outerHTML = newHtml;
    }
  }
}

/* ===========================================
    UTILITY: Renderiza y actualiza TODO el contenedor de ciclos
    =========================================== */
function refreshCyclesContainer() {
  const p = getPensum();
  if (!p) return;

  const container = document.getElementById('cyclesContainerInner');
  if (container) {
    // Genera todo el HTML de los ciclos
    container.innerHTML = p.ciclos.map((c, i) => renderCycleCard(c, i)).join("");
  }
}

/* ===========================================
    UTILITY: Renderiza y actualiza TODO el contenedor de electivas
    =========================================== */
function refreshElectivasContainer() {
  const p = getPensum();
  if (!p) return;

  const container = document.getElementById('electivasContainerInner');
  if (container) {
    // Genera todo el HTML de las electivas
    container.innerHTML = p.electivas.map(e => renderMateriaUnified(null, e, true)).join("");
  }
}

/* ===========================================
    UTILITY: Actualiza solo el bloque de resumen
    =========================================== */
function refreshResumen() {
  const p = getPensum();
  if (!p) return;

  const totalCiclos = p.ciclos.length;
  const totalMaterias = p.ciclos.reduce((s, c) => s + (c.materias?.length || 0), 0);
  const totalCreditos = p.ciclos.reduce((s, c) => s + (c.materias?.reduce((ss, m) => ss + (m.creditos || 0), 0) || 0), 0);
  const totalElectivas = p.electivas?.length || 0;
  // NUEVO: Tipo de período
  const periodo = p.periodoAcademico || DEFAULT_PERIOD;


  const resumenDiv = document.getElementById('tabResumen');
  if (resumenDiv) {
    // Reemplaza el contenido interno de la pestaña de resumen
    resumenDiv.innerHTML = renderResumen(totalCiclos, totalMaterias, totalCreditos, totalElectivas, periodo);
  }
}

// -------------------------------------------------------------
function smartRefresh() {
  refreshResumen();
}
// -------------------------------------------------------------

/* ===========================================
    Helpers de escape
    =========================================== */
function esc(str) {
  return (str ?? "").toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/* ===========================================
    MAIN VIEW
    =========================================== */
export function editorView() {
  const p = getPensum();

  const pensumsOptions = state.pensums
    .map(ps => `<option value="${ps.id}" ${p && ps.id === p.id ? "selected" : ""}>${esc(ps.nombre)}</option>`)
    .join("");

  const title = p ? esc(p.nombre) : "(ninguno)";

  return `
    <h2>Gestionar Pensums</h2>

    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap flex-md-nowrap gap-2">
      <div>
        <label class="form-label">Pensum seleccionado</label>
        <div><strong id="currentPensumTitle">${title}</strong></div>
      </div>

      <div class="d-flex flex-wrap flex-md-nowrap gap-2">
        <select id="pensumSelector" class="form-select form-select-sm" style="min-width:240px;">
          <option disabled ${!p ? "selected" : ""}>-- Seleccionar pensum --</option>
          ${pensumsOptions}
        </select>
        <button id="btnManagePensums" class="btn btn-outline-secondary btn-sm" data-bs-toggle="modal" data-bs-target="#modalManagePensums">
          <i class="bi bi-gear"></i> Gestionar
        </button>
        <button id="btnExportPensum" class="btn btn-success btn-sm">
          <i class="bi bi-box-arrow-down"></i> Exportar
        </button>
      </div>
    </div>

    <hr>

    ${p ? renderEditorMain(p) : renderEmptyState()}
  `;
}

/* ===========================================
    EMPTY VIEW
    =========================================== */
function renderEmptyState() {
  return `
    <div class="card">
      <div class="card-body">
        <h5>No hay ningún pensum seleccionado</h5>
        <p>Crea uno nuevo o importa un JSON.</p>

        <div class="d-flex gap-2 flex-column flex-sm-row">
          <button class="btn btn-primary" id="btnNuevoPensum">
            <i class="bi bi-plus-lg"></i> Crear nuevo pensum
          </button>

          <div style="min-width:260px;">
            <label class="form-label mb-1">Importar pensum (.json)</label>
            <input id="fileImport" type="file" accept="application/json" class="form-control form-control-sm">
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ===========================================
    EDITOR MAIN: TABS
    =========================================== */
function renderEditorMain(p) {
  const totalCiclos = p.ciclos.length;
  const totalMaterias = p.ciclos.reduce((s, c) => s + (c.materias?.length || 0), 0);
  const totalCreditos = p.ciclos.reduce((s, c) => s + (c.materias?.reduce((ss, m) => ss + (m.creditos || 0), 0) || 0), 0);
  const totalElectivas = p.electivas?.length || 0;

  // NUEVO: Generar opciones del select para Periodo Académico
  const periodOptions = Object.values(ACADEMIC_PERIODS).map(period =>
    `<option value="${period}" ${p.periodoAcademico === period ? "selected" : ""}>${period}</option>`
  ).join("");


  return `
    <div class="mb-3">
      <label class="form-label">Nombre del pensum</label>
      <input id="nombrePensum" class="form-control mb-2" value="${esc(p.nombre)}" placeholder="Nombre del pensum">

      <label class="form-label mt-2">Período Académico</label>
      <select id="pensumPeriodSelector" class="form-select mb-3">
          ${periodOptions}
      </select>
      
      <div class="d-flex gap-2">
        <button id="btnAddCycle" class="btn btn-warning btn-sm">
          <i class="bi bi-calendar-plus"></i> Agregar ciclo
        </button>
        <button id="btnAddElectiva" class="btn btn-outline-secondary btn-sm">
          <i class="bi bi-journal-plus"></i> Agregar electiva
        </button>
        <button id="btnDuplicatePensum" class="btn btn-outline-info btn-sm">
          <i class="bi bi-files"></i> Duplicar pensum
        </button>
      </div>
    </div>
    <hr>
    <ul class="nav nav-tabs mb-3" id="editorTabs">
      <li class="nav-item">
        <button class="nav-link text-dark active" data-bs-toggle="tab" data-bs-target="#tabResumen">Resumen</button>
      </li>
      <li class="nav-item">
        <button class="nav-link text-dark" data-bs-toggle="tab" data-bs-target="#tabCiclos">Ciclos</button>
      </li>
      <li class="nav-item">
        <button class="nav-link text-dark" data-bs-toggle="tab" data-bs-target="#tabElectivas">Electivas</button>
      </li>
      <li class="nav-item">
        <button class="nav-link text-dark" data-bs-toggle="tab" data-bs-target="#tabImport">Import/Export</button>
      </li>
    </ul>

    <div class="tab-content">

      <div class="tab-pane fade show active" id="tabResumen">
        ${renderResumen(totalCiclos, totalMaterias, totalCreditos, totalElectivas, p.periodoAcademico)}
      </div>

      <div class="tab-pane fade" id="tabCiclos">
        <div id="cyclesContainerInner">
          ${p.ciclos.map((c, i) => renderCycleCard(c, i)).join("")}
        </div>
      </div>

      <div class="tab-pane fade" id="tabElectivas">
        <div id="electivasContainerInner">
          ${p.electivas.map(e => renderMateriaUnified(null, e, true)).join("")}
        </div>
      </div>

      <div class="tab-pane fade" id="tabImport">
        ${renderImportExport()}
      </div>

    </div>

    ${renderManagePensumsModal()}
  `;
}

/* ===========================================
    RESUMEN
    =========================================== */
function renderResumen(ciclos, materias, creditos, electivas, periodo) {
  return `
    <div class="row g-3">
      <div class="col-6 col-md-3">
        <div class="card p-2">
          <div class="text-muted small">Período</div>
          <div class="fs-4">${periodo || DEFAULT_PERIOD}</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card p-2">
          <div class="text-muted small">Ciclos</div>
          <div class="fs-4">${ciclos}</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card p-2">
          <div class="text-muted small">Materias</div>
          <div class="fs-4">${materias}</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card p-2">
          <div class="text-muted small">Créditos</div>
          <div class="fs-4">${creditos}</div>
        </div>
      </div>
    </div>
  `;
}

/* ===========================================
    CYCLE CARD
    =========================================== */
function renderCycleCard(cycle, index) {
  const collapseId = `cycle_${cycle.id}`;

  return `
    <div class="card mb-3" data-cycle="${cycle.id}">
      <div class="card-header d-flex justify-content-between align-items-center">
        <strong>Ciclo ${index + 1}</strong>

        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="collapse" data-bs-target="#${collapseId}">
            <i class="bi bi-arrows-expand"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" data-delete-cycle="${cycle.id}">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>

      <div id="${collapseId}" class="collapse show">
        <div class="card-body">
          ${cycle.materias.map(m => renderMateriaUnified(cycle.id, m, false)).join("")}

          <button class="btn btn-sm btn-outline-primary mt-2" data-add-materia="${cycle.id}">
            <i class="bi bi-plus-lg"></i> Agregar materia
          </button>
        </div>
      </div>
    </div>
  `;
}


/* ===========================================
    UNIFIED MATERIA CARD (para ciclos y electivas)
    =========================================== */
function renderMateriaUnified(cycleId, m, isElectiva) {
  const prereq = Array.isArray(m.prerequisitos) ? m.prerequisitos.join(", ") : "";
  const coreq = Array.isArray(m.corequisitos) ? m.corequisitos.join(", ") : "";
  const rule = m.reglas?.requires_all_until ?? "";

  // Forzamos el tipo según el contexto
  if (isElectiva) m.tipo = "electiva";
  else m.tipo = "normal";

  return `
    <div class="card p-3 mb-3" data-materia="${cycleId ?? "electiva"}:${m.id}">
      <div class="d-flex justify-content-between">
        <div>
          <strong>${esc(m.codigo) || "(sin código)"}</strong>
          <div class="text-muted small">${esc(m.nombre) || "(sin nombre)"}</div>
        </div>
        <button class="btn btn-sm text-danger" ${isElectiva ? `data-delete-electiva="${m.id}"` : `data-delete-materia="${cycleId}:${m.id}"`}>
          <i class="bi bi-trash-fill"></i>
        </button>
      </div>

      <div class="row g-2 mt-3">

        <div class="col-md-3">
          <label class="small">Código</label>
          <input class="form-control form-control-sm"
            ${isElectiva ? `data-edit-electiva="${m.id}:codigo"` : `data-edit="${cycleId}:${m.id}:codigo"`}
            value="${esc(m.codigo)}">
        </div>

        <div class="col-md-5">
          <label class="small">Nombre</label>
          <input class="form-control form-control-sm"
            ${isElectiva ? `data-edit-electiva="${m.id}:nombre"` : `data-edit="${cycleId}:${m.id}:nombre"`}
            value="${esc(m.nombre)}">
        </div>

        <div class="col-md-2">
          <label class="small">Créditos</label>
          <input type="number" min="0" class="form-control form-control-sm"
            ${isElectiva ? `data-edit-electiva="${m.id}:creditos"` : `data-edit="${cycleId}:${m.id}:creditos"`}
            value="${m.creditos || 0}">
        </div>

        <div class="col-12">
          <label class="small">Pre-requisitos</label>
          <input class="form-control form-control-sm"
            ${isElectiva ? `data-edit-electiva="${m.id}:prerequisitos"` : `data-edit="${cycleId}:${m.id}:prerequisitos"`}
            value="${esc(prereq)}">
        </div>

        <div class="col-12">
          <label class="small">Co-requisitos</label>
          <input class="form-control form-control-sm"
            ${isElectiva ? `data-edit-electiva="${m.id}:corequisitos"` : `data-edit="${cycleId}:${m.id}:corequisitos"`}
            value="${esc(coreq)}">
        </div>

        <div class="col-md-6">
          <label class="small">Requiere haber aprobado todas las materias hasta el ciclo</label>
          <input type="number" min="0" class="form-control form-control-sm"
            ${isElectiva ? `data-edit-electiva="${m.id}:requires_all_until"` : `data-edit="${cycleId}:${m.id}:requires_all_until"`}
            value="${rule}">
        </div>

      </div>
    </div>
  `;
}


/* ===========================================
    IMPORT/EXPORT TAB
    =========================================== */
function renderImportExport() {
  return `
    <div class="mb-3">
      <label class="form-label">Importar pensum (.json)</label>
      <input id="fileImport" type="file" accept="application/json" class="form-control">
    </div>

    <div class="mb-3 d-flex gap-2">
      <button id="btnExportPensum" class="btn btn-success btn-sm">
        <i class="bi bi-box-arrow-down"></i> Exportar JSON del pensum
      </button>
      <button id="btnExportAll" class="btn btn-outline-secondary btn-sm">
        <i class="bi bi-download"></i> Exportar todos los pensums
      </button>
    </div>

    <small class="text-muted">La importación normaliza IDs y maneja nombres duplicados.</small>
  `;
}

// Función utilitaria para obtener la instancia del modal de gestión
function getManagePensumsModalInstance() {
  const modalElement = document.getElementById("modalManagePensums");
  return bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
}

// Función para ocultar el modal de gestión de forma segura
function hideManagePensumsModal() {
  const modal = getManagePensumsModalInstance();
  modal?.hide();
}

/* ===========================================
    MODAL: Manage Pensums
    =========================================== */
function renderManagePensumsModal() {
  const list = state.pensums.map(p => `
    <li class="list-group-item d-flex justify-content-between align-items-center flex-wrap gap-2">
      <div>
        <strong>${esc(p.nombre)}</strong>
        <div class="text-muted small">Ciclos: ${p.ciclos.length}, Créditos: ${p.ciclos.reduce((s, c) => s + (c.materias?.reduce((ss, m) => ss + (m.creditos || 0), 0) || 0), 0)}, Periodo: ${p.periodoAcademico || DEFAULT_PERIOD}</div>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-sm btn-outline-primary" data-select-pensum="${p.id}"><i class="bi bi-check-lg"></i> Seleccionar</button>
        <button class="btn btn-sm btn-outline-secondary" data-rename-pensum="${p.id}"><i class="bi bi-pencil"></i> Renombrar</button>
        <button class="btn btn-sm btn-danger" data-delete-pensum="${p.id}"><i class="bi bi-trash"></i> Eliminar</button>
      </div>
    </li>`).join("");

  return `
    <div class="modal fade" id="modalManagePensums" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered">
        <div class="modal-content">

          <div class="modal-header">
            <h5 class="modal-title">Gestionar Pensums</h5>
            <button id="btnModalCloseHeader" class="btn-close" aria-label="Close"></button>
          </div>

          <div class="modal-body">
            <div class="d-flex gap-2 mb-3">
              <input id="newPensumNameModal" class="form-control" placeholder="Nombre nuevo pensum">
              <button id="btnCreatePensumModal" class="btn btn-success"><i class="bi bi-plus-lg"></i></button>
            </div>
            <ul class="list-group">${list}</ul>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ===========================================
    EVENTOS CLICK
    =========================================== */
document.addEventListener("click", (ev) => {
  const t = ev.target.closest("button"); // Usamos closest("button") para asegurar que capturamos el botón aunque se haga clic en el icono
  if (!t) return;

  // Crear pensum
  if (t.id === "btnNuevoPensum") {
    const name = prompt("Nombre del pensum:");
    if (name) {
      createPensum(name);
      refreshEditorView(); // Usar refreshEditorView en lugar de location.reload()
      // location.reload();
    }
    return;
  }

  // Manejador para el botón "Gestionar" (Abrir)
  if (t.id === "btnManagePensums") {
    // Usar la función para crear/obtener y mostrar
    getManagePensumsModalInstance().show();
    return;
  }

  // MANEJADOR PARA CERRAR EL MODAL
  if (t.id === "btnModalCloseHeader" || t.id === "btnModalCloseFooter") {
    hideManagePensumsModal();
    return;
  }

  if (t.id === "btnCreatePensumModal") {
    const name = document.getElementById("newPensumNameModal").value.trim();
    if (!name) return alert("Nombre inválido");
    createPensum(name);
    refreshEditorView();
    hideManagePensumsModal(); // Cierre manual después del refresh
    return;
  }

  if (t.dataset.selectPensum) {
    state.currentPensum = t.dataset.selectPensum;
    saveState();
    refreshEditorView();
    hideManagePensumsModal(); // Cierre manual después del refresh
    return;
  }

  if (t.dataset.renamePensum) {
    const ps = state.pensums.find(p => p.id === t.dataset.renamePensum);
    const nuevo = prompt("Nuevo nombre", ps.nombre);
    if (nuevo && renamePensum(ps.id, nuevo)) {
      refreshEditorView();
      hideManagePensumsModal(); // Cierre manual después del refresh
    }
    return;
  }

  if (t.dataset.deletePensum) {
    if (confirm("¿Eliminar pensum?")) {
      deletePensum(t.dataset.deletePensum);
      refreshEditorView();
      hideManagePensumsModal(); // Cierre manual después del refresh
    }
    return;
  }

  // Export
  if (t.id === "btnExportPensum" || t.id === "btnExportPensumModal") {
    exportPensum();
    return;
  }

  if (t.id === "btnExportAll") {
    const blob = new Blob([JSON.stringify(state.pensums, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "pensums-backup.json";
    a.click();
    return;
  }

  // Add cycle
  if (t.id === "btnAddCycle") {
    addCycle();
    refreshCyclesContainer();
    refreshResumen();
    activeTabId = '#tabCiclos';
    reinitializeTabs();
    setTimeout(() => {
      const container = document.getElementById('cyclesContainerInner');
      if (container && container.lastElementChild) {
        container.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 50);

    return;
  }

  // Duplicate
  if (t.id === "btnDuplicatePensum") {
    duplicateCurrentPensum();
    return;
  }

  // Add materia
  if (t.dataset.addMateria) {
    const cycleId = t.dataset.addMateria;
    addMateria(cycleId);
    refreshCycleCard(cycleId);
    refreshResumen();
    const cycleContainer = document.querySelector(`[data-cycle="${cycleId}"]`);
    if (cycleContainer) {
      cycleContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    return;
  }

  // Delete ciclo
  if (t.dataset.deleteCycle) {
    if (confirm("¿Eliminar ciclo completo?")) {
      const cycleId = t.dataset.deleteCycle;
      const cycleCard = document.querySelector(`[data-cycle="${cycleId}"]`);
      const nextCycleId = cycleCard.nextElementSibling?.dataset.cycle;
      const scrollPosition = cycleCard ? cycleCard.offsetTop : 0;
      deleteCycle(cycleId);
      refreshCyclesContainer();
      refreshResumen();
      activeTabId = '#tabCiclos';
      reinitializeTabs();
      setTimeout(() => {
        let targetElement = null;
        if (nextCycleId) {
          targetElement = document.querySelector(`[data-cycle="${nextCycleId}"]`);
        }
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          document.getElementById('cyclesContainerInner').scrollTop = scrollPosition - 50;
        }
      }, 50);
    }
    return;
  }

  // Delete materia
  if (t.dataset.deleteMateria) {
    const [c, m] = t.dataset.deleteMateria.split(":");
    if (confirm("¿Eliminar materia?")) {
      const materiaCard = document.querySelector(`[data-materia="${c}:${m}"]`);
      const scrollPosition = materiaCard ? materiaCard.offsetTop : 0;
      deleteMateria(c, m);
      refreshCycleCard(c);
      refreshResumen();
      setTimeout(() => {
        document.getElementById('cyclesContainerInner').scrollTop = scrollPosition - 50;
      }, 50);
    }
    return;
  }

  // Add electiva
  if (t.id === "btnAddElectiva") {
    addElectiva();
    refreshElectivasContainer();
    refreshResumen();
    activeTabId = '#tabElectivas';
    reinitializeTabs();
    setTimeout(() => {
      const electivasContainer = document.getElementById('electivasContainerInner');
      if (electivasContainer) {
        electivasContainer.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 50);
    return;
  }

  // Delete electiva
  if (t.dataset.deleteElectiva) {
    if (confirm("¿Eliminar electiva?")) {
      const electivaId = t.dataset.deleteElectiva;
      const electivaCard = document.querySelector(`[data-materia="electiva:${electivaId}"]`);
      const scrollPosition = electivaCard ? electivaCard.offsetTop : 0;
      deleteElectiva(electivaId);
      refreshElectivasContainer();
      refreshResumen();
      activeTabId = '#tabElectivas';
      reinitializeTabs();
      setTimeout(() => {
        document.getElementById('electivasContainerInner').scrollTop = scrollPosition - 50;
      }, 50);
    }
    return;
  }
});

/* ===========================================
    INPUT EVENTS (Ajustes de Reactividad)
    =========================================== */
document.addEventListener("input", (ev) => {
  const t = ev.target;
  const p = getPensum();
  if (!p) return;

  // Materias (se modifican los créditos, así que hay que actualizar el resumen)
  if (t.dataset.edit) {
    const [c, m, field] = t.dataset.edit.split(":");
    editMateriaField(c, m, field, t.value);

    // Si el campo modificado es 'creditos', actualizamos el resumen
    if (field === 'creditos') {
      refreshResumen();
    }
    return;
  }

  // Electivas (se modifican los créditos, así que hay que actualizar el resumen)
  if (t.dataset.editElectiva) {
    const [id, field] = t.dataset.editElectiva.split(":");
    editElectivaField(id, field, t.value);

    // Si el campo modificado es 'creditos', actualizamos el resumen
    if (field === 'creditos') {
      refreshResumen();
    }
    return;
  }
});

/* ===========================================
    CHANGE EVENTS
    =========================================== */
document.addEventListener("change", (ev) => {
  const t = ev.target;
  const p = getPensum();

  // === 1. CAMBIO DE PENSUM SELECCIONADO ===
  if (t.id === "pensumSelector") {
    state.currentPensum = t.value;
    saveState();
    refreshEditorView(); // Usar refreshEditorView en lugar de location.reload()
    return;
  }

  // === 2. RENOMBRAR PENSUM DESDE EL INPUT PRINCIPAL ===
  if (t.id === "nombrePensum") {
    const nuevoNombre = t.value.trim();

    if (!p) return;

    // Si el nombre es igual al guardado o vacío, no hacemos nada
    if (!nuevoNombre || nuevoNombre === p.nombre) {
      t.value = p.nombre; // Asegura que el valor del input refleje el guardado
      return;
    }

    if (renamePensum(p.id, nuevoNombre)) {
      // El renamePensum ya guardó el estado. Actualizamos la vista.
      refreshEditorView();
    } else {
      alert("El nombre ya existe o es inválido. Revirtiendo al nombre anterior.");
      // Revertir el valor del input al nombre guardado
      t.value = p.nombre;
    }
    return;
  }

  // === 3. CAMBIO DE PERÍODO ACADÉMICO ===
  if (t.id === "pensumPeriodSelector") {
    editPensumPeriod(t.value);
    // El cambio solo afecta el resumen, por lo que solo refrescamos eso
    refreshResumen();
    return;
  }

  // === 4. IMPORTAR ARCHIVO ===
  if (t.id === "fileImport") {
    const file = t.files[0];
    if (!file) return;
    file.text().then(text => {
      if (importPensum(text)) refreshEditorView();
      // location.reload();
    });
    return;
  }
});

/* ===========================================
    DUPLICATE FUNCTION
    =========================================== */
function duplicateCurrentPensum() {
  const p = getPensum();
  if (!p) return;

  const copy = JSON.parse(JSON.stringify(p));
  copy.id = uid();
  copy.nombre = `${p.nombre} (copia)`;

  // No necesitamos tocar periodoAcademico, ya que se copia

  copy.ciclos.forEach((c, i) => {
    c.id = uid();
    c.materias.forEach(m => m.id = uid());
  });

  copy.electivas.forEach(e => e.id = uid());

  state.pensums.push(copy);
  state.currentPensum = copy.id;
  saveState();
  refreshEditorView(); // Usar refreshEditorView en lugar de location.reload()
  // location.reload();
}