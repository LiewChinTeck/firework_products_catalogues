import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
@Component({selector:'app-login',imports:[FormsModule,RouterLink],templateUrl:'./login.html',styleUrl:'./login.css',changeDetection:ChangeDetectionStrategy.OnPush})
export class Login {
 private readonly auth = inject(AuthService);
 private readonly router = inject(Router);
 private readonly route = inject(ActivatedRoute);
 username = ''; password = '';
 readonly showPassword = signal(false);
 readonly error = signal('');
 login(form: NgForm): void {
  this.error.set('');
  if (form.invalid) { form.control.markAllAsTouched(); this.error.set('Enter your username and password.'); return; }
  if (!this.auth.login(this.username,this.password)) { this.error.set('Invalid username or password.'); return; }
  const target = this.route.snapshot.queryParamMap.get('returnUrl');
  void this.router.navigateByUrl(target === '/admin/manage' ? target : '/admin');
 }
}
