import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
@Component({ selector: 'app-root', imports: [RouterLink, RouterLinkActive, RouterOutlet], templateUrl: './app.html', styleUrl: './app.css', changeDetection: ChangeDetectionStrategy.OnPush })
export class App {
 readonly auth = inject(AuthService);
 private readonly router = inject(Router);
 readonly year = new Date().getFullYear();
 logout(): void { this.auth.logout(); void this.router.navigateByUrl('/'); }
}
