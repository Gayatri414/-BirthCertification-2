const service = require('../services/certificate.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

exports.list = asyncHandler(async (req, res) => sendSuccess(res, await service.listCertificates(req.user, req.query)));
exports.get = asyncHandler(async (req, res) => sendSuccess(res, { certificate: await service.getCertificate(req.user, req.params.id) }));
exports.verify = asyncHandler(async (req, res) => sendSuccess(res, await service.verifyCertificate(req.params.certificateNumber), 'Verification result'));
exports.revoke = asyncHandler(async (req, res) =>
  sendSuccess(res, { certificate: await service.revokeCertificate(req, req.params.id, req.body.reason) }, 'Certificate revoked'));

exports.download = asyncHandler(async (req, res) => {
  const { file, filename } = await service.getDownload(req, req.params.id);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.download(file, filename);
});
