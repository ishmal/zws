import { Component, OnInit, AfterViewInit } from '@angular/core';
import { MatButtonModule, MatSlideToggleModule,
	 MatToolbarModule } from '@angular/material';
import { GlobalsService } from '../globals.service';
import { Zws } from "../../lib/zws";

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css'],
  providers: [ MatButtonModule, MatSlideToggleModule, MatToolbarModule ]
})
export class MainComponent implements OnInit, AfterViewInit {

	private globals: GlobalsService;
	private zws: any;

	constructor(globals: GlobalsService) { 
		this.globals = globals;
	}

	ngOnInit() {
	}

	ngAfterViewInit() {
		this.zws = new Zws();
		this.globals.zws = this.zws;
	}

	doStart() {
		console.log("hello bob");
		this.zws.start();
	}

	doToggleRun(event) {
		if (event.checked) {
			this.zws.start();
		} else {
			this.zws.stop();
		}
	}

}
