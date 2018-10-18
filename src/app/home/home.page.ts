import { Component, OnInit } from '@angular/core';
import { Zws } from '../../lib/zws';
import { GlobalsService } from '../globals.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage implements OnInit {
	private globals: GlobalsService;

	constructor(globals: GlobalsService) {
		this.globals = globals;
	}

	doStart() {
		console.log("hello bob");
		this.globals.zws.start();
	}

	ngOnInit() {
		this.globals.zws = new Zws();
	}
}
