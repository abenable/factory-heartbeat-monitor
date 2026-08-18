import { PMTask, PMChecklistItem, getMachine, estimatedPMHours } from "@/data/cmms";
import { getWorker } from "@/data/workers";
import logoRed from "@/assets/kmc-logo-red.svg";

const freqLabel = (f?: string) => (f ? f.charAt(0).toUpperCase() + f.slice(1) : "—");

interface PrintData {
  items: PMChecklistItem[];
  isFinished: boolean;
  technicianName?: string;
  completedAt?: string;
  startTime?: string;
  endTime?: string;
  remarks?: string;
  approvedByName?: string;
  approvedAt?: string;
}

/**
 * Decides what to print: the technician's finished, submitted checklist
 * (once completePMVisit() has logged it) with their signature and any
 * supervisor approval — or the current blank/in-progress template if the
 * visit hasn't been completed yet. Supervisors only ever preview/approve
 * what a technician already filled in; they never fill it themselves.
 */
function resolvePrintData(task: PMTask): PrintData {
  const latest = task.history[0];
  if (task.visitStatus === "done" && latest) {
    return {
      items: latest.items,
      isFinished: true,
      technicianName: getWorker(latest.completedBy)?.name ?? latest.completedBy,
      completedAt: latest.completedAt,
      startTime: latest.startTime,
      endTime: latest.endTime,
      remarks: latest.remarks,
      approvedByName: latest.approvedByName,
      approvedAt: latest.approvedAt,
    };
  }
  return { items: task.checklist, isFinished: false };
}

interface HeaderFields {
  workshop: string;
  department: string;
  estDuration: string;
  procedures: string;
  requiredTools: string;
  safetyInstructions: string;
}

/**
 * Fills in fallbacks so the printed page never shows blank header cells or
 * missing boxes just because a task's seed/created record left an optional
 * field unset — the physical form should always look complete for both the
 * technician (blank/in-progress copy) and the supervisor (preview/approval
 * copy), since both print through this same resolver.
 */
function resolveHeaderFields(task: PMTask): HeaderFields {
  const machine = getMachine(task.machineId);
  const est = estimatedPMHours(task);
  return {
    workshop: task.workshop || machine?.sector || "—",
    department: task.department || "Maintenance Department",
    estDuration: `${est.hours.toFixed(1)}h`,
    procedures: task.procedures || "—",
    requiredTools: task.requiredTools || "—",
    safetyInstructions: task.safetyInstructions || "—",
  };
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

function fmtTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

/**
 * Printable Preventive Maintenance Checklist — mirrors the physical KMC
 * Equipment Maintenance Checklist paper form (header info grid, sectioned
 * checklist, sign-off). Renders nothing on screen; appears only when
 * window.print() is invoked. Prints landscape and is designed to fit one page.
 */
export function PrintablePMChecklist({ task }: { task: PMTask }) {
  const machine = getMachine(task.machineId);
  const person = task.personInCharge ? getWorker(task.personInCharge) : null;

  return (
    <div className="print-only print-block wo-print wo-print-pm-landscape" data-print-pm={task.id}>
      <PMChecklistMarkup task={task} machineName={machine?.name} personName={person?.name} />
    </div>
  );
}

function PMChecklistMarkup({
  task,
  machineName,
  personName,
}: {
  task: PMTask;
  machineName?: string;
  personName?: string;
}) {
  const data = resolvePrintData(task);
  const fields = resolveHeaderFields(task);
  const sections = Array.from(new Set(data.items.map((i) => i.section)));

  return (
    <>
      <div className="wo-print-header">
        <div className="wo-print-brand">
          <img src={logoRed} alt="KMC" className="wo-print-logo" />
          <div>
            <h1>Kiira Motors Corporation</h1>
            <h2>
              Equipment Maintenance Checklist {data.isFinished ? "— Completed" : "— Blank / In Progress"}
            </h2>
          </div>
        </div>
        <div className="wo-print-cwo">
          <span>REF</span>
          <strong>{task.referenceNumber ?? task.id}</strong>
        </div>
      </div>

      <div className="wo-print-pm-infobar">
        <div className="wo-print-pm-org">
          <div>Department of Production</div>
          <div>Division of Production Management</div>
          <div>Maintenance Unit ({fields.department})</div>
        </div>
        <Box
          label="Safety Requirement"
          value="Mandatory Safety, PPE & LOTO Verification: Ensure PPE are worn (gloves, shoes, etc). LOTO applied where maintenance is due. Warning tags and signage displayed. Panel isolated and tested dead (where applicable)."
        />
        <div className="wo-print-pm-details">
          <div className="wo-print-box-label">Details</div>
          <table>
            <tbody>
              <tr><th>Workshop</th><td>{fields.workshop}</td></tr>
              <tr><th>Equipment Name</th><td>{machineName ?? task.machineId}</td></tr>
              <tr><th>Equipment ID</th><td>{task.machineId}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <table className="wo-print-grid">
        <tbody>
          <GridRow label="Task / Checklist" value={task.task} label2="Frequency" value2={freqLabel(task.frequency)} />
          <GridRow label="Person in Charge" value={personName ?? task.personInCharge} label2="Last Done" value2={task.lastDone} />
          <GridRow label="Next Due" value={task.nextDue} label2="Est. Duration" value2={fields.estDuration} />
          <GridRow
            label="Visit Date"
            value={data.isFinished ? fmtDate(data.completedAt) : ""}
            label2="Start Time / End Time"
            value2={
              data.isFinished && (data.startTime || data.endTime)
                ? `${fmtTime(data.startTime)} – ${fmtTime(data.endTime)}`
                : ""
            }
          />
        </tbody>
      </table>

      <div className="wo-print-boxes-row">
        <Box label="Procedures / Checklist Notes" value={fields.procedures} />
        <Box label="Required Tools" value={fields.requiredTools} />
      </div>

      {data.isFinished && data.remarks && <Box label="Technician Remarks" value={data.remarks} />}

      <div className="wo-print-checklist-legend">
        Tick one box per item: <strong>✓</strong> passed inspection · <strong>✗</strong> requires attention · <strong>–</strong> not applicable
      </div>
      <table className="wo-print-checklist-table">
        <thead>
          <tr>
            <th className="sn-col">SN</th>
            <th className="section-col">Check Item</th>
            <th>Test Performed</th>
            <th className="tick-col">✓</th>
            <th className="tick-col">✗</th>
            <th className="tick-col">–</th>
          </tr>
        </thead>
        <tbody>
          {sections.map((section, si) => {
            const items = data.items.filter((i) => i.section === section);
            return items.map((item, ii) => (
              <tr key={item.id}>
                {ii === 0 && (
                  <td className="sn-col" rowSpan={items.length}>
                    {si + 1}
                  </td>
                )}
                {ii === 0 && (
                  <td className="section-col" rowSpan={items.length}>
                    {section}
                  </td>
                )}
                <td>{item.description}</td>
                <td className="tick-col">
                  <span className={`wo-print-checkbox-box ${item.result === "ok" ? "checked" : ""}`} />
                </td>
                <td className="tick-col">
                  <span className={`wo-print-checkbox-box ${item.result === "faulty" ? "checked" : ""}`} />
                </td>
                <td className="tick-col">
                  <span className={`wo-print-checkbox-box ${item.result === "na" ? "checked" : ""}`} />
                </td>
              </tr>
            ));
          })}
        </tbody>
      </table>

      <div className="wo-print-signoff">
        <SignatureField
          label="Technician Signature"
          name={data.isFinished ? data.technicianName : undefined}
        />
        <SignoffField label="Date & Time Completed" value={data.isFinished ? fmtDateTime(data.completedAt) : ""} />
        <SignatureField
          label="Supervisor Signature"
          name={data.approvedByName}
        />
        <SignoffField label="Date Approved" value={data.approvedByName ? fmtDate(data.approvedAt) : ""} />
      </div>
    </>
  );
}

function GridRow({
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
      <td>{value || " "}</td>
      <th>{label2}</th>
      <td>{value2 || " "}</td>
    </tr>
  );
}

function Box({ label, value }: { label: string; value?: string }) {
  return (
    <div className="wo-print-box">
      <div className="wo-print-box-label">{label}</div>
      <div className="wo-print-box-body">{value || " "}</div>
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

function SignatureField({ label, name }: { label: string; name?: string }) {
  return (
    <div className="wo-print-signoff-field">
      <div className="wo-print-sig-line" />
      <span>{label}</span>
      {name && <span className="wo-print-sig-name">Print name: {name}</span>}
    </div>
  );
}

function esc(s: string) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

/**
 * Print a single PM checklist by mounting a temporary printable region into
 * the body. Same single-item print isolation as printSingleWorkOrder: only
 * this checklist reaches the printer, nothing else from the triggering page.
 */
export function printPMChecklist(task: PMTask) {
  const container = document.createElement("div");
  container.className = "print-only print-only-single print-block wo-print wo-print-pm-landscape";
  const machine = getMachine(task.machineId);
  const person = task.personInCharge ? getWorker(task.personInCharge) : null;
  const personName = person?.name ?? task.personInCharge;
  const data = resolvePrintData(task);
  const fields = resolveHeaderFields(task);
  const sections = Array.from(new Set(data.items.map((i) => i.section)));

  const gridRow = (label: string, value: string | undefined, label2: string, value2: string | undefined) =>
    `<tr><th>${esc(label)}</th><td>${esc(value || " ")}</td><th>${esc(label2)}</th><td>${esc(value2 || " ")}</td></tr>`;

  const box = (label: string, value: string) =>
    `<div class="wo-print-box"><div class="wo-print-box-label">${esc(label)}</div><div class="wo-print-box-body">${esc(value)}</div></div>`;

  const signoff = (label: string, value: string) =>
    `<div class="wo-print-signoff-field"><div class="wo-print-sig-line">${esc(value)}</div><span>${label}</span></div>`;

  const signature = (label: string, name: string | undefined) =>
    `<div class="wo-print-signoff-field"><div class="wo-print-sig-line"></div><span>${label}</span>${
      name ? `<span class="wo-print-sig-name">Print name: ${esc(name)}</span>` : ""
    }</div>`;

  const tickCell = (active: boolean) =>
    `<td class="tick-col"><span class="wo-print-checkbox-box${active ? " checked" : ""}"></span></td>`;

  const checklistRowsHtml = sections
    .map((section, si) => {
      const items = data.items.filter((i) => i.section === section);
      return items
        .map(
          (item, ii) => `
        <tr>
          ${ii === 0 ? `<td class="sn-col" rowspan="${items.length}">${si + 1}</td>` : ""}
          ${ii === 0 ? `<td class="section-col" rowspan="${items.length}">${esc(section)}</td>` : ""}
          <td>${esc(item.description)}</td>
          ${tickCell(item.result === "ok")}
          ${tickCell(item.result === "faulty")}
          ${tickCell(item.result === "na")}
        </tr>`,
        )
        .join("");
    })
    .join("");

  container.innerHTML = `
    <div class="wo-print-header">
      <div class="wo-print-brand">
        <img src="${logoRed}" alt="KMC" class="wo-print-logo" />
        <div>
          <h1>Kiira Motors Corporation</h1>
          <h2>Equipment Maintenance Checklist ${data.isFinished ? "&mdash; Completed" : "&mdash; Blank / In Progress"}</h2>
        </div>
      </div>
      <div class="wo-print-cwo">
        <span>REF</span>
        <strong>${esc(task.referenceNumber ?? task.id)}</strong>
      </div>
    </div>
    <div class="wo-print-pm-infobar">
      <div class="wo-print-pm-org">
        <div>Department of Production</div>
        <div>Division of Production Management</div>
        <div>Maintenance Unit (${esc(fields.department)})</div>
      </div>
      ${box(
        "Safety Requirement",
        "Mandatory Safety, PPE & LOTO Verification: Ensure PPE are worn (gloves, shoes, etc). LOTO applied where maintenance is due. Warning tags and signage displayed. Panel isolated and tested dead (where applicable).",
      )}
      <div class="wo-print-pm-details">
        <div class="wo-print-box-label">Details</div>
        <table>
          <tbody>
            <tr><th>Workshop</th><td>${esc(fields.workshop)}</td></tr>
            <tr><th>Equipment Name</th><td>${esc(machine?.name ?? task.machineId)}</td></tr>
            <tr><th>Equipment ID</th><td>${esc(task.machineId)}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <table class="wo-print-grid">
      <tbody>
        ${gridRow("Task / Checklist", task.task, "Frequency", freqLabel(task.frequency))}
        ${gridRow("Person in Charge", personName, "Last Done", task.lastDone)}
        ${gridRow("Next Due", task.nextDue, "Est. Duration", fields.estDuration)}
        ${gridRow(
          "Visit Date",
          data.isFinished ? fmtDate(data.completedAt) : "",
          "Start Time / End Time",
          data.isFinished && (data.startTime || data.endTime) ? `${fmtTime(data.startTime)} – ${fmtTime(data.endTime)}` : "",
        )}
      </tbody>
    </table>
    <div class="wo-print-boxes-row">
      ${box("Procedures / Checklist Notes", fields.procedures)}
      ${box("Required Tools", fields.requiredTools)}
    </div>
    ${data.isFinished && data.remarks ? box("Technician Remarks", data.remarks) : ""}
    <div class="wo-print-checklist-legend">
      Tick one box per item: <strong>&#10003;</strong> passed inspection &middot; <strong>&#10007;</strong> requires attention &middot; <strong>&ndash;</strong> not applicable
    </div>
    <table class="wo-print-checklist-table">
      <thead>
        <tr>
          <th class="sn-col">SN</th>
          <th class="section-col">Check Item</th>
          <th>Test Performed</th>
          <th class="tick-col">&#10003;</th>
          <th class="tick-col">&#10007;</th>
          <th class="tick-col">&ndash;</th>
        </tr>
      </thead>
      <tbody>${checklistRowsHtml}</tbody>
    </table>
    <div class="wo-print-signoff">
      ${signature("Technician Signature", data.isFinished ? data.technicianName : undefined)}
      ${signoff("Date &amp; Time Completed", data.isFinished ? fmtDateTime(data.completedAt) : "")}
      ${signature("Supervisor Signature", data.approvedByName)}
      ${signoff("Date Approved", data.approvedByName ? fmtDate(data.approvedAt) : "")}
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
