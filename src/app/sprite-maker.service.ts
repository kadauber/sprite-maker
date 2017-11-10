import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/map';

interface Sprite {
  id: number
  name: string
}

interface ServerResponse {
  message: string
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

  public createSprite: (name: string) => Observable<ServerResponse> = (name: string) => {
    let apiUrl = "http://kadauber.scripts.mit.edu/sprite-maker-api/sprite/create.php";

    // Create a new sprite
    return this.http.post(apiUrl, {name: name})
      .map(res => {
        return res.json() as ServerResponse;
      });
  }

  public renameSprite: (name: string) => Observable<ServerResponse> = (name: string) => {
    let apiUrl = "http://kadauber.scripts.mit.edu/sprite-maker-api/sprite/update.php";

    // Rename the sprite
    return this.http.post(apiUrl, {name: name})
      .map(res => {
        return res.json() as ServerResponse;
      });
  }

}
