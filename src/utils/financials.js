// src/utils/financials.js
export const calculateParentPaymentStatus = (parentId, users, payments) => {
  const parent = users.find(u => u.id === parentId && u.role === 'parent');
  if (!parent) return { totalPaid: "0.00", amountDue: "0.00", remainingBalance: "0.00", paymentStatus: 'onbekend' };

  const parentPayments = payments.filter(p => String(p.parent_id) === String(parentId));
  const totalPaid = parentPayments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);

  // ✅ FIXED: Als amount_due niet ingesteld is maar er zijn wel betalingen, gebruik dan de totale betalingen
  let amountDue = parseFloat(parent.amount_due || 0);

  // ✅ FALLBACK: Als amount_due 0 is maar er zijn wel betalingen, neem aan dat het minimaal gelijk is aan betalingen
  if (amountDue === 0 && totalPaid > 0) {
    amountDue = totalPaid;
  }

  const remainingBalance = Math.max(0, amountDue - totalPaid);

  let paymentStatus = 'openstaand';
  if (amountDue === 0 && totalPaid === 0) { // Als er niets verschuldigd is en niets betaald
    paymentStatus = 'nvt'; // Niet van toepassing, of misschien 'geen_bijdrage'
  } else if (totalPaid >= amountDue && amountDue > 0) { // >0 check om te voorkomen dat 0/0 betaald is
    paymentStatus = 'betaald';
  } else if (totalPaid > 0 && totalPaid < amountDue) {
    paymentStatus = 'deels_betaald';
  } else if (amountDue > 0 && totalPaid === 0) {
    paymentStatus = 'openstaand';
  }
  // Als amountDue 0 is maar er is wel betaald (teveel betaald?), status 'betaald' of 'overbetaald'
  else if (amountDue === 0 && totalPaid > 0) {
    paymentStatus = 'betaald'; // Of 'overbetaald'
  }


  return {
    totalPaid: totalPaid.toFixed(2),
    amountDue: amountDue.toFixed(2),
    remainingBalance: remainingBalance.toFixed(2),
    paymentStatus,
  };
};

export const calculateFinancialMetrics = (users, payments) => {
  const parents = users.filter(u => u.role === 'parent');
  let totalDue = 0;
  let totalPaid = 0;

  parents.forEach(parent => {
    // Pass all users and all payments to the status function
    const status = calculateParentPaymentStatus(parent.id, users, payments);
    totalDue += parseFloat(status.amountDue);
    totalPaid += parseFloat(status.totalPaid);
  });

  const totalOutstanding = Math.max(0, totalDue - totalPaid); // Zorg dat het niet negatief is
  const percentagePaid = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : (totalPaid > 0 ? 100 : 0); // Als totalDue 0 is maar wel betaald, 100%

  return {
    totalDue: totalDue.toFixed(2),
    totalPaid: totalPaid.toFixed(2),
    totalOutstanding: totalOutstanding.toFixed(2),
    percentagePaid,
  };
};