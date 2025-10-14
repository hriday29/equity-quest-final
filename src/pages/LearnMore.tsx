import React from "react";
import { motion } from "framer-motion";

const LearnMore = () => (
  <div className="min-h-screen bg-black text-neutral-200 antialiased flex flex-col items-center justify-center px-4 py-24">
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -32 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="max-w-3xl w-full bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl p-10 shadow-lg"
    >
      <h1 className="text-4xl font-bold text-primary mb-6 text-center">Learn More About Equity Quest</h1>
      <p className="mb-6 text-lg text-neutral-400 text-center">Equity Quest is a high-stakes mock trading platform designed for aspiring investors, students, and finance enthusiasts. Our mission is to provide a realistic, competitive, and educational environment where you can test your trading skills without risking real money.</p>
      <h2 className="text-2xl font-semibold mt-8 mb-2">Key Features</h2>
      <ul className="list-disc pl-6 mb-6 text-neutral-300">
        <li className="mb-2"><span className="text-primary font-semibold">Live Price Simulation:</span> Experience real-time price action and volatility, powered by dynamic data and narrative-driven events.</li>
        <li className="mb-2"><span className="text-primary font-semibold">Risk & Margin Protocols:</span> Trade with market, limit, and stop-loss orders, and receive margin alerts to manage your exposure.</li>
        <li className="mb-2"><span className="text-primary font-semibold">Performance Analytics:</span> Track your risk-adjusted returns using advanced metrics like the Sortino Ratio.</li>
        <li className="mb-2"><span className="text-primary font-semibold">Leaderboard Competition:</span> Climb the ranks and prove your skills against other participants in a fair, transparent environment.</li>
        <li className="mb-2"><span className="text-primary font-semibold">Dynamic News Flow:</span> React to simulated news and market-moving events that test your adaptability and strategy.</li>
      </ul>
      <h2 className="text-2xl font-semibold mt-8 mb-2">Who Can Participate?</h2>
      <p className="mb-6 text-neutral-300">Equity Quest is open to all who want to learn, compete, and grow as investors. Whether you are a beginner or a seasoned trader, our platform offers challenges and learning opportunities for everyone.</p>
      <h2 className="text-2xl font-semibold mt-8 mb-2">Why Mock Trading?</h2>
      <p className="mb-6 text-neutral-300">Mock trading allows you to experiment with strategies, understand market dynamics, and build confidence—all without financial risk. It’s the perfect way to prepare for real-world investing.</p>
      <h2 className="text-2xl font-semibold mt-8 mb-2">Contact & Support</h2>
      <p className="mb-2 text-neutral-300">Have questions or need help? Reach out to us at <a href="mailto:support@equityquest.com" className="text-primary underline">support@equityquest.com</a>.</p>
    </motion.div>
  </div>
);

export default LearnMore;
