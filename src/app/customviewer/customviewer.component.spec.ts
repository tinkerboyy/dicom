import { TestBed, async } from '@angular/core/testing';
import { CustomViewerComponent } from './customviewer.component';

describe('CustomComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CustomViewerComponent
      ],
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(CustomViewerComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'DICOMViewer'`, () => {
    const fixture = TestBed.createComponent(CustomViewerComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('DICOMViewer');
  });

  it('should render title in a h1 tag', () => {
    const fixture = TestBed.createComponent(CustomViewerComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('h1').textContent).toContain('Welcome to DICOMViewer!');
  });
});
