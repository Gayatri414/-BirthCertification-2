const AuditLog = require('../models/AuditLog');

// Audit logging must never break the business flow, so errors are swallowed and logged.
async function log({ req, actor, action, entityType, entityId, description }) {
  try {
    const user = actor || req?.user;
    await AuditLog.create({
      actor: user?._id,
      actorRole: user?.role,
      action,
      entityType,
      entityId: entityId ? String(entityId) : undefined,
      description,
      ipAddress: req?.ip,
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}

const { parsePagination, buildMeta, escapeRegex } = require('../utils/pagination');

// workflowOnly: officers see application/certificate activity, not login or account events.
async function listLogs(q, { workflowOnly = false } = {}) {
  const { page, limit, skip } = parsePagination(q, { defaultLimit: 20 });
  const filter = {};
  if (workflowOnly) filter.entityType = { $in: ['BirthApplication', 'Certificate'] };
  if (q.action) filter.action = q.action;
  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), 'i');
    filter.$or = [{ description: rx }, { entityId: rx }];
  }
  if (q.from || q.to) {
    filter.createdAt = {};
    if (q.from) filter.createdAt.$gte = new Date(`${q.from}T00:00:00.000Z`);
    if (q.to) filter.createdAt.$lte = new Date(`${q.to}T23:59:59.999Z`);
  }
  const [items, total] = await Promise.all([
    AuditLog.find(filter).populate('actor', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(filter),
  ]);
  return { items, pagination: buildMeta(page, limit, total) };
}

module.exports = { log, listLogs };
