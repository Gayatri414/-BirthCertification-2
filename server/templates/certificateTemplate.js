const PDFDocument = require('pdfkit');

// PDFKit's built-in Helvetica only covers Latin-1; anything else would print as garbage.
const latin = (s) => String(s ?? '').normalize('NFC').replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '?');
const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' });

const INDIGO = '#3730a3';
const W = 595.28;

/**
 * Renders the certificate into `stream`. Pure layout code: all data arrives in `d`.
 * d: { certificateNumber, applicationId, verificationCode, verifyUrl, issuingAuthority, issuedAt, signatory,
 *      child{fullName,dateOfBirth,timeOfBirth,gender,birthPlace}, parents{fatherName,motherName,guardianName},
 *      hospitalName, registrationDate }
 */
function renderCertificate(stream, d, qrPng) {
  const doc = new PDFDocument({
    size: 'A4', margin: 0,
    info: { Title: `Birth Certificate ${d.certificateNumber}`, Author: latin(d.issuingAuthority), Subject: 'Digitally generated birth certificate (DEMO project)' },
  });
  doc.pipe(stream);

  // frame
  doc.rect(24, 24, W - 48, 794).lineWidth(3).stroke(INDIGO);
  doc.rect(32, 32, W - 64, 778).lineWidth(0.8).stroke('#6366f1');

  // watermark (drawn first so text sits above it)
  doc.save();
  doc.rotate(-35, { origin: [W / 2, 430] });
  doc.fillColor('#6366f1').fillOpacity(0.07).font('Helvetica-Bold').fontSize(86).text('DEMO COPY', 40, 390, { width: W - 80, align: 'center', lineBreak: false });
  doc.restore();
  doc.fillOpacity(1);

  // header band
  doc.rect(32, 32, W - 64, 100).fill(INDIGO);
  doc.fillColor('#c7d2fe').font('Helvetica-Bold').fontSize(9).text('SMARTBIRTH  |  ONLINE BIRTH REGISTRATION SYSTEM', 32, 54, { width: W - 64, align: 'center', characterSpacing: 1.5 });
  doc.fillColor('#ffffff').fontSize(18).text(latin(d.issuingAuthority).toUpperCase(), 40, 74, { width: W - 80, align: 'center' });
  doc.fillColor('#e0e7ff').font('Helvetica').fontSize(9).text('Office of the Registrar of Births (demo project, not an official government document)', 40, 104, { width: W - 80, align: 'center' });

  // title
  doc.fillColor('#1e1b4b').font('Helvetica-Bold').fontSize(27).text('CERTIFICATE OF BIRTH', 32, 160, { width: W - 64, align: 'center', characterSpacing: 1 });
  doc.moveTo(210, 200).lineTo(W - 210, 200).lineWidth(1.2).stroke('#6366f1');

  // identifiers
  doc.fillColor('#64748b').font('Helvetica').fontSize(8.5)
    .text('CERTIFICATE NUMBER', 60, 218).text('APPLICATION ID', 330, 218);
  doc.fillColor('#1e1b4b').font('Helvetica-Bold').fontSize(14)
    .text(latin(d.certificateNumber), 60, 231).text(latin(d.applicationId), 330, 231);

  doc.fillColor('#334155').font('Helvetica').fontSize(10.5)
    .text('This is to certify that the birth of the child named below has been registered and verified as follows.', 60, 268, { width: W - 120 });

  // detail rows
  const rows = [
    ['Name of child', d.child.fullName],
    ['Date of birth', fmtDate(d.child.dateOfBirth)],
    ['Time of birth', d.child.timeOfBirth],
    ['Gender', d.child.gender],
    ['Place of birth', d.child.birthPlace],
    ["Father's name", d.parents.fatherName],
    ["Mother's name", d.parents.motherName],
    ...(d.parents.guardianName ? [['Guardian name', d.parents.guardianName]] : []),
    ['Hospital', d.hospitalName],
    ['Registration date', fmtDate(d.registrationDate)],
  ];
  let y = 308;
  rows.forEach(([label, value], i) => {
    if (i % 2 === 0) doc.rect(52, y - 6, W - 104, 28).fill('#f8fafc');
    doc.fillColor('#64748b').font('Helvetica').fontSize(9.5).text(label.toUpperCase(), 64, y + 2, { width: 150, lineBreak: false });
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(11.5).text(latin(value), 220, y, { width: 320, lineBreak: false, ellipsis: true });
    y += 30;
  });

  // QR + issuing block
  const by = 650;
  doc.image(qrPng, 62, by, { width: 100, height: 100 });
  doc.fillColor('#475569').font('Helvetica').fontSize(8).text('Scan to verify this certificate', 52, by + 104, { width: 120, align: 'center' });
  doc.fillColor('#64748b').fontSize(7.5).text(latin(d.verifyUrl), 180, by + 8, { width: 190 });
  doc.text(`Verification code: ${latin(d.verificationCode)}`, 180, by + 38, { width: 190 });
  doc.text(`Issued on: ${fmtDate(d.issuedAt)}`, 180, by + 52, { width: 190 });
  doc.text('Issuing authority:', 180, by + 66, { width: 190 }).fillColor('#0f172a').font('Helvetica-Bold').text(latin(d.issuingAuthority), 180, by + 77, { width: 190 });

  // signature placeholder
  doc.moveTo(390, by + 62).lineTo(540, by + 62).lineWidth(0.8).stroke('#475569');
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9).text(latin(d.signatory || 'Registrar'), 390, by + 67, { width: 150, align: 'center' });
  doc.fillColor('#64748b').font('Helvetica').fontSize(8).text('Authorized signatory (placeholder)', 390, by + 80, { width: 150, align: 'center' });

  // footer
  doc.rect(32, 780, W - 64, 30).fill('#eef2ff');
  doc.fillColor('#3730a3').font('Helvetica-Oblique').fontSize(8.5)
    .text('Digitally generated certificate. No physical signature required. Verify authenticity using the QR code or certificate number.', 40, 790, { width: W - 80, align: 'center' });

  doc.end();
}

module.exports = { renderCertificate, latin, fmtDate };
