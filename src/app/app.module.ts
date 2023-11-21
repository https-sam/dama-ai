import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GameModule } from './modules/game/game.module';
import { PieceModule } from './modules/piece/piece.module';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    GameModule,
    PieceModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
