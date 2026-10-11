const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const { parsePagination, buildMeta } = require('../utils/pagination');

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { user: req.user._id };
  const listFilter = req.query.unread === 'true' ? { ...filter, isRead: false } : filter;
  const [items, total, unreadCount] = await Promise.all([
    Notification.find(listFilter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(listFilter),
    Notification.countDocuments({ ...filter, isRead: false }),
  ]);
  sendSuccess(res, { items, unreadCount, pagination: buildMeta(page, limit, total) });
});

exports.markRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isRead: true }, { new: true });
  if (!n) throw ApiError.notFound('Notification not found');
  sendSuccess(res, { notification: n }, 'Marked as read');
});

exports.markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  sendSuccess(res, {}, 'All notifications marked as read');
});
