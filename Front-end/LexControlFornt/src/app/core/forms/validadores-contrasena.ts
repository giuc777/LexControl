import { AbstractControl, ValidationErrors } from '@angular/forms';

/* Validadores de contraseña compartidos (Seguridad y cambio obligatorio).
   Política del backend (api.md §4.2): mínimo 8 caracteres,
   al menos un dígito y un carácter especial. */
export function politicaContrasena(control: AbstractControl): ValidationErrors | null {
    const valor = String(control.value ?? '');
    if (valor === '') return null;

    if (valor.length < 8) return { politica: 'La contraseña debe tener al menos 8 caracteres.' };
    if (!/\d/.test(valor)) return { politica: 'La contraseña debe incluir al menos un número.' };
    if (!/[^A-Za-z0-9]/.test(valor)) return { politica: 'La contraseña debe incluir al menos un carácter especial.' };

    return null;
}

/* Validador de grupo: la confirmación debe coincidir con la nueva
   contraseña y esta no puede ser igual a la actual. */
export function confirmacionCoincide(group: AbstractControl): ValidationErrors | null {
    const actual = group.get('contrasenaActual')?.value;
    const nueva = group.get('contrasenaNueva')?.value;
    const confirma = group.get('confirmacion')?.value;

    if (nueva && actual && nueva === actual) {
        return { igualActual: 'La nueva contraseña no puede ser igual a la actual.' };
    }
    if (nueva && confirma && nueva !== confirma) {
        return { noCoincide: 'La confirmación no coincide con la nueva contraseña.' };
    }
    return null;
}
