import { Component, ViewChild, OnInit, Input, ViewChildren } from '@angular/core';
import { CornerstoneDirective } from './cornerstone.directive';
import { ThumbnailDirective } from './thumbnail.directive';


declare const cornerstoneTools;
declare const cornerstone;
declare const cornerstoneWADOImageLoader;
declare const cornerstoneWebImageLoader;
@Component({
    selector: 'dicom-viewer',
    templateUrl: './dicom-viewer.component.html',
    styleUrls: ['./dicom-viewer.component.css']
})
export class DICOMViewerComponent implements OnInit {

    @Input() public enableViewerTools = false; // enable viewer tools
    @Input() public downloadImagesURL = '' // download images URL
    @Input() public maxImagesToLoad = 20; // limit for the automatic loading of study images

    public seriesList = []; // list of series on the images being displayed
    public currentSeriesIndex = 0;
    public currentSeries: any = {};
    public imageCount = 0; // total image count being viewed

    // control enable/disable image scroll buttons
    public get hidePreviousImage(): any { return { color: (this.viewPort.currentIndex < 1) ? 'black' : 'white' }; }
    public get hideNextImage(): any { return { color: (this.viewPort.currentIndex >= (this.imageCount - 1)) ? 'black' : 'white' }; }

    // control message for more images to load
    public get moreImagestoLoad(): string {
        if (this.loadedImages.length < this.imageIdList.length && !this.loadingImages) { // are there any more images to load?
            const imagesToLoad = (this.maxImagesToLoad <= 0) ? (this.imageIdList.length - this.loadedImages.length) : Math.min(this.maxImagesToLoad, this.imageIdList.length - this.loadedImages.length);
            return imagesToLoad.toString();
        } else return '';
    }

    // control exhibition of a loading images progress indicator
    public loadingImages = false;
    public get showProgress(): any { return { display: (this.loadingImages) ? 'inline-block' : 'none' } };

    @ViewChild(CornerstoneDirective, {}) viewPort: CornerstoneDirective; // the main cornertone view port
    @ViewChildren(ThumbnailDirective) thumbnails:Array<ThumbnailDirective>;

    private loadedImages = [];
    private imageIdList = [];
    private element: any;
    private targetImageCount = 0;

    constructor() { }

    ngOnInit() {
        this.element = this.viewPort.element;
    }

    /**
     * Load dicom images for display
     *
     * @param imageIdList list of imageIds to load and display
     */
    loadStudyImages(imageIdList: Array<any>) {
        this.element = this.viewPort.element;
        this.imageIdList = imageIdList;
        this.viewPort.resetViewer();
        this.viewPort.resetImageCache(); // clean up image cache
        this.seriesList = []; // start a new series list
        this.currentSeriesIndex = 0; // always display first series
        this.loadedImages = []; // reset list of images already loaded

        //
        // loop thru all imageIds, load and cache them for exhibition (up the the maximum limit defined)
        //
        const maxImages = (this.maxImagesToLoad <= 0) ? imageIdList.length : Math.min(this.maxImagesToLoad, imageIdList.length);
        this.loadingImages = true; // activate progress indicator
        this.targetImageCount = maxImages;
        for (let index = 0; index < maxImages; index++) {
            const imageId = imageIdList[index];
            if (imageId.indexOf('blob:') !== -1) {
                cornerstoneWebImageLoader.loadImage(imageId).promise.then(imageData => {
                     this.imageLoaded(imageData);
                });
            } else {
                cornerstone.loadAndCacheImage(imageId).then(imageData => { this.imageLoaded(imageData) });
            }
            
        }

    }

    /**
     * Load the next batch of images
     */
    public loadMoreImages() {
        this.element = this.viewPort.element;
        //
        // loop thru all imageIds, load and cache them for exhibition (up the the maximum limit defined)
        //
        const maxImages = (this.maxImagesToLoad <= 0) ? (this.imageIdList.length - this.loadedImages.length) : Math.min(this.maxImagesToLoad, this.imageIdList.length - this.loadedImages.length);
        this.loadingImages = true; // activate progress indicator
        this.targetImageCount += maxImages;
        let nextImageIndex = this.loadedImages.length;
        for (let index = 0; index < maxImages; index++) {
            const imageId = this.imageIdList[nextImageIndex++];
            cornerstone.loadAndCacheImage(imageId)
              .then(imageData => { this.imageLoaded(imageData) })
              .catch(err => {this.targetImageCount--;});
        }

    }

    /**
     *
     * @param imageData the dicom image data
     */
    private imageLoaded(imageData) {
        //console.log(imageData.imageId)
        // build list of series in all loadded images

        var series;
        if (imageData.data) {
            series = {
                studyID: imageData.data.string('x0020000d'),
                seriesID: imageData.data.string('x0020000e'),
                seriesNumber: imageData.data.intString('x00200011'),
                studyDescription: imageData.data.string('x00081030'),
                seriesDescription: imageData.data.string('x0008103e'),
                imageCount: 1,
                imageList: [imageData]
            }
        } else {
            var t = new Date().getTime();
            series = {
                studyID: t,
                seriesID: imageData.imageId,
                seriesNumber: t,
                studyDescription: 'Image Study',
                seriesDescription: 'Image Series',
                imageCount: 1,
                imageList: [imageData]
            }
        }
        // if this is a new series, add it to the list
        let seriesIndex = this.seriesList.findIndex(item => item.seriesID === series.seriesID);
        if (seriesIndex < 0) {
            seriesIndex = this.seriesList.length;
            this.seriesList.push(series);
            this.seriesList.sort((a,b) => {
              if (a.seriesNumber > b.seriesNumber) return 1;
              if (a.seriesNumber < b.seriesNumber) return -1;
              return 0;
          })
        } else {
            let seriesItem = this.seriesList[seriesIndex];
            seriesItem.imageCount++;
            seriesItem.imageList.push(imageData);
            if (imageData.data) {
                seriesItem.imageList.sort((a,b) => {
                    if (a.data.intString('x00200013') > b.data.intString('x00200013')) return 1;
                    if (a.data.intString('x00200013') < b.data.intString('x00200013')) return -1;
                    return 0;
                })
            }
        }

        this.loadedImages.push(imageData); // save to images loaded

        if (seriesIndex === this.currentSeriesIndex) {
            //this.currentSeries = this.seriesList[seriesIndex];
            //this.imageCount = this.currentSeries.imageCount; // get total image count
            //this.viewPort.addImageData(imageData);
            this.showSeries(this.currentSeriesIndex)
        }

        if (this.loadedImages.length >= this.targetImageCount) { // did we finish loading images?
            this.loadingImages = false; // deactivate progress indicator
        }

    }

    public showSeries(index) {
//        this.resetAllTools();
        this.currentSeriesIndex = index;
        this.currentSeries = this.seriesList[index];
        this.imageCount = this.currentSeries.imageCount; // get total image count
        this.viewPort.resetImageCache(); // clean up image cache
//        this.loadingImages = true; // activate progress indicator
        for (let i = 0; i < this.currentSeries.imageList.length; i++) {
            const imageData = this.currentSeries.imageList[i];
            this.viewPort.addImageData(imageData);
        }
//        this.loadingImages = false; // de-activate progress indicator
    }

    public saveAs() {
        cornerstoneTools.saveAs(this.element, "dicom.png")
    }

    /**
     * Image scroll methods
     */
    public nextImage() {
        if (this.viewPort.currentIndex < this.imageCount) {
            this.viewPort.nextImage();
        }
    }

    public previousImage() {
        if (this.viewPort.currentIndex > 0) {
            this.viewPort.previousImage();
        }
    }

    /**
     * Methods to activate/deactivate viewer tools
     */

    // deactivate all tools
    public resetAllTools() {
        if (this.imageCount > 0) {
            cornerstoneTools.wwwc.deactivate(this.element, 1);
            cornerstoneTools.pan.deactivate(this.element, 1);
            cornerstoneTools.zoom.deactivate(this.element, 1);
            cornerstoneTools.probe.deactivate(this.element, 1);
            cornerstoneTools.length.deactivate(this.element, 1);
            cornerstoneTools.simpleAngle.deactivate(this.element, 1);
            cornerstoneTools.ellipticalRoi.deactivate(this.element, 1);
            cornerstoneTools.rectangleRoi.deactivate(this.element, 1);
            cornerstoneTools.stackScroll.deactivate(this.element, 1);
            cornerstoneTools.wwwcTouchDrag.deactivate(this.element);
            cornerstoneTools.zoomTouchDrag.deactivate(this.element);
            cornerstoneTools.panTouchDrag.deactivate(this.element);
            cornerstoneTools.stackScrollTouchDrag.deactivate(this.element);
            cornerstoneTools.rotate.deactivate(this.element);
            this.stopClip();
        }
    }

    // activate windowing
    public enableWindowing() {
        if (this.imageCount > 0) {
            this.resetAllTools();
            cornerstoneTools.wwwc.activate(this.element, 1);
            cornerstoneTools.wwwcTouchDrag.activate(this.element);
        }
    }

    // activate zoom
    public enableZoom() {
        if (this.imageCount > 0) {
            this.resetAllTools();
            cornerstoneTools.zoom.activate(this.element, 5); // 5 is right mouse button and left mouse button
            cornerstoneTools.zoomTouchDrag.activate(this.element);
        }
    }

    // activate pan
    public enablePan() {
        if (this.imageCount > 0) {
            this.resetAllTools();
            cornerstoneTools.pan.activate(this.element, 3); // 3 is middle mouse button and left mouse button
            cornerstoneTools.panTouchDrag.activate(this.element);
        }
    }

    // activate image scroll
    public enableScroll() {
        if (this.imageCount > 0) {
            this.resetAllTools();
            cornerstoneTools.stackScroll.activate(this.element, 1);
            cornerstoneTools.stackScrollTouchDrag.activate(this.element);
            cornerstoneTools.stackScrollKeyboard.activate(this.element);
        }
    }

    // activate length measurement
    public enableLength() {
        if (this.imageCount > 0) {
            this.resetAllTools();
            cornerstoneTools.length.activate(this.element, 1);
        }
    }

    // activate angle measurement
    public enableAngle() {
        if (this.imageCount > 0) {
            this.resetAllTools();
            cornerstoneTools.simpleAngle.activate(this.element, 1);
        }
    }

    // activate pixel probe
    public enableProbe() {
        if (this.imageCount > 0) {
            this.resetAllTools();
            cornerstoneTools.probe.activate(this.element, 1);
        }
    }

    // activate rotate tool
    public enableRotate() {
        if (this.imageCount > 0) {
            this.resetAllTools();
            cornerstoneTools.rotate.activate(this.element, 5);
        }
    }

    // activate Elliptical ROI
    public enableElliptical() {
        if (this.imageCount > 0) {
            this.resetAllTools();
            cornerstoneTools.ellipticalRoi.activate(this.element, 1);
        }
    }

    // activate Rectangle ROI
    public enableRectangle() {
        if (this.imageCount > 0) {
            this.resetAllTools();
            cornerstoneTools.rectangleRoi.activate(this.element, 1);
        }
    }

    // Play Clip
    public playClip() {
        if (this.imageCount > 0) {
            let frameRate = 10;
            let stackState = cornerstoneTools.getToolState(this.element, 'stack');
            if (stackState) {
                frameRate = stackState.data[0].frameRate;
                // Play at a default 10 FPS if the framerate is not specified
                if (frameRate === undefined) {
                    frameRate = 10;
                }
            }
            cornerstoneTools.playClip(this.element, frameRate);
        }
    }

    // Stop Clip
    public stopClip() {
        cornerstoneTools.stopClip(this.element);
    }

    // invert image
    public invertImage() {
        if (this.imageCount > 0) {
            let viewport = cornerstone.getViewport(this.element);
            // Toggle invert
            if (viewport.invert === true) {
                viewport.invert = false;
            } else {
                viewport.invert = true;
            }
            cornerstone.setViewport(this.element, viewport);
        }
    }

    // reset image
    public resetImage() {
        if (this.imageCount > 0) {
            let toolStateManager = cornerstoneTools.getElementToolStateManager(this.element);
            // Note that this only works on ImageId-specific tool state managers (for now)
            //toolStateManager.clear(this.element);
            cornerstoneTools.clearToolState(this.element, "length");
            cornerstoneTools.clearToolState(this.element, "angle");
            cornerstoneTools.clearToolState(this.element, "simpleAngle");
            cornerstoneTools.clearToolState(this.element, "probe");
            cornerstoneTools.clearToolState(this.element, "ellipticalRoi");
            cornerstoneTools.clearToolState(this.element, "rectangleRoi");
            cornerstone.updateImage(this.element);
            this.resetAllTools();
        }
    }

    public clearImage() {
      this.viewPort.resetViewer();
      this.viewPort.resetImageCache();
      this.seriesList = []; // list of series on the images being displayed
      this.currentSeriesIndex = 0;
      this.currentSeries = {};
      this.imageCount = 0; // total image count being viewed

    }

    /**
   * Load selected DICOM images
   *
   * @param files list of selected dicom files
   */
  loadDICOMImages(files: FileList) {
    if (files && files.length > 0) {
      let imageList = [];
      const fileList:Array<File> = Array.from(files);
      fileList.sort((a,b) => {
        if ( a.name > b.name ) return 1;
        if ( b.name > a.name ) return -1;
        return 0;
      })
      //cornerstoneWADOImageLoader.wadouri.fileManager.purge();
      cornerstoneWADOImageLoader.wadouri.dataSetCacheManager.purge();

      var startRendering = (imageList, imageId, index, fileList) => {
        imageList.push(imageId);
        if (fileList.length === index + 1) {
          this.resetAllTools();
          // now load all Images, using their wadouri
          this.loadStudyImages(imageList);
        } else {
          collectImagesFromLoader(index + 1);
        }
      };

      // loop thru the File list and build a list of wadouri imageIds (dicomfile:)
      var collectImagesFromLoader = (index) => {
        const dicomFile: File = fileList[index];
        var fr = new FileReader();
        var dType = dicomFile.type || '';
        if(dType.match(/image/g) && dType.indexOf('.dcm') === -1) {
          fr.onload = () => {
              var blob = new Blob( [fr.result], { type: 'image/jpeg' });
              var urlCreator = window.URL;
              var imageId = urlCreator.createObjectURL( blob );
              startRendering(imageList, imageId, index, fileList);
          };
          fr.readAsArrayBuffer(dicomFile); 
        } else {
          const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(dicomFile);
          startRendering(imageList, imageId, index, fileList);
        }
      }

      collectImagesFromLoader(0);

    } else alert('Some Error Occured, Invalid Input');
  }

  openFileBrowser = (event : any) => {
    event.preventDefault();
    let element : HTMLElement = document.getElementById('fileLoader') as HTMLElement;
    element.click();
  }
}
