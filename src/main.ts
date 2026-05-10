import './styles.css';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('#app not found');
app.textContent = 'Booting…';
