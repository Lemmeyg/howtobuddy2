import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import PDFDocument from "pdfkit";
import { Document, Packer, Paragraph, TextRun, Header, Footer, PageNumber, AlignmentType } from "docx";

const exportSchema = z.object({
  format: z.enum(["html", "markdown", "plain", "pdf", "docx"]),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { format } = exportSchema.parse(body);

    // Get the document
    const { data: document, error: documentError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", session.user.id)
      .single();

    if (documentError || !document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Get the content to export
    const content = document.generated_content || document.content;
    const plainText = content.replace(/<[^>]*>/g, "");

    // Handle different export formats
    switch (format) {
      case "html":
        return new NextResponse(
          `<html><body>${content}</body></html>`,
          {
            headers: {
              "Content-Type": "text/html",
              "Content-Disposition": `attachment; filename="${document.title}.html"`,
            },
          }
        );

      case "markdown":
        return new NextResponse(
          plainText,
          {
            headers: {
              "Content-Type": "text/markdown",
              "Content-Disposition": `attachment; filename="${document.title}.md"`,
            },
          }
        );

      case "plain":
        return new NextResponse(
          plainText,
          {
            headers: {
              "Content-Type": "text/plain",
              "Content-Disposition": `attachment; filename="${document.title}.txt"`,
            },
          }
        );

      case "pdf":
        // Create PDF document
        const pdfDoc = new PDFDocument({
          size: "A4",
          margin: 50,
          info: {
            Title: document.title,
            Author: session.user.email,
            CreationDate: new Date(),
          },
        });

        const chunks: Uint8Array[] = [];

        pdfDoc.on("data", (chunk) => chunks.push(chunk));
        pdfDoc.on("end", () => {
          // This will be handled by the Promise
        });

        // Add header
        pdfDoc.fontSize(10)
          .text(document.title, { align: "center" })
          .moveDown();

        // Add content
        pdfDoc.fontSize(12)
          .text(plainText, {
            align: "left",
            width: 500,
            lineGap: 5,
          });

        // Add footer with page numbers
        const pageCount = pdfDoc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
          pdfDoc.switchToPage(i);
          pdfDoc.fontSize(8)
            .text(
              `Page ${i + 1} of ${pageCount}`,
              pdfDoc.page.width - 100,
              pdfDoc.page.height - 30,
              { align: "center" }
            );
        }

        // Finalize PDF
        pdfDoc.end();

        // Wait for PDF generation to complete
        const pdfBuffer = await new Promise<Buffer>((resolve) => {
          pdfDoc.on("end", () => {
            resolve(Buffer.concat(chunks));
          });
        });

        return new NextResponse(pdfBuffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${document.title}.pdf"`,
          },
        });

      case "docx":
        // Create DOCX document
        const doc = new Document({
          title: document.title,
          creator: session.user.email,
          description: "Generated document",
          sections: [{
            properties: {
              page: {
                margin: {
                  top: 1000,
                  right: 1000,
                  bottom: 1000,
                  left: 1000,
                },
              },
            },
            headers: {
              default: new Header({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: document.title,
                        bold: true,
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
            },
            footers: {
              default: new Footer({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Page ",
                      }),
                      new PageNumber(),
                      new TextRun({
                        text: " of ",
                      }),
                      new TextRun({
                        text: "1", // This will be updated with the actual page count
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: plainText,
                    size: 24, // 12pt
                  }),
                ],
                spacing: {
                  after: 200,
                  line: 360, // 1.5 line spacing
                },
              }),
            ],
          }],
        });

        // Generate DOCX buffer
        const docxBuffer = await Packer.toBuffer(doc);

        return new NextResponse(docxBuffer, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "Content-Disposition": `attachment; filename="${document.title}.docx"`,
          },
        });

      default:
        throw new Error("Unsupported export format");
    }
  } catch (error) {
    console.error("Error exporting document:", error);
    return NextResponse.json(
      { error: "Failed to export document" },
      { status: 500 }
    );
  }
} 