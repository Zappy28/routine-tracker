import "./DailyReceipt.css";

const statusInfo = {
  green: { label: "Day complete", cls: "status-green" },
  yellow: { label: "In progress", cls: "status-yellow" },
  red: { label: "Items missed", cls: "status-red" },
};

function DailyReceipt({ dateLabel, status, children }) {
  const info = statusInfo[status] ?? statusInfo.yellow;

  return (
    <div className="receipt">
      <div className="receipt-top">
        <span className="receipt-eyebrow">Daily Log</span>
        <h1 className="receipt-date">{dateLabel}</h1>
        <span className={`receipt-status ${info.cls}`}>{info.label}</span>
      </div>

      <div className="receipt-perforation" aria-hidden="true" />

      <div className="receipt-body">{children}</div>

      <div className="receipt-perforation receipt-perforation-bottom" aria-hidden="true" />
    </div>
  );
}

export default DailyReceipt;
