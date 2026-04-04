const Invoice = ({ bill }) => {
  if (!bill) return null;

  return (
    <div className="p-12 bg-white w-[210mm] min-h-[297mm] relative overflow-hidden font-sans text-gray-800 mx-auto">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-4xl font-black text-red-600 tracking-wider">ANAND INFOTECH</h1>
          <p className="text-sm font-semibold text-gray-700 mt-1">All Sales & Services</p>
          <p className="text-sm mt-2 text-gray-600">
            19/3, Jayalakshmi Nagar, 2nd Street,
            <br />
            Mannarai Post, Tirupur - 641 607.
          </p>
          <div className="text-sm text-gray-600 mt-2 space-y-1">
            <p>
              <span className="font-bold text-gray-800">Phone:</span> 89037 97913 / 63837 88930
            </p>
            <p>
              <span className="font-bold text-gray-800">Email:</span> anandinfo6383@gmail.com
            </p>
          </div>
        </div>

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

      <div className="grid grid-cols-3 gap-4 mb-10 text-sm">
        <div>
          <h3 className="font-bold text-red-600 mb-1 border-b border-red-100 pb-1 uppercase tracking-wider text-xs">Bill To</h3>
          <p className="font-semibold">{bill.client_name}</p>
          <p className="text-gray-500 mt-1">{bill.client_address || "Client Address Here"}</p>
        </div>
        <div>
          <h3 className="font-bold text-red-600 mb-1 border-b border-red-100 pb-1 uppercase tracking-wider text-xs">Ship To</h3>
          <p className="font-semibold">{bill.client_name}</p>
          <p className="text-gray-500 mt-1">{bill.shipping_address || "Shipping Address Here"}</p>
        </div>
        <div className="text-right space-y-1">
          <p>
            <span className="font-bold text-gray-800">Invoice #</span> <span className="text-red-600 font-medium">{bill.bill_no}</span>
          </p>
          <p>
            <span className="font-bold text-gray-800">Invoice Date</span> {bill.bill_date}
          </p>
        </div>
      </div>

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
              <td className="p-3 text-right">Rs. {Number(item.rate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              <td className="p-3 text-right font-bold text-gray-800">
                Rs. {Number(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
            <span>Rs. {Number(bill.grand_total).toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500 pb-2">
            <span>GST 12.0%</span>
            <span>Rs. {Number(bill.grand_total * 0.12).toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between font-black text-xl text-red-600 border-t-2 border-red-600 pt-3">
            <span>Total</span>
            <span>Rs. {Number(bill.grand_total).toLocaleString("en-IN")}</span>
          </div>
          <div className="pt-16">
            <p className="font-bold text-lg uppercase tracking-wide text-gray-800">Ananthan.V</p>
            <p className="text-xs text-gray-500 mb-1">Sales & Service</p>
            <div className="h-0.5 bg-[#2b2b2b] w-40 ml-auto mt-1"></div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mt-1">Authorized Signatory</p>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-red-500 rounded-full opacity-10 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-full h-16 bg-[#2b2b2b]" style={{ clipPath: "polygon(0 40%, 100% 0, 100% 100%, 0% 100%)" }}>
        <div className="absolute bottom-0 left-0 w-full h-8 bg-red-600" style={{ clipPath: "polygon(0 60%, 100% 0, 100% 100%, 0% 100%)" }}></div>
      </div>
    </div>
  );
};

export default Invoice;
