import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="bg-blue-600 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-white text-2xl">Tikee Neural</h1>
        <div>
          <Link to="/login" className="text-white mx-2 hover:underline">
            Login
          </Link>
          <Link to="/register" className="text-white mx-2 hover:underline">
            Register
          </Link>
          <Link to="/dashboard" className="text-white mx-2 hover:underline">
            Dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
