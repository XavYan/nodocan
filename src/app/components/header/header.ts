import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  imports: [],
  template: `
    <header class="nd-site-header">
      <nav class="nd-container nd-header-inner" aria-label="Navegación principal">
        <a class="nd-brand-link" href="#calculadora" aria-label="NODOCAN · Nómina Docente Canarias, ir a la calculadora">
          <img src="brand/logos/nodocan-horizontal-color-descriptor.svg" alt="NODOCAN · Nómina Docente Canarias" width="280" height="58">
        </a>
        <a class="nd-header-link" href="https://www.stec.es/stec/archivos_subidos/gal_descargas/2/_214.pdf" target="_blank" rel="noopener noreferrer">
          <i class="bi bi-file-earmark-text" aria-hidden="true"></i><span>Consultar tablas 2026</span><span class="visually-hidden"> (abre en otra pestaña)</span>
        </a>
      </nav>
    </header>
  `,
})
export class Header {}
