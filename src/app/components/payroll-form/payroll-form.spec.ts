import { TestBed } from '@angular/core/testing';
import { PayrollForm } from './payroll-form';

describe('Selección del equipo directivo', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({ imports:[PayrollForm] }).compileComponents();
    const fixture = TestBed.createComponent(PayrollForm);
    fixture.detectChanges();
    return fixture;
  };
  it('inicia IRPF al 20% y exige ambas fechas del contrato', async () => {
    const form = (await setup()).componentInstance;
    expect(form.payrollForm.value.irpf).toBe(20);
    expect(form.payrollForm.value.horasSemanales).toBe(18);
    expect(form.payrollForm.value.mostrarMesCompleto).toBe(false);
    expect(form.payrollForm.get('fechaInicioContrato')?.hasError('required')).toBe(true);
    expect(form.payrollForm.get('fechaFinContrato')?.hasError('required')).toBe(true);
  });
  it('permite activar la comparación del mes completo desde el checkbox', async () => {
    const fixture = await setup(), form = fixture.componentInstance;
    const checkbox = fixture.nativeElement.querySelector('#mostrarMesCompleto') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
    checkbox.checked = true; checkbox.dispatchEvent(new Event('change')); fixture.detectChanges();
    expect(form.payrollForm.value.mostrarMesCompleto).toBe(true);
    expect(form.payrollForm.value.horasSemanales).toBe(18);
  });
  it('emite un mes numérico al cambiar el selector en el navegador', async () => {
    const fixture = await setup(), form = fixture.componentInstance;
    form.payrollForm.patchValue({ cuerpo:'Secundaria', isla:'Tenerife', fechaInicioContrato:'2026-09-01', fechaFinContrato:'2027-08-15' });
    fixture.detectChanges();
    const select = fixture.nativeElement.querySelector('#mes') as HTMLSelectElement;
    select.selectedIndex = 5; select.dispatchEvent(new Event('change')); fixture.detectChanges();
    let month: unknown;
    form.calculate.subscribe(input => month = input.mes);
    form.onSubmit();
    expect(month).toBe(6);
  });
  it('rechaza contratos con fin anterior al inicio', async () => {
    const form = (await setup()).componentInstance;
    let emits = 0; form.calculate.subscribe(()=>emits++);
    form.payrollForm.patchValue({ cuerpo:'Secundaria', isla:'Tenerife', fechaInicioContrato:'2026-09-01', fechaFinContrato:'2026-08-31' });
    form.onSubmit();
    expect(emits).toBe(0);
    expect(form.formError).toContain('posterior');
  });
  it('muestra los umbrales, todas las familias y el importe de Secundaria', async () => {
    const fixture = await setup(), form = fixture.componentInstance;
    form.payrollForm.patchValue({ cargoDirectivo:'Dirección', tipoCentro:'A' });
    form.onCargoChange(); fixture.detectChanges();
    expect(form.selectedCargoAmount()).toBe(694.24);
    expect(fixture.nativeElement.textContent).toContain('1650 o más');
    expect(fixture.nativeElement.textContent).toContain('3000 o más');
    expect(form.tiposCentro).toEqual(['A','B','C','D']);
  });
  it('reinicia selección al cambiar familia y deshabilita combinaciones sin importe', async () => {
    const fixture = await setup(), form = fixture.componentInstance;
    form.payrollForm.patchValue({ cargoDirectivo:'Jefatura Adjunta', tipoCentro:'A' });
    form.payrollForm.patchValue({ familiaCentro:'CER, CEIP, EE y Adultos' });
    form.onFamiliaChange();
    expect(form.payrollForm.value.cargoDirectivo).toBe('');
    expect(form.selectedCargoAmount()).toBeNull();
    form.payrollForm.patchValue({ tipoCentro:'E' });
    fixture.detectChanges();
    expect(form.cargoDisponible('Jefatura de Estudios')).toBe(false);
    expect(form.cargoDisponible('Secretaría')).toBe(true);
    const options = Array.from(fixture.nativeElement.querySelectorAll('[formControlName="cargoDirectivo"] option')) as HTMLOptionElement[];
    expect(options.find(o=>o.value==='Jefatura de Estudios')?.disabled).toBe(true);
    expect(form.tiposCentro).toEqual(['A','B','C','D','E','F']);
    expect(form.descripcionTipo('E')).toBe('6 a 8 unidades');
  });
  it('limpia un cargo cuando cambia a un tipo que no lo contempla', async () => {
    const form = (await setup()).componentInstance;
    form.payrollForm.patchValue({ familiaCentro:'CER, CEIP, EE y Adultos', cargoDirectivo:'Vicedirección', tipoCentro:'D' });
    form.onTipoChange();
    expect(form.payrollForm.value.cargoDirectivo).toBe('');
    expect(form.selectedCargoAmount()).toBeNull();
  });
  it('no emite cálculo con antigüedad fraccionaria ni año sin tablas', async () => {
    const form = (await setup()).componentInstance;
    let emits = 0; form.calculate.subscribe(()=>emits++);
    form.payrollForm.patchValue({ cuerpo:'Secundaria', isla:'Tenerife', trienios:1.5, fechaInicioContrato:'2025-12-01', fechaFinContrato:'2026-11-30' });
    form.onSubmit(); expect(emits).toBe(0); expect(form.formError).toBeTruthy();
    form.payrollForm.patchValue({ trienios:1, anio:2027 });
    form.onSubmit(); expect(emits).toBe(0);
  });
});
