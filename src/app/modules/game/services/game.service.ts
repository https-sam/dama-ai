import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { gameConfig } from '../game-config';

@Injectable({
  providedIn: 'root'
})
export class GameService {

  private _piecesPositionsFEN: BehaviorSubject<string> = new BehaviorSubject<string>(gameConfig.initialPiecesPositionsFEN);

  public piecesPositionsFEN$: Observable<string> = this._piecesPositionsFEN.asObservable();


  public setPiecesPositionsFEN(fen: string): void {
    this._piecesPositionsFEN.next(fen);
  }
}
