import { PMTask, PMChecklistItem, getMachine, estimatedPMHours } from "@/data/cmms";
import { getWorker } from "@/data/workers";
import logoRed from "@/assets/kmc-logo-red.svg";

const freqLabel = (f?: string) => (f ? f.charAt(0).toUpperCase() + f.slice(1) : "—");

interface PrintData {
  items: PMChecklistItem[];
  isFinished: boolean;
  technicianName?: string;
  completedAt?: string;
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
              Preventive Maintenance Checklist {data.isFinished ? "— Completed" : "— Blank / In Progress"}
            </h2>
          </div>
        </div>
        <div className="wo-print-cwo">
          <span>PM</span>
          <strong>{task.referenceNumber ?? task.id}</strong>
        </div>
      </div>

      <table className="wo-print-grid">
        <tbody>
          <GridRow label="Task / Checklist" value={task.task} label2="Frequency" value2={freqLabel(task.frequency)} />
          <GridRow label="Machine/Equipment Name" value={machineName} label2="Machine/Equipment ID" value2={task.machineId} />
          <GridRow label="Workshop" value={fields.workshop} label2="Department" value2={fields.department} />
          <GridRow label="Person in Charge" value={personName ?? task.personInCharge} label2="Last Done" value2={task.lastDone} />
          <GridRow label="Next Due" value={task.nextDue} label2="Est. Duration" value2={fields.estDuration} />
        </tbody>
      </table>

      <div className="wo-print-boxes-row">
        <Box label="Procedures / Checklist Notes" value={fields.procedures} />
        <Box label="Required Tools" value={fields.requiredTools} />
        <Box label="Safety Instructions" value={fields.safetyInstructions} />
      </div>

      {data.isFinished && data.remarks && <Box label="Technician Remarks" value={data.remarks} />}

      <div className="wo-print-checklist-legend">Mark one per item: OK · F = Faulty · N/A = Not Applicable</div>
      <div className="wo-print-checklist-columns">
        {sections.map((section) => (
          <div key={section} className="wo-print-checklist-section">
            <div className="wo-print-checklist-title">{section}</div>
            {data.items
              .filter((i) => i.section === section)
              .map((item) => (
                <div key={item.id} className="wo-print-check-row">
                  <span className="wo-print-check-desc">{item.description}</span>
                  <span className="wo-print-check-marks">
                    <span className="wo-print-checkbox">
                      <span className={`wo-print-checkbox-box ${item.result === "ok" ? "checked" : ""}`} />
                      OK
                    </span>
                    <span className="wo-print-checkbox">
                      <span className={`wo-print-checkbox-box ${item.result === "faulty" ? "checked" : ""}`} />
                      F
                    </span>
                    <span className="wo-print-checkbox">
                      <span className={`wo-print-checkbox-box ${item.result === "na" ? "checked" : ""}`} />
                      N/A
                    </span>
                  </span>
                </div>
              ))}
          </div>
        ))}
      </div>

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

  const mark = (active: boolean, label: string) =>
    `<span class="wo-print-checkbox"><span class="wo-print-checkbox-box${active ? " checked" : ""}"></span>${label}</span>`;

  const sectionsHtml = sections
    .map((section) => {
      const rows = data.items
        .filter((i) => i.section === section)
        .map(
          (item) =>
            `<div class="wo-print-check-row"><span class="wo-print-check-desc">${esc(item.description)}</span><span class="wo-print-check-marks">${mark(item.result === "ok", "OK")}${mark(item.result === "faulty", "F")}${mark(item.result === "na", "N/A")}</span></div>`,
        )
        .join("");
      return `
        <div class="wo-print-checklist-section">
          <div class="wo-print-checklist-title">${esc(section)}</div>
          ${rows}
        </div>`;
    })
    .join("");

  container.innerHTML = `
    <div class="wo-print-header">
      <div class="wo-print-brand">
        <img src="${logoRed}" alt="KMC" class="wo-print-logo" />
        <div>
          <h1>Kiira Motors Corporation</h1>
          <h2>Preventive Maintenance Checklist ${data.isFinished ? "&mdash; Completed" : "&mdash; Blank / In Progress"}</h2>
        </div>
      </div>
      <div class="wo-print-cwo">
        <span>PM</span>
        <strong>${esc(task.referenceNumber ?? task.id)}</strong>
      </div>
    </div>
    <table class="wo-print-grid">
      <tbody>
        ${gridRow("Task / Checklist", task.task, "Frequency", freqLabel(task.frequency))}
        ${gridRow("Machine/Equipment Name", machine?.name, "Machine/Equipment ID", task.machineId)}
        ${gridRow("Workshop", fields.workshop, "Department", fields.department)}
        ${gridRow("Person in Charge", personName, "Last Done", task.lastDone)}
        ${gridRow("Next Due", task.nextDue, "Est. Duration", fields.estDuration)}
      </tbody>
    </table>
    <div class="wo-print-boxes-row">
      ${box("Procedures / Checklist Notes", fields.procedures)}
      ${box("Required Tools", fields.requiredTools)}
      ${box("Safety Instructions", fields.safetyInstructions)}
    </div>
    ${data.isFinished && data.remarks ? box("Technician Remarks", data.remarks) : ""}
    <div class="wo-print-checklist-legend">Mark one per item: OK &middot; F = Faulty &middot; N/A = Not Applicable</div>
    <div class="wo-print-checklist-columns">${sectionsHtml}</div>
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
