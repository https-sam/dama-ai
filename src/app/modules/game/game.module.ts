import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameComponent } from './components/game.component';
import { PieceModule } from '../piece/piece.module';
import { PipeModule } from '../pipe/pipe.module';



@NgModule({
  declarations: [
    GameComponent
  ],
  exports: [
    GameComponent
  ],
  imports: [
    CommonModule,
    PieceModule,
    PipeModule
  ]
})
export class GameModule { }
