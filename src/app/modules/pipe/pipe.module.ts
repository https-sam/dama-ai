import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IsPossibleMovePipe } from './is-possible-move/is-possible-move.pipe';



@NgModule({
  declarations: [
    IsPossibleMovePipe
  ],
  exports: [
    IsPossibleMovePipe
  ],
  imports: [
    CommonModule
  ]
})
export class PipeModule { }
