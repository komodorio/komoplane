import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import {BrowserRouter} from 'react-router-dom';

// Handle browser extension errors gracefully
window.addEventListener('unhandledrejection', (event) => {
    // Suppress common browser extension errors
    if (event.reason?.message?.includes('message channel closed') || 
        event.reason?.message?.includes('listener indicated an asynchronous response')) {
        event.preventDefault();
        console.debug('Suppressed browser extension error:', event.reason);
    }
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
 
    <BrowserRouter>
          <App />
    </BrowserRouter>

)
