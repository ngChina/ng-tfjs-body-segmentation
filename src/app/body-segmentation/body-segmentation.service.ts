import { Component, Injectable, OnInit } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import * as bodyPix from '@tensorflow-models/body-pix';
import { ModelConfig, PersonInferenceConfig } from '@tensorflow-models/body-pix/dist/body_pix_model';
import { SemanticPartSegmentation } from '@tensorflow-models/body-pix';
import { BehaviorSubject, Observable } from 'rxjs';

// An object to configure parameters to set for the bodypix model.
// See github docs for explanations.
const bodyPixProperties: ModelConfig = {
  architecture: 'MobileNetV1',
  outputStride: 16,
  multiplier: 0.75,
  quantBytes: 4
};

// An object to configure parameters for detection. I have raised
// the segmentation threshold to 90% confidence to reduce the
// number of false positives.
const segmentationProperties: PersonInferenceConfig = {
  flipHorizontal: false,
  internalResolution: 'high',
  segmentationThreshold: 0.9
};

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

@Injectable({
  providedIn: 'root'
})
export class BodySegmentationService {
  private _readyState: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public readonly isReady$: Observable<boolean> = this._readyState.asObservable();

  model: bodyPix.BodyPix;

  constructor() {
    tf.setBackend('webgl');

    // Let's load the model with our parameters defined above.
    // Before we can use bodypix class we must wait for it to finish
    // loading. Machine Learning models can be large and take a moment to
    // get everything needed to run.
    bodyPix.load(bodyPixProperties).then(loadedModel => {
      this.model = loadedModel;
      this._readyState.next(true);
    });
  }

  public segmentPersonParts(input): Promise<bodyPix.SemanticPartSegmentation> {
    return this.model.segmentPersonParts(input, segmentationProperties);
  }
}
