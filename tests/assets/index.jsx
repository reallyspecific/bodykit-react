import { createRoot } from 'react-dom/client';
import App from './app.jsx';
import "./css/reset.css";

const root = createRoot(document.getElementById('root'));
root.render(<App />);