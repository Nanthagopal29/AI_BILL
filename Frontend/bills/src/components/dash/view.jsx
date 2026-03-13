import { useEffect, useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";

const API = "http://172.24.29.33:7500/bills/";

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
          <div className="flex justify-between text-sm text-gray-500 italic"><span>GST 12.0%</span> <span>1,469.52</span></div>
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

  // Updated Ref for v3 logic
  const contentRef = useRef(null);

  // Updated hook syntax for react-to-print v3+
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
    // Timeout gives React time to update the activeBill state and render the component
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
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Invoice Dashboard</h1>

      {/* DASHBOARD STATS */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-5 mb-8">
        <div className="bg-white shadow p-6 rounded-xl border-l-4 border-blue-500">
          <h2 className="text-gray-400 uppercase text-[10px] font-black tracking-widest mb-1">Total Invoices</h2>
          <p className="text-3xl font-black text-blue-600 leading-none">{bills.length}</p>
        </div>
        <div className="bg-white shadow p-6 rounded-xl border-l-4 border-green-500">
          <h2 className="text-gray-400 uppercase text-[10px] font-black tracking-widest mb-1">Total Revenue</h2>
          <p className="text-3xl font-black text-green-600 leading-none">₹{bills.reduce((sum, b) => sum + Number(b.grand_total || 0), 0).toLocaleString()}</p>
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex flex-wrap gap-3 mb-8 bg-white p-4 rounded-lg shadow-sm">
        <input 
          placeholder="Search Client or Bill ID..." 
          className="border border-gray-200 p-2 rounded-lg w-72 shadow-inner focus:ring-2 focus:ring-blue-200 outline-none" 
          onChange={(e) => setSearch(e.target.value)} 
        />
        <div className="flex items-center gap-2">
          <input type="date" className="border border-gray-200 p-2 rounded-lg text-sm" onChange={(e) => setStartDate(e.target.value)} />
          <span className="text-gray-400">to</span>
          <input type="date" className="border border-gray-200 p-2 rounded-lg text-sm" onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <button onClick={fetchBills} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition active:scale-95">Filter</button>
      </div>

      {/* TABLE */}
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100 uppercase text-[11px] font-black tracking-widest text-gray-400">
            <tr>
              <th className="p-5">Bill No</th>
              <th className="p-5">Date</th>
              <th className="p-5">Client</th>
              <th className="p-5 text-right">Total</th>
              <th className="p-5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredBills.map((bill, index) => (
              <tr key={index} className="hover:bg-blue-50/50 transition cursor-default">
                <td className="p-5 font-bold text-gray-700">{bill.bill_no}</td>
                <td className="p-5 text-gray-500 font-medium">{bill.bill_date}</td>
                <td className="p-5 font-black text-gray-800 tracking-tight">{bill.client_name}</td>
                <td className="p-5 text-right font-black text-blue-600 text-lg">₹{bill.grand_total}</td>
                <td className="p-5 flex justify-center gap-2">
                  <button onClick={() => triggerPrint(bill)} className="bg-blue-500 text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-blue-600 shadow-md active:translate-y-px">
                    Print / PDF
                  </button>
                  <button className="bg-red-50 text-red-500 border border-red-100 px-5 py-2 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* HIDDEN PRINTABLE AREA */}
      <div className="hidden">
        <div ref={contentRef}>
          <PrintableInvoice bill={activeBill} />
        </div>
      </div>
    </div>
  );
};

export default View;