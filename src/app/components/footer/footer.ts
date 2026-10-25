import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  imports: [],
  template: `
    <footer class="nd-site-footer">
      <div class="nd-container nd-footer-inner">
        <a href="#calculadora" class="nd-brand-link" aria-label="NODOCAN, volver a la calculadora">
          <img src="brand/logos/nodocan-horizontal-reverse-descriptor.svg" alt="NODOCAN · Nómina Docente Canarias" width="280" height="58" loading="lazy">
        </a>
        <div class="nd-footer-copy">
          <p>Una herramienta independiente para entender tu nómina docente.</p>
          <a href="https://www.stec.es/stec/archivos_subidos/gal_descargas/2/_214.pdf" target="_blank" rel="noopener noreferrer">Fuente: guía STEC-IC · febrero de 2026<span class="visually-hidden"> (abre en otra pestaña)</span></a>
          <p class="nd-copyright">&copy; 2026 NODOCAN · Simulación informativa</p>
        </div>
      </div>
    </footer>
  `,
})
export class Footer {}
