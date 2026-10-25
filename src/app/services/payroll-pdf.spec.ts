import { vi } from 'vitest';
import { jsPDF } from 'jspdf';
import { buildPayrollPdf, payrollPdfFilename } from './payroll-pdf';
import { PayrollService } from './payroll.service';
import { PayrollInput } from '../models/payroll.model';
import complementos from '../../assets/data/complementos.json';

export const exampleInput: PayrollInput = {
  cuerpo: 'Secundaria', isla: 'Tenerife', mes: 10, anio: 2026, diasTrabajados: 30,
  horasSemanales: 18, porcentajeJornada: 100, fechaInicioContrato: '2025-12-01', fechaFinContrato: '2026-11-30',
  cargoDirectivo: 'Dirección', familiaCentro: 'Secundaria, Medias, Artísticas, A distancia y EEOOII', tipoCentro: 'A',
  complementos: ['Coordinación de Orientación Profesional', 'Itinerancia (€/km)'],
  cantidadesComplementos: {'Itinerancia (€/km)': 125}, irpf: 15, trienios: 2, sexenios: 1,
  compatibilidadPrivada: false, diasCompatibilidad: 0, regimen: 'general'
};

describe('Exportación de la simulación a PDF', () => {
  it('genera un documento paginado con los importes de la simulación sin modificarlos', () => {
    const result = new PayrollService().calculatePayroll(exampleInput);
    const before = JSON.stringify(result);
    const doc = new jsPDF({ compress: false });
    const spy = vi.spyOn(doc, 'text');
    const output = buildPayrollPdf(doc, result).output();
    const written = JSON.stringify(spy.mock.calls);
    expect(output.startsWith('%PDF-')).toBe(true);
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
    expect(written).toContain('694,24');
    expect(written).toContain('125 km');
    expect(written).toContain('Neto ordinario mensual');
    expect(written).toContain('NODOCAN');
    expect(doc.getFontList()).toHaveProperty('Heading');
    expect(doc.getFontList()).toHaveProperty('Body');
    expect(written).not.toContain('Mes completo (30 días retribuidos)');
    expect(written).toContain('Clases Pasivas');
    expect(JSON.stringify(result)).toBe(before);
    expect(payrollPdfFilename(result)).toBe('nodocan-simulacion-2026-10.pdf');
  });
  it('exporta ambas pagas con sus porcentajes calculados y las fechas del contrato', () => {
    const result = new PayrollService().calculatePayroll({ ...exampleInput, fechaInicioContrato:'2026-09-15', fechaFinContrato:'2027-08-15', mostrarMesCompleto:true });
    const doc = new jsPDF(), spy = vi.spyOn(doc,'text');
    buildPayrollPdf(doc,result);
    const written = JSON.stringify(spy.mock.calls);
    expect(written).toContain('Paga extraordinaria de Junio 2027');
    expect(written).toContain('Paga extraordinaria de Diciembre 2026');
    expect(written).toContain('58,89%');
    expect(written).toContain('25%');
    expect(written).toContain('15/09/2026 - 15/08/2027');
    expect(written).toContain('Mes completo (30 días retribuidos)');
    expect(written).toContain('Liquidación al finalizar el contrato');
    expect(written).toContain('Total del año 2026');
    expect(written).toContain('Total del año 2027');
    expect(written).toContain('Vacaciones pendientes');
    expect(written).toContain('Total días disfrutados en agosto');
    expect(written).toContain('12,58');
    expect(written).toContain('Última nómina: Agosto 2027');
  });
  it('pagina listas extensas y conserva el último complemento y las notas', () => {
    const input = { ...exampleInput, complementos: Object.keys(complementos['otros cargos']), cantidadesComplementos: {
      'Itinerancia (€/km)': 25, 'Hora lectiva complementaria Grupo A1': 2, 'Hora lectiva complementaria Grupo A2': 3
    }};
    const doc = new jsPDF();
    const spy = vi.spyOn(doc, 'text');
    buildPayrollPdf(doc, new PayrollService().calculatePayroll(input));
    expect(doc.getNumberOfPages()).toBeGreaterThan(3);
    expect(JSON.stringify(spy.mock.calls)).toContain('STEC-IC');
    expect(JSON.stringify(spy.mock.calls)).toContain('136,10');
  });
  it('exporta las cuotas y la reducción autorizada para Clases Pasivas', () => {
    const result = new PayrollService().calculatePayroll({ ...exampleInput, regimen:'pasivos', compatibilidadPrivada: true, diasCompatibilidad: 10, importeReduccionCompatibilidad: 300 });
    const doc = new jsPDF();
    const spy = vi.spyOn(doc, 'text');
    buildPayrollPdf(doc, result);
    const output = JSON.stringify(spy.mock.calls);
    expect(output).toContain('118,04');
    expect(output).toContain('300,00');
    expect(output).toContain('-100,00');
  });
});
