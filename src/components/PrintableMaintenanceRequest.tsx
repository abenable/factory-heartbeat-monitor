import type { MaintenanceRequest } from "@/data/maintenanceRequests";
import { URGENCY_ORDER, timeToFirstResponse } from "@/data/maintenanceRequests";
import logoRed from "@/assets/kmc-logo-red.svg";

interface PrintableMaintenanceRequestProps {
  request: MaintenanceRequest;
}

export function PrintableMaintenanceRequest({ request }: PrintableMaintenanceRequestProps) {
  return (
    <div className="print-only print-block printable-mrf">
      <div className="mrf-header">
        <div className="mrf-logo">
          <img src={logoRed} alt="KMC" className="mrf-logo-mark" />
          <div>
            <div className="mrf-logo-title">Kiira Motors Corporation</div>
            <div className="mrf-logo-sub">Mission Vehicles Made In Uganda</div>
          </div>
        </div>
        <div className="mrf-jobno">
          <div className="mrf-jobno-label">Job Number</div>
          <div className="mrf-jobno-value">{request.jobNumber}</div>
        </div>
      </div>

      <h1 className="mrf-title">Maintenance Request Form</h1>

      {/* Requester + equipment header grid */}
      <table className="mrf-table">
        <tbody>
          <tr>
            <Cell label="Name" value={request.requesterName} />
            <Cell label="Department" value={request.requesterDepartment} />
          </tr>
          <tr>
            <Cell label="Email" value={request.requesterEmail} />
            <Cell label="Designation" value={request.requesterDesignation} />
          </tr>
          <tr>
            <Cell label="Date of Request" value={formatDate(request.requestDateTime)} />
            <Cell label="Time of Request" value={formatTime(request.requestDateTime)} />
          </tr>
        </tbody>
      </table>

      <SectionTitle title="Equipment Details" />
      <table className="mrf-table">
        <tbody>
          <tr>
            <Cell label="Machine / Equipment Name" value={request.equipmentName} />
            <Cell label="Machine / Equipment ID" value={request.equipmentId} />
          </tr>
          <tr>
            <Cell label="Workshop" value={request.workshop} />
            <Cell label="Station" value={request.station} />
          </tr>
          <tr>
            <Cell label="Equipment Operator / Custodian" value={request.operatorCustodianName} />
            <Cell label="Designation" value={request.operatorCustodianDesignation} />
          </tr>
        </tbody>
      </table>

      {/* Issue description + on-the-spot signature */}
      <SectionTitle title="Issue Description" />
      <div className="mrf-box">
        <span className="mrf-label">Problem Description</span>
        <p className="mrf-pre">{request.problemDescription || "No description provided."}</p>
        <div className="mrf-inline-sig">
          <span className="mrf-label">Signature</span>
          <div className="wo-print-sig-line" />
        </div>
      </div>

      <SectionTitle title="Urgency Level (tick one only)" />
      <table className="mrf-table">
        <tbody>
          <tr>
            {URGENCY_ORDER.map((u) => (
              <td key={u.value} className="mrf-tick-cell">
                <span className={`mrf-tick ${request.urgency === u.value ? "mrf-ticked" : ""}`} />
                <strong>{u.label}</strong>
                <span className="mrf-hint"> ({u.hint})</span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <div className="wo-print-signoff mrf-req-signoff">
        <div className="wo-print-signoff-field">
          <div className="wo-print-sig-line" />
          <span>Signature</span>
          {request.requesterSignatureName && (
            <span className="wo-print-sig-name">Print name: {request.requesterSignatureName}</span>
          )}
        </div>
        <div className="wo-print-signoff-field">
          <div className="wo-print-sig-line">{formatDate(request.requesterSignedAt ?? request.submittedAt)}</div>
          <span>Date</span>
        </div>
      </div>

      <SectionTitle title="Approval" />
      <div className="mrf-approval-row">
        <div className="mrf-approval-cell">
          <span className="mrf-label">Supervisor's Name</span>
          <span className="mrf-value">{request.approval?.supervisorName ?? " "}</span>
        </div>
        <div className="mrf-approval-cell">
          <span className="mrf-label">Date</span>
          <span className="mrf-value">{request.approval ? formatDate(request.approval.approvedAt) : " "}</span>
        </div>
        <div className="mrf-approval-cell mrf-approval-sign">
          <span className="mrf-label">Sign</span>
          <div className="wo-print-sig-line" />
          {request.approval?.signatureName && (
            <span className="wo-print-sig-name">Print name: {request.approval.signatureName}</span>
          )}
        </div>
      </div>

      <SectionTitle title="Response Time Tracking" />
      <table className="mrf-table">
        <thead>
          <tr>
            <th>Request Received Time</th>
            <th>Work Order Issue Time</th>
            <th>Time to First Response</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{request.response.receivedAt ? formatDateTime(request.response.receivedAt) : "—"}</td>
            <td>
              {request.response.workOrderIssuedAt
                ? `${formatDateTime(request.response.workOrderIssuedAt)}${request.response.workOrderNumber ? ` (${request.response.workOrderNumber})` : ""}`
                : "—"}
            </td>
            <td>{timeToFirstResponse(request)}</td>
          </tr>
        </tbody>
      </table>

      <div className="mrf-footer">
        Printed from Kiira Motors CMMS on {formatDateTime(new Date().toISOString())}
      </div>

      <style>{`
        .printable-mrf {
          font-family: Arial, sans-serif;
          color: #000;
          background: #fff;
          padding: 8px;
          font-size: 11pt;
          line-height: 1.35;
        }
        .mrf-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .mrf-logo {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .mrf-logo-mark {
          width: 44px;
          height: 44px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .mrf-logo-title {
          font-weight: bold;
          font-size: 13pt;
        }
        .mrf-logo-sub {
          font-size: 9pt;
          color: #333;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .mrf-jobno {
          text-align: right;
        }
        .mrf-jobno-label {
          font-size: 9pt;
          text-transform: uppercase;
        }
        .mrf-jobno-value {
          font-family: 'Geist Mono', monospace;
          font-size: 14pt;
          font-weight: bold;
          border: 1px solid #000;
          padding: 4px 10px;
          margin-top: 2px;
        }
        .mrf-title {
          text-align: center;
          font-size: 16pt;
          font-weight: bold;
          text-transform: uppercase;
          margin: 14px 0;
          letter-spacing: 0.5px;
        }
        .mrf-section-title {
          font-weight: bold;
          font-size: 10pt;
          margin: 12px 0 4px 0;
          text-transform: uppercase;
        }
        .mrf-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        .mrf-table th,
        .mrf-table td {
          border: 1px solid #000;
          padding: 6px 8px;
          vertical-align: top;
        }
        .mrf-table th {
          background: #eee;
        }
        .mrf-label {
          font-size: 8pt;
          color: #333;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          display: block;
          margin-bottom: 2px;
        }
        .mrf-value {
          font-weight: 600;
          min-height: 16px;
          display: block;
        }
        .mrf-box {
          border: 1px solid #000;
          padding: 8px;
          min-height: 90px;
          display: flex;
          flex-direction: column;
        }
        .mrf-pre {
          white-space: pre-wrap;
          margin: 4px 0 auto;
          flex: 1;
        }
        .mrf-inline-sig {
          display: grid;
          grid-template-columns: 90px 1fr;
          align-items: end;
          gap: 8px;
          margin-top: 10px;
        }
        .mrf-tick-cell {
          text-align: center;
          width: 25%;
        }
        .mrf-tick {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 1px solid #000;
          margin-right: 6px;
          vertical-align: middle;
        }
        .mrf-ticked {
          background: #000;
          position: relative;
        }
        .mrf-ticked::after {
          content: "✓";
          color: #fff;
          font-size: 10px;
          position: absolute;
          left: 2px;
          top: -1px;
        }
        .mrf-hint {
          font-size: 8pt;
          color: #333;
        }
        .mrf-req-signoff {
          margin-bottom: 4px;
        }
        .mrf-approval-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
          border: 1px solid #000;
          padding: 8px;
        }
        .mrf-approval-cell {
          display: flex;
          flex-direction: column;
        }
        .mrf-approval-sign .wo-print-sig-line {
          margin-top: 4px;
        }
        .mrf-footer {
          margin-top: 16px;
          font-size: 8pt;
          color: #555;
          text-align: center;
        }
      `}</style>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <div className="mrf-section-title">{title}</div>;
}

function Cell({ label, value, colSpan }: { label: string; value: string; colSpan?: number }) {
  return (
    <td colSpan={colSpan}>
      <span className="mrf-label">{label}</span>
      <span className="mrf-value">{value}</span>
    </td>
  );
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
