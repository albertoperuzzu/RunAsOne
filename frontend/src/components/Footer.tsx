import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-4 bg-gray-100 flex justify-center space-x-8 fixed bottom-0">
      <a
        href="/privacy.html"
        //target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        Privacy Policy
      </a>
      <a
        href="/terms.html"
        //target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        Terms & Conditions
      </a>
    </footer>
  );
};

export default Footer;