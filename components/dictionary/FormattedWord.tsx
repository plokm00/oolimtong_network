import React from "react";

interface FormattedWordProps {
  word: string;
}

export default function FormattedWord({ word }: FormattedWordProps) {
  const connectorIndex = word.indexOf("의 ");

  if (connectorIndex <= 0) return <>{word}</>;

  return (
    <>
      <span>{word.slice(0, connectorIndex)}</span>
      <span className="word-relation-connector">의</span>
      <span>{word.slice(connectorIndex + 2)}</span>
    </>
  );
}
