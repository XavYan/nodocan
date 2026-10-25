import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PayrollInput } from '../../models/payroll.model';
import salariosData from '../../../assets/data/salarios.json';
import complementosData from '../../../assets/data/complementos.json';

interface SalaryData {
  cuerpo: string;
  sueldoBase: number;
  trienios: {
    base: number;
    suplementoNoCapit: number;
  };
  destino: number;
  especifico: number;
  residencia: {
    islaCapit: number;
    islaNoCapit: number;
  };
  sexenios: {
    [key: string]: number;
  };
  pagaExtra: {
    base: number;
    trienios: number;
    destino: number;
    especifico: number;
    sexenios: {
      [key: string]: number;
    };
  };
}

@Component({
  selector: 'app-payroll-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="payrollForm" (ngSubmit)="onSubmit()" class="row g-4 nd-payroll-form">
      <div class="col-12 nd-source-note">
        Tablas STEC-IC de febrero de 2026. Importes brutos contrastados con la guía.
        <a href="https://www.stec.es/stec/archivos_subidos/gal_descargas/2/_214.pdf" target="_blank" rel="noopener">Consultar PDF</a>.
        Las proyecciones de todo el contrato mantienen los importes y tipos de 2026; no incluyen subidas futuras ni atrasos.
      </div>
      <div class="col-12 nd-form-section"><h2><span aria-hidden="true">01</span>Datos de tu nómina</h2><p>Selecciona tu cuerpo, isla y las condiciones del mes que quieres calcular.</p></div>
      <!-- Cuerpo e Isla -->
      <div class="col-md-6">
        <label for="cuerpo" class="form-label fw-bold">Cuerpo</label>
        <select id="cuerpo" formControlName="cuerpo" (change)="onCuerpoChange()" class="form-select shadow-sm">
          <option value="" disabled>Seleccione un cuerpo...</option>
          <option *ngFor="let s of salarios" [value]="s.cuerpo">{{ s.cuerpo }}</option>
        </select>
      </div>

      <div class="col-md-6">
        <label for="isla" class="form-label fw-bold">Isla</label>
        <select id="isla" formControlName="isla" class="form-select shadow-sm">
          <option value="" disabled>Seleccione una isla...</option>
          <optgroup label="Islas Capitalinas">
            <option value="Gran Canaria">Gran Canaria</option>
            <option value="Tenerife">Tenerife</option>
          </optgroup>
          <optgroup label="Otras Islas">
            <option value="La Palma">La Palma</option>
            <option value="La Gomera">La Gomera</option>
            <option value="El Hierro">El Hierro</option>
            <option value="Lanzarote">Lanzarote</option>
            <option value="Fuerteventura">Fuerteventura</option>
          </optgroup>
        </select>
      </div>

      <!-- Tabla de información salarial -->
      <div class="col-12" *ngIf="selectedSalary()">
        <div class="mt-2 animate__animated animate__fadeIn">
          <div class="table-responsive rounded-3 border">
            <table class="table table-sm table-hover bg-white mb-0">
              <thead class="table-primary border-0">
                <tr class="small text-center">
                  <th class="py-2">Sueldo Base</th>
                  <th class="py-2">Trienios</th>
                  <th class="py-2">C. Destino</th>
                  <th class="py-2">C. Específico</th>
                  <th class="py-2" [class.bg-warning]="isCapitalinaSelected()">Residencia (Cap.)</th>
                  <th class="py-2" [class.bg-warning]="isNoCapitalinaSelected()">Residencia (No Cap.)</th>
                </tr>
              </thead>
              <tbody>
                <tr class="text-center fw-medium py-3">
                  <td class="py-3">{{ selectedSalary()?.sueldoBase | currency:'EUR' }}</td>
                  <td class="py-3">
                    {{ selectedSalary()?.trienios?.base | currency:'EUR' }}
                    <span *ngIf="isNoCapitalinaSelected()" class="text-success small d-block">
                      +{{ selectedSalary()?.trienios?.suplementoNoCapit | currency:'EUR' }} (Supl.)
                    </span>
                  </td>
                  <td class="py-3">{{ selectedSalary()?.destino | currency:'EUR' }}</td>
                  <td class="py-3">{{ selectedSalary()?.especifico | currency:'EUR' }}</td>
                  <td class="py-3" [class.table-warning]="isCapitalinaSelected()">
                    {{ selectedSalary()?.residencia?.islaCapit | currency:'EUR' }}
                  </td>
                  <td class="py-3" [class.table-warning]="isNoCapitalinaSelected()">
                    {{ selectedSalary()?.residencia?.islaNoCapit | currency:'EUR' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Fecha de la Nómina -->
      <div class="col-md-6">
        <label for="mes" class="form-label fw-bold">Mes</label>
        <select id="mes" formControlName="mes" class="form-select shadow-sm">
          <option *ngFor="let m of meses; let i = index" [ngValue]="i + 1">{{ m }}</option>
        </select>
      </div>

      <div class="col-md-6">
        <label for="anio" class="form-label fw-bold">Año</label>
        <input type="number" id="anio" formControlName="anio" class="form-control shadow-sm" min="2026" max="2026" readonly>
      </div>

      <!-- Parámetros de Trabajo -->
      <div class="col-md-6">
        <label for="diasTrabajados" class="form-label fw-bold">Días trabajados (máximo 30 días)</label>
        <input type="number" id="diasTrabajados" formControlName="diasTrabajados" class="form-control shadow-sm" placeholder="Ej: 30">
        <div class="form-check mt-2">
          <input id="mostrarMesCompleto" type="checkbox" formControlName="mostrarMesCompleto" class="form-check-input">
          <label for="mostrarMesCompleto" class="form-check-label">Mostrar también cuánto cobraría en un mes completo</label>
        </div>
      </div>

      <div class="col-md-6">
        <label for="horasSemanales" class="form-label fw-bold">Horas lectivas semanales (máximo 18 horas)</label>
        <input type="number" id="horasSemanales" formControlName="horasSemanales" class="form-control shadow-sm" min="1" max="18" placeholder="Ej: 18">
      </div>

      <div class="col-md-6">
        <label for="trienios" class="form-label fw-bold">Trienios</label>
        <input type="number" id="trienios" formControlName="trienios" class="form-control shadow-sm" placeholder="Ej: 2">
      </div>

      <div class="col-md-6">
        <label for="sexenios" class="form-label fw-bold">Sexenios (Máximo 5)</label>
        <input type="number" id="sexenios" formControlName="sexenios" class="form-control shadow-sm" placeholder="Ej: 1">
      </div>

      <div class="col-12 nd-form-section"><h2><span aria-hidden="true">02</span>Contrato y cotización</h2><p>Estas fechas permiten calcular las pagas extras y las vacaciones de todo el contrato.</p></div>
      <div class="col-md-6">
        <label for="fechaInicioContrato" class="form-label fw-bold">Fecha de inicio del contrato</label>
        <input id="fechaInicioContrato" type="date" formControlName="fechaInicioContrato" class="form-control" required>
      </div>
      <div class="col-md-6">
        <label for="fechaFinContrato" class="form-label fw-bold">Fecha de fin del contrato (incluida)</label>
        <input id="fechaFinContrato" type="date" formControlName="fechaFinContrato" [min]="payrollForm.get('fechaInicioContrato')?.value" class="form-control" required>
      </div>
      <div class="col-12 small text-muted">
        Estas fechas calculan todas las extras del contrato: junio (1 de enero a 30 de junio) y diciembre (1 de julio a 31 de diciembre).
        Se estima todo el contrato indicado, incluidos los días futuros. La jornada indicada se aplica a todas las extras.
        Para la nómina ordinaria, indica los días retribuidos del mes en su campo correspondiente.
        Las vacaciones se calculan automáticamente: 2,5 días por mes completo (proporción en meses incompletos), menos las vacaciones disfrutadas en agosto dentro del contrato, por curso de septiembre a agosto.
      </div>
      <div class="col-md-6">
        <label for="regimen" class="form-label fw-bold">Régimen de cotización</label>
        <select id="regimen" formControlName="regimen" class="form-select">
          <option value="general">Régimen General — interinos (con desempleo y FP)</option>
          <option value="pasivos">MUFACE y Clases Pasivas</option>
        </select>
        <div class="form-text">El régimen mixto MUFACE + pensiones del Régimen General no está incluido.</div>
      </div>
      <!-- Compatibilidad Privada -->
      <div class="col-12">
        <div class="form-check form-switch p-3 bg-light rounded-3 border">
          <input class="form-check-input ms-0 me-3" type="checkbox" formControlName="compatibilidadPrivada" id="compatibilidadCheck">
          <label class="form-check-label fw-bold" for="compatibilidadCheck">
            Reducción de C. Específico por compatibilidad con actividad privada
          </label>
          <div class="mt-3 animate__animated animate__fadeIn" *ngIf="payrollForm.get('compatibilidadPrivada')?.value">
            <label for="importeReduccionCompatibilidad" class="form-label small fw-bold">Reducción mensual a jornada completa según tu resolución (€)</label>
            <input type="number" id="importeReduccionCompatibilidad" formControlName="importeReduccionCompatibilidad" min="0" class="form-control mb-2">
            <div class="form-text mb-2">Introduce el importe autorizado. El umbral legal del 30% excluye la antigüedad; no determina por sí solo tu reducción individual.</div>
            <label for="diasCompatibilidad" class="form-label small fw-bold">Número de días de compatibilización (en el mes)</label>
            <input type="number" id="diasCompatibilidad" formControlName="diasCompatibilidad" class="form-control shadow-sm" placeholder="Ej: 30">
            <div class="form-text text-info x-small mt-1">
              <i class="bi bi-info-circle me-1"></i> Se aplicará la reducción proporcional al número de días indicados.
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 nd-form-section"><h2><span aria-hidden="true">03</span>Cargos y complementos</h2><p>Añade los cargos y conceptos reconocidos en tu nómina.</p></div>
      <!-- Cargos Directivos (Nuevo Bloque) -->
      <div class="col-12">
        <div class="card border-0 bg-light shadow-sm">
          <div class="card-body row g-3">
            <div class="col-12">
              <label for="familiaCentro" class="form-label fw-bold">Enseñanzas del centro (equipo directivo)</label>
              <select id="familiaCentro" formControlName="familiaCentro" (change)="onFamiliaChange()" class="form-select">
                <option *ngFor="let f of familiasCentro" [value]="f">{{ f }}</option>
              </select>
              <div class="form-text">Se elige por el centro, independientemente del cuerpo docente.</div>
            </div>
            <div class="col-md-6">
              <label for="cargoDirectivo" class="form-label fw-bold">Cargo Directivo</label>
              <select id="cargoDirectivo" formControlName="cargoDirectivo" (change)="onCargoChange()" class="form-select border-primary-subtle">
                <option value="">Ninguno / Sin cargo directivo</option>
                <option *ngFor="let c of cargosDirectivos" [value]="c" [disabled]="!cargoDisponible(c)">{{ c }}{{ !cargoDisponible(c) ? ' (no disponible en este tipo)' : '' }}</option>
              </select>
            </div>
            <div class="col-md-6">
              <label for="tipoCentro" class="form-label fw-bold">Tipo de Centro</label>
              <select id="tipoCentro" formControlName="tipoCentro" (change)="onTipoChange()" class="form-select border-primary-subtle">
                <option value="" disabled>Seleccione...</option>
                <option *ngFor="let t of tiposCentro" [value]="t">Tipo {{ t }} — {{ descripcionTipo(t) }}</option>
              </select>
            </div>
            
            <div class="col-12 small text-muted">{{ descripcionTipo(payrollForm.get('tipoCentro')?.value) }}. Las unidades son grupos escolares.
              Los cargos marcados como no disponibles no tienen importe en la guía para ese tipo de centro.
            </div>
            <!-- Tabla Informativa Cargo Directivo -->
            <div class="col-12 mt-2" *ngIf="selectedCargoAmount() !== null">
              <div class="animate__animated animate__fadeIn">
                <div class="table-responsive rounded-3 border">
                  <table class="table table-sm table-hover bg-white mb-0">
                    <thead class="table-info text-dark border-0">
                      <tr class="small text-center">
                        <th class="py-2">Cargo</th>
                        <th class="py-2">Centro</th>
                        <th class="py-2">Suplemento Mensual</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr class="text-center fw-medium py-3">
                        <td class="py-3">{{ payrollForm.get('cargoDirectivo')?.value }}</td>
                        <td class="py-3">Tipo {{ payrollForm.get('tipoCentro')?.value }}</td>
                        <td class="py-3 text-primary fw-bold">{{ selectedCargoAmount() | currency:'EUR' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Otros Complementos (Diseño Stacked) -->
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <label class="form-label fw-bold mb-0">Otros Complementos y Cargos</label>
          <button *ngIf="selectedOtros().length > 0" 
                  type="button" 
                  class="btn btn-link btn-sm text-danger text-decoration-none p-0 animate__animated animate__fadeIn" 
                  (click)="clearAllComplementos()">
            <i class="bi bi-trash3 me-1"></i>Eliminar todos
          </button>
        </div>
        <div class="input-group shadow-sm mb-3">
          <span class="input-group-text bg-white border-end-0"><i class="bi bi-plus-circle text-primary"></i></span>
          <select aria-label="Complemento para añadir" class="form-select border-start-0" (change)="addComplemento($event)" #complementoSelect>
            <option value="" selected>Seleccione un complemento para añadirlo...</option>
            <option *ngFor="let c of otrosCargosKeys" [value]="c" [disabled]="selectedOtros().includes(c)">
              {{ c }} {{ selectedOtros().includes(c) ? '(seleccionado)' : '' }} ({{ complementosData['otros cargos'][c] | currency:'EUR' }})
            </option>
          </select>
        </div>

        <!-- Lista de complementos seleccionados -->
        <div class="selected-complements d-flex flex-column gap-2">
          <div *ngFor="let c of selectedOtros()" class="complement-badge d-flex justify-content-between align-items-center p-2 rounded-3 border bg-white animate__animated animate__fadeInLeft">
            <div class="d-flex align-items-center">
              <i class="bi bi-check-circle-fill text-success me-2"></i>
              <span class="fw-medium">{{ c }}</span>
              <input *ngIf="esVariable(c)" type="number" min="0" step="0.01" class="form-control ms-2" style="max-width: 130px"
                [attr.aria-label]="c === 'Itinerancia (€/km)' ? 'Kilómetros del mes' : 'Horas del mes'"
                [placeholder]="c === 'Itinerancia (€/km)' ? 'km del mes' : 'horas del mes'"
                (input)="actualizarCantidad(c, $event)">

            </div>
            <div class="d-flex align-items-center gap-3">
              <span class="text-primary fw-bold">{{ complementosData['otros cargos'][c] | currency:'EUR' }}</span>
              <button type="button" class="btn btn-outline-danger btn-sm border-0 rounded-circle p-1 leading-none" [attr.aria-label]="'Eliminar complemento: ' + c" (click)="removeComplemento(c)">
                <i class="bi bi-x-circle fs-5"></i>
              </button>
            </div>
          </div>
          
          <div *ngIf="selectedOtros().length === 0" class="text-center py-3 border border-dashed rounded-3 bg-light opacity-75">
            <p class="text-muted mb-0 small">No hay complementos adicionales seleccionados.</p>
          </div>
        </div>
      </div>

      <div class="col-12 small text-muted">
        Kilómetros y horas: indica las unidades efectivamente realizadas en el mes. La itinerancia se trata como indemnización por desplazamiento justificado, exenta dentro de sus límites.
        Para comedor, la guía no define el caso de exactamente 300 comensales; tampoco aclara vicesecretaría con exactamente 1000 alumnos. Consulta esos casos antes de elegir un tramo.
        Selecciona solo complementos compatibles y reconocidos en tu nómina.
      </div>
      <div class="col-12 nd-form-section"><h2><span aria-hidden="true">04</span>Retención de IRPF</h2><p>Indica el porcentaje que quieres aplicar a la simulación.</p></div>
      <!-- Parámetros Económicos -->
      <div class="col-md-6">
        <label for="irpf" class="form-label fw-bold">IRPF (%)</label>
        <div class="input-group shadow-sm">
          <input id="irpf" type="number" formControlName="irpf" class="form-control" placeholder="Ej: 20">
          <span class="input-group-text bg-white">%</span>
        </div>
      </div>



      <div *ngIf="formError" class="col-12 alert alert-danger" role="alert">{{ formError }}</div>
      <div class="col-12 nd-submit-row">
        <button type="submit" class="btn btn-primary btn-lg px-5 shadow-sm" [disabled]="payrollForm.invalid">
          <i class="bi bi-calculator me-2"></i>Calcular nómina
        </button>
      </div>
    </form>
  `,
  styles: `:host { display: block; }`

})
export class PayrollForm {
  private fb = inject(FormBuilder);
  formError = "";
  
  @Output() calculate = new EventEmitter<PayrollInput>();

  salarios: SalaryData[] = salariosData as SalaryData[];
  complementosData: any = complementosData;
  
  familiasCentro = Object.keys(this.complementosData['cargos directivos']);
  get cargosDirectivos(): string[] { return Object.keys(this.tablaDirectivos()); }
  get tiposCentro(): string[] { return Object.keys(this.complementosData['clasificacion centros'][this.payrollForm.get('familiaCentro')?.value]); }
  tablaDirectivos(): any { return this.complementosData['cargos directivos'][this.payrollForm.get('familiaCentro')?.value]; }
  descripcionTipo(tipo: string): string { return this.complementosData['clasificacion centros'][this.payrollForm.get('familiaCentro')?.value]?.[tipo] ?? ''; }
  cargoDisponible(cargo: string): boolean { return this.tablaDirectivos()?.[cargo]?.['Tipo ' + this.payrollForm.get('tipoCentro')?.value] != null; }
  onFamiliaChange() { this.payrollForm.patchValue({ cargoDirectivo: '', tipoCentro: 'D' }); this.onCargoChange(); }
  onTipoChange() {
    if (!this.cargoDisponible(this.payrollForm.get('cargoDirectivo')?.value)) this.payrollForm.patchValue({ cargoDirectivo: '' });
    this.onCargoChange();
  }
  esVariable(c: string): boolean { return c === 'Itinerancia (€/km)' || c.startsWith('Hora lectiva complementaria'); }
  actualizarCantidad(c: string, event: Event) {
    const cantidades = { ...this.payrollForm.get('cantidadesComplementos')?.value, [c]: Number((event.target as HTMLInputElement).value) };
    this.payrollForm.patchValue({ cantidadesComplementos: cantidades });
  }
  otrosCargosKeys: string[] = Object.keys(this.complementosData['otros cargos']).sort();
  
  selectedSalary = signal<SalaryData | undefined>(undefined);
  selectedOtros = signal<string[]>([]);
  selectedCargoAmount = signal<number | null>(null);



  meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  isCapitalinaSelected(): boolean {
    const isla = this.payrollForm.get('isla')?.value;
    return isla === 'Gran Canaria' || isla === 'Tenerife';
  }

  isNoCapitalinaSelected(): boolean {
    const isla = this.payrollForm.get('isla')?.value;
    return isla !== '' && !this.isCapitalinaSelected();
  }

  payrollForm: FormGroup = this.fb.group({
    cuerpo: ['', [Validators.required]],
    isla: ['', [Validators.required]],
    mes: [new Date().getMonth() + 1, [Validators.required]],
    anio: [2026, [Validators.required, Validators.min(2026), Validators.max(2026)]],
    mostrarMesCompleto: [false],
    diasTrabajados: [30, [Validators.required, Validators.min(1), Validators.max(30)]],
    horasSemanales: [18, [Validators.required, Validators.min(1), Validators.max(18)]],
    fechaInicioContrato: ['', Validators.required],
    fechaFinContrato: ['', Validators.required],
    regimen: ['general'],
    familiaCentro: ['Secundaria, Medias, Artísticas, A distancia y EEOOII'],
    cantidadesComplementos: [{}],
    importeReduccionCompatibilidad: [0, [Validators.required, Validators.min(0)]],
    trienios: [0, [Validators.required, Validators.min(0)]],
    sexenios: [0, [Validators.required, Validators.min(0), Validators.max(5)]],
    compatibilidadPrivada: [false],
    diasCompatibilidad: [30, [Validators.min(0), Validators.max(30)]],
    cargoDirectivo: [''],
    tipoCentro: ['D'],
    complementos: [[]],
    irpf: [20, [Validators.required, Validators.min(0), Validators.max(100)]]
  });

  onCuerpoChange() {
    const cuerpoValue = this.payrollForm.get('cuerpo')?.value;
    const found = this.salarios.find(s => s.cuerpo === cuerpoValue);
    this.selectedSalary.set(found);
  }

  onCargoChange() {
    const cargo = this.payrollForm.get('cargoDirectivo')?.value;
    const tipo = this.payrollForm.get('tipoCentro')?.value;
    if (cargo && tipo) {
      const amount = this.tablaDirectivos()?.[cargo]?.[`Tipo ${tipo}`] ?? null;
      this.selectedCargoAmount.set(amount);
    } else {
      this.selectedCargoAmount.set(null);
    }
  }

  addComplemento(event: any) {
    const value = event.target.value;
    if (!value) return;

    const current = this.selectedOtros();
    if (!current.includes(value)) {
      if (this.esVariable(value)) this.payrollForm.patchValue({ cantidadesComplementos: { ...this.payrollForm.get('cantidadesComplementos')?.value, [value]: 0 } });
      const updated = [...current, value].sort((a, b) => a.localeCompare(b));
      this.selectedOtros.set(updated);
      this.payrollForm.patchValue({ complementos: updated });
    }
    
    event.target.value = "";
  }

  removeComplemento(name: string) {
    const current = this.selectedOtros();
    const updated = current.filter(c => c !== name);
    this.selectedOtros.set(updated);
    this.payrollForm.patchValue({ complementos: updated });
  }

  clearAllComplementos() {
    this.selectedOtros.set([]);
    this.payrollForm.patchValue({ complementos: [] });
  }

  onSubmit() {
    if (this.payrollForm.valid) {
      const value = this.payrollForm.value;
      if (value.fechaFinContrato < value.fechaInicioContrato) {
        this.formError = 'La fecha de fin del contrato debe ser igual o posterior a la de inicio.';
        return;
      }
      if (!Number.isInteger(value.trienios) || !Number.isInteger(value.sexenios) ||
          (value.compatibilidadPrivada && (value.diasCompatibilidad > value.diasTrabajados || value.importeReduccionCompatibilidad > (this.selectedSalary()?.especifico ?? 0)))) {
        this.formError = 'Revisa los trienios y sexenios (números enteros), y los días e importe de compatibilidad.';
        return;
      }
      this.formError = '';
      this.calculate.emit(value);
    }
  }
}
