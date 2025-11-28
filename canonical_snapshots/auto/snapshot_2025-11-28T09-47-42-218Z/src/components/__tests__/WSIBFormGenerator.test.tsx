/**
 * WSIB Form Generator Component Tests
 * 
 * Integration tests for WSIBFormGenerator component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WSIBFormGenerator } from '../WSIBFormGenerator';
import type { SOAPNote } from '../../types/vertex-ai';
import type { Session } from '../../services/sessionComparisonService';

describe('WSIBFormGenerator', () => {
  let mockSOAPNote: SOAPNote;
  let mockSession: Session;
  let mockPatientData: any;
  let mockProfessionalData: any;
  let mockOnGenerate: ReturnType<typeof vi.fn>;
  let mockOnClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSOAPNote = {
      subjective: 'Patient reports lower back pain following workplace injury. Lifting heavy boxes.',
      objective: 'Limited range of motion in lumbar spine. Positive straight leg raise test.',
      assessment: 'Lumbar strain. Work-related injury.',
      plan: 'Manual therapy 2x per week. Avoid heavy lifting.',
    };

    mockSession = {
      id: 'session-123',
      patientId: 'patient-123',
      patientName: 'John Doe',
      timestamp: new Date('2024-01-15'),
      soapNote: mockSOAPNote,
      status: 'completed',
    };

    mockPatientData = {
      name: 'John Doe',
      dateOfBirth: new Date('1980-05-15'),
      address: '123 Main Street',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M5H 2N2',
      phone: '416-555-1234',
      wsibClaimNumber: 'WSIB-123456',
    };

    mockProfessionalData = {
      name: 'Dr. Jane Smith',
      registrationNumber: 'ON-12345',
      clinicName: 'Toronto Physiotherapy Clinic',
      clinicAddress: '456 Clinic Avenue',
      clinicCity: 'Toronto',
      clinicProvince: 'ON',
      clinicPostalCode: 'M5H 3K4',
      phone: '416-555-5678',
      email: 'jane.smith@clinic.com',
    };

    mockOnGenerate = vi.fn();
    mockOnClose = vi.fn();
  });

  it('should render WSIB form generator', () => {
    render(
      <WSIBFormGenerator
        soapNote={mockSOAPNote}
        session={mockSession}
        patientData={mockPatientData}
        professionalData={mockProfessionalData}
        onGenerate={mockOnGenerate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('WSIB Form Generator')).toBeInTheDocument();
  });

  it('should display form type options', () => {
    render(
      <WSIBFormGenerator
        soapNote={mockSOAPNote}
        session={mockSession}
        patientData={mockPatientData}
        professionalData={mockProfessionalData}
      />
    );

    expect(screen.getByText('Functional Abilities Form (FAF-8)')).toBeInTheDocument();
    expect(screen.getByText('Treatment Plan')).toBeInTheDocument();
    expect(screen.getByText('Progress Report')).toBeInTheDocument();
  });

  it('should allow selecting different form types', async () => {
    const user = userEvent.setup();
    
    render(
      <WSIBFormGenerator
        soapNote={mockSOAPNote}
        session={mockSession}
        patientData={mockPatientData}
        professionalData={mockProfessionalData}
      />
    );

    const treatmentPlanButton = screen.getByText('Treatment Plan');
    await user.click(treatmentPlanButton);

    // Form should update to show treatment plan data
    await waitFor(() => {
      expect(screen.getByText('Form Data Preview')).toBeInTheDocument();
    });
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <WSIBFormGenerator
        soapNote={mockSOAPNote}
        session={mockSession}
        patientData={mockPatientData}
        professionalData={mockProfessionalData}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByLabelText('Close');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should generate PDF when generate button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <WSIBFormGenerator
        soapNote={mockSOAPNote}
        session={mockSession}
        patientData={mockPatientData}
        professionalData={mockProfessionalData}
        onGenerate={mockOnGenerate}
      />
    );

    // Wait for form data to load
    await waitFor(() => {
      expect(screen.getByText('Generate & Download PDF')).toBeInTheDocument();
    });

    const generateButton = screen.getByText('Generate & Download PDF');
    await user.click(generateButton);

    // Wait for PDF generation
    await waitFor(() => {
      expect(mockOnGenerate).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
});

