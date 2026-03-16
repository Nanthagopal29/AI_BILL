import React, { useEffect, useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";

const API = "http://192.168.1.11:7500/bills/";

// ==============================
// INVOICE DESIGN COMPONENT
// ==============================
const PrintableInvoice = ({ bill }) => {
  if (!bill) return null;

  return (
    <div className="p-12 bg-white w-[210mm] min-h-[297mm] relative overflow-hidden font-sans text-gray-800 mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-4xl font-black text-red-600 tracking-wider">ANAND INFOTECH</h1>
          <p className="text-sm font-semibold text-gray-700 mt-1">All Sales & Services</p>
          <p className="text-sm mt-2 text-gray-600">
            19/3, Jayalakshmi Nagar, 2nd Street,<br />
            Mannarai Post, Tirupur - 641 607.
          </p>
          <div className="text-sm text-gray-600 mt-2 space-y-1">
            <p><span className="font-bold text-gray-800">Phone:</span> 89037 97913 / 63837 88930</p>
            <p><span className="font-bold text-gray-800">Email:</span> anandinfo6383@gmail.com</p>
          </div>
        </div>
        
        {/* Logo Placeholder - Styled like the circular dots in the image */}
        <div className="w-24 h-24 bg-[#2b2b2b] rounded-full flex flex-col items-center justify-center text-red-500 font-bold border-4 border-red-50 shadow-sm relative overflow-hidden">
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-red-600"></span>
            <span className="w-2 h-2 rounded-full bg-red-600"></span>
            <span className="w-2 h-2 rounded-full bg-red-600"></span>
          </div>
          <div className="flex gap-1 mt-1">
            <span className="w-2 h-2 rounded-full bg-red-600"></span>
            <span className="w-2 h-2 rounded-full bg-red-600"></span>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-3 gap-4 mb-10 text-sm">
        <div>
          <h3 className="font-bold text-red-600 mb-1 border-b border-red-100 pb-1 uppercase tracking-wider text-xs">Bill To</h3>
          <p className="font-semibold">{bill.client_name}</p>
          <p className="text-gray-500 mt-1">
            {bill.client_address || "Client Address Here"}
          </p>
        </div>
        <div>
          <h3 className="font-bold text-red-600 mb-1 border-b border-red-100 pb-1 uppercase tracking-wider text-xs">Ship To</h3>
          <p className="font-semibold">{bill.client_name}</p>
          <p className="text-gray-500 mt-1">
            {bill.shipping_address || "Shipping Address Here"}
          </p>
        </div>
        <div className="text-right space-y-1">
          <p><span className="font-bold text-gray-800">Invoice #</span> <span className="text-red-600 font-medium">{bill.bill_no}</span></p>
          <p><span className="font-bold text-gray-800">Invoice Date</span> {bill.bill_date}</p>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-10 border-collapse">
        <thead>
          <tr className="bg-[#2b2b2b] text-white">
            <th className="p-3 text-left">Qty</th>
            <th className="p-3 text-left">Description</th>
            <th className="p-3 text-right">Unit Price</th>
            <th className="p-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {bill.items?.map((item, i) => (
            <tr key={i} className="border-b border-gray-200">
              <td className="p-3">{item.qty}</td>
              <td className="p-3 font-medium">{item.description}</td>
              <td className="p-3 text-right">₹{Number(item.rate).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
              <td className="p-3 text-right font-bold text-gray-800">₹{Number(item.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Bottom Section */}
      <div className="flex justify-between items-end mt-10">
        <div className="text-sm">
          <h4 className="font-bold text-red-600 mb-1 uppercase text-xs tracking-wider">Terms & Conditions</h4>
          <p className="text-gray-500">Payment is due within 15 days of invoice date.</p>
          <div className="mt-6 text-xs text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <p className="font-bold text-gray-800 mb-1 border-b pb-1">Bank Details</p>
            <p>Bank Name: State Bank of India</p>
            <p>Account Number: 12345678</p>
            <p>IFSC Code: SBIN0000000</p>
          </div>
        </div>
        <div className="text-right w-1/3 space-y-2">
          <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
            <span className="font-medium text-gray-600">Subtotal</span> 
            <span>₹{Number(bill.grand_total).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500 pb-2">
            <span>GST 12.0%</span> 
            <span>₹{Number(bill.grand_total * 0.12).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between font-black text-xl text-red-600 border-t-2 border-red-600 pt-3">
            <span>Total</span> 
            <span>₹{Number(bill.grand_total).toLocaleString('en-IN')}</span>
          </div>
          <div className="pt-16">
             <p className="font-bold text-lg uppercase tracking-wide text-gray-800">Ananthan.V</p>
             <p className="text-xs text-gray-500 mb-1">Sales & Service</p>
             <div className="h-0.5 bg-[#2b2b2b] w-40 ml-auto mt-1"></div>
             <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mt-1">Authorized Signatory</p>
          </div>
        </div>
      </div>

      {/* Decorative Wave Shapes - Adapted to Red/Black theme */}
      <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-red-500 rounded-full opacity-10 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-full h-16 bg-[#2b2b2b]" style={{ clipPath: 'polygon(0 40%, 100% 0, 100% 100%, 0% 100%)' }}>
         <div className="absolute bottom-0 left-0 w-full h-8 bg-red-600" style={{ clipPath: 'polygon(0 60%, 100% 0, 100% 100%, 0% 100%)' }}></div>
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
        <div className="bg-white shadow p-6 rounded-2xl border-l-4 border-red-500 flex justify-between items-center">
          <div>
            <h2 className="text-gray-400 uppercase text-[10px] font-black tracking-widest mb-1">Total Invoices</h2>
            <p className="text-3xl font-black text-red-600 leading-none">{bills.length}</p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-red-500">📄</div>
        </div>
        <div className="bg-white shadow p-6 rounded-2xl border-l-4 border-gray-800 flex justify-between items-center">
          <div>
            <h2 className="text-gray-400 uppercase text-[10px] font-black tracking-widest mb-1">Total Revenue</h2>
            <p className="text-3xl font-black text-gray-800 leading-none">
                ₹{bills.reduce((sum, b) => sum + Number(b.grand_total || 0), 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-gray-100 p-3 rounded-lg text-gray-800">💰</div>
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex flex-wrap items-center gap-4 mb-8 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex-1 min-w-75">
            <input 
            placeholder="Search Client or Bill ID..." 
            className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 shadow-inner focus:ring-2 focus:ring-red-200 outline-none transition-all" 
            onChange={(e) => setSearch(e.target.value)} 
            />
        </div>
        <div className="flex items-center gap-3">
          <input type="date" className="border border-gray-200 p-3 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-red-100" onChange={(e) => setStartDate(e.target.value)} />
          <span className="text-gray-400 font-bold">to</span>
          <input type="date" className="border border-gray-200 p-3 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-red-100" onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <button onClick={fetchBills} className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 transition active:scale-95 shadow-lg shadow-red-200">
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
              <tr key={index} className="hover:bg-red-50/50 transition-colors group">
                <td className="p-6 font-bold text-gray-700">{bill.bill_no}</td>
                <td className="p-6 text-gray-500 font-medium">{bill.bill_date}</td>
                <td className="p-6 font-black text-gray-800 tracking-tight">{bill.client_name}</td>
                <td className="p-6 text-right font-black text-red-600 text-lg">
                    ₹{Number(bill.grand_total).toLocaleString('en-IN')}
                </td>
                <td className="p-6 flex justify-center gap-3">
                  <button 
                    onClick={() => triggerPrint(bill)} 
                    className="bg-gray-800 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-black shadow-md transition active:translate-y-px"
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