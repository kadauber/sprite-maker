import { Component } from '@angular/core';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private readonly EDGE: number = 16;

  selectedColor: string = "#FF0";
  pixelColors: string[] = [];
  edgeCount: number[] = [];

  constructor() {
    let pixColorIdx = 0;
    while (pixColorIdx < this.EDGE * this.EDGE) {
      this.pixelColors.push("#000");
      pixColorIdx++;
    }
    
    let edgeIdx = 0;
    while (edgeIdx < this.EDGE) {
      this.edgeCount.push(edgeIdx);
      edgeIdx++;
    }
  }

  setPixelColor: (x: number, y: number) => void = (x, y) => {
    this.pixelColors[x * this.EDGE + y] = this.selectedColor;
  }

  getVerilog: () => string = () => {
    let verilog = "";

    let xIdx = 0;
    let yIdx = 0;

    while (xIdx < this.EDGE) {

      verilog = verilog + "if (hcount == x + " + xIdx + ") begin";

      while (yIdx < this.EDGE) {

        verilog = verilog + "\n   if (vcount == y + " + yIdx + ") pixel <= " + this.pixelColors[xIdx * this.EDGE + yIdx] + ";";

        yIdx++;
      }
      verilog = verilog + "\nend\n";

      yIdx = 0;
      xIdx++;
    }

    return verilog;
  }
}
