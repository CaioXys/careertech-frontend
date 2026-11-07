import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import './styles/reset.css';
import './styles/tokens.css';
import './styles/base.css';

bootstrapApplication(AppComponent).catch((error: unknown) => console.error(error));
