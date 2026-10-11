const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const UPLOAD_ROOT = path.resolve(__dirname, '..', env.uploadDir);
fs.mkdirSync(UPLOAD_ROOT, { recursive: true });

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = { 'application/pdf': '.pdf', 'image/jpeg': '.jpg', 'image/png': '.png' };
const SIGNATURES = {
  'application/pdf': [Buffer.from('%PDF')],
  'image/jpeg': [Buffer.from([0xff, 0xd8, 0xff])],
  'image/png': [Buffer.from([0x89, 0x50, 0x4e, 0x47])],
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_ROOT),
  // Random server-chosen name; the client-supplied name is never used on disk.
  filename: (req, file, cb) => cb(null, crypto.randomBytes(16).toString('hex') + (TYPES[file.mimetype] || '')),
});

const fileFilter = (req, file, cb) => {
  if (!TYPES[file.mimetype]) {
    return cb(ApiError.validation([{ field: file.fieldname, message: 'Only PDF, JPG or PNG files are allowed' }]));
  }
  cb(null, true);
};

const FIELDS = [
  { name: 'hospitalDocument', maxCount: 1 },
  { name: 'parentId', maxCount: 1 },
  { name: 'supportingDocument', maxCount: 1 },
];
const KIND_BY_FIELD = { hospitalDocument: 'HOSPITAL_DOCUMENT', parentId: 'PARENT_ID', supportingDocument: 'SUPPORTING' };

const multerUpload = multer({ storage, fileFilter, limits: { fileSize: MAX_BYTES, files: 3 } }).fields(FIELDS);

const flatten = (req) => Object.values(req.files || {}).flat();
const removeUploadedFiles = (req) => flatten(req).forEach((f) => fs.unlink(f.path, () => {}));

// Checks real file content (magic bytes), not just the declared MIME type.
function verifyContent(req, res, next) {
  try {
    for (const f of flatten(req)) {
      const head = Buffer.alloc(8);
      const fd = fs.openSync(f.path, 'r');
      fs.readSync(fd, head, 0, 8, 0);
      fs.closeSync(fd);
      const ok = (SIGNATURES[f.mimetype] || []).some((sig) => head.subarray(0, sig.length).equals(sig));
      if (!ok) throw ApiError.validation([{ field: f.fieldname, message: 'File content does not match its type' }]);
    }
    next();
  } catch (err) {
    removeUploadedFiles(req);
    next(err);
  }
}

const uploadDocuments = [
  (req, res, next) => multerUpload(req, res, (err) => { if (err) { removeUploadedFiles(req); return next(err); } next(); }),
  verifyContent,
];

module.exports = { uploadDocuments, removeUploadedFiles, UPLOAD_ROOT, KIND_BY_FIELD, MAX_BYTES };
