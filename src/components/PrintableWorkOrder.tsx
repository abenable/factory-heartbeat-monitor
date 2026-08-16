import { WorkOrder, getMachine, woTypeLabel } from "@/data/cmms";
import logoRed from "@/assets/kmc-logo-red.svg";

/**
 * Printable Maintenance Work Order Form — mirrors the physical KMC paper
 * form (header info grid, CWO reference box, description boxes, spare
 * parts/labour table, completion sign-off). Renders nothing on screen;
 * appears only when window.print() is invoked. Designed to fit one A4 page.
 */
export function PrintableWorkOrder({ wo }: { wo: WorkOrder }) {
  const machine = getMachine(wo.machineId);

  return (
    <div className="print-only print-block wo-print" data-print-wo={wo.id}>
      <WorkOrderFormMarkup wo={wo} machineName={machine?.name} />
    </div>
  );
}

function WorkOrderFormMarkup({
  wo,
  machineName,
}: {
  wo: WorkOrder;
  machineName?: string;
}) {
  const partsRows = buildPartsRows(wo);

  return (
    <>
      <div className="wo-print-header">
        <div className="wo-print-brand">
          <img src={logoRed} alt="KMC" className="wo-print-logo" />
          <div>
            <h1>Kiira Motors Corporation</h1>
            <h2>Maintenance Work Order Form</h2>
          </div>
        </div>
        <div className="wo-print-cwo">
          <span>CWO</span>
          <strong>{wo.referenceNumber ?? wo.id}</strong>
        </div>
      </div>

      <table className="wo-print-grid">
        <tbody>
          <Row label="Order ID" value={wo.id} label2="Date Returned" value2="" />
          <Row label="Requestor Name" value={wo.requestorName} label2="Workshop" value2={wo.workshop} />
          <Row label="Email" value={wo.requestorEmail} label2="Department" value2={wo.department} />
          <Row label="Designation" value={wo.requestorDesignation} label2="Order Date" value2={fmtDate(wo.createdAt)} />
          <Row label="Machine/Equipment Name" value={machineName} label2="Type of Issue" value2={woTypeLabel(wo.type)} />
          <Row label="Machine/Equipment ID" value={wo.machineId} label2="Priority Level" value2={wo.priority.toUpperCase()} />
          <Row label="Date Needed" value={fmtDate(wo.dueAt)} label2="Work Assigned to" value2={wo.assignee} />
        </tbody>
      </table>

      <Box label="Request Description" value={wo.problemDescription} />
      <Box label="Description of Work Completed" value={wo.workLog?.descriptionOfWorkCompleted} />
      <Box label="Explanation of Incomplete Work" value={wo.workLog?.explanationOfIncompleteWork} />
      <Box label="Remarks (After Completion of Work)" value={wo.workLog?.comments} />
      <Box label="Equipment / Tools Used" value={wo.resources?.tools.join(", ")} />

      <h3 className="wo-print-table-title">Table 1: Spare Parts Used and Labour</h3>
      <table className="wo-print-parts">
        <thead>
          <tr>
            <th style={{ width: 28 }}>SN</th>
            <th>Description</th>
            <th style={{ width: 50 }}>Qty</th>
            <th style={{ width: 90 }}>Price per Unit</th>
            <th style={{ width: 90 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {partsRows.map((r, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{r}</td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          ))}
          <tr>
            <td colSpan={4} style={{ textAlign: "right", fontWeight: 700 }}>
              Total
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <div className="wo-print-signoff">
        <SignoffField label="Work Completed by" value={wo.workLog?.completedByName} />
        <SignoffField
          label="Date & Time Completed"
          value={wo.workLog?.actualCompletionTime ? fmtDateTime(wo.workLog.actualCompletionTime) : undefined}
        />
        <SignoffField label="Work Approved by" value={wo.workLog?.approvedByName} />
        <SignoffField label="Date" value={wo.workLog?.approvedAt ? fmtDate(wo.workLog.approvedAt) : undefined} />
      </div>
    </>
  );
}

function Row({
  label,
  value,
  label2,
  value2,
}: {
  label: string;
  value?: string;
  label2: string;
  value2?: string;
}) {
  return (
    <tr>
      <th>{label}</th>
      <td>{value || " "}</td>
      <th>{label2}</th>
      <td>{value2 || " "}</td>
    </tr>
  );
}

function Box({ label, value }: { label: string; value?: string }) {
  return (
    <div className="wo-print-box">
      <div className="wo-print-box-label">{label}</div>
      <div className="wo-print-box-body">{value || " "}</div>
    </div>
  );
}

function SignoffField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="wo-print-signoff-field">
      <div className="wo-print-sig-line">{value}</div>
      <span>{label}</span>
    </div>
  );
}

function buildPartsRows(wo: WorkOrder): string[] {
  const listed = wo.resources?.spareParts.filter(Boolean) ?? [];
  const rows = [...listed];
  while (rows.length < 5) rows.push("");
  return rows;
}

function fmtDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString();
}

function fmtDateTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString(undefined, { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/**
 * Print a single work order by mounting a temporary printable region into the body.
 * Adds the "printing-single-wo" body class so the print stylesheet hides every
 * other .print-only block on the page (e.g. a filtered work-order list table),
 * ensuring only this one work order — and nothing else — comes out on one page.
 */
export function printSingleWorkOrder(wo: WorkOrder) {
  const container = document.createElement("div");
  container.className = "print-only print-only-single print-block wo-print";
  const machine = getMachine(wo.machineId);
  const partsRows = buildPartsRows(wo);

  const gridRow = (label: string, value: string | undefined, label2: string, value2: string | undefined) =>
    `<tr><th>${esc(label)}</th><td>${esc(value || " ")}</td><th>${esc(label2)}</th><td>${esc(value2 || " ")}</td></tr>`;

  const box = (label: string, value: string | undefined) =>
    `<div class="wo-print-box"><div class="wo-print-box-label">${esc(label)}</div><div class="wo-print-box-body">${esc(value || " ")}</div></div>`;

  const partsRowsHtml = partsRows
    .map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r)}</td><td></td><td></td><td></td></tr>`)
    .join("");

  const signoff = (label: string, value: string | undefined) =>
    `<div class="wo-print-signoff-field"><div class="wo-print-sig-line">${esc(value || "")}</div><span>${label}</span></div>`;

  container.innerHTML = `
    <div class="wo-print-header">
      <div class="wo-print-brand">
        <img src="${logoRed}" alt="KMC" class="wo-print-logo" />
        <div>
          <h1>Kiira Motors Corporation</h1>
          <h2>Maintenance Work Order Form</h2>
        </div>
      </div>
      <div class="wo-print-cwo">
        <span>CWO</span>
        <strong>${esc(wo.referenceNumber ?? wo.id)}</strong>
      </div>
    </div>
    <table class="wo-print-grid">
      <tbody>
        ${gridRow("Order ID", wo.id, "Date Returned", "")}
        ${gridRow("Requestor Name", wo.requestorName, "Workshop", wo.workshop)}
        ${gridRow("Email", wo.requestorEmail, "Department", wo.department)}
        ${gridRow("Designation", wo.requestorDesignation, "Order Date", fmtDate(wo.createdAt))}
        ${gridRow("Machine/Equipment Name", machine?.name, "Type of Issue", woTypeLabel(wo.type))}
        ${gridRow("Machine/Equipment ID", wo.machineId, "Priority Level", wo.priority.toUpperCase())}
        ${gridRow("Date Needed", fmtDate(wo.dueAt), "Work Assigned to", wo.assignee)}
      </tbody>
    </table>
    ${box("Request Description", wo.problemDescription)}
    ${box("Description of Work Completed", wo.workLog?.descriptionOfWorkCompleted)}
    ${box("Explanation of Incomplete Work", wo.workLog?.explanationOfIncompleteWork)}
    ${box("Remarks (After Completion of Work)", wo.workLog?.comments)}
    ${box("Equipment / Tools Used", wo.resources?.tools.join(", "))}
    <h3 class="wo-print-table-title">Table 1: Spare Parts Used and Labour</h3>
    <table class="wo-print-parts">
      <thead>
        <tr>
          <th style="width:28px">SN</th>
          <th>Description</th>
          <th style="width:50px">Qty</th>
          <th style="width:90px">Price per Unit</th>
          <th style="width:90px">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${partsRowsHtml}
        <tr><td colspan="4" style="text-align:right;font-weight:700">Total</td><td></td></tr>
      </tbody>
    </table>
    <div class="wo-print-signoff">
      ${signoff("Work Completed by", wo.workLog?.completedByName)}
      ${signoff("Date &amp; Time Completed", wo.workLog?.actualCompletionTime ? fmtDateTime(wo.workLog.actualCompletionTime) : undefined)}
      ${signoff("Work Approved by", wo.workLog?.approvedByName)}
      ${signoff("Date", wo.workLog?.approvedAt ? fmtDate(wo.workLog.approvedAt) : undefined)}
    </div>
  `;

  document.body.appendChild(container);
  document.body.classList.add("printing-single-wo");
  const cleanup = () => {
    container.remove();
    document.body.classList.remove("printing-single-wo");
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
}

function esc(s: string) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
