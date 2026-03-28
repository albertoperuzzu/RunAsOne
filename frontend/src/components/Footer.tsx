import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-3 glass-dark flex justify-center space-x-8 fixed bottom-0">
      <a
        href="/privacy.html"
        rel="noopener noreferrer"
        className="text-white/70 hover:text-white text-sm hover:underline"
      >
        Privacy Policy
      </a>
      <a
        href="/terms.html"
        rel="noopener noreferrer"
        className="text-white/70 hover:text-white text-sm hover:underline"
      >
        Terms & Conditions
      </a>
    </footer>
  );
};

export default Footer;
