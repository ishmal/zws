import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { 
	MatButtonModule, 
	MatIconModule,
	MatSlideToggleModule, 
	MatTabsModule, 
	MatToolbarModule } from '@angular/material';
import { MainComponent } from './main/main.component';
import { ConfigComponent } from './config/config.component';

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    ConfigComponent
  ],
  imports: [
    BrowserModule,
	BrowserAnimationsModule,
	MatButtonModule,
	MatIconModule,
	MatSlideToggleModule,
	MatTabsModule,
	MatToolbarModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
