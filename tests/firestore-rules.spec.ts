import { initializeTestEnvironment, RulesTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

const PROJECT_ID = 'aiduxcare-v2-uat-dev';

describe('Firestore Security Rules', () => {
  let testEnv: RulesTestEnvironment;
  let db: any;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: require('../../firestore.rules'),
        host: 'localhost',
        port: 8080,
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    db = testEnv.authenticatedContext('user1').firestore();
  });

  describe('Patients Collection', () => {
    const patientData = {
      ownerUid: 'user1',
      firstName: 'John',
      lastName: 'Doe',
      status: 'active',
      createdAt: new Date(),
    };

    it('should allow owner to create patient', async () => {
      const patientRef = doc(db, 'patients', 'patient1');
      await assertSucceeds(setDoc(patientRef, patientData));
    });

    it('should allow owner to read their patient', async () => {
      const patientRef = doc(db, 'patients', 'patient1');
      await setDoc(patientRef, patientData);
      await assertSucceeds(getDoc(patientRef));
    });

    it('should allow owner to update their patient', async () => {
      const patientRef = doc(db, 'patients', 'patient1');
      await setDoc(patientRef, patientData);
      await assertSucceeds(updateDoc(patientRef, { firstName: 'Jane' }));
    });

    it('should not allow other user to read patient', async () => {
      const patientRef = doc(db, 'patients', 'patient1');
      await setDoc(patientRef, patientData);
      
      const otherDb = testEnv.authenticatedContext('user2').firestore();
      await assertFails(getDoc(doc(otherDb, 'patients', 'patient1')));
    });

    it('should not allow other user to update patient', async () => {
      const patientRef = doc(db, 'patients', 'patient1');
      await setDoc(patientRef, patientData);
      
      const otherDb = testEnv.authenticatedContext('user2').firestore();
      await assertFails(updateDoc(doc(otherDb, 'patients', 'patient1'), { firstName: 'Jane' }));
    });
  });

  describe('Appointments Collection', () => {
    const appointmentData = {
      clinicianUid: 'user1',
      patientId: 'patient1',
      date: new Date(),
      status: 'scheduled',
      createdAt: new Date(),
    };

    it('should allow clinician to create appointment', async () => {
      const appointmentRef = doc(db, 'appointments', 'appointment1');
      await assertSucceeds(setDoc(appointmentRef, appointmentData));
    });

    it('should allow clinician to read their appointment', async () => {
      const appointmentRef = doc(db, 'appointments', 'appointment1');
      await setDoc(appointmentRef, appointmentData);
      await assertSucceeds(getDoc(appointmentRef));
    });

    it('should not allow other user to read appointment', async () => {
      const appointmentRef = doc(db, 'appointments', 'appointment1');
      await setDoc(appointmentRef, appointmentData);
      
      const otherDb = testEnv.authenticatedContext('user2').firestore();
      await assertFails(getDoc(doc(otherDb, 'appointments', 'appointment1')));
    });
  });

  describe('Reports Collection', () => {
    const reportData = {
      authorUid: 'user1',
      patientId: 'patient1',
      status: 'draft',
      content: 'Test report',
      createdAt: new Date(),
    };

    it('should allow author to create report', async () => {
      const reportRef = doc(db, 'reports', 'report1');
      await assertSucceeds(setDoc(reportRef, reportData));
    });

    it('should allow author to read their report', async () => {
      const reportRef = doc(db, 'reports', 'report1');
      await setDoc(reportRef, reportData);
      await assertSucceeds(getDoc(reportRef));
    });

    it('should not allow other user to read report', async () => {
      const reportRef = doc(db, 'reports', 'report1');
      await setDoc(reportRef, reportData);
      
      const otherDb = testEnv.authenticatedContext('user2').firestore();
      await assertFails(getDoc(doc(otherDb, 'reports', 'report1')));
    });
  });

  describe('Admin Access', () => {
    beforeEach(async () => {
      // Crear usuario admin
      const adminUser = testEnv.authenticatedContext('admin');
      const adminDb = adminUser.firestore();
      await setDoc(doc(adminDb, 'users', 'admin'), {
        role: 'admin',
        email: 'admin@test.com',
        createdAt: new Date(),
      });
    });

    it('should allow admin to read any patient', async () => {
      // Crear paciente como user1
      const patientRef = doc(db, 'patients', 'patient1');
      await setDoc(patientRef, {
        ownerUid: 'user1',
        firstName: 'John',
        lastName: 'Doe',
        status: 'active',
        createdAt: new Date(),
      });

      // Admin debería poder leer
      const adminDb = testEnv.authenticatedContext('admin').firestore();
      await assertSucceeds(getDoc(doc(adminDb, 'patients', 'patient1')));
    });

    it('should allow admin to update any patient', async () => {
      // Crear paciente como user1
      const patientRef = doc(db, 'patients', 'patient1');
      await setDoc(patientRef, {
        ownerUid: 'user1',
        firstName: 'John',
        lastName: 'Doe',
        status: 'active',
        createdAt: new Date(),
      });

      // Admin debería poder actualizar
      const adminDb = testEnv.authenticatedContext('admin').firestore();
      await assertSucceeds(updateDoc(doc(adminDb, 'patients', 'patient1'), { firstName: 'Jane' }));
    });
  });

  describe('Unauthenticated Access', () => {
    it('should not allow unauthenticated user to read patients', async () => {
      const unauthenticatedDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(getDoc(doc(unauthenticatedDb, 'patients', 'patient1')));
    });

    it('should not allow unauthenticated user to create patients', async () => {
      const unauthenticatedDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(setDoc(doc(unauthenticatedDb, 'patients', 'patient1'), {
        ownerUid: 'user1',
        firstName: 'John',
        lastName: 'Doe',
        status: 'active',
        createdAt: new Date(),
      }));
    });
  });
});
