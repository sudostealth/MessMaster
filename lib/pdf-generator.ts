import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface ReportData {
    messName: string;
    monthName: string;
    messDetails: {
        balance: number;
        totalMeal: number;
        totalDeposit: number;
        totalMealCost: number;
        mealRate: number;
        totalSharedCost: number;
        totalIndividualCost: number;
        totalCost: number;
    };
    memberSummaries: {
        name: string;
        totalMeals: number;
        totalDeposit: number;
        totalCost: number; // Meal + Shared + Individual
        balance: number;
    }[];
    mealLogs: {
        date: string;
        memberName: string;
        breakfast: number;
        lunch: number;
        dinner: number;
    }[];
}

export const generateMonthReportPDF = (data: ReportData) => {
    const doc = new jsPDF()
    const themeColor = [124, 58, 237] // Violet-600 RGB
    const accentColor = [220, 38, 38] // Red-600 RGB for 'Active Month Details'

    // Helper: Add Watermark
    const addWatermark = (pdfDoc: jsPDF) => {
        const totalPages = pdfDoc.getNumberOfPages()
        for (let i = 1; i <= totalPages; i++) {
            pdfDoc.setPage(i)
            pdfDoc.setTextColor(230, 230, 230)
            pdfDoc.setFontSize(60)
            pdfDoc.setFont("helvetica", "bold")
            // Rotate text 45 degrees
            pdfDoc.saveGraphicsState()
            pdfDoc.setGState(new (pdfDoc as any).GState({ opacity: 0.1 }))
            pdfDoc.text("Mess Manager", 50, 150, { angle: 45 })
            pdfDoc.restoreGraphicsState()
        }
    }

    // --- Header ---
    doc.setFontSize(18)
    doc.setTextColor(220, 38, 38) // Red
    doc.setFont("helvetica", "bold")
    doc.text("Mess Manager: Find Meal Expense Easily", 105, 15, { align: "center" })

    doc.setFontSize(14)
    doc.setTextColor(220, 38, 38)
    doc.text("Active Month Details", 105, 23, { align: "center" })

    doc.setFontSize(12)
    doc.setTextColor(220, 38, 38)
    doc.text(`Month Title: ${data.monthName}`, 105, 30, { align: "center" })

    // --- Mess Details Section ---
    let yPos = 40
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.setFont("helvetica", "normal")

    const details = [
        `Mess Name: ${data.messName}`,
        `Mess Balance: ${data.messDetails.balance.toFixed(2)} TK`,
        `Mess Total Meal: ${data.messDetails.totalMeal}`,
        `Mess Total Deposit: ${data.messDetails.totalDeposit.toFixed(2)} TK`,
        `Mess Total Meal Cost: ${data.messDetails.totalMealCost.toFixed(2)} TK`,
        `Mess Meal Rate: ${data.messDetails.mealRate.toFixed(2)} TK`,
        `Total Shared Cost: ${data.messDetails.totalSharedCost.toFixed(2)} TK`,
        `Total Individual Cost: ${data.messDetails.totalIndividualCost.toFixed(2)} TK`,
        `Mess Total Cost(Meal+Other): ${data.messDetails.totalCost.toFixed(2)}`
    ]

    details.forEach(line => {
        doc.text(line, 14, yPos)
        yPos += 6
    })

    yPos += 5

    // --- Table 1: Member Summary ---
    doc.setFontSize(12)
    doc.setTextColor(220, 38, 38) // Red Header
    doc.text("Member Summary Info Table", 14, yPos)
    yPos += 2

    autoTable(doc, {
        startY: yPos,
        head: [['Member Name', 'Total Meal', 'Total Deposit', 'Total Cost(Meal+Shared+Individual)', 'Balance']],
        body: data.memberSummaries.map(m => [
            m.name,
            m.totalMeals,
            m.totalDeposit.toFixed(2),
            m.totalCost.toFixed(2),
            m.balance.toFixed(2)
        ]),
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1, fontStyle: 'bold' },
        bodyStyles: { lineColor: [0, 0, 0], lineWidth: 0.1 },
        styles: { textColor: [0, 0, 0], fontSize: 9 },
        theme: 'grid'
    })

    // @ts-expect-error
    yPos = doc.lastAutoTable.finalY + 15

    // --- Table 2: Meal Details ---
    doc.setFontSize(12)
    doc.setTextColor(220, 38, 38)
    doc.text("Meal, Deposit, Cost, OtherCost Details", 105, yPos, { align: "center" })
    yPos += 8

    doc.text("Meal Table", 14, yPos)
    yPos += 2

    autoTable(doc, {
        startY: yPos,
        head: [['Date', 'Member Name', 'Breakfast', 'Lunch', 'Dinner']],
        body: data.mealLogs.map(log => [
            new Date(log.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), // "1st Nov" style approx
            log.memberName,
            log.breakfast,
            log.lunch,
            log.dinner
        ]),
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1, fontStyle: 'bold' },
        bodyStyles: { lineColor: [0, 0, 0], lineWidth: 0.1 },
        styles: { textColor: [0, 0, 0], fontSize: 9 },
        theme: 'grid'
    })

    // Footer
    const pageCount = doc.getNumberOfPages()
    doc.setFontSize(8)
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.text("By MESS MANAGER, " + new Date().toLocaleDateString(), 14, doc.internal.pageSize.height - 10)
        doc.text("Download Mobile App", doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 10)
    }

    addWatermark(doc)

    doc.save(`${data.messName}_${data.monthName}_Detailed_Report.pdf`)
}
