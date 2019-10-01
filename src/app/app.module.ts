import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AppComponent } from './app.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { AppRoutingModule } from './app.routing.module';
import { FileUploadComponent } from './fileupload/fileupload.component';
import { HttpClientModule } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { DICOMViewerComponent } from './dicomviewer/dicom-viewer.component';
import { CornerstoneDirective } from './dicomviewer/cornerstone.directive';
import { ThumbnailDirective } from './dicomviewer/thumbnail.directive';
import { CustomViewerComponent } from './customviewer/customviewer.component';

@NgModule({
  declarations: [
    AppComponent,
    WelcomeComponent,
    CustomViewerComponent,
    DICOMViewerComponent,
    CornerstoneDirective, 
    ThumbnailDirective,
    FileUploadComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    CommonModule,
    MatProgressSpinnerModule,
    HttpClientModule,
    DragDropModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
