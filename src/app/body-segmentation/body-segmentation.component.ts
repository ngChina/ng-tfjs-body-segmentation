import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
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
  viewMode: 'image' | 'webcam' = 'image';

  sampleImages = [
    'https://cdn.glitch.com/ff4f00ae-20e2-4bdc-8771-2642ee05ae93%2Fjj.jpg?v=1581963497215',
    'https://cdn.glitch.com/ff4f00ae-20e2-4bdc-8771-2642ee05ae93%2Fwalk.jpg?v=1581963497392'
  ];
  segmentations: SemanticPartSegmentation[];

  @ViewChildren('segmentation', { read: ElementRef }) segmentationCanvases: QueryList<ElementRef>;

  constructor(public bodySegmentationService: BodySegmentationService) {
    this.segmentations = this.sampleImages.map(sample => undefined);
  }

  onImageClick(event, index) {
    if (this.segmentations[index]) {
      return;
    }

    this.bodySegmentationService.segmentPersonParts(event.target).then((parts: SemanticPartSegmentation) => {
      this.segmentations[index] = parts;

      const canvas = this.segmentationCanvases.toArray()[index].nativeElement;
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
}
