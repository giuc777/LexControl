import { Page, Locator } from '@playwright/test';

export class LoginPage {
    readonly usuarioInput: Locator;
    readonly contrasenaInput: Locator;
    readonly loginBtn: Locator;
    readonly errorAlert: Locator;

    constructor(private page: Page) {
        this.usuarioInput = page.locator('[data-testid="usuario"]');
        this.contrasenaInput = page.locator('[data-testid="contrasena"]');
        this.loginBtn = page.locator('[data-testid="btn-login"]');
        this.errorAlert = page.locator('[data-testid="login-error"]');
    }

    async navigate(): Promise<void> {
        await this.page.goto('/login');
    }

    async login(usuario: string, contrasena: string): Promise<void> {
        await this.usuarioInput.fill(usuario);
        await this.contrasenaInput.fill(contrasena);
        await this.loginBtn.click();
    }

    async getErrorText(): Promise<string> {
        return (await this.errorAlert.textContent()) ?? '';
    }
}
