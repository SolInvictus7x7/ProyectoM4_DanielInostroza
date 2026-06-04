import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoist the spy so it's available inside vi.mock() factory ─────────────────
const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }));

// ── AWS SDK mock ──────────────────────────────────────────────────────────────
vi.mock('@aws-sdk/client-ses', () => {
  return {
    SESClient: class {
      send = mockSend;
    },
    SendEmailCommand: class {
      constructor(public input: Record<string, unknown>) { }
    },
  };
});

// ── Load handler AFTER mocks are in place ────────────────────────────────────
const { default: handler } = await import('../api/send-email');

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReq(body: Record<string, string>, method = 'POST') {
  return { method, body } as any;
}

function makeRes() {
  const res = {
    _status: 0,
    _body: {} as any,
    status(code: number) { res._status = code; return res; },
    json(body: any) { res._body = body; return res; },
  };
  return res;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('api/send-email handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'test-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
    process.env.SES_FROM_EMAIL = 'noreply@example.com';
  });

  it('rejects non-POST requests with 405', async () => {
    const res = makeRes();
    await handler(makeReq({}, 'GET'), res as any);
    expect(res._status).toBe(405);
    expect(res._body.error).toBe('Method Not Allowed');
  });

  it('returns 400 when "to" or "summary" fields are missing', async () => {
    const res = makeRes();
    await handler(makeReq({ to: 'someone@example.com' }), res as any);
    expect(res._status).toBe(400);
    expect(res._body.error).toMatch(/Missing required fields/);
  });

  it('sends the email to the address that was fetched from Firestore (simulated via request body)', async () => {
    const firestoreUserEmail = 'miembro@example.com';
    const taskSummary = '- [ ] Tarea de prueba: descripción de prueba';

    mockSend.mockResolvedValueOnce({ MessageId: 'msg-001' });

    const res = makeRes();
    await handler(makeReq({ to: firestoreUserEmail, summary: taskSummary }), res as any);

    expect(res._status).toBe(200);
    expect(res._body.ok).toBe(true);
    expect(res._body.messageId).toBe('msg-001');

    // SES must have been called once with the correct address
    expect(mockSend).toHaveBeenCalledTimes(1);
    const sentCommand = mockSend.mock.calls[0][0];
    // SendEmailCommand stores input as its own properties
    expect(sentCommand.input.Destination.ToAddresses).toContain(firestoreUserEmail);
    expect(sentCommand.input.Source).toBe(process.env.SES_FROM_EMAIL);
    expect(sentCommand.input.Message.Body.Text.Data).toBe(taskSummary);
  });

  it('returns 500 and propagates the SES error name when send() throws', async () => {
    mockSend.mockRejectedValueOnce({ name: 'MessageRejected', message: 'Address not verified' });

    const res = makeRes();
    await handler(makeReq({ to: 'bad@example.com', summary: 'some summary' }), res as any);

    expect(res._status).toBe(500);
    expect(res._body.ok).toBe(false);
    expect(res._body.error).toBe('MessageRejected');
  });
});
