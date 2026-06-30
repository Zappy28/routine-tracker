import { Link } from "react-router-dom";


function Navbar(){


return (

<nav>

<Link to="/">
Home
</Link>


<Link to="/history">
History
</Link>


<Link to="/settings">
Settings
</Link>


</nav>

)

}


export default Navbar;