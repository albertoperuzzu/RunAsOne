import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import CallbackPage from "./pages/CallbackPage"; // lo creeremo dopo
import ActivitiesPage from "./pages/ActivitiesPage"; // lo creeremo dopo

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/callback" element={<CallbackPage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
      </Routes>
    </Router>
  );
}

export default App;
