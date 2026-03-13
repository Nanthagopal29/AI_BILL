import React, { useEffect, useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";

const API = "http://192.168.1.11:7500/bills/";

// ==============================
// INVOICE DESIGN COMPONENT
// ==============================
const PrintableInvoice = ({ bill }) => {
  if (!bill) return null;

  return (
    <div className="p-12 bg-white w-[210mm] min-h-[297mm] relative overflow-hidden text-gray-800 font-sans mx-auto">
      {/* Top Header */}
      <div className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-4xl font-bold text-blue-500 italic" style={{ fontFamily: 'serif' }}>Saffron Design</h1>
          <p className="text-sm text-gray-600 mt-1">77 Namrata Bldg<br />Delhi, Delhi 400077</p>
        </div>
        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold border-4 border-white shadow-sm">
          LOGO
        </div>
      </div>

      {/* Addresses and Details */}
      <div className="grid grid-cols-3 gap-8 mb-12 text-sm">
        <div>
          <h3 className="text-blue-500 font-bold mb-2 border-b border-blue-100 pb-1 text-xs uppercase tracking-wider">Bill To</h3>
          <p className="font-semibold text-base">{bill.client_name}</p>
          <p className="text-gray-600 leading-relaxed pt-1">27, Dlf City, Gupta<br />Delhi, Delhi 40003</p>
        </div>
        <div>
          <h3 className="text-blue-500 font-bold mb-2 border-b border-blue-100 pb-1 text-xs uppercase tracking-wider">Ship To</h3>
          <p className="font-semibold text-base">{bill.client_name}</p>
          <p className="text-gray-600 leading-relaxed pt-1">264, Abdul Rehman<br />Mumbai, Bihar 40009</p>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between"><span className="text-blue-500 font-bold">Invoice #</span> <span>{bill.bill_no}</span></div>
          <div className="flex justify-between"><span className="text-blue-500 font-bold">Invoice Date</span> <span>{bill.bill_date}</span></div>
          <div className="flex justify-between"><span className="text-blue-500 font-bold">P.O.#</span> <span>2430/2019</span></div>
          <div className="flex justify-between"><span className="text-blue-500 font-bold">Due Date</span> <span>26/04/2019</span></div>
        </div>
      </div>

      {/* Table */}
      <table className="w-full mb-8 border-collapse">
        <thead>
          <tr className="bg-blue-500 text-white text-left text-sm">
            <th className="p-3">Qty</th>
            <th className="p-3">Description</th>
            <th className="p-3 text-right">Unit Price</th>
            <th className="p-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {bill.items?.map((item, i) => (
            <tr key={i} className="border-b border-gray-100 italic">
              <td className="p-3 text-center">{item.qty}</td>
              <td className="p-3">{item.description}</td>
              <td className="p-3 text-right">{Number(item.rate).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
              <td className="p-3 text-right font-medium">{Number(item.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals & Signature */}
      <div className="flex justify-between mt-8">
        <div className="w-1/2">
           <h4 className="text-blue-500 font-bold text-xs uppercase mb-2">Terms & Conditions</h4>
           <p className="text-[10px] text-gray-500 leading-tight">Payment is due within 15 days of invoice date. Please include invoice number on your remittance.</p>
           <div className="mt-6 text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded">
              <p className="font-bold border-b mb-1 pb-1 border-gray-200">State Bank of India</p>
              <p>Account: 12345678</p>
              <p>IFSC / Routing: 09876543210</p>
           </div>
        </div>
        <div className="w-1/3 text-right space-y-2">
          <div className="flex justify-between text-sm"><span>Subtotal</span> <span>{Number(bill.grand_total).toLocaleString('en-IN')}</span></div>
          <div className="flex justify-between text-sm text-gray-500 italic"><span>GST 12.0%</span> <span>{Number(bill.grand_total * 0.12).toLocaleString('en-IN')}</span></div>
          <div className="flex justify-between text-xl font-bold text-blue-600 border-t-2 border-blue-500 pt-2">
            <span>Total</span> <span>₹{Number(bill.grand_total).toLocaleString('en-IN')}</span>
          </div>
          <div className="pt-16">
             <p className="font-serif text-2xl italic text-gray-900">Priya Chopra</p>
             <div className="h-[1.5px] bg-gray-800 w-36 ml-auto mt-1"></div>
             <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mt-1">Authorized Signature</p>
          </div>
        </div>
      </div>

      {/* Bottom Decorative Waves */}
      <div className="absolute -bottom-16 -right-16 w-96 h-96 bg-blue-400 rounded-full opacity-20 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-full h-24 flex items-end print:opacity-100">
          <div className="w-full h-16 bg-blue-500 opacity-80" style={{ clipPath: 'ellipse(80% 100% at 50% 100%)' }}></div>
      </div>
    </div>
  );
};

// ==============================
// MAIN VIEW COMPONENT
// ==============================
const View = () => {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeBill, setActiveBill] = useState(null);

  const contentRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: activeBill ? `Invoice_${activeBill.bill_no}` : "Invoice",
  });

  const fetchBills = async () => {
    let url = API;
    if (startDate && endDate) url += `?start=${startDate}&end=${endDate}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      setBills(data.bills || []);
    } catch (err) { console.error("Fetch error", err); }
  };

  useEffect(() => { fetchBills(); }, []);

  const triggerPrint = (bill) => {
    setActiveBill(bill);
    setTimeout(() => {
      if (contentRef.current) {
        handlePrint();
      }
    }, 500);
  };

  const filteredBills = bills.filter((bill) =>
    bill.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    bill.bill_no?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-10 bg-gray-50 min-h-screen">
      
      {/* TOP NAVIGATION BAR */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => window.history.back()} 
          className="flex items-center justify-center w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-200 hover:bg-gray-100 transition-all active:scale-90 text-gray-700 font-bold text-xl"
        >
          ←
        </button>
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Invoice Dashboard</h1>
          <p className="text-sm text-gray-500">View and manage your recent transactions</p>
        </div>
      </div>

      {/* DASHBOARD STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <div className="bg-white shadow p-6 rounded-2xl border-l-4 border-blue-500 flex justify-between items-center">
          <div>
            <h2 className="text-gray-400 uppercase text-[10px] font-black tracking-widest mb-1">Total Invoices</h2>
            <p className="text-3xl font-black text-blue-600 leading-none">{bills.length}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-blue-500">📄</div>
        </div>
        <div className="bg-white shadow p-6 rounded-2xl border-l-4 border-green-500 flex justify-between items-center">
          <div>
            <h2 className="text-gray-400 uppercase text-[10px] font-black tracking-widest mb-1">Total Revenue</h2>
            <p className="text-3xl font-black text-green-600 leading-none">
                ₹{bills.reduce((sum, b) => sum + Number(b.grand_total || 0), 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-green-500">💰</div>
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex flex-wrap items-center gap-4 mb-8 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex-1 min-w-[300px]">
            <input 
            placeholder="Search Client or Bill ID..." 
            className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 shadow-inner focus:ring-2 focus:ring-blue-200 outline-none transition-all" 
            onChange={(e) => setSearch(e.target.value)} 
            />
        </div>
        <div className="flex items-center gap-3">
          <input type="date" className="border border-gray-200 p-3 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-blue-100" onChange={(e) => setStartDate(e.target.value)} />
          <span className="text-gray-400 font-bold">to</span>
          <input type="date" className="border border-gray-200 p-3 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-blue-100" onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <button onClick={fetchBills} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition active:scale-95 shadow-lg shadow-blue-200">
            Filter Results
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100 uppercase text-[11px] font-black tracking-widest text-gray-400">
            <tr>
              <th className="p-6">Bill No</th>
              <th className="p-6">Date</th>
              <th className="p-6">Client Name</th>
              <th className="p-6 text-right">Total Amount</th>
              <th className="p-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredBills.length > 0 ? filteredBills.map((bill, index) => (
              <tr key={index} className="hover:bg-blue-50/50 transition-colors group">
                <td className="p-6 font-bold text-gray-700">{bill.bill_no}</td>
                <td className="p-6 text-gray-500 font-medium">{bill.bill_date}</td>
                <td className="p-6 font-black text-gray-800 tracking-tight">{bill.client_name}</td>
                <td className="p-6 text-right font-black text-blue-600 text-lg">
                    ₹{Number(bill.grand_total).toLocaleString('en-IN')}
                </td>
                <td className="p-6 flex justify-center gap-3">
                  <button 
                    onClick={() => triggerPrint(bill)} 
                    className="bg-blue-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-600 shadow-md transition active:translate-y-px"
                  >
                    PRINT PDF
                  </button>
                  <button className="bg-red-50 text-red-500 border border-red-100 px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all">
                    DELETE
                  </button>
                </td>
              </tr>
            )) : (
                <tr>
                    <td colSpan="5" className="p-20 text-center text-gray-400 font-medium italic">
                        No invoices found matching your criteria.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* HIDDEN PRINTABLE AREA */}
      <div style={{ display: "none" }}>
        <div ref={contentRef}>
          <PrintableInvoice bill={activeBill} />
        </div>
      </div>
    </div>
  );
};

export default View;