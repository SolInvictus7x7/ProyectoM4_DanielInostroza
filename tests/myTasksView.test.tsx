/**
 * Tests for src/pages/dashboard/views/MyTasksView.tsx
 *
 * Strategy:
 *  - Mock firebase/firestore so no real Firestore connection is required.
 *    vi.mock is hoisted to the top of the file, so we cannot reference
 *    local variables inside the factory — we use vi.fn() directly and
 *    retrieve the spy via vi.mocked() after the import.
 *  - Mock src/services/auth (useAuth) to inject a fake logged-in user.
 *  - Mock src/services/firebase so initializeApp() never runs.
 *  - Render <MyTasksView /> and assert the correct tasks appear in the DOM.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Task, Group, UserProfile } from '../src/types';

// ── Firestore mock ────────────────────────────────────────────────────────────
// vi.mock is hoisted — do NOT reference outer `const` vars inside the factory.
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn((_db: unknown, name: string) => ({ _name: name })),
  query: vi.fn((...args: unknown[]) => args),
  where: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  arrayRemove: vi.fn(),
}));

// ── Firebase app mock (prevents initializeApp errors) ────────────────────────
vi.mock('../src/services/firebase', () => ({
  db: {},
  auth: {},
  default: {},
}));

// ── Auth mock ─────────────────────────────────────────────────────────────────
vi.mock('../src/services/auth', () => ({
  useAuth: vi.fn(),
}));

// ── Import after mocks ────────────────────────────────────────────────────────
import MyTasksView from '../src/pages/dashboard/views/MyTasksView';
import { useAuth } from '../src/services/auth';
import { getDocs } from 'firebase/firestore';

// Typed references to the spies
const mockGetDocs = vi.mocked(getDocs);
const mockUseAuth = vi.mocked(useAuth);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const FAKE_USER = { uid: 'user-001', email: 'test@example.com', displayName: 'Test User' };

const FAKE_GROUPS: Group[] = [
  {
    gid: 'group-001',
    title: 'Grupo Alpha',
    'admin-uid': ['user-001'],
    members: ['user-001'],
    tasks: ['task-001', 'task-002'],
  },
];

const FAKE_TASKS: Task[] = [
  {
    tid: 'task-001',
    title: 'Diseñar base de datos',
    description: 'Modelar colecciones de Firestore',
    complete: false,
    'created-at': { toDate: () => new Date('2024-01-01') } as any,
    'assigned-to': 'group-001',
    members: [], // whole-group task → visible to every member
  },
  {
    tid: 'task-002',
    title: 'Crear componente Sidebar',
    description: 'Nav links y logout',
    complete: true,
    'created-at': { toDate: () => new Date('2024-01-02') } as any,
    'assigned-to': 'group-001',
    members: ['user-001'], // explicitly assigned to our user
  },
];

const FAKE_USERS: UserProfile[] = [
  { uid: 'user-001', username: 'testuser', email: 'test@example.com' },
];

/** Converts an array into a mock Firestore QuerySnapshot shape */
function makeSnap<T>(items: T[]) {
  return {
    empty: items.length === 0,
    docs: items.map((data) => ({ data: () => data })),
  } as any;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MyTasksView — task fetching', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: FAKE_USER as any,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signInWithGoogle: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('shows a spinner while loading', () => {
    // getDocs never resolves → component stays in loading state
    mockGetDocs.mockReturnValue(new Promise(() => {}) as any);

    render(
      <MemoryRouter>
        <MyTasksView />
      </MemoryRouter>,
    );

    expect(document.querySelector('.page-spinner')).toBeTruthy();
  });

  it('fetches tasks from Firestore and renders them in the DOM', async () => {
    /**
     * getDocs is called three times inside fetchMyTasks:
     *   1st → groups collection (find the user's groups)
     *   2nd → tasks collection  (tasks assigned to those groups)
     *   3rd → users collection  (member profiles for TaskCard dropdowns)
     */
    mockGetDocs
      .mockResolvedValueOnce(makeSnap(FAKE_GROUPS))  // 1. groups
      .mockResolvedValueOnce(makeSnap(FAKE_TASKS))   // 2. tasks
      .mockResolvedValueOnce(makeSnap(FAKE_USERS));  // 3. member users

    render(
      <MemoryRouter>
        <MyTasksView />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Diseñar base de datos')).toBeTruthy();
    });

    // Both tasks should be visible
    expect(screen.getByText('Diseñar base de datos')).toBeTruthy();
    expect(screen.getByText('Crear componente Sidebar')).toBeTruthy();

    // Group section header must appear
    expect(screen.getByText('Grupo Alpha')).toBeTruthy();
  });

  it('shows the empty-state message when the user has no groups', async () => {
    mockGetDocs
      .mockResolvedValueOnce(makeSnap([]))  // groups — empty, early return

    render(
      <MemoryRouter>
        <MyTasksView />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/No tienes tareas asignadas/i)).toBeTruthy();
    });
  });

  it('filters out tasks assigned only to other users', async () => {
    const otherUserTask: Task = {
      tid: 'task-999',
      title: 'Tarea de otro usuario',
      description: 'Solo para user-999',
      complete: false,
      'created-at': { toDate: () => new Date() } as any,
      'assigned-to': 'group-001',
      members: ['user-999'], // NOT our user-001
    };

    mockGetDocs
      .mockResolvedValueOnce(makeSnap(FAKE_GROUPS))        // 1. groups
      .mockResolvedValueOnce(makeSnap([otherUserTask]))    // 2. tasks
      .mockResolvedValueOnce(makeSnap(FAKE_USERS));        // 3. member users

    render(
      <MemoryRouter>
        <MyTasksView />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/No tienes tareas asignadas/i)).toBeTruthy();
    });

    expect(screen.queryByText('Tarea de otro usuario')).toBeNull();
  });
});
