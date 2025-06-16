import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import ActivitiesPage from "./pages/ActivitiesPage"; // lo creeremo dopo

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
      </Routes>
    </Router>
  );
}

export default App;
