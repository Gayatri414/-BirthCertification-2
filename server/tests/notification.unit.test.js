jest.mock('../models/Notification');
jest.mock('../models/User');

const Notification = require('../models/Notification');
const User = require('../models/User');
const { notify } = require('../services/notification.service');
const mail = require('../services/mail.service');
const sms = require('../services/sms.service');
const nc = require('../controllers/notification.controller');

const payload = { title: 'Application approved', message: 'Application APP-2026-000001 has been approved.', type: 'APPROVED', application: 'a1' };
const user = (over = {}) => ({ select: jest.fn().mockResolvedValue({ email: 'p@example.com', phone: '9876543210', ...over }) });

beforeEach(() => { jest.clearAllMocks(); mail.outbox.length = 0; sms.outbox.length = 0; Notification.create.mockResolvedValue({ _id: 'n1' }); });

describe('notify()', () => {
  it('stores the notification and sends both email and SMS', async () => {
    User.findById.mockReturnValue(user());
    const n = await notify('u1', payload);
    expect(n).toEqual({ _id: 'n1' });
    expect(Notification.create).toHaveBeenCalledWith({ user: 'u1', ...payload });
    expect(mail.outbox).toEqual([{ to: 'p@example.com', subject: 'SmartBirth: Application approved', text: payload.message }]);
    expect(sms.outbox).toHaveLength(1);
    expect(sms.outbox[0].to).toBe('9876543210');
    expect(sms.outbox[0].text.length).toBeLessThanOrEqual(300);
  });
  it('skips SMS when the user has no phone number', async () => {
    User.findById.mockReturnValue(user({ phone: undefined }));
    await notify('u1', payload);
    expect(sms.outbox).toHaveLength(0);
    expect(mail.outbox).toHaveLength(1);
  });
  it('a storage failure returns null instead of throwing', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    Notification.create.mockRejectedValueOnce(new Error('db down'));
    await expect(notify('u1', payload)).resolves.toBeNull();
  });
  it('a failing channel is logged but the in-app record and the other channel still succeed', async () => {
    const env = require('../config/env');
    const err = jest.spyOn(console, 'error').mockImplementation(() => {});
    User.findById.mockReturnValue(user());
    env.smsProvider = 'twilio'; // not implemented -> the SMS channel rejects
    try {
      const n = await notify('u1', payload);
      expect(n).toEqual({ _id: 'n1' });
      expect(mail.outbox).toHaveLength(1);
      expect(sms.outbox).toHaveLength(0);
      expect(err).toHaveBeenCalledWith('Notification channel failed:', expect.stringContaining('not implemented'));
    } finally { env.smsProvider = 'mock'; }
  });
  it('does nothing without a recipient', async () => {
    expect(await notify(undefined, payload)).toBeNull();
    expect(Notification.create).not.toHaveBeenCalled();
  });
});

describe('listing', () => {
  const run = async (query) => {
    const chain = { sort: jest.fn().mockReturnThis(), skip: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValue([]) };
    Notification.find.mockReturnValue(chain);
    Notification.countDocuments.mockResolvedValue(0);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await nc.list({ user: { _id: 'u1' }, query }, res, () => {});
    return res;
  };
  it('unread=true filters the list but the unread counter ignores the filter', async () => {
    await run({ unread: 'true' });
    expect(Notification.find).toHaveBeenCalledWith({ user: 'u1', isRead: false });
    expect(Notification.countDocuments).toHaveBeenCalledWith({ user: 'u1', isRead: false });
  });
  it('without the filter it lists everything for the user only', async () => {
    await run({});
    expect(Notification.find).toHaveBeenCalledWith({ user: 'u1' });
  });
});
