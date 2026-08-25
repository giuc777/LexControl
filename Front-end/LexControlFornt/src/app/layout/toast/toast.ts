import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ToastService } from './toast-service';

@Component({
    selector: 'app-toast',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: '<div class="lex-toast" [class.show]="toast.visible()" role="status">{{ toast.mensaje() }}</div>'
})
export class Toast {
    readonly toast = inject(ToastService);
}
