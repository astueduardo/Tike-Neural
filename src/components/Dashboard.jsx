import React from "react";
import AIInterface from "../components/AIInterface";
import Navbar from "./Navbar";

function Dashboard() {
    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            <div className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-4 text-center">
                    Tikee Neural Dashboard
                </h1>
                <AIInterface />
            </div>
        </div>
    );
}

export default Dashboard;