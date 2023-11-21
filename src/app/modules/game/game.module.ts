import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameComponent } from './components/game.component';
import { PieceModule } from '../piece/piece.module';



@NgModule({
  declarations: [
    GameComponent
  ],
  exports: [
    GameComponent
  ],
  imports: [
    CommonModule,
    PieceModule
  ]
})
export class GameModule { }
