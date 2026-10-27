import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorker;

async function readPdf(file) {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocument({ data }).promise;
  const pages = [];
  for (let index = 1; index <= pdf.numPages; index += 1) {
    const page = await pdf.getPage(index);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(" "));
  }
  return pages.join("\n");
}

export async function readDocumentFile(file) {
  const name = file.name;
  const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
  if (ext === "txt" || ext === "md") return { name, text: await file.text() };
  if (ext === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return { name, text: result.value || "" };
  }
  if (ext === "xlsx" || ext === "xls") {
    const XLSX = await import("xlsx");
    const book = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const text = book.SheetNames.map((sheet) => XLSX.utils.sheet_to_csv(book.Sheets[sheet])).join("\n");
    return { name, text };
  }
  if (ext === "pdf") return { name, text: await readPdf(file) };
  throw new Error("请上传 txt、md、docx、xlsx 或 pdf");
}
