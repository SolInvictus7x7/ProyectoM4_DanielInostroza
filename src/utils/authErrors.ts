// Maps Firebase error codes to friendly Spanish messages
export function getLoginError(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'El correo o la contraseña son incorrectos.';
    case 'auth/wrong-password':
      return 'Contraseña incorrecta. Intenta de nuevo.';
    case 'auth/invalid-email':
      return 'El formato del correo no es válido.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Espera un momento.';
    case 'auth/user-disabled':
      return 'Esta cuenta ha sido deshabilitada.';
    default:
      return 'Ocurrió un error inesperado. Intenta de nuevo.';
  }
}

export function getSignupError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Este correo ya tiene una cuenta asociada.';
    case 'auth/invalid-email':
      return 'El formato del correo no es válido.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera un momento.';
    default:
      return 'Ocurrió un error inesperado. Intenta de nuevo.';
  }
}
