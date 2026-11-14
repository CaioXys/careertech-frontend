import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { applyTheme } from './core/theme.js';
import './styles/reset.css';
import './styles/tokens.css';
import './styles/base.css';

applyTheme();

bootstrapApplication(AppComponent).catch((error: unknown) => console.error(error));
