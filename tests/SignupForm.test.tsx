import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignupForm from '../src/components/SignupForm/SignupForm';
import { useAuth } from '../src/services/auth';
import { setDoc } from 'firebase/firestore';

vi.mock('../src/services/auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../src/services/firebase', () => ({
  db: {},
  auth: {},
  default: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db, coll, id) => ({ path: `${coll}/${id}` })),
  setDoc: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);
const mockSetDoc = vi.mocked(setDoc);

describe('SignupForm', () => {
  const mockSignUp = vi.fn();
  const mockSignInWithGoogle = vi.fn();
  const mockLogout = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signUp: mockSignUp,
      signIn: vi.fn(),
      signInWithGoogle: mockSignInWithGoogle,
      logout: mockLogout,
    });
  });

  it('shows an error and does not call signUp if passwords do not match', async () => {
    render(<SignupForm onSuccess={mockOnSuccess} />);

    // Fill form with mismatched passwords
    fireEvent.change(screen.getByLabelText(/Nombre de usuario/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Correo Electrónico/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Contraseña$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirmar Contraseña/i), { target: { value: 'password456' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /^Crear Cuenta$/i }));

    // Assert that the error is displayed
    expect(screen.getByText(/Las contraseñas no coinciden/i)).toBeTruthy();

    // Assert signUp, setDoc, logout and onSuccess were NOT called
    expect(mockSignUp).not.toHaveBeenCalled();
    expect(mockSetDoc).not.toHaveBeenCalled();
    expect(mockLogout).not.toHaveBeenCalled();
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('registers successfully, writes email to Firestore, and logs out to prevent redirect', async () => {
    mockSignUp.mockResolvedValueOnce({
      user: { uid: 'user-123' },
    });
    mockSetDoc.mockResolvedValueOnce(undefined);
    mockLogout.mockResolvedValueOnce(undefined);

    render(<SignupForm onSuccess={mockOnSuccess} />);

    // Fill form with matching passwords
    fireEvent.change(screen.getByLabelText(/Nombre de usuario/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Correo Electrónico/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Contraseña$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirmar Contraseña/i), { target: { value: 'password123' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /^Crear Cuenta$/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    // Verify setDoc was called with matching UID, username, AND email
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'users/user-123' }),
      {
        uid: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      }
    );

    // Verify logout was called to prevent auto-login redirect
    expect(mockLogout).toHaveBeenCalled();

    // Verify onSuccess was triggered
    expect(mockOnSuccess).toHaveBeenCalledWith(
      '¡Usuario creado exitosamente! Ya puedes iniciar sesión.'
    );
  });
});
