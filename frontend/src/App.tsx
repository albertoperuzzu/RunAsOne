import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import ActivitiesPage from "./pages/ActivitiesPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage.tsx";
import StravaRedirect from "./pages/StravaRedirect.tsx";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/strava-redirect" element={<StravaRedirect />} />
        <Route path="/home" element={ <PrivateRoute> 
            <HomePage /> 
          </PrivateRoute> }
        />
        <Route path="/activities" element={ <PrivateRoute> 
            <ActivitiesPage /> 
          </PrivateRoute> }
        />
      </Routes>
    </Router>
  );
}

export default App;
