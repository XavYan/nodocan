import type { jsPDF } from 'jspdf';
import { regular, bold, heading } from './pdf-fonts/nodocan-fonts';
import type { PayrollResult, PayrollMonth, ContractTotals } from '../models/payroll.model';
import complementos from '../../assets/data/complementos.json';

const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const clean = (value: string) => value.replace(/[\u2010-\u2015]/g, '-').replace(/[\u00a0\u202f]/g, ' ');
const dateLabel = (value: string) => value.split('-').reverse().join('/');
const percent = (value: number) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(value);
const euro = (value: number) => clean(new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value));
export const payrollPdfFilename = (r: PayrollResult) => `nodocan-simulacion-${r.input.anio}-${String(r.input.mes).padStart(2, '0')}.pdf`;

/** Writes an immutable calculated snapshot, never the current (possibly edited) form. */
export function buildPayrollPdf(doc: jsPDF, r: PayrollResult): jsPDF {
  doc.addFileToVFS('SourceSans3-Regular.ttf', regular);
  doc.addFont('SourceSans3-Regular.ttf', 'Body', 'normal');
  doc.addFileToVFS('SourceSans3-Bold.ttf', bold);
  doc.addFont('SourceSans3-Bold.ttf', 'Body', 'bold');
  doc.addFileToVFS('Manrope-Bold.ttf', heading);
  doc.addFont('Manrope-Bold.ttf', 'Heading', 'normal');
  const input = r.input;
  const left = 18, right = 192, bottom = 273;
  let y = 0;
  const text = (value: string, x: number, at: number, options = {}) => doc.text(clean(value), x, at, options);
  const header = () => {
    doc.setFillColor(18, 46, 69); doc.rect(0, 0, 210, 38, 'F');
    // Vector version of the NODOCAN symbol, matching the SVG brand assets.
    doc.setFillColor(255, 255, 255); doc.roundedRect(left, 8, 12, 12, 2.67, 2.67, 'F');
    doc.setDrawColor(18, 46, 69); doc.setLineWidth(1); doc.setLineCap('round'); doc.setLineJoin('round');
    doc.line(left + 3.5, 16.67, left + 3.5, 11.33);
    doc.line(left + 3.5, 11.33, left + 8.5, 16.67);
    doc.line(left + 8.5, 16.67, left + 8.5, 11.33);
    doc.setFillColor(18, 46, 69); doc.circle(left + 3.5, 11.33, .78, 'F'); doc.circle(left + 8.5, 16.67, .78, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('Heading', 'normal'); doc.setFontSize(19);
    doc.setCharSpace(.24); text('NODOCAN', left + 15, 15.5); doc.setCharSpace(0);
    doc.setFont('Body', 'normal'); doc.setFontSize(9);
    text('Nómina Docente Canarias', left + 15, 20.5);
    doc.setFontSize(10.5); text(`Simulación de nómina | ${meses[input.mes - 1]} ${input.anio}`, left, 30);
    doc.setFillColor(232, 180, 77); doc.rect(right - 22, 28.5, 22, 1, 'F');
    doc.setTextColor(34, 56, 74); y = 49;
  };
  const space = (height: number) => { if (y + height > bottom) { doc.addPage(); header(); } };
  const section = (title: string, minimum = 26) => {
    space(minimum); y += 4;
    doc.setFillColor(230, 243, 242); doc.rect(left, y - 6, right - left, 12, 'F');
    doc.setFont('Heading', 'normal'); doc.setFontSize(14); doc.setTextColor(18, 46, 69);
    text(title, left + 3, y + 1.5); y += 14;
    doc.setTextColor(34, 56, 74);
  };
  const row = (label: string, value: string, bold = false) => {
    doc.setFont('Body', bold ? 'bold' : 'normal'); doc.setFontSize(10.5);
    const labels: string[] = doc.splitTextToSize(clean(label), 119);
    const values: string[] = doc.splitTextToSize(clean(value), 47);
    const height = Math.max(labels.length, values.length) * 5.25 + 3;
    space(height);
    doc.setFont('Body', bold ? 'bold' : 'normal'); doc.setFontSize(10.5);
    text(labels.join('\n'), left + 2, y);
    text(values.join('\n'), right - 2, y, { align: 'right' });
    y += height;
    doc.setLineWidth(.2); doc.setDrawColor(216, 225, 230); doc.line(left, y - 3, right, y - 3);
  };
  const amount = (label: string, value: number, bold = false) => row(label, euro(value === 0 ? 0 : value), bold);
  const paragraph = (value: string) => {
    doc.setFont('Body', 'normal'); doc.setFontSize(9);
    const lines: string[] = doc.splitTextToSize(clean(value), right - left - 4);
    for (const line of lines) { space(4.5); doc.setFont('Body', 'normal'); doc.setFontSize(9); text(line, left + 2, y); y += 4.5; }
    y += 3;
  };
  doc.setProperties({ title: `NODOCAN - Simulación de nómina - ${meses[input.mes - 1]} ${input.anio}`, subject: 'Estimación de retribuciones docentes de Canarias', author: 'NODOCAN · Nómina Docente Canarias' });
  header();
  section('Resumen');
  amount('Bruto ordinario', r.totalDevengado);
  amount('Deducciones ordinarias', r.totalDeducciones);
  amount('Neto ordinario mensual', r.salarioNeto, true);
  for (const extra of r.pagasExtra) amount(`Extra de ${extra.nombre} ${extra.anio} - neto (${percent(extra.porcentajeDevengo)}% de devengo)`, extra.pagaExtraNeta, true);
  section('Datos de la simulación');
  row('Cuerpo', input.cuerpo); row('Isla', input.isla);
  row('Días retribuidos / horas lectivas semanales', `${input.diasTrabajados} días / ${input.horasSemanales} horas`);
  row('Trienios / sexenios', `${input.trienios} / ${input.sexenios}`);
  row('Retención IRPF', `${input.irpf}%`);
  row('Contrato - inicio y fin incluidos', `${dateLabel(input.fechaInicioContrato)} - ${dateLabel(input.fechaFinContrato)}`);
  row('Régimen', input.regimen === 'pasivos' ? 'MUFACE y Clases Pasivas' : 'Régimen General (interinos)');
  if (input.cargoDirectivo) {
    row('Familia de centro', input.familiaCentro ?? '');
    row('Cargo / tipo de centro', `${input.cargoDirectivo} / ${input.tipoCentro}`);
    const clasificacion = complementos['clasificacion centros'] as Record<string, Record<string, string>>;
    paragraph(`Clasificación: ${clasificacion[input.familiaCentro ?? '']?.[input.tipoCentro] ?? input.tipoCentro}.`);
  }
  row('Compatibilidad privada', input.compatibilidadPrivada ? `Sí / ${input.diasCompatibilidad} días` : 'No');
  if (input.compatibilidadPrivada) amount('Reducción mensual autorizada a jornada completa', input.importeReduccionCompatibilidad ?? 0);
  const monthlyBreakdown = (payroll: PayrollMonth, title: string) => {
    const input = payroll.input, d = payroll.detalleDevengos, c = payroll.detalleDeducciones;
  section(`${title} - devengos`);
  amount('Sueldo base', d.sueldoBase); amount('Trienios', d.trienios); amount('Sexenios', d.sexenios);
  amount('Complemento de destino', d.complementoDestino); amount('Complemento específico', d.complementoEspecifico);
  amount('Residencia', d.residencia); amount('Cargo directivo', d.cargoDirectivo);
  for (const item of d.otrosCargosList) {
    const cantidad = input.cantidadesComplementos?.[item.nombre];
    const unidades = item.nombre === 'Itinerancia (€/km)' ? 'km' : 'horas';
    const variable = item.nombre === 'Itinerancia (€/km)' || item.nombre.startsWith('Hora lectiva complementaria');
    amount(item.nombre + (variable && cantidad !== undefined ? ` (${cantidad} ${unidades})` : ''), item.importe);
  }
  amount('Otros complementos - subtotal (incluido arriba)', d.otrosCargos);
  amount('Reducción por compatibilidad', -d.reduccionCompatibilidad);
  amount('Total devengado ordinario', payroll.totalDevengado, true);
  section(`${title} - deducciones`);
  amount('Base sujeta a IRPF', c.baseIRPF);
  amount('Base de contingencias comunes', c.basesCotizacion.contingenciasComunes);
  amount('Base de contingencias profesionales / desempleo / FP', c.basesCotizacion.contingenciasProfesionales);
  amount(`Retención IRPF (${input.irpf}%)`, c.irpf);
  const ss = c.seguridadSocialDetalle;
  if (input.regimen === 'pasivos') { amount('MUFACE', ss.muface); amount('Clases Pasivas', ss.pasivos); }
  else {
    amount('Contingencias comunes + MEI (4,85%)', ss.contingenciasComunes);
    amount('Desempleo (1,55%)', ss.desempleo);
    amount('Formación profesional (0,10%)', ss.formacionProfesional);
    amount('Cotización de solidaridad', ss.solidaridad);
  }
  amount('Cotizaciones y cuotas - subtotal', c.seguridadSocial);
  amount('Total deducciones ordinarias', payroll.totalDeducciones, true);
  amount('Neto ordinario mensual', payroll.salarioNeto, true);
  };
  monthlyBreakdown(r, 'Nómina indicada');
  if (r.mesCompleto) {
    section('Mes completo (30 días retribuidos)');
    paragraph(`Misma jornada: ${input.horasSemanales} horas lectivas semanales. Comparación de nómina ordinaria, sin extras. Unidades variables y compatibilidad proyectadas al ritmo del mes indicado.`);
    monthlyBreakdown(r.mesCompleto, 'Mes completo');
  }
  for (const paga of r.pagasExtra) {
    const extra = paga.pagaExtraDetalle;
    section(`Paga extraordinaria de ${paga.nombre} ${paga.anio}`, 38);
    if (paga.seLiquidaAlCese) paragraph('Parte pendiente incluida en la liquidación al cese.');
    row('Devengo de esta paga', `${percent(paga.porcentajeDevengo)}%`);
    row('Periodo de devengo', `${dateLabel(paga.periodoInicio)} - ${dateLabel(paga.periodoFin)}`);
    row('Días equivalentes (mes natural completo = 30)', `${paga.diasEquivalentes} / 180`);
    amount('Sueldo base extra', extra.sueldoBase); amount('Trienios extra', extra.trienios);
    amount('Sexenios extra', extra.sexenios); amount('Complemento de destino extra', extra.destino);
    amount('Complemento específico extra', extra.especifico);
    amount('Bruto de la extra', paga.pagaExtraBruta, true);
    amount(`Retención IRPF de la extra (${input.irpf}%)`, paga.pagaExtraIrpf);
    amount('Cuotas adicionales MUFACE / Clases Pasivas', paga.pagaExtraCuotas);
    amount('Neto de la extra', paga.pagaExtraNeta, true);
  }
  const totals = (value: ContractTotals) => {
    amount('Bruto',value.bruto); amount('Retención IRPF',value.irpf);
    amount('Seguridad Social / cuotas',value.seguridadSocial); amount('Neto',value.neto,true);
  };
  section('Liquidación al finalizar el contrato',38);
  row('Fecha de cese',dateLabel(r.liquidacion.fecha));
  const pending = r.liquidacion.extraPendiente;
  paragraph('La liquidación adicional excluye la última nómina ordinaria. Cada extra cuyo semestre haya terminado se presupone abonada. No se presupone indemnización por cese.');
  section('Extra pendiente de liquidar');
  if (pending) {
    row('Paga / devengo',`${pending.nombre} ${pending.anio} / ${percent(pending.porcentajeDevengo)}%`);
    totals({bruto:pending.pagaExtraBruta,irpf:pending.pagaExtraIrpf,seguridadSocial:pending.pagaExtraCuotas,neto:pending.pagaExtraNeta});
  } else paragraph('No queda una extra pendiente: el contrato finaliza al cierre del semestre.');
  section('Vacaciones pendientes');
  paragraph('2,5 días de vacaciones por mes completo trabajado; los meses incompletos aportan la proporción días/30. Se descuenta agosto dentro del contrato (máximo 30 días), sin consumir vacaciones de cursos posteriores.');
  for (const course of r.liquidacion.devengoVacaciones.porCurso) {
    row(`Curso ${course.curso}: generados / disfrutados / pendientes`,`${percent(course.diasGenerados)} / ${percent(course.diasDisfrutados)} / ${percent(course.diasPendientes)} días`);
  }
  row('Total días generados',percent(r.liquidacion.devengoVacaciones.diasGenerados));
  row('Total días disfrutados en agosto',percent(r.liquidacion.devengoVacaciones.diasDisfrutados));
  row('Total días pendientes de liquidar',percent(r.liquidacion.diasVacaciones));
  totals(r.liquidacion.vacaciones);
  paragraph('Estimación por días/30 con conceptos fijos, sin kilómetros ni horas complementarias. Cotizaciones calculadas por separado: la regularización de bases y topes con otros periodos en alta puede cambiar el importe.');
  section('Total liquidación adicional');
  totals(r.liquidacion.total);
  paragraph('La extra pendiente ya aparece en las pagas del contrato; no se suma dos veces.');
  const last = r.liquidacion.ultimaNomina;
  section(`Última nómina: ${meses[last.input.mes - 1]} ${last.input.anio}`,65);
  row('Días retribuidos del mes de cese',String(last.input.diasTrabajados));
  monthlyBreakdown(last,'Última nómina');
  amount('Neto última nómina + liquidación adicional',Math.round((last.salarioNeto+r.liquidacion.total.neto)*100)/100,true);
  section('Totales por año del contrato',45);
  paragraph('Proyección con tablas, cotizaciones, IRPF, antigüedad y jornada constantes de 2026, sin subidas futuras. Mes completo = 30 días; meses parciales según fechas (máximo 30). Unidades variables y compatibilidad se repiten al ritmo diario del mes indicado. Vacaciones pendientes atribuidas al año del cese.');
  for (const annual of r.totalesAnuales) {
    section(`Total del año ${annual.anio}`,85);
    amount('Bruto de nóminas ordinarias',annual.brutoNominas);
    amount('Bruto de pagas extraordinarias',annual.brutoExtras);
    amount('Bruto de vacaciones pendientes',annual.brutoVacaciones);
    totals(annual);
  }
  paragraph('Cada nómina, extra y vacaciones pendientes se cuenta una sola vez. Ni la comparación del mes completo ni el resumen de liquidación se añaden de nuevo.');
  section('Alcance y fuentes', 80);
  paragraph('Simulación informativa, sin validez de nómina oficial. Los importes corresponden a la última simulación calculada, con el porcentaje de IRPF indicado por el usuario.');
  paragraph('Todas las extras del contrato se muestran separadas del neto ordinario. El contrato completo indicado determina cada devengo: meses naturales completos / 6 y días de meses incompletos / 180, máximo 100%. Se aplica además la jornada indicada. Incluye los conceptos desglosados en la guía; no incluye extras de cargos u otros complementos.');
  paragraph('En Régimen General las extras cotizan mediante prorrata mensual. En MUFACE/Clases Pasivas se contemplan cuotas adicionales en las extras. El régimen mixto MUFACE + pensiones del Régimen General no está incluido.');
  paragraph('Cambios de jornada, nombramiento o complementos durante el semestre, atrasos y bases particulares a jornada parcial requieren cálculo individual. La itinerancia presupone desplazamientos justificados dentro de los límites exentos.');
  paragraph('Calendario de simulación: enero-junio y julio-diciembre. Se incluye cada semestre que se solapa con el contrato, aunque su parte pendiente se liquide al cese antes del mes de pago.');
  paragraph('Importes: guía STEC-IC, febrero de 2026. Cotizaciones: Orden PJC/297/2026.');
  const source = 'https://www.stec.es/stec/archivos_subidos/gal_descargas/2/_214.pdf';
  paragraph(source);
  const pages = doc.getNumberOfPages();
  for (let n = 1; n <= pages; n++) {
    doc.setPage(n); doc.setFont('Body', 'normal'); doc.setFontSize(9); doc.setTextColor(82, 103, 118);
    doc.setLineWidth(.2); doc.setDrawColor(216, 225, 230); doc.line(left, 282, right, 282);
    text('NODOCAN | Simulación informativa', left, 288);
    text(`${n} / ${pages}`, right, 288, { align: 'right' });
  }
  return doc;
}
