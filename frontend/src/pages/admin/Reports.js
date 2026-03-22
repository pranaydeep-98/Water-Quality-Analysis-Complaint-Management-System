import React from 'react';
import { 
  FileText, 
  Download, 
  FileCheck, 
  Map, 
  BarChart, 
  Activity, 
  ExternalLink 
} from 'lucide-react';
import './Reports.css';

const Reports = () => {
  const reports = [
    { 
      id: 1, 
      title: 'Monthly Summary Report', 
      desc: 'Overall system performance, resolution rates, and complaint statistics for the current month.', 
      icon: <Activity size={32} className="text-primary" />,
      tag: 'System Wide',
      date: 'Generated 2 hours ago'
    },
    { 
      id: 2, 
      title: 'Area Risk Report', 
      desc: 'Heatmap data and risk score analysis for each zone based on incident density and severity.', 
      icon: <Map size={32} className="text-danger" />,
      tag: 'Geospatial',
      date: 'Ready for generation'
    },
    { 
      id: 3, 
      title: 'SLA Compliance Report', 
      desc: 'Detailed breakdown of response times and SLA breaches categorized by technician and area.', 
      icon: <FileCheck size={32} className="text-warning" />,
      tag: 'Compliance',
      date: 'Weekly update - Ready'
    }
  ];

  return (
    <div className="admin-page-content reports-page">
      <div className="reports-grid">
         {reports.map((report) => (
           <div key={report.id} className="report-card glass-card">
              <div className="report-header">
                 <div className="icon-bg">{report.icon}</div>
                 <div className="header-meta">
                    <span className="report-tag">{report.tag}</span>
                    <span className="report-date">{report.date}</span>
                 </div>
              </div>

              <div className="report-body">
                 <h3>{report.title}</h3>
                 <p className="text-muted">{report.desc}</p>
              </div>

              <div className="report-actions">
                 <button className="btn-action primary">
                    <BarChart size={18} /> Generate
                 </button>
                 <button className="btn-action secondary">
                    <Download size={18} /> Export PDF
                 </button>
              </div>
           </div>
         ))}
      </div>

      <div className="archives-section glass-card">
         <div className="section-header">
            <h2>Report Archives</h2>
            <FileText size={18} className="text-muted" />
         </div>
         
         <div className="archives-list">
            <ArchiveItem name="Annual Performance Review 2025" date="Jan 12, 2026" type="PDF" size="4.2MB" />
            <ArchiveItem name="Q4 SLA Compliance Audit" date="Dec 15, 2025" type="XLSX" size="1.8MB" />
            <ArchiveItem name="Regional Risk Assessment - North" date="Oct 28, 2025" type="PDF" size="3.5MB" />
         </div>
      </div>
    </div>
  );
};

const ArchiveItem = ({ name, date, type, size }) => (
  <div className="archive-item glass-mini">
     <div className="archive-info">
        <h3>{name}</h3>
        <span>{date} • {type} • {size}</span>
     </div>
     <button className="icon-btn"><ExternalLink size={18} /></button>
  </div>
);

export default Reports;
