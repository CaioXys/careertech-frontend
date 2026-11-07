import { Component, OnInit } from '@angular/core';
import { startRouter } from './legacy-router';

@Component({
  selector: 'app-root',
  standalone: true,
  template: '<div id="app"></div>',
})
export class AppComponent implements OnInit {
  ngOnInit(): void {
    startRouter();
  }
}
