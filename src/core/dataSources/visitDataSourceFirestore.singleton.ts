
import { VisitDataSourceFirestore } from './visitDataSourceFirestore';
import { db as sharedDb } from "@/lib/firebase";

export const visitDataSourceFirestore = new VisitDataSourceFirestore(sharedDb); 