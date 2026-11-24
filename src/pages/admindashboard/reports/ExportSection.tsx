import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { getApiUrl } from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';

interface ExportSectionProps {
  period: string;
  startDate?: string;
  endDate?: string;
}

export const ExportSection: React.FC<ExportSectionProps> = ({
  period,
  startDate,
  endDate,
}) => {
  const { addToast } = useToast();
  const [downloadingType, setDownloadingType] = useState<string | null>(null);

  const handleDownload = async (reportType: 'orders' | 'products' | 'games') => {
    try {
      setDownloadingType(reportType);

      const token = localStorage.getItem('chokku_admin_token_v2') || '';
      let url = getApiUrl(`/analytics/export?reportType=${reportType}&period=${period}`);
      if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
      if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Server returned error status ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `chokku_${reportType}_report_${period}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      addToast(
        'Export Ready',
        `${reportType.toUpperCase()} report successfully exported to CSV file.`,
        'success'
      );
    } catch (err: any) {
      console.error('Export error:', err);
      addToast('Export Failed', err.message || 'Could not download report', 'error');
    } finally {
      setDownloadingType(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-base font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Download className="w-5 h-5 text-[#488710]" />
            <span>Detailed Reports & Data Export</span>
          </h4>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Download production-ready CSV spreadsheets for offline bookkeeping and analysis
          </p>
        </div>

        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#f0f9e8] text-[#488710] border border-[#d2ea9d]">
          Selected Period: {period.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        
        {/* Export Orders */}
        <div className="border border-gray-200 rounded-xl p-4 hover:border-[#488710] transition-colors flex flex-col justify-between space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-black text-gray-900">Orders & Fulfillment Report</h5>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Customer names, items, addresses, payment status, delivery status
              </p>
            </div>
          </div>

          <button
            onClick={() => handleDownload('orders')}
            disabled={downloadingType !== null}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            {downloadingType === 'orders' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Export Orders (.CSV)</span>
          </button>
        </div>

        {/* Export Products */}
        <div className="border border-gray-200 rounded-xl p-4 hover:border-blue-500 transition-colors flex flex-col justify-between space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-black text-gray-900">Products Catalog Performance</h5>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Product names, pricing, inventory stock, categories, discount tags
              </p>
            </div>
          </div>

          <button
            onClick={() => handleDownload('products')}
            disabled={downloadingType !== null}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            {downloadingType === 'products' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Export Products (.CSV)</span>
          </button>
        </div>

        {/* Export Games */}
        <div className="border border-gray-200 rounded-xl p-4 hover:border-amber-500 transition-colors flex flex-col justify-between space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-black text-gray-900">Games & Rewards Roster</h5>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Customer game participants, spins, coins won, wallet balances
              </p>
            </div>
          </div>

          <button
            onClick={() => handleDownload('games')}
            disabled={downloadingType !== null}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            {downloadingType === 'games' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Export Games (.CSV)</span>
          </button>
        </div>

      </div>
    </div>
  );
};

