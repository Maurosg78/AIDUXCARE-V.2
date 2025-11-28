/**
 * Certificate Form Generator Component Tests
 * 
 * Integration tests for CertificateFormGenerator component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CertificateFormGenerator } from '../CertificateFormGenerator';
import type { SOAPNote } from '../../types/vertex-ai';
import type { Session } from '../../services/sessionComparisonService';

describe('CertificateFormGenerator', () => {
  let mockSOAPNote: SOAPNote;
  let mockSession: Session;
  let mockPatientData: any;
  let mockProfessionalData: any;
  let mockOnGenerate: ReturnType<typeof vi.fn>;
  let mockOnClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSOAPNote = {
      subjective: 'Patient reports lower back pain for the past 2 weeks. Unable to work due to pain.',
      objective: 'Limited range of motion in lumbar spine. Muscle spasm.',
      assessment: 'Lumbar strain. Recovery expected with treatment.',
      plan: 'Manual therapy 2x per week. Avoid heavy lifting. Return to work assessment in 2 weeks.',
    };

    mockSession = {
      id: 'session-123',
      patientId: 'patient-123',
      patientName: 'Jane Smith',
      timestamp: new Date('2024-01-15'),
      soapNote: mockSOAPNote,
      status: 'completed',
    };

    mockPatientData = {
      name: 'Jane Smith',
      dateOfBirth: new Date('1985-03-20'),
      address: '789 Oak Street',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M5H 4K5',
      phone: '416-555-9876',
      occupation: 'Warehouse Worker',
      employerName: 'ABC Logistics',
    };

    mockProfessionalData = {
      name: 'Dr. John Doe',
      registrationNumber: 'ON-67890',
      clinicName: 'Toronto Physiotherapy Clinic',
      clinicAddress: '456 Clinic Avenue',
      clinicCity: 'Toronto',
      clinicProvince: 'ON',
      clinicPostalCode: 'M5H 3K4',
      phone: '416-555-5678',
      email: 'john.doe@clinic.com',
    };

    mockOnGenerate = vi.fn();
    mockOnClose = vi.fn();
  });

  it('should render certificate form generator', () => {
    render(
      <CertificateFormGenerator
        soapNote={mockSOAPNote}
        session={mockSession}
        patientData={mockPatientData}
        professionalData={mockProfessionalData}
        onGenerate={mockOnGenerate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Medical Certificate Generator')).toBeInTheDocument();
  });

  it('should display certificate type options', () => {
    render(
      <CertificateFormGenerator
        soapNote={mockSOAPNote}
        session={mockSession}
        patientData={mockPatientData}
        professionalData={mockProfessionalData}
      />
    );

    expect(screen.getByText('Medical Certificate')).toBeInTheDocument();
    expect(screen.getByText('Return-to-Work Certificate')).toBeInTheDocument();
    expect(screen.getByText('Fitness-to-Work Certificate')).toBeInTheDocument();
    expect(screen.getByText('Disability Certificate')).toBeInTheDocument();
    expect(screen.getByText('Accommodation Certificate')).toBeInTheDocument();
  });

  it('should allow selecting different certificate types', async () => {
    const user = userEvent.setup();
    
    render(
      <CertificateFormGenerator
        soapNote={mockSOAPNote}
        session={mockSession}
        patientData={mockPatientData}
        professionalData={mockProfessionalData}
      />
    );

    const returnToWorkButton = screen.getByText('Return-to-Work Certificate');
    await user.click(returnToWorkButton);

    await waitFor(() => {
      expect(screen.getByText('Form Data Preview')).toBeInTheDocument();
    });
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <CertificateFormGenerator
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
});

