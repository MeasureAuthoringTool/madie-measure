import React, { useState } from "react";
import CodesSectionNavTabs from "./CodesSectionNavTabs";
import CodeSubTabSection from "./codesSubTabs/codeSubTab/CodeSubTabSection";
import AppliedSubTabSection from "./codesSubTabs/appliedSubTab/AppliedSubTabSection";

export default function CodesSection() {
  const [activeTab, setActiveTab] = useState<string>("codeSystems");
  return (
    <>
      <CodesSectionNavTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      <div style={{ marginTop: "20px" }}>
        {activeTab === "codeSystems" && "Code Systems Section"}
        {activeTab === "code" && <CodeSubTabSection />}
        {activeTab === "applied" && <AppliedSubTabSection />}
      </div>
    </>
  );
}
