import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

import Login from "./components/auth/login";
import Home from "./components/auth/home";
import Create from "./components/dash/create"
import View from "./components/dash/view"



const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="home/" element = { <Home /> } />
        <Route path="create_bills" element={ <Create />} />
        <Route path="view_bills" element= { <View />} />
      </Routes>
    </Router>
  );
};

export default App;