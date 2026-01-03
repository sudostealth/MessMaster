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
    groupedMeals: {
        memberName: string;
        meals: {
            date: string;
            breakfast: number;
            lunch: number;
            dinner: number;
        }[]
    }[];
    tables: {
        mealExpenses: { date: string, shopperName: string, amount: number, details?: string }[];
        deposits: { date: string, memberName: string, amount: number }[];
        otherExpenses: { date: string, category: string, shopperName: string, amount: number }[];
    }
}

// Function to fetch and load NotoSansBengali font
async function loadBanglaFont(doc: jsPDF) {
    try {
        const fontUrl = "https://raw.githubusercontent.com/google/fonts/main/ofl/notosansbengali/NotoSansBengali-Regular.ttf"
        const response = await fetch(fontUrl)
        if (!response.ok) throw new Error("Failed to fetch font")

        const buffer = await response.arrayBuffer()

        // Convert ArrayBuffer to Base64 (Standard browser approach)
        let binary = ''
        const bytes = new Uint8Array(buffer)
        const len = bytes.byteLength
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i])
        }
        const base64Font = window.btoa(binary)

        // Add font to VFS
        doc.addFileToVFS("NotoSansBengali-Regular.ttf", base64Font)
        doc.addFont("NotoSansBengali-Regular.ttf", "NotoSansBengali", "normal")
        return true
    } catch (error) {
        console.error("Error loading font:", error)
        return false
    }
}

export const generateMonthReportPDF = async (data: ReportData) => {
    const doc = new jsPDF()

    // Load and set font
    const fontLoaded = await loadBanglaFont(doc)
    if (fontLoaded) {
        doc.setFont("NotoSansBengali")
    } else {
        doc.setFont("helvetica")
    }

    // Common Styles
    const redHeaderColor: [number, number, number] = [220, 38, 38]
    const defaultTextColor: [number, number, number] = [0, 0, 0]

    // Helper: Add Watermark
    const addWatermark = (pdfDoc: jsPDF) => {
        const totalPages = pdfDoc.getNumberOfPages()
        for (let i = 1; i <= totalPages; i++) {
            pdfDoc.setPage(i)
            pdfDoc.setTextColor(230, 230, 230)
            pdfDoc.setFontSize(60)
            // Use Helvetica for watermark as it's standard ASCII art text essentially
            pdfDoc.setFont("helvetica", "bold")
            // Rotate text 45 degrees
            pdfDoc.saveGraphicsState()
            pdfDoc.setGState(new (pdfDoc as any).GState({ opacity: 0.1 }))
            pdfDoc.text("Mess Manager", 50, 150, { angle: 45 })
            pdfDoc.restoreGraphicsState()

            // Restore Bangla font
            if(fontLoaded) pdfDoc.setFont("NotoSansBengali", "normal")
        }
    }

    // Helper: Check page break
    const checkPageBreak = (currentY: number) => {
        if (currentY > 270) {
            doc.addPage()
            return 20
        }
        return currentY
    }

    // --- Header ---
    doc.setFontSize(18)
    doc.setTextColor(...redHeaderColor)
    // Keep header in Bangla font just in case mess name is Bangla?
    // Actually, "Mess Manager:..." is English.
    // Ideally mix fonts, but jspdf handles one font active.
    // If the data contains Bangla, we MUST use the Bangla font.
    // NotoSansBengali usually supports Latin too.

    doc.text("Mess Manager: Find Meal Expense Easily", 105, 15, { align: "center" })

    doc.setFontSize(14)
    doc.setTextColor(...redHeaderColor)
    doc.text("Active Month Details", 105, 23, { align: "center" })

    doc.setFontSize(12)
    doc.setTextColor(...redHeaderColor)
    doc.text(`Month Title: ${data.monthName}`, 105, 30, { align: "center" })

    // --- Mess Details Section ---
    let yPos = 40
    doc.setFontSize(10)
    doc.setTextColor(...defaultTextColor)
    if(fontLoaded) doc.setFont("NotoSansBengali", "normal")

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
    doc.setTextColor(...redHeaderColor)
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
        styles: {
            font: fontLoaded ? "NotoSansBengali" : "helvetica",
            textColor: [0, 0, 0],
            fontSize: 9
        },
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1, fontStyle: 'bold' },
        bodyStyles: { lineColor: [0, 0, 0], lineWidth: 0.1 },
        theme: 'grid'
    })

    // @ts-expect-error
    yPos = doc.lastAutoTable.finalY + 15

    // --- Title for Detailed Section ---
    doc.setFontSize(12)
    doc.setTextColor(...redHeaderColor)
    doc.text("Meal, Deposit, Cost, OtherCost Details", 105, yPos, { align: "center" })
    yPos += 10

    // --- Member-wise Meal Tables ---
    data.groupedMeals.forEach(group => {
        yPos = checkPageBreak(yPos)
        doc.setFontSize(11)
        doc.setTextColor(...defaultTextColor)
        doc.text(`Meal Details for: ${group.memberName}`, 14, yPos)
        yPos += 2

        if (group.meals.length > 0) {
             autoTable(doc, {
                startY: yPos,
                head: [['Date', 'Breakfast', 'Lunch', 'Dinner']],
                body: group.meals.map(m => [
                    new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                    m.breakfast,
                    m.lunch,
                    m.dinner
                ]),
                styles: { font: fontLoaded ? "NotoSansBengali" : "helvetica", fontSize: 9, textColor: [0, 0, 0] },
                headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1, fontStyle: 'bold' },
                bodyStyles: { lineColor: [0, 0, 0], lineWidth: 0.1 },
                theme: 'grid',
                // Keep table together if possible
                pageBreak: 'auto'
             })
             // @ts-expect-error
             yPos = doc.lastAutoTable.finalY + 10
        } else {
             doc.setFontSize(9)
             doc.setTextColor(100, 100, 100)
             doc.text("No meals recorded", 14, yPos + 5)
             yPos += 15
        }
    })

    // --- Meal Cost Table ---
    yPos = checkPageBreak(yPos)
    doc.setFontSize(12)
    doc.setTextColor(...redHeaderColor)
    doc.text("Meal Cost Table", 14, yPos)
    yPos += 2

    if (data.tables.mealExpenses.length > 0) {
        autoTable(doc, {
            startY: yPos,
            head: [['Date', 'Items', 'Shopper Name', 'Amount']],
            body: data.tables.mealExpenses.map(e => [
                new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                e.details || '-',
                e.shopperName,
                e.amount.toFixed(2)
            ]),
            styles: { font: fontLoaded ? "NotoSansBengali" : "helvetica", fontSize: 9, textColor: [0, 0, 0] },
            headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1, fontStyle: 'bold' },
            bodyStyles: { lineColor: [0, 0, 0], lineWidth: 0.1 },
            theme: 'grid'
        })
        // @ts-expect-error
        yPos = doc.lastAutoTable.finalY + 15
    } else {
        doc.text("No meal costs recorded.", 14, yPos + 8)
        yPos += 20
    }

    // --- Deposit Table ---
    yPos = checkPageBreak(yPos)
    doc.setFontSize(12)
    doc.setTextColor(...redHeaderColor)
    doc.text("Deposit Table", 14, yPos)
    yPos += 2

    if (data.tables.deposits.length > 0) {
        autoTable(doc, {
            startY: yPos,
            head: [['Date', 'Member Name', 'Amount']],
            body: data.tables.deposits.map(d => [
                new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                d.memberName,
                d.amount.toFixed(2)
            ]),
            styles: { font: fontLoaded ? "NotoSansBengali" : "helvetica", fontSize: 9, textColor: [0, 0, 0] },
            headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1, fontStyle: 'bold' },
            bodyStyles: { lineColor: [0, 0, 0], lineWidth: 0.1 },
            theme: 'grid'
        })
        // @ts-expect-error
        yPos = doc.lastAutoTable.finalY + 15
    } else {
        doc.text("No deposits recorded.", 14, yPos + 8)
        yPos += 20
    }

    // --- Other Cost Table ---
    yPos = checkPageBreak(yPos)
    doc.setFontSize(12)
    doc.setTextColor(...redHeaderColor)
    doc.text("Other Cost Table", 14, yPos)
    yPos += 2

    if (data.tables.otherExpenses.length > 0) {
        autoTable(doc, {
            startY: yPos,
            head: [['Date', 'Category', 'Shopper Name', 'Amount']],
            body: data.tables.otherExpenses.map(e => [
                new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                e.category,
                e.shopperName,
                e.amount.toFixed(2)
            ]),
            styles: { font: fontLoaded ? "NotoSansBengali" : "helvetica", fontSize: 9, textColor: [0, 0, 0] },
            headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1, fontStyle: 'bold' },
            bodyStyles: { lineColor: [0, 0, 0], lineWidth: 0.1 },
            theme: 'grid'
        })
    } else {
        doc.text("No other costs recorded.", 14, yPos + 8)
    }

    // Footer
    const pageCount = doc.getNumberOfPages()
    doc.setFontSize(8)
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        // Switch to Helvetica for footer as it's English
        doc.setFont("helvetica")
        doc.text("By MESS MANAGER, " + new Date().toLocaleDateString(), 14, doc.internal.pageSize.height - 10)
        doc.text("Download Mobile App", doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 10)
    }

    addWatermark(doc)

    doc.save(`${data.messName}_${data.monthName}_Detailed_Report.pdf`)
}
