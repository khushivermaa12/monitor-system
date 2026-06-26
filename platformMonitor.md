# Platform Monitor
1) Create database Schema 
2) Create check function in backend to check all platform health after a period of time
3) Create a middleware and check if requested uri is under maintenance then store session id and uri in db and redirect to our web page
4) When the platform is up again the page will be redirected back to requested uri 
5)	Suppose we create a function which will check the status of platforms in every 30 sec. we create a middleware that will take uri as request and check status of it by calling checker function. If it is under maintenance then the uri is stored in db along with session id and redirect user to our web page. Using next() if the page is up after some time then the page is redirected to original uri

## Backend Architecture
backend/
    
    ├── server.js (starting point)
    ├── models/ (mongoDB schema)
        ├── Platform.js (platform schema)
        └── UserSession.js (user session schema)
    ├── services/ (business logic)
        └── healthCheck.js 
    ├── middleware/ 
        └── maintenanceMiddleware.js (decision maker)
    ├── routes/ (api routes)
        ├── platformRoutes.js (platform relatedrequests will be handled)
        └── statusRoutes.js (maintenance page will call this api)
    └── cron/
        └── monitorPlatforms.js (will run after every 30 sec)

## Database Schema
This schema will be written in platform model
``` javaScript 
const platformSchema = new mongoose.Schema({
	name: String,
	baseUrl: String,
	status: Boolean
});
```
This schema will be written in user session model
``` javaScript
const userSessionSchema = new mongoose.Schema({
	sessionId: String,
	uri: String,
	createdAt: {
	type: Date,
	default: Date.now
	}
});
```
## Health Check Function 
``` javaScript
Async function checkPlatform(url) {
Try {
	const response = await axios.get(url);
	return status===200;
}
Catch {
	return false;
}
```
## Maintenance Middleware
``` javaScript
if (!platform.status) {
	userSession.create({
	sessionId: req.sessionId,
	uri: req.originalUrl
})
return res.redirect(
    “/maintenance”
);
}
next();
``` 
## Platform API
``` javaScript
app.get (‘/platform’, middleware, (req,res) => {
	res.redirect(‘/platform’);
})
```
## Status API 
``` javaScript 
const user = await userSession.findOne({
	sessionId: req.sessionID
})
res.json({
Status: platformStatus ? “up”: “down”, 
Uri: user.uri
})
```
## Cron 
``` javaScript
cron.schedule(“*/30 *****”, async () => {
}
```
## Frontend Architecture 
frontend/

    ├── public/

    ├── src/

    ├── pages/
        ├── AdminMaintenance.jsx
        ├── UserMaintenance.jsx
        └── NotFound.jsx (error 404 route does not exist)
    ├── components/
        ├── LanguageSwitcher.jsx
        ├── MaintenanceCard.jsx
        └── Loader.jsx (to check if platform is back online)
    ├── services/
        └── statusService.js (calls backend API)
    ├── locales/ (language translation)
        ├── en/
            └── translation.json
        └── th/
            └── translation.json
    ├── i18n/ (multi language support)
        └── i18n.js
    ├── routes/
        └── AppRoutes.jsx
    ├── App.jsx
    └── main.jsx

## Admin Maintenance 
``` javaScript
function AdminMaintenance() {
  return (
    <MaintenanceCard
      title="Admin Portal"
      message="Portal is under maintenance"
    />
  );
}
```
## User Maintenance 
``` javaScript
function UserMaintenance() {
  return (
    <MaintenanceCard
      title="User Portal"
      message="Service is under maintenance"
    />
  );
}
```
## Maintenance Card
``` javaScript
function MaintenanceCard({
  title,
  message
}) {
  return (
    <>
      <h1>{title}</h1>
      <p>{message}</p>
    </>
  );
}
```
## Language Switcher
``` javaScript
function LanguageSwitcher() {
  const { i18n } = useTranslation();
  return (
    <div>
      <button onClick={() => i18n.changeLanguage("en")}>
        English
      </button>

      <button onClick={() => i18n.changeLanguage("th")}>
        ไทย
      </button>
    </div>
  );
}
```
## Loader
``` javaScript
import { useEffect } from "react";
function MaintenancePage() {
  useEffect(() => {
    const interval = setInterval(async () => {
     const response = await fetch(
        "/api/status"
      );
      const data = await response.json();
      if (data.status === "UP") {
        window.location.href =
          data.uri;
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);
}
export default MaintenancePage;
```
## i18n configuration
``` javaScript
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: en
    },
    th: {
      translation: th
    }
  },
  lng: "en"
});
```

