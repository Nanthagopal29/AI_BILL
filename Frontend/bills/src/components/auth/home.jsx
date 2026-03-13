import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, FilePlus, Eye, CreditCard } from "lucide-react"; // Using lucide-react for icons

const Home = () => {
  const navigate = useNavigate();

  // Animation Variants
  const containerVars = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } },
  };

  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 overflow-hidden">
      
      {/* Animated Background Elements */}
      <motion.div 
        animate={{ 
          x: [0, 100, 0], 
          y: [0, 50, 0],
          rotate: [0, 180, 360] 
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl"
      />
      <motion.div 
        animate={{ 
          x: [0, -80, 0], 
          y: [0, -100, 0] 
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl"
      />

      {/* Logout Button - Top Right */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-8 right-8 z-20"
      >
        <button 
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 bg-white/50 hover:bg-white backdrop-blur-sm rounded-full border border-gray-200 transition-all shadow-sm active:scale-95"
        >
          <LogOut size={18} />
          Logout
        </button>
      </motion.div>

      {/* Main Card */}
      <motion.div 
        variants={containerVars}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-lg w-full text-center space-y-8 bg-white/90 backdrop-blur-xl p-12 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white"
      >
        <header className="space-y-4">
          <motion.div variants={itemVars} className="flex justify-center">
            <div className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
              <CreditCard className="text-white w-8 h-8" />
            </div>
          </motion.div>
          
          <motion.h1 
            variants={itemVars}
            className="text-4xl font-black text-gray-900 tracking-tight"
          >
            Billing <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Dashboard</span>
          </motion.h1>
          
          <motion.p variants={itemVars} className="text-gray-500 text-lg">
            Streamline your financial records with ease.
          </motion.p>
        </header>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
          <motion.div variants={itemVars} whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }}>
            <Link to="/create_bills">
              <button className="group w-full flex flex-col items-center gap-3 p-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-blue-100">
                <FilePlus className="group-hover:rotate-12 transition-transform" />
                <span>Create Bills</span>
              </button>
            </Link>
          </motion.div>

          <motion.div variants={itemVars} whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }}>
            <Link to="/view_bills">
              <button className="group w-full flex flex-col items-center gap-3 p-6 bg-white border-2 border-gray-100 hover:border-blue-600 hover:text-blue-600 text-gray-700 font-bold rounded-2xl transition-all shadow-sm">
                <Eye className="group-hover:scale-110 transition-transform" />
                <span>View Bills</span>
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Quick Stats or Footer */}
        <motion.p variants={itemVars} className="text-xs text-gray-400 font-medium uppercase tracking-widest">
          Secure Cloud Storage Enabled
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Home;