import { WorkOrder, getMachine } from "@/data/cmms";

/**
 * Hidden printable card for a single Work Order.
 * Renders nothing on screen; appears only when window.print() is invoked.
 * Use printWorkOrder(id) helper to print a single WO inline.
 */
export function PrintableWorkOrder({ wo }: { wo: WorkOrder }) {
  const machine = getMachine(wo.machineId);
  return (
    <div className="print-only print-block" data-print-wo={wo.id}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Work Order {wo.id}</h1>
      <p style={{ marginBottom: 16, color: "#444" }}>
        Printed {new Date().toLocaleString()}
      </p>
      <table>
        <tbody>
          <Row label="Title" value={wo.title} />
          <Row label="Machine" value={`${wo.machineId}${machine ? ` — ${machine.name}` : ""}`} />
          <Row label="Sector" value={machine?.sector ?? "—"} />
          <Row label="Priority" value={wo.priority.toUpperCase()} />
          <Row label="Status" value={wo.status.replace("_", " ").toUpperCase()} />
          <Row label="Assignee" value={wo.assignee} />
          <Row label="Created" value={new Date(wo.createdAt).toLocaleString()} />
          <Row label="Due" value={new Date(wo.dueAt).toLocaleString()} />
        </tbody>
      </table>
      <div style={{ marginTop: 24 }}>
        <strong>Notes / Findings</strong>
        <div style={{ minHeight: 120, border: "1px solid #999", marginTop: 6 }} />
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
      <th style={{ width: 140, textAlign: "left" }}>{label}</th>
      <td>{value}</td>
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
  container.innerHTML = `
    <div class="print-block">
      <h1 style="font-size:22px;margin-bottom:4px">Work Order ${escape(wo.id)}</h1>
      <p style="margin-bottom:16px;color:#444">Printed ${new Date().toLocaleString()}</p>
      <table>
        <tbody>
          ${row("Title", wo.title)}
          ${row("Machine", `${wo.machineId}${machine ? ` — ${machine.name}` : ""}`)}
          ${row("Sector", machine?.sector ?? "—")}
          ${row("Priority", wo.priority.toUpperCase())}
          ${row("Status", wo.status.replace("_", " ").toUpperCase())}
          ${row("Assignee", wo.assignee)}
          ${row("Created", new Date(wo.createdAt).toLocaleString())}
          ${row("Due", new Date(wo.dueAt).toLocaleString())}
        </tbody>
      </table>
      <div style="margin-top:24px"><strong>Notes / Findings</strong>
        <div style="min-height:120px;border:1px solid #999;margin-top:6px"></div>
      </div>
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

function row(label: string, value: string) {
  return `<tr><th style="width:140px;text-align:left">${escape(label)}</th><td>${escape(value)}</td></tr>`;
}
function escape(s: string) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
