import React, { useState } from "react";

const GenieFeaturesPage = () => {
  const [showModelDetails, setShowModelDetails] = useState(false);

  const toggleModelDetails = () => {
    setShowModelDetails(!showModelDetails);
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", textAlign: "center", color: "#333" }}>
      {/* Header */}
      <header style={{ backgroundColor: "indigo", color: "white", padding: "20px" }}>
        <h1>Learn More About GENIE</h1>
        <p>Explore the features of our AI-powered chatbot and tools.</p>
      </header>

      {/* Main Content */}
      <div style={{ padding: "20px" }}>
        {/* Chatbot Section */}
        <section
          style={{
            border: "2px solid pink",
            borderRadius: "10px",
            marginBottom: "20px",
            padding: "15px",
            backgroundColor: "#ffe4e1",
          }}
        >
          <h2 style={{ color: "purple" }}>Chatbot</h2>
          <p>The Chatbot feature enables users to:</p>
          <ul style={{ listStyleType: "none", padding: 0 }}>
            <li>Ask General Questions like using a search engine.</li>
            <li>Query Uploaded Documents for specific information.</li>
          </ul>
        </section>

        {/* Bottom Bar Section */}
        <section
          style={{
            border: "2px solid purple",
            borderRadius: "10px",
            marginBottom: "20px",
            padding: "15px",
            backgroundColor: "#e6e6fa",
          }}
        >
          <h2 style={{ color: "indigo" }}>Bottom Bar</h2>
          <ul style={{ listStyleType: "none", padding: 0 }}>
            <li>
              <strong>Smart Model:</strong> Automatically selects the best model for your query.
            </li>
            <li>
              Prefer customization? Manually select a model from the supported list.
            </li>
          </ul>
        </section>

        {/* Multi-Chat Playground Section */}
        <section
          style={{
            border: "2px solid indigo",
            borderRadius: "10px",
            marginBottom: "20px",
            padding: "15px",
            backgroundColor: "#f0f8ff",
          }}
        >
          <h2 style={{ color: "pink" }}>Multi-Chat Playground</h2>
          <p>Compare outputs from multiple models side by side.</p>
          <ul style={{ listStyleType: "none", padding: 0 }}>
            <li>Select a model for each panel.</li>
            <li>Choose a workspace or Basic Chat (No Workspace).</li>
            <li>Enter your question and compare outputs.</li>
          </ul>
          <button
            onClick={toggleModelDetails}
            style={{
              marginTop: "10px",
              padding: "10px 15px",
              backgroundColor: "purple",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            {showModelDetails ? "Hide Models" : "Learn More About the Models"}
          </button>
        </section>

        {/* Model Details Section */}
        {showModelDetails && (
          <section
            style={{
              border: "2px dashed indigo",
              borderRadius: "10px",
              marginBottom: "20px",
              padding: "15px",
              backgroundColor: "#f5f5f5",
            }}
          >
            <h2 style={{ color: "indigo" }}>Supported Models</h2>
            <ul style={{ listStyleType: "none", padding: 0 }}>
              <li>
                <strong>Claude Series by Anthropic:</strong> Advanced conversational AI with various versions like Claude 3.5 Sonnet and Claude 3 Haiku for improved reasoning and speed.
              </li>
              <li>
                <strong>Cohere Command Models:</strong> Versatile models for text generation, summarization, and more.
              </li>
              <li>
                <strong>LLaMA Series:</strong> Large language models fine-tuned for instruction following and detailed text generation.
              </li>
              <li>
                <strong>Mistral Models:</strong> Optimized for efficient and versatile text generation.
              </li>
              <li>
                <strong>Amazon Titan Text:</strong> High-quality text generation integrated seamlessly with AWS services.
              </li>
            </ul>
          </section>
        )}
      </div>

      {/* Footer */}
      <footer style={{ backgroundColor: "indigo", color: "white", padding: "10px" }}>
        <p>© 2024 GENIE AI Interface. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default GenieFeaturesPage;


