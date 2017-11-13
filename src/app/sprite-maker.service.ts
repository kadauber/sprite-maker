import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/map';

export interface Sprite {
  id: number
  name: string
}

export interface Pixel {
  spriteId: number,
  position: number,
  color: string
}

export interface ServerResponse {
  message: string
}

export interface CreateSpriteResponse extends ServerResponse {
  record: Sprite;
}

export interface GetPixelsForSpriteResponse extends ServerResponse {
  records: Pixel[];
}

@Injectable()
export class SpriteMakerService {

  constructor(private http: Http) { }

  public getAllSprites: () => Observable<Sprite[]> = () => {
    let apiUrl = "http://kadauber.scripts.mit.edu/sprite-maker-api/sprite/read.php";
    return this.http.get(apiUrl)
    .map(res => {
      return res.json().records.map(sprite => {
        return {
          id: parseInt(sprite.id), 
          name: sprite.name
        } as Sprite;
      });
    });
  }

  public createSprite: (name: string) => Observable<CreateSpriteResponse> = (name: string) => {
    let apiUrl = "http://kadauber.scripts.mit.edu/sprite-maker-api/sprite/create.php";

    // Create a new sprite
    return this.http.post(apiUrl, {name: name}).map(res => res.json() as CreateSpriteResponse);
  }

  public renameSprite: (id: number, name: string) => Observable<ServerResponse> = (id: number, name: string) => {
    let apiUrl = "http://kadauber.scripts.mit.edu/sprite-maker-api/sprite/update.php";

    // Rename the sprite
    return this.http.post(apiUrl, {id: id, name: name}).map(res => res.json() as ServerResponse);
  }

  public deleteSprite: (id: number) => Observable<ServerResponse> = (id: number) => {
    let apiUrl = "http://kadauber.scripts.mit.edu/sprite-maker-api/sprite/delete.php";

    // Delete the sprite
    return this.http.post(apiUrl, {id: id}).map(res => res.json() as ServerResponse);
  }

  public initializePixels: (spriteId: number, pixelCount: number, pixelColor: string) => Observable<ServerResponse[]> = (spriteId, pixelCount, pixelColor) => {
    let apiUrl = "http://kadauber.scripts.mit.edu/sprite-maker-api/pixel/create.php";

    // create pixelCount pixels of pixelColor with positions 0..pixelCount
    let reqs: Observable<ServerResponse>[] = [];
    for (let pos = 0; pos < pixelCount; pos++) {
      let req = this.http.post(apiUrl, {spriteId: spriteId, position: pos, color: pixelColor}).map(res => res.json() as ServerResponse);
      reqs.push(req);
    }

    return Observable.forkJoin(reqs);
  }

  public getPixelsForSprite: (spriteId: number) => Observable<GetPixelsForSpriteResponse> = (spriteId) => {
    let apiUrl = "http://kadauber.scripts.mit.edu/sprite-maker-api/pixel/readForSprite.php";

    return this.http.get(apiUrl + "?id=" + spriteId).map(res => res.json() as GetPixelsForSpriteResponse);
  }

  public updatePixelsForSprite: (spriteId: number, pixelColors: string[]) => Observable<ServerResponse[]> = (spriteId, pixelColors) => {
    let apiUrl = "http://kadauber.scripts.mit.edu/sprite-maker-api/pixel/updateForSprite.php";

    let reqs: Observable<ServerResponse>[] = [];
    pixelColors.forEach((color, idx) => {
      reqs.push(this.http.post(apiUrl, {spriteId: spriteId, position: idx, color: color}).map(res => res.json() as ServerResponse))
    });

    return Observable.forkJoin(reqs);
  }

}
