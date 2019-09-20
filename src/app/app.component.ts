import { Component, ViewChild, ElementRef} from '@angular/core';
import * as AWS from "aws-sdk";
import { PromiseResult } from "aws-sdk/lib/request";
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  title = 'lalala';

  public rekognition: AWS.Rekognition;

  constructor(){
        AWS.config.region = 'ap-southeast-1';
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: 'ap-southeast-1:5d8ba300-588e-4c78-9d0a-b1dbf064a381'
        });
        //AWS.config.getCredentials;  
        //AWS.config.loadFromPath('/../credentials.json');
        this.rekognition = new AWS.Rekognition();
    }

  @ViewChild("video", {static:false})
    public video: ElementRef;

    @ViewChild("canvas", {static:false})
    public canvas: ElementRef;

    public captures: Array<any>;

    public dataURI: string;

    public imageBlob: string;

    public identifiedPerson: string;

    public url: Array<any>;

    public ngOnInit() { }

//Start Camera 
    public ngAfterViewInit() {
        if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
                this.video.nativeElement.srcObject = stream;
                this.video.nativeElement.play();
            });
        }
    }

//Capture Image 
    public capture() {
        var context = this.canvas.nativeElement.getContext("2d").drawImage(this.video.nativeElement, 0, 0, 640, 480);
        
        this.captures = [];
        this.captures.push(this.canvas.nativeElement.toDataURL("data:image/png;base64"));
        console.log(this.captures);

        //this.dataURI = this.canvas.nativeElement.toDataURL("data:image/png;base64").value;
        this.dataURI = this.canvas.nativeElement.toDataURL("data:image/png;base64,");

        this.dataURLtoBlob(this.dataURI);

        //const imageFile = new File([imageBlob], 'cameraImage.jpeg', { type: 'image/jpeg' });
    }

//Convert dataURL to imageBytes
    public dataURLtoBlob(dataURI) {
        console.log(dataURI);
        //const byteString = window.atob(dataURI);
        const byteString = atob(dataURI.split("data:image/png;base64,")[1]);
        console.log(byteString);
        console.log(byteString.length);

        const imageBytes = new ArrayBuffer(byteString.length);

        this.SearchFace(imageBytes).then(
            (data) => {
                console.log(data.FaceMatches[0].Face.ExternalImageId, ' had been identified');
                this.identifiedPerson = data.FaceMatches[0].Face.ExternalImageId;
        }).catch((err) => {
            console.error(err);
        });

        return this.identifiedPerson;
     }
    

//Call Rekognition API for Face Searching
    public SearchFace(imageBytes):
        //Promise<PromiseResult<AWS.Rekognition.SearchFacesByImageResponse, AWS.AWSError>> {
        Promise<PromiseResult<AWS.Rekognition.SearchFacesByImageResponse, AWS.AWSError>> {
            console.log(imageBytes);
            
            var params = {
                CollectionId: 'cx-demo-rekognition',
                Image: {
                    Bytes: imageBytes
              }
            };

            return this.rekognition.searchFacesByImage(params).promise();
        }
}

