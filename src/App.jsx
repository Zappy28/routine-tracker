import {BrowserRouter, Routes, Route} from "react-router-dom";

import Layout from "./components/Layout";

import Home from "./pages/Home";
import History from "./pages/History";
import Settings from "./pages/Settings";


function App(){

return (

<BrowserRouter>

<Layout>

<Routes>

<Route path="/" element={<Home/>}/>

<Route path="/history" element={<History/>}/>

<Route path="/settings" element={<Settings/>}/>

</Routes>

</Layout>

</BrowserRouter>

)

}


export default App;