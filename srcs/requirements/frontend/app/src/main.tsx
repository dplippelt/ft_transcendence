import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.scss'
import App from './App.tsx'
import SettingsProvider from './contexts/SettingsContext.tsx'

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<SettingsProvider>
			<App />
		</SettingsProvider>
	</StrictMode>,
)
