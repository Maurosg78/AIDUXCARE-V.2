/**
 * MVA Form Generator Component Tests
 * 
 * Integration tests for MVAFormGenerator component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MVAFormGenerator } from '../MVAFormGenerator';
import type { SOAPNote } from '../../types/vertex-ai';
import type { Session } from '../../services/sessionComparisonService';

describe('MVAFormGenerator', () => {
  let mockSOAPNote: SOAPNote;
  let mockSession: Session;
  let mockPatientData: any;
  let mockProfessionalData: any;
  let mockInsuranceData: any;
  let mockOnGenerate: ReturnType<typeof vi.fn>;
  let mockOnClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSOAPNote = {
      subjective: 'Patient reports neck pain following motor vehicle accident. Rear-end collision.',
      objective: 'Limited range of motion in cervical spine. Positive Spurling test.',
      assessment: 'Whiplash-associated disorder. Cervical strain.',
      plan: 'Manual therapy 2x per week. Home exercise program.',
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
      dateOfAccident: new Date('2024-01-10'),
      mvaClaimNumber: 'MVA-789012',
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

    mockInsuranceData = {
      insuranceCompany: 'ABC Insurance',
      policyNumber: 'POL-123456',
      claimNumber: 'MVA-789012',
    };

    mockOnGenerate = vi.fn();
    mockOnClose = vi.fn();
  });

  it('should render MVA form generator', () => {
    render(
      <MVAFormGenerator
        soapNote={mockSOAPNote}
        session={mockSession}
        patientData={mockPatientData}
        professionalData={mockProfessionalData}
        insuranceData={mockInsuranceData}
        onGenerate={mockOnGenerate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('MVA Form Generator')).toBeInTheDocument();
  });

  it('should display form type options', () => {
    render(
      <MVAFormGenerator
        soapNote={mockSOAPNote}
        session={mockSession}
        patientData={mockPatientData}
        professionalData={mockProfessionalData}
        insuranceData={mockInsuranceData}
      />
    );

    expect(screen.getByText('Treatment Plan (OCF-18)')).toBeInTheDocument();
    expect(screen.getByText('Treatment Confirmation (OCF-19)')).toBeInTheDocument();
    expect(screen.getByText('Treatment Plan Update (OCF-23)')).toBeInTheDocument();
  });

  it('should allow selecting different form types', async () => {
    const user = userEvent.setup();
    
    render(
      <MVAFormGenerator
        soapNote={mockSOAPNote}
        session={mockSession}
        patientData={mockPatientData}
        professionalData={mockProfessionalData}
        insuranceData={mockInsuranceData}
      />
    );

    const treatmentConfirmationButton = screen.getByText('Treatment Confirmation (OCF-19)');
    await user.click(treatmentConfirmationButton);

    await waitFor(() => {
      expect(screen.getByText('Form Data Preview')).toBeInTheDocument();
    });
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <MVAFormGenerator
        soapNote={mockSOAPNote}
        session={mockSession}
        patientData={mockPatientData}
        professionalData={mockProfessionalData}
        insuranceData={mockInsuranceData}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByLabelText('Close');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});

