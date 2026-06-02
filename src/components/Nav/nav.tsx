import { Link } from "react-router-dom";
import "./nav.css";

function Nav() {
    return (
        <header className="header">
            <div>Logo</div>
            <nav>
                <ul>
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/about">About</Link></li>
                    <li><Link to="/dashboard">Dashboard</Link></li>
                </ul>
            </nav>
        </header>
    );
}

export default Nav;