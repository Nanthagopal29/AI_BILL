import React from 'react';

const InvoiceTemplate = React.forwardRef(({ bill }, ref) => {
  if (!bill) return null;

  return (
    <div ref={ref} className="p-12 bg-white w-[210mm] min-h-[297mm] relative overflow-hidden font-sans text-gray-800 mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-4xl font-bold text-blue-600 italic">Anand InfoTech</h1>
          <p className="text-sm mt-2 text-gray-600">77 Namrata Bldg<br />Delhi, Delhi 400077</p>
        </div>
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 font-bold border-4 border-white shadow-sm">
          LOGO
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-3 gap-4 mb-10 text-sm">
        <div>
          <h3 className="font-bold text-blue-500 mb-1 border-b border-blue-100 pb-1">Bill To</h3>
          <p className="font-semibold">{bill.client_name}</p>
          <p className="text-gray-500">27, Dlf City, Gupta<br />Delhi, Delhi 40003</p>
        </div>
        <div>
          <h3 className="font-bold text-blue-500 mb-1 border-b border-blue-100 pb-1">Ship To</h3>
          <p className="font-semibold">{bill.client_name}</p>
          <p className="text-gray-500">264, Abdul Rehman<br />Mumbai, Bihar 40009</p>
        </div>
        <div className="text-right space-y-1">
          <p><span className="font-bold text-blue-500">Invoice #</span> {bill.bill_no}</p>
          <p><span className="font-bold text-blue-500">Invoice Date</span> {bill.bill_date}</p>
          {/* <p><span className="font-bold text-blue-500">P.O.#</span> 2430/2019</p>
          <p><span className="font-bold text-blue-500">Due Date</span> 26/04/2019</p> */}
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-10 border-collapse">
        <thead>
          <tr className="bg-blue-500 text-white">
            <th className="p-3 text-left">Qty</th>
            <th className="p-3 text-left">Description</th>
            <th className="p-3 text-right">Unit Price</th>
            <th className="p-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {bill.items?.map((item, i) => (
            <tr key={i} className="border-b border-gray-100 italic">
              <td className="p-3">{item.qty}</td>
              <td className="p-3">{item.description}</td>
              <td className="p-3 text-right">{item.rate}</td>
              <td className="p-3 text-right font-medium">{item.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Bottom Section */}
      <div className="flex justify-between items-end mt-10">
        <div className="text-sm">
          <h4 className="font-bold text-blue-500 mb-1">Terms & Conditions</h4>
          <p className="text-gray-500">Payment is due within 15 days</p>
          <div className="mt-6 text-xs text-gray-600">
            <p className="font-bold">State Bank of India</p>
            <p>Account Number: 12345678</p>
            <p>Routing Number: 09876543210</p>
          </div>
        </div>
        <div className="text-right w-1/3 space-y-2">
          <div className="flex justify-between text-sm border-b pb-1"><span>Subtotal</span> <span>{bill.grand_total}</span></div>
          <div className="flex justify-between text-sm"><span>GST 12.0%</span> <span>1,469.52</span></div>
          <div className="flex justify-between font-bold text-xl text-blue-600 border-t pt-2">
            <span>Invoice Total</span> <span>₹{bill.grand_total}</span>
          </div>
          <div className="pt-10">
             <p className="font-serif text-2xl italic">Priya Chopra</p>
             <div className="h-px bg-black w-32 ml-auto mt-1"></div>
          </div>
        </div>
      </div>

      {/* Decorative Wave Shapes */}
      <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-blue-400 rounded-full opacity-10 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-full h-24 bg-blue-600" style={{ clipPath: 'ellipse(100% 100% at 50% 100%)' }}></div>
    </div>
  );
});

export default InvoiceTemplate;