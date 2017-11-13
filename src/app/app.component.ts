import { Component } from '@angular/core';
import { Sprite, Pixel, SpriteMakerService } from './sprite-maker.service';
import { Observable } from 'rxjs';

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
  sprites: Sprite[];
  currentSpriteId: number;
  currentSpriteName: string;
  currentPixels: Pixel[];

  constructor(private spriteMakerService: SpriteMakerService) {
    // populate spriteSubscription from the database
    this.spriteMakerService.getAllSprites().subscribe(sprs => {
      this.sprites = sprs.sort((a,b) => a.name > b.name ? 1 : -1);
      this.currentSpriteId = this.sprites[0].id;

      this.refreshName();
      this.refreshPixels();
    });

    if (this.pixelColors.length == 0) {
      // initialize all the pixels to be black
      let pixColorIdx = 0;
      while (pixColorIdx < this.EDGE * this.EDGE) {
        this.pixelColors.push("#000");
        pixColorIdx++;
      }
    }
    
    // initialize a list of numbers 0..EDGE to iterate on
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
    let verilog = "      if (hcount == x && vcount == y) pixel <= " + this.makeVerilogColor(0,0) + ";";
    
    let xIdx = 0;
    let yIdx = 1;

    while (xIdx < this.EDGE) {
      while (yIdx < this.EDGE) {

        verilog = verilog 
          + "\n      else if (hcount == x + " 
          + xIdx 
          + " && vcount == y + " 
          + yIdx + ") pixel <= " 
          + this.makeVerilogColor(xIdx,yIdx)
          + ";";

        yIdx++;
      }

      yIdx = 0;
      xIdx++;
    }

    return verilog + "\n      else pixel <= 12'h000;";
  }

  private makeVerilogColor: (x:number, y:number) => string = (x: number, y: number) => {
    return "12'h" + this.pixelColors[x * this.EDGE + y].substring(1);
  }

  renameSprite: (id: number, name: string) => void = (id: number, name: string) => {
    this.spriteMakerService.renameSprite(this.currentSpriteId, this.currentSpriteName).subscribe(res => {
      this.spriteMakerService.getAllSprites().subscribe(sprs => this.sprites = sprs);
    });
  }

  createSprite: () => void = () => {
    this.spriteMakerService.createSprite("untitled").subscribe(res => {
      this.currentSpriteId = res.record.id;

      this.spriteMakerService.getAllSprites().subscribe(sprs => {
        this.sprites = sprs;
        this.refreshName();
      });

      this.spriteMakerService.initializePixels(res.record.id, this.EDGE * this.EDGE, "#000").subscribe(res => {
        this.refreshPixels();
      });
    });
  }

  copySprite: () => void = () => {
    this.spriteMakerService.createSprite("copy of " + this.currentSpriteName).subscribe(res => {
      this.currentSpriteId = res.record.id;

      this.spriteMakerService.getAllSprites().subscribe(sprs => {
        this.sprites = sprs;
        this.refreshName();
      });

      this.spriteMakerService.initializePixels(res.record.id, this.EDGE * this.EDGE, "#000").subscribe(res => {
        this.spriteMakerService.getPixelsForSprite(this.currentSpriteId).subscribe(res => {
          this.currentPixels = res.records;
          res.records.forEach(pix => pix.color = this.pixelColors[pix.position]);
          this.savePixels();
        });
      });
    });
  }

  deleteSprite: () => void = () => {
    this.spriteMakerService.deleteSprite(this.currentSpriteId).subscribe(res => {
      this.spriteMakerService.getAllSprites().subscribe(sprs => {
        this.sprites = sprs;

        let lastSprite = this.sprites.reduce((acc, cur) => acc.id > cur.id ? acc : cur);
        // if this was the last sprite in the list, pick the new last one
        if (this.currentSpriteId > lastSprite.id) {
          this.currentSpriteId = lastSprite.id;
          this.currentSpriteName = lastSprite.name;
        }
        // but usually pick the one right below the one we just deleted
        else {
          let nextSprite = this.sprites.find(spr => spr.id > this.currentSpriteId);
          this.currentSpriteId = nextSprite.id;
          this.currentSpriteName = nextSprite.name;
        }

        this.refreshName();
        this.refreshPixels();
      })
    })
  }

  savePixels: () => void = () => {
    this.pixelColors.forEach((color, idx) => {
      this.currentPixels.find(p => p.position == idx).color = color;
    });
    this.spriteMakerService.savePixels(this.currentPixels).subscribe();
  }

  onSpritePickerChange: (event: Event) => void = (e) => {
    this.refreshName();
    this.refreshPixels();
  }

  private refreshName: () => void = () => {
    this.currentSpriteName = this.sprites.find(s => s.id == this.currentSpriteId).name;
  }

  private refreshPixels: () => void = () => {
    this.spriteMakerService.getPixelsForSprite(this.currentSpriteId).subscribe(res => {
      this.currentPixels = res.records;

      let orderedColors: string[] = [];
      res.records.forEach(pix => orderedColors[pix.position] = pix.color);
      this.pixelColors = orderedColors;
    });
  }
}
