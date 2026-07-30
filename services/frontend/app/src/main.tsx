import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.scss'
import App from './App.tsx'
import AppProviders from './contexts/AppProviders.tsx'
import { GoogleOAuthProvider } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID)
	throw new Error("VITE_GOOGLE_CLIENT_ID is not configured");

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <GoogleOAuthProvider
            clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
            locale="en"
        >
			<AppProviders>
				<App/>
			</AppProviders>
		</GoogleOAuthProvider>
	</StrictMode>,
);
