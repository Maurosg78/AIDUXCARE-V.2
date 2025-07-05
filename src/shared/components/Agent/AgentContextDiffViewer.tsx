import React, { useState } from "react";
import { MCPContext } from "@/core/mcp/schema";

interface Block {
  id: string;
  type: "contextual" | "persistent" | "semantic";
  content: string;
  timestamp?: string;
  created_at?: string;
  validated?: boolean;
}

interface Props {
  previousContext: MCPContext;
  currentContext: MCPContext;
}

const AgentContextDiffViewer: React.FC<Props> = ({
  previousContext,
  currentContext,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {
      contextual: true,
      persistent: true,
      semantic: true,
    },
  );

  const toggleGroup = (groupType: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupType]: !prev[groupType],
    }));
  };

  const renderBlock = (
    block: Block,
    type: "added" | "modified" | "unchanged",
    isOriginal: boolean = false,
  ) => {
    const baseClasses = "p-3 rounded-md text-sm";
    const typeClasses = {
      added: "bg-green-50 border border-green-200",
      modified: "bg-yellow-50 border border-yellow-200",
      unchanged: "bg-gray-50 border border-gray-200",
    };

    return (
      <div
        key={`${block.id}-${type}-${isOriginal ? "original" : "modified"}`}
        data-testid={`diff-block-${type}`}
        className={`${baseClasses} ${typeClasses[type]}`}
      >
        {block.content}
      </div>
    );
  };

  const renderGroup = (groupType: "contextual" | "persistent" | "semantic") => {
    const previousBlocks = previousContext[groupType]?.data || [];
    const currentBlocks = currentContext[groupType]?.data || [];

    if (currentBlocks.length === 0) return null;

    const isExpanded = expandedGroups[groupType];

    return (
      <div
        role="group"
        aria-labelledby={`${groupType}-header`}
        className="mb-4"
      >
        <button
          onClick={() => toggleGroup(groupType)}
          className="w-full text-left font-semibold mb-2 flex items-center justify-between"
          aria-label={`${isExpanded ? "Colapsar" : "Expandir"} sección ${groupType}`}
        >
          <span id={`${groupType}-header`}>
            {groupType} ({currentBlocks.length})
          </span>
          <span className="material-icons text-sm">
            {isExpanded ? "expand_less" : "expand_more"}
          </span>
        </button>

        {isExpanded && (
          <div className="space-y-2">
            {currentBlocks.map((block) => {
              const previousBlock = previousBlocks.find(
                (b) => b.id === block.id,
              );

              if (!previousBlock) {
                return renderBlock(block, "added");
              }

              if (previousBlock.content !== block.content) {
                return (
                  <div key={`${block.id}-modified-group`} className="space-y-2">
                    {renderBlock(previousBlock, "modified", true)}
                    {renderBlock(block, "modified", false)}
                  </div>
                );
              }

              return renderBlock(block, "unchanged");
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderGroup("contextual")}
      {renderGroup("persistent")}
      {renderGroup("semantic")}
    </div>
  );
};

export default AgentContextDiffViewer;
