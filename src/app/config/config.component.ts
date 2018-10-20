import { Component, OnInit } from '@angular/core';
import { MatButtonModule, MatToolbarModule } from '@angular/material';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.css'],
  providers: [ MatButtonModule, MatToolbarModule ]
})
export class ConfigComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
