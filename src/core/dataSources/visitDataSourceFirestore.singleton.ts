// @ts-nocheck
import { getFirestore } from 'firebase/firestore';

import { VisitDataSourceFirestore } from './visitDataSourceFirestore';

export const visitDataSourceFirestore = new VisitDataSourceFirestore(getFirestore()); 