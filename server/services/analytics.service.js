const BirthApplication = require('../models/BirthApplication');
const { APPLICATION_STATUS: S } = require('../constants');

const pad = (n) => String(n).padStart(2, '0');
const keyOf = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;

function monthRange(months) {
  const now = new Date();
  const keys = [];
  for (let i = months - 1; i >= 0; i -= 1) keys.push(keyOf(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))));
  const [y, m] = keys[0].split('-').map(Number);
  return { keys, start: new Date(Date.UTC(y, m - 1, 1)) };
}
const label = (key) => new Date(`${key}-01T00:00:00Z`).toLocaleString('en-IN', { month: 'short', year: '2-digit', timeZone: 'UTC' });

// Registrations submitted per month (empty months are filled with 0 so charts have no gaps).
async function registrationsByMonth(filter = {}, months = 12) {
  const { keys, start } = monthRange(months);
  const rows = await BirthApplication.aggregate([
    { $match: { ...filter, createdAt: { $gte: start } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'UTC' } }, n: { $sum: 1 } } },
  ]);
  const by = Object.fromEntries(rows.map((r) => [r._id, r.n]));
  return keys.map((k) => ({ month: label(k), registrations: by[k] || 0 }));
}

// Approved / rejected decisions per month, by decision date.
async function decisionsByMonth(filter = {}, months = 12) {
  const { keys, start } = monthRange(months);
  const rows = await BirthApplication.aggregate([
    { $match: { ...filter, status: { $in: [S.APPROVED, S.REJECTED] }, reviewedAt: { $gte: start } } },
    { $group: { _id: { m: { $dateToString: { format: '%Y-%m', date: '$reviewedAt', timezone: 'UTC' } }, s: '$status' }, n: { $sum: 1 } } },
  ]);
  const get = (k, s) => rows.find((r) => r._id.m === k && r._id.s === s)?.n || 0;
  return keys.map((k) => ({ month: label(k), approved: get(k, S.APPROVED), rejected: get(k, S.REJECTED) }));
}

async function byHospital(filter = {}, limit = 8) {
  return BirthApplication.aggregate([
    { $match: filter },
    { $group: { _id: '$hospital', applications: { $sum: 1 } } },
    { $sort: { applications: -1 } }, { $limit: limit },
    { $lookup: { from: 'hospitals', localField: '_id', foreignField: '_id', as: 'h' } },
    { $project: { _id: 0, hospital: { $ifNull: [{ $arrayElemAt: ['$h.name', 0] }, 'Unknown'] }, applications: 1 } },
  ]);
}

async function statusDistribution(filter = {}) {
  const rows = await BirthApplication.aggregate([{ $match: filter }, { $group: { _id: '$status', value: { $sum: 1 } } }]);
  return rows.map((r) => ({ status: r._id, value: r.value }));
}

module.exports = { registrationsByMonth, decisionsByMonth, byHospital, statusDistribution };
