import { Component } from '@angular/core';
import { Globals } from '../globals';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage {
	private globals: Globals;

	doStart() {
		console.log("hello bob");
		this.globals.zws.start();
	}
}
