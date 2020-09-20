import { Component, ElementRef, QueryList, Renderer2, ViewChild, ViewChildren } from '@angular/core';
import { SemanticPartSegmentation } from '@tensorflow-models/body-pix';
import { BodySegmentationService } from './body-segmentation.service';

// This array will hold the colours we wish to use to highlight different body parts we find.
// RGBA (Red, Green, Blue, and Alpha (transparency) channels can be specified).
const colourMap = [
  { r: 244, g: 67, b: 54, a: 255 }, // Left_face
  { r: 183, g: 28, b: 28, a: 255 }, // Right_face
  { r: 233, g: 30, b: 99, a: 255 }, // left_upper_arm_front
  { r: 136, g: 14, b: 79, a: 255 }, // left_upper_arm_back
  { r: 233, g: 30, b: 99, a: 255 }, // right_upper_arm_front
  { r: 136, g: 14, b: 79, a: 255 }, // 	right_upper_arm_back
  { r: 233, g: 30, b: 99, a: 255 }, // 	left_lower_arm_front
  { r: 136, g: 14, b: 79, a: 255 }, // 	left_lower_arm_back
  { r: 233, g: 30, b: 99, a: 255 }, // right_lower_arm_front
  { r: 136, g: 14, b: 79, a: 255 }, // right_lower_arm_back
  { r: 156, g: 39, b: 176, a: 255 }, // left_hand
  { r: 156, g: 39, b: 176, a: 255 }, // right_hand
  { r: 63, g: 81, b: 181, a: 255 }, // torso_front
  { r: 26, g: 35, b: 126, a: 255 }, // torso_back
  { r: 33, g: 150, b: 243, a: 255 }, // left_upper_leg_front
  { r: 13, g: 71, b: 161, a: 255 }, // left_upper_leg_back
  { r: 33, g: 150, b: 243, a: 255 }, // right_upper_leg_front
  { r: 13, g: 71, b: 161, a: 255 }, // right_upper_leg_back
  { r: 0, g: 188, b: 212, a: 255 }, // left_lower_leg_front
  { r: 0, g: 96, b: 100, a: 255 }, // left_lower_leg_back
  { r: 0, g: 188, b: 212, a: 255 }, // right_lower_leg_front
  { r: 0, g: 188, b: 212, a: 255 }, // right_lower_leg_back
  { r: 255, g: 193, b: 7, a: 255 }, // left_feet
  { r: 255, g: 193, b: 7, a: 255 } // right_feet
];

@Component({
  selector: 'app-body-segmentation',
  templateUrl: './body-segmentation.component.html',
  styleUrls: ['./body-segmentation.component.css']
})
export class BodySegmentationComponent {
  viewMode: 'image' | 'webcam' = 'webcam';

  sampleImages = [
    'https://cdn.glitch.com/ff4f00ae-20e2-4bdc-8771-2642ee05ae93%2Fjj.jpg?v=1581963497215',
    'https://cdn.glitch.com/ff4f00ae-20e2-4bdc-8771-2642ee05ae93%2Fwalk.jpg?v=1581963497392'
  ];
  segmentations: SemanticPartSegmentation[];

  @ViewChildren('imageCanvas', { read: ElementRef }) imageCanvases: QueryList<ElementRef>;

  @ViewChild('webcam', { read: ElementRef }) webcamElement: ElementRef;
  @ViewChild('webcamCanvas', { read: ElementRef }) webcamCanvasElement: ElementRef;
  previousSegmentationComplete = true;

  videoRenderCanvas;
  videoRenderCanvasCtx;

  constructor(private renderer: Renderer2, public bodySegmentationService: BodySegmentationService) {
    this.segmentations = this.sampleImages.map(sample => undefined);
  }

  onImageClick(event, index) {
    if (this.segmentations[index]) {
      return;
    }

    this.bodySegmentationService.segmentPersonParts(event.target).then((parts: SemanticPartSegmentation) => {
      this.segmentations[index] = parts;

      const canvas = this.imageCanvases.toArray()[index].nativeElement;
      canvas.width = parts.width;
      canvas.height = parts.height;

      this.processSegmentation(canvas, parts);
    });
  }

  // render returned segmentation data to a given canvas context.
  processSegmentation(canvas, segmentation) {
    const ctx = canvas.getContext('2d');

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let n = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (segmentation.data[n] !== -1) {
        data[i] = colourMap[segmentation.data[n]].r; // red
        data[i + 1] = colourMap[segmentation.data[n]].g; // green
        data[i + 2] = colourMap[segmentation.data[n]].b; // blue
        data[i + 3] = colourMap[segmentation.data[n]].a; // alpha
      } else {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 0;
      }
      n++;
    }

    ctx.putImageData(imageData, 0, 0);
  }

  // Check if webcam access is supported.
  hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  // Enable the live webcam view and start classification.
  enableCam() {
    // We will also create a tempory canvas to render to that is in memory only
    // to store frames from the web cam stream for classification.
    this.videoRenderCanvas = document.createElement('canvas');
    this.videoRenderCanvasCtx = this.videoRenderCanvas.getContext('2d');

    // getUsermedia parameters.
    const constraints = {
      video: true
    };

    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
      const webcamEl = this.webcamElement.nativeElement;
      this.renderer.setProperty(webcamEl, 'srcObject', stream);

      this.renderer.listen(webcamEl, 'play', event => {
        console.log('play', event);
        // Update widths and heights once video is successfully played otherwise
        // it will have width and height of zero initially causing classification to fail.
        this.webcamCanvasElement.nativeElement.width = webcamEl.videoWidth;
        this.webcamCanvasElement.nativeElement.height = webcamEl.videoHeight;
        this.videoRenderCanvas.width = webcamEl.videoWidth;
        this.videoRenderCanvas.height = webcamEl.videoHeight;
      });

      this.renderer.listen(webcamEl, 'loadeddata', () => this.predictWebcam());
    });
  }

  predictWebcam() {
    console.log('predictWebcam');
    if (this.previousSegmentationComplete) {
      // Copy the video frame from webcam to a tempory canvas in memory only (not in the DOM).
      this.videoRenderCanvasCtx.drawImage(this.webcamElement.nativeElement, 0, 0);
      this.previousSegmentationComplete = false;
      // Now classify the canvas image we have available.
      this.bodySegmentationService.segmentPersonParts(this.videoRenderCanvas).then(segmentation => {
        this.processSegmentation(this.webcamCanvasElement.nativeElement, segmentation);
        this.previousSegmentationComplete = true;
      });
    }
    // Call this function again to keep predicting when the browser is ready.
    window.requestAnimationFrame(this.predictWebcam.bind(this));
  }
}
