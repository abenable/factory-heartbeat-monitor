import { WorkOrder, getMachine, woTypeLabel, woStatusLabel } from "@/data/cmms";
import { getWorker } from "@/data/workers";

/**
 * Hidden printable card for a single Work Order.
 * Renders nothing on screen; appears only when window.print() is invoked.
 * Use printWorkOrder(id) helper to print a single WO inline.
 */
export function PrintableWorkOrder({ wo }: { wo: WorkOrder }) {
  const machine = getMachine(wo.machineId);
  const schedule = wo.schedule;
  const resources = wo.resources;
  const tasks = wo.tasks ?? [];

  return (
    <div className="print-only print-block" data-print-wo={wo.id}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>
        Kiira Motors Corporation — Work Order
      </h1>
      <p style={{ marginBottom: 16, color: "#444" }}>
        Printed {new Date().toLocaleString()}
      </p>

      <h2 style={{ fontSize: 14, borderBottom: "1px solid #000", paddingBottom: 4, marginBottom: 8 }}>
        Work Order {wo.id}
      </h2>
      <table>
        <tbody>
          <Row label="Reference Number" value={wo.referenceNumber ?? "—"} />
          <Row label="Date Created" value={new Date(wo.createdAt).toLocaleString()} />
          <Row label="Priority" value={wo.priority.toUpperCase()} />
          <Row label="Type" value={woTypeLabel(wo.type)} />
        </tbody>
      </table>

      <h3 style={{ fontSize: 12, marginTop: 16, marginBottom: 6, textTransform: "uppercase" }}>
        Asset Details
      </h3>
      <table>
        <tbody>
          <Row label="Machine Name" value={machine?.name ?? "—"} />
          <Row label="Asset ID" value={wo.machineId} />
          <Row label="Location" value={machine?.sector ?? "—"} />
        </tbody>
      </table>

      {wo.problemDescription && (
        <>
          <h3 style={{ fontSize: 12, marginTop: 16, marginBottom: 6, textTransform: "uppercase" }}>
            Problem Description
          </h3>
          <p style={{ marginBottom: 12, whiteSpace: "pre-wrap" }}>{wo.problemDescription}</p>
        </>
      )}

      {tasks.length > 0 && (
        <>
          <h3 style={{ fontSize: 12, marginTop: 16, marginBottom: 6, textTransform: "uppercase" }}>
            Task Description
          </h3>
          <ol style={{ paddingLeft: 20, marginBottom: 12 }}>
            {tasks.map((t, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                {t.description}
              </li>
            ))}
          </ol>
        </>
      )}

      <h3 style={{ fontSize: 12, marginTop: 16, marginBottom: 6, textTransform: "uppercase" }}>
        Assigned To
      </h3>
      <table>
        <tbody>
          <Row label="Technician" value={wo.assignee || "—"} />
          <Row label="Department" value={wo.department || "—"} />
        </tbody>
      </table>

      {schedule && (
        <>
          <h3 style={{ fontSize: 12, marginTop: 16, marginBottom: 6, textTransform: "uppercase" }}>
            Schedule
          </h3>
          <table>
            <tbody>
              <Row label="Start Date" value={new Date(schedule.startDate).toLocaleString()} />
              <Row label="Expected Completion" value={new Date(schedule.expectedCompletion).toLocaleString()} />
            </tbody>
          </table>
        </>
      )}

      {resources && (
        <>
          <h3 style={{ fontSize: 12, marginTop: 16, marginBottom: 6, textTransform: "uppercase" }}>
            Required Resources
          </h3>
          <table>
            <tbody>
              <Row label="Tools" value={resources.tools.join(", ") || "—"} />
              <Row label="Spare Parts" value={resources.spareParts.join(", ") || "—"} />
              <Row label="PPE" value={resources.ppe.join(", ") || "—"} />
            </tbody>
          </table>
        </>
      )}

      <h3 style={{ fontSize: 12, marginTop: 16, marginBottom: 6, textTransform: "uppercase" }}>
        Approval
      </h3>
      <p style={{ marginBottom: 12 }}>Authorized By: {wo.authorizedBy || "—"}</p>

      <h3 style={{ fontSize: 12, marginTop: 16, marginBottom: 6, textTransform: "uppercase" }}>
        Work Log (to be filled after job)
      </h3>
      <table>
        <tbody>
          <Row label="Actual Start Time" value={wo.workLog?.actualStartTime ? new Date(wo.workLog.actualStartTime).toLocaleString() : "_____________"} />
          <Row label="Actual Completion Time" value={wo.workLog?.actualCompletionTime ? new Date(wo.workLog.actualCompletionTime).toLocaleString() : "_____________"} />
          <Row label="Parts Used" value={wo.workLog?.partsUsed || "_____________"} />
          <Row label="Observations" value={wo.workLog?.observations || "_____________"} />
          <Row label="Root Cause" value={wo.workLog?.rootCause || "_____________"} />
        </tbody>
      </table>

      <div style={{ marginTop: 16 }}>
        <strong>Status:</strong> {woStatusLabel(wo.status)}
      </div>

      <div style={{ marginTop: 24, display: "flex", gap: 32 }}>
        <SignatureLine label="Technician signature" />
        <SignatureLine label="Supervisor signature" />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <th style={{ width: 200, textAlign: "left", verticalAlign: "top" }}>{label}</th>
      <td style={{ whiteSpace: "pre-wrap" }}>{value}</td>
    </tr>
  );
}

function SignatureLine({ label }: { label: string }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ borderBottom: "1px solid #000", height: 40 }} />
      <small>{label}</small>
    </div>
  );
}

/**
 * Print a single work order by mounting a temporary printable region into the body.
 */
export function printSingleWorkOrder(wo: WorkOrder) {
  const container = document.createElement("div");
  container.className = "print-only";
  const machine = getMachine(wo.machineId);
  const schedule = wo.schedule;
  const resources = wo.resources;
  const tasks = wo.tasks ?? [];

  const rows = [
    pRow("Reference Number", wo.referenceNumber ?? "—"),
    pRow("Date Created", new Date(wo.createdAt).toLocaleString()),
    pRow("Priority", wo.priority.toUpperCase()),
    pRow("Type", woTypeLabel(wo.type)),
  ].join("");

  const assetRows = [
    pRow("Machine Name", machine?.name ?? "—"),
    pRow("Asset ID", wo.machineId),
    pRow("Location", machine?.sector ?? "—"),
  ].join("");

  const problem = wo.problemDescription
    ? `<p style="margin-bottom:12px;white-space:pre-wrap">${esc(wo.problemDescription)}</p>`
    : "";

  const taskList =
    tasks.length > 0
      ? `<ol style="padding-left:20px;margin-bottom:12px">${tasks
          .map((t, i) => `<li style="margin-bottom:4px">${esc(t.description)}</li>`)
          .join("")}</ol>`
      : "";

  const scheduleRows = schedule
    ? pRow("Start Date", new Date(schedule.startDate).toLocaleString()) +
      pRow("Expected Completion", new Date(schedule.expectedCompletion).toLocaleString())
    : "";

  const resourceRows = resources
    ? pRow("Tools", resources.tools.join(", ") || "—") +
      pRow("Spare Parts", resources.spareParts.join(", ") || "—") +
      pRow("PPE", resources.ppe.join(", ") || "—")
    : "";

  const logRows = [
    pRow("Actual Start Time", wo.workLog?.actualStartTime ? new Date(wo.workLog.actualStartTime).toLocaleString() : "_____________"),
    pRow("Actual Completion Time", wo.workLog?.actualCompletionTime ? new Date(wo.workLog.actualCompletionTime).toLocaleString() : "_____________"),
    pRow("Parts Used", wo.workLog?.partsUsed || "_____________"),
    pRow("Observations", wo.workLog?.observations || "_____________"),
    pRow("Root Cause", wo.workLog?.rootCause || "_____________"),
  ].join("");

  container.innerHTML = `
    <div class="print-block">
      <h1 style="font-size:22px;margin-bottom:4px">Kiira Motors Corporation — Work Order</h1>
      <p style="margin-bottom:16px;color:#444">Printed ${new Date().toLocaleString()}</p>
      <h2 style="font-size:14px;border-bottom:1px solid #000;padding-bottom:4px;margin-bottom:8px">Work Order ${esc(wo.id)}</h2>
      <table><tbody>${rows}</tbody></table>
      <h3 style="font-size:12px;margin-top:16px;margin-bottom:6px;text-transform:uppercase">Asset Details</h3>
      <table><tbody>${assetRows}</tbody></table>
      ${wo.problemDescription ? `<h3 style="font-size:12px;margin-top:16px;margin-bottom:6px;text-transform:uppercase">Problem Description</h3>${problem}` : ""}
      ${tasks.length > 0 ? `<h3 style="font-size:12px;margin-top:16px;margin-bottom:6px;text-transform:uppercase">Task Description</h3>${taskList}` : ""}
      <h3 style="font-size:12px;margin-top:16px;margin-bottom:6px;text-transform:uppercase">Assigned To</h3>
      <table><tbody>${pRow("Technician", wo.assignee || "—")}${pRow("Department", wo.department || "—")}</tbody></table>
      ${schedule ? `<h3 style="font-size:12px;margin-top:16px;margin-bottom:6px;text-transform:uppercase">Schedule</h3><table><tbody>${scheduleRows}</tbody></table>` : ""}
      ${resources ? `<h3 style="font-size:12px;margin-top:16px;margin-bottom:6px;text-transform:uppercase">Required Resources</h3><table><tbody>${resourceRows}</tbody></table>` : ""}
      <h3 style="font-size:12px;margin-top:16px;margin-bottom:6px;text-transform:uppercase">Approval</h3>
      <p style="margin-bottom:12px">Authorized By: ${esc(wo.authorizedBy || "—")}</p>
      <h3 style="font-size:12px;margin-top:16px;margin-bottom:6px;text-transform:uppercase">Work Log (to be filled after job)</h3>
      <table><tbody>${logRows}</tbody></table>
      <div style="margin-top:16px"><strong>Status:</strong> ${esc(woStatusLabel(wo.status))}</div>
      <div style="margin-top:24px;display:flex;gap:32px">
        <div style="flex:1"><div style="border-bottom:1px solid #000;height:40px"></div><small>Technician signature</small></div>
        <div style="flex:1"><div style="border-bottom:1px solid #000;height:40px"></div><small>Supervisor signature</small></div>
      </div>
    </div>
  `;

  document.body.appendChild(container);
  const cleanup = () => {
    container.remove();
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
}

function pRow(label: string, value: string) {
  return `<tr><th style="width:200px;text-align:left;vertical-align:top">${esc(label)}</th><td style="white-space:pre-wrap">${esc(value)}</td></tr>`;
}
function esc(s: string) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
