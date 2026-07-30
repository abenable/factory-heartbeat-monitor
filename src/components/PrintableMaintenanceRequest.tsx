import type { MaintenanceRequest } from "@/data/maintenanceRequests";
import { URGENCY_ORDER, urgencyLabel, urgencyHint, timeToFirstResponse } from "@/data/maintenanceRequests";
import { getMachine } from "@/data/cmms";

interface PrintableMaintenanceRequestProps {
  request: MaintenanceRequest;
}

export function PrintableMaintenanceRequest({ request }: PrintableMaintenanceRequestProps) {
  const machine = getMachine(request.equipmentId);
  return (
    <div className="print-only print-block printable-mrf">
      <div className="mrf-header">
        <div className="mrf-logo">
          <div className="mrf-logo-mark">KMC</div>
          <div>
            <div className="mrf-logo-title">Kiira Motors Corporation</div>
            <div className="mrf-logo-sub">Computerised Maintenance Management System</div>
          </div>
        </div>
        <div className="mrf-jobno">
          <div className="mrf-jobno-label">Job Number</div>
          <div className="mrf-jobno-value">{request.jobNumber}</div>
        </div>
      </div>

      <h1 className="mrf-title">Maintenance Request Form</h1>

      {/* Section 1: Requester */}
      <SectionTitle title="1. Requester Information" />
      <table className="mrf-table">
        <tbody>
          <tr>
            <Cell label="Name" value={request.requesterName} />
            <Cell label="Email" value={request.requesterEmail} />
          </tr>
          <tr>
            <Cell label="Department / Workshop" value={request.requesterDepartment} />
            <Cell label="Designation" value={request.requesterDesignation} />
          </tr>
          <tr>
            <Cell label="Date / Time of Request" value={formatDateTime(request.requestDateTime)} colSpan={3} />
          </tr>
        </tbody>
      </table>

      {/* Section 2: Equipment */}
      <SectionTitle title="2. Equipment Information" />
      <table className="mrf-table">
        <tbody>
          <tr>
            <Cell label="Equipment Name" value={request.equipmentName} />
            <Cell label="Equipment ID" value={request.equipmentId} />
          </tr>
          <tr>
            <Cell label="Workshop / Station" value={request.workshopStation} />
            <Cell label="Plant" value={machine?.plant ?? "—"} />
          </tr>
          <tr>
            <Cell label="Operator / Custodian Name" value={request.operatorCustodianName} />
            <Cell label="Operator / Custodian Designation" value={request.operatorCustodianDesignation} />
          </tr>
        </tbody>
      </table>

      {/* Section 3: Issue Description */}
      <SectionTitle title="3. Problem Description" />
      <div className="mrf-box">
        <p className="mrf-pre">{request.problemDescription || "No description provided."}</p>
      </div>

      {/* Section 4: Urgency */}
      <SectionTitle title="4. Urgency Level (tick one only)" />
      <table className="mrf-table">
        <tbody>
          <tr>
            {URGENCY_ORDER.map((u) => (
              <td key={u.value} className="mrf-tick-cell">
                <span className={`mrf-tick ${request.urgency === u.value ? "mrf-ticked" : ""}`} />
                <strong>{u.label}</strong>
                <span className="mrf-hint"> — {u.hint}</span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* Signature row */}
      <table className="mrf-table mt-2">
        <tbody>
          <tr>
            <td className="mrf-sig-cell">
              <strong>Requester Signature</strong>
              <div className="mrf-sig-box">
                {request.requesterSignature ? (
                  <img src={request.requesterSignature} alt="Requester signature" className="mrf-sig-img" />
                ) : null}
              </div>
              <small>{request.requesterName}</small>
            </td>
            <td className="mrf-sig-cell">
              <strong>Date</strong>
              <div className="mrf-sig-box" />
              <small>{formatDate(request.requesterSignedAt ?? request.submittedAt)}</small>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Section 5: Supervisor Approval */}
      <SectionTitle title="5. Supervisor Approval" />
      <table className="mrf-table">
        <tbody>
          <tr>
            <Cell label="Supervisor Name" value={request.approval?.supervisorName ?? "____________________"} />
            <Cell label="Department" value={request.approval?.supervisorDepartment ?? "____________________"} />
            <Cell label="Date" value={request.approval ? formatDate(request.approval.approvedAt) : "____________________"} />
          </tr>
        </tbody>
      </table>
      <div className="mrf-approval-row">
        <div className="mrf-approval-sig">
          <strong>Supervisor Signature</strong>
          <div className="mrf-sig-box">
            {request.approval?.signatureDataUrl ? (
              <img src={request.approval.signatureDataUrl} alt="Supervisor signature" className="mrf-sig-img" />
            ) : null}
          </div>
        </div>
        <div className="mrf-approval-stamp">
          <div className="mrf-stamp-box">
            {request.approval ? <span className="mrf-stamp">APPROVED</span> : <span className="mrf-stamp-placeholder"> stamp / sign</span>}
          </div>
        </div>
      </div>

      {/* Section 6: Response Tracking */}
      <SectionTitle title="6. Response Tracking" />
      <table className="mrf-table">
        <thead>
          <tr>
            <th>Request Received</th>
            <th>Work Order Issued</th>
            <th>Time to First Response</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{request.response.receivedAt ? formatDateTime(request.response.receivedAt) : "____________________"}</td>
            <td>
              {request.response.workOrderIssuedAt
                ? `${formatDateTime(request.response.workOrderIssuedAt)} (${request.response.workOrderNumber ?? "—"})`
                : "____________________"}
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
          border: 2px solid #000;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
        }
        .mrf-logo-title {
          font-weight: bold;
          font-size: 13pt;
        }
        .mrf-logo-sub {
          font-size: 9pt;
          color: #333;
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
          min-height: 70px;
        }
        .mrf-pre {
          white-space: pre-wrap;
          margin: 0;
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
        .mrf-sig-cell {
          width: 50%;
        }
        .mrf-sig-box {
          border-bottom: 1px solid #000;
          height: 44px;
          margin: 6px 0 2px;
          display: flex;
          align-items: flex-end;
        }
        .mrf-sig-img {
          max-height: 40px;
          width: auto;
        }
        .mrf-approval-row {
          display: flex;
          gap: 16px;
          margin-top: 8px;
        }
        .mrf-approval-sig {
          flex: 1;
        }
        .mrf-approval-stamp {
          width: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mrf-stamp-box {
          border: 2px dashed #999;
          width: 100%;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #666;
        }
        .mrf-stamp {
          color: #c00;
          font-weight: bold;
          font-size: 12pt;
          border: 2px solid #c00;
          padding: 4px 8px;
          transform: rotate(-12deg);
        }
        .mrf-stamp-placeholder {
          font-size: 8pt;
          color: #999;
        }
        .mrf-footer {
          margin-top: 16px;
          font-size: 8pt;
          color: #555;
          text-align: center;
        }
        .mt-2 { margin-top: 8px; }
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
