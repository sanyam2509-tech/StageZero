import PDFDocument from "pdfkit";

/**
 * Generates and streams a high-resolution, light-themed academic certificate PDF
 * matching StageZero's neo-brutalist and precision campus UI design language.
 *
 * @param {import('express').Response} res
 * @param {Object} options
 * @param {string} options.participantName
 * @param {string} options.teamName
 * @param {string} options.eventTitle
 * @param {string} options.festTitle
 * @param {string} [options.collegeName]
 * @param {string} options.verificationId
 * @param {string} [options.type] - "Winner" or "Participation"
 * @param {number|string} [options.rank] - Rank number if winner
 */
export const generateCertificate = (res, options) => {
  const {
    participantName = "Valued Participant",
    teamName = "Innovators",
    eventTitle = "Hackathon",
    festTitle = "StageZero Tech Fest",
    collegeName = "",
    verificationId = "SZ-" + Date.now().toString(36).toUpperCase(),
    type = "Participation",
    rank = null,
  } = options;

  const doc = new PDFDocument({
    layout: "landscape",
    size: "A4",
    margin: 25,
  });

  // Set response headers for clean browser streaming
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="StageZero-Certificate-${verificationId}.pdf"`
  );

  doc.pipe(res);

  const pageWidth = 841.89;
  const pageHeight = 595.28;

  // Background: Crisp Clean Academic Canvas
  doc.rect(0, 0, pageWidth, pageHeight).fill("#FAFAFA");

  // Subtle architectural grid dots around margins
  doc.save();
  doc.fillColor("#E2E8F0");
  for (let x = 40; x < pageWidth - 40; x += 30) {
    doc.circle(x, 40, 0.75).fill();
    doc.circle(x, pageHeight - 40, 0.75).fill();
  }
  for (let y = 40; y < pageHeight - 40; y += 30) {
    doc.circle(40, y, 0.75).fill();
    doc.circle(pageWidth - 40, y, 0.75).fill();
  }
  doc.restore();

  // Solid Main Outer Border: Neo-brutalist Slate-950
  doc
    .rect(22, 22, pageWidth - 44, pageHeight - 44)
    .lineWidth(2.5)
    .strokeColor("#0F172A")
    .stroke();

  // Inset Precision Frame
  doc
    .rect(29, 29, pageWidth - 58, pageHeight - 58)
    .lineWidth(1)
    .strokeColor("#E2E8F0")
    .stroke();

  // Precision Corner Brackets (StageZero Indigo & Yellow Precision Brackets)
  const drawCornerBrackets = () => {
    const corners = [
      { x: 38, y: 38, dx: 1, dy: 1 },
      { x: pageWidth - 38, y: 38, dx: -1, dy: 1 },
      { x: 38, y: pageHeight - 38, dx: 1, dy: -1 },
      { x: pageWidth - 38, y: pageHeight - 38, dx: -1, dy: -1 },
    ];

    corners.forEach(({ x, y, dx, dy }) => {
      // Bracket arms in Indigo
      doc
        .moveTo(x, y + dy * 22)
        .lineTo(x, y)
        .lineTo(x + dx * 22, y)
        .lineWidth(2.5)
        .strokeColor("#4F46E5")
        .stroke();

      // Campus Yellow Accent Square
      doc
        .rect(x - (dx > 0 ? 1 : 5), y - (dy > 0 ? 1 : 5), 6, 6)
        .fillAndStroke("#FACC15", "#0F172A");
    });
  };
  drawCornerBrackets();

  // Top Header Pill: "STAGEZERO VERIFIED ACADEMIC CREDENTIAL"
  const pillW = 310;
  const pillH = 26;
  const pillX = (pageWidth - pillW) / 2;
  const pillY = 46;

  doc.roundedRect(pillX, pillY, pillW, pillH, 6).fillAndStroke("#EEF2FF", "#C7D2FE");
  doc
    .fontSize(9.5)
    .font("Helvetica-Bold")
    .fillColor("#4338CA")
    .text("STAGEZERO VERIFIED ACADEMIC CREDENTIAL", 0, pillY + 8.5, {
      align: "center",
      characterSpacing: 1.5,
    });

  // Main Certificate Title
  const isWinner = type === "Winner" || (rank && Number(rank) <= 3);
  const titleText = isWinner
    ? "CERTIFICATE OF EXCELLENCE"
    : "CERTIFICATE OF MERIT & PARTICIPATION";

  const titleY = 86;
  doc
    .fontSize(28)
    .font("Helvetica-Bold")
    .fillColor("#0F172A")
    .text(titleText, 0, titleY, {
      align: "center",
      characterSpacing: 2,
    });

  let nextY = titleY + 38;

  // Podium Badge if Winner
  if (isWinner && rank) {
    const badgeW = 240;
    const badgeH = 24;
    const badgeX = (pageWidth - badgeW) / 2;
    const badgeY = nextY;
    doc
      .roundedRect(badgeX, badgeY, badgeW, badgeH, 4)
      .fillAndStroke("#FEF08A", "#0F172A");

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#0F172A")
      .text(`PODIUM WINNER • RANK #${rank}`, 0, badgeY + 7, {
        align: "center",
        characterSpacing: 1.5,
      });

    nextY += 32;
  }

  // Elegant Divider with Center Diamond
  const dividerY = nextY + 6;
  doc
    .moveTo(pageWidth / 2 - 160, dividerY)
    .lineTo(pageWidth / 2 + 160, dividerY)
    .lineWidth(1)
    .strokeColor("#E2E8F0")
    .stroke();

  // Diamond
  doc
    .polygon(
      [pageWidth / 2, dividerY - 4.5],
      [pageWidth / 2 + 4.5, dividerY],
      [pageWidth / 2, dividerY + 4.5],
      [pageWidth / 2 - 4.5, dividerY]
    )
    .fillAndStroke("#4F46E5", "#4F46E5");

  // Preamble
  const preambleY = dividerY + 16;
  doc
    .fontSize(12)
    .font("Helvetica-Oblique")
    .fillColor("#64748B")
    .text("This official credential is proudly awarded to", 0, preambleY, {
      align: "center",
    });

  // Participant Name (Massive, Bold, Crisp Slate-950)
  const nameY = preambleY + 24;
  doc
    .fontSize(34)
    .font("Helvetica-Bold")
    .fillColor("#0F172A")
    .text(participantName, 0, nameY, {
      align: "center",
    });

  // Underline under Participant Name
  const nameWidth = Math.min(doc.widthOfString(participantName), pageWidth - 200);
  doc
    .moveTo((pageWidth - nameWidth) / 2 - 15, nameY + 42)
    .lineTo((pageWidth + nameWidth) / 2 + 15, nameY + 42)
    .lineWidth(2)
    .strokeColor("#4F46E5")
    .stroke();

  // Team detail (Rendered cleanly without 'continued: true' text overlaps)
  const cleanTeamName = teamName.replace(/^team\s+/i, "");
  const teamY = nameY + 54;
  doc
    .fontSize(13.5)
    .font("Helvetica-Bold")
    .fillColor("#4338CA")
    .text(`from Squad "${cleanTeamName}"`, 0, teamY, {
      align: "center",
    });

  // Event Recognition Narrative
  const narrativeY = teamY + 26;
  const eventNarrative = isWinner
    ? "for securing a top podium finish with outstanding technical innovation in"
    : "for demonstrating commendable technical execution, innovation, and active participation in";

  doc
    .fontSize(11.5)
    .font("Helvetica")
    .fillColor("#475569")
    .text(eventNarrative, 80, narrativeY, {
      align: "center",
      width: pageWidth - 160,
    });

  // Event Title (Big & Bold)
  const eventY = narrativeY + 24;
  doc
    .fontSize(22)
    .font("Helvetica-Bold")
    .fillColor("#0F172A")
    .text(eventTitle, 0, eventY, {
      align: "center",
    });

  // Fest Title & College
  const festY = eventY + 28;
  const festSubtitle = collegeName
    ? `held under the flagship banner of ${festTitle} • ${collegeName}`
    : `held under the flagship banner of ${festTitle}`;

  doc
    .fontSize(11.5)
    .font("Helvetica-Oblique")
    .fillColor("#64748B")
    .text(festSubtitle, 0, festY, {
      align: "center",
    });

  // Footer Section
  const footerY = pageHeight - 114;

  // 1. Left Card: Monospaced Credential Verification Box
  const boxX = 46;
  const boxY = footerY - 4;
  const boxW = 275;
  const boxH = 74;

  doc.roundedRect(boxX, boxY, boxW, boxH, 8).fillAndStroke("#FFFFFF", "#CBD5E1");

  doc
    .fontSize(8.5)
    .font("Helvetica-Bold")
    .fillColor("#0F172A")
    .text(`CREDENTIAL ID: ${verificationId}`, boxX + 14, boxY + 12);

  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor("#64748B")
    .text(
      `ISSUED ON: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
      boxX + 14,
      boxY + 27
    );

  doc
    .fontSize(8)
    .font("Helvetica-Bold")
    .fillColor("#059669")
    .text("RECORD: Cryptographically Logged on StageZero", boxX + 14, boxY + 41);

  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor("#4F46E5")
    .text("VERIFY STATUS: Validated Campus Merit Record", boxX + 14, boxY + 54);

  // 2. Middle: Official Vector Seal
  const sealCenterX = pageWidth / 2;
  const sealCenterY = footerY + 33;

  // Outer dashed circle
  doc
    .circle(sealCenterX, sealCenterY, 32)
    .lineWidth(1.2)
    .dash(3, { space: 2 })
    .strokeColor("#A5B4FC")
    .stroke();
  doc.undash();

  // Inner solid circle
  doc
    .circle(sealCenterX, sealCenterY, 26)
    .lineWidth(1.5)
    .fillAndStroke("#EEF2FF", "#4F46E5");

  doc
    .fontSize(6.5)
    .font("Helvetica-Bold")
    .fillColor("#4338CA")
    .text("STAGEZERO", sealCenterX - 30, sealCenterY - 7, {
      width: 60,
      align: "center",
      characterSpacing: 1.2,
    });

  doc
    .fontSize(6)
    .font("Helvetica-Bold")
    .fillColor("#D97706")
    .text("★ VERIFIED ★", sealCenterX - 30, sealCenterY + 2.5, {
      width: 60,
      align: "center",
    });

  // 3. Right: Dual Signatures
  const sigLineY = footerY + 28;
  const sig1X = pageWidth - 295;
  const sig2X = pageWidth - 150;
  const sigWidth = 118;

  // Signature Line 1
  doc
    .moveTo(sig1X, sigLineY)
    .lineTo(sig1X + sigWidth, sigLineY)
    .lineWidth(1)
    .strokeColor("#94A3B8")
    .stroke();

  doc
    .fontSize(9)
    .font("Helvetica-Bold")
    .fillColor("#0F172A")
    .text("Fest Convener", sig1X, sigLineY + 6, {
      width: sigWidth,
      align: "center",
    });

  doc
    .fontSize(8)
    .font("Helvetica-Oblique")
    .fillColor("#64748B")
    .text("Campus Organizing Lead", sig1X, sigLineY + 19, {
      width: sigWidth,
      align: "center",
    });

  // Signature Line 2
  doc
    .moveTo(sig2X, sigLineY)
    .lineTo(sig2X + sigWidth, sigLineY)
    .lineWidth(1)
    .strokeColor("#94A3B8")
    .stroke();

  doc
    .fontSize(9)
    .font("Helvetica-Bold")
    .fillColor("#0F172A")
    .text("Lead Evaluator", sig2X, sigLineY + 6, {
      width: sigWidth,
      align: "center",
    });

  doc
    .fontSize(8)
    .font("Helvetica-Oblique")
    .fillColor("#64748B")
    .text("StageZero Council", sig2X, sigLineY + 19, {
      width: sigWidth,
      align: "center",
    });

  doc.end();
};
