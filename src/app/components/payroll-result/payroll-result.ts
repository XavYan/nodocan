import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PayrollResult } from '../../models/payroll.model';

@Component({
  selector: 'app-payroll-result',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section *ngIf="result" id="resultado" class="nd-result" aria-label="Resultado de la simulación">
      <div class="card border-0 nd-result-shell">
        <div class="nd-result-heading">
          <p class="nd-eyebrow">Tu simulación</p><h2 class="mb-0">Resumen de la nómina</h2>
        </div>
        <div class="card-body nd-result-body">
          <div class="d-flex justify-content-center mb-3">
            <button type="button" class="btn btn-outline-primary" (click)="downloadPdf()" [disabled]="generatingPdf()" [attr.aria-busy]="generatingPdf()">
              <i class="bi bi-file-earmark-pdf me-2" aria-hidden="true"></i>{{ generatingPdf() ? 'Generando PDF…' : 'Descargar PDF' }}
            </button>
          </div>
          <div *ngIf="pdfError()" class="alert alert-danger" role="alert">{{ pdfError() }}</div>
          <div class="row text-center mb-4 nd-net-summary">
            <div class="col-12">
              <span class="text-muted text-uppercase small fw-bold">Neto estimado del mes</span>
              <h2 class="nd-net-amount mb-0">{{ result.salarioNeto | currency:'EUR' }}</h2>
              <p class="nd-net-note">Nómina ordinaria, sin sumar pagas extras.</p>
              <div *ngFor="let extra of result.pagasExtra" class="nd-extra-summary">
                <span class="fw-semibold">Extra de {{ extra.nombre }} {{ extra.anio }} ({{ extra.porcentajeDevengo | number:'1.0-2' }}%):</span>
                <span class="ms-2 fw-medium text-primary">{{ extra.pagaExtraNeta | currency:'EUR' }}</span>
              </div>
            </div>
          </div>

          <!-- Resumen de Opciones -->
          <div class="card border-0 bg-white shadow-sm mb-4">
            <div class="card-body p-3">
              <h6 class="text-primary small fw-bold text-uppercase mb-3 border-bottom pb-2">Información de la Nómina</h6>
              <div class="row g-2 small">
                <div class="col-md-6">
                  <span class="text-muted text-uppercase x-small">Cuerpo:</span> &nbsp;<span class="fw-medium">{{ result.input.cuerpo }}</span>
                </div>
                <div class="col-md-6">
                  <span class="text-muted text-uppercase x-small">Isla:</span> &nbsp;<span class="fw-medium">{{ result.input.isla }}</span>
                </div>
                <div class="col-md-6">
                  <span class="text-muted text-uppercase x-small">Periodo:</span> &nbsp;<span class="fw-medium">{{ meses[result.input.mes - 1] }} / {{ result.input.anio }}</span>
                </div>
                <div class="col-md-6">
                  <span class="text-muted text-uppercase x-small">Trabajado:</span> &nbsp;<span class="fw-medium">{{ result.input.diasTrabajados }} días / {{ result.input.horasSemanales }} horas lectivas semanales</span>
                </div>
                <div class="col-md-6" *ngIf="result.input.cargoDirectivo">
                  <span class="text-muted text-uppercase x-small">Cargo:</span> &nbsp;<span class="fw-medium">{{ result.input.cargoDirectivo }} (Tipo {{ result.input.tipoCentro }}) — {{ result.input.familiaCentro }}</span>
                </div>
                <div class="col-md-6" *ngIf="result.input.complementos.length > 0">
                  <span class="text-muted text-uppercase x-small d-block mb-1">Otros cargos:</span>
                  <ul class="list-unstyled ps-2 mb-0">
                    <li *ngFor="let c of result.input.complementos" class="fw-medium text-dark x-small">
                      <i class="bi bi-chevron-right me-1 x-small"></i>{{ c }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <ng-container *ngTemplateOutlet="nomina; context: { $implicit: result }"></ng-container>
          <section *ngIf="result.mesCompleto as completo" class="mt-4 nd-result-section" aria-label="Mes completo">
            <h4>Mes completo (30 días retribuidos)</h4>
            <p class="small text-muted">Misma jornada de {{ result.input.horasSemanales }} horas lectivas semanales. Nómina ordinaria, sin pagas extras. Las unidades variables y los días de compatibilidad se proyectan al ritmo del mes indicado.</p>
            <p class="h3 text-success">Neto: {{ completo.salarioNeto | currency:'EUR' }}</p>
            <ng-container *ngTemplateOutlet="nomina; context: { $implicit: completo }"></ng-container>
          </section>
          <ng-template #nomina let-payroll>
          <div class="list-group list-group-flush rounded-3 shadow-sm border mb-4">
            <div class="list-group-item bg-light-subtle py-2 px-3">
              <span class="text-muted small fw-bold text-uppercase">Desglose de Devengos</span>
            </div>
            <div class="list-group-item d-flex justify-content-between align-items-center py-2 px-3 small">
              <span>Sueldo Base</span>
              <span>{{ payroll.detalleDevengos.sueldoBase | currency:'EUR' }}</span>
            </div>
            <div *ngIf="payroll.detalleDevengos.trienios > 0" class="list-group-item d-flex justify-content-between align-items-center py-2 px-3 small">
              <span>Trienios ({{ payroll.input.trienios }})</span>
              <span>{{ payroll.detalleDevengos.trienios | currency:'EUR' }}</span>
            </div>
            <div *ngIf="payroll.detalleDevengos.sexenios > 0" class="list-group-item d-flex justify-content-between align-items-center py-2 px-3 small">
              <span>Sexenios ({{ payroll.input.sexenios }})</span>
              <span>{{ payroll.detalleDevengos.sexenios | currency:'EUR' }}</span>
            </div>
            <div class="list-group-item d-flex justify-content-between align-items-center py-2 px-3 small">
              <span>C. Destino</span>
              <span>{{ payroll.detalleDevengos.complementoDestino | currency:'EUR' }}</span>
            </div>
            <div class="list-group-item d-flex justify-content-between align-items-center py-2 px-3 small">
              <span>C. Específico</span>
              <span>{{ payroll.detalleDevengos.complementoEspecifico | currency:'EUR' }}</span>
            </div>
            <div class="list-group-item d-flex justify-content-between align-items-center py-2 px-3 small">
              <span>Residencia</span>
              <span>{{ payroll.detalleDevengos.residencia | currency:'EUR' }}</span>
            </div>
            <div *ngIf="payroll.detalleDevengos.cargoDirectivo > 0" class="list-group-item d-flex justify-content-between align-items-center py-2 px-3 small">
              <span>Cargo Directivo</span>
              <span>{{ payroll.detalleDevengos.cargoDirectivo | currency:'EUR' }}</span>
            </div>
            <div *ngIf="payroll.detalleDevengos.otrosCargos > 0">
              <div class="list-group-item d-flex justify-content-between align-items-center py-2 px-3 small bg-light-subtle">
                <span class="fw-medium text-muted">Otros Complementos (Total)</span>
                <span class="fw-medium">{{ payroll.detalleDevengos.otrosCargos | currency:'EUR' }}</span>
              </div>
              <div *ngFor="let item of payroll.detalleDevengos.otrosCargosList" class="list-group-item d-flex justify-content-between align-items-center py-1 px-4 border-0 small opacity-75">
                <span class="fst-italic">- {{ item.nombre }}</span>
                <span>{{ item.importe | currency:'EUR' }}</span>
              </div>
            </div>
            <div *ngIf="payroll.detalleDevengos.reduccionCompatibilidad > 0" class="list-group-item d-flex justify-content-between align-items-center py-2 px-3 small">
              <span class="text-danger fw-medium">Reducción por Compatibilidad</span>
              <span class="text-danger">-{{ payroll.detalleDevengos.reduccionCompatibilidad | currency:'EUR' }}</span>
            </div>
            <div class="list-group-item d-flex justify-content-between align-items-center bg-success-subtle p-3">
              <span class="fw-bold">Total Devengado (Bruto)</span>
              <span class="fw-bold text-success">{{ payroll.totalDevengado | currency:'EUR' }}</span>
            </div>
          </div>

          <div class="list-group list-group-flush rounded-3 shadow-sm border">
            <div class="list-group-item bg-light-subtle py-2 px-3">
              <span class="text-muted small fw-bold text-uppercase">Deducciones</span>
            </div>
            <!-- Bases de Cotización -->
            <div class="list-group-item bg-white py-2 px-3 border-bottom-0">
              <div class="row g-2 x-small text-muted fst-italic">
                <div class="col-6">Base IRPF: {{ payroll.detalleDeducciones.baseIRPF | currency:'EUR' }}</div>
                <div class="col-6 text-end">Base CC: {{ payroll.detalleDeducciones.basesCotizacion.contingenciasComunes | currency:'EUR' }}</div>
                <div class="col-12">Base CP/Desempleo/FP: {{ payroll.detalleDeducciones.basesCotizacion.contingenciasProfesionales | currency:'EUR' }}</div>
              </div>
            </div>
            
            <div class="list-group-item d-flex justify-content-between align-items-center py-2 px-3 small">
              <span>Retención IRPF ({{ payroll.input.irpf }}%)</span>
              <span class="text-danger">-{{ payroll.detalleDeducciones.irpf | currency:'EUR' }}</span>
            </div>
            <div class="list-group-item p-0 border-0">
              <div class="d-flex justify-content-between align-items-center py-2 px-3 small bg-light-subtle">
                <span class="fw-medium text-muted">Cotizaciones y cuotas</span>
                <span class="fw-medium text-danger">-{{ payroll.detalleDeducciones.seguridadSocial | currency:'EUR' }}</span>
              </div>
              <div *ngIf="payroll.input.regimen !== 'pasivos'" class="px-4 py-1 small opacity-75">
                <div class="d-flex justify-content-between mb-1">
                  <span class="fst-italic">- Contingencias Comunes + MEI (4,85%)</span>
                  <span>{{ payroll.detalleDeducciones.seguridadSocialDetalle.contingenciasComunes | currency:'EUR' }}</span>
                </div>
                <div class="d-flex justify-content-between mb-1">
                  <span class="fst-italic">- Desempleo (1,55%)</span>
                  <span>{{ payroll.detalleDeducciones.seguridadSocialDetalle.desempleo | currency:'EUR' }}</span>
                </div>
                <div class="d-flex justify-content-between">
                  <span class="fst-italic">- Formación Prof. (0,10%)</span>
                  <span>{{ payroll.detalleDeducciones.seguridadSocialDetalle.formacionProfesional | currency:'EUR' }}</span>
                </div>
              </div>
            </div>
            <div *ngIf="payroll.detalleDeducciones.seguridadSocialDetalle.solidaridad > 0" class="list-group-item d-flex justify-content-between small">
              <span>Cotización de solidaridad</span><span>{{ payroll.detalleDeducciones.seguridadSocialDetalle.solidaridad | currency:'EUR' }}</span>
            </div>
            <div *ngIf="payroll.input.regimen === 'pasivos'" class="list-group-item small">
              <div class="d-flex justify-content-between"><span>MUFACE</span><span>{{ payroll.detalleDeducciones.seguridadSocialDetalle.muface | currency:'EUR' }}</span></div>
              <div class="d-flex justify-content-between"><span>Clases Pasivas</span><span>{{ payroll.detalleDeducciones.seguridadSocialDetalle.pasivos | currency:'EUR' }}</span></div>
            </div>
            <div class="list-group-item d-flex justify-content-between align-items-center bg-danger-subtle p-3">
              <span class="fw-bold">Total Deducciones</span>
              <span class="fw-bold text-danger">{{ payroll.totalDeducciones | currency:'EUR' }}</span>
            </div>
          </div>

          </ng-template>

          <div class="mt-4 small text-muted">
            Contrato: {{ formatDate(result.input.fechaInicioContrato) }} - {{ formatDate(result.input.fechaFinContrato) }}.
            Cada mes natural completo aporta 1/6 y cada día de un mes incompleto 1/180 (máximo 100%).
            Junio: 1 de enero a 30 de junio. Diciembre: 1 de julio a 31 de diciembre. La parte del último semestre incompleto se muestra también en la liquidación, sin sumarla dos veces.
          </div>
          <!-- Información Paga Extra -->
          <div *ngFor="let extra of result.pagasExtra" class="mt-4 card border-0 bg-white shadow-sm overflow-hidden">
            <div class="card-header bg-primary text-white py-2 px-3 border-0">
              <span class="fw-semibold">Paga Extra de {{ extra.nombre }} {{ extra.anio }} (Estimada)</span>
            </div>
            <div class="card-body p-0">
              <div class="p-3 bg-light border-bottom small">
                <strong>Devengo: {{ extra.porcentajeDevengo | number:'1.0-2' }}%</strong>
                <div>Periodo: {{ formatDate(extra.periodoInicio) }} - {{ formatDate(extra.periodoFin) }}</div>
                <div *ngIf="extra.seLiquidaAlCese" class="fw-bold">Parte pendiente incluida en la liquidación al cese.</div>
                <div>{{ extra.diasEquivalentes }} / 180 días equivalentes (meses completos de 30 días).</div>
              </div>
              <ul class="list-group list-group-flush">
                <li class="list-group-item bg-light py-1 px-3">
                  <span class="x-small text-muted fw-bold text-uppercase">Desglose del Bruto (Extra)</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center py-1 px-4 border-0 small opacity-75">
                  <span class="fst-italic">Sueldo Base Extra</span>
                  <span>{{ extra.pagaExtraDetalle.sueldoBase | currency:'EUR' }}</span>
                </li>
                <li *ngIf="extra.pagaExtraDetalle.trienios > 0" class="list-group-item d-flex justify-content-between align-items-center py-1 px-4 border-0 small opacity-75">
                  <span class="fst-italic">Trienios Extra</span>
                  <span>{{ extra.pagaExtraDetalle.trienios | currency:'EUR' }}</span>
                </li>
                <li *ngIf="extra.pagaExtraDetalle.sexenios > 0" class="list-group-item d-flex justify-content-between align-items-center py-1 px-4 border-0 small opacity-75">
                  <span class="fst-italic">Sexenios Extra</span>
                  <span>{{ extra.pagaExtraDetalle.sexenios | currency:'EUR' }}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center py-1 px-4 border-0 small opacity-75">
                  <span class="fst-italic">C. Destino Extra</span>
                  <span>{{ extra.pagaExtraDetalle.destino | currency:'EUR' }}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center py-1 px-4 border-0 small opacity-75">
                  <span class="fst-italic">C. Específico Extra</span>
                  <span>{{ extra.pagaExtraDetalle.especifico | currency:'EUR' }}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center py-2 px-3 small bg-white border-top">
                  <span class="fw-bold">Total Bruto Extra</span>
                  <span class="fw-bold">{{ extra.pagaExtraBruta | currency:'EUR' }}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center py-2 px-3 small">
                  <span>Deducción IRPF ({{ result.input.irpf }}%)</span>
                  <span class="text-danger">-{{ extra.pagaExtraIrpf | currency:'EUR' }}</span>
                </li>
                <li *ngIf="extra.pagaExtraCuotas > 0" class="list-group-item d-flex justify-content-between small">
                  <span>Cuotas adicionales MUFACE y Clases Pasivas</span><span>-{{ extra.pagaExtraCuotas | currency:'EUR' }}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center py-3 px-3 bg-primary-subtle">
                  <span class="fw-bold">Importe Neto Final</span>
                  <span class="h5 mb-0 text-primary fw-bold">{{ extra.pagaExtraNeta | currency:'EUR' }}</span>
                </li>
              </ul>
              <div class="p-2 bg-light border-top">
                <p class="x-small text-muted mb-0 fst-italic">
                  <i class="bi bi-info-circle me-1"></i>
                  El devengo se calcula por las fechas del contrato y se aplica además la jornada indicada. Incluye sueldo, trienios, destino, específico general y el 78% del sexenio. La guía no desglosa las extras de cargos y otros complementos: no se estiman aquí.
                </p>
                <p class="x-small text-muted mb-0 fst-italic mt-1">
                  <i class="bi bi-info-circle me-1"></i>
                  En Régimen General las cotizaciones de las extras se prorratean cada mes. En Clases Pasivas se descuentan cuotas adicionales en junio y diciembre. La extra se muestra separada del neto ordinario.
                </p>
              </div>
            </div>
          </div>

          <section class="mt-4 card border-0 bg-white shadow-sm" aria-label="Liquidación">
            <div class="card-header"><h4 class="mb-0">Liquidación al finalizar el contrato</h4></div>
            <div class="card-body">
              <p>Fecha de cese: {{ formatDate(result.liquidacion.fecha) }} · Importes estimados</p>
              <p class="small">Vacaciones: 2,5 días por mes completo trabajado; los meses incompletos aportan su proporción de días/30. Se descuenta el agosto cubierto por el contrato (máximo 30 días), sin consumir vacaciones de cursos posteriores.</p>
              <div class="table-responsive">
                <table class="table table-sm">
                  <thead><tr><th scope="col">Curso</th><th scope="col">Días generados</th><th scope="col">Disfrutados en agosto</th><th scope="col">Pendientes</th></tr></thead>
                  <tbody><tr *ngFor="let curso of result.liquidacion.devengoVacaciones.porCurso"><th scope="row">{{ curso.curso }}</th><td>{{ curso.diasGenerados | number:'1.0-2' }}</td><td>{{ curso.diasDisfrutados | number:'1.0-2' }}</td><td>{{ curso.diasPendientes | number:'1.0-2' }}</td></tr></tbody>
                  <tfoot><tr class="fw-bold"><th scope="row">Total días</th><td>{{ result.liquidacion.devengoVacaciones.diasGenerados | number:'1.0-2' }}</td><td>{{ result.liquidacion.devengoVacaciones.diasDisfrutados | number:'1.0-2' }}</td><td>{{ result.liquidacion.diasVacaciones | number:'1.0-2' }}</td></tr></tfoot>
                </table>
              </div>
              <div class="table-responsive">
                <table class="table table-sm align-middle">
                  <thead><tr><th scope="col">Concepto</th><th scope="col">Bruto</th><th scope="col">IRPF</th><th scope="col">Cotizaciones y cuotas</th><th scope="col">Neto</th></tr></thead>
                  <tbody>
                    <tr><th scope="row">Extra pendiente {{ result.liquidacion.extraPendiente?.nombre }} {{ result.liquidacion.extraPendiente?.anio }}</th>
                      <td>{{ (result.liquidacion.extraPendiente?.pagaExtraBruta ?? 0) | currency:'EUR' }}</td>
                      <td>{{ (result.liquidacion.extraPendiente?.pagaExtraIrpf ?? 0) | currency:'EUR' }}</td>
                      <td>{{ (result.liquidacion.extraPendiente?.pagaExtraCuotas ?? 0) | currency:'EUR' }}</td>
                      <td>{{ (result.liquidacion.extraPendiente?.pagaExtraNeta ?? 0) | currency:'EUR' }}</td></tr>
                    <tr><th scope="row">Vacaciones pendientes ({{ result.liquidacion.diasVacaciones | number:'1.0-2' }} días)</th>
                      <td>{{ result.liquidacion.vacaciones.bruto | currency:'EUR' }}</td><td>{{ result.liquidacion.vacaciones.irpf | currency:'EUR' }}</td><td>{{ result.liquidacion.vacaciones.seguridadSocial | currency:'EUR' }}</td><td>{{ result.liquidacion.vacaciones.neto | currency:'EUR' }}</td></tr>
                    <tr class="table-primary fw-bold"><th scope="row">Total liquidación adicional</th><td>{{ result.liquidacion.total.bruto | currency:'EUR' }}</td><td>{{ result.liquidacion.total.irpf | currency:'EUR' }}</td><td>{{ result.liquidacion.total.seguridadSocial | currency:'EUR' }}</td><td>{{ result.liquidacion.total.neto | currency:'EUR' }}</td></tr>
                  </tbody>
                </table>
              </div>
              <p class="small text-muted">La extra pendiente ya figura en las pagas del contrato. Se presupone abonada cada extra cuyo semestre haya terminado. La liquidación adicional excluye la última nómina ordinaria y no presupone indemnización por cese.</p>
              <p class="small text-muted">Vacaciones: estimación por días/30 con los conceptos fijos, sin kilómetros ni horas complementarias. Sus cotizaciones se estiman por separado; la regularización de bases y topes con otros periodos en alta puede modificar el importe.</p>
              <details>
                <summary class="fw-bold mb-3">Última nómina ordinaria: {{ meses[result.liquidacion.ultimaNomina.input.mes - 1] }} {{ result.liquidacion.ultimaNomina.input.anio }} ({{ result.liquidacion.ultimaNomina.input.diasTrabajados }} días) — neto {{ result.liquidacion.ultimaNomina.salarioNeto | currency:'EUR' }}</summary>
                <ng-container *ngTemplateOutlet="nomina; context: { $implicit: result.liquidacion.ultimaNomina }"></ng-container>
              </details>
              <p class="fw-bold mt-3 mb-0">Neto última nómina + liquidación adicional: {{ result.liquidacion.ultimaNomina.salarioNeto + result.liquidacion.total.neto | currency:'EUR' }}</p>
            </div>
          </section>
          <section class="mt-4 nd-result-section" aria-label="Totales anuales del contrato">
            <h4>Totales por año del contrato</h4>
            <p class="small text-muted">Proyección con tablas, cotizaciones, IRPF, antigüedad y jornada constantes de 2026. Mes completo = 30 días; meses parciales según las fechas de contrato (máximo 30). Kilómetros, horas complementarias y compatibilidad se repiten al ritmo diario del mes indicado. Las vacaciones pendientes se atribuyen al año de cese.</p>
            <div class="table-responsive">
              <table class="table table-striped align-middle">
                <thead><tr><th scope="col">Año</th><th scope="col">Bruto nóminas</th><th scope="col">Bruto extras</th><th scope="col">Bruto vacaciones</th><th scope="col">Total bruto</th><th scope="col">Retención IRPF</th><th scope="col">Seguridad Social / cuotas</th><th scope="col">Total neto</th></tr></thead>
                <tbody><tr *ngFor="let annual of result.totalesAnuales">
                  <th scope="row">{{ annual.anio }}</th><td>{{ annual.brutoNominas | currency:'EUR' }}</td><td>{{ annual.brutoExtras | currency:'EUR' }}</td><td>{{ annual.brutoVacaciones | currency:'EUR' }}</td><td class="fw-bold">{{ annual.bruto | currency:'EUR' }}</td><td>{{ annual.irpf | currency:'EUR' }}</td><td>{{ annual.seguridadSocial | currency:'EUR' }}</td><td class="fw-bold">{{ annual.neto | currency:'EUR' }}</td>
                </tr></tbody>
              </table>
            </div>
            <p class="small text-muted">Incluye cada nómina, cada extra y las vacaciones pendientes una sola vez. La comparación del mes completo y el resumen de liquidación no se vuelven a sumar.</p>
          </section>

          <div class="mt-4 p-3 bg-white rounded-3 border border-info-subtle">
            <p class="mb-0 small text-muted">
              <i class="bi bi-info-circle-fill text-info me-2"></i>
              Este es un cálculo estimado basado en los datos introducidos. Tablas de Canarias 2026. Cambios de jornada, nombramiento o complementos durante el semestre requieren un cálculo individual. Las bases mínimas a jornada parcial y situaciones especiales pueden requerir ajuste según los días y horas en alta.
            </p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `:host { display: block; }`

})
export class PayrollResultComponent {
  @Input() result?: PayrollResult;
  generatingPdf = signal(false);
  pdfError = signal('');

  async downloadPdf() {
    const snapshot = this.result;
    if (!snapshot || this.generatingPdf()) return;
    this.generatingPdf.set(true);
    this.pdfError.set('');
    try {
      const [{ jsPDF }, { buildPayrollPdf, payrollPdfFilename }] = await Promise.all([import('jspdf'), import('../../services/payroll-pdf')]);
      const doc = buildPayrollPdf(new jsPDF({ unit: 'mm', format: 'a4', compress: true }), snapshot);
      await doc.save(payrollPdfFilename(snapshot), { returnPromise: true });
    } catch {
      this.pdfError.set('No se ha podido generar el PDF. Inténtalo de nuevo.');
    } finally {
      this.generatingPdf.set(false);
    }
  }

  formatDate(value: string): string { return value.split('-').reverse().join('/'); }

  meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
}
