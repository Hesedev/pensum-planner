// editor/editor.js
import { state, saveState } from "../../core/state.js";
import { uid } from "../../core/utils.js";

/*****************************************************************
 * CONSTANTES DE PENSUM
 *****************************************************************/
export const ACADEMIC_PERIODS = {
    SEMESTRAL: 'Semestral',
    CUATRIMESTRAL: 'Cuatrimestral',
    TRIMESTRAL: 'Trimestral', // <-- NUEVO: Trismestral
    INDEFINIDO: 'Indefinido'
};
export const DEFAULT_PERIOD = ACADEMIC_PERIODS.INDEFINIDO;


/*****************************************************************
 *                 UTILIDADES INTERNAS
 *****************************************************************/

// Evita nombres duplicados de pensum
function isPensumNameTaken(name, excludeId = null) {
    return state.pensums.some(p => p.nombre === name && p.id !== excludeId);
}

// Reasigna números de ciclo después de eliminar o mover
function renumerarCiclos(pensum) {
    pensum.ciclos.forEach((c, index) => {
        c.numero = index + 1;
    });
}

/*****************************************************************
 *                     CREAR Y OBTENER PENSUM
 *****************************************************************/

export function createPensum(nombre = "") {
    if (!nombre.trim()) nombre = "Nuevo Pensum";

    if (isPensumNameTaken(nombre)) {
        let base = nombre;
        let i = 2;
        while (isPensumNameTaken(`${base} (${i})`)) i++;
        nombre = `${base} (${i})`;
    }

    const nuevo = {
        id: uid(),
        nombre,
        periodoAcademico: DEFAULT_PERIOD, // <-- NUEVO: Inicializar la propiedad
        ciclos: [],
        electivas: []
    };

    state.pensums.push(nuevo);
    state.currentPensum = nuevo.id;
    saveState();

    return nuevo;
}

export function renamePensum(id, nuevoNombre) {
    nuevoNombre = nuevoNombre.trim();
    if (!nuevoNombre) return false;

    if (isPensumNameTaken(nuevoNombre, id)) return false;

    const p = state.pensums.find(p => p.id === id);
    if (!p) return false;

    p.nombre = nuevoNombre;
    saveState();
    return true;
}

// NUEVO: Función para actualizar el tipo de período académico
export function editPensumPeriod(periodo) {
    const p = getPensum();
    if (!p) return false;

    // Usar el valor o el predeterminado si el valor no es válido/reconocido
    const validPeriod = Object.values(ACADEMIC_PERIODS).includes(periodo)
        ? periodo
        : DEFAULT_PERIOD;

    p.periodoAcademico = validPeriod;
    saveState();
    return true;
}

export function deletePensum(id) {
    state.pensums = state.pensums.filter(p => p.id !== id);

    if (state.currentPensum === id) {
        state.currentPensum = state.pensums[0]?.id || null;
    }

    saveState();
}

export function getPensum() {
    const pensum = state.pensums.find(p => p.id === state.currentPensum) || null;

    // RETROCOMPATIBILIDAD: Asegurar que el campo exista para pensums antiguos
    if (pensum && !pensum.periodoAcademico) {
        pensum.periodoAcademico = DEFAULT_PERIOD;
    }

    return pensum;
}

/*****************************************************************
 *                          CICLOS
 *****************************************************************/

export function addCycle() {
    // ... sin cambios ...
    const p = getPensum();
    if (!p) return;

    const numero = p.ciclos.length + 1;

    p.ciclos.push({
        id: uid(),
        numero,
        materias: []
    });

    saveState();
}

export function deleteCycle(cycleId) {
    // ... sin cambios ...
    const p = getPensum();
    if (!p) return;

    p.ciclos = p.ciclos.filter(c => c.id !== cycleId);

    renumerarCiclos(p);
    saveState();
}

/*****************************************************************
 *                         MATERIAS
 *****************************************************************/

export function addMateria(cycleId) {
    // ... sin cambios ...
    const p = getPensum();
    if (!p) return;

    const cycle = p.ciclos.find(c => c.id === cycleId);
    if (!cycle) return;

    cycle.materias.push({
        id: uid(),
        codigo: "",
        nombre: "",
        creditos: 0,
        prerequisitos: [],
        corequisitos: [],
        reglas: {},
        tipo: "obligatoria"
    });

    saveState();
}

export function deleteMateria(cycleId, materiaId) {
    // ... sin cambios ...
    const p = getPensum();
    if (!p) return;

    const cycle = p.ciclos.find(c => c.id === cycleId);
    if (!cycle) return;

    cycle.materias = cycle.materias.filter(m => m.id !== materiaId);

    saveState();
}

/*****************************************************************
 *                       EDITAR MATERIA
 *****************************************************************/

export function editMateriaField(cycleId, materiaId, field, value) {
    // ... sin cambios ...
    const p = getPensum();
    if (!p) return;

    for (const cycle of p.ciclos) {
        if (cycle.id === cycleId) {
            const materia = cycle.materias.find(m => m.id === materiaId);
            if (!materia) break;

            if (field === "creditos") {
                materia.creditos = Number(value) || 0;
            }
            else if (field === "prerequisitos" || field === "corequisitos") {
                materia[field] = value
                    .split(",")
                    .map(x => x.trim())
                    .filter(Boolean);
            }
            else if (field === "requires_all_until") {
                materia.reglas = materia.reglas || {};
                materia.reglas.requires_all_until =
                    value ? Number(value) : null;
            }
            else {
                materia[field] = value;
            }

            saveState();
            return;
        }
    }
}

/*****************************************************************
 *                         ELECTIVAS
 *****************************************************************/

export function addElectiva() {
    // ... sin cambios ...
    const p = getPensum();
    if (!p) return;

    p.electivas.push({
        id: uid(),
        codigo: "",
        nombre: "",
        creditos: 0,
        tipo: "electiva"
    });

    saveState();
}

export function deleteElectiva(id) {
    // ... sin cambios ...
    const p = getPensum();
    if (!p) return;

    p.electivas = p.electivas.filter(e => e.id !== id);
    saveState();
}

export function editElectivaField(id, field, value) {
    // ... sin cambios ...
    const p = getPensum();
    if (!p) return;

    const electiva = p.electivas.find(e => e.id === id);
    if (!electiva) return;

    if (field === "creditos") {
        electiva.creditos = Number(value) || 0;
    } else {
        electiva[field] = value;
    }

    saveState();
}

/*****************************************************************
 *                  IMPORTAR / EXPORTAR JSON
 *****************************************************************/

export function importPensum(jsonData) {
    try {
        const obj = JSON.parse(jsonData);

        if (!obj.nombre || !obj.ciclos || !Array.isArray(obj.ciclos)) {
            alert("JSON inválido o incompleto.");
            return false;
        }

        // Evita nombres duplicados
        let nombre = obj.nombre.trim();
        if (isPensumNameTaken(nombre)) {
            let base = nombre;
            let i = 2;
            while (isPensumNameTaken(`${base} (${i})`)) i++;
            nombre = `${base} (${i})`;
        }
        obj.nombre = nombre;

        // NUEVO: Asignar período académico con retrocompatibilidad
        obj.periodoAcademico = obj.periodoAcademico || DEFAULT_PERIOD; // <-- NUEVO

        // Regenerar IDs (importación limpia)
        obj.id = uid();
        obj.ciclos.forEach((c, i) => {
            c.id = uid();
            c.numero = c.numero || i + 1;

            c.materias.forEach(m => {
                m.id = uid();
                m.prerequisitos ||= [];
                m.corequisitos ||= [];
                m.reglas ||= {};
            });
        });

        obj.electivas?.forEach(e => {
            e.id = uid();
        });

        state.pensums.push(obj);
        state.currentPensum = obj.id;

        saveState();
        return true;

    } catch (e) {
        console.error(e);
        alert("Ocurrió un error al leer el JSON.");
        return false;
    }
}

export function exportPensum() {
    // ... sin cambios ...
    const p = getPensum();
    if (!p) return;

    // Exportación limpia
    const json = JSON.stringify(p, null, 2);

    const blob = new Blob([json], { type: "application/json" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${p.nombre || "pensum"}.json`;
    a.click();
}