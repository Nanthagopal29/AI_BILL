import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Home = () => {
  // Animation Variants
  const containerVars = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2, // Buttons appear one after another
      },
    },
  };

  const itemVars = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Animated Background Decor */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -top-24 -right-24 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50"
      />
      
      <motion.div 
        variants={containerVars}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-md w-full text-center space-y-8 bg-white/80 backdrop-blur-md p-10 rounded-2xl shadow-2xl border border-white"
      >
        <header>
          <motion.h1 
            variants={itemVars}
            className="text-4xl font-extrabold text-gray-900 tracking-tight"
          >
            Billing <span className="text-blue-600">Dashboard</span>
          </motion.h1>
          
          <motion.p variants={itemVars} className="mt-2 text-gray-500">
            Manage your invoices and billing records efficiently.
          </motion.p>
        </header>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <motion.div variants={itemVars} className="w-full" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link to="/create_bills">
              <button className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-200">
                Create Bills
              </button>
            </Link>
          </motion.div>

          <motion.div variants={itemVars} className="w-full" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link to="/view_bills">
              <button className="w-full px-6 py-3 bg-white border-2 border-gray-100 hover:border-blue-600 hover:text-blue-600 text-gray-700 font-semibold rounded-xl transition-all shadow-sm">
                View Bills
              </button>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;