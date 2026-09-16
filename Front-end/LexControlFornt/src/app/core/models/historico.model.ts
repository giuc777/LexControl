/* Modelo del módulo Histórico Legal.
   Contrato definido por HistoricoDtos.cs del backend. */

export interface HistoricoExpediente {
    id: number;
    noExpediente: string;
    cliente: string | null;
    rama: string;
    tipoProceso: string | null;
    juzgado: string | null;
    fechaIngreso: string;
    estado: string;
    estadoColor: string | null;
    abogado: string | null;
    fechaCierre: string | null;
}
