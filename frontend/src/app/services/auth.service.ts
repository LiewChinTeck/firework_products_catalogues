import { Injectable, signal } from '@angular/core';
// Local demo access only. Replace with server authentication before public deployment.
@Injectable({providedIn:'root'})
export class AuthService {
 private readonly state = signal(this.restore());
 readonly loggedIn = this.state.asReadonly();
 private restore(): boolean { try { return sessionStorage.getItem('glowfest.demo-session') === 'true'; } catch { return false; } }
 login(username: string, password: string): boolean {
  if (username.trim() !== 'admin' || password !== '1234') return false;
  this.state.set(true); try { sessionStorage.setItem('glowfest.demo-session','true'); } catch { /* Access remains available for this page session. */ }
  return true;
 }
 logout(): void { this.state.set(false); try { sessionStorage.removeItem('glowfest.demo-session'); } catch { /* In-memory state is cleared. */ } }
}
