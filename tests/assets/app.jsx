import * as styles from "./css/app.module.css";

function MyButton() {
    const handleClick = () => {
        alert('Button clicked!');
    };
    return (
        <button className={styles.button} onClick={handleClick}>
            Don't click me!
        </button>
    );
}

export default function App() {
    return (
        <div className={styles.app}>
            <h1 className={styles.title}>Welcome to my app</h1>
            <MyButton />
        </div>
    );
}