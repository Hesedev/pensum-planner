// planner/planner.js
import { state } from "../../core/state.js";

export const PERIOD_CONFIG = {
    'Semestral': {
        cycles: 2,
        default: 1,
        options: [
            { value: 1, label: '1 (Enero–Junio)' },
            { value: 2, label: '2 (Julio–Diciembre)' },
        ]
    },
    'Cuatrimestral': {
        cycles: 3,
        default: 1,
        options: [
            { value: 1, label: '1 (Enero–Abril)' },
            { value: 2, label: '2 (Mayo–Agosto)' },
            { value: 3, label: '3 (Septiembre–Diciembre)' },
        ]
    },
    'Trimestral': {
        cycles: 4, // Asumiendo 4 trimestres por año académico
        default: 1,
        options: [
            { value: 1, label: '1 (Enero–Marzo)' },
            { value: 2, label: '2 (Abril–Junio)' },
            { value: 3, label: '3 (Julio–Septiembre)' },
            { value: 4, label: '4 (Octubre–Diciembre)' },
        ]
    },
    'Indefinido': { // Usamos Cuatrimestral por defecto para compatibilidad
        cycles: 3,
        default: 1,
        options: [
            { value: 1, label: '1 (Enero–Abril)' },
            { value: 2, label: '2 (Mayo–Agosto)' },
            { value: 3, label: '3 (Septiembre–Diciembre)' },
        ]
    }
};

export function getPensumById(id) {
    return state.pensums.find(p => p.id === id);
}

export function normalizePensum(pensum) {
    const mandatoryMaterias = []; // <-- Cambiado
    const electivasMaterias = []; // <-- Nuevo

    pensum.ciclos.forEach((ciclo, index) => {
        ciclo.materias.forEach(m => {
            mandatoryMaterias.push({ // <-- Usar mandatoryMaterias
                codigo: m.codigo.trim(),
                nombre: m.nombre.trim(),
                creditos: m.creditos ?? 0,
                prerequisitos: m.prerequisitos ?? [],
                corequisitos: m.corequisitos ?? [],
                cuatrimestre: index + 1,  // ciclo real
                tipo: m.tipo ?? "obligatoria",
                reglas: m.reglas ?? {}
            });
        });
    });

    // Electivas también se exportan pero el algoritmo las ignora
    pensum.electivas.forEach(e => {
        electivasMaterias.push({ // <-- Usar electivasMaterias
            id: e.id, // Lo mantenemos por si acaso
            codigo: e.codigo.trim(),
            nombre: e.nombre.trim(),
            creditos: e.creditos ?? 0,
            prerequisitos: e.prerequisitos ?? [], // ¡Ojo! Las electivas tienen requisitos
            corequisitos: e.corequisitos ?? [],
            cuatrimestre: 999, // electivas no tienen ciclo real
            tipo: "electiva",
            reglas: e.reglas ?? {}
        });
    });

    // ¡Cambiamos el return!
    return { materias: mandatoryMaterias, electivas: electivasMaterias };
}
