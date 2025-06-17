# RunAsOne 🏃‍♂️

Backend FastAPI per condividere attività Strava all'interno di un gruppo.

## ⚙️ Setup

1. Crea file `.env` basato su `.env.example`
2. Crea una app Strava su [https://www.strava.com/settings/api](https://www.strava.com/settings/api)
3. Installa dipendenze

```bash
pip install -r requirements.txt

// TODO
Gestione HttpOnly cookie invece del solo localStorage
Gestione Refresh Token interno e di Strava