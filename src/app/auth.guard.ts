import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
export const authGuard: CanActivateFn = (_, state) => inject(AuthService).loggedIn() || inject(Router).createUrlTree(['/login'],{queryParams:{returnUrl:state.url}});
