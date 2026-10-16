import PDFDocument from "pdfkit";

/**
 * Generates and streams a high-resolution styled certificate PDF
 * @param {import('express').Response} res
 * @param {Object} options
 * @param {string} options.participantName
 * @param {string} options.teamName
 * @param {string} options.eventTitle
 * @param {string} options.festTitle
 * @param {string} options.verificationId
 * @param {string} [options.type] - "Winner" or "Participation"
 * @param {number|string} [options.rank] - Rank number if winner
 */
export const generateCertificate = (res, options) => {
  const {
    participantName = "Valued Participant",
    teamName = "Innovators",
    eventTitle = "Hackathon",
    festTitle = "FestFlow Tech Fest",
    verificationId = "FF-" + Date.now().toString(36).toUpperCase(),
    type = "Participation",
    rank = null,
  } = options;

  const doc = new PDFDocument({
    layout: "landscape",
    size: "A4",
    margin: 40,
  });

  // Set response headers
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="Certificate-${verificationId}.pdf"`
  );

  doc.pipe(res);

  const pageWidth = 841.89;
  const pageHeight = 595.28;

  // Background subtle gradient/fill
  doc.rect(0, 0, pageWidth, pageHeight).fill("#090D16");

  // Elegant Outer Border
  doc
    .rect(25, 25, pageWidth - 50, pageHeight - 50)
    .lineWidth(3)
    .strokeColor("#4F46E5")
    .stroke();

  // Thin Accent Inner Border
  doc
    .rect(32, 32, pageWidth - 64, pageHeight - 64)
    .lineWidth(1)
    .strokeColor("#818CF8")
    .stroke();

  // Corner Accent Diamonds
  const drawDiamond = (cx, cy, size = 6) => {
    doc
      .polygon(
        [cx, cy - size],
        [cx + size, cy],
        [cx, cy + size],
        [cx - size, cy]
      )
      .fillAndStroke("#F59E0B", "#F59E0B");
  };

  drawDiamond(32, 32);
  drawDiamond(pageWidth - 32, 32);
  drawDiamond(32, pageHeight - 32);
  drawDiamond(pageWidth - 32, pageHeight - 32);

  // StageZero Watermark / Header Pill
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .fillColor("#A5B4FC")
    .text("STAGEZERO VERIFIED CREDENTIAL", 0, 55, {
      align: "center",
      characterSpacing: 3,
    });

  // Main Certificate Title
  const isWinner = type === "Winner" || (rank && Number(rank) <= 3);
  const titleText = isWinner
    ? `CERTIFICATE OF EXCELLENCE`
    : `CERTIFICATE OF PARTICIPATION`;
  const subtitleBadge = isWinner && rank ? `TOP PERFORMER — RANK #${rank}` : null;

  doc
    .fontSize(28)
    .font("Helvetica-Bold")
    .fillColor("#F8FAFC")
    .text(titleText, 0, 85, {
      align: "center",
      characterSpacing: 2,
    });

  if (subtitleBadge) {
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#F59E0B")
      .text(subtitleBadge, 0, 120, {
        align: "center",
        characterSpacing: 2,
      });
  }

  // Divider line
  const dividerY = subtitleBadge ? 140 : 125;
  doc
    .moveTo(pageWidth / 2 - 120, dividerY)
    .lineTo(pageWidth / 2 + 120, dividerY)
    .lineWidth(2)
    .strokeColor("#F59E0B")
    .stroke();

  // Recipient preamble
  doc
    .fontSize(13)
    .font("Helvetica-Oblique")
    .fillColor("#94A3B8")
    .text("This certificate is proudly awarded to", 0, dividerY + 20, {
      align: "center",
    });

  // Participant Name
  doc
    .fontSize(26)
    .font("Helvetica-Bold")
    .fillColor("#38BDF8")
    .text(participantName, 0, dividerY + 45, {
      align: "center",
    });

  // Team Details
  doc
    .fontSize(12)
    .font("Helvetica")
    .fillColor("#E2E8F0")
    .text(`from Team `, 0, dividerY + 85, {
      align: "center",
      continued: true,
    })
    .font("Helvetica-Bold")
    .fillColor("#F59E0B")
    .text(teamName, {
      continued: false,
    });

  // Event & Fest Recognition
  const eventNarrative = isWinner
    ? `for securing a top podium finish in the competitive arena of`
    : `for demonstrating commendable dedication, innovation, and active participation in`;

  doc
    .fontSize(12)
    .font("Helvetica")
    .fillColor("#CBD5E1")
    .text(eventNarrative, 100, dividerY + 115, {
      align: "center",
      width: pageWidth - 200,
    });

  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .fillColor("#818CF8")
    .text(eventTitle, 0, dividerY + 140, {
      align: "center",
    });

  doc
    .fontSize(12)
    .font("Helvetica-Oblique")
    .fillColor("#94A3B8")
    .text(`held under the flagship banner of ${festTitle}`, 0, dividerY + 168, {
      align: "center",
    });

  // Footer / Signatures Section
  const footerY = pageHeight - 110;

  // Verification ID and date
  doc
    .fontSize(9)
    .font("Helvetica-Bold")
    .fillColor("#64748B")
    .text(`CREDENTIAL ID: ${verificationId}`, 60, footerY);

  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor("#64748B")
    .text(`ISSUED ON: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 60, footerY + 14);

  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor("#475569")
    .text("Cryptographically logged on StageZero Network", 60, footerY + 28);

  // Convener Signature line
  const sigRightX = pageWidth - 260;
  doc
    .moveTo(sigRightX, footerY + 20)
    .lineTo(sigRightX + 180, footerY + 20)
    .lineWidth(1)
    .strokeColor("#475569")
    .stroke();

  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .fillColor("#E2E8F0")
    .text("Fest Convener / Lead Judge", sigRightX, footerY + 25, {
      width: 180,
      align: "center",
    });

  doc
    .fontSize(8)
    .font("Helvetica-Oblique")
    .fillColor("#64748B")
    .text("StageZero Verification Authority", sigRightX, footerY + 38, {
      width: 180,
      align: "center",
    });

  doc.end();
};
