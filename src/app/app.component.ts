import { Component, ViewChild, ElementRef} from '@angular/core';
import * as AWS from "aws-sdk";
import * as Textract from 'aws-sdk/clients/textract';
import { PromiseResult } from "aws-sdk/lib/request";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  title = 'cuteApp';

  constructor(){
        AWS.config.region = 'us-east-1'; // Region
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: 'us-east-1:a30e0d17-0ec6-4dac-8fba-de2695d2e738',
        });
    }

  @ViewChild("video", {static:false})
    public video: ElementRef;

    @ViewChild("canvas", {static:false})
    public canvas: ElementRef;

    public captures: Array<any>;

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
    public capture_face() {
        var context = this.canvas.nativeElement.getContext("2d").drawImage(this.video.nativeElement, 0, 0, 640, 480);

        this.captures = [];
        this.captures.push(this.canvas.nativeElement.toDataURL("data:image/png;base64"));
        //console.log(this.captures);

        var dataURI = this.canvas.nativeElement.toDataURL("data:image/png;base64");
        //console.log(dataURI);

        var element = document.getElementById("msg");
        element.innerHTML = "Processing Image...";

        this.SearchFace(this.dataURItoBlob(dataURI)).then(
            (data) => {
                element.innerHTML = data.FaceMatches[0].Face.ExternalImageId.replace('_', ' ').toUpperCase() + ' had been identified';
                console.log(data.FaceMatches[0].Face.ExternalImageId, ' had been identified');
        }).catch((err) => {
            console.error(err);
        });

    }

    public capture_passport() {
        var context = this.canvas.nativeElement.getContext("2d").drawImage(this.video.nativeElement, 0, 0, 640, 480);

        this.captures = [];
        this.captures.push(this.canvas.nativeElement.toDataURL("data:image/png;base64"));
        //console.log(this.captures);

        var dataURI = this.canvas.nativeElement.toDataURL("data:image/png;base64");
        //console.log(dataURI);

        var element = document.getElementById("msg");
        element.innerHTML = "Processing Image...";

        this.ScanPassport(this.dataURItoBlob(dataURI)).then(
            (data) => {
                var scannedText = "";
                for (var i = 0; i < data.Blocks.length; i++) {
                        if (i !== (data.Blocks.length - 1)) {
                            if (i !== 0){
                                scannedText += "[" + i + "] " + data.Blocks[i].Text + ", ";
                            }
                        }
                        else {
                            scannedText += "[" + i + "] " + data.Blocks[i].Text
                        }
                }
                element.innerHTML = "Scanned Text: " + scannedText;
                console.log(data);
        }).catch((err) => {
            console.error(err);
        });

    }

    //Convert dataURL to imageBytes
    public dataURItoBlob(dataURI) {
        const image = atob(dataURI.split("data:image/png;base64,")[1]);
        var length = image.length;
        var imageBytes = new ArrayBuffer(length);
        var ua = new Uint8Array(imageBytes);
        for (var i = 0; i < length; i++) {
          ua[i] = image.charCodeAt(i);
        }
  
        return imageBytes;

     }
    
    //Call Rekognition API for Face Searching
    public SearchFace(imageBytes):
        Promise<PromiseResult<AWS.Rekognition.SearchFacesByImageResponse, AWS.AWSError>> {

            var params = {
                CollectionId: 'cx-demo-rekognition',
                Image: {
                    Bytes: imageBytes
                }
            };

            const rekognition = new AWS.Rekognition();

            return rekognition.searchFacesByImage(params).promise();

        }

    public ScanPassport(imageBytes):
        Promise<PromiseResult<AWS.Textract.DetectDocumentTextResponse, AWS.AWSError>> {

            var params = {
                Document: {
                    Bytes: imageBytes
                }
            };

            const textract = new Textract();

            return textract.detectDocumentText(params).promise();

        }
    
}

