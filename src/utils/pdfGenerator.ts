import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AllBudgets, Expense, Income } from '../types';
import { formatCurrency, formatMonthYear, getCurrentMonthKey, getTodayDateString } from './formatters';
import { calculateMonthlyBudgetSummary } from './budgetCalculations';
import { LIBERATION_SANS_BASE64 } from './pdfFont';

// Format date into "05 Sep 2026"
export function formatTableDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month - 1, day);
    const dayStr = String(day).padStart(2, '0');
    const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
    return `${dayStr} ${monthStr} ${year}`;
  }
  return dateStr;
}

// Format date into "05 September 2026"
export function formatLongDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month - 1, day);
    const dayStr = String(day).padStart(2, '0');
    const monthStr = d.toLocaleDateString('en-US', { month: 'long' });
    return `${dayStr} ${monthStr} ${year}`;
  }
  return dateStr;
}

export function generateExpensePdfReport(
  expenses: Expense[],
  currencySymbol = '₹',
  budgets?: AllBudgets,
  selectedMonthKey?: string,
  income?: Income[]
): { success: boolean; message?: string } {
  if (!expenses || expenses.length === 0) {
    return {
      success: false,
      message: 'No expenses available to generate a report.',
    };
  }

  try {
    const doc = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
    });

    // Embed unicode font for crisp offline rendering of all characters and rupee symbol
    doc.addFileToVFS('LiberationSans.ttf', LIBERATION_SANS_BASE64);
    doc.addFont('LiberationSans.ttf', 'LiberationSans', 'normal');
    doc.addFont('LiberationSans.ttf', 'LiberationSans', 'bold');
    doc.setFont('LiberationSans');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const leftMargin = 14;
    const rightMargin = 14;
    const bottomMargin = 22;

    // Calculate overall statistics
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalEntries = expenses.length;

    // Group expenses by category
    const categoryGroups: { [category: string]: Expense[] } = {};
    expenses.forEach((e) => {
      const cat = e.category || 'Other';
      if (!categoryGroups[cat]) {
        categoryGroups[cat] = [];
      }
      categoryGroups[cat].push(e);
    });

    // Canonical category ordering
    const canonicalOrder = ['Food', 'Travel', 'Shopping', 'Bills/Rent', 'Medical', 'Other'];
    const sortedCategories = Object.keys(categoryGroups).sort((a, b) => {
      const idxA = canonicalOrder.indexOf(a);
      const idxB = canonicalOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    // Sort expenses chronologically (Oldest -> Newest) inside every category
    sortedCategories.forEach((cat) => {
      categoryGroups[cat].sort((a, b) => {
        const dateDiff = a.date.localeCompare(b.date);
        if (dateDiff !== 0) return dateDiff;
        return (a.createdAt || 0) - (b.createdAt || 0);
      });
    });

    // Calculate reporting period
    const allDates = expenses
      .map((e) => e.date)
      .filter(Boolean)
      .sort();
    const earliestDate = allDates[0];
    const latestDate = allDates[allDates.length - 1];
    let periodText = 'All Time';
    if (earliestDate && latestDate) {
      if (earliestDate === latestDate) {
        periodText = formatLongDate(earliestDate);
      } else {
        periodText = `${formatLongDate(earliestDate)} – ${formatLongDate(latestDate)}`;
      }
    }

    // Current generation date
    const now = new Date();
    const genDay = String(now.getDate()).padStart(2, '0');
    const genMonth = now.toLocaleDateString('en-US', { month: 'long' });
    const genYear = now.getFullYear();
    const generatedOnText = `${genDay} ${genMonth} ${genYear}`;

    let currentY = 16;

    // --- Header Section ---
    doc.setFont('LiberationSans', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('MR Expense Tracker', leftMargin, currentY);

    doc.setFont('LiberationSans', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text('Created by Modassir Raja', leftMargin, currentY + 5.5);

    // Right-aligned report dates
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Generated on: ${generatedOnText}`, pageWidth - rightMargin, currentY, {
      align: 'right',
    });
    doc.setFont('LiberationSans', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text(`Expense Report: ${periodText}`, pageWidth - rightMargin, currentY + 5.5, {
      align: 'right',
    });

    currentY += 13;

    // --- Overall Summary Card ---
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.roundedRect(leftMargin, currentY, pageWidth - leftMargin - rightMargin, 16, 2, 2, 'FD');

    doc.setFont('LiberationSans', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Overall Summary', leftMargin + 4, currentY + 5.5);

    doc.setFont('LiberationSans', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);

    const summaryTotalText = `Total Expenses: ${formatCurrency(totalExpenses, currencySymbol)}`;
    const summaryEntriesText = `Total Entries: ${totalEntries}`;
    const summaryCategoriesText = `Categories Used: ${sortedCategories.length}`;

    doc.text(summaryTotalText, leftMargin + 4, currentY + 11.5);
    doc.text(summaryEntriesText, leftMargin + 70, currentY + 11.5);
    doc.text(summaryCategoriesText, leftMargin + 130, currentY + 11.5);

    currentY += 21;

    // Monthly Financial Summary for the report month (Total Income, Total Expenses, Balance, Savings %)
    const reportMonth = selectedMonthKey || getCurrentMonthKey();
    const monthExpenses = expenses.filter((e) => e.date && e.date.startsWith(reportMonth));
    const monthIncome = (income || []).filter((i) => i.date && i.date.startsWith(reportMonth));

    const totalMonthIncome = Math.round(monthIncome.reduce((sum, i) => sum + i.amount, 0) * 100) / 100;
    const totalMonthExpenses = Math.round(monthExpenses.reduce((sum, e) => sum + e.amount, 0) * 100) / 100;
    const balance = Math.round((totalMonthIncome - totalMonthExpenses) * 100) / 100;
    const savings = balance > 0 ? balance : 0;
    const savingsPct =
      totalMonthIncome > 0 && savings > 0
        ? Math.round((savings / totalMonthIncome) * 1000) / 10
        : 0;

    // Only render Financial Summary if income is present or reportMonth has records
    if (totalMonthIncome > 0 || income?.length) {
      if (currentY + 24 > pageHeight - bottomMargin) {
        doc.addPage();
        currentY = 18;
      }

      doc.setFillColor(240, 253, 244); // emerald-50
      doc.setDrawColor(187, 247, 208); // emerald-200
      doc.setLineWidth(0.3);
      doc.roundedRect(leftMargin, currentY, pageWidth - leftMargin - rightMargin, 16, 2, 2, 'FD');

      doc.setFont('LiberationSans', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(6, 78, 59); // emerald-900
      doc.text(`Financial Summary (${formatMonthYear(reportMonth)})`, leftMargin + 4, currentY + 5.5);

      doc.setFont('LiberationSans', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(22, 101, 52); // emerald-800

      const incomeText = `Income: ${formatCurrency(totalMonthIncome, currencySymbol)}`;
      const expText = `Expenses: ${formatCurrency(totalMonthExpenses, currencySymbol)}`;
      const balText = `Balance: ${formatCurrency(balance, currencySymbol)}`;
      const savText = `Savings: ${savingsPct}%`;

      doc.text(incomeText, leftMargin + 4, currentY + 11.5);
      doc.text(expText, leftMargin + 50, currentY + 11.5);
      doc.text(balText, leftMargin + 102, currentY + 11.5);
      doc.text(savText, leftMargin + 150, currentY + 11.5);

      currentY += 21;
    }

    // Optional Monthly Budget Summary (for selected/current month)
    if (budgets && Object.keys(budgets).length > 0) {
      const budgetMonth = selectedMonthKey || getCurrentMonthKey();
      const budgetSummary = calculateMonthlyBudgetSummary(expenses, budgets, budgetMonth);

      if (budgetSummary.hasAnyBudget) {
        if (currentY + 50 > pageHeight - bottomMargin) {
          doc.addPage();
          currentY = 18;
        }

        doc.setFont('LiberationSans', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text(`Monthly Budget Summary (${formatMonthYear(budgetMonth)})`, leftMargin, currentY);

        currentY += 3;

        const budgetRows = budgetSummary.categories.map((c) => [
          c.category,
          formatCurrency(c.budget, currencySymbol),
          formatCurrency(c.spent, currencySymbol),
          c.isOverBudget
            ? `${formatCurrency(c.overAmount, currencySymbol)} over`
            : formatCurrency(c.remaining, currencySymbol),
          `${c.percentage}%`,
        ]);

        const totalRow = [
          'Total',
          formatCurrency(budgetSummary.totalBudget, currencySymbol),
          formatCurrency(budgetSummary.totalSpent, currencySymbol),
          budgetSummary.isOverBudget
            ? `${formatCurrency(budgetSummary.overAmount, currencySymbol)} over`
            : formatCurrency(budgetSummary.remaining, currencySymbol),
          `${budgetSummary.overallUsage}%`,
        ];

        autoTable(doc, {
          startY: currentY,
          head: [['Category', 'Budget', 'Spent', 'Remaining', 'Usage']],
          body: budgetRows,
          foot: [totalRow],
          theme: 'striped',
          styles: {
            font: 'LiberationSans',
            fontSize: 8.5,
            cellPadding: 2,
          },
          headStyles: {
            fillColor: [5, 150, 105], // emerald-600
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8.5,
          },
          footStyles: {
            fillColor: [241, 245, 249], // slate-100
            textColor: [15, 23, 42],
            fontStyle: 'bold',
            fontSize: 8.5,
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252],
          },
          columnStyles: {
            0: { cellWidth: 40, fontStyle: 'bold' },
            1: { cellWidth: 32, halign: 'right' },
            2: { cellWidth: 32, halign: 'right' },
            3: { cellWidth: 35, halign: 'right' },
            4: { cellWidth: 'auto', halign: 'right' },
          },
          margin: { left: leftMargin, right: rightMargin, top: 16, bottom: bottomMargin },
        });

        currentY = (doc as any).lastAutoTable.finalY + 12;
      }
    }

    // --- Category-Wise Expense Tables ---
    sortedCategories.forEach((category) => {
      const catExpenses = categoryGroups[category];
      const catTotal = catExpenses.reduce((sum, e) => sum + e.amount, 0);
      const catEntriesCount = catExpenses.length;

      // Check if we need a page break before starting this category header
      if (currentY + 45 > pageHeight - bottomMargin) {
        doc.addPage();
        currentY = 18;
      }

      // Category Section Title
      doc.setFont('LiberationSans', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(category, leftMargin, currentY);

      // Sub-stats
      doc.setFont('LiberationSans', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Total ${category} Expense: ${formatCurrency(
          catTotal,
          currencySymbol
        )}   •   Total ${category} Entries: ${catEntriesCount}`,
        leftMargin,
        currentY + 4.5
      );

      currentY += 7;

      // Build Table Rows
      const tableRows = catExpenses.map((exp) => [
        exp.id || '-',
        formatTableDate(exp.date),
        formatCurrency(exp.amount, currencySymbol),
        exp.remark || '-',
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['ID', 'Date', 'Amount', 'Remark']],
        body: tableRows,
        theme: 'striped',
        styles: {
          font: 'LiberationSans',
          fontSize: 8.5,
          cellPadding: 2,
          overflow: 'linebreak',
        },
        headStyles: {
          fillColor: [15, 23, 42], // slate-900
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8.5,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252], // slate-50
        },
        columnStyles: {
          0: { cellWidth: 42, textColor: [71, 85, 105] }, // ID
          1: { cellWidth: 30 }, // Date
          2: { cellWidth: 32, halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105] }, // Amount
          3: { cellWidth: 'auto' }, // Remark
        },
        margin: { left: leftMargin, right: rightMargin, top: 16, bottom: bottomMargin },
      });

      const tableEndY = (doc as any).lastAutoTable.finalY;

      // Category Total Line
      doc.setFont('LiberationSans', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(5, 150, 105); // emerald-600
      doc.text(
        `${category} Category Total:  ${formatCurrency(catTotal, currencySymbol)}`,
        pageWidth - rightMargin,
        tableEndY + 5.5,
        { align: 'right' }
      );

      currentY = tableEndY + 13;
    });

    // --- Category Summary Section at the End ---
    if (currentY + 50 > pageHeight - bottomMargin) {
      doc.addPage();
      currentY = 18;
    }

    doc.setFont('LiberationSans', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Category Summary', leftMargin, currentY);

    currentY += 4;

    const summaryTableRows = sortedCategories.map((cat) => {
      const catExpenses = categoryGroups[cat];
      const catTotal = catExpenses.reduce((sum, e) => sum + e.amount, 0);
      return [cat, String(catExpenses.length), formatCurrency(catTotal, currencySymbol)];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Category', 'Entries', 'Total']],
      body: summaryTableRows,
      foot: [['Grand Total', String(totalEntries), formatCurrency(totalExpenses, currencySymbol)]],
      theme: 'grid',
      styles: {
        font: 'LiberationSans',
        fontSize: 8.5,
        cellPadding: 2.2,
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: leftMargin, right: rightMargin, top: 16, bottom: bottomMargin },
    });

    const summaryEndY = (doc as any).lastAutoTable.finalY;

    // Grand Total Callout Box
    let grandTotalY = summaryEndY + 5;
    if (grandTotalY + 16 > pageHeight - bottomMargin) {
      doc.addPage();
      grandTotalY = 18;
    }

    doc.setFillColor(240, 253, 244); // emerald-50
    doc.setDrawColor(187, 247, 208); // emerald-200
    doc.setLineWidth(0.3);
    doc.roundedRect(
      pageWidth - rightMargin - 75,
      grandTotalY,
      75,
      13,
      1.5,
      1.5,
      'FD'
    );

    doc.setFont('LiberationSans', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(22, 101, 52); // emerald-800
    doc.text('Grand Total:', pageWidth - rightMargin - 70, grandTotalY + 8);

    doc.setFontSize(10.5);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text(
      formatCurrency(totalExpenses, currencySymbol),
      pageWidth - rightMargin - 4,
      grandTotalY + 8,
      { align: 'right' }
    );

    // --- Footer & Pagination across all pages ---
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Separator line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.2);
      doc.line(leftMargin, pageHeight - 14, pageWidth - rightMargin, pageHeight - 14);

      // Footer brand
      doc.setFont('LiberationSans', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text('MR Expense Tracker • Created by Modassir Raja', leftMargin, pageHeight - 9);

      // Page Number
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - rightMargin, pageHeight - 9, {
        align: 'right',
      });

      // Ownership line on final page
      if (i === totalPages) {
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(
          '© 2026 Modassir Raja. All rights reserved.',
          pageWidth / 2,
          pageHeight - 4.5,
          { align: 'center' }
        );
      }
    }

    const fileName = `MR-Expense-Report-${getTodayDateString()}.pdf`;
    doc.save(fileName);

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error generating PDF';
    return { success: false, message: `Failed to generate PDF: ${errorMsg}` };
  }
}
