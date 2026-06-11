import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.scss'
import App from './App.tsx'
import SettingsProvider from './contexts/SettingsContext.tsx'
import AccountProvider from './contexts/AccountContext.tsx'

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<AccountProvider>
			<SettingsProvider>
				<App />
			</SettingsProvider>
		</AccountProvider>
	</StrictMode>,
)
