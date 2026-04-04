import React, { useEffect, useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, getAuthHeaders, getToken, logout } from "../../utils/auth";
import Invoice from "./invoice";

const API = `${API_BASE_URL}/bills/`;

const View = () => {
  const navigate = useNavigate();
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
      const res = await fetch(url, {
        headers: getAuthHeaders(false),
      });

      if (res.status === 401) {
        logout();
        navigate("/");
        return;
      }

      const data = await res.json();
      setBills(data.bills || []);
    } catch (err) {
      console.error("Fetch error", err);
    }
  };

  useEffect(() => {
    if (!getToken()) {
      navigate("/");
      return;
    }
    fetchBills();
  }, [navigate]);

  const triggerPrint = (bill) => {
    setActiveBill(bill);
    setTimeout(() => {
      if (contentRef.current) {
        handlePrint();
      }
    }, 500);
  };

  const handleDelete = async (billNo) => {
    const confirmed = window.confirm(`Delete invoice ${billNo}?`);
    if (!confirmed) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/bills/${billNo}/`, {
        method: "DELETE",
        headers: getAuthHeaders(false),
      });

      if (res.status === 401) {
        logout();
        navigate("/");
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Unable to delete invoice");
      }

      await fetchBills();
      if (activeBill?.bill_no === billNo) {
        setActiveBill(null);
      }
      window.alert(data.message || "Invoice deleted successfully.");
    } catch (error) {
      window.alert(error.message || "Unable to delete invoice.");
    }
  };

  const filteredBills = bills.filter(
    (bill) =>
      bill.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      bill.bill_no?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-10 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => window.history.back()}
          className="flex items-center justify-center w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-200 hover:bg-gray-100 transition-all active:scale-90 text-gray-700 font-bold text-xl"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Invoice Dashboard</h1>
          <p className="text-sm text-gray-500">View and manage your recent transactions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <div className="bg-white shadow p-6 rounded-2xl border-l-4 border-red-500 flex justify-between items-center">
          <div>
            <h2 className="text-gray-400 uppercase text-[10px] font-black tracking-widest mb-1">Total Invoices</h2>
            <p className="text-3xl font-black text-red-600 leading-none">{bills.length}</p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-red-500">Docs</div>
        </div>
        <div className="bg-white shadow p-6 rounded-2xl border-l-4 border-gray-800 flex justify-between items-center">
          <div>
            <h2 className="text-gray-400 uppercase text-[10px] font-black tracking-widest mb-1">Total Revenue</h2>
            <p className="text-3xl font-black text-gray-800 leading-none">
              Rs. {bills.reduce((sum, b) => sum + Number(b.grand_total || 0), 0).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="bg-gray-100 p-3 rounded-lg text-gray-800">Cash</div>
        </div>
      </div>

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
            {filteredBills.length > 0 ? (
              filteredBills.map((bill, index) => (
                <tr key={index} className="hover:bg-red-50/50 transition-colors group">
                  <td className="p-6 font-bold text-gray-700">{bill.bill_no}</td>
                  <td className="p-6 text-gray-500 font-medium">{bill.bill_date}</td>
                  <td className="p-6 font-black text-gray-800 tracking-tight">{bill.client_name}</td>
                  <td className="p-6 text-right font-black text-red-600 text-lg">
                    Rs. {Number(bill.grand_total).toLocaleString("en-IN")}
                  </td>
                  <td className="p-6 flex justify-center gap-3">
                    <button
                      onClick={() => triggerPrint(bill)}
                      className="bg-gray-800 cursor-pointer text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-black shadow-md transition active:translate-y-px"
                    >
                      PRINT PDF
                    </button>
                    <button
                      onClick={() => handleDelete(bill.bill_no)}
                      className="bg-red-50 cursor-pointer text-red-500 border border-red-100 px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all"
                    >
                      DELETE
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-20 text-center text-gray-400 font-medium italic">
                  No invoices found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: "none" }}>
        <div ref={contentRef}>
          <Invoice bill={activeBill} />
        </div>
      </div>
    </div>
  );
};

export default View;
