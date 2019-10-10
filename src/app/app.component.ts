declare var MediaRecorder: any;

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

//   constructor(){
//         AWS.config.region = 'us-east-1'; // Region
//         AWS.config.credentials = new AWS.CognitoIdentityCredentials({
//             IdentityPoolId: 'us-east-1:a30e0d17-0ec6-4dac-8fba-de2695d2e738',
//         });
//     }

    @ViewChild("video", {static:false})
    public video: ElementRef;

    @ViewChild("audio", {static:false})
    public audio: ElementRef;

    @ViewChild("canvas", {static:false})
    public canvas: ElementRef;

    @ViewChild("bookingReference", {static:false})
    public bookingReference:ElementRef;

    public captures: Array<any>;

    public flightStatus: Promise<string>;

    public stream: any;

    chatMessages: Array<Messages> = [{
        Owner: 'ChatBot', 
        Message: 'Hello, I can help you to query tickets.'}];
    sessionAttributes = {};
    lexRuntime: AWS.LexRuntime;
    lexUserId = 'userID' + Date.now(); // Client application userID
    ChatInput = '';

    public ngOnInit() { 
        AWS.config.region = 'us-east-1'; // Region
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: 'us-east-1:a30e0d17-0ec6-4dac-8fba-de2695d2e738'
        });
    }

    public ngAfterViewInit() {
    }

    public capture_voice(){
        if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    const cuteMediaRecorder = new MediaRecorder(stream);
                    cuteMediaRecorder.start();

                    var audioChunks = [];
                    var audioLength = 0;

                    cuteMediaRecorder.addEventListener("dataavailable", event => {
                        audioChunks.push(event.data);
                        audioLength += audioChunks.length;
                    });
                
                    cuteMediaRecorder.addEventListener("stop", () => {
                        
                        console.log(audioChunks);
                        const audioBlob = new Blob(audioChunks, {type: 'audio/x-l16; sample-rate=16000'});
                        this.chat(audioBlob);
                        
                        //const audioUrl = URL.createObjectURL(audioBlob);
                        //const audio = new Audio(audioUrl);
                        //audio.play();
                    });
                
                    setTimeout(() => {
                      cuteMediaRecorder.stop();
                    }, 3000);
            });
        }
    }

    public chat(audio){

        this.lexRuntime = new AWS.LexRuntime();

        //if (data1.chatInput !== '') {
            //this.chatMessages.push({Owner: 'User', Message: data1.chatInput});
            this.ChatInput = '';
            const params = {
                botAlias: 'beta', // your bot's alias
                botName: 'SearchFlight', // your chatbot name 
                contentType: 'audio/x-l16; sample-rate=16000',
                userId: this.lexUserId,
                //inputText: "may i search for flight",
                accept: 'audio/mpeg',
                inputStream: audio
            };

            console.log(params);

            this.lexRuntime.postContent(params, (err, data) => {
                if (err) {
                   console.log(err, err.stack);
                }
                if (data) {
                   //this.sessionAttributes = data.sessionAttributes;
                   //this.chatMessages.push({Owner: 'Chatbot', Message: data.message});
                   console.log(data);
                   //console.log(data.message);
                }
            });
         //}
    }

    public change_cam_mode(){
        if( document.getElementById("video").hidden){
            if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
                    this.video.nativeElement.srcObject = stream;
                    this.video.nativeElement.play();
                });
            }
            document.getElementById("video").hidden = false;
        }else{
            document.getElementById("video").hidden = true;
            navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
                var tracks = stream.getTracks();

                tracks.forEach(function(track) {
                    track.stop();
                  });

                this.video.nativeElement.srcObject = null;
                this.video.nativeElement.pause();
            });
        }
    }

    //Capture Image 
    public async capture_face() {

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
                //element.innerHTML = data.FaceMatches[0].Face.ExternalImageId.replace('_', ' ').toUpperCase() + ' had been identified';
                element.innerHTML = this.formatName(data.FaceMatches[0].Face.ExternalImageId) + ' had been identified';
                console.log(data.FaceMatches[0].Face.ExternalImageId, ' had been identified');
                console.log('Given Name: ' + this.formatName(data.FaceMatches[0].Face.ExternalImageId).split(' ')[0] + ' || Surename: ' + this.formatName(data.FaceMatches[0].Face.ExternalImageId).split(' ')[1]);
                
                this.flightStatus = this.retrieveBooking(this.bookingReference.nativeElement.value, this.formatName(data.FaceMatches[0].Face.ExternalImageId).split(' ')[1], this.formatName(data.FaceMatches[0].Face.ExternalImageId).split(' ')[0]);
                //document.getElementById('status').innerHTML = this.flightStatus.toString();
                //console.log(status);

                // var flightDetails = bookingDetails.journeys[0].passengers[0].flights[0];
                // console.log(flightDetails);

                // document.getElementById('status').innerHTML = flightDetails.operateCompany + flightDetails.operateFlightNumber + " is your flight upcoming flight. " + "This flight will be departure from " + flightDetails.originPort + " to " + flightDetails.destPort + " at " + flightDetails.depatureTime + ". ";

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

    public formatName(string) {
        return string.split('_')[0].charAt(0).toUpperCase() + string.split('_')[0].slice(1) + " " + string.split('_')[1].charAt(0).toUpperCase() + string.split('_')[1].slice(1);
    }

    public async retrieveBooking(rloc, familyName, givenName){
        console.log(rloc, familyName, givenName);

        var url = "https://t0.api.osc1.ct1.cathaypacific.com/hackathon-apigw/api/v1/olci/getBooking?" + "rloc=" + rloc + "&familyName=" + familyName + "&givenName=" + givenName;
        console.log(url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': 'mP7WtIx8eiscnk3aHnHAYC3voaWsWxx2'
            }
        });

        var result = await response.json();

        console.log(result);

        var flightDetails = result.journeys[0].passengers[0].flights[0];

        var status = flightDetails.operateCompany + flightDetails.operateFlightNumber + " is your upcoming flight. " + "This flight will be departure from " + flightDetails.originPort + " to " + flightDetails.destPort + " at " + flightDetails.departureTime + ". ";

        document.getElementById('status').innerHTML = status;

        return status;

    }

    //Post the check in api request
    public async check_in(rloc, familyName, givenName){
        console.log(rloc, familyName, givenName);

        var url = "https://t0.api.osc1.ct1.cathaypacific.com/hackathon-apigw/api/v1/olci/getBooking?" + "rloc=" + rloc + "&familyName=" + familyName + "&givenName=" + givenName;
        console.log(url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': 'mP7WtIx8eiscnk3aHnHAYC3voaWsWxx2'
            }
        });

        var result = await response.json();

        console.log(result);

        var flightDetails = result.journeys[0].passengers[0].flights[0];

        var status = flightDetails.operateCompany + flightDetails.operateFlightNumber + " is your upcoming flight. " + "This flight will be departure from " + flightDetails.originPort + " to " + flightDetails.destPort + " at " + flightDetails.departureTime + ". ";

        document.getElementById('status').innerHTML = status;

        return status;

    }
}

export interface Messages {
    Owner:string;
    Message:string;
}



//  // Unused Code
//  // public capture_passport() {
    //     var context = this.canvas.nativeElement.getContext("2d").drawImage(this.video.nativeElement, 0, 0, 640, 480);

    //     this.captures = [];
    //     this.captures.push(this.canvas.nativeElement.toDataURL("data:image/png;base64"));
    //     //console.log(this.captures);

    //     var dataURI = this.canvas.nativeElement.toDataURL("data:image/png;base64");
    //     //console.log(dataURI);

    //     var element = document.getElementById("msg");
    //     element.innerHTML = "Processing Image...";

    //     this.ScanPassport(this.dataURItoBlob(dataURI)).then(
    //         (data) => {
    //             var scannedText = "";
    //             for (var i = 0; i < data.Blocks.length; i++) {
    //                     if (i !== (data.Blocks.length - 1)) {
    //                         if (i !== 0){
    //                             scannedText += "[" + i + "] " + data.Blocks[i].Text + ", ";
    //                         }
    //                     }
    //                     else {
    //                         scannedText += "[" + i + "] " + data.Blocks[i].Text
    //                     }
    //             }
    //             element.innerHTML = "Scanned Text: " + scannedText;
    //             console.log(data);
    //     }).catch((err) => {
    //         console.error(err);
    //     });

    // }

    // public ScanPassport(imageBytes):
    //     Promise<PromiseResult<AWS.Textract.DetectDocumentTextResponse, AWS.AWSError>> {

    //         var params = {
    //             Document: {
    //                 Bytes: imageBytes
    //             }
    //         };

    //         const textract = new Textract();

    //         return textract.detectDocumentText(params).promise();

    //     }

