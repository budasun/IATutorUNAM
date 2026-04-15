import Dexie, { type Table } from 'dexie';

export interface GuiaLocal {
  id?: number;
  materia: string;
  tema: string;
  titulo: string;
  resumen: string;
  puntosClave: string[];
  ejemploPractico?: string;
  fechaGuardado: number;
}

export class IATutorDB extends Dexie {
  guias!: Table<GuiaLocal>;

  constructor() {
    super('IATutorDB');
    this.version(1).stores({
      guias: '++id, [materia+tema], materia, fechaGuardado'
    });
  }
}

export const db = new IATutorDB();