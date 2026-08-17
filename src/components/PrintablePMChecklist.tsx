import { PMTask, getMachine } from "@/data/cmms";
import { getWorker } from "@/data/workers";
import logoRed from "@/assets/kmc-logo-red.svg";

const freqLabel = (f?: string) => (f ? f.charAt(0).toUpperCase() + f.slice(1) : "—");

/**
 * Printable Preventive Maintenance Checklist — mirrors the physical KMC
 * Equipment Maintenance Checklist paper form (header info grid, sectioned
 * checklist, sign-off). Renders nothing on screen; appears only when
 * window.print() is invoked. Designed to fit one A4 page.
 */
export function PrintablePMChecklist({ task }: { task: PMTask }) {
  const machine = getMachine(task.machineId);
  const person = task.personInCharge ? getWorker(task.personInCharge) : null;

  return (
    <div className="print-only print-block wo-print" data-print-pm={task.id}>
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
  const sections = Array.from(new Set(task.checklist.map((i) => i.section)));

  return (
    <>
      <div className="wo-print-header">
        <div className="wo-print-brand">
          <img src={logoRed} alt="KMC" className="wo-print-logo" />
          <div>
            <h1>Kiira Motors Corporation</h1>
            <h2>Preventive Maintenance Checklist</h2>
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
          <GridRow label="Workshop" value={task.workshop} label2="Department" value2={task.department} />
          <GridRow label="Person in Charge" value={personName ?? task.personInCharge} label2="Last Done" value2={task.lastDone} />
          <GridRow label="Next Due" value={task.nextDue} label2="Est. Duration" value2={`${task.estimatedHours ?? "—"}`} />
        </tbody>
      </table>

      {task.procedures && <Box label="Procedures / Checklist Notes" value={task.procedures} />}
      {task.requiredTools && <Box label="Required Tools" value={task.requiredTools} />}
      {task.safetyInstructions && <Box label="Safety Instructions" value={task.safetyInstructions} />}

      {sections.map((section) => (
        <div key={section} className="wo-print-checklist-section">
          <div className="wo-print-checklist-title">{section}</div>
          <table className="wo-print-checklist">
            <thead>
              <tr>
                <th>Item</th>
                <th className="wo-print-check-col">OK</th>
                <th className="wo-print-check-col">Faulty</th>
                <th className="wo-print-check-col">N/A</th>
              </tr>
            </thead>
            <tbody>
              {task.checklist
                .filter((i) => i.section === section)
                .map((item) => (
                  <tr key={item.id}>
                    <td>{item.description}</td>
                    <td className="wo-print-check-col">{item.result === "ok" ? "✓" : ""}</td>
                    <td className="wo-print-check-col">{item.result === "faulty" ? "✓" : ""}</td>
                    <td className="wo-print-check-col">{item.result === "na" ? "✓" : ""}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ))}

      <div className="wo-print-signoff">
        <SignatureField label="Technician Signature" name={personName ?? task.personInCharge} />
        <SignoffField label="Date & Time" value="" />
        <SignatureField label="Supervisor Signature" name={task.scheduledBy} />
        <SignoffField label="Date" value="" />
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
  container.className = "print-only print-only-single print-block wo-print";
  const machine = getMachine(task.machineId);
  const person = task.personInCharge ? getWorker(task.personInCharge) : null;
  const personName = person?.name ?? task.personInCharge;
  const sections = Array.from(new Set(task.checklist.map((i) => i.section)));

  const gridRow = (label: string, value: string | undefined, label2: string, value2: string | undefined) =>
    `<tr><th>${esc(label)}</th><td>${esc(value || " ")}</td><th>${esc(label2)}</th><td>${esc(value2 || " ")}</td></tr>`;

  const box = (label: string, value: string | undefined) =>
    value
      ? `<div class="wo-print-box"><div class="wo-print-box-label">${esc(label)}</div><div class="wo-print-box-body">${esc(value)}</div></div>`
      : "";

  const signoff = (label: string, value: string) =>
    `<div class="wo-print-signoff-field"><div class="wo-print-sig-line">${esc(value)}</div><span>${label}</span></div>`;

  const signature = (label: string, name: string | undefined) =>
    `<div class="wo-print-signoff-field"><div class="wo-print-sig-line"></div><span>${label}</span>${
      name ? `<span class="wo-print-sig-name">Print name: ${esc(name)}</span>` : ""
    }</div>`;

  const sectionsHtml = sections
    .map((section) => {
      const rows = task.checklist
        .filter((i) => i.section === section)
        .map(
          (item) =>
            `<tr><td>${esc(item.description)}</td><td class="wo-print-check-col">${item.result === "ok" ? "✓" : ""}</td><td class="wo-print-check-col">${item.result === "faulty" ? "✓" : ""}</td><td class="wo-print-check-col">${item.result === "na" ? "✓" : ""}</td></tr>`,
        )
        .join("");
      return `
        <div class="wo-print-checklist-section">
          <div class="wo-print-checklist-title">${esc(section)}</div>
          <table class="wo-print-checklist">
            <thead><tr><th>Item</th><th class="wo-print-check-col">OK</th><th class="wo-print-check-col">Faulty</th><th class="wo-print-check-col">N/A</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    })
    .join("");

  container.innerHTML = `
    <div class="wo-print-header">
      <div class="wo-print-brand">
        <img src="${logoRed}" alt="KMC" class="wo-print-logo" />
        <div>
          <h1>Kiira Motors Corporation</h1>
          <h2>Preventive Maintenance Checklist</h2>
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
        ${gridRow("Workshop", task.workshop, "Department", task.department)}
        ${gridRow("Person in Charge", personName, "Last Done", task.lastDone)}
        ${gridRow("Next Due", task.nextDue, "Est. Duration", task.estimatedHours ? `${task.estimatedHours}h` : undefined)}
      </tbody>
    </table>
    ${box("Procedures / Checklist Notes", task.procedures)}
    ${box("Required Tools", task.requiredTools)}
    ${box("Safety Instructions", task.safetyInstructions)}
    ${sectionsHtml}
    <div class="wo-print-signoff">
      ${signature("Technician Signature", personName)}
      ${signoff("Date &amp; Time", "")}
      ${signature("Supervisor Signature", task.scheduledBy)}
      ${signoff("Date", "")}
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
