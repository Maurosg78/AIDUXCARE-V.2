import { render, screen, fireEvent } from "@testing-library/react";
import AgentSuggestionItem from "../AgentSuggestionItem";

describe("AgentSuggestionItem", () => {
  const mockProps = {
    suggestion: {
      id: "suggestion-1",
      type: "recommendation" as const,
      content: "Test suggestion content",
      sourceBlockId: "block-1",
      field: "diagnosis",
    },
    isIntegrated: false,
    onAccept: jest.fn(),
    onReject: jest.fn(),
    onFeedback: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("debe renderizar correctamente la sugerencia", () => {
    render(<AgentSuggestionItem {...mockProps} />);

    expect(screen.getByText("Test suggestion content")).toBeInTheDocument();
    expect(screen.getByText("Recomendación")).toBeInTheDocument();
  });

  it("debe mostrar el estado integrado cuando isIntegrated es true", () => {
    render(<AgentSuggestionItem {...mockProps} isIntegrated={true} />);

    expect(screen.getByText("Integrado")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /aceptar/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /rechazar/i }),
    ).not.toBeInTheDocument();
  });

  it("debe llamar a onAccept cuando se acepta la sugerencia", () => {
    render(<AgentSuggestionItem {...mockProps} />);

    const acceptButton = screen.getByRole("button", { name: /aceptar/i });
    fireEvent.click(acceptButton);

    expect(mockProps.onAccept).toHaveBeenCalledWith(mockProps.suggestion);
  });

  it("debe llamar a onReject cuando se rechaza la sugerencia", () => {
    render(<AgentSuggestionItem {...mockProps} />);

    const rejectButton = screen.getByRole("button", { name: /rechazar/i });
    fireEvent.click(rejectButton);

    expect(mockProps.onReject).toHaveBeenCalledWith(mockProps.suggestion);
  });

  it("debe llamar a onFeedback cuando se solicita retroalimentación", () => {
    render(<AgentSuggestionItem {...mockProps} />);

    const feedbackButton = screen.getByRole("button", {
      name: /retroalimentación/i,
    });
    fireEvent.click(feedbackButton);

    expect(mockProps.onFeedback).toHaveBeenCalledWith(mockProps.suggestion);
  });

  it("debe tener atributos ARIA correctos", () => {
    render(<AgentSuggestionItem {...mockProps} />);

    const item = screen.getByRole("article");
    expect(item).toHaveAttribute("aria-label", "Sugerencia de diagnóstico");

    const acceptButton = screen.getByRole("button", { name: /aceptar/i });
    expect(acceptButton).toHaveAttribute("aria-label", "Aceptar sugerencia");

    const rejectButton = screen.getByRole("button", { name: /rechazar/i });
    expect(rejectButton).toHaveAttribute("aria-label", "Rechazar sugerencia");

    const feedbackButton = screen.getByRole("button", {
      name: /retroalimentación/i,
    });
    expect(feedbackButton).toHaveAttribute(
      "aria-label",
      "Dar retroalimentación",
    );
  });

  it("debe mostrar diferentes tipos de sugerencias correctamente", () => {
    const warningProps = {
      ...mockProps,
      suggestion: {
        ...mockProps.suggestion,
        type: "warning" as const,
      },
    };

    const { rerender } = render(<AgentSuggestionItem {...warningProps} />);
    expect(screen.getByText("Advertencia")).toBeInTheDocument();

    const infoProps = {
      ...mockProps,
      suggestion: {
        ...mockProps.suggestion,
        type: "info" as const,
      },
    };

    rerender(<AgentSuggestionItem {...infoProps} />);
    expect(screen.getByText("Información")).toBeInTheDocument();
  });
});
