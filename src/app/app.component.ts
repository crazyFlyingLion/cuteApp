import { Component, ViewChild, ElementRef} from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  title = 'lalala';

  @ViewChild("video", {static:false})
    public video: ElementRef;

    @ViewChild("canvas", {static:false})
    public canvas: ElementRef;

    public captures: Array<any>;

    public dataURL: Array<any>;

    public url: Array<any>;

    public constructor() {
        this.captures = [];
    }

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
        this.captures.push(this.canvas.nativeElement.toDataURL("data:image/png;base64"));
        var dataURL = this.canvas.nativeElement.toDataURL("data:image/png;base64").value;

      }
}

