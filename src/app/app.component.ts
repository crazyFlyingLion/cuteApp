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
  title = 'cuteApp';

  public rekognition: AWS.Rekognition;

  constructor(){
        AWS.config.region = 'ap-southeast-1';
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: 'ap-southeast-1:5d8ba300-588e-4c78-9d0a-b1dbf064a381'
        });
        this.rekognition = new AWS.Rekognition();
    }

  @ViewChild("video", {static:false})
    public video: ElementRef;

    @ViewChild("canvas", {static:false})
    public canvas: ElementRef;

    public captures: Array<any>;

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
        //console.log(this.captures);

        var dataURI = this.canvas.nativeElement.toDataURL("data:image/png;base64");
        //console.log(dataURI);

        this.SearchFace(this.dataURItoBlob(dataURI)).then(
            (data) => {
                console.log(data.FaceMatches[0].Face.ExternalImageId, ' had been identified');
        }).catch((err) => {
            console.error(err);
        });

    }

    //Convert dataURL to imageBytes
    public dataURItoBlob(dataURI) {
        //console.log(dataURI.split("data:image/png;base64,")[1]);
        const byteString = atob(dataURI.split("data:image/png;base64,")[1]);
        //console.log(byteString);
        //console.log(byteString.length);

        var length = byteString.length;
        var imageBytes = new ArrayBuffer(length);
        var ua = new Uint8Array(imageBytes);
        for (var i = 0; i < length; i++) {
          ua[i] = byteString.charCodeAt(i);
        }
  
        return imageBytes;

     }
    

    //Call Rekognition API for Face Searching
    public SearchFace(imageBytes):
        Promise<PromiseResult<AWS.Rekognition.SearchFacesByImageResponse, AWS.AWSError>> {
            //console.log(imageBytes);           
            var params = {
                CollectionId: 'cx-demo-rekognition',
                Image: {
                    Bytes: imageBytes
              }
            };

            return this.rekognition.searchFacesByImage(params).promise();

        }

}

