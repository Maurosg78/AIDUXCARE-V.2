/* @ts-nocheck */
import React from 'react';
import { NoteError } from '@/core/notes/notesRepo';

type State = { hasError: boolean; message?: string };

function mapErrorToMessage(err: any): string {
  const code = err?.code ?? err?.message ?? String(err);
  switch (code) {
    case 'ERR_NOTE_NOT_FOUND':
    case 'NOT_FOUND':
      return 'Note could not be found';
    case 'ERR_NOTE_IMMUTABLE':
    case NoteError.IMMUTABLE:
    case 'IMMUTABLE':
      return 'This note is signed and cannot be edited';
    case 'ERR_INVALID_STATUS':
    case NoteError.INVALID_STATUS:
    case 'INVALID_STATUS':
      return 'Invalid note status';
    case 'ERR_UNAUTHORIZED':
    case NoteError.UNAUTHORIZED:
    case 'UNAUTHORIZED':
      return "You don't have permission to modify this note";
    default:
      return 'Something went wrong in Notes';
  }
}

export default class NotesErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: mapErrorToMessage(error) };
  }

  componentDidCatch(error: unknown) {
    // Loguea sin SOAP
    console.error('[Notes] Error', { error: String((error as any)?.message ?? error) });
  }

  handleRetry = () => this.setState({ hasError: false, message: undefined });

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert">
          <p>{this.state.message}</p>
          <button type="button" onClick={this.handleRetry}>Try again</button>
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}
