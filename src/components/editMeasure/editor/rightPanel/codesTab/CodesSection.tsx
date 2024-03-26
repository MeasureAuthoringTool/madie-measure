import React, { useState } from "react";
import CodesSectionNavTabs from "./CodesSectionNavTabs";
import CodeSubTab from "./codesSubTabs/codeSubTab/CodeSubTab";
import AppliedSection from "./codesSubTabs/appliedSubTab/AppliedSection";

export default function CodesSection() {
  const [activeTab, setActiveTab] = useState<string>("codeSystems");
  return (
    <>
      <CodesSectionNavTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      <div style={{ marginTop: "20px" }}>
        {activeTab === "codeSystems" && "Code Systems Section"}
        {activeTab === "code" && <CodeSubTab />}
        {activeTab === "applied" && <AppliedSection />}
      </div>
    </>
  );
}
