process.env.NODE_ENV = 'test';
process.env.FAKE_TOKEN = 'xoxp-1234567890-123456789012-12345678-abcd1234efgh5678ijkl90';

const { WebClient } = require('@slack/web-api');
const { sendInvite } = require('./index');

// mock the WebClient constructor to return a fake client
jest.mock('@slack/web-api', () => ({
  WebClient: jest.fn(() => ({
    admin: {
      users: {
        invite: jest.fn(),
      },
    },
    chat: {
      postMessage: jest.fn(),
    },
  })),
}));

describe('sendInvite', () => {
  let req; let res; let next;
  beforeEach(() => {
    req = {
      body: {
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
      },
      headers: {
        // Authorization: 'Bearer test_token',
        Referer: 'example.com',
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return success message and chat message for valid request', async () => {
    const fakeWebClient = new WebClient(process.env.FAKE_TOKEN);
    WebClient.mockImplementationOnce(() => fakeWebClient);
    fakeWebClient.admin.users.invite.mockResolvedValueOnce({ ok: true });
    fakeWebClient.chat.postMessage.mockResolvedValueOnce({ ok: true });

    await sendInvite(req, res, next);

    expect(WebClient).toHaveBeenCalledWith(process.env.FAKE_TOKEN);
    expect(fakeWebClient.admin.users.invite).toHaveBeenCalledTimes(1);
    expect(fakeWebClient.admin.users.invite).toHaveBeenCalledWith({
      email: 'test@example.com',
      channel_ids: process.env.SLACK_CHANNEL_IDS,
      team_id: process.env.SLACK_TEAM_ID,
      email_password_policy_enabled: true,
      real_name: 'Test User',
    });
    expect(fakeWebClient.chat.postMessage).toHaveBeenCalledTimes(1);
    expect(fakeWebClient.chat.postMessage).toHaveBeenCalledWith({
      channel: process.env.SLACK_MESSAGE_CHANNEL,
      text: `*Invitation successfully sent!*\n:white_check_mark: Name: Test User\n:white_check_mark: Email: test@example.com`,
      mrkdwn: true,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invite sent successfully',
      inviteResult: { ok: true },
      messageResult: { ok: true },
    });
  });

  it('should return error message for missing email', async () => {
    // set up request with missing email
    const badReq = {
      body: {
        first_name: 'Test',
        last_name: 'User',
      },
      headers: {
        // Authorization: 'Bearer test_token',
        Referer: 'example.com',
      },
    };

    // call sendInvite function
    await sendInvite(badReq, res, next);

    // check that response has 400 status and error message
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Email is required' });
  });

  it('should return error message for missing first_name and/or last_name', async () => {
    // set up request with missing first_name and last_name
    const badReq = {
      body: {
        email: 'test@example.com',
      },
      headers: {
        // Authorization: 'Bearer test_token',
        Referer: 'example.com',
      },
    };

    // call sendInvite function
    await sendInvite(badReq, res, next);

    // check that response has 400 status and error message
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'First name and last name are required' });
  });

  it('should return error response if invite fails', async () => {
    const fakeWebClient = new WebClient(process.env.FAKE_TOKEN);
    WebClient.mockImplementationOnce(() => fakeWebClient);
    const error = new Error('Failed to send invite');
    fakeWebClient.admin.users.invite.mockRejectedValueOnce(error);

    await sendInvite(req, res, next);

    expect(WebClient).toHaveBeenCalledWith(process.env.FAKE_TOKEN);
    expect(fakeWebClient.admin.users.invite).toHaveBeenCalledTimes(1);
    expect(fakeWebClient.admin.users.invite).toHaveBeenCalledWith({
      email: 'test@example.com',
      channel_ids: process.env.SLACK_CHANNEL_IDS,
      team_id: process.env.SLACK_TEAM_ID,
      email_password_policy_enabled: true,
      real_name: 'Test User',
    });
    expect(res.status).toHaveBeenCalledWith(500);
    // expect(res.json).toHaveBeenCalledWith({ error: 'Error sending invite' });
  });
  it('should convert first_name and last_name to real_name', async () => {
    const fakeWebClient = new WebClient(process.env.FAKE_TOKEN);
    WebClient.mockImplementationOnce(() => fakeWebClient);
    fakeWebClient.admin.users.invite.mockResolvedValueOnce({ ok: true });
    fakeWebClient.chat.postMessage.mockResolvedValueOnce({ ok: true });

    const firstName = 'Test';
    const lastName = 'User';
    req.body.first_name = firstName;
    req.body.last_name = lastName;

    await sendInvite(req, res, next);

    expect(WebClient).toHaveBeenCalledWith(process.env.FAKE_TOKEN);
    expect(fakeWebClient.admin.users.invite).toHaveBeenCalledTimes(1);
    expect(fakeWebClient.admin.users.invite).toHaveBeenCalledWith({
      email: 'test@example.com',
      channel_ids: process.env.SLACK_CHANNEL_IDS,
      team_id: process.env.SLACK_TEAM_ID,
      email_password_policy_enabled: true,
      real_name: `${firstName} ${lastName}`,
    });
    expect(fakeWebClient.chat.postMessage).toHaveBeenCalledTimes(1);
    expect(fakeWebClient.chat.postMessage).toHaveBeenCalledWith({
      channel: process.env.SLACK_MESSAGE_CHANNEL,
      text: `*Invitation successfully sent!*\n:white_check_mark: Name: Test User\n:white_check_mark: Email: test@example.com`,
      mrkdwn: true,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invite sent successfully',
      inviteResult: { ok: true },
      messageResult: { ok: true },
    });
  });
});
