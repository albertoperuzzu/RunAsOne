import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function CallbackPage() {
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      setError("Codice mancante nella callback di Strava.");
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:8000/exchange_token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        if (!res.ok) {
          throw new Error("Errore nello scambio del token");
        }

        const data = await res.json();
        console.log("Access token ricevuto!", data);

        // TODO: salva in uno state management o context se vuoi usare più avanti
        navigate("/activities");
      } catch (err) {
        setError("Errore durante il login con Strava");
        console.error(err);
      }
    };

    fetchData();
  }, [searchParams, navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-gray-800">
      <h2 className="text-2xl font-bold mb-4">Login in corso...</h2>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}

export default CallbackPage;