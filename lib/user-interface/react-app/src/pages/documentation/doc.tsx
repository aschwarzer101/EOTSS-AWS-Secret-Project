import React from "react";

const FeaturesOfGenie: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 min-h-screen text-white p-8 font-sans">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold underline decoration-pink-300">Welcome to GENIE</h1>
        <p className="mt-4 text-lg">Your AI-powered assistant for productivity and insights.</p>
      </header>

      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-4">🔹 Chatbot Features</h2>
        <ul className="list-disc pl-8 space-y-2">
          <li>
            <strong className="text-pink-300">Ask Questions:</strong> Type any question to get answers, just like a search engine.
          </li>
          <li>
            <strong className="text-pink-300">Document Insights:</strong> Upload files and query specific information within them.
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-4">🔹 Bottom Bar Navigation</h2>
        <ul className="list-disc pl-8 space-y-2">
          <li>
            <strong>Smart Model:</strong> Automatically picks the best AI model for your queries, with manual selection options.
          </li>
          <li>
            <strong>Basic Chat:</strong> Use this mode without selecting a workspace for general queries.
          </li>
          <li>
            <strong>Workspaces:</strong> Access files by selecting the workspace where they were uploaded.
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-4">🔹 Uploading Documents</h2>
        <p className="mb-4">Upload files to query them in the chatbot:</p>
        <ol className="list-decimal pl-8 space-y-2">
          <li>Click <strong className="text-pink-300">“Upload Document.”</strong></li>
          <li>Choose <strong className="text-pink-300">“Upload Files.”</strong></li>
          <li>Select the file(s) you want to upload.</li>
          <li>Navigate to the Chatbot and select the related workspace.</li>
          <li>Ask your questions about the uploaded document(s).</li>
        </ol>
        <p className="mt-4">
          <strong>Workspaces:</strong> Think of them as folders where your uploaded files are stored for easy access.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-4">🔹 Multi-Chat Playground</h2>
        <p className="mb-4">Compare responses from different AI models side by side:</p>
        <ol className="list-decimal pl-8 space-y-2">
          <li>Select models for each panel.</li>
          <li>Choose a workspace or use Basic Chat mode.</li>
          <li>Enter your question.</li>
          <li>Compare the results across models.</li>
          <li>Add more panels with <strong className="text-pink-300">“Add Model.”</strong></li>
        </ol>
      </section>

      <footer className="text-center mt-12">
        <p className="text-sm">
          Explore <span className="text-pink-300">video tutorials</span> and <span className="text-pink-300">resources</span> for more tips.
        </p>
      </footer>
    </div>
  );
};

export default FeaturesOfGenie;
