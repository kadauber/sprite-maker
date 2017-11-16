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
  edgeCount: number[] = [];
  sprites: Sprite[];
  currentSpriteId: number;
  currentSpriteName: string;
  currentPixels: Pixel[];

  moduleName: string = "";
  innerSpriteId: number;
  outerSpriteId: number;
  innerSpritePixels: Pixel[];
  outerSpritePixels: Pixel[];

  status: string = "Ready";

  constructor(private spriteMakerService: SpriteMakerService) {
    this.status = "Starting up...";

    // populate sprites from the database
    this.spriteMakerService.getAllSprites().subscribe(sprs => {
      this.refreshSpriteList(sprs);
      this.currentSpriteId = this.sprites[0].id;
      this.innerSpriteId = this.sprites[0].id;
      this.outerSpriteId = this.sprites[1].id;

      this.refreshName();
      this.refreshCurrentPixels();
      this.refreshInnerSpritePixels();
      this.refreshOuterSpritePixels();

      this.status = "Ready";
    });
    
    // initialize a list of numbers 0..EDGE to iterate on
    let edgeIdx = 0;
    while (edgeIdx < this.EDGE) {
      this.edgeCount.push(edgeIdx);
      edgeIdx++;
    }
  }

  getPixelColor: (pixels: Pixel[], row: number, col: number) => string = (pixels, row, col) => {
    if (pixels) {
      return pixels.find(pix => pix.position == row * this.EDGE + col).color;
    } else {
      return "#000";
    }
  }

  setPixelColor: ($event: MouseEvent, pixels, row: number, col: number) => void = ($event, pixels, row, col) => {
    if ($event.buttons == 1) {
      pixels.find(pix => pix.position == row * this.EDGE + col).color = this.selectedColor;
    }
  }

  getSpriteVerilog: (Pixels: Pixel[], indent: number) => string = (pixels, indent = 0) => {
    let rowIdx = 0;
    let colIdx = 0;

    let verilog = " ".repeat(indent) + "if (vcount == y && hcount == x) pixel <= " + this.makeVerilogColor(pixels,rowIdx,colIdx) + ";\n";    
    colIdx++;

    while (rowIdx < this.EDGE) {
      while (colIdx < this.EDGE) {

        let line = 
          " ".repeat(indent) 
          + "else if (vcount == y + "
          + rowIdx 
          + " && hcount == x + " 
          + colIdx + ") pixel <= " 
          + this.makeVerilogColor(pixels,rowIdx,colIdx)
          + ";\n";

          verilog = verilog + line;
        colIdx++;
      }

      colIdx = 0;
      rowIdx++;
    }

    return verilog + " ".repeat(indent) + "else pixel <= 12'h000;";
  }

  private makeVerilogColor: (pixels: Pixel[], row:number, col:number) => string = (pixels: Pixel[], row: number, col: number) => {
    return "12'h" + this.getPixelColor(pixels,row,col).substring(1);
  }

  renameSprite: (id: number, name: string) => void = (id: number, name: string) => {
    this.status = "Renaming sprite";
    this.spriteMakerService.renameSprite(this.currentSpriteId, this.currentSpriteName).subscribe(res => {
      this.spriteMakerService.getAllSprites().subscribe(sprs => {
        this.refreshSpriteList(sprs);
        this.status = "Ready";
      });
    });
  }

  createSprite: () => void = () => {
    this.status = "Creating sprite";

    this.spriteMakerService.createSprite("untitled").subscribe(res => {
      this.currentSpriteId = res.record.id;

      this.spriteMakerService.getAllSprites().subscribe(sprs => {
        this.refreshSpriteList(sprs);
        this.refreshName();

        this.status = "Ready";
      });

      this.spriteMakerService.initializePixels(res.record.id, this.EDGE * this.EDGE, "#000").subscribe(res => {
        this.refreshCurrentPixels();
      });
    });
  }

  copySprite: () => void = () => {
    this.status = "Copying sprite";
    this.spriteMakerService.createSprite("copy of " + this.currentSpriteName).subscribe(res => {
      this.currentSpriteId = res.record.id;

      this.status = "Refreshing sprite list";
      this.spriteMakerService.getAllSprites().subscribe(sprs => {
        this.refreshSpriteList(sprs);
        this.refreshName();
        this.status = "Ready";
      });

      this.status = "Initializing pixels";
      this.spriteMakerService.initializePixels(res.record.id, this.EDGE * this.EDGE, "#000").subscribe(res => {
        
        this.status = "Copying pixels";

        this.spriteMakerService.getPixelsForSprite(this.currentSpriteId).subscribe(res => {
          this.currentPixels = res.records;
          this.savePixels();
          this.status = "Ready";
        });
      });
    });
  }

  deleteSprite: () => void = () => {
    this.status = "Deleting sprite";
    this.spriteMakerService.deleteSprite(this.currentSpriteId).subscribe(res => {
      this.status = "Refreshing sprite list";
      this.spriteMakerService.getAllSprites().subscribe(sprs => {
        this.refreshSpriteList(sprs);

        let lastSprite = this.sprites.reduce((acc, cur) => acc.name > cur.name ? acc : cur);
        // if this was the last sprite in the list, pick the new last one
        if (this.currentSpriteName > lastSprite.name) {
          this.currentSpriteId = lastSprite.id;
        }
        // but usually pick the one right below the one we just deleted
        else {
          let nextSprite = this.sprites.find(spr => spr.name > this.currentSpriteName);
          this.currentSpriteId = nextSprite.id;
        }

        this.refreshName();
        this.refreshCurrentPixels();
        this.status = "Ready";
      })
    })
  }

  savePixels: () => void = () => {
    this.status = "Saving pixels";
    this.spriteMakerService.savePixels(this.currentPixels).subscribe(res => {
      this.status = "Ready";
    });
  }

  rotatePixels: () => void = () => {
    // position: row * EDGE + col
    // row,col
    // 0,0 -> 15,0 (0->240)
    // 0,15 -> 0,0 (15->0)
    // 15,0 -> 15,15 (240->255)
    // 15,15 -> 0,15 (255->15)

    // 0,1 -> 14,0
    // 0,2 -> 13,0
    // 1,1 -> 14,1
    // 1,13 -> 2,1
    // 14,13 -> 2,14

    let newPositionToColorMap: Map<number,string> = new Map<number,string>();

    this.currentPixels.forEach(pix => {
      let row = Math.floor(pix.position / this.EDGE);
      let col = pix.position - row * this.EDGE;
      
      let newRow = 15 - col;
      let newCol = row;

      newPositionToColorMap.set(newRow * this.EDGE + newCol, pix.color);
    });

    newPositionToColorMap.forEach((newColor,newPosition) => {
      this.currentPixels.find(pix => pix.position == newPosition).color = newColor;
    });
  }

  onSpritePickerChange: (event: Event) => void = (e) => {
    this.refreshName();
    this.refreshCurrentPixels();
  }

  onInnerSpriteChange: (event: Event) => void = (e) => {
    this.refreshInnerSpritePixels();
  }

  onOuterSpriteChange: (event: Event) => void = (e) => {
    this.refreshOuterSpritePixels();
  }
  
  private refreshName: () => void = () => {
    this.currentSpriteName = this.sprites.find(s => s.id == this.currentSpriteId).name;
  }

  private refreshCurrentPixels: () => void = () => {
    this.status = "Refreshing pixels";
    this.spriteMakerService.getPixelsForSprite(this.currentSpriteId).subscribe(res => {
      this.currentPixels = res.records;

      this.status = "Ready";
    });
  }

  private refreshInnerSpritePixels: () => void = () => {
    this.status = "Refreshing inner pixels";
    this.spriteMakerService.getPixelsForSprite(this.innerSpriteId).subscribe(res => {
      this.innerSpritePixels = res.records;

      this.status = "Ready";
    });
  }

  private refreshOuterSpritePixels: () => void = () => {
    this.status = "Refreshing outer pixels";
    this.spriteMakerService.getPixelsForSprite(this.outerSpriteId).subscribe(res => {
      this.outerSpritePixels = res.records;

      this.status = "Ready";
    });
  }

  private refreshSpriteList: (sprs: Sprite[]) => void = (sprs) => {
    this.sprites = sprs.sort((a,b) => a.name > b.name ? 1 : -1);    
  } 
}
