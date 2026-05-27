import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import type { TextOptionsLight } from "jspdf";
import {
  isEmailNotificationComplete,
  NODE_TYPE_LABELS,
  type Flow,
  type FlowEdge,
  type FlowNode,
  type NodeType,
} from "../types/flow";
import { getNodesBoardBounds } from "./flowBounds";
import {
  countNodesWithStepOrder,
  orderNodesForProcess,
} from "./flowProcessOrder";

const MARGIN = 16;
const HEADER_H = 20;
const FOOTER_H = 11;
const CONTENT_TOP = MARGIN + HEADER_H + 4;
const LINE = 5.2;
const PX_TO_MM = 25.4 / 96;

type Rgb = [number, number, number];

const NODE_STYLE: Record<
  NodeType,
  { bg: Rgb; border: Rgb; text: Rgb; pill: Rgb }
> = {
  actor: {
    bg: [230, 241, 251],
    border: [55, 138, 221],
    text: [12, 68, 124],
    pill: [181, 212, 244],
  },
  step: {
    bg: [234, 243, 222],
    border: [99, 153, 34],
    text: [39, 80, 10],
    pill: [192, 221, 151],
  },
  notif: {
    bg: [250, 238, 218],
    border: [239, 159, 39],
    text: [99, 56, 6],
    pill: [250, 199, 117],
  },
  state: {
    bg: [238, 237, 254],
    border: [127, 119, 221],
    text: [60, 52, 137],
    pill: [206, 203, 246],
  },
  cancel: {
    bg: [252, 235, 235],
    border: [226, 75, 74],
    text: [163, 45, 45],
    pill: [247, 193, 193],
  },
  endok: {
    bg: [225, 245, 238],
    border: [29, 158, 117],
    text: [8, 80, 65],
    pill: [159, 225, 203],
  },
};

function slugify(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 60);
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      dateStyle: "long",
    });
  } catch {
    return iso;
  }
}

function hexToRgb(hex: string): Rgb {
  const h = hex.replace("#", "").trim();
  if (h.length !== 6) return [55, 138, 221];
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function hexToRgbString(hex: string): Rgb {
  return hexToRgb(hex);
}

function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function lighten(c: Rgb, t: number): Rgb {
  return mixRgb(c, [255, 255, 255], t);
}

function darken(c: Rgb, t: number): Rgb {
  return mixRgb(c, [0, 0, 0], t);
}

type PdfTheme = {
  primary: Rgb;
  primaryDark: Rgb;
  primarySoft: Rgb;
  ink: Rgb;
  muted: Rgb;
  line: Rgb;
  surface: Rgb;
  surfaceAlt: Rgb;
  white: Rgb;
};

function buildTheme(accentHex: string): PdfTheme {
  const primary = hexToRgb(accentHex);
  return {
    primary,
    primaryDark: darken(primary, 0.22),
    primarySoft: lighten(primary, 0.88),
    ink: [26, 26, 24],
    muted: [92, 91, 84],
    line: [227, 225, 216],
    surface: [255, 255, 255],
    surfaceAlt: [246, 245, 240],
    white: [255, 255, 255],
  };
}

class FlowPdfBuilder {
  private y = CONTENT_TOP;
  private sectionTitle = "Anexo";

  constructor(
    private pdf: jsPDF,
    private flow: Flow,
    private theme: PdfTheme,
  ) {}

  private pageW() {
    return this.pdf.internal.pageSize.getWidth();
  }

  private pageH() {
    return this.pdf.internal.pageSize.getHeight();
  }

  private contentW() {
    return this.pageW() - MARGIN * 2;
  }

  private bottomLimit() {
    return this.pageH() - FOOTER_H - MARGIN;
  }

  private setFill(c: Rgb) {
    this.pdf.setFillColor(c[0], c[1], c[2]);
  }

  private setDraw(c: Rgb) {
    this.pdf.setDrawColor(c[0], c[1], c[2]);
  }

  private setText(c: Rgb) {
    this.pdf.setTextColor(c[0], c[1], c[2]);
  }

  private newContentPage(sectionTitle: string) {
    this.pdf.addPage();
    this.sectionTitle = sectionTitle;
    this.paintPageChrome();
    this.y = CONTENT_TOP;
  }

  private paintPageChrome() {
    const w = this.pageW();
    this.setFill(this.theme.primary);
    this.pdf.rect(0, 0, w, HEADER_H + 6, "F");

    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(9);
    this.setText(this.theme.white);
    this.pdf.text(this.flow.name.toUpperCase(), MARGIN, 9);

    this.pdf.setFont("helvetica", "normal");
    this.pdf.setFontSize(11);
    this.pdf.text(this.sectionTitle, MARGIN, 16);

    this.setDraw(this.theme.line);
    this.pdf.setLineWidth(0.3);
    this.pdf.line(MARGIN, HEADER_H + 6, w - MARGIN, HEADER_H + 6);
  }

  paintAllFooters() {
    const total = this.pdf.getNumberOfPages();
    const generated = formatDate(new Date().toISOString());

    for (let p = 1; p <= total; p++) {
      this.pdf.setPage(p);
      const w = this.pageW();
      const h = this.pageH();
      const y = h - FOOTER_H;

      if (p === 1) {
        this.setDraw(this.theme.line);
        this.pdf.setLineWidth(0.25);
        this.pdf.line(MARGIN, y - 2, w - MARGIN, y - 2);
        this.pdf.setFont("helvetica", "normal");
        this.pdf.setFontSize(8);
        this.setText(this.theme.muted);
        this.pdf.text("Flujo de ventas · CEO digital", MARGIN, y + 4);
        this.pdf.text(
          `Página ${p} de ${total}`,
          w - MARGIN,
          y + 4,
          { align: "right" },
        );
        continue;
      }

      this.setFill(this.theme.surfaceAlt);
      this.pdf.rect(0, y - 1, w, FOOTER_H + 4, "F");
      this.setDraw(this.theme.line);
      this.pdf.line(0, y - 1, w, y - 1);

      this.pdf.setFont("helvetica", "normal");
      this.pdf.setFontSize(8);
      this.setText(this.theme.muted);
      this.pdf.text(`Generado: ${generated}`, MARGIN, y + 5);
      this.pdf.text(
        `Página ${p} de ${total}`,
        w - MARGIN,
        y + 5,
        { align: "right" },
      );
    }
  }

  private ensureSpace(needed: number): void {
    if (this.y + needed <= this.bottomLimit()) return;
    this.newContentPage(this.sectionTitle);
  }

  private sectionBlock(title: string, subtitle?: string): void {
    this.ensureSpace(18);
    const w = this.contentW();
    const h = subtitle ? 16 : 12;

    this.setFill(this.theme.surfaceAlt);
    this.pdf.roundedRect(MARGIN, this.y, w, h, 2, 2, "F");
    this.setFill(this.theme.primary);
    this.pdf.rect(MARGIN, this.y, 3.5, h, "F");

    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(12);
    this.setText(this.theme.ink);
    this.pdf.text(title, MARGIN + 8, this.y + 8);

    if (subtitle) {
      this.pdf.setFont("helvetica", "normal");
      this.pdf.setFontSize(8.5);
      this.setText(this.theme.muted);
      this.pdf.text(subtitle, MARGIN + 8, this.y + 13);
    }

    this.y += h + 6;
  }

  private wrappedText(
    text: string,
    opts?: {
      indent?: number;
      fontSize?: number;
      color?: Rgb;
      font?: "normal" | "bold";
      maxW?: number;
    },
  ): void {
    const indent = opts?.indent ?? 0;
    const fontSize = opts?.fontSize ?? 9.5;
    const maxW = (opts?.maxW ?? this.contentW()) - indent;

    this.pdf.setFont("helvetica", opts?.font ?? "normal");
    this.pdf.setFontSize(fontSize);
    this.setText(opts?.color ?? this.theme.muted);

    const lines = this.pdf.splitTextToSize(text, maxW) as string[];
    for (const line of lines) {
      this.ensureSpace(LINE);
      this.pdf.text(line, MARGIN + indent, this.y);
      this.y += LINE;
    }
  }

  private statCards(stats: { value: string; label: string }[]): void {
    const gap = 5;
    const cardW = (this.contentW() - gap * (stats.length - 1)) / stats.length;
    const cardH = 22;
    this.ensureSpace(cardH + 4);

    stats.forEach((s, i) => {
      const x = MARGIN + i * (cardW + gap);
      this.setFill(this.theme.white);
      this.setDraw(this.theme.line);
      this.pdf.setLineWidth(0.35);
      this.pdf.roundedRect(x, this.y, cardW, cardH, 2.5, 2.5, "FD");

      this.setFill(this.theme.primary);
      this.pdf.rect(x, this.y, cardW, 2.2, "F");

      this.pdf.setFont("helvetica", "bold");
      this.pdf.setFontSize(18);
      this.setText(this.theme.primaryDark);
      this.pdf.text(s.value, x + cardW / 2, this.y + 12, { align: "center" });

      this.pdf.setFont("helvetica", "normal");
      this.pdf.setFontSize(8);
      this.setText(this.theme.muted);
      this.pdf.text(s.label, x + cardW / 2, this.y + 18, { align: "center" });
    });

    this.y += cardH + 8;
  }

  drawCover(): void {
    const w = this.pageW();
    const h = this.pageH();
    const headerH = 52;

    this.setFill(this.theme.primary);
    this.pdf.rect(0, 0, w, headerH, "F");

    this.setFill(lighten(this.theme.primary, 0.15));
    this.pdf.circle(w - 28, 18, 36, "F");
    this.pdf.circle(w - 58, 38, 22, "F");

    this.pdf.setFont("helvetica", "normal");
    this.pdf.setFontSize(10);
    this.setText(this.theme.white);
    this.pdf.text("DOCUMENTO DE PROCESO", MARGIN, 16);

    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(24);
    const titleLines = this.pdf.splitTextToSize(
      this.flow.name,
      w - MARGIN * 2,
    ) as string[];
    this.pdf.text(titleLines, MARGIN, 28);

    let y = headerH + 14;

    if (this.flow.description.trim()) {
      const boxH = 28;
      this.setFill(this.theme.surfaceAlt);
      this.setDraw(this.theme.line);
      this.pdf.setLineWidth(0.3);
      this.pdf.roundedRect(MARGIN, y, this.contentW(), boxH, 3, 3, "FD");

      this.pdf.setFont("helvetica", "bold");
      this.pdf.setFontSize(9);
      this.setText(this.theme.muted);
      this.pdf.text("DESCRIPCIÓN", MARGIN + 6, y + 8);

      this.pdf.setFont("helvetica", "normal");
      this.pdf.setFontSize(11);
      this.setText(this.theme.ink);
      const desc = this.pdf.splitTextToSize(
        this.flow.description,
        this.contentW() - 12,
      ) as string[];
      this.pdf.text(desc.slice(0, 3), MARGIN + 6, y + 15);
      y += boxH + 10;
    }

    this.statCards([
      { value: String(this.flow.nodes.length), label: "Nodos" },
      { value: String(this.flow.edges.length), label: "Conexiones" },
      {
        value: String(countNodesWithStepOrder(this.flow.nodes)),
        label: "Pasos numerados",
      },
    ]);

    const metaY = h - FOOTER_H - 22;
    this.setFill(this.theme.primarySoft);
    this.pdf.roundedRect(MARGIN, metaY, this.contentW(), 18, 2, 2, "F");

    this.pdf.setFont("helvetica", "normal");
    this.pdf.setFontSize(9);
    this.setText(this.theme.ink);
    this.pdf.text(
      `Última actualización: ${formatDate(this.flow.updatedAt)}`,
      MARGIN + 6,
      metaY + 7,
    );
    this.pdf.text(
      `Exportado: ${formatDate(new Date().toISOString())}`,
      MARGIN + 6,
      metaY + 13,
    );
  }

  drawDiagram(image: {
    dataUrl: string;
    widthMm: number;
    heightMm: number;
  }): void {
    this.newContentPage("Mapa del proceso");
    this.sectionBlock(
      "Diagrama del flujo",
      "Vista general de actores, pasos, decisiones y conexiones",
    );

    const captionH = 8;
    const framePad = 4;
    const maxW = this.contentW();
    const maxH = this.bottomLimit() - this.y - captionH - framePad * 2;
    const fit = Math.min(maxW / image.widthMm, maxH / image.heightMm);
    const imgW = image.widthMm * fit;
    const imgH = image.heightMm * fit;
    const frameW = imgW + framePad * 2;
    const frameH = imgH + framePad * 2;
    const frameX = MARGIN + (maxW - frameW) / 2;

    this.ensureSpace(frameH + captionH + 6);

    this.setFill([235, 234, 228]);
    this.pdf.roundedRect(
      frameX + 1.2,
      this.y + 1.2,
      frameW,
      frameH,
      3,
      3,
      "F",
    );

    this.setFill(this.theme.white);
    this.setDraw(this.theme.line);
    this.pdf.setLineWidth(0.4);
    this.pdf.roundedRect(frameX, this.y, frameW, frameH, 3, 3, "FD");

    this.pdf.addImage(
      image.dataUrl,
      "PNG",
      frameX + framePad,
      this.y + framePad,
      imgW,
      imgH,
    );

    this.y += frameH + 5;
    this.pdf.setFont("helvetica", "italic");
    this.pdf.setFontSize(8);
    this.setText(this.theme.muted);
    this.pdf.text(
      "Detalle de pasos y transiciones en las páginas siguientes.",
      this.pageW() / 2,
      this.y,
      { align: "center" },
    );
    this.y += captionH;
  }

  private drawStepCard(node: FlowNode): void {
    const style = NODE_STYLE[node.type];
    const orderLabel =
      node.stepOrder != null && node.stepOrder > 0
        ? String(node.stepOrder)
        : "—";
    const subLines = node.sub.trim()
      ? (this.pdf.splitTextToSize(node.sub, this.contentW() - 28) as string[])
      : [];
    const cardH = 16 + subLines.length * 4.8;
    this.ensureSpace(cardH + 4);

    const x = MARGIN;
    const w = this.contentW();

    this.setFill(style.bg);
    this.setDraw(style.border);
    this.pdf.setLineWidth(0.45);
    this.pdf.roundedRect(x, this.y, w, cardH, 2.5, 2.5, "FD");

    this.setFill(style.border);
    this.pdf.circle(x + 9, this.y + 9, 5.5, "F");
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(8);
    this.setText(this.theme.white);
    this.pdf.text(orderLabel, x + 9, this.y + 10.2, { align: "center" });

    const pillW = 28;
    this.setFill(style.pill);
    this.pdf.roundedRect(x + 18, this.y + 4.5, pillW, 6, 2, 2, "F");
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(6.5);
    this.setText(style.text);
    this.pdf.text(NODE_TYPE_LABELS[node.type], x + 18 + pillW / 2, this.y + 8.5, {
      align: "center",
    });

    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(10.5);
    this.setText(style.text);
    this.pdf.text(node.title, x + 18 + pillW + 4, this.y + 9);

    if (subLines.length > 0) {
      this.pdf.setFont("helvetica", "normal");
      this.pdf.setFontSize(8.5);
      this.setText(this.theme.muted);
      this.pdf.text(subLines, x + 18, this.y + 14);
    }

    this.y += cardH + 3;
  }

  private drawTransitionsTable(
    edges: FlowEdge[],
    nodeById: Map<string, FlowNode>,
  ): void {
    const cols = [62, 62, 48, 18];
    const rowH = 8;
    const headerH = 9;

    this.ensureSpace(headerH + rowH * Math.min(edges.length, 1) + 4);

    const drawRow = (
      cells: string[],
      y: number,
      isHeader: boolean,
      edgeColor?: string,
    ) => {
      let cx = MARGIN;
      if (isHeader) {
        this.setFill(this.theme.primary);
        this.pdf.rect(MARGIN, y, this.contentW(), headerH, "F");
        this.pdf.setFont("helvetica", "bold");
        this.pdf.setFontSize(8);
        this.setText(this.theme.white);
      } else {
        this.setFill(this.theme.white);
        this.setDraw(this.theme.line);
        this.pdf.setLineWidth(0.2);
        this.pdf.rect(MARGIN, y, this.contentW(), rowH, "FD");
        this.pdf.setFont("helvetica", "normal");
        this.pdf.setFontSize(8);
        this.setText(this.theme.ink);
      }

      cells.forEach((cell, i) => {
        const opts: TextOptionsLight = { maxWidth: cols[i] - 4 };
        const ty = isHeader ? y + 6 : y + 5.5;
        if (i === 0 && !isHeader && edgeColor) {
          const rgb = hexToRgbString(edgeColor);
          this.setFill(rgb);
          this.pdf.roundedRect(cx + 2, y + 2.5, 4, rowH - 5, 1, 1, "F");
        }
        this.pdf.text(cell, cx + (i === 0 && !isHeader ? 8 : 3), ty, opts);
        cx += cols[i];
      });
    };

    drawRow(["Origen", "Destino", "Etiqueta", ""], this.y, true);
    this.y += headerH;

    if (edges.length === 0) {
      this.ensureSpace(rowH);
      drawRow(["—", "—", "Sin conexiones", ""], this.y, false);
      this.y += rowH + 6;
      return;
    }

    for (const e of edges) {
      this.ensureSpace(rowH + 2);
      const from = nodeById.get(e.from)?.title ?? e.from;
      const to = nodeById.get(e.to)?.title ?? e.to;
      const label = e.label ?? "—";
      drawRow([from, to, label, ""], this.y, false, e.color);
      this.y += rowH;
    }
    this.y += 6;
  }

  private drawEmailCard(node: FlowNode): void {
    const em = node.emailNotification!;
    const cardH = 26;
    this.ensureSpace(cardH + 4);

    this.setFill([232, 248, 242]);
    this.setDraw([29, 158, 117]);
    this.pdf.setLineWidth(0.5);
    this.pdf.roundedRect(MARGIN, this.y, this.contentW(), cardH, 2.5, 2.5, "FD");
    this.setFill([29, 158, 117]);
    this.pdf.rect(MARGIN, this.y, 3, cardH, "F");

    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(10);
    this.setText([8, 80, 65]);
    this.pdf.text(node.title, MARGIN + 8, this.y + 8);

    this.pdf.setFont("helvetica", "normal");
    this.pdf.setFontSize(8.5);
    this.setText(this.theme.muted);
    this.pdf.text(
      `Para: ${em.recipient}  ·  ${em.email}`,
      MARGIN + 8,
      this.y + 14,
    );
    const msg = this.pdf.splitTextToSize(em.notifyAbout, this.contentW() - 16) as string[];
    this.pdf.text(msg.slice(0, 2), MARGIN + 8, this.y + 19);

    this.y += cardH + 4;
  }

  drawAnnex(): void {
    this.newContentPage("Detalle del proceso");
    const nodeById = new Map(this.flow.nodes.map((n) => [n.id, n]));

    this.sectionBlock("Resumen ejecutivo");
    this.statCards([
      { value: String(this.flow.nodes.length), label: "Etapas y actores" },
      {
        value: String(
          this.flow.nodes.filter((n) =>
            isEmailNotificationComplete(n.emailNotification),
          ).length,
        ),
        label: "Emails activos",
      },
      { value: String(this.flow.edges.length), label: "Transiciones" },
    ]);

    const steps = orderNodesForProcess(this.flow);
    if (steps.length > 0) {
      this.sectionBlock(
        "Recorrido del proceso",
        "Orden según el número asignado en cada nodo del diagrama",
      );
      for (const step of steps) {
        this.drawStepCard(step.node);
      }
      this.y += 4;
    }

    this.sectionBlock("Transiciones", "Relación entre nodos del flujo");
    this.drawTransitionsTable(this.flow.edges, nodeById);

    const withEmail = this.flow.nodes
      .filter((n) => isEmailNotificationComplete(n.emailNotification))
      .sort((a, b) => {
        const ao = a.stepOrder ?? Number.POSITIVE_INFINITY;
        const bo = b.stepOrder ?? Number.POSITIVE_INFINITY;
        return ao - bo;
      });
    this.sectionBlock(
      "Notificaciones por email",
      "Nodos que disparan correo automático",
    );
    if (withEmail.length === 0) {
      this.wrappedText("Ningún nodo tiene una notificación de email completa.", {
        fontSize: 9,
      });
    } else {
      for (const n of withEmail) this.drawEmailCard(n);
    }
  }
}

async function captureBoard(board: HTMLElement, flow: Flow) {
  const bounds = getNodesBoardBounds(flow.nodes);
  const scale = Math.min(2, 4096 / Math.max(bounds.width, bounds.height));

  const canvas = await html2canvas(board, {
    backgroundColor: "#ffffff",
    scale,
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    logging: false,
    useCORS: true,
  });

  return {
    dataUrl: canvas.toDataURL("image/png"),
    widthMm: canvas.width * PX_TO_MM,
    heightMm: canvas.height * PX_TO_MM,
  };
}

export async function exportFlowToPdf(flow: Flow, boardElement: HTMLElement) {
  const image = await captureBoard(boardElement, flow);
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const builder = new FlowPdfBuilder(pdf, flow, buildTheme(flow.color));
  builder.drawCover();
  builder.drawDiagram(image);
  builder.drawAnnex();
  builder.paintAllFooters();

  pdf.save(`flujo-${slugify(flow.name) || flow.id}.pdf`);
}
