import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Cuerpo');
    expect(compiled.querySelector('h1')?.textContent).toContain('Tu nómina docente, clara.');
    expect(compiled.querySelector('app-header img')?.getAttribute('alt')).toContain('NODOCAN');
    expect(compiled.querySelector('label[for=horasSemanales]')?.textContent).toContain('Horas lectivas semanales');
  });
});
