const fs = require('fs');
const path = require('path');
const BirthApplication = require('../models/BirthApplication');
const Hospital = require('../models/Hospital');
const ApiError = require('../utils/ApiError');
const audit = require('./audit.service');
const { notify } = require('./notification.service');
const { findDuplicates, scopeFilter, getApplication } = require('./application.service');
const { KIND_BY_FIELD, UPLOAD_ROOT } = require('../middleware/upload');
const { ROLES, APPLICATION_STATUS: S, NOTIFICATION_TYPES: N, AUDIT_ACTIONS: A } = require('../constants');

// field -> path in the document
const PATH = {
  firstName: 'child.firstName', middleName: 'child.middleName', lastName: 'child.lastName', dateOfBirth: 'child.dateOfBirth',
  timeOfBirth: 'child.timeOfBirth', gender: 'child.gender', birthWeightKg: 'child.birthWeightKg', birthPlace: 'child.birthPlace',
  fatherName: 'parents.fatherName', motherName: 'parents.motherName', guardianName: 'parents.guardianName',
  guardianPhone: 'parents.guardianPhone', parentAddress: 'parents.address', doctorName: 'doctorName',
};
const PARENT_FIELDS = ['fatherName', 'motherName', 'guardianName', 'guardianPhone', 'parentAddress'];
// Role-based allowlists: the server decides what each role may change, never the client.
const EDITABLE = { [ROLES.HOSPITAL]: Object.keys(PATH), [ROLES.USER]: PARENT_FIELDS };
const FILE_FIELDS = { [ROLES.HOSPITAL]: ['hospitalDocument', 'parentId', 'supportingDocument'], [ROLES.USER]: ['parentId', 'supportingDocument'] };

const get = (obj, p) => p.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
const same = (a, b) => (a instanceof Date || b instanceof Date ? new Date(a).getTime() === new Date(b).getTime() : String(a ?? '') === String(b ?? ''));

/** Pure: which fields change, and the $set that applies them. Unknown or non-editable fields are ignored. */
function planCorrection(app, data, role) {
  const $set = {};
  const changed = [];
  for (const field of EDITABLE[role] || []) {
    if (data[field] === undefined) continue;
    const p = PATH[field];
    if (same(get(app, p), data[field])) continue;
    $set[p] = data[field];
    changed.push(field);
  }
  if (changed.some((f) => ['firstName', 'middleName', 'lastName'].includes(f))) {
    const c = app.child;
    const pick = (f) => (data[f] !== undefined ? data[f] : c[f]);
    $set['child.fullName'] = [pick('firstName'), pick('middleName'), pick('lastName')].filter(Boolean).join(' ');
  }
  return { $set, changed };
}

/** Pure: replace documents of the same kind, keep the rest. */
function planDocuments(app, files = {}, role) {
  const allowed = FILE_FIELDS[role] || [];
  const bad = Object.keys(files).find((f) => !allowed.includes(f));
  if (bad) throw ApiError.validation([{ field: bad, message: 'You are not allowed to upload this document' }]);
  const incoming = Object.entries(files).flatMap(([field, list]) => list.map((f) => ({
    kind: KIND_BY_FIELD[field], originalName: f.originalname, storedName: f.filename, mimeType: f.mimetype, size: f.size, uploadedAt: new Date(),
  })));
  const replacedKinds = new Set(incoming.map((d) => d.kind));
  const kept = (app.documents || []).filter((d) => !replacedKinds.has(d.kind));
  const replaced = (app.documents || []).filter((d) => replacedKinds.has(d.kind));
  return { documents: [...kept, ...incoming], replaced, hasNew: incoming.length > 0 };
}

const removeStored = (docs) => docs.forEach((d) => fs.unlink(path.join(UPLOAD_ROOT, d.storedName), () => {}));

async function applyCorrections(req, id, data, files, { submit }) {
  const user = req.user;
  const app = await BirthApplication.findOne({ _id: id, ...(await scopeFilter(user)) }).lean();
  if (!app) throw ApiError.notFound('Application not found');
  if (app.status !== S.RESUBMISSION_REQUIRED) {
    throw ApiError.conflict('Corrections can only be made while the application is awaiting resubmission');
  }

  const { $set, changed } = planCorrection(app, data, user.role);
  const docs = planDocuments(app, files, user.role);
  const note = data.note;
  if (!changed.length && !docs.hasNew && !note) {
    throw ApiError.validation([{ field: 'note', message: 'Change at least one field, upload a document, or add a note' }], 'Nothing to submit');
  }
  if (docs.hasNew) $set.documents = docs.documents;

  const now = new Date();
  const hospital = await Hospital.findById(app.hospital).select('name');
  const actorName = user.role === ROLES.HOSPITAL ? hospital?.name || user.name : user.name;
  const update = { $set };

  if (submit) {
    const child = { ...app.child, ...Object.fromEntries(Object.entries($set).filter(([k]) => k.startsWith('child.')).map(([k, v]) => [k.slice(6), v])) };
    const motherName = $set['parents.motherName'] ?? app.parents.motherName;
    const guardianPhone = $set['parents.guardianPhone'] ?? app.parents.guardianPhone;
    $set.duplicateFlags = await findDuplicates({
      fullName: child.fullName, dateOfBirth: child.dateOfBirth, motherName, guardianPhone, hospitalId: app.hospital, excludeId: app._id,
    });
    $set.status = S.PENDING;
    // Everything the officer verified before may now be stale, so the checklist starts again.
    $set.checklist = { childInfo: false, parentInfo: false, hospitalInfo: false, documents: false, biometric: false, identity: false, noDuplicate: false };
    update.$inc = { resubmissionCount: 1 };
    update.$push = { history: {
      status: S.PENDING, actor: user._id, actorName, actorRole: user.role, at: now,
      comment: `Resubmitted${changed.length ? ` (updated: ${changed.join(', ')})` : ''}${note ? `. Note: ${note}` : ''}`,
    } };
  }

  // Atomic: succeeds only while the application is still awaiting resubmission (no double submit).
  const updated = await BirthApplication.findOneAndUpdate({ _id: id, status: S.RESUBMISSION_REQUIRED }, update, { new: true });
  if (!updated) throw ApiError.conflict('This application changed while you were editing. Reload and try again');
  removeStored(docs.replaced);

  await audit.log({
    req, action: submit ? A.APPLICATION_RESUBMITTED : A.APPLICATION_UPDATED, entityType: 'BirthApplication', entityId: id,
    description: `${submit ? 'Resubmitted' : 'Draft corrections saved for'} ${app.applicationId}${changed.length ? ` (fields: ${changed.join(', ')})` : ''}`,
  });

  if (submit) {
    const fromHospital = user.role === ROLES.HOSPITAL;
    const targets = [app.reviewedBy, fromHospital ? app.citizen : app.submittedBy].filter(Boolean).map(String);
    await Promise.all([...new Set(targets)].map((uid) => notify(uid, {
      title: 'Application resubmitted',
      message: `${actorName} resubmitted application ${app.applicationId} after corrections. It is back in the review queue.`,
      type: N.RESUBMITTED, application: app._id,
    })));
  }
  return getApplication(user, id);
}

module.exports = { planCorrection, planDocuments, applyCorrections, EDITABLE };
