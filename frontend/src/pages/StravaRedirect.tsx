import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function StravaRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkStravaAuth = async () => {
      try {
        // Optional: puoi fare una chiamata per verificare il token
        // oppure semplicemente attendere un attimo
        await new Promise(resolve => setTimeout(resolve, 1000));
        navigate("/activities", { replace: true });
      } catch (err) {
        console.error("Errore nel redirect da Strava:", err);
        navigate("/", { replace: true }); // torna alla landing
      }
    };

    checkStravaAuth();
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-gray-800">
      <p className="text-lg font-medium mb-4">Accesso in corso...</p>
      <p className="text-sm text-gray-500">Attendere qualche secondo</p>
    </div>
  );
}

export default StravaRedirect;