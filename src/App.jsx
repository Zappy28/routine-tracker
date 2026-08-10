import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";

import Home from "./pages/Home";
import History from "./pages/History";
import Settings from "./pages/Settings";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {

    return (

        <BrowserRouter>

            <Layout>

                <Routes>

                    <Route path="/login" element={<Login />} />

                    <Route path="/register" element={<Register />} />

                    {/* Auth-gated but NOT onboarding-gated, or it would
                        redirect to itself forever. */}
                    <Route
                        path="/onboarding"
                        element={
                            <ProtectedRoute requireOnboarding={false}>
                                <Onboarding />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <Home />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/history"
                        element={
                            <ProtectedRoute>
                                <History />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/settings"
                        element={
                            <ProtectedRoute>
                                <Settings />
                            </ProtectedRoute>
                        }
                    />

                </Routes>

            </Layout>

        </BrowserRouter>

    );

}

export default App;