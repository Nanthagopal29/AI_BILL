import { useState, useEffect } from "react";
import { 
  PlusIcon, 
  TrashIcon, 
  CheckCircleIcon, 
  DocumentTextIcon, 
  UserGroupIcon, 
  CurrencyRupeeIcon,
  CalendarDaysIcon,
  ArrowLeftIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

const Create = () => {
  const navigate = useNavigate();
  
  // State for UI Feedback
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // State for Bill Data
  const [bill, setBill] = useState({
    bill_no: "",
    date: new Date().toISOString().split("T")[0],
    client_name: "",
    address: "",
    mobile: "",
    email: "",
    gstnum: "",
    payment_type: "UPI",
    items: [{ description: "", hsn_sac: "", unit: "", qty: 1, rate: 0, amount: 0 }],
  });

  // Generate unique Bill Number on load
  useEffect(() => {
    const generateBillNo = () => {
      const prefix = "AIT"; 
      const timestamp = Date.now().toString().slice(-4);
      const random = Math.floor(100 + Math.random() * 900);
      return `${prefix}-${timestamp}-${random}`;
    };
    setBill((prev) => ({ ...prev, bill_no: generateBillNo() }));
  }, []);

  const handleChange = (e) => {
    setBill({ ...bill, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index, field, value) => {
    const items = [...bill.items];
    items[index][field] = value;
    if (field === "qty" || field === "rate") {
      items[index].amount = Number(items[index].qty) * Number(items[index].rate);
    }
    setBill({ ...bill, items });
  };

  const addItem = () => {
    setBill({
      ...bill,
      items: [...bill.items, { description: "", hsn_sac: "", unit: "PCS", qty: 1, rate: 0, amount: 0 }],
    });
  };

  const removeItem = (index) => {
    if (bill.items.length > 1) {
      const items = bill.items.filter((_, i) => i !== index);
      setBill({ ...bill, items });
    }
  };

  const totalAmount = bill.items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  
  const toWords = (num) => {
    return new Intl.NumberFormat('en-IN').format(num) + " Only";
  };

  const saveBill = async () => {
    setIsSaving(true);
    const payload = {
      bill_no: bill.bill_no,
      bill_date: bill.date,
      payment_type: bill.payment_type,
      client_name: bill.client_name,
      client_mobile: bill.mobile,
      client_email: bill.email,
      client_address: bill.address,
      gstnum: bill.gstnum,
      sub_total: totalAmount,
      grand_total: totalAmount,
      amount_words: toWords(totalAmount),
      items: bill.items
    };

    try {
      const res = await fetch("http://192.168.1.11:7500/bills/", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(true);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Server Error:", errorData);
        alert(`❌ Save Failed: ${res.statusText}`);
      }
    } catch (err) {
      console.error("Network Error:", err);
      alert("❌ Connection Error: Ensure you are on the office network.");
    } finally {
        setIsSaving(false);
    }
  };

  const inputClass = "block w-full px-3 py-2 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all";

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 font-sans pb-10">
      
      {/* POPUP MODAL */}
      {showModal && (
        <div className="fixed inset-0  flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
              <CheckCircleIcon className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-800">Saved Successfully!</h2>
            <p className="text-slate-500 mt-2 font-medium">Invoice <span className="text-blue-600 font-bold">{bill.bill_no}</span> has been created for Anand InfoTech.</p>
            
            <div className="mt-8 space-y-3">
              <button 
                onClick={() => navigate("home")}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95"
              >
                Go to Home
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all"
              >
                Create New Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <nav className="bg-slate-900 text-white shadow-lg px-6 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/home")} 
              className="p-2 hover:bg-slate-800 rounded-full transition-colors group"
              title="Go Back"
            >
              <ArrowLeftIcon className="h-5 w-5 text-slate-400 group-hover:text-white" />
            </button>
            <div className="flex items-center gap-3 border-l border-slate-700 pl-4">
              <div className="bg-blue-500 p-2 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight uppercase leading-none">Anand InfoTech</h1>
                <p className="text-[10px] text-blue-300 font-medium tracking-[0.2em] mt-1">BILLING SYSTEM</p>
              </div>
            </div>
          </div>
          <button 
            onClick={saveBill} 
            disabled={isSaving}
            className={`${isSaving ? 'bg-slate-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'} active:scale-95 text-white px-6 py-2 rounded-md font-bold flex items-center gap-2 transition-all shadow-md`}
          >
            {isSaving ? (
                <span className="flex items-center gap-2">Saving...</span>
            ) : (
                <><CheckCircleIcon className="h-5 w-5" /> Save Invoice</>
            )}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: FORM */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* Client Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                <UserGroupIcon className="h-5 w-5 text-blue-600" />
                <h2 className="font-bold text-slate-800 uppercase text-sm tracking-wider">Customer Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                <div className="md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 mb-1 block uppercase">Client Name</label>
                  <input name="client_name" placeholder="Enter name" className={inputClass} onChange={handleChange} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 mb-1 block uppercase">GSTIN</label>
                  <input name="gstnum" placeholder="GST Number" className={inputClass} onChange={handleChange} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 mb-1 block uppercase">Mobile</label>
                  <input name="mobile" placeholder="Phone" className={inputClass} onChange={handleChange} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 mb-1 block uppercase">Email</label>
                  <input name="email" type="email" placeholder="client@email.com" className={inputClass} onChange={handleChange} />
                </div>
                <div className="md:col-span-3">
                  <label className="text-[11px] font-bold text-slate-500 mb-1 block uppercase">Address</label>
                  <textarea name="address" rows="1" className={inputClass} onChange={handleChange}></textarea>
                </div>
              </div>
            </div>

            {/* Line Items Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 text-xs uppercase tracking-widest">Inventory & Services</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase">
                      <th className="px-6 py-3">Item Description</th>
                      <th className="px-3 py-3 w-32">HSN/SAC</th>
                      <th className="px-3 py-3 w-20 text-center">Unit</th>
                      <th className="px-3 py-3 w-24 text-center">Qty</th>
                      <th className="px-3 py-3 w-32 text-right">Rate</th>
                      <th className="px-6 py-3 w-32 text-right">Amount</th>
                      <th className="px-4 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bill.items.map((item, index) => (
                      <tr key={index} className="hover:bg-blue-50/20 group">
                        <td className="px-6 py-3">
                          <input className="w-full bg-transparent focus:outline-none font-medium text-sm" placeholder="Product Name" value={item.description} onChange={(e) => handleItemChange(index, "description", e.target.value)} />
                        </td>
                        <td className="px-3 py-3">
                          <input className="w-full bg-slate-100/50 rounded px-2 py-1 text-xs" placeholder="9983" value={item.hsn_sac} onChange={(e) => handleItemChange(index, "hsn_sac", e.target.value)} />
                        </td>
                        <td className="px-3 py-3">
                          <input className="w-full bg-transparent text-center text-xs" value={item.unit} onChange={(e) => handleItemChange(index, "unit", e.target.value)} />
                        </td>
                        <td className="px-3 py-3">
                          <input type="number" className="w-full bg-white border border-slate-200 rounded py-1 text-center font-bold text-sm" value={item.qty} onChange={(e) => handleItemChange(index, "qty", e.target.value)} />
                        </td>
                        <td className="px-3 py-3">
                          <input type="number" className="w-full bg-transparent text-right focus:outline-none text-sm" value={item.rate} onChange={(e) => handleItemChange(index, "rate", e.target.value)} />
                        </td>
                        <td className="px-6 py-3 text-right font-bold text-slate-700 text-sm">
                          ₹{item.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => removeItem(index)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                <button onClick={addItem} className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 uppercase">
                  <PlusIcon className="h-4 w-4" /> Add Row
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: SIDEBAR */}
          <div className="lg:col-span-3">
            <div className="space-y-4 sticky top-24">
              
              {/* Meta Card */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Invoice ID</label>
                    <div className="font-mono font-bold text-blue-600 text-sm">{bill.bill_no}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Billing Date</label>
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-1">
                        <CalendarDaysIcon className="h-4 w-4 text-slate-400" />
                        <input type="date" name="date" value={bill.date} className="w-full font-bold text-slate-700 text-sm focus:outline-none" onChange={handleChange} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Payment Method</label>
                    <select name="payment_type" className="w-full font-bold text-slate-700 text-sm bg-transparent focus:outline-none" onChange={handleChange}>
                      <option value="UPI">UPI</option>
                      <option value="Cash">CASH</option>
                      <option value="Bank">TRANSFER</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-slate-900 rounded-xl shadow-xl p-6 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total Summary</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400 text-xs">Items Count</span>
                    <span className="font-medium text-sm">{bill.items.length}</span>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-700">
                    <div className="text-[10px] text-blue-400 font-bold uppercase mb-1">Payable Amount</div>
                    <div className="text-3xl font-black text-white italic">₹{totalAmount.toLocaleString()}</div>
                    <p className="text-[10px] text-slate-500 mt-2 leading-tight uppercase font-medium">
                        {toWords(totalAmount)}
                    </p>
                  </div>
                </div>
                {/* Visual Watermark */}
                <div className="absolute -right-4 -bottom-4 text-slate-800 opacity-40 transform rotate-12">
                  <CurrencyRupeeIcon className="h-24 w-24" />
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Create;