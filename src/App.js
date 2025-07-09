import './App.css';
import Home from './pages/Home';
import EliteChat from './pages/Chat';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import "./index.css"
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<EliteChat />} />
      </Routes>
    </Router>
  );
}

export default App;