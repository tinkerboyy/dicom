import { Component, OnInit, ViewChild } from '@angular/core';
import { DICOMViewerComponent } from '../dicomviewer/dicom-viewer.component';

declare const cornerstone;
declare const cornerstoneWADOImageLoader;
declare const cornerstoneWebImageLoader;
@Component({
  selector: 'customviewer-root',
  templateUrl: './customviewer.component.html',
  styleUrls: ['./customviewer.component.css']
})
export class CustomViewerComponent implements OnInit {
  myImageHeight : number = (window.innerHeight * 0.90);
  @ViewChild(DICOMViewerComponent, {}) viewPort: DICOMViewerComponent;

  ngOnInit() {
    cornerstoneWADOImageLoader.external.cornerstone = cornerstone; // inicializa WADO Image loader
    cornerstoneWebImageLoader.external.cornerstone = cornerstone;
    // configura codecs e web workers
    cornerstoneWADOImageLoader.webWorkerManager.initialize({
        webWorkerPath: './assets/cornerstone/webworkers/cornerstoneWADOImageLoaderWebWorker.js',
        taskConfiguration: {
            'decodeTask': {
                codecsPath: '../codecs/cornerstoneWADOImageLoaderCodecs.js'
            }
        }
    });

  }

  
}
