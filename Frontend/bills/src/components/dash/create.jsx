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
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, getAuthHeaders, getToken, logout } from "../../utils/auth";

const Create = () => {
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);

  const [bill, setBill] = useState({
    bill_no: "",
    date: new Date().toISOString().split("T")[0],
    client_name: "",
    address: "",
    mobile: "",
    email: "",
    gstnum: "",
    payment_type: "UPI",
    items: [{ description: "", hsn_sac: "", unit: "PCS", qty: 1, rate: 0, amount: 0 }],
  });

  useEffect(() => {
    if (!getToken()) {
      navigate("/");
      return;
    }

    const generateBillNo = () => {
      const prefix = "AIT";
      const timestamp = Date.now().toString().slice(-4);
      const random = Math.floor(100 + Math.random() * 900);
      return `${prefix}-${timestamp}-${random}`;
    };

    setBill((prev) => ({ ...prev, bill_no: generateBillNo() }));
  }, [navigate]);

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
    setBill((prev) => ({
      ...prev,
      items: [...prev.items, { description: "", hsn_sac: "", unit: "PCS", qty: 1, rate: 0, amount: 0 }],
    }));
  };

  const removeItem = (index) => {
    if (bill.items.length > 1) {
      const items = bill.items.filter((_, i) => i !== index);
      setBill({ ...bill, items });
    }
  };

  const totalAmount = bill.items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const toWords = (num) => {
    return `${new Intl.NumberFormat("en-IN").format(num)} Only`;
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
      items: bill.items,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/bills/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const responseData = await res.json().catch(() => ({}));
        setEmailStatus(responseData.email_status || null);
        setShowModal(true);
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          logout();
          navigate("/");
          return;
        }
        console.error("Server Error:", errorData);
        alert(`Save Failed: ${errorData.message || res.statusText}`);
      }
    } catch (err) {
      console.error("Network Error:", err);
      alert("Connection Error: Ensure you are on the office network.");
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    "block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircleIcon className="h-12 w-12 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Invoice saved</h2>
            <p className="mt-2 text-sm text-slate-500">
              Invoice <span className="font-semibold text-slate-900">{bill.bill_no}</span> has been created successfully.
            </p>
            {emailStatus && (
              <div
                className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                  emailStatus.sent
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-amber-200 bg-amber-50 text-amber-800"
                }`}
              >
                {emailStatus.message}
              </div>
            )}
            <div className="mt-8 space-y-3">
              <button
                onClick={() => navigate("/home")}
                className="w-full rounded-2xl bg-slate-900 py-3 font-semibold text-white transition hover:bg-slate-800"
              >
                Back to dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full rounded-2xl border border-slate-300 bg-white py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Create another invoice
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/home")}
              className="rounded-full border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
              title="Go Back"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-900 p-3 text-white">
                <DocumentTextIcon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold uppercase tracking-[0.18em] text-slate-900">Anand Infotech</h1>
                <p className="text-xs text-slate-500">Invoice Creation Workspace</p>
              </div>
            </div>
          </div>

          <button
            onClick={saveBill}
            disabled={isSaving}
            className={`${isSaving ? "cursor-not-allowed bg-slate-400" : "bg-slate-900 hover:bg-slate-800"} flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition`}
          >
            <CheckCircleIcon className="h-5 w-5" />
            {isSaving ? "Saving..." : "Save Invoice"}
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <section className="rounded-[28px] border border-slate-200 bg-white px-8 py-8 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Billing</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Create a professional invoice</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Fill in customer details, add line items, and save a clean invoice record ready for PDF delivery and email.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Invoice ID</div>
                <div className="mt-2 font-mono text-sm font-semibold text-slate-900">{bill.bill_no}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Items</div>
                <div className="mt-2 text-2xl font-bold text-slate-900">{bill.items.length}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Total</div>
                <div className="mt-2 text-lg font-bold text-slate-900">Rs. {formatCurrency(totalAmount)}</div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
                <div className="rounded-2xl bg-slate-100 p-2 text-slate-700">
                  <UserGroupIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-900">Customer Information</h3>
                  <p className="mt-1 text-sm text-slate-500">Details shown on the invoice and used for email sending.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-3">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Client Name</label>
                  <input
                    name="client_name"
                    placeholder="Enter customer name"
                    className={inputClass}
                    value={bill.client_name}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">GSTIN</label>
                  <input
                    name="gstnum"
                    placeholder="GST number"
                    className={inputClass}
                    value={bill.gstnum}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Mobile</label>
                  <input
                    name="mobile"
                    placeholder="Phone number"
                    className={inputClass}
                    value={bill.mobile}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Email</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="client@email.com"
                    className={inputClass}
                    value={bill.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Address</label>
                  <textarea
                    name="address"
                    rows="3"
                    className={`${inputClass} resize-none`}
                    value={bill.address}
                    onChange={handleChange}
                  ></textarea>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-900">Line Items</h3>
                  <p className="mt-1 text-sm text-slate-500">Add products or services that belong on this invoice.</p>
                </div>
                <button
                  onClick={addItem}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Item
                </button>
              </div>

              <div className="overflow-x-auto px-4 py-4">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      <th className="px-4 py-3">Description</th>
                      <th className="w-32 px-3 py-3">HSN/SAC</th>
                      <th className="w-24 px-3 py-3 text-center">Unit</th>
                      <th className="w-24 px-3 py-3 text-center">Qty</th>
                      <th className="w-36 px-3 py-3 text-right">Rate</th>
                      <th className="w-36 px-4 py-3 text-right">Amount</th>
                      <th className="w-14 px-2 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.items.map((item, index) => (
                      <tr key={index} className="border-t border-slate-200 first:border-t-0">
                        <td className="px-4 py-4">
                          <input
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
                            placeholder="Product or service name"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, "description", e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-4">
                          <input
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-xs outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
                            placeholder="9983"
                            value={item.hsn_sac}
                            onChange={(e) => handleItemChange(index, "hsn_sac", e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-4">
                          <input
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-center text-xs outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
                            value={item.unit}
                            onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-4">
                          <input
                            type="number"
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-center text-sm font-semibold outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
                            value={item.qty}
                            onChange={(e) => handleItemChange(index, "qty", e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-4">
                          <input
                            type="text"
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-right text-sm outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">
                          Rs. {formatCurrency(item.amount)}
                        </td>
                        <td className="px-2 py-4 text-center">
                          <button
                            onClick={() => removeItem(index)}
                            className="rounded-full p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  onClick={addItem}
                  className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 transition hover:text-slate-900"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add row
                </button>
              </div>
            </section>
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-5">
              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Invoice ID</label>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm font-semibold text-slate-900">
                      {bill.bill_no}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Billing Date</label>
                    <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3">
                      <CalendarDaysIcon className="h-4 w-4 text-slate-500" />
                      <input
                        type="date"
                        name="date"
                        value={bill.date}
                        className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Payment Method</label>
                    <select
                      name="payment_type"
                      value={bill.payment_type}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
                      onChange={handleChange}
                    >
                      <option value="UPI">UPI</option>
                      <option value="Cash">CASH</option>
                      <option value="Bank">TRANSFER</option>
                    </select>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Invoice Summary</p>
                    <h3 className="mt-2 text-2xl font-bold">Rs. {formatCurrency(totalAmount)}</h3>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <CurrencyRupeeIcon className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Items</span>
                    <span className="font-semibold text-white">{bill.items.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Email delivery</span>
                    <span className="font-semibold text-white">{bill.email ? "Enabled" : "Not added"}</span>
                  </div>
                </div>
                <div className="mt-6 rounded-2xl bg-white/5 px-4 py-4 text-xs uppercase tracking-[0.14em] text-slate-400">
                  {toWords(totalAmount)}
                </div>
                <button
                  onClick={saveBill}
                  disabled={isSaving}
                  className={`${isSaving ? "cursor-not-allowed bg-slate-700" : "bg-white text-slate-900 hover:bg-slate-100"} mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold transition`}
                >
                  {isSaving ? "Saving Invoice..." : "Save Invoice"}
                </button>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-900">Note</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Add the customer email if you want the invoice PDF to be sent automatically after saving.
                </p>
              </section>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Create;
