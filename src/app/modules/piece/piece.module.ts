import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PieceComponent } from './components/piece.component';



@NgModule({
  declarations: [
    PieceComponent
  ],
  exports: [
    PieceComponent
  ],
  imports: [
    CommonModule
  ]
})
export class PieceModule { }
